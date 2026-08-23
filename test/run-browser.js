#!/usr/bin/env node
/* Runs test/selftest.html in a headless browser and fails on any FAIL line.

   The harness drives the real index.html inside an iframe — typing in fields,
   clicking boxes, importing files, following a share link — and prints its
   results into a <pre>, which this script reads back out of the dumped DOM.

   Usage: node test/run-browser.js [case …]
   With no arguments it runs every case. Set BROWSER to point at a binary, and
   BROWSER_LANG to run under a different locale. */
"use strict";

const { execFileSync, spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const http = require("http");

const root = path.resolve(__dirname, "..");
/* Every case, with the number of assertions it has to produce — run in this
   order, which is the insertion order of these keys.

   The number matters as much as the FAIL lines. A case that throws halfway
   does not report a failure: it just stops, and the run stays green while most
   of the case never ran. That is how eleven cases went quiet at once when a
   first visit stopped creating a sheet by itself — seven of them printed a
   single assertion and no complaint at all, and only the total gave it away.

   A floor, not an exact count: adding an assertion should stay easy, losing
   one silently should not. Raise the number in the same commit that adds
   assertions, so the floor keeps its teeth. */
const CASES = {
  basic: 34, quarantine: 11, share: 8, lang: 19, langpath: 7, print: 12,
  import: 13, lock: 20, lockconflict: 4, random: 20, randomspread: 3,
  appearance: 19, players: 23, migrate: 13, round: 12, roundlast: 8,
  roundspread: 3, rrs: 24, rrsdialog: 24, rrsprint: 18, rrspools: 14,
  rrsexpert: 13, expert: 10, mts: 15, mtsexpert: 10, mtsprint: 9,
};
const cases = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(CASES);
const PORT = Number(process.env.PORT || 8139);
/* The browser locale is pinned, because the app picks its language from
   navigator.language when nothing is stored. Leaving it to the machine made
   this suite pass on a German desktop and fail in CI, so the cases now pin the
   app language themselves and the browser runs under a fixed, deliberately
   non-German locale that would catch the assumption again. */
const LANG = process.env.BROWSER_LANG || "en-US";

/* Browsers that can be told to dump a rendered DOM. Chrome and Edge share the
   flag, so either will do; the first one found wins. */
function findBrowser() {
  if (process.env.BROWSER) return process.env.BROWSER;
  const candidates = [
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  for (const c of ["google-chrome", "chromium", "chrome"]) {
    try {
      execFileSync(process.platform === "win32" ? "where" : "which", [c],
        { stdio: "ignore" });
      return c;
    } catch (e) { /* keep looking */ }
  }
  return null;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".woff2": "font/woff2",
};

/* The app must be served over http: it uses localStorage and a same-origin
   iframe, and file:// gives each document its own opaque origin. */
function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split("?")[0].split("#")[0]).replace(/^\/+/, "");
      const file = path.join(root, rel || "index.html");
      if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404).end("not found");
        return;
      }
      res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(PORT, "127.0.0.1", () => resolve(server));
  });
}

function dumpDom(browser, url, profile) {
  return new Promise((resolve, reject) => {
    const args = [
      "--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
      "--disable-dev-shm-usage", "--user-data-dir=" + profile,
      "--lang=" + LANG, "--accept-lang=" + LANG,
      "--virtual-time-budget=25000", "--dump-dom", url,
    ];
    const child = spawn(browser, args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    child.stdout.on("data", (d) => { out += d; });
    child.on("error", reject);
    child.on("close", () => resolve(out));
  });
}

function decodeEntities(s) {
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
}

(async function main() {
  const browser = findBrowser();
  if (!browser) {
    console.error("No Chrome or Edge binary found. Set BROWSER=/path/to/chrome.");
    console.error("The browser self-test did NOT run — this is a skip, not a pass.");
    process.exit(2);
  }
  console.log("browser: " + browser + "   locale: " + LANG);
  const server = await serve();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mcclog-test-"));
  let failures = 0, total = 0;

  for (const name of cases) {
    const url = "http://127.0.0.1:" + PORT + "/test/selftest.html?case=" + name;
    const dom = await dumpDom(browser, url, path.join(tmp, "p_" + name));
    const m = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/);
    console.log("\n=== " + name + " ===");
    if (!m) {
      failures++;
      console.log("  no output — the harness never reported");
      if (process.env.GITHUB_ACTIONS) {
        console.log("::error title=" + name + "::the harness never reported");
      }
      continue;
    }
    const text = decodeEntities(m[1]).trim();
    console.log(text.split("\n").map((l) => "  " + l).join("\n"));
    let seen = 0;
    for (const line of text.split("\n")) {
      if (/^(FAIL|ERROR|REJECT|TIMEOUT)/.test(line)) {
        failures++;
        /* Also as a workflow command, so a red run says WHY on the CI
           summary. Without this the only signal in the UI is "exit code
           1", and the log itself needs admin rights on the repo. */
        if (process.env.GITHUB_ACTIONS) {
          console.log("::error title=" + name + "::" + line);
        }
      }
      if (/^(PASS|FAIL)/.test(line)) { total++; seen++; }
    }

    /* The case reported, so it is a real one and owes a floor. Without an entry
       there is nothing holding it to a size, which is the hole this closes. */
    const floor = CASES[name];
    let short = null;
    if (floor === undefined) {
      short = "no assertion floor on record — add it to CASES";
    } else if (seen < floor) {
      short = "only " + seen + " of at least " + floor +
        " assertions ran — the case stopped early";
    }
    if (short) {
      failures++;
      console.log("  " + short);
      if (process.env.GITHUB_ACTIONS) {
        console.log("::error title=" + name + "::" + short);
      }
    }
  }

  server.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log("\n" + total + " assertions, " + failures + " failure(s).");
  process.exit(failures === 0 ? 0 : 1);
})();

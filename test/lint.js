#!/usr/bin/env node
/* Checks that need no browser. Run with `node test/lint.js` from the repo root;
   CI runs the same file.

   These are possible only because i18n.js, widgets.js and every campaign's
   emptyState/normalize/migrate stay clear of the DOM — the scripts are loaded
   here through new Function("window", src) with a bare object as `window`. */
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
let failures = 0;

function check(name, ok, detail) {
  if (ok) {
    console.log("  ok    " + name);
  } else {
    failures++;
    console.log("  FAIL  " + name + (detail == null ? "" : "  -> " + detail));
  }
}
function section(title) { console.log("\n" + title); }
function read(rel) { return fs.readFileSync(path.join(root, rel), "utf8"); }
function eq(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

/* Load the plain scripts into one shared fake window, in the same order
   index.html does. */
const win = {};
const campaigns = [];
win.registerCampaign = function (def) { campaigns.push(def); };
const SCRIPTS = ["i18n.js", "widgets.js", "heroes.js"]
  .concat(fs.readdirSync(path.join(root, "campaigns")).sort()
    .filter((f) => f.endsWith(".js")).map((f) => "campaigns/" + f));
for (const rel of SCRIPTS) new Function("window", read(rel))(win);

// ---------------------------------------------------------------- dictionaries
section("Dictionaries");
/* A key present in one language only shows up as a blank label at runtime, in
   the language nobody is testing in. */
function comparePair(label, dicts) {
  const de = Object.keys(dicts.de).sort();
  const en = Object.keys(dicts.en).sort();
  check(label + ": same keys in de and en", eq(de, en),
    "only de: " + de.filter((k) => !en.includes(k)) +
    " | only en: " + en.filter((k) => !de.includes(k)));
  for (const lang of ["de", "en"]) {
    const empty = Object.keys(dicts[lang])
      .filter((k) => typeof dicts[lang][k] === "string" && !dicts[lang][k].trim());
    check(label + ": no empty " + lang + " values", empty.length === 0, empty.join(","));
  }
}
comparePair("shell", win.I18N);
for (const def of campaigns) comparePair(def.id, def.i18n);

/* Every key referenced from the code has to exist somewhere: the shell
   dictionary for core.js and widgets.js, the campaign's own plus the shell for
   a campaign module. */
section("i18n keys used in code exist");
const shellKeys = new Set(Object.keys(win.I18N.de));
const usedInShell = new Set();
for (const rel of ["core.js", "widgets.js"]) {
  for (const m of read(rel).matchAll(/\btr\(\)\.([A-Za-z]+)|\bd\.([A-Za-z]+)/g)) {
    usedInShell.add(m[1] || m[2]);
  }
}
const missingShell = [...usedInShell].filter((k) => !shellKeys.has(k));
check("core.js and widgets.js reference known keys", missingShell.length === 0, missingShell.join(","));

for (const def of campaigns) {
  const src = read("campaigns/" + def.id + ".js");
  const own = new Set(Object.keys(def.i18n.de));
  const used = [...src.matchAll(/\bt\("([A-Za-z]+)"/g)].map((m) => m[1]);
  const missing = [...new Set(used)].filter((k) => !own.has(k) && !shellKeys.has(k));
  check(def.id + ": every t() key resolves", missing.length === 0, missing.join(","));
  const html = read("index.html");
  const declared = [...html.matchAll(/data-i18n(?:-title|-placeholder|-aria)?="([A-Za-z]+)"/g)]
    .map((m) => m[1]);
  const unknown = [...new Set(declared)].filter((k) => !shellKeys.has(k));
  check("index.html data-i18n keys exist", unknown.length === 0, unknown.join(","));
}

// ------------------------------------------------------------------- campaigns
section("Campaign definitions");
const seenIds = new Set();
for (const def of campaigns) {
  const p = def.id + ": ";
  check(p + "id is a kebab-case slug", /^[a-z0-9]+(-[a-z0-9]+)*$/.test(def.id), def.id);
  check(p + "id is unique", !seenIds.has(def.id));
  seenIds.add(def.id);
  check(p + "has a product code", typeof def.code === "string" && def.code.length > 0);
  check(p + "titles present", !!def.titleEn && !!def.titleDe);
  check(p + "stateVersion is a positive integer",
    Number.isInteger(def.stateVersion) && def.stateVersion > 0, def.stateVersion);
  for (const fn of ["emptyState", "normalize", "render", "renderPrint"]) {
    check(p + fn + "() is a function", typeof def[fn] === "function");
  }
  check(p + "help text in both languages", !!def.helpDe && !!def.helpEn);
  /* migrate() is only optional while stateVersion is 1: from version 2 on
     there is an older shape in the wild that has to be carried forward. */
  check(p + "migrate() present once stateVersion > 1",
    def.stateVersion === 1 || typeof def.migrate === "function");
}

// ------------------------------------------------------- data round-trip
section("Data round-trip");
for (const def of campaigns) {
  const p = def.id + ": ";
  const empty = def.emptyState();
  check(p + "normalize({}) equals emptyState()", eq(def.normalize({}), empty));
  check(p + "normalize(undefined) equals emptyState()", eq(def.normalize(undefined), empty));
  check(p + "normalize(null) equals emptyState()", eq(def.normalize(null), empty));
  check(p + "normalize([]) equals emptyState()", eq(def.normalize([]), empty));
  check(p + "emptyState survives a JSON round-trip",
    eq(def.normalize(JSON.parse(JSON.stringify(empty))), empty));

  /* A deliberately filthy input: wrong types, unknown ids, out-of-range
     numbers, nulls and duplicate values in a column that must stay unique. */
  const dirty = {
    players: [{ hero: "  Daredevil  ", hp: "500" }, { hero: 7, hp: -2 },
              null, { hero: "x".repeat(500), hp: "nope" }, { hero: "fifth player" }],
    scenarios: [
      { slug: "the-getaway", completed: "true", villain: "electro", progress: "99" },
      { slug: "protection-racket", completed: 1, villain: "electro", progress: -3 },
      { slug: "does-not-exist", completed: true, villain: "bullseye", progress: 2 },
      { slug: "stop-the-presses", villain: "not-a-villain" },
      "not even an object",
    ],
    removed: ["  keep  ", "", null, "~struck", 42],
    flags: { trustEstablished: "true", maryDefeated: null, invented: true },
    somethingUnknown: { nested: [1, 2, 3] },
  };
  const once = def.normalize(dirty);
  const twice = def.normalize(once);
  check(p + "normalize is idempotent", eq(once, twice),
    JSON.stringify(once) + " vs " + JSON.stringify(twice));
  check(p + "normalized output has the shape of emptyState",
    eq(Object.keys(once).sort(), Object.keys(empty).sort()));
  check(p + "unknown top-level fields dropped", once.somethingUnknown === undefined);
  check(p + "normalize never throws on a string", (() => {
    try { def.normalize("garbage"); return true; } catch (e) { return false; }
  })());

  if (def.id === "fear-no-evil") {
    check(p + "row count fixed at 5", once.scenarios.length === 5);
    check(p + "unknown rows dropped",
      !once.scenarios.some((s) => s.slug === "does-not-exist"));
    check(p + "duplicate villain reduced to one",
      once.scenarios.filter((s) => s.villain === "electro").length === 1);
    check(p + "unknown villain cleared",
      once.scenarios.every((s) => s.villain === "" ||
        ["bullseye", "electro", "hammerhead", "purple-man", "typhoid-mary"].includes(s.villain)));
    check(p + "progress clamped to 0..3",
      once.scenarios.every((s) => Number.isInteger(s.progress) && s.progress >= 0 && s.progress <= 3),
      JSON.stringify(once.scenarios.map((s) => s.progress)));
    check(p + "player list capped at 4", once.players.length === 4, once.players.length);
    check(p + "an empty player list still yields one player",
      def.normalize({ players: [] }).players.length === 1);
    check(p + "a single player stays single",
      def.normalize({ players: [{ hero: "Echo" }] }).players.length === 1);
    check(p + "hp clamped and blanks stay null",
      once.players[0].hp === 99 && once.players[3].hp === null,
      JSON.stringify(once.players.map((x) => x.hp)));

    /* Version 1 always carried four player entries; version 2 carries only the
       players that exist. A stored sheet has to survive that. */
    const mig = (players) => def.normalize(def.migrate({ players }, 1)).players;
    const v1 = (heroes) => heroes.map((h) => ({ hero: h, hp: h ? 5 : null }));
    check(p + "migration trims a solo sheet to one player",
      mig(v1(["Daredevil", "", "", ""])).length === 1);
    check(p + "migration keeps both players of a duo",
      mig(v1(["Daredevil", "Echo", "", ""])).length === 2);
    check(p + "migration keeps a full table",
      mig(v1(["A", "B", "C", "D"])).length === 4);
    check(p + "migration keeps a gap between filled players",
      mig(v1(["A", "", "C", ""])).length === 3,
      JSON.stringify(mig(v1(["A", "", "C", ""]))));
    check(p + "migration never empties the sheet",
      mig(v1(["", "", "", ""])).length === 1);
    check(p + "migration keeps the hero names it carried",
      mig(v1(["Daredevil", "Echo", "", ""])).map((x) => x.hero).join(",") === "Daredevil,Echo");
    check(p + "migration is idempotent through normalize",
      eq(def.normalize(def.migrate({ players: v1(["A", "", "", ""]) }, 1)),
         def.normalize(def.normalize(def.migrate({ players: v1(["A", "", "", ""]) }, 1)))));
    check(p + "migrate leaves a current state alone",
      eq(def.normalize(def.migrate(JSON.parse(JSON.stringify(empty)), def.stateVersion)), empty));
    check(p + "flags are booleans",
      Object.values(once.flags).every((v) => typeof v === "boolean"));
    check(p + "list entries trimmed, blanks dropped",
      eq(once.removed, ["keep", "~struck", "42"]), JSON.stringify(once.removed));
  }
}

// ------------------------------------------------------------------- roster
section("Hero roster");
const heroes = win.HEROES || [];
check("roster is not empty", heroes.length > 0, heroes.length);
const slugs = heroes.map((h) => h.slug);
check("slugs are unique", new Set(slugs).size === slugs.length);
check("slugs are kebab-case",
  slugs.every((s) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s)),
  slugs.filter((s) => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s)).join(","));
check("every hero has an English name", heroes.every((h) => !!h.en));
check("health is a number or null",
  heroes.every((h) => h.health === null || Number.isInteger(h.health)),
  heroes.filter((h) => !(h.health === null || Number.isInteger(h.health))).map((h) => h.en).join(","));

// ------------------------------------------------------------------- packaging
section("Packaging");
const html = read("index.html");
/* GitHub Pages serves this from a subpath, and the page must also work from
   file://, so an absolute asset path would break both. */
const absolute = [...html.matchAll(/(?:src|href)="(\/[^"]*)"/g)].map((m) => m[1]);
check("no absolute asset paths in index.html", absolute.length === 0, absolute.join(","));
check("every script referenced by index.html exists",
  [...html.matchAll(/<script src="([^"]+)"/g)]
    .every((m) => fs.existsSync(path.join(root, m[1]))));
check("stylesheet exists", fs.existsSync(path.join(root, "styles.css")));
check(".nojekyll present", fs.existsSync(path.join(root, ".nojekyll")));
check("every font referenced by styles.css exists",
  [...read("styles.css").matchAll(/url\("(fonts\/[^"]+)"\)/g)]
    .every((m) => fs.existsSync(path.join(root, m[1]))));
check("font licence shipped alongside the fonts",
  fs.existsSync(path.join(root, "fonts/OFL.txt")));

console.log("\n" + (failures === 0
  ? "All checks passed."
  : failures + " check(s) failed."));
process.exit(failures === 0 ? 0 : 1);

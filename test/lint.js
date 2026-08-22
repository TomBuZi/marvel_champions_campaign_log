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

  if (def.id === "rise-of-red-skull") {
    /* The generic fixture above feeds `scenarios` and `flags`, which this sheet
       does not have. They must land nowhere. */
    check(p + "no scenarios key on this sheet", once.scenarios === undefined);
    check(p + "no flags key on this sheet", once.flags === undefined);
    /* The level is a real boolean, and standard is the default: a sheet that
       says nothing is not an expert campaign. */
    check(p + "the level defaults to standard", empty.expert === false);
    check(p + "the level is a real boolean", once.expert === false, once.expert);
    check(p + "a tolerant truthy level reads as expert",
      def.normalize({ expert: "true" }).expert === true);
    check(p + "player list capped at 4", once.players.length === 4, once.players.length);
    check(p + "an empty player list still yields one player",
      def.normalize({ players: [] }).players.length === 1);
    check(p + "list entries trimmed, blanks dropped",
      eq(once.removed, ["keep", "~struck", "42"]), JSON.stringify(once.removed));
    check(p + "the delay counter stays null when nothing said otherwise",
      once.delayCounters === null, once.delayCounters);

    /* Every card field on this sheet draws from a printed pool of four, so the
       fixture is about slugs that are wrong rather than text that is dirty. */
    const dirtyRrs = {
      players: [
        { hero: "  Captain America  ", hp: "500",
          obligations: ["martial-law", "not-a-card", "martial-law", 7, null],
          techUpgrade: "laser-cannon",
          basicUpgrade: "Combat Training",          // free text, not a slug
          rescuedAllies: ["white-tiger", "elektra", "nope"],
          engagedWithMinion: "true" },
        { hero: "Black Widow",
          obligations: ["martial-law"],             // same obligation: allowed
          techUpgrade: "laser-cannon",              // same upgrade: not allowed
          basicUpgrade: "basic-attack",
          rescuedAllies: ["elektra", "shang-chi"],  // Elektra already taken
          engagedWithMinion: 0 },
        "not even an object",
      ],
      expert: 1,
      experimentalWeapons: ["exo-suit", "laser-rifle", "exo-suit", "made-up"],
      delayCounters: -5,
      removed: 42,
      scenarios: [{ slug: "does-not-exist" }],
      flags: { invented: true },
      somethingUnknown: { nested: [1, 2, 3] },
    };
    const r1 = def.normalize(dirtyRrs);
    check(p + "MC10 fixture is idempotent", eq(r1, def.normalize(r1)), JSON.stringify(r1));
    check(p + "hero trimmed, hp clamped",
      r1.players[0].hero === "Captain America" && r1.players[0].hp === 99);

    /* Unknown slugs out, duplicates out, and the survivors in the pool's own
       order — that ordering is what makes normalize a fixpoint. */
    check(p + "obligations reduced to known cards",
      eq(r1.players[0].obligations, ["martial-law"]),
      JSON.stringify(r1.players[0].obligations));
    check(p + "two players may hold the SAME obligation",
      r1.players[0].obligations.indexOf("martial-law") !== -1 &&
      r1.players[1].obligations.indexOf("martial-law") !== -1);
    check(p + "an unknown upgrade slug is cleared",
      r1.players[0].basicUpgrade === "", r1.players[0].basicUpgrade);
    check(p + "the same upgrade cannot go to two players",
      r1.players[0].techUpgrade === "laser-cannon" && r1.players[1].techUpgrade === "",
      JSON.stringify([r1.players[0].techUpgrade, r1.players[1].techUpgrade]));
    check(p + "an upgrade the first player does not hold is left alone",
      r1.players[1].basicUpgrade === "basic-attack", r1.players[1].basicUpgrade);
    check(p + "rescued allies come back in pool order",
      eq(r1.players[0].rescuedAllies, ["elektra", "white-tiger"]),
      JSON.stringify(r1.players[0].rescuedAllies));
    check(p + "an ally already rescued by someone else is dropped",
      eq(r1.players[1].rescuedAllies, ["shang-chi"]),
      JSON.stringify(r1.players[1].rescuedAllies));
    check(p + "but a player may hold several allies",
      r1.players[0].rescuedAllies.length === 2);
    check(p + "engaged flag is a real boolean",
      r1.players[0].engagedWithMinion === true &&
      r1.players[1].engagedWithMinion === false &&
      r1.players[2].engagedWithMinion === false);
    check(p + "experimental weapons deduped and in pool order",
      eq(r1.experimentalWeapons, ["laser-rifle", "exo-suit"]),
      JSON.stringify(r1.experimentalWeapons));
    check(p + "the delay counter is clamped", r1.delayCounters === 0, r1.delayCounters);
    check(p + "the level survives as a boolean", r1.expert === true, r1.expert);
    /* Hiding is not clearing: the expert-only fields have to survive a sheet
       that is currently standard, or toggling by accident would cost data. */
    const standard = def.normalize({
      expert: false,
      players: [{ hero: "Echo", hp: 7, obligations: ["martial-law"] }],
    });
    check(p + "a standard sheet keeps its hidden hit points",
      standard.players[0].hp === 7, standard.players[0].hp);
    check(p + "a standard sheet keeps its hidden obligations",
      eq(standard.players[0].obligations, ["martial-law"]),
      JSON.stringify(standard.players[0].obligations));
    /* Neither an array nor a string, so there is nothing to read as a list —
       an empty one is the honest answer. */
    check(p + "a bare number yields no list at all", eq(r1.removed, []),
      JSON.stringify(r1.removed));

    /* This sheet has no free-text notes, so an arriving one has nowhere to go. */
    check(p + "a notes field is not part of this sheet",
      def.normalize({ notes: "anything" }).notes === undefined);
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

/* The other direction, and the one that was missing: lint discovers the
   campaigns by reading the directory, the browser only ever runs what
   index.html names. Without this a new campaign passes every check above and
   still never loads on the page. */
for (const def of campaigns) {
  check("index.html loads campaigns/" + def.id + ".js",
    html.includes('<script src="campaigns/' + def.id + '.js"'));
}
check("stylesheet exists", fs.existsSync(path.join(root, "styles.css")));

/* applyLanguage() (core.js) translates by writing node.textContent, so a
   data-i18n on an element that CONTAINS other elements deletes them. That is
   how the new-log dialog lost its title input — silently, because the dialog
   only becomes reachable once a second campaign is registered. The caption
   belongs in a <span> of its own.

   Walked by hand rather than matched with a regexp: the pattern needs a
   backreference to the tag name, and that is easy to get subtly wrong here. */
const MARKER = 'data-i18n="';
const i18nWithChildren = [];
for (let i = html.indexOf(MARKER); i !== -1; i = html.indexOf(MARKER, i + 1)) {
  const keyStart = i + MARKER.length;
  const key = html.slice(keyStart, html.indexOf('"', keyStart));
  let j = html.lastIndexOf("<", i) + 1;
  let name = "";
  /* Everything up to the first whitespace, ">" or "/" is the tag name. */
  while (j < html.length && html[j] > " " && html[j] !== ">" && html[j] !== "/") {
    name += html[j];
    j++;
  }
  const openEnd = html.indexOf(">", i);
  const closeAt = html.indexOf("</" + name, openEnd);
  if (openEnd === -1 || closeAt === -1) continue;         // void element, nothing to lose
  if (html.slice(openEnd + 1, closeAt).indexOf("<") !== -1) {
    i18nWithChildren.push(name + "[" + key + "]");
  }
}
check("no data-i18n on an element with child elements",
  i18nWithChildren.length === 0, i18nWithChildren.join(", "));

/* /de/ and /en/ are pretty entry points: a real directory per language, because
   GitHub Pages cannot rewrite paths. Each one only forwards to index.html with
   ?lang=<code> — a stub that ever grew a <script src> or a stylesheet would be
   a second copy of the app shell, and the two would drift apart. */
for (const code of ["de", "en"]) {
  const rel = code + "/index.html";
  const p = "language entry point /" + code + "/: ";
  if (!fs.existsSync(path.join(root, rel))) {
    check(p + "exists", false, rel);
    continue;
  }
  const stub = read(rel);
  check(p + "exists", true);
  check(p + "forwards to the app with ?lang=" + code,
    stub.includes("../index.html?lang=" + code));
  check(p + "carries no copy of the app", !/<script src=|<link rel="stylesheet"/.test(stub));
  const abs = [...stub.matchAll(/(?:src|href)="(\/[^"]*)"/g)].map((m) => m[1]);
  check(p + "no absolute paths", abs.length === 0, abs.join(","));
}
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

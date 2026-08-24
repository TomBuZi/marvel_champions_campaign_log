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
/* Display names in a campaign's own tables — scenario names, card pools —
   carry an `en` and a `de`. A `de` of null means "no German name on record"
   and the English one is shown instead; an EMPTY string means exactly the
   same thing while LOOKING like a filled-in translation, so it is almost
   certainly a slip. This is source-level on purpose: those tables are
   private to their module, and exporting them just to test them would be
   the tail wagging the dog. */
section("Display names");
for (const def of campaigns) {
  const src = read("campaigns/" + def.id + ".js");
  const empties = [...src.matchAll(/^.*\bde:\s*(""|'')/gm)]
    .map((m) => m[0].trim());
  check(def.id + ": no empty de in a name table",
    empties.length === 0, empties.join(" | "));
}

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
    /* The level is a real boolean, and standard is the default: a sheet that
       says nothing is not an expert campaign. */
    check(p + "the level defaults to standard", empty.expert === false);
    check(p + "a tolerant truthy level reads as expert",
      def.normalize({ expert: 1 }).expert === true);
    /* Hiding is not clearing: the hit points have to survive a sheet that is
       currently standard, or toggling by accident would cost data. */
    check(p + "a standard sheet keeps its hidden hit points",
      def.normalize({ expert: false, players: [{ hero: "Echo", hp: 7 }] })
        .players[0].hp === 7);
    /* Version 3 added the flag. An older sheet that records hit points was an
       expert game — reading it as standard would hide numbers its owner had
       entered — while one that never recorded any is a standard game. */
    check(p + "a version 2 sheet with hit points migrates to expert level",
      def.normalize(def.migrate({ players: [{ hero: "Echo", hp: 7 }] }, 2)).expert === true);
    check(p + "a version 2 sheet without hit points stays standard",
      def.normalize(def.migrate({ players: [{ hero: "Echo", hp: null }] }, 2)).expert === false);
    /* Zero is a recorded value: a hero downed at the end of a scenario. */
    check(p + "a recorded zero counts as recorded",
      def.normalize(def.migrate({ players: [{ hero: "Echo", hp: 0 }] }, 2)).expert === true);
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

  if (def.id === "mad-titans-shadow") {
    /* The generic fixture feeds `scenarios` and `removed`, which this sheet does
       not have, and MC60's flag names, which are not boxes on it. None of it may
       land. */
    check(p + "no scenarios key on this sheet", once.scenarios === undefined);
    check(p + "no removed key on this sheet", once.removed === undefined);
    check(p + "a notes field is not part of this sheet",
      def.normalize({ notes: "anything" }).notes === undefined);

    /* The level is a real boolean, and standard is the default: a sheet that
       says nothing is not an expert campaign. */
    check(p + "the level defaults to standard", empty.expert === false);
    check(p + "a tolerant truthy level reads as expert",
      def.normalize({ expert: "true" }).expert === true);
    /* Hiding is not clearing: the hit points have to survive a sheet that is
       currently standard, or toggling by accident would cost data. */
    check(p + "a standard sheet keeps its hidden hit points",
      def.normalize({ expert: false, players: [{ hero: "Gamora", hp: 6 }] })
        .players[0].hp === 6);

    check(p + "player list capped at 4", once.players.length === 4, once.players.length);
    check(p + "an empty player list still yields one player",
      def.normalize({ players: [] }).players.length === 1);
    /* The leanest player card of the three: a name and a number, nothing else. */
    check(p + "a player carries nothing but a hero and hit points",
      eq(Object.keys(once.players[0]).sort(), ["hero", "hp"]),
      JSON.stringify(Object.keys(once.players[0])));

    /* Nine boxes, every one present as a real boolean. A missing key would read
       as unticked on screen and then be written back on the next save, which is
       how a box silently disappears from a stored sheet. */
    const NINE = ["blackSwan", "cosmo", "infinityStones1B", "nornStone", "odin",
                  "securityBreach", "shawarma", "systemShock", "towerDamaged"];
    check(p + "all nine boxes exist",
      eq(Object.keys(empty.flags).sort(), NINE),
      JSON.stringify(Object.keys(empty.flags)));
    check(p + "they start unticked",
      Object.values(empty.flags).every((v) => v === false));
    check(p + "they survive a dirty read as booleans",
      Object.keys(once.flags).length === 9 &&
      Object.values(once.flags).every((v) => typeof v === "boolean"),
      JSON.stringify(once.flags));
    check(p + "a foreign flag is dropped", once.flags.trustEstablished === undefined);

    const ticked = def.normalize({ flags: { cosmo: 1, odin: "true", invented: true } });
    /* The tolerance coerceBool() documents, and only that: 1 and "true" are
       what hand-edited JSON and older exports carry, "yes" is not. */
    check(p + "a tolerant truthy box reads as ticked",
      ticked.flags.cosmo === true && ticked.flags.odin === true);
    check(p + "but an unrecognised truthy value is not a tick",
      def.normalize({ flags: { cosmo: "yes" } }).flags.cosmo === false);
    check(p + "an invented box is dropped", ticked.flags.invented === undefined);
    check(p + "and the boxes nobody touched stay unticked",
      ticked.flags.shawarma === false && ticked.flags.towerDamaged === false);
  }

  if (def.id === "sinister-motives") {
    /* The generic fixture feeds MC60's `scenarios`, `removed` and `flags`, none
       of which is a field on this sheet. None of it may land. */
    check(p + "no scenarios key on this sheet", once.scenarios === undefined);
    check(p + "no removed key on this sheet", once.removed === undefined);
    check(p + "no flags key on this sheet", once.flags === undefined);
    check(p + "a notes field is not part of this sheet",
      def.normalize({ notes: "anything" }).notes === undefined);

    /* The level is a real boolean, and standard is the default: a sheet that
       says nothing is not an expert campaign. */
    check(p + "the level defaults to standard", empty.expert === false);
    check(p + "a tolerant truthy level reads as expert",
      def.normalize({ expert: "true" }).expert === true);
    /* Hiding is not clearing: the hit points have to survive a sheet that is
       currently standard, or toggling by accident would cost data. */
    check(p + "a standard sheet keeps its hidden hit points",
      def.normalize({ expert: false, players: [{ hero: "Ghost-Spider", hp: 6 }] })
        .players[0].hp === 6);

    check(p + "player list capped at 4", once.players.length === 4, once.players.length);
    check(p + "an empty player list still yields one player",
      def.normalize({ players: [] }).players.length === 1);
    /* The three "Reputation Track Reward" sections live on the player, so the
       key set says so — a parallel list would let a removed player shift the
       entries out from under the names. */
    check(p + "a player carries the identity, the hit points and three rewards",
      eq(Object.keys(once.players[0]).sort(),
        ["aspectAdvantage", "hero", "hp", "planningAhead", "shieldTech"]),
      JSON.stringify(Object.keys(once.players[0])));
    check(p + "hero trimmed, hp clamped",
      once.players[0].hero === "Daredevil" && once.players[0].hp === 99,
      once.players[0].hero + "/" + once.players[0].hp);
    check(p + "a blank hit point field stays null",
      def.normalize({ players: [{ hp: "" }] }).players[0].hp === null);

    /* The reputation is the only state here that page 2 does not print, and
       everything the panel says about what is unlocked is derived from it — so
       an out-of-range number must be pulled back onto the track, not stored. */
    check(p + "the reputation starts blank", empty.reputation === null);
    check(p + "a blank reputation stays null",
      def.normalize({ reputation: "" }).reputation === null);
    check(p + "the reputation is clamped to the length of the track",
      def.normalize({ reputation: "99" }).reputation === 35 &&
      def.normalize({ reputation: -3 }).reputation === 0,
      JSON.stringify([def.normalize({ reputation: "99" }).reputation,
        def.normalize({ reputation: -3 }).reputation]));
    check(p + "an unreadable reputation reads as blank, not as zero",
      def.normalize({ reputation: "nope" }).reputation === null);
    /* The final score is a place on the track and shares its range; Waking
       Nightmare is a scenario tally and does not, so a value above the track's
       length has to survive there and be pulled back here. */
    check(p + "the final score is bounded by the track",
      def.normalize({ finalScore: 999 }).finalScore === 35 &&
      def.normalize({ finalScore: -1 }).finalScore === 0);
    check(p + "but Waking Nightmare is not",
      def.normalize({ wakingNightmare: 40 }).wakingNightmare === 40 &&
      def.normalize({ wakingNightmare: 999 }).wakingNightmare === 99,
      JSON.stringify([def.normalize({ wakingNightmare: 40 }).wakingNightmare,
        def.normalize({ wakingNightmare: 999 }).wakingNightmare]));

    /* Two of the three named card sections ask WHICH cards, so they are sets
       and start out as nothing at all. Osborn Tech asks which card came in on
       which rung, so it keeps one cell per rung — three of them, and that
       number is derived in the module from the rungs that take a card, not
       written down a second time. A missing cell would read as empty on screen
       and then be written back on the next save, which is how a cell silently
       disappears from a stored sheet. */
    check(p + "the two sets start out as nothing at all",
      eq(empty.communityService, []) && eq(empty.lastOnesStanding, []),
      JSON.stringify([empty.communityService, empty.lastOnesStanding]));
    check(p + "Osborn Tech has one cell per rung that takes a card",
      empty.osbornTech.length === 3, empty.osbornTech.length);
    check(p + "and its cells start empty",
      empty.osbornTech.every((v) => v === ""));

    /* A fixture of the sheet's own fields: unknown slugs, repeats within a
       section, a repeat across two players, a too-long list and a too-short
       one. The generic fixture above touches none of these. */
    const dirtySm = {
      players: [
        { hero: "Ghost-Spider", hp: "500", shieldTech: "laser-goggles",
          aspectAdvantage: "  Enhanced Reflexes  ",
          planningAhead: "y".repeat(500) },
        { hero: "Spider-Man", shieldTech: "laser-goggles",   // already taken
          aspectAdvantage: 7, planningAhead: null },
        { hero: "Venom", shieldTech: "not-a-card" },
        "not even an object",
      ],
      expert: 1,
      reputation: 13,
      /* An unknown slug, a repeat, and a value that is not a string at all —
         and deliberately in the wrong order, because a set comes back in the
         pool's order rather than the order it arrived in. */
      communityService: ["cat-in-a-tree", "made-up", "cat-in-a-tree",
                         "off-the-rails", "rubble-rescue"],
      wakingNightmare: "4",
      lastOnesStanding: ["vulture", 7, "electro"],
      finalScore: "28",
      osbornTech: ["tracking-display", "arm-cannon", "tracking-display"],
      scenarios: [{ slug: "does-not-exist" }],
      flags: { invented: true },
      somethingUnknown: { nested: [1, 2, 3] },
    };
    const m1 = def.normalize(dirtySm);
    check(p + "MC27 fixture is idempotent", eq(m1, def.normalize(m1)), JSON.stringify(m1));

    /* The two sets: unknown slugs out, duplicates out, and the survivors in
       the pool's own order — that ordering is what makes normalize a fixpoint.
       A blank in the input is simply not a slug, which is also why a sheet
       stored in the older cell shape reads correctly here. */
    check(p + "a set drops what it does not know and keeps pool order",
      eq(m1.communityService, ["cat-in-a-tree", "off-the-rails", "rubble-rescue"]),
      JSON.stringify(m1.communityService));
    check(p + "a card ticked twice is one entry",
      m1.communityService.filter((s) => s === "cat-in-a-tree").length === 1);
    check(p + "the second set behaves the same way",
      eq(m1.lastOnesStanding, ["electro", "vulture"]),
      JSON.stringify(m1.lastOnesStanding));

    /* Osborn Tech is the one that stays cells: the position says which rung the
       card came in on, so the row is NOT reordered — an unknown slug and a
       repeat empty their own cell and leave the rest where they were. */
    check(p + "an unknown Osborn Tech slug empties its cell, not the row",
      eq(def.normalize({ osbornTech: ["made-up", "arm-cannon"] }).osbornTech,
        ["", "arm-cannon", ""]),
      JSON.stringify(def.normalize({ osbornTech: ["made-up", "arm-cannon"] }).osbornTech));
    check(p + "a row longer than the sheet is cut to the printed cells",
      def.normalize({ osbornTech: ["arm-cannon", "ionic-boots", "kinetic-armor",
        "spiked-gauntlet"] }).osbornTech.length === 3);
    check(p + "a card recorded twice keeps only its first cell",
      eq(m1.osbornTech, ["tracking-display", "arm-cannon", ""]),
      JSON.stringify(m1.osbornTech));

    check(p + "the reputation and both scores survive the fixture",
      m1.reputation === 13 && m1.wakingNightmare === 4 && m1.finalScore === 28,
      JSON.stringify([m1.reputation, m1.wakingNightmare, m1.finalScore]));

    /* Each S.H.I.E.L.D. Tech upgrade exists once in the campaign. */
    check(p + "the same upgrade cannot go to two players",
      m1.players[0].shieldTech === "laser-goggles" && m1.players[1].shieldTech === "",
      JSON.stringify([m1.players[0].shieldTech, m1.players[1].shieldTech]));
    check(p + "an unknown upgrade slug is cleared",
      m1.players[2].shieldTech === "", m1.players[2].shieldTech);
    /* Free text, because the card comes from the player's own collection or
       deck — trimmed and capped like every other name field here. */
    check(p + "the free-text rewards are trimmed and capped",
      m1.players[0].aspectAdvantage === "Enhanced Reflexes" &&
      m1.players[0].planningAhead.length === 60,
      m1.players[0].aspectAdvantage + "/" + m1.players[0].planningAhead.length);
    /* Same tolerance every text field on every sheet has: a null is nothing,
       a number is its digits. Asserted here so a change to coerceText() shows
       up as a failing expectation rather than as quietly different data. */
    check(p + "a free-text reward tolerates a null and a number alike",
      m1.players[1].planningAhead === "" && m1.players[1].aspectAdvantage === "7",
      JSON.stringify([m1.players[1].aspectAdvantage, m1.players[1].planningAhead]));
  }

  if (def.id === "mutant-genesis") {
    /* The generic fixture feeds MC60's `scenarios`, MC21's `flags` and MC10's
       `removed`, none of which is a field on this sheet. None of it may land. */
    check(p + "no scenarios key on this sheet", once.scenarios === undefined);
    check(p + "no flags key on this sheet", once.flags === undefined);
    check(p + "no removed key on this sheet", once.removed === undefined);
    check(p + "a notes field is not part of this sheet",
      def.normalize({ notes: "anything" }).notes === undefined);

    /* The level is a real boolean, and standard is the default: a sheet that
       says nothing is not an expert campaign. */
    check(p + "the level defaults to standard", empty.expert === false);
    check(p + "a tolerant truthy level reads as expert",
      def.normalize({ expert: "true" }).expert === true);
    /* Hiding is not clearing: the hit points are the only field the sheet marks
       "(expert)", so they have to survive a sheet that is currently standard.
       They are still in the JSON export and in a share link. */
    check(p + "a standard sheet keeps its hidden hit points",
      def.normalize({ expert: false, players: [{ hero: "Colossus", hp: 9 }] })
        .players[0].hp === 9);

    check(p + "player list capped at 4", once.players.length === 4, once.players.length);
    check(p + "an empty player list still yields one player",
      def.normalize({ players: [] }).players.length === 1);
    check(p + "hero trimmed, hp clamped",
      once.players[0].hero === "Daredevil" && once.players[0].hp === 99,
      once.players[0].hero + "/" + once.players[0].hp);
    check(p + "a blank hit point field stays null",
      def.normalize({ players: [{ hp: "" }] }).players[0].hp === null);
    /* The role and its marks live ON the player, so the key set says so: a
       parallel list keyed by index would shift every column up onto the wrong
       hero the moment a player is removed. */
    check(p + "a player carries the identity, the hit points, the role and its marks",
      eq(Object.keys(once.players[0]).sort(), ["hero", "hp", "role", "upgrades"]),
      JSON.stringify(Object.keys(once.players[0])));

    /* The twenty role upgrades by SLUG, not by label. Deliberate: CLAUDE.md
       warns against nailing an assertion to anything transient, and the slugs
       are the opposite of transient — they are the persisted keys, and this
       whole module rests on labels changing while keys do not. Pinning the
       labels would decay the moment the German printing is entered; pinning the
       slugs catches a role losing an upgrade, a slug being renamed, and a
       dropped role prefix, which would silently merge the four titles that
       appear under two roles. */
    const MG_ROLES = ["brawler", "commander", "defender", "peacekeeper"];
    const MG_UPGRADES = [
      "brawler-coup-de-grace", "brawler-swagger", "brawler-brazen-defense",
      "brawler-ferocious-attack", "brawler-war-cry",
      "commander-coup-de-grace", "commander-compassion", "commander-group-assault",
      "commander-shock-and-awe", "commander-improvisation",
      "defender-swagger", "defender-surprise", "defender-heroic-intervention",
      "defender-determined-defense", "defender-bodyguard",
      "peacekeeper-surprise", "peacekeeper-compassion", "peacekeeper-rescue-operation",
      "peacekeeper-mentorship", "peacekeeper-fortitude",
    ];
    /* One assertion pinning the exact set, the canonical order AND the
       unknown-slug drop at once — the input arrives reversed and salted. */
    check(p + "all twenty role upgrades are known, in table order",
      eq(def.normalize({ players: [{ upgrades:
        MG_UPGRADES.slice().reverse().concat(["made-up", 7, null]) }] })
        .players[0].upgrades, MG_UPGRADES));
    /* Five per role — the number the sheet does not print. It is trustworthy
       because three readings agree, and two of them are checkable here: the
       size of each role's set, and one grant at scenario 1 plus one for each
       printed side-scheme box. */
    check(p + "and exactly five per role",
      MG_ROLES.every((r) =>
        MG_UPGRADES.filter((s) => s.indexOf(r + "-") === 0).length === 5));
    check(p + "which is what the campaign can grant",
      1 + def.normalize({ sideSchemes: ["frightened-police", "enemy-of-my-enemy",
        "find-the-prisoners", "surprise-attack"] }).sideSchemes.length === 5);
    /* The four titles that appear under two roles are two different cards. */
    check(p + "the same title under two roles is two entries",
      def.normalize({ players: [{ upgrades:
        ["brawler-coup-de-grace", "commander-coup-de-grace"] }] })
        .players[0].upgrades.length === 2);

    /* THE regression test for the derived state: the role decides what is
       SHOWN, never what is stored. A mis-clicked dropdown must not cost five
       marks, and "each player must choose a different role" makes a swap — which
       has to pass through a moment with no role at all — a normal move. */
    check(p + "a mark outside the current role survives",
      eq(def.normalize({ players: [{ role: "commander",
        upgrades: ["brawler-war-cry"] }] }).players[0].upgrades,
        ["brawler-war-cry"]));
    check(p + "and so does one with no role at all",
      eq(def.normalize({ players: [{ role: "", upgrades: ["brawler-war-cry"] }] })
        .players[0].upgrades, ["brawler-war-cry"]));
    const badRole = def.normalize({ players: [{ role: "tank",
      upgrades: ["brawler-war-cry"] }] });
    check(p + "an unknown role is cleared without touching the marks",
      badRole.players[0].role === "" && badRole.players[0].upgrades.length === 1,
      JSON.stringify(badRole.players[0]));
    /* Each player a different role — and whoever loses that contest keeps their
       marks, or the mere order of an import would decide whose five survive. */
    const dupRole = def.normalize({ players: [
      { role: "brawler", upgrades: ["brawler-war-cry"] },
      { role: "brawler", upgrades: ["brawler-swagger"] }] });
    check(p + "two players cannot hold the same role",
      dupRole.players[0].role === "brawler" && dupRole.players[1].role === "",
      JSON.stringify([dupRole.players[0].role, dupRole.players[1].role]));
    check(p + "but the player who lost the role keeps their marks",
      eq(dupRole.players[1].upgrades, ["brawler-swagger"]));

    /* The two Future Past sections are shaped by what the sheet prints: no
       columns above, four columns below. */
    check(p + "the victory display is one set, not a grid",
      Array.isArray(empty.futurePastVictory) && eq(empty.futurePastVictory, []));
    check(p + "the deck grid always has the four printed columns",
      def.normalize({ futurePastDeck: [["nimrod"]] }).futurePastDeck.length === 4 &&
      def.normalize({ futurePastDeck: [[], [], [], [], ["nimrod"]] })
        .futurePastDeck.length === 4);
    check(p + "and its columns start empty",
      empty.futurePastDeck.every((col) => Array.isArray(col) && col.length === 0));
    /* No cross-column uniqueness, unlike MC27's Osborn Tech cells: a card
       recorded after scenario 1 is shuffled back into the encounter deck at
       scenario 2's setup, so deduplicating across columns would delete the
       campaign's normal case. */
    check(p + "the same card may stand in two scenarios' columns",
      eq(def.normalize({ futurePastDeck: [["nimrod"], ["nimrod"], [], []] }).futurePastDeck,
        [["nimrod"], ["nimrod"], [], []]));
    /* Within a column it is a set in pool order — that ordering is what makes
       normalize() a fixpoint — while the ROW is never sorted, because column 3
       means scenario 3. */
    check(p + "a column drops what it does not know and keeps pool order",
      eq(def.normalize({ futurePastDeck: [["nano-sentinel-tech", "made-up",
        "bastion", "bastion"]] }).futurePastDeck[0],
        ["bastion", "nano-sentinel-tech"]));
    check(p + "a card in column 3 stays in column 3",
      eq(def.normalize({ futurePastDeck: [[], [], ["nimrod"], []] }).futurePastDeck,
        [[], [], ["nimrod"], []]));

    /* Jubilee: the boxes the sheet prints and no others — one for scenario 2,
       two each for scenarios 3 and 4. */
    const MG_JUBILEE = ["s2InPlay", "s3InPlay", "s3Removed", "s4InPlay", "s4Removed"];
    check(p + "all five printed Jubilee boxes exist as real booleans",
      eq(Object.keys(empty.jubilee).sort(), MG_JUBILEE.slice().sort()) &&
      MG_JUBILEE.every((k) => empty.jubilee[k] === false),
      JSON.stringify(empty.jubilee));
    check(p + "an invented Jubilee box is dropped",
      def.normalize({ jubilee: { s5InPlay: true } }).jubilee.s5InPlay === undefined);
    /* The two boxes of a scenario are read independently: a sheet that
       contradicts itself keeps both, because which one was meant is not ours to
       guess and picking a winner would destroy the other. The lock on screen is
       one-sided for the same reason. */
    const bothJub = def.normalize({ jubilee: { s3InPlay: 1, s3Removed: "true" } });
    check(p + "a contradicting sheet keeps both boxes",
      bothJub.jubilee.s3InPlay === true && bothJub.jubilee.s3Removed === true);

    /* A fixture of the sheet's own fields: unknown slugs, repeats within a
       section, a role taken twice, a grid too long and a column that is not a
       list at all, and marks belonging to two different roles on one player. */
    const dirtyMg = {
      players: [
        { hero: "  Colossus  ", hp: "500", role: "brawler",
          upgrades: ["brawler-war-cry", "made-up", "brawler-war-cry",
                     "defender-bodyguard", "brawler-coup-de-grace"] },
        { hero: "Shadowcat", role: "brawler", upgrades: "not a list" },  // role taken
        { hero: "x".repeat(500), role: 7, upgrades: [null, 42] },
        "not even an object",
      ],
      expert: 1,
      sideSchemes: ["surprise-attack", "made-up", "surprise-attack", "frightened-police"],
      futurePastVictory: ["nano-sentinel-tech", "nimrod", "nimrod"],
      futurePastDeck: [["bastion", "bastion"], "not a list", ["made-up"], [], ["nimrod"]],
      jubilee: { s2InPlay: "true", s4Removed: 1, invented: true },
      captiveAllies: ["wolfsbane", 7, "rictor"],
      removedAllies: ["  keep  ", "", null, "~struck", 42],
      scenarios: [{ slug: "does-not-exist" }],
      flags: { invented: true },
      somethingUnknown: { nested: [1, 2, 3] },
    };
    const g1 = def.normalize(dirtyMg);
    check(p + "MC32 fixture is idempotent", eq(g1, def.normalize(g1)), JSON.stringify(g1));
    check(p + "a set drops what it does not know and keeps pool order",
      eq(g1.sideSchemes, ["frightened-police", "surprise-attack"]) &&
      eq(g1.futurePastVictory, ["nimrod", "nano-sentinel-tech"]) &&
      eq(g1.captiveAllies, ["rictor", "wolfsbane"]),
      JSON.stringify([g1.sideSchemes, g1.futurePastVictory, g1.captiveAllies]));
    check(p + "a card ticked twice is one entry",
      g1.futurePastDeck[0].length === 1 && g1.futurePastVictory.length === 2);
    check(p + "a column that is not a list reads as empty, and the row keeps its length",
      eq(g1.futurePastDeck, [["bastion"], [], [], []]),
      JSON.stringify(g1.futurePastDeck));
    check(p + "the fixture's marks survive across two roles",
      eq(g1.players[0].upgrades,
        ["brawler-coup-de-grace", "brawler-war-cry", "defender-bodyguard"]),
      JSON.stringify(g1.players[0].upgrades));
    check(p + "an unusable upgrade list is simply no marks",
      eq(g1.players[1].upgrades, []) && eq(g1.players[2].upgrades, []));
    check(p + "a role held twice is cleared on the later player",
      g1.players[0].role === "brawler" && g1.players[1].role === "" &&
      g1.players[2].role === "",
      JSON.stringify([g1.players[0].role, g1.players[1].role, g1.players[2].role]));
    /* Free text, because these allies come out of the players' own decks —
       trimmed, blanks dropped, and a "~" kept because it is the strike marker. */
    check(p + "the free-text ally list is trimmed and blanks dropped",
      eq(g1.removedAllies, ["keep", "~struck", "42"]),
      JSON.stringify(g1.removedAllies));
  }

  if (def.id === "next-evolution") {
    /* The generic fixture feeds MC60's `scenarios`, MC21's `flags` and MC10's
       `removed`, none of which is a field on this sheet. None of it may land. */
    check(p + "no scenarios key on this sheet", once.scenarios === undefined);
    check(p + "no flags key on this sheet", once.flags === undefined);
    check(p + "no removed key on this sheet", once.removed === undefined);
    check(p + "a notes field is not part of this sheet",
      def.normalize({ notes: "anything" }).notes === undefined);

    /* The level is a real boolean, and standard is the default: a sheet that
       says nothing is not an expert campaign. */
    check(p + "the level defaults to standard", empty.expert === false);
    check(p + "a tolerant truthy level reads as expert",
      def.normalize({ expert: "true" }).expert === true);
    /* Hiding is not clearing. This sheet does NOT print "(expert)" next to the
       hit points the way MC32's does — the rulebook is what records them at
       expert level only — so the gate is easy to mistake for a bug and this is
       the assertion that says it is not. */
    check(p + "a standard sheet keeps its hidden hit points",
      def.normalize({ expert: false, players: [{ hero: "Cable", hp: 9 }] })
        .players[0].hp === 9);

    check(p + "player list capped at 4", once.players.length === 4, once.players.length);
    check(p + "an empty player list still yields one player",
      def.normalize({ players: [] }).players.length === 1);
    check(p + "hero trimmed, hp clamped",
      once.players[0].hero === "Daredevil" && once.players[0].hp === 99,
      once.players[0].hero + "/" + once.players[0].hp);
    check(p + "a blank hit point field stays null",
      def.normalize({ players: [{ hp: "" }] }).players[0].hp === null);
    /* Nothing else hangs off a player here: no role, no upgrades, no
       obligations. The sheet prints an identity and a number per player. */
    check(p + "a player carries the identity and the hit points, nothing else",
      eq(Object.keys(once.players[0]).sort(), ["hero", "hp"]),
      JSON.stringify(Object.keys(once.players[0])));

    /* The seven Marauder villains by SLUG, not by label: the slugs are the
       persisted keys and the labels are still to be translated. Pinning the set
       catches a villain going missing and a slug being renamed. */
    const NE_MARAUDERS = ["arclight", "blockbuster", "chimera", "greycrow",
      "harpoon", "riptide", "vertigo"];
    check(p + "the marauder row is always three slots",
      eq(empty.marauders, ["", "", ""]) &&
      def.normalize({ marauders: ["greycrow"] }).marauders.length === 3 &&
      def.normalize({ marauders: NE_MARAUDERS }).marauders.length === 3,
      JSON.stringify(def.normalize({ marauders: ["greycrow"] }).marauders));
    /* Three, and the two readings that agree on it: the sheet prints three
       numbered lines, and scenario #1 is won by defeating three of the seven. */
    check(p + "out of seven printed villains", NE_MARAUDERS.length === 7);
    /* The row is NEVER sorted — line 2 means the second villain written down —
       which is what separates this from a set like MC32's. */
    check(p + "and the row keeps the order it was given",
      eq(def.normalize({ marauders: ["vertigo", "arclight", "riptide"] }).marauders,
        ["vertigo", "arclight", "riptide"]));
    check(p + "an unknown villain leaves the slot empty",
      eq(def.normalize({ marauders: ["made-up", "harpoon", 7] }).marauders,
        ["", "harpoon", ""]));
    check(p + "the same villain twice keeps only the first slot",
      eq(def.normalize({ marauders: ["harpoon", "harpoon", "chimera"] }).marauders,
        ["harpoon", "", "chimera"]));
    check(p + "every printed villain is selectable",
      NE_MARAUDERS.every((slug) =>
        def.normalize({ marauders: [slug] }).marauders[0] === slug),
      NE_MARAUDERS.filter((slug) =>
        def.normalize({ marauders: [slug] }).marauders[0] !== slug).join());

    /* Two numbers, and both blank on a fresh sheet: an empty box means "nothing
       recorded yet", which is not the same statement as nought. */
    check(p + "morlocks saved starts blank and clamps",
      empty.morlocksSaved === null &&
      def.normalize({ morlocksSaved: "" }).morlocksSaved === null &&
      def.normalize({ morlocksSaved: 500 }).morlocksSaved === 99 &&
      def.normalize({ morlocksSaved: -3 }).morlocksSaved === 0 &&
      def.normalize({ morlocksSaved: "2" }).morlocksSaved === 2,
      JSON.stringify(def.normalize({ morlocksSaved: 500 }).morlocksSaved));
    /* Exactly two slots, because the sheet prints exactly two lines — scenario
       3 and scenario 4. Slot 0 is scenario 3, so the row is never sorted and
       never shortened. */
    check(p + "hope's damage is always two slots",
      eq(empty.hopeDamage, [null, null]) &&
      def.normalize({ hopeDamage: [1] }).hopeDamage.length === 2 &&
      def.normalize({ hopeDamage: [1, 2, 3, 4] }).hopeDamage.length === 2,
      JSON.stringify(def.normalize({ hopeDamage: [1] }).hopeDamage));
    check(p + "and each slot clamps on its own",
      eq(def.normalize({ hopeDamage: ["", 500] }).hopeDamage, [null, 99]),
      JSON.stringify(def.normalize({ hopeDamage: ["", 500] }).hopeDamage));

    /* The grid is rebuilt from the printed table every time, so it always has
       the six printed rows in the printed order however many arrived. */
    check(p + "the grid always has the six printed rows",
      empty.schemes.length === 6 &&
      def.normalize({ schemes: [{ scenario: 1 }] }).schemes.length === 6 &&
      def.normalize({ schemes: [{}, {}, {}, {}, {}, {}, {}, {}] }).schemes.length === 6,
      def.normalize({ schemes: [{ scenario: 1 }] }).schemes.length);
    check(p + "and a fresh row is unchosen and unearned",
      empty.schemes.every((row) => row.scenario === null && row.earned === false));
    check(p + "a row carries the chosen scenario and the earned box, nothing else",
      eq(Object.keys(empty.schemes[0]).sort(), ["earned", "scenario"]),
      JSON.stringify(Object.keys(empty.schemes[0])));
    /* Six printed rows against five scenarios: one row must stay empty at the
       end, which is why the choice is a pool of five rather than a tick. */
    check(p + "six rows for five scenarios",
      def.normalize({ schemes: [{ scenario: 5 }] }).schemes[0].scenario === 5 &&
      def.normalize({ schemes: [{ scenario: 6 }] }).schemes[0].scenario === 5 &&
      def.normalize({ schemes: [{ scenario: 0 }] }).schemes[0].scenario === 1 &&
      def.normalize({ schemes: [{ scenario: "" }] }).schemes[0].scenario === null);
    check(p + "an invented row key is dropped",
      def.normalize({ schemes: [{ scenario: 1, invented: true }] })
        .schemes[0].invented === undefined);
    check(p + "a tolerant truthy earned box reads as ticked, and \"yes\" does not",
      def.normalize({ schemes: [{ earned: "true" }] }).schemes[0].earned === true &&
      def.normalize({ schemes: [{ earned: "yes" }] }).schemes[0].earned === false);

    /* THE regression test for this sheet. Each scenario picks one scheme, so a
       scenario in two rows cannot stand — the later row loses it, first in row
       order wins. And the row that loses KEEPS ITS TICK: otherwise the mere
       order two rows arrived in an import would decide whose record survives.
       What is left is a contradiction, and paintSchemes() names it and leaves
       the box operable instead of resolving it. */
    const neDup = def.normalize({ schemes: [
      { scenario: 3, earned: true }, { scenario: 3, earned: true }] });
    check(p + "a scenario chosen twice is cleared on the later row",
      neDup.schemes[0].scenario === 3 && neDup.schemes[1].scenario === null,
      JSON.stringify([neDup.schemes[0].scenario, neDup.schemes[1].scenario]));
    check(p + "but that row keeps its earned box",
      neDup.schemes[1].earned === true);

    const dirtyNe = {
      players: [
        { hero: "  Cable  ", hp: "500" },
        { hero: "x".repeat(500), hp: "" },
        "not even an object",
        { hero: "Domino", hp: 11 },
        { hero: "one too many", hp: 3 },
      ],
      expert: 1,
      marauders: ["riptide", "riptide", "made-up", "vertigo"],
      morlocksSaved: "  4  ",
      hopeDamage: ["2", null, 9],
      schemes: [
        { scenario: "2", earned: "true" },
        "not an object",
        { scenario: 2, earned: 1 },
        { scenario: 99, earned: "yes" },
        {},
        { scenario: null, earned: true },
        { scenario: 1 },
      ],
      scenarios: [{ slug: "does-not-exist" }],
      flags: { invented: true },
      somethingUnknown: { nested: [1, 2, 3] },
    };
    const n1 = def.normalize(dirtyNe);
    check(p + "MC40 fixture is idempotent", eq(n1, def.normalize(n1)), JSON.stringify(n1));
    check(p + "the fixture keeps four players and clamps them",
      n1.players.length === 4 && n1.players[0].hero === "Cable" &&
      n1.players[0].hp === 99 && n1.players[1].hp === null,
      JSON.stringify(n1.players));
    check(p + "the fixture's marauder row drops the repeat and the unknown",
      eq(n1.marauders, ["riptide", "", ""]), JSON.stringify(n1.marauders));
    check(p + "the fixture's numbers are parsed and the row cut to two",
      n1.morlocksSaved === 4 && eq(n1.hopeDamage, [2, null]),
      JSON.stringify([n1.morlocksSaved, n1.hopeDamage]));
    check(p + "the fixture's grid is six rows, the repeat cleared, the tick kept",
      n1.schemes.length === 6 &&
      eq(n1.schemes.map((r) => r.scenario), [2, null, null, 5, null, null]) &&
      eq(n1.schemes.map((r) => r.earned), [true, false, true, false, false, true]),
      JSON.stringify(n1.schemes));
  }

  if (def.id === "age-of-apocalypse") {
    /* The generic fixture feeds MC60's `scenarios`, MC21's `flags` and MC10's
       `removed`, none of which is a field on this sheet. None of it may land. */
    check(p + "no scenarios key on this sheet", once.scenarios === undefined);
    check(p + "no flags key on this sheet", once.flags === undefined);
    check(p + "no removed key on this sheet", once.removed === undefined);
    check(p + "a notes field is not part of this sheet",
      def.normalize({ notes: "anything" }).notes === undefined);
    /* And not MC40's grid either. That one is close enough in shape to this
       table — printed rows, printed read-only columns, a box at the end — that
       a field copied across would be easy to miss. */
    check(p + "no schemes key on this sheet",
      def.normalize({ schemes: [{ scenario: 1, earned: true }] }).schemes === undefined);

    /* The level is a real boolean, and standard is the default: a sheet that
       says nothing is not an expert campaign. */
    check(p + "the level defaults to standard", empty.expert === false);
    check(p + "a tolerant truthy level reads as expert",
      def.normalize({ expert: 1 }).expert === true &&
      def.normalize({ expert: "true" }).expert === true);
    check(p + "and anything else reads as standard",
      def.normalize({ expert: "no" }).expert === false &&
      def.normalize({ expert: null }).expert === false);
    /* The whole point of the gate: standard level HIDES the hit points, so a
       standard sheet must still be able to carry them. */
    check(p + "a standard sheet still carries hit points",
      def.normalize({ expert: false, players: [{ hero: "Bishop", hp: 7 }] })
        .players[0].hp === 7);

    check(p + "a fresh sheet has exactly one player", empty.players.length === 1);
    check(p + "a player carries the identity and the hit points, nothing else",
      eq(Object.keys(empty.players[0]).sort(), ["hero", "hp"]),
      JSON.stringify(Object.keys(empty.players[0])));

    /* The table is rebuilt from the printed rows every time, so it always has
       the four the sheet prints — the fifth mission, Protect the Professor, is
       reserved for scenario #5 and is not printed. */
    check(p + "the table always has the four printed rows",
      empty.missions.length === 4 &&
      def.normalize({ missions: [{ defeated: true }] }).missions.length === 4 &&
      def.normalize({ missions: [{}, {}, {}, {}, {}, {}] }).missions.length === 4,
      def.normalize({ missions: [{}, {}, {}, {}, {}, {}] }).missions.length);
    check(p + "and a fresh row is undecided, i.e. the mission is available",
      empty.missions.every((row) => row.defeated === false && row.notDefeated === false));
    check(p + "a row carries the two outcomes and nothing else",
      eq(Object.keys(empty.missions[0]).sort(), ["defeated", "notDefeated"]),
      JSON.stringify(Object.keys(empty.missions[0])));
    check(p + "an invented row key is dropped",
      def.normalize({ missions: [{ defeated: true, invented: true }] })
        .missions[0].invented === undefined);
    check(p + "a tolerant truthy outcome reads as ticked, and \"yes\" does not",
      def.normalize({ missions: [{ defeated: "true" }] }).missions[0].defeated === true &&
      def.normalize({ missions: [{ defeated: "yes" }] }).missions[0].defeated === false);
    /* Rows are positional and never sorted: the row order is the printed one,
       so an outcome has to stay on the row it arrived on. */
    const aoaOrder = def.normalize({ missions: [
      { defeated: true }, {}, { notDefeated: true }, {}] });
    check(p + "an outcome stays on the row it arrived on",
      eq(aoaOrder.missions.map((r) => r.defeated), [true, false, false, false]) &&
      eq(aoaOrder.missions.map((r) => r.notDefeated), [false, false, true, false]),
      JSON.stringify(aoaOrder.missions));

    /* THE regression test for this sheet. A mission is either defeated or not,
       so both at once is a contradiction — and normalize() deliberately KEEPS
       it rather than picking a winner: which of the two was meant is not ours
       to guess, and dropping one would overwrite a record instead of flagging
       it. paintMissions() names it and leaves both boxes operable. */
    const aoaBoth = def.normalize({ missions: [{ defeated: true, notDefeated: true }] });
    check(p + "both outcomes on one row survive normalize",
      aoaBoth.missions[0].defeated === true && aoaBoth.missions[0].notDefeated === true,
      JSON.stringify(aoaBoth.missions[0]));
    check(p + "and the contradiction does not spread to the other rows",
      aoaBoth.missions.slice(1).every((r) => !r.defeated && !r.notDefeated),
      JSON.stringify(aoaBoth.missions));

    /* The five printed minions, pinned BY SLUG rather than by name: the slug is
       what is persisted, the name is what a retranslation may change. */
    const AOA_OVERSEERS = ["mister-sinister", "the-shadow-king", "abyss",
      "sugar-man", "mikhail-rasputin"];
    check(p + "the five printed minions are the five keys, in printed order",
      eq(Object.keys(empty.overseers), AOA_OVERSEERS),
      Object.keys(empty.overseers).join());
    check(p + "and every one of them starts available",
      AOA_OVERSEERS.every((slug) => empty.overseers[slug] === false));
    check(p + "an invented minion is dropped",
      def.normalize({ overseers: { "made-up": true } }).overseers["made-up"] === undefined);
    check(p + "a minion the file does not mention reads as available",
      def.normalize({ overseers: { abyss: true } }).overseers["sugar-man"] === false);
    check(p + "a tolerant truthy strike reads as struck, and \"yes\" does not",
      def.normalize({ overseers: { abyss: 1 } }).overseers.abyss === true &&
      def.normalize({ overseers: { abyss: "yes" } }).overseers.abyss === false);
    check(p + "a list where the map belongs leaves every minion available",
      eq(def.normalize({ overseers: ["abyss"] }).overseers, empty.overseers),
      JSON.stringify(def.normalize({ overseers: ["abyss"] }).overseers));

    const dirtyAoa = {
      players: [
        { hero: "  Bishop  ", hp: "500" },
        { hero: "x".repeat(500), hp: "" },
        "not even an object",
        { hero: "Magik", hp: 11 },
        { hero: "one too many", hp: 3 },
      ],
      expert: 1,
      missions: [
        { defeated: "true", notDefeated: 0 },
        "not an object",
        { defeated: 1, notDefeated: "yes" },
        { notDefeated: true, invented: "dropped" },
        { defeated: true },
      ],
      overseers: { abyss: "true", "sugar-man": 0, "made-up": true },
      scenarios: [{ slug: "does-not-exist" }],
      flags: { invented: true },
      schemes: [{ scenario: 1, earned: true }],
      somethingUnknown: { nested: [1, 2, 3] },
    };
    const a1 = def.normalize(dirtyAoa);
    check(p + "MC45 fixture is idempotent", eq(a1, def.normalize(a1)), JSON.stringify(a1));
    check(p + "the fixture keeps four players and clamps them",
      a1.players.length === 4 && a1.players[0].hero === "Bishop" &&
      a1.players[0].hp === 99 && a1.players[1].hp === null,
      JSON.stringify(a1.players));
    check(p + "the fixture's table is four rows and the fifth is gone",
      a1.missions.length === 4 &&
      eq(a1.missions.map((r) => r.defeated), [true, false, true, false]) &&
      eq(a1.missions.map((r) => r.notDefeated), [false, false, false, true]),
      JSON.stringify(a1.missions));
    check(p + "the fixture's minions keep the five printed keys only",
      eq(Object.keys(a1.overseers), AOA_OVERSEERS) &&
      a1.overseers.abyss === true && a1.overseers["sugar-man"] === false,
      JSON.stringify(a1.overseers));
  }

  if (def.id === "galaxys-most-wanted") {
    /* The generic fixture feeds MC60's `scenarios`, MC21's `flags` and MC10's
       `removed`, none of which is a field on this sheet. None of it may land.
       `removed` is the one worth naming: this sheet HAS two free-text card
       lists, so a stray one is easy not to notice. */
    check(p + "no scenarios key on this sheet", once.scenarios === undefined);
    check(p + "no flags key on this sheet", once.flags === undefined);
    check(p + "no removed key on this sheet", once.removed === undefined);
    check(p + "a notes field is not part of this sheet",
      def.normalize({ notes: "anything" }).notes === undefined);
    /* And there is no fifth scenario anywhere in the shape: Ronan does not
       appear on the printed sheet, so nothing here may grow a slot for him. */
    check(p + "the sheet has no scenario slots at all",
      eq(Object.keys(empty).sort(),
        ["artifacts", "evasion", "expert", "headhunter", "players", "powerStone"]),
      Object.keys(empty).join());

    /* The level is a real boolean, and standard is the default: a sheet that
       says nothing is not an expert campaign. */
    check(p + "the level defaults to standard", empty.expert === false);
    check(p + "a tolerant truthy level reads as expert",
      def.normalize({ expert: 1 }).expert === true &&
      def.normalize({ expert: "true" }).expert === true);
    check(p + "and anything else reads as standard",
      def.normalize({ expert: "no" }).expert === false &&
      def.normalize({ expert: null }).expert === false);
    /* The whole point of the gate: standard level HIDES the hit points, so a
       standard sheet must still be able to carry them. */
    check(p + "a standard sheet still carries hit points",
      def.normalize({ expert: false, players: [{ hero: "Groot", hp: 7 }] })
        .players[0].hp === 7);
    /* And the units are NOT behind that gate: they are earned at both levels,
       so switching to standard must not take them with the hit points. */
    check(p + "a standard sheet keeps its units",
      def.normalize({ expert: false, players: [{ hero: "Groot", unitsEarned: 5 }] })
        .players[0].unitsEarned === 5);

    check(p + "player list capped at 4", once.players.length === 4, once.players.length);
    check(p + "an empty player list still yields one player",
      def.normalize({ players: [] }).players.length === 1);
    check(p + "a player carries exactly the five fields the sheet asks for",
      eq(Object.keys(empty.players[0]).sort(),
        ["collection", "hero", "hp", "market", "unitsEarned"]),
      JSON.stringify(Object.keys(empty.players[0])));
    check(p + "units earned are clamped like hit points",
      def.normalize({ players: [{ unitsEarned: "500" }, { unitsEarned: -4 },
        { unitsEarned: "" }] })
        .players.map((pl) => pl.unitsEarned).join() === "99,0,");
    /* What is left is DERIVED and must never be stored: two numbers that can
       disagree are exactly what this change was meant to get rid of. */
    check(p + "the unspent balance is not a stored field",
      def.normalize({ players: [{ unitsEarned: 5, unitsLeft: 3, units: 3 }] })
        .players[0].unitsLeft === undefined &&
      def.normalize({ players: [{ unitsEarned: 5, units: 3 }] })
        .players[0].units === undefined);

    /* THE migration. Version 1 stored the printed field — `units` was the
       UNSPENT balance — and version 2 stores what was earned. Read as a v2
       sheet without conversion, every v1 player would be understated by
       whatever they had already spent. The conversion is exact rather than a
       guessed default, because unspent plus spent IS earned and the cards are
       recorded right there: Grapple 2 + Onrush 5 = 7 spent, so 4 unspent means
       11 earned. Pinned by cost rather than by name, since the card names are
       still being translated. */
    const gmwV1 = def.normalize(def.migrate(
      { players: [{ hero: "Groot", units: 4, market: ["grapple", "onrush"] }] }, 1));
    check(p + "a v1 unspent balance migrates to the units earned",
      gmwV1.players[0].unitsEarned === 11, gmwV1.players[0].unitsEarned);
    check(p + "and the old key does not survive the trip",
      gmwV1.players[0].units === undefined);
    /* A player who recorded no balance gets none: adding up their cards would
       invent an income they never wrote down. */
    check(p + "a v1 player with no balance recorded keeps none",
      def.normalize(def.migrate(
        { players: [{ hero: "Groot", market: ["grapple"] }] }, 1))
        .players[0].unitsEarned === null);
    check(p + "migrating a v1 sheet is idempotent once normalized",
      eq(gmwV1, def.normalize(gmwV1)), JSON.stringify(gmwV1.players[0]));
    /* And it leaves a current sheet exactly as it found it. */
    check(p + "migrate leaves a current state alone",
      eq(def.normalize(def.migrate(JSON.parse(JSON.stringify(empty)), def.stateVersion)),
        empty));

    /* The 28 Market cards, pinned BY SLUG rather than by name: the slug is what
       is persisted, and 23 of the names are still waiting for a German
       printing, so pinning a label here would break on the day one arrives. */
    const GMW_MARKET_SAMPLE = ["brainstorm", "contingency-plan", "in-harms-way",
      "armor-plating", "navigation-column", "triple-threat"];
    check(p + "a fresh player has bought nothing",
      eq(empty.players[0].market, []) && eq(empty.players[0].collection, []));
    check(p + "known market slugs survive and unknown ones do not",
      eq(def.normalize({ players: [{ market: GMW_MARKET_SAMPLE.concat(["made-up"]) }] })
        .players[0].market, GMW_MARKET_SAMPLE),
      JSON.stringify(def.normalize({ players: [{ market: ["made-up"] }] }).players[0].market));
    check(p + "a repeat inside one player collapses to one",
      eq(def.normalize({ players: [{ market: ["grapple", "grapple", "onrush"] }] })
        .players[0].market, ["grapple", "onrush"]));
    /* A row added but never filled in is stored as "" while the sheet is open,
       because a select put back to its placeholder has no blur to remove it on.
       It is not a record, so it does not come back. */
    check(p + "an empty market row is not a record",
      eq(def.normalize({ players: [{ market: ["grapple", ""] }] })
        .players[0].market, ["grapple"]));
    /* THE regression test for this sheet: "Only one copy of each card from The
       Market ... for the players as a group." Resolved in player order so the
       outcome depends on the sheet and not on render order. */
    const gmwShared = def.normalize({ players: [
      { market: ["grapple", "onrush"] },
      { market: ["onrush", "safeguard"] },
      { market: ["grapple"] }] });
    check(p + "a market card claimed twice stays with the first player",
      eq(gmwShared.players[0].market, ["grapple", "onrush"]) &&
      eq(gmwShared.players[1].market, ["safeguard"]) &&
      eq(gmwShared.players[2].market, []),
      JSON.stringify(gmwShared.players.map((pl) => pl.market)));
    /* The order of a purchase list is not meaningful, so it is also not
       canonicalised: what arrived is what stays, or rows would jump around
       under the reader between one load and the next. */
    check(p + "a market list keeps the order it arrived in",
      eq(def.normalize({ players: [{ market: ["triple-threat", "brainstorm"] }] })
        .players[0].market, ["triple-threat", "brainstorm"]));
    check(p + "the collection is free text and keeps its entries",
      eq(def.normalize({ players: [{ collection: ["  Enhanced Reflexes  ", "", null, "~done"] }] })
        .players[0].collection, ["  Enhanced Reflexes  ", "~done"]),
      JSON.stringify(def.normalize({ players: [{ collection: ["  x  ", ""] }] })
        .players[0].collection));

    /* The four printed side schemes, by slug, and as a SET: the sheet numbers
       four lines but the number carries nothing, so the stored order is the
       printed one however the boxes were ticked. */
    const GMW_ARTIFACTS = ["hujahdarian-monarch-egg", "magical-teapot",
      "philosophers-stone", "crystal-ball"];
    check(p + "a fresh sheet has recorded no artifacts", eq(empty.artifacts, []));
    check(p + "artifacts come back in printed order, whatever order they arrived in",
      eq(def.normalize({ artifacts: ["crystal-ball", "magical-teapot"] }).artifacts,
        ["magical-teapot", "crystal-ball"]));
    check(p + "all four fit, and an invented one does not",
      eq(def.normalize({ artifacts: GMW_ARTIFACTS.concat(["made-up"]) }).artifacts,
        GMW_ARTIFACTS));
    check(p + "a repeated artifact collapses to one",
      eq(def.normalize({ artifacts: ["magical-teapot", "magical-teapot"] }).artifacts,
        ["magical-teapot"]));
    check(p + "a map where the list belongs records nothing",
      eq(def.normalize({ artifacts: { "magical-teapot": true } }).artifacts, []));

    /* Power Stone Control stores a SEAT, not a name. An index past the end of
       the player list is not a player, so it is not a record either. */
    check(p + "nobody holds the Power Stone on a fresh sheet", empty.powerStone === null);
    check(p + "a seat that exists is kept",
      def.normalize({ players: [{}, {}], powerStone: 1 }).powerStone === 1);
    /* Dropped rather than clamped, and that is the point: clamping 3 down to 0
       on a one-player sheet would invent a record instead of discarding a
       broken one. Same for a negative index. */
    check(p + "a seat past the end of the player list is dropped",
      def.normalize({ players: [{}], powerStone: 3 }).powerStone === null,
      def.normalize({ players: [{}], powerStone: 3 }).powerStone);
    check(p + "a negative seat is not a seat",
      def.normalize({ players: [{}, {}], powerStone: -1 }).powerStone === null);
    /* And a player removed by the four-player cap takes the reference with
       them, because normalize() reads the seat AFTER the cap. */
    check(p + "a seat belonging to a fifth player is dropped with them",
      def.normalize({ players: [{}, {}, {}, {}, {}], powerStone: 4 }).powerStone === null);
    check(p + "and nothing recorded stays nothing",
      def.normalize({ powerStone: "" }).powerStone === null &&
      def.normalize({ powerStone: "gamora" }).powerStone === null);

    check(p + "evasion counters start unrecorded, and empty is not zero",
      empty.evasion === null && def.normalize({ evasion: "" }).evasion === null);
    check(p + "evasion counters are clamped",
      def.normalize({ evasion: -2 }).evasion === 0 &&
      def.normalize({ evasion: "500" }).evasion === 99);

    /* The four printed scenario tiles, by slug and in printed order. There are
       four and not five: the sheet is subtitled "Victory for Scenarios #1 - 4",
       and scenario #5 has nothing to record. */
    const GMW_TILES = ["brotherhood", "infiltrate", "escape", "nebula"];
    check(p + "the four printed tiles are the four keys, in printed order",
      eq(Object.keys(empty.headhunter), GMW_TILES),
      Object.keys(empty.headhunter).join());
    check(p + "and every one of them starts unmarked",
      GMW_TILES.every((slug) => empty.headhunter[slug] === false));
    check(p + "an invented scenario is dropped",
      def.normalize({ headhunter: { ronan: true } }).headhunter.ronan === undefined);
    check(p + "a tolerant truthy mark reads as marked, and \"yes\" does not",
      def.normalize({ headhunter: { nebula: 1 } }).headhunter.nebula === true &&
      def.normalize({ headhunter: { nebula: "yes" } }).headhunter.nebula === false);
    check(p + "a list where the map belongs leaves every tile unmarked",
      eq(def.normalize({ headhunter: ["nebula"] }).headhunter, empty.headhunter));

    /* The market cards are the one table on this sheet whose German is open
       work, so the count is pinned: 28 is what the pool has, and a slug lost to
       a typo would otherwise only show up as a card nobody can pick. */
    const gmwAll = def.normalize({ players: [{ market: [
      "brainstorm", "by-any-means", "contingency-plan", "in-defiance",
      "calculate-the-odds", "creative-solution", "grapple", "wing-it",
      "close-call", "defy-danger", "in-harms-way", "take-the-fight-to-them",
      "armor-plating", "heavy-cannon", "hyper-thrusters", "reactor-core",
      "ardent-resolve", "onrush", "safeguard", "sure-gamble",
      "cargo-hold", "mounted-laser", "navigation-column", "targeting-screen",
      "grand-strategy", "power-unleashed", "tried-and-true", "triple-threat"] }] });
    check(p + "all 28 market slugs are real", gmwAll.players[0].market.length === 28,
      gmwAll.players[0].market.length);

    const dirtyGmw = {
      players: [
        { hero: "  Rocket Raccoon  ", hp: "500", unitsEarned: "7",
          market: ["grapple", "grapple", "made-up"], collection: ["  Aid  ", "", 42] },
        { hero: "x".repeat(500), hp: "", unitsEarned: -3,
          market: ["grapple", "onrush"], collection: "one\ntwo" },
        "not even an object",
        { hero: "Groot", hp: 11, unitsEarned: 0, market: "not a list" },
        { hero: "one too many", hp: 3, unitsEarned: 9 },
      ],
      expert: 1,
      artifacts: ["crystal-ball", "crystal-ball", "made-up", "magical-teapot"],
      powerStone: "2",
      evasion: "9",
      headhunter: { brotherhood: "true", nebula: 0, ronan: true },
      scenarios: [{ slug: "does-not-exist" }],
      flags: { invented: true },
      removed: ["stray"],
      somethingUnknown: { nested: [1, 2, 3] },
    };
    const g1 = def.normalize(dirtyGmw);
    check(p + "MC16 fixture is idempotent", eq(g1, def.normalize(g1)), JSON.stringify(g1));
    check(p + "the fixture keeps four players and clamps them",
      g1.players.length === 4 && g1.players[0].hero === "Rocket Raccoon" &&
      g1.players[0].hp === 99 && g1.players[0].unitsEarned === 7 &&
      g1.players[1].hp === null && g1.players[1].unitsEarned === 0,
      JSON.stringify(g1.players.map((pl) => [pl.hero, pl.hp, pl.unitsEarned])));
    check(p + "the fixture resolves the group rule in player order",
      eq(g1.players[0].market, ["grapple"]) &&
      eq(g1.players[1].market, ["onrush"]) &&
      eq(g1.players[3].market, []),
      JSON.stringify(g1.players.map((pl) => pl.market)));
    check(p + "the fixture splits a legacy collection string on newlines",
      eq(g1.players[1].collection, ["one", "two"]),
      JSON.stringify(g1.players[1].collection));
    check(p + "the fixture's artifacts are a printed-order set",
      eq(g1.artifacts, ["magical-teapot", "crystal-ball"]), JSON.stringify(g1.artifacts));
    check(p + "the fixture's seat and counters survive as numbers",
      g1.powerStone === 2 && g1.evasion === 9, g1.powerStone + "/" + g1.evasion);
    check(p + "the fixture's tiles keep the four printed keys only",
      eq(Object.keys(g1.headhunter), GMW_TILES) &&
      g1.headhunter.brotherhood === true && g1.headhunter.nebula === false,
      JSON.stringify(g1.headhunter));
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
/* The selftest quarantines a log from a campaign that does not exist, and it
   has now been broken twice by a real campaign shipping under the id the
   fixture had borrowed — each time turning several assertions into assertions
   about nothing, silently. So the sentinel is checked here: if a campaign ever
   claims it, this fails loudly instead. */
{
  const selftest = read("test/selftest.html");
  const sentinel = "no-such-campaign";
  check("the selftest's unknown-campaign sentinel is still used",
    selftest.includes('campaignId: "' + sentinel + '"'));
  check("and no registered campaign has claimed it",
    !campaigns.some((def) => def.id === sentinel),
    campaigns.map((d) => d.id).join());
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

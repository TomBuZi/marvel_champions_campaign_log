/* Marvel Champions — "Agents of S.H.I.E.L.D." (MC50) campaign log.

   One printed page, 540 by 540 points, and the busiest sheet in this project:
   four player panels, one small table of counters, four scenario boxes and then
   a block of 81 printed cells that is nearly half the page. There is no
   scenario table, no "completed", no progress counter and no notes field — the
   yellow "Notes" badge is the TITLE of the counter table, not a field — and
   nothing at all about scenario #5, although the campaign has five. Those
   absences are the sheet, not an omission.

   THE SAME TEMPLATE TRAP AS MC32, MC40 AND MC45. get_images() reports one
   raster over the whole page plus one over every panel strip, so the orange
   comic border and its black hatching exist in no vector fill: the area
   measurement never sees them, and a rendered-pixmap average is the only way to
   a number (#C85634 along the top edge, #D25B33 down the left). That border
   hatches OUTSIDE the grey frame, so like MC45 — and unlike MC32 and MC40 — it
   is a frame around the sheet rather than part of it, and no orange goes into
   the palette. styles.css says so at the value that is missing.

   NO GLYPH FROM THE PUBLISHER'S ICON FONT anywhere on the page: the span sweep
   over the content stream returns only Exo2 and KomikaTitle, so there is no
   {pp} marker here as there is in MC27. The nine symbols in the combination
   block are ARTWORK, not font characters — see the drawing note below.

   WHAT EACH FIELD HOLDS, derived from the print plus the rulebook, never from
   memory. Cell counts come off the divider lines of the content stream:

     * EXACTLY FOUR player panels across the top, x 18.7-148.3, 145.1-274.7,
       271.5-401.1 and 398.0-527.6, all at y 41.3-124.5. Each prints an identity
       line and "Remaining hit points:".
     * ONE table under the "Notes" badge, "Remaining Secret Counters by
       Scenario". Its header band runs y 151.1-165.4 and its data area
       y 165.4-216.1, cut by horizontal dividers at y 182.3 and 199.2 —
       EXACTLY THREE ROWS. The four scenario columns span x 137.5-320.8 with
       vertical dividers at x 183.3, 229.2 and 275.0 — EXACTLY FOUR COLUMNS —
       beside a label column at x 30.0-137.5. So: 3 board members x 4 scenarios.
     * Scenario #1, x 330.6-430.3, y 122.1-228.0: "Minions and side schemes in
       play:", one number.
     * Scenario #2, x 427.9-527.2, same band: "Rescued captives:", one number.
     * Scenario #3, x 18.8-333.4, y 223.5-283.7: "Adaptoid environments:" over
       EXACTLY FOUR boxes in a 2x2 grid at x 132.6-143.4 and 223.2-234.0,
       y 238.4-249.2 and 259.2-270.0, outlined in #7A1429. That is the MC21
       shape: one caption over named boxes, and the box itself is the "check
       here".
     * Scenario #4, x 330.6-527.4, same band: "Surviving Thunderbolts:", a
       write-in area with no rows printed in it.
     * The combination block: three sub-tables of NINE rows each, columns at
       x 36/85.5/135, 195.8/245.2/294.8 and 355.5/405/454.5, rows at
       y 333.1 + k*19.55 for k = 0..8.

   THE 81 CELLS WERE READ, NOT COUNTED BY EYE. Every cell is a flat colour band
   with a symbol on it, and the nine colours map one-to-one onto the nine
   evidence cards, so the grid comes out of the rendered pixmap by sampling each
   cell away from its symbol and matching the sample to the nine measured fills
   (#FEB57B, #76C9F1, #F9A2B1, #ACD68E, #67676A, #F9DB81, #C6A7CF, #F99888,
   #85A2D4). The result checks out against the game: the 27 printed rows are the
   27 combinations of three means, three motives and three opportunities, each
   exactly once, nine to a board member. test/lint.js asserts that bijection,
   because it is the one fact about this table that a typo would break silently.

   THE PRINTED TABLE IS COMPUTED HERE RATHER THAN ASKED FOR, and this is the
   decision most likely to look like a missing field. What the paper wants is a
   pen through whole rows; what the rulebook says at the end of every scenario
   (EN and DE p. 9, 11, 13, 15, and again on p. 19; the German printing pages
   identically) is:
   "gain one evidence card from the S.H.I.E.L.D. envelope and cross out each
   combination of means, motive, and opportunity in the campaign log that
   includes the icon on the evidence card gained." The strike is therefore fully
   determined by WHICH CARDS were gained, and nothing else — so the nine cards
   are what this sheet stores, and the 27 rows are painted from them. Same move
   as MC16, which computes a printed balance instead of asking for it.

   Three consequences worth writing down:

     * THE THIRD CARD OF A GROUP IS THE ANSWER, and the screen says so. Each
       group holds three cards and exactly one of them is sealed in the A.I.M.
       envelope, so once the other two have been gained the third is the mole's
       and can never be gained. Its box is closed, because there is nothing left
       to record there, and its name is called out in red: that name is what the
       whole campaign is played to find out, and it is a derivation rather than
       a guess — the rulebook's own process of elimination, one group at a time.
       The tables already said the same thing by leaving only rows with that
       card standing; this puts it where it can be read at a glance.
     * THE CLOSING IS ONE-SIDED, AND normalize() STILL CAPS NOTHING. Only an
       UNTICKED box is ever closed, so a sheet that arrives with all three cards
       of a group ticked — from an import, a hand-edited file or an old #log=
       link — does not freeze: with three ticked the count is not two, nothing
       closes, and the way out stays on screen. normalize() keeps such a sheet
       exactly as it came and picks no winner, the rule this project follows
       everywhere; the tables say the rest by striking all 27 rows.
     * THE PRINTOUT CARRIES BOTH. renderPrint() prints the nine boxes AND all 27
       rows with their strikes. MC16 deliberately leaves its derived lines out of
       the printout; here the derived table IS the sheet, so leaving it out would
       print something that is not the campaign log.

   THE SYMBOLS ARE DRAWN, NOT EMBEDDED. The nine icons on the paper are the
   publisher's artwork. What goes on screen is nine plain line drawings of what
   each symbol depicts, sitting on the measured colour of its printed cell,
   each carrying the card's name as its accessible name and repeated with that
   name in the legend above the tables: a symbol nobody can read is worse than
   the word for it. The drawings are ours; only the colours are measured.

   THE EXPERT FIELD, AND WHERE IT COMES FROM. The remaining hit points sit
   behind the expert switch, and here the rulebook is explicit where the print is
   silent — p. 6 under PERSISTENT DAMAGE, and under BLEIBENDER SCHADEN on the
   same page of the German printing:
   "While playing the Agents of S.H.I.E.L.D. campaign at the expert level, each
   player must record their remaining hit points in the campaign log after they
   win a game." Every scenario's victory list repeats it as "Expert Campaign
   Only". The printed sheet marks the field no differently from the others, as
   MC40's and MC45's do not either, so the switch is right and the print simply
   omits the marker. Hides, never clears: the value stays in the sheet, in the
   JSON export and in a share link.

   GERMAN IS NOT OPEN WORK FOR THE PRINTED WORDING. The German rulebook of this
   expansion, "marvel-champions-agents-of-shield-841333129637-regel.pdf", prints
   the complete German log on its page 24, and every printed string below is read
   off that page. Nothing in the printed wording is a translation of ours.

   THE CARD NAMES ARE A SEPARATE QUESTION FROM THE PRINTED WORDING, and the two
   must not be run together. The sheet prints no card names at all: the nine
   evidence symbols stand there wordless and the Thunderbolt field is a blank
   write-in area, so those names had to be fetched rather than read off the
   paper. The nine evidence cards are all entered in German. The eleven
   Thunderbolt minions are not: they carry `de: null` meaning NOT ENTERED YET —
   the MC27 reading, not the MC10/MC21 "stays English in the German printing"
   decision — because translations/de/pack/aos_encounter.json holds ten player
   cards and no encounter cards, and the German rulebook has no card list. If
   they turn out to keep their English names in the German printing, as figures
   normally do, this comment is what has to change with them.

   emptyState() and normalize() must not touch the DOM — not at load time and
   not when called. CI exercises them headlessly to prove that normalize() is
   idempotent and that a fresh state round-trips unchanged.

   Loaded as a plain script (no ES module) so the app also works via file://. */
(function (global) {
  "use strict";

  var W = global.W;

  /* One to four players: cards are added as people join, so the sheet only ever
     shows as many as are actually playing. The paper sheet has to print four
     places; a screen does not. */
  var MAX_PLAYERS = 4;
  var HP_MAX = 99;
  var NAME_MAX = 60;
  /* Every count on this sheet — secret counters, minions and side schemes,
     rescued captives — is an open tally with no printed ceiling. 99 is the
     same guard the hit points use, not a rule of the game. */
  var COUNT_MAX = 99;
  /* The counter table prints four scenario columns. Scenario #5 has no column,
     because its setup reads scenario #4's. */
  var SCENARIOS = 4;

  /* ---- CARD SETS -----------------------------------------------------------
     Every card carries an English and a German name, as in MC10, MC21, MC27,
     MC32, MC40 and MC45. `de: null` shows the English name and tags it
     lang="en".

     Checked against C:\Repos\marvelsdb-json-data, pack `aos_encounter`: the
     three board members are the `s.h.i.e.l.d._executive_board` set (50181a to
     50183a), the nine evidence cards are `executive_board_evidence` (50185 to
     50193), the four Adaptoid environments are 50109 to 50112 of the
     `m.o.d.o.k.` set, and the seven Thunderbolt minions are 50133 plus one
     Elite per modular set (50139, 50143, 50148, 50152, 50156, 50161).

     WHICH `de: null` THIS IS. For the three board members and the four Adaptoid
     environments it never comes up: those seven names are printed on the German
     log itself, so they are filled in from the paper. For the nine evidence
     cards and the seven minions it means NOT ENTERED YET — see the file header.
     Only Wiretap is settled. */

  /* The three board members, in the order the counter table and the combination
     block both print them. Names off the German log, page 24. */
  var BOARD = [
    { slug: "chief-medical-officer",      en: "Chief Medical Officer",      de: "Medizinische Leitung" },
    { slug: "chief-surveillance-officer", en: "Chief Surveillance Officer", de: "Leitung der Überwachung" },
    { slug: "chief-tactical-officer",     en: "Chief Tactical Officer",     de: "Taktische Leitung" },
  ];

  /* The nine evidence cards, grouped as the sheet's three columns group them
     and ordered inside each group as the combination block introduces them.
     `group` is the column the card belongs to and doubles as the legend's
     grouping; `icon` names the drawing, and the drawing is keyed by slug, so
     the two can never point at different symbols. */
  var EVIDENCE = [
    { slug: "medical-records",    group: "means",       en: "Medical Records",    de: "Medizinische Unterlagen" },
    { slug: "wiretap",            group: "means",       en: "Wiretap",            de: "Abhördaten" },
    { slug: "security-scanner",   group: "means",       en: "Security Scanner",   de: "Sicherheitsscanner" },
    { slug: "money",              group: "motive",      en: "Money",              de: "Geld" },
    { slug: "blackmail",          group: "motive",      en: "Blackmail",          de: "Erpressung" },
    { slug: "ideology",           group: "motive",      en: "Ideology",           de: "Ideologie" },
    { slug: "security-clearance", group: "opportunity", en: "Security Clearance", de: "Sicherheitsfreigabe" },
    { slug: "travel",             group: "opportunity", en: "Travel",             de: "Dienstreise" },
    { slug: "authority",          group: "opportunity", en: "Authority",          de: "Machtbefugnis" },
  ];

  /* The columns, in printed order. The key is both the group in EVIDENCE and
     the i18n key of the printed column heading. */
  var GROUPS = [
    { key: "means",       label: "colMeans" },
    { key: "motive",      label: "colMotive" },
    { key: "opportunity", label: "colOpportunity" },
  ];

  /* The 81 printed cells, as 27 rows of three slugs, nine under each board
     member and each row in the order the sheet prints it. Read off the page —
     see the file header — not reasoned out: which nine rows sit under which
     board member is the sheet's own claim about the game and there is no rule
     that would let it be recomputed.

     What CAN be checked is that the 27 rows are the 27 combinations exactly
     once between them, and test/lint.js does. */
  var COMBOS = {
    "chief-medical-officer": [
      ["medical-records", "money", "security-clearance"],
      ["medical-records", "money", "travel"],
      ["medical-records", "blackmail", "security-clearance"],
      ["medical-records", "blackmail", "authority"],
      ["medical-records", "ideology", "travel"],
      ["wiretap", "money", "security-clearance"],
      ["wiretap", "money", "travel"],
      ["wiretap", "blackmail", "security-clearance"],
      ["security-scanner", "money", "security-clearance"],
    ],
    "chief-surveillance-officer": [
      ["medical-records", "blackmail", "travel"],
      ["wiretap", "money", "authority"],
      ["wiretap", "blackmail", "travel"],
      ["wiretap", "blackmail", "authority"],
      ["wiretap", "ideology", "security-clearance"],
      ["wiretap", "ideology", "travel"],
      ["security-scanner", "blackmail", "travel"],
      ["security-scanner", "blackmail", "authority"],
      ["security-scanner", "ideology", "travel"],
    ],
    "chief-tactical-officer": [
      ["medical-records", "money", "authority"],
      ["medical-records", "ideology", "security-clearance"],
      ["medical-records", "ideology", "authority"],
      ["wiretap", "ideology", "authority"],
      ["security-scanner", "money", "travel"],
      ["security-scanner", "money", "authority"],
      ["security-scanner", "blackmail", "security-clearance"],
      ["security-scanner", "ideology", "security-clearance"],
      ["security-scanner", "ideology", "authority"],
    ],
  };

  /* The four Adaptoid environments, in the sheet's reading order across the 2x2
     grid — which is NOT the card numbering, where Psionic is 50110 and Sarah
     Garza 50111. Names off the German log, page 24. */
  var ADAPTOIDS = [
    { slug: "flying-upgrade",      en: "Flying Upgrade",      de: "Flug-Upgrade" },
    { slug: "sarah-garza-upgrade", en: "Sarah Garza Upgrade", de: "Sarah-Garza-Upgrade" },
    { slug: "psionic-upgrade",     en: "Psionic Upgrade",     de: "Psionik-Upgrade" },
    { slug: "strong-upgrade",      en: "Strong Upgrade",      de: "Stärke-Upgrade" },
  ];

  /* The Thunderbolt minions that can be left standing when scenario #4 ends.
     Jolt is in the villain's own encounter set and is therefore always in the
     game; the rest are the Elite Thunderbolts of the modular sets the scenario
     lets you choose from — the six the rulebook names for the base box (EN
     p. 15: "Gravitational Pull, Hard Sound, Pale Little Spider, Power of the
     Atom, Supersonic, and The Leaper") plus the four that have shipped in
     products since. Nothing is capped: the scenario customisation rules let the
     sets move around, and the victory instruction records every Thunderbolt
     minion in play rather than only the Elite ones.

     BY NAME, NOT BY CARD, and that is deliberate rather than sloppy: the sheet
     says "record each of their names", and two different cards are printed
     "Atlas". One entry covers both, which is exactly what a written-down name
     does on the paper.

     The order here is the order they were entered — base box first, then the
     later products. What the dropdown shows is sorted, and sorted at render
     rather than here, because the sort has to follow the DISPLAYED name and
     that changes with the language. */
  var THUNDERBOLTS = [
    { slug: "jolt",            en: "Jolt",            de: null },
    { slug: "moonstone",       en: "Moonstone",       de: null },
    { slug: "songbird",        en: "Songbird",        de: null },
    { slug: "black-widow",     en: "Black Widow",     de: null },
    { slug: "radioactive-man", en: "Radioactive Man", de: null },
    { slug: "mach-iv",         en: "MACH-IV",         de: null },
    { slug: "batroc",          en: "Batroc",          de: null },
    { slug: "joystick",        en: "Joystick",        de: null },
    { slug: "atlas",           en: "Atlas",           de: null },
    { slug: "fixer",           en: "Fixer",           de: null },
    { slug: "blizzard",        en: "Blizzard",        de: null },
  ];

  /* The nine drawings, keyed by the same slug as the card. Plain line art of
     what each printed symbol depicts, in a 24x24 box: a medical folder, a
     tapped phone, a fingerprint card, a banknote, a framed photograph, a flame,
     an ID badge, a map pin and a shield. Ours, not the publisher's. */
  var ICONS = {
    "medical-records": [
      "M3.2 6.6h5.6l1.6 2h10.4v10.3a1.2 1.2 0 0 1-1.2 1.2H4.4a1.2 1.2 0 0 1-1.2-1.2z",
      "M14.2 13.4h4.4", "M16.4 11.2v4.4",
    ],
    "wiretap": [
      "M7 3.6h6.4a1.6 1.6 0 0 1 1.6 1.6v13.6a1.6 1.6 0 0 1-1.6 1.6H7a1.6 1.6 0 0 1-1.6-1.6V5.2A1.6 1.6 0 0 1 7 3.6z",
      "M8.6 17.6h3.2",
      "M17.6 8.6a4.6 4.6 0 0 1 0 6.8", "M20.2 6a8.2 8.2 0 0 1 0 12",
    ],
    "security-scanner": [
      "M8 3.6h8a1.4 1.4 0 0 1 1.4 1.4v14a1.4 1.4 0 0 1-1.4 1.4H8a1.4 1.4 0 0 1-1.4-1.4V5A1.4 1.4 0 0 1 8 3.6z",
      "M9.4 10.8a3.4 3.4 0 0 1 5.2 0", "M9.9 13.6a2.6 2.6 0 0 1 4.2 0",
      "M10.8 16.2a1.5 1.5 0 0 1 2.4 0",
    ],
    "money": [
      "M3.4 7.4h17.2v9.2H3.4z",
      "M12 9.2v5.6",
      "M13.7 10.6a1.9 1.9 0 0 0-3.4 1c0 1.7 3.4 1 3.4 2.7a1.9 1.9 0 0 1-3.4.9",
    ],
    "blackmail": [
      "M3.6 5.4h16.8v13.2H3.6z",
      "M6.2 15.8 9.6 12l2.6 2.6L15.4 11l2.4 2.6",
      "M8.6 9.4a1.1 1.1 0 1 0 0-.02z",
    ],
    "ideology": [
      "M12 3.4c3 3.6 5.6 5.6 5.6 9.2a5.6 5.6 0 0 1-11.2 0c0-2.1 1-3.6 2.3-4.8.3 1.5 1 2.2 1.8 2.2 1.2 0 1.7-1.9 1.5-6.6z",
    ],
    "security-clearance": [
      "M6.6 4.6h10.8a1.1 1.1 0 0 1 1.1 1.1v13.8a1.1 1.1 0 0 1-1.1 1.1H6.6a1.1 1.1 0 0 1-1.1-1.1V5.7a1.1 1.1 0 0 1 1.1-1.1z",
      "M10 3.2h4v3.2h-4z",
      "M12 9.4a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2z",
      "M8.6 18a3.4 3.4 0 0 1 6.8 0",
    ],
    "travel": [
      "M12 21c0 0 6.4-7 6.4-11A6.4 6.4 0 1 0 5.6 10c0 4 6.4 11 6.4 11z",
      "M12 7.7a2.3 2.3 0 1 1 0 4.6 2.3 2.3 0 0 1 0-4.6z",
    ],
    "authority": [
      "M12 3 19.4 5.8v5.6c0 4.5-3 8.1-7.4 9.4-4.4-1.3-7.4-4.9-7.4-9.4V5.8z",
      "M12 8.4l1.2 2.5 2.7.4-2 1.9.5 2.7L12 14.6l-2.4 1.3.5-2.7-2-1.9 2.7-.4z",
    ],
  };

  // ---- Lookups -------------------------------------------------------------
  /* The name to show, and the language tag that goes with it. An English name
     shown in a German sheet has to be tagged, or a screen reader announces it
     in the wrong voice; a translated one must NOT be tagged. */
  function entryName(entry, lang) {
    return (lang === "de" && entry.de) ? entry.de : entry.en;
  }
  function entryLang(entry, lang) {
    return (lang === "de" && entry.de) ? null : "en";
  }

  function bySlug(pool, slug) {
    for (var i = 0; i < pool.length; i++) {
      if (pool[i].slug === slug) return pool[i];
    }
    return null;
  }

  // ---- Data ----------------------------------------------------------------
  function emptyState() {
    return {
      /* Standard or expert level. Only the display follows this: switching back
         to standard HIDES the remaining hit points, it does not clear them. The
         printed sheet does not mark the field; the rulebook does. */
      expert: false,
      /* A fresh sheet starts with a single player; more are added as needed. */
      players: [newPlayer()],
      /* The counter table: one row per printed board member, four cells each,
         by position, because the position IS the scenario number. */
      secrets: emptySecrets(),
      /* Scenario #1 and #2: one number apiece. null is "not played yet", which
         is a different thing from a recorded zero — scenario #2 reads #1's
         number as the Alert Level, and zero is a legal answer there. */
      minions: null,
      captives: null,
      /* Scenario #3: one flag per printed Adaptoid environment, keyed by slug.
         Ticked means it was in play when the scenario ended, which is what
         scenario #5 puts back into play. */
      adaptoids: emptyAdaptoids(),
      /* Scenario #4: the minions left standing, as slugs out of the pool. A
         list and not a set of flags, because the sheet prints a write-in area
         with no rows in it. */
      thunderbolts: [],
      /* The evidence cards gained, keyed by slug. THIS is what the sheet holds
         instead of the 27 crossed-out rows; the rows are painted from it. See
         the file header. */
      evidence: emptyEvidence(),
    };
  }

  function newPlayer() {
    return { hero: "", hp: null };
  }

  function emptySecrets() {
    var out = {};
    BOARD.forEach(function (member) {
      var row = [];
      for (var i = 0; i < SCENARIOS; i++) row.push(null);
      out[member.slug] = row;
    });
    return out;
  }

  function emptyAdaptoids() {
    var out = {};
    ADAPTOIDS.forEach(function (entry) { out[entry.slug] = false; });
    return out;
  }

  function emptyEvidence() {
    var out = {};
    EVIDENCE.forEach(function (entry) { out[entry.slug] = false; });
    return out;
  }

  /* Never throws. Starts from emptyState() and overlays only what it
     recognises, so a hand-edited file, a foreign export or a truncated share
     link cannot produce an invalid sheet. Fields this sheet does not have —
     MC60's `scenarios`, MC21's `flags`, MC10's `removed`, MC45's `missions` —
     are simply never read, which is how they get dropped. */
  function normalize(raw) {
    raw = (raw && typeof raw === "object") ? raw : {};
    var out = emptyState();

    out.expert = W.coerceBool(raw.expert);

    /* One to four, whatever arrived: a sheet with nobody on it has no meaning,
       and more than four is not a thing the game does. */
    var players = Array.isArray(raw.players) ? raw.players : [];
    var count = Math.min(MAX_PLAYERS, Math.max(1, players.length));
    out.players = [];
    for (var i = 0; i < count; i++) {
      var p = (players[i] && typeof players[i] === "object") ? players[i] : {};
      out.players.push({
        hero: W.coerceText(p.hero, NAME_MAX),
        hp: W.clampNumber(p.hp === "" ? null : p.hp, 0, HP_MAX),
      });
    }

    /* Rebuilt from BOARD every time: exactly the three printed rows, each
       exactly four cells long, so a short row is filled up and a long one cut
       back. Cells are read BY POSITION because the position is the scenario. */
    var secrets = (raw.secrets && typeof raw.secrets === "object" &&
      !Array.isArray(raw.secrets)) ? raw.secrets : {};
    out.secrets = {};
    BOARD.forEach(function (member) {
      var row = Array.isArray(secrets[member.slug]) ? secrets[member.slug] : [];
      var cells = [];
      for (var s = 0; s < SCENARIOS; s++) {
        cells.push(W.clampNumber(row[s] === "" ? null : row[s], 0, COUNT_MAX));
      }
      out.secrets[member.slug] = cells;
    });

    out.minions = W.clampNumber(raw.minions === "" ? null : raw.minions, 0, COUNT_MAX);
    out.captives = W.clampNumber(raw.captives === "" ? null : raw.captives, 0, COUNT_MAX);

    /* Rebuilt from ADAPTOIDS: exactly the four printed keys, so an invented
       environment is dropped and a missing one reads as not in play. */
    var marked = (raw.adaptoids && typeof raw.adaptoids === "object") ? raw.adaptoids : {};
    out.adaptoids = {};
    ADAPTOIDS.forEach(function (entry) {
      out.adaptoids[entry.slug] = W.coerceBool(marked[entry.slug]);
    });

    /* Unknown minions and repeats go; the ORDER stays as it arrived, because
       the sheet's write-in area prints no rows and so has no order of its own
       to canonicalise. */
    out.thunderbolts = pickList(raw.thunderbolts, THUNDERBOLTS);

    /* Rebuilt from EVIDENCE: exactly the nine printed symbols. DELIBERATELY
       ACCEPTS A COMBINATION THE GAME CANNOT PRODUCE — all three cards of one
       group, or more than six in all. One of each group is in the A.I.M.
       envelope and can never be gained, but which of them is not ours to guess,
       and dropping a tick would overwrite a record instead of showing it. See
       the file header. */
    var gained = (raw.evidence && typeof raw.evidence === "object") ? raw.evidence : {};
    out.evidence = {};
    EVIDENCE.forEach(function (entry) {
      out.evidence[entry.slug] = W.coerceBool(gained[entry.slug]);
    });

    return out;
  }

  /* A growable list of slugs out of a pool: unknown ones and repeats go, the
     order survives. Straight port of MC16's, for the same shape of field. */
  function pickList(raw, pool) {
    var list = Array.isArray(raw) ? raw : [];
    var seen = {}, out = [];
    list.forEach(function (slug) {
      if (typeof slug !== "string" || !bySlug(pool, slug) || seen[slug]) return;
      seen[slug] = true;
      out.push(slug);
    });
    return out;
  }

  /* No migrate(): stateVersion is 1, so there is no older shape in the wild
     yet. The first change to the shape above has to bring one with it — see the
     check in test/lint.js. And whatever is added has to decide what its default
     MEANS for sheets that are already saved: MC60 learned that the hard way,
     where `expert: false` hid hit points people had already written down. */

  /* Counts a hidden hit point value too: at standard level the field is not on
     screen, but what is written there is still on the sheet. */
  function playerHasContent(player) {
    return !!player.hero.trim() || player.hp != null;
  }

  /* Printed starting hit points for a typed hero name, or null. Matched
     case-insensitively against both language names, so it also works when the
     name was typed rather than picked from the suggestions. */
  function startingHealth(name) {
    var key = String(name || "").trim().toLowerCase();
    if (!key) return null;
    var heroes = global.HEROES || [];
    for (var i = 0; i < heroes.length; i++) {
      var h = heroes[i];
      if (String(h.en).toLowerCase() === key || (h.de && String(h.de).toLowerCase() === key)) {
        return h.health;
      }
    }
    return null;
  }

  /* THE RULE OF THE SHEET, in one line: a combination is crossed out as soon as
     any one of its three cards has been gained. Derived on every paint, stored
     nowhere. */
  function isStruck(state, combo) {
    return combo.some(function (slug) { return !!state.evidence[slug]; });
  }

  // ---- Rendering -----------------------------------------------------------
  function panel(id, heading, action) {
    var section = W.el("section", "panel", { "data-section": id, "aria-labelledby": "h-" + id });
    var head = W.el("div", "panel-head");
    var h2 = W.el("h2", null, { id: "h-" + id });
    h2.textContent = heading;
    head.appendChild(h2);
    if (action) head.appendChild(action);
    section.appendChild(head);
    return section;
  }

  /* The second line the sheet prints under a heading badge — here the counter
     table's own title, which the yellow "Notes" badge sits beside rather than
     replaces. MC16's class, for the same reason: printed matter is kept
     visually apart from lines this app writes. */
  function subline(section, text) {
    var p = W.el("p", "sheet-subline");
    p.textContent = text;
    section.appendChild(p);
    return p;
  }

  /* A labelled row inside a player card or a panel. */
  function fieldRow(labelText, control) {
    var row = W.el("div", "player-field");
    var label = W.el("label", "field-label");
    label.textContent = labelText;
    label.appendChild(control);
    row.appendChild(label);
    return row;
  }

  /* One box with its own wording — MC21's shape, used here for the four
     Adaptoid environments and for the nine evidence cards. */
  function flagBox(labelText, cfg) {
    var flag = W.el("label", "flag");
    if (cfg.lead) flag.appendChild(cfg.lead);
    var text = W.el("span", null, cfg.lang ? { lang: cfg.lang } : null);
    text.textContent = labelText;
    flag.appendChild(text);
    flag.appendChild(W.checkbox({
      checked: cfg.checked,
      label: cfg.label || labelText,
      onChange: cfg.onChange,
    }));
    return flag;
  }

  /* One of the nine drawings, as an <svg> that inherits the cell's colour. Not
     W.el: an SVG element is not an HTML element and createElement would build
     an unknown HTML tag that renders nothing. `label` is the card name, so the
     symbol is never the only way to know what it is. */
  function evidenceIcon(slug, label) {
    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "ev-icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", label);
    var title = document.createElementNS(NS, "title");
    title.textContent = label;
    svg.appendChild(title);
    (ICONS[slug] || []).forEach(function (d) {
      var path = document.createElementNS(NS, "path");
      path.setAttribute("d", d);
      svg.appendChild(path);
    });
    return svg;
  }

  function render(root, ctx) {
    var t = ctx.t, lang = ctx.lang, state = ctx.state;

    root.appendChild(renderPlayers(t, lang, state, ctx));
    root.appendChild(renderSecrets(t, lang, state, ctx));

    /* Two and two, the way the page bands them: #1 and #2 share the strip
       beside the counter table, #3 and #4 the strip below it. */
    var top = W.el("div", "scenario-row");
    top.appendChild(renderMinions(t, state, ctx));
    top.appendChild(renderCaptives(t, state, ctx));
    root.appendChild(top);

    var bottom = W.el("div", "scenario-row");
    bottom.appendChild(renderAdaptoids(t, lang, state, ctx));
    bottom.appendChild(renderThunderbolts(t, lang, state, ctx));
    root.appendChild(bottom);

    root.appendChild(renderEvidence(t, lang, state, ctx));

    /* Last, once everything is in the document: a single evidence card strikes
       rows in all three combination tables, and the uniqueness rule spans every
       select of the Thunderbolt list, so neither can be decided while one cell
       is being built. Derived, never stored. */
    paintEvidence(t, state);
    paintThunderbolts();
  }

  function renderPlayers(t, lang, state, ctx) {
    var addBtn = W.el("button", "btn btn-add", { type: "button" });
    addBtn.textContent = t("addPlayer");
    addBtn.disabled = state.players.length >= MAX_PLAYERS;
    addBtn.title = addBtn.disabled ? t("addPlayerFull") : t("addPlayer");
    addBtn.addEventListener("click", function () {
      if (state.players.length >= MAX_PLAYERS) return;
      state.players.push(newPlayer());
      ctx.save();
      ctx.rerender();
    });

    /* The expert switch sits here rather than in a panel of its own: the field
       it governs is in these cards, so the cause is next to what it reveals.
       A re-render, because a field appears and disappears. */
    var expertFlag = W.el("label", "flag");
    var expertText = W.el("span");
    expertText.textContent = t("lblExpert");
    expertFlag.appendChild(expertText);
    expertFlag.appendChild(W.checkbox({
      checked: state.expert,
      label: t("lblExpert"),
      onChange: function (next) {
        state.expert = next;
        ctx.save();
        ctx.rerender();
      },
    }));
    expertFlag.title = t("expertHint");

    var actions = W.el("div", "panel-actions");
    actions.appendChild(expertFlag);
    actions.appendChild(addBtn);

    var section = panel("players", t("secPlayers"), actions);
    /* Drives the column count in styles.css, so the layout follows how many
       players there are instead of how much room happens to be left. */
    var grid = W.el("div", "player-grid", { "data-players": String(state.players.length) });

    /* One shared <datalist> of hero names for all the slots. The identity field
       stays free text: the sheet is a fill-in field, and a hero the roster has
       not caught up with yet must remain typeable. */
    var heroes = global.HEROES || [];
    var listId = "hero-suggestions";
    grid.appendChild(W.dataList(listId, heroes.map(function (h) {
      return (lang === "de" && h.de) ? h.de : h.en;
    })));

    state.players.forEach(function (player, i) {
      var card = W.el("div", "player-card", { "data-player": String(i + 1) });
      var caption = t("playerRow", String(i + 1));

      var head = W.el("div", "player-head");
      var idLabel = W.el("div", "player-name");
      idLabel.textContent = caption;
      head.appendChild(idLabel);

      /* Removing the last player would leave a sheet with nobody on it, so that
         one stays put. Anything else goes, with a confirmation when there is
         something on the card to lose. */
      var last = state.players.length <= 1;
      var del = W.iconButton({
        glyph: "×",
        label: caption + " – " + t("removePlayer"),
        disabled: last,
        lockReason: t("removePlayerLast"),
        onClick: function () {
          if (playerHasContent(player) && !window.confirm(t("confirmRemovePlayer"))) return;
          state.players.splice(i, 1);
          ctx.save();
          /* A full re-render, never a partial redraw: the cards below shift up
             and renumber. */
          ctx.rerender();
        },
      });
      del.classList.add("player-remove");
      head.appendChild(del);
      card.appendChild(head);

      var heroInput = W.textField({
        value: player.hero,
        label: caption + " – " + t("colIdentity"),
        placeholder: t("identityPlaceholder"),
        maxLength: NAME_MAX,
        listId: listId,
        onChange: function (next) {
          player.hero = next;
          ctx.save();
          updateHpHint();
          markDuplicates();
        },
      });
      card.appendChild(fieldRow(t("colIdentity"), heroInput));

      /* Expert only. The printed sheet does not mark this field, but every
         scenario's victory list records it as "Expert Campaign Only", where it
         sets the starting hit points of the next scenario. Hidden at standard
         level, never cleared, so it is still in the export and in a share
         link. */
      var hpField = null;
      if (state.expert) {
        hpField = W.numberField({
          value: player.hp,
          min: 0, max: HP_MAX,
          label: caption + " – " + t("colHp"),
          hint: startingHealth(player.hero),
          onChange: function (next) { player.hp = next; ctx.save(); },
        });
        card.appendChild(fieldRow(t("colHp"), hpField));
      }

      /* The hero's printed starting hit points, as a reminder of what full
         health was. Rewritten in place rather than by re-rendering the panel,
         which would take the focus out of the field being typed in. */
      function updateHpHint() {
        if (!hpField) return;               // standard level: no such field
        var hint = hpField.querySelector(".num-hint");
        var h = startingHealth(player.hero);
        hint.textContent = h ? "/ " + h : "";
      }

      grid.appendChild(card);
    });

    /* Two players cannot field the same hero. The paper sheet does not stop
       you, so neither do we — but a quiet marker beats silently allowing a typo
       to look correct. */
    function markDuplicates() {
      var counts = {};
      state.players.forEach(function (p) {
        var key = p.hero.trim().toLowerCase();
        if (key) counts[key] = (counts[key] || 0) + 1;
      });
      Array.prototype.forEach.call(grid.querySelectorAll(".player-card"), function (card, i) {
        var key = state.players[i].hero.trim().toLowerCase();
        var dupe = !!key && counts[key] > 1;
        card.classList.toggle("is-duplicate", dupe);
        var input = card.querySelector(".text-input");
        if (input) input.title = dupe ? t("duplicateHero") : "";
      });
    }
    markDuplicates();

    section.appendChild(grid);
    return section;
  }

  /* The counter table: board members down the side, the four scenarios across.
     The heading is the yellow badge the sheet prints, "Notes"; the table's own
     printed title goes under it as a subline, because that is how the paper
     stacks the two. */
  function renderSecrets(t, lang, state, ctx) {
    var section = panel("secrets", t("secNotes"));
    subline(section, t("subSecrets"));

    var table = W.el("table", "sheet-table sc-table");
    var caption = W.el("caption", "sr-only");
    caption.textContent = t("subSecrets");
    table.appendChild(caption);

    var thead = W.el("thead");
    var hrow = W.el("tr");
    var first = W.el("th", null, { scope: "col" });
    first.textContent = t("colBoardMember");
    hrow.appendChild(first);
    for (var s = 0; s < SCENARIOS; s++) {
      var th = W.el("th", null, { scope: "col" });
      th.textContent = t("colScenarioNum", String(s + 1));
      hrow.appendChild(th);
    }
    thead.appendChild(hrow);
    table.appendChild(thead);

    var tbody = W.el("tbody");
    BOARD.forEach(function (member) {
      var name = entryName(member, lang);
      var tr = W.el("tr");

      var rowHead = W.el("th", "card-name", { scope: "row", lang: entryLang(member, lang) });
      rowHead.textContent = name;
      tr.appendChild(rowHead);

      state.secrets[member.slug].forEach(function (value, at) {
        var label = t("colScenarioNum", String(at + 1));
        var td = W.el("td", null, { "data-label": label });
        td.appendChild(W.numberField({
          value: value,
          min: 0, max: COUNT_MAX,
          /* Row and column together: a bare number field in a grid is
             otherwise unnameable. */
          label: name + " – " + t("secScenario", String(at + 1)),
          onChange: function (next) {
            state.secrets[member.slug][at] = next;
            ctx.save();
          },
        }));
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    section.appendChild(table);
    return section;
  }

  /* Scenario #1 and #2 are one number each, and the panel heading is the
     scenario badge, so the printed line above the field is the caption. */
  function renderMinions(t, state, ctx) {
    var section = panel("scenario1", t("secScenario", "1"));
    section.appendChild(fieldRow(t("lblMinions"), W.numberField({
      value: state.minions,
      min: 0, max: COUNT_MAX,
      label: t("lblMinions"),
      onChange: function (next) { state.minions = next; ctx.save(); },
    })));
    return section;
  }

  function renderCaptives(t, state, ctx) {
    var section = panel("scenario2", t("secScenario", "2"));
    section.appendChild(fieldRow(t("lblCaptives"), W.numberField({
      value: state.captives,
      min: 0, max: COUNT_MAX,
      label: t("lblCaptives"),
      onChange: function (next) { state.captives = next; ctx.save(); },
    })));
    return section;
  }

  /* One caption over four named boxes — MC21's shape, and the sheet's. The
     caption is printed matter and the box itself is the "mark it in the
     campaign log" of the rule, so no box prints its own instruction. */
  function renderAdaptoids(t, lang, state, ctx) {
    var section = panel("scenario3", t("secScenario", "3"));

    var wrap = W.el("div", "player-field");
    var label = W.el("div", "field-label");
    label.textContent = t("lblAdaptoids");
    wrap.appendChild(label);

    var row = W.el("div", "flag-row");
    ADAPTOIDS.forEach(function (entry) {
      row.appendChild(flagBox(entryName(entry, lang), {
        lang: entryLang(entry, lang),
        checked: state.adaptoids[entry.slug],
        label: t("lblAdaptoids") + " – " + entryName(entry, lang),
        onChange: function (next) {
          state.adaptoids[entry.slug] = next;
          ctx.save();
        },
      }));
    });
    wrap.appendChild(row);
    section.appendChild(wrap);

    /* What a tick means here is not obvious from the caption: it is not "was
       defeated" but "was still in play", and scenario #5 puts exactly those
       back on the table. */
    var hint = W.el("p", "hint");
    hint.textContent = t("adaptoidHint");
    section.appendChild(hint);
    return section;
  }

  function renderThunderbolts(t, lang, state, ctx) {
    var section = panel("scenario4", t("secScenario", "4"));

    /* Sorted by the name actually shown, so the list stays alphabetical in
       whichever language it is read in — and sorted on a COPY, because
       THUNDERBOLTS is the printed-order table everything else reads. */
    var options = THUNDERBOLTS.map(function (entry) {
      return {
        value: entry.slug,
        label: entryName(entry, lang),
        lang: entryLang(entry, lang),
      };
    }).sort(function (a, b) { return a.label.localeCompare(b.label, lang); });

    section.appendChild(W.poolList({
      listId: "aos-thunderbolts",
      label: t("lblThunderbolts"),
      getArray: function () { return state.thunderbolts; },
      options: options,
      placeholder: t("thunderboltPlaceholder"),
      addLabel: t("addThunderbolt"),
      removeLabel: t("removeEntry"),
      removeConfirm: t("confirmRemoveEntry"),
      selectLabel: function (at) {
        return t("lblThunderbolts") + " " + (at + 1);
      },
      attrs: function (at) { return { "data-thunderbolt": String(at) }; },
      onChange: function () {
        ctx.save();
        paintThunderbolts();
      },
    }));
    return section;
  }

  /* No minion survives twice, so a name already on the list is closed to the
     other rows. One pass over every select at once, which is the only shape
     syncUnique() takes — and off the document rather than off the widget,
     because poolList calls onChange from inside its own first draw, before the
     node it returns exists. Called again from render() once the panel is in
     the document, where the first call found nothing. */
  function paintThunderbolts() {
    W.syncUnique(Array.prototype.slice.call(
      document.querySelectorAll("[data-thunderbolt]")));
  }

  /* The combination block: the nine evidence cards as boxes, then the three
     printed tables that follow from them. */
  function renderEvidence(t, lang, state, ctx) {
    var section = panel("evidence", t("secEvidence"));

    /* The boxes are NOT on the paper — the paper is crossed out with a pen.
       They are the field this sheet actually keeps, so they are named for what
       they are and the line under them says what ticking one does. */
    var gained = W.el("div", "player-field");
    var caption = W.el("div", "field-label");
    caption.textContent = t("lblGained");
    gained.appendChild(caption);

    GROUPS.forEach(function (group) {
      var line = W.el("div", "ev-group");
      var name = W.el("span", "ev-group-name");
      name.textContent = t(group.label);
      line.appendChild(name);

      var row = W.el("div", "flag-row");
      EVIDENCE.forEach(function (entry) {
        if (entry.group !== group.key) return;
        var label = entryName(entry, lang);
        var flag = flagBox(label, {
          lang: entryLang(entry, lang),
          lead: evidenceIcon(entry.slug, label),
          checked: state.evidence[entry.slug],
          label: t("lblGained") + " – " + label,
          onChange: function (next) {
            state.evidence[entry.slug] = next;
            ctx.save();
            /* In place: no control appears or disappears, only which rows are
               crossed out, which box is closed and which name turns red — and
               those sit in three different tables and in two other groups. The
               MC27/MC32/MC40/MC45 rule. */
            paintEvidence(t, state);
          },
        });
        /* How paintEvidence() finds the box and its wording again. Written out
           rather than computed: setAttribute() lowercases an attribute name on
           an HTML element, so a computed camelCase one would land silently
           mangled. */
        flag.setAttribute("data-evidence", entry.slug);
        flag.querySelector(".sheet-check").setAttribute("data-evidence-box", entry.slug);
        row.appendChild(flag);
      });
      line.appendChild(row);
      gained.appendChild(line);
    });
    section.appendChild(gained);

    var hint = W.el("p", "hint");
    hint.textContent = t("evidenceHint");
    section.appendChild(hint);

    var grid = W.el("div", "ev-grid");
    BOARD.forEach(function (member) {
      grid.appendChild(renderCombos(t, lang, member));
    });
    section.appendChild(grid);
    return section;
  }

  /* One board member's nine printed rows. Nothing in here is a control: the
     table is read, and what it says is decided by the boxes above it. */
  function renderCombos(t, lang, member) {
    var wrap = W.el("div", "ev-block");

    var name = W.el("p", "ev-block-name", { lang: entryLang(member, lang) });
    name.textContent = entryName(member, lang);
    wrap.appendChild(name);

    var table = W.el("table", "sheet-table ev-table");
    var caption = W.el("caption", "sr-only");
    caption.textContent = t("secEvidence") + " – " + entryName(member, lang);
    table.appendChild(caption);

    var thead = W.el("thead");
    var hrow = W.el("tr");
    GROUPS.forEach(function (group) {
      var th = W.el("th", null, { scope: "col" });
      th.textContent = t(group.label);
      hrow.appendChild(th);
    });
    thead.appendChild(hrow);
    table.appendChild(thead);

    var tbody = W.el("tbody");
    COMBOS[member.slug].forEach(function (combo, at) {
      /* How paintEvidence() finds this row again, and the only place the row's
         identity is written down. */
      var tr = W.el("tr", null, { "data-combo": member.slug + "-" + at });
      combo.forEach(function (slug, col) {
        var entry = bySlug(EVIDENCE, slug);
        var label = entryName(entry, lang);
        /* --ev is the measured cell colour; the strike that crosses the row out
           is drawn over it in styles.css. */
        var td = W.el("td", "ev-cell", {
          "data-label": t(GROUPS[col].label),
          style: "--ev: var(--ev-" + slug + ")",
        });
        td.appendChild(evidenceIcon(slug, label));
        /* Spelled out under the symbol only where the table has stopped being a
           table — see the note in styles.css. The symbol carries the name as
           its accessible name at every width. */
        var text = W.el("span", "ev-name", { lang: entryLang(entry, lang) });
        text.textContent = label;
        td.appendChild(text);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }

  /* The whole of what the nine boxes do, derived every time and stored nowhere,
     so an import, an old #log= link and a click all end up in the same place.

     TWO THINGS, and the second one is the campaign's payoff. First, a printed
     combination is crossed out as soon as one of its three cards has been
     gained — the rule quoted in the file header. Second, the deduction: three
     cards make up each group and exactly ONE of them is sealed in the A.I.M.
     envelope, so once the other two have been gained the third is the mole's,
     and it can never be gained. Its box is closed, because there is nothing
     left to record there, and its name is called out: that name IS the answer
     the whole campaign is played for.

     THE CLOSING IS ONE-SIDED, the MC60/MC32/MC40/MC45 rule. Only an UNTICKED
     box is ever closed. A sheet that arrives with all three cards of a group
     ticked — from an import, a hand-edited file or an old link — is impossible
     in play, and normalize() keeps it rather than picking which tick to throw
     away; with three ticked the count is not two, so nothing closes and the way
     out stays on screen. The tables say the rest by striking every row. */
  function paintEvidence(t, state) {
    GROUPS.forEach(function (group) {
      var cards = EVIDENCE.filter(function (entry) {
        return entry.group === group.key;
      });
      var gained = cards.filter(function (entry) {
        return state.evidence[entry.slug];
      }).length;

      cards.forEach(function (entry) {
        var deduced = gained === 2 && !state.evidence[entry.slug];
        var flag = document.querySelector('[data-evidence="' + entry.slug + '"]');
        if (flag) flag.classList.toggle("is-deduced", deduced);
        var box = document.querySelector('[data-evidence-box="' + entry.slug + '"]');
        if (!box) return;
        box.disabled = deduced;
        box.title = deduced ? t("evidenceDeduced")
          : (box.getAttribute("aria-label") || "");
      });
    });

    BOARD.forEach(function (member) {
      COMBOS[member.slug].forEach(function (combo, at) {
        var tr = document.querySelector('[data-combo="' + member.slug + "-" + at + '"]');
        if (tr) tr.classList.toggle("is-struck", isStruck(state, combo));
      });
    });
  }

  // ---- Print ---------------------------------------------------------------
  function renderPrint(root, ctx) {
    var t = ctx.t, lang = ctx.lang, state = ctx.state;

    var players = printSection(root, t("secPlayers"));
    /* First, because it decides what the rest of this section even means. */
    printLine(players, (state.expert ? "[x] " : "[ ] ") + t("lblExpert"));
    state.players.forEach(function (p, i) {
      if (!playerHasContent(p)) return;
      var line = t("playerRow", String(i + 1)) + ": " + (p.hero || "—");
      /* The hidden field stays out of the printout too, so a standard sheet
         does not print a rule it is not playing. It is still in the state. */
      if (state.expert) {
        line += " · " + t("colHp") + ": " + (p.hp == null ? "—" : String(p.hp));
      }
      printLine(players, line);
    });

    /* One line per board member, its four scenarios in printed order. An empty
       cell prints as a dash rather than as a zero: nothing recorded is not the
       same as no counters left, and scenario #2 reads this number back. The
       colon after the column name is not on the paper and is there because a
       run of text has no columns: "#1 0" reads as ten at a glance. */
    var sc = printSection(root, t("secNotes"));
    printLine(sc, t("subSecrets"));
    BOARD.forEach(function (member) {
      var cells = state.secrets[member.slug].map(function (v, at) {
        return t("colScenarioNum", String(at + 1)) + ": " + (v == null ? "—" : String(v));
      });
      var line = W.el("p", "print-line");
      var name = W.el("span", null, { lang: entryLang(member, lang) });
      name.textContent = entryName(member, lang);
      line.appendChild(name);
      line.appendChild(document.createTextNode(": " + cells.join(" · ")));
      sc.appendChild(line);
    });

    var s1 = printSection(root, t("secScenario", "1"));
    printLine(s1, t("lblMinions") + ": " +
      (state.minions == null ? "—" : String(state.minions)));

    var s2 = printSection(root, t("secScenario", "2"));
    printLine(s2, t("lblCaptives") + ": " +
      (state.captives == null ? "—" : String(state.captives)));

    /* Every environment on its own line, marked or not: which ones were NOT in
       play matters as much as which were, because scenario #5 puts back exactly
       what is ticked here. */
    var s3 = printSection(root, t("secScenario", "3"));
    printLine(s3, t("lblAdaptoids"));
    ADAPTOIDS.forEach(function (entry) {
      var on = state.adaptoids[entry.slug];
      var line = W.el("p", "print-line");
      line.appendChild(document.createTextNode(on ? "[x] " : "[ ] "));
      var name = W.el("span", null, { lang: entryLang(entry, lang) });
      name.textContent = entryName(entry, lang);
      line.appendChild(name);
      s3.appendChild(line);
    });

    var s4 = printSection(root, t("secScenario", "4"));
    printLine(s4, t("lblThunderbolts"));
    if (!state.thunderbolts.length) {
      printLine(s4, "—");
    } else {
      state.thunderbolts.forEach(function (slug) {
        var entry = bySlug(THUNDERBOLTS, slug);
        if (!entry) return;
        var line = W.el("p", "print-line", { lang: entryLang(entry, lang) });
        line.textContent = entryName(entry, lang);
        s4.appendChild(line);
      });
    }

    /* Both halves, and the file header says why: the nine boxes are what this
       sheet keeps, and the 27 rows are what the paper prints. Leaving either
       out would print something that is not the campaign log. */
    var ev = printSection(root, t("secEvidence"));
    printLine(ev, t("lblGained"));
    EVIDENCE.forEach(function (entry) {
      var on = state.evidence[entry.slug];
      var line = W.el("p", "print-line");
      line.appendChild(document.createTextNode(on ? "[x] " : "[ ] "));
      var name = W.el("span", null, { lang: entryLang(entry, lang) });
      name.textContent = entryName(entry, lang);
      line.appendChild(name);
      ev.appendChild(line);
    });

    BOARD.forEach(function (member) {
      var head = W.el("p", "print-line print-subhead", { lang: entryLang(member, lang) });
      head.textContent = entryName(member, lang);
      ev.appendChild(head);

      COMBOS[member.slug].forEach(function (combo) {
        var struck = isStruck(state, combo);
        var line = W.el("p", "print-line");
        combo.forEach(function (slug, col) {
          var entry = bySlug(EVIDENCE, slug);
          if (col) line.appendChild(document.createTextNode(" · "));
          var name = W.el("span", struck ? "struck" : null,
            { lang: entryLang(entry, lang) });
          name.textContent = entryName(entry, lang);
          line.appendChild(name);
        });
        ev.appendChild(line);
      });
    });
  }

  function printSection(root, heading) {
    var section = W.el("section", "print-section");
    var h2 = W.el("h2");
    h2.textContent = heading;
    section.appendChild(h2);
    root.appendChild(section);
    return section;
  }

  function printLine(parent, text) {
    var line = W.el("p", "print-line");
    line.textContent = text;
    parent.appendChild(line);
    return line;
  }

  // ---- Registration --------------------------------------------------------
  global.registerCampaign({
    id: "agents-of-shield",
    code: "MC50",
    titleEn: "Agents of S.H.I.E.L.D.",
    /* The German edition keeps the English campaign title, as this project does
       throughout — and the German rulebook says so itself, writing "die
       Kampagne Agents of S.H.I.E.L.D." wherever it names it. */
    titleDe: "Agents of S.H.I.E.L.D.",
    /* One letter away from MC45's "aoa", and a typo in either direction is
       silent in CSS: the sheet would simply render in the base palette.
       test/lint.js checks that no two campaigns share a theme key. */
    theme: "aos",
    stateVersion: 1,

    emptyState: emptyState,
    normalize: normalize,
    render: render,
    renderPrint: renderPrint,

    helpDe: "Der MC50-Bogen ist der vollste von allen: vier Spielerfelder, eine kleine Zählertabelle, vier Szenariokästen und darunter ein Block aus 81 gedruckten Zellen, der fast die halbe Seite einnimmt. Oben stehen Identität und verbleibende Lebenspunkte. Darunter, unter dem gelben Abzeichen „Notizen“, die Tabelle „Verbleibende Geheimnismarker nach Szenario“: drei Direktoriumsmitglieder mal vier Szenarien, also zwölf Zahlen. Der Spielaufbau jedes Szenarios legt genau so viele Geheimnismarker wieder aus, wie hier für das vorige stehen — deshalb ist ein leeres Feld etwas anderes als eine eingetragene Null, und der Druck zeigt es als Strich. Szenario 1 hält die Zahl der Schergen und Nebenpläne im Spiel fest, die Szenario 2 als Alarmstufe wieder einliest; Szenario 2 die Zahl der befreiten Gefangenen, die Szenario 3 in Schlossmarker umrechnet. Szenario 3 hat vier benannte Kästchen für die Adaptoid-Umgebungen: das Häkchen heißt nicht „besiegt“, sondern „war am Ende noch im Spiel“, und genau die legt Szenario 5 wieder aus. Szenario 4 sammelt die überlebenden Thunderbolts als alphabetische Auswahlliste; kein Scherge kann zweimal überleben, deshalb schließt ein gewählter Name sich für die anderen Zeilen. Die Liste führt Namen, keine Karten — „Atlas“ ist auf zwei verschiedenen Karten gedruckt, und der Bogen verlangt den Namen. Der große Block sind die Beweiskombinationen. Auf dem Papier stehen dort 27 Zeilen zum Durchstreichen, neun je Direktoriumsmitglied, und zusammen sind sie alle 27 Kombinationen aus drei Mitteln, drei Motiven und drei Gelegenheiten. Das Regelheft sagt, wie gestrichen wird: „Zieht jede Kombination aus Mittel, Motiv und Gelegenheit im Kampagnenlogbuch durch, die das Symbol auf der neuen Beweiskarte zeigen.“ Damit hängt jede Durchstreichung allein daran, welche Beweiskarten ihr erhalten habt — und genau die neun Karten sind es, die hier angehakt werden. Die Tabelle darunter wird daraus gerechnet und nichts an ihr wird einzeln eingetragen. Und daraus fällt die Pointe der Kampagne: je Gruppe liegt genau eine der drei Karten im A.I.M.-Umschlag, sind also zwei erhalten, ist die dritte die des Maulwurfs. Ihr Kästchen wird zugemacht — es gibt dort nichts mehr einzutragen — und ihr Name steht rot da. Das Zumachen ist einseitig: geschlossen wird nur ein Kästchen ohne Häkchen. Kommt ein Bogen aus einem Import oder einem alten Link mit allen drei Karten einer Gruppe an, was im Spiel nicht vorkommen kann, friert er deshalb nicht ein — es sind dann nicht zwei, also schließt nichts, und die ganze Tabelle streicht sich durch, was von allein sagt, dass etwas nicht stimmt. Die neun Symbole sind hier gezeichnet, nicht die Kunst des Herausgebers, und jedes trägt seinen Kartennamen — in der Legende sichtbar und für Screenreader als Beschriftung. Die neun Kartennamen sind eingetragen; der gedruckte Bogen nennt keine, sie stammen also nicht vom Papier. Englisch bleiben vorerst die Namen der Thunderbolt-Schergen. Oben im Spielerbereich steht der Haken „Expertenmodus“. Wie bei MC40 und MC45 kennzeichnet der gedruckte Bogen die verbleibenden Lebenspunkte nicht als Expertenfeld, das Regelheft aber schon: unter „Bleibender Schaden“ und in jeder Siegliste als „Nur Experten-Kampagne“. Auf Standardstufe blendet der Bogen das Feld aus. Ausblenden heißt nicht löschen — der Wert bleibt im Bogen, im Export und im Share-Link. Und was der Bogen nicht hat, hat er bewusst nicht: keine Szenario-Tabelle, kein „Abgeschlossen“, keinen Fortschritt und kein Notizfeld. Das gelbe „Notizen“ ist der Titel der Zählertabelle, kein Feld. Zu Szenario 5 steht auf dem Papier nichts, weil dessen Spielaufbau die Zahlen von Szenario 4 liest.",
    helpEn: "The MC50 sheet is the fullest of them all: four player panels, one small counter table, four scenario boxes, and below them a block of 81 printed cells that takes up nearly half the page. At the top sit the identity and the remaining hit points. Below that, under the yellow “Notes” badge, is the table “Remaining Secret Counters by Scenario”: three board members by four scenarios, twelve numbers. Every scenario's setup puts back exactly as many secret counters as are recorded here for the previous one — which is why an empty cell is a different thing from a recorded zero, and the printout shows it as a dash. Scenario #1 records the minions and side schemes in play, which scenario #2 reads back as its Alert Level; scenario #2 records the rescued captives, which scenario #3 turns into lock counters. Scenario #3 has four named boxes for the Adaptoid environments, and a tick there does not mean “defeated” but “still in play at the end” — those are the ones scenario #5 puts back into play. Scenario #4 collects the surviving Thunderbolts as an alphabetical pick list; no minion survives twice, so a name already chosen is closed to the other rows. The list holds names rather than cards — two different cards are printed “Atlas”, and the sheet asks for the name. The big block is the evidence combinations. On paper there are 27 rows to cross out, nine under each board member, and between them they are all 27 combinations of three means, three motives and three opportunities. The rulebook says how the crossing out works: “cross out each combination of means, motive, and opportunity in the campaign log that includes the icon on the evidence card gained.” Every strike therefore follows from which evidence cards you have gained and from nothing else — and those nine cards are what is ticked here. The table below them is computed from that; nothing in it is entered row by row. And out of it falls the campaign's payoff: each group has exactly one of its three cards sealed in the A.I.M. envelope, so once two have been gained the third is the mole's. Its box is closed — there is nothing left to record there — and its name is called out in red. The closing is one-sided: only a box without a tick is ever closed. A sheet arriving from an import or an old share link with all three cards of a group ticked, which cannot happen in play, therefore does not freeze — three is not two, so nothing closes, and the whole table crosses itself out, which says by itself that something is off. The nine symbols are drawn here rather than taken from the publisher's artwork, and each carries its card's name — visible in the legend and as the accessible name for a screen reader. The nine card names are entered in German; the printed sheet names no cards at all, so they did not come off the paper. The Thunderbolt minions keep their English names for now. At the top of the player area sits the “Expert level” box. As with MC40 and MC45, the printed sheet does not mark the remaining hit points as an expert field, while the rulebook does: under PERSISTENT DAMAGE, and in every victory list as “Expert Campaign Only”. At standard level the sheet hides the field. Hiding is not clearing — the value stays in the sheet, in the export and in a share link. And what the sheet does not have, it deliberately does not have: no scenario table, no “completed”, no progress counter and no notes field. The yellow “Notes” is the title of the counter table, not a field. Scenario #5 appears nowhere on the paper, because its setup reads scenario #4's numbers.",

    /* Zwei Gruppen, und die Unterscheidung sagt, wer eine Änderung entscheidet:

       1. Wörter, die diese App selbst wählt — Spaltentitel, Platzhalter,
          Hinweise und das gemeinsame Vokabular aller Kampagnen („Verbleibende
          Lebenspunkte“, „Spieler-Informationen“) — sind wörtlich aus
          campaigns/age-of-apocalypse.js übernommen und gehören dorthin
          abgeglichen, nicht hier neu formuliert. Sie stehen sofort auf Deutsch.
          Der gedruckte MC50-Bogen setzt „Spielerinformationen“ ohne Bindestrich;
          hier gewinnt das gemeinsame Vokabular, weil dasselbe Feld über alle
          Kampagnen hinweg gleich heißen muss — eine Entscheidung, kein
          Übersehen. Dieselbe Entscheidung steht in MC45.
       2. Wörter, die vom gedruckten Bogen kommen — die Abschnittsnamen, die
          Zeilen- und Spaltentitel und die vier Szenariozeilen — stehen wörtlich
          so da, wie der deutsche Druck sie setzt: Seite 24 von
          "marvel-champions-agents-of-shield-841333129637-regel.pdf". Wer eine
          davon ändert, ändert eine Aussage über das Papier und braucht das
          Papier dazu. Die Kartennamen selbst stehen in den Tabellen oben, nicht
          hier, weil sie zu ihrem Symbol gehören.

       Eine Eigenheit in Gruppe 2, die auffällt und keine ist: `colOpportunity`
       heißt deutsch „Gelegenheit“ und englisch „Opp.“. Der englische Bogen
       kürzt die Spalte ab, der deutsche nicht — beide Wörterbücher folgen ihrem
       eigenen Druck, und weil die Legende dieselben drei Spaltentitel benutzt
       wie die Tabelle, steht die Abkürzung auch dort. Ein zweites, ausgeschrie-
       benes Wort dafür wäre eine erfundene Beschriftung.

       Und wer eine ändert, liest helpDe/helpEn mit: die beiden zitieren die
       Abschnittsnamen, also werden sie zur Lüge, sobald ein Name wandert.

       Es migriert nichts, wenn sich eine Beschriftung ändert — persistiert
       werden nur Feldschlüssel und Slugs, nie Beschriftungen. */
    i18n: {
      de: {
        secPlayers: "Spieler-Informationen",

        /* "%s" = Spielernummer. */
        playerRow: "Spieler #%s",
        colIdentity: "Identität",
        colHp: "Verbleibende Lebenspunkte",
        identityPlaceholder: "Held …",
        lblExpert: "Expertenmodus",
        expertHint: "Nur auf Expertenstufe werden verbleibende Lebenspunkte festgehalten. Ausschalten blendet sie aus, löscht sie aber nicht.",
        addPlayer: "+ Spieler",
        addPlayerFull: "Mehr als vier Spieler kennt das Spiel nicht.",
        removePlayer: "Spieler entfernen",
        removePlayerLast: "Der letzte Spieler kann nicht entfernt werden.",
        confirmRemovePlayer: "Diesen Spieler samt Eintragungen entfernen?",
        duplicateHero: "Dieser Held ist schon einem anderen Spieler zugeordnet.",

        lblGained: "Erhaltene Beweiskarten",
        evidenceHint: "Ein Häkchen streicht jede Kombination durch, die dieses Symbol zeigt. Die Tabellen darunter werden daraus gerechnet und nicht einzeln eingetragen. Sind zwei Karten einer Gruppe erhalten, liegt die dritte im A.I.M.-Umschlag: sie ist nicht mehr anhakbar und steht rot da — das ist der Beweis des Maulwurfs.",
        evidenceDeduced: "Diese Karte liegt im A.I.M.-Umschlag und kann nicht mehr erhalten werden: die beiden anderen dieser Gruppe sind gefunden. Sie gehört zum Maulwurf.",
        adaptoidHint: "Ein Häkchen heißt „war am Ende des Szenarios noch im Spiel“ — genau diese Umgebungen legt Szenario 5 wieder aus.",
        thunderboltPlaceholder: "Scherge …",
        addThunderbolt: "+ Scherge",

        /* ---- Wörtlich vom gedruckten Bogen, Seite 24 ---------------------- */
        secNotes: "Notizen",
        subSecrets: "Verbleibende Geheimnismarker nach Szenario",
        colBoardMember: "Direktoriumsmitglied",
        /* "%s" = Szenarionummer. Der Bogen setzt in der Kopfzeile nur "#1". */
        colScenarioNum: "#%s",
        /* "%s" = Szenarionummer, wie die Abzeichen "SZENARIO 1" des Bogens. */
        secScenario: "Szenario %s",
        lblMinions: "Schergen und Nebenpläne im Spiel",
        lblCaptives: "Befreite Gefangene",
        lblAdaptoids: "Adaptoid-Umgebungen",
        lblThunderbolts: "Überlebende Thunderbolts",
        secEvidence: "Beweiskombinationen",
        colMeans: "Mittel",
        colMotive: "Motiv",
        colOpportunity: "Gelegenheit",
      },
      en: {
        secPlayers: "Player Information",

        playerRow: "Player #%s",
        colIdentity: "Identity",
        colHp: "Remaining hit points",
        identityPlaceholder: "Hero …",
        lblExpert: "Expert level",
        expertHint: "The remaining hit points are only recorded at expert level. Switching off hides them, it does not clear them.",
        addPlayer: "+ Player",
        addPlayerFull: "The game does not go beyond four players.",
        removePlayer: "Remove player",
        removePlayerLast: "The last player cannot be removed.",
        confirmRemovePlayer: "Remove this player along with what is filled in?",
        duplicateHero: "This hero is already assigned to another player.",

        lblGained: "Evidence cards gained",
        evidenceHint: "A tick crosses out every combination showing that icon. The tables below follow from it and are not filled in row by row. Once two cards of a group have been gained, the third is the one in the A.I.M. envelope: it stops being tickable and is called out in red — that is the mole's evidence.",
        evidenceDeduced: "This card is in the A.I.M. envelope and can never be gained: the other two of its group have been found. It is the mole's.",
        adaptoidHint: "A tick means “still in play when the scenario ended” — those are the environments scenario #5 puts back into play.",
        thunderboltPlaceholder: "Minion …",
        addThunderbolt: "+ Minion",

        secNotes: "Notes",
        subSecrets: "Remaining Secret Counters by Scenario",
        colBoardMember: "Board Member",
        colScenarioNum: "#%s",
        secScenario: "Scenario %s",
        lblMinions: "Minions and side schemes in play",
        lblCaptives: "Rescued captives",
        lblAdaptoids: "Adaptoid environments",
        lblThunderbolts: "Surviving Thunderbolts",
        secEvidence: "Evidence Combinations",
        colMeans: "Means",
        colMotive: "Motive",
        colOpportunity: "Opp.",
      },
    },
  });
}(window));

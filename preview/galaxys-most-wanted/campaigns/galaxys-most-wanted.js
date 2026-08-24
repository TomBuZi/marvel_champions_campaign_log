/* Marvel Champions — "The Galaxy's Most Wanted" (MC16) campaign log.

   Two printed pages, 540 by 540 points each, and the only sheet so far whose
   player block is a shopping list. Four player columns run across both pages,
   and under them the sheet asks for money and for the cards bought with it.
   Below that come four shared boxes. That is the whole sheet.

   THE ONE FIELD THIS SHEET DOES NOT COPY. The paper prints "Unspent Units" and
   expects a pencil: you write the running balance, and every purchase means
   rubbing it out and writing a smaller one. What is entered here instead is the
   units EARNED, and the unspent balance is computed from it — earned minus the
   unit cost of the Market cards recorded beside it. The reason is that this
   sheet already knows every one of those costs, so asking a second time for
   their difference is asking the reader to do arithmetic the file can do; and
   an "unspent" number that silently disagrees with the cards listed next to it
   is a bug nobody can see. A negative balance is shown rather than clamped:
   overspending is a mistake worth pointing at, not one worth hiding.

   THE COMPUTED BALANCE HAS ONE BLIND SPOT, and it is stated on screen rather
   than buried here. Market cards are not the only thing units buy: at expert
   level the setup of scenarios #2 to #5 lets each player "subtract 1 unit from
   their respective Unspent Units box in the campaign log to heal their identity
   to its printed hit point value". Nothing on the sheet records that a player
   did so, so nothing can subtract it. The player panel says as much whenever
   the expert switch is on.

   THERE IS NO SCENARIO #5. Ronan the Accuser does not appear on the log once:
   "Headhunter Defeated?" is subtitled "Victory for Scenarios #1 – 4", and
   scenario #5's Victory step in the rulebook is one sentence — "Ronan the
   Accuser is defeated and the players win the campaign!" — with nothing to
   record. There is also no scenario table, no "completed", no progress counter
   and no notes field. Those absences are the sheet, not an omission.

   NO ICON FONT ON THIS SHEET. The span sweep over both pages returns Exo2,
   Exo2-ExtraBoldItalic and KomikaTitle and not one MarvelLCGIcons glyph, so
   there is no {pp} marker here, unlike MC27. The publisher's icons appear only
   on the card images inside the rulebook, which this project does not
   reproduce.

   WHAT EACH FIELD HOLDS, derived from the print plus the rulebook, never from
   memory. Counts come off the vector rectangles and divider lines of the
   content stream, not off the rendered image:

     * Four player panels, two per page (#CCC2CD 256x322 for players 1 and 3,
       #A5CFFF 255x322 for players 2 and 4), each printing an identity line,
       "Remaining Hit Points (Expert)" and "Unspent Units".
     * "Market Cards in Player's Deck" and "Cards in The Collection" are ONE
       heading each, spanning all four columns, with a write-in area per player
       underneath. That is the MC21 shape — one caption over named boxes — so
       each is a panel of its own here rather than a field repeated inside every
       player card, which would print its subtitle four times over.
     * "Galactic Artifacts Side Schemes in the Victory Display": field #CCC2CD
       512x122 with three 2pt rules #51317B at y 426.3, 456.6 and 486.9, so
       EXACTLY FOUR rows. Cross-checked against the cards rather than trusted:
       the `galactic_artifacts` set contains exactly four side schemes, and
       scenario #4's setup names exactly those four.
     * "Power Stone Control" and "Evasion Counters": one #A5CFFF field each,
       203x46 and 203x45, one line apiece.
     * "Headhunter Defeated?": EXACTLY FOUR #A5CFFF boxes, 22x22 at
       (329.3, 401.3), (480.4, 401.3), (329.3, 463.5) and (480.4, 463.5) —
       one per scenario tile, and the tiles are scenarios 1 to 4.

   THE FOUR ARTIFACTS ARE A SET, NOT A LIST. The paper numbers its four lines,
   which is what turned MC40's three marauder lines into three numbered selects.
   Here the numbering carries nothing: the rule is "record the title of each
   Galactic Artifacts side scheme in the victory display", the pool has exactly
   four members, and scenario #4 reads them back as a set — one setup effect per
   recorded scheme, in no particular order. So this is MC32's shape, boxes over
   a printed set, and not MC27's Osborn Tech, where the position IS the entry.

   THE MARKET IS A POOL WITH A GROUP RULE. The sheet prints an empty area, but
   the pool is finite and the rulebook (p. 4) closes it: "Only one copy of each
   card from The Market can be used during a campaign for the players as a
   group." One player may buy several; no card may appear twice across all four.
   That is the rule shape of MC10's rescued allies, but over 28 cards instead of
   four, so 28 boxes per player is not the form — a growable list of selects is,
   which is why W.poolList exists. The uniqueness spans the four lists and is
   therefore painted in one pass over all of them, MC40-style.

   TWO NUMBERS ON THIS SHEET ARE READ BACK BY A LATER SETUP, and the paper says
   so nowhere. Both are shown as derived lines, computed every time and never
   stored:

     * The marks under "Headhunter Defeated?" are counted, and each threshold
       adds a card to a later encounter deck. The ladder is NOT uniform across
       the scenarios: scenario #2 checks only for at least one mark, #3 checks
       one and two, #4 checks one to three, #5 checks all four. So the derived
       line names the scenario each unlocked card is first checked from, rather
       than claiming that three marks put three cards into scenario #3's deck.
     * "Evasion Counters" sets scenario #5's opening threat on Pincer Maneuver:
       "Place X additional threat on Pincer Maneuver, where X is equal to 3
       minus the recorded number in the Evasion Counters section." Floored at
       zero, because more than three counters cannot hand threat back.

   POWER STONE CONTROL POINTS AT A PLAYER, NOT AT A NAME. The rule says "record
   that identity's name", and the paper has no other way to say it. This project
   never persists a label, though, and a stored name goes stale the moment
   somebody fixes a typo in their identity field — so what is stored is the
   player's index and what is shown is that player's current identity. The price
   is that removing a player has to carry the reference along; see the remove
   handler, and the clamp in normalize().

   GERMAN IS NOT OPEN WORK FOR THE SHEET. The German rulebook of this expansion
   prints the complete German log on its pages 22 and 23, so every section name
   and subtitle below is read off that print. One thing DID have to be decided:
   the German printing contradicts itself, setting "Marktkarten im Spielerdeck"
   over players 1 and 2 (p. 22) and "Marktkarten in Spielerdecks" over players 3
   and 4 (p. 23). The heading appears once here, so the singular wins — which is
   also what the English sheet says on both of its pages.

   AND GERMAN IS NOT OPEN WORK FOR THE CARDS EITHER, which is unusual: every
   one of the 28 Market cards carries a German name, entered off the German
   cards themselves. That is why there is no `de: null` anywhere in this file —
   it is the first campaign module without one, so a reader who knows the
   convention from MC10, MC21, MC40 and MC45 will not find the "stays English"
   decision here, and one who knows MC27 will not find its "not entered yet"
   either. Neither applies. See the comment on MARKET for where the names came
   from and which of them a second pair of eyes would be worth on.

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
  /* Bounds nobody printed, so they sit where they can only be wrong in the
     harmless direction. Units accumulate over five scenarios and are spent
     again; evasion counters pile up on one environment card. Neither has a
     printed ceiling, and a two-digit field is the courtesy the other modules
     already extend to hit points. */
  var UNITS_MAX = 99;
  var EVASION_MAX = 99;
  /* Scenario #5: X = 3 minus the recorded evasion counters. The 3 is the
     rulebook's, not a guess — see the file header. */
  var PINCER_BASE = 3;

  /* ---- CARD SETS -----------------------------------------------------------
     Every card carries an English and a German name, as in MC10, MC21, MC27,
     MC32, MC40 and MC45. `de: null` shows the English name and tags it
     lang="en".

     THE MARKET, all 28 cards, checked against C:\Repos\marvelsdb-json-data:
     the `the_market` set of pack `gmw`, codes 16150 to 16177, in printed order.
     `cost` is the "Unit Cost X" line out of each card's own text box, which is
     what the "Unspent Units" field is spent against; four cards at every cost
     from 1 to 7.

     ALL 28 GERMAN NAMES ARE ENTERED, and not one of them came from a machine-
     readable source: marvelsdb's translations/de for pack `gmw` carries English
     copies only, and C:\Repos\demarvelcdb\translations_local has no `gmw` file
     at all. Five are legible on the card images on page 4 of the German
     rulebook — Notfallplan, Knapp daneben, Panzerung, Navigationskonsole and
     Entfesselte Macht — and each of those was matched to its English card by
     the card TEXT rather than by its position in that illustration, which is a
     fanned stack the text extraction interleaves. The remaining 23 were read
     off the German cards. So there is no `de: null` here at all, and adding one
     back would be a claim about the German printing rather than a gap.

     THREE ARE WORTH A SECOND LOOK against the cards, and they are flagged here
     rather than silently normalised, because a printed name is the print's to
     decide and not ours:
       * "Schutzmassnahme" (Safeguard) — ss where German would normally set ß.
       * "Erprobt und Bewährt" (Tried and True) — the capital B is unusual in a
         German title; the cards print titles in caps, so the case had to be
         chosen when transcribing.
       * "Bring den Kampf zu ihnen!" (Take the Fight to Them) — arrived here as
         "Kampfzu" and the space was restored, since that is a slip rather than
         a spelling.
     Only the slug is ever persisted, so correcting any of them migrates nothing
     and invalidates no saved sheet. */
  var MARKET = [
    { slug: "brainstorm",             en: "Brainstorm",             cost: 1, de: "Brainstorming" },
    { slug: "by-any-means",           en: "By Any Means",           cost: 1, de: "Mit allen Mitteln" },
    { slug: "contingency-plan",       en: "Contingency Plan",       cost: 1, de: "Notfallplan" },
    { slug: "in-defiance",            en: "In Defiance",            cost: 1, de: "Dagegenhalten" },

    { slug: "calculate-the-odds",     en: "Calculate the Odds",     cost: 2, de: "Die Chancen berechnen" },
    { slug: "creative-solution",      en: "Creative Solution",      cost: 2, de: "Kreative Lösung" },
    { slug: "grapple",                en: "Grapple",                cost: 2, de: "Rauferei" },
    { slug: "wing-it",                en: "Wing It",                cost: 2, de: "Improvisieren" },

    { slug: "close-call",             en: "Close Call",             cost: 3, de: "Knapp daneben" },
    { slug: "defy-danger",            en: "Defy Danger",            cost: 3, de: "Der Gefahr trotzen" },
    { slug: "in-harms-way",           en: "In Harm's Way",          cost: 3, de: "Gefahrvolle Rettung" },
    { slug: "take-the-fight-to-them", en: "Take the Fight to Them", cost: 3, de: "Bring den Kampf zu ihnen!" },

    { slug: "armor-plating",          en: "Armor Plating",          cost: 4, de: "Panzerung" },
    { slug: "heavy-cannon",           en: "Heavy Cannon",           cost: 4, de: "Schwere Kanone" },
    { slug: "hyper-thrusters",        en: "Hyper Thrusters",        cost: 4, de: "Hyper-Triebwerke" },
    { slug: "reactor-core",           en: "Reactor Core",           cost: 4, de: "Reaktorkern" },

    { slug: "ardent-resolve",         en: "Ardent Resolve",         cost: 5, de: "Wilde Entschlossenheit" },
    { slug: "onrush",                 en: "Onrush",                 cost: 5, de: "Ansturm" },
    { slug: "safeguard",              en: "Safeguard",              cost: 5, de: "Schutzmassnahme" },
    { slug: "sure-gamble",            en: "Sure Gamble",            cost: 5, de: "Sichere Sache" },

    { slug: "cargo-hold",             en: "Cargo Hold",             cost: 6, de: "Frachtraum" },
    { slug: "mounted-laser",          en: "Mounted Laser",          cost: 6, de: "Montierter Laser" },
    { slug: "navigation-column",      en: "Navigation Column",      cost: 6, de: "Navigationskonsole" },
    { slug: "targeting-screen",       en: "Targeting Screen",       cost: 6, de: "Zielbildschirm" },

    { slug: "grand-strategy",         en: "Grand Strategy",         cost: 7, de: "Strategiebesprechung" },
    { slug: "power-unleashed",        en: "Power Unleashed",        cost: 7, de: "Entfesselte Macht" },
    { slug: "tried-and-true",         en: "Tried and True",         cost: 7, de: "Erprobt und Bewährt" },
    { slug: "triple-threat",          en: "Triple Threat",          cost: 7, de: "Schlagkräftiges Trio" },
  ];

  /* The four GALACTIC ARTIFACTS side schemes — the `galactic_artifacts` set,
     codes 16127 to 16130. The German rulebook names all four on page 14, in
     scenario #4's setup, where each one gets its own effect.

     THE TWO GERMAN PRINTS DISAGREE ON THE FIRST ONE and the card wins. The
     rulebook sets "Ei des Monarchen von Hujahdrian"; the card sets
     "Hujahdarian", which is also the spelling of the English card. So the
     rulebook drops a syllable, and the value below is the card's. Written down
     because the rulebook is the source the other three came from, and a later
     reader checking this table against page 14 would otherwise "fix" it back. */
  var ARTIFACTS = [
    { slug: "hujahdarian-monarch-egg", en: "Hujahdarian Monarch Egg", de: "Ei des Monarchen von Hujahdarian" },
    { slug: "magical-teapot",          en: "Magical Teapot",          de: "Magische Teekanne" },
    { slug: "philosophers-stone",      en: "Philosopher's Stone",     de: "Stein der Weisen" },
    { slug: "crystal-ball",            en: "Crystal Ball",            de: "Kristallkugel" },
  ];

  /* The four printed scenario tiles of "Headhunter Defeated?", in the order the
     sheet lays them out: two across, then two across. All four names are
     translated in the German printing, which is why the tile labels below carry
     no lang tag — there is never an English name in them to mark. */
  var HEADHUNTER_SCENARIOS = [
    { slug: "brotherhood", number: 1, en: "Brotherhood of Badoon", de: "Bruderschaft der Badoon" },
    { slug: "infiltrate",  number: 2, en: "Infiltrate the Museum", de: "Einbruch ins Museum" },
    { slug: "escape",      number: 3, en: "Escape the Museum",     de: "Flucht aus dem Museum" },
    { slug: "nebula",      number: 4, en: "Nebula",                de: "Nebula" },
  ];

  /* The ladder those marks unlock, out of the `badoon_headhunter` set (16184 to
     16187). `at` is how many marks it takes; `from` is the FIRST scenario whose
     setup checks that threshold, and it is the reason this list carries a
     scenario number at all: the ladder grows WITH the scenario, so three marks
     do not put three cards into scenario #3's encounter deck. German names off
     the German rulebook, pages 12, 14 and 18. */
  var HEADHUNTER_CARDS = [
    { at: 1, from: 2, en: "On the Hunt",           de: "Auf der Jagd" },
    { at: 2, from: 3, en: "Dead to Rights",        de: "Eiskalt erwischt" },
    { at: 3, from: 4, en: "Headhunter's Henchman", de: "Kopfgeldjäger-Komplize" },
    { at: 4, from: 5, en: "Fugitive Recovery",     de: "Auslieferung der Zielperson" },
  ];

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
  function inPool(pool, slug) {
    for (var i = 0; i < pool.length; i++) if (pool[i].slug === slug) return true;
    return false;
  }
  function poolEntry(pool, slug) {
    for (var i = 0; i < pool.length; i++) if (pool[i].slug === slug) return pool[i];
    return null;
  }

  // ---- Data ----------------------------------------------------------------
  function emptyState() {
    return {
      /* Standard or expert level. Only the display follows this: switching back
         to standard HIDES the remaining hit points, it does not clear them, so
         a sheet toggled by accident loses nothing. This is one of the few
         sheets that marks the field itself, printing "(Expert)" under it. */
      expert: false,
      /* A fresh sheet starts with a single player; more are added as needed. */
      players: [newPlayer()],
      /* Which of the four printed side schemes were recorded. Slugs rather than
         a map, so the printed order is the stored order and the count that
         scenario #3 pays out on — one unit per two artifacts — is its length. */
      artifacts: [],
      /* The INDEX of the player holding the Power Stone, or null. See the file
         header for why this is not the identity's name. */
      powerStone: null,
      evasion: null,
      /* One flag per printed scenario tile, keyed by slug. A map rather than a
         row, because the four tiles are named boxes and no position on the
         sheet means anything beyond the name printed on the tile. */
      headhunter: emptyHeadhunter(),
    };
  }

  function newPlayer() {
    /* `unitsEarned` is what the campaign paid out in total, NOT the printed
       "Unspent Units" — see the file header. What is left is derived from it
       and never stored. `market` holds slugs out of MARKET, `collection` free
       text: the market is a printed pool of 28, while The Collection fills up
       with whatever cards the players happened to be holding. */
    return { hero: "", hp: null, unitsEarned: null, market: [], collection: [] };
  }

  function emptyHeadhunter() {
    var out = {};
    HEADHUNTER_SCENARIOS.forEach(function (entry) { out[entry.slug] = false; });
    return out;
  }

  /* Never throws. Starts from emptyState() and overlays only what it
     recognises, so a hand-edited file, a foreign export or a truncated share
     link cannot produce an invalid sheet. Fields this sheet does not have —
     MC60's `scenarios`, MC21's `flags`, MC40's `schemes` — are simply never
     read, which is how they get dropped. */
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
        unitsEarned: W.clampNumber(
          p.unitsEarned === "" ? null : p.unitsEarned, 0, UNITS_MAX),
        /* Unknown slugs and repeats within the one list go; the ORDER stays as
           it arrived. A list of purchases has no meaningful order, so there is
           nothing to canonicalise, and sorting it would only shuffle the rows
           under the reader between one load and the next. */
        market: pickList(p.market, MARKET),
        collection: W.coerceStringList(p.collection, { split: true }),
      });
    }
    /* And the group rule on top of the per-player one: one copy of each Market
       card for the players AS A GROUP. Resolved in player order, first keep
       wins — the deterministic rule dropRepeats() applies elsewhere. It has to
       happen here rather than in the widget, or a share link carrying a
       conflict would be judged by whichever select happened to render first. */
    dropSharedRepeats(out.players);

    /* Rebuilt from ARTIFACTS every time: unknown slugs out, repeats out, order
       the printed one. It is a set, so its own arrival order carries nothing. */
    out.artifacts = pickSet(raw.artifacts, ARTIFACTS);

    /* Checked against the players that actually exist, and DROPPED rather than
       clamped when it does not fit. Clamping would be the obvious thing and it
       is wrong here: an index of 3 arriving on a one-player sheet would come
       back as 0, which does not repair a record — it invents one, and says
       player #1 holds the Power Stone when nothing on the sheet ever said so.
       Not a seat, not a record. */
    var seat = W.clampNumber(raw.powerStone === "" ? null : raw.powerStone, null, null);
    out.powerStone = (seat != null && seat >= 0 && seat < out.players.length) ? seat : null;

    out.evasion = W.clampNumber(raw.evasion === "" ? null : raw.evasion, 0, EVASION_MAX);

    /* Rebuilt from HEADHUNTER_SCENARIOS: exactly the four printed keys, so an
       invented scenario is dropped and a missing one reads as unticked. */
    var marks = (raw.headhunter && typeof raw.headhunter === "object") ? raw.headhunter : {};
    out.headhunter = {};
    HEADHUNTER_SCENARIOS.forEach(function (entry) {
      out.headhunter[entry.slug] = W.coerceBool(marks[entry.slug]);
    });

    return out;
  }

  /* A growable list of slugs out of a pool: unknown ones and repeats go, the
     order survives. Unlike MC40's pickSlots() there is no fixed length, because
     the sheet's write-in area prints no rows to count. */
  function pickList(raw, pool) {
    var list = Array.isArray(raw) ? raw : [];
    var seen = {}, out = [];
    list.forEach(function (slug) {
      if (typeof slug !== "string" || !inPool(pool, slug) || seen[slug]) return;
      seen[slug] = true;
      out.push(slug);
    });
    return out;
  }

  /* The same, but as a set: the result comes out in the pool's printed order
     however it arrived, because nothing about it is a sequence. */
  function pickSet(raw, pool) {
    var list = Array.isArray(raw) ? raw : [];
    return pool.filter(function (entry) {
      return list.indexOf(entry.slug) !== -1;
    }).map(function (entry) { return entry.slug; });
  }

  /* "Only one copy of each card from The Market ... for the players as a
     group." In player order, so the outcome depends on nothing but the sheet
     itself. */
  function dropSharedRepeats(players) {
    var seen = {};
    players.forEach(function (p) {
      p.market = p.market.filter(function (slug) {
        if (seen[slug]) return false;
        seen[slug] = true;
        return true;
      });
    });
  }

  /* Version 1 stored the printed field: `units` was the UNSPENT balance. This
     version stores what was earned instead and derives the balance, so the two
     numbers mean different things and a v1 sheet read as a v2 one would quietly
     understate every player by whatever they had already spent.

     No default is guessed here, because none is needed: unspent plus spent IS
     earned, and the cards that were bought are recorded right beside the number.
     So the conversion is exact rather than a best effort — which is the bar
     CLAUDE.md sets after MC60, where a migration's default silently hid hit
     points people had written down.

     A player who never recorded a balance keeps none: null in, null out. Adding
     up their cards would invent an income they never wrote down. Runs before
     normalize() and must not touch the DOM, so everything it calls is pure. */
  function migrate(raw, fromVersion) {
    raw = (raw && typeof raw === "object") ? raw : {};
    if (fromVersion < 2 && Array.isArray(raw.players)) {
      raw.players.forEach(function (p) {
        if (!p || typeof p !== "object") return;
        var unspent = W.clampNumber(p.units === "" ? null : p.units, 0, UNITS_MAX);
        if (unspent == null) return;
        p.unitsEarned = unspent + marketCost(pickList(p.market, MARKET));
      });
    }
    return raw;
  }

  /* What a player's recorded Market cards cost, which is the whole of what this
     sheet can know about their spending. Unknown slugs count nothing rather
     than throwing: normalize() has already dropped them, and migrate() runs on
     raw input where one may still be sitting. */
  function marketCost(slugs) {
    var sum = 0;
    (slugs || []).forEach(function (slug) {
      var entry = poolEntry(MARKET, slug);
      if (entry) sum += entry.cost;
    });
    return sum;
  }

  /* The printed field, computed. Null while nothing has been earned yet —
     "nothing recorded" is not the same statement as "nothing left", and a
     player who has bought cards without entering an income has an unanswered
     question rather than a debt. May go negative on purpose; see the header. */
  function unitsLeft(player) {
    if (player.unitsEarned == null) return null;
    return player.unitsEarned - marketCost(player.market);
  }

  /* Counts the hidden hit point value too: at standard level the field is not
     on screen, but what is written there is still on the sheet, so removing the
     card would still lose it. */
  function playerHasContent(player) {
    return !!player.hero.trim() || player.hp != null ||
      player.unitsEarned != null ||
      player.market.length > 0 || player.collection.length > 0;
  }

  /* Printed starting hit points for a typed hero name, or null. Matched
     case-insensitively against both language names, so it also works when the
     name was typed rather than picked from the suggestions. */
  function startingHealth(name, lang) {
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

  function markCount(state) {
    var n = 0;
    HEADHUNTER_SCENARIOS.forEach(function (entry) {
      if (state.headhunter[entry.slug]) n++;
    });
    return n;
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

  /* The second line the sheet prints inside every heading bar — "Victory for
     Scenario #2 – Infiltrate the Museum" and its siblings. Its own class rather
     than .hint, because that one is for lines this app writes and these are
     printed matter; keeping them apart means a reader can tell at a glance
     which lines came off the paper. */
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

  /* A row that shows a computed value rather than taking one. A <div> and not
     a <label>, because there is no control here for a label to name. */
  function derivedRow(labelText, valueNode) {
    var row = W.el("div", "player-field");
    var label = W.el("div", "field-label");
    label.textContent = labelText;
    label.appendChild(valueNode);
    row.appendChild(label);
    return row;
  }

  /* The only control in a panel of its own, so it carries no visible caption:
     the heading pill and the printed subtitle above it have already named it,
     and the control keeps the accessible name. */
  function loneField(control) {
    var row = W.el("div", "player-field");
    row.appendChild(control);
    return row;
  }

  /* One box with its own wording — MC21's shape, used here for the artifacts
     and for the four scenario tiles. */
  function flagBox(labelText, cfg) {
    var flag = W.el("label", "flag");
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

  /* The caption over a player's column in the Market and Collection panels.
     The identity when there is one, because four columns headed "Player #n"
     are only distinguishable by counting. */
  function playerCaption(t, player, i) {
    var who = player.hero.trim();
    var number = t("playerRow", String(i + 1));
    return who ? number + " · " + who : number;
  }

  /* Those captions follow the identity fields, so they are repainted whenever
     one is typed in — in place, because a re-render would take the focus out of
     the name being typed. Same reason as paintPowerStone(), and called from the
     same handler. */
  function paintCaptions(t, state) {
    state.players.forEach(function (player, i) {
      var text = playerCaption(t, player, i);
      Array.prototype.forEach.call(
        document.querySelectorAll('[data-player-caption="' + i + '"]'),
        function (node) { node.textContent = text; });
    });
  }

  /* The computed balance for every player: earned minus what the recorded
     Market cards cost. Repainted from both ends — the number above it and the
     card list two panels below — and never stored.

     Negative is shown, not clamped and not hidden: spending more than was
     earned is a mistake somebody wants to see, and the sheet cannot know which
     end of it is wrong. */
  function paintUnits(t, state) {
    state.players.forEach(function (player, i) {
      var line = document.querySelector('[data-units-left="' + i + '"]');
      if (!line) return;
      var value = line.querySelector(".units-left");
      var spent = line.querySelector(".units-spent");
      var left = unitsLeft(player);
      var cost = marketCost(player.market);

      value.textContent = left == null ? "—" : String(left);
      spent.textContent = cost ? t("unitsSpent", String(cost)) : "";
      var over = left != null && left < 0;
      line.classList.toggle("is-over", over);
      /* The colour alone says nothing to a screen reader, and nothing at all to
         anyone who cannot tell it apart. */
      line.title = over ? t("unitsOver") : "";
    });
  }

  /* The pool as select options, grouped by unit cost. The grouping is not
     decoration: an option can carry only ONE lang attribute, so folding the
     cost into the label ("Panzerung (Unit-Kosten 4)") would tag a German phrase
     as English on every card whose name is still untranslated. In an optgroup
     the cost sits in the group label, the option holds nothing but the card
     name, and the tag stays true. */
  function marketOptions(t, lang) {
    return MARKET.map(function (entry) {
      return {
        value: entry.slug,
        label: entryName(entry, lang),
        lang: entryLang(entry, lang),
        group: t("unitCostGroup", String(entry.cost)),
      };
    });
  }

  function render(root, ctx) {
    var t = ctx.t, lang = ctx.lang, state = ctx.state;

    root.appendChild(renderPlayers(t, lang, state, ctx));
    root.appendChild(renderMarket(t, lang, state));
    root.appendChild(renderCollection(t, state));
    root.appendChild(renderArtifacts(t, lang, state, ctx));

    /* Power Stone and Evasion Counters side by side, Headhunter below: that is
       the reading order of the printed page, whose left column holds those two
       and whose right column holds the scenario tiles. */
    var strip = W.el("div", "scenario-row");
    strip.appendChild(renderPowerStone(t, state, ctx));
    strip.appendChild(renderEvasion(t, state, ctx));
    root.appendChild(strip);

    root.appendChild(renderHeadhunter(t, lang, state, ctx));

    /* Last, once everything is in the document: both of these span panels, so
       neither can be decided while a single control is being built. Derived,
       never stored. */
    paintMarket(t, lang);
    paintPowerStone(t, state);
    paintUnits(t, state);
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
          /* Power Stone Control points at a player BY INDEX, so the reference
             has to follow the splice: either the holder is the one who left, or
             everybody behind them moved up one. Nothing else on this sheet
             refers to a player, which is why this is the only fixup. */
          if (state.powerStone === i) state.powerStone = null;
          else if (state.powerStone != null && state.powerStone > i) state.powerStone -= 1;
          ctx.save();
          /* A full re-render, never a partial redraw: the cards below shift up
             and renumber, and the market lists renumber with them. */
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
          /* Three places show this identity besides the field itself: the
             Power Stone select and the two column headings below. All are
             repainted in place rather than by re-rendering, which would take
             the focus out of the name being typed. */
          paintPowerStone(t, state);
          paintCaptions(t, state);
        },
      });
      card.appendChild(fieldRow(t("colIdentity"), heroInput));

      /* Expert only, and here the printed sheet says so itself: it sets
         "(Expert)" under the field. The rulebook agrees under PERSISTENT
         DAMAGE, where the value becomes the next scenario's starting hit
         points. Hidden at standard level, never cleared, so it is still in the
         export and in a share link. */
      var hpField = null;
      if (state.expert) {
        hpField = W.numberField({
          value: player.hp,
          min: 0, max: HP_MAX,
          label: caption + " – " + t("colHp"),
          hint: startingHealth(player.hero, lang),
          onChange: function (next) { player.hp = next; ctx.save(); },
        });
        card.appendChild(fieldRow(t("colHp"), hpField));
      }

      /* Not behind the expert switch: units are earned in every campaign at
         both levels, and the expert rules only add one more thing to spend
         them on (healing to the printed hit point value at setup). */
      card.appendChild(fieldRow(t("colUnitsEarned"), W.numberField({
        value: player.unitsEarned,
        min: 0, max: UNITS_MAX,
        label: caption + " – " + t("colUnitsEarned"),
        onChange: function (next) {
          player.unitsEarned = next;
          ctx.save();
          paintUnits(t, state);
        },
      })));

      /* The printed field, and the only one on this sheet that is computed
         rather than entered. Read-only text rather than a disabled input,
         because a box you cannot type in reads as broken. */
      var left = W.el("span", "units-line", { "data-units-left": String(i) });
      left.appendChild(W.el("span", "units-left"));
      left.appendChild(W.el("span", "units-spent"));
      card.appendChild(derivedRow(t("colUnits"), left));

      /* The hero's printed starting hit points, as a reminder of what full
         health was. Rewritten in place rather than by re-rendering the panel,
         which would take the focus out of the field being typed in. */
      function updateHpHint() {
        if (!hpField) return;               // standard level: no such field
        var hint = hpField.querySelector(".num-hint");
        var h = startingHealth(player.hero, lang);
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

    /* Market cards are not the only thing units buy, and the sheet can only
       see the ones it records. Shown only at expert level, because that is the
       only level whose setup offers the trade. */
    if (state.expert) {
      var caveat = W.el("p", "hint");
      caveat.textContent = t("healingSpend");
      section.appendChild(caveat);
    }
    return section;
  }

  /* One heading, one subtitle, four columns — the sheet's own arrangement. A
     row is a card off the printed pool rather than free text, because the pool
     is closed at 28 and the group rule can then be enforced instead of merely
     described. */
  function renderMarket(t, lang, state) {
    /* Buying a card moves a number two panels up, so both are repainted from
       one handler. */
    function repaint() {
      paintMarket(t, lang);
      paintUnits(t, state);
    }

    var section = panel("market", t("secMarket"));
    subline(section, t("subMarket"));

    var options = marketOptions(t, lang);
    var grid = W.el("div", "player-grid", { "data-players": String(state.players.length) });

    state.players.forEach(function (player, i) {
      var card = W.el("div", "player-card", { "data-player": String(i + 1) });
      var head = W.el("div", "player-head");
      var name = W.el("div", "player-name", { "data-player-caption": String(i) });
      name.textContent = playerCaption(t, player, i);
      head.appendChild(name);
      card.appendChild(head);

      card.appendChild(W.poolList({
        listId: "gmw-market-" + i,
        /* What the row costs, behind the card and outside the select: a closed
           select shows only the name, so without this the price is only
           visible while the list is open — and the balance two panels up could
           not be reconciled against the cards that produced it. Built empty
           and filled by paintMarket(), which already walks every select. */
        suffix: function (at) {
          return W.el("span", "unit-cost",
            { "data-market-cost": i + "-" + at, role: "img" });
        },
        getArray: function () { return player.market; },
        options: options,
        placeholder: t("marketPlaceholder"),
        addLabel: t("addMarketCard"),
        removeLabel: t("removeEntry"),
        removeConfirm: t("confirmRemoveEntry"),
        selectLabel: function (at) {
          return t("playerRow", String(i + 1)) + " – " + t("secMarket") + " " + (at + 1);
        },
        /* How paintMarket() finds every select on the sheet at once. */
        attrs: function (at) { return { "data-market-select": i + "-" + at }; },
        onChange: repaint,
      }));

      grid.appendChild(card);
    });

    section.appendChild(grid);
    return section;
  }

  /* The group rule, painted across all four lists together: a card bought by
     anyone is closed to everybody else. One pass over every select on the
     sheet, because the rule spans the panel and no single list can see it.

     The lock is one-sided, the MC60/MC32/MC40/MC45 rule: syncUnique() never
     disables a select's OWN value, so a sheet that arrives from an import or an
     old #log= link holding the same card twice stays operable and can be sorted
     out on screen. normalize() has the last word on load; it does not get to
     freeze anything afterwards. */
  function paintMarket(t, lang) {
    var selects = document.querySelectorAll("[data-market-select]");
    if (!selects.length) return;
    W.syncUnique(Array.prototype.slice.call(selects));

    /* And the price behind each one. The number alone is what is shown, because
       four player columns have no room for the words; the words are what a
       screen reader gets, which is the MC27 rule for a glyph that carries
       meaning. An empty row shows nothing rather than a zero — it has not
       bought anything yet. */
    Array.prototype.forEach.call(selects, function (select) {
      var key = select.getAttribute("data-market-select");
      var note = document.querySelector('[data-market-cost="' + key + '"]');
      if (!note) return;
      var entry = poolEntry(MARKET, select.value);
      note.textContent = entry ? String(entry.cost) : "";
      var label = entry ? t("unitCostGroup", String(entry.cost)) : "";
      note.title = label;
      if (label) note.setAttribute("aria-label", label);
      else note.removeAttribute("aria-label");
      note.hidden = !entry;
    });
  }

  /* Free text, unlike the market: The Collection fills with whatever cards the
     players were holding, so there is no pool to pick from. Entries can be
     dragged between the columns — the same `group` — because getting a title
     into the wrong player's column is the obvious mistake here, and scenario #3
     makes each player remove exactly their own recorded cards from the game. */
  function renderCollection(t, state) {
    var section = panel("collection", t("secCollection"));
    subline(section, t("subCollection"));

    var grid = W.el("div", "player-grid", { "data-players": String(state.players.length) });
    state.players.forEach(function (player, i) {
      var card = W.el("div", "player-card", { "data-player": String(i + 1) });
      var head = W.el("div", "player-head");
      var name = W.el("div", "player-name", { "data-player-caption": String(i) });
      name.textContent = playerCaption(t, player, i);
      head.appendChild(name);
      card.appendChild(head);

      card.appendChild(W.stringList({
        listId: "gmw-collection-" + i,
        group: "gmw-collection",
        getArray: function () { return player.collection; },
        placeholder: t("cardNamePlaceholder"),
        addLabel: t("addEntry"),
        removeLabel: t("removeEntry"),
        removeConfirm: t("confirmRemoveEntry"),
        dragLabel: t("dragReorder"),
        multiline: false,
      }));

      grid.appendChild(card);
    });

    section.appendChild(grid);
    return section;
  }

  /* Boxes over the printed set, MC32's shape. See the file header for why the
     paper's four numbered lines do not become four numbered selects. */
  function renderArtifacts(t, lang, state, ctx) {
    var section = panel("artifacts", t("secArtifacts"));
    subline(section, t("subArtifacts"));

    var wrap = W.el("div", "player-field");
    var row = W.el("div", "flag-row");
    ARTIFACTS.forEach(function (entry) {
      var name = entryName(entry, lang);
      row.appendChild(flagBox(name, {
        lang: entryLang(entry, lang),
        checked: state.artifacts.indexOf(entry.slug) !== -1,
        label: t("secArtifacts") + " – " + name,
        onChange: function (next) {
          /* Rebuilt through pickSet() rather than pushed and spliced, so the
             stored order stays the printed one however the boxes were ticked. */
          var slugs = state.artifacts.filter(function (s) { return s !== entry.slug; });
          if (next) slugs.push(entry.slug);
          state.artifacts = pickSet(slugs, ARTIFACTS);
          ctx.save();
        },
      }));
    });
    wrap.appendChild(row);
    section.appendChild(wrap);
    return section;
  }

  /* A select over the players rather than a name field. The options are built
     by paintPowerStone(), because they follow the identity fields above and
     have to be rebuilt whenever one of those is typed in. */
  function renderPowerStone(t, state, ctx) {
    var section = panel("power-stone", t("secPowerStone"));
    subline(section, t("subPowerStone"));

    var select = W.poolSelect({
      value: state.powerStone == null ? "" : String(state.powerStone),
      options: [],
      placeholder: t("powerStoneNobody"),
      label: t("secPowerStone"),
      onChange: function (next) {
        state.powerStone = next === ""
          ? null : W.clampNumber(next, 0, state.players.length - 1);
        ctx.save();
      },
    });
    select.setAttribute("data-power-stone", "1");
    /* No visible caption: the pill above and the printed subtitle under it
       already name this field twice, and a third label would only repeat them.
       The accessible name rides on the control itself. Same in renderEvasion. */
    section.appendChild(loneField(select));

    /* Empty while there is nothing to say, so the panel does not jump. */
    section.appendChild(W.el("p", "hint", { "data-power-stone-hint": "1" }));
    return section;
  }

  /* The options, and the note under them. Derived from the identity fields
     every time and nothing stored — what is stored is the index alone. */
  function paintPowerStone(t, state) {
    var select = document.querySelector("[data-power-stone]");
    if (!select) return;

    var current = state.powerStone == null ? "" : String(state.powerStone);
    /* Everything but the placeholder, which is option 0 and stays. */
    while (select.options.length > 1) select.remove(1);

    var named = 0;
    state.players.forEach(function (player, i) {
      var who = player.hero.trim();
      if (who) named++;
      var option = W.el("option", null, { value: String(i) });
      option.textContent = who
        ? t("powerStoneOption", who, String(i + 1))
        : t("playerRow", String(i + 1));
      select.appendChild(option);
    });
    select.value = current;

    /* The rule wants an identity's name. A player with no identity entered can
       still be recorded — "player #2 has it" is true either way — but the note
       says where the name would come from. */
    var hint = document.querySelector("[data-power-stone-hint]");
    if (hint) hint.textContent = named ? "" : t("powerStoneNoIdentity");
  }

  function renderEvasion(t, state, ctx) {
    var section = panel("evasion", t("secEvasion"));
    subline(section, t("subEvasion"));

    var hint = W.el("p", "hint", { "data-pincer": "1" });

    /* Scenario #5 opens with 3 minus this number as extra threat on Pincer
       Maneuver. Nothing on the paper says so, and nobody remembers it four
       games later. Floored at zero, and silent while nothing is recorded:
       an empty field is "not played yet", not "zero counters". */
    function updatePincer() {
      hint.textContent = state.evasion == null ? ""
        : t("pincerHint", String(Math.max(0, PINCER_BASE - state.evasion)));
    }

    section.appendChild(loneField(W.numberField({
      value: state.evasion,
      min: 0, max: EVASION_MAX,
      label: t("secEvasion"),
      onChange: function (next) {
        state.evasion = next;
        ctx.save();
        updatePincer();
      },
    })));

    updatePincer();
    section.appendChild(hint);
    return section;
  }

  function renderHeadhunter(t, lang, state, ctx) {
    var section = panel("headhunter", t("secHeadhunter"));
    subline(section, t("subHeadhunter"));

    var ladder = W.el("p", "hint", { "data-headhunter-ladder": "1" });

    /* What the count unlocks, and from which scenario each card is first
       checked for. Naming the scenario is the whole point: the thresholds are
       not all read at once, so "3 marks" does not mean three extra cards in
       the very next game. Derived, never stored. */
    function updateLadder() {
      var n = markCount(state);
      if (!n) {
        ladder.textContent = t("headhunterLadderNone");
        return;
      }
      var parts = HEADHUNTER_CARDS.filter(function (card) {
        return card.at <= n;
      }).map(function (card) {
        return t("headhunterFrom", entryName(card, lang), String(card.from));
      });
      ladder.textContent = t("headhunterLadder", String(n), parts.join(" · "));
    }

    var wrap = W.el("div", "player-field");
    var row = W.el("div", "flag-row");
    HEADHUNTER_SCENARIOS.forEach(function (entry) {
      /* No lang tag: this label is printed matter in both editions — the tile
         prints "SCENARIO 1" over "Brotherhood of Badoon", and the German sheet
         prints "SZENARIO 1" over "Bruderschaft der Badoon". All four names are
         translated, so there is never an English name in here to mark. */
      var label = t("scenarioTile", String(entry.number), entryName(entry, lang));
      row.appendChild(flagBox(label, {
        checked: state.headhunter[entry.slug],
        label: t("secHeadhunter") + " – " + label,
        onChange: function (next) {
          state.headhunter[entry.slug] = next;
          ctx.save();
          updateLadder();
        },
      }));
    });
    wrap.appendChild(row);
    section.appendChild(wrap);

    updateLadder();
    section.appendChild(ladder);
    return section;
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
      /* Both numbers: the one that was entered and the one the sheet worked
         out, because a printout carrying only the difference could not be
         checked against the card list further down. */
      line += " · " + t("colUnitsEarned") + ": " +
        (p.unitsEarned == null ? "—" : String(p.unitsEarned));
      var leftOver = unitsLeft(p);
      line += " · " + t("colUnits") + ": " +
        (leftOver == null ? "—" : String(leftOver));
      printLine(players, line);
    });

    /* Both card lists print one line per player, and only for players who have
       something on the sheet — an empty column is not a record. Market cards
       print WITHOUT their unit cost: what was paid is spent and gone, and the
       sheet records the deck, not the receipt. */
    var market = printSection(root, t("secMarket"));
    state.players.forEach(function (p, i) {
      if (!playerHasContent(p)) return;
      printLine(market, t("playerRow", String(i + 1)) + ": " +
        (p.market.length ? p.market.map(function (slug) {
          var entry = poolEntry(MARKET, slug);
          return entry ? entryName(entry, lang) : slug;
        }).join(" · ") : "—"));
    });

    var collection = printSection(root, t("secCollection"));
    state.players.forEach(function (p, i) {
      if (!playerHasContent(p)) return;
      var line = W.el("p", "print-line");
      line.appendChild(document.createTextNode(t("playerRow", String(i + 1)) + ": "));
      if (!p.collection.length) {
        line.appendChild(document.createTextNode("—"));
      } else {
        p.collection.forEach(function (raw, at) {
          if (at) line.appendChild(document.createTextNode(" · "));
          /* Same split the editor uses, so a struck entry cannot read
             differently on paper than it does on screen. */
          var s = W.splitStrike(raw);
          var span = W.el("span", s.struck ? "struck" : null);
          span.textContent = s.text;
          line.appendChild(span);
        });
      }
      collection.appendChild(line);
    });

    /* All four artifacts, ticked or not: scenario #4 asks about exactly these
       four, and "not in the victory display" is as much an answer as the other
       one. */
    var artifacts = printSection(root, t("secArtifacts"));
    ARTIFACTS.forEach(function (entry) {
      var on = state.artifacts.indexOf(entry.slug) !== -1;
      var line = W.el("p", "print-line");
      line.appendChild(document.createTextNode(on ? "[x] " : "[ ] "));
      var name = W.el("span", null, { lang: entryLang(entry, lang) });
      name.textContent = entryName(entry, lang);
      line.appendChild(name);
      artifacts.appendChild(line);
    });

    var stone = printSection(root, t("secPowerStone"));
    var holder = state.powerStone == null ? null : state.players[state.powerStone];
    printLine(stone, holder
      ? (holder.hero.trim() || t("playerRow", String(state.powerStone + 1)))
      : "—");

    var evasion = printSection(root, t("secEvasion"));
    printLine(evasion, state.evasion == null ? "—" : String(state.evasion));

    /* Every scenario on its own line, marked or not, because the next setup
       counts exactly these four boxes. The derived ladder is NOT printed: the
       printout records what was written down, not what the screen computes
       from it. */
    var headhunter = printSection(root, t("secHeadhunter"));
    HEADHUNTER_SCENARIOS.forEach(function (entry) {
      printLine(headhunter, (state.headhunter[entry.slug] ? "[x] " : "[ ] ") +
        t("scenarioTile", String(entry.number), entryName(entry, lang)));
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
    id: "galaxys-most-wanted",
    code: "MC16",
    titleEn: "The Galaxy's Most Wanted",
    /* The German edition keeps the English campaign title, as this project does
       throughout — and the German rulebook says so itself, writing "die
       Kampagne The Galaxy's Most Wanted" wherever it names it. */
    titleDe: "The Galaxy's Most Wanted",
    theme: "gmw",
    stateVersion: 2,

    emptyState: emptyState,
    normalize: normalize,
    migrate: migrate,
    render: render,
    renderPrint: renderPrint,

    helpDe: "Der MC16-Bogen läuft über zwei gedruckte Seiten, und sein Spielerbereich ist eine Einkaufsliste. Oben stehen je Spieler Identität, verbleibende Lebenspunkte und die Units. Die Units sind die Währung der Guardians: sie werden nach jedem Szenario notiert und zwischen den Szenarien für Marktkarten ausgegeben. Deshalb stehen sie auf beiden Stufen und nicht hinter dem Expertenhaken — die Expertenregeln geben ihnen nur eine weitere Verwendung, nämlich die eigene Identität beim Spielaufbau auf ihre aufgedruckten Lebenspunkte zu heilen. Und hier weicht der Bogen bewusst vom Papier ab: gedruckt ist ein Feld „Übrige Units“, in das man mit dem Bleistift den jeweiligen Kontostand schreibt und ihn bei jedem Kauf ausradiert. Eingetragen werden hier stattdessen die „Verdienten Units“, also alles, was die Kampagne bisher ausgeschüttet hat — und „Übrige Units“ wird daraus gerechnet: verdient minus die Unit-Kosten der Marktkarten, die daneben eingetragen sind. Der Grund ist, dass dieser Bogen jede dieser Kosten ohnehin kennt; ein zweites Mal danach zu fragen hieße, den Leser rechnen zu lassen, was die Datei rechnen kann — und eine „übrige“ Zahl, die den danebenstehenden Karten still widerspricht, ist ein Fehler, den niemand sieht. Wird mehr ausgegeben als verdient, steht die Zahl rot da statt bei null zu stoppen: Überziehen ist ein Fehler, auf den man zeigen will. Eines kann die Rechnung nicht sehen: auf Expertenstufe darf jeder Spieler beim Spielaufbau der Szenarien 2 bis 5 eine Unit ausgeben, um seine Identität zu heilen, und das hält der Bogen nirgends fest. Solange der Expertenhaken gesetzt ist, sagt der Spielerbereich das auch. Darunter folgt „Marktkarten im Spielerdeck“ als eine Überschrift über allen vier Spalten, so wie der Bogen sie druckt. Auf dem Papier ist das eine leere Fläche, hier sind es Auswahlfelder aus den 28 gedruckten Marktkarten, sortiert nach Unit-Kosten von 1 bis 7. Der Grund ist eine Regel, die das Papier nur beschreiben kann: von jeder Marktkarte darf die Gruppe während einer Kampagne nur ein Exemplar verwenden. Eine Karte, die irgendein Spieler gekauft hat, ist deshalb bei allen anderen gesperrt — ein Spieler darf aber beliebig viele haben. Die Sperre ist einseitig, wie bei MC60, MC32, MC40 und MC45: eine bereits eingetragene Karte bleibt auswählbar, damit ein Bogen aus einem Import oder einem alten Link nie festfriert. „Karten in der Sammlung“ ist dagegen Freitext, denn die Sammlung füllt sich mit dem, was die Spieler gerade auf der Hand hatten, und ist keine gedruckte Liste. Einträge lassen sich zwischen den Spielerspalten ziehen, weil Szenario #3 jeden Spieler genau seine eigenen notierten Karten aus dem Spiel entfernen lässt. Die vier „Galaktische Artefakte“-Nebenpläne sind Kästchen über dem Satz und keine numerierten Zeilen: der Bogen numeriert zwar vier Zeilen, aber die Nummer trägt nichts — das Set hat genau vier Nebenpläne, und Szenario #4 liest sie als Menge zurück, ein Spielaufbau-Effekt je notiertem Nebenplan. Unten stehen drei Felder. „Kontrolle des Machtsteins“ ist ein Auswahlfeld über die oben eingetragenen Identitäten; gespeichert wird der Spielerplatz, angezeigt der aktuelle Name, damit eine später korrigierte Identität die Eintragung nicht veralten lässt. „Ausweichmarker“ ist eine Zahl, und daneben steht abgeleitet, wie viel zusätzliche Bedrohung Szenario #5 daraus auf „Zangenmanöver“ legt: 3 minus die Zahl, mindestens 0. „Kopfgeldjäger besiegt?“ sind vier Kästchen, eines je Szenario 1 bis 4. Darunter steht abgeleitet, welche Karten die aktuelle Zahl der Kreuze freischaltet — und zu jeder, ab welchem Szenario sie überhaupt geprüft wird, denn die Staffel wächst mit dem Szenario: drei Kreuze bedeuten in Szenario #3 nicht drei zusätzliche Karten. Beide abgeleiteten Zeilen werden nur gerechnet, nie gespeichert und nicht mitgedruckt. Oben im Spielerbereich sitzt der Haken „Expertenmodus“. Er blendet die verbleibenden Lebenspunkte aus, und hier kennzeichnet der gedruckte Bogen das Feld ausnahmsweise selbst, indem er „(Experte)“ darunter setzt. Ausblenden heißt nicht löschen — der Wert bleibt im Bogen, im Export und im Share-Link. Ein fünftes Szenario gibt es hier nicht: Ronan der Ankläger kommt auf dem gedruckten Bogen kein einziges Mal vor, „Kopfgeldjäger besiegt?“ trägt die Unterzeile „Sieg-Anweisung für Szenarien #1 – 4“, und im Finale gibt es nichts festzuhalten außer dem Sieg. Die Abschnittsnamen und ihre Unterzeilen stehen hier so, wie die deutsche Spielanleitung sie auf den Seiten 22 und 23 druckt. Hinter jeder gewählten Marktkarte stehen ihre Unit-Kosten, denn ein zugeklapptes Auswahlfeld zeigt nur den Namen — ohne die Zahl daneben ließe sich der Kontostand oben nicht gegen die Karten prüfen, aus denen er fällt.",
    helpEn: "The MC16 sheet runs over two printed pages, and its player area is a shopping list. At the top each player has an identity, remaining hit points and their units. Units are the Guardians' currency: they are recorded after every scenario and spent between scenarios on Market cards. That is why they sit at both levels rather than behind the expert switch — the expert rules only give them one more use, healing your identity to its printed hit points at setup. And here the sheet departs from the paper on purpose: the print has an “Unspent Units” box, a running balance you write in pencil and rub out again with every purchase. What is entered here instead is “Units earned”, everything the campaign has paid out so far — and “Unspent Units” is computed from it: earned minus the unit cost of the Market cards recorded beside it. The reason is that this sheet already knows every one of those costs, so asking a second time for their difference would be asking the reader to do arithmetic the file can do — and an “unspent” number that silently disagrees with the cards next to it is a bug nobody can see. Spend more than you earned and the figure goes red rather than stopping at zero: overspending is a mistake worth pointing at. One thing the sum cannot see: at expert level the setup of scenarios #2 to #5 lets each player spend a unit to heal their identity, and nothing on the sheet records that they did. While the expert switch is on, the player area says so. Below that comes “Market Cards in Player's Deck” as one heading over all four columns, exactly as the sheet prints it. On paper it is an empty area; here it is selects out of the 28 printed Market cards, grouped by unit cost from 1 to 7. The reason is a rule the paper can only describe: only one copy of each Market card may be used by the players as a group during a campaign. A card bought by any player is therefore closed to all the others — though one player may hold as many as they like. The lock is one-sided, as in MC60, MC32, MC40 and MC45: a card already recorded stays selectable, so a sheet arriving from an import or an old share link never freezes solid. “Cards in The Collection”, by contrast, is free text: The Collection fills up with whatever the players happened to be holding, and is not a printed list. Entries can be dragged between the player columns, because scenario #3 has each player remove exactly their own recorded cards from the game. The four Galactic Artifacts side schemes are boxes over the set rather than numbered lines: the sheet does number four lines, but the number carries nothing — the set has exactly four side schemes, and scenario #4 reads them back as a set, one setup effect per recorded scheme. Three fields sit at the bottom. “Power Stone Control” is a select over the identities entered above; what is stored is the player's seat and what is shown is their current name, so correcting an identity later does not leave the record stale. “Evasion Counters” is a number, and beside it a derived line says how much extra threat scenario #5 puts on Pincer Maneuver because of it: 3 minus the number, floored at zero. “Headhunter Defeated?” is four boxes, one per scenario 1 to 4. Under them a derived line names the cards the current number of marks unlocks — and for each one, the scenario it is first checked from, because the ladder grows with the scenario: three marks do not mean three extra cards in scenario #3. Both derived lines are computed only, never stored, and never printed. At the top of the player area sits the “Expert level” box. It hides the remaining hit points, and here the printed sheet marks the field itself for once, setting “(Expert)” under it. Hiding is not clearing — the value stays in the sheet, in the export and in a share link. There is no fifth scenario here: Ronan the Accuser does not appear on the printed sheet once, “Headhunter Defeated?” is subtitled “Victory for Scenarios #1 – 4”, and the finale has nothing to record beyond the win. Behind every chosen Market card stands its unit cost, because a closed select shows only the name — without the figure beside it the balance above could not be checked against the cards it comes from.",

    /* Zwei Gruppen, und die Unterscheidung sagt, wer eine Änderung entscheidet:

       1. Wörter, die diese App selbst wählt — Platzhalter, Hinweise und das
          gemeinsame Vokabular aller Kampagnen („Verbleibende Lebenspunkte“,
          „Spieler-Informationen“, „Spieler #%s“) — sind wörtlich aus
          campaigns/age-of-apocalypse.js übernommen und gehören dorthin
          abgeglichen, nicht hier neu formuliert. Sie stehen sofort auf Deutsch.
       2. Wörter, die vom gedruckten Bogen kommen — die Abschnittsnamen, ihre
          Unterzeilen und die vier Szenarionamen — stehen wörtlich so da, wie
          der deutsche Druck sie setzt: Seiten 22 und 23 von
          "Marvel_Champions_das_Kartenspiel_Galaxy's Most Wanted_Regelheft.pdf".
          Wer eine davon ändert, ändert eine Aussage über das Papier und braucht
          das Papier dazu.

       Eine Entscheidung innerhalb von Gruppe 2, weil der Druck sich selbst
       widerspricht: `secMarket` steht im SINGULAR. Der deutsche Bogen setzt
       „Marktkarten im Spielerdeck“ über die Spieler 1 und 2 (S. 22) und
       „Marktkarten in Spielerdecks“ über die Spieler 3 und 4 (S. 23). Hier
       steht die Überschrift nur einmal, und der englische Bogen setzt auf
       beiden Seiten den Singular.

       Und wer eine ändert, liest helpDe/helpEn mit: die beiden zitieren die
       Abschnittsnamen, werden also zur Lüge, sobald ein Name wandert.

       Es migriert nichts, wenn sich eine Beschriftung ändert — persistiert
       werden nur Feldschlüssel, Slugs und ein Spielerplatz, nie
       Beschriftungen. */
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

        /* "Verdiente Units" statt "Units gesamt", weil das deutsche Regelheft
           auf Seite 4 genau so formuliert: "eure im Laufe der Kampagne
           verdienten Units". */
        colUnitsEarned: "Verdiente Units",
        /* "%s" = Summe der Unit-Kosten der eingetragenen Marktkarten. */
        unitsSpent: "(%s ausgegeben)",
        unitsOver: "Mehr ausgegeben als verdient.",
        healingSpend: "Abgezogen werden nur Marktkarten. Auf Expertenstufe kostet das Heilen beim Spielaufbau 1 Unit — die kennt der Bogen nicht, sie gehört oben von den verdienten Units abgezogen.",

        cardNamePlaceholder: "Kartenname …",
        marketPlaceholder: "Marktkarte …",
        addMarketCard: "+ Marktkarte",
        /* "%s" = Unit-Kosten. Überschrift einer Gruppe im Auswahlfeld. */
        unitCostGroup: "Unit-Kosten %s",
        powerStoneNobody: "– niemand –",
        /* "%s" = Identität, "%s" = Spielernummer. */
        powerStoneOption: "%s (Spieler #%s)",
        powerStoneNoIdentity: "Noch keine Identität eingetragen — die stehen oben im Spielerbereich.",
        /* "%s" = 3 minus die Ausweichmarker, mindestens 0. */
        pincerHint: "Szenario #5: %s zusätzliche Bedrohung auf „Zangenmanöver“.",
        /* "%s" = Anzahl der Kreuze, "%s" = die freigeschalteten Karten. */
        headhunterLadder: "Kreuze: %s — der Spielaufbau mischt zusätzlich ein: %s",
        headhunterLadderNone: "Kein Kreuz — außer dem Badoon-Kopfgeldjäger kommt nichts hinzu.",
        /* "%s" = Kartenname, "%s" = Szenarionummer. */
        headhunterFrom: "%s (ab Szenario %s)",

        /* ---- Wörtlich vom deutschen Druck, Seiten 22 und 23 --------------- */
        colUnits: "Übrige Units",
        secMarket: "Marktkarten im Spielerdeck",
        subMarket: "Können zwischen Szenarien hinzugefügt werden. Details auf Seite 5.",
        secCollection: "Karten in der Sammlung",
        subCollection: "Sieg-Anweisung für Szenario #2 – Einbruch ins Museum",
        secArtifacts: "„Galaktische Artefakte“-Nebenpläne im Siegpunktestapel",
        subArtifacts: "Sieg-Anweisung für Szenario #3 – Flucht aus dem Museum",
        secPowerStone: "Kontrolle des Machtsteins",
        subPowerStone: "Sieg-Anweisung für Szenario #4 – Nebula",
        secEvasion: "Ausweichmarker",
        subEvasion: "Sieg-Anweisung für Szenario #4 – Nebula",
        secHeadhunter: "Kopfgeldjäger besiegt?",
        subHeadhunter: "Sieg-Anweisung für Szenarien #1 – 4",
        /* "%s" = Szenarionummer, "%s" = Szenarioname. Der Bogen setzt beides
           übereinander auf die Kachel. */
        scenarioTile: "Szenario #%s – %s",
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

        colUnitsEarned: "Units earned",
        unitsSpent: "(%s spent)",
        unitsOver: "More spent than earned.",
        healingSpend: "Only Market cards are subtracted. At expert level, healing at setup costs 1 unit — the sheet cannot see that one, so take it off the units earned above yourself.",

        cardNamePlaceholder: "Card name …",
        marketPlaceholder: "Market card …",
        addMarketCard: "+ Market card",
        unitCostGroup: "Unit Cost %s",
        powerStoneNobody: "– nobody –",
        powerStoneOption: "%s (Player #%s)",
        powerStoneNoIdentity: "No identity entered yet — they go in the player area above.",
        pincerHint: "Scenario #5: %s additional threat on “Pincer Maneuver”.",
        headhunterLadder: "Marks: %s — the setup additionally shuffles in: %s",
        headhunterLadderNone: "No marks — nothing is added beyond the Badoon Headhunter.",
        headhunterFrom: "%s (from scenario %s)",

        colUnits: "Unspent Units",
        secMarket: "Market Cards in Player's Deck",
        subMarket: "May be added between scenarios. See page 5 for details.",
        secCollection: "Cards in The Collection",
        subCollection: "Victory for Scenario #2 – Infiltrate the Museum",
        secArtifacts: "Galactic Artifacts Side Schemes in the Victory Display",
        subArtifacts: "Victory for Scenario #3 – Escape the Museum",
        secPowerStone: "Power Stone Control",
        subPowerStone: "Victory for Scenario #4 – Nebula",
        secEvasion: "Evasion Counters",
        subEvasion: "Victory for Scenario #4 – Nebula",
        secHeadhunter: "Headhunter Defeated?",
        subHeadhunter: "Victory for Scenarios #1 – 4",
        scenarioTile: "Scenario #%s – %s",
      },
    },
  });
}(window));

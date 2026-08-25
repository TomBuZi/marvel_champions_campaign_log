/* Marvel Champions — "Mutant Genesis" (MC32) campaign log.

   One printed page, and the most checkbox-heavy of the sheets: a player
   block, four named boxes for the campaign side schemes, two Future Past
   sections, a Role Upgrades area, three Jubilee columns and two ally areas.
   There is no scenario table, no "completed", no progress counter and no notes
   field, because the sheet has none. Those absences are the sheet, not an
   omission. Nor is there a single glyph from the publisher's icon font
   anywhere on it — worth saying after MC27, where that had to be checked for
   rather than assumed.

   The sheet stops at SCENARIO 4 although the campaign has five. Scenario #5
   (Magneto) is the finale: its Setup instructions READ the log, but its
   Victory step records nothing, because the campaign is over. The fifth
   scenario is no more missing here than Loki is missing from MC21.

   NO ROW LINES. Not one of the write-in areas prints a divider: the content
   stream holds the panel frames and the three vertical rules between the Role
   Upgrade columns, and nothing else. So the sheet never says how many entries
   belong in an area — and nothing here invents a number, because every one of
   those areas means a finite printed card set. Where the area asks WHICH cards
   out of a set, this has that set as named boxes; that is the MC21/MC27 shape,
   and it also removes the temptation to guess a row count.

   The one number that had to be derived is five — how many upgrades a role
   has — and three independent readings agree on it:

     * each role's set is exactly five cards, each at quantity 1;
     * the campaign grants one at scenario 1's setup and one at each of
       scenarios 2 to 5, the latter only if the previous scenario's campaign
       side scheme is checked in the log: 1 + 4 = 5;
     * and the sheet prints exactly four of those side-scheme boxes, so four is
       the most that can ever be checked.

   Same kind of cross-check as MC27's three Osborn Tech rungs against its three
   printed cells.

   TWO SECTIONS THAT LOOK ALIKE AND ARE NOT. "Future Past Cards in the Victory
   Display" prints no columns; "Future Past Cards in the Encounter Deck" prints
   four, one per scenario. That difference IS the data model. A card in the
   victory display is removed from the campaign, which is permanent and
   accumulates over the whole campaign, so it is one set. A card in the
   encounter deck is shuffled back in at the next scenario's setup and can be
   recorded again, so each scenario keeps its own column and the same card may
   stand in several of them.

   THREE DEPARTURES from the paper, all because the app knows something the
   paper cannot:

   1. "Role Upgrades in Play" is printed as its own area with a Player #1..#4
      column. That column is just the player list again, so the boxes sit in
      the player cards instead — the same move MC10 makes with its upgrades and
      MC27 with its three reward fields. Here it is forced anyway: which five
      names the boxes carry follows the player's chosen role.
   2. What is recorded under a role the player no longer holds is kept, not
      shown as boxes, and the card says so. See `upgrades` in normalize().
   3. Where the rulebook says a card or a character is GONE — or not there
      yet — the boxes that would contradict it close. Where it caps a number rather than naming a
      card, the sheet only says so. The line falls between an identity and a
      count, and every lock here is ONE-SIDED — a box that is itself ticked
      stays operable, because normalize() picks no winner for a contradiction
      and the way out therefore has to be on screen. A sheet arriving from an
      import or a hand-edited file must never be frozen solid.

      * Jubilee's "in play" and "removed from campaign" are two states of one
        outcome ("if in play, record that; OTHERWISE remove her"), printed side
        by side under one SCENARIO label — so they close each other, exactly as
        MC60's Completed and Failed do.
      * The Jubilee columns hang together in both directions. A column is
        closed until the one before it records her in play, because that is the
        only reason the later scenario asks at all — scenario 2's victory step
        writes her into the log and scenario 3's setup puts her into play.
        Scenario 2 has nothing before it and is always open. And once she is
        removed from the campaign she does not come back, so every box of every
        LATER scenario closes as well. The contradiction still gets its marker:
        with the earlier column corrected afterwards, the box that is still
        open is the one to fix.
      * A card in the victory display is removed from the campaign, so its
        whole row in the encounter-deck grid closes. One-sided matters most
        here: a card can legitimately sit in an early scenario's column and
        land in the victory display two scenarios later, and this section
        prints no columns, so the log cannot say when it was removed. Closing
        the empty cells prevents the next wrong entry; closing the ticked ones
        would call a correct record an error.
      * The side-scheme boxes govern how many role upgrades the campaign has
        handed out, but they govern a COUNT, not an identity: "at most 1 plus
        the checked ones out of these five, but not which". Closing that would
        mean closing whichever boxes happen to be unticked when the cap is hit,
        and a fresh sheet — cap 1 — would arrive four fifths shut. So nothing
        happens at all: the paper does not check it, the players know the rule,
        and a running count on screen would start to read as a limit.

   And one thing that cannot be built here at all: nothing may depend on "which
   scenario is being played now", because this sheet records no progress
   whatsoever. Any gate that would need it is impossible, not merely unwanted.

   The campaign is played at standard or expert level, and the remaining hit
   points are the only field the sheet marks "(expert)", so a standard game
   hides that one and nothing else — the role and its boxes stay. Hides, not
   clears: the value stays in the sheet, in the JSON export and in a share
   link. See `expert` below.

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
  /* The scenarios the sheet records — four, not the campaign's five. See the
     header: the finale writes nothing down. */
  var SCENARIO_COLUMNS = 4;

  /* ---- CARD SETS -----------------------------------------------------------
     Every card carries an English and a German name, as in MC10, MC21 and
     MC27. `de: null` shows the English name and tags it lang="en".

     The German names are entered, taken from the German printing rather than
     from marvelsdb, which carries no German data for this product at all — its
     German pack file is an English copy.

     What `de: null` is left means the MC10/MC21 thing: the name STAYS ENGLISH
     in the German printing, and that is a decision rather than open work. All
     six are characters — Nimrod and Bastion below, and the four CAPTIVE allies
     — which is the convention of the German edition throughout: figures keep
     their names, scenarios and schemes get translated. See "Hinweise zu den
     Namen" in the README. Filling one in anyway migrates nothing, because only
     the slug is ever persisted. */

  /* The four campaign side schemes, one per scenario, in scenario order. Their
     box on the sheet reads "<name> Defeated".

     The sheet prints "Enemy of my Enemy" with a lowercase "my" while the card
     itself is titled "Enemy of My Enemy". The log is a copy of the sheet, so
     the sheet's wording stands — this is not a typo to correct. */
  var SIDE_SCHEMES = [
    { slug: "frightened-police",  en: "Frightened Police",  de: "Verängstigte Polizei" },
    { slug: "enemy-of-my-enemy",  en: "Enemy of my Enemy",  de: "Der Feind meines Feindes" },
    { slug: "find-the-prisoners", en: "Find the Prisoners", de: "Findet die Gefangenen" },
    { slug: "surprise-attack",    en: "Surprise Attack",    de: "Überraschender Angriff" },
  ];

  /* The whole Future Past modular set: five cards, each at quantity 1. Both
     Future Past sections draw on this one set. */
  var FUTURE_PAST = [
    { slug: "nimrod",                en: "Nimrod",                 de: null },
    { slug: "bastion",               en: "Bastion",                de: null },
    { slug: "nimrods-portal",        en: "Nimrod's Portal",        de: "Nimrods Portal" },
    { slug: "bastions-machinations", en: "Bastion's Machinations", de: "Bastions Machenschaften" },
    { slug: "nano-sentinel-tech",    en: "Nano-Sentinel Tech",     de: "Nano-Sentinel-Technologie" },
  ];

  /* The CAPTIVE allies that Abduction Protocols can bring into play in
     scenario 2 — four of them, and the side scheme itself comes in a quantity
     of four, which is why the section needs no more places than this. */
  var CAPTIVE_ALLIES = [
    { slug: "rictor",     en: "Rictor",     de: null },
    { slug: "boom-boom",  en: "Boom Boom",  de: null },
    { slug: "cannonball", en: "Cannonball", de: null },
    { slug: "wolfsbane",  en: "Wolfsbane",  de: null },
  ];

  /* The four campaign roles with their five upgrades each, in printed order.

     The slug carries the role, and it has to: four titles appear under two
     roles each — Coup de Grace (Brawler, Commander), Swagger (Brawler,
     Defender), Surprise! (Defender, Peacekeeper), Compassion (Commander,
     Peacekeeper). A slug of "swagger" would silently merge two different cards
     the first time one group played Brawler and another Defender. */
  var ROLES = [
    { slug: "brawler", en: "Brawler", de: "Kämpfer", upgrades: [
      { slug: "brawler-coup-de-grace",    en: "Coup de Grâce",    de: "Gnadenstoss" },
      { slug: "brawler-swagger",          en: "Swagger",          de: "Lässigkeit" },
      { slug: "brawler-brazen-defense",   en: "Brazen Defense",   de: "Eherne Verteidigung" },
      { slug: "brawler-ferocious-attack", en: "Ferocious Attack", de: "Heftiger Angriff" },
      { slug: "brawler-war-cry",          en: "War Cry",          de: "Schlachtruf" },
    ] },
    { slug: "commander", en: "Commander", de: "Anführer", upgrades: [
      { slug: "commander-coup-de-grace", en: "Coup de Grâce", de: "Gnadenstoss" },
      { slug: "commander-compassion",    en: "Compassion",    de: "Mitgefühl" },
      { slug: "commander-group-assault", en: "Group Assault", de: "Gruppenangriff" },
      { slug: "commander-shock-and-awe", en: "Shock and Awe", de: "Angst und Schrecken" },
      { slug: "commander-improvisation", en: "Improvisation", de: "Improvisation" },
    ] },
    { slug: "defender", en: "Defender", de: "Verteidiger", upgrades: [
      { slug: "defender-swagger",             en: "Swagger",             de: "Lässigkeit" },
      { slug: "defender-surprise",            en: "Surprise!",           de: "Überraschung!" },
      { slug: "defender-heroic-intervention", en: "Heroic Intervention", de: "Heldenhafte Intervention" },
      { slug: "defender-determined-defense",  en: "Determined Defense",  de: "Entschlossene Verteidigung" },
      { slug: "defender-bodyguard",           en: "Bodyguard",           de: "Leibwächter" },
    ] },
    { slug: "peacekeeper", en: "Peacekeeper", de: "Friedenswächter", upgrades: [
      { slug: "peacekeeper-surprise",         en: "Surprise!",        de: "Überraschung!" },
      { slug: "peacekeeper-compassion",       en: "Compassion",       de: "Mitgefühl" },
      { slug: "peacekeeper-rescue-operation", en: "Rescue Operation", de: "Rettungsoperation" },
      { slug: "peacekeeper-mentorship",       en: "Mentorship",       de: "Mentoring" },
      { slug: "peacekeeper-fortitude",        en: "Fortitude",        de: "Standhaftigkeit" },
    ] },
  ];

  /* Every upgrade in one flat list, in role order and then in printed order
     within the role. normalize() canonicalises against THIS rather than against
     a player's current role, and being one fixed order is what makes it a
     fixpoint. UPGRADES_OF is the render side: which five boxes a card shows. */
  var ALL_UPGRADES = [];
  var UPGRADES_OF = {};
  ROLES.forEach(function (role) {
    UPGRADES_OF[role.slug] = role.upgrades;
    role.upgrades.forEach(function (u) { ALL_UPGRADES.push(u); });
  });
  /* Jubilee, as the sheet prints her: scenario 2 gets ONE box, scenarios 3 and
     4 get two each. The asymmetry is not an oversight to fix — she enters play
     during scenario 2, so at that point there is nothing to remove yet. */
  var JUBILEE = [
    { scenario: 2, inPlay: "s2InPlay", removed: null },
    { scenario: 3, inPlay: "s3InPlay", removed: "s3Removed" },
    { scenario: 4, inPlay: "s4InPlay", removed: "s4Removed" },
  ];

  /* Every Jubilee box key in sheet order, derived so it cannot fall out of step
     with the table above. normalize() walks this, which is what keeps a
     forgotten box from silently dropping out of a saved sheet. */
  var JUBILEE_KEYS = [];
  JUBILEE.forEach(function (col) {
    JUBILEE_KEYS.push(col.inPlay);
    if (col.removed) JUBILEE_KEYS.push(col.removed);
  });

  // ---- Lookups -------------------------------------------------------------
  function inPool(pool, slug) {
    for (var i = 0; i < pool.length; i++) if (pool[i].slug === slug) return pool[i];
    return null;
  }
  function poolIndex(pool, slug) {
    for (var i = 0; i < pool.length; i++) if (pool[i].slug === slug) return i;
    return pool.length;
  }
  /* The name to show. Falls back to English while `de` is null, so a card
     without a German name yet is readable rather than blank. */
  function entryName(entry, lang) {
    return (lang === "de" && entry.de) ? entry.de : entry.en;
  }
  /* "en" only while the English name is what is actually on screen: tagging a
     German name as English would mislead hyphenation and screen readers. The
     other modules do the same. */
  function entryLang(entry, lang) {
    return (lang === "de" && entry.de) ? null : "en";
  }
  function poolName(pool, slug, lang) {
    var entry = inPool(pool, slug);
    return entry ? entryName(entry, lang) : null;
  }
  /* The five boxes a player's card shows, or none while no role is chosen. */
  function upgradesOf(player) {
    return UPGRADES_OF[player.role] || [];
  }

  // ---- Data ----------------------------------------------------------------
  function emptyState() {
    return {
      /* Standard or expert level. Only the display follows this: switching back
         to standard HIDES the remaining hit points, it does not clear them, so
         a sheet toggled by accident loses nothing. */
      expert: false,
      /* A fresh sheet starts with a single player; more are added as needed. */
      players: [newPlayer()],
      /* Which of the four campaign side schemes were defeated. A set rather
         than four cells: the sheet prints four NAMED boxes, and the names are
         what says which is which. */
      sideSchemes: [],
      /* Removed from the campaign, and that is permanent — so one set over the
         whole campaign. The sheet prints this area with no columns at all,
         directly above one that has four, and that difference is the reason. */
      futurePastVictory: [],
      /* Four columns, one per scenario, each a set of its own. */
      futurePastDeck: emptyColumns(),
      /* Five booleans, exactly as printed: one box for scenario 2, two each
         for scenarios 3 and 4. */
      jubilee: emptyJubilee(),
      /* Which of the four CAPTIVE allies of Abduction Protocols entered play. */
      captiveAllies: [],
      /* Free text, because these are the players' OWN allies out of their own
         decks — not a finite printed list. Same reasoning as MC10's removed
         cards and MC27's Aspect Advantage. */
      removedAllies: [],
    };
  }

  function newPlayer() {
    return {
      hero: "",
      hp: null,
      /* One of the four printed roles. The sheet prints "Role:" as a line to
         write on, but there are exactly four of them and each player must take
         a different one, so it is a pool with cross-player exclusion — the same
         move MC10 makes with its Tech Upgrades. */
      role: "",
      /* Which of that role's five upgrades have been in play and are therefore
         removed from the campaign. Keyed by a ROLE-QUALIFIED slug, because four
         of the twenty titles appear under two roles. */
      upgrades: [],
    };
  }

  function emptyColumns() {
    var out = [];
    for (var i = 0; i < SCENARIO_COLUMNS; i++) out.push([]);
    return out;
  }

  function emptyJubilee() {
    var out = {};
    JUBILEE_KEYS.forEach(function (key) { out[key] = false; });
    return out;
  }

  /* Never throws. Starts from emptyState() and overlays only what it
     recognises, so a hand-edited file, a foreign export or a truncated share
     link cannot produce an invalid sheet. Fields this sheet does not have —
     MC60's `scenarios`, MC21's `flags`, MC10's `removed` — are simply never
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
        role: inPool(ROLES, p.role) ? p.role : "",
        /* Read against ALL twenty upgrades, NOT against the role above. Two
           reasons, both about not losing a record:

             * a role comes out of a dropdown, so a mis-click is by far the
               likeliest way one ever changes, and dropping five marks on a
               mis-click is MC60's `expert: false` lesson all over again;
             * "each player must choose a different role" makes a SWAP a normal
               operation, and a swap has to pass through a moment where one of
               the two players holds no role at all. If clearing a role cleared
               the marks, correcting two players who wrote their roles down the
               wrong way round would destroy both records.

           A role-filtering normalize() would be idempotent too, so idempotence
           is NOT the argument here — data loss is. paintUpgrades() says on
           screen that marks under another role are being kept, so nothing goes
           quietly invisible. */
        upgrades: pickSlugs(p.upgrades, ALL_UPGRADES),
      });
    }
    /* "Each player must choose a different role" — the rulebook, not the
       sheet, which prints a blank line. First occurrence in player order wins,
       exactly as with MC10's upgrades: which of the two was meant is not ours
       to guess, and the alternative is a sheet that cannot legally be played.
       Deliberately does NOT touch `upgrades`, or the mere order two players
       arrived in an import would decide whose five marks survive. */
    dropRepeats(out.players, "role");

    out.sideSchemes = pickSlugs(raw.sideSchemes, SIDE_SCHEMES);
    out.futurePastVictory = pickSlugs(raw.futurePastVictory, FUTURE_PAST);

    /* A fixed row of four columns, one per scenario. The ROW is never sorted —
       column 3 means scenario 3 — while each column is canonicalised into pool
       order. And unlike MC27's Osborn Tech cells there is NO cross-column
       uniqueness: a Future Past card recorded after scenario 1 is shuffled
       back into the encounter deck at scenario 2's setup and can be recorded
       again, so deduplicating across columns would delete the campaign's
       normal case. */
    var cols = Array.isArray(raw.futurePastDeck) ? raw.futurePastDeck : [];
    out.futurePastDeck = [];
    for (var c = 0; c < SCENARIO_COLUMNS; c++) {
      out.futurePastDeck.push(pickSlugs(cols[c], FUTURE_PAST));
    }

    /* Read by key, not by copying the object: an unknown key in the input is
       dropped and a missing one reads as false. The two boxes of a scenario are
       read INDEPENDENTLY — a sheet arriving with "in play" and "removed" both
       set keeps both, because which one was meant is not ours to guess and
       picking a winner would destroy the other. paintJubilee() then leaves both
       operable, the way MC60 unfreezes its own contradictory pair. */
    var jub = (raw.jubilee && typeof raw.jubilee === "object") ? raw.jubilee : {};
    JUBILEE_KEYS.forEach(function (key) {
      out.jubilee[key] = W.coerceBool(jub[key]);
    });

    out.captiveAllies = pickSlugs(raw.captiveAllies, CAPTIVE_ALLIES);
    out.removedAllies = W.coerceStringList(raw.removedAllies, { split: true, trim: true });

    return out;
  }

  /* The recognised slugs of `raw`, in the pool's own order and without
     duplicates. Canonical output is what makes normalize() a fixpoint: the
     same set always comes back in the same order, so a second pass and a JSON
     round-trip both change nothing. Same helper MC10 and MC27 use. */
  function pickSlugs(raw, pool) {
    var wanted = {};
    (Array.isArray(raw) ? raw : []).forEach(function (v) {
      if (typeof v === "string") wanted[v] = true;
    });
    return pool.filter(function (e) { return wanted[e.slug]; })
      .map(function (e) { return e.slug; });
  }

  /* Enforce "at most one player holds this", in player order. */
  function dropRepeats(players, key) {
    var seen = {};
    players.forEach(function (p) {
      if (!p[key]) return;
      if (seen[p[key]]) p[key] = "";
      else seen[p[key]] = true;
    });
  }

  /* Add or remove one slug, keeping the list in the pool's order so it matches
     what normalize() would produce. */
  function toggleSlug(list, pool, slug, on) {
    var at = list.indexOf(slug);
    if (on && at === -1) {
      list.push(slug);
      list.sort(function (a, b) { return poolIndex(pool, a) - poolIndex(pool, b); });
    } else if (!on && at !== -1) {
      list.splice(at, 1);
    }
  }

  /* No migrate(): stateVersion is 1, so there is no older shape in the wild
     yet. The first change to the shape above has to bring one with it — see
     the check in test/lint.js. Note especially that anything added beside
     `role` and `upgrades` has to decide what its default MEANS for sheets that
     are already saved. */

  /* Counts a hidden hit point value too: at standard level the field is not on
     screen, but what is written there is still on the sheet, so removing the
     card would still lose it. */
  function playerHasContent(player) {
    return !!player.hero.trim() || player.hp != null ||
      !!player.role || player.upgrades.length > 0;
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

  /* The line the sheet prints under a section heading — "Scenarios #1-4
     (remove these from the campaign)". It says which games the entries came out
     of, so it belongs on screen too. */
  function subtitle(section, text) {
    var p = W.el("p", "hint");
    p.textContent = text;
    section.appendChild(p);
    return section;
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

  /* One box. `parts` is what the box says, in order; an entry with a `lang` is
     a card name and carries the tag, an entry without one is a word this app
     or the sheet supplies. Keeping them apart is what stops a German label
     from being announced as English. */
  function flagBox(parts, cfg) {
    var flag = W.el("label", "flag");
    var text = W.el("span");
    parts.forEach(function (part, i) {
      if (i) text.appendChild(document.createTextNode(" "));
      var piece = W.el("span", null, part.lang ? { lang: part.lang } : null);
      piece.textContent = part.text;
      text.appendChild(piece);
    });
    flag.appendChild(text);
    var box = W.checkbox({
      checked: cfg.checked,
      label: cfg.label,
      onChange: cfg.onChange,
    });
    if (cfg.data) {
      Object.keys(cfg.data).forEach(function (k) { box.setAttribute(k, cfg.data[k]); });
    }
    flag.appendChild(box);
    return flag;
  }

  /* A row of named boxes with no caption over it: the panel heading is the
     caption, because the sheet prints the heading once and then bare cells.
     Each box still needs a name of its own, so it takes the heading and the
     card. */
  function flagRow(heading, pool, lang, cfg) {
    var wrap = W.el("div", "player-field");
    var row = W.el("div", "flag-row");
    pool.forEach(function (entry) {
      row.appendChild(flagBox([{ text: entryName(entry, lang), lang: entryLang(entry, lang) }], {
        checked: cfg.isOn(entry),
        label: heading + " – " + entryName(entry, lang),
        onChange: function (next) { cfg.onChange(entry, next); },
      }));
    });
    wrap.appendChild(row);
    return wrap;
  }

  /* One column of a printed grid: the SCENARIO caption the sheet puts over it,
     then its own content, then the line for anything the app has to say about
     it. */
  function cell(captionText) {
    var box = W.el("div", "cell");
    var caption = W.el("p", "field-label");
    caption.textContent = captionText;
    box.appendChild(caption);
    return box;
  }

  function render(root, ctx) {
    var t = ctx.t, lang = ctx.lang, state = ctx.state;

    root.appendChild(renderPlayers(t, lang, state, ctx));
    root.appendChild(renderSideSchemes(t, lang, state, ctx));
    root.appendChild(renderFuturePastVictory(t, lang, state, ctx));
    root.appendChild(renderFuturePastDeck(t, lang, state, ctx));
    root.appendChild(renderJubilee(t, state, ctx));

    /* The sheet's ONE side-by-side pair, and the only .scenario-row here for
       that reason: everything above is printed full width, so pairing any of it
       to save vertical space would be a small lie about the paper. */
    var row = W.el("div", "scenario-row");
    row.appendChild(renderAbductionProtocols(t, lang, state, ctx));
    row.appendChild(renderRemovedAllies(t, ctx));
    root.appendChild(row);

    /* Last, once everything is in the document: what a player's column says
       follows their role, and how many upgrades the campaign has granted
       follows the side-scheme boxes in another panel. Both derived, never
       stored, and neither ever closes a box — see the file header. */
    paintUpgrades(t, state);
    paintFuturePast(t, state);
    paintJubilee(t, state);
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
       not caught up with yet must remain typeable. The role beneath it is not
       free text — there are four of them and they are printed. */
    var heroes = global.HEROES || [];
    var listId = "hero-suggestions";
    grid.appendChild(W.dataList(listId, heroes.map(function (h) {
      return (lang === "de" && h.de) ? h.de : h.en;
    })));

    /* Collected across all the cards so a role another player already holds
       greys out, in place and without a re-render. */
    var roleSelects = [];

    state.players.forEach(function (player, i) {
      var card = W.el("div", "player-card", { "data-player": String(i + 1) });
      var caption = t("playerRow", String(i + 1));

      var head = W.el("div", "player-head");
      var idLabel = W.el("div", "player-name");
      idLabel.textContent = caption;
      head.appendChild(idLabel);

      /* Removing the last player would leave a sheet with nobody on it, so that
         one stays put. Anything else goes, with a confirmation when there is
         something on the card to lose — and a card here carries a role and up
         to five recorded upgrades besides the name and the number. */
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
             and renumber, and the role pool has to be recomputed against the
             players that are left. */
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

      /* Expert only — the one field the sheet marks "(expert)": the remaining
         hit points carry over into the next scenario, which is a rule the
         standard campaign does not have. Hidden at standard level, never
         cleared, so it is still in the export and in a share link. */
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

      /* The role, and directly under it the boxes whose names it decides:
         cause next to effect. Not expert-gated — the sheet prints "(expert)"
         under the hit points only. */
      var roleSelect = W.poolSelect({
        value: player.role,
        label: caption + " – " + t("colRole"),
        placeholder: t("rolePlaceholder"),
        options: ROLES.map(function (e) {
          return { value: e.slug, label: entryName(e, lang), lang: entryLang(e, lang) };
        }),
        onChange: function (next) {
          player.role = next;
          ctx.save();
          /* A re-render, not a paint: five box LABELS change, and a paint pass
             cannot rebuild labels. A <select> change is a commit rather than
             mid-typing, so no caret is lost — the same call MC60's Completed
             box and the expert switch make. Redrawing only this one column in
             place would keep the focus on the select, and is not worth the
             code; if that ever matters, this is the line to revisit. */
          ctx.rerender();
        },
      });
      roleSelects.push(roleSelect);
      card.appendChild(fieldRow(t("colRole"), roleSelect));

      /* "Role Upgrades in Play". The five boxes of the chosen role, or none at
         all while there is no role — and in that case a line saying so, rather
         than an empty space that means nothing. The subtitle the sheet prints
         over the whole area sits on the label as its title: repeating it in
         every card would print it four times. */
      var upgrades = W.el("div", "player-field", { "data-upgrades": String(i) });
      var upLabel = W.el("p", "field-label");
      upLabel.textContent = t("lblRoleUpgrades");
      upLabel.title = t("subRoleUpgrades");
      upLabel.appendChild(W.el("span", "lock-note"));
      upgrades.appendChild(upLabel);

      var upRow = W.el("div", "flag-row");
      upgradesOf(player).forEach(function (entry) {
        upRow.appendChild(flagBox([{ text: entryName(entry, lang), lang: entryLang(entry, lang) }], {
          checked: player.upgrades.indexOf(entry.slug) !== -1,
          label: caption + " – " + t("lblRoleUpgrades") + " – " + entryName(entry, lang),
          data: { "data-upgrade": entry.slug },
          onChange: function (next) {
            toggleSlug(player.upgrades, ALL_UPGRADES, entry.slug, next);
            ctx.save();
            /* In place: nothing appears or disappears, only what the note
               says. A re-render here would cost the focus for no reason. */
            paintUpgrades(t, state);
          },
        }));
      });
      upgrades.appendChild(upRow);
      card.appendChild(upgrades);

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

    /* Last, so every select starts out showing which roles the others hold. */
    W.syncUnique(roleSelects);

    /* Two players cannot field the same hero. The paper sheet does not stop
       you, so neither do we — but a quiet marker beats silently allowing a
       typo to look correct. */
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

  /* The one thing a player's upgrade column has to say that is not a box: that
     there is no role yet, so an empty space does not have to be guessed at.

     Two things it deliberately does NOT say. It does not mention marks kept
     under a role the player no longer holds — the behaviour stays, because a
     mis-clicked dropdown must not cost a record, but it is bookkeeping and not
     something to interrupt anyone with; the marks are in the JSON export and
     in a share link, which is where a record belongs. And it does not count
     how many upgrades the campaign has granted against how many are ticked:
     that is a rule the players know, the paper does not check it either, and a
     number standing there permanently starts to look like a limit. Nothing is
     closed in either case. */
  function paintUpgrades(t, state) {
    Array.prototype.forEach.call(document.querySelectorAll("[data-upgrades]"), function (row) {
      var player = state.players[parseInt(row.getAttribute("data-upgrades"), 10)];
      var note = row.querySelector(".lock-note");
      if (!player || !note) return;
      note.textContent = player.role ? "" : t("upgradeNoRole");
    });
  }

  /* The four campaign side schemes. The sheet prints a SCENARIO pill over each
     box, so each keeps its own column rather than being one flat row: which
     scenario a box belongs to is part of what it says. */
  function renderSideSchemes(t, lang, state, ctx) {
    var section = panel("side-schemes", t("secSideSchemes"));
    var row = W.el("div", "cell-row", { "data-cells": String(SIDE_SCHEMES.length) });
    SIDE_SCHEMES.forEach(function (entry, i) {
      var box = cell(t("colScenario", String(i + 1)));
      var flags = W.el("div", "flag-row");
      var name = entryName(entry, lang);
      flags.appendChild(flagBox(
        [{ text: name, lang: entryLang(entry, lang) }, { text: t("lblDefeated") }], {
          checked: state.sideSchemes.indexOf(entry.slug) !== -1,
          label: t("colScenario", String(i + 1)) + " – " + name + " " + t("lblDefeated"),
          onChange: function (next) {
            toggleSlug(state.sideSchemes, SIDE_SCHEMES, entry.slug, next);
            ctx.save();
            /* The count these boxes govern is shown in the player cards, so
               the effect is in another panel — painted in place, MC27's
               paintGates idiom. */
            paintUpgrades(t, state);
          },
        }));
      box.appendChild(flags);
      row.appendChild(box);
    });
    section.appendChild(row);
    return section;
  }

  /* One set over the whole campaign: a card in the victory display is removed
     from the campaign for good, and the sheet prints this area with no columns
     to say when that happened. */
  function renderFuturePastVictory(t, lang, state, ctx) {
    var section = panel("future-past-victory", t("secFuturePastVictory"));
    subtitle(section, t("subFuturePastVictory"));
    section.appendChild(flagRow(t("secFuturePastVictory"), FUTURE_PAST, lang, {
      isOn: function (e) { return state.futurePastVictory.indexOf(e.slug) !== -1; },
      onChange: function (e, on) {
        toggleSlug(state.futurePastVictory, FUTURE_PAST, e.slug, on);
        ctx.save();
        /* The card's row in the grid below closes with this — painted in
           place, because cause and effect sit in different panels. */
        paintFuturePast(t, state);
      },
    }));
    return section;
  }

  /* The one grid on this sheet: five cards against four scenarios. Transposed
     against the print — cards down the side, scenarios across the top —
     because the sheet prints four blank areas and some layout has to be
     chosen: this way twenty repeated card names become five plus four column
     labels, and a cell means nothing without both its card and its scenario,
     which is exactly what <th scope> conveys. Its printed column order is
     kept. */
  function renderFuturePastDeck(t, lang, state, ctx) {
    var section = panel("future-past-deck", t("secFuturePastDeck"));
    subtitle(section, t("subFuturePastDeck"));

    var table = W.el("table", "sheet-table fp-table");
    var caption = W.el("caption", "sr-only");
    caption.textContent = t("secFuturePastDeck");
    table.appendChild(caption);

    var thead = W.el("thead");
    var hrow = W.el("tr");
    var corner = W.el("th", null, { scope: "col" });
    corner.textContent = t("colCard");
    hrow.appendChild(corner);
    for (var c = 0; c < SCENARIO_COLUMNS; c++) {
      var th = W.el("th", null, { scope: "col" });
      th.textContent = t("colScenario", String(c + 1));
      hrow.appendChild(th);
    }
    thead.appendChild(hrow);
    table.appendChild(thead);

    var tbody = W.el("tbody");
    FUTURE_PAST.forEach(function (entry) {
      var tr = W.el("tr", null, { "data-fp-row": entry.slug });
      var name = entryName(entry, lang);
      var rowHead = W.el("th", "card-name", { scope: "row", lang: entryLang(entry, lang) });
      rowHead.textContent = name;
      tr.appendChild(rowHead);

      state.futurePastDeck.forEach(function (column, i) {
        var label = t("colScenario", String(i + 1));
        var td = W.el("td", null, { "data-label": label });
        var box = W.checkbox({
          checked: column.indexOf(entry.slug) !== -1,
          /* Card and scenario both, because a bare checkbox in a grid is
             otherwise unnameable. */
          label: label + " – " + name,
          onChange: function (next) {
            toggleSlug(column, FUTURE_PAST, entry.slug, next);
            ctx.save();
            /* Clearing the last ticked cell of a removed card closes that one
               too, so the row has to be repainted from here as well. */
            paintFuturePast(t, state);
          },
        });
        box.setAttribute("data-fp-col", String(i));
        td.appendChild(box);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    section.appendChild(table);
    return section;
  }

  /* A card in the victory display is removed from the campaign, so no
     scenario's encounter deck can hold it any more: its whole row in the grid
     closes and says so. Derived every time, nothing stored.

     One-sided, like the Jubilee pair below: a cell that is already ticked stays
     operable. That is not a technicality — a card can legitimately sit in an
     early scenario's column and land in the victory display two scenarios
     later, and this section prints no columns, so the log cannot say when it
     was removed. Closing only the empty cells prevents the next wrong entry
     without invalidating a record that was right when it was made, and without
     freezing a sheet that arrives contradicting itself. */
  function paintFuturePast(t, state) {
    Array.prototype.forEach.call(document.querySelectorAll("[data-fp-row]"), function (row) {
      var slug = row.getAttribute("data-fp-row");
      var removed = state.futurePastVictory.indexOf(slug) !== -1;
      row.classList.toggle("is-removed", removed);
      Array.prototype.forEach.call(row.querySelectorAll("[data-fp-col]"), function (box) {
        var col = state.futurePastDeck[parseInt(box.getAttribute("data-fp-col"), 10)] || [];
        var locked = removed && col.indexOf(slug) === -1;
        box.disabled = locked;
        box.title = locked ? t("fpRemoved") : (box.getAttribute("aria-label") || "");
      });
    });
  }

  /* Three columns as printed: scenario 2 has one box, scenarios 3 and 4 have
     two. Within one column the two boxes lock each other; across columns they
     only mark a contradiction. See the file header for why the line falls
     there. */
  function renderJubilee(t, state, ctx) {
    var section = panel("jubilee", t("secJubilee"));
    subtitle(section, t("subJubilee"));

    var row = W.el("div", "cell-row", { "data-cells": String(JUBILEE.length) });
    JUBILEE.forEach(function (col) {
      var box = cell(t("colScenario", String(col.scenario)));
      var flags = W.el("div", "flag-row");
      var keys = [{ key: col.inPlay, label: "lblJubileeInPlay" }];
      if (col.removed) keys.push({ key: col.removed, label: "lblJubileeRemoved" });
      keys.forEach(function (def) {
        flags.appendChild(flagBox([{ text: t(def.label) }], {
          checked: state.jubilee[def.key],
          label: t("colScenario", String(col.scenario)) + " – " + t(def.label),
          data: { "data-jubilee": def.key },
          onChange: function (next) {
            state.jubilee[def.key] = next;
            ctx.save();
            paintJubilee(t, state);
          },
        }));
      });
      box.appendChild(flags);
      box.appendChild(W.el("span", "lock-note"));
      row.appendChild(box);
    });

    section.appendChild(row);
    return section;
  }

  /* Which Jubilee boxes are open, and where the sheet contradicts itself.
     Derived every time, nothing stored. Three rules, all three straight out of
     the scenario instructions:

       * within a column, "in play" and "removed from campaign" are two states
         of one outcome — "if in play, record that, OTHERWISE remove her" — so
         each closes the other;
       * a column means nothing until the one before it recorded her in play:
         scenario 3 only asks about her because scenario 2's victory step wrote
         her into the log, and scenario 3's setup then puts her into play. No
         entry there, nothing to ask here. Scenario 2 has nothing before it and
         is therefore always open;
       * and once she is removed from the campaign she does not come back, so
         every box of every LATER scenario closes as well. That is the stronger
         statement of the two, so it is the one the tooltip gives.

     All three one-sided, like MC60's Completed and Failed: a box that is itself
     set stays operable. Otherwise a sheet arriving from an import or a
     hand-edited file with a contradiction in it would be frozen solid with no
     way out — and normalize() picks no winner either, so the way out has to be
     on screen. That is also why the contradiction still gets a marker: the one
     box that is still open is the one to correct. */
  function paintJubilee(t, state) {
    var removedBefore = false;
    /* null while there is no previous column at all — scenario 2. */
    var previousInPlay = null;
    JUBILEE.forEach(function (col) {
      var cellEl = null;
      var keys = [col.inPlay];
      if (col.removed) keys.push(col.removed);
      keys.forEach(function (key) {
        var box = document.querySelector('[data-jubilee="' + key + '"]');
        if (!box) return;
        var other = key === col.inPlay ? col.removed : col.inPlay;
        var set = !!state.jubilee[key];
        var gone = removedBefore && !set;
        var notYet = previousInPlay === false && !set;
        var paired = !!other && state.jubilee[other] && !set;
        box.disabled = gone || notYet || paired;
        box.title = gone ? t("jubileeGone")
          : notYet ? t("jubileeNotYet")
          : paired ? t("jubileeLocked")
          : (box.getAttribute("aria-label") || "");
        cellEl = box.closest(".cell");
      });

      if (cellEl) {
        var note = cellEl.querySelector(".lock-note");
        if (note) {
          note.textContent = (removedBefore && state.jubilee[col.inPlay])
            ? t("jubileeConflict") : "";
        }
      }
      previousInPlay = !!state.jubilee[col.inPlay];
      if (col.removed && state.jubilee[col.removed]) removedBefore = true;
    });
  }

  function renderAbductionProtocols(t, lang, state, ctx) {
    var section = panel("abduction-protocols", t("secAbductionProtocols"));
    subtitle(section, t("subAbductionProtocols"));
    section.appendChild(flagRow(t("secAbductionProtocols"), CAPTIVE_ALLIES, lang, {
      isOn: function (e) { return state.captiveAllies.indexOf(e.slug) !== -1; },
      onChange: function (e, on) {
        toggleSlug(state.captiveAllies, CAPTIVE_ALLIES, e.slug, on);
        ctx.save();
      },
    }));
    return section;
  }

  /* Free text, and the only free text on this sheet: these are the players' own
     allies out of their own decks, so there is no finite printed list to offer.
     Same reasoning as MC10's removed cards and MC27's Aspect Advantage. */
  function renderRemovedAllies(t, ctx) {
    var section = panel("removed-allies", t("secRemovedAllies"));
    subtitle(section, t("subRemovedAllies"));
    section.appendChild(W.stringList({
      listId: "mg-removed-allies",
      group: "mg-removed-allies",
      getArray: function () { return ctx.state.removedAllies; },
      placeholder: t("cardNamePlaceholder"),
      addLabel: t("addEntry"),
      removeLabel: t("removeEntry"),
      removeConfirm: t("confirmRemoveEntry"),
      dragLabel: t("dragReorder"),
      /* No `label`: the panel heading right above already says what this list
         is, and repeating it inside the box is a caption the sheet does not
         print either. MC60 does the same with its own removed-cards list; MC10
         passes one only because its list sits inside a scenario panel, where
         the heading names the scenario rather than the list. */
      multiline: false,
    }));
    return section;
  }

  // ---- Print ---------------------------------------------------------------
  /* A plain text snapshot. Checkboxes become box glyphs drawn in CSS, so the
     printout does not depend on a font carrying a tick. */
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
      printLine(players, "  " + t("colRole") + ": " +
        (poolName(ROLES, p.role, lang) || "—"));

      /* The five boxes of the role that is held, set or not — the same reason
         the sets below print whole. */
      printLine(players, "  " + t("lblRoleUpgrades") + ":");
      var own = upgradesOf(p);
      if (!own.length) printLine(players, "  —");
      own.forEach(function (entry) {
        printLine(players, "  " + (p.upgrades.indexOf(entry.slug) !== -1 ? "[x] " : "[ ] ") +
          entryName(entry, lang));
      });

      /* Nothing about marks kept under a role the player no longer holds. The
         printout is the sheet as it reads now, and on screen those marks are
         not on it either. They are not lost — they are in the JSON export and
         in a share link, which is the record that has to be complete. */
    });

    /* Every card of the set on its own line with a box: which side schemes were
       NOT defeated decides how many upgrades the next scenario grants, so the
       whole set prints either way — MC21's rule. */
    var ss = printSection(root, t("secSideSchemes"));
    SIDE_SCHEMES.forEach(function (entry, i) {
      printLine(ss, (state.sideSchemes.indexOf(entry.slug) !== -1 ? "[x] " : "[ ] ") +
        t("colScenario", String(i + 1)) + " – " + entryName(entry, lang) + " " +
        t("lblDefeated"));
    });

    printBoxes(root, t("secFuturePastVictory"), state.futurePastVictory, FUTURE_PAST, lang);

    /* The whole grid, empty columns included: an empty column says that
       scenario carried nothing forward, and the sheet leaves the place visible
       either way — MC27's rule for an empty Osborn Tech cell. */
    var deck = printSection(root, t("secFuturePastDeck"));
    state.futurePastDeck.forEach(function (column, i) {
      printLine(deck, t("colScenario", String(i + 1)) + ":");
      FUTURE_PAST.forEach(function (entry) {
        printLine(deck, "  " + (column.indexOf(entry.slug) !== -1 ? "[x] " : "[ ] ") +
          entryName(entry, lang));
      });
    });

    /* Whether a box is currently closed is not printed: the printout is a
       record of what was written down, not of what the screen would allow. */
    var jub = printSection(root, t("secJubilee"));
    JUBILEE.forEach(function (col) {
      printLine(jub, t("colScenario", String(col.scenario)) + ":");
      printLine(jub, "  " + (state.jubilee[col.inPlay] ? "[x] " : "[ ] ") +
        t("lblJubileeInPlay"));
      if (col.removed) {
        printLine(jub, "  " + (state.jubilee[col.removed] ? "[x] " : "[ ] ") +
          t("lblJubileeRemoved"));
      }
    });

    printBoxes(root, t("secAbductionProtocols"), state.captiveAllies, CAPTIVE_ALLIES, lang);

    var allies = printSection(root, t("secRemovedAllies"));
    if (!state.removedAllies.length) {
      printLine(allies, "—");
    } else {
      var ul = W.el("ul", "print-list");
      state.removedAllies.forEach(function (entry) {
        var s = W.splitStrike(entry);
        var li = W.el("li", s.struck ? "struck" : null);
        li.textContent = s.text;
        ul.appendChild(li);
      });
      allies.appendChild(ul);
    }
  }

  function printBoxes(root, heading, slugs, pool, lang) {
    var section = printSection(root, heading);
    pool.forEach(function (entry) {
      printLine(section, (slugs.indexOf(entry.slug) !== -1 ? "[x] " : "[ ] ") +
        entryName(entry, lang));
    });
    return section;
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
    id: "mutant-genesis",
    code: "MC32",
    titleEn: "Mutant Genesis",
    /* The German edition keeps the English campaign title, as this project
       does throughout. */
    titleDe: "Mutant Genesis",
    theme: "mg",
    stateVersion: 1,

    emptyState: emptyState,
    normalize: normalize,
    render: render,
    renderPrint: renderPrint,

    helpDe: "Der MC32-Bogen ist der kästchenreichste von allen, und keine seiner Schreibflächen hat gedruckte Zeilen. Trotzdem musste hier keine Zellenzahl erfunden werden: jede dieser Flächen meint einen endlichen gedruckten Kartensatz, deshalb steht überall der Satz selbst als benannte Kästchen. Die vier Kampagnen-Nebenpläne behalten je eine Szenariospalte, weil der Bogen über jedes Kästchen eine SCENARIO-Pille druckt. Der Abschnitt für den Siegpunktestapel druckt keine Spalten und der für das Begegnungsdeck vier — genau das ist der Unterschied: Entfernen ist endgültig und gilt für die ganze Kampagne, deshalb eine Menge; das Encounter-Deck wird im nächsten Setup wieder eingemischt, deshalb vier Spalten, und dieselbe Karte darf in mehreren stehen. Das Deck-Gitter steht hier als Tabelle, Karten links und Szenarien oben — gegenüber dem Druck gedreht, weil aus zwanzig wiederholten Kartennamen so fünf plus vier Spaltenköpfe werden und eine Zelle ohne Karte und Szenario keinen Namen hätte. „Rollen-Upgrades im Spiel“ druckt der Bogen als eigenen Bereich mit einer Spalte Player #1 bis #4; diese Spalte ist nur die Spielerliste noch einmal, deshalb stehen die Kästchen hier in der Spielerkarte — und dort auch direkt unter der Rolle, denn die Rolle entscheidet, welche fünf Verbesserungen überhaupt angezeigt werden. Ohne gewählte Rolle steht dort keine Kästchenreihe, sondern der Hinweis, erst eine Rolle zu wählen. Jeder Spieler muss eine andere Rolle nehmen, deshalb ist eine bereits vergebene Rolle bei den anderen abgeblendet. Wer die Rolle wechselt, verliert nichts: Eintragungen der alten Rolle bleiben gespeichert und werden nur nicht mehr als Kästchen gezeigt — ausblenden heißt nicht löschen, und beim Rollentausch zweier Spieler geht zwangsläufig einer kurz ohne Rolle durch. Der Bogen sagt darüber nichts; es ist Buchführung, kein Hinweis, den jemand braucht, und im JSON-Export und im Share-Link stehen die Eintragungen ohnehin. Wie viele Verbesserungen die Kampagne vergeben hat — eine im Setup von Szenario 1 und je eine weitere, wenn der Nebenplan des Vorszenarios angehakt ist —, zählt der Bogen ebenfalls nicht mit: die Regel begrenzt eine Anzahl und keine bestimmte Karte, das Papier prüft es auch nicht, und ein frischer Bogen wäre sonst sofort fast ganz zu. Gesperrt wird dagegen, wo eine Karte oder eine Figur aus der Kampagne heraus ist. Bei Jubilee sperren sich „Jubilee im Spiel“ und „Jubilee aus Kampagne entfernt“ innerhalb eines Szenarios gegenseitig, weil der Sieg-Schritt genau das sagt: im Spiel eintragen, sonst aus dem Logbuch entfernen. Die Szenarien hängen außerdem aneinander: Szenario 3 fragt nur nach ihr, weil der Sieg-Schritt von Szenario 2 sie ins Logbuch geschrieben hat, deshalb sind die Kästchen eines Szenarios erst offen, wenn das vorige „im Spiel“ trägt — Szenario 2 hat nichts davor und ist immer offen. Und sobald sie entfernt ist, sind die Kästchen aller späteren Szenarien zu: sie kommt nicht zurück. Ebenso im Gitter für das Begegnungsdeck: eine Karte im Siegpunktestapel ist aus der Kampagne entfernt, ihre ganze Zeile im Begegnungsdeck ist deshalb durchgestrichen und zu. Jede dieser Sperren ist einseitig, wie bei MC60: ein bereits gesetztes Kästchen bleibt bedienbar. Das ist wichtiger, als es klingt — eine Karte kann in einem frühen Szenario im Begegnungsdeck gestanden haben und zwei Szenarien später im Siegpunktestapel landen, und der Bogen druckt dort keine Spalten, kann also nicht sagen, wann sie entfernt wurde. Die leeren Zellen zu schließen verhindert den nächsten falschen Eintrag; die gesetzten zu schließen würde eine richtige Eintragung für einen Fehler erklären. Aus demselben Grund bleibt ein Bogen, der einen Widerspruch mitbringt, immer korrigierbar, und der Widerspruch wird zusätzlich benannt. Die Verbündeten durch „Entführungsprotokolle“ sind die vier CAPTIVE-Verbündeten als Kästchen; die Verbündeten unter „Befreit die Gefangenen“ oder „Findet die Gefangenen“ bleiben Freitext, weil sie aus den eigenen Decks der Spieler kommen und keine gedruckte Liste sind. Oben im Spielerbereich steht der Haken „Expertenmodus“: die verbleibenden Lebenspunkte sind das einzige Feld, das der gedruckte Bogen mit „(expert)“ kennzeichnet, und auf Standardstufe blendet der Bogen es aus, statt danach zu fragen. Ausblenden heißt nicht löschen — der Wert bleibt im Bogen, im Export und im Share-Link. Es gibt hier bewusst keine Szenario-Tabelle, kein „Abgeschlossen“, keinen Fortschrittszähler und kein Notizfeld: der gedruckte Bogen hat sie nicht. Und das fünfte Szenario gegen Magneto fehlt nicht — es steht auch auf dem gedruckten Bogen nicht, weil im Finale nichts mehr festzuhalten ist.",
    helpEn: "The MC32 sheet is the most checkbox-heavy of them all, and not one of its write-in areas prints a row line. No cell count had to be invented all the same: every one of those areas means a finite printed card set, so the set itself is here as named boxes. The four campaign side schemes each keep a scenario column, because the sheet prints a SCENARIO pill over every box. “Future Past Cards in the Victory Display” prints no columns and “… in the Encounter Deck” prints four — and that difference is the point: removal is permanent and holds for the whole campaign, so it is one set; the encounter deck is shuffled back in at the next setup, so it keeps four columns and the same card may stand in several of them. The deck grid is a table here, cards down the side and scenarios across the top — transposed against the print, because that turns twenty repeated card names into five plus four column labels, and a cell would have no name without both its card and its scenario. “Role Upgrades in Play” is printed as its own area with a Player #1 to #4 column; that column is just the player list again, so the boxes sit in the player cards — and directly under the role, because the role decides which five upgrades are shown at all. With no role chosen there is no row of boxes but a line saying to pick a role first. Each player must take a different role, so a role already taken is greyed out for the others. Changing role costs nothing: what was entered under the old one stays stored and is only no longer shown as boxes — hiding is not clearing, and swapping two players' roles necessarily takes one of them through a moment with no role at all. The sheet says nothing about it; that is bookkeeping rather than something anyone needs telling, and those marks are in the JSON export and in a share link anyway. Nor does the sheet count how many upgrades the campaign has granted — one at scenario 1's setup and one more for each previous scenario's side scheme that is checked: the rule caps a NUMBER rather than naming a card, the paper does not check it either, and a fresh sheet would otherwise arrive almost entirely shut. What does close is anything the rulebook has put out of the campaign. For Jubilee, “in play” and “removed from campaign” close each other within one scenario, because the victory step says exactly that: record her if she is in play, otherwise remove her from the log. The scenarios also hang together: scenario 3 only asks about her because scenario 2's victory step wrote her into the log, so a scenario's boxes are closed until the one before it carries “in play” — scenario 2 has nothing before it and is always open. And once she is removed, the boxes of every later scenario close too: she does not come back. The same in the Future Past grid: a card in the victory display is removed from the campaign, so its whole encounter-deck row is struck through and closed. Every one of these locks is one-sided, as in MC60: a box that is already ticked stays operable. That matters more than it sounds — a card can have sat in an early scenario's encounter deck and land in the victory display two scenarios later, and the sheet prints no columns there, so the log cannot say when it was removed. Closing the empty cells prevents the next wrong entry; closing the ticked ones would call a correct record an error. For the same reason a sheet that arrives with a contradiction stays correctable, and the contradiction is named on top of that. The allies from “Abduction Protocols” are the four CAPTIVE allies as boxes; the allies under “Rescue Captives” or “Find the Prisoners” stay free text, because they come out of the players' own decks and are not a printed list. At the top of the player area sits the “Expert level” box: the remaining hit points are the only field the printed sheet marks “(expert)”, and at standard level the sheet hides it rather than asking for it. Hiding is not clearing — the value stays in the sheet, in the export and in a share link. There is deliberately no scenario table, no “completed”, no progress counter and no notes field: the printed sheet has none. And the fifth scenario against Magneto is not missing; it is not on the printed sheet either, because the finale has nothing left to record.",

    /* Beide Wörterbücher sind gefüllt. Die Unterscheidung, nach der sie
       entstanden sind, bleibt trotzdem wichtig, weil sie sagt, wer eine
       Änderung entscheidet:

       1. Wörter, die diese App selbst wählt — Spaltentitel, Platzhalter,
          Hinweise und das gemeinsame Vokabular aller Kampagnen („Verbleibende
          Lebenspunkte“) — sind wörtlich aus den Nachbarmodulen übernommen und
          gehören dorthin abgeglichen, nicht hier neu formuliert. Dazu gehören
          auch die Überschrift des Nebenplan-Abschnitts, den der Bogen nicht
          benennt, und alles, was die App über abgeleitete Zustände sagt.
       2. Wörter, die vom gedruckten Bogen kommen — die Abschnittsnamen, ihre
          Unterzeilen und die Beschriftungen der gedruckten Kästchen — stehen
          wörtlich so da, wie der deutsche Druck sie setzt. Wer eine davon
          ändert, ändert eine Aussage über das Papier und braucht das Papier
          dafür.

       Und wer eine ändert, liest helpDe/helpEn mit: die beiden zitieren die
       Abschnittsnamen, also werden sie zur Lüge, sobald ein Name wandert.

       Es migriert nichts, wenn sich eine Beschriftung ändert — persistiert
       werden nur Feldschlüssel und Slugs, nie Beschriftungen. */
    i18n: {
      de: {
        secPlayers: "Spieler-Informationen",
        secSideSchemes: "Besiegte Kampagnen-Nebenpläne",

        /* "%s" = Spielernummer. */
        playerRow: "Spieler #%s",
        colIdentity: "Identität",
        colHp: "Verbleibende Lebenspunkte",
        colRole: "Rolle",
        colCard: "Karte",
        /* "%s" = Szenarionummer. */
        colScenario: "Szenario %s",
        identityPlaceholder: "Held …",
        rolePlaceholder: "— Rolle wählen —",
        cardNamePlaceholder: "Kartenname …",
        lblExpert: "Expertenmodus",
        expertHint: "Nur auf Expertenstufe werden verbleibende Lebenspunkte festgehalten. Ausschalten blendet sie aus, löscht sie aber nicht.",
        addPlayer: "+ Spieler",
        addPlayerFull: "Mehr als vier Spieler kennt das Spiel nicht.",
        removePlayer: "Spieler entfernen",
        removePlayerLast: "Der letzte Spieler kann nicht entfernt werden.",
        confirmRemovePlayer: "Diesen Spieler samt Eintragungen entfernen?",
        duplicateHero: "Dieser Held ist schon einem anderen Spieler zugeordnet.",

        upgradeNoRole: "Erst eine Rolle wählen.",
        jubileeLocked: "Das Gegenstück dieses Szenarios ist angehakt. Zuerst dort abhaken.",
        jubileeGone: "Ein früheres Szenario hat Jubilee aus der Kampagne entfernt. Danach kann sie nicht mehr ins Spiel kommen.",
        jubileeNotYet: "Im vorigen Szenario ist Jubilee nicht als im Spiel eingetragen. Erst dort anhaken.",
        jubileeConflict: "Widerspruch: ein früheres Szenario hat Jubilee aus der Kampagne entfernt.",
        fpRemoved: "Diese Karte steht im Siegpunktestapel und ist damit aus der Kampagne entfernt. Sie kann in keinem Begegnungsdeck mehr stehen.",

        secFuturePastVictory: "„Zukunft ist Vergangenheit“-Karten im Siegpunktestapel",
        subFuturePastVictory: "Szenarien #1–4 (Entfernt diese aus der Kampagne.)",
        secFuturePastDeck: "„Zukunft ist Vergangenheit“-Karten im Begegnungsdeck",
        subFuturePastDeck: "Szenarien #1-4",
        secJubilee: "Jubilee",
        subJubilee: "Szenarien #2-4",
        secAbductionProtocols: "Verbündete durch Entführungsprotokolle",
        subAbductionProtocols: "Szenario #2",
        secRemovedAllies: "Verbündete unter Befreit die Gefangenen oder Findet die Gefangenen",
        subRemovedAllies: "Szenario #3 (Entfernt diese aus der Kampagne.)",
        lblRoleUpgrades: "Rollen-Upgrades im Spiel",
        subRoleUpgrades: "Szenarien #1–4 (Entfernt diese aus der Kampagne.)",
        lblJubileeInPlay: "Jubilee im Spiel",
        lblJubileeRemoved: "Jubilee aus Kampagne entfernt",
        lblDefeated: "besiegt",
      },
      en: {
        secPlayers: "Player Information",
        secSideSchemes: "Campaign side schemes defeated",

        playerRow: "Player #%s",
        colIdentity: "Identity",
        colHp: "Remaining hit points",
        colRole: "Role",
        colCard: "Card",
        colScenario: "Scenario %s",
        identityPlaceholder: "Hero …",
        rolePlaceholder: "— Choose a role —",
        cardNamePlaceholder: "Card name …",
        lblExpert: "Expert level",
        expertHint: "The remaining hit points are only recorded at expert level. Switching off hides them, it does not clear them.",
        addPlayer: "+ Player",
        addPlayerFull: "The game does not go beyond four players.",
        removePlayer: "Remove player",
        removePlayerLast: "The last player cannot be removed.",
        confirmRemovePlayer: "Remove this player along with what is filled in?",
        duplicateHero: "This hero is already assigned to another player.",

        upgradeNoRole: "Choose a role first.",
        jubileeLocked: "This scenario's counterpart is checked. Clear it there first.",
        jubileeGone: "An earlier scenario removed Jubilee from the campaign. She cannot come back into play after that.",
        jubileeNotYet: "The previous scenario does not record Jubilee as in play. Check it there first.",
        jubileeConflict: "Contradiction: an earlier scenario removed Jubilee from the campaign.",
        fpRemoved: "This card is in the victory display and therefore removed from the campaign. It cannot be in any encounter deck any more.",

        secFuturePastVictory: "Future Past Cards in the Victory Display",
        subFuturePastVictory: "Scenarios #1-4 (remove these from the campaign)",
        secFuturePastDeck: "Future Past Cards in the Encounter Deck",
        subFuturePastDeck: "Scenarios #1-4",
        secJubilee: "Jubilee",
        subJubilee: "Scenarios #2-4",
        secAbductionProtocols: "Allies from Abduction Protocols",
        subAbductionProtocols: "Scenario #2",
        secRemovedAllies: "Allies under Rescue Captives or Find the Prisoners",
        subRemovedAllies: "Scenario #3 (remove these from the campaign)",
        lblRoleUpgrades: "Role Upgrades in Play",
        subRoleUpgrades: "Scenarios #1-4 (remove these from the campaign)",
        lblJubileeInPlay: "Jubilee in play",
        lblJubileeRemoved: "Jubilee removed from campaign",
        lblDefeated: "Defeated",
      },
    },
  });
}(window));

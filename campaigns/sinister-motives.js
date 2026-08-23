/* Marvel Champions — "Sinister Motives" (MC27) campaign log.

   The printed MC27 log is two pages, and both matter here. Page 2 is the sheet
   itself; page 1 is the REPUTATION TRACK — the ladder of rewards and penalties
   the whole campaign turns on. That split is why this module looks different
   from the other three.

   What page 2 has, and only that: four player blocks, four named sections that
   record card titles, two that record a number, and three per-player reward
   sections. There is no scenario table, no "completed", no progress counter and
   no notes field, because the sheet has none. Those absences are the sheet, not
   an omission.

   What page 2 does NOT have is a single checkbox. Every field on it is a blank
   line to write on. Where the line names a card from a set the campaign prints,
   this has that set instead — writing a name by hand could only introduce a
   typo. Which shape the set takes follows what the sheet asks for: Community
   Service and Last Ones Standing ask WHICH cards, so they are boxes over the
   whole set; Osborn Tech is drawn once per rung of the track, so it keeps one
   cell per rung. Aspect Advantage and Planning Ahead stay free text, because
   they are chosen from the player's own collection and deck, which is not a
   finite printed list.

   Two departures from the paper, both because the app knows something the paper
   cannot:

   1. The three "Reputation Track Reward" sections are printed as their own
      blocks with a P1..P4 column. That column is just the player list again, so
      the fields sit in the player cards instead — the same move MC10 makes with
      its upgrades.
   2. A field the players have not unlocked yet is closed, with the rung that
      opens it named on it. The paper cannot do that; it just has a blank box
      that means nothing until the track says so. Closed, never hidden and never
      cleared: lowering the marker must not make a record disappear.

   The one thing here that page 2 does not print at all is the running
   reputation. It lives on the track on page 1, where a marker is moved along
   35 spaces, and every recorded section on page 2 exists because some rung of
   that track told the players to write something down. A log that cannot say
   where the marker stands cannot say which rewards are in force, so the
   reputation is a field here and the seven thresholds are listed beside it.
   Which of them are in force is DERIVED from that one number and never stored —
   the same reason MC60 derives "failed" from its counter.

   The track reads: the star sits on space 1, the players start at 0 with an
   empty track, and the seven rungs are at 1, 5, 9, 13, 17, 21 and 25. Measured
   from the sheet, not guessed: the seven rules that cross the track run exactly
   through the centres of those circles, and the Osborn Tech penalty appears on
   exactly three of them — which is exactly how many Osborn Tech cells page 2
   prints. That match is why THRESHOLDS below is the single source for the cell
   count as well as for what each rung opens.

   The campaign is played at standard or expert level, and the remaining hit
   points are the only field the sheet marks "Expert Mode Only", so a standard
   game hides that one and nothing else. Hides, not clears — see `expert` below.

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
  /* The length of the printed track: 25 large circles plus ten small ones
     below them. Reputation starts at 0 — an empty track, nothing unlocked. */
  var REP_MAX = 35;
  /* Waking Nightmare is a scenario tally rather than a place on the track, so
     it is not bounded by the track's length. Same ceiling as every other loose
     count in this project. */
  var SCORE_MAX = 99;

  /* ---- POOLS ---------------------------------------------------------------
     Every card carries an English and a German name, as in MC10 and MC21.
     `de: null` shows the English name and tags it lang="en".

     Here `de: null` means the German name is STILL TO BE ENTERED from the
     German printing — this is open work, not the MC10/MC21 case where a name
     stays English on purpose. Filling one in migrates nothing, because only
     the slug is ever persisted.

     Each pool carries a different rule, taken from the campaign:

       Community Service    which of the five printed side schemes were
                            recorded; the sheet prints four cells, one per
                            scenario 1 to 4
       Sinister Assault     which of the six villains of scenario 4 were still
                            standing
       Osborn Tech          one card per Osborn Tech rung of the track, and a
                            recorded one is shuffled into the encounter deck,
                            so it cannot be drawn again — the three cells hold
                            three different cards
       S.H.I.E.L.D. Tech    one per player, each card to at most one player —
                            the unchosen cards go back to the collection, the
                            chosen one does not */

  /* "Community Service" encounter set — the side schemes recorded after each of
     scenarios 1 to 4. */
  var COMMUNITY_SERVICE = [
    { slug: "back-alley-burglary", en: "Back Alley Burglary", de: "Diebstahl in der Hintergasse" },
    { slug: "cat-in-a-tree",       en: "Cat in a Tree",       de: "Katze auf einem Baum" },
    { slug: "henchmen-heist",      en: "Henchmen Heist",      de: "Raubüberfall durch Handlanger" },
    { slug: "off-the-rails",       en: "Off the Rails",       de: "Entgleist" },
    { slug: "rubble-rescue",       en: "Rubble Rescue",       de: "Rettung von den Trümmern" },
  ];

  /* "Sinister Assault" encounter set — the six elite minions of The Sinister
     Six, recorded under "Last Ones Standing". */
  var SINISTER_ASSAULT = [
    { slug: "doctor-octopus",    en: "Doctor Octopus",    de: null },
    { slug: "electro",           en: "Electro",           de: null },
    { slug: "hobgoblin",         en: "Hobgoblin",         de: null },
    { slug: "kraven-the-hunter", en: "Kraven the Hunter", de: "Kraven der Jäger" },
    { slug: "scorpion",          en: "Scorpion",          de: null },
    { slug: "vulture",           en: "Vulture",           de: null },
  ];

  /* "Osborn Tech" encounter set — the attachments drawn at random on three
     rungs of the reputation track. */
  var OSBORN_TECH = [
    { slug: "arm-cannon",       en: "Arm Cannon",       de: "Armkanone" },
    { slug: "ionic-boots",      en: "Ionic Boots",      de: "Ionenstiefel" },
    { slug: "kinetic-armor",    en: "Kinetic Armor",    de: "Kinetische Rüstung" },
    { slug: "neocarbon-scales", en: "Neocarbon Scales", de: "Neocarbon-Schuppenpanzer" },
    { slug: "spiked-gauntlet",  en: "Spiked Gauntlet",  de: "Stachelhandschuh" },
    { slug: "tracking-display", en: "Tracking Display", de: "Zielverfolgungsvisier" },
  ];

  /* The "Campaign - S.H.I.E.L.D. Tech" upgrades. Each has a plain and an
     Enhanced side; the sheet records the title, which is the same on both, so
     the pool lists eight titles rather than sixteen faces. Flipping to the
     Enhanced side is a track reward, not a second field. */
  var SHIELD_TECH = [
    { slug: "compact-darts",         en: "Compact Darts",         de: "Kompakte Wurfpfeile" },
    { slug: "impact-dampening-suit", en: "Impact-Dampening Suit", de: "Anzug mit Aufpralldämmung" },
    { slug: "laser-goggles",         en: "Laser Goggles",         de: "Laserbrille" },
    { slug: "propulsion-gauntlet",   en: "Propulsion Gauntlet",   de: "Propulsor-Handschuh" },
    { slug: "retinal-display",       en: "Retinal Display",       de: "Netzhaut-Display" },
    { slug: "shock-knuckles",        en: "Shock Knuckles",        de: "Schock-Faust" },
    { slug: "wave-bracers",          en: "Wave Bracers",          de: "Impuls-Armbänder" },
    { slug: "wrist-navigator",       en: "Wrist Navigator",       de: "Handnavigator" },
  ];

  /* ---- THE REPUTATION TRACK ------------------------------------------------
     The seven rungs, in track order. `at` is the space the rung sits on, and a
     rung is in force once the reputation has reached it.

     Both sides are lists of labels rather than single ones, because two rungs
     print two sentences: the first pairs choosing an Osborn Tech card with the
     standing setup rule that shuffles the recorded ones in, and the fifth pairs
     recording a Planning Ahead card with the setup step that draws it.

     `pnOsbornTech` appears three times on purpose — the sheet says the same
     sentence on three rungs, so it is one label used three times rather than
     three labels that could drift apart.

     `opens` names the player field this rung tells the players to fill in, and
     `opensCell` says the rung takes an Osborn Tech card. Both are read below to
     derive what is locked and how many Osborn Tech cells there are, so the
     table stays the single source: a field cannot open without a rung that
     opens it, and a cell cannot exist without a rung that fills it. */
  var THRESHOLDS = [
    { at: 1,  reward: ["rwShieldTech"],
              penalty: ["pnOsbornTech", "pnOsbornShuffle"],
              opens: "shieldTech", opensCell: true },
    { at: 5,  reward: ["rwMulligan"],        penalty: ["pnThreat"] },
    { at: 9,  reward: ["rwAspectAdvantage"], penalty: ["pnMinion"],
              opens: "aspectAdvantage" },
    { at: 13, reward: ["rwEnhanced"],        penalty: ["pnOsbornTech"],
              opensCell: true },
    { at: 17, reward: ["rwPlanningAhead", "rwPlanningAheadSetup"],
              penalty: ["pnSideScheme"], opens: "planningAhead" },
    { at: 21, reward: ["rwHelicarrier"],     penalty: ["pnOsbornTech"],
              opensCell: true },
    { at: 25, reward: ["rwSymbioteSuit"],    penalty: ["pnEncounter"] },
  ];

  /* Which rung opens which player field, and which rungs take an Osborn Tech
     card. Derived, so the table above cannot fall out of step with either. */
  var OPENS_AT = {};
  var OSBORN_AT = [];
  THRESHOLDS.forEach(function (row) {
    if (row.opens) OPENS_AT[row.opens] = row.at;
    if (row.opensCell) OSBORN_AT.push(row.at);
  });
  /* Three, because three rungs take a card — and the sheet prints three cells.
     That agreement is what made the reading of the track trustworthy, so it is
     derived here rather than written down twice. */
  var OSBORN_TECH_CELLS = OSBORN_AT.length;

  /* The three fields that live in a player card and open on a rung, in the
     order the sheet prints their sections. */
  var PLAYER_REWARDS = [
    { key: "shieldTech",      head: "secShieldTech",      pool: SHIELD_TECH },
    { key: "aspectAdvantage", head: "secAspectAdvantage", pool: null },
    { key: "planningAhead",   head: "secPlanningAhead",   pool: null },
  ];

  /* The "Conditions" legend at the foot of the track page: what a victory is
     worth. Reference only — the app does not add anything up, because the
     sheet does not either. */
  var CONDITIONS = [
    "cdVictoryPoints", "cdNoMinions", "cdNoSideSchemes",
    "cdNoThreat", "cdNoAcceleration", "cdNoDefeated",
  ];

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
     other three modules do the same. */
  function entryLang(entry, lang) {
    return (lang === "de" && entry.de) ? null : "en";
  }
  function poolName(pool, slug, lang) {
    var entry = inPool(pool, slug);
    return entry ? entryName(entry, lang) : null;
  }

  /* A blank reputation field counts as 0 — an empty track. */
  function repOf(state) {
    return state.reputation == null ? 0 : state.reputation;
  }

  /* The cards still available to a draw. Both sets are drawn from without
     replacement, but for different reasons: a recorded Osborn Tech attachment
     is shuffled into the encounter deck, and a chosen S.H.I.E.L.D. Tech upgrade
     goes into that player's deck while the others go back to the collection. */
  function freeOsborn(state) {
    return OSBORN_TECH.filter(function (e) {
      return state.osbornTech.indexOf(e.slug) === -1;
    });
  }
  function freeShieldTech(state) {
    var taken = {};
    state.players.forEach(function (p) { if (p.shieldTech) taken[p.shieldTech] = true; });
    return SHIELD_TECH.filter(function (e) { return !taken[e.slug]; });
  }

  /* Three at random out of what is left, or fewer near the end of the
     campaign — the rung deals three and lets the player keep one. */
  function drawThree(pool) {
    var rest = pool.slice();
    var out = [];
    while (out.length < 3 && rest.length) {
      var pick = W.pickRandom(rest);
      rest.splice(rest.indexOf(pick), 1);
      out.push(pick);
    }
    return out;
  }

  /* Which rungs the given reputation has reached. Derived and never stored: the
     reputation is the single source, so an imported sheet cannot disagree with
     itself about what is unlocked. */
  function reachedAt(reputation) {
    var rep = reputation == null ? 0 : reputation;
    return THRESHOLDS.filter(function (row) { return rep >= row.at; });
  }

  // ---- Data ----------------------------------------------------------------
  function emptyState() {
    return {
      /* Standard or expert level. Only the display follows this: switching back
         to standard HIDES the remaining hit points, it does not clear them, so
         a sheet toggled by accident loses nothing. */
      expert: false,
      /* Where the marker stands on the track. Blank, not 0: an untouched sheet
         has not been played, which is not the same statement as "played and
         scored nothing". Both read as nothing unlocked. */
      reputation: null,
      /* A fresh sheet starts with a single player; more are added as needed. */
      players: [newPlayer()],
      /* Which cards, not which cell: the sheet asks which side schemes were
         recorded and which villains were still standing, and a set of names
         answers that. */
      communityService: [],
      wakingNightmare: null,
      lastOnesStanding: [],
      finalScore: null,
      /* Cells, not a set: each one belongs to a rung of the track, so the
         position is part of the entry. */
      osbornTech: emptySlots(OSBORN_TECH_CELLS),
    };
  }

  function newPlayer() {
    return {
      hero: "",
      hp: null,
      /* The three "Reputation Track Reward" fields. They live ON the player
         rather than in three parallel lists, so adding or removing a player can
         never shift the entries out from under the names. */
      shieldTech: "",
      aspectAdvantage: "",
      planningAhead: "",
    };
  }

  function emptySlots(count) {
    var out = [];
    for (var i = 0; i < count; i++) out.push("");
    return out;
  }

  /* Never throws. Starts from emptyState() and overlays only what it
     recognises, so a hand-edited file, a foreign export or a truncated share
     link cannot produce an invalid sheet. Fields this sheet does not have —
     MC60's `scenarios`, MC21's `flags` — are simply never read, which is how
     they get dropped. */
  function normalize(raw) {
    raw = (raw && typeof raw === "object") ? raw : {};
    var out = emptyState();

    out.expert = W.coerceBool(raw.expert);
    out.reputation = W.clampNumber(raw.reputation === "" ? null : raw.reputation, 0, REP_MAX);

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
        /* Kept whatever the reputation currently is: a rung that has not been
           reached closes the field on screen, it does not empty it. Lowering
           the marker after a mistyped number would otherwise cost the
           record. */
        shieldTech: inPool(SHIELD_TECH, p.shieldTech) ? p.shieldTech : "",
        /* Free text: chosen from the player's own collection and deck, which is
           not a finite printed list. */
        aspectAdvantage: W.coerceText(p.aspectAdvantage, NAME_MAX),
        planningAhead: W.coerceText(p.planningAhead, NAME_MAX),
      });
    }

    /* Each S.H.I.E.L.D. Tech upgrade exists once in the campaign, so it can
       belong to at most one player. First occurrence in player order wins and
       later ones are dropped — which of them was meant is not ours to guess,
       and the alternative is a sheet that cannot legally be played. */
    dropRepeats(out.players, "shieldTech");

    out.communityService = pickSlugs(raw.communityService, COMMUNITY_SERVICE);
    out.wakingNightmare =
      W.clampNumber(raw.wakingNightmare === "" ? null : raw.wakingNightmare, 0, SCORE_MAX);
    out.lastOnesStanding = pickSlugs(raw.lastOnesStanding, SINISTER_ASSAULT);
    out.finalScore =
      W.clampNumber(raw.finalScore === "" ? null : raw.finalScore, 0, REP_MAX);
    out.osbornTech = pickSlots(raw.osbornTech, OSBORN_TECH, OSBORN_TECH_CELLS);

    return out;
  }

  /* The recognised slugs of `raw`, in the pool's own order and without
     duplicates. Canonical output is what makes normalize() a fixpoint: the
     same set always comes back in the same order, so a second pass and a JSON
     round-trip both change nothing. Same helper MC10 uses, and it also happens
     to read a row of cells correctly — the blanks are simply not slugs. */
  function pickSlugs(raw, pool) {
    var wanted = {};
    (Array.isArray(raw) ? raw : []).forEach(function (v) {
      if (typeof v === "string") wanted[v] = true;
    });
    return pool.filter(function (e) { return wanted[e.slug]; })
      .map(function (e) { return e.slug; });
  }

  /* A fixed-length row of cells, each holding a recognised slug or nothing.
     Unlike pickSlugs() this keeps the POSITION: an Osborn Tech cell belongs to
     a rung of the track, so the row cannot be sorted into pool order. An
     unknown slug and a repeat of one an earlier cell already holds both empty
     their cell — earlier cells win, and it is that fixed rule which makes a
     second pass over the same state produce the same array. */
  function pickSlots(raw, pool, count) {
    var list = Array.isArray(raw) ? raw : [];
    var seen = {};
    var out = [];
    for (var i = 0; i < count; i++) {
      var slug = typeof list[i] === "string" ? list[i] : "";
      if (!inPool(pool, slug) || seen[slug]) slug = "";
      if (slug) seen[slug] = true;
      out.push(slug);
    }
    return out;
  }

  /* Enforce "at most one player holds this card", in player order. */
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
     the check in test/lint.js. */

  /* Counts the expert-only field even at standard level, and a closed field
     even while it is closed: both are hidden or frozen, not gone, and removing
     a player would still throw them away. */
  function playerHasContent(player) {
    return !!player.hero.trim() || player.hp != null || !!player.shieldTech ||
      !!player.aspectAdvantage.trim() || !!player.planningAhead.trim();
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

  /* The line the sheet prints under a section heading — "Victory for Scenario
     #3 — Mysterio", "Reputation Track Penalty". It says which game the entry
     came out of, so it belongs on screen too. */
  function subtitle(section, text) {
    var p = W.el("p", "hint");
    p.textContent = text;
    section.appendChild(p);
    return section;
  }

  /* The sheet sets one symbol in its rule text: the per-player mark, three
     times — twice in the penalties ("Place 1 [per player] threat") and once in
     the conditions legend. It cannot be a character here, because the glyph
     belongs to the publisher's icon font, which is not ours to ship. So it is
     drawn in CSS like every other device in this project, and it carries its
     meaning as its accessible name: a symbol nobody can read would be worse
     than the words it stands for. */
  function perPlayer(t) {
    return W.el("span", "icon-pp", {
      role: "img", "aria-label": t("perPlayer"), title: t("perPlayer"),
    });
  }

  /* One rule line as the sheet prints it. "{pp}" in the text marks where the
     per-player symbol sits, so the wording and the symbol's position stay
     together in the dictionary and a translator cannot lose it. */
  function ruleText(parent, text, t) {
    String(text).split("{pp}").forEach(function (part, i) {
      if (i) parent.appendChild(perPlayer(t));
      if (part) parent.appendChild(document.createTextNode(part));
    });
    return parent;
  }

  /* A labelled row inside a player card or a panel. `at` marks the rung that
     opens the field, so paintUnlocks() can find the row again and say why it is
     closed without anything being re-rendered. */
  function fieldRow(labelText, control, at, extra) {
    var row = W.el("div", "player-field", at ? { "data-unlock": String(at) } : null);
    var label = W.el("label", "field-label");
    label.textContent = labelText;
    if (at) label.appendChild(W.el("span", "lock-note"));
    label.appendChild(control);
    row.appendChild(label);
    /* Outside the <label>, because what goes here is a second control rather
       than part of the field's own name. */
    if (extra) row.appendChild(extra);
    return row;
  }

  /* A field with a die beside it — the same shape MC60 gives its villain cell,
     as a class of its own because here it sits in a player card rather than in
     a table. */
  function withDie(control, die) {
    var wrap = W.el("div", "with-die");
    wrap.appendChild(control);
    wrap.appendChild(die);
    return wrap;
  }

  /* A control with no visible label. The sheet prints these two sections as a
     heading over a single blank box, so repeating the heading as a field label
     would be a caption the paper does not have; the control carries the section
     name as its accessible name instead. */
  function bareRow(control) {
    var row = W.el("div", "player-field");
    row.appendChild(control);
    return row;
  }

  /* A row of named boxes with no caption over it: the panel heading is the
     caption here, because the sheet prints the heading once and then bare
     cells. Each box still needs a name of its own, so it takes the heading and
     the card. */
  function flagRow(heading, pool, lang, cfg) {
    var wrap = W.el("div", "player-field");
    var row = W.el("div", "flag-row");
    pool.forEach(function (entry) {
      var flag = W.el("label", "flag");
      var text = W.el("span", null, { lang: entryLang(entry, lang) });
      text.textContent = entryName(entry, lang);
      flag.appendChild(text);
      flag.appendChild(W.checkbox({
        checked: cfg.isOn(entry),
        label: heading + " – " + entryName(entry, lang),
        onChange: function (next) { cfg.onChange(entry, next); },
      }));
      row.appendChild(flag);
    });
    wrap.appendChild(row);
    return wrap;
  }

  function render(root, ctx) {
    var t = ctx.t, lang = ctx.lang, state = ctx.state;

    root.appendChild(renderPlayers(t, lang, state, ctx));
    root.appendChild(renderReputation(t, state, ctx));

    /* The sheet's own rows, in its own order: a wide section beside a narrow
       one, twice, then the penalty on its own. .scenario-row is two columns on
       a wide screen and one on a narrow one — as close as a screen gets to the
       paper while staying readable. The three reward sections are not here;
       they sit in the player cards, see the file header. */
    var row = W.el("div", "scenario-row");
    row.appendChild(renderCommunityService(t, lang, state, ctx));
    row.appendChild(renderWakingNightmare(t, state, ctx));
    root.appendChild(row);

    var row2 = W.el("div", "scenario-row");
    row2.appendChild(renderLastOnesStanding(t, lang, state, ctx));
    row2.appendChild(renderFinalScore(t, state, ctx));
    root.appendChild(row2);

    root.appendChild(renderOsbornTech(t, lang, state, ctx));

    /* Last, once every gated control is in the document: what the reputation
       has opened is painted in one pass rather than decided per control, so
       the screen and the number can never say different things. */
    paintGates(t, state);
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
       not caught up with yet must remain typeable. Not every card field is free
       text — the S.H.I.E.L.D. Tech pool is printed and finite. */
    var heroes = global.HEROES || [];
    var listId = "hero-suggestions";
    grid.appendChild(W.dataList(listId, heroes.map(function (h) {
      return (lang === "de" && h.de) ? h.de : h.en;
    })));

    /* Collected across all the cards so the upgrade pool can grey out what
       another player already holds, in place and without a re-render. */
    var techSelects = [];

    state.players.forEach(function (player, i) {
      var card = W.el("div", "player-card", { "data-player": String(i + 1) });
      var caption = t("playerRow", String(i + 1));

      var head = W.el("div", "player-head");
      var idLabel = W.el("div", "player-name");
      idLabel.textContent = caption;
      head.appendChild(idLabel);

      /* Removing the last player would leave a sheet with nobody on it, so that
         one stays put. Anything else goes, with a confirmation when there is
         something on the card to lose — and a card here holds three recorded
         card titles besides the name and the number, so the check has to look
         at all of it. */
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
             and renumber, and the upgrade pool has to be recomputed against
             the players that are left. */
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

      /* Expert only — the one field the sheet marks "Expert Mode Only": the
         remaining hit points carry over into the next scenario, which is a rule
         the standard campaign does not have. */
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

      /* The three reward fields, each closed until its rung. The pooled one is
         a dropdown with cross-player exclusion and a die beside it, the other
         two free text. */
      PLAYER_REWARDS.forEach(function (def) {
        if (!def.pool) {
          card.appendChild(fieldRow(t(def.head), W.textField({
            value: player[def.key],
            label: caption + " – " + t(def.head),
            placeholder: t("cardNamePlaceholder"),
            maxLength: NAME_MAX,
            onChange: function (next) { player[def.key] = next; ctx.save(); },
          }), OPENS_AT[def.key]));
          return;
        }

        var select = W.poolSelect({
          value: player[def.key],
          label: caption + " – " + t(def.head),
          placeholder: t("cardPlaceholder"),
          options: def.pool.map(function (e) {
            return { value: e.slug, label: entryName(e, lang), lang: entryLang(e, lang) };
          }),
          onChange: function (next) { record(next); },
        });
        techSelects.push(select);

        /* The rung deals THREE upgrades at random and lets the player keep one,
           so the die cannot simply fill the field. It offers what it dealt and
           the player picks. The offer lives in the DOM only: it is not part of
           the sheet, and it stands until the choice is made. */
        var offer = W.el("ul", "chip-list draw-list");
        var die = W.iconButton({
          glyph: "🎲",
          label: caption + " – " + t("dieShieldTech"),
          onClick: function () {
            offer.innerHTML = "";
            var drawn = drawThree(freeShieldTech(state));
            if (!drawn.length) return;
            var head = W.el("li", "draw-caption");
            head.textContent = t("drawnCaption");
            offer.appendChild(head);
            drawn.forEach(function (e) {
              var li = W.el("li");
              var b = W.el("button", "chip chip-draw", {
                type: "button", lang: entryLang(e, lang),
                "aria-label": t("drawnPick", entryName(e, lang)),
                title: t("drawnPick", entryName(e, lang)),
              });
              b.textContent = entryName(e, lang);
              b.addEventListener("click", function () { record(e.slug); });
              li.appendChild(b);
              offer.appendChild(li);
            });
          },
        });

        /* Applied from the dropdown and from a chip alike, and in place rather
           than by re-rendering: a re-render would take the focus out of
           whatever the player was doing. */
        function record(next) {
          player[def.key] = next;
          select.value = next;
          offer.innerHTML = "";
          ctx.save();
          W.syncUnique(techSelects);
          paintGates(t, state);
        }

        var row = fieldRow(t(def.head), withDie(select, die), OPENS_AT[def.key], offer);
        row.setAttribute("data-shield-player", String(i));
        card.appendChild(row);
      });

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
    /* Last, so the pool starts out showing what is already taken. */
    W.syncUnique(techSelects);
    return section;
  }

  /* The track from page 1: where the marker stands, what a victory is worth,
     and the seven rungs. The rungs are reference material — nothing in them is
     stored, and nothing on this panel is editable except the one number. */
  function renderReputation(t, state, ctx) {
    /* No subtitle here: the other panels take theirs from the line the sheet
       prints under their heading, and this panel has no heading on the sheet to
       take one from. */
    var section = panel("reputation", t("secReputation"));

    var table = null;
    section.appendChild(fieldRow(t("lblReputation"), W.numberField({
      value: state.reputation,
      min: 0, max: REP_MAX,
      label: t("lblReputation"),
      hint: REP_MAX,
      onChange: function (next) {
        state.reputation = next;
        ctx.save();
        /* Repainted in place, never a re-render: the number is being typed in,
           and rebuilding the panel would take the focus out of the field. Both
           the rung list and every gated field follow from this one value, so
           both are repainted from it. */
        paintReached(table, next);
        paintGates(t, state);
      },
    })));

    /* What a victory is worth, straight off the foot of the track page. The app
       does not add it up, because the sheet does not either — there is no field
       for a per-scenario score. */
    var legend = W.el("p", "field-label");
    legend.textContent = t("lblConditions");
    section.appendChild(legend);
    var ul = W.el("ul", "rep-conditions");
    CONDITIONS.forEach(function (key) {
      ul.appendChild(ruleText(W.el("li"), t(key), t));
    });
    section.appendChild(ul);

    /* A real table: a rung only means anything in relation to its number and
       its column, and <th scope> is what conveys that. */
    table = W.el("table", "sheet-table rep-table");
    var caption = W.el("caption", "sr-only");
    caption.textContent = t("secThresholds");
    table.appendChild(caption);

    var thead = W.el("thead");
    var hrow = W.el("tr");
    [t("colThreshold"), t("colReward"), t("colPenalty")].forEach(function (label) {
      var th = W.el("th", null, { scope: "col" });
      th.textContent = label;
      hrow.appendChild(th);
    });
    thead.appendChild(hrow);
    table.appendChild(thead);

    var tbody = W.el("tbody");
    THRESHOLDS.forEach(function (row) {
      var tr = W.el("tr", null, { "data-threshold": String(row.at) });

      var th = W.el("th", "rep-at", { scope: "row" });
      th.textContent = String(row.at);
      tr.appendChild(th);

      [["colReward", row.reward], ["colPenalty", row.penalty]].forEach(function (pair) {
        var td = W.el("td", null, { "data-label": t(pair[0]) });
        pair[1].forEach(function (key) {
          td.appendChild(ruleText(W.el("p", "rep-rule"), t(key), t));
        });
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    section.appendChild(table);

    paintReached(table, state.reputation);
    return section;
  }

  /* Which rungs are in force, marked on the rows themselves. Derived from the
     one number every time rather than kept anywhere. */
  function paintReached(table, reputation) {
    if (!table) return;
    var rep = reputation == null ? 0 : reputation;
    Array.prototype.forEach.call(table.querySelectorAll("[data-threshold]"), function (tr) {
      var at = parseInt(tr.getAttribute("data-threshold"), 10);
      tr.classList.toggle("is-reached", rep >= at);
    });
  }

  /* Every field whose rung has not been reached is closed, and says which rung
     opens it — and so is the die beside it, which is why this is one pass over
     the whole sheet rather than a decision per control. Looked up in the
     document, like MC10's ally locks, because the reputation field sits in a
     different panel than the fields it governs.

     Closed, never emptied and never hidden: an imported sheet may carry an
     entry the current reputation does not reach, and lowering the marker after
     a mistyped number must not make a record vanish. */
  function paintGates(t, state) {
    var rep = repOf(state);
    document.querySelectorAll("[data-unlock]").forEach(function (row) {
      var at = parseInt(row.getAttribute("data-unlock"), 10);
      var open = rep >= at;
      var note = row.querySelector(".lock-note");
      if (note) note.textContent = open ? "" : t("unlockNote", String(at));

      var field = row.querySelector(".text-input, .pool-select");
      if (field) {
        field.disabled = !open;
        field.title = open
          ? (field.getAttribute("aria-label") || "")
          : t("unlockReason", String(at));
      }

      var die = row.querySelector(".icon-btn");
      if (die) paintDie(t, state, row, die, open, at);
      /* An offer that is no longer reachable goes away with the field: leaving
         three clickable cards under a closed field would be an invitation to
         write into it. */
      var offer = row.querySelector(".draw-list");
      if (offer && !open) offer.innerHTML = "";
    });
  }

  /* Why a die is locked, in the order the player would ask: the rung has not
     been reached, the field already holds a card, or there is nothing left to
     draw. A die never overwrites a choice — the same rule MC60's villain die
     follows. */
  function paintDie(t, state, row, die, open, at) {
    var cell = row.getAttribute("data-osborn-cell");
    var who = row.getAttribute("data-shield-player");
    var filled, left;
    if (cell != null) {
      filled = !!state.osbornTech[Number(cell)];
      left = freeOsborn(state).length;
    } else if (who != null) {
      var player = state.players[Number(who)];
      filled = !!(player && player.shieldTech);
      left = freeShieldTech(state).length;
    } else {
      return;
    }
    var reason = !open ? t("unlockReason", String(at))
      : filled ? t("dieTaken")
      : !left ? t("dieNoneLeft") : null;
    die.disabled = !!reason;
    die.title = reason || (die.getAttribute("aria-label") || "");
  }

  function renderCommunityService(t, lang, state, ctx) {
    var section = panel("community-service", t("secCommunityService"));
    subtitle(section, t("subCommunityService"));
    /* Boxes, not cells: the sheet asks which side schemes were recorded over
       scenarios 1 to 4, and the set has five. Nothing caps the ticks at four —
       the paper stops at four cells, but blocking a legal state is worse than
       allowing one the paper could not hold, and the sheet enforces nothing
       here either. */
    section.appendChild(flagRow(t("secCommunityService"), COMMUNITY_SERVICE, lang, {
      isOn: function (e) { return state.communityService.indexOf(e.slug) !== -1; },
      onChange: function (e, on) {
        toggleSlug(state.communityService, COMMUNITY_SERVICE, e.slug, on);
        ctx.save();
      },
    }));
    return section;
  }

  function renderWakingNightmare(t, state, ctx) {
    var section = panel("waking-nightmare", t("secWakingNightmare"));
    subtitle(section, t("subWakingNightmare"));
    section.appendChild(bareRow(W.numberField({
      value: state.wakingNightmare,
      min: 0, max: SCORE_MAX,
      label: t("secWakingNightmare"),
      onChange: function (next) { state.wakingNightmare = next; ctx.save(); },
    })));
    return section;
  }

  function renderLastOnesStanding(t, lang, state, ctx) {
    var section = panel("last-ones-standing", t("secLastOnesStanding"));
    subtitle(section, t("subLastOnesStanding"));
    /* Six boxes for six villains: the sheet's six cells and the set are the
       same size, so which cell a name sat in never carried anything. */
    section.appendChild(flagRow(t("secLastOnesStanding"), SINISTER_ASSAULT, lang, {
      isOn: function (e) { return state.lastOnesStanding.indexOf(e.slug) !== -1; },
      onChange: function (e, on) {
        toggleSlug(state.lastOnesStanding, SINISTER_ASSAULT, e.slug, on);
        ctx.save();
      },
    }));
    return section;
  }

  function renderFinalScore(t, state, ctx) {
    var section = panel("final-score", t("secFinalScore"));
    subtitle(section, t("subFinalScore"));
    section.appendChild(bareRow(W.numberField({
      value: state.finalScore,
      min: 0, max: REP_MAX,
      label: t("secFinalScore"),
      hint: REP_MAX,
      onChange: function (next) { state.finalScore = next; ctx.save(); },
    })));
    return section;
  }

  /* Cells rather than boxes, and one per rung: an Osborn Tech card is drawn on
     a particular rung of the track, so the cell says when it came in — and each
     cell opens only once that rung is reached. */
  function renderOsbornTech(t, lang, state, ctx) {
    var section = panel("osborn-tech", t("secOsbornTech"));
    subtitle(section, t("subPenalty"));

    /* The cell count drives the column count in styles.css, so the grid keeps
       the shape the sheet prints rather than the shape that happens to fit. */
    var row = W.el("div", "cell-row", { "data-cells": String(OSBORN_TECH_CELLS) });
    var selects = [];
    state.osbornTech.forEach(function (slug, i) {
      var cell = W.el("div", "cell", {
        "data-unlock": String(OSBORN_AT[i]), "data-osborn-cell": String(i),
      });
      var name = t("cellLabel", t("secOsbornTech"), String(i + 1),
        String(OSBORN_TECH_CELLS));
      var sel = W.poolSelect({
        value: slug,
        label: name,
        placeholder: t("cardPlaceholder"),
        options: OSBORN_TECH.map(function (e) {
          return { value: e.slug, label: entryName(e, lang), lang: entryLang(e, lang) };
        }),
        onChange: function (next) { record(next); },
      });
      selects.push(sel);

      /* The rung draws ONE attachment at random, so unlike the S.H.I.E.L.D.
         Tech die this one can fill the cell outright. It draws from what no
         other cell holds: a recorded card is already in the encounter deck. */
      var die = W.iconButton({
        glyph: "🎲",
        label: name + " – " + t("dieOsborn"),
        onClick: function () {
          var pick = W.pickRandom(freeOsborn(state));
          if (pick) record(pick.slug);
        },
      });

      /* Applied from the dropdown and the die alike, and in place rather than
         by re-rendering: that keeps the focus where the player put it. */
      function record(next) {
        state.osbornTech[i] = next;
        sel.value = next;
        ctx.save();
        W.syncUnique(selects);
        paintGates(t, state);
      }

      cell.appendChild(withDie(sel, die));
      cell.appendChild(W.el("span", "lock-note"));
      row.appendChild(cell);
    });
    /* Last, so the row starts out showing what the other cells already hold. */
    W.syncUnique(selects);

    section.appendChild(row);
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
         does not print a rule it is not playing. */
      if (state.expert) {
        line += " · " + t("colHp") + ": " + (p.hp == null ? "—" : String(p.hp));
      }
      printLine(players, line);
      /* Whether a field is currently closed is not printed: the printout is a
         record of what was written down, and a closed field with something in
         it is exactly the case that must not go missing. */
      printLine(players, "  " + t("secShieldTech") + ": " +
        (poolName(SHIELD_TECH, p.shieldTech, lang) || "—"));
      printLine(players, "  " + t("secAspectAdvantage") + ": " +
        (p.aspectAdvantage || "—"));
      printLine(players, "  " + t("secPlanningAhead") + ": " +
        (p.planningAhead || "—"));
    });

    /* The number and which rungs it has reached — not the rungs' wording. The
       printout is a record of a campaign, not a copy of the rulebook page. */
    var rep = printSection(root, t("secReputation"));
    printLine(rep, t("lblReputation") + ": " +
      (state.reputation == null ? "—" : String(state.reputation)));
    var hit = reachedAt(state.reputation).map(function (row) { return String(row.at); });
    printLine(rep, t("lblReached") + ": " + (hit.length ? hit.join(", ") : "—"));

    /* Every card of the set on its own line with a box: which side schemes were
       NOT recorded and which villains did NOT survive matters as much as which
       did, so the whole set prints either way. */
    printBoxes(root, t("secCommunityService"), state.communityService,
      COMMUNITY_SERVICE, lang);

    /* The bare value under the heading: the sheet prints one blank box there
       and no caption, so repeating the heading on the line would invent one. */
    var wn = printSection(root, t("secWakingNightmare"));
    printLine(wn, state.wakingNightmare == null ? "—" : String(state.wakingNightmare));

    printBoxes(root, t("secLastOnesStanding"), state.lastOnesStanding,
      SINISTER_ASSAULT, lang);

    var fs = printSection(root, t("secFinalScore"));
    printLine(fs, state.finalScore == null ? "—" : String(state.finalScore));

    /* One line per printed cell, empty ones included: an empty cell says that
       rung took no card yet, and the sheet leaves the place visible either
       way. */
    var ot = printSection(root, t("secOsbornTech"));
    state.osbornTech.forEach(function (slug) {
      printLine(ot, poolName(OSBORN_TECH, slug, lang) || "—");
    });
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
    id: "sinister-motives",
    code: "MC27",
    titleEn: "Sinister Motives",
    /* The German edition keeps the English campaign title, as this project
       does throughout. */
    titleDe: "Sinister Motives",
    theme: "sm",
    stateVersion: 1,

    emptyState: emptyState,
    normalize: normalize,
    render: render,
    renderPrint: renderPrint,

    helpDe: "Der MC27-Bogen ist der einzige der vier, auf dem kein einziges Häkchen gedruckt ist: alle Felder sind Zeilen zum Hineinschreiben. Wo die Zeile eine Karte aus einem gedruckten Satz meint, steht hier der Satz — in der Form, die der Bogen verlangt. Community Service und Last Ones Standing fragen, *welche* Karten, deshalb Kästchen über dem ganzen Satz: fünf Nebenschemata beziehungsweise die sechs Schurken der Sinister Six. Osborn Tech wird je Stufe der Leiste einmal gezogen, deshalb behält es eine Zelle je Stufe, und jede Karte gibt es nur einmal — eine gewählte verschwindet aus den anderen Zellen. Aspect Advantage und Planning Ahead bleiben Freitext, weil die Karte aus der eigenen Sammlung beziehungsweise dem eigenen Deck kommt und keine endliche gedruckte Liste ist. Die drei Belohnungsfelder (S.H.I.E.L.D. Tech, Aspect Advantage, Planning Ahead) druckt der Bogen als eigene Blöcke mit einer Spalte P1 bis P4; diese Spalte ist nur die Spielerliste noch einmal, deshalb stehen die Felder hier direkt in der Spielerkarte. Der Reputationsabschnitt hat auf dem Logbuchblatt kein Gegenstück: die laufende Reputation lebt auf der Leiste der ersten Seite, und ohne sie ließe sich nicht sagen, welche Belohnungen gerade gelten. Deshalb steht hier ein Zahlenfeld von 0 bis 35 und daneben die sieben Stufen der Leiste (1, 5, 9, 13, 17, 21, 25) mit Belohnung und Strafe; erreichte Stufen sind hervorgehoben, die noch offenen abgeblendet. Und dieselbe Zahl schaltet die Felder frei: S.H.I.E.L.D. Tech ab 1, Aspect Advantage ab 9, Planning Ahead ab 17, die drei Osborn-Tech-Zellen ab 1, 13 und 21. Ein noch nicht freigeschaltetes Feld ist gesperrt und sagt, ab welcher Stufe es aufgeht — gesperrt, nicht versteckt und nie geleert: wer die Reputation nach einem Zahlendreher zurückstellt, verliert keine Eintragung. Beide ausgelosten Felder haben einen Würfel neben sich, und er ist genau dann bedienbar, wenn das Feld selbst es ist. Bei Osborn Tech zieht der Würfel eine Karte und trägt sie ein — eine, weil die Stufe genau eine zieht, und nur aus den Karten, die in keiner anderen Zelle stehen. Bei S.H.I.E.L.D. Tech teilt der Würfel drei Verbesserungen aus, von denen der Spieler eine behält: die drei erscheinen unter dem Feld und werden mit einem Klick eingetragen. Die Auslosung selbst wird nicht gespeichert, sie steht nur bis zur Wahl — sie ist keine Eintragung auf dem Bogen. Ein Würfel überschreibt nie eine Wahl: steht im Feld schon eine Karte, ist er gesperrt und sagt auch das. Die Legende über der Tabelle sagt, wofür es Reputationspunkte gibt; addiert wird nichts, weil der Bogen dafür kein Feld hat. Oben im Spielerbereich steht der Haken „Expertenmodus“: die verbleibenden Lebenspunkte sind das einzige Feld, das der gedruckte Bogen mit „Expert Mode Only“ kennzeichnet, und auf Standardstufe blendet der Bogen es aus, statt danach zu fragen. Ausblenden heißt nicht löschen. Es gibt hier bewusst keine Szenario-Tabelle, kein „Abgeschlossen“, keinen Fortschrittszähler und kein Notizfeld: der gedruckte Bogen hat sie nicht.",
    helpEn: "The MC27 sheet is the only one of the four with no printed checkbox at all: every field is a line to write on. Where the line means a card from a printed set, the set is here — in the shape the sheet asks for. Community Service and Last Ones Standing ask *which* cards, so they are boxes over the whole set: five side schemes, and the six villains of the Sinister Six. Osborn Tech is drawn once per rung of the track, so it keeps one cell per rung, and each card exists once — choosing one removes it from the other cells. Aspect Advantage and Planning Ahead stay free text, because that card comes out of the player's own collection or deck rather than a finite printed list. The three reward fields (S.H.I.E.L.D. Tech, Aspect Advantage, Planning Ahead) are printed as their own blocks with a P1 to P4 column; that column is just the player list again, so the fields sit in the player card here. The reputation section has no counterpart on the log page: the running reputation lives on the track on page 1, and without it there is no saying which rewards are in force. So there is a number field from 0 to 35 here, and beside it the track's seven rungs (1, 5, 9, 13, 17, 21, 25) with their reward and penalty; the rungs reached are highlighted and the ones still ahead are dimmed. The same number opens the fields: S.H.I.E.L.D. Tech at 1, Aspect Advantage at 9, Planning Ahead at 17, and the three Osborn Tech cells at 1, 13 and 21. A field not yet unlocked is closed and says which rung opens it — closed, not hidden and never cleared: putting the reputation back after a mistyped number costs no record. Both drawn fields have a die beside them, and the die is usable exactly when the field is. The Osborn Tech die draws one card and records it — one, because the rung draws one, and only from the cards no other cell holds. The S.H.I.E.L.D. Tech die deals three upgrades for the player to keep one of: the three appear under the field and a click records one. The draw itself is not stored and stands only until the choice is made — it is not an entry on the sheet. A die never overwrites a choice: with a card already in the field it is locked, and it says so. The legend above the table says what a victory is worth; nothing is added up, because the sheet has no field for it. At the top of the player area sits the “Expert level” box: the remaining hit points are the only field the printed sheet marks “Expert Mode Only”, and at standard level the sheet hides it rather than asking for it. Hiding is not clearing. There is deliberately no scenario table, no “completed”, no progress counter and no notes field: the printed sheet has none.",

    /* Zweisprachig angelegt, aber noch nicht zweisprachig befüllt. Zwei
       Gruppen, und die Unterscheidung ist wichtig:

       1. Wörter, die diese App selbst wählt — Spalten, Platzhalter, Hinweise,
          das gemeinsame Vokabular aller Kampagnen („Verbleibende
          Lebenspunkte“) — stehen unten auf Deutsch und sind fertig.
       2. Wörter, die vom gedruckten Bogen kommen — die Abschnittsnamen, ihre
          Unterzeilen, die Texte der Reputationsstufen und die Legende — stehen
          unten NOCH ENGLISCH. Sie sind aus dem deutschen Druck nachzutragen,
          und zwar wörtlich. Das ist offene Arbeit, keine Entscheidung; ebenso
          die Kartennamen oben in den Pools, die noch de: null tragen.

       Es migriert nichts, wenn sich eine Beschriftung ändert — persistiert
       werden nur Feldschlüssel, nie Beschriftungen. */
    i18n: {
      de: {
        secPlayers: "Spieler-Informationen",
        secReputation: "Rufleiste",
        secThresholds: "Rufleisten-Belohnungen und -Strafen",
        secCommunityService: "Alltagshilfe",
        secWakingNightmare: "Aufrüttelnder Alptraum",
        secLastOnesStanding: "Die Letzten, die noch stehen",
        secFinalScore: "Finaler Rufwert",
        secShieldTech: "S.H.I.E.L.D.-Tech",
        secAspectAdvantage: "Aspektvorteil",
        secPlanningAhead: "Vorausplanen",
        secOsbornTech: "Osborn-Tech",

        subCommunityService: "Sieg-Anweisungen für Szenarien #1-4",
        subWakingNightmare: "Sieg-Anweisung für Szenario #3 — Mysterio",
        subLastOnesStanding: "Sieg-Anweisung für Szenario #4 — Die Sinister Six",
        subFinalScore: "Sieg-Anweisung für Szenario #5 — Venom Goblin",
        subPenalty: "Strafe - Rufleiste",

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

        lblReputation: "Aktueller Rufwert",
        lblReached: "Aktivierte Rufeffekte",
        lblConditions: "Besondere Leistungen",
        colThreshold: "Stufe",
        colReward: "Belohnung",
        colPenalty: "Strafe",
        /* "%s" = die Stufe, ab der das Feld aufgeht. Kurz, weil es neben der
           Feldbeschriftung steht; der Sperrgrund sagt es ganz. */
        /* Der Name des Symbols, das im Regeltext an den Stellen mit "{pp}"
           steht — er wird gesprochen und beim Zeigen eingeblendet. */
        perPlayer: "pro Spieler",
        unlockNote: "ab Rufwert %s",
        unlockReason: "Wird ab Rufwert %s freigeschaltet. Eingetragenes bleibt erhalten.",
        /* "%s" = Abschnitt, Nummer der Zelle, Anzahl der Zellen. Der gedruckte
           Bogen beschriftet die Zellen nicht; die Nummer ist das Wenigste, was
           sie für Screenreader auseinanderhält. */
        cellLabel: "%s – Feld %s von %s",
        /* Beschriftung und Sperrgründe der Würfel. "%s" in drawnPick ist der
           Kartenname. */
        dieOsborn: "Karte auslosen",
        dieShieldTech: "Drei Upgrades austeilen",
        dieTaken: "In diesem Feld steht schon eine Karte. Ein Würfel überschreibt keine Wahl.",
        dieNoneLeft: "Es ist keine Karte mehr übrig.",
        drawnCaption: "Ausgeteilt — eine behalten:",
        drawnPick: "%s eintragen",
        cardPlaceholder: "— Karte wählen —",
        cardNamePlaceholder: "Kartenname …",

        rwShieldTech: "Teilt einem Spieler 3 zufällige Upgrades „Kampagne – S.H.I.E.L.D.-Tech“ zu. Dieser Spieler darf sich 1 aussuchen, das er für den Rest der Kampagne seinem Deck hinzufügt. Notiert den Namen der Karte in seinem Feld „S.H.I.E.L.D.-Tech“ im Kampagnenlogbuch und legt die anderen zurück in die Sammlung. Auf diese Weise gewählte Karten werden nicht auf die Deckgröße angerechnet. Wiederholt diesen Vorgang für jeden Spieler.",
        rwMulligan: "Während des Schrittes „Mulligan nutzen“ des Spielaufbaus darf jeder Spieler 1 zusätzlichen Mulligan nehmen.",
        rwAspectAdvantage: "Jeder Spieler wählt eine Aspektkarte eines beliebigen Aspekts aus seiner Sammlung und fügt seinem Deck für den Rest der Kampagne die maximale Anzahl an Exemplaren dieser Karte (nach Name) hinzu. Notiert den Namen der Karte(n) in seinem Feld „Aspektvorteil“ im Kampagnenlogbuch. Auf diese Weise gewählte Karten werden nicht auf die Deckgröße angerechnet.",
        rwEnhanced: "Spielaufbau: Jeder Spieler dreht sein Upgrade „Kampagne - S.H.I.E.L.D.-Tech“ auf die Verbessert-Seite um.",
        rwPlanningAhead: "Jeder Spieler wählt eine Karte aus seinem Deck und notiert den Titel dieser Karte in seinem Feld „Vorausplanen“ im Kampagnenlogbuch.",
        rwPlanningAheadSetup: "Spielaufbau: Jeder Spieler durchsucht sein Deck und seinen Ablagestapel nach 1 Exemplar der Karte, die in seinem Feld „Vorausplanen“ im Kampagnenlogbuch notiert ist, und nimmt diese Karte dann auf die Hand. (Mische.)",
        rwHelicarrier: "Spielaufbau: Jeder Spieler darf seine Sammlung nach 1 Exemplar des Vorteils Helicarrier (Grundspiel 92) durchsuchen und unter seiner Kontrolle ins Spiel bringen.",
        rwSymbioteSuit: "Spielaufbau: Jeder Spieler darf seine Sammlung nach 1 Exemplar des Upgrades Symbiotischer Anzug (Sinister Motives 191) durchsuchen und unter seiner Kontrolle ins Spiel bringen.",

        pnOsbornTech: "Wählt 1 zufälligen „Osborn-Tech“-Anhang. Notiert seinen Namen im Feld „Osborn-Tech“ des Kampagnenlogbuchs.",
        pnOsbornShuffle: "Spielaufbau: Mischt jede Karte, die im Feld „Osborn-Tech“ des Kampagnenlogbuchs notiert ist, in das Begegnungsdeck.",
        pnThreat: "Spielaufbau: Platziert 1{pp} Bedrohung auf dem Hauptplan.",
        pnMinion: "Spielaufbau: In Spielerreihenfolge muss jeder Spieler das Begegnungsdeck und den Ablagestapel nach einem Schergen durchsuchen und ihn im Kampf mit sich ins Spiel bringen. (Mische.) Teile jedem Spieler, der auf diese Weise keinen Schergen ins Spiel gebracht hat, 1 verdeckte Begegnungskarte zu.",
        pnSideScheme: "Spielaufbau: Der Startspieler muss das Begegnungsdeck und den Ablagestapel nach einem szenariospezifischen Nebenplan durchsuchen und ihn aufdecken. Platziert 1{pp} Bedrohung auf dem Nebenplan. (Mische.)",
        pnEncounter: "Spielaufbau: Teilt jedem Spieler 1 verdeckte Begegnungskarte zu.",

        cdVictoryPoints: "(+X) Siegpunkte im Siegpunktestapel",
        cdNoMinions: "(+1) Keine Schergen im Spiel",
        cdNoSideSchemes: "(+1) Keine Nebenpläne im Spiel",
        cdNoThreat: "(+1) Keine Bedrohung auf dem Hauptplan",
        cdNoAcceleration: "(+1) Weniger als 1{pp} Beschleunigungs-Marker im Spiel",
        cdNoDefeated: "(+1) Keine besiegten Identitäten",
      },
      en: {
        secPlayers: "Player Information",
        secReputation: "Reputation Track",
        secThresholds: "Reputation Track Rewards and Penalties",
        secCommunityService: "Community Service",
        secWakingNightmare: "Waking Nightmare",
        secLastOnesStanding: "Last Ones Standing",
        secFinalScore: "Final Reputation Score",
        secShieldTech: "S.H.I.E.L.D. Tech",
        secAspectAdvantage: "Aspect Advantage",
        secPlanningAhead: "Planning Ahead",
        secOsbornTech: "Osborn Tech",

        subCommunityService: "Victory for Scenarios #1-4",
        subWakingNightmare: "Victory for Scenario #3 — Mysterio",
        subLastOnesStanding: "Victory for Scenario #4 — The Sinister Six",
        subFinalScore: "Victory for Scenario #5 — Venom Goblin",
        subPenalty: "Reputation Track Penalty",

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

        lblReputation: "Current reputation",
        lblReached: "Thresholds reached",
        lblConditions: "Conditions",
        colThreshold: "At",
        colReward: "Reward",
        colPenalty: "Penalty",
        perPlayer: "per player",
        unlockNote: "from reputation %s",
        unlockReason: "Unlocked at reputation %s. Anything recorded is kept.",
        cellLabel: "%s – cell %s of %s",
        dieOsborn: "Draw a card",
        dieShieldTech: "Deal three upgrades",
        dieTaken: "This field already holds a card. A die never overwrites a choice.",
        dieNoneLeft: "No card is left.",
        drawnCaption: "Dealt — keep one:",
        drawnPick: "Record %s",
        cardPlaceholder: "— choose a card —",
        cardNamePlaceholder: "Card name …",

        rwShieldTech: "Deal 3 “Campaign - S.H.I.E.L.D. Tech” upgrades at random to a player. That player may choose 1 to add to their deck for the rest of the campaign, record that card’s title in their “S.H.I.E.L.D. Tech” section of the campaign log, then return the others to the collection. Cards chosen this way do not count toward minimum or maximum deck size. Repeat this process for each player.",
        rwMulligan: "During step 13 of game setup, each player may take 1 additional mulligan.",
        rwAspectAdvantage: "Each player chooses an aspect card in their collection from any aspect and adds the maximum number of copies of that card, by title, to their deck for the rest of the campaign. Record the title of that card in their “Aspect Advantage” section of the campaign log. Cards chosen this way do not count toward minimum or maximum deck size.",
        rwEnhanced: "Setup: Each player flips their “Campaign - S.H.I.E.L.D. Tech” upgrade to its Enhanced side.",
        rwPlanningAhead: "Each player chooses one card from their deck, then records the title of that card in their “Planning Ahead” section of the campaign log.",
        rwPlanningAheadSetup: "Setup: Each player searches their deck and discard pile for 1 copy of the card recorded in their “Planning Ahead” section of the campaign log, then adds that card to their hand. (Shuffle.)",
        rwHelicarrier: "Setup: Each player may search their collection for a Helicarrier support (Core Set 92) and put it into play under their control.",
        rwSymbioteSuit: "Setup: Each player may search their collection for a Symbiote Suit upgrade (Sinister Motives 191) and put it into play under their control.",

        pnOsbornTech: "Choose one “Osborn Tech” attachment at random. Record its name in the “Osborn Tech” section of the campaign log.",
        pnOsbornShuffle: "Setup: Shuffle each card recorded in the “Osborn Tech” section of the campaign log into the encounter deck.",
        pnThreat: "Setup: Place 1{pp} threat on the main scheme.",
        pnMinion: "Setup: In player order, each player must search the encounter deck and discard pile for a minion, then put that minion into play engaged with themself. (Shuffle.) For each player who did not put a minion into play this way, deal that player 1 facedown encounter card.",
        pnSideScheme: "Setup: The first player must search the encounter deck and discard pile for a scenario-specific side scheme, then reveal it. Place 1{pp} threat on that side scheme. (Shuffle.)",
        pnEncounter: "Setup: Deal 1 facedown encounter card to each player.",

        cdVictoryPoints: "(+X) Victory points in the victory display",
        cdNoMinions: "(+1) No minions in play",
        cdNoSideSchemes: "(+1) No side schemes in play",
        cdNoThreat: "(+1) No threat on the main scheme",
        cdNoAcceleration: "(+1) Fewer than 1{pp} acceleration tokens in play",
        cdNoDefeated: "(+1) No defeated identities",
      },
    },
  });
}(window));

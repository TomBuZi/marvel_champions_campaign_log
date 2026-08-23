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
   this has that set as a dropdown instead — writing a name by hand could only
   introduce a typo, and each set carries its own rule about repeats (see POOLS
   below). Aspect Advantage and Planning Ahead stay free text, because they are
   chosen from the player's own collection and deck, which is not a finite
   printed list.

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
   prints.

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

  /* How many cells each section prints. Not a nice-to-have: the position of a
     cell is part of the entry, so these lists are fixed-length slots rather
     than sets, and the numbers below are what normalize() enforces. */
  var COMMUNITY_SERVICE_CELLS = 4;   // "Victory for Scenarios #1-4"
  var LAST_ONES_STANDING_CELLS = 6;  // the six villains of the Sinister Six
  var OSBORN_TECH_CELLS = 3;         // three Osborn Tech rungs on the track

  /* ---- POOLS ---------------------------------------------------------------
     Every card carries an English and a German name, as in MC10 and MC21.
     `de: null` shows the English name and tags it lang="en".

     Here `de: null` means the German name is STILL TO BE ENTERED from the
     German printing — this is open work, not the MC10/MC21 case where a name
     stays English on purpose. Filling one in migrates nothing, because only
     the slug is ever persisted.

     Each pool carries a different rule, taken from the campaign:

       Community Service    four cells out of five printed side schemes; each
                            side scheme exists once, so the cells differ
       Sinister Assault     the six villains of scenario 4; six cells, six
                            cards, each named at most once
       Osborn Tech          three cells out of six attachments; a recorded one
                            is shuffled into the encounter deck, so it cannot
                            be drawn a second time
       S.H.I.E.L.D. Tech    one per player, each card to at most one player —
                            the unchosen cards go back to the collection, the
                            chosen one does not */

  /* "Community Service" encounter set — the side schemes recorded after each of
     scenarios 1 to 4. */
  var COMMUNITY_SERVICE = [
    { slug: "back-alley-burglary", en: "Back Alley Burglary", de: null },
    { slug: "cat-in-a-tree",       en: "Cat in a Tree",       de: null },
    { slug: "henchmen-heist",      en: "Henchmen Heist",      de: null },
    { slug: "off-the-rails",       en: "Off the Rails",       de: null },
    { slug: "rubble-rescue",       en: "Rubble Rescue",       de: null },
  ];

  /* "Sinister Assault" encounter set — the six elite minions of The Sinister
     Six, recorded under "Last Ones Standing". */
  var SINISTER_ASSAULT = [
    { slug: "doctor-octopus",    en: "Doctor Octopus",    de: null },
    { slug: "electro",           en: "Electro",           de: null },
    { slug: "hobgoblin",         en: "Hobgoblin",         de: null },
    { slug: "kraven-the-hunter", en: "Kraven the Hunter", de: null },
    { slug: "scorpion",          en: "Scorpion",          de: null },
    { slug: "vulture",           en: "Vulture",           de: null },
  ];

  /* "Osborn Tech" encounter set — the attachments drawn at random on three
     rungs of the reputation track. */
  var OSBORN_TECH = [
    { slug: "arm-cannon",       en: "Arm Cannon",       de: null },
    { slug: "ionic-boots",      en: "Ionic Boots",      de: null },
    { slug: "kinetic-armor",    en: "Kinetic Armor",    de: null },
    { slug: "neocarbon-scales", en: "Neocarbon Scales", de: null },
    { slug: "spiked-gauntlet",  en: "Spiked Gauntlet",  de: null },
    { slug: "tracking-display", en: "Tracking Display", de: null },
  ];

  /* The "Campaign - S.H.I.E.L.D. Tech" upgrades. Each has a plain and an
     Enhanced side; the sheet records the title, which is the same on both, so
     the pool lists eight titles rather than sixteen faces. Flipping to the
     Enhanced side is a track reward, not a second field. */
  var SHIELD_TECH = [
    { slug: "compact-darts",         en: "Compact Darts",         de: null },
    { slug: "impact-dampening-suit", en: "Impact-Dampening Suit", de: null },
    { slug: "laser-goggles",         en: "Laser Goggles",         de: null },
    { slug: "propulsion-gauntlet",   en: "Propulsion Gauntlet",   de: null },
    { slug: "retinal-display",       en: "Retinal Display",       de: null },
    { slug: "shock-knuckles",        en: "Shock Knuckles",        de: null },
    { slug: "wave-bracers",          en: "Wave Bracers",          de: null },
    { slug: "wrist-navigator",       en: "Wrist Navigator",       de: null },
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
     three labels that could drift apart. */
  var THRESHOLDS = [
    { at: 1,  reward: ["rwShieldTech"],
              penalty: ["pnOsbornTech", "pnOsbornShuffle"] },
    { at: 5,  reward: ["rwMulligan"],       penalty: ["pnThreat"] },
    { at: 9,  reward: ["rwAspectAdvantage"], penalty: ["pnMinion"] },
    { at: 13, reward: ["rwEnhanced"],       penalty: ["pnOsbornTech"] },
    { at: 17, reward: ["rwPlanningAhead", "rwPlanningAheadSetup"],
              penalty: ["pnSideScheme"] },
    { at: 21, reward: ["rwHelicarrier"],    penalty: ["pnOsbornTech"] },
    { at: 25, reward: ["rwSymbioteSuit"],   penalty: ["pnEncounter"] },
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

  /* "Player #1" on its own, or "Player #1 – Ghost-Spider" once there is a name
     to say. Used wherever a control has to say whose it is. */
  function playerLabel(t, player, i) {
    var caption = t("playerRow", String(i + 1));
    var hero = String(player.hero || "").trim();
    return hero ? caption + " – " + hero : caption;
  }

  /* Which rungs the given reputation has reached. Derived and never stored: the
     reputation is the single source, so an imported sheet cannot disagree with
     itself about what is unlocked. A blank field counts as 0 — an empty track. */
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
      communityService: emptySlots(COMMUNITY_SERVICE_CELLS),
      wakingNightmare: null,
      lastOnesStanding: emptySlots(LAST_ONES_STANDING_CELLS),
      finalScore: null,
      osbornTech: emptySlots(OSBORN_TECH_CELLS),
    };
  }

  function newPlayer() {
    return {
      hero: "",
      hp: null,
      /* The three "Reputation Track Reward" sections. They live ON the player
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

    out.communityService =
      pickSlots(raw.communityService, COMMUNITY_SERVICE, COMMUNITY_SERVICE_CELLS);
    out.wakingNightmare =
      W.clampNumber(raw.wakingNightmare === "" ? null : raw.wakingNightmare, 0, REP_MAX);
    out.lastOnesStanding =
      pickSlots(raw.lastOnesStanding, SINISTER_ASSAULT, LAST_ONES_STANDING_CELLS);
    out.finalScore =
      W.clampNumber(raw.finalScore === "" ? null : raw.finalScore, 0, REP_MAX);
    out.osbornTech = pickSlots(raw.osbornTech, OSBORN_TECH, OSBORN_TECH_CELLS);

    return out;
  }

  /* A fixed-length row of cells, each holding a recognised slug or nothing.
     Unlike MC10's pickSlugs() this keeps the POSITION: the cell an entry sits
     in is part of what was written down, so the list cannot be reordered into
     pool order. An unknown slug and a repeat of one an earlier cell already
     holds both empty their cell — earlier cells win, and it is that fixed rule
     which makes a second pass over the same state produce the same array. */
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

  /* No migrate(): stateVersion is 1, so there is no older shape in the wild
     yet. The first change to the shape above has to bring one with it — see
     the check in test/lint.js. */

  /* Counts the expert-only field even at standard level: it is hidden, not
     gone, and removing a player would still throw it away. */
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
     #3 — Mysterio", "Reputation Track Reward". It says which game the entry
     came out of, so it belongs on screen too. */
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

  /* A control with no visible label. The sheet prints these two sections as a
     heading over a single blank box, so repeating the heading as a field label
     would be a caption the paper does not have; the control carries the section
     name as its accessible name instead. */
  function bareRow(control) {
    var row = W.el("div", "player-field");
    row.appendChild(control);
    return row;
  }

  /* One of the sheet's unlabelled cell grids: four, six or three blank places
     side by side. There is nothing to write above them — the sheet prints the
     heading once and then bare cells — so the cells carry their position in
     their accessible name instead, which is the least that keeps them apart
     for anyone not looking at the grid. */
  function cellRow(t, heading, pool, lang, slots, cfg) {
    /* The cell count drives the column count in styles.css, so the grid keeps
       the shape the sheet prints rather than the shape that happens to fit. */
    var row = W.el("div", "cell-row", { "data-cells": String(slots.length) });
    var selects = [];
    slots.forEach(function (slug, i) {
      var sel = W.poolSelect({
        value: slug,
        label: t("cellLabel", heading, String(i + 1), String(slots.length)),
        placeholder: t("cardPlaceholder"),
        options: pool.map(function (e) {
          return { value: e.slug, label: entryName(e, lang), lang: entryLang(e, lang) };
        }),
        onChange: function (next) {
          slots[i] = next;
          cfg.onChange();
          W.syncUnique(selects);
        },
      });
      selects.push(sel);
      row.appendChild(sel);
    });
    /* Last, so the row starts out showing what the other cells already hold. */
    W.syncUnique(selects);
    return row;
  }

  function render(root, ctx) {
    var t = ctx.t, lang = ctx.lang, state = ctx.state;

    root.appendChild(renderPlayers(t, lang, state, ctx));
    root.appendChild(renderReputation(t, state, ctx));

    /* The sheet's own rows, in its own order: a wide section beside a narrow
       one, twice; then the three reward sections across; then the penalty on
       its own. .scenario-row is two columns on a wide screen and one on a
       narrow one, .reward-row three and one — as close as a screen gets to the
       paper while staying readable. */
    var row = W.el("div", "scenario-row");
    row.appendChild(renderCommunityService(t, lang, state, ctx));
    row.appendChild(renderWakingNightmare(t, state, ctx));
    root.appendChild(row);

    var row2 = W.el("div", "scenario-row");
    row2.appendChild(renderLastOnesStanding(t, lang, state, ctx));
    row2.appendChild(renderFinalScore(t, state, ctx));
    root.appendChild(row2);

    var rewards = W.el("div", "reward-row");
    rewards.appendChild(renderShieldTech(t, lang, state, ctx));
    rewards.appendChild(renderFreeTextReward(t, state, ctx, {
      id: "aspect-advantage", head: "secAspectAdvantage", key: "aspectAdvantage",
    }));
    rewards.appendChild(renderFreeTextReward(t, state, ctx, {
      id: "planning-ahead", head: "secPlanningAhead", key: "planningAhead",
    }));
    root.appendChild(rewards);

    root.appendChild(renderOsbornTech(t, lang, state, ctx));
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
         something on the card to lose — and a card here also stands for three
         entries in the reward panels below, so the check has to look at all of
         it. */
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
             and renumber, and the three reward panels have to be rebuilt
             against the players that are left. */
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
          /* The three reward panels name their player, so they follow along.
             Rewritten in place rather than by re-rendering, which would take
             the focus out of the field being typed in. */
          paintPlayerNames(t, state);
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
           and rebuilding the panel would take the focus out of the field. */
        paintReached(table, next);
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
      var li = W.el("li");
      li.textContent = t(key);
      ul.appendChild(li);
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
          var p = W.el("p", "rep-rule");
          p.textContent = t(key);
          td.appendChild(p);
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

  function renderCommunityService(t, lang, state, ctx) {
    var section = panel("community-service", t("secCommunityService"));
    subtitle(section, t("subCommunityService"));
    section.appendChild(cellRow(t, t("secCommunityService"), COMMUNITY_SERVICE, lang,
      state.communityService, { onChange: function () { ctx.save(); } }));
    return section;
  }

  function renderWakingNightmare(t, state, ctx) {
    var section = panel("waking-nightmare", t("secWakingNightmare"));
    subtitle(section, t("subWakingNightmare"));
    section.appendChild(bareRow(W.numberField({
      value: state.wakingNightmare,
      min: 0, max: REP_MAX,
      label: t("secWakingNightmare"),
      onChange: function (next) { state.wakingNightmare = next; ctx.save(); },
    })));
    return section;
  }

  function renderLastOnesStanding(t, lang, state, ctx) {
    var section = panel("last-ones-standing", t("secLastOnesStanding"));
    subtitle(section, t("subLastOnesStanding"));
    section.appendChild(cellRow(t, t("secLastOnesStanding"), SINISTER_ASSAULT, lang,
      state.lastOnesStanding, { onChange: function () { ctx.save(); } }));
    return section;
  }

  function renderFinalScore(t, state, ctx) {
    var section = panel("final-score", t("secFinalScore"));
    subtitle(section, t("subFinalScore"));
    section.appendChild(bareRow(W.numberField({
      value: state.finalScore,
      min: 0, max: REP_MAX,
      label: t("secFinalScore"),
      onChange: function (next) { state.finalScore = next; ctx.save(); },
    })));
    return section;
  }

  /* One S.H.I.E.L.D. Tech upgrade per player, each card to at most one player,
     so the taken ones disappear from the other players' fields — the same
     treatment MC10 gives its upgrades. */
  function renderShieldTech(t, lang, state, ctx) {
    var section = panel("shield-tech", t("secShieldTech"));
    subtitle(section, t("subReward"));

    var selects = [];
    state.players.forEach(function (player, i) {
      var sel = W.poolSelect({
        value: player.shieldTech,
        label: playerLabel(t, player, i) + " – " + t("secShieldTech"),
        placeholder: t("cardPlaceholder"),
        options: SHIELD_TECH.map(function (e) {
          return { value: e.slug, label: entryName(e, lang), lang: entryLang(e, lang) };
        }),
        onChange: function (next) {
          player.shieldTech = next;
          ctx.save();
          W.syncUnique(selects);
        },
      });
      selects.push(sel);
      section.appendChild(playerRow(t, player, i, sel));
    });
    /* Last, so the pool starts out showing what is already taken. */
    W.syncUnique(selects);
    return section;
  }

  /* Aspect Advantage and Planning Ahead: same shape, and free text in both
     cases, because the card comes out of the player's own collection or deck
     rather than a printed set. */
  function renderFreeTextReward(t, state, ctx, cfg) {
    var section = panel(cfg.id, t(cfg.head));
    subtitle(section, t("subReward"));
    state.players.forEach(function (player, i) {
      var input = W.textField({
        value: player[cfg.key],
        label: playerLabel(t, player, i) + " – " + t(cfg.head),
        placeholder: t("cardNamePlaceholder"),
        maxLength: NAME_MAX,
        onChange: function (next) { player[cfg.key] = next; ctx.save(); },
      });
      section.appendChild(playerRow(t, player, i, input));
    });
    return section;
  }

  function renderOsbornTech(t, lang, state, ctx) {
    var section = panel("osborn-tech", t("secOsbornTech"));
    subtitle(section, t("subPenalty"));
    section.appendChild(cellRow(t, t("secOsbornTech"), OSBORN_TECH, lang,
      state.osbornTech, { onChange: function () { ctx.save(); } }));
    return section;
  }

  /* A row in one of the reward panels: the player's name as the label, so the
     panel reads like the sheet's P1 to P4 column. The caption is tagged so
     paintPlayerNames() can keep it in step with the identity field. */
  function playerRow(t, player, i, control) {
    var row = W.el("div", "player-field");
    var label = W.el("label", "field-label", { "data-player-name": String(i) });
    label.textContent = playerLabel(t, player, i);
    label.appendChild(control);
    row.appendChild(label);
    return row;
  }

  /* Keeps every caption that names a player in step with the identity fields,
     without re-rendering anything. Looked up in the document, like MC10 does,
     because the callers sit in other panels.

     Only the first text node is rewritten: the caption is a <label> whose
     control is its own child, so replacing textContent would throw the field
     away with it. */
  function paintPlayerNames(t, state) {
    document.querySelectorAll("[data-player-name]").forEach(function (node) {
      var i = parseInt(node.getAttribute("data-player-name"), 10);
      var player = state.players[i];
      if (!player) return;
      var text = playerLabel(t, player, i);
      if (node.firstChild && node.firstChild.nodeType === 3) node.firstChild.nodeValue = text;
      else node.insertBefore(document.createTextNode(text), node.firstChild);
    });
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

    printCells(root, t("secCommunityService"), state.communityService, COMMUNITY_SERVICE, lang);

    /* The bare value under the heading: the sheet prints one blank box there
       and no caption, so repeating the heading on the line would invent one. */
    var wn = printSection(root, t("secWakingNightmare"));
    printLine(wn, state.wakingNightmare == null ? "—" : String(state.wakingNightmare));

    printCells(root, t("secLastOnesStanding"), state.lastOnesStanding, SINISTER_ASSAULT, lang);

    var fs = printSection(root, t("secFinalScore"));
    printLine(fs, state.finalScore == null ? "—" : String(state.finalScore));

    printCells(root, t("secOsbornTech"), state.osbornTech, OSBORN_TECH, lang);
  }

  /* One line per printed cell, empty ones included: an empty cell is a
     statement — that scenario recorded nothing, or that villain did not
     survive — and the sheet leaves the place visible either way. */
  function printCells(root, heading, slots, pool, lang) {
    var section = printSection(root, heading);
    slots.forEach(function (slug) {
      printLine(section, poolName(pool, slug, lang) || "—");
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

    helpDe: "Der MC27-Bogen ist der einzige der vier, auf dem kein einziges Häkchen gedruckt ist: alle Felder sind Zeilen zum Hineinschreiben. Wo die Zeile eine Karte aus einem gedruckten Satz meint, steht hier der Satz als Auswahlfeld — Community Service (vier Zellen aus fünf Nebenschemata), Last Ones Standing (die sechs Schurken der Sinister Six), Osborn Tech (drei Zellen aus sechs Anhängen) und S.H.I.E.L.D. Tech (einer je Spieler). Jede Karte gibt es nur einmal, eine gewählte verschwindet daher aus den übrigen Zellen beziehungsweise aus den Feldern der anderen Spieler. Aspect Advantage und Planning Ahead bleiben Freitext, weil die Karte aus der eigenen Sammlung beziehungsweise dem eigenen Deck kommt und keine endliche gedruckte Liste ist. Der Reputationsabschnitt hat auf dem Logbuchblatt kein Gegenstück: die laufende Reputation lebt auf der Leiste der ersten Seite, und ohne sie ließe sich nicht sagen, welche Belohnungen gerade gelten. Deshalb steht hier ein Zahlenfeld von 0 bis 35 und daneben die sieben Stufen der Leiste (1, 5, 9, 13, 17, 21, 25) mit Belohnung und Strafe; erreichte Stufen sind hervorgehoben, die noch offenen abgeblendet. Das ist abgeleitet und wird nicht gespeichert — die Zahl ist die einzige Quelle. Die Legende darüber sagt, wofür es Reputationspunkte gibt; addiert wird nichts, weil der Bogen dafür kein Feld hat. Oben im Spielerbereich steht der Haken „Expertenmodus“: die verbleibenden Lebenspunkte sind das einzige Feld, das der gedruckte Bogen mit „Expert Mode Only“ kennzeichnet, und auf Standardstufe blendet der Bogen es aus, statt danach zu fragen. Ausblenden heißt nicht löschen — wer versehentlich umschaltet, verliert nichts. Es gibt hier bewusst keine Szenario-Tabelle, kein „Abgeschlossen“, keinen Fortschrittszähler und kein Notizfeld: der gedruckte Bogen hat sie nicht.",
    helpEn: "The MC27 sheet is the only one of the four with no printed checkbox at all: every field is a line to write on. Where the line means a card from a printed set, the set is here as a dropdown — Community Service (four cells out of five side schemes), Last Ones Standing (the six villains of the Sinister Six), Osborn Tech (three cells out of six attachments) and S.H.I.E.L.D. Tech (one per player). Each card exists once, so choosing one removes it from the other cells, or from the other players' fields. Aspect Advantage and Planning Ahead stay free text, because that card comes out of the player's own collection or deck rather than a finite printed list. The reputation section has no counterpart on the log page: the running reputation lives on the track on page 1, and without it there is no saying which rewards are in force. So there is a number field from 0 to 35 here, and beside it the track's seven rungs (1, 5, 9, 13, 17, 21, 25) with their reward and penalty; the rungs reached are highlighted and the ones still ahead are dimmed. That is derived and never stored — the number is the only source. The legend above it says what a victory is worth; nothing is added up, because the sheet has no field for it. At the top of the player area sits the “Expert level” box: the remaining hit points are the only field the printed sheet marks “Expert Mode Only”, and at standard level the sheet hides it rather than asking for it. Hiding is not clearing — switching by accident loses nothing. There is deliberately no scenario table, no “completed”, no progress counter and no notes field: the printed sheet has none.",

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
        subReward: "Reputation Track Reward",
        subPenalty: "Reputation Track Penalty",

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

        lblReputation: "Aktuelle Reputation",
        lblReached: "Erreichte Stufen",
        lblConditions: "Wofür es Reputation gibt",
        colThreshold: "Stufe",
        colReward: "Belohnung",
        colPenalty: "Strafe",
        /* "%s" = Abschnitt, Nummer der Zelle, Anzahl der Zellen. Der gedruckte
           Bogen beschriftet die Zellen nicht; die Nummer ist das Wenigste, was
           sie für Screenreader auseinanderhält. */
        cellLabel: "%s – Feld %s von %s",
        cardPlaceholder: "— Karte wählen —",
        cardNamePlaceholder: "Kartenname …",

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
        pnThreat: "Setup: Place 1 threat on the main scheme.",
        pnMinion: "Setup: In player order, each player must search the encounter deck and discard pile for a minion, then put that minion into play engaged with themself. (Shuffle.) For each player who did not put a minion into play this way, deal that player 1 facedown encounter card.",
        pnSideScheme: "Setup: The first player must search the encounter deck and discard pile for a scenario-specific side scheme, then reveal it. Place 1 threat on that side scheme. (Shuffle.)",
        pnEncounter: "Setup: Deal 1 facedown encounter card to each player.",

        cdVictoryPoints: "(+X) Victory points in the victory display",
        cdNoMinions: "(+1) No minions in play",
        cdNoSideSchemes: "(+1) No side schemes in play",
        cdNoThreat: "(+1) No threat on the main scheme",
        cdNoAcceleration: "(+1) Fewer than 1 acceleration tokens in play",
        cdNoDefeated: "(+1) No defeated identities",
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
        subReward: "Reputation Track Reward",
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
        lblConditions: "How reputation is earned",
        colThreshold: "At",
        colReward: "Reward",
        colPenalty: "Penalty",
        cellLabel: "%s – cell %s of %s",
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
        pnThreat: "Setup: Place 1 threat on the main scheme.",
        pnMinion: "Setup: In player order, each player must search the encounter deck and discard pile for a minion, then put that minion into play engaged with themself. (Shuffle.) For each player who did not put a minion into play this way, deal that player 1 facedown encounter card.",
        pnSideScheme: "Setup: The first player must search the encounter deck and discard pile for a scenario-specific side scheme, then reveal it. Place 1 threat on that side scheme. (Shuffle.)",
        pnEncounter: "Setup: Deal 1 facedown encounter card to each player.",

        cdVictoryPoints: "(+X) Victory points in the victory display",
        cdNoMinions: "(+1) No minions in play",
        cdNoSideSchemes: "(+1) No side schemes in play",
        cdNoThreat: "(+1) No threat on the main scheme",
        cdNoAcceleration: "(+1) Fewer than 1 acceleration tokens in play",
        cdNoDefeated: "(+1) No defeated identities",
      },
    },
  });
}(window));

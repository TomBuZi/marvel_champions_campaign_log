/* Marvel Champions — "NeXt Evolution" (MC40) campaign log.

   One printed page, 540 by 540 points, and the most table-shaped of the sheets:
   a player block, three small boxes side by side in one strip, and one grid of
   six rows by five columns underneath. There is no scenario table, no
   "completed", no progress counter and no notes field, because the sheet has
   none. Those absences are the sheet, not an omission. Nor is there a single
   glyph from the publisher's icon font on it — the span sweep over the whole
   page returns nothing, so there is no {pp} marker here, unlike MC27.

   HALF RASTER, WHICH IS WORSE THAN ALL OF IT. get_images() reports one image
   over the whole page plus one over every panel strip. The HATCHING LINES of the
   border are vector and come third in the area measurement at 25.9% — black —
   while the orange GROUND they sit on is raster and appears in no fill at all.
   So the vector numbers look as though the border had been measured, and the
   loudest colour on the sheet is missing from them. The palette in styles.css
   says for each value which of the two it came out of. Same trap as MC32, and no
   coincidence: the publisher printed both sheets from one template, so the
   border art and the yellow badge are literally the same swatches.

   WHAT EACH BOX HOLDS, and every one of them derived from the print plus the
   rulebook, never from memory:

     * "Marauders Defeated" prints three numbered lines, 1. to 3., and nothing
       else — no dividers inside the box. Three is not guessed: scenario #1's
       victory step says to record the title of each villain under Routed, and
       winning that scenario means defeating three of the seven Marauders. Two
       independent readings, one printed and one in the rules. The seven
       villains are a finite printed set, so this is a pool rather than free
       text — and because the lines are NUMBERED, the position is part of the
       entry, which is MC27's shape rather than MC21's named boxes.
     * "Morlocks Saved" prints one empty area: no lines, no numbers, no
       labels. Scenario #1 records "the number of Morlock allies still in play",
       so it is one number. The card set holds four Morlock allies and Mutant
       Massacre hands each player one (two in a solo game), so four is the most
       that can be in play — but the sheet prints no cap and neither does this,
       for the same reason the hit points go to 99: a bound nobody printed is a
       bound that can only be wrong.
     * "Hope Summers's Damage" prints "Scenario 3:" and "Scenario 4:", so two
       numbers and not one. That is the whole rule: scenario #3 and #4 each
       record the damage on her, and #4 and #5 each read the previous
       scenario's figure back out. Scenarios #1, #2 and #5 have no line here
       because they record nothing about her.
     * The "Campaign Player Side Schemes" grid is seven rows by five columns —
       counted at the divider lines of the content stream, not by eye: row tops
       at 275.5, 310.9, 346.3, 381.7, 417.1, 452.5, 487.9, and columns at
       17.1-126.8, 127.3-237.0, 237.4-347.2, 347.6-457.4, 457.8-522.5. One
       header row and six data rows; the last column is the narrow one, so it
       is a checkbox.

   THREE OF THOSE FIVE COLUMNS ARE PRINTED. "Player Side Scheme", "Encounter
   Card" and "Environment" carry a card name in every row; only "Scenario
   Chosen" and "Earned?" are blanks. So a row is identified by its printed side
   scheme, and the two card names beside it are read-only — the encounter card
   is what gets shuffled in for the rest of the campaign whether or not the
   scheme is beaten, and the environment is what the row pays out.

   SIX ROWS, FIVE SCENARIOS. The campaign has five scenarios (Morlock Siege,
   On the Run, Juggernaut, Mister Sinister, Stryfe) and each one's setup picks
   one side scheme "that has not been chosen previously". Six printed rows
   against five picks means exactly one row must stay empty at the end. That is
   the sheet, not a gap in it, and it is why "Scenario Chosen" is a pool of
   five with mutual exclusion rather than a box to tick.

   ONE LOCK, AND IT IS ONE-SIDED. An environment is earned by defeating the
   CHOSEN side scheme, so nothing can be earned in a row that was never picked:
   "Earned?" stays closed while its row carries no scenario. But a box that is
   already ticked stays operable, because normalize() picks no winner for a
   contradiction and the way out therefore has to be on screen — the MC60 and
   MC32 rule. A sheet arriving from an import or a hand-edited file must never
   be frozen solid, and the contradiction gets named instead.

   WHAT IS DELIBERATELY NOT ON SCREEN. The rulebook says a chosen side scheme
   that was not defeated by the time the scenario is won is removed from the
   campaign and cannot be chosen again. That is true of a row with a scenario
   and no tick — but only AFTER that scenario was won, and this sheet records
   no progress at all, so the log cannot tell "not yet" from "for good". Saying
   it would be a claim the sheet cannot support; it is in the help text, where
   a rule belongs, and not as a marker that would be wrong half the time.

   THE EXPERT FIELD, AND HOW THIS SHEET DIFFERS FROM MC32. The remaining hit
   points sit behind the expert switch here as they do everywhere, but this
   sheet does NOT print "(expert)" next to them the way MC32's does. The
   rulebook is unambiguous where the print is silent: "While playing the NeXt
   Evolution campaign at the expert level, each player must record their
   remaining hit points in the campaign log." The German printing says the same
   under BLEIBENDER SCHADEN and leaves the field unmarked as well, so this is
   the edition rather than one edition's slip. The switch is right and the print
   simply omits the marker — worth writing down, or a later reader "fixes" the
   gate away. Hides, not clears: the value stays in the sheet, in
   the JSON export and in a share link. See `expert` below.

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
  /* The three numbered lines under "Marauders Defeated". See the header for the
     two readings that agree on three. */
  var MARAUDER_SLOTS = 3;
  /* The campaign's scenarios, which is what "Scenario Chosen" picks out of. Five
     against six printed rows — the asymmetry is the sheet's. */
  var SCENARIO_COUNT = 5;
  /* Morlocks saved and the damage on Hope. The sheet prints no ceiling for
     either, so this is the same generous bound the hit points use rather than a
     rule read into a blank box. */
  var COUNT_MAX = 99;

  /* ---- CARD SETS -----------------------------------------------------------
     Every card carries an English and a German name, as in MC10, MC21, MC27 and
     MC32. `de: null` shows the English name and tags it lang="en".

     Every name below is checked against C:\Repos\marvelsdb-json-data: the
     `marauders` set (40070-40076) and the `next_evol_campaign` set (40190a/b to
     40195a/b for the six scheme/environment pairs, 40198-40203 for the six
     encounter cards). Its German translation files carry NO entry for any of
     those codes, so not one German name below could come from there. They come
     from the German printing instead — "Spielanleitung_NeXt Evolution_web.pdf",
     whose campaign log is page 24 — read off that page at its coordinates so
     each row's three cards stay paired with the row they are printed in.

     NOTHING HERE IS OPEN WORK, and every remaining `de: null` is a DECISION:
     the name stays English in the German printing. That is the MC10/MC21/MC32
     meaning, not MC27's "not entered yet", and it is checkable rather than
     assumed — see each table. Filling one in anyway migrates nothing, because
     only the slug is ever persisted. */

  /* The seven Marauder villains of the Morlock Siege villain deck, in the
     rulebook's order. Three of them go into the log after scenario #1, and
     scenario #2's setup reads them back out to remove those cards from the
     game.

     `de: null` here is a DECISION, the MC10/MC21/MC32 one: these are all
     characters, and the German edition leaves character names in English while
     translating scenarios and schemes. Not inferred from the convention either
     — the German rulebook prints this villain deck as "Schurkendeck: Arclight
     (A), Blockbuster (A), Chimera (A), Greycrow (A), Harpoon (A), Riptide (A),
     Vertigo (A)", so all seven are confirmed by the printing itself. See
     "Hinweise zu den Namen" in the README. */
  var MARAUDERS = [
    { slug: "arclight",    en: "Arclight",    de: null },
    { slug: "blockbuster", en: "Blockbuster", de: null },
    { slug: "chimera",     en: "Chimera",     de: null },
    { slug: "greycrow",    en: "Greycrow",    de: null },
    { slug: "harpoon",     en: "Harpoon",     de: null },
    { slug: "riptide",     en: "Riptide",     de: null },
    { slug: "vertigo",     en: "Vertigo",     de: null },
  ];

  /* The six campaign player side schemes, in the printed order of the grid,
     each with the two cards its row prints beside it: the encounter card that
     joins the encounter deck for the rest of the campaign, and the environment
     on the scheme's own reverse that the row pays out when it is defeated.

     Both of those are read-only text on the sheet, so they live here rather
     than in the state: nothing about them is ever entered, and a row is
     identified by its scheme slug.

     This is the table where the German printing draws the line for itself, and
     it draws it exactly where the convention says it would: the six scheme
     names, the six environments, `Overburdened` and `Under Pressure` are
     translated, while `Malice`, `Vanisher`, `Scrambler` and `Lady Mastermind`
     keep their English names — the first four are a treachery, a side scheme
     and two things a card DOES, the last four are minions, i.e. characters. So
     the `de: null` left in this table is the same DECISION as the Marauders
     above, and the sheet itself is the evidence for it. */
  var SCHEMES = [
    { slug: "assemble-the-team", en: "Assemble the Team", de: "Team versammeln",
      encounter: { en: "Malice", de: null },
      environment: { en: "Team Assembled", de: "Team versammelt" } },
    { slug: "establish-safehouse", en: "Establish Safehouse", de: "Safehouse einrichten",
      encounter: { en: "Vanisher", de: null },
      environment: { en: "Safehouse Established", de: "Safehouse eingerichtet" } },
    { slug: "gear-up", en: "Gear Up", de: "Ausrüsten",
      encounter: { en: "Overburdened", de: "Überladen" },
      environment: { en: "Geared Up", de: "Ausgerüstet" } },
    { slug: "mission-prep", en: "Mission Prep", de: "Mission vorbereiten",
      encounter: { en: "Scrambler", de: null },
      environment: { en: "Mission Prepped", de: "Mission vorbereitet" } },
    { slug: "practice-maneuvers", en: "Practice Maneuvers", de: "Manöver einüben",
      encounter: { en: "Lady Mastermind", de: null },
      environment: { en: "Practiced Maneuvers", de: "Manöver eingeübt" } },
    { slug: "prepare-defenses", en: "Prepare Defenses", de: "Verteidigung vorbereiten",
      encounter: { en: "Under Pressure", de: "Unter Druck" },
      environment: { en: "Prepared Defenses", de: "Verteidigung vorbereitet" } },
  ];

  // ---- Lookups -------------------------------------------------------------
  function inPool(pool, slug) {
    return !!slug && pool.some(function (e) { return e.slug === slug; });
  }

  /* The name to show, and the language tag that goes with it. An English name
     shown in a German sheet has to be tagged, or a screen reader announces it
     in the wrong voice; a translated one must NOT be tagged. Works on the
     nested encounter/environment objects too, which carry no slug. */
  function entryName(entry, lang) {
    return (lang === "de" && entry.de) ? entry.de : entry.en;
  }
  function entryLang(entry, lang) {
    return (lang === "de" && entry.de) ? null : "en";
  }
  function poolName(pool, slug, lang) {
    var found = null;
    pool.forEach(function (e) { if (e.slug === slug) found = e; });
    return found ? entryName(found, lang) : null;
  }

  // ---- Data ----------------------------------------------------------------
  function emptyState() {
    return {
      /* Standard or expert level. Only the display follows this: switching back
         to standard HIDES the remaining hit points, it does not clear them, so
         a sheet toggled by accident loses nothing. The printed sheet does not
         mark the field "(expert)" — the rulebook does. See the file header. */
      expert: false,
      /* A fresh sheet starts with a single player; more are added as needed. */
      players: [newPlayer()],
      /* Three slots, because the sheet prints three numbered lines and the
         scenario needs three villains beaten. Slots rather than a set: the
         lines are numbered, so where an entry sits is part of it. */
      marauders: emptySlots(),
      /* One number. Blank stays blank: on the paper sheet an empty box means
         "nothing recorded yet", and nought Morlocks saved is a very different
         statement. */
      morlocksSaved: null,
      /* Two numbers, for scenario #3 and scenario #4 — the only two the sheet
         prints a line for. */
      hopeDamage: [null, null],
      /* One row per printed side scheme, in the grid's own order, each holding
         the two things that ARE entered: which scenario picked it, and whether
         its environment was earned. The three card names of the row are printed
         text and live in SCHEMES, never in the state. */
      schemes: emptySchemes(),
    };
  }

  function newPlayer() {
    return { hero: "", hp: null };
  }

  function emptySlots() {
    var out = [];
    for (var i = 0; i < MARAUDER_SLOTS; i++) out.push("");
    return out;
  }

  function emptySchemes() {
    return SCHEMES.map(function () {
      return { scenario: null, earned: false };
    });
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
      });
    }

    out.marauders = pickSlots(raw.marauders, MARAUDERS, MARAUDER_SLOTS);

    out.morlocksSaved = W.clampNumber(
      raw.morlocksSaved === "" ? null : raw.morlocksSaved, 0, COUNT_MAX);

    /* Always both slots, whatever arrived: slot 0 is scenario #3 and slot 1 is
       scenario #4, so the row is never sorted and never shortened. */
    var hope = Array.isArray(raw.hopeDamage) ? raw.hopeDamage : [];
    out.hopeDamage = [
      W.clampNumber(hope[0] === "" ? null : hope[0], 0, COUNT_MAX),
      W.clampNumber(hope[1] === "" ? null : hope[1], 0, COUNT_MAX),
    ];

    /* Rebuilt from SCHEMES every time, so there are always exactly six rows in
       the printed order however few or many arrived. Each field is read BY KEY
       rather than by copying the object, so an invented key is dropped and a
       missing one reads as null or false. */
    var rows = Array.isArray(raw.schemes) ? raw.schemes : [];
    out.schemes = SCHEMES.map(function (entry, at) {
      var row = (rows[at] && typeof rows[at] === "object") ? rows[at] : {};
      return {
        scenario: W.clampNumber(row.scenario === "" ? null : row.scenario,
          1, SCENARIO_COUNT),
        earned: W.coerceBool(row.earned),
      };
    });
    /* "One player side scheme … that has not been chosen previously" — the
       rulebook. At most one row per scenario, first in row order wins, exactly
       as MC32 does with its roles: which of the two was meant is not ours to
       guess, and the alternative is a sheet that cannot legally be played.
       Deliberately does NOT touch `earned`, or the mere order two rows arrived
       in an import would decide whose tick survives — and the row that loses
       its scenario then reads as a contradiction, which paintSchemes() names
       and leaves operable rather than resolving on its own. */
    dropRepeats(out.schemes, "scenario");

    return out;
  }

  /* A fixed row of slots out of a pool: unknown slugs and repeats become empty,
     the row is NEVER sorted, and its length is always `count`. Canonical output
     is what makes normalize() a fixpoint. Same helper MC27 uses for its Osborn
     Tech cells. */
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

  /* Enforce "at most one row holds this", in row order. Null and 0 are not
     values here, so a falsy field is simply skipped. */
  function dropRepeats(rows, key) {
    var seen = {};
    rows.forEach(function (row) {
      if (row[key] == null) return;
      if (seen[row[key]]) row[key] = null;
      else seen[row[key]] = true;
    });
  }

  /* No migrate(): stateVersion is 1, so there is no older shape in the wild
     yet. The first change to the shape above has to bring one with it — see
     the check in test/lint.js. Note especially that anything added beside
     `scenario` and `earned` has to decide what its default MEANS for sheets
     that are already saved. */

  /* Counts a hidden hit point value too: at standard level the field is not on
     screen, but what is written there is still on the sheet, so removing the
     card would still lose it. */
  function playerHasContent(player) {
    return !!player.hero.trim() || player.hp != null;
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

  /* A labelled row inside a player card or a panel. */
  function fieldRow(labelText, control) {
    var row = W.el("div", "player-field");
    var label = W.el("label", "field-label");
    label.textContent = labelText;
    label.appendChild(control);
    row.appendChild(label);
    return row;
  }

  function render(root, ctx) {
    var t = ctx.t, lang = ctx.lang, state = ctx.state;

    root.appendChild(renderPlayers(t, lang, state, ctx));

    /* The three boxes the sheet prints side by side in one strip, in printed
       order. Two of them hold a single number each, so pairing them off would
       cost nothing — but the paper puts all three across, and one of them is
       three dropdowns tall. .scenario-row[data-cols="3"] drops to two and one
       and then to a stack, so a phone never gets three squeezed columns. */
    var strip = W.el("div", "scenario-row", { "data-cols": "3" });
    strip.appendChild(renderMarauders(t, lang, state, ctx));
    strip.appendChild(renderMorlocks(t, state, ctx));
    strip.appendChild(renderHopeDamage(t, state, ctx));
    root.appendChild(strip);

    root.appendChild(renderSideSchemes(t, lang, state, ctx));

    /* Last, once the table is in the document: which scenarios are still free
       and which "Earned?" boxes are open both follow the six rows together, so
       neither can be decided while a single row is being built. Derived, never
       stored. */
    paintSchemes(t, state);
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

      /* Expert only. The printed sheet does not mark this field, but the
         rulebook records it at expert level alone, where it carries over into
         the next scenario's setup. Hidden at standard level, never cleared, so
         it is still in the export and in a share link. */
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

  /* The three numbered lines, as three selects out of the seven printed
     villains. No count is enforced anywhere and none needs to be: three lines
     is three slots, so the sheet's own shape does the work a lock would
     otherwise have to. */
  function renderMarauders(t, lang, state, ctx) {
    var section = panel("marauders", t("secMarauders"));
    var selects = [];

    state.marauders.forEach(function (slug, i) {
      var caption = t("slotRow", String(i + 1));
      var select = W.poolSelect({
        value: slug,
        label: t("secMarauders") + " – " + caption,
        placeholder: t("villainPlaceholder"),
        options: MARAUDERS.map(function (e) {
          return { value: e.slug, label: entryName(e, lang), lang: entryLang(e, lang) };
        }),
        onChange: function (next) {
          state.marauders[i] = next;
          ctx.save();
          /* In place: only which options are greyed out changes, and a select
             change is a commit rather than mid-typing, so there is no caret to
             lose either way — but a re-render would move the focus for
             nothing. */
          W.syncUnique(selects);
        },
      });
      selects.push(select);
      section.appendChild(fieldRow(caption, select));
    });

    /* Last, so every select starts out showing which villains the others hold.
       One villain cannot be defeated twice in the same scenario. */
    W.syncUnique(selects);
    return section;
  }

  /* One number, and the sheet says nothing more about it than its heading -- no
     lines, no numerals, no sub-label. So the field gets no visible caption of
     its own either: the panel heading already is it, and printing it twice
     would say the sheet asks for two things. The name is still on the control
     for anyone who cannot see the heading above it. */
  function renderMorlocks(t, state, ctx) {
    var section = panel("morlocks", t("secMorlocks"));
    var wrap = W.el("div", "player-field");
    wrap.appendChild(W.numberField({
      value: state.morlocksSaved,
      min: 0, max: COUNT_MAX,
      label: t("secMorlocks"),
      onChange: function (next) { state.morlocksSaved = next; ctx.save(); },
    }));
    section.appendChild(wrap);
    return section;
  }

  /* Two numbers under one heading, labelled by the scenario they belong to —
     the sheet prints "Scenario 3:" and "Scenario 4:" and nothing else, so the
     two other scenarios get no field rather than a disabled one. */
  function renderHopeDamage(t, state, ctx) {
    var section = panel("hope-damage", t("secHopeDamage"));
    [3, 4].forEach(function (scenario, i) {
      var caption = t("colScenario", String(scenario));
      section.appendChild(fieldRow(caption, W.numberField({
        value: state.hopeDamage[i],
        min: 0, max: COUNT_MAX,
        label: t("secHopeDamage") + " – " + caption,
        onChange: function (next) { state.hopeDamage[i] = next; ctx.save(); },
      })));
    });
    return section;
  }

  /* The grid, as the sheet prints it: the scheme down the side, then the one
     scenario that picked it, then the two card names the row prints, then the
     box. The two card columns are read-only text — nothing about them is ever
     entered, and leaving them out would lose the pairing that is the whole
     point of the table. */
  function renderSideSchemes(t, lang, state, ctx) {
    var section = panel("side-schemes", t("secSideSchemes"));

    var table = W.el("table", "sheet-table ps-table");
    var caption = W.el("caption", "sr-only");
    caption.textContent = t("secSideSchemes");
    table.appendChild(caption);

    var thead = W.el("thead");
    var hrow = W.el("tr");
    [t("colSideScheme"), t("colChosen"), t("colEncounter"),
      t("colEnvironment"), t("colEarned")].forEach(function (text) {
      var th = W.el("th", null, { scope: "col" });
      th.textContent = text;
      hrow.appendChild(th);
    });
    thead.appendChild(hrow);
    table.appendChild(thead);

    var tbody = W.el("tbody");
    SCHEMES.forEach(function (entry, at) {
      var row = state.schemes[at];
      var name = entryName(entry, lang);
      var tr = W.el("tr", null, { "data-scheme-row": entry.slug });

      var rowHead = W.el("th", "card-name", { scope: "row", lang: entryLang(entry, lang) });
      rowHead.textContent = name;
      tr.appendChild(rowHead);

      var chosenCell = W.el("td", null, { "data-label": t("colChosen") });
      var select = W.poolSelect({
        value: row.scenario == null ? "" : String(row.scenario),
        label: name + " – " + t("colChosen"),
        placeholder: t("scenarioPlaceholder"),
        options: scenarioOptions(t),
        onChange: function (next) {
          row.scenario = W.clampNumber(next, 1, SCENARIO_COUNT);
          ctx.save();
          /* In place: no label and no control appears or disappears, only which
             options are greyed out and which boxes are open. Cross-row effects
             are painted, never re-rendered — the MC27/MC32 rule. */
          paintSchemes(t, state);
        },
      });
      select.setAttribute("data-scheme-scenario", entry.slug);
      chosenCell.appendChild(select);
      tr.appendChild(chosenCell);

      tr.appendChild(printedCell(entry.encounter, lang, t("colEncounter")));
      tr.appendChild(printedCell(entry.environment, lang, t("colEnvironment")));

      var earnedCell = W.el("td", null, { "data-label": t("colEarned") });
      var box = W.checkbox({
        checked: row.earned,
        /* Row and column together, because a bare checkbox in a grid is
           otherwise unnameable. */
        label: name + " – " + t("colEarned"),
        onChange: function (next) {
          row.earned = next;
          ctx.save();
          /* Clearing the tick of a row with no scenario closes that box again,
             so the table has to be repainted from here as well. */
          paintSchemes(t, state);
        },
      });
      box.setAttribute("data-scheme-earned", entry.slug);
      earnedCell.appendChild(box);
      tr.appendChild(earnedCell);

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    section.appendChild(table);

    /* What the table cannot say inside a cell without cramping it: that some
       row contradicts itself. Empty while there is nothing to report, so the
       panel does not jump. */
    section.appendChild(W.el("p", "lock-note"));
    return section;
  }

  /* One read-only card name in its printed column. A <td> rather than a second
     row header: it names nothing, it is what the row pays out. */
  function printedCell(entry, lang, label) {
    var td = W.el("td", "card-name", { "data-label": label, lang: entryLang(entry, lang) });
    td.textContent = entryName(entry, lang);
    return td;
  }

  function scenarioOptions(t) {
    var out = [];
    for (var i = 1; i <= SCENARIO_COUNT; i++) {
      /* Numbers only. The sheet's column is a blank to write in and prints no
         scenario titles, so naming them here would put words on the paper that
         are not on it. */
      out.push({ value: String(i), label: t("colScenario", String(i)) });
    }
    return out;
  }

  /* Everything about this table that follows the six rows TOGETHER, derived
     every time and nothing stored:

       * a scenario already spent in one row is greyed out in the others,
         because each scenario picks one scheme and each scheme is picked once;
       * "Earned?" is closed while its row carries no scenario, because an
         environment is earned by defeating the CHOSEN scheme and an unchosen
         one was never in play;
       * that lock is ONE-SIDED. A box that is already ticked stays operable:
         normalize() picks no winner when a row loses its scenario to a repeat,
         so the way out of the contradiction has to be on screen, and a sheet
         arriving from an import must never be frozen solid. The note below the
         table names the contradiction instead of resolving it.

     What it deliberately does NOT do is mark a row that has a scenario and no
     tick. By the rulebook that scheme is out of the campaign — but only once
     that scenario has been won, and this sheet records no progress at all, so
     the log cannot tell "not yet" from "for good". That belongs in the help
     text, not in a marker that would be wrong half the time. */
  function paintSchemes(t, state) {
    var selects = [];
    var conflicts = 0;

    SCHEMES.forEach(function (entry, at) {
      var row = state.schemes[at];
      var select = document.querySelector('[data-scheme-scenario="' + entry.slug + '"]');
      var box = document.querySelector('[data-scheme-earned="' + entry.slug + '"]');
      if (select) selects.push(select);
      if (!box) return;
      var locked = row.scenario == null && !row.earned;
      box.disabled = locked;
      box.title = locked ? t("earnedNeedsScenario") : (box.getAttribute("aria-label") || "");
      if (row.scenario == null && row.earned) conflicts++;
    });

    W.syncUnique(selects);

    var note = document.querySelector('[data-section="side-schemes"] > .lock-note');
    if (note) note.textContent = conflicts ? t("earnedConflict") : "";
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

    /* All three slots, empty ones included: the sheet keeps the numbered line
       visible whether or not a villain is written on it, and an empty slot says
       that scenario #1 is not finished — MC27's rule for an empty cell. */
    var mar = printSection(root, t("secMarauders"));
    state.marauders.forEach(function (slug, i) {
      printLine(mar, t("slotRow", String(i + 1)) + " " +
        (poolName(MARAUDERS, slug, lang) || "—"));
    });

    var mor = printSection(root, t("secMorlocks"));
    printLine(mor, state.morlocksSaved == null ? "—" : String(state.morlocksSaved));

    var hope = printSection(root, t("secHopeDamage"));
    [3, 4].forEach(function (scenario, i) {
      printLine(hope, t("colScenario", String(scenario)) + ": " +
        (state.hopeDamage[i] == null ? "—" : String(state.hopeDamage[i])));
    });

    /* Every printed row, on one line with its box — including the one row that
       must stay empty, because six rows against five scenarios means an empty
       row is the normal outcome and not a gap. Whether a box is currently
       closed is not printed: the printout is a record of what was written
       down, not of what the screen would allow. */
    var ss = printSection(root, t("secSideSchemes"));
    SCHEMES.forEach(function (entry, at) {
      var row = state.schemes[at];
      printLine(ss, (row.earned ? "[x] " : "[ ] ") + entryName(entry, lang) +
        " · " + (row.scenario == null ? "—" : t("colScenario", String(row.scenario))) +
        " · " + entryName(entry.encounter, lang) +
        " · " + entryName(entry.environment, lang));
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
    id: "next-evolution",
    code: "MC40",
    titleEn: "NeXt Evolution",
    /* The German edition keeps the English campaign title, as this project
       does throughout. */
    titleDe: "NeXt Evolution",
    theme: "ne",
    stateVersion: 1,

    emptyState: emptyState,
    normalize: normalize,
    render: render,
    renderPrint: renderPrint,

    helpDe: "Der MC40-Bogen ist der tabellenlastigste von allen: über dem Spielerbereich stehen drei kleine Kästen nebeneinander, darunter ein Gitter aus sechs Zeilen und fünf Spalten. „Besiegte Marauders“ druckt genau drei numerierte Zeilen, und drei ist nicht geraten — der Sieg-Schritt von Szenario 1 verlangt den Namen jedes Schurken unter der Karte „Besiegt“, und dieses Szenario ist gewonnen, wenn drei der sieben Marauder besiegt sind. Deshalb stehen dort drei Auswahlfelder über dem gedruckten Satz der sieben Schurken, und weil die Zeilen numeriert sind, ist die Position Teil der Eintragung. Ein Schurke, der schon in einer Zeile steht, ist in den anderen abgeblendet: zweimal derselbe wäre kein Eintrag, sondern ein Tippfehler. „Gerettete Morlocks“ ist eine Zahl — der Bogen druckt dort eine leere Fläche ohne Zeilen und ohne Zahlen, und der Sieg-Schritt sagt „die Anzahl der Morlock-Verbündeten, die noch im Spiel sind“. Eine Obergrenze steht hier bewusst nicht: der Kartensatz enthält vier Morlocks und „Mutanten-Massaker“ gibt jedem Spieler einen (im Solospiel zwei), aber gedruckt ist keine Grenze, und eine Grenze, die niemand gedruckt hat, kann nur falsch sein. „Schaden auf Hope Summers“ hat zwei Felder, weil der Bogen zwei Zeilen druckt: Szenario 3 und Szenario 4. Die anderen drei Szenarien halten über sie nichts fest, deshalb steht dort kein Feld — und kein abgeblendetes. Das Gitter darunter hat fünf Spalten, von denen drei gedruckt sind: der Nebenplan selbst, die Begegnungskarte, die für den Rest der Kampagne ins Begegnungsdeck kommt, und die Umgebung, die die Zeile auszahlt. Diese drei sind unveränderlicher Text; eingetragen werden nur „Szenarionummer“ und „Verdient?“ — und die Spalte heißt im deutschen Druck wirklich so, sie fragt nach der Nummer, während der englische Bogen nach der Wahl fragt. Sechs gedruckte Zeilen stehen fünf Szenarien gegenüber, denn jedes Szenario wählt einen Nebenplan, „der noch nicht gewählt wurde“ — eine Zeile bleibt am Ende zwangsläufig leer, und das ist der Bogen und keine Lücke darin. Ein Szenario, das in einer Zeile steht, ist deshalb in den übrigen abgeblendet. Das Häkchen „Verdient?“ ist zu, solange die Zeile kein Szenario trägt: verdient wird eine Umgebung, indem der GEWÄHLTE Nebenplan besiegt wird, und ein nie gewählter war nie im Spiel. Diese Sperre ist einseitig, wie bei MC60 und MC32 — ein bereits gesetztes Häkchen bleibt bedienbar. Das ist wichtiger, als es klingt: verliert eine Zeile ihr Szenario, weil zwei Zeilen dasselbe trugen, kürt der Bogen keinen Sieger, und der Ausweg muss auf dem Bildschirm liegen. Der Widerspruch wird stattdessen unter der Tabelle benannt. Nicht markiert wird dagegen eine Zeile mit Szenario ohne Häkchen. Nach dem Regelheft ist dieser Nebenplan aus der Kampagne heraus — aber erst, nachdem das Szenario gewonnen ist, und dieser Bogen hält überhaupt keinen Fortschritt fest. Er kann „noch nicht“ und „endgültig“ nicht auseinanderhalten, also behauptet er es auch nicht. Oben im Spielerbereich steht der Haken „Expertenmodus“, und hier weicht MC40 von MC32 ab: der gedruckte Bogen kennzeichnet die verbleibenden Lebenspunkte NICHT als Expertenfeld, das Regelheft aber schon. Unter „Bleibender Schaden“ steht dort: „Während einer Experten-Kampagne von NeXt Evolution muss jeder Spieler seine verbleibenden Lebenspunkte im Kampagnenlogbuch notieren, nachdem ihr ein Szenario gewonnen habt.“ Nur dort stellt das Setup des nächsten Szenarios sie auch wieder ein. Auf Standardstufe blendet der Bogen das Feld aus, statt danach zu fragen. Ausblenden heißt nicht löschen — der Wert bleibt im Bogen, im Export und im Share-Link. Es gibt hier bewusst keine Szenario-Tabelle, kein „Abgeschlossen“, keinen Fortschrittszähler und kein Notizfeld: der gedruckte Bogen hat sie nicht. Die Abschnittsnamen, die Spaltentitel und die Kartennamen stehen hier so, wie die deutsche Spielanleitung sie auf Seite 24 druckt. Englisch bleiben nur die Figuren — die sieben Marauder und die vier Schergen Malice, Vanisher, Scrambler und Lady Mastermind —, wie es die deutsche Ausgabe durchweg hält.",
    helpEn: "The MC40 sheet is the most table-shaped of them all: three small boxes sit side by side above the player area, and a grid of six rows by five columns below it. “Marauders Defeated” prints exactly three numbered lines, and three is not a guess — scenario 1's victory step asks for the title of each villain under “Routed”, and that scenario is won by defeating three of the seven Marauders. So there are three dropdowns over the printed set of seven villains, and because the lines are numbered, the position is part of the entry. A villain already standing in one line is greyed out in the others: the same one twice is not a record but a typo. “Morlocks Saved” is one number — the sheet prints an empty area there with no lines and no numerals, and the victory step says “the number of Morlock allies still in play”. There is deliberately no ceiling on it: the card set holds four Morlocks and “Mutant Massacre” hands each player one (two in a solo game), but no bound is printed, and a bound nobody printed can only be wrong. “Hope Summers's Damage” has two fields because the sheet prints two lines: scenario 3 and scenario 4. The other three scenarios record nothing about her, so there is no field for them — not a disabled one either. The grid below has five columns, three of which are printed: the side scheme itself, the encounter card that joins the encounter deck for the rest of the campaign, and the environment the row pays out. Those three are fixed text; only “Scenario Chosen” and “Earned?” are entered. Six printed rows stand against five scenarios, because each scenario picks a side scheme “that has not been chosen previously” — one row must stay empty at the end, and that is the sheet rather than a gap in it. A scenario standing in one row is therefore greyed out in the rest. The “Earned?” box is closed while its row carries no scenario: an environment is earned by defeating the CHOSEN side scheme, and one that was never chosen was never in play. That lock is one-sided, as in MC60 and MC32 — a box that is already ticked stays operable. That matters more than it sounds: when a row loses its scenario because two rows carried the same one, the sheet picks no winner, and the way out has to be on screen. The contradiction is named under the table instead. What is not marked is a row with a scenario and no tick. By the rulebook that side scheme is out of the campaign — but only once the scenario has been won, and this sheet records no progress whatsoever. It cannot tell “not yet” from “for good”, so it does not claim to. At the top of the player area sits the “Expert level” box, and here MC40 departs from MC32: the printed sheet does NOT mark the remaining hit points “(expert)”, while the rulebook does — they are recorded at expert level only, and only there does the next scenario's setup read them back in. At standard level the sheet hides the field rather than asking for it. Hiding is not clearing — the value stays in the sheet, in the export and in a share link. There is deliberately no scenario table, no “completed”, no progress counter and no notes field: the printed sheet has none.",

    /* Zwei Gruppen, und die Unterscheidung sagt, wer eine Änderung entscheidet:

       1. Wörter, die diese App selbst wählt — Spaltentitel, Platzhalter,
          Hinweise und das gemeinsame Vokabular aller Kampagnen („Verbleibende
          Lebenspunkte“, „Spieler-Informationen“, „Szenario %s“) — sind wörtlich
          aus den Nachbarmodulen übernommen und gehören dorthin abgeglichen,
          nicht hier neu formuliert. Sie stehen sofort auf Deutsch.
       2. Wörter, die vom gedruckten Bogen kommen — die Abschnittsnamen und die
          Spaltentitel des Gitters — stehen wörtlich so da, wie der deutsche
          Druck sie setzt: Seite 24 von "Spielanleitung_NeXt Evolution_web.pdf".
          Wer eine davon ändert, ändert eine Aussage über das Papier und braucht
          das Papier dazu. Insbesondere heißt die Spalte dort
          „Szenarionummer“ und nicht „gewähltes Szenario“ — der deutsche Bogen
          fragt nach der Nummer, der englische nach der Wahl.

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
        /* "%s" = Szenarionummer. */
        colScenario: "Szenario %s",
        /* "%s" = die gedruckte Zeilennummer 1 bis 3. */
        slotRow: "%s.",
        identityPlaceholder: "Held …",
        villainPlaceholder: "— Schurke wählen —",
        scenarioPlaceholder: "— Szenario wählen —",
        lblExpert: "Expertenmodus",
        expertHint: "Nur auf Expertenstufe werden verbleibende Lebenspunkte festgehalten. Ausschalten blendet sie aus, löscht sie aber nicht.",
        addPlayer: "+ Spieler",
        addPlayerFull: "Mehr als vier Spieler kennt das Spiel nicht.",
        removePlayer: "Spieler entfernen",
        removePlayerLast: "Der letzte Spieler kann nicht entfernt werden.",
        confirmRemovePlayer: "Diesen Spieler samt Eintragungen entfernen?",
        duplicateHero: "Dieser Held ist schon einem anderen Spieler zugeordnet.",

        earnedNeedsScenario: "In dieser Zeile ist kein Szenario gewählt. Verdient wird eine Umgebung nur, indem der gewählte Nebenplan besiegt wird.",
        earnedConflict: "Widerspruch: eine Zeile trägt eine verdiente Umgebung, ohne dass ein Szenario gewählt ist.",

        /* ---- Wörtlich vom gedruckten Bogen, Seite 24 ---------------------- */
        secMarauders: "Besiegte Marauders",
        secMorlocks: "Gerettete Morlocks",
        secHopeDamage: "Schaden auf Hope Summers",
        secSideSchemes: "Spieler-Nebenpläne der Kampagne",
        colSideScheme: "Spieler-Nebenplan",
        colChosen: "Szenarionummer",
        colEncounter: "Begegnungskarte",
        colEnvironment: "Umgebung",
        colEarned: "Verdient?",
      },
      en: {
        secPlayers: "Player Information",

        playerRow: "Player #%s",
        colIdentity: "Identity",
        colHp: "Remaining hit points",
        colScenario: "Scenario %s",
        slotRow: "%s.",
        identityPlaceholder: "Hero …",
        villainPlaceholder: "— Choose a villain —",
        scenarioPlaceholder: "— Choose a scenario —",
        lblExpert: "Expert level",
        expertHint: "The remaining hit points are only recorded at expert level. Switching off hides them, it does not clear them.",
        addPlayer: "+ Player",
        addPlayerFull: "The game does not go beyond four players.",
        removePlayer: "Remove player",
        removePlayerLast: "The last player cannot be removed.",
        confirmRemovePlayer: "Remove this player along with what is filled in?",
        duplicateHero: "This hero is already assigned to another player.",

        earnedNeedsScenario: "No scenario is chosen in this row. An environment is only earned by defeating the chosen side scheme.",
        earnedConflict: "Contradiction: a row records an earned environment with no scenario chosen.",

        secMarauders: "Marauders Defeated",
        secMorlocks: "Morlocks Saved",
        secHopeDamage: "Hope Summers's Damage",
        secSideSchemes: "Campaign Player Side Schemes",
        colSideScheme: "Player Side Scheme",
        colChosen: "Scenario Chosen",
        colEncounter: "Encounter Card",
        colEnvironment: "Environment",
        colEarned: "Earned?",
      },
    },
  });
}(window));

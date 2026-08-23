/* Marvel Champions — "The Mad Titan's Shadow" (MC21) campaign log.

   The leanest of the three sheets. It has a player block and nothing else but
   checkboxes: nine of them, spread over four scenario sections. No scenario
   table, no progress counter, no card pools to hand out, no free text — the
   campaign carries almost nothing forward except which cards joined the
   campaign pool, and that is a yes or no each time.

   The fifth scenario is missing on purpose. MC21 is played in a fixed order
   (Ebony Maw, Tower Defense, Thanos, Hela, Loki) and the printed log stops at
   the fourth, because the finale against Loki has nothing to record. That is
   the sheet, not an omission — `scenarioCount` below still says five, since
   that number describes the campaign and not this page.

   Seven of the nine boxes say the same sentence on paper — "Check here if X was
   added to campaign pool" — so they are drawn the way MC10 draws a card set:
   one caption over a row of named boxes. The checkbox itself is the "check
   here". The two that say something else keep their own wording.

   The campaign is played at standard or expert level, and the remaining hit
   points are what the level decides: they carry between scenarios only at
   expert level, so a standard game hides that field rather than asking for it.
   Hides, not clears — see `expert` below.

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

  /* ---- THE NINE BOXES -------------------------------------------------------
     Grouped the way the sheet groups them, in play order. Everything that
     renders or prints them reads this one table, so screen and printout cannot
     drift apart, and adding a box is a single line.

     `pool` holds the cards that joined the campaign pool — the repeated
     sentence, drawn as one caption over named boxes. `extra` holds the boxes
     that say something else and therefore carry their own label.

     `key` is the state field and is persisted; every label is an i18n key and
     is not, so rewording one migrates nothing.

     Card names carry an English and a German name, as in MC10, and the English
     one is shown while `de` is null. Cosmo, Shawarma, Black Swan and Odin keep
     their English names in the German edition, the way the MC10 allies do, so
     their `de` stays null on purpose — a decision, not a translation still to be
     done. Filling one in migrates nothing, because only the key is stored. */
  var SCENARIOS = [
    {
      id: "scenario-1", head: "secScenario1",
      pool: [
        { key: "cosmo",          en: "Cosmo",           de: null },
        { key: "securityBreach", en: "Security Breach", de: "Sicherheitslücke" },
      ],
      extra: [],
    },
    {
      id: "scenario-2", head: "secScenario2",
      pool: [
        { key: "shawarma",  en: "Shawarma",   de: null },
        { key: "blackSwan", en: "Black Swan", de: null },
      ],
      /* Not a card joining the pool: the tower keeps a trait for the rest of
         the campaign. */
      extra: [{ key: "towerDamaged", label: "flagTowerDamaged" }],
    },
    {
      id: "scenario-3", head: "secScenario3",
      pool: [
        { key: "systemShock", en: "System Shock", de: "Systemschock" },
      ],
      /* A side scheme that was completed, not a card that was added. */
      extra: [{ key: "infinityStones1B", label: "flagInfinityStones" }],
    },
    {
      id: "scenario-4", head: "secScenario4",
      pool: [
        { key: "nornStone", en: "Norn Stone", de: "Nornstein" },
        { key: "odin",      en: "Odin",       de: null },
      ],
      extra: [],
    },
  ];

  /* Every flag key in sheet order, derived so it can never fall out of step
     with the table above. normalize() walks this, which is what keeps a
     forgotten box from silently dropping out of a saved sheet. */
  var FLAG_KEYS = [];
  SCENARIOS.forEach(function (sc) {
    sc.pool.forEach(function (c) { FLAG_KEYS.push(c.key); });
    sc.extra.forEach(function (f) { FLAG_KEYS.push(f.key); });
  });

  /* The name to show. Falls back to English while `de` is null, so a card
     without a German name yet is readable rather than blank. */
  function entryName(entry, lang) {
    return (lang === "de" && entry.de) ? entry.de : entry.en;
  }
  /* "en" only while the English name is what is actually on screen: tagging a
     German name as English would mislead hyphenation and screen readers. The
     other two modules do the same. */
  function entryLang(entry, lang) {
    return (lang === "de" && entry.de) ? null : "en";
  }

  /* "Player #1" on its own, or "Player #1 – Gamora" once there is a name to
     say. Used wherever a control has to say whose it is. */
  function playerLabel(t, player, i) {
    var caption = t("playerRow", String(i + 1));
    var hero = String(player.hero || "").trim();
    return hero ? caption + " – " + hero : caption;
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
      flags: emptyFlags(),
    };
  }

  function newPlayer() {
    return { hero: "", hp: null };
  }

  function emptyFlags() {
    var out = {};
    FLAG_KEYS.forEach(function (key) { out[key] = false; });
    return out;
  }

  /* Never throws. Starts from emptyState() and overlays only what it
     recognises, so a hand-edited file, a foreign export or a truncated share
     link cannot produce an invalid sheet. Fields this sheet does not have —
     MC60's `scenarios`, MC10's card pools — are simply never read, which is how
     they get dropped. */
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

    /* Read by key, not by copying the object: an unknown key in the input is
       dropped and a missing one reads as false. Canonical output in the table's
       own order is what makes normalize() a fixpoint. */
    var flags = (raw.flags && typeof raw.flags === "object") ? raw.flags : {};
    FLAG_KEYS.forEach(function (key) {
      out.flags[key] = W.coerceBool(flags[key]);
    });

    return out;
  }

  /* No migrate(): stateVersion is 1, so there is no older shape in the wild
     yet. The first change to the shape above has to bring one with it — see
     the check in test/lint.js. */

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

  /* A labelled row inside a player card. */
  function fieldRow(labelText, control) {
    var row = W.el("div", "player-field");
    var label = W.el("label", "field-label");
    label.textContent = labelText;
    label.appendChild(control);
    row.appendChild(label);
    return row;
  }

  /* One box with its own wording. */
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

  /* A caption over a row of named boxes — the shape the repeated "added to
     campaign pool" sentence takes here. */
  function checkRow(labelText, cards, lang, cfg) {
    var wrap = W.el("div", "player-field");
    var caption = W.el("p", "field-label");
    caption.textContent = labelText;
    wrap.appendChild(caption);

    var row = W.el("div", "flag-row");
    cards.forEach(function (card) {
      row.appendChild(flagBox(entryName(card, lang), {
        lang: entryLang(card, lang),
        checked: cfg.isOn(card),
        label: labelText + " – " + entryName(card, lang),
        onChange: function (next) { cfg.onChange(card, next); },
      }));
    });
    wrap.appendChild(row);
    return wrap;
  }

  function render(root, ctx) {
    var t = ctx.t, lang = ctx.lang, state = ctx.state;

    root.appendChild(renderPlayers(t, lang, state, ctx));

    /* Two rows of two: .scenario-row is a two-column grid on a wide screen and
       one column on a narrow one, which is as close as a screen gets to the
       sheet's four columns while staying readable. The DOM order is the sheet's
       order, so reading order and printout follow the paper. */
    for (var i = 0; i < SCENARIOS.length; i += 2) {
      var row = W.el("div", "scenario-row");
      row.appendChild(renderScenario(t, lang, state, ctx, SCENARIOS[i]));
      if (SCENARIOS[i + 1]) {
        row.appendChild(renderScenario(t, lang, state, ctx, SCENARIOS[i + 1]));
      }
      root.appendChild(row);
    }
  }

  function renderScenario(t, lang, state, ctx, sc) {
    var section = panel(sc.id, t(sc.head));

    if (sc.pool.length) {
      section.appendChild(checkRow(t("lblAddedToPool"), sc.pool, lang, {
        isOn: function (card) { return state.flags[card.key]; },
        onChange: function (card, on) {
          state.flags[card.key] = on;
          ctx.save();
        },
      }));
    }

    sc.extra.forEach(function (f) {
      var wrap = W.el("div", "player-field");
      var row = W.el("div", "flag-row");
      row.appendChild(flagBox(t(f.label), {
        checked: state.flags[f.key],
        onChange: function (next) {
          state.flags[f.key] = next;
          ctx.save();
        },
      }));
      wrap.appendChild(row);
      section.appendChild(wrap);
    });

    return section;
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

      /* Expert only: the remaining hit points carry over into the next
         scenario, which is a rule the standard campaign does not have. */
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
    });

    /* Every box on its own line, set or not: which cards did NOT join the
       campaign pool matters as much as which did, because a later scenario
       asks about exactly these. */
    SCENARIOS.forEach(function (sc) {
      var section = printSection(root, t(sc.head));
      if (sc.pool.length) {
        printLine(section, t("lblAddedToPool") + ":");
        sc.pool.forEach(function (card) {
          printLine(section, (state.flags[card.key] ? "[x] " : "[ ] ") +
            entryName(card, lang));
        });
      }
      sc.extra.forEach(function (f) {
        printLine(section, (state.flags[f.key] ? "[x] " : "[ ] ") + t(f.label));
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
    id: "mad-titans-shadow",
    code: "MC21",
    titleEn: "The Mad Titan's Shadow",
    /* The German edition keeps the English campaign title, as this project
       does throughout. */
    titleDe: "The Mad Titan's Shadow",
    theme: "tmts",
    stateVersion: 1,
    /* Ebony Maw, Tower Defense, Thanos, Hela, Loki — played in that fixed
       order. The printed log stops at the fourth because the finale has
       nothing to record; the campaign still has five. */
    scenarioCount: 5,

    emptyState: emptyState,
    normalize: normalize,
    render: render,
    renderPrint: renderPrint,

    helpDe: "Der MC21-Bogen ist der schlankeste der drei und folgt dem gedruckten Original: oben die Spieler, darunter neun Kästchen, verteilt auf vier Szenario-Abschnitte. Mehr hält die Kampagne nicht fest — es gibt hier bewusst keine Szenario-Tabelle, kein „Abgeschlossen“, keinen Fortschrittszähler und keinen Würfel. Oben im Spielerbereich steht der Haken „Expertenmodus“: die verbleibenden Lebenspunkte gehen nur auf Expertenstufe von einem Szenario ins nächste mit, und auf Standardstufe blendet der Bogen das Feld aus, statt danach zu fragen. Ausblenden heißt nicht löschen — wer versehentlich umschaltet, verliert nichts. Sieben der neun Kästchen sagen auf Papier denselben Satz („Check here if … was added to campaign pool“), deshalb stehen sie hier als eine Überschrift über benannten Kästchen: das Häkchen selbst ist das „check here“. Die zwei übrigen sagen etwas anderes und behalten ihren eigenen Wortlaut — dass der Avengers Tower das Merkmal „Damaged“ trägt, und dass „The Infinity Stones 1B“ abgeschlossen wurde. Das fünfte Szenario gegen Loki fehlt nicht, es steht auch auf dem gedruckten Bogen nicht: im Finale gibt es nichts festzuhalten. In der Bogen-Auswahl sind trotzdem fünf Szenarien genannt, weil diese Zahl die Kampagne beschreibt und nicht diese Seite.",
    helpEn: "The MC21 sheet is the leanest of the three and follows the printed original: players at the top, and below them nine checkboxes spread over four scenario sections. The campaign records nothing else — there is deliberately no scenario table, no “completed”, no progress counter and no die. At the top of the player area sits the “Expert level” box: the remaining hit points carry from one scenario to the next only at expert level, and at standard level the sheet hides that field rather than asking for it. Hiding is not clearing — switching by accident loses nothing. Seven of the nine boxes say the same sentence on paper (“Check here if … was added to campaign pool”), so here they are one caption over named boxes: the checkbox itself is the “check here”. The remaining two say something else and keep their own wording — that Avengers Tower carries the Damaged trait, and that “The Infinity Stones 1B” was completed. The fifth scenario against Loki is not missing; it is not on the printed sheet either, because the finale has nothing to record. The log picker still names five scenarios, because that number describes the campaign and not this page.",

    /* Deutsche Feldnamen: gegen die deutsche Ausgabe abgeglichen. Ändert sich
       eine, migriert nichts — persistiert werden nur Feldschlüssel, nie
       Beschriftungen. Die Kartennamen stehen oben in SCENARIOS. */
    i18n: {
      de: {
        secPlayers: "Spieler-Informationen",
        secScenario1: "Szenario 1: Ebony Maw",
        secScenario2: "Szenario 2: Tower Defense",
        secScenario3: "Szenario 3: Thanos",
        secScenario4: "Szenario 4: Hela",

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

        lblAddedToPool: "Dem Kampagnenvorrat hinzugefügt",
        flagTowerDamaged: "Avengers Tower hat das Merkmal „Beschädigt“",
        flagInfinityStones: "„Die Infinitysteine 1B“ vollendet",
      },
      en: {
        secPlayers: "Player Information",
        secScenario1: "Scenario 1: Ebony Maw",
        secScenario2: "Scenario 2: Tower Defense",
        secScenario3: "Scenario 3: Thanos",
        secScenario4: "Scenario 4: Hela",

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

        lblAddedToPool: "Added to campaign pool",
        flagTowerDamaged: "Avengers Tower has the „Damaged“ trait",
        flagInfinityStones: "„The Infinity Stones 1B“ was completed",
      },
    },
  });
}(window));

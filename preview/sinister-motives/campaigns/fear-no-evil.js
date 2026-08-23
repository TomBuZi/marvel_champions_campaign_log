/* Marvel Champions — "Fear No Evil" (MC60) campaign log.

   Mirrors the official MC60 campaign log sheet field for field: four player
   slots, five scenarios paired with five villains, the list of removed allies
   and persona supports, and the two campaign flags at the bottom.

   The expansion has six scenarios; the sixth (the Kingpin finale) has no row on
   the sheet, so it has none here either.

   The campaign is played at standard or expert level, and the remaining hit
   points are only carried between scenarios at expert level. A standard game
   therefore hides that field rather than asking for it. Hides, not clears —
   see `expert` below. (The MC10 module does the same, with obligations on top
   of the hit points; the switch sits in the same place in both.)

   emptyState(), normalize() and migrate() must not touch the DOM — not at load
   time and not when called. CI exercises them headlessly to prove that
   normalize() is idempotent and that a fresh state round-trips unchanged.

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
  /* Progress runs 0..3. Each round two scenarios that are neither completed nor
     failed are drawn, and both take one progress point; the third point means
     the scenario has failed. So "1", "2" and "Failed" on the sheet are three
     states of one counter, not three independent boxes — which is why `failed`
     is derived from `progress`, never stored. */
  var PROGRESS_MAX = 3;

  /* "Completed" and "Failed" are mutually exclusive outcomes, so each locks the
     other out: ticking Completed freezes the progress boxes (the marks stay, but
     they can no longer be operated), and a scenario on the third progress point
     is failed, which locks the Completed box.

     The lock is deliberately one-sided per row: it applies only while the row
     is consistent. A log that arrives from an import or a hand-edited file with
     BOTH set would otherwise be frozen solid with no way out, so in that case
     both controls stay live until one of them is cleared. normalize() does not
     silently pick a winner either — which of the two the player meant is not
     ours to guess. */
  function completedLocked(row) {
    return row.progress >= PROGRESS_MAX && !row.completed;
  }
  function progressLocked(row) {
    return row.completed && row.progress < PROGRESS_MAX;
  }

  /* Scenario names. The German ones are provisional: there is no official
     German MC60 edition yet, so correct one line each once there is. Nothing
     migrates when they change, because only the slug is ever persisted. */
  var SCENARIOS = [
    { slug: "art-museum-heist",  en: "Art Museum Heist",  de: "Raub im Kunstmuseum" },
    { slug: "the-getaway",       en: "The Getaway",       de: "Die Flucht" },
    { slug: "protection-racket", en: "Protection Racket", de: "Schutzgelderpressung" },
    { slug: "the-raft-breakout", en: "The Raft Breakout", de: "Ausbruch aus dem Raft" },
    { slug: "stop-the-presses",  en: "Stop the Presses!", de: "Stoppt die Druckpressen!" },
  ];

  /* Villain names stay English in both languages. That is the convention of the
     German edition — in marvelsdb-json-data/translations/de the villains keep
     their names (Rhino, Klaw, Ultron) while only scenario and main scheme names
     are translated ("Der Einbruch!", "Überfall auf NORAD"). */
  var VILLAINS = [
    { slug: "bullseye",     name: "Bullseye" },
    { slug: "electro",      name: "Electro" },
    { slug: "hammerhead",   name: "Hammerhead" },
    { slug: "purple-man",   name: "Purple Man" },
    { slug: "typhoid-mary", name: "Typhoid Mary" },
  ];

  function scenarioName(entry, lang) {
    return (lang === "de" && entry.de) ? entry.de : entry.en;
  }
  /* "en" only while the English name is what is actually on screen: tagging a
     German name as English would mislead hyphenation and screen readers. */
  function scenarioLang(entry, lang) {
    return (lang === "de" && entry.de) ? null : "en";
  }
  /* Scenarios still in play: neither completed nor failed. These are the ones a
     round draws from. */
  function openScenarios(state) {
    return state.scenarios.filter(function (row) {
      return !row.completed && row.progress < PROGRESS_MAX;
    });
  }

  /* Advance one round. Two of the scenarios still in play each take a progress
     point; if only one is left in play it takes both, since the round happens
     either way. Returns the rows that were advanced, so the caller can say
     which ones they were. */
  function advanceRound(state) {
    var open = openScenarios(state);
    if (!open.length) return [];
    if (open.length === 1) {
      var only = open[0];
      only.progress = Math.min(PROGRESS_MAX, only.progress + 2);
      return [only];
    }
    /* Two drawn at random out of everything still in play — which is what the
       campaign asks for, not the first two on the sheet. */
    var pool = open.slice();
    var drawn = [];
    for (var i = 0; i < 2; i++) {
      var pick = W.pickRandom(pool);
      pool.splice(pool.indexOf(pick), 1);
      pick.progress = Math.min(PROGRESS_MAX, pick.progress + 1);
      drawn.push(pick);
    }
    return drawn;
  }

  /* The villains not yet given to any scenario. Each is used exactly once, so
     this is what the randomiser draws from. */
  function unusedVillains(state) {
    var taken = {};
    state.scenarios.forEach(function (row) {
      if (row.villain) taken[row.villain] = true;
    });
    return VILLAINS.filter(function (v) { return !taken[v.slug]; });
  }
  function villainBySlug(slug) {
    for (var i = 0; i < VILLAINS.length; i++) if (VILLAINS[i].slug === slug) return VILLAINS[i];
    return null;
  }

  // ---- Data ----------------------------------------------------------------
  function emptyState() {
    return {
      /* Standard or expert level. Only the display follows this: switching back
         to standard HIDES the remaining hit points, it does not clear them, so
         a sheet toggled by accident loses nothing. */
      expert: false,
      /* A fresh sheet starts with a single player; more are added as needed. */
      players: [{ hero: "", hp: null }],
      scenarios: SCENARIOS.map(function (s) {
        return { slug: s.slug, completed: false, villain: "", progress: 0 };
      }),
      removed: [],
      flags: { trustEstablished: false, maryDefeated: false },
    };
  }

  /* Never throws. Starts from emptyState() and overlays only what it
     recognises, so a hand-edited file, a foreign export or a truncated share
     link cannot produce an invalid sheet. */
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

    /* Scenarios are matched by slug, not by index: that survives a reordering
       of SCENARIOS, drops rows we no longer know and fills in ones we gained. */
    var bySlug = {};
    (Array.isArray(raw.scenarios) ? raw.scenarios : []).forEach(function (s) {
      if (s && typeof s === "object" && typeof s.slug === "string") bySlug[s.slug] = s;
    });
    out.scenarios.forEach(function (row) {
      var src = bySlug[row.slug];
      if (!src) return;
      row.completed = W.coerceBool(src.completed);
      row.progress = W.clampNumber(src.progress, 0, PROGRESS_MAX) || 0;
      row.villain = villainBySlug(src.villain) ? src.villain : "";
    });
    /* Each villain is used in exactly one scenario. First occurrence in row
       order wins; later duplicates are cleared, so the 5x5 assignment stays
       legal no matter where the data came from. */
    var seen = {};
    out.scenarios.forEach(function (row) {
      if (!row.villain) return;
      if (seen[row.villain]) row.villain = "";
      else seen[row.villain] = true;
    });

    out.removed = W.coerceStringList(raw.removed, { split: true, trim: true });

    var flags = (raw.flags && typeof raw.flags === "object") ? raw.flags : {};
    out.flags.trustEstablished = W.coerceBool(flags.trustEstablished);
    out.flags.maryDefeated = W.coerceBool(flags.maryDefeated);

    return out;
  }

  /* Carry an older sheet forward. Version 1 always held exactly four player
     entries, most of them empty on a solo or two-player game; version 2 holds
     only the players that exist. Trailing empties are dropped — one always
     remains — while an empty card between two filled ones is kept, so the
     numbering of the players who ARE on the sheet does not shift under them.

     2 -> 3 adds the `expert` flag. Defaulting it to false would be wrong for
     a sheet already in use: the hit points are only ever asked for at expert
     level, so a sheet that records them was an expert game, and reading it as
     standard would hide numbers the owner had entered. */
  function migrate(raw, fromVersion) {
    raw = (raw && typeof raw === "object") ? raw : {};
    if (fromVersion < 2 && Array.isArray(raw.players)) {
      var players = raw.players.slice(0, MAX_PLAYERS);
      var lastUsed = -1;
      players.forEach(function (p, i) {
        var filled = p && typeof p === "object" &&
          (String(p.hero == null ? "" : p.hero).trim() !== "" || p.hp != null);
        if (filled) lastUsed = i;
      });
      raw.players = players.slice(0, Math.max(1, lastUsed + 1));
    }
    if (fromVersion < 3 && Array.isArray(raw.players)) {
      var recorded = raw.players.some(function (p) {
        return p && typeof p === "object" && p.hp != null;
      });
      if (recorded) raw.expert = true;
    }
    return raw;
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

  function render(root, ctx) {
    var t = ctx.t, lang = ctx.lang, state = ctx.state;

    root.appendChild(renderPlayers(t, lang, state, ctx));
    /* The scenario table and the villain list sit side by side on wide screens
       (see .sheet-columns in styles.css) while staying in this order in the
       DOM, so reading order and print output follow the paper sheet. */
    var columns = W.el("div", "sheet-columns");
    columns.appendChild(renderScenarios(t, lang, state, ctx));
    columns.appendChild(renderVillainList(t));
    root.appendChild(columns);
    root.appendChild(renderRemoved(t, state, ctx));
    root.appendChild(renderFlags(t, state, ctx));
    /* Last, because it looks the chips up in the document: by now every panel
       above is attached, and the same function serves every later change of a
       villain select. */
    paintVillainUsage(state, lang, t);
  }

  function renderPlayers(t, lang, state, ctx) {
    /* Players are added as they join, not laid out as four fixed places: the
       game is played by one to four, and three empty cards on a solo sheet are
       just noise. The paper sheet has to print all four; we do not. */
    var addBtn = W.el("button", "btn btn-add", { type: "button" });
    addBtn.textContent = t("addPlayer");
    addBtn.disabled = state.players.length >= MAX_PLAYERS;
    addBtn.title = addBtn.disabled ? t("addPlayerFull") : t("addPlayer");
    addBtn.addEventListener("click", function () {
      if (state.players.length >= MAX_PLAYERS) return;
      state.players.push({ hero: "", hp: null });
      ctx.save();
      ctx.rerender();
    });

    /* The expert switch sits here rather than with the campaign flags below:
       the field it governs is in these cards, so the cause is next to what it
       reveals — and the MC10 sheet puts it in the same place. A re-render,
       because a field appears and disappears. */
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

    /* One shared <datalist> of hero names for all the slots. The fields stay
       free text: the sheet is a fill-in field, and a hero the roster has not
       caught up with yet must remain typeable. */
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
          var hasContent = !!player.hero.trim() || player.hp != null;
          if (hasContent && !window.confirm(t("confirmRemovePlayer"))) return;
          state.players.splice(i, 1);
          ctx.save();
          ctx.rerender();
        },
      });
      del.classList.add("player-remove");
      head.appendChild(del);
      card.appendChild(head);

      var idRow = W.el("div", "player-field");
      var idText = W.el("label", "field-label");
      idText.textContent = t("colIdentity");
      idRow.appendChild(idText);
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
      idText.appendChild(heroInput);
      card.appendChild(idRow);

      /* Expert only: the remaining hit points are what a scenario hands to the
         next one, and the standard campaign does not carry them over. */
      var hpField = null;
      if (state.expert) {
        var hpRow = W.el("div", "player-field");
        var hpText = W.el("label", "field-label");
        hpText.textContent = t("colHp");
        hpField = W.numberField({
          value: player.hp,
          min: 0, max: HP_MAX,
          label: caption + " – " + t("colHp"),
          hint: startingHealth(player.hero, lang),
          onChange: function (next) { player.hp = next; ctx.save(); },
        });
        hpText.appendChild(hpField);
        hpRow.appendChild(hpText);
        card.appendChild(hpRow);
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

  function renderScenarios(t, lang, state, ctx) {
    var open = openScenarios(state);
    var roundBtn = W.el("button", "btn btn-add", { type: "button" });
    roundBtn.textContent = t("nextRound");
    roundBtn.disabled = open.length === 0;
    roundBtn.title = roundBtn.disabled ? t("nextRoundNone") : t("nextRoundHint");
    roundBtn.addEventListener("click", function () {
      var drawn = advanceRound(state);
      if (!drawn.length) return;
      var names = drawn.map(function (row) {
        return scenarioName(SCENARIOS[state.scenarios.indexOf(row)], lang);
      });
      ctx.save();
      ctx.toast(names.length === 1
        ? t("nextRoundDrawnOne", names[0])
        : t("nextRoundDrawn", names[0], names[1]), 5000);
      ctx.rerender();
    });

    var section = panel("scenarios", t("secScenarios"), roundBtn);

    var hint = W.el("p", "hint");
    hint.textContent = t("progressHint");
    section.appendChild(hint);

    /* A real table: the cells are a grid of controls that only make sense in
       relation to their row and column, and <th scope> is what conveys that. */
    var table = W.el("table", "sheet-table");
    var caption = W.el("caption", "sr-only");
    caption.textContent = t("secScenarios");
    table.appendChild(caption);

    var thead = W.el("thead");
    var hrow = W.el("tr");
    [t("colScenario"), t("colCompleted"), t("colVillain"), t("colProgress")]
      .forEach(function (label) {
        var th = W.el("th", null, { scope: "col" });
        th.textContent = label;
        hrow.appendChild(th);
      });
    thead.appendChild(hrow);
    table.appendChild(thead);

    var tbody = W.el("tbody");
    var selects = [];

    state.scenarios.forEach(function (row, i) {
      var def = SCENARIOS[i];
      var name = scenarioName(def, lang);
      var tr = W.el("tr", [
        row.progress >= PROGRESS_MAX ? "is-failed" : "",
        row.completed ? "is-completed" : "",
      ].join(" ").trim() || null);

      var th = W.el("th", "scenario-name", { scope: "row", lang: scenarioLang(def, lang) });
      th.textContent = name;
      tr.appendChild(th);

      var doneCell = W.el("td", null, { "data-label": t("colCompleted") });
      doneCell.appendChild(W.checkbox({
        checked: row.completed,
        label: name + " – " + t("colCompleted"),
        disabled: completedLocked(row),
        lockReason: t("lockedByFailed"),
        onChange: function (next) {
          row.completed = next;
          ctx.save();
          /* Re-render: this toggle decides whether the progress boxes in this
             row are frozen. */
          ctx.rerender();
        },
      }));
      tr.appendChild(doneCell);

      var villainCell = W.el("td", "villain-cell", { "data-label": t("colVillain") });
      var select = W.poolSelect({
        value: row.villain,
        label: name + " – " + t("colVillain"),
        placeholder: t("villainPlaceholder"),
        options: VILLAINS.map(function (v) {
          return { value: v.slug, label: v.name, lang: "en" };
        }),
        onChange: function (next) { setVillain(next); },
      });
      selects.push(select);

      /* Rolls one of the villains nobody has been given yet. Only offered while
         this row is empty — with a villain already in it there is nothing to
         roll, and overwriting a choice on one click is not what a die is for. */
      var die = W.iconButton({
        glyph: "🎲",
        label: name + " – " + t("randomVillain"),
        disabled: !!row.villain,
        lockReason: t("randomVillainTaken"),
        onClick: function () {
          var free = unusedVillains(state);
          var pick = W.pickRandom(free);
          if (!pick) return;
          setVillain(pick.slug);
        },
      });

      /* Applied from both the dropdown and the die, and in place rather than by
         re-rendering the panel: that keeps the focus where the player put it. */
      function setVillain(next) {
        row.villain = next;
        select.value = next;
        ctx.save();
        W.syncUnique(selects);
        paintVillainUsage(state, lang, t);
        die.disabled = !!next || unusedVillains(state).length === 0;
        die.title = die.disabled
          ? (next ? t("randomVillainTaken") : t("randomVillainNoneLeft"))
          : name + " – " + t("randomVillain");
      }

      die.classList.add("villain-die");
      villainCell.appendChild(select);
      villainCell.appendChild(die);
      tr.appendChild(villainCell);

      var progressCell = W.el("td", null, { "data-label": t("colProgress") });
      progressCell.appendChild(W.progressRow({
        value: row.progress,
        steps: ["1", "2", t("colFailed")],
        labelFor: function (n) {
          return name + " – " + (n === PROGRESS_MAX
            ? t("colFailed")
            : t("progressStep", String(n)));
        },
        disabled: progressLocked(row),
        lockReason: t("lockedByCompleted"),
        onChange: function (next) {
          row.progress = next;
          ctx.save();
          /* Re-render the panel: the row picks up or loses its failed styling,
             and the boxes below the new value have to be repainted anyway. */
          ctx.rerender();
        },
      }));
      tr.appendChild(progressCell);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    section.appendChild(table);
    W.syncUnique(selects);
    return section;
  }

  /* The fixed list of villains from the sheet, doubling as an answer to "who is
     left?": a villain already assigned to a scenario is struck through and
     names the scenario it went to. */
  function renderVillainList(t) {
    var section = panel("villain-list", t("secVillainList"));
    var list = W.el("ul", "chip-list");
    VILLAINS.forEach(function (v) {
      var li = W.el("li", "chip", { "data-villain": v.slug, lang: "en" });
      li.textContent = v.name;
      list.appendChild(li);
    });
    section.appendChild(list);
    return section;
  }

  function paintVillainUsage(state, lang, t) {
    var used = {};
    state.scenarios.forEach(function (row, i) {
      if (row.villain) used[row.villain] = scenarioName(SCENARIOS[i], lang);
    });
    document.querySelectorAll(".chip[data-villain]").forEach(function (chip) {
      var slug = chip.getAttribute("data-villain");
      var where = used[slug];
      chip.classList.toggle("chip--used", !!where);
      if (where) chip.title = t("assignedTo", where);
      else chip.removeAttribute("title");
    });
  }

  function renderRemoved(t, state, ctx) {
    var section = panel("removed", t("secRemoved"));
    section.appendChild(W.stringList({
      listId: "removed",
      group: "removed",
      getArray: function () { return ctx.state.removed; },
      placeholder: t("cardNamePlaceholder"),
      addLabel: t("addEntry"),
      removeLabel: t("removeEntry"),
      removeConfirm: t("confirmRemoveEntry"),
      dragLabel: t("dragReorder"),
      multiline: false,
    }));
    return section;
  }

  function renderFlags(t, state, ctx) {
    var section = panel("flags", t("secCampaignState"));
    var row = W.el("div", "flag-row");
    [
      { key: "trustEstablished", label: t("flagTrust") },
      { key: "maryDefeated", label: t("flagMary") },
    ].forEach(function (f) {
      var wrap = W.el("label", "flag");
      var text = W.el("span");
      text.textContent = f.label;
      wrap.appendChild(text);
      wrap.appendChild(W.checkbox({
        checked: state.flags[f.key],
        label: f.label,
        onChange: function (next) { state.flags[f.key] = next; ctx.save(); },
      }));
      row.appendChild(wrap);
    });
    section.appendChild(row);
    return section;
  }

  // ---- Print ---------------------------------------------------------------
  /* A plain text snapshot. Checkboxes become box glyphs drawn in CSS, so the
     printout does not depend on a font carrying a tick. */
  function renderPrint(root, ctx) {
    var t = ctx.t, lang = ctx.lang, state = ctx.state;

    var players = printSection(root, t("secPlayers"));
    /* First, because it decides whether the hit points below mean anything. */
    var level = W.el("p", "print-line");
    level.textContent = (state.expert ? "[x] " : "[ ] ") + t("lblExpert");
    players.appendChild(level);
    state.players.forEach(function (p, i) {
      if (!p.hero && p.hp == null) return;
      var line = W.el("p", "print-line");
      /* The hidden field stays out of the printout too, so a standard sheet
         does not print a number it is not playing with. */
      line.textContent = t("playerRow", String(i + 1)) + ": " + (p.hero || "—") +
        (state.expert
          ? " · " + t("colHp") + ": " + (p.hp == null ? "—" : String(p.hp))
          : "");
      players.appendChild(line);
    });

    var scen = printSection(root, t("secScenarios"));
    state.scenarios.forEach(function (row, i) {
      var name = scenarioName(SCENARIOS[i], lang);
      var v = villainBySlug(row.villain);
      var line = W.el("p", "print-line");
      var parts = [
        (row.completed ? "[x] " : "[ ] ") + name,
        t("colVillain") + ": " + (v ? v.name : "—"),
        row.progress >= PROGRESS_MAX
          ? t("colFailed")
          : t("colProgress") + ": " + row.progress + "/" + PROGRESS_MAX,
      ];
      line.textContent = parts.join("  ·  ");
      scen.appendChild(line);
    });

    if (state.removed.length) {
      var removed = printSection(root, t("secRemoved"));
      var ul = W.el("ul", "print-list");
      state.removed.forEach(function (entry) {
        var s = W.splitStrike(entry);
        var li = W.el("li", s.struck ? "struck" : null);
        li.textContent = s.text;
        ul.appendChild(li);
      });
      removed.appendChild(ul);
    }

    var flags = printSection(root, t("secCampaignState"));
    [
      { on: state.flags.trustEstablished, label: t("flagTrust") },
      { on: state.flags.maryDefeated, label: t("flagMary") },
    ].forEach(function (f) {
      var line = W.el("p", "print-line");
      line.textContent = (f.on ? "[x] " : "[ ] ") + f.label;
      flags.appendChild(line);
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

  // ---- Registration --------------------------------------------------------
  global.registerCampaign({
    id: "fear-no-evil",
    code: "MC60",
    titleEn: "Fear No Evil",
    /* No official German title: MC60 has not been released in German. */
    titleDe: "Fear No Evil",
    theme: "fne",
    /* 2: players went from four fixed places to a list of one to four.
       3: standard or expert level, which decides whether the remaining hit
          points are asked for at all. */
    stateVersion: 3,

    emptyState: emptyState,
    normalize: normalize,
    migrate: migrate,
    render: render,
    renderPrint: renderPrint,

    helpDe: "Spieler werden einzeln hinzugefügt — von einem bis vier —, der Bogen zeigt also nur die, die wirklich mitspielen. Der Haken „Expertenmodus“ oben im Spielerbereich entscheidet über die verbleibenden Lebenspunkte: die gibt es nur auf Expertenstufe, auf Standardstufe blendet der Bogen das Feld aus, statt danach zu fragen. Ausblenden heißt nicht löschen — wer versehentlich umschaltet, verliert nichts. Jede Runde werden zwei Szenarien gezogen, die weder abgeschlossen noch gescheitert sind; beide erhalten einen Fortschrittspunkt. „Nächste Runde“ macht genau das mit einem Klick und nennt anschließend die gezogenen Szenarien; ist nur noch eines im Spiel, bekommt es beide Punkte. Der dritte Punkt bedeutet: Das Szenario ist gescheitert. Deshalb sind „1“, „2“ und „Gescheitert“ ein Zähler und keine drei einzelnen Kästchen — ein Klick auf das jeweils oberste gefüllte Kästchen nimmt einen Punkt zurück. „Abgeschlossen“ und „Gescheitert“ schließen sich aus: Ein abgeschlossenes Szenario friert seinen Fortschritt ein, ein gescheitertes sperrt den Abgeschlossen-Haken — die gesetzten Haken bleiben dabei sichtbar. Jeder der fünf Schurken wird genau einem Szenario zugeordnet; ein gewählter Schurke verschwindet aus den übrigen Zeilen und wird in der Schurkenliste durchgestrichen. Der Würfel neben einem leeren Schurken-Feld lost einen der noch freien Schurken aus.",
    helpEn: "Players are added one at a time, from one to four, so the sheet only shows the ones actually playing. The “Expert level” box at the top of the player area decides about the remaining hit points: they exist only at expert level, and at standard level the sheet hides the field rather than asking for it. Hiding is not clearing — switching by accident loses nothing. Each round two scenarios that are neither completed nor failed are drawn, and both take one progress point. “Next round” does exactly that in one click and then names the scenarios it drew; if only one is still in play it takes both points. The third point means the scenario has failed. So “1”, “2” and “Failed” are one counter rather than three separate boxes — clicking the topmost filled box takes a point back. “Completed” and “Failed” are mutually exclusive: a completed scenario freezes its progress and a failed one locks the Completed box, with the existing marks left visible either way. Each of the five villains is assigned to exactly one scenario; a chosen villain disappears from the other rows and is struck through in the villain list. The die next to an empty villain field rolls one of the villains still free.",

    i18n: {
      de: {
        secPlayers: "Spieler-Informationen",
        secScenarios: "Szenarien",
        secVillainList: "Liste der Schurken",
        secRemoved: "Aus der Kampagne entfernte Verbündete und Persona-Unterstützungen",
        secCampaignState: "Kampagnen-Status",

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

        colScenario: "Szenario",
        colCompleted: "Abgeschlossen",
        colVillain: "Schurke",
        colProgress: "Fortschritt",
        colFailed: "Gescheitert",
        /* "%s" = Nummer des Fortschrittspunkts. */
        progressStep: "Fortschritt %s",
        nextRound: "Nächste Runde",
        nextRoundHint: "Zieht zwei Szenarien, die noch im Spiel sind, und gibt jedem einen Fortschrittspunkt.",
        nextRoundNone: "Kein Szenario mehr im Spiel.",
        /* "%s" = die beiden gezogenen Szenarien. */
        nextRoundDrawn: "Diese Runde: %s und %s — je ein Fortschrittspunkt.",
        /* "%s" = das einzige noch offene Szenario. */
        nextRoundDrawnOne: "Nur noch %s im Spiel — zwei Fortschrittspunkte.",
        progressHint: "Fortschritt: „1“, „2“, „Gescheitert“ sind ein Zähler. Ein Klick setzt ihn auf dieses Kästchen; ein Klick auf das oberste gefüllte Kästchen nimmt einen Punkt zurück. „Abgeschlossen“ und „Gescheitert“ schließen sich aus und sperren einander.",
        lockedByCompleted: "Szenario ist abgeschlossen — der Fortschritt bleibt stehen und ist gesperrt. Zum Ändern zuerst „Abgeschlossen“ abwählen.",
        lockedByFailed: "Szenario ist gescheitert — „Abgeschlossen“ ist gesperrt. Zum Ändern zuerst einen Fortschrittspunkt zurücknehmen.",
        villainPlaceholder: "— Schurke wählen —",
        randomVillain: "Zufälligen Schurken auslosen",
        randomVillainTaken: "Es ist schon ein Schurke gewählt — zum Auslosen erst das Feld leeren.",
        randomVillainNoneLeft: "Alle Schurken sind bereits zugeordnet.",
        /* "%s" = Szenarioname. */
        assignedTo: "Zugeordnet: %s",

        cardNamePlaceholder: "Kartenname …",

        flagTrust: "Vertrauen hergestellt?",
        flagMary: "Mary besiegt?",
      },
      en: {
        secPlayers: "Player Information",
        secScenarios: "Scenarios",
        secVillainList: "List of Villains",
        secRemoved: "Allies and Persona Supports Removed from the Campaign",
        secCampaignState: "Campaign State",

        playerRow: "Player #%s",
        colIdentity: "Identity",
        colHp: "Remaining hit points",
        identityPlaceholder: "Hero …",
        lblExpert: "Expert level",
        expertHint: "Remaining hit points are only recorded at expert level. Switching this off hides them without clearing them.",
        addPlayer: "+ Player",
        addPlayerFull: "The game does not go beyond four players.",
        removePlayer: "Remove player",
        removePlayerLast: "The last player cannot be removed.",
        confirmRemovePlayer: "Remove this player along with what is filled in?",
        duplicateHero: "This hero is already assigned to another player.",

        colScenario: "Scenario",
        colCompleted: "Completed",
        colVillain: "Villain",
        colProgress: "Progress",
        colFailed: "Failed",
        progressStep: "Progress %s",
        nextRound: "Next round",
        nextRoundHint: "Draws two scenarios still in play and gives each one a progress point.",
        nextRoundNone: "No scenario is still in play.",
        nextRoundDrawn: "This round: %s and %s — one progress point each.",
        nextRoundDrawnOne: "Only %s is still in play — two progress points.",
        progressHint: "Progress: “1”, “2” and “Failed” are one counter. A click sets it to that box; clicking the topmost filled box takes a point back. “Completed” and “Failed” are mutually exclusive and lock each other out.",
        lockedByCompleted: "Scenario is completed — the progress stays as it is and is locked. Untick “Completed” first to change it.",
        lockedByFailed: "Scenario has failed — “Completed” is locked. Take a progress point back first to change it.",
        villainPlaceholder: "— choose a villain —",
        randomVillain: "Roll a random villain",
        randomVillainTaken: "A villain is already chosen — clear the field first to roll.",
        randomVillainNoneLeft: "Every villain is already assigned.",
        assignedTo: "Assigned to: %s",

        cardNamePlaceholder: "Card name …",

        flagTrust: "Trust Established?",
        flagMary: "Mary Defeated?",
      },
    },
  });
})(window);

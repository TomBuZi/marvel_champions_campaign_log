/* Marvel Champions — "The Rise of Red Skull" (MC10) campaign log.

   Mirrors the official MC10 campaign log sheet field for field, and that sheet
   is a very different animal from MC60's: it has no scenario table, no
   completed/failed tracking, no villain list. The five scenarios (Crossbones,
   Absorbing Man, Taskmaster, Zola, Red Skull) are played in a fixed order, so
   the printed log only records what carries FORWARD between them — what each
   player owns, and three results that later scenarios ask about.

   That is why there is no progress counter, no "next round" button and no
   randomiser here. Their absence is the sheet, not an omission.

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
  /* The two scenario counters. Nothing in the campaign approaches 99; the cap
     is there so a hand-edited file cannot put a nonsense number on the sheet. */
  var COUNT_MAX = 99;
  var NOTES_MAX = 4000;

  /* Drop the control characters, keep the newline. Written as a loop over the
     char codes rather than a regexp character class: such a class has to spell
     the control characters out, and a source file that CONTAINS the bytes it
     means to remove is a trap for whoever edits it next. */
  function stripControls(s) {
    var out = "";
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c === 10) { out += "\n"; continue; }          // the newline stays
      if (c < 32) continue;                             // the rest of C0, tab included
      if (c >= 127 && c <= 159) continue;               // DEL and C1
      out += s.charAt(i);
    }
    return out;
  }

  /* Free text, cleaned - the multi-line counterpart to W.coerceText.
     W.coerceText drops every character below U+0020, and the newline is one of
     them: running it over the notes would silently flatten every paragraph on
     the next save. So this keeps the newline, and normalises CRLF on the way in
     so a file edited on Windows and one edited elsewhere compare equal.

     Deliberately local rather than an option on the shared helper: it has one
     consumer, and that helper sits on the other campaign's data path. */
  function coerceNotes(v) {
    var s = typeof v === "string" ? v : (v == null ? "" : String(v));
    s = stripControls(s.replace(/\r\n?/g, "\n"));
    /* Trim, cap, trim again: the cap can land in the middle of whitespace, and
       without the second trim the value would not be a fixpoint. */
    return s.trim().slice(0, NOTES_MAX).trim();
  }

  /* "Player #1" on its own, or "Player #1 – Captain America" once there is a
     name to say. Used for the scenario 4 checkboxes and in the printout, where
     a bare number would not tell anyone who was meant. */
  function playerLabel(t, player, i) {
    var caption = t("playerRow", String(i + 1));
    var hero = String(player.hero || "").trim();
    return hero ? caption + " – " + hero : caption;
  }

  // ---- Data ----------------------------------------------------------------
  function emptyState() {
    return {
      /* A fresh sheet starts with a single player; more are added as needed. */
      players: [newPlayer()],
      /* Scenario 1: Experimental Weapons added to the encounter deck. */
      experimentalWeapons: null,
      /* Scenario 2: delay counters left on the main scheme. */
      delayCounters: null,
      /* Scenario 4: allies removed from the campaign. */
      removed: [],
      notes: "",
    };
  }

  function newPlayer() {
    return {
      hero: "",
      hp: null,
      obligations: [],
      techUpgrade: "",
      basicUpgrade: "",
      rescuedAllies: [],
      /* Scenario 4: was this player engaged with a minion at the end?
         The paper sheet has one line to write names on; the app already knows
         who is playing, so this is a flag per player instead. It lives ON the
         player rather than in a parallel list, so adding or removing a player
         can never shift the flags out from under the names. */
      engagedWithMinion: false,
    };
  }

  /* Never throws. Starts from emptyState() and overlays only what it
     recognises, so a hand-edited file, a foreign export or a truncated share
     link cannot produce an invalid sheet. Fields this sheet does not have —
     MC60's `scenarios` and `flags`, say — are simply never read, which is how
     they get dropped. */
  function normalize(raw) {
    raw = (raw && typeof raw === "object") ? raw : {};
    var out = emptyState();

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
        obligations: W.coerceStringList(p.obligations, { split: true, trim: true }),
        techUpgrade: W.coerceText(p.techUpgrade, NAME_MAX),
        basicUpgrade: W.coerceText(p.basicUpgrade, NAME_MAX),
        rescuedAllies: W.coerceStringList(p.rescuedAllies, { split: true, trim: true }),
        engagedWithMinion: W.coerceBool(p.engagedWithMinion),
      });
    }

    out.experimentalWeapons = W.clampNumber(raw.experimentalWeapons, 0, COUNT_MAX);
    out.delayCounters = W.clampNumber(raw.delayCounters, 0, COUNT_MAX);
    out.removed = W.coerceStringList(raw.removed, { split: true, trim: true });
    out.notes = coerceNotes(raw.notes);

    return out;
  }

  /* No migrate(): stateVersion is 1, so there is no older shape in the wild
     yet. The first change to the shape above has to bring one with it — see
     the check in test/lint.js. */

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

  /* A labelled row inside a player card or a scenario panel. */
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

    /* DOM order follows the paper sheet, so reading order and print output do
       too. Nothing sits side by side here — unlike MC60, this sheet has no
       second column to pair with the players. */
    root.appendChild(renderPlayers(t, lang, state, ctx));
    /* Scenario 1 and 2 hold a single number each and sit side by side on a wide
       screen (see .scenario-row in styles.css), which is how they are printed;
       they stay in this order in the DOM, so reading order and print output
       follow the paper sheet. */
    var row = W.el("div", "scenario-row");
    row.appendChild(renderCounter(t, ctx, "scenario-1", t("secScenario1"),
      t("lblExperimentalWeapons"), "experimentalWeapons"));
    row.appendChild(renderCounter(t, ctx, "scenario-2", t("secScenario2"),
      t("lblDelayCounters"), "delayCounters"));
    root.appendChild(row);
    root.appendChild(renderScenario4(t, state, ctx));
    root.appendChild(renderNotes(t, state, ctx));
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

    var section = panel("players", t("secPlayers"), addBtn);
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
         something on the card to lose — and on this sheet a card holds far more
         than a name and a number, so the check has to look at all of it. */
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
          /* Must be a full rerender, never a partial redraw: the list widgets
             register themselves by id, and core.js clears that registry on
             every render. A partial redraw would leave the removed player's
             lists registered and able to receive a drop. */
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
          /* The scenario 4 checkboxes name the players, so they follow along.
             Rewritten in place rather than by re-rendering, which would take
             the focus out of the field being typed in. */
          paintEngagedLabels(t, state);
        },
      });
      card.appendChild(fieldRow(t("colIdentity"), heroInput));

      var hpField = W.numberField({
        value: player.hp,
        min: 0, max: HP_MAX,
        label: caption + " – " + t("colHp"),
        hint: startingHealth(player.hero, lang),
        onChange: function (next) { player.hp = next; ctx.save(); },
      });
      card.appendChild(fieldRow(t("colHp"), hpField));

      /* The four things a player carries through the campaign. Obligations and
         rescued allies accumulate, so they are lists; the two upgrades are one
         line each, exactly as printed. */
      card.appendChild(playerList(t, ctx, i, "obligations", t("lblObligations"),
        function () { return player.obligations; }));

      var tech = W.textField({
        value: player.techUpgrade,
        label: caption + " – " + t("lblTechUpgrade"),
        placeholder: t("cardNamePlaceholder"),
        maxLength: NAME_MAX,
        onChange: function (next) { player.techUpgrade = next; ctx.save(); },
      });
      card.appendChild(fieldRow(t("lblTechUpgrade"), tech));

      var basic = W.textField({
        value: player.basicUpgrade,
        label: caption + " – " + t("lblBasicUpgrade"),
        placeholder: t("cardNamePlaceholder"),
        maxLength: NAME_MAX,
        onChange: function (next) { player.basicUpgrade = next; ctx.save(); },
      });
      card.appendChild(fieldRow(t("lblBasicUpgrade"), basic));

      card.appendChild(playerList(t, ctx, i, "rescued", t("lblRescuedAllies"),
        function () { return player.rescuedAllies; }));

      /* The hero's printed starting hit points, as a reminder of what full
         health was. Rewritten in place rather than by re-rendering the panel,
         which would take the focus out of the field being typed in. */
      function updateHpHint() {
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

  function playerHasContent(player) {
    return !!player.hero.trim() || player.hp != null ||
      player.obligations.length > 0 || player.rescuedAllies.length > 0 ||
      !!player.techUpgrade.trim() || !!player.basicUpgrade.trim() ||
      player.engagedWithMinion;
  }

  /* One of a player's two lists. The ids carry the player index so the widget
     registry keeps them apart within a render pass; `group` is the id itself,
     which means entries cannot be dragged out of the list they belong to.
     That is on purpose: no rule in the campaign moves an obligation from one
     player to another, and an accidental cross-drop would quietly rewrite two
     players' cards at once. */
  function playerList(t, ctx, index, kind, labelText, getArray) {
    var id = "trors-p" + index + "-" + kind;
    var field = W.stringList({
      listId: id,
      group: id,
      getArray: getArray,
      placeholder: t("cardNamePlaceholder"),
      addLabel: t("addEntry"),
      removeLabel: t("removeEntry"),
      removeConfirm: t("confirmRemoveEntry"),
      dragLabel: t("dragReorder"),
      label: labelText,
      multiline: false,
    });
    var row = W.el("div", "player-field");
    row.appendChild(field);
    return row;
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

  /* Scenario 1 and scenario 2 each record a single number, so they share one
     renderer. Written in place: nothing else on the sheet depends on it. */
  function renderCounter(t, ctx, id, heading, labelText, key) {
    var section = panel(id, heading);
    var field = W.numberField({
      value: ctx.state[key],
      min: 0, max: COUNT_MAX,
      label: labelText,
      onChange: function (next) { ctx.state[key] = next; ctx.save(); },
    });
    section.appendChild(fieldRow(labelText, field));
    return section;
  }

  function renderScenario4(t, state, ctx) {
    var section = panel("scenario-4", t("secScenario4"));

    var engagedLabel = W.el("p", "field-label");
    engagedLabel.textContent = t("lblEngaged");
    section.appendChild(engagedLabel);

    var row = W.el("div", "flag-row");
    state.players.forEach(function (player, i) {
      var wrap = W.el("label", "flag");
      var text = W.el("span", null, { "data-engaged-label": String(i) });
      text.textContent = playerLabel(t, player, i);
      wrap.appendChild(text);
      wrap.appendChild(W.checkbox({
        checked: player.engagedWithMinion,
        label: playerLabel(t, player, i) + " – " + t("lblEngaged"),
        /* No rerender: unlike MC60's Completed box this flag locks nothing. */
        onChange: function (next) { player.engagedWithMinion = next; ctx.save(); },
      }));
      row.appendChild(wrap);
    });
    section.appendChild(row);

    /* On the paper sheet this list sits inside the scenario 4 box, so it does
       here too rather than becoming a panel of its own. */
    section.appendChild(W.stringList({
      listId: "trors-removed",
      group: "trors-removed",
      getArray: function () { return ctx.state.removed; },
      placeholder: t("cardNamePlaceholder"),
      addLabel: t("addEntry"),
      removeLabel: t("removeEntry"),
      removeConfirm: t("confirmRemoveEntry"),
      dragLabel: t("dragReorder"),
      label: t("secRemoved"),
      multiline: false,
    }));

    return section;
  }

  /* Keeps the scenario 4 checkbox captions in step with the identity fields
     without re-rendering anything. Looked up in the document, like MC60's
     villain chips, because the caller is inside another panel. */
  function paintEngagedLabels(t, state) {
    document.querySelectorAll("[data-engaged-label]").forEach(function (node) {
      var i = parseInt(node.getAttribute("data-engaged-label"), 10);
      var player = state.players[i];
      if (player) node.textContent = playerLabel(t, player, i);
    });
  }

  function renderNotes(t, state, ctx) {
    var section = panel("notes", t("secNotes"));

    /* The one field on this sheet that no widget covers: W.textField is a
       single-line input, and W.stringList is a list of rows with grips and
       remove buttons — neither is a free-text block. Composed here from W.el
       and W.autoGrow rather than added to the shared toolbox, since this is
       its only consumer so far. */
    var ta = W.el("textarea", "notes-input", {
      rows: "3",
      "aria-label": t("secNotes"),
      title: t("secNotes"),
      placeholder: t("notesPlaceholder"),
      maxlength: String(NOTES_MAX),
      spellcheck: "false",
    });
    ta.value = state.notes;
    ta.addEventListener("input", function () {
      state.notes = ta.value;
      W.autoGrow(ta);
      /* In place — a rerender here would drop the focus on every keystroke. */
      ctx.save();
    });
    ta.addEventListener("blur", function () {
      var trimmed = ta.value.trim();
      if (trimmed !== ta.value) {
        ta.value = trimmed;
        state.notes = trimmed;
        W.autoGrow(ta);
        ctx.save();
      }
    });
    section.appendChild(ta);
    /* Sized after the element is in the document: scrollHeight is 0 while it
       is still detached. Same reason stringList defers its multiline sizing. */
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(function () { W.autoGrow(ta); });
    }
    return section;
  }

  // ---- Print ---------------------------------------------------------------
  /* A plain text snapshot. Checkboxes become box glyphs drawn in CSS, so the
     printout does not depend on a font carrying a tick. */
  function renderPrint(root, ctx) {
    var t = ctx.t, state = ctx.state;

    var players = printSection(root, t("secPlayers"));
    state.players.forEach(function (p, i) {
      if (!playerHasContent(p)) return;
      printLine(players, t("playerRow", String(i + 1)) + ": " +
        (p.hero || "—") + " · " + t("colHp") + ": " +
        (p.hp == null ? "—" : String(p.hp)));
      if (p.techUpgrade) printLine(players, "  " + t("lblTechUpgrade") + ": " + p.techUpgrade);
      if (p.basicUpgrade) printLine(players, "  " + t("lblBasicUpgrade") + ": " + p.basicUpgrade);
      printList(players, p.obligations, t("lblObligations"));
      printList(players, p.rescuedAllies, t("lblRescuedAllies"));
    });

    var one = printSection(root, t("secScenario1"));
    printLine(one, t("lblExperimentalWeapons") + ": " +
      (state.experimentalWeapons == null ? "—" : String(state.experimentalWeapons)));

    var two = printSection(root, t("secScenario2"));
    printLine(two, t("lblDelayCounters") + ": " +
      (state.delayCounters == null ? "—" : String(state.delayCounters)));

    var four = printSection(root, t("secScenario4"));
    printLine(four, t("lblEngaged") + ":");
    state.players.forEach(function (p, i) {
      printLine(four, (p.engagedWithMinion ? "[x] " : "[ ] ") + playerLabel(t, p, i));
    });
    printList(four, state.removed, t("secRemoved"));

    if (state.notes) {
      var notes = printSection(root, t("secNotes"));
      state.notes.split("\n").forEach(function (line) {
        if (line.trim()) printLine(notes, line);
      });
    }
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

  /* A heading plus the entries, or nothing at all when the list is empty. */
  function printList(parent, entries, heading) {
    if (!entries.length) return;
    printLine(parent, heading + ":");
    var ul = W.el("ul", "print-list");
    entries.forEach(function (entry) {
      var s = W.splitStrike(entry);
      var li = W.el("li", s.struck ? "struck" : null);
      li.textContent = s.text;
      ul.appendChild(li);
    });
    parent.appendChild(ul);
  }

  // ---- Registration --------------------------------------------------------
  global.registerCampaign({
    id: "rise-of-red-skull",
    code: "MC10",
    titleEn: "The Rise of Red Skull",
    /* The German edition keeps the English campaign title, as this project
       does throughout. */
    titleDe: "The Rise of Red Skull",
    theme: "trors",
    stateVersion: 1,
    /* Crossbones, Absorbing Man, Taskmaster, Zola, Red Skull — played in that
       fixed order, which is why none of them has a row on the sheet. */
    scenarioCount: 5,

    emptyState: emptyState,
    normalize: normalize,
    render: render,
    renderPrint: renderPrint,

    helpDe: "Der MC10-Bogen folgt dem gedruckten Original Feld für Feld — und das heißt vor allem: es gibt hier bewusst keine Szenario-Tabelle, kein „Abgeschlossen“, kein „Gescheitert“ und keinen Würfel. Die fünf Szenarien (Crossbones, Absorbing Man, Taskmaster, Zola, Red Skull) werden in fester Reihenfolge gespielt, deshalb hält der Bogen nur fest, was von einem Szenario ins nächste mitgeht. Spieler werden einzeln hinzugefügt — von einem bis vier —, der Bogen zeigt also nur die, die wirklich mitspielen. Jede Spielerkarte trägt neben Identität und Trefferpunkten die vier Sammelfelder des Originals: Verpflichtungen und gerettete Verbündete als Listen, weil davon über die Kampagne mehrere zusammenkommen, Tech- und Basis-Upgrade als je eine Zeile, genau wie gedruckt. Dazu die drei Ergebnisse, nach denen späteren Szenarien fragen: die Zahl der Experimentalwaffen im Begegnungsdeck nach Szenario 1, die Verzögerungsmarker auf dem Hauptplan nach Szenario 2 und nach Szenario 4, welche Spieler mit Handlangern im Gefecht waren — auf Papier eine Zeile zum Hineinschreiben, hier ein Häkchen pro Spieler, weil die App die Mitspieler ohnehin kennt. Die aus der Kampagne entfernten Verbündeten stehen wie im Original im Szenario-4-Kasten. Alles übrige nimmt das Notizfeld auf; ein „~“ am Anfang eines Listeneintrags streicht ihn durch.",
    helpEn: "The MC10 sheet follows the printed original field for field, and that above all means what is deliberately absent: no scenario table, no “completed”, no “failed”, no die. The five scenarios (Crossbones, Absorbing Man, Taskmaster, Zola, Red Skull) are played in a fixed order, so the log only records what carries forward from one to the next. Players are added one at a time, from one to four, so the sheet only shows the ones actually playing. Besides identity and hit points, each player card carries the four collecting fields of the original: obligations and rescued allies as lists, because several of each accumulate over the campaign, and the tech and basic upgrade as one line each, exactly as printed. Then the three results later scenarios ask about: how many Experimental Weapons went into the encounter deck after scenario 1, the delay counters left on the main scheme after scenario 2, and after scenario 4 which players were engaged with minions — one line to write names on, on paper; here a checkbox per player, since the app already knows who is playing. The allies removed from the campaign sit inside the scenario 4 box, as they do on the sheet. Everything else goes in Notes; a leading “~” strikes a list entry through.",

    /* Deutsche Feldnamen: MC10 ist auf Deutsch erschienen, aber die genaue
       Beschriftung des gedruckten deutschen Bogens ließ sich nicht belegen. Die
       mit „zu bestätigen“ markierten Zeilen bitte gegen den Bogen abgleichen
       und je eine Zeile korrigieren. Es migriert nichts, wenn sie sich ändern —
       persistiert werden nur Feldschlüssel, nie Beschriftungen. */
    i18n: {
      de: {
        secPlayers: "Spieler-Informationen",
        secScenario1: "Szenario 1",
        secScenario2: "Szenario 2",
        secScenario4: "Szenario 4",
        secRemoved: "Aus der Kampagne entfernte Verbündete",
        secNotes: "Notizen",

        /* "%s" = Spielernummer. */
        playerRow: "Spieler #%s",
        colIdentity: "Identität",
        colHp: "Verbleibende Trefferpunkte",
        identityPlaceholder: "Held …",
        addPlayer: "+ Spieler",
        addPlayerFull: "Mehr als vier Spieler kennt das Spiel nicht.",
        removePlayer: "Spieler entfernen",
        removePlayerLast: "Der letzte Spieler kann nicht entfernt werden.",
        confirmRemovePlayer: "Diesen Spieler samt Eintragungen entfernen?",
        duplicateHero: "Dieser Held ist schon einem anderen Spieler zugeordnet.",

        lblObligations: "Verpflichtungen",
        /* Zu bestätigen: Wortlaut der deutschen Ausgabe. */
        lblTechUpgrade: "Tech-Verbesserung",
        /* Zu bestätigen: Wortlaut der deutschen Ausgabe. */
        lblBasicUpgrade: "Basis-Verbesserung",
        lblRescuedAllies: "Gerettete Verbündete",

        /* Zu bestätigen: deutscher Kartenname der „Experimental Weapons“. */
        lblExperimentalWeapons: "Dem Begegnungsdeck hinzugefügte Experimentalwaffen",
        lblDelayCounters: "Verzögerungsmarker auf dem Hauptplan",
        lblEngaged: "Spieler im Gefecht mit Handlangern",

        cardNamePlaceholder: "Kartenname …",
        notesPlaceholder: "Notizen …",
      },
      en: {
        secPlayers: "Player Information",
        secScenario1: "Scenario 1",
        secScenario2: "Scenario 2",
        secScenario4: "Scenario 4",
        secRemoved: "Allies removed from the campaign",
        secNotes: "Notes",

        playerRow: "Player #%s",
        colIdentity: "Identity",
        colHp: "Remaining hit points",
        identityPlaceholder: "Hero …",
        addPlayer: "+ Player",
        addPlayerFull: "The game does not go beyond four players.",
        removePlayer: "Remove player",
        removePlayerLast: "The last player cannot be removed.",
        confirmRemovePlayer: "Remove this player along with what is filled in?",
        duplicateHero: "This hero is already assigned to another player.",

        lblObligations: "Obligations",
        lblTechUpgrade: "Tech Upgrade",
        lblBasicUpgrade: "Basic Upgrade",
        lblRescuedAllies: "Rescued Allies",

        lblExperimentalWeapons: "Experimental Weapons added to encounter deck",
        lblDelayCounters: "Number of delay counters on main scheme",
        lblEngaged: "Players engaged with minions",

        cardNamePlaceholder: "Card name …",
        notesPlaceholder: "Notes …",
      },
    },
  });
})(window);

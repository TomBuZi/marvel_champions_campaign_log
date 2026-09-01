/* Marvel Champions — "MojoMania" (MC39) campaign log.

   The one campaign in this app whose log is not sold as a sheet of its own.
   There is no separate campaign-log PDF: the log is printed on the BACK COVER
   of the rules insert, in both editions, under "Kampagnenlogbuch" / "Campaign
   Log" and with the usual permission to photocopy it. So nothing here is
   invented — it is the same field-faithful reading as everywhere else, only of
   a smaller page. Worth saying out loud, because "this campaign has no log" is
   the wrong conclusion to reach and an easy one.

   What the page prints: four player blocks — identity, remaining hit points,
   and two numbered lines for a support or upgrade — then two checkboxes asking
   whether Longshot was in play at the end of scenarios 1 and 2, and six named
   checkboxes for the modular encounter sets. That is the whole sheet.

   The two boon lines are numbered on paper, and the number is part of the
   entry: #1 is what was recorded after scenario 1, #2 after scenario 2.
   Scenario 2's setup brings back #1, scenario 3's brings back both. They are
   free text because the card comes out of the player's own deck.

   The six modular sets are named in both printed editions, so this module has
   no card table with `de: null` in it at all — there is no name here waiting
   for a German print, and nobody should go looking for one.

   The two editions do NOT print the six sets in the same places. English reads
   Crime / Fantasy / Horror down the left column, German reads Fantasy / Krimi /
   Horror. Both orders are kept and the displayed one follows the language, so
   whoever has the printed page beside them finds the same arrangement. Only the
   display order differs; the stored keys are the same either way, and they are
   the set codes from marvelsdb-json-data rather than slugs made up here.

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

  /* The two boon lines, in the order the sheet numbers them. The key carries
     the scenario the line belongs to, because that is what the number means. */
  var BOONS = [
    { key: "boon1", label: "colBoon1" },
    { key: "boon2", label: "colBoon2" },
  ];

  /* One box per scenario that asks about Longshot. Scenario 3 does not ask —
     there is no scenario after it to read the answer. */
  var LONGSHOT = [
    { key: "s1", label: "lblScenario1" },
    { key: "s2", label: "lblScenario2" },
  ];

  /* The six modular encounter sets. `key` is the set code from
     marvelsdb-json-data (sets.json); `label` is the i18n key, because both
     printed editions name these and neither name has to be carried in a table
     here. `order` is the printed reading order per edition — see the file
     header for why the two differ. */
  var SETS = [
    { key: "crime", label: "setCrime" },
    { key: "fantasy", label: "setFantasy" },
    { key: "horror", label: "setHorror" },
    { key: "sci-fi", label: "setSciFi" },
    { key: "sitcom", label: "setSitcom" },
    { key: "western", label: "setWestern" },
  ];
  var SET_ORDER = {
    de: ["fantasy", "sci-fi", "crime", "sitcom", "horror", "western"],
    en: ["crime", "sci-fi", "fantasy", "sitcom", "horror", "western"],
  };

  function setsInPrintOrder(lang) {
    var order = SET_ORDER[lang] || SET_ORDER.en;
    return order.map(function (key) {
      for (var i = 0; i < SETS.length; i++) if (SETS[i].key === key) return SETS[i];
      return null;
    });
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
      longshot: emptyLongshot(),
      sets: emptySets(),
    };
  }

  function newPlayer() {
    return { hero: "", deck: "", hp: null, boon1: "", boon2: "" };
  }

  function emptyLongshot() {
    var out = {};
    LONGSHOT.forEach(function (sc) { out[sc.key] = false; });
    return out;
  }

  function emptySets() {
    var out = {};
    SETS.forEach(function (s) { out[s.key] = false; });
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

    /* One to four, whatever arrived: a sheet with nobody on it has no meaning,
       and more than four is not a thing the game does. */
    var players = Array.isArray(raw.players) ? raw.players : [];
    var count = Math.min(MAX_PLAYERS, Math.max(1, players.length));
    out.players = [];
    for (var i = 0; i < count; i++) {
      var p = (players[i] && typeof players[i] === "object") ? players[i] : {};
      out.players.push({
        hero: W.coerceText(p.hero, NAME_MAX),
        deck: W.coerceDeck(p.deck),
        hp: W.clampNumber(p.hp === "" ? null : p.hp, 0, HP_MAX),
        boon1: W.coerceText(p.boon1, NAME_MAX),
        boon2: W.coerceText(p.boon2, NAME_MAX),
      });
    }

    /* Read by key, not by copying the object: an unknown key in the input is
       dropped and a missing one reads as false. Canonical output in the sheet's
       own order is what makes normalize() a fixpoint. */
    var longshot = (raw.longshot && typeof raw.longshot === "object") ? raw.longshot : {};
    LONGSHOT.forEach(function (sc) {
      out.longshot[sc.key] = W.coerceBool(longshot[sc.key]);
    });

    var sets = (raw.sets && typeof raw.sets === "object") ? raw.sets : {};
    SETS.forEach(function (s) {
      out.sets[s.key] = W.coerceBool(sets[s.key]);
    });

    return out;
  }

  function playerHasContent(player) {
    return !!player.hero.trim() || !!player.deck || player.hp != null ||
      !!player.boon1.trim() || !!player.boon2.trim();
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
    var text = W.el("span");
    text.textContent = labelText;
    flag.appendChild(text);
    flag.appendChild(W.checkbox({
      checked: cfg.checked,
      label: cfg.label || labelText,
      onChange: cfg.onChange,
    }));
    return flag;
  }

  /* A caption over a row of named boxes — the shape both of this sheet's
     question blocks take. */
  function checkRow(labelText, entries, cfg) {
    var wrap = W.el("div", "player-field");
    var caption = W.el("p", "field-label");
    caption.textContent = labelText;
    wrap.appendChild(caption);

    var row = W.el("div", "flag-row");
    entries.forEach(function (entry) {
      var name = cfg.nameOf(entry);
      row.appendChild(flagBox(name, {
        checked: cfg.isOn(entry),
        label: labelText + " – " + name,
        onChange: function (next) { cfg.onChange(entry, next); },
      }));
    });
    wrap.appendChild(row);
    return wrap;
  }

  function render(root, ctx) {
    var t = ctx.t, lang = ctx.lang, state = ctx.state;

    root.appendChild(renderPlayers(t, lang, state, ctx));

    /* The two question blocks side by side, in the order the paper prints them:
       .scenario-row is a two-column grid on a wide screen and one column on a
       narrow one. */
    var row = W.el("div", "scenario-row");
    row.appendChild(renderLongshot(t, state, ctx));
    row.appendChild(renderSets(t, lang, state, ctx));
    root.appendChild(row);
  }

  function renderLongshot(t, state, ctx) {
    var section = panel("longshot", t("secLongshot"));
    section.appendChild(checkRow(t("lblLongshot"), LONGSHOT, {
      nameOf: function (sc) { return t(sc.label); },
      isOn: function (sc) { return state.longshot[sc.key]; },
      onChange: function (sc, on) {
        state.longshot[sc.key] = on;
        ctx.save();
      },
    }));
    return section;
  }

  function renderSets(t, lang, state, ctx) {
    var section = panel("sets", t("secSets"));
    section.appendChild(checkRow(t("lblSets"), setsInPrintOrder(lang), {
      nameOf: function (s) { return t(s.label); },
      isOn: function (s) { return state.sets[s.key]; },
      onChange: function (s, on) {
        state.sets[s.key] = on;
        ctx.save();
      },
    }));
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

      var heroInput = W.identityField({
        value: player.hero,
        deck: player.deck,
        label: caption + " – " + t("colIdentity"),
        placeholder: t("identityPlaceholder"),
        maxLength: NAME_MAX,
        listId: listId,
        lang: lang,
        t: t,
        toast: ctx.toast,
        onChange: function (nextHero, nextDeck) {
          player.hero = nextHero;
          player.deck = nextDeck;
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

      /* Free text, and numbered: the card comes out of the player's own deck,
         so there is no printed set to offer, and the line it goes on says which
         scenario it was recorded after. */
      BOONS.forEach(function (boon) {
        card.appendChild(fieldRow(t(boon.label), W.textField({
          value: player[boon.key],
          label: caption + " – " + t(boon.label),
          placeholder: t("cardNamePlaceholder"),
          maxLength: NAME_MAX,
          onChange: function (next) { player[boon.key] = next; ctx.save(); },
        })));
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

    /* Two players cannot field the same hero — the campaign instructions say
       each player keeps their identity for the whole campaign. The paper sheet
       does not stop you, so neither do we, but a quiet marker beats silently
       allowing a typo to look correct. */
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
      /* Its own line rather than another "·" segment: the address is long,
         and on paper it has to stay readable enough to type back in. */
      if (p.deck) {
        printLine(players, "  " + t("deckPrint") + ": " +
          global.MCDB.shortUrl(p.deck));
      }
      /* Both lines, empty or not: the number is the whole point, so a blank #1
         with a filled #2 has to stay readable as that. */
      BOONS.forEach(function (boon) {
        printLine(players, "  " + t(boon.label) + ": " + (p[boon.key] || "—"));
      });
    });

    /* Every box on its own line, set or not: which sets were NOT used matters
       as much as which were, because that is exactly what the next scenario's
       setup asks. */
    var longshot = printSection(root, t("secLongshot"));
    printLine(longshot, t("lblLongshot") + ":");
    LONGSHOT.forEach(function (sc) {
      printLine(longshot, (state.longshot[sc.key] ? "[x] " : "[ ] ") + t(sc.label));
    });

    var sets = printSection(root, t("secSets"));
    printLine(sets, t("lblSets") + ":");
    setsInPrintOrder(lang).forEach(function (s) {
      printLine(sets, (state.sets[s.key] ? "[x] " : "[ ] ") + t(s.label));
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
    id: "mojomania",
    code: "MC39",
    titleEn: "MojoMania",
    /* The German edition keeps the English campaign title, as this project
       does throughout. */
    titleDe: "MojoMania",
    theme: "mojo",
    stateVersion: 1,

    emptyState: emptyState,
    normalize: normalize,
    render: render,
    renderPrint: renderPrint,

    helpDe: [
      "„Vorteil/Upgrade #1“ ist die Karte, die nach dem Sieg in Szenario 1 notiert wurde, „#2“ die nach Szenario 2 — die Nummer sagt also, aus welchem Szenario die Karte stammt. Der Aufbau von Szenario 2 bringt #1 wieder ins Spiel, der von Szenario 3 beide, jeweils gegen zusätzliche Bedrohung auf dem Hauptplan.",
      "Ein Longshot-Kästchen je Szenario 1 und 2, und der Aufbau des folgenden Szenarios liest es: war er am Ende im Spiel, darf ein Spieler ihn aufdecken, sonst wird er ins Begegnungsdeck gemischt. Szenario 3 fragt nicht mehr danach, weil kein Szenario mehr folgt.",
      "Ein angekreuztes Modulset ist verbraucht: das nächste Szenario darf es nicht wählen. Szenario 3 ist die Ausnahme — reichen die übrigen nicht, dürfen angekreuzte wieder gewählt werden, sobald alle anderen vergeben sind.",
    ],
    helpEn: [
      "“Support / Upgrade #1” is the card recorded after winning scenario 1 and “#2” the one after scenario 2 — the number says which scenario the card came from. Scenario 2's setup brings #1 back into play and scenario 3's brings back both, each at the cost of extra threat on the main scheme.",
      "One Longshot box for scenario 1 and one for scenario 2, and the next scenario's setup reads it: if he was in play at the end, one player may reveal him, otherwise he is shuffled into the encounter deck. Scenario 3 does not ask, because no scenario follows it.",
      "A checked modular set is spent: the next scenario cannot choose it. Scenario 3 is the exception — if the remaining sets do not stretch, checked ones become choosable again once every other has been taken.",
    ],

    /* Deutsche Feldnamen: wörtlich vom gedruckten deutschen Bogen auf der
       Rückseite des Regelhefts. Ändert sich eine, migriert nichts —
       persistiert werden nur Feldschlüssel, nie Beschriftungen. */
    i18n: {
      de: {
        secPlayers: "Spieler-Informationen",
        secLongshot: "Longshot",
        secSets: "Modulare Begegnungssets",

        /* "%s" = Spielernummer. */
        playerRow: "Spieler #%s",
        colIdentity: "Identität",
        colHp: "Verbleibende Lebenspunkte",
        identityPlaceholder: "Held oder Deck-ID …",
        cardNamePlaceholder: "Kartenname …",
        lblExpert: "Expertenmodus",
        expertHint: "Nur auf Expertenstufe werden verbleibende Lebenspunkte festgehalten. Ausschalten blendet sie aus, löscht sie aber nicht.",
        addPlayer: "+ Spieler",
        addPlayerFull: "Mehr als vier Spieler kennt das Spiel nicht.",
        removePlayer: "Spieler entfernen",
        removePlayerLast: "Der letzte Spieler kann nicht entfernt werden.",
        confirmRemovePlayer: "Diesen Spieler samt Eintragungen entfernen?",
        duplicateHero: "Dieser Held ist schon einem anderen Spieler zugeordnet.",

        /* „Vorteil/Upgrade“ steht so auf dem Bogen und auch im Fließtext des
           deutschen Regelhefts („einen Vorteil oder ein Upgrade“), obwohl die
           Kartentypen sonst „Unterstützung“ und „Verbesserung“ heißen. Die
           beiden Drucke dieses Produkts sind sich einig, also steht es hier so. */
        colBoon1: "Vorteil/Upgrade #1",
        colBoon2: "Vorteil/Upgrade #2",

        lblLongshot: "Ist Longshot am Ende des Szenarios im Spiel?",
        lblScenario1: "Szenario 1: MaGog",
        lblScenario2: "Szenario 2: Spiral",

        lblSets: "Kreuze verwendete modulare Begegnungssets an",
        setCrime: "Krimi",
        setFantasy: "Fantasy",
        setHorror: "Horror",
        setSciFi: "Sci-Fi",
        setSitcom: "Sitcom",
        setWestern: "Western",
      },
      en: {
        secPlayers: "Player Information",
        secLongshot: "Longshot",
        secSets: "Modular encounter sets",

        playerRow: "Player #%s",
        colIdentity: "Identity",
        colHp: "Remaining hit points",
        identityPlaceholder: "Hero or deck ID …",
        cardNamePlaceholder: "Card name …",
        lblExpert: "Expert level",
        expertHint: "The remaining hit points are only recorded at expert level. Switching off hides them, it does not clear them.",
        addPlayer: "+ Player",
        addPlayerFull: "The game does not go beyond four players.",
        removePlayer: "Remove player",
        removePlayerLast: "The last player cannot be removed.",
        confirmRemovePlayer: "Remove this player along with what is filled in?",
        duplicateHero: "This hero is already assigned to another player.",

        colBoon1: "Support / Upgrade #1",
        colBoon2: "Support / Upgrade #2",

        lblLongshot: "Is Longshot in play at game end?",
        lblScenario1: "Scenario 1: MaGog",
        lblScenario2: "Scenario 2: Spiral",

        lblSets: "Check off modular encounter sets when used",
        setCrime: "Crime",
        setFantasy: "Fantasy",
        setHorror: "Horror",
        setSciFi: "Sci-Fi",
        setSitcom: "Sitcom",
        setWestern: "Western",
      },
    },
  });
}(window));

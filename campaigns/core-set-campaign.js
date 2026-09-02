/* Marvel Champions — "Core Set Campaign" / "Grundspiel Kampagne" (MC01)
   campaign log.

   The only sheet in this app that does not come from the publisher. There is no
   official campaign for the Core Set: the three scenarios ship as standalone
   adventures, and this campaign — setup and victory instructions that chain
   them into a run, plus the log at the end of the document — was written by the
   German Marvel Champions podcast "Die Abteilung für übermenschliches Recht"
   (MarvelChampionsPodcast.de) and published as a PDF in both languages. So the
   `code` is MC01 because that is the PRODUCT the sheet belongs to, not because
   the sheet is Fantasy Flight's. Worth saying out loud: a later reader who goes
   looking for the publisher's Core Set log sheet will not find one.

   Everything else here is the usual field-faithful reading. The sheet is one
   page and prints four player blocks, each with four lines: identity, remaining
   hit points, and two numbered lines for a support or upgrade. That is the whole
   sheet — no scenario table, no checkboxes, no notes, nothing but those blocks.
   It is therefore the leanest sheet in this app, and the missing sections are a
   statement about the paper rather than an unfinished job here.

   Which makes it, structurally, MC39's player block and nothing else. The two
   sheets even agree on the wording of the numbered lines — "Vorteil/Upgrade #1"
   in German, "Support / Upgrade #1" in English — so the labels here are taken
   from this sheet's own print and happen to match MC39's rather than being
   copied from it.

   The two boon lines are numbered on paper, and the number is part of the
   entry: #1 is what was recorded after scenario 1, #2 after scenario 2.
   Scenario 2's setup brings back #1, scenario 3's brings back both. They are
   free text because the card comes out of the player's own deck, so there is no
   card table here at all — and therefore no `de: null` waiting for a German
   print. Nobody should go looking for one.

   Both editions of the campaign PDF were available while this was written, so
   nothing here is a placeholder: every label is the printed German or English
   wording. Both editions also print the sheet identically, unlike MC39, whose
   two prints arrange the same boxes differently — so there is one display order
   and it does not depend on the language.

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

  // ---- Data ----------------------------------------------------------------
  function emptyState() {
    return {
      /* Standard or expert level. Only the display follows this: switching back
         to standard HIDES the remaining hit points, it does not clear them, so
         a sheet toggled by accident loses nothing. */
      expert: false,
      /* A fresh sheet starts with a single player; more are added as needed. */
      players: [newPlayer()],
    };
  }

  function newPlayer() {
    return { hero: "", deck: "", hp: null, boon1: "", boon2: "" };
  }

  /* Never throws. Starts from emptyState() and overlays only what it
     recognises, so a hand-edited file, a foreign export or a truncated share
     link cannot produce an invalid sheet. Fields this sheet does not have —
     MC60's `scenarios`, MC21's `flags`, MC39's `sets` — are simply never read,
     which is how they get dropped. */
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

  /* The whole sheet is one panel: the player blocks are all the paper prints. */
  function render(root, ctx) {
    root.appendChild(renderPlayers(ctx.t, ctx.lang, ctx.state, ctx));
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

      /* Expert only: the remaining hit points set the starting hit points of
         the next scenario, which is a rule the standard campaign does not have. */
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
       each player keeps their identity for the whole campaign, in as many words.
       The paper sheet does not stop you, so neither do we, but a quiet marker
       beats silently allowing a typo to look correct. */
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
  /* A plain text snapshot. */
  function renderPrint(root, ctx) {
    var t = ctx.t, state = ctx.state;

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
    id: "core-set-campaign",
    code: "MC01",
    /* Both titles are printed, one per edition, so unlike every other campaign
       here the German name is not the English one kept as-is. */
    titleEn: "Core Set Campaign",
    titleDe: "Grundspiel Kampagne",
    theme: "csc",
    stateVersion: 1,

    emptyState: emptyState,
    normalize: normalize,
    render: render,
    renderPrint: renderPrint,

    helpDe: [
      "Diese Kampagne verknüpft die drei Szenarien des Grundspiels — Rhino, Klaw, Ultron — zu einem Durchlauf. Sie stammt nicht vom Verlag: Anweisungen und Bogen kommen aus der Fan-Kampagne des Podcasts „Die Abteilung für übermenschliches Recht“ (MarvelChampionsPodcast.de), die es als PDF in beiden Sprachen gibt. Einen offiziellen Grundspiel-Bogen gibt es nicht.",
      "„Vorteil/Upgrade #1“ ist die Karte, die nach dem Sieg in Szenario 1 notiert wurde, „#2“ die nach Szenario 2 — die Nummer sagt also, aus welchem Szenario die Karte stammt. Der Aufbau von Szenario 2 bringt #1 wieder ins Spiel, der von Szenario 3 beide, jeweils gegen zusätzliche Bedrohung in Höhe der Kartenkosten auf dem Hauptplan. Notiert werden darf ein Vorteil oder ein Upgrade mit Kosten 2 oder weniger — 3 oder weniger, falls am Ende von Szenario 1 keine Bedrohung auf dem Hauptplan lag beziehungsweise am Ende von Szenario 2 kein Anhang an Klaw anhing. Karten ohne Kosten sind ausgeschlossen.",
    ],
    helpEn: [
      "This campaign chains the three Core Set scenarios — Rhino, Klaw, Ultron — into a single run. It is not the publisher's: the instructions and the sheet come from the fan campaign by the podcast “Die Abteilung für übermenschliches Recht” (MarvelChampionsPodcast.de), which publishes it as a PDF in both languages. There is no official Core Set log sheet.",
      "“Support / Upgrade #1” is the card recorded after winning scenario 1 and “#2” the one after scenario 2 — the number says which scenario the card came from. Scenario 2's setup brings #1 back into play and scenario 3's brings back both, each at the cost of extra threat equal to the cards' cost on the main scheme. What may be recorded is a support or upgrade costing two or less — three or less if there was no threat on the main scheme at the end of scenario 1, or no attachment attached to Klaw at the end of scenario 2. Cards without a cost are excluded.",
    ],

    /* Deutsche Feldnamen: wörtlich vom gedruckten deutschen Bogen der
       Fan-Kampagne. Ändert sich eine, migriert nichts — persistiert werden nur
       Feldschlüssel, nie Beschriftungen. */
    i18n: {
      de: {
        secPlayers: "Spieler-Informationen",

        /* "%s" = Spielernummer. Der Bogen druckt Nummer und Identität in einer
           Zeile („Identität Spieler #1:“); hier trägt der Kartenkopf die
           Nummer und die Feldzeile die Identität, wie in allen Kampagnen. */
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
           deutschen Dokuments („einen Vorteil oder ein Upgrade“), obwohl die
           Kartentypen sonst „Unterstützung“ und „Verbesserung“ heißen. Damit
           liest es sich wie auf dem MC39-Bogen — dieselbe Wahl, unabhängig
           getroffen, nicht von dort übernommen. */
        colBoon1: "Vorteil/Upgrade #1",
        colBoon2: "Vorteil/Upgrade #2",
      },
      en: {
        secPlayers: "Player Information",

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
      },
    },
  });
}(window));

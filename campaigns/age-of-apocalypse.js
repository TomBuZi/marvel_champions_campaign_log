/* Marvel Champions — "Age of Apocalypse" (MC45) campaign log.

   One printed page, 540 by 540 points, and the leanest of all the sheets: a
   player block, one table of four rows, and a footer of five named boxes. That
   is the whole sheet. There is no scenario table, no "completed", no progress
   counter and no notes field, because the sheet prints none — the campaign has
   five scenarios (Unus, Bishop, Magik, Dark Beast, En Sabah Nur) and the log
   asks about not one of them. Those absences are the sheet, not an omission.
   Nor is the fifth MISSION side scheme, Protect the Professor, missing: it is
   reserved for scenario #5 and never available to pick, so the paper leaves it
   out too. And there is no glyph from the publisher's icon font anywhere on
   the page — the span sweep returns only Exo2 and KomikaTitle — so there is no
   {pp} marker here, unlike MC27.

   THE SAME TEMPLATE AS MC32 AND MC40, WITH THE SAME TRAP. get_images() reports
   one raster over the whole page plus one over every panel strip, so the orange
   comic border and its black hatching exist in no vector fill at all, while the
   #C7AAAA full-page fill that the area measurement puts second at 25.6% lies
   UNDERNEATH that raster and is never visible. The palette in styles.css says
   for every value which of the two methods it came out of, and it says which of
   its values are the same swatch MC32 measured — because they are, and a later
   reader would otherwise "clean up" a duplication that is a fact about the
   publisher's template rather than a copy-paste.

   WHAT EACH FIELD HOLDS, derived from the print plus the rulebook, never from
   memory. Cell counts come off the divider lines of the content stream:

     * Four player panels across the top (y 39-145), each printing an identity
       line and "Remaining hit points:".
     * One table, header row at y 142.9-173.1 and EXACTLY FOUR data rows at
       y 170-253, 250-333, 329-413 and 409-493, over four columns: the mission
       side scheme, then Setup, Defeated and Not Defeated. The last three carry
       printed rule text in every row.
     * EXACTLY FIVE checkboxes in the footer at y 507.5, at x 74.2, 162.5,
       261.2, 308.7 and 378.4, under the one heading "Available Overseer
       minions:". That is the MC21 shape: one caption over named boxes, and the
       checkbox itself is the "check here".

   THE TWO MARKS DO NOT MEAN THE SAME THING, and this is the thing about the
   sheet most easily got wrong. The rulebook (p. 6, DE p. 6): "update the
   campaign log by striking out the name of the mission side scheme that started
   the game in play. Then, follow the instructions for 'defeated' or 'not
   defeated'" — and separately: "If an OVERSEER minion was defeated that game,
   strike its name from the campaign log." So a struck mission means IT WAS IN
   PLAY, whatever the outcome; a struck overseer means IT WAS DEFEATED. Both end
   up as "no longer available" (p. 5: available unless struck), but they get
   there for different reasons, and the help text says so.

   WHY THE MISSION ROW HAS TWO BOXES AND THE PAPER HAS NONE. The printed table
   has no checkbox anywhere in it: you cross the name out with a pen, and the
   two outcome columns are instructions to read. A screen has to offer the
   strike as something clickable, and the two printed outcome columns are where
   the decision actually lives — so the box sits in each of them, they exclude
   each other, and either one strikes the name. That records ONE BIT MORE than
   the paper does: which branch applied. Deliberately so, and worth writing
   down, because everything in those two columns holds "for the rest of the
   campaign" — the paper expects you to remember which one you followed, and a
   log whose whole job is remembering should not.

   THE LOCK IS ONE-SIDED, the MC60/MC32/MC40 rule. A ticked box always stays
   operable: normalize() picks no winner when a row arrives with both boxes set
   — from an import, a hand-edited file or an old #log= link — so the way out of
   the contradiction has to be on screen, and the contradiction gets named under
   the table instead of resolved behind the user's back.

   THE STRUCK NAME IS DIMMED, THE ROW IS NOT. MC32 dims a removed row whole,
   because there the row is finished with. Here the two outcome texts stay in
   force for the rest of the campaign precisely BECAUSE the mission was played,
   so dimming them would fade out the one thing the row is still for. Only the
   name carries the strike and the dim.

   THE EXPERT FIELD, AND WHERE IT COMES FROM. The remaining hit points sit
   behind the expert switch as they do in every module, but — exactly as on
   MC40's sheet and unlike MC32's — this printed sheet does NOT mark the field
   "(expert)". The rulebook is unambiguous where the print is silent, p. 20
   under PERSISTENT DAMAGE: "While playing the Age of Apocalypse campaign at the
   expert level, each player must record their remaining hit points in the
   campaign log after they win a game. This determines each player's starting
   hit points for the next scenario." The German printing says the same under
   BLEIBENDER SCHADEN and leaves the field unmarked as well, so this is the
   edition and not one printing's slip. The switch is right and the print simply
   omits the marker — written down here, or a later reader "fixes" the gate
   away. Hides, never clears: the value stays in the sheet, in the JSON export
   and in a share link. See `expert` below.

   GERMAN IS NOT OPEN WORK HERE. Unlike MC40, whose German sheet had to be
   tracked down after the fact, the German rulebook of this expansion prints the
   complete German log on its page 24. Every printed string below is read off
   that page at its coordinates, so each row's four cells stay paired with the
   row they are printed in. Nothing in this file is a translation of ours.

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

  /* ---- CARD SETS -----------------------------------------------------------
     Every card carries an English and a German name, as in MC10, MC21, MC27,
     MC32 and MC40. `de: null` shows the English name and tags it lang="en".

     Checked against C:\Repos\marvelsdb-json-data: the four missions are the
     `aoa_mission` set (45166a/b, 45167a/b, 45168a/b, 45169a/b — 45170a/b is
     Protect the Professor, which the log does not print), the five minions are
     the `overseer` set (45179a to 45183a), and the cards the rule texts name
     are `aoa_campaign` (45177 North American Sea Wall, 45178 Panicked Refugees)
     and `aoa_basic_campaign` (45176 Desperate Measures). Its German translation
     files carry NO entry for any of those codes, so not one German string below
     could have come from there. They come from the German printing:
     "marvel-champions-age-of-apocalypse-841333125257-regel.pdf", page 24. */

  /* The four MISSION side schemes the log prints, in the printed row order —
     which is NOT the card numbering (Evacuate Survivors is 1/5 in the English
     printing and 2/5 in the German one; the sheet's order is the sheet's).

     Each row carries the three printed rule texts beside its name. They are
     read-only on the sheet and read-only here: nothing about them is ever
     entered, and dropping them would lose the pairing that is the whole point
     of the table. Every one of them is translated in the German printing, so
     there is no `de: null` in this table at all. */
  var MISSIONS = [
    {
      slug: "liberate-the-seattle-core",
      en: "Liberate the Seattle Core",
      de: "Den Kern von Seattle befreien",
      setup: {
        en: "Set each copy of Desperate Measures upgrade aside.",
        de: "Legt jedes Exemplar des Upgrades Verzweifelte Maßnahmen beiseite.",
      },
      defeated: {
        en: "For the rest of the campaign, each player may shuffle 1 copy of Desperate Measures into their deck at the start of each game. That card does not count against your minimum deck size.",
        de: "Für den Rest der Kampagne: Jeder Spieler darf zu Beginn jeder Partie 1 Exemplar von Verzweifelte Maßnahmen in sein Deck mischen. Diese Karte wird nicht auf die Deckgröße angerechnet.",
      },
      notDefeated: {
        en: "Remove each copy of Desperate Measures from the campaign.",
        de: "Entfernt jedes Exemplar von Verzweifelte Maßnahmen aus der Kampagne.",
      },
    },
    {
      slug: "evacuate-survivors",
      en: "Evacuate Survivors",
      de: "Überlebende evakuieren",
      setup: {
        en: "Each player shuffles a copy of Panicked Refugees into their deck.",
        de: "Jeder Spieler mischt ein Exemplar von Panische Flüchtlinge in sein Deck.",
      },
      defeated: {
        /* "1 copy of card" is the publisher's own typesetting slip — the word
           "that" is missing on the printed English sheet and in the English
           rulebook's page 24 alike. It stays verbatim: this string is a
           quotation of the paper, not our prose. The German printing has no
           such gap, which is why only the English side reads oddly. */
        en: "Remove each copy of Panicked Refugees from the campaign. Each player chooses an upgrade from any aspect. They may include 1 copy of card in their deck for the rest of the campaign. That card does not count against your minimum deck size.",
        de: "Entfernt jedes Exemplar Panische Flüchtlinge aus der Kampagne. Jeder Spieler wählt 1 Upgrade eines beliebigen Aspekts, das er für den Rest der Kampagne in sein Deck aufnehmen darf. Es wird nicht auf die Deckgröße angerechnet.",
      },
      notDefeated: {
        en: "For the rest of the campaign, each player must shuffle a copy of Panicked Refugees into their deck at the start of each game.",
        de: "Für den Rest der Kampagne: Jeder Spieler muss zu Beginn jeder Partie ein Exemplar von Panische Flüchtlinge in sein Deck mischen.",
      },
    },
    {
      slug: "sabotage-the-sea-wall",
      en: "Sabotage the Sea Wall",
      de: "Den Meereswall sabotieren",
      setup: {
        en: "Shuffle the North American Sea Wall side scheme into the encounter deck.",
        de: "Mischt den Nebenplan Nordamerikanischer Meereswall in das Begegnungsdeck.",
      },
      defeated: {
        en: "Remove the North American Sea Wall side scheme from the campaign. Each player chooses a support from any aspect. They may include 1 copy of that card in their deck for the rest of the campaign. That card does not count against your minimum deck size.",
        /* The German page breaks "Nordamerikanischer" across two lines with a
           soft hyphen; joined back up here, because a soft hyphen in a string
           is invisible until it lands mid-word somewhere else. */
        de: "Entfernt den Nebenplan Nordamerikanischer Meereswall aus der Kampagne. Jeder Spieler wählt 1 Vorteil eines beliebigen Aspekts, den er für den Rest der Kampagne in sein Deck aufnehmen darf. Er wird nicht auf die Deckgröße angerechnet.",
      },
      notDefeated: {
        en: "For the rest of the campaign, shuffle the North American Sea Wall into the encounter deck during setup.",
        de: "Für den Rest der Kampagne: Mischt während des Spielaufbaus den Nebenplan Nordamerikanischer Meereswall in das Begegnungsdeck.",
      },
    },
    {
      slug: "find-lost-mutants",
      en: "Find Lost Mutants",
      de: "Vermisste Mutanten finden",
      setup: {
        en: "Set each campaign ally aside.",
        de: "Legt jeden Kampagne-Verbündeten beiseite.",
      },
      defeated: {
        en: "Each player chooses a campaign ally. They may include that ally in their deck for the rest of the campaign. That card does not count against your minimum deck size.",
        de: "Jeder Spieler wählt 1 Kampagne-Verbündeten, den er für den Rest der Kampagne in sein Deck aufnehmen darf. Diese Karte wird nicht auf die Deckgröße angerechnet.",
      },
      notDefeated: {
        en: "Remove each campaign ally from the campaign.",
        de: "Entfernt jeden Kampagne-Verbündeten aus der Kampagne.",
      },
    },
  ];

  /* The five OVERSEER minions, in the printed order of the footer. The German
     printing keeps all five names English — the MC10/MC21/MC32/MC40 DECISION
     rather than MC27's "not entered yet", and evidenced by the German sheet
     itself rather than inferred from the convention.

     ONE OF THEM IS NOT `de: null`, and the reason matters: the German sheet
     drops the article and prints "Shadow King" where the English one prints
     "The Shadow King". A different string, so it goes in `de` — and the
     consequence is that this one entry shows WITHOUT lang="en" although its
     words are English, because the tag tracks whether the German printing set
     a string of its own, which is the only thing this table can know. The
     alternative would be a second mechanism for a single card. */
  var OVERSEERS = [
    { slug: "mister-sinister",   en: "Mister Sinister",   de: null },
    { slug: "the-shadow-king",   en: "The Shadow King",   de: "Shadow King" },
    { slug: "abyss",             en: "Abyss",             de: null },
    { slug: "sugar-man",         en: "Sugar Man",         de: null },
    { slug: "mikhail-rasputin",  en: "Mikhail Rasputin",  de: null },
  ];

  // ---- Lookups -------------------------------------------------------------
  /* The name to show, and the language tag that goes with it. An English name
     shown in a German sheet has to be tagged, or a screen reader announces it
     in the wrong voice; a translated one must NOT be tagged. Works on the
     nested setup/defeated/notDefeated objects too, which carry no slug. */
  function entryName(entry, lang) {
    return (lang === "de" && entry.de) ? entry.de : entry.en;
  }
  function entryLang(entry, lang) {
    return (lang === "de" && entry.de) ? null : "en";
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
      /* One row per printed mission, in the table's own order, each holding the
         two things that are entered. The three rule texts of the row are
         printed matter and live in MISSIONS, never in the state. */
      missions: emptyMissions(),
      /* One flag per printed minion, keyed by slug: ticked means the name is
         struck, i.e. the minion was defeated and is no longer available. A map
         rather than a row, because the footer is a set of named boxes and no
         position on it means anything. */
      overseers: emptyOverseers(),
    };
  }

  function newPlayer() {
    return { hero: "", hp: null };
  }

  function emptyMissions() {
    return MISSIONS.map(function () {
      return { defeated: false, notDefeated: false };
    });
  }

  function emptyOverseers() {
    var out = {};
    OVERSEERS.forEach(function (entry) { out[entry.slug] = false; });
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
      });
    }

    /* Rebuilt from MISSIONS every time, so there are always exactly four rows
       in the printed order however few or many arrived. Each field is read BY
       KEY rather than by copying the object, so an invented key is dropped and
       a missing one reads as false.

       DELIBERATELY DOES NOT RESOLVE a row that arrives with both boxes set. A
       mission is either defeated or not, so both at once is a contradiction —
       but which of the two was meant is not ours to guess, and silently picking
       one would overwrite a record instead of flagging it. paintMissions()
       names it and leaves both boxes operable. Same rule as MC40's `earned`. */
    var rows = Array.isArray(raw.missions) ? raw.missions : [];
    out.missions = MISSIONS.map(function (entry, at) {
      var row = (rows[at] && typeof rows[at] === "object") ? rows[at] : {};
      return {
        defeated: W.coerceBool(row.defeated),
        notDefeated: W.coerceBool(row.notDefeated),
      };
    });

    /* Rebuilt from OVERSEERS the same way: exactly the five printed keys, so an
       invented minion is dropped and a missing one reads as not struck. */
    var seen = (raw.overseers && typeof raw.overseers === "object") ? raw.overseers : {};
    out.overseers = {};
    OVERSEERS.forEach(function (entry) {
      out.overseers[entry.slug] = W.coerceBool(seen[entry.slug]);
    });

    return out;
  }

  /* No migrate(): stateVersion is 1, so there is no older shape in the wild
     yet. The first change to the shape above has to bring one with it — see the
     check in test/lint.js. Note especially that anything added beside
     `defeated` and `notDefeated` has to decide what its default MEANS for
     sheets that are already saved: MC60 learned that the hard way, where
     `expert: false` hid hit points people had already written down. */

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

  /* A mission whose name is struck: it was in play, so it is spent. Either box
     does it — that is the point of the rule, which strikes the name whatever
     the outcome was. */
  function isStruck(row) {
    return row.defeated || row.notDefeated;
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

  /* One box with its own wording — MC21's shape, and used here for the footer's
     five named minions. */
  function flagBox(labelText, cfg) {
    var flag = W.el("label", "flag" + (cfg.struck ? " is-struck" : ""));
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

  function render(root, ctx) {
    var t = ctx.t, lang = ctx.lang, state = ctx.state;

    root.appendChild(renderPlayers(t, lang, state, ctx));
    root.appendChild(renderMissions(t, lang, state, ctx));
    root.appendChild(renderOverseers(t, lang, state, ctx));

    /* Last, once the table is in the document: which boxes are closed follows
       the two boxes of a row together, so it cannot be decided while a single
       cell is being built. Derived, never stored. */
    paintMissions(t, state);
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
         rulebook records it at expert level alone, where it sets the starting
         hit points of the next scenario. Hidden at standard level, never
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
    return section;
  }

  /* The table, as the sheet prints it: the mission down the side, then Setup,
     then the two outcome columns. Setup is read-only text; the two outcome
     columns carry their printed text AND the box that records which of them
     applied, because on paper the decision is made by reading exactly those two
     cells. See the file header for why there are two boxes where the paper has
     none.

     The panel heading is the plural the rulebook uses ("MISSION side schemes",
     DE "MISSION-Nebenpläne"), not an invented section name: this table is the
     only thing the sheet prints over it, and the singular stays where the sheet
     puts it, on the first column. */
  function renderMissions(t, lang, state, ctx) {
    var section = panel("missions", t("secMissions"));

    var table = W.el("table", "sheet-table ms-table");
    var caption = W.el("caption", "sr-only");
    caption.textContent = t("secMissions");
    table.appendChild(caption);

    var thead = W.el("thead");
    var hrow = W.el("tr");
    [t("colMission"), t("colSetup"), t("colDefeated"),
      t("colNotDefeated")].forEach(function (text) {
      var th = W.el("th", null, { scope: "col" });
      th.textContent = text;
      hrow.appendChild(th);
    });
    thead.appendChild(hrow);
    table.appendChild(thead);

    var tbody = W.el("tbody");
    MISSIONS.forEach(function (entry, at) {
      var row = state.missions[at];
      var name = entryName(entry, lang);
      var tr = W.el("tr", null, { "data-mission-row": entry.slug });

      var rowHead = W.el("th", "card-name", { scope: "row", lang: entryLang(entry, lang) });
      rowHead.textContent = name;
      tr.appendChild(rowHead);

      tr.appendChild(printedCell(entry.setup, lang, t("colSetup")));
      tr.appendChild(outcomeCell(t, name, entry, lang, "defeated", state, row, ctx));
      tr.appendChild(outcomeCell(t, name, entry, lang, "notDefeated", state, row, ctx));

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

  /* One read-only rule text in its printed column. A <td> rather than a second
     row header: it names nothing, it is an instruction to follow. */
  function printedCell(entry, lang, label) {
    var td = W.el("td", "rule-cell", { "data-label": label, lang: entryLang(entry, lang) });
    td.textContent = entryName(entry, lang);
    return td;
  }

  /* The two outcome columns, as state field -> the attribute its box is found
     by. Spelled out rather than built from the field name: setAttribute()
     lowercases an attribute name on an HTML element, so a computed
     "data-mission-notDefeated" would silently land as ...notdefeated, and only
     the case-insensitivity of attribute selectors would paper over it. */
  var OUTCOMES = {
    defeated: "data-mission-defeated",
    notDefeated: "data-mission-notdefeated",
  };
  var OUTCOME_KEYS = ["defeated", "notDefeated"];

  function outcomeLabel(t, key) {
    return key === "defeated" ? t("colDefeated") : t("colNotDefeated");
  }

  /* One of the two outcome columns: the box that records this outcome, above
     the printed text that says what following it means. `key` is both the state
     field and the column, so the two can never drift apart. */
  function outcomeCell(t, name, entry, lang, key, st, row, ctx) {
    var label = outcomeLabel(t, key);
    var td = W.el("td", "outcome-cell", { "data-label": label });

    var box = W.checkbox({
      checked: row[key],
      /* Row and column together, because a bare checkbox in a grid is
         otherwise unnameable. */
      label: name + " – " + label,
      onChange: function (next) {
        row[key] = next;
        ctx.save();
        /* In place: no label and no control appears or disappears, only which
           box is open and whether the name is struck. Cross-cell effects are
           painted, never re-rendered — the MC27/MC32/MC40 rule. */
        paintMissions(t, st);
      },
    });
    box.setAttribute(OUTCOMES[key], entry.slug);
    td.appendChild(box);

    var text = W.el("p", "rule-text", { lang: entryLang(entry[key], lang) });
    text.textContent = entryName(entry[key], lang);
    td.appendChild(text);
    return td;
  }

  function renderOverseers(t, lang, state, ctx) {
    var section = panel("overseers", t("secOverseers"));

    /* One caption over named boxes — MC21's shape, and the sheet's: the five
       minions sit in one footer strip under a single heading, and the checkbox
       itself is the "strike his name" of the rule. The heading is already the
       caption, so the row does not print it a second time. */
    var wrap = W.el("div", "player-field");
    var row = W.el("div", "flag-row");
    OVERSEERS.forEach(function (entry) {
      var on = state.overseers[entry.slug];
      /* Assigned before the box can ever be clicked, so the handler can reach
         its own label: a re-render would take the focus off the box just
         ticked, and the only visible change is the strike on this one name. */
      var flag = flagBox(entryName(entry, lang), {
        lang: entryLang(entry, lang),
        checked: on,
        struck: on,
        label: t("secOverseers") + " – " + entryName(entry, lang),
        onChange: function (next) {
          state.overseers[entry.slug] = next;
          ctx.save();
          flag.classList.toggle("is-struck", next);
        },
      });
      row.appendChild(flag);
    });
    wrap.appendChild(row);
    section.appendChild(wrap);

    /* The heading says "Available", the tick says "struck", and those are
       opposites. Spelled out under the boxes rather than left to the help text,
       because the reading is the sheet's and it is not obvious. */
    var hint = W.el("p", "hint");
    hint.textContent = t("overseerHint");
    section.appendChild(hint);
    return section;
  }

  /* Everything about the table that follows the two boxes of a row TOGETHER,
     derived every time and nothing stored:

       * a mission is either defeated or not, so one ticked box closes the
         other;
       * that lock is ONE-SIDED. A box that is already ticked stays operable:
         normalize() picks no winner when a row arrives with both set, so the way
         out of the contradiction has to be on screen, and a sheet coming from an
         import or an old #log= link must never be frozen solid. The note below
         the table names it instead;
       * the name is struck once either box is set, because the rule strikes it
         whatever the outcome was. Only the name — the two outcome texts stay in
         force for the rest of the campaign, so dimming them would fade out the
         one thing the row is still good for.

     What it deliberately does NOT do is mark a row with no box set. That is
     simply a mission still available, which is the state a fresh sheet is in. */
  function paintMissions(t, st) {
    var conflicts = 0;

    MISSIONS.forEach(function (entry, at) {
      var row = st.missions[at];
      var tr = document.querySelector('[data-mission-row="' + entry.slug + '"]');
      if (tr) tr.classList.toggle("is-struck", isStruck(row));

      OUTCOME_KEYS.forEach(function (key) {
        var box = document.querySelector('[' + OUTCOMES[key] + '="' + entry.slug + '"]');
        if (!box) return;
        var other = key === "defeated" ? "notDefeated" : "defeated";
        var locked = row[other] && !row[key];
        box.disabled = locked;
        box.classList.toggle("is-locked", locked);
        box.title = locked ? t("outcomeExcluded", outcomeLabel(t, other))
          : (box.getAttribute("aria-label") || "");
      });

      if (row.defeated && row.notDefeated) conflicts++;
    });

    var note = document.querySelector('[data-section="missions"] > .lock-note');
    if (note) note.textContent = conflicts ? t("bothOutcomes") : "";
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

    /* Every printed row on its own line, undecided ones included: a mission
       with neither box set is still available, which is information about the
       campaign rather than a gap. The struck name carries the strike, exactly
       as the pen does on the paper, and the two boxes say which branch was
       followed. Whether a box is currently closed is NOT printed: the printout
       records what was written down, not what the screen would allow.

       The three printed rule texts are deliberately NOT printed, and this is
       where MC45 parts company with MC40. There the read-only columns are card
       NAMES — they identify what the row pays out, so a printout without them
       would not be the sheet. Here they are instructions, twelve paragraphs of
       them, and printing them would bury the four lines that are the actual
       record under the reference material. The instruction is on the paper
       sheet and in the rulebook; which branch was followed is only here. */
    var ms = printSection(root, t("secMissions"));
    MISSIONS.forEach(function (entry, at) {
      var row = state.missions[at];
      var line = W.el("p", "print-line");
      var name = W.el("span", isStruck(row) ? "struck" : null,
        { lang: entryLang(entry, lang) });
      name.textContent = entryName(entry, lang);
      line.appendChild(name);
      line.appendChild(document.createTextNode(
        " · " + (row.defeated ? "[x] " : "[ ] ") + t("colDefeated") +
        " · " + (row.notDefeated ? "[x] " : "[ ] ") + t("colNotDefeated")));
      ms.appendChild(line);
    });

    /* Every minion on its own line, struck or not: which ones are still
       available matters as much as which are gone, because every setup after
       this one draws from exactly what is left. */
    var ov = printSection(root, t("secOverseers"));
    OVERSEERS.forEach(function (entry) {
      var on = state.overseers[entry.slug];
      var line = W.el("p", "print-line");
      line.appendChild(document.createTextNode(on ? "[x] " : "[ ] "));
      var name = W.el("span", on ? "struck" : null, { lang: entryLang(entry, lang) });
      name.textContent = entryName(entry, lang);
      line.appendChild(name);
      ov.appendChild(line);
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
    id: "age-of-apocalypse",
    code: "MC45",
    titleEn: "Age of Apocalypse",
    /* The German edition keeps the English campaign title, as this project does
       throughout — and here the German rulebook says so itself, writing "die
       Kampagne Age of Apocalypse" on every page that names it. */
    titleDe: "Age of Apocalypse",
    theme: "aoa",
    stateVersion: 1,

    emptyState: emptyState,
    normalize: normalize,
    render: render,
    renderPrint: renderPrint,

    helpDe: "Der MC45-Bogen ist der schlankeste von allen: der Spielerbereich, darunter eine Tabelle mit vier Zeilen, darunter fünf benannte Kästchen. Mehr druckt das Papier nicht. Die vier Zeilen sind die vier Mission-Nebenpläne, und ihre drei Textspalten — Spielaufbau, Besiegt, Nicht besiegt — sind gedruckter Regeltext, an dem nichts eingetragen wird. Eingetragen wird das Ergebnis, und zwar in den beiden Ergebnisspalten selbst: ein Häkchen bei „Besiegt“ oder bei „Nicht besiegt“. Auf dem Papier steht dort kein Kästchen — die Regel sagt, man solle den Namen durchstreichen und dann die Anweisung daneben befolgen. Das Häkchen IST dieses Durchstreichen, und weil es in der Spalte sitzt, hält es zugleich fest, welcher der beiden Zweige gilt. Das ist ein Bit mehr, als das Papier führt, und bewusst so: alles in diesen beiden Spalten gilt „für den Rest der Kampagne“, das Papier erwartet also, dass man sich erinnert — ein Logbuch sollte das nicht. Beide Kästchen schließen einander aus; eine Mission ist entweder besiegt oder nicht. Die Sperre ist einseitig, wie bei MC60, MC32 und MC40: ein bereits gesetztes Häkchen bleibt bedienbar. Das ist wichtiger, als es klingt — kommt ein Bogen aus einem Import oder einem alten Link mit beiden Häkchen an, kürt niemand einen Sieger, und der Ausweg muss auf dem Bildschirm liegen. Der Widerspruch wird stattdessen unter der Tabelle benannt. Der durchgestrichene Name ist abgeblendet, die Zeile nicht: der Text der Ergebnisspalten bleibt in Kraft, gerade weil die Mission gespielt wurde, und ihn auszublenden würde das Einzige verblassen lassen, wofür die Zeile noch da ist. Die fünf Kästchen darunter sind die Aufseher-Schergen. Achtung auf die Leserichtung: die Überschrift heißt „Verfügbare Aufseher-Schergen“, das Häkchen bedeutet aber „durchgestrichen“, also nicht mehr verfügbar. Und die beiden Markierungen des Bogens bedeuten nicht dasselbe: ein durchgestrichener Missionsname heißt „war im Spiel, also verbraucht“ — ganz unabhängig vom Ergebnis —, ein durchgestrichener Scherge heißt „wurde besiegt“. Beides führt danach zu „nicht mehr verfügbar“, aber aus verschiedenen Gründen. Oben im Spielerbereich steht der Haken „Expertenmodus“, und darin gleicht MC45 dem MC40-Bogen und weicht von MC32 ab: der gedruckte Bogen kennzeichnet die verbleibenden Lebenspunkte NICHT als Expertenfeld, das Regelheft aber schon. Unter „Bleibender Schaden“ steht dort: „Während einer Experten-Kampagne von Age of Apocalypse muss jeder Spieler seine verbleibenden Lebenspunkte im Kampagnenlogbuch notieren, nachdem ihr ein Szenario gewonnen habt.“ Nur dort stellt der Spielaufbau des nächsten Szenarios sie auch wieder ein. Auf Standardstufe blendet der Bogen das Feld aus, statt danach zu fragen. Ausblenden heißt nicht löschen — der Wert bleibt im Bogen, im Export und im Share-Link. Es gibt hier bewusst keine Szenario-Tabelle, kein „Abgeschlossen“, keinen Fortschrittszähler und kein Notizfeld: der gedruckte Bogen hat sie nicht, und die fünf Szenarien von Unus bis En Sabah Nur kommen darauf nicht ein einziges Mal vor. Auch der fünfte Mission-Nebenplan „Den Professor beschützen“ fehlt nicht: er ist für Szenario 5 reserviert und nie zur Wahl, deshalb druckt ihn das Papier ebenfalls nicht. Die Abschnittsnamen, die Spaltentitel und die Regeltexte stehen hier so, wie die deutsche Spielanleitung sie auf Seite 24 druckt. Englisch bleiben nur die fünf Schergen, wie es die deutsche Ausgabe bei Figuren durchweg hält — beim Shadow King lässt der deutsche Bogen dabei den Artikel weg.",
    helpEn: "The MC45 sheet is the leanest of them all: the player block, one table of four rows below it, and five named boxes below that. The paper prints nothing else. The four rows are the four MISSION side schemes, and their three text columns — Setup, Defeated, Not Defeated — are printed rule text with nothing to enter. What is entered is the outcome, and it is entered in the two outcome columns themselves: a tick under “Defeated” or under “Not Defeated”. The paper prints no box there — the rule says to strike out the name and then follow the instruction beside it. The tick IS that strike, and because it sits in the column it also records which of the two branches applied. That is one bit more than the paper carries, and deliberately so: everything in those two columns holds “for the rest of the campaign”, so the paper expects you to remember which one you followed — and a log should not have to. The two boxes exclude each other; a mission is either defeated or it is not. The lock is one-sided, as in MC60, MC32 and MC40: a box that is already ticked stays operable. That matters more than it sounds — when a sheet arrives from an import or an old share link with both boxes set, nobody picks a winner, and the way out has to be on screen. The contradiction is named under the table instead. The struck name is dimmed and the row is not: the text of the outcome columns stays in force precisely BECAUSE the mission was played, and fading it out would dim the one thing the row is still good for. The five boxes below are the OVERSEER minions. Mind the reading: the heading says “Available Overseer minions”, but the tick means “struck”, i.e. no longer available. And the sheet's two marks do not mean the same thing: a struck mission name means “it was in play, so it is spent” — whatever the outcome — while a struck minion means “it was defeated”. Both end up as “no longer available”, but they get there for different reasons. At the top of the player area sits the “Expert level” box, and here MC45 matches MC40's sheet and departs from MC32's: the printed sheet does NOT mark the remaining hit points as an expert field, while the rulebook does. Under PERSISTENT DAMAGE it says: “While playing the Age of Apocalypse campaign at the expert level, each player must record their remaining hit points in the campaign log after they win a game.” Only there does the next scenario's setup read them back in. At standard level the sheet hides the field rather than asking for it. Hiding is not clearing — the value stays in the sheet, in the export and in a share link. There is deliberately no scenario table, no “completed”, no progress counter and no notes field: the printed sheet has none, and the five scenarios from Unus to En Sabah Nur do not appear on it once. Nor is the fifth MISSION side scheme, Protect the Professor, missing: it is reserved for scenario #5 and never available to pick, so the paper leaves it out as well.",

    /* Zwei Gruppen, und die Unterscheidung sagt, wer eine Änderung entscheidet:

       1. Wörter, die diese App selbst wählt — Spaltentitel, Platzhalter,
          Hinweise und das gemeinsame Vokabular aller Kampagnen („Verbleibende
          Lebenspunkte“, „Spieler-Informationen“) — sind wörtlich aus
          campaigns/next-evolution.js übernommen und gehören dorthin abgeglichen,
          nicht hier neu formuliert. Sie stehen sofort auf Deutsch. Der gedruckte
          MC45-Bogen setzt „Spielerinformationen“ ohne Bindestrich; hier gewinnt
          das gemeinsame Vokabular, weil dasselbe Feld über alle Kampagnen hinweg
          gleich heißen muss — eine Entscheidung, kein Übersehen.
       2. Wörter, die vom gedruckten Bogen kommen — die Spaltentitel, die vier
          Missionsnamen, die zwölf Regeltexte und die Überschrift über den
          Schergen — stehen wörtlich so da, wie der deutsche Druck sie setzt:
          Seite 24 von
          "marvel-champions-age-of-apocalypse-841333125257-regel.pdf". Wer eine
          davon ändert, ändert eine Aussage über das Papier und braucht das
          Papier dazu. Die Regeltexte selbst stehen in MISSIONS, nicht hier,
          weil sie zu ihrer Zeile gehören.

       Zwei Ausnahmen innerhalb von Gruppe 2, beide begründet:
       - `secMissions` ist der PLURAL, den das Regelheft benutzt
         („MISSION-Nebenpläne“, S. 5). Der Bogen druckt über der Tabelle keine
         Bandüberschrift, nur die Kopfzeile; der Singular bleibt deshalb dort,
         wo der Bogen ihn hat, auf der ersten Spalte (`colMission`).
       - `secOverseers` steht ohne den gedruckten Doppelpunkt. Der gehört zum
         Satz, der in die Kästchen hineinläuft, nicht zum Namen des Abschnitts;
         im Druckabzug setzt renderPrint ihn deshalb auch nicht.

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
        identityPlaceholder: "Held …",
        lblExpert: "Expertenmodus",
        expertHint: "Nur auf Expertenstufe werden verbleibende Lebenspunkte festgehalten. Ausschalten blendet sie aus, löscht sie aber nicht.",
        addPlayer: "+ Spieler",
        addPlayerFull: "Mehr als vier Spieler kennt das Spiel nicht.",
        removePlayer: "Spieler entfernen",
        removePlayerLast: "Der letzte Spieler kann nicht entfernt werden.",
        confirmRemovePlayer: "Diesen Spieler samt Eintragungen entfernen?",
        duplicateHero: "Dieser Held ist schon einem anderen Spieler zugeordnet.",

        /* "%s" = die Beschriftung der anderen Ergebnisspalte. */
        outcomeExcluded: "Diese Mission ist als „%s“ eingetragen. Beides zugleich kann nicht sein.",
        bothOutcomes: "Widerspruch: eine Mission ist als „Besiegt“ und als „Nicht besiegt“ eingetragen.",
        overseerHint: "Ein Häkchen streicht den Namen durch: der Scherge wurde besiegt und ist nicht mehr verfügbar.",

        /* ---- Wörtlich vom gedruckten Bogen, Seite 24 ---------------------- */
        secMissions: "Mission-Nebenpläne",
        secOverseers: "Verfügbare Aufseher-Schergen",
        colMission: "Mission-Nebenplan",
        colSetup: "Spielaufbau",
        colDefeated: "Besiegt",
        colNotDefeated: "Nicht besiegt",
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

        outcomeExcluded: "This mission is recorded as “%s”. It cannot be both at once.",
        bothOutcomes: "Contradiction: a mission is recorded as both “Defeated” and “Not Defeated”.",
        overseerHint: "A tick strikes the name out: the minion was defeated and is no longer available.",

        secMissions: "Mission Side Schemes",
        secOverseers: "Available Overseer minions",
        colMission: "Mission Side Scheme",
        colSetup: "Setup",
        colDefeated: "Defeated",
        colNotDefeated: "Not Defeated",
      },
    },
  });
}(window));

/* Marvel Champions — "The Rise of Red Skull" (MC10) campaign log.

   Follows the official MC10 campaign log sheet, and that sheet is a very
   different animal from MC60's: it has no scenario table, no completed/failed
   tracking, no villain list. The five scenarios (Crossbones, Absorbing Man,
   Taskmaster, Zola, Red Skull) are played in a fixed order, so the printed log
   only records what carries FORWARD between them — what each player owns, and
   three results that later scenarios ask about. There is therefore no progress
   counter, no "next round" button and no randomiser here. Those absences are
   the sheet, not an omission.

   Where the sheet has a blank line, this has the actual card list. Every one of
   these fields draws from a fixed set of four printed cards, so writing a name
   by hand could only introduce a typo. The pools also carry the campaign's own
   rules about who may hold what — see POOLS below.

   The campaign is played at standard or expert level, and two of the sheet's
   fields exist only at expert level: the remaining hit points ("While playing
   The Rise of Red Skull campaign at the expert level, each player must record
   their remaining hit points in the campaign log") and the obligations, which
   come out of the Expert Campaign Set. A standard game therefore hides both
   rather than asking for them. Hides, not clears — see `expert` below.

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
  var COUNT_MAX = 99;

  /* ---- POOLS ---------------------------------------------------------------
     Every card carries an English and a German name. `de: null` means there is
     no German name on record yet, and then the English one is shown — the same
     convention heroes.js uses for heroes whose name is the same in both
     languages. Filling a `de` in later migrates nothing, because only the slug
     is ever persisted; and a forgotten one is visibly English rather than
     broken.

     Each pool carries a different rule, taken from the campaign:

       Experimental Weapons  campaign-wide; which of the four entered play
       Tech Upgrade          one per player, each card to at most one player
       Basic Upgrade         one per player, each card to at most one player
       Obligations           per player; every player may hold every one
       Rescued Allies        each ally to at most one player, who may hold several

     The four Tech Upgrades, the four Basic Upgrades and the four Obligations
     are named in the official MC10 rulebook. The Experimental Weapons are the
     four cards of that encounter set, and the rescuable allies are the four
     captives of Zola's scenario. */

  /* Scenario 1: "Record the name of each EXPERIMENTAL attachment that entered
     the game in the campaign log." Scenario 2 onwards shuffles the recorded
     ones back into the encounter deck, which is why it is the names that
     matter and not a count. */
  var EXPERIMENTAL_WEAPONS = [
    { slug: "laser-rifle",     en: "Laser Rifle",     de: "Lasergewehr" },
    { slug: "energy-shield",   en: "Energy Shield",   de: "Energieschild" },
    { slug: "power-gauntlets", en: "Power Gauntlets", de: "Energiehandschuhe" },
    { slug: "exo-suit",        en: "Exo-Suit",        de: "Exo-Anzug" },
  ];

  var TECH_UPGRADES = [
    { slug: "adrenal-stims",        en: "Adrenal Stims",        de: "Adrenalin-Stimulierung" },
    { slug: "tactical-scanner",     en: "Tactical Scanner",     de: "Taktischer Scanner" },
    { slug: "emergency-teleporter", en: "Emergency Teleporter", de: "Notfall-Teleporter" },
    { slug: "laser-cannon",         en: "Laser Cannon",         de: "Laserkanone" },
  ];

  /* These really are the printed names: the Condition upgrades in the campaign
     set are called "Basic <stat> Upgrade", and flip to an "Improved" side. */
  var BASIC_UPGRADES = [
    { slug: "basic-thwart",   en: "Basic Thwart Upgrade",   de: "Basis-Upgrade: Widerstand" },
    { slug: "basic-attack",   en: "Basic Attack Upgrade",   de: "Basis-Upgrade: Angriff" },
    { slug: "basic-defense",  en: "Basic Defense Upgrade",  de: "Basis-Upgrade: Verteidigung" },
    { slug: "basic-recovery", en: "Basic Recovery Upgrade", de: "Basis-Upgrade: Erholung" },
  ];

  /* Every player is dealt their own copy of the same four, so unlike the
     upgrades these are not shared out — two players can both carry Martial
     Law. */
  var OBLIGATIONS = [
    { slug: "zolas-algorithm",      en: "Zola's Algorithm",      de: "Zolas Algorithmus" },
    { slug: "medical-emergency",    en: "Medical Emergency",     de: "Medizinischer Notfall" },
    { slug: "martial-law",          en: "Martial Law",           de: "Kriegsrecht" },
    { slug: "anti-hero-propaganda", en: "Anti-Hero Propaganda",  de: "Anti-Helden-Propaganda" },
  ];

  /* These four keep their English names in the German edition, the way the MC60
     villains do, so their `de` stays null on purpose — it is a decision, not a
     translation still to be done. */
  var RESCUABLE_ALLIES = [
    { slug: "elektra",     en: "Elektra",                      de: null },
    { slug: "moon-knight", en: "Moon Knight: Marc Spector",    de: null },
    { slug: "shang-chi",   en: "Shang-Chi",                    de: null },
    { slug: "white-tiger", en: "White Tiger: Angela Del Toro", de: null },
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
     MC60 module does the same for its scenario names. */
  function entryLang(entry, lang) {
    return (lang === "de" && entry.de) ? null : "en";
  }
  function poolName(pool, slug, lang) {
    var entry = inPool(pool, slug);
    return entry ? entryName(entry, lang) : null;
  }
  function poolIndex(pool, slug) {
    for (var i = 0; i < pool.length; i++) if (pool[i].slug === slug) return i;
    return pool.length;
  }

  /* The recognised slugs of `raw`, in the pool's own order and without
     duplicates. Canonical output is what makes normalize() a fixpoint: the
     same set always comes back in the same order, so a second pass and a JSON
     round-trip both change nothing. */
  function pickSlugs(raw, pool) {
    var wanted = {};
    (Array.isArray(raw) ? raw : []).forEach(function (v) {
      if (typeof v === "string") wanted[v] = true;
    });
    return pool.filter(function (e) { return wanted[e.slug]; })
      .map(function (e) { return e.slug; });
  }

  /* Which player holds this card, or -1. Serves both the exclusion in the UI
     and the reason shown on a locked control. */
  function holderOf(state, key, slug) {
    for (var i = 0; i < state.players.length; i++) {
      var v = state.players[i][key];
      if (Array.isArray(v) ? v.indexOf(slug) !== -1 : v === slug) return i;
    }
    return -1;
  }

  /* "Player #1" on its own, or "Player #1 – Captain America" once there is a
     name to say. Used wherever a control has to say whose it is. */
  function playerLabel(t, player, i) {
    var caption = t("playerRow", String(i + 1));
    var hero = String(player.hero || "").trim();
    return hero ? caption + " – " + hero : caption;
  }

  // ---- Data ----------------------------------------------------------------
  function emptyState() {
    return {
      /* Standard or expert level. Only the display follows this: switching back
         to standard HIDES the hit points and the obligations, it does not clear
         them, so a sheet toggled by accident loses nothing. */
      expert: false,
      /* A fresh sheet starts with a single player; more are added as needed. */
      players: [newPlayer()],
      /* Scenario 1: which Experimental Weapons entered play. */
      experimentalWeapons: [],
      /* Scenario 2: delay counters left on the main scheme. */
      delayCounters: null,
      /* Scenario 4: allies removed from the campaign. Free text, because what
         leaves is not limited to the four rescuable ones. */
      removed: [],
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
         who is playing. The flag lives ON the player rather than in a parallel
         list, so adding or removing a player can never shift the flags out
         from under the names. */
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
        /* No cross-player rule here: every player has their own copy of all
           four obligations, so only duplicates within one player are wrong. */
        obligations: pickSlugs(p.obligations, OBLIGATIONS),
        techUpgrade: inPool(TECH_UPGRADES, p.techUpgrade) ? p.techUpgrade : "",
        basicUpgrade: inPool(BASIC_UPGRADES, p.basicUpgrade) ? p.basicUpgrade : "",
        rescuedAllies: pickSlugs(p.rescuedAllies, RESCUABLE_ALLIES),
        engagedWithMinion: W.coerceBool(p.engagedWithMinion),
      });
    }

    /* Each upgrade card and each rescuable ally exists once in the campaign, so
       it can belong to at most one player. First occurrence in player order
       wins and later ones are dropped — which of them was meant is not ours to
       guess, and the alternative is a sheet that cannot legally be played. */
    dropRepeats(out.players, "techUpgrade");
    dropRepeats(out.players, "basicUpgrade");
    dropRepeats(out.players, "rescuedAllies");

    out.experimentalWeapons = pickSlugs(raw.experimentalWeapons, EXPERIMENTAL_WEAPONS);
    out.delayCounters = W.clampNumber(raw.delayCounters, 0, COUNT_MAX);
    out.removed = W.coerceStringList(raw.removed, { split: true, trim: true });

    return out;
  }

  /* Enforce "at most one player holds this card", over a single-value field or
     a list field, in player order. */
  function dropRepeats(players, key) {
    var seen = {};
    players.forEach(function (p) {
      if (Array.isArray(p[key])) {
        p[key] = p[key].filter(function (slug) {
          if (seen[slug]) return false;
          seen[slug] = true;
          return true;
        });
        return;
      }
      if (!p[key]) return;
      if (seen[p[key]]) p[key] = "";
      else seen[p[key]] = true;
    });
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

  /* A caption plus a row of named checkboxes — the shape every card set on this
     sheet takes. `attrs(entry)` decorates each box so a caller with a
     cross-player rule can find its boxes again without a re-render. */
  function checkRow(labelText, pool, lang, cfg) {
    var wrap = W.el("div", "player-field");
    var caption = W.el("p", "field-label");
    caption.textContent = labelText;
    wrap.appendChild(caption);

    var row = W.el("div", "flag-row");
    pool.forEach(function (entry) {
      var flag = W.el("label", "flag");
      var text = W.el("span", null, { lang: entryLang(entry, lang) });
      text.textContent = entryName(entry, lang);
      flag.appendChild(text);
      flag.appendChild(W.checkbox({
        checked: cfg.isOn(entry),
        label: cfg.labelFor(entry),
        disabled: cfg.isLocked ? cfg.isLocked(entry) : false,
        lockReason: cfg.lockReason ? cfg.lockReason(entry) : null,
        onChange: function (next) { cfg.onChange(entry, next); },
      }));
      if (cfg.attrs) {
        var extra = cfg.attrs(entry);
        Object.keys(extra).forEach(function (k) { flag.setAttribute(k, extra[k]); });
      }
      row.appendChild(flag);
    });
    wrap.appendChild(row);
    return wrap;
  }

  function render(root, ctx) {
    var t = ctx.t, lang = ctx.lang, state = ctx.state;

    root.appendChild(renderPlayers(t, lang, state, ctx));
    /* Scenario 1 and 2 sit side by side on a wide screen (see .scenario-row in
       styles.css), which is how they are printed; they stay in this order in
       the DOM, so reading order and print output follow the paper sheet. */
    var row = W.el("div", "scenario-row");
    row.appendChild(renderScenario1(t, lang, state, ctx));
    row.appendChild(renderScenario2(t, state, ctx));
    root.appendChild(row);
    root.appendChild(renderScenario4(t, state, ctx));
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

    /* The expert switch sits here rather than in a panel of its own: both
       fields it governs are in these cards, so the cause is next to what it
       reveals. A re-render, because fields appear and disappear. */
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
       not caught up with yet must remain typeable. The card fields below are
       not free text — those pools are printed and finite. */
    var heroes = global.HEROES || [];
    var listId = "hero-suggestions";
    grid.appendChild(W.dataList(listId, heroes.map(function (h) {
      return (lang === "de" && h.de) ? h.de : h.en;
    })));

    /* Collected across all the cards so each upgrade pool can grey out what
       another player already holds, in place and without a re-render. */
    var techSelects = [];
    var basicSelects = [];

    state.players.forEach(function (player, i) {
      var card = W.el("div", "player-card", { "data-player": String(i + 1) });
      var caption = t("playerRow", String(i + 1));

      var head = W.el("div", "player-head");
      var idLabel = W.el("div", "player-name");
      idLabel.textContent = caption;
      head.appendChild(idLabel);

      /* Removing the last player would leave a sheet with nobody on it, so that
         one stays put. Anything else goes, with a confirmation when there is
         something on the card to lose — and a card here holds far more than a
         name and a number, so the check has to look at all of it. */
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
          /* A full re-render, never a partial redraw: the cards below shift up,
             and every pool has to be recomputed against the players that are
             left. */
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
          /* Several controls elsewhere name their player, so they follow along.
             Rewritten in place rather than by re-rendering, which would take
             the focus out of the field being typed in. */
          paintPlayerNames(t, state);
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

      /* Expert only as well: the obligations come out of the Expert Campaign
         Set. Every player has their own copy of all four, so unlike the
         upgrades there is nothing to share out and nothing to lock. */
      if (state.expert) {
        card.appendChild(checkRow(t("lblObligations"), OBLIGATIONS, lang, {
          isOn: function (o) { return player.obligations.indexOf(o.slug) !== -1; },
          labelFor: function (o) {
            return playerLabel(t, player, i) + " – " + entryName(o, lang);
          },
          onChange: function (o, on) {
            toggleSlug(player.obligations, OBLIGATIONS, o.slug, on);
            ctx.save();
          },
        }));
      }

      var tech = W.poolSelect({
        value: player.techUpgrade,
        label: caption + " – " + t("lblTechUpgrade"),
        placeholder: t("upgradePlaceholder"),
        options: TECH_UPGRADES.map(function (u) {
          return { value: u.slug, label: entryName(u, lang), lang: entryLang(u, lang) };
        }),
        onChange: function (next) {
          player.techUpgrade = next;
          ctx.save();
          W.syncUnique(techSelects);
        },
      });
      techSelects.push(tech);
      card.appendChild(fieldRow(t("lblTechUpgrade"), tech));

      var basic = W.poolSelect({
        value: player.basicUpgrade,
        label: caption + " – " + t("lblBasicUpgrade"),
        placeholder: t("upgradePlaceholder"),
        options: BASIC_UPGRADES.map(function (u) {
          return { value: u.slug, label: entryName(u, lang), lang: entryLang(u, lang) };
        }),
        onChange: function (next) {
          player.basicUpgrade = next;
          ctx.save();
          W.syncUnique(basicSelects);
        },
      });
      basicSelects.push(basic);
      card.appendChild(fieldRow(t("lblBasicUpgrade"), basic));

      /* Rescued allies: each ally goes to at most one player, but a player may
         hold several — so boxes rather than a dropdown, and on the other
         players they lock instead of disappearing. */
      card.appendChild(checkRow(t("lblRescuedAllies"), RESCUABLE_ALLIES, lang, {
        isOn: function (a) { return player.rescuedAllies.indexOf(a.slug) !== -1; },
        labelFor: function (a) {
          return playerLabel(t, player, i) + " – " + entryName(a, lang);
        },
        isLocked: function (a) {
          var at = holderOf(state, "rescuedAllies", a.slug);
          return at !== -1 && at !== i;
        },
        lockReason: function (a) {
          var at = holderOf(state, "rescuedAllies", a.slug);
          return at === -1 ? null
            : t("allyTakenBy", playerLabel(t, state.players[at], at));
        },
        attrs: function (a) { return { "data-ally": a.slug, "data-ally-player": String(i) }; },
        onChange: function (a, on) {
          toggleSlug(player.rescuedAllies, RESCUABLE_ALLIES, a.slug, on);
          ctx.save();
          paintAllyLocks(t, state);
        },
      }));

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
    /* Last, so both pools start out showing what is already taken. */
    W.syncUnique(techSelects);
    W.syncUnique(basicSelects);
    return section;
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

  /* Counts the expert-only fields even at standard level: they are hidden,
     not gone, and removing a player would still throw them away. */
  function playerHasContent(player) {
    return !!player.hero.trim() || player.hp != null ||
      player.obligations.length > 0 || player.rescuedAllies.length > 0 ||
      !!player.techUpgrade || !!player.basicUpgrade ||
      player.engagedWithMinion;
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

  function renderScenario1(t, lang, state, ctx) {
    var section = panel("scenario-1", t("secScenario1"));
    section.appendChild(checkRow(t("lblExperimentalWeapons"), EXPERIMENTAL_WEAPONS, lang, {
      isOn: function (w) { return state.experimentalWeapons.indexOf(w.slug) !== -1; },
      labelFor: function (w) {
        return t("lblExperimentalWeapons") + " – " + entryName(w, lang);
      },
      onChange: function (w, on) {
        toggleSlug(state.experimentalWeapons, EXPERIMENTAL_WEAPONS, w.slug, on);
        ctx.save();
      },
    }));
    return section;
  }

  function renderScenario2(t, state, ctx) {
    var section = panel("scenario-2", t("secScenario2"));
    section.appendChild(fieldRow(t("lblDelayCounters"), W.numberField({
      value: state.delayCounters,
      min: 0, max: COUNT_MAX,
      label: t("lblDelayCounters"),
      onChange: function (next) { state.delayCounters = next; ctx.save(); },
    })));
    return section;
  }

  function renderScenario4(t, state, ctx) {
    var section = panel("scenario-4", t("secScenario4"));

    var engaged = W.el("div", "player-field");
    var caption = W.el("p", "field-label");
    caption.textContent = t("lblEngaged");
    engaged.appendChild(caption);
    var row = W.el("div", "flag-row");
    state.players.forEach(function (player, i) {
      var flag = W.el("label", "flag");
      var text = W.el("span", null, { "data-player-name": String(i) });
      text.textContent = playerLabel(t, player, i);
      flag.appendChild(text);
      flag.appendChild(W.checkbox({
        checked: player.engagedWithMinion,
        label: playerLabel(t, player, i) + " – " + t("lblEngaged"),
        /* No re-render: unlike MC60's Completed box this flag locks nothing. */
        onChange: function (next) { player.engagedWithMinion = next; ctx.save(); },
      }));
      row.appendChild(flag);
    });
    engaged.appendChild(row);
    section.appendChild(engaged);

    /* On the paper sheet this list sits inside the scenario 4 box, so it does
       here too rather than becoming a panel of its own. Free text, because what
       leaves the campaign is not limited to the four rescuable allies. */
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

  /* Keeps every caption that names a player in step with the identity fields,
     without re-rendering anything. Looked up in the document, like MC60's
     villain chips, because the callers sit in other panels. */
  function paintPlayerNames(t, state) {
    document.querySelectorAll("[data-player-name]").forEach(function (node) {
      var i = parseInt(node.getAttribute("data-player-name"), 10);
      var player = state.players[i];
      if (player) node.textContent = playerLabel(t, player, i);
    });
  }

  /* An ally belongs to at most one player, so everyone else's box for it locks.
     Repainted in place from whichever box changed. */
  function paintAllyLocks(t, state) {
    document.querySelectorAll("[data-ally]").forEach(function (flag) {
      var slug = flag.getAttribute("data-ally");
      var mine = parseInt(flag.getAttribute("data-ally-player"), 10);
      var at = holderOf(state, "rescuedAllies", slug);
      var locked = at !== -1 && at !== mine;
      var box = flag.querySelector(".sheet-check");
      if (!box) return;
      box.disabled = locked;
      box.classList.toggle("is-locked", locked);
      box.title = locked
        ? t("allyTakenBy", playerLabel(t, state.players[at], at))
        : box.getAttribute("aria-label");
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
      if (state.expert) {
        line += " · " + t("colHp") + ": " + (p.hp == null ? "—" : String(p.hp));
      }
      printLine(players, line);
      printLine(players, "  " + t("lblTechUpgrade") + ": " +
        (poolName(TECH_UPGRADES, p.techUpgrade, lang) || "—"));
      printLine(players, "  " + t("lblBasicUpgrade") + ": " +
        (poolName(BASIC_UPGRADES, p.basicUpgrade, lang) || "—"));
      /* The hidden fields stay out of the printout too, so a standard sheet
         does not print rules it is not playing. */
      if (state.expert) {
        printNames(players, p.obligations, OBLIGATIONS, t("lblObligations"), lang);
      }
      printNames(players, p.rescuedAllies, RESCUABLE_ALLIES, t("lblRescuedAllies"), lang);
    });

    /* Every weapon on its own line with a box: which ones did NOT enter play
       matters as much as which did, because scenario 2 shuffles in exactly the
       recorded ones. */
    var one = printSection(root, t("secScenario1"));
    printLine(one, t("lblExperimentalWeapons") + ":");
    EXPERIMENTAL_WEAPONS.forEach(function (w) {
      printLine(one, (state.experimentalWeapons.indexOf(w.slug) !== -1 ? "[x] " : "[ ] ") +
        entryName(w, lang));
    });

    var two = printSection(root, t("secScenario2"));
    printLine(two, t("lblDelayCounters") + ": " +
      (state.delayCounters == null ? "—" : String(state.delayCounters)));

    var four = printSection(root, t("secScenario4"));
    printLine(four, t("lblEngaged") + ":");
    state.players.forEach(function (p, i) {
      printLine(four, (p.engagedWithMinion ? "[x] " : "[ ] ") + playerLabel(t, p, i));
    });
    if (state.removed.length) {
      printLine(four, t("secRemoved") + ":");
      var ul = W.el("ul", "print-list");
      state.removed.forEach(function (entry) {
        var s = W.splitStrike(entry);
        var li = W.el("li", s.struck ? "struck" : null);
        li.textContent = s.text;
        ul.appendChild(li);
      });
      four.appendChild(ul);
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

  /* A heading plus the chosen card names, or nothing at all when none are. */
  function printNames(parent, slugs, pool, heading, lang) {
    if (!slugs.length) return;
    printLine(parent, "  " + heading + ": " + slugs.map(function (slug) {
      return poolName(pool, slug, lang);
    }).join(", "));
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

    helpDe: "Der MC10-Bogen folgt dem gedruckten Original — und das heißt vor allem: es gibt hier bewusst keine Szenario-Tabelle, kein „Abgeschlossen“, kein „Gescheitert“ und keinen Würfel. Die fünf Szenarien (Crossbones, Absorbing Man, Taskmaster, Zola, Red Skull) werden in fester Reihenfolge gespielt, deshalb hält der Bogen nur fest, was von einem Szenario ins nächste mitgeht. Oben im Spielerbereich steht der Haken „Expertenmodus“: verbleibende Lebenspunkte und Verpflichtungen gibt es nur auf Expertenstufe, und auf Standardstufe blendet der Bogen beide aus, statt danach zu fragen. Ausblenden heißt nicht löschen — wer versehentlich umschaltet, verliert nichts. Wo auf Papier eine leere Zeile steht, stehen hier die tatsächlichen Karten — jedes dieser Felder hat genau vier gedruckte Möglichkeiten, und jedes trägt seine eigene Regel. Verpflichtungen: Jeder Spieler hat seinen eigenen Satz aller vier, zwei Spieler können also dieselbe haben. Tech- und Basis-Verbesserung: Jede Karte gibt es einmal in der Kampagne, eine gewählte verschwindet daher aus den Feldern der anderen Spieler. Gerettete Verbündete: Auch jeder nur einmal, aber ein Spieler kann mehrere haben — deshalb Kästchen statt Auswahlfeld, und bei den übrigen Spielern sind sie gesperrt statt verschwunden; der Sperrgrund nennt, wer ihn hat. Dazu die drei Ergebnisse, nach denen spätere Szenarien fragen: welche Experimentalwaffen nach Szenario 1 ins Begegnungsdeck gewandert sind — der Bogen will die Namen, nicht die Anzahl, weil Szenario 2 genau die wieder einmischt —, die Verzögerungsmarker auf dem Hauptplan nach Szenario 2, und nach Szenario 4, welche Spieler mit Handlangern im Gefecht waren; auf Papier eine Zeile zum Hineinschreiben, hier ein Häkchen pro Spieler, weil die App die Mitspieler ohnehin kennt. Die aus der Kampagne entfernten Verbündeten bleiben Freitext, weil dort mehr landen kann als die vier rettbaren; ein „~“ am Anfang eines Listeneintrags streicht ihn durch.",
    helpEn: "The MC10 sheet follows the printed original, and that above all means what is deliberately absent: no scenario table, no “completed”, no “failed”, no die. The five scenarios (Crossbones, Absorbing Man, Taskmaster, Zola, Red Skull) are played in a fixed order, so the log only records what carries forward from one to the next. At the top of the player area sits the “Expert level” box: remaining hit points and obligations exist only at expert level, and at standard level the sheet hides both rather than asking for them. Hiding is not clearing — switching by accident loses nothing. Where the paper has a blank line, this has the actual cards — each of those fields has exactly four printed possibilities, and each carries its own rule. Obligations: every player has their own set of all four, so two players can hold the same one. Tech and Basic Upgrade: each card exists once in the campaign, so choosing one removes it from the other players' fields. Rescued Allies: also one holder each, but a player may hold several — hence boxes rather than a dropdown, and on the other players they lock rather than disappear, naming who holds them. Then the three results later scenarios ask about: which Experimental Weapons went into the encounter deck after scenario 1 — the sheet wants the names, not a count, because scenario 2 shuffles exactly those back in — the delay counters left on the main scheme after scenario 2, and after scenario 4 which players were engaged with minions; one line to write names on, on paper, here a checkbox per player, since the app already knows who is playing. The allies removed from the campaign stay free text, because more than the four rescuable ones can end up there; a leading “~” strikes a list entry through.",

    /* Deutsche Feldnamen: MC10 ist auf Deutsch erschienen, aber die genaue
       Beschriftung des gedruckten deutschen Bogens ließ sich nicht belegen. Die
       mit „zu bestätigen“ markierten Zeilen bitte gegen den Bogen abgleichen
       und je eine Zeile korrigieren. Es migriert nichts, wenn sie sich ändern —
       persistiert werden nur Feldschlüssel, nie Beschriftungen. Die Kartennamen
       stehen oben in den Pools, je mit einem en- und einem de-Feld; solange
       de null ist, wird der englische Name gezeigt. */
    i18n: {
      de: {
        secPlayers: "Spieler-Informationen",
        secScenario1: "Szenario 1",
        secScenario2: "Szenario 2",
        secScenario4: "Szenario 4",
        secRemoved: "Aus der Kampagne entfernte Verbündete",

        /* "%s" = Spielernummer. */
        playerRow: "Spieler #%s",
        colIdentity: "Identität",
        colHp: "Verbleibende Lebenspunkte",
        identityPlaceholder: "Held …",
        lblExpert: "Expertenmodus",
        expertHint: "Nur auf Expertenstufe werden verbleibende Lebenspunkte und Verpflichtungen festgehalten. Ausschalten blendet beide aus, löscht sie aber nicht.",
        addPlayer: "+ Spieler",
        addPlayerFull: "Mehr als vier Spieler kennt das Spiel nicht.",
        removePlayer: "Spieler entfernen",
        removePlayerLast: "Der letzte Spieler kann nicht entfernt werden.",
        confirmRemovePlayer: "Diesen Spieler samt Eintragungen entfernen?",
        duplicateHero: "Dieser Held ist schon einem anderen Spieler zugeordnet.",

        lblObligations: "Verpflichtungen",
        lblTechUpgrade: "Tech-Upgrade",
        lblBasicUpgrade: "Basis-Upgrade",
        lblRescuedAllies: "Befreite Verbündete",
        upgradePlaceholder: "— Upgrade wählen —",
        /* "%s" = der Spieler, der den Verbündeten schon hat. */
        allyTakenBy: "Schon zugeordnet: %s",

        lblExperimentalWeapons: "Dem Begegnungsdeck hinzugefügte Experimentelle Waffen",
        lblDelayCounters: "Verzögerungsmarker auf dem Hauptplan",
        lblEngaged: "Spieler im Gefecht mit Schergen",

        cardNamePlaceholder: "Kartenname …",
      },
      en: {
        secPlayers: "Player Information",
        secScenario1: "Scenario 1",
        secScenario2: "Scenario 2",
        secScenario4: "Scenario 4",
        secRemoved: "Allies removed from the campaign",

        playerRow: "Player #%s",
        colIdentity: "Identity",
        colHp: "Remaining hit points",
        identityPlaceholder: "Hero …",
        lblExpert: "Expert level",
        expertHint: "Remaining hit points and obligations are only recorded at expert level. Switching this off hides both without clearing them.",
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
        upgradePlaceholder: "— choose an Upgrade —",
        allyTakenBy: "Already assigned to: %s",

        lblExperimentalWeapons: "Experimental Weapons added to encounter deck",
        lblDelayCounters: "Number of delay counters on main scheme",
        lblEngaged: "Players engaged with minions",

        cardNamePlaceholder: "Card name …",
      },
    },
  });
})(window);

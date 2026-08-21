/* Marvel Champions campaign log — application shell.

   Owns everything that is the same for every campaign: the store of logs in
   localStorage, several parallel runs, JSON export/import, the share link,
   the print orchestration, language, theme, menu and dialogs.

   What it deliberately does NOT own is the shape of a campaign sheet. The
   campaigns differ far too much for one generic data model, so each one is a
   module in campaigns/ that registers itself here and keeps full control over
   its own state and rendering. From this file a log's `state` is an opaque
   JSON object with a campaign id and a version number on it.

   Pure client-side: no server, no build step. Loaded as a plain script (no ES
   module) so the app also works via file://. */
(function () {
  "use strict";

  /* Version of the log ENVELOPE (the fields this file owns). The campaign's own
     `state` is versioned separately by its module, so adding a campaign or
     changing a sheet never forces a bump here. */
  var SCHEMA_VERSION = 1;
  var KNOWN_SCHEMA_VERSIONS = [1];

  var STORE_LOGS = "mcclog:logs";
  var STORE_ACTIVE = "mcclog:activeId";
  var STORE_LANG = "mcclog:lang";
  var STORE_THEME = "mcclog:theme";
  /* Device-local and deliberately outside the log data: it records this
     device's backups, not anything about the campaign. */
  var STORE_EXPORTED = "mcclog:exported";
  var EXPORT_REMINDER_DAYS = 14;
  /* Roughly where a share link starts getting truncated by messengers, mail
     clients and QR codes. */
  var SHARE_LINK_WARN = 2000;
  /* Stand-in for a missing timestamp. Deliberately not "now" — see normalizeLog. */
  var EPOCH_ISO = "1970-01-01T00:00:00.000Z";
  var MENU_EDGE = 12;

  var W = window.W;

  // ---- Campaign registry ---------------------------------------------------
  var campaigns = [];   // in registration order; index.html decides that order

  /* Called by each campaigns/*.js at load time. Kept minimal on purpose: a
     campaign supplies data functions (which must not touch the DOM, so CI can
     exercise them headlessly) and render functions (which own their panel
     container completely). */
  window.registerCampaign = function (def) {
    campaigns.push(def);
  };
  function campaignById(id) {
    for (var i = 0; i < campaigns.length; i++) if (campaigns[i].id === id) return campaigns[i];
    return null;
  }
  /* Campaign title in the current language. */
  function campaignTitle(def) {
    if (!def) return "";
    return (lang === "de" ? def.titleDe : def.titleEn) || def.titleEn || def.id;
  }

  // ---- State ---------------------------------------------------------------
  var logs = {};        // id -> log object
  /* id -> "future-schema" | "unknown-campaign" | "future-state".
     A reason rather than a boolean: with several campaigns there are three
     distinct ways a log can be unreadable here, and the notice has to say
     which one it is. */
  var quarantine = {};
  var activeId = null;
  var lang = "de";
  var theme = null;     // "light" | "dark" | null (follow system)
  var menuOpen = false;

  // ---- Utilities -----------------------------------------------------------
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    // Fallback for older browsers.
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  function nowISO() { return new Date().toISOString(); }
  function tr() { return window.t(lang); }
  function el(tag, cls, attrs) { return W.el(tag, cls, attrs); }

  /* Trailing-edge debounce with the two hooks the persistence layer needs:
     cancel() drops a queued call whose work has since been done another way,
     flush() runs it right now because the page is going away. */
  function debounce(fn, ms) {
    var timer = null, lastArgs = null, lastCtx = null;
    function fire() {
      timer = null;
      fn.apply(lastCtx, lastArgs || []);
    }
    function wrapped() {
      lastArgs = arguments;
      lastCtx = this;
      clearTimeout(timer);
      timer = setTimeout(fire, ms);
    }
    wrapped.cancel = function () { clearTimeout(timer); timer = null; };
    wrapped.flush = function () { if (timer) { clearTimeout(timer); fire(); } };
    return wrapped;
  }

  /* Fill "%s" placeholders left to right. */
  function fmt(pattern) {
    var args = Array.prototype.slice.call(arguments, 1), i = 0;
    return String(pattern).replace(/%s/g, function () {
      return i < args.length ? String(args[i++]) : "";
    });
  }

  function activeLog() { return activeId ? logs[activeId] : null; }
  function activeCampaign() {
    var log = activeLog();
    return log ? campaignById(log.campaignId) : null;
  }

  // ---- Log shape -----------------------------------------------------------
  function emptyLog(campaignId, title) {
    var def = campaignById(campaignId);
    return {
      schemaVersion: SCHEMA_VERSION,
      id: uuid(),
      /* Chosen at creation and never changed afterwards: every slug inside
         `state` is campaign-local, so "switch campaign" would mean "throw the
         data away". Renaming is offered instead. */
      campaignId: campaignId,
      stateVersion: def ? def.stateVersion : 0,
      title: title || nextLogTitle(campaignId),
      createdAt: nowISO(),
      updatedAt: nowISO(),
      state: def ? def.emptyState() : {},
    };
  }

  /* Coerce arbitrary parsed JSON into a valid log, or null if this build cannot
     represent it (the caller then quarantines it rather than dropping it).

     Every path into the app goes through here: storage read, file import and
     share-link decode, so the three can never drift apart.

     opts.keepTimestamps is for logs that were already ours — the ones read back
     from storage on every start. A log without updatedAt would otherwise be
     restamped as freshly edited on each visit, which makes the export reminder
     fire forever. An import genuinely arrives now, so it keeps nowISO(). */
  function normalizeLog(obj, opts) {
    opts = opts || {};
    if (!obj || typeof obj !== "object") return null;

    var v = typeof obj.schemaVersion === "number" ? obj.schemaVersion : SCHEMA_VERSION;
    if (KNOWN_SCHEMA_VERSIONS.indexOf(v) === -1) return null;

    var def = campaignById(typeof obj.campaignId === "string" ? obj.campaignId : "");
    if (!def) return null;                                   // unknown campaign
    var sv = typeof obj.stateVersion === "number" ? obj.stateVersion : 0;
    if (sv > def.stateVersion) return null;                  // newer sheet than we know

    var base = emptyLog(def.id, "");
    var updatedAt = typeof obj.updatedAt === "string" ? obj.updatedAt
      : opts.keepTimestamps
        ? (typeof obj.createdAt === "string" ? obj.createdAt : EPOCH_ISO)
        : nowISO();

    var raw = (obj.state && typeof obj.state === "object") ? obj.state : {};
    if (sv < def.stateVersion && typeof def.migrate === "function") {
      raw = def.migrate(raw, sv) || {};
    }

    return {
      schemaVersion: SCHEMA_VERSION,
      id: typeof obj.id === "string" && obj.id ? obj.id : base.id,
      campaignId: def.id,
      stateVersion: def.stateVersion,
      title: typeof obj.title === "string" && obj.title.trim() ? obj.title.trim() : base.title,
      createdAt: typeof obj.createdAt === "string" ? obj.createdAt : base.createdAt,
      updatedAt: updatedAt,
      state: def.normalize(raw),
    };
  }

  /* Does this blob look like one of our logs, even though we cannot read it?
     Used to decide between quarantining an import and rejecting it outright. */
  function looksLikeLog(obj) {
    return !!obj && typeof obj === "object" &&
      typeof obj.campaignId === "string" && obj.campaignId !== "" &&
      typeof obj.schemaVersion === "number" &&
      !!obj.state && typeof obj.state === "object";
  }

  /* A unique default title within one campaign: the campaign name, or
     "name (N)" where N is one more than the highest number already used. */
  function nextLogTitle(campaignId) {
    var base = campaignTitle(campaignById(campaignId)) || tr().newLogTitle;
    var esc = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    var re = new RegExp("^" + esc + "(?: \\((\\d+)\\))?$");
    var maxN = 0;
    Object.keys(logs).forEach(function (id) {
      var m = ((logs[id].title || "").trim()).match(re);
      if (m) { var n = m[1] ? parseInt(m[1], 10) : 1; if (n > maxN) maxN = n; }
    });
    return maxN === 0 ? base : base + " (" + (maxN + 1) + ")";
  }

  // ---- Persistence ---------------------------------------------------------
  function loadStorage() {
    try {
      var raw = localStorage.getItem(STORE_LOGS);
      logs = raw ? JSON.parse(raw) : {};
    } catch (e) { logs = {}; }
    if (!logs || typeof logs !== "object") logs = {};

    /* Stored logs are migrated through normalizeLog() — the same path an import
       takes, so the two can never drift apart.

       A log this build cannot represent is left BYTE-IDENTICAL and flagged
       instead. Normalising it would drop the fields we do not know about while
       relabelling it as current — and since export and the share link hand that
       blob on, the damage would travel to the device that could still read it
       properly. Two browsers on different app versions is the normal case here,
       not a corner case: one of them is a phone that loaded the page weeks ago.
       With several campaigns that gets worse, not better — a build from before
       a campaign shipped meets logs whose whole sheet is unknown to it. */
    quarantine = {};
    Object.keys(logs).forEach(function (id) {
      var l = logs[id];
      if (!l || typeof l !== "object") { delete logs[id]; return; }
      if (typeof l.id !== "string" || !l.id) l.id = id;               // legacy: the key was the id
      if (typeof l.schemaVersion !== "number") l.schemaVersion = SCHEMA_VERSION;
      if (l.schemaVersion > SCHEMA_VERSION) { quarantine[id] = "future-schema"; return; }
      var def = campaignById(l.campaignId);
      if (!def) { quarantine[id] = "unknown-campaign"; return; }
      if (typeof l.stateVersion === "number" && l.stateVersion > def.stateVersion) {
        quarantine[id] = "future-state"; return;
      }
      /* Migrated in memory only: the stored blob is rewritten by the next
         actual edit, so a visit that changes nothing leaves it as it was. That
         keeps an older build on another device able to read it right up until
         something really changes. */
      var n = normalizeLog(l, { keepTimestamps: true });
      if (n) { n.id = l.id; logs[id] = n; }
      else delete logs[id];
    });

    activeId = localStorage.getItem(STORE_ACTIVE);
    lang = localStorage.getItem(STORE_LANG) ||
      ((navigator.language || "de").toLowerCase().indexOf("en") === 0 ? "en" : "de");
    var storedTheme = localStorage.getItem(STORE_THEME);
    theme = (storedTheme === "light" || storedTheme === "dark") ? storedTheme : null;
  }

  var schedulePersist = debounce(function () {
    saveStorage();
    showToast(tr().savedNotice);
  }, 350);

  function saveStorage() {
    /* Everything is written in full below, so a queued persist has nothing left
       to do. Cancelling it is only safe because scheduleSave() stamps updatedAt
       synchronously — the timer no longer carries state of its own. */
    schedulePersist.cancel();
    try {
      localStorage.setItem(STORE_LOGS, JSON.stringify(logs));
      localStorage.setItem(STORE_ACTIVE, activeId || "");
      localStorage.setItem(STORE_LANG, lang);
      if (theme) localStorage.setItem(STORE_THEME, theme);
      else localStorage.removeItem(STORE_THEME);
    } catch (e) { /* quota or private mode — ignore */ }
  }

  /* Mark the active log as edited, then queue the write.

     The timestamp is stamped NOW rather than when the timer fires: activeLog()
     would otherwise resolve against whichever log is active 350 ms later, so
     typing in log A and switching to log B within that window would hand B the
     timestamp of A's edit and leave A's own edit unstamped. */
  function scheduleSave() {
    var log = activeLog();
    if (log) log.updatedAt = nowISO();
    schedulePersist();
  }
  function flushPending() { schedulePersist.flush(); }

  /* Ask the browser to keep our storage. Without this Chrome and Firefox may
     evict localStorage under pressure, and iOS Safari clears script-writable
     storage after seven days without a visit — the exact rhythm of a campaign
     picked up every few weeks. Best effort; there is no UI either way. */
  function requestPersistentStorage() {
    try {
      if (navigator.storage && navigator.storage.persist) {
        var p = navigator.storage.persist();
        if (p && p["catch"]) p["catch"](function () { /* denied — ignore */ });
      }
    } catch (e) { /* not supported — ignore */ }
  }

  // ---- Toast ---------------------------------------------------------------
  var toastTimer = null;
  function showToast(msg, ms) {
    var t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, ms || 2200);
  }

  // ---- Share link ----------------------------------------------------------
  function toBase64Url(bytes) {
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function fromBase64Url(str) {
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    while (str.length % 4) str += "=";
    var bin = atob(str);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  async function encodeLog(log) {
    var json = JSON.stringify(log);
    var input = new TextEncoder().encode(json);
    if (typeof CompressionStream === "function") {
      try {
        var cs = new CompressionStream("deflate-raw");
        var stream = new Blob([input]).stream().pipeThrough(cs);
        var buf = await new Response(stream).arrayBuffer();
        return "d" + toBase64Url(new Uint8Array(buf)); // "d" = deflated
      } catch (e) { /* fall through to raw */ }
    }
    return "r" + toBase64Url(input); // "r" = raw
  }

  /* Decode a share payload. Returns { log } for something we can render, or
     { raw } for a plausible log this build cannot represent — the caller
     quarantines that rather than losing it. */
  async function decodePayload(payload) {
    if (!payload) return null;
    var flag = payload.charAt(0);
    var bytes = fromBase64Url(payload.slice(1));
    var json;
    if (flag === "d") {
      var ds = new DecompressionStream("deflate-raw");
      var stream = new Blob([bytes]).stream().pipeThrough(ds);
      var buf = await new Response(stream).arrayBuffer();
      json = new TextDecoder().decode(buf);
    } else {
      json = new TextDecoder().decode(bytes);
    }
    var parsed = JSON.parse(json);
    var log = normalizeLog(parsed);
    return log ? { log: log } : (looksLikeLog(parsed) ? { raw: parsed } : null);
  }

  async function shareLink() {
    var log = activeLog();
    if (!log) return;
    var payload = await encodeLog(log);
    var url = location.origin + location.pathname + "#log=" + payload;
    /* The whole log travels inside the link, so it grows with the campaign.
       Browsers cope with long URLs; messengers, mail clients and QR codes
       truncate them, and a truncated link fails silently. */
    var long = url.length > SHARE_LINK_WARN;
    try {
      await navigator.clipboard.writeText(url);
      showToast(long ? tr().linkCopiedLong : tr().linkCopied, long ? 7000 : 0);
    } catch (e) {
      window.prompt(tr().linkCopyManual, url);
    }
  }

  // ---- Export / Import (JSON file) -----------------------------------------
  /* When each log was last exported on this device. Kept in its own key: it
     describes this device's backups, not the campaign, so it must never travel
     with the log. */
  function loadExported() {
    try {
      var raw = localStorage.getItem(STORE_EXPORTED);
      var m = raw ? JSON.parse(raw) : null;
      return m && typeof m === "object" ? m : {};
    } catch (e) { return {}; }
  }
  function markExported(id) {
    var m = loadExported();
    m[id] = nowISO();
    try { localStorage.setItem(STORE_EXPORTED, JSON.stringify(m)); } catch (e) { /* ignore */ }
  }

  /* Nudge towards a backup when the active log holds changes this device has
     never exported and the last export (or the log's creation) is a while back.
     localStorage is not a safe long-term home: browsers evict it under pressure,
     and iOS Safari clears it after seven days without a visit. */
  function maybeRemindExport() {
    var log = activeLog();
    if (!log) return;
    var last = loadExported()[log.id] || log.createdAt;
    if (!last || !((log.updatedAt || "") > last)) return;
    var age = Date.now() - new Date(last).getTime();
    if (isFinite(age) && age > EXPORT_REMINDER_DAYS * 86400000) {
      showToast(tr().exportReminder, 8000);
    }
  }

  function exportLog() {
    var log = activeLog();
    if (!log) return;
    var blob = new Blob([JSON.stringify(log, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    var safe = (log.title || "campaign-log").replace(/[^\w\-]+/g, "_").slice(0, 60);
    a.href = url;
    a.download = safe + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    markExported(log.id);
  }

  function importFromFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var parsed;
      try {
        parsed = JSON.parse(reader.result);
      } catch (e) {
        alert(tr().importError);
        return;
      }
      var log = normalizeLog(parsed);
      if (log) { importLog(log, false); return; }
      /* Plausible but unreadable here: keep it verbatim instead of refusing it.
         The file may be the only copy the user has, and a newer build — or the
         device it came from — can still read it. */
      if (looksLikeLog(parsed)) { importQuarantined(parsed); return; }
      alert(tr().importError);
    };
    reader.readAsText(file);
  }

  /* First existing log id whose (non-empty) title matches, or null. */
  function findByTitle(title) {
    var t = (title || "").trim();
    if (!t) return null;
    var ids = Object.keys(logs);
    for (var i = 0; i < ids.length; i++) {
      if (((logs[ids[i]].title || "").trim()) === t) return ids[i];
    }
    return null;
  }

  function finishImport(id, updated) {
    activeId = id;
    saveStorage();
    renderAll();
    showToast(updated ? tr().importUpdated : tr().importSuccess);
  }

  /* Store a log we cannot render, flagged with the reason. Deliberately does
     not go through normalizeLog: the blob has to stay byte-identical. */
  function importQuarantined(raw) {
    if (typeof raw.id !== "string" || !raw.id || logs[raw.id]) raw.id = uuid();
    logs[raw.id] = raw;
    quarantine[raw.id] = raw.schemaVersion > SCHEMA_VERSION
      ? "future-schema"
      : (campaignById(raw.campaignId) ? "future-state" : "unknown-campaign");
    activeId = raw.id;
    saveStorage();
    renderAll();
    showToast(tr().importQuarantined, 8000);
  }

  /* Import a log, recognising logs already present by GUID (update in place)
     or, failing that, by identical name (ask whether it is the same log).
     `askIfNew` gates a confirmation before adding a genuinely new log
     (used for share links, where the import was not explicitly chosen). */
  function importLog(incoming, askIfNew) {
    if (!incoming) return;
    if (typeof incoming.id !== "string" || !incoming.id) incoming.id = uuid();

    // 1) Same GUID already present -> update that log.
    if (logs[incoming.id]) {
      var ex = logs[incoming.id];
      if (!window.confirm(fmt(tr().importUpdateGuidConfirm, ex.title || incoming.title || ""))) return;
      delete quarantine[incoming.id];
      logs[incoming.id] = incoming;
      finishImport(incoming.id, true);
      return;
    }

    // 2) Same name (different GUID) -> ask if it is the same log.
    var nameId = findByTitle(incoming.title);
    if (nameId) {
      if (window.confirm(fmt(tr().importSameNameConfirm, incoming.title))) {
        delete logs[nameId];                          // replace it, adopting the incoming GUID
        delete quarantine[nameId];
        if (logs[incoming.id]) incoming.id = uuid();   // guard against a collision
        logs[incoming.id] = incoming;
        finishImport(incoming.id, true);
        return;
      }
      // else fall through and add as a new log
    }

    // 3) New log.
    if (askIfNew && !window.confirm(tr().loadFromLinkConfirm)) return;
    if (logs[incoming.id]) incoming.id = uuid();
    logs[incoming.id] = incoming;
    finishImport(incoming.id, false);
  }

  // ---- Rendering -----------------------------------------------------------
  /* Log picker, grouped by campaign. One <optgroup> per campaign keeps the
     runs of different campaigns apart once there is more than one; with a
     single campaign registered there is simply one group. */
  function renderLogSelect() {
    var sel = document.getElementById("log-select");
    sel.innerHTML = "";
    var byCampaign = {};
    Object.keys(logs).forEach(function (id) {
      var cid = logs[id].campaignId || "";
      (byCampaign[cid] = byCampaign[cid] || []).push(id);
    });
    /* Registration order for known campaigns, then anything unknown, so a
       quarantined log from a future campaign still has a home in the list. */
    var order = campaigns.map(function (c) { return c.id; });
    Object.keys(byCampaign).forEach(function (cid) {
      if (order.indexOf(cid) === -1) order.push(cid);
    });
    order.forEach(function (cid) {
      var ids = byCampaign[cid];
      if (!ids) return;
      var def = campaignById(cid);
      var group = el("optgroup", null,
        { label: def ? campaignTitle(def) + " (" + def.code + ")" : cid });
      ids.sort(function (a, b) {
        return (logs[b].updatedAt || "").localeCompare(logs[a].updatedAt || "");
      }).forEach(function (id) {
        var opt = el("option", null, { value: id });
        opt.textContent = (quarantine[id] ? "⚠ " : "") + (logs[id].title || tr().untitled);
        if (id === activeId) opt.selected = true;
        group.appendChild(opt);
      });
      sel.appendChild(group);
    });
  }

  /* A log this build cannot represent is shown as a notice only. Its shape is
     unknown, so rendering it could throw and editing it would corrupt it; the
     stored blob is left byte-identical so a newer version still finds it
     intact. Switching, deleting, exporting and sharing still work. */
  function renderNotice(reason) {
    var notice = document.getElementById("notice");
    var log = activeLog();
    var text = "";
    if (reason === "future-schema") text = tr().futureSchemaWarning;
    else if (reason === "unknown-campaign") {
      text = fmt(tr().unknownCampaignWarning, (log && log.campaignId) || "?");
    } else if (reason === "future-state") {
      text = fmt(tr().futureStateWarning, campaignTitle(activeCampaign()) || "?");
    }
    notice.textContent = text;
    notice.hidden = !reason;
    document.getElementById("campaign").hidden = !!reason;
  }

  /* Hand the active campaign its container. The module owns everything inside
     it; all we supply is the context below. */
  function renderCampaign() {
    var root = document.getElementById("campaign");
    var def = activeCampaign();
    var log = activeLog();
    /* Drop drag registrations of the panels we are about to replace, so a list
       that no longer exists cannot receive a drop. */
    W.forgetLists("");
    root.innerHTML = "";
    if (!def || !log) return;
    def.render(root, campaignContext(def, log));
  }

  /* Everything a campaign module is given. `t` resolves campaign strings first
     and falls back to the shell dictionary, so a module can use both without
     knowing which is which. */
  function campaignContext(def, log) {
    var own = (def.i18n && def.i18n[lang]) || (def.i18n && def.i18n.de) || {};
    return {
      state: log.state,
      lang: lang,
      t: function (key) {
        var pattern = own[key] != null ? own[key] : tr()[key];
        if (pattern == null) return key;
        var args = [pattern].concat(Array.prototype.slice.call(arguments, 1));
        return fmt.apply(null, args);
      },
      save: scheduleSave,
      rerender: renderCampaign,
      w: W,
    };
  }

  function applyLanguage() {
    var d = tr();
    document.documentElement.lang = d.htmlLang;
    document.querySelectorAll("[data-i18n]").forEach(function (node) {
      var key = node.getAttribute("data-i18n");
      if (d[key] != null) node.textContent = d[key];
    });
    document.querySelectorAll("[data-i18n-title]").forEach(function (node) {
      var key = node.getAttribute("data-i18n-title");
      if (d[key] != null) node.title = d[key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (node) {
      var key = node.getAttribute("data-i18n-placeholder");
      if (d[key] != null) node.placeholder = d[key];
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (node) {
      var key = node.getAttribute("data-i18n-aria");
      if (d[key] != null) node.setAttribute("aria-label", d[key]);
    });
  }

  /* Subtitle and the campaign skin hook. Both depend on the active log rather
     than on a fixed key, so they are written here instead of via data-i18n. */
  function applyCampaignChrome() {
    var def = activeCampaign();
    var sub = document.getElementById("subtitle");
    if (def) {
      sub.textContent = fmt(tr().appSubtitlePattern, campaignTitle(def), def.code);
      document.documentElement.setAttribute("data-campaign", def.theme || def.id);
    } else {
      sub.textContent = tr().appSubtitle;
      document.documentElement.removeAttribute("data-campaign");
    }
  }

  /* Effective theme, resolving "follow system" (null) against the OS setting. */
  function effectiveTheme() {
    if (theme) return theme;
    var m = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
    return m && m.matches ? "dark" : "light";
  }
  function applyTheme() {
    if (theme) document.documentElement.setAttribute("data-theme", theme);
    else document.documentElement.removeAttribute("data-theme");
  }

  /* Fill a menu row with its label plus an optional right-aligned badge. Used
     for the two rows whose text depends on the current state, not on a key. */
  function setMenuRow(btn, label, badge) {
    if (!btn) return;
    btn.innerHTML = "";
    var l = el("span", "menu-label");
    l.textContent = label;
    btn.appendChild(l);
    if (badge) {
      var b = el("span", "menu-badge");
      b.textContent = badge;
      btn.appendChild(b);
    }
    btn.title = label;
    btn.setAttribute("aria-label", label);
  }
  function updateThemeToggle() {
    var dark = effectiveTheme() === "dark";
    setMenuRow(document.getElementById("btn-theme"),
      dark ? tr().themeToLight : tr().themeToDark,
      dark ? "☀️" : "🌙");
  }
  function updateLangToggle() {
    var d = tr();
    setMenuRow(document.getElementById("btn-lang"), d.langSwitchTitle, d.langSwitch);
  }

  /* The campaign help section is appended by us, since it depends on the
     active log; everything above it in the dialog is static data-i18n. */
  function renderHelpCampaign() {
    var slot = document.getElementById("help-campaign");
    slot.innerHTML = "";
    var def = activeCampaign();
    var text = def && (lang === "de" ? def.helpDe : def.helpEn);
    if (!text) return;
    var h = el("h3");
    h.textContent = campaignTitle(def);
    var p = el("p");
    p.textContent = text;
    slot.appendChild(h);
    slot.appendChild(p);
  }

  function renderAll() {
    applyLanguage();
    applyCampaignChrome();
    updateThemeToggle();
    updateLangToggle();
    renderLogSelect();
    renderHelpCampaign();
    var reason = activeId ? quarantine[activeId] : null;
    renderNotice(reason);
    document.getElementById("btn-rename").disabled = !!reason;
    if (reason) return;
    renderCampaign();
  }

  // ---- Print sheet ---------------------------------------------------------
  /* Build a static, text-only snapshot of the active log into #print-view.
     Printing the live view is not an option: the fields are inputs whose size
     is fixed in pixels for the screen width, so on paper their content would be
     cut off. The snapshot is regenerated on every print, so it always matches
     the current state. */
  function renderPrintView() {
    var view = document.getElementById("print-view");
    view.innerHTML = "";
    var log = activeLog();
    var def = activeCampaign();
    var d = tr();

    var head = el("div", "print-head");
    var h1 = el("h1");
    h1.textContent = d.appTitle;
    head.appendChild(h1);
    if (def) {
      var meta = el("p", "print-meta");
      meta.textContent = d.printCampaign + ": " + campaignTitle(def) + " (" + def.code + ")";
      head.appendChild(meta);
    }
    if (log) {
      var name = el("p", "print-meta");
      name.textContent = d.printLog + ": " + (log.title || d.untitled);
      head.appendChild(name);
    }
    var when = el("p", "print-meta");
    when.textContent = d.printedOn + " " + new Date().toLocaleDateString(d.htmlLang);
    head.appendChild(when);
    view.appendChild(head);

    if (log && def && !quarantine[log.id] && typeof def.renderPrint === "function") {
      def.renderPrint(view, campaignContext(def, log));
    }

    var legal = el("p", "print-disclaimer");
    legal.textContent = d.disclaimer;
    view.appendChild(legal);
  }

  // ---- New-log dialog ------------------------------------------------------
  /* The campaign of a log is fixed at creation, so it has to be asked for.
     With exactly one campaign registered there is nothing to ask, and the
     dialog is skipped — but it ships now, so campaign two costs no UI work. */
  function newLog() {
    if (campaigns.length <= 1) {
      var only = campaigns[0];
      if (!only) return;
      createLog(only.id, nextLogTitle(only.id));
      return;
    }
    var dlg = document.getElementById("campaign-dialog");
    var list = document.getElementById("campaign-choices");
    var titleInput = document.getElementById("new-log-title");
    list.innerHTML = "";
    campaigns.forEach(function (def, i) {
      var row = el("label", "choice");
      var radio = el("input", null, { type: "radio", name: "campaign", value: def.id });
      if (i === 0) radio.checked = true;
      var text = el("span", "choice-text");
      var strong = el("strong");
      strong.textContent = campaignTitle(def) + " (" + def.code + ")";
      var small = el("small");
      small.textContent = def.scenarioCount
        ? fmt(tr().scenarioCount, def.scenarioCount) : "";
      text.appendChild(strong);
      text.appendChild(small);
      row.appendChild(radio);
      row.appendChild(text);
      radio.addEventListener("change", function () {
        titleInput.value = nextLogTitle(def.id);
      });
      list.appendChild(row);
    });
    titleInput.value = nextLogTitle(campaigns[0].id);
    dlg.showModal();
  }

  function createLog(campaignId, title) {
    var log = emptyLog(campaignId, title);
    logs[log.id] = log;
    activeId = log.id;
    saveStorage();
    renderAll();
  }

  // ---- Menu placement -----------------------------------------------------
  function placeMenu() {
    var btn = document.getElementById("btn-menu");
    var menu = document.getElementById("main-menu");
    if (!btn || !menu) return;
    var r = btn.getBoundingClientRect();
    menu.style.top = (r.bottom + 6) + "px";
    if (window.innerWidth <= 640) {
      menu.style.left = MENU_EDGE + "px";       // full width, equal margins
      menu.style.right = MENU_EDGE + "px";
    } else {
      menu.style.left = "auto";                 // right-aligned under the button
      menu.style.right = Math.max(MENU_EDGE, window.innerWidth - r.right) + "px";
    }
  }

  // ---- Wiring --------------------------------------------------------------
  function bind() {
    document.getElementById("log-select").addEventListener("change", function (e) {
      activeId = e.target.value;
      saveStorage();
      renderAll();
    });

    document.getElementById("btn-new").addEventListener("click", newLog);

    var dlg = document.getElementById("campaign-dialog");
    document.getElementById("campaign-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var picked = document.querySelector("#campaign-choices input:checked");
      if (!picked) return;
      var title = document.getElementById("new-log-title").value.trim();
      dlg.close();
      createLog(picked.value, title || nextLogTitle(picked.value));
    });
    document.getElementById("btn-campaign-cancel").addEventListener("click", function () {
      dlg.close();
    });

    document.getElementById("btn-rename").addEventListener("click", function () {
      var log = activeLog();
      if (!log || quarantine[activeId]) return;
      var name = window.prompt(tr().renamePrompt, log.title);
      if (name && name.trim()) {
        log.title = name.trim();
        scheduleSave();
        renderLogSelect();
      }
    });

    document.getElementById("btn-delete").addEventListener("click", function () {
      if (!activeLog()) return;
      if (!window.confirm(tr().deleteConfirm)) return;
      delete quarantine[activeId];
      delete logs[activeId];
      var ids = Object.keys(logs);
      if (ids.length === 0) {
        var only = campaigns[0];
        if (only) {
          var log = emptyLog(only.id);
          logs[log.id] = log;
          activeId = log.id;
        } else {
          activeId = null;
        }
      } else {
        activeId = ids[0];
      }
      saveStorage();
      renderAll();
    });

    document.getElementById("btn-export").addEventListener("click", exportLog);
    document.getElementById("btn-import").addEventListener("click", function () {
      document.getElementById("file-import").click();
    });
    document.getElementById("file-import").addEventListener("change", function (e) {
      if (e.target.files && e.target.files[0]) importFromFile(e.target.files[0]);
      e.target.value = "";
    });
    document.getElementById("btn-share").addEventListener("click", shareLink);

    document.getElementById("btn-print").addEventListener("click", function () {
      renderPrintView();
      window.print();
    });
    // Also covers the browser's own print path (Ctrl+P, menu), which never
    // passes through the button above.
    window.addEventListener("beforeprint", renderPrintView);

    // Menu. With native popover support the browser drives opening (via
    // popovertarget), Esc and click-outside; we only mirror the state. Without
    // it we drive the panel ourselves, so the actions never become unreachable.
    var menu = document.getElementById("main-menu");
    var menuBtn = document.getElementById("btn-menu");
    var nativePopover = typeof menu.showPopover === "function";

    function reflectMenu(open) {
      menuOpen = open;
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) placeMenu();
    }
    function closeMenu() {
      if (!menuOpen) return;
      if (nativePopover) menu.hidePopover();
      else { menu.classList.remove("is-open"); reflectMenu(false); }
    }

    if (nativePopover) {
      // Place it in "beforetoggle", which runs before the panel is painted;
      // "toggle" fires afterwards and would make it visibly jump.
      menu.addEventListener("beforetoggle", function (e) {
        if (e.newState === "open") placeMenu();
      });
      menu.addEventListener("toggle", function (e) {
        reflectMenu(e.newState === "open");
      });
    } else {
      menuBtn.addEventListener("click", function () {
        if (menuOpen) return closeMenu();
        menu.classList.add("is-open");
        reflectMenu(true);
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeMenu();
      });
      document.addEventListener("click", function (e) {
        if (menuOpen && !menu.contains(e.target) && e.target !== menuBtn) closeMenu();
      });
    }
    window.addEventListener("resize", function () { if (menuOpen) placeMenu(); });
    // Choosing an action closes the menu; capture, so it happens before the
    // handlers that open a prompt()/confirm() dialog.
    menu.addEventListener("click", function (e) {
      if (e.target.closest(".menu-item")) closeMenu();
    }, true);

    // Help overlay: <dialog> already handles Esc and returning focus.
    var help = document.getElementById("help-dialog");
    document.getElementById("btn-help").addEventListener("click", function () {
      help.showModal();
    });
    document.getElementById("btn-help-close").addEventListener("click", function () {
      help.close();
    });
    help.addEventListener("click", function (e) {
      if (e.target === help) help.close();   // click on the backdrop area
    });

    document.getElementById("btn-lang").addEventListener("click", function () {
      lang = lang === "de" ? "en" : "de";
      saveStorage();
      renderAll();
    });

    document.getElementById("btn-theme").addEventListener("click", function () {
      theme = effectiveTheme() === "dark" ? "light" : "dark";
      applyTheme();
      saveStorage();
      updateThemeToggle();
    });

    /* Saving is debounced, so a page that goes away mid-edit would lose the last
       few hundred milliseconds of typing. "pagehide" covers navigation and, on
       iOS, the app being backgrounded; "visibilitychange" covers tab and app
       switches, where pagehide is not guaranteed to fire at all. */
    window.addEventListener("pagehide", flushPending);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") flushPending();
    });
  }

  // ---- Boot ----------------------------------------------------------------
  async function init() {
    W.setCommitHandler(scheduleSave);
    loadStorage();
    applyTheme();
    requestPersistentStorage();

    // A shared log in the URL fragment: update it if already present (by GUID
    // or name), otherwise import as new (after confirmation).
    var m = location.hash.match(/(?:^#|[#&])log=([^&]+)/);
    if (m) {
      try {
        var got = await decodePayload(decodeURIComponent(m[1]));
        if (got && got.log) importLog(got.log, true);
        else if (got && got.raw) importQuarantined(got.raw);
      } catch (e) { /* malformed link — ignore */ }
      history.replaceState(null, "", location.pathname + location.search);
    }

    if (!activeId || !logs[activeId]) {
      var ids = Object.keys(logs);
      if (ids.length) {
        activeId = ids[0];
      } else if (campaigns.length) {
        var first = emptyLog(campaigns[0].id);
        logs[first.id] = first;
        activeId = first.id;
        saveStorage();
      }
    }

    bind();
    renderAll();
    maybeRemindExport();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

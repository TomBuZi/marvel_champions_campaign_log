/* Reusable sheet controls, ported from the Neon Hope campaign log.

   Every campaign module renders its own panels but draws them from this
   toolbox, so a fix to the drag handling or the checkbox behaviour lands in all
   of them at once. Nothing here knows about a specific campaign: widgets take
   a value plus an onChange callback and never touch the log or storage.

   Loaded as a plain script (no ES module) so the app also works via file://. */
(function (global) {
  "use strict";

  /* A leading "~" marks a list entry as done (shown struck through). Depending
     on keyboard layout and dead-key handling, typing a tilde can yield one of
     several look-alike characters instead of ASCII "~", so accept those too.
     Zero-width characters may sneak in when text is pasted; skip them. */
  var STRIKE_RE = /^[\s\u200B-\u200D\uFEFF]*[~\u02DC\u02F7\u223C\u223F\u301C\uFF5E][ \t]?/;

  function el(tag, cls, attrs) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    });
    return e;
  }

  /* Split an entry into its "done" flag and the text to display: a leading
     tilde marks it as done and is not shown. Used by both the editor and the
     print sheet, so the two can never disagree about what counts as struck. */
  function splitStrike(raw) {
    var text = String(raw == null ? "" : raw);
    if (!STRIKE_RE.test(text)) return { struck: false, text: text };
    return { struck: true, text: text.replace(STRIKE_RE, "") };
  }

  /* Resize a textarea to fit its content (no scrollbar, no manual handle). */
  function autoGrow(ta) {
    ta.style.height = "auto";
    var border = ta.offsetHeight - ta.clientHeight; // top+bottom border (border-box)
    ta.style.height = (ta.scrollHeight + border) + "px";
  }

  // ---- Checkbox -----------------------------------------------------------
  /* cfg: { checked, label, tone?, disabled?, lockReason?, onChange(next) }
     `label` becomes the accessible name; pass the row and column together
     ("Art Museum Heist – Completed"), because a bare checkbox in a grid is
     otherwise unnameable. `disabled` keeps the mark visible but takes the
     control out of reach, and `lockReason` says why on hover. */
  function checkbox(cfg) {
    var box = el("input", "sheet-check" + (cfg.tone ? " tone-" + cfg.tone : "") +
      (cfg.disabled ? " is-locked" : ""),
      { type: "checkbox", "aria-label": cfg.label,
        title: cfg.disabled && cfg.lockReason ? cfg.lockReason : cfg.label });
    box.checked = !!cfg.checked;
    box.disabled = !!cfg.disabled;
    box.addEventListener("change", function () { cfg.onChange(box.checked); });
    return box;
  }

  // ---- Number field -------------------------------------------------------
  /* cfg: { value, min, max, label, hint?, onChange(next) }
     `value` and `next` are a number or null. Empty stays null rather than
     becoming 0: on the paper sheet a blank box means "nothing recorded yet",
     and a hero at 0 hit points is a very different statement. `hint` renders a
     dimmed suffix, used for the hero's printed starting hit points. */
  function numberField(cfg) {
    var wrap = el("span", "num-field");
    var input = el("input", "num-input", {
      type: "number", inputmode: "numeric",
      min: cfg.min == null ? null : String(cfg.min),
      max: cfg.max == null ? null : String(cfg.max),
      "aria-label": cfg.label, title: cfg.label,
    });
    input.value = cfg.value == null ? "" : String(cfg.value);
    var hint = el("span", "num-hint", { "aria-hidden": "true" });
    hint.textContent = cfg.hint ? "/ " + cfg.hint : "";
    input.addEventListener("input", function () {
      cfg.onChange(clampNumber(input.value, cfg.min, cfg.max));
    });
    /* Clamp on blur rather than on every keystroke: rewriting the field while
       someone is still typing "12" turns an intermediate "1" into a fight. */
    input.addEventListener("blur", function () {
      var v = clampNumber(input.value, cfg.min, cfg.max);
      input.value = v == null ? "" : String(v);
      cfg.onChange(v);
    });
    wrap.appendChild(input);
    wrap.appendChild(hint);
    return wrap;
  }

  /* Parse and clamp a field value into an integer or null. Shared by the
     widget and the campaign modules' normalize(), so a typed value and an
     imported one are treated identically. */
  function clampNumber(raw, min, max) {
    if (raw === "" || raw == null) return null;
    var n = Number(raw);
    if (!isFinite(n)) return null;
    n = Math.round(n);
    if (min != null && n < min) n = min;
    if (max != null && n > max) n = max;
    return n;
  }

  // ---- Text field ---------------------------------------------------------
  /* cfg: { value, label, placeholder?, maxLength?, listId?, onChange(next) }
     `listId` attaches a <datalist> for suggestions while still accepting free
     text — the paper sheet is a fill-in field, and a hero missing from our
     roster must not become unenterable. */
  function textField(cfg) {
    var input = el("input", "text-input", {
      type: "text", "aria-label": cfg.label, title: cfg.label,
      placeholder: cfg.placeholder || null,
      maxlength: cfg.maxLength == null ? null : String(cfg.maxLength),
      list: cfg.listId || null,
      autocomplete: "off", spellcheck: "false",
    });
    input.value = cfg.value == null ? "" : String(cfg.value);
    input.addEventListener("input", function () { cfg.onChange(input.value); });
    input.addEventListener("blur", function () {
      input.value = input.value.trim();
      cfg.onChange(input.value);
    });
    return input;
  }

  /* A <datalist> of suggestions, to be appended once and referenced by id. */
  function dataList(id, values) {
    var dl = el("datalist", null, { id: id });
    values.forEach(function (v) {
      dl.appendChild(el("option", null, { value: v }));
    });
    return dl;
  }

  // ---- Select with mutual exclusion ---------------------------------------
  /* One <select> out of a fixed pool. cfg:
       { value, options: [{value,label}], placeholder, label, onChange(next) }
     Mutual exclusion across a set of these selects is applied afterwards by
     syncUnique(), which needs them all to exist first. */
  function poolSelect(cfg) {
    var sel = el("select", "pool-select", { "aria-label": cfg.label, title: cfg.label });
    var ph = el("option", null, { value: "" });
    ph.textContent = cfg.placeholder;
    sel.appendChild(ph);
    cfg.options.forEach(function (o) {
      var opt = el("option", null, { value: o.value, lang: o.lang || null });
      opt.textContent = o.label;
      sel.appendChild(opt);
    });
    sel.value = cfg.value || "";
    sel.addEventListener("change", function () { cfg.onChange(sel.value); });
    return sel;
  }

  /* Disable, in every select of the group, the options already chosen in one
     of the others — keeping the placeholder and each select's own value
     selectable. Straight port of the roster picker in the template. */
  function syncUnique(selects) {
    var taken = selects.map(function (s) { return s.value; })
      .filter(function (v) { return v; });
    selects.forEach(function (s) {
      Array.prototype.forEach.call(s.options, function (opt) {
        opt.disabled = !!opt.value && opt.value !== s.value && taken.indexOf(opt.value) !== -1;
      });
    });
  }

  // ---- Icon button --------------------------------------------------------
  /* A small square button carrying one glyph. cfg:
       { glyph, label, disabled?, lockReason?, onClick }
     The glyph is decoration — `label` is what carries the meaning, so it
     becomes both the accessible name and the tooltip. */
  function iconButton(cfg) {
    var b = el("button", "icon-btn", {
      type: "button", "aria-label": cfg.label,
      title: cfg.disabled && cfg.lockReason ? cfg.lockReason : cfg.label,
    });
    b.textContent = cfg.glyph;
    b.disabled = !!cfg.disabled;
    b.addEventListener("click", cfg.onClick);
    return b;
  }

  /* One item out of a list, uniformly at random; null for an empty list. */
  function pickRandom(items) {
    if (!items || !items.length) return null;
    return items[Math.floor(Math.random() * items.length)];
  }

  // ---- Progress row -------------------------------------------------------
  /* A row of N boxes acting as a 0..N counter. cfg:
       { value, steps: [label], labelFor(i), disabled?, lockReason?, onChange(next) }
     Clicking a box sets the counter to that box; clicking the current top box
     lowers it by one, which is the only way back to zero. `steps` carries one
     label per box, so the last box can read "Failed" instead of "3".
     `disabled` freezes the row: the marks stay exactly as they are and stay
     legible, but the boxes cannot be operated and drop out of the tab order. */
  function progressRow(cfg) {
    var wrap = el("div", "progress-row" + (cfg.disabled ? " is-locked" : ""));
    cfg.steps.forEach(function (stepLabel, i) {
      var n = i + 1;
      var box = el("button", "progress-box" + (n <= cfg.value ? " filled" : "") +
        (i === cfg.steps.length - 1 ? " last" : ""),
        { type: "button", "aria-label": cfg.labelFor(n),
          title: cfg.disabled && cfg.lockReason ? cfg.lockReason : cfg.labelFor(n),
          "aria-pressed": n <= cfg.value ? "true" : "false" });
      box.textContent = stepLabel;
      box.disabled = !!cfg.disabled;
      box.addEventListener("click", function () {
        cfg.onChange(cfg.value === n ? n - 1 : n);
      });
      wrap.appendChild(box);
    });
    return wrap;
  }

  // ---- Pointer-based drag & drop for string lists -------------------------
  // Works with mouse, touch and pen through one implementation. `entryLists`
  // maps each list id to its live array + metadata; `dragState` tracks the
  // source of the current drag.
  var dragState = null;          // { listId, index, group }
  var entryLists = {};           // listId -> { group, getArray, canReceive, redraw }
  var autoScrollRAF = null;
  var lastPointerY = 0;
  /* Called after a drag moved something, so the app can persist. Set once by
     core.js; a no-op keeps the widgets usable in isolation. */
  var onCommit = function () {};

  /* Drop every registration whose id starts with `prefix`. Called before a
     re-render so lists that no longer exist cannot receive a drop. */
  function forgetLists(prefix) {
    Object.keys(entryLists).forEach(function (id) {
      if (id.indexOf(prefix) === 0) delete entryLists[id];
    });
  }

  function clearDragCues() {
    dragState = null;
    stopAutoScroll();
    document.body.className = document.body.className.split(/\s+/)
      .filter(function (c) { return c && c.indexOf("dnd-") !== 0; }).join(" ");
    document.querySelectorAll(".entry-row.dragging, .entry-row.drop-before, .entry-row.drop-after")
      .forEach(function (r) { r.classList.remove("dragging", "drop-before", "drop-after"); });
    document.querySelectorAll(".entry-list.drop-active")
      .forEach(function (l) { l.classList.remove("drop-active"); });
  }

  /* Move the dragged item into list `dstListId` at `targetIndex` (reorder
     within a list, or a cross-list move for the same group). */
  function moveEntry(dstListId, targetIndex) {
    if (!dragState) return;
    var src = entryLists[dragState.listId], dst = entryLists[dstListId];
    if (!src || !dst || src.group !== dst.group) return;
    if (dstListId === dragState.listId) {
      var arr = dst.getArray(), from = dragState.index;
      if (from < 0 || from >= arr.length) return;
      if (targetIndex > from) targetIndex--;
      if (targetIndex === from) return;
      arr.splice(targetIndex, 0, arr.splice(from, 1)[0]);
      dst.redraw();
    } else {
      if (!dst.canReceive()) return;
      var item = src.getArray().splice(dragState.index, 1)[0];
      if (item === undefined) return;
      dst.getArray().splice(targetIndex, 0, item);
      src.redraw();
      dst.redraw();
    }
    onCommit();
  }

  /* Resolve the drop target under a viewport point, or null. */
  function resolveTarget(x, y) {
    if (!dragState) return null;
    var elu = document.elementFromPoint(x, y);
    if (!elu || !elu.closest) return null;
    var listEl = elu.closest(".entry-list");
    if (!listEl) return null;
    var dstId = listEl.getAttribute("data-list-id");
    var dst = entryLists[dstId];
    if (!dst || dst.group !== dragState.group) return null;
    if (dstId !== dragState.listId && !dst.canReceive()) return null;
    var rows = Array.prototype.filter.call(listEl.children, function (c) {
      return c.classList && c.classList.contains("entry-row");
    });
    var row = elu.closest(".entry-row");
    if (row && rows.indexOf(row) !== -1) {
      var rect = row.getBoundingClientRect();
      var after = (y - rect.top) > rect.height / 2;
      return { listId: dstId, index: rows.indexOf(row) + (after ? 1 : 0), rowEl: row, after: after };
    }
    return { listId: dstId, index: dst.getArray().length, listEl: listEl };
  }

  /* Paint insertion cues for a resolved target (or clear them). */
  function paintCues(target) {
    document.querySelectorAll(".entry-row.drop-before, .entry-row.drop-after")
      .forEach(function (r) { r.classList.remove("drop-before", "drop-after"); });
    document.querySelectorAll(".entry-list.drop-active")
      .forEach(function (l) { l.classList.remove("drop-active"); });
    if (!target) return;
    if (target.rowEl) target.rowEl.classList.add(target.after ? "drop-after" : "drop-before");
    else if (target.listEl) target.listEl.classList.add("drop-active");
  }

  /* Auto-scroll the page while dragging near the top/bottom viewport edges. */
  function startAutoScroll() {
    if (autoScrollRAF || typeof requestAnimationFrame !== "function") return;
    var step = function () {
      var margin = 64, h = window.innerHeight || 0, dy = 0;
      if (lastPointerY < margin) dy = -Math.ceil((margin - lastPointerY) / 5);
      else if (lastPointerY > h - margin) dy = Math.ceil((lastPointerY - (h - margin)) / 5);
      if (dy) window.scrollBy(0, dy);
      autoScrollRAF = requestAnimationFrame(step);
    };
    autoScrollRAF = requestAnimationFrame(step);
  }
  function stopAutoScroll() {
    if (autoScrollRAF && typeof cancelAnimationFrame === "function") cancelAnimationFrame(autoScrollRAF);
    autoScrollRAF = null;
  }

  /* Generic editable string-list field: rows of text inputs (or textareas)
     with drag&drop reorder, per-row remove and an add button.
     Rules: the add button is disabled while an empty entry exists, and an
     entry that is emptied and blurred is removed. Items can be dragged within
     a list to reorder, or between lists of the same `group` when the target
     list's canReceive() allows it.
     cfg: { listId, group, getArray, placeholder, addLabel, removeLabel,
            dragLabel, removeConfirm?, label?, multiline?, fieldClass?,
            canReceive?, canAdd?, onChange? } */
  function stringList(cfg) {
    var field = el("div", "field " + (cfg.fieldClass || ""));
    if (cfg.label) {
      var label = el("label");
      label.textContent = cfg.label;
      field.appendChild(label);
    }

    var list = el("div", "entry-list",
      { "data-list-id": cfg.listId, "data-group": cfg.group });
    var inputSel = cfg.multiline ? "textarea" : "input";
    var canReceive = cfg.canReceive || function () { return true; };

    function sizeAll() {
      if (cfg.multiline) list.querySelectorAll("textarea").forEach(autoGrow);
    }
    function updateAddState() {
      var hasEmpty = cfg.getArray().some(function (v) { return !String(v).trim(); });
      add.disabled = hasEmpty || (cfg.canAdd ? !cfg.canAdd() : false);
    }

    function draw() {
      list.innerHTML = "";
      cfg.getArray().forEach(function (val, i) {
        var row = el("div", "entry-row");

        var grip = el("span", "entry-drag", { title: cfg.dragLabel, "aria-hidden": "true" });
        grip.textContent = "⠿";
        grip.addEventListener("pointerdown", function (e) {
          if (e.button != null && e.button > 0) return;  // primary button / touch only
          e.preventDefault();
          dragState = { listId: cfg.listId, index: i, group: cfg.group };
          row.classList.add("dragging");
          document.body.classList.add("dnd-" + cfg.group); // reveal empty drop zones
          lastPointerY = e.clientY;
          startAutoScroll();
          var pointerId = e.pointerId;
          try { if (grip.setPointerCapture) grip.setPointerCapture(pointerId); } catch (_) {}
          var pending = null;
          function onMove(ev) {
            lastPointerY = ev.clientY;
            pending = resolveTarget(ev.clientX, ev.clientY);
            paintCues(pending);
          }
          function finish(apply) {
            grip.removeEventListener("pointermove", onMove);
            grip.removeEventListener("pointerup", onUp);
            grip.removeEventListener("pointercancel", onCancel);
            try { if (grip.releasePointerCapture) grip.releasePointerCapture(pointerId); } catch (_) {}
            if (apply && pending) moveEntry(pending.listId, pending.index);
            clearDragCues();
          }
          function onUp() { finish(true); }
          function onCancel() { finish(false); }
          grip.addEventListener("pointermove", onMove);
          grip.addEventListener("pointerup", onUp);
          grip.addEventListener("pointercancel", onCancel);
        });

        var input = el(inputSel, "entry-input");
        if (cfg.multiline) input.setAttribute("rows", "1");
        else input.setAttribute("type", "text");
        input.placeholder = cfg.placeholder;

        // A leading "~" marks the entry as "done": while the field is not
        // focused it is shown struck-through with the "~" hidden; on focus the
        // raw text (with the "~") returns for editing.
        function showStruck() {
          var s = splitStrike(cfg.getArray()[i]);
          input.value = s.text;
          if (s.struck) input.classList.add("struck");
          else input.classList.remove("struck");
          if (cfg.multiline) autoGrow(input);
        }
        function showRaw() {
          input.classList.remove("struck");
          input.value = String(cfg.getArray()[i] || "");
          if (cfg.multiline) autoGrow(input);
        }
        showStruck();

        input.addEventListener("input", function () {
          cfg.getArray()[i] = input.value;
          if (cfg.multiline) autoGrow(input);
          updateAddState();
          if (cfg.onChange) cfg.onChange();
          onCommit();
        });
        input.addEventListener("focus", showRaw);
        input.addEventListener("blur", function () {
          var a = cfg.getArray();
          if (i < a.length && !String(a[i]).trim()) {
            a.splice(i, 1);
            onCommit();
            draw();
          } else {
            showStruck();
          }
        });

        var remove = el("button", "entry-remove",
          { type: "button", "aria-label": cfg.removeLabel, title: cfg.removeLabel });
        remove.textContent = "×";
        remove.addEventListener("click", function () {
          var arr = cfg.getArray();
          // Confirm only when there is actual content to lose.
          if (i < arr.length && String(arr[i]).trim() && cfg.removeConfirm &&
              !window.confirm(cfg.removeConfirm)) return;
          arr.splice(i, 1);
          onCommit();
          draw();
        });

        row.appendChild(grip);
        row.appendChild(input);
        row.appendChild(remove);
        list.appendChild(row);
      });

      updateAddState();
      if (cfg.onChange) cfg.onChange();
      sizeAll();
      if (cfg.multiline && typeof requestAnimationFrame === "function") {
        requestAnimationFrame(sizeAll);
      }
    }

    var add = el("button", "entry-add", { type: "button" });
    add.textContent = cfg.addLabel;
    add.addEventListener("click", function () {
      cfg.getArray().push("");
      onCommit();
      draw();
      var inputs = list.querySelectorAll(inputSel);
      if (inputs.length) inputs[inputs.length - 1].focus();
    });

    draw();
    field.appendChild(list);
    field.appendChild(add);

    entryLists[cfg.listId] = {
      group: cfg.group, getArray: cfg.getArray, canReceive: canReceive, redraw: draw,
    };
    return field;
  }

  // ---- Value coercion (shared with the campaign modules' normalize) --------
  /* Normalise a value into a clean array of non-empty strings.
     opts.split: split a legacy string on newlines (else wrap it as one entry).
     opts.trim: trim each entry (for short names; off for free-text entries). */
  function coerceStringList(v, opts) {
    opts = opts || {};
    var arr = [];
    if (Array.isArray(v)) arr = v.slice();
    else if (typeof v === "string") arr = opts.split ? v.split(/\r?\n/) : [v];
    return arr
      /* Drop holes before stringifying: String(null) is "null", which would
         survive the emptiness filter below and show up as a visible entry. */
      .filter(function (x) { return x != null; })
      .map(function (x) { return typeof x === "string" ? x : String(x); })
      .map(function (x) { return opts.trim ? x.trim() : x; })
      .filter(function (x) { return x.trim().length > 0; });
  }

  /* Tolerant boolean: hand-edited JSON and older exports may carry 1 or
     "true" where a checkbox is meant. Always a real boolean on the way out. */
  function coerceBool(v) {
    return v === true || v === 1 || v === "true";
  }

  /* Free text, cleaned: control characters out (they are invisible and break
     the print view), optionally length-capped, trimmed. */
  function coerceText(v, maxLength) {
    var s = typeof v === "string" ? v : (v == null ? "" : String(v));
    s = s.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
    return maxLength ? s.slice(0, maxLength) : s;
  }

  global.W = {
    el: el,
    splitStrike: splitStrike,
    autoGrow: autoGrow,
    checkbox: checkbox,
    numberField: numberField,
    clampNumber: clampNumber,
    textField: textField,
    dataList: dataList,
    poolSelect: poolSelect,
    syncUnique: syncUnique,
    iconButton: iconButton,
    pickRandom: pickRandom,
    progressRow: progressRow,
    stringList: stringList,
    forgetLists: forgetLists,
    coerceStringList: coerceStringList,
    coerceBool: coerceBool,
    coerceText: coerceText,
    /* core.js installs the persistence hook here once, so widgets stay
       independent of how (or whether) anything is stored. */
    setCommitHandler: function (fn) { onCommit = fn || function () {}; },
  };
})(window);

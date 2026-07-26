/*
 * AfroTools AI vertical landing pages — live layer.
 *
 * Three jobs, all optional enhancements over server-rendered content:
 *  1. Country facts: preselect the tab matching the visitor's selected country.
 *  2. Prompt chips: clicking a chip fills the hero input (the form itself is a
 *     plain GET to /ai/, so routing works with or without this script).
 *  3. Engine demos: compute the worked example in the browser using the same
 *     engine the destination calculator uses. If the engine fails to load or
 *     returns an error, the panel stays hidden — a missing number is never
 *     faked and never rendered as zero.
 */
(function (win, doc) {
  "use strict";

  var CONFIG = win.AI_VERTICAL_LIVE || null;

  function readSelectedCountry() {
    try {
      var api = win.AfroCountry && win.AfroCountry.getSelected && win.AfroCountry.getSelected();
      if (api && api.code) return String(api.code).toUpperCase();
    } catch (err) { /* fall through */ }
    try {
      var stored = win.localStorage && win.localStorage.getItem("afro_selected_country");
      if (stored) return String(stored).toUpperCase();
    } catch (err) { /* fall through */ }
    return null;
  }

  function formatAmount(value) {
    if (!isFinite(value)) return null;
    return Math.round(value).toLocaleString("en-US");
  }

  /* ── 1. Country facts tabs ─────────────────────────────────── */
  function initCountryTabs() {
    var tabs = [].slice.call(doc.querySelectorAll("[data-cf-tab]"));
    if (!tabs.length) return;
    var panels = [].slice.call(doc.querySelectorAll("[data-cf-panel]"));

    function activate(code) {
      var found = false;
      tabs.forEach(function (tab) {
        var active = tab.getAttribute("data-cf-tab") === code;
        tab.setAttribute("aria-selected", active ? "true" : "false");
        if (active) found = true;
      });
      if (!found) return false;
      panels.forEach(function (panel) {
        panel.hidden = panel.getAttribute("data-cf-panel") !== code;
      });
      return true;
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        activate(tab.getAttribute("data-cf-tab"));
      });
    });

    var selected = readSelectedCountry();
    if (selected) activate(selected);
    // AfroCountry loads lazily behind the navbar; retry once it lands.
    var tries = 0;
    var timer = win.setInterval(function () {
      tries += 1;
      var code = readSelectedCountry();
      if (code || tries > 10) {
        win.clearInterval(timer);
        if (code) activate(code);
      }
    }, 500);
  }

  /* ── 2. Prompt chips fill the hero input ───────────────────── */
  function initChips() {
    var input = doc.getElementById("vlPrompt");
    if (!input) return;
    [].slice.call(doc.querySelectorAll("[data-chip-prompt]")).forEach(function (chip) {
      chip.addEventListener("click", function (event) {
        event.preventDefault();
        input.value = chip.getAttribute("data-chip-prompt") || "";
        input.focus();
      });
    });
  }

  /* ── 3. Engine-computed worked example ─────────────────────── */
  function loadScript(src, onload, onerror) {
    var script = doc.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = onload;
    script.onerror = onerror;
    doc.head.appendChild(script);
  }

  function renderRows(rows, currency) {
    var body = doc.querySelector("[data-demo-rows]");
    var shell = doc.querySelector("[data-demo-live]");
    if (!body || !shell) return;
    var html = rows.map(function (row) {
      var amount = row.raw != null ? row.raw : (currency + " " + formatAmount(row.value));
      var cls = row.emphasis ? ' class="vl-demo-row vl-demo-row--total"' : ' class="vl-demo-row"';
      return "<div" + cls + "><span>" + row.label + "</span><strong>" + amount + "</strong></div>";
    }).join("");
    body.innerHTML = html;
    shell.hidden = false;
  }

  function runPayeDemo(demo) {
    var variants = demo.variants || {};
    var selected = readSelectedCountry();
    // Follow the visitor's selected country when we have its engine; otherwise
    // stay consistent with the transcript's story (defaultVariant).
    var variant = (selected && variants[selected]) ||
      variants[demo.defaultVariant] || variants[Object.keys(variants)[0]];
    if (!variant) return;

    loadScript(variant.engineSrc, function () {
      try {
        var engine = win.AfroTools && win.AfroTools.engines && win.AfroTools.engines[variant.engineKey];
        if (!engine || typeof engine.calculate !== "function") return;
        var result = engine.calculate(variant.gross, variant.options || {});
        if (!result) return;
        var rows;
        if (variant.mode === "annual") {
          // Nigerian engine works in annual figures; the story is monthly.
          rows = [
            { label: "Gross pay", raw: variant.grossLabel },
            { label: "PAYE (monthly)", value: result.tax / 12 },
            { label: "Take-home (monthly)", value: result.netMonthly, emphasis: true },
            { label: "Effective tax rate", raw: result.effectiveRate.toFixed(1) + "%" }
          ];
          renderRows(rows, "₦");
        } else {
          rows = [
            { label: "Gross pay", raw: variant.grossLabel },
            { label: "PAYE", value: result.paye },
            { label: "NSSF", value: result.nssf },
            { label: "SHIF", value: result.shif },
            { label: "Housing levy", value: result.ahl },
            { label: "Take-home", value: result.net, emphasis: true },
            { label: "True employer cost", value: result.totalEmployerCost }
          ];
          renderRows(rows, "KES");
        }
        var meta = doc.querySelector("[data-demo-assumptions]");
        if (meta) meta.textContent = variant.assumptions;
        var head = doc.querySelector(".vl-demo-live-head");
        if (head && variant.country) head.textContent = demo.title + " — " + variant.country;
        var link = doc.querySelector("[data-demo-tool]");
        if (link) {
          link.href = variant.toolHref;
          link.textContent = "Open the " + variant.toolLabel + " →";
        }
      } catch (err) { /* leave hidden — never fake a number */ }
    }, function () { /* engine unreachable: panel stays hidden */ });
  }

  function runDutyDemo(demo) {
    loadScript(demo.engineSrc, function () {
      try {
        var engine = win.AfroImportDutyNigeriaEngine;
        if (!engine || typeof engine.calculate !== "function") return;
        var inputs = demo.inputs || {};
        var result = engine.calculate(inputs);
        if (!result || !result.valid) return;
        renderRows([
          { label: "CIF value", value: result.cif },
          { label: "Duty (" + inputs.dutyRate + "%)", value: result.duty },
          { label: "VAT (" + inputs.vatRate + "%)", value: result.vat },
          { label: "Port + clearing", value: (inputs.portCharges || 0) + (inputs.clearingFee || 0) },
          { label: "Estimated landed cost", value: result.totalUsd, emphasis: true }
        ], "₦");
      } catch (err) { /* leave hidden */ }
    }, function () { /* leave hidden */ });
  }

  function initDemo() {
    if (!CONFIG || !CONFIG.demo) return;
    if (CONFIG.demo.type === "paye") runPayeDemo(CONFIG.demo);
    else if (CONFIG.demo.type === "duty") runDutyDemo(CONFIG.demo);
  }

  function init() {
    initCountryTabs();
    initChips();
    initDemo();
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init);
  else init();
})(window, document);

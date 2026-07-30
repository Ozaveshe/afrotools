(function () {
  "use strict";

  var PATCH_ATTRIBUTE = "data-fr-creative-route-real-reflow";
  document.documentElement.setAttribute("data-fr-creative-surface", "");
  document.documentElement.setAttribute("data-fr-creative-contrast-owner", "");

  var shadowRules = {
    "afro-navbar": [
      "@media (max-width: 480px) {",
      "  nav, .inner { max-inline-size: 100%; min-inline-size: 0; }",
      "  .inner { gap: 6px; }",
      "  .logo { min-inline-size: 0; }",
      "  .logo-mark { block-size: 24px; inline-size: 24px; }",
      "  .logo-name { font-size: .72rem; }",
      "  .right { flex: 0 0 44px; gap: 0; min-inline-size: 44px; }",
      "  .right > :not(.burger) { display: none !important; }",
      "}"
    ].join("\n"),
    "afro-footer": [
      ":host, footer, .wrap { max-inline-size: 100%; }",
      "footer, .wrap, .links, .stats, .links > div, .col-title, .col-link { overflow-wrap: anywhere; }",
      "@media (max-width: 480px) {",
      "  .wrap { padding-inline: 12px; }",
      "  .links, .stats { grid-template-columns: minmax(0, 1fr); }",
      "  .nl-form { flex-direction: column; }",
      "  .nl-btn { inline-size: 100%; white-space: normal; }",
      "  .social, .legal { flex-wrap: wrap; }",
      "}"
    ].join("\n"),
    "afro-site-assistant": [
      ".panel-wrap:not(.open) { display: none; }",
      ".panel-wrap, .panel, .p-head, .p-head-text, .p-title, .p-sub,",
      ".quick-nav, .qn-item, .suggestions, .sug-btn, .input-row { min-inline-size: 0; }",
      ".p-title, .p-sub, .qn-item, .sug-btn { overflow-wrap: anywhere; }",
      "@media (max-width: 480px) {",
      "  .panel-wrap { inline-size: calc(100vw - 28px); }",
      "  .p-head { align-items: flex-start; flex-wrap: wrap; }",
      "  .head-actions { margin-inline-start: auto; }",
      "  .quick-nav { grid-template-columns: repeat(2, minmax(0, 1fr)); }",
      "  .input-row { flex-direction: column; }",
      "  .send-btn { inline-size: 100%; white-space: normal; }",
      "}"
    ].join("\n"),
    "afro-country-selector": [
      ":host, .cs, .cs-panel, .cs-options { max-inline-size: 100%; min-inline-size: 0; }",
      "@media (max-width: 480px) { .cs-panel { max-inline-size: calc(100vw - 28px); } }"
    ].join("\n")
  };

  var shadowContrastRules = [
    ":host([data-fr-creative-route-real-reflow]) { color-scheme: inherit; }",
    ":host([data-fr-creative-route-real-reflow]) :where(*) { color: var(--fr-proof-ink, #111827) !important; }",
    ":host([data-fr-creative-route-real-reflow]) :where(header, footer, nav, main, section, article, aside, div, form, fieldset, table, thead, tbody, tfoot, tr, th, td, dl, dt, dd, details, summary) {",
    "  background-color: var(--fr-proof-bg, #fff) !important;",
    "  background-image: none !important;",
    "  color: var(--fr-proof-ink, #111827) !important;",
    "}",
    ":host([data-fr-creative-route-real-reflow]) :where(h1, h2, h3, h4, h5, h6, p, span, small, label, legend, li, dt, dd, output, strong, em) {",
    "  background-color: transparent !important;",
    "  background-image: none !important;",
    "  color: var(--fr-proof-ink, #111827) !important;",
    "}",
    ":host([data-fr-creative-route-real-reflow]) a:not([class*='button']):not([class*='btn']) { color: var(--fr-proof-link, #004c9e) !important; }",
    ":host([data-fr-creative-route-real-reflow]) :where(button, [role='button'], input[type='button'], input[type='submit'], input[type='reset'], a[class*='button'], a[class*='btn']),",
    ":host([data-fr-creative-route-real-reflow]) :where(button, [role='button'], a[class*='button'], a[class*='btn']) :where(*) {",
    "  background-color: var(--fr-proof-control, #173f67) !important;",
    "  background-image: none !important;",
    "  border-color: var(--fr-proof-control, #173f67) !important;",
    "  color: var(--fr-proof-control-ink, #fff) !important;",
    "}",
    ":host([data-fr-creative-route-real-reflow]) :where(button, [role='button'], input[type='button'], input[type='submit'], input[type='reset'], a[class*='button'], a[class*='btn']) {",
    "  border: 2px solid var(--fr-proof-border, #475569) !important;",
    "}",
    ":host([data-fr-creative-route-real-reflow]) :where(input, textarea, select) {",
    "  background-color: var(--fr-proof-bg, #fff) !important;",
    "  border-color: var(--fr-proof-border, #64748b) !important;",
    "  color: var(--fr-proof-ink, #111827) !important;",
    "}",
    ":host([data-fr-creative-route-real-reflow]) :where(input, textarea)::placeholder {",
    "  color: var(--fr-proof-ink, #111827) !important;",
    "  opacity: 1 !important;",
    "}"
  ].join("\n");

  Object.keys(shadowRules).forEach(function (key) {
    shadowRules[key] += "\n" + shadowContrastRules;
  });

  function patchNested(root) {
    if (!root || !root.querySelectorAll) return;
    Object.keys(shadowRules).forEach(function (selector) {
      Array.prototype.forEach.call(root.querySelectorAll(selector), applyPatch);
    });
  }

  function applyPatch(element) {
    if (!element || !element.shadowRoot) return;
    var style = element.shadowRoot.querySelector("style[" + PATCH_ATTRIBUTE + "]");
    if (!style) {
      style = document.createElement("style");
      style.setAttribute(PATCH_ATTRIBUTE, "");
      style.textContent = shadowRules[element.localName];
      element.shadowRoot.appendChild(style);
    } else if (style !== element.shadowRoot.lastElementChild) {
      // Component renderers may append their own stylesheet after upgrade.
      // Keep the scoped Creative proof owner last in the shadow cascade.
      element.shadowRoot.appendChild(style);
    }
    element.setAttribute(PATCH_ATTRIBUTE, "");
    patchNested(element.shadowRoot);
    if (!element.__frCreativeReflowObserver && window.MutationObserver) {
      element.__frCreativeReflowObserver = new MutationObserver(function () {
        applyPatch(element);
      });
      element.__frCreativeReflowObserver.observe(element.shadowRoot, { childList: true });
    }
  }

  function patchSelector(selector) {
    Array.prototype.forEach.call(document.querySelectorAll(selector), applyPatch);
    if (window.customElements && customElements.whenDefined) {
      customElements.whenDefined(selector).then(function () {
        Array.prototype.forEach.call(document.querySelectorAll(selector), applyPatch);
      });
    }
  }

  Object.keys(shadowRules).forEach(patchSelector);

  if (window.MutationObserver) {
    new MutationObserver(function () {
      Object.keys(shadowRules).forEach(patchSelector);
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
})();

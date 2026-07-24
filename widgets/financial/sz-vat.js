(function () {
  "use strict";
  window.AfroWidgets = window.AfroWidgets || {};
  window.AfroWidgets.sz_vat = function (root, options) {
    options = options || {};
    var engine = window.AfroTools && window.AfroTools.SZVatEngine;
    if (!root || !engine) return;
    var mode = "add";
    function money(value) { return "E " + new Intl.NumberFormat("en-SZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value); }
    root.innerHTML = '<div class="aw aw--' + (options.theme || "light") + '"><div class="aw-title">Eswatini VAT calculator</div>' +
      '<div class="aw-tabs" role="group" aria-label="Amount mode"><button type="button" class="aw-tab aw-tab--active" data-mode="add" aria-pressed="true">Add VAT</button><button type="button" class="aw-tab" data-mode="extract" aria-pressed="false">Extract VAT</button></div>' +
      '<div class="aw-field"><label class="aw-label" for="szWidgetAmount">Amount before VAT (SZL)</label><input class="aw-input" id="szWidgetAmount" type="number" min="0" step="0.01" inputmode="decimal" value="10000"></div>' +
      '<button type="button" class="aw-btn aw-btn--primary" data-calculate>Calculate 15% VAT</button><div class="aw-widget-error" data-error role="alert"></div>' +
      '<div class="aw-result-box" data-result aria-live="polite"><div class="aw-result-label">Primary result</div><div class="aw-result-main" data-main></div><div class="aw-divider"></div><div class="aw-result-row"><span>Before VAT</span><strong data-net></strong></div><div class="aw-result-row"><span>VAT (15%)</span><strong data-vat></strong></div><div class="aw-result-row"><span>Including VAT</span><strong data-gross></strong></div></div>' +
      '<div class="aw-footer">Uses the ERS-published 15% standard rate. Standard taxable supplies only; confirm zero-rating, exemption, registration and filing separately.</div></div>';
    var amount = root.querySelector("#szWidgetAmount");
    function calculate() {
      try {
        var result = engine.calculate({ amount: amount.value, mode: mode, rateKind: "standard" });
        root.querySelector("[data-error]").textContent = "";
        root.querySelector("[data-main]").textContent = money(mode === "add" ? result.gross : result.net);
        root.querySelector("[data-net]").textContent = money(result.net);
        root.querySelector("[data-vat]").textContent = money(result.vat);
        root.querySelector("[data-gross]").textContent = money(result.gross);
      } catch (error) {
        root.querySelector("[data-error]").textContent = "Enter a non-negative amount.";
        root.querySelector("[data-main]").textContent = "";
        root.querySelector("[data-net]").textContent = "";
        root.querySelector("[data-vat]").textContent = "";
        root.querySelector("[data-gross]").textContent = "";
      }
    }
    root.querySelectorAll("[data-mode]").forEach(function (button) { button.addEventListener("click", function () { mode = button.dataset.mode; root.querySelectorAll("[data-mode]").forEach(function (item) { item.classList.toggle("aw-tab--active", item === button); item.setAttribute("aria-pressed", String(item === button)); }); root.querySelector(".aw-label").textContent = mode === "add" ? "Amount before VAT (SZL)" : "Amount including VAT (SZL)"; calculate(); }); });
    root.querySelector("[data-calculate]").addEventListener("click", calculate); amount.addEventListener("input", calculate); calculate();
  };
})();

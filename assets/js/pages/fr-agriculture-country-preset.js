(function () {
  "use strict";

  function applyCountryPreset() {
    var requested = new URLSearchParams(window.location.search).get("country");
    var rows = window.AfroTools && window.AfroTools.countryIndex;
    if (!requested || !Array.isArray(rows)) return;

    var needle = requested.trim().toLowerCase();
    var country = rows.find(function (row) {
      return String(row.code || "").toLowerCase() === needle || String(row.slug || "").toLowerCase() === needle;
    });
    if (!country) return;

    var select = document.getElementById("country") || document.getElementById("countryCode");
    if (!select || !Array.from(select.options).some(function (option) { return option.value === country.code; })) return;

    select.value = country.code;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", applyCountryPreset, { once: true });
  else applyCountryPreset();
})();

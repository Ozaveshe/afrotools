(function () {
  "use strict";

  function init() {
    var form = document.getElementById("carsCatalogForm");
    if (!form) return;
    var vehicleInput = document.getElementById("carsCatalogVehicle");
    var countryInput = document.getElementById("carsCatalogCountry");
    var options = document.getElementById("carsCatalogOptions");
    var status = document.getElementById("carsCatalogStatus");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var value = vehicleInput.value.trim().toLowerCase();
      var selected = Array.from(options.options).find(function (option) {
        return option.value.toLowerCase() === value;
      });
      if (!selected) {
        status.textContent = "Choose a make, model, and year from the catalog suggestions.";
        vehicleInput.focus();
        return;
      }
      var destination = countryInput.value.split("|");
      var query = new URLSearchParams({
        country: destination[0],
        make: selected.dataset.make,
        model: selected.dataset.model.split("/")[0].trim(),
        year: selected.dataset.year,
        bodyType: selected.dataset.body,
        newQuote: "1"
      });
      status.textContent = "Opening an editable import estimate. Enter a current seller quote there.";
      window.location.assign("/tools/car-import-cost/" + destination[1] + "/?" + query.toString());
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

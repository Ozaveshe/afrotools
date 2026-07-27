(function () {
  "use strict";

  var form = document.getElementById("climateForm");
  if (!form) return;

  var results = document.getElementById("cl-results");
  var status = document.getElementById("cl-form-status");
  var resultSub = document.getElementById("cl-result-sub");
  var actionIds = ["copyClimateSummary", "saveClimateDashboard", "downloadClimatePdf"];
  var negativeAllowed = { rainfallAnomaly: true };

  function setStatus(message, isError) {
    if (!status) return;
    status.textContent = message || "";
    status.classList.toggle("is-error", Boolean(isError));
    status.setAttribute("role", isError ? "alert" : "status");
  }

  function setActionsDisabled(disabled) {
    actionIds.forEach(function (id) {
      var control = document.getElementById(id);
      if (control) control.disabled = disabled;
    });
  }

  function clearResult(message) {
    if (results) {
      results.classList.remove("on", "is-stale");
      results.setAttribute("aria-hidden", "true");
    }
    setActionsDisabled(true);
    if (resultSub) resultSub.textContent = message || "Run the tool to see a tailored result.";
  }

  function invalidField() {
    var fields = Array.prototype.slice.call(form.querySelectorAll("[data-cl-field]"));
    for (var index = 0; index < fields.length; index += 1) {
      var field = fields[index];
      if (field.required && String(field.value || "").trim() === "") return field;
      if (field.getAttribute("data-cl-number") !== "true") continue;
      var value = Number(field.value);
      if (!Number.isFinite(value)) return field;
      if (value < 0 && !negativeAllowed[field.id]) return field;
      if (/Pct$/.test(field.id) && value > 100) return field;
    }
    return null;
  }

  function reportInvalid(field) {
    if (!field) return;
    clearResult("Correct the highlighted input, then run the scenario again.");
    field.setAttribute("aria-invalid", "true");
    setStatus("Enter a valid value. Required numbers must be present and non-negative unless the field explicitly accepts an anomaly.", true);
  }

  form.addEventListener(
    "invalid",
    function (event) {
      reportInvalid(event.target);
    },
    true
  );

  form.addEventListener(
    "submit",
    function (event) {
      var invalid = invalidField();
      if (invalid) {
        event.preventDefault();
        event.stopImmediatePropagation();
        reportInvalid(invalid);
        invalid.focus();
        return;
      }
      form.querySelectorAll('[aria-invalid="true"]').forEach(function (field) {
        field.removeAttribute("aria-invalid");
      });
      if (results) results.removeAttribute("aria-hidden");
      setStatus("Scenario calculated from the values shown. Verify local sources before acting.", false);
    },
    true
  );

  form.addEventListener("input", function () {
    if (!results || !results.classList.contains("on")) return;
    results.classList.add("is-stale");
    setActionsDisabled(true);
    if (resultSub) resultSub.textContent = "Inputs changed. Run the scenario again before copying, saving, or exporting.";
    setStatus("Result is stale because an input changed.", false);
  });

  form.addEventListener("reset", function () {
    window.setTimeout(function () {
      form.querySelectorAll('[aria-invalid="true"]').forEach(function (field) {
        field.removeAttribute("aria-invalid");
      });
      clearResult("Scenario reset. Review the default values, then run the tool.");
      setStatus("Scenario reset; no result or project data was saved.", false);
    }, 0);
  });

  if (results && !results.classList.contains("on")) results.setAttribute("aria-hidden", "true");
})();

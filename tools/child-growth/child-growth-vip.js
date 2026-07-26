(function () {
  "use strict";

  var engine = window.AfroTools && window.AfroTools.ChildGrowthEngine;
  var lastSnapshot = null;
  var form = null;

  function text(id, value) {
    document.getElementById(id).textContent = String(value);
  }

  function selectedMethod() {
    var checked = document.querySelector('input[name="cgv-method"]:checked');
    return checked ? checked.value : "";
  }

  function input() {
    return {
      birthDate: document.getElementById("cgv-birth").value,
      measurementDate: document.getElementById("cgv-measured").value,
      sex: document.getElementById("cgv-sex").value,
      weight: document.getElementById("cgv-weight").value,
      weightUnit: document.getElementById("cgv-weight-unit").value,
      length: document.getElementById("cgv-length").value,
      lengthUnit: document.getElementById("cgv-length-unit").value,
      method: selectedMethod()
    };
  }

  function card(prefix, result) {
    text(prefix + "-z", (result.zScore > 0 ? "+" : "") + result.zScore.toFixed(2));
    text(prefix + "-pct", "Approx. percentile " + result.percentileLabel);
    text(prefix + "-band", result.referenceBand);
  }

  function recordSnapshot(snapshot) {
    lastSnapshot = snapshot;
    if (!window.AfroHealthWorkflow || typeof window.AfroHealthWorkflow.recordSnapshot !== "function") return;
    window.AfroHealthWorkflow.recordSnapshot({
      toolId: "child-growth",
      headline: snapshot.title,
      resultText: snapshot.note,
      fields: [
        { label: "Age at measurement", value: snapshot.ageDays + " completed days" },
        { label: "WHO sex table", value: snapshot.sexTable },
        { label: "Measurement method", value: snapshot.method },
        { label: "Weight", value: snapshot.measurements.weightKg + " kg" },
        { label: "Length/height", value: snapshot.measurements.lengthCm + " cm" },
        { label: "Length/height-for-age z-score", value: String(snapshot.indicators.lengthHeightForAge.zScore) },
        { label: "Weight-for-age z-score", value: String(snapshot.indicators.weightForAge.zScore) },
        { label: "BMI-for-age z-score", value: String(snapshot.indicators.bmiForAge.zScore) }
      ],
      clinicianQuestions: [
        "Were the weight and length or height measured with calibrated equipment and the correct method?",
        "How does this measurement compare with the child's earlier growth pattern?",
        "Does the clinical assessment or history suggest follow-up beyond this screening reference?"
      ]
    });
  }

  function assess(event) {
    event.preventDefault();
    var status = document.getElementById("cgv-status");
    var resultPanel = document.getElementById("cgv-result");
    status.textContent = "";
    resultPanel.hidden = true;
    try {
      var result = engine.assess(input());
      text("cgv-age", result.ageDays + " completed days (about " + result.ageApproxMonths + " months)");
      text("cgv-standard", result.standard + " · " + result.sexTable + " table · " + (result.method === "recumbent" ? "recumbent length" : "standing height"));
      card("cgv-lhfa", result.indicators.lengthHeightForAge);
      card("cgv-wfa", result.indicators.weightForAge);
      card("cgv-bmifa", result.indicators.bmiForAge);
      resultPanel.hidden = false;
      recordSnapshot(engine.snapshot(result));
      resultPanel.focus();
    } catch (error) {
      status.textContent = error.message;
      lastSnapshot = null;
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!engine) return;
    form = document.getElementById("cgv-form");
    form.addEventListener("submit", assess);
    document.addEventListener("click", function (event) {
      var action = event.target.closest && event.target.closest('[data-health-tool-id="child-growth"][data-health-action]');
      if (!action) return;
      if (!lastSnapshot) {
        event.preventDefault();
        event.stopImmediatePropagation();
        text("cgv-export-status", "Calculate a supported screening reference first.");
        return;
      }
      recordSnapshot(lastSnapshot);
    }, true);
  });
})();

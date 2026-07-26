(function () {
  "use strict";

  var engine = window.AfroTools && window.AfroTools.BloodGroupEngine;
  var lastSnapshot = null;

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function setTab(name, button) {
    document.querySelectorAll(".bgv-tab").forEach(function (tab) {
      var selected = tab === button;
      tab.setAttribute("aria-selected", selected ? "true" : "false");
      tab.tabIndex = selected ? 0 : -1;
    });
    document.querySelectorAll(".bgv-panel").forEach(function (panel) {
      panel.hidden = panel.id !== "bgv-panel-" + name;
    });
  }

  function recordSnapshot(snapshot) {
    lastSnapshot = snapshot;
    if (!window.AfroHealthWorkflow || typeof window.AfroHealthWorkflow.recordSnapshot !== "function") return;
    var fields = [];
    if (snapshot.component) {
      fields = [
        { label: "Component reference", value: snapshot.component },
        { label: "Donor entry", value: snapshot.donor },
        { label: "Recipient entry", value: snapshot.recipient },
        { label: "Educational classification", value: snapshot.classification }
      ];
    } else {
      fields = [
        { label: "Pregnant person entry", value: snapshot.pregnantPerson },
        { label: "Other biological parent entry", value: snapshot.otherBiologicalParent },
        { label: "Educational classification", value: snapshot.classification }
      ];
    }
    window.AfroHealthWorkflow.recordSnapshot({
      toolId: "blood-group",
      headline: snapshot.title,
      resultText: snapshot.note,
      fields: fields,
      clinicianQuestions: [
        "What did my current hospital type and antibody screen show?",
        "Does the selected component need additional matching or crossmatching?",
        "Which local maternity or transfusion guidance applies to me?"
      ]
    });
  }

  function componentCopy(result) {
    if (result.component === "platelets") {
      return '<h3>Laboratory selection required</h3>' +
        "<p>This page does not label this platelet pairing compatible or incompatible. ABO-identical platelets are generally preferred, but hospitals may weigh antibodies, inventory, RhD, age, sex and other clinical requirements.</p>" +
        '<div class="bgv-boundary"><strong>Not a clearance</strong><span>' + escapeHtml(result.boundary) + "</span></div>";
    }
    var title = result.listed ? "Listed in the basic " + (result.component === "plasma" ? "plasma" : "red-cell") + " reference" : "Not listed in the basic " + (result.component === "plasma" ? "plasma" : "red-cell") + " reference";
    var groups = result.compatibleDonorGroups.join(", ");
    var direction = result.component === "plasma"
      ? "For the recipient ABO group entered, the basic plasma donor ABO reference lists: " + groups + ". RhD signs are not used as a simple plasma rule here."
      : "For the recipient entered, the basic red-cell donor reference lists: " + groups + ".";
    return "<h3>" + escapeHtml(title) + "</h3>" +
      "<p><strong>" + escapeHtml(result.donor) + " donor entry → " + escapeHtml(result.recipient) + " recipient entry</strong></p>" +
      "<p>" + escapeHtml(direction) + "</p>" +
      '<div class="bgv-boundary"><strong>Hospital testing still decides</strong><span>' + escapeHtml(result.boundary) + "</span></div>" +
      "<p>Do not use this page to locate a donor or request a particular unit. Contact the treating hospital or licensed blood service.</p>";
  }

  function runComponentReference() {
    try {
      var result = engine.componentReference(
        document.getElementById("bgv-component").value,
        document.getElementById("bgv-donor").value,
        document.getElementById("bgv-recipient").value
      );
      var output = document.getElementById("bgv-component-result");
      output.dataset.kind = result.classification;
      output.innerHTML = componentCopy(result);
      output.hidden = false;
      recordSnapshot(engine.snapshot(result));
      output.focus();
    } catch (error) {
      document.getElementById("bgv-component-status").textContent = error.message;
    }
  }

  function pregnancyCopy(result) {
    var copy;
    if (result.classification === "pregnant-person-rhd-positive") {
      copy = "The pregnant-person entry is RhD positive. This input pattern is not the classic RhD-negative pregnancy pattern, but antenatal blood-group and antibody screening still matters.";
    } else if (result.classification === "baby-may-be-rhd-positive") {
      copy = "The pregnant-person entry is RhD negative and the other biological-parent entry is RhD positive. A baby may be RhD positive, but these parental entries cannot determine the baby's blood group or whether sensitisation has occurred.";
    } else {
      copy = "Both entries are RhD negative. This simple inheritance reference does not replace antenatal blood-group and antibody screening or determine care.";
    }
    return "<h3>Discussion prompt, not a treatment decision</h3><p>" + escapeHtml(copy) + "</p>" +
      '<div class="bgv-boundary"><strong>Ask the maternity team</strong><span>' + escapeHtml(result.boundary) + "</span></div>" +
      "<p>Anti-D eligibility, product, dose and timing depend on clinical history, testing, pregnancy events and current local guidance. This page does not provide those instructions.</p>";
  }

  function runPregnancyReference() {
    try {
      var result = engine.pregnancyRhReference(
        document.getElementById("bgv-pregnant").value,
        document.getElementById("bgv-other-parent").value
      );
      var output = document.getElementById("bgv-pregnancy-result");
      output.dataset.kind = result.classification;
      output.innerHTML = pregnancyCopy(result);
      output.hidden = false;
      recordSnapshot(engine.snapshot(result));
      output.focus();
    } catch (error) {
      document.getElementById("bgv-pregnancy-status").textContent = error.message;
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!engine) return;
    document.querySelectorAll(".bgv-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        setTab(tab.dataset.panel, tab);
      });
      tab.addEventListener("keydown", function (event) {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        var tabs = Array.prototype.slice.call(document.querySelectorAll(".bgv-tab"));
        var offset = event.key === "ArrowRight" ? 1 : -1;
        var next = tabs[(tabs.indexOf(tab) + offset + tabs.length) % tabs.length];
        event.preventDefault();
        next.focus();
        setTab(next.dataset.panel, next);
      });
    });
    document.getElementById("bgv-component-form").addEventListener("submit", function (event) {
      event.preventDefault();
      runComponentReference();
    });
    document.getElementById("bgv-pregnancy-form").addEventListener("submit", function (event) {
      event.preventDefault();
      runPregnancyReference();
    });
    document.addEventListener("click", function (event) {
      var action = event.target.closest && event.target.closest('[data-health-tool-id="blood-group"][data-health-action]');
      if (!action) return;
      if (!lastSnapshot) {
        event.preventDefault();
        event.stopImmediatePropagation();
        document.getElementById("bgv-export-status").textContent = "Create a component or pregnancy reference first.";
        return;
      }
      recordSnapshot(lastSnapshot);
    }, true);
  });
})();

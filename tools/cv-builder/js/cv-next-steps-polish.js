"use strict";
(function (window, document) {
  var observerTimer = null;

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function showToast(message) {
    if (window.CVApp && typeof window.CVApp.showToast === "function") {
      window.CVApp.showToast(message);
    }
  }

  function setMode(mode) {
    var modeButton = qs('[data-cv-layout-mode="' + mode + '"]');
    if (modeButton) {
      modeButton.click();
      return;
    }
    var app = qs(".cv-app");
    if (app) app.dataset.cvMode = mode;
  }

  function scrollToNode(node) {
    if (node) node.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function activate(action) {
    if (action === "pack") {
      if (window.CVApplicationPack && typeof window.CVApplicationPack.render === "function") {
        try { window.CVApplicationPack.render(); } catch (err) {}
      }
      var pack = qs(".cv-application-pack-panel");
      if (pack) {
        pack.classList.remove("collapsed");
        scrollToNode(pack);
        return;
      }
      showToast("Application Pack is loading. Try again in a moment.");
      return;
    }

    if (action === "analyze") {
      if (window.CVApp && typeof window.CVApp.aiAnalyzeCV === "function") {
        window.CVApp.aiAnalyzeCV();
        return;
      }
      setMode("analyze");
      var analyzer = qs('[data-action="ats"], [data-action="analyze"]');
      if (analyzer) analyzer.click();
      return;
    }

    if (action === "advisor") {
      if (window.CVApp && typeof window.CVApp.aiOpenChat === "function") {
        window.CVApp.aiOpenChat();
        return;
      }
      var chat = qs('[data-action="chat"]');
      if (chat) chat.click();
      else showToast("Advisor is loading. You can still use the checklist and export tools.");
      return;
    }

    if (action === "export") {
      if (window.CVBuilderPolish && typeof window.CVBuilderPolish.openExportPanel === "function") {
        window.CVBuilderPolish.openExportPanel({ currentTarget: qs('[data-next-step-action="export"]') });
        return;
      }
      setMode("export");
      return;
    }

    if (action === "tracker") {
      if (window.CVJobTracker && typeof window.CVJobTracker.render === "function") {
        try { window.CVJobTracker.render(); } catch (err) {}
      }
      var tracker = qs(".cv-job-tracker-panel");
      if (tracker) scrollToNode(tracker);
      else showToast("Job tracker is loading. Try again in a moment.");
    }
  }

  function card(index, title, copy, action) {
    return [
      '<button type="button" class="cv-next-step-card" data-next-step-action="' + action + '">',
      '  <span class="cv-next-step-index">' + index + "</span>",
      "  <span><strong>" + title + "</strong><span>" + copy + "</span></span>",
      '  <span class="cv-next-step-arrow" aria-hidden="true">&gt;</span>',
      "</button>"
    ].join("");
  }

  function render() {
    Array.prototype.slice.call(document.querySelectorAll(".cv-sponsored-zone")).forEach(function (zone) {
      zone.remove();
    });

    var app = qs(".cv-app");
    if (!app || !app.parentNode) return;

    var panel = qs(".cv-helper-next-steps");
    if (!panel) {
      panel = document.createElement("section");
      panel.className = "cv-helper-next-steps";
      app.parentNode.insertBefore(panel, app.nextSibling);
    }

    panel.classList.add("cv-next-steps-panel");
    panel.setAttribute("aria-labelledby", "cvNextStepsTitle");

    if (panel.dataset.nextStepsPolished === "true") return;
    panel.dataset.nextStepsPolished = "true";
    panel.innerHTML = [
      '<div class="cv-next-steps-shell">',
      '  <div class="cv-next-steps-main">',
      '    <div class="cv-next-steps-head">',
      '      <div class="cv-next-steps-copy">',
      '        <span class="cv-next-steps-eyebrow">After your CV is ready</span>',
      '        <h2 id="cvNextStepsTitle">Turn this CV into real applications</h2>',
      '        <p>Tailor the CV, check job fit, export clean files, and track applications. No paid partner placement is shown here while sponsorships are inactive.</p>',
      "      </div>",
      '      <div class="cv-next-steps-actions">',
      '        <button type="button" class="primary" data-next-step-action="pack">Open Application Pack</button>',
      '        <button type="button" data-next-step-action="export">Export options</button>',
      "      </div>",
      "    </div>",
      '    <div class="cv-next-steps-grid">',
      card("01", "Application Pack", "Cover letter, email, LinkedIn, recruiter message, and follow-ups.", "pack"),
      card("02", "Job match", "Paste a role, compare the CV, and improve weak sections without keyword stuffing.", "analyze"),
      card("03", "Export files", "Download PDF, ATS Plain PDF, text, or JSON backup when the CV is ready.", "export"),
      card("04", "Job tracker", "Save deadlines, status, CV version, and follow-up dates in this browser.", "tracker"),
      card("05", "AI Advisor", "Ask for a checklist, role-fit gaps, or a cleaner summary after reviewing the preview.", "advisor"),
      "    </div>",
      '    <div class="cv-flagship-proof" aria-label="CV Builder trust notes">',
      '      <span><b>Browser proof:</b> local draft, preview, export, and tracker workflows stay available without account sign-up.</span>',
      '      <span><b>Mobile proof:</b> cards use tap-sized controls and horizontal scroll under 680px instead of cramping the editor.</span>',
      '      <span><b>Claim cleanup:</b> ATS score is a readiness checklist, not an interview or employer-ranking guarantee.</span>',
      "    </div>",
      '    <div class="cv-next-steps-footnote">',
      "      <span><b>Privacy:</b> CV data stays in this browser unless you choose to save or sign in.</span>",
      "      <span><b>No sponsors:</b> this area only links to built-in AfroTools actions.</span>",
      "    </div>",
      "  </div>",
      "</div>"
    ].join("");

    panel.addEventListener("click", function (event) {
      var target = event.target.closest("[data-next-step-action]");
      if (!target) return;
      event.preventDefault();
      activate(target.dataset.nextStepAction);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render);
  else render();

  try {
    new MutationObserver(function () {
      clearTimeout(observerTimer);
      observerTimer = setTimeout(render, 80);
    }).observe(document.body, { childList: true, subtree: true });
  } catch (err) {}

  window.CVNextStepsPolish = { render: render, activate: activate };
})(window, document);

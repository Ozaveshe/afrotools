"use strict";
(function (window, document) {
  var COVER_LETTER_KEY = "afrotools-cover-letter-current-v2";
  var HANDOFF_KEY = "afro_cv_handoff_v1";
  var READY_SCORE = 70;
  var routeChecks = [
    { id: "cover", label: "Create matching cover letter", href: "/tools/cover-letter-generator/app.html", target: "cover-letter" },
    { id: "offer", label: "Evaluate job offer", href: "/tools/job-offer-evaluator/", target: "job-offer" },
    { id: "salary", label: "Estimate salary/tax", href: "/salary-tax/", target: "salary-tax" },
    { id: "scholarship", label: "Find scholarships", href: "/tools/scholarship-finder/", target: "scholarship" }
  ];

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function esc(value) {
    if (window.CVApp && typeof window.CVApp.esc === "function") return window.CVApp.esc(value || "");
    var div = document.createElement("div");
    div.textContent = value || "";
    return div.innerHTML;
  }

  function toast(message) {
    if (window.CVApp && typeof window.CVApp.showToast === "function") window.CVApp.showToast(message);
    var status = qs("[data-cv-handoff-status]");
    if (status) status.textContent = message;
  }

  function state() {
    return window.CVApp && typeof window.CVApp.getState === "function" ? window.CVApp.getState() : null;
  }

  function text(value) {
    return String(value || "").trim();
  }

  function compact(value) {
    return text(value).replace(/\s+/g, " ");
  }

  function joinParts(parts) {
    return parts.map(compact).filter(Boolean).join("\n");
  }

  function countryName(code) {
    if (code === "INTL") return "Remote or global role";
    var option = qs('.cv-country-sel option[value="' + code + '"]');
    if (option && option.textContent) return option.textContent.replace(/^[^\s]+\s+/, "").trim();
    return code || "Pan-African";
  }

  function firstAchievement(data) {
    var exps = Array.isArray(data.exps) ? data.exps : [];
    for (var i = 0; i < exps.length; i += 1) {
      var desc = text(exps[i] && exps[i].d);
      if (!desc) continue;
      var lines = desc.split(/\n+/).map(function (line) {
        return line.replace(/^[\s\-\*\u2022]+/, "").trim();
      }).filter(Boolean);
      if (lines.length) return lines[0];
    }
    var projects = Array.isArray(data.projs) ? data.projs : [];
    for (var j = 0; j < projects.length; j += 1) {
      if (text(projects[j] && projects[j].d)) return text(projects[j].d);
    }
    return "";
  }

  function estimateYears(data) {
    var years = [];
    (Array.isArray(data.exps) ? data.exps : []).forEach(function (exp) {
      ["s", "e"].forEach(function (key) {
        var value = text(exp && exp[key]).match(/\d{4}/);
        if (value) years.push(Number(value[0]));
      });
    });
    if (years.length < 2) return "";
    var min = Math.min.apply(Math, years);
    var max = Math.max.apply(Math, years.concat([new Date().getFullYear()]));
    var diff = Math.max(0, Math.min(60, max - min));
    return diff ? String(diff) : "";
  }

  function handoffPayload() {
    var current = state();
    var data = current && current.data ? current.data : {};
    var fullName = compact([data.fn, data.ln].filter(Boolean).join(" "));
    var skills = [
      data.skills && data.skills.h,
      data.skills && data.skills.s,
      data.skills && data.skills.t
    ].map(compact).filter(Boolean).join(", ");
    var resumeSummary = joinParts([
      data.summary,
      firstAchievement(data)
    ]);
    return {
      templateId: "professional",
      toneId: "professional",
      market: countryName(current && current.country),
      lengthId: "standard",
      fullName: fullName,
      email: text(data.email),
      phone: compact([data.phoneCode, data.phone].filter(Boolean).join(" ")),
      city: text(data.loc),
      portfolio: text(data.linkedin || data.li || data.web),
      jobTitle: text(data.title),
      company: "",
      hiringManager: "",
      source: "",
      jobDescription: "",
      years: estimateYears(data),
      skills: skills,
      achievement: firstAchievement(data),
      whyCompany: "",
      resumeSummary: resumeSummary,
      availability: "",
      referral: "",
      contextNote: "",
      letterText: "",
      selectedId: null,
      updatedAt: Date.now(),
      _handoff: {
        schema: "afrotools.cv-handoff.v1",
        source: "cv-builder",
        privacy: "local-only",
        note: "Imported from CV Builder in this browser. No raw CV text was added to the URL."
      }
    };
  }

  function score() {
    var current = state();
    if (!current || !current.data) return 0;
    if (window.CVApp && typeof window.CVApp.calcScore === "function") return window.CVApp.calcScore(current.data);
    return 0;
  }

  function ready() {
    var current = state();
    var data = current && current.data ? current.data : {};
    return !!(score() >= READY_SCORE && text(data.fn || data.ln) && (text(data.email) || text(data.phone)) && text(data.summary));
  }

  function ensurePanel() {
    var app = qs(".cv-app");
    if (!app || qs("[data-cv-handoff-panel]")) return;
    var panel = document.createElement("section");
    panel.className = "cv-handoff-panel";
    panel.setAttribute("data-cv-handoff-panel", "");
    panel.setAttribute("aria-labelledby", "cvHandoffTitle");
    panel.innerHTML = [
      '<div class="cv-handoff-copy">',
      '<span class="cv-handoff-kicker">Private next step</span>',
      '<h2 id="cvHandoffTitle">Continue from this CV without pasting private data into a URL</h2>',
      '<p data-cv-handoff-ready-copy>Complete the core CV sections to unlock a local handoff packet. The packet stays in this browser unless you copy or download it.</p>',
      '<p class="cv-handoff-note">Local-only handoff: raw CV text is never placed in route links, search parameters, analytics payloads, or console output.</p>',
      '</div>',
      '<div class="cv-handoff-actions" aria-label="CV handoff actions">',
      routeChecks.map(function (route) {
        return '<a class="cv-handoff-cta" data-cv-handoff-link="' + esc(route.id) + '" data-handoff-target="' + esc(route.target) + '" href="' + esc(route.href) + '">' + esc(route.label) + '</a>';
      }).join(""),
      '</div>',
      '<div class="cv-handoff-tools" aria-label="Local handoff tools">',
      '<button type="button" data-cv-handoff-copy>Copy local JSON</button>',
      '<button type="button" data-cv-handoff-download>Download JSON</button>',
      '<span data-cv-handoff-status aria-live="polite">No CV data has been exported.</span>',
      '</div>'
    ].join("");
    app.parentNode.insertBefore(panel, app.nextSibling);
    panel.addEventListener("click", onPanelClick);
    updatePanel();
  }

  function updatePanel() {
    var panel = qs("[data-cv-handoff-panel]");
    if (!panel) return;
    var isReady = !!ready();
    var currentScore = score();
    panel.dataset.ready = isReady ? "true" : "false";
    var copy = qs("[data-cv-handoff-ready-copy]", panel);
    if (copy) {
      copy.textContent = isReady
        ? "Your CV is ready enough to create a local handoff packet for related tools. Use the route buttons, copy JSON, or download a JSON file for manual import."
        : "Complete the core CV sections to activate handoff. Current readiness score: " + currentScore + "%. Route links stay clean and local handoff stays disabled until the CV is ready.";
    }
    qsa("[data-cv-handoff-link], [data-cv-handoff-copy], [data-cv-handoff-download]", panel).forEach(function (node) {
      if (isReady) {
        node.removeAttribute("aria-disabled");
        if ("disabled" in node) node.disabled = false;
      } else {
        node.setAttribute("aria-disabled", "true");
        if ("disabled" in node) node.disabled = true;
      }
    });
  }

  function writeLocalHandoff(target) {
    var payload = handoffPayload();
    try {
      window.localStorage.setItem(HANDOFF_KEY, JSON.stringify({ target: target || "manual", payload: payload, updatedAt: Date.now() }));
      if (target === "cover-letter") window.localStorage.setItem(COVER_LETTER_KEY, JSON.stringify(payload));
    } catch (err) {
      toast("Local handoff storage is unavailable in this browser.");
      return null;
    }
    return payload;
  }

  function downloadJson(payload) {
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "afrotools-cv-local-handoff.json";
    anchor.dataset.noPdfGate = "true";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
  }

  function copyJson(payload) {
    var json = JSON.stringify(payload, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(json).then(function () {
        toast("Local JSON copied. Paste it into an import field or keep it as your own backup.");
      }).catch(function () {
        fallbackCopy(json);
      });
    }
    fallbackCopy(json);
    return Promise.resolve();
  }

  function fallbackCopy(value) {
    var textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "readonly");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      toast("Local JSON copied. Paste it into an import field or keep it as your own backup.");
    } catch (err) {
      toast("Copy failed. Download JSON instead.");
    }
    textarea.remove();
  }

  function onPanelClick(event) {
    var action = event.target.closest("[data-cv-handoff-link], [data-cv-handoff-copy], [data-cv-handoff-download]");
    if (!action) return;
    if (!ready()) {
      event.preventDefault();
      toast("Complete the core CV sections before handoff.");
      updatePanel();
      return;
    }
    var link = action.closest("[data-cv-handoff-link]");
    if (link) {
      writeLocalHandoff(link.dataset.handoffTarget);
      toast(link.dataset.handoffTarget === "cover-letter"
        ? "Cover letter handoff saved locally. Opening the tool without CV data in the URL."
        : "Local handoff saved in this browser. Opening the related tool with a clean link.");
      return;
    }
    event.preventDefault();
    var payload = writeLocalHandoff("manual");
    if (!payload) return;
    if (action.matches("[data-cv-handoff-download]")) {
      downloadJson(payload);
      toast("Local JSON downloaded.");
    } else {
      copyJson(payload);
    }
  }

  function init() {
    ensurePanel();
    document.addEventListener("input", scheduleUpdate, true);
    document.addEventListener("change", scheduleUpdate, true);
    document.addEventListener("click", scheduleUpdate, true);
    if (window.MutationObserver) {
      var form = qs(".cv-form-inner");
      if (form) new MutationObserver(scheduleUpdate).observe(form, { childList: true, subtree: true });
    }
    window.setTimeout(updatePanel, 400);
    window.setTimeout(updatePanel, 1200);
  }

  function scheduleUpdate() {
    window.clearTimeout(scheduleUpdate.timer);
    scheduleUpdate.timer = window.setTimeout(updatePanel, 120);
  }

  window.CVPrivacyHandoff = {
    buildPayload: handoffPayload,
    isReady: ready,
    prepare: writeLocalHandoff,
    update: updatePanel,
    routes: routeChecks.slice()
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(window, document);

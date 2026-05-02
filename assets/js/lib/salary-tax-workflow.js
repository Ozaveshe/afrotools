!function (window, document) {
  "use strict";

  var REPORT_KEY = "afro_salary_reports_v1";
  var HANDOFF_KEY = "afro_salary_handoff_briefs_v1";
  var PLAN_KEY = "afro_salary_workflow_plan_v1";
  var GATE_SRC = "/assets/js/lib/pdf-download-gate.js?v=20260502";

  var countries = [
    { code: "NG", name: "Nigeria", paye: "/nigeria/ng-salary-tax", payrollReady: true, currency: "NGN" },
    { code: "KE", name: "Kenya", paye: "/kenya/ke-paye", payrollReady: true, currency: "KES" },
    { code: "GH", name: "Ghana", paye: "/ghana/gh-paye", payrollReady: true, currency: "GHS" },
    { code: "ZA", name: "South Africa", paye: "/south-africa/za-paye", payrollReady: true, currency: "ZAR" },
    { code: "TZ", name: "Tanzania", paye: "/tanzania/tz-paye", payrollReady: true, currency: "TZS" },
    { code: "UG", name: "Uganda", paye: "/uganda/ug-paye", payrollReady: true, currency: "UGX" },
    { code: "RW", name: "Rwanda", paye: "/rwanda/rw-paye", currency: "RWF" },
    { code: "SN", name: "Senegal", paye: "/senegal/sn-paye", francophone: "/fr/senegal/calculateur-salaire-net", currency: "XOF" },
    { code: "CI", name: "Cote d'Ivoire", paye: "/cote-divoire/ci-paye", francophone: "/fr/cote-divoire/calculateur-salaire-net", currency: "XOF" },
    { code: "CM", name: "Cameroon", paye: "/cameroon/cm-paye", francophone: "/fr/cameroun/calculateur-salaire-net", currency: "XAF" },
    { code: "MA", name: "Morocco", paye: "/morocco/ma-paye", francophone: "/fr/maroc/calculateur-salaire-net", currency: "MAD" }
  ];

  var intents = {
    employee: {
      label: "Employee take-home",
      summary: "Net pay, tax deduction, and personal report trail.",
      pathLabel: "Start with PAYE",
      extra: [
        { title: "Save one scenario", desc: "Name the take-home result so it can reopen from the dashboard.", href: "/dashboard/" },
        { title: "Download report", desc: "Generated reports are gated and saved as report metadata.", href: "/salary-tax/paye/" }
      ]
    },
    employer: {
      label: "Employer payroll draft",
      summary: "Salary check, staff-cost review, payslip, and payroll workspace handoff.",
      pathLabel: "Start payroll route",
      extra: [
        { title: "Estimate staff cost", desc: "Review employer cost before turning the salary check into a run draft.", href: "/tools/staff-cost/" },
        { title: "Open payroll workspace", desc: "Continue with a local-only payroll run draft and export packet.", href: "/tools/afropayroll-os/workspace.html" }
      ]
    },
    advisor: {
      label: "Client advisory",
      summary: "Client report, source note, and reusable handoff brief.",
      pathLabel: "Build client report",
      extra: [
        { title: "Create report trail", desc: "Use a named PDF report for client context and follow-up.", href: "/salary-tax/paye/" },
        { title: "Prepare handoff brief", desc: "Keep metadata only, then hand the client work to dashboard or payroll.", href: "/dashboard/" }
      ]
    },
    business: {
      label: "Business tax route",
      summary: "PAYE check plus business, withholding, and import-tax tools.",
      pathLabel: "Start business tax route",
      extra: [
        { title: "Business tax hub", desc: "Move from payroll deductions into corporate, WHT, CGT, and import-tax planning.", href: "/salary-tax/business-tax/" },
        { title: "Payroll workspace", desc: "Keep payroll drafts separate from filing decisions and compliance claims.", href: "/tools/afropayroll-os/workspace.html" }
      ]
    }
  };

  function readJson(key, fallback) {
    try {
      var raw = window.localStorage && window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      if (window.localStorage) window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      return false;
    }
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function normalizeList(value) {
    return Array.isArray(value) ? value.filter(Boolean) : [];
  }

  function getReports() {
    return normalizeList(readJson(REPORT_KEY, [])).sort(function (a, b) {
      return new Date(b.savedAt || b.generatedAt || b.createdAt || 0).getTime() - new Date(a.savedAt || a.generatedAt || a.createdAt || 0).getTime();
    });
  }

  function getHandoffs() {
    return normalizeList(readJson(HANDOFF_KEY, [])).sort(function (a, b) {
      return new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime();
    });
  }

  function getCountry(code) {
    return countries.find(function (country) { return country.code === code; }) || countries[0];
  }

  function getIntent(key) {
    return intents[key] || intents.employee;
  }

  function isSignedIn() {
    try {
      if (window.AfroWorkspace && typeof window.AfroWorkspace.isSignedIn === "function" && window.AfroWorkspace.isSignedIn()) return true;
    } catch (err) {}
    try {
      if (window.AfroAuth && typeof window.AfroAuth.isLoggedIn === "function" && window.AfroAuth.isLoggedIn()) return true;
    } catch (err) {}
    try {
      if (window.AfroAuth && typeof window.AfroAuth.getUser === "function") {
        var user = window.AfroAuth.getUser();
        if (user && (user.id || user.email)) return true;
      }
    } catch (err) {}
    return false;
  }

  function safeHref(href) {
    var value = String(href || "/salary-tax/").trim();
    if (value.charAt(0) !== "/") return "/salary-tax/";
    return value.replace(/"/g, "%22");
  }

  function timeAgo(value) {
    var time = new Date(value || Date.now()).getTime();
    if (!Number.isFinite(time)) return "recently";
    var minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
    if (minutes < 1) return "just now";
    if (minutes < 60) return minutes + "m ago";
    var hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + "h ago";
    var days = Math.floor(hours / 24);
    return days === 1 ? "yesterday" : days + "d ago";
  }

  function loadGate() {
    if (window.AfroPdfDownloadGate && typeof window.AfroPdfDownloadGate.guardPromise === "function") {
      return Promise.resolve(window.AfroPdfDownloadGate);
    }
    return new Promise(function (resolve) {
      var existing = document.querySelector('script[src^="' + GATE_SRC.split("?")[0] + '"]');
      if (existing) {
        existing.addEventListener("load", function () { resolve(window.AfroPdfDownloadGate || null); }, { once: true });
        existing.addEventListener("error", function () { resolve(null); }, { once: true });
        return;
      }
      var script = document.createElement("script");
      script.src = GATE_SRC;
      script.defer = true;
      script.onload = function () { resolve(window.AfroPdfDownloadGate || null); };
      script.onerror = function () { resolve(null); };
      document.head.appendChild(script);
    });
  }

  function recommend(plan) {
    var country = getCountry(plan && plan.countryCode || "NG");
    var intent = getIntent(plan && plan.intent || "employee");
    var primaryHref = intent === intents.employee && country.francophone ? country.francophone : country.paye;
    var steps = [
      {
        tag: "01",
        title: country.name + " PAYE calculator",
        desc: "Run the country salary calculation first so the route starts with a concrete result.",
        href: primaryHref
      }
    ].concat(intent.extra);

    if (country.payrollReady && intent !== intents.employee) {
      steps.push({
        tag: "04",
        title: "Payroll run draft",
        desc: "Use the loaded PAYE engines where available and keep draft state local to the browser.",
        href: "/tools/afropayroll-os/workspace.html"
      });
    }

    return {
      country: country,
      intent: intent,
      primaryHref: primaryHref,
      steps: steps.slice(0, 4),
      confidence: country.payrollReady ? "Report + payroll-ready" : "Report-ready"
    };
  }

  function buildPlanFromForm(root) {
    return {
      countryCode: (root.querySelector("[data-salary-plan-country]") || {}).value || "NG",
      intent: (root.querySelector("[data-salary-plan-intent]") || {}).value || "employee",
      updatedAt: new Date().toISOString()
    };
  }

  function getStoredPlan() {
    return Object.assign({ countryCode: "NG", intent: "employee" }, readJson(PLAN_KEY, {}) || {});
  }

  function getLatestReportFor(countryCode) {
    var reports = getReports();
    return reports.find(function (report) { return report && report.countryCode === countryCode; }) || reports[0] || null;
  }

  function makeSummary(rec, report) {
    var parts = [rec.country.name, rec.intent.label];
    if (report && report.title) parts.push("based on " + report.title);
    return parts.join(" | ");
  }

  function createHandoffBrief(plan) {
    var rec = recommend(plan || getStoredPlan());
    var report = getLatestReportFor(rec.country.code);
    var now = new Date().toISOString();
    var id = "salary-handoff-" + Date.now().toString(36);
    var brief = {
      id: id,
      itemType: "salary-handoff",
      toolSlug: "salary-tax-workflow",
      title: rec.country.name + " " + rec.intent.label + " handoff",
      summary: makeSummary(rec, report),
      countryCode: rec.country.code,
      countryName: rec.country.name,
      currency: rec.country.currency || "",
      intent: plan && plan.intent || "employee",
      intentLabel: rec.intent.label,
      href: "/tools/afropayroll-os/workspace.html?source=salary-tax&handoff=" + encodeURIComponent(id),
      primaryHref: rec.primaryHref,
      sourceReportId: report && report.id || "",
      sourceReportTitle: report && report.title || "",
      sourceReportRef: report && report.ref || "",
      steps: rec.steps.map(function (step) {
        return { title: step.title, href: step.href, desc: step.desc };
      }),
      createdAt: now,
      updatedAt: now,
      localOnly: !isSignedIn()
    };
    var handoffs = getHandoffs().filter(function (item) { return item && item.id !== id; });
    handoffs.unshift(brief);
    writeJson(HANDOFF_KEY, handoffs.slice(0, 30));
    syncHandoff(brief);
    try {
      window.dispatchEvent(new CustomEvent("afro-salary-handoff-change", { detail: { action: "save", item: brief, count: handoffs.length } }));
    } catch (err) {}
    return brief;
  }

  async function syncHandoff(brief) {
    if (!isSignedIn() || !window.AfroWorkspace || typeof window.AfroWorkspace.upsert !== "function") return false;
    try {
      await window.AfroWorkspace.upsert({
        itemType: "salary-handoff",
        itemKey: brief.id,
        toolSlug: brief.toolSlug,
        title: brief.title,
        summary: brief.summary,
        href: brief.href,
        payload: {
          version: 1,
          primaryHref: brief.primaryHref,
          sourceReportId: brief.sourceReportId,
          sourceReportTitle: brief.sourceReportTitle,
          sourceReportRef: brief.sourceReportRef,
          steps: brief.steps
        },
        meta: {
          category: "salary-tax",
          country: brief.countryCode,
          currency: brief.currency,
          intent: brief.intent
        }
      });
      brief.localOnly = false;
      return true;
    } catch (err) {
      console.warn("[SalaryTaxWorkflow] Handoff sync failed:", err && err.message || err);
      return false;
    }
  }

  function downloadBrief(brief) {
    if (!brief) return Promise.resolve(false);
    return loadGate().then(function (gate) {
      var options = {
        source: "salary-handoff-brief",
        toolSlug: "salary-tax-workflow",
        toolName: "Salary & PAYE workflow",
        reportName: brief.title,
        countryCode: brief.countryCode,
        category: "salary-tax"
      };
      var gatePromise = gate && typeof gate.guardPromise === "function" ? gate.guardPromise(options) : Promise.resolve({ context: options });
      return gatePromise.then(function (result) {
        if (!result) return false;
        var payload = JSON.stringify({
          version: 1,
          exportedAt: new Date().toISOString(),
          privacy: "Metadata only. Generated PDF files and raw salary inputs are not included.",
          brief: brief
        }, null, 2);
        var blob = new Blob([payload], { type: "application/json" });
        var href = URL.createObjectURL(blob);
        var anchor = document.createElement("a");
        anchor.href = href;
        anchor.download = brief.id + ".json";
        document.body.appendChild(anchor);
        anchor.click();
        window.setTimeout(function () {
          URL.revokeObjectURL(href);
          anchor.remove();
        }, 1000);
        return true;
      });
    });
  }

  function renderRoute(rec) {
    return '<div class="salary-flow-route">' + rec.steps.map(function (step, index) {
      return '<article class="salary-flow-route-card">' +
        '<span class="salary-flow-step">' + esc(step.tag || String(index + 1).padStart(2, "0")) + '</span>' +
        '<div><h4>' + esc(step.title) + '</h4><p>' + esc(step.desc) + '</p><a href="' + esc(safeHref(step.href)) + '">Open route</a></div>' +
      '</article>';
    }).join("") + '</div>';
  }

  function renderWorkspace(root, rec) {
    var reports = getReports();
    var handoffs = getHandoffs();
    var latestReport = getLatestReportFor(rec.country.code);
    var latestHandoff = handoffs[0] || null;
    var reportHtml = latestReport ?
      '<div class="salary-flow-latest"><strong>' + esc(latestReport.title || "Salary report") + '</strong>' +
      esc(latestReport.summary || "Generated report") + '<br><span>' + esc([latestReport.countryCode || latestReport.country || "Salary", latestReport.ref || "", timeAgo(latestReport.savedAt || latestReport.generatedAt)].filter(Boolean).join(" | ")) + '</span></div>' :
      '<div class="salary-flow-latest"><strong>No report trail yet</strong>Reports appear here after a gated PDF download from an upgraded PAYE calculator.</div>';

    var handoffLine = latestHandoff ?
      '<div class="salary-flow-latest"><strong>' + esc(latestHandoff.title) + '</strong>' + esc(latestHandoff.summary || "Saved handoff") + '<br><span>' + esc(timeAgo(latestHandoff.updatedAt || latestHandoff.createdAt)) + '</span></div>' :
      '<p class="salary-flow-note">Create a handoff brief when a calculator result is ready to move into payroll or client follow-up.</p>';

    root.innerHTML = '<div class="salary-flow-meter">' +
      '<div class="salary-flow-metric"><strong>' + reports.length + '</strong><span>Reports</span></div>' +
      '<div class="salary-flow-metric"><strong>' + handoffs.length + '</strong><span>Handoffs</span></div>' +
      '<div class="salary-flow-metric"><strong>' + (isSignedIn() ? "Sync" : "Local") + '</strong><span>Mode</span></div>' +
      '</div>' + reportHtml + handoffLine +
      '<div class="salary-flow-actions">' +
      '<button class="salary-flow-btn primary" type="button" data-salary-action="create-handoff">Create handoff brief</button>' +
      '<button class="salary-flow-btn" type="button" data-salary-action="download-brief" ' + (latestHandoff ? "" : "disabled") + '>Download brief</button>' +
      '<a class="salary-flow-btn" href="/dashboard/">Open dashboard</a>' +
      '</div><div class="salary-flow-toast" data-salary-toast aria-live="polite"></div>';
  }

  function draw(root) {
    var plan = getStoredPlan();
    var rec = recommend(plan);
    root.innerHTML = '<div class="salary-flow-head">' +
      '<div><div class="sec-ey">Workflow Intelligence</div><h2>Plan the next Salary &amp; PAYE move</h2><p>Pick a country and job. AfroTools will route the user from calculator to saved report, dashboard trail, and payroll handoff without uploading raw salary data.</p></div>' +
      '<div class="salary-flow-status"><strong>' + (isSignedIn() ? "Signed in workspace" : "Guest workspace") + '</strong>' + (isSignedIn() ? "Reports and handoff metadata can sync to the dashboard." : "Reports and handoffs stay on this device until account sign-in.") + '</div>' +
      '</div><div class="salary-flow-grid">' +
      '<section class="salary-flow-panel"><h3>Planner</h3><div class="salary-flow-field"><label for="salaryFlowCountry">Country</label><select id="salaryFlowCountry" data-salary-plan-country>' +
      countries.map(function (country) { return '<option value="' + esc(country.code) + '"' + (country.code === rec.country.code ? " selected" : "") + '>' + esc(country.name) + '</option>'; }).join("") +
      '</select></div><div class="salary-flow-field"><label for="salaryFlowIntent">Work type</label><select id="salaryFlowIntent" data-salary-plan-intent>' +
      Object.keys(intents).map(function (key) { return '<option value="' + esc(key) + '"' + (key === (plan.intent || "employee") ? " selected" : "") + '>' + esc(intents[key].label) + '</option>'; }).join("") +
      '</select></div><p class="salary-flow-note">' + esc(rec.intent.summary) + '</p><div class="salary-flow-actions"><a class="salary-flow-btn primary" href="' + esc(safeHref(rec.primaryHref)) + '">' + esc(rec.intent.pathLabel) + '</a><button class="salary-flow-btn" type="button" data-salary-action="save-plan">Save planner</button></div></section>' +
      '<section class="salary-flow-panel"><h3>Recommended route</h3>' + renderRoute(rec) + '</section>' +
      '<section class="salary-flow-panel"><h3>Report and handoff trail</h3><div data-salary-workspace></div></section>' +
      '</div>';
    renderWorkspace(root.querySelector("[data-salary-workspace]"), rec);
    bind(root);
  }

  function bind(root) {
    root.querySelectorAll("[data-salary-plan-country],[data-salary-plan-intent]").forEach(function (input) {
      input.addEventListener("change", function () {
        writeJson(PLAN_KEY, buildPlanFromForm(root));
        draw(root);
      });
    });
    var save = root.querySelector('[data-salary-action="save-plan"]');
    if (save) {
      save.addEventListener("click", function () {
        writeJson(PLAN_KEY, buildPlanFromForm(root));
        var toast = root.querySelector("[data-salary-toast]");
        if (toast) toast.textContent = "Planner saved on this device.";
      });
    }
    var create = root.querySelector('[data-salary-action="create-handoff"]');
    if (create) {
      create.addEventListener("click", function () {
        var brief = createHandoffBrief(buildPlanFromForm(root));
        draw(root);
        var toast = root.querySelector("[data-salary-toast]");
        if (toast) toast.textContent = brief.localOnly ? "Handoff brief saved locally." : "Handoff brief saved and sync requested.";
      });
    }
    var download = root.querySelector('[data-salary-action="download-brief"]');
    if (download) {
      download.addEventListener("click", function () {
        var latest = getHandoffs()[0] || createHandoffBrief(buildPlanFromForm(root));
        downloadBrief(latest).then(function (ok) {
          var toast = root.querySelector("[data-salary-toast]");
          if (toast) toast.textContent = ok ? "Handoff brief downloaded." : "Download canceled.";
        });
      });
    }
  }

  function init() {
    var root = document.querySelector("[data-salary-workflow-app]");
    if (!root) return;
    draw(root);
    window.addEventListener("afro-salary-report-change", function () { draw(root); });
    window.addEventListener("afro-salary-handoff-change", function () { draw(root); });
    window.addEventListener("afro-auth-change", function () { draw(root); });
    window.addEventListener("afro-workspace-change", function () { draw(root); });
    window.addEventListener("focus", function () { draw(root); });
    window.addEventListener("storage", function (event) {
      if ([REPORT_KEY, HANDOFF_KEY, PLAN_KEY].indexOf(event.key) !== -1) draw(root);
    });
  }

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.salaryTaxWorkflow = {
    storageKeys: { reports: REPORT_KEY, handoffs: HANDOFF_KEY, planner: PLAN_KEY },
    recommend: recommend,
    getReports: getReports,
    getHandoffs: getHandoffs,
    createHandoffBrief: createHandoffBrief,
    downloadBrief: downloadBrief
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
}(window, document);

!function(window, document) {
  "use strict";

  var REPORTS_KEY = "afro_vat_business_tax_reports_v1";
  var FILING_PACKS_KEY = "afro_vat_business_tax_filing_packs_v1";
  var PLAN_KEY = "afro_vat_business_tax_plan_v1";
  var READINESS_KEY = "afro_vat_business_tax_readiness_v1";
  var AUDIT_PACKETS_KEY = "afro_vat_business_tax_audit_packets_v1";
  var GATE_SRC = "/assets/js/lib/pdf-download-gate.js?v=20260502";
  var WORKSPACE_SRC = "/assets/js/lib/workspace-sync.js?v=20260417a";

  var workflows = {
    pricing: {
      label: "Pricing and margin check",
      summary: "Quote tax-inclusive prices without losing margin after VAT, markup, and break-even pressure.",
      pathLabel: "Start VAT quote",
      primaryHref: "/tools/vat-calculator/",
      steps: [
        { tag: "01", title: "Pick VAT country and treatment", desc: "Add or extract VAT, confirm zero-rated or exempt treatment, and save the report trail.", href: "/tools/vat-calculator/" },
        { tag: "02", title: "Protect gross margin", desc: "Check the after-tax selling price against cost and target margin.", href: "/tools/profit-margin/" },
        { tag: "03", title: "Set markup guardrails", desc: "Translate margin needs into pricing markup before sending quotes.", href: "/tools/markup-calc/" },
        { tag: "04", title: "Check break-even volume", desc: "Verify the units or revenue needed after VAT-inclusive pricing.", href: "/tools/break-even/" }
      ]
    },
    invoice: {
      label: "VAT invoice pack",
      summary: "Build a tax-ready invoice route with line treatment, receipt evidence, and dashboard continuation.",
      pathLabel: "Open invoice builder",
      primaryHref: "/tools/vat-calculator/",
      steps: [
        { tag: "01", title: "Build VAT invoice totals", desc: "Use multi-item invoice mode for standard, zero-rated, and exempt lines.", href: "/tools/vat-calculator/" },
        { tag: "02", title: "Create customer invoice", desc: "Move approved totals into a reusable invoice document.", href: "/tools/invoice-generator/" },
        { tag: "03", title: "Capture payment receipt", desc: "Create customer-facing receipt evidence after payment.", href: "/tools/receipt-generator/" },
        { tag: "04", title: "Continue in dashboard", desc: "Keep metadata in My Workspace for later filing review.", href: "/dashboard/" }
      ]
    },
    withholding: {
      label: "Withholding and remittance",
      summary: "Split supplier VAT from buyer withholding scenarios and route country-specific WHT checks.",
      pathLabel: "Start withholding",
      primaryHref: "/tools/vat-calculator/",
      steps: [
        { tag: "01", title: "Model VAT withholding", desc: "Calculate buyer-withheld VAT and supplier remittance balance.", href: "/tools/vat-calculator/" },
        { tag: "02", title: "Nigeria WHT check", desc: "If Nigeria applies, match the withholding rate and certificate need.", href: "/tools/ng-wht/" },
        { tag: "03", title: "Kenya WHT check", desc: "If Kenya applies, confirm withholding category and iTax evidence.", href: "/tools/ke-wht/" },
        { tag: "04", title: "Import duty lane", desc: "For import-linked invoices, connect VAT to landed-cost duty checks.", href: "/tools/import-duty/" }
      ]
    },
    filing: {
      label: "Monthly filing pack",
      summary: "Prepare a filing packet for returns, reconciliations, input claims, exceptions, and audit handoff.",
      pathLabel: "Prepare filing",
      primaryHref: "/tools/vat-calculator/",
      steps: [
        { tag: "01", title: "Capture VAT report trail", desc: "Save the country, rate, and mode metadata after a gated export.", href: "/tools/vat-calculator/" },
        { tag: "02", title: "Reconcile stock and sales", desc: "Use inventory data to flag taxable stock movement and evidence gaps.", href: "/tools/inventory/" },
        { tag: "03", title: "Cash flow impact", desc: "Model when VAT payments or credits affect cash runway.", href: "/tools/cash-flow-forecast/" },
        { tag: "04", title: "Dashboard filing queue", desc: "Review readiness, exceptions, and metadata audit packets.", href: "/dashboard/" }
      ]
    },
    expansion: {
      label: "Cross-border expansion",
      summary: "Compare VAT markets, import duty, transfer-pricing exposure, and trade handoffs before launch.",
      pathLabel: "Compare countries",
      primaryHref: "/tools/vat-calculator/",
      steps: [
        { tag: "01", title: "Compare VAT markets", desc: "Use country comparison to identify high-rate and zero-rated markets.", href: "/tools/vat-calculator/" },
        { tag: "02", title: "Model import duty", desc: "Add import taxes where goods cross borders.", href: "/tools/import-duty/" },
        { tag: "03", title: "Transfer pricing check", desc: "Flag related-party pricing risks before the finance team signs off.", href: "/tools/transfer-pricing/" },
        { tag: "04", title: "Trade handoff", desc: "Move invoice and duty evidence into the trade workflow.", href: "/trade/" }
      ]
    },
    "source-audit": {
      label: "Rate source audit",
      summary: "Review official authority anchors for Ghana, Kenya, South Africa, and the pan-African calculator.",
      pathLabel: "Open VAT calculator",
      primaryHref: "/tools/vat-calculator/",
      steps: [
        { tag: "01", title: "Pan-African source check", desc: "Review current calculator assumptions before exporting a report.", href: "/tools/vat-calculator/" },
        { tag: "02", title: "Ghana GRA lane", desc: "Confirm 15% VAT plus NHIL and GETFund treatment.", href: "/ghana/gh-vat" },
        { tag: "03", title: "Kenya KRA lane", desc: "Confirm the 16% standard rate and deleted old petroleum rate.", href: "/kenya/ke-vat" },
        { tag: "04", title: "SARS lane", desc: "Confirm South Africa rate and registration threshold posture.", href: "/south-africa/za-vat" }
      ]
    }
  };

  var targets = {
    dashboard: { label: "Dashboard workspace", href: "/dashboard/", category: "account", desc: "Save VAT metadata and continue from My Workspace." },
    documents: { label: "Document & PDF", href: "/document-pdf/", category: "document-pdf", desc: "Turn tax reports into invoice, receipt, filing, or audit document packets." },
    salary: { label: "Salary & PAYE", href: "/salary-tax/", category: "salary-tax", desc: "Connect VAT and business tax evidence with payroll or PAYE reporting." },
    trade: { label: "Trade packs", href: "/trade/", category: "trade", desc: "Attach VAT, invoice, import duty, and certificate evidence to trade handoffs." },
    legal: { label: "Legal workflows", href: "/legal/", category: "legal", desc: "Route exceptions, tax registrations, contracts, or dispute records into legal review." },
    payroll: { label: "AfroPayroll workspace", href: "/tools/afropayroll-os/workspace.html", category: "payroll", desc: "Send approved business-tax and staff-cost assumptions into payroll preparation." }
  };

  var checklist = [
    { key: "rateSource", label: "Official rate source checked", desc: "Revenue authority source, effective date, and country scope are known." },
    { key: "invoiceBase", label: "Invoice base reconciled", desc: "Net, VAT, total, zero-rated, and exempt lines have been reviewed." },
    { key: "exemptions", label: "Exemptions documented", desc: "Zero-rated and exempt treatment has a clear basis." },
    { key: "withholding", label: "Withholding reviewed", desc: "Buyer withholding, certificates, and supplier remittance are clear." },
    { key: "filingPeriod", label: "Filing period set", desc: "Return month, due date, and payment timing are identified." },
    { key: "approval", label: "Finance approval ready", desc: "Reviewer, status, and exception queue are ready for handoff." }
  ];

  var statuses = ["draft", "review", "approved", "filed"];
  var statusLabels = { draft: "Draft", review: "Review", approved: "Approved", filed: "Filed" };

  var planRules = {
    report: { label: "Report trails", freeLimit: 20, proText: "Unlimited VAT and business tax report trails with longer account history" },
    filing: { label: "Filing packs", freeLimit: 3, proText: "Unlimited filing packs across entities, months, and countries" },
    audit: { label: "Audit packets", freeLimit: 3, proText: "Unlimited metadata audit packets and exception history" },
    readiness: { label: "Readiness boards", freeLimit: 3, proText: "Unlimited readiness boards across recurring workflows" },
    advanced: { label: "Advanced workflows", freeLimit: 1, proText: "Batch, multi-country, cross-category, and team-ready workflow lanes" }
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
    return String(value == null ? "" : value).replace(/[&<>"']/g, function(ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function list(value) {
    return Array.isArray(value) ? value.filter(Boolean) : [];
  }

  function sortBy(items, primary, fallback) {
    return list(items).sort(function(a, b) {
      return new Date(b[primary] || b[fallback] || b.updatedAt || b.createdAt || 0).getTime() -
        new Date(a[primary] || a[fallback] || a.updatedAt || a.createdAt || 0).getTime();
    });
  }

  function getReports() { return sortBy(readJson(REPORTS_KEY, []), "updatedAt", "savedAt"); }
  function getFilingPacks() { return sortBy(readJson(FILING_PACKS_KEY, []), "updatedAt", "createdAt"); }
  function getReadinessBoards() { return sortBy(readJson(READINESS_KEY, []), "updatedAt", "createdAt"); }
  function getAuditPackets() { return sortBy(readJson(AUDIT_PACKETS_KEY, []), "createdAt", "exportedAt"); }

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

  function getPlanState() {
    var user = null;
    try {
      if (window.AfroAuth && typeof window.AfroAuth.getUser === "function") user = window.AfroAuth.getUser();
    } catch (err) {}
    if (!user) {
      try {
        if (window.AfroAuth && typeof window.AfroAuth.getCachedProfile === "function") user = window.AfroAuth.getCachedProfile();
      } catch (err) {}
    }
    if (!user) user = readJson("afro_auth_v2", null) || readJson("afrotools-auth", null);
    if (!isSignedIn() && !user) return { tier: "guest", label: "Guest", signedIn: false, pro: false, team: false };
    var tier = user && (user.tier || user.plan || user.subscription_tier || user.subscription || user.account_type || "");
    if (!tier) {
      var plan = readJson("afro_plan_v1", {}) || {};
      tier = plan.tier || plan.plan || "";
    }
    tier = String(tier || "free").toLowerCase();
    var team = /team|business|enterprise/.test(tier);
    var pro = team || /pro|premium|paid|studio/.test(tier);
    return { tier: team ? "team" : pro ? "pro" : "free", label: team ? "Team" : pro ? "Pro" : "Free", signedIn: true, pro: pro, team: team };
  }

  function monthKey(value) {
    var date = new Date(value || Date.now());
    if (!Number.isFinite(date.getTime())) date = new Date();
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
  }

  function counts() {
    var month = monthKey();
    return {
      reports: getReports().length,
      filingPacks: getFilingPacks().length,
      readiness: getReadinessBoards().length,
      auditsThisMonth: getAuditPackets().filter(function(item) {
        return monthKey(item && (item.createdAt || item.exportedAt || item.updatedAt)) === month;
      }).length
    };
  }

  function checkPlanGate(action) {
    var plan = getPlanState();
    if (!plan.signedIn && (action === "download-pack" || action === "download-audit")) {
      return {
        ok: true,
        plan: plan,
        mode: "account-gate",
        title: "Free account required",
        detail: "Guests can plan VAT workflows locally. Generated filing packs and audit exports use the shared account gate."
      };
    }
    if (plan.pro) return { ok: true, plan: plan };
    var used = counts();
    if (action === "create-filing" && used.filingPacks >= planRules.filing.freeLimit) {
      return { ok: false, plan: plan, rule: planRules.filing, used: used.filingPacks, limit: planRules.filing.freeLimit, title: "Free filing pack limit reached", detail: "Free workspaces can keep three active VAT filing packs. Pro keeps unlimited entities, countries, and filing periods." };
    }
    if (action === "download-audit" && used.auditsThisMonth >= planRules.audit.freeLimit) {
      return { ok: false, plan: plan, rule: planRules.audit, used: used.auditsThisMonth, limit: planRules.audit.freeLimit, title: "Free audit packet limit reached", detail: "Free accounts can export three VAT audit packets each month. Pro keeps unlimited packet exports." };
    }
    return { ok: true, plan: plan };
  }

  function safeHref(value) {
    var href = String(value || "/vat-business-tax/").trim();
    return href.charAt(0) === "/" ? href.replace(/"/g, "%22") : "/vat-business-tax/";
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

  function getPlan() {
    return Object.assign({ workflow: "filing", target: "dashboard" }, readJson(PLAN_KEY, {}) || {});
  }

  function readPlanFromUi(root) {
    return {
      workflow: (root.querySelector("[data-vatbiz-plan-workflow]") || {}).value || "filing",
      target: (root.querySelector("[data-vatbiz-plan-target]") || {}).value || "dashboard",
      updatedAt: new Date().toISOString()
    };
  }

  function recommend(plan) {
    plan = Object.assign({}, getPlan(), plan || {});
    var workflow = workflows[plan.workflow] || workflows.filing;
    var target = targets[plan.target] || targets.dashboard;
    var steps = workflow.steps.slice(0, 4);
    steps.push({ tag: "NEXT", title: target.label, desc: target.desc, href: target.href });
    return {
      workflowKey: plan.workflow || "filing",
      targetKey: plan.target || "dashboard",
      workflow: workflow,
      target: target,
      primaryHref: workflow.primaryHref,
      steps: steps,
      confidence: isSignedIn() ? "Account workspace ready" : "Guest local workspace"
    };
  }

  function latestReport(workflowKey) {
    var routeSlugs = (workflows[workflowKey] || workflows.filing).steps.map(function(step) {
      return step.href.replace(/^\/tools\//, "").replace(/\/$/, "").replace(/^\//, "").split("/")[1] || step.href.replace(/^\/tools\//, "").replace(/\/$/, "");
    });
    var reports = getReports();
    return reports.find(function(item) {
      return item && routeSlugs.indexOf(item.toolSlug) !== -1;
    }) || reports[0] || null;
  }

  function normalizeChecklist(source) {
    var current = source && source.checklist || {};
    var result = {};
    checklist.forEach(function(item) { result[item.key] = !!current[item.key]; });
    return result;
  }

  function latestFilingPack(plan) {
    plan = Object.assign({}, getPlan(), plan || {});
    return getFilingPacks().find(function(item) {
      return item && item.workflow === plan.workflow && item.target === plan.target;
    }) || getFilingPacks()[0] || null;
  }

  function getWorkflowProfile(plan, board) {
    var rec = recommend(plan);
    var planState = getPlanState();
    var risk = {
      pricing: { level: "Medium", focus: "VAT-inclusive pricing, margin protection, markup pressure", advanced: "Saved quote templates and recurring pricing controls" },
      invoice: { level: "Medium-high", focus: "Tax invoice fields, line treatment, receipt evidence", advanced: "Reusable invoice packs with client and filing metadata" },
      withholding: { level: "High", focus: "Buyer withholding, supplier remittance, certificates, and country fit", advanced: "Multi-country WHT and VAT remittance comparison" },
      filing: { level: "High", focus: "Return month, input/output reconciliation, exception queue, and approval trail", advanced: "Recurring entity filing packs with source freshness checks" },
      expansion: { level: "High", focus: "Cross-border VAT, duty, transfer pricing, and trade evidence", advanced: "Multi-market launch packs and team signoff lanes" },
      "source-audit": { level: "Medium", focus: "Official source freshness, effective dates, and stale-rate exceptions", advanced: "Scheduled source review and country-specific audit history" }
    };
    var targetNotes = {
      dashboard: "Dashboard destination keeps VAT work visible across saved tools and reports.",
      documents: "Document & PDF destination turns tax metadata into filing packets and export-ready documents.",
      salary: "Salary destination raises payroll tax and business expense coordination checks.",
      trade: "Trade destination raises invoice, import duty, customs, and broker evidence checks.",
      legal: "Legal destination raises registration, dispute, contract, and exception review checks.",
      payroll: "AfroPayroll workspace destination raises staff-cost and payroll-run preparation checks."
    };
    var profile = risk[rec.workflowKey] || risk.filing;
    var exceptionCount = board && Array.isArray(board.exceptions) ? board.exceptions.length : 0;
    return {
      level: profile.level,
      focus: profile.focus,
      advanced: profile.advanced,
      targetNote: targetNotes[rec.targetKey] || targetNotes.dashboard,
      nextAction: exceptionCount ? "Resolve " + exceptionCount + " open exception" + (exceptionCount === 1 ? "" : "s") : "Export the metadata audit packet",
      planNote: planState.pro ? "Pro workflow lanes are open for this account." : "Free keeps the category useful; Pro removes filing, audit, recurring, and team-history limits."
    };
  }

  function calculateReadiness(plan, board) {
    var rec = recommend(plan);
    var report = latestReport(rec.workflowKey);
    var pack = latestFilingPack(plan);
    var checked = checklist.filter(function(item) { return board && board.checklist && board.checklist[item.key]; }).length;
    var score = 12 + Math.round(checked / checklist.length * 52);
    if (report) score += 18;
    if (pack) score += 12;
    if (isSignedIn()) score += 6;
    var exceptions = [];
    if (!report) exceptions.push("No VAT or business tax report trail has been captured from a gated export yet.");
    if (!pack) exceptions.push("No filing pack has been created for this workflow and destination.");
    if (!(board && board.checklist && board.checklist.rateSource)) exceptions.push("Official VAT source, effective date, or country scope is not marked reviewed.");
    if (!(board && board.checklist && board.checklist.invoiceBase)) exceptions.push("Invoice base, VAT amount, and total are not marked reconciled.");
    if (!(board && board.checklist && board.checklist.filingPeriod)) exceptions.push("Filing period or due-date timing is still open.");
    if (!(board && board.checklist && board.checklist.approval)) exceptions.push("Finance approval or reviewer signoff is still open.");
    if (!isSignedIn()) exceptions.push("Workspace metadata is device-only until the user signs in.");
    return { score: Math.max(0, Math.min(100, score)), report: report, pack: pack, exceptions: exceptions };
  }

  function readinessId(plan) {
    plan = Object.assign({}, getPlan(), plan || {});
    return "vat-business-tax-readiness-" + (plan.workflow || "filing") + "-" + (plan.target || "dashboard");
  }

  function syncItem(item, itemType) {
    if (!item || !isSignedIn()) return Promise.resolve(false);
    return ensureWorkspace().then(function(workspace) {
      if (!(workspace && typeof workspace.upsert === "function" && workspace.isSignedIn && workspace.isSignedIn())) return false;
      return workspace.upsert({
        itemType: itemType,
        itemKey: item.id,
        toolSlug: item.toolSlug,
        title: item.title,
        summary: item.summary,
        href: item.href,
        payload: {
          version: 1,
          primaryHref: item.primaryHref || "",
          targetHref: item.targetHref || item.href || "",
          targetCategory: item.targetCategory || "",
          sourceReportId: item.sourceReportId || "",
          sourceReportTitle: item.sourceReportTitle || "",
          sourceReportRef: item.sourceReportRef || "",
          filingPackId: item.filingPackId || "",
          readinessId: item.readinessId || "",
          readinessScore: item.readinessScore || item.score || 0,
          readinessStatus: item.readinessStatus || item.status || "",
          planTier: item.planTier || "",
          planLabel: item.planLabel || "",
          pro: !!item.pro,
          team: !!item.team,
          profile: item.profile || null,
          exceptions: item.exceptions || [],
          steps: item.steps || [],
          privacy: item.privacy || "Metadata only."
        },
        meta: {
          category: "vat-business-tax",
          workflow: item.workflow || "",
          target: item.target || "",
          targetCategory: item.targetCategory || "",
          planTier: item.planTier || "",
          status: item.readinessStatus || item.status || ""
        }
      }).then(function() {
        item.localOnly = false;
        return true;
      }).catch(function(err) {
        console.warn("[VatBusinessTaxWorkflow] Workspace sync failed:", err && err.message || err);
        return false;
      });
    });
  }

  function ensureWorkspace() {
    if (window.AfroWorkspace && typeof window.AfroWorkspace.upsert === "function") return Promise.resolve(window.AfroWorkspace);
    return new Promise(function(resolve) {
      var existing = document.querySelector('script[src^="' + WORKSPACE_SRC.split("?")[0] + '"]');
      if (existing) {
        existing.addEventListener("load", function() { resolve(window.AfroWorkspace || null); }, { once: true });
        existing.addEventListener("error", function() { resolve(null); }, { once: true });
        return;
      }
      var script = document.createElement("script");
      script.src = WORKSPACE_SRC;
      script.defer = true;
      script.onload = function() { resolve(window.AfroWorkspace || null); };
      script.onerror = function() { resolve(null); };
      document.head.appendChild(script);
    });
  }

  function ensureReadinessBoard(plan) {
    plan = Object.assign({}, getPlan(), plan || {});
    var id = readinessId(plan);
    var boards = getReadinessBoards();
    var board = boards.find(function(item) { return item && item.id === id; });
    var now = new Date().toISOString();
    var rec = recommend(plan);
    if (board) {
      board.checklist = normalizeChecklist(board);
      board.updatedAt = now;
    } else {
      board = {
        id: id,
        itemType: "vat-business-tax-readiness",
        toolSlug: "vat-business-tax-workflow",
        title: rec.workflow.label + " readiness",
        summary: "VAT & business tax workflow readiness board for source checks, filing packs, exceptions, and approval metadata.",
        href: "/vat-business-tax/",
        workflow: rec.workflowKey,
        workflowLabel: rec.workflow.label,
        target: rec.targetKey,
        targetLabel: rec.target.label,
        targetHref: rec.target.href,
        status: "draft",
        checklist: normalizeChecklist(null),
        createdAt: now,
        updatedAt: now,
        localOnly: !isSignedIn()
      };
      boards.unshift(board);
    }
    var readiness = calculateReadiness(plan, board);
    board.score = readiness.score;
    board.exceptions = readiness.exceptions;
    board.sourceReportId = readiness.report && readiness.report.id || "";
    board.sourceReportTitle = readiness.report && readiness.report.title || "";
    board.filingPackId = readiness.pack && readiness.pack.id || "";
    board.filingPackTitle = readiness.pack && readiness.pack.title || "";
    writeJson(READINESS_KEY, [board].concat(boards.filter(function(item) { return item && item.id !== id; })).slice(0, 40));
    syncItem(board, "vat-business-tax-readiness");
    return board;
  }

  function updateReadiness(id, updater) {
    var boards = getReadinessBoards();
    var updated = null;
    boards = boards.map(function(board) {
      if (board && board.id === id) {
        updated = board;
        updater(board);
        board.updatedAt = new Date().toISOString();
      }
      return board;
    });
    if (updated) {
      writeJson(READINESS_KEY, boards);
      syncItem(updated, "vat-business-tax-readiness");
    }
    return updated;
  }

  function createFilingPack(plan) {
    var rec = recommend(plan || getPlan());
    var report = latestReport(rec.workflowKey);
    var state = getPlanState();
    var now = new Date().toISOString();
    var id = "vat-business-tax-filing-" + Date.now().toString(36);
    var pack = {
      id: id,
      itemType: "vat-business-tax-filing-pack",
      toolSlug: "vat-business-tax-workflow",
      title: rec.workflow.label + " filing pack",
      summary: "Metadata-only VAT filing pack for " + rec.workflow.label + " routed to " + rec.target.label + ".",
      href: rec.target.href,
      primaryHref: rec.primaryHref,
      targetHref: rec.target.href,
      workflow: rec.workflowKey,
      workflowLabel: rec.workflow.label,
      target: rec.targetKey,
      targetLabel: rec.target.label,
      targetCategory: rec.target.category,
      sourceReportId: report && report.id || "",
      sourceReportTitle: report && report.title || "",
      sourceReportRef: report && report.ref || "",
      planTier: state.tier,
      planLabel: state.label,
      pro: state.pro,
      team: state.team,
      steps: rec.steps.map(function(step) {
        return { tag: step.tag || "", title: step.title, href: step.href, desc: step.desc };
      }),
      createdAt: now,
      updatedAt: now,
      privacy: "Metadata only. Filing packs store route labels, source references, readiness posture, and destination metadata, not invoice line items or tax files.",
      localOnly: !isSignedIn()
    };
    var packs = getFilingPacks().filter(function(item) { return item && item.id !== id; });
    packs.unshift(pack);
    writeJson(FILING_PACKS_KEY, packs.slice(0, 40));
    syncItem(pack, "vat-business-tax-filing-pack");
    dispatch("afro-vat-business-tax-filing-change", { action: "save", item: pack, count: packs.length });
    return pack;
  }

  function createAuditPacket(plan) {
    var rec = recommend(plan || getPlan());
    var report = latestReport(rec.workflowKey);
    var pack = latestFilingPack(plan);
    var board = ensureReadinessBoard({ workflow: rec.workflowKey, target: rec.targetKey });
    var state = getPlanState();
    var now = new Date().toISOString();
    var id = "vat-business-tax-audit-" + Date.now().toString(36);
    var packet = {
      id: id,
      itemType: "vat-business-tax-audit-packet",
      toolSlug: "vat-business-tax-workflow",
      title: rec.workflow.label + " audit packet",
      summary: "Metadata packet for VAT source checks, filing pack, readiness score, exceptions, and next destination.",
      href: "/vat-business-tax/",
      workflow: rec.workflowKey,
      workflowLabel: rec.workflow.label,
      target: rec.targetKey,
      targetLabel: rec.target.label,
      targetCategory: rec.target.category,
      sourceReportId: report && report.id || "",
      sourceReportTitle: report && report.title || "",
      filingPackId: pack && pack.id || "",
      filingPackTitle: pack && pack.title || "",
      readinessId: board.id,
      readinessScore: board.score || 0,
      readinessStatus: board.status || "draft",
      exceptions: board.exceptions || [],
      planTier: state.tier,
      planLabel: state.label,
      pro: state.pro,
      team: state.team,
      steps: rec.steps,
      exportedAt: now,
      createdAt: now,
      privacy: "Metadata only. VAT source documents, invoices, customer data, generated files, and raw tax calculations are not included.",
      localOnly: !isSignedIn()
    };
    var packets = getAuditPackets().filter(function(item) { return item && item.id !== id; });
    packets.unshift(packet);
    writeJson(AUDIT_PACKETS_KEY, packets.slice(0, 40));
    syncItem(packet, "vat-business-tax-audit-packet");
    dispatch("afro-vat-business-tax-audit-change", { action: "save", item: packet, count: packets.length });
    return packet;
  }

  function ensureGate() {
    if (window.AfroPdfDownloadGate && typeof window.AfroPdfDownloadGate.guardPromise === "function") return Promise.resolve(window.AfroPdfDownloadGate);
    return new Promise(function(resolve) {
      var existing = document.querySelector('script[src^="' + GATE_SRC.split("?")[0] + '"]');
      if (existing) {
        existing.addEventListener("load", function() { resolve(window.AfroPdfDownloadGate || null); }, { once: true });
        existing.addEventListener("error", function() { resolve(null); }, { once: true });
        return;
      }
      var script = document.createElement("script");
      script.src = GATE_SRC;
      script.defer = true;
      script.onload = function() { resolve(window.AfroPdfDownloadGate || null); };
      script.onerror = function() { resolve(null); };
      document.head.appendChild(script);
    });
  }

  function downloadJson(item, source, fileName) {
    if (!item) return Promise.resolve(false);
    return ensureGate().then(function(gate) {
      var context = {
        source: source,
        toolSlug: "vat-business-tax-workflow",
        toolName: "VAT & Business Tax workflow",
        reportTitle: item.title,
        category: "vat-business-tax"
      };
      return (gate && typeof gate.guardPromise === "function" ? gate.guardPromise(context) : Promise.resolve({ context: context })).then(function(result) {
        if (!result) return false;
        var blob = new Blob([JSON.stringify({
          version: 1,
          exportedAt: new Date().toISOString(),
          privacy: "Metadata only. VAT source documents, invoices, customer data, generated files, and raw tax calculations are not included.",
          item: item
        }, null, 2)], { type: "application/json" });
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = fileName || item.id + ".json";
        document.body.appendChild(link);
        link.click();
        window.setTimeout(function() {
          URL.revokeObjectURL(url);
          link.remove();
        }, 1000);
        return true;
      });
    });
  }

  function dispatch(name, detail) {
    try {
      window.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
      window.dispatchEvent(new CustomEvent("afro-workspace-change", { detail: { itemType: detail && detail.item && detail.item.itemType || "vat-business-tax-workflow", action: detail && detail.action || "save" } }));
    } catch (err) {}
  }

  function render(root) {
    var plan = getPlan();
    var rec = recommend(plan);
    var state = getPlanState();
    root.innerHTML =
      '<div class="vatbiz-flow-head">' +
        '<div><div class="ey">Workflow Intelligence</div><h2>Build one VAT &amp; business tax workspace</h2><p>Pick the tax job and next destination. AfroTools will route the user across the right calculators, save report metadata, create filing readiness boards, gate metadata packet exports, and hand off to dashboard or another category without storing invoice lines or tax files.</p></div>' +
        '<div class="vatbiz-flow-status"><strong>' + esc(state.label + " VAT workspace") + '</strong>' + esc(state.pro ? "Unlimited filing packs, audit packets, and workflow metadata are available for this account." : state.signedIn ? "Free account downloads are unlocked. Pro removes recurring filing, audit, multi-country, and team-history limits." : "Guests can run tools and plan locally. Downloads open the free account gate.") + '</div>' +
      '</div>' +
      '<div class="vatbiz-flow-grid">' +
        '<section class="vatbiz-flow-panel"><h3>Planner</h3>' +
          '<div class="vatbiz-flow-field"><label for="vatbizFlowWorkflow">Workflow</label><select id="vatbizFlowWorkflow" data-vatbiz-plan-workflow>' + Object.keys(workflows).map(function(key) { return '<option value="' + esc(key) + '"' + (key === rec.workflowKey ? " selected" : "") + ">" + esc(workflows[key].label) + "</option>"; }).join("") + '</select></div>' +
          '<div class="vatbiz-flow-field"><label for="vatbizFlowTarget">Next category</label><select id="vatbizFlowTarget" data-vatbiz-plan-target>' + Object.keys(targets).map(function(key) { return '<option value="' + esc(key) + '"' + (key === rec.targetKey ? " selected" : "") + ">" + esc(targets[key].label) + "</option>"; }).join("") + '</select></div>' +
          '<p class="vatbiz-flow-note">' + esc(rec.workflow.summary) + '</p>' +
          '<div class="vatbiz-flow-actions"><a class="vatbiz-flow-btn primary" href="' + esc(safeHref(rec.primaryHref)) + '">' + esc(rec.workflow.pathLabel) + '</a><button class="vatbiz-flow-btn" type="button" data-vatbiz-action="save-plan">Save planner</button><button class="vatbiz-flow-btn" type="button" data-vatbiz-action="show-gates">Free vs Pro gates</button></div>' +
        '</section>' +
        '<section class="vatbiz-flow-panel"><h3>Recommended route</h3>' + renderRoute(rec) + '</section>' +
        '<section class="vatbiz-flow-panel"><h3>Reports, filing, and audit trail</h3><div data-vatbiz-workspace></div></section>' +
      '</div>';
    renderWorkspace(root.querySelector("[data-vatbiz-workspace]"), rec, plan);
    bind(root);
  }

  function renderRoute(rec) {
    return '<div class="vatbiz-flow-route">' + rec.steps.map(function(step, index) {
      return '<article class="vatbiz-flow-route-card"><span class="vatbiz-flow-step">' + esc(step.tag || String(index + 1).padStart(2, "0")) + '</span><div><h4>' + esc(step.title) + '</h4><p>' + esc(step.desc) + '</p><a href="' + esc(safeHref(step.href)) + '">Open route</a></div></article>';
    }).join("") + '</div>';
  }

  function renderWorkspace(node, rec, plan) {
    var reports = getReports();
    var packs = getFilingPacks();
    var boards = getReadinessBoards();
    var audits = getAuditPackets();
    var state = getPlanState();
    var board = ensureReadinessBoard(plan);
    var report = latestReport(rec.workflowKey);
    var pack = latestFilingPack(plan);
    var audit = audits[0] || null;
    var profile = getWorkflowProfile(plan, board);
    var gateCounts = counts();
    var reportHtml = report ? '<div class="vatbiz-flow-latest"><strong>' + esc(report.title || "VAT report") + '</strong>' + esc(report.summary || "Generated VAT report trail") + '<br><span>' + esc([report.toolName || report.toolSlug || "VAT tool", report.fileName || "", timeAgo(report.updatedAt || report.savedAt)].filter(Boolean).join(" | ")) + '</span></div>' : '<div class="vatbiz-flow-latest"><strong>No report trail yet</strong>Reports appear here after a gated export from a VAT or business tax tool.</div>';
    var packHtml = pack ? '<div class="vatbiz-flow-latest"><strong>' + esc(pack.title || "VAT filing pack") + '</strong>' + esc(pack.summary || "Saved filing metadata pack") + '<br><span>' + esc(timeAgo(pack.updatedAt || pack.createdAt)) + '</span></div>' : '<p class="vatbiz-flow-note">Create a filing pack when the tax result is ready to move into dashboard, Document & PDF, salary, trade, legal, or AfroPayroll workspace.</p>';
    var auditHtml = audit ? '<p class="vatbiz-flow-note">Latest audit packet: ' + esc(audit.title || "Audit packet") + " - " + esc(timeAgo(audit.createdAt || audit.exportedAt)) + '.</p>' : '<p class="vatbiz-flow-note">Audit packets package only route and readiness metadata, never invoice lines, customer details, or source files.</p>';
    node.innerHTML =
      '<div class="vatbiz-flow-meter"><div class="vatbiz-flow-metric"><strong>' + reports.length + '</strong><span>Reports</span></div><div class="vatbiz-flow-metric"><strong>' + packs.length + '</strong><span>Filing Packs</span></div><div class="vatbiz-flow-metric"><strong>' + boards.length + '</strong><span>Readiness</span></div><div class="vatbiz-flow-metric"><strong>' + audits.length + '</strong><span>Audit Packets</span></div></div>' +
      '<div class="vatbiz-plan-gates" aria-label="VAT business tax plan gates"><article><strong>' + esc(state.label) + '</strong><span>' + esc(state.signedIn ? "Account workspace" : "Download gate pending") + '</span></article><article><strong>' + esc(state.pro ? "Unlimited" : Math.min(gateCounts.reports, planRules.report.freeLimit) + "/" + planRules.report.freeLimit) + '</strong><span>Report trails</span></article><article><strong>' + esc(state.pro ? "Unlimited" : Math.min(gateCounts.filingPacks, planRules.filing.freeLimit) + "/" + planRules.filing.freeLimit) + '</strong><span>Filing packs</span></article><article><strong>' + esc(state.pro ? "Unlimited" : Math.min(gateCounts.auditsThisMonth, planRules.audit.freeLimit) + "/" + planRules.audit.freeLimit + " this month") + '</strong><span>Audit packets</span></article></div>' +
      '<div class="vatbiz-flow-profile"><div><strong>Smart workflow profile</strong><span>' + esc(profile.level) + ' risk</span></div><p>' + esc(profile.focus) + '</p><ul><li><b>Next:</b> ' + esc(profile.nextAction) + '</li><li><b>Advanced:</b> ' + esc(profile.advanced) + '</li><li><b>Destination:</b> ' + esc(profile.targetNote) + '</li></ul><small>' + esc(profile.planNote) + '</small></div>' +
      reportHtml + packHtml +
      '<div class="vatbiz-flow-readiness" data-readiness-id="' + esc(board.id) + '"><div class="vatbiz-flow-score"><strong>' + esc(board.score || 0) + '%</strong><span>Filing readiness</span></div><div class="vatbiz-flow-progress"><span style="width:' + esc(board.score || 0) + '%"></span></div><div class="vatbiz-flow-status-row"><label for="vatbizFlowStatus">Status</label><select id="vatbizFlowStatus" class="vatbiz-flow-select" data-vatbiz-status>' + statuses.map(function(key) { return '<option value="' + esc(key) + '"' + (key === board.status ? " selected" : "") + ">" + esc(statusLabels[key]) + "</option>"; }).join("") + '</select><button class="vatbiz-flow-btn" type="button" data-vatbiz-action="advance-status">Advance</button></div>' + renderChecklist(board) + renderExceptions(board) + auditHtml + '</div>' +
      '<div class="vatbiz-flow-actions"><button class="vatbiz-flow-btn primary" type="button" data-vatbiz-action="create-filing">Create filing pack</button><button class="vatbiz-flow-btn" type="button" data-vatbiz-action="download-pack" ' + (pack ? "" : "disabled") + '>Download filing pack</button><button class="vatbiz-flow-btn" type="button" data-vatbiz-action="download-audit">Download audit packet</button><a class="vatbiz-flow-btn" href="/dashboard/">Open dashboard</a></div><div class="vatbiz-flow-toast" data-vatbiz-toast aria-live="polite"></div>';
  }

  function renderChecklist(board) {
    return '<div class="vatbiz-flow-checklist">' + checklist.map(function(item) {
      var checked = board.checklist && board.checklist[item.key];
      return '<label class="vatbiz-flow-check"><input type="checkbox" data-vatbiz-check="' + esc(item.key) + '"' + (checked ? " checked" : "") + '><span><strong>' + esc(item.label) + '</strong><small>' + esc(item.desc) + '</small></span></label>';
    }).join("") + '</div>';
  }

  function renderExceptions(board) {
    if (board.exceptions && board.exceptions.length) {
      return '<div class="vatbiz-flow-exceptions"><strong>Exception queue</strong><ul>' + board.exceptions.map(function(item) { return "<li>" + esc(item) + "</li>"; }).join("") + "</ul></div>";
    }
    return '<div class="vatbiz-flow-exceptions ok"><strong>No open exceptions</strong><span>Ready for a metadata audit packet.</span></div>';
  }

  function toast(root, message) {
    var node = root.querySelector("[data-vatbiz-toast]");
    if (node) node.textContent = message || "";
  }

  function showGate(root, gate) {
    gate = gate || {};
    var existing = document.querySelector(".vatbiz-upgrade-overlay");
    if (existing) existing.remove();
    var overlay = document.createElement("div");
    function close() {
      overlay.remove();
      toast(root, "Free workspace is still available.");
    }
    overlay.className = "vatbiz-upgrade-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.innerHTML =
      '<div class="vatbiz-upgrade-card"><button class="vatbiz-upgrade-close" type="button" aria-label="Close">&times;</button><span class="vatbiz-upgrade-kicker">Free vs Pro</span><h3>' + esc(gate.title || "VAT workflow gate") + '</h3><p>' + esc(gate.detail || "This advanced VAT & business tax workflow is available on Pro.") + '</p><div class="vatbiz-upgrade-grid"><div><strong>Guest / Free</strong><span>Core calculators, account-gated downloads, local planner, three filing packs, three audit packets per month.</span></div><div><strong>Pro</strong><span>Unlimited filing packs and audit packets, recurring country lanes, team-ready history, and multi-market workflow metadata.</span></div></div><div class="vatbiz-flow-actions"><a class="vatbiz-flow-btn primary" href="/pro/">Upgrade to Pro</a><button class="vatbiz-flow-btn" type="button" data-vatbiz-upgrade-dismiss>Continue free</button></div></div>';
    document.body.appendChild(overlay);
    overlay.querySelector(".vatbiz-upgrade-close").addEventListener("click", close);
    overlay.querySelector("[data-vatbiz-upgrade-dismiss]").addEventListener("click", close);
    overlay.addEventListener("click", function(event) {
      if (event.target === overlay) close();
    });
  }

  function rerender(root) {
    render(root);
  }

  function bind(root) {
    root.querySelectorAll("[data-vatbiz-plan-workflow],[data-vatbiz-plan-target]").forEach(function(field) {
      field.addEventListener("change", function() {
        writeJson(PLAN_KEY, readPlanFromUi(root));
        rerender(root);
      });
    });
    var save = root.querySelector('[data-vatbiz-action="save-plan"]');
    if (save) {
      save.addEventListener("click", function() {
        writeJson(PLAN_KEY, readPlanFromUi(root));
        toast(root, "Planner saved on this device.");
      });
    }
    root.querySelectorAll("[data-vatbiz-check]").forEach(function(field) {
      field.addEventListener("change", function() {
        var wrap = root.querySelector("[data-readiness-id]");
        updateReadiness(wrap && wrap.getAttribute("data-readiness-id"), function(board) {
          board.checklist = normalizeChecklist(board);
          board.checklist[field.getAttribute("data-vatbiz-check")] = field.checked;
          var next = calculateReadiness(getPlan(), board);
          board.score = next.score;
          board.exceptions = next.exceptions;
        });
        rerender(root);
      });
    });
    var status = root.querySelector("[data-vatbiz-status]");
    if (status) {
      status.addEventListener("change", function() {
        var wrap = root.querySelector("[data-readiness-id]");
        updateReadiness(wrap && wrap.getAttribute("data-readiness-id"), function(board) {
          board.status = status.value || "draft";
        });
        rerender(root);
      });
    }
    root.querySelectorAll("[data-vatbiz-action]").forEach(function(button) {
      button.addEventListener("click", function() {
        var action = button.getAttribute("data-vatbiz-action");
        var plan = getPlan();
        if (action === "advance-status") {
          var wrap = root.querySelector("[data-readiness-id]");
          updateReadiness(wrap && wrap.getAttribute("data-readiness-id"), function(board) {
            var index = statuses.indexOf(board.status || "draft");
            board.status = statuses[Math.min(statuses.length - 1, Math.max(0, index) + 1)];
          });
          rerender(root);
          return;
        }
        if (action === "create-filing") {
          var filingGate = checkPlanGate("create-filing");
          if (!filingGate.ok) return showGate(root, filingGate);
          var pack = createFilingPack(plan);
          ensureReadinessBoard(plan);
          rerender(root);
          toast(root, pack.title + " saved.");
          return;
        }
        if (action === "download-pack") {
          var packToDownload = latestFilingPack(plan);
          var packGate = checkPlanGate("download-pack");
          if (!packGate.ok) return showGate(root, packGate);
          downloadJson(packToDownload, "vat-business-tax-filing-pack", packToDownload && packToDownload.id ? packToDownload.id + ".json" : "vat-business-tax-filing-pack.json").then(function(ok) {
            toast(root, ok ? "Filing pack exported." : "Export cancelled.");
          });
          return;
        }
        if (action === "download-audit") {
          var auditGate = checkPlanGate("download-audit");
          if (!auditGate.ok) return showGate(root, auditGate);
          var audit = createAuditPacket(plan);
          rerender(root);
          downloadJson(audit, "vat-business-tax-audit-packet", audit && audit.id ? audit.id + ".json" : "vat-business-tax-audit-packet.json").then(function(ok) {
            toast(root, ok ? "Audit packet exported." : "Export cancelled.");
          });
          return;
        }
        if (action === "show-gates") {
          showGate(root, {
            title: "VAT & Business Tax gates",
            detail: "AfroTools keeps core VAT tools free. Guests meet the free account gate at generated downloads. Free accounts get saved report trails and limited filing/audit packets. Pro unlocks recurring, multi-country, and team-ready workflow history."
          });
        }
      });
    });
  }

  function init() {
    document.querySelectorAll("[data-vatbiz-workflow-app]").forEach(function(root) {
      render(root);
      if (!root.dataset.vatbizEventsBound) {
        root.dataset.vatbizEventsBound = "true";
        window.addEventListener("afro-vat-business-tax-report-change", function() { rerender(root); });
        window.addEventListener("storage", function(event) {
          if ([REPORTS_KEY, FILING_PACKS_KEY, READINESS_KEY, AUDIT_PACKETS_KEY, PLAN_KEY].indexOf(event.key) !== -1) rerender(root);
        });
      }
    });
  }

  window.AfroVatBusinessTaxWorkflow = {
    storage: { reports: REPORTS_KEY, filingPacks: FILING_PACKS_KEY, readiness: READINESS_KEY, audits: AUDIT_PACKETS_KEY, plan: PLAN_KEY },
    getReports: getReports,
    getFilingPacks: getFilingPacks,
    getReadinessBoards: getReadinessBoards,
    getAuditPackets: getAuditPackets,
    getPlanState: getPlanState,
    checkPlanGate: checkPlanGate,
    planRules: planRules,
    createFilingPack: createFilingPack,
    createAuditPacket: createAuditPacket,
    getWorkflowProfile: getWorkflowProfile,
    recommend: recommend
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
}(window, document);

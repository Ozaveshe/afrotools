;(function (root) {
  "use strict";

  var apps = [
    {
      id: "payroll",
      name: "AfroPayroll",
      shortName: "Payroll",
      mark: "AP",
      route: "/pro/apps/payroll/",
      fallbackRoute: "/tools/afropayroll-os/workspace.html",
      routeExists: true,
      routeStatus: "active",
      domain: "Payroll operations",
      owner: "Payroll OS",
      shellState: "Live workspace",
      buildStatus: "Reads payroll dashboard when the signed-in account has synced runs.",
      statusTone: "ready",
      summary: "Monthly runs, employee rows, country-pack confidence, payslip packets, approvals, exports, and audit history.",
      primaryAction: "Open app route",
      secondaryAction: "Open live workspace",
      tags: ["Runs", "Payslips", "Approvals"],
      dataModel: "AfroPayroll local history plus /api/afropayroll dashboard.",
      dataSurface: "Real cloud data when synced, plus browser-local payroll saves.",
      needsAttention: "Review warnings, unsigned runs, local saves that have not been synced.",
      readiness: 82
    },
    {
      id: "tax-compliance",
      name: "Tax Compliance",
      shortName: "Tax",
      mark: "TC",
      route: "/pro/apps/tax-compliance/",
      routeExists: true,
      routeStatus: "shell",
      domain: "Tax and statutory review",
      owner: "Country packs",
      shellState: "Shell",
      buildStatus: "Local workflow shell for tax calendars, evidence packs, source reviews, and checklists.",
      statusTone: "shell",
      summary: "A control lane for tax calendars, statutory evidence packs, source-review dates, and compliance checklists.",
      primaryAction: "Open app route",
      tags: ["Calendar", "Evidence", "Review"],
      dataModel: "Pending shared schema for filings, deadlines, and reviewer sign-off.",
      dataSurface: "Route exists with browser-local shell state only.",
      needsAttention: "Define country-level filing calendars and evidence-pack tables before claiming readiness.",
      readiness: 30
    },
    {
      id: "books",
      name: "Books",
      shortName: "Books",
      mark: "BK",
      route: "/pro/apps/books/",
      routeExists: true,
      routeStatus: "shell",
      domain: "Accounting workspace",
      owner: "Finance OS",
      shellState: "Shell",
      buildStatus: "Local finance shell for bookkeeping, journals, invoices, and payroll-to-books handoff.",
      statusTone: "shell",
      summary: "Lightweight books for income, expenses, journal exports, client files, and accountant handoff.",
      primaryAction: "Open app route",
      tags: ["Ledger", "Journals", "Exports"],
      dataModel: "No books ledger schema is wired to the Pro dashboard yet.",
      dataSurface: "Route exists with browser-local finance shell state only.",
      needsAttention: "Decide local-first versus account-backed ledger storage.",
      readiness: 26
    },
    {
      id: "hr",
      name: "HR",
      shortName: "HR",
      mark: "HR",
      route: "/pro/apps/hr/",
      routeExists: true,
      routeStatus: "shell",
      domain: "People operations",
      owner: "People OS",
      shellState: "Shell",
      buildStatus: "People operations shell for employee records, onboarding, leave, documents, and payroll readiness.",
      statusTone: "shell",
      summary: "Employee master records, onboarding tasks, leave, document requests, and profile confirmation.",
      primaryAction: "Open app route",
      tags: ["Employees", "Leave", "Profiles"],
      dataModel: "Uses payroll employee records once the HR app is carved out.",
      dataSurface: "Reads browser-local payroll employee master records where present.",
      needsAttention: "Separate HR profile truth from salary-sensitive payroll rows.",
      readiness: 42
    },
    {
      id: "trade-desk",
      name: "Trade Desk",
      shortName: "Trade",
      mark: "TD",
      route: "/pro/apps/trade-desk/",
      routeExists: true,
      routeStatus: "shell",
      domain: "Import and trade ops",
      owner: "Trade OS",
      shellState: "Shell",
      buildStatus: "Local trade operations shell for shipments, landed costs, AfCFTA notes, suppliers, duty review, and exports.",
      statusTone: "shell",
      summary: "A workbench for landed-cost scenarios, customs notes, FX watchlists, and trade-document handoff.",
      primaryAction: "Open app route",
      tags: ["Imports", "FX", "Duties"],
      dataModel: "Current value comes from public tools, not a Pro workspace store.",
      dataSurface: "Route exists with browser-local trade operations shell state only.",
      needsAttention: "Create saved trade scenarios and client-level shipment records.",
      readiness: 34
    },
    {
      id: "legal-desk",
      name: "Legal Desk",
      shortName: "Legal",
      mark: "LD",
      route: "/pro/apps/legal-desk/",
      fallbackRoute: "/pro/apps/legal/",
      aliasRoute: "/pro/apps/legal/",
      routeExists: true,
      routeStatus: "shell",
      domain: "Documents and review",
      owner: "Legal OS",
      shellState: "Shell",
      buildStatus: "Expected Legal Desk route exists and forwards to the current /pro/apps/legal/ shell.",
      statusTone: "shell",
      summary: "Draft packets, review notes, legal intake, and reusable document workflows for African operators.",
      primaryAction: "Open app route",
      tags: ["Contracts", "Review", "Packets"],
      dataModel: "No shared legal workspace schema is wired yet.",
      dataSurface: "Route exists with browser-local legal shell state only.",
      needsAttention: "Define document storage boundary and legal-disclaimer language.",
      readiness: 30
    },
    {
      id: "grants-tenders",
      name: "Grants & Tenders",
      shortName: "Grants",
      mark: "GT",
      route: "/pro/apps/grants-tenders/",
      routeExists: true,
      routeStatus: "shell",
      domain: "Opportunity pipeline",
      owner: "Growth OS",
      shellState: "Shell",
      buildStatus: "Local opportunity shell for tenders, grants, requirements, deadlines, reviewers, and submission packets.",
      statusTone: "shell",
      summary: "Track tenders, grants, eligibility, deadlines, documents, reviewers, and submission status.",
      primaryAction: "Open app route",
      tags: ["Pipeline", "Deadlines", "Packets"],
      dataModel: "No account-backed opportunity pipeline is wired yet.",
      dataSurface: "Route exists with browser-local opportunity shell state only.",
      needsAttention: "Create a source and deadline model before adding alerts.",
      readiness: 34
    },
    {
      id: "creator-studio",
      name: "Creator Studio",
      shortName: "Creator",
      mark: "CS",
      route: "/pro/apps/creator-studio/",
      routeExists: true,
      routeStatus: "shell",
      domain: "Creator operations",
      owner: "AfroStream",
      shellState: "Shell",
      buildStatus: "Local creator business shell for media kits, rate cards, pitches, campaign calendars, sponsors, and handoff packs.",
      statusTone: "shell",
      summary: "Creator assets, channel notes, content tasks, sponsor briefs, and release calendars.",
      primaryAction: "Open app route",
      tags: ["Creators", "Assets", "Calendar"],
      dataModel: "AfroStream data exists elsewhere; no Pro creator workspace schema is connected.",
      dataSurface: "Route exists with browser-local creator workspace shell state only.",
      needsAttention: "Separate public creator intelligence from private client workspaces.",
      readiness: 34
    },
    {
      id: "stream-intelligence",
      name: "Stream Intelligence",
      shortName: "Stream",
      mark: "SI",
      route: "/pro/apps/stream-intelligence/",
      routeExists: true,
      routeStatus: "needs schema",
      domain: "Media intelligence",
      owner: "AfroStream",
      shellState: "Needs schema",
      buildStatus: "Blocked planning shell exists. It needs source, inference, and user-edit boundaries before activation.",
      statusTone: "schema",
      summary: "Monitor creator updates, stream signals, news changes, sponsorship movements, and freshness tasks.",
      primaryAction: "Open review shell",
      tags: ["Signals", "News", "Freshness"],
      dataModel: "Requires a private intelligence queue before it can be a Pro app.",
      dataSurface: "Route exists as a blocked planning shell; no private intelligence queue is wired.",
      needsAttention: "Define what is sourced, what is inferred, what users can edit, and what must be reviewed.",
      readiness: 14
    },
    {
      id: "property-projects",
      name: "Property Projects",
      shortName: "Property",
      mark: "PP",
      route: "/pro/apps/property-projects/",
      routeExists: true,
      routeStatus: "shell",
      domain: "Build and property ops",
      owner: "Property OS",
      shellState: "Shell",
      buildStatus: "Local property and project shell for budgets, contractors, procurement, inspections, documents, and milestones.",
      statusTone: "shell",
      summary: "Project budgets, build milestones, contractor documents, risk checks, and property handoff files.",
      primaryAction: "Open app route",
      tags: ["Budgets", "Milestones", "Docs"],
      dataModel: "Current property calculators are public tools; no Pro project store is connected.",
      dataSurface: "Route exists with browser-local property project shell state only.",
      needsAttention: "Create project, contractor, and document models.",
      readiness: 34
    }
  ];

  var supportRoutes = [
    {
      id: "vault",
      name: "Pro Vault",
      route: "/pro/vault/",
      safeRoute: "/pro/vault/",
      routeExists: true,
      routeStatus: "active",
      summary: "Shared route for export packets, documents, payslips, compliance packs, invoices, and local/cloud data labels."
    },
    {
      id: "team",
      name: "Team",
      route: "/pro/team/",
      safeRoute: "/pro/team/",
      routeExists: true,
      routeStatus: "active",
      summary: "Shared route for roles, members, invites, clients, and permission model placeholders."
    },
    {
      id: "settings",
      name: "Settings",
      route: "/pro/settings/",
      safeRoute: "/pro/settings/",
      routeExists: true,
      routeStatus: "active",
      summary: "Shared route for account profile display, Pro status, language lane, country, currency, and privacy preferences."
    },
    {
      id: "payroll-pack-support",
      name: "Payroll country-pack support console",
      route: "/tools/afropayroll-os/support.html",
      safeRoute: "/tools/afropayroll-os/support.html",
      routeExists: true,
      routeStatus: "active",
      summary: "Read-only country-pack support view for source review, confidence, engine coverage, and statutory calendar metadata."
    }
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getApps() {
    return clone(apps);
  }

  function getApp(id) {
    for (var i = 0; i < apps.length; i += 1) {
      if (apps[i].id === id) return clone(apps[i]);
    }
    return null;
  }

  function safeRoute(item) {
    if (!item) return "/pro/workspace/";
    if (item.routeExists === false) return item.safeRoute || item.fallbackRoute || "/pro/apps/";
    return item.safeRoute || item.route || "/pro/workspace/";
  }

  function getRoutes() {
    return apps.map(function (app) {
      return {
        id: app.id,
        name: app.name,
        route: app.route,
        safeRoute: safeRoute(app),
        routeExists: app.routeExists !== false,
        routeStatus: app.routeStatus,
        shellState: app.shellState,
        buildStatus: app.buildStatus
      };
    });
  }

  function getSupportRoutes() {
    return clone(supportRoutes);
  }

  function getStatusCounts() {
    return apps.reduce(function (counts, app) {
      var key = app.shellState || "Unknown";
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});
  }

  function getBuildSummary() {
    var counts = getStatusCounts();
    return {
      total: apps.length,
      live: counts["Live workspace"] || 0,
      setupNeeded: counts["Setup needed"] || 0,
      comingOnline: counts["Coming online"] || 0,
      localShell: counts["Shell"] || counts["Local shell"] || 0,
      needsSchema: counts["Needs schema"] || 0,
      blocked: counts.Blocked || 0
    };
  }

  var api = {
    getApps: getApps,
    getApp: getApp,
    getRoutes: getRoutes,
    getSupportRoutes: getSupportRoutes,
    getStatusCounts: getStatusCounts,
    getBuildSummary: getBuildSummary,
    safeRoute: safeRoute
  };

  root.AfroTools = root.AfroTools || {};
  root.AfroTools.proAppRegistry = api;
  root.AfroProAppRegistry = api;
})(typeof window !== "undefined" ? window : globalThis);

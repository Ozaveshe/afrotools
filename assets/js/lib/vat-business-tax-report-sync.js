!function(window, document) {
  "use strict";

  var STORAGE_KEY = "afro_vat_business_tax_reports_v1";
  var WORKSPACE_SRC = "/assets/js/lib/workspace-sync.js?v=20260417a";

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

  function routeSlug() {
    var parts = String(window.location.pathname || "").replace(/\/app\.html$/i, "").replace(/\/index\.html$/i, "").replace(/\/$/, "").split("/").filter(Boolean);
    return parts[parts.length - 1] || "vat-business-tax";
  }

  function findTool(slug) {
    try {
      return Array.isArray(window.AFRO_TOOLS) && window.AFRO_TOOLS.find(function(tool) {
        return tool && (tool.id === slug || String(tool.href || "").indexOf("/" + slug) !== -1);
      }) || null;
    } catch (err) {
      return null;
    }
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

  function timestamp(value) {
    var time = new Date(value || Date.now()).getTime();
    return Number.isFinite(time) ? time : Date.now();
  }

  function isVatContext(context) {
    context = context || {};
    if (context.category === "vat-business-tax") return true;
    var slug = String(context.toolSlug || context.toolId || routeSlug()).toLowerCase();
    var path = String(window.location.pathname || "").toLowerCase();
    var tool = findTool(slug);
    if (tool && tool.category === "ecommerce") return true;
    return /vat|wht|withholding|business-tax|profit-margin|markup|break-even|invoice|receipt/.test(slug + " " + path);
  }

  function buildId(context, detail) {
    var slug = String(context.toolSlug || context.toolId || detail.toolId || routeSlug() || "vat-business-tax").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
    var ref = detail.ref || context.ref || "";
    if (ref) return "vat-business-tax-report-" + slug + "-" + String(ref).replace(/[^a-z0-9-]/gi, "-").toLowerCase();
    var captured = timestamp(context.capturedAt || detail.generatedAt || detail.createdAt || Date.now()).toString(36);
    return "vat-business-tax-report-" + slug + "-" + String(detail.fileName || context.fileName || context.reportTitle || "report").replace(/[^a-z0-9-]/gi, "-").toLowerCase().slice(0, 44) + "-" + captured;
  }

  function normalize(context, detail) {
    context = context || {};
    detail = detail || {};
    if (!isVatContext(context)) return null;
    var slug = context.toolSlug || context.toolId || detail.toolId || routeSlug();
    var tool = findTool(slug) || {};
    var now = new Date().toISOString();
    var capturedAt = context.capturedAt || detail.generatedAt || now;
    var fileName = detail.fileName || context.fileName || "";
    var title = detail.title || context.reportTitle || tool.name || "VAT & business tax report";
    var ref = detail.ref || context.ref || "";
    var user = context.user || {};
    var plan = getPlanState();
    return {
      id: buildId(context, detail),
      itemType: "vat-business-tax-report",
      toolSlug: slug,
      toolName: tool.name || String(slug || "VAT tool").replace(/-/g, " "),
      title: title,
      summary: [tool.name || "VAT tool", context.countryCode || detail.country || "", fileName ? "file " + fileName : "", ref ? "ref " + ref : ""].filter(Boolean).join(" | "),
      href: tool.href || window.location.pathname || "/vat-business-tax/",
      fileName: fileName,
      ref: ref,
      source: context.source || detail.source || "pdf-download-gate",
      status: detail.fileName || detail.ref ? "generated" : "download-unlocked",
      category: "vat-business-tax",
      countryCode: context.countryCode || detail.countryCode || "",
      currency: context.currency || detail.currency || "",
      planTier: plan.tier,
      planLabel: plan.label,
      pro: plan.pro,
      team: plan.team,
      gateCapturedAt: capturedAt,
      savedAt: now,
      updatedAt: now,
      gate: {
        source: context.source || "",
        useCase: context.useCase || "",
        company: user.company || "",
        role: user.role || ""
      },
      privacy: "Metadata only. Tax report PDFs, invoice line items, customer names, amounts, and raw files are not stored.",
      localOnly: !isSignedIn()
    };
  }

  function dispatch(detail) {
    try {
      window.dispatchEvent(new CustomEvent("afro-vat-business-tax-report-change", { detail: detail || {} }));
      window.dispatchEvent(new CustomEvent("afro-workspace-change", { detail: { itemType: "vat-business-tax-report", action: detail && detail.action || "save" } }));
    } catch (err) {}
  }

  function save(report) {
    var items = readJson(STORAGE_KEY, []);
    if (!Array.isArray(items)) items = [];
    var captured = timestamp(report.gateCapturedAt || report.savedAt);
    var index = -1;
    items.some(function(item, i) {
      if (!item) return false;
      if (item.id === report.id) {
        index = i;
        return true;
      }
      var sameTool = item.toolSlug === report.toolSlug;
      var sameRef = report.ref && item.ref === report.ref;
      var sameCaptured = report.gateCapturedAt && item.gateCapturedAt === report.gateCapturedAt;
      var close = Math.abs(timestamp(item.gateCapturedAt || item.savedAt) - captured) < 20000;
      if (sameTool && (sameRef || sameCaptured || close)) {
        index = i;
        return true;
      }
      return false;
    });
    if (index >= 0) {
      report = Object.assign({}, items[index], report, { savedAt: items[index].savedAt || report.savedAt, updatedAt: new Date().toISOString() });
      items.splice(index, 1);
    }
    items.unshift(report);
    writeJson(STORAGE_KEY, items.slice(0, 80));
    dispatch({ action: "save", item: report, count: Math.min(items.length, 80) });
    syncWorkspace(report);
    return report;
  }

  function ensureWorkspace() {
    if (window.AfroWorkspace && typeof window.AfroWorkspace.upsert === "function") return Promise.resolve(window.AfroWorkspace);
    return new Promise(function(resolve) {
      if (document.querySelector('script[src^="' + WORKSPACE_SRC.split("?")[0] + '"]')) {
        var tries = 0;
        (function wait() {
          tries += 1;
          if (window.AfroWorkspace && typeof window.AfroWorkspace.upsert === "function") return resolve(window.AfroWorkspace);
          if (tries > 40) return resolve(null);
          window.setTimeout(wait, 100);
        })();
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

  function syncWorkspace(report) {
    if (!report || !isSignedIn()) return Promise.resolve(false);
    return ensureWorkspace().then(function(workspace) {
      if (!(workspace && typeof workspace.upsert === "function" && workspace.isSignedIn && workspace.isSignedIn())) return false;
      return workspace.upsert({
        itemType: "vat-business-tax-report",
        itemKey: report.id,
        toolSlug: report.toolSlug,
        title: report.title,
        summary: report.summary,
        href: report.href,
        payload: {
          version: 1,
          fileName: report.fileName,
          ref: report.ref,
          source: report.source,
          status: report.status,
          countryCode: report.countryCode,
          currency: report.currency,
          planTier: report.planTier || "",
          planLabel: report.planLabel || "",
          pro: !!report.pro,
          team: !!report.team,
          gateCapturedAt: report.gateCapturedAt,
          savedAt: report.savedAt,
          privacy: report.privacy
        },
        meta: {
          category: "vat-business-tax",
          toolSlug: report.toolSlug,
          countryCode: report.countryCode || "",
          planTier: report.planTier || "",
          status: report.status
        }
      }).then(function() {
        report.localOnly = false;
        var items = readJson(STORAGE_KEY, []);
        if (Array.isArray(items)) {
          items = items.map(function(item) {
            return item && item.id === report.id ? Object.assign({}, item, { localOnly: false }) : item;
          });
          writeJson(STORAGE_KEY, items);
        }
        return true;
      }).catch(function(err) {
        console.warn("[VatBusinessTaxReportSync] Workspace sync failed:", err && err.message || err);
        return false;
      });
    });
  }

  function saveFromContext(context, detail) {
    var report = normalize(context || {}, detail || {});
    return report ? save(report) : null;
  }

  window.addEventListener("afro-pdf-gate-passed", function(event) {
    saveFromContext(event && event.detail || {}, {});
  });

  window.addEventListener("afro-pdf-generated", function(event) {
    var detail = event && event.detail || {};
    var context = detail.gateContext || readJson("afro_pdf_gate_context_v1", {}) || {};
    if (!context.category && detail.category) context.category = detail.category;
    if (!context.toolSlug && detail.toolId) context.toolSlug = detail.toolId;
    if (!context.countryCode && detail.countryCode) context.countryCode = detail.countryCode;
    saveFromContext(context, detail);
  });

  window.AfroVatBusinessTaxReports = {
    storageKey: STORAGE_KEY,
    getAll: function() {
      var items = readJson(STORAGE_KEY, []);
      return Array.isArray(items) ? items : [];
    },
    getPlanState: getPlanState,
    saveFromContext: saveFromContext,
    syncWorkspace: syncWorkspace
  };
}(window, document);

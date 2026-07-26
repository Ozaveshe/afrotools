(function () {
  "use strict";

  var PLAN_STORAGE_KEY = "afro_health_plans";
  var LOCAL_JSPDF_SRC = "/assets/vendor/jspdf/jspdf.umd.min.js";
  var loadedScripts = {};
  var state = { lastSnapshot: null };
  var journeys = {
    vitals: {
      title: "Vitals checkup",
      summary: "BMI, waist ratio, blood pressure, diabetes risk, and hydration in one reusable screening workflow.",
      toolIds: ["bmi-calculator", "waist-hip-ratio", "blood-pressure", "diabetes-risk", "water-intake"],
      href: "/health/bmi-calculator/",
      next: [
        "Record the same measurements again under similar conditions.",
        "Download a private PDF for a clinic or wellness conversation.",
        "Open the diabetes or blood-pressure tool if the current result needs follow-up.",
      ],
    },
    family: {
      title: "Pregnancy and child care plan",
      summary: "Due date, pregnancy nutrition, childbirth cost, vaccines, growth, and breastfeeding support in one family-health flow.",
      toolIds: ["due-date", "pregnancy-nutrition", "childbirth-cost", "vaccine-schedule", "child-growth", "breastfeeding-tracker"],
      href: "/health/pregnancy-due-date/",
      next: [
        "Confirm local antenatal and immunization schedules with a clinic.",
        "Keep dates, costs, and feeding notes on this device.",
        "Use the PDF as a visit-prep checklist, not a diagnosis.",
      ],
    },
    costs: {
      title: "Care cost planner",
      summary: "Hospital, clinic, pharmacy, dental, mental-health, and medical-travel estimates with quote-proof prompts.",
      toolIds: ["hospital-cost", "clinic-costs", "pharmacy-prices", "drug-price-compare", "dental-cost", "medical-tourism"],
      href: "/health/costs/",
      next: [
        "Replace defaults with real quotes before deciding.",
        "Save the plan with facility, date, currency, and source notes.",
        "Compare follow-up access and emergency support, not price only.",
      ],
    },
    clinical: {
      title: "Clinical safety checklist",
      summary: "Malaria, water safety, dosage verification, HIV, TB, cholera, Ebola, and Hepatitis B tools grouped for safer escalation.",
      toolIds: ["malaria-risk", "water-quality", "drug-dosage", "hiv-treatment-cost", "tb-tracker", "cholera-risk", "ebola-checklist", "hep-b-screening"],
      href: "/tools/malaria-risk/",
      next: [
        "Use local public-health advice as the authority.",
        "Document dates, symptoms, exposure, doses, and clinic instructions.",
        "Escalate quickly for severe symptoms or known outbreak exposure.",
      ],
    },
    labs: {
      title: "Labs and compatibility pack",
      summary: "Medical reports, genotype, blood group, and sickle-cell guidance as a private questions-for-clinic workflow.",
      toolIds: ["medical-report", "genotype-checker", "blood-group", "sickle-cell"],
      href: "/tools/medical-report/",
      next: [
        "Use verified lab records only.",
        "Save questions, not raw private reports, when possible.",
        "Bring the result to a clinician, lab, or genetic counsellor before acting.",
      ],
    },
    nutrition: {
      title: "Nutrition and activity plan",
      summary: "African-food calories, meal planning, home workouts, and gym costs combined into a weekly habit plan.",
      toolIds: ["calorie-counter", "african-meal-plan", "home-workout", "gym-cost-compare"],
      href: "/health/calorie-counter/",
      next: [
        "Choose foods and activity that fit the household routine.",
        "Review the plan weekly instead of chasing one perfect day.",
        "Pause exercise and seek care for chest pain, fainting, injury, or severe breathlessness.",
      ],
    },
  };

  function clean(value, fallback) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim() || fallback || "";
  }

  function clip(value, limit) {
    var result = clean(value, "");
    return limit && result.length > limit ? result.slice(0, limit).trim() + "..." : result;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safeHref(value) {
    var href = clean(value, "/health/");
    return href.charAt(0) === "/" || href.charAt(0) === "#" ? href : "/health/";
  }

  function findTool(toolId) {
    try {
      return typeof AFRO_TOOLS === "undefined"
        ? null
        : AFRO_TOOLS.find(function (tool) {
            return tool && tool.id === toolId;
          }) || null;
    } catch (_error) {
      return null;
    }
  }

  function readPlans() {
    try {
      var value = JSON.parse(localStorage.getItem(PLAN_STORAGE_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (_error) {
      return [];
    }
  }

  function writePlans(plans) {
    try {
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plans.slice(0, 40)));
      return true;
    } catch (_error) {
      return false;
    }
  }

  function loadScript(src) {
    if (loadedScripts[src]) return loadedScripts[src];
    loadedScripts[src] = new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing && window.jspdf && window.jspdf.jsPDF) {
        resolve();
        return;
      }
      var script = document.createElement("script");
      script.src = src;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return loadedScripts[src];
  }

  function toast(message, tone) {
    var node = document.getElementById("health-workflow-toast");
    if (!node) {
      node = document.createElement("div");
      node.id = "health-workflow-toast";
      node.className = "health-workflow-toast";
      node.setAttribute("role", "status");
      node.setAttribute("aria-live", "polite");
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.setAttribute("data-tone", tone || "info");
    node.classList.add("show");
    window.clearTimeout(toast._timer);
    toast._timer = window.setTimeout(function () {
      node.classList.remove("show");
    }, 3200);
  }

  function currentToolId() {
    if (window.HEALTH_TOOL_CONFIG && window.HEALTH_TOOL_CONFIG.id) return window.HEALTH_TOOL_CONFIG.id;
    var meta = document.querySelector('meta[name="tool-id"]');
    if (meta && meta.content) return meta.content;
    var marked = document.querySelector("[data-health-tool-id]");
    if (marked) return marked.getAttribute("data-health-tool-id");
    var match = location.pathname.match(/\/(?:tools|health)\/([^/]+)/);
    return match ? match[1] : "health";
  }

  function sanitizeSnapshot(snapshot, context) {
    snapshot = snapshot || {};
    context = context || {};
    var fields = [];
    (Array.isArray(snapshot.fields || snapshot.inputs) ? snapshot.fields || snapshot.inputs : [])
      .slice(0, 12)
      .forEach(function (field) {
        if (!field || typeof field !== "object") return;
        var label = clip(field.label || field.name || field.key || "", 60);
        var value = clip(field.value || field.text || field.result || "", 160);
        if (label && value) fields.push({ label: label, value: value });
      });
    var markers = [];
    (Array.isArray(snapshot.markers) ? snapshot.markers : []).slice(0, 24).forEach(function (marker) {
      if (!marker || typeof marker !== "object") return;
      var safe = {};
      ["marker", "key", "label", "value", "unit", "status", "category", "range"].forEach(function (key) {
        if (marker[key] != null && clip(marker[key], "")) safe[key] = clip(marker[key], 100);
      });
      if (Object.keys(safe).length) markers.push(safe);
    });
    var result = {
      toolId: clip(snapshot.toolId || context.id || "", 80),
      headline: clip(snapshot.headline || snapshot.summary || "", 180),
      resultText: clip(snapshot.resultText || snapshot.body || "", 700),
      fields: fields,
      markers: markers,
      clinicianQuestions: (Array.isArray(snapshot.clinicianQuestions) ? snapshot.clinicianQuestions : []).slice(0, 8).map(function (item) {
        return clip(item, 160);
      }).filter(Boolean),
      nextSteps: (Array.isArray(snapshot.nextSteps) ? snapshot.nextSteps : []).slice(0, 8).map(function (item) {
        return clip(item, 160);
      }).filter(Boolean),
      sourceNotes: (Array.isArray(snapshot.sourceNotes) ? snapshot.sourceNotes : []).slice(0, 6).map(function (item) {
        return clip(item, 180);
      }).filter(Boolean),
      generatedAt: clip(snapshot.generatedAt, "") || new Date().toISOString(),
      snapshotSource: "tool-owned",
      sensitivity: "health",
    };
    return result.headline || result.resultText || result.fields.length || result.markers.length ||
      result.clinicianQuestions.length || result.nextSteps.length || result.sourceNotes.length ? result : null;
  }

  function relatedTools(toolIds) {
    return (toolIds || []).map(function (toolId) {
      var tool = findTool(toolId);
      return tool ? { id: tool.id, name: tool.name, href: tool.href } : null;
    }).filter(Boolean);
  }

  function resolveContext(trigger) {
    var section = trigger && trigger.closest
      ? trigger.closest(".health-action-kit, [data-health-source-name]")
      : null;
    if (!section && trigger && trigger.closest) section = trigger.closest("section[data-health-tool-id]");
    if (!section) {
      section = document.querySelector('[data-health-tool-id="' + currentToolId() + '"]') ||
        document.querySelector("[data-health-tool-id]");
    }
    var toolId = trigger && trigger.getAttribute && trigger.getAttribute("data-health-tool-id") ||
      section && section.getAttribute("data-health-tool-id") || currentToolId();
    var registryTool = findTool(toolId) || {};
    return {
      id: toolId,
      name: clean(section && section.getAttribute("data-health-tool-name") || registryTool.name ||
        document.querySelector("h1") && document.querySelector("h1").textContent, "Health tool"),
      href: safeHref(section && section.getAttribute("data-health-href") || registryTool.href || location.pathname),
      bucket: clean(section && section.getAttribute("data-health-bucket"), "health"),
      sourceName: clean(section && section.getAttribute("data-health-source-name"), "Health source"),
      sourceUrl: clean(section && section.getAttribute("data-health-source-url"), ""),
      competitor: clean(section && section.getAttribute("data-health-competitor"), ""),
      feature: clean(section && section.getAttribute("data-health-feature"), ""),
      journey: clean(trigger && trigger.getAttribute && trigger.getAttribute("data-health-journey") ||
        section && section.getAttribute("data-health-journey"), ""),
    };
  }

  function workflowShell(context) {
    return {
      toolId: context.id,
      headline: "No tool-owned snapshot available yet",
      resultText: "Saved workflow shell only. Use the tool first to save a result snapshot; AfroTools did not capture form fields or pasted text automatically.",
      fields: [{ label: "Saved content", value: "Workflow shell only; no form fields captured" }],
      markers: [],
      clinicianQuestions: [],
      nextSteps: [],
      sourceNotes: [],
      generatedAt: new Date().toISOString(),
      snapshotSource: "workflow-shell",
      sensitivity: "health",
    };
  }

  function buildPlan(trigger, options) {
    options = options || {};
    var context = resolveContext(trigger);
    var journeyKey = options.journey || context.journey || context.bucket;
    var journey = journeys[journeyKey] || null;
    var snapshot = null;
    if (state.lastSnapshot && (!state.lastSnapshot.toolId || state.lastSnapshot.toolId === context.id)) {
      snapshot = sanitizeSnapshot(state.lastSnapshot, context);
    }
    if (!snapshot) snapshot = workflowShell(context);
    var savedAt = new Date().toISOString();
    return {
      id: "health-plan-" + context.id + "-" + Date.now(),
      type: "health-plan",
      title: journey && options.mode === "journey" ? journey.title : context.name + " plan",
      summary: snapshot.headline || (journey ? journey.summary : "Health workflow from AfroTools."),
      toolId: context.id,
      toolName: context.name,
      href: context.href,
      bucket: context.bucket,
      sourceName: context.sourceName,
      sourceUrl: context.sourceUrl,
      competitor: context.competitor,
      feature: context.feature,
      journeyKey: journey ? journeyKey : "",
      journey: journey,
      related: journey ? relatedTools(journey.toolIds) : [],
      snapshot: snapshot,
      inputs: snapshot.fields || [],
      savedAt: savedAt,
      syncStatus: "device",
    };
  }

  function track(action, plan, success) {
    try {
      if (window.AfroTools && window.AfroTools.analytics &&
          typeof window.AfroTools.analytics.track === "function") {
        window.AfroTools.analytics.track("health_workflow_action", {
          tool_slug: clip(plan && plan.toolId || "health", 80),
          journey_key: clip(plan && plan.journeyKey || "", 80),
          action: action,
          snapshot_source: plan && plan.snapshot && plan.snapshot.snapshotSource || "workflow-shell",
          success: Boolean(success),
        });
      }
    } catch (_error) {}
  }

  function savePlanToDevice(plan) {
    if (!plan || typeof plan !== "object") return false;
    var plans = readPlans().filter(function (item) {
      return item && item.id !== plan.id;
    });
    plans.unshift(plan);
    var saved = writePlans(plans);
    if (saved) {
      try {
        window.dispatchEvent(new CustomEvent("afro-workspace-change", {
          detail: { action: "health-plan-save", itemType: "health-plan", count: plans.length },
        }));
      } catch (_error) {}
      toast("Saved privately on this device.", "success");
    } else {
      toast("This browser could not save the Health plan.", "warn");
    }
    track("device_save", plan, saved);
    return saved;
  }

  function addWrappedText(doc, text, x, y, width, lineHeight) {
    var lines = doc.splitTextToSize(clean(text, ""), width);
    doc.text(lines, x, y);
    return y + Math.max(1, lines.length) * lineHeight;
  }

  function getJsPdf() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
    return loadScript(LOCAL_JSPDF_SRC).then(function () {
      if (!window.jspdf || !window.jspdf.jsPDF) throw new Error("Local PDF library unavailable");
      return window.jspdf.jsPDF;
    });
  }

  function createDownload(blob, filename) {
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.hidden = true;
    anchor.setAttribute("data-no-pdf-gate", "true");
    anchor.setAttribute("data-no-gate", "true");
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 0);
  }

  function downloadPlanPdf(plan) {
    return getJsPdf().then(function (JsPdf) {
      var doc = new JsPdf({ unit: "pt", format: "a4" });
      var left = 44;
      var y = 48;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      y = addWrappedText(doc, plan.title || "AfroTools Health Plan", left, y, 500, 20) + 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Generated locally by AfroTools on " + new Date(plan.savedAt || Date.now()).toLocaleString(), left, y);
      y += 24;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Summary", left, y);
      doc.setFont("helvetica", "normal");
      y = addWrappedText(doc, plan.summary || "Health workflow.", left, y + 18, 500, 15) + 10;
      if (plan.inputs && plan.inputs.length) {
        doc.setFont("helvetica", "bold");
        doc.text("Inputs included in this local PDF", left, y);
        doc.setFont("helvetica", "normal");
        y += 18;
        plan.inputs.slice(0, 10).forEach(function (input) {
          y = addWrappedText(doc, input.label + ": " + input.value, left, y, 500, 14);
        });
        y += 8;
      }
      if (plan.journey && plan.journey.next) {
        doc.setFont("helvetica", "bold");
        doc.text("Next steps", left, y);
        doc.setFont("helvetica", "normal");
        y += 18;
        plan.journey.next.forEach(function (step, index) {
          y = addWrappedText(doc, index + 1 + ". " + step, left, y, 500, 14);
        });
      }
      doc.setFontSize(9);
      doc.setTextColor(90, 99, 112);
      addWrappedText(doc, "Medical disclaimer: This PDF is for planning and record keeping only. It does not replace professional medical advice, diagnosis, treatment, public-health guidance, or emergency care.", left, 770, 500, 12);
      var filename = "afrotools-health-" + (plan.toolId || "plan") + "-" +
        new Date().toISOString().slice(0, 10) + ".pdf";
      createDownload(doc.output("blob"), filename);
      toast("PDF downloaded to this device.", "success");
      track("pdf_local", plan, true);
      return { success: true, filename: filename };
    }).catch(function (error) {
      toast("PDF export is unavailable. Your result remains on this page and was not uploaded.", "warn");
      track("pdf_local", plan, false);
      return { success: false, error: error };
    });
  }

  function metadataOnlySyncPayload(plan) {
    return {
      itemType: "health-plan",
      itemKey: plan.id,
      toolSlug: plan.toolId || "health",
      title: clip(plan.title || "Health plan", 120),
      summary: "Health plan saved on this device.",
      href: safeHref(plan.href || "/health/"),
      payload: {
        type: "health-plan",
        toolId: clip(plan.toolId || "health", 80),
        href: safeHref(plan.href || "/health/"),
        savedAt: plan.savedAt,
        sourceLabel: "health-workflow-metadata",
      },
      meta: { category: "health", source: "health-workflow-metadata" },
    };
  }

  function syncPlanToAccount(plan, consent) {
    if (consent !== true) return Promise.resolve({ synced: false, reason: "consent-required" });
    track("account_sync_requested", plan, true);
    if (!window.AfroWorkspace || typeof window.AfroWorkspace.upsert !== "function" ||
        typeof window.AfroWorkspace.isSignedIn !== "function" || !window.AfroWorkspace.isSignedIn()) {
      toast("Sign in before using optional account sync. Your local plan is unchanged.", "warn");
      return Promise.resolve({ synced: false, reason: "signin" });
    }
    return window.AfroWorkspace.upsert(metadataOnlySyncPayload(plan)).then(function () {
      toast("Non-clinical plan metadata saved to your account. Health values stayed on this device.", "success");
      track("account_sync_completed", plan, true);
      return { synced: true };
    }).catch(function (error) {
      toast("Account sync failed. Your local plan is unchanged.", "warn");
      track("account_sync_completed", plan, false);
      return { synced: false, reason: "network", error: error };
    });
  }

  function requestAccountSync(plan) {
    var accepted = typeof window.confirm === "function" && window.confirm(
      "Optional account sync\n\n" +
      "Health measurements, results, clinician questions and PDF content will stay on this device. " +
      "Only the tool name, route, title, saved time and a non-clinical summary will be sent to your AfroTools account workspace.\n\n" +
      "Continue with metadata-only account sync?"
    );
    return syncPlanToAccount(plan, accepted);
  }

  function captureHealthEmailOptIn(details) {
    details = details || {};
    if (details.consent !== true || !/@/.test(clean(details.email, ""))) {
      return Promise.resolve({ captured: false, reason: "consent-required" });
    }
    var payload = {
      email: clean(details.email, ""),
      name: clean(details.name, ""),
      source: "health-updates-opt-in",
      toolSlug: clip(details.toolSlug || currentToolId(), 80),
      optInDigest: true,
      countryCode: clean(details.country, "").toUpperCase().slice(0, 2),
      pageUrl: location.origin + location.pathname,
      referrerUrl: "",
      deviceType: window.innerWidth < 720 ? "mobile" : "desktop",
      industry: "Healthcare",
      conversionValue: 0,
    };
    return fetch("/api/capture-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(function () {
      track("email_opt_in", { toolId: payload.toolSlug, snapshot: { snapshotSource: "none" } }, true);
      return { captured: true };
    }).catch(function (error) {
      track("email_opt_in", { toolId: payload.toolSlug, snapshot: { snapshotSource: "none" } }, false);
      return { captured: false, reason: "network", error: error };
    });
  }

  function renderJourneyBuilder() {
    var root = document.getElementById("health-workflow-builder");
    if (!root) return;
    root.innerHTML = '<div class="health-journey-grid">' + Object.keys(journeys).map(function (key) {
      var journey = journeys[key];
      return '<article class="health-journey-card">' +
        '<div class="health-journey-card-head"><span>' + journey.toolIds.length + ' tools</span><strong>' +
        escapeHtml(journey.title) + '</strong></div><p>' + escapeHtml(journey.summary) + '</p>' +
        '<div class="health-journey-tools">' + relatedTools(journey.toolIds).slice(0, 4).map(function (tool) {
          return '<a href="' + escapeHtml(safeHref(tool.href)) + '">' + escapeHtml(tool.name) + '</a>';
        }).join("") + '</div><div class="health-action-buttons">' +
        '<a class="health-workflow-btn" href="' + escapeHtml(safeHref(journey.href)) + '">Start workflow</a>' +
        '<button type="button" class="health-workflow-btn secondary" data-health-action="save-journey" data-health-journey="' +
        escapeHtml(key) + '">Save on this device</button>' +
        '<button type="button" class="health-workflow-btn ghost" data-health-action="pdf-journey" data-health-journey="' +
        escapeHtml(key) + '">Download PDF</button></div></article>';
    }).join("") + "</div>";
  }

  function handleAction(event) {
    var trigger = event.target.closest && event.target.closest("[data-health-action]");
    if (!trigger) return;
    var action = trigger.getAttribute("data-health-action");
    var journey = trigger.getAttribute("data-health-journey");
    var options = journey ? { mode: "journey", journey: journey } : {};
    if (["save", "save-journey", "pdf", "pdf-journey", "sync", "sync-journey"].indexOf(action) === -1) return;
    event.preventDefault();
    var plan = buildPlan(trigger, options);
    if (action === "save" || action === "save-journey") savePlanToDevice(plan);
    if (action === "pdf" || action === "pdf-journey") downloadPlanPdf(plan);
    if (action === "sync" || action === "sync-journey") requestAccountSync(plan);
  }

  function init() {
    renderJourneyBuilder();
    document.addEventListener("click", handleAction);
  }

  window.AfroHealthWorkflow = {
    getPlans: readPlans,
    buildPlan: buildPlan,
    savePlanToDevice: savePlanToDevice,
    savePlan: function (trigger, options) {
      var plan = buildPlan(trigger, options);
      savePlanToDevice(plan);
      return plan;
    },
    downloadPlanPdf: downloadPlanPdf,
    syncPlanToAccount: syncPlanToAccount,
    captureHealthEmailOptIn: captureHealthEmailOptIn,
    recordSnapshot: function (snapshot) {
      var sanitized = sanitizeSnapshot(snapshot || {}, {});
      state.lastSnapshot = sanitized;
      return state.lastSnapshot;
    },
    clearSnapshot: function () {
      state.lastSnapshot = null;
    },
    journeys: journeys,
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

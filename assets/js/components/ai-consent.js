(function initAfroToolsAIConsent(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(typeof globalThis !== "undefined" ? globalThis : {});
  } else {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.AIConsent = factory(root);
  }
})(typeof window !== "undefined" ? window : this, function createAfroToolsAIConsent(root) {
  "use strict";

  var LEGACY_KEY = "afrotools_ai_advisor_consent";
  var CONSENT_PREFIX = "afrotools_ai_consent_";
  var EVENT_KEY = "afrotools_ai_consent_events";
  var ACCEPTED = "accepted";
  var MAX_EVENTS = 30;

  var MODES = {
    browser_local_only: {
      title: "Browser-local workflow",
      copy: "This workflow runs in your browser. AfroTools does not need to send this content to an AI model.",
      sends: "Nothing is sent to a model.",
      button: "Continue locally",
      requiresConsent: false,
    },
    ai_optional_prompt_only: {
      title: "Optional AI assist",
      copy: "AfroTools can use AI for this step only after you choose it. Send prompts only; avoid private documents, CVs, PDFs, financial records, profile data, or identifiers.",
      sends: "Your current prompt may be sent to AfroTools servers and a configured model provider.",
      button: "Use AI assist",
      requiresConsent: true,
    },
    ai_optional_content_included: {
      title: "AI assist with private content",
      copy: "This action may include document, CV, profile, education, legal, or financial content. Review it first and continue only if you want that content sent for AI help.",
      sends: "Selected private content may be sent to AfroTools servers and a configured model provider.",
      button: "Allow AI with this content",
      requiresConsent: true,
      contentIncluded: true,
    },
    account_sync_optional: {
      title: "Optional account sync",
      copy: "You can keep working locally, or sign in to sync selected metadata and saved items. Account sync is separate from AI consent.",
      sends: "Only the fields you choose to save or sync are sent to AfroTools account services.",
      button: "Continue with sync",
      requiresConsent: true,
    },
    sponsor_lead_opt_in: {
      title: "Optional partner handoff",
      copy: "Sponsor or partner follow-up is separate from AI consent. AfroTools calculations and recommendations stay independent of sponsor placement.",
      sends: "Contact details are sent only if you explicitly opt in to the handoff.",
      button: "Opt in to handoff",
      requiresConsent: true,
    },
  };

  var SENSITIVE_KEYS = [
    "cvText",
    "resumeText",
    "coverLetterText",
    "jobDescription",
    "documentContent",
    "documentText",
    "pdfText",
    "fileText",
    "profileData",
    "educationProfile",
    "financialData",
    "legalFacts",
    "healthData",
    "personalProfile",
  ];

  function getStorage() {
    try {
      return root.localStorage || null;
    } catch (err) {
      return null;
    }
  }

  function getSessionStorage() {
    try {
      return root.sessionStorage || null;
    } catch (err) {
      return null;
    }
  }

  function safeText(value) {
    return String(value || "").replace(/[&<>"']/g, function escape(match) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[match];
    });
  }

  function normalizeMode(mode) {
    return MODES[mode] ? mode : "ai_optional_prompt_only";
  }

  function consentKey(mode, toolId) {
    return CONSENT_PREFIX + normalizeMode(mode) + "_" + String(toolId || "global").replace(/[^a-z0-9_-]/gi, "-");
  }

  function getModeConfig(mode) {
    var key = normalizeMode(mode);
    return Object.assign({ mode: key }, MODES[key]);
  }

  function hasConsent(mode, toolId) {
    var storage = getStorage();
    if (!storage) return false;
    if (!mode || mode === "ai_optional_prompt_only") {
      return storage.getItem(LEGACY_KEY) === ACCEPTED || storage.getItem(consentKey("ai_optional_prompt_only", toolId)) === ACCEPTED;
    }
    return storage.getItem(consentKey(mode, toolId)) === ACCEPTED;
  }

  function reset(mode, toolId) {
    var storage = getStorage();
    if (!storage) return;
    if (!mode) {
      storage.removeItem(LEGACY_KEY);
      Object.keys(MODES).forEach(function removeMode(key) {
        storage.removeItem(consentKey(key, toolId));
      });
      return;
    }
    storage.removeItem(consentKey(mode, toolId));
    if (mode === "ai_optional_prompt_only") storage.removeItem(LEGACY_KEY);
  }

  function queryLengthBucket(length) {
    var n = Number(length || 0);
    if (n <= 0) return "0";
    if (n <= 20) return "1-20";
    if (n <= 60) return "21-60";
    if (n <= 140) return "61-140";
    if (n <= 280) return "141-280";
    return "281+";
  }

  function recordConsent(meta) {
    var clean = {
      mode: normalizeMode(meta && meta.mode),
      tool_id: String(meta && meta.toolId || meta && meta.tool_id || "unknown").slice(0, 80),
      action: String(meta && meta.action || "unknown").slice(0, 80),
      consented: Boolean(meta && meta.consented),
      content_included: Boolean(meta && meta.contentIncluded),
      account_sync: Boolean(meta && meta.accountSync),
      sponsor_lead_opt_in: Boolean(meta && meta.sponsorLeadOptIn),
      query_length_bucket: queryLengthBucket(meta && meta.queryLength),
      created_at: new Date().toISOString(),
    };

    var session = getSessionStorage();
    if (session) {
      try {
        var events = JSON.parse(session.getItem(EVENT_KEY) || "[]");
        if (!Array.isArray(events)) events = [];
        events.push(clean);
        session.setItem(EVENT_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
      } catch (err) {
        /* Ignore storage failures. Consent still works in memory for this action. */
      }
    }

    if (root.AfroTools && root.AfroTools.analytics && typeof root.AfroTools.analytics.track === "function") {
      root.AfroTools.analytics.track(clean.consented ? "ai_consent_accepted" : "ai_consent_declined", clean);
    } else if (typeof root.gtag === "function") {
      root.gtag("event", clean.consented ? "ai_consent_accepted" : "ai_consent_declined", clean);
    }
    return clean;
  }

  function persistAccepted(mode, toolId) {
    var storage = getStorage();
    if (!storage) return;
    storage.setItem(consentKey(mode, toolId), ACCEPTED);
    if (mode === "ai_optional_prompt_only") storage.setItem(LEGACY_KEY, ACCEPTED);
  }

  function requestCopy(config) {
    return [
      config.title,
      config.copy,
      config.sends,
      "Continue?",
    ].join("\n\n");
  }

  function ensureConsent(options) {
    var opts = options || {};
    var mode = normalizeMode(opts.mode);
    var config = getModeConfig(mode);
    var toolId = opts.toolId || opts.tool_id || "global";
    if (!config.requiresConsent) {
      recordConsent(Object.assign({}, opts, { mode: mode, toolId: toolId, consented: true }));
      return true;
    }
    if (!opts.requireFresh && hasConsent(mode, toolId)) return true;
    if (typeof root.confirm !== "function") return false;
    var accepted = root.confirm(requestCopy(config));
    recordConsent(Object.assign({}, opts, { mode: mode, toolId: toolId, consented: accepted, contentIncluded: config.contentIncluded || opts.contentIncluded }));
    if (accepted) persistAccepted(mode, toolId);
    return accepted;
  }

  function containsSensitivePayload(value, depth) {
    if (!value || depth > 4) return false;
    if (Array.isArray(value)) {
      return value.some(function scanArray(item) {
        return containsSensitivePayload(item, depth + 1);
      });
    }
    if (typeof value !== "object") return false;
    return Object.keys(value).some(function scanKey(key) {
      if (SENSITIVE_KEYS.indexOf(key) !== -1) return true;
      return containsSensitivePayload(value[key], depth + 1);
    });
  }

  function parseRequestBody(init) {
    if (!init || !init.body || typeof init.body !== "string") return null;
    try {
      return JSON.parse(init.body);
    } catch (err) {
      return null;
    }
  }

  function isAiAdvisorRequest(input) {
    var url = "";
    if (typeof input === "string") url = input;
    else if (input && typeof input.url === "string") url = input.url;
    return url.indexOf("/.netlify/functions/ai-advisor") !== -1 || url.indexOf("/api/ai-advisor") !== -1;
  }

  function withConsentHeaders(input, init, contentIncluded) {
    var nextInit = Object.assign({}, init || {});
    var originalHeaders = nextInit.headers || (input && typeof input !== "string" ? input.headers : undefined);
    var headers = new Headers(originalHeaders || {});
    headers.set("x-afrotools-ai-consent", ACCEPTED);
    if (contentIncluded) headers.set("x-afrotools-ai-content-consent", ACCEPTED);
    nextInit.headers = headers;
    if (input && typeof input !== "string" && typeof Request !== "undefined" && input instanceof Request) {
      return [new Request(input, nextInit)];
    }
    return [input, nextInit];
  }

  function consentRequiredResponse(error, reply) {
    return Promise.resolve(new Response(JSON.stringify({ error: error, reply: reply, text: reply }), {
      status: 428,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    }));
  }

  function wrapFetch() {
    if (!root || root.AfroTools.aiConsentFetchWrapped || typeof root.fetch !== "function") return;
    var originalFetch = root.fetch.bind(root);
    root.fetch = function afroToolsConsentFetch(input, init) {
      if (!isAiAdvisorRequest(input)) return originalFetch(input, init);
      var body = parseRequestBody(init);
      var contentIncluded = containsSensitivePayload(body, 0);
      var mode = contentIncluded ? "ai_optional_content_included" : "ai_optional_prompt_only";
      var toolId = body && body.tool || "ai-advisor";
      var allowed = ensureConsent({
        mode: mode,
        toolId: toolId,
        action: "ai-advisor",
        contentIncluded: contentIncluded,
      });
      if (!allowed) {
        return consentRequiredResponse(
          contentIncluded ? "ai_content_consent_required" : "ai_consent_required",
          contentIncluded
            ? "AI Advisor was not contacted. This action includes private content and needs explicit AI content consent."
            : "AI Advisor was not contacted. Review the AI data notice and continue only if you agree."
        );
      }
      return originalFetch.apply(root, withConsentHeaders(input, init, contentIncluded));
    };
    root.AfroTools.aiConsentFetchWrapped = true;
  }

  function injectStyles() {
    if (!root.document || root.document.getElementById("afrotools-ai-consent-style")) return;
    var style = root.document.createElement("style");
    style.id = "afrotools-ai-consent-style";
    style.textContent = [
      ".ai-consent-notice{border:1px solid #c7d2fe;border-radius:12px;background:#f8fbff;color:#334155;padding:12px 14px;display:grid;gap:8px;font-family:inherit}",
      ".ai-consent-notice[data-consent-mode='browser_local_only']{border-color:#bbf7d0;background:#f0fdf4}",
      ".ai-consent-notice h3{margin:0;color:#0f172a;font-size:.92rem;line-height:1.25}",
      ".ai-consent-notice p{margin:0;color:#475569;font-size:.8rem;line-height:1.5}",
      ".ai-consent-notice strong{color:#0f172a}",
      ".ai-consent-actions{display:flex;flex-wrap:wrap;gap:8px}",
      ".ai-consent-actions button,.ai-consent-actions a{display:inline-flex;align-items:center;justify-content:center;min-height:38px;border-radius:10px;border:1px solid #c7d2fe;background:#fff;color:#0057b8;font:inherit;font-size:.78rem;font-weight:900;padding:0 12px;text-decoration:none;cursor:pointer}",
      ".ai-consent-actions button[data-ai-consent-accept]{background:#0057b8;border-color:#0057b8;color:#fff}",
      "@media(max-width:700px){.ai-consent-actions{display:grid}.ai-consent-actions button,.ai-consent-actions a{width:100%}}",
    ].join("");
    root.document.head.appendChild(style);
  }

  function renderNotice(container, options) {
    if (!container) return null;
    injectStyles();
    var opts = options || {};
    var mode = normalizeMode(opts.mode || container.getAttribute("data-consent-mode"));
    var config = getModeConfig(mode);
    var toolId = opts.toolId || container.getAttribute("data-tool-id") || "global";
    var action = opts.action || container.getAttribute("data-consent-action") || config.button;
    var showAction = opts.showAction === true || container.getAttribute("data-consent-action-button") === "true";
    var continueHref = opts.continueHref || container.getAttribute("data-continue-href") || "";
    container.classList.add("ai-consent-notice");
    container.setAttribute("data-ai-consent-notice", "");
    container.setAttribute("data-consent-mode", mode);
    container.innerHTML = [
      "<h3>" + safeText(opts.title || container.getAttribute("data-consent-title") || config.title) + "</h3>",
      "<p>" + safeText(opts.copy || container.getAttribute("data-consent-copy") || config.copy) + "</p>",
      "<p><strong>What may be sent:</strong> " + safeText(opts.sends || config.sends) + "</p>",
      showAction ? '<div class="ai-consent-actions"><button type="button" data-ai-consent-accept>' + safeText(action) + '</button>' + (continueHref ? '<a href="' + safeText(continueHref) + '" data-ai-consent-decline>Continue without AI</a>' : '<button type="button" data-ai-consent-decline>Continue without AI</button>') + "</div>" : "",
    ].join("");
    var accept = container.querySelector("[data-ai-consent-accept]");
    var decline = container.querySelector("[data-ai-consent-decline]");
    if (accept) {
      accept.addEventListener("click", function onAccept() {
        persistAccepted(mode, toolId);
        recordConsent({ mode: mode, toolId: toolId, action: action, consented: true, contentIncluded: config.contentIncluded });
        container.dispatchEvent(new CustomEvent("afrotools:ai-consent-accepted", { bubbles: true, detail: { mode: mode, toolId: toolId } }));
      });
    }
    if (decline) {
      decline.addEventListener("click", function onDecline() {
        recordConsent({ mode: mode, toolId: toolId, action: action, consented: false, contentIncluded: config.contentIncluded });
        container.dispatchEvent(new CustomEvent("afrotools:ai-consent-declined", { bubbles: true, detail: { mode: mode, toolId: toolId } }));
      });
    }
    return container;
  }

  function enhanceAll() {
    if (!root.document) return;
    Array.prototype.forEach.call(root.document.querySelectorAll("[data-ai-consent-notice]"), function enhance(node) {
      if (node.getAttribute("data-ai-consent-enhanced") === "true") return;
      node.setAttribute("data-ai-consent-enhanced", "true");
      renderNotice(node, {});
    });
  }

  if (root.document) {
    if (root.document.readyState === "loading") {
      root.document.addEventListener("DOMContentLoaded", enhanceAll, { once: true });
    } else {
      enhanceAll();
    }
  }

  wrapFetch();

  return {
    MODES: MODES,
    getModeConfig: getModeConfig,
    hasConsent: hasConsent,
    reset: reset,
    recordConsent: recordConsent,
    ensureConsent: ensureConsent,
    renderNotice: renderNotice,
    enhanceAll: enhanceAll,
    containsSensitivePayload: function publicContainsSensitivePayload(value) {
      return containsSensitivePayload(value, 0);
    },
  };
});

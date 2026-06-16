/**
 * Shared guardrails for AfroTools AI surfaces.
 *
 * These checks are deterministic application controls. They do not rely on a
 * model to police its own inputs or outputs.
 */
(function initAfroToolsAIGuardrails(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.AfroToolsAIGuardrails = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createAfroToolsAIGuardrails() {
  "use strict";

  var DEFAULT_PROMPT_LIMIT = 12000;
  var ROUTER_PROMPT_LIMIT = 1200;
  var ADVISOR_PROMPT_LIMIT = 30000;

  var HIGH_STAKES_DOMAINS = {
    tax: "Planning estimate only. Confirm tax, PAYE, VAT, filing, and compliance decisions with official revenue authority guidance or a qualified professional.",
    immigration: "Planning estimate only. Confirm visa, immigration, and relocation decisions with official government sources or a qualified adviser.",
    legal: "Planning estimate only. This is not legal advice; confirm with official sources or a qualified legal professional.",
    health: "Informational only. Do not use this as medical advice; consult a qualified health professional.",
    finance: "Planning estimate only. Confirm financial, customs, lending, investment, crypto, and business decisions with official sources or a qualified professional.",
    employment: "Planning support only. Review employment, hiring, salary, and application decisions with qualified local guidance where needed.",
    education: "Planning estimate only. Confirm eligibility, fees, deadlines, admissions, and scholarship details with official school or scholarship sources.",
    energy: "Planning estimate only. Confirm tariffs, fuel prices, installation sizing, and safety requirements with current local suppliers or qualified installers.",
    construction: "Planning estimate only. Confirm drawings, quantities, codes, and structural decisions with qualified building professionals.",
    none: "",
  };

  var BLOCK_PATTERNS = [
    {
      code: "system_bypass",
      reason: "System-bypass instruction detected.",
      pattern: /\b(ignore|disregard|forget|override|bypass)\b[\s\S]{0,80}\b(previous|prior|above|system|developer|safety|guardrail|instruction|rules?)\b/i,
    },
    {
      code: "system_prompt_extraction",
      reason: "Request to reveal hidden instructions detected.",
      pattern: /\b(show|print|repeat|reveal|dump|expose|send|display)\b[\s\S]{0,80}\b(system prompt|developer message|hidden instructions|initial instructions|internal prompt|policy)\b/i,
    },
    {
      code: "disclaimer_bypass",
      reason: "Request to bypass high-stakes warnings detected.",
      pattern: /\b(do not|don't|without|remove|omit|skip|hide)\b[\s\S]{0,80}\b(disclaimer|warning|caveat|planning estimate|verify|official source|professional)\b/i,
    },
    {
      code: "formula_tampering",
      reason: "Request to alter formulas, rates, or official assumptions detected.",
      pattern: /\b(change|alter|modify|fake|override|force|pretend)\b[\s\S]{0,90}\b(formula|tax band|tax rate|vat rate|duty rate|fx rate|fuel price|source confidence|confidence|freshness)\b/i,
    },
    {
      code: "official_impersonation",
      reason: "Request to impersonate an official authority detected.",
      pattern: /\b(impersonate|act as|pretend to be|write as|issue as)\b[\s\S]{0,90}\b(revenue authority|customs|immigration officer|embassy|government|regulator|tax authority|official)\b/i,
    },
    {
      code: "source_fabrication",
      reason: "Request to fabricate sources or official links detected.",
      pattern: /\b(invent|fabricate|make up|create|pretend|fake)\b[\s\S]{0,90}\b(source|citation|official link|official url|url|gazette|authority|regulator|customs|revenue)\b/i,
    },
    {
      code: "tool_abuse",
      reason: "Tool-abuse or approval-bypass instruction detected.",
      pattern: /\b(call|invoke|run|execute|use)\b[\s\S]{0,80}\b(delete|overwrite|exfiltrate|send email|bypass approval|skip approval|admin tool|secret|environment variable|api key)\b/i,
    },
  ];

  var OUT_OF_SCOPE_PATTERNS = [
    /\b(write|build|create|generate)\b[\s\S]{0,80}\b(malware|ransomware|phishing kit|credential stealer|keylogger|exploit)\b/i,
    /\b(help me|show me|teach me)\b[\s\S]{0,80}\b(evade taxes|forge|counterfeit|falsify|bribe|launder money)\b/i,
  ];

  var IMPOSSIBLE_DATA_PATTERNS = [
    /\b(guarantee|guaranteed|certain)\b[\s\S]{0,80}\b(visa approval|scholarship approval|customs assessment|loan approval|job offer)\b/i,
    /\b(exact|official|live|current)\b[\s\S]{0,80}\b(tomorrow|next year|future)\b[\s\S]{0,80}\b(rate|price|fx|fuel|tax|duty)\b/i,
  ];

  var TOOL_DOMAIN_HINTS = [
    [/paye|tax|vat|withholding|salary|payroll|ssnit|nssf|uif|pension|compliance|invoice|staff-cost|minimum-wage|overtime/i, "tax"],
    [/japa|visa|immigration|relocat|passport/i, "immigration"],
    [/legal|contract|tenancy|labour-law|nda|agreement|document-generator|regulatory/i, "legal"],
    [/medical|health|malaria|sickle|vaccine|hospital|blood|bmi|diabetes/i, "health"],
    [/import|customs|duty|car-import|landed|crypto|investment|loan|mortgage|property|bank|finance|business|profit|cashflow/i, "finance"],
    [/cv|cover-letter|career|job|linkedin|employment/i, "employment"],
    [/scholar|study|gpa|ielts|jamb|admission|university|education/i, "education"],
    [/solar|fuel|generator|energy|electric|tariff|inverter|battery/i, "energy"],
    [/floor|construction|boq|renovation|building|roof|paint|structural/i, "construction"],
  ];

  function text(value) {
    if (value === null || value === undefined) return "";
    return String(value);
  }

  function messageText(message) {
    if (!message) return "";
    if (typeof message === "string") return message;
    if (typeof message.content === "string") return message.content;
    if (Array.isArray(message.content)) {
      return message.content.map(function (block) {
        return block && typeof block.text === "string" ? block.text : "";
      }).join("\n");
    }
    return "";
  }

  function messagesText(messages) {
    if (!Array.isArray(messages)) return "";
    return messages.map(messageText).join("\n");
  }

  function requestText(input) {
    if (typeof input === "string") return input;
    if (!input || typeof input !== "object") return "";
    return [
      input.query,
      input.message,
      input.context,
      input.system,
      messagesText(input.messages),
    ].map(text).filter(Boolean).join("\n");
  }

  function blockedResponse(code, reason) {
    return {
      allowed: false,
      code: code,
      reason: reason,
      userMessage: "AfroTools AI cannot follow instructions that bypass safety rules, alter formulas, impersonate authorities, fabricate sources, or move outside AfroTools workflows. Use the calculators and official-source notes for planning estimates.",
    };
  }

  function inspectPrompt(input, options) {
    var opts = options || {};
    var prompt = requestText(input);
    var limit = Number(opts.maxChars || DEFAULT_PROMPT_LIMIT);
    if (Number.isFinite(limit) && limit > 0 && prompt.length > limit) {
      return blockedResponse("prompt_too_large", "Prompt exceeds the maximum supported size.");
    }

    for (var i = 0; i < BLOCK_PATTERNS.length; i += 1) {
      var match = prompt.match(BLOCK_PATTERNS[i].pattern);
      if (match && BLOCK_PATTERNS[i].code === "source_fabrication") {
        var before = prompt.slice(Math.max(0, match.index - 24), match.index).toLowerCase();
        if (/\b(do not|don't|never|avoid)\s+$/.test(before)) continue;
      }
      if (match) {
        return blockedResponse(BLOCK_PATTERNS[i].code, BLOCK_PATTERNS[i].reason);
      }
    }
    for (var j = 0; j < OUT_OF_SCOPE_PATTERNS.length; j += 1) {
      if (OUT_OF_SCOPE_PATTERNS[j].test(prompt)) {
        return blockedResponse("outside_afrotools_scope", "Request is outside AfroTools planning and calculator scope.");
      }
    }
    for (var k = 0; k < IMPOSSIBLE_DATA_PATTERNS.length; k += 1) {
      if (IMPOSSIBLE_DATA_PATTERNS[k].test(prompt)) {
        return blockedResponse("impossible_data_request", "Request asks AfroTools to guarantee or know unavailable future data.");
      }
    }

    return { allowed: true, code: "allowed", reason: "", userMessage: "" };
  }

  function domainForTool(toolId, fallback) {
    var id = text(toolId);
    for (var i = 0; i < TOOL_DOMAIN_HINTS.length; i += 1) {
      if (TOOL_DOMAIN_HINTS[i][0].test(id)) return TOOL_DOMAIN_HINTS[i][1];
    }
    return fallback || "none";
  }

  function highStakesDisclaimer(domain) {
    return HIGH_STAKES_DOMAINS[domain || "none"] || "";
  }

  function ensureHighStakesDisclaimer(output, domain) {
    var base = text(output).trim();
    var warning = highStakesDisclaimer(domain);
    if (!warning) return base;
    if (base.toLowerCase().indexOf(warning.toLowerCase().slice(0, 28)) !== -1) return base;
    return (base ? base + "\n\n" : "") + warning;
  }

  function normalizeRoute(route) {
    var clean = text(route).trim();
    if (!clean || clean.charAt(0) !== "/" || clean.indexOf("//") === 0) return "";
    return clean.split("#")[0].split("?")[0].replace(/\/index\.html$/i, "/");
  }

  function findTool(manifest, toolId) {
    var tools = Array.isArray(manifest) ? manifest : [];
    for (var i = 0; i < tools.length; i += 1) {
      var tool = tools[i] || {};
      var aliases = Array.isArray(tool.aliases) ? tool.aliases : [];
      if (tool.id === toolId || tool.slug === toolId || aliases.indexOf(toolId) !== -1) return tool;
    }
    return null;
  }

  function validateRouterDecisionSafety(decision, manifest) {
    var errors = [];
    if (!decision || typeof decision !== "object") {
      return { valid: false, errors: ["decision must be an object"] };
    }
    var toolId = text(decision.selectedToolId);
    var tool = toolId === "tool-search" ? { id: "tool-search", route: "/search/", highStakesDomain: "none" } : findTool(manifest, toolId);
    if (!tool) errors.push("selectedToolId is not in the manifest");

    var selectedRoute = normalizeRoute(decision.selectedRoute);
    var allowedRoute = normalizeRoute(tool && tool.route || "/search/");
    if (!selectedRoute) errors.push("selectedRoute must be a safe root-relative route");
    if (tool && allowedRoute && selectedRoute !== allowedRoute && selectedRoute !== "/search/") {
      errors.push("selectedRoute does not match the selected tool route");
    }

    var domain = decision.safetyDomain || (tool && tool.highStakesDomain) || "none";
    if (domain !== "none" && !text(decision.highStakesNotice).trim()) {
      errors.push("high-stakes decision is missing a warning");
    }
    return { valid: errors.length === 0, errors: errors };
  }

  function stripUnsupportedSourceUrls(output, allowedUrls) {
    var allowed = Array.isArray(allowedUrls) ? allowedUrls.filter(Boolean).map(String) : [];
    var removed = false;
    var clean = text(output).replace(/https?:\/\/[^\s<>)"']+/gi, function (url) {
      var normalized = url.replace(/[.,;:!?]+$/, "");
      if (allowed.indexOf(normalized) !== -1) return url;
      removed = true;
      return "[source link omitted]";
    });
    if (removed && clean.indexOf("Source links must come from AfroTools source metadata") === -1) {
      clean += "\n\nSource links must come from AfroTools source metadata, not from AI-generated text.";
    }
    return { text: clean, removed: removed };
  }

  function redactPromptLeakage(output) {
    return text(output)
      .replace(/system prompt\s*:\s*[\s\S]{0,400}/ig, "system prompt: [redacted]")
      .replace(/developer message\s*:\s*[\s\S]{0,400}/ig, "developer message: [redacted]");
  }

  function sanitizeModelOutput(output, options) {
    var opts = options || {};
    var clean = redactPromptLeakage(output);
    var stripped = stripUnsupportedSourceUrls(clean, opts.allowedSourceUrls);
    clean = stripped.text;
    if (opts.domain) clean = ensureHighStakesDisclaimer(clean, opts.domain);
    return {
      text: clean,
      sourceUrlsRemoved: stripped.removed,
    };
  }

  function guardrailHttpResponse(headers, inspection) {
    return {
      statusCode: 400,
      headers: headers || {},
      body: JSON.stringify({
        error: "ai_guardrail_blocked",
        code: inspection && inspection.code || "blocked",
        reply: inspection && inspection.userMessage || blockedResponse("blocked", "").userMessage,
        text: inspection && inspection.userMessage || blockedResponse("blocked", "").userMessage,
      }),
    };
  }

  return {
    DEFAULT_PROMPT_LIMIT: DEFAULT_PROMPT_LIMIT,
    ROUTER_PROMPT_LIMIT: ROUTER_PROMPT_LIMIT,
    ADVISOR_PROMPT_LIMIT: ADVISOR_PROMPT_LIMIT,
    HIGH_STAKES_DOMAINS: Object.assign({}, HIGH_STAKES_DOMAINS),
    inspectPrompt: inspectPrompt,
    requestText: requestText,
    messagesText: messagesText,
    domainForTool: domainForTool,
    highStakesDisclaimer: highStakesDisclaimer,
    ensureHighStakesDisclaimer: ensureHighStakesDisclaimer,
    validateRouterDecisionSafety: validateRouterDecisionSafety,
    stripUnsupportedSourceUrls: stripUnsupportedSourceUrls,
    sanitizeModelOutput: sanitizeModelOutput,
    guardrailHttpResponse: guardrailHttpResponse,
  };
});

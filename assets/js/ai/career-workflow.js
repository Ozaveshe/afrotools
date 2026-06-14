/**
 * AfroTools AI career workflow planner.
 *
 * Deterministic first: turns a CV/cover-letter/application-pack prompt into a
 * structured career plan without requiring a model provider. Browser builds
 * expose window.AfroToolsAICareerWorkflow; tests/server tooling use CommonJS.
 */
(function initCareerWorkflow(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.AfroToolsAICareerWorkflow = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createCareerWorkflow() {
  "use strict";

  var COUNTRIES = {
    nigeria: "Nigeria",
    nigerian: "Nigeria",
    ghana: "Ghana",
    ghanaian: "Ghana",
    kenya: "Kenya",
    kenyan: "Kenya",
    cameroon: "Cameroon",
    cameroonian: "Cameroon",
    "south africa": "South Africa",
    "south african": "South Africa",
    uganda: "Uganda",
    tanzania: "Tanzania",
    rwanda: "Rwanda",
    zambia: "Zambia",
    senegal: "Senegal",
    egypt: "Egypt",
    morocco: "Morocco",
    diaspora: "International",
    international: "International",
  };

  var TOOL_CARDS = [
    {
      id: "cv-builder",
      title: "CV Builder",
      route: "/tools/cv-builder/",
      reason: "Create an ATS-safe CV, choose a country-aware template, and export PDF or plain ATS text.",
    },
    {
      id: "cover-letter",
      title: "Cover Letter Generator",
      route: "/tools/cover-letter-generator/",
      reason: "Turn the same role target into a local-first cover letter draft after the CV shape is clear.",
    },
    {
      id: "linkedin-optimizer",
      title: "LinkedIn Optimizer",
      route: "/tools/linkedin-optimizer/",
      reason: "Prepare headline, About section, and keyword prompts for recruiter search.",
    },
    {
      id: "cv-ats",
      title: "ATS Guidance",
      route: "/tools/cv-builder/#ats",
      reason: "Use ATS checks and plain export guidance before submitting through job portals.",
    },
    {
      id: "job-tracker",
      title: "Job Tracker",
      route: "/tools/cv-builder/#tracker",
      reason: "Track target roles, application status, and follow-up tasks from the CV workspace.",
    },
  ];

  function text(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalize(value) {
    return text(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function firstAlias(textValue, map) {
    var keys = Object.keys(map).sort(function byLength(a, b) {
      return b.length - a.length;
    });
    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      var pattern = new RegExp("(^|\\b)" + escapeRegex(key) + "(\\b|$)", "i");
      if (pattern.test(textValue)) return map[key];
    }
    return "";
  }

  function uniq(items) {
    var seen = {};
    return (items || []).map(text).filter(function keep(item) {
      var key = item.toLowerCase();
      if (!item || seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function normalizeCareerStage(value) {
    var clean = normalize(value);
    if (!clean) return "";
    if (/graduate|entry|intern|trainee|junior|no experience|fresh/.test(clean)) return "graduate";
    if (/mid|experienced|professional|3\s*-\s*7|4 years|5 years|6 years/.test(clean)) return "mid";
    if (/senior|lead|principal|manager|head|10\+|10 years/.test(clean)) return "senior";
    if (/executive|director|c[-\s]?level|chief/.test(clean)) return "executive";
    return clean;
  }

  function normalizeExperienceLevel(value) {
    var clean = normalize(value);
    if (!clean) return "";
    if (/no experience|fresh|graduate|intern|entry|junior/.test(clean)) return "entry";
    if (/senior|lead|principal|manager|head/.test(clean)) return "senior";
    if (/executive|director|chief|c[-\s]?level/.test(clean)) return "executive";
    if (/mid|experienced|professional/.test(clean)) return "mid";
    return clean;
  }

  function inferExperience(query) {
    var raw = String(query || "");
    var years = raw.match(/\b([0-9]{1,2})\+?\s*(?:years|yrs)\s+(?:of\s+)?experience\b/i);
    if (years) {
      var count = Number(years[1]);
      if (count <= 2) return { years: count, level: "entry", stage: "graduate" };
      if (count >= 8) return { years: count, level: "senior", stage: "senior" };
      return { years: count, level: "mid", stage: "mid" };
    }
    var clean = normalize(raw);
    if (/graduate|entry|intern|trainee|junior|no experience|fresh/.test(clean)) return { years: null, level: "entry", stage: "graduate" };
    if (/senior|lead|principal|manager|head/.test(clean)) return { years: null, level: "senior", stage: "senior" };
    if (/executive|director|chief|c[-\s]?level/.test(clean)) return { years: null, level: "executive", stage: "executive" };
    return { years: null, level: "", stage: "" };
  }

  function inferLanguage(query) {
    var clean = normalize(query);
    if (/\bfrench|francophone|francais\b/.test(clean)) return "French";
    if (/\barabic\b/.test(clean)) return "Arabic";
    if (/\bswahili|kiswahili\b/.test(clean)) return "Swahili";
    if (/\benglish\b/.test(clean)) return "English";
    return "";
  }

  function inferSector(query, role) {
    var clean = normalize((query || "") + " " + (role || ""));
    if (/\b(software|developer|data|cloud|cyber|it|product|qa|devops|engineer)\b/.test(clean) && !/\b(electrical|civil|mechanical|construction|site)\b/.test(clean)) return "technology";
    if (/\b(electrical|civil|mechanical|construction|hse|site|maintenance|solar|power|energy|oil|gas|technician)\b/.test(clean)) return "engineering";
    if (/\b(finance|account|audit|bank|tax|payroll|bookkeep|admin)\b/.test(clean)) return "finance";
    if (/\b(ngo|nonprofit|development|program|project|monitoring|evaluation|m&e|humanitarian)\b/.test(clean)) return "ngo";
    if (/\b(teacher|education|lecturer|academic|school)\b/.test(clean)) return "education";
    if (/\b(nurse|medical|health|pharmacy|doctor|public health)\b/.test(clean)) return "health";
    if (/\b(sales|marketing|customer|business development|retail)\b/.test(clean)) return "business";
    return "";
  }

  function parseRole(query) {
    var raw = String(query || "");
    var patterns = [
      /\b(?:cv|resume|cover letter|application pack|profile)\s+(?:for|as)\s+(?:an?\s+)?([a-z][a-z0-9&/+\s-]{2,80}?)(?:\s+(?:in|from|with|using)\s+|[?.!,]|$)/i,
      /\b(?:for|as|role|job)\s+(?:an?\s+)?([a-z][a-z0-9&/+\s-]{2,80}?)(?:\s+(?:in|from|with|using)\s+|[?.!,]|$)/i,
      /\b(?:become|work as)\s+(?:an?\s+)?([a-z][a-z0-9&/+\s-]{2,80}?)(?:\s+(?:in|from|with|using)\s+|[?.!,]|$)/i,
    ];
    for (var i = 0; i < patterns.length; i += 1) {
      var match = raw.match(patterns[i]);
      if (match && match[1]) return cleanRole(match[1]);
    }
    return "";
  }

  function cleanRole(value) {
    var role = text(value)
      .replace(/\b(my|a|an|the)\b/gi, "")
      .replace(/\b(nigerian|ghanaian|kenyan|cameroonian|south african|ugandan|tanzanian|rwandan|zambian|senegalese|egyptian|moroccan)\b/gi, "")
      .replace(/\b(cv|resume|cover letter|application pack)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    return role.length > 80 ? role.slice(0, 80).trim() : role;
  }

  function inferSkills(sector, role, explicitSkills) {
    var skills = uniq(explicitSkills);
    var clean = normalize((sector || "") + " " + (role || ""));
    var sets = [];
    if (/engineering|electrical|solar|power|maintenance/.test(clean)) {
      sets = ["Electrical systems", "Preventive maintenance", "Site safety", "Troubleshooting", "Project documentation"];
    } else if (/technology|software|developer|data/.test(clean)) {
      sets = ["Problem solving", "Technical documentation", "Version control", "Data analysis", "Stakeholder communication"];
    } else if (/finance|account|audit|tax|payroll/.test(clean)) {
      sets = ["Financial reporting", "Excel", "Reconciliation", "Compliance", "Attention to detail"];
    } else if (/ngo|development|program|monitoring|evaluation/.test(clean)) {
      sets = ["Program coordination", "Monitoring and evaluation", "Report writing", "Stakeholder engagement", "Grant compliance"];
    } else if (/health|nurse|medical|public health/.test(clean)) {
      sets = ["Patient care", "Clinical documentation", "Health education", "Team coordination", "Quality standards"];
    } else {
      sets = ["Communication", "Problem solving", "Teamwork", "Documentation", "Time management"];
    }
    return uniq(skills.concat(sets)).slice(0, 8);
  }

  function suggestTemplate(inputs) {
    var sector = normalize(inputs.sector);
    var role = normalize(inputs.targetRole);
    var country = inputs.country;
    var stage = normalize(inputs.careerStage || inputs.experienceLevel);
    var language = normalize(inputs.languagePreference);
    var templateId = "global-compact";
    var starterId = "professional";
    var reason = "Clean ATS-friendly template for a targeted African or international job application.";

    if (/graduate|entry/.test(stage)) {
      templateId = country === "Ghana" ? "accra-graduate" : "global-compact";
      starterId = "graduate";
      reason = "Skills-first layout for graduate, entry-level, or no-experience applications.";
    }
    if (/technology/.test(sector)) {
      templateId = "nairobi-tech";
      starterId = "tech";
      reason = "Technical layout that keeps projects, tools, and measurable impact visible.";
    }
    if (/engineering|construction|electrical|maintenance|solar|power|oil|gas/.test(sector + " " + role)) {
      templateId = /construction|hse|site/.test(role) ? "construction-hse" : "trade-skills";
      starterId = "trade";
      reason = "Practical skills layout for technical, field, energy, and engineering roles.";
    }
    if (/finance/.test(sector)) {
      templateId = "finance-admin";
      starterId = "professional";
      reason = "Business-ready layout for finance, payroll, accounting, and administration roles.";
    }
    if (/ngo/.test(sector)) {
      templateId = "ngo-impact";
      starterId = "government";
      reason = "Impact-led layout for NGO, project, development, and M&E applications.";
    }
    if (/french/.test(language) || /cameroon|senegal|morocco/.test(normalize(country))) {
      templateId = "francophone-modern";
      reason = "Francophone-friendly structure with clear sections and conservative formatting.";
    }
    if (/arabic/.test(language) || /egypt|morocco/.test(normalize(country))) {
      templateId = "cairo-executive";
      reason = "Regional business layout for Arabic or North African professional contexts.";
    }

    return {
      templateId: templateId,
      templateName: templateId.split("-").map(function title(part) {
        return part.charAt(0).toUpperCase() + part.slice(1);
      }).join(" "),
      starterId: starterId,
      reason: reason,
    };
  }

  function starterPrompts(inputs) {
    var role = inputs.targetRole || "target role";
    var country = inputs.country || "target market";
    return {
      headlinePrompt: "Use a clear title such as '" + role + "' and local market: " + country + ".",
      summaryPrompt: "Write 2-4 honest sentences covering role focus, top skills, industry exposure, and measurable strengths.",
      experiencePrompt: "Add real employers, dates, duties, tools used, and outcomes. Use numbers only when they are true.",
      skillsPrompt: "Prioritize role keywords recruiters and ATS systems are likely to search for.",
    };
  }

  function applicationChecklist(inputs) {
    var role = inputs.targetRole || "target role";
    return [
      "Open CV Builder with the suggested template and confirm country, role, and section order.",
      "Fill name, contact, education, experience, certifications, and real achievements manually.",
      "Run ATS guidance against a real job description before exporting.",
      "Create a cover letter draft only after the CV has the correct target role and employer context.",
      "Prepare LinkedIn headline/About keywords from the same role target.",
      "Export PDF for humans and plain ATS text for strict job portals.",
      "Track each " + role + " application, deadline, follow-up, and status in the job tracker.",
    ];
  }

  function normalizeInputs(query, input) {
    var raw = String(query || "");
    var clean = normalize(raw);
    var source = input || {};
    var inferred = inferExperience(raw);
    var country = text(source.country || source.market) || firstAlias(clean, COUNTRIES);
    var role = cleanRole(source.targetRole || source.role || source.jobTitle) || parseRole(raw);
    var sector = text(source.sector || source.industry) || inferSector(raw, role);
    var skills = inferSkills(sector, role, source.skills || source.keywords);
    var languagePreference = text(source.languagePreference || source.language || source.locale) || inferLanguage(raw) || "English";
    var careerStage = normalizeCareerStage(source.careerStage) || inferred.stage || (role ? "professional" : "");
    var experienceLevel = normalizeExperienceLevel(source.experienceLevel || source.seniority) || inferred.level || "";
    return {
      country: country,
      targetRole: role,
      careerStage: careerStage,
      sector: sector,
      skills: skills,
      education: text(source.education || source.qualification || source.degree),
      experienceYears: source.experienceYears === undefined || source.experienceYears === null || source.experienceYears === "" ? inferred.years : Number(source.experienceYears),
      experienceLevel: experienceLevel,
      languagePreference: languagePreference,
    };
  }

  function missingInputs(inputs) {
    return ["targetRole", "country", "careerStage", "sector"].filter(function isMissing(key) {
      return inputs[key] === undefined || inputs[key] === null || inputs[key] === "";
    });
  }

  function goalSummary(inputs) {
    var role = inputs.targetRole || "a target role";
    var country = inputs.country || "a target market";
    var stage = inputs.careerStage || inputs.experienceLevel || "professional";
    return "Build a " + stage + " CV and application pack for " + role + " in " + country + ".";
  }

  function buildCareerWorkflow(input, options) {
    var opts = options || {};
    var query = opts.query || "";
    var inputs = normalizeInputs(query, input || {});
    var template = suggestTemplate(inputs);
    var missing = missingInputs(inputs);
    var prompts = starterPrompts(inputs);
    return {
      workflowType: "career_agent",
      source: opts.source || "deterministic",
      consentToModel: opts.consentToModel === true,
      originalQuery: query,
      inputs: inputs,
      missingInputs: missing,
      goalSummary: goalSummary(inputs),
      templateSuggestion: template,
      starterProfile: {
        generatedWithConsent: false,
        prompts: prompts,
        note: "Starter profile text is not generated unless the user explicitly chooses AI assistance.",
      },
      matchingTools: TOOL_CARDS.slice(),
      applicationPack: ["CV", "Cover letter", "LinkedIn headline/About", "ATS plain export", "Job tracker entry"],
      checklist: applicationChecklist(inputs),
      warnings: [
        "Do not fabricate degrees, employers, certifications, dates, references, or achievements.",
        "AI help is optional. CV, profile, document, and private job-search content should be sent to a model only after explicit consent.",
        "Keep claims specific: use real tools, responsibilities, metrics, projects, and qualifications that you can defend in an interview.",
      ],
      cvPrefillInputs: {
        country: inputs.country,
        targetRole: inputs.targetRole,
        careerStage: inputs.careerStage,
        sector: inputs.sector,
        industry: inputs.sector,
        skills: inputs.skills,
        education: inputs.education,
        experienceYears: inputs.experienceYears,
        experienceLevel: inputs.experienceLevel,
        languagePreference: inputs.languagePreference,
        templateId: template.templateId,
        starterId: template.starterId,
        starterProfile: {
          generatedWithConsent: false,
          prompts: prompts,
        },
      },
      cvLaunchUrl: "/tools/cv-builder/?source=ask&prefill=1",
      aiProfileStatus: opts.consentToModel === true
        ? "AI starter profile can run only after explicit consent and a configured provider. Manual templates are ready now."
        : "",
    };
  }

  function escapeHtml(value) {
    return String(value === undefined || value === null ? "" : value).replace(/[&<>"']/g, function replace(ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
    });
  }

  function renderCareerPanel(plan) {
    if (!plan) return "";
    var tools = plan.matchingTools.map(function renderTool(tool) {
      return '<a class="ai-career-tool" href="' + escapeHtml(tool.route) + '">' +
        '<strong>' + escapeHtml(tool.title) + '</strong><span>' + escapeHtml(tool.reason) + '</span></a>';
    }).join("");
    var checklist = plan.checklist.map(function renderItem(item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("");
    var warnings = plan.warnings.map(function renderWarning(item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("");
    var skills = plan.inputs.skills.length
      ? plan.inputs.skills.map(function renderSkill(skill) { return "<li>" + escapeHtml(skill) + "</li>"; }).join("")
      : "<li>Add role skills manually.</li>";
    var missing = plan.missingInputs.length
      ? plan.missingInputs.map(function renderMissing(item) { return "<li>" + escapeHtml(item) + "</li>"; }).join("")
      : "<li>No critical career inputs missing.</li>";
    return '<section class="ai-career-plan" data-career-plan>' +
      '<div class="ai-career-head"><div><h4>Career agent plan</h4><p>' + escapeHtml(plan.goalSummary) + '</p></div><span>' + escapeHtml(plan.templateSuggestion.templateName) + '</span></div>' +
      '<div class="ai-career-grid">' +
      '<div><strong>Template suggestion</strong><p>' + escapeHtml(plan.templateSuggestion.reason) + '</p><p>Starter path: ' + escapeHtml(plan.templateSuggestion.starterId) + '</p></div>' +
      '<div><strong>Detected role keywords</strong><ul>' + skills + '</ul></div>' +
      '<div><strong>Missing profile inputs</strong><ul>' + missing + '</ul></div>' +
      '</div>' +
      '<div class="ai-career-section"><strong>Application pack checklist</strong><ol>' + checklist + '</ol></div>' +
      '<div class="ai-career-section"><strong>Matching AfroTools</strong><div class="ai-career-tools">' + tools + '</div></div>' +
      '<div class="ai-career-section ai-career-warning"><strong>Safe CV rules</strong><ul>' + warnings + '</ul></div>' +
      '<div class="ai-career-actions">' +
      '<a class="ai-small-button primary" data-career-cv-link href="' + escapeHtml(plan.cvLaunchUrl) + '">Open CV Builder with starter</a>' +
      '<a class="ai-small-button secondary" href="/tools/cover-letter-generator/">Open Cover Letter Generator</a>' +
      '<button class="ai-small-button" type="button" data-career-ai-profile>Generate starter profile with AI</button>' +
      '</div>' +
      '<p class="ai-model-status" data-career-profile-status>' + escapeHtml(plan.aiProfileStatus) + '</p>' +
      '</section>';
  }

  return {
    TOOL_CARDS: TOOL_CARDS,
    normalizeInputs: normalizeInputs,
    suggestTemplate: suggestTemplate,
    buildCareerWorkflow: buildCareerWorkflow,
    renderCareerPanel: renderCareerPanel,
  };
});

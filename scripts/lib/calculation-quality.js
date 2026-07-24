"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadBrowserGlobal(root, artifactPath, globalName) {
  const context = { globalThis: {} };
  vm.runInNewContext(
    fs.readFileSync(path.join(root, artifactPath), "utf8"),
    context,
    { filename: artifactPath },
  );
  return context.globalThis[globalName];
}

const RISK_DOMAINS = [
  "tax_payroll",
  "pensions_benefits",
  "loans_financial",
  "utilities_meters",
  "exchange_rates",
  "health",
  "agriculture",
  "legal_regulatory",
  "general_utility",
];

const REQUIRED_FIXTURE_CLASSES = [
  "zero_input",
  "negative_input",
  "band_boundary",
  "exact_threshold",
  "very_large_value",
  "decimal_precision",
  "leap_year_date",
  "date_boundary",
  "missing_optional_input",
  "unsupported_jurisdiction",
  "unsupported_date",
  "changed_tax_year",
  "rounding_stage",
];

const QUALITY_FILES = {
  inventory: "data/calculation-quality/engine-inventory.json",
  formulas: "data/calculation-quality/formula-registry.json",
  fixtures: "data/calculation-quality/golden-fixtures.json",
  externalData: "data/calculation-quality/external-data-contracts.json",
  fixtureDeltas: "data/calculation-quality/fixture-deltas.json",
};

const ENGINE_ROOTS = [
  "engines",
  "assets/js/engines",
  "netlify/functions/_engines",
];

const SKIP_ENGINE_FILES = new Set([
  "netlify/functions/_engines/_factory.js",
  "netlify/functions/_engines/index.js",
]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function slash(value) {
  return String(value || "").replace(/\\/g, "/");
}

function stableSortObject(value) {
  if (Array.isArray(value)) return value.map(stableSortObject);
  if (!value || typeof value !== "object") {
    if (value === Infinity) return "Infinity";
    if (value === -Infinity) return "-Infinity";
    if (typeof value === "number" && Number.isNaN(value)) return "NaN";
    return value;
  }
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, stableSortObject(value[key])]),
  );
}

function stableJson(value) {
  return JSON.stringify(stableSortObject(value), null, 2) + "\n";
}

function digestText(value) {
  const normalized = String(value).replace(/\r\n/g, "\n");
  return (
    "sha256:" + crypto.createHash("sha256").update(normalized).digest("hex")
  );
}

function normalizeLegacyHtmlFormulaScript(source) {
  // This disclosure helper lives in the same legacy inline script as the Egypt
  // PAYE formula. Its accessibility state is presentation-only, so normalize
  // the enhanced implementation to the original digest representation. Actual
  // rates, bands, thresholds, deductions, and calculation code remain covered.
  return source.replace(
    "function toggleBands(header) {\n" +
      "  const body = header.nextElementSibling;\n" +
      "  const arr  = header.querySelector('.tog-arrow');\n" +
      "  const open = body.classList.toggle('open');\n" +
      "  arr.classList.toggle('open');\n" +
      "  if (header.hasAttribute('aria-expanded')) header.setAttribute('aria-expanded', open ? 'true' : 'false');\n" +
      "}",
    "function toggleBands(header) {\n" +
      "  const body = header.nextElementSibling;\n" +
      "  const arr  = header.querySelector('.tog-arrow');\n" +
      "  body.classList.toggle('open');\n" +
      "  arr.classList.toggle('open');\n" +
      "}",
  );
}

function digestFile(root, relativePath) {
  let source = fs.readFileSync(path.join(root, relativePath), "utf8");
  if (
    /^netlify\/functions\/_engines\/[a-z]{2}-paye\.js$/i.test(
      slash(relativePath),
    )
  ) {
    // Review scheduling metadata does not change calculation behavior. The
    // explicit marker keeps these fields outside protected formula digests,
    // while every unmarked engine line remains covered by the digest gate.
    source = source.replace(
      /^[ \t]*\/\* source-confidence-stamp:start \*\/[\s\S]*?^[ \t]*\/\* source-confidence-stamp:end \*\/\r?\n?(?:[ \t]*\r?\n)?/gm,
      "",
    );
  }
  if (!relativePath.endsWith(".html")) return digestText(source);
  const executableScripts = [];
  for (const match of source.matchAll(
    /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
  )) {
    const attributes = match[1] || "";
    const body = normalizeLegacyHtmlFormulaScript(match[2] || "");
    if (
      /\bsrc\s*=/i.test(attributes) ||
      /application\/ld\+json/i.test(attributes)
    )
      continue;
    if (
      /\b(?:calculate|calctax|computepaye|computeTax|paye|vat|bands?|rates?|threshold|deduction)\b/i.test(
        body,
      )
    ) {
      executableScripts.push(body.trim());
    }
  }
  return digestText(
    executableScripts.length
      ? executableScripts.join("\n/* formula-script-boundary */\n")
      : source,
  );
}

function routeToFile(root, route) {
  const routePath = String(route || "").split(/[?#]/)[0];
  const clean = routePath.replace(/^\/+|\/+$/g, "");
  const candidates = /\.html$/i.test(clean)
    ? [clean]
    : routePath.endsWith("/")
      ? [clean + "/index.html", clean + ".html"]
      : [clean + ".html", clean + "/index.html"];
  return (
    candidates.find((candidate) => fs.existsSync(path.join(root, candidate))) ||
    null
  );
}

function toolVerificationArtifacts(root) {
  const verificationPath = path.join(root, "data/tool-verification.json");
  if (!fs.existsSync(verificationPath)) return [];
  const tools = readJson(verificationPath).tools || {};
  const out = [];
  for (const entry of Object.values(tools)) {
    for (const route of entry.routes || []) {
      const file = routeToFile(root, route);
      if (file) out.push(slash(file));
    }
  }
  return [...new Set(out)].sort();
}

function discoverEngineArtifacts(root) {
  const out = [];
  for (const relativeDir of ENGINE_ROOTS) {
    const absoluteDir = path.join(root, relativeDir);
    if (!fs.existsSync(absoluteDir)) continue;
    for (const name of fs.readdirSync(absoluteDir).sort()) {
      if (!name.endsWith(".js")) continue;
      const relativePath = slash(path.join(relativeDir, name));
      if (!SKIP_ENGINE_FILES.has(relativePath)) out.push(relativePath);
    }
  }
  out.push(...toolVerificationArtifacts(root));
  return [...new Set(out)].sort();
}

function idFromPath(relativePath) {
  return slash(relativePath)
    .replace(/\.(?:js|html)$/i, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function classifyArtifact(relativePath) {
  const value = slash(relativePath).toLowerCase();
  const name = path.posix.basename(value);
  let riskDomain = "general_utility";

  if (
    /paye|payroll|payslip|employee-cost|staff-cost|(^|-)tax|(^|-)cit|tva|(^|-)vat|(^|-)wht|withholding|creator-invoice/.test(
      value,
    )
  ) {
    riskDomain = "tax_payroll";
  } else if (
    /pension|ssnit|nssf|uif|gepf|social-security|benefit|health-contribution|workers-comp/.test(
      value,
    )
  ) {
    riskDomain = "pensions_benefits";
  } else if (
    /fx|forex|exchange|remittance|afrorates|payment-comparator/.test(value)
  ) {
    riskDomain = "exchange_rates";
  } else if (
    /electric|meter|utility|water-bill|solar|battery|energy|fuel|outage|generator|gas-lpg|backup-duration|mini-grid|paygo|carbon-footprint/.test(
      value,
    )
  ) {
    riskDomain = "utilities_meters";
  } else if (/health|medical|insurance/.test(value)) {
    riskDomain = "health";
  } else if (
    /agri|farm|crop|fertilizer|livestock|poultry|aquaculture|cassava|cocoa|coffee|seed-rate|irrigation|harvest|commodity|vaccination/.test(
      value,
    )
  ) {
    riskDomain = "agriculture";
  } else if (
    /loan|mortgage|finance|bank-charge|inflation-scenario|savings-goal|investment-return|salary-offer|salary-evidence|retirement-scenario|roi|profit|price|cost|yield|business-planner/.test(
      value,
    )
  ) {
    riskDomain = "loans_financial";
  } else if (
    /duty|tariff|levy|landed-cost|minimum-wage|labour|legal|compliance|regulatory|license|contract|tenancy|visa|incoterm|hs-lookup|coo-engine|export-docs|demurrage/.test(
      value,
    )
  ) {
    riskDomain = "legal_regulatory";
  }

  let riskLevel = "low";
  if (
    relativePath.endsWith(".html") ||
    ["tax_payroll", "pensions_benefits", "legal_regulatory"].includes(
      riskDomain,
    )
  ) {
    riskLevel = "high";
  } else if (
    [
      "loans_financial",
      "utilities_meters",
      "exchange_rates",
      "health",
      "agriculture",
    ].includes(riskDomain)
  ) {
    riskLevel = "medium";
  }

  const rationale =
    riskLevel === "high"
      ? "Result can affect statutory, payroll, benefit, customs, legal, or regulatory decisions and therefore requires provenance and protected review."
      : riskLevel === "medium"
        ? "Result can influence financial, health, utility, exchange-rate, or agricultural planning and therefore requires explicit assumptions and fixtures."
        : "Artifact is a general-purpose or workflow utility without jurisdictional monetary or statutory decision logic.";

  return { riskLevel, riskDomain, rationale, name };
}

function loadQualityArtifacts(root) {
  const artifacts = {};
  for (const [key, relativePath] of Object.entries(QUALITY_FILES)) {
    artifacts[key] = readJson(path.join(root, relativePath));
  }
  return artifacts;
}

function applicablePopulationFor(domain) {
  return {
    tax_payroll:
      "Employees, employers, payroll teams, and taxpayers covered by the declared jurisdiction and regime.",
    pensions_benefits:
      "Workers, employers, contributors, and benefit claimants covered by the declared scheme assumptions.",
    loans_financial:
      "Users preparing non-binding financial projections from the entered assumptions.",
    utilities_meters:
      "Households and businesses estimating utility consumption, tariffs, backup power, or energy investment.",
    exchange_rates:
      "Users comparing indicative exchange, remittance, or policy-rate scenarios before obtaining a provider quote.",
    health:
      "Users preparing non-diagnostic health-cost, contribution, or insurance planning estimates.",
    agriculture:
      "Farmers and agricultural businesses preparing planning estimates under the declared units and data assumptions.",
    legal_regulatory:
      "Users preparing regulatory, customs, employment, trade, or legal-planning estimates for the declared jurisdiction.",
    general_utility: "General users of a deterministic utility.",
  }[domain];
}

function disclaimerFor(domain) {
  return {
    tax_payroll:
      "Planning estimate only. Confirm rates, payroll treatment, filing, and remittance with the relevant authority or a qualified professional.",
    pensions_benefits:
      "Planning estimate only. Confirm contribution, eligibility, and benefit rules with the relevant scheme administrator.",
    loans_financial:
      "Planning estimate only, not a quote, investment recommendation, or guarantee of approval or return.",
    utilities_meters:
      "Planning estimate only. Confirm current tariffs, meter rules, equipment performance, and supplier quotes locally.",
    exchange_rates:
      "Indicative planning data only. Obtain a current executable quote before committing funds.",
    health:
      "Planning information only. It is not medical diagnosis, treatment advice, or a coverage guarantee.",
    agriculture:
      "Planning estimate only. Local yields, prices, weather, agronomy, and input requirements can differ materially.",
    legal_regulatory:
      "Planning information only. Confirm current legal, customs, filing, and regulatory treatment with the relevant authority or qualified adviser.",
    general_utility: "General informational output only.",
  }[domain];
}

function exclusionsFor(domain) {
  return {
    tax_payroll: [
      "Special regimes, treaties, sector rules, regional reliefs, and individual filing adjustments may not be modeled.",
    ],
    pensions_benefits: [
      "Scheme eligibility, vesting, claim approval, and employer-specific plan terms may not be modeled.",
    ],
    loans_financial: [
      "Provider fees, taxes, approval criteria, market movements, and user-specific contract terms are excluded unless entered.",
    ],
    utilities_meters: [
      "Local tariff classes, taxes, losses, outages, meter configuration, and equipment degradation may differ.",
    ],
    exchange_rates: [
      "Provider spreads, fees, liquidity, settlement delay, and executable market quotes are excluded unless shown.",
    ],
    health: [
      "Clinical diagnosis, individual medical factors, insurer underwriting, and final provider charges are excluded.",
    ],
    agriculture: [
      "Local soil, weather, pest pressure, agronomy, market access, and farm-specific losses are excluded unless entered.",
    ],
    legal_regulatory: [
      "Case-specific interpretation, exemptions, official assessment, filing acceptance, and professional advice are excluded.",
    ],
    general_utility: [
      "Jurisdiction-specific or professional decision rules are outside this utility.",
    ],
  }[domain];
}

function sourceTemplate(domain, sourceRegistry, artifactPath) {
  const artifactSourceIds = {
    "assets/js/engines/eg-vat.js": "vat-eg-source",
    "assets/js/engines/gm-vat.js": "vat-gm-source",
    "assets/js/engines/mortgage-planner.js": "mortgage-planning-method",
    "assets/js/engines/loan-compare.js": "loan-comparison-method",
    "assets/js/engines/payslip-draft.js": "payslip-draft-method",
    "assets/js/engines/backup-power-costs.js":
      "backup-power-costs-user-input-method",
    "assets/js/engines/salary-offer-compare.js":
      "salary-offer-comparison-method",
    "assets/js/engines/salary-evidence-notebook.js":
      "salary-evidence-notebook-method",
    "assets/js/engines/retirement-scenario-planner.js":
      "retirement-scenario-user-input-method",
    "assets/js/engines/side-income-tax-reserve.js":
      "side-income-tax-reserve-user-input-method",
    "assets/js/engines/bank-charge-offer-compare.js":
      "bank-charge-offer-user-input-method",
    "assets/js/engines/inflation-scenario.js":
      "inflation-scenario-user-input-method",
    "assets/js/engines/savings-goal-plan.js": "savings-goal-user-input-method",
    "assets/js/engines/car-loan-plan.js": "car-loan-user-input-method",
    "assets/js/engines/student-loan-plan.js": "student-loan-user-input-method",
    "engines/ng-pension-engine.js": "ng-pension-cps-scenario-method",
  };
  const preferredId =
    artifactSourceIds[artifactPath] ||
    {
      tax_payroll: "paye-tax-engine-country-packs",
      pensions_benefits: "paye-tax-engine-country-packs",
      loans_financial: "unknown-source",
      utilities_meters: "afrofuel-static-snapshot",
      exchange_rates: "forex-third-party-snapshot",
      health: "unknown-source",
      agriculture: "country-profile-reviewed-dataset",
      legal_regulatory: "import-duty-planning-rates",
      general_utility: "unknown-source",
    }[domain];
  const source =
    (sourceRegistry.sources || []).find((entry) => entry.id === preferredId) ||
    {};
  return {
    registryId: source.id || null,
    title:
      source.sourceName || "Formula assumptions declared in " + artifactPath,
    url: source.sourceUrl || null,
    kind: source.sourceType || "artifact-declared",
    authorityStatus:
      source.confidence === "official_verified"
        ? "official-verified"
        : source.id === "unknown-source"
          ? "review-required"
          : "reviewed-dataset",
  };
}

function sourceRefsFromVerification(entry) {
  return (entry.source_urls || []).map((url, index) => ({
    registryId: null,
    title: (entry.source_titles || [])[index] || url,
    url,
    kind: "authority-link",
    authorityStatus: "source-reviewed",
  }));
}

function effectivePeriodForServerCountry(code) {
  const periods = {
    ZA: {
      effectiveFrom: "2025-03-01",
      effectiveTo: "2026-02-28",
      effectiveDateStatus: "declared",
    },
    TZ: {
      effectiveFrom: "2025-07-01",
      effectiveTo: "2026-06-30",
      effectiveDateStatus: "declared",
    },
    UG: {
      effectiveFrom: "2026-07-01",
      effectiveTo: null,
      effectiveDateStatus: "declared",
    },
    MW: {
      effectiveFrom: "2026-01-01",
      effectiveTo: null,
      effectiveDateStatus: "declared",
    },
    SC: {
      effectiveFrom: "2018-06-01",
      effectiveTo: null,
      effectiveDateStatus: "declared",
    },
  };
  return (
    periods[code] || {
      effectiveFrom: null,
      effectiveTo: null,
      effectiveDateStatus: "review-required",
    }
  );
}

function currencyForCountry(countries, code) {
  const country = countries.find((entry) => entry.id === code);
  return country ? country.currency : null;
}

function countryFromArtifact(relativePath) {
  const server = relativePath.match(
    /^netlify\/functions\/_engines\/([a-z]{2})-paye\.js$/i,
  );
  if (server) return server[1].toUpperCase();
  const browser = relativePath.match(
    /^assets\/js\/engines\/([a-z]{2})-paye\.js$/i,
  );
  if (browser) return browser[1].toUpperCase();
  return null;
}

function safeFormulaParameters(engine, artifactPath, digest) {
  if (engine && engine.formulaParameters) {
    return {
      mode: "schema-exposed-runtime-parameters",
      values: stableSortObject(engine.formulaParameters),
    };
  }
  return {
    mode: "protected-legacy-parameter-reference",
    artifactPath,
    artifactDigest: digest,
    note: "Constants remain in the legacy runtime; the digest gate prevents silent drift until a behavior-preserving migration is available.",
  };
}

function roundingForEngine(engine) {
  return engine && engine.roundingPolicy
    ? stableSortObject(engine.roundingPolicy)
    : {
        method: "runtime-defined",
        precision: "Preserve current executable behavior.",
        stages: [
          "Formula artifact controls intermediate and final rounding; focused unit or golden-fixture assertions protect observed stages.",
        ],
      };
}

function makeFormulaVersion(label, digest) {
  return (
    label + "+sha256." + digest.slice("sha256:".length, "sha256:".length + 12)
  );
}

function verificationByCountry(toolVerification, code) {
  const direct =
    toolVerification.tools &&
    toolVerification.tools[code.toLowerCase() + "-paye"];
  if (direct) return direct;
  return (
    Object.values(toolVerification.tools || {}).find(
      (entry) => entry.tool_id === code.toLowerCase() + "-paye",
    ) || null
  );
}

function buildRouteFormulas(root, toolVerification, countries) {
  const formulas = [];
  const routeMappings = [];
  const formulaIdsByArtifact = new Map();
  const reviewedEngineByTool = {
    "ao-vat": "assets/js/engines/ao-vat.js",
    "bj-vat": "assets/js/engines/bj-vat.js",
    "bw-vat": "assets/js/engines/bw-vat.js",
    "cd-vat": "assets/js/engines/cd-vat.js",
    "cf-vat": "assets/js/engines/cf-vat.js",
    "cg-vat": "assets/js/engines/cg-vat.js",
    "ci-vat": "assets/js/engines/ci-vat.js",
    "cm-vat": "assets/js/engines/cm-vat.js",
    "crypto-cgt": "engines/crypto-cgt-engine.js",
    "cv-vat": "assets/js/engines/cv-vat.js",
    "dj-vat": "assets/js/engines/dj-vat.js",
    "dz-vat": "assets/js/engines/dz-vat.js",
    "er-vat": "assets/js/engines/er-vat.js",
    "gq-vat": "assets/js/engines/gq-vat.js",
    "investment-return": "engines/investment-return-engine.js",
    "pension-proj": "engines/pension-projection-planner.js",
    "ke-cgt": "assets/js/engines/ke-cgt.js",
    "ke-wht": "assets/js/engines/ke-wht.js",
    "km-vat": "assets/js/engines/km-consumption-tax.js",
    "ng-cit": "assets/js/engines/ng-cit.js",
    "ng-cgt": "assets/js/engines/ng-cgt.js",
    "ng-wht": "assets/js/engines/ng-wht.js",
    "staff-cost": "engines/staff-cost-planner.js",
    "td-vat": "assets/js/engines/td-vat.js",
    "transfer-pricing": "engines/transfer-pricing-planner.js",
    "za-cgt": "assets/js/engines/za-cgt.js",
    "za-dividend-tax": "assets/js/engines/za-dividend-tax.js",
    "za-uif": "engines/za-uif-engine.js",
  };

  reviewedEngineByTool["et-vat"] = "assets/js/engines/et-vat.js";
  reviewedEngineByTool["sz-vat"] = "assets/js/engines/sz-vat.js";
  reviewedEngineByTool["ga-vat"] = "assets/js/engines/ga-vat.js";
  reviewedEngineByTool["gm-vat"] = "assets/js/engines/gm-vat.js";
  reviewedEngineByTool["gn-vat"] = "assets/js/engines/gn-vat.js";
  reviewedEngineByTool["gw-vat"] = "assets/js/engines/gw-vat.js";
  reviewedEngineByTool["ls-vat"] = "assets/js/engines/ls-vat.js";
  reviewedEngineByTool["lr-vat"] = "assets/js/engines/lr-vat.js";
  reviewedEngineByTool["mg-vat"] = "assets/js/engines/mg-vat.js";
  reviewedEngineByTool["mw-vat"] = "assets/js/engines/mw-vat.js";
  reviewedEngineByTool["ml-vat"] = "assets/js/engines/ml-vat.js";
  reviewedEngineByTool["mr-vat"] = "assets/js/engines/mr-vat.js";
  reviewedEngineByTool["mu-vat"] = "assets/js/engines/mu-vat.js";
  reviewedEngineByTool["ma-vat"] = "assets/js/engines/ma-vat.js";
  reviewedEngineByTool["mz-vat"] = "assets/js/engines/mz-vat.js";
  reviewedEngineByTool["salary-compare"] =
    "assets/js/engines/salary-offer-compare.js";

  for (const [toolKey, entry] of Object.entries(
    toolVerification.tools || {},
  ).sort(([a], [b]) => a.localeCompare(b))) {
    const routeArtifactPaths = (entry.routes || [])
      .map((route) => routeToFile(root, route))
      .filter(Boolean)
      .map(slash);
    if (!routeArtifactPaths.length) continue;
    const reviewedEnginePath = reviewedEngineByTool[toolKey];
    const primaryPath =
      reviewedEnginePath && fs.existsSync(path.join(root, reviewedEnginePath))
        ? reviewedEnginePath
        : routeArtifactPaths.find((file) => !file.startsWith("fr/")) ||
          routeArtifactPaths[0];
    const artifactPaths = [primaryPath].concat(
      routeArtifactPaths.filter((file) => file !== primaryPath),
    );
    const runtimeEngine = primaryPath.endsWith(".js")
      ? require(path.join(root, primaryPath))
      : null;
    const codeMatch = entry.tool_id.match(/^([a-z]{2})-/i);
    const code =
      entry.country_code || (codeMatch ? codeMatch[1].toUpperCase() : "ALL");
    const country = countries.find((item) => item.id === code);
    const digest = digestFile(root, primaryPath);
    const isManualRate = entry.calculation_mode === "manual_user_input";
    const isCorporateTax = entry.calculation_mode === "corporate_income_tax";
    const isCapitalGainsTax = entry.calculation_mode === "capital_gains_tax";
    const isDividendsTax =
      entry.calculation_mode === "dividends_withholding_tax";
    const isWithholdingTax = entry.calculation_mode === "withholding_tax";
    const isComparabilityPlanner =
      entry.calculation_mode === "comparability_planner";
    const isSocialInsuranceBenefits =
      entry.calculation_mode === "social_insurance_benefits";
    const isInvestmentProjection =
      entry.calculation_mode === "investment_projection";
    const isPensionProjection = entry.calculation_mode === "pension_projection";
    const isStaffCostPlanner = entry.calculation_mode === "staff_cost_planner";
    const kind = isManualRate
      ? "manual-rate"
      : isCorporateTax
        ? "corporate-tax"
        : isCapitalGainsTax
          ? "capital-gains-tax"
          : isDividendsTax
            ? "dividends-withholding-tax"
            : isWithholdingTax
              ? "withholding-tax"
              : isComparabilityPlanner
                ? "comparability-planner"
                : isSocialInsuranceBenefits
                  ? "social-insurance-benefits"
                  : isPensionProjection
                    ? "pension-projection"
                    : isInvestmentProjection
                      ? "investment-projection"
                      : isStaffCostPlanner
                        ? "staff-cost-planner"
                        : /-vat(?:-fr)?$/i.test(entry.tool_id)
                          ? "vat"
                          : "paye";
    const riskDomain = isManualRate
      ? "exchange_rates"
      : isSocialInsuranceBenefits || isPensionProjection
        ? "pensions_benefits"
        : isInvestmentProjection || isStaffCostPlanner
          ? "loans_financial"
          : "tax_payroll";
    const formulaId = "route-" + toolKey;
    const sources = sourceRefsFromVerification(entry);
    const canonicalCurrency = country ? country.currency : null;
    const routeCurrency =
      entry.tool_id === "so-vat"
        ? null
        : entry.tool_id === "crypto-cgt" ||
      entry.tool_id === "staff-cost" ||
      entry.tool_id === "pension-proj"
        ? "MULTI"
        : entry.calculation_currency || canonicalCurrency;
    const currencyOverride =
      canonicalCurrency && routeCurrency && routeCurrency !== canonicalCurrency
        ? {
            canonicalCurrency,
            runtimeCurrency: routeCurrency,
            status: "review-required",
            reason:
              "The reviewed route contract explicitly calculates in a statutory currency different from the canonical country currency.",
          }
        : null;

    formulas.push({
      id: formulaId,
      formulaFamily: kind + "-route",
      formulaVersion: makeFormulaVersion(
        (entry.law_or_version || kind + "-legacy")
          .replace(/\s+/g, "-")
          .slice(0, 48),
        digest,
      ),
      artifactPath: primaryPath,
      artifactDigest: digest,
      jurisdictions:
        entry.tool_id === "crypto-cgt" ? ["NG", "KE", "ZA", "GH"] : [code],
      sourceJurisdictions:
        entry.tool_id === "crypto-cgt"
          ? ["NG", "KE", "ZA", "GH"]
          : [country ? country.sourceJurisdiction : code],
      applicablePopulation: applicablePopulationFor(riskDomain),
      sources,
      effectiveFrom: entry.effective_from || null,
      effectiveTo: entry.effective_to || null,
      effectiveDateStatus:
        isStaffCostPlanner || isPensionProjection
          ? "not-applicable"
          : entry.effective_from
            ? "declared"
            : "review-required",
      parameters:
        entry.tool_id === "so-vat"
          ? {
              mode: "schema-exposed-runtime-parameters",
              values: {
                calculable: false,
                statusCode: "NO_VERIFIED_NATIONAL_VAT",
                system:
                  "Federal evidence reference; named sector sales taxes and the dated turnover-tax table are not a verified nationwide VAT rate.",
              },
            }
          : safeFormulaParameters(runtimeEngine, primaryPath, digest),
      rounding: roundingForEngine(runtimeEngine),
      currency: routeCurrency,
      currencyAssumption: currencyOverride
        ? "Explicit reviewed route currency override; the page must not silently translate statutory thresholds."
        : entry.tool_id === "crypto-cgt"
          ? "The engine selects NGN, KES, ZAR or GHS from the confirmed jurisdiction and performs no exchange-rate conversion."
          : isStaffCostPlanner || isPensionProjection
            ? "The user enters one ISO currency code. The engine performs no exchange-rate conversion and supplies no jurisdiction-specific amount."
            : isInvestmentProjection
              ? "The user selects a display currency only. The engine performs no exchange-rate conversion and applies no currency-specific market, tax or provider rules."
              : "Canonical route currency from data/registry/countries.json; executable constants remain protected in the registered formula artifact.",
      currencyOverride,
      units: ["currency"],
      knownExclusions: entry.known_limitations || exclusionsFor(riskDomain),
      lastVerified: entry.last_verified,
      verificationBasis: entry.verified_by || "AfroTools source audit",
      owner: "AfroTools formula review owners",
      disclaimer:
        entry.tool_id === "pension-proj"
          ? "Pension accumulation planning estimate only. Confirm scheme values, fees, access rules, benefits, tax and retirement-income options with the provider, authority or a licensed adviser."
          : entry.tool_id === "staff-cost"
            ? "Staff-cost planning estimate only. Confirm classification, current employer obligations, benefits, contract terms, accounting and payroll treatment with the relevant authority or qualified professionals."
            : entry.tool_id === "crypto-cgt"
              ? "Crypto capital-gains planning estimate only. Confirm classification, residence, valuation, records, filing and payment with the relevant tax authority or a qualified tax professional."
              : entry.tool_id === "eg-vat"
                ? "Egypt VAT planning estimate only. Confirm classification, registration, invoicing, filing and remittance with ETA or a qualified tax professional."
                : entry.tool_id === "ng-cgt"
                  ? "Nigeria disposal-tax planning estimate only. Confirm classification, deductions, exemptions, filing and payment with NRS, the relevant state tax authority or a qualified tax professional."
                  : entry.tool_id === "ke-cgt"
                    ? "Kenya capital-gains-tax planning estimate only. Confirm valuation, adjusted-cost evidence, exemptions, filing and payment with KRA or a qualified tax professional."
                    : entry.tool_id === "za-cgt"
                      ? "South Africa CGT planning estimate only. Confirm classification, valuation, exclusions, losses, filing and payment with SARS or a qualified tax professional."
                      : entry.tool_id === "za-dividend-tax"
                        ? "South Africa dividends-tax planning estimate only. Confirm scope, beneficial ownership, declaration validity, treaty or exemption eligibility, filing and payment with SARS or a qualified tax professional."
                        : disclaimerFor(riskDomain),
      protectedDuplicates: artifactPaths.filter((file) => file !== primaryPath),
      riskLevel: "high",
      riskDomain,
      supportStatus: "legacy-protected",
    });

    for (const artifactPath of artifactPaths) {
      if (!formulaIdsByArtifact.has(artifactPath))
        formulaIdsByArtifact.set(artifactPath, []);
      formulaIdsByArtifact.get(artifactPath).push(formulaId);
    }

    routeMappings.push({
      toolId: toolKey,
      formulaId,
      routes: entry.routes.slice().sort(),
      sourceUrls: sources.map((source) => source.url).filter(Boolean),
    });
  }

  return { formulas, routeMappings, formulaIdsByArtifact };
}

function buildJsFormula(
  root,
  artifactPath,
  classification,
  countries,
  sourceRegistry,
  toolVerification,
) {
  const digest = digestFile(root, artifactPath);
  let countryCode = countryFromArtifact(artifactPath);
  let engine = null;
  let formulaFamily = idFromPath(artifactPath);
  let formulaId = "formula-" + formulaFamily;
  let sources = [
    sourceTemplate(classification.riskDomain, sourceRegistry, artifactPath),
  ];
  let lastVerified = "2026-03-01";
  let effective = {
    effectiveFrom: null,
    effectiveTo: null,
    effectiveDateStatus: "not-applicable",
  };
  let currency = classification.riskDomain === "health" ? null : "MULTI";
  let sourceJurisdictions = ["ALL"];
  let jurisdictions = ["ALL"];
  let protectedDuplicates = [];
  let knownExclusions = exclusionsFor(classification.riskDomain);
  let disclaimer = disclaimerFor(classification.riskDomain);

  if (artifactPath.startsWith("netlify/functions/_engines/")) {
    engine = require(path.join(root, artifactPath));
    formulaFamily = "paye-server";
    formulaId = "paye-server-" + engine.country.toLowerCase();
    jurisdictions = [engine.country];
    const country = countries.find((entry) => entry.id === engine.country);
    sourceJurisdictions = [
      country ? country.sourceJurisdiction : engine.country,
    ];
    currency = engine.currency;
    const verification = verificationByCountry(
      toolVerification,
      engine.country,
    );
    if (verification) {
      sources = sourceRefsFromVerification(verification);
      lastVerified = verification.last_verified;
    } else {
      sources = [
        {
          registryId: null,
          title: engine.source,
          url: null,
          kind: "artifact-declared",
          authorityStatus: "review-required",
        },
      ];
      lastVerified = engine.lastUpdated || lastVerified;
    }
    effective = effectivePeriodForServerCountry(engine.country);
    const browserCopy =
      "assets/js/engines/" + engine.country.toLowerCase() + "-paye.js";
    if (fs.existsSync(path.join(root, browserCopy)))
      protectedDuplicates.push(browserCopy);
  } else if (
    artifactPath.startsWith("assets/js/engines/") &&
    /-paye\.js$/.test(artifactPath)
  ) {
    formulaFamily = "paye-browser";
    formulaId = "paye-browser-" + countryCode.toLowerCase();
    jurisdictions = [countryCode];
    const country = countries.find((entry) => entry.id === countryCode);
    sourceJurisdictions = [country ? country.sourceJurisdiction : countryCode];
    currency = country ? country.currency : null;
    const verification = verificationByCountry(toolVerification, countryCode);
    if (verification) {
      sources = sourceRefsFromVerification(verification);
      lastVerified = verification.last_verified;
    }
    effective = effectivePeriodForServerCountry(countryCode);
    protectedDuplicates.push(
      "netlify/functions/_engines/" + countryCode.toLowerCase() + "-paye.js",
    );
  } else if (artifactPath === "assets/js/engines/gh-vat.js") {
    countryCode = "GH";
    jurisdictions = ["GH"];
    const country = countries.find((entry) => entry.id === countryCode);
    sourceJurisdictions = [country ? country.sourceJurisdiction : countryCode];
    currency = country ? country.currency : "GHS";
    const verification =
      toolVerification.tools && toolVerification.tools["gh-vat"];
    if (verification) {
      sources = sourceRefsFromVerification(verification);
      lastVerified = verification.last_verified;
    }
    effective = {
      effectiveFrom: "2026-01-01",
      effectiveTo: null,
      effectiveDateStatus: "declared",
    };
  } else if (artifactPath === "assets/js/engines/za-vat.js") {
    countryCode = "ZA";
    jurisdictions = ["ZA"];
    const country = countries.find((entry) => entry.id === countryCode);
    sourceJurisdictions = [country ? country.sourceJurisdiction : countryCode];
    currency = country ? country.currency : "ZAR";
    const verification =
      toolVerification.tools && toolVerification.tools["za-vat"];
    if (verification) {
      sources = sourceRefsFromVerification(verification);
      lastVerified = verification.last_verified;
      effective = {
        effectiveFrom: verification.effective_from || null,
        effectiveTo: verification.effective_to || null,
        effectiveDateStatus: verification.effective_from
          ? "declared"
          : "review-required",
      };
    }
  } else if (artifactPath === "assets/js/engines/eg-vat.js") {
    countryCode = "EG";
    jurisdictions = ["EG"];
    const country = countries.find((entry) => entry.id === countryCode);
    sourceJurisdictions = [country ? country.sourceJurisdiction : countryCode];
    currency = country ? country.currency : "EGP";
    const verification =
      toolVerification.tools && toolVerification.tools["eg-vat"];
    if (verification) {
      sources = sourceRefsFromVerification(verification);
      lastVerified = verification.last_verified;
    }
    effective = {
      effectiveFrom: null,
      effectiveTo: null,
      effectiveDateStatus: "review-required",
    };
    knownExclusions = [
      "Table Tax, zero-rated, exempt and other special treatment requires an exact current law, schedule or table entry.",
      "Special registration cases, input-tax recovery, invoice requirements, filing, withholding, remittance and penalties are not modeled.",
      "Proposed amendments are excluded until enacted, published and effective.",
    ];
    disclaimer =
      "Egypt VAT planning estimate only. Confirm classification, registration, invoicing, filing and remittance with ETA or a qualified tax professional.";
  } else if (artifactPath === "assets/js/engines/ng-cit.js") {
    countryCode = "NG";
    jurisdictions = ["NG"];
    const country = countries.find((entry) => entry.id === countryCode);
    sourceJurisdictions = [country ? country.sourceJurisdiction : countryCode];
    currency = country ? country.currency : "NGN";
    const verification =
      toolVerification.tools && toolVerification.tools["ng-cit"];
    if (verification) {
      sources = sourceRefsFromVerification(verification);
      lastVerified = verification.last_verified;
      effective = {
        effectiveFrom: verification.effective_from || null,
        effectiveTo: verification.effective_to || null,
        effectiveDateStatus: verification.effective_from
          ? "declared"
          : "review-required",
      };
    }
    knownExclusions = [
      "The engine accepts reviewed total-profits and assessable-profits inputs; it does not derive statutory tax bases.",
      "Minimum effective tax, losses, incentives, transition adjustments and specialised sectors are not calculated.",
      "The result is not a return, assessment, filing instruction or substitute for NRS guidance or professional advice.",
    ];
    disclaimer =
      "Nigeria company-tax planning estimate only. Confirm classification, statutory profit bases, incentives, losses, specialised-sector treatment, filing and payment with NRS or a qualified tax professional.";
  } else if (artifactPath === "assets/js/engines/ng-cgt.js") {
    countryCode = "NG";
    jurisdictions = ["NG"];
    const country = countries.find((entry) => entry.id === countryCode);
    sourceJurisdictions = [country ? country.sourceJurisdiction : countryCode];
    currency = country ? country.currency : "NGN";
    const verification =
      toolVerification.tools && toolVerification.tools["ng-cgt"];
    if (verification) {
      sources = sourceRefsFromVerification(verification);
      lastVerified = verification.last_verified;
      effective = {
        effectiveFrom: verification.effective_from || null,
        effectiveTo: verification.effective_to || null,
        effectiveDateStatus: verification.effective_from
          ? "declared"
          : "review-required",
      };
    }
    knownExclusions = [
      "Part disposals, valuation disputes, gifts, compensation, insurance, trusts and restructurings are not calculated.",
      "Non-resident indirect transfers and transaction-specific exemptions require professional review.",
      "The result is not a return, assessment, filing instruction or substitute for NRS guidance or professional advice.",
    ];
    disclaimer =
      "Nigeria disposal-tax planning estimate only. Confirm classification, deductions, exemptions, filing and payment with NRS, the relevant state tax authority or a qualified tax professional.";
  } else if (artifactPath === "assets/js/engines/mortgage-planner.js") {
    const source = (sourceRegistry.sources || []).find(
      (entry) => entry.id === "mortgage-planning-method",
    );
    if (source) {
      sources = [
        Object.assign(
          {},
          sourceTemplate(
            classification.riskDomain,
            sourceRegistry,
            artifactPath,
          ),
          { authorityStatus: "source-reviewed" },
        ),
      ];
      lastVerified =
        source.lastReviewedAt || source.lastCheckedAt || lastVerified;
    }
  } else if (artifactPath === "assets/js/engines/loan-compare.js") {
    const source = (sourceRegistry.sources || []).find(
      (entry) => entry.id === "loan-comparison-method",
    );
    if (source) {
      sources = [
        Object.assign(
          {},
          sourceTemplate(
            classification.riskDomain,
            sourceRegistry,
            artifactPath,
          ),
          { authorityStatus: "source-reviewed" },
        ),
      ];
      lastVerified =
        source.lastReviewedAt || source.lastCheckedAt || lastVerified;
    }
  } else if (artifactPath === "assets/js/engines/backup-power-costs.js") {
    engine = require(path.join(root, artifactPath));
    const source = (sourceRegistry.sources || []).find(
      (entry) => entry.id === "backup-power-costs-user-input-method",
    );
    if (source) {
      sources = [
        Object.assign(
          {},
          sourceTemplate(
            classification.riskDomain,
            sourceRegistry,
            artifactPath,
          ),
          { authorityStatus: "source-reviewed" },
        ),
      ];
      lastVerified =
        source.lastReviewedAt || source.lastCheckedAt || lastVerified;
    }
    knownExclusions = [
      "Financing, inflation, tax, salvage, degradation, staged replacement, solar recharge energy, downtime and lost business are excluded unless represented in entered assumptions.",
      "The comparison does not size equipment, model surge load, predict solar yield, verify electrical safety, calculate payback or provide a lifecycle-cost verdict.",
    ];
    disclaimer =
      "Backup-power planning comparison only. Confirm load and surge sizing, usable capacity, component life, local energy prices, written quotes, installation and electrical safety before purchase.";
  } else if (artifactPath === "assets/js/engines/salary-offer-compare.js") {
    engine = require(path.join(root, artifactPath));
    const source = (sourceRegistry.sources || []).find(
      (entry) => entry.id === "salary-offer-comparison-method",
    );
    if (source) {
      sources = [
        Object.assign(
          {},
          sourceTemplate(
            classification.riskDomain,
            sourceRegistry,
            artifactPath,
          ),
          { authorityStatus: "source-reviewed" },
        ),
      ];
      lastVerified =
        source.lastReviewedAt || source.lastCheckedAt || lastVerified;
    }
    knownExclusions = [
      "Market salary bands, role and country benchmarks, exchange rates, purchasing-power comparisons, tax and net-pay calculations are excluded.",
      "Remote-work, skill-premium, gender-gap, promotion-timeline and recruiter claims are excluded.",
      "Only two user-entered written packages in one user-declared currency are compared; no employer or personal data is transmitted.",
    ];
    disclaimer =
      "Private planning worksheet only. Confirm each written offer, currency, pay period, benefit value, working-time assumption, tax treatment and local rule before deciding.";
  } else if (artifactPath === "assets/js/engines/salary-evidence-notebook.js") {
    engine = require(path.join(root, artifactPath));
    const source = (sourceRegistry.sources || []).find(
      (entry) => entry.id === "salary-evidence-notebook-method",
    );
    if (source) {
      sources = [
        Object.assign(
          {},
          sourceTemplate(
            classification.riskDomain,
            sourceRegistry,
            artifactPath,
          ),
          { authorityStatus: "source-reviewed" },
        ),
      ];
      lastVerified =
        source.lastReviewedAt || source.lastCheckedAt || lastVerified;
    }
    knownExclusions = [
      "No seeded salary values, representative market benchmark, country or role band, FX, PPP, tax, net-pay conversion or outlier deletion is supplied.",
      "Only user-entered observations with one comparable country, city scope, role, experience, currency and gross/net basis are summarized.",
      "No observation, employer, proof URL or personal identifier is persisted or transmitted.",
    ];
    disclaimer =
      "Descriptive private sample only. Confirm the evidence, comparable scope, currency, pay basis, freshness and local rules; this is not an official wage schedule, market benchmark, fair-pay conclusion or recommendation.";
  } else if (
    artifactPath === "assets/js/engines/retirement-scenario-planner.js"
  ) {
    engine = require(path.join(root, artifactPath));
    const source = (sourceRegistry.sources || []).find(
      (entry) => entry.id === "retirement-scenario-user-input-method",
    );
    if (source) {
      sources = [
        Object.assign(
          {},
          sourceTemplate(
            classification.riskDomain,
            sourceRegistry,
            artifactPath,
          ),
          { authorityStatus: "source-reviewed" },
        ),
      ];
      lastVerified =
        source.lastReviewedAt || source.lastCheckedAt || lastVerified;
    }
    knownExclusions = [
      "No country inflation, return, pension, withdrawal-rate or investment-allocation preset is supplied.",
      "The engine is a deterministic today-money scenario, not a forecast, guarantee, safe-withdrawal conclusion or investment recommendation.",
      "Tax, benefit access, sequence risk, longevity, provider fees and legal rules require separate current evidence unless represented in the user assumptions.",
    ];
    disclaimer =
      "Private planning scenario only. Confirm current pension statements, tax treatment, fees, benefit access, inflation basis, real-return and withdrawal assumptions with qualified sources before deciding.";
  } else if (artifactPath === "assets/js/engines/payslip-draft.js") {
    const source = (sourceRegistry.sources || []).find(
      (entry) => entry.id === "payslip-draft-method",
    );
    if (source) {
      sources = [
        Object.assign(
          {},
          sourceTemplate(
            classification.riskDomain,
            sourceRegistry,
            artifactPath,
          ),
          { authorityStatus: "source-reviewed" },
        ),
        {
          registryId: "payslip-draft-method",
          title:
            "South Africa Department of Employment and Labour - Form BCEA4 Pay Slip",
          url: "https://www.labour.gov.za/DocumentCenter/Pages/Form-BCEA4---Pay-Slip.aspx",
          kind: "authority-link",
          authorityStatus: "source-reviewed",
        },
      ];
      lastVerified =
        source.lastReviewedAt || source.lastCheckedAt || lastVerified;
    }
    knownExclusions = [
      "PAYE, pension, social contributions and every other statutory amount must be supplied from an approved payroll record.",
      "The draft does not verify deduction authority, payment, remittance, filing, authenticity, employer approval or legal compliance.",
      "ILO C095 is high-level context and South Africa BCEA4 is one country example; neither is a pan-African field prescription.",
    ];
    disclaimer =
      "Private draft only. Confirm every identity, amount, deduction authority, statutory treatment and local issue requirement before relying on the document.";
  }

  const canonicalCurrency = countryCode
    ? currencyForCountry(countries, countryCode)
    : currency;
  const currencyOverride =
    countryCode && canonicalCurrency && currency !== canonicalCurrency
      ? {
          canonicalCurrency,
          runtimeCurrency: currency,
          status: "review-required",
          reason:
            "Runtime explicitly uses a currency different from the canonical country record; no automatic substitution is allowed.",
        }
      : null;

  return {
    id: formulaId,
    formulaFamily,
    formulaVersion: makeFormulaVersion(
      (engine && engine.lastUpdated) || "legacy-current",
      digest,
    ),
    artifactPath,
    artifactDigest: digest,
    jurisdictions,
    sourceJurisdictions,
    applicablePopulation: applicablePopulationFor(classification.riskDomain),
    sources,
    ...effective,
    parameters: safeFormulaParameters(engine, artifactPath, digest),
    rounding: roundingForEngine(engine),
    currency,
    currencyAssumption: currencyOverride
      ? "Explicit runtime currency override; formula remains review-required and is never silently relabeled."
      : currency === null
        ? "Non-currency result."
        : "Currency follows the declared runtime or canonical country data.",
    currencyOverride,
    units: currency === null ? ["domain-specific"] : ["currency"],
    knownExclusions,
    lastVerified,
    verificationBasis: sources.some(
      (source) => source.authorityStatus === "source-reviewed",
    )
      ? "AfroTools source audit"
      : "Artifact or reviewed-dataset date; authority review may still be required.",
    owner: "AfroTools formula review owners",
    disclaimer,
    protectedDuplicates: protectedDuplicates.filter((file) =>
      fs.existsSync(path.join(root, file)),
    ),
    riskLevel: classification.riskLevel,
    riskDomain: classification.riskDomain,
    supportStatus: currencyOverride ? "review-required" : "registered",
  };
}

function buildInventoryAndFormulas(root) {
  const countries = readJson(path.join(root, "data/registry/countries.json"));
  const sourceRegistry = readJson(path.join(root, "data/source-registry.json"));
  const toolVerification = readJson(
    path.join(root, "data/tool-verification.json"),
  );
  const routeBuild = buildRouteFormulas(root, toolVerification, countries);
  const formulas = routeBuild.formulas.slice();
  const formulaIdsByArtifact = routeBuild.formulaIdsByArtifact;
  const inventory = [];

  for (const artifactPath of discoverEngineArtifacts(root)) {
    const classification = classifyArtifact(artifactPath);
    let formulaIds = formulaIdsByArtifact.get(artifactPath) || [];
    if (
      !artifactPath.endsWith(".html") &&
      classification.riskLevel !== "low" &&
      formulaIds.length === 0
    ) {
      const formula = buildJsFormula(
        root,
        artifactPath,
        classification,
        countries,
        sourceRegistry,
        toolVerification,
      );
      formulas.push(formula);
      formulaIds = [formula.id];
    }
    inventory.push({
      id: idFromPath(artifactPath),
      artifactPath,
      formulaFamily: formulaIds.length
        ? formulas.find((formula) => formula.id === formulaIds[0]).formulaFamily
        : "general-utility",
      riskLevel: classification.riskLevel,
      riskDomain: classification.riskDomain,
      rationale: classification.rationale,
      formulaIds: formulaIds.slice().sort(),
      routeIds: routeBuild.routeMappings
        .filter((mapping) => formulaIds.includes(mapping.formulaId))
        .map((mapping) => mapping.toolId)
        .sort(),
      owner:
        classification.riskLevel === "low"
          ? "AfroTools tool owners"
          : "AfroTools formula review owners",
    });
  }

  return {
    inventory: {
      $schema: "./calculation-quality.schema.json#/$defs/EngineInventory",
      schemaVersion: 1,
      generatedFrom: ENGINE_ROOTS,
      engines: inventory.sort((a, b) =>
        a.artifactPath.localeCompare(b.artifactPath),
      ),
    },
    formulas: {
      $schema: "./calculation-quality.schema.json#/$defs/FormulaRegistry",
      schemaVersion: 1,
      formulas: formulas.sort((a, b) => a.id.localeCompare(b.id)),
      routeMappings: routeBuild.routeMappings.sort((a, b) =>
        a.toolId.localeCompare(b.toolId),
      ),
    },
  };
}

function getPath(value, selector) {
  return String(selector)
    .split(".")
    .reduce(
      (current, part) => (current == null ? undefined : current[part]),
      value,
    );
}

function expectedSelectors(result, selectors) {
  return Object.fromEntries(
    selectors.map((selector) => [
      selector,
      stableSortObject(getPath(result, selector)),
    ]),
  );
}

function generateGoldenFixtures(formulas, root) {
  const engineRegistry = require(path.join(root, "netlify/functions/_engines"));
  const byCountry = new Map(
    formulas.formulas
      .filter((formula) => formula.formulaFamily === "paye-server")
      .map((formula) => [formula.jurisdictions[0], formula]),
  );
  const fixtures = [];
  const selectors = [
    "tax.netTax",
    "result.netAnnual",
    "result.netMonthly",
    "deductions.totalDeductions",
  ];

  function addCalculate(code, suffix, input, caseClasses, extraSelectors) {
    const engine = engineRegistry.get(code);
    const formula = byCountry.get(code);
    if (!engine || !formula) return;
    const params = { ...input };
    delete params.country;
    const result = engine.calculate(params);
    fixtures.push({
      id: "paye-" + code.toLowerCase() + "-" + suffix,
      formulaId: formula.id,
      formulaVersion: formula.formulaVersion,
      caseClasses,
      operation: "paye-calculate",
      input: { country: code, ...params },
      expected: expectedSelectors(result, extraSelectors || selectors),
      tolerance: 0.01,
      evidence: formula.sources[0],
      changeNote: "baseline-no-change",
    });
  }

  for (const code of engineRegistry.listCountryCodes()) {
    addCalculate(code, "zero", { grossAnnual: 0 }, ["zero_input"]);
    addCalculate(code, "defaults", { grossAnnual: 1000000 }, [
      "missing_optional_input",
    ]);
    addCalculate(code, "large-decimal", { grossAnnual: 1000000000.55 }, [
      "very_large_value",
      "decimal_precision",
    ]);
  }

  addCalculate("ZA", "exact-threshold", { grossAnnual: 95750 }, [
    "exact_threshold",
    "band_boundary",
  ]);
  addCalculate("KE", "rounding-stage", { grossAnnual: 1200000 }, [
    "rounding_stage",
  ]);
  addCalculate(
    "NG",
    "pita-2025",
    { grossAnnual: 5000000, regime: "PITA_2025", pension: true, nhf: false },
    ["changed_tax_year"],
  );
  addCalculate(
    "NG",
    "nta-2026",
    { grossAnnual: 5000000, regime: "NTA_2026", pension: true, nhf: false },
    ["changed_tax_year"],
  );

  const ngFormula = byCountry.get("NG");
  const zaFormula = byCountry.get("ZA");
  fixtures.push({
    id: "paye-negative-input-rejected",
    formulaId: ngFormula.id,
    formulaVersion: ngFormula.formulaVersion,
    caseClasses: ["negative_input"],
    operation: "tax-input-rejection",
    input: { grossAnnual: -1 },
    expected: { error: "grossAnnual must be greater than 0" },
    tolerance: 0,
    evidence: ngFormula.sources[0],
    changeNote: "baseline-no-change",
  });

  for (const item of [
    {
      id: "unsupported-jurisdiction",
      jurisdiction: "XX",
      effectiveOn: "2026-01-01",
      classes: ["unsupported_jurisdiction"],
      error: "UNSUPPORTED_JURISDICTION",
    },
    {
      id: "unsupported-date",
      jurisdiction: "ZA",
      effectiveOn: "2026-03-01",
      classes: ["unsupported_date", "date_boundary"],
      error: "UNSUPPORTED_DATE",
    },
    {
      id: "leap-day-date",
      jurisdiction: "ZA",
      effectiveOn: "2024-02-29",
      classes: ["leap_year_date"],
      error: "UNSUPPORTED_DATE",
    },
  ]) {
    fixtures.push({
      id: "formula-resolve-" + item.id,
      formulaId: zaFormula.id,
      formulaVersion: zaFormula.formulaVersion,
      caseClasses: item.classes,
      operation: "formula-resolve",
      input: {
        formulaFamily: "paye-server",
        jurisdiction: item.jurisdiction,
        effectiveOn: item.effectiveOn,
      },
      expected: { ok: false, error: item.error },
      tolerance: 0,
      evidence: zaFormula.sources[0],
      changeNote: "baseline-no-change",
    });
  }

  const zaUifFormula = formulas.formulas.find(
    (formula) => formula.id === "route-za-uif",
  );
  if (zaUifFormula) {
    const zaUifEngine = require(path.join(root, zaUifFormula.artifactPath));
    const uifCases = [
      {
        id: "za-uif-contribution-ceiling",
        operation: "za-uif-contribution",
        caseClasses: ["exact_ceiling", "statutory_contribution"],
        input: { monthlyRemuneration: 25000, employees: 1, months: 1 },
        selectors: [
          "contributionBase",
          "employeeMonthly",
          "employerMonthly",
          "combinedMonthly",
        ],
      },
      {
        id: "za-uif-day-238-239-boundary",
        operation: "za-uif-benefit",
        caseClasses: ["band_boundary", "maximum_credit_cycle"],
        input: {
          averageMonthlyRemuneration: 17712,
          availableCreditDays: 365,
          requestedDays: 239,
        },
        selectors: [
          "dailyIncome",
          "replacementRate",
          "slidingTierDays",
          "secondTierDays",
          "estimatedBenefit",
        ],
      },
      {
        id: "za-uif-maternity-above-ceiling-top-up",
        operation: "za-uif-maternity",
        caseClasses: ["above_contribution_ceiling", "maternity_top_up"],
        input: {
          averageMonthlyRemuneration: 30000,
          employerMonthlyPay: 25000,
          requestedDays: 121,
        },
        selectors: [
          "dailyIncome",
          "normalDailyRemuneration",
          "dailyBenefit",
          "payableDays",
          "estimatedBenefit",
          "topUpLimited",
        ],
      },
    ];
    for (const item of uifCases) {
      const result =
        item.operation === "za-uif-contribution"
          ? zaUifEngine.calculateContribution(item.input)
          : item.operation === "za-uif-benefit"
            ? zaUifEngine.calculateBenefitPlan(item.input)
            : zaUifEngine.calculateMaternityPlan(item.input);
      fixtures.push({
        id: item.id,
        formulaId: zaUifFormula.id,
        formulaVersion: zaUifFormula.formulaVersion,
        caseClasses: item.caseClasses,
        operation: item.operation,
        input: item.input,
        expected: expectedSelectors(result, item.selectors),
        tolerance: 0.01,
        evidence: zaUifFormula.sources[0],
        changeNote: "reviewed-2026-07-22",
      });
    }
  }

  const investmentFormula = formulas.formulas.find(
    (formula) => formula.id === "route-investment-return",
  );
  if (investmentFormula) {
    const investmentEngine = require(
      path.join(root, investmentFormula.artifactPath),
    );
    const investmentCases = [
      {
        id: "investment-return-zero-rate",
        caseClasses: ["zero_input"],
        input: {
          initialInvestment: 1000,
          monthlyContribution: 100,
          annualRatePercent: 0,
          years: 1,
          compoundsPerYear: 12,
          contributionTiming: "end",
          inflationRatePercent: 0,
        },
        selectors: ["finalValue", "totalContributed", "projectedGain"],
      },
      {
        id: "investment-return-monthly-real-return",
        caseClasses: ["decimal_precision", "rounding_stage"],
        input: {
          initialInvestment: 1000,
          monthlyContribution: 100,
          annualRatePercent: 12,
          years: 1,
          compoundsPerYear: 12,
          contributionTiming: "end",
          inflationRatePercent: 6,
        },
        selectors: [
          "finalValue",
          "effectiveAnnualRate",
          "realEffectiveAnnualRate",
          "purchasingPowerValue",
        ],
      },
      {
        id: "investment-return-beginning-timing",
        caseClasses: ["exact_threshold"],
        input: {
          initialInvestment: 1000,
          monthlyContribution: 100,
          annualRatePercent: 12,
          years: 1,
          compoundsPerYear: 12,
          contributionTiming: "beginning",
          inflationRatePercent: 0,
        },
        selectors: ["finalValue", "totalContributed", "projectedGain"],
      },
      {
        id: "investment-return-annual-compounding",
        caseClasses: ["exact_threshold"],
        input: {
          initialInvestment: 1000,
          monthlyContribution: 0,
          annualRatePercent: 12,
          years: 1,
          compoundsPerYear: 1,
          contributionTiming: "end",
          inflationRatePercent: 0,
        },
        selectors: ["finalValue", "lumpSumCagr", "effectiveAnnualRate"],
      },
      {
        id: "investment-return-negative-return",
        caseClasses: ["negative_input"],
        input: {
          initialInvestment: 1000,
          monthlyContribution: 0,
          annualRatePercent: -10,
          years: 1,
          compoundsPerYear: 1,
          contributionTiming: "end",
          inflationRatePercent: 0,
        },
        selectors: ["finalValue", "projectedGain", "gainOnContributions"],
      },
    ];
    for (const item of investmentCases) {
      const result = investmentEngine.project(item.input);
      fixtures.push({
        id: item.id,
        formulaId: investmentFormula.id,
        formulaVersion: investmentFormula.formulaVersion,
        caseClasses: item.caseClasses,
        operation: "investment-return-project",
        input: item.input,
        expected: expectedSelectors(result, item.selectors),
        tolerance: 0.01,
        evidence: investmentFormula.sources[0],
        changeNote: "reviewed-2026-07-22",
      });
    }
  }

  const cryptoCgtFormula = formulas.formulas.find(
    (formula) => formula.id === "route-crypto-cgt",
  );
  if (cryptoCgtFormula) {
    const cryptoCgtEngine = require(
      path.join(root, cryptoCgtFormula.artifactPath),
    );
    const common = {
      taxpayerType: "individual",
      classification: "capital-confirmed",
      scopeConfirmed: true,
      acquisitionCosts: 0,
    };
    const cryptoCases = [
      {
        id: "crypto-cgt-ng-progressive",
        caseClasses: ["band_boundary", "rounding_stage"],
        input: {
          ...common,
          country: "NG",
          disposalDate: "2026-06-01",
          proceeds: 20000000,
          acquisitionCost: 10000000,
          disposalCosts: 1000000,
          otherChargeableIncome: 0,
        },
        selectors: ["transactionGain", "taxableBase", "estimatedTax"],
      },
      {
        id: "crypto-cgt-ke-confirmed",
        caseClasses: ["exact_threshold"],
        input: {
          ...common,
          country: "KE",
          disposalDate: "2026-06-01",
          proceeds: 10000000,
          acquisitionCost: 4000000,
          disposalCosts: 500000,
        },
        selectors: ["transactionGain", "estimatedTax"],
      },
      {
        id: "crypto-cgt-za-assessment-year",
        caseClasses: ["date_boundary", "decimal_precision"],
        input: {
          ...common,
          country: "ZA",
          disposalDate: "2026-03-01",
          proceeds: 2500000,
          acquisitionCost: 1750000,
          disposalCosts: 0,
          otherCapitalGains: 0,
          currentCapitalLosses: 0,
          assessedCapitalLoss: 0,
          otherTaxableIncome: 500000,
        },
        selectors: ["transactionGain", "taxableBase", "estimatedTax"],
      },
      {
        id: "crypto-cgt-gh-isolated",
        caseClasses: ["exact_threshold"],
        input: {
          ...common,
          country: "GH",
          disposalDate: "2026-06-01",
          proceeds: 300000,
          acquisitionCost: 190000,
          disposalCosts: 10000,
        },
        selectors: ["transactionGain", "estimatedTax"],
      },
      {
        id: "crypto-cgt-capital-loss",
        caseClasses: ["negative_input"],
        input: {
          ...common,
          country: "KE",
          disposalDate: "2026-06-01",
          proceeds: 100,
          acquisitionCost: 150,
          disposalCosts: 0,
        },
        selectors: ["transactionGain", "capitalLoss", "estimatedTax"],
      },
    ];
    for (const item of cryptoCases) {
      const result = cryptoCgtEngine.calculate(item.input);
      fixtures.push({
        id: item.id,
        formulaId: cryptoCgtFormula.id,
        formulaVersion: cryptoCgtFormula.formulaVersion,
        caseClasses: item.caseClasses,
        operation: "crypto-cgt-calculate",
        input: item.input,
        expected: expectedSelectors(result, item.selectors),
        tolerance: 0.01,
        evidence: cryptoCgtFormula.sources[0],
        changeNote: "reviewed-2026-07-22",
      });
    }
  }

  const pensionProjectionFormula = formulas.formulas.find(
    (formula) => formula.id === "route-pension-proj",
  );
  if (pensionProjectionFormula) {
    const pensionEngine = require(
      path.join(root, pensionProjectionFormula.artifactPath),
    );
    const common = {
      currency: "NGN",
      sourceLabel: "Current provider statement",
      sourceCheckedDate: "2026-07-22",
      asOfDate: "2026-07-22",
      schemeInputsConfirmed: true,
      assumptionsConfirmed: true,
    };
    const pensionCases = [
      {
        id: "pension-projection-one-year",
        caseClasses: ["decimal_precision", "rounding_stage"],
        input: {
          ...common,
          currentBalance: 1000000,
          monthlyPersonal: 50000,
          monthlyEmployer: 50000,
          monthlyVoluntary: 0,
          years: 1,
          annualReturnPercent: 12,
          annualFeePercent: 0,
          inflationPercent: 6,
          contributionGrowthPercent: 0,
        },
        selectors: [
          "base.endingBalance",
          "base.realValue",
          "base.futureContributions",
          "base.investmentGrowth",
        ],
      },
      {
        id: "pension-projection-fee-drag",
        caseClasses: ["exact_threshold"],
        input: {
          ...common,
          currentBalance: 1000000,
          monthlyPersonal: 0,
          monthlyEmployer: 0,
          monthlyVoluntary: 0,
          years: 10,
          annualReturnPercent: 8,
          annualFeePercent: 2,
          inflationPercent: 0,
          contributionGrowthPercent: 0,
        },
        selectors: [
          "base.netAnnualReturnPercent",
          "base.endingBalance",
          "base.futureContributions",
        ],
      },
      {
        id: "pension-projection-contribution-growth",
        caseClasses: ["zero_input"],
        input: {
          ...common,
          currentBalance: 0,
          monthlyPersonal: 10000,
          monthlyEmployer: 0,
          monthlyVoluntary: 0,
          years: 2,
          annualReturnPercent: 0,
          annualFeePercent: 0,
          inflationPercent: 0,
          contributionGrowthPercent: 10,
        },
        selectors: [
          "base.endingBalance",
          "base.personalContributions",
          "base.investmentGrowth",
        ],
      },
    ];
    for (const item of pensionCases) {
      const result = pensionEngine.calculate(item.input);
      fixtures.push({
        id: item.id,
        formulaId: pensionProjectionFormula.id,
        formulaVersion: pensionProjectionFormula.formulaVersion,
        caseClasses: item.caseClasses,
        operation: "pension-projection-calculate",
        input: item.input,
        expected: expectedSelectors(result, item.selectors),
        tolerance: 0.01,
        evidence: pensionProjectionFormula.sources[0],
        changeNote: "reviewed-2026-07-22",
      });
    }
  }

  const staffCostFormula = formulas.formulas.find(
    (formula) => formula.id === "route-staff-cost",
  );
  if (staffCostFormula) {
    const staffCostEngine = require(
      path.join(root, staffCostFormula.artifactPath),
    );
    const common = {
      currency: "NGN",
      sourceLabel: "Current payroll adviser schedule",
      sourceCheckedDate: "2026-07-22",
      asOfDate: "2026-07-22",
      employeeStatusConfirmed: true,
      obligationEvidenceConfirmed: true,
    };
    const staffCases = [
      {
        id: "staff-cost-full-horizon",
        caseClasses: ["decimal_precision", "rounding_stage"],
        input: {
          ...common,
          headcount: 5,
          horizonMonths: 12,
          monthlySalary: 500000,
          monthlyEmployerObligations: 60000,
          monthlyBenefits: 40000,
          monthlyOtherRecurring: 25000,
          recruitmentCost: 100000,
          equipmentCost: 350000,
          annualExtras: 500000,
          contingencyPercent: 5,
        },
        selectors: [
          "teamRecurringMonthly",
          "oneOffTeam",
          "annualExtrasForHorizon",
          "contingency",
          "horizonTotal",
          "monthlyPlanningAverage",
          "loadPercent",
        ],
      },
      {
        id: "staff-cost-part-year-proration",
        caseClasses: ["exact_threshold"],
        input: {
          ...common,
          headcount: 2,
          horizonMonths: 6,
          monthlySalary: 500000,
          monthlyEmployerObligations: 60000,
          monthlyBenefits: 40000,
          monthlyOtherRecurring: 25000,
          recruitmentCost: 100000,
          equipmentCost: 350000,
          annualExtras: 120000,
          contingencyPercent: 0,
        },
        selectors: [
          "annualExtrasForHorizon",
          "horizonTotal",
          "costPerPersonForHorizon",
        ],
      },
      {
        id: "staff-cost-salary-only",
        caseClasses: ["zero_input"],
        input: {
          ...common,
          headcount: 1,
          horizonMonths: 12,
          monthlySalary: 500000,
          monthlyEmployerObligations: 0,
          monthlyBenefits: 0,
          monthlyOtherRecurring: 0,
          recruitmentCost: 0,
          equipmentCost: 0,
          annualExtras: 0,
          contingencyPercent: 0,
        },
        selectors: ["horizonTotal", "loadAboveSalary", "loadPercent"],
      },
    ];
    for (const item of staffCases) {
      const result = staffCostEngine.calculate(item.input);
      fixtures.push({
        id: item.id,
        formulaId: staffCostFormula.id,
        formulaVersion: staffCostFormula.formulaVersion,
        caseClasses: item.caseClasses,
        operation: "staff-cost-calculate",
        input: item.input,
        expected: expectedSelectors(result, item.selectors),
        tolerance: 0.01,
        evidence: staffCostFormula.sources[0],
        changeNote: "reviewed-2026-07-22",
      });
    }
  }

  const kmVatFormula = formulas.formulas.find(
    (formula) => formula.id === "route-km-vat",
  );
  if (kmVatFormula) {
    const kmVatEngine = require(path.join(root, kmVatFormula.artifactPath));
    const kmCases = [
      {
        id: "km-tc-standard-add",
        operation: "km-tc-calculate",
        caseClasses: ["standard_rate", "tax_addition"],
        input: { amount: 100000, mode: "add", rateKind: "standard" },
        selectors: ["rate", "net", "tax", "gross"],
      },
      {
        id: "km-tc-article-152-mobile",
        operation: "km-tc-calculate",
        caseClasses: ["special_rate", "evidence_gated"],
        input: {
          amount: 100000,
          mode: "add",
          rateKind: "article-152-mobile-recharge-confirmed",
          rateEvidenceConfirmed: true,
          rateEvidenceType: "article-152-mobile-recharge",
        },
        selectors: ["rate", "net", "tax", "gross"],
      },
      {
        id: "km-tc-importer-threshold-lower-boundary",
        operation: "km-tc-threshold",
        caseClasses: ["exact_threshold", "importer_exception"],
        input: { turnover: 15000000, importerConfirmed: true },
        selectors: ["status", "threshold"],
      },
      {
        id: "km-tc-general-threshold-boundary",
        operation: "km-tc-threshold",
        caseClasses: ["exact_threshold", "registration_screen"],
        input: { turnover: 20000000, importerConfirmed: false },
        selectors: ["status", "threshold"],
      },
    ];
    for (const item of kmCases) {
      const result =
        item.operation === "km-tc-calculate"
          ? kmVatEngine.calculate(item.input)
          : kmVatEngine.thresholdScreen(
              item.input.turnover,
              item.input.importerConfirmed,
            );
      fixtures.push({
        id: item.id,
        formulaId: kmVatFormula.id,
        formulaVersion: kmVatFormula.formulaVersion,
        caseClasses: item.caseClasses,
        operation: item.operation,
        input: item.input,
        expected: expectedSelectors(result, item.selectors),
        tolerance: 0.01,
        evidence: kmVatFormula.sources[0],
        changeNote: "reviewed-2026-07-22",
      });
    }
  }

  const cgVatFormula = formulas.formulas.find(
    (formula) => formula.id === "route-cg-vat",
  );
  if (cgVatFormula) {
    const cgVatEngine = require(path.join(root, cgVatFormula.artifactPath));
    const cgCases = [
      {
        id: "cg-vat-standard-add-components",
        operation: "cg-vat-calculate",
        caseClasses: ["standard_rate", "tax_addition"],
        input: { amount: 100000, mode: "add", rateKind: "standard" },
        selectors: [
          "vatRate",
          "centimesRate",
          "effectiveRate",
          "net",
          "vat",
          "centimes",
          "totalTax",
          "gross",
        ],
      },
      {
        id: "cg-vat-standard-extract-components",
        operation: "cg-vat-calculate",
        caseClasses: ["standard_rate", "tax_extraction"],
        input: { amount: 118900, mode: "extract", rateKind: "standard" },
        selectors: [
          "effectiveRate",
          "net",
          "vat",
          "centimes",
          "totalTax",
          "gross",
        ],
      },
      {
        id: "cg-vat-annex-5-confirmed",
        operation: "cg-vat-calculate",
        caseClasses: ["special_rate", "evidence_gated"],
        input: {
          amount: 100000,
          mode: "add",
          rateKind: "annex-5-confirmed",
          rateEvidenceConfirmed: true,
          rateEvidenceType: "annex-5-tariff-line",
        },
        selectors: [
          "vatRate",
          "effectiveRate",
          "vat",
          "centimes",
          "totalTax",
          "gross",
        ],
      },
      {
        id: "cg-vat-real-regime-threshold",
        operation: "cg-vat-threshold",
        caseClasses: ["exact_threshold", "registration_screen"],
        input: { turnover: 100000000 },
        selectors: ["status", "threshold", "determinesRegistration"],
      },
    ];
    for (const item of cgCases) {
      const result =
        item.operation === "cg-vat-calculate"
          ? cgVatEngine.calculate(item.input)
          : cgVatEngine.registrationScreen(item.input.turnover);
      fixtures.push({
        id: item.id,
        formulaId: cgVatFormula.id,
        formulaVersion: cgVatFormula.formulaVersion,
        caseClasses: item.caseClasses,
        operation: item.operation,
        input: item.input,
        expected: expectedSelectors(result, item.selectors),
        tolerance: 0.01,
        evidence: cgVatFormula.sources[0],
        changeNote: "reviewed-2026-07-22",
      });
    }
  }

  const ciVatFormula = formulas.formulas.find(
    (formula) => formula.id === "route-ci-vat",
  );
  if (ciVatFormula) {
    const ciVatEngine = require(path.join(root, ciVatFormula.artifactPath));
    const ciCases = [
      {
        id: "ci-vat-standard-add",
        operation: "ci-vat-calculate",
        caseClasses: ["standard_rate", "tax_addition"],
        input: { amount: 100000, mode: "add", rateKind: "standard" },
        selectors: ["rate", "net", "vat", "gross"],
      },
      {
        id: "ci-vat-standard-extract",
        operation: "ci-vat-calculate",
        caseClasses: ["standard_rate", "tax_extraction"],
        input: { amount: 118000, mode: "extract", rateKind: "standard" },
        selectors: ["rate", "net", "vat", "gross"],
      },
      {
        id: "ci-vat-ordinance-2026-confirmed",
        operation: "ci-vat-calculate",
        caseClasses: ["special_rate", "evidence_gated"],
        input: {
          amount: 100000,
          mode: "add",
          rateKind: "ordinance-2026-reduced-confirmed",
          rateEvidenceConfirmed: true,
          rateEvidenceType: "ordinance-2026-03-item",
        },
        selectors: ["rate", "net", "vat", "gross"],
      },
      {
        id: "ci-vat-rsi-lower-boundary",
        operation: "ci-vat-regime",
        caseClasses: ["band_boundary", "registration_screen"],
        input: { turnover: 200000001 },
        selectors: ["status", "determinesVatLiability"],
      },
    ];
    for (const item of ciCases) {
      const result =
        item.operation === "ci-vat-calculate"
          ? ciVatEngine.calculate(item.input)
          : ciVatEngine.regimeScreen(item.input.turnover);
      fixtures.push({
        id: item.id,
        formulaId: ciVatFormula.id,
        formulaVersion: ciVatFormula.formulaVersion,
        caseClasses: item.caseClasses,
        operation: item.operation,
        input: item.input,
        expected: expectedSelectors(result, item.selectors),
        tolerance: 0.01,
        evidence: ciVatFormula.sources[0],
        changeNote: "reviewed-2026-07-22",
      });
    }
  }

  const djVatFormula = formulas.formulas.find(
    (formula) => formula.id === "route-dj-vat",
  );
  if (djVatFormula) {
    const djVatEngine = require(path.join(root, djVatFormula.artifactPath));
    const djCases = [
      {
        id: "dj-vat-standard-add",
        operation: "dj-vat-calculate",
        caseClasses: ["standard_rate", "tax_addition"],
        input: { amount: 100000, mode: "add", rateKind: "standard" },
        selectors: ["rate", "net", "vat", "gross", "rounding"],
      },
      {
        id: "dj-vat-standard-extract",
        operation: "dj-vat-calculate",
        caseClasses: ["standard_rate", "tax_extraction"],
        input: { amount: 110000, mode: "extract", rateKind: "standard" },
        selectors: ["rate", "net", "vat", "gross", "rounding"],
      },
      {
        id: "dj-vat-export-confirmed",
        operation: "dj-vat-calculate",
        caseClasses: ["zero_rate", "evidence_gated"],
        input: {
          amount: 100000,
          mode: "add",
          rateKind: "article-19-export-confirmed",
          rateEvidenceConfirmed: true,
          rateEvidenceType: "customs-export-declaration",
        },
        selectors: ["rate", "net", "vat", "gross"],
      },
      {
        id: "dj-vat-next-year-threshold",
        operation: "dj-vat-threshold",
        caseClasses: ["exact_threshold", "registration_screen"],
        input: { turnover: 80000000 },
        selectors: [
          "status",
          "nextYearThreshold",
          "immediateThreshold",
          "determinesLiability",
        ],
      },
      {
        id: "dj-vat-immediate-threshold",
        operation: "dj-vat-threshold",
        caseClasses: ["exact_threshold", "registration_screen"],
        input: { turnover: 120000000 },
        selectors: [
          "status",
          "nextYearThreshold",
          "immediateThreshold",
          "determinesLiability",
        ],
      },
    ];
    for (const item of djCases) {
      const result =
        item.operation === "dj-vat-calculate"
          ? djVatEngine.calculate(item.input)
          : djVatEngine.thresholdScreen(item.input.turnover);
      fixtures.push({
        id: item.id,
        formulaId: djVatFormula.id,
        formulaVersion: djVatFormula.formulaVersion,
        caseClasses: item.caseClasses,
        operation: item.operation,
        input: item.input,
        expected: expectedSelectors(result, item.selectors),
        tolerance: 0,
        evidence: djVatFormula.sources[0],
        changeNote: "reviewed-2026-07-22",
      });
    }
  }

  const cdVatFormula = formulas.formulas.find(
    (formula) => formula.id === "route-cd-vat",
  );
  if (cdVatFormula) {
    const cdVatEngine = require(path.join(root, cdVatFormula.artifactPath));
    const cdCases = [
      {
        id: "cd-vat-standard-add",
        operation: "cd-vat-calculate",
        caseClasses: ["standard_rate", "tax_addition"],
        input: { amount: 100000, mode: "add", rateKind: "standard" },
        selectors: ["rate", "net", "vat", "gross", "rounding"],
      },
      {
        id: "cd-vat-standard-extract",
        operation: "cd-vat-calculate",
        caseClasses: ["standard_rate", "tax_extraction"],
        input: { amount: 116000, mode: "extract", rateKind: "standard" },
        selectors: ["rate", "net", "vat", "gross", "rounding"],
      },
      {
        id: "cd-vat-reduced-confirmed",
        operation: "cd-vat-calculate",
        caseClasses: ["special_rate", "evidence_gated"],
        input: {
          amount: 100000,
          mode: "add",
          rateKind: "current-reduced-item-confirmed",
          rateEvidenceConfirmed: true,
          rateEvidenceType: "current-dgi-eight-percent-item",
        },
        selectors: ["rate", "net", "vat", "gross"],
      },
      {
        id: "cd-vat-export-confirmed",
        operation: "cd-vat-calculate",
        caseClasses: ["zero_rate", "evidence_gated"],
        input: {
          amount: 100000,
          mode: "add",
          rateKind: "qualifying-export-confirmed",
          rateEvidenceConfirmed: true,
          rateEvidenceType: "customs-export-declaration",
        },
        selectors: ["rate", "net", "vat", "gross"],
      },
      {
        id: "cd-vat-registration-threshold",
        operation: "cd-vat-registration",
        caseClasses: ["exact_threshold", "registration_screen"],
        input: { turnover: 80000000, liberalProfession: false },
        selectors: ["status", "threshold", "determinesLiability"],
      },
      {
        id: "cd-vat-liberal-profession",
        operation: "cd-vat-registration",
        caseClasses: ["registration_exception"],
        input: { turnover: 0, liberalProfession: true },
        selectors: ["status", "threshold", "determinesLiability"],
      },
    ];
    for (const item of cdCases) {
      const result =
        item.operation === "cd-vat-calculate"
          ? cdVatEngine.calculate(item.input)
          : cdVatEngine.registrationScreen(
              item.input.turnover,
              item.input.liberalProfession,
            );
      fixtures.push({
        id: item.id,
        formulaId: cdVatFormula.id,
        formulaVersion: cdVatFormula.formulaVersion,
        caseClasses: item.caseClasses,
        operation: item.operation,
        input: item.input,
        expected: expectedSelectors(result, item.selectors),
        tolerance: 0,
        evidence: cdVatFormula.sources[0],
        changeNote: "reviewed-2026-07-22",
      });
    }
  }

  const gqVatFormula = formulas.formulas.find(
    (formula) => formula.id === "route-gq-vat",
  );
  if (gqVatFormula) {
    const gqVatEngine = require(path.join(root, gqVatFormula.artifactPath));
    const gqCases = [
      {
        id: "gq-vat-standard-add",
        operation: "gq-vat-calculate",
        caseClasses: ["standard_rate", "tax_addition"],
        input: { amount: 100000, mode: "add", rateKind: "standard" },
        selectors: ["rate", "net", "vat", "gross", "rounding"],
      },
      {
        id: "gq-vat-standard-extract",
        operation: "gq-vat-calculate",
        caseClasses: ["standard_rate", "tax_extraction"],
        input: { amount: 115000, mode: "extract", rateKind: "standard" },
        selectors: ["rate", "net", "vat", "gross", "rounding"],
      },
      {
        id: "gq-vat-article-13-five-confirmed",
        operation: "gq-vat-calculate",
        caseClasses: ["special_rate", "evidence_gated"],
        input: {
          amount: 100000,
          mode: "add",
          rateKind: "lpge-2026-reduced-import-confirmed",
          rateEvidenceConfirmed: true,
          rateEvidenceType: "lpge-2026-article-13-five-import-line",
        },
        selectors: ["rate", "net", "vat", "gross"],
      },
      {
        id: "gq-vat-article-13-zero-confirmed",
        operation: "gq-vat-calculate",
        caseClasses: ["zero_rate", "evidence_gated"],
        input: {
          amount: 100000,
          mode: "add",
          rateKind: "lpge-2026-zero-import-confirmed",
          rateEvidenceConfirmed: true,
          rateEvidenceType: "lpge-2026-article-13-zero-import-line",
        },
        selectors: ["rate", "net", "vat", "gross"],
      },
    ];
    for (const item of gqCases) {
      const result = gqVatEngine.calculate(item.input);
      fixtures.push({
        id: item.id,
        formulaId: gqVatFormula.id,
        formulaVersion: gqVatFormula.formulaVersion,
        caseClasses: item.caseClasses,
        operation: item.operation,
        input: item.input,
        expected: expectedSelectors(result, item.selectors),
        tolerance: 0,
        evidence: gqVatFormula.sources[0],
        changeNote: "reviewed-2026-07-22",
      });
    }
  }

  const erVatFormula = formulas.formulas.find(
    (formula) => formula.id === "route-er-vat",
  );
  if (erVatFormula) {
    const erVatEngine = require(path.join(root, erVatFormula.artifactPath));
    const erCases = [
      {
        id: "er-sales-tax-goods-five-add",
        operation: "er-vat-calculate",
        caseClasses: ["historical_rate", "evidence_gated", "tax_addition"],
        input: {
          amount: 10000,
          mode: "add",
          rateKind: "goods-five-confirmed",
          rateEvidenceConfirmed: true,
          rateEvidenceType: "listed-goods-five-percent",
        },
        selectors: [
          "rate",
          "net",
          "tax",
          "gross",
          "currentRateConfirmed",
          "sourceAsOf",
        ],
      },
      {
        id: "er-sales-tax-goods-twelve-extract",
        operation: "er-vat-calculate",
        caseClasses: ["historical_rate", "evidence_gated", "tax_extraction"],
        input: {
          amount: 11200,
          mode: "extract",
          rateKind: "goods-twelve-confirmed",
          rateEvidenceConfirmed: true,
          rateEvidenceType: "residual-goods-twelve-percent",
        },
        selectors: [
          "rate",
          "net",
          "tax",
          "gross",
          "currentRateConfirmed",
          "sourceAsOf",
        ],
      },
    ];
    for (const item of erCases) {
      const result = erVatEngine.calculate(item.input);
      fixtures.push({
        id: item.id,
        formulaId: erVatFormula.id,
        formulaVersion: erVatFormula.formulaVersion,
        caseClasses: item.caseClasses,
        operation: item.operation,
        input: item.input,
        expected: expectedSelectors(result, item.selectors),
        tolerance: 0,
        evidence: erVatFormula.sources[0],
        changeNote: "reviewed-2026-07-22",
      });
    }
    fixtures.push({
      id: "er-sales-tax-evidence-rejection",
      formulaId: erVatFormula.id,
      formulaVersion: erVatFormula.formulaVersion,
      caseClasses: ["evidence_gated", "fail_closed"],
      operation: "er-vat-evidence-rejection",
      input: {
        amount: 10000,
        mode: "add",
        rateKind: "goods-five-confirmed",
        rateEvidenceConfirmed: false,
        rateEvidenceType: "listed-goods-five-percent",
      },
      expected: { error: "RATE_EVIDENCE_REQUIRED" },
      tolerance: 0,
      evidence: erVatFormula.sources[0],
      changeNote: "reviewed-2026-07-22",
    });
  }

  const etVatFormula = formulas.formulas.find(
    (formula) => formula.id === "route-et-vat",
  );
  if (etVatFormula) {
    const etVatEngine = require(path.join(root, etVatFormula.artifactPath));
    const etCases = [
      {
        id: "et-vat-standard-add",
        operation: "et-vat-calculate",
        caseClasses: ["standard_rate", "tax_addition"],
        input: { amount: 1000, mode: "add", rateKind: "standard" },
        selectors: ["rate", "net", "vat", "gross", "rounding", "sourceAsOf"],
      },
      {
        id: "et-vat-standard-extract",
        operation: "et-vat-calculate",
        caseClasses: ["standard_rate", "tax_extraction"],
        input: { amount: 1150, mode: "extract", rateKind: "standard" },
        selectors: ["rate", "net", "vat", "gross", "rounding", "sourceAsOf"],
      },
      {
        id: "et-vat-schedule-one-zero-confirmed",
        operation: "et-vat-calculate",
        caseClasses: ["zero_rate", "evidence_gated"],
        input: {
          amount: 1000,
          mode: "add",
          rateKind: "schedule-one-zero-confirmed",
          rateEvidenceConfirmed: true,
          rateEvidenceType: "proclamation-1341-schedule-1-zero-rated-supply",
        },
        selectors: ["rate", "net", "vat", "gross"],
      },
    ];
    for (const item of etCases) {
      const result = etVatEngine.calculate(item.input);
      fixtures.push({
        id: item.id,
        formulaId: etVatFormula.id,
        formulaVersion: etVatFormula.formulaVersion,
        caseClasses: item.caseClasses,
        operation: item.operation,
        input: item.input,
        expected: expectedSelectors(result, item.selectors),
        tolerance: 0,
        evidence: etVatFormula.sources[0],
        changeNote: "reviewed-2026-07-22",
      });
    }
    fixtures.push({
      id: "et-vat-zero-evidence-rejection",
      formulaId: etVatFormula.id,
      formulaVersion: etVatFormula.formulaVersion,
      caseClasses: ["zero_rate", "evidence_gated", "fail_closed"],
      operation: "et-vat-evidence-rejection",
      input: {
        amount: 1000,
        mode: "add",
        rateKind: "schedule-one-zero-confirmed",
        rateEvidenceConfirmed: false,
        rateEvidenceType: "proclamation-1341-schedule-1-zero-rated-supply",
      },
      expected: { error: "RATE_EVIDENCE_REQUIRED" },
      tolerance: 0,
      evidence: etVatFormula.sources[0],
      changeNote: "reviewed-2026-07-22",
    });
  }

  const szVatFormula = formulas.formulas.find(
    (formula) => formula.id === "route-sz-vat",
  );
  if (szVatFormula) {
    const szVatEngine = require(path.join(root, szVatFormula.artifactPath));
    const szCases = [
      {
        id: "sz-vat-standard-add",
        operation: "sz-vat-calculate",
        caseClasses: ["standard_rate", "tax_addition"],
        input: { amount: 1000, mode: "add", rateKind: "standard" },
        selectors: ["rate", "net", "vat", "gross", "rounding", "sourceAsOf"],
      },
      {
        id: "sz-vat-standard-extract",
        operation: "sz-vat-calculate",
        caseClasses: ["standard_rate", "tax_extraction"],
        input: { amount: 1150, mode: "extract", rateKind: "standard" },
        selectors: ["rate", "net", "vat", "gross", "rounding", "sourceAsOf"],
      },
      {
        id: "sz-vat-second-schedule-zero-confirmed",
        operation: "sz-vat-calculate",
        caseClasses: ["zero_rate", "evidence_gated"],
        input: {
          amount: 1000,
          mode: "add",
          rateKind: "second-schedule-zero-confirmed",
          rateEvidenceConfirmed: true,
          rateEvidenceType: "vat-act-current-second-schedule-zero-rated-supply",
        },
        selectors: ["rate", "net", "vat", "gross"],
      },
    ];
    for (const item of szCases) {
      const result = szVatEngine.calculate(item.input);
      fixtures.push({
        id: item.id,
        formulaId: szVatFormula.id,
        formulaVersion: szVatFormula.formulaVersion,
        caseClasses: item.caseClasses,
        operation: item.operation,
        input: item.input,
        expected: expectedSelectors(result, item.selectors),
        tolerance: 0,
        evidence: szVatFormula.sources[0],
        changeNote: "reviewed-2026-07-22",
      });
    }
    fixtures.push({
      id: "sz-vat-zero-evidence-rejection",
      formulaId: szVatFormula.id,
      formulaVersion: szVatFormula.formulaVersion,
      caseClasses: ["zero_rate", "evidence_gated", "fail_closed"],
      operation: "sz-vat-evidence-rejection",
      input: {
        amount: 1000,
        mode: "add",
        rateKind: "second-schedule-zero-confirmed",
        rateEvidenceConfirmed: false,
        rateEvidenceType: "vat-act-current-second-schedule-zero-rated-supply",
      },
      expected: { error: "RATE_EVIDENCE_REQUIRED" },
      tolerance: 0,
      evidence: szVatFormula.sources[0],
      changeNote: "reviewed-2026-07-22",
    });
  }

  const gaVatFormula = formulas.formulas.find(
    (formula) => formula.id === "route-ga-vat",
  );
  if (gaVatFormula) {
    const gaVatEngine = require(path.join(root, gaVatFormula.artifactPath));
    const gaCases = [
      {
        id: "ga-vat-standard-add",
        operation: "ga-vat-calculate",
        caseClasses: ["standard_rate", "tax_addition", "statutory_rounding"],
        input: { amount: 1550, mode: "add", rateKind: "standard" },
        selectors: [
          "rate",
          "net",
          "taxableBase",
          "vat",
          "gross",
          "rounding",
          "sourceAsOf",
        ],
      },
      {
        id: "ga-vat-standard-extract",
        operation: "ga-vat-calculate",
        caseClasses: ["standard_rate", "tax_extraction", "statutory_rounding"],
        input: { amount: 1730, mode: "extract", rateKind: "standard" },
        selectors: [
          "rate",
          "net",
          "taxableBase",
          "vat",
          "gross",
          "rounding",
          "sourceAsOf",
        ],
      },
      {
        id: "ga-vat-article-221-ten-confirmed",
        operation: "ga-vat-calculate",
        caseClasses: ["special_rate", "evidence_gated"],
        input: {
          amount: 1000,
          mode: "add",
          rateKind: "article-221-ten-confirmed",
          rateEvidenceConfirmed: true,
          rateEvidenceType:
            "finance-law-2026-article-221-ten-percent-listed-supply",
        },
        selectors: ["rate", "net", "taxableBase", "vat", "gross"],
      },
      {
        id: "ga-vat-article-221-five-confirmed",
        operation: "ga-vat-calculate",
        caseClasses: ["special_rate", "evidence_gated"],
        input: {
          amount: 1000,
          mode: "add",
          rateKind: "article-221-five-confirmed",
          rateEvidenceConfirmed: true,
          rateEvidenceType:
            "finance-law-2026-article-221-five-percent-listed-supply",
        },
        selectors: ["rate", "net", "taxableBase", "vat", "gross"],
      },
      {
        id: "ga-vat-article-221-zero-confirmed",
        operation: "ga-vat-calculate",
        caseClasses: ["zero_rate", "evidence_gated"],
        input: {
          amount: 1000,
          mode: "add",
          rateKind: "article-221-zero-confirmed",
          rateEvidenceConfirmed: true,
          rateEvidenceType: "finance-law-2026-article-221-zero-rated-operation",
        },
        selectors: ["rate", "net", "taxableBase", "vat", "gross"],
      },
    ];
    for (const item of gaCases) {
      const result = gaVatEngine.calculate(item.input);
      fixtures.push({
        id: item.id,
        formulaId: gaVatFormula.id,
        formulaVersion: gaVatFormula.formulaVersion,
        caseClasses: item.caseClasses,
        operation: item.operation,
        input: item.input,
        expected: expectedSelectors(result, item.selectors),
        tolerance: 0,
        evidence: gaVatFormula.sources[0],
        changeNote: "reviewed-2026-07-22",
      });
    }
    fixtures.push({
      id: "ga-vat-evidence-rejection",
      formulaId: gaVatFormula.id,
      formulaVersion: gaVatFormula.formulaVersion,
      caseClasses: ["evidence_gated", "fail_closed"],
      operation: "ga-vat-evidence-rejection",
      input: {
        amount: 1000,
        mode: "add",
        rateKind: "article-221-ten-confirmed",
        rateEvidenceConfirmed: false,
        rateEvidenceType:
          "finance-law-2026-article-221-ten-percent-listed-supply",
      },
      expected: { error: "RATE_EVIDENCE_REQUIRED" },
      tolerance: 0,
      evidence: gaVatFormula.sources[0],
      changeNote: "reviewed-2026-07-22",
    });
  }

  const gmVatFormula = formulas.formulas.find(
    (formula) => formula.id === "route-gm-vat",
  );
  if (gmVatFormula) {
    const gmVatEngine = require(path.join(root, gmVatFormula.artifactPath));
    const gmCases = [
      {
        id: "gm-vat-standard-add",
        operation: "gm-vat-calculate",
        caseClasses: ["standard_rate", "tax_addition", "statutory_rounding"],
        input: { amount: 1000, mode: "add", rateKind: "standard" },
        selectors: ["rate", "net", "vat", "gross", "rounding", "sourceAsOf"],
      },
      {
        id: "gm-vat-standard-extract",
        operation: "gm-vat-calculate",
        caseClasses: ["standard_rate", "tax_extraction", "statutory_rounding"],
        input: { amount: 1150, mode: "extract", rateKind: "standard" },
        selectors: ["rate", "net", "vat", "gross", "rounding", "sourceAsOf"],
      },
      {
        id: "gm-vat-export-zero-confirmed",
        operation: "gm-vat-calculate",
        caseClasses: ["zero_rate", "evidence_gated"],
        input: {
          amount: 1000,
          mode: "add",
          rateKind: "confirmed-export-zero",
          rateEvidenceConfirmed: true,
          rateEvidenceType: "gra-current-export-of-goods-or-services",
        },
        selectors: ["rate", "net", "vat", "gross"],
      },
    ];
    for (const item of gmCases) {
      const result = gmVatEngine.calculate(item.input);
      fixtures.push({
        id: item.id,
        formulaId: gmVatFormula.id,
        formulaVersion: gmVatFormula.formulaVersion,
        caseClasses: item.caseClasses,
        operation: item.operation,
        input: item.input,
        expected: expectedSelectors(result, item.selectors),
        tolerance: 0,
        evidence: gmVatFormula.sources[0],
        changeNote: "reviewed-2026-07-22",
      });
    }
    fixtures.push({
      id: "gm-vat-evidence-rejection",
      formulaId: gmVatFormula.id,
      formulaVersion: gmVatFormula.formulaVersion,
      caseClasses: ["zero_rate", "evidence_gated", "fail_closed"],
      operation: "gm-vat-evidence-rejection",
      input: {
        amount: 1000,
        mode: "add",
        rateKind: "confirmed-export-zero",
        rateEvidenceConfirmed: false,
        rateEvidenceType: "gra-current-export-of-goods-or-services",
      },
      expected: { error: "RATE_EVIDENCE_REQUIRED" },
      tolerance: 0,
      evidence: gmVatFormula.sources[0],
      changeNote: "reviewed-2026-07-22",
    });
  }

  const gnVatFormula = formulas.formulas.find(
    (formula) => formula.id === "route-gn-vat",
  );
  if (gnVatFormula) {
    const gnVatEngine = require(path.join(root, gnVatFormula.artifactPath));
    const gnCases = [
      {
        id: "gn-vat-standard-add",
        operation: "gn-vat-calculate",
        caseClasses: ["standard_rate", "tax_addition", "statutory_rounding"],
        input: { amount: 100000, mode: "add", rateKind: "standard" },
        selectors: ["rate", "net", "vat", "gross", "rounding", "sourceAsOf"],
      },
      {
        id: "gn-vat-standard-extract",
        operation: "gn-vat-calculate",
        caseClasses: ["standard_rate", "tax_extraction", "statutory_rounding"],
        input: { amount: 118000, mode: "extract", rateKind: "standard" },
        selectors: ["rate", "net", "vat", "gross", "rounding", "sourceAsOf"],
      },
      {
        id: "gn-vat-article-373-zero-confirmed",
        operation: "gn-vat-calculate",
        caseClasses: ["zero_rate", "evidence_gated"],
        input: {
          amount: 100000,
          mode: "add",
          rateKind: "confirmed-article-373-zero",
          rateEvidenceConfirmed: true,
          rateEvidenceType:
            "dgi-cgi-article-373-export-or-international-transport",
        },
        selectors: ["rate", "net", "vat", "gross"],
      },
      {
        id: "gn-vat-registration-review",
        operation: "gn-vat-registration-review",
        caseClasses: ["exact_threshold", "registration_review"],
        input: { turnover: 500000000, voluntaryEvidence: true },
        selectors: ["status", "boundary"],
      },
    ];
    for (const item of gnCases) {
      const result =
        item.operation === "gn-vat-registration-review"
          ? gnVatEngine.registrationReview(
              item.input.turnover,
              item.input.voluntaryEvidence,
            )
          : gnVatEngine.calculate(item.input);
      fixtures.push({
        id: item.id,
        formulaId: gnVatFormula.id,
        formulaVersion: gnVatFormula.formulaVersion,
        caseClasses: item.caseClasses,
        operation: item.operation,
        input: item.input,
        expected: expectedSelectors(result, item.selectors),
        tolerance: 0,
        evidence: gnVatFormula.sources[0],
        changeNote: "reviewed-2026-07-22",
      });
    }
    fixtures.push({
      id: "gn-vat-evidence-rejection",
      formulaId: gnVatFormula.id,
      formulaVersion: gnVatFormula.formulaVersion,
      caseClasses: ["zero_rate", "evidence_gated", "fail_closed"],
      operation: "gn-vat-evidence-rejection",
      input: {
        amount: 100000,
        mode: "add",
        rateKind: "confirmed-article-373-zero",
        rateEvidenceConfirmed: false,
        rateEvidenceType:
          "dgi-cgi-article-373-export-or-international-transport",
      },
      expected: { error: "RATE_EVIDENCE_REQUIRED" },
      tolerance: 0,
      evidence: gnVatFormula.sources[0],
      changeNote: "reviewed-2026-07-22",
    });
  }

  const gwVatFormula = formulas.formulas.find(
    (formula) => formula.id === "route-gw-vat",
  );
  if (gwVatFormula) {
    const gwVatEngine = require(path.join(root, gwVatFormula.artifactPath));
    const gwCases = [
      {
        id: "gw-vat-standard-add",
        operation: "gw-vat-calculate",
        caseClasses: ["standard_rate", "tax_addition", "statutory_rounding"],
        input: { amount: 100000, mode: "add", rateKind: "standard" },
        selectors: ["rate", "net", "vat", "gross", "rounding", "sourceAsOf"],
      },
      {
        id: "gw-vat-standard-extract",
        operation: "gw-vat-calculate",
        caseClasses: ["standard_rate", "tax_extraction", "statutory_rounding"],
        input: { amount: 119000, mode: "extract", rateKind: "standard" },
        selectors: ["rate", "net", "vat", "gross", "rounding", "sourceAsOf"],
      },
      {
        id: "gw-vat-annex-one-ten-confirmed",
        operation: "gw-vat-calculate",
        caseClasses: ["reduced_rate", "evidence_gated"],
        input: {
          amount: 100000,
          mode: "add",
          rateKind: "confirmed-annex-1-ten",
          rateEvidenceConfirmed: true,
          rateEvidenceType: "civa-article-18-annex-1-exact-line",
        },
        selectors: ["rate", "net", "vat", "gross"],
      },
      {
        id: "gw-vat-export-zero-confirmed",
        operation: "gw-vat-calculate",
        caseClasses: ["zero_rate", "evidence_gated"],
        input: {
          amount: 100000,
          mode: "add",
          rateKind: "confirmed-export-zero",
          rateEvidenceConfirmed: true,
          rateEvidenceType: "civa-article-18-export-evidence",
        },
        selectors: ["rate", "net", "vat", "gross"],
      },
    ];
    for (const item of gwCases) {
      const result = gwVatEngine.calculate(item.input);
      fixtures.push({
        id: item.id,
        formulaId: gwVatFormula.id,
        formulaVersion: gwVatFormula.formulaVersion,
        caseClasses: item.caseClasses,
        operation: item.operation,
        input: item.input,
        expected: expectedSelectors(result, item.selectors),
        tolerance: 0,
        evidence: gwVatFormula.sources[0],
        changeNote: "reviewed-2026-07-22",
      });
    }
    fixtures.push({
      id: "gw-vat-evidence-rejection",
      formulaId: gwVatFormula.id,
      formulaVersion: gwVatFormula.formulaVersion,
      caseClasses: ["evidence_gated", "fail_closed"],
      operation: "gw-vat-evidence-rejection",
      input: {
        amount: 100000,
        mode: "add",
        rateKind: "confirmed-annex-1-ten",
        rateEvidenceConfirmed: false,
        rateEvidenceType: "civa-article-18-annex-1-exact-line",
      },
      expected: { error: "RATE_EVIDENCE_REQUIRED" },
      tolerance: 0,
      evidence: gwVatFormula.sources[0],
      changeNote: "reviewed-2026-07-22",
    });
  }

  const lsVatFormula = formulas.formulas.find(
    (formula) => formula.id === "route-ls-vat",
  );
  if (lsVatFormula) {
    const lsVatEngine = require(path.join(root, lsVatFormula.artifactPath));
    const lsCases = [
      {
        id: "ls-vat-standard-add",
        operation: "ls-vat-calculate",
        caseClasses: ["standard_rate", "tax_addition", "decimal_precision"],
        input: { amount: 1000, mode: "add", rateKind: "standard" },
        selectors: ["rate", "net", "vat", "gross", "rounding", "sourceAsOf"],
      },
      {
        id: "ls-vat-standard-extract",
        operation: "ls-vat-calculate",
        caseClasses: ["standard_rate", "tax_extraction", "decimal_precision"],
        input: { amount: 1150, mode: "extract", rateKind: "standard" },
        selectors: ["rate", "net", "vat", "gross", "rounding", "sourceAsOf"],
      },
      {
        id: "ls-vat-electricity-ten-confirmed",
        operation: "ls-vat-calculate",
        caseClasses: ["reduced_rate", "evidence_gated"],
        input: {
          amount: 1000,
          mode: "add",
          rateKind: "confirmed-electricity-ten",
          rateEvidenceConfirmed: true,
          rateEvidenceType: "rsl-current-electricity-treatment",
        },
        selectors: ["rate", "net", "vat", "gross"],
      },
      {
        id: "ls-vat-zero-confirmed",
        operation: "ls-vat-calculate",
        caseClasses: ["zero_rate", "evidence_gated"],
        input: {
          amount: 1000,
          mode: "add",
          rateKind: "confirmed-zero",
          rateEvidenceConfirmed: true,
          rateEvidenceType: "rsl-fourth-schedule-or-export-evidence",
        },
        selectors: ["rate", "net", "vat", "gross"],
      },
    ];
    for (const item of lsCases) {
      const result = lsVatEngine.calculate(item.input);
      fixtures.push({
        id: item.id,
        formulaId: lsVatFormula.id,
        formulaVersion: lsVatFormula.formulaVersion,
        caseClasses: item.caseClasses,
        operation: item.operation,
        input: item.input,
        expected: expectedSelectors(result, item.selectors),
        tolerance: 0.01,
        evidence: lsVatFormula.sources[0],
        changeNote: "reviewed-2026-07-22",
      });
    }
    fixtures.push({
      id: "ls-vat-evidence-rejection",
      formulaId: lsVatFormula.id,
      formulaVersion: lsVatFormula.formulaVersion,
      caseClasses: ["evidence_gated", "fail_closed"],
      operation: "ls-vat-evidence-rejection",
      input: {
        amount: 1000,
        mode: "add",
        rateKind: "confirmed-electricity-ten",
        rateEvidenceConfirmed: false,
        rateEvidenceType: "rsl-current-electricity-treatment",
      },
      expected: { error: "RATE_EVIDENCE_REQUIRED" },
      tolerance: 0,
      evidence: lsVatFormula.sources[0],
      changeNote: "reviewed-2026-07-22",
    });
  }

  const lrVatFormula = formulas.formulas.find(
    (formula) => formula.id === "route-lr-vat",
  );
  if (lrVatFormula) {
    const lrVatEngine = require(path.join(root, lrVatFormula.artifactPath));
    const lrCases = [
      {
        id: "lr-gst-standard-add",
        operation: "lr-vat-calculate",
        caseClasses: ["standard_rate", "tax_addition", "decimal_precision"],
        input: { amount: 1000, mode: "add", rateKind: "standard" },
        selectors: ["rate", "net", "gst", "gross", "rounding", "sourceAsOf"],
      },
      {
        id: "lr-gst-standard-extract",
        operation: "lr-vat-calculate",
        caseClasses: ["standard_rate", "tax_extraction", "decimal_precision"],
        input: { amount: 1130, mode: "extract", rateKind: "standard" },
        selectors: ["rate", "net", "gst", "gross", "rounding", "sourceAsOf"],
      },
      {
        id: "lr-gst-export-goods-zero-confirmed",
        operation: "lr-vat-calculate",
        caseClasses: ["zero_rate", "evidence_gated"],
        input: {
          amount: 1000,
          mode: "add",
          rateKind: "confirmed-export-goods-zero",
          rateEvidenceConfirmed: true,
          rateEvidenceType: "lra-section-1000-export-of-goods",
        },
        selectors: ["rate", "net", "gst", "gross"],
      },
    ];
    for (const item of lrCases) {
      const result = lrVatEngine.calculate(item.input);
      fixtures.push({
        id: item.id,
        formulaId: lrVatFormula.id,
        formulaVersion: lrVatFormula.formulaVersion,
        caseClasses: item.caseClasses,
        operation: item.operation,
        input: item.input,
        expected: expectedSelectors(result, item.selectors),
        tolerance: 0.01,
        evidence: lrVatFormula.sources[0],
        changeNote: "reviewed-2026-07-22",
      });
    }
    fixtures.push({
      id: "lr-gst-export-evidence-rejection",
      formulaId: lrVatFormula.id,
      formulaVersion: lrVatFormula.formulaVersion,
      caseClasses: ["zero_rate", "evidence_gated", "fail_closed"],
      operation: "lr-vat-evidence-rejection",
      input: {
        amount: 1000,
        mode: "add",
        rateKind: "confirmed-export-goods-zero",
        rateEvidenceConfirmed: false,
        rateEvidenceType: "lra-section-1000-export-of-goods",
      },
      expected: { error: "RATE_EVIDENCE_REQUIRED" },
      tolerance: 0,
      evidence: lrVatFormula.sources[0],
      changeNote: "reviewed-2026-07-22",
    });
  }

  const mgVatFormula = formulas.formulas.find(
    (formula) => formula.id === "route-mg-vat",
  );
  if (mgVatFormula) {
    const mgVatEngine = require(path.join(root, mgVatFormula.artifactPath));
    const mgCases = [
      {
        id: "mg-vat-standard-add",
        operation: "mg-vat-calculate",
        caseClasses: ["standard_rate", "tax_addition", "decimal_precision"],
        input: { amount: 1000, mode: "add", rateKind: "standard" },
        selectors: ["rate", "net", "vat", "gross", "rounding", "sourceAsOf"],
      },
      {
        id: "mg-vat-standard-extract",
        operation: "mg-vat-calculate",
        caseClasses: ["standard_rate", "tax_extraction", "decimal_precision"],
        input: { amount: 1200, mode: "extract", rateKind: "standard" },
        selectors: ["rate", "net", "vat", "gross", "rounding", "sourceAsOf"],
      },
      {
        id: "mg-vat-butane-ten-confirmed",
        operation: "mg-vat-calculate",
        caseClasses: ["reduced_rate", "evidence_gated"],
        input: {
          amount: 1000,
          mode: "add",
          rateKind: "confirmed-butane-ten",
          rateEvidenceConfirmed: true,
          rateEvidenceType: "dgi-article-06-01-12-butane-tariff-line",
        },
        selectors: ["rate", "net", "vat", "gross"],
      },
      {
        id: "mg-vat-export-zero-confirmed",
        operation: "mg-vat-calculate",
        caseClasses: ["zero_rate", "evidence_gated"],
        input: {
          amount: 1000,
          mode: "add",
          rateKind: "confirmed-export-zero",
          rateEvidenceConfirmed: true,
          rateEvidenceType: "dgi-article-06-01-12-export-goods-or-services",
        },
        selectors: ["rate", "net", "vat", "gross"],
      },
    ];
    for (const item of mgCases) {
      const result = mgVatEngine.calculate(item.input);
      fixtures.push({
        id: item.id,
        formulaId: mgVatFormula.id,
        formulaVersion: mgVatFormula.formulaVersion,
        caseClasses: item.caseClasses,
        operation: item.operation,
        input: item.input,
        expected: expectedSelectors(result, item.selectors),
        tolerance: 0.01,
        evidence: mgVatFormula.sources[0],
        changeNote: "reviewed-2026-07-22",
      });
    }
    fixtures.push({
      id: "mg-vat-evidence-rejection",
      formulaId: mgVatFormula.id,
      formulaVersion: mgVatFormula.formulaVersion,
      caseClasses: ["evidence_gated", "fail_closed"],
      operation: "mg-vat-evidence-rejection",
      input: {
        amount: 1000,
        mode: "add",
        rateKind: "confirmed-butane-ten",
        rateEvidenceConfirmed: false,
        rateEvidenceType: "dgi-article-06-01-12-butane-tariff-line",
      },
      expected: { error: "RATE_EVIDENCE_REQUIRED" },
      tolerance: 0,
      evidence: mgVatFormula.sources[0],
      changeNote: "reviewed-2026-07-22",
    });
  }

  const mwVatFormula = formulas.formulas.find(
    (formula) => formula.id === "route-mw-vat",
  );
  if (mwVatFormula) {
    const mwVatEngine = require(path.join(root, mwVatFormula.artifactPath));
    const mwCases = [
      {
        id: "mw-vat-standard-add",
        operation: "mw-vat-calculate",
        caseClasses: ["standard_rate", "tax_addition", "decimal_precision"],
        input: { amount: 1000, mode: "add", rateKind: "standard" },
        selectors: ["rate", "net", "vat", "gross", "rounding", "sourceAsOf"],
      },
      {
        id: "mw-vat-standard-extract",
        operation: "mw-vat-calculate",
        caseClasses: ["standard_rate", "tax_extraction", "decimal_precision"],
        input: { amount: 1175, mode: "extract", rateKind: "standard" },
        selectors: ["rate", "net", "vat", "gross", "rounding", "sourceAsOf"],
      },
    ];
    for (const item of mwCases) {
      const result = mwVatEngine.calculate(item.input);
      fixtures.push({
        id: item.id,
        formulaId: mwVatFormula.id,
        formulaVersion: mwVatFormula.formulaVersion,
        caseClasses: item.caseClasses,
        operation: item.operation,
        input: item.input,
        expected: expectedSelectors(result, item.selectors),
        tolerance: 0.01,
        evidence: mwVatFormula.sources[0],
        changeNote: "reviewed-2026-07-22",
      });
    }
    fixtures.push({
      id: "mw-vat-special-treatment-rejection",
      formulaId: mwVatFormula.id,
      formulaVersion: mwVatFormula.formulaVersion,
      caseClasses: ["evidence_gated", "fail_closed", "stale_source_conflict"],
      operation: "mw-vat-evidence-rejection",
      input: { amount: 1000, mode: "add", rateKind: "legacy-16.5" },
      expected: { error: "RATE_EVIDENCE_REQUIRED" },
      tolerance: 0,
      evidence: mwVatFormula.sources[0],
      changeNote: "reviewed-2026-07-22",
    });
  }

  const mlVatFormula = formulas.formulas.find(
    (formula) => formula.id === "route-ml-vat",
  );
  if (mlVatFormula) {
    const mlVatEngine = require(path.join(root, mlVatFormula.artifactPath));
    const mlCases = [
      {
        id: "ml-vat-standard-add",
        operation: "ml-vat-calculate",
        caseClasses: ["standard_rate", "tax_addition", "decimal_precision"],
        input: { amount: 1000, mode: "add", rateKind: "standard" },
        selectors: ["rate", "treatment", "net", "vat", "gross", "rounding", "sourceAsOf"],
      },
      {
        id: "ml-vat-standard-extract",
        operation: "ml-vat-calculate",
        caseClasses: ["standard_rate", "tax_extraction", "decimal_precision"],
        input: { amount: 1180, mode: "extract", rateKind: "standard" },
        selectors: ["rate", "treatment", "net", "vat", "gross", "rounding", "sourceAsOf"],
      },
      {
        id: "ml-vat-reduced-five-confirmed",
        operation: "ml-vat-calculate",
        caseClasses: ["reduced_rate", "evidence_gated"],
        input: {
          amount: 1000,
          mode: "add",
          rateKind: "confirmed-reduced-five",
          rateEvidenceConfirmed: true,
          rateEvidenceType: mlVatEngine.REDUCED_EVIDENCE,
        },
        selectors: ["rate", "treatment", "net", "vat", "gross"],
      },
      {
        id: "ml-vat-direct-export-exempt-confirmed",
        operation: "ml-vat-calculate",
        caseClasses: ["exempt_treatment", "evidence_gated"],
        input: {
          amount: 1000,
          mode: "add",
          rateKind: "confirmed-export-exempt",
          rateEvidenceConfirmed: true,
          rateEvidenceType: mlVatEngine.EXEMPT_EVIDENCE,
        },
        selectors: ["rate", "treatment", "net", "vat", "gross"],
      },
    ];
    for (const item of mlCases) {
      const result = mlVatEngine.calculate(item.input);
      fixtures.push({
        id: item.id,
        formulaId: mlVatFormula.id,
        formulaVersion: mlVatFormula.formulaVersion,
        caseClasses: item.caseClasses,
        operation: item.operation,
        input: item.input,
        expected: expectedSelectors(result, item.selectors),
        tolerance: 0.01,
        evidence: mlVatFormula.sources[0],
        changeNote: "reviewed-2026-07-22",
      });
    }
    fixtures.push({
      id: "ml-vat-special-treatment-rejection",
      formulaId: mlVatFormula.id,
      formulaVersion: mlVatFormula.formulaVersion,
      caseClasses: ["evidence_gated", "fail_closed"],
      operation: "ml-vat-evidence-rejection",
      input: { amount: 1000, mode: "add", rateKind: "confirmed-reduced-five" },
      expected: { error: "RATE_EVIDENCE_REQUIRED" },
      tolerance: 0,
      evidence: mlVatFormula.sources[0],
      changeNote: "reviewed-2026-07-22",
    });
  }

  const mrVatFormula = formulas.formulas.find(
    (formula) => formula.id === "route-mr-vat",
  );
  if (mrVatFormula) {
    const mrVatEngine = require(path.join(root, mrVatFormula.artifactPath));
    const mrCases = [
      {
        id: "mr-vat-standard-add",
        operation: "mr-vat-calculate",
        caseClasses: ["standard_rate", "tax_addition", "decimal_precision"],
        input: { amount: 1000, mode: "add", rateKind: "standard" },
        selectors: ["rate", "treatment", "net", "vat", "gross", "rounding", "sourceAsOf"],
      },
      {
        id: "mr-vat-standard-extract",
        operation: "mr-vat-calculate",
        caseClasses: ["standard_rate", "tax_extraction", "decimal_precision"],
        input: { amount: 1160, mode: "extract", rateKind: "standard" },
        selectors: ["rate", "treatment", "net", "vat", "gross", "rounding", "sourceAsOf"],
      },
      {
        id: "mr-vat-telephony-eighteen-confirmed",
        operation: "mr-vat-calculate",
        caseClasses: ["special_rate", "evidence_gated"],
        input: { amount: 1000, mode: "add", rateKind: "confirmed-telephony", rateEvidenceConfirmed: true, rateEvidenceType: mrVatEngine.TELEPHONY_EVIDENCE },
        selectors: ["rate", "treatment", "net", "vat", "gross"],
      },
      {
        id: "mr-vat-export-zero-confirmed",
        operation: "mr-vat-calculate",
        caseClasses: ["zero_rate", "evidence_gated"],
        input: { amount: 1000, mode: "add", rateKind: "confirmed-export-zero", rateEvidenceConfirmed: true, rateEvidenceType: mrVatEngine.EXPORT_EVIDENCE },
        selectors: ["rate", "treatment", "net", "vat", "gross"],
      },
      {
        id: "mr-vat-article-215-exempt-confirmed",
        operation: "mr-vat-calculate",
        caseClasses: ["exempt_treatment", "evidence_gated"],
        input: { amount: 1000, mode: "add", rateKind: "confirmed-article-215-exempt", rateEvidenceConfirmed: true, rateEvidenceType: mrVatEngine.EXEMPT_EVIDENCE },
        selectors: ["rate", "treatment", "net", "vat", "gross"],
      },
    ];
    for (const item of mrCases) {
      const result = mrVatEngine.calculate(item.input);
      fixtures.push({
        id: item.id,
        formulaId: mrVatFormula.id,
        formulaVersion: mrVatFormula.formulaVersion,
        caseClasses: item.caseClasses,
        operation: item.operation,
        input: item.input,
        expected: expectedSelectors(result, item.selectors),
        tolerance: 0.01,
        evidence: mrVatFormula.sources[0],
        changeNote: "reviewed-2026-07-22",
      });
    }
    fixtures.push({
      id: "mr-vat-special-treatment-rejection",
      formulaId: mrVatFormula.id,
      formulaVersion: mrVatFormula.formulaVersion,
      caseClasses: ["evidence_gated", "fail_closed"],
      operation: "mr-vat-evidence-rejection",
      input: { amount: 1000, mode: "add", rateKind: "confirmed-telephony" },
      expected: { error: "RATE_EVIDENCE_REQUIRED" },
      tolerance: 0,
      evidence: mrVatFormula.sources[0],
      changeNote: "reviewed-2026-07-22",
    });
  }

  const muVatFormula = formulas.formulas.find(
    (formula) => formula.id === "route-mu-vat",
  );
  if (muVatFormula) {
    const muVatEngine = require(path.join(root, muVatFormula.artifactPath));
    const muCases = [
      {
        id: "mu-vat-standard-add",
        operation: "mu-vat-calculate",
        caseClasses: ["standard_rate", "tax_addition", "decimal_precision"],
        input: { amount: 1000, mode: "add", rateKind: "standard" },
        selectors: ["rate", "treatment", "net", "vat", "gross", "rounding", "sourceAsOf"],
      },
      {
        id: "mu-vat-standard-extract",
        operation: "mu-vat-calculate",
        caseClasses: ["standard_rate", "tax_extraction", "decimal_precision"],
        input: { amount: 1150, mode: "extract", rateKind: "standard" },
        selectors: ["rate", "treatment", "net", "vat", "gross", "rounding", "sourceAsOf"],
      },
      {
        id: "mu-vat-fifth-schedule-zero-confirmed",
        operation: "mu-vat-calculate",
        caseClasses: ["zero_rate", "evidence_gated"],
        input: { amount: 1000, mode: "add", rateKind: "confirmed-fifth-schedule-zero", rateEvidenceConfirmed: true, rateEvidenceType: muVatEngine.ZERO_EVIDENCE },
        selectors: ["rate", "treatment", "net", "vat", "gross"],
      },
      {
        id: "mu-vat-first-schedule-exempt-confirmed",
        operation: "mu-vat-calculate",
        caseClasses: ["exempt_treatment", "evidence_gated"],
        input: { amount: 1000, mode: "add", rateKind: "confirmed-first-schedule-exempt", rateEvidenceConfirmed: true, rateEvidenceType: muVatEngine.EXEMPT_EVIDENCE },
        selectors: ["rate", "treatment", "net", "vat", "gross"],
      },
    ];
    for (const item of muCases) {
      const result = muVatEngine.calculate(item.input);
      fixtures.push({
        id: item.id,
        formulaId: muVatFormula.id,
        formulaVersion: muVatFormula.formulaVersion,
        caseClasses: item.caseClasses,
        operation: item.operation,
        input: item.input,
        expected: expectedSelectors(result, item.selectors),
        tolerance: 0.01,
        evidence: muVatFormula.sources[0],
        changeNote: "reviewed-2026-07-22",
      });
    }
    fixtures.push({
      id: "mu-vat-special-treatment-rejection",
      formulaId: muVatFormula.id,
      formulaVersion: muVatFormula.formulaVersion,
      caseClasses: ["evidence_gated", "fail_closed"],
      operation: "mu-vat-evidence-rejection",
      input: { amount: 1000, mode: "add", rateKind: "confirmed-fifth-schedule-zero" },
      expected: { error: "RATE_EVIDENCE_REQUIRED" },
      tolerance: 0,
      evidence: muVatFormula.sources[0],
      changeNote: "reviewed-2026-07-22",
    });
  }

  const maVatFormula = formulas.formulas.find(
    (formula) => formula.id === "route-ma-vat",
  );
  if (maVatFormula) {
    const maVatEngine = require(path.join(root, maVatFormula.artifactPath));
    const maCases = [
      {
        id: "ma-vat-standard-add",
        operation: "ma-vat-calculate",
        caseClasses: ["standard_rate", "tax_addition", "decimal_precision"],
        input: { amount: 1000, mode: "add", rateKind: "standard" },
        selectors: ["rate", "treatment", "net", "vat", "gross", "rounding", "sourceAsOf"],
      },
      {
        id: "ma-vat-standard-extract",
        operation: "ma-vat-calculate",
        caseClasses: ["standard_rate", "tax_extraction", "decimal_precision"],
        input: { amount: 1200, mode: "extract", rateKind: "standard" },
        selectors: ["rate", "treatment", "net", "vat", "gross", "rounding", "sourceAsOf"],
      },
      {
        id: "ma-vat-article-99-b-ten-confirmed",
        operation: "ma-vat-calculate",
        caseClasses: ["reduced_rate", "evidence_gated"],
        input: { amount: 1000, mode: "add", rateKind: "confirmed-article-99-b-reduced", rateEvidenceConfirmed: true, rateEvidenceType: maVatEngine.REDUCED_EVIDENCE },
        selectors: ["rate", "treatment", "net", "vat", "gross"],
      },
      {
        id: "ma-vat-article-92-export-confirmed",
        operation: "ma-vat-calculate",
        caseClasses: ["exempt_with_deduction", "evidence_gated"],
        input: { amount: 1000, mode: "add", rateKind: "confirmed-article-92-export", rateEvidenceConfirmed: true, rateEvidenceType: maVatEngine.EXPORT_EVIDENCE },
        selectors: ["rate", "treatment", "net", "vat", "gross"],
      },
    ];
    for (const item of maCases) {
      const result = maVatEngine.calculate(item.input);
      fixtures.push({ id: item.id, formulaId: maVatFormula.id, formulaVersion: maVatFormula.formulaVersion, caseClasses: item.caseClasses, operation: item.operation, input: item.input, expected: expectedSelectors(result, item.selectors), tolerance: 0.01, evidence: maVatFormula.sources[0], changeNote: "reviewed-2026-07-22" });
    }
    const invoiceInput = [
      { description: "normal", quantity: 2, unitPrice: 100 },
      { description: "reduced", quantity: 1, unitPrice: 100, rateKind: "confirmed-article-99-b-reduced", rateEvidenceConfirmed: true, rateEvidenceType: maVatEngine.REDUCED_EVIDENCE },
    ];
    fixtures.push({ id: "ma-vat-evidence-per-line-invoice", formulaId: maVatFormula.id, formulaVersion: maVatFormula.formulaVersion, caseClasses: ["invoice_mode", "evidence_gated", "mixed_rate"], operation: "ma-vat-invoice", input: invoiceInput, expected: expectedSelectors(maVatEngine.calculateInvoice(invoiceInput), ["net", "vat", "gross", "currency", "sourceAsOf", "lines"]), tolerance: 0.01, evidence: maVatFormula.sources[0], changeNote: "reviewed-2026-07-22" });
    fixtures.push({ id: "ma-vat-retired-rate-rejection", formulaId: maVatFormula.id, formulaVersion: maVatFormula.formulaVersion, caseClasses: ["retired_rate", "fail_closed"], operation: "ma-vat-evidence-rejection", input: { amount: 1000, mode: "add", rateKind: "legacy-14" }, expected: { error: "unsupported Morocco VAT treatment" }, tolerance: 0, evidence: maVatFormula.sources[0], changeNote: "reviewed-2026-07-22" });
  }

  const ngPensionFormula = formulas.formulas.find(
    (formula) => formula.id === "formula-engines-ng-pension-engine",
  );
  if (ngPensionFormula) {
    const ngPensionEngine = loadBrowserGlobal(
      root,
      ngPensionFormula.artifactPath,
      "NgPensionEngine",
    );
    const scenarioBase = {
      openingBalance: 1000000,
      monthlyEmoluments: 500000,
      employeeRate: 8,
      employerRate: 10,
      voluntaryContribution: 0,
      annualNetReturn: 0,
      annualSalaryGrowth: 0,
      years: 1,
      sourceLabel: "Payroll plus PRA 2014 section 4",
      sourceDate: "2026-07-23",
      returnSource: "User statement net-return scenario",
      returnSourceDate: "2026-07-23",
      today: "2026-07-23",
    };
    const contributionInput = {
      emoluments: 500000,
      employeeRate: 8,
      employerRate: 10,
    };
    fixtures.push({ id: "ng-pension-statutory-minimum-contributions", formulaId: ngPensionFormula.id, formulaVersion: ngPensionFormula.formulaVersion, caseClasses: ["statutory_contribution", "minimum_rates"], operation: "ng-pension-contribution", input: contributionInput, expected: expectedSelectors(ngPensionEngine.checkContributions(contributionInput.emoluments, contributionInput.employeeRate, contributionInput.employerRate), ["ok", "pensionableEmoluments", "expectedEmp", "expectedEr", "totalExpectedMonthly"]), tolerance: 0.01, evidence: ngPensionFormula.sources[0], changeNote: "reviewed-2026-07-23" });
    fixtures.push({ id: "ng-pension-zero-return-one-year", formulaId: ngPensionFormula.id, formulaVersion: ngPensionFormula.formulaVersion, caseClasses: ["zero_return", "month_end_contributions"], operation: "ng-pension-scenario", input: scenarioBase, expected: expectedSelectors(ngPensionEngine.calculateScenario(scenarioBase), ["ok", "firstEmployeeContribution", "firstEmployerContribution", "firstTotalContribution", "futureContributions", "modeledGrowth", "projectedBalance", "schedule"]), tolerance: 0.01, evidence: ngPensionFormula.sources[0], changeNote: "reviewed-2026-07-23" });
    const growthScenario = Object.assign({}, scenarioBase, { openingBalance: 0, voluntaryContribution: 10000, annualNetReturn: 12, annualSalaryGrowth: 5, years: 2 });
    fixtures.push({ id: "ng-pension-user-return-growth-scenario", formulaId: ngPensionFormula.id, formulaVersion: ngPensionFormula.formulaVersion, caseClasses: ["user_return", "salary_growth", "voluntary_contribution"], operation: "ng-pension-scenario", input: growthScenario, expected: expectedSelectors(ngPensionEngine.calculateScenario(growthScenario), ["ok", "futureContributions", "modeledGrowth", "projectedBalance", "finalMonthlyEmoluments", "schedule"]), tolerance: 0.01, evidence: ngPensionFormula.sources[0], changeNote: "reviewed-2026-07-23" });
    const invalidCases = [
      { id: "ng-pension-stale-evidence-rejection", input: Object.assign({}, scenarioBase, { sourceDate: "2025-07-22" }), error: "invalid_evidence", classes: ["stale_evidence", "fail_closed"] },
      { id: "ng-pension-future-evidence-rejection", input: Object.assign({}, scenarioBase, { returnSourceDate: "2026-07-24" }), error: "invalid_evidence", classes: ["future_evidence", "fail_closed"] },
      { id: "ng-pension-invalid-period-rejection", input: Object.assign({}, scenarioBase, { years: 0 }), error: "invalid_period", classes: ["invalid_period", "fail_closed"] },
    ];
    for (const item of invalidCases) {
      fixtures.push({ id: item.id, formulaId: ngPensionFormula.id, formulaVersion: ngPensionFormula.formulaVersion, caseClasses: item.classes, operation: "ng-pension-scenario", input: item.input, expected: { ok: false, error: item.error }, tolerance: 0, evidence: ngPensionFormula.sources[0], changeNote: "reviewed-2026-07-23" });
    }
  }

  const mzVatFormula = formulas.formulas.find(
    (formula) => formula.id === "route-mz-vat",
  );
  if (mzVatFormula) {
    const mzVatEngine = require(path.join(root, mzVatFormula.artifactPath));
    const mzCases = [
      {
        id: "mz-vat-standard-add",
        operation: "mz-vat-calculate",
        caseClasses: ["standard_rate", "tax_addition", "decimal_precision"],
        input: { amount: 1000, mode: "add", rateKind: "standard" },
        selectors: ["rate", "treatment", "net", "vat", "gross", "rounding", "sourceAsOf"],
      },
      {
        id: "mz-vat-standard-extract",
        operation: "mz-vat-calculate",
        caseClasses: ["standard_rate", "tax_extraction", "decimal_precision"],
        input: { amount: 1160, mode: "extract", rateKind: "standard" },
        selectors: ["rate", "treatment", "net", "vat", "gross", "rounding", "sourceAsOf"],
      },
      {
        id: "mz-vat-private-health-education-five-confirmed",
        operation: "mz-vat-calculate",
        caseClasses: ["reduced_rate", "evidence_gated", "no_input_deduction"],
        input: { amount: 1000, mode: "add", rateKind: "confirmed-private-health-education", rateEvidenceConfirmed: true, rateEvidenceType: mzVatEngine.PRIVATE_HEALTH_EDUCATION_EVIDENCE },
        selectors: ["rate", "treatment", "net", "vat", "gross"],
      },
      {
        id: "mz-vat-qualified-export-confirmed",
        operation: "mz-vat-calculate",
        caseClasses: ["zero_rate", "evidence_gated", "exempt_with_deduction"],
        input: { amount: 1000, mode: "add", rateKind: "confirmed-qualified-export", rateEvidenceConfirmed: true, rateEvidenceType: mzVatEngine.EXPORT_EVIDENCE },
        selectors: ["rate", "treatment", "net", "vat", "gross"],
      },
    ];
    for (const item of mzCases) {
      fixtures.push({ id: item.id, formulaId: mzVatFormula.id, formulaVersion: mzVatFormula.formulaVersion, caseClasses: item.caseClasses, operation: item.operation, input: item.input, expected: expectedSelectors(mzVatEngine.calculate(item.input), item.selectors), tolerance: 0.01, evidence: mzVatFormula.sources[0], changeNote: "reviewed-2026-07-23" });
    }
    const invoiceInput = [
      { description: "normal", quantity: 2, unitPrice: 100 },
      { description: "private health or education", quantity: 1, unitPrice: 100, rateKind: "confirmed-private-health-education", rateEvidenceConfirmed: true, rateEvidenceType: mzVatEngine.PRIVATE_HEALTH_EDUCATION_EVIDENCE },
    ];
    fixtures.push({ id: "mz-vat-evidence-per-line-invoice", formulaId: mzVatFormula.id, formulaVersion: mzVatFormula.formulaVersion, caseClasses: ["invoice_mode", "evidence_gated", "mixed_rate"], operation: "mz-vat-invoice", input: invoiceInput, expected: expectedSelectors(mzVatEngine.calculateInvoice(invoiceInput), ["net", "vat", "gross", "currency", "sourceAsOf", "lines"]), tolerance: 0.01, evidence: mzVatFormula.sources[0], changeNote: "reviewed-2026-07-23" });
    fixtures.push({ id: "mz-vat-retired-seventeen-rejection", formulaId: mzVatFormula.id, formulaVersion: mzVatFormula.formulaVersion, caseClasses: ["retired_rate", "fail_closed"], operation: "mz-vat-evidence-rejection", input: { amount: 1000, mode: "add", rateKind: "legacy-17" }, expected: { error: "unsupported Mozambique VAT treatment" }, tolerance: 0, evidence: mzVatFormula.sources[0], changeNote: "reviewed-2026-07-23" });
  }

  const fuelTrackerFormula = formulas.formulas.find(
    (formula) => formula.id === "formula-assets-js-engines-fuel-tracker-engine",
  );
  if (fuelTrackerFormula) {
    const fuelTrackerEngine = require(
      path.join(root, fuelTrackerFormula.artifactPath),
    );
    const result = fuelTrackerEngine.calculateGenerator({
      pricePerLitre: 1000,
      litresPerHour: 1.5,
      hoursPerDay: 8,
      daysPerMonth: 26,
    });
    fixtures.push({
      id: "fuel-tracker-generator-month",
      formulaId: fuelTrackerFormula.id,
      formulaVersion: fuelTrackerFormula.formulaVersion,
      caseClasses: ["standard_case", "boundary_units"],
      operation: "fuel-tracker-generator",
      input: {
        pricePerLitre: 1000,
        litresPerHour: 1.5,
        hoursPerDay: 8,
        daysPerMonth: 26,
      },
      expected: expectedSelectors(result, [
        "ok",
        "dailyLitres",
        "monthlyLitres",
        "dailyCost",
        "monthlyCost",
        "annualCost",
      ]),
      tolerance: 0,
      evidence: fuelTrackerFormula.sources[0],
      changeNote: "reviewed-2026-07-22",
    });
  }

  const backupPowerFormula = formulas.formulas.find(
    (formula) => formula.id === "formula-assets-js-engines-backup-power-costs",
  );
  if (backupPowerFormula) {
    const backupPowerEngine = require(
      path.join(root, backupPowerFormula.artifactPath),
    );
    const input = {
      loadWatts: 1000,
      outageHours: 4,
      days: 20,
      fuelUsePerHour: 1.5,
      fuelPrice: 1000,
      generatorMaintenance: 10000,
      batterySystemCost: 600000,
      batteryLifeMonths: 60,
      rechargeTariff: 200,
      roundTripEfficiency: 80,
      batteryMaintenance: 5000,
      solarSystemCost: 1200000,
      solarLifeMonths: 120,
      solarMaintenance: 3000,
    };
    const result = backupPowerEngine.calculate(input);
    fixtures.push({
      id: "backup-power-monthly-equivalents",
      formulaId: backupPowerFormula.id,
      formulaVersion: backupPowerFormula.formulaVersion,
      caseClasses: [
        "standard_case",
        "energy_units",
        "straight_line_equivalent",
      ],
      operation: "backup-power-calculate",
      input,
      expected: expectedSelectors(result, [
        "runtimeHours",
        "backupEnergyKwh",
        "generatorFuelUnits",
        "generatorMonthly",
        "batteryRechargeKwh",
        "batteryMonthly",
        "solarMonthly",
        "lowestScenario",
        "lowestMonthly",
        "annualLowestEquivalent",
      ]),
      tolerance: 0.01,
      evidence: backupPowerFormula.sources[0],
      changeNote: "reviewed-2026-07-22",
    });
  }

  const salaryCompareFormula = formulas.formulas.find(
    (formula) =>
      formula.id === "formula-assets-js-engines-salary-offer-compare",
  );
  if (salaryCompareFormula) {
    const salaryEngine = require(
      path.join(root, salaryCompareFormula.artifactPath),
    );
    const input = {
      a: {
        label: "Offer A",
        base: 1000,
        period: "monthly",
        cash: 100,
        bonus: 1200,
        nonCash: 600,
        employer: 1200,
        hours: 40,
        weeks: 52,
        source: "Synthetic written offer A",
        sourceDate: "2026-07-01",
      },
      b: {
        label: "Offer B",
        base: 15000,
        period: "annual",
        cash: 1200,
        bonus: 1500,
        nonCash: 900,
        employer: 1500,
        hours: 40,
        weeks: 52,
        source: "Synthetic written offer B",
        sourceDate: "2026-07-02",
      },
      now: "2026-07-22T00:00:00Z",
    };
    const result = salaryEngine.compare(input.a, input.b, input.now);
    fixtures.push({
      id: "salary-offer-same-currency-comparison",
      formulaId: salaryCompareFormula.id,
      formulaVersion: salaryCompareFormula.formulaVersion,
      caseClasses: ["standard_case", "same_currency", "privacy_boundary"],
      operation: "salary-offer-compare",
      input,
      expected: expectedSelectors(result, [
        "ok",
        "left.annualGrossEarnings",
        "left.annualPackage",
        "left.hourlyGrossEarnings",
        "right.annualGrossEarnings",
        "right.annualPackage",
        "right.hourlyGrossEarnings",
        "grossDelta.absolute",
        "grossDelta.percent",
        "packageDelta.absolute",
        "hourlyDelta.absolute",
      ]),
      tolerance: 0.000001,
      evidence: salaryCompareFormula.sources[0],
      changeNote: "reviewed-2026-07-22",
    });
  }

  const salaryEvidenceFormula = formulas.formulas.find(
    (formula) =>
      formula.id === "formula-assets-js-engines-salary-evidence-notebook",
  );
  if (salaryEvidenceFormula) {
    const salaryEvidenceEngine = require(
      path.join(root, salaryEvidenceFormula.artifactPath),
    );
    const rows = [1000, 1200, 1400, 1600, 1800].map((amount, index) => ({
      country: "NG",
      city: "Lagos",
      role: "Analyst",
      experience: "Mid",
      currency: "NGN",
      basis: "gross",
      period: "monthly",
      amount,
      source: "Synthetic comparable " + (index + 1),
      observedDate: "2026-07-01",
    }));
    const input = {
      rows,
      options: { horizonDays: 90, now: "2026-07-22T00:00:00Z" },
    };
    const result = salaryEvidenceEngine.analyze(input.rows, input.options);
    fixtures.push({
      id: "salary-evidence-five-row-percentiles",
      formulaId: salaryEvidenceFormula.id,
      formulaVersion: salaryEvidenceFormula.formulaVersion,
      caseClasses: [
        "standard_case",
        "percentile_method",
        "freshness_boundary",
        "privacy_boundary",
      ],
      operation: "salary-evidence-analyze",
      input,
      expected: expectedSelectors(result, [
        "ok",
        "count",
        "staleCount",
        "horizonDays",
        "minimum",
        "q1",
        "median",
        "q3",
        "maximum",
        "profile.country",
        "profile.currency",
        "profile.basis",
      ]),
      tolerance: 0.000001,
      evidence: salaryEvidenceFormula.sources[0],
      changeNote: "reviewed-2026-07-22",
    });
  }

  const retirementScenarioFormula = formulas.formulas.find(
    (formula) =>
      formula.id === "formula-assets-js-engines-retirement-scenario-planner",
  );
  if (retirementScenarioFormula) {
    const retirementEngine = require(
      path.join(root, retirementScenarioFormula.artifactPath),
    );
    const input = {
      currentAge: 35,
      targetAge: 60,
      balance: 100000,
      monthlyContribution: 1000,
      annualSpending: 30000,
      otherAnnualIncome: 6000,
      realReturnPct: 4,
      withdrawalRatePct: 4,
      currency: "USD",
      assumptionSource: "Synthetic reviewed assumptions",
      assumptionDate: "2026-07-01",
    };
    const result = retirementEngine.calculate(input, "2026-07-22T00:00:00Z");
    fixtures.push({
      id: "retirement-today-money-scenario",
      formulaId: retirementScenarioFormula.id,
      formulaVersion: retirementScenarioFormula.formulaVersion,
      caseClasses: [
        "standard_case",
        "monthly_compounding",
        "today_money",
        "privacy_boundary",
      ],
      operation: "retirement-scenario-calculate",
      input: { values: input, now: "2026-07-22T00:00:00Z" },
      expected: expectedSelectors(result, [
        "ok",
        "years",
        "months",
        "targetAnnualPortfolioIncome",
        "targetFund",
        "projectedFund",
        "gap",
        "requiredMonthlyContribution",
        "contributedPrincipal",
        "modeledGrowth",
        "modeledAnnualSpendingCapacity",
        "monthlyRealReturn",
        "crossMonth",
        "crossAge",
      ]),
      tolerance: 0.000001,
      evidence: retirementScenarioFormula.sources[0],
      changeNote: "reviewed-2026-07-22",
    });
  }

  const sideIncomeReserveFormula = formulas.formulas.find(
    (formula) =>
      formula.id === "formula-assets-js-engines-side-income-tax-reserve",
  );
  if (sideIncomeReserveFormula) {
    const sideIncomeEngine = require(
      path.join(root, sideIncomeReserveFormula.artifactPath),
    );
    const input = {
      currency: "KES",
      jurisdiction: "Kenya",
      taxPeriod: "2026 year of income",
      grossRevenue: 1000000,
      refunds: 50000,
      platformFees: 100000,
      otherExpenses: 150000,
      taxCredits: 20000,
      reserveRatePct: 20,
      instalments: 4,
      evidenceLabel: "Synthetic official-notice reference",
      evidenceDate: "2026-07-20",
    };
    const now = "2026-07-22T12:00:00Z";
    const result = sideIncomeEngine.calculate(input, now);
    fixtures.push({
      id: "side-income-tax-reserve-user-assumptions",
      formulaId: sideIncomeReserveFormula.id,
      formulaVersion: sideIncomeReserveFormula.formulaVersion,
      caseClasses: [
        "standard_case",
        "user_supplied_rate",
        "freshness_boundary",
        "privacy_boundary",
      ],
      operation: "side-income-tax-reserve-calculate",
      input: { values: input, now },
      expected: expectedSelectors(result, [
        "ok",
        "totalCosts",
        "planningProfit",
        "reserveBeforeCredits",
        "reserveAfterCredits",
        "cashAfterCosts",
        "cashAfterReserve",
        "reservePerInstalment",
        "expenseRatioPct",
        "reserveGrossRatePct",
      ]),
      tolerance: 0.000001,
      evidence: sideIncomeReserveFormula.sources[0],
      changeNote: "reviewed-2026-07-22",
    });
  }

  const bankChargeOfferFormula = formulas.formulas.find(
    (formula) =>
      formula.id === "formula-assets-js-engines-bank-charge-offer-compare",
  );
  if (bankChargeOfferFormula) {
    const bankChargeEngine = require(
      path.join(root, bankChargeOfferFormula.artifactPath),
    );
    const input = {
      currency: "KES",
      comparisonLabel: "Synthetic current offers",
      transfers: 10,
      atmWithdrawals: 2,
      messages: 10,
      internationalSpend: 10000,
      nameA: "Offer A",
      monthlyAccountFeeA: 100,
      transferFeeA: 5,
      atmFeeA: 20,
      messageFeeA: 1,
      annualCardFeeA: 120,
      internationalFeePctA: 2,
      otherMonthlyFeeA: 30,
      evidenceLabelA: "Synthetic provider tariff A",
      evidenceDateA: "2026-07-20",
      nameB: "Offer B",
      monthlyAccountFeeB: 50,
      transferFeeB: 7,
      atmFeeB: 10,
      messageFeeB: 2,
      annualCardFeeB: 240,
      internationalFeePctB: 1,
      otherMonthlyFeeB: 20,
      evidenceLabelB: "Synthetic provider tariff B",
      evidenceDateB: "2026-07-20",
    };
    const now = "2026-07-22T12:00:00Z";
    const result = bankChargeEngine.calculate(input, now);
    fixtures.push({
      id: "bank-charge-two-offer-user-tariffs",
      formulaId: bankChargeOfferFormula.id,
      formulaVersion: bankChargeOfferFormula.formulaVersion,
      caseClasses: [
        "standard_case",
        "user_supplied_fees",
        "freshness_boundary",
        "privacy_boundary",
      ],
      operation: "bank-charge-offer-calculate",
      input: { values: input, now },
      expected: expectedSelectors(result, [
        "ok",
        "offerA.monthlyTotal",
        "offerA.annualTotal",
        "offerB.monthlyTotal",
        "offerB.annualTotal",
        "monthlyDifference",
        "annualDifference",
        "lowerModeledCost",
      ]),
      tolerance: 0.000001,
      evidence: bankChargeOfferFormula.sources[0],
      changeNote: "reviewed-2026-07-22",
    });
  }

  const inflationScenarioFormula = formulas.formulas.find(
    (formula) => formula.id === "formula-assets-js-engines-inflation-scenario",
  );
  if (inflationScenarioFormula) {
    const inflationEngine = require(
      path.join(root, inflationScenarioFormula.artifactPath),
    );
    const input = {
      currency: "KES",
      amount: 1000,
      annualRate: 10,
      years: 2,
      sourceLabel: "Synthetic current CPI release",
      sourceDate: "2026-07-20",
    };
    const today = "2026-07-22";
    const result = inflationEngine.calculate(input, today);
    fixtures.push({
      id: "inflation-user-rate-two-year-scenario",
      formulaId: inflationScenarioFormula.id,
      formulaVersion: inflationScenarioFormula.formulaVersion,
      caseClasses: [
        "standard_case",
        "compound_growth",
        "freshness_boundary",
        "privacy_boundary",
      ],
      operation: "inflation-scenario-calculate",
      input: { values: input, today },
      expected: expectedSelectors(result, [
        "ok",
        "factor",
        "priceEquivalent",
        "purchasingPower",
        "purchasingPowerChange",
        "requiredIncrease",
        "timeline",
      ]),
      tolerance: 0.000001,
      evidence: inflationScenarioFormula.sources[0],
      changeNote: "reviewed-2026-07-22",
    });
  }

  const savingsGoalFormula = formulas.formulas.find(
    (formula) => formula.id === "formula-assets-js-engines-savings-goal-plan",
  );
  if (savingsGoalFormula) {
    const savingsEngine = require(
      path.join(root, savingsGoalFormula.artifactPath),
    );
    const input = {
      currency: "KES",
      goal: 20000,
      currentSavings: 1000,
      monthlyContribution: 500,
      months: 12,
      annualRate: 12,
      rateSource: "Synthetic current provider terms",
      sourceDate: "2026-07-20",
    };
    const today = "2026-07-22";
    const result = savingsEngine.calculate(input, today);
    fixtures.push({
      id: "savings-goal-month-end-effective-return",
      formulaId: savingsGoalFormula.id,
      formulaVersion: savingsGoalFormula.formulaVersion,
      caseClasses: [
        "standard_case",
        "monthly_compounding",
        "freshness_boundary",
        "privacy_boundary",
      ],
      operation: "savings-goal-calculate",
      input: { values: input, today },
      expected: expectedSelectors(result, [
        "ok",
        "monthlyRate",
        "endingBalance",
        "totalContributed",
        "modeledGrowth",
        "gap",
        "progress",
        "requiredMonthlyContribution",
        "timeline",
      ]),
      tolerance: 0.000001,
      evidence: savingsGoalFormula.sources[0],
      changeNote: "reviewed-2026-07-22",
    });
  }

  const carLoanFormula = formulas.formulas.find(
    (formula) => formula.id === "formula-assets-js-engines-car-loan-plan",
  );
  if (carLoanFormula) {
    const carLoanEngine = require(path.join(root, carLoanFormula.artifactPath));
    const input = {
      currency: "KES",
      vehiclePrice: 20000,
      deposit: 2000,
      tradeIn: 0,
      financedFees: 500,
      annualRate: 12,
      months: 24,
      balloon: 5000,
      monthlyNetIncome: 5000,
      otherMonthlyDebt: 500,
      monthlyInsurance: 100,
      monthlyFuel: 200,
      monthlyMaintenance: 50,
      otherMonthlyVehicleCost: 50,
      offerSource: "Synthetic current lender offer",
      sourceDate: "2026-07-22",
    };
    const today = "2026-07-22";
    const result = carLoanEngine.calculate(input, today);
    fixtures.push({
      id: "car-loan-fixed-rate-balloon",
      formulaId: carLoanFormula.id,
      formulaVersion: carLoanFormula.formulaVersion,
      caseClasses: [
        "standard_case",
        "monthly_compounding",
        "balloon_payment",
        "freshness_boundary",
        "privacy_boundary",
      ],
      operation: "car-loan-calculate",
      input: { values: input, today },
      expected: expectedSelectors(result, [
        "ok",
        "principal",
        "monthlyPayment",
        "totalLoanPayments",
        "totalFinanceCost",
        "totalInterest",
        "monthlyOperatingCost",
        "monthlyVehicleCost",
        "modeledOutlay",
        "debtLoadPercent",
        "cashAfterVehicle",
        "schedule",
      ]),
      tolerance: 0.000001,
      evidence: carLoanFormula.sources[0],
      changeNote: "reviewed-2026-07-22",
    });
  }

  const studentLoanFormula = formulas.formulas.find(
    (formula) => formula.id === "formula-assets-js-engines-student-loan-plan",
  );
  if (studentLoanFormula) {
    const studentLoanEngine = require(
      path.join(root, studentLoanFormula.artifactPath),
    );
    const today = "2026-07-22";
    const cases = [
      {
        id: "student-loan-grace-interest-and-extra",
        caseClasses: ["standard_case", "monthly_compounding", "grace_period", "freshness_boundary", "privacy_boundary"],
        values: {
          currency: "KES", statementBalance: 10000, financedFees: 500,
          annualRate: 12, repaymentMonths: 12, graceMonths: 2,
          graceAccrual: true, monthlyFee: 10, extraPayment: 500,
          monthlyNetIncome: 5000, otherMonthlyDebt: 500,
          termsSource: "Synthetic current statement", sourceDate: "2026-07-22",
        },
      },
      {
        id: "student-loan-oversized-extra-cap",
        caseClasses: ["very_large_value", "payment_cap", "affordability_context"],
        values: {
          currency: "KES", statementBalance: 10000, financedFees: 500,
          annualRate: 0, repaymentMonths: 10, graceMonths: 0,
          graceAccrual: false, monthlyFee: 10, extraPayment: 50000,
          monthlyNetIncome: 5000, otherMonthlyDebt: 500,
          termsSource: "Synthetic current statement", sourceDate: "2026-07-22",
        },
      },
    ];
    for (const item of cases) {
      const result = studentLoanEngine.calculate(item.values, today);
      fixtures.push({
        id: item.id,
        formulaId: studentLoanFormula.id,
        formulaVersion: studentLoanFormula.formulaVersion,
        caseClasses: item.caseClasses,
        operation: "student-loan-calculate",
        input: { values: item.values, today },
        expected: expectedSelectors(result, [
          "ok", "openingBalance", "balanceAtRepaymentStart", "scheduledPayment",
          "firstCashPayment", "repaymentCount", "totalTimelineMonths", "totalInterest",
          "totalLoanPayments", "totalServicingFees", "totalFees", "totalPaid",
          "debtLoadPercent", "cashAfterPayment", "schedule",
        ]),
        tolerance: 0.000001,
        evidence: studentLoanFormula.sources[0],
        changeNote: "reviewed-2026-07-22",
      });
    }
  }

  return {
    $schema: "./calculation-quality.schema.json#/$defs/GoldenFixtureRegistry",
    schemaVersion: 1,
    fixtures: fixtures.sort((a, b) => a.id.localeCompare(b.id)),
  };
}

function externalDataContracts() {
  return {
    $schema: "./calculation-quality.schema.json#/$defs/ExternalDataRegistry",
    schemaVersion: 1,
    datasets: [
      {
        id: "forex-live-rates",
        storageKey: "forex-latest",
        staticFallbackPath: "data/forex/latest.json",
        sourceRegistryId: "forex-third-party-snapshot",
        schemaVersion: 1,
        requiredPaths: [
          "schemaVersion",
          "timestamp",
          "source",
          "base",
          "rates.NGN",
        ],
        retrievedAtPath: "timestamp",
        sourcePath: "source",
        maxAgeHours: 24,
        lastKnownGoodStrategy: "static-fallback",
        incompatibleAction: "reject-before-write",
        publicStaleLabel: "Stale exchange-rate estimate",
        forbiddenStaleLabels: ["live", "current", "official verified"],
      },
      {
        id: "fuel-live-prices",
        storageKey: "fuel-latest",
        staticFallbackPath: "data/fuel/latest.json",
        sourceRegistryId: "afrofuel-static-snapshot",
        schemaVersion: 1,
        requiredPaths: [
          "schemaVersion",
          "timestamp",
          "source_state",
          "countries",
        ],
        retrievedAtPath: "timestamp",
        sourcePath: "source_state",
        maxAgeHours: 720,
        lastKnownGoodStrategy: "static-fallback",
        incompatibleAction: "reject-before-write",
        publicStaleLabel: "Stale fuel-price estimate",
        forbiddenStaleLabels: ["live", "current", "official verified"],
      },
      {
        id: "policy-live-rates",
        storageKey: "rates-latest",
        staticFallbackPath: "data/rates/latest.json",
        sourceRegistryId: "afrorates-policy-rate-pack",
        schemaVersion: 1,
        requiredPaths: ["schemaVersion", "timestamp", "countries"],
        retrievedAtPath: "timestamp",
        sourcePath: "_verification.policy_rate_verified_at",
        maxAgeHours: 1080,
        lastKnownGoodStrategy: "static-fallback",
        incompatibleAction: "reject-before-write",
        publicStaleLabel: "Stale policy-rate reference",
        forbiddenStaleLabels: ["live", "current", "official verified"],
      },
    ],
  };
}

function buildQualityArtifacts(root) {
  const built = buildInventoryAndFormulas(root);
  return {
    inventory: built.inventory,
    formulas: built.formulas,
    fixtures: generateGoldenFixtures(built.formulas, root),
    externalData: externalDataContracts(),
    fixtureDeltas: {
      $schema: "./calculation-quality.schema.json#/$defs/FixtureDeltaRegistry",
      schemaVersion: 1,
      deltas: [],
    },
  };
}

function assertDate(value, label) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) ||
    Number.isNaN(new Date(value + "T00:00:00Z").getTime())
  ) {
    throw new Error(label + " must be an ISO date");
  }
}

function assertFormulaMetadata(formula, engine, root) {
  const requiredStrings = [
    "id",
    "formulaFamily",
    "formulaVersion",
    "artifactPath",
    "artifactDigest",
    "applicablePopulation",
    "effectiveDateStatus",
    "lastVerified",
    "owner",
    "disclaimer",
    "riskLevel",
    "riskDomain",
  ];
  for (const field of requiredStrings) {
    if (!formula[field] || typeof formula[field] !== "string")
      throw new Error(formula.id + " missing " + field);
  }
  if (!["high", "medium"].includes(formula.riskLevel))
    throw new Error(formula.id + " invalid protected risk level");
  if (!RISK_DOMAINS.includes(formula.riskDomain))
    throw new Error(formula.id + " invalid risk domain");
  if (!Array.isArray(formula.jurisdictions) || !formula.jurisdictions.length)
    throw new Error(formula.id + " missing jurisdictions");
  if (
    !Array.isArray(formula.sourceJurisdictions) ||
    !formula.sourceJurisdictions.length
  )
    throw new Error(formula.id + " missing sourceJurisdictions");
  if (!Array.isArray(formula.sources) || !formula.sources.length)
    throw new Error(formula.id + " missing sources");
  if (!formula.parameters || typeof formula.parameters !== "object")
    throw new Error(formula.id + " missing parameters");
  if (!formula.rounding || typeof formula.rounding !== "object")
    throw new Error(formula.id + " missing rounding");
  if (!Array.isArray(formula.units) || !formula.units.length)
    throw new Error(formula.id + " missing units");
  if (
    !Array.isArray(formula.knownExclusions) ||
    !formula.knownExclusions.length
  )
    throw new Error(formula.id + " missing exclusions");
  if (!Array.isArray(formula.protectedDuplicates))
    throw new Error(formula.id + " missing protectedDuplicates");
  assertDate(formula.lastVerified, formula.id + " lastVerified");
  if (formula.effectiveDateStatus === "declared") {
    assertDate(formula.effectiveFrom, formula.id + " effectiveFrom");
    if (formula.effectiveTo)
      assertDate(formula.effectiveTo, formula.id + " effectiveTo");
    if (formula.effectiveTo && formula.effectiveTo < formula.effectiveFrom)
      throw new Error(formula.id + " invalid effective period");
  }
  const currentDigest = digestFile(root, formula.artifactPath);
  if (currentDigest !== formula.artifactDigest)
    throw new Error(
      "FORMULA_DIGEST_MISMATCH " + formula.id + " " + formula.artifactPath,
    );
  if (!formula.formulaVersion.includes(formula.artifactDigest.slice(7, 19)))
    throw new Error(formula.id + " formulaVersion does not include digest");
  if (
    engine &&
    engine.artifactPath !== formula.artifactPath &&
    !formula.protectedDuplicates.includes(engine.artifactPath)
  ) {
    throw new Error(
      engine.id +
        " is not the formula artifact or a protected duplicate for " +
        formula.id,
    );
  }
  return true;
}

function checkHighRiskRouteTraceability(verification, formulaRegistry) {
  const formulas = new Map(
    (formulaRegistry.formulas || []).map((formula) => [formula.id, formula]),
  );
  const mappings = new Map();
  for (const mapping of formulaRegistry.routeMappings || []) {
    if (!mappings.has(mapping.toolId)) mappings.set(mapping.toolId, []);
    mappings.get(mapping.toolId).push(mapping);
  }
  const gaps = [];
  const protectedEntries = Object.entries(verification.tools || {}).filter(
    ([, entry]) =>
      entry.risk_level === "high" && entry.calculation_required !== false,
  );
  let mappedRoutes = 0;
  for (const [toolId] of protectedEntries) {
    const matches = mappings.get(toolId) || [];
    if (matches.length !== 1) {
      gaps.push(
        toolId +
          ": expected exactly one formula mapping, found " +
          matches.length,
      );
      continue;
    }
    const formula = formulas.get(matches[0].formulaId);
    const externalSources = matches[0].sourceUrls.filter(
      (url) => /^https?:\/\//i.test(url) && !/afrotools\./i.test(url),
    );
    if (!formula) gaps.push(toolId + ": mapped formula missing");
    else if (!externalSources.length)
      gaps.push(toolId + ": no external source URL");
    else mappedRoutes += 1;
  }
  return {
    protectedRoutes: protectedEntries.length,
    mappedRoutes,
    gaps: gaps.sort(),
  };
}

function resolveFormula(formulaRegistry, request) {
  const jurisdiction = String(request.jurisdiction || "").toUpperCase();
  const effectiveOn = String(request.effectiveOn || "");
  const base = {
    formulaFamily: request.formulaFamily,
    jurisdiction,
    effectiveOn,
  };
  const family = (formulaRegistry.formulas || []).filter(
    (formula) => formula.formulaFamily === request.formulaFamily,
  );
  const jurisdictionMatches = family.filter((formula) =>
    formula.jurisdictions.includes(jurisdiction),
  );
  if (!jurisdictionMatches.length)
    return { ok: false, error: "UNSUPPORTED_JURISDICTION", ...base };
  const dateMatches = jurisdictionMatches.filter((formula) => {
    if (formula.effectiveDateStatus === "not-applicable") return true;
    if (formula.effectiveDateStatus !== "declared") return false;
    return (
      effectiveOn >= formula.effectiveFrom &&
      (!formula.effectiveTo || effectiveOn <= formula.effectiveTo)
    );
  });
  if (!dateMatches.length)
    return { ok: false, error: "UNSUPPORTED_DATE", ...base };
  if (dateMatches.length > 1)
    return { ok: false, error: "AMBIGUOUS_FORMULA_VERSION", ...base };
  const formula = dateMatches[0];
  return {
    ok: true,
    formulaId: formula.id,
    formulaVersion: formula.formulaVersion,
    artifactPath: formula.artifactPath,
    jurisdiction,
    effectiveFrom: formula.effectiveFrom,
    effectiveTo: formula.effectiveTo,
  };
}

function compareExpected(actual, expected, tolerance) {
  const failures = [];

  function compareValue(actualValue, expectedValue, selector) {
    if (typeof expectedValue === "number" && typeof actualValue === "number") {
      if (Math.abs(actualValue - expectedValue) > tolerance)
        failures.push(
          selector + ": expected " + expectedValue + ", got " + actualValue,
        );
      return;
    }

    if (
      expectedValue &&
      actualValue &&
      typeof expectedValue === "object" &&
      typeof actualValue === "object"
    ) {
      if (Array.isArray(expectedValue) !== Array.isArray(actualValue)) {
        failures.push(
          selector +
            ": expected " +
            JSON.stringify(expectedValue) +
            ", got " +
            JSON.stringify(actualValue),
        );
        return;
      }

      if (Array.isArray(expectedValue)) {
        if (actualValue.length !== expectedValue.length) {
          failures.push(
            selector +
              ".length: expected " +
              expectedValue.length +
              ", got " +
              actualValue.length,
          );
          return;
        }
        expectedValue.forEach((value, index) =>
          compareValue(actualValue[index], value, selector + "[" + index + "]"),
        );
        return;
      }

      for (const [key, value] of Object.entries(expectedValue))
        compareValue(actualValue[key], value, selector + "." + key);
      return;
    }

    if (actualValue !== expectedValue)
      failures.push(
        selector +
          ": expected " +
          JSON.stringify(expectedValue) +
          ", got " +
          JSON.stringify(actualValue),
      );
  }

  for (const [selector, expectedValue] of Object.entries(expected)) {
    const actualValue = getPath(actual, selector);
    compareValue(actualValue, expectedValue, selector);
  }
  return failures;
}

function runGoldenFixtures(artifacts, root) {
  const engineRegistry = require(path.join(root, "netlify/functions/_engines"));
  const taxRequest = require(
    path.join(root, "netlify/functions/_shared/tax-request"),
  );
  const formulaById = new Map(
    artifacts.formulas.formulas.map((formula) => [formula.id, formula]),
  );
  const failures = [];
  const changes = [];
  let passed = 0;

  for (const fixture of artifacts.fixtures.fixtures) {
    const formula = formulaById.get(fixture.formulaId);
    if (!formula || formula.formulaVersion !== fixture.formulaVersion) {
      failures.push({ id: fixture.id, errors: ["Formula version mismatch"] });
      continue;
    }
    let actual;
    try {
      if (fixture.operation === "paye-calculate") {
        const engine = engineRegistry.get(fixture.input.country);
        if (!engine)
          throw new Error(
            "Unsupported fixture country " + fixture.input.country,
          );
        const input = { ...fixture.input };
        delete input.country;
        actual = engine.calculate(input);
      } else if (fixture.operation === "tax-input-rejection") {
        try {
          taxRequest.resolveAnnualSalaryInputs(fixture.input);
          actual = { error: null };
        } catch (error) {
          actual = { error: error.message };
        }
      } else if (fixture.operation === "formula-resolve") {
        actual = resolveFormula(artifacts.formulas, fixture.input);
      } else if (
        fixture.operation === "za-uif-contribution" ||
        fixture.operation === "za-uif-benefit" ||
        fixture.operation === "za-uif-maternity"
      ) {
        const engine = require(path.join(root, formula.artifactPath));
        actual =
          fixture.operation === "za-uif-contribution"
            ? engine.calculateContribution(fixture.input)
            : fixture.operation === "za-uif-benefit"
              ? engine.calculateBenefitPlan(fixture.input)
              : engine.calculateMaternityPlan(fixture.input);
      } else if (fixture.operation === "investment-return-project") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.project(fixture.input);
      } else if (fixture.operation === "crypto-cgt-calculate") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.calculate(fixture.input);
      } else if (fixture.operation === "pension-projection-calculate") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.calculate(fixture.input);
      } else if (fixture.operation === "staff-cost-calculate") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.calculate(fixture.input);
      } else if (
        fixture.operation === "km-tc-calculate" ||
        fixture.operation === "km-tc-threshold"
      ) {
        const engine = require(path.join(root, formula.artifactPath));
        actual =
          fixture.operation === "km-tc-calculate"
            ? engine.calculate(fixture.input)
            : engine.thresholdScreen(
                fixture.input.turnover,
                fixture.input.importerConfirmed,
              );
      } else if (
        fixture.operation === "cg-vat-calculate" ||
        fixture.operation === "cg-vat-threshold"
      ) {
        const engine = require(path.join(root, formula.artifactPath));
        actual =
          fixture.operation === "cg-vat-calculate"
            ? engine.calculate(fixture.input)
            : engine.registrationScreen(fixture.input.turnover);
      } else if (
        fixture.operation === "ci-vat-calculate" ||
        fixture.operation === "ci-vat-regime"
      ) {
        const engine = require(path.join(root, formula.artifactPath));
        actual =
          fixture.operation === "ci-vat-calculate"
            ? engine.calculate(fixture.input)
            : engine.regimeScreen(fixture.input.turnover);
      } else if (
        fixture.operation === "dj-vat-calculate" ||
        fixture.operation === "dj-vat-threshold"
      ) {
        const engine = require(path.join(root, formula.artifactPath));
        actual =
          fixture.operation === "dj-vat-calculate"
            ? engine.calculate(fixture.input)
            : engine.thresholdScreen(fixture.input.turnover);
      } else if (
        fixture.operation === "cd-vat-calculate" ||
        fixture.operation === "cd-vat-registration"
      ) {
        const engine = require(path.join(root, formula.artifactPath));
        actual =
          fixture.operation === "cd-vat-calculate"
            ? engine.calculate(fixture.input)
            : engine.registrationScreen(
                fixture.input.turnover,
                fixture.input.liberalProfession,
              );
      } else if (fixture.operation === "gq-vat-calculate") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.calculate(fixture.input);
      } else if (fixture.operation === "er-vat-calculate") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.calculate(fixture.input);
      } else if (fixture.operation === "er-vat-evidence-rejection") {
        const engine = require(path.join(root, formula.artifactPath));
        try {
          engine.calculate(fixture.input);
          actual = { error: null };
        } catch (error) {
          actual = { error: error.code || error.message };
        }
      } else if (fixture.operation === "et-vat-calculate") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.calculate(fixture.input);
      } else if (fixture.operation === "et-vat-evidence-rejection") {
        const engine = require(path.join(root, formula.artifactPath));
        try {
          engine.calculate(fixture.input);
          actual = { error: null };
        } catch (error) {
          actual = { error: error.code || error.message };
        }
      } else if (fixture.operation === "sz-vat-calculate") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.calculate(fixture.input);
      } else if (fixture.operation === "sz-vat-evidence-rejection") {
        const engine = require(path.join(root, formula.artifactPath));
        try {
          engine.calculate(fixture.input);
          actual = { error: null };
        } catch (error) {
          actual = { error: error.code || error.message };
        }
      } else if (fixture.operation === "ga-vat-calculate") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.calculate(fixture.input);
      } else if (fixture.operation === "ga-vat-evidence-rejection") {
        const engine = require(path.join(root, formula.artifactPath));
        try {
          engine.calculate(fixture.input);
          actual = { error: null };
        } catch (error) {
          actual = { error: error.code || error.message };
        }
      } else if (fixture.operation === "gm-vat-calculate") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.calculate(fixture.input);
      } else if (fixture.operation === "gm-vat-evidence-rejection") {
        const engine = require(path.join(root, formula.artifactPath));
        try {
          engine.calculate(fixture.input);
          actual = { error: null };
        } catch (error) {
          actual = { error: error.code || error.message };
        }
      } else if (fixture.operation === "gn-vat-calculate") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.calculate(fixture.input);
      } else if (fixture.operation === "gn-vat-registration-review") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.registrationReview(
          fixture.input.turnover,
          fixture.input.voluntaryEvidence,
        );
      } else if (fixture.operation === "gn-vat-evidence-rejection") {
        const engine = require(path.join(root, formula.artifactPath));
        try {
          engine.calculate(fixture.input);
          actual = { error: null };
        } catch (error) {
          actual = { error: error.code || error.message };
        }
      } else if (fixture.operation === "gw-vat-calculate") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.calculate(fixture.input);
      } else if (fixture.operation === "gw-vat-evidence-rejection") {
        const engine = require(path.join(root, formula.artifactPath));
        try {
          engine.calculate(fixture.input);
          actual = { error: null };
        } catch (error) {
          actual = { error: error.code || error.message };
        }
      } else if (fixture.operation === "ls-vat-calculate") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.calculate(fixture.input);
      } else if (fixture.operation === "ls-vat-evidence-rejection") {
        const engine = require(path.join(root, formula.artifactPath));
        try {
          engine.calculate(fixture.input);
          actual = { error: null };
        } catch (error) {
          actual = { error: error.code || error.message };
        }
      } else if (fixture.operation === "lr-vat-calculate") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.calculate(fixture.input);
      } else if (fixture.operation === "lr-vat-evidence-rejection") {
        const engine = require(path.join(root, formula.artifactPath));
        try {
          engine.calculate(fixture.input);
          actual = { error: null };
        } catch (error) {
          actual = { error: error.code || error.message };
        }
      } else if (fixture.operation === "mg-vat-calculate") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.calculate(fixture.input);
      } else if (fixture.operation === "mg-vat-evidence-rejection") {
        const engine = require(path.join(root, formula.artifactPath));
        try {
          engine.calculate(fixture.input);
          actual = { error: null };
        } catch (error) {
          actual = { error: error.code || error.message };
        }
      } else if (fixture.operation === "mw-vat-calculate") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.calculate(fixture.input);
      } else if (fixture.operation === "mw-vat-evidence-rejection") {
        const engine = require(path.join(root, formula.artifactPath));
        try {
          engine.calculate(fixture.input);
          actual = { error: null };
        } catch (error) {
          actual = { error: error.code || error.message };
        }
      } else if (fixture.operation === "ml-vat-calculate") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.calculate(fixture.input);
      } else if (fixture.operation === "ml-vat-evidence-rejection") {
        const engine = require(path.join(root, formula.artifactPath));
        try {
          engine.calculate(fixture.input);
          actual = { error: null };
        } catch (error) {
          actual = { error: error.code || error.message };
        }
      } else if (fixture.operation === "mr-vat-calculate") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.calculate(fixture.input);
      } else if (fixture.operation === "mr-vat-evidence-rejection") {
        const engine = require(path.join(root, formula.artifactPath));
        try {
          engine.calculate(fixture.input);
          actual = { error: null };
        } catch (error) {
          actual = { error: error.code || error.message };
        }
      } else if (fixture.operation === "mu-vat-calculate") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.calculate(fixture.input);
      } else if (fixture.operation === "mu-vat-evidence-rejection") {
        const engine = require(path.join(root, formula.artifactPath));
        try {
          engine.calculate(fixture.input);
          actual = { error: null };
        } catch (error) {
          actual = { error: error.code || error.message };
        }
      } else if (fixture.operation === "ma-vat-calculate") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.calculate(fixture.input);
      } else if (fixture.operation === "ma-vat-invoice") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.calculateInvoice(fixture.input);
      } else if (fixture.operation === "ma-vat-evidence-rejection") {
        const engine = require(path.join(root, formula.artifactPath));
        try {
          engine.calculate(fixture.input);
          actual = { error: null };
        } catch (error) {
          actual = { error: error.code || error.message };
        }
      } else if (fixture.operation === "ng-pension-contribution") {
        const engine = loadBrowserGlobal(root, formula.artifactPath, "NgPensionEngine");
        actual = engine.checkContributions(
          fixture.input.emoluments,
          fixture.input.employeeRate,
          fixture.input.employerRate,
        );
      } else if (fixture.operation === "ng-pension-scenario") {
        const engine = loadBrowserGlobal(root, formula.artifactPath, "NgPensionEngine");
        actual = engine.calculateScenario(fixture.input);
      } else if (fixture.operation === "mz-vat-calculate") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.calculate(fixture.input);
      } else if (fixture.operation === "mz-vat-invoice") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.calculateInvoice(fixture.input);
      } else if (fixture.operation === "mz-vat-evidence-rejection") {
        const engine = require(path.join(root, formula.artifactPath));
        try {
          engine.calculate(fixture.input);
          actual = { error: null };
        } catch (error) {
          actual = { error: error.code || error.message };
        }
      } else if (fixture.operation === "fuel-tracker-generator") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.calculateGenerator(fixture.input);
      } else if (fixture.operation === "backup-power-calculate") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.calculate(fixture.input);
      } else if (fixture.operation === "salary-offer-compare") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.compare(
          fixture.input.a,
          fixture.input.b,
          fixture.input.now,
        );
      } else if (fixture.operation === "salary-evidence-analyze") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.analyze(fixture.input.rows, fixture.input.options);
      } else if (fixture.operation === "retirement-scenario-calculate") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.calculate(fixture.input.values, fixture.input.now);
      } else if (fixture.operation === "side-income-tax-reserve-calculate") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.calculate(fixture.input.values, fixture.input.now);
      } else if (fixture.operation === "bank-charge-offer-calculate") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.calculate(fixture.input.values, fixture.input.now);
      } else if (fixture.operation === "inflation-scenario-calculate") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.calculate(fixture.input.values, fixture.input.today);
      } else if (fixture.operation === "savings-goal-calculate") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.calculate(fixture.input.values, fixture.input.today);
      } else if (fixture.operation === "car-loan-calculate") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.calculate(fixture.input.values, fixture.input.today);
      } else if (fixture.operation === "student-loan-calculate") {
        const engine = require(path.join(root, formula.artifactPath));
        actual = engine.calculate(fixture.input.values, fixture.input.today);
      } else {
        throw new Error("Unknown fixture operation " + fixture.operation);
      }
      const fixtureFailures = compareExpected(
        actual,
        fixture.expected,
        fixture.tolerance || 0,
      );
      if (fixtureFailures.length)
        failures.push({ id: fixture.id, errors: fixtureFailures });
      else passed += 1;
    } catch (error) {
      failures.push({ id: fixture.id, errors: [error.message] });
    }
  }

  for (const delta of artifacts.fixtureDeltas.deltas || [])
    changes.push(delta.fixtureId);
  return {
    total: artifacts.fixtures.fixtures.length,
    passed,
    failed: failures.length,
    failures,
    changes: changes.sort(),
  };
}

function validateExternalData(contract, payload, nowIso) {
  const errors = [];
  if (!payload || typeof payload !== "object")
    errors.push("payload must be an object");
  for (const requiredPath of contract.requiredPaths || []) {
    const value = getPath(payload, requiredPath);
    if (value === undefined || value === null || value === "")
      errors.push("missing required path " + requiredPath);
  }
  const sourceValue = payload ? getPath(payload, contract.sourcePath) : null;
  if (sourceValue === undefined || sourceValue === null || sourceValue === "")
    errors.push("missing source metadata at " + contract.sourcePath);
  if (payload && payload.schemaVersion !== contract.schemaVersion)
    errors.push("schemaVersion must equal " + contract.schemaVersion);
  const retrievedAt = payload
    ? getPath(payload, contract.retrievedAtPath)
    : null;
  const retrievedMs = new Date(retrievedAt).getTime();
  if (!retrievedAt || Number.isNaN(retrievedMs))
    errors.push("invalid retrieval timestamp at " + contract.retrievedAtPath);
  if (errors.length) {
    return {
      valid: false,
      code: "INCOMPATIBLE_EXTERNAL_DATA",
      publicState: "unavailable",
      publicLabel: "Data unavailable - retained last-known-good value",
      errors,
      retrievedAt: retrievedAt || null,
      preserveLastKnownGood: true,
    };
  }
  const ageHours = (new Date(nowIso).getTime() - retrievedMs) / 3600000;
  const stale = ageHours > contract.maxAgeHours;
  return {
    valid: true,
    code: stale ? "STALE_EXTERNAL_DATA" : "OK",
    publicState: stale ? "stale" : "fresh",
    publicLabel: stale ? contract.publicStaleLabel : "Fresh data",
    errors: [],
    retrievedAt,
    preserveLastKnownGood: false,
  };
}

function checkCountryIdentity(artifacts, root) {
  const countries = readJson(path.join(root, "data/registry/countries.json"));
  const countryById = new Map(
    countries.map((country) => [country.id, country]),
  );
  const formulaById = new Map(
    artifacts.formulas.formulas.map((formula) => [formula.id, formula]),
  );
  const errors = [];
  let checked = 0;
  for (const formula of artifacts.formulas.formulas) {
    for (const code of formula.jurisdictions) {
      if (code === "ALL") continue;
      checked += 1;
      const country = countryById.get(code);
      if (!country) {
        errors.push(formula.id + ": unknown country " + code);
        continue;
      }
      if (!formula.sourceJurisdictions.includes(country.sourceJurisdiction))
        errors.push(formula.id + ": source jurisdiction mismatch");
      const isDeclaredMultiCurrency =
        formula.currency === "MULTI" && formula.jurisdictions.length > 1;
      if (
        formula.currency &&
        !isDeclaredMultiCurrency &&
        formula.currency !== country.currency
      ) {
        if (
          !formula.currencyOverride ||
          formula.currencyOverride.canonicalCurrency !== country.currency ||
          formula.currencyOverride.status !== "review-required"
        ) {
          errors.push(
            formula.id +
              ": currency " +
              formula.currency +
              " does not match " +
              country.currency,
          );
        }
      }
    }
  }
  for (const mapping of artifacts.formulas.routeMappings || []) {
    const formula = formulaById.get(mapping.formulaId);
    if (!formula) {
      errors.push(
        mapping.toolId +
          ": route mapping references unknown formula " +
          mapping.formulaId,
      );
      continue;
    }
    const declaredArtifacts = new Set(
      [formula.artifactPath]
        .concat(formula.protectedDuplicates || [])
        .map(slash),
    );
    for (const route of mapping.routes || []) {
      const routeFile = routeToFile(root, route);
      if (!routeFile) {
        errors.push(mapping.toolId + ": route does not resolve " + route);
      } else if (!declaredArtifacts.has(slash(routeFile))) {
        errors.push(
          mapping.toolId +
            ": route " +
            route +
            " resolves outside formula artifacts",
        );
      }
    }
    const jurisdiction =
      formula.jurisdictions.length === 1 ? formula.jurisdictions[0] : null;
    const toolCountryCandidate = String(mapping.toolId || "")
      .split("-")[0]
      .toUpperCase();
    const toolCountry = countryById.has(toolCountryCandidate)
      ? toolCountryCandidate
      : null;
    if (
      jurisdiction &&
      jurisdiction !== "ALL" &&
      toolCountry &&
      toolCountry !== jurisdiction
    ) {
      errors.push(
        mapping.toolId +
          ": route country " +
          toolCountry +
          " does not match formula jurisdiction " +
          jurisdiction,
      );
    }
  }
  return { checked, errors: errors.sort() };
}

function generateQualityReport(artifacts, root, asOf) {
  const findings = [];
  const formulaById = new Map(
    artifacts.formulas.formulas.map((formula) => [formula.id, formula]),
  );
  for (const engine of artifacts.inventory.engines.filter(
    (entry) => entry.riskLevel !== "low",
  )) {
    for (const formulaId of engine.formulaIds) {
      const formula = formulaById.get(formulaId);
      try {
        if (!formula) throw new Error("Missing formula " + formulaId);
        assertFormulaMetadata(formula, engine, root);
      } catch (error) {
        findings.push({
          code: error.message.startsWith("FORMULA_DIGEST_MISMATCH")
            ? "FORMULA_DIGEST_MISMATCH"
            : "FORMULA_METADATA_INVALID",
          severity: "error",
          id: formulaId,
          path: formula ? formula.artifactPath : engine.artifactPath,
          message: error.message,
        });
      }
    }
  }
  const verification = readJson(path.join(root, "data/tool-verification.json"));
  const traceability = checkHighRiskRouteTraceability(
    verification,
    artifacts.formulas,
  );
  for (const gap of traceability.gaps)
    findings.push({
      code: "TRACEABILITY_GAP",
      severity: "error",
      id: gap.split(":")[0],
      path: "data/tool-verification.json",
      message: gap,
    });
  const fixtures = runGoldenFixtures(artifacts, root);
  for (const failure of fixtures.failures)
    findings.push({
      code: "GOLDEN_FIXTURE_FAILED",
      severity: "error",
      id: failure.id,
      path: QUALITY_FILES.fixtures,
      message: failure.errors.join("; "),
    });
  const identity = checkCountryIdentity(artifacts, root);
  for (const message of identity.errors)
    findings.push({
      code: "COUNTRY_IDENTITY_MISMATCH",
      severity: "error",
      id: message.split(":")[0],
      path: "data/registry/countries.json",
      message,
    });

  const stale = [];
  const incompatible = [];
  for (const contract of artifacts.externalData.datasets) {
    const fallback = contract.staticFallbackPath
      ? readJson(path.join(root, contract.staticFallbackPath))
      : null;
    const result = validateExternalData(
      contract,
      fallback,
      asOf + "T00:00:00Z",
    );
    if (!result.valid) {
      incompatible.push(contract.id);
      findings.push({
        code: "INCOMPATIBLE_EXTERNAL_DATA",
        severity: "error",
        id: contract.id,
        path: contract.staticFallbackPath || "",
        message: result.errors.join("; "),
      });
    } else if (result.publicState === "stale") {
      stale.push(contract.id);
      findings.push({
        code: "STALE_EXTERNAL_DATA",
        severity: "warning",
        id: contract.id,
        path: contract.staticFallbackPath || "",
        message: result.publicLabel,
      });
    }
  }

  const counts = {
    total: artifacts.inventory.engines.length,
    high: 0,
    medium: 0,
    low: 0,
  };
  for (const engine of artifacts.inventory.engines)
    counts[engine.riskLevel] += 1;
  const protectedFormulas = artifacts.formulas.formulas.filter(
    (formula) => formula.riskLevel === "high" || formula.riskLevel === "medium",
  );
  const reviewBacklog = {
    highRiskEffectiveDates: protectedFormulas.filter(
      (formula) =>
        formula.riskLevel === "high" &&
        formula.effectiveDateStatus === "review-required",
    ).length,
    mediumRiskEffectiveDates: protectedFormulas.filter(
      (formula) =>
        formula.riskLevel === "medium" &&
        formula.effectiveDateStatus === "review-required",
    ).length,
    highRiskSources: protectedFormulas.filter(
      (formula) =>
        formula.riskLevel === "high" &&
        formula.sources.some(
          (source) => source.authorityStatus === "review-required",
        ),
    ).length,
    mediumRiskSources: protectedFormulas.filter(
      (formula) =>
        formula.riskLevel === "medium" &&
        formula.sources.some(
          (source) => source.authorityStatus === "review-required",
        ),
    ).length,
    currencyOverrides: protectedFormulas.filter(
      (formula) =>
        formula.currencyOverride &&
        formula.currencyOverride.status === "review-required",
    ).length,
    legacyProtected: protectedFormulas.filter(
      (formula) => formula.supportStatus === "legacy-protected",
    ).length,
  };
  if (
    reviewBacklog.highRiskEffectiveDates ||
    reviewBacklog.mediumRiskEffectiveDates
  ) {
    findings.push({
      code: "EFFECTIVE_DATE_REVIEW_REQUIRED",
      severity: "warning",
      id: "formula-registry",
      path: QUALITY_FILES.formulas,
      message:
        reviewBacklog.highRiskEffectiveDates +
        " high-risk and " +
        reviewBacklog.mediumRiskEffectiveDates +
        " medium-risk formula records have unknown statutory effective dates; they remain explicitly review-required.",
    });
  }
  if (reviewBacklog.highRiskSources || reviewBacklog.mediumRiskSources) {
    findings.push({
      code: "SOURCE_REVIEW_REQUIRED",
      severity: "warning",
      id: "formula-registry",
      path: QUALITY_FILES.formulas,
      message:
        reviewBacklog.highRiskSources +
        " high-risk and " +
        reviewBacklog.mediumRiskSources +
        " medium-risk formula records still require authoritative-source review.",
    });
  }
  if (reviewBacklog.currencyOverrides) {
    findings.push({
      code: "CURRENCY_OVERRIDE_REVIEW_REQUIRED",
      severity: "warning",
      id: "formula-registry",
      path: QUALITY_FILES.formulas,
      message:
        reviewBacklog.currencyOverrides +
        " formula currency override remains explicitly review-required.",
    });
  }
  return stableSortObject({
    schemaVersion: 1,
    asOf,
    inventory: counts,
    traceability,
    fixtures: {
      total: fixtures.total,
      passed: fixtures.passed,
      failed: fixtures.failed,
      changes: fixtures.changes,
    },
    externalData: {
      total: artifacts.externalData.datasets.length,
      stale: stale.sort(),
      incompatible: incompatible.sort(),
    },
    reviewBacklog,
    countryIdentity: { checked: identity.checked, errors: identity.errors },
    findings: findings.sort((a, b) =>
      (a.severity + a.code + a.id).localeCompare(b.severity + b.code + b.id),
    ),
  });
}

function reportMarkdown(report) {
  const lines = [
    "# Calculation Quality Report",
    "",
    `As of: ${report.asOf}`,
    "",
    "## Inventory",
    "",
    `- Total artifacts: ${report.inventory.total}`,
    `- High risk: ${report.inventory.high}`,
    `- Medium risk: ${report.inventory.medium}`,
    `- Low risk: ${report.inventory.low}`,
    "",
    "## Traceability",
    "",
    `- Protected PAYE/VAT records: ${report.traceability.protectedRoutes}`,
    `- Formula-mapped records: ${report.traceability.mappedRoutes}`,
    `- Gaps: ${report.traceability.gaps.length}`,
    "",
    "## Review backlog",
    "",
    `- High-risk effective dates requiring review: ${report.reviewBacklog.highRiskEffectiveDates}`,
    `- Medium-risk effective dates requiring review: ${report.reviewBacklog.mediumRiskEffectiveDates}`,
    `- High-risk sources requiring review: ${report.reviewBacklog.highRiskSources}`,
    `- Medium-risk sources requiring review: ${report.reviewBacklog.mediumRiskSources}`,
    `- Currency overrides requiring review: ${report.reviewBacklog.currencyOverrides}`,
    `- Legacy protected formula records: ${report.reviewBacklog.legacyProtected}`,
    "",
    "## Golden fixtures",
    "",
    `- Passed: ${report.fixtures.passed}/${report.fixtures.total}`,
    `- Documented result changes: ${report.fixtures.changes.length}`,
    "",
    "## External data",
    "",
    `- Registered datasets: ${report.externalData.total}`,
    `- Stale: ${report.externalData.stale.length ? report.externalData.stale.join(", ") : "none"}`,
    `- Incompatible: ${report.externalData.incompatible.length ? report.externalData.incompatible.join(", ") : "none"}`,
    "",
    "## Findings",
    "",
  ];
  if (!report.findings.length) lines.push("- None.");
  else
    for (const finding of report.findings)
      lines.push(
        `- ${finding.severity.toUpperCase()} ${finding.code} ${finding.id}: ${finding.message}`,
      );
  return lines.join("\n") + "\n";
}

module.exports = {
  RISK_DOMAINS,
  REQUIRED_FIXTURE_CLASSES,
  QUALITY_FILES,
  discoverEngineArtifacts,
  classifyArtifact,
  loadQualityArtifacts,
  buildQualityArtifacts,
  assertFormulaMetadata,
  checkHighRiskRouteTraceability,
  resolveFormula,
  runGoldenFixtures,
  validateExternalData,
  checkCountryIdentity,
  generateQualityReport,
  reportMarkdown,
  stableJson,
  digestFile,
};

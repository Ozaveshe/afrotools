/**
 * Ask AfroTools AI intent router.
 *
 * Server-safe CommonJS module with deterministic routing and strict output
 * validation. A provider can suggest a decision, but this module validates and
 * normalizes the payload before the API returns it.
 */
(function initIntentRouter(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.AfroToolsAIIntentRouter = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createIntentRouter() {
  "use strict";

  var manifestApi = null;
  var i18nApi = null;
  var guardrailsApi = null;
  var frenchRouteMapApi = null;
  if (typeof require === "function") {
    try {
      manifestApi = require("./tool-manifest.js");
    } catch (err) {
      manifestApi = null;
    }
    try {
      i18nApi = require("./i18n.js");
    } catch (err) {
      i18nApi = null;
    }
    try {
      guardrailsApi = require("./guardrails.js");
    } catch (err) {
      guardrailsApi = null;
    }
    try {
      frenchRouteMapApi = require("./french-route-map.generated.js");
    } catch (err) {
      frenchRouteMapApi = null;
    }
  }
  if (!i18nApi && typeof globalThis !== "undefined" && globalThis.AfroToolsAII18n) i18nApi = globalThis.AfroToolsAII18n;
  if (!guardrailsApi && typeof globalThis !== "undefined" && globalThis.AfroToolsAIGuardrails) guardrailsApi = globalThis.AfroToolsAIGuardrails;
  if (!frenchRouteMapApi && typeof globalThis !== "undefined" && globalThis.AfroToolsAIFrenchRouteMap) frenchRouteMapApi = globalThis.AfroToolsAIFrenchRouteMap;

  var OUTPUT_SCHEMA = {
    schemaVersion: 1,
    requiredFields: [
      "intentCategory",
      "selectedToolId",
      "selectedRoute",
      "confidence",
      "reasonShort",
      "extractedInputs",
      "missingInputs",
      "clarificationQuestion",
      "safetyDomain",
      "highStakesNotice",
      "privacyMode",
      "canPrefill",
      "suggestedNextActions",
    ],
    enums: {
      safetyDomain: ["tax", "immigration", "legal", "health", "finance", "employment", "education", "energy", "none"],
      privacyMode: ["browser_local", "server_required", "ai_optional", "account_optional"],
    },
  };

  var SEARCH_FALLBACK = {
    id: "tool-search",
    route: "/search/",
    title: "Search AfroTools",
    category: "search",
    subcategory: "search",
    privacyMode: "browser_local",
    highStakesDomain: "none",
    requiredInputs: [],
    aiCapabilities: ["route_only"],
  };

  var FRENCH_FINTECH_ROUTING_RULES = [
    rule("fintech", "mobile-vs-bank", ["comparer mobile money et banque", "mobile money ou virement bancaire"], ["finance"]),
    rule("fintech", "fixed-deposit", ["calculer un depot a terme", "rendement depot a terme"], ["finance"]),
    rule("fintech", "tbill-calc", ["rendement d un bon du tresor", "rendement bon du tresor", "calculer un bon du tresor"], ["finance"]),
    rule("fintech", "real-return", ["rendement reel apres inflation", "rendement corrige de l inflation"], ["finance"]),
    rule("fintech", "loan-shark-compare", ["comparer pret informel et banque", "cout pret usurier"], ["finance"]),
    rule("fintech", "microfinance-loan", ["cout d un pret de microfinance", "cout pret microfinance", "calculer pret de microfinance"], ["finance"]),
    rule("fintech", "digital-lending", ["comparer des credits numeriques", "comparer credits numeriques", "taux credit digital"], ["finance"]),
    rule("fintech", "sacco-calc", ["epargne sacco cooperative", "calculateur sacco"], ["finance"]),
    rule("fintech", "payment-gateway", ["comparer des passerelles de paiement", "comparer passerelles de paiement", "frais passerelle paiement"], ["finance"]),
    rule("fintech", "bnpl-calc", ["cout d un paiement fractionne", "cout paiement fractionne", "calculer achat maintenant payer plus tard"], ["finance"]),
    rule("fintech", "emergency-fund", ["planifier un fonds d urgence", "planifier fonds d urgence", "objectif fonds urgence"], ["finance"]),
    rule("fintech", "asset-finance", ["financement d actif avec paiement final", "calculer financement actif"], ["finance"]),
    rule("fintech", "b2b-payment", ["paiement professionnel transfrontalier", "comparer paiement b2b"], ["finance"]),
    rule("fintech", "bill-split", ["partager une addition", "repartir une addition"], ["finance"]),
    rule("fintech", "bond-yield", ["rendement d une obligation a echeance", "rendement obligation a echeance", "calculer rendement obligataire"], ["finance"]),
    rule("fintech", "credit-score", ["facteurs de mon profil de credit", "facteurs profil de credit", "verifier mon profil de credit"], ["finance"]),
    rule("fintech", "dca-calc", ["investissements mensuels reguliers", "projection dca investissement"], ["finance"]),
    rule("fintech", "debt-snowball", ["boule de neige et avalanche des dettes", "boule de neige et avalanche dettes", "comparer remboursement de dettes"], ["finance"]),
    rule("fintech", "dividend-yield", ["rendement d une action a dividende", "rendement action a dividende", "calculer rendement dividendes"], ["finance"]),
    rule("fintech", "fire-calc", ["projeter mon objectif fire", "projeter objectif fire", "independance financiere fire"], ["finance"]),
    rule("fintech", "invoice-factoring", ["decomposer une offre d affacturage", "decomposer offre affacturage", "cout de l affacturage"], ["finance"]),
    rule("fintech", "loan-consolidation", ["comparer une consolidation de prets", "comparer consolidation de prets", "regrouper mes prets"], ["finance"]),
    rule("fintech", "merchant-fees", ["estimer les frais marchand", "frais par moyen de paiement", "estimer frais marchand"], ["finance"]),
    rule("fintech", "money-market", ["comparer fonds monetaire et depot", "rendement fonds monetaire"], ["finance"]),
    rule("fintech", "net-worth", ["calculer ma valeur nette", "suivre valeur nette"], ["finance"]),
    rule("fintech", "pos-fees", ["frais d un terminal de paiement", "frais terminal de paiement", "estimer frais pos"], ["finance"]),
    rule("fintech", "property-vs-stocks", ["comparer immobilier et actions", "immobilier ou bourse"], ["finance"]),
    rule("fintech", "qr-payment", ["cout des paiements par qr", "cout paiements par qr", "frais paiement qr"], ["finance"]),
    rule("fintech", "stock-portfolio", ["suivre un portefeuille d actions", "suivre portefeuille d actions", "calculer rendement portefeuille actions"], ["finance"]),
    rule("fintech", "thrift-calc", ["modeliser une tontine", "rendement tontine cooperative"], ["finance"]),
    rule("fintech", "trade-credit", ["comparer escompte et credit fournisseur", "cout credit commercial"], ["finance"]),
  ];

  var FRENCH_TELECOM_ROUTING_RULES = [
    rule("telecom", "telecom-data-plan", ["comparateur de forfaits data", "comparateur forfaits data", "data plan comparator", "compare data plans"], ["none"]),
    rule("telecom", "telecom-ussd", ["annuaire prudent des codes ussd", "annuaire codes ussd", "ussd code directory", "codes ussd"], ["none"]),
    rule("telecom", "telecom-roaming", ["calculateur roaming ou sim locale", "calculateur roaming", "roaming cost calculator", "roaming ou sim locale"], ["finance"]),
    rule("telecom", "telecom-starlink", ["comparateur starlink et isp locaux", "starlink vs local isp", "starlink compare"], ["finance"]),
    rule("telecom", "telecom-tv", ["comparateur tv et streaming", "tv and streaming comparator", "tv package compare"], ["finance"]),
    rule("telecom", "telecom-data-usage", ["calculateur de consommation data", "consommation data", "data usage calculator", "estimate data usage"], ["none"]),
    rule("telecom", "telecom-airtime", ["valeur estimee du credit telephonique", "valeur du credit telephonique", "airtime value", "airtime conversion estimate"], ["finance"]),
    rule("telecom", "telecom-portability", ["preparer une portabilite de numero", "portabilite de numero", "number portability", "keep my mobile number"], ["none"]),
    rule("telecom", "telecom-sim-reg", ["verifier les exigences d enregistrement sim", "enregistrement sim", "sim registration", "register my sim"], ["legal"]),
    rule("telecom", "telecom-internet", ["comparateur internet fixe et sans fil", "comparateur internet", "internet provider compare", "internet compare"], ["finance"]),
    rule("telecom", "telecom-fiber-lte-5g", ["choisir entre fibre lte et 5g", "fibre lte ou 5g", "fiber lte or 5g", "fiber lte 5g"], ["none"]),
    rule("telecom", "telecom-business-internet", ["dimensionner internet pour une entreprise", "internet pour une entreprise", "business internet", "office internet sizing"], ["finance"]),
    rule("telecom", "telecom-bulk-sms", ["estimer un budget sms professionnel", "budget sms professionnel", "bulk sms pricing", "bulk sms budget"], ["finance"]),
    rule("telecom", "telecom-whatsapp-vs-sms", ["comparer whatsapp business et sms", "whatsapp business vs sms", "whatsapp vs sms"], ["finance"]),
  ];

  var ROUTING_RULES = FRENCH_FINTECH_ROUTING_RULES.concat(FRENCH_TELECOM_ROUTING_RULES, [
    rule("career-documents", "cover-letter", ["cover letter", "application letter", "motivation letter"], ["employment"]),
    rule("cv-jobs", "cv-builder", ["cv", "resume", "curriculum vitae", "ats", "linkedin profile", "job application pack", "application pack", "graduate trainee role"], ["employment", "career"]),
    rule("government", "passport-checklist", ["passport checklist", "passport application", "passport documents", "passport fees", "ghana passport", "passport next steps"], ["none"]),
    rule("african", "mobile-money-fees", ["mobile money fees", "m-pesa fees", "mpesa fees", "mtn momo fees", "send cash", "cheapest send option"], ["finance"]),
    rule("insurance", "car-insurance", ["estimer assurance auto", "preparer un devis assurance auto"], ["finance"]),
    rule("insurance", "health-insurance-compare", ["comparer deux assurances sante", "comparer des assurances sante"], ["finance"]),
    rule("insurance", "life-insurance-calc", ["calculer besoin assurance vie", "besoin de couverture assurance vie"], ["finance"]),
    rule("insurance", "funeral-insurance", ["preparer assurance obseques", "assurance obseques"], ["finance"]),
    rule("insurance", "motor-third-party", ["responsabilite civile automobile", "responsabilite civile auto"], ["finance"]),
    rule("insurance", "business-insurance", ["planifier assurance entreprise", "preparer assurance entreprise"], ["finance"]),
    rule("insurance", "travel-insurance", ["planifier assurance voyage", "preparer assurance voyage"], ["finance"]),
    rule("insurance", "workers-comp", ["cotisation accident du travail", "cotisation accidents du travail"], ["finance"]),
    rule("insurance", "health-contribution", ["contribution assurance sante", "cotisation sante"], ["finance"]),
    rule("insurance", "claim-tracker", ["suivre un sinistre assurance", "preparer declaration sinistre assurance"], ["finance"]),
    rule("insurance", "crop-insurance-calc", ["planifier assurance recolte", "assurance recolte"], ["finance"]),
    rule("insurance", "fire-insurance", ["planifier assurance incendie", "assurance incendie"], ["finance"]),
    rule("insurance", "insurance-fraud-checker", ["verifier signaux fraude assurance", "signaux fraude assurance"], ["finance"]),
    rule("insurance", "marine-insurance", ["assurance transport maritime cargo", "planifier assurance maritime"], ["finance"]),
    rule("insurance", "microinsurance", ["planifier microassurance", "comparer une microassurance"], ["finance"]),
    rule("insurance", "professional-indemnity", ["responsabilite civile professionnelle", "assurance responsabilite professionnelle"], ["finance"]),
    rule("legal", "nda-generator", ["draft nda", "create nda", "client nda", "nda for", "non disclosure", "non-disclosure", "legal document generator"], ["legal"]),
    rule("study-abroad", "study-abroad-cost", ["study with", "study budget", "study cost", "study documents", "tuition budget", "nigeria to canada study"], ["education", "immigration"]),
    rule("scholarships", "scholarship-finder", ["scholarship", "scholarships", "bursary", "funding", "grant for school"], ["education"]),
    rule("hr-payroll", "contractor-vs-employee", ["prestataire ou salarie", "prestataire et salarie", "cout prestataire salarie", "prestataire", "salarie", "contractor vs employee"], ["employment"]),
    rule("hr-payroll", "domestic-worker", ["employee de maison", "employeee de maison", "emploi a domicile", "domestic worker"], ["employment"]),
    rule("hr-payroll", "employee-cost", ["cout total d un salarie", "cout total salarie", "cout employeur", "employee cost"], ["employment"]),
    rule("hr-payroll", "gratuity-calculator", ["indemnite de depart", "prime de depart", "gratuity calculator"], ["employment"]),
    rule("hr-payroll", "maternity-leave", ["conge maternite", "conge parental", "conge paternite", "maternity leave"], ["employment"]),
    rule("hr-payroll", "retrenchment-calculator", ["indemnite de licenciement economique", "licenciement economique", "retrenchment calculator"], ["employment"]),
    rule("salary-tax", "paye-calculator", ["paye", "payroll", "salary tax", "income tax", "net pay", "gross pay", "take home", "take-home pay", "takehome", "salary", "i earn", "salaire net", "impot sur le revenu", "impot sur salaire", "fiche de paie"], ["tax"]),
    rule("trade", "hs-code-lookup", ["hs code", "tariff code", "customs code", "code sh", "code douanier", "classement tarifaire"], ["finance"]),
    rule("trade", "sadc-roo", ["sadc rules of origin", "rules of origin", "origin certificate"], ["none"]),
    rule("mining", "diamond-valuation", ["evaluation diamant", "evaluer un diamant", "valeur diamant", "prix diamant 4c", "estimer un diamant"], ["finance"]),
    rule("mining", "oil-well-production", ["production puits petrole", "production d un puits de petrole", "puits de petrole", "debit puits petrole", "darcy puits", "production petroliere"], ["none"]),
    rule("mining", "oil-gas-revenue", ["partage revenus petrole gaz", "partage des revenus petrole et gaz", "partage psc", "cost oil", "profit oil"], ["finance"]),
    rule("mining", "mining-license-fee", ["cout licence miniere", "frais permis minier", "frais licence exploitation miniere"], ["finance", "legal"]),
    rule("mining", "mining-royalty", ["redevance miniere", "royalty miniere", "redevance sur or", "taux redevance minerai"], ["finance", "legal"]),
    rule("mining", "artisanal-mining-income", ["revenu minier artisanal", "revenu orpaillage", "revenu mineur artisanal", "prix acheteur agree minerai"], ["finance"]),
    rule("import-duty", "import-duty", ["import duty", "customs duty", "import", "car import", "vehicle import", "landed cost", "cif", "port charges", "duty and port", "machinery into", "toyota", "honda", "mazda", "nissan"], ["finance"]),
    rule("solar-energy", "solar-roi", ["solar", "inverter", "battery", "backup power", "payback"], ["energy"]),
    rule("fuel-energy", "fuel-tracker", ["generator", "fuel", "petrol", "diesel", "kerosene"], ["energy"]),
    rule("career-documents", "cover-letter", ["lettre de motivation", "créer lettre motivation", "rédiger lettre motivation"], ["employment"]),
    rule("documents", "meeting-minutes", ["compte rendu de réunion", "procès verbal réunion", "notes de réunion"], ["none"]),
    rule("documents", "receipt-generator", ["générateur de reçus", "créer un reçu", "reçu de vente"], ["finance"]),
    rule("documents", "freelance-invoice", ["facture freelance", "facture pour freelance"], ["finance"]),
    rule("documents", "invoice-generator", ["générateur de factures", "créer une facture"], ["finance"]),
    rule("documents", "business-plan", ["plan d’affaires document", "créer plan affaires"], ["finance"]),
    rule("business-tax", "invoice-generator", ["vat invoice", "create a vat invoice", "invoice with vat", "invoice", "receipt", "bill client"], ["finance"]),
    rule("business-tax", "vat-calc-pan-african", ["calculate vat", "vat calculator", "vat rate", "value added tax", "sales tax", "calculer la tva", "taux de tva", "taxe sur la valeur ajoutee"], ["tax"]),
    rule("business-planning", "business-planner", ["register a small business", "business registration", "get a tin", "tin in", "start a business", "business setup"], ["finance", "legal"]),
    rule("documents", "pdf-merge-split", ["fusionner des pdf", "diviser un pdf", "fusionner diviser pdf", "fusionner et diviser des pdf"], ["none"]),
    rule("documents", "pdf-compress", ["compresser un pdf", "réduire la taille pdf"], ["none"]),
    rule("documents", "pdf-image-convert", ["pdf en image", "image en pdf", "convertir pdf image", "pdf images"], ["none"]),
    rule("documents", "pdf-watermark", ["filigrane pdf", "ajouter un filigrane pdf"], ["none"]),
    rule("documents", "pdf-password", ["protéger pdf mot de passe", "protéger un pdf", "déverrouiller pdf"], ["none"]),
    rule("documents", "pdf-page-numbers", ["numérotation pdf", "numéroter les pages pdf"], ["none"]),
    rule("documents", "pdf-sign", ["signer un pdf", "signature pdf"], ["none"]),
    rule("documents", "pdf-ocr", ["ocr pdf", "extraire texte pdf numérisé"], ["none"]),
    rule("documents", "pdf-form-filler", ["remplir formulaire pdf", "remplir un formulaire pdf", "compléter formulaire pdf"], ["none"]),
    rule("documents", "pdf-redact", ["caviarder un pdf", "masquer données pdf"], ["none"]),
    rule("documents", "pdf-header-footer", ["en-tête pied de page pdf", "en-tête et pied de page pdf", "ajouter en-tête pdf"], ["none"]),
    rule("documents", "pdf-editor", ["éditeur pdf", "annoter un pdf"], ["none"]),
    rule("documents", "pdf-convert", ["convertir des documents", "convertir pdf word excel"], ["none"]),
    rule("documents", "pdf-reorder", ["réorganiser pages pdf", "organiser les pages pdf", "tourner supprimer pages pdf"], ["none"]),
    rule("documents", "pdf-chat", ["questions sur un pdf", "interroger un pdf"], ["none"]),
    rule("documents", "pdf-translate", ["traduire un pdf", "traduction pdf"], ["none"]),
    rule("documents", "pdf-compare", ["comparer des pdf", "différences entre deux pdf"], ["none"]),
    rule("documents", "pdf-to-audio", ["pdf en audio", "lire un pdf à voix haute"], ["none"]),
    rule("documents", "pdf-bates", ["numérotation bates pdf", "tampon bates pdf"], ["none"]),
    rule("documents", "html-to-pdf", ["html en pdf", "convertir html pdf"], ["none"]),
    rule("documents", "pdf-find-replace", ["rechercher remplacer pdf", "rechercher et remplacer dans un pdf", "remplacer texte pdf"], ["none"]),
    rule("documents", "pdf-repair", ["réparer un pdf", "pdf endommagé"], ["none"]),
    rule("documents", "pdf-workflow", ["flux de travail pdf", "enchaîner opérations pdf"], ["none"]),
    rule("documents", "pdf-workspace", ["compress and sign", "compress, sign", "compress sign", "export a pdf locally", "pdf locally", "without uploading", "merge pdf", "merge pdfs", "merge two pdfs", "combine pdf", "combine pdfs", "split pdf", "split pdfs", "extract pdf pages", "compress pdf", "compress my pdf", "reduce pdf", "shrink pdf", "add page numbers", "page numbers", "number pages", "protect pdf", "protect a pdf", "password protect pdf", "lock pdf", "fusionner pdf", "fusionner deux pdf", "assembler des pdf", "compresser mon pdf", "reduire mon pdf"], ["none"]),
    rule("documents", "pdf-sign", ["sign pdf", "sign", "pdf signature", "add signature"], ["none"]),
    rule("documents", "pdf-redact", ["redact pdf", "redact", "remove sensitive text"], ["none"]),
    rule("documents", "pdf-to-audio", ["pdf to audio", "read pdf aloud", "listen to pdf"], ["none"]),
    rule("documents", "pdf-watermark", ["watermark pdf", "pdf watermark"], ["none"]),
    rule("documents", "pdf-workspace", ["pdf", "document"], ["none"]),
    rule("health", "medical-report", ["rapport medical", "resultats sanguins", "analyse sanguine", "bilan sanguin", "expliquer mes analyses"], ["health"]),
    rule("education", "gpa-calculator", ["gpa", "cgpa", "grade point"], ["education"]),
    rule("education", "ielts-calculator", ["ielts", "band score", "english test"], ["education"]),
    rule("study-abroad", "study-abroad-cost", ["study abroad", "study in", "study from", "student visa", "tuition abroad", "school abroad", "student prepare", "australia intake", "canada intake", "uk intake", "intake documents"], ["education", "immigration"]),
    rule("study-abroad", "japa-calculator", ["japa", "relocate", "migration cost", "move to canada", "move to uk", "save before moving", "moving from", "moving to"], ["immigration"]),
    rule("local-life", "rent-affordability", ["rent affordability", "how much rent", "afford rent", "afford", "rent budget", "rent in"], ["legal", "finance"]),
    rule("local-life", "rent-vs-buy", ["rent vs buy", "buy or rent", "rent or buy"], ["finance"]),
    rule("local-life", "cost-of-living", ["cost of living", "living cost", "living costs", "compare living costs", "live in", "can i live", "per month", "monthly budget", "monthly expenses", "relocation budget"], ["finance"]),
    rule("agriculture", "poultry-roi-calculator", ["poultry", "broiler", "broilers", "layers", "chicken farm", "egg production", "poultry roi"], ["finance"]),
    rule("agriculture", "fish-farming-roi", ["fish farming", "tilapia", "catfish pond", "catfish", "aquaculture", "fingerlings"], ["finance"]),
    rule("agriculture", "cocoa-tracker", ["cocoa", "cacao", "cocoa farm", "cocoa price", "cocoa farm gate", "cocoa farm-gate", "cocoa farm gate price", "farm gate cocoa", "farm-gate cocoa", "cocoa export", "quality premium"], ["finance"]),
    rule("agriculture", "storage-loss", ["storage loss", "post harvest", "post-harvest", "grain storage", "hermetic", "silo"], ["finance"]),
    rule("agriculture", "commodity-prices", ["commodity prices", "market price", "market prices", "farm gate price", "farm-gate price", "sell maize", "sell cocoa", "seasonal price"], ["finance"]),
    rule("agriculture", "farm-profit-calculator", ["farm profit", "farm roi", "farm margin", "profitable", "profitability", "break even", "break-even"], ["finance"]),
    rule("agriculture", "crop-yield-estimator", ["crop yield", "yield estimate", "harvest yield", "farm yield", "maize yield", "rice yield", "maize farm", "rice farm", "cassava farm", "tomato farm", "rendement culture", "rendement mais", "rendement du mais", "estimer la recolte"], ["none"]),
    rule("agriculture", "farm-budget", ["farm budget", "farm costs", "farm expenses"], ["finance"]),
    rule("agriculture", "fertilizer-calculator", ["fertilizer", "fertiliser", "npk", "urea"], ["finance"]),
    rule("agriculture", "input-prices", ["input prices", "seed prices", "fertilizer prices", "agrochemical prices"], ["finance"]),
    rule("agriculture", "seed-rate-calculator", ["seed rate", "seeding rate", "how much seed"], ["finance"]),
    rule("agriculture", "irrigation-calculator", ["irrigation", "water pump", "drip irrigation"], ["none"]),
    rule("agriculture", "livestock-feed-calculator", ["livestock feed", "poultry feed", "feed ration"], ["finance"]),
    rule("agriculture", "planting-calendar", ["planting calendar", "when to plant", "plant maize", "plant rice"], ["none"]),
    rule("construction", "afrodraft", ["afrodraft", "cad-like", "cad like", "cad plan", "dxf", "technical drawing", "drafting plan"], ["none"]),
    rule("construction", "building-materials", ["building materials", "estimate blocks", "blocks and cement", "cement blocks", "cement bags", "material estimate", "materials estimator", "estimate cement"], ["finance", "legal"]),
    rule("construction", "boq-generator", ["boq", "bill of quantities", "quantity takeoff", "materials list"], ["finance"]),
    rule("construction", "land-size", ["land size", "plot size", "sqm plot", "square metre plot", "square meter plot", "50 by 100 plot"], ["none"]),
    rule("construction", "construction-budget", ["estimate renovation costs", "renovation costs", "building budget", "construction budget"], ["finance"]),
    rule("construction", "home-renovation-cost", ["renovation cost", "home renovation", "building cost", "construction cost"], ["finance"]),
    rule("construction", "afroplan-floor-planner", ["floor planner", "floor plan", "floor layout", "house plan", "room layout", "construction layout", "two-bedroom", "two bedroom", "2-bedroom", "2 bedroom", "bedroom floor plan", "simple floor plan", "design a simple", "plot in"], ["none"]),
    rule("country-intelligence", "afroatlas", ["country intelligence", "country profile", "compare countries", "compare", "which country", "market entry", "market data", "africa data", "afroatlas", "starting a business", "start a business", "doing business", "remote worker", "remote work", "digital nomad", "costs of moving", "main costs of moving"], ["none"]),
  ]);

  var COUNTRY_ALIASES = {
    nigeria: "Nigeria",
    naija: "Nigeria",
    ghana: "Ghana",
    kenya: "Kenya",
    cameroon: "Cameroon",
    "south africa": "South Africa",
    lagos: "Nigeria",
    abuja: "Nigeria",
    "benin city": "Nigeria",
    ibadan: "Nigeria",
    nairobi: "Kenya",
    mombasa: "Kenya",
    accra: "Ghana",
    kumasi: "Ghana",
    douala: "Cameroon",
    yaounde: "Cameroon",
    johannesburg: "South Africa",
    joburg: "South Africa",
    "cape town": "South Africa",
    kampala: "Uganda",
    kigali: "Rwanda",
    dar: "Tanzania",
    "dar es salaam": "Tanzania",
    uganda: "Uganda",
    tanzania: "Tanzania",
    rwanda: "Rwanda",
    angola: "Angola",
    angoa: "Angola",
    angolan: "Angola",
    luanda: "Angola",
    zambia: "Zambia",
    zimbabwe: "Zimbabwe",
    ethiopia: "Ethiopia",
    egypt: "Egypt",
    morocco: "Morocco",
    senegal: "Senegal",
    "cote d'ivoire": "Cote d'Ivoire",
    "cote divoire": "Cote d'Ivoire",
    "ivory coast": "Cote d'Ivoire",
  };

  var DESTINATION_COUNTRIES = {
    canada: "Canada",
    "united kingdom": "United Kingdom",
    uk: "United Kingdom",
    usa: "United States",
    "united states": "United States",
    germany: "Germany",
    france: "France",
    australia: "Australia",
    ireland: "Ireland",
    netherlands: "Netherlands",
  };

  function rule(intentCategory, toolId, keywords, safetyHints) {
    return {
      intentCategory: intentCategory,
      toolId: toolId,
      keywords: array(keywords).map(normalizeText),
      safetyHints: safetyHints || [],
    };
  }

  function getRouterManifest(manifest) {
    if (Array.isArray(manifest)) return manifest;
    if (manifestApi && typeof manifestApi.getToolManifestForRouter === "function") {
      try {
        return manifestApi.getToolManifestForRouter();
      } catch (err) {
        return [];
      }
    }
    return [];
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^\w\s$,.:'-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function clampConfidence(value) {
    var number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.max(0, Math.min(1, number));
  }

  function array(value) {
    return Array.isArray(value) ? value.slice() : [];
  }

  function findTool(manifest, id) {
    var tools = array(manifest);
    for (var i = 0; i < tools.length; i += 1) {
      var entry = tools[i];
      if (!entry) continue;
      if (entry.id === id || entry.slug === id || array(entry.aliases).indexOf(id) !== -1) return entry;
    }
    return null;
  }

  function routeUrl(route, query) {
    var clean = String(route || "/search/");
    if (!query) return clean;
    return clean + (clean.indexOf("?") === -1 ? "?" : "&") + "source=ask";
  }

  function keywordScore(text, keywords) {
    var score = 0;
    array(keywords).forEach(function countKeyword(keyword) {
      var normalizedKeyword = normalizeText(keyword);
      if (text.indexOf(normalizedKeyword) !== -1) score += normalizedKeyword.split(/\s+/).length > 1 ? 3 : 2;
    });
    return score;
  }

  function findBestRule(query) {
    var text = normalizeText(query);
    var roleMatch = professionCareerMatch(query);
    if (roleMatch) return roleMatch;
    var best = null;
    ROUTING_RULES.forEach(function scoreRule(candidate) {
      var score = keywordScore(text, candidate.keywords);
      if (score > 0 && (!best || score > best.score)) {
        best = Object.assign({ score: score }, candidate);
      }
    });
    return best;
  }

  function findManifestCandidate(query, manifest) {
    if (!manifestApi || typeof manifestApi.rankToolCandidates !== "function") return null;
    var ranked = manifestApi.rankToolCandidates(query, manifest, { limit: 1, minScore: 14 });
    var candidate = ranked && ranked.candidates && ranked.candidates[0];
    if (!candidate || !candidate.tool) return null;
    return {
      intentCategory: candidate.tool.subcategory || candidate.tool.category || "search",
      toolId: candidate.tool.id,
      score: Math.max(2, Math.min(4, Math.round(candidate.score / 8))),
      source: "manifest_retrieval",
      retrievalScore: candidate.score,
      matchedFields: candidate.matchedFields || [],
      matchedTerms: candidate.matchedTerms || [],
      catalogSize: ranked.catalogSize || array(manifest).length,
    };
  }

  function extractCountryFromMap(text, map) {
    var keys = Object.keys(map).sort(function byLength(left, right) {
      return right.length - left.length;
    });
    for (var i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      var pattern = new RegExp("(^|\\b)" + key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(\\b|$)", "i");
      if (pattern.test(text)) return map[key];
    }
    return "";
  }

  function detectedCountryCount(text) {
    var found = {};
    Object.keys(COUNTRY_ALIASES).forEach(function detectCountry(key) {
      var pattern = new RegExp("(^|\\b)" + key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(\\b|$)", "i");
      if (pattern.test(text)) found[COUNTRY_ALIASES[key]] = true;
    });
    return Object.keys(found).length;
  }

  function isExplicitCountryIntelligenceQuery(text) {
    return /\bcountry (?:profile|intelligence)\b|\bmarket (?:entry|overview)\b|\bafrica data\b|\bafroatlas\b|\bwhich country\b|\bdoing business\b|\bstarting a business\b|\bstart a business\b/.test(text);
  }

  function isElectricalCalculationQuery(text) {
    return /\b(load|voltage|current|amps?|watts?|kw|kva|cable|wire|breaker|panel|appliance|power|tariff|meter|phase|circuit|sizing|solar|generator|bill|calculate|calculator|size)\b/.test(text);
  }

  function extractProfessionRole(query) {
    var text = normalizeText(query);
    if (isElectricalCalculationQuery(text)) return "";
    var role = text.match(/\b((?:electrical|civil|mechanical|software|data|network|structural|petroleum|chemical|site|project)\s+(?:engineer|developer|analyst|technician|manager))\b/) ||
      text.match(/\b((?:program|programme|project|finance|business|data|systems|sales|marketing|operations|hr|accounting)\s+(?:officer|manager|analyst|assistant|associate|lead))\b/) ||
      text.match(/\b(accountant|teacher|nurse|doctor|driver|electrician|plumber|welder|architect|surveyor|lawyer|designer|developer|engineer|technician)\b/);
    return role ? role[1].replace(/\s+/g, " ").trim() : "";
  }

  function professionCareerMatch(query) {
    var text = normalizeText(query);
    var role = extractProfessionRole(query);
    if (!role) return null;
    if (/\b(cover letter|application letter|motivation letter)\b/.test(text)) return null;
    if (!/\b(cv|resume|write|build|create|job|career|role|application|profile|linkedin)\b/.test(text) && detectedCountryCount(text) <= 0) return null;
    return {
      intentCategory: "cv-jobs",
      toolId: "cv-builder",
      score: 5,
      source: "profession_role",
    };
  }

  function extractMoney(query) {
    var match = String(query || "").match(/(?:\$|usd\s*)\s?([0-9][0-9,]*(?:\.\d+)?)(?:\s?(k|m))?/i) ||
      String(query || "").match(/\b(?:ngn|naira|kes|ksh|ghs|zar|xaf|xof|aoa|kz|kwanza|kwanzas|usd|gbp|eur|cad)\s?([0-9][0-9,]*(?:\.\d+)?)(?:\s?(k|m))?\b/i) ||
      String(query || "").match(/\b([0-9][0-9,]*(?:\.\d+)?)\s?(usd|dollars|naira|ngn|kes|ghs|zar|xaf|xof|aoa|kz|kwanza|kwanzas)\b/i);
    if (!match) return "";
    var amount = Number(String(match[1]).replace(/,/g, ""));
    if (!Number.isFinite(amount)) return "";
    if (match[2] && String(match[2]).toLowerCase() === "k") amount *= 1000;
    if (match[2] && String(match[2]).toLowerCase() === "m") amount *= 1000000;
    return amount;
  }

  function extractPlainAmount(query) {
    var shorthand = String(query || "").match(/\b([1-9][0-9]*(?:\.\d+)?)\s?(k|m)\b/i);
    if (shorthand) {
      var scaled = Number(shorthand[1]);
      if (Number.isFinite(scaled)) {
        return String(shorthand[2]).toLowerCase() === "m" ? scaled * 1000000 : scaled * 1000;
      }
    }
    var matches = String(query || "").match(/\b[1-9][0-9]{2,}(?:,[0-9]{3})*(?:\.\d+)?\b/g);
    if (!matches || !matches.length) return "";
    for (var i = matches.length - 1; i >= 0; i -= 1) {
      var amount = Number(String(matches[i]).replace(/,/g, ""));
      if (Number.isFinite(amount) && amount >= 100) return amount;
    }
    return "";
  }

  function extractCurrency(query) {
    var raw = String(query || "");
    if (/\bcad[- ]?like|cad plan|afrodraft/i.test(raw) && !/\b(?:cad|canadian dollars?)\s?[0-9]|\b[0-9][0-9,]*(?:\.\d+)?\s?(?:cad|canadian dollars?)\b/i.test(raw)) return "";
    if (/\$|usd|dollars/i.test(raw)) return "USD";
    if (/gbp|pounds|\u00a3/i.test(raw)) return "GBP";
    if (/eur|euros|\u20ac/i.test(raw)) return "EUR";
    if (/cad/i.test(raw)) return "CAD";
    if (/ngn|naira|\u20a6/i.test(raw)) return "NGN";
    if (/kes|ksh/i.test(raw)) return "KES";
    if (/ghs/i.test(raw)) return "GHS";
    if (/zar/i.test(raw)) return "ZAR";
    if (/aoa|kwanza|kwanzas|\bkz\b/i.test(raw)) return "AOA";
    if (/xaf/i.test(raw)) return "XAF";
    if (/xof/i.test(raw)) return "XOF";
    return "";
  }

  function cleanTargetRole(value, country, targetCountry) {
    var role = String(value || "").trim();
    [country, targetCountry].filter(Boolean).forEach(function stripCountry(name) {
      var escaped = String(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      role = role.replace(new RegExp("\\s+(?:in|from|based in)\\s+" + escaped + "\\s*$", "i"), "");
    });
    return role.replace(/\s+/g, " ").trim();
  }

  function cleanVehicleCategory(make, model) {
    var cleanMake = String(make || "").replace(/^vw$/i, "Volkswagen").trim();
    var cleanModel = String(model || "").replace(/\b(used|new)\b/gi, "").replace(/\s+/g, " ").trim();
    if (!cleanMake) return "";
    if (!cleanModel || /^(?:from|to|into|in|for|with|shipping|freight|insurance|fx)\b/i.test(cleanModel)) return cleanMake + " vehicle";
    return (cleanMake + " " + cleanModel).trim();
  }

  function extractCity(query) {
    var match = String(query || "").match(/\b(lagos|abuja|benin city|ibadan|nairobi|mombasa|eldoret|accra|kumasi|douala|yaounde|johannesburg|joburg|cape town|kampala|kigali|dakar|kaolack|abidjan|bouake|dar es salaam|dar)\b/i);
    return match ? match[1].replace(/\b\w/g, function title(char) { return char.toUpperCase(); }) : "";
  }

  function extractCrop(query) {
    var text = normalizeText(query);
    var crops = {
      maize: "maize",
      corn: "maize",
      rice: "rice",
      cassava: "cassava",
      cocoa: "cocoa",
      cacao: "cocoa",
      coffee: "coffee",
      sorghum: "sorghum",
      millet: "millet",
      tomato: "tomato",
      tomatoes: "tomato",
      onion: "onion",
      onions: "onion",
      soybean: "soybean",
      soybeans: "soybean",
      groundnut: "groundnut",
      peanuts: "groundnut",
    };
    var keys = Object.keys(crops).sort(function byLength(left, right) { return right.length - left.length; });
    for (var i = 0; i < keys.length; i += 1) {
      if (new RegExp("(^|\\b)" + keys[i] + "(\\b|$)", "i").test(text)) return crops[keys[i]];
    }
    return "";
  }

  function extractFarmSize(query) {
    var match = String(query || "").match(/\b([0-9][0-9,]*(?:\.\d+)?)\s?(hectares?|ha|acres?|plots?)\b/i);
    if (!match) return null;
    return { size: Number(match[1].replace(/,/g, "")), unit: /acre/i.test(match[2]) ? "acre" : (/plot/i.test(match[2]) ? "plot" : "hectare") };
  }

  function extractAgricultureCounts(query) {
    var raw = String(query || "");
    var birds = raw.match(/\b([0-9][0-9,]*)\s?(broilers?|layers?|birds?|chickens?|hens?)\b/i);
    var fish = raw.match(/\b([0-9][0-9,]*)\s?(fish|fingerlings?|catfish|tilapia|trout)\b/i);
    var livestock = raw.match(/\b([0-9][0-9,]*)\s?(cattle|cows|goats|sheep)\b/i);
    return {
      birdCount: birds ? Number(birds[1].replace(/,/g, "")) : null,
      fishCount: fish ? Number(fish[1].replace(/,/g, "")) : null,
      livestockCount: livestock ? Number(livestock[1].replace(/,/g, "")) : null,
    };
  }

  function detectAgricultureEnterprise(query) {
    var text = normalizeText(query);
    if (/\bpoultry|broiler|layer|chicken|egg\b/.test(text)) return "poultry";
    if (/\bfish|catfish|tilapia|trout|aquaculture|pond|fingerlings?\b/.test(text)) return "fish";
    if (/\bcattle|cow|goat|sheep|livestock|feed ration\b/.test(text)) return "livestock";
    return "crop";
  }

  function extractPlot(query) {
    var raw = String(query || "");
    var dimensions = raw.match(/\b([0-9]{1,4}(?:\.\d+)?)\s?(?:x|by)\s?([0-9]{1,4}(?:\.\d+)?)\s?(?:m|meters?|metres?|ft|feet)?\b/i);
    var area = raw.match(/\b([0-9][0-9,]*(?:\.\d+)?)\s?(sqm|sq\s?m|m2|square meters?|square metres?|hectares?|ha|acres?|plots?)\b/i);
    if (dimensions) return { size: Number(dimensions[1]) * Number(dimensions[2]), unit: "sqm", length: Number(dimensions[1]), width: Number(dimensions[2]) };
    if (area) return { size: Number(area[1].replace(/,/g, "")), unit: normalizePlotUnit(area[2]) };
    return null;
  }

  function normalizePlotUnit(value) {
    var clean = normalizeText(value);
    if (/hectare|ha/.test(clean)) return "hectare";
    if (/acre/.test(clean)) return "acre";
    if (/plot/.test(clean)) return "plot";
    return "sqm";
  }

  function extractConstructionRooms(query) {
    var raw = String(query || "");
    var bedroom = raw.match(/\b([1-9][0-9]?)\s?[- ]?(?:bed|bedroom|bedrooms|br)\b/i) || raw.match(/\b(one|two|three|four|five|six)\s?[- ]?(?:bed|bedroom|bedrooms)\b/i);
    if (bedroom) return { bedrooms: wordNumber(bedroom[1]), raw: bedroom[0] };
    var roomCount = raw.match(/\b([1-9][0-9]?)\s+(?:rooms?|classrooms?|shops?|offices?)\b/i);
    if (roomCount) return { count: Number(roomCount[1]), raw: roomCount[0] };
    if (/\bsmall room|single room|one room|room self contain|studio\b/i.test(raw)) return { count: 1, raw: "small room" };
    return null;
  }

  function wordNumber(value) {
    var clean = normalizeText(value);
    var words = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
    return words[clean] || Number(value);
  }

  function extractConstructionOutput(query) {
    var text = normalizeText(query);
    if (/\bcad|cad like|cad-like|dxf|technical drawing|afrodraft|draft\b/.test(text)) return "CAD-like plan";
    if (/\bboq|bill of quantities|quantity takeoff|materials list\b/.test(text)) return "BOQ";
    if (/\bblocks?|cement|material|materials|estimate\b/.test(text)) return "material estimate";
    if (/\bchecklist|approval|permit|documents\b/.test(text)) return "checklist";
    if (/\bsketch|draw|design|floor plan|layout|plan\b/.test(text)) return "sketch";
    return "";
  }

  function extractConstructionMaterial(query) {
    var text = normalizeText(query);
    if (/\bblocks?|sandcrete|cement blocks?\b/.test(text)) return "sandcrete blocks";
    if (/\bcement|mortar|plaster\b/.test(text)) return "cement";
    if (/\bconcrete|granite|gravel\b/.test(text)) return "concrete";
    if (/\bbrick|burnt brick\b/.test(text)) return "brick";
    if (/\bsteel|iron rods?|rebar\b/.test(text)) return "reinforced concrete";
    if (/\btimber|wood\b/.test(text)) return "timber";
    return "";
  }

  function extractPdfAction(query) {
    var text = normalizeText(query);
    if (/\b(page numbers?|number pages?|add page numbers?)\b/.test(text)) return "page_numbers";
    if (/\b(protect|password|lock|encrypt)\b/.test(text)) return "protect";
    if (/\b(merge|combine)\b/.test(text)) return "merge";
    if (/\b(compress|reduce|shrink)\b/.test(text)) return "compress";
    if (/\b(split|extract)\b/.test(text)) return "split";
    if (/\b(sign|signature)\b/.test(text)) return "sign";
    if (/\b(redact|remove sensitive)\b/.test(text)) return "redact";
    if (/\b(audio|listen|read aloud)\b/.test(text)) return "audio";
    if (/\b(watermark)\b/.test(text)) return "watermark";
    return "";
  }

  function extractProductCategory(query) {
    var text = normalizeText(query);
    if (/\b(phone|phones|laptop|laptops|electronics|tablet|computer)\b/.test(text)) return "electronics";
    if (/\b(clothes|clothing|textile|textiles|shoes|fashion)\b/.test(text)) return "clothing";
    if (/\b(machine|machinery|equipment|industrial)\b/.test(text)) return "machinery";
    if (/\b(rice|wheat|food|grain|agro|fertilizer)\b/.test(text)) return "food-agriculture";
    if (/\b(car|vehicle|toyota|honda|mazda|nissan|hyundai|kia|mercedes|bmw|volkswagen|ford|lexus)\b/.test(text)) return "vehicle";
    return "";
  }

  function extractInputs(query, ruleMatch) {
    var original = String(query || "");
    var text = normalizeText(original);
    var extracted = {};
    var country = extractCountryFromMap(text, COUNTRY_ALIASES);
    var targetCountry = extractCountryFromMap(text, DESTINATION_COUNTRIES);
    var city = extractCity(original);
    var money = extractMoney(original);
    var year = original.match(/\b(19[8-9]\d|20[0-3]\d)\b/);
    var employees = original.match(/\b([1-9][0-9]?)\s+(?:employees|staff|workers)\b/i);
    var studyLevel = original.match(/\b(undergraduate|bachelor'?s?|masters?|master'?s?|phd|doctorate|diploma|mba)\b/i);
    var field = original.match(/\b(engineering|computer science|software|data science|business|finance|accounting|medicine|nursing|public health|law|agriculture|climate|environment|arts|media)\b/i);
    var gpa = original.match(/\b(?:gpa|cgpa)\s*(?:of|is|:)?\s*([0-5](?:\.\d+)?)\b/i) || original.match(/\b([0-5](?:\.\d+)?)\s*\/\s*5(?:\.0)?\b/i);
    var gradeBand = original.match(/\b(first class|second class upper|2:1|upper second|distinction|merit|credit)\b/i);
    var ielts = original.match(/\b(?:ielts|english)\s*(?:band|score)?\s*(?:of|is|:)?\s*([4-9](?:\.\d)?)\b/i);
    var intake = original.match(/\b(?:jan|january|may|sep|sept|september|fall|spring|summer|winter)\s*(?:intake)?\s*(20[2-3]\d)?\b/i);
    var role = original.match(/\b(?:for|as|role|job)\s+(?:an?\s+)?([a-z][a-z\s-]{2,60}?)(?:\s+in\s+|\s+with\s+|[?.!,]|$)/i);
    var vehicle = original.match(/\b(toyota|honda|mazda|nissan|hyundai|kia|mercedes|bmw|volkswagen|vw|ford|lexus)\s+([a-z0-9 -]{2,40}?)(?:\s+(?:worth|valued|costing|into|to|in|for)\b|[?.!,]|$)/i);
    var pdfAction = extractPdfAction(original);
    var productCategory = extractProductCategory(original);
    var plot = extractPlot(original);
    var constructionRooms = extractConstructionRooms(original);
    var constructionMaterial = extractConstructionMaterial(original);
    var constructionOutput = extractConstructionOutput(original);
    var crop = extractCrop(original);
    var farmSize = extractFarmSize(original);
    var agricultureCounts = extractAgricultureCounts(original);

    if (country) extracted.country = country;
    if (city) extracted.city = city;
    if (targetCountry) extracted.targetCountry = targetCountry;
    if (money) extracted.budget = money;
    if (money) extracted.budgetAmount = money;
    if (extractCurrency(original)) extracted.currency = extractCurrency(original);
    if (year) extracted.year = year[1];
    if (employees) extracted.employeeCount = Number(employees[1]);
    if (studyLevel) extracted.studyLevel = studyLevel[1].replace(/'?s$/i, "").toLowerCase();
    if (field) extracted.field = field[1];
    if (gpa) extracted.gpa = Number(gpa[1]);
    if (!extracted.gpa && gradeBand) extracted.gradeBand = gradeBand[1].toLowerCase();
    if (ielts) extracted.ieltsScore = Number(ielts[1]);
    if (intake) extracted.intakeTimeline = intake[0];
    if (role && ruleMatch && (ruleMatch.toolId === "cv-builder" || ruleMatch.toolId === "cover-letter")) extracted.targetRole = cleanTargetRole(role[1], country, targetCountry);
    if (!extracted.targetRole && ruleMatch && ruleMatch.toolId === "cv-builder") extracted.targetRole = extractProfessionRole(original);
    if (pdfAction) extracted.pdfAction = pdfAction;
    if (productCategory) extracted.productCategory = productCategory;
    if (vehicle) extracted.itemCategory = cleanVehicleCategory(vehicle[1], vehicle[2]);
    if (!extracted.itemCategory && productCategory) extracted.itemCategory = productCategory;
    if (plot) {
      extracted.plotSize = plot.size;
      extracted.plotUnit = plot.unit;
      if (plot.length) extracted.plotLength = plot.length;
      if (plot.width) extracted.plotWidth = plot.width;
    }
    if (constructionRooms) extracted.rooms = constructionRooms;
    if (constructionMaterial) extracted.materialPreference = constructionMaterial;
    if (constructionOutput) extracted.outputDesired = constructionOutput;
    if (crop) extracted.crop = crop;
    if (farmSize) {
      extracted.farmSize = farmSize.size;
      extracted.farmSizeUnit = farmSize.unit;
    }
    if (agricultureCounts.birdCount) extracted.birdCount = agricultureCounts.birdCount;
    if (agricultureCounts.fishCount) extracted.fishCount = agricultureCounts.fishCount;
    if (agricultureCounts.livestockCount) extracted.livestockCount = agricultureCounts.livestockCount;

    if (ruleMatch && (ruleMatch.toolId === "import-duty" || ruleMatch.toolId === "car-import-cost" || ruleMatch.toolId === "landed-cost" || ruleMatch.toolId === "hs-code-lookup")) {
      if (country) extracted.destinationCountry = country;
      if (money) extracted.itemValue = money;
    }
    if (ruleMatch && ruleMatch.intentCategory === "agriculture") {
      extracted.enterpriseType = detectAgricultureEnterprise(original);
      if (money) extracted.budget = money;
      if (ruleMatch.toolId === "poultry-roi-calculator") extracted.enterpriseType = "poultry";
      if (ruleMatch.toolId === "fish-farming-roi") extracted.enterpriseType = "fish";
      if (ruleMatch.toolId === "livestock-feed-calculator") extracted.enterpriseType = "livestock";
    }
    if (ruleMatch && (ruleMatch.intentCategory === "construction" || ruleMatch.toolId === "afroplan-floor-planner" || ruleMatch.toolId === "afrodraft" || ruleMatch.toolId === "building-materials" || ruleMatch.toolId === "boq-generator" || ruleMatch.toolId === "land-size")) {
      if (money) extracted.budget = money;
      var building = original.match(/\b(bungalow|duplex|flat|apartment|house|room|shop|office|classroom|school|warehouse|clinic|restaurant|studio)\b/i);
      if (building) extracted.buildingType = building[1].toLowerCase();
      if (!extracted.buildingType && constructionRooms && constructionRooms.bedrooms) extracted.buildingType = constructionRooms.bedrooms <= 2 ? "bungalow" : "house";
    }
    if (ruleMatch && (ruleMatch.toolId === "paye-calculator" || ruleMatch.toolId === "ao-paye" || ruleMatch.intentCategory === "salary-tax")) {
      var salaryAmount = money || extractPlainAmount(original);
      if (salaryAmount) extracted.grossPay = salaryAmount;
      if (!extracted.payPeriod && /\bannual|yearly|per year\b/i.test(original)) extracted.payPeriod = "annual";
      if (!extracted.payPeriod && /\bmonthly|per month\b/i.test(original)) extracted.payPeriod = "monthly";
      if (!extracted.payPeriod && /\bweekly|per week\b/i.test(original)) extracted.payPeriod = "weekly";
      if (!extracted.payPeriod && /\bdaily|per day\b/i.test(original)) extracted.payPeriod = "daily";
    }
    if (ruleMatch && ruleMatch.toolId === "solar-roi" && money) {
      extracted.monthlyBill = money;
    }
    if (ruleMatch && (ruleMatch.toolId === "invoice-generator" || ruleMatch.toolId === "vat-calc-pan-african")) {
      if (money) {
        extracted.amount = money;
        extracted.invoiceAmount = money;
      }
      if (ruleMatch.toolId === "vat-calc-pan-african") extracted.vatTreatment = "standard";
    }

    return extracted;
  }

  function requiredInputNames(tool) {
    return array(tool && tool.requiredInputs).map(function getName(input) {
      return input && input.name;
    }).filter(Boolean);
  }

  function findMissingInputs(tool, extracted) {
    var values = extracted || {};
    return requiredInputNames(tool).filter(function isMissing(name) {
      return values[name] === undefined || values[name] === null || values[name] === "";
    });
  }

  function highStakesNotice(domain) {
    if (domain === "tax") return "Planning estimate only. Confirm tax, PAYE, VAT, filing, and compliance decisions with official revenue authority guidance or a qualified professional.";
    if (domain === "immigration") return "Planning estimate only. Confirm visa, immigration, and relocation decisions with official government sources or a qualified adviser.";
    if (domain === "legal") return "Planning estimate only. This is not legal advice; confirm with official sources or a qualified legal professional.";
    if (domain === "health") return "Informational only. Do not use this as medical advice; consult a qualified health professional.";
    if (domain === "finance") return "Planning estimate only. Confirm financial, customs, lending, and business decisions with official sources or a qualified professional.";
    if (domain === "employment") return "Planning support only. Review employment, hiring, salary, and application decisions with qualified local guidance where needed.";
    if (domain === "education") return "Planning estimate only. Confirm eligibility, fees, deadlines, and admissions details with official school or scholarship sources.";
    if (domain === "energy") return "Planning estimate only. Confirm tariffs, fuel prices, installation sizing, and safety requirements with current local suppliers or qualified installers.";
    return "";
  }

  function hasCapability(tool, capability) {
    return Boolean(tool && array(tool.aiCapabilities).indexOf(capability) !== -1);
  }

  function outputTypes(tool) {
    return array(tool && tool.outputTypes).filter(Boolean).slice(0, 6);
  }

  function clarificationQuestion(missingInputs, tool) {
    var missing = array(missingInputs);
    if (!missing.length) return "";
    var title = tool && tool.title ? " for " + tool.title : "";
    if (missing.indexOf("country") !== -1) return "Which country should AfroTools use" + title + "?";
    if (missing.indexOf("destinationCountry") !== -1) return "Which destination country should the import, customs, or relocation workflow use?";
    if (missing.indexOf("targetCountry") !== -1) return "Which destination country are you considering?";
    if (missing.indexOf("grossPay") !== -1) return "What gross pay amount should the PAYE workflow estimate from?";
    if (missing.indexOf("payPeriod") !== -1) return "Is that pay amount monthly, annual, weekly, or daily?";
    if (missing.indexOf("itemValue") !== -1 || missing.indexOf("purchasePrice") !== -1) return "What item, vehicle, or CIF value should the import workflow use as a planning input?";
    if (missing.indexOf("itemCategory") !== -1) return "What item or vehicle are you importing?";
    if (missing.indexOf("studyLevel") !== -1) return "What study level are you targeting?";
    if (missing.indexOf("budget") !== -1) return "What budget should AfroTools use as a planning estimate?";
    if (missing.indexOf("monthlyBill") !== -1) return "What monthly power bill or generator fuel spend should the energy workflow use?";
    if (missing.indexOf("pdfAction") !== -1) return "What PDF action do you need: merge, compress, sign, protect, split, watermark, or page numbers?";
    return "What missing detail should AfroTools use to open the right workflow?";
  }

  function buildHandoffPlan(tool, missingInputs) {
    var safeTool = tool || SEARCH_FALLBACK;
    var missing = array(missingInputs);
    var canPrefill = safeTool.id !== SEARCH_FALLBACK.id && hasCapability(safeTool, "prefill");
    return {
      mode: canPrefill ? "session_prefill" : "route_only",
      userReviewRequired: true,
      payloadLocation: canPrefill ? "sessionStorage" : "none",
      rawSensitiveDataInUrl: false,
      requiresClarification: missing.length > 0,
      missingInputs: missing,
      consentRequiredForModel: safeTool.privacyMode === "ai_optional" || safeTool.privacyMode === "server_required",
      launchLabel: canPrefill ? "Review prefill and open tool" : "Open tool",
    };
  }

  function buildExportPlan(tool, safetyDomain) {
    var types = outputTypes(tool);
    var canExport = hasCapability(tool, "export") || types.length > 0;
    return {
      available: canExport,
      formats: types,
      defaultFormat: types.indexOf("pdf") !== -1 ? "pdf" : (types.indexOf("report") !== -1 ? "report" : (types[0] || "")),
      reviewBeforeUse: safetyDomain && safetyDomain !== "none",
      copy: canExport ? "Export only after reviewing assumptions, source notes, and any missing inputs." : "Open the tool first; export support depends on the destination workflow.",
    };
  }

  function nextActions(tool, missingInputs, exportPlan) {
    var actions = [];
    if (array(missingInputs).length) actions.push("Answer the clarification so the workflow opens with the right context");
    actions.push("Open the recommended AfroTools tool");
    if (tool && hasCapability(tool, "prefill")) actions.push("Review the browser-only prefill before calculating or exporting");
    if (exportPlan && exportPlan.available) actions.push("Export the finished result from the tool after checking assumptions");
    actions.push("Search AfroTools if the match is not right");
    return actions;
  }

  function buildDecision(query, tool, ruleMatch, extracted, source) {
    var safeTool = tool || SEARCH_FALLBACK;
    var missing = findMissingInputs(safeTool, extracted);
    var confidence = source === "model" ? 0.72 : (ruleMatch ? Math.min(0.95, 0.58 + ruleMatch.score * 0.08) : 0.2);
    var privacyMode = safeTool.privacyMode || "browser_local";
    var safetyDomain = safeTool.highStakesDomain || "none";
    return {
      intentCategory: ruleMatch ? ruleMatch.intentCategory : (safeTool.subcategory || safeTool.category || "search"),
      selectedToolId: safeTool.id,
      selectedRoute: routeUrl(safeTool.route, query),
      confidence: clampConfidence(confidence),
      reasonShort: ruleMatch && ruleMatch.source === "manifest_retrieval" ? "Checked the AfroTools tool catalog." : (ruleMatch ? "Matched your words to an AfroTools tool." : "No strong match yet; opening AfroTools search."),
      extractedInputs: extracted || {},
      missingInputs: missing,
      clarificationQuestion: clarificationQuestion(missing, safeTool),
      safetyDomain: safetyDomain,
      highStakesNotice: highStakesNotice(safetyDomain),
      privacyMode: privacyMode,
      canPrefill: safeTool.id !== SEARCH_FALLBACK.id && hasCapability(safeTool, "prefill"),
      handoffPlan: buildHandoffPlan(safeTool, missing),
      exportPlan: buildExportPlan(safeTool, safetyDomain),
      suggestedNextActions: nextActions(safeTool, missing, buildExportPlan(safeTool, safetyDomain)),
      _meta: {
        router: "deterministic",
        providerUsed: false,
        retrievalSource: ruleMatch && ruleMatch.source || "rule",
        retrievalScore: ruleMatch && ruleMatch.retrievalScore || undefined,
        retrievalMatchedFields: ruleMatch && ruleMatch.matchedFields || undefined,
        retrievalCatalogSize: ruleMatch && ruleMatch.catalogSize || undefined,
      },
    };
  }

  function requestedLocale(options) {
    var locale = options && (options.locale || options.lang || options.uiLocale);
    return String(locale || "en").toLowerCase().split(/[-_]/)[0];
  }

  function normalizeRouteKey(route) {
    var pathname = String(route || "/").split(/[?#]/)[0].replace(/\/+/g, "/");
    if (pathname === "/") return "/";
    return "/" + pathname.replace(/^\/+|\/+$/g, "") + "/";
  }

  function routeQuery(route) {
    var value = String(route || "");
    var index = value.indexOf("?");
    return index === -1 ? "" : value.slice(index);
  }

  function localizeSelectedRoute(decision, options) {
    if (requestedLocale(options) !== "fr") return decision;
    var copy = Object.assign({}, decision);
    var routes = Object.assign({}, frenchRouteMapApi && frenchRouteMapApi.routes || {}, {
      "/tools/stock-portfolio/": "/fr/tools/suivi-portefeuille-actions/",
      "/tools/thrift-calc/": "/fr/tools/rendement-tontine-cooperative/",
      "/tools/trade-credit/": "/fr/tools/credit-commercial/",
    });
    var englishRoute = normalizeRouteKey(copy.selectedRoute);
    var frenchRoute = routes[englishRoute];
    var meta = Object.assign({}, copy._meta || {});
    var routeSource = frenchRouteMapApi && frenchRouteMapApi.source;

    if (copy.selectedToolId === SEARCH_FALLBACK.id) {
      copy.selectedRoute = (routes["/search/"] || "/fr/search/") + (routeQuery(copy.selectedRoute) || "?source=ask");
      meta.localeRoute = { locale: "fr", status: "search_fallback", source: frenchRouteMapApi && frenchRouteMapApi.source || "explicit_fallback" };
      copy._meta = meta;
      return copy;
    }

    if (frenchRoute) {
      copy.selectedRoute = frenchRoute + routeQuery(copy.selectedRoute);
      meta.localeRoute = { locale: "fr", status: "mapped", source: routeSource || "verified_route_map" };
      copy._meta = meta;
      return copy;
    }

    var requestedToolId = copy.selectedToolId;
    copy.selectedToolId = SEARCH_FALLBACK.id;
    copy.selectedRoute = (routes["/search/"] || "/fr/search/") + "?source=ask";
    copy.confidence = Math.min(Number(copy.confidence || 0.2), 0.2);
    copy.reasonShort = "Aucune route française vérifiée n’est publiée pour cette correspondance.";
    copy.extractedInputs = {};
    copy.missingInputs = [];
    copy.clarificationQuestion = "Précisez votre besoin dans la recherche française pour éviter une redirection vers une page anglaise.";
    copy.safetyDomain = "none";
    copy.highStakesNotice = "";
    copy.privacyMode = "browser_local";
    copy.canPrefill = false;
    copy.handoffPlan = buildHandoffPlan(SEARCH_FALLBACK, []);
    copy.handoffPlan.launchLabel = "Ouvrir la recherche française";
    copy.exportPlan = buildExportPlan(SEARCH_FALLBACK, "none");
    copy.suggestedNextActions = ["Ouvrir la recherche française", "Préciser le pays et la tâche", "Choisir uniquement une route française publiée"];
    meta.localeRoute = {
      locale: "fr",
      status: "unavailable",
      requestedToolId: requestedToolId,
      source: frenchRouteMapApi && frenchRouteMapApi.source || "missing_route_map",
    };
    copy._meta = meta;
    return copy;
  }

  function localizeDecision(decision, options) {
    var localized = decision;
    if (i18nApi && typeof i18nApi.localizeRouterDecision === "function") {
      var locale = options && (options.locale || options.lang || options.uiLocale);
      localized = i18nApi.localizeRouterDecision(decision, locale || "en");
    }
    return localizeSelectedRoute(localized, options);
  }

  function rawFallbackDecision(query) {
    return buildDecision(query, SEARCH_FALLBACK, null, {}, "fallback");
  }

  function fallbackDecision(query, options) {
    return localizeDecision(rawFallbackDecision(query), options);
  }

  function isExplicitPassportQuery(text) {
    return /\bpassport\b/.test(text) && /\b(application|apply|renew|documents?|fees?|checklist|ghana|nigeria|kenya|next steps?)\b/.test(text);
  }

  function isAmbiguousCountryPrompt(text) {
    var country = extractCountryFromMap(text, COUNTRY_ALIASES) || extractCountryFromMap(text, DESTINATION_COUNTRIES);
    if (!country) return false;
    if (/\b(scholarships?|bursary|study|student|university|visa|immigration|passport|relocat|move|japa|cost|budget|rent|job|cv|resume|salary|paye|tax|invoice|vat|import|customs|duty|solar|generator|fuel|pdf|document|business|market|compare|profile|data)\b/.test(text)) return false;
    var aliases = Object.assign({}, COUNTRY_ALIASES, DESTINATION_COUNTRIES);
    var scrubbed = text;
    Object.keys(aliases).sort(function byLength(left, right) {
      return right.length - left.length;
    }).forEach(function removeAlias(alias) {
      scrubbed = scrubbed.replace(new RegExp("(^|\\b)" + alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(\\b|$)", "gi"), " ");
    });
    scrubbed = scrubbed.replace(/\b(help|assist|support|guide|me|with|about|for|please|can|you|tell|info|information|need|want|something)\b/g, " ").replace(/\s+/g, " ").trim();
    return !scrubbed;
  }

  function ambiguousCountryDecision(query, options) {
    var decision = rawFallbackDecision(query);
    decision.confidence = 0.18;
    decision.reasonShort = "I need one detail before choosing an AfroTools workflow.";
    decision.clarificationQuestion = "Is this mainly about scholarships, relocation, visa-style planning, country data, jobs, cost of living, import/customs, documents, or business?";
    decision.suggestedNextActions = [
      "Choose the closest task area",
      "Add a country plus one detail like budget, document type, salary, destination, item, or job target",
      "Browse common AfroTools workflows"
    ];
    decision._meta = Object.assign({}, decision._meta || {}, {
      router: "ambiguous_country",
      providerUsed: false
    });
    return localizeDecision(decision, options);
  }

  function guardrailFallbackDecision(query, options, inspection) {
    var decision = localizeDecision(rawFallbackDecision(query), options);
    decision.confidence = 0;
    decision.canPrefill = false;
    decision.reasonShort = inspection && inspection.userMessage ? inspection.userMessage : "AfroTools AI could not safely route that request.";
    decision.highStakesNotice = "AfroTools AI will not bypass safety rules, alter formulas, impersonate authorities, fabricate sources, or guarantee high-stakes outcomes.";
    decision.suggestedNextActions = ["Rephrase as a practical AfroTools calculator or planning task", "Open AfroTools search", "Use official sources for final decisions"];
    decision._meta = Object.assign({}, decision._meta || {}, {
      router: "guardrail",
      providerUsed: false,
      guardrail: {
        blocked: true,
        code: inspection && inspection.code || "blocked",
        reason: inspection && inspection.reason || "",
      },
    });
    return decision;
  }

  function routeDeterministically(query, options) {
    if (guardrailsApi && typeof guardrailsApi.inspectPrompt === "function") {
      var inspection = guardrailsApi.inspectPrompt(query, { maxChars: guardrailsApi.ROUTER_PROMPT_LIMIT || 1200 });
      if (!inspection.allowed) return guardrailFallbackDecision(query, options, inspection);
    }
    var manifest = getRouterManifest(options && options.manifest);
    var match = findBestRule(query);
    var manifestMatch = findManifestCandidate(query, manifest);
    var normalizedQuery = normalizeText(query);
    if (isAmbiguousCountryPrompt(normalizedQuery)) return ambiguousCountryDecision(query, options);
    var keepCountryComparisonRule = match && match.toolId === "afroatlas" && detectedCountryCount(normalizedQuery) >= 2;
    var weakGenericCountryRule = match && match.toolId === "afroatlas" && match.score <= 3 && !keepCountryComparisonRule && !isExplicitCountryIntelligenceQuery(normalizedQuery);
    if (!match || (manifestMatch && manifestMatch.retrievalScore >= 40 && weakGenericCountryRule)) match = manifestMatch;
    if (isExplicitPassportQuery(normalizedQuery) && findTool(manifest, "passport-checklist")) {
      match = Object.assign({}, match || {}, {
        intentCategory: "government",
        toolId: "passport-checklist",
        score: Math.max(Number(match && match.score || 0), 7),
        safetyHints: ["immigration"],
        source: "explicit_passport",
      });
    }
    if (match && match.toolId === "paye-calculator" && extractCountryFromMap(normalizedQuery, COUNTRY_ALIASES) === "Angola" && findTool(manifest, "ao-paye")) {
      match = Object.assign({}, match, {
        toolId: "ao-paye",
        score: Math.max(Number(match.score || 0), 4),
        source: "country_salary_tax",
      });
    }
    if (!match) return fallbackDecision(query, options);
    var tool = findTool(manifest, match.toolId) || SEARCH_FALLBACK;
    return localizeDecision(buildDecision(query, tool, match, extractInputs(query, match), "deterministic"), options);
  }

  function normalizeDecision(decision, query, options) {
    if (guardrailsApi && typeof guardrailsApi.inspectPrompt === "function") {
      var inspection = guardrailsApi.inspectPrompt(query, { maxChars: guardrailsApi.ROUTER_PROMPT_LIMIT || 1200 });
      if (!inspection.allowed) return guardrailFallbackDecision(query, options, inspection);
    }
    var manifest = getRouterManifest(options && options.manifest);
    var base = decision && typeof decision === "object" ? Object.assign({}, decision) : {};
    var tool = findTool(manifest, base.selectedToolId) || findTool(manifest, base.selectedToolId || base.toolId) || SEARCH_FALLBACK;
    var deterministic = routeDeterministically(query, options);
    var extracted = Object.assign({}, deterministic.extractedInputs || {}, base.extractedInputs || {});
    var missing = Array.isArray(base.missingInputs) ? base.missingInputs : findMissingInputs(tool, extracted);
    var safetyDomain = OUTPUT_SCHEMA.enums.safetyDomain.indexOf(base.safetyDomain) !== -1 ? base.safetyDomain : (tool.highStakesDomain || "none");
    var privacyMode = OUTPUT_SCHEMA.enums.privacyMode.indexOf(base.privacyMode) !== -1 ? base.privacyMode : (tool.privacyMode || "browser_local");

    return localizeDecision({
      intentCategory: String(base.intentCategory || deterministic.intentCategory || tool.subcategory || "search"),
      selectedToolId: tool.id,
      selectedRoute: routeUrl(tool.route, query),
      confidence: clampConfidence(base.confidence || deterministic.confidence || 0.2),
      reasonShort: String(base.reasonShort || deterministic.reasonShort || "Matched against AfroTools tool registry.").slice(0, 240),
      extractedInputs: extracted,
      missingInputs: missing.filter(Boolean),
      clarificationQuestion: String(base.clarificationQuestion || clarificationQuestion(missing, tool) || ""),
      safetyDomain: safetyDomain,
      highStakesNotice: String(base.highStakesNotice || highStakesNotice(safetyDomain) || ""),
      privacyMode: privacyMode,
      canPrefill: Boolean(base.canPrefill !== undefined ? base.canPrefill : hasCapability(tool, "prefill")),
      handoffPlan: base.handoffPlan && typeof base.handoffPlan === "object" ? base.handoffPlan : buildHandoffPlan(tool, missing),
      exportPlan: base.exportPlan && typeof base.exportPlan === "object" ? base.exportPlan : buildExportPlan(tool, safetyDomain),
      suggestedNextActions: array(base.suggestedNextActions).length ? array(base.suggestedNextActions).map(String).slice(0, 5) : nextActions(tool, missing, buildExportPlan(tool, safetyDomain)),
      _meta: {
        router: base._meta && base._meta.router ? String(base._meta.router) : "validated",
        providerUsed: Boolean(base._meta && base._meta.providerUsed),
      },
    }, options);
  }

  function validateRouterOutput(decision) {
    var errors = [];
    if (!decision || typeof decision !== "object" || Array.isArray(decision)) {
      return { valid: false, errors: ["output must be an object"] };
    }

    OUTPUT_SCHEMA.requiredFields.forEach(function requireField(field) {
      if (decision[field] === undefined || decision[field] === null) errors.push(field + " is required");
    });
    ["intentCategory", "selectedToolId", "selectedRoute", "reasonShort", "safetyDomain", "privacyMode"].forEach(function requireString(field) {
      if (typeof decision[field] !== "string" || !decision[field].trim()) errors.push(field + " must be a non-empty string");
    });
    if (typeof decision.highStakesNotice !== "string") errors.push("highStakesNotice must be a string");
    if (!decision.selectedRoute || decision.selectedRoute.charAt(0) !== "/") errors.push("selectedRoute must be root-relative");
    if (!Number.isFinite(Number(decision.confidence)) || decision.confidence < 0 || decision.confidence > 1) errors.push("confidence must be between 0 and 1");
    if (!decision.extractedInputs || typeof decision.extractedInputs !== "object" || Array.isArray(decision.extractedInputs)) errors.push("extractedInputs must be an object");
    if (!Array.isArray(decision.missingInputs)) errors.push("missingInputs must be an array");
    if (!Array.isArray(decision.suggestedNextActions) || !decision.suggestedNextActions.length) errors.push("suggestedNextActions must be a non-empty array");
    if (typeof decision.clarificationQuestion !== "string") errors.push("clarificationQuestion must be a string");
    if (typeof decision.canPrefill !== "boolean") errors.push("canPrefill must be a boolean");
    if (OUTPUT_SCHEMA.enums.safetyDomain.indexOf(decision.safetyDomain) === -1) errors.push("safetyDomain is invalid");
    if (OUTPUT_SCHEMA.enums.privacyMode.indexOf(decision.privacyMode) === -1) errors.push("privacyMode is invalid");

    return { valid: errors.length === 0, errors: errors };
  }

  return {
    OUTPUT_SCHEMA: OUTPUT_SCHEMA,
    ROUTING_RULES: ROUTING_RULES,
    routeDeterministically: routeDeterministically,
    normalizeDecision: normalizeDecision,
    validateRouterOutput: validateRouterOutput,
    fallbackDecision: fallbackDecision,
    highStakesNotice: highStakesNotice,
  };
});

#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  writeFileSyncWithRetry,
  renameSyncWithRetry,
  unlinkSyncWithRetry,
} = require("./lib/safe-write");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.join(ROOT, "data", "localization", "coverage-wave-2026-07.json");
const REFRESH = process.argv.includes("--refresh");

const SWAHILI_COPY = {
  "50-30-20-budget": ["bajeti-50-30-20", "Kikokotoo cha bajeti ya 50/30/20"],
  "afcon-predictor": ["utabiri-wa-afcon", "Kitabiri cha AFCON"],
  "africa-conflict": ["migogoro-ya-afrika", "Ufuatiliaji wa migogoro ya Afrika"],
  "africa-election-tracker": ["ufuatiliaji-uchaguzi-afrika", "Ufuatiliaji wa uchaguzi Afrika"],
  "africa-flight": ["safari-za-ndege-afrika", "Mpangaji wa safari za ndege Afrika"],
  "african-meal-plan": ["mpango-wa-milo-afrika", "Mpango wa milo ya Afrika"],
  "african-palette": ["rangi-za-afrika", "Paleti ya rangi za Afrika"],
  "afroatlas": ["afroatlas", "AfroAtlas"],
  "afropayroll-os": ["afropayroll-os", "AfroPayroll OS"],
  "afropoints": ["afropoints", "AfroPoints"],
  "afroprices": ["afroprices", "AfroPrices"],
  "afrostream": ["afrostream", "AfroStream"],
  "agent-commission": ["kamisheni-ya-wakala", "Kikokotoo cha kamisheni ya wakala"],
  "agric-profit": ["faida-ya-kilimo", "Kikokotoo cha faida ya kilimo"],
  "airbnb-vs-hotel": ["airbnb-dhidi-ya-hoteli", "Airbnb dhidi ya hoteli"],
  "airport-transfer": ["usafiri-wa-uwanja-wa-ndege", "Makadirio ya usafiri wa uwanja wa ndege"],
  "album-budget": ["bajeti-ya-albamu", "Mpangaji wa bajeti ya albamu"],
  "amount-words-gh": ["kiasi-kwa-maneno-ghana", "Kiasi kwa maneno nchini Ghana"],
  "amount-words-ke": ["kiasi-kwa-maneno-kenya", "Kiasi kwa maneno nchini Kenya"],
  "ankara-kente-cost": ["gharama-ya-ankara-na-kente", "Kikokotoo cha gharama ya Ankara na Kente"],
  "art-commission": ["bei-ya-kazi-ya-sanaa", "Kikokotoo cha bei ya kazi ya sanaa"],
  "asset-finance": ["ufadhili-wa-mali", "Kikokotoo cha ufadhili wa mali"],
  "athlete-earnings": ["mapato-ya-mwanariadha", "Kikokotoo cha mapato ya mwanariadha"],
  "b2b-payment": ["malipo-ya-biashara-kwa-biashara", "Kilinganisha malipo ya biashara kwa biashara"],
  "background-remover": ["kiondoa-mandharinyuma", "Kiondoa mandharinyuma ya picha"],
  "backup-power-costs": ["gharama-ya-nishati-ya-dharura", "Kikokotoo cha nishati ya dharura"],
  "beach-holiday-budget": ["bajeti-ya-likizo-ufukweni", "Mpangaji wa bajeti ya likizo ufukweni"],
  "betting-odds": ["uwezekano-wa-kamari", "Kibadilishaji cha uwezekano wa kamari"],
  "betting-tax": ["kodi-ya-kamari", "Kikokotoo cha kodi ya kamari"],
  "bill-split": ["kigawanya-bili-na-bakshishi", "Kigawanya bili na bakshishi"],
  "binary-converter": ["kibadilishaji-mfumo-wa-jozi", "Kibadilishaji cha mfumo wa jozi"],
  "blood-group": ["kundi-la-damu", "Mwongozo wa kundi la damu"],
  "bmi-calculator": ["kikokotoo-bmi-ya-mwili", "Kikokotoo cha BMI"],
  "bnpl-calc": ["lipa-sasa-au-baadaye", "Kikokotoo cha lipa sasa au baadaye"],
  "boarding-school": ["gharama-ya-shule-ya-bweni", "Kikokotoo cha gharama ya shule ya bweni"],
  "bond-yield": ["mavuno-ya-hatifungani", "Kikokotoo cha mavuno ya hatifungani"],
  "book-publishing-cost": ["gharama-ya-kuchapisha-kitabu", "Kikokotoo cha gharama ya kuchapisha kitabu"],
  "breastfeeding-tracker": ["ufuatiliaji-kunyonyesha", "Ufuatiliaji wa kunyonyesha"],
  "brideprice-advisor": ["mshauri-wa-mahari", "Mshauri wa mahari"],
  "budget-comparator": ["kilinganisha-bajeti", "Kilinganisha bajeti"],
  "burial-cost": ["gharama-za-mazishi", "Kikokotoo cha gharama za mazishi"],
  "business-continuity": ["mwendelezo-wa-biashara", "Tathmini ya mwendelezo wa biashara"],
  "business-name-gen": ["kitengeneza-jina-la-biashara", "Kitengeneza jina la biashara"],
  "business-plan-builder": ["mjenzi-mpango-wa-biashara", "Mjenzi wa mpango wa biashara"],
  "calorie-counter": ["kihesabu-kalori", "Kihesabu kalori"],
  "cbk-rates": ["viwango-vya-cbk", "Viwango vya CBK"],
  "cctv-cost": ["gharama-za-cctv", "Kikokotoo cha gharama za CCTV"],
  "cert-roi": ["faida-ya-cheti", "Kikokotoo cha faida ya cheti"],
  "certificate-maker": ["kitengeneza-cheti", "Kitengeneza cheti"],
  "child-support": ["matunzo-ya-mtoto", "Kikokotoo cha matunzo ya mtoto"],
  "childbirth-cost": ["gharama-za-kujifungua", "Kikokotoo cha gharama za kujifungua"],
  "cholera-risk": ["hatari-ya-kipindupindu", "Tathmini ya hatari ya kipindupindu"],
  "claim-tracker": ["ufuatiliaji-wa-dai", "Ufuatiliaji wa dai"],
  "classroom-size": ["ukubwa-wa-darasa", "Kikokotoo cha ukubwa wa darasa"],
  "clinic-costs": ["gharama-za-kliniki", "Kikokotoo cha gharama za kliniki"],
  "cnps-guide": ["mwongozo-wa-cnps", "Mwongozo wa CNPS"],
  "coding-bootcamp": ["mafunzo-ya-kina-ya-programu", "Kilinganisha mafunzo ya kina ya programu"],
  "color-picker": ["kichagua-rangi", "Kichagua rangi"],
  "colour-palette": ["paleti-ya-rangi", "Kitengeneza paleti ya rangi"],
  "commodity-tracker": ["ufuatiliaji-bei-za-bidhaa", "Ufuatiliaji wa bei za bidhaa"],
  "compound-interest": ["riba-ya-mchanganyiko", "Kikokotoo cha riba ya mchanganyiko"],
  "concert-budget": ["bajeti-ya-tamasha", "Mpangaji wa bajeti ya tamasha"],
  "construction-budget": ["bajeti-ya-ujenzi-wa-nyumba", "Mpangaji wa bajeti ya ujenzi wa nyumba"],
  "contractor-vs-employee": ["mkandarasi-dhidi-ya-mfanyakazi", "Mkandarasi dhidi ya mfanyakazi"],
  "cost-of-living": ["gharama-za-maisha", "Kilinganisha gharama za maisha"],
  "course-load": ["mzigo-wa-masomo", "Kikokotoo cha mzigo wa masomo"],
  "creator-club": ["klabu-ya-watayarishi", "Klabu ya watayarishi"],
  "creator-course": ["kozi-ya-watayarishi", "Kozi ya watayarishi"],
  "creator-desk": ["dawati-la-mtayarishi", "Dawati la mtayarishi"],
  "creator-mail": ["barua-ya-mtayarishi", "Barua ya mtayarishi"],
  "creator-mind": ["mawazo-ya-mtayarishi", "Mawazo ya mtayarishi"],
  "creator-polish": ["boresha-maudhui-ya-mtayarishi", "Kiboresha maudhui ya mtayarishi"],
  "creator-research": ["utafiti-wa-mtayarishi", "Utafiti wa mtayarishi"],
  "creator-schedule": ["ratiba-ya-mtayarishi", "Ratiba ya mtayarishi"],
  "creator-split": ["mgawanyo-wa-mapato-ya-watayarishi", "Mgawanyo wa mapato ya watayarishi"],
  "creator-team": ["timu-ya-watayarishi", "Timu ya watayarishi"],
  "credit-score": ["alama-ya-mkopo", "Mwongozo wa alama ya mkopo"],
  "crop-yield": ["mavuno-ya-mazao", "Kikokotoo cha mavuno ya mazao"],
  "crypto-tax": ["kodi-ya-sarafu-za-kidijitali", "Kikokotoo cha kodi ya sarafu za kidijitali"],
  "csection-vs-natural": ["upasuaji-dhidi-ya-kujifungua-kawaida", "Upasuaji dhidi ya kujifungua kawaida"],
  "cybersecurity-assessment": ["tathmini-ya-usalama-wa-kidijitali", "Tathmini ya usalama wa kidijitali"],
  "data-breach-cost": ["gharama-ya-uvujaji-wa-data", "Kikokotoo cha gharama ya uvujaji wa data"],
  "dca-calc": ["ununuzi-wa-mara-kwa-mara", "Kikokotoo cha ununuzi wa mara kwa mara"],
  "debt-snowball": ["mpango-wa-kulipa-madeni", "Mpango wa kulipa madeni"],
  "dental-cost": ["gharama-ya-meno", "Kikokotoo cha gharama ya meno"],
  "dev-feasibility": ["uwezekano-wa-ujenzi", "Tathmini ya uwezekano wa ujenzi"],
  "diaspora-guide": ["mwongozo-wa-diaspora", "Mwongozo wa diaspora"],
  "dividend-yield": ["mavuno-ya-gawio", "Kikokotoo cha mavuno ya gawio"],
  "divorce-settlement": ["mgawanyo-wa-talaka", "Kikokotoo cha mgawanyo wa talaka"],
  "dj-booking-rate": ["bei-ya-dj", "Kikokotoo cha bei ya DJ"],
  "doc-generator": ["kitengeneza-nyaraka", "Kitengeneza nyaraka"],
  "drug-price-compare": ["kilinganisha-bei-za-dawa", "Kilinganisha bei za dawa"],
  "due-date": ["kikokotoo-tarehe-ya-kujifungua", "Kikokotoo cha tarehe ya kujifungua"],
  "eac-cet": ["ushuru-wa-pamoja-wa-eac", "Kikokotoo cha ushuru wa pamoja wa EAC"],
  "ebola-checklist": ["orodha-ya-ukaguzi-wa-ebola", "Orodha ya ukaguzi wa Ebola"],
  "ecowas-levy": ["tozo-ya-ecowas", "Kikokotoo cha tozo ya ECOWAS"],
  "edu-savings": ["akiba-ya-elimu", "Kikokotoo cha akiba ya elimu"],
  "electricity-estimator": ["makisio-ya-bili-ya-umeme", "Kikokotoo cha bili ya umeme"],
  "employee-cost": ["gharama-ya-mfanyakazi", "Kikokotoo cha gharama ya mfanyakazi"],
  "engagement-rate": ["kiwango-cha-ushiriki", "Kikokotoo cha kiwango cha ushiriki"],
};

const FRENCH_WORDS = new Map([
  ["salary", "salaire"], ["tax", "impôt"], ["income", "revenu"], ["payroll", "paie"],
  ["budget", "budget"], ["loan", "prêt"], ["interest", "intérêts"], ["mortgage", "crédit immobilier"],
  ["business", "entreprise"], ["employee", "salarié"], ["employer", "employeur"], ["price", "prix"],
  ["rates", "taux"], ["rate", "taux"], ["fees", "frais"], ["fee", "frais"], ["invoice", "facture"],
  ["receipt", "reçu"], ["import", "importation"], ["export", "exportation"], ["electricity", "électricité"],
  ["fuel", "carburant"], ["car", "voiture"], ["vehicle", "véhicule"], ["rental", "location"],
  ["rent", "loyer"], ["property", "immobilier"], ["home", "logement"], ["school", "école"],
  ["student", "étudiant"], ["education", "éducation"], ["health", "santé"], ["hospital", "hôpital"],
  ["insurance", "assurance"], ["travel", "voyage"], ["flight", "vol"], ["africa", "Afrique"],
  ["african", "africain"], ["farm", "exploitation agricole"], ["agriculture", "agriculture"],
  ["crop", "culture"], ["yield", "rendement"], ["water", "eau"], ["solar", "solaire"],
  ["energy", "énergie"], ["power", "énergie"], ["wedding", "mariage"], ["creator", "créateur"],
  ["document", "document"], ["documents", "documents"], ["cost", "coût"], ["costs", "coûts"],
  ["profit", "bénéfice"], ["margin", "marge"], ["payment", "paiement"], ["payments", "paiements"],
  ["money", "argent"], ["mobile", "mobile"], ["data", "données"], ["market", "marché"],
  ["construction", "construction"], ["company", "entreprise"], ["country", "pays"], ["countries", "pays"],
  ["social", "social"], ["security", "sécurité"], ["retirement", "retraite"], ["pension", "retraite"],
  ["savings", "épargne"], ["saving", "épargne"], ["debt", "dette"], ["cash", "trésorerie"],
  ["flow", "flux"], ["exchange", "change"], ["currency", "devise"], ["remittance", "transfert d’argent"],
  ["freelance", "indépendant"], ["freelancer", "indépendant"], ["house", "maison"], ["land", "terrain"],
  ["calculator", "calculateur"], ["estimator", "estimateur"], ["tracker", "suivi"], ["generator", "générateur"],
  ["builder", "créateur"], ["checker", "vérificateur"], ["converter", "convertisseur"], ["planner", "planificateur"],
  ["advisor", "conseiller"], ["guide", "guide"], ["comparison", "comparateur"], ["comparator", "comparateur"],
  ["directory", "annuaire"], ["analyzer", "analyseur"], ["analysis", "analyse"], ["tool", "outil"],
]);

const FRENCH_SUFFIXES = [
  [" Calculator", "Calculateur"], [" Estimator", "Estimateur"], [" Tracker", "Suivi"],
  [" Generator", "Générateur"], [" Builder", "Créateur"], [" Checker", "Vérificateur"],
  [" Converter", "Convertisseur"], [" Planner", "Planificateur"], [" Advisor", "Conseiller"],
  [" Comparison", "Comparateur"], [" Comparator", "Comparateur"], [" Analyzer", "Analyseur"],
];

const FRENCH_ROUTE_NAMES = {
  "afropayroll-os": "Centre de paie AfroPayroll",
  "carbon-credit": "Calculateur de revenus des crédits carbone",
  "car-import-cost": "Calculateur du coût d’importation d’un véhicule",
  "cbk-rates": "Taux de change de la CBK",
  "cnps-guide": "Guide de la CNPS en Côte d’Ivoire",
  "compliance-calendar": "Calendrier de conformité des entreprises",
  "contractor-vs-employee": "Comparateur prestataire ou salarié",
  "creator-brand": "Kit de marque pour créateur",
  "creator-canvas": "Canevas de projet pour créateur",
  "creator-carousel": "Créateur de carrousel",
  "creator-clip": "Découpe de vidéo pour créateur",
  "creator-club": "Club des créateurs",
  "creator-course": "Cours pour créateurs",
  "creator-desk": "Bureau du créateur",
  "creator-hooks": "Accroches de contenu pour créateur",
  "creator-kit": "Kit média pour créateur",
  "creator-mail": "Courriels pour créateur",
  "creator-mind": "Idées de contenu pour créateur",
  "creator-money": "Revenus du créateur",
  "creator-polish": "Amélioration de contenu pour créateur",
  "creator-pricing": "Tarification pour créateur",
  "creator-record": "Enregistrement pour créateur",
  "creator-repurpose": "Réutilisation de contenu pour créateur",
  "creator-research": "Recherche de contenu pour créateur",
  "creator-resize": "Redimensionnement pour créateur",
  "creator-schedule": "Planning du créateur",
  "creator-scripts": "Scripts vidéo pour créateur",
  "creator-split": "Répartition des revenus entre créateurs",
  "creator-stock": "Médiathèque pour créateur",
  "creator-team": "Équipe du créateur",
  "creator-thumb": "Miniature pour créateur",
  "creator-titles": "Titres de contenu pour créateur",
  "creator-voice": "Voix de marque du créateur",
  "domestic-worker": "Calculateur de salaire d’un employé de maison",
  "employee-cost": "Calculateur du coût d’un salarié",
  "etims-guide": "Guide d’eTIMS de la KRA",
  "flood-risk": "Évaluation du risque d’inondation",
  "freelancer-rate": "Calculateur de tarif indépendant",
  "gas-lpg-cost": "Calculateur du coût du gaz GPL",
  "generator-fuel": "Calculateur de carburant pour groupe électrogène",
  "immigration-points": "Calculateur de points d’immigration",
  "itax-guide": "Guide d’iTax de la KRA",
  "lobola-calculator": "Calculateur de lobola",
  "outage-cost": "Estimateur du coût des coupures de courant",
  "quality-sampling": "Calculateur d’échantillonnage qualité",
  "regulatory-alerts": "Suivi des alertes réglementaires",
  "retrenchment-calculator": "Calculateur d’indemnité de licenciement",
  "road-construction-cost": "Estimateur du coût de construction routière",
  "route-cost": "Calculateur du coût d’un trajet",
  "safari-cost": "Calculateur du coût d’un safari",
  "sars-efiling": "Guide de SARS eFiling",
  "security-emergency-fund": "Fonds d’urgence et de sécurité",
  "self-publishing-royalty": "Calculateur de droits d’autoédition",
  "shareholder-agreement": "Générateur de pacte d’actionnaires",
  "shipping-weight": "Calculateur de poids d’expédition",
  "side-hustle-ranker": "Classement d’activités complémentaires",
  "site-clearing": "Estimateur du coût de préparation d’un terrain",
  "work-permit-cost": "Estimateur du coût d’un permis de travail",
};

const FRENCH_COUNTRIES = {
  algeria: "Algérie", angola: "Angola", benin: "Bénin", botswana: "Botswana",
  "burkina-faso": "Burkina Faso", burundi: "Burundi", "cabo-verde": "Cap-Vert", "cape-verde": "Cap-Vert",
  cameroon: "Cameroun", "central-african-republic": "République centrafricaine", chad: "Tchad", comoros: "Comores",
  "congo-brazzaville": "Congo-Brazzaville", "republic-of-congo": "Congo-Brazzaville", "cote-d-ivoire": "Côte d’Ivoire",
  "cote-divoire": "Côte d’Ivoire", djibouti: "Djibouti", "dr-congo": "RDC", egypt: "Égypte",
  "equatorial-guinea": "Guinée équatoriale", eritrea: "Érythrée", eswatini: "Eswatini", ethiopia: "Éthiopie",
  gabon: "Gabon", gambia: "Gambie", ghana: "Ghana", guinea: "Guinée", "guinea-bissau": "Guinée-Bissau",
  kenya: "Kenya", lesotho: "Lesotho", liberia: "Libéria", libya: "Libye", madagascar: "Madagascar",
  malawi: "Malawi", mali: "Mali", mauritania: "Mauritanie", mauritius: "Maurice", morocco: "Maroc",
  mozambique: "Mozambique", namibia: "Namibie", niger: "Niger", nigeria: "Nigéria", rwanda: "Rwanda",
  "sao-tome": "Sao Tomé-et-Principe", "sao-tome-and-principe": "Sao Tomé-et-Principe", senegal: "Sénégal",
  seychelles: "Seychelles", "sierra-leone": "Sierra Leone", somalia: "Somalie", "south-africa": "Afrique du Sud",
  "south-sudan": "Soudan du Sud", sudan: "Soudan", tanzania: "Tanzanie", togo: "Togo", tunisia: "Tunisie",
  uganda: "Ouganda", zambia: "Zambie", zimbabwe: "Zimbabwe",
};

const FRENCH_EXACT_ROUTE_NAMES = {
  "afrokitchen/recipes/banku-tilapia-gh": "Recette de banku et tilapia du Ghana",
  "afrostream/university/brand-deals": "Tarifer un partenariat de marque",
  "afrostream/university/monetization": "Monétisation pour créateurs africains",
  "afrostream/university/setup": "Installation de streaming à petit budget",
};

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function writeAtomic(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp-${process.pid}`;
  unlinkSyncWithRetry(temp);
  writeFileSyncWithRetry(temp, value, "utf8");
  if (fs.existsSync(file)) unlinkSyncWithRetry(file);
  renameSyncWithRetry(temp, file);
}

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function translateFrenchWords(value) {
  return String(value).replace(/[A-Za-z]+/g, (word) => FRENCH_WORDS.get(word.toLowerCase()) || word);
}

function frenchName(original) {
  for (const [suffix, prefix] of FRENCH_SUFFIXES) {
    if (original.endsWith(suffix)) {
      const base = original.slice(0, -suffix.length).trim();
      return `${prefix} ${translateFrenchWords(base)}`.replace(/\s+/g, " ").trim();
    }
  }
  return translateFrenchWords(original).replace(/\s+/g, " ").trim();
}

function frenchNameForRoute(enSlug, original) {
  if (FRENCH_EXACT_ROUTE_NAMES[enSlug]) return FRENCH_EXACT_ROUTE_NAMES[enSlug];
  const parts = enSlug.split("/");
  const base = FRENCH_ROUTE_NAMES[parts[0]];
  if (!base) return frenchName(original);
  const country = FRENCH_COUNTRIES[parts.at(-1)];
  return country && parts.length > 1 ? `${base} — ${country}` : base;
}

function parseDocumentedSwahiliGaps() {
  const source = fs.readFileSync(path.join(ROOT, "docs", "swahili-completeness-goal.md"), "utf8");
  const marker = "## Missing tools list";
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Missing ${marker} in docs/swahili-completeness-goal.md`);
  return [...source.slice(start).matchAll(/^\s*-\s+tools\/([^\s]+)\s*$/gm)].map((match) => match[1]);
}

function buildFrenchWave() {
  const directory = readJson("data/tool-directory.json");
  const ledger = readJson("reports/french-localization-ledger.json");
  const missing = new Set(ledger.findings.englishSourcesWithoutMappedFrenchRoute);
  const bySource = new Map();

  for (const record of directory) {
    const match = String(record.url || "").match(/^\/tools\/(.+)\/$/);
    if (!match) continue;
    const enSlug = match[1];
    const source = `tools/${enSlug}`;
    if (!missing.has(source) || !fs.existsSync(path.join(ROOT, source, "index.html"))) continue;
    const current = bySource.get(source);
    if (!current || Number(record.priority || 0) > Number(current.priority || 0)) bySource.set(source, record);
  }

  const indexGaps = [...missing].filter((source) => (
    source.startsWith("tools/") && fs.existsSync(path.join(ROOT, source, "index.html"))
  ));
  const candidates = indexGaps.map((source) => {
    const indexed = bySource.get(source);
    if (indexed) return { source, enSlug: source.slice(6), record: indexed, directoryRanked: true };

    const html = fs.readFileSync(path.join(ROOT, source, "index.html"), "utf8");
    const rawTitle = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || source.split("/").at(-1);
    const name = rawTitle
      .replace(/<[^>]+>/g, " ")
      .replace(/\s*[|—-]\s*AfroTools.*$/i, "")
      .replace(/\s+/g, " ")
      .trim();
    const financeSignal = /(?:salary|paye|tax|vat|finance|loan|mortgage|bank|fee|rate|insurance|money|cost|price|budget|profit|income|payroll|pension)/i.test(`${source} ${name}`);
    return {
      source,
      enSlug: source.slice(6),
      directoryRanked: false,
      record: {
        name,
        category_key: financeSignal ? "financial" : "other",
        category: financeSignal ? "Finance, Tax & Market Data" : "Unranked tool route",
        priority: 0,
      },
    };
  });
  candidates.sort((a, b) => {
    const aFinance = a.record.category_key === "financial" || /finance|tax|market/i.test(a.record.category || "") ? 1 : 0;
    const bFinance = b.record.category_key === "financial" || /finance|tax|market/i.test(b.record.category || "") ? 1 : 0;
    return bFinance - aFinance || Number(b.record.priority || 0) - Number(a.record.priority || 0) || Number(b.directoryRanked) - Number(a.directoryRanked) || a.source.localeCompare(b.source);
  });

  if (candidates.length < 300) throw new Error(`Only ${candidates.length} current French tool gaps are ranked in data/tool-directory.json`);

  const existingSlugs = new Set(
    ledger.routes
      .map((route) => String(route.route || "").match(/^\/fr\/tools\/([^/]+)$/))
      .filter(Boolean)
      .map((match) => match[1])
  );

  return candidates.slice(0, 300).map(({ enSlug, record }) => {
    const name = frenchNameForRoute(enSlug, record.name || enSlug.replace(/[-/]+/g, " "));
    let frSlug = slugify(name) || slugify(enSlug.replace(/\//g, "-"));
    if (existingSlugs.has(frSlug)) frSlug = `${frSlug}-${slugify(enSlug.replace(/\//g, "-"))}`;
    let suffix = 2;
    while (existingSlugs.has(frSlug)) frSlug = `${slugify(name)}-${suffix++}`;
    existingSlugs.add(frSlug);
    return {
      enSlug,
      frSlug,
      name,
      originalName: record.name,
      description: `Préparez vos informations, puis utilisez l’outil « ${name} » et vérifiez les hypothèses adaptées à votre pays.`,
      category: record.category_key || "other",
      priority: Number(record.priority || 0),
    };
  });
}

function buildSwahiliWave() {
  const documented = parseDocumentedSwahiliGaps().slice(0, 100);
  if (documented.length !== 100) throw new Error(`Expected 100 documented Swahili gaps, found ${documented.length}`);
  const directory = readJson("data/tool-directory.json");
  const bySlug = new Map(directory.map((record) => [String(record.url || "").replace(/^\/tools\/|\/$/g, ""), record]));
  const seenRoutes = new Set();

  return documented.map((enSlug) => {
    const copy = SWAHILI_COPY[enSlug];
    if (!copy) throw new Error(`Missing reviewed Swahili copy for ${enSlug}`);
    const [swSlug, name] = copy;
    if (seenRoutes.has(swSlug)) throw new Error(`Duplicate Swahili wave slug: ${swSlug}`);
    seenRoutes.add(swSlug);
    const record = bySlug.get(enSlug) || {};
    const output = path.join(ROOT, "sw", "zana", swSlug, "index.html");
    return {
      enSlug,
      swSlug,
      name,
      originalName: record.name || enSlug,
      description: `Tumia ukurasa huu kuandaa taarifa za ${name.toLocaleLowerCase("sw")}, kisha fungua zana kamili na uhakiki makisio yanayofaa nchi yako.`,
      category: record.category_key || "other",
      priority: Number(record.priority || 0),
      reuseExisting: fs.existsSync(output),
    };
  });
}

function validateManifest(manifest) {
  if (!manifest || manifest.schemaVersion !== "1.0.0") throw new Error("Unexpected localization wave schema");
  if (!Array.isArray(manifest.french) || manifest.french.length !== 300) throw new Error("French wave must contain exactly 300 reviewed routes");
  if (!Array.isArray(manifest.swahili) || manifest.swahili.length !== 100) throw new Error("Swahili wave must contain exactly 100 reviewed routes");
  for (const entry of [...manifest.french, ...manifest.swahili]) {
    if (!fs.existsSync(path.join(ROOT, "tools", entry.enSlug, "index.html"))) throw new Error(`Missing English source tools/${entry.enSlug}/index.html`);
  }
  const firstHundred = parseDocumentedSwahiliGaps().slice(0, 100);
  if (manifest.swahili.some((entry, index) => entry.enSlug !== firstHundred[index])) throw new Error("Swahili wave no longer matches the first 100 documented gaps");
}

function refreshDerivedCopy(manifest) {
  manifest.french = manifest.french.map((entry) => ({
    ...entry,
    description: `Préparez vos informations, puis utilisez l’outil « ${entry.name} » et vérifiez les hypothèses adaptées à votre pays.`,
  }));
  return manifest;
}

function main() {
  let manifest;
  if (fs.existsSync(OUTPUT) && !REFRESH) {
    manifest = JSON.parse(fs.readFileSync(OUTPUT, "utf8"));
  } else {
    manifest = {
      schemaVersion: "1.0.0",
      waveId: "2026-07-fr-sw-coverage-1",
      generatedFrom: [
        "data/tool-directory.json",
        "reports/french-localization-ledger.json",
        "docs/swahili-completeness-goal.md",
      ],
      selectionPolicy: {
        french: "Current unmapped tools/**/index.html routes; finance/tax category first, then descending tool-directory priority and source route.",
        swahili: "First 100 English slugs in the documented missing-tools list, preserving document order.",
      },
      french: buildFrenchWave(),
      swahili: buildSwahiliWave(),
    };
  }

  manifest = refreshDerivedCopy(manifest);
  validateManifest(manifest);
  writeAtomic(OUTPUT, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Localization wave ready: ${manifest.french.length} French routes and ${manifest.swahili.length} Swahili routes.`);
  console.log(`Swahili range: ${manifest.swahili[0].enSlug} -> ${manifest.swahili.at(-1).enSlug}`);
}

main();

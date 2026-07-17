"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SITE = "https://afrotools.com";
const LEDGER = path.join(ROOT, "reports", "french-localization-ledger.json");

const TARGET_GROUPS = new Set([
  "assurance-auto",
  "assurance-obseques",
  "assurance-vie",
  "comparateur-assurance-sante",
  "compteur-prepaye",
  "contrat-bail",
  "contrat-travail",
  "plan-affaires",
  "roi-solaire",
  "suivi-carburant",
  "tarifs-electricite",
]);

const TEXT_REPLACEMENTS = [
  ["Home", "Accueil"],
  ["Insurance", "Assurance"],
  ["Legal & Compliance", "Droit et conformite"],
  ["Legal &amp; Compliance", "Droit et conformite"],
  ["Energy & Utilities", "Energie et services"],
  ["Energy &amp; Utilities", "Energie et services"],
  ["Calculate Estimate", "Calculer l'estimation"],
  ["Calculate", "Calculer"],
  ["Commercial (Business)", "Commercial (entreprise)"],
  ["Selected country", "Pays selectionne"],
  ["Country", "Pays"],
  ["South Africa", "Afrique du Sud"],
  ["Pan-African", "Panafricain"],
  ["Below calculator intro sponsor slot", "Emplacement sponsor sous l'introduction"],
  ["After results sponsor slot", "Emplacement sponsor apres les resultats"],
  ["Country content mid-page sponsor slot", "Emplacement sponsor dans le contenu pays"],
  ["Copy Brief", "Copier le brief"],
  ["Save", "Enregistrer"],
  ["Share", "Partager"],
  ["Business Plan Builder App", "Application generateur de plan d'affaires"],
  ["Business plan builder workspace", "Espace generateur de plan d'affaires"],
  ["Business plan sections", "Sections du plan d'affaires"],
  ["Plan workspace", "Espace de plan"],
  [
    "Country Nigeria Kenya Ghana South Africa Tanzania Uganda Rwanda Ethiopia Egypt Morocco Senegal Cameroon Pan-African",
    "Pays Nigeria Kenya Ghana Afrique du Sud Tanzanie Ouganda Rwanda Ethiopie Egypte Maroc Senegal Cameroun Panafricain",
  ],

  ["Car Insurance Calculator", "Calculateur d'assurance auto"],
  ["Car Insurance Premium Estimator", "Estimateur de prime d'assurance auto"],
  ["Car Assurance Calculator", "Calculateur assurance auto"],
  ["Car Assurance Premium Estimator", "Estimateur de prime assurance auto"],
  ["Estimate Your Premium", "Estimez votre prime"],
  ["Vehicle Value", "Valeur du vehicule"],
  ["Vehicle Age (years)", "Age du vehicule (annees)"],
  ["Vehicle Type", "Type de vehicule"],
  ["Driver Age", "Age du conducteur"],
  ["Years Licensed", "Annees avec permis"],
  ["Claims in Last 3 Years", "Sinistres sur les 3 dernieres annees"],
  ["Estimated Annual Premium Range", "Fourchette de prime annuelle estimee"],
  ["Comprehensive cover", "Couverture tous risques"],
  ["Cover Type", "Type de couverture"],
  ["Estimated Range", "Fourchette estimee"],
  ["Third-Party (mandatory)", "Tiers obligatoire"],
  ["Comprehensive", "Tous risques"],
  ["Typical Excess", "Franchise typique"],
  ["Top Providers", "Principaux assureurs"],

  ["Funeral Insurance Calculator", "Calculateur assurance obseques"],
  ["Funeral / Burial Insurance Calculator", "Calculateur assurance obseques et funerailles"],
  ["Funeral Assurance Calculator", "Calculateur assurance obseques"],
  ["Funeral / Burial Assurance Calculator", "Calculateur assurance obseques et funerailles"],
  ["Cover & Costs", "Garanties et couts"],
  ["Cover &amp; Costs", "Garanties et couts"],
  ["Life Insurance Calculator", "Calculateur assurance vie"],
  ["Life Insurance Needs Calculator", "Calculateur besoins assurance vie"],
  ["Life Assurance Calculator", "Calculateur assurance vie"],
  ["Life Assurance Needs Calculator", "Calculateur besoins assurance vie"],
  ["How Much Do You Need?", "De quelle couverture avez-vous besoin ?"],
  ["Estimated Funeral Cost", "Cout funeraire estime"],
  ["Assurance Maladie Comparison", "Comparateur assurance maladie"],
  ["Health Insurance Comparison", "Comparateur assurance maladie"],
  ["Compare Plans", "Comparer les offres"],

  ["Employment Contract Builder", "Generateur de contrat de travail"],
  ["Start Date", "Date de debut"],
  ["Gross Monthly Salary", "Salaire mensuel brut"],
  ["13th month salary", "13e mois"],
  ["Download as Text", "Telecharger en texte"],
  ["Salary", "Salaire"],
  ["Labour Act", "Loi du travail"],
  ["Tax Administration Act", "Loi sur l'administration fiscale"],
  ["Employee Compensation Act", "Loi sur l'indemnisation des employes"],

  ["Tenancy Agreement Generator", "Generateur de contrat de bail"],
  ["Landlord and Tenant (Business Premises) Act", "Loi proprietaire-locataire (locaux commerciaux)"],
  ["Lease Start Date", "Date de debut du bail"],

  ["Electricity Tariff Calculator", "Calculateur de tarifs electricite"],
  ["Prepaid Meter Unit Calculator", "Calculateur d'unites compteur prepaye"],
  ["Prepaid Meter Calculator", "Calculateur compteur prepaye"],
  ["Solar Panel ROI Calculator", "Calculateur ROI solaire"],
  ["Payback, Battery & Generator Savings", "retour, batterie et economies generateur"],
  ["Payback, Battery &amp; Generator Savings", "retour, batterie et economies generateur"],

  ["Monthly Units Used", "Unites mensuelles utilisees"],
  ["Customer Type", "Type de client"],
  ["Residential (Home)", "Residentiel (maison)"],
  ["Industrial", "Industriel"],
  ["Monthly Bill", "Facture mensuelle"],
  ["Daily", "Journalier"],
  ["Monthly", "Mensuel"],
  ["Annual", "Annuel"],
  ["Estimated Bill", "Facture estimee"],
  ["Avg Rate (per kWh)", "Tarif moyen (par kWh)"],
  ["Calculation Notes", "Notes de calcul"],

  ["What is the petrol price in", "Quel est le prix de l'essence en"],
  ["What is the diesel price in", "Quel est le prix du diesel en"],
  ["How much does a 5 KVA generator cost to run in", "Combien coute l'utilisation d'un generateur 5 kVA en"],
  ["Can I compare", "Puis-je comparer"],
  ["with another African country?", "avec un autre pays africain ?"],
  ["fuel price summary", "resume des prix carburant"],
];

function readLedger() {
  return JSON.parse(fs.readFileSync(LEDGER, "utf8"));
}

function siteHref(route, file) {
  let clean = String(route || "").replace(/^\/+/, "");
  if (!clean) return `${SITE}/`;
  let suffix = "";
  if (file && file.endsWith(path.join("index.html"))) suffix = "/";
  return `${SITE}/${clean}${suffix}`;
}

function ensureAlternate(html, lang, href) {
  const existing = new RegExp(`<link\\s+rel=["']alternate["'][^>]*hreflang=["']${lang}["'][^>]*>`, "i");
  if (existing.test(html)) return html;
  const line = `<link rel="alternate" hreflang="${lang}" href="${href}" />`;
  const xDefault = /<link\s+rel=["']alternate["'][^>]*hreflang=["']x-default["'][^>]*>\s*/i;
  if (xDefault.test(html)) {
    return html.replace(xDefault, `${line}\n$&`);
  }
  const enAlt = /<link\s+rel=["']alternate["'][^>]*hreflang=["']en["'][^>]*>\s*/i;
  if (enAlt.test(html)) {
    return html.replace(enAlt, `$&${line}\n`);
  }
  const canonical = /<link\s+rel=["']canonical["'][^>]*>\s*/i;
  if (canonical.test(html)) {
    return html.replace(canonical, `$&${line}\n`);
  }
  return html.replace(/<\/head>/i, `${line}\n</head>`);
}

function patchHreflang(ledger) {
  const routeByPath = new Map(ledger.routes.map((route) => [route.route, route]));
  const candidates = new Map();
  let updated = 0;
  for (const finding of ledger.findings.missingReciprocalHreflang || []) {
    if (!finding.source.startsWith("/fr/tools/")) continue;
    const group = finding.source.split("/")[3];
    if (!TARGET_GROUPS.has(group)) continue;

    const route = routeByPath.get(finding.source);
    if (!route) continue;
    candidates.set(finding.targetFile, {
      enRoute: finding.target,
      enFile: finding.targetFile,
      frRoute: route.route,
      frFile: route.file,
    });
  }

  for (const route of ledger.routes || []) {
    if (!route.route.startsWith("/fr/tools/")) continue;
    const group = route.route.split("/")[3];
    if (!TARGET_GROUPS.has(group) || !route.englishSource) continue;
    const enRoute = `/${route.englishSource}`;
    const enFile = englishSourceToFile(route.englishSource);
    if (!enFile) continue;
    candidates.set(enFile, {
      enRoute,
      enFile,
      frRoute: route.route,
      frFile: route.file,
    });
  }

  for (const candidate of candidates.values()) {
    const target = path.join(ROOT, candidate.enFile);
    if (!fs.existsSync(target)) continue;

    const before = fs.readFileSync(target, "utf8");
    let after = before;
    const enHref = siteHref(candidate.enRoute, candidate.enFile);
    after = ensureAlternate(after, "en", enHref);
    after = ensureAlternate(after, "fr", siteHref(candidate.frRoute, candidate.frFile));
    after = ensureAlternate(after, "x-default", enHref);
    if (after !== before) {
      fs.writeFileSync(target, after, "utf8");
      updated += 1;
    }
  }
  return updated;
}

function englishSourceToFile(source) {
  const clean = String(source || "").replace(/^\/+|\/+$/g, "");
  if (!clean) return "index.html";
  const indexFile = path.join(clean, "index.html");
  if (fs.existsSync(path.join(ROOT, indexFile))) return indexFile;
  const htmlFile = `${clean}.html`;
  if (fs.existsSync(path.join(ROOT, htmlFile))) return htmlFile;
  return null;
}

function applyTextReplacements(html) {
  let next = html;
  for (const [from, to] of TEXT_REPLACEMENTS) {
    next = next.split(from).join(to);
  }
  next = next.replace(/\b([A-Za-z .'-]+) Electricity Tariff Calculator\b/g, "$1 - Calculateur de tarifs electricite");
  next = next.replace(/\b([A-Za-z .'-]+) Prepaid Meter Calculator\b/g, "$1 - Calculateur compteur prepaye");
  next = next.replace(/\b([A-Za-z .'-]+) Prepaid Meter Unit Calculator\b/g, "$1 - Calculateur d'unites compteur prepaye");
  next = next.replace(/\b([A-Za-z .'-]+) Car Insurance Premium Estimator\b/g, "$1 - Estimateur de prime d'assurance auto");
  next = next.replace(/\b([A-Za-z .'-]+) Car Insurance Calculator\b/g, "$1 - Calculateur d'assurance auto");
  next = next.replace(/\b([A-Za-z .'-]+) Funeral \/ Burial Insurance Calculator\b/g, "$1 - Calculateur assurance obseques et funerailles");
  next = next.replace(/\b([A-Za-z .'-]+) Funeral Insurance Calculator\b/g, "$1 - Calculateur assurance obseques");
  next = next.replace(/\b([A-Za-z .'-]+) Life Insurance Needs Calculator\b/g, "$1 - Calculateur besoins assurance vie");
  next = next.replace(/\b([A-Za-z .'-]+) Life Insurance Calculator\b/g, "$1 - Calculateur assurance vie");
  next = next.replace(/\b([A-Za-z .'-]+) Employment Contract Builder\b/g, "$1 - Generateur de contrat de travail");
  next = next.replace(/\b([A-Za-z .'-]+) Tenancy Agreement Generator\b/g, "$1 - Generateur de contrat de bail");
  next = next.replace(/\b([A-Za-z .'-]+) Solar Panel ROI Calculator\b/g, "$1 - Calculateur ROI solaire");
  return next;
}

function patchFrenchText(ledger) {
  const files = new Set();
  for (const finding of ledger.findings.frenchPagesWithEnglishTitleH1OrUILabels || []) {
    if (!finding.route.startsWith("/fr/tools/")) continue;
    const group = finding.route.split("/")[3];
    if (!TARGET_GROUPS.has(group)) continue;
    files.add(finding.file);
  }

  let updated = 0;
  for (const relFile of files) {
    const file = path.join(ROOT, relFile);
    if (!fs.existsSync(file)) continue;
    const before = fs.readFileSync(file, "utf8");
    const after = applyTextReplacements(before);
    if (after !== before) {
      fs.writeFileSync(file, after, "utf8");
      updated += 1;
    }
  }
  return updated;
}

function main() {
  const ledger = readLedger();
  const hreflangFilesUpdated = patchHreflang(ledger);
  const frenchFilesUpdated = patchFrenchText(ledger);
  console.log(`Updated ${hreflangFilesUpdated} English reciprocal hreflang files.`);
  console.log(`Updated ${frenchFilesUpdated} French generated tool-country files.`);
}

if (require.main === module) {
  main();
}

module.exports = { applyTextReplacements, ensureAlternate };

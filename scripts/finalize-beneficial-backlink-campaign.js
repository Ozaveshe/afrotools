const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DISCOVERY = path.join(ROOT, "reports", "backlinks", "campaign-200-beneficial-2026-07-14.discovery.json");
const OUTPUT = path.join(ROOT, "reports", "backlinks", "campaign-200-beneficial-2026-07-14.csv");
const COUNTRIES = ["Ghana", "South Africa", "Tanzania", "Cote d'Ivoire", "Cameroon", "Uganda", "Rwanda", "Zambia", "Botswana", "Morocco"];
const TWO_LEVEL = new Set(["co.za", "org.za", "gov.za", "ac.za", "com.gh", "org.gh", "gov.gh", "edu.gh", "co.tz", "or.tz", "go.tz", "ac.tz", "co.ug", "or.ug", "go.ug", "ac.ug", "co.rw", "org.rw", "gov.rw", "co.zm", "org.zm", "gov.zm", "co.bw", "org.bw", "gov.bw"]);
const EXCLUDED_DOMAINS = new Set([
  "tourtravelworld.com", "alliancerecruitmentagency.com", "greatyop.com", "revenus-sur-internet-sans-visage.com",
  "scribd.com", "linkedin.com", "medium.com", "researchgate.net", "zenodo.org", "salesforce.com", "remote.com",
  "deel.com", "globalization-partners.com", "papayaglobal.com", "supportyourapp.com", "yourstore.com"
]);

function rootHost(host) {
  const parts = String(host || "").toLowerCase().replace(/^www\./, "").split(".").filter(Boolean);
  if (parts.length <= 2) return parts.join(".");
  const suffix = parts.slice(-2).join(".");
  return TWO_LEVEL.has(suffix) ? parts.slice(-3).join(".") : suffix;
}

function excludedHost(host) {
  const normalized = String(host || "").toLowerCase().replace(/^www\./, "");
  return Array.from(EXCLUDED_DOMAINS).some((blocked) => normalized === blocked || normalized.endsWith(`.${blocked}`));
}

function validRoute(row) {
  const route = String(row.contact_route || "").trim();
  if (row.channel === "email") {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(route)) return false;
    if (/example|domain\.com|yourstore|host-h\.net|\.(png|jpe?g|gif|svg|webp)$/i.test(route)) return false;
    const emailHost = route.split("@").pop().toLowerCase();
    const webmail = /^(gmail|outlook|hotmail|yahoo)\./.test(emailHost);
    return webmail || rootHost(emailHost) === rootHost(row.domain);
  }
  if (!/^https?:\/\//i.test(route) || /remove:yes|\/resources\/?$|\/partners\/?$/i.test(route)) return false;
  return /contact|nous-contacter|contactez|wasiliana|mawasiliano|partner|submit|write/i.test(route);
}

function brandFromDomain(domain) {
  const root = rootHost(domain).split(".")[0];
  return root.split(/[-_]/).filter(Boolean).map((part) => part.length <= 4 ? part.toUpperCase() : part[0].toUpperCase() + part.slice(1)).join(" ");
}

function cleanBrand(row) {
  const value = String(row.prospect || "").replace(/&#\d+;|&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
  if (!value || value.length > 58 || /^(home|home page|accueil|about us|our team|entrepreneurship|career openings?|related links|job application)$/i.test(value)) return brandFromDomain(row.domain);
  return value.replace(/\s*::\s*Home$/i, "").trim();
}

function fixedAsset(row) {
  return String(row.target_asset || "")
    .replace("/tools/budget-50-30-20/", "/tools/50-30-20-budget/")
    .replace("/creator/", "/tools/creator-pricing/")
    .replace("/tools/freelancer-rate/zambia/", "/tools/freelancer-rate/");
}

function subject(row, brand) {
  if (row.language === "French") return `Ressource gratuite pour ${brand}`.slice(0, 100);
  if (row.language === "Swahili") return `Zana ya bure kwa ${brand}`.slice(0, 100);
  const label = row.theme === "sme" || row.theme === "business" || row.theme === "youth" || row.theme === "women" ? "business planning" : row.theme;
  return `Free ${label} tool for ${brand}`.slice(0, 100);
}

function body(row, brand, asset) {
  if (row.language === "French") return `Bonjour,\n\nJ'ai découvert ${brand} en recherchant des ressources utiles pour les entrepreneurs et les jeunes en ${row.country}. AfroTools propose une ressource gratuite, conçue pour les réalités africaines, qui pourrait compléter vos contenus :\n\n${asset}\n\nPourriez-vous l'évaluer comme ressource pratique pour vos lecteurs ou membres ? Je peux également fournir une courte description en français.\n\nMerci,\nAfroTools\nhello@afrotools.com\n\nSi ce message n'est pas pertinent, répondez simplement « non » et je ne relancerai pas.`;
  if (row.language === "Swahili") return `Habari,\n\nNimepata ${brand} nilipokuwa nikitafuta rasilimali muhimu kwa wajasiriamali na vijana wa Tanzania. AfroTools ina zana ya bure iliyoundwa kwa matumizi ya Afrika ambayo inaweza kuwasaidia wasomaji au wanachama wenu:\n\n${asset}\n\nJe, mnaweza kuipitia kama rasilimali ya ziada? Ninaweza pia kutuma maelezo mafupi kwa Kiswahili.\n\nAsante,\nAfroTools\nhello@afrotools.com\n\nIkiwa haifai, jibu “hapana” na sitatuma ujumbe mwingine.`;
  return `Hi ${brand} team,\n\nI found your work while researching useful ${row.theme} resources for people in ${row.country}. AfroTools has a free, Africa-focused tool that could be a practical companion for your readers or members:\n\n${asset}\n\nWould you consider reviewing it for a relevant guide or resources page? I can provide a short description or embed option if helpful.\n\nBest,\nAfroTools\nhello@afrotools.com\n\nIf this is not relevant, reply “no” and I will not follow up.`;
}

function csvEscape(value) {
  const text = String(value == null ? "" : value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const report = JSON.parse(fs.readFileSync(DISCOVERY, "utf8"));
const candidates = report.candidates
  .filter((row) => Number(row.quality_score || 0) >= 66 && !excludedHost(row.domain) && validRoute(row))
  .map((row) => {
    const prospect = cleanBrand(row);
    const target_asset = fixedAsset(row);
    return { ...row, prospect, target_asset, subject: subject(row, prospect), body: body(row, prospect, target_asset), status: "qualified_not_submitted" };
  })
  .sort((a, b) => Number(b.quality_score) - Number(a.quality_score) || a.domain.localeCompare(b.domain));

const byCountry = new Map(COUNTRIES.map((country) => [country, candidates.filter((row) => row.country === country)]));
const selected = [];
const domains = new Set();
for (let position = 0; position < 30 && selected.length < 200; position += 1) {
  for (const country of COUNTRIES) {
    const row = (byCountry.get(country) || [])[position];
    if (!row || domains.has(row.domain)) continue;
    domains.add(row.domain);
    selected.push(row);
    if (selected.length >= 200) break;
  }
}
for (const row of candidates) {
  if (selected.length >= 200) break;
  if (domains.has(row.domain)) continue;
  domains.add(row.domain);
  selected.push(row);
}

const headers = ["number", "country", "language", "prospect", "domain", "source_url", "target_asset", "angle", "contact_route", "channel", "subject", "body", "status", "proof", "quality_score", "theme"];
const csv = [headers.join(","), ...selected.map((row, index) => headers.map((header) => csvEscape(header === "number" ? index + 1 : row[header])).join(","))].join("\n") + "\n";
fs.writeFileSync(OUTPUT, csv, "utf8");
console.log(JSON.stringify({ selected: selected.length, available_after_strict_filter: candidates.length, country_counts: Object.fromEntries(COUNTRIES.map((country) => [country, selected.filter((row) => row.country === country).length])), channel_counts: { email: selected.filter((row) => row.channel === "email").length, contact_form: selected.filter((row) => row.channel === "contact_form").length } }, null, 2));
if (selected.length < 200) process.exitCode = 2;

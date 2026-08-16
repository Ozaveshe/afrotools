#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const { writeFileSyncWithRetry } = require("./lib/safe-write");

const ROOT = path.resolve(__dirname, "..");
const COUNTRIES = require("../data/registry/countries.json");
const WRITE = process.argv.includes("--write");
const CHECK = process.argv.includes("--check");

const COUNTRY_ALIASES = {
  "cabo-verde": "cape-verde",
  "congo-brazzaville": "congo",
  "cote-d-ivoire": "cote-divoire",
  "sao-tome-and-principe": "sao-tome"
};

const COUNTRY_BY_SLUG = new Map(COUNTRIES.map((country) => [country.routeSlug, country]));

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function countryForSlug(slug) {
  const canonicalSlug = COUNTRY_ALIASES[slug] || slug;
  const country = COUNTRY_BY_SLUG.get(canonicalSlug);
  if (!country) throw new Error(`No country registry row for ${slug}.`);
  return country;
}

function elementText(html, tagName) {
  const match = html.match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? match[1] : "";
}

function setElementText(html, tagName, value) {
  const pattern = new RegExp(`(<${tagName}\\b[^>]*>)[\\s\\S]*?(<\\/${tagName}>)`, "i");
  if (!pattern.test(html)) throw new Error(`Missing <${tagName}>.`);
  return html.replace(pattern, `$1${escapeHtml(value)}$2`);
}

function tagAttribute(tag, name) {
  const match = String(tag).match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i"));
  return match ? match[2] : "";
}

function setTagContentAttribute(tag, value) {
  const pattern = /\bcontent\s*=\s*(["'])([\s\S]*?)\1/i;
  if (!pattern.test(tag)) throw new Error(`Metadata tag has no content attribute: ${tag}`);
  return tag.replace(pattern, (_, quote) => `content=${quote}${escapeHtml(value)}${quote}`);
}

function setMeta(html, selectorName, selectorValue, value) {
  let found = false;
  const next = html.replace(/<meta\b[^>]*>/gi, (tag) => {
    if (tagAttribute(tag, selectorName).toLowerCase() !== selectorValue.toLowerCase()) return tag;
    found = true;
    return setTagContentAttribute(tag, value);
  });
  if (!found) throw new Error(`Missing meta ${selectorName}=${selectorValue}.`);
  return next;
}

function canonicalUrl(html) {
  const tags = html.match(/<link\b[^>]*>/gi) || [];
  for (const tag of tags) {
    if (/\bcanonical\b/i.test(tagAttribute(tag, "rel"))) return tagAttribute(tag, "href");
  }
  throw new Error("Missing canonical URL.");
}

function syncStructuredData(html, metadata) {
  return html.replace(/(<script\b[^>]*type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi, (whole, open, source, close) => {
    let data;
    try {
      data = JSON.parse(source);
    } catch {
      return whole;
    }
    const types = Array.isArray(data["@type"]) ? data["@type"] : [data["@type"]];
    if (types.some((type) => ["WebApplication", "WebPage"].includes(type))) {
      data.name = metadata.schemaName;
      data.description = metadata.description;
      data.url = metadata.canonical;
      data.inLanguage = "fr";
      if (typeof data["@id"] === "string") data["@id"] = metadata.canonical;
      return `${open}${JSON.stringify(data)}${close}`;
    }
    if (types.includes("BreadcrumbList") && Array.isArray(data.itemListElement) && data.itemListElement.length) {
      const lastItem = data.itemListElement[data.itemListElement.length - 1];
      if (lastItem && typeof lastItem === "object") {
        lastItem.name = metadata.breadcrumbName || metadata.schemaName;
        lastItem.item = metadata.canonical;
        return `${open}${JSON.stringify(data)}${close}`;
      }
    }
    return whole;
  });
}

function applyMetadata(html, metadata) {
  let next = setElementText(html, "title", metadata.title);
  next = setElementText(next, "h1", metadata.heading);
  next = setMeta(next, "name", "description", metadata.description);
  next = setMeta(next, "property", "og:title", metadata.title);
  next = setMeta(next, "property", "og:description", metadata.description);
  next = setMeta(next, "name", "twitter:title", metadata.title);
  next = setMeta(next, "name", "twitter:description", metadata.description);
  if (metadata.family === "suivi-carburant") {
    next = next.replace(
      /<p\b[^>]*class=["'][^"']*\bfuel-lede\b[^"']*["'][^>]*>[\s\S]*?<\/p>/i,
      `<p class="fuel-lede">${escapeHtml(metadata.visibleIntro)}</p>`
    );
    next = next.replace(
      /<p\b[^>]*class=["'][^"']*\bfuel-trust\b[^"']*["'][^>]*>[\s\S]*?<\/p>/i,
      `<p class="fuel-trust">${escapeHtml(metadata.visibleTrust)}</p>`
    );
  }
  if (metadata.family === "contrat-bail" || metadata.family === "contrat-travail") {
    next = next.replace(
      /(<section\b[^>]*class=["'][^"']*\bhero\b[^"']*["'][^>]*>[\s\S]*?<\/h1>)\s*<p\b[^>]*>[\s\S]*?<\/p>/i,
      `$1\n<p>${escapeHtml(metadata.visibleIntro)}</p>`
    );
    const sourceRoute = metadata.family === "contrat-bail" ? "tenancy-agreement" : "employment-contract";
    const sourceLabel = metadata.family === "contrat-bail" ? "Contrat de bail" : "Contrat de travail";
    next = next.replace(
      new RegExp(`(<a\\b[^>]*href=["']/fr/tools/${sourceRoute}/["'][^>]*>)[\\s\\S]*?(<\\/a>)`, "i"),
      `$1${sourceLabel}$2`
    );
  }
  if (["assurance-auto", "assurance-obseques", "assurance-vie", "comparateur-assurance-sante"].includes(metadata.family)) {
    next = next.replace(
      /<p\b[^>]*class=["'][^"']*\bins-tool-hero-sub\b[^"']*["'][^>]*>[\s\S]*?<\/p>/i,
      `<p class="ins-tool-hero-sub">${escapeHtml(metadata.visibleIntro)}</p>`
    );
  }
  return syncStructuredData(next, metadata);
}

function fuelMetadata(html, country) {
  const name = country.displayNames.fr;
  const currentDescription = tagAttribute(
    (html.match(/<meta\b[^>]*name=["']description["'][^>]*>/i) || [""])[0],
    "content"
  );
  const values = currentDescription.match(/\b((?:petrol|essence)\s+[\s\S]*?)\.\s*(?:Compare generator fuel costs and African countries|Comparez les coûts du groupe électrogène et les pays africains)\.?$/i)?.[1] || "";
  const localizedValues = values
    .replace(/^petrol\b/i, "essence")
    .replace(/\bLPG\b/g, "GPL");
  if (!localizedValues) throw new Error(`Could not preserve current fuel values for ${country.routeSlug}.`);
  const currency = localizedValues.match(/^essence\s+([A-Z]{3})\b/)?.[1] || "monnaie locale";
  return {
    family: "suivi-carburant",
    title: `Prix du carburant — ${name} | AfroFuel`,
    heading: `Prix du carburant — ${name}`,
    description: `${name} : consultez les prix du carburant disponibles — ${localizedValues}. Comparez les coûts du groupe électrogène et les pays africains.`,
    visibleIntro: `${name} : consultez le relevé disponible des prix de l’essence, du diesel et du GPL en ${currency}. Utilisez-le pour estimer un budget de transport, de groupe électrogène ou de ménage, puis vérifiez le prix local.`,
    visibleTrust: "Relevé de planification disponible · Vérifiez auprès d’une station ou d’un fournisseur local avant tout achat.",
    schemaName: `Prix du carburant — ${name}`,
    canonical: canonicalUrl(html)
  };
}

function legalMetadata(html, country, family) {
  const name = country.displayNames.fr;
  const tenancy = family === "contrat-bail";
  return {
    family,
    title: tenancy
      ? `Contrat de bail — ${name} | AfroTools`
      : `Contrat de travail — ${name} | AfroTools`,
    heading: tenancy
      ? `Générateur de contrat de bail — ${name}`
      : `Générateur de contrat de travail — ${name}`,
    description: tenancy
      ? `${name} : préparez un contrat de bail avec bailleur, locataire, loyer, dépôt, charges et clauses essentielles, puis faites-le vérifier selon le droit local.`
      : `${name} : préparez un contrat de travail avec salaire, congés, préavis et clauses essentielles, puis faites-le vérifier selon le droit local.`,
    visibleIntro: tenancy
      ? `${name} : renseignez les parties, le loyer, le dépôt, les charges et les clauses du bail. Ce modèle sert à préparer un brouillon ; faites-le vérifier selon le droit local avant signature.`
      : `${name} : renseignez le poste, le salaire, les congés, le préavis et les clauses essentielles. Ce modèle sert à préparer un brouillon ; faites-le vérifier selon le droit local avant signature.`,
    schemaName: tenancy ? `Générateur de contrat de bail — ${name}` : `Générateur de contrat de travail — ${name}`,
    canonical: canonicalUrl(html)
  };
}

function insuranceMetadata(html, country, family) {
  const name = country.displayNames.fr;
  const funeral = family === "assurance-obseques";
  const motor = family === "assurance-auto";
  const health = family === "comparateur-assurance-sante";
  if (motor) return {
    family,
    title: `Assurance auto — ${name} | AfroTools`,
    heading: `Estimer une assurance auto — ${name}`,
    description: `${name} : estimez une prime d’assurance auto selon le véhicule, le conducteur et la couverture, puis comparez franchises, exclusions et devis locaux.`,
    visibleIntro: `${name} : préparez une estimation de prime selon le véhicule, le conducteur et la couverture. Comparez ensuite les franchises, exclusions et devis d’assureurs autorisés.`,
    schemaName: `Estimation d’assurance auto — ${name}`,
    breadcrumbName: "Assurance auto",
    canonical: canonicalUrl(html)
  };
  if (health) return {
    family,
    title: `Assurance santé — ${name} | AfroTools`,
    heading: `Comparer l’assurance santé — ${name}`,
    description: `${name} : comparez des scénarios indicatifs de prime, couverture, réseau et exclusions, puis vérifiez les conditions auprès d’un assureur autorisé.`,
    visibleIntro: `${name} : comparez des scénarios indicatifs de prime, de couverture, de réseau et d’exclusions avant de demander des conditions et devis actuels à un assureur autorisé.`,
    schemaName: `Comparaison d’assurance santé — ${name}`,
    breadcrumbName: "Assurance santé",
    canonical: canonicalUrl(html)
  };
  return {
    family,
    title: funeral
      ? `Assurance obsèques — ${name} | AfroTools`
      : `Assurance vie — ${name} : couverture | AfroTools`,
    heading: funeral
      ? `Estimation d’assurance obsèques — ${name}`
      : `Estimation du besoin d’assurance vie — ${name}`,
    description: funeral
      ? `${name} : estimez les frais d’obsèques et une prime indicative selon la couverture, l’âge et les proches à protéger. Vérifiez les conditions de l’assureur.`
      : `${name} : estimez le capital d’assurance vie selon les personnes à charge, les dettes, les études et le revenu à remplacer. Vérifiez les conditions.`,
    visibleIntro: funeral
      ? `${name} : estimez les frais d’obsèques et une fourchette de prime à partir de la couverture, de l’âge et des proches à protéger. Il s’agit d’une estimation de planification ; demandez un devis et vérifiez les conditions de l’assureur.`
      : `${name} : estimez le capital d’assurance vie à prévoir selon les personnes à charge, les dettes, les études et le revenu à remplacer. Il s’agit d’une estimation de planification ; vérifiez les exclusions et les conditions auprès de l’assureur.`,
    schemaName: funeral
      ? `Estimation d’assurance obsèques — ${name}`
      : `Estimation du besoin d’assurance vie — ${name}`,
    breadcrumbName: funeral ? "Assurance obsèques" : "Assurance vie",
    canonical: canonicalUrl(html)
  };
}

function targets() {
  const rows = [];
  const fuelRoot = path.join(ROOT, "fr", "tools", "suivi-carburant");
  for (const entry of fs.readdirSync(fuelRoot, { withFileTypes: true })) {
    const file = path.join(fuelRoot, entry.name, "index.html");
    if (entry.isDirectory() && fs.existsSync(file)) rows.push({ family: "suivi-carburant", slug: entry.name, file });
  }
  for (const family of ["contrat-bail", "contrat-travail"]) {
    const directory = path.join(ROOT, "fr", "tools", family);
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith(".html") && entry.name !== "index.html") {
        rows.push({ family, slug: entry.name.replace(/\.html$/, ""), file: path.join(directory, entry.name) });
      }
    }
  }
  for (const family of ["assurance-auto", "assurance-obseques", "assurance-vie", "comparateur-assurance-sante"]) {
    const directory = path.join(ROOT, "fr", "tools", family);
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith(".html") && entry.name !== "index.html") {
        rows.push({ family, slug: entry.name.replace(/\.html$/, ""), file: path.join(directory, entry.name) });
      }
    }
  }
  return rows.sort((left, right) => left.file.localeCompare(right.file));
}

function expectedForTarget(target) {
  const html = fs.readFileSync(target.file, "utf8");
  if (
    target.family === "suivi-carburant" &&
    /<meta\s+name=["']afrotools-source-owner["']\s+content=["']scripts\/build-french-fuel-country-pages\.js["']\s*\/?>/i.test(html)
  ) {
    return html;
  }
  const country = countryForSlug(target.slug);
  const metadata = target.family === "suivi-carburant"
    ? fuelMetadata(html, country)
    : target.family === "contrat-bail" || target.family === "contrat-travail"
      ? legalMetadata(html, country, target.family)
      : insuranceMetadata(html, country, target.family);
  return applyMetadata(html, metadata);
}

function run({ write = false } = {}) {
  const stale = [];
  let changed = 0;
  for (const target of targets()) {
    const before = fs.readFileSync(target.file, "utf8");
    const expected = expectedForTarget(target);
    if (before === expected) continue;
    stale.push(path.relative(ROOT, target.file).replace(/\\/g, "/"));
    if (write) {
      writeFileSyncWithRetry(target.file, expected, "utf8");
      changed += 1;
    }
  }
  return { targets: targets().length, stale, changed };
}

function main() {
  if (WRITE === CHECK) throw new Error("Choose exactly one of --write or --check.");
  const result = run({ write: WRITE });
  if (CHECK && result.stale.length) {
    result.stale.slice(0, 100).forEach((file) => console.error(`STALE ${file}`));
    if (result.stale.length > 100) console.error(`... ${result.stale.length - 100} more`);
    process.exitCode = 1;
  }
  console.log(`French search snippets: ${result.targets} country pages checked; ${WRITE ? result.changed : result.stale.length} ${WRITE ? "updated" : "stale"}.`);
}

if (require.main === module) main();

module.exports = { applyMetadata, countryForSlug, fuelMetadata, insuranceMetadata, legalMetadata, run, targets };

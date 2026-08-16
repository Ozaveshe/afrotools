#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const { writeFileSyncWithRetry } = require("./lib/safe-write");
const { stableId } = require("./lib/content-integrity");

const ROOT = path.resolve(__dirname, "..");
const SNAPSHOT_PATH = path.join(ROOT, "data", "fuel", "latest.json");
const COUNTRY_REGISTRY_PATH = path.join(ROOT, "data", "registry", "countries.json");
const OUT_DIR = path.join(ROOT, "fr", "tools", "suivi-carburant");
const BASE_URL = "https://afrotools.com";
const WRITE = process.argv.includes("--write");
const CHECK = process.argv.includes("--check");

const REGION_LABELS = Object.freeze({
  north: "Afrique du Nord",
  west: "Afrique de l’Ouest",
  east: "Afrique de l’Est",
  central: "Afrique centrale",
  south: "Afrique australe",
});

const SLUG_OVERRIDES = Object.freeze({
  CI: "cote-divoire",
  CD: "dr-congo",
  CG: "congo",
  CV: "cabo-verde",
  ST: "sao-tome-and-principe",
});

const COUNTRY_PHRASES = Object.freeze({
  AO: "en Angola", BF: "au Burkina Faso", BI: "au Burundi", BJ: "au Bénin",
  BW: "au Botswana", CD: "au Congo-Kinshasa", CF: "en République centrafricaine",
  CG: "au Congo-Brazzaville", CI: "en Côte d’Ivoire", CM: "au Cameroun",
  CV: "au Cap-Vert", DJ: "à Djibouti", DZ: "en Algérie", EG: "en Égypte",
  ER: "en Érythrée", ET: "en Éthiopie", GA: "au Gabon", GH: "au Ghana",
  GM: "en Gambie", GN: "en Guinée", GQ: "en Guinée équatoriale",
  GW: "en Guinée-Bissau", KE: "au Kenya", KM: "aux Comores", LR: "au Liberia",
  LS: "au Lesotho", LY: "en Libye", MA: "au Maroc", MG: "à Madagascar",
  ML: "au Mali", MR: "en Mauritanie", MU: "à Maurice", MW: "au Malawi",
  MZ: "au Mozambique", NA: "en Namibie", NE: "au Niger", NG: "au Nigeria",
  RW: "au Rwanda", SC: "aux Seychelles", SD: "au Soudan", SL: "en Sierra Leone",
  SN: "au Sénégal", SO: "en Somalie", SS: "au Soudan du Sud",
  ST: "à Sao Tomé-et-Principe", SZ: "en Eswatini", TD: "au Tchad",
  TG: "au Togo", TN: "en Tunisie", TZ: "en Tanzanie", UG: "en Ouganda",
  ZA: "en Afrique du Sud", ZM: "en Zambie", ZW: "au Zimbabwe",
});

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function countrySlug(row) {
  return SLUG_OVERRIDES[row.code] || slugify(row.name);
}

function countryFlag(code) {
  if (!/^[A-Z]{2}$/.test(code)) return code;
  return [...code].map((char) => String.fromCodePoint(127397 + char.charCodeAt(0))).join("");
}

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) return "non disponible";
  const numeric = Number(value);
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: numeric < 10 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(numeric);
}

function formatDate(value) {
  if (!value) return "date du dernier relevé disponible";
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function priceLocal(row, fuel) {
  const item = row[fuel] || {};
  return `${row.currency} ${formatNumber(item.price)}/${fuel === "lpg" ? "kg" : "L"}`;
}

function priceUsd(row, fuel) {
  const item = row[fuel] || {};
  return item.usd == null
    ? "comparaison USD non disponible"
    : `${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(item.usd)}/${fuel === "lpg" ? "kg" : "L"}`;
}

function monthlyGeneratorEstimate(row) {
  const litresPerHour = 1.5;
  const hoursPerDay = 8;
  const daysPerMonth = 26;
  const litresPerMonth = litresPerHour * hoursPerDay * daysPerMonth;
  const petrol = row.petrol || {};
  return {
    generatorSize: "5 kVA",
    hoursPerDay,
    daysPerMonth,
    litresPerMonth,
    local: `${row.currency} ${formatNumber((petrol.price || 0) * litresPerMonth)}`,
    usd: petrol.usd == null
      ? "comparaison USD non disponible"
      : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format((petrol.usd || 0) * litresPerMonth),
  };
}

function regionalAverage(rows, region, fuel) {
  const values = rows
    .filter((row) => row.region === region && row[fuel] && typeof row[fuel].usd === "number")
    .map((row) => row[fuel].usd);
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function relationToRegion(row, rows, fuel) {
  const average = regionalAverage(rows, row.region, fuel);
  if (!average || !row[fuel] || typeof row[fuel].usd !== "number") {
    return "dans l’échantillon régional disponible";
  }
  const delta = ((row[fuel].usd - average) / average) * 100;
  const region = REGION_LABELS[row.region] || "la région";
  if (Math.abs(delta) < 5) return `proche de la moyenne en ${region}`;
  return `${Math.abs(delta).toFixed(0)} % ${delta > 0 ? "au-dessus" : "en dessous"} de la moyenne en ${region}`;
}

function relatedCountries(row, rows) {
  const distance = (candidate) => Math.abs((candidate.petrol.usd || 0) - (row.petrol.usd || 0));
  const sameRegion = rows
    .filter((candidate) => candidate.code !== row.code && candidate.region === row.region)
    .sort((left, right) => distance(left) - distance(right));
  const fallback = rows
    .filter((candidate) => candidate.code !== row.code && candidate.region !== row.region)
    .sort((left, right) => distance(left) - distance(right));
  return [...sameRegion, ...fallback].slice(0, 4);
}

function replaceRequired(html, pattern, replacement, label) {
  if (!pattern.test(html)) throw new Error(`Bloc introuvable (${label}).`);
  pattern.lastIndex = 0;
  return html.replace(pattern, replacement);
}

function setMeta(html, selector, value) {
  let found = false;
  const next = html.replace(/<meta\b[^>]*>/gi, (tag) => {
    const matches = Object.entries(selector).every(([name, expected]) => {
      const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i"));
      return match && match[2].toLowerCase() === expected.toLowerCase();
    });
    if (!matches) return tag;
    found = true;
    return tag.replace(/\bcontent\s*=\s*(["'])([\s\S]*?)\1/i, `content="${escapeHtml(value)}"`);
  });
  if (!found) throw new Error(`Métadonnée introuvable: ${JSON.stringify(selector)}.`);
  return next;
}

function localizedFaqs(row, name, estimate, date) {
  const location = COUNTRY_PHRASES[row.code] || `en ${name}`;
  return [
    {
      q: `Quel est le prix de l’essence ${location} ?`,
      a: `Le dernier relevé AfroFuel disponible indique ${priceLocal(row, "petrol")} pour l’essence ${location}, avec ${priceUsd(row, "petrol")} à titre de comparaison. Le prix réel peut varier selon la ville, la station, le fournisseur et la date.`,
    },
    {
      q: `Quel est le prix du diesel ${location} ?`,
      a: `Le diesel est affiché à ${priceLocal(row, "diesel")} dans le dernier relevé disponible. La valeur de ${priceUsd(row, "diesel")} sert uniquement à comparer les pays ; ce n’est pas un devis de station-service.`,
    },
    {
      q: `Quel est le prix du GPL ${location} ?`,
      a: `Le GPL est affiché à ${priceLocal(row, "lpg")} dans le relevé. AfroFuel présente le GPL au kilogramme pour faciliter la comparaison des coûts de recharge des bouteilles.`,
    },
    {
      q: `Combien coûte l’utilisation d’un groupe électrogène de 5 kVA ${location} ?`,
      a: `Avec une hypothèse simple de 1,5 litre par heure, 8 heures par jour et 26 jours par mois, la dépense mensuelle d’essence est estimée à ${estimate.local}, soit ${estimate.usd} à titre de comparaison.`,
    },
    {
      q: `À quelle date ces prix du carburant ${location} ont-ils été mis à jour ?`,
      a: `Cette page utilise la dernière ligne AfroFuel disponible, datée du ${date}. Il s’agit d’une estimation de planification : vérifiez le prix auprès d’une station, d’un dépôt ou d’un fournisseur local avant un achat ou un devis.`,
    },
    {
      q: `Puis-je comparer ${name} avec un autre pays africain ?`,
      a: `Oui. Le comparateur AfroFuel permet de confronter ${name} aux marchés voisins en ${REGION_LABELS[row.region] || "Afrique"} ou à tout autre pays présent dans le tableau.`,
    },
  ];
}

function schemaBlocks(row, name, slug, description, faqs, snapshotDate) {
  const canonical = `${BASE_URL}/fr/tools/suivi-carburant/${slug}/`;
  const location = COUNTRY_PHRASES[row.code] || `en ${name}`;
  const page = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Prix du carburant — ${name}`,
    description,
    url: canonical,
    inLanguage: "fr",
    dateModified: snapshotDate,
    isPartOf: { "@type": "WebSite", name: "AfroTools", url: `${BASE_URL}/fr/` },
    about: { "@id": canonical },
    image: `${BASE_URL}/assets/img/tools/fuel-tracker.webp`,
  };
  const dataset = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": canonical,
    name: `Relevé AfroFuel des prix du carburant ${location}`,
    description: `Dernier relevé disponible des prix de l’essence, du diesel et du GPL ${location}. Les prix peuvent varier selon la ville, la station, le fournisseur et la date.`,
    url: canonical,
    dateModified: snapshotDate,
    temporalCoverage: snapshotDate,
    inLanguage: "fr",
    creator: { "@type": "Organization", name: "AfroTools", url: `${BASE_URL}/fr/` },
    variableMeasured: [
      { "@type": "PropertyValue", name: "Prix de l’essence", unitText: `${row.currency} et USD par litre` },
      { "@type": "PropertyValue", name: "Prix du diesel", unitText: `${row.currency} et USD par litre` },
      { "@type": "PropertyValue", name: "Prix du GPL", unitText: `${row.currency} et USD par kilogramme` },
    ],
    distribution: {
      "@type": "DataDownload",
      encodingFormat: "application/json",
      contentUrl: `${BASE_URL}/data/fuel/latest.json`,
    },
    isAccessibleForFree: true,
    license: `${BASE_URL}/terms/`,
  };
  const labels = {
    petrol: { article: "de l’", name: "essence" },
    diesel: { article: "du ", name: "diesel" },
    lpg: { article: "du ", name: "GPL" },
  };
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Prix de l’essence, du diesel et du GPL ${location}`,
    numberOfItems: 3,
    itemListElement: ["petrol", "diesel", "lpg"].map((fuel, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Thing",
        name: `Prix ${labels[fuel].article}${labels[fuel].name} ${location}`,
        additionalProperty: [
          {
            "@type": "PropertyValue",
            name: `Prix ${labels[fuel].article}${labels[fuel].name} en ${row.currency}`,
            value: row[fuel].price,
            unitText: `${row.currency} par ${fuel === "lpg" ? "kilogramme" : "litre"}`,
          },
          ...(row[fuel].usd == null ? [] : [{
            "@type": "PropertyValue",
            name: `Comparaison USD — ${labels[fuel].name}`,
            value: row[fuel].usd,
            unitText: `USD par ${fuel === "lpg" ? "kilogramme" : "litre"}`,
          }]),
        ],
      },
    })),
  };
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "AfroTools", item: `${BASE_URL}/fr/` },
      { "@type": "ListItem", position: 2, name: "Suivi des prix du carburant", item: `${BASE_URL}/fr/tools/suivi-carburant/` },
      { "@type": "ListItem", position: 3, name, item: canonical },
    ],
  };
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
  return [page, dataset, itemList, breadcrumbs, faq]
    .map((data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`)
    .join("\n");
}

function visiblePage(row, rows, country) {
  const slug = countrySlug(row);
  const name = country.displayNames.fr;
  const location = COUNTRY_PHRASES[row.code] || `en ${name}`;
  const region = REGION_LABELS[row.region] || "Afrique";
  const flag = countryFlag(row.code);
  const date = formatDate(row.last_updated);
  const estimate = monthlyGeneratorEstimate(row);
  const related = relatedCountries(row, rows);
  const faqs = localizedFaqs(row, name, estimate, date);
  const description = `Prix du carburant ${location} : essence ${priceLocal(row, "petrol")}, diesel ${priceLocal(row, "diesel")} et GPL ${priceLocal(row, "lpg")}. Comparez les pays et estimez un budget.`;
  const canonical = `${BASE_URL}/fr/tools/suivi-carburant/${slug}/`;
  const compareHref = `/fr/tools/suivi-carburant/?country=${encodeURIComponent(row.code)}#fuel-compare`;
  const generatorHref = `/fr/tools/suivi-carburant/?country=${encodeURIComponent(row.code)}#generator-cost`;

  const header = `<header class="fuel-country-hero">
  <div class="fuel-country-shell">
    <nav class="fuel-breadcrumb" aria-label="Fil d’Ariane">
      <a href="/fr/">AfroTools</a><span>/</span>
      <a href="/fr/tools/suivi-carburant/">AfroFuel</a><span>/</span>
      <span>${escapeHtml(name)}</span>
    </nav>
    <div class="fuel-country-grid">
      <div>
        <div class="fuel-country-kicker"><span aria-hidden="true">${flag}</span><span>Prix du carburant — ${escapeHtml(region)}</span></div>
        <h1>Prix du carburant — ${escapeHtml(name)}</h1>
        <p class="fuel-lede">Consultez le dernier relevé disponible des prix de l’essence, du diesel et du GPL ${escapeHtml(location)}, en ${escapeHtml(row.currency)}. Estimez un budget de transport, de groupe électrogène ou de ménage, puis vérifiez le prix local.</p>
        <p class="fuel-trust">Données du ${escapeHtml(date)} · Estimation de planification · Vérifiez localement avant tout achat.</p>
      </div>
      <aside class="fuel-price-card" aria-label="Résumé des prix du carburant ${escapeHtml(location)}">
        <div class="fuel-card-top"><div><strong>${escapeHtml(name)}</strong><div class="fuel-date">Dernière mise à jour : ${escapeHtml(date)}</div></div><div class="fuel-flag" aria-hidden="true">${flag}</div></div>
        <div class="fuel-price-list">
          <div class="fuel-price-row"><span>Essence</span><div><strong class="fuel-local">${escapeHtml(priceLocal(row, "petrol"))}</strong><span class="fuel-usd">${escapeHtml(priceUsd(row, "petrol"))} · comparaison</span></div></div>
          <div class="fuel-price-row"><span>Diesel</span><div><strong class="fuel-local">${escapeHtml(priceLocal(row, "diesel"))}</strong><span class="fuel-usd">${escapeHtml(priceUsd(row, "diesel"))} · comparaison</span></div></div>
          <div class="fuel-price-row"><span>GPL</span><div><strong class="fuel-local">${escapeHtml(priceLocal(row, "lpg"))}</strong><span class="fuel-usd">${escapeHtml(priceUsd(row, "lpg"))} · comparaison</span></div></div>
        </div>
        <div class="fuel-actions"><a class="fuel-btn primary" href="${escapeHtml(compareHref)}">Comparer ${escapeHtml(name)} à un autre pays</a><a class="fuel-btn" href="${escapeHtml(generatorHref)}">Calculer un budget de groupe électrogène</a></div>
      </aside>
    </div>
  </div>
</header>`;

  const planner = `<section class="fuel-section fuel-planner" aria-labelledby="fuel-planner-title" data-fr-fuel-planner data-currency="${escapeHtml(row.currency)}">
    <h2 id="fuel-planner-title">Planifier un budget carburant ${escapeHtml(location)}</h2>
    <p>Transformez le prix disponible en estimation mensuelle simple pour le transport, un groupe électrogène, une livraison ou le suivi des dépenses.</p>
    <div class="fuel-planner-grid">
      <label>Type de carburant<select name="fuel_type"><option data-price="${row.petrol.price}" value="petrol">Essence</option><option data-price="${row.diesel.price}" value="diesel">Diesel</option><option data-price="${row.lpg.price}" value="lpg">GPL</option></select></label>
      <label>Litres par jour<input name="litres_per_day" type="number" min="0" step="0.1" value="10" inputmode="decimal"></label>
      <label>Jours par mois<input name="days_per_month" type="number" min="1" max="31" step="1" value="26" inputmode="numeric"></label>
    </div>
    <output class="fuel-planner-output" data-fuel-planner-output aria-live="polite">Entrez une consommation pour obtenir une estimation.</output>
    <div class="fuel-note" style="margin-top:14px"><strong>Méthodologie et source :</strong> litres par jour × jours par mois × prix du relevé AfroFuel. <a href="/data/fuel/latest.json">Consulter le jeu de données</a> (ligne datée du ${escapeHtml(date)}). Les prix peuvent varier selon la station, la ville, le dépôt et le fournisseur ; vérifiez localement avant un achat, un devis ou une décision financière.</div>
    <div class="fuel-source-row"><a href="/fr/tools/suivi-carburant/#fuel-compare">Comparer les pays</a><a href="/fr/tools/suivi-carburant/#generator-cost">Calculateur de groupe électrogène</a></div>
  </section>`;

  const generator = `<section class="fuel-section" aria-labelledby="generator-estimate">
    <h2 id="generator-estimate">Estimation du coût d’un groupe électrogène ${escapeHtml(location)}</h2>
    <p>Dans ce modèle de planification, un groupe à essence de ${escapeHtml(estimate.generatorSize)} fonctionnant ${estimate.hoursPerDay} heures par jour pendant ${estimate.daysPerMonth} jours consomme environ ${formatNumber(estimate.litresPerMonth)} litres par mois.</p>
    <div class="fuel-panels">
      <div class="fuel-panel"><strong>Estimation mensuelle</strong><span>${escapeHtml(estimate.local)}</span><p>${escapeHtml(estimate.usd)} à titre de comparaison.</p></div>
      <div class="fuel-panel"><strong>Carburant consommé</strong><span>${formatNumber(estimate.litresPerMonth)} litres/mois</span><p>Hypothèse : 1,5 litre par heure.</p></div>
      <div class="fuel-panel"><strong>Prix de référence</strong><span>${escapeHtml(priceLocal(row, "petrol"))}</span><p>Utilisez le prix local pour toute décision finale.</p></div>
    </div>
  </section>`;

  const context = `<section class="fuel-section" aria-labelledby="country-context">
    <h2 id="country-context">Comment utiliser ces prix du carburant ${escapeHtml(location)}</h2>
    <p>AfroFuel affiche d’abord les prix en monnaie locale, car ménages, conducteurs, commerces et équipes d’achat paient généralement dans cette monnaie. Les valeurs en USD servent uniquement à comparer ${escapeHtml(name)} au reste du tableau africain.</p>
    <p>Dans ce relevé, le prix de l’essence ${escapeHtml(location)} est ${escapeHtml(relationToRegion(row, rows, "petrol"))}. Le montant réel peut varier selon la ville, la station, le fournisseur, le volume et la date.</p>
    <div class="fuel-note">Ces chiffres correspondent au dernier relevé disponible, pas à un prix garanti en temps réel. Utilisez-les pour planifier, puis vérifiez le tarif local avant d’acheter du carburant ou de chiffrer un transport.</div>
  </section>`;

  const tools = `<section class="fuel-section" aria-labelledby="related-tools">
    <h2 id="related-tools">Planifier carburant, transport et énergie de secours</h2>
    <div class="fuel-links">
      <a class="fuel-link-card" href="/fr/tools/suivi-carburant/#generator-cost">Calculateur de carburant pour groupe électrogène<span>Estimez la dépense mensuelle.</span></a>
      <a class="fuel-link-card" href="/fr/tools/tarifs-itineraire/">Tarifs d’itinéraire<span>Évaluez les coûts de transport influencés par le carburant.</span></a>
      <a class="fuel-link-card" href="/fr/tools/couts-secours-energie/">Coût de l’énergie de secours<span>Comparez groupe électrogène, GPL, onduleur et solaire.</span></a>
      <a class="fuel-link-card" href="/fr/tools/roi-solaire/">Calculateur de ROI solaire<span>Comparez le solaire aux dépenses de carburant.</span></a>
      <a class="fuel-link-card" href="/fr/tools/cout-de-la-vie/">Comparateur du coût de la vie<span>Replacez carburant et transport dans un budget complet.</span></a>
    </div>
  </section>`;

  const relatedBlock = `<section class="fuel-section" aria-labelledby="related-countries">
    <h2 id="related-countries">Prix du carburant dans des pays africains comparables</h2>
    <div class="fuel-links">
      ${related.map((candidate) => {
        const candidateCountry = country.registryByCode.get(candidate.code);
        const candidateName = candidateCountry ? candidateCountry.displayNames.fr : candidate.name;
        return `<a class="fuel-link-card" href="/fr/tools/suivi-carburant/${escapeHtml(countrySlug(candidate))}/">${escapeHtml(candidateName)}<span>Essence : ${escapeHtml(priceLocal(candidate, "petrol"))}</span></a>`;
      }).join("\n      ")}
    </div>
  </section>`;

  const faq = `<section class="fuel-section fuel-faq" aria-labelledby="country-faq">
    <h2 id="country-faq">Questions fréquentes</h2>
    ${faqs.map((item) => `<details><summary>${escapeHtml(item.q)}</summary><p>${escapeHtml(item.a)}</p></details>`).join("\n    ")}
  </section>`;

  return { canonical, description, faqs, header, planner, generator, context, tools, relatedBlock, faq };
}

function localizePage(html, row, rows, country) {
  const slug = countrySlug(row);
  const name = country.displayNames.fr;
  const date = row.last_updated || readJson(SNAPSHOT_PATH).source_reviewed_at || "2026-06-12";
  const visible = visiblePage(row, rows, country);
  const location = COUNTRY_PHRASES[row.code] || `en ${name}`;
  const title = `Prix du carburant ${location} | AfroFuel`;
  let next = html;

  next = replaceRequired(next, /<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`, "title");
  next = setMeta(next, { name: "description" }, visible.description);
  next = setMeta(next, { property: "og:title" }, title);
  next = setMeta(next, { property: "og:description" }, visible.description);
  next = setMeta(next, { property: "og:url" }, visible.canonical);
  next = setMeta(next, { name: "twitter:title" }, title);
  next = setMeta(next, { name: "twitter:description" }, visible.description);
  next = next.replace(/\s*<meta name="afrotools-language-fallback"[^>]*>/gi, "");
  next = next.replace(/\s*<meta name="afrotools-language-fallback-owner"[^>]*>/gi, "");
  next = next.replace(/\s*<aside\b[^>]*data-language-fallback-notice=["'][^"']+["'][^>]*>[\s\S]*?<\/aside>/gi, "");
  if (!/name=["']afrotools-source-owner["']/i.test(next)) {
    next = next.replace(/(<meta charset=[^>]+>)/i, `$1\n<meta name="afrotools-source-owner" content="scripts/build-french-fuel-country-pages.js">`);
  }
  const contentId = stableId(`/fr/tools/suivi-carburant/${slug}/`);
  if (/name=["']afrotools-content-id["']/i.test(next)) {
    next = setMeta(next, { name: "afrotools-content-id" }, contentId);
  } else {
    next = next.replace(/<\/head>/i, `<meta name="afrotools-content-id" content="${contentId}">\n</head>`);
  }
  next = replaceRequired(
    next,
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>(?:\s*<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>){4}/i,
    schemaBlocks(row, name, slug, visible.description, visible.faqs, date),
    "données structurées"
  );
  next = replaceRequired(next, /<header class="fuel-country-hero">[\s\S]*?<\/header>/i, visible.header, "en-tête");
  next = replaceRequired(next, /<section class="fuel-section fuel-planner"[\s\S]*?<\/section>/i, visible.planner, "planificateur");
  next = replaceRequired(next, /<section class="fuel-section" aria-labelledby="generator-estimate">[\s\S]*?<\/section>/i, visible.generator, "estimation groupe électrogène");
  next = replaceRequired(next, /<section class="fuel-section" aria-labelledby="country-context">[\s\S]*?<\/section>/i, visible.context, "contexte pays");
  next = replaceRequired(next, /<section class="fuel-section" aria-labelledby="related-tools">[\s\S]*?<\/section>/i, visible.tools, "outils liés");
  next = replaceRequired(next, /<section class="fuel-section" aria-labelledby="related-countries">[\s\S]*?<\/section>/i, visible.relatedBlock, "pays liés");
  next = replaceRequired(next, /<section class="fuel-section fuel-faq" aria-labelledby="country-faq">[\s\S]*?<\/section>/i, visible.faq, "FAQ");
  if (!/output\.textContent='Estimation locale : '[\s\S]*?Vérifiez le prix local avant achat ou devis\.';/.test(next)) {
    next = replaceRequired(
      next,
      /output\.textContent='Estimation locale:[\s\S]*?avant achat ou devis\.';/,
      "output.textContent='Estimation locale : '+fmt(total)+' '+currency+' par mois pour '+daily+' litres/jour de carburant ('+fuelLabel()+') pendant '+month+' jours. Vérifiez le prix local avant achat ou devis.';",
      "résultat du planificateur"
    );
  }
  return next;
}

function run({ write = false } = {}) {
  const snapshot = readJson(SNAPSHOT_PATH);
  const rows = (snapshot.countries || [])
    .filter((row) => row && row.code && row.name && row.petrol && row.diesel && row.lpg)
    .sort((left, right) => left.name.localeCompare(right.name));
  const registry = readJson(COUNTRY_REGISTRY_PATH);
  const registryByCode = new Map(registry.map((country) => [country.id, country]));
  const stale = [];
  const changed = [];

  for (const row of rows) {
    const country = registryByCode.get(row.code);
    if (!country || !country.displayNames || !country.displayNames.fr) {
      throw new Error(`Nom français absent du registre pour ${row.code}.`);
    }
    country.registryByCode = registryByCode;
    const slug = countrySlug(row);
    const file = path.join(OUT_DIR, slug, "index.html");
    if (!fs.existsSync(file)) throw new Error(`Page française absente: ${path.relative(ROOT, file)}.`);
    const before = fs.readFileSync(file, "utf8");
    const expected = localizePage(before, row, rows, country);
    if (before === expected) continue;
    const relative = path.relative(ROOT, file).replace(/\\/g, "/");
    stale.push(relative);
    if (write) {
      writeFileSyncWithRetry(file, expected, "utf8");
      changed.push(relative);
    }
  }

  return { targets: rows.length, stale, changed };
}

function main() {
  if (WRITE === CHECK) throw new Error("Choisissez exactement une option: --write ou --check.");
  const result = run({ write: WRITE });
  if (CHECK && result.stale.length) {
    result.stale.forEach((file) => console.error(`STALE ${file}`));
    process.exitCode = 1;
  }
  console.log(`Pages carburant françaises: ${result.targets} vérifiées; ${WRITE ? result.changed.length : result.stale.length} ${WRITE ? "mises à jour" : "obsolètes"}.`);
}

if (require.main === module) main();

module.exports = { countrySlug, localizePage, run };

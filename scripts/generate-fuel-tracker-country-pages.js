#!/usr/bin/env node
/**
 * Generate static AfroFuel country landing pages from data/fuel/latest.json.
 *
 * Usage:
 *   node scripts/generate-fuel-tracker-country-pages.js
 *   node scripts/generate-fuel-tracker-country-pages.js --check
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SNAPSHOT_PATH = path.join(ROOT, 'data', 'fuel', 'latest.json');
const OUT_DIR = path.join(ROOT, 'tools', 'fuel-tracker');
const BASE_URL = 'https://afrotools.com';
const CHECK = process.argv.includes('--check');

const REGION_LABELS = {
  north: 'North Africa',
  west: 'West Africa',
  east: 'East Africa',
  central: 'Central Africa',
  south: 'Southern Africa',
};

const CITY_HINTS = {
  DZ: ['Algiers', 'Oran'],
  AO: ['Luanda', 'Benguela'],
  BJ: ['Cotonou', 'Porto-Novo'],
  BW: ['Gaborone', 'Francistown'],
  BF: ['Ouagadougou', 'Bobo-Dioulasso'],
  BI: ['Bujumbura', 'Gitega'],
  CV: ['Praia', 'Mindelo'],
  CM: ['Douala', 'Yaounde'],
  CF: ['Bangui', 'Bimbo'],
  TD: ['N Djamena', 'Moundou'],
  KM: ['Moroni', 'Mutsamudu'],
  CG: ['Brazzaville', 'Pointe-Noire'],
  CD: ['Kinshasa', 'Lubumbashi'],
  CI: ['Abidjan', 'Yamoussoukro'],
  DJ: ['Djibouti City', 'Ali Sabieh'],
  EG: ['Cairo', 'Alexandria'],
  GQ: ['Malabo', 'Bata'],
  ER: ['Asmara', 'Massawa'],
  SZ: ['Mbabane', 'Manzini'],
  ET: ['Addis Ababa', 'Dire Dawa'],
  GA: ['Libreville', 'Port-Gentil'],
  GM: ['Banjul', 'Serekunda'],
  GH: ['Accra', 'Kumasi'],
  GN: ['Conakry', 'Kankan'],
  GW: ['Bissau', 'Bafata'],
  KE: ['Nairobi', 'Mombasa'],
  LS: ['Maseru', 'Teyateyaneng'],
  LR: ['Monrovia', 'Gbarnga'],
  LY: ['Tripoli', 'Benghazi'],
  MG: ['Antananarivo', 'Toamasina'],
  MW: ['Lilongwe', 'Blantyre'],
  ML: ['Bamako', 'Sikasso'],
  MR: ['Nouakchott', 'Nouadhibou'],
  MU: ['Port Louis', 'Curepipe'],
  MA: ['Casablanca', 'Rabat'],
  MZ: ['Maputo', 'Beira'],
  NA: ['Windhoek', 'Walvis Bay'],
  NE: ['Niamey', 'Maradi'],
  NG: ['Lagos', 'Abuja'],
  RW: ['Kigali', 'Musanze'],
  ST: ['Sao Tome', 'Trindade'],
  SN: ['Dakar', 'Thies'],
  SC: ['Victoria', 'Beau Vallon'],
  SL: ['Freetown', 'Bo'],
  SO: ['Mogadishu', 'Hargeisa'],
  ZA: ['Johannesburg', 'Cape Town'],
  SS: ['Juba', 'Wau'],
  SD: ['Khartoum', 'Port Sudan'],
  TZ: ['Dar es Salaam', 'Dodoma'],
  TG: ['Lome', 'Kara'],
  TN: ['Tunis', 'Sfax'],
  UG: ['Kampala', 'Entebbe'],
  ZM: ['Lusaka', 'Kitwe'],
  ZW: ['Harare', 'Bulawayo'],
};

const SLUG_OVERRIDES = {
  CI: 'cote-divoire',
  CD: 'dr-congo',
  CG: 'congo',
  CV: 'cabo-verde',
  ST: 'sao-tome-and-principe',
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function slugify(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function countrySlug(row) {
  return SLUG_OVERRIDES[row.code] || slugify(row.name);
}

function countryFlag(code) {
  if (!/^[A-Z]{2}$/.test(code)) return code;
  return [...code].map((char) => String.fromCodePoint(127397 + char.charCodeAt(0))).join('');
}

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) return 'not available';
  const numeric = Number(value);
  return new Intl.NumberFormat('en', {
    minimumFractionDigits: numeric < 10 ? 2 : 0,
    maximumFractionDigits: numeric < 10 ? 2 : 2,
  }).format(numeric);
}

function formatDate(value) {
  if (!value) return 'latest available snapshot';
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function priceLocal(row, fuel) {
  const item = row[fuel] || {};
  return `${row.currency} ${formatNumber(item.price)}/${fuel === 'lpg' ? 'kg' : 'L'}`;
}

function priceUsd(row, fuel) {
  const item = row[fuel] || {};
  return item.usd == null ? 'USD not available' : `$${Number(item.usd).toFixed(2)}/${fuel === 'lpg' ? 'kg' : 'L'}`;
}

function unitText(fuel) {
  return fuel === 'lpg' ? 'kg' : 'liter';
}

function priceProperties(row, fuel) {
  const item = row[fuel] || {};
  const label = fuel === 'lpg' ? 'LPG' : fuel.charAt(0).toUpperCase() + fuel.slice(1);
  const properties = [
    {
      '@type': 'PropertyValue',
      name: `${label} price in ${row.currency}`,
      value: item.price,
      unitText: `${row.currency} per ${unitText(fuel)}`,
    },
  ];

  if (item.usd != null) {
    properties.push({
      '@type': 'PropertyValue',
      name: `${label} USD comparison`,
      value: item.usd,
      unitText: `USD per ${unitText(fuel)}`,
    });
  }

  return properties;
}

function monthlyGeneratorEstimate(row) {
  const litresPerHour = 1.5;
  const hoursPerDay = 8;
  const daysPerMonth = 26;
  const litresPerMonth = litresPerHour * hoursPerDay * daysPerMonth;
  const petrol = row.petrol || {};
  return {
    generatorSize: '5 KVA',
    hoursPerDay,
    daysPerMonth,
    litresPerMonth,
    local: `${row.currency} ${formatNumber((petrol.price || 0) * litresPerMonth)}`,
    usd: petrol.usd == null ? 'USD not available' : `$${((petrol.usd || 0) * litresPerMonth).toFixed(2)}`,
  };
}

function regionalAverage(rows, region, fuel) {
  const values = rows
    .filter((row) => row.region === region && row[fuel] && typeof row[fuel].usd === 'number')
    .map((row) => row[fuel].usd);
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function relationToRegion(row, rows, fuel) {
  const avg = regionalAverage(rows, row.region, fuel);
  if (!avg || !row[fuel] || typeof row[fuel].usd !== 'number') return 'within the regional comparison set';
  const delta = ((row[fuel].usd - avg) / avg) * 100;
  if (Math.abs(delta) < 5) return `close to the ${REGION_LABELS[row.region] || 'regional'} average`;
  return `${Math.abs(delta).toFixed(0)}% ${delta > 0 ? 'above' : 'below'} the ${REGION_LABELS[row.region] || 'regional'} average`;
}

function relatedCountries(row, rows) {
  const sameRegion = rows
    .filter((candidate) => candidate.code !== row.code && candidate.region === row.region)
    .sort((a, b) => Math.abs((a.petrol.usd || 0) - (row.petrol.usd || 0)) - Math.abs((b.petrol.usd || 0) - (row.petrol.usd || 0)));
  const fallback = rows
    .filter((candidate) => candidate.code !== row.code && candidate.region !== row.region)
    .sort((a, b) => Math.abs((a.petrol.usd || 0) - (row.petrol.usd || 0)) - Math.abs((b.petrol.usd || 0) - (row.petrol.usd || 0)));
  return [...sameRegion, ...fallback].slice(0, 4);
}

function ogImageFor(slug) {
  const countryImage = `/assets/img/countries/${slug}.webp`;
  if (fs.existsSync(path.join(ROOT, countryImage))) return `${BASE_URL}${countryImage}`;
  return `${BASE_URL}/assets/img/tools/fuel-tracker.webp`;
}

function faqItems(row, rows, estimate) {
  const cities = CITY_HINTS[row.code] || ['major cities', 'border towns'];
  const date = formatDate(row.last_updated);
  return [
    {
      q: `What is the petrol price in ${row.name}?`,
      a: `The latest available AfroFuel snapshot shows petrol in ${row.name} at ${priceLocal(row, 'petrol')}, with a USD comparison of ${priceUsd(row, 'petrol')}. Prices can vary between ${cities[0]}, ${cities[1]}, highways, depots, and individual stations.`,
    },
    {
      q: `What is the diesel price in ${row.name}?`,
      a: `Diesel is shown at ${priceLocal(row, 'diesel')} in the latest available snapshot. Use the USD comparison of ${priceUsd(row, 'diesel')} only for cross-country comparison, not as a pump quote.`,
    },
    {
      q: `How much is LPG in ${row.name}?`,
      a: `LPG is listed at ${priceLocal(row, 'lpg')} in the snapshot. AfroFuel displays LPG per kilogram so households and small businesses can compare cylinder refill costs more easily.`,
    },
    {
      q: `How much does a 5 KVA generator cost to run in ${row.name}?`,
      a: `Using a simple 5 KVA estimate of 1.5 litres per hour for 8 hours per day and 26 days per month, monthly petrol spend is about ${estimate.local}, or ${estimate.usd} for comparison.`,
    },
    {
      q: `When were these ${row.name} fuel prices updated?`,
      a: `This country page uses the latest available AfroFuel row updated ${date}. Treat it as a planning estimate and verify the local pump, depot, or supplier price before buying fuel or quoting transport.`,
    },
    {
      q: `Can I compare ${row.name} with another African country?`,
      a: `Yes. Use the comparison tool to compare ${row.name} against nearby ${REGION_LABELS[row.region] || 'African'} markets or any other country in the AfroFuel table.`,
    },
  ];
}

function htmlPage(row, rows) {
  const slug = countrySlug(row);
  const url = `${BASE_URL}/tools/fuel-tracker/${slug}/`;
  const flag = countryFlag(row.code);
  const date = formatDate(row.last_updated);
  const snapshotDate = row.last_updated || readJson(SNAPSHOT_PATH).source_reviewed_at || '2026-06-12';
  const region = REGION_LABELS[row.region] || 'Africa';
  const estimate = monthlyGeneratorEstimate(row);
  const related = relatedCountries(row, rows);
  const faqs = faqItems(row, rows, estimate);
  const cities = CITY_HINTS[row.code] || ['major cities', 'fuel stations'];
  const petrolRelation = relationToRegion(row, rows, 'petrol');
  const title = row.name.length >= 20
    ? `Fuel prices in ${row.name} | AfroFuel`
    : `Fuel prices in ${row.name}: petrol, diesel and LPG | AfroFuel`;
  const description = `Latest available fuel prices in ${row.name}: petrol ${priceLocal(row, 'petrol')}, diesel ${priceLocal(row, 'diesel')}, LPG ${priceLocal(row, 'lpg')}. Compare generator fuel costs and African countries.`;
  const compareHref = `/tools/fuel-tracker/?country=${encodeURIComponent(row.code)}#fuel-compare`;
  const generatorHref = `/tools/fuel-tracker/?country=${encodeURIComponent(row.code)}#generator-cost`;
  const ogImage = ogImageFor(slug);
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'AfroTools', item: `${BASE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'AfroFuel', item: `${BASE_URL}/tools/fuel-tracker/` },
      { '@type': 'ListItem', position: 3, name: row.name, item: url },
    ],
  };
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Fuel prices in ${row.name}`,
    description,
    url,
    inLanguage: 'en',
    dateModified: snapshotDate,
    isPartOf: {
      '@type': 'WebSite',
      name: 'AfroTools',
      url: `${BASE_URL}/`,
    },
    about: { '@id': url },
  };
  const datasetSchema = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': url,
    name: `AfroFuel ${row.name} fuel price snapshot`,
    description: `Latest available petrol, diesel, and LPG price snapshot for ${row.name}. Prices may vary by city, station, supplier, and timing.`,
    url,
    dateModified: snapshotDate,
    temporalCoverage: snapshotDate,
    inLanguage: 'en',
    creator: {
      '@type': 'Organization',
      name: 'AfroTools',
      url: `${BASE_URL}/`,
    },
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'Petrol price', unitText: `${row.currency} and USD per liter` },
      { '@type': 'PropertyValue', name: 'Diesel price', unitText: `${row.currency} and USD per liter` },
      { '@type': 'PropertyValue', name: 'LPG price', unitText: `${row.currency} and USD per kg` },
    ],
    distribution: {
      '@type': 'DataDownload',
      encodingFormat: 'application/json',
      contentUrl: `${BASE_URL}/data/fuel/latest.json`,
    },
  };
  const priceItemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${row.name} petrol, diesel and LPG prices`,
    numberOfItems: 3,
    itemListElement: ['petrol', 'diesel', 'lpg'].map((fuel, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Thing',
        name: `${row.name} ${fuel === 'lpg' ? 'LPG' : fuel} price`,
        additionalProperty: priceProperties(row, fuel),
      },
    })),
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${escapeHtml(url)}">
<meta name="robots" content="index, follow">
<link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${escapeHtml(ogImage)}">
<meta property="og:url" content="${escapeHtml(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="AfroTools">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${escapeHtml(ogImage)}">
<meta property="article:modified_time" content="${escapeHtml(snapshotDate)}">
<link rel="stylesheet" href="/assets/css/tokens.min.css?v=ee859bb4">
<link rel="stylesheet" href="/assets/css/global.min.css?v=e7ad73c8">
<script type="application/ld+json">${escapeJson(webPageSchema)}</script>
<script type="application/ld+json">${escapeJson(datasetSchema)}</script>
<script type="application/ld+json">${escapeJson(priceItemListSchema)}</script>
<script type="application/ld+json">${escapeJson(breadcrumbSchema)}</script>
<script type="application/ld+json">${escapeJson(faqSchema)}</script>
<style>
  :root { color-scheme: light; }
  body { margin: 0; background: #f6f8f5; color: #142018; font-family: "DM Sans", Arial, sans-serif; }
  .fuel-country-shell { width: min(1120px, calc(100% - 32px)); margin: 0 auto; }
  .fuel-country-hero { padding: 54px 0 32px; background: linear-gradient(180deg, #eef6ef 0%, #f6f8f5 100%); border-bottom: 1px solid rgba(20,32,24,.09); }
  .fuel-breadcrumb { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; color: #5d6b62; font-size: .92rem; margin-bottom: 20px; }
  .fuel-breadcrumb a { color: #235c39; font-weight: 700; text-decoration: none; }
  .fuel-country-grid { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(320px, .8fr); gap: 28px; align-items: stretch; }
  .fuel-country-kicker { display: inline-flex; align-items: center; gap: 8px; padding: 7px 12px; border-radius: 999px; background: #fff; color: #235c39; font-weight: 800; border: 1px solid rgba(35,92,57,.14); }
  h1 { margin: 16px 0 12px; font-size: clamp(2.15rem, 5vw, 4.5rem); line-height: .96; letter-spacing: 0; max-width: 850px; }
  .fuel-lede { max-width: 760px; color: #506158; font-size: 1.1rem; line-height: 1.65; margin: 0; }
  .fuel-trust { margin-top: 18px; color: #5d6b62; font-size: .96rem; }
  .fuel-price-card, .fuel-panel { background: #fff; border: 1px solid rgba(20,32,24,.1); border-radius: 8px; box-shadow: 0 18px 40px rgba(20,32,24,.08); }
  .fuel-price-card { padding: 22px; }
  .fuel-card-top { display: flex; justify-content: space-between; gap: 18px; align-items: flex-start; margin-bottom: 18px; }
  .fuel-flag { font-size: 2rem; width: 58px; height: 58px; border-radius: 8px; display: grid; place-items: center; background: #f2f6f0; }
  .fuel-date { color: #64746a; font-size: .9rem; margin-top: 5px; }
  .fuel-price-list { display: grid; gap: 12px; }
  .fuel-price-row { display: grid; grid-template-columns: 88px 1fr; gap: 12px; padding: 14px; border-radius: 8px; background: #f8faf7; border: 1px solid rgba(20,32,24,.08); }
  .fuel-price-row span:first-child { color: #59685f; font-size: .9rem; font-weight: 800; }
  .fuel-local { display: block; font-size: 1.3rem; font-weight: 900; color: #142018; }
  .fuel-usd { display: block; color: #6c7a70; font-size: .9rem; margin-top: 2px; }
  .fuel-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
  .fuel-btn { display: inline-flex; align-items: center; justify-content: center; min-height: 42px; padding: 0 14px; border-radius: 8px; border: 1px solid rgba(20,32,24,.14); background: #fff; color: #183124; font-weight: 850; text-decoration: none; }
  .fuel-btn.primary { background: #235c39; border-color: #235c39; color: #fff; }
  .fuel-main { padding: 34px 0 60px; }
  .fuel-section { margin-top: 26px; }
  .fuel-section h2 { font-size: clamp(1.45rem, 3vw, 2rem); margin: 0 0 10px; }
  .fuel-section p { color: #506158; line-height: 1.65; }
  .fuel-panels { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-top: 16px; }
  .fuel-panel { padding: 18px; box-shadow: none; }
  .fuel-panel strong { display: block; font-size: 1.1rem; margin-bottom: 8px; }
  .fuel-links { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 14px; }
  .fuel-link-card { padding: 14px; border-radius: 8px; background: #fff; border: 1px solid rgba(20,32,24,.1); color: #183124; text-decoration: none; font-weight: 850; }
  .fuel-link-card span { display: block; margin-top: 5px; color: #64746a; font-size: .9rem; font-weight: 600; }
  .fuel-faq details { background: #fff; border: 1px solid rgba(20,32,24,.1); border-radius: 8px; padding: 0; margin-top: 10px; }
  .fuel-faq summary { cursor: pointer; padding: 16px 18px; font-weight: 900; }
  .fuel-faq details p { padding: 0 18px 18px; margin: 0; }
  .fuel-note { padding: 16px 18px; border-radius: 8px; background: #eef6ef; color: #415247; border: 1px solid rgba(35,92,57,.12); }
  @media (max-width: 760px) {
    .fuel-country-shell { width: min(100% - 24px, 1120px); }
    .fuel-country-hero { padding-top: 36px; }
    .fuel-country-grid, .fuel-panels, .fuel-links { grid-template-columns: 1fr; }
    .fuel-price-row { grid-template-columns: 1fr; }
    .fuel-btn { width: 100%; }
  }
</style>
</head>
<body>
<afro-navbar></afro-navbar>
<header class="fuel-country-hero">
  <div class="fuel-country-shell">
    <nav class="fuel-breadcrumb" aria-label="Breadcrumb">
      <a href="/">AfroTools</a><span>/</span>
      <a href="/tools/fuel-tracker/">AfroFuel</a><span>/</span>
      <span>${escapeHtml(row.name)}</span>
    </nav>
    <div class="fuel-country-grid">
      <div>
        <div class="fuel-country-kicker"><span aria-hidden="true">${flag}</span><span>${escapeHtml(region)} fuel prices</span></div>
        <h1>Fuel prices in ${escapeHtml(row.name)}</h1>
        <p class="fuel-lede">Check the latest available petrol, diesel, and LPG snapshot for ${escapeHtml(row.name)} in ${escapeHtml(row.currency)}. Use this page to plan generator spend, compare ${escapeHtml(row.name)} with other African countries, and sanity-check transport or household fuel budgets.</p>
        <p class="fuel-trust">Updated ${escapeHtml(date)} &middot; Latest available prices &middot; Verify locally before purchase.</p>
      </div>
      <aside class="fuel-price-card" aria-label="${escapeHtml(row.name)} fuel price summary">
        <div class="fuel-card-top">
          <div>
            <strong>${escapeHtml(row.name)}</strong>
            <div class="fuel-date">Last updated ${escapeHtml(date)}</div>
          </div>
          <div class="fuel-flag" aria-hidden="true">${flag}</div>
        </div>
        <div class="fuel-price-list">
          <div class="fuel-price-row"><span>Petrol</span><div><strong class="fuel-local">${escapeHtml(priceLocal(row, 'petrol'))}</strong><span class="fuel-usd">${escapeHtml(priceUsd(row, 'petrol'))} comparison</span></div></div>
          <div class="fuel-price-row"><span>Diesel</span><div><strong class="fuel-local">${escapeHtml(priceLocal(row, 'diesel'))}</strong><span class="fuel-usd">${escapeHtml(priceUsd(row, 'diesel'))} comparison</span></div></div>
          <div class="fuel-price-row"><span>LPG</span><div><strong class="fuel-local">${escapeHtml(priceLocal(row, 'lpg'))}</strong><span class="fuel-usd">${escapeHtml(priceUsd(row, 'lpg'))} comparison</span></div></div>
        </div>
        <div class="fuel-actions">
          <a class="fuel-btn primary" href="${escapeHtml(compareHref)}">Compare ${escapeHtml(row.name)} with another African country</a>
          <a class="fuel-btn" href="${escapeHtml(generatorHref)}">Open generator calculator</a>
        </div>
      </aside>
    </div>
  </div>
</header>
<main class="fuel-country-shell fuel-main">
  <section class="fuel-section" aria-labelledby="generator-estimate">
    <h2 id="generator-estimate">Generator cost estimate in ${escapeHtml(row.name)}</h2>
    <p>A ${escapeHtml(estimate.generatorSize)} petrol generator running ${estimate.hoursPerDay} hours per day for ${estimate.daysPerMonth} days per month uses about ${formatNumber(estimate.litresPerMonth)} litres monthly in this simple planning model.</p>
    <div class="fuel-panels">
      <div class="fuel-panel"><strong>Monthly estimate</strong><span>${escapeHtml(estimate.local)}</span><p>${escapeHtml(estimate.usd)} for comparison.</p></div>
      <div class="fuel-panel"><strong>Fuel used</strong><span>${formatNumber(estimate.litresPerMonth)} litres/month</span><p>Assumes 1.5 litres per hour.</p></div>
      <div class="fuel-panel"><strong>Price basis</strong><span>${escapeHtml(priceLocal(row, 'petrol'))}</span><p>Use local pump prices for final decisions.</p></div>
    </div>
  </section>
  <section class="fuel-section" aria-labelledby="country-context">
    <h2 id="country-context">How to use these ${escapeHtml(row.name)} fuel prices</h2>
    <p>AfroFuel shows ${escapeHtml(row.name)} prices in local currency first because households, drivers, shops, and procurement teams usually pay locally. The USD values are secondary comparison figures for checking ${escapeHtml(row.name)} against the wider African table.</p>
    <p>In this snapshot, ${escapeHtml(row.name)} petrol is ${escapeHtml(petrolRelation)}. Prices may still differ between ${escapeHtml(cities[0])}, ${escapeHtml(cities[1])}, rural stations, bulk suppliers, and border corridors.</p>
    <div class="fuel-note">AfroFuel shows the latest available fuel-price snapshots. Prices may vary by city, station, supplier, and timing. Use this as a planning estimate and verify locally before buying fuel or quoting transport.</div>
  </section>
  <section class="fuel-section" aria-labelledby="related-tools">
    <h2 id="related-tools">Plan fuel, transport, and backup power</h2>
    <div class="fuel-links">
      <a class="fuel-link-card" href="/tools/fuel-tracker/#generator-cost">Generator fuel calculator<span>Estimate monthly generator spend.</span></a>
      <a class="fuel-link-card" href="/tools/route-fares/">Route fares<span>Check transport costs affected by fuel.</span></a>
      <a class="fuel-link-card" href="/tools/backup-power-costs/">Backup power costs<span>Compare generator, LPG, inverter, and solar backups.</span></a>
      <a class="fuel-link-card" href="/tools/solar-roi/">Solar ROI calculator<span>Compare solar payback against generator fuel spend.</span></a>
      <a class="fuel-link-card" href="/tools/cost-of-living/">Cost of living comparison<span>Put fuel and transport into a wider budget.</span></a>
    </div>
  </section>
  <section class="fuel-section" aria-labelledby="related-countries">
    <h2 id="related-countries">Related African fuel price pages</h2>
    <div class="fuel-links">
      ${related.map((candidate) => `<a class="fuel-link-card" href="/tools/fuel-tracker/${escapeHtml(countrySlug(candidate))}/">${escapeHtml(candidate.name)}<span>${escapeHtml(priceLocal(candidate, 'petrol'))} petrol</span></a>`).join('\n      ')}
    </div>
  </section>
  <section class="fuel-section fuel-faq" aria-labelledby="country-faq">
    <h2 id="country-faq">Frequently asked questions</h2>
    ${faqs.map((faq) => `<details><summary>${escapeHtml(faq.q)}</summary><p>${escapeHtml(faq.a)}</p></details>`).join('\n    ')}
  </section>
</main>
<afro-footer></afro-footer>
<script>
(function(){
  var payload = {
    event: 'fuel_country_page_viewed',
    tool: 'afrofuel',
    country: '${escapeHtml(row.code)}',
    fuelType: 'petrol',
    region: '${escapeHtml(row.region)}',
    generatorSize: '',
    hoursPerDay: '',
    daysPerMonth: '',
    currency: '${escapeHtml(row.currency)}',
    source: 'table'
  };
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
  } catch (err) {}
  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'fuel_country_page_viewed', {
        country: payload.country,
        fuelType: payload.fuelType,
        region: payload.region,
        generatorSize: payload.generatorSize,
        hoursPerDay: payload.hoursPerDay,
        daysPerMonth: payload.daysPerMonth,
        currency: payload.currency,
        source: payload.source
      });
    }
  } catch (err) {}
})();
</script>
<script src="/assets/js/components/navbar.min.js?v=4f165426" defer></script>
<script src="/assets/js/components/footer.min.js?v=5d66142b" defer></script>
</body>
</html>
`;
}

function main() {
  const snapshot = readJson(SNAPSHOT_PATH);
  const rows = (snapshot.countries || [])
    .filter((row) => row && row.code && row.name && row.petrol && row.diesel && row.lpg)
    .sort((a, b) => a.name.localeCompare(b.name));
  const slugs = new Map();
  const planned = [];

  for (const row of rows) {
    const slug = countrySlug(row);
    if (slugs.has(slug)) {
      throw new Error(`Duplicate fuel country slug "${slug}" for ${row.name} and ${slugs.get(slug)}`);
    }
    slugs.set(slug, row.name);
    planned.push({
      row,
      slug,
      dir: path.join(OUT_DIR, slug),
      file: path.join(OUT_DIR, slug, 'index.html'),
      html: htmlPage(row, rows),
    });
  }

  const mismatches = [];
  for (const page of planned) {
    if (CHECK) {
      if (!fs.existsSync(page.file)) {
        mismatches.push(`missing ${path.relative(ROOT, page.file)}`);
        continue;
      }
      const existing = fs.readFileSync(page.file, 'utf8');
      if (existing !== page.html) mismatches.push(`stale ${path.relative(ROOT, page.file)}`);
      continue;
    }

    fs.mkdirSync(page.dir, { recursive: true });
    fs.writeFileSync(page.file, page.html, 'utf8');
  }

  if (CHECK && mismatches.length) {
    console.error(`Fuel country pages are not up to date:\n${mismatches.join('\n')}`);
    process.exit(1);
  }

  console.log(`${CHECK ? 'Checked' : 'Generated'} ${planned.length} fuel country pages.`);
}

main();

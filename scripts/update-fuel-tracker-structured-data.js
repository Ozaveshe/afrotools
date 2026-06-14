#!/usr/bin/env node
/**
 * Refresh JSON-LD on /tools/fuel-tracker/ from the visible page FAQ and
 * data/fuel/latest.json.
 *
 * Usage:
 *   node scripts/update-fuel-tracker-structured-data.js
 *   node scripts/update-fuel-tracker-structured-data.js --check
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAGE_PATH = path.join(ROOT, 'tools', 'fuel-tracker', 'index.html');
const SNAPSHOT_PATH = path.join(ROOT, 'data', 'fuel', 'latest.json');
const BASE_URL = 'https://afrotools.com';
const CHECK = process.argv.includes('--check');

const SLUG_OVERRIDES = {
  CI: 'cote-divoire',
  CD: 'dr-congo',
  CG: 'congo',
  CV: 'cabo-verde',
  ST: 'sao-tome-and-principe',
};

function escapeJsonForHtml(value) {
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

function stripHtml(value) {
  return String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&mdash;/g, '-')
    .replace(/&middot;/g, '·')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractVisibleFaqs(html) {
  const faqs = [];
  const itemPattern = /<div class="faq-item">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
  let match;

  while ((match = itemPattern.exec(html)) !== null) {
    const block = match[0];
    const question = block.match(/<button[^>]*class="faq-question"[^>]*>([\s\S]*?)<\/button>/i);
    const answer = block.match(/<div class="faq-answer-inner">([\s\S]*?)<\/div>/i);
    if (!question || !answer) continue;
    faqs.push({
      '@type': 'Question',
      name: stripHtml(question[1]),
      acceptedAnswer: {
        '@type': 'Answer',
        text: stripHtml(answer[1]),
      },
    });
  }

  if (!faqs.length) {
    throw new Error('No visible fuel tracker FAQ items found for FAQPage schema.');
  }

  return faqs;
}

function unitText(fuel) {
  return fuel === 'lpg' ? 'kg' : 'liter';
}

function fuelLabel(fuel) {
  return fuel === 'lpg' ? 'LPG' : fuel.charAt(0).toUpperCase() + fuel.slice(1);
}

function fuelProperties(row, fuel) {
  const item = row[fuel] || {};
  const properties = [
    {
      '@type': 'PropertyValue',
      name: `${fuelLabel(fuel)} price in ${row.currency}`,
      value: item.price,
      unitText: `${row.currency} per ${unitText(fuel)}`,
    },
  ];

  if (item.usd != null) {
    properties.push({
      '@type': 'PropertyValue',
      name: `${fuelLabel(fuel)} USD comparison`,
      value: item.usd,
      unitText: `USD per ${unitText(fuel)}`,
    });
  }

  if (item.change) {
    properties.push({
      '@type': 'PropertyValue',
      name: `${fuelLabel(fuel)} trend`,
      value: item.change,
    });
  }

  if (item.change_pct != null) {
    properties.push({
      '@type': 'PropertyValue',
      name: `${fuelLabel(fuel)} percentage change`,
      value: item.change_pct,
      unitText: 'percent',
    });
  }

  return properties;
}

function buildItemList(rows) {
  function priceProperty(row, fuel) {
    const item = row[fuel] || {};
    const unit = unitText(fuel);
    return [
      {
        '@type': 'PropertyValue',
        name: `${fuelLabel(fuel)} local price`,
        value: item.price,
        unitText: `${row.currency} per ${unit}`,
      },
      item.usd == null ? null : {
        '@type': 'PropertyValue',
        name: `${fuelLabel(fuel)} USD comparison`,
        value: item.usd,
        unitText: `USD per ${unit}`,
      },
    ].filter(Boolean);
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${BASE_URL}/tools/fuel-tracker/`,
    name: 'AfroFuel country price comparison table',
    description: 'Country comparison list for latest available petrol, diesel, and LPG prices across Africa.',
    itemListOrder: 'https://schema.org/ItemListUnordered',
    numberOfItems: rows.length,
    itemListElement: rows.map((row, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${BASE_URL}/tools/fuel-tracker/${countrySlug(row)}/`,
      item: {
        '@type': 'Thing',
        name: `${row.name} fuel prices`,
        identifier: row.code,
        additionalProperty: [
          { '@type': 'PropertyValue', name: 'Currency', value: row.currency },
          { '@type': 'PropertyValue', name: 'Region', value: row.region },
          ...priceProperty(row, 'petrol'),
          ...priceProperty(row, 'diesel'),
          ...priceProperty(row, 'lpg'),
          { '@type': 'PropertyValue', name: 'Last updated', value: row.last_updated },
        ],
      },
    })),
  };
}

function buildSchemas(html, snapshot) {
  const rows = (snapshot.countries || [])
    .filter((row) => row && row.code && row.name && row.petrol && row.diesel && row.lpg)
    .sort((a, b) => a.name.localeCompare(b.name));
  const dateModified = snapshot.source_reviewed_at || String(snapshot.timestamp || '').slice(0, 10);
  const image = `${BASE_URL}/assets/img/tools/fuel-tracker.webp`;
  const description = 'Compare fuel prices in Africa, including petrol in Nigeria and diesel in Ghana. Estimate generator fuel costs and view local currency prices.';

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      '@id': `${BASE_URL}/tools/fuel-tracker/`,
      name: 'AfroFuel Tracker',
      alternateName: 'AfroFuel',
      description,
      url: `${BASE_URL}/tools/fuel-tracker/`,
      inLanguage: 'en',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      dateModified,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      creator: {
        '@type': 'Organization',
        name: 'AfroTools',
        url: `${BASE_URL}/`,
      },
      image,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${BASE_URL}/tools/fuel-tracker/`,
      name: 'AfroFuel Tracker',
      url: `${BASE_URL}/tools/fuel-tracker/`,
      description,
      inLanguage: 'en',
      dateModified,
      isPartOf: {
        '@type': 'WebSite',
        name: 'AfroTools',
        url: `${BASE_URL}/`,
      },
      about: { '@id': `${BASE_URL}/tools/fuel-tracker/` },
      mainEntity: { '@id': `${BASE_URL}/tools/fuel-tracker/` },
      image,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      '@id': `${BASE_URL}/tools/fuel-tracker/`,
      name: 'AfroFuel latest available African fuel price snapshots',
      description: 'Latest available petrol, diesel, and LPG fuel-price snapshots across African countries. Prices may vary by city, station, supplier, and timing.',
      url: `${BASE_URL}/tools/fuel-tracker/`,
      dateModified,
      temporalCoverage: String(snapshot.timestamp || dateModified).slice(0, 10),
      inLanguage: 'en',
      creator: {
        '@type': 'Organization',
        name: 'AfroTools',
        url: `${BASE_URL}/`,
      },
      variableMeasured: [
        { '@type': 'PropertyValue', name: 'Petrol price', unitText: 'local currency and USD per liter' },
        { '@type': 'PropertyValue', name: 'Diesel price', unitText: 'local currency and USD per liter' },
        { '@type': 'PropertyValue', name: 'LPG price', unitText: 'local currency and USD per kg' },
      ],
      distribution: {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: `${BASE_URL}/data/fuel/latest.json`,
      },
      isAccessibleForFree: true,
      license: `${BASE_URL}/terms/`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'AfroTools', item: `${BASE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Tools', item: `${BASE_URL}/tools/` },
        { '@type': 'ListItem', position: 3, name: 'AfroFuel', item: `${BASE_URL}/tools/fuel-tracker/` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: extractVisibleFaqs(html),
    },
    buildItemList(rows),
  ];
}

function schemaHtml(schemas) {
  return schemas
    .map((schema) => `<script type="application/ld+json">\n${escapeJsonForHtml(schema)}\n</script>`)
    .join('\n');
}

function replacePageSchemas(html, schemas) {
  const headMatch = html.match(/<head>[\s\S]*?<\/head>/i);
  if (!headMatch) throw new Error('Unable to find <head> in fuel tracker page.');
  if (!/<\/body>/i.test(html)) throw new Error('Unable to find </body> in fuel tracker page.');

  const cleanHead = headMatch[0]
    .replace(/\n?<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n');
  const withoutHeadSchemas = html.slice(0, headMatch.index) + cleanHead + html.slice(headMatch.index + headMatch[0].length);
  const withoutSchemas = withoutHeadSchemas
    .replace(/\n?<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n');
  return withoutSchemas.replace(/<\/body>/i, `${schemaHtml(schemas)}\n</body>`);
}

function main() {
  const html = fs.readFileSync(PAGE_PATH, 'utf8');
  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
  const schemas = buildSchemas(html, snapshot);
  const updated = replacePageSchemas(html, schemas);

  if (CHECK) {
    if (updated !== html) {
      console.error('Fuel tracker structured data is not up to date.');
      process.exit(1);
    }
    console.log(`Checked ${schemas.length} fuel tracker schema blocks.`);
    return;
  }

  fs.writeFileSync(PAGE_PATH, updated, 'utf8');
  console.log(`Updated ${schemas.length} fuel tracker schema blocks.`);
}

main();

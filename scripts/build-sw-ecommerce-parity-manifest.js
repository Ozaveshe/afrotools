#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const INVENTORY = path.join(ROOT, 'reports/swahili-free-app-parity-inventory.json');
const OUTPUT = path.join(ROOT, 'data/localization/sw-ecommerce-parity-manifest.json');
const ACCEPTED_FAMILY = 'pricing-foundations';
const ACCEPTANCE_RECEIPT = 'reports/sw-ecommerce-acceptance/pricing-foundations.json';

const FAMILY_IDS = Object.freeze({
  'pan-african-vat': ['vat-calc-pan-african'],
  'east-africa-vat': ['ke-vat', 'tz-vat', 'ug-vat', 'rw-vat', 'bi-vat', 'et-vat'],
  'southern-africa-vat': ['ao-vat', 'za-vat', 'bw-vat', 'sz-vat', 'ls-vat', 'mw-vat', 'mz-vat', 'na-vat', 'zm-vat', 'zw-vat'],
  'west-africa-vat-a': ['ng-vat', 'gh-vat', 'bj-vat', 'bf-vat', 'cv-vat', 'ci-vat'],
  'west-africa-vat-b': ['gm-vat', 'gn-vat', 'gw-vat', 'lr-vat', 'ml-vat', 'mr-vat', 'ne-vat', 'sn-vat', 'sl-vat', 'tg-vat'],
  'central-africa-vat': ['cm-vat', 'cf-vat', 'td-vat', 'cg-vat', 'cd-vat', 'gq-vat', 'ga-vat', 'st-vat'],
  'north-africa-vat': ['dz-vat', 'eg-vat', 'ma-vat', 'sd-vat', 'tn-vat'],
  'indian-ocean-vat': ['km-vat', 'mg-vat', 'mu-vat', 'sc-vat'],
  'horn-africa-vat': ['dj-vat', 'so-vat'],
  'pricing-foundations': ['profit-margin', 'markup-calc', 'discount-calc'],
  'commerce-operations': ['break-even', 'inventory', 'shipping-calc'],
  'business-workshops': ['business-name-gen', 'business-plan-builder', 'idea-board'],
  'merchant-operations': ['market-stall-profit', 'paystack-calculator']
});

const SHARED_SCRIPT = /(?:navbar|footer|bundles\/core|related-tools|lazy-analytics|jspdf)/;

function routeKey(route) {
  return route && `${route.replace(/\/$/, '')}/`;
}

function routeFile(route) {
  if (!route) return null;
  const stem = route.replace(/^\//, '').replace(/\/$/, '');
  const candidates = [`${stem}.html`, `${stem}/index.html`];
  return candidates.find(candidate => fs.existsSync(path.join(ROOT, candidate))) || null;
}

function scriptsFor(file) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  return [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)]
    .map(match => match[1].split('?')[0].replace(/^\//, ''))
    .filter(script => !SHARED_SCRIPT.test(script));
}

function artworkFor(id) {
  const extensions = ['webp', 'png', 'jpg', 'jpeg', 'svg'];
  const file = extensions
    .map(extension => `assets/img/tools/${id}.${extension}`)
    .find(candidate => fs.existsSync(path.join(ROOT, candidate)));
  return { imageId: id, file: file || null, state: file ? 'present' : 'missing' };
}

function ownerContract(file) {
  const scripts = scriptsFor(file);
  const engines = scripts.filter(script => script.includes('/engines/'));
  const controllers = scripts.filter(script => script.includes('/pages/'));
  const libraries = scripts.filter(script => !engines.includes(script) && !controllers.includes(script));
  return {
    englishPage: [file],
    englishEngine: engines.length ? engines : [`${file}#inline-engine`],
    englishController: controllers.length ? controllers : [`${file}#inline-controller`],
    sharedLibraries: libraries
  };
}

function familyIndex() {
  const index = new Map();
  for (const [family, ids] of Object.entries(FAMILY_IDS)) {
    for (const id of ids) {
      if (index.has(id)) throw new Error(`Duplicate family assignment for ${id}.`);
      index.set(id, family);
    }
  }
  return index;
}

function buildManifest() {
  const inventory = JSON.parse(fs.readFileSync(INVENTORY, 'utf8'));
  const sourceRows = inventory.rows.filter(row => row.categoryKey === 'ecommerce' && !row.accepted);
  if (sourceRows.length !== 63) throw new Error(`Expected 63 unaccepted Ecommerce rows, found ${sourceRows.length}.`);

  const families = familyIndex();
  if (families.size !== 63) throw new Error(`Expected 63 no-overlap family assignments, found ${families.size}.`);

  const rows = sourceRows.map(row => {
    const family = families.get(row.englishId);
    if (!family) throw new Error(`Missing family assignment for ${row.englishId}.`);
    const englishFile = routeFile(row.englishRoute);
    if (!englishFile) throw new Error(`Missing English owner for ${row.englishId}: ${row.englishRoute}`);
    const swahiliFile = row.primarySwahiliFile || routeFile(row.primarySwahiliRoute);
    if (row.primarySwahiliRoute && (!swahiliFile || !fs.existsSync(path.join(ROOT, swahiliFile)))) {
      throw new Error(`Missing mapped Swahili file for ${row.englishId}.`);
    }
    const owners = ownerContract(englishFile);
    const accepted = family === ACCEPTED_FAMILY;
    return {
      family,
      english: {
        id: row.englishId,
        name: row.englishName,
        route: routeKey(row.englishRoute),
        file: englishFile
      },
      swahili: {
        route: routeKey(row.primarySwahiliRoute),
        file: swahiliFile || null,
        inventoryState: row.state,
        ownerState: row.primarySwahiliRoute ? (accepted ? 'mapped-accepted-scoped' : 'mapped-unaccepted') : 'missing',
        maintainedRuntimeOwners: row.primarySwahiliRoute
          ? [...owners.englishEngine, ...owners.englishController, ...owners.sharedLibraries]
          : []
      },
      owners,
      productContract: {
        jurisdiction: row.englishId.endsWith('-vat') ? row.englishId.slice(0, -4).toUpperCase() : 'user-selected-or-neutral',
        preserveEnglishInputsOutputs: true,
        preserveInvalidBoundaryAndStaleClearing: true,
        preserveAdvertisedExports: true,
        sponsorIndependent: true,
        explicitAiConsentIfNetworked: true
      },
      artwork: artworkFor(row.englishId),
      aiRouting: {
        englishContext: `data/ai/tool-context/${row.englishId}.json`,
        scopedRouteOwner: 'data/localization/sw-ecommerce-parity-manifest.json',
        scopedRoute: routeKey(row.primarySwahiliRoute),
        state: row.primarySwahiliRoute ? 'manifest-mapped-central-fail-closed' : 'missing-swahili-route'
      },
      acceptance: {
        state: accepted ? 'accepted-scoped' : 'pending',
        browserReceipt: accepted ? ACCEPTANCE_RECEIPT : null,
        exportReceipt: accepted ? ACCEPTANCE_RECEIPT : null,
        seoReceipt: accepted ? ACCEPTANCE_RECEIPT : null,
        sourceReceipt: accepted ? ACCEPTANCE_RECEIPT : null
      }
    };
  });

  return {
    schemaVersion: 1,
    programme: 'swahili-free-app-parity-ecommerce',
    locale: 'sw',
    coordinatorBaseSha: '8354e321ff34caf60a33a3393cd0dcddfb00c023',
    source: 'reports/swahili-free-app-parity-inventory.json#categoryKey=ecommerce&accepted=false',
    constraints: {
      exactRows: 63,
      noOverlap: true,
      noGenericRuntimeReplacement: true,
      acceptanceIsFailClosed: true,
      centralAcceptanceLedgerOutOfScope: true
    },
    families: Object.entries(FAMILY_IDS).map(([id, ids]) => ({ id, rowCount: ids.length, englishIds: ids })),
    rows
  };
}

function content(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function run(options = {}) {
  const next = content(buildManifest());
  const current = fs.existsSync(OUTPUT) ? fs.readFileSync(OUTPUT, 'utf8') : '';
  if (options.check && current !== next) throw new Error('data/localization/sw-ecommerce-parity-manifest.json is stale.');
  if (!options.check && current !== next) fs.writeFileSync(OUTPUT, next, 'utf8');
  return JSON.parse(next);
}

if (require.main === module) {
  try {
    const manifest = run({ check: process.argv.includes('--check') });
    console.log(JSON.stringify({ rows: manifest.rows.length, families: manifest.families.length }, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { ACCEPTED_FAMILY, FAMILY_IDS, buildManifest, run };

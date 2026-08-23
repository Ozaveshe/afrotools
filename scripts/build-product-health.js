#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const health = require('../assets/js/lib/product-health');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'status', 'product-health.json');
const PAGE = path.join(ROOT, 'status', 'index.html');
const CHECK = process.argv.includes('--check');
const START = '<!-- PRODUCT_HEALTH_SNAPSHOT_START -->';
const END = '<!-- PRODUCT_HEALTH_SNAPSHOT_END -->';

function readJson(relative) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'));
}

function latest(values) {
  return values.filter(Boolean).sort().slice(-1)[0] || null;
}

function addDays(value, days) {
  if (!value || !Number.isFinite(Number(days))) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  date.setUTCDate(date.getUTCDate() + Number(days));
  return date.toISOString().slice(0, 10);
}

function item(input) {
  const status = health.deriveStatus(input);
  return {
    id: input.id,
    name: input.name,
    status,
    status_label: health.LABELS[status],
    coverage: input.coverage,
    last_verified: health.toIso(input.lastVerified),
    next_expected_check: input.nextExpectedCheck || addDays(input.lastVerified, input.cadenceDays),
    reason: input.reason || null,
    source_kind: input.sourceKind
  };
}

function buildSnapshot() {
  const meta = readJson('data/_meta.json');
  const fuel = readJson('data/fuel/latest.json');
  const mobileMoney = readJson('data/fintech/mobile-money-tariffs.json');
  const electricity = readJson('data/energy/electricity-tariffs.json');
  const forex = readJson('data/forex/latest.json');
  const sourceRegistry = readJson('data/source-registry.json');
  const scholarshipSources = readJson('data/scholarships/official-sources.json');
  const transport = readJson('data/transport/source-status.json');
  const afrostream = readJson('data/afrostream/creators-fallback.json');

  const payeSources = sourceRegistry.sources.filter((source) => {
    const applies = source.appliesTo || [];
    return applies.includes('salary') && applies.includes('tax') && /^paye-/.test(source.id || '');
  });
  const payeCountries = new Set(payeSources.flatMap((source) => source.countryCodes || []).filter((code) => code !== 'ALL'));
  const payeLastVerified = latest(payeSources.map((source) => source.lastCheckedAt || source.lastReviewedAt));
  const transportSummary = transport.summary || {};

  const platform = [
    item({
      id: 'website', name: 'Website', declaredStatus: 'partial',
      lastVerified: sourceRegistry.updatedAt, cadenceDays: 30,
      coverageTotal: 1, coverageVerified: 0,
      coverage: 'Static site and offline fallback are release-checked; live reachability is checked separately.',
      reason: 'No live request is required to render this status page.', sourceKind: 'release_build'
    }),
    item({
      id: 'search-directory', name: 'Search and directory', declaredStatus: 'partial',
      lastVerified: sourceRegistry.updatedAt, cadenceDays: 30,
      coverageTotal: 2, coverageVerified: 1,
      coverage: 'Canonical registry and static directory available; live search hydration is not assumed.',
      sourceKind: 'canonical_registry'
    }),
    item({
      id: 'apis-functions', name: 'APIs and functions', declaredStatus: 'unknown',
      coverage: 'The public status endpoint is reachable only when this function responds; dependencies are not inferred.',
      reason: 'Live function health is checked progressively when available.', sourceKind: 'runtime_check'
    }),
    item({
      id: 'authentication', name: 'Authentication', declaredStatus: 'unknown',
      coverage: 'Authentication is not required for public tools or this status page.',
      reason: 'No anonymous status response is treated as proof of sign-in health.', sourceKind: 'runtime_check'
    })
  ];

  const products = [
    item({
      id: 'fuel', name: 'Fuel', declaredStatus: fuel.source_state === 'mixed' ? 'partial' : meta.fuel && meta.fuel.status,
      lastVerified: fuel.timestamp, cadenceDays: 7,
      coverageTotal: 54, coverageVerified: Number(fuel.official_verified_count || 0),
      coverage: fuel.countries.length + ' country planning rows; official row verification is tracked separately.',
      reason: fuel.source_note, sourceKind: 'committed_fallback'
    }),
    item({
      id: 'mobile-money', name: 'Mobile Money', declaredStatus: 'partial',
      lastVerified: mobileMoney.lastVerified, cadenceDays: 30,
      coverageTotal: 54, coverageVerified: mobileMoney.providers.length,
      coverage: mobileMoney.providers.length + ' provider tariff packs with official published tariff sources.',
      reason: 'Coverage is intentionally limited to verified provider tariffs.', sourceKind: 'official_tariff_ledger'
    }),
    item({
      id: 'electricity', name: 'Electricity', declaredStatus: 'partial',
      lastVerified: electricity.updated_at, cadenceDays: electricity.default_freshness_days,
      coverageTotal: 54, coverageVerified: new Set(electricity.records.map((row) => row.country_code)).size,
      coverage: electricity.records.length + ' tariff records across ' + new Set(electricity.records.map((row) => row.country_code)).size + ' markets.',
      reason: 'Unsupported and unverified markets are not presented as current tariff coverage.', sourceKind: 'official_tariff_ledger'
    }),
    item({
      id: 'fx', name: 'FX', declaredStatus: meta.forex && meta.forex.status,
      lastVerified: forex.timestamp, cadenceDays: 2,
      coverageTotal: Object.keys(forex.rates || {}).length, coverageVerified: Object.keys(forex.rates || {}).length,
      coverage: Object.keys(forex.rates || {}).length + ' quoted currencies in the committed fallback.',
      sourceKind: 'committed_fallback'
    }),
    item({
      id: 'paye-tax', name: 'PAYE and tax', declaredStatus: 'partial',
      lastVerified: payeLastVerified, cadenceDays: 90,
      coverageTotal: 54, coverageVerified: payeCountries.size,
      coverage: payeCountries.size + ' country PAYE source packs in the source registry.',
      reason: 'Country rules have different effective dates and review confidence.', sourceKind: 'source_registry'
    }),
    item({
      id: 'scholarships', name: 'Scholarships', declaredStatus: 'partial',
      lastVerified: scholarshipSources.updated_at, cadenceDays: 7,
      coverageTotal: scholarshipSources.sources.length,
      coverageVerified: scholarshipSources.sources.filter((source) => source.active !== false).length,
      coverage: scholarshipSources.sources.filter((source) => source.active !== false).length + ' active source definitions; live opportunity counts are checked separately.',
      sourceKind: 'official_source_ledger'
    }),
    item({
      id: 'transport', name: 'Transport',
      declaredStatus: transportSummary.brokenSources ? 'degraded' : (transportSummary.blockedSources || transportSummary.manualSources ? 'partial' : 'operational'),
      lastVerified: transportSummary.generatedAt, cadenceDays: 7,
      coverageTotal: transportSummary.sourceCount, coverageVerified: transportSummary.okSources,
      coverage: transportSummary.okSources + ' of ' + transportSummary.sourceCount + ' monitored sources responded cleanly.',
      reason: transportSummary.brokenSources + ' broken and ' + transportSummary.blockedSources + ' blocked sources remain visible as debt.',
      sourceKind: 'source_status_ledger'
    }),
    item({
      id: 'afrostream', name: 'AfroStream', declaredStatus: 'partial',
      lastVerified: afrostream.source.reviewed_at, cadenceDays: 7,
      coverageTotal: 407, coverageVerified: afrostream.creators.length,
      coverage: afrostream.creators.length + ' historical creator profiles remain available if live APIs fail.',
      reason: 'Live streams, creator snapshots and news are checked progressively; fallback metrics are not presented as current.',
      sourceKind: 'historical_fallback'
    })
  ];

  const snapshot = {
    schema_version: 1,
    contract: 'AfroStatus public health snapshot',
    generated_from: [
      'data/_meta.json',
      'data/source-registry.json',
      'data/fuel/latest.json',
      'data/fintech/mobile-money-tariffs.json',
      'data/energy/electricity-tariffs.json',
      'data/forex/latest.json',
      'data/scholarships/official-sources.json',
      'data/transport/source-status.json',
      'data/afrostream/creators-fallback.json'
    ],
    platform,
    products,
    live_overlays: ['/api/data-freshness', '/api/afrostream/health', '/status/release.json'],
    disclosure: 'Public-safe source summaries only. No credentials, internal hostnames, private logs or admin details.'
  };

  if (health.containsUnsafePublicText(snapshot)) throw new Error('Generated product health snapshot contains unsafe public text');
  return snapshot;
}

function stableJson(value) {
  return JSON.stringify(value, null, 2) + '\n';
}

function updatePage(snapshot) {
  const page = fs.readFileSync(PAGE, 'utf8');
  const start = page.indexOf(START);
  const end = page.indexOf(END);
  if (start < 0 || end < start) throw new Error('Status page snapshot markers are missing');
  const embedded = START + '\n<script id="productHealthSnapshot" type="application/json">' + JSON.stringify(snapshot).replace(/</g, '\\u003c') + '</script>\n' + END;
  return page.slice(0, start) + embedded + page.slice(end + END.length);
}

function main() {
  const snapshot = buildSnapshot();
  const json = stableJson(snapshot);
  const page = updatePage(snapshot);
  const outputCurrent = fs.existsSync(OUTPUT) ? fs.readFileSync(OUTPUT, 'utf8') : '';
  const pageCurrent = fs.readFileSync(PAGE, 'utf8');
  const changed = outputCurrent !== json || pageCurrent !== page;

  if (CHECK) {
    if (changed) {
      console.error('Product health snapshot is out of date. Run npm run product-health:build.');
      process.exitCode = 1;
      return;
    }
    console.log('Product health snapshot is current.');
    return;
  }

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, json);
  fs.writeFileSync(PAGE, page);
  console.log('Built public product health snapshot: ' + path.relative(ROOT, OUTPUT));
}

if (require.main === module) main();

module.exports = { buildSnapshot };

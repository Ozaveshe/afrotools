'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const invoice = require('../engines/src/creator-invoice-engine.js');
const analytics = require('../engines/src/creator-analytics-engine.js');

test('creator invoice engine validates and calculates cents deterministically', () => {
  const result = invoice.createInvoice({
    issuerName: 'Studio Kora',
    clientName: 'Client Démo',
    invoiceNumber: 'INV-042',
    currency: 'XOF',
    taxLabel: 'TVA',
    taxRate: 18,
    discountType: 'percentage',
    discountValue: 10,
    items: [
      { description: 'Direction artistique', quantity: 2, unitPrice: 50000 },
      { description: 'Droits de diffusion', quantity: 1, unitPrice: 25000 },
    ],
  });
  assert.equal(result.valid, true);
  assert.equal(result.subtotal, 12_500_000);
  assert.equal(result.discount, 1_250_000);
  assert.equal(result.taxable, 11_250_000);
  assert.equal(result.tax, 2_025_000);
  assert.equal(result.total, 13_275_000);
  assert.match(invoice.serializeText(result, 'fr-FR'), /FACTURE INV-042/);
  assert.match(invoice.serializeText(result, 'fr-FR'), /TVA \(18%\)/);
});

test('creator invoice engine fails closed when required document fields are absent', () => {
  const result = invoice.createInvoice({ items: [{ description: '', quantity: 1, unitPrice: 10 }] });
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, ['issuer', 'client', 'invoice-number', 'items']);
});

test('creator analytics engine calculates weighted engagement and rankings', () => {
  const summary = analytics.summarize([
    { date: '2026-07-20', platform: 'instagram', format: 'reel', reach: 1000, likes: 60, comments: 10, shares: 5, saves: 25, followers: 8 },
    { date: '2026-07-21', platform: 'linkedin', format: 'carousel', reach: 500, likes: 70, comments: 10, shares: 5, saves: 15, followers: 4 },
  ]);
  assert.equal(summary.totalPosts, 2);
  assert.equal(summary.totalReach, 1500);
  assert.equal(summary.totalInteractions, 200);
  assert.equal(Number(summary.engagementRate.toFixed(2)), 13.33);
  assert.equal(summary.bestPlatform.name, 'linkedin');
  assert.equal(summary.bestFormat.name, 'carousel');
  assert.match(analytics.toCsv(summary.posts), /^date,platform,format,/);
  assert.equal(analytics.toCsv(summary.posts).split(/\r?\n/).length, 3);
});

test('French launchers and workspaces are native, reciprocal, discoverable and artwork-backed', () => {
  const owners = [
    {
      enLauncher: 'tools/creator-invoice/index.html',
      enApp: 'tools/creator-invoice/app.html',
      frLauncher: 'fr/tools/facture-createur/index.html',
      frApp: 'fr/tools/facture-createur/app.html',
      enBase: '/tools/creator-invoice/',
      frBase: '/fr/tools/facture-createur/',
      image: 'assets/img/tools/creator-invoice.webp',
    },
    {
      enLauncher: 'tools/creator-analytics/index.html',
      enApp: 'tools/creator-analytics/app.html',
      frLauncher: 'fr/tools/stats-createur/index.html',
      frApp: 'fr/tools/stats-createur/app.html',
      enBase: '/tools/creator-analytics/',
      frBase: '/fr/tools/stats-createur/',
      image: 'assets/img/tools/creator-analytics.webp',
    },
  ];

  for (const owner of owners) {
    assert.equal(fs.existsSync(path.join(ROOT, owner.image)), true, `${owner.image} exists`);
    for (const rel of [owner.enLauncher, owner.enApp, owner.frLauncher, owner.frApp]) {
      const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      assert.doesNotMatch(html, /<iframe\b/i, `${rel} is not an iframe transplant`);
      assert.doesNotMatch(html, /supabase|cdn\.jsdelivr|api\/ai|ai-advisor/i, `${rel} has no account or AI transport`);
      if (rel !== owner.enLauncher) {
        assert.match(html, /<meta name="geo\.region" content="002">/);
      }
      assert.match(html, /<meta property="og:image" content="https:\/\/afrotools\.com\/assets\/img\/tools\//);
      assert.match(html, /application\/ld\+json/);
    }
    for (const rel of [owner.enLauncher, owner.frLauncher]) {
      const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      assert.match(html, new RegExp(`hreflang="en" href="https://afrotools.com${owner.enBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
      assert.match(html, new RegExp(`hreflang="fr" href="https://afrotools.com${owner.frBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    }
    for (const rel of [owner.enApp, owner.frApp]) {
      const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      assert.match(html, /<meta name="robots" content="noindex, follow">/);
      assert.doesNotMatch(html, /<link rel="alternate" hreflang=/);
    }
  }

  const routeMap = fs.readFileSync(path.join(ROOT, 'scripts/lib/french-tool-route-map.js'), 'utf8');
  assert.match(routeMap, /"facture-createur": "creator-invoice"/);
  assert.match(routeMap, /"stats-createur": "creator-analytics"/);
  const aiRouteMap = fs.readFileSync(path.join(ROOT, 'assets/js/ai/french-route-map.generated.js'), 'utf8');
  assert.match(aiRouteMap, /"\/tools\/creator-invoice\/":"\/fr\/tools\/facture-createur\/"/);
  assert.match(aiRouteMap, /"\/tools\/creator-analytics\/":"\/fr\/tools\/stats-createur\/"/);
});

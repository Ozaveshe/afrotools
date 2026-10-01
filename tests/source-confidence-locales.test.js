const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const owner = require('../assets/js/lib/src/source-confidence.js');
const deployed = require('../assets/js/lib/source-confidence.js');
const registry = require('../data/source-registry.json');

test('every current source caution has complete French and Swahili wording', () => {
  for (const locale of ['fr', 'sw']) {
    for (const source of registry.sources) {
      const copy = deployed.localizeDisclaimer(source.displayDisclaimer, locale);
      assert.equal(copy.state, 'translated', `${locale} ${source.id}`);
      assert.equal(copy.language, locale, `${locale} ${source.id}`);
      assert.ok(copy.text.length > 30, `${locale} ${source.id}`);
      assert.notEqual(copy.text, source.displayDisclaimer, `${locale} ${source.id}`);
    }
  }
});

test('native badge labels never alter identity, confidence, freshness or warning tone', () => {
  for (const source of registry.sources) {
    const english = deployed.getSourceBadgeProps(source, '2026-10-01', 'en');
    for (const locale of ['fr', 'sw']) {
      const native = deployed.getSourceBadgeProps(source, '2026-10-01', locale);
      assert.notEqual(native.label, english.label, `${locale} ${source.id}`);
      for (const field of ['tone', 'title', 'sourceName', 'sourceUrl', 'freshnessStatus', 'confidence']) {
        assert.equal(native[field], english[field], `${locale} ${source.id} ${field}`);
      }
    }
  }
});

test('new or changed caution notes retain all original conditions with an explicit English fallback', () => {
  const source = { ...registry.sources.find(s => s.id === 'vat-bf-source') };
  source.displayDisclaimer += ' NEW CONDITION: transaction evidence required.';
  for (const locale of ['fr', 'sw']) {
    const copy = deployed.localizeDisclaimer(source.displayDisclaimer, locale);
    assert.equal(copy.state, 'untranslated');
    assert.equal(copy.language, 'en');
    assert.equal(copy.text, source.displayDisclaimer);
    const html = deployed.renderSourceSummary(source, { locale });
    assert.match(html, /data-source-copy-state="untranslated"/);
    assert.match(html, /<span lang="en">/);
    assert.ok(html.includes('NEW CONDITION: transaction evidence required.'));
    assert.ok(html.includes(locale === 'fr' ? 'Note de source en anglais' : 'Maelezo ya chanzo kwa Kiingereza'));
  }
});

test('native unknown and unavailable states remain cautious and escaped', () => {
  for (const locale of ['fr', 'sw']) {
    const unknown = deployed.getSourceMetaById('missing-source', registry);
    const html = deployed.renderSourceSummary(unknown, { locale });
    assert.equal(unknown.confidence, 'low_confidence');
    assert.equal(unknown.freshnessStatus, 'unknown');
    assert.match(html, /data-source-copy-state="translated"/);
    assert.ok(html.includes(locale === 'fr' ? 'Source inconnue' : 'Chanzo kisichojulikana'));
    assert.ok(html.includes(locale === 'fr' ? 'Confiance limitée' : 'Uhakika mdogo'));
    assert.ok(!html.includes('Source confidence is unavailable.'));
    const unavailable = deployed.renderSourceSummary({ ...unknown, freshnessStatus: 'unavailable', sourceName: '<img src=x onerror=alert(1)>' }, { locale });
    assert.match(unavailable, /&lt;img/);
    assert.ok(!unavailable.includes('<img'));
    assert.ok(unavailable.includes(locale === 'fr' ? 'Indisponible' : 'Haipatikani'));
    assert.match(unavailable, /source-confidence-warning/);
  }
});

test('the readable owner and generated helper agree across the full source registry', () => {
  for (const source of registry.sources) {
    assert.deepEqual(owner.normalizeSourceMeta(source), deployed.normalizeSourceMeta(source));
    for (const locale of ['en', 'fr', 'sw']) {
      assert.deepEqual(owner.getSourceBadgeProps(source, '2026-10-01', locale), deployed.getSourceBadgeProps(source, '2026-10-01', locale));
      assert.equal(owner.renderSourceSummary(source, { locale }), deployed.renderSourceSummary(source, { locale }));
    }
  }
});

test('hydration language follows the document and regional locale hints preserve explicit overrides', () => {
  const code = fs.readFileSync(require.resolve('../assets/js/lib/src/source-confidence.js'), 'utf8');
  for (const locale of ['fr-FR', 'sw-KE']) {
    const context = { document: { readyState: 'loading', documentElement: { getAttribute: () => locale }, addEventListener: () => {} } };
    vm.runInNewContext(code, context);
    const api = context.AfroToolsSourceConfidence;
    assert.equal(api.getConfidenceLabel({ confidence: 'reviewed' }), locale.startsWith('fr') ? 'Révisé' : 'Imekaguliwa');
    assert.equal(api.getConfidenceLabel({ confidence: 'reviewed' }, 'en'), 'Reviewed');
    assert.equal(api.getConfidenceLabel({ confidence: 'reviewed' }, 'ha'), 'Reviewed');
  }
});

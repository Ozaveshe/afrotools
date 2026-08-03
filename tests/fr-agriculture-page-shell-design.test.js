'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { renderFrenchAgriculturePage } = require('../scripts/lib/fr-agriculture-page-shell');

function render(body) {
  return renderFrenchAgriculturePage({
    row: {
      english: { id: 'test-tool', route: '/tools/test-tool/' },
      french: { route: '/fr/outils/test-tool/' },
      country: { code: 'SN', frenchName: 'Sénégal' },
      alternates: [
        { hreflang: 'en', route: '/tools/test-tool/' },
        { hreflang: 'fr', route: '/fr/outils/test-tool/' },
      ],
    },
    title: 'Outil agricole de test',
    description: 'Description française de test.',
    heading: 'Outil agricole de test',
    lead: 'Préparez une estimation locale.',
    body,
    scripts: '',
    pageConfig: { id: 'test-tool' },
  });
}

test('French Agriculture trust panels use a neutral border without dropping trust copy', () => {
  const html = render(`
    <section class="card">
      <h2>Sources, fraîcheur et limites</h2>
      <div class="trust-item"><strong>Sources</strong><span>Référentiel local vérifié.</span></div>
    </section>
  `);

  assert.match(html, /\.trust-item\{border:1px solid var\(--agri-border\);/);
  assert.doesNotMatch(html, /\.trust-item\{border-left:/);
  assert.match(html, /Sources, fraîcheur et limites/);
  assert.match(html, /Référentiel local vérifié\./);
});

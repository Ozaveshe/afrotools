'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const registryApi = require('../scripts/lib/canonical-registry');
const ROOT = path.resolve(__dirname, '..');
const CASES = [
  {
    "id": "sim-registration-yo",
    "parentId": "telecom-sim-reg",
    "parentRoute": "/telecom/sim-registration/",
    "route": "/yo/awon-ise/rajista-sim-nin/",
    "htmlOwner": null
  },
  {
    "id": "zana-kifuatiliaji-inventory-sw-wave8",
    "parentId": "inventory",
    "parentRoute": "/tools/inventory/",
    "route": "/sw/zana/kifuatiliaji-inventory/",
    "htmlOwner": "sw/zana/kifuatiliaji-inventory/index.html"
  },
  {
    "id": "zana-kizalishaji-robots-txt-sw-wave8",
    "parentId": "robots-txt",
    "parentRoute": "/tools/robots-txt/",
    "route": "/sw/zana/kizalishaji-robots-txt/",
    "htmlOwner": "sw/zana/kizalishaji-robots-txt/index.html"
  },
  {
    "id": "zana-kubadilisha-maudhui-kwa-majukwaa-sw-wave8",
    "parentId": "creator-repurpose",
    "parentRoute": "/tools/creator-repurpose/",
    "route": "/sw/zana/kubadilisha-maudhui-kwa-majukwaa/",
    "htmlOwner": "sw/zana/kubadilisha-maudhui-kwa-majukwaa/index.html"
  },
  {
    "id": "zana-mkaa-dhidi-ya-nishati-safi-sw-wave8",
    "parentId": "charcoal-vs-clean",
    "parentRoute": "/tools/charcoal-vs-clean/",
    "route": "/sw/zana/mkaa-dhidi-ya-nishati-safi/",
    "htmlOwner": "sw/zana/mkaa-dhidi-ya-nishati-safi/index.html"
  },
  {
    "id": "zana-mtafsiri-wa-kifaransa-afrika-sw-wave8",
    "parentId": "french-african",
    "parentRoute": "/tools/french-african/",
    "route": "/sw/zana/mtafsiri-wa-kifaransa-afrika/",
    "htmlOwner": "sw/zana/mtafsiri-wa-kifaransa-afrika/index.html"
  },
  {
    "id": "zana-mtafsiri-wa-pidgin-ya-nigeria-sw-wave8",
    "parentId": "pidgin-translator",
    "parentRoute": "/tools/pidgin-translator/",
    "route": "/sw/zana/mtafsiri-wa-pidgin-ya-nigeria/",
    "htmlOwner": "sw/zana/mtafsiri-wa-pidgin-ya-nigeria/index.html"
  },
  {
    "id": "zana-rekodi-na-hariri-sauti-sw-wave8",
    "parentId": "creator-voice",
    "parentRoute": "/tools/creator-voice/",
    "route": "/sw/zana/rekodi-na-hariri-sauti/",
    "htmlOwner": "sw/zana/rekodi-na-hariri-sauti/index.html"
  },
  {
    "id": "zana-thamani-ya-e-waste-sw-wave8",
    "parentId": "ewaste-value",
    "parentRoute": "/tools/ewaste-value/",
    "route": "/sw/zana/thamani-ya-e-waste/",
    "htmlOwner": "sw/zana/thamani-ya-e-waste/index.html"
  },
  {
    "id": "zana-transliteration-ya-maandishi-sw-wave8",
    "parentId": "transliterate",
    "parentRoute": "/tools/transliterate/",
    "route": "/sw/zana/transliteration-ya-maandishi/",
    "htmlOwner": "sw/zana/transliteration-ya-maandishi/index.html"
  },
  {
    "id": "zana-ukubwa-wa-betri-na-inverter-sw-wave8",
    "parentId": "battery-sizing",
    "parentRoute": "/tools/battery-sizing/",
    "route": "/sw/zana/ukubwa-wa-betri-na-inverter/",
    "htmlOwner": "sw/zana/ukubwa-wa-betri-na-inverter/index.html"
  },
  {
    "id": "zana-mapato-ya-mtayarishi-sw-finish",
    "parentId": "creator-money",
    "parentRoute": "/tools/creator-money/",
    "route": "/sw/zana/mapato-ya-mtayarishi/",
    "htmlOwner": "sw/zana/mapato-ya-mtayarishi/index.html"
  },
  {
    "id": "zana-nambari-za-kiarabu-sw-finish",
    "parentId": "arabic-calc",
    "parentRoute": "/tools/arabic-numerals/",
    "route": "/sw/zana/nambari-za-kiarabu/",
    "htmlOwner": "sw/zana/nambari-za-kiarabu/index.html"
  },
  {
    "id": "zana-ukubwa-wa-septic-tank-sw-finish",
    "parentId": "septic-tank",
    "parentRoute": "/tools/septic-tank/",
    "route": "/sw/zana/ukubwa-wa-septic-tank/",
    "htmlOwner": "sw/zana/ukubwa-wa-septic-tank/index.html"
  },
  {
    "id": "zana-umri-na-jina-la-siku-afrika-sw-finish",
    "parentId": "age-calculator-african",
    "parentRoute": "/tools/age-calculator-african/",
    "route": "/sw/zana/umri-na-jina-la-siku-afrika/",
    "htmlOwner": "sw/zana/umri-na-jina-la-siku-afrika/index.html"
  },
  {
    "id": "zana-vichwa-vya-maudhui-sw-finish",
    "parentId": "creator-titles",
    "parentRoute": "/tools/creator-titles/",
    "route": "/sw/zana/vichwa-vya-maudhui/",
    "htmlOwner": "sw/zana/vichwa-vya-maudhui/index.html"
  },
  {
    "id": "zana-viwango-vya-freelancer-sw-finish",
    "parentId": "freelancer-rate",
    "parentRoute": "/tools/freelancer-rate/",
    "route": "/sw/zana/viwango-vya-freelancer/",
    "htmlOwner": "sw/zana/viwango-vya-freelancer/index.html"
  }
];

function browserMetadata(source) {
  const sandbox = { document: { readyState: 'complete', getElementById: () => true,
    querySelector: () => null, createElement: () => ({}), head: { appendChild() {} },
    dispatchEvent() {}, addEventListener() {} }, CustomEvent: function CustomEvent() {} };
  sandbox.window = sandbox;
  vm.runInNewContext(source, sandbox, { filename: 'tool-registry.js' });
  return sandbox;
}

test('localized source IDs resolve to declared English parents and existing card images', () => {
  const source = fs.readFileSync(path.join(ROOT, 'assets/js/components/tool-registry.js'), 'utf8');
  const actual = JSON.parse(JSON.stringify(registryApi.buildCanonicalRegistry()));
  const expected = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/registry/canonical-registry.json'), 'utf8'));
  const byId = new Map(actual.tools.map(row => [row.id, row]));
  const yo = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/registry/yoruba-route-manifest.json'), 'utf8'));
  for (const item of CASES) {
    const child = byId.get(item.id);
    assert.equal(child.source.sourceId, item.parentId, item.id);
    const parent = byId.get(child.source.sourceId);
    assert(parent.localeCoverage.includes('en'), item.id + ' must resolve to English metadata');
    assert.equal(parent.route, item.parentRoute);
    assert.equal(child.route, item.route);
    assert(registryApi.routeExists(parent.route), item.id + ' English destination missing');
    if (item.htmlOwner) {
      const html = fs.readFileSync(path.join(ROOT, item.htmlOwner), 'utf8');
      const english = [...html.matchAll(/<link\b[^>]*>/gi)].flatMap(tag => {
        const attrs = {};
        for (const attr of tag[0].matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[attr[1].toLowerCase()] = attr[2] ?? attr[3];
        return attrs.hreflang === 'en' && (attrs.rel || '').split(/\s+/).includes('alternate') ? [new URL(attrs.href, 'https://afrotools.com').pathname] : [];
      });
      assert(english.includes(item.parentRoute), item.id + ' declared English destination drifted');
    } else {
      assert.equal(yo.routes.find(row => row.route === item.route).englishEquivalent, item.parentRoute);
    }
    expected.tools.find(row => row.id === item.id).source.sourceId = item.parentId;
  }
  assert.deepEqual(actual, expected, 'Only the17 source.sourceId fields may differ from committed generated metadata');

  const metadata = browserMetadata(source);
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'assets/js/components/category-cards.js'), 'utf8'), metadata, { filename: 'category-cards.js' });
  for (const [id, key] of [['zana-mapato-ya-mtayarishi-sw-finish', 'creator-money'], ['zana-vichwa-vya-maudhui-sw-finish', 'creator-titles']]) {
    const row = metadata.AFRO_TOOLS.find(tool => tool.id === id);
    // Unit8 adds reviewed same-tool artwork; unit2 must retain the English source parent.
    assert.equal(row.sourceId, key);
    assert.equal(row.imageId, id, 'Reviewed localized artwork explicitly overrides the card fallback');
    assert.equal(metadata.afroToolCardImageId(row), id);
    const fallbackRow = { ...row }; delete fallbackRow.imageId;
    assert.equal(metadata.afroToolCardImageId(fallbackRow), key, 'English parent fallback remains intact');
    assert(fs.statSync(path.join(ROOT, 'assets/img/tools/' + key + '.webp')).isFile());
    const image = '/assets/img/tools/' + id + '.webp';
    assert.equal(metadata.afroToolCardImageUrl(id), image);
    assert(fs.statSync(path.join(ROOT, image.slice(1))).isFile(), 'Intended WebP owner must exist');
    assert(metadata.afroCard(row, true).includes(image), 'Actual card consumer must choose the intended existing image');
  }
});

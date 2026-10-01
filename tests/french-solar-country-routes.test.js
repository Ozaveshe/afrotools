const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { createRouteMap, localizedRoute, rewriteSolarRouteLiterals, localizeFrenchSolarRoutes } = require('../scripts/lib/french-solar-country-routes');
const dataset = require('../data/energy/solar-roi-country-dataset');

test('all maintained Solar countries have canonical French destinations', () => {
  const routes = createRouteMap();
  assert.equal(Object.keys(dataset.countries).length, 54);
  for (const country of Object.values(dataset.countries)) {
    const expected = `/fr/tools/roi-solaire/${country.slug}/`;
    for (const prefix of ['/tools/solar-roi/', '/fr/tools/solar-roi/', '/fr/tools/roi-solaire/']) {
      assert.equal(localizedRoute(prefix + country.slug + '/?country=' + country.code + '#calculator-title', routes), expected + '?country=' + country.code + '#calculator-title');
    }
  }
  for (const value of ['/tools/solar-roi/unknown/', '//other.example/tools/solar-roi/ghana/', 'https://other.example/tools/solar-roi/ghana/']) {
    assert.equal(localizedRoute(value, routes), value);
  }
});

test('route literals localize repeatably without changing calculations or source data', () => {
  const script = 'const rows=[{name:"Ghana",currency:"GHS",href:"/tools/solar-roi/ghana/"}]; const result=1.8*100; const source="https://official.example/tools/solar-roi/ghana/"; globalThis.output={rows,result,source};';
  const repaired = rewriteSolarRouteLiterals(script);
  assert.equal(rewriteSolarRouteLiterals(repaired), repaired);
  const before = {}, after = {};
  vm.runInNewContext(script, before); vm.runInNewContext(repaired, after);
  assert.equal(after.output.result, before.output.result);
  assert.equal(after.output.source, before.output.source);
  assert.equal(after.output.rows[0].name, before.output.rows[0].name);
  assert.equal(after.output.rows[0].currency, before.output.rows[0].currency);
  assert.equal(after.output.rows[0].href, '/fr/tools/roi-solaire/ghana/');
});

test('anchors and controller routes localize while English alternates stay intact', () => {
  const html = '<link rel="alternate" hreflang="en" href="https://afrotools.com/tools/solar-roi/ghana/"><a href="/fr/tools/solar-roi/ghana/#calculator-title">Ghana</a><script>const next="/tools/solar-roi/senegal/";</script><script type="application/json">{"source":"/tools/solar-roi/ghana/"}</script>';
  const repaired = localizeFrenchSolarRoutes(html);
  assert.equal(localizeFrenchSolarRoutes(repaired), repaired);
  assert.ok(repaired.includes('hreflang="en" href="https://afrotools.com/tools/solar-roi/ghana/"'));
  assert.ok(repaired.includes('href="/fr/tools/roi-solaire/ghana/#calculator-title"'));
  assert.ok(repaired.includes('const next="/fr/tools/roi-solaire/senegal/"'));
  assert.ok(repaired.includes('{"source":"/tools/solar-roi/ghana/"}'));
  const example = '<pre><a href="/tools/solar-roi/ghana/">Example</a></pre><script>const example=\'<a href="/tools/solar-roi/ghana/">Example</a>\';</script>';
  assert.equal(localizeFrenchSolarRoutes(example), example);
});

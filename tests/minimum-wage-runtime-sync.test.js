const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname,'../scripts/build-sw-salary-tool-pages.js'),'utf8');
const tag = '<script src="/assets/js/pages/minimum-wage-reference-comparison.js"></script>';
function run(html, extraArgs = []) {
  let output;
  vm.runInNewContext(source, { require(name) { return name === 'fs' ? { readFileSync:()=>html, mkdirSync(){}, writeFileSync(file,content){output=content;} } : require(name); }, __dirname:path.join(__dirname,'../scripts'), process:{argv:['node','script','--sync-minimum-wage-runtime',...extraArgs]} });
  return output;
}
const baseline = '<html><head><meta name="release" content="retain"></head><body><main>Actual user controls</main><footer>SSR navigation</footer></body></html>';
assert.equal(run(baseline),baseline.replace('</body>','<script src="/assets/js/lib/minimum-wage-inflation.js"></script>\n'+tag+'\n<script src="/assets/js/pages/minimum-wage-submissions.js"></script>\n</body>'));
assert.equal(run(run(baseline)),run(baseline));
assert.throws(()=>run(baseline.replace('</body>','')),/Ambiguous/);
assert.throws(()=>run(baseline.replace('</body>',tag+tag+'</body>')),/Ambiguous/);
assert.throws(()=>run(baseline,['--sync-ghana-disclosure']),/Missing minimum-wage localizer boundary/);
const localized = baseline.replace('</body>', '<script>function localizeCountryData(country) {\n  return country;\n}\n\nfunction buildSwObservation(c) {\n  return c.notes;\n}</script></body>');
assert.ok(!run(localized).includes('GHS 21.77'), 'runtime-only sync must not rewrite source disclosures');
const disclosed = run(localized,['--sync-ghana-disclosure']);
assert.ok(disclosed.includes('GHS 21.77') && disclosed.includes('GHS 478.94'));
assert.ok(disclosed.includes('siku 22') && disclosed.includes('siku 30'));
assert.ok(disclosed.includes('si kima cha mwezi kilichowekwa kisheria'));
assert.ok(disclosed.includes('<main>Actual user controls</main><footer>SSR navigation</footer>'));
assert.equal(run(disclosed,['--sync-ghana-disclosure']),disclosed, 'explicit disclosure refresh must be idempotent');
console.log('Minimum-wage bounded runtime sync preserves every unowned byte and rejects ambiguous boundaries: PASS');

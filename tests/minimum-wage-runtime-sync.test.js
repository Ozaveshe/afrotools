const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname,'../scripts/build-sw-salary-tool-pages.js'),'utf8');
const tag = '<script src="/assets/js/pages/minimum-wage-reference-comparison.js"></script>';
function run(html) {
  let output;
  vm.runInNewContext(source, { require(name) { return name === 'fs' ? { readFileSync:()=>html, mkdirSync(){}, writeFileSync(file,content){output=content;} } : require(name); }, __dirname:path.join(__dirname,'../scripts'), process:{argv:['node','script','--sync-minimum-wage-runtime']} });
  return output;
}
const baseline = '<html><head><meta name="release" content="retain"></head><body><main>Actual user controls</main><footer>SSR navigation</footer></body></html>';
assert.equal(run(baseline),baseline.replace('</body>',tag+'\n</body>'));
assert.equal(run(run(baseline)),run(baseline));
assert.throws(()=>run(baseline.replace('</body>','')),/Ambiguous/);
assert.throws(()=>run(baseline.replace('</body>',tag+tag+'</body>')),/Ambiguous/);
console.log('Minimum-wage bounded runtime sync preserves every unowned byte and rejects ambiguous boundaries: PASS');

'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { minify } = require('terser');
const ROOT = path.resolve(__dirname, '..');
const OWNER = 'assets/js/lib/src/save-state.js';
const OUTPUTS = ['assets/js/lib/save-state.js', 'assets/js/lib/save-state-classic.js', 'assets/js/lib/save-state.compat.js', 'assets/js/lib/save-state.global.js'];
async function buildSaveState({ check = false, root = ROOT } = {}) {
  const source = fs.readFileSync(path.join(root, OWNER), 'utf8');
  const factory = '(' + source + ')';
  const attach = 'var api=' + factory + '(window);window.SaveState=api.SaveState;window.renderSavedItems=api.renderSavedItems;';
  for (const output of OUTPUTS) {
    const module = output === OUTPUTS[0];
    const code = module ? attach + 'var SaveState=api.SaveState,renderSavedItems=api.renderSavedItems;export {SaveState,renderSavedItems};' : '(function(){' + attach + '})();';
    const result = await minify(code, { module, compress: true, mangle: true, format: { comments: false } });
    const target = path.join(root, output), expected = result.code + '\n';
    if (fs.existsSync(target) && fs.readFileSync(target, 'utf8') === expected) continue;
    if (check) throw new Error('SaveState generated output is stale: ' + output);
    fs.writeFileSync(target, expected, 'utf8');
  }
  return OUTPUTS;
}
if (require.main === module) buildSaveState({check:process.argv.includes('--check')}).then(() => console.log('SaveState variants ' + (process.argv.includes('--check') ? 'verified' : 'generated') + '.')).catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { buildSaveState, OWNER, OUTPUTS };

#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const INPUT = path.join(ROOT, 'data/agriculture/farm-size-data.json');
const OUTPUT = path.join(ROOT, 'data/agriculture/farm-size-data.js');

function render(data) {
  return "(function(root,factory){'use strict';var data=factory();if(typeof module==='object'&&module.exports)module.exports=data;if(root){root.AfroTools=root.AfroTools||{};root.AfroTools.FarmSizeData=data;}}(typeof window!=='undefined'?window:globalThis,function(){'use strict';return " + JSON.stringify(data) + ';}));\n';
}

function build(check = false) {
  const output = render(JSON.parse(fs.readFileSync(INPUT, 'utf8')));
  const current = fs.readFileSync(OUTPUT, 'utf8');
  if (check && current !== output) throw new Error('Farm Size browser data is stale; run node scripts/build-farm-size-data.js.');
  if (!check && current !== output) fs.writeFileSync(OUTPUT, output, 'utf8');
  console.log(`Farm Size browser data ${check ? 'checked' : 'built'} from its JSON source.`);
}

if (require.main === module) build(process.argv.includes('--check'));
module.exports = { render, build };

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const test = require('node:test');
const { generate } = require('../scripts/build-llms-txt');

const ROOT = path.resolve(__dirname, '..');

test('generated LLM directories stay aligned with canonical counts and routes', () => {
  const result = generate({ check: true });
  const liveCount = result.counts['tools.live_experiences'].toLocaleString('en-US');
  const englishCount = result.counts['tools.english_canonical_published'].toLocaleString('en-US');
  const indexableCount = result.counts['tools.indexable_destinations'].toLocaleString('en-US');

  assert(result.topTools.length >= 30, 'llms.txt must list at least 30 selected tools');
  assert.strictEqual(result.tools.length, result.counts['tools.english_canonical_published']);
  assert(result.concise.includes(`${liveCount} live tool experiences.`));
  assert(result.concise.includes(`${englishCount} canonical English tool records.`));
  assert(result.concise.includes(`${indexableCount} indexable tool destinations across published languages.`));
  assert(result.concise.includes('Languages: English (EN), French (FR), Swahili (SW), Hausa (HA), Yoruba (YO).'));
  assert(result.concise.includes('[French LLM directory](https://afrotools.com/llms-fr.txt)'));
  assert(result.full.includes('[llms-fr.txt](https://afrotools.com/llms-fr.txt)'));
  assert(result.french.includes('Il ne certifie pas la parité fonctionnelle'));
  assert(!/[A-Za-zÀ-ÿ]\?[A-Za-zÀ-ÿ]/.test(result.french), 'llms-fr.txt must exclude visibly corrupted French metadata');
  assert(!/\bOutil français déjà en ligne\b|\bSurface:\s*/i.test(result.french), 'llms-fr.txt must exclude generic placeholder metadata');
  assert(result.frenchRouteReport.mappedManifestRecords > 100);
  assert(result.frenchRouteReport.mappedManifestRecords < result.frenchRouteReport.manifestRecords);
  assert.strictEqual(result.frenchRouteReport.ambiguousRoutes, 5);
  assert(result.frenchTools.length > 100);
  assert(!result.concise.includes('1,110+'));
  assert(!/\b(best value|best time|complete|perfect for|ultimate|world-class)\b/i.test(result.concise));
  assert(!/\b(best value|best time|complete|perfect for|ultimate|world-class)\b/i.test(result.full));

  for (const tool of result.tools) {
    assert(result.full.includes(`(${new URL(tool.url, 'https://afrotools.com').href})`), `missing ${tool.id} from llms-full.txt`);
    const relative = tool.url.replace(/^\//, '');
    const routeCandidates = [path.join(ROOT, relative, 'index.html'), path.join(ROOT, `${relative}.html`), path.join(ROOT, relative)];
    assert(routeCandidates.some((candidate) => fs.existsSync(candidate)), `missing public route for ${tool.id}: ${tool.url}`);
  }

  for (const tool of result.frenchTools) {
    assert(result.french.includes(`(${new URL(tool.url, 'https://afrotools.com').href})`), `missing ${tool.id} from llms-fr.txt`);
    assert(tool.url.startsWith('/fr/'), `non-French route in llms-fr.txt: ${tool.url}`);
  }
});

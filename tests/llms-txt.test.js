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
  assert(!result.concise.includes('1,110+'));
  assert(!/\b(best value|best time|complete|perfect for|ultimate|world-class)\b/i.test(result.concise));
  assert(!/\b(best value|best time|complete|perfect for|ultimate|world-class)\b/i.test(result.full));

  for (const tool of result.tools) {
    assert(result.full.includes(`(${new URL(tool.url, 'https://afrotools.com').href})`), `missing ${tool.id} from llms-full.txt`);
    const relative = tool.url.replace(/^\//, '');
    const routeCandidates = [path.join(ROOT, relative, 'index.html'), path.join(ROOT, `${relative}.html`), path.join(ROOT, relative)];
    assert(routeCandidates.some((candidate) => fs.existsSync(candidate)), `missing public route for ${tool.id}: ${tool.url}`);
  }
});

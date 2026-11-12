'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const families = [
  ['cassava-processing', 15],
  ['farm-profit', 54],
  ['fish-farming', 15],
  ['harvest-date', 54],
];

// Execute the maintained generators, capturing their normal output in memory.
// No generated pages are written and no browser calculation code is executed.
function renderFamily(family) {
  const filename = path.join(root, 'scripts', `generate-${family}-pages.js`);
  const rendered = new Map();
  const virtualFs = {
    existsSync: () => true,
    mkdirSync: () => {},
    writeFileSync(file, html) {
      assert.equal(path.dirname(file), path.join(root, 'agriculture', family));
      assert.equal(path.extname(file), '.html');
      assert.ok(!rendered.has(file), `Duplicate output ${file}`);
      rendered.set(file, html);
    },
  };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    __dirname: path.dirname(filename),
    require(name) {
      if (name === 'fs') return virtualFs;
      if (name === 'path') return path;
      throw new Error(`Unexpected generator dependency: ${name}`);
    },
    console: { log() {}, warn() {} },
    process: { argv: [], stdout: { write() {} } },
  }, { filename, timeout: 5000 });
  return rendered;
}

for (const [family, count] of families) {
  test(`${family} renders an honestly described supported app category for every country`, () => {
    const rendered = renderFamily(family);
    assert.equal(rendered.size, count);
    for (const [file, html] of rendered) {
      const blocks = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
        .map(match => JSON.parse(match[1]));
      if (family === 'cassava-processing') {
        const pages = blocks.filter(item => item['@type'] === 'WebPage');
        assert.equal(pages.length, 1, file);
        assert.ok(pages[0].name && pages[0].description, file);
        const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
        assert.ok(canonical, file);
        assert.equal(pages[0].url, canonical[1], file);
        assert.equal(blocks.some(item => ['Product', 'WebApplication', 'SoftwareApplication'].includes(item['@type'])), false, file);
        for (const item of blocks) {
          for (const key of ['offers', 'aggregateRating', 'review']) assert.equal(Object.hasOwn(item, key), false, file);
        }
        continue;
      }
      const apps = blocks.filter(item => item['@type'] === 'WebApplication');
      assert.equal(apps.length, 1, file);
      const app = apps[0];
      assert.equal(app.applicationCategory, 'UtilitiesApplication', file);
      assert.ok(app.name && app.description, file);
      const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
      assert.ok(canonical, file);
      assert.equal(app.url, canonical[1], file);
      assert.equal(Number(app.offers.price), 0, file);
      // These generators have no review source; never invent eligibility data.
      assert.equal(Object.hasOwn(app, 'aggregateRating'), false, file);
      assert.equal(Object.hasOwn(app, 'review'), false, file);
    }
  });
}

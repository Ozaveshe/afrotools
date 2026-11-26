const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('Swahili agriculture applications retain valid application metadata', () => {
  const root = path.resolve(__dirname, '../sw/kilimo');
  let applications = 0;
  function inspectDirectory(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        inspectDirectory(file);
      } else if (entry.name === 'index.html') {
        const html = fs.readFileSync(file, 'utf8');
        for (const [, body] of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
          const schema = JSON.parse(body);
          if (schema['@type'] !== 'WebApplication' || schema.inLanguage !== 'sw') continue;
          assert.equal(Object.hasOwn(schema, 'additionalProperty'), false, file);
          assert.notEqual(schema.applicationCategory, 'UtilityApplication', file);
          applications++;
        }
      }
    }
  }
  inspectDirectory(root);
  assert.ok(applications > 0, 'Expected Swahili application markup');
});

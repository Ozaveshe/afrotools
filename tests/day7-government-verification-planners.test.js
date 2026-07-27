const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const ledger = JSON.parse(fs.readFileSync(path.join(root, 'data', 'government', 'official-sources.json'), 'utf8'));
const routes = ['birth-death-cert', 'marriage-cert', 'gov-scholarship', 'social-welfare'];

routes.forEach((route) => {
  const html = fs.readFileSync(path.join(root, 'tools', route, 'index.html'), 'utf8');
  const configMatch = html.match(/<script id="gv-config" type="application\/json">([\s\S]+?)<\/script>/);
  assert.ok(configMatch, `${route}: route contract missing`);
  const config = JSON.parse(configMatch[1]);
  assert.ok(config.tasks.length >= 4, `${route}: task routes incomplete`);
  assert.ok(config.checks.length >= 4, `${route}: verification checks incomplete`);
  assert.ok(config.sources.length >= 4, `${route}: official source routes incomplete`);
  assert.match(html, /aria-live="polite"/, `${route}: live result missing`);
  assert.match(html, /type="reset"/, `${route}: reset path missing`);
  assert.doesNotMatch(html, /\bfetch\s*\(|localStorage|sessionStorage/, `${route}: must not transmit or persist selections`);

  const tool = ledger.tools.find((item) => item.id === route);
  const expectedUrls = tool.sourceIds.map((id) => ledger.sources.find((source) => source.id === id).url);
  config.sources.forEach((source) => {
    assert.ok(expectedUrls.includes(source.url), `${route}: ${source.url} is not bound in the official-source manifest`);
  });
});

const combined = routes.map((route) => fs.readFileSync(path.join(root, 'tools', route, 'index.html'), 'utf8')).join('\n');
assert.doesNotMatch(combined, /KES 3,700|GHS 100|eligible for|you qualify|deadline is|award amount is/i);

console.log(`Day 7 government verification contracts verified for ${routes.length} routes.`);

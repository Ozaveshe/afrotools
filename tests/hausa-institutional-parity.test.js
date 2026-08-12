'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.resolve(__dirname, '..');

execFileSync(process.execPath, [path.join(root, 'scripts/build-hausa-institutional-pages.js')], { cwd:root, stdio:'inherit' });
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'data/localization/ha-bridge-manifest.json'), 'utf8'));
assert.ok(!manifest.bridges.some((row) => ['about','contact'].includes(row.id)), 'native institutional pages must not remain English bridges');

for (const [file, canonical, type, minWords, minH2, minLinks] of [
  ['ha/game-da-mu/index.html','/ha/game-da-mu/','AboutPage',550,12,8],
  ['ha/tuntube-mu/index.html','/ha/tuntube-mu/','ContactPage',350,6,6]
]) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/gi, ' ');
  assert.match(html, /<html\b[^>]*\blang="ha"/i);
  assert.match(html, /afrotools-source-owner[^>]+build-hausa-institutional-pages\.js/i);
  assert.match(html, new RegExp(`rel="canonical" href="https://afrotools\\.com${canonical}"`));
  for (const locale of ['en','fr','sw','ha','x-default']) assert.match(html, new RegExp(`hreflang="${locale}"`));
  assert.match(html, new RegExp(`"@type":"${type}"`));
  const wordCount = (text.match(/[\p{L}\p{N}]+/gu) || []).length;
  assert.ok(wordCount >= minWords, `${file} content floor (${wordCount}/${minWords})`);
  assert.ok((html.match(/<h2\b/gi) || []).length >= minH2, `${file} section floor`);
  assert.ok((html.match(/<a\b/gi) || []).length >= minLinks, `${file} discovery floor`);
  assert.doesNotMatch(html, /data-ha-coverage-state="english-fallback"|gadar harshe|noindex/i);
}
const contact = fs.readFileSync(path.join(root, 'ha/tuntube-mu/index.html'), 'utf8');
assert.match(contact, /name="contact-ha"/);
for (const name of ['name','email','reason','tool','country','message']) assert.match(contact, new RegExp(`name="${name}"`));
assert.match(contact, /data-netlify="true"/);
console.log('Hausa About and Contact native parity contract passed.');

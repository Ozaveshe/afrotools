'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const root = path.resolve(__dirname, '..');
const pages = {
  'kizalishaji-citation': 'zana-kizalishaji-citation-sw-wave9',
  'kikokotoo-gpa': 'zana-kikokotoo-gpa-sw',
  'siku-za-mtihani': 'zana-siku-za-mtihani-sw',
  'kadi-kusoma': 'zana-kadi-kusoma-sw',
  'kikokotoo-jamb': 'zana-kikokotoo-jamb-sw',
  'kikokotoo-waec-neco': 'zana-kikokotoo-waec-neco-sw',
  'kikokotoo-aps-matric': 'zana-kikokotoo-aps-matric-sw'
};

test('reviewed study artwork reaches the visible image and OG metadata', () => {
  for (const [slug, id] of Object.entries(pages)) {
    const html = fs.readFileSync(path.join(root, 'sw/zana', slug, 'index.html'), 'utf8');
    const image = `/assets/img/tools/${id}.webp`;
    assert.ok(html.includes(`<img src="${image}" alt="" width="240" height="135" loading="lazy">`), slug);
    assert.ok(html.includes(`property="og:image" content="https://afrotools.com${image}"`), slug);
    assert.ok(html.includes(`rel="canonical" href="https://afrotools.com/sw/zana/${slug}/"`), slug);
    const config = JSON.parse(html.match(/<script type="application\/json" id="education-parity-config">([\s\S]*?)<\/script>/)[1]);
    assert.ok(!Object.hasOwn(config, 'image') && !Object.hasOwn(config, 'artwork'), slug);
    assert.ok(config.global && config.recipe, slug);
  }
});

test('invalid selective regeneration fails before writing a page or shared manifest', () => {
  const files = ['sw/zana/kikokotoo-gpa/index.html', 'data/localization/sw-education-parity.json', 'data/i18n/sw-education-parity-translations.json', 'sw/elimu/index.html'];
  const before = files.map(file => fs.readFileSync(path.join(root, file)));
  for (const args of [['--apps=not-an-owner'], ['--apps='], ['--apps=gpa-calculator', '--refresh-translations']]) {
    const result = spawnSync(process.execPath, ['scripts/build-sw-education-parity.js', ...args], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Unknown assigned|requires at least|cannot be combined/);
  }
  files.forEach((file, index) => assert.deepEqual(fs.readFileSync(path.join(root, file)), before[index], file));
});

#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'tests/fixtures/export-docs-english-invariants.json');
const PORT = '42978';
const BASE = process.env.EXPORT_DOCS_BASE_URL || `http://127.0.0.1:${PORT}`;

async function ready() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      if ((await fetch(`${BASE}/agriculture/export-docs/`)).ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Server unavailable at ${BASE}`);
}

async function capture() {
  const server = process.env.EXPORT_DOCS_BASE_URL
    ? null
    : spawn(process.execPath, ['tests/support/static-server.js'], {
      cwd: ROOT,
      env: { ...process.env, PORT },
      stdio: 'ignore',
    });
  try {
    await ready();
    const sentinel = await (await fetch(`${BASE}/tests/fixtures/fr-agriculture-worktree-7e83-sentinel.txt`)).text();
    assert.match(sentinel, /worktree=7e83/);
    assert.match(sentinel, /root=C:\\Users\\Oza\\\.codex\\worktrees\\7e83\\afrotools/);
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({ locale: 'en-US' });
      await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'rejected'));
      await page.goto(`${BASE}/agriculture/export-docs/`);
      const owner = await page.evaluate(() => ({
        countries: window.AfroTools.countryIndex.map(country => ({
          code: country.code,
          name: country.name,
          slug: country.slug,
          region: country.region,
          flag: country.flag,
          topCrops: country.topCrops.slice(),
        })),
        regionLabels: window.AfroTools.regionLabels,
      }));
      const physical = await page.locator('#hubMain .country-card').evaluateAll(cards => cards.map(card => ({
        name: card.querySelector('.name').textContent,
        href: card.getAttribute('href'),
      })));
      const sections = await page.locator('#hubMain .region-section').evaluateAll(nodes => nodes.map(node => ({
        label: node.querySelector('.region-label').textContent,
        countries: Array.from(node.querySelectorAll('.country-card .name'), item => item.textContent),
      })));
      return {
        schemaVersion: 1,
        source: 'agriculture/export-docs/index.html#inline-directory-controller+data/agriculture/country-index.js',
        worktreeSentinel: '7e83',
        owner,
        physical,
        sections,
        limitations: [
          'The accepted hub renders 54 static cards and appends the same 54 registry countries again.',
          'Country checklist subroutes are outside the 447-row French Agriculture manifest.',
        ],
      };
    } finally {
      await browser.close();
    }
  } finally {
    if (server) server.kill();
  }
}

(async () => {
  const value = `${JSON.stringify(await capture(), null, 2)}\n`;
  if (process.argv.includes('--check')) {
    assert.equal(fs.readFileSync(OUT, 'utf8'), value);
    console.log('PASS 54 Export Documents directory owner rows and rendered hub invariants');
  } else {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, value, 'utf8');
    console.log('Wrote 54 Export Documents directory owner rows and rendered hub invariants');
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

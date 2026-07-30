'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { actionContract, ownershipKind } = require('./lib/french-mortgage-property-english-owners');

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = process.env.MP66_ORACLE_BASE_URL || 'http://127.0.0.1:43084';
const MANIFEST = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'data', 'registry', 'french-mortgage-property.json'),
  'utf8'
));
const OUTPUT = path.join(ROOT, 'data', 'fixtures', 'french-mortgage-property-english-oracles.json');

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function normalize(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

async function populateOwnerControls(page, englishId) {
  return page.evaluate((id) => {
    const fixture = {};
    const controls = [...document.querySelectorAll('input[id], select[id], textarea[id]')]
      .filter((control) => control.type !== 'hidden')
      .filter((control) => !/^(?:evidence|risk|afro-|mdObservedAt|report_)/i.test(control.id));
    for (const control of controls) {
      if (control.tagName === 'SELECT') {
        if (!control.value) {
          const option = [...control.options].find((item) => item.value);
          if (option) control.value = option.value;
        }
        control.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (control.type === 'radio') {
        const group = control.name
          ? [...document.querySelectorAll(`input[type="radio"][name="${CSS.escape(control.name)}"]`)]
          : [control];
        if (!group.some((item) => item.checked)) group[0].checked = true;
      } else if (control.type === 'checkbox') {
        if (
          /checker|compliance|dpia/.test(id) ||
          /^(?:dc_|pp_|bn_|bd_|pwr)/.test(control.id)
        ) control.checked = true;
      } else if (control.type === 'date') {
        control.value = '2026-08-01';
      } else if (control.type === 'datetime-local') {
        control.value = '2026-08-01T10:00';
      } else if (control.type === 'number') {
        if (!control.value || Number(control.value) <= 0) {
          const minimum = Number(control.min);
          control.value = Number.isFinite(minimum) && minimum > 0 ? String(minimum) : '1000';
        }
      } else if (!control.value) {
        control.value = control.tagName === 'TEXTAREA'
          ? 'Synthetic English owner fixture statement.'
          : `Synthetic ${control.id || 'fixture'}`;
      }
      control.dispatchEvent(new Event('input', { bubbles: true }));
      control.dispatchEvent(new Event('change', { bubbles: true }));
      fixture[control.id] = control.type === 'checkbox' || control.type === 'radio'
        ? control.checked
        : control.value;
    }
    if (id === 'partnership-agreement') {
      document.getElementById('shareA').value = '50';
      document.getElementById('shareB').value = '50';
      document.getElementById('partnerC').value = '';
      document.getElementById('shareC').value = '';
      fixture.shareA = '50';
      fixture.shareB = '50';
      fixture.partnerC = '';
      fixture.shareC = '';
    }
    if (id === 'cac-cost') {
      document.getElementById('useAgent').value = 'self';
      document.getElementById('express').value = 'no';
      document.getElementById('addAnnualReturns').checked = false;
      document.getElementById('addStatusReport').checked = false;
      document.getElementById('addScuml').checked = false;
      fixture.useAgent = 'self';
      fixture.express = 'no';
      fixture.addAnnualReturns = false;
      fixture.addStatusReport = false;
      fixture.addScuml = false;
      fixture.entityType = 'bn';
    }
    if (id === 'shareholder-agreement') {
      document.getElementById('sharesA').value = '50';
      document.getElementById('sharesB').value = '50';
      document.getElementById('totalShares').value = '100';
      fixture.sharesA = '50';
      fixture.sharesB = '50';
      fixture.totalShares = '100';
    }
    return fixture;
  }, englishId);
}

async function captureRow(page, row) {
  const contract = actionContract(row.englishId);
  const alerts = [];
  page.removeAllListeners('dialog');
  page.on('dialog', async (dialog) => {
    alerts.push(dialog.message());
    await dialog.dismiss();
  });
  await page.goto(`${BASE_URL}${row.englishRoute}/`, { waitUntil: 'domcontentloaded' });
  if (row.englishId === 'ng-nhf') {
    await page.selectOption('#countrySelect', 'NG');
    await page.locator('#countrySelect').dispatchEvent('change');
  }
  const fixture = await populateOwnerControls(page, row.englishId);
  if (row.englishId === 'company-type-selector') {
    await page.check('#f1');
    await page.check('#l1');
    await page.check('#i1');
    await page.check('#p1');
    await page.check('#fo1');
  }
  if (contract.actionSelector) {
    await page.locator(contract.actionSelector).first().click();
  }
  await page.waitForTimeout(50);
  const output = normalize(await page.locator(contract.outputSelector).first().innerText());
  const source = fs.readFileSync(path.join(ROOT, row.englishFile), 'utf8');
  return {
    englishId: row.englishId,
    englishRoute: `${row.englishRoute}/`,
    englishFile: row.englishFile,
    ownershipKind: ownershipKind(row.englishId),
    sourceSha256BeforeExtraction: sha256(source),
    actionSelector: contract.actionSelector,
    outputSelector: contract.outputSelector,
    inputFixture: fixture,
    outputText: output,
    outputSha256: sha256(output),
    alerts
  };
}

async function main() {
  const rows = MANIFEST.rows.filter((row) => row.sharedEngine !== 'property-assumption');
  if (rows.length !== 46) throw new Error(`Expected 46 rejected owners, found ${rows.length}`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ serviceWorkers: 'block' });
  const receipts = [];
  try {
    for (const row of rows) {
      const receipt = await captureRow(page, row);
      if (!receipt.outputText) throw new Error(`${row.englishId}: empty English owner output`);
      receipts.push(receipt);
      console.log(`${row.englishId}: ${receipt.ownershipKind} ${receipt.outputSha256.slice(0, 12)}`);
    }
  } finally {
    await browser.close();
  }
  const payload = {
    schemaVersion: 1,
    category: 'Mortgage & Property',
    status: 'pre-extraction-English-owner-oracles',
    sourceCommit: '060817f47184d8fe62cbded4e6c637ed26362128',
    capturedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    count: receipts.length,
    rows: receipts
  };
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Captured ${receipts.length} independent English owner oracles at ${path.relative(ROOT, OUTPUT)}.`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  captureRow,
  normalize,
  populateOwnerControls,
  sha256
};

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const {
  normalizeBuildManagedFingerprint
} = require('./lib/shared-asset-references');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'data', 'localization', 'fr-fintech-banking-parity-manifest.json'),
  'utf8'
));
const TEXT_TYPE_EQUIVALENCE = new Map([
  ['payment-gateway', /^pg-name-[1-3]$/],
  ['b2b-payment', /^b2b-name-[1-3]$/]
]);
const FRENCH_FOCUS_ID_EQUIVALENCE = new Map([
  ['net-worth', /^nw-first-name$/],
  ['stock-portfolio', /^sp-first-(?:ticker|shares)$/]
]);

function publicFrenchPath(route) {
  return path.join(ROOT, route.replace(/^\/+|\/+$/g, ''), 'index.html');
}

function normalizeOwnerHtml(html) {
  const seoLinks = [];
  const normalized = normalizeBuildManagedFingerprint(html).replace(/\r\n?/g, '\n');
  const head = normalized.match(/(<head\b[^>]*>)([\s\S]*?)(<\/head>)/i);
  if (!head) return normalized.trimEnd();
  const headBody = head[2]
    .replace(
      /<link\b(?=[^>]*\brel=["'](?:canonical|alternate)["'])[^>]*>/gi,
      (tag) => {
        seoLinks.push(tag.trim());
        return '';
      }
    )
    .replace(/>\s+</g, '><')
    .trim();
  const normalizedHead = `${head[1]}${headBody}${head[3]}`;
  return `${normalized.slice(0, head.index)}${normalizedHead}${normalized.slice(head.index + head[0].length).trimEnd()}\n`
    + `<!-- build-managed-seo-links:${seoLinks.sort().join('|')} -->`;
}

function normalizedDeclaredType(routeId, control) {
  if (control.tag !== 'input') return control.declaredType;
  const allowed = TEXT_TYPE_EQUIVALENCE.get(routeId);
  if (allowed && allowed.test(control.id) && control.semanticType === 'text' &&
      (!control.declaredType || control.declaredType === 'text')) {
    return 'text';
  }
  return control.declaredType;
}

function normalizeContract(routeId, controls) {
  return controls.map((control) => {
    const allowedFocusId = FRENCH_FOCUS_ID_EQUIVALENCE.get(routeId);
    return {
      ...control,
      id: allowedFocusId && allowedFocusId.test(control.id) ? '' : control.id,
      declaredType: normalizedDeclaredType(routeId, control)
    };
  });
}

async function extractControlContract(page, html) {
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  return page.evaluate(() => Array.from(document.querySelectorAll(
    'body input:not([type="hidden"]),body select,body textarea,body button'
  )).map((element) => {
    const tag = element.tagName.toLowerCase();
    const isInput = tag === 'input';
    const isButton = tag === 'button';
    const isSelect = tag === 'select';
    const numericDefault = isInput && [
      'number', 'range', 'date', 'datetime-local', 'month', 'time', 'week'
    ].includes(element.type);
    return {
      tag,
      id: element.id || '',
      name: element.getAttribute('name') || '',
      semanticType: isInput || isButton ? element.type : tag,
      declaredType: isInput || isButton ? (element.getAttribute('type') || '') : '',
      min: element.getAttribute('min') || '',
      max: element.getAttribute('max') || '',
      step: element.getAttribute('step') || '',
      minLength: element.getAttribute('minlength') || '',
      maxLength: element.getAttribute('maxlength') || '',
      required: element.required === true,
      multiple: element.multiple === true,
      readOnly: element.readOnly === true,
      disabled: element.disabled === true,
      numericDefault: numericDefault ? element.getAttribute('value') || '' : '',
      textDefaultPresent: isInput && element.type === 'text'
        ? element.hasAttribute('value') && element.getAttribute('value') !== ''
        : false,
      placeholderPresent: isInput || tag === 'textarea'
        ? element.hasAttribute('placeholder') && element.getAttribute('placeholder') !== ''
        : false,
      selectedValues: isSelect
        ? Array.from(element.selectedOptions).map((option) => option.value)
        : [],
      options: isSelect
        ? Array.from(element.options).map((option) => ({
          value: option.value,
          disabled: option.disabled
        }))
        : [],
      action: isButton
        ? (element.getAttribute('onclick') || element.id || '')
        : '',
      noGate: element.hasAttribute('data-no-gate')
    };
  }));
}

function mismatchMessage(id, english, french) {
  const limit = Math.max(english.length, french.length);
  const mismatches = [];
  for (let index = 0; index < limit; index += 1) {
    try {
      assert.deepStrictEqual(french[index], english[index]);
    } catch {
      mismatches.push(`${id}: control ${index + 1} differs\n`
        + `English ${JSON.stringify(english[index] || null)}\n`
        + `French  ${JSON.stringify(french[index] || null)}`);
    }
  }
  return mismatches.join('\n') || `${id}: ordered control contract differs`;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const receipts = [];
  const failures = [];
  try {
    for (const row of MANIFEST.routes) {
      const englishFile = path.join(ROOT, 'tools', row.englishId, 'index.html');
      const templateFile = path.join(
        ROOT,
        'data',
        'localization',
        'fr-fintech-banking-pages',
        `${row.englishId}.html`
      );
      const publicFile = publicFrenchPath(row.frenchRoute);
      const englishHtml = fs.readFileSync(englishFile, 'utf8');
      const frenchHtml = fs.readFileSync(templateFile, 'utf8');
      const publicHtml = fs.readFileSync(publicFile, 'utf8');
      if (normalizeOwnerHtml(publicHtml) !== normalizeOwnerHtml(frenchHtml)) {
        throw new Error(`${row.englishId}: public French page drifted from its owner template`);
      }
      const english = normalizeContract(
        row.englishId,
        await extractControlContract(page, englishHtml)
      );
      const french = normalizeContract(
        row.englishId,
        await extractControlContract(page, frenchHtml)
      );
      if (!english.length) throw new Error(`${row.englishId}: English owner has no main controls`);
      try {
        assert.deepStrictEqual(french, english);
      } catch {
        failures.push(mismatchMessage(row.englishId, english, french));
        continue;
      }
      receipts.push({
        englishId: row.englishId,
        controls: english.length,
        textTypeEquivalent: TEXT_TYPE_EQUIVALENCE.has(row.englishId),
        frenchFocusIdEquivalent: FRENCH_FOCUS_ID_EQUIVALENCE.has(row.englishId)
      });
    }
  } finally {
    await context.close();
    await browser.close();
  }
  if (failures.length) {
    throw new Error(`French Fintech control parity rejected ${failures.length}/`
      + `${MANIFEST.routes.length}\n${failures.join('\n')}`);
  }
  console.log(JSON.stringify({
    accepted: true,
    denominator: receipts.length,
    orderedDomControlContracts: receipts.reduce((sum, row) => sum + row.controls, 0),
    semanticTextTypeExceptions: receipts.filter((row) => row.textTypeEquivalent)
      .map((row) => row.englishId),
    frenchFocusIdExceptions: receipts.filter((row) => row.frenchFocusIdEquivalent)
      .map((row) => row.englishId),
    routes: receipts
  }, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  });
}

module.exports = { extractControlContract, normalizeContract };

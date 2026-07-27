const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function loadRegistry() {
  const context = { console, document: undefined };
  vm.createContext(context);
  vm.runInContext(read('assets/js/components/tool-registry.js'), context);
  return context.AFRO_TOOLS;
}

function isEnglishPublished(tool) {
  return (!tool.lang || tool.lang === 'en') && ['live', 'new'].includes(tool.status);
}

function hubToolHrefs(hub) {
  return [...new Set(
    [...read(`${hub}/index.html`).matchAll(/href=["'](\/tools\/[^"'#?]+)["']/g)]
      .map((match) => match[1])
  )];
}

function routeFile(href) {
  const clean = href.replace(/^\/+|\/+$/g, '');
  const candidates = [
    path.join(ROOT, clean, 'index.html'),
    path.join(ROOT, `${clean}.html`)
  ];
  return candidates.find((candidate) => fs.existsSync(candidate));
}

function canonicalFrom(html) {
  return (html.match(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*\bhref=["']([^"']+)["']/i) || [])[1];
}

const tools = loadRegistry();
const english = tools.filter(isEnglishPublished);
const byHref = new Map(english.map((tool) => [tool.href, tool]));

const governmentRows = english.filter((tool) => tool.category === 'government');
const insuranceRows = english.filter((tool) => tool.category === 'insurance');
const legalRows = english.filter((tool) => tool.category === 'legal');
const governmentHub = hubToolHrefs('government');
const insuranceHub = hubToolHrefs('insurance');
const propertyHub = hubToolHrefs('mortgage-property');

assert.strictEqual(governmentRows.length, 15, 'Government registry app-row count drifted');
assert.strictEqual(governmentHub.length, 16, 'Government hub route count drifted');
assert.deepStrictEqual(
  governmentHub.filter((href) => !governmentRows.some((tool) => tool.href === href)),
  ['/tools/public-holidays/'],
  'Government adjunct routes must stay explicit'
);

assert.strictEqual(insuranceRows.length, 16, 'Insurance registry app-row count drifted');
assert.deepStrictEqual(
  [...insuranceRows.map((tool) => tool.href)].sort(),
  [...insuranceHub].sort(),
  'Insurance hub and English registry rows drifted'
);

assert.strictEqual(legalRows.length, 67, 'Current legal registry app-row count drifted');
assert.strictEqual(propertyHub.length, 28, 'Mortgage & Property hub route count drifted');

const propertyLegal = propertyHub.filter((href) => byHref.get(href)?.category === 'legal');
const propertyAdjunct = propertyHub.filter((href) => byHref.get(href)?.category !== 'legal');
const unrelatedLegal = legalRows.filter((tool) => !propertyHub.includes(tool.href));

assert.strictEqual(propertyLegal.length, 20, 'Mortgage & Property legal-row subset drifted');
assert.strictEqual(propertyAdjunct.length, 8, 'Mortgage & Property cross-category adjunct count drifted');
assert.strictEqual(unrelatedLegal.length, 47, 'Unrelated legal/compliance row count drifted');
assert.ok(
  propertyAdjunct.every((href) => ['financial', 'engineering'].includes(byHref.get(href)?.category)),
  'Mortgage & Property adjuncts must have an explicit Finance or Engineering owner'
);

for (const href of [...new Set([...governmentHub, ...insuranceHub, ...propertyHub])]) {
  const file = routeFile(href);
  assert.ok(file, `Missing Day 7 canonical route file: ${href}`);
  const html = fs.readFileSync(file, 'utf8');
  const expectedCanonical = `https://afrotools.com${href}`;
  assert.strictEqual(canonicalFrom(html), expectedCanonical, `${href} canonical drifted`);
  assert.match(html, /<title>[^<]{10,}<\/title>/i, `${href} needs a useful title`);
  assert.match(html, /<meta\b(?=[^>]*\bname=["']description["'])[^>]*\bcontent=["'][^"']{50,}["']/i, `${href} needs a useful description`);
  assert.match(html, /application\/ld\+json/i, `${href} needs structured data`);
}

assert.strictEqual(
  governmentRows.reduce((total, tool) => total + (Number(tool.toolCount) || 1), 0),
  123,
  'Government expanded-experience count drifted'
);
assert.strictEqual(
  insuranceRows.reduce((total, tool) => total + (Number(tool.toolCount) || 1), 0),
  322,
  'Insurance expanded-experience count drifted'
);

console.log(
  'Day 7 scope verified: Government 15 registry apps + 1 adjunct / 123 expanded; ' +
  'Insurance 16 / 322 expanded; Mortgage & Property 28 routes = 20 legal + 8 adjunct, ' +
  'with 47 unrelated legal/compliance rows excluded.'
);

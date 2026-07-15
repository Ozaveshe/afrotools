'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const root = path.resolve(__dirname, '..');
const htmlFile = path.join(root, 'energy', 'index.html');
const scriptFile = path.join(root, 'assets', 'js', 'pages', 'energy-hub-finder.js');
const styleFile = path.join(root, 'assets', 'css', 'energy-hub-finder.css');
const registryFile = path.join(root, 'assets', 'js', 'components', 'tool-registry.js');
const html = fs.readFileSync(htmlFile, 'utf8');
const script = fs.readFileSync(scriptFile, 'utf8');
const style = fs.readFileSync(styleFile, 'utf8');
const registry = fs.readFileSync(registryFile, 'utf8');

[
  'id="energyToolSearch"',
  'id="energyToolFinderReset"',
  'id="energyToolFinderStatus" role="status" aria-live="polite"',
  'id="energyToolFinderEmpty" hidden',
  'data-energy-filter="all" aria-pressed="true"',
  'data-energy-filter="bills"',
  'data-energy-filter="solar"',
  'data-energy-filter="backup"',
  'data-energy-filter="efficiency"',
  'data-energy-filter="business"',
  'data-energy-filter="essentials"',
  'data-energy-filter="climate"',
  '/assets/css/energy-hub-finder.css',
  '/assets/js/pages/energy-hub-finder.js'
].forEach((needle) => assert(html.includes(needle), `Missing Energy hub finder contract: ${needle}`));

const cardMatches = [...html.matchAll(/<a href="(\/tools\/[^"]+\/)" class="en-tool-card" data-energy-topics="([^"]+)">/g)];
assert.strictEqual(cardMatches.length, 20, 'Energy hub finder must own all 20 visible app cards');
assert.strictEqual(new Set(cardMatches.map((match) => match[1])).size, 20, 'Energy hub app routes must remain unique');
cardMatches.forEach((match) => assert(match[2].trim().split(/\s+/).length >= 3, `Energy hub card needs useful task topics: ${match[1]}`));

const energyBlock = registry.match(/\/\/  ENERGY & UTILITIES — 20 tools([\s\S]*?)\/\/  TRANSPORT & LOGISTICS/);
assert(energyBlock, 'Could not find the canonical Energy registry block');
const registryRoutes = [...energyBlock[1].matchAll(/href: '(\/tools\/[^"]+?\/)'/g)].map((match) => match[1]);
assert.strictEqual(registryRoutes.length, 20, 'Canonical Energy registry must still contain 20 apps');
assert.deepStrictEqual([...new Set(cardMatches.map((match) => match[1]))].sort(), [...new Set(registryRoutes)].sort(), 'Energy hub routes must match the registry exactly');

assert((html.match(/class="en-tc-icon" aria-hidden="true"><svg/g) || []).length >= 20, 'Every Energy app card should retain a decorative inline SVG icon');
acorn.parse(script, { ecmaVersion: 'latest', sourceType: 'script' });
[
  "queryTokens.every(function (token)",
  "card.hidden = !(matchesFilter && matchesSearch);",
  "item.setAttribute('aria-pressed'",
  "label.hidden = !visible;",
  "search.focus();"
].forEach((needle) => assert(script.includes(needle), `Missing Energy finder behavior: ${needle}`));
[
  '.en-tool-search:focus',
  'min-height: 48px',
  'button[aria-pressed="true"]',
  '.en-tool-card[hidden]',
  '@media (max-width: 620px)'
].forEach((needle) => assert(style.includes(needle), `Missing Energy finder style/accessibility rule: ${needle}`));

console.log('Energy hub verified: 20 registry-matched routes, complete task metadata, search and eight intent filters, live count, empty/reset state, group visibility, keyboard focus, SVG icons, and mobile CSS.');

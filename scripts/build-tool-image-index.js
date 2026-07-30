#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const IMAGE_DIR = path.join(ROOT, 'assets', 'img', 'tools');
const REGISTRY_PATH = path.join(ROOT, 'assets', 'js', 'components', 'tool-registry.js');
const MANIFEST_PATH = path.join(ROOT, 'data', 'localization', 'fr-agriculture-parity-manifest.json');
const INDEX_PATTERN = /var TOOL_CARD_IMAGE_EXTENSIONS=(\{[^\r\n]*\});/;
const EXTENSION_PRIORITY = Object.freeze(['webp', 'png', 'jpg', 'jpeg', 'svg']);

function availableImages() {
  const byId = new Map();
  fs.readdirSync(IMAGE_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .forEach((entry) => {
      const parsed = path.parse(entry.name);
      const extension = parsed.ext.slice(1).toLowerCase();
      if (!EXTENSION_PRIORITY.includes(extension)) return;
      const current = byId.get(parsed.name);
      if (
        !current
        || EXTENSION_PRIORITY.indexOf(extension) < EXTENSION_PRIORITY.indexOf(current)
      ) {
        byId.set(parsed.name, extension);
      }
    });
  return byId;
}

function agricultureImageIds(source) {
  const sandbox = { console, setTimeout, clearTimeout };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: REGISTRY_PATH });
  if (!Array.isArray(sandbox.AFRO_TOOLS)) {
    throw new Error('Unable to read AFRO_TOOLS from the tool registry.');
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const registryById = new Map(sandbox.AFRO_TOOLS.map((row) => [row.id, row]));
  const ids = new Set();
  manifest.rows.forEach((manifestRow) => {
    const registryRow = registryById.get(manifestRow.english.id) || {};
    [
      manifestRow.english.id,
      manifestRow.artwork && manifestRow.artwork.imageId,
      registryRow.imageId,
      registryRow.sourceId,
    ].filter(Boolean).forEach((id) => ids.add(id));
  });
  return ids;
}

function buildIndex(source) {
  const match = source.match(INDEX_PATTERN);
  if (!match) throw new Error('Unable to read TOOL_CARD_IMAGE_EXTENSIONS.');
  const current = JSON.parse(match[1]);
  const available = availableImages();
  const ownedIds = agricultureImageIds(source);
  ownedIds.forEach((id) => {
    if (!Object.prototype.hasOwnProperty.call(current, id) && available.has(id)) {
      current[id] = available.get(id);
    }
  });
  return {
    index: Object.fromEntries(Object.entries(current).sort(([left], [right]) => left.localeCompare(right))),
    ownedImageIds: ownedIds.size,
  };
}

function renderIndex(index) {
  return `var TOOL_CARD_IMAGE_EXTENSIONS=${JSON.stringify(index)};`;
}

function run(options = {}) {
  const source = fs.readFileSync(REGISTRY_PATH, 'utf8');
  const matches = source.match(new RegExp(INDEX_PATTERN.source, 'g')) || [];
  if (matches.length !== 1) {
    throw new Error(`Expected one TOOL_CARD_IMAGE_EXTENSIONS index; found ${matches.length}.`);
  }
  const { index, ownedImageIds } = buildIndex(source);
  const next = source.replace(INDEX_PATTERN, renderIndex(index));
  if (options.check) {
    if (next !== source) throw new Error('assets/js/components/tool-registry.js has a stale tool image index.');
  } else if (next !== source) {
    fs.writeFileSync(REGISTRY_PATH, next, 'utf8');
  }
  process.stdout.write(`${JSON.stringify({
    mode: options.check ? 'check' : 'write',
    imageIds: Object.keys(index).length,
    ownedImageIds,
    scope: 'fr-agriculture-manifest',
    registry: path.relative(ROOT, REGISTRY_PATH).replace(/\\/g, '/'),
  }, null, 2)}\n`);
  return index;
}

if (require.main === module) {
  try {
    run({ check: process.argv.includes('--check') });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { agricultureImageIds, availableImages, buildIndex, renderIndex, run };

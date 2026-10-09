'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');
const acorn = require('acorn');
const ROOT = path.resolve(__dirname, '../..');

function loadBindings() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'data/image-generation/reviewed-localized-tool-artwork.json'), 'utf8').replace(/^\uFEFF/, '')).bindings;
}

function applyReviewedBindings(source, bindings = loadBindings()) {
  const sandbox = { console, setTimeout, clearTimeout };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  const rows = new Map(sandbox.AFRO_TOOLS.map(row => [row.id, row]));
  const nodes = new Map();
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'ObjectExpression') {
      const id = node.properties.find(p => p.type === 'Property' && (p.key.name || p.key.value) === 'id');
      if (typeof id?.value?.value === 'string') {
        const entries = nodes.get(id.value.value) || [];
        entries.push(node); nodes.set(id.value.value, entries);
      }
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
    }
  }
  visit(acorn.parse(source, { ecmaVersion: 'latest' }));
  const seen = new Set(), edits = [];
  for (const binding of bindings) {
    const { id, source_id: imageId } = binding;
    if (seen.has(id)) throw new Error('Duplicate reviewed target: ' + id);
    seen.add(id);
    const row = rows.get(id), original = rows.get(imageId);
    if (!row || row.href !== binding.route || !original || original.href !== binding.source_route) throw new Error('Reviewed route drift: ' + id);
    if (row.lang !== 'sw' || !binding.mapping_evidence?.length || binding.status !== 'reviewed_same_tool_binding') throw new Error('Unreviewed localized binding: ' + id);
    if (!/^[a-z0-9-]+$/.test(imageId) || binding.path !== '/assets/img/tools/' + imageId + '.webp') throw new Error('Invalid artwork path: ' + id);
    const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, binding.path))).digest('hex');
    if (hash !== binding.sha256) throw new Error('Reviewed image hash drift: ' + id);
    const currentImage = sandbox.getToolCardImagePath(row);
    if ((row.imageId && row.imageId !== imageId) || (currentImage && currentImage !== binding.path)) throw new Error('Existing image conflict: ' + id);
    const matches = nodes.get(id) || [];
    if (matches.length !== 1) throw new Error('Ambiguous registry declaration: ' + id);
    const node = matches[0];
    const property = node.properties.find(p => p.type === 'Property' && (p.key.name || p.key.value) === 'imageId');
    if (!property) {
      const last = node.properties[node.properties.length - 1];
      const trailingComma = source.slice(last.end, node.end - 1).includes(',');
      edits.push({ start: node.end - 1, end: node.end - 1, text: (trailingComma ? ' ' : ', ') + 'imageId: ' + JSON.stringify(imageId) + ' ' });
    }
  }
  let next = source;
  edits.sort((a, b) => b.start - a.start).forEach(edit => { next = next.slice(0, edit.start) + edit.text + next.slice(edit.end); });
  acorn.parse(next, { ecmaVersion: 'latest' });
  return next;
}

function resolveReviewedToolArtwork(route, fallback, bindings = loadBindings()) {
  if (!String(route).startsWith('/sw/')) return fallback;
  const matches = bindings.filter(binding => binding.route === route);
  if (!matches.length) return fallback;
  if (matches.length !== 1) throw new Error('Ambiguous reviewed artwork route: ' + route);
  const binding = matches[0];
  if (binding.status !== 'reviewed_same_tool_binding' || !binding.mapping_evidence?.length) throw new Error('Unreviewed artwork route: ' + route);
  if (!/^[a-z0-9-]+$/.test(binding.source_id) || binding.path !== '/assets/img/tools/' + binding.source_id + '.webp') throw new Error('Invalid artwork path: ' + route);
  const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, binding.path))).digest('hex');
  if (hash !== binding.sha256) throw new Error('Reviewed image hash drift: ' + route);
  return binding.path;
}

module.exports = { loadBindings, applyReviewedBindings, resolveReviewedToolArtwork };

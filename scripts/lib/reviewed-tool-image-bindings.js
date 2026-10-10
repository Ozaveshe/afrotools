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

function artworkId(binding) {
  return binding.asset_id || binding.source_id;
}

function validateBinding(binding) {
  const id = artworkId(binding);
  const kinds = {
    reviewed_guide_binding: 'guide',
    reviewed_category_binding: 'category',
    reviewed_localized_tool_binding: 'localized-tool',
  };
  const kind = kinds[binding.status];
  const sameTool = binding.status === 'reviewed_same_tool_binding';
  if (!binding.mapping_evidence?.length || (!sameTool && !kind)) throw new Error('Unreviewed artwork route: ' + binding.route);
  if (sameTool && (!String(binding.route).startsWith('/sw/') || binding.asset_id)) throw new Error('Unreviewed localized binding: ' + binding.id);
  if (kind) {
    const prefix = { en: '/tools/', fr: '/fr/', sw: '/sw/' }[binding.lang];
    if (binding.binding_kind !== kind || (kind === 'localized-tool' && binding.lang !== 'sw') || !prefix || !String(binding.route).startsWith(prefix)
      || !Object.hasOwn(binding, 'expected_image_id') || !Object.hasOwn(binding, 'expected_image_path')
      || !(binding.expected_image_id === null || typeof binding.expected_image_id === 'string')
      || typeof binding.expected_image_path !== 'string'
      || !binding.review_scope || !binding.note || !binding.reviewed_at
      || binding.text_status !== 'no-language-specific-text-reviewed') throw new Error('Unreviewed explicit artwork binding: ' + binding.id);
    if (binding.expected_image_path && !/^\/assets\/img\/tools\/[a-z0-9-]+\.(webp|png|jpe?g|svg)$/.test(binding.expected_image_path)) throw new Error('Invalid previous artwork path: ' + binding.id);
  }
  if (!/^[a-z0-9-]+$/.test(id) || binding.path !== '/assets/img/tools/' + id + '.webp') throw new Error('Invalid artwork path: ' + binding.id);
  const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, binding.path))).digest('hex');
  if (hash !== binding.sha256) throw new Error('Reviewed image hash drift: ' + binding.id);
  return { id, kind, sameTool };
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
    const { id } = binding;
    if (seen.has(id)) throw new Error('Duplicate reviewed target: ' + id);
    seen.add(id);
    const row = rows.get(id), original = rows.get(binding.source_id);
    if (!row || row.href !== binding.route || !original || original.href !== binding.source_route) throw new Error('Reviewed route drift: ' + id);
    const { id: imageId, kind, sameTool } = validateBinding(binding);
    if ((sameTool && row.lang !== 'sw') || (kind && (row.lang || 'en') !== binding.lang)) throw new Error('Reviewed artwork locale drift: ' + id);
    const currentImage = sandbox.getToolCardImagePath(row);
    if (kind) {
      if (![(binding.expected_image_id || null), imageId].includes(row.imageId || null)
        || ![binding.expected_image_path, binding.path].includes(currentImage || '')) throw new Error('Existing image conflict: ' + id);
    } else if ((row.imageId && row.imageId !== imageId) || (currentImage && currentImage !== binding.path)) throw new Error('Existing image conflict: ' + id);
    const matches = nodes.get(id) || [];
    if (matches.length !== 1) throw new Error('Ambiguous registry declaration: ' + id);
    const node = matches[0];
    const property = node.properties.find(p => p.type === 'Property' && (p.key.name || p.key.value) === 'imageId');
    if (!property) {
      const last = node.properties[node.properties.length - 1];
      const trailingComma = source.slice(last.end, node.end - 1).includes(',');
      edits.push({ start: node.end - 1, end: node.end - 1, text: (trailingComma ? ' ' : ', ') + 'imageId: ' + JSON.stringify(imageId) + ' ' });
    } else if (kind && property.value.value !== imageId) {
      edits.push({ start: property.value.start, end: property.value.end, text: JSON.stringify(imageId) });
    }
  }
  let next = source;
  edits.sort((a, b) => b.start - a.start).forEach(edit => { next = next.slice(0, edit.start) + edit.text + next.slice(edit.end); });
  acorn.parse(next, { ecmaVersion: 'latest' });
  return next;
}

function resolveReviewedToolArtwork(route, fallback, bindings = loadBindings()) {
  const matches = bindings.filter(binding => binding.route === route);
  if (!matches.length) return fallback;
  if (matches.length !== 1) throw new Error('Ambiguous reviewed artwork route: ' + route);
  const binding = matches[0];
  validateBinding(binding);
  return binding.path;
}

module.exports = { loadBindings, artworkId, applyReviewedBindings, resolveReviewedToolArtwork };

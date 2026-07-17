'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT, 'data', 'source-registry.json');
const HELPER_PATH = path.join(ROOT, 'assets', 'js', 'lib', 'source-confidence.js');
const SAMPLE_TARGETS = Object.freeze([
  { file: 'angola/ao-paye.html', sourceId: 'paye-ao-source', category: 'PAYE' },
  { file: 'angola/ao-vat.html', sourceId: 'vat-ao-source', category: 'VAT' },
  { file: 'tools/social-security/index.html', sourceId: 'social-security-country-packs', category: 'Social security' },
  { file: 'tools/electricity-estimator/index.html', sourceId: 'electricity-tariff-rates', category: 'Electricity' },
  { file: 'tools/remittance-compare/index.html', sourceId: 'remittance-fx-planning', category: 'Remittance' },
]);

function atomicWrite(targetPath, content) {
  const directory = path.dirname(targetPath);
  const tempPath = path.join(directory, '.' + path.basename(targetPath) + '.' + process.pid + '.' + Date.now() + '.tmp');
  try {
    fs.writeFileSync(tempPath, content, 'utf8');
    fs.renameSync(tempPath, targetPath);
  } catch (error) {
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch (_cleanupError) {
      // Preserve the original write or rename error.
    }
    throw error;
  }
}

function normalizeRoute(value) {
  let route = String(value || '').split(/[?#]/)[0].replace(/\\/g, '/').replace(/^\/+/, '/');
  route = route.replace(/\/index\.html\/?$/i, '/').replace(/\.html$/i, '').replace(/\/+$/, '');
  return (route || '/').toLowerCase();
}

function routeToFile(route) {
  const clean = normalizeRoute(route).replace(/^\/+/, '');
  const candidates = [clean + '.html', path.join(clean, 'index.html')];
  return candidates.find(function (candidate) { return fs.existsSync(path.join(ROOT, candidate)); }) || null;
}

function helperScriptTag() {
  const hash = crypto.createHash('md5').update(fs.readFileSync(HELPER_PATH)).digest('hex').slice(0, 8);
  return '<script src="/assets/js/lib/source-confidence.js?v=' + hash + '" defer></script>';
}

function hookMarkup(sourceId, indent) {
  const prefix = indent || '';
  return [
    prefix + '<!-- AfroTools source confidence -->',
    prefix + '<div class="container afro-source-meta" data-source-meta-id="' + sourceId + '" data-source-meta-compact="true"></div>',
  ].join('\n');
}

function isInsideScript(html, index) {
  const before = html.slice(0, index).toLowerCase();
  return before.lastIndexOf('<script') > before.lastIndexOf('</script>');
}

function lastSafeClosingTag(html, tagName) {
  const needle = '</' + tagName.toLowerCase() + '>';
  let index = html.toLowerCase().lastIndexOf(needle);
  while (index >= 0 && isInsideScript(html, index)) {
    index = html.toLowerCase().lastIndexOf(needle, index - 1);
  }
  return index;
}

function addSourceHook(html, sourceId, relativePath) {
  const matchingId = 'data-source-meta-id="' + sourceId + '"';
  if (html.includes(matchingId)) return { html, action: 'already-present' };

  const hookOpen = html.match(/<div\b[^>]*class="[^"]*\bafro-source-meta\b[^"]*"[^>]*>/i);
  if (hookOpen) {
    if (/data-source-meta-id=/i.test(hookOpen[0])) {
      return { html, action: 'conflict', message: relativePath + ' already has a different source id.' };
    }
    let replacement = hookOpen[0].replace(/>$/, ' data-source-meta-id="' + sourceId + '" data-source-meta-compact="true">');
    return { html: html.replace(hookOpen[0], replacement), action: 'updated-existing-hook' };
  }

  const verificationPanel = html.match(/<section\b[^>]*\bdata-tool-verification-panel\b[^>]*>/i);
  if (verificationPanel && !isInsideScript(html, verificationPanel.index)) {
    const end = verificationPanel.index + verificationPanel[0].length;
    const markup = '\n' + hookMarkup(sourceId, '  ');
    return { html: html.slice(0, end) + markup + html.slice(end), action: 'inserted-verification-panel' };
  }

  const mainClose = lastSafeClosingTag(html, 'main');
  const bodyClose = lastSafeClosingTag(html, 'body');
  const index = mainClose >= 0 ? mainClose : bodyClose;
  if (index < 0) return { html, action: 'conflict', message: relativePath + ' has no safe main/body insertion point.' };
  const markup = '\n' + hookMarkup(sourceId, '  ') + '\n';
  return { html: html.slice(0, index) + markup + html.slice(index), action: mainClose >= 0 ? 'inserted-before-main-close' : 'inserted-before-body-close' };
}

function addHelperScript(html, relativePath) {
  if (/\/assets\/js\/lib\/source-confidence\.js(?:\?|"|')/i.test(html)) return { html, action: 'already-present' };
  const headClose = lastSafeClosingTag(html, 'head');
  if (headClose < 0) return { html, action: 'conflict', message: relativePath + ' has no safe head insertion point.' };
  return { html: html.slice(0, headClose) + helperScriptTag() + '\n' + html.slice(headClose), action: 'inserted' };
}

function primaryRouteTargets(registry) {
  const priority = function (id) {
    if (/^(?:import-duty-planning-rates|afrofuel-static-snapshot|forex-third-party-snapshot|afrorates-policy-rate-pack)$/.test(id)) return 100;
    if (/^(?:paye-[a-z]{2}-source|vat-[a-z]{2}-source)$/.test(id)) return 90;
    if (/^(?:social-security-country-packs|electricity-tariff-rates|remittance-fx-planning)$/.test(id)) return 85;
    if (/^ledger-tool-/.test(id)) return 70;
    return 0;
  };
  const byFile = new Map();
  registry.sources.forEach(function (source) {
    const weight = priority(source.id);
    if (!weight) return;
    (source.routes || []).forEach(function (route) {
      const file = routeToFile(route);
      if (!file) return;
      const current = byFile.get(file);
      if (!current || weight > current.weight) byFile.set(file, { file, sourceId: source.id, weight });
    });
  });
  return Array.from(byFile.values()).sort(function (a, b) { return a.file.localeCompare(b.file); });
}

function applyTargets(targets) {
  const results = [];
  targets.forEach(function (target) {
    const filePath = path.join(ROOT, target.file);
    if (!fs.existsSync(filePath)) {
      results.push(Object.assign({}, target, { action: 'conflict', message: target.file + ' does not exist.' }));
      return;
    }
    const original = fs.readFileSync(filePath, 'utf8');
    const hookResult = addSourceHook(original, target.sourceId, target.file);
    if (hookResult.action === 'conflict') {
      results.push(Object.assign({}, target, hookResult));
      return;
    }
    const scriptResult = addHelperScript(hookResult.html, target.file);
    if (scriptResult.action === 'conflict') {
      results.push(Object.assign({}, target, scriptResult));
      return;
    }
    if (scriptResult.html !== original) atomicWrite(filePath, scriptResult.html);
    results.push(Object.assign({}, target, {
      action: scriptResult.html === original ? 'already-present' : hookResult.action,
      helperAction: scriptResult.action,
    }));
  });
  return results;
}

function main() {
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  const targets = process.argv.includes('--sample') ? SAMPLE_TARGETS : primaryRouteTargets(registry);
  const results = applyTargets(targets);
  const conflicts = results.filter(function (result) { return result.action === 'conflict'; });
  results.forEach(function (result) {
    console.log(result.action + ': ' + result.file + ' -> ' + result.sourceId + (result.message ? ' (' + result.message + ')' : ''));
  });
  if (conflicts.length) process.exit(1);
  console.log('Source-confidence hooks processed: ' + results.length + ' pages; ' + results.filter(function (result) { return result.action !== 'already-present'; }).length + ' changed.');
}

if (require.main === module) main();

module.exports = {
  SAMPLE_TARGETS,
  addHelperScript,
  addSourceHook,
  applyTargets,
  isInsideScript,
  primaryRouteTargets,
  routeToFile,
};

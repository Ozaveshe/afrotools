'use strict';

const fs = require('fs');
const path = require('path');

const ACTION_PATTERN = /\b(pdf|csv|json|txt|texte|text|ics|calendrier|calendar|png|jpe?g|svg|imprimer|impression|print|copier|copy|t[ée]l[ée]charger|download)\b/i;
const CONTROL_PATTERN = /<(button|a|input)\b([^>]*)(?:>([\s\S]*?)<\/\1>|\/?>)/gi;

function normalizeRoute(value) {
  const route = String(value || '').replace(/^https?:\/\/[^/]+/i, '').split(/[?#]/)[0]
    .replace(/\/index\.html$/i, '/').replace(/\.html$/i, '').replace(/\/+/g, '/');
  if (!route || route === '/') return '/';
  return `/${route.replace(/^\/+|\/+$/g, '')}`;
}

function resolveRouteFile(root, routeValue) {
  const route = normalizeRoute(routeValue).replace(/^\/+/, '');
  const candidates = [
    path.join(root, `${route}.html`),
    path.join(root, route, 'index.html'),
    path.join(root, route, 'app.html')
  ];
  return candidates.find((file) => fs.existsSync(file)) || null;
}

function decodeEntities(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&eacute;|&#233;/gi, 'é')
    .replace(/&egrave;|&#232;/gi, 'è')
    .replace(/&agrave;|&#224;/gi, 'à')
    .replace(/&ocirc;|&#244;/gi, 'ô')
    .replace(/&ccedil;|&#231;/gi, 'ç')
    .replace(/\s+/g, ' ')
    .trim();
}

function attribute(attrs, name) {
  const match = String(attrs || '').match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return match ? (match[1] || match[2] || match[3] || '') : '';
}

function cssEscape(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function actionFormat(signal) {
  const value = String(signal || '').toLowerCase();
  if (/\b(?:imprimer|impression|print)\b/.test(value)) return 'print';
  if (/\b(?:copier|copy)\b/.test(value)) return 'copy';
  if (/\bpdf\b/.test(value)) return 'pdf';
  if (/\bcsv\b/.test(value)) return 'csv';
  if (/\bjson\b/.test(value)) return 'json';
  if (/\b(?:txt|texte|text)\b/.test(value)) return 'txt';
  if (/\b(?:ics|calendrier|calendar)\b/.test(value)) return 'ics';
  if (/\bpng\b/.test(value)) return 'png';
  if (/\bjpe?g\b/.test(value)) return 'jpeg';
  if (/\bsvg\b/.test(value)) return 'svg';
  if (/\b(?:t[ée]l[ée]charger|download)\b/.test(value)) return 'download';
  return null;
}

function selectorFor(tag, attrs, label, format) {
  const id = attribute(attrs, 'id');
  if (id) return `#${id}`;
  const names = [...String(attrs || '').matchAll(/\b(data-[\w-]+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/gi)]
    .map((match) => match[1].toLowerCase());
  const preferred = names.find((name) => name.includes(format)) || names[0];
  if (preferred) return `[${preferred}]`;
  const onclick = attribute(attrs, 'onclick');
  if (onclick) return `${tag.toLowerCase()}[onclick="${cssEscape(onclick)}"]`;
  return `role=${tag.toLowerCase() === 'a' ? 'link' : 'button'}[name="${cssEscape(label)}"]`;
}

function extractActions(html, file, root) {
  const actions = [];
  let match;
  while ((match = CONTROL_PATTERN.exec(String(html || '')))) {
    const [raw, tag, attrs, inner] = match;
    if (tag.toLowerCase() === 'input' && !/^(?:button|submit)$/i.test(attribute(attrs, 'type'))) continue;
    const label = decodeEntities(
      attribute(attrs, 'aria-label')
      || attribute(attrs, 'title')
      || attribute(attrs, 'value')
      || inner
    );
    const signal = [
      label,
      attribute(attrs, 'id'),
      attribute(attrs, 'class'),
      attribute(attrs, 'onclick'),
      attribute(attrs, 'download'),
      attrs
    ].join(' ');
    if (/^(?:import|importer)\b/i.test(label)) continue;
    if (tag.toLowerCase() === 'a') {
      const href = attribute(attrs, 'href');
      const actionBound = /\bdownload\b/i.test(attrs)
        || /\bonclick\b/i.test(attrs)
        || /\bdata-(?:export|download|copy|print|pdf|csv|json|txt|image)\b/i.test(attrs);
      if (!actionBound || /^https?:\/\//i.test(href)) continue;
    }
    if (!ACTION_PATTERN.test(signal)) continue;
    const format = actionFormat(signal);
    if (!format) continue;
    const selector = selectorFor(tag, attrs, label, format);
    const before = String(html || '').slice(0, match.index);
    const line = before.split(/\r?\n/).length;
    const evidence = `${path.relative(root, file).replace(/\\/g, '/')}:${line}`;
    const key = `${format}|${selector}|${label}`;
    if (actions.some((action) => action.key === key)) continue;
    actions.push({
      key,
      format,
      selector,
      label: label || format.toUpperCase(),
      evidence,
      advertised: true,
      rawControl: raw.replace(/\s+/g, ' ').slice(0, 240)
    });
  }
  return actions.map(({ key, ...action }) => action);
}

function uniqueFormats(actions) {
  return [...new Set(actions.map((action) => action.format))].sort();
}

function extractConfiguredFrenchActions(html, file, root) {
  const match = String(html || '').match(
    /<script\b[^>]*\bid=["']afrotools-fr-finance-export-contract["'][^>]*>([\s\S]*?)<\/script>/i
  );
  if (!match) return [];
  let config;
  try {
    config = JSON.parse(match[1]);
  } catch (error) {
    return [];
  }
  const line = String(html || '').slice(0, match.index).split(/\r?\n/).length;
  const evidence = `${path.relative(root, file).replace(/\\/g, '/')}:${line}`;
  return (Array.isArray(config.formats) ? config.formats : [])
    .filter((format) => ['copy', 'txt', 'csv', 'json', 'pdf', 'print', 'ics', 'svg', 'png', 'jpeg'].includes(format))
    .map((format) => ({
      format,
      selector: `[data-fr-finance-export-format="${format}"]`,
      label: `Export local ${format.toUpperCase()}`,
      evidence,
      advertised: true,
      implementation: '/assets/js/pages/french-finance-export-contract.js'
    }));
}

function buildStaticExportContract(root, row, frenchHtml) {
  const englishFile = resolveRouteFile(root, row.englishRoute);
  const englishHtml = englishFile ? fs.readFileSync(englishFile, 'utf8') : '';
  const frenchFile = path.join(root, row.primaryFrenchFile);
  const englishActions = englishFile ? extractActions(englishHtml, englishFile, root) : [];
  const frenchActions = fs.existsSync(frenchFile)
    ? [
        ...extractActions(frenchHtml, frenchFile, root),
        ...extractConfiguredFrenchActions(frenchHtml, frenchFile, root)
      ]
    : [];
  const englishFormats = uniqueFormats(englishActions);
  const frenchFormats = uniqueFormats(frenchActions);
  const missingFrenchFormats = englishFormats.filter((format) => !frenchFormats.includes(format));
  let classification = 'required';
  if (!englishActions.length && !frenchActions.length) classification = 'notApplicable';
  else if (missingFrenchFormats.length) classification = 'productGap';
  return {
    classification,
    englishOwner: {
      route: normalizeRoute(row.englishRoute),
      file: englishFile ? path.relative(root, englishFile).replace(/\\/g, '/') : null,
      actions: englishActions,
      formats: englishFormats,
      evidence: englishActions.length
        ? `Detected ${englishActions.length} export, print, or copy control(s) in the English owner.`
        : 'Static owner scan found no export, print, copy, image-download, or file-download control.'
    },
    frenchOwner: {
      route: normalizeRoute(row.primaryFrenchRoute),
      file: row.primaryFrenchFile,
      actions: frenchActions,
      formats: frenchFormats
    },
    missingFrenchFormats,
    fixture: {
      strategy: classification === 'notApplicable'
        ? 'No calculation/export fixture applies.'
        : 'Synthetic values are entered into visible enabled controls; the resulting visible input and output tokens become the row oracle.',
      inputs: [],
      expectedResults: []
    },
    oracles: [],
    privacyGate: {
      expected: 'local-and-ungated',
      fixtureValueNetworkLeak: null,
      accountOrEmailGate: null
    },
    finalStatus: classification === 'notApplicable' ? 'accepted' : 'pending'
  };
}

module.exports = {
  actionFormat,
  buildStaticExportContract,
  extractActions,
  normalizeRoute,
  resolveRouteFile,
  uniqueFormats
};

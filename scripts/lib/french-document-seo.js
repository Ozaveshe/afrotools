'use strict';
const fs = require('fs');
const path = require('path');
function reviewedArtwork(root, pathname, config, artwork, exists = fs.existsSync) {
  const normalize = value => '/' + String(value).replace(/^\/+|\/+$/g, '') + '/';
  const app = config.apps.find(row => [row.frenchRoute, row.frenchWorkspaceRoute].filter(Boolean).some(route => normalize(route) === normalize(pathname)));
  const row = app && artwork.rows.find(row => row.id === app.id);
  if (!row || !/^\/assets\/img\/[\w/.-]+$/.test(row.asset) || row.asset.includes('..') || !exists(path.join(root, row.asset.slice(1)))) return null;
  return row.asset;
}
function localizeBreadcrumbParents(schema) {
  if (Array.isArray(schema)) return schema.map(localizeBreadcrumbParents);
  if (!schema || typeof schema !== 'object') return schema;
  const result = Object.fromEntries(Object.entries(schema).map(([key, value]) => [key, localizeBreadcrumbParents(value)]));
  if (schema['@type'] !== 'BreadcrumbList' || !Array.isArray(result.itemListElement)) return result;
  result.itemListElement = result.itemListElement.map(item => {
    if (!item || typeof item !== 'object') return item;
    const localized = {...item};
    for (const key of ['item', 'url']) {
      const value = localized[key];
      if (typeof value !== 'string') continue;
      if (/^(?:https:\/\/afrotools\.com)?\/$/.test(value)) localized[key] = 'https://afrotools.com/fr/';
      if (/^(?:https:\/\/afrotools\.com)?\/tools\/?$/.test(value)) localized[key] = 'https://afrotools.com/fr/all-tools/';
    }
    return localized;
  });
  return result;
}
module.exports = {reviewedArtwork, localizeBreadcrumbParents};

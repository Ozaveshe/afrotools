// Native metadata for document recommendations; route/name identity stays in the app catalogs.
'use strict';
const swDescriptions = require('../../data/localization/sw-document-related-tools.json');
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
}
function localizeDocumentRelatedTools(html, locale, apps) {
  const catalog = new Map(apps.map(app => [app.id, app]));
  // These are generated, quoted-attribute SSR fragments. Leave the rest of each page byte-for-byte intact.
  return html.replace(/<afro-related-tools\b[^>]*>[\s\S]*?<\/afro-related-tools>/gi, component =>
    component.replace(/<a\b((?:[^>"']|"[^"]*"|'[^']*')*)>[\s\S]*?<\/a>/gi, (anchor, attributes) => {
      if (!/\bdata-related-tool(?:\s|=|$)/i.test(attributes)) return anchor;
      const id = /\bdata-id\s*=\s*(["'])(.*?)\1/i.exec(attributes)?.[2];
      const app = catalog.get(id);
      if (!app) return anchor;
      const description = locale === 'sw' ? swDescriptions[id] : app.description;
      const route = locale === 'sw' ? app.swahiliRoute : app.frenchRoute;
      if (!description || !route) throw new Error(`Missing ${locale} related-tool metadata: ${id}`);
      const values = { href: route, 'data-name': app.name, 'data-desc': description };
      for (const [key, value] of Object.entries(values)) {
        const attr = new RegExp(`(^|\\s)${key}\\s*=\\s*(?:"[^"]*"|'[^']*')`, 'i');
        const replacement = `${key}="${escapeHtml(value)}"`;
        attributes = attr.test(attributes)
          ? attributes.replace(attr, (_, prefix) => prefix + replacement)
          : `${attributes} ${replacement}`;
      }
      return `<a${attributes}>${escapeHtml(app.name)}</a>`;
    })
  );
}
module.exports = { localizeDocumentRelatedTools };

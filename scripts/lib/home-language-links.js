'use strict';

const { locales } = require('../../data/registry/locale-manifest.json');

const labels = { en: 'Site language', fr: 'Langue du site', sw: 'Lugha ya tovuti', ha: 'Harshen shafi', yo: 'Èdè ojú-òpó' };

function homeLanguageLinks(current) {
  const choices = locales.filter(locale => ['default', 'launched', 'partial'].includes(locale.launchStatus));
  const links = choices.map(({ id, routePrefix, nativeName }) => {
    const selected = id === current ? ' aria-current="page"' : '';
    return `<a href="${routePrefix}/" lang="${id}" hreflang="${id}"${selected}>${nativeName}</a>`;
  });
  // The enhanced navbar's shadow root replaces this light-DOM navigation when available.
  return `<nav aria-label="${labels[current]}" data-home-languages style="display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:.25rem 1rem;min-height:3rem;padding:.25rem .75rem">${links.join(' ')}</nav>`;
}

module.exports = { homeLanguageLinks };

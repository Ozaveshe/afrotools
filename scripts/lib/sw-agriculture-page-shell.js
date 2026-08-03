'use strict';

const { renderFrenchAgriculturePage } = require('./fr-agriculture-page-shell');
const { alternateEntries } = require('./fr-agriculture-hreflang');

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

function hreflangBlock(row) {
  return alternateEntries(row).map(({ hreflang, route }) => (
    `<link rel="alternate" hreflang="${hreflang}" href="https://afrotools.com${route}">`
  )).join('\n');
}

function replaceAll(content, replacements) {
  let next = content;
  for (const [from, to] of replacements) next = next.split(from).join(to);
  return next;
}

function renderSwahiliAgriculturePage(options) {
  const row = options.row;
  const fakeFrenchRow = {
    ...row,
    french: row.swahili,
    country: row.country ? {
      ...row.country,
      frenchName: options.countryName || row.country.swahiliName || row.country.frenchName
    } : null
  };
  let html = renderFrenchAgriculturePage({
    ...options,
    row: fakeFrenchRow
  });

  html = html.replace(
    /(?:<link rel="alternate" hreflang="[^"]+" href="[^"]+">\r?\n?)+/,
    `${hreflangBlock(row)}\n`
  );
  html = replaceAll(html, [
    ['<html lang="fr"', '<html lang="sw"'],
    ['content="fr"', 'content="sw"'],
    ['"inLanguage":"fr"', '"inLanguage":"sw"'],
    ['content="fr_FR"', 'content="sw_TZ"'],
    ['window.__FR_AGRI_PAGE__', 'window.__SW_AGRI_PAGE__'],
    ['/fr/all-tools/', '/sw/zana-zote/'],
    ['/fr/agriculture/', '/sw/kilimo/'],
    ['/fr/privacy/', '/sw/faragha/'],
    ['/fr/ai/', '/sw/ai/'],
    ['href="/fr/"', 'href="/sw/"'],
    ['"item":"https://afrotools.com/fr/"', '"item":"https://afrotools.com/sw/"'],
    ['AfroTools en franÃ§ais', 'AfroTools kwa Kiswahili'],
    ['AfroTools en français', 'AfroTools kwa Kiswahili'],
    ['Des outils pratiques, gratuits et adaptÃ©s aux contextes africains.', 'Zana za vitendo, bila malipo, kwa mazingira ya Afrika.'],
    ['Des outils pratiques, gratuits et adaptés aux contextes africains.', 'Zana za vitendo, bila malipo, kwa mazingira ya Afrika.'],
    ['Aller au contenu', 'Ruka hadi maudhui'],
    ['Navigation principale', 'Urambazaji mkuu'],
    ['Fil dâ€™Ariane', 'Njia ya ukurasa'],
    ['Fil d’Ariane', 'Njia ya ukurasa'],
    ['Accueil', 'Mwanzo'],
    ['"name":"Agriculture"', '"name":"Kilimo"'],
    ['>Agriculture</a>', '>Kilimo</a>'],
    ['Tous les outils', 'Zana zote'],
    ['Assistant', 'Msaidizi'],
    ['ThÃ¨me sombre', 'Mandhari meusi'],
    ['Thème sombre', 'Mandhari meusi'],
    ['ThÃ¨me clair', 'Mandhari mepesi'],
    ['Thème clair', 'Mandhari mepesi'],
    ['ConfidentialitÃ©', 'Faragha'],
    ['Confidentialité', 'Faragha'],
    ['Illustration de lâ€™outil agricole', 'Mchoro wa zana ya kilimo'],
    ['Illustration de l’outil agricole', 'Mchoro wa zana ya kilimo']
  ]);
  html = html.replace(
    /(?:<link rel="alternate" hreflang="[^"]+" href="[^"]+">\r?\n?)+/,
    `${hreflangBlock(row)}\n`
  );
  if (!row.country && options.currentLabel) {
    html = html.replace(
      '<span aria-current="page"></span>',
      `<span aria-current="page">${escapeHtml(options.currentLabel)}</span>`
    );
  }
  return html;
}

module.exports = {
  hreflangBlock,
  renderSwahiliAgriculturePage
};

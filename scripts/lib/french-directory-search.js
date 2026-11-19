'use strict';

function frenchDirectoryIntent(terms) {
  const query = terms.join(' ');
  if (/^(?:creer|generer|faire|etablir)(?: une| la| des)? factures?$/.test(query)) return 'generateur-factures-fr';
  if (/^(?:(?:calculateur|calculatrice|calculer|calcul|budget|estimation)(?: (?:de la|de|du|pour la|la|le))? )?(?:dot|lobola)$/.test(query) || query === 'calculateur de budget lobola') return 'calculateur-lobola-fr';
  return '';
}

function filterFrenchDirectorySearch(tools, terms, normalize, matchesBroadSearch) {
  if (!terms.length) return tools;
  const finder = typeof window !== 'undefined' && window.AfroFuelDirectoryResult && window.AfroFuelDirectoryResult(terms.join(' '), 'fr', tools);
  if (finder) return [finder];
  const direct = tools.filter(tool => {
    const text = normalize([tool.id, tool.name, tool.desc, tool.href].filter(Boolean).join(' '));
    return terms.every(term => text.includes(term));
  });
  const matches = direct.length ? direct : tools.filter(tool => matchesBroadSearch(tool, terms));
  const preferredId = frenchDirectoryIntent(terms);
  if (preferredId) {
    const preferred = tools.find(tool => tool.id === preferredId);
    if (preferred && !matches.includes(preferred)) return [preferred, ...matches];
  }
  return matches;
}

function repairFrenchDirectorySearch(html) {
  const original = 'tools = tools.filter(t => toolMatchesSearch(t, searchTerms));';
  const replacement = 'tools = filterFrenchDirectorySearch(tools, searchTerms, normalizeText, toolMatchesSearch);';
  const marker = '// FRENCH_DIRECTORY_DIRECT_SEARCH_START';
  const clean = html.replace(/\/\/ FRENCH_DIRECTORY_DIRECT_SEARCH_START[\s\S]*?\/\/ FRENCH_DIRECTORY_DIRECT_SEARCH_END\r?\n/g, '');
  if (!clean.includes(original) && !clean.includes(replacement)) {
    throw new Error('French directory search owner changed; review integration before generation.');
  }
  if (!clean.includes('function renderTools(){')) throw new Error('French directory renderer missing.');
  const withFuelSearch = clean.includes('/assets/js/lib/localized-fuel-search.js') ? clean : clean.replace('</head>', '<script src="/assets/js/lib/localized-fuel-search.js?v=d7036365"></script>\n</head>');
  const mobileFilters = withFuelSearch.replace('.filter-bar{padding:10px 16px;}', '.filter-bar{padding:10px 16px;position:static;}');
  const standardOrder = 'tools.sort((a,b) => (b.priority||0) - (a.priority||0));';
  const searchOrder = "const preferredId = frenchDirectoryIntent(searchTerms);\n    tools.sort((a,b) => (preferredId ? Number(b.id === preferredId) - Number(a.id === preferredId) : 0) || (b.priority||0) - (a.priority||0));";
  if (!mobileFilters.includes(standardOrder) && !mobileFilters.includes(searchOrder)) throw new Error('French directory recommended sort owner missing.');
  return mobileFilters.replace(standardOrder, searchOrder).replace(original, replacement).replace('function renderTools(){', `${marker}\n${frenchDirectoryIntent.toString()}\n${filterFrenchDirectorySearch.toString()}\n// FRENCH_DIRECTORY_DIRECT_SEARCH_END\nfunction renderTools(){`);
}

module.exports = { filterFrenchDirectorySearch, repairFrenchDirectorySearch };

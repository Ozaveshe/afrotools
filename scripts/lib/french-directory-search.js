'use strict';

function filterFrenchDirectorySearch(tools, terms, normalize, matchesBroadSearch) {
  if (!terms.length) return tools;
  const finder = typeof window !== 'undefined' && window.AfroFuelDirectoryResult && window.AfroFuelDirectoryResult(terms.join(' '), 'fr', tools);
  if (finder) return [finder];
  const direct = tools.filter(tool => {
    const text = normalize([tool.id, tool.name, tool.desc, tool.href].filter(Boolean).join(' '));
    return terms.every(term => text.includes(term));
  });
  return direct.length ? direct : tools.filter(tool => matchesBroadSearch(tool, terms));
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
  return mobileFilters.replace(original, replacement).replace('function renderTools(){', `${marker}\n${filterFrenchDirectorySearch.toString()}\n// FRENCH_DIRECTORY_DIRECT_SEARCH_END\nfunction renderTools(){`);
}

module.exports = { filterFrenchDirectorySearch, repairFrenchDirectorySearch };

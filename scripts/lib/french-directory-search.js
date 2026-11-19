'use strict';

function filterFrenchDirectorySearch(tools, terms, normalize, matchesBroadSearch) {
  if (!terms.length) return tools;
  const finder = typeof window !== 'undefined' && window.AfroFuelDirectoryResult && window.AfroFuelDirectoryResult(terms.join(' '), 'fr', tools);
  const topic = finder && terms.length === 1 && /^carburants?$/.test(terms[0]);
  if (finder && !topic) return [finder];
  const direct = tools.filter(tool => {
    const text = normalize([tool.id, tool.name, tool.desc, tool.href].filter(Boolean).join(' '));
    return terms.every(term => text.includes(term));
  });
  const matches = direct.length ? direct : tools.filter(tool => matchesBroadSearch(tool, terms));
  if (!topic) return matches;
  // Preserve other fuel tools and the visitor's selected ordering.
  const recommended = Object.assign({}, finder, { priority: Number.MAX_SAFE_INTEGER });
  return [recommended, ...matches.filter(tool => tool.id !== finder.id)];
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
  const fuelScript = '/assets/js/lib/localized-fuel-search.js?v=f0e9af53';
  const scriptUrl = /\/assets\/js\/lib\/localized-fuel-search\.js(?:\?v=[\w-]+)?/;
  const withFuelSearch = scriptUrl.test(clean)
    ? clean.replace(scriptUrl, fuelScript)
    : clean.replace('</head>', '<script src="' + fuelScript + '"></script>\n</head>');
  const translated = withFuelSearch.replace('>Load more tools</button>', '>Afficher plus d’outils</button>');
  const mobileFilters = translated.replace('.filter-bar{padding:10px 16px;}', '.filter-bar{padding:10px 16px;position:static;}');
  return mobileFilters.replace(original, replacement).replace('function renderTools(){', `${marker}\n${filterFrenchDirectorySearch.toString()}\n// FRENCH_DIRECTORY_DIRECT_SEARCH_END\nfunction renderTools(){`);
}

module.exports = { filterFrenchDirectorySearch, repairFrenchDirectorySearch };

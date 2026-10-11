'use strict';

function filterFrenchDirectorySearch(tools, terms, normalize, matchesBroadSearch) {
  if (!terms.length) return tools;
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
  return clean.replace(original, replacement).replace('function renderTools(){', `${marker}\n${filterFrenchDirectorySearch.toString()}\n// FRENCH_DIRECTORY_DIRECT_SEARCH_END\nfunction renderTools(){`);
}

module.exports = { filterFrenchDirectorySearch, repairFrenchDirectorySearch };

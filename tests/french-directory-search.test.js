'use strict';

const assert = require('node:assert/strict');
const { filterFrenchDirectorySearch, repairFrenchDirectorySearch } = require('../scripts/lib/french-directory-search');
const normalize = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const tools = [
  { id: 'zakat', name: 'Calculateur de zakat', desc: 'Estimer les actifs', href: '/fr/tools/calculateur-zakat/' },
  { id: 'hajj', name: 'Budget Hajj', desc: 'Voyage et logement', href: '/fr/tools/budget-hajj-umrah/' }
];
const broad = (tool, terms) => terms.every(term => normalize(tool.name + ' religion culture zakat hajj').includes(term));
assert.deepEqual(filterFrenchDirectorySearch(tools, ['zakat'], normalize, broad), [tools[0]]);
assert.deepEqual(filterFrenchDirectorySearch(tools, ['voyage', 'logement'], normalize, broad), [tools[1]]);
assert.deepEqual(filterFrenchDirectorySearch(tools, ['religion'], normalize, broad), tools);
assert.deepEqual(filterFrenchDirectorySearch(tools, ['inconnu'], normalize, broad), []);
assert.deepEqual(filterFrenchDirectorySearch(tools, [], normalize, broad), tools);
assert.deepEqual(filterFrenchDirectorySearch(tools.slice(1), ['zakat'], normalize, () => false), []);
assert.deepEqual(filterFrenchDirectorySearch([{ name: 'Épargne solidaire' }], ['epargne'], normalize, broad), [{ name: 'Épargne solidaire' }]);
const page = '<script>function renderTools(){ tools = tools.filter(t => toolMatchesSearch(t, searchTerms)); }</script>';
const repaired = repairFrenchDirectorySearch(page);
assert.equal(repairFrenchDirectorySearch(repaired), repaired);
assert.throws(() => repairFrenchDirectorySearch('<html></html>'), /owner changed/);
console.log('French directory search: nine relevance, scope and owner-preservation cases passed.');

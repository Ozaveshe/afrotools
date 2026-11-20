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
assert.deepEqual(filterFrenchDirectorySearch([{ name: 'Ã‰pargne solidaire' }], ['epargne'], normalize, broad), [{ name: 'Ã‰pargne solidaire' }]);
const page = '<script>function renderTools(){ tools = tools.filter(t => toolMatchesSearch(t, searchTerms)); tools.sort((a,b) => (b.priority||0) - (a.priority||0)); }</script>';
const repaired = repairFrenchDirectorySearch(page);
assert.equal(repairFrenchDirectorySearch(repaired), repaired);
assert.throws(() => repairFrenchDirectorySearch('<html></html>'), /owner changed/);
const calculator = { id:'calculateur-lobola-fr', name:'Calculateur de budget Lobola', href:'/fr/tools/calculateur-lobola' };
const guide = { id:'guide', name:'Calculateur de lobola — Botswana', href:'/fr/tools/calculateur-de-lobola-botswana/' };
assert.deepEqual(filterFrenchDirectorySearch([guide, calculator], ['calculateur','de','dot'], normalize, () => false), [calculator]);
assert.deepEqual(filterFrenchDirectorySearch([guide], ['calculateur','de','dot'], normalize, () => false), []);
assert.deepEqual(filterFrenchDirectorySearch([guide, calculator], ['lobola','botswana'], normalize, () => false), [guide]);
const invoice = { id:'generateur-factures-fr', name:'Générateur de factures', href:'/fr/tools/generateur-factures/' };
assert.deepEqual(filterFrenchDirectorySearch([invoice], ['creer','une','facture'], normalize, () => false), [invoice]);
assert.deepEqual(filterFrenchDirectorySearch([invoice], ['creer','une','facture','proforma'], normalize, () => false), []);
assert.deepEqual(filterFrenchDirectorySearch([calculator], ['calculer','la','dot'], normalize, () => false), [calculator]);
console.log('French directory: search relevance, filtered scope and owner checks passed.');

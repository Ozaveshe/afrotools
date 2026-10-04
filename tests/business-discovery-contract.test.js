'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),owner=require('../scripts/lib/route-contract');
const peers=['/business/','/fr/entreprises/','/sw/biashara/'];
const tax=['/vat-business-tax/','/fr/vat-business-tax/','/sw/vat-na-kodi/'];
const sources=owner.loadRouteSources();
const graph=owner.buildRouteGraph({...sources,pages:sources.pages.filter(p=>[...peers,...tax].includes(p.route)),rules:[]});

test('Business discovery stays a real page in all three languages with a separate tax group',()=>{
 const groups=new Set();
 for(const route of peers){const page=owner.getRouteRecord(graph,route);assert(page,route);assert.equal(page.state,'page');assert.equal(page.canonicalRoute,route);assert.equal(page.indexability,'indexable');groups.add(page.equivalenceGroup);}
 assert.equal(groups.size,1);assert(!groups.has(null));
 const taxGroup=owner.getRouteRecord(graph,tax[0]).equivalenceGroup;
 assert(!groups.has(taxGroup));
 for(const route of tax)assert.equal(owner.getRouteRecord(graph,route).equivalenceGroup,taxGroup);
 assert.equal(owner.validateEquivalenceGroups(graph.equivalenceGroups,graph.routes).errors.length,0);
});

test('English discovery cannot silently redirect and provides the advertised business task links',()=>{
 const html=fs.readFileSync(path.join(root,'business/index.html'),'utf8');
 assert(!/<meta\b[^>]*http-equiv=["']refresh["']/i.test(html));
 assert(!/location\.(?:replace|href)\s*(?:\(|=)/.test(html));
 assert.match(html,/<h1>Business solutions<\/h1>/);
 for(const route of ['/tools/invoice-generator/','/salary-tax/','/vat-business-tax/','/tools/business-registration/','/tools/break-even/','/document-pdf/'])assert(html.includes('href="'+route+'"'));
 assert.match(html,/<main>[\s\S]*<\/main>/);
 assert.match(html,/aria-label="Explore business tools"/);
});

test('English social identity and CollectionPage describe the retained Business route',()=>{
 const html=fs.readFileSync(path.join(root,'business/index.html'),'utf8');
 const social=require('../scripts/audit-social-metadata').metadata(html);
 assert.equal(social['og:url'],'https://afrotools.com/business/');
 assert.equal(social['twitter:card'],'summary_large_image');
 assert(social['og:title'].includes('Business Solutions'));assert(!social['og:title'].includes('Redirecting'));
 const schemas=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
 assert(schemas.some(s=>s['@type']==='CollectionPage'&&s.url===social['og:url']&&s.inLanguage==='en'));
});

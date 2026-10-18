'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createReviewedCardIdentity}=require('./support/reviewed-resource-card-identity');
const routeApi=require('../scripts/lib/route-contract');
const graph=require('../data/registry/route-graph.json');
const bindings=require('../data/image-generation/blog-artwork-bindings.json').images.filter(row=>row.placement==='listing-card');
const file='fr/blog/index.html',alias='/fr/blog/tva-maroc-taux-calcul/',canonical='/blog/tva-maroc-taux-calcul/';
const row=bindings.find(item=>item.file===file&&item.route===alias);
assert(row,'Original reviewed alias binding must remain present');
const one=()=>createReviewedCardIdentity([row],graph);

test('real generated graph and reviewed bindings construct without rebuilding the graph',()=>{
  assert.equal(routeApi.getRouteRecord(graph,alias).state,'redirect');
  assert.equal(routeApi.getRouteRecord(graph,alias).statusCode,301);
  assert.equal(routeApi.getRouteRecord(graph,canonical).state,'page');
  assert.equal(routeApi.rewriteInternalHref(graph,alias),canonical);
  assert.doesNotThrow(()=>createReviewedCardIdentity(bindings,graph));
});
test('real original alias and exact canonical page receive the same reviewed image and alt',()=>{
  const identities=one();assert.equal(identities.keyFor(file,alias),identities.keyFor(file,canonical));
  for(const route of [alias,canonical]){
    const coverage=identities.createCoverage();assert.equal(coverage.observe(file,route).row,row);
    coverage.assertArtwork(file,route,row.path,row.alt);coverage.assertComplete();
  }
});
test('unrelated existing page cannot satisfy reviewed binding or coverage',()=>{
  const route='/blog/best-free-pdf-tools-online/';assert.equal(routeApi.getRouteRecord(graph,route).state,'page');
  const coverage=one().createCoverage();assert.equal(coverage.observe(file,route).row,undefined);
  assert.throws(()=>coverage.assertArtwork(file,route,row.path,row.alt),/Missing reviewed binding/);
  assert.throws(()=>coverage.assertComplete(),/Missing reviewed card/);
});
test('unknown and permissively normalized unlisted routes are rejected as nonexact pages',()=>{
  const identities=one();
  for(const route of ['/blog/not-a-real-reviewed-card/','/blog/tva-maroc-taux-calcul/?unreviewed=1','/blog/tva-maroc-taux-calcul/#unreviewed','https://example.test/blog/tva-maroc-taux-calcul/'])assert.throws(()=>identities.keyFor(file,route),/exact generated page|Internal card route/);
});
test('alias and canonical observed together fail instead of silently collapsing',()=>{
  for(const routes of [[alias,canonical],[canonical,alias]]){
    const coverage=one().createCoverage();coverage.observe(file,routes[0]);
    assert.throws(()=>coverage.observe(file,routes[1]),/Rendered card canonical collision/);
  }
});
test('duplicate alias and canonical binding rows fail before coverage',()=>{
  assert.throws(()=>createReviewedCardIdentity([row,{...row,route:canonical}],graph),/Reviewed binding canonical collision/);
});
test('wrong reviewed image and alt remain exact failures',()=>{
  const coverage=one().createCoverage();coverage.observe(file,canonical);
  assert.throws(()=>coverage.assertArtwork(file,canonical,'/assets/img/blog/wrong-image.webp',row.alt),/Reviewed image differs/);
  assert.throws(()=>coverage.assertArtwork(file,canonical,row.path,row.alt+'!'),/Reviewed alt differs/);
  coverage.assertArtwork(file,canonical,row.path,row.alt);coverage.assertComplete();
});
test('missing reviewed card, empty bindings and missing artwork metadata fail closed',()=>{
  assert.throws(()=>one().createCoverage().assertComplete(),/Missing reviewed card/);
  assert.throws(()=>createReviewedCardIdentity([],graph),/bindings required/);
  const missing={...row};delete missing.path;
  assert.throws(()=>createReviewedCardIdentity([missing],graph),/path and alt required/);
});

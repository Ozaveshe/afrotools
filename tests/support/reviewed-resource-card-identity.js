'use strict';
const assert=require('node:assert/strict');
const routeApi=require('../../scripts/lib/route-contract');

function createReviewedCardIdentity(bindings,graph){
  assert(Array.isArray(bindings)&&bindings.length>0,'Reviewed card bindings required');
  assert(graph&&Array.isArray(graph.routes),'Genuine generated route graph required');
  function keyFor(file,route){
    assert(typeof file==='string'&&file.length>0&&!file.includes('#'),'Reviewed card file required');
    assert(typeof route==='string'&&route.startsWith('/')&&!route.startsWith('//'),'Internal card route required');
    const canonical=routeApi.rewriteInternalHref(graph,route);
    const record=routeApi.getRouteRecord(graph,canonical);
    assert(record&&record.state==='page'&&record.route===canonical,'Card route must resolve to an exact generated page: '+route);
    return file+'#'+canonical;
  }
  const expected=new Map();
  for(const row of bindings){
    assert(typeof row.path==='string'&&row.path.length>0&&typeof row.alt==='string','Reviewed artwork path and alt required');
    const key=keyFor(row.file,row.route);
    assert(!expected.has(key),'Reviewed binding canonical collision: '+key);
    expected.set(key,row);
  }
  function createCoverage(){
    const observed=new Set();
    return {
      observe(file,route){
        const key=keyFor(file,route);
        assert(!observed.has(key),'Rendered card canonical collision: '+key);
        observed.add(key);
        return {key,row:expected.get(key)};
      },
      assertArtwork(file,route,source,alt){
        const key=keyFor(file,route),row=expected.get(key);
        assert(row,'Missing reviewed binding: '+key);
        assert.equal(source,row.path,'Reviewed image differs: '+key);
        assert.equal(alt,row.alt,'Reviewed alt differs: '+key);
      },
      assertComplete(){
        for(const key of expected.keys())assert(observed.has(key),'Missing reviewed card: '+key);
      }
    };
  }
  return {keyFor,createCoverage};
}
module.exports={createReviewedCardIdentity};

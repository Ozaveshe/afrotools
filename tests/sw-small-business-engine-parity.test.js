"use strict";
const assert=require("assert"),fs=require("fs"),path=require("path");
const {routes}=require("../scripts/lib/sw-small-business-parity-config"),engine=require("../assets/js/engines/small-business-parity");
const french=require("../scripts/lib/fr-small-business-parity-config").routes;
assert.strictEqual(routes.length,28,"exact SME denominator");
assert.deepStrictEqual(routes.map(r=>r.id),french.map(r=>r.id),"English ids and order must match the established semantic owner");
for(const route of routes){
  const semantic=french.find(r=>r.id===route.id),input=Object.fromEntries(route.fields.map(f=>[f.name,f.value])),semanticInput=Object.fromEntries(semantic.fields.map(f=>[f.name,f.value]));
  const actual=engine.calculate(route.id,input),oracle=engine.calculate(route.id,semanticInput);
  assert.strictEqual(actual.ok,true,`${route.id} default fixture calculates`);
  assert.strictEqual(oracle.ok,true,`${route.id} semantic oracle calculates`);
  for(const [key,value] of Object.entries(oracle.values)){if(typeof value==="number")assert.strictEqual(actual.values[key],value,`${route.id}.${key} formula drift`);}
  assert.ok(route.formula.length>30,`${route.id} formula trace`);
  assert.ok(fs.existsSync(path.join(__dirname,"..","assets","img","tools",`${route.id}.webp`)),`${route.id} artwork`);
  const html=fs.readFileSync(path.join(__dirname,"..","sw","zana",route.slug,"index.html"),"utf8");
  assert.match(html,new RegExp(`data-sme-tool="${route.id}"`));
  assert.match(html,/hreflang="sw"/);assert.match(html,/hreflang="en"/);assert.match(html,/application\/ld\+json/);assert.match(html,/hakuna rate au ada ya moja kwa moja/i);
  assert.doesNotMatch(html,/<iframe\b/i);
}
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,"..","data","localization","sw-small-business-parity.json"),"utf8"));
assert.strictEqual(manifest.denominator,28);assert.deepStrictEqual(manifest.routes.map(r=>r.id),routes.map(r=>r.id));
console.log("PASS sw-small-business parity: 28/28 engine formulas, owners, artwork and metadata");

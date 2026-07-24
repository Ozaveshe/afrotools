const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"..");
const routes=[
  ["tools/paystack-calculator/index.html","en"],
  ["fr/tools/calculateur-paystack/index.html","fr"],
  ["ha/kayan-aiki/kalkuletan-paystack/index.html","ha"]
];

test("English, French and Hausa are reciprocal native calculator routes",()=>{
  for(const [file,lang] of routes){
    const html=fs.readFileSync(path.join(root,file),"utf8");
    assert.match(html,new RegExp(`<html lang="${lang}">`));
    assert.match(html,new RegExp(`data-locale="${lang}"`));
    assert.match(html,/paystack-fee-planner\.js/);
    assert.match(html,/hreflang="en"/);assert.match(html,/hreflang="fr"/);assert.match(html,/hreflang="ha"/);
    assert.doesNotMatch(html,/<iframe|https:\/\/cdn\.jsdelivr|cdnjs\.cloudflare/i);
  }
});

test("routes retire false free-threshold, exact-fee and unsupported Nigeria VAT claims",()=>{
  const html=routes.map(([file])=>fs.readFileSync(path.join(root,file),"utf8")).join("\n");
  assert.doesNotMatch(html,/waives the processing fee entirely|calculate exactly|7\.5% VAT on (their|Paystack) processing fees/i);
  assert.match(html,/waives only the NGN 100 fixed component/);
  assert.match(html,/below NGN 2,500/);
});

test("visible FAQ exactly matches FAQPage structured data on every locale",()=>{
  for(const [file] of routes){
    const html=fs.readFileSync(path.join(root,file),"utf8");
    const blocks=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match=>JSON.parse(match[1]));
    const faq=blocks.find(block=>block["@type"]==="FAQPage");
    assert.ok(faq);
    const visible=[...html.matchAll(/<details><summary>(.*?)<\/summary><p>(.*?)<\/p><\/details>/g)].map(match=>[match[1],match[2]]);
    assert.deepEqual(visible,faq.mainEntity.map(item=>[item.name,item.acceptedAnswer.text]));
  }
});

test("AI context is route-only, source-coupled and excludes invented parity",()=>{
  const context=JSON.parse(fs.readFileSync(path.join(root,"data/ai/tool-context/paystack-calculator.json"),"utf8"));
  assert.equal(context.status,"source-coupled");
  assert.match(context.staticText,/route-only/i);
  assert.match(context.staticText,/No widget, fee API/i);
  assert.doesNotMatch(context.staticText,/\d/);
  assert.deepEqual(context.sourceBindings[0],{kind:"paystack-fee-planner",toolId:"paystack-calculator",route:"/tools/paystack-calculator/",artifactPath:"tools/paystack-calculator/index.html",enginePath:"assets/js/engines/paystack-fee-planner.js"});
  const manifest=fs.readFileSync(path.join(root,"assets/js/ai/tool-manifest.js"),"utf8");
  assert.match(manifest,/MAJOR_TOOL_OVERRIDES\['paystack-calculator'\]/);
  assert.match(manifest,/countriesSupported: \['NG', 'GH', 'KE', 'ZA'\]/);
});

test("the implementation contains no automatic calculation or unsafe result HTML path",()=>{
  const controller=fs.readFileSync(path.join(root,"assets/js/pages/paystack-fee-planner.js"),"utf8");
  assert.doesNotMatch(controller,/innerHTML|window\.onload|calculate\(\);\s*$/m);
  assert.match(controller,/addEventListener\("submit",calculate\)/);
  assert.match(controller,/No calculation has run/);
});

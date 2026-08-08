"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("fs");
const path=require("path");
const ROOT=path.resolve(__dirname,"../../..");
const rows=[
 ["ussd-simulator","gwajin-ussd"],["mobile-vs-bank","kwatanta-mobile-money-da-banki"],["telecom-data-plan","tsarin-data"],["telecom-ussd","lambobin-ussd"],["telecom-data-usage","amfani-da-data"],["telecom-airtime","kudin-airtime"],["telecom-sim-reg","rajistar-sim"],["mobile-money-fees","kudin-mobile-money"],["staple-basket","kwandon-kayan-masarrafa"],["naira-to-words","naira-zuwa-kalmomi"],["whatsapp-link","mahada-whatsapp"],["remittance-compare","kwatanta-aika-kudi"]
];

for(const [id,slug] of rows)test(`${id} native Hausa route contract`,()=>{
  const file=path.join(ROOT,"ha","kayan-aiki",slug,"index.html"),html=fs.readFileSync(file,"utf8"),url=`https://afrotools.com/ha/kayan-aiki/${slug}/`;
  assert.match(html,/^<!doctype html>/i);
  assert.match(html,/<html lang="ha">/);
  assert.ok(html.includes(`<link rel="canonical" href="${url}">`));
  assert.ok(html.includes(`<meta property="og:url" content="${url}">`));
  assert.ok(html.includes(`data-ha05-app="${id}"`));
  assert.ok(html.includes('"inLanguage":"ha"'));
  assert.match(html,/Tushe da iyakar kimantawa/);
  assert.match(html,/Tabbaci/);
  assert.match(html,/kimantawa ce ta shiri/);
  assert.doesNotMatch(html,/<iframe|http-equiv="refresh"|location\.(?:href|replace)/i);
  assert.doesNotMatch(html,/google-analytics|gtag\(|segment\.com|mixpanel/i);
  const image=(html.match(/<meta property="og:image" content="https:\/\/afrotools\.com([^\"]+)/)||[])[1];
  assert.ok(image&&fs.existsSync(path.join(ROOT,image.replace(/^\//,""))),`missing art ${image}`);
});

test("lane-owned Hausa sadarwa hub discovers every exact HA-05 route",()=>{
  const hub="ha/sadarwa/index.html",html=fs.readFileSync(path.join(ROOT,hub),"utf8");for(const [,slug] of rows)assert.ok(html.includes(`/ha/kayan-aiki/${slug}/`),`${hub} missing ${slug}`);
});

test("lane generator is deterministic",()=>{
  const {spawnSync}=require("node:child_process"),r=spawnSync(process.execPath,["scripts/build-ha-05-telecom-commerce.js","--check"],{cwd:ROOT,encoding:"utf8"});
  assert.equal(r.status,0,r.stdout+r.stderr);
});

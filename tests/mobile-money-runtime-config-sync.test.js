'use strict';
const test=require('node:test'),assert=require('node:assert/strict');const{syncRuntimeConfig}=require('../scripts/build-mobile-money-fee-finder');
for(const locale of ['en','fr','sw'])test(locale+' config sync preserves every nonconfiguration byte',()=>{
 const before='<!doctype html>\r\n<title>Release-owned title</title><script type="application/ld+json">{"name":"release schema"}</script><main><input value="source control"></main><!-- SSR -->\r\n<script>window.MobileMoneyTariffCopy={"old":true}</script><script src="/runtime.js?v=abcdef12"></script>\n';
 const after=syncRuntimeConfig(before,locale),pattern=/window\.MobileMoneyTariffCopy=[\s\S]*?<\/script>/;
 assert.equal(after.replace(pattern,'CONFIG'),before.replace(pattern,'CONFIG'));
 const config=JSON.parse(after.match(/window\.MobileMoneyTariffCopy=([\s\S]*?)<\/script>/)[1]);assert.equal(config.lang,locale);assert.ok(config.marketCountries.some(c=>c.id==='SN'&&c.names.includes('Sénégal')));assert.equal(syncRuntimeConfig(after,locale),after);
});
test('config sync fails clearly for missing, duplicate or invalid configuration',()=>{
 assert.throws(()=>syncRuntimeConfig('<main>keep me</main>','fr'),/exactly one.*found 0/);
 const config='<script>window.MobileMoneyTariffCopy={}</script>';assert.throws(()=>syncRuntimeConfig(config+config,'fr'),/exactly one.*found 2/);
 assert.throws(()=>syncRuntimeConfig('<script>window.MobileMoneyTariffCopy={broken}</script>','fr'),/Invalid.*JSON/);
});

'use strict';
const test=require('node:test'),assert=require('node:assert/strict');const{syncRuntimeConfig}=require('../scripts/build-mobile-money-fee-finder');
for(const locale of ['en','fr','sw'])test(locale+' config sync preserves every nonconfiguration byte',()=>{
 const before='<!doctype html>\r\n<title>Release-owned title</title><script type="application/ld+json">{"name":"release schema"}</script><main><input value="source control"></main><!-- SSR -->\r\n<script>window.MobileMoneyTariffCopy={"old":true}</script><script src="/runtime.js?v=abcdef12"></script>\n';
 const after=syncRuntimeConfig(before,locale),pattern=/window\.MobileMoneyTariffCopy=[\s\S]*?<\/script>/;
 assert.equal(after.replace(pattern,'CONFIG'),before.replace(pattern,'CONFIG'));
 const config=JSON.parse(after.match(/window\.MobileMoneyTariffCopy=([\s\S]*?)<\/script>/)[1]);assert.equal(config.lang,locale);assert.ok(config.marketCountries.some(c=>c.id==='SN'&&c.names.includes('Sénégal')));assert.equal(syncRuntimeConfig(after,locale),after);
});

test('tariff table sync changes only its heading and container, preserving release assets',()=>{
 const {syncTariffTables,page}=require('../scripts/build-mobile-money-fee-finder');
 const html=page('en').replace('<title>','<!-- retained release header --><title>').replace('</body>','<aside>Retained SSR links</aside></body>');
 const stale=html.replace('Published tariff references</h2>','Old tariff heading</h2>').replace('330 UGX</td>','999 UGX</td>');
 assert.equal(syncTariffTables(stale,'en'),html);
 assert.equal(syncTariffTables(html,'en'),html);
 assert.throws(()=>syncTariffTables(html.replace('data-mobile-money-tables','data-missing'),'en'),/table container; found 0/);
 assert.throws(()=>syncTariffTables(html+'<div data-mobile-money-tables></div>','en'),/table container; found 2/);
 const marker=html.indexOf('<div data-mobile-money-tables>');
 assert.throws(()=>syncTariffTables(html.slice(0,marker)+'<div data-mobile-money-tables>','en'),/Unclosed/);
 assert.throws(()=>syncTariffTables(html.replace('These visible tables and the calculator use the same tariff catalog.','Unknown source copy'),'en'),/tariff heading; found 0/);
});
test('config sync fails clearly for missing, duplicate or invalid configuration',()=>{
 assert.throws(()=>syncRuntimeConfig('<main>keep me</main>','fr'),/exactly one.*found 0/);
 const config='<script>window.MobileMoneyTariffCopy={}</script>';assert.throws(()=>syncRuntimeConfig(config+config,'fr'),/exactly one.*found 2/);
 assert.throws(()=>syncRuntimeConfig('<script>window.MobileMoneyTariffCopy={broken}</script>','fr'),/Invalid.*JSON/);
});

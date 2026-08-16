"use strict";
const assert=require("assert");
const fs=require("fs");
const path=require("path");
const builder=require("../scripts/build-mobile-money-fee-finder");
const routes={en:"tools/mobile-money-fees/index.html",fr:"fr/tools/frais-mobile-money/index.html",sw:"sw/zana/ada-pesa-simu/index.html"};
const canonicals={en:builder.APP.en,fr:builder.APP.fr,sw:builder.APP.sw};
for(const locale of Object.keys(routes)){
  const html=builder.page(locale);
  assert.ok(html.includes('data-mobile-money-tariffs'));
  assert.ok(html.includes('https://www.mtn.co.ug/tariffs/mobile-money-tariffs/'));
  assert.ok(html.includes('https://www.airtel.co.tz/assets/pdf/pdf2/AM-TARIFF-ENGLISH-V2.pdf'));
  assert.ok(html.includes('data-provider-table="mtn-uganda"'));
  assert.ok(html.includes('data-provider-table="airtel-tanzania"'));
  assert.ok(html.includes('<link rel="canonical" href="https://afrotools.com'+canonicals[locale]+'">'));
  for(const [lang,route] of Object.entries(builder.APP)){if(lang!=="id")assert.ok(html.includes('hreflang="'+(lang==="en"||lang==="fr"||lang==="sw"||lang==="ha"?lang:"x-default")+'"')||lang==="ha");}
  const generated=fs.readFileSync(path.join(__dirname,"..",routes[locale]),"utf8");
  assert.ok(generated.includes('data-mobile-money-tariffs'));
  assert.ok(generated.includes('data/fintech/mobile-money-tariffs.json')===false);
  assert.ok(/20(?:,|\u202f| )000 UGX/.test(generated));
  assert.ok(generated.includes('604 TZS'));
}
assert.strictEqual(builder.CATALOG.providers.length,2);
const french=builder.page('fr');
assert.match(french, /Frais Mobile Money : MTN Uganda et Airtel Tanzania/);
assert.match(french, /Vérifiez les frais publiés d’envoi, de retrait et de dépôt/);
assert.match(french, />Ouganda - MTN MoMo \(UGX\)</);
assert.match(french, />Tanzanie - Airtel Money \(TZS\)</);
assert.match(french, /Références officielles publiées/);
assert.match(french, /<legend>Devis A<\/legend>/);
assert.match(french, /Ajouter un troisième devis/);
assert.match(french, /Ne saisissez aucun nom, numéro de téléphone, compte, code PIN ou identifiant/);
assert.match(french, /href="\/fr\/blog\/frais-orange-money-guide-2026\/"/);
assert.match(french, /href="\/fr\/blog\/wave-vs-orange-money-senegal-2026\/"/);
assert.match(french, /href="\/fr\/blog\/mobile-money-fees-africa-compared\/"/);
assert.doesNotMatch(french, /Official published references|Add a third quote|>Quote [ABC]<|>Send<|>Withdraw<|Do not enter names/);
console.log("mobile-money-fee-finder: ok");

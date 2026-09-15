'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {app}=require('../scripts/lib/architectural-fee-form');
const copy=require('../assets/js/lib/architectural-fee-fr');
test('French form preserves engine values and requires user assumptions without supplying fees',()=>{
 const html=app('fr');assert.match(html,/data-locale="fr"/);
 for(const name of ['constructionValue','minRate','typicalRate','maxRate']){const input=html.match(new RegExp('<input[^>]*name="'+name+'"[^>]*>'))[0];assert.match(input,/required/);assert.doesNotMatch(input,/value="\d/);}
 for(const locale of ['en','sw','fr']){const form=app(locale);for(const value of ['commercial_medium','working_drawings','small_firm'])assert.ok(form.includes('value="'+value+'"'));}
 assert.match(html,/Aucun prix de construction/);assert.match(html,/Somme|somme/);assert.match(html,/Démarrage et définition du besoin/);
});
test('all French runtime stage labels and export headings are available',()=>{
 const engine=require('../engines/src/architectural-fee-engine');for(const stage of engine.STAGES)assert.ok(copy.stages[stage.id]);assert.equal(copy.export.title,'Estimation des honoraires d’architecte');assert.match(copy.runtime.basis,/faible confiance/);
});

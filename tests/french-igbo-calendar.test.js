'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const test = require('node:test');
const ROOT = process.env.AFROTOOLS_FR_CALENDAR_ROOT || path.resolve(__dirname, '..');
const REF = process.env.AFROTOOLS_FR_CALENDAR_REFERENCE_ROOT || ROOT;
const html = fs.readFileSync(path.join(ROOT, 'fr/tools/jours-marche/index.html'), 'utf8');
const engine = fs.readFileSync(path.join(REF, 'assets/js/engines/igbo-market-days.js'), 'utf8');
const exportsSource = fs.readFileSync(path.join(REF, 'assets/js/pages/fr-uniquely-african-native-exports.js'), 'utf8');
const actual = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(s => s.includes("const STORAGE_KEY = 'afrotools_jours_marche_fr_v1'"));
function boot() {
  const fields = new Map(), storage = new Map(), downloads = [], copied = [];
  function element(id) {
    if (!fields.has(id)) {
      const tag = [...html.matchAll(/<(?:input|select|textarea)\b[^>]*>/g)].map(m => m[0]).find(t => t.includes('id="' + id + '"')) || '';
      const value = (tag.match(/\bvalue="([^"]*)"/) || [])[1] || (id === 'cycle' ? '4' : id === 'role' ? 'seller' : '');
      fields.set(id, { value, textContent:'', handlers:{}, style:{}, classList:{add(){},remove(){}}, addEventListener(type, fn){this.handlers[type] = fn;}, click(){}, remove(){}, setAttribute(){}, select(){} });
    }
    return fields.get(id);
  }
  const document = {getElementById:element, createElement(){return {style:{},click(){},remove(){},setAttribute(){},select(){}};},body:{appendChild(){}},execCommand(){return false;}};
  const context = {window:{},document,localStorage:{setItem(k,v){storage.set(k,v);}},navigator:{clipboard:{writeText(t){copied.push(t);return Promise.resolve();}}},Blob,URL:{createObjectURL(blob){downloads.push(blob);return 'blob:test';},revokeObjectURL(){}},console};
  vm.createContext(context); vm.runInContext(engine,context); assert.ok(actual); vm.runInContext(actual,context);
  function action(id,type='click'){return element(id).handlers[type]({preventDefault(){}});}
  function jsonPayload() {
    const block = exportsSource.slice(exportsSource.indexOf('    "market-days": {'), exportsSource.indexOf('    "ajo-chama-calc": {'));
    context.text = selector => element(selector.slice(1)).textContent;
    context.value = selector => element(selector.slice(1)).value;
    return vm.runInContext('({' + block + '})["market-days"].payload()',context);
  }
  return {element,action,storage,downloads,copied,jsonPayload,context};
}
test('visible scope, metadata, fixed fields and initial state match the Igbo engine', () => {
  assert.match(html, /<h1>Calendrier des jours de marché igbo<\/h1>/);
  assert.match(html, /id="country" value="Nigeria, calendrier igbo" readonly/);
  assert.match(html, /<select id="cycle" disabled>/);
  assert.match(html, /Date connue de marché \/ date à rechercher/);
  assert.match(html, /id="cycle-output">4j/);
  assert.doesNotMatch(html, /Cote d'Ivoire|Cycles 4 à 10|cycle est de 7|id="cycle-output">7j|Cycle planner Afrique/);
  assert.doesNotMatch(html, /id="market-name"[^>]*required/);
  const faq = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1])).find(s=>s['@type']==='FAQPage');
  for (const question of faq.mainEntity) {assert.ok(html.includes('<summary>'+question.name+'</summary>'));assert.ok(html.includes('<p>'+question.acceptedAnswer.text+'</p>'));}
});
test('default lookup and three requested recurrences produce the named calendar day', () => {
  const b=boot(); assert.match(b.element('summary-output').textContent,/Jour de marche: Orie/);
  b.element('count').value='3'; b.action('market-form','submit');
  assert.equal(b.element('cycle-output').textContent,'4j');
  assert.equal(b.element('count-output').textContent,'3');
  assert.deepEqual(Array.from(b.context.window.AfroToolsFrenchMarketDaysPayload.upcomingDates),['2026-01-01','2026-01-05','2026-01-09']);
  b.element('known-date').value='2026-01-04';b.action('market-form','submit');
  assert.match(b.element('summary-output').textContent,/Jour de marche: Eke/);
  assert.match(b.element('summary-output').textContent,/date de départ incluse/);
});
test('optional market, checklist and personal note survive TXT, copy, local save and actual shared JSON payload', async () => {
  const b=boot();b.element('market-name').value='Orie Orba';b.element('route').value='Retrouver le transport à 8 h';b.element('role').value='buyer';b.element('count').value='3';
  b.action('download-result');const txt=await b.downloads[0].text();
  for(const text of ['Orie Orba','Retrouver le transport à 8 h','Comparer les prix de référence','Nigeria, calendrier igbo','Cycle: tous les 4 jours','05 janv. 2026'])assert.ok(txt.includes(text),text);
  b.action('copy-result');await Promise.resolve();assert.equal(b.copied[0]+'\n',txt);
  b.action('save-result');const stored=JSON.parse(b.storage.get('afrotools_jours_marche_fr_v1'));
  assert.equal(stored.country,'Nigeria, calendrier igbo');assert.equal(stored.cycle,'4');assert.equal(stored.count,3);assert.equal(stored.summary+'\n',txt);
  const json=b.jsonPayload();assert.equal(json.country,stored.country);assert.equal(json.cycle,stored.cycle);assert.equal(json.summary,stored.summary);assert.equal(json.knownDate,'2026-01-01');
});
test('invalid date clears previous result and payload so the shared exporter has no stale result', () => {
  const b=boot();assert.ok(b.element('summary-output').textContent);b.element('known-date').value='';b.action('market-form','submit');
  assert.equal(b.element('summary-output').textContent,'');assert.equal(b.context.window.AfroToolsFrenchMarketDaysPayload,null);
  b.action('download-result');assert.equal(b.downloads.length,0);b.action('save-result');assert.equal(b.storage.size,0);
});
test('recurrence count is an explicit integer from three through twenty, not silently changed', () => {
  for(const invalid of ['2','3.5','21','Infinity','']){const b=boot();b.element('count').value=invalid;b.action('market-form','submit');assert.equal(b.element('summary-output').textContent,'',invalid);assert.match(b.element('warning').textContent,/entier.*3 et 20/);assert.equal(b.element('count').value,invalid);}
  for(const valid of ['3','20']){const b=boot();b.element('count').value=valid;b.action('market-form','submit');assert.equal(b.context.window.AfroToolsFrenchMarketDaysPayload.upcomingDates.length,Number(valid));}
});
test('all actual engine reference URLs are visible and unrelated generic market sources are removed',()=>{
  const b=boot();for(const source of b.context.window.AfroTools.engines.igboMarketDays.referencePoint.sources)assert.ok(html.includes('href="'+source.url+'"'),source.url);
  assert.doesNotMatch(html,/amis-outlook|openknowledge\.fao\.org/);
});

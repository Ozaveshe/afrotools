'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const local = require('../assets/js/pages/ha-yo-whatsapp-link.js');
const engine = require('../engines/src/whatsapp-link-engine.js');
const owner = require('../scripts/build-hausa-whatsapp-link.js');
test('valid single links preserve existing engine normalization and exact Unicode encoding', () => {
  for (const [code,phone] of [['234','0801 234 5678'],['254','+254 712-345-678'],['233','00233 201 234 567'],['27','(082) 123-4567'],['44','447123456789']]) {
    const message = 'Ẹ káàrọ̀ & Sannu + <literal> 😀';
    assert.deepEqual(local.build(code,phone,message),engine.build(code,phone,message));
    assert.equal(new URL(local.build(code,phone,message).url).searchParams.get('text'),message);
  }
  assert.equal(local.build('234','08012345678','  ').url,'https://wa.me/2348012345678');
});
test('country is explicit; malformed, empty, cross-country international and overlong numbers fail', () => {
  for (const [code,phone,field,error] of [['','08012345678','country','countryError'],['999','08012345678','country','countryError'],['234','','phone','phoneError'],['234','12','phone','phoneError'],['234','0801CALLME','phone','formatError'],['234','+254712345678','phone','mismatch'],['234','8'.repeat(20),'phone','phoneError']]) assert.throws(()=>local.build(code,phone,''),e=>e.field===field&&e.code===error);
  assert.throws(()=>local.build('234','08012345678','\ud800'),e=>e.field==='message');
});
test('bulk retains order and line numbers, reports invalid rows and never silently invents links', () => {
  const out = local.bulk('234','08012345678\nbad-number\n\n09023456789','Sannu & Ẹ káàrọ̀');
  assert.deepEqual(out.items.map(r=>r.line),[1,4]);assert.deepEqual(out.errors,[{line:2,code:'formatError'}]);
  assert.equal(out.items[0].url,local.build('234','08012345678','Sannu & Ẹ káàrọ̀').url);
  assert.equal(local.bulk('234','bad\n12','').items.length,0);
  assert.throws(()=>local.bulk('234','',''),e=>e.code==='empty');
  assert.throws(()=>local.bulk('234',Array(501).fill('08012345678').join('\n'),''),e=>e.code==='limit');
  assert.equal(local.bulk('234',Array(500).fill('08012345678').join('\n')+'\n','').items.length,500);
  assert.throws(()=>local.bulk('254','0712345678','\ud800'),e=>e.field==='message');
});
for (const locale of ['ha','yo']) test(locale + ' has five distinct templates preserving literal business/item values', () => {
  const outputs = ['order','support','booking','payment','delivery'].map(kind=>local.template(locale,kind,'Synthetic {item} <shop>','synthetic service & item'));
  assert.equal(new Set(outputs).size,5);
  for (const value of outputs) { assert.ok(value.includes('Synthetic {item} <shop>'));assert.ok(value.includes('synthetic service & item')); }
  assert.throws(()=>local.template(locale,'unknown','',''),RangeError);
});
test('copy adapter handles success, denied permission and missing capability without native clipboard', async () => {
  let captured;assert.equal(await local.copyText({writeText:value=>{captured=value;return Promise.resolve();}},'synthetic URL'),true);assert.equal(captured,'synthetic URL');
  assert.equal(await local.copyText({writeText:()=>Promise.reject(new Error('denied'))},'synthetic URL'),false);
  assert.equal(await local.copyText(null,'synthetic URL'),false);
  assert.equal(await local.copyText({writeText:()=>{throw new Error('denied');}},'synthetic URL'),false);
});
test('both generated workflows are idempotent and retain metadata/fallback states', () => {
  for (const [locale,file] of [['ha','ha/kayan-aiki/whatsapp-link/index.html'],['yo','yo/awon-ise/whatsapp-link/index.html']]) {
    const page=fs.readFileSync(path.join(__dirname,'..',file),'utf8');assert.equal(owner.build(page,locale)===page,true,locale+' owner must be byte-idempotent');
    assert.ok(page.includes('data-wa-workflow="'+locale+'"'));assert.ok(page.includes('data-wa-download-qr'));assert.equal((page.match(/data-wa-mode=/g)||[]).length,2);
    assert.ok(page.includes('<meta name="robots" content="'+(locale==='yo'?'noindex, follow':'index, follow')+'">'));if(locale==='yo')assert.ok(page.includes('Iṣẹ́ yìí kò tíì ṣetan.'));
  }
});
test('authored Yoruba form copy is NFC while user-entered Unicode remains opaque', () => {
  const html=local.markup('yo');assert.equal(html,html.normalize('NFC'));
  const opaque='Synthetic e\u0301 <shop> & item';
  assert.ok(local.template('yo','order',opaque,'service').includes(opaque));
  assert.equal(new URL(local.build('234','08012345678',opaque).url).searchParams.get('text'),opaque);
});

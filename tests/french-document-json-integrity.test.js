const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../assets/js/pages/fr-document-pdf-export-localization.js'),'utf8');
for(const id of ['business-plan','meeting-minutes'])test(id+': JSON backup bytes and nested user/machine values remain literal',async()=>{
 const window={Blob,__AFROTOOLS_FR_DOCUMENT_PDF__:{id}};vm.runInNewContext(source,{window});
 const serialized='{\r\n  "title": "Revenue", "status": "Paid", "Year 1": "Marketing", "nested": {"items": ["Year 1", "Revenue", {"status": "Total", "amount": 22.5}]}, "unicode": "Élodie", "nullValue": null\r\n}\r\n';
 const blob=new window.Blob([serialized],{type:'application/json;charset=utf-8'});
 assert.equal(await blob.text(),serialized);
 assert.deepEqual(JSON.parse(await blob.text()),JSON.parse(serialized));
 const split=new window.Blob([serialized.slice(0,13),serialized.slice(13)],{type:'application/json'});assert.equal(await split.text(),serialized);
});
test('non-state display labels still localize in non-optout TXT',async()=>{const window={Blob,__AFROTOOLS_FR_DOCUMENT_PDF__:{id:'business-plan'}};vm.runInNewContext(source,{window});assert.match(await new window.Blob(['Revenue: 100'],{type:'text/plain'}).text(),/Chiffre d’affaires: 100/);});

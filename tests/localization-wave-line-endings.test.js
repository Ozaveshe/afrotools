const {test}=require('node:test');
const assert=require('node:assert/strict');
const {stripBlock}=require('../scripts/apply-localization-wave-registry');
const start='  // LOCALIZATION_COVERAGE_WAVE_2026_07_START';
const end='  // LOCALIZATION_COVERAGE_WAVE_2026_07_END';
for(const eol of ['\n','\r\n']){
 test(`managed localization rows are replaced rather than duplicated with ${JSON.stringify(eol)}`,()=>{
   const before=['var AFRO_TOOLS = [','  { id: "ssce-practice" },',start,'  { id: "generated-fr" },',end,'];'].join(eol);
   const stripped=stripBlock(before);
   assert.ok(stripped.includes('{ id: "ssce-practice" }'));
   assert.ok(!stripped.includes('generated-fr'));
   assert.ok(!stripped.includes(start));
   assert.equal(stripBlock(stripped),stripped);
 });
}
test('mixed line endings remove every previously generated block while retaining hand-authored rows',()=>{
 const block=eol=>[start,'  { id: "generated-fr" },',end,''].join(eol);
 const source='var AFRO_TOOLS = [\r\n'+block('\r\n')+'  { id: "ssce-practice" },\n'+block('\n')+'];';
 const result=stripBlock(source);assert.ok(!result.includes('generated-fr'));assert.ok(result.includes('ssce-practice'));assert.ok(result.endsWith('];'));
});
test('adjacent generated blocks are all removed in one pass',()=>{
 const block=[start,'  { id: "generated-fr" },',end].join('\r\n');
 const result=stripBlock('var AFRO_TOOLS = [\r\n'+block+'\r\n'+block+'\r\n];');
 assert.ok(!result.includes('generated-fr'));assert.ok(!result.includes(start));
});

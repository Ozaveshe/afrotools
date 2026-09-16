const test=require('node:test'),assert=require('node:assert/strict');
const {installReorderRuntime}=require('../scripts/lib/pdf-reorder-runtime');
test('reorder controller install preserves unrelated scripts and metadata, is scoped and idempotent',()=>{
 const other='<link rel="canonical" href="/fr/tools/reorganiser-pdf/"><script>window.keep=true;</script>';
 const old='<script>async function buildPdfBytes(){} const pageGrid = {};</script>';
 const actual=installReorderRuntime(other+old,{id:'pdf-reorder'});
 assert.equal(actual,other+'<script src="/assets/js/pages/pdf-reorder.js"></script>');
 assert.equal(installReorderRuntime(actual,{id:'pdf-reorder'}),actual);
 assert.equal(installReorderRuntime(other+old,{id:'pdf-sign'}),other+old);
});

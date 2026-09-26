const test = require('node:test');
const assert = require('node:assert/strict');
const { installFormFillerRuntime } = require('../scripts/lib/pdf-form-filler-runtime');
test('form owner replaces only its historical controller and remains idempotent', () => {
 const head='<link rel="canonical" href="/fr/tools/remplir-formulaire-pdf/">';
 const other='<script>window.unrelated = "keep";</script>';
 const old='<script>function getPDFLib() {} let fieldElements = {};</script>';
 const actual=installFormFillerRuntime(head+other+old,{id:'pdf-form-filler'});
 assert.equal(actual,head+other+'<script src="/assets/js/pages/pdf-form-filler.js"></script>');
 assert.equal(installFormFillerRuntime(actual,{id:'pdf-form-filler'}),actual);
 assert.equal(installFormFillerRuntime(head+other+old,{id:'pdf-sign'}),head+other+old);
});

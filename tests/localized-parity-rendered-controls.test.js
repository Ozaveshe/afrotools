'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {structuralMetrics,assess}=require('../scripts/build-localized-non-app-parity.js');
test('inert template strings cannot inflate static controls or mask missing real controls',()=>{
 const real='<h1>Task</h1><h2>Inputs</h2><form><label>Amount<input></label><select><option>A</option></select><button>Continue</button></form><a href="/tools/">Tools</a>';
 const inert='<script>const template = "<h2>Fake</h2><form><input><button>Fake</button></form><a href=\"/fake/\">Fake</a>";</script><style>.x:after{content:"<form><input>"}</style><!-- <form><input><button>Hidden</button></form> -->';
 const expected={h1:1,h2:1,h3:0,links:1,buttons:1,forms:1,inputs:2,images:0,changeEntries:0};
 assert.deepEqual(structuralMetrics(real+inert),expected);
 assert.deepEqual(structuralMetrics(inert),{h1:0,h2:0,h3:0,links:0,buttons:0,forms:0,inputs:0,images:0,changeEntries:0});
 const baseline={...expected,words:100,hasCanonical:true,hasDescription:true,hasOpenGraph:true,hasViewport:true,langMatches:true,schemaBlocks:0,hasFaqSchema:false};
 const lost={...baseline,...structuralMetrics('<h1>Task</h1><h2>Inputs</h2><a href="/tools/">Tools</a>'+inert)};
 const result=assess(baseline,lost,'product-entry','/ai/');
 assert.equal(result.status,'under-standard');
 assert.ok(result.reasons.includes('forms 0/1'));
 assert.ok(result.reasons.includes('form controls 0/2'));
 assert.ok(result.reasons.includes('interactive actions missing'));
});

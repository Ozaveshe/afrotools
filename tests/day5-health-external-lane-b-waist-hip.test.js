'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const engine=require('../tools/waist-hip-ratio/waist-hip-engine.js');
const html=fs.readFileSync(path.join(root,'tools/waist-hip-ratio/index.html'),'utf8');
const context=JSON.parse(fs.readFileSync(path.join(root,'data/ai/tool-context/waist-hip-ratio.json'),'utf8'));

test('centimetres and inches produce the same unitless ratio',()=>{
  const cm=engine.calculate({units:'cm',applicability:'adult',waist:85,hip:100,reference:'women'});
  const inches=engine.calculate({units:'in',applicability:'adult',waist:33.4646,hip:39.3701,reference:'women'});
  assert.ok(Math.abs(cm.ratio-inches.ratio)<0.00001);
  assert.equal(cm.referenceLabel,'At or above the selected 0.85 population reference');
  assert.match(cm.warning,/cannot diagnose obesity/i);
});

test('repeat readings produce an observed ratio interval and unstable-threshold warning',()=>{
  const result=engine.calculate({units:'cm',applicability:'adult',waist:84,repeatWaist:86,hip:100,repeatHip:100,reference:'women'});
  assert.equal(result.ratio,0.85);
  assert.equal(result.low,0.84);
  assert.equal(result.high,0.86);
  assert.equal(result.waistDifference,2);
  assert.match(result.boundaryNote,/crosses the selected 0.85 reference/i);
});

test('suppresses adult thresholds for limited, under-18 and uncertain contexts',()=>{
  for(const applicability of ['limited','under18','unsure']){
    const result=engine.calculate({units:'cm',applicability,waist:90,hip:100,reference:'men'});
    assert.equal(result.referenceApplied,false);
    assert.match(result.referenceLabel,/no population threshold applied/i);
    assert.match(result.context,/was not applied/i);
  }
});

test('validates unit-specific ranges and required context',()=>{
  assert.throws(()=>engine.calculate({units:'in',applicability:'adult',waist:11,hip:40,reference:'none'}),/12 and 100 in/);
  assert.throws(()=>engine.calculate({units:'cm',applicability:'',waist:80,hip:100,reference:'none'}),/measurement context/);
  assert.throws(()=>engine.calculate({units:'yards',applicability:'adult',waist:80,hip:100,reference:'none'}),/centimetres or inches/);
});

test('page and AI context preserve local measurement-only behavior',()=>{
  assert.match(html,/Second waist circumference/);
  assert.match(html,/Second hip circumference/);
  assert.match(html,/suppresses adult thresholds/);
  assert.match(html,/id="resultPanel"[\s\S]*tabindex="-1"/);
  assert.equal((html.match(/theme\.addEventListener\('click'/g)||[]).length,1);
  assert.doesNotMatch(html,/\.onclick\s*=|fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage/);
  assert.equal(context.sourceReviewDate,'2026-07-26');
  assert.match(context.staticText,/Suppress threshold interpretation/);
  assert.match(context.privacy,/remain in the current browser page/i);
});

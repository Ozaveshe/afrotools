'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const intake=require('../ops/nigeria-exams/neco-2023-mathematics-intake.json');
const bank=require('../assets/js/lib/ssce-written-bank');

test('NECO 2023 Mathematics source intake keeps 35 selected, visually reviewed questions and independent answers',()=>{
 assert.equal(intake.status,'reviewed-selected-companions');
 const numbers=[...Array.from({length:22},(_,i)=>i+1),...Array.from({length:13},(_,i)=>i+24)];
 assert.deepEqual(intake.items.map(q=>q.number),numbers);
 assert.deepEqual(intake.visual_review.numbers,numbers);
 assert.deepEqual(intake.visual_review.pages,[2,3,4,5,6,7]);
 assert.deepEqual(intake.visual_review.correctOptions,['C','A','C','C','D','C','D','E','C','E','B','B','D','A','B','A','D','C','B','B','E','C','E','E','B','E','D','C','A','D','A','D','A','C','E']);
 const item=n=>intake.items.find(q=>q.number===n);
 assert.equal(120*(1-25/100),item(1).answer);
 assert.equal((parseInt('10110',2)*parseInt('11',2)).toString(2),item(2).answerBinary);
 assert.equal(5+2/100+3/1000+4/100000,item(3).answer);
 assert.equal((2*Math.sqrt(5)/Math.sqrt(10)).toFixed(12),Math.sqrt(2).toFixed(12));
 assert.equal(item(4).answer,'√2');
 assert.ok(Math.abs(1936/(88*0.55)/60-item(5).answerHours)<1e-12);
 assert.equal((3*8)%9,item(6).answer);
 assert.equal(Number((4*0.4771-1).toFixed(4)),item(7).answer);
 assert.equal(item(8).answer,'y=p⁴q²');
 assert.equal(Number((1200*(1.08**4-1)).toFixed(2)),item(9).answer);
 const intersection=item(10).given.B.filter(x=>item(10).given.C.includes(x));
 assert.deepEqual(new Set([...item(10).given.A,...intersection]),new Set(item(10).answer));
 assert.equal(Number((Math.abs(21.23-21.32)/21.32*100).toFixed(1)),item(11).answerPercent);
 assert.equal(3+16*((item(12).given.sumOfThirdAndTwelfth-6)/13),item(12).answer);
 const venn=item(13).given;
 assert.equal(venn.biologyPhysicsOnly+venn.biologyMathematicsOnly+venn.physicsMathematicsOnly+venn.allThree,item(13).answer.atLeastTwo);
 assert.equal(Object.values(venn).reduce((sum,count)=>sum+count,0),item(13).answer.schoolTotal);
 assert.equal(item(14).given.thirdTerm/Math.cbrt(item(14).given.sixthTerm/item(14).given.thirdTerm)**2,item(14).answer);
 assert.equal(2*(item(15).given.areaCm2/item(15).given.widthCm+item(15).given.widthCm),item(15).answerCm);
 const [a,b,c]=item(16).given.rows;
 assert.equal(a[0]*(b[1]*c[2]-b[2]*c[1])-a[1]*(b[0]*c[2]-b[2]*c[0])+a[2]*(b[0]*c[1]-b[1]*c[0]),item(16).answer);
 assert.equal(item(17).given.firstHours/item(17).given.secondSpeedFraction,item(17).answerHours);
 const [numerator,denominator]=item(18).answer.split('/').map(Number);
 assert.equal(numerator/(denominator+item(18).given.denominatorIncrease),1/2);
 assert.equal((numerator+item(18).given.bothIncrease)/(denominator+item(18).given.bothIncrease),3/4);
 for(const [x,y] of item(19).given.points)assert.equal(x-1,y);
 for(const x of [2,-1/3])assert.ok(Math.abs(3*x*x-5*x-2)<1e-12);
 assert.equal(item(20).answer,'3x²-5x-2=0');
 assert.deepEqual(intake.items.slice(12,20).map(q=>q.source_page),[4,4,4,4,4,4,5,5]);
 assert.deepEqual(intake.items.slice(20,27).map(q=>q.source_page),[5,5,6,6,6,6,6]);
 assert.deepEqual(intake.items.slice(27).map(q=>q.source_page),Array(8).fill(7));
 assert.deepEqual(item(21).answer,[[-1,0],[3,7]]);
 assert.equal((item(22).given.xIntercepts[0]+item(22).given.xIntercepts[1])/2,0.5);
 assert.equal(item(22).answer,'x=0.5');
 const point={x:-0.5,y:1};assert.ok(point.y>0&&point.y<2&&point.y<3+point.x&&point.x<0);assert.equal(item(24).answer,'Z');
 assert.equal(item(25).given.filledEndpoint,-1);assert.equal(item(25).given.rayDirection,'right');assert.equal(item(25).answer,'x≥-1');
 for(const x of [2/3,-4/7])assert.ok(Math.abs(21*x*x-2*x-8)<1e-12);
 assert.deepEqual(item(26).answer,['2/3','-4/7']);
 for(const x of [-3,0,4])assert.equal((x*x+6*x-27)-(x+2),x*x+5*x-29);
 assert.equal(item(27).answer,'y=x+2');
 assert.equal(2*(7/4)**2,49/8);assert.equal(item(28).answer,'49/8');
 assert.deepEqual(intake.held_items.map(row=>row.number),[23]);
 assert.notEqual((3+1)*(3-2),7,'monic option cannot reproduce the graph point (3,7)');
 assert.deepEqual(item(29).answer,{x:2,y:-3});
 for(const [a,b] of [[2,1],[-1,3]])assert.equal(12*a*a-3*(a-3*b)**2,9*(a+3*b)*(a-b));
 assert.equal(Number((2*(22/7)*Math.sqrt(16/10)).toFixed(2)),item(31).answer);
 for(const x of [-2,0,5])assert.equal((x-2)*(x+6),x*x+4*x-12);
 assert.deepEqual(item(33).answer.excludedX,[2,-3]);
 for(const x of [0,4,10])assert.equal(((x*x-8*x+12)/(3*(x*x+x-6)))*9*(x+3),3*(x-6));
 assert.equal(item(34).given.longitudesEast[1]-item(34).given.longitudesEast[0],item(34).answerDegrees);
 assert.equal(2*item(35).given.angleQRPDegrees,item(35).answerDegrees);
 assert.equal(item(36).given.largeBaseM*item(36).given.smallVerticalCm/item(36).given.smallBaseCm,item(36).answerMetres);
 assert.match(intake.source_rights,/Link only/);
});

test('NECO starter draft remains a three-item source record',()=>{
 const draft=require('../ops/nigeria-exams/neco-starter-draft.json');
 assert.equal(draft.status,'reviewed-pending-release');
 assert.equal(draft.items.length,3);
 for(const q of draft.items){assert.equal(q.exam,'NECO');assert.equal(q.year,2023);assert.equal(q.paper,'III');assert.equal(q.steps.length,3);assert.equal(q.checks.length,2);assert.match(q.sourceUse,/not a complete paper/);}
});

test('public NECO Mathematics guides are selected, ordered and explain independently checked answers',()=>{
 const items=bank.items.filter(q=>q.exam==='NECO'&&q.subject==='Mathematics');
 assert.deepEqual(items.map(q=>q.number),[...Array.from({length:22},(_,i)=>i+1),...Array.from({length:13},(_,i)=>i+24)]);
 assert.deepEqual(items.slice(0,20).map(q=>q.answer),['90.','1000010₂.','5.02304.','√2.','2/3 hour.','6.','0.9084.','y = p⁴q².','₦432.59.','{a, 1, c, 4, d, 9}.','0.4%.','43.','17 took at least two subjects; 36 students in the school.','2.','42 cm.','−15.','12 hours.','3/5.','y = x − 1.','3x² − 5x − 2 = 0.']);
 assert.deepEqual(items.slice(20,27).map(q=>q.answer),['(−1, 0) and (3, 7).','x = 0.5.','Region Z.','x ≥ −1.','x = 2/3 or x = −4/7.','y = x + 2.','49/8.']);
 assert.deepEqual(items.slice(27).map(q=>q.answer),['x = 2; y = −3.','9(a + 3b)(a − b).','T ≈ 7.95.','x² + 4x − 12.','3(x − 6), with x ≠ 2 and x ≠ −3.','93°.','92°.','315 m.']);
 assert.match(items.find(q=>q.number===13).prompt,/4 took all three.*4 took none/);
 assert.ok(!items.some(q=>q.number===23));
 for(const q of items){assert.equal(q.source,intake.source_url);assert.equal(q.steps.length,3);assert.ok(q.checks.length>=2);assert.match(q.sourceUse,/not a complete paper/);}
});

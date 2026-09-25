const {test}=require('node:test'),assert=require('node:assert/strict');
const bank=require('../assets/js/lib/ssce-written-bank'),api=require('../assets/js/lib/ssce-written');
const coverage=require('../scripts/audit-nigeria-exam-coverage');
function storage(initial=null){let raw=initial;return {getItem:()=>raw,setItem:(key,value)=>{raw=value;}};}
test('written responses round-trip without losing another task and reject malformed backups',()=>{
 const store=storage(),entry={answer:'Synthetic solution',checks:[true,false]};
 api.write(store,bank,'written-m1',entry);api.write(store,bank,'written-m2',entry);
 assert.equal(Object.keys(api.read(store,bank).entries).length,2);
 const damaged=api.read(store,bank);damaged.entries['written-m1'].checks=['true',false];assert.throws(()=>api.normalize(damaged,bank));
 const unknown=api.empty(bank);unknown.entries.unknown=entry;assert.throws(()=>api.normalize(unknown,bank));
 const bad=storage('{broken');assert.throws(()=>api.write(bad,bank,'written-m1',entry));assert.equal(bad.getItem(),'{broken');
 const silent=storage();silent.setItem=()=>{};assert.throws(()=>api.write(silent,bank,'written-m1',entry),/confirm/);
});
test('every written task has provenance and a self-review guide, with linked scan context for NECO reading',()=>{
 assert.equal(new Set(bank.items.map(q=>q.id)).size,bank.items.length);
 for(const q of bank.items){
  assert.ok(q.prompt&&q.answer&&q.steps.length>=3&&q.checks.length>=2);
  if(q.exam==='NECO'){
   assert.equal(q.year,2023);
   if(q.subject==='Mathematics'){assert.equal(q.source,'https://www.scribd.com/document/842881920/NECO-20230001');assert.equal(q.paper,'III');assert.ok(q.number>=1&&q.number<=12);}
   else{assert.equal(q.subject,'English');assert.equal(q.source,'https://www.myschoolbrod.com.ng/2024/12/neco-ssce-english-language-theory-2023.html');assert.equal(q.paper,'II');assert.ok([1,2,3,4,5,6].includes(q.number));if(q.number<=4)assert.match(q.sourceUse,/at least 450 words/);else assert.match(q.sourceUse,/does not host the passage/);}
   continue;
  }
  if(q.exam==='WAEC'&&q.origin==='WAEC third-party-linked reading task'){
   assert.ok(['waec-2022-english-p2-q6','waec-2022-english-p2-q7','waec-2023-english-p2-q6','waec-2023-english-p2-q7'].includes(q.id));
   assert.ok(['itsmyschoollibrary.wordpress.com','wikiquestions.org','studyzone.ng'].includes(new URL(q.source).hostname));
   assert.match(q.sourceUse,/third-party transcription/);assert.equal(q.passage,undefined);
  }else{
   assert.ok(q.source.startsWith('https://www.waeconline.org.ng/'));
   if(q.exam!==null)assert.ok(q.source.includes('mq'+q.number+'.html'));
  }
  if(q.exam===null)assert.equal(q.year,null);
  else{assert.equal(q.exam,'WAEC');assert.ok([2021,2022,2023].includes(q.year));assert.equal(q.paper,'2');}
 }
 assert.ok(bank.items.find(q=>q.id==='written-e-summary').passage.includes('refill station'));
 assert.match(api.report(bank,{...api.empty(bank),entries:{'written-m1':{answer:'45',checks:[true,false]}}}),/My response:\n45/);
});
test('mathematics worked answers are checked using independent computations',()=>{
 const answer=id=>bank.items.find(q=>q.id===id).answer;
 const polygon=[];for(let x=1;x<100;x++){const y=x+7;if([42,38,57,x,x+y,2*x-15,3*x-y].reduce((a,b)=>a+b)===360)polygon.push([x,y]);}assert.deepEqual(polygon,[[34,41]]);const inscribedAngle=146/2;assert.equal(180-inscribedAngle-34-34,39);assert.match(answer('waec-2022-mathematics-p2-q11'),/x = 34; y = 41.*39°/);
 const baseArea=1200*3/24;assert.equal(baseArea*84/3,4200);assert.equal(answer('waec-2022-mathematics-p2-q12b'),'4,200 cm³.');
 const bookSolutions=[];for(let y=0;y<=180;y++)if(300*y+237.5*(180-y)-180*250===7125)bookSolutions.push(y);assert.deepEqual(bookSolutions,[150]);const cost=24*20+103,revenue=33*20-20**2/20;assert.equal(((revenue-cost)/cost*100).toFixed(2),'9.78');assert.match(answer('waec-2022-mathematics-p2-q7'),/150 books.*9.78/);
 const chord=Math.sqrt(2*24.5**2*(1-Math.cos(72*Math.PI/180)));const arc=72/360*2*(22/7)*24.5;assert.equal((chord+arc).toFixed(2),'59.60');assert.match(answer('waec-2022-mathematics-p2-q3'),/59.60/);
 const angleSolutions=[];for(let x=1;x<100;x++)if(2*(2*x+40)+(5*x-35)===360)angleSolutions.push(x);assert.deepEqual(angleSolutions,[35]);assert.equal((180-110-10)/2,30);assert.equal(110-40,70);assert.match(answer('waec-2022-mathematics-p2-q4'),/x = 35; y = 30; angle ABC = 70/);
 const ratioSolutions=[];for(let small=1;small<68;small++)for(let large=small+1;large<68;large++)if(4*small===3*large&&3*small+2*large===68)ratioSolutions.push([small,large]);assert.deepEqual(ratioSolutions,[[12,16]]);assert.equal(answer('waec-2022-mathematics-p2-q1b'),'12.');assert.equal(bank.items.find(q=>q.id==='waec-2022-mathematics-p2-q1b').subpart,'b');
 const base4=parseInt('231',4);assert.ok(answer('written-m1').includes(String(base4)));assert.equal(0.000056*300000,16.8);
 const final=240000*(1.15)*(0.9);assert.ok(Math.abs(final-248400)<1e-8);assert.ok(answer('written-m2').includes('248,400'));
 const solutions=[];for(let adults=0;adults<=180;adults++)if((180-adults)*500+adults*800===114000)solutions.push(adults);assert.deepEqual(solutions,[80]);assert.match(answer('written-m3'),/100 student.*80 adult/);
 const widths=[];for(let w=1;w<96;w++)if(w*(w+4)===96)widths.push(w);assert.deepEqual(widths,[8]);assert.match(answer('written-m4'),/8 m.*12 m.*40 m/);
 assert.equal(18*2/(3*3),4);assert.equal(4*5*5/4,25);assert.match(answer('written-m5'),/k = 4; y = 25/);
 const savings=Array.from({length:10},(_,i)=>1200+i*300);assert.equal(savings.at(-1),3900);assert.equal(savings.reduce((a,b)=>a+b),25500);assert.match(answer('written-m6'),/3,900.*25,500/);
 assert.equal(Math.hypot(6,8),10);assert.equal(Math.round(Math.atan2(6,8)*180/Math.PI),37);assert.match(answer('written-m7'),/037/);
 assert.equal(112+68,180);assert.match(answer('written-m8'),/68°.*38°/);
 assert.equal((22/7)*3.5**2*4*1000,154000);assert.equal((22/7)*3.5*(2*4+3.5),126.5);assert.match(answer('written-m9'),/154,000.*126.5/);
 const data=[1,1,2,2,2,3,3,3,3,4];assert.equal(data.reduce((a,b)=>a+b)/data.length,2.4);assert.equal((data[4]+data[5])/2,2.5);assert.match(answer('written-m10'),/2.4.*2.5.*3/);
 const balls=['r','r','r','r','b','b','b'];let all=0,two=0,one=0;balls.forEach((a,i)=>balls.forEach((b,j)=>{if(i===j)return;all++;if(a==='r'&&b==='r')two++;if((a==='r')!==(b==='r'))one++;}));assert.equal(two/all,2/7);assert.equal(one/all,4/7);assert.match(answer('written-m11'),/2\/7.*4\/7/);
 assert.deepEqual([0,1,2,3,4].map(x=>x*x-4*x+3),[3,0,-1,0,3]);assert.match(answer('written-m12'),/1 < x < 3/);
 assert.equal(112/70+60/50,2.8);assert.equal((6+3)/(3+1),9/4);assert.match(answer('waec-2023-mathematics-p2-q1'),/2.8.*9\/4/);
 assert.equal(250*5+150*3,1700);assert.equal(175*5+75*3,1100);assert.match(answer('waec-2023-mathematics-p2-q2'),/250.*1,100/);
 const altitude=Math.sqrt(18*18-9*9),triangle=18*altitude/2,sector=(22/7)*altitude*altitude/6;assert.equal((triangle-sector).toFixed(2),'13.01');assert.match(answer('waec-2023-mathematics-p2-q3'),/13.01/);
 const baseAngle=(180-80)/2;const oppositeAtQ=180-(baseAngle+41),oppositeAtP=180-2*baseAngle;
 assert.equal(baseAngle,50);assert.deepEqual([oppositeAtQ,oppositeAtP],[89,80]);assert.match(answer('waec-2023-mathematics-p2-q4'),/89°.*80°/);
 const height=50*Math.tan(66*Math.PI/180),walk=height/Math.tan(53*Math.PI/180)-50;assert.equal(height.toFixed(1),'112.3');assert.equal(walk.toFixed(1),'34.6');assert.match(answer('waec-2023-mathematics-p2-q5'),/112.3.*34.6/);
 const set=Array.from({length:20},(_,i)=>i+1);const multiples=set.filter(n=>n%3===0),factors=set.filter(n=>10%n===0);
 assert.equal(multiples.length/set.length,3/10);assert.equal(factors.length/set.length,1/5);
 const onePart=200000/3;assert.equal((5*onePart).toFixed(2),'333333.33');assert.equal((2*onePart).toFixed(2),'133333.33');assert.match(answer('waec-2023-mathematics-p2-q6'),/3\/10.*1\/5.*333,333.33.*133,333.33/);
 assert.deepEqual([-3,-2,-1,0,1,2,3].map(x=>2*x*x-x-4),[17,6,-1,-4,-3,2,11]);const roots=[(1-Math.sqrt(33))/4,(1+Math.sqrt(33))/4];roots.forEach(x=>assert.ok(Math.abs(2*x*x-x-4)<1e-10));assert.match(answer('waec-2023-mathematics-p2-q8'),/−1.19.*1.69.*0.25.*−4.125/);
 const trees=[3,4,5,6,7,8].flatMap((height,i)=>Array([4,6,4,5,6,2][i]).fill(height));const mean=trees.reduce((a,b)=>a+b)/trees.length;const sd=Math.sqrt(trees.reduce((a,b)=>a+(b-mean)**2,0)/trees.length);assert.equal(trees[13],5);assert.equal(mean.toFixed(1),'5.3');assert.equal(sd.toFixed(1),'1.6');assert.match(answer('waec-2023-mathematics-p2-q9'),/5 m.*5.3 m.*1.6 m/);
 const shaded=(22/7)*49/6-0.5*(7*Math.cos(Math.PI/3))*(7*Math.sin(Math.PI/3));assert.equal(shaded.toFixed(1),'15.1');assert.equal(-8*(-3/4),6);assert.equal(21*(2/7),6);assert.match(answer('waec-2023-mathematics-p2-q13'),/15.1.*−8x \+ 21y = 6/);
 const triples=[];for(let a=1;a<81;a++)if(a+2*a+(2*a+6)===81)triples.push([a,2*a,2*a+6]);assert.deepEqual(triples,[[15,30,36]]);assert.equal(4*(-1)+10,6);assert.equal(4*((7-5)/(-5-3)),-1);assert.match(answer('waec-2023-mathematics-p2-q7'),/15, 30 and 36.*y = 4x \+ 10/);
 const sideCounts=[];for(let n=3;n<100;n++)if(360/n-360/(2*n)===45)sideCounts.push(2*n);assert.deepEqual(sideCounts,[8]);assert.equal(Math.PI*8**2/2,32*Math.PI);assert.match(answer('waec-2023-mathematics-p2-q11'),/8 sides.*8π \+ 16/);
 const palace={east:0,north:0};const radians=Math.PI/180;const bearingPoint=(distance,bearing)=>({east:distance*Math.sin(bearing*radians),north:distance*Math.cos(bearing*radians)});
 const x=bearingPoint(60,57);const angle=93*radians;const distancePY=60*Math.cos(angle)+Math.sqrt((60*Math.cos(angle))**2+180**2-60**2);
 const y=bearingPoint(distancePY,150);const distanceXY=Math.hypot(x.east-y.east,x.north-y.north);
 const bearingYX=(Math.atan2(x.east-y.east,x.north-y.north)/radians+360)%360;
 assert.ok(Math.abs(distanceXY-180)<1e-10);assert.equal(distancePY.toPrecision(3),'167');assert.equal(bearingYX.toPrecision(3),'349');
 const q10=bank.items.find(q=>q.id==='waec-2023-mathematics-p2-q10');assert.equal(q10.answer,'(a) 349°. (b) 167 m.');assert.match(q10.prompt,/X from Y/);assert.doesNotMatch(q10.sourceUse,/wording says|ambiguous/);
 const centralAngle=180-2*54;const m=centralAngle/2,n=centralAngle/2;const width=(40-2*4)/4;
 assert.deepEqual([m,n,width,width*(width+4)],[36,36,8,96]);assert.match(answer('waec-2023-mathematics-p2-q12'),/36°.*36°.*96 cm²/);
 assert.deepEqual(bank.items.filter(q=>q.exam==='WAEC'&&q.subject==='Mathematics'&&q.year===2023).map(q=>q.number),Array.from({length:13},(_,i)=>i+1));
});
test('coverage never turns consecutive or repeated compilation numbers into a complete paper',()=>{
 const rows=coverage.inventory([{id:'a',subject:'english',year:2020,num:1},{id:'b',subject:'english',year:2020,num:1},{id:'c',subject:'english',year:2020,num:3}],[{id:'a'}],[2026]);
 const existing=rows.find(r=>r.year===2020);assert.deepEqual(existing.repeated_source_numbers,[1]);assert.deepEqual(existing.holes_within_observed_numbering,[2]);assert.equal(existing.expected_paper_questions,null);assert.equal(existing.complete_paper,false);assert.equal(existing.held_records,2);
 assert.throws(()=>coverage.validateCompletePaper({complete:true,expectedIds:['a'],reviewedIds:['a']}));
 const proof={complete:true,sourceFingerprint:'a'.repeat(64),exam:'WAEC',subject:'mathematics',session:'school',paper:'2',year:2023,instructionsVerified:true,sourceUseVerified:true,expectedIds:['q1a','q1b'],reviewedIds:['q1a','q1b'],allPassagesVerified:true,allFiguresVerified:true,allSubpartsVerified:true,allAnswersVerified:true};
 assert.doesNotThrow(()=>coverage.validateCompletePaper(proof));assert.throws(()=>coverage.validateCompletePaper({...proof,reviewedIds:['q1a','q1a']}));assert.throws(()=>coverage.validateCompletePaper({...proof,allFiguresVerified:false}));
});
test('new 2022 companions agree with independently reconstructed distributions and geometry',()=>{
 const get=n=>bank.items.find(q=>q.id==='waec-2022-mathematics-p2-q'+n);
 const percentages=[35,7.5,10,15,17.5];const remainder=100-percentages.reduce((a,b)=>a+b);assert.equal(remainder,15);assert.deepEqual([...percentages,remainder].map(p=>p*360/100),[126,27,36,54,63,54]);assert.equal(get('8ab').subpart,'a–b');assert.match(get('8ab').answer,/126°.*27°.*36°.*54°.*63°.*54°/);
 const candidates=[];for(let k=0;k<100;k++){const ages=[3,4,5,6,7,8,9,10].flatMap((age,i)=>Array([2,6,5,k,6,9,8,5][i]).fill(age));if(ages.reduce((a,b)=>a+b)/ages.length===7)candidates.push({k,ages});}assert.equal(candidates.length,1);assert.equal(candidates[0].k,4);const ages=candidates[0].ages;assert.ok(Math.abs(ages.reduce((s,a)=>s+a*a,0)/ages.length-49-196/45)<1e-12);assert.match(get(10).answer,/k = 4.*2.087/);
 assert.equal(2*(22/7)*3.5*(3.5+6),209);const H=19*Math.sin(38*Math.PI/180)*Math.sin(43*Math.PI/180)/Math.sin(5*Math.PI/180);assert.equal(H.toFixed(1),'91.5');assert.match(get(13).answer,/6 cm.*91.5 m/);
 assert.match(bank.scope,new RegExp(bank.items.filter(q=>q.exam==='WAEC'&&q.subject==='Mathematics').length+' WAEC Mathematics companions'));
});

test('WAEC 2022 graph and probability guides have independently checked results and honest source boundaries',()=>{
 const get=id=>bank.items.find(q=>q.id==='waec-2022-mathematics-p2-q'+id);
 const q6=get('6'),q9=get('9'),q12a=get('12a');
 assert.ok(q6&&q9&&q12a);
 assert.match(q6.prompt,/Open the linked WAEC graph/);
 assert.match(q6.sourceUse,/not a reproduced graph/);
 const leftRoot=-2,rightRoot=4,r=8;
 const a=r/(leftRoot*rightRoot),b=-a*(leftRoot+rightRoot);
 assert.deepEqual([a,b,r],[-1,2,8]);
 assert.equal((5-(-27))/(3-(-5)),4);
 assert.deepEqual([-3,-2,0,4,5].map(x=>Math.sign(a*x*x+b*x+r)),[-1,0,1,0,-1]);
 assert.match(q6.answer,/−1, n = 2, r = 8.*Gradient 4.*−2 < x < 4/);
 const degrees=x=>x*Math.PI/180;
 const values=Array.from({length:10},(_,i)=>3*Math.sin(degrees(20*i))+7*Math.cos(degrees(20*i)));
 assert.deepEqual(values.map(v=>v.toFixed(1)),['7.0','7.6','7.3','6.1','4.2','1.7','-0.9','-3.4','-5.6','-7.0']);
 assert.equal(values[4].toFixed(1),'4.2');assert.equal(values[6].toFixed(1),'-0.9');
 assert.equal((3*Math.sin(degrees(150))+7*Math.cos(degrees(150))).toFixed(1),'-4.6');
 const zero=180-Math.atan2(7,3)*180/Math.PI;assert.ok(zero>113&&zero<114);
 assert.match(q9.answer,/7\.0, 7\.6, 7\.3, 6\.1, 4\.2, 1\.7, −0\.9, −3\.4, −5\.6 and −7\.0.*−4\.6.*113°/);
 assert.match(q12a.prompt,/three independent races/);
 const outcomes=Array.from({length:8},(_,mask)=>[0,1,2].map(i=>Boolean(mask&(1<<i))));
 const probability=outcome=>outcome.reduce((p,win)=>p*(win?3/4:1/4),1);
 const onlySecond=outcomes.filter(o=>!o[0]&&o[1]&&!o[2]).reduce((p,o)=>p+probability(o),0);
 const allThree=outcomes.filter(o=>o.every(Boolean)).reduce((p,o)=>p+probability(o),0);
 const exactlyTwo=outcomes.filter(o=>o.filter(Boolean).length===2).reduce((p,o)=>p+probability(o),0);
 assert.deepEqual([onlySecond,allThree,exactlyTwo],[3/64,27/64,27/64]);
 assert.equal(q12a.answer,'(i) 3/64. (ii) 27/64. (iii) 27/64.');
 assert.equal(q12a.subpart,'a');assert.equal(q12a.passage,undefined);
 assert.doesNotMatch(q12a.sourceUse,/ambiguous|incorrect|repair/i);
});

test('2021 complete selected mathematics tasks agree with independently reconstructed journeys and vectors',()=>{
 const q2=bank.items.find(q=>q.id==='waec-2021-mathematics-p2-q2');const q3=bank.items.find(q=>q.id==='waec-2021-mathematics-p2-q3');
 const solutions=[];for(let km=1;km<200;km++)if(Math.abs(km/72*60+(km+2)/40*60+120-235)<1e-10)solutions.push(km);
 assert.deepEqual(solutions,[48]);assert.equal(q2.answer,'48 km.');assert.match(q2.prompt,/two-hour/);assert.match(q2.prompt,/2 km longer/);
 const displacement={east:20,north:-15};assert.equal(Math.hypot(displacement.east,displacement.north),25);
 const bearing=(Math.atan2(displacement.east,displacement.north)*180/Math.PI+360)%360;assert.equal(Math.round(bearing),127);assert.equal(q3.answer,'(a) 25 km. (b) 127°.');assert.match(q3.prompt,/two significant figures/);assert.match(q3.prompt,/nearest degree/);
 const writing=bank.items.filter(q=>q.exam==='WAEC'&&q.subject==='English'&&q.year===2023&&q.number<=5);assert.deepEqual(writing.map(q=>q.number),[1,2,3,4,5]);assert.match(writing[1].prompt,/national newspaper editor/);assert.match(writing[4].prompt,/Half a loaf is better than none/);
});

test('WAEC 2023 English reading guides cover the linked tasks without hosting passages or claiming a verified paper',()=>{
 const selected=require('../ops/nigeria-exams/selected-waec-components.json').components.find(row=>row.id==='waec-2023-english-reading-guides');
 assert.deepEqual(selected.expectedIds,['waec-2023-english-p2-q6','waec-2023-english-p2-q7']);
 assert.equal(selected.complete_selected_prompts,false);assert.equal(selected.complete_paper,false);
 const [q6,q7]=selected.expectedIds.map(id=>bank.items.find(q=>q.id===id));
 for(const q of [q6,q7]){assert.ok(q);assert.equal(q.passage,undefined);assert.equal(q.exam,'WAEC');assert.equal(q.year,2023);assert.equal(q.paper,'2');assert.equal(q.source,q6.source);assert.match(q.sourceUse,/not an official mark scheme/);}
 for(const part of 'abcdefghij')assert.match(q6.answer,new RegExp('\\('+part+'\\)'),`missing comprehension part ${part}`);
 assert.match(q6.answer,/Compassion/);assert.match(q6.answer,/70–74/);assert.match(q6.answer,/Personification/);assert.match(q6.answer,/adverbial clause of time/);
 for(const word of ['delicate','ominous','an obligation','overcast','pensively'])assert.ok(q6.answer.includes(word+':'));
 const model=q7.answer.split('Suggested six-sentence response: ')[1].split(' Equivalent concise')[0];
 assert.equal(model.split(/(?<=\.)\s+/).length,6);
 for(const quality of ['self-control','humility','resilient','integrity','work ethic','obey laws'])assert.ok(model.includes(quality));
});

test('WAEC 2022 English composition companions preserve each task and examiner pitfall without grading',()=>{
 const writing=bank.items.filter(q=>q.collection==='WAEC 2022 writing companion');
 assert.deepEqual(writing.map(q=>q.number),[1,2,3,4,5]);
 assert.deepEqual(writing.map(q=>q.id),[1,2,3,4,5].map(n=>'waec-2022-english-p2-q'+n));
 for(const q of writing){
  assert.equal(q.paper,'2');assert.equal(q.collection,'WAEC 2022 writing companion');assert.equal(q.passage,undefined);
  assert.equal(q.source,`https://www.waeconline.org.ng/e-learning/English/Engl255mq${q.number}.html`);
  assert.match(q.answer,/no single model answer/i);assert.match(q.sourceUse,/self-review.*not an official mark or complete paper/i);
  assert.doesNotMatch(q.sourceUse,/450|official marking scheme|automatic grade/i);
  assert.ok(q.steps.length>=3&&q.checks.length>=3);
 }
 assert.match(writing[0].prompt,/friend at another school.*career.*country/i);
 assert.match(writing[0].steps.join(' '),/benefit.*country/);
 assert.match(writing[1].prompt,/fake medicines/);assert.match(writing[1].steps.join(' '),/not illicit or hard-drug use/);
 assert.match(writing[2].prompt,/former senior prefect.*60th anniversary.*three improvements/);
 assert.match(writing[2].steps.join(' '),/Congratulate.*three distinct suggestions/);
 assert.match(writing[3].prompt,/senior prefect.*welcome.*three areas/);
 assert.match(writing[3].steps.join(' '),/speech, not a letter/);
 assert.match(writing[4].prompt,/position of authority.*worry and difficult decisions/);
 assert.match(writing[4].steps.join(' '),/beginning, rising problem and turning point/);
 assert.match(bank.scope,/10 WAEC English writing companions, 4 WAEC English reading companions/);
 const store={value:null,getItem(){return this.value;},setItem(_,value){this.value=value;}};
 const draft='Synthetic school speech draft';
 api.write(store,bank,writing[3].id,{answer:draft,checks:[true,false,true]});
 const saved=api.read(store,bank);
 assert.equal(saved.entries[writing[3].id].answer,draft);
 const report=api.report(bank,saved);
 assert.match(report,/Synthetic school speech draft/);assert.match(report,/Engl255mq4\.html/);
 assert.doesNotMatch(report,/score:|grade:|official mark:/i);
});

test('WAEC 2022 Section B guide covers every comprehension task while keeping the passage at its source',()=>{
 const q=bank.items.find(item=>item.id==='waec-2022-english-p2-q6');
 assert.ok(q);assert.equal(q.exam,'WAEC');assert.equal(q.year,2022);assert.equal(q.paper,'2');assert.equal(q.number,6);
 assert.equal(q.passage,undefined);assert.match(q.prompt,/Open the linked.*Section B passage/);
 assert.doesNotMatch(q.prompt,/Alani was the seventh child|When five of his workers resigned/i);
 assert.match(q.sourceUse,/third-party transcription/);assert.match(q.sourceUse,/does not host the passage/);
 assert.match(q.sourceUse,/not an official mark scheme or complete paper/);
 for(const part of 'abcdefgh')assert.match(q.answer,new RegExp('\\('+part+'\\)'),`missing comprehension part ${part}`);
 assert.match(q.answer,/\(g\)\(i\).*relative or adjectival clause; \(ii\).*secretary/);
 for(const pair of ['laurels: awards','sustenance: food','reputable: respected','venture: enterprise','pompous: arrogant','dwindled: declined'])assert.ok(q.answer.includes(pair),pair);
 assert.equal(q.steps.length,3);assert.equal(q.checks.length,3);
});

test('WAEC 2022 Section C guide separates three passage-based causes from three prevention measures',()=>{
 const q=bank.items.find(item=>item.id==='waec-2022-english-p2-q7');
 assert.ok(q);assert.equal(q.exam,'WAEC');assert.equal(q.year,2022);assert.equal(q.paper,'2');
 assert.equal(q.passage,undefined);assert.match(q.sourceUse,/does not host the passage/);
 assert.match(q.prompt,/three distinct factors.*three distinct ways/i);
 const response=q.answer.split('Suggested six-sentence response: ')[1].split(' Equivalent concise')[0];
 assert.equal(response.split(/(?<=\.)\s+/).length,6);
 for(const idea of ['work and employable skills','displays of wealth','moral conduct','Parents','Government','Police'])assert.ok(response.includes(idea),idea);
 assert.equal(q.steps.length,3);assert.equal(q.checks.length,3);
});

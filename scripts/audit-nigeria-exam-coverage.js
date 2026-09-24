#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
function inventory(raw,published,targets){
  const ids=new Set(published.map(q=>q.id));
  const subjects=[...new Set(['mathematics','english',...raw.map(q=>q.subject),...published.map(q=>q.subject)].filter(s=>typeof s==='string'&&s.length))].sort();
  const pairs=new Map();
  for(const q of raw){
    if(!subjects.includes(q.subject)||!Number.isInteger(q.year))continue;
    const key=q.subject+'|'+q.year;
    if(!pairs.has(key))pairs.set(key,{exam:'JAMB',subject:q.subject,year:q.year,source:[],live:[]});
    const group=pairs.get(key);group.source.push(q);if(ids.has(q.id))group.live.push(q);
  }
  for(const subject of subjects)for(const year of targets){const key=subject+'|'+year;if(!pairs.has(key))pairs.set(key,{exam:'JAMB',subject,year,source:[],live:[]});}
  return [...pairs.values()].map(group=>{
    const frequencies=new Map();for(const q of group.source)if(Number.isInteger(q.num))frequencies.set(q.num,(frequencies.get(q.num)||0)+1);
    const numbers=[...frequencies.keys()].sort((a,b)=>a-b),seen=new Set(numbers);
    return {exam:group.exam,subject:group.subject,year:group.year,source_records:group.source.length,published_records:group.live.length,
      held_records:group.source.length-group.live.length,observed_source_numbers:numbers,
      publisher_collection_records:group.live.filter(q=>q.source_provenance?.year_basis==='publisher-collection').length,
      unknown_original_number_records:group.live.filter(q=>!Number.isInteger(q.num)).length,
      repeated_source_numbers:numbers.filter(n=>frequencies.get(n)>1),
      holes_within_observed_numbering:numbers.length?Array.from({length:numbers.at(-1)},(_,i)=>i+1).filter(n=>!seen.has(n)):[],
      expected_paper_questions:null,complete_paper:false,
      status:group.source.length?'partial-compilation':'source-needed',
      reason:group.source.length?'A compilation is not an authenticated sitting. Numbering gaps and repeated numbers require source-page and version reconciliation.':'No records for this subject/year in the current source pool.'};
  }).sort((a,b)=>a.subject.localeCompare(b.subject)||b.year-a.year);
}
function validateCompletePaper(paper){
  if(!paper.complete)return;
  if(!paper.sourceFingerprint||!/^[a-f0-9]{64}$/.test(paper.sourceFingerprint)||!paper.exam||!paper.subject||!paper.session||!paper.paper||!Number.isInteger(paper.year)||!paper.instructionsVerified||!paper.sourceUseVerified||!Array.isArray(paper.expectedIds)||!paper.expectedIds.length||!Array.isArray(paper.reviewedIds))throw Error('Complete papers require verified source, identity, instructions and item inventory.');
  if(new Set(paper.expectedIds).size!==paper.expectedIds.length||new Set(paper.reviewedIds).size!==paper.reviewedIds.length||paper.expectedIds.length!==paper.reviewedIds.length||paper.expectedIds.some(id=>!paper.reviewedIds.includes(id))||!paper.allPassagesVerified||!paper.allFiguresVerified||!paper.allSubpartsVerified||!paper.allAnswersVerified)throw Error('A complete paper cannot have missing, repeated or unverified components.');
}
function build(root=ROOT,check=false){
  const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
  const pool=read('ops/jamb/source-pool.json'),published=read('data/jamb/pools/practice-pool.json'),sources=read('ops/nigeria-exams/source-candidates.json');
  const rows=inventory(pool.questions,published.questions,sources.target_years);
  const bank=require(path.join(root,'assets/js/lib/ssce-written-bank.js'));
  const companionGroups=new Map();
  for(const q of bank.items.filter(q=>q.exam)){
    const key=[q.exam,q.subject,q.year,q.paper].join('|');
    if(!companionGroups.has(key))companionGroups.set(key,{exam:q.exam,subject:q.subject,year:q.year,paper:q.paper,items:[],complete_paper:false});
    companionGroups.get(key).items.push({id:q.id,number:q.number,subpart:q.subpart||null});
  }
  const writtenCoverage=[...companionGroups.values()];
  const report={schema_version:1,source_review_revision:published.review_revision,scope:'All JAMB subjects; WAEC/NECO Mathematics and English acquisition',
    interpretation:'Counts and observed numbering do not prove a complete exam paper. Null expected totals mean unknown, not zero.',jamb:rows,written_coverage:writtenCoverage,selected_components:read('ops/nigeria-exams/selected-waec-components.json').components,selected_neco_components:read('ops/nigeria-exams/selected-neco-components.json').components,
    source_linked_jamb_revision:{route:'/jamb/mathematics/recent-practice/',items:require(path.join(root,'assets/js/lib/jamb-recent-written-bank.js')).items.map(q=>({id:q.id,source_year:q.sourceYear,source:q.source})),authenticated_sitting:false,complete_paper:false},
    written_practice:{original_tasks:bank.items.filter(q=>q.exam===null).length,source_linked_writing_companions:bank.items.filter(q=>q.exam==='WAEC'&&q.subject==='English').length,source_linked_math_companions:bank.items.filter(q=>q.exam==='WAEC'&&q.subject==='Mathematics').length,source_linked_neco_math_companions:bank.items.filter(q=>q.exam==='NECO'&&q.subject==='Mathematics').length,source_linked_neco_writing_companions:bank.items.filter(q=>q.exam==='NECO'&&q.origin==='NECO scan-linked writing task').length,source_linked_neco_reading_companions:bank.items.filter(q=>q.exam==='NECO'&&q.origin==='NECO scan-linked reading task').length,source_linked_neco_companions:bank.items.filter(q=>q.exam==='NECO').length,imported_waec_past_questions:0,imported_neco_past_questions:0,complete_past_papers:0},sources:sources.candidates};
  const csv=['exam,subject,year,source_records,published_records,held_records,expected_paper_questions,complete_paper,status',...rows.map(r=>[r.exam,r.subject,r.year,r.source_records,r.published_records,r.held_records,'',false,r.status].join(','))].join('\n')+'\n';
  const md=['# Nigeria exam-content coverage','',report.interpretation,'','## Recent-year priority gaps','', '| Exam | Subject | Year | Source records | Published | Next step |','| --- | --- | ---: | ---: | ---: | --- |',...rows.filter(r=>sources.target_years.includes(r.year)).map(r=>`| JAMB | ${r.subject} | ${r.year} | ${r.source_records} | ${r.published_records} | Acquire and authenticate source |`),'','## First written-practice delivery','',`${report.written_practice.original_tasks} original written tasks, ${report.written_practice.source_linked_writing_companions} WAEC English writing companions and ${report.written_practice.source_linked_math_companions} WAEC Mathematics companions, plus ${report.written_practice.source_linked_neco_math_companions} NECO Mathematics, ${report.written_practice.source_linked_neco_writing_companions} NECO English writing and ${report.written_practice.source_linked_neco_reading_companions} NECO English reading companions. No new imported WAEC/NECO past questions and no complete past papers are claimed.`,'',`${report.source_linked_jamb_revision.items.length} separate JAMB Mathematics revision companions use publisher-labelled 2023 provenance. They do not change authenticated past-question counts or close the recent-year source gaps.`,'','## Acquisition queue','',...sources.candidates.map(s=>`- **${s.id}** (${s.status}): ${s.next_action} Source: ${s.url}`),'','## Definition of complete','', 'Match a fingerprinted source and its exam, session, year and paper. Inventory every question and subpart; verify all passages, figures, instructions and answers. Do not infer completeness from a familiar total or consecutive numbers. UTME compilations may combine versions.',''].join('\n');
  for(const [file,text] of Object.entries({'coverage.json':JSON.stringify(report,null,2)+'\n','coverage.csv':csv,'coverage.md':md})){
    const target=path.join(root,'ops/nigeria-exams',file);
    if(check){if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==text)throw Error('Stale exam coverage: '+file);}
    else fs.writeFileSync(target,text);
  }
  return {groups:rows.length,recent_source_gaps:rows.filter(r=>sources.target_years.includes(r.year)&&!r.source_records).length,...report.written_practice};
}
if(require.main===module)console.log(JSON.stringify(build(ROOT,process.argv.includes('--check')),null,2));
module.exports={inventory,validateCompletePaper,build};

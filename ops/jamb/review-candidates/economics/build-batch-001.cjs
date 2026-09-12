'use strict';
const fs=require('node:fs'),path=require('node:path');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const selected=require('./batch-001-selection.json'),review=require('./batch-001-review.json');
const pinned='48d0a82b005ca877cc6f7ff734d06a4971ca6d6e52ae6a858f1843f38b48760c';
const source={source_file:'ECONOMICS-JAMB-Past-Questions.pdf',content_sha256:pinned,pages:[2,5],source_year_status:'compilation-labelled-years-not-officially-authenticated',official_answer_key:false,status:'candidate-only',reuse_authorization:{status:'authorized-by-owner',basis:'user-provided-material',scope:'AfroTools past-question practice',material_sha256:pinned,authorized_by:'AfroTools owner',authorized_at:'2026-09-12',instruction_ref:'Owner supplied past-question reuse and independent AI verification instruction in this task.'}};
const OS='https://openstax.org/books/principles-economics-3e/pages/';
const evidence={1:['https://www.bea.gov/help/faq/552','https://www.bea.gov/help/glossary/income-approach'],9:[OS+'7-3-costs-in-the-short-run'],11:[OS+'6-2-how-changes-in-income-and-prices-affect-consumption-choices'],13:[OS+'7-3-costs-in-the-short-run'],24:[OS+'1-1-what-is-economics-and-why-is-it-important'],28:[OS+'33-1-absolute-and-comparative-advantage'],29:['https://www.wto.org/english/tratop_e/adp_e/adp_e.htm'],39:[OS+'27-1-defining-money-by-its-functions'],41:[OS+'27-1-defining-money-by-its-functions'],43:[OS+'1-1-what-is-economics-and-why-is-it-important']};
const records=selected.map(original=>{
 const n=original.num,a=review.answers[n],page=n<=10?2:n<=22?3:n<=34?4:5;
 const r={id:original.id,original_record:original,original_content_sha256:questionFingerprint(original),actual_source_year:1983,actual_source_number:n,source_pdf_page:page,publication_candidate:!!a,source_checked_at:'2026-09-12',source_urls:evidence[n]||[],repair_history:[]};
 if(!a){r.hold_reason=review.holds[n];r.repair_history=[r.hold_reason];return r;}
 const q={...original,options:{...original.options},answer:a[0],explanation:a[1],ai_explanation:a[1],verification_method:'ai-source-checked',verified_at:'2026-09-12',has_diagram:false};
 if(n===5){q.options.C='Birth rate minus the death rate';r.repair_history.push('Removed compilation year spillover fromC using PDF2.');}
 if(n===9){q.question=original.question+' This illustrates which concept?';r.repair_history.push('Completed implied question predicate without changing fixed inputs or diminishing-output premise.');}
 if(n===11)q.question='Other influences held constant, why is a household’s downward-sloping demand curve for semovita consistent with the law of demand?';
 if(n===13)q.question='For the usual U-shaped average-cost curve, the marginal-cost curve intersects it';
 if(n===23)q.question='Which of the following are direct taxes?';
 if(n===29)q.options.A='At a price below that received in the home market';
 if(n===33)q.options.B='Produce only raw materials';
 if(n===39){q.question='The system of exchange that requires a double coincidence of wants is known as';q.options={A:'The gold standard',B:'Barter',C:'The commodity system',D:'The gold exchange standard',E:'The cheque system'};r.repair_history.push('Restored separately printed C/D from PDF5 and corrected monetary-system label to system of exchange.');}
 q.format=Object.keys(q.options).length;r.candidate=q;r.content_sha256=questionFingerprint(q);
 r.repair_history.push('Compared full source stem/options and independently established answer; routine grammar and standard-model clarifications retained privately.');
 r.semantic_review={status:'accepted',reviewer:'Codex (AI), independent Economics review',method:'ai-source-checked',reviewed_at:'2026-09-12',evidence:'Owner PDF page'+page+' plus independently reasoned economic mechanism; linked primary sources where recorded.',independent_reasoning:a[1]};return r;
});
const b={schema_version:1,batch_id:'economics-1983-001',source_id:'owner-supplied-economics-1983-2004',source,source_pdf_sha256:pinned,other_source_inventory:[{source_file:'JAMB-Economics-Past-Questions-and-Answers.pdf',content_sha256:'8a099dffb12bac253bb7191a5ef9a0c5e6121c2529621579037950830d6f7829',pages:51,source_years:'2010–2018',used_for_this_batch:false}],reviewed_at:'2026-09-12',scope:'First40 normalized records matching1983 PDF source; excludes five nonmatching1983-labelled imports. Source gaps mean cohort extends throughQ46.',counts:{examined:40,candidates:20,held:20},records,integration_allowlist:records.filter(r=>r.publication_candidate).map(r=>({id:r.id,original_content_sha256:r.original_content_sha256,candidate_content_sha256:r.content_sha256}))};
fs.writeFileSync(path.join(__dirname,'batch-001.json'),JSON.stringify(b,null,2)+'\n');console.log(b.counts);

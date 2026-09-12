const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const dir=__dirname;
const files=fs.readdirSync(dir).filter(f=>/^physics-\d{4}-001\.json$/.test(f)).sort();
const batches=files.map(f=>({file:f,batch:JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'))}));
const groups={
 source_figure_representation:'1983-3 1983-5 1983-25 1983-33 1983-40 1983-42 1983-45 1983-50 1984-2 1984-35 1985-44 1986-9 1986-10 1986-27 1986-39 1986-40 1987-5 1988-9 1988-10 1988-15 1988-36 1989-20 1989-39 1989-41 1990-8 1991-6 1992-8 1993-20',
 missing_or_unclear_diagram:'1983-19 1983-24 1983-43 1984-22 1984-34 1985-5 1985-11 1986-12 1986-19 1988-22 1989-10 1989-38 1989-45 1990-1 1990-3 1990-6 1990-28 1991-9 1991-35 1991-39 1991-40 1992-31 1992-37 1992-38 1993-1 1993-12 1997-33 1997-38 1998-4 1999-28 1999-44 2000-46 2000-47 2001-4 2003-8',
 conflicting_or_missing_quantities:'1983-37 1984-46 1987-7 1987-22 1988-30 1989-13 1989-25 1990-14 1993-2 1993-7 1994-15 1999-13 2000-42 2002-33 2003-6 2003-21 2004-17 2004-21 2004-38',
 invalid_duplicate_or_mismatched_options:'1983-11 1983-16 1983-29 1984-33 1984-48 1985-12 1985-36 1986-26 1986-49 1987-31 1987-47 1989-40 1989-48 1992-20 1994-25 1995-21 1995-41 1995-42 1998-50 1999-22 1999-43 2000-6 2000-13 2000-15 2000-22 2001-9 2002-14 2002-28 2002-35 2003-37 2003-46 2004-6 2004-40 2004-43'
};
const seenKeys=new Set();for(const text of Object.values(groups))for(const k of text.split(' ')){assert(!seenKeys.has(k),k);seenKeys.add(k);}
const entries=batches.flatMap(({file,batch})=>batch.records.filter(r=>r.status==='held').map(r=>{const key=r.original_record.year+'-'+r.original_record.num;let blocker_type=Object.entries(groups).find(([,v])=>v.split(' ').includes(key))?.[0]||'missing_model_conditions_or_ambiguous_claim';if(key==='1984-2'&&r.hold_reason.startsWith('Actually'))blocker_type='missing_or_unclear_diagram';return {id:r.id,original_year:r.original_record.year,original_num:r.original_record.num,source_pdf_page:r.source_pdf_page,prior_evidence_file:file,blocker_type,hold_reason:r.hold_reason};}));
assert.equal(entries.length,173);assert.equal(new Set(entries.map(e=>e.id)).size,173);for(const k of seenKeys)assert(entries.some(e=>e.original_year+'-'+e.original_num===k),k);
const counts={};for(const e of entries)counts[e.blocker_type]=(counts[e.blocker_type]||0)+1;
const out={schema_version:1,as_of:'2026-09-12',status:'private-first-pass-recovery-inventory',scope:'All 678 normalized Physics records examined across 17 immutable candidate batches; 505 candidates and 173 held. Counts classify one primary blocker per held record and are triage, not proof of recoverability.',counts,highest_recoverability_group:'source_figure_representation',recommended_next_batch:entries.filter(e=>e.blocker_type==='source_figure_representation').slice(0,15).map(e=>e.id),recovery_contract:'Reopen the exact PDF page, verify every source value and condition, independently solve and preserve all distractors. Add recovery candidates with a link to the immutable prior held evidence. Do not infer missing topology or approval from this classification.',entries};
const target=path.join(dir,'held-first-pass-inventory.json');
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(fs.readFileSync(target,'utf8')),out);else fs.writeFileSync(target,JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({pass:true,held:entries.length,counts,recommendedNext:out.recommended_next_batch.length}));

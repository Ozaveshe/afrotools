'use strict';
const path=require('path');
const artifact='assets/js/engines/ci-birth-leave.js';
const id='formula-assets-js-engines-ci-birth-leave';
const source={registryId:null,title:'Côte d’Ivoire Labour Code article 25.12, university-hosted 2025 compilation, pages 71–72',url:'https://www.uvci.online/portail/externes/documents/textes_officiels/Le_code_du_travail_ivoirien_-_20251.pdf',kind:'authority-link',authorityStatus:'review-required'};
function metadata(file){return file!==artifact?{}:{
 jurisdictions:['CI'],sourceJurisdictions:['CI'],currency:null,currencyOverride:null,currencyAssumption:'Non-currency result: working days, calendar dates and completed service months.',units:['working-days','calendar-days','completed-months','ISO-date'],
 sources:[source],lastVerified:'2026-09-16',verificationBasis:'Bounded source inspection of the 2025 compilation recorded in reports/leave-country-batch-sn-ci-cm-gh-2026-09-16.md; not certification of current law.',effectiveFrom:null,effectiveTo:null,effectiveDateStatus:'review-required',supportStatus:'review-required',
 applicablePopulation:'Employees within the stated Côte d’Ivoire Labour Code scope, subject to employer-confirmed article 25.12 eligibility; not a public-service or collective-agreement determination.',
 rounding:{method:'integer-day-counting',precision:'Whole working days and completed service months; no currency rounding.',stages:['Count two eligible working days using the explicit five- or six-day schedule and entered exclusions.','Treat the fifteen-day evidence window as the disclosed calendar-day planning interpretation.']},
 knownExclusions:['Cross-year birth permissions require review because annual-cap allocation is unverified; this is unsupported by the planner, not a ruling of statutory ineligibility.','Current-law amendments and collective agreements are not independently certified by this registration.','Employment start is not proof of six completed months of effective presence; legal family, force majeure, evidence authenticity and employer authorization require external confirmation.','Public holidays are entered exclusions; no automatic holiday calendar or statutory working-day interpretation is asserted.','Fewer than two annual family-permission days remaining produces review, not an invented partial entitlement; travel allowances are excluded.'],
 disclaimer:'Conditional planning check from article 25.12 in a 2025 compilation. Current-law validity is unconfirmed. Confirm current law, employer interpretation, effective presence, annual family-permission use and authorization before relying on dates.'
};}
const base={birth:'2026-09-18',start:'2026-09-18',months:6,used:8,schedule:'six',family:true,authorization:'prior',confirmed:true};
// Literal expected dates/counts are independently reasoned; never read from engine output.
const cases=[
 ['cross-year-start',{birth:'2026-12-30',start:'2027-01-04'},{eligible:false,reasons:['crossYear'],schedule:null},['date_boundary','evidence_gated']],
 ['cross-year-span',{birth:'2026-12-31',start:'2026-12-31'},{eligible:false,reasons:['crossYear'],schedule:null},['date_boundary','evidence_gated']],
 ['six-day-friday',{}, {eligible:true,days:2,remainingFamilyDays:2,'schedule.lastLeaveDate':'2026-09-19','schedule.returnDate':'2026-09-21'},['exact_threshold','date_boundary']],
 ['five-day-holiday',{schedule:'five',exclusions:'2026-09-21'}, {eligible:true,'schedule.lastLeaveDate':'2026-09-22','schedule.returnDate':'2026-09-23'},['date_boundary','missing_optional_input']],
 ['insufficient-service',{months:5},{eligible:false,reasons:['service'],schedule:null},['exact_threshold']],
 ['annual-cap',{used:9},{eligible:false,reasons:['cap'],remainingFamilyDays:1,schedule:null},['exact_threshold']],
 ['unconfirmed-scope',{family:false,confirmed:false},{eligible:false,reasons:['family','confirmed'],schedule:null},['evidence_gated']],
 ['proof-fifteenth-day',{authorization:'force',force:true,proof:'2026-10-03'},{eligible:true},['date_boundary']],
 ['proof-sixteenth-day',{authorization:'force',force:true,proof:'2026-10-04'},{eligible:false,reasons:['proof'],schedule:null},['date_boundary']],
 ['sunday-start',{start:'2026-09-20'},{eligible:false,reasons:['start'],schedule:null},['date_boundary']],
 ['leap-day',{birth:'2028-02-29',start:'2028-02-29',schedule:'five'},{eligible:true,'schedule.lastLeaveDate':'2028-03-01','schedule.returnDate':'2028-03-02'},['leap_year_date']],
 ['impossible-date',{birth:'2026-02-30'},{error:'date'},['unsupported_date']],
 ['negative-service',{months:-1},{error:'input'},['negative_input']],
 ['fractional-service',{months:6.5},{error:'input'},['decimal_precision']]
];
function fixtures(formulas){const formula=formulas.find(f=>f.id===id);return !formula?[]:cases.map(([name,patch,expected,caseClasses])=>({id:'ci-birth-'+name,formulaId:id,formulaVersion:formula.formulaVersion,caseClasses,operation:'ci-birth-leave',input:{...base,...patch},expected,tolerance:0,evidence:source,changeNote:'Bounded initial registration 2026-09-16; literal expectations, current-law review remains required.'}));}
function run(root,input){try{return require(path.join(root,artifact)).calculate(input);}catch(error){return {error:error.message};}}
module.exports={metadata,fixtures,run};

(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WaterResultEngine=api})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const opt=(v,name,max)=>{if(v===null||v===undefined||v==='')return null;const x=Number(v);if(!Number.isFinite(x)||x<0||x>max)throw new Error(`${name} must be between 0 and ${max}.`);return x};
const allowed=(value,values,message)=>{if(!values.includes(value))throw new Error(message);return value};
function eColiFlag(i){
let status=i.ecoliStatus;
if(status===undefined&&i.ecoli!==undefined&&i.ecoli!==null&&i.ecoli!=='')status=Number(i.ecoli)===0?'not-detected':'detected';
if(status===undefined||status==='')status='not-entered';
allowed(status,['not-entered','not-detected','detected'],'Choose a supported E. coli report result.');
if(status==='not-entered')return{name:'E. coli',status:'unknown',text:'not entered — unknown'};
if(status==='not-detected')return{name:'E. coli',status:'pass',text:'reported not detected in the entered 100 mL sample'};
return{name:'E. coli',status:'fail',text:'reported detected in the entered 100 mL sample'};
}
function review(input){
const i=input||{},labStatus=allowed(i.labStatus,['none','partial','competent'],'Choose a supported testing status.'),sampleScope=allowed(i.sampleScope||'unknown',['drinking','other','unknown'],'Choose a supported sample context.'),advisory=allowed(i.advisory||'unknown',['none','boil','do-not-drink','unknown'],'Choose a supported local-advisory status.');
const values={arsenic:opt(i.arsenic,'Arsenic',1e5),fluoride:opt(i.fluoride,'Fluoride',1e3),turbidity:opt(i.turbidity,'Turbidity',1e5)};
const flags=[eColiFlag(i),
values.arsenic===null?{name:'Arsenic',status:'unknown',text:'not entered — unknown'}:values.arsenic<=10?{name:'Arsenic',status:'pass',text:`${values.arsenic} µg/L — at or below the 10 µg/L provisional guideline value`}:{name:'Arsenic',status:'fail',text:`${values.arsenic} µg/L — above the 10 µg/L provisional guideline value`},
values.fluoride===null?{name:'Fluoride',status:'unknown',text:'not entered — unknown'}:values.fluoride<=1.5?{name:'Fluoride',status:'pass',text:`${values.fluoride} mg/L — at or below the 1.5 mg/L guideline value`}:{name:'Fluoride',status:'fail',text:`${values.fluoride} mg/L — above the 1.5 mg/L guideline value; climate and total intake still require local interpretation`},
values.turbidity===null?{name:'Turbidity',status:'unknown',text:'not entered — unknown'}:values.turbidity<=1?{name:'Turbidity',status:'pass',text:`${values.turbidity} NTU — at or below the 1 NTU operational target used here`}:values.turbidity<=5?{name:'Turbidity',status:'caution',text:`${values.turbidity} NTU — above the 1 NTU target but not above the 5 NTU fallback operational flag; treatment context needs review`}:{name:'Turbidity',status:'fail',text:`${values.turbidity} NTU — above the 5 NTU fallback operational flag; effective disinfection may be compromised`}];
const entered=flags.filter(x=>x.status!=='unknown').length,failures=flags.filter(x=>x.status==='fail'),cautions=flags.filter(x=>x.status==='caution'),microbialFailure=flags[0].status==='fail';
let level,action;
if(advisory==='do-not-drink'){level='Official do-not-drink advisory takes priority';action='Follow the official do-not-drink advisory exactly and use only the alternative source it permits. Do not use these entries, or boiling, to end or override the advisory.'}
else if(advisory==='boil'){level='Official boil-water advisory takes priority';action='Follow the official boil-water instructions exactly until the issuing authority ends them. Do not use these entries to end the advisory; boiling does not remove every chemical hazard.'}
else if(labStatus==='none'||entered===0){level='Safety cannot be assessed';action='Use current local water/public-health advice and obtain appropriate sampling and testing from a qualified laboratory or water authority.'}
else if(sampleScope!=='drinking'){level='Confirm the report and sample context';action='Ask the laboratory or water authority whether these results apply to the drinking-water sample you mean to assess. Do not apply the flags as a safety conclusion.'}
else if(microbialFailure){level='E. coli was reported detected';action='Use a source accepted by the local water/public-health authority and contact that authority or the laboratory now for interpretation and current safe-water instructions.'}
else if(failures.length){level='One or more entered references are exceeded';action='Use current local safe-water instructions and ask the laboratory, water supplier or public-health authority to interpret the exceeded chemical or operational result. Do not improvise a treatment recipe.'}
else if(labStatus!=='competent'||cautions.length){level='Incomplete or operational review — safety unverified';action='Confirm the laboratory, sampling method, turbidity/disinfection context, full required panel and local standards with a qualified water authority.'}
else{level='No entered reference exceedance — safety remains unverified';action='These selected entries do not certify the water as safe. Confirm sampling quality, the full required panel, local standards, current advisories and untested hazards with a qualified authority.'}
return Object.freeze({level,flags:Object.freeze(flags),action,warning:'This app cannot test or certify water. Passing selected entries, appearance, taste, smell or source type cannot prove safety, and no result overrides an official advisory.'});
}
return Object.freeze({review})});

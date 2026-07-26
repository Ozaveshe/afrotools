(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TbDateEngine=api})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const DAY=86400000,STATUSES=Object.freeze({scheduled:'scheduled / not yet confirmed complete',completed:'marked completed by you',changed:'changed or cancelled by the clinic'});
const day=v=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(String(v)))throw new Error('Dates must use YYYY-MM-DD.');const[y,m,d]=String(v).split('-').map(Number),ms=Date.UTC(y,m-1,d),date=new Date(ms);if(date.getUTCFullYear()!==y||date.getUTCMonth()!==m-1||date.getUTCDate()!==d)throw new Error('Enter a valid calendar date.');return ms};
const status=(value,label)=>{const key=value||'scheduled';if(!STATUSES[key])throw new Error(`Choose a supported status for ${label}.`);return key};
function review(input){
const i=input||{},now=day(i.today),defs=[['appointment','Next clinic appointment'],['sample','Sample collection'],['result','Result follow-up']],items=[],issues=[];
for(const[key,label]of defs){
if(!i[key])continue;
const due=day(i[key]),days=(due-now)/DAY,state=status(i[`${key}Status`],label);let context;
if(state==='completed'){context=`${STATUSES[state]}; ${days<0?`${Math.abs(days)} day(s) before`:days===0?'on':`${days} day(s) after`} the planning date — logistical record only`;if(days>0)issues.push(`${label.toLowerCase()} is in the future but marked completed`)}
else if(state==='changed'){context=`${STATUSES[state]}; keep the replacement date or clinic instruction separately`}
else if(days<0){context=`${Math.abs(days)} day(s) before the planning date — contact the clinic to confirm the current plan`;issues.push(`${label.toLowerCase()} is past and not marked completed or clinic-changed`)}
else if(days===0)context='scheduled for the planning date';
else context=`scheduled in ${days} day(s)`;
items.push(Object.freeze({key,label,date:i[key],days,state,stateLabel:STATUSES[state],context}));
}
const sample=items.find(x=>x.key==='sample'),result=items.find(x=>x.key==='result');
if(i.sameEpisode&&sample&&result&&sample.state==='scheduled'&&result.state==='scheduled'&&result.days<sample.days)issues.push('result follow-up is earlier than sample collection for entries marked as the same episode');
if(!items.length)return Object.freeze({level:'No clinic dates entered',items:Object.freeze(items),issues:Object.freeze(issues),action:'Add only dates already supplied by the clinic, or contact the clinic to confirm the next visit or test.',warning:'This tracker does not set treatment timing or give medicine, regimen, dose, missed-dose or adherence advice.'});
const level=issues.length?'One or more date entries need clinic confirmation':'Clinic dates organised';
const action=issues.length?'Contact the TB clinic to confirm the flagged dates or sequence. Do not infer anything about diagnosis, treatment response, infectiousness or medicine use from the dates.':'Keep the clinic-provided instructions and contact details with this local date summary.';
return Object.freeze({level,items:Object.freeze(items),issues:Object.freeze(issues),action,warning:'Do not change, delay or stop TB care or medicines because of this tracker; contact the prescribing clinic for individual clinical or access guidance.'});
}
return Object.freeze({review,STATUSES})});

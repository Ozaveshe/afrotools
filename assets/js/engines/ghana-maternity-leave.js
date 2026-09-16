(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory(require('../lib/leave-calendar.js'));else{root.AfroTools=root.AfroTools||{};root.AfroTools.ghanaMaternityLeave=factory(root.AfroTools.leaveCalendar);}})(typeof window==='undefined'?globalThis:window,function(calendar){
 'use strict';
 function calculate(input){
  var weeks=Number(input.weeks),extra=Number(input.extra),reasons=[];
  if(input.weeks===''||!Number.isInteger(weeks)||weeks<12||weeks>52||input.extra===''||!Number.isInteger(extra)||extra<0||extra>365)throw Error('input');
  if(!['none','multiple','abnormal','pregnancy','confinement'].includes(input.reason))throw Error('reason');
  if(input.reason==='none'&&extra!==0)throw Error('extension');
  if(['multiple','abnormal'].includes(input.reason)&&extra<14)throw Error('extension');
  if(['pregnancy','confinement'].includes(input.reason)&&extra<1)throw Error('extension');
  if(input.rule!==true)reasons.push('rule');if(input.certificate!==true)reasons.push('certificate');if(input.dates!==true)reasons.push('dates');if(input.reason!=='none'&&input.extension!==true)reasons.push('extension');
  var schedule=calendar.plan({start:input.start,days:weeks*7+extra,unit:'calendar'});
  return {confirmed:reasons.length===0,reasons:reasons,baseDays:weeks*7,extensionDays:extra,totalDays:weeks*7+extra,schedule:reasons.length?null:schedule,inputs:{start:input.start,weeks:weeks,extra:extra,reason:input.reason,rule:input.rule===true,certificate:input.certificate===true,dates:input.dates===true,extension:input.extension===true},version:'Ghana Act 651 (2003), section 57; current amendments unverified'};
 }
 function annual(input){
  var year=Number(input.year),worked=Number(input.worked),taken=Number(input.taken),reasons=[];
  if(input.year===''||!Number.isInteger(year)||year<1900||year>2200||!['continuous','irregular'].includes(input.mode)||input.taken===''||!Number.isFinite(taken)||taken<0||taken>366)throw Error('input');
  var yearDays=(Date.UTC(year+1,0,1)-Date.UTC(year,0,1))/86400000;
  if(input.mode==='irregular'&&(input.worked===''||!Number.isInteger(worked)||worked<0||worked>yearDays))throw Error('worked');
  if(input.rule!==true)reasons.push('rule');if(input.scope!==true)reasons.push('scope');if(input.protected!==true)reasons.push('protected');
  if(input.mode==='continuous'&&input.continuous!==true)reasons.push('continuous');
  if(input.mode==='irregular'&&worked<200)reasons.push('worked');
  return {confirmed:reasons.length===0,reasons:reasons,year:year,minimumDays:reasons.length?null:15,remainingDays:reasons.length?null:15-taken,inputs:{year:year,mode:input.mode,worked:input.mode==='irregular'?worked:null,taken:taken,rule:input.rule===true,scope:input.scope===true,protected:input.protected===true,continuous:input.continuous===true},version:'Ghana Act 651 (2003), sections 20–32; current amendments unverified'};
 }
 function annualPlan(input,request){
  var result=annual(input),days=Number(request.days);if(!result.confirmed||request.confirmed!==true)throw Error('confirmation');
  if(request.days===''||!Number.isInteger(days)||days<1||days>result.remainingDays)throw Error('request');
  if(!['five','six'].includes(request.schedule)||String(request.start).slice(0,4)!==String(result.year))throw Error('schedule');
  var exclusions=String(request.exclusions||'').split(/[\s,;]+/).filter(Boolean),weekdays=request.schedule==='five'?[1,2,3,4,5]:[1,2,3,4,5,6];if(exclusions.length>366)throw Error('exclusions');
  var schedule=calendar.plan({start:request.start,days:days,unit:'working',weekdays:weekdays,excludedDates:exclusions});if(!weekdays.includes(new Date(request.start+'T00:00:00Z').getUTCDay())||exclusions.includes(request.start))throw Error('start');
  return {allowance:result,schedule:schedule,remainingAfterRequest:result.remainingDays-days,request:{start:request.start,days:days,schedule:request.schedule,exclusions:exclusions,confirmed:true}};
 }
 return {calculate:calculate,annual:annual,annualPlan:annualPlan};
});

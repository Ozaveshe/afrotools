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
 return {calculate:calculate};
});

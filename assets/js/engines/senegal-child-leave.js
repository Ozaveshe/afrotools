(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory(require('../lib/leave-calendar.js'));else{root.AfroTools=root.AfroTools||{};root.AfroTools.senegalChildLeave=factory(root.AfroTools.leaveCalendar);}})(typeof window==='undefined'?globalThis:window,function(calendar){
 'use strict';
 var version='Law 97-17, L.148; bill 15/2026, article 249 (commencement unverified)';
 function calculate(input){
  var children=Number(input.children),taken=Number(input.taken),assessment=String(input.assessment||'');
  if(input.children===''||input.taken===''||!Number.isInteger(children)||children<0||children>100||!Number.isFinite(taken)||taken<0||taken>366||!/^\d{4}-\d{2}-\d{2}$/.test(assessment))throw Error('input');
  var date=new Date(assessment+'T00:00:00Z');if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==assessment)throw Error('date');
  var confirmed=input.rule===true&&input.service===true&&input.age===true;
  var childDays=input.mother===true?children:0;
  return {version:version,assessment:assessment,confirmed:confirmed,baseDays:confirmed?24:null,childDays:confirmed?childDays:null,totalDays:confirmed?24+childDays:null,remainingDays:confirmed?24+childDays-taken:null,inputs:{children:children,taken:taken,mother:input.mother===true,rule:input.rule===true,service:input.service===true,age:input.age===true}};
 }
 function plan(input,request){
  var result=calculate(input),days=Number(request.days);
  if(!result.confirmed||request.confirmed!==true)throw Error('confirmation');
  if(request.days===''||!Number.isInteger(days)||days<1||days>result.remainingDays)throw Error('request');
  if(!['five','six'].includes(request.schedule))throw Error('schedule');
  var excluded=String(request.exclusions||'').split(/[\s,;]+/).filter(Boolean),weekdays=request.schedule==='five'?[1,2,3,4,5]:[1,2,3,4,5,6];
  if(excluded.length>366)throw Error('exclusions');
  var schedule=calendar.plan({start:request.start,days:days,unit:'working',weekdays:weekdays,excludedDates:excluded});
  if(!weekdays.includes(new Date(request.start+'T00:00:00Z').getUTCDay())||excluded.includes(request.start))throw Error('start');
  return {allowance:result,schedule:schedule,remainingAfterRequest:result.remainingDays-days,request:{start:request.start,days:days,schedule:request.schedule,exclusions:excluded,confirmed:true}};
 }
 return {calculate:calculate,plan:plan,version:version};
});

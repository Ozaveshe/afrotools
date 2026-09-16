(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory();else{root.AfroTools=root.AfroTools||{};root.AfroTools.senegalChildLeave=factory();}})(typeof window==='undefined'?globalThis:window,function(){
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
 return {calculate:calculate,version:version};
});

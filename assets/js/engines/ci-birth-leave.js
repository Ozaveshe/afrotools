(function(root,factory){
  'use strict';
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../lib/leave-calendar.js'));
  else {root.AfroTools=root.AfroTools||{};root.AfroTools.ciBirthLeave=factory(root.AfroTools.leaveCalendar);}
})(typeof window==='undefined'?globalThis:window,function(calendar){
  'use strict';
  var source='https://www.uvci.online/portail/externes/documents/textes_officiels/Le_code_du_travail_ivoirien_-_20251.pdf';
  function date(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))throw Error('date');var n=Date.parse(value+'T00:00:00Z');if(!Number.isFinite(n)||new Date(n).toISOString().slice(0,10)!==value)throw Error('date');return n;}
  function calculate(input){
    var birth=date(input.birth),start=date(input.start),months=Number(input.months),used=Number(input.used);
    if(input.months===''||input.used===''||!Number.isInteger(months)||months<0||months>1200||!Number.isInteger(used)||used<0||used>10||start<birth)throw Error('input');
    if(input.schedule!=='five'&&input.schedule!=='six')throw Error('schedule');
    var exclusions=String(input.exclusions||'').split(/[\s,;]+/).filter(Boolean);exclusions.forEach(date);if(exclusions.length>366)throw Error('exclusions');
    var reasons=[];
    if(months<6)reasons.push('service');
    if(used>8)reasons.push('cap');
    if(input.family!==true)reasons.push('family');
    if(input.authorization==='force'){
      if(input.force!==true)reasons.push('force');
      var proof=date(input.proof);if(proof<birth||proof>birth+15*86400000)reasons.push('proof');
    }else if(input.authorization!=='prior')reasons.push('authorization');
    if(input.confirmed!==true)reasons.push('confirmed');
    var weekdays=input.schedule==='five'?[1,2,3,4,5]:[1,2,3,4,5,6];
    if(weekdays.indexOf(new Date(start).getUTCDay())<0||exclusions.indexOf(input.start)>=0)reasons.push('start');
    return {eligible:reasons.length===0,reasons:reasons,days:2,remainingFamilyDays:10-used,year:new Date(birth).getUTCFullYear(),source:source,sourceVersion:'Code du travail, article 25.12; compilation 2025, pages 71–72',schedule:reasons.length?null:calendar.plan({start:input.start,days:2,unit:'working',weekdays:weekdays,excludedDates:exclusions})};
  }
  return {calculate:calculate,source:source};
});

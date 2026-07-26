(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.BoardingSchoolEngine=api;}(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function num(value,label){var n=Number(value);if(!Number.isFinite(n))throw new Error(label+' must be a number.');return n;}
function bounded(value,label,min,max,integer){var n=num(value,label);if(integer)n=Math.round(n);if(n<min||n>max)throw new Error(label+' must be between '+min+' and '+max+'.');return n;}
function calculate(input){
 input=input||{};
 var years=bounded(input.years,'Years remaining',1,12,true);
 var terms=bounded(input.terms,'Terms per year',1,6,true);
 var months=bounded(input.months,'Spending months per year',0,12,true);
 var trips=bounded(input.trips,'Trips per year',0,24,true);
 var inflation=bounded(input.inflation||0,'Inflation assumption',0,50,false)/100;
 var contingency=bounded(input.contingency||0,'Contingency',0,50,false)/100;
 var keys=['tuitionTerm','boardingTerm','mealsTerm','extrasTerm','monthly','tripCost','annual','startup','dayAnnual'];
 var values={};keys.forEach(function(key){values[key]=num(input[key]||0,key);if(values[key]<0)throw new Error('Cost amounts cannot be negative.');});
 var termSubtotal=values.tuitionTerm+values.boardingTerm+values.mealsTerm+values.extrasTerm;
 var baseRecurring=termSubtotal*terms+values.monthly*months+values.tripCost*trips+values.annual;
 if(baseRecurring===0&&values.startup===0)throw new Error('Enter at least one boarding school cost.');
 var schedule=[],total=0,totalRecurring=0,totalContingency=0,dayTotal=0;
 for(var year=1;year<=years;year+=1){
  var factor=Math.pow(1+inflation,year-1);
  var recurring=baseRecurring*factor;
  var oneTime=year===1?values.startup:0;
  var buffer=(recurring+oneTime)*contingency;
  var yearTotal=recurring+oneTime+buffer;
  var day=values.dayAnnual>0?values.dayAnnual*factor:0;
  schedule.push({year:year,factor:factor,recurring:recurring,oneTime:oneTime,contingency:buffer,total:yearTotal,day:day});
  total+=yearTotal;totalRecurring+=recurring;totalContingency+=buffer;dayTotal+=day;
 }
 return {years:years,terms:terms,months:months,trips:trips,inflation:inflation,contingencyRate:contingency,termSubtotal:termSubtotal,baseRecurring:baseRecurring,startup:values.startup,totalRecurring:totalRecurring,totalContingency:totalContingency,total:total,averageAnnual:total/years,dayTotal:dayTotal,difference:values.dayAnnual>0?total-dayTotal:null,inputs:values,schedule:schedule};
}
return{calculate:calculate};
}));

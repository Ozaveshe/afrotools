(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.CourseLoadEngine=api;}(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function number(value,label){var n=Number(value);if(!Number.isFinite(n))throw new Error(label+' must be a number.');return n;}
function range(value,label,min,max){var n=number(value,label);if(n<min||n>max)throw new Error(label+' must be between '+min+' and '+max+'.');return n;}
function calculate(input){
 input=input||{};var required=range(input.required,'Programme credits',1,1000);var earned=range(input.earned,'Earned credits',0,1000);var min=range(input.min,'Minimum credits',0,100);var max=range(input.max,'Maximum credits',0.01,100);
 if(min>max)throw new Error('Minimum credits cannot exceed maximum credits.');
 var courses=(input.courses||[]).map(function(course,index){var credits=range(course.credits,'Course '+(index+1)+' credits',0.01,100);return{name:String(course.name||'Course '+(index+1)).trim().slice(0,80)||'Course '+(index+1),credits:credits};});
 if(!courses.length)throw new Error('Add at least one course with credits.');
 var registered=courses.reduce(function(sum,course){return sum+course.credits;},0);
 var band=registered<min?'below':registered>max?'above':'inside';
 var remainingBefore=Math.max(0,required-earned);var remainingIfCompleted=Math.max(0,required-earned-registered);
 var time={contact:range(input.contact||0,'Class and placement hours',0,168),study:range(input.study||0,'Independent study hours',0,168),work:range(input.work||0,'Work and caregiving hours',0,168),commute:range(input.commute||0,'Commute hours',0,168),sleepNight:range(input.sleepNight||0,'Sleep per night',0,24),personal:range(input.personal||0,'Personal hours',0,168)};
 var accounted=time.contact+time.study+time.work+time.commute+time.sleepNight*7+time.personal;var unallocated=168-accounted;
 return{required:required,earned:earned,courses:courses,registered:registered,min:min,max:max,band:band,remainingBefore:remainingBefore,remainingIfCompleted:remainingIfCompleted,progress:Math.min(100,earned/required*100),accounted:accounted,unallocated:unallocated,time:time};
}
return{calculate:calculate};
}));

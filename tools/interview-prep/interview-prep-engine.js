(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.InterviewPrepEngine=api;}(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function clean(value,max){return String(value||'').trim().slice(0,max);}
function compile(input){input=input||{};var role=clean(input.role,100);if(!role)throw new Error('Enter the target role or interview purpose.');
 var evidence=(input.evidence||[]).map(function(item){return{requirement:clean(item.requirement,300),proof:clean(item.proof,700)};}).filter(function(item){return item.requirement||item.proof;});
 var stories=(input.stories||[]).map(function(item){return{title:clean(item.title,120),situation:clean(item.situation,700),task:clean(item.task,700),action:clean(item.action,1000),result:clean(item.result,1000)};}).filter(function(item){return item.title||item.situation||item.task||item.action||item.result;});
 var questions=(input.questions||[]).map(function(item){return clean(item,500);}).filter(Boolean);
 return{role:role,employer:clean(input.employer,100),format:clean(input.format,60)||'not confirmed',instructions:clean(input.instructions,800),evidence:evidence,stories:stories,questions:questions};
}
return{compile:compile};
}));

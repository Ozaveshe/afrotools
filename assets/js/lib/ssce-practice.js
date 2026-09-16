(function(root,factory){
  'use strict';var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root){root.AfroTools=root.AfroTools||{};root.AfroTools.sscePractice=api;}
})(typeof window==='undefined'?null:window,function(){
  'use strict';
  var key='afrotools.sscePractice.v1';
  function normalize(value,bank){
    if(!value||value.version!==1||value.bankId!==bank.id||!Array.isArray(value.ids)||!value.ids.length||value.ids.length>bank.questions.length||new Set(value.ids).size!==value.ids.length)throw Error('This practice backup is not supported.');
    var answers={},ids=value.ids.slice();
    if(!Number.isInteger(value.index)||value.index<0||value.index>ids.length||!value.answers||typeof value.answers!=='object'||Array.isArray(value.answers))throw Error('This practice progress is invalid.');
    ids.forEach(function(id,i){
      var q=bank.questions.find(function(q){return q.id===id;});if(!q)throw Error('A question in this backup is unavailable.');
      var a=value.answers[id];
      if(a!==undefined){if(!Number.isInteger(a)||a<0||a>=q.options.length||i>value.index)throw Error('A saved answer is invalid.');answers[id]=a;}
      if(i<value.index&&a===undefined)throw Error('This practice progress has missing answers.');
    });
    return {version:1,bankId:bank.id,ids:ids,index:value.index,answers:answers};
  }
  function start(bank,subject,topic){
    var ids=bank.questions.filter(function(q){return q.subject===subject&&(!topic||q.topic===topic);}).map(function(q){return q.id;});
    if(!ids.length)throw Error('Choose an available subject and topic.');
    return normalize({version:1,bankId:bank.id,ids:ids,index:0,answers:{}},bank);
  }
  function answer(state,choice,bank){var next=normalize(state,bank),id=next.ids[next.index];if(!id)throw Error('This session has finished.');if(next.answers[id]!==undefined)throw Error('This answer has already been checked.');next.answers[id]=choice;return normalize(next,bank);}
  function advance(state,bank){var next=normalize(state,bank);if(next.answers[next.ids[next.index]]===undefined)throw Error('Check your answer before continuing.');next.index++;return normalize(next,bank);}
  function result(state,bank){var safe=normalize(state,bank),missed=[],correct=0,answered=0;safe.ids.forEach(function(id){var a=safe.answers[id];if(a!==undefined){answered++;if(a===bank.questions.find(function(q){return q.id===id;}).answer)correct++;else missed.push(id);}});return {answered:answered,total:safe.ids.length,correct:correct,missed:missed};}
  function retry(state,bank){var ids=result(state,bank).missed;if(!ids.length)throw Error('There are no missed questions to retry.');return normalize({version:1,bankId:bank.id,ids:ids,index:0,answers:{}},bank);}
  function report(state,bank){
    var safe=normalize(state,bank),score=result(safe,bank),seen=new Set();
    var t=function(text){return bank.ui&&bank.ui[text]||text;};
    var lines=[bank.locale==='fr'?t('AfroTools Mathematics and English practice'):'AfroTools '+Array.from(new Set(safe.ids.map(function(id){return bank.questions.find(function(q){return q.id===id;}).subject;}))).join(', ')+' practice',bank.scope,t('Score so far: ')+score.correct+t(' correct / ')+score.answered+t(' answered')];
    safe.ids.forEach(function(id){
      var q=bank.questions.find(function(q){return q.id===id;}),a=safe.answers[id];if(a===undefined)return;
      if(q.passageId&&!seen.has(q.passageId)){var passage=bank.passages[q.passageId];lines.push('',passage.title,passage.text);seen.add(q.passageId);}
      lines.push('',t(q.topic),q.prompt);
      q.options.forEach(function(option,i){lines.push(String.fromCharCode(65+i)+'. '+option);});
      lines.push(t('Your answer: ')+q.options[a],t('Correct answer: ')+q.options[q.answer],q.steps.join('\n'),q.pitfall);
    });
    return lines.join('\n');
  }
  return {key:key,normalize:normalize,start:start,answer:answer,advance:advance,result:result,retry:retry,report:report};
});

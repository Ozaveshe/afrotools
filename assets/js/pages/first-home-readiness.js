(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.FirstHomeReadiness=api;
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  // Covers high-denomination African currencies while keeping user-entered totals bounded.
  var MAX_AMOUNT=1000000000000;
  // A century is a useful planning boundary; larger results are not actionable purchase timelines.
  var MAX_TIMELINE_MONTHS=1200;
  var copy={
    en:{goal:'Cash goal',saved:'Funds set aside',gap:'Funding gap',monthly:'Monthly contribution',ready:'Your stated cash goal is funded',months:function(n){return n+' month'+(n===1?'':'s')+' at your current pace';},noPace:'Add a monthly contribution to estimate a timeline.',longPace:'The timeline is beyond the 100-year planning range. Increase the contribution or revise the goal.',invalid:'Enter a cash goal above zero. Each amount and the combined goal must be no more than 1,000,000,000,000.',score:function(n,t){return n+' of '+t+' readiness checks complete';},note:'This is a planning timeline from your own figures, not a loan approval, property budget, fee estimate or promise of a purchase date.',copied:'Plan copied.',downloaded:'Text plan downloaded.'},
    fr:{goal:'Objectif de trésorerie',saved:'Fonds déjà réservés',gap:'Écart à financer',monthly:'Versement mensuel',ready:'Votre objectif déclaré est financé',months:function(n){return n+' mois au rythme actuel';},noPace:'Ajoutez un versement mensuel pour estimer un délai.',longPace:'Le délai dépasse la plage de planification de 100 ans. Augmentez le versement ou revoyez l’objectif.',invalid:'Saisissez un objectif supérieur à zéro. Chaque montant et leur total doivent rester sous 1 000 000 000 000.',score:function(n,t){return n+' vérifications sur '+t+' terminées';},note:'Ce délai repose uniquement sur vos chiffres. Ce n’est ni un accord de prêt, ni un budget immobilier, ni une estimation de frais, ni une promesse de date d’achat.',copied:'Plan copié.',downloaded:'Plan texte téléchargé.'},
    sw:{goal:'Lengo la fedha',saved:'Fedha zilizotengwa',gap:'Pengo la fedha',monthly:'Mchango wa kila mwezi',ready:'Lengo lako la fedha limetimia',months:function(n){return 'Miezi '+n+' kwa kasi yako ya sasa';},noPace:'Weka mchango wa kila mwezi ili kukadiria muda.',longPace:'Muda umezidi kipindi cha mpango cha miaka 100. Ongeza mchango au badili lengo.',invalid:'Weka lengo zaidi ya sifuri. Kila kiasi na jumla lazima visizidi 1,000,000,000,000.',score:function(n,t){return 'Ukaguzi '+n+' kati ya '+t+' umekamilika';},note:'Muda huu unatokana na namba ulizoweka. Si idhini ya mkopo, bajeti ya nyumba, makadirio ya ada wala ahadi ya tarehe ya kununua.',copied:'Mpango umenakiliwa.',downloaded:'Mpango wa maandishi umepakuliwa.'}
  };
  function number(value){var n=Number(value);return Number.isFinite(n)?n:NaN;}
  function compute(input){
    var deposit=number(input.deposit),upfront=number(input.upfront),reserve=number(input.reserve),saved=number(input.saved),monthly=number(input.monthly);
    var values=[deposit,upfront,reserve,saved,monthly];
    if(values.some(function(n){return !Number.isFinite(n)||n<0||n>MAX_AMOUNT;}))return {valid:false};
    var goal=deposit+upfront+reserve;
    if(!Number.isFinite(goal)||goal<=0||goal>MAX_AMOUNT)return {valid:false};
    var gap=Math.max(0,goal-saved);
    var rawMonths=gap>0&&monthly>0?gap/monthly:null;
    var timelineLimited=rawMonths!==null&&(!Number.isFinite(rawMonths)||rawMonths>MAX_TIMELINE_MONTHS);
    var months=gap===0?0:(monthly===0||timelineLimited?null:Math.ceil(rawMonths));
    var progress=Math.min(100,(saved/goal)*100);
    if(!Number.isFinite(progress)||!Number.isSafeInteger(months===null?0:months))return {valid:false};
    return {valid:true,goal:goal,saved:saved,gap:gap,monthly:monthly,months:months,timelineLimited:timelineLimited,progress:progress};
  }
  function format(amount,currency,lang){
    try{return new Intl.NumberFormat(lang==='sw'?'sw-KE':lang==='fr'?'fr-FR':'en',{style:'currency',currency:currency,maximumFractionDigits:0}).format(amount);}
    catch(e){return currency+' '+Math.round(amount).toLocaleString();}
  }
  function init(){
    if(typeof document==='undefined')return;
    var form=document.getElementById('fh-form');
    if(!form)return;
    var lang=(document.documentElement.lang||'en').slice(0,2);
    var text=copy[lang]||copy.en;
    var resultBox=document.getElementById('fh-result');
    var error=document.getElementById('fh-error');
    var live=document.getElementById('fh-live');
    var last=null;
    function field(id){return document.getElementById(id).value;}
    function resultText(){
      if(!last)return '';
      var currency=field('currency');
      var timeline=last.months===0?text.ready:(last.timelineLimited?text.longPace:(last.months===null?text.noPace:text.months(last.months)));
      return [
        document.title,
        text.goal+': '+format(last.goal,currency,lang),
        text.saved+': '+format(last.saved,currency,lang),
        text.gap+': '+format(last.gap,currency,lang),
        text.monthly+': '+format(last.monthly,currency,lang),
        timeline,
        document.getElementById('fh-check-status').textContent,
        text.note
      ].join('\n');
    }
    function calculate(event){
      if(event)event.preventDefault();
      var outcome=compute({deposit:field('deposit'),upfront:field('upfront'),reserve:field('reserve'),saved:field('saved'),monthly:field('monthly')});
      if(!outcome.valid){
        last=null; resultBox.classList.remove('on'); error.textContent=text.invalid; error.classList.add('on'); error.focus(); return;
      }
      last=outcome; error.classList.remove('on');
      var currency=field('currency');
      document.getElementById('fh-result-title').textContent=outcome.months===0?text.ready:(outcome.timelineLimited?text.longPace:(outcome.months===null?text.noPace:text.months(outcome.months)));
      document.getElementById('fh-goal').textContent=format(outcome.goal,currency,lang);
      document.getElementById('fh-saved').textContent=format(outcome.saved,currency,lang);
      document.getElementById('fh-gap').textContent=format(outcome.gap,currency,lang);
      document.getElementById('fh-progress-bar').style.width=outcome.progress.toFixed(1)+'%';
      document.getElementById('fh-result-note').textContent=text.note;
      resultBox.classList.add('on');
      live.textContent=document.getElementById('fh-result-title').textContent;
    }
    function updateChecks(){
      var checks=Array.prototype.slice.call(document.querySelectorAll('[data-fh-check]'));
      var done=checks.filter(function(box){return box.checked;}).length;
      document.getElementById('fh-check-status').textContent=text.score(done,checks.length);
    }
    form.addEventListener('submit',calculate);
    document.querySelectorAll('[data-fh-check]').forEach(function(box){box.addEventListener('change',updateChecks);});
    document.getElementById('fh-copy').addEventListener('click',function(){
      if(!last)calculate();
      if(!last)return;
      var value=resultText();
      var done=function(){live.textContent=text.copied;};
      if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(value).then(done).catch(function(){window.prompt('',value);});
      else window.prompt('',value);
    });
    document.getElementById('fh-download').addEventListener('click',function(){
      if(!last)calculate();
      if(!last)return;
      var blob=new Blob([resultText()],{type:'text/plain;charset=utf-8'});
      var link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='first-home-readiness-plan.txt';link.click();
      setTimeout(function(){URL.revokeObjectURL(link.href);},0);live.textContent=text.downloaded;
    });
    document.getElementById('fh-print').addEventListener('click',function(){if(!last)calculate();if(last)window.print();});
    updateChecks();
  }
  if(typeof document!=='undefined'){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  }
  return {compute:compute,format:format,MAX_AMOUNT:MAX_AMOUNT,MAX_TIMELINE_MONTHS:MAX_TIMELINE_MONTHS};
});

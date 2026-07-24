(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.HomeLoanFile=api;
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  var MAX_ITEMS=20,MAX_LABEL_LENGTH=80;
  var allowed=['not-started','gathering','ready','update','not-requested'];
  var copy={
    en:{title:function(n){return n+' evidence item'+(n===1?'':'s')+' ready';},summary:'This counts file status only. It does not measure eligibility or approval chances.',invalid:'Use no more than 80 characters for each optional label.',ready:'Ready',gathering:'Gathering',update:'Needs update',open:'Not started',excluded:'Not requested',copied:'File summary copied.',downloaded:'Text file summary downloaded.'},
    fr:{title:function(n){return n+' justificatif'+(n===1?'':'s')+' prêt'+(n===1?'':'s');},summary:'Ce décompte décrit uniquement l’état du dossier. Il ne mesure ni l’éligibilité ni les chances d’accord.',invalid:'Limitez chaque libellé facultatif à 80 caractères.',ready:'Prêt',gathering:'En collecte',update:'À mettre à jour',open:'Non commencé',excluded:'Non demandé',copied:'Résumé copié.',downloaded:'Résumé texte téléchargé.'},
    sw:{title:function(n){return 'Ushahidi '+n+' uko tayari';},summary:'Hesabu hii inaonyesha hali ya faili pekee. Haipimi ustahiki wala nafasi ya kuidhinishwa.',invalid:'Kila jina la hiari lisizidi herufi 80.',ready:'Tayari',gathering:'Inakusanywa',update:'Inahitaji kusasishwa',open:'Haijaanza',excluded:'Haijaombwa',copied:'Muhtasari umenakiliwa.',downloaded:'Muhtasari wa maandishi umepakuliwa.'}
  };
  function cleanLabel(value){var text=String(value||'').trim();return text.length<=MAX_LABEL_LENGTH?text:null;}
  function summarize(statuses){
    if(!Array.isArray(statuses)||statuses.length===0||statuses.length>MAX_ITEMS||statuses.some(function(s){return allowed.indexOf(s)<0;}))return {valid:false};
    var counts={ready:0,gathering:0,update:0,open:0,excluded:0};
    statuses.forEach(function(status){
      if(status==='ready')counts.ready++;
      else if(status==='gathering')counts.gathering++;
      else if(status==='update')counts.update++;
      else if(status==='not-started')counts.open++;
      else counts.excluded++;
    });
    return {valid:true,total:statuses.length,required:statuses.length-counts.excluded,counts:counts};
  }
  function init(){
    if(typeof document==='undefined')return;
    var form=document.getElementById('hl-form');if(!form)return;
    var lang=(document.documentElement.lang||'en').slice(0,2),text=copy[lang]||copy.en,last=null;
    var result=document.getElementById('hl-result'),error=document.getElementById('hl-error'),live=document.getElementById('hl-live');
    function labels(){return {lender:cleanLabel(document.getElementById('hl-lender').value),application:cleanLabel(document.getElementById('hl-application').value)};}
    function statuses(){return Array.prototype.map.call(document.querySelectorAll('[data-hl-status]'),function(select){return select.value;});}
    function render(event){
      if(event)event.preventDefault();
      var names=labels(),summary=summarize(statuses());
      if(names.lender===null||names.application===null||!summary.valid){last=null;result.classList.remove('on');error.textContent=text.invalid;error.classList.add('on');error.focus();return;}
      last={labels:names,summary:summary};error.classList.remove('on');
      document.getElementById('hl-result-title').textContent=text.title(summary.counts.ready);
      document.getElementById('hl-result-copy').textContent=text.summary;
      ['ready','gathering','update','open'].forEach(function(key){document.getElementById('hl-'+key).textContent=summary.counts[key];});
      result.classList.add('on');live.textContent=document.getElementById('hl-result-title').textContent;
    }
    function exportText(){
      if(!last)render();if(!last)return '';
      var lines=[document.title];
      if(last.labels.lender)lines.push(document.querySelector('label[for="hl-lender"]').textContent+': '+last.labels.lender);
      if(last.labels.application)lines.push(document.querySelector('label[for="hl-application"]').textContent+': '+last.labels.application);
      lines.push(text.title(last.summary.counts.ready),text.ready+': '+last.summary.counts.ready,text.gathering+': '+last.summary.counts.gathering,text.update+': '+last.summary.counts.update,text.open+': '+last.summary.counts.open,text.excluded+': '+last.summary.counts.excluded,'');
      document.querySelectorAll('[data-hl-status]').forEach(function(select){lines.push(select.getAttribute('data-label')+': '+select.options[select.selectedIndex].text);});
      lines.push('',text.summary);
      return lines.join('\n');
    }
    form.addEventListener('submit',render);
    document.getElementById('hl-copy').addEventListener('click',function(){var value=exportText();if(!value)return;var done=function(){live.textContent=text.copied;};if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(value).then(done).catch(function(){window.prompt('',value);});else window.prompt('',value);});
    document.getElementById('hl-download').addEventListener('click',function(){var value=exportText();if(!value)return;var blob=new Blob([value],{type:'text/plain;charset=utf-8'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='home-loan-application-file.txt';link.click();setTimeout(function(){URL.revokeObjectURL(link.href);},0);live.textContent=text.downloaded;});
    document.getElementById('hl-print').addEventListener('click',function(){if(!last)render();if(last)window.print();});
  }
  if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();}
  return {summarize:summarize,cleanLabel:cleanLabel,MAX_ITEMS:MAX_ITEMS,MAX_LABEL_LENGTH:MAX_LABEL_LENGTH};
});

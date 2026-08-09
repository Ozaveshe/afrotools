(function () {
  'use strict';
  var engine = window.AfroTools && window.AfroTools.swFinalParity;
  if (!engine) return;
  var root = document.querySelector('[data-sw-final-app]');
  if (!root) return;
  var type = root.dataset.swFinalApp;
  var id = root.dataset.toolId || '';
  var result = null;

  function q(selector) { return root.querySelector(selector); }
  function number(selector) { return Number(q(selector).value); }
  function money(value, currency) { return new Intl.NumberFormat('sw', { style:'currency', currency:currency || 'USD', maximumFractionDigits:2 }).format(value); }
  function announce(text, error) { var box=q('[data-status]'); if(box){box.textContent=text;box.dataset.error=error?'true':'false';} }
  function download(name, mime, content) { var blob=content instanceof Blob?content:new Blob([content],{type:mime}); var url=URL.createObjectURL(blob); var a=document.createElement('a'); a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000); }
  function pdfText(title, lines, preferPortable) {
    if (!preferPortable && window.jspdf && window.jspdf.jsPDF) {
      var doc = new window.jspdf.jsPDF({ unit:'mm', format:'a4' });
      doc.setFont('helvetica','bold');doc.setFontSize(15);doc.text(String(title||'AfroTools'),18,20);
      doc.setFont('helvetica','normal');doc.setFontSize(10);
      var pageY=30;
      lines.forEach(function(line){var chunks=doc.splitTextToSize(String(line),170);doc.text(chunks,18,pageY);pageY+=Math.max(8,chunks.length*5);if(pageY>275){doc.addPage();pageY=20;}});
      return new Blob([doc.output('arraybuffer')],{type:'application/pdf'});
    }
    function safe(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7E\n]/g,'?').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').slice(0,110);}
    function bytes(value){return new TextEncoder().encode(value);}
    var commands=['BT','/F1 13 Tf','50 790 Td','('+safe(title)+') Tj','/F1 10 Tf'];
    lines.forEach(function(line){commands.push('0 -18 Td','('+safe(line)+') Tj');});commands.push('ET');
    var stream=commands.join('\n');
    var objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>','<< /Length '+bytes(stream).length+' >>\nstream\n'+stream+'\nendstream'];
    var out='%PDF-1.4\n', offsets=[0];objects.forEach(function(object,index){offsets.push(bytes(out).length);out+=(index+1)+' 0 obj\n'+object+'\nendobj\n';});var xref=bytes(out).length;out+='xref\n0 6\n0000000000 65535 f \n';offsets.slice(1).forEach(function(offset){out+=String(offset).padStart(10,'0')+' 00000 n \n';});out+='trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n';return new Blob([bytes(out)],{type:'application/pdf'});
  }
  function exportResult(format) {
    if(!result){announce('Kokotoa au tengeneza matokeo kwanza.',true);return;}
    var lines=Object.keys(result).filter(function(k){return typeof result[k] !== 'object';}).map(function(k){return k+': '+result[k];});
    if(format==='json') download(id+'.json','application/json',JSON.stringify({toolId:id,locale:'sw',exportedAt:new Date().toISOString(),result:result},null,2));
    if(format==='csv') download(id+'.csv','text/csv;charset=utf-8','field,value\n'+lines.map(function(x){var p=x.indexOf(':');return '"'+x.slice(0,p)+'","'+x.slice(p+2).replace(/"/g,'""')+'"';}).join('\n'));
    if(format==='txt') download(id+'.txt','text/plain;charset=utf-8',lines.join('\n'));
    if(format==='pdf') download(id+'.pdf','application/pdf',pdfText(document.title,lines,true));
    announce('Faili imeundwa ndani ya kivinjari.');
  }

  function bindExports(){root.querySelectorAll('[data-export]').forEach(function(button){button.addEventListener('click',function(){exportResult(button.dataset.export);});});}
  function payeInputs(form){var values={};Array.from(form.elements).forEach(function(field){if(!field.name)return;if(field.type==='checkbox')values[field.name]=field.checked;else if(field.type==='number')values[field.name]=Number(field.value||0);else values[field.name]=field.value;});return values;}

  function initPaye(){
    var payeForm=q('form');
    var profile=engine.PAYE_PROFILES[id],storageKey='afrotools:sw:paye:'+id;
    function normalizedInputs(){var values=payeInputs(payeForm),inputPeriod=values.inputPeriod;delete values.inputPeriod;if(inputPeriod!==profile.period)values.gross=profile.period==='annual'?values.gross*12:values.gross/12;return values;}
    function render(){if(!result)return;var inputPeriod=q('[name="inputPeriod"]').value,factor=inputPeriod===profile.period?1:(inputPeriod==='monthly'?1/12:12);var displayGross=result.gross*factor,displayTaxable=result.taxable*factor,displayNet=result.net*factor,displayTax=result.tax*factor,displayContribution=result.contribution*factor,total=Math.max(1,displayNet+displayTax+displayContribution);q('[data-result]').innerHTML='<strong>'+money(displayNet,result.currency)+'</strong><span>Kodi: '+money(displayTax,result.currency)+' · Mchango: '+money(displayContribution,result.currency)+'</span>';q('[data-breakdown]').innerHTML='<div><dt>Ghafi</dt><dd>'+money(displayGross,result.currency)+'</dd></div><div><dt>Mapato ya kodi</dt><dd>'+money(displayTaxable,result.currency)+'</dd></div><div><dt>Kodi</dt><dd>'+money(displayTax,result.currency)+'</dd></div><div><dt>Mchango</dt><dd>'+money(displayContribution,result.currency)+'</dd></div><div><dt>Neti</dt><dd>'+money(displayNet,result.currency)+'</dd></div>';q('[data-chart]').innerHTML='<div style="display:flex;height:18px;border-radius:9px;overflow:hidden" role="img" aria-label="Neti '+Math.round(displayNet/total*100)+'%, kodi '+Math.round(displayTax/total*100)+'%, mchango '+Math.round(displayContribution/total*100)+'%"><span style="width:'+(displayNet/total*100)+'%;background:#087a4a"></span><span style="width:'+(displayTax/total*100)+'%;background:#b42318"></span><span style="width:'+(displayContribution/total*100)+'%;background:#1769e0"></span></div>';}
    function calculate(){result=engine.calculatePaye(id,normalizedInputs());render();announce('Makadirio yamekamilika. Thibitisha na mamlaka rasmi kabla ya kuwasilisha.');}
    payeForm.addEventListener('submit',function(event){event.preventDefault();try{calculate();}catch(error){result=null;q('[data-result]').textContent='';announce('Weka mshahara ghafi ulio zaidi ya sifuri na ukague chaguo.',true);}});
    root.querySelectorAll('[data-preset]').forEach(function(button){button.addEventListener('click',function(){q('[name="gross"]').value=button.dataset.preset;try{calculate();}catch(error){announce('Kiasi cha mfano hakiwezi kukokotolewa.',true);}});});
    q('[data-net-to-gross]').addEventListener('click',function(){var target=number('[name="desiredNet"]');if(!(target>0)){announce('Weka mshahara halisi unaolenga.',true);return;}var inputPeriod=q('[name="inputPeriod"]').value,targetProfile=inputPeriod===profile.period?target:(profile.period==='annual'?target*12:target/12),low=0,high=Math.max(targetProfile*3,1);for(var grow=0;grow<20&&engine.calculatePaye(id,Object.assign(normalizedInputs(),{gross:high})).net<targetProfile;grow++)high*=2;for(var i=0;i<60;i++){var mid=(low+high)/2;if(engine.calculatePaye(id,Object.assign(normalizedInputs(),{gross:mid})).net<targetProfile)low=mid;else high=mid;}q('[name="gross"]').value=(inputPeriod===profile.period?high:(inputPeriod==='monthly'?high/12:high*12)).toFixed(2);calculate();announce('Mshahara ghafi unaokadiriwa umewekwa.');});
    q('[data-reset]').addEventListener('click',function(){payeForm.reset();result=null;q('[data-result]').textContent='';q('[data-breakdown]').textContent='';q('[data-chart]').textContent='';announce('Fomu imefutwa.');});
    q('[data-save]').addEventListener('click',function(){if(!result){announce('Kokotoa kwanza.',true);return;}localStorage.setItem(storageKey,JSON.stringify({inputs:payeInputs(payeForm),result:result}));announce('Makadirio yamehifadhiwa kwenye kifaa hiki.');});
    q('[data-load]').addEventListener('click',function(){try{var saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(!saved)throw new Error('missing');Object.keys(saved.inputs).forEach(function(name){var field=payeForm.elements[name];if(!field)return;if(field.type==='checkbox')field.checked=!!saved.inputs[name];else field.value=saved.inputs[name];});result=saved.result;render();announce('Makadirio yamefunguliwa.');}catch(error){announce('Hakuna makadirio yaliyohifadhiwa.',true);}});
    q('[data-copy]').addEventListener('click',function(){if(!result){announce('Kokotoa kwanza.',true);return;}var text='PAYE '+result.country+': neti '+money(result.net,result.currency)+', kodi '+money(result.tax,result.currency)+', mchango '+money(result.contribution,result.currency);navigator.clipboard&&navigator.clipboard.writeText(text).catch(function(){});announce('Muhtasari umenakiliwa.');});
    q('[data-print]').addEventListener('click',function(){if(!result){announce('Kokotoa kwanza.',true);return;}window.print();});
    q('[data-explain]').addEventListener('click',function(){if(!result){announce('Kokotoa kwanza.',true);return;}q('[data-ai-result]').textContent='Kwa kila '+money(result.gross,result.currency)+' ya ghafi, makadirio yanatoa '+money(result.contribution,result.currency)+' ya mchango na '+money(result.tax,result.currency)+' ya kodi. Neti ni '+money(result.net,result.currency)+'. Haya ni maelezo ya ndani bila mtandao.';});
    var consent=q('[name="aiConsent"]'),aiButton=q('[data-ai]');consent.addEventListener('change',function(){aiButton.disabled=!consent.checked;});
    aiButton.addEventListener('click',async function(){if(!consent.checked||!result){announce('Kokotoa na utoe ruhusa kwanza.',true);return;}aiButton.disabled=true;try{var payload={toolId:id,locale:'sw',gross:result.gross,tax:result.tax,contribution:result.contribution,net:result.net,currency:result.currency,sourceReviewed:result.reviewed};var response=await fetch('/.netlify/functions/ai-advisor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({consent:true,context:payload,messages:[{role:'user',content:'Eleza makadirio haya kwa Kiswahili. Tenganisha snapshot na ukweli rasmi; usibuni unafuu au tarehe.'}]})});if(!response.ok)throw new Error('http');var data=await response.json();q('[data-ai-result]').textContent=data.text||'AI haikutoa maelezo.';}catch(error){q('[data-ai-result]').textContent='AI haipatikani. Tumia maelezo ya ndani; hesabu yako haijabadilika.';}finally{aiButton.disabled=!consent.checked;}});
    bindExports();
  }
  if(type==='paye')initPaye();
}());

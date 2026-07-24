(function () {
  'use strict';
  var cfg = window.LoanComparePage || {};
  var engine = window.AfroTools && window.AfroTools.loanCompare;
  var form = document.getElementById('loanCompareForm');
  if (!engine || !form) return;
  var offers = document.getElementById('offerCards');
  var latest = null;
  var count = 0;
  function el(id) { return document.getElementById(id); }
  function money(value) {
    try { return new Intl.NumberFormat(cfg.locale || 'en', {style:'currency',currency:el('currency').value,maximumFractionDigits:2}).format(value); }
    catch (_) { return el('currency').value + ' ' + Number(value).toLocaleString(cfg.locale || 'en',{maximumFractionDigits:2}); }
  }
  function pdfMoney(value) { return el('currency').value + ' ' + Number(value).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function status(message, error) { el('status').textContent = message; el('status').classList.toggle('error', !!error); }
  function field(label, name, type, value, extra, help) { return '<div class="lc-field"><label>'+label+'<input name="'+name+'" type="'+(type||'number')+'" value="'+value+'" '+(extra||'')+'></label>'+(help?'<p class="lc-help">'+help+'</p>':'')+'</div>'; }
  function addOffer(values) {
    if (offers.children.length >= 4) return;
    count += 1;
    var card = document.createElement('fieldset'); card.className='lc-offer'; card.dataset.offer=String(count);
    card.innerHTML='<div class="lc-offer-head"><h3>'+cfg.offer+' '+offers.children.length.toString().replace(/[0-9]+/, String(offers.children.length+1))+'</h3>'+(offers.children.length>=2?'<button class="lc-remove" type="button">'+cfg.remove+'</button>':'')+'</div><div class="lc-fields">'+
      field(cfg.labelName,'name','text',(values&&values.name)||'', 'autocomplete="off" maxlength="50"',cfg.helpName)+
      '<div class="lc-field"><label>'+cfg.labelMethod+'<select name="rateMethod"><option value="reducing">'+cfg.reducing+'</option><option value="flat">'+cfg.flat+'</option></select></label></div>'+
      field(cfg.labelAmount,'amount','number',(values&&values.amount)||'100000','min="0" step="0.01" inputmode="decimal"')+
      field(cfg.labelRate,'annualRate','number',(values&&values.annualRate)||'12','min="0" max="500" step="0.01" inputmode="decimal"',cfg.helpRate)+
      field(cfg.labelTerm,'termMonths','number',(values&&values.termMonths)||'12','min="1" max="600" step="1" inputmode="numeric"')+
      field(cfg.labelUpfront,'paidUpfront','number','0','min="0" step="0.01" inputmode="decimal"')+
      field(cfg.labelDeducted,'deductedFees','number','0','min="0" step="0.01" inputmode="decimal"',cfg.helpDeducted)+
      field(cfg.labelMonthly,'monthlyFees','number','0','min="0" step="0.01" inputmode="decimal"')+
      field(cfg.labelFinal,'finalPayment','number','0','min="0" step="0.01" inputmode="decimal"')+'</div>';
    offers.appendChild(card);
    var remove=card.querySelector('.lc-remove'); if(remove) remove.addEventListener('click',function(){card.remove();renumber();});
  }
  function renumber(){Array.from(offers.children).forEach(function(card,index){card.querySelector('h3').textContent=cfg.offer+' '+(index+1);});el('addOfferBtn').disabled=offers.children.length>=4;}
  function readOffer(card){function v(name){return card.querySelector('[name="'+name+'"]').value;}return{name:v('name'),rateMethod:v('rateMethod'),amount:v('amount'),annualRate:v('annualRate'),termMonths:v('termMonths'),paidUpfront:v('paidUpfront'),deductedFees:v('deductedFees'),monthlyFees:v('monthlyFees'),finalPayment:v('finalPayment'),confirmedAssumptions:el('confirmedAssumptions').checked};}
  function render(result){latest=result;var headline=result.directlyComparable?(result.winnerIndex===null?cfg.equal:cfg.winner.replace('{name}',result.offers[result.winnerIndex].name)):cfg.review;el('resultTitle').textContent=headline;el('resultNote').textContent=result.directlyComparable?(result.winnerIndex===null?cfg.equalNote:cfg.savings.replace('{amount}',money(result.savings))):cfg.mismatch;el('resultRows').innerHTML='';result.offers.forEach(function(o){var tr=document.createElement('tr');var cells=[o.name,money(o.cashReceived),money(o.monthlyDue),money(o.totalInterest),money(o.totalFees),money(o.totalCashOut),money(o.borrowingCost),o.costPer100Received.toFixed(2)+'%'];cells.forEach(function(value,index){var cell=document.createElement(index===0?'th':'td');cell.textContent=value;if(index===0){cell.scope='row';var small=document.createElement('div');small.className='lc-method';small.textContent=(o.rateMethod==='flat'?cfg.flat:cfg.reducing)+' · '+o.termMonths+' '+cfg.months;cell.appendChild(small);}tr.appendChild(cell);});el('resultRows').appendChild(tr);});el('resultsCard').classList.add('on');el('resultsCard').focus();status(cfg.success,false);}
  function summary(){var lines=[cfg.pdfTitle,latest.directlyComparable?cfg.comparable:cfg.review];latest.offers.forEach(function(o){lines.push(o.name+': '+cfg.cash+' '+money(o.cashReceived)+'; '+cfg.monthlyDue+' '+money(o.monthlyDue)+'; '+cfg.totalPaid+' '+money(o.totalCashOut)+'; '+cfg.cost+' '+money(o.borrowingCost));});lines.push(cfg.disclaimer);return lines.join('\n');}
  addOffer({name:cfg.defaultA});addOffer({name:cfg.defaultB});renumber();
  el('addOfferBtn').addEventListener('click',function(){addOffer({name:cfg.offer+' '+(offers.children.length+1)});renumber();});
  form.addEventListener('submit',function(event){event.preventDefault();try{render(engine.compareOffers(Array.from(offers.children).map(readOffer)));}catch(error){latest=null;el('resultsCard').classList.remove('on');status(error.message,true);}});
  form.addEventListener('input',function(){if(latest)status(cfg.changed,false);});
  el('copyBtn').addEventListener('click',function(){if(!latest)return;navigator.clipboard.writeText(summary()).then(function(){status(cfg.copied,false);}).catch(function(){status(cfg.copyError,true);});});
  el('shareBtn').addEventListener('click',function(){var payload={title:cfg.shareTitle,url:cfg.canonical};if(navigator.share)navigator.share(payload).then(function(){status(cfg.linkShared,false);}).catch(function(){status(cfg.shareError,true);});else navigator.clipboard.writeText(cfg.canonical).then(function(){status(cfg.linkCopied,false);}).catch(function(){status(cfg.shareError,true);});});
  el('pdfBtn').addEventListener('click',function(){if(!latest)return;try{var J=window.jspdf&&window.jspdf.jsPDF;if(!J)throw new Error('pdf');var doc=new J({unit:'mm',format:'a4'}),y=18;doc.setProperties({title:cfg.pdfTitle,creator:'AfroTools'});doc.setFillColor(13,47,69);doc.rect(0,0,210,36,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(18);doc.text('AfroTools',16,15);doc.setFontSize(14);doc.text(cfg.pdfTitle,16,26);y=48;doc.setTextColor(19,35,57);doc.setFontSize(10);doc.setFont('helvetica','bold');doc.text(latest.directlyComparable?cfg.comparable:cfg.review,16,y);y+=10;doc.setFont('helvetica','normal');latest.offers.forEach(function(o){doc.setFillColor(241,246,249);doc.roundedRect(16,y,178,48,2,2,'F');doc.setFont('helvetica','bold');doc.text(o.name,21,y+8);doc.setFont('helvetica','normal');var rows=[[cfg.amount,pdfMoney(o.amount)],[cfg.method,o.rateMethod==='flat'?cfg.flat:cfg.reducing],[cfg.monthlyDue,pdfMoney(o.monthlyDue)],[cfg.totalPaid,pdfMoney(o.totalCashOut)],[cfg.cost,pdfMoney(o.borrowingCost)]];rows.forEach(function(row,i){doc.text(row[0]+': '+row[1],21,y+17+i*6);});y+=55;if(y>240){doc.addPage();y=18;}});doc.setFontSize(8);doc.setTextColor(83,101,116);doc.text(doc.splitTextToSize(cfg.disclaimer,178),16,y+4);doc.text(cfg.sourceNote,16,y+18);var blob=doc.output('blob'),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=cfg.pdfFilename;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);window.dispatchEvent(new CustomEvent('afro-pdf-generated',{detail:{blob:blob,fileName:cfg.pdfFilename,toolSlug:'loan-compare'}}));status(cfg.pdfReady,false);}catch(_){status(cfg.pdfError,true);}});
})();

(function(){
  'use strict';
  var root=document.querySelector('[data-mf-tool]');
  if(!root)return;
  var locale=root.getAttribute('data-locale')||'en';
  var copy={
    en:{required:'Complete every required field with values from the written offer.',proceeds:'Fees withheld from proceeds must be lower than the requested amount.',extreme:'These values produce an unbounded result. Check the rate, fee and repayment count.',calculated:'Estimate updated.',copied:'Summary copied.',downloaded:'Download created.',pdfError:'PDF export is unavailable. Use print instead.',period:'Payment',opening:'Opening balance',interest:'Interest',principal:'Principal',charge:'Other charge',closing:'Closing balance',estimate:'Microfinance offer estimate'},
    fr:{required:"Renseignez tous les champs obligatoires avec les valeurs de l'offre écrite.",proceeds:'Les frais retenus doivent être inférieurs au montant demandé.',extreme:'Ces valeurs produisent un résultat non borné. Vérifiez le taux, les frais et le nombre d’échéances.',calculated:'Estimation mise à jour.',copied:'Résumé copié.',downloaded:'Téléchargement créé.',pdfError:"L'export PDF est indisponible. Utilisez l'impression.",period:'Échéance',opening:"Solde d'ouverture",interest:'Intérêt',principal:'Principal',charge:'Autre charge',closing:'Solde final',estimate:"Estimation de l'offre de microfinance"},
    sw:{required:'Jaza sehemu zote za lazima kwa kutumia masharti ya maandishi.',proceeds:'Ada zinazokatwa lazima ziwe chini ya kiasi ulichoomba.',extreme:'Thamani hizi zinaleta matokeo yasiyo na kikomo. Kagua kiwango, ada na idadi ya malipo.',calculated:'Makadirio yamesasishwa.',copied:'Muhtasari umenakiliwa.',downloaded:'Faili imetengenezwa.',pdfError:'PDF haipatikani. Tumia chapa badala yake.',period:'Malipo',opening:'Salio la mwanzo',interest:'Riba',principal:'Mtaji',charge:'Gharama nyingine',closing:'Salio la mwisho',estimate:'Makadirio ya ofa ya microfinance'}
  }[locale]||null;
  var $=function(id){return document.getElementById(id);};
  var form=$('mf-form'),error=$('mf-error'),status=$('mf-status'),last=null;
  function num(id){return Number($(id).value);}
  function value(id){return $(id).value.trim();}
  function frequency(){
    var ppy=Number($('mf-frequency').value);
    var label=$('mf-frequency').selectedOptions[0].textContent;
    return {ppy:ppy,label:label};
  }
  function money(n,currency){
    var language=locale==='sw'?'sw-TZ':locale==='fr'?'fr-FR':'en';
    try{return new Intl.NumberFormat(language,{style:'currency',currency:currency,currencyDisplay:'code',maximumFractionDigits:2}).format(n);}
    catch(e){return new Intl.NumberFormat(language,{maximumFractionDigits:2}).format(n)+' '+currency;}
  }
  function percent(n){return new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(n)+'%';}
  function validate(){
    var controls=form.querySelectorAll('[required]');
    for(var i=0;i<controls.length;i++)if(!controls[i].checkValidity()||controls[i].value==='')return copy.required;
    if(num('mf-withheld')>=num('mf-principal'))return copy.proceeds;
    return '';
  }
  function calculate(event){
    if(event)event.preventDefault();
    var message=validate();
    if(message){error.textContent=message;error.dataset.show='true';form.reportValidity();return null;}
    error.dataset.show='false';
    var freq=frequency(),result;
    try{
      result=window.MicrofinanceOfferEngine.calculate({
        currencyUnit:value('mf-currency'),principal:num('mf-principal'),quotedRatePct:num('mf-rate'),
        rateBasis:$('mf-rate-basis').value,method:$('mf-method').value,periodsPerYear:freq.ppy,
        paymentCount:num('mf-count'),withheldFees:num('mf-withheld'),financedFees:num('mf-financed'),
        recurringCharge:num('mf-recurring'),financedFeesBearInterest:$('mf-interest-base').value==='all'
      });
    }catch(engineError){
      var code=String(engineError&&engineError.message||'');
      error.textContent=code==='NET_PROCEEDS_REQUIRED'?copy.proceeds:code==='UNBOUNDED_RESULT'?copy.extreme:copy.required;
      error.dataset.show='true';return null;
    }
    last={
      currency:result.currencyUnit,method:result.method,methodLabel:$('mf-method').selectedOptions[0].textContent,
      frequency:freq.label,ppy:result.periodsPerYear,rateBasis:$('mf-rate-basis').selectedOptions[0].textContent,
      quotedRate:result.quotedRatePct,annual:result.normalizedNominalAnnualRatePct,count:result.paymentCount,
      principal:result.principal,financed:result.financedFees,withheld:result.withheldFees,
      recurring:result.recurringCharge,feesBearInterest:result.financedFeesBearInterest,
      interestBaseLabel:$('mf-interest-base').selectedOptions[0].textContent,openingBalance:result.openingBalance,
      netProceeds:result.netProceeds,payment:result.paymentPerPeriod,totalRepayment:result.totalRepayment,
      cost:result.totalBorrowingCost,ear:result.effectiveAnnualCostRatePct,rows:result.rows,note:value('mf-note')
    };
    render(last);status.textContent=copy.calculated;return last;
  }
  function render(data){
    $('mf-payment').textContent=money(data.payment,data.currency);
    $('mf-net').textContent=money(data.netProceeds,data.currency);
    $('mf-opening').textContent=money(data.openingBalance,data.currency);
    $('mf-total').textContent=money(data.totalRepayment,data.currency);
    $('mf-cost').textContent=money(data.cost,data.currency);
    $('mf-ear').textContent=data.ear===null?'—':percent(data.ear);
    $('mf-stated').textContent=percent(data.annual);
    $('mf-interest-base-result').textContent=data.interestBaseLabel;
    var body=$('mf-schedule');body.textContent='';
    data.rows.forEach(function(row){
      var tr=document.createElement('tr');
      [row.period,money(row.opening,data.currency),money(row.interest,data.currency),money(row.principal,data.currency),money(row.charge,data.currency),money(row.payment,data.currency),money(row.closing,data.currency)].forEach(function(cell){
        var td=document.createElement('td');td.textContent=cell;tr.appendChild(td);
      });
      body.appendChild(tr);
    });
    $('mf-results').removeAttribute('aria-busy');
  }
  function summary(data){
    return [copy.estimate,data.currency+'; '+data.methodLabel+'; '+data.frequency,'Requested amount: '+money(data.principal,data.currency),'Net proceeds: '+money(data.netProceeds,data.currency),'Opening balance: '+money(data.openingBalance,data.currency),'Quoted rate: '+percent(data.quotedRate)+' ('+data.rateBasis+')','Normalized nominal annual rate: '+percent(data.annual),'Interest base: '+data.interestBaseLabel,'Payment per period: '+money(data.payment,data.currency),'Total repayments: '+money(data.totalRepayment,data.currency),'Total borrowing cost: '+money(data.cost,data.currency),'Estimated effective annual cost rate: '+(data.ear===null?'N/A':percent(data.ear)),data.note?'Offer note: '+data.note:'','Planning estimate based on equal end-of-period payments and only the entered written-offer terms. This is not a regulated APR. Confirm dates, day-count convention, mandatory costs and the regulated disclosure before signing.'].filter(Boolean).join('\n');
  }
  function safeCell(input){
    var text=String(input==null?'':input);
    if(/^[\t\r ]*[=+\-@]/.test(text))text="'"+text;
    return '"'+text.replace(/"/g,'""')+'"';
  }
  function download(name,type,content){
    var blob=new Blob([content],{type:type}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);status.textContent=copy.downloaded;
  }
  function ensure(){return last||calculate();}
  $('mf-copy').addEventListener('click',function(){
    var data=ensure();if(!data)return;
    var text=summary(data);
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(function(){status.textContent=copy.copied;});
    else{var area=document.createElement('textarea');area.value=text;document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();status.textContent=copy.copied;}
  });
  $('mf-json').addEventListener('click',function(){var data=ensure();if(data)download('microfinance-offer.json','application/json;charset=utf-8',JSON.stringify(data,null,2));});
  $('mf-csv').addEventListener('click',function(){
    var data=ensure();if(!data)return;
    var rows=[[copy.period,copy.opening,copy.interest,copy.principal,copy.charge,'Total payment',copy.closing]];
    data.rows.forEach(function(r){rows.push([r.period,r.opening.toFixed(2),r.interest.toFixed(2),r.principal.toFixed(2),r.charge.toFixed(2),r.payment.toFixed(2),r.closing.toFixed(2)]);});
    download('microfinance-schedule.csv','text/csv;charset=utf-8','\uFEFF'+rows.map(function(row){return row.map(safeCell).join(',');}).join('\r\n'));
  });
  $('mf-pdf').addEventListener('click',function(){
    var data=ensure();if(!data)return;
    try{
      var jsPDF=window.jspdf&&window.jspdf.jsPDF;if(!jsPDF)throw new Error('jsPDF missing');
      var doc=new jsPDF(),lines=doc.splitTextToSize(summary(data),175);
      doc.setFontSize(17);doc.text(copy.estimate,18,20);doc.setFontSize(10);doc.text(lines,18,30);
      var y=30+lines.length*5+7;doc.setFontSize(8);
      data.rows.slice(0,28).forEach(function(r){doc.text([String(r.period),money(r.payment,data.currency),money(r.interest,data.currency),money(r.closing,data.currency)].join('   '),18,y);y+=5;});
      doc.save('microfinance-offer.pdf');status.textContent=copy.downloaded;
    }catch(e){status.textContent=copy.pdfError;}
  });
  form.addEventListener('submit',calculate);
  function clearResults(){
    last=null;status.textContent='';
    ['mf-payment','mf-net','mf-opening','mf-total','mf-cost','mf-ear','mf-stated','mf-interest-base-result'].forEach(function(id){$(id).textContent='—';});
    $('mf-schedule').textContent='';$('mf-results').setAttribute('aria-busy','true');
  }
  form.addEventListener('input',clearResults);
  var theme=$('mf-theme');
  function effectiveTheme(){
    var explicit=document.documentElement.getAttribute('data-theme');
    return explicit||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  }
  function syncTheme(){document.body.dataset.mfTheme=effectiveTheme();theme.setAttribute('aria-pressed',String(effectiveTheme()==='dark'));}
  theme.addEventListener('click',function(){
    var next=effectiveTheme()==='dark'?'light':'dark';
    document.documentElement.setAttribute('data-theme',next);
    try{localStorage.setItem('afrotools-theme',next);}catch(e){}
    syncTheme();
  });
  new MutationObserver(syncTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  syncTheme();
}());

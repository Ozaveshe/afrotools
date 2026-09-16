(function(){
  "use strict";

  var root=document.querySelector("[data-remittance-comparator]");
  if(!root)return;
  var locale=root.dataset.locale==="fr"?"fr":(root.dataset.locale==="sw"?"sw":"en");
  var words={
    en:{
      required:"Complete every enabled quote with valid values from the receipt or quote screen you checked.",
      future:"A checked-at time cannot be in the future.",
      expiry:"Expiry must be later than the checked-at time.",
      fee:"A stated fee cannot exceed the total debit.",
      updated:"Comparison updated locally.",
      copied:"Summary copied.",
      downloaded:"Download created locally.",
      pdfError:"PDF export is unavailable on this device.",
      title:"Remittance quote comparison",
      highest:"Highest recipient amount among eligible comparable entries",
      noGroup:"No eligible comparable set",
      noGroupDetail:"At least two non-expired entries must have exactly the same send currency, receive currency and total debit.",
      totalDebit:"Total debit",
      recipient:"Recipient amount",
      effective:"Recipient units per debit unit",
      fee:"Stated fee",
      checked:"Checked",
      expires:"Expires",
      unknownExpiry:"Expiry not entered — recheck before acting",
      expired:"Expired — excluded from comparison",
      activeExpiry:"Not expired at comparison time",
      payout:"Payout",
      delivery:"Stated delivery",
      minutes:"minutes",
      difference:"Difference from highest eligible recipient amount",
      notComparable:"Not in an eligible comparable set",
      boundary:"This is arithmetic from user-entered quote receipts. Highest recipient amount is not a provider recommendation. Recheck the executable quote, total debit, payout route, identity checks, limits, settlement risk and expiry before acting."
    },
    sw:{
      required:"Jaza kila nukuu inayotumika kwa thamani halali kutoka risiti au skrini ya nukuu uliyokagua.", future:"Muda wa kukagua hauwezi kuwa wa baadaye.", expiry:"Muda wa kuisha lazima uwe baada ya muda wa kukagua.", fee:"Ada iliyotajwa haiwezi kuzidi jumla ya kiasi kinachotoka.", updated:"Ulinganisho umesasishwa ndani ya kifaa.", copied:"Muhtasari umenakiliwa.", downloaded:"Upakuaji umetengenezwa ndani ya kifaa.", pdfError:"Upakuaji wa PDF haupatikani kwenye kifaa hiki.", title:"Ulinganisho wa nukuu za kutuma fedha", highest:"Kiasi kikubwa zaidi cha mpokeaji kati ya nukuu halali zinazolinganishika", noGroup:"Hakuna seti halali inayolinganishika", noGroupDetail:"Angalau nukuu mbili ambazo hazijaisha lazima ziwe na sarafu ileile ya kutuma, sarafu ileile ya kupokea na jumla ileile ya kiasi kinachotoka.", totalDebit:"Jumla inayotoka", recipient:"Kiasi cha mpokeaji", effective:"Vipimo vinavyopokelewa kwa kila kipimo kinachotoka", fee:"Ada iliyotajwa", checked:"Ilikaguliwa", expires:"Inaisha", unknownExpiry:"Muda wa kuisha haujaingizwa — kagua tena kabla ya hatua", expired:"Imeisha — imeondolewa kwenye ulinganisho", activeExpiry:"Haijaisha wakati wa ulinganisho", payout:"Njia ya malipo", delivery:"Muda wa kufika uliotajwa", minutes:"dakika", difference:"Tofauti na kiasi kikubwa zaidi halali cha mpokeaji", notComparable:"Haiko katika seti halali inayolinganishika", boundary:"Hii ni hesabu kutoka nukuu ulizoingiza mwenyewe. Kiasi kikubwa zaidi cha mpokeaji si pendekezo la mtoa huduma. Kagua tena nukuu inayotekelezeka, jumla inayotoka, njia ya malipo, ukaguzi wa utambulisho, vikomo, hatari ya malipo na muda wa kuisha kabla ya hatua."
    },
    fr:{
      required:"Renseignez chaque devis activé avec des valeurs valides provenant du reçu ou de l’écran de devis vérifié.",
      future:"L’heure de vérification ne peut pas être dans le futur.",
      expiry:"L’expiration doit être postérieure à l’heure de vérification.",
      fee:"Les frais indiqués ne peuvent pas dépasser le débit total.",
      updated:"Comparaison mise à jour localement.",
      copied:"Résumé copié.",
      downloaded:"Téléchargement créé localement.",
      pdfError:"L’export PDF est indisponible sur cet appareil.",
      title:"Comparaison de devis de transfert",
      highest:"Montant reçu le plus élevé parmi les entrées comparables admissibles",
      noGroup:"Aucun ensemble comparable admissible",
      noGroupDetail:"Au moins deux entrées non expirées doivent avoir exactement la même devise d’envoi, la même devise de réception et le même débit total.",
      totalDebit:"Débit total",
      recipient:"Montant reçu",
      effective:"Unités reçues par unité débitée",
      fee:"Frais indiqués",
      checked:"Vérifié",
      expires:"Expire",
      unknownExpiry:"Expiration non saisie — revérifiez avant d’agir",
      expired:"Expiré — exclu de la comparaison",
      activeExpiry:"Non expiré au moment de la comparaison",
      payout:"Versement",
      delivery:"Délai indiqué",
      minutes:"minutes",
      difference:"Écart avec le montant reçu admissible le plus élevé",
      notComparable:"Hors d’un ensemble comparable admissible",
      boundary:"Il s’agit d’un calcul à partir de reçus saisis par l’utilisateur. Le montant reçu le plus élevé ne constitue pas une recommandation. Revérifiez le devis exécutable, le débit total, le mode de versement, les contrôles d’identité, les limites, le risque de règlement et l’expiration."
    }
  }[locale];
  var payoutLabels=locale==="sw"?{"":"Haijaingizwa","bank":"Akaunti ya benki","mobile-wallet":"Pochi ya simu","cash":"Kuchukua fedha taslimu","crypto-wallet":"Pochi ya crypto","other":"Nyingine"}:{
    en:{"":"Not entered","bank":"Bank account","mobile-wallet":"Mobile wallet","cash":"Cash pickup","crypto-wallet":"Crypto wallet","other":"Other"},
    fr:{"":"Non saisi","bank":"Compte bancaire","mobile-wallet":"Portefeuille mobile","cash":"Retrait en espèces","crypto-wallet":"Portefeuille crypto","other":"Autre"}
  }[locale];
  var $=function(id){return document.getElementById(id);};
  var form=$("rm-form");
  var error=$("rm-error");
  var status=$("rm-status");
  var last=null;

  Object.assign(words,{
    en:{reset:'Reset',pdfUnsupported:'Some characters are not supported by this PDF font. Download JSON or CSV to preserve all text.',sendCurrency:'Send currency',receiveCurrency:'Receive currency',expiryState:'Expiry state',enough:'Eligible comparable',top:'Highest recipient in comparable set',sendCountry:'Sending country',receiveCountry:'Receiving country',generated:'Compared at',forDebit:'for',copyError:'Could not copy. Download JSON instead.',feeError:'Stated fee cannot exceed total debit.',countryError:'Enter a recognized country name or two-letter code.',corridor:'Only quotes for the same countries, currencies and total debit are ranked. Payout methods and delivery times can differ; services are not necessarily equivalent.',quote:'Quote',eligible:'Eligible comparable',yes:'Yes',no:'No'},
    fr:{reset:'Réinitialiser',pdfUnsupported:'Certains caractères ne sont pas pris en charge par la police PDF. Téléchargez le JSON ou le CSV pour conserver tout le texte.',sendCurrency:'Devise d’envoi',receiveCurrency:'Devise de réception',expiryState:'État d’expiration',enough:'Comparable admissible',top:'Montant reçu maximal du groupe',sendCountry:'Pays d’envoi',receiveCountry:'Pays de réception',generated:'Comparé le',forDebit:'pour',copyError:'Impossible de copier. Téléchargez le JSON.',feeError:'Les frais indiqués ne peuvent pas dépasser le débit total.',countryError:'Saisissez un pays reconnu ou son code à deux lettres.',corridor:'Seuls les devis pour les mêmes pays, devises et débit total sont classés. Les modes et délais de réception peuvent différer : les services ne sont pas nécessairement équivalents.',quote:'Devis',eligible:'Comparable admissible',yes:'Oui',no:'Non'},
    sw:{reset:'Anza upya',pdfUnsupported:'Baadhi ya herufi haziauniwi na fonti hii ya PDF. Pakua JSON au CSV ili kuhifadhi maandishi yote.',sendCurrency:'Sarafu ya kutuma',receiveCurrency:'Sarafu ya kupokea',expiryState:'Hali ya muda',enough:'Halali kulinganishwa',top:'Kiasi kikubwa zaidi katika kundi',sendCountry:'Nchi ya kutuma',receiveCountry:'Nchi ya kupokea',generated:'Ililinganishwa',forDebit:'kwa',copyError:'Imeshindikana kunakili. Pakua JSON badala yake.',feeError:'Ada iliyotajwa haiwezi kuzidi jumla inayotoka.',countryError:'Weka jina la nchi linalotambulika au msimbo wake wa herufi mbili.',corridor:'Nukuu hupangwa tu kwa nchi, sarafu na jumla inayotoka zinazofanana. Njia na muda wa kupokea vinaweza kutofautiana; huduma si lazima ziwe sawa.',quote:'Nukuu',eligible:'Halali kulinganishwa',yes:'Ndiyo',no:'Hapana'}
  }[locale]);
  words.noGroupDetail+=' '+words.corridor;
  ['a','b','c'].forEach(function(letter){var host=$('rm-'+letter+'-label').closest('.rm-fields');['sendCountry','receiveCountry'].forEach(function(key){var label=document.createElement('label');label.className='rm-field';label.htmlFor='rm-'+letter+'-'+key;var text=document.createElement('span');text.textContent=words[key];var input=document.createElement('input');input.id=label.htmlFor;input.required=true;input.maxLength=80;input.disabled=letter==='c';label.append(text,input);host.append(label);});});
  var reset=document.createElement('button');reset.type='reset';reset.className='rm-btn rm-btn-secondary';reset.textContent=words.reset;form.querySelector('.rm-actions').append(reset);
  var help=document.createElement('p');help.className='rm-privacy';help.textContent=words.corridor;form.prepend(help);
  var errorFields={SEND_COUNTRY_REQUIRED:'sendCountry',RECEIVE_COUNTRY_REQUIRED:'receiveCountry',OBSERVED_AT_REQUIRED:'observed',OBSERVED_AT_FUTURE:'observed',INVALID_EXPIRY:'expires',EXPIRY_BEFORE_OBSERVED:'expires',TOTAL_DEBIT_REQUIRED:'debit',RECIPIENT_AMOUNT_REQUIRED:'recipient',INVALID_STATED_FEE:'fee',FEE_EXCEEDS_DEBIT:'fee',INVALID_DELIVERY:'delivery',LABEL_REQUIRED:'label',SEND_CURRENCY_REQUIRED:'send',RECEIVE_CURRENCY_REQUIRED:'receive',INVALID_PAYOUT_METHOD:'payout'};
  function clearFieldErrors(){form.querySelectorAll('[aria-invalid="true"]').forEach(function(field){field.removeAttribute('aria-invalid');var ids=(field.getAttribute('aria-describedby')||'').split(' ').filter(function(id){return id&&id!=='rm-error';});if(ids.length)field.setAttribute('aria-describedby',ids.join(' '));else field.removeAttribute('aria-describedby');});}
  function fail(field,message){clear();error.textContent=(field?form.querySelector('label[for="'+field.id+'"]').textContent+': ':'')+message;error.dataset.show='true';if(field){field.setAttribute('aria-invalid','true');field.setAttribute('aria-describedby',((field.getAttribute('aria-describedby')||'')+' rm-error').trim());field.focus();}return null;}
  function value(id){return $(id).value.trim();}
  function numberValue(id){return $(id).value;}
  function readQuote(letter){
    return {
      sendCountry:$("rm-"+letter+"-sendCountry").value,receiveCountry:$("rm-"+letter+"-receiveCountry").value,
      label:value("rm-"+letter+"-label"),
      sendCurrency:value("rm-"+letter+"-send"),
      totalDebit:numberValue("rm-"+letter+"-debit"),
      receiveCurrency:value("rm-"+letter+"-receive"),
      recipientAmount:numberValue("rm-"+letter+"-recipient"),
      statedFee:numberValue("rm-"+letter+"-fee"),
      payoutMethod:value("rm-"+letter+"-payout"),
      deliveryMinutes:numberValue("rm-"+letter+"-delivery"),
      observedAt:value("rm-"+letter+"-observed"),
      expiresAt:value("rm-"+letter+"-expires")
    };
  }
  function formatter(maximum){
    return new Intl.NumberFormat(locale==="fr"?"fr-FR":(locale==="sw"?"sw-KE":"en"),{maximumFractionDigits:maximum==null?6:maximum});
  }
  function amount(value,unit){return formatter().format(value)+" "+unit;}
  function localDate(value){
    return new Intl.DateTimeFormat(locale==="fr"?"fr-FR":(locale==="sw"?"sw-KE":"en"),{dateStyle:"medium",timeStyle:"short"}).format(new Date(value));
  }
  function errorMessage(code){
    if(code==="OBSERVED_AT_FUTURE")return words.future;
    if(code==="EXPIRY_BEFORE_OBSERVED")return words.expiry;
    if(code==="FEE_EXCEEDS_DEBIT")return words.feeError;
    if(code==="SEND_COUNTRY_REQUIRED"||code==="RECEIVE_COUNTRY_REQUIRED")return words.countryError;
    return words.required;
  }
  function calculate(event){
    if(event)event.preventDefault();
    clearFieldErrors();var invalid=Array.from(form.elements).find(function(field){return field.willValidate&&!field.validity.valid;});if(invalid)return fail(invalid,words.required);
    var quotes=[readQuote("a"),readQuote("b")];
    if($("rm-third").checked)quotes.push(readQuote("c"));
    var asOf=new Date().toISOString();
    for(var i=0;i<quotes.length;i++){try{window.RemittanceQuoteComparatorEngine.calculate({requireCorridor:true,asOf:asOf,quotes:[quotes[i],quotes[i]]});}catch(exception){return fail($('rm-'+['a','b','c'][i]+'-'+(errorFields[exception.message]||'label')),errorMessage(exception.message));}}
    try{
      last={result:window.RemittanceQuoteComparatorEngine.calculate({requireCorridor:true,asOf:asOf,quotes:quotes})};
    }catch(exception){
      return fail(null,errorMessage(String(exception.message)));
    }
    error.dataset.show="false";
    render(last.result);
    status.textContent=words.updated;
    return last;
  }
  function metric(label,text){
    var wrap=document.createElement("div");
    wrap.className="rm-metric";
    var name=document.createElement("span");
    name.textContent=label;
    var result=document.createElement("strong");
    result.textContent=text;
    wrap.append(name,result);
    return wrap;
  }
  function expiryText(row){
    if(row.expiryState==="expired")return words.expired;
    if(row.expiryState==="unknown")return words.unknownExpiry;
    return words.activeExpiry+": "+localDate(row.expiresAt);
  }
  function render(result){
    var list=$("rm-result-list");
    list.textContent="";
    var primaryLabel=$("rm-primary-label");
    var primaryValue=$("rm-primary-value");
    var primaryDetail=$("rm-primary-detail");
    if(result.hasEligibleComparison){
      primaryLabel.textContent=words.highest;
      primaryValue.textContent=result.groups.map(function(group){
        return amount(group.highestRecipientAmount,group.receiveCurrency);
      }).join(" · ");
      primaryDetail.textContent="";
    }else{
      primaryLabel.textContent=words.noGroup;
      primaryValue.textContent="—";
      primaryDetail.textContent=words.noGroupDetail;
    }
    result.quotes.forEach(function(row){
      var card=document.createElement("article");
      card.className="rm-result";
      card.dataset.highest=String(row.highestAmongEligibleComparable);
      card.dataset.expiry=row.expiryState;
      var head=document.createElement("div");
      head.className="rm-result-head";
      var label=document.createElement("strong");
      label.textContent=row.label;
      head.appendChild(label);
      if(row.highestAmongEligibleComparable){
        var badge=document.createElement("span");
        badge.className="rm-observation";
        badge.textContent=words.highest;
        head.appendChild(badge);
      }
      var metrics=document.createElement("div");
      metrics.className="rm-metrics";
      metrics.append(
        metric(words.sendCountry,row.sendCountry),metric(words.receiveCountry,row.receiveCountry),        metric(words.totalDebit,amount(row.totalDebit,row.sendCurrency)),
        metric(words.recipient,amount(row.recipientAmount,row.receiveCurrency)),
        metric(words.effective,formatter(8).format(row.effectiveRate)+" "+row.receiveCurrency+"/"+row.sendCurrency),
        metric(words.fee,row.statedFee===null?"—":amount(row.statedFee,row.sendCurrency)),
        metric(words.difference,row.differenceFromHighestRecipient===null?words.notComparable:amount(row.differenceFromHighestRecipient,row.receiveCurrency)),
        metric(words.payout,payoutLabels[row.payoutMethod]||payoutLabels.other)
      );
      var meta=document.createElement("p");
      meta.className="rm-meta";
      meta.textContent=words.checked+": "+localDate(row.observedAt)+" · "+expiryText(row)+(row.deliveryMinutes===null?"":" · "+words.delivery+": "+formatter().format(row.deliveryMinutes)+" "+words.minutes);
      card.append(head,metrics,meta);
      list.appendChild(card);
    });
    $("rm-results").removeAttribute("aria-busy");
  }
  function summary(data){
    var result=data.result;
    var lines=[words.title,words.generated+": "+result.asOf,result.hasEligibleComparison?words.highest+": "+result.groups.map(function(group){return amount(group.highestRecipientAmount,group.receiveCurrency)+" "+words.forDebit+" "+amount(group.totalDebit,group.sendCurrency);}).join("; "):words.noGroup+": "+words.noGroupDetail];
    result.quotes.forEach(function(row){
      lines.push(
        "",
        row.label,
        words.sendCountry+": "+row.sendCountry+" ("+row.sendCountryCode+")",words.receiveCountry+": "+row.receiveCountry+" ("+row.receiveCountryCode+")",
        words.totalDebit+": "+amount(row.totalDebit,row.sendCurrency),
        words.recipient+": "+amount(row.recipientAmount,row.receiveCurrency),
        words.effective+": "+formatter(8).format(row.effectiveRate)+" "+row.receiveCurrency+"/"+row.sendCurrency,
        words.fee+": "+(row.statedFee===null?"—":amount(row.statedFee,row.sendCurrency)),
        words.checked+": "+row.observedAt,
        words.expires+": "+(row.expiresAt||words.unknownExpiry),
        words.payout+": "+(payoutLabels[row.payoutMethod]||payoutLabels.other),
        words.delivery+": "+(row.deliveryMinutes===null?"—":formatter().format(row.deliveryMinutes)+" "+words.minutes),
        words.difference+": "+(row.differenceFromHighestRecipient===null?words.notComparable:amount(row.differenceFromHighestRecipient,row.receiveCurrency))
      );
    });
    lines.push("",words.boundary);
    return lines.join("\n");
  }
  function csvCell(value){
    var text=String(value==null?"":value);
    if(/^[\t\r ]*[=+\-@]/.test(text))text="'"+text;
    return '"'+text.replace(/"/g,'""')+'"';
  }
  function download(name,type,content){
    var blob=new Blob([content],{type:type});
    var url=URL.createObjectURL(blob);
    var anchor=document.createElement("a");
    anchor.href=url;
    anchor.download=name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},1000);
    status.textContent=words.downloaded;
  }
  function ensure(){return calculate();}
  $("rm-copy").addEventListener("click",function(){
    var data=ensure();
    if(!data)return;
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(summary(data)).then(function(){if(last===data)status.textContent=words.copied;},function(){if(last===data)status.textContent=words.copyError;});
    }else status.textContent=words.copyError;
  });
  $("rm-json").addEventListener("click",function(){
    var data=ensure();
    if(data)download("remittance-quote-comparison.json","application/json;charset=utf-8",JSON.stringify(data.result,null,2));
  });
  $("rm-csv").addEventListener("click",function(){
    var data=ensure();
    if(!data)return;
    var result=data.result;
    var rows=[[words.quote,words.sendCountry,words.receiveCountry,words.sendCurrency,words.totalDebit,words.receiveCurrency,words.recipient,words.fee,words.payout,words.delivery+' ('+words.minutes+')',words.checked,words.expires,words.expiryState,words.enough,words.top,words.difference,words.effective]];
    result.quotes.forEach(function(row){
      rows.push([row.label,row.sendCountry,row.receiveCountry,row.sendCurrency,row.totalDebit,row.receiveCurrency,row.recipientAmount,row.statedFee,payoutLabels[row.payoutMethod]||payoutLabels.other,row.deliveryMinutes,row.observedAt,row.expiresAt,expiryText(row),row.comparable?words.yes:words.no,row.highestAmongEligibleComparable?words.yes:words.no,row.differenceFromHighestRecipient,row.effectiveRate]);
    });
    download("remittance-quote-comparison.csv","text/csv;charset=utf-8","\uFEFF"+rows.map(function(row){return row.map(csvCell).join(",");}).join("\r\n"));
  });
  var fontPromise;
  function pdfFont(){if(!fontPromise)fontPromise=fetch('/assets/fonts/noto-sans/NotoSans-Regular.ttf',{credentials:'omit',referrerPolicy:'no-referrer'}).then(function(response){if(!response.ok)throw new Error('font');return response.arrayBuffer();}).then(function(buffer){var bytes=new Uint8Array(buffer),binary='';for(var i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode.apply(null,bytes.subarray(i,i+8192));return btoa(binary);}).catch(function(error){fontPromise=null;throw error;});return fontPromise;}
  $("rm-pdf").addEventListener("click",async function(){
    var data=ensure();if(!data)return;
    try{
      var PDF=window.jspdf&&window.jspdf.jsPDF;if(!PDF)throw new Error('missing');
      var font=await pdfFont();if(last!==data)return;data=ensure();if(!data)return;
      var documentPdf=new PDF({putOnlyUsedFonts:true,compress:true});
      documentPdf.addFileToVFS('NotoSans-Regular.ttf',font);documentPdf.addFont('NotoSans-Regular.ttf','RemittanceNoto','normal');documentPdf.setFont('RemittanceNoto','normal');
      var text=summary(data).normalize('NFC'),metadata=documentPdf.getFont().metadata;
      for(var character of text){if(character==='\n')continue;if(!metadata.characterToGlyph(character.codePointAt(0)))throw new Error('unsupported-glyph');}
      var y=20,bottom=documentPdf.internal.pageSize.getHeight()-18;documentPdf.setFontSize(10);
      text.split('\n').forEach(function(line){var wrapped=documentPdf.splitTextToSize(line,174);wrapped.forEach(function(part){if(y+5>bottom){documentPdf.addPage();y=20;}documentPdf.text(part,18,y);y+=5;});});
      documentPdf.setProperties({title:words.title,creator:'AfroTools'});documentPdf.save('remittance-quote-comparison.pdf');status.textContent=words.downloaded;
    }catch(exception){if(last===data)status.textContent=exception.message==='unsupported-glyph'?words.pdfUnsupported:words.pdfError;}
  });
  function clear(){
    last=null;clearFieldErrors();error.textContent="";error.dataset.show="false";
    status.textContent="";
    $("rm-primary-label").textContent="";
    $("rm-primary-value").textContent="—";
    $("rm-primary-detail").textContent="";
    $("rm-result-list").textContent="";
    $("rm-results").removeAttribute("aria-busy");
  }
  $("rm-third").addEventListener("change",function(){
    var enabled=this.checked;
    var section=$("rm-quote-c");
    section.hidden=!enabled;
    section.querySelectorAll("input,select").forEach(function(control){
      control.disabled=!enabled;
      control.required=enabled&&control.dataset.optional!=="true";
    });
    clear();
  });
  form.addEventListener('reset',function(){setTimeout(function(){$('rm-third').checked=false;var section=$('rm-quote-c');section.hidden=true;section.querySelectorAll('input,select').forEach(function(control){control.disabled=true;});clear();},0);});
  form.addEventListener("submit",calculate);
  form.addEventListener("input",clear);
  form.addEventListener("change",function(event){if(event.target.id!=="rm-third")clear();});

  var theme=$("rm-theme");
  function effectiveTheme(){
    return document.documentElement.getAttribute("data-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");
  }
  function syncTheme(){
    document.body.dataset.remitTheme=effectiveTheme();
    theme.setAttribute("aria-pressed",String(effectiveTheme()==="dark"));
  }
  theme.addEventListener("click",function(){
    document.documentElement.setAttribute("data-theme",effectiveTheme()==="dark"?"light":"dark");
    syncTheme();
  });
  new MutationObserver(syncTheme).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
  syncTheme();
}());

(function(){
  "use strict";

  var root=document.querySelector("[data-remittance-comparator]");
  if(!root)return;
  var locale=root.dataset.locale==="fr"?"fr":"en";
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
  var payoutLabels={
    en:{"":"Not entered","bank":"Bank account","mobile-wallet":"Mobile wallet","cash":"Cash pickup","crypto-wallet":"Crypto wallet","other":"Other"},
    fr:{"":"Non saisi","bank":"Compte bancaire","mobile-wallet":"Portefeuille mobile","cash":"Retrait en espèces","crypto-wallet":"Portefeuille crypto","other":"Autre"}
  }[locale];
  var $=function(id){return document.getElementById(id);};
  var form=$("rm-form");
  var error=$("rm-error");
  var status=$("rm-status");
  var last=null;

  function value(id){return $(id).value.trim();}
  function numberValue(id){return $(id).value;}
  function readQuote(letter){
    return {
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
    return new Intl.NumberFormat(locale==="fr"?"fr-FR":"en",{maximumFractionDigits:maximum==null?6:maximum});
  }
  function amount(value,unit){return formatter().format(value)+" "+unit;}
  function localDate(value){
    return new Intl.DateTimeFormat(locale==="fr"?"fr-FR":"en",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value));
  }
  function errorMessage(code){
    if(code==="OBSERVED_AT_FUTURE")return words.future;
    if(code==="EXPIRY_BEFORE_OBSERVED")return words.expiry;
    if(code==="FEE_EXCEEDS_DEBIT")return words.fee;
    return words.required;
  }
  function calculate(event){
    if(event)event.preventDefault();
    if(!form.checkValidity()){
      error.textContent=words.required;
      error.dataset.show="true";
      form.reportValidity();
      return null;
    }
    var quotes=[readQuote("a"),readQuote("b")];
    if($("rm-third").checked)quotes.push(readQuote("c"));
    try{
      last={result:window.RemittanceQuoteComparatorEngine.calculate({asOf:new Date().toISOString(),quotes:quotes})};
    }catch(exception){
      error.textContent=errorMessage(String(exception.message));
      error.dataset.show="true";
      return null;
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
        metric(words.totalDebit,amount(row.totalDebit,row.sendCurrency)),
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
    var lines=[words.title,"Generated: "+result.asOf,result.hasEligibleComparison?words.highest+": "+result.groups.map(function(group){return amount(group.highestRecipientAmount,group.receiveCurrency)+" for "+amount(group.totalDebit,group.sendCurrency);}).join("; "):words.noGroup+": "+words.noGroupDetail];
    result.quotes.forEach(function(row){
      lines.push(
        "",
        row.label,
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
  function ensure(){return last||calculate();}
  $("rm-copy").addEventListener("click",function(){
    var data=ensure();
    if(!data)return;
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(summary(data)).then(function(){status.textContent=words.copied;});
    }
  });
  $("rm-json").addEventListener("click",function(){
    var data=ensure();
    if(data)download("remittance-quote-comparison.json","application/json;charset=utf-8",JSON.stringify(data.result,null,2));
  });
  $("rm-csv").addEventListener("click",function(){
    var data=ensure();
    if(!data)return;
    var result=data.result;
    var rows=[["Quote label","Send currency","Total debit","Receive currency","Recipient amount","Stated fee","Payout method","Delivery minutes","Checked at","Expires at","Expiry state","Eligible comparable","Highest recipient among eligible comparable","Difference from highest recipient","Effective rate"]];
    result.quotes.forEach(function(row){
      rows.push([row.label,row.sendCurrency,row.totalDebit,row.receiveCurrency,row.recipientAmount,row.statedFee,row.payoutMethod,row.deliveryMinutes,row.observedAt,row.expiresAt,row.expiryState,row.comparable,row.highestAmongEligibleComparable,row.differenceFromHighestRecipient,row.effectiveRate]);
    });
    download("remittance-quote-comparison.csv","text/csv;charset=utf-8","\uFEFF"+rows.map(function(row){return row.map(csvCell).join(",");}).join("\r\n"));
  });
  $("rm-pdf").addEventListener("click",function(){
    var data=ensure();
    if(!data)return;
    try{
      var PDF=window.jspdf&&window.jspdf.jsPDF;
      if(!PDF)throw new Error("missing");
      var documentPdf=new PDF();
      documentPdf.setFontSize(16);
      documentPdf.text(words.title,18,20);
      documentPdf.setFontSize(9);
      var lines=documentPdf.splitTextToSize(summary(data),175);
      documentPdf.text(lines,18,30);
      documentPdf.save("remittance-quote-comparison.pdf");
      status.textContent=words.downloaded;
    }catch(exception){
      status.textContent=words.pdfError;
    }
  });
  function clear(){
    last=null;
    status.textContent="";
    $("rm-primary-label").textContent="";
    $("rm-primary-value").textContent="—";
    $("rm-primary-detail").textContent="";
    $("rm-result-list").textContent="";
    $("rm-results").setAttribute("aria-busy","true");
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

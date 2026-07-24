(function(){
  "use strict";
  var root=document.querySelector("[data-p2p-comparator]");if(!root)return;
  var locale=root.dataset.locale||"en";
  var words={
    en:{required:"Complete the scenario and every enabled quote with values from the provider screens you checked.",costs:"Entered sell costs cannot exceed gross proceeds.",updated:"Comparison updated.",copied:"Summary copied.",downloaded:"Download created.",pdfError:"PDF export is unavailable. Use print instead.",title:"P2P executable quote comparison",buyTotal:"Total fiat paid",sellTotal:"Net fiat received",effective:"Effective price",gross:"Gross quote value",cost:"Entered costs",difference:"Difference from observed target",observedBuy:"Lowest entered total",observedSell:"Highest entered proceeds",checked:"Checked",reference:"Reference",boundary:"Arithmetic comparison of user-entered quotes only. Confirm the executable quote, limits, payment method, merchant and fees directly before acting."},
    fr:{required:"Renseignez le scénario et chaque devis activé avec les valeurs des écrans du prestataire que vous avez vérifiés.",costs:"Les coûts de vente saisis ne peuvent pas dépasser le produit brut.",updated:"Comparaison mise à jour.",copied:"Résumé copié.",downloaded:"Téléchargement créé.",pdfError:"L’export PDF est indisponible. Utilisez l’impression.",title:"Comparaison de devis P2P exécutables",buyTotal:"Total fiat payé",sellTotal:"Montant fiat net reçu",effective:"Prix effectif",gross:"Valeur brute du devis",cost:"Coûts saisis",difference:"Écart par rapport à la cible observée",observedBuy:"Total saisi le plus bas",observedSell:"Produit saisi le plus élevé",checked:"Vérifié",reference:"Référence",boundary:"Comparaison arithmétique de devis saisis par l’utilisateur uniquement. Confirmez le devis exécutable, les limites, le moyen de paiement, le marchand et les frais avant d’agir."}
  }[locale];
  var $=function(id){return document.getElementById(id);},form=$("p2-form"),error=$("p2-error"),status=$("p2-status"),last=null;
  function text(id){return $(id).value.trim();}function num(id){return $(id).value;}
  function formatter(){return new Intl.NumberFormat(locale==="fr"?"fr-FR":"en",{maximumFractionDigits:6});}
  function amount(value,unit){return formatter().format(value)+" "+unit;}
  function readQuote(letter){
    return {label:text("p2-"+letter+"-label"),checkedAt:text("p2-"+letter+"-time"),priceFiatPerAsset:num("p2-"+letter+"-price"),percentCost:num("p2-"+letter+"-pct"),fixedCostFiat:num("p2-"+letter+"-fixed"),reference:text("p2-"+letter+"-ref")};
  }
  function calculate(event){
    if(event)event.preventDefault();
    if(!form.checkValidity()){error.textContent=words.required;error.dataset.show="true";form.reportValidity();return null;}
    var quotes=[readQuote("a"),readQuote("b")];if($("p2-third").checked)quotes.push(readQuote("c"));
    try{
      var result=window.P2PQuoteComparatorEngine.calculate({side:$("p2-side").value,assetLabel:text("p2-asset"),fiatCode:text("p2-fiat"),assetAmount:num("p2-amount"),quotes:quotes});
      last={result:result};
    }catch(e){
      error.textContent=String(e.message)==="COSTS_EXCEED_PROCEEDS"?words.costs:words.required;
      error.dataset.show="true";return null;
    }
    error.dataset.show="false";render(last.result);status.textContent=words.updated;return last;
  }
  function metric(label,value){
    var wrap=document.createElement("div");wrap.className="p2-metric";
    var span=document.createElement("span");span.textContent=label;
    var strong=document.createElement("strong");strong.textContent=value;
    wrap.append(span,strong);return wrap;
  }
  function render(result){
    var list=$("p2-result-list");list.textContent="";
    $("p2-primary-label").textContent=result.side==="buy"?words.observedBuy:words.observedSell;
    $("p2-primary-value").textContent=amount(result.observedTargetFiat,result.fiatCode);
    result.quotes.forEach(function(row){
      var card=document.createElement("article");card.className="p2-result";card.dataset.observed=String(row.isObservedTarget);
      var head=document.createElement("div");head.className="p2-result-head";
      var label=document.createElement("strong");label.textContent=row.label;
      head.appendChild(label);
      if(row.isObservedTarget){var badge=document.createElement("span");badge.className="p2-observation";badge.textContent=result.side==="buy"?words.observedBuy:words.observedSell;head.appendChild(badge);}
      var metrics=document.createElement("div");metrics.className="p2-metrics";
      metrics.append(
        metric(result.side==="buy"?words.buyTotal:words.sellTotal,amount(row.settlementFiat,result.fiatCode)),
        metric(words.effective,amount(row.effectivePriceFiatPerAsset,result.fiatCode)+" / "+result.assetLabel),
        metric(words.gross,amount(row.grossFiat,result.fiatCode)),
        metric(words.cost,amount(row.totalCostsFiat,result.fiatCode)),
        metric(words.difference,amount(row.differenceFromObservedTargetFiat,result.fiatCode))
      );
      var meta=document.createElement("p");meta.className="p2-meta";
      meta.textContent=words.checked+": "+new Intl.DateTimeFormat(locale==="fr"?"fr-FR":"en",{dateStyle:"medium",timeStyle:"short"}).format(new Date(row.checkedAt))+(row.reference?" · "+words.reference+": "+row.reference:"");
      card.append(head,metrics,meta);list.appendChild(card);
    });
    $("p2-results").removeAttribute("aria-busy");
  }
  function summary(data){
    var r=data.result,lines=[words.title,(r.side==="buy"?"BUY":"SELL")+" "+formatter().format(r.assetAmount)+" "+r.assetLabel+" / "+r.fiatCode,(r.side==="buy"?words.observedBuy:words.observedSell)+": "+amount(r.observedTargetFiat,r.fiatCode)];
    r.quotes.forEach(function(q){lines.push("",q.label,words.checked+": "+q.checkedAt,(q.reference?words.reference+": "+q.reference:""),"Price entered: "+amount(q.priceFiatPerAsset,r.fiatCode)+" / "+r.assetLabel,words.gross+": "+amount(q.grossFiat,r.fiatCode),words.cost+": "+amount(q.totalCostsFiat,r.fiatCode),(r.side==="buy"?words.buyTotal:words.sellTotal)+": "+amount(q.settlementFiat,r.fiatCode),words.effective+": "+amount(q.effectivePriceFiatPerAsset,r.fiatCode)+" / "+r.assetLabel,words.difference+": "+amount(q.differenceFromObservedTargetFiat,r.fiatCode));});
    lines.push("",words.boundary);return lines.filter(function(line){return line!==""||true;}).join("\n");
  }
  function cell(value){var s=String(value==null?"":value);if(/^[\t\r ]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
  function download(name,type,content){var blob=new Blob([content],{type:type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);status.textContent=words.downloaded;}
  function ensure(){return last||calculate();}
  $("p2-copy").addEventListener("click",function(){var d=ensure();if(!d)return;var value=summary(d);if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(value).then(function(){status.textContent=words.copied;});});
  $("p2-json").addEventListener("click",function(){var d=ensure();if(d)download("p2p-quote-comparison.json","application/json;charset=utf-8",JSON.stringify(d.result,null,2));});
  $("p2-csv").addEventListener("click",function(){var d=ensure();if(!d)return;var r=d.result,rows=[["Quote","Checked at","Reference","Side","Asset amount","Asset","Fiat","Entered price","Percent cost","Fixed cost","Gross","Total costs","Settlement","Effective price","Difference from observed target","Observed target"]];r.quotes.forEach(function(q){rows.push([q.label,q.checkedAt,q.reference,r.side,r.assetAmount,r.assetLabel,r.fiatCode,q.priceFiatPerAsset,q.percentCost,q.fixedCostFiat,q.grossFiat,q.totalCostsFiat,q.settlementFiat,q.effectivePriceFiatPerAsset,q.differenceFromObservedTargetFiat,q.isObservedTarget]);});download("p2p-quote-comparison.csv","text/csv;charset=utf-8","\uFEFF"+rows.map(function(row){return row.map(cell).join(",");}).join("\r\n"));});
  $("p2-pdf").addEventListener("click",function(){var d=ensure();if(!d)return;try{var PDF=window.jspdf&&window.jspdf.jsPDF;if(!PDF)throw new Error("missing");var doc=new PDF(),lines=doc.splitTextToSize(summary(d),175);doc.setFontSize(16);doc.text(words.title,18,20);doc.setFontSize(9);doc.text(lines,18,30);doc.save("p2p-quote-comparison.pdf");status.textContent=words.downloaded;}catch(e){status.textContent=words.pdfError;}});
  function clear(){last=null;status.textContent="";$("p2-primary-label").textContent="";$("p2-primary-value").textContent="—";$("p2-result-list").textContent="";$("p2-results").setAttribute("aria-busy","true");}
  $("p2-third").addEventListener("change",function(){var enabled=this.checked,section=$("p2-quote-c");section.hidden=!enabled;section.querySelectorAll("input").forEach(function(input){input.disabled=!enabled;input.required=enabled&&input.dataset.optional!=="true";});clear();});
  form.addEventListener("submit",calculate);form.addEventListener("input",clear);form.addEventListener("change",function(event){if(event.target.id!=="p2-third")clear();});
  var theme=$("p2-theme");function effective(){return document.documentElement.getAttribute("data-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");}function sync(){document.body.dataset.p2Theme=effective();theme.setAttribute("aria-pressed",String(effective()==="dark"));}theme.addEventListener("click",function(){var next=effective()==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",next);try{localStorage.setItem("afrotools-theme",next);}catch(e){}sync();});new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});sync();
}());

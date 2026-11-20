(() => {
  const form = document.getElementById("feeForm");
  const provider = form.elements.provider, action = form.elements.operation;
  const reference = document.getElementById("feeSource"), result = document.getElementById("feeResult");
  const names = {send:"Tura kuɗi", "send-same-network":"Tura kuɗi a hanyar sadarwa ɗaya","send-other-network":"Tura kuɗi zuwa wata hanyar sadarwa",withdraw:"Cire kuɗi",deposit:"Saka kuɗi"};
  let catalog;
  function resetResult() { result.replaceChildren(); }
  function configure() {
    const chosen = catalog?.providers.find(row => row.id === provider.value);
    action.replaceChildren();
    for (const key of chosen ? Object.keys(chosen.actions) : ["send","withdraw","deposit"]) action.add(new Option(names[key] || key,key));
    form.elements.quoted.value = "";
    reference.hidden = !chosen;
    if (chosen) {
      reference.href = chosen.source.url;
      reference.textContent = chosen.source.publisher + " · Ranar da aka duba jadawalin: " + new Intl.DateTimeFormat("ha",{dateStyle:"long",timeZone:"UTC"}).format(Date.parse(chosen.lastVerified+"T00:00:00Z"));
    }
    resetResult();
  }
  configure();
  provider.addEventListener("change",configure);
  form.addEventListener("input",resetResult);
  action.addEventListener("change",()=>{ form.elements.quoted.value="";resetResult(); });
  fetch("/data/fintech/mobile-money-tariffs.json",{signal:AbortSignal.timeout(8000)}).then(response=>response.ok?response.json():null).then(data=>{
    if (!data || !window.MobileMoneyQuoteEngine?.validateCatalog(data)) return;
    catalog=data;
    for (const row of data.providers) provider.add(new Option(row.provider+" · "+row.currency,row.id));
  }).catch(()=>{});
  form.addEventListener("submit",event=>{
    event.preventDefault();
    const amount=form.elements.amount.valueAsNumber,manual=form.elements.quoted;
    if (!(amount>0)) {result.textContent="Shigar da adadin kuɗin da ya fi sifili.";return;}
    const chosen=catalog?.providers.find(row=>row.id===provider.value);
    const fmt=n=>new Intl.NumberFormat("ha",{maximumFractionDigits:2}).format(n);
    if(manual.value!==""){
      if(!(manual.valueAsNumber>=0)){result.textContent="Cajin ba zai zama ƙasa da sifili ba.";return;}
      result.textContent="Cajin da ka shigar: "+fmt(manual.valueAsNumber)+(chosen?" "+chosen.currency:"")+" · Kason caji: "+fmt(manual.valueAsNumber/amount*100)+"%.";
      return;
    }
    if(!chosen){result.textContent="Zaɓi kamfanin da ke da jadawali, ko ka shigar da cajin da manhaja ko wakili ya nuna.";return;}
    const quote=window.MobileMoneyQuoteEngine.quoteTariff(catalog,{providerId:chosen.id,action:action.value,amount});
    if(!quote.available){result.textContent="Wannan adadi ba ya cikin jadawalin da aka tabbatar. Shigar da cajin da kamfanin ya nuna.";return;}
    const money=n=>fmt(n)+" "+quote.currency;
    const total = quote.totalIncludesAllCharges ? "Jimillar da za a cire: "+money(quote.totalDebited) : "Adadi tare da cajin da aka wallafa: "+money(quote.amountPlusPublishedFee)+". Ana iya samun wasu ƙarin caji";
    result.textContent="Caji: "+money(quote.fee)+" · "+total+" · Adadin da za a karɓa: "+money(quote.recipientReceives)+".";
  });
})();

(() => {
  const form = document.getElementById("feeForm");
  const provider = form.elements.provider, action = form.elements.operation;
  const reference = document.getElementById("feeSource"), result = document.getElementById("feeResult");
  const names = {send:"Fi owó ránṣẹ́", "send-same-network":"Fi owó ránṣẹ́ sí nẹ́tíwọ́ọ̀kì kan náà","send-other-network":"Fi owó ránṣẹ́ sí nẹ́tíwọ́ọ̀kì mìíràn",withdraw:"Yọ owó",deposit:"Fi owó sínú àpamọ́"};
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
      reference.textContent = chosen.source.publisher + " · A ṣàyẹ̀wò àtòjọ ní " + new Intl.DateTimeFormat("yo",{dateStyle:"long",timeZone:"UTC"}).format(Date.parse(chosen.lastVerified+"T00:00:00Z"));
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
    if (!(amount>0)) {result.textContent="Tẹ iye owó tó ju òdo lọ.";return;}
    const chosen=catalog?.providers.find(row=>row.id===provider.value);
    const fmt=n=>new Intl.NumberFormat("yo",{maximumFractionDigits:2}).format(n);
    if(manual.value!==""){
      if(!(manual.valueAsNumber>=0)){result.textContent="Owó iṣẹ́ kò lè kéré ju òdo lọ.";return;}
      result.textContent="Owó iṣẹ́ tí o tẹ̀: "+fmt(manual.valueAsNumber)+(chosen?" "+chosen.currency:"")+" · Ìdá owó iṣẹ́: "+fmt(manual.valueAsNumber/amount*100)+"%.";
      return;
    }
    if(!chosen){result.textContent="Yan ilé-iṣẹ́ kan tó ní àtòjọ tàbí tẹ owó iṣẹ́ tí àpù tàbí aṣojú fi hàn.";return;}
    const quote=window.MobileMoneyQuoteEngine.quoteTariff(catalog,{providerId:chosen.id,action:action.value,amount});
    if(!quote.available){result.textContent="Iye yìí kò sí nínú ààlà àtòjọ. Tẹ owó iṣẹ́ tí ilé-iṣẹ́ náà fi hàn.";return;}
    const money=n=>fmt(n)+" "+quote.currency;
    const total = quote.totalIncludesAllCharges ? "Àpapọ̀ owó tí a ó yọ: "+money(quote.totalDebited) : "Iye owó àti owó iṣẹ́ tí a tẹ̀ jáde: "+money(quote.amountPlusPublishedFee)+". Owó orí mìíràn lè wà";
    result.textContent="Owó iṣẹ́: "+money(quote.fee)+" · "+total+" · Iye tí olùgbà yóò rí: "+money(quote.recipientReceives)+".";
  });
})();

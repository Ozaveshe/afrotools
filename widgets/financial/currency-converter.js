window.AfroWidgets = window.AfroWidgets || {};
window.AfroWidgets.currency_converter = function(root, options) {
  const crypto = false;
  const fr = root.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr";
  const msg = (en, native) => fr ? native : en;
  const locale = fr ? "fr" : "en";
  const symbols = {bitcoin:"BTC",ethereum:"ETH",tether:"USDT",binancecoin:"BNB",solana:"SOL",ripple:"XRP"};
  const fiat = crypto ? ["NGN","KES","GHS","ZAR","EGP","USD","EUR","GBP"] : ["USD","EUR","GBP","NGN","KES","GHS","ZAR","EGP","TZS","UGX","RWF","MAD","XOF","XAF","ZMW","MWK","BWP"];
  const form = document.createElement("form");form.style.cssText="display:grid;gap:12px";form.noValidate=true;
  const title=document.createElement("h2");title.textContent=crypto?msg("Crypto converter","Conversion de cryptomonnaies"):msg("Currency converter","Conversion de devises");form.append(title);
  function addField(text,ops) {
    const wrapper=document.createElement("label");wrapper.append(document.createTextNode(text));
    const control=document.createElement(ops?"select":"input");
    if(ops) for(const key of ops)control.add(new Option(symbols[key]||key,key));
    else{control.type="number";control.step="any";control.min="0";}
    control.className=ops?"aw-select":"aw-input";control.style.cssText="display:block;width:100%;min-height:44px";wrapper.append(control);form.append(wrapper);return control;
  }
  const amount=addField(msg("Amount","Montant"));amount.value=crypto?"1":"1000";
  const from=addField(msg("From","De"),crypto?Object.keys(symbols):fiat);
  const to=addField(msg("To","Vers"),fiat);to.value="NGN";
  const manual=addField("");manual.setAttribute("data-rate","");
  const status=document.createElement("p");status.setAttribute("role","status");
  const result=document.createElement("output");result.setAttribute("aria-live","polite");
  const button=document.createElement("button");button.className="aw-btn";button.type="submit";button.textContent=msg("Convert","Convertir");form.append(button,status,result);root.replaceChildren(form);if(options?.footerHTML)root.insertAdjacentHTML("beforeend",options.footerHTML);
  let quote=null, revision=0;
  function refresh(){
    const id=++revision;quote=null;manual.value="";result.textContent="";
    const unit=symbols[from.value]||from.value;
    manual.parentElement.firstChild.nodeValue=msg("Your provider rate (optional): ","Cours de votre prestataire (facultatif) : ")+to.value+msg(" for 1 "," pour 1 ")+unit;
    if(!crypto && from.value===to.value){manual.disabled=true;quote={rate:1,source:msg("Same currency","Même devise")};status.textContent=quote.source;return;}
    manual.disabled=false;status.textContent=msg("Looking up a dated rate. You can enter your quote now.","Recherche d’un cours daté. Vous pouvez saisir votre propre cours.");
    const sourceCurrency=from.value,targetCurrency=to.value;
    const endpoint="https://afrotools.com/api/forex?";
    async function request(query) {
      const response=await fetch(endpoint+query,{cache:"no-cache",signal:AbortSignal.timeout(5000)});
      // A refusal can be delivered as HTTP 503 with the reason in the JSON.
      const body=await response.json();
      return {body,ok:response.ok};
    }
    (async()=>{
      let body,ok,transportFailed=false;
      try {({body,ok}=await request(new URLSearchParams({from:sourceCurrency,to:targetCurrency})));}
      catch {transportFailed=true;}
      if(id!==revision)return;
      let rate,qualification;
      if(transportFailed){
        try{
          const list=await request(new URLSearchParams({base:sourceCurrency}));
          if(id!==revision)return;
          if(list.ok && list.body.base===sourceCurrency && list.body.status==="available"){
            const row=list.body.qualification?.[targetCurrency];
            if(row?.status==="available"){rate=list.body.rates?.[targetCurrency];qualification=row;}
          }
        }catch{}
      }else if(ok && body?.status==="available" && body.pair===sourceCurrency+"/"+targetCurrency){
        rate=body.rate;qualification=body.qualification;
      }
      if(id!==revision)return;
      const observations=[qualification?.base,qualification?.target];
      if(Number.isFinite(rate)&&rate>0&&observations.every(row=>row?.status==="available"&&Number.isFinite(Date.parse(row.observed_at)))){
        const date=new Date(Math.min(...observations.map(row=>Date.parse(row.observed_at))));
        quote={rate,source:"AfroTools FX · "+date.toLocaleString(locale,{dateStyle:"medium",timeStyle:"short"})};
        status.textContent=quote.source;
      }else{
        status.textContent=msg("Enter your provider’s rate to convert this pair.","Saisissez le cours de votre prestataire pour convertir cette paire.");
      }
    })();
  }
  from.addEventListener("change",refresh);to.addEventListener("change",refresh);form.addEventListener("input",()=>{result.textContent="";});
  form.addEventListener("submit",event=>{
   event.preventDefault();const own=!manual.disabled && manual.value!=="",rate=own?manual.valueAsNumber:quote?.rate,value=amount.valueAsNumber*rate;
   if(!(amount.valueAsNumber>0&&rate>0&&Number.isFinite(value))){result.textContent=msg("Enter a positive amount and a valid rate.","Saisissez un montant positif et un cours valide.");return;}
   const number=n=>n.toLocaleString(locale,{maximumSignificantDigits:10});
   result.textContent=number(value)+" "+to.value+" · 1 "+(symbols[from.value]||from.value)+" = "+number(rate)+" "+to.value+" · "+(own?msg("Your provider quote","Cours saisi"):quote.source)+" · "+msg("Before fees","Hors frais");
  });refresh();
};

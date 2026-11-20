window.AfroWidgets = window.AfroWidgets || {};
window.AfroWidgets.mobileMoneyFees = function(root, options) {
  const fr=root.ownerDocument.documentElement.dataset.afroWidgetLocale==="fr";
  const say=(en,native)=>fr?native:en;
  const num=value=>value.toLocaleString(fr?"fr":"en",{maximumFractionDigits:2});
  const form=document.createElement("form");form.noValidate=true;form.style.cssText="display:grid;gap:10px";
  root.replaceChildren(form);
  function node(tag,text,parent=form){const el=document.createElement(tag);el.textContent=text;parent.append(el);return el;}
  function number(label,parent,initial){
   const wrap=node("label",label,parent),input=node("input","",wrap);input.type="number";input.step="any";input.min="0";input.className="aw-input";if(initial!==undefined)input.value=initial;return input;
  }
  function action(text,type,parent=form){const el=node("button",text,parent);el.type=type;el.className="aw-btn";return el;}
  function finish(run){
   action(say("Calculate","Calculer"),"submit");
   const result=node("output","");result.setAttribute("aria-live","polite");form.addEventListener("input",()=>{result.textContent="";});form.addEventListener("submit",ev=>{ev.preventDefault();result.textContent=run();});
   if(options?.footerHTML)root.insertAdjacentHTML("beforeend",options.footerHTML);
  }
  node("h2",say("Mobile money fees","Frais de paiement mobile"));
  const wrap=node("label",say("Published operator tariff","Barème publié par l’opérateur")),provider=node("select","",wrap);provider.className="aw-select";const op=node("select","",node("label",say("Transaction","Opération")));op.className="aw-select";
  const amount=number(say("Transaction amount","Montant de l’opération"),form);
  const manual=number(say("Fee quoted by your operator (optional override)","Frais annoncés par votre opérateur (prioritaires si renseignés)"),form);
  const reference=node("a","");reference.target="_blank";reference.rel="noopener";let catalog;
  const available={"send":say("Send","Envoi"),"send-same-network":say("Send on the same network","Envoi sur le même réseau"),"send-other-network":say("Send to another network","Envoi vers un autre réseau"),"withdraw":say("Withdraw","Retrait"),"deposit":say("Deposit","Dépôt")};
  function update(){const p=catalog?.providers.find(row=>row.id===provider.value);op.replaceChildren();for(const key of (p?Object.keys(p.actions):Object.keys(available)))op.add(new Option(available[key]||key,key));manual.value="";reference.hidden=!p;if(p){reference.href=p.source.url;reference.textContent=p.source.publisher+" · "+say("checked ","vérifié le ")+p.lastVerified;}}
  provider.add(new Option(say("Other provider · enter quoted fee","Autre opérateur · saisir les frais annoncés"),""));update();
  fetch("https://afrotools.com/data/fintech/mobile-money-tariffs.json",{signal:AbortSignal.timeout(5000)}).then(r=>r.ok?r.json():null).then(data=>{if(!data||!window.MobileMoneyQuoteEngine?.validateCatalog(data))return;catalog=data;for(const p of data.providers)provider.add(new Option(p.provider+" · "+p.currency,p.id));if(!amount.value&&!manual.value){provider.value=data.providers[0].id;update();}}).catch(()=>{});
  provider.addEventListener("change",update);op.addEventListener("change",()=>{manual.value="";});
  finish(()=>{const n=amount.valueAsNumber;if(!(n>0))return say("Enter a positive transaction amount.","Saisissez un montant positif.");
   if(manual.value!==""){const fee=manual.valueAsNumber;if(!(fee>=0))return say("Enter a nonnegative fee.","Saisissez des frais positifs ou nuls.");return say("Entered fee","Frais saisis")+" "+num(fee)+" · "+num(fee/n*100)+" %";}
   if(!catalog||!provider.value)return say("Enter the fee shown by your operator.","Saisissez les frais affichés par votre opérateur.");
   const result=window.MobileMoneyQuoteEngine.quoteTariff(catalog,{providerId:provider.value,action:op.value,amount:n});if(!result.available)return say("Outside the published bands. Enter the operator’s quote above.","Ce montant est hors du barème publié. Saisissez les frais annoncés ci-dessus.");
   const total=result.totalIncludesAllCharges?say("Total debited","Débit total")+" "+num(result.totalDebited):say("Amount plus published fee, before additional taxes","Montant avec les frais publiés, avant taxes supplémentaires")+" "+num(result.amountPlusPublishedFee);
    return say("Fee","Frais")+" "+num(result.fee)+" "+result.currency+" · "+total+" "+result.currency+" · "+num(result.fee/n*100)+" %";});
};

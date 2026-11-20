window.AfroWidgets = window.AfroWidgets || {};
window.AfroWidgets.electricityTariff = function (root, options) {
  const fr = root.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr";
  const say = (en, native) => fr ? native : en;
  const fmt = value => value.toLocaleString(fr ? "fr" : "en", {maximumFractionDigits: 3});
  const form = document.createElement("form");
  form.noValidate = true;
  form.style.cssText = "display:grid;gap:12px";
  const title = document.createElement("h2");
  const status = document.createElement("output");
  status.setAttribute("aria-live","polite");
  form.append(title);
  root.replaceChildren(form);
  function field(text, type, id, value) {
    const label = document.createElement("label");
    label.textContent = text;
    const element = document.createElement(type === "select" ? "select" : "input");
    element.className = type === "select" ? "aw-select" : "aw-input";
    element.style.cssText = "display:block;width:100%;box-sizing:border-box;min-height:40px";
    if (type !== "select") { element.type="number"; element.step="any"; element.min="0"; }
    element.dataset.field = id;
    if(value !== undefined) element.value = value;
    label.append(element);form.append(label);
    return element;
  }
  const country=field(say("Country and currency","Pays et devise"),"select","country");
  const currencies={NG:"NGN",KE:"KES",ZA:"ZAR",GH:"GHS",EG:"EGP",ET:"ETB",TZ:"TZS",UG:"UGX",RW:"RWF",MA:"MAD",SN:"XOF"};
  const countries=new Intl.DisplayNames([fr?"fr":"en"],{type:"region"});
  for (const [region,code] of Object.entries(currencies)) country.add(new Option(countries.of(region)+" · "+code,region));
  const money=value=>new Intl.NumberFormat(fr?"fr":"en",{style:"currency",currency:currencies[country.value]}).format(value);
  const note=document.createElement("p");form.append(note);
  const rate=field(say("Price per kWh from your bill","Prix du kWh indiqué sur votre facture"),"number","rate");
  const calculate=document.createElement("button");calculate.className="aw-btn";calculate.type="submit";
  function finish(run) {
    form.append(calculate,status);
    if(options?.footerHTML) root.insertAdjacentHTML("beforeend",options.footerHTML);
    form.addEventListener("input",()=>{status.textContent="";});
    country.addEventListener("change",()=>{rate.value="";status.textContent="";});
    form.addEventListener("submit",event=>{event.preventDefault();status.textContent=run();});
  }
  title.textContent=say("Electricity bill estimate","Estimer la facture d’électricité");
  note.textContent=say("Use the unit price from your supplier for your service class. For a progressive tariff, add each block in order. Fixed fees and taxes can be entered below.","Utilisez le prix du kWh indiqué par votre fournisseur pour votre catégorie de service. Pour un tarif progressif, ajoutez les tranches dans l’ordre. Vous pouvez saisir les frais fixes et les taxes ci-dessous.");
  const usage=field(say("Consumption this billing period (kWh)","Consommation de la période (kWh)"),"number","usage");
  const fees=field(say("Other fees and taxes for the period","Autres frais et taxes de la période"),"number","fees",0);
  const add=document.createElement("button");add.type="button";add.textContent=say("Add a tariff block","Ajouter une tranche");form.append(add);
  const tiers=[];const first={rate};tiers.push(first);
  function clear(){status.textContent="";}
  function addBlock(){
   const previous=tiers[tiers.length-1];
   previous.limit=field(say("Cumulative upper limit for block ","Plafond cumulé en kWh de la tranche ")+tiers.length,"number","limit"+tiers.length);
   const nextRate=field(say("Price per kWh above this limit","Prix du kWh au-delà du plafond"),"number","rate"+(tiers.length+1));
   const group=document.createElement("fieldset");const legend=document.createElement("legend");legend.textContent=say("Tariff change","Changement de tarif");group.append(legend,previous.limit.parentElement,nextRate.parentElement);
   form.insertBefore(group,add);tiers.push({rate:nextRate,group});clear();
  }
  add.addEventListener("click",addBlock);
  const remove=document.createElement("button");remove.type="button";remove.textContent=say("Remove last block","Retirer la dernière tranche");form.append(remove);
  function pop(){if(tiers.length===1)return;tiers.pop().group.remove();delete tiers[tiers.length-1].limit;clear();}
  remove.addEventListener("click",pop);
  country.addEventListener("change",()=>{while(tiers.length>1)pop();fees.value="0";});
  calculate.textContent=say("Estimate bill","Estimer la facture");
  finish(()=>{
   const total=usage.valueAsNumber,extra=fees.valueAsNumber;
   if(!(total>=0&&extra>=0))return say("Enter consumption and nonnegative fees.","Indiquez la consommation et des frais positifs ou nuls.");
   let prior=0,cost=0;const rows=[];
   for(const tier of tiers){
   const upper=tier.limit?tier.limit.valueAsNumber:Infinity,price=tier.rate.valueAsNumber;
   if(!(upper>prior&&price>=0))return say("Enter a price for each block and increasing cumulative limits in kWh.","Renseignez le prix de chaque tranche et des plafonds cumulés croissants en kWh.");
   const units=Math.max(0,Math.min(total,upper)-prior);if(units>0){cost+=units*price;rows.push(fmt(units)+" kWh × "+money(price));}prior=upper;
   }
   return say("Estimated bill","Facture estimée")+" "+money(cost+extra)+" · "+(rows.length?rows.join(" + ")+" · ":"")+say("Other fees","Autres frais")+" "+money(extra);
  });
};

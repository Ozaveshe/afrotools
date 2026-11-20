window.AfroWidgets = window.AfroWidgets || {};
window.AfroWidgets.stampDuty = function(root, options) {
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
  node("h2",say("Stamp duty estimate","Estimation des droits d’enregistrement"));
  node("p",say("Use the taxable value and rate from your assessment. For a graduated schedule, apply each rate to the portion it covers and enter the combined assessed duty as a fixed amount.","Reprenez la base imposable et le taux de votre avis de liquidation. Pour un barème progressif, appliquez chaque taux à sa tranche et saisissez le total du droit liquidé en montant fixe."));
  const country=node("select","",node("label",say("Country and currency","Pays et devise")));country.className="aw-select";const regions=new Intl.DisplayNames([fr?"fr":"en"],{type:"region"});const codes={NG:"NGN",KE:"KES",GH:"GHS",ZW:"ZWG",TZ:"TZS",UG:"UGX",ZM:"ZMW",ET:"ETB",CM:"XAF",RW:"RWF"};for(const [k,ccy] of Object.entries(codes))country.add(new Option(regions.of(k)+" · "+ccy,k));
  const mode=node("select","",node("label",say("Assessment method","Méthode de calcul")));mode.className="aw-select";mode.add(new Option(say("Percentage of the taxable value","Pourcentage de la base imposable"),"percent"));mode.add(new Option(say("Fixed or already assessed duty","Droit forfaitaire ou déjà liquidé"),"fixed"));mode.add(new Option(say("Exemption confirmed for this instrument","Exonération confirmée pour cet acte"),"exempt"));
  const value=number(say("Taxable value","Base imposable"),form),rate=number(say("Confirmed duty rate (%)","Taux confirmé (%)"),form),fixed=number(say("Assessed duty","Droit liquidé"),form),fees=number(say("Other registration fees","Autres frais d’enregistrement"),form,0);
  const source=node("a",say("Kenya Revenue Authority · stamp duty by instrument","Kenya Revenue Authority · droits par type d’acte"));source.href="https://www.kra.go.ke/component/kra_faq/faqcategory/43";source.rel="noopener";source.target="_blank";
  function display(){value.parentElement.hidden=rate.parentElement.hidden=mode.value!=="percent";fixed.parentElement.hidden=mode.value!=="fixed";source.hidden=country.value!=="KE";}
  display();mode.addEventListener("change",display);country.addEventListener("change",()=>{for(const el of [value,rate,fixed])el.value="";fees.value="0";mode.value="percent";display();});
  finish(()=>{const other=fees.valueAsNumber;let duty=0;if(!(other>=0))return say("Enter other fees, including zero.","Indiquez les autres frais, même s’ils sont nuls.");
   if(mode.value==="percent"){if(!(value.valueAsNumber>=0&&rate.valueAsNumber>=0&&rate.valueAsNumber<=100))return say("Enter the taxable value and confirmed percentage.","Saisissez la base imposable et le pourcentage confirmé.");duty=value.valueAsNumber*rate.valueAsNumber/100;}
   if(mode.value==="fixed"){duty=fixed.valueAsNumber;if(!(duty>=0))return say("Enter the assessed duty.","Saisissez le droit liquidé.");}
   const money=n=>new Intl.NumberFormat(fr?"fr":"en",{style:"currency",currency:codes[country.value]}).format(n);
   return say("Total due","Total à prévoir")+" "+money(duty+other)+" · "+say("Duty","Droit")+" "+money(duty)+" · "+say("Other fees","Autres frais")+" "+money(other);});
};

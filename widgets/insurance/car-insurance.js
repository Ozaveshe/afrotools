window.AfroWidgets = window.AfroWidgets || {};
window.AfroWidgets.carInsurance = function(root, options) {
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
  node("h2",say("Annual motor insurance cost","Coût annuel d’une assurance auto"));
  const list=["NGN","KES","ZAR","GHS","EGP","TZS","UGX","RWF"];const currency=node("select","",node("label",say("Currency","Devise")));currency.className="aw-select";list.forEach(c=>currency.add(new Option(c,c)));
  const basis=node("select","",node("label",say("Premium basis","Base de calcul de la prime")));basis.className="aw-select";basis.add(new Option(say("Annual insurer quote","Devis annuel de l’assureur"),"flat"));basis.add(new Option(say("Quoted percentage of insured value","Pourcentage indiqué de la valeur assurée"),"rate"));basis.add(new Option(say("Nigeria private motor third-party circular","Barème nigérian : responsabilité civile, voiture particulière"),"ng"));
  const flat=number(say("Quoted annual premium","Prime annuelle proposée"),form),value=number(say("Insured value","Valeur assurée"),form),rate=number(say("Quoted percentage (%)","Pourcentage proposé (%)"),form),fees=number(say("Additional annual fees","Frais annuels supplémentaires"),form,0);
  const source=node("a",say("NAICOM circular · private motor third-party tariff, effective January 2023","Circulaire NAICOM · responsabilité civile des voitures particulières, applicable en janvier 2023"));source.href="https://naicom.gov.ng/wp-content/uploads/2026/05/cirs-2022-to-2025.pdf";source.target="_blank";source.rel="noopener";
  function sync(){basis.options[2].disabled=currency.value!=="NGN";if(basis.options[2].disabled&&basis.value==="ng")basis.value="flat";source.hidden=basis.value!=="ng";flat.parentElement.hidden=basis.value!=="flat";value.parentElement.hidden=rate.parentElement.hidden=basis.value!=="rate";}
  currency.addEventListener("change",()=>{flat.value=value.value=rate.value="";fees.value="0";sync();});basis.addEventListener("change",sync);sync();
  finish(()=>{let premium=basis.value==="ng"?15000:flat.valueAsNumber;const add=fees.valueAsNumber;
   if(basis.value==="rate"){if(!(value.valueAsNumber>0&&rate.valueAsNumber>0&&rate.valueAsNumber<=100))return say("Enter the insured value and the rate quoted by the insurer.","Saisissez la valeur assurée et le taux proposé par l’assureur.");premium=value.valueAsNumber*rate.valueAsNumber/100;}
   if(!(premium>0&&add>=0))return say("Enter a positive annual premium and nonnegative fees.","Saisissez une prime positive et des frais positifs ou nuls.");
   const money=n=>new Intl.NumberFormat(fr?"fr":"en",{style:"currency",currency:currency.value}).format(n);
   return say("Annual cost","Coût annuel")+" "+money(premium+add)+" · "+say("Monthly budget equivalent","Équivalent budgétaire mensuel")+" "+money((premium+add)/12);});
};

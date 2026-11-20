window.AfroWidgets = window.AfroWidgets || {};
window.AfroWidgets.japaCalculator = function(root, options) {
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
  node("h2",say("Relocation budget","Budget de déménagement à l’étranger"));
  node("p",say("Enter every cost in the same currency, using prices and official fees for your destination. Exclude refundable proof-of-funds balances from expenses.","Saisissez tous les montants dans une même devise à partir des prix et frais officiels de votre destination. Distinguez les sommes à justifier des dépenses effectives."));
  const currency=node("select","",node("label",say("Budget currency","Devise du budget")));currency.className="aw-select";["NGN","KES","GHS","ZAR","USD","GBP","EUR","CAD","AUD","EGP","ETB","TZS","UGX","RWF","XOF","XAF","CDF","ZMW","ZWG","MWK","MAD"].forEach(c=>currency.add(new Option(c,c)));
  const fields=[
   ["preDeparture","Pre-departure preparation","Préparation avant départ",0],["verifiedOfficialFees","Official fees for your route","Frais officiels du parcours",0],["travel","Travel and baggage","Trajet et bagages",0],["housing","Housing deposit and upfront costs","Caution et frais de logement initiaux",0],["arrivalSetup","Arrival setup","Installation à l’arrivée",0],["monthlyLiving","Monthly living expenses","Dépenses courantes mensuelles",0],["runwayMonths","Months to cover","Nombre de mois à couvrir",3],["bufferPercent","Contingency (%)","Marge pour imprévus (%)",0],["availableSavings","Available savings","Épargne disponible",0],["savingMonths","Months to save before departure","Mois d’épargne avant le départ",6]
  ].map(([key,en,frLabel,value])=>({key,input:number(say(en,frLabel),form,value)}));
  currency.addEventListener("change",()=>{for(const {key,input} of fields)if(!["runwayMonths","bufferPercent","savingMonths"].includes(key))input.value="";});
  finish(()=>{try{const values=Object.fromEntries(fields.map(({key,input})=>[key,input.value]));const r=window.RelocationBudgetEngine.calculate({...values,currency:currency.value});if(r.total===0)return say("Enter at least one moving or living cost.","Indiquez au moins une dépense de déménagement ou de vie courante.");
   const money=n=>new Intl.NumberFormat(fr?"fr":"en",{style:"currency",currency:currency.value}).format(n);
   return say("Total budget","Budget total")+" "+money(r.total)+" · "+say("Still to save","Reste à épargner")+" "+money(r.gap)+" · "+say("Monthly savings target","Épargne mensuelle nécessaire")+" "+money(r.monthlySavingsTarget);
   }catch{return say("Check the amounts, months and contingency percentage.","Vérifiez les montants, le nombre de mois et la marge pour imprévus.");}});
};

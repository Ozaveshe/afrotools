window.AfroWidgets = window.AfroWidgets || {};
window.AfroWidgets.remittanceCompare = function(root, options) {
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
  node("h2",say("Compare remittance quotes","Comparer des transferts d’argent"));
  node("p",say("Use two current quotes for the same route and payout method. Enter the full sender debit, including fees, and the amount the recipient actually receives.","Utilisez deux devis actuels pour le même trajet et le même mode de retrait. Indiquez le débit total, frais compris, et la somme effectivement reçue."));
  function select(label,choices){const el=node("select","",node("label",label));el.className="aw-select";for(const key of choices)el.add(new Option(key,key));return el;}
  const currencies=["USD","EUR","GBP","CAD","AUD","NGN","KES","GHS","ZAR","XOF","XAF","UGX","TZS","MAD","EGP","ETB","RWF"];const from=select(say("Sender currency","Devise d’envoi"),currencies),to=select(say("Recipient currency","Devise de réception"),currencies);to.value="NGN";
  const rows=[1,2].map(i=>{const block=node("fieldset","");node("legend",say("Quote ","Devis ")+i,block);return{debit:number(say("Sender pays (including fees)","Débit total, frais inclus"),block),received:number(say("Recipient receives","Somme effectivement reçue"),block)};});
  for(const field of [from,to])field.addEventListener("change",()=>{for(const row of rows)(field===from?row.debit:row.received).value="";});
  finish(()=>{if(rows.some(r=>!(r.debit.valueAsNumber>0&&r.received.valueAsNumber>0)))return say("Enter positive amounts from both quotes.","Renseignez des montants positifs pour les deux devis.");
   const [a,b]=rows.map(r=>({paid:r.debit.valueAsNumber,net:r.received.valueAsNumber}));const rates=[a,b].map((r,i)=>say("Quote ","Devis ")+(i+1)+" · "+num(r.net/r.paid)+" "+to.value+"/"+from.value);
   if(a.paid!==b.paid)return rates.join(" · ")+" · "+say("Request both quotes for the same total debit to compare payouts.","Demandez deux devis pour le même débit total afin de comparer les montants reçus.");
   const diff=Math.abs(a.net-b.net);return (diff===0?say("Equal payouts","Montants reçus identiques"):say("Quote ","Devis ")+(a.net>b.net?1:2)+say(" pays the recipient "," verse au destinataire ")+num(diff)+" "+to.value+say(" more"," de plus"))+" · "+rates.join(" · ");});
};

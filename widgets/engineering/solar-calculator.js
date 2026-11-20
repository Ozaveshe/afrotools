window.AfroWidgets = window.AfroWidgets || {};
window.AfroWidgets.solarCalculator = function(root, options) {
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
  node("h2",say("Solar system sizing estimate","Estimation du dimensionnement solaire"));
  node("p",say("Enter daily electricity use from your meter or appliances and peak sun hours for your site. Use figures from the panel and battery specifications.","Utilisez la consommation journalière de votre compteur ou de vos appareils et les heures de plein soleil du site. Reprenez les caractéristiques du panneau et de la batterie."));
  const fields=[["daily","Daily consumption (kWh)","Consommation quotidienne (kWh)"],["sun","Peak sun hours per day","Heures équivalentes de plein soleil par jour"],["eff","System efficiency (%)","Rendement du système (%)",75],["panel","Panel rated watts","Puissance nominale d’un panneau (W)",400],["days","Days of battery autonomy","Jours d’autonomie de la batterie",1],["usable","Usable battery capacity (%)","Part utilisable de la capacité de la batterie (%)",80],["kwh","Battery module capacity (kWh)","Capacité nominale d’une batterie (kWh)",1.2],["peak","Simultaneous peak load (kW, optional)","Puissance simultanée maximale (kW, facultatif)"],["panelPrice","Price per panel (optional)","Prix par panneau (facultatif)"],["batteryPrice","Price per battery (optional)","Prix par batterie (facultatif)"],["other","Inverter, installation and other costs","Onduleur, installation et autres frais",0]].map(([key,en,native,start])=>({key,input:number(say(en,native),form,start)}));
  const currency=node("select","",node("label",say("Quote currency","Devise du devis")));currency.className="aw-select";["NGN","KES","ZAR","GHS","EGP","TZS","UGX","RWF","XOF","USD","EUR"].forEach(code=>currency.add(new Option(code,code)));
  currency.addEventListener("change",()=>{for(const row of fields.slice(8))row.input.value=row.key==="other"?"0":"";});
  finish(()=>{const v=Object.fromEntries(fields.map(r=>[r.key,r.input.valueAsNumber]));if(!(v.daily>0&&v.sun>0&&v.sun<=24&&v.eff>0&&v.eff<=100&&v.panel>0&&v.days>=0&&v.usable>0&&v.usable<=100&&v.kwh>0))return say("Check daily use, sun hours, efficiency and equipment specifications.","Vérifiez la consommation, l’ensoleillement, le rendement et les caractéristiques des équipements.");
  const panels=Math.ceil(v.daily*1000/(v.sun*v.eff/100*v.panel)),batteries=Math.ceil(v.daily*v.days/(v.usable/100*v.kwh));let result=say("Panels","Panneaux")+" "+panels+" ("+num(panels*v.panel/1000)+" kWc) · "+say("Battery modules","Batteries")+" "+batteries+" ("+num(batteries*v.kwh)+" kWh)";
  if(fields[7].input.value!==""){if(!(v.peak>0))return say("Check the peak load.","Vérifiez la puissance maximale.");result+=" · "+say("Minimum continuous inverter output before surge allowance","Puissance continue minimale de l’onduleur, hors pointe de démarrage")+" "+num(v.peak)+" kW";}
  if(fields[8].input.value!==""||fields[9].input.value!==""||v.other>0){if(!(v.panelPrice>=0&&(batteries===0||v.batteryPrice>=0)&&v.other>=0))return say("Enter all applicable equipment prices and costs in the selected currency.","Indiquez tous les prix applicables dans la devise sélectionnée.");result+=" · "+say("Quoted equipment and installation","Équipement et installation selon devis")+" "+new Intl.NumberFormat(fr?"fr":"en",{style:"currency",currency:currency.value}).format(panels*v.panelPrice+batteries*(v.batteryPrice||0)+v.other);}
  return result;});
};

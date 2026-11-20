window.AfroWidgets = window.AfroWidgets || {};
window.AfroWidgets.appliancePower = function (root, options) {
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
  const currencies={NG:"NGN",KE:"KES",ZA:"ZAR",GH:"GHS",EG:"EGP",ET:"ETB",TZ:"TZS",UG:"UGX",RW:"RWF",MA:"MAD"};
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
  title.textContent=say("Appliance electricity use","Consommation électrique des appareils");
  note.textContent=say("Estimate 30 days of use. Enter hours when the appliance draws power. The price is optional and excludes fixed fees.","Estimation sur 30 jours. Indiquez les heures de fonctionnement effectif. Le prix du kWh est facultatif et exclut les frais fixes.");
  const devices=[["Air conditioner","Climatiseur",1500],["Refrigerator","Réfrigérateur",150],["TV","Téléviseur",120],["Ceiling fan","Ventilateur",75],["LED bulb","Ampoule LED",10],["Water pump","Pompe à eau",750],["Iron","Fer à repasser",1000],["Washing machine","Lave-linge",500],["Microwave","Micro-ondes",1200],["Desktop computer","Ordinateur de bureau",200],["Laptop","Ordinateur portable",65],["Freezer","Congélateur",200]];
  const rows=devices.map(([en,native,power],index)=>{
    const group=document.createElement("fieldset");const legend=document.createElement("legend");legend.textContent=say(en,native);group.append(legend);
    const watts=field(say("Rated watts","Puissance (W)"),"number","watts"+index,power);
    const hours=field(say("Hours per day","Heures par jour"),"number","hours"+index);hours.max="24";
    group.append(watts.parentElement,hours.parentElement);form.append(group);return {name:legend.textContent,watts,hours};
  });
  calculate.textContent=say("Calculate consumption","Calculer la consommation");
  finish(()=>{
   const items=[];
   for(const row of rows){if(row.hours.value==="")continue;const hours=row.hours.valueAsNumber,power=row.watts.valueAsNumber;if(!(hours>=0&&hours<=24&&power>0))return row.name+" · "+say("Enter 0–24 hours and a positive wattage.","Saisissez entre 0 et 24 heures et une puissance positive.");items.push({name:row.name,kWh:power*hours*30/1000});}
   if(!items.length)return say("Enter daily hours for at least one appliance.","Indiquez les heures par jour pour au moins un appareil.");
   if(rate.value!=="" && !(rate.valueAsNumber>=0))return say("Correct the price per kWh or leave it blank.","Corrigez le prix du kWh ou laissez ce champ vide.");
   const total=items.reduce((sum,item)=>sum+item.kWh,0);
   return fmt(total)+say(" kWh in 30 days"," kWh sur 30 jours")+(rate.value!==""?" · "+money(total*rate.valueAsNumber):"")+" · "+items.map(item=>item.name+" "+fmt(item.kWh)+" kWh").join(", ");
  });
};

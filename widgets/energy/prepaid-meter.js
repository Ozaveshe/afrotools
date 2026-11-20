window.AfroWidgets = window.AfroWidgets || {};
window.AfroWidgets.prepaidMeter = function (root, options) {
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
  title.textContent=say("Prepaid electricity estimate","Estimation d’une recharge électrique");
  note.textContent=say("Use your latest recharge receipt. Enter a price for the same tariff block as your planned purchase.","Reprenez le dernier reçu de recharge et le prix de la tranche applicable à votre achat.");
  const amount=field(say("Top-up amount","Montant de la recharge"),"number","amount");
  const fees=field(say("Total deductions, taxes and debt recovery on this purchase","Total des retenues, taxes et remboursements sur cet achat"),"number","fees",0);
  const consumption=field(say("Your daily consumption in kWh (optional)","Consommation quotidienne en kWh (facultatif)"),"number","use");
  country.addEventListener("change",()=>{fees.value="0";});
  calculate.textContent=say("Estimate units","Estimer les kWh");
  finish(()=>{
    const sum=amount.valueAsNumber, price=rate.valueAsNumber, deductions=fees.valueAsNumber, usage=consumption.valueAsNumber;
    if(!(sum>0&&price>0&&deductions>=0&&deductions<=sum) || (consumption.value!=="" && !(usage>0))) return say("Enter a positive recharge and unit price. Deductions must be between zero and the recharge amount. Enter positive daily use or leave it blank.","Saisissez une recharge et un tarif positifs. Les retenues doivent être comprises entre zéro et le montant de la recharge. Indiquez une consommation positive ou laissez ce champ vide.");
    const net=sum-deductions, units=net/price;
    return fmt(units)+" kWh · "+say("Energy credit","Crédit énergie")+" "+money(net)+(usage>0?" · "+fmt(units/usage)+say(" days at your usage"," jours à votre consommation"):"");
  });
};

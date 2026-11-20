window.AfroWidgets = window.AfroWidgets || {};
window.AfroWidgets.Ovulation = function(root, options) {
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
  const due=false;
  node("h2",due?say("Estimated due date","Date prévue d’accouchement"):say("Ovulation estimate","Période probable d’ovulation"));
  const label=node("label",say("First day of your last period","Premier jour de vos dernières règles")),period=node("input","",label);period.type="date";period.className="aw-input";
  const length=number(say("Usual cycle length in days","Durée habituelle du cycle en jours"),form,28);
  const guide=node("a",due?say("NHS guide to pregnancy dating","Guide du NHS sur la datation de la grossesse"):say("NHS guide to ovulation timing","Guide du NHS sur le moment de l’ovulation"));guide.href=due?"https://www.nhs.uk/pregnancy/finding-out/due-date-calculator/":"https://www.nhs.uk/conditions/periods/fertility-in-the-menstrual-cycle/";guide.target="_blank";guide.rel="noopener";
  const today=new Date(),isoToday=[today.getFullYear(),String(today.getMonth()+1).padStart(2,"0"),String(today.getDate()).padStart(2,"0")].join("-");period.max=isoToday;
  const day=86400000,dateText=ms=>new Intl.DateTimeFormat(fr?"fr":"en",{dateStyle:"long",timeZone:"UTC"}).format(ms);
  finish(()=>{const first=period.valueAsNumber,cycle=length.valueAsNumber,now=Date.parse(isoToday+"T00:00:00Z");if(!Number.isFinite(first)||first>now||!Number.isInteger(cycle)||cycle<17||cycle>60)return say("Enter a past or current period start and a usual cycle length of 17 to 60 days for this estimate.","Indiquez un début de règles passé ou actuel et une durée habituelle de 17 à 60 jours pour cette estimation.");
   const end=first+(280+cycle-28)*day;
   if(due){const age=Math.max(0,Math.floor((now-first)/day)-(cycle-28));let result=say("Estimated due date","Date prévue")+" · "+dateText(end);
   if(age<=294){result+=" · "+say("Estimated gestation","Âge gestationnel estimé")+" "+Math.floor(age/7)+say(" weeks and "," semaines et ")+(age%7)+say(" days"," jours")+" · "+say("Days until due date","Jours avant le terme prévu")+" "+Math.max(0,Math.round((end-now)/day));}
   return result+" · "+say("An early dating scan can refine this estimate.","Une échographie de datation peut préciser ce terme.");}
   const next=first+cycle*day;
   return say("Possible ovulation dates","Période probable d’ovulation")+" · "+dateText(next-16*day)+" – "+dateText(next-10*day)+" · "+say("Estimated next period","Prochaines règles estimées")+" · "+dateText(next)+" · "+say("Timing varies, especially with irregular cycles. These dates cannot establish safe days for contraception.","La période varie, surtout avec des cycles irréguliers. Ces dates ne permettent pas d’identifier des jours sûrs pour la contraception.");
  });
};

window.AfroWidgets = window.AfroWidgets || {};
window.AfroWidgets.water_intake = function(root, options) {
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
  node("h2",say("Daily drink planner","Planifier les boissons de la journée"));
  node("p",say("The NHS suggests 6–8 cups or glasses of fluid daily as a general guide. Needs vary with heat, activity and pregnancy. If you have a prescribed fluid limit, use that limit.","Le NHS propose 6 à 8 verres ou tasses par jour comme repère général. Les besoins varient avec la chaleur, l’activité et la grossesse. Si une limite de liquides vous a été prescrite, suivez-la."));
  const glass=number(say("Your glass size (mL)","Contenance du verre (mL)"),form,250),drunk=number(say("Glasses already consumed","Verres déjà bus"),form,0),target=number(say("Your daily target (mL, optional)","Objectif quotidien personnel (mL, facultatif)"),form);
  const source=node("a",say("NHS hydration guide","Guide du NHS sur l’hydratation"));source.href="https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/water-drinks-nutrition/";source.target="_blank";source.rel="noopener";
  finish(()=>{const size=glass.valueAsNumber,count=drunk.valueAsNumber,goal=target.valueAsNumber;if(!(size>0&&count>=0)||target.value!==""&&!(goal>0))return say("Check the glass size, count and optional target.","Vérifiez la contenance, le nombre de verres et l’objectif éventuel.");const actual=size*count;
   return say("Consumed","Volume bu")+" "+num(actual)+" mL · "+(target.value!==""?say("Remaining to your target","Volume restant pour votre objectif")+" "+num(Math.max(0,goal-actual))+" mL":say("6–8 of these glasses contain","6 à 8 de ces verres représentent")+" "+num(6*size)+"–"+num(8*size)+" mL");});
};

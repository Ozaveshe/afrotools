window.AfroWidgets = window.AfroWidgets || {};
window.AfroWidgets.Calorie = function(root, options) {
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
  node("h2",say("Adult energy expenditure estimate","Estimation de la dépense énergétique de l’adulte"));
  const age=number(say("Age in years (19–78)","Âge en années (19 à 78)"),form),height=number(say("Height (cm)","Taille (cm)"),form),weight=number(say("Weight (kg)","Poids (kg)"),form);const sex=node("select","",node("label",say("Sex coefficient in the equation","Coefficient de sexe de la formule")));sex.className="aw-select";sex.add(new Option(say("Female","Féminin"),"-161"));sex.add(new Option(say("Male","Masculin"),"5"));
  const activity=node("select","",node("label",say("Activity assumption","Hypothèse d’activité")));activity.className="aw-select";for(const [en,frLabel,val] of [["Sedentary","Sédentaire",1.2],["Light","Légère",1.375],["Moderate","Modérée",1.55],["High","Élevée",1.725],["Very high","Très élevée",1.9]])activity.add(new Option(say(en,frLabel)+" × "+num(val),val));
  node("p",say("This estimates daily energy expenditure for adults. Pregnancy, breastfeeding and medical conditions require individual assessment.","Cette simulation estime la dépense énergétique des adultes. Une grossesse, l’allaitement ou une affection médicale nécessitent une évaluation individuelle."));
  const source=node("a",say("Mifflin–St Jeor resting-energy study","Étude de Mifflin–St Jeor sur la dépense au repos"));source.href="https://pubmed.ncbi.nlm.nih.gov/2305711/";source.target="_blank";source.rel="noopener";
  finish(()=>{const years=age.valueAsNumber,cm=height.valueAsNumber,kg=weight.valueAsNumber,rest=10*kg+6.25*cm-5*years+Number(sex.value);if(!(Number.isInteger(years)&&years>=19&&years<=78&&cm>0&&kg>0&&rest>0))return say("Enter an age from 19 to 78 and positive height and weight.","Indiquez un âge de 19 à 78 ans et des mesures positives.");
  return say("At rest","Au repos")+" "+num(Math.round(rest))+" kcal/"+say("day","jour")+" · "+say("With your activity assumption","Avec l’hypothèse d’activité")+" "+num(Math.round(rest*Number(activity.value)))+" kcal/"+say("day","jour");});
};

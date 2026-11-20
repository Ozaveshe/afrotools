window.AfroWidgets = window.AfroWidgets || {};
window.AfroWidgets.WaistHip = function(root, options) {
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
  const bmi=false;
  node("h2",bmi?say("Adult body mass index","Indice de masse corporelle de l’adulte"):say("Waist-to-hip ratio","Rapport taille-hanches"));
  node("p",bmi?say("For adults aged 20 or older. BMI is a screening measure and cannot distinguish muscle from fat.","Pour les adultes de 20 ans et plus. L’IMC est un indicateur de dépistage qui ne distingue pas la masse musculaire de la masse grasse."):say("Measure the waist midway between the lowest rib and top of the hip bone after a normal breath out. Measure hips at their widest point. Keep the tape level and snug.","Après une expiration normale, mesurez la taille à mi-distance entre la dernière côte et le haut de l’os de la hanche. Mesurez les hanches au point le plus large. Gardez le ruban horizontal et ajusté."));
  const units=node("select","",node("label",say("Units","Unités")));units.className="aw-select";units.add(new Option(bmi?say("Centimetres and kilograms","Centimètres et kilogrammes"):"cm","metric"));units.add(new Option(bmi?say("Feet, inches and pounds","Pieds, pouces et livres"):say("Inches","Pouces"),"imperial"));
  const first=number("",form),extra=number(say("Additional inches","Pouces supplémentaires"),form),second=number("",form);
  function update(){const metric=units.value==="metric";first.parentElement.firstChild.nodeValue=bmi?(metric?say("Height (cm)","Taille (cm)"):say("Height (feet)","Taille (pieds)")):say("Waist circumference","Tour de taille")+" ("+(metric?"cm":say("in","po"))+")";second.parentElement.firstChild.nodeValue=bmi?(metric?say("Weight (kg)","Poids (kg)"):say("Weight (lb)","Poids (livres)")):say("Hip circumference","Tour de hanches")+" ("+(metric?"cm":say("in","po"))+")";extra.parentElement.hidden=!bmi||metric;for(const input of [first,extra,second])input.value="";}
  first.parentElement.prepend(document.createTextNode(" "));second.parentElement.prepend(document.createTextNode(" "));update();units.addEventListener("change",update);
  const ref=node("a",bmi?say("CDC adult BMI categories","Catégories d’IMC adulte du CDC"):say("WHO measurement guide","Guide de mesure de l’OMS"));ref.href=bmi?"https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html":"https://www.who.int/publications/i/item/9789241501491";ref.target="_blank";ref.rel="noopener";
  finish(()=>{const a=first.valueAsNumber,b=second.valueAsNumber,metric=units.value==="metric",inch=extra.value===""?0:extra.valueAsNumber;
   if(!(a>0&&b>0)||bmi&&!metric&&!(Number.isInteger(a)&&inch>=0&&inch<12))return say("Enter positive measurements in the selected units. Additional inches must be less than 12.","Indiquez des mesures positives dans les unités choisies. Les pouces supplémentaires doivent être inférieurs à 12.");
   if(!bmi)return say("Waist-to-hip ratio","Rapport taille-hanches")+" "+num(a/b)+" · "+num(a)+" ÷ "+num(b);
   const metres=metric?a/100:(a*12+inch)*0.0254,kg=metric?b:b*0.45359237,index=kg/(metres*metres),category=index<18.5?say("Underweight","Insuffisance pondérale"):index<25?say("Healthy weight","Corpulence dans la plage de référence"):index<30?say("Overweight","Surpoids"):say("Obesity","Obésité");
   return (fr?"IMC ":"BMI ")+num(index)+" kg/m² · "+category+" · "+say("BMI reference weight range","Poids correspondant à un IMC de 18,5 à moins de 25")+" "+num(18.5*metres*metres)+say(" to under "," à moins de ")+num(25*metres*metres)+" kg";});
};

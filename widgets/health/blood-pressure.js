window.AfroWidgets = window.AfroWidgets || {};
window.AfroWidgets.BloodPressure = function(root, options) {
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
  node("h2",say("Adult blood pressure reading","Lecture de la tension artérielle chez l’adulte"));
  node("p",say("For adults who are not pregnant. During pregnancy, contact maternity care for interpretation promptly. Chest pain, trouble breathing or new weakness or speech or vision changes need emergency care regardless of the reading.","Pour les adultes hors grossesse. En cas de grossesse, demandez rapidement un avis à la maternité. Une douleur thoracique, un essoufflement ou un trouble soudain de la force, de la parole ou de la vision nécessitent les secours, quelle que soit la mesure."));
  const sys=number(say("Systolic (upper, mmHg)","Systolique (valeur haute, mmHg)"),form),dia=number(say("Diastolic (lower, mmHg)","Diastolique (valeur basse, mmHg)"),form);
  const source=node("a",say("American Heart Association reading categories","Catégories de l’American Heart Association"));source.href="https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings";source.target="_blank";source.rel="noopener";
  finish(()=>{const s=sys.valueAsNumber,d=dia.valueAsNumber;if(!(s>d&&d>0&&Number.isInteger(s)&&Number.isInteger(d)))return say("Enter positive whole numbers with the upper number above the lower number.","Indiquez des nombres entiers positifs, la valeur systolique supérieure à la diastolique.");
   let advice;if(s>180||d>120)advice=say("Severely high reading. With symptoms, call local emergency services now. Without symptoms, wait at least one minute and measure again. If still this high, contact a health professional immediately.","Valeur très élevée. En présence de symptômes, appelez immédiatement les secours locaux. Sans symptômes, attendez au moins une minute et reprenez la mesure. Si elle reste aussi élevée, contactez immédiatement un professionnel de santé.");
   else if(s>=140||d>=90)advice=say("Stage 2 range (AHA). Arrange a clinical review. One reading cannot establish hypertension.","Plage de stade 2 (AHA). Prenez rendez-vous pour un avis médical. Une seule mesure ne permet pas de diagnostiquer une hypertension.");
   else if(s>=130||d>=80)advice=say("Stage 1 range (AHA). Record repeat readings and discuss them with a clinician.","Plage de stade 1 (AHA). Notez plusieurs mesures et discutez-en avec un professionnel de santé.");
   else if(s>=120)advice=say("Elevated range (AHA). Record repeat readings.","Plage élevée (AHA). Notez plusieurs mesures.");
   else if(s<90||d<60)advice=say("Low reading. If dizzy or faint, seek medical advice.","Valeur basse. En cas de vertiges ou de malaise, demandez un avis médical.");
   else advice=say("Normal range (AHA).","Plage normale (AHA).");return s+"/"+d+" mmHg · "+advice;});
};

window.AfroWidgets = window.AfroWidgets || {};
window.AfroWidgets.WAEC = function(root, options) {
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
  node("h2",say("WAEC / NECO subject points","Points par matière WAEC / NECO"));
  const wrapper=node("label",say("Calculation","Calcul")),mode=node("select","",wrapper);mode.className="aw-select";
  mode.add(new Option(say("Five subjects you select","Cinq matières de votre choix"),"five"));mode.add(new Option(say("University of Ghana · science aggregate","Université du Ghana · filière scientifique"),"science"));mode.add(new Option(say("University of Ghana · non-science aggregate","Université du Ghana · filière non scientifique"),"arts"));
  node("p",say("Enter the subjects required by your programme. A1 counts as one point and F9 as nine. A lower total is better. This subtotal does not determine admission.","Saisissez les matières exigées par votre formation. A1 vaut un point et F9 neuf points. Un total plus faible est préférable. Ce sous-total ne détermine pas l’admission."));
  const ref=node("a",say("University of Ghana subject requirements","Matières exigées par l’Université du Ghana"));ref.href="https://admissions.ug.edu.gh/undergraduate/entry-requirements";ref.target="_blank";ref.rel="noopener";
  const names=["English","Mathematics","Integrated Science","Social Studies","Physics","Chemistry","Biology","Economics","Government","Literature","Geography","Accounting","Commerce","CRS/IRS","Civic Education","Agricultural Science","Further Mathematics"];
  const translated=["Anglais","Mathématiques","Sciences intégrées","Études sociales","Physique","Chimie","Biologie","Économie","Institutions politiques","Littérature","Géographie","Comptabilité","Commerce","Études religieuses","Éducation civique","Sciences agricoles","Mathématiques avancées"];
  const rows=[],holder=node("div","");
  function render(){holder.replaceChildren();rows.length=0;const gh=mode.value!=="five";for(let i=0;i<(gh?6:5);i++){
   const box=node("fieldset","",holder);node("legend",gh?(i<3?say("Core subject ","Matière obligatoire "):say("Relevant elective ","Option pertinente "))+((i%3)+1):say("Subject ","Matière ")+(i+1),box);
   const subject=node("input","",node("label",say("Subject name","Nom de la matière"),box));subject.className="aw-input";subject.setAttribute("list","aw-waec-subjects");
   if(gh&&i<3){const index=i<2?i:mode.value==="science"?2:3;subject.value=(fr?translated:names)[index];subject.readOnly=true;}
   const grade=node("select","",node("label",say("Grade","Note"),box));grade.className="aw-select";grade.add(new Option("—",""));["A1","B2","B3","C4","C5","C6","D7","E8","F9"].forEach((g,i)=>grade.add(new Option(g,String(i+1))));rows.push({subject,grade});
  }}
  const list=node("datalist","");list.id="aw-waec-subjects";for(const s of (fr?translated:names))list.append(new Option(s));
  mode.addEventListener("change",render);render();
  finish(()=>{
   const seen=new Set();let total=0,credits=0;
   for(const [index,{subject,grade}] of rows.entries()){const key=subject.value.trim().toLocaleLowerCase();if(!key||!grade.value)return say("Complete subject and grade in row ","Renseignez la matière et la note à la ligne ")+(index+1);
   if(seen.has(key))return say("Each subject can count only once: ","Chaque matière ne compte qu’une fois : ")+subject.value;seen.add(key);total+=Number(grade.value);if(Number(grade.value)<=6)credits++;}
   return say("Total grade points","Total des points")+" "+total+" · "+say("Grades A1–C6","Notes de A1 à C6")+" "+credits+" / "+rows.length;
  });
};

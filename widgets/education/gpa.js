window.AfroWidgets = window.AfroWidgets || {};
window.AfroWidgets.GPA = function(root, options) {
  const scales={"nigerian-5":{name:"🇳🇬 Nigerian Federal (5.0)",scale:5,grades:{A:5,B:4,C:3,D:2,E:1,F:0},classes:[{name:"First Class",min:4.5},{name:"2nd Upper",min:3.5},{name:"2nd Lower",min:2.4},{name:"Third",min:1.5},{name:"Pass",min:1},{name:"Fail",min:0}]},"nigerian-4":{name:"🇳🇬 Nigerian Private (4.0)",scale:4,grades:{A:4,"B+":3.5,B:3,"C+":2.5,C:2,D:1,F:0},classes:[{name:"First Class",min:3.6},{name:"2.1",min:3},{name:"2.2",min:2.5},{name:"Third",min:2},{name:"Pass",min:1},{name:"Fail",min:0}]},kenyan:{name:"🇰🇪 Kenyan (4.0 +/-)",scale:4,grades:{A:4,"A-":3.7,"B+":3.3,B:3,"B-":2.7,"C+":2.3,C:2,"C-":1.7,"D+":1.3,D:1,"D-":.7,E:0},classes:[{name:"First Class",min:3.6},{name:"2.1",min:3},{name:"2.2",min:2.5},{name:"Pass",min:2},{name:"Fail",min:0}]},ghanaian:{name:"🇬🇭 Ghanaian (4.0)",scale:4,grades:{A:4,"B+":3.5,B:3,"C+":2.5,C:2,"D+":1.5,D:1,F:0},classes:[{name:"First Class",min:3.6},{name:"2.1",min:3},{name:"2.2",min:2.5},{name:"Third",min:2},{name:"Fail",min:0}]},sa:{name:"🇿🇦 South African (%)",scale:100,inputType:"percentage",grades:null,classes:[{name:"Distinction",min:75},{name:"Merit",min:70},{name:"Credit",min:60},{name:"Pass",min:50},{name:"Fail",min:0}]},"east-african":{name:"🌍 East African (5.0)",scale:5,grades:{A:5,"B+":4,B:3.5,"C+":3,C:2.5,"C-":2,D:1.5,F:0},classes:[{name:"First Class",min:4.4},{name:"2.1",min:3.6},{name:"2.2",min:2.8},{name:"Pass",min:2},{name:"Fail",min:0}]},ethiopian:{name:"🇪🇹 Ethiopian (4.0)",scale:4,grades:{"A+":4,A:4,"A-":3.75,"B+":3.5,B:3,"B-":2.75,"C+":2.5,C:2,"C-":1.75,D:1,F:0},classes:[{name:"Great Distinction",min:3.75},{name:"Distinction",min:3.5},{name:"Very Great Credit",min:3},{name:"Great Credit",min:2.5},{name:"Pass",min:2},{name:"Fail",min:0}]},francophone:{name:"🌍 Francophone (/20)",scale:20,inputType:"score",grades:null,classes:[{name:"Très Bien",min:16},{name:"Bien",min:14},{name:"Assez Bien",min:12},{name:"Passable",min:10},{name:"Fail",min:0}]},egyptian:{name:"🇪🇬 Egyptian (%)",scale:100,inputType:"percentage",grades:null,classes:[{name:"Excellent",min:85},{name:"Very Good",min:75},{name:"Good",min:65},{name:"Pass",min:50},{name:"Fail",min:0}]}};
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
  node("h2",say("Course and cumulative GPA","Moyenne pondérée et moyenne cumulée"));
  node("p",say("Select a scale matching your transcript. Letter scales are examples; compare the listed points with your institution’s rules.","Choisissez le barème de votre relevé. Les barèmes par lettres sont des exemples. Vérifiez les points affichés auprès de votre établissement."));
  const host=node("label",say("Grading scale","Barème de notation")), system=node("select","",host);system.className="aw-select";
  const names={"nigerian-5":"Nigeria · 5","nigerian-4":"Nigeria · 4",kenyan:"Kenya · 4",ghanaian:"Ghana · 4",sa:say("South Africa","Afrique du Sud")+" · 100","east-african":say("East Africa","Afrique de l’Est")+" · 5",ethiopian:say("Ethiopia","Éthiopie")+" · 4",francophone:"Francophone · 20",egyptian:say("Egypt","Égypte")+" · 100"};
  for(const [id,label] of Object.entries(names)) system.add(new Option(label,id));
  const holder=node("div",""),rows=[];
  function showGrade(row){const model=scales[system.value];row.wrap.replaceChildren();row.wrap.textContent=say("Grade","Note");if(model.grades){row.grade=node("select","",row.wrap);row.grade.className="aw-select";row.grade.add(new Option("—",""));for(const [letter,points] of Object.entries(model.grades))row.grade.add(new Option(letter+" · "+num(points),letter));}else{row.grade=node("input","",row.wrap);row.grade.type="number";row.grade.step="any";row.grade.min="0";row.grade.max=model.scale;row.grade.className="aw-input";}}
  function add(){const group=node("fieldset","",holder);node("legend",say("Course ","Cours ")+(rows.length+1),group);const credits=number(say("Credits","Crédits"),group);const row={group,credits,wrap:node("label","",group)};rows.push(row);showGrade(row);}
  add();add();const more=action(say("Add a course","Ajouter un cours"),"button");more.addEventListener("click",add);
  const priorGpa=number(say("Previous GPA, optional","Moyenne précédente (facultatif)"),form),priorCredits=number(say("Previous total credits, optional","Crédits précédents (facultatif)"),form);
  system.addEventListener("change",()=>{rows.forEach(showGrade);priorGpa.value="";});
  finish(()=>{const model=scales[system.value];let points=0,total=0;for(const [index,row] of rows.entries()){if(!row.grade.value&&!row.credits.value)continue;const credits=row.credits.valueAsNumber,grade=model.grades?model.grades[row.grade.value]:row.grade.valueAsNumber;if(!(credits>0&&row.grade.value!==""&&grade>=0&&grade<=model.scale))return say("Complete credits and grade for course ","Vérifiez les crédits et la note du cours ")+(index+1);points+=credits*grade;total+=credits;}
   if(!total)return say("Enter a grade and credits for at least one course.","Indiquez une note et des crédits pour au moins un cours.");
   let summary=say("Current average","Moyenne de la période")+" "+num(points/total)+" / "+model.scale+" · "+num(total)+say(" credits"," crédits");
   if(priorGpa.value!==""||priorCredits.value!==""){const prev=priorGpa.valueAsNumber,credits=priorCredits.valueAsNumber;if(!(prev>=0&&prev<=model.scale&&credits>0))return say("Enter both previous GPA and credits on the same scale.","Indiquez la moyenne précédente et les crédits correspondants sur le même barème.");summary+=" · "+say("Cumulative GPA","Moyenne cumulée")+" "+num((points+prev*credits)/(total+credits))+" / "+model.scale;}
   return summary;
  });
};

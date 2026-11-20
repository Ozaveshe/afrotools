window.AfroWidgets = window.AfroWidgets || {};
window.AfroWidgets.JAMBAggregate = function(root, options) {
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
  node("h2",say("JAMB admission score estimate","Simulation du score d’admission JAMB"));
  node("p",say("Use the weights and maximum marks from your institution’s current admissions notice. The initial 50/50 split is an example. Set an unused component’s weight to zero.","Reprenez les pondérations et les notes maximales de l’avis d’admission actuel de votre établissement. La répartition initiale de 50/50 est un exemple. Indiquez zéro pour une épreuve non retenue."));
  const components=["UTME","Post-UTME","O’Level"].map((name,index)=>{const box=node("fieldset","");node("legend",name,box);return{name,score:number(say("Your score","Votre note"),box),max:number(say("Maximum score","Note maximale"),box,index===0?400:100),weight:number(say("Weight (%)","Pondération (%)"),box,index===2?0:50)};});
  const cutoff=number(say("Published course threshold out of 100 (optional)","Seuil publié pour la filière sur 100 (facultatif)"),form);
  finish(()=>{
   const weights=components.map(c=>c.weight.valueAsNumber);if(weights.some(w=>!(w>=0&&w<=100))||Math.abs(weights.reduce((a,b)=>a+b,0)-100)>0.00001)return say("Component weights must total 100%.","Les pondérations doivent totaliser 100 %.");
   let aggregate=0;const breakdown=[];
   for(const [i,c] of components.entries()){if(weights[i]===0)continue;const s=c.score.valueAsNumber,m=c.max.valueAsNumber;if(!(m>0&&s>=0&&s<=m))return c.name+" · "+say("Enter a score between zero and the stated maximum.","Indiquez une note entre zéro et le maximum déclaré.");const points=s/m*weights[i];aggregate+=points;breakdown.push(c.name+" "+num(points));}
   const target=cutoff.valueAsNumber;if(cutoff.value!==""&&!(target>=0&&target<=100))return say("The threshold must be between 0 and 100.","Le seuil doit être compris entre 0 et 100.");
   return num(aggregate)+" / 100 · "+breakdown.join(" + ")+(cutoff.value!==""?" · "+(aggregate>=target?say("At or above the entered threshold","Seuil saisi atteint"):say("Below the entered threshold","Sous le seuil saisi")):"");
  });
};
window.AfroWidgets.jambAggregate = window.AfroWidgets.JAMBAggregate;
window.AfroWidgets.jamb_aggregate = window.AfroWidgets.JAMBAggregate;

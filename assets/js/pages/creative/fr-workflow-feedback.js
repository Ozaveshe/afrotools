(() => {
 'use strict';
 const mount=document.getElementById('tool-mount');
 if(!mount)return;
 const id=mount.dataset.frCreativeNative;
 if(id==='self-publishing-royalty') {
   const compare=window.calculate;
   window.calculate=()=>{
     const fields=['bookPrice','monthlySales'];
     if(document.getElementById('format').value!=='ebook')fields.push('pageCount');
     for(const key of fields){
       const control=document.getElementById(key);
       if(!(Number(control.value)>0) || (key!=='bookPrice' && !Number.isInteger(Number(control.value)))) {
         window.AfroTools.CreativeResultTools.reject('Saisissez une valeur positive pour calculer vos droits.',key);
         return;
       }
     }
     window.AfroTools.CreativeResultTools.clearStatus();
     compare();
     const best=document.getElementById('bestPlatform');
     best.textContent=best.textContent.replace(/^Best:/,'Scénario maximal :').replace('/month',' par mois');
     mount.querySelectorAll('.winner-badge').forEach(el=>{el.textContent='Maximum simulé';});
   };
 }
 function invalidate() {
   const output=mount.querySelector('#results');
   if(output)output.classList.remove('on');
   const actions=mount.querySelector('[data-creative-result-actions]');
   if(actions && output && !output.contains(actions)) actions.hidden=true;
 }
 mount.addEventListener('input',invalidate);
 mount.addEventListener('change',invalidate);
})();

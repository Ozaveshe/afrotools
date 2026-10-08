(function(){
  "use strict";
  var root=document.querySelector("[data-etims-guide-sw]");if(!root)return;
  var key="afrotools_sw_etims_progress_v1",checks=Array.prototype.slice.call(root.querySelectorAll("[data-check]")),ids=checks.map(function(el){return el.dataset.check;});
  var status=root.querySelector("[data-status]"),progress=root.querySelector("[data-progress]"),label=root.querySelector("[data-progress-label]"),protectedStorage=false,revision=0,importAttempt=0;
  var unsaved="Mabadiliko yanapatikana katika kipindi hiki pekee. Pakua JSON kwa nakala. Hifadhi iliyopo haijabadilishwa; futa alama kwa hiari au ingiza nakala halali ili kuibadilisha.";
  function feedback(message,error){status.textContent=message;status.classList.toggle("is-error",!!error);}
  function snapshot(){var done=checks.filter(function(el){return el.checked;}).map(function(el){return el.dataset.check;});return{schema:"afrotools.etims-progress",version:1,locale:"sw",sourceReviewed:"2026-08-09",completed:done};}
  function validate(data){
    if(!data||data.schema!=="afrotools.etims-progress"||data.version!==1||!Array.isArray(data.completed)||data.completed.length>ids.length||data.completed.some(function(id,index){return!ids.includes(id)||data.completed.indexOf(id)!==index;}))throw new Error("invalid");
    return{schema:"afrotools.etims-progress",version:1,locale:"sw",sourceReviewed:"2026-08-09",completed:data.completed.slice()};
  }
  function render(){var count=snapshot().completed.length;progress.value=Math.round(count/ids.length*100);label.textContent=count+"/"+ids.length;}
  function apply(data){checks.forEach(function(el){el.checked=data.completed.includes(el.dataset.check);});render();}
  function persist(data,replace){
    if(protectedStorage&&!replace){feedback(unsaved,true);return false;}
    try{localStorage.setItem(key,JSON.stringify(data));protectedStorage=false;return true;}
    catch(_e){protectedStorage=true;feedback(unsaved,true);return false;}
  }
  function download(name,type,text){var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:type}));a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},0);}
  checks.forEach(function(el){el.addEventListener("change",function(){revision+=1;render();if(persist(snapshot(),false))feedback("Maendeleo yamehifadhiwa kwenye kifaa hiki pekee.",false);});});
  try{var raw=localStorage.getItem(key);if(raw)apply(validate(JSON.parse(raw)));else render();}
  catch(_e){protectedStorage=true;render();feedback("Maendeleo yaliyohifadhiwa hayawezi kusomwa. Hayajafutwa. Pakua mabadiliko ya kipindi hiki au ingiza nakala halali.",true);}
  root.querySelector("[data-json]").addEventListener("click",function(){download("maendeleo-etims.json","application/json;charset=utf-8",JSON.stringify(snapshot(),null,2));feedback("JSON imepakuliwa; ina alama za hatua pekee.",false);});
  root.querySelector("[data-txt]").addEventListener("click",function(){
    var data=snapshot(),lines=["MWONGOZO WA KRA eTIMS \u2014 MAENDELEO","Chanzo kimehakikiwa: 9 Agosti 2026","Hatua zilizokamilika: "+data.completed.length+"/"+ids.length,""];
    checks.forEach(function(el){lines.push((el.checked?"[x] ":"[ ] ")+el.closest("label").textContent.trim());});
    lines.push("","Hakuna PIN, nenosiri, OTP, data ya ankara au mteja katika faili hii.");download("maendeleo-etims.txt","text/plain;charset=utf-8",lines.join("\n"));feedback("TXT imepakuliwa; ina alama za hatua pekee.",false);
  });
  root.querySelector("[data-import]").addEventListener("change",async function(){
    var file=this.files&&this.files[0];this.value="";if(!file)return;var attempt=++importAttempt,currentRevision=revision;
    try{
      if(file.size>32768)throw new Error("size");var data=validate(JSON.parse(await file.text()));
      if(attempt!==importAttempt||currentRevision!==revision)return;
      if((protectedStorage||snapshot().completed.length)&&!window.confirm("Badilisha alama za sasa na zilizohifadhiwa kwa alama za nakala hii?"))return;
      if(!persist(data,true))return;apply(data);revision+=1;feedback("Maendeleo ya JSON yamefunguliwa kwenye kifaa hiki.",false);
    }catch(_e){if(attempt===importAttempt&&currentRevision===revision)feedback("JSON haikubaliki au haisomeki. Alama zako hazijabadilika. Tumia faili ya maendeleo iliyopakuliwa na zana hii.",true);}
  });
  root.querySelector("[data-reset]").addEventListener("click",function(){
    revision+=1;importAttempt+=1;var data=snapshot();data.completed=[];
    if(!persist(data,true))return;apply(data);feedback("Alama zote zimefutwa kwenye kifaa hiki.",false);checks[0].focus();
  });
})();

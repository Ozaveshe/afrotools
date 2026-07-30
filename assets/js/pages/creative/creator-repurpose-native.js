(function () {
  "use strict";
  var root = document.querySelector("[data-creator-repurpose-native]");
  var engine = window.AfroTools && window.AfroTools.RepurposeEngine;
  if (!root || !engine) return;
  var fr = root.getAttribute("data-lang") === "fr", form = root.querySelector("form"), output = root.querySelector("[data-output]"), actions = root.querySelector("[data-actions]"), status = root.querySelector("[data-status]");
  var last = null;
  function platforms() { return Array.prototype.map.call(form.querySelectorAll('[name="platform"]:checked'), function(input){ return input.value; }); }
  function esc(value) { return String(value).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  function render(result) { output.innerHTML = result.outputs.map(function(item){ return '<article class="ctn-result crn-result"><small>'+esc(item.platformLabel)+'</small><span>'+esc(item.text)+'</span></article>'; }).join(""); output.hidden=false; actions.hidden=false; }
  function download(name,type,body){var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([body],{type:type}));a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href);},0);status.textContent=fr?"Fichier téléchargé.":"File downloaded.";}
  function invalid(){status.textContent=fr?"Ajoutez au moins 20 caractères et choisissez une plateforme.":"Add at least 20 characters and choose a platform.";output.hidden=true;actions.hidden=true;}
  form.addEventListener("submit",function(event){event.preventDefault();try{last=engine.generateLocalOutputs(form.elements.source.value,form.elements.sourceType.value,platforms(),fr?"fr":"en");render(last);status.textContent=fr?"Brouillons créés localement. Vérifiez et adaptez chaque version.":"Drafts created locally. Review and adapt every version.";}catch(_){last=null;invalid();}});
  form.elements.source.addEventListener("invalid",invalid);
  root.querySelector("[data-json]").addEventListener("click",function(){if(last)download("creator-repurpose.json","application/json",JSON.stringify(last,null,2));});
  root.querySelector("[data-txt]").addEventListener("click",function(){if(last)download("creator-repurpose.txt","text/plain;charset=utf-8",last.outputs.map(function(item){return item.platformLabel+"\n"+item.text;}).join("\n\n---\n\n"));});
})();

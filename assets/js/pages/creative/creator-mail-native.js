(function () {
  "use strict";
  var root=document.querySelector("[data-creator-mail-native]"),engine=window.AfroTools&&window.AfroTools.CreatorMailEngine;if(!root||!engine)return;
  var fr=root.getAttribute("data-lang")==="fr",form=root.querySelector("form"),preview=root.querySelector("[data-preview]"),actions=root.querySelector("[data-actions]"),status=root.querySelector("[data-status]"),last=null;
  function download(name,type,body){var url=URL.createObjectURL(new Blob([body],{type:type})),link=document.createElement("a");link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(url);},0);status.textContent=fr?"Fichier téléchargé.":"File downloaded.";}
  form.addEventListener("submit",function(event){event.preventDefault();try{last=engine.buildNewsletter({subject:form.elements.subject.value,preheader:form.elements.preheader.value,headline:form.elements.headline.value,body:form.elements.body.value,cta:form.elements.cta.value,url:form.elements.url.value,sender:form.elements.sender.value});preview.srcdoc=engine.renderHtml(last,fr?"fr":"en");preview.hidden=false;actions.hidden=false;status.textContent=fr?"Aperçu local créé.":"Local preview created.";}catch(error){last=null;preview.hidden=true;actions.hidden=true;status.textContent=fr?"Vérifiez l’objet, le titre, le contenu et le lien.":"Check the subject, headline, body, and link.";}});
  root.querySelector("[data-html]").onclick=function(){if(last)download("creator-newsletter.html","text/html;charset=utf-8",engine.renderHtml(last,fr?"fr":"en"));};
  root.querySelector("[data-json]").onclick=function(){if(last)download("creator-newsletter.json","application/json",JSON.stringify(last,null,2));};
}());

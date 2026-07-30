(function () {
  "use strict";
  var root = document.querySelector("[data-creator-schedule-native]");
  var engine = window.AfroTools && window.AfroTools.CreatorScheduleEngine;
  if (!root || !engine) return;
  var fr = root.getAttribute("data-lang") === "fr", form = root.querySelector("form"), list = root.querySelector("[data-list]"), actions = root.querySelector("[data-actions]"), status = root.querySelector("[data-status]"), posts = [];
  function esc(value) { return String(value).replace(/[&<>"']/g, function (char) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]; }); }
  function download(name, type, body) { var url = URL.createObjectURL(new Blob([body], {type:type})), link = document.createElement("a"); link.href=url; link.download=name; document.body.appendChild(link); link.click(); link.remove(); setTimeout(function(){URL.revokeObjectURL(url);},0); status.textContent=fr?"Fichier téléchargé.":"File downloaded."; }
  function render() {
    var sorted = engine.sortPosts(posts);
    list.innerHTML = sorted.map(function (post) { return '<article class="ctn-result crn-result"><small>'+esc(post.platform)+'</small><span><strong>'+esc(post.title)+'</strong><br>'+esc(post.scheduledAt.replace("T"," "))+(post.note?"<br>"+esc(post.note):"")+'</span></article>'; }).join("");
    actions.hidden = !posts.length;
  }
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    try { posts.push(engine.createPost({title:form.elements.title.value,platform:form.elements.platform.value,scheduledAt:form.elements.scheduled.value,note:form.elements.note.value})); form.elements.title.value="";form.elements.note.value="";render();status.textContent=fr?"Publication ajoutée au plan local.":"Post added to the local plan."; }
    catch(_){status.textContent=fr?"Ajoutez un titre, une plateforme et une date valides.":"Add a valid title, platform, and date.";}
  });
  root.querySelector("[data-json]").onclick=function(){if(posts.length)download("creator-schedule.json","application/json",JSON.stringify({posts:engine.sortPosts(posts),boundary:fr?"Plan local uniquement ; aucune publication automatique.":"Local plan only; no automatic publishing."},null,2));};
  root.querySelector("[data-csv]").onclick=function(){if(posts.length)download("creator-schedule.csv","text/csv;charset=utf-8",engine.toCsv(posts));};
  render();
}());

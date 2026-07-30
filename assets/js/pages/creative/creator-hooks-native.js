(function () {
  "use strict";
  var root = document.querySelector("[data-creator-hooks-native]");
  var engine = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.creatorHooks;
  if (!root || !engine) return;
  var fr = root.getAttribute("data-lang") === "fr";
  var form = root.querySelector("form"), output = root.querySelector("[data-output]"), actions = root.querySelector("[data-actions]"), status = root.querySelector("[data-status]");
  var last = null;
  function esc(value) { return String(value).replace(/[&<>"']/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  function render(result) {
    output.innerHTML = result.hooks.map(function (hook) {
      return '<article class="ctn-result"><small>' + esc(hook.category.replace(/_/g, " ")) + '</small><span>' + esc(hook.text) + '</span><b>' + hook.readTimeSeconds + "s</b></article>";
    }).join("");
    output.hidden = false; actions.hidden = false;
  }
  function download(filename, type, body) {
    var link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([body], {type: type})); link.download = filename;
    document.body.appendChild(link); link.click(); link.remove(); setTimeout(function () { URL.revokeObjectURL(link.href); }, 0);
    status.textContent = fr ? "Fichier téléchargé." : "File downloaded.";
  }
  function invalid() { status.textContent = fr ? "Ajoutez un sujet avant de créer les accroches." : "Add a topic before creating hooks."; output.hidden = true; actions.hidden = true; }
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    try { last = engine.generateLocalHooks(form.elements.topic.value, form.elements.platform.value, fr ? "fr" : "en"); render(last); status.textContent = fr ? "6 accroches créées localement." : "6 hooks created locally."; }
    catch (_) { last = null; invalid(); }
  });
  form.elements.topic.addEventListener("invalid", invalid);
  root.querySelector("[data-json]").addEventListener("click", function () { if (last) download("creator-hooks.json", "application/json", JSON.stringify(last, null, 2)); });
  root.querySelector("[data-txt]").addEventListener("click", function () { if (last) download("creator-hooks.txt", "text/plain;charset=utf-8", last.hooks.map(function (hook) { return hook.text; }).join("\n")); });
})();

(function () {
  "use strict";
  var root = document.querySelector("[data-creator-titles-native]");
  var engine = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.creatorTitles;
  if (!root || !engine) return;
  var fr = root.getAttribute("data-lang") === "fr";
  var form = root.querySelector("form");
  var output = root.querySelector("[data-output]");
  var actions = root.querySelector("[data-actions]");
  var status = root.querySelector("[data-status]");
  var last = null;
  function esc(value) { return String(value).replace(/[&<>"']/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  function render(result) {
    output.innerHTML = result.titles.map(function (item) {
      return '<article class="ctn-result"><small>' + esc(item.style) + '</small><span>' + esc(item.title) + '</span><b>' + item.charCount + (fr ? " caractères" : " characters") + '</b></article>';
    }).join("");
    output.hidden = false;
    actions.hidden = false;
  }
  function download(filename, type, body) {
    var link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([body], {type: type}));
    link.download = filename;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 0);
    status.textContent = fr ? "Fichier téléchargé." : "File downloaded.";
  }
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    try {
      last = engine.generateLocalTitles(form.elements.topic.value, form.elements.platform.value, fr ? "fr" : "en");
      render(last);
      status.textContent = fr ? "8 titres créés localement. Relisez-les avant publication." : "8 titles created locally. Review them before publishing.";
    } catch (_) {
      last = null; output.hidden = true; actions.hidden = true;
      status.textContent = fr ? "Ajoutez un sujet avant de créer les titres." : "Add a topic before creating titles.";
    }
  });
  form.elements.topic.addEventListener("invalid", function () {
    status.textContent = fr ? "Ajoutez un sujet avant de créer les titres." : "Add a topic before creating titles.";
    output.hidden = true;
    actions.hidden = true;
  });
  root.querySelector("[data-json]").addEventListener("click", function () { if (last) download("creator-titles.json", "application/json", JSON.stringify(last, null, 2)); });
  root.querySelector("[data-txt]").addEventListener("click", function () { if (last) download("creator-titles.txt", "text/plain;charset=utf-8", last.titles.map(function (item) { return item.title; }).join("\n")); });
})();

(function () {
  "use strict";
  var root = document.querySelector("[data-creator-scripts-native]");
  var engine = window.AfroTools && window.AfroTools.CreatorScriptsEngine;
  if (!root || !engine) return;
  var language = root.getAttribute("data-lang") || "en";
  var fr = language === "fr", sw = language === "sw";
  var form = root.querySelector("form"), output = root.querySelector("[data-output]");
  var actions = root.querySelector("[data-actions]"), status = root.querySelector("[data-status]"), last = null;
  function esc(value) { return String(value).replace(/[&<>"']/g, function (char) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]; }); }
  function render(result) {
    output.innerHTML = result.sections.map(function (section) { return '<article class="ctn-result crn-result"><small>'+esc(section.label)+"<br>"+esc(section.timestamp)+'</small><span>'+esc(section.text)+'</span></article>'; }).join("");
    output.hidden = false; actions.hidden = false;
  }
  function download(name, type, body) {
    var anchor = document.createElement("a"); anchor.href = URL.createObjectURL(new Blob([body], {type:type})); anchor.download = name;
    document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(function () { URL.revokeObjectURL(anchor.href); }, 0);
    status.textContent = fr ? "Fichier téléchargé." : sw ? "Faili imepakuliwa." : "File downloaded.";
  }
  function invalid() {
    status.textContent = fr ? "Ajoutez un sujet et au moins un point clé." : sw ? "Weka mada na angalau hoja moja kuu." : "Add a topic and at least one key point.";
    output.hidden = true; actions.hidden = true;
  }
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    try {
      last = engine.generateLocalScript({topic:form.elements.topic.value,keyPoints:form.elements.keyPoints.value,format:form.elements.format.value}, language);
      render(last);
      status.textContent = (fr ? "Brouillon local créé." : sw ? "Rasimu imeundwa kwenye kifaa." : "Local draft created.") + " " + last.wordCount + " " + (fr ? "mots." : sw ? "maneno." : "words.");
    } catch (_) { last = null; invalid(); }
  });
  form.elements.topic.addEventListener("invalid", invalid); form.elements.keyPoints.addEventListener("invalid", invalid);
  root.querySelector("[data-json]").onclick = function () { if (last) download("creator-script.json", "application/json", JSON.stringify(last, null, 2)); };
  root.querySelector("[data-txt]").onclick = function () { if (last) download("creator-script.txt", "text/plain;charset=utf-8", engine.exportPlainText(last, language)); };
  var reset = root.querySelector("[data-reset]");
  if (reset) reset.onclick = function () { form.reset(); last = null; output.innerHTML = ""; output.hidden = true; actions.hidden = true; status.textContent = sw ? "Mfano wa awali umerejeshwa." : fr ? "Exemple initial restauré." : "Example restored."; form.elements.topic.focus(); };
}());

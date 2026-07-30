(function () {
  "use strict";
  var root = document.querySelector("[data-creator-polish-native]");
  var engine = window.AfroTools && window.AfroTools.CreatorPolishEngine;
  if (!root || !engine) return;
  var fr = root.getAttribute("data-lang") === "fr";
  var form = root.querySelector("form");
  var output = root.querySelector("[data-output]");
  var actions = root.querySelector("[data-actions]");
  var status = root.querySelector("[data-status]");
  var last = null;
  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char];
    });
  }
  function download(name, type, body) {
    var link = document.createElement("a");
    var url = URL.createObjectURL(new Blob([body], { type: type }));
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    status.textContent = fr ? "Fichier téléchargé." : "File downloaded.";
  }
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    try {
      last = engine.analyze({ text: form.elements.text.value, lang: fr ? "fr" : "en" });
      output.innerHTML =
        '<article class="ctn-result crn-result"><small>' + (fr ? "Mesures" : "Metrics") + '</small><span>' +
        esc(last.metrics.words + " " + (fr ? "mots" : "words") + " · " + last.metrics.sentences + " " + (fr ? "phrases" : "sentences") + " · " + last.metrics.averageWordsPerSentence + " " + (fr ? "mots/phrase" : "words/sentence")) +
        '</span></article><article class="ctn-result crn-result"><small>' + (fr ? "Signaux" : "Signals") + '</small><span>' +
        last.suggestions.map(esc).join("<br>") +
        '</span></article><article class="ctn-result crn-result"><small>' + (fr ? "Version nettoyée" : "Cleaned version") + '</small><span>' + esc(last.cleaned) + '</span></article>';
      output.hidden = false;
      actions.hidden = false;
      status.textContent = fr ? "Analyse locale terminée." : "Local analysis complete.";
    } catch (_) {
      last = null;
      output.hidden = true;
      actions.hidden = true;
      status.textContent = fr ? "Ajoutez au moins 20 caractères." : "Add at least 20 characters.";
    }
  });
  root.querySelector("[data-json]").addEventListener("click", function () {
    if (last) download("creator-polish-analysis.json", "application/json", JSON.stringify(last, null, 2));
  });
  root.querySelector("[data-txt]").addEventListener("click", function () {
    if (!last) return;
    var body = (fr ? "VERSION NETTOYÉE\n\n" : "CLEANED VERSION\n\n") + last.cleaned + "\n\n" +
      (fr ? "POINTS À VÉRIFIER\n" : "REVIEW POINTS\n") + last.suggestions.map(function (item) { return "- " + item; }).join("\n") +
      "\n\n" + last.boundary;
    download("creator-polish-review.txt", "text/plain;charset=utf-8", body);
  });
}());

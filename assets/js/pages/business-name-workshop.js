(function initBusinessNameWorkshopPage() {
  "use strict";

  var engine = window.AfroTools && window.AfroTools.BusinessNameWorkshop;
  var root = document.querySelector("[data-business-name-workshop]");
  if (!engine || !root) return;

  var copy = {
    en: {
      generate: "Build shortlist", next: "Try another deterministic set", saved: "Saved shortlist",
      empty: "Complete the brief, then build a shortlist.", ready: "ideas created. These are prompts, not availability results.",
      invalid: "Please add at least one useful keyword and check every field.", stale: "The brief changed. Build a fresh shortlist before exporting.",
      save: "Save", remove: "Remove", score: "Readability heuristic", factors: ["Length target", "One or two words", "Keyword connection", "No triple letters", "Simple characters"],
      copied: "Shortlist copied.", exported: "Export created locally.", nothing: "Build a current shortlist first.",
      csv: "Download CSV", json: "Download JSON", pdf: "Download PDF", print: "Print",
      pdfTitle: "African Business Name Shortlist Workshop", checklist: ["Say each name aloud with intended customers.", "Ask a fluent speaker to verify any local word.", "Search company registries in every target country.", "Search trademarks and close spelling variants.", "Check domains and social handles separately."],
      scope: "No availability, trademark, domain or linguistic claim is made."
    },
    fr: {
      generate: "Créer la sélection", next: "Essayer une autre série déterministe", saved: "Sélection enregistrée",
      empty: "Complétez le brief, puis créez une sélection.", ready: "idées créées. Ce sont des pistes, pas des résultats de disponibilité.",
      invalid: "Ajoutez au moins un mot-clé utile et vérifiez chaque champ.", stale: "Le brief a changé. Créez une nouvelle sélection avant l’export.",
      save: "Garder", remove: "Retirer", score: "Heuristique de lisibilité", factors: ["Longueur cible", "Un ou deux mots", "Lien au mot-clé", "Pas de triple lettre", "Caractères simples"],
      copied: "Sélection copiée.", exported: "Export créé localement.", nothing: "Créez d’abord une sélection à jour.",
      csv: "Télécharger CSV", json: "Télécharger JSON", pdf: "Télécharger PDF", print: "Imprimer",
      pdfTitle: "Atelier africain de sélection de noms d’entreprise", checklist: ["Prononcez chaque nom avec vos clients cibles.", "Faites vérifier tout mot local par une personne qui parle couramment la langue.", "Consultez les registres des pays visés.", "Recherchez les marques et orthographes proches.", "Vérifiez séparément domaines et réseaux sociaux."],
      scope: "Aucune disponibilité, marque, domaine ou signification linguistique n’est affirmée."
    },
    sw: {
      generate: "Unda orodha fupi", next: "Jaribu kundi jingine la kudumu", saved: "Majina yaliyohifadhiwa",
      empty: "Jaza maelezo, kisha unda orodha fupi.", ready: "mawazo yameundwa. Haya ni mapendekezo, si matokeo ya upatikanaji.",
      invalid: "Weka angalau neno moja la msingi na uhakiki kila sehemu.", stale: "Maelezo yamebadilika. Unda orodha mpya kabla ya kusafirisha.",
      save: "Hifadhi", remove: "Ondoa", score: "Kipimo cha usomekaji", factors: ["Urefu unaofaa", "Neno moja au mawili", "Uhusiano wa neno", "Hakuna herufi tatu", "Herufi rahisi"],
      copied: "Orodha imenakiliwa.", exported: "Faili imeundwa kwenye kifaa hiki.", nothing: "Unda orodha halali kwanza.",
      csv: "Pakua CSV", json: "Pakua JSON", pdf: "Pakua PDF", print: "Chapisha",
      pdfTitle: "Warsha ya Orodha Fupi ya Majina ya Biashara Afrika", checklist: ["Tamka kila jina mbele ya wateja unaowalenga.", "Mwombe msemaji stadi ahakiki neno lolote la eneo.", "Tafuta kwenye sajili za kila nchi unayolenga.", "Tafuta alama za biashara na tahajia zinazofanana.", "Kagua vikoa na majina ya mitandao kando."],
      scope: "Hakuna dai la upatikanaji, alama ya biashara, kikoa au maana ya lugha."
    }
  };
  var locale = root.getAttribute("data-locale");
  if (!copy[locale]) locale = "en";
  var t = copy[locale];
  var form = root.querySelector("form");
  var results = root.querySelector("[data-results]");
  var status = root.querySelector("[data-status]");
  var savedList = root.querySelector("[data-saved]");
  var generateButton = root.querySelector("[data-generate]");
  var nextButton = root.querySelector("[data-next]");
  var exportButtons = Array.from(root.querySelectorAll("[data-export]"));
  var current = null;
  var saved = [];
  var batch = 0;

  generateButton.textContent = t.generate;
  nextButton.textContent = t.next;
  root.querySelector("[data-saved-title]").textContent = t.saved;
  root.querySelector('[data-export="csv"]').textContent = t.csv;
  root.querySelector('[data-export="json"]').textContent = t.json;
  root.querySelector('[data-export="pdf"]').textContent = t.pdf;
  root.querySelector('[data-export="print"]').textContent = t.print;
  status.textContent = t.empty;

  function setExports(enabled) {
    exportButtons.forEach(function (button) { button.disabled = !enabled; });
  }

  function input() {
    return {
      keywords: form.elements.keywords.value,
      localWord: form.elements.localWord.value,
      industry: form.elements.industry.value,
      audience: form.elements.audience.value,
      tone: form.elements.tone.value,
      style: form.elements.style.value,
      maxLength: Number(form.elements.maxLength.value),
      batch: batch
    };
  }

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function renderSaved() {
    savedList.replaceChildren();
    saved.forEach(function (name) {
      var item = element("li", "", name);
      savedList.appendChild(item);
    });
    savedList.parentElement.hidden = saved.length === 0;
  }

  function render() {
    results.replaceChildren();
    current.suggestions.forEach(function (suggestion) {
      var card = element("article", "bnw-name");
      var top = element("div", "bnw-name-top");
      top.appendChild(element("h3", "", suggestion.name));
      var save = element("button", "bnw-save", saved.includes(suggestion.name) ? t.remove : t.save);
      save.type = "button";
      save.setAttribute("aria-label", (saved.includes(suggestion.name) ? t.remove : t.save) + " " + suggestion.name);
      save.addEventListener("click", function () {
        var index = saved.indexOf(suggestion.name);
        if (index >= 0) saved.splice(index, 1); else saved.push(suggestion.name);
        renderSaved();
        render();
      });
      top.appendChild(save);
      card.appendChild(top);
      card.appendChild(element("p", "bnw-score", t.score + ": " + suggestion.score + "/100"));
      var factors = element("div", "bnw-factors");
      Object.keys(suggestion.factors).forEach(function (key, index) {
        var factor = element("span", "bnw-factor", t.factors[index]);
        factor.dataset.pass = String(suggestion.factors[key]);
        factors.appendChild(factor);
      });
      card.appendChild(factors);
      results.appendChild(card);
    });
  }

  function generate() {
    current = engine.generate(input());
    if (!current.valid) {
      current = null;
      results.replaceChildren();
      status.textContent = t.invalid;
      setExports(false);
      return;
    }
    render();
    status.textContent = current.suggestions.length + " " + t.ready;
    setExports(true);
  }

  function payload() {
    return {
      title: t.pdfTitle,
      generatedAt: new Date().toISOString(),
      engineVersion: current.version,
      scope: t.scope,
      inputs: current.inputs,
      suggestions: current.suggestions,
      savedShortlist: saved.slice(),
      verificationChecklist: t.checklist.slice()
    };
  }

  function safeCell(value) {
    var text = String(value == null ? "" : value);
    if (/^[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }

  function download(content, type, name) {
    var link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([content], { type: type }));
    link.download = name;
    link.dataset.noPdfGate = "true";
    document.body.appendChild(link);
    link.click();
    setTimeout(function () { URL.revokeObjectURL(link.href); link.remove(); }, 0);
    status.textContent = t.exported;
  }

  function textSummary() {
    var data = payload();
    var lines = [data.title, "", data.scope, "Engine: " + data.engineVersion, ""];
    data.suggestions.forEach(function (item, index) { lines.push((index + 1) + ". " + item.name + " — " + item.score + "/100"); });
    lines.push("", "Verification checklist:");
    data.verificationChecklist.forEach(function (item) { lines.push("- " + item); });
    return lines.join("\n");
  }

  form.addEventListener("submit", function (event) { event.preventDefault(); batch = 0; generate(); });
  nextButton.addEventListener("click", function () { batch = (batch + 1) % 21; generate(); });
  form.addEventListener("input", function () {
    if (!current) return;
    current = null;
    results.replaceChildren();
    status.textContent = t.stale;
    setExports(false);
  });
  root.querySelector("[data-copy]").addEventListener("click", function () {
    if (!current) { status.textContent = t.nothing; return; }
    var text = textSummary();
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { status.textContent = t.copied; });
    else {
      var area = element("textarea"); area.value = text; document.body.appendChild(area); area.select(); document.execCommand("copy"); area.remove(); status.textContent = t.copied;
    }
  });
  exportButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      if (!current) { status.textContent = t.nothing; return; }
      var kind = button.dataset.export;
      if (kind === "json") download(JSON.stringify(payload(), null, 2), "application/json;charset=utf-8", "afrotools-business-name-shortlist.json");
      else if (kind === "csv") {
        var rows = [["name", "style", "score", "within_length", "one_or_two_words", "keyword_connection", "no_triple_character", "simple_characters"]];
        current.suggestions.forEach(function (item) { rows.push([item.name, item.style, item.score, item.factors.withinLengthTarget, item.factors.oneOrTwoWords, item.factors.keywordConnection, item.factors.noTripleCharacter, item.factors.simpleCharacters]); });
        rows.push([], ["scope", t.scope], ["engine_version", current.version]);
        t.checklist.forEach(function (item, index) { rows.push(["check_" + (index + 1), item]); });
        download(rows.map(function (row) { return row.map(safeCell).join(","); }).join("\r\n"), "text/csv;charset=utf-8", "afrotools-business-name-shortlist.csv");
      } else if (kind === "pdf") {
        if (!window.jspdf || !window.jspdf.jsPDF) { status.textContent = t.nothing; return; }
        var doc = new window.jspdf.jsPDF();
        var lines = doc.splitTextToSize(textSummary(), 175);
        doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(lines, 18, 20); doc.save("afrotools-business-name-shortlist.pdf");
        status.textContent = t.exported;
      } else window.print();
    });
  });
  renderSaved();
  setExports(false);
})();

(function (root) {
  "use strict";
  var engine = root.AfroTools && root.AfroTools.BioForgeEngine;
  var app = document.querySelector("[data-bioforge-app]");
  if (!engine || !app) return;

  var requestedLocale = app.getAttribute("data-locale");
  var locale = requestedLocale === "fr" ? "fr" : (requestedLocale === "sw" ? "sw" : "en");
  var text = {
    en: {
      required: "Add your name or creator identity and what you create.",
      ready: "Seven platform-ready drafts generated locally.",
      copied: "All bios copied.",
      saved: "JSON export prepared.",
      cleared: "Workspace cleared.",
      copy: "Copy",
      count: "characters",
      exportError: "Generate valid bios before exporting."
    },
    fr: {
      required: "Ajoutez votre nom ou identité de créateur, puis ce que vous créez.",
      ready: "Sept brouillons adaptés aux plateformes ont été générés localement.",
      copied: "Toutes les bios ont été copiées.",
      saved: "Export JSON préparé.",
      cleared: "Espace de travail effacé.",
      copy: "Copier",
      count: "caractères",
      exportError: "Générez des bios valides avant l’export."
    },
    sw: {
      required: "Weka jina au utambulisho wako wa mtayarishi na unachotengeneza.",
      ready: "Rasimu saba za majukwaa zimetengenezwa kwenye kifaa hiki.",
      copied: "Bio zote zimenakiliwa.",
      saved: "Faili ya JSON imeandaliwa.",
      cleared: "Workspace imefutwa.",
      copy: "Nakili",
      count: "herufi",
      exportError: "Tengeneza bio halali kabla ya kupakua."
    }
  }[locale];
  var latest = null;
  var status = app.querySelector("[data-status]");
  var results = app.querySelector("[data-results]");

  function setStatus(message, invalid) {
    status.textContent = message;
    status.classList.toggle("is-error", !!invalid);
  }

  function values() {
    return {
      who: app.querySelector("[name=who]").value,
      what: app.querySelector("[name=what]").value,
      tone: app.querySelector("[name=tone]").value,
      location: app.querySelector("[name=location]").value,
      achievement: app.querySelector("[name=achievement]").value
    };
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function render(result) {
    results.innerHTML = result.bios.map(function (bio) {
      return '<article class="bio-result" data-platform="' + bio.platform + '">' +
        '<div class="bio-result__top"><h2>' + escapeHtml(bio.label) + '</h2>' +
        '<span><output data-count="' + bio.platform + '">' + bio.charCount + "</output>/" + bio.charLimit + " " + text.count + "</span></div>" +
        '<textarea aria-label="' + escapeHtml(bio.label) + '" maxlength="' + bio.charLimit + '" data-bio="' + bio.platform + '">' + escapeHtml(bio.text) + "</textarea>" +
        '<button type="button" data-copy="' + bio.platform + '">' + text.copy + "</button></article>";
    }).join("") + '<p class="bio-tip">' + escapeHtml(result.personalBrandTip) + "</p>";
    results.hidden = false;
  }

  function syncEditedBio(textarea) {
    if (!latest) return;
    var bio = latest.bios.find(function (item) { return item.platform === textarea.getAttribute("data-bio"); });
    if (!bio) return;
    bio.text = textarea.value;
    bio.charCount = textarea.value.length;
    bio.withinLimit = bio.charCount <= bio.charLimit;
    var counter = results.querySelector('[data-count="' + bio.platform + '"]');
    if (counter) counter.textContent = bio.charCount;
  }

  function download(format) {
    if (!latest || !latest.ok) {
      setStatus(text.exportError, true);
      return;
    }
    var content = engine.serialize(latest, format);
    var blob = new Blob([content], { type: format === "json" ? "application/json" : "text/plain" });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "bioforge-" + locale + "." + format;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    setStatus(format === "json" ? text.saved : text.ready, false);
  }

  function copyText(value) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(value);
    var area = document.createElement("textarea");
    area.value = value;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    return Promise.resolve();
  }

  app.querySelector("form").addEventListener("submit", function (event) {
    event.preventDefault();
    var result = engine.generate(values(), locale);
    if (!result.ok) {
      latest = null;
      results.hidden = true;
      results.innerHTML = "";
      setStatus(text.required, true);
      app.querySelector("[name=" + (result.errors[0] === "what" ? "what" : "who") + "]").focus();
      return;
    }
    latest = result;
    render(result);
    setStatus(text.ready, false);
  });

  results.addEventListener("input", function (event) {
    if (event.target.matches("[data-bio]")) syncEditedBio(event.target);
  });
  results.addEventListener("click", function (event) {
    var button = event.target.closest("[data-copy]");
    if (!button) return;
    var textarea = results.querySelector('[data-bio="' + button.getAttribute("data-copy") + '"]');
    copyText(textarea.value).then(function () { setStatus(text.copied, false); });
  });
  app.querySelector("[data-copy-all]").addEventListener("click", function () {
    if (!latest) return setStatus(text.exportError, true);
    copyText(engine.serialize(latest, "txt")).then(function () { setStatus(text.copied, false); });
  });
  app.querySelector("[data-export-json]").addEventListener("click", function () { download("json"); });
  app.querySelector("[data-export-txt]").addEventListener("click", function () { download("txt"); });
  app.querySelector("[data-clear]").addEventListener("click", function () {
    app.querySelector("form").reset();
    latest = null;
    results.hidden = true;
    results.innerHTML = "";
    setStatus(text.cleared, false);
    app.querySelector("[name=who]").focus();
  });
})(window);

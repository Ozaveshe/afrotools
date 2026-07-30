(function () {
  "use strict";

  var E = window.AfroTools && window.AfroTools.TagWaveEngine;
  if (!E) return;

  var locale = document.documentElement.lang === "fr" ? "fr" : "en";
  var fr = locale === "fr";
  var text = {
    empty: fr ? "Décrivez le sujet de la publication." : "Describe what the post is about.",
    localReady: fr ? "Trois jeux locaux sont prêts." : "Three local sets are ready.",
    aiError: fr ? "Le service IA est indisponible. Aucun contenu n’a été envoyé ailleurs." : "AI service is unavailable. No content was sent elsewhere.",
    parseError: fr ? "La réponse IA n’a pas pu être vérifiée." : "The AI response could not be verified.",
    consent: fr ? "Cochez l’accord avant d’envoyer ce sujet au service IA." : "Check consent before sending this topic to the AI service.",
    copied: fr ? "Jeu copié." : "Set copied.",
    addFirst: fr ? "Ajoutez d’abord des hashtags au mélange." : "Add hashtags to the mix first.",
    historyEmpty: fr ? "Aucun historique local." : "No local history yet.",
    history: fr ? "Historique local" : "Local history",
    estimate: fr ? "Estimation" : "Estimate",
    tags: fr ? "hashtags" : "tags",
    max: fr ? "maximum" : "max",
    download: fr ? "Téléchargement prêt." : "Download ready."
  };
  var API = "/.netlify/functions/creator-hashtags";
  var activePlatform = E.DEFAULT_PLATFORM;
  var currentResult = null;
  var customMix = [];
  var previousFocus = null;

  function byId(id) { return document.getElementById(id); }
  function escapeHtml(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function toast(message) {
    var el = byId("toast");
    el.textContent = message;
    el.classList.add("show");
    window.setTimeout(function () { el.classList.remove("show"); }, 2200);
  }
  function getToken() {
    try {
      var raw = localStorage.getItem("sb-zpclagtgczsygrgztlts-auth-token");
      return raw ? JSON.parse(raw).access_token || "" : "";
    } catch (_) { return ""; }
  }
  function renderPlatforms() {
    var container = byId("platformPills");
    container.innerHTML = "";
    Object.keys(E.PLATFORMS).forEach(function (key) {
      var p = E.PLATFORMS[key];
      var button = document.createElement("button");
      button.type = "button";
      button.className = "cht-platform-pill" + (key === activePlatform ? " active" : "");
      button.dataset.platform = key;
      button.setAttribute("aria-pressed", key === activePlatform ? "true" : "false");
      button.textContent = p.icon + " " + p.label;
      button.addEventListener("click", function () {
        activePlatform = key;
        renderPlatforms();
        renderMix();
      });
      container.appendChild(button);
    });
  }
  function saveHistory(topic, result) {
    var history;
    try { history = JSON.parse(localStorage.getItem("cht-history") || "[]"); } catch (_) { history = []; }
    history.unshift(E.createHistoryEntry(topic, activePlatform, result.sets, []));
    localStorage.setItem("cht-history", JSON.stringify(history.slice(0, 50)));
  }
  function renderSets(result) {
    var output = byId("outputArea");
    output.innerHTML = "";
    result.sets.forEach(function (set, setIndex) {
      var card = document.createElement("section");
      card.className = "cht-set-card";
      card.innerHTML =
        '<div class="cht-set-header"><div class="cht-set-name">' + escapeHtml(set.name) + "</div>" +
        '<button type="button" class="cht-action-btn" data-copy-set="' + setIndex + '">' + (fr ? "Copier le jeu" : "Copy set") + "</button></div>" +
        '<div class="cht-set-strategy">' + escapeHtml(set.strategy || "") + "</div>" +
        '<div class="cht-tags" role="list"></div>' +
        '<div class="cht-set-meta"><span>' + set.tags.length + " " + text.tags + "</span><span>" + text.estimate + ": " +
        escapeHtml(set.estimatedReach || (fr ? "non prédite" : "not predicted")) + "</span></div>";
      var tags = card.querySelector(".cht-tags");
      set.tags.forEach(function (item) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "cht-tag";
        button.dataset.reach = item.reach || "mid";
        button.dataset.tag = item.tag;
        button.setAttribute("aria-pressed", "false");
        button.textContent = item.tag;
        button.addEventListener("click", function () { toggleTag(button); });
        tags.appendChild(button);
      });
      card.querySelector("[data-copy-set]").addEventListener("click", function () {
        copyText(E.tagsToString(set.tags), text.copied);
      });
      output.appendChild(card);
    });
    if (result.trendingNote) {
      var note = document.createElement("p");
      note.className = "cht-trending-note";
      note.textContent = "ℹ️ " + result.trendingNote;
      output.appendChild(note);
    }
    byId("legend").style.display = "flex";
    byId("mixCard").style.display = "";
    byId("exportActions").hidden = false;
    renderMix();
  }
  function finish(result, topic, message) {
    currentResult = result;
    customMix = [];
    renderSets(result);
    saveHistory(topic, result);
    byId("generateBtn").disabled = false;
    byId("generateBtn").classList.remove("loading");
    byId("loadingStatus").textContent = message;
  }
  function generateLocal(topic) {
    var result = E.generateLocal(topic, activePlatform, locale);
    if (result.error) {
      byId("generateBtn").disabled = false;
      byId("generateBtn").classList.remove("loading");
      toast(result.error);
      return;
    }
    finish(result, topic, text.localReady);
  }
  function generateAI(topic) {
    if (!byId("aiConsent").checked) {
      byId("generateBtn").disabled = false;
      byId("generateBtn").classList.remove("loading");
      toast(text.consent);
      return;
    }
    var token = getToken();
    fetch(API + "/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: token ? "Bearer " + token : "" },
      body: JSON.stringify({ topic: topic, platform: activePlatform, prompt: E.buildPrompt(topic, activePlatform), consent: true, locale: locale })
    }).then(function (response) {
      return response.json().then(function (data) { return { ok: response.ok, data: data }; });
    }).then(function (response) {
      var result = response.ok ? E.parseSets(response.data.output || response.data) : null;
      if (!result || !Array.isArray(result.sets)) throw new Error("invalid");
      finish(result, topic, fr ? "Réponse IA reçue." : "AI response received.");
    }).catch(function () {
      byId("generateBtn").disabled = false;
      byId("generateBtn").classList.remove("loading");
      byId("loadingStatus").textContent = text.aiError;
    });
  }
  window._chtGenerate = function () {
    var topic = byId("topicInput").value.trim();
    if (!topic) {
      byId("topicInput").setAttribute("aria-invalid", "true");
      toast(text.empty);
      return;
    }
    byId("topicInput").removeAttribute("aria-invalid");
    byId("generateBtn").disabled = true;
    byId("generateBtn").classList.add("loading");
    byId("loadingStatus").textContent = fr ? "Préparation…" : "Preparing…";
    if (byId("generationMode").value === "ai") generateAI(topic);
    else generateLocal(topic);
  };
  function toggleTag(button) {
    var tag = button.dataset.tag;
    var index = customMix.findIndex(function (item) { return item.tag === tag; });
    if (index >= 0) customMix.splice(index, 1);
    else customMix.push({ tag: tag, reach: button.dataset.reach });
    button.classList.toggle("selected", index < 0);
    button.setAttribute("aria-pressed", index < 0 ? "true" : "false");
    renderMix();
  }
  function renderMix() {
    var config = E.PLATFORMS[activePlatform] || E.PLATFORMS.instagram;
    byId("mixCount").textContent = customMix.length + " / " + config.maxTags + " " + text.max;
    byId("mixWarn").classList.toggle("show", customMix.length > config.recommended);
    var container = byId("mixTags");
    container.textContent = customMix.length ? customMix.map(function (item) { return item.tag; }).join(" ") :
      (fr ? "Sélectionnez des hashtags ci-dessus." : "Select tags above to build a mix.");
  }
  function copyText(value, message) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(function () { toast(message); }).catch(function () { toast(value); });
    } else toast(value);
  }
  window._chtCopyMix = function () {
    if (!customMix.length) return toast(text.addFirst);
    copyText(customMix.map(function (item) { return item.tag; }).join(" "), text.copied);
  };
  window._chtClearMix = function () {
    customMix = [];
    document.querySelectorAll(".cht-tag.selected").forEach(function (button) {
      button.classList.remove("selected");
      button.setAttribute("aria-pressed", "false");
    });
    renderMix();
  };
  function download(format) {
    if (!currentResult) return;
    var body = E.serialize(currentResult, format, locale);
    var blob = new Blob([body], { type: format === "json" ? "application/json" : "text/plain" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "tagwave-" + activePlatform + "." + format;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    toast(text.download);
  }
  function closeHistory() {
    byId("historyPanel").style.display = "none";
    if (previousFocus) previousFocus.focus();
  }
  byId("historyBtn").addEventListener("click", function () {
    previousFocus = document.activeElement;
    var panel = byId("historyPanel");
    var list = byId("historyList");
    var history;
    try { history = JSON.parse(localStorage.getItem("cht-history") || "[]"); } catch (_) { history = []; }
    list.innerHTML = history.length ? "" : '<p class="cht-history-empty">' + text.historyEmpty + "</p>";
    history.forEach(function (entry) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "cht-history-item";
      button.innerHTML = '<span class="cht-history-plat">' + escapeHtml((E.PLATFORMS[entry.platform] || E.PLATFORMS.instagram).label) +
        '</span><span class="cht-history-topic">' + escapeHtml(entry.topic) + '</span><span class="cht-history-time">' +
        escapeHtml(E.formatTimestamp(entry.createdAt, locale)) + "</span>";
      button.addEventListener("click", function () {
        byId("topicInput").value = entry.topic;
        activePlatform = entry.platform;
        currentResult = { sets: entry.sets, source: "history" };
        renderPlatforms();
        renderSets(currentResult);
        closeHistory();
      });
      list.appendChild(button);
    });
    panel.style.display = "";
    byId("historyClose").focus();
  });
  byId("historyClose").addEventListener("click", closeHistory);
  byId("historyPanel").addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeHistory();
  });
  byId("generationMode").addEventListener("change", function () {
    byId("aiConsentWrap").hidden = this.value !== "ai";
  });
  byId("downloadTxt").addEventListener("click", function () { download("txt"); });
  byId("downloadJson").addEventListener("click", function () { download("json"); });
  byId("topicInput").addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); window._chtGenerate(); }
  });
  renderPlatforms();
}());

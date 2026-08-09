(function () {
  "use strict";

  if (document.documentElement.lang !== "sw") return;

  var exact = {
    "Guest mode": "Hali ya mgeni",
    "Short": "Fupi",
    "Medium": "Wastani",
    "Long": "Ndefu",
    "Export All as .txt": "Pakua zote kama .txt",
    "Copy": "Nakili",
    "No Tags": "Bila hashtag",
    "Tags Only": "Hashtag pekee",
    "Share": "Shiriki",
    "Save": "Hifadhi",
    "Saved": "Imehifadhiwa",
    "Compare": "Linganisha",
    "Tip:": "Kidokezo:",
    "No history yet": "Hakuna historia bado",
    "Your generated captions will appear here for quick access.": "Caption ulizotengeneza zitaonekana hapa ili uzifikie haraka.",
    "No favorites yet": "Hakuna kipendwa bado",
    "Save your best captions here for quick reuse.": "Hifadhi caption zako bora hapa ili uzitumie tena haraka.",
    "Search favorites...": "Tafuta vipendwa...",
    "Just now": "Sasa hivi",
    "Your Name": "Jina lako",
    "Remove favorite": "Ondoa kipendwa",
    "Untitled": "Bila kichwa",
    "Option": "Chaguo",
    "Search favorites": "Tafuta vipendwa"
  };

  var phrases = [
    ["characters", "herufi"],
    ["caption generated", "caption imetengenezwa"],
    ["captions generated", "caption zimetengenezwa"],
    ["Copied with hashtags!", "Imenakiliwa pamoja na hashtag!"],
    ["Copied without hashtags!", "Imenakiliwa bila hashtag!"],
    ["Hashtags copied!", "Hashtag zimenakiliwa!"],
    ["Remove one first (max 2)", "Ondoa moja kwanza (kiwango cha juu ni 2)"],
    ["Restored from history", "Imerejeshwa kutoka historia"],
    ["Removed from favorites", "Imeondolewa kwenye vipendwa"],
    ["Saved to favorites!", "Imehifadhiwa kwenye vipendwa!"],
    ["Copied!", "Imenakiliwa!"],
    ["Exported!", "Imepakuliwa!"],
    ["Describe your post first", "Eleza chapisho lako kwanza"],
    ["Paste a caption to rewrite", "Bandika caption ya kuboresha kwanza"],
    ["3 captions created locally", "Caption 3 zimetengenezwa kwenye kifaa chako"],
    ["3 rewrites created locally", "Matoleo 3 yametengenezwa kwenye kifaa chako"],
    ["Guest AI limit reached for today. Local generation remains available.", "Kiwango cha AI cha mgeni kimefikiwa leo. Utengenezaji wa ndani bado unapatikana."],
    ["Guest AI limit reached for today. Local rewriting remains available.", "Kiwango cha AI cha mgeni kimefikiwa leo. Uboreshaji wa ndani bado unapatikana."],
    ["Session expired. Refresh the page to continue in guest mode.", "Kikao kimeisha. Pakia ukurasa upya ili kuendelea kama mgeni."],
    ["Generation failed. Please try again.", "Utengenezaji umeshindwa. Jaribu tena."],
    ["Rewrite failed. Please try again.", "Uboreshaji umeshindwa. Jaribu tena."],
    ["Connection error. Please check your internet and try again.", "Hitilafu ya muunganisho. Hakiki intaneti kisha ujaribu tena."],
    ["Connection error. Please try again.", "Hitilafu ya muunganisho. Jaribu tena."],
    ["generations remaining today", "matumizi ya AI yamebaki leo"],
    ["guest generations remaining today", "matumizi ya AI ya mgeni yamebaki leo"]
  ];

  function translateValue(value) {
    var trimmed = String(value || "").trim();
    if (exact[trimmed]) return String(value).replace(trimmed, exact[trimmed]);
    var next = String(value || "");
    phrases.forEach(function (pair) { next = next.split(pair[0]).join(pair[1]); });
    return next;
  }

  function translate(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      root.nodeValue = translateValue(root.nodeValue);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    function translateAttributes(element) {
      ["placeholder", "aria-label", "title"].forEach(function (name) {
        if (element.hasAttribute(name)) element.setAttribute(name, translateValue(element.getAttribute(name)));
      });
    }
    if (root.nodeType === Node.ELEMENT_NODE) {
      translateAttributes(root);
      root.querySelectorAll("[placeholder], [aria-label], [title]").forEach(translateAttributes);
    }
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) node.nodeValue = translateValue(node.nodeValue);
  }

  function syncPillGroup(group) {
    var pills = group.querySelectorAll(".ccr-pill-v2");
    pills.forEach(function (pill) {
      var active = pill.classList.contains("active");
      pill.setAttribute("role", "radio");
      pill.setAttribute("tabindex", active ? "0" : "-1");
      pill.setAttribute("aria-checked", active ? "true" : "false");
      pill.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          pill.click();
        }
      });
      pill.addEventListener("click", function () {
        setTimeout(function () { syncPillGroup(group); }, 0);
      });
    });
    group.setAttribute("role", "radiogroup");
  }

  function init() {
    document.title = "Sehemu ya Caption za Maudhui | AfroTools";
    translate(document.body);
    var language = document.getElementById("langSelect");
    if (language) language.value = "swahili";
    document.querySelectorAll(".ccr-pills-scroll").forEach(syncPillGroup);
    document.querySelectorAll(".ccr-toggle-v2").forEach(function (toggle) {
      function sync() { toggle.setAttribute("aria-pressed", toggle.classList.contains("on") ? "true" : "false"); }
      sync();
      toggle.addEventListener("click", function () { setTimeout(sync, 0); });
    });
    var toast = document.getElementById("toast");
    if (toast) { toast.setAttribute("role", "status"); toast.setAttribute("aria-live", "polite"); }
    ["writeOutput", "rewriteOutput"].forEach(function (id) {
      var output = document.getElementById(id);
      if (output) output.setAttribute("aria-live", "polite");
    });
    new MutationObserver(function (records) {
      records.forEach(function (record) { record.addedNodes.forEach(translate); });
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

(function () {
  "use strict";

  var payload = document.getElementById("sw-health-translations");
  if (!payload) return;

  var dictionary = {};
  try {
    dictionary = JSON.parse(payload.textContent || "{}");
  } catch (_error) {
    dictionary = {};
  }

  var critical = {
    "Download PDF": "Pakua PDF",
    "Download TXT": "Pakua TXT",
    "Download local TXT": "Pakua TXT kwenye kifaa",
    "Print / save PDF": "Chapisha / hifadhi PDF",
    "Print or save as PDF": "Chapisha au hifadhi kama PDF",
    "Clear": "Futa",
    "Reset": "Weka upya",
    "Calculate": "Kokotoa",
    "Result": "Matokeo",
    "Results": "Matokeo",
    "Privacy": "Faragha",
    "Sources": "Vyanzo",
    "Official sources": "Vyanzo rasmi",
    "Source check": "Ukaguzi wa chanzo",
    "This tool does not diagnose": "Zana hii haitambui ugonjwa",
    "not a diagnosis": "si utambuzi",
    "not medical advice": "si ushauri wa matibabu",
    "does not replace medical advice": "haichukui nafasi ya ushauri wa matibabu",
    "does not replace professional medical advice": "haichukui nafasi ya ushauri wa mtaalamu wa afya",
    "Seek urgent local care": "Tafuta huduma ya dharura iliyo karibu",
    "Do not wait for this tool.": "Usisubiri zana hii.",
    "Do not wait for this checklist.": "Usisubiri orodha hii.",
    "Runs in this browser": "Hufanya kazi kwenye kivinjari hiki",
    "stays in this browser": "hubaki kwenye kivinjari hiki",
    "stay in this browser": "hubaki kwenye kivinjari hiki",
    "No upload": "Hakuna upakiaji",
    "No account": "Hakuna akaunti",
    "No diagnosis": "Hakuna utambuzi",
    "Educational use only": "Kwa elimu pekee",
    "Local first": "Kwenye kifaa kwanza",
    "Optional AI": "AI ya hiari",
    "Save on this device": "Hifadhi kwenye kifaa hiki",
    "Downloaded locally.": "Imepakuliwa kwenye kifaa.",
    "PDF downloaded locally.": "PDF imepakuliwa kwenye kifaa.",
    "TXT downloaded locally.": "TXT imepakuliwa kwenye kifaa.",
    "PDF library unavailable. Use TXT.": "Maktaba ya PDF haipatikani. Tumia TXT.",
    "Required": "Inahitajika",
    "Invalid": "Si sahihi",
    "Please enter": "Tafadhali ingiza",
    "Please select": "Tafadhali chagua",
    "Questions to ask": "Maswali ya kuuliza",
    "Next steps": "Hatua zinazofuata",
    "Next action": "Hatua inayofuata",
    "Before you continue": "Kabla ya kuendelea",
    "Before you calculate": "Kabla ya kukokotoa",
    "Frequently Asked Questions": "Maswali yanayoulizwa mara kwa mara",
    "Related tools": "Zana zinazohusiana",
    "Related AfroTools": "Zana nyingine za AfroTools",
    "Home": "Nyumbani",
    "All tools": "Zana zote",
    "All Tools": "Zana zote",
    "Health": "Afya",
    "Health tools": "Zana za afya",
    "Tools": "Zana",
    "Dark mode": "Hali ya giza",
    "Light mode": "Hali ya mwanga",
    "Observed BMI interval": "Wigo wa BMI uliopimwa",
    "Height spread": "Tofauti ya urefu",
    "Weight spread": "Tofauti ya uzito",
    "Observed ratio interval": "Wigo wa uwiano uliopimwa",
    "Waist spread": "Tofauti ya kiuno",
    "Hip spread": "Tofauti ya nyonga",
    "You recorded": "Umeweka",
    "Within shown range": "Ndani ya wigo ulioonyeshwa",
    "Total Markers": "Viashiria vyote",
    "Done!": "Imekamilika!",
    "COMPLETE BLOOD COUNT (CBC)": "HESABU KAMILI YA DAMU (CBC)",
    "COMPLETE BLOOD COUNT": "HESABU KAMILI YA DAMU",
    "NORMAL": "NDANI YA WIGO",
    "Reference range": "Wigo wa marejeo",
    "Laboratory range used.": "Wigo wa maabara umetumika.",
    "General fallback range used.": "Wigo wa jumla wa akiba umetumika.",
    "Above Range": "Juu ya wigo",
    "Below Range": "Chini ya wigo",
    "Recognized markers": "Viashiria vilivyotambuliwa",
    "Within general range": "Ndani ya wigo wa jumla",
    "Outside general range": "Nje ya wigo wa jumla",
    "Saved content": "Maudhui yaliyohifadhiwa",
    "First day of your last menstrual period": "Siku ya kwanza ya hedhi yako ya mwisho",
    "January": "Januari",
    "February": "Februari",
    "March": "Machi",
    "April": "Aprili",
    "May": "Mei",
    "June": "Juni",
    "July": "Julai",
    "August": "Agosti",
    "September": "Septemba",
    "October": "Oktoba",
    "November": "Novemba",
    "December": "Desemba"
  };

  Object.keys(critical).forEach(function (key) {
    dictionary[key] = critical[key];
  });

  var phrases = Object.keys(dictionary).filter(function (key) {
    return key.length >= 4 && /[A-Za-z]/.test(key) && !/^https?:|^\//.test(key);
  }).sort(function (a, b) { return b.length - a.length; });
  var translatedValues = typeof WeakMap === "function" ? new WeakMap() : null;

  function translate(value) {
    var original = String(value == null ? "" : value);
    var trimmed = original.trim();
    if (!trimmed || !/[A-Za-z]/.test(trimmed)) return original;
    if (dictionary[trimmed]) return original.replace(trimmed, dictionary[trimmed]);
    var result = original;
    phrases.forEach(function (english) {
      if (result.indexOf(english) !== -1) result = result.split(english).join(dictionary[english]);
    });
    // Dynamic owner outputs contain these phrases with inconsistent casing or
    // embedded punctuation. Translate only the rendered Swahili surface; the
    // underlying English calculation engines and their values stay untouched.
    result = result
      .replace(/\bCOMPLETE BLOOD COUNT\b/gi, "HESABU KAMILI YA DAMU")
      .replace(/\bMarkers to discuss\b/gi, "Viashiria vya kujadili")
      .replace(/\boutside-range result\b/gi, "matokeo yaliyo nje ya wigo")
      .replace(/\bat or below\b/gi, "sawa au chini ya")
      .replace(/\bThe logged total\b/gi, "Jumla iliyorekodiwa")
      .replace(/\bThis is arithmetic only\b/gi, "Hii ni hesabu pekee")
      .replace(/\bresult\b/gi, "matokeo")
      .replace(/\brequired\b/gi, "inahitajika");
    result = result.replace(/(\d+) weeks?, (\d+) days? by calendar estimate/g, "$1 wiki, siku $2 kwa makadirio ya kalenda");
    result = result.replace(/(\d+) drink (entry|entries)\b/g, function (_match, count) { return count + (count === "1" ? " rekodi ya kinywaji" : " rekodi za vinywaji"); });
    result = result.replace(/The entered readings produce ratios from ([\d.]+) to ([\d.]+)\./g, "Vipimo vilivyoingizwa vinatoa uwiano kutoka $1 hadi $2.");
    Object.keys(critical).filter(function (key) { return /^(January|February|March|April|May|June|July|August|September|October|November|December)$/.test(key); }).forEach(function (month) {
      result = result.replace(new RegExp("(\\b\\d{1,2}\\s+)" + month + "(\\s+\\d{4}\\b)", "g"), "$1" + critical[month] + "$2");
    });
    return result.replace(/\bAfroZana\b/g, "AfroTools");
  }

  function skip(node) {
    var parent = node && node.parentElement;
    return !parent || /^(SCRIPT|STYLE|CODE|PRE|NOSCRIPT|TEXTAREA)$/.test(parent.tagName) || Boolean(parent.closest("[data-no-sw-health-translate]"));
  }

  function translateTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE || skip(node)) return;
    var parent = node.parentElement;
    if (parent && parent.tagName === "A" && /^\/[a-z0-9][^\s]*$/i.test(String(node.nodeValue || "").trim())) return;
    if (translatedValues && translatedValues.get(node) === node.nodeValue) return;
    var translated = translate(node.nodeValue);
    if (translated !== node.nodeValue) {
      if (translatedValues) translatedValues.set(node, translated);
      node.nodeValue = translated;
    }
  }

  function translateElement(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return;
    ["aria-label", "placeholder", "title", "alt"].forEach(function (name) {
      if (!element.hasAttribute(name)) return;
      var original = element.getAttribute(name);
      var translated = translate(original);
      if (translated !== original) element.setAttribute(name, translated);
    });
    if (element.tagName === "INPUT" && /^(button|submit|reset)$/.test(element.type || "")) element.value = translate(element.value);
    Array.prototype.forEach.call(element.childNodes, function (child) {
      if (child.nodeType === Node.TEXT_NODE) translateTextNode(child);
      else if (child.nodeType === Node.ELEMENT_NODE) translateElement(child);
    });
  }

  function init() {
    document.documentElement.setAttribute("data-sw-health-runtime-version", "health-parity-1");
    translateElement(document.body);
    document.documentElement.setAttribute("data-sw-health-ready", "true");
    var timer = null;
    var observer = new MutationObserver(function (records) {
      records.forEach(function (record) {
        if (record.type === "characterData") translateTextNode(record.target);
        Array.prototype.forEach.call(record.addedNodes || [], function (node) {
          if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
          else if (node.nodeType === Node.ELEMENT_NODE) translateElement(node);
        });
      });
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(function () { timer = null; translateElement(document.body); }, 20);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

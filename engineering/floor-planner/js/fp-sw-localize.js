(function (root) {
  "use strict";
  if (!document.body || document.body.getAttribute("data-fp-locale") !== "sw") return;

  var exact = {
    "Project saved": "Mradi umehifadhiwa", "Saved on this device": "Imehifadhiwa kwenye kifaa hiki",
    "Could not load project": "Mradi haukuweza kupakiwa", "Could not load share link": "Kiungo cha kushiriki hakikuweza kupakiwa",
    "Share link copied": "Kiungo cha kushiriki kimenakiliwa", "Plan JSON copied": "JSON ya ramani imenakiliwa",
    "Plan JSON downloaded": "JSON ya ramani imepakuliwa", "Could not create share link": "Kiungo cha kushiriki hakikuweza kutengenezwa",
    "Template loaded": "Kiolezo kimepakiwa", "Templates unavailable": "Violezo havipatikani", "Template engine is not ready.": "Injini ya violezo haijawa tayari.",
    "Template could not be loaded.": "Kiolezo hakikuweza kupakiwa.", "Room added": "Chumba kimeongezwa",
    "Planner not ready": "Mpangaji haujawa tayari", "The canvas is still loading.": "Turubai bado inapakia.",
    "Plan generated": "Ramani imetengenezwa", "Describe the plan": "Eleza ramani", "Action failed": "Kitendo kimeshindwa",
    "Layout review complete": "Ukaguzi wa mpangilio umekamilika", "Plan QA ready": "Ukaguzi wa ramani uko tayari",
    "QA report copied": "Ripoti ya ukaguzi imenakiliwa", "QA report downloaded": "Ripoti ya ukaguzi imepakuliwa",
    "No QA report": "Hakuna ripoti ya ukaguzi", "Ask a question": "Uliza swali", "AI Consent Required": "Idhini ya AI inahitajika",
    "AI stayed off": "AI imebaki imezimwa", "Tools opened": "Zana zimefunguliwa", "BOQ preview ready": "Onyesho la BOQ liko tayari",
    "Estimate ready": "Makadirio yako tayari", "BOQ JSON downloaded": "JSON ya BOQ imepakuliwa", "Printable BOQ opened": "BOQ ya kuchapisha imefunguliwa",
    "Preparing PDF...": "Inaandaa PDF...", "PDF exported": "PDF imepakuliwa", "Rendering plan...": "Inachora ramani...", "PNG exported": "PNG imepakuliwa",
    "BOQ ready": "BOQ iko tayari", "Preparing BOQ PDF...": "Inaandaa PDF ya BOQ...", "BOQ PDF exported": "PDF ya BOQ imepakuliwa",
    "BOQ CSV exported": "CSV ya BOQ imepakuliwa", "Generating BOQ XLSX...": "Inatengeneza XLSX ya BOQ...", "BOQ XLSX exported": "XLSX ya BOQ imepakuliwa",
    "Printable HTML downloaded": "HTML ya kuchapisha imepakuliwa", "Export recovered": "Upakuaji umerejeshwa", "Export failed.": "Upakuaji umeshindwa.",
    "Notice": "Taarifa", "Action completed.": "Kitendo kimekamilika.", "Floor planner recovered": "Mpangaji umepona baada ya hitilafu",
    "Select": "Chagua", "Wall": "Ukuta", "Door": "Mlango", "Window": "Dirisha", "Furniture": "Samani", "Measure": "Pima", "Label": "Lebo", "Erase": "Futa",
    "Properties": "Sifa", "Ready to draw": "Tayari kuchora", "Exact": "Sahihi", "Snap grid": "Nasa kwenye gridi", "Pan": "Sogeza turubai", "Tap a tool, then tap the canvas to place it.": "Gusa zana, kisha gusa turubai kuiweka.", "Tool: Select": "Zana: Chagua",
    "Select tool (V)": "Zana ya kuchagua (V)", "Wall tool (W)": "Zana ya ukuta (W)", "Door tool (D)": "Zana ya mlango (D)", "Window tool (N)": "Zana ya dirisha (N)", "Furniture tool (F)": "Zana ya samani (F)", "Measure tool (M)": "Zana ya kupima (M)", "Label tool (L)": "Zana ya lebo (L)", "Erase tool or delete selected": "Futa zana au kipengele kilichochaguliwa", "Undo (Ctrl+Z)": "Tengua (Ctrl+Z)", "Redo (Ctrl+Y)": "Rudia (Ctrl+Y)", "Save plan": "Hifadhi ramani", "Reset canvas view": "Rudisha mwonekano wa turubai", "Fit plan to canvas": "Linganisha ramani na turubai", "Open 3D preview": "Fungua onyesho la 3D", "Full screen planner": "Mpangaji wa skrini nzima", "Show or hide properties": "Onyesha au ficha sifa", "Close properties panel": "Funga paneli ya sifa", "Zoom in": "Kuza", "Zoom out": "Punguza", "Zoom level": "Kiwango cha kukuza", "Units": "Vipimo",
    "Rooms": "Vyumba", "Room": "Chumba", "Room area": "Eneo la vyumba", "Wall length": "Urefu wa kuta", "Openings": "Milango na madirisha", "Units": "Vipimo", "Estimate": "Makadirio",
    "Materials": "Vifaa", "Labour": "Kazi", "Estimated total": "Jumla ya makadirio", "Planning total": "Jumla ya kupanga",
    "Item": "Kipengele", "Qty": "Kiasi", "Unit": "Kipimo", "Rate": "Bei", "Amount": "Jumla", "Warning": "Onyo",
    "Country and currency": "Nchi na sarafu", "Download JSON": "Pakua JSON", "Print BOQ": "Chapisha BOQ", "Download BOQ CSV": "Pakua CSV ya BOQ",
    "Printable HTML": "HTML ya kuchapisha", "Price warnings": "Maonyo ya bei", "Price source": "Chanzo cha bei", "Confidence": "Uhakika",
    "Project name:": "Jina la mradi:", "Floor Plan Draft": "Rasimu ya Ramani ya Sakafu", "Untitled Plan": "Ramani isiyo na jina"
  };
  var fragments = [
    [" is stored locally in this browser.", " imehifadhiwa ndani ya kivinjari hiki."],
    ["Anyone with the link can load this draft.", "Mtu mwenye kiungo anaweza kupakia rasimu hii."],
    ["The plan was too large for a URL, so JSON was exported.", "Ramani ilikuwa kubwa kwa kiungo, kwa hiyo JSON imepakuliwa."],
    ["The plan was too large for a link, so JSON was copied.", "Ramani ilikuwa kubwa kwa kiungo, kwa hiyo JSON imenakiliwa."],
    ["Clipboard was unavailable", "Ubao wa kunakili haukupatikana"],
    ["No account or network service required", "Hakuna akaunti wala huduma ya mtandao inayohitajika"],
    [" with editable walls, door, and window.", " pamoja na kuta, mlango na dirisha vinavyoharirika."],
    [" rooms", " vyumba"], [" doors", " milango"], [" windows", " madirisha"],
    ["Planning aid only.", "Msaada wa kupanga tu."],
    ["Material estimates are planning aids, not contractor quotes.", "Makadirio ya vifaa ni msaada wa kupanga, si nukuu ya mkandarasi."],
    ["All calculations stay local.", "Hesabu zote zinabaki kwenye kifaa."],
    ["Editable fallback unit costs are ready. Nothing was uploaded.", "Bei mbadala zinazoharirika ziko tayari. Hakuna kilichopakiwa mtandaoni."],
    ["Choose PDF, CSV, XLSX, or printable HTML.", "Chagua PDF, CSV, XLSX au HTML ya kuchapisha."],
    ["The contractor-ready floor plan pack was downloaded.", "Kifurushi cha ramani kwa majadiliano na fundi kimepakuliwa."],
    ["The plan image was downloaded without editor UI chrome.", "Picha ya ramani imepakuliwa bila vidhibiti vya kuhariri."],
    ["Quantities, fallback rates, totals, and warnings were downloaded.", "Kiasi, bei mbadala, jumla na maonyo vimepakuliwa."],
    ["Spreadsheet export is ready for QS review.", "Jedwali liko tayari kukaguliwa na QS."],
    ["Use your browser print or Save as PDF dialog.", "Tumia kidirisha cha kuchapisha au Hifadhi kama PDF cha kivinjari."],
    ["Tool: ", "Zana: "], ["No rooms yet", "Bado hakuna vyumba"]
  ];

  function translate(value) {
    var source = String(value == null ? "" : value);
    if (exact[source]) return exact[source];
    return fragments.reduce(function (result, pair) { return result.split(pair[0]).join(pair[1]); }, source);
  }

  function shouldSkip(node) {
    if (!node || (node.nodeType !== 1 && node.nodeType !== 3)) return true;
    var parent = node.nodeType === 3 ? node.parentElement : node;
    return !parent || !parent.closest || parent.closest("script,style,textarea,input,[contenteditable],.fp-chat-msg.user");
  }

  function localizeNode(node) {
    if (!node || shouldSkip(node)) return;
    if (node.nodeType === 3) {
      var next = translate(node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
      return;
    }
    if (node.nodeType !== 1) return;
    ["title", "aria-label", "placeholder"].forEach(function (attribute) {
      if (node.hasAttribute(attribute)) node.setAttribute(attribute, translate(node.getAttribute(attribute)));
    });
    Array.prototype.forEach.call(node.childNodes, localizeNode);
  }

  var nativePrompt = root.prompt;
  root.prompt = function (message, initial) { return nativePrompt.call(root, translate(message), initial); };
  localizeNode(document.body);
  new MutationObserver(function (records) {
    records.forEach(function (record) {
      if (record.type === "characterData") localizeNode(record.target);
      Array.prototype.forEach.call(record.addedNodes || [], localizeNode);
    });
  }).observe(document.body, { childList: true, characterData: true, subtree: true });

  root.FPSwahili = { translate: translate, localizeNode: localizeNode };
})(window);

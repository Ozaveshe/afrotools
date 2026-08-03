(function () {
  "use strict";

  var configNode = document.getElementById("sw-tool-config");
  if (!configNode) return;

  var page;
  try {
    page = JSON.parse(configNode.textContent);
  } catch (error) {
    return;
  }

  var owner = page.owner;
  var workflow = document.querySelector("[data-sw-owner-workflow]");
  if (!owner || !workflow) return;

  var lastResult = null;
  var initialValues = {};
  var exportRoot = document.querySelector("[data-sw-owner-export]");
  var exportStatus = exportRoot && exportRoot.querySelector("[data-sw-export-status]");
  var errorNode = document.querySelector("[data-sw-owner-error]");

  function translate(value) {
    var text = String(value == null ? "" : value);
    if (owner.copy[text]) return owner.copy[text];
    var translated = text;
    Object.keys(owner.copy).sort(function (left, right) {
      return right.length - left.length;
    }).forEach(function (key) {
      if (translated.indexOf(key) >= 0) translated = translated.split(key).join(owner.copy[key]);
    });
    return translated
      .replace(/^You save (.+) over (.+) nights?$/i, "Unaokoa $1 kwa usiku $2")
      .replace(/^(.+) cheaper per person$/i, "$1 nafuu kwa kila mtu")
      .replace(/^Total est\.\s*/i, "Jumla ya makisio ")
      .replace(/^Per person:\s*/i, "Kwa kila mtu: ")
      .replace(/^Per traveller:\s*/i, "Kwa msafiri: ")
      .replace(/^Best time:\s*/i, "Muda unaofaa: ")
      .replace(/^Flight time:\s*/i, "Muda wa ndege: ")
      .replace(/^Distance:\s*/i, "Umbali: ")
      .replace(/Range:/gi, "Safu:")
      .replace(/\bBest time to book\b/gi, "Muda unaofaa kuweka nafasi")
      .replace(/\bEconomy class\b/gi, "Daraja la kawaida")
      .replace(/\bBusiness class\b/gi, "Daraja la biashara")
      .replace(/\bclass\b/gi, "daraja")
      .replace(/\bAfrika Kusinin\b/gi, "Afrika Kusini")
      .replace(/\bairlines?\b/gi, "mashirika ya ndege")
      .replace(/\bafter cooking\b/gi, "baada ya kupika")
      .replace(/\bAccommodation\b/gi, "Malazi")
      .replace(/\bIncluded in meal budget\b/gi, "Imejumuishwa kwenye bajeti ya chakula")
      .replace(/\bAirbnb advantage\b/gi, "Faida ya Airbnb")
      .replace(/\bAirbnb saves\b/gi, "Airbnb inaokoa")
      .replace(/\bLong stay discount\b/gi, "Punguzo la kukaa muda mrefu")
      .replace(/\bLoyalty points only\b/gi, "Alama za uaminifu pekee")
      .replace(/\bNone\b/gi, "Hakuna")
      .replace(/\bVaries\b/gi, "Hutofautiana")
      .replace(/\bGroup\b/gi, "Kundi")
      .replace(/\bpeople\b/gi, "watu")
      .replace(/\bshare 1 space\b/gi, "wanatumia nafasi moja")
      .replace(/\bneeded\b/gi, "vinahitajika")
      .replace(/\bSimilar\b/gi, "Karibu sawa")
      .replace(/\bNet total\b/gi, "Jumla halisi")
      .replace(/\bNet Jumla\b/gi, "Jumla halisi")
      .replace(/\bwins\b/gi, "ndiyo nafuu")
      .replace(/Estimated:/gi, "Makisio:")
      .replace(/\bfor your group\b/gi, "kwa kundi lako")
      .replace(/\bfor your\b/gi, "kwa")
      .replace(/\btraffic\b/gi, "foleni")
      .replace(/\bMetered \/ Yellow Taxi\b/gi, "Taxi yenye mita / ya njano")
      .replace(/\bUber \/ Bolt \/ Ride App\b/gi, "Uber / Bolt / programu ya usafiri")
      .replace(/\bAirport Shuttle \/ Bus\b/gi, "Shuttle / basi la uwanja")
      .replace(/\bPrivate Car \/ Transfer\b/gi, "Gari binafsi / transfer")
      .replace(/\bFOR ([0-9]+) PASSENGERS\b/gi, "KWA ABIRIA $1")
      .replace(/\bFOR (?=[0-9]+ ABIRIA\b)/gi, "KWA ")
      .replace(/\ball meals\b/gi, "milo yote")
      .replace(/\bflights\+local\+visa\b/gi, "ndege + usafiri wa ndani + visa")
      .replace(/\bFood & Drinks\b/gi, "Chakula na vinywaji")
      .replace(/\bActivities & Excursions\b/gi, "Shughuli na matembezi")
      .replace(/\bSHARED COST\b/gi, "GHARAMA YA PAMOJA")
      .replace(/\bSHARED\b/gi, "YA PAMOJA")
      .replace(/\bReturn flights\b/gi, "Ndege ya kwenda na kurudi")
      .replace(/\bVisa fees\b/gi, "Ada za visa")
      .replace(/\bmonths? ahead\b/gi, "miezi mapema")
      .replace(/\bfinals sell out\b/gi, "fainali hujaa")
      .replace(/\bFLIGHTS\b/gi, "NDEGE")
      .replace(/\breturn ×\b/gi, "kwenda na kurudi ×")
      .replace(/\bfestival surge\b/gi, "nyongeza ya tamasha")
      .replace(/\bFOOD & DRINK\b/gi, "CHAKULA NA VINYWAJI")
      .replace(/\bTICKETS & ACTIVITIES\b/gi, "TIKETI NA SHUGHULI")
      .replace(/\bincl\. extras\b/gi, "pamoja na nyongeza")
      .replace(/\bHotel (?=\()/gi, "Hoteli ")
      .replace(/\bLocal transport\b/gi, "Usafiri wa ndani")
      .replace(/\bEvent tickets\b/gi, "Tiketi za tukio")
      .replace(/\bActivities & extras\b/gi, "Shughuli na nyongeza")
      .replace(/\bnormal season\b/gi, "msimu wa kawaida")
      .replace(/approx\./gi, "takriban")
      .replace(/\best\./gi, "makisio")
      .replace(/\bextended discount\b/gi, "punguzo la muda mrefu")
      .replace(/\b([1-5]) Star\b/gi, "$1 Nyota")
      .replace(/\bBudget\b/gi, "Bajeti")
      .replace(/\bStandard\b/gi, "Kawaida")
      .replace(/\bSuperior\b/gi, "Juu")
      .replace(/\bLuxury\b/gi, "Kifahari")
      .replace(/\ball-in\b/gi, "gharama zote")
      .replace(/\breturn\b/gi, "kwenda na kurudi")
      .replace(/\bFlights \(return, est\.\)\b/gi, "Ndege ya kwenda na kurudi, makisio")
      .replace(/\bSafari Package\b/gi, "Kifurushi cha safari")
      .replace(/\bFROM AFRICA\b/gi, "KUTOKA AFRIKA")
      .replace(/\bExtras, Tips & Shopping\b/gi, "Nyongeza, bakshishi na manunuzi")
      .replace(/\bOF SAFARI COST\b/gi, "YA GHARAMA YA SAFARI")
      .replace(/\bPeak\b/gi, "Msimu wenye mahitaji")
      .replace(/\bShoulder\b/gi, "Msimu wa kati")
      .replace(/\bYour choice\b/gi, "Chaguo lako")
      .replace(/Est\. luggage weight:/gi, "Makisio ya uzito wa mizigo:")
      .replace(/\bluggage weight\b/gi, "uzito wa mzigo")
      .replace(/\bDOCUMENTS & MONEY\b/gi, "NYARAKA NA FEDHA")
      .replace(/CLOTHING \(TROPICAL\)/gi, "MAVAZI YA HALI YA JOTO")
      .replace(/TRIP-SPECIFIC \(SAFARI\)/gi, "VIFAA MAALUMU VYA SAFARI")
      .replace(/\bHEALTH & MEDICAL\b/gi, "AFYA NA MATIBABU")
      .replace(/\bTOILETRIES\b/gi, "VIFAA VYA USAFI")
      .replace(/\bELECTRONICS\b/gi, "VIFAA VYA KIELEKTRONIKI")
      .replace(/\bSAFETY & SECURITY\b/gi, "USALAMA")
      .replace(/\bOTHER ESSENTIALS\b/gi, "VITU VINGINE MUHIMU")
      .replace(/\bitems checked\b/gi, "vitu vilivyowekwa alama")
      .replace(/\broom\(s\)/gi, "vyumba")
      .replace(/\bnights?\b/gi, "usiku")
      .replace(/\bdays?\b/gi, "siku")
      .replace(/\btravellers?\b/gi, "wasafiri")
      .replace(/\bMonthly tablets \((\d+) months?\)/gi, "Vidonge vya mwezi ($1 miezi)")
      .replace(/\b(\d+) wks before\b/gi, "Wiki $1 kabla")
      .replace(/\bper person\b/gi, "kwa kila mtu")
      .replace(/\bper night\b/gi, "kwa usiku")
      .replace(/\bperson\b/gi, "mtu")
      .replace(/\bpax\b/gi, "watu")
      .replace(/\btotal\b/gi, "jumla")
      .replace(/\bestimate\b/gi, "makisio")
      .replace(/\bcheaper\b/gi, "nafuu zaidi")
      .replace(/\bchecked\b/gi, "vilivyowekwa alama")
      .replace(/\b(\d+) of (\d+)\b/gi, "$1 kati ya $2")
      .replace(/\bof items\b/gi, "kati ya vitu");
  }

  function translateTree(root) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var translated = translate(node.nodeValue);
      if (translated !== node.nodeValue) node.nodeValue = translated;
    });
    root.querySelectorAll("[aria-label],[placeholder],[title]").forEach(function (node) {
      ["aria-label", "placeholder", "title"].forEach(function (attribute) {
        if (node.hasAttribute(attribute)) node.setAttribute(attribute, translate(node.getAttribute(attribute)));
      });
    });
  }

  function visibleResult() {
    return document.getElementById(owner.resultId);
  }

  function clearInvalid() {
    owner.fieldIds.forEach(function (id) {
      var field = document.getElementById(id);
      if (field) field.removeAttribute("aria-invalid");
    });
    if (errorNode) errorNode.textContent = "";
  }

  function clearStale() {
    clearInvalid();
    lastResult = null;
    var result = visibleResult();
    if (result) result.style.display = "none";
    if (exportStatus) exportStatus.textContent = "";
  }

  function fail(message, field) {
    lastResult = null;
    if (field) {
      field.setAttribute("aria-invalid", "true");
      field.focus();
    }
    if (errorNode) errorNode.textContent = message;
    var result = visibleResult();
    if (result) result.style.display = "none";
    throw new Error(message);
  }

  function validate() {
    clearInvalid();
    var invalid = owner.invalid || {};
    if (invalid.select) {
      var selected = document.getElementById(invalid.select);
      if (!selected || !String(selected.value || "").trim()) {
        fail("Chagua thamani halali kabla ya kuendelea.", selected);
      }
    }
    (invalid.numbers || []).forEach(function (id) {
      var field = document.getElementById(id);
      var value = field && Number(field.value);
      if (!field || !Number.isFinite(value) || value <= 0) {
        fail("Weka namba iliyo zaidi ya sifuri kwenye sehemu iliyoonyeshwa.", field);
      }
    });
  }

  function fieldSnapshot() {
    var values = {};
    owner.fieldIds.forEach(function (id) {
      var field = document.getElementById(id);
      if (!field) return;
      values[id] = field.type === "checkbox" ? Boolean(field.checked) : field.value;
    });
    return values;
  }

  function restoreFields(values) {
    owner.fieldIds.forEach(function (id) {
      var field = document.getElementById(id);
      if (!field || !Object.prototype.hasOwnProperty.call(values, id)) return;
      if (field.type === "checkbox") field.checked = Boolean(values[id]);
      else field.value = String(values[id]);
      field.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  function replacePlanningTip() {
    ["flightTips", "cityTips", "tipText", "savingsText", "festTips", "tipsArea", "bestTimeText", "baggageTip"].forEach(function (id) {
      var node = document.getElementById(id);
      if (node) node.textContent = owner.planningNote;
    });
    if (owner.safetyMode === "deterministic-cost-schedule") {
      var healthBoundary = workflow.querySelector(".en-tip-text");
      if (healthBoundary) healthBoundary.textContent = owner.planningNote;
    }
  }

  function assertFiniteResult(result) {
    var text = (result && result.textContent) || "";
    if (!text.trim()) fail("Programu haikutoa matokeo kamili.", null);
    if (/\b(?:NaN|undefined|null|Infinity)\b/i.test(text)) {
      fail("Matokeo hayakuwa namba halali. Kagua viingizo.", null);
    }
  }

  function captureResult() {
    var result = visibleResult();
    replacePlanningTip();
    translateTree(result);
    assertFiniteResult(result);
    result.setAttribute("aria-live", "polite");
    lastResult = {
      fields: fieldSnapshot(),
      resultText: result.innerText.trim()
    };
    if (exportStatus) exportStatus.textContent = "Matokeo yako tayari kuhifadhiwa kwenye kifaa hiki.";
  }

  function runOwner(original) {
    return function () {
      try {
        validate();
        var result = visibleResult();
        if (result) result.style.removeProperty("display");
        original.apply(window, arguments);
        captureResult();
      } catch (problem) {
        if (errorNode && !errorNode.textContent) {
          errorNode.textContent = problem.message || "Kagua viingizo na ujaribu tena.";
        }
      }
    };
  }

  function payload() {
    if (!lastResult) throw new Error("Kokotoa matokeo kabla ya kuhifadhi.");
    return {
      schema: "afrotools.sw.travel-owner.v2",
      toolId: page.toolId,
      ownerHash: owner.ownerHash,
      language: "sw",
      localOnly: true,
      createdAt: new Date().toISOString(),
      fields: lastResult.fields,
      resultText: lastResult.resultText,
      source: owner.source
    };
  }

  function reportText() {
    var data = payload();
    var lines = [page.name, "", data.resultText, "", "Viingizo"];
    owner.fieldIds.forEach(function (id, index) {
      var field = document.getElementById(id);
      var label = document.querySelector('label[for="' + id.replace(/"/g, '\\"') + '"]');
      var labelText = "";
      if (label) {
        var copy = label.cloneNode(true);
        copy.querySelectorAll("input,select,textarea,button").forEach(function (node) { node.remove(); });
        labelText = copy.textContent.trim();
      }
      if (!labelText) labelText = "Sehemu " + (index + 1);
      var value = data.fields[id];
      if (field && field.tagName === "SELECT" && field.selectedIndex >= 0) {
        value = field.options[field.selectedIndex].textContent.trim();
      }
      lines.push("- " + labelText + ": " + String(value));
    });
    lines.push("", "Data ya moja kwa moja: " + (owner.source.live ? "ndiyo" : "hapana (live=false)"));
    lines.push("", "Chanzo: " + owner.source.state);
    lines.push("Inawakilisha: " + owner.source.asOf);
    lines.push("Imehakikiwa: " + owner.source.reviewedAt);
    lines.push("Uhakika: " + owner.source.confidence);
    lines.push("Usasishaji: " + owner.source.cadence);
    (owner.source.assumptions || []).forEach(function (item) { lines.push("Mpaka: " + item); });
    lines.push("", "Faragha: taarifa hazikutumwa mtandaoni.");
    return lines.join("\n");
  }

  function downloadJson() {
    var blob = new Blob([JSON.stringify(payload(), null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = page.swSlug + "-matokeo.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  function downloadPdf() {
    var jsPDF = window.jspdf && window.jspdf.jsPDF;
    if (!jsPDF) throw new Error("Kitengeneza PDF hakikupatikana.");
    var documentPdf = new jsPDF({ unit: "pt", format: "a4" });
    var lines = documentPdf.splitTextToSize(reportText(), 500);
    documentPdf.setFont("helvetica", "normal");
    documentPdf.setFontSize(10);
    var top = 56;
    var bottom = 48;
    var lineHeight = 14;
    var pageHeight = documentPdf.internal.pageSize.getHeight();
    var y = top;
    lines.forEach(function (line) {
      if (y > pageHeight - bottom) {
        documentPdf.addPage();
        y = top;
      }
      documentPdf.text(String(line), 48, y);
      y += lineHeight;
    });
    documentPdf.save(page.swSlug + "-matokeo.pdf");
  }

  function status(message) {
    if (exportStatus) exportStatus.textContent = message;
  }

  translateTree(workflow);
  owner.fieldIds.forEach(function (id) {
    var field = document.getElementById(id);
    if (!field) return;
    initialValues[id] = field.type === "checkbox" ? Boolean(field.checked) : field.value;
    field.addEventListener("input", clearStale);
    field.addEventListener("change", clearStale);
  });

  if (typeof window[owner.action] === "function") {
    window[owner.action] = runOwner(window[owner.action]);
  }

  if (typeof window.updateCount === "function") {
    var originalUpdateCount = window.updateCount;
    window.updateCount = function () {
      originalUpdateCount.apply(window, arguments);
      translateTree(visibleResult());
      if (lastResult) lastResult.resultText = visibleResult().innerText.trim();
    };
  }

  exportRoot.addEventListener("click", function (event) {
    try {
      if (event.target.closest("[data-sw-copy]")) {
        var text = reportText();
        if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error("Nakili mwenyewe kutoka kwenye ripoti.");
        navigator.clipboard.writeText(text).then(function () { status("Ripoti imenakiliwa."); })
          .catch(function () { status("Nakili mwenyewe kutoka kwenye ripoti."); });
      } else if (event.target.closest("[data-sw-print]")) {
        document.body.classList.add("sw-print-result");
        window.print();
        window.setTimeout(function () { document.body.classList.remove("sw-print-result"); }, 0);
      } else if (event.target.closest("[data-sw-json]")) {
        downloadJson();
        status("JSON imepakuliwa.");
      } else if (event.target.closest("[data-sw-pdf]")) {
        downloadPdf();
        status("PDF imepakuliwa.");
      } else if (event.target.closest("[data-sw-import-trigger]")) {
        var importControl = exportRoot.querySelector("[data-sw-import]");
        if (importControl) importControl.click();
      } else if (event.target.closest("[data-sw-owner-reset]")) {
        restoreFields(initialValues);
        clearInvalid();
        lastResult = null;
        var result = visibleResult();
        if (result) result.style.display = "none";
        status("Programu imerudishwa mwanzo.");
        var first = workflow.querySelector("input,select,textarea,button");
        if (first) first.focus();
      }
    } catch (problem) {
      status(problem.message || "Hatua haikukamilika.");
    }
  });

  var importInput = exportRoot.querySelector("[data-sw-import]");
  importInput.addEventListener("change", function () {
    var file = importInput.files && importInput.files[0];
    if (!file) return;
    file.text().then(function (text) {
      var data = JSON.parse(text);
      if (data.schema !== "afrotools.sw.travel-owner.v2" ||
          data.toolId !== page.toolId ||
          data.ownerHash !== owner.ownerHash ||
          !data.fields) {
        throw new Error("Faili si matokeo halali ya programu hii.");
      }
      restoreFields(data.fields);
      if (typeof window[owner.action] !== "function") throw new Error("Programu haikuweza kufunguliwa tena.");
      window[owner.action]();
      if (!lastResult) throw new Error("Viingizo vya faili havikutoa matokeo halali.");
      status("JSON imefunguliwa tena na matokeo yamekokotolewa.");
    }).catch(function (problem) {
      status(problem.message || "JSON haikuweza kufunguliwa.");
    }).finally(function () {
      importInput.value = "";
    });
  });

  var consent = document.querySelector("[data-ai-consent]");
  var aiButton = document.querySelector("[data-ai-prompt]");
  var aiOutput = document.querySelector("[data-ai-output]");
  if (consent && aiButton && aiOutput) {
    consent.addEventListener("change", function () {
      aiButton.disabled = !consent.checked;
      if (!consent.checked) aiOutput.textContent = "";
    });
    aiButton.addEventListener("click", function () {
      if (!consent.checked) return;
      aiOutput.textContent = "Swali limeandaliwa kwenye kifaa; halijatumwa:\n“Thibitisha vyanzo, usasishaji na mawazo ya " +
        page.name + " bila kutunga bei, ratiba, nafasi, afya au masharti ya kuingia.”";
    });
  }

  var themeButton = document.querySelector("[data-theme-toggle]");
  if (themeButton) {
    themeButton.addEventListener("click", function () {
      if (window.AfroTools && window.AfroTools.darkMode) window.AfroTools.darkMode.toggle();
    });
  }
}());

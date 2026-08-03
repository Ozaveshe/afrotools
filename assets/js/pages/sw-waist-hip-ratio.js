(function () {
  "use strict";

  var engine = window.WaistHipEngine;
  var form = document.getElementById("waistHipForm");
  var resultCard = document.getElementById("resultCard");
  var errorNode = document.getElementById("formError");
  var statusNode = document.getElementById("actionStatus");
  var current = null;

  if (!engine || !form || !resultCard) return;

  var measurementIds = ["waist", "waist2", "hip", "hip2"];
  var fieldIds = ["applicability", "units", "waist", "waist2", "hip", "hip2", "reference"];

  function node(id) { return document.getElementById(id); }
  function value(id) { return node(id).value; }
  function unitLabel() { return value("units") === "in" ? "inchi" : "cm"; }
  function format(valueToFormat, digits) { return Number(valueToFormat).toFixed(digits); }
  function clearInvalid() {
    fieldIds.forEach(function (id) { node(id).setAttribute("aria-invalid", "false"); });
  }
  function setStatus(message, isError) {
    statusNode.textContent = message || "";
    statusNode.classList.toggle("error", Boolean(isError));
  }
  function enableExports(enabled) {
    document.querySelectorAll("[data-export]").forEach(function (button) { button.disabled = !enabled; });
  }
  function clearResult(message) {
    current = null;
    resultCard.hidden = true;
    node("resultValue").textContent = "";
    node("referenceLabel").textContent = "";
    node("metricGrid").replaceChildren();
    node("resultCopy").replaceChildren();
    enableExports(false);
    if (message) setStatus(message, false);
  }
  function syncUnits() {
    var inches = value("units") === "in";
    measurementIds.forEach(function (id) {
      node(id).min = inches ? "12" : "30";
      node(id).max = inches ? "100" : "250";
    });
  }
  function input() {
    return {
      units: value("units"),
      applicability: value("applicability"),
      waist: value("waist"),
      repeatWaist: value("waist2"),
      hip: value("hip"),
      repeatHip: value("hip2"),
      reference: value("reference")
    };
  }
  function errorField(message) {
    if (message.indexOf("measurement context") >= 0) return "applicability";
    if (message.indexOf("centimetres or inches") >= 0) return "units";
    if (message.indexOf("reference option") >= 0) return "reference";
    if (message.indexOf("First waist") === 0) return "waist";
    if (message.indexOf("Second waist") === 0) return "waist2";
    if (message.indexOf("First hip") === 0) return "hip";
    if (message.indexOf("Second hip") === 0) return "hip2";
    return "applicability";
  }
  function errorCopy(field) {
    var bounds = value("units") === "in" ? "12 na 100 inchi" : "30 na 250 cm";
    var copy = {
      applicability: "Chagua muktadha wa kipimo.",
      units: "Chagua sentimita au inchi.",
      reference: "Chagua rejea inayokubalika.",
      waist: "Weka mzunguko wa kwanza wa kiuno kati ya " + bounds + ".",
      waist2: "Mzunguko wa pili wa kiuno lazima uwe kati ya " + bounds + ", au uachwe wazi.",
      hip: "Weka mzunguko wa kwanza wa nyonga kati ya " + bounds + ".",
      hip2: "Mzunguko wa pili wa nyonga lazima uwe kati ya " + bounds + ", au uachwe wazi."
    };
    return copy[field] || "Kagua vipimo ulivyoingiza.";
  }
  function showError(error) {
    var field = errorField(error.message || "");
    clearInvalid();
    node(field).setAttribute("aria-invalid", "true");
    errorNode.textContent = errorCopy(field);
    setStatus("Hesabu haijafanywa kwa sababu ya thamani batili.", true);
    node(field).focus();
  }
  function metric(label, number, note) {
    var item = document.createElement("div");
    item.className = "metric";
    var span = document.createElement("span");
    var strong = document.createElement("strong");
    var small = document.createElement("small");
    span.textContent = label;
    strong.textContent = number;
    small.textContent = note;
    item.append(span, strong, small);
    return item;
  }
  function paragraph(text, strongLabel) {
    var p = document.createElement("p");
    if (strongLabel) {
      var strong = document.createElement("strong");
      strong.textContent = strongLabel + " ";
      p.append(strong);
    }
    p.append(document.createTextNode(text));
    return p;
  }
  function interpretation(result, values) {
    var threshold = values.reference === "women" ? 0.85 : values.reference === "men" ? 0.90 : null;
    var allowed = values.applicability === "adult";
    var applied = allowed && threshold !== null;
    var referenceLabel = "Uwiano pekee — hakuna rejea ya watu wengi iliyotumika";
    var context = "Hakuna rejea ya jinsia ya watu wengi iliyotumika.";
    if (!allowed && threshold !== null) {
      context = "Rejea ya mtu mzima haikutumika kwa sababu muktadha ni ujauzito au mabadiliko ya tumbo, chini ya miaka 18, au hauna uhakika.";
    } else if (applied) {
      referenceLabel = (result.ratio >= threshold ? "Sawa na au juu ya" : "Chini ya") + " rejea iliyochaguliwa ya " + threshold.toFixed(2);
      context = result.ratio >= threshold
        ? "Hii ni ishara ya mazungumzo ya kiwango cha watu wengi pekee; haitambui unene, mafuta ya mwili au ugonjwa."
        : "Thamani iliyo chini ya rejea haiondoi tatizo la afya wala haithibitishi afya njema.";
    }
    var boundary = result.anyRepeat
      ? "Vipimo ulivyoingiza vinatoa uwiano kutoka " + format(result.low, 3) + " hadi " + format(result.high, 3) + "."
      : "Umeweka usomaji mmoja tu wa kiuno na nyonga, hivyo marudio hayawezi kukaguliwa.";
    if (applied && result.low < threshold && result.high >= threshold) {
      boundary += " Nafasi ya usomaji wa marudio inavuka rejea ya " + threshold.toFixed(2) + ", hivyo lebo si thabiti kwa vipimo ulivyoingiza.";
    } else if (applied && Math.abs(result.ratio - threshold) < 0.01) {
      boundary += " Uwiano usiozungushwa uko karibu na rejea ya " + threshold.toFixed(2) + ".";
    }
    return {
      referenceLabel: referenceLabel,
      context: context,
      boundary: boundary,
      warning: "Uwiano wa kiuno na nyonga hauwezi kutambua unene, mafuta ya mwili, kisukari, ugonjwa wa moyo na mishipa au afya kwa ujumla."
    };
  }
  function render(result, values) {
    var copy = interpretation(result, values);
    current = { result: result, values: values, copy: copy };
    node("resultValue").textContent = format(result.ratio, 3);
    node("referenceLabel").textContent = copy.referenceLabel;
    node("metricGrid").replaceChildren(
      metric("Nafasi ya uwiano", format(result.low, 3) + "–" + format(result.high, 3), "si nafasi ya uhakika wa kitabibu"),
      metric("Wastani wa kiuno", format(result.meanWaist, 1) + " " + unitLabel(), "kutoka vipimo ulivyoingiza"),
      metric("Wastani wa nyonga", format(result.meanHip, 1) + " " + unitLabel(), "kutoka vipimo ulivyoingiza"),
      metric("Tofauti ya kiuno", result.waistDifference === null ? "hakuna marudio" : format(result.waistDifference, 1) + " " + unitLabel(), "tofauti kamili"),
      metric("Tofauti ya nyonga", result.hipDifference === null ? "hakuna marudio" : format(result.hipDifference, 1) + " " + unitLabel(), "tofauti kamili")
    );
    node("resultCopy").replaceChildren(
      paragraph(copy.context, "Muktadha:"),
      paragraph(copy.boundary, "Marudio:"),
      paragraph(copy.warning, "Tahadhari:")
    );
    errorNode.textContent = "";
    clearInvalid();
    resultCard.hidden = false;
    enableExports(true);
    setStatus("Hesabu imekamilika ndani ya kivinjari.", false);
    resultCard.focus();
  }
  function calculate() {
    var values = input();
    try {
      var result = engine.calculate(values);
      render(result, values);
      return result;
    } catch (error) {
      clearResult();
      showError(error);
      return null;
    }
  }
  function selectedText(id) {
    var select = node(id);
    return select.options[select.selectedIndex].text;
  }
  function report() {
    if (!current) return "";
    var result = current.result;
    var values = current.values;
    var copy = current.copy;
    return [
      "Muhtasari wa uwiano wa kiuno na nyonga — AfroTools",
      "Tarehe ya ukaguzi wa vyanzo: 2 Agosti 2026",
      "Si utambuzi wala uamuzi wa matibabu.",
      "",
      "Muktadha wa kipimo: " + selectedText("applicability"),
      "Kipimo: " + selectedText("units"),
      "Kiuno cha kwanza: " + values.waist,
      "Kiuno cha pili: " + (values.repeatWaist || "hakijawekwa"),
      "Nyonga ya kwanza: " + values.hip,
      "Nyonga ya pili: " + (values.repeatHip || "haijawekwa"),
      "Rejea iliyoombwa: " + selectedText("reference"),
      "",
      "Uwiano: " + format(result.ratio, 3),
      "Nafasi ya uwiano: " + format(result.low, 3) + "–" + format(result.high, 3),
      "Wastani wa kiuno: " + format(result.meanWaist, 1) + " " + unitLabel(),
      "Wastani wa nyonga: " + format(result.meanHip, 1) + " " + unitLabel(),
      copy.referenceLabel,
      copy.context,
      copy.boundary,
      "",
      "Mbinu: wastani wa kiuno umegawanywa kwa wastani wa nyonga; nafasi hutumia vipimo vya chini na juu ulivyoingiza na si nafasi ya uhakika wa kitabibu.",
      "Tahadhari: " + copy.warning,
      "Faragha: vipimo havikuhifadhiwa wala kutumwa mtandaoni."
    ].join("\n");
  }
  function download() {
    var text = report();
    if (!text) return setStatus("Hesabu inahitajika kabla ya kupakua.", true);
    var url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "uwiano-wa-kiuno-na-nyonga.txt";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setStatus("Faili ya TXT imepakuliwa.", false);
  }
  function printPdf() {
    if (!current) return setStatus("Hesabu inahitajika kabla ya kuchapisha.", true);
    window.print();
    setStatus("Kidirisha cha uchapishaji kimefunguliwa; chagua kuhifadhi kama PDF.", false);
  }
  function invalidate() {
    clearInvalid();
    errorNode.textContent = "";
    if (current) clearResult("Vipimo vimebadilika. Matokeo ya zamani yamefutwa; kokotoa tena.");
    else if (statusNode.classList.contains("error")) setStatus("", false);
  }
  function syncTheme() {
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    node("themeToggle").setAttribute("aria-pressed", String(dark));
    node("themeToggle").textContent = dark ? "Mandhari ya mwanga" : "Mandhari ya giza";
  }

  form.addEventListener("submit", function (event) { event.preventDefault(); calculate(); });
  form.querySelectorAll("input,select").forEach(function (control) {
    control.setAttribute("aria-invalid", "false");
    control.addEventListener(control.matches("select") ? "change" : "input", function () {
      if (control.id === "units") syncUnits();
      invalidate();
    });
  });
  node("downloadTxt").addEventListener("click", download);
  node("printPdf").addEventListener("click", printPdf);
  node("clearTool").addEventListener("click", function () {
    form.reset();
    syncUnits();
    clearInvalid();
    errorNode.textContent = "";
    clearResult();
    setStatus("Vipimo na matokeo vimefutwa.", false);
    node("applicability").focus();
  });
  node("themeToggle").addEventListener("click", function () {
    var root = document.documentElement;
    var dark = root.getAttribute("data-theme") !== "dark";
    root.setAttribute("data-theme", dark ? "dark" : "light");
    root.style.colorScheme = dark ? "dark" : "light";
    syncTheme();
  });
  syncUnits();
  clearInvalid();
  enableExports(false);
  syncTheme();
  document.documentElement.setAttribute("data-sw-waist-hip-ready", "true");
  window.AFROTOOLS_SW_WAIST_HIP_OWNER = { version: "2026-08-02", calculate: calculate, report: report };
}());

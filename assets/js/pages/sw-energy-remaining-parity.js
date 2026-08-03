(function initSwEnergyRemainingParity(root) {
  "use strict";

  var configNode = document.querySelector("script[data-sw-energy-config]");
  var config;
  try { config = JSON.parse(configNode ? configNode.textContent : "null"); } catch (error) { config = null; }
  if (!config) return;

  root.AfroLocalOnly = true;

  var COUNTRY_NAMES = {
    NG:"Nigeria", KE:"Kenya", ZA:"Afrika Kusini", GH:"Ghana", EG:"Misri", ET:"Ethiopia", TZ:"Tanzania", UG:"Uganda", RW:"Rwanda",
    CI:"Côte d’Ivoire", CM:"Kamerun", SN:"Senegal", MA:"Moroko", TN:"Tunisia", AO:"Angola", ZM:"Zambia", ZW:"Zimbabwe", MZ:"Msumbiji",
    MW:"Malawi", MG:"Madagaska", BW:"Botswana", NA:"Namibia", LS:"Lesotho", SZ:"Eswatini", MU:"Mauritius", SC:"Shelisheli", DJ:"Jibuti",
    ER:"Eritrea", SO:"Somalia", SS:"Sudan Kusini", SD:"Sudan", LY:"Libya", DZ:"Algeria", CD:"Jamhuri ya Kidemokrasia ya Kongo",
    CG:"Jamhuri ya Kongo", TD:"Chad", CF:"Jamhuri ya Afrika ya Kati", GA:"Gabon", GQ:"Guinea ya Ikweta", ST:"São Tomé na Príncipe",
    KM:"Komoro", BI:"Burundi", BJ:"Benin", BF:"Burkina Faso", CV:"Cabo Verde", GM:"Gambia", GN:"Guinea", GW:"Guinea-Bissau",
    LR:"Liberia", ML:"Mali", NE:"Niger", SL:"Sierra Leone", TG:"Togo", MR:"Mauritania"
  };
  var REGULATORS = {
    NG:["NERC — mdhibiti wa umeme wa Nigeria","https://nerc.gov.ng/"],
    KE:["EPRA — mdhibiti wa nishati wa Kenya","https://www.epra.go.ke/"],
    ZA:["NERSA — mdhibiti wa nishati wa Afrika Kusini","https://www.nersa.org.za/"],
    GH:["PURC — mdhibiti wa huduma wa Ghana","https://www.purc.com.gh/"],
    TZ:["EWURA — mdhibiti wa nishati na maji wa Tanzania","https://www.ewura.go.tz/"],
    UG:["ERA — mdhibiti wa umeme wa Uganda","https://www.era.go.ug/"],
    RW:["RURA — mdhibiti wa huduma wa Rwanda","https://www.rura.rw/"],
    ZM:["ERB — mdhibiti wa nishati wa Zambia","https://www.erb.org.zm/"],
    ZW:["ZERA — mdhibiti wa nishati wa Zimbabwe","https://www.zera.co.zw/"],
    NA:["ECB — mdhibiti wa umeme wa Namibia","https://www.ecb.org.na/"],
    BW:["BERA — mdhibiti wa nishati wa Botswana","https://www.bera.co.bw/"],
    DZ:["CREG — mdhibiti wa umeme na gesi wa Algeria","https://www.creg.dz/"]
  };

  var form = document.getElementById("energyForm");
  var countrySelect = document.getElementById("country");
  var results = document.getElementById("results");
  var metricGrid = document.getElementById("metricGrid");
  var formStatus = document.getElementById("formStatus");
  var exportStatus = document.getElementById("exportStatus");
  var regulatorLink = document.getElementById("regulatorLink");
  var lastRecord = null;

  function setStatus(node, message, state) {
    if (!node) return;
    node.textContent = message || "";
    node.dataset.state = state || "";
  }

  function populateCountries() {
    var countries = root.ENERGY_DATA && root.ENERGY_DATA.countries || {};
    Object.keys(countries).sort(function (a, b) {
      return (COUNTRY_NAMES[a] || countries[a].name).localeCompare(COUNTRY_NAMES[b] || countries[b].name, "sw");
    }).forEach(function (code) {
      var option = document.createElement("option");
      option.value = code;
      option.textContent = COUNTRY_NAMES[code] || countries[code].name || code;
      countrySelect.appendChild(option);
    });
    countrySelect.value = countries.TZ ? "TZ" : (countries.KE ? "KE" : Object.keys(countries)[0] || "");
    updateSourceLink();
  }

  function updateSourceLink() {
    var source = REGULATORS[countrySelect.value];
    regulatorLink.href = source ? source[1] : "https://www.iea.org/regions/africa";
    regulatorLink.textContent = source ? source[0] : "IEA Africa — rejeo ya nishati; kiungo cha mdhibiti wa nchi hii bado hakijafungwa";
  }

  function values() {
    var data = {};
    Array.prototype.forEach.call(form.elements, function (field) {
      if (!field.name || field.type === "submit") return;
      data[field.name] = field.type === "number" ? Number(field.value) : field.value;
    });
    return data;
  }

  function calculate(input) {
    var engine = root.AfroTools && root.AfroTools[config.global];
    if (!engine || typeof engine.calculate !== "function") return { error: "engine_missing" };
    var country = input.country;
    if (config.mode === "solarQuick") return engine.calculate(input, country);
    if (config.mode === "appliance") {
      return engine.calculate({
        country: country,
        appliances: [{ name: "Kifaa", watts: input.watts, hoursPerDay: input.hoursPerDay, qty: input.qty, standbyWatts: input.standbyWatts }]
      });
    }
    if (config.countryInInput) return engine.calculate(Object.assign({}, input, { country: country }));
    return engine.calculate(input, country);
  }

  function localizeValue(value) {
    return String(value == null ? "—" : value)
      .replace(/years?/gi, "miaka").replace(/days?/gi, "siku").replace(/hours?|hrs?/gi, "saa")
      .replace(/Not entered/gi, "Haijaingizwa").replace(/Enter billed amount to verify/gi, "Ingiza kiasi cha bili ili uhakiki")
      .replace(/BILL LOOKS CORRECT/gi, "BILI INAENDANA NA MAKADIRIO").replace(/OVERBILLED[^—-]*/gi, "BILI JUU YA MAKADIRIO")
      .replace(/UNDERBILLED[^—-]*/gi, "BILI CHINI YA MAKADIRIO").replace(/MINOR VARIANCE[^—-]*/gi, "TOFAUTI NDOGO")
      .replace(/VIABLE/gi, "INAWEZEKANA").replace(/MARGINAL/gi, "IKO MPAKANI").replace(/CHALLENGING/gi, "INA CHANGAMOTO")
      .replace(/Low Carbon/gi, "Kaboni ndogo").replace(/Moderate/gi, "Wastani").replace(/Very High/gi, "Juu sana").replace(/High/gi, "Juu")
      .replace(/Excellent/gi, "Bora sana").replace(/Good/gi, "Nzuri").replace(/Average/gi, "Wastani").replace(/Poor/gi, "Dhaifu").replace(/Very Inefficient/gi, "Ufanisi mdogo sana");
  }

  function render(result, input) {
    metricGrid.replaceChildren();
    config.metrics.forEach(function (metric) {
      var group = document.createElement("div");
      var term = document.createElement("dt");
      var detail = document.createElement("dd");
      term.textContent = metric[1];
      detail.textContent = localizeValue(result[metric[0]]);
      group.append(term, detail);
      metricGrid.appendChild(group);
    });
    document.getElementById("resultBoundary").textContent = "Hili ni makadirio ya kupanga kwa nakala ya Machi 2026. Hakiki viwango na gharama za sasa za " + (COUNTRY_NAMES[input.country] || input.country) + " kabla ya kufanya uamuzi.";
    results.hidden = false;
    lastRecord = {
      schemaVersion: 1,
      locale: "sw",
      toolId: config.id,
      title: config.title,
      calculatedAt: new Date().toISOString(),
      sourceSnapshot: "2026-03",
      confidence: "low_until_locally_verified",
      liveData: false,
      input: input,
      metrics: config.metrics.map(function (metric) { return { key: metric[0], label: metric[1], value: localizeValue(result[metric[0]]) }; }),
      boundary: "Makadirio ya kupanga tu; si data hai, bili rasmi, nukuu, usanifu au ushauri wa kitaalamu."
    };
  }

  function clearResult() {
    results.hidden = true;
    metricGrid.replaceChildren();
    lastRecord = null;
    setStatus(exportStatus, "");
  }

  function runCalculation(options) {
    options = options || {};
    if (!form.checkValidity()) {
      clearResult();
      form.reportValidity();
      setStatus(formStatus, "Kamilisha sehemu zinazohitajika kwa maadili halali.", "error");
      return false;
    }
    var input = values();
    var output;
    try { output = calculate(input); } catch (error) { output = { error: "calculation_failed" }; }
    if (!output || output.error || output.available === false) {
      clearResult();
      setStatus(formStatus, output && output.available === false
        ? "Mpango huu haupatikani kwa wingi katika nchi uliyochagua; thibitisha na wasambazaji wa eneo lako."
        : "Hesabu haikuweza kukamilika. Kagua maadili na ujaribu tena.", "error");
      return false;
    }
    render(output, input);
    setStatus(formStatus, options.reopened ? "Faili imefunguliwa tena na hesabu imerudiwa." : "Makadirio yamekamilika. Kagua mpaka wa data kabla ya kuyatumia.", "success");
    if (!options.silent) results.scrollIntoView({ behavior: root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    return true;
  }

  function reportText() {
    if (!lastRecord) return "";
    return [lastRecord.title, "Tarehe: " + lastRecord.calculatedAt, "Nakala ya data: Machi 2026", "Uhakika: mdogo hadi uhakiki wa eneo", ""].concat(
      lastRecord.metrics.map(function (metric) { return metric.label + ": " + metric.value; }),
      ["", lastRecord.boundary, "Faragha: taarifa ilichakatwa kwenye kivinjari na haikutumwa kwa seva au AI."]
    ).join("\n");
  }

  function download(name, type, content) {
    var blob = content instanceof Blob ? content : new Blob([content], { type: type });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  function exportRecord(format) {
    if (!lastRecord) { setStatus(exportStatus, "Kokotoa kwanza kabla ya kupakua.", "error"); return; }
    var base = config.id + "-sw-" + new Date().toISOString().slice(0, 10);
    if (format === "json") download(base + ".json", "application/json", JSON.stringify(lastRecord, null, 2));
    if (format === "txt") download(base + ".txt", "text/plain;charset=utf-8", reportText());
    if (format === "csv") {
      var rows = [["kipimo","thamani"]].concat(lastRecord.metrics.map(function (m) { return [m.label, m.value]; }));
      var csv = rows.map(function (row) { return row.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(","); }).join("\r\n");
      download(base + ".csv", "text/csv;charset=utf-8", "\ufeff" + csv);
    }
    if (format === "pdf") {
      var jsPDF = root.jspdf && root.jspdf.jsPDF;
      if (!jsPDF) { setStatus(exportStatus, "PDF haipatikani kwenye kivinjari hiki.", "error"); return; }
      var doc = new jsPDF({ unit: "pt", format: "a4" });
      doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.text(config.title, 48, 58);
      doc.setFont("helvetica", "normal"); doc.setFontSize(10);
      var lines = doc.splitTextToSize(reportText(), 500); doc.text(lines, 48, 82); doc.save(base + ".pdf");
    }
    setStatus(exportStatus, "Faili ya " + format.toUpperCase() + " imeundwa kwenye kifaa hiki.", "success");
  }

  function reopen(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var record;
      try { record = JSON.parse(String(reader.result || "")); } catch (error) { record = null; }
      if (!record || record.toolId !== config.id || !record.input) {
        setStatus(exportStatus, "Faili hii si rekodi halali ya zana hii.", "error"); return;
      }
      Object.keys(record.input).forEach(function (name) {
        var field = form.elements.namedItem(name);
        if (field) field.value = record.input[name];
      });
      updateSourceLink();
      runCalculation({ reopened: true, silent: true });
    };
    reader.readAsText(file);
  }

  form.addEventListener("submit", function (event) { event.preventDefault(); runCalculation(); });
  form.addEventListener("input", function () { clearResult(); setStatus(formStatus, "Maadili yamebadilika; kokotoa tena."); });
  countrySelect.addEventListener("change", updateSourceLink);
  document.querySelectorAll("[data-export]").forEach(function (button) { button.addEventListener("click", function () { exportRecord(button.dataset.export); }); });
  document.getElementById("importJson").addEventListener("change", function (event) { var file = event.target.files && event.target.files[0]; if (file) reopen(file); });
  populateCountries();
})(window);

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
  var themeButton = document.querySelector("[data-theme-toggle]");
  var lastRecord = null;
  var isSolarComparison = config.mode === "solarComparison";
  var solarFields = config.assumptionFields || [];
  var solarFuelReferenceUsed = false;

  function solarBasis() {
    var basis = {};
    solarFields.forEach(function (item) {
      var field = form.elements.namedItem(item.name);
      basis[item.name] = field.dataset.basis || "user_entered";
    });
    return basis;
  }

  function refreshSolarDefaults(reset) {
    if (!isSolarComparison) return;
    if (reset) {
      solarFuelReferenceUsed = false;
      solarFields.forEach(function (item) {
        var field = form.elements.namedItem(item.name);
        field.value = ""; field.dataset.basis = "planning_default";
      });
    }
    var selectedCountry = root.ENERGY_DATA && root.ENERGY_DATA.countries[countrySelect.value];
    document.getElementById("solarCurrency").textContent = selectedCountry ? "Bei na gharama zote: " + selectedCountry.currency + "." : "Chagua nchi ili kuweka sarafu.";
    var referenceNode = document.getElementById("solarFuelReference");
    if (referenceNode) referenceNode.hidden = !config.fuelReference || countrySelect.value !== config.fuelReference.country;
    var engine = root.AfroTools && root.AfroTools[config.global];
    if (!engine || typeof engine.planningDefaults !== "function") return;
    var current = values(), seed = { dailyHours: current.dailyHours, dailyKWh: current.dailyKWh, genKVA: current.genKVA };
    solarFields.forEach(function (item) {
      var field = form.elements.namedItem(item.name);
      if (!reset && field.dataset.basis && field.dataset.basis !== "planning_default") seed[item.name] = current[item.name];
    });
    var defaults = engine.planningDefaults(seed, countrySelect.value);
    if (defaults.error) return;
    solarFields.forEach(function (item) {
      var field = form.elements.namedItem(item.name);
      if ((reset || !field.dataset.basis || field.dataset.basis === "planning_default") && Number.isFinite(defaults[item.name])) {
        field.value = String(Number(defaults[item.name].toPrecision(12)));
        field.dataset.basis = "planning_default";
      }
    });
    var basis = solarBasis(), changed = Object.keys(basis).filter(function (name) { return basis[name] !== "planning_default"; }).length;
    document.getElementById("solarAssumptionStatus").textContent = changed
      ? changed + " kati ya " + solarFields.length + " thamani ni zako au za faili; zilizobaki ni dhana za mfano."
      : "Mfano wa kuanzia umejazwa. Bei ya mafuta ni nakala ya Machi 2026; badilisha kwa risiti au nukuu zako.";
  }

  function solarBreakdownRows(result) {
    var b = result.breakdown, a = result.assumptions;
    function money(value) { return a.currency + " " + Math.round(value).toLocaleString("en-US"); }
    return [
      ["Msingi wa jenereta", b.genCapital === 0 ? "Jenereta iliyopo; hakuna gharama mpya ya ununuzi" : "Gharama ya ununuzi na ufungaji imejumuishwa"],
      ["Mzigo wa wastani / uwezo wa mfano", Number(a.averageLoadKW.toFixed(2)) + " kW / " + Number(a.generatorKW.toFixed(2)) + " kW (0.8 × kVA)"],
      ["Msingi wa matumizi ya dizeli", solarBasis().genLitresHour === "planning_default" ? "kWh/siku ÷ saa/siku × 0.28 lita/kWh" : "Lita kwa saa ulizoweka; si makadirio ya mzigo"],
      ["Dizeli kwa mwaka", Number(b.annualLitres.toFixed(2)).toLocaleString("en-US") + " lita"],
      ["Mtaji — jenereta / solar", money(b.genCapital) + " / " + money(b.solarCapital)],
      ["Mafuta ya jenereta, miaka 5", money(b.genFuel5yr)],
      ["Matengenezo, miaka 5 — jenereta / solar", money(b.genMaintenance5yr) + " / " + money(b.solarMaintenance5yr)],
      ["Uingizwaji wa vifaa vya solar, miaka 5", money(b.solarReplacement5yr)],
      ["Akiba ya solar kwa mwaka, baada ya akiba ya uingizwaji", money(b.annualSaving)],
      ["Tofauti ya mtaji wa solar dhidi ya jenereta", money(b.extraCapital)],
      ["Paneli zinazokadiriwa", a.solarSizeKW + " kW; " + a.dailyKWh + " kWh/siku; jua " + a.sunHours + " saa/siku"]
    ];
  }

  function recordSolarComparison(result, input) {
    if (!isSolarComparison) return;
    var rows = solarBreakdownRows(result), container = document.getElementById("comparisonBreakdown");
    container.replaceChildren();
    rows.forEach(function (row) {
      var group = document.createElement("div"), term = document.createElement("dt"), detail = document.createElement("dd");
      term.textContent = row[0]; detail.textContent = row[1]; group.append(term, detail); container.appendChild(group);
    });
    var boundary = "Gharama zinatumia thamani zilizo kwenye fomu kwa miaka 5. Akiba ya uingizwaji wa vifaa imegawanywa kwa miaka 5 katika hesabu ya kurejesha mtaji.";
    document.getElementById("resultBoundary").textContent = boundary;
    lastRecord.assumptionBasis = solarBasis();
    lastRecord.resolvedAssumptions = result.assumptions;
    lastRecord.breakdown = result.breakdown;
    lastRecord.breakdownRows = rows;
    lastRecord.assumptionRows = [
      ["Nchi / sarafu", (COUNTRY_NAMES[input.country] || input.country) + " / " + result.assumptions.currency],
      ["Saa za akiba kwa siku", input.dailyHours], ["Jenereta (kVA)", input.genKVA || Number(result.assumptions.genKVA.toFixed(2)) + " (mfano wa mzigo wa wastani)"], ["Nishati kwa siku (kWh)", input.dailyKWh]
    ].concat(solarFields.map(function (item) {
      var basis = lastRecord.assumptionBasis[item.name];
      return [item.label, String(input[item.name]) + (basis === "planning_default" ? " (mfano)" : basis === "saved_assumption" ? " (faili)" : basis === "official_reference" ? " (EWURA, " + config.fuelReference.location + ", " + config.fuelReference.effectiveDate + ")" : " (umeweka)")];
    }));
    lastRecord.confidence = "scenario_from_displayed_assumptions";
    lastRecord.boundary = boundary;
    lastRecord.sourceContext = { presetSnapshot: "2026-03", fuelReference: solarFuelReferenceUsed ? config.fuelReference : null, regulatorUrl: regulatorLink.href, note: "User entries are assumptions or quotes supplied by the user, not independently verified live prices." };
    if (solarFuelReferenceUsed) lastRecord.assumptionRows.push(["Chanzo cha bei ya dizeli", "EWURA, " + config.fuelReference.location + ", " + config.fuelReference.effectiveDate]);
  }


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
    refreshSolarDefaults(true);
  }

  function updateSourceLink() {
    var source = isSolarComparison && countrySelect.value === "TZ" ? ["EWURA — bei elekezi za mafuta", "https://www.ewura.go.tz/publications/petroleum-price"] : REGULATORS[countrySelect.value];
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
    if (isSolarComparison) return typeof engine.calculateComparison === "function" ? engine.calculateComparison(input, country) : { error: "engine_missing" };
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
      setStatus(formStatus, isSolarComparison ? "Kamilisha sehemu zinazohitajika kwa thamani halali." : "Kamilisha sehemu zinazohitajika kwa maadili halali.", "error");
      return false;
    }
    var input = values();
    var output;
    try { output = calculate(input); } catch (error) { output = { error: "calculation_failed" }; }
    if (!output || output.error || output.available === false) {
      clearResult();
      if (isSolarComparison && output && output.error === "capacity") {
        setStatus(formStatus, "Mzigo wa wastani ni " + output.averageLoadKW.toFixed(2) + " kW; mfano wa jenereta uliyochagua ni " + output.generatorKW.toFixed(2) + " kW (0.8 × kVA). Rekebisha ukubwa, saa au kWh ili ulinganisho utumie mahitaji yanayolingana.", "error");
        return false;
      }
      setStatus(formStatus, output && output.available === false
        ? "Mpango huu haupatikani kwa wingi katika nchi uliyochagua; thibitisha na wasambazaji wa eneo lako."
        : "Hesabu haikuweza kukamilika. Kagua maadili na ujaribu tena.", "error");
      return false;
    }
    render(output, input);
    recordSolarComparison(output, input);
    setStatus(formStatus, options.reopened ? "Faili imefunguliwa tena na hesabu imerudiwa." : isSolarComparison ? "Ulinganisho umekamilika. Bei, matumizi na mgawanyo wa gharama vimeonyeshwa." : "Makadirio yamekamilika. Kagua mpaka wa data kabla ya kuyatumia.", "success");
    if (!options.silent) results.scrollIntoView({ behavior: root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    return true;
  }

  function reportText() {
    if (!lastRecord) return "";
    if (isSolarComparison) return [lastRecord.title, "Tarehe: " + lastRecord.calculatedAt, "Mfano wa kuanzia: Machi 2026; bei zako zimehifadhiwa", ""].concat(
      lastRecord.metrics.map(function (metric) { return metric.label + ": " + metric.value; }),
      ["", "Vigezo vilivyotumika"], lastRecord.assumptionRows.map(function (row) { return row[0] + ": " + row[1]; }),
      ["", "Mgawanyo"], lastRecord.breakdownRows.map(function (row) { return row[0] + ": " + row[1]; }),
      ["", "Bei hazibadiliki katika miaka 5; riba na thamani ya kuuza tena hazijaongezwa."]
    ).join("\n");
    return [lastRecord.title, "Tarehe: " + lastRecord.calculatedAt, "Nakala ya data: Machi 2026", "Uhakika: mdogo hadi uhakiki wa eneo", ""].concat(
      lastRecord.metrics.map(function (metric) { return metric.label + ": " + metric.value; }),
      ["", lastRecord.boundary, "Faragha: taarifa ilichakatwa kwenye kivinjari na haikutumwa kwa seva au AI."]
    ).join("\n");
  }

  function pdfSafeText(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x20-\x7E\n]/g, " ");
  }

  function simplePdfBlob(value) {
    function escapePdfText(text) { return text.replace(/([\\()])/g, "\\$1"); }
    var reportLines = pdfSafeText(value).split("\n").slice(0, 48);
    var stream = "BT\n/F1 10 Tf\n48 790 Td\n" + reportLines.map(function (line, index) {
      return (index ? "0 -14 Td\n" : "") + "(" + escapePdfText(line) + ") Tj";
    }).join("\n") + "\nET\n";
    var objects = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
      "<< /Length " + stream.length + " >>\nstream\n" + stream + "endstream",
    ];
    var body = "%PDF-1.4\n";
    var offsets = [0];
    objects.forEach(function (object, index) {
      offsets.push(body.length);
      body += (index + 1) + " 0 obj\n" + object + "\nendobj\n";
    });
    var xrefOffset = body.length;
    body += "xref\n0 " + (objects.length + 1) + "\n0000000000 65535 f \n";
    offsets.slice(1).forEach(function (offset) { body += String(offset).padStart(10, "0") + " 00000 n \n"; });
    body += "trailer\n<< /Size " + (objects.length + 1) + " /Root 1 0 R >>\nstartxref\n" + xrefOffset + "\n%%EOF\n";
    return new Blob([body], { type: "application/pdf" });
  }

  function download(name, type, content) {
    var blob = content instanceof Blob ? content : new Blob([content], { type: type });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove();
    // Revoking on the next tick can truncate larger PDF downloads in Chromium.
    setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
  }

  function exportRecord(format) {
    if (!lastRecord) { setStatus(exportStatus, "Kokotoa kwanza kabla ya kupakua.", "error"); return; }
    var base = config.id + "-sw-" + new Date().toISOString().slice(0, 10);
    if (format === "json") download(base + ".json", "application/json", JSON.stringify(lastRecord, null, 2));
    if (format === "txt") download(base + ".txt", "text/plain;charset=utf-8", reportText());
    if (format === "csv") {
      var rows = [["kipimo","thamani"]].concat(lastRecord.metrics.map(function (m) { return [m.label, m.value]; }));
      if (isSolarComparison) rows = rows.concat(lastRecord.assumptionRows, lastRecord.breakdownRows);
      var csv = rows.map(function (row) { return row.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(","); }).join("\r\n");
      download(base + ".csv", "text/csv;charset=utf-8", "\ufeff" + csv);
    }
    if (format === "pdf") {
      download(base + ".pdf", "application/pdf", simplePdfBlob(isSolarComparison ? reportText() : config.title + "\n\n" + reportText()));
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
      if (isSolarComparison) {
        var preview;
        try { preview = calculate(record.input); } catch (error) { preview = null; }
        if (!preview || preview.error || ["country", "dailyHours", "dailyKWh", "genKVA"].some(function (name) { return record.input[name] == null; })) {
          setStatus(exportStatus, "Faili ina thamani zisizofaa. Rekodi iliyopo haijabadilishwa.", "error"); return;
        }
        solarFuelReferenceUsed = Boolean(config.fuelReference && record.sourceContext && record.sourceContext.fuelReference
          && record.sourceContext.fuelReference.url === config.fuelReference.url
          && record.sourceContext.fuelReference.effectiveDate === config.fuelReference.effectiveDate
          && record.input.country === config.fuelReference.country && Number(record.input.fuelPrice) === config.fuelReference.price);
        // Old four-input records receive explicit presets; complete records retain every saved amount.
        solarFields.forEach(function (item) {
          var field = form.elements.namedItem(item.name);
          field.value = String(preview.assumptions[item.name]);
          field.dataset.basis = record.input[item.name] != null ? "saved_assumption" : "planning_default";
          if (item.name === "genLitresHour" && record.assumptionBasis && record.assumptionBasis.genLitresHour === "planning_default") field.dataset.basis = "planning_default";
        });
      }
      Object.keys(record.input).forEach(function (name) {
        var field = form.elements.namedItem(name);
        if (field) field.value = record.input[name];
      });
      updateSourceLink();
      refreshSolarDefaults(false);
      runCalculation({ reopened: true, silent: true });
    };
    reader.readAsText(file);
  }

  form.addEventListener("submit", function (event) { event.preventDefault(); runCalculation(); });
  form.addEventListener("input", function (event) {
    if (isSolarComparison) {
      if (solarFields.some(function (item) { return item.name === event.target.name; })) event.target.dataset.basis = "user_entered";
      if (event.target.name === "fuelPrice") solarFuelReferenceUsed = false;
      refreshSolarDefaults(false);
    }
    clearResult(); setStatus(formStatus, isSolarComparison ? "Thamani zimebadilika; kokotoa tena." : "Maadili yamebadilika; kokotoa tena.");
  });
  form.addEventListener("reset", function () {
    root.setTimeout(function () {
      clearResult();
      if (isSolarComparison) {
        if (!countrySelect.value) countrySelect.value = root.ENERGY_DATA.countries.TZ ? "TZ" : Object.keys(root.ENERGY_DATA.countries)[0];
        refreshSolarDefaults(true);
      }
      updateSourceLink();
      setStatus(formStatus, "Sehemu zimerejeshwa kwenye maadili ya mfano. Kokotoa upya.", "success");
    }, 0);
  });
  if (themeButton) themeButton.addEventListener("click", function () {
    var dark = document.documentElement.dataset.theme !== "dark";
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    themeButton.setAttribute("aria-pressed", String(dark));
    themeButton.textContent = dark ? "Tumia mandhari mepesi" : "Tumia mandhari meusi";
  });
  countrySelect.addEventListener("change", function () {
    updateSourceLink();
    if (isSolarComparison) {
      refreshSolarDefaults(true); clearResult();
      setStatus(formStatus, "Nchi imebadilika; bei za mfano zimewekwa upya katika sarafu yake. Ingiza nukuu zako.");
    }
  });
  if (isSolarComparison && config.fuelReference) document.getElementById("useSolarFuelReference").addEventListener("click", function () {
    if (countrySelect.value !== config.fuelReference.country) return;
    var field = form.elements.namedItem("fuelPrice");
    field.value = String(config.fuelReference.price); field.dataset.basis = "official_reference";
    solarFuelReferenceUsed = true; refreshSolarDefaults(false); clearResult();
    setStatus(formStatus, "Bei ya dizeli ya " + config.fuelReference.location + ", EWURA " + config.fuelReference.effectiveDate + ", imewekwa. Kokotoa tena.");
  });
  if (isSolarComparison) document.getElementById("solarDefaults").addEventListener("click", function () {
    refreshSolarDefaults(true); clearResult(); setStatus(formStatus, "Bei za mfano zimerejeshwa. Kokotoa tena.");
  });
  document.querySelectorAll("[data-export]").forEach(function (button) { button.addEventListener("click", function () { exportRecord(button.dataset.export); }); });
  document.getElementById("importJson").addEventListener("change", function (event) { var file = event.target.files && event.target.files[0]; if (file) reopen(file); });
  populateCountries();
})(window);

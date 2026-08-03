(function () {
  "use strict";

  var root = document.querySelector("[data-sw-trade-app]");
  if (!root) return;
  var tool = root.getAttribute("data-tool");
  var form = root.querySelector("[data-trade-form]");
  var status = root.querySelector("[data-trade-status]");
  var resultBox = root.querySelector("[data-trade-result]");
  var summary = root.querySelector("[data-trade-summary]");
  var metrics = root.querySelector("[data-trade-metrics]");
  var rows = root.querySelector("[data-trade-rows]");
  var notes = root.querySelector("[data-trade-notes]");
  var lastReport = null;

  function value(name) {
    var input = form.elements.namedItem(name);
    return input ? String(input.value || "").trim() : "";
  }
  function number(name) {
    var parsed = Number(String(value(name)).replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  function checked(name) {
    var input = form.elements.namedItem(name);
    return Boolean(input && input.checked);
  }
  function money(amount, currency) {
    try {
      return new Intl.NumberFormat("sw-TZ", { style: "currency", currency: currency || "USD", maximumFractionDigits: 2 }).format(Number(amount) || 0);
    } catch (_) {
      return (Number(amount) || 0).toFixed(2) + " " + (currency || "");
    }
  }
  function decimal(amount, suffix) {
    return new Intl.NumberFormat("sw-TZ", { maximumFractionDigits: 2 }).format(Number(amount) || 0) + (suffix || "");
  }
  function report(title, text, metricList, rowList, noteList) {
    return { title: title, generatedAt: new Date().toISOString(), summary: text, metrics: metricList || [], rows: rowList || [], notes: noteList || [] };
  }

  function commodity() {
    if (!window.CommodityEngine) throw new Error("Injini ya data ya bidhaa haikupatikana.");
    var country = value("country");
    var countryData = window.CommodityEngine.getCountrySummary(country);
    if (!countryData) throw new Error("Chagua nchi inayopatikana.");
    var query = value("commodity").toLowerCase();
    var items = window.CommodityEngine.getRankedList(country, "exports", null);
    if (query) items = items.filter(function (item) { return JSON.stringify(item).toLowerCase().indexOf(query) !== -1; });
    return report(
      "Picha ya biashara ya bidhaa",
      "Matokeo yanatoka kwenye data ya AfroTools ya 2024. Haya si bei ya moja kwa moja wala nukuu inayoweza kutekelezwa.",
      [["Nchi", countryData.name || country], ["Vipengele vilivyopatikana", String(items.length)], ["Mwaka wa data", "2024"], ["Salio la biashara", String(countryData.tradeBalance || 0) + " milioni USD"]],
      items.slice(0, 25).map(function (item) { return [item.name || item.commodity || "Bidhaa", item.type || item.direction || "—", String(item.value || item.valueUSD || "—"), item.share ? String(item.share) : "—"]; }),
      ["Thibitisha bei, daraja, kipimo, kiasi na tarehe na soko, mamlaka ya takwimu, forodha au muuzaji anayehusika."]
    );
  }

  function ecowas() {
    if (!window.EcowasLevyEngine) throw new Error("Injini ya ECOWAS haikupatikana.");
    if (number("cifValue") <= 0) throw new Error("Weka thamani ya CIF iliyo juu ya sifuri.");
    var estimate = window.EcowasLevyEngine.calculate({
      cifValue: number("cifValue"), fobValue: number("fobValue"), cetBand: value("cetBand"),
      countryCode: value("countryCode"), hsCode: value("hsCode"), isEtls: checked("isEtls")
    });
    var eligibility = window.EcowasLevyEngine.checkEtls({
      originCountry: value("originCountry"), localValuePct: number("localValuePct"),
      hasCOO: checked("hasCOO"), hasCTH: checked("hasCTH")
    });
    return report(
      "Makadirio ya CET na tozo za ECOWAS",
      "Injini ya pamoja imetenganisha ushuru wa CET, tozo na ada za nchi. Msamaha wa ETLS ni ukaguzi wa awali pekee.",
      [["Jumla ya tozo", money(estimate.totalCharges, "USD")], ["Gharama iliyofika", money(estimate.totalLandedCost, "USD")], ["Kiwango halisi", estimate.effectiveRate + "%"], ["ETLS", eligibility.eligible ? "Inaonekana kutimiza vigezo vya awali" : "Haijathibitishwa"]],
      estimate.breakdown.map(function (item) { return [item.label, money(item.amount, "USD"), decimal(item.rate, "%"), item.base]; }).concat(eligibility.requirements.map(function (item) { return ["ETLS", item]; })),
      (estimate.observations || []).concat(["Thibitisha msimbo HS, bendi, tozo za nchi, VAT na Cheti cha Asili na mamlaka husika kabla ya tamko."])
    );
  }

  function sadc() {
    if (!window.SadcRooEngine) throw new Error("Injini ya kanuni za SADC haikupatikana.");
    var exWorks = number("exWorksPrice");
    var nonSadc = number("nonSadcCost");
    if (exWorks <= 0) throw new Error("Weka bei ya kutoka kiwandani iliyo juu ya sifuri.");
    if (nonSadc > exWorks) throw new Error("Gharama ya malighafi zisizo za SADC haiwezi kuzidi bei ya kutoka kiwandani.");
    var outcome = window.SadcRooEngine.checkOrigin({
      hsChapter: number("hsChapter"), exportCountry: value("exportCountry"), importCountry: value("importCountry"),
      exWorksPrice: exWorks, nonSadcCost: nonSadc, whollyObtained: checked("whollyObtained"),
      hasCTH: checked("hasCTH"), hasFabricFwd: checked("hasFabricFwd")
    });
    var conclusion = outcome.eligible ? "Ukaguzi wa awali ni chanya" : "Vigezo havijathibitishwa";
    return report(
      "Ukaguzi wa awali wa asili ya SADC",
      conclusion + ". Huu si uamuzi wa mamlaka wala Cheti cha Asili.",
      [["Thamani ya SADC", decimal(outcome.sadcVA, "%")], ["Sehemu isiyo ya SADC", decimal(outcome.nonSadcPct, "%")], ["Kanuni", outcome.rule ? outcome.rule.ruleLabel : "Haijapatikana"], ["Hitimisho", conclusion]],
      (outcome.checks || []).map(function (item) { return [item.label, item.pass ? "Imetimia" : "Haijatimia", item.detail]; }),
      (outcome.observations || []).concat(["Kagua kiambatisho cha bidhaa, msimbo HS, mchakato na ushahidi na mamlaka ya kutoa cheti."])
    );
  }

  function eac() {
    if (!window.EacCetEngine) throw new Error("Injini ya CET ya EAC haikupatikana.");
    if (number("cifValue") <= 0) throw new Error("Weka thamani ya CIF iliyo juu ya sifuri.");
    var matches = window.EacCetEngine.search(value("query"));
    if (!matches.length) throw new Error("Hakuna bidhaa iliyopatikana. Jaribu jina au msimbo HS mwingine.");
    var selected = matches[0];
    var rate = number("cetRate");
    var estimate = window.EacCetEngine.calculate({ cifValue: number("cifValue"), cetRate: rate, countryCode: value("countryCode") });
    var comparison = window.EacCetEngine.compareCountries(number("cifValue"), rate);
    return report(
      "Makadirio ya CET ya EAC",
      "Bidhaa ya kwanza iliyolingana ni mwongozo wa kuanzia. Kiwango ulichoweka ndicho kimetumika kwenye hesabu.",
      [["Bidhaa ya kuanzia", selected.name], ["Msimbo wa mfano", selected.hsRange], ["CET iliyowekwa", decimal(rate, "%")], ["Jumla iliyofika", money(estimate.totalLanded, "USD")], ["Kiwango halisi", decimal(estimate.effectiveRate, "%")]],
      estimate.breakdown.map(function (item) { return [item.name, money(item.amount, "USD"), item.note || ""]; }).concat(comparison.map(function (item) { return [item.name, money(item.totalLanded, "USD"), decimal(item.effectiveRate, "%")]; })),
      ["Thibitisha mstari wa ushuru, msamaha, ada za nchi, VAT na masharti ya bidhaa na mamlaka ya mapato ya nchi husika."]
    );
  }

  var handlers = { "commodity-tracker": commodity, "ecowas-levy": ecowas, "sadc-roo": sadc, "eac-cet": eac };

  function render(data) {
    lastReport = data;
    summary.textContent = data.summary;
    metrics.replaceChildren();
    data.metrics.forEach(function (item) {
      var card = document.createElement("div"); card.className = "sw-trade-metric";
      var label = document.createElement("span"); label.textContent = item[0];
      var output = document.createElement("strong"); output.textContent = item[1];
      card.append(label, output); metrics.appendChild(card);
    });
    rows.replaceChildren();
    if (data.rows.length) {
      var wrap = document.createElement("div"); wrap.className = "sw-trade-table-wrap";
      var table = document.createElement("table"); table.className = "sw-trade-table";
      var body = document.createElement("tbody");
      data.rows.forEach(function (row) { var tr = document.createElement("tr"); row.forEach(function (cell) { var td = document.createElement("td"); td.textContent = cell; tr.appendChild(td); }); body.appendChild(tr); });
      table.appendChild(body); wrap.appendChild(table); rows.appendChild(wrap);
    }
    notes.replaceChildren();
    data.notes.forEach(function (note) { var li = document.createElement("li"); li.textContent = note; notes.appendChild(li); });
    resultBox.hidden = false; status.dataset.state = "success"; status.textContent = "Matokeo yamekokotolewa ndani ya kivinjari; hakuna sehemu iliyotumwa."; resultBox.focus();
  }

  function payload() {
    var inputs = {};
    Array.prototype.forEach.call(form.elements, function (field) { if (field.name) inputs[field.name] = field.type === "checkbox" ? field.checked : field.value; });
    return { tool: tool, locale: "sw", inputs: inputs, report: lastReport };
  }
  function textReport() {
    var lines = [lastReport.title, lastReport.summary, ""];
    lastReport.metrics.forEach(function (item) { lines.push(item[0] + ": " + item[1]); });
    lastReport.rows.forEach(function (row) { lines.push(row.join(" | ")); });
    lines.push("", "Mipaka na ukaguzi"); lastReport.notes.forEach(function (note) { lines.push("- " + note); });
    lines.push("", "Imetengenezwa ndani ya AfroTools; taarifa ulizoingiza hazikutumwa.");
    return lines.join("\n");
  }
  function save(blob, extension) {
    var link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "afrotools-" + tool + "-" + new Date().toISOString().slice(0, 10) + "." + extension;
    document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(function () { URL.revokeObjectURL(link.href); }, 500);
    status.textContent = "Export ya " + extension.toUpperCase() + " imetengenezwa ndani ya kivinjari.";
  }
  function exportFile(format) {
    if (!lastReport) { status.dataset.state = "error"; status.textContent = "Kokotoa matokeo kwanza."; return; }
    if (format === "json") return save(new Blob([JSON.stringify(payload(), null, 2)], { type: "application/json;charset=utf-8" }), "json");
    if (format === "txt") return save(new Blob([textReport()], { type: "text/plain;charset=utf-8" }), "txt");
    if (format === "csv") {
      var csvRows = [["Sehemu", "Lebo", "Thamani"]];
      lastReport.metrics.forEach(function (item) { csvRows.push(["Kipimo", item[0], item[1]]); });
      lastReport.rows.forEach(function (row) { csvRows.push(["Maelezo"].concat(row)); });
      var csv = csvRows.map(function (row) { return row.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(","); }).join("\r\n");
      return save(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }), "csv");
    }
    var JsPdf = window.jspdf && window.jspdf.jsPDF;
    if (!JsPdf) { status.dataset.state = "error"; status.textContent = "Moduli ya PDF ya ndani haikupatikana."; return; }
    var pdf = new JsPdf({ unit: "mm", format: "a4" }); pdf.setFontSize(15); pdf.text(lastReport.title, 15, 18); pdf.setFontSize(9);
    var y = 27; pdf.splitTextToSize(textReport(), 180).forEach(function (line) { if (y > 282) { pdf.addPage(); y = 15; } pdf.text(line, 15, y); y += 5; });
    pdf.save("afrotools-" + tool + "-" + new Date().toISOString().slice(0, 10) + ".pdf"); status.textContent = "PDF imetengenezwa ndani ya kivinjari.";
  }
  function reopen(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.addEventListener("load", function () {
      try {
        var data = JSON.parse(String(reader.result || ""));
        if (!data || data.tool !== tool || data.locale !== "sw" || !data.inputs || !data.report) throw new Error("Hii si export ya JSON ya programu hii.");
        Array.prototype.forEach.call(form.elements, function (field) { if (!field.name || !Object.prototype.hasOwnProperty.call(data.inputs, field.name)) return; if (field.type === "checkbox") field.checked = Boolean(data.inputs[field.name]); else field.value = String(data.inputs[field.name]); });
        render(data.report); status.textContent = "Export ya JSON imefunguliwa ndani ya kivinjari. Kagua tena sehemu na matokeo.";
      } catch (error) { lastReport = null; resultBox.hidden = true; status.dataset.state = "error"; status.textContent = error.message || "Faili ya JSON haikuweza kufunguliwa."; status.focus(); }
    });
    reader.addEventListener("error", function () { status.dataset.state = "error"; status.textContent = "Faili ya ndani haikuweza kusomwa."; });
    reader.readAsText(file);
  }
  function fill(name, items, key, label) {
    var select = form.elements.namedItem(name); if (!select || select.options.length > 1) return;
    items.forEach(function (item) { var option = document.createElement("option"); option.value = item[key]; option.textContent = label(item); select.appendChild(option); });
  }
  function initialize() {
    if (tool === "commodity-tracker" && window.CommodityEngine) fill("country", window.CommodityEngine.getAllCountries(), "code", function (item) { return item.name; });
    if (tool === "ecowas-levy" && window.EcowasLevyEngine) {
      fill("countryCode", window.EcowasLevyEngine.getSupportedCountries(), "code", function (item) { return item.name; });
      fill("originCountry", window.EcowasLevyEngine.getMemberStates(), "code", function (item) { return item.name; });
    }
    if (tool === "sadc-roo" && window.SadcRooEngine) {
      var members = window.SadcRooEngine.getMemberStates(); fill("exportCountry", members, "code", function (item) { return item.name; }); fill("importCountry", members, "code", function (item) { return item.name; });
      if (form.elements.namedItem("importCountry").options.length > 1) form.elements.namedItem("importCountry").selectedIndex = 1;
    }
    if (tool === "eac-cet" && window.EacCetEngine) fill("countryCode", window.EacCetEngine.getMemberStates(), "code", function (item) { return item.name; });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault(); status.dataset.state = "";
    try { render(handlers[tool]()); }
    catch (error) { lastReport = null; resultBox.hidden = true; summary.textContent = ""; metrics.replaceChildren(); rows.replaceChildren(); notes.replaceChildren(); status.dataset.state = "error"; status.textContent = error.message || "Kagua sehemu kisha ujaribu tena."; status.focus(); }
  });
  form.addEventListener("reset", function () { window.setTimeout(function () { lastReport = null; resultBox.hidden = true; status.dataset.state = ""; status.textContent = "Fomu imewekwa upya."; }, 0); });
  root.addEventListener("click", function (event) { var button = event.target.closest("[data-export]"); if (button) exportFile(button.getAttribute("data-export")); });
  root.addEventListener("change", function (event) { if (event.target.matches("[data-import-json]")) { reopen(event.target.files && event.target.files[0]); event.target.value = ""; } });
  initialize();
}());

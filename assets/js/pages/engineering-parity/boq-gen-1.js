(function () {
  "use strict";
  var engine = window.BoqGenEngine;
  if (!engine) return;
  function el(id) {
    return document.getElementById(id);
  }
  function input() {
    return {
      country: el("country").value,
      area: Number(el("floorArea").value),
      floors: Number(el("floors").value),
      wallHeight: Number(el("wallHeight").value),
      wallType: el("wallType").value,
      roofType: el("roofType").value,
      finishing: el("finishing").value,
      contingency: Number(el("contingency").value),
      doors: Number(el("numDoors").value),
      windows: Number(el("numWindows").value),
      glazedDoors: Number(el("numGlazed").value),
      wc: Number(el("numWC").value),
      showers: Number(el("numShowers").value),
      sinks: Number(el("numSinks").value),
      beds: Number(el("numBeds").value),
      sockets: Number(el("numSockets").value),
      inverter: Number(el("inverterYN").value),
    };
  }
  function fmt(n) {
    return Math.round(n).toLocaleString("en");
  }
  function escape(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c];
    });
  }
  function showError(message) {
    el("placeholderCard").style.display = "none";
    el("resultsCard").style.display = "block";
    el("priceNote").setAttribute("role", "alert");
    el("priceNote").textContent = message;
    el("boqTableWrap").innerHTML = "";
    window._boqExportData = null;
  }
  function generate() {
    var output = engine.calculate(input());
    if (output.error) {
      showError(
        "Enter valid positive dimensions, quantities and assumptions before generating the BOQ.",
      );
      return null;
    }
    var code = output.country.currency,
      html =
        '<table class="boq-table"><thead><tr><th>#</th><th>Description</th><th class="right">Qty</th><th>Unit</th><th class="right">Rate (' +
        code +
        ')</th><th class="right">Amount (' +
        code +
        ")</th><th>Notes</th></tr></thead><tbody>",
      row = 1;
    output.sections.forEach(function (section) {
      html +=
        '<tr class="section-row"><td colspan="7">' +
        escape(section.name) +
        "</td></tr>";
      section.items.forEach(function (item) {
        html +=
          "<tr><td>" +
          row++ +
          "</td><td>" +
          escape(item.description) +
          '</td><td class="right">' +
          fmt(item.qty) +
          "</td><td>" +
          escape(item.unit) +
          '</td><td class="right">' +
          (item.rate ? fmt(item.rate) : "—") +
          '</td><td class="right">' +
          (item.amount ? fmt(item.amount) : "Labour") +
          "</td><td>" +
          escape(item.note) +
          "</td></tr>";
      });
    });
    html +=
      '<tr class="total-row"><td colspan="5">MATERIAL SUBTOTAL</td><td class="right">' +
      code +
      " " +
      fmt(output.materialTotal) +
      '</td><td></td></tr><tr><td colspan="5">Labour (' +
      Math.round(output.country.labourRate * 100) +
      '% illustrative ratio)</td><td class="right">' +
      code +
      " " +
      fmt(output.labourCost) +
      '</td><td></td></tr><tr class="total-row"><td colspan="5">PLANNING TOTAL (labour + contingency)</td><td class="right">' +
      code +
      " " +
      fmt(output.grandTotal) +
      "</td><td></td></tr></tbody></table>";
    el("priceNote").removeAttribute("role");
    el("priceNote").textContent =
      "Embedded Q1 2025 rates are stale, unverified and low-confidence. Replace them with current supplier quotes and a quantity surveyor's measured scope.";
    el("sumTotal").textContent = code + " " + fmt(output.materialTotal);
    el("sumLabour").textContent = code + " " + fmt(output.labourCost);
    el("sumGrand").textContent = code + " " + fmt(output.grandTotal);
    el("contPct").textContent = output.input.contingency;
    el("contAmt").textContent = code + " " + fmt(output.contingencyAmount);
    el("boqTableWrap").innerHTML = html;
    el("placeholderCard").style.display = "none";
    el("resultsCard").style.display = "block";
    window._boqExportData = output;
    return output;
  }
  function csvCell(value) {
    return (
      '"' + String(value === undefined ? "" : value).replace(/"/g, '""') + '"'
    );
  }
  function exportCSV() {
    var output = window._boqExportData || generate();
    if (!output) return;
    var rows = [
      [
        "item",
        "description",
        "qty",
        "unit",
        "rate",
        "amount",
        "notes",
        "currency",
      ],
    ];
    output.allItems.forEach(function (item, index) {
      rows.push([
        index + 1,
        item.description,
        item.qty,
        item.unit,
        item.rate,
        item.amount,
        item.note,
        output.country.currency,
      ]);
    });
    rows.push(
      [],
      ["metric", "value"],
      ["materials_total", output.materialTotal],
      ["labour", output.labourCost],
      ["subtotal", output.subtotal],
      ["contingency", output.contingencyAmount],
      ["planning_total", output.grandTotal],
      ["snapshot", output.snapshot],
      ["confidence", output.confidence],
    );
    var content = rows
        .map(function (row) {
          return row.map(csvCell).join(",");
        })
        .join("\n"),
      url = URL.createObjectURL(
        new Blob([content], { type: "text/csv;charset=utf-8" }),
      ),
      a = document.createElement("a");
    a.href = url;
    a.download = "boq-" + output.country.code.toLowerCase() + ".csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  window.generate = generate;
  window.exportCSV = exportCSV;
  window.updateCurrency = function () {};
  window.toggleSection = function (id, button) {
    el(id).classList.toggle("open");
    button.classList.toggle("active");
  };
  el("buildType").addEventListener("change", function () {
    var p = engine.BUILD_PRESETS[this.value] || engine.BUILD_PRESETS.res3;
    if (p.area > 0) el("floorArea").value = p.area;
    el("numDoors").value = p.doors;
    el("numWindows").value = p.windows;
    el("numWC").value = p.wc;
    el("numShowers").value = p.showers;
    el("numSinks").value = p.sinks;
    el("numBeds").value = p.beds;
    window._boqExportData = null;
  });
})();

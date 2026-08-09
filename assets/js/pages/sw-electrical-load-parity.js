(function () {
  "use strict";
  var engine = window.AfroToolsElectricalLoadEngine;
  var form = document.getElementById("swelForm");
  var rows = document.getElementById("swelRows");
  var resultPanel = document.getElementById("swelResult");
  var empty = document.getElementById("swelEmpty");
  var error = document.getElementById("swelError");
  var status = document.getElementById("swelStatus");
  var latest = null;
  if (!engine || !form || !rows) return;

  function addRow(value) {
    value = value || {};
    var row = document.createElement("div");
    row.className = "swel-row";
    row.innerHTML =
      '<label>Jina la kifaa<input name="name" value="' +
      String(value.name || "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;") +
      '"></label><label>Wati<input name="watts" type="number" min="1" value="' +
      (value.watts || "") +
      '"></label><label>Idadi<input name="quantity" type="number" min="1" max="50" value="' +
      (value.quantity || 1) +
      '"></label><label>Saa kwa siku<input name="hours" type="number" min="0" max="24" step="0.5" value="' +
      (value.hoursPerDay == null ? 8 : value.hoursPerDay) +
      '"></label><button type="button" class="swel-secondary" aria-label="Ondoa kifaa">×</button>';
    row.querySelector("button").addEventListener("click", function () {
      row.remove();
      clearResult();
    });
    rows.appendChild(row);
  }
  function defaults() {
    rows.innerHTML = "";
    addRow({ name: "Balbu ya LED", watts: 10, quantity: 8, hoursPerDay: 6 });
    addRow({ name: "Feni ya dari", watts: 60, quantity: 4, hoursPerDay: 10 });
    addRow({ name: "Friji", watts: 150, quantity: 1, hoursPerDay: 24 });
  }
  function clearResult() {
    latest = null;
    resultPanel.hidden = true;
    empty.hidden = false;
    status.textContent = "";
  }
  function collect() {
    return {
      countryCode: document.getElementById("swelCountry").value,
      phases: document.getElementById("swelPhases").value,
      diversity: document.getElementById("swelDiversity").value,
      appliances: Array.from(rows.querySelectorAll(".swel-row")).map(
        function (row) {
          return {
            name: row.querySelector('[name="name"]').value,
            watts: row.querySelector('[name="watts"]').value,
            quantity: row.querySelector('[name="quantity"]').value,
            hoursPerDay: row.querySelector('[name="hours"]').value,
          };
        },
      ),
    };
  }
  function advice(result) {
    if (result.recommendation === "three-phase-review")
      return "Mzigo umepita skrini ya kW 13 ya awamu moja. Mtoa huduma na fundi umeme mwenye leseni wahakiki awamu na uwezo unaopatikana.";
    if (result.recommendation === "single-phase-limit")
      return "Mzigo uko juu ya kW 8 kwenye skrini ya awamu moja. Thibitisha uwezo wa usambazaji na fundi umeme.";
    return "Matokeo yako ndani ya skrini uliyochagua, lakini si uthibitisho wa kebo, kikata umeme, udongo au usalama.";
  }
  function render(result) {
    latest = result;
    document.getElementById("swelMetrics").innerHTML = [
      ["Mzigo uliounganishwa", result.totalKw.toFixed(2) + " kW"],
      ["Mzigo wa mahitaji", result.demandKw.toFixed(2) + " kW"],
      ["Mkondo uliokokotolewa", result.amps.toFixed(2) + " A"],
      ["Kidokezo cha kikata umeme", result.breakerAmps + " A"],
      ["Kidokezo cha kebo", result.cablePrompt],
      ["Kidokezo cha jenereta", result.generatorKva + " kVA"],
    ]
      .map(function (item) {
        return "<div><dt>" + item[0] + "</dt><dd>" + item[1] + "</dd></div>";
      })
      .join("");
    document.getElementById("swelCost").textContent =
      "Makisio ya mwezi: " +
      result.monthlyKwh.toFixed(2) +
      " kWh × bei ya zamani " +
      result.profile.symbol +
      result.profile.tariff +
      "/kWh = " +
      result.profile.symbol +
      result.monthlyCost.toLocaleString() +
      ". Hakiki bei ya sasa kwenye bili.";
    document.getElementById("swelAdvice").textContent = advice(result);
    var limits = [];
    if (result.breakerRangeExceeded)
      limits.push(
        "Mahitaji yamepita mwisho wa jedwali la kikata umeme la 160 A.",
      );
    if (result.generatorRangeExceeded)
      limits.push(
        "Mahitaji yamepita mwisho wa jedwali la jenereta la 100 kVA.",
      );
    document.getElementById("swelLimits").textContent = limits.join(" ");
    error.hidden = true;
    resultPanel.hidden = false;
    empty.hidden = true;
    status.textContent = "Makisio yamekamilika katika kivinjari hiki.";
  }
  function calculate() {
    try {
      render(engine.calculate(collect()));
    } catch (reason) {
      clearResult();
      error.textContent = "Kagua jina, wati, idadi na saa za kila kifaa.";
      error.hidden = false;
      error.focus();
    }
  }
  function packageData() {
    return {
      format: "afrotools-electrical-load",
      locale: "sw",
      savedAt: new Date().toISOString(),
      input: collect(),
      result: latest,
    };
  }
  function textReport() {
    return [
      "AfroTools · makisio ya mzigo wa umeme",
      "Wasifu: " + latest.profile.name + " · " + latest.profile.voltage + "V",
      "Mzigo uliounganishwa: " + latest.totalKw.toFixed(2) + " kW",
      "Mzigo wa mahitaji: " + latest.demandKw.toFixed(2) + " kW",
      "Mkondo: " + latest.amps.toFixed(2) + " A",
      "Vidokezo: " +
        latest.breakerAmps +
        "A; " +
        latest.cablePrompt +
        "; " +
        latest.generatorKva +
        " kVA",
      "Matumizi ya mwezi: " + latest.monthlyKwh.toFixed(2) + " kWh",
      "Tahadhari: makisio tuli yasiyo na tarehe, uhakika mdogo; fundi umeme mwenye leseni lazima ahakiki.",
    ].join("\n");
  }
  function download(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  function csv() {
    var output = [
      [
        "kifaa",
        "wati",
        "idadi",
        "saa_kwa_siku",
        "wati_zilizounganishwa",
        "kwh_kwa_mwezi",
      ],
    ];
    latest.appliances.forEach(function (item) {
      output.push([
        item.name,
        item.watts,
        item.quantity,
        item.hoursPerDay,
        item.connectedWatts,
        item.monthlyKwh.toFixed(2),
      ]);
    });
    output.push(
      [],
      ["kipimo", "thamani"],
      ["mzigo_kw", latest.totalKw.toFixed(2)],
      ["mahitaji_kw", latest.demandKw.toFixed(2)],
      ["mkondo_a", latest.amps.toFixed(2)],
      ["kikata_a", latest.breakerAmps],
      ["kebo", latest.cablePrompt],
      ["jenereta_kva", latest.generatorKva],
      ["uhakika", "mdogo; data tuli isiyo na tarehe"],
    );
    return output
      .map(function (row) {
        return row
          .map(function (cell) {
            return (
              '"' + String(cell == null ? "" : cell).replace(/"/g, '""') + '"'
            );
          })
          .join(",");
      })
      .join("\n");
  }
  function exportFile(format) {
    if (!latest) return;
    if (format === "json")
      download(
        new Blob([JSON.stringify(packageData(), null, 2)], {
          type: "application/json",
        }),
        "mzigo-wa-umeme.json",
      );
    if (format === "csv")
      download(
        new Blob([csv()], { type: "text/csv;charset=utf-8" }),
        "mzigo-wa-umeme.csv",
      );
    if (format === "txt")
      download(
        new Blob([textReport()], { type: "text/plain;charset=utf-8" }),
        "mzigo-wa-umeme.txt",
      );
    if (format === "pdf") {
      var PDF = window.jspdf && window.jspdf.jsPDF;
      if (!PDF) return;
      var doc = new PDF();
      var lines = doc.splitTextToSize(textReport(), 175);
      doc.text(lines, 18, 20);
      doc.save("mzigo-wa-umeme.pdf");
    }
    status.textContent = "Faili limeundwa katika kivinjari hiki.";
  }
  function reopen(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        if (!data || data.format !== "afrotools-electrical-load" || !data.input)
          throw new Error("format");
        document.getElementById("swelCountry").value = data.input.countryCode;
        document.getElementById("swelPhases").value = String(data.input.phases);
        document.getElementById("swelDiversity").value = String(
          data.input.diversity,
        );
        rows.innerHTML = "";
        data.input.appliances.forEach(addRow);
        calculate();
        status.textContent = "JSON imefunguliwa na kukokotolewa tena.";
      } catch (reason) {
        error.textContent = "JSON hii si nakala halali ya kikokotoo hiki.";
        error.hidden = false;
        error.focus();
      }
    };
    reader.readAsText(file);
  }
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    calculate();
  });
  form.addEventListener("reset", function () {
    setTimeout(function () {
      defaults();
      clearResult();
      error.hidden = true;
    }, 0);
  });
  document.getElementById("swelAdd").addEventListener("click", function () {
    addRow();
  });
  document.querySelectorAll("[data-swel-export]").forEach(function (button) {
    button.addEventListener("click", function () {
      exportFile(button.dataset.swelExport);
    });
  });
  var fileInput = document.getElementById("swelImport");
  document
    .querySelector("[data-swel-import]")
    .addEventListener("click", function () {
      fileInput.click();
    });
  fileInput.addEventListener("change", function () {
    if (fileInput.files[0]) reopen(fileInput.files[0]);
    fileInput.value = "";
  });
  defaults();
})();

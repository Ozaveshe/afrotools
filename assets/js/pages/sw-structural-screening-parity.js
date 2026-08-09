(function () {
  "use strict";
  window.AfroLocalOnly = true;
  var form = document.getElementById("swssForm");
  var mode = document.getElementById("swssMode");
  var latest = null;

  function value(id) {
    return document.getElementById(id).value;
  }
  function inputs() {
    if (mode.value === "beam")
      return {
        span: value("beamSpan"),
        udl: value("beamLoad"),
        fcu: value("beamFcu"),
        fy: value("beamFy"),
        width: value("beamWidth"),
        cover: value("beamCover"),
      };
    if (mode.value === "column")
      return {
        load: value("columnLoad"),
        fcu: value("columnFcu"),
        fy: value("columnFy"),
        shape: value("columnShape"),
        steelPct: value("columnSteel"),
      };
    if (mode.value === "slab")
      return {
        span: value("slabSpan"),
        liveLoad: value("slabLive"),
        fcu: value("slabFcu"),
        finishLoad: value("slabFinish"),
      };
    return {
      load: value("footingLoad"),
      sbc: value("footingSbc"),
      fcu: value("footingFcu"),
      columnSize: value("footingColumn"),
    };
  }
  function calculate() {
    var input = inputs();
    var output =
      mode.value === "beam"
        ? StructuralScreeningEngine.calculateBeam(input)
        : mode.value === "column"
          ? StructuralScreeningEngine.calculateColumn(input)
          : mode.value === "slab"
            ? StructuralScreeningEngine.calculateSlab(input)
            : StructuralScreeningEngine.calculateFooting(input);
    var concrete = output.concreteM3 || output.concreteM3PerM2;
    var rebar = output.rebarKg || output.rebarKgPerM2;
    return {
      schemaVersion: 1,
      mode: mode.value,
      input: input,
      output: output,
      cost: StructuralScreeningEngine.materialCost(
        concrete,
        rebar,
        value("swssCurrency"),
      ),
      dataStatus: "legacy_undated_stale",
      confidence: "low",
      boundary:
        "Uchunguzi wa awali tu; si usanifu, idhini au ukaguzi wa kanuni.",
    };
  }
  function rows(record) {
    var o = record.output;
    if (record.mode === "beam")
      return [
        ["Ukubwa wa boriti", o.width + " × " + o.height + " mm"],
        ["Moment ya mwisho", o.M.toFixed(1) + " kNm"],
        ["Shear ya juu", o.V.toFixed(1) + " kN"],
        ["Chuma kinachokadiriwa", o.As.toFixed(0) + " mm²"],
        ["Kidokezo cha nondo", o.barChoice],
      ];
    if (record.mode === "column")
      return [
        ["Ukubwa wa nguzo", o.dimLabel],
        ["Eneo linalohitajika", o.Ag.toFixed(0) + " mm²"],
        ["Eneo la chuma", o.Asc.toFixed(0) + " mm²"],
        ["Kidokezo cha nondo", o.barChoice],
        ["Uwezo wa mhimili wa zamani", o.capacity.toFixed(0) + " kN"],
      ];
    if (record.mode === "slab")
      return [
        ["Unene wa sakafu", o.height + " mm"],
        ["Mzigo wa mwisho", o.ultimateLoad.toFixed(1) + " kN/m²"],
        ["Moment", o.M.toFixed(1) + " kNm/m"],
        ["Chuma kinachokadiriwa", o.AsDesign.toFixed(0) + " mm²/m"],
        ["Kidokezo cha nondo", o.barChoice],
      ];
    return [
      ["Ukubwa wa msingi", o.side + " × " + o.side + " mm"],
      ["Kina kinachokadiriwa", o.height + " mm"],
      ["Shinikizo la huduma", o.servicePressure.toFixed(0) + " kN/m²"],
      ["Eneo linalohitajika", o.areaReq.toFixed(2) + " m²"],
      ["Kidokezo cha nondo", o.barChoice],
    ];
  }
  function render(record) {
    document.getElementById("swssError").hidden = true;
    document.getElementById("swssEmpty").hidden = true;
    document.getElementById("swssResult").hidden = false;
    document.getElementById("swssMetrics").innerHTML = rows(record)
      .map(function (row) {
        return (
          '<div class="swss-metric"><span>' +
          row[0] +
          "</span><strong>" +
          row[1] +
          "</strong></div>"
        );
      })
      .join("");
    document.getElementById("swssCost").textContent =
      "Makadirio ya zamani ya vifaa: " +
      record.cost.symbol +
      Math.round(record.cost.total).toLocaleString("en-US") +
      " (yamepitwa na wakati; uhakika mdogo).";
    document.getElementById("swssNote").textContent = record.boundary;
  }
  function fail(error) {
    latest = null;
    document.getElementById("swssResult").hidden = true;
    document.getElementById("swssEmpty").hidden = false;
    var node = document.getElementById("swssError");
    node.textContent = "Sahihisha taarifa: " + error.message;
    node.hidden = false;
    node.focus();
  }
  function refreshMode() {
    document.querySelectorAll("[data-swss-mode]").forEach(function (fieldset) {
      fieldset.hidden = fieldset.dataset.swssMode !== mode.value;
    });
    latest = null;
    document.getElementById("swssResult").hidden = true;
    document.getElementById("swssEmpty").hidden = false;
    document.getElementById("swssError").hidden = true;
  }
  function textReport() {
    return [
      "AFROTOOLS — UCHUNGUZI WA AWALI WA MIUNDO",
      "Kipengele: " + latest.mode,
      "Hali ya data: imepitwa na wakati; uhakika mdogo",
      "",
    ]
      .concat(
        rows(latest).map(function (row) {
          return row[0] + ": " + row[1];
        }),
        [
          "",
          "Makadirio ya zamani ya vifaa: " +
            latest.cost.symbol +
            Math.round(latest.cost.total).toLocaleString("en-US"),
          "",
          "Mpaka: " + latest.boundary,
          "Mhandisi wa miundo aliyesajiliwa lazima achague kanuni za sasa na kukamilisha usanifu.",
        ],
      )
      .join("\n");
  }
  function download(blob, name) {
    var link = document.createElement("a");
    var url = URL.createObjectURL(blob);
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 0);
  }
  function csvCell(value) {
    return '"' + String(value).replace(/"/g, '""') + '"';
  }
  function exportFile(kind) {
    if (!latest) return;
    if (kind === "json")
      download(
        new Blob([JSON.stringify(latest, null, 2)], {
          type: "application/json",
        }),
        "afrotools-uchunguzi-miundo.json",
      );
    if (kind === "csv") {
      var csv = [["Kipimo", "Thamani"].map(csvCell).join(",")]
        .concat(
          rows(latest).map(function (row) {
            return row.map(csvCell).join(",");
          }),
        )
        .join("\n");
      download(
        new Blob([csv], { type: "text/csv;charset=utf-8" }),
        "afrotools-uchunguzi-miundo.csv",
      );
    }
    if (kind === "txt")
      download(
        new Blob([textReport()], { type: "text/plain;charset=utf-8" }),
        "afrotools-uchunguzi-miundo.txt",
      );
    if (kind === "pdf") {
      if (!window.jspdf || !window.jspdf.jsPDF)
        return status("Maktaba ya PDF haipatikani. Tumia TXT.");
      var doc = new window.jspdf.jsPDF({
        unit: "pt",
        format: "a4",
        compress: false,
      });
      var y = 48;
      doc.splitTextToSize(textReport(), 500).forEach(function (line) {
        if (y > 790) {
          doc.addPage();
          y = 48;
        }
        doc.text(line, 44, y);
        y += 15;
      });
      doc.save("afrotools-uchunguzi-miundo.pdf");
    }
    status(kind.toUpperCase() + " imepakuliwa ndani ya kifaa.");
  }
  function status(message) {
    document.getElementById("swssStatus").textContent = message;
  }
  function restore(record) {
    if (
      !record ||
      record.schemaVersion !== 1 ||
      !["beam", "column", "slab", "footing"].includes(record.mode) ||
      !record.input
    )
      throw new Error("Muundo wa JSON hautambuliki.");
    mode.value = record.mode;
    refreshMode();
    var maps = {
      beam: {
        span: "beamSpan",
        udl: "beamLoad",
        fcu: "beamFcu",
        fy: "beamFy",
        width: "beamWidth",
        cover: "beamCover",
      },
      column: {
        load: "columnLoad",
        fcu: "columnFcu",
        fy: "columnFy",
        shape: "columnShape",
        steelPct: "columnSteel",
      },
      slab: {
        span: "slabSpan",
        liveLoad: "slabLive",
        fcu: "slabFcu",
        finishLoad: "slabFinish",
      },
      footing: {
        load: "footingLoad",
        sbc: "footingSbc",
        fcu: "footingFcu",
        columnSize: "footingColumn",
      },
    };
    Object.keys(maps[record.mode]).forEach(function (key) {
      if (record.input[key] != null)
        document.getElementById(maps[record.mode][key]).value =
          record.input[key];
    });
    latest = calculate();
    render(latest);
    status("JSON imefunguliwa na kukokotolewa tena ndani ya kifaa.");
  }
  mode.addEventListener("change", refreshMode);
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    try {
      latest = calculate();
      render(latest);
      status("Uchunguzi umekamilika ndani ya kifaa.");
    } catch (error) {
      fail(error);
    }
  });
  form.addEventListener("reset", function () {
    setTimeout(function () {
      mode.value = "beam";
      refreshMode();
      status("Fomu imerejeshwa.");
    }, 0);
  });
  document.querySelectorAll("[data-swss-export]").forEach(function (button) {
    button.addEventListener("click", function () {
      exportFile(button.dataset.swssExport);
    });
  });
  document
    .querySelector("[data-swss-import]")
    .addEventListener("click", function () {
      document.getElementById("swssImport").click();
    });
  document
    .getElementById("swssImport")
    .addEventListener("change", function (event) {
      var file = event.target.files && event.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          restore(JSON.parse(reader.result));
        } catch (error) {
          fail(error);
        }
      };
      reader.readAsText(file);
      event.target.value = "";
    });
  refreshMode();
  window.StructuralScreeningApp = {
    calculate: calculate,
    rows: rows,
    textReport: textReport,
    restore: restore,
  };
})();

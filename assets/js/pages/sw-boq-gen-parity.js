(function () {
  "use strict";
  var engine = window.BoqGenEngine,
    form = document.getElementById("swqForm"),
    result = document.getElementById("swqResult"),
    empty = document.getElementById("swqEmpty"),
    error = document.getElementById("swqError"),
    status = document.getElementById("swqStatus"),
    latest = null;
  if (!engine || !form) return;
  function el(id) {
    return document.getElementById(id);
  }
  var SECTION = {
      substructure: "A. Msingi",
      superstructure: "B. Kuta",
      roof: "C. Paa",
      openings: "D. Milango na madirisha",
      finishes: "E. Umaliziaji",
      plumbing: "F. Mabomba",
      electrical: "G. Umeme",
    },
    LABEL = {
      excavation: "Uchimbaji wa msingi",
      hardcore: "Kifusi kilichoshindiliwa",
      "blinding-cement": "Saruji ya zege la usafi",
      "foundation-blocks": "Block za ukuta wa msingi",
      "foundation-mortar": "Saruji ya chokaa cha msingi",
      "foundation-sand": "Mchanga wa msingi",
      "foundation-rebar": "Nondo za msingi",
      "wall-blocks": "Block za kuta",
      "wall-mortar": "Saruji ya chokaa cha kuta",
      "wall-sand": "Mchanga wa chokaa cha kuta",
      "ring-steel": "Nondo za ring beam",
      "ring-formwork": "Formwork na zege la ring beam",
      "zinc-sheets": "Mabati marefu ya 0.55mm",
      rafters: "Mbao za paa",
      ceiling: "Bodi za dari",
      "roof-screws": "Skruu za paa",
      "ridge-cap": "Kifuniko cha kilele",
      "slab-rebar": "Nondo za slab",
      "slab-cement": "Saruji ya slab",
      "slab-sand": "Mchanga wa slab",
      "slab-granite": "Kokoto ya slab",
      "slab-formwork": "Formwork ya slab",
      "clay-tiles": "Vigae vya paa",
      "tile-rafters": "Mbao na battens",
      "ridge-tiles": "Vigae vya kilele",
      "roof-membrane": "Utando wa chini ya paa",
      "wood-doors": "Milango ya mbao",
      "steel-doors": "Milango ya usalama ya chuma",
      windows: "Madirisha ya aluminium",
      "glazed-doors": "Milango ya kioo",
      "door-frames": "Fremu za milango",
      "door-hardware": "Hinges, kufuli na vipini",
      plaster: "Plasta ya ndani",
      "partial-floor-tiles": "Vigae vya sakafu",
      "all-floor-tiles": "Vigae vya maeneo yote",
      screed: "Screed isiyo na vigae",
      "wall-tiles": "Vigae vya kuta za maeneo yenye maji",
      emulsion: "Rangi ya ndani",
      "trim-paint": "Rangi ya milango na madirisha",
      "tile-adhesive": "Gundi ya vigae",
      "tile-grout": "Grout ya vigae",
      wc: "Seti za choo",
      showers: "Seti za bafu",
      sinks: "Sinki za jikoni",
      "waste-pipe": "Bomba la maji taka 110mm",
      "water-pipe": "Bomba la maji 32mm",
      "water-tank": "Tangi la juu 1000L",
      "float-valve": "Float valve na fittings",
      "water-pump": "Pampu ya maji 0.5HP",
      "power-wire": "Waya wa umeme 2.5mm²",
      "lighting-wire": "Waya wa taa 1.5mm²",
      sockets: "Soketi mbili",
      switches: "Swichi za taa",
      "distribution-board": "Bodi ya usambazaji",
      breakers: "Vivunja mzunguko MCB",
      conduit: "Conduit ya PVC",
      inverter: "Inverter/UPS 2kVA na betri",
      earthing: "Fimbo na waya wa kutuliza umeme",
    };
  function settings() {
    return {
      country: el("swqCountry").value,
      area: Number(el("swqArea").value),
      floors: Number(el("swqFloors").value),
      wallHeight: Number(el("swqWallHeight").value),
      wallType: el("swqWallType").value,
      roofType: el("swqRoof").value,
      finishing: el("swqFinish").value,
      contingency: Number(el("swqContingency").value),
      doors: Number(el("swqDoors").value),
      windows: Number(el("swqWindows").value),
      glazedDoors: Number(el("swqGlazed").value),
      wc: Number(el("swqWc").value),
      showers: Number(el("swqShowers").value),
      sinks: Number(el("swqSinks").value),
      beds: Number(el("swqBeds").value),
      sockets: Number(el("swqSockets").value),
      inverter: Number(el("swqInverter").value),
    };
  }
  function clear() {
    latest = null;
    result.hidden = true;
    empty.hidden = false;
    status.textContent = "";
  }
  function fail(message) {
    clear();
    error.textContent = message;
    error.hidden = false;
    error.focus();
  }
  function money(value) {
    return (
      latest.country.currency + " " + Math.round(value).toLocaleString("en-US")
    );
  }
  function calculate() {
    var output = engine.calculate(settings());
    if (output.error) {
      fail(
        "Kagua eneo, sakafu, ukuta, akiba na idadi zote; tumia thamani chanya na namba kamili kwa idadi.",
      );
      return null;
    }
    latest = output;
    el("swqMetrics").innerHTML = [
      ["Vifaa", money(output.materialTotal)],
      ["Kazi ya mfano", money(output.labourCost)],
      ["Akiba", money(output.contingencyAmount)],
      ["Jumla ya kupanga", money(output.grandTotal)],
    ]
      .map(function (row) {
        return "<div><dt>" + row[0] + "</dt><dd>" + row[1] + "</dd></div>";
      })
      .join("");
    var html =
      "<tr><th>Kipengele</th><th>Kiasi</th><th>Kizio</th><th>Kiwango</th><th>Jumla</th></tr>";
    output.sections.forEach(function (section) {
      html += '<tr><th colspan="5">' + SECTION[section.id] + "</th></tr>";
      section.items.forEach(function (item) {
        html +=
          "<tr><td>" +
          (LABEL[item.id] || item.id) +
          "</td><td>" +
          item.qty.toLocaleString("en-US") +
          "</td><td>" +
          item.unit +
          "</td><td>" +
          money(item.rate) +
          "</td><td>" +
          money(item.amount) +
          "</td></tr>";
      });
    });
    el("swqTable").innerHTML = html;
    error.hidden = true;
    result.hidden = false;
    empty.hidden = true;
    status.textContent =
      "Ratiba imeundwa ndani ya kivinjari; bei za Q1 2025 ni chakavu na lazima zibadilishwe.";
    return output;
  }
  function payload() {
    return {
      format: "afrotools-boq-gen",
      locale: "sw",
      savedAt: new Date().toISOString(),
      settings: settings(),
      result: latest,
    };
  }
  function report() {
    return [
      "AfroTools · ratiba ya awali ya BOQ",
      "Nchi: " +
        latest.country.name +
        "; eneo: " +
        latest.input.area +
        " m²; sakafu: " +
        latest.input.floors,
      "Vifaa: " + money(latest.materialTotal),
      "Kazi ya mfano: " + money(latest.labourCost),
      "Akiba: " + money(latest.contingencyAmount),
      "Jumla ya kupanga: " + money(latest.grandTotal),
      "Chanzo: viwango vilivyopachikwa vya Q1 2025 havijathibitishwa; ni chakavu na uhakika ni mdogo.",
      "Tahadhari: mkadiriaji majengo lazima athibitishe vipimo, maelezo, kanuni ya upimaji, upotevu, kodi na bei za sasa.",
    ].join("\n");
  }
  function download(blob, name) {
    var url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  function csv() {
    var rows = [
      ["sehemu", "kipengele", "kiasi", "kizio", "kiwango", "jumla", "sarafu"],
    ];
    latest.sections.forEach(function (section) {
      section.items.forEach(function (item) {
        rows.push([
          SECTION[section.id],
          LABEL[item.id] || item.id,
          item.qty,
          item.unit,
          item.rate,
          item.amount,
          latest.country.currency,
        ]);
      });
    });
    rows.push(
      [],
      ["kipimo", "thamani"],
      ["vifaa", latest.materialTotal],
      ["kazi", latest.labourCost],
      ["subtotal", latest.subtotal],
      ["akiba", latest.contingencyAmount],
      ["jumla", latest.grandTotal],
      ["snapshot", latest.snapshot],
      ["uhakika", latest.confidence],
    );
    return rows
      .map(function (row) {
        return row
          .map(function (cell) {
            return (
              '"' +
              String(cell === undefined ? "" : cell).replace(/"/g, '""') +
              '"'
            );
          })
          .join(",");
      })
      .join("\n");
  }
  function exportFile(kind) {
    if (!latest && !calculate()) return;
    if (kind === "json")
      download(
        new Blob([JSON.stringify(payload(), null, 2)], {
          type: "application/json",
        }),
        "boq-awali.json",
      );
    if (kind === "csv")
      download(
        new Blob([csv()], { type: "text/csv;charset=utf-8" }),
        "boq-awali.csv",
      );
    if (kind === "txt")
      download(
        new Blob([report()], { type: "text/plain;charset=utf-8" }),
        "boq-awali.txt",
      );
    if (kind === "pdf") {
      var PDF = window.jspdf && window.jspdf.jsPDF;
      if (!PDF) return;
      var doc = new PDF();
      doc.text(doc.splitTextToSize(report(), 175), 18, 20);
      doc.save("boq-awali.pdf");
    }
    status.textContent = "Faili limeundwa ndani ya kivinjari hiki.";
  }
  function reopen(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        if (!data || data.format !== "afrotools-boq-gen" || !data.settings)
          throw new Error("format");
        var map = {
          country: "swqCountry",
          area: "swqArea",
          floors: "swqFloors",
          wallHeight: "swqWallHeight",
          wallType: "swqWallType",
          roofType: "swqRoof",
          finishing: "swqFinish",
          contingency: "swqContingency",
          doors: "swqDoors",
          windows: "swqWindows",
          glazedDoors: "swqGlazed",
          wc: "swqWc",
          showers: "swqShowers",
          sinks: "swqSinks",
          beds: "swqBeds",
          sockets: "swqSockets",
          inverter: "swqInverter",
        };
        Object.keys(map).forEach(function (key) {
          el(map[key]).value = data.settings[key];
        });
        calculate();
        status.textContent = "JSON imefunguliwa na kukokotolewa tena.";
      } catch (reason) {
        fail("JSON hii si nakala halali ya zana hii.");
      }
    };
    reader.readAsText(file);
  }
  el("swqPreset").addEventListener("change", function () {
    var preset = engine.BUILD_PRESETS[this.value];
    if (!preset) return;
    if (preset.area) el("swqArea").value = preset.area;
    el("swqDoors").value = preset.doors;
    el("swqWindows").value = preset.windows;
    el("swqWc").value = preset.wc;
    el("swqShowers").value = preset.showers;
    el("swqSinks").value = preset.sinks;
    el("swqBeds").value = preset.beds;
    clear();
  });
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    calculate();
  });
  form.addEventListener("reset", function () {
    setTimeout(function () {
      clear();
      error.hidden = true;
    }, 0);
  });
  document.querySelectorAll("[data-swq-export]").forEach(function (button) {
    button.addEventListener("click", function () {
      exportFile(button.dataset.swqExport);
    });
  });
  var file = el("swqImport");
  document
    .querySelector("[data-swq-import]")
    .addEventListener("click", function () {
      file.click();
    });
  file.addEventListener("change", function () {
    if (file.files[0]) reopen(file.files[0]);
    file.value = "";
  });
})();

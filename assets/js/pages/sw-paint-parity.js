(function () {
  "use strict";
  var engine = window.EngineeringMaterialsEngine,
    form = document.getElementById("swpForm"),
    list = document.getElementById("swpRooms"),
    result = document.getElementById("swpResult"),
    empty = document.getElementById("swpEmpty"),
    error = document.getElementById("swpError"),
    status = document.getElementById("swpStatus"),
    rooms = [],
    latest = null;
  if (!engine || !form) return;
  function value(id) {
    return document.getElementById(id).value;
  }
  function clear() {
    latest = null;
    result.hidden = true;
    empty.hidden = false;
    status.textContent = "";
  }
  function roomInput() {
    return {
      shape: value("swpShape"),
      unit: value("swpUnit"),
      length: value("swpLength"),
      width: value("swpWidth"),
      height: value("swpHeight"),
      length1: value("swpLength1"),
      width1: value("swpWidth1"),
      length2: value("swpLength2"),
      width2: value("swpWidth2"),
      wallArea: value("swpWallArea"),
      ceilingArea: value("swpCeilingArea"),
      doors: value("swpDoors"),
      windows: value("swpWindows"),
      doorArea: 1.68,
      windowArea: 1.44,
      includeCeiling: document.getElementById("swpCeiling").checked,
    };
  }
  function renderRooms() {
    list.innerHTML = "";
    rooms.forEach(function (room, index) {
      var item = document.createElement("li"),
        button = document.createElement("button");
      item.appendChild(
        document.createTextNode(
          "Chumba " +
            (index + 1) +
            ": " +
            room.paintable.toFixed(1) +
            " m² za kupaka",
        ),
      );
      button.type = "button";
      button.textContent = "Ondoa";
      button.addEventListener("click", function () {
        rooms.splice(index, 1);
        renderRooms();
        clear();
      });
      item.appendChild(button);
      list.appendChild(item);
    });
  }
  function addCurrent() {
    var room = engine.paintRoom(roomInput());
    if (room.error) {
      showError("Kagua umbo na vipimo vya chumba.");
      return false;
    }
    rooms.push(room);
    renderRooms();
    error.hidden = true;
    clear();
    return true;
  }
  function assumptions() {
    return {
      rooms: rooms,
      baseCoverage: value("swpCoverage"),
      surface: value("swpSurface"),
      coats: value("swpCoats"),
      wastagePct: value("swpWaste"),
      pricePerLitre: value("swpPrice"),
    };
  }
  function showError(message) {
    clear();
    error.textContent = message;
    error.hidden = false;
    error.focus();
  }
  function render(output) {
    latest = output;
    var metrics = [
      ["Eneo lote la kuta", output.totalWall.toFixed(2) + " m²"],
      ["Eneo la kupaka", output.totalPaintable.toFixed(2) + " m²"],
      ["Rangi ya juu", output.litresNeeded + " L"],
      ["Primer", output.primerLitres + " L"],
      ["Kufunika halisi", output.effectiveCoverage.toFixed(2) + " m²/L"],
      ["Vyumba", String(output.rooms.length)],
    ];
    document.getElementById("swpMetrics").innerHTML = metrics
      .map(function (item) {
        return "<div><dt>" + item[0] + "</dt><dd>" + item[1] + "</dd></div>";
      })
      .join("");
    var tins = [];
    if (output.tins.litres20) tins.push(output.tins.litres20 + " × 20 L");
    if (output.tins.litres4) tins.push(output.tins.litres4 + " × 4 L");
    if (output.tins.litres1) tins.push(output.tins.litres1 + " × 1 L");
    document.getElementById("swpTins").textContent =
      "Pendekezo la vyombo: " + tins.join(", ") + ".";
    var currency = value("swpCurrency").trim();
    document.getElementById("swpCost").textContent =
      output.pricePerLitre > 0
        ? "Gharama ya rangi: " +
          currency +
          " " +
          output.totalCost.toLocaleString() +
          (output.primerLitres
            ? "; primer ya kukadiria: " +
              currency +
              " " +
              Math.round(output.primerCost).toLocaleString() +
              "."
            : ".")
        : "Hakuna gharama iliyokokotolewa kwa sababu bei kwa lita haijaingizwa.";
    document.getElementById("swpNote").textContent =
      "Tumia lebo ya " +
      value("swpProduct").trim() +
      " na uhakiki hali ya uso. Makisio yana akiba ya " +
      output.wastagePct +
      "%.";
    error.hidden = true;
    result.hidden = false;
    empty.hidden = true;
    status.textContent = "Makisio yamekamilika katika kivinjari hiki.";
  }
  function calculate() {
    if (!rooms.length && !addCurrent()) return;
    var output = engine.paint(assumptions());
    if (output.error) {
      showError("Kagua eneo, kiwango cha kufunika, tabaka, akiba na bei.");
      return;
    }
    render(output);
  }
  function packageData() {
    return {
      format: "afrotools-paint",
      locale: "sw",
      savedAt: new Date().toISOString(),
      rooms: rooms,
      settings: {
        product: value("swpProduct"),
        coverage: value("swpCoverage"),
        surface: value("swpSurface"),
        coats: value("swpCoats"),
        wastage: value("swpWaste"),
        currency: value("swpCurrency"),
        price: value("swpPrice"),
      },
      result: latest,
    };
  }
  function report() {
    return [
      "AfroTools · makisio ya rangi",
      "Bidhaa: " + value("swpProduct"),
      "Vyumba: " + latest.rooms.length,
      "Eneo la kupaka: " + latest.totalPaintable.toFixed(2) + " m²",
      "Rangi: " +
        latest.litresNeeded +
        " L; primer: " +
        latest.primerLitres +
        " L",
      "Vyombo: " +
        latest.tins.litres20 +
        " × 20 L; " +
        latest.tins.litres4 +
        " × 4 L; " +
        latest.tins.litres1 +
        " × 1 L",
      "Kufunika halisi: " +
        latest.effectiveCoverage.toFixed(2) +
        " m²/L; tabaka: " +
        latest.coats +
        "; akiba: " +
        latest.wastagePct +
        "%",
      "Tahadhari: thibitisha lebo, uso, bei ya sasa na maelekezo ya usalama.",
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
      ["chumba", "eneo_kuta_m2", "nafasi_m2", "dari_m2", "eneo_kupaka_m2"],
    ];
    latest.rooms.forEach(function (room, index) {
      rows.push([
        index + 1,
        room.wallArea.toFixed(2),
        room.openings.toFixed(2),
        room.ceilingArea.toFixed(2),
        room.paintable.toFixed(2),
      ]);
    });
    rows.push(
      [],
      ["kipimo", "thamani"],
      ["rangi_lita", latest.litresNeeded],
      ["primer_lita", latest.primerLitres],
      ["kufunika_halisi_m2_l", latest.effectiveCoverage.toFixed(2)],
      ["akiba_asilimia", latest.wastagePct],
    );
    return rows
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
  function exportFile(kind) {
    if (!latest) return;
    if (kind === "json")
      download(
        new Blob([JSON.stringify(packageData(), null, 2)], {
          type: "application/json",
        }),
        "makisio-ya-rangi.json",
      );
    if (kind === "csv")
      download(
        new Blob([csv()], { type: "text/csv;charset=utf-8" }),
        "makisio-ya-rangi.csv",
      );
    if (kind === "txt")
      download(
        new Blob([report()], { type: "text/plain;charset=utf-8" }),
        "makisio-ya-rangi.txt",
      );
    if (kind === "pdf") {
      var PDF = window.jspdf && window.jspdf.jsPDF;
      if (!PDF) return;
      var doc = new PDF();
      doc.text(doc.splitTextToSize(report(), 175), 18, 20);
      doc.save("makisio-ya-rangi.pdf");
    }
    status.textContent = "Faili limeundwa katika kivinjari hiki.";
  }
  function reopen(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        if (
          !data ||
          data.format !== "afrotools-paint" ||
          !Array.isArray(data.rooms) ||
          !data.settings
        )
          throw new Error("format");
        rooms = data.rooms;
        renderRooms();
        document.getElementById("swpProduct").value = data.settings.product;
        document.getElementById("swpCoverage").value = data.settings.coverage;
        document.getElementById("swpSurface").value = data.settings.surface;
        document.getElementById("swpCoats").value = data.settings.coats;
        document.getElementById("swpWaste").value = data.settings.wastage;
        document.getElementById("swpCurrency").value = data.settings.currency;
        document.getElementById("swpPrice").value = data.settings.price;
        calculate();
        status.textContent = "JSON imefunguliwa na kukokotolewa tena.";
      } catch (reason) {
        showError("JSON hii si nakala halali ya kikokotoo hiki.");
      }
    };
    reader.readAsText(file);
  }
  document.getElementById("swpShape").addEventListener("change", function () {
    document.querySelectorAll("[data-shape]").forEach(function (group) {
      group.hidden = group.dataset.shape !== value("swpShape");
    });
  });
  document.getElementById("swpAdd").addEventListener("click", addCurrent);
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    calculate();
  });
  form.addEventListener("reset", function () {
    setTimeout(function () {
      rooms = [];
      renderRooms();
      clear();
      error.hidden = true;
      document.getElementById("swpShape").dispatchEvent(new Event("change"));
    }, 0);
  });
  document.querySelectorAll("[data-swp-export]").forEach(function (button) {
    button.addEventListener("click", function () {
      exportFile(button.dataset.swpExport);
    });
  });
  var fileInput = document.getElementById("swpImport");
  document
    .querySelector("[data-swp-import]")
    .addEventListener("click", function () {
      fileInput.click();
    });
  fileInput.addEventListener("change", function () {
    if (fileInput.files[0]) reopen(fileInput.files[0]);
    fileInput.value = "";
  });
})();

(function () {
  "use strict";
  var engine = window.GeneratorSizingEngine,
    form = document.getElementById("swgForm"),
    list = document.getElementById("swgList"),
    result = document.getElementById("swgResult"),
    empty = document.getElementById("swgEmpty"),
    error = document.getElementById("swgError"),
    status = document.getElementById("swgStatus"),
    load = [],
    latest = null;
  if (!engine || !form) return;
  var names = {
      "LED Lights (per bulb)": "Taa za LED (kila moja)",
      "Ceiling Fan": "Feni ya dari",
      "Standing Fan": "Feni ya kusimama",
      "Television (LED/LCD)": "Televisheni ya LED/LCD",
      "Satellite Decoder (DSTV/GOtv)": "Kisimbuzi cha setilaiti",
      "Phone Charger": "Chaja ya simu",
      Laptop: "Kompyuta mpakato",
      "Desktop Computer + Monitor": "Kompyuta ya mezani na kioo",
      "Refrigerator (Small)": "Jokofu dogo",
      "Refrigerator (Large/Double Door)": "Jokofu kubwa la milango miwili",
      "Chest Freezer": "Friza ya sanduku",
      "Microwave Oven": "Tanuri ya microwave",
      "Electric Kettle": "Birika la umeme",
      Blender: "Mashine ya kusagia",
      Toaster: "Kibaniko",
      "Iron (Pressing Iron)": "Pasi ya umeme",
      "Washing Machine": "Mashine ya kufulia",
      "Water Pump (0.5 HP)": "Pampu ya maji 0.5 HP",
      "Water Pump (1 HP)": "Pampu ya maji 1 HP",
      "Air Conditioner (1 HP)": "Kiyoyozi 1 HP",
      "Air Conditioner (1.5 HP)": "Kiyoyozi 1.5 HP",
      "Air Conditioner (2 HP)": "Kiyoyozi 2 HP",
      "Water Heater (Instant)": "Kipasha maji cha papo hapo",
      "Security Lights (Halogen)": "Taa za usalama",
      "WiFi Router": "Kisambaza Wi-Fi",
      "CCTV System": "Mfumo wa kamera za usalama",
      Printer: "Printa",
      "Hair Dryer": "Kikausha nywele",
      "Electric Cooker/Hotplate": "Jiko la umeme",
      "Sound System": "Mfumo wa sauti",
    },
    categories = {
      Lighting: "Taa",
      Cooling: "Upoezaji",
      Electronics: "Vifaa vya kielektroniki",
      Kitchen: "Jikoni",
      Household: "Nyumbani",
      Personal: "Binafsi",
    };
  function localize(app) {
    return {
      name: names[app.name] || app.name,
      sourceName: app.name,
      watts: app.watts,
      surge: app.surge,
      cat: categories[app.cat] || app.cat,
      qty: app.qty,
    };
  }
  load = engine.defaults().map(localize);
  function el(id) {
    return document.getElementById(id);
  }
  function clear() {
    latest = null;
    result.hidden = true;
    empty.hidden = false;
    status.textContent = "";
  }
  function render() {
    list.innerHTML = "";
    load.forEach(function (app, index) {
      var row = document.createElement("div");
      row.className = "swr-grid";
      row.style.marginBottom = "10px";
      var label = document.createElement("label");
      label.textContent =
        app.name +
        " (" +
        app.watts +
        "W, kizidishi cha kuanza x" +
        app.surge +
        ")";
      var qty = document.createElement("input");
      qty.type = "number";
      qty.min = "0";
      qty.max = "50";
      qty.step = "1";
      qty.value = app.qty;
      qty.setAttribute("aria-label", "Idadi ya " + app.name);
      qty.addEventListener("change", function () {
        load[index].qty = Number(qty.value);
        clear();
      });
      label.appendChild(qty);
      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "swr-secondary";
      remove.textContent = "Ondoa";
      remove.setAttribute("aria-label", "Ondoa " + app.name);
      remove.addEventListener("click", function () {
        load.splice(index, 1);
        render();
        clear();
      });
      row.append(label, remove);
      list.appendChild(row);
    });
  }
  function fail(message) {
    clear();
    error.textContent = message;
    error.hidden = false;
    error.focus();
  }
  function calculate() {
    var output = engine.calculate(load);
    if (output.error) {
      fail(
        "Ongeza angalau kifaa kimoja chenye watt, kizidishi cha kuanza na idadi halali.",
      );
      return null;
    }
    latest = output;
    el("swgMetrics").innerHTML = [
      ["Mzigo wa kuendesha", (output.runningWatts / 1000).toFixed(2) + " kW"],
      ["Mzigo wa kuanza", (output.startupWatts / 1000).toFixed(2) + " kW"],
      ["Ukubwa wa kupanga", output.recommendedKVA + " kVA"],
      [
        "Kipengele cha nguvu / akiba",
        output.powerFactor + " / " + output.headroomPercent + "%",
      ],
    ]
      .map(function (row) {
        return "<div><dt>" + row[0] + "</dt><dd>" + row[1] + "</dd></div>";
      })
      .join("");
    el("swgTable").innerHTML =
      "<tr><th>Kifaa</th><th>Idadi</th><th>Watt</th><th>Kizidishi cha kuanza</th></tr>" +
      output.appliances
        .map(function (app) {
          return (
            "<tr><td>" +
            app.name.replace(/[&<>]/g, function (c) {
              return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c];
            }) +
            "</td><td>" +
            app.qty +
            "</td><td>" +
            app.runningWatts +
            "</td><td>x" +
            app.surge +
            "</td></tr>"
          );
        })
        .join("");
    error.hidden = true;
    result.hidden = false;
    empty.hidden = true;
    status.textContent =
      "Makisio yamekamilika ndani ya kivinjari; hakiki lebo za vifaa na fundi.";
    return output;
  }
  function payload() {
    return {
      format: "afrotools-generator-sizing",
      locale: "sw",
      savedAt: new Date().toISOString(),
      load: load,
      result: latest,
    };
  }
  function report() {
    return [
      "AfroTools · makisio ya ukubwa wa jenereta",
      "Mzigo wa kuendesha: " + (latest.runningWatts / 1000).toFixed(2) + " kW",
      "Mzigo wa kuanza: " + (latest.startupWatts / 1000).toFixed(2) + " kW",
      "Ukubwa wa kupanga: " +
        latest.recommendedKVA +
        " kVA; kipengele cha nguvu " +
        latest.powerFactor +
        "; akiba " +
        latest.headroomPercent +
        "%",
      "Hali ya chanzo: mifano haina tarehe wala chanzo cha mtengenezaji; ni chakavu na uhakika ni mdogo.",
      "Tahadhari: hakiki lebo za vifaa, kuanza kwa mota, awamu, upunguzaji kwa mwinuko na joto, kebo, kivunja mzunguko, kutuliza umeme, swichi ya uhamisho na uwekaji wa nje salama dhidi ya monoksidi kaboni na fundi mwenye sifa.",
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
      ["kifaa", "idadi", "watt_kila", "watt_jumla", "kizidishi_cha_kuanza"],
    ];
    latest.appliances.forEach(function (app) {
      rows.push([app.name, app.qty, app.watts, app.runningWatts, app.surge]);
    });
    rows.push(
      [],
      ["kipimo", "thamani"],
      ["running_watts", latest.runningWatts],
      ["startup_watts", latest.startupWatts],
      ["recommended_kva", latest.recommendedKVA],
      ["power_factor", latest.powerFactor],
      ["headroom_percent", latest.headroomPercent],
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
        "ukubwa-jenereta.json",
      );
    if (kind === "csv")
      download(
        new Blob([csv()], { type: "text/csv;charset=utf-8" }),
        "ukubwa-jenereta.csv",
      );
    if (kind === "txt")
      download(
        new Blob([report()], { type: "text/plain;charset=utf-8" }),
        "ukubwa-jenereta.txt",
      );
    if (kind === "pdf") {
      var PDF = window.jspdf && window.jspdf.jsPDF;
      if (!PDF) return;
      var doc = new PDF();
      doc.text(doc.splitTextToSize(report(), 175), 18, 20);
      doc.save("ukubwa-jenereta.pdf");
    }
    status.textContent = "Faili limeundwa ndani ya kivinjari hiki.";
  }
  function reopen(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        if (
          !data ||
          data.format !== "afrotools-generator-sizing" ||
          !Array.isArray(data.load)
        )
          throw new Error("format");
        load = data.load;
        render();
        calculate();
        status.textContent = "JSON imefunguliwa na kukokotolewa tena.";
      } catch (reason) {
        fail("JSON hii si nakala halali ya kikokotoo hiki.");
      }
    };
    reader.readAsText(file);
  }
  var preset = el("swgPreset"),
    groups = {};
  engine.APPLIANCES.forEach(function (app) {
    if (!groups[app.cat]) {
      groups[app.cat] = document.createElement("optgroup");
      groups[app.cat].label = categories[app.cat] || app.cat;
      preset.appendChild(groups[app.cat]);
    }
    var option = document.createElement("option");
    option.value = app.name;
    option.textContent =
      (names[app.name] || app.name) + " (" + app.watts + "W)";
    groups[app.cat].appendChild(option);
  });
  el("swgAddPreset").addEventListener("click", function () {
    var app = engine.APPLIANCES.find(function (item) {
      return item.name === preset.value;
    });
    if (!app) {
      fail("Chagua kifaa cha mfano kwanza.");
      return;
    }
    var existing = load.find(function (item) {
      return item.sourceName === app.name;
    });
    if (existing) existing.qty++;
    else load.push(localize(Object.assign({}, app, { qty: 1 })));
    preset.value = "";
    render();
    clear();
    error.hidden = true;
  });
  el("swgAddCustom").addEventListener("click", function () {
    var name = el("swgName").value.trim(),
      watts = Number(el("swgWatts").value),
      surge = Number(el("swgSurge").value);
    if (
      !name ||
      !Number.isFinite(watts) ||
      watts <= 0 ||
      !Number.isFinite(surge) ||
      surge < 1
    ) {
      fail("Ingiza jina, watt chanya na kizidishi cha kuanza kisichopungua 1.");
      return;
    }
    load.push({ name: name, watts: watts, surge: surge, qty: 1 });
    el("swgName").value = "";
    el("swgWatts").value = "";
    render();
    clear();
    error.hidden = true;
  });
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    calculate();
  });
  form.addEventListener("reset", function () {
    setTimeout(function () {
      load = engine.defaults().map(localize);
      render();
      clear();
      error.hidden = true;
    }, 0);
  });
  document.querySelectorAll("[data-swg-export]").forEach(function (button) {
    button.addEventListener("click", function () {
      exportFile(button.dataset.swgExport);
    });
  });
  var input = el("swgImport");
  document
    .querySelector("[data-swg-import]")
    .addEventListener("click", function () {
      input.click();
    });
  input.addEventListener("change", function () {
    if (input.files[0]) reopen(input.files[0]);
    input.value = "";
  });
  render();
})();

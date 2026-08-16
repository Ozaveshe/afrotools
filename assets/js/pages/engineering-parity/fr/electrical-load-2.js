(function () {
  "use strict";
  var engine = window.AfroToolsElectricalLoadEngine;
  var appList = document.getElementById("applianceList");
  var quickAdd = document.getElementById("quickAdd");
  var rowId = 0;
  var lastResult = null;
  if (!engine || !appList) return;

  function addRow(name, watts, quantity, hours) {
    var id = rowId++;
    var row = document.createElement("div");
    row.className = "app-row";
    row.id = "row-" + id;
    row.innerHTML =
      '<input aria-label="Appareil name" type="text" value="' +
      String(name || "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;") +
      '" placeholder="Appareil" style="font-weight:600">' +
      '<input aria-label="Puissance (W) per Appareil" type="number" value="' +
      (watts || "") +
      '" min="1" placeholder="W">' +
      '<input aria-label="Quantité" type="number" value="' +
      (quantity || 1) +
      '" min="1" max="50">' +
      '<input aria-label="Hours used per day" type="number" value="' +
      (hours == null ? 8 : hours) +
      '" min="0" max="24" step="0.5">' +
      '<button type="button" class="remove-btn" aria-label="Supprimer Appareil">×</button>';
    row.querySelector("button").addEventListener("click", function () {
      row.remove();
      lastResult = null;
    });
    appList.appendChild(row);
  }
  function preset(rows) {
    appList.innerHTML = "";
    rowId = 0;
    rows.forEach(function (row) {
      addRow(row[0], row[1], row[2], row[3]);
    });
    lastResult = null;
  }
  var HOME = [
    ["Ampoule LED", 10, 8, 6],
    ["Ventilateur de plafond", 60, 4, 10],
    ['TV (LED 43")', 100, 1, 6],
    ["Réfrigérateur", 150, 1, 24],
    ["AC 1.5HP", 1120, 2, 8],
    ["Machine à laver", 500, 1, 1],
    ["Eau Pump", 750, 1, 2],
    ["Fer électrique", 1000, 1, 0.5],
    ["Four à micro-ondes", 1000, 1, 0.5],
    ["Chargeur de téléphone", 15, 4, 3],
    ["Router / Modem", 15, 1, 24],
    ["DSTV / Decoder", 30, 1, 8],
  ];
  var OFFICE = [
    ["LED Panel Light", 36, 12, 10],
    ["AC 2HP", 1500, 3, 10],
    ["Ordinateur de bureau", 300, 8, 10],
    ["Écran", 40, 8, 10],
    ["Imprimante", 500, 2, 2],
    ["Router / Modem", 15, 2, 24],
    ["Eau Dispenser", 100, 1, 12],
    ["Réfrigérateur", 150, 1, 24],
    ["Four à micro-ondes", 1000, 1, 0.5],
    ["Security Camera", 15, 4, 24],
  ];
  function input() {
    return {
      countryCode: document.getElementById("country").value,
      phases: Number(document.getElementById("phase").value),
      diversity: Number(document.getElementById("diversity").value),
      appliances: Array.from(appList.querySelectorAll(".app-row")).map(
        function (row) {
          var fields = row.querySelectorAll("input");
          return {
            name: fields[0].value,
            watts: fields[1].value,
            quantity: fields[2].value,
            hoursPerDay: fields[3].value,
          };
        },
      ),
    };
  }
  function recommendation(result) {
    if (result.recommendation === "three-phase-review")
      return [
        "red",
        "triphasée-phase review required",
        "The planning demand exceeds the Calculateur's 13 kW monophasée-phase screen. Ask the utility and a licensed electrician to assess the supply.",
      ];
    if (result.recommendation === "single-phase-limit")
      return [
        "amber",
        "Approaching the monophasée-phase screen",
        "The planning demand is above 8 kW. Ask a licensed electrician whether the current supply and protection remain suitable.",
      ];
    return [
      "green",
      "Within the selected phase screen",
      "This is still a planning prompt. Final cable, breaker, earthing, voltage-drop and fault protection require an electrician's design and test.",
    ];
  }
  function render(result) {
    var rec = recommendation(result);
    document.getElementById("resultGrid").innerHTML = [
      [result.totalKw.toFixed(1) + " kW", "Puissance totale raccordée"],
      [
        result.demandKw.toFixed(1) + " kW",
        "Charge appelée (" + Math.round(result.diversity * 100) + "%)",
      ],
      [result.amps.toFixed(1) + " A", "Calculated current"],
      [result.breakerAmps + "A", "Illustrative breaker"],
      [result.cablePrompt, "Illustrative cable"],
      [result.generatorKva + " kVA", "Illustrative Générateur"],
    ]
      .map(function (item) {
        return (
          '<div class="result-box"><div class="num">' +
          item[0] +
          '</div><div class="lbl">' +
          item[1] +
          "</div></div>"
        );
      })
      .join("");
    var categories = {};
    result.appliances.forEach(function (row) {
      categories[row.category] =
        (categories[row.category] || 0) + row.connectedWatts;
    });
    document.getElementById("loadBars").innerHTML =
      '<h4 style="font-size:.82rem;font-weight:700;margin-bottom:8px">Charger</h4>' +
      Object.keys(categories)
        .sort(function (a, b) {
          return categories[b] - categories[a];
        })
        .map(function (category) {
          var percentage = result.totalKw
            ? (categories[category] / (result.totalKw * 1000)) * 100
            : 0;
          return (
            '<div class="load-bar-row"><span class="load-bar-label">' +
            category +
            '</span><div class="load-bar-wrap"><div class="load-bar" style="width:' +
            percentage.toFixed(0) +
            '%"><span>' +
            (categories[category] / 1000).toFixed(1) +
            "kW</span></div></div></div>"
          );
        })
        .join("");
    document.getElementById("recommendation").innerHTML =
      '<div class="rec-card ' +
      rec[0] +
      '"><h3>' +
      rec[1] +
      "</h3><p>" +
      rec[2] +
      "</p></div>";
    document.getElementById("genSection").innerHTML =
      '<div class="cost-note"><strong>Générateur planning prompt:</strong> ' +
      result.generatorKva +
      " kVA. Motor starting, load steps, derating and manufacturer data are not modelled.</div>";
    document.getElementById("costSection").innerHTML =
      '<div class="cost-note"><strong>Undated tariff assumption:</strong> ' +
      Math.round(result.monthlyKwh) +
      " kWh × " +
      result.profile.symbol +
      result.profile.tariff +
      "/kWh = <strong>" +
      result.profile.symbol +
      result.monthlyCost.toLocaleString() +
      "/mois</strong>. Confirm the current tariff on the latest bill.</div>";
    var warnings = [];
    if (result.breakerRangeExceeded)
      warnings.push(
        "The required breaker prompt exceeds the Calculateur's 160A table.",
      );
    if (result.generatorRangeExceeded)
      warnings.push(
        "The Générateur prompt exceeds the Calculateur's 100 kVA table.",
      );
    document.getElementById("warnings").innerHTML = warnings.length
      ? '<div class="warning"><strong>Range limit:</strong><p>' +
        warnings.join(" ") +
        "</p></div>"
      : "";
    document.getElementById("resultCard").style.display = "block";
    document.getElementById("electricalStatus").textContent =
      "Estimation indicative ready. Verify every selection with a licensed electrician.";
  }
  function calculate() {
    try {
      lastResult = engine.calculate(input());
      render(lastResult);
      return lastResult;
    } catch (error) {
      lastResult = null;
      document.getElementById("resultCard").style.display = "none";
      document.getElementById("electricalStatus").textContent =
        "Check every Appareil name, wattage, Quantité and daily-use value.";
      return null;
    }
  }
  function brief() {
    var r = lastResult || calculate();
    if (!r) return "";
    return [
      "AfroTools Électricité load planning brief",
      "Profile: " +
        r.profile.name +
        ", " +
        r.profile.voltage +
        "V, static tariff " +
        r.profile.symbol +
        r.profile.tariff +
        "/kWh",
      "Connected: " +
        r.totalKw.toFixed(2) +
        " kW; demand: " +
        r.demandKw.toFixed(2) +
        " kW; current: " +
        r.amps.toFixed(2) +
        " A",
      "Prompts: " +
        r.breakerAmps +
        "A breaker; " +
        r.cablePrompt +
        " cable; " +
        r.generatorKva +
        " kVA Générateur",
      "Monthly assumption: " +
        r.monthlyKwh.toFixed(2) +
        " kWh; " +
        r.profile.symbol +
        r.monthlyCost,
      "Boundary: undated static Hypothèses with low confidence; licensed-electrician verification required.",
    ].join("\n");
  }
  function csv() {
    var r = lastResult || calculate();
    if (!r) return;
    var rows = [
      [
        "appliance",
        "watts",
        "quantity",
        "hours_per_day",
        "connected_watts",
        "monthly_kwh",
      ],
    ];
    r.appliances.forEach(function (item) {
      rows.push([
        item.name,
        item.watts,
        item.quantity,
        item.hoursPerDay,
        item.connectedWatts,
        item.monthlyKwh.toFixed(2),
      ]);
    });
    rows.push(
      [],
      ["field", "value"],
      ["profile", r.profile.name],
      ["connected_kw", r.totalKw.toFixed(2)],
      ["demand_kw", r.demandKw.toFixed(2)],
      ["amps", r.amps.toFixed(2)],
      ["breaker_prompt_a", r.breakerAmps],
      ["cable_prompt", r.cablePrompt],
      ["generator_prompt_kva", r.generatorKva],
      ["monthly_kwh", r.monthlyKwh.toFixed(2)],
      ["monthly_cost", r.monthlyCost],
      [
        "confidence",
        "low; undated static Hypothèses; electrician verification required",
      ],
    );
    var value = rows
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
    var url = URL.createObjectURL(
      new Blob([value], { type: "text/csv;charset=utf-8" }),
    );
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "afrotools-electrical-load-schedule.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }
  window.addCustomRow = function () {
    addRow("", "", 1, 8);
  };
  window.loadHomePreset = function () {
    preset(HOME);
  };
  window.loadOfficePreset = function () {
    preset(OFFICE);
  };
  window.resetAll = function () {
    preset([["", "", 1, 8]]);
    document.getElementById("resultCard").style.display = "none";
    document.getElementById("electricalStatus").textContent = "";
  };
  window.updateCountry = function () {
    lastResult = null;
  };
  window.calculate = calculate;
  window.downloadElectricalCsv = csv;
  window.copyElectricalBrief = function () {
    var value = brief();
    if (!value) return;
    if (navigator.clipboard)
      navigator.clipboard.writeText(value).catch(function () {});
    document.getElementById("electricalStatus").textContent =
      "Électricité planning brief copied.";
  };
  window.shareResult = function () {
    var value = brief();
    if (!value) return;
    if (navigator.share)
      navigator
        .share({ title: "Électricité Load | AfroTools", text: value })
        .catch(function () {});
    else window.copyElectricalBrief();
  };
  Object.keys(engine.appliances).forEach(function (category) {
    engine.appliances[category].forEach(function (item) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "btn-sm";
      button.textContent = item[0] + " (" + item[1] + "W)";
      button.addEventListener("click", function () {
        addRow(item[0], item[1], 1, 8);
      });
      quickAdd.appendChild(button);
    });
  });
  preset(HOME);
})();

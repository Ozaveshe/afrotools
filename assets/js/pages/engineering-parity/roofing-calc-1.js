(function () {
  "use strict";
  var engine = window.EngineeringMaterialsEngine;
  var widths = {
    longspan: 0.76,
    longspan07: 0.76,
    steptile: 0.42,
    metcoppo: 0.77,
    corrugated: 0.66,
  };
  function el(id) {
    return document.getElementById(id);
  }
  function value(id) {
    return Number(el(id).value);
  }
  function input() {
    return {
      length: value("bldgLength"),
      width: value("bldgWidth"),
      roofType: el("roofType").value,
      pitch: value("roofPitch"),
      overhang: value("overhang"),
      sections: value("sections"),
      coverWidth: value("coverWidth"),
      wastePct: value("wastage"),
    };
  }
  function render(result) {
    el("resultGrid").innerHTML = [
      [result.roofArea.toFixed(1) + " m²", "Estimated roof area"],
      [result.totalSheets, "Sheets needed"],
      [result.slopeLength.toFixed(2) + " m", "Slope length"],
      [result.ridgeCaps, "Ridge caps"],
      [result.numTrusses, "Indicative trusses"],
      [result.totalTimberM.toFixed(0) + " m", "Indicative truss timber"],
    ]
      .map(function (item) {
        return '<div class="result-box"><div class="num">' + item[0] +
          '</div><div class="lbl">' + item[1] + "</div></div>";
      })
      .join("");
    var rows = [
      ["Roofing sheets", result.totalSheets + " pcs", result.slopeLength.toFixed(2) + " m each"],
      ["Ridge caps", result.ridgeCaps + " pcs", result.ridgeLength.toFixed(1) + " m ridge"],
      ["Roofing nails", result.nailKg + " kg", "about " + result.nails + " nails"],
      ["Hip/valley allowance", result.valleyM ? result.valleyM + " m" : "N/A", "geometry estimate"],
      ["Fascia / gutter run", result.fasciaM + " m", "perimeter allowance"],
      ["Trusses", result.numTrusses, "0.9 m planning spacing"],
      ["Purlins", result.purlinsM.toFixed(0) + " m", "1.2 m planning spacing"],
    ];
    el("materialsTable").innerHTML =
      "<tr><th>Item</th><th>Quantity</th><th>Assumption</th></tr>" +
      rows.map(function (row) {
        return "<tr><td>" + row[0] + "</td><td>" + row[1] + "</td><td>" + row[2] + "</td></tr>";
      }).join("");
    el("resultCard").style.display = "block";
    el("resultCard").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function calculate() {
    if (!engine || typeof engine.roof !== "function") return;
    var result = engine.roof(input());
    if (result.error) {
      el("resultCard").style.display = "none";
      window.alert("Enter valid positive dimensions, pitch, coverage width, sections and wastage.");
      return;
    }
    render(result);
  }
  el("material").addEventListener("change", function () {
    el("coverWidth").value = widths[this.value] || 0.76;
  });
  window.calculate = calculate;
})();

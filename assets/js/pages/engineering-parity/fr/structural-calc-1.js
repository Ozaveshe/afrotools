var MATERIAL_COSTS = StructuralScreeningEngine.MATERIAL_COSTS;
function fmtNumber(n, d) {
  return Number(n).toLocaleString("en-US", {
    minimumFractionDigits: d || 0,
    maximumFractionDigits: d || 0,
  });
}
function matCost(concreteM3, rebarKg, note) {
  var cost = StructuralScreeningEngine.materialCost(
      concreteM3,
      rebarKg,
      document.getElementById("sc-currency").value,
    ),
    fmt = function (n) {
      return cost.symbol + Math.round(n).toLocaleString();
    };
  return (
    '<div class="cost-box"><strong>Estimatif Matériau Coût — ' +
    cost.name +
    "</strong><br>Béton (" +
    concreteM3.toFixed(2) +
    " m³): " +
    fmt(cost.concreteCost) +
    "<br>Rebar (~" +
    Math.round(rebarKg) +
    " kg): " +
    fmt(cost.rebarCost) +
    "<br><strong>Total: " +
    fmt(cost.total) +
    "</strong>" +
    (note ? "<br><em>" + note + "</em>" : "") +
    '<br><span style="font-size:.78rem;color:#92400e">Effectuez un prédimensionnement indicatif des poutres et des charges.</span></div>'
  );
}
function switchTab(tab, trigger) {
  document.querySelectorAll(".calc-section").forEach(function (s) {
    s.classList.remove("active");
  });
  document.querySelectorAll(".tab").forEach(function (t) {
    t.classList.remove("active");
  });
  document.getElementById("sec-" + tab).classList.add("active");
  (trigger || document.querySelector(".tab")).classList.add("active");
}
function val(id) {
  return document.getElementById(id).value;
}
function calcBeam() {
  try {
    var r = StructuralScreeningEngine.calculateBeam({
      span: val("b-span"),
      udl: val("b-udl"),
      fcu: val("b-fcu"),
      fy: val("b-fy"),
      width: val("b-width"),
      cover: val("b-cover"),
    });
    document.getElementById("beam-summary").innerHTML =
      '<div class="result-card highlight"><div class="result-label">Dimensions de la poutre</div><div class="result-value">' +
      r.width +
      " x " +
      r.height +
      '<span class="result-unit"> mm</span></div></div><div class="result-card"><div class="result-label">Ultimate Moment</div><div class="result-value">' +
      r.M.toFixed(1) +
      '<span class="result-unit"> kNm</span></div></div><div class="result-card"><div class="result-label">Max Shear</div><div class="result-value">' +
      r.V.toFixed(1) +
      '<span class="result-unit"> kN</span></div></div><div class="result-card highlight"><div class="result-label">Main Acier</div><div class="result-value">' +
      r.As.toFixed(0) +
      '<span class="result-unit"> mm2</span></div></div>';
    document.getElementById("beam-table").innerHTML =
      "<tbody><tr><td>Effective Profondeur</td><td>" +
      r.d +
      " mm</td></tr><tr><td>K factor</td><td>" +
      r.K.toFixed(4) +
      (r.compression ? " — outside singly reinforced screen" : "") +
      "</td></tr><tr><td>Lever arm</td><td>" +
      r.z.toFixed(1) +
      " mm</td></tr><tr><td>Minimum Acier</td><td>" +
      r.AsMin.toFixed(0) +
      " mm2</td></tr><tr><td>Bar prompt</td><td>" +
      r.barChoice +
      "</td></tr><tr><td>Link prompt</td><td>R8 @ " +
      r.linksSpacing +
      " mm c/c</td></tr></tbody>";
    document.getElementById("beam-cost").innerHTML = matCost(
      r.concreteM3,
      r.rebarKg,
      "Per beam element.",
    );
    document.getElementById("beam-results").style.display = "block";
  } catch (e) {
    alert(e.message);
    document.getElementById("beam-results").style.display = "none";
  }
}
function calcColumn() {
  try {
    var r = StructuralScreeningEngine.calculateColumn({
      load: val("c-load"),
      fcu: val("c-fcu"),
      fy: val("c-fy"),
      shape: val("c-shape"),
      steelPct: val("c-steel"),
    });
    document.getElementById("col-summary").innerHTML =
      '<div class="result-card highlight"><div class="result-label">Column Diamètre</div><div class="result-value">' +
      r.dimLabel +
      '</div></div><div class="result-card"><div class="result-label">Required Gross Surface</div><div class="result-value">' +
      fmtNumber(r.Ag) +
      '<span class="result-unit"> mm2</span></div></div><div class="result-card"><div class="result-label">Acier Surface</div><div class="result-value">' +
      fmtNumber(r.Asc) +
      '<span class="result-unit"> mm2</span></div></div><div class="result-card highlight"><div class="result-label">Bar Prompt</div><div class="result-value" style="font-size:1rem">' +
      r.barChoice +
      "</div></div>";
    document.getElementById("col-table").innerHTML =
      "<tbody><tr><td>Charger</td><td>" +
      r.load +
      " kN</td></tr><tr><td>Béton grade</td><td>C" +
      r.fcu +
      "</td></tr><tr><td>Acier percentage</td><td>" +
      r.steelPct.toFixed(1) +
      "%</td></tr><tr><td>Actual Surface</td><td>" +
      fmtNumber(r.actualAg) +
      " mm2</td></tr><tr><td>Legacy axial screen</td><td>" +
      r.capacity.toFixed(0) +
      " kN</td></tr></tbody>";
    document.getElementById("col-cost").innerHTML = matCost(
      r.concreteM3,
      r.rebarKg,
      "Uses the legacy 3 m storey assumption.",
    );
    document.getElementById("col-results").style.display = "block";
  } catch (e) {
    alert(e.message);
    document.getElementById("col-results").style.display = "none";
  }
}
function calcSlab() {
  try {
    var r = StructuralScreeningEngine.calculateSlab({
      span: val("s-span"),
      liveLoad: val("s-live"),
      fcu: val("s-fcu"),
      finishLoad: val("s-finish"),
    });
    document.getElementById("slab-summary").innerHTML =
      '<div class="result-card highlight"><div class="result-label">Slab Thickness</div><div class="result-value">' +
      r.height +
      '<span class="result-unit"> mm</span></div></div><div class="result-card"><div class="result-label">Charger</div><div class="result-value">' +
      r.ultimateLoad.toFixed(1) +
      '<span class="result-unit"> kN/m2</span></div></div><div class="result-card"><div class="result-label">Moment</div><div class="result-value">' +
      r.M.toFixed(1) +
      '<span class="result-unit"> kNm/m</span></div></div><div class="result-card highlight"><div class="result-label">Main Acier Prompt</div><div class="result-value" style="font-size:1rem">' +
      r.barChoice +
      "</div></div>";
    document.getElementById("slab-table").innerHTML =
      "<tbody><tr><td>Self weight</td><td>" +
      r.sw.toFixed(1) +
      " kN/m2</td></tr><tr><td>Total dead load</td><td>" +
      r.gk.toFixed(1) +
      " kN/m2</td></tr><tr><td>Effective Profondeur</td><td>" +
      r.d +
      " mm</td></tr><tr><td>Required Acier</td><td>" +
      fmtNumber(r.AsDesign) +
      " mm2/m</td></tr><tr><td>Minimum Acier</td><td>" +
      fmtNumber(r.AsMin) +
      " mm2/m</td></tr></tbody>";
    document.getElementById("slab-cost").innerHTML = matCost(
      r.concreteM3PerM2,
      r.rebarKgPerM2,
      "Per m² of slab.",
    );
    document.getElementById("slab-results").style.display = "block";
  } catch (e) {
    alert(e.message);
    document.getElementById("slab-results").style.display = "none";
  }
}
function calcFooting() {
  try {
    var r = StructuralScreeningEngine.calculateFooting({
      load: val("f-load"),
      sbc: val("f-sbc"),
      fcu: val("f-fcu"),
      columnSize: val("f-colsize"),
    });
    document.getElementById("foot-summary").innerHTML =
      '<div class="result-card highlight"><div class="result-label">Footing Diamètre</div><div class="result-value">' +
      r.side +
      " x " +
      r.side +
      '<span class="result-unit"> mm</span></div></div><div class="result-card"><div class="result-label">Profondeur Prompt</div><div class="result-value">' +
      r.height +
      '<span class="result-unit"> mm</span></div></div><div class="result-card"><div class="result-label">Service Pressure</div><div class="result-value">' +
      r.servicePressure.toFixed(0) +
      '<span class="result-unit"> kN/m2</span></div></div><div class="result-card highlight"><div class="result-label">Reinforcement Prompt</div><div class="result-value" style="font-size:.9rem">' +
      r.barChoice +
      "</div></div>";
    document.getElementById("foot-table").innerHTML =
      "<tbody><tr><td>Charger</td><td>" +
      r.load +
      " kN</td></tr><tr><td>Bearing assumption</td><td>" +
      r.sbc +
      " kN/m2</td></tr><tr><td>Required Surface</td><td>" +
      r.areaReq.toFixed(2) +
      " m2</td></tr><tr><td>Provided Surface</td><td>" +
      r.actualArea.toFixed(2) +
      " m2</td></tr><tr><td>Cantilever prompt</td><td>" +
      (r.cantilever * 1000).toFixed(0) +
      " mm</td></tr><tr><td>Béton volume</td><td>" +
      r.concreteM3.toFixed(2) +
      " m3</td></tr></tbody>";
    document.getElementById("foot-cost").innerHTML = matCost(
      r.concreteM3,
      r.rebarKg,
      "Per footing pad.",
    );
    document.getElementById("foot-results").style.display = "block";
  } catch (e) {
    alert(e.message);
    document.getElementById("foot-results").style.display = "none";
  }
}

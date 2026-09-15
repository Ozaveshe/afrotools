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
    if (!output.error) { var labels = {"Long-span aluminium zinc sheet (0.55mm)":"Bac de couverture aluminium-zinc 0,55 mm","Aluminium sliding window (1500×1200mm)":"Fenêtre coulissante en aluminium 1 500 × 1 200 mm","Door hardware (hinges, locks, handles)":"Quincaillerie de porte : charnières, serrures et poignées","Kitchen sink (stainless, double bowl)":"Évier de cuisine double bac en inox","Steel security door (main entrance)":"Porte de sécurité en acier pour entrée principale","Floor tiles (600×600mm) – all areas":"Carrelage 600 × 600 mm pour toutes les surfaces","Wall tiles – wet areas (200×300mm)":"Faïence 200 × 300 mm pour zones humides","Gloss/trim paint – doors + windows":"Peinture de finition pour portes et fenêtres","Ceiling board (PVC or hardboard)":"Panneaux de plafond en PVC ou fibres dures","Excavation for strip foundation":"Fouilles pour semelles filantes","Hardcore fill (150mm compacted)":"Remblai compacté de 150 mm","Portland Cement (slab concrete)":"Ciment Portland pour béton de dalle","Wooden panel doors (900×2100mm)":"Portes intérieures en bois 900 × 2 100 mm","Render/plaster (interior walls)":"Enduit des murs intérieurs","Reinforcement steel (Y10, Y12)":"Acier d’armature Y10 et Y12","Reinforcement steel (Y12 slab)":"Acier d’armature Y12 pour dalle","Shower set (tray, mixer, head)":"Ensemble douche avec receveur, mitigeur et pommeau","Distribution board (8-way MCB)":"Tableau électrique à 8 disjoncteurs","MCB circuit breakers (various)":"Disjoncteurs modulaires","Cement (1:2:4 blinding, 50mm)":"Ciment pour béton de propreté 1:2:4, épaisseur 50 mm","Ring beam formwork + concrete":"Coffrage et béton du chaînage","Roofing screws (with washers)":"Vis de toiture avec rondelles","Plain screed (where no tiles)":"Chape simple dans les zones non carrelées","WC suite (pan, cistern, seat)":"Ensemble WC avec cuvette, réservoir et abattant","Inverter/UPS (2kVA) + battery":"Onduleur/UPS (2 kVA) et batterie","A. SUBSTRUCTURE (Foundation)":"A. INFRASTRUCTURE (fondations)","Hardwood rafters (50×100mm)":"Chevrons en bois dur 50 × 100 mm","Overhead water tank (1000L)":"Réservoir d’eau surélevé de 1 000 L","Ball float valve + fittings":"Robinet à flotteur et raccords","Hardwood rafters & battens":"Chevrons et liteaux en bois dur","Formwork (plywood + props)":"Coffrage en contreplaqué avec étais","PVC water supply pipe 32mm":"Canalisation d’alimentation PVC de 32 mm","B. SUPERSTRUCTURE (Walls)":"B. ÉLÉVATION (murs)","Emulsion paint – interior":"Peinture intérieure en émulsion","Tile adhesive (25kg bags)":"Colle à carrelage en sacs de 25 kg","Portland Cement (mortar)":"Ciment Portland pour mortier","Sharp Sand (wall mortar)":"Sable pour mortier de maçonnerie","Roofing felt / membrane":"Feutre ou membrane de toiture","Floor tiles (600×600mm)":"Carrelage de sol 600 × 600 mm","Socket outlets (double)":"Prises doubles","Light switches (single)":"Interrupteurs simples","Door frames (hardwood)":"Huisseries en bois dur","2.5mm² electrical wire":"Câble électrique de 2,5 mm²","Earth rod + earth wire":"Piquet et conducteur de terre","Ring beam steel (Y12)":"Acier Y12 pour chaînage","Tile grout (5kg bags)":"Joint de carrelage en sacs de 5 kg","Ridge cap / flashing":"Faîtière et solins","Glazed entrance door":"Porte d’entrée vitrée","PVC waste pipe 110mm":"Tuyau d’évacuation PVC de 110 mm","1.5mm² lighting wire":"Câble d’éclairage de 1,5 mm²","Per floor ring beam":"Par chaînage de niveau","Bathrooms + kitchen":"Salles d’eau et cuisine","D. DOORS & WINDOWS":"D. PORTES ET FENÊTRES","Water pump (0.5HP)":"Pompe à eau de 0,5 ch","Conduit (PVC 20mm)":"Gaine PVC de 20 mm","Foundation walling":"Maçonnerie de fondation","1200×2400mm sheets":"feuilles de 1 200 × 2 400 mm","Granite aggregate":"Granulats concassés","Foundation mortar":"Mortier de fondation","Standard internal":"Modèle intérieur standard","Standard casement":"Châssis standard","Lighting circuit":"Circuit d’éclairage","Earthing system":"Système de mise à la terre","G. ELECTRICAL":"G. ÉLECTRICITÉ","Foundation RC":"Béton armé de fondation","Mass concrete":"Béton de masse","Backup power":"Alimentation de secours","Front + back":"Avant et arrière","South Africa":"Afrique du Sud","E. FINISHES":"E. FINITIONS","F. PLUMBING":"F. PLOMBERIE","Ridge tiles":"Tuiles faîtières","Labour only":"Main-d’œuvre uniquement","Sharp Sand":"Sable","All floors":"Tous les niveaux","Ring main":"Circuit principal","Estimated":"Estimatif","Tanzania":"Tanzanie","Ethiopia":"Éthiopie","Cameroon":"Cameroun","finishes":"finitions","Senegal":"Sénégal","Morocco":"Maroc","C. ROOF":"C. TOITURE","Uganda":"Ouganda","Zambia":"Zambie","blocks":"blocs","sheets":"feuilles","Egypt":"Égypte","boxes":"boîtes","m run":"m lin.","bags":"sacs","sets":"ensembles","tins":"pots","pcs":"pièces"}; output.sections.forEach(function(section) { section.name = labels[section.name] || section.name; section.items.forEach(function(item) { item.description = labels[item.description] || item.description; item.note = labels[item.note] || item.note; }); }); }
    if (output.error) {
      showError(
        "Enter valid positive dimensions, quantities and Hypothèses before generating the BOQ.",
      );
      return null;
    }
    var code = output.country.currency,
      html =
        '<table class="boq-table"><thead><tr><th>#</th><th>Description</th><th class="right">Qté</th><th>Unité</th><th class="right">Prix unitaire (' +
        code +
        ')</th><th class="right">Montant (' +
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
          (item.amount ? fmt(item.amount) : "Main-d’œuvre") +
          "</td><td>" +
          escape(item.note) +
          "</td></tr>";
      });
    });
    html +=
      '<tr class="total-row"><td colspan="5">SOUS-TOTAL MATÉRIAUX</td><td class="right">' +
      code +
      " " +
      fmt(output.materialTotal) +
      '</td><td></td></tr><tr><td colspan="5">Main-d’œuvre (' +
      Math.round(output.country.labourRate * 100) +
      '% illustrative ratio)</td><td class="right">' +
      code +
      " " +
      fmt(output.labourCost) +
      '</td><td></td></tr><tr class="total-row"><td colspan="5">Total de planification (Main-d’œuvre + Imprévus)</td><td class="right">' +
      code +
      " " +
      fmt(output.grandTotal) +
      "</td><td></td></tr></tbody></table>";
    el("priceNote").removeAttribute("role");
    el("priceNote").textContent =
      "Embedded Q1 2025 rates are stale, unverified and low-confidence. Replace them with current supplier quotes and a Quantité surveyor's measured scope.";
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

(function (root) {
  "use strict";
  if (!document.body || document.body.getAttribute("data-fp-locale") !== "sw") return;
  var handled = new Set(["fpExportPdf", "fpExportPackPdf", "fpExportPng", "fpExportPlanPng", "fpBoqPdf", "fpBoqCsv", "fpBoqXlsx", "fpBoqPrintHtml", "fpCostJson", "fpCostPrint"]);
  var boqOpener = null;

  function escapeHtml(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) { return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[character]; }); }
  function slug(value) { return String(value || "ramani-ya-sakafu").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "ramani-ya-sakafu"; }
  function download(name, blob) { var link = document.createElement("a"); link.download = name; link.href = URL.createObjectURL(blob); document.body.appendChild(link); link.click(); setTimeout(function () { URL.revokeObjectURL(link.href); link.remove(); }, 1000); }
  function status(message) { var output = document.getElementById("fpExportProofStatus"); if (output) output.textContent = message; if (root.FPActionSafety && FPActionSafety.toast) FPActionSafety.toast("Faili imepakuliwa", message, "success"); }
  function packet() {
    if (!root.FPExportSuite || !FPExportSuite.buildExportPacket) throw new Error("Injini ya faili haijawa tayari.");
    var result = FPExportSuite.buildExportPacket();
    result.disclaimer = "Hiki ni kifurushi cha kupanga tu. Thibitisha vipimo, idhini, usanifu wa miundo, bei, kiasi na maelezo na mbunifu, mhandisi, QS, mkandarasi na mamlaka ya eneo kabla ya kujenga au kununua.";
    result.assumptions = ["Kiasi kimetokana na vyumba, kuta, milango na madirisha ya turubai hii.", "Bei ni makisio mbadala yanayoharirika; thibitisha bei za eneo.", "BOQ haichukui nafasi ya mchoro, ukaguzi au bei ya mkandarasi."];
    return result;
  }
  function rows(result) { return result.boq.items.map(function (item) { return { Kipengele:item.item, Kiasi:item.qty, Kipimo:item.unit, Bei:item.rate, Sarafu:result.currency, Jumla:item.amount, Chanzo:item.source, Onyo:item.warning }; }); }
  function csv(result) {
    var data = rows(result), headers = Object.keys(data[0] || { Kipengele:"", Kiasi:"", Kipimo:"", Bei:"", Sarafu:"", Jumla:"", Chanzo:"", Onyo:"" });
    return headers.join(",") + "\n" + data.map(function (row) { return headers.map(function (header) { var value = String(row[header] == null ? "" : row[header]); return /[",\n]/.test(value) ? '"' + value.replace(/"/g, '""') + '"' : value; }).join(","); }).join("\n");
  }
  function loadScript(test, source) {
    if (test()) return Promise.resolve();
    return new Promise(function (resolve, reject) { var script = document.createElement("script"); script.src = source; script.onload = function () { test() ? resolve() : reject(new Error("Maktaba haikuanza.")); }; script.onerror = function () { reject(new Error("Maktaba haikupakiwa.")); }; document.head.appendChild(script); });
  }
  function pdf(includeBoq, kind) {
    var result = packet();
    return loadScript(function () { return root.jspdf && root.jspdf.jsPDF; }, "/assets/vendor/jspdf/jspdf.umd.min.js").then(function () {
      var doc = new root.jspdf.jsPDF({ unit:"mm", format:"a4", orientation:"portrait" });
      var y = 15;
      var boqOnly = kind === "boq";
      doc.setFontSize(17); doc.text(boqOnly ? "AfroPlan - BOQ ya kupanga" : "AfroPlan - Kifurushi cha ramani na BOQ", 12, y); y += 8;
      doc.setFontSize(9); doc.text(result.projectTitle + " | " + result.country + " | " + result.currency, 12, y); y += 6;
      var width = 186, height = result.planCanvas.height / result.planCanvas.width * width; if (height > 88) { height = 88; width = result.planCanvas.width / result.planCanvas.height * height; }
      doc.addImage(result.planImage, "PNG", 12, y, width, height); y += height + 7;
      doc.setFontSize(11); doc.text("Muhtasari wa ramani", 12, y); y += 6; doc.setFontSize(8);
      ["Vyumba: " + result.openings.rooms, "Eneo la vyumba: " + result.openings.area.toFixed(1) + " m2", "Kuta: " + result.openings.walls, "Urefu wa kuta: " + result.openings.wallLength.toFixed(1) + " m", "Milango: " + result.openings.doors, "Madirisha: " + result.openings.windows].forEach(function (line) { doc.text(line, 14, y); y += 4.5; });
      if (includeBoq) {
        y += 2; doc.setFontSize(11); doc.text("Muhtasari wa BOQ", 12, y); y += 6; doc.setFontSize(8);
        result.boq.items.slice(0, 12).forEach(function (item) { if (y > 270) { doc.addPage(); y = 16; } doc.text(String(item.item).slice(0, 35) + " | " + item.qty + " " + item.unit + " | " + result.currency + " " + Math.round(item.amount), 14, y); y += 4.5; });
        doc.text("Jumla ya makadirio: " + result.currency + " " + Math.round(result.boq.total), 14, y + 2); y += 9;
      }
      doc.setFontSize(7); doc.splitTextToSize(result.disclaimer, 180).forEach(function (line) { if (y > 282) { doc.addPage(); y = 16; } doc.text(line, 12, y); y += 3.5; });
      doc.setProperties({ title: boqOnly ? "AfroPlan BOQ ya kupanga" : "AfroPlan Kifurushi cha ramani na BOQ", subject: result.disclaimer, creator:"AfroTools" });
      doc.save(slug(result.projectTitle) + (boqOnly ? "-boq.pdf" : "-kifurushi.pdf"));
      status(boqOnly ? "PDF ya BOQ imepakuliwa kwenye kifaa." : "Kifurushi cha PDF chenye ramani na BOQ kimepakuliwa kwenye kifaa.");
    });
  }
  function png() {
    var result = packet();
    return new Promise(function (resolve, reject) { result.planCanvas.toBlob(function (blob) { if (!blob) return reject(new Error("Picha haikutengenezwa.")); download(slug(result.projectTitle) + "-ramani.png", blob); status("PNG ya ramani imepakuliwa kwenye kifaa."); resolve(); }, "image/png"); });
  }
  function exportCsv() { var result = packet(); download(slug(result.projectTitle) + "-boq.csv", new Blob([csv(result)], { type:"text/csv;charset=utf-8" })); status("CSV ya BOQ imepakuliwa kwenye kifaa."); }
  function exportJson() { var result = packet(); var body = { schema:"afrotools-floor-plan-boq-sw-v1", plan:result.plan, country:result.country, currency:result.currency, rooms:result.rooms, openings:result.openings, boq:result.boq, assumptions:result.assumptions, disclaimer:result.disclaimer }; download(slug(result.projectTitle) + "-boq.json", new Blob([JSON.stringify(body, null, 2)], { type:"application/json" })); status("JSON ya BOQ imepakuliwa kwenye kifaa."); }
  function openBoq() {
    var result = packet(), modal = document.getElementById("fpCostModal"), content = document.getElementById("fpCostContent");
    if (!modal || !content) throw new Error("Paneli ya BOQ haikupatikana.");
    boqOpener = document.activeElement;
    var heading = modal.querySelector(".fp-modal-header h2"); if (heading) { heading.textContent = "BOQ na faili za ramani"; heading.id = "fpCostModalTitleSw"; }
    modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true"); modal.setAttribute("aria-labelledby", "fpCostModalTitleSw");
    content.innerHTML = '<div class="fp-boq-note">Kiasi kimetokana na ramani ya sasa. Bei ni makisio yanayoharirika; thibitisha na QS, msambazaji au mkandarasi kabla ya kununua.</div><div class="fp-cost-summary"><div class="fp-cost-card"><span class="fp-cost-card-label">Vifaa</span><span class="fp-cost-card-value">' + escapeHtml(result.currency) + ' ' + Math.round(result.boq.materials).toLocaleString("en-US") + '</span></div><div class="fp-cost-card"><span class="fp-cost-card-label">Kazi</span><span class="fp-cost-card-value">' + escapeHtml(result.currency) + ' ' + Math.round(result.boq.labour).toLocaleString("en-US") + '</span></div><div class="fp-cost-card fp-cost-total"><span class="fp-cost-card-label">Jumla ya makadirio</span><span class="fp-cost-card-value">' + escapeHtml(result.currency) + ' ' + Math.round(result.boq.total).toLocaleString("en-US") + '</span></div></div><div class="fp-boq-controls"><p>Pakua faili unayohitaji:</p><div><button type="button" id="fpBoqPdf" class="fp-act-btn">PDF</button> <button type="button" id="fpBoqCsv" class="fp-act-btn">CSV</button> <button type="button" id="fpBoqXlsx" class="fp-act-btn">XLSX</button> <button type="button" id="fpCostJson" class="fp-act-btn">JSON</button> <button type="button" id="fpBoqPrintHtml" class="fp-act-btn">HTML ya kuchapisha</button></div></div><p class="fp-cost-source">' + escapeHtml(result.disclaimer) + '</p>';
    modal.hidden = false; status("BOQ iko tayari. Chagua PDF, CSV, XLSX, JSON au HTML.");
    var first = content.querySelector("button"); if (first) window.setTimeout(function () { first.focus(); }, 0);
  }
  function xlsx() {
    var result = packet();
    return loadScript(function () { return !!root.XLSX; }, "/assets/vendor/xlsx/xlsx.full.min.js").then(function () {
      var book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(rows(result)), "BOQ");
      XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(result.rooms.map(function (room) { return { Chumba:room.name, Eneo_m2:room.area, Upana_m:room.width, Kina_m:room.depth }; })), "Vyumba");
      XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet([{ Kipimo:"Mradi", Thamani:result.projectTitle }, { Kipimo:"Nchi", Thamani:result.country }, { Kipimo:"Sarafu", Thamani:result.currency }, { Kipimo:"Jumla", Thamani:result.boq.total }, { Kipimo:"Tahadhari", Thamani:result.disclaimer }]), "Muhtasari");
      XLSX.writeFile(book, slug(result.projectTitle) + "-boq.xlsx"); status("XLSX ya BOQ imepakuliwa kwenye kifaa.");
    });
  }
  function html() {
    var result = packet();
    var table = rows(result).map(function (row) { return "<tr><td>" + escapeHtml(row.Kipengele) + "</td><td>" + row.Kiasi + "</td><td>" + escapeHtml(row.Kipimo) + "</td><td>" + result.currency + " " + Math.round(row.Jumla) + "</td></tr>"; }).join("");
    var content = '<!doctype html><html lang="sw"><head><meta charset="utf-8"><title>' + escapeHtml(result.projectTitle) + ' BOQ</title><style>body{font-family:Arial,sans-serif;margin:28px;color:#111827}img{max-width:100%;border:1px solid #ddd}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:7px;text-align:left}</style></head><body><h1>' + escapeHtml(result.projectTitle) + '</h1><p>' + escapeHtml(result.country) + ' | ' + escapeHtml(result.currency) + '</p><img alt="Ramani ya sakafu" src="' + result.planImage + '"><h2>BOQ ya kupanga</h2><table><thead><tr><th>Kipengele</th><th>Kiasi</th><th>Kipimo</th><th>Jumla</th></tr></thead><tbody>' + table + '</tbody></table><p><strong>Jumla ya makadirio: ' + result.currency + ' ' + Math.round(result.boq.total) + '</strong></p><p>' + escapeHtml(result.disclaimer) + '</p></body></html>';
    download(slug(result.projectTitle) + "-boq.html", new Blob([content], { type:"text/html;charset=utf-8" })); status("HTML ya BOQ imepakuliwa kwenye kifaa.");
  }

  function handle(event) {
    var button = event.target && event.target.closest && event.target.closest("button");
    if (!button) return;
    if (button.id !== "fpExportBoqData" && !handled.has(button.id)) return;
    event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
    // The English consumer layer owns pointerdown exports. Stop that handler here,
    // then perform the locale-specific action on click so pointer/keyboard paths agree.
    if (event.type === "pointerdown") return;
    if (button.id === "fpExportBoqData") { try { openBoq(); } catch (error) { if (root.FPActionSafety && FPActionSafety.toast) FPActionSafety.toast("BOQ haijafunguka", String(error.message || error), "error"); } return; }
    button.disabled = true; button.setAttribute("aria-busy", "true");
    var action = button.id === "fpExportPdf" || button.id === "fpExportPackPdf" ? pdf(true, "pack") : button.id === "fpBoqPdf" ? pdf(true, "boq") : button.id === "fpExportPng" || button.id === "fpExportPlanPng" ? png() : button.id === "fpBoqCsv" ? Promise.resolve(exportCsv()) : button.id === "fpBoqXlsx" ? xlsx() : button.id === "fpBoqPrintHtml" || button.id === "fpCostPrint" ? Promise.resolve(html()) : Promise.resolve(exportJson());
    Promise.resolve(action).catch(function (error) { if (root.FPActionSafety && FPActionSafety.toast) FPActionSafety.toast("Upakuaji umeshindwa", String(error && error.message || error), "error"); }).finally(function () { button.disabled = false; button.removeAttribute("aria-busy"); });
  }
  root.addEventListener("pointerdown", handle, true);
  root.addEventListener("click", handle, true);
  root.addEventListener("keydown", function (event) {
    var modal = document.getElementById("fpCostModal");
    if (event.key !== "Escape" || !modal || modal.hidden) return;
    modal.hidden = true;
    if (boqOpener && typeof boqOpener.focus === "function") boqOpener.focus();
  });

  root.FPSwahiliExport = { packet:packet, openBoq:openBoq, pdf:pdf, png:png, csv:exportCsv, json:exportJson, xlsx:xlsx, html:html };
})(window);

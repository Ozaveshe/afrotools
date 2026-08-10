(function (global) {
  "use strict";
  var root = document.querySelector("[data-certificate-maker-native]");
  if (!root) return;
  var canvas = root.querySelector("[data-certificate-canvas]");
  var ctx = canvas.getContext("2d");
  var status = root.querySelector("[data-status]");
  var fields = {
    recipient: root.querySelector('[name="recipient"]'), course: root.querySelector('[name="course"]'),
    date: root.querySelector('[name="date"]'), organization: root.querySelector('[name="organization"]')
  };
  var defaults = { recipient: "Amina Bello", course: "Tuzo za ufaulu wa sekondari", organization: "Shule ya Sekondari ya Jamii" };
  var selectedTemplate = "school-award";
  var templates = {
    "school-award": { title: "CHETI CHA UBORA", intro: "Tuzo hii inatolewa kwa fahari kwa", action: "kwa ufaulu bora katika", course: "Tuzo za ufaulu wa sekondari", organization: "Shule ya Sekondari ya Jamii" },
    bootcamp: { title: "CHETI CHA KUKAMILISHA", intro: "Hii inathibitisha kuwa", action: "amekamilisha kwa mafanikio", course: "Kundi la ujuzi wa kidijitali", organization: "AfroTools Academy" },
    "church-service": { title: "CHETI CHA HUDUMA", intro: "Cheti hiki kinamtambua", action: "kwa huduma ya uaminifu katika", course: "Uongozi wa vijana na mafunzo ya huduma", organization: "Kituo cha Uamsho wa Neema" },
    community: { title: "CHETI CHA SHUKRANI", intro: "Tunamheshimu na kumshukuru", action: "kwa mchango wake katika", course: "Mpango wa maendeleo ya jamii", organization: "Mtandao wa Athari za Jamii" }
  };
  function setStatus(message, state) { status.textContent = message; status.dataset.state = state || ""; }
  function wrap(text, x, y, maxWidth, lineHeight) {
    var words = String(text).trim().split(/\s+/); var line = "";
    words.forEach(function (word) { var trial = line ? line + " " + word : word; if (ctx.measureText(trial).width > maxWidth && line) { ctx.fillText(line, x, y); line = word; y += lineHeight; } else line = trial; });
    ctx.fillText(line, x, y); return y;
  }
  function formattedDate() {
    if (!fields.date.value) return "";
    var date = new Date(fields.date.value + "T00:00:00");
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("sw-TZ", { day: "numeric", month: "long", year: "numeric" });
  }
  function draw() {
    var template = templates[selectedTemplate]; var recipient = fields.recipient.value.trim() || "Jina la mpokeaji";
    var course = fields.course.value.trim() || "Kozi au tukio"; var organization = fields.organization.value.trim() || "Shirika lako";
    root.dataset.currentTemplate = selectedTemplate; canvas.setAttribute("aria-label", template.title + ": " + recipient + " — " + course);
    ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = "#fffaf0"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#9a6700"; ctx.lineWidth = 18; ctx.strokeRect(36, 36, 1328, 918); ctx.strokeStyle = "#d8bd7a"; ctx.lineWidth = 4; ctx.strokeRect(70, 70, 1260, 850);
    ctx.fillStyle = "rgba(154,103,0,.07)"; ctx.beginPath(); ctx.arc(700, 495, 320, 0, Math.PI * 2); ctx.fill(); ctx.textAlign = "center";
    ctx.fillStyle = "#9a6700"; ctx.font = "700 34px Arial, sans-serif"; ctx.fillText("AFROTOOLS", 700, 145);
    ctx.font = "700 62px Georgia, serif"; wrap(template.title, 700, 255, 1120, 68);
    ctx.fillStyle = "#475569"; ctx.font = "30px Arial, sans-serif"; ctx.fillText(template.intro, 700, 355);
    ctx.fillStyle = "#111827"; ctx.font = "700 70px Georgia, serif"; wrap(recipient, 700, 455, 1120, 74);
    ctx.fillStyle = "#475569"; ctx.font = "29px Arial, sans-serif"; ctx.fillText(template.action, 700, 565);
    ctx.fillStyle = "#111827"; ctx.font = "700 40px Arial, sans-serif"; wrap(course, 700, 635, 1060, 46);
    ctx.strokeStyle = "#9a6700"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(210, 800); ctx.lineTo(530, 800); ctx.moveTo(870, 800); ctx.lineTo(1190, 800); ctx.stroke();
    ctx.fillStyle = "#111827"; ctx.font = "700 25px Arial, sans-serif"; ctx.fillText(formattedDate(), 370, 845); ctx.fillText(organization, 1030, 845);
    ctx.fillStyle = "#64748b"; ctx.font = "20px Arial, sans-serif"; ctx.fillText("Tarehe", 370, 880); ctx.fillText("Shirika linalotoa", 1030, 880);
  }
  function validate() {
    var missing = [];
    if (!fields.recipient.value.trim()) missing.push("jina la mpokeaji"); if (!fields.course.value.trim()) missing.push("kozi au tukio"); if (!fields.organization.value.trim()) missing.push("shirika");
    if (!missing.length) return true;
    setStatus("Weka " + missing.join(", ") + " kabla ya kutengeneza au kupakua.", "error");
    var first = !fields.recipient.value.trim() ? fields.recipient : !fields.course.value.trim() ? fields.course : fields.organization; first.setAttribute("aria-invalid", "true"); first.focus(); return false;
  }
  function clearInvalid() { Object.keys(fields).forEach(function (key) { fields[key].removeAttribute("aria-invalid"); }); }
  function downloadBlob(blob, name) { var url = URL.createObjectURL(blob); var link = document.createElement("a"); link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 0); }
  root.querySelectorAll("[data-template]").forEach(function (button) {
    button.addEventListener("click", function () {
      root.querySelectorAll("[data-template]").forEach(function (node) { node.classList.remove("active"); node.setAttribute("aria-pressed", "false"); });
      var previous = templates[selectedTemplate]; var replaceCourse = !fields.course.value.trim() || fields.course.value === previous.course; var replaceOrganization = !fields.organization.value.trim() || fields.organization.value === previous.organization;
      selectedTemplate = button.dataset.template; button.classList.add("active"); button.setAttribute("aria-pressed", "true"); var template = templates[selectedTemplate];
      if (replaceCourse) fields.course.value = template.course; if (replaceOrganization) fields.organization.value = template.organization; clearInvalid(); draw(); setStatus("Kiolezo kimebadilishwa. Hakiki maelezo kabla ya kupakua.", "success");
    });
  });
  Object.keys(fields).forEach(function (key) { fields[key].addEventListener("input", function () { clearInvalid(); draw(); }); });
  root.querySelector("form").addEventListener("submit", function (event) { event.preventDefault(); if (!validate()) return; clearInvalid(); draw(); setStatus("Onyesho la cheti limesasishwa. Hakiki kila maelezo kabla ya kupakua.", "success"); });
  root.querySelector("[data-reset]").addEventListener("click", function () {
    selectedTemplate = "school-award"; root.querySelectorAll("[data-template]").forEach(function (node) { var active = node.dataset.template === selectedTemplate; node.classList.toggle("active", active); node.setAttribute("aria-pressed", String(active)); });
    fields.recipient.value = defaults.recipient; fields.course.value = defaults.course; fields.organization.value = defaults.organization; fields.date.value = new Date().toISOString().slice(0, 10); clearInvalid(); draw(); setStatus("Mfano umerejeshwa.", "success"); fields.recipient.focus();
  });
  root.querySelector("[data-png]").addEventListener("click", function () {
    if (!validate()) return; draw(); canvas.toBlob(function (blob) { if (!blob) { setStatus("PNG haikuweza kutengenezwa. Jaribu tena.", "error"); return; } downloadBlob(blob, "cheti.png"); setStatus("Cheti cha PNG cha pikseli 1400 × 990 kimepakuliwa.", "success"); }, "image/png");
  });
  root.querySelector("[data-pdf]").addEventListener("click", async function () {
    if (!validate()) return; if (!global.PDFLib) { setStatus("PDF haipatikani kwenye kivinjari hiki.", "error"); return; } draw();
    try { var pdf = await global.PDFLib.PDFDocument.create(); var image = await pdf.embedPng(canvas.toDataURL("image/png")); var page = pdf.addPage([1400, 990]); page.drawImage(image, { x: 0, y: 0, width: 1400, height: 990 }); var bytes = await pdf.save(); downloadBlob(new Blob([bytes], { type: "application/pdf" }), "cheti.pdf"); setStatus("Cheti cha PDF cha ukurasa mmoja kimepakuliwa.", "success"); }
    catch (_) { setStatus("PDF haikuweza kutengenezwa. Jaribu tena.", "error"); }
  });
  if (!fields.date.value) fields.date.value = new Date().toISOString().slice(0, 10); draw();
})(window);

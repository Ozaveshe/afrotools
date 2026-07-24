(function () {
  "use strict";
  var engine = window.AfroTools && window.AfroTools.cryptoScamEvidence;
  var form = document.getElementById("scamEvidenceForm");
  if (!engine || !form) return;

  var lang = document.documentElement.lang === "fr" ? "fr" : "en";
  var copy = lang === "fr" ? {
    ready:"Dossier organisé localement. Aucune donnée n’a quitté cet appareil.",
    invalid:"Vérifiez les champs. ",
    stale:"Le dossier affiché est périmé. Organisez-le de nouveau avant l’export.",
    created:"Export créé localement.",
    pdfMissing:"Le moteur PDF local est indisponible. Utilisez Imprimer / Enregistrer en PDF.",
    remove:"Supprimer", lossLabel:"Type de perte", amount:"Montant",
    started:"Dossier commencé", developing:"Dossier en cours", organized:"Dossier bien organisé",
    sections:"sections renseignées", redFlags:"signaux sélectionnés", evidence:"éléments de preuve", timeline:"repères chronologiques",
    losses:"pertes saisies", total:"Total saisi", noLoss:"Aucune perte chiffrée saisie",
    boundary:"Ce statut mesure uniquement la complétude du dossier. Il ne déclare jamais une personne, une adresse, une plateforme ou une transaction sûre, frauduleuse ou vérifiée.",
    privateTitle:"Dossier privé d’incident crypto", generated:"Créé localement",
    labels:{incident:"Libellé de l’incident",date:"Date",platform:"Plateforme ou service",contact:"Référence de contact",currency:"Devise d’affichage",flags:"Signaux sélectionnés",evidence:"Éléments de preuve",timeline:"Chronologie",losses:"Pertes saisies"}
  } : {
    ready:"Record organized locally. No data left this device.",
    invalid:"Check the fields. ",
    stale:"The displayed record is stale. Organize it again before exporting.",
    created:"Export created locally.",
    pdfMissing:"The local PDF engine is unavailable. Use Print / Save PDF.",
    remove:"Remove", lossLabel:"Loss type", amount:"Amount",
    started:"Record started", developing:"Record developing", organized:"Record well organized",
    sections:"sections completed", redFlags:"red flags selected", evidence:"evidence items", timeline:"timeline points",
    losses:"loss entries", total:"Entered total", noLoss:"No quantified loss entered",
    boundary:"This status measures record completeness only. It never declares a person, address, platform or transaction safe, fraudulent or verified.",
    privateTitle:"Private crypto incident evidence pack", generated:"Created locally",
    labels:{incident:"Incident label",date:"Date",platform:"Platform or service",contact:"Contact reference",currency:"Display currency",flags:"Selected red flags",evidence:"Evidence items",timeline:"Timeline",losses:"Entered losses"}
  };
  var result = null;
  var settling = false;
  var acceptedSignature = "";
  var output = document.getElementById("scamEvidenceResults");
  var status = document.getElementById("scamEvidenceStatus");
  var lossRows = document.getElementById("lossRows");
  var actionsContainer = document.querySelector(".scam-actions");
  var exports = Array.prototype.slice.call(document.querySelectorAll("[data-scam-export]"));

  function value(id) { return document.getElementById(id).value; }
  function setStatus(message, error) {
    status.textContent = message;
    status.classList.toggle("is-error", Boolean(error));
  }
  function enable(on) { exports.forEach(function (button) { button.disabled = !on; }); }
  function textNode(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = text;
    return node;
  }
  function addRow(label, amount) {
    if (lossRows.children.length >= engine.LIMITS.lossEntries) return;
    var row = document.createElement("div");
    row.className = "scam-loss-row";
    var labelInput = document.createElement("input");
    labelInput.type = "text"; labelInput.maxLength = engine.LIMITS.lossLabel;
    labelInput.placeholder = copy.lossLabel; labelInput.setAttribute("aria-label", copy.lossLabel);
    labelInput.value = label || "";
    var amountInput = document.createElement("input");
    amountInput.type = "number"; amountInput.min = "0"; amountInput.max = String(engine.LIMITS.lossAmount); amountInput.step = "any";
    amountInput.placeholder = copy.amount; amountInput.setAttribute("aria-label", copy.amount);
    amountInput.value = amount || "";
    var remove = document.createElement("button");
    remove.type = "button"; remove.className = "scam-row-remove"; remove.textContent = copy.remove;
    remove.addEventListener("click", function () { row.remove(); markStale(); });
    row.append(labelInput, amountInput, remove);
    lossRows.appendChild(row);
  }
  function input() {
    return {
      incidentLabel:value("incidentLabel"), incidentDate:value("incidentDate"),
      platform:value("platform"), contactReference:value("contactReference"),
      currency:value("currencyCode"),
      redFlags:Array.prototype.slice.call(form.querySelectorAll("[name=redFlag]:checked")).map(function (node) { return node.value; }),
      evidenceNotes:value("evidenceNotes"), timelineNotes:value("timelineNotes"),
      losses:Array.prototype.slice.call(lossRows.querySelectorAll(".scam-loss-row")).map(function (row) {
        var inputs = row.querySelectorAll("input");
        return { label:inputs[0].value, amount:inputs[1].value };
      })
    };
  }
  function signature() { return JSON.stringify(input()); }
  function formatMoney(number) {
    try {
      return new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en", {style:"currency",currency:result.record.currency,maximumFractionDigits:2}).format(number);
    } catch (_) { return result.record.currency + " " + Number(number).toFixed(2); }
  }
  function list(title, values) {
    var section = document.createElement("details");
    section.className = "scam-result-section";
    section.appendChild(textNode("summary", "", title + " (" + values.length + ")"));
    if (!values.length) section.appendChild(textNode("p", "scam-muted", "—"));
    else {
      var ul = document.createElement("ul");
      values.forEach(function (item) { ul.appendChild(textNode("li", "", item)); });
      section.appendChild(ul);
    }
    return section;
  }
  function render() {
    output.replaceChildren();
    var hero = document.createElement("div"); hero.className = "scam-result-hero";
    hero.appendChild(textNode("span", "scam-result-label", copy[result.status]));
    hero.appendChild(textNode("strong", "scam-result-value", result.completedSections + " / " + result.totalSections));
    hero.appendChild(textNode("span", "", copy.sections));
    output.appendChild(hero);
    var metrics = document.createElement("div"); metrics.className = "scam-metrics";
    [[result.redFlagCount,copy.redFlags],[result.evidenceCount,copy.evidence],[result.timelineCount,copy.timeline],[result.lossCount,copy.losses]].forEach(function (item) {
      var box=document.createElement("div"); box.append(textNode("strong","",String(item[0])),textNode("span","",item[1])); metrics.appendChild(box);
    });
    output.appendChild(metrics);
    output.appendChild(textNode("p","scam-boundary",copy.boundary));
    output.appendChild(actionsContainer);
    output.appendChild(list(copy.labels.flags,result.record.redFlags));
    output.appendChild(list(copy.labels.evidence,result.record.evidenceItems));
    output.appendChild(list(copy.labels.timeline,result.record.timelineItems));
    output.appendChild(textNode("p","scam-total",result.lossCount ? copy.total + ": " + formatMoney(result.record.totalLoss) : copy.noLoss));
  }
  function organize(event) {
    if (event) event.preventDefault();
    settling = true;
    delete output.dataset.resultSettled;
    if (!form.reportValidity()) { settling=false; setStatus(copy.invalid, true); return; }
    var delayedSettlement = false;
    try {
      result = engine.summarize(input());
      acceptedSignature = signature();
      render(); enable(true); setStatus(copy.ready, false);
      delete output.dataset.stale;
      if (window.innerWidth <= 780) {
        delayedSettlement = true;
        var navbar=document.querySelector("afro-navbar");
        var root=document.documentElement, previous=root.style.scrollBehavior;
        function alignResultStart() {
          root.style.scrollBehavior="auto";
          var navRectangle=navbar ? navbar.getBoundingClientRect() : {bottom:0,height:0};
          var targetBottom=Math.max(0,navRectangle.bottom,navRectangle.height)+10;
          window.scrollBy(0,output.getBoundingClientRect().top-targetBottom);
          root.style.scrollBehavior=previous;
        }
        alignResultStart();
        output.focus({preventScroll:true});
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () {
            alignResultStart();
            output.dataset.resultSettled="true";
            settling=false;
          });
        });
      } else {
        output.dataset.resultSettled = "true";
      }
    } catch (error) { delayedSettlement=false; acceptedSignature=""; result=null; enable(false); setStatus(copy.invalid+error.message,true); }
    if (!delayedSettlement) settling = false;
  }
  function markStale() {
    if (settling) return;
    if (!result) return;
    if (acceptedSignature && signature() === acceptedSignature) return;
    acceptedSignature="";
    result=null; delete output.dataset.resultSettled; output.dataset.stale="true";
    enable(false); setStatus(copy.stale,true);
  }
  function snapshot() {
    return {schemaVersion:1,tool:"crypto-scam-red-flag-evidence-pack",language:lang,createdAt:new Date().toISOString(),localOnly:true,assessment:"none",summary:result};
  }
  function download(name,type,content) {
    var url=URL.createObjectURL(new Blob([content],{type:type}));
    var anchor=document.createElement("a"); anchor.href=url; anchor.download=name; anchor.click();
    setTimeout(function(){URL.revokeObjectURL(url);},0); setStatus(copy.created,false);
  }
  function plainText() {
    var r=result.record, lines=[copy.privateTitle,copy.generated+": "+new Date().toISOString(),"",copy.labels.incident+": "+(r.incidentLabel||"—"),copy.labels.date+": "+(r.incidentDate||"—"),copy.labels.platform+": "+(r.platform||"—"),copy.labels.contact+": "+(r.contactReference||"—"),copy.labels.currency+": "+r.currency,"",copy.boundary,"",copy.labels.flags+":"].concat(r.redFlags.map(function(x){return "- "+x;}),["",copy.labels.evidence+":"],r.evidenceItems.map(function(x){return "- "+x;}),["",copy.labels.timeline+":"],r.timelineItems.map(function(x){return "- "+x;}),["",copy.labels.losses+":"],r.losses.map(function(x){return "- "+x.label+": "+x.amount+" "+r.currency;}),["",copy.total+": "+r.totalLoss+" "+r.currency]);
    lines[lines.length-1]=copy.total+": "+formatMoney(r.totalLoss);
    return lines.join("\n");
  }
  function pdf() {
    if (!window.jspdf || !window.jspdf.jsPDF) { setStatus(copy.pdfMissing,true); return; }
    var doc=new window.jspdf.jsPDF(), lines=doc.splitTextToSize(plainText(),180);
    doc.setFontSize(14); doc.text(copy.privateTitle,15,16); doc.setFontSize(9);
    var y=25; lines.slice(2).forEach(function(line){if(y>282){doc.addPage();y=16;}doc.text(String(line),15,y);y+=5;});
    doc.save("crypto-incident-evidence-pack.pdf"); setStatus(copy.created,false);
  }
  form.addEventListener("submit",organize);
  form.addEventListener("input",markStale);
  form.addEventListener("change",markStale);
  document.getElementById("addLossRow").addEventListener("click",function(){addRow();markStale();});
  exports.forEach(function(button){button.addEventListener("click",function(){
    if(!result)return; var action=button.getAttribute("data-scam-export");
    if(action==="json")download("crypto-incident-evidence-pack.json","application/json;charset=utf-8",JSON.stringify(snapshot(),null,2));
    else if(action==="txt")download("crypto-incident-evidence-pack.txt","text/plain;charset=utf-8",plainText());
    else if(action==="pdf")pdf(); else window.print();
  });});
  addRow();
})();

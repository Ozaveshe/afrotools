(function () {
  "use strict";
  var root = document.querySelector("[data-business-plan-draft]");
  var engine = window.AfroTools && window.AfroTools.BusinessPlanDraft;
  if (!root || !engine) return;
  var locale = root.dataset.locale || "en";
  var STORE = "afrotools:business-plan-draft:v1:" + locale;
  var SCHEMA = 1;
  var current = null;
  var currentInputStamp = "";

  var t = {
    en: {
      title: "Build your evidence-based draft", privacy: "Your business narrative and financial values stay in this browser. Nothing is saved unless you choose Save draft. On a shared device, export a backup and clear the local draft.",
      identity: "Business and evidence", finance: "Monthly financial scenario", name: "Business name", country: "Country or market", sector: "Sector", problem: "Problem to solve",
      customer: "Target customer", evidence: "Customer or market evidence", offer: "Offer and value proposition", channel: "Sales and delivery channels",
      operations: "Key operations and suppliers", team: "Team roles and capability", risks: "Key risks", mitigations: "Risk mitigations",
      milestones: "Next 90-day milestones", currency: "Display currency", revenue: "Expected monthly revenue", variable: "Monthly variable costs / COGS",
      fixed: "Monthly fixed operating costs", startup: "One-time startup need", working: "Working-capital need", funding: "Confirmed funding",
      change: "Low/high revenue change (%)", build: "Build draft", required: "Check the highlighted financial fields and enter a business name.",
      result: "Current draft", incomplete: "Completeness checklist", complete: "Provided", missing: "Still needed", scope: "Planning draft from user-entered evidence and assumptions. It is not lender approval, an official funding application, accounting advice or a guarantee.",
      contribution: "Gross contribution", profit: "Monthly operating profit", grossMargin: "Contribution margin", operatingMargin: "Operating margin",
      need: "Startup + working-capital need", gap: "Funding gap", surplus: "Funding surplus", breakEven: "Same-mix break-even revenue",
      payback: "Simple undiscounted payback", annual: "Annual same-month operating profit", months: "months", unavailable: "Unavailable",
      scenarios: "Low, base and high scenarios", scenario: "Scenario", low: "Low", base: "Base", high: "High",
      copy: "Copy summary", txt: "Download TXT", csv: "Download CSV", json: "Download JSON", pdf: "Download PDF", print: "Print",
      save: "Save draft", load: "Load saved draft", clear: "Clear saved draft", backup: "Download saved-draft JSON", import: "Import draft JSON",
      saved: "Draft saved only in this browser. Clear it before leaving a shared device.", loaded: "Saved draft loaded. Build the draft to create a current preview.",
      cleared: "Saved local draft cleared.", corrupt: "The saved draft is unreadable or from another schema. Clear it or import a valid backup.",
      imported: "Backup imported into the form but not saved. Build the draft, then save explicitly if wanted.", importBad: "That file is not a valid Business Plan Draft Workshop backup.",
      stale: "Inputs changed. Build the draft again before exporting or saving.", copied: "Summary copied.", pdfBad: "PDF support is unavailable. Use Print instead.",
      narrative: "Draft narrative", advanced: "Need a longer lender-ready document with templates and review? Use the advanced Business Plan app. Need registration steps? Use the Business Registration Planner."
    },
    fr: {
      title: "Construire un brouillon fondé sur des preuves", privacy: "Votre texte et vos chiffres restent dans ce navigateur. Rien n’est enregistré sans votre clic sur Enregistrer le brouillon. Sur un appareil partagé, exportez une sauvegarde puis effacez le brouillon local.",
      identity: "Entreprise et preuves", finance: "Scénario financier mensuel", name: "Nom de l’entreprise", country: "Pays ou marché", sector: "Secteur", problem: "Problème à résoudre",
      customer: "Client cible", evidence: "Preuves clients ou marché", offer: "Offre et proposition de valeur", channel: "Canaux de vente et livraison",
      operations: "Opérations et fournisseurs clés", team: "Rôles et capacités de l’équipe", risks: "Risques principaux", mitigations: "Mesures de réduction des risques",
      milestones: "Étapes des 90 prochains jours", currency: "Devise d’affichage", revenue: "Revenu mensuel prévu", variable: "Coûts variables / coût des ventes",
      fixed: "Coûts d’exploitation fixes mensuels", startup: "Besoin initial ponctuel", working: "Besoin en fonds de roulement", funding: "Financement confirmé",
      change: "Variation de revenu basse/haute (%)", build: "Construire le brouillon", required: "Vérifiez les champs financiers signalés et saisissez le nom de l’entreprise.",
      result: "Brouillon actuel", incomplete: "Liste de complétude", complete: "Fourni", missing: "À compléter", scope: "Brouillon de planification fondé sur vos preuves et hypothèses. Ce n’est ni une approbation de prêt, ni une demande officielle, ni un conseil comptable, ni une garantie.",
      contribution: "Contribution brute", profit: "Résultat d’exploitation mensuel", grossMargin: "Taux de contribution", operatingMargin: "Marge d’exploitation",
      need: "Besoin initial + fonds de roulement", gap: "Écart de financement", surplus: "Excédent de financement", breakEven: "CA au seuil à mix constant",
      payback: "Récupération simple non actualisée", annual: "Résultat annuel à mois constant", months: "mois", unavailable: "Indisponible",
      scenarios: "Scénarios bas, central et haut", scenario: "Scénario", low: "Bas", base: "Central", high: "Haut",
      copy: "Copier le résumé", txt: "Télécharger TXT", csv: "Télécharger CSV", json: "Télécharger JSON", pdf: "Télécharger PDF", print: "Imprimer",
      save: "Enregistrer le brouillon", load: "Charger le brouillon", clear: "Effacer le brouillon local", backup: "Télécharger la sauvegarde JSON", import: "Importer un brouillon JSON",
      saved: "Brouillon enregistré uniquement dans ce navigateur. Effacez-le avant de quitter un appareil partagé.", loaded: "Brouillon chargé. Construisez-le pour créer un aperçu actuel.",
      cleared: "Brouillon local effacé.", corrupt: "Le brouillon est illisible ou utilise un autre schéma. Effacez-le ou importez une sauvegarde valide.",
      imported: "Sauvegarde importée dans le formulaire, sans enregistrement. Construisez puis enregistrez explicitement si souhaité.", importBad: "Ce fichier n’est pas une sauvegarde valide de cet atelier.",
      stale: "Les données ont changé. Reconstruisez avant d’exporter ou d’enregistrer.", copied: "Résumé copié.", pdfBad: "Le PDF est indisponible. Utilisez Imprimer.",
      narrative: "Texte du brouillon", advanced: "Besoin d’un document bancaire plus long avec modèles et relecture ? Utilisez l’application avancée. Pour les étapes d’immatriculation, utilisez le planificateur d’enregistrement."
    },
    sw: {
      title: "Jenga rasimu inayotegemea ushahidi", privacy: "Maelezo na namba zako hubaki katika kivinjari hiki. Hakuna kinachohifadhiwa hadi uchague Hifadhi rasimu. Kwenye kifaa cha pamoja, pakua nakala kisha ufute rasimu ya kifaa.",
      identity: "Biashara na ushahidi", finance: "Makadirio ya fedha ya mwezi", name: "Jina la biashara", country: "Nchi au soko", sector: "Sekta", problem: "Tatizo linalotatuliwa",
      customer: "Mteja lengwa", evidence: "Ushahidi wa wateja au soko", offer: "Bidhaa/huduma na thamani", channel: "Njia za mauzo na usafirishaji",
      operations: "Operesheni na wasambazaji muhimu", team: "Majukumu na uwezo wa timu", risks: "Hatari kuu", mitigations: "Njia za kupunguza hatari",
      milestones: "Hatua za siku 90 zijazo", currency: "Sarafu ya kuonyesha", revenue: "Mapato yanayotarajiwa kwa mwezi", variable: "Gharama zinazobadilika / COGS",
      fixed: "Gharama za kudumu za mwezi", startup: "Mahitaji ya kuanzisha mara moja", working: "Mahitaji ya mtaji wa kuendesha", funding: "Fedha zilizothibitishwa",
      change: "Mabadiliko ya mapato ya chini/juu (%)", build: "Jenga rasimu", required: "Kagua sehemu za fedha zilizoonyeshwa na uweke jina la biashara.",
      result: "Rasimu ya sasa", incomplete: "Orodha ya ukamilifu", complete: "Imetolewa", missing: "Bado inahitajika", scope: "Rasimu ya kupanga kutoka ushahidi na makadirio uliyoingiza. Si idhini ya mkopo, ombi rasmi la ufadhili, ushauri wa uhasibu wala dhamana.",
      contribution: "Mchango ghafi", profit: "Faida ya uendeshaji ya mwezi", grossMargin: "Uwiano wa mchango", operatingMargin: "Ukingo wa uendeshaji",
      need: "Mahitaji ya kuanza + mtaji wa kuendesha", gap: "Pengo la ufadhili", surplus: "Ziada ya ufadhili", breakEven: "Mapato ya kutofanya hasara kwa mchanganyiko huohuo",
      payback: "Muda rahisi wa kurejesha bila discount", annual: "Faida ya mwaka kwa kurudia mwezi", months: "miezi", unavailable: "Haipatikani",
      scenarios: "Makadirio ya chini, msingi na juu", scenario: "Hali", low: "Chini", base: "Msingi", high: "Juu",
      copy: "Nakili muhtasari", txt: "Pakua TXT", csv: "Pakua CSV", json: "Pakua JSON", pdf: "Pakua PDF", print: "Chapisha",
      save: "Hifadhi rasimu", load: "Fungua rasimu iliyohifadhiwa", clear: "Futa rasimu ya kifaa", backup: "Pakua nakala ya JSON", import: "Ingiza rasimu ya JSON",
      saved: "Rasimu imehifadhiwa katika kivinjari hiki pekee. Ifute kabla ya kuondoka kwenye kifaa cha pamoja.", loaded: "Rasimu imefunguliwa. Ijenge ili kuunda mwonekano wa sasa.",
      cleared: "Rasimu ya kifaa imefutwa.", corrupt: "Rasimu haisomeki au ni ya schema nyingine. Ifute au ingiza nakala halali.",
      imported: "Nakala imeingizwa kwenye fomu bila kuhifadhiwa. Jenga rasimu kisha uhifadhi wazi ukitaka.", importBad: "Faili hii si nakala halali ya warsha hii.",
      stale: "Taarifa zimebadilika. Jenga tena kabla ya kupakua au kuhifadhi.", copied: "Muhtasari umenakiliwa.", pdfBad: "PDF haipatikani. Tumia Chapisha.",
      narrative: "Maelezo ya rasimu", advanced: "Unahitaji hati ndefu ya benki yenye violezo na ukaguzi? Tumia programu ya juu ya Mpango wa Biashara. Kwa hatua za usajili, tumia Mpangaji wa Usajili."
    }
  }[locale];

  var narrativeFields = ["name", "country", "sector", "problem", "customer", "evidence", "offer", "channel", "operations", "team", "risks", "mitigations", "milestones"];
  var financialFields = ["currency", "monthlyRevenue", "monthlyVariableCosts", "monthlyFixedCosts", "startupNeed", "workingCapitalNeed", "confirmedFunding", "scenarioChangePct"];
  var labels = { name:t.name,country:t.country,sector:t.sector,problem:t.problem,customer:t.customer,evidence:t.evidence,offer:t.offer,
    channel:t.channel,operations:t.operations,team:t.team,risks:t.risks,mitigations:t.mitigations,milestones:t.milestones,
    currency:t.currency,monthlyRevenue:t.revenue,monthlyVariableCosts:t.variable,monthlyFixedCosts:t.fixed,startupNeed:t.startup,
    workingCapitalNeed:t.working,confirmedFunding:t.funding,scenarioChangePct:t.change };

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { if (k === "class") n.className = attrs[k]; else n.setAttribute(k, attrs[k]); });
    if (text != null) n.textContent = text; return n;
  }
  function field(name, multiline) {
    var wrap = el("div", { class:"bpd-field" }), id = "bpd-" + name;
    var label = el("label", { for:id }, labels[name]);
    var attrs = { id:id, name:name, maxlength: multiline ? "4000" : "120" };
    var input = multiline ? el("textarea", attrs) : el("input", Object.assign(attrs, { type: financialFields.includes(name) && name !== "currency" ? "number" : "text" }));
    if (financialFields.includes(name) && name !== "currency") { input.min = "0"; input.max = name === "scenarioChangePct" ? "100" : String(engine.MAX_AMOUNT); input.step = name === "scenarioChangePct" ? "1" : "0.01"; input.inputMode = "decimal"; }
    if (name === "currency") input.value = root.dataset.currency || "KES";
    if (name === "scenarioChangePct") input.value = "20";
    wrap.append(label, input); return wrap;
  }
  function action(name, label, secondary) { return el("button", { type:"button", class:"bpd-button" + (secondary ? " bpd-button--secondary" : ""), "data-action":name }, label); }
  function build() {
    root.append(el("h2", {}, t.title), el("p", { class:"bpd-privacy" }, t.privacy));
    var form = el("form", { class:"bpd-form", novalidate:"" });
    var identity = el("fieldset", { class:"bpd-panel" }); identity.append(el("legend", {}, t.identity));
    var ng = el("div", { class:"bpd-grid" }); narrativeFields.forEach(function (name) { ng.append(field(name, !["name","country","sector"].includes(name))); }); identity.append(ng);
    var finance = el("fieldset", { class:"bpd-panel" }); finance.append(el("legend", {}, t.finance));
    var fg = el("div", { class:"bpd-grid bpd-grid--finance" }); financialFields.forEach(function (name) { fg.append(field(name, false)); }); finance.append(fg);
    var error = el("p", { class:"bpd-error", role:"alert", hidden:"", "data-error":"" });
    form.append(identity, finance, error, el("button", { type:"submit", class:"bpd-button bpd-build" }, t.build)); root.append(form);
    root.append(el("section", { class:"bpd-panel bpd-result", hidden:"", tabindex:"-1", "aria-live":"polite", "data-result":"" }));
    var drafts = el("section", { class:"bpd-panel bpd-drafts" }); drafts.append(el("h2", {}, t.save));
    var actions = el("div", { class:"bpd-actions" }); actions.append(action("load",t.load,true),action("clear",t.clear,true),action("backup",t.backup,true),action("import",t.import,true));
    var file = el("input", { type:"file", accept:"application/json,.json", hidden:"", "data-import":"" });
    drafts.append(actions,file,el("p",{role:"status","data-draft-status":""})); root.append(drafts);
  }
  function read() {
    var narrative = {}; narrativeFields.forEach(function (name) { narrative[name] = engine.cleanText(root.querySelector("[name="+name+"]").value, name === "name" ? 120 : 4000); });
    var finance = {}; financialFields.forEach(function (name) { finance[name] = root.querySelector("[name="+name+"]").value; });
    return { narrative:narrative, finance:finance };
  }
  function stamp(x) { return JSON.stringify(x); }
  function money(x, currency) { return x == null ? t.unavailable : currency + " " + Number(x).toLocaleString(locale,{maximumFractionDigits:2}); }
  function checklist(narrative) {
    return [
      { label:t.name, ok:!!narrative.name }, { label:t.problem, ok:!!narrative.problem }, { label:t.customer, ok:!!narrative.customer },
      { label:t.evidence, ok:!!narrative.evidence }, { label:t.offer, ok:!!narrative.offer }, { label:t.channel, ok:!!narrative.channel },
      { label:t.operations, ok:!!narrative.operations }, { label:t.team, ok:!!narrative.team }, { label:t.risks, ok:!!narrative.risks },
      { label:t.mitigations, ok:!!narrative.mitigations }, { label:t.milestones, ok:!!narrative.milestones }
    ];
  }
  function payload() {
    return { schemaVersion:SCHEMA, tool:"business-plan-builder", generatedAt:new Date().toISOString(), engineVersion:current.financial.version,
      scope:t.scope, narrative:current.narrative, financialInputs:current.financial.inputs, financialOutputs:current.financial.outputs,
      completeness:current.completeness, formulas:{
        grossContribution:"monthly revenue - monthly variable costs",
        operatingProfit:"gross contribution - monthly fixed operating costs",
        fundingGap:"max(startup need + working-capital need - confirmed funding, 0)",
        sameMixBreakEvenRevenue:"monthly fixed costs / contribution ratio, only when contribution ratio is positive",
        simplePaybackMonths:"(startup need + working-capital need) / positive monthly operating profit; undiscounted and not break-even",
        scenarios:"low/high revenue change with base variable-cost ratio held constant and fixed costs held constant"
      }, assumptions:current.financial.assumptions };
  }
  function summary() {
    var p=payload(), c=p.financialInputs.currency, o=p.financialOutputs;
    return [document.title,t.scope,t.name+": "+(p.narrative.name||t.missing),t.country+": "+(p.narrative.country||t.missing),
      t.contribution+": "+money(o.grossContribution,c),t.profit+": "+money(o.operatingProfit,c),t.gap+": "+money(o.fundingGap,c),
      t.breakEven+": "+money(o.breakEvenRevenue,c),t.payback+": "+(o.simplePaybackMonths==null?t.unavailable:o.simplePaybackMonths+" "+t.months)].join("\n");
  }
  function metric(grid,label,value) { var card=el("div",{class:"bpd-metric"}); card.append(el("span",{},label),el("strong",{},value)); grid.append(card); }
  function render() {
    var box=root.querySelector("[data-result]"), p=payload(), o=p.financialOutputs,c=p.financialInputs.currency; box.replaceChildren(el("h2",{},t.result),el("p",{class:"bpd-scope"},t.scope));
    var grid=el("div",{class:"bpd-metrics"}); metric(grid,t.contribution,money(o.grossContribution,c));metric(grid,t.profit,money(o.operatingProfit,c));
    metric(grid,t.grossMargin,o.grossMarginPct==null?t.unavailable:o.grossMarginPct+"%");metric(grid,t.operatingMargin,o.operatingMarginPct==null?t.unavailable:o.operatingMarginPct+"%");
    metric(grid,t.need,money(o.totalProjectNeed,c));metric(grid,t.gap,money(o.fundingGap,c));metric(grid,t.surplus,money(o.fundingSurplus,c));
    metric(grid,t.breakEven,money(o.breakEvenRevenue,c));metric(grid,t.payback,o.simplePaybackMonths==null?t.unavailable:o.simplePaybackMonths+" "+t.months);metric(grid,t.annual,money(o.annual.operatingProfit,c));box.append(grid);
    box.append(el("h3",{},t.incomplete));var ul=el("ul",{class:"bpd-checklist"});p.completeness.forEach(function(x){var li=el("li",{class:x.ok?"is-complete":"is-missing"});li.append(el("span",{},x.label),el("strong",{},x.ok?t.complete:t.missing));ul.append(li)});box.append(ul);
    box.append(el("h3",{},t.narrative));var dl=el("dl",{class:"bpd-narrative"});narrativeFields.forEach(function(name){dl.append(el("dt",{},labels[name]),el("dd",{},p.narrative[name]||t.missing))});box.append(dl);
    box.append(el("h3",{},t.scenarios));var wrap=el("div",{class:"bpd-table-wrap"}),table=el("table",{}),head=el("tr",{});
    [t.scenario,t.revenue,t.variable,t.fixed,t.profit].forEach(function(x){head.append(el("th",{scope:"col"},x))});var th=el("thead",{});th.append(head);table.append(th);var body=el("tbody",{});
    [["low",t.low],["base",t.base],["high",t.high]].forEach(function(row){var s=o.scenarios[row[0]],tr=el("tr",{});[row[1],money(s.revenue,c),money(s.variableCosts,c),money(s.fixedCosts,c),money(s.operatingProfit,c)].forEach(function(x){tr.append(el("td",{},x))});body.append(tr)});table.append(body);wrap.append(table);box.append(wrap);
    var actions=el("div",{class:"bpd-actions bpd-export-actions"});[["copy",t.copy],["txt",t.txt],["csv",t.csv],["json",t.json],["pdf",t.pdf],["print",t.print],["save",t.save]].forEach(function(x){actions.append(action(x[0],x[1],x[0]!=="save"))});box.append(actions,el("p",{role:"status","data-result-status":""}));box.hidden=false;document.body.classList.add("bpd-has-result");box.focus();
  }
  function safeCsv(value) { var s=String(value==null?"":value);if(/^[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'; }
  function download(name,type,content){var url=URL.createObjectURL(new Blob([content],{type:type})),a=el("a",{href:url,download:name});document.body.append(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},1000)}
  function csv() { var p=payload(),o=p.financialOutputs,c=p.financialInputs.currency,rows=[["Section","Metric","Value","Currency"],["Draft","Business name",p.narrative.name,""],
    ["Input","Monthly revenue",p.financialInputs.monthlyRevenue,c],["Input","Monthly variable costs",p.financialInputs.monthlyVariableCosts,c],["Input","Monthly fixed costs",p.financialInputs.monthlyFixedCosts,c],
    ["Output","Gross contribution",o.grossContribution,c],["Output","Operating profit",o.operatingProfit,c],["Output","Funding gap",o.fundingGap,c],["Output","Same-mix break-even revenue",o.breakEvenRevenue,c],
    ["Output","Simple undiscounted payback months",o.simplePaybackMonths,""],["Method","Engine version",p.engineVersion,""],["Method","Scope",p.scope,""],
    ["Formula","Operating profit",p.formulas.operatingProfit,""],["Formula","Break-even",p.formulas.sameMixBreakEvenRevenue,""]];
    download("sme-business-plan-financials.csv","text/csv;charset=utf-8","\ufeff"+rows.map(function(r){return r.map(safeCsv).join(",")}).join("\n"));
  }
  function savedRead(){try{var x=JSON.parse(localStorage.getItem(STORE)||"null");return x&&x.schemaVersion===SCHEMA&&x.tool==="business-plan-builder"&&x.form?x:null}catch(_){return null}}
  function fill(data){if(!data||!data.narrative||!data.finance)return false;narrativeFields.forEach(function(n){root.querySelector("[name="+n+"]").value=String(data.narrative[n]||"")});financialFields.forEach(function(n){root.querySelector("[name="+n+"]").value=String(data.finance[n]??"")});current=null;document.body.classList.remove("bpd-has-result");root.querySelector("[data-result]").hidden=true;return true}
  function draftEnvelope(){var x=read();return{schemaVersion:SCHEMA,tool:"business-plan-builder",locale:locale,savedAt:new Date().toISOString(),form:x}}
  function stale(){if(!current||stamp(read())===currentInputStamp)return false;current=null;document.body.classList.remove("bpd-has-result");root.querySelector("[data-result]").hidden=true;var e=root.querySelector("[data-error]");e.hidden=false;e.textContent=t.stale;return true}
  build();
  root.addEventListener("input",stale);
  root.addEventListener("submit",function(event){event.preventDefault();var input=read(),financial=engine.calculate(input.finance),error=root.querySelector("[data-error]");if(!input.narrative.name||!financial.valid){error.hidden=false;error.textContent=t.required;return}error.hidden=true;current={narrative:input.narrative,financial:financial,completeness:checklist(input.narrative)};currentInputStamp=stamp(input);render()});
  root.addEventListener("click",function(event){var b=event.target.closest("[data-action]");if(!b)return;var a=b.dataset.action,status=root.querySelector("[data-draft-status]");
    if(a==="load"){var s=savedRead();if(!s){status.textContent=t.corrupt;return}fill(s.form);status.textContent=t.loaded}
    else if(a==="clear"){localStorage.removeItem(STORE);status.textContent=t.cleared}
    else if(a==="backup"){var d=savedRead();if(!d){status.textContent=t.corrupt;return}download("sme-business-plan-saved-draft.json","application/json",JSON.stringify(d,null,2))}
    else if(a==="import")root.querySelector("[data-import]").click();
    else if(!current||stale())return;
    else if(a==="save"){localStorage.setItem(STORE,JSON.stringify(draftEnvelope()));root.querySelector("[data-result-status]").textContent=t.saved}
    else if(a==="copy")navigator.clipboard.writeText(summary()).then(function(){root.querySelector("[data-result-status]").textContent=t.copied});
    else if(a==="txt")download("sme-business-plan-draft.txt","text/plain;charset=utf-8",summary()+"\n\n"+narrativeFields.map(function(n){return labels[n]+": "+(current.narrative[n]||t.missing)}).join("\n"))
    else if(a==="csv")csv();else if(a==="json")download("sme-business-plan-draft.json","application/json",JSON.stringify(payload(),null,2));else if(a==="print")window.print();
    else if(a==="pdf"){if(!window.jspdf||!window.jspdf.jsPDF){root.querySelector("[data-result-status]").textContent=t.pdfBad;return}var doc=new window.jspdf.jsPDF(),p=payload(),text=summary()+"\n\n"+t.narrative+"\n"+narrativeFields.map(function(n){return labels[n]+": "+(p.narrative[n]||t.missing)}).join("\n")+"\n\nFormulas\n"+Object.values(p.formulas).join("\n");var lines=doc.splitTextToSize(text,175),y=18;lines.forEach(function(line){if(y>280){doc.addPage();y=18}doc.text(line,18,y);y+=6});doc.save("sme-business-plan-draft.pdf")}
  });
  root.querySelector("[data-import]").addEventListener("change",function(){var file=this.files&&this.files[0],status=root.querySelector("[data-draft-status]");if(!file)return;var reader=new FileReader();reader.onload=function(){try{var d=JSON.parse(String(reader.result));if(d.schemaVersion!==SCHEMA||d.tool!=="business-plan-builder"||!fill(d.form))throw new Error("bad");status.textContent=t.imported}catch(_){status.textContent=t.importBad}};reader.readAsText(file);this.value=""});
})();

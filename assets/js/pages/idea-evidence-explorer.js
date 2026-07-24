(function () {
  "use strict";
  var root = document.querySelector("[data-idea-evidence-explorer]");
  var engine = window.AfroTools && window.AfroTools.IdeaEvidenceExplorer;
  if (!root || !engine) return;

  var locale = root.dataset.locale === "fr" ? "fr" : "en";
  var STORE = "afrotools:idea-evidence-shortlist:v1";
  var currentRows = [];
  var shortlist = [];
  var requestController = null;
  var requestNumber = 0;
  var currentPage = 1;
  var lastTrigger = null;
  var dialogReturnFocus = null;

  var countries = [
    ["NG","Nigeria"],["KE","Kenya"],["ZA","South Africa"],["GH","Ghana"],["ET","Ethiopia"],["EG","Egypt"],["TZ","Tanzania"],["UG","Uganda"],["RW","Rwanda"],["SN","Senegal"],["CI","Côte d’Ivoire"],["CM","Cameroon"],["CD","DR Congo"],["MZ","Mozambique"],["MA","Morocco"],["AO","Angola"],["MG","Madagascar"],["MW","Malawi"],["ZM","Zambia"],["ZW","Zimbabwe"],["ML","Mali"],["BF","Burkina Faso"],["NE","Niger"],["TD","Chad"],["GN","Guinea"],["BJ","Benin"],["TG","Togo"],["SL","Sierra Leone"],["LR","Liberia"],["MR","Mauritania"],["ER","Eritrea"],["GM","Gambia"],["BW","Botswana"],["NA","Namibia"],["GA","Gabon"],["LS","Lesotho"],["GW","Guinea-Bissau"],["GQ","Equatorial Guinea"],["MU","Mauritius"],["SZ","Eswatini"],["DJ","Djibouti"],["CV","Cabo Verde"],["CF","Central African Republic"],["CG","Republic of the Congo"],["KM","Comoros"],["ST","São Tomé and Príncipe"],["SC","Seychelles"],["SD","Sudan"],["SS","South Sudan"],["SO","Somalia"],["LY","Libya"],["TN","Tunisia"],["DZ","Algeria"],["BI","Burundi"]
  ];
  var sectorNames = {
    transportation:["Transportation","Transport"], agriculture:["Agriculture","Agriculture"], food:["Food and beverage","Alimentation"], technology:["Technology","Technologie"],
    retail:["Retail and e-commerce","Commerce"], fintech:["Financial services","Services financiers"], construction:["Construction and property","Construction et immobilier"],
    health:["Health and wellness","Santé et bien-être"], education:["Education and training","Éducation et formation"], energy:["Energy and utilities","Énergie"],
    fashion:["Fashion and textiles","Mode et textile"], tourism:["Tourism and hospitality","Tourisme et hôtellerie"], media:["Media and creative","Médias et création"],
    manufacturing:["Manufacturing","Fabrication"], services:["Professional services","Services professionnels"], mining:["Mining and resources","Mines et ressources"],
    beauty:["Beauty and personal care","Beauté et soins"], logistics:["Warehousing and supply chain","Logistique"], waste:["Waste and recycling","Déchets et recyclage"],
    telecom:["Telecommunications","Télécommunications"]
  };
  var t = {
    en:{
      title:"Explore submitted business-idea evidence", intro:"Filter the available records, inspect their assumptions and compare up to six ideas locally. Cost, revenue and break-even values are submitted planning estimates—not verified returns, prices or guarantees.",
      privacy:"Search requests use the AfroTools public idea dataset. Your shortlist stays only in this browser after you explicitly add an idea. Nothing is sent to an AI service.",
      country:"Country", sector:"Sector", allSectors:"All sectors", risk:"Risk label", allRisks:"All risk labels", budget:"Maximum starting-cost estimate", search:"Idea name", sort:"Sort records",
      fastest:"Lowest submitted break-even", lowest:"Lowest submitted starting cost", revenue:"Highest submitted monthly revenue", newest:"Newest record",
      find:"Search evidence records", retry:"Retry search", initial:"Choose filters, then run Search evidence records. No data request is made before you ask.", loading:"Loading evidence records…", offline:"You appear to be offline. Reconnect, then retry.", timeout:"The data service did not respond in time. Retry when your connection is stable.",
      error:"The evidence records are unavailable. No result has been invented. Retry later.", empty:"No normalized evidence records matched these filters.", found:"normalized records displayed on this page", reported:"dataset matches reported before normalization", changed:"Filters changed. Run the search again.",
      estimate:"Submitted planning estimate", unavailable:"Not supplied", startup:"Starting cost", monthly:"Monthly revenue", breakeven:"Break-even", months:"months", details:"Inspect evidence", add:"Add to local shortlist", remove:"Remove",
      sourceYes:"Source supplied", sourceNo:"Source not supplied", confidence:"Confidence", asOf:"As of", updated:"Record updated", description:"Description", rationale:"Local rationale", model:"Revenue model", risks:"Submitted risks", cities:"Suggested cities",
      close:"Close details", shortlist:"Local shortlist and comparison", shortlistIntro:"Explicitly add up to six records. This may contain commercially sensitive planning choices; clear it before leaving a shared device.",
      shortlistEmpty:"No ideas have been added.", maximum:"The shortlist is limited to six ideas.", saved:"Shortlist saved only in this browser.", cleared:"Local shortlist cleared.", corrupt:"The saved shortlist is unreadable or from another schema. Clear it or import a valid backup.",
      backup:"Download shortlist JSON backup", import:"Import shortlist JSON", clear:"Clear shortlist", copy:"Copy comparison", txt:"Download TXT", csv:"Download CSV", json:"Download full JSON", pdf:"Download PDF", print:"Print",
      imported:"Backup imported and explicitly saved in this browser.", importBad:"That file is not a valid Idea Evidence Explorer backup.", copied:"Comparison copied.", pdfBad:"PDF support is unavailable. Use Print instead.",
      tableIdea:"Idea", tableCountry:"Country", tableSector:"Sector", source:"Source and freshness", scope:"Dataset records contain submitted planning estimates. AfroTools has not verified profitability, demand, costs, break-even or regulatory suitability.",
      links:"Continue carefully", draft:"Turn selected evidence into a business-plan draft", registration:"Check registration and licensing planning"
    },
    fr:{
      title:"Explorer les preuves soumises pour des idées d’entreprise", intro:"Filtrez les fiches disponibles, examinez leurs hypothèses et comparez jusqu’à six idées localement. Les coûts, revenus et délais sont des estimations soumises—pas des rendements, prix ou garanties vérifiés.",
      privacy:"La recherche interroge le jeu public AfroTools. Votre sélection reste uniquement dans ce navigateur après un ajout explicite. Aucun texte n’est envoyé à un service d’IA.",
      country:"Pays", sector:"Secteur", allSectors:"Tous les secteurs", risk:"Niveau de risque déclaré", allRisks:"Tous les niveaux", budget:"Coût initial maximal estimé", search:"Nom de l’idée", sort:"Trier les fiches",
      fastest:"Délai déclaré le plus court", lowest:"Coût initial déclaré le plus bas", revenue:"Revenu mensuel déclaré le plus élevé", newest:"Fiche la plus récente",
      find:"Rechercher les fiches", retry:"Réessayer", initial:"Choisissez les filtres puis lancez la recherche. Aucune requête de données n’est faite avant votre action.", loading:"Chargement des fiches…", offline:"Vous semblez hors ligne. Reconnectez-vous puis réessayez.", timeout:"Le service n’a pas répondu à temps. Réessayez avec une connexion stable.",
      error:"Les fiches sont indisponibles. Aucun résultat n’a été inventé. Réessayez plus tard.", empty:"Aucune fiche normalisée ne correspond à ces filtres.", found:"fiches normalisées affichées sur cette page", reported:"correspondances signalées par le jeu avant normalisation", changed:"Filtres modifiés. Relancez la recherche.",
      estimate:"Estimation de planification soumise", unavailable:"Non fourni", startup:"Coût initial", monthly:"Revenu mensuel", breakeven:"Délai d’équilibre", months:"mois", details:"Examiner les preuves", add:"Ajouter à la sélection locale", remove:"Retirer",
      sourceYes:"Source fournie", sourceNo:"Source non fournie", confidence:"Confiance", asOf:"À la date du", updated:"Fiche mise à jour", description:"Description", rationale:"Justification locale", model:"Modèle de revenus", risks:"Risques soumis", cities:"Villes suggérées",
      close:"Fermer les détails", shortlist:"Sélection locale et comparaison", shortlistIntro:"Ajoutez explicitement jusqu’à six fiches. Ces choix peuvent être commercialement sensibles; effacez-les avant de quitter un appareil partagé.",
      shortlistEmpty:"Aucune idée ajoutée.", maximum:"La sélection est limitée à six idées.", saved:"Sélection enregistrée uniquement dans ce navigateur.", cleared:"Sélection locale effacée.", corrupt:"La sélection est illisible ou utilise un autre schéma. Effacez-la ou importez une sauvegarde valide.",
      backup:"Télécharger la sauvegarde JSON", import:"Importer une sauvegarde JSON", clear:"Effacer la sélection", copy:"Copier la comparaison", txt:"Télécharger TXT", csv:"Télécharger CSV", json:"Télécharger le JSON complet", pdf:"Télécharger PDF", print:"Imprimer",
      imported:"Sauvegarde importée et explicitement enregistrée dans ce navigateur.", importBad:"Ce fichier n’est pas une sauvegarde valide de l’Explorateur.", copied:"Comparaison copiée.", pdfBad:"Le PDF est indisponible. Utilisez Imprimer.",
      tableIdea:"Idée", tableCountry:"Pays", tableSector:"Secteur", source:"Source et fraîcheur", scope:"Les fiches contiennent des estimations de planification soumises. AfroTools n’a pas vérifié la rentabilité, la demande, les coûts, le délai d’équilibre ni l’adéquation réglementaire.",
      links:"Continuer avec prudence", draft:"Transformer la sélection en brouillon de business plan", registration:"Préparer l’immatriculation et les licences"
    }
  }[locale];

  function el(tag, attrs, value) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === "class") node.className = attrs[key];
      else if (key === "hidden") node.hidden = !!attrs[key];
      else node.setAttribute(key, attrs[key]);
    });
    if (value != null) node.textContent = value;
    return node;
  }
  function button(action, label, secondary) { return el("button", { type:"button", class:"iee-button" + (secondary ? " iee-button--secondary" : ""), "data-action":action }, label); }
  function option(value, label) { return el("option", { value:value }, label); }
  function field(label, control) { var wrap=el("label",{class:"iee-field"});wrap.append(el("span",{},label),control);return wrap; }
  function money(pair, currency) {
    if (!pair || pair.min == null) return t.unavailable;
    var formatter = new Intl.NumberFormat(locale, { maximumFractionDigits:2 });
    var prefix = currency ? currency + " " : "";
    return pair.max == null || pair.min === pair.max ? prefix + formatter.format(pair.min) : prefix + formatter.format(pair.min) + " – " + formatter.format(pair.max);
  }
  function sectorLabel(value) { return sectorNames[value] ? sectorNames[value][locale === "fr" ? 1 : 0] : value; }
  function formatDate(value) { return value ? new Intl.DateTimeFormat(locale,{dateStyle:"medium"}).format(new Date(value)) : t.unavailable; }
  function status(message, state) {
    var node = root.querySelector("[data-status]");
    node.className = "iee-status is-" + (state || "info");
    node.textContent = message;
  }
  function download(name, type, content) {
    var url=URL.createObjectURL(new Blob([content],{type:type})), a=el("a",{href:url,download:name});
    document.body.append(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},1000);
  }
  function safeCsv(value) { var s=String(value==null?"":value);if(/^[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'; }

  function build() {
    root.append(el("h2",{},t.title),el("p",{class:"iee-lede"},t.intro),el("p",{class:"iee-privacy"},t.privacy));
    var form=el("form",{class:"iee-search","data-search-form":"",novalidate:""});
    var country=el("select",{name:"country",id:"iee-country"});countries.forEach(function(c){country.append(option(c[0],c[1]))});
    var sector=el("select",{name:"sector",id:"iee-sector"});sector.append(option("",t.allSectors));engine.SECTORS.forEach(function(s){sector.append(option(s,sectorLabel(s)))});
    var risk=el("select",{name:"risk",id:"iee-risk"});risk.append(option("",t.allRisks),option("low","Low / Faible"),option("medium","Medium / Moyen"),option("high","High / Élevé"));
    var budget=el("input",{name:"budget",id:"iee-budget",type:"number",inputmode:"decimal",min:"0",max:String(engine.MAX_AMOUNT),step:"0.01"});
    var search=el("input",{name:"query",id:"iee-query",type:"search",maxlength:"100",autocomplete:"off"});
    var sort=el("select",{name:"sort",id:"iee-sort"});sort.append(option("breakeven",t.fastest),option("cost",t.lowest),option("revenue",t.revenue),option("newest",t.newest));
    var grid=el("div",{class:"iee-filter-grid"});grid.append(field(t.country,country),field(t.sector,sector),field(t.risk,risk),field(t.budget,budget),field(t.search,search),field(t.sort,sort));
    form.append(grid,el("button",{type:"submit",class:"iee-button"},t.find));root.append(form);
    var results=el("section",{class:"iee-results","aria-labelledby":"iee-results-title"});
    results.append(el("div",{class:"iee-results-head"},null),el("div",{role:"status","aria-live":"polite","data-status":""}),el("div",{class:"iee-card-grid","data-cards":""}),el("div",{class:"iee-pagination","data-pagination":""}));
    results.querySelector(".iee-results-head").append(el("h2",{id:"iee-results-title"},t.find),button("retry",t.retry,true));
    root.append(results);
    var local=el("section",{class:"iee-shortlist","aria-labelledby":"iee-shortlist-title"});
    local.append(el("h2",{id:"iee-shortlist-title"},t.shortlist),el("p",{},t.shortlistIntro),el("div",{class:"iee-compare","data-shortlist":""}));
    var actions=el("div",{class:"iee-actions"});[["backup",t.backup],["import",t.import],["clear",t.clear],["copy",t.copy],["txt",t.txt],["csv",t.csv],["json",t.json],["pdf",t.pdf],["print",t.print]].forEach(function(a){actions.append(button(a[0],a[1],true))});
    local.append(actions,el("input",{type:"file",accept:"application/json,.json",hidden:true,"data-import":""}),el("p",{role:"status","aria-live":"polite","data-local-status":""}));
    root.append(local);
    var links=el("section",{class:"iee-next"});links.append(el("h2",{},t.links),el("a",{href:"/tools/business-plan-builder/"},t.draft),el("a",{href:"/tools/business-planner/"},t.registration));root.append(links);
    var overlay=el("div",{class:"iee-dialog-backdrop",hidden:true,"data-dialog-backdrop":""});
    var dialog=el("section",{class:"iee-dialog",role:"dialog","aria-modal":"true","aria-labelledby":"iee-dialog-title",tabindex:"-1","data-dialog":""});
    dialog.append(button("close-dialog",t.close,true),el("div",{"data-dialog-content":""}));overlay.append(dialog);document.body.append(overlay);
  }
  function readFilters() {
    var form=root.querySelector("[data-search-form]");
    return {country:form.country.value,sector:form.sector.value,risk:form.risk.value,maxBudget:form.budget.value,search:form.query.value,sort:form.sort.value,page:currentPage};
  }
  function setState(message, state) {
    root.querySelector("[data-cards]").replaceChildren();
    root.querySelector("[data-pagination]").replaceChildren();
    status(message,state);
  }
  function evidenceLabel(row) {
    if (!row.source.name && !row.source.url && !row.source.asOf && !row.source.confidence) return t.sourceNo;
    var parts=[t.sourceYes];
    if(row.source.asOf)parts.push(t.asOf+" "+formatDate(row.source.asOf));
    if(row.source.confidence)parts.push(t.confidence+": "+row.source.confidence);
    return parts.join(" · ");
  }
  function metric(label, value) { var node=el("div",{class:"iee-metric"});node.append(el("span",{},label),el("strong",{},value),el("small",{},t.estimate));return node; }
  function card(row) {
    var article=el("article",{class:"iee-card","data-id":row.id});
    var head=el("div",{class:"iee-card-head"});head.append(el("span",{class:"iee-sector"},sectorLabel(row.sector)),el("span",{class:"iee-risk"},row.risk));
    article.append(head,el("h3",{},row.name),el("p",{class:"iee-country"},row.countryName || row.countryCode));
    var metrics=el("div",{class:"iee-metrics"});metrics.append(metric(t.startup,money(row.startupCost,row.currency)),metric(t.monthly,money(row.monthlyRevenue,row.currency)),metric(t.breakeven,row.breakevenMonths.min==null?t.unavailable:money(row.breakevenMonths,"")+" "+t.months));article.append(metrics);
    article.append(el("p",{class:"iee-source"},evidenceLabel(row)));
    var actions=el("div",{class:"iee-card-actions"});actions.append(button("details:"+row.id,t.details,true),button("add:"+row.id,t.add,false));article.append(actions);return article;
  }
  function renderRows(result) {
    currentRows=result.rows;
    var countText=result.rows.length+" "+t.found;
    if(Number.isFinite(result.total))countText+=" · "+result.total+" "+t.reported;
    status(countText,"ready");
    var grid=root.querySelector("[data-cards]");grid.replaceChildren();currentRows.forEach(function(row){grid.append(card(row))});
    var pager=root.querySelector("[data-pagination]");pager.replaceChildren();
    if(currentPage>1)pager.append(button("page:"+(currentPage-1),"←",true));
    if(result.total>currentPage*24)pager.append(button("page:"+(currentPage+1),"→",true));
  }
  async function search() {
    if(requestController)requestController.abort();
    requestController=new AbortController();var token=++requestNumber;setState(t.loading,"loading");
    var result=await engine.search(readFilters(),{signal:requestController.signal,timeoutMs:8000});
    if(token!==requestNumber||result.state==="aborted")return;
    if(result.ok&&result.state==="ready")renderRows(result);
    else if(result.ok)setState(t.empty,"empty");
    else setState(t[result.state]||t.error,result.state||"error");
  }
  function findRow(id) { return currentRows.concat(shortlist).find(function(row){return row.id===id}) || null; }
  function openDialog(row, trigger) {
    var overlay=document.querySelector("[data-dialog-backdrop]"),content=overlay.querySelector("[data-dialog-content]");content.replaceChildren();
    content.append(el("h2",{id:"iee-dialog-title"},row.name),el("p",{class:"iee-scope"},t.scope));
    var metrics=el("div",{class:"iee-metrics"});metrics.append(metric(t.startup,money(row.startupCost,row.currency)),metric(t.monthly,money(row.monthlyRevenue,row.currency)),metric(t.breakeven,row.breakevenMonths.min==null?t.unavailable:money(row.breakevenMonths,"")+" "+t.months));content.append(metrics);
    [[t.description,row.description],[t.rationale,row.whyAfrica],[t.model,row.revenueModel],[t.risks,row.risks.join(" · ")],[t.cities,row.bestCities.join(" · ")]].forEach(function(pair){if(pair[1]){content.append(el("h3",{},pair[0]),el("p",{},pair[1]))}});
    content.append(el("h3",{},t.source),el("p",{},evidenceLabel(row)));
    if(row.source.url){var a=el("a",{href:row.source.url,target:"_blank",rel:"noopener noreferrer"},row.source.name||row.source.url);content.append(a)}
    if(row.updatedAt)content.append(el("p",{},t.updated+": "+formatDate(row.updatedAt)));
    dialogReturnFocus=trigger;overlay.hidden=false;document.body.classList.add("iee-dialog-open");overlay.querySelector("[data-action=close-dialog]").focus();
  }
  function closeDialog() { var overlay=document.querySelector("[data-dialog-backdrop]");overlay.hidden=true;document.body.classList.remove("iee-dialog-open");if(dialogReturnFocus&&dialogReturnFocus.isConnected)dialogReturnFocus.focus();dialogReturnFocus=null; }
  function trap(event) {
    var overlay=document.querySelector("[data-dialog-backdrop]");if(overlay.hidden)return;
    if(event.key==="Escape"){event.preventDefault();closeDialog();return}
    if(event.key!=="Tab")return;var focusable=Array.from(overlay.querySelectorAll("button,a[href],[tabindex]:not([tabindex='-1'])")).filter(function(n){return !n.disabled&&!n.hidden});
    if(!focusable.length)return;var first=focusable[0],last=focusable[focusable.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  }
  function storeShortlist(message) {
    try{localStorage.setItem(STORE,JSON.stringify(engine.shortlistEnvelope(shortlist,locale)));root.querySelector("[data-local-status]").textContent=message||t.saved}catch(_){root.querySelector("[data-local-status]").textContent=t.corrupt}
  }
  function readStored() {
    try{var raw=localStorage.getItem(STORE);if(!raw)return[];var valid=engine.validateEnvelope(JSON.parse(raw));if(!valid)throw new Error("bad");return valid.items}catch(_){root.querySelector("[data-local-status]").textContent=t.corrupt;return[]}
  }
  function renderShortlist() {
    var box=root.querySelector("[data-shortlist]");box.replaceChildren();document.body.classList.toggle("iee-has-shortlist",shortlist.length>0);if(!shortlist.length){box.append(el("p",{class:"iee-empty"},t.shortlistEmpty));return}
    var wrap=el("div",{class:"iee-table-wrap"}),table=el("table",{}),head=el("tr",{});
    [t.tableIdea,t.tableCountry,t.tableSector,t.startup,t.monthly,t.breakeven,t.source,""].forEach(function(label){head.append(el("th",{scope:"col"},label))});
    var thead=el("thead",{});thead.append(head);table.append(thead);var body=el("tbody",{});
    shortlist.forEach(function(row){var tr=el("tr",{});[row.name,row.countryName||row.countryCode,sectorLabel(row.sector),money(row.startupCost,row.currency),money(row.monthlyRevenue,row.currency),row.breakevenMonths.min==null?t.unavailable:money(row.breakevenMonths,"")+" "+t.months,evidenceLabel(row)].forEach(function(value){tr.append(el("td",{},value))});var td=el("td",{});td.append(button("remove:"+row.id,t.remove,true));tr.append(td);body.append(tr)});
    table.append(body);wrap.append(table);
    var cards=el("div",{class:"iee-compare-cards"});
    shortlist.forEach(function(row){
      var card=el("article",{class:"iee-compare-card"});
      card.append(el("h3",{},row.name));
      [
        [t.tableCountry,row.countryName||row.countryCode],
        [t.tableSector,sectorLabel(row.sector)],
        [t.startup,money(row.startupCost,row.currency)],
        [t.monthly,money(row.monthlyRevenue,row.currency)],
        [t.breakeven,row.breakevenMonths.min==null?t.unavailable:money(row.breakevenMonths,"")+" "+t.months],
        [t.source,evidenceLabel(row)]
      ].forEach(function(item){var line=el("div",{class:"iee-compare-row"});line.append(el("span",{},item[0]),el("strong",{},item[1]));card.append(line)});
      card.append(button("remove:"+row.id,t.remove,true));cards.append(card);
    });
    box.append(wrap,cards);
  }
  function exportPayload() { return {schemaVersion:engine.SCHEMA_VERSION,tool:"idea-board",generatedAt:new Date().toISOString(),scope:t.scope,items:shortlist}; }
  function summary() { return [document.title,t.scope].concat(shortlist.map(function(row,i){return (i+1)+". "+row.name+" | "+(row.countryName||row.countryCode)+" | "+sectorLabel(row.sector)+" | "+t.startup+": "+money(row.startupCost,row.currency)+" | "+t.monthly+": "+money(row.monthlyRevenue,row.currency)+" | "+t.breakeven+": "+(row.breakevenMonths.min==null?t.unavailable:money(row.breakevenMonths,"")+" "+t.months)+" | "+evidenceLabel(row)})).join("\n"); }
  function exportCsv() {
    var rows=[[t.tableIdea,t.tableCountry,t.tableSector,t.startup+" min",t.startup+" max","Currency",t.monthly+" min",t.monthly+" max",t.breakeven+" min",t.breakeven+" max","Source","Source URL","As of","Confidence"]];
    shortlist.forEach(function(r){rows.push([r.name,r.countryName||r.countryCode,sectorLabel(r.sector),r.startupCost.min,r.startupCost.max,r.currency,r.monthlyRevenue.min,r.monthlyRevenue.max,r.breakevenMonths.min,r.breakevenMonths.max,r.source.name,r.source.url,r.source.asOf,r.source.confidence])});
    download("african-business-idea-comparison.csv","text/csv;charset=utf-8","\ufeff"+rows.map(function(row){return row.map(safeCsv).join(",")}).join("\n"));
  }
  function exportPdf() {
    if(!window.jspdf||!window.jspdf.jsPDF){root.querySelector("[data-local-status]").textContent=t.pdfBad;return}
    var doc=new window.jspdf.jsPDF(),lines=doc.splitTextToSize(summary(),175),y=18;lines.forEach(function(line){if(y>280){doc.addPage();y=18}doc.text(line,18,y);y+=6});doc.save("african-business-idea-comparison.pdf");
  }

  build();shortlist=readStored();renderShortlist();status(t.initial,"idle");
  root.querySelector("[data-search-form]").addEventListener("submit",function(event){event.preventDefault();currentPage=1;search()});
  root.querySelector("[data-search-form]").addEventListener("input",function(){if(requestController)requestController.abort();requestNumber+=1;status(t.changed,"stale")});
  root.addEventListener("click",function(event){
    var trigger=event.target.closest("[data-action]");if(!trigger)return;var action=trigger.dataset.action;
    if(action==="retry"){search();return}
    if(action.indexOf("page:")===0){currentPage=Number(action.split(":")[1]);search();return}
    if(action.indexOf("details:")===0){var detail=findRow(action.slice(8));if(detail)openDialog(detail,trigger);return}
    if(action.indexOf("add:")===0){var add=findRow(action.slice(4));if(!add)return;if(shortlist.some(function(r){return r.id===add.id}))return;if(shortlist.length>=6){root.querySelector("[data-local-status]").textContent=t.maximum;return}shortlist.push(add);storeShortlist();renderShortlist();return}
    if(action.indexOf("remove:")===0){shortlist=shortlist.filter(function(r){return r.id!==action.slice(7)});storeShortlist();renderShortlist();return}
    if(action==="import"){root.querySelector("[data-import]").click();return}
    if(action==="clear"){localStorage.removeItem(STORE);shortlist=[];renderShortlist();root.querySelector("[data-local-status]").textContent=t.cleared;return}
    if(action==="close-dialog"){closeDialog();return}
    if(!shortlist.length){root.querySelector("[data-local-status]").textContent=t.shortlistEmpty;return}
    if(action==="backup")download("african-business-idea-shortlist-backup.json","application/json",JSON.stringify(engine.shortlistEnvelope(shortlist,locale),null,2));
    else if(action==="copy")navigator.clipboard.writeText(summary()).then(function(){root.querySelector("[data-local-status]").textContent=t.copied});
    else if(action==="txt")download("african-business-idea-comparison.txt","text/plain;charset=utf-8",summary());
    else if(action==="csv")exportCsv();
    else if(action==="json")download("african-business-idea-comparison.json","application/json",JSON.stringify(exportPayload(),null,2));
    else if(action==="pdf")exportPdf();
    else if(action==="print")window.print();
  });
  root.querySelector("[data-import]").addEventListener("change",function(){var file=this.files&&this.files[0],statusNode=root.querySelector("[data-local-status]");if(!file)return;var reader=new FileReader();reader.onload=function(){try{var valid=engine.validateEnvelope(JSON.parse(String(reader.result)));if(!valid)throw new Error("bad");shortlist=valid.items;storeShortlist(t.imported);renderShortlist()}catch(_){statusNode.textContent=t.importBad}};reader.readAsText(file);this.value=""});
  document.querySelector("[data-dialog-backdrop]").addEventListener("click",function(event){if(event.target===this)closeDialog()});
  document.addEventListener("keydown",trap);
  window.addEventListener("online",function(){status(t.changed,"stale")});
  window.addEventListener("offline",function(){if(requestController)requestController.abort();requestNumber+=1;setState(t.offline,"offline")});
})();

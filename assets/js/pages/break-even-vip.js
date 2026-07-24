(function () {
  "use strict";

  var COPY = {
    en: {
      title: "Break-even planner", lead: "Separate the exact threshold from the whole units you must actually sell, using only the costs and price you enter.",
      unit: "Currency or unit label (optional)", fixed: "Fixed costs", price: "Selling price per unit", variable: "Variable cost per unit",
      planned: "Planned units (optional)", target: "Target profit (optional)", calculate: "Calculate break-even",
      exactUnits: "Exact break-even units", wholeUnits: "Whole units to sell", exactRevenue: "Exact threshold revenue",
      wholeRevenue: "Revenue at whole units", contribution: "Contribution per unit", ratio: "Contribution ratio",
      profit: "Profit/loss at planned units", safety: "Margin of safety", targetUnits: "Whole units for target profit",
      pdf: "Download local PDF", csv: "Download formula-safe CSV", print: "Print",
      scenario: "Compare your own scenario", scenarioHelp: "Enter only the values you want to compare with the base result.",
      label: "Scenario label", compare: "Compare scenario", base: "Base", ready: "Result updated locally.", scenarioReady: "Scenario compared locally.",
      error: "Enter valid non-negative costs. Selling price must be greater than zero and greater than variable cost.",
      boundary: "Calculation boundary", b1: "Exact units can include a fraction. Whole units are rounded up because a unit normally cannot be partly sold.",
      b2: "Exact threshold revenue equals fixed costs divided by the contribution ratio. Revenue at whole units can be slightly higher.",
      b3: "The optional currency or unit is display-only. No conversion, VAT, tax, market rate, benchmark, demand forecast or pricing recommendation is supplied.",
      b4: "Calculations and downloads stay in this browser. Nothing is automatically saved or sent to a server.",
      formula: "Exact units = fixed costs / (selling price - variable cost). Exact revenue = fixed costs / contribution ratio.",
      unavailable: "Not applicable with zero planned units", notEntered: "Not entered", report: "Report a calculation error"
    },
    fr: {
      title: "Planificateur du seuil de rentabilité", lead: "Distinguez le seuil exact des unités entières à vendre, uniquement avec vos coûts et votre prix.",
      unit: "Devise ou unité d’affichage (facultatif)", fixed: "Charges fixes", price: "Prix de vente unitaire", variable: "Coût variable unitaire",
      planned: "Unités prévues (facultatif)", target: "Bénéfice cible (facultatif)", calculate: "Calculer le seuil",
      exactUnits: "Unités exactes au seuil", wholeUnits: "Unités entières à vendre", exactRevenue: "Chiffre d’affaires exact au seuil",
      wholeRevenue: "Chiffre d’affaires aux unités entières", contribution: "Marge contributive unitaire", ratio: "Taux de contribution",
      profit: "Bénéfice/perte aux unités prévues", safety: "Marge de sécurité", targetUnits: "Unités entières pour le bénéfice cible",
      pdf: "Télécharger le PDF local", csv: "Télécharger le CSV sécurisé", print: "Imprimer",
      scenario: "Comparer votre propre scénario", scenarioHelp: "Saisissez seulement les valeurs à comparer au résultat de base.",
      label: "Nom du scénario", compare: "Comparer", base: "Base", ready: "Résultat mis à jour localement.", scenarioReady: "Scénario comparé localement.",
      error: "Saisissez des coûts valides et non négatifs. Le prix doit être positif et supérieur au coût variable.",
      boundary: "Périmètre du calcul", b1: "Les unités exactes peuvent comporter une fraction. Les unités entières sont arrondies au supérieur.",
      b2: "Le chiffre d’affaires exact est égal aux charges fixes divisées par le taux de contribution. Celui des unités entières peut être légèrement supérieur.",
      b3: "La devise ou unité sert uniquement à l’affichage. Aucun change, TVA, impôt, taux, benchmark, prévision de demande ou conseil de prix n’est fourni.",
      b4: "Les calculs et téléchargements restent dans ce navigateur. Rien n’est enregistré automatiquement ni envoyé à un serveur.",
      formula: "Unités exactes = charges fixes / (prix - coût variable). Chiffre d’affaires exact = charges fixes / taux de contribution.",
      unavailable: "Non applicable avec zéro unité prévue", notEntered: "Non saisi", report: "Signaler une erreur de calcul"
    },
    sw: {
      title: "Mpangaji wa kizingiti cha faida", lead: "Tenganisha kizingiti halisi na vitengo kamili vya kuuza kwa gharama na bei unazoingiza tu.",
      unit: "Sarafu au jina la kitengo (si lazima)", fixed: "Gharama za kudumu", price: "Bei ya kuuza kwa kitengo", variable: "Gharama inayobadilika kwa kitengo",
      planned: "Vitengo vilivyopangwa (si lazima)", target: "Faida lengwa (si lazima)", calculate: "Kokotoa kizingiti",
      exactUnits: "Vitengo halisi vya kizingiti", wholeUnits: "Vitengo kamili vya kuuza", exactRevenue: "Mapato halisi ya kizingiti",
      wholeRevenue: "Mapato kwa vitengo kamili", contribution: "Mchango kwa kitengo", ratio: "Uwiano wa mchango",
      profit: "Faida/hasara kwa vitengo vilivyopangwa", safety: "Umbali wa usalama", targetUnits: "Vitengo kamili kwa faida lengwa",
      pdf: "Pakua PDF ya ndani", csv: "Pakua CSV salama", print: "Chapisha",
      scenario: "Linganisha hali yako", scenarioHelp: "Ingiza thamani unazotaka kulinganisha na matokeo ya msingi.",
      label: "Jina la hali", compare: "Linganisha", base: "Msingi", ready: "Matokeo yamesasishwa ndani ya kivinjari.", scenarioReady: "Hali imelinganishwa ndani ya kivinjari.",
      error: "Ingiza gharama halali zisizo hasi. Bei lazima izidi sifuri na gharama inayobadilika.",
      boundary: "Mipaka ya hesabu", b1: "Vitengo halisi vinaweza kuwa na sehemu. Vitengo kamili huzungushwa juu kwa sababu kwa kawaida huwezi kuuza sehemu ya kitengo.",
      b2: "Mapato halisi ni gharama za kudumu zilizogawanywa kwa uwiano wa mchango. Mapato ya vitengo kamili yanaweza kuwa juu kidogo.",
      b3: "Sarafu au kitengo ni cha kuonyesha tu. Hakuna ubadilishaji, VAT, kodi, kiwango cha soko, benchmark, utabiri wa mahitaji au ushauri wa bei.",
      b4: "Hesabu na vipakuliwa hubaki kwenye kivinjari hiki. Hakuna kinachohifadhiwa kiotomatiki au kutumwa kwa seva.",
      formula: "Vitengo halisi = gharama za kudumu / (bei - gharama inayobadilika). Mapato halisi = gharama za kudumu / uwiano wa mchango.",
      unavailable: "Haitumiki kwa vitengo sifuri vilivyopangwa", notEntered: "Haijaingizwa", report: "Ripoti hitilafu ya hesabu"
    },
    ha: {
      title: "Mai tsara adadin dawo da jari", lead: "Bambanta adadi na ainihi da cikakkun kayayyakin da za a sayar, ta amfani da kuɗi da farashin da ka shigar kawai.",
      unit: "Sunan kuɗi ko awo (na zaɓi)", fixed: "Kuɗin dindindin", price: "Farashin sayarwa ga kowane kaya", variable: "Kuɗin da ke canzawa ga kowane kaya",
      planned: "Adadin da aka tsara (na zaɓi)", target: "Ribar da ake so (na zaɓi)", calculate: "Lissafa dawo da jari",
      exactUnits: "Adadin ainihi na dawo da jari", wholeUnits: "Cikakken adadin da za a sayar", exactRevenue: "Kuɗin shiga na ainihi",
      wholeRevenue: "Kuɗin shiga a cikakken adadi", contribution: "Gudummawa ga kowane kaya", ratio: "Kason gudummawa",
      profit: "Riba/asara a adadin da aka tsara", safety: "Tazarar tsaro", targetUnits: "Cikakken adadi don ribar da ake so",
      pdf: "Sauke PDF na cikin na’ura", csv: "Sauke CSV mai aminci", print: "Buga",
      scenario: "Kwatanta yanayinka", scenarioHelp: "Shigar da ƙimomin da kake son kwatantawa da sakamakon asali.",
      label: "Sunan yanayi", compare: "Kwatanta", base: "Asali", ready: "An sabunta sakamako a cikin burauza.", scenarioReady: "An kwatanta yanayi a cikin burauza.",
      error: "Shigar da kuɗi masu inganci marasa ƙasa da sifili. Farashin sayarwa dole ya fi sifili kuma ya fi kuɗin da ke canzawa.",
      boundary: "Iyakar lissafi", b1: "Adadin ainihi na iya samun kaso. Ana ɗaga cikakken adadi sama saboda ba a saba sayar da rabin kaya ba.",
      b2: "Kuɗin shiga na ainihi shi ne kuɗin dindindin da aka raba da kason gudummawa. Na cikakken adadi na iya ɗan fi shi.",
      b3: "Sunan kuɗi ko awo na nuna suna kawai. Babu canji, VAT, haraji, farashin kasuwa, benchmark, hasashen buƙata ko shawarar farashi.",
      b4: "Lissafi da saukewa suna cikin wannan burauza. Ba a adana komai kai tsaye ko aika shi zuwa uwar garke.",
      formula: "Adadin ainihi = kuɗin dindindin / (farashin sayarwa - kuɗin da ke canzawa). Kuɗin shiga na ainihi = kuɗin dindindin / kason gudummawa.",
      unavailable: "Ba ya aiki idan adadin da aka tsara sifili ne", notEntered: "Ba a shigar ba", report: "Kai rahoton kuskuren lissafi"
    }
  };

  function init() {
    var engine = window.AfroTools && window.AfroTools.BreakEvenPlanner;
    var main = document.querySelector("main[data-break-even-app]");
    if (!engine || !main) return;
    var locale = (document.documentElement.lang || "en").slice(0, 2);
    if (!COPY[locale]) locale = "en";
    var c = COPY[locale];
    var state = { result: null, scenario: null };

    main.innerHTML = '<div class="bev-shell"><section class="bev-hero"><div class="bev-kicker">Local-first · formula-only</div><h1>'+c.title+'</h1><p>'+c.lead+'</p></section><div class="bev-grid"><section class="bev-card"><form id="beForm" novalidate><div class="bev-fields">'+
      field("beUnit",c.unit,"text","",false)+field("beFixed",c.fixed,"number","0",true)+field("bePrice",c.price,"number","",true)+field("beVariable",c.variable,"number","0",true)+field("bePlanned",c.planned,"number","",false)+field("beTarget",c.target,"number","",false)+
      '</div><button class="bev-button bev-primary" type="submit">'+c.calculate+'</button><p class="bev-error" id="beError" role="alert"></p><div class="bev-status" id="beStatus" role="status" aria-live="polite"></div></form>'+
      '<section class="bev-result" id="beResult" aria-label="Break-even result"><dl class="bev-metrics">'+metric("beExactUnits",c.exactUnits)+metric("beWholeUnits",c.wholeUnits)+metric("beExactRevenue",c.exactRevenue)+metric("beWholeRevenue",c.wholeRevenue)+metric("beContribution",c.contribution)+metric("beRatio",c.ratio)+metric("beProfit",c.profit)+metric("beSafety",c.safety)+metric("beTargetUnits",c.targetUnits)+'</dl><p class="bev-note">'+c.formula+'</p><div class="bev-actions"><button class="bev-button" id="bePdf" type="button">'+c.pdf+'</button><button class="bev-button" id="beCsv" type="button">'+c.csv+'</button><button class="bev-button" id="bePrint" type="button">'+c.print+'</button></div></section>'+
      '<section class="bev-section"><h2>'+c.scenario+'</h2><p class="bev-note">'+c.scenarioHelp+'</p><form id="beScenarioForm" novalidate><div class="bev-fields">'+field("beScenarioLabel",c.label,"text","",false)+field("beScenarioFixed",c.fixed,"number","",false)+field("beScenarioPrice",c.price,"number","",false)+field("beScenarioVariable",c.variable,"number","",false)+field("beScenarioPlanned",c.planned,"number","",false)+'</div><button class="bev-button" type="submit">'+c.compare+'</button></form><div class="bev-table-wrap"><table class="bev-table" id="beScenarioTable" hidden><thead><tr><th>'+c.label+'</th><th>'+c.wholeUnits+'</th><th>'+c.exactRevenue+'</th><th>'+c.profit+'</th><th>'+c.safety+'</th></tr></thead><tbody></tbody></table></div></section></section>'+
      '<aside class="bev-card" data-tool-verification-panel data-tool-id="break-even"><h2>'+c.boundary+'</h2><ul class="bev-list"><li>'+c.b1+'</li><li>'+c.b2+'</li><li>'+c.b3+'</li><li>'+c.b4+'</li></ul><p class="bev-formula">'+c.formula+'</p><p><a href="mailto:hello@afrotools.com?subject=Break-even%20calculation%20error">'+c.report+'</a></p></aside></div></div>';

    function field(id, label, type, value, required) {
      var attrs = type === "number" ? ' step="any" inputmode="decimal" min="0"' : ' maxlength="40" autocomplete="off"';
      return '<label class="bev-field" for="'+id+'">'+label+'<input class="bev-input" id="'+id+'" type="'+type+'" value="'+value+'"'+attrs+(required?' required':'')+'></label>';
    }
    function metric(id, label) { return '<div class="bev-metric"><dt>'+label+'</dt><dd id="'+id+'"></dd></div>'; }
    function el(id) { return document.getElementById(id); }
    function val(id) { return el(id).value; }
    function number(value, digits) {
      return Number(value).toLocaleString(locale === "fr" ? "fr-FR" : "en", { minimumFractionDigits: digits || 0, maximumFractionDigits: digits == null ? 2 : digits });
    }
    function money(value) { var unit = val("beUnit").trim(); return (unit ? unit + " " : "") + number(value, 2); }
    function signed(value, suffix) { return (value > 0 ? "+" : "") + number(value, 2) + (suffix || ""); }
    function input(prefix) {
      var use = function (scenarioId, baseId) { return val(scenarioId) === "" ? val(baseId) : val(scenarioId); };
      if (!prefix) return { unit: val("beUnit"), fixedCosts: val("beFixed"), sellingPrice: val("bePrice"), variableCost: val("beVariable"), plannedUnits: val("bePlanned"), targetProfit: val("beTarget") };
      return { unit: val("beUnit"), fixedCosts: use("beScenarioFixed","beFixed"), sellingPrice: use("beScenarioPrice","bePrice"), variableCost: use("beScenarioVariable","beVariable"), plannedUnits: use("beScenarioPlanned","bePlanned"), targetProfit: val("beTarget") };
    }
    function clear() {
      state.result = null; state.scenario = null; el("beResult").classList.remove("on"); el("beScenarioTable").hidden = true;
      el("beError").textContent = c.error; el("beStatus").textContent = c.error;
    }
    function signedClass(node, value) {
      node.classList.remove("bev-signed-negative","bev-signed-positive");
      if (value < 0) node.classList.add("bev-signed-negative");
      if (value > 0) node.classList.add("bev-signed-positive");
    }
    function render(result) {
      el("beExactUnits").textContent = number(result.exactBreakEvenUnits, 2);
      el("beWholeUnits").textContent = number(result.wholeBreakEvenUnits, 0);
      el("beExactRevenue").textContent = money(result.exactBreakEvenRevenue);
      el("beWholeRevenue").textContent = money(result.wholeUnitRevenue);
      el("beContribution").textContent = money(result.contributionPerUnit);
      el("beRatio").textContent = number(result.contributionRatio * 100, 2) + "%";
      el("beProfit").textContent = result.plannedProfitLoss === null ? c.notEntered : signed(result.plannedProfitLoss, "");
      signedClass(el("beProfit"), result.plannedProfitLoss || 0);
      if (result.marginOfSafetyUnits === null) el("beSafety").textContent = c.notEntered;
      else if (result.marginOfSafetyPercent === null) el("beSafety").textContent = signed(result.marginOfSafetyUnits, " units") + " · " + c.unavailable;
      else el("beSafety").textContent = signed(result.marginOfSafetyUnits, " units") + " · " + signed(result.marginOfSafetyPercent, "%");
      signedClass(el("beSafety"), result.marginOfSafetyUnits || 0);
      el("beTargetUnits").textContent = result.targetProfitWholeUnits === null ? c.notEntered : number(result.targetProfitWholeUnits, 0);
      el("beResult").classList.add("on"); el("beError").textContent = ""; el("beStatus").textContent = c.ready;
    }
    function calculate() {
      try { state.result = engine.calculate(input("")); render(state.result); }
      catch (error) { clear(); }
    }
    el("beForm").addEventListener("submit", function (event) { event.preventDefault(); calculate(); });
    ["beUnit","beFixed","bePrice","beVariable","bePlanned","beTarget"].forEach(function (id) {
      el(id).addEventListener("input", function () { if (state.result) calculate(); });
    });
    function addCell(row, text) { var cell = document.createElement("td"); cell.textContent = String(text); row.appendChild(cell); }
    function scenarioRow(label, result) {
      var row = document.createElement("tr"); addCell(row,label); addCell(row,number(result.wholeBreakEvenUnits,0)); addCell(row,money(result.exactBreakEvenRevenue));
      addCell(row,result.plannedProfitLoss === null?c.notEntered:signed(result.plannedProfitLoss,""));
      addCell(row,result.marginOfSafetyUnits === null?c.notEntered:signed(result.marginOfSafetyUnits," units")); return row;
    }
    el("beScenarioForm").addEventListener("submit", function (event) {
      event.preventDefault();
      if (!state.result) calculate();
      if (!state.result) return;
      try {
        state.scenario = engine.calculate(input("scenario"));
        var body = el("beScenarioTable").querySelector("tbody"); body.replaceChildren();
        body.appendChild(scenarioRow(c.base,state.result)); body.appendChild(scenarioRow(val("beScenarioLabel").trim() || c.scenario,state.scenario));
        el("beScenarioTable").hidden = false; el("beError").textContent = ""; el("beStatus").textContent = c.scenarioReady;
      } catch (error) { el("beScenarioTable").hidden = true; el("beError").textContent = c.error; el("beStatus").textContent = c.error; }
    });
    function csvEscape(value) {
      var text = String(value == null ? "" : value);
      if (/^\s*[=+\-@]/.test(text) && !/^-?\d+(?:\.\d+)?$/.test(text.trim())) text = "'" + text;
      return '"' + text.replace(/"/g,'""') + '"';
    }
    function rows(result) {
      return [["Field","Value"],["Display unit",result.unit],["Fixed costs",result.fixedCosts],["Selling price",result.sellingPrice],["Variable cost",result.variableCost],["Contribution per unit",result.contributionPerUnit],["Contribution ratio",result.contributionRatio],["Exact break-even units",result.exactBreakEvenUnits],["Whole break-even units",result.wholeBreakEvenUnits],["Exact threshold revenue",result.exactBreakEvenRevenue],["Whole-unit revenue",result.wholeUnitRevenue],["Planned units",result.plannedUnits],["Planned profit/loss",result.plannedProfitLoss],["Margin of safety units",result.marginOfSafetyUnits],["Margin of safety percent",result.marginOfSafetyPercent],["Target profit",result.targetProfit],["Whole target-profit units",result.targetProfitWholeUnits],["Formula",c.formula]];
    }
    function download(content, name, type) {
      var url = URL.createObjectURL(new Blob([content], { type: type }));
      var anchor = document.createElement("a"); anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    }
    el("beCsv").addEventListener("click", function () {
      if (!state.result) return;
      download(rows(state.result).map(function (row) { return row.map(csvEscape).join(","); }).join("\r\n"), "break-even-result.csv", "text/csv;charset=utf-8");
    });
    el("bePdf").addEventListener("click", function () {
      if (!state.result || !window.jspdf) return;
      var pdf = new window.jspdf.jsPDF();
      pdf.setProperties({ title: c.title, subject: "User-entered break-even calculation" });
      pdf.setFont("helvetica","bold"); pdf.setFontSize(16); pdf.text(c.title,20,20);
      pdf.setFont("helvetica","normal"); pdf.setFontSize(10); var y = 32;
      rows(state.result).slice(1).forEach(function (row) {
        var line = String(row[0]) + ": " + String(row[1] == null ? "" : row[1]);
        var wrapped = pdf.splitTextToSize(line,170); if (y + wrapped.length * 5 > 280) { pdf.addPage(); y = 20; }
        pdf.text(wrapped,20,y); y += wrapped.length * 5 + 2;
      });
      pdf.save("break-even-result.pdf");
    });
    el("bePrint").addEventListener("click", function () { window.print(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

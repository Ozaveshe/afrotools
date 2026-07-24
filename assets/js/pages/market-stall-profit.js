(function () {
  "use strict";

  var root = document.querySelector("[data-market-stall-planner]");
  var engine = window.AfroTools && window.AfroTools.MarketStallProfit;
  if (!root || !engine) return;

  var locale = root.dataset.locale || "en";
  var STORE = "afrotools:market-stall-profit:history:v1";
  var copy = {
    en: {
      setup: "Day setup", currency: "Display currency", days: "Market days in your monthly scenario",
      reinvest: "Positive profit to allocate to restocking (%)", items: "Items sold", addItem: "Add item",
      item: "Item", name: "Item name", cost: "Unit cost", price: "Unit selling price", sold: "Units sold",
      lost: "Units lost or spoiled", remove: "Remove", expenses: "Daily operating expenses", addExpense: "Add expense",
      expense: "Expense", amount: "Amount", calculate: "Calculate daily profit", required: "Enter at least one complete item and check every highlighted field.",
      current: "Current result", stale: "Inputs changed. Calculate again before saving or exporting.", revenue: "Sales revenue",
      stock: "Cost of sold stock", loss: "Cost of stock lost", gross: "Gross contribution", operating: "Operating expenses",
      profit: "Net daily profit", margin: "Net margin", ratio: "Contribution ratio", breakEven: "Same-mix break-even revenue",
      allocation: "Restocking allocation", remainder: "Unallocated positive profit", monthly: "Monthly scenario net profit",
      detail: "Item detail", copy: "Copy summary", csv: "Download CSV", json: "Download JSON", pdf: "Download PDF",
      print: "Print", save: "Save locally", load: "Load local history", backup: "Download history JSON",
      clear: "Clear this currency", delete: "Delete", history: "Local history", noHistory: "No saved results for this currency.",
      saved: "Saved only in this browser.", copied: "Summary copied.", corrupt: "Saved history could not be read. You can clear it safely.",
      pdfFallback: "PDF library is unavailable. Use Print instead.", scope: "Planning estimate from the values you entered; no rates or charges are added.",
      transport: "Transport", fee: "Market fee", example: "e.g. Tomatoes"
    },
    fr: {
      setup: "Paramètres du jour", currency: "Devise d’affichage", days: "Jours de marché dans le scénario mensuel",
      reinvest: "Part du profit positif affectée au réassort (%)", items: "Articles vendus", addItem: "Ajouter un article",
      item: "Article", name: "Nom de l’article", cost: "Coût unitaire", price: "Prix de vente unitaire", sold: "Unités vendues",
      lost: "Unités perdues ou avariées", remove: "Supprimer", expenses: "Dépenses d’exploitation quotidiennes", addExpense: "Ajouter une dépense",
      expense: "Dépense", amount: "Montant", calculate: "Calculer le profit journalier", required: "Saisissez au moins un article complet et vérifiez les champs signalés.",
      current: "Résultat actuel", stale: "Les données ont changé. Recalculez avant d’enregistrer ou d’exporter.", revenue: "Chiffre d’affaires",
      stock: "Coût du stock vendu", loss: "Coût du stock perdu", gross: "Contribution brute", operating: "Dépenses d’exploitation",
      profit: "Profit net journalier", margin: "Marge nette", ratio: "Taux de contribution", breakEven: "CA au seuil de rentabilité à mix constant",
      allocation: "Affectation au réassort", remainder: "Profit positif non affecté", monthly: "Profit net du scénario mensuel",
      detail: "Détail des articles", copy: "Copier le résumé", csv: "Télécharger le CSV", json: "Télécharger le JSON", pdf: "Télécharger le PDF",
      print: "Imprimer", save: "Enregistrer localement", load: "Charger l’historique local", backup: "Télécharger l’historique JSON",
      clear: "Effacer cette devise", delete: "Supprimer", history: "Historique local", noHistory: "Aucun résultat enregistré pour cette devise.",
      saved: "Enregistré uniquement dans ce navigateur.", copied: "Résumé copié.", corrupt: "L’historique enregistré est illisible. Vous pouvez l’effacer.",
      pdfFallback: "La bibliothèque PDF est indisponible. Utilisez Imprimer.", scope: "Estimation fondée uniquement sur vos valeurs ; aucun taux ni frais n’est ajouté.",
      transport: "Transport", fee: "Droit de marché", example: "ex. Tomates"
    },
    sw: {
      setup: "Mpangilio wa siku", currency: "Sarafu ya kuonyesha", days: "Siku za soko katika makadirio ya mwezi",
      reinvest: "Asilimia ya faida chanya ya kurudisha kwenye bidhaa", items: "Bidhaa zilizouzwa", addItem: "Ongeza bidhaa",
      item: "Bidhaa", name: "Jina la bidhaa", cost: "Gharama ya kipimo", price: "Bei ya kuuza kwa kipimo", sold: "Vipimo vilivyouzwa",
      lost: "Vipimo vilivyopotea au kuharibika", remove: "Ondoa", expenses: "Gharama za uendeshaji za siku", addExpense: "Ongeza gharama",
      expense: "Gharama", amount: "Kiasi", calculate: "Kokotoa faida ya siku", required: "Weka angalau bidhaa moja kamili na ukague sehemu zilizoonyeshwa.",
      current: "Matokeo ya sasa", stale: "Taarifa zimebadilika. Kokotoa tena kabla ya kuhifadhi au kuhamisha.", revenue: "Mapato ya mauzo",
      stock: "Gharama ya bidhaa zilizouzwa", loss: "Gharama ya bidhaa zilizopotea", gross: "Mchango ghafi", operating: "Gharama za uendeshaji",
      profit: "Faida halisi ya siku", margin: "Ukingo halisi", ratio: "Uwiano wa mchango", breakEven: "Mapato ya kutofanya hasara kwa mchanganyiko huohuo",
      allocation: "Mgao wa kurudisha bidhaa", remainder: "Faida chanya isiyogawiwa", monthly: "Faida halisi ya makadirio ya mwezi",
      detail: "Maelezo ya bidhaa", copy: "Nakili muhtasari", csv: "Pakua CSV", json: "Pakua JSON", pdf: "Pakua PDF",
      print: "Chapisha", save: "Hifadhi kwenye kifaa", load: "Fungua historia ya kifaa", backup: "Pakua historia ya JSON",
      clear: "Futa sarafu hii", delete: "Futa", history: "Historia ya kifaa", noHistory: "Hakuna matokeo yaliyohifadhiwa kwa sarafu hii.",
      saved: "Imehifadhiwa katika kivinjari hiki pekee.", copied: "Muhtasari umenakiliwa.", corrupt: "Historia iliyohifadhiwa haisomeki. Unaweza kuifuta.",
      pdfFallback: "Maktaba ya PDF haipatikani. Tumia Chapisha.", scope: "Makadirio kutoka kwenye thamani ulizoweka pekee; hakuna ada au viwango vilivyoongezwa.",
      transport: "Usafiri", fee: "Ada ya soko", example: "mf. Nyanya"
    }
  }[locale];
  var current = null;
  var currentStamp = "";
  var itemSeq = 0;
  var expenseSeq = 0;

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === "class") node.className = attrs[key];
      else if (key === "dataset") Object.assign(node.dataset, attrs[key]);
      else node.setAttribute(key, attrs[key]);
    });
    if (text != null) node.textContent = text;
    return node;
  }
  function field(label, type, cls, options) {
    var wrap = el("div", { class: "msp-field" });
    var id = "msp-" + cls + "-" + (++itemSeq) + "-" + (++expenseSeq);
    var lab = el("label", { for: id }, label);
    var input = el("input", Object.assign({ id: id, type: type, class: cls }, options || {}));
    wrap.append(lab, input);
    return wrap;
  }
  function button(text, action, secondary) {
    return el("button", { type: "button", class: secondary ? "msp-button msp-button--secondary" : "msp-button", "data-action": action }, text);
  }
  function addItem() {
    var row = el("fieldset", { class: "msp-row msp-item" });
    row.append(el("legend", {}, copy.item + " " + (root.querySelectorAll(".msp-item").length + 1)));
    row.append(field(copy.name, "text", "js-name", { maxlength: "60", placeholder: copy.example, required: "" }));
    row.append(field(copy.cost, "number", "js-cost", { min: "0", step: "0.01", inputmode: "decimal", required: "" }));
    row.append(field(copy.price, "number", "js-price", { min: "0", step: "0.01", inputmode: "decimal", required: "" }));
    row.append(field(copy.sold, "number", "js-sold", { min: "0", step: "0.01", inputmode: "decimal", required: "" }));
    row.append(field(copy.lost, "number", "js-lost", { min: "0", step: "0.01", inputmode: "decimal", value: "0" }));
    row.append(button(copy.remove, "remove-row", true));
    root.querySelector("[data-items]").append(row);
  }
  function addExpense(name) {
    var row = el("fieldset", { class: "msp-row msp-expense" });
    row.append(el("legend", {}, copy.expense + " " + (root.querySelectorAll(".msp-expense").length + 1)));
    row.append(field(copy.name, "text", "js-expense-name", { maxlength: "60", value: name || "" }));
    row.append(field(copy.amount, "number", "js-expense-amount", { min: "0", step: "0.01", inputmode: "decimal" }));
    row.append(button(copy.remove, "remove-row", true));
    root.querySelector("[data-expenses]").append(row);
  }
  function build() {
    var form = el("form", { class: "msp-form", novalidate: "" });
    var setup = el("fieldset", { class: "msp-panel msp-setup" });
    setup.append(el("legend", {}, copy.setup));
    setup.append(field(copy.currency, "text", "js-currency", { maxlength: "12", value: root.dataset.currency || "KES", required: "" }));
    setup.append(field(copy.days, "number", "js-days", { min: "1", max: "31", step: "1", value: "24", required: "" }));
    setup.append(field(copy.reinvest, "number", "js-reinvest", { min: "0", max: "100", step: "1", value: "50", required: "" }));
    var items = el("section", { class: "msp-panel", "aria-labelledby": "msp-items-title" });
    items.append(el("div", { class: "msp-section-head" }, null));
    items.firstChild.append(el("h2", { id: "msp-items-title" }, copy.items), button(copy.addItem, "add-item", true));
    items.append(el("div", { "data-items": "" }));
    var expenses = el("section", { class: "msp-panel", "aria-labelledby": "msp-expenses-title" });
    expenses.append(el("div", { class: "msp-section-head" }));
    expenses.firstChild.append(el("h2", { id: "msp-expenses-title" }, copy.expenses), button(copy.addExpense, "add-expense", true));
    expenses.append(el("div", { "data-expenses": "" }));
    form.append(setup, items, expenses, el("p", { class: "msp-error", role: "alert", hidden: "", "data-error": "" }), el("button", { type: "submit", class: "msp-button msp-submit" }, copy.calculate));
    root.append(form);
    root.append(el("section", { class: "msp-panel msp-results", hidden: "", tabindex: "-1", "aria-live": "polite", "data-results": "" }));
    root.append(el("section", { class: "msp-panel msp-history", "aria-labelledby": "msp-history-title" }));
    var history = root.lastChild;
    history.append(el("h2", { id: "msp-history-title" }, copy.history));
    var actions = el("div", { class: "msp-actions" });
    actions.append(button(copy.load, "load-history", true), button(copy.backup, "backup-history", true), button(copy.clear, "clear-history", true));
    history.append(actions, el("p", { class: "msp-status", role: "status", "data-status": "" }), el("div", { "data-history": "" }));
    addItem();
    addExpense(copy.transport);
    addExpense(copy.fee);
  }
  function readInput() {
    var items = Array.from(root.querySelectorAll(".msp-item")).map(function (row) {
      return { name: row.querySelector(".js-name").value, unitCost: row.querySelector(".js-cost").value, unitPrice: row.querySelector(".js-price").value, unitsSold: row.querySelector(".js-sold").value, unitsLost: row.querySelector(".js-lost").value };
    }).filter(function (x) { return Object.values(x).some(function (v) { return v !== "" && v !== "0"; }); });
    var expenses = Array.from(root.querySelectorAll(".msp-expense")).map(function (row) {
      return { name: row.querySelector(".js-expense-name").value, amount: row.querySelector(".js-expense-amount").value };
    }).filter(function (x) { return x.amount !== ""; });
    return { currency: root.querySelector(".js-currency").value, marketDays: root.querySelector(".js-days").value, reinvestRate: root.querySelector(".js-reinvest").value, items: items, expenses: expenses };
  }
  function stamp(value) { return JSON.stringify(value); }
  function money(value, currency) { return value == null ? "—" : currency + " " + Number(value).toLocaleString(locale, { maximumFractionDigits: 2 }); }
  function renderResult(result) {
    var out = result.outputs;
    var box = root.querySelector("[data-results]");
    box.replaceChildren(el("h2", {}, copy.current), el("p", { class: "msp-scope" }, copy.scope));
    var grid = el("div", { class: "msp-metrics" });
    [[copy.revenue, out.revenue], [copy.stock, out.soldStockCost], [copy.loss, out.stockLossCost], [copy.gross, out.grossContribution], [copy.operating, out.operatingExpenses], [copy.profit, out.netDailyProfit], [copy.breakEven, out.breakEvenRevenue], [copy.allocation, out.reinvestmentAllocation], [copy.remainder, out.unallocatedPositiveProfit], [copy.monthly, out.monthlyScenario.netProfit]].forEach(function (pair) {
      var card = el("div", { class: "msp-metric" }); card.append(el("span", {}, pair[0]), el("strong", {}, money(pair[1], result.inputs.currency))); grid.append(card);
    });
    [[copy.margin, out.netMarginPct], [copy.ratio, out.contributionRatioPct]].forEach(function (pair) {
      var card = el("div", { class: "msp-metric" }); card.append(el("span", {}, pair[0]), el("strong", {}, pair[1] == null ? "—" : pair[1] + "%")); grid.append(card);
    });
    box.append(grid);
    var tableWrap = el("div", { class: "msp-table-wrap" });
    var table = el("table", {}); var head = el("tr", {});
    [copy.name, copy.revenue, copy.stock, copy.loss, copy.gross].forEach(function (x) { head.append(el("th", { scope: "col" }, x)); });
    var thead = el("thead", {}); thead.append(head); table.append(thead); var body = el("tbody", {});
    result.items.forEach(function (item) { var tr = el("tr", {}); [item.name, money(item.revenue, result.inputs.currency), money(item.soldStockCost, result.inputs.currency), money(item.stockLossCost, result.inputs.currency), money(item.grossContribution, result.inputs.currency)].forEach(function (x) { tr.append(el("td", {}, x)); }); body.append(tr); });
    table.append(body); tableWrap.append(table); box.append(el("h3", {}, copy.detail), tableWrap);
    var actions = el("div", { class: "msp-actions" });
    [["copy", copy.copy], ["csv", copy.csv], ["json", copy.json], ["pdf", copy.pdf], ["print", copy.print], ["save", copy.save]].forEach(function (x) { actions.append(button(x[1], x[0], x[0] !== "save")); });
    box.append(actions, el("p", { class: "msp-status", role: "status", "data-result-status": "" }));
    box.hidden = false;
    document.body.classList.add("msp-has-result");
    box.focus();
  }
  function payload() {
    return { title: document.title, generatedAt: new Date().toISOString(), engineVersion: current.version, scope: copy.scope, inputs: current.inputs, items: current.items, expenses: current.expenses, outputs: current.outputs, formulas: {
      revenue: "unit selling price × units sold", soldStockCost: "unit cost × units sold", stockLossCost: "unit cost × units lost", netDailyProfit: "revenue − sold-stock cost − stock-loss cost − operating expenses", breakEvenRevenue: "(stock-loss cost + operating expenses) ÷ contribution ratio"
    }, assumptions: current.assumptions };
  }
  function summaryText() {
    var p = payload(); return [p.title, copy.scope, copy.revenue + ": " + money(p.outputs.revenue, p.inputs.currency), copy.profit + ": " + money(p.outputs.netDailyProfit, p.inputs.currency), copy.margin + ": " + (p.outputs.netMarginPct == null ? "—" : p.outputs.netMarginPct + "%"), copy.monthly + ": " + money(p.outputs.monthlyScenario.netProfit, p.inputs.currency)].join("\n");
  }
  function safeCsv(value) {
    var text = String(value == null ? "" : value); if (/^[=+\-@]/.test(text)) text = "'" + text; return '"' + text.replace(/"/g, '""') + '"';
  }
  function download(name, type, content) {
    var url = URL.createObjectURL(new Blob([content], { type: type })); var a = el("a", { href: url, download: name }); document.body.append(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function csv() {
    var rows = [["Item", "Unit cost", "Unit price", "Units sold", "Units lost", "Revenue", "Sold-stock cost", "Stock-loss cost", "Gross contribution"]];
    current.items.forEach(function (x) { rows.push([x.name, x.unitCost, x.unitPrice, x.unitsSold, x.unitsLost, x.revenue, x.soldStockCost, x.stockLossCost, x.grossContribution]); });
    rows.push([], ["Metric", "Value"], ["Scope", copy.scope], ["Engine version", current.version], ["Currency", current.inputs.currency], ["Net daily profit", current.outputs.netDailyProfit], ["Net margin %", current.outputs.netMarginPct], ["Same-mix break-even revenue", current.outputs.breakEvenRevenue], ["Monthly scenario days", current.inputs.marketDays], ["Monthly net profit", current.outputs.monthlyScenario.netProfit], ["Formula", "net daily profit = revenue - sold-stock cost - stock-loss cost - operating expenses"]);
    download("market-stall-profit.csv", "text/csv;charset=utf-8", "\ufeff" + rows.map(function (r) { return r.map(safeCsv).join(","); }).join("\n"));
  }
  function historyRead() {
    try { var parsed = JSON.parse(localStorage.getItem(STORE) || '{"schemaVersion":1,"records":[]}'); return parsed && parsed.schemaVersion === 1 && Array.isArray(parsed.records) ? parsed : null; } catch (_) { return null; }
  }
  function historyWrite(data) { localStorage.setItem(STORE, JSON.stringify(data)); }
  function renderHistory() {
    var data = historyRead(), target = root.querySelector("[data-history]"), status = root.querySelector("[data-status]");
    target.replaceChildren();
    if (!data) { status.textContent = copy.corrupt; return; }
    status.textContent = "";
    var currency = engine.cleanText(root.querySelector(".js-currency").value, 12).toUpperCase();
    var records = data.records.filter(function (r) { return r && r.currency === currency; });
    if (!records.length) { target.append(el("p", {}, copy.noHistory)); return; }
    var list = el("ul", { class: "msp-history-list" });
    records.forEach(function (r) { var li = el("li", {}); li.append(el("span", {}, new Date(r.savedAt).toLocaleString(locale) + " · " + money(r.netDailyProfit, r.currency)), button(copy.delete, "delete-history", true)); li.lastChild.dataset.id = r.id; list.append(li); });
    target.append(list);
  }
  function saveHistory() {
    var data = historyRead() || { schemaVersion: 1, records: [] };
    data.records.unshift({ id: Date.now() + "-" + Math.random().toString(36).slice(2, 8), savedAt: new Date().toISOString(), currency: current.inputs.currency, netDailyProfit: current.outputs.netDailyProfit, revenue: current.outputs.revenue, monthlyNetProfit: current.outputs.monthlyScenario.netProfit, marketDays: current.inputs.marketDays, engineVersion: current.version });
    data.records = data.records.slice(0, 30); historyWrite(data); root.querySelector("[data-result-status]").textContent = copy.saved; renderHistory();
  }
  function stale() {
    if (!current || stamp(readInput()) === currentStamp) return false;
    current = null;
    document.body.classList.remove("msp-has-result");
    root.querySelector("[data-results]").hidden = true; root.querySelector("[data-error]").hidden = false; root.querySelector("[data-error]").textContent = copy.stale; return true;
  }
  build();
  root.addEventListener("input", stale);
  root.addEventListener("submit", function (event) {
    event.preventDefault(); var input = readInput(); var result = engine.calculate(input); var error = root.querySelector("[data-error]");
    if (!result.valid) { error.hidden = false; error.textContent = copy.required; return; }
    error.hidden = true; current = result; currentStamp = stamp(input); renderResult(result);
  });
  root.addEventListener("click", function (event) {
    var trigger = event.target.closest("[data-action]"); if (!trigger) return; var action = trigger.dataset.action;
    if (action === "add-item") addItem();
    else if (action === "add-expense") addExpense("");
    else if (action === "remove-row") { var row = trigger.closest(".msp-row"); var selector = row.classList.contains("msp-item") ? ".msp-item" : ".msp-expense"; if (root.querySelectorAll(selector).length > 1) row.remove(); }
    else if (action === "load-history") renderHistory();
    else if (action === "backup-history") { var h = historyRead(); if (!h) root.querySelector("[data-status]").textContent = copy.corrupt; else download("market-stall-profit-history.json", "application/json", JSON.stringify(h, null, 2)); }
    else if (action === "clear-history") { var h2 = historyRead() || { schemaVersion: 1, records: [] }; var currency = engine.cleanText(root.querySelector(".js-currency").value, 12).toUpperCase(); h2.records = h2.records.filter(function (r) { return r.currency !== currency; }); historyWrite(h2); renderHistory(); }
    else if (action === "delete-history") { var h3 = historyRead(); if (h3) { h3.records = h3.records.filter(function (r) { return r.id !== trigger.dataset.id; }); historyWrite(h3); renderHistory(); } }
    else if (!current || stale()) return;
    else if (action === "copy") navigator.clipboard.writeText(summaryText()).then(function () { root.querySelector("[data-result-status]").textContent = copy.copied; });
    else if (action === "csv") csv();
    else if (action === "json") download("market-stall-profit.json", "application/json", JSON.stringify(payload(), null, 2));
    else if (action === "print") window.print();
    else if (action === "save") saveHistory();
    else if (action === "pdf") {
      if (!window.jspdf || !window.jspdf.jsPDF) { root.querySelector("[data-result-status]").textContent = copy.pdfFallback; return; }
      var pdfText = summaryText() + "\nEngine: " + current.version +
        "\nFormula: net daily profit = revenue - sold-stock cost - stock-loss cost - operating expenses" +
        "\nBreak-even: (stock-loss cost + operating expenses) / contribution ratio" +
        "\nAssumptions: same product mix; repeated market day; display currency only." +
        "\n\nItems\n" + current.items.map(function (x) {
          return x.name + ": revenue " + money(x.revenue, current.inputs.currency) +
            ", sold-stock cost " + money(x.soldStockCost, current.inputs.currency) +
            ", stock-loss cost " + money(x.stockLossCost, current.inputs.currency);
        }).join("\n");
      var doc = new window.jspdf.jsPDF(); var lines = doc.splitTextToSize(pdfText, 175); doc.text(lines, 18, 20); doc.save("market-stall-profit.pdf");
    }
  });
})();

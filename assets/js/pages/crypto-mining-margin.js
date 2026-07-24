(function () {
  "use strict";
  var engine = window.AfroTools && window.AfroTools.cryptoMiningMargin;
  var form = document.getElementById("miningMarginForm");
  if (!engine || !form) return;

  var lang = document.documentElement.lang === "fr" ? "fr" : "en";
  var text = lang === "fr" ? {
    ready: "Résultat calculé localement. Aucune donnée n’a quitté cet appareil.",
    invalid: "Vérifiez les champs. ",
    noPayback: "Aucun délai simple n’est affiché : saisissez un coût matériel positif et obtenez un résultat net quotidien positif.",
    payback: "Délai simple du matériel",
    days: "jours",
    net: "Résultat net quotidien",
    margin: "Marge d’exploitation",
    grossDaily: "Revenu brut quotidien",
    poolDaily: "Frais de pool quotidiens",
    energyDaily: "Énergie quotidienne",
    energyCostDaily: "Coût énergétique quotidien",
    otherDaily: "Autres coûts quotidiens",
    netCoin: "Production nette quotidienne",
    breakEven: "Prix d’équilibre de la crypto",
    costCoin: "Coût d’exploitation par crypto nette",
    periodNet: "Résultat net sur {days} jours",
    periodGross: "Revenu brut sur {days} jours",
    downloaded: "Export créé localement.",
    pdfMissing: "Le moteur PDF local n’est pas disponible. Utilisez Imprimer / Enregistrer en PDF."
  } : {
    ready: "Result calculated locally. No data left this device.",
    invalid: "Check the fields. ",
    noPayback: "No simple payback is shown: enter a positive hardware cost and produce a positive daily net result.",
    payback: "Simple hardware payback",
    days: "days",
    net: "Daily net result",
    margin: "Operating margin",
    grossDaily: "Daily gross revenue",
    poolDaily: "Daily pool fee",
    energyDaily: "Daily energy",
    energyCostDaily: "Daily energy cost",
    otherDaily: "Other daily cost",
    netCoin: "Daily net coin output",
    breakEven: "Break-even coin price",
    costCoin: "Operating cost per net coin",
    periodNet: "{days}-day net result",
    periodGross: "{days}-day gross revenue",
    downloaded: "Export created locally.",
    pdfMissing: "The local PDF engine is unavailable. Use Print / Save PDF."
  };
  var output = document.getElementById("miningMarginResults");
  var status = document.getElementById("miningMarginStatus");
  var actions = Array.prototype.slice.call(document.querySelectorAll("[data-mining-export]"));
  var result = null;

  function value(id) { return document.getElementById(id).value; }
  function input() {
    return {
      grossCoinPerDay: value("grossCoinPerDay"), coinPrice: value("coinPrice"),
      powerWatts: value("powerWatts"), uptimeHours: value("uptimeHours"),
      electricityRate: value("electricityRate"), poolFeePercent: value("poolFeePercent"),
      otherDailyCost: value("otherDailyCost"), hardwareCost: value("hardwareCost"),
      periodDays: value("periodDays")
    };
  }
  function currency() { return value("currencyCode").trim().toUpperCase(); }
  function coin() { return value("coinLabel").trim().toUpperCase(); }
  function money(number) {
    return new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en", { style:"currency", currency:currency(), maximumFractionDigits:2 }).format(number);
  }
  function number(value, digits) {
    return new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en", { maximumFractionDigits:digits }).format(value);
  }
  function row(label, value) { return '<div class="mining-result-row"><span>' + label + '</span><strong>' + value + "</strong></div>"; }
  function label(template) { return template.replace("{days}", result.periodDays); }
  function setStatus(message, error) {
    status.textContent = message;
    status.classList.toggle("is-error", Boolean(error));
  }
  function enable(on) { actions.forEach(function (button) { button.disabled = !on; }); }
  function render() {
    var loss = result.netResultDaily < 0;
    var html = '<div class="mining-result-hero' + (loss ? " is-loss" : "") + '"><span class="mining-result-label">' + text.net + '</span><strong class="mining-result-value">' + money(result.netResultDaily) + '</strong><span>' + number(result.marginPercent, 2) + "% " + text.margin.toLowerCase() + "</span></div>";
    html += '<div class="mining-result-list">';
    html += row(text.grossDaily, money(result.grossRevenueDaily));
    html += row(text.poolDaily, money(result.poolFeeDaily));
    html += row(text.energyDaily, number(result.energyKwhDaily, 3) + " kWh");
    html += row(text.energyCostDaily, money(result.energyCostDaily));
    html += row(text.otherDaily, money(result.otherDailyCost));
    html += row(text.netCoin, number(result.netCoinPerDay, 8) + " " + coin());
    html += row(text.breakEven, money(result.breakEvenCoinPrice));
    html += row(text.costCoin, money(result.costPerNetCoin));
    html += row(label(text.periodGross), money(result.grossRevenuePeriod));
    html += row(label(text.periodNet), money(result.netResultPeriod));
    html += "</div>";
    html += '<div class="mining-payback">' + (result.hardwarePaybackDays === null
      ? text.noPayback
      : "<strong>" + text.payback + ":</strong> " + number(result.hardwarePaybackDays, 1) + " " + text.days) + "</div>";
    output.innerHTML = html;
  }
  function calculate(event) {
    if (event) event.preventDefault();
    delete output.dataset.resultSettled;
    if (!form.reportValidity()) { setStatus(text.invalid, true); return; }
    try {
      result = engine.calculate(input());
      render(); enable(true); setStatus(text.ready, false);
      if (window.innerWidth <= 780) {
        var card = output.closest(".mining-card");
        if (card) {
          var root = document.documentElement;
          var previousBehavior = root.style.scrollBehavior;
          root.style.scrollBehavior = "auto";
          window.scrollTo(0, card.getBoundingClientRect().top + window.scrollY - 8);
          root.style.scrollBehavior = previousBehavior;
        }
        output.focus({ preventScroll:true });
      }
      output.dataset.resultSettled = "true";
    } catch (error) {
      result = null; enable(false); setStatus(text.invalid + error.message, true);
    }
  }
  function snapshot() {
    return { schemaVersion:1, tool:"crypto-mining-operating-margin", language:lang, currency:currency(), coinLabel:coin(), inputs:input(), results:result, method:"User-entered gross coin output and price; pool fee reduces gross revenue; energy cost = kW × uptime × rate; net result = gross revenue − pool fee − energy cost − other daily cost." };
  }
  function download(name, type, content) {
    var url = URL.createObjectURL(new Blob([content], { type:type }));
    var anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0); setStatus(text.downloaded, false);
  }
  function csv() {
    var rows = [["field","daily","period"],["gross_revenue",result.grossRevenueDaily,result.grossRevenuePeriod],["pool_fee",result.poolFeeDaily,result.poolFeePeriod],["energy_kwh",result.energyKwhDaily,result.energyKwhPeriod],["energy_cost",result.energyCostDaily,result.energyCostPeriod],["other_cost",result.otherDailyCost,result.otherCostPeriod],["net_result",result.netResultDaily,result.netResultPeriod],["margin_percent",result.marginPercent,""],["break_even_coin_price",result.breakEvenCoinPrice,""],["cost_per_net_coin",result.costPerNetCoin,""],["hardware_payback_days",result.hardwarePaybackDays === null ? "" : result.hardwarePaybackDays,""]];
    download("crypto-mining-margin.csv","text/csv;charset=utf-8",rows.map(function (row) { return row.join(","); }).join("\n"));
  }
  function json() { download("crypto-mining-margin.json","application/json;charset=utf-8",JSON.stringify(snapshot(),null,2)); }
  function pdf() {
    if (!window.jspdf || !window.jspdf.jsPDF) { setStatus(text.pdfMissing, true); return; }
    var doc = new window.jspdf.jsPDF();
    doc.setFontSize(16); doc.text(lang === "fr" ? "Marge d’exploitation du minage crypto" : "Crypto Mining Operating Margin", 15, 18);
    doc.setFontSize(10);
    var lines = [
      "Currency: " + currency(), "Coin: " + coin(), text.grossDaily + ": " + money(result.grossRevenueDaily),
      text.poolDaily + ": " + money(result.poolFeeDaily), text.energyDaily + ": " + number(result.energyKwhDaily,3) + " kWh",
      text.energyCostDaily + ": " + money(result.energyCostDaily), text.otherDaily + ": " + money(result.otherDailyCost),
      text.net + ": " + money(result.netResultDaily), text.margin + ": " + number(result.marginPercent,2) + "%",
      text.breakEven + ": " + money(result.breakEvenCoinPrice), label(text.periodNet) + ": " + money(result.netResultPeriod),
      result.hardwarePaybackDays === null ? text.noPayback : text.payback + ": " + number(result.hardwarePaybackDays,1) + " " + text.days
    ];
    lines.forEach(function (line, index) { doc.text(String(line), 15, 30 + index * 8); });
    doc.save("crypto-mining-margin.pdf"); setStatus(text.downloaded, false);
  }
  form.addEventListener("submit", calculate);
  form.addEventListener("input", function () {
    if (!result) return;
    result = null;
    delete output.dataset.resultSettled;
    enable(false);
  });
  actions.forEach(function (button) {
    button.addEventListener("click", function () {
      if (!result) return;
      var action = button.getAttribute("data-mining-export");
      if (action === "csv") csv(); else if (action === "json") json(); else if (action === "pdf") pdf(); else window.print();
    });
  });
})();

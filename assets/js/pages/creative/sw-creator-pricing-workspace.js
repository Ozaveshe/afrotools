(function (window, document) {
  "use strict";

  function byId(id) { return document.getElementById(id); }
  function number(id) { return Number(byId(id).value); }
  function money(value, currency) {
    try { return new Intl.NumberFormat("sw", { style: "currency", currency: currency, maximumFractionDigits: 0 }).format(value); }
    catch (_error) { return currency + " " + Math.round(value).toLocaleString("sw"); }
  }

  var quote = document.querySelector("[data-manual-quote]");
  var workspace = document.querySelector("[data-sw-creator-workspace]");
  if (!quote || !workspace) return;

  var quoteReport = null;
  var benchmarkReport = null;
  var quoteStatus = quote.querySelector("[data-quote-status]");
  var quoteResults = quote.querySelector("[data-quote-results]");
  var quoteDetail = quote.querySelector("[data-quote-detail]");
  var workspaceStatus = workspace.querySelector("[data-workspace-status]");
  var briefFile = byId("creatorBriefFile");
  var briefText = byId("creatorBriefText");

  function calculateQuote() {
    var input = {
      currency: byId("quote-currency").value,
      hours: number("quote-hours"), hourly: number("quote-hourly"), costs: number("quote-costs"),
      revisions: number("quote-revisions"), usage: byId("quote-usage").value, margin: number("quote-margin")
    };
    if (!Number.isFinite(input.hours) || !Number.isFinite(input.hourly) || !Number.isFinite(input.costs) || !Number.isFinite(input.revisions) || !Number.isFinite(input.margin) || input.hours < 0 || input.hourly <= 0 || input.costs < 0 || input.revisions < 0 || input.margin < 0) {
      quoteReport = null;
      quoteResults.textContent = "";
      quoteDetail.textContent = "";
      quoteStatus.textContent = "Weka bei ya saa iliyo juu ya sifuri na namba zisizo hasi kwenye sehemu nyingine.";
      quoteStatus.classList.add("cf-error");
      return;
    }
    var usageMultiplier = input.usage === "paid" ? 1.5 : input.usage === "exclusive" ? 2.2 : 1;
    var base = input.hours * input.hourly + input.costs + input.revisions * input.hourly * 0.5;
    var recommended = base * usageMultiplier * (1 + input.margin / 100);
    quoteReport = { schemaVersion: 1, tool: "creator-pricing-manual-quote", locale: "sw", input: input, base: base, recommended: recommended, usageMultiplier: usageMultiplier };
    quoteResults.innerHTML = [
      ["Bei ya msingi", money(base, input.currency)],
      ["Bei inayopendekezwa", money(recommended, input.currency)],
      ["Kizidishi cha matumizi", usageMultiplier.toFixed(1) + "x"]
    ].map(function (item) { return '<div class="cp-metric"><span>' + item[0] + '</span><strong>' + item[1] + '</strong></div>'; }).join("");
    quoteDetail.innerHTML = '<p class="cp-note">Onyesha kazi za kuwasilisha, muda, marekebisho, haki za matumizi na masharti ya malipo. Kwa matangazo ya kulipia au matumizi ya kipekee, bei huwa juu kuliko matumizi ya kawaida.</p>';
    quoteStatus.textContent = "Quotation imekokotolewa kwenye kifaa chako.";
    quoteStatus.classList.remove("cf-error");
  }
  function resetQuote() {
    byId("quote-currency").value = "KES";
    byId("quote-hours").value = "8";
    byId("quote-hourly").value = "35";
    byId("quote-costs").value = "120";
    byId("quote-revisions").value = "2";
    byId("quote-usage").value = "basic";
    byId("quote-margin").value = "25";
    calculateQuote();
    quoteStatus.textContent = "Quotation imerudishwa kwenye mfano.";
  }
  function buildPlan() {
    var lines = ["Mpango wa bei ya mtayarishi — AfroTools", "", "Brief ya kampeni:", briefText.value.trim() || "Brief haijaongezwa bado."];
    if (benchmarkReport) lines.push("", "Makadirio ya soko:", JSON.stringify(benchmarkReport, null, 2));
    if (quoteReport) lines.push("", "Quotation ya gharama halisi:", JSON.stringify(quoteReport, null, 2));
    lines.push("", "Faragha: ripoti iliandaliwa kwenye kivinjari. Hakuna brief iliyopakiwa kwenye server.");
    return lines.join("\n");
  }
  function downloadPlan() {
    var blob = new Blob([buildPlan()], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "mpango-wa-bei-ya-mtayarishi.txt";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    workspaceStatus.textContent = "Mpango wa TXT umepakuliwa.";
  }

  quote.querySelector("[data-quote-calculate]").addEventListener("click", calculateQuote);
  quote.querySelector("[data-quote-reset]").addEventListener("click", resetQuote);
  document.querySelector("[data-creator-pricing]").addEventListener("swcreatorpricing:report", function (event) { benchmarkReport = event.detail; });
  briefFile.addEventListener("change", function () {
    var file = briefFile.files && briefFile.files[0];
    if (!file) return;
    if (file.size > 100000) { workspaceStatus.textContent = "Faili ni kubwa sana. Chagua TXT au Markdown chini ya KB 100."; return; }
    var reader = new FileReader();
    reader.onload = function () { briefText.value = String(reader.result || "").slice(0, 12000); workspaceStatus.textContent = "Brief imesomwa kwenye kifaa chako."; };
    reader.onerror = function () { workspaceStatus.textContent = "Brief haikuweza kusomwa."; };
    reader.readAsText(file);
  });
  byId("creatorDownloadPlan").addEventListener("click", downloadPlan);
  byId("creatorCopyPlan").addEventListener("click", function () {
    var text = buildPlan();
    var done = function () { workspaceStatus.textContent = "Mpango umenakiliwa."; };
    var failed = function () { workspaceStatus.textContent = "Kunakili hakukufaulu; tumia upakuaji wa TXT."; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(failed); else failed();
  });
  calculateQuote();
})(window, document);

"use strict";

(function () {
  const config = window.__SW_TRADE_CORE_CONFIG__;
  if (!config || config.id !== "fx-import-impact") return;
  const form = document.querySelector("[data-trade-form]");
  const f = form.elements;
  const countries = new Map(FxImpactEngine.getAllCountries().map(item => [item.code, item]));
  const regionNames = new Intl.DisplayNames(["sw"], {type:"region"});
  const rateFormat = new Intl.NumberFormat("sw", {maximumFractionDigits: 8});
  const moneyFormat = new Intl.NumberFormat("sw", {maximumFractionDigits: 2});
  const changes = [-20, -15, -10, -5, 0, 5, 10, 15, 20];
  let ledger = {};
  let basis;
  let usingReference = true;

  function historical(code) {
    const row = FxImpactEngine.getHistoricalSeries(code).at(-1);
    return {rate:row.rate, kind:"historical", source:"AfroTools FX_HISTORY", date:row.month};
  }
  function reference(code) {
    const row = ledger[countries.get(code).currency];
    if (row && Number.isFinite(row.rate) && row.rate > 0 && typeof row.source === "string" && row.source &&
        typeof row.observed_at === "string" && Number.isFinite(Date.parse(row.observed_at))) {
      return {rate:row.rate, kind:"observation", source:row.source, date:row.observed_at};
    }
    return historical(code);
  }
  function describe(info) {
    if (info.kind === "manual") return "Kiwango ulichoweka mwenyewe.";
    const labels = {historical:"Wastani wa mwezi katika rekodi ya kihistoria", observation:"Kiwango cha rejea kilichorekodiwa", saved:"Kiwango kutoka faili ulilofungua"};
    return [labels[info.kind], info.source, info.date && info.date.slice(0,10)].filter(Boolean).join(" Â· ");
  }
  function displayBasis() {
    form.querySelector("[data-rate-basis]").textContent = describe(basis);
    form.querySelectorAll("[data-currency]").forEach(el => { el.textContent = countries.get(f.countryCode.value).currency; });
  }
  function useReference() {
    basis = reference(f.countryCode.value);
    usingReference = true;
    f.fxRate.value = basis.rate;
    displayBasis();
  }
  function validate(input) {
    if (!input || !countries.has(input.countryCode)) throw new Error("Chagua nchi inayopatikana.");
    if (!Number.isFinite(input.usdAmount) || input.usdAmount <= 0) throw new Error("Weka kiasi cha USD kilicho zaidi ya sifuri.");
    if (!Number.isFinite(input.fxRate) || input.fxRate <= 0 || !Number.isFinite(input.fxRate * input.usdAmount * 1.2)) throw new Error("Weka kiwango halali cha kubadilisha fedha.");
    if (!changes.includes(input.scenarioPercent)) throw new Error("Chagua mabadiliko ya kiwango kutoka kwenye orodha.");
    if (input.maxSellingPrice !== null && (!Number.isFinite(input.maxSellingPrice) || input.maxSellingPrice <= 0)) throw new Error("Bei ya kuuza lazima iwe zaidi ya sifuri.");
    if (!Number.isFinite(input.otherCosts) || input.otherCosts < 0) throw new Error("Gharama nyingine haziwezi kuwa hasi.");
    return input;
  }
  function readInput() {
    return validate({
      countryCode:f.countryCode.value, usdAmount:f.usdAmount.valueAsNumber, fxRate:f.fxRate.valueAsNumber,
      rateBasis:{kind:basis.kind,source:basis.source,date:basis.date},
      scenarioPercent:Number(f.scenarioPercent.value), maxSellingPrice:f.maxSellingPrice.value === "" ? null : f.maxSellingPrice.valueAsNumber,
      otherCosts:f.otherCosts.value === "" ? 0 : f.otherCosts.valueAsNumber
    });
  }
  function restoreInput(payload) {
    const input = { ...payload.input };
    if (!countries.has(input.countryCode)) throw new Error("Nchi katika faili haitumiki.");
    if (!input.maxSellingPrice) input.maxSellingPrice = null;
    input.otherCosts ??= 0;
    const info = input.rateBasis || {};
    const recovered = input.fxRate ?? payload.result?.current?.rate;
    if (recovered == null) {
      const old = historical(input.countryCode);
      input.fxRate = old.rate;
      input.rateBasis = old;
    } else {
      input.fxRate = recovered;
      input.rateBasis = {kind:"saved",source:typeof info.source === "string" ? info.source.slice(0,120) : "",date:typeof info.date === "string" ? info.date.slice(0,30) : ""};
    }
    return validate(input);
  }
  function setInput(input) {
    f.countryCode.value = input.countryCode;
    f.usdAmount.value = input.usdAmount;
    f.scenarioPercent.value = input.scenarioPercent;
    f.maxSellingPrice.value = input.maxSellingPrice ?? "";
    f.otherCosts.value = input.otherCosts ?? 0;
    if (input.fxRate == null) useReference();
    else {
      usingReference = false;
      basis = input.rateBasis || {kind:"manual",source:"",date:""};
      f.fxRate.value = input.fxRate;
      displayBasis();
    }
  }
  function calculate(input) {
    const current = FxImpactEngine.calculateImpact(input.usdAmount,input.countryCode,input.fxRate);
    const allScenarios = FxImpactEngine.modelScenarios(input.usdAmount,input.countryCode,input.fxRate);
    const selectedScenario = allScenarios.find(row => row.changePercent === input.scenarioPercent);
    const breakeven = input.maxSellingPrice > input.otherCosts ? FxImpactEngine.calcBreakeven(input.maxSellingPrice,input.usdAmount,input.otherCosts) : null;
    return {current, selectedScenario, allScenarios, breakeven,rateBasis:input.rateBasis};
  }
  function rows(result) {
    const base = result.current, scenario = result.selectedScenario;
    const local = amount => moneyFormat.format(amount) + " " + base.currency;
    const unit = base.currency + "/USD";
    const info = result.rateBasis || {kind:"manual",source:"",date:""};
    const lines = [["Malipo kwa msambazaji", moneyFormat.format(base.usdAmount) + " USD"],
      ["Kiwango cha msingi", rateFormat.format(base.rate) + " " + unit],
      ["Chanzo na tarehe ya kiwango", describe(info)],
      ["Gharama ya msingi kwa fedha za nchi",local(base.localCost)],
      ["Mabadiliko uliyochagua", scenario.changePercent + "%"],
      ["Kiwango katika hali hii",rateFormat.format(scenario.localCost / base.usdAmount) + " " + unit],
      ["Gharama baada ya mabadiliko",local(scenario.localCost)],["Tofauti ya gharama",local(scenario.delta)]];
    if (result.breakeven) lines.push(["Kiwango cha juu cha kutopata hasara",rateFormat.format(result.breakeven.breakevenRate) + " " + unit]);
    else lines.push(["Kiwango cha kutopata hasara","Weka bei ya kuuza iliyo juu ya gharama nyingine ili kupata kiwango hiki."]);
    return lines;
  }
  for (const [code, country] of countries) f.countryCode.add(new Option(regionNames.of(code) + " (" + country.currency + ")",code));
  for (const change of changes) f.scenarioPercent.add(new Option((change > 0 ? "+" : "") + change + "%",String(change)));
  f.fxRate.addEventListener("input", () => { usingReference = false; basis = {kind:"manual",source:"",date:""}; displayBasis(); });
  f.countryCode.addEventListener("change", () => { f.maxSellingPrice.value = ""; f.otherCosts.value = ""; useReference(); });
  form.querySelector("[data-use-rate]").addEventListener("click", () => { useReference(); f.fxRate.dispatchEvent(new Event("change",{bubbles:true})); });
  form.addEventListener("reset", () => setTimeout(() => setInput(config.input),0));
  setInput(config.input);
  window.swTradeForm = {readInput, setInput, restoreInput, validate, calculate, rows};
  fetch("/data/forex/latest.json",{cache:"no-cache"}).then(response => {
    if (!response.ok) throw new Error("FX");
    return response.json();
  }).then(data => {
    if (data.base !== "USD" || !data.rate_observations) return;
    ledger = data.rate_observations;
    if (usingReference && document.querySelector("[data-result]").hidden) useReference();
  }).catch(() => { /* The dated historical reference and editable quote remain available. */ });
})();

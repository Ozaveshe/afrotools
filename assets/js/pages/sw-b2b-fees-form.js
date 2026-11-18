"use strict";

(function () {
  const form = document.querySelector("[data-b2b-fees]");
  if (!form) return;
  const fields = form.elements;
  const providers = PaymentComparatorEngine.getAllProviders();
  const money = new Intl.NumberFormat("sw", {minimumFractionDigits: 2, maximumFractionDigits: 2});
  for (const provider of providers) fields.providerId.add(new Option(provider.name, provider.id));
  function validate(input) {
    if (!input || !Number.isFinite(input.amountUsd) || input.amountUsd <= 0 || input.amountUsd > Number.MAX_SAFE_INTEGER) throw new Error("Weka kiasi halali cha malipo kwa USD.");
    if (!PaymentComparatorEngine.getSchedule(input.frequency)) throw new Error("Chagua ratiba ya malipo inayopatikana.");
    if (!providers.some(provider => provider.id === input.providerId)) throw new Error("Chagua mtoa huduma anayeonekana kwenye orodha.");
    return input;
  }
  function readInput() {
    return validate({amountUsd: fields.amountUsd.valueAsNumber, frequency: fields.frequency.value, providerId: fields.providerId.value});
  }
  function restoreInput(payload) {
    const input = {...payload.input};
    if (typeof input.amountUsd === "string" && input.amountUsd.trim()) input.amountUsd = Number(input.amountUsd);
    validate(input);
    input.frequency = PaymentComparatorEngine.getSchedule(input.frequency).id;
    return input;
  }
  function setInput(input) {
    validate(input);
    fields.amountUsd.value = input.amountUsd;
    fields.providerId.value = input.providerId;
    fields.frequency.value = PaymentComparatorEngine.getSchedule(input.frequency).id;
  }
  function rows(result) {
    const scenario = result.scenario;
    const lines = [["Mtoa huduma",scenario.providerName],["Malipo kwa mwaka",scenario.paymentsPerYear],
      ["Ada kwa kila malipo (USD)",money.format(scenario.perTxnFee)],["Wastani wa ada kwa mwezi (USD)",money.format(scenario.monthlyFee)],
      ["Ada zote kwa mwaka (USD)",money.format(scenario.annualFee)],["Kiasi kinachotumwa kwa mwaka (USD)",money.format(scenario.annualVolume)]];
    for (const item of result.comparison) lines.push(["Ada kwa kila malipo: " + item.name + " (USD)",money.format(item.estimatedFee)]);
    lines.push(["Ukomo","Makadirio ya kupanga tu. Thibitisha gharama, sarafu na upatikanaji wa huduma kwa nchi husika."]);
    return lines;
  }
  const defaults = window.__SW_TRADE_CORE_CONFIG__.input;
  setInput(defaults);
  form.addEventListener("reset",() => setTimeout(() => setInput(defaults),0));
  window.swTradeForm = {validate,readInput,setInput,restoreInput,rows};
})();

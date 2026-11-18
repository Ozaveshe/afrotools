"use strict";

(function () {
  const config = window.__SW_TRADE_CORE_CONFIG__;
  if (!config || config.id !== "demurrage-calculator") return;
  const form = document.querySelector("[data-trade-form]");
  const fields = form.elements;
  const ports = PORT_DEMURRAGE.ports;
  const money = new Intl.NumberFormat("sw", { maximumFractionDigits: 2 });
  for (const port of Object.values(ports)) {
    fields.portCode.add(new Option(port.name + " — " + port.city, port.code));
  }

  function supported(value, choices) {
    return typeof value === "string" && Object.prototype.hasOwnProperty.call(choices, value);
  }
  function validate(input) {
    if (!input || !supported(input.portCode, ports)) throw new Error("Chagua bandari iliyo kwenye orodha.");
    const port = ports[input.portCode];
    if (!supported(input.containerType, port.demurrageRates)) throw new Error("Chagua ukubwa wa kontena unaopatikana.");
    if (!Number.isSafeInteger(input.daysAtPort) || input.daysAtPort < 1) throw new Error("Weka idadi kamili ya siku, kuanzia moja.");
    if (!Number.isFinite(input.fxRateLocalPerUsd) || input.fxRateLocalPerUsd <= 0) throw new Error("Weka kiwango cha ubadilishaji kilicho zaidi ya sifuri.");
    return input;
  }
  function configurePort() {
    const port = ports[fields.portCode.value];
    fields.containerType.replaceChildren();
    for (const size of Object.keys(port.demurrageRates)) {
      fields.containerType.add(new Option("Futi " + parseInt(size, 10), size));
    }
    const usd = port.currency === "USD";
    fields.fxRateLocalPerUsd.parentElement.hidden = usd;
    fields.fxRateLocalPerUsd.disabled = usd;
    fields.fxRateLocalPerUsd.value = usd ? "1" : "";
    form.querySelector("[data-fx-label]").textContent = port.currency + " kwa dola 1 ya Marekani (USD)";
  }
  function setInput(input) {
    validate(input);
    fields.portCode.value = input.portCode;
    configurePort();
    fields.containerType.value = input.containerType;
    fields.daysAtPort.value = input.daysAtPort;
    fields.fxRateLocalPerUsd.value = input.fxRateLocalPerUsd;
  }
  function readInput() {
    return validate({ portCode: fields.portCode.value, containerType: fields.containerType.value,
      daysAtPort: fields.daysAtPort.valueAsNumber, fxRateLocalPerUsd: fields.fxRateLocalPerUsd.valueAsNumber });
  }
  function rows(result) {
    const lines = [
      ["Bandari", result.portName], ["Kontena", "Futi " + parseInt(result.containerType, 10)],
      ["Siku bandarini", result.daysAtPort], ["Siku bila tozo ya kuchelewa", result.freeDays],
      ["Siku zinazotozwa", result.paidDays], ["Tozo ya kuchelewa (USD)", money.format(result.demurrageUSD)],
      ["Hifadhi (USD)", money.format(result.storageChargesUSD)], ["Ada nyingine (USD)", money.format(result.additionalChargesUSD)],
      ["Jumla ya makadirio (USD)", money.format(result.totalUSD)]
    ];
    if (result.currency !== "USD") lines.push(["Kiwango cha ubadilishaji (" + result.currency + " kwa USD)", fields.fxRateLocalPerUsd.value]);
    for (const tier of result.breakdown) {
      lines.push(["Siku " + tier.daysInTier + " kwa " + money.format(tier.ratePerDay) + " " + tier.currency + " kwa siku", money.format(tier.cost) + " " + tier.currency]);
    }
    return lines;
  }
  fields.portCode.addEventListener("change", configurePort);
  form.addEventListener("reset", () => setTimeout(() => setInput(config.input), 0));
  setInput(config.input);
  window.swDemurrageForm = { readInput, setInput, validate, rows };
})();

"use strict";

(function () {
  const config = window.__SW_TRADE_CORE_CONFIG__;
  if (!config || config.id !== "shipping-estimator") return;

  const form = document.querySelector("[data-trade-form]");
  const fields = form.elements;
  const sizes = {
    "20ft": "Kontena la futi 20",
    "40ft": "Kontena la futi 40",
    "40ftHC": "Kontena refu la futi 40",
    LCL: "Sehemu ya kontena (LCL)"
  };
  const origins = ShippingEngine.getOriginPorts().filter(port => ShippingEngine.getDestinations(port.code).length);
  const names = new Map([...origins, ...ShippingEngine.getDestPorts()].map(port => [port.code, port.name]));
  const format = new Intl.NumberFormat("sw", { maximumFractionDigits: 2 });
  const range = (low, high) => format.format(low) + "–" + format.format(high);
  function routeFor(input) {
    return ShippingEngine.findRoute(input.originCode, input.destCode);
  }
  function sizeAvailable(route, size) {
    return route && route.sea && Object.hasOwn(sizes, size) && route.sea[size === "LCL" ? "LCL_cbm" : size];
  }
  function airAvailable(route, size) {
    return Boolean(route && route.air && route.air.perKg && (size === "20ft" || size === "LCL"));
  }
  function validate(input) {
    if (!input || !origins.some(port => port.code === input.originCode)) throw new Error("Chagua bandari ya kuondokea yenye njia iliyorekodiwa.");
    const route = routeFor(input);
    if (!route) throw new Error("Hakuna bei iliyorekodiwa kwa njia hii. Chagua bandari nyingine.");
    if (!sizeAvailable(route, input.containerType)) throw new Error("Hakuna bei ya aina hii ya kontena kwa njia uliyochagua.");
    if (input.containerType === "LCL" && !(Number.isFinite(input.cbm) && input.cbm > 0))
      throw new Error("Weka ujazo wa mzigo ulio zaidi ya sifuri, kwa mita za ujazo.");
    if (airAvailable(route, input.containerType) && !(Number.isFinite(input.weightKg) && input.weightKg > 0))
      throw new Error("Weka uzito wa mzigo ulio zaidi ya sifuri, kwa kilogramu.");
    return input;
  }
  function readInput() {
    return validate({ originCode:fields.originCode.value, destCode:fields.destCode.value, containerType:fields.containerType.value,
      cbm:fields.cbm.disabled ? null : fields.cbm.valueAsNumber, weightKg:fields.weightKg.disabled ? null : fields.weightKg.valueAsNumber });
  }
  function configureAmounts() {
    const route = ShippingEngine.findRoute(fields.originCode.value, fields.destCode.value);
    for (const [field, relevant] of [[fields.cbm, fields.containerType.value === "LCL"], [fields.weightKg, airAvailable(route, fields.containerType.value)]]) {
      field.disabled = !relevant;
      field.parentElement.hidden = !relevant;
    }
  }
  function configureSizes(preferred) {
    const route = ShippingEngine.findRoute(fields.originCode.value, fields.destCode.value);
    fields.containerType.replaceChildren(...Object.entries(sizes).filter(([key]) => sizeAvailable(route, key)).map(([key, name]) => new Option(name, key)));
    if (sizeAvailable(route, preferred)) fields.containerType.value = preferred;
    configureAmounts();
  }
  function configureDestinations(preferred) {
    const destinations = ShippingEngine.getDestinations(fields.originCode.value);
    fields.destCode.replaceChildren(...destinations.map(port => new Option(port.name, port.code)));
    if (destinations.some(port => port.code === preferred)) fields.destCode.value = preferred;
    configureSizes(fields.containerType.value);
  }
  function setInput(input) {
    validate(input);
    fields.originCode.value = input.originCode;
    configureDestinations(input.destCode);
    fields.containerType.value = input.containerType;
    configureAmounts();
    fields.cbm.value = input.cbm ?? "";
    fields.weightKg.value = input.weightKg ?? "";
  }
  function rows(result) {
    const sea = result.sea, air = result.air;
    const lines = [["Njia", names.get(result.originCode) + " → " + names.get(result.destCode)],
      ["Mzigo wa baharini", sizes[result.containerType]],
      ["Gharama ya baharini (USD)", range(sea.minUSD, sea.maxUSD)],
      ["Muda wa baharini", range(sea.transitDays.min, sea.transitDays.max) + " siku"]];
    if (sea.perCBM) lines.push(["Hesabu ya sehemu ya kontena", format.format(sea.cbm) + " m³ × " + range(sea.perCBM.min, sea.perCBM.max) + " USD/m³"]);
    if (air && Number.isFinite(air.minUSD) && Number.isFinite(air.maxUSD)) {
      lines.push(["Gharama ya anga (USD)", range(air.minUSD, air.maxUSD)],
        ["Hesabu ya anga", format.format(air.weightKg) + " kg × " + range(air.perKg.min, air.perKg.max) + " USD/kg"],
        ["Muda wa anga", range(air.transitDays.min, air.transitDays.max) + " siku"]);
    } else lines.push(["Usafiri wa anga", "Hakuna makisio ya anga kwa chaguo hili."]);
    lines.push(["Msingi wa bei", "Viwango vya makadirio vya Machi 2026. Ada za mahali pa kuondokea, nyaraka na mahali pa kuwasili hazijajumuishwa. Omba nukuu ya sasa kwa msafirishaji."]);
    return lines;
  }
  fields.originCode.replaceChildren(...origins.map(port => new Option(port.name, port.code)));
  fields.originCode.addEventListener("change", () => configureDestinations(fields.destCode.value));
  fields.destCode.addEventListener("change", () => configureSizes(fields.containerType.value));
  fields.containerType.addEventListener("change", configureAmounts);
  form.addEventListener("reset", () => setTimeout(() => setInput(config.input), 0));
  setInput(config.input);
  window.swTradeForm = { readInput, setInput, validate, rows };
})();

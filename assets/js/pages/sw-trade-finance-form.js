"use strict";

(function () {
  const config = window.__SW_TRADE_CORE_CONFIG__;
  const form = document.querySelector("[data-credit-form]");
  if (!form) return;
  const lc = config.id === "lc-calculator", fields = form.elements;
  const countryNames = new Intl.DisplayNames(["sw"], { type: "region" });
  const number = new Intl.NumberFormat("sw", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  const lcNames = {
    sight: "Malipo baada ya kuwasilisha hati", standby: "LC ya dhamana", revolving: "LC inayojirudia", transferable: "LC inayohamishika"
  };
  const instrumentNames = {
    lc_sight: "LC ya malipo baada ya kuwasilisha hati", lc_usance: "LC ya malipo yaliyoahirishwa",
    tt_advance: "Uhamisho wa fedha mapema (T/T)", cad: "Malipo dhidi ya hati (CAD)",
    open_account: "Akaunti wazi", sblc: "LC ya dhamana (SBLC)"
  };
  const chargeNames = {
    issuance: "Ada ya kutoa LC", confirmation: "Ada ya uthibitisho", negotiation: "Ada ya kushughulikia hati",
    advising: "Ada ya taarifa ya benki", swift: "Ada ya SWIFT", courier: "Usafirishaji wa hati", tenor: "Ada ya kipindi cha malipo", amendments: "Ada za marekebisho",
    "LC Opening Commission": "Ada ya kufungua LC", "Confirmation Fee": "Ada ya uthibitisho",
    "SWIFT Charges": "Ada ya SWIFT", "Courier / Document Handling": "Usafirishaji na utunzaji wa hati",
    "Usance / Acceptance Fee": "Ada ya kuahirisha malipo", "Wire Transfer Fee": "Ada ya uhamisho wa fedha",
    "FX Margin / Spread": "Gharama ya kubadilisha sarafu", "Documentary Collection Fee": "Ada ya ukusanyaji wa hati",
    "SWIFT / Courier Charges": "Ada za SWIFT na usafirishaji", "Bank Transfer Fee": "Ada ya uhamisho wa benki",
    "Annual Guarantee Fee": "Ada ya dhamana ya mwaka", "Issuance / Setup Fee": "Ada ya kuanzisha dhamana"
  };
  const kind = lc ? "lcType" : "instrumentId", amount = lc ? "lcValue" : "tradeValue";
  const options = lc ? Object.keys(LcFeeEngine.getLcTypes()) : TradeFinanceData.instruments.map(item => item.id);
  const countries = lc ? LcFeeEngine.getAllCountries().map(item => item.code) :
    Object.keys(TradeFinanceData.instruments[0].typicalCosts).filter(code => TradeFinanceData.instruments.every(item => Object.hasOwn(item.typicalCosts, code)));
  function name(id) {
    return lc ? lcNames[id] || "Malipo baada ya siku " + LcFeeEngine.getLcTypes()[id].tenorDays : instrumentNames[id];
  }
  for (const code of countries) fields.countryCode.add(new Option(countryNames.of(code),code));
  for (const id of options) fields[kind].add(new Option(name(id),id));
  function validate(input) {
    if (!input || !countries.includes(input.countryCode) || !options.includes(input[kind])) throw new Error("Chagua nchi na njia ya malipo kutoka kwenye orodha.");
    if (!Number.isFinite(input[amount]) || input[amount] <= 0 || input[amount] > Number.MAX_SAFE_INTEGER) throw new Error("Weka thamani halali zaidi ya sifuri kwa USD.");
    if (typeof input.confirmed !== "boolean") throw new Error("Chagua hali ya uthibitisho wa benki.");
    if (lc && (!Number.isSafeInteger(input.amendments) || input.amendments < 0 || typeof input.includeMargin !== "boolean")) throw new Error("Kagua idadi ya marekebisho na chaguo la amana.");
    if (!lc && (!Number.isSafeInteger(input.tenorDays) || input.tenorDays < 30 || input.tenorDays > 180)) throw new Error("Weka muda kati ya siku 30 na 180.");
    return input;
  }
  function readInput() {
    const input = {countryCode: fields.countryCode.value, [kind]: fields[kind].value, [amount]: fields[amount].valueAsNumber, confirmed: fields.confirmed.checked};
    if (lc) { input.amendments = fields.amendments.valueAsNumber; input.includeMargin = fields.includeMargin.checked; }
    else input.tenorDays = fields.tenorDays.valueAsNumber;
    return validate(input);
  }
  function restoreInput(payload) {
    const input = {...payload.input};
    for (const key of [amount, lc ? "amendments" : "tenorDays"]) {
      if (typeof input[key] === "string" && input[key].trim()) input[key] = Number(input[key]);
    }
    return validate(input);
  }
  function setInput(input) {
    validate(input);
    for (const [key,value] of Object.entries(input)) {
      const field = fields.namedItem(key);
      if (!field) continue;
      if (field.type === "checkbox") field.checked = value;
      else field.value = value;
    }
  }
  function rows(report) {
    const r = lc ? report : report.calculation;
    const rows = [["Nchi",countryNames.of(r.countryCode)],["Njia ya malipo",name(r[kind])],
      ["Thamani ya biashara (USD)",number.format(r[amount])],["Jumla ya ada (USD)",number.format(lc ? r.totalFees : r.totalFee)],
      ["Amana ya dhamana (USD)",number.format((lc ? r.marginDeposit : r.marginRequired) || 0)],
      ["Thamani pamoja na ada (USD)",number.format(lc ? r.effectiveCostOfGoods : r.totalCost)]];
    if (lc) rows.push(["Ada pamoja na amana (USD)",number.format(r.totalCashRequired)],["Muda wa malipo (siku)",r.tenorDays]);
    for (const fee of r.breakdown) rows.push([(chargeNames[lc ? fee.id : fee.label] || fee.label) + " (USD)",number.format(fee.amount)]);
    if (!lc) for (const item of report.comparison) rows.push(["Ada za kulinganisha: " + name(item.id) + " (USD)",number.format(item.totalFee)]);
    rows.push(["Ukomo","Makadirio pekee. Amana ni dhamana, si ada. Thibitisha ada na masharti kwa benki yako."]);
    return rows;
  }
  setInput(config.input);
  form.addEventListener("reset",() => setTimeout(() => setInput(config.input),0));
  window.swTradeForm = {readInput,validate,setInput,restoreInput,rows};
})();

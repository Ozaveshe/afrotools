(function () {
  "use strict";
  const config = window.__SW_AGRI_CONFIG__;
  const root = document.querySelector("[data-sw-agriculture-app]");
  const form = root.querySelector("form");
  const status = root.querySelector("[data-status]");
  const box = root.querySelector("[data-result]");
  const output = root.querySelector("[data-output]");
  const field = key => form.elements.namedItem(key);
  const priceTool = config.id === "commodity-prices";
  const data = window.COMMODITY_PRICES;
  const crops = {maize:"Mahindi", rice:"Mchele uliokobolewa nchini", sorghum:"Mtama", millet:"Uwele", cowpea:"Kunde", cassava_garri:"Garri (muhogo uliochakatwa)", cocoa:"Kakao (punje zilizokaushwa)", coffee_arabica:"Kahawa ya Arabika (bichi)", sesame:"Ufuta", groundnut:"Karanga zilizomenywa"};
  const countries = new Intl.DisplayNames(["sw"], {type:"region"});
  const number = new Intl.NumberFormat("sw", {maximumFractionDigits: 4});
  let latest = null;
  let displayed = [];

  function markets(preferred) {
    const records = data.commodities[field("commodityKey").value].countryPrices;
    const select = field("countryCode");
    select.replaceChildren(...Object.entries(records).map(([code, row]) =>
      new Option(countries.of(code) + " — " + row.market, code)));
    if (Object.hasOwn(records, preferred)) select.value = preferred;
  }
  function setInput(input) {
    if (priceTool) {
      if (!Object.hasOwn(data.commodities, input.commodityKey) ||
          !Object.hasOwn(data.commodities[input.commodityKey].countryPrices, input.countryCode)) throw Error("Kagua zao na soko.");
      field("commodityKey").value = input.commodityKey;
      markets(input.countryCode);
      field("volumeTonnes").value = input.volumeTonnes ?? "";
    } else {
      for (const key of Object.keys(config.input)) field(key).value = input[key] ?? "";
    }
  }
  if (priceTool) {
    for (const key of Object.keys(data.commodities)) field("commodityKey").add(new Option(crops[key] || data.commodities[key].name, key));
    field("commodityKey").addEventListener("change", () => markets(field("countryCode").value));
  }
  setInput(config.input);
  function run(input) {
    if (priceTool) {
      if (!(Number.isFinite(input.volumeTonnes) && input.volumeTonnes > 0)) throw Error("Ingiza kiasi cha tani kikubwa kuliko sifuri.");
      return window.AfroTools.CommodityPriceEngine.calculate(input, data);
    }
    if (!/^[A-Z]{3}$/.test(input.currency) || !Number.isFinite(input.farmValue) || input.farmValue <= 0 ||
      ![input.excess,input.premiumRate].every(value => Number.isFinite(value) && value >= 0 && value <= 100)) throw Error("Kagua sarafu, thamani ya bima na asilimia (0–100).");
    return window.AfroTools.CropInsuranceHubEngine.calculate(input);
  }
  function read() {
    const input = {};
    for (const key of Object.keys(config.input)) {
      const el = field(key);
      input[key] = el.type === "number" ? el.valueAsNumber : el.value.trim();
    }
    if (input.currency) input.currency = input.currency.toUpperCase();
    return input;
  }
  function rows(r) {
    const i = r.input;
    const amount = value => (priceTool ? r.price.currency : i.currency) + " " + number.format(value);
    if (!priceTool) return [
      ["Thamani iliyowekewa bima", amount(i.farmValue)],
      ["Ada ya bima (" + number.format(i.premiumRate) + "%)", amount(r.premium)],
      ["Sehemu unayobeba mwenyewe (" + number.format(i.excess) + "%)", amount(r.retainedExcess)],
      ["Msingi wa makadirio", "Asilimia zote zinatumika kwa thamani uliyoweka. Hakiki msingi wa makato, hatari zinazolindwa na masharti ya madai kwa mtoa bima. Haya ni makadirio pekee."]
    ];
    return [
      ["Zao", crops[i.commodityKey]], ["Nchi na soko", countries.of(i.countryCode) + " — " + r.price.market],
      ["Bei ya kumbukumbu kwa tani", amount(r.price.current)], ["Mwezi mmoja kabla (kwa tani)", amount(r.price.monthAgo)],
      ["Mwaka mmoja kabla (kwa tani)", amount(r.price.yearAgo)], ["Kiasi cha kuuza (tani)", number.format(i.volumeTonnes)],
      ["Thamani kwa bei ya kumbukumbu", amount(r.revenue.current)],
      ["Sasisho la mkusanyo wa data", r.source.lastUpdated],
      ["Vyanzo vya mkusanyo", "FEWS NET, FAO FPMA, WFP VAM na mifumo ya kitaifa ya taarifa za masoko."],
      ["Ukomo wa bei", "Rekodi hii haina tarehe ya uchunguzi wa soko wala rejea ya bei moja kwa moja. Thibitisha bei ya leo na mnunuzi kabla ya kuuza."]
    ];
  }
  function clear(message) {
    latest = null;
    displayed = [];
    box.hidden = true;
    output.replaceChildren();
    status.textContent = message;
  }
  function calculate() {
    const result = run(read());
    if (!result.ok) throw Error("Kagua maelezo uliyoingiza.");
    displayed = rows(result);
    output.replaceChildren(...displayed.flatMap(([k,v]) => [k,v].map((value,index) => {
      const node = document.createElement(index ? "dd" : "dt");
      node.textContent = value;
      return node;
    })));
    latest = result;
    box.hidden = false;
    status.textContent = "Matokeo yako yako tayari.";
    box.focus();
  }
  form.addEventListener("submit", event => {event.preventDefault(); try { calculate(); } catch (error) {clear(error.message);}});
  form.addEventListener("input", () => clear("Kokotoa tena baada ya mabadiliko."));
  form.addEventListener("reset", () => setTimeout(() => {setInput(config.input);clear("Fomu imewekwa upya.");}));
  function report() {
    return {schemaVersion:1,tool:config.id,locale:"sw",generatedAt:new Date().toISOString(),source:config.source,input:latest.input,result:latest,display:displayed,privacy:"local-only"};
  }
  root.querySelector("[data-import]").addEventListener("change", async event => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const saved = JSON.parse(await file.text());
      if (saved.tool !== config.id || saved.locale !== "sw" || !saved.input) throw Error("Faili si ya programu hii.");
      setInput(saved.input);
      calculate();
      status.textContent = "Faili imefunguliwa na hesabu imerudiwa.";
    } catch (error) {clear("Imeshindikana kufungua faili. Kagua programu na thamani zilizo ndani.");}
    event.target.value = "";
  });
  root.addEventListener("click", event => {
    const button = event.target.closest("[data-export]");
    if (!latest || !button) return;
    const type = button.dataset.export;
    const filename = "afrotools-" + config.id + "." + type;
    const text = [config.name, ...displayed.map(([k,v]) => k + ": " + v)].join("\n");
    if (type === "pdf") {
      if (!window.jspdf) {status.textContent = "Moduli ya PDF haikupatikana.";return;}
      const pdf = new window.jspdf.jsPDF();
      pdf.text(pdf.splitTextToSize(text,175),15,20);
      pdf.save(filename);
      return;
    }
    const csv = () => [["Sehemu","Thamani"],...displayed].map(row => row.map(value => '"' + String(value).replace(/"/g,'""') + '"').join(",")).join("\r\n");
    const content = type === "json" ? JSON.stringify(report(),null,2) : type === "csv" ? csv() : text;
    const url = URL.createObjectURL(new Blob([content],{type:{json:"application/json",csv:"text/csv",txt:"text/plain"}[type]}));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url),5000);
  });
  window.__SW_AGRI_TEST__ = {run,getLatest:() => latest,report};
})();

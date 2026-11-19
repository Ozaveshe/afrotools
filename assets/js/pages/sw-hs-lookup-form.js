"use strict";

(function () {
  const form = document.querySelector("[data-hs-form]");
  if (!form) return;
  const fields = form.elements;
  const countries = COUNTRY_DUTY_RATES;
  const names = new Intl.DisplayNames(["sw"], { type: "region" });
  const glossary = {
    kahawa: "coffee", chai: "tea", mchele: "rice", mpunga: "rice", sukari: "sugar",
    jenereta: "generator", kompyuta: "computer", simu: "phone", viatu: "footwear",
    mahindi: "maize", ngano: "wheat", sabuni: "soap", pamba: "cotton", maziwa: "milk"
  };
  const descriptions = {
    "8517.13": "Simu mahiri",
    "8517.14": "Simu nyingine za mtandao wa simu au wa mawasiliano yasiyotumia waya",
    "8541.42": "Seli za sola ambazo bado hazijaunganishwa kuwa moduli au paneli",
    "8541.43": "Seli za sola zilizounganishwa kuwa moduli au paneli",
    "8541.49": "Vifaa vingine vya nusu kondakta vinavyoitikia mwanga",
    "0901.11": "Kahawa isiyokaangwa, yenye kafeini",
    "0901.12": "Kahawa isiyokaangwa, iliyoondolewa kafeini",
    "0901.21": "Kahawa iliyokaangwa, yenye kafeini",
    "0901.22": "Kahawa iliyokaangwa, iliyoondolewa kafeini",
    "1001.11": "Ngano aina ya durum kwa ajili ya kupanda",
    "1001.19": "Ngano aina ya durum kwa matumizi mengine",
    "1001.91": "Ngano nyingine na mchanganyiko wa ngano na rai (meslin) kwa kupanda",
    "1001.99": "Ngano nyingine na mchanganyiko wa ngano na rai (meslin) kwa matumizi mengine",
    "1006.10": "Mpunga wenye maganda",
    "1006.20": "Mchele wa kahawia uliotolewa maganda ya nje",
    "1006.30": "Mchele uliokobolewa kwa sehemu au kikamilifu",
    "1006.40": "Mchele uliovunjika"
  };
  const hint = form.querySelector("[data-match-count]");
  const choices = form.querySelector("[data-countries]");
  const defaults = window.__SW_TRADE_CORE_CONFIG__.input.countries;
  for (const code of Object.keys(countries)) {
    const label = document.createElement("label"), checkbox = document.createElement("input");
    checkbox.type = "checkbox"; checkbox.name = "country"; checkbox.value = code;
    checkbox.defaultChecked = defaults.includes(code);
    label.append(checkbox, document.createTextNode(names.of(code)));
    choices.append(label);
  }
  function matches(value) {
    const query = String(value || "").toLowerCase().trim();
    if (!query) return [];
    if (/^[0-9.\s]+$/.test(query)) {
      const digits = query.replace(/[.\s]/g, "");
      return digits ? HS_DATABASE.searchIndex.filter(item => item.code.replace(".", "").startsWith(digits)) : [];
    }
    const translated = Object.prototype.hasOwnProperty.call(glossary,query) ? glossary[query] : query;
    const engineMatches = HsLookupEngine.searchByProduct(translated);
    const found = new Set(engineMatches.map(item => item.code));
    const localMatches = HS_DATABASE.searchIndex.filter(item =>
      !found.has(item.code) && descriptions[item.code]?.toLowerCase().includes(query)
    );
    return engineMatches.concat(localMatches);
  }
  function updateMatches() {
    const items = matches(fields.query.value);
    fields.code.replaceChildren(new Option("Chagua bidhaa inayolingana", ""));
    for (const item of items) fields.code.add(new Option(item.code + " — " + (descriptions[item.code] || item.description), item.code));
    if (items.length === 1) fields.code.value = items[0].code;
    hint.textContent = !fields.query.value.trim() ? "" : items.length ?
      "Chaguo zilizopatikana: " + items.length + "." :
      "Hakuna bidhaa iliyopatikana. Jaribu msimbo wa HS au jina la bidhaa kwa Kiingereza.";
  }
  function validate(input) {
    if (!input || typeof input.query !== "string" || !HsLookupEngine.lookupByCode(input.query)) throw new Error("Chagua msimbo wa bidhaa unaopatikana.");
    if (!Array.isArray(input.countries) || !input.countries.length || new Set(input.countries).size !== input.countries.length ||
        !input.countries.every(code => typeof code === "string" && Object.prototype.hasOwnProperty.call(countries,code))) throw new Error("Chagua angalau nchi moja kutoka kwenye orodha.");
    return input;
  }
  function restoreInput(payload) {
    const input = payload.input;
    const options = matches(input.query);
    const record = options.find(item => item.code === payload.result.item?.code);
    return validate({ query: record ? record.code : input.query, countries: input.countries });
  }
  function setInput(input) {
    validate(input);
    const item = HsLookupEngine.lookupByCode(input.query);
    fields.query.value = item.code;
    updateMatches();
    if (!Array.from(fields.code.options).some(option => option.value === item.code)) {
      fields.code.add(new Option(item.code + " — " + item.description, item.code));
    }
    fields.code.value = item.code;
    for (const box of choices.querySelectorAll("input")) box.checked = input.countries.includes(box.value);
  }
  function readInput() {
    return validate({ query: fields.code.value, countries: Array.from(choices.querySelectorAll(":checked"), box => box.value) });
  }
  function rows(result) {
    const item = result.item;
    const lines = [["Msimbo wa HS",item.code],[descriptions[item.code] ? "Bidhaa" : "Maelezo ya HS (Kiingereza)",descriptions[item.code] || item.description],
      ["Sura ya HS", item.chapter],["Aina ya makadirio","Hizi ni rejea za sura nzima. Thibitisha ushuru wa bidhaa, asili yake na tarehe kwa mamlaka ya forodha kabla ya kuagiza."]];
    for (const row of result.rates) {
      const code = Object.keys(countries).find(code => countries[code].name === row.country);
      lines.push([names.of(code),row.dutyTypical == null ? "Hakuna rejea ya sura" : "Rejea ya sura: " + row.dutyTypical + "%"]);
    }
    return lines;
  }
  fields.query.addEventListener("input",updateMatches);
  form.addEventListener("reset",() => setTimeout(updateMatches,0));
  updateMatches();
  window.swTradeForm = {validate,readInput,setInput,restoreInput,rows};
})();

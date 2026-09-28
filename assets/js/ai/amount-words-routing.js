/** Local, route-only discovery for the existing amount-to-words converters. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.AfroToolsAIAmountWordsRouting = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // Currency choices belong to tools/naira-to-words/index.html. No engine or
  // prefill capability is implied by a discovery match.
  var CURRENCIES = [
    { code: "NGN", label: "Nigerian naira", aliases: ["ngn", "naira", "nigeria", "nigerian", "naija"], toolId: "naira-to-words" },
    { code: "KES", label: "Kenyan shilling", aliases: ["kes", "ksh", "kenya", "kenyan"], toolId: "amount-words-ke" },
    { code: "GHS", label: "Ghana cedi", aliases: ["ghs", "cedi", "cedis", "ghana", "ghanaian"], toolId: "amount-words-gh" },
    { code: "ZAR", label: "South African rand", aliases: ["zar", "rand", "south africa", "south african"] },
    { code: "EGP", label: "Egyptian pound", aliases: ["egp", "egypt", "egyptian"] },
    { code: "ETB", label: "Ethiopian birr", aliases: ["etb", "birr", "ethiopia", "ethiopian"] },
    { code: "UGX", label: "Ugandan shilling", aliases: ["ugx", "uganda", "ugandan"] },
    { code: "TZS", label: "Tanzanian shilling", aliases: ["tzs", "tanzania", "tanzanian"] },
    { code: "XOF", label: "West African CFA franc", aliases: ["xof", "west african cfa", "cfa franc west"] },
    { code: "XAF", label: "Central African CFA franc", aliases: ["xaf", "central african cfa", "cfa franc central"] },
    { code: "MAD", label: "Moroccan dirham", aliases: ["mad", "morocco", "moroccan"] },
    { code: "RWF", label: "Rwandan franc", aliases: ["rwf", "rwanda", "rwandan"] },
    { code: "MWK", label: "Malawian kwacha", aliases: ["mwk", "malawi", "malawian"] },
    { code: "ZMW", label: "Zambian kwacha", aliases: ["zmw", "zambia", "zambian"] },
    { code: "USD", label: "US dollar", aliases: ["usd", "us dollar", "us dollars", "united states", "usa", "american dollars"] },
    { code: "GBP", label: "British pound", aliases: ["gbp", "british pound", "british pounds", "pound sterling", "united kingdom"] },
    { code: "EUR", label: "Euro", aliases: ["eur", "euro", "euros"] }
  ];

  function normalize(value) {
    return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/₦/g, " naira ").replace(/₵/g, " cedi ")
      .replace(/[^a-z0-9]+/g, " ").trim();
  }

  function contains(text, phrase) {
    return (" " + text + " ").indexOf(" " + phrase + " ") !== -1;
  }

  function choice(currency) {
    var toolId = currency.toolId || "naira-to-words";
    return { code: currency.code, label: currency.label, toolId: toolId, route: "/tools/" + toolId + "/" };
  }

  function getCurrencies() { return CURRENCIES.map(choice); }

  function detect(query) {
    if (typeof query !== "string" || !query.trim() || query.length > 1200) return null;
    var text = normalize(query);
    if (/\b(cv|resume|cover letter|essay|word (?:doc|document|file|invoice|template)|microsoft word|docx|pdf|translate|translation|word count|count words|number of words)\b/.test(text)) return null;
    if (/\b(?:write|draft|create|compose|explain|describe)\s+(?:a\s+)?\d+\s+(?:words?|letters?)\b|\bin\s+\d+\s+words?\b/.test(text)) return null;
    if (!/\b(words|letters|spell|spelled|spelling)\b|\b(?:to|in|into) word\b/.test(text)) return null;
    var matches = CURRENCIES.filter(function (currency) {
      return currency.aliases.some(function (alias) {
        if (alias === "mad" && !/\bMAD\b/.test(query)) return false;
        return contains(text, alias);
      });
    });
    var unknownCurrency = /\b(cad|aud|jpy|chf|cny|inr|aed|ghc|btc|bitcoin)\b/.test(text);
    var moneyWords = /\b(amounts?|sums?|money|currenc(?:y|ies)|cheques?|checks?|cedis?|naira|shillings?|rand|birr|dollars?|pounds?|euros?|francs?|kwacha|dirhams?)\b/.test(text) || unknownCurrency || matches.some(function (currency) { return contains(text, currency.code.toLowerCase()); });
    var numericFormat = /\b(?:to|in|into|as)\s+(?:words?|letters?)\b|\b(?:numbers?|digits?|numerals?)\s+words?\b|\bwords?\s+(?:from|for|of)\s+(?:a\s+)?(?:numbers?|digits?|numerals?|\d)\b|\bspell(?:ed|ing)?\s+(?:out\s+)?\d|\bspelled\s+out\b/.test(text);
    var namedQuantity = /\b(amounts?|sums?|numbers?|digits?|numerals?)\b/.test(text);
    var abbreviatedFormat = namedQuantity && /\b(?:amounts?|sums?|numbers?|digits?|numerals?)\s+(?:words?|letters?)\b|\bwords?\s+(?:from|for|of)\b|\bspell(?:ed|ing)?\s+out\b/.test(text);
    if (!numericFormat && !abbreviatedFormat) return null;
    if (/\bspell(?:ed|ing)?\b/.test(text) && !namedQuantity && !/\b\d+\b/.test(text)) return null;
    // A word count, writing task or bare country is not numeric formatting.
    if (!moneyWords && (!numericFormat || !/\b(?:numbers?|digits?|numerals?|\d+)\b/.test(text))) return null;
    var otherCountry = /\b(cameroon|canada|australia|germany|france|ireland|netherlands|senegal|zimbabwe|angola|algeria|benin|botswana|burkina faso|burundi|cape verde|cabo verde|central african republic|chad|comoros|congo|cote d ivoire|ivory coast|djibouti|equatorial guinea|eritrea|eswatini|gabon|gambia|guinea|guinea bissau|lesotho|liberia|libya|madagascar|mali|mauritania|mauritius|mozambique|namibia|niger|sao tome|seychelles|sierra leone|somalia|south sudan|sudan|togo|tunisia)\b/.test(text);
    var comparing = /\b(or|versus|vs|between|compare)\b/.test(text);
    var status = matches.length === 1 && !unknownCurrency && !otherCountry && !comparing ? "matched" : "choose_currency";
    return { status: status, currency: status === "matched" ? choice(matches[0]) : null, currencies: getCurrencies() };
  }

  return { detect: detect, getCurrencies: getCurrencies };
});

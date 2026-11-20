(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.engines = root.AfroTools.engines || {};
    root.AfroTools.engines.hausaNumberWords = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var ONES = ["sifili", "ɗaya", "biyu", "uku", "huɗu", "biyar", "shida", "bakwai", "takwas", "tara"];
  var TENS = ["", "goma", "ashirin", "talatin", "arba'in", "hamsin", "sittin", "saba'in", "tamanin", "casa'in"];
  var GROUPS = [
    [1000000000000, "tiriliyan"],
    [1000000000, "biliyan"],
    [1000000, "miliyan"],
    [1000, "dubu"]
  ];
  var UNITS = {
    NGN: ["Naira", "Kobo"], KES: ["Shilin", "Senti"], GHS: ["Sidi", "Pesewa"],
    ZAR: ["Rand", "Senti"], EGP: ["Fam", "Piastre"], ETB: ["Birr", "Santim"],
    UGX: ["Shilin", "Senti"], TZS: ["Shilin", "Senti"], XOF: ["Faransa CFA", "Santim"],
    XAF: ["Faransa CFA", "Santim"], MAD: ["Dirham", "Santim"], RWF: ["Faransa", "Santim"],
    MWK: ["Kwacha", "Tambala"], ZMW: ["Kwacha", "Ngwee"], USD: ["Dala", "Senti"],
    GBP: ["Fam", "Pence"], EUR: ["Yuro", "Senti"]
  };

  function underThousand(value) {
    var n = Number(value);
    if (n < 10) return ONES[n];
    if (n < 100) {
      var tens = Math.floor(n / 10);
      var remainder = n % 10;
      return TENS[tens] + (remainder ? " da " + ONES[remainder] : "");
    }
    var hundreds = Math.floor(n / 100);
    var rest = n % 100;
    return (hundreds === 1 ? "ɗari" : "ɗari " + ONES[hundreds]) + (rest ? " da " + underThousand(rest) : "");
  }

  function integer(value) {
    var n = Number(value);
    if (!Number.isSafeInteger(n) || n < 0 || n > 999999999999999) {
      throw new Error("Yi amfani da cikakkiyar lamba daga sifili zuwa tiriliyan 999.");
    }
    if (n < 1000) return underThousand(n);
    var parts = [];
    GROUPS.forEach(function (group) {
      if (n >= group[0]) {
        var count = Math.floor(n / group[0]);
        parts.push(group[1] + (count === 1 ? "" : " " + integer(count)));
        n %= group[0];
      }
    });
    if (n) parts.push(underThousand(n));
    return parts.join(" da ");
  }

  function parseAmount(value, currencyCode) {
    var raw = String(value == null ? "" : value).trim();
    var code = String(currencyCode || "NGN").toUpperCase();
    if (code === "NGN") raw = raw.replace(/^₦\s*/, "");
    if (raw.toUpperCase().startsWith(code)) raw = raw.slice(code.length).trimStart();
    if (/^\.\d{1,2}$/.test(raw)) raw = "0" + raw;
    if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(raw)) {
      throw new Error("Saka adadi kamar 1,250.50 ba tare da alamar ragi ba. Iyakar lambobin bayan digo biyu ce.");
    }
    var parts = raw.replace(/,/g, "").split(".");
    var major = Number(parts[0]);
    if (!Number.isSafeInteger(major) || major > 999999999999999) {
      throw new Error("Adadin ya yi yawa. Matsakaici shi ne 999,999,999,999,999.99.");
    }
    var fraction = (parts[1] || "").padEnd(2, "0");
    return { major: major, minor: Number(fraction), exact: major + "." + fraction };
  }

  function amount(value, currencyCode) {
    var code = String(currencyCode || "NGN").toUpperCase();
    var units = UNITS[code];
    if (!units) throw new Error("Ba a tallafa wa wannan nau'in kuɗi ba.");
    var parsed = parseAmount(value, code);
    var major = parsed.major;
    var minor = parsed.minor;
    return units[0] + " " + integer(major) + (minor ? " da " + units[1] + " " + integer(minor) : "") + " kacal";
  }

  return { integer: integer, amount: amount, parseAmount: parseAmount, units: UNITS };
});

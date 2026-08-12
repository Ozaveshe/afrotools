(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.engines = root.AfroTools.engines || {};
    root.AfroTools.engines.whatsappLink = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  function digits(value) { return String(value || "").replace(/\D/g, ""); }
  function normalize(countryCode, phone) {
    var code = digits(countryCode).replace(/^0+/, "");
    var local = digits(phone).replace(/^0+/, "");
    if (code.length < 1 || code.length > 4) throw new Error("Lambar ƙasa ba ta dace ba.");
    var full = local.indexOf(code) === 0 && local.length > code.length + 5 ? local : code + local;
    if (full.length < 7 || full.length > 15) throw new Error("Shigar da lambar waya mai lambobi 7 zuwa 15 tare da lambar ƙasa.");
    return full;
  }
  function build(countryCode, phone, message) {
    var normalized = normalize(countryCode, phone);
    var text = String(message || "").trim();
    var url = "https://wa.me/" + normalized + (text ? "?text=" + encodeURIComponent(text) : "");
    return {
      url: url,
      normalized: normalized,
      masked: "+" + normalized.slice(0, Math.max(2, normalized.length - 4)).replace(/./g, "•") + normalized.slice(-4),
      messageLength: text.length
    };
  }
  return { normalize: normalize, build: build };
});

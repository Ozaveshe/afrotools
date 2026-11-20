window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.jwtDecoder = function(e, t) {
  var locale = e && e.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr" ? "fr-FR" : "en";
  function translate(label) {
    return locale === "fr-FR" && french[label] || label;
  }
  var french = {
    "JWT Token": "Jeton JWT",
    Decode: "Décoder",
    Header: "En-tête",
    Payload: "Charge utile",
    Dark: "Mode sombre",
    "Paste JWT token here...": "Collez le jeton JWT ici…",
    "Invalid JWT: expected 3 parts, got ": "JWT invalide : le jeton doit contenir trois parties. Nombre reçu : "
  };
  var a = "dark" === ((t = t || {}).theme || "light"), o = a ? "#1a1a2e" : "#fff", r = a ? "#e0e0e0" : "#333", i = a ? "#16213e" : "#f5f7fa", l = a ? "#333" : "#ddd";
  e.innerHTML = '<div class="aw-jwt-decoder" style="font-family:\'Inter\',sans-serif;background:' + o + ";color:" + r + ";padding:20px;border-radius:10px;border:1px solid " + l + '"><div class="aw-field" style="margin-bottom:12px"><label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">' + translate("JWT Token") + '</label><textarea class="aw-input aw-jwt-input" style="width:100%;min-height:80px;padding:10px;border:1px solid ' + l + ";border-radius:6px;font-family:'Courier New',monospace;font-size:13px;background:" + i + ";color:" + r + ';resize:vertical;box-sizing:border-box" placeholder="' + translate("Paste JWT token here...") + '"></textarea></div><button class="aw-btn aw-btn--primary aw-jwt-decode" style="padding:8px 16px;background:#0062CC;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;margin-bottom:12px">' + translate("Decode") + '</button><div class="aw-jwt-status" style="font-size:12px;margin-bottom:8px"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div class="aw-field"><label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">' + translate("Header") + '</label><textarea class="aw-input aw-jwt-header" style="width:100%;min-height:120px;padding:10px;border:1px solid ' + l + ";border-radius:6px;font-family:'Courier New',monospace;font-size:13px;background:" + i + ";color:" + r + ';resize:vertical;box-sizing:border-box" readonly></textarea></div><div class="aw-field"><label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">' + translate("Payload") + '</label><textarea class="aw-input aw-jwt-payload" style="width:100%;min-height:120px;padding:10px;border:1px solid ' + l + ";border-radius:6px;font-family:'Courier New',monospace;font-size:13px;background:" + i + ";color:" + r + ';resize:vertical;box-sizing:border-box" readonly></textarea></div></div>' + (t.footerHTML ? '<div style="margin-top:12px">' + t.footerHTML + "</div>" : "") + "</div>";
  var n = e.querySelector(".aw-jwt-input"), d = e.querySelector(".aw-jwt-header"), s = e.querySelector(".aw-jwt-payload"), p = e.querySelector(".aw-jwt-status");
  function c(e) {
    var t = 4 - (e = e.replace(/-/g, "+").replace(/_/g, "/")).length % 4;
    return 4 !== t && (e += "=".repeat(t)), decodeURIComponent(escape(atob(e)));
  }
  function x() {
    var e = n.value.trim();
    if (!e) return d.value = "", s.value = "", void (p.textContent = "");
    var t = e.split(".");
    if (3 !== t.length) return p.style.color = "#dc2626", p.textContent = translate("Invalid JWT: expected 3 parts, got ") + t.length,
    d.value = "", void (s.value = "");
    try {
      var a = JSON.parse(c(t[0])), o = JSON.parse(c(t[1]));
      d.value = JSON.stringify(a, null, 2), s.value = JSON.stringify(o, null, 2);
      var info = [];
      const frenchOutput = locale === "fr-FR";
      const formatDate = seconds => new Intl.DateTimeFormat(frenchOutput ? "fr-FR" : undefined, {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(seconds * 1e3));
      if (Number.isFinite(o.exp)) info.push((o.exp * 1e3 < Date.now() ? frenchOutput ? "Expiré le " : "Expired: " : frenchOutput ? "Expire le " : "Expires: ") + formatDate(o.exp));
      if (Number.isFinite(o.iat)) info.push((frenchOutput ? "Émis le " : "Issued: ") + formatDate(o.iat));
      if (typeof a.alg === "string") info.push((frenchOutput ? "Algorithme déclaré : " : "Declared algorithm: ") + a.alg);
      info.push(frenchOutput ? "Signature non vérifiée." : "Signature not verified.");
      p.setAttribute("role", "status");
      p.textContent = info.join(" · ");
      p.style.color = r;
    } catch (e) {
      p.style.color = "#dc2626", p.textContent = locale === "fr-FR" ? "Décodage impossible. Vérifiez les trois parties du jeton et le JSON de son en-tête et de ses données." : "Error decoding: " + e.message,
      d.value = "", s.value = "";
    }
  }
  e.querySelector(".aw-jwt-decode").addEventListener("click", x), n.addEventListener("input", x);
};

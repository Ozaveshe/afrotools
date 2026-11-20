window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.jsonFormatter = function(t, e) {
  var locale = t && t.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr" ? "fr-FR" : "en";
  function translate(label) {
    return locale === "fr-FR" && french[label] || label;
  }
  var french = {
    "JSON Input": "JSON à traiter",
    Format: "Mettre en forme",
    Minify: "Minifier",
    Copy: "Copier",
    Output: "Résultat",
    Dark: "Mode sombre",
    "Copied!": "Copié !",
    "Computing...": "Calcul en cours…",
    "Valid JSON": "JSON valide",
    "Paste JSON here...": "Collez le JSON ici…",
    "Enter text to hash...": "Saisissez le texte à vérifier…",
    " Uppercase": " Majuscules",
    " Braces": " Accolades"
  };
  var o = "dark" === ((e = e || {}).theme || "light"), n = o ? "#1a1a2e" : "#fff", r = o ? "#e0e0e0" : "#333", i = o ? "#16213e" : "#f5f7fa", a = o ? "#333" : "#ddd";
  t.innerHTML = '<div class="aw-json-formatter" style="font-family:\'Inter\',sans-serif;background:' + n + ";color:" + r + ";padding:20px;border-radius:10px;border:1px solid " + a + '"><div class="aw-field" style="margin-bottom:12px"><label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">' + translate("JSON Input") + '</label><textarea class="aw-input aw-json-input" style="width:100%;min-height:160px;padding:10px;border:1px solid ' + a + ";border-radius:6px;font-family:'Courier New',monospace;font-size:13px;background:" + i + ";color:" + r + ';resize:vertical;box-sizing:border-box" placeholder="' + translate("Paste JSON here...") + '"></textarea></div><div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap"><button class="aw-btn aw-btn--primary aw-json-format" style="padding:8px 16px;background:#0062CC;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">' + translate("Format") + '</button><button class="aw-btn aw-json-minify" style="padding:8px 16px;background:' + i + ";color:" + r + ";border:1px solid " + a + ';border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">' + translate("Minify") + '</button><button class="aw-btn aw-json-copy" style="padding:8px 16px;background:' + i + ";color:" + r + ";border:1px solid " + a + ';border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">' + translate("Copy") + '</button></div><div class="aw-json-status" style="font-size:12px;margin-bottom:8px"></div><div class="aw-field"><label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">' + translate("Output") + '</label><textarea class="aw-input aw-json-output" style="width:100%;min-height:160px;padding:10px;border:1px solid ' + a + ";border-radius:6px;font-family:'Courier New',monospace;font-size:13px;background:" + i + ";color:" + r + ';resize:vertical;box-sizing:border-box" readonly></textarea></div>' + (e.footerHTML ? '<div style="margin-top:12px">' + e.footerHTML + "</div>" : "") + "</div>";
  var s = t.querySelector(".aw-json-input"), l = t.querySelector(".aw-json-output"), d = t.querySelector(".aw-json-status");
  function p(t) {
    try {
      var e = JSON.parse(t);
      return d.style.color = "#0062CC", d.textContent = translate("Valid JSON"), e;
    } catch (t) {
      return d.style.color = "#dc2626", d.textContent = locale === "fr-FR" ? "JSON invalide : vérifiez les guillemets, les virgules et les accolades." : "Invalid JSON: " + t.message,
      l.value = "", undefined;
    }
  }
  t.querySelector(".aw-json-format").addEventListener("click", function() {
    var t = p(s.value);
    undefined !== t && (l.value = JSON.stringify(t, null, 2));
  }), t.querySelector(".aw-json-minify").addEventListener("click", function() {
    var t = p(s.value);
    undefined !== t && (l.value = JSON.stringify(t));
  }), t.querySelector(".aw-json-copy").addEventListener("click", function() {
    var t = this;
    (async function() {
      try {
        await navigator.clipboard.writeText(l.value);
        t.textContent = translate("Copied!");
      } catch {
        l.focus();
        l.select();
        t.textContent = locale === "fr-FR" ? "Résultat sélectionné : utilisez la commande Copier" : "Output selected: use your Copy command";
      }
      setTimeout(function() {
        t.textContent = translate("Copy");
      }, 3e3);
    })();
  }), s.addEventListener("input", function() {
    l.value = "", s.value.trim() ? p(s.value) : d.textContent = "";
  });
};

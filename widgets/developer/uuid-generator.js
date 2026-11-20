window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.uuidGenerator = function(e, t) {
  var locale = e && e.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr" ? "fr-FR" : "en";
  function translate(label) {
    return locale === "fr-FR" && french[label] || label;
  }
  var french = {
    "Generate UUID": "Générer un UUID",
    Uppercase: "Majuscules",
    Braces: "Accolades",
    "Count:": "Nombre :",
    Copy: "Copier",
    Dark: "Mode sombre",
    "Copied!": "Copié !",
    "Computing...": "Calcul en cours…",
    "Valid JSON": "JSON valide",
    "Paste JSON here...": "Collez le JSON ici…",
    "Enter text to hash...": "Saisissez le texte à vérifier…",
    " Uppercase": " Majuscules",
    " Braces": " Accolades"
  };
  var i = "dark" === ((t = t || {}).theme || "light"), r = i ? "#1a1a2e" : "#fff", a = i ? "#e0e0e0" : "#333", o = i ? "#16213e" : "#f5f7fa", n = i ? "#333" : "#ddd";
  e.innerHTML = '<div class="aw-uuid-generator" style="font-family:\'Inter\',sans-serif;background:' + r + ";color:" + a + ";padding:20px;border-radius:10px;border:1px solid " + n + '"><div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap"><button class="aw-btn aw-btn--primary aw-uuid-gen" style="padding:8px 16px;background:#0062CC;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">' + translate("Generate UUID") + '</button><label style="display:flex;align-items:center;gap:6px;font-size:12px"><input type="checkbox" class="aw-uuid-upper">' + translate(" Uppercase") + '</label><label style="display:flex;align-items:center;gap:6px;font-size:12px"><input type="checkbox" class="aw-uuid-braces">' + translate(" Braces") + '</label><div style="display:flex;align-items:center;gap:6px;font-size:12px;margin-left:auto"><label>' + translate("Count:") + '</label><input type="number" class="aw-input aw-uuid-count" value="1" min="1" max="100" style="width:60px;padding:4px 6px;border:1px solid ' + n + ";border-radius:4px;font-size:12px;background:" + o + ";color:" + a + '"></div></div><div class="aw-field"><textarea class="aw-input aw-uuid-output" style="width:100%;min-height:120px;padding:10px;border:1px solid ' + n + ";border-radius:6px;font-family:'Courier New',monospace;font-size:13px;background:" + o + ";color:" + a + ';resize:vertical;box-sizing:border-box" readonly></textarea></div><div style="display:flex;gap:8px;margin-top:8px"><button class="aw-btn aw-uuid-copy" style="padding:6px 12px;background:' + o + ";color:" + a + ";border:1px solid " + n + ';border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit">' + translate("Copy") + "</button></div>" + (t.footerHTML ? '<div style="margin-top:12px">' + t.footerHTML + "</div>" : "") + "</div>";
  var d = e.querySelector(".aw-uuid-output");
  function p() {
    if (crypto.randomUUID) return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = bytes[6] & 15 | 64;
    bytes[8] = bytes[8] & 63 | 128;
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
    return [ hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20) ].join("-");
  }
  function x() {
    var t = parseInt(e.querySelector(".aw-uuid-count").value) || 1;
    t = Math.max(1, Math.min(100, t));
    for (var i = e.querySelector(".aw-uuid-upper").checked, r = e.querySelector(".aw-uuid-braces").checked, a = [], o = 0; o < t; o++) {
      var n = p();
      i && (n = n.toUpperCase()), r && (n = "{" + n + "}"), a.push(n);
    }
    d.value = a.join("\n");
  }
  e.querySelector(".aw-uuid-gen").addEventListener("click", x), e.querySelector(".aw-uuid-copy").addEventListener("click", function() {
    var e = this;
    (async function() {
      try {
        await navigator.clipboard.writeText(d.value);
        e.textContent = translate("Copied!");
      } catch {
        d.focus();
        d.select();
        e.textContent = locale === "fr-FR" ? "Résultat sélectionné : utilisez la commande Copier" : "Output selected: use your Copy command";
      }
      setTimeout(function() {
        e.textContent = translate("Copy");
      }, 3e3);
    })();
  }), x();
};

window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.urlEncoder = function(e, o) {
  var locale = e && e.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr" ? "fr-FR" : "en";
  function translate(label) {
    return locale === "fr-FR" && french[label] || label;
  }
  var french = {
    Encode: "Encoder",
    Decode: "Décoder",
    Input: "Entrée",
    Output: "Résultat",
    "Copy Output": "Copier le résultat",
    Swap: "Permuter",
    Dark: "Mode sombre",
    "Copied!": "Copié !",
    "0 characters": "0 caractère",
    " characters": " caractères",
    "Enter text...": "Saisissez du texte…",
    "Enter text or URL...": "Saisissez du texte ou une URL…",
    "Enter HTML or text...": "Saisissez du HTML ou du texte…",
    " URL-safe": " Compatible avec les URL",
    "Error: ": "Erreur : "
  };
  var t = "dark" === ((o = o || {}).theme || "light"), r = t ? "#1a1a2e" : "#fff", i = t ? "#e0e0e0" : "#333", n = t ? "#16213e" : "#f5f7fa", a = t ? "#333" : "#ddd", l = "#0062CC";
  e.innerHTML = '<div class="aw-url-encoder" style="font-family:\'Inter\',sans-serif;background:' + r + ";color:" + i + ";padding:20px;border-radius:10px;border:1px solid " + a + '"><div style="display:flex;gap:8px;margin-bottom:12px"><button class="aw-btn aw-btn--primary aw-url-encode" style="padding:8px 16px;background:' + l + ';color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">' + translate("Encode") + '</button><button class="aw-btn aw-url-decode" style="padding:8px 16px;background:' + n + ";color:" + i + ";border:1px solid " + a + ';border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">' + translate("Decode") + '</button></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div class="aw-field"><label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">' + translate("Input") + '</label><textarea aria-label="' + translate("Input") + '" class="aw-input aw-url-input" style="width:100%;min-height:140px;padding:10px;border:1px solid ' + a + ";border-radius:6px;font-family:'Courier New',monospace;font-size:13px;background:" + n + ";color:" + i + ';resize:vertical;box-sizing:border-box" placeholder="' + translate("Enter text or URL...") + '"></textarea></div><div class="aw-field"><label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">' + translate("Output") + '</label><textarea aria-label="' + translate("Output") + '" class="aw-input aw-url-output" style="width:100%;min-height:140px;padding:10px;border:1px solid ' + a + ";border-radius:6px;font-family:'Courier New',monospace;font-size:13px;background:" + n + ";color:" + i + ';resize:vertical;box-sizing:border-box" readonly></textarea></div></div><div style="display:flex;gap:8px;margin-top:8px"><button class="aw-btn aw-url-copy" style="padding:6px 12px;background:' + n + ";color:" + i + ";border:1px solid " + a + ';border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit">' + translate("Copy Output") + '</button><button class="aw-btn aw-url-swap" style="padding:6px 12px;background:' + n + ";color:" + i + ";border:1px solid " + a + ';border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit">' + translate("Swap") + "</button></div>" + (o.footerHTML ? '<div style="margin-top:12px">' + o.footerHTML + "</div>" : "") + "</div>";
  var d = !0, s = e.querySelector(".aw-url-input"), p = e.querySelector(".aw-url-output"), u = e.querySelector(".aw-url-encode"), c = e.querySelector(".aw-url-decode");
  function f() {
    var e = s.value;
    if (e) try {
      p.value = d ? encodeURIComponent(e) : decodeURIComponent(e);
    } catch (e) {
      p.value = locale === "fr-FR" ? "Encodage invalide : vérifiez la valeur à décoder." : "Error: " + e.message;
    } else p.value = "";
  }
  u.addEventListener("click", function() {
    d = !0, u.style.background = l, u.style.color = "#fff", u.style.border = "none",
    c.style.background = n, c.style.color = i, c.style.border = "1px solid " + a, f();
  }), c.addEventListener("click", function() {
    d = !1, c.style.background = l, c.style.color = "#fff", c.style.border = "none",
    u.style.background = n, u.style.color = i, u.style.border = "1px solid " + a, f();
  }), s.addEventListener("input", f), e.querySelector(".aw-url-copy").addEventListener("click", function() {
    var e = this;
    (async function() {
      try {
        await navigator.clipboard.writeText(p.value);
        e.textContent = translate("Copied!");
      } catch {
        p.focus();
        p.select();
        e.textContent = locale === "fr-FR" ? "Résultat sélectionné : utilisez la commande Copier" : "Output selected: use your Copy command";
      }
      setTimeout(function() {
        e.textContent = translate("Copy Output");
      }, 3e3);
    })();
  }), e.querySelector(".aw-url-swap").addEventListener("click", function() {
    var e = s.value;
    s.value = p.value, p.value = e;
  });
};

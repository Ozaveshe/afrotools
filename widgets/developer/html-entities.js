window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.htmlEntities = function(e, t) {
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
  var o = "dark" === ((t = t || {}).theme || "light"), r = o ? "#1a1a2e" : "#fff", i = o ? "#e0e0e0" : "#333", a = o ? "#16213e" : "#f5f7fa", n = o ? "#333" : "#ddd", l = "#0062CC";
  e.innerHTML = '<div class="aw-html-entities" style="font-family:\'Inter\',sans-serif;background:' + r + ";color:" + i + ";padding:20px;border-radius:10px;border:1px solid " + n + '"><div style="display:flex;gap:8px;margin-bottom:12px"><button class="aw-btn aw-btn--primary aw-he-encode" style="padding:8px 16px;background:' + l + ';color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">' + translate("Encode") + '</button><button class="aw-btn aw-he-decode" style="padding:8px 16px;background:' + a + ";color:" + i + ";border:1px solid " + n + ';border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">' + translate("Decode") + '</button></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div class="aw-field"><label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">' + translate("Input") + '</label><textarea aria-label="' + translate("Input") + '" class="aw-input aw-he-input" style="width:100%;min-height:140px;padding:10px;border:1px solid ' + n + ";border-radius:6px;font-family:'Courier New',monospace;font-size:13px;background:" + a + ";color:" + i + ';resize:vertical;box-sizing:border-box" placeholder="' + translate("Enter HTML or text...") + '"></textarea></div><div class="aw-field"><label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">' + translate("Output") + '</label><textarea aria-label="' + translate("Output") + '" class="aw-input aw-he-output" style="width:100%;min-height:140px;padding:10px;border:1px solid ' + n + ";border-radius:6px;font-family:'Courier New',monospace;font-size:13px;background:" + a + ";color:" + i + ';resize:vertical;box-sizing:border-box" readonly></textarea></div></div><div style="display:flex;gap:8px;margin-top:8px"><button class="aw-btn aw-he-copy" style="padding:6px 12px;background:' + a + ";color:" + i + ";border:1px solid " + n + ';border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit">' + translate("Copy Output") + '</button><button class="aw-btn aw-he-swap" style="padding:6px 12px;background:' + a + ";color:" + i + ";border:1px solid " + n + ';border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit">' + translate("Swap") + "</button></div>" + (t.footerHTML ? '<div style="margin-top:12px">' + t.footerHTML + "</div>" : "") + "</div>";
  var d = !0, s = e.querySelector(".aw-he-input"), p = e.querySelector(".aw-he-output"), c = e.querySelector(".aw-he-encode"), u = e.querySelector(".aw-he-decode"), f = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };
  function b() {
    var e = s.value;
    if (e) try {
      p.value = d ? e.replace(/[&<>"']/g, function(e) {
        return f[e];
      }) : function(e) {
        var t = document.createElement("textarea");
        return t.innerHTML = e, t.value;
      }(e);
    } catch (e) {
      p.value = locale === "fr-FR" ? "Encodage invalide : vérifiez la valeur à décoder." : "Error: " + e.message;
    } else p.value = "";
  }
  c.addEventListener("click", function() {
    d = !0, c.style.background = l, c.style.color = "#fff", c.style.border = "none",
    u.style.background = a, u.style.color = i, u.style.border = "1px solid " + n, b();
  }), u.addEventListener("click", function() {
    d = !1, u.style.background = l, u.style.color = "#fff", u.style.border = "none",
    c.style.background = a, c.style.color = i, c.style.border = "1px solid " + n, b();
  }), s.addEventListener("input", b), e.querySelector(".aw-he-copy").addEventListener("click", function() {
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
  }), e.querySelector(".aw-he-swap").addEventListener("click", function() {
    var e = s.value;
    s.value = p.value, p.value = e;
  });
};

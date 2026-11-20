window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.base64 = function(e, t) {
  var locale = e && e.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr" ? "fr-FR" : "en";
  function translate(label) {
    return locale === "fr-FR" && french[label] || label;
  }
  var french = {
    Encode: "Encoder",
    Decode: "Décoder",
    "URL-safe": "Compatible avec les URL",
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
  var o = "dark" === ((t = t || {}).theme || "light"), r = o ? "#1a1a2e" : "#fff", a = o ? "#e0e0e0" : "#333", n = o ? "#16213e" : "#f5f7fa", i = o ? "#333" : "#ddd", l = "#0062CC";
  e.innerHTML = '<div class="aw-base64" style="font-family:\'Inter\',sans-serif;background:' + r + ";color:" + a + ";padding:20px;border-radius:10px;border:1px solid " + i + '"><div style="display:flex;gap:8px;margin-bottom:12px"><button class="aw-btn aw-btn--primary aw-b64-encode" style="padding:8px 16px;background:' + l + ';color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">' + translate("Encode") + '</button><button class="aw-btn aw-b64-decode" style="padding:8px 16px;background:' + n + ";color:" + a + ";border:1px solid " + i + ';border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">' + translate("Decode") + '</button><label style="display:flex;align-items:center;gap:6px;font-size:12px;margin-left:auto"><input type="checkbox" class="aw-b64-urlsafe">' + translate(" URL-safe") + '</label></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div class="aw-field"><label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">' + translate("Input") + '</label><textarea aria-label="' + translate("Input") + '" class="aw-input aw-b64-input" style="width:100%;min-height:140px;padding:10px;border:1px solid ' + i + ";border-radius:6px;font-family:'Courier New',monospace;font-size:13px;background:" + n + ";color:" + a + ';resize:vertical;box-sizing:border-box" placeholder="' + translate("Enter text...") + '"></textarea><div class="aw-b64-input-count" style="font-size:11px;color:#888;margin-top:4px">' + translate("0 characters") + '</div></div><div class="aw-field"><label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">' + translate("Output") + '</label><textarea aria-label="' + translate("Output") + '" class="aw-input aw-b64-output" style="width:100%;min-height:140px;padding:10px;border:1px solid ' + i + ";border-radius:6px;font-family:'Courier New',monospace;font-size:13px;background:" + n + ";color:" + a + ';resize:vertical;box-sizing:border-box" readonly></textarea><div class="aw-b64-output-count" style="font-size:11px;color:#888;margin-top:4px">' + translate("0 characters") + '</div></div></div><div style="display:flex;gap:8px;margin-top:8px"><button class="aw-btn aw-b64-copy" style="padding:6px 12px;background:' + n + ";color:" + a + ";border:1px solid " + i + ';border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit">' + translate("Copy Output") + '</button><button class="aw-btn aw-b64-swap" style="padding:6px 12px;background:' + n + ";color:" + a + ";border:1px solid " + i + ';border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit">' + translate("Swap") + "</button></div>" + (t.footerHTML ? '<div style="margin-top:12px">' + t.footerHTML + "</div>" : "") + "</div>";
  var s = !0, d = e.querySelector(".aw-b64-input"), c = e.querySelector(".aw-b64-output"), p = e.querySelector(".aw-b64-urlsafe"), u = e.querySelector(".aw-b64-encode"), b = e.querySelector(".aw-b64-decode");
  function f() {
    var t = d.value;
    if (e.querySelector(".aw-b64-input-count").textContent = t.length + translate(" characters"),
    !t) return c.value = "", void (e.querySelector(".aw-b64-output-count").textContent = translate("0 characters"));
    try {
      var o = p.checked;
      if (s) {
        var r = btoa(unescape(encodeURIComponent(t)));
        o && (r = r.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")), c.value = r;
      } else {
        var a = t;
        if (o) {
          var n = 4 - (a = a.replace(/-/g, "+").replace(/_/g, "/")).length % 4;
          4 !== n && (a += "=".repeat(n));
        }
        c.value = decodeURIComponent(escape(atob(a)));
      }
    } catch (e) {
      c.value = locale === "fr-FR" ? "Base64 invalide : vérifiez les caractères et le mode choisi." : "Error: " + e.message;
    }
    e.querySelector(".aw-b64-output-count").textContent = c.value.length + translate(" characters");
  }
  u.addEventListener("click", function() {
    s = !0, u.style.background = l, u.style.color = "#fff", u.style.border = "none",
    b.style.background = n, b.style.color = a, b.style.border = "1px solid " + i, f();
  }), b.addEventListener("click", function() {
    s = !1, b.style.background = l, b.style.color = "#fff", b.style.border = "none",
    u.style.background = n, u.style.color = a, u.style.border = "1px solid " + i, f();
  }), d.addEventListener("input", f), p.addEventListener("change", f), e.querySelector(".aw-b64-copy").addEventListener("click", function() {
    var e = this;
    (async function() {
      try {
        await navigator.clipboard.writeText(c.value);
        e.textContent = translate("Copied!");
      } catch {
        c.focus();
        c.select();
        e.textContent = locale === "fr-FR" ? "Résultat sélectionné : utilisez la commande Copier" : "Output selected: use your Copy command";
      }
      setTimeout(function() {
        e.textContent = translate("Copy Output");
      }, 3e3);
    })();
  }), e.querySelector(".aw-b64-swap").addEventListener("click", function() {
    var t = d.value;
    d.value = c.value, c.value = t, e.querySelector(".aw-b64-input-count").textContent = d.value.length + translate(" characters"),
    e.querySelector(".aw-b64-output-count").textContent = c.value.length + translate(" characters");
  });
};

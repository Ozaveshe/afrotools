window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.passwordGenerator = function(e, t) {
  var locale = e && e.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr" ? "fr-FR" : "en";
  function translate(label) {
    return locale === "fr-FR" && french[label] || label;
  }
  var french = {
    "Generated Password": "Mot de passe généré",
    Copy: "Copier",
    Generate: "Générer",
    "Length: 16": "Longueur : 16",
    Uppercase: "Majuscules",
    Lowercase: "Minuscules",
    Numbers: "Chiffres",
    Symbols: "Symboles",
    "Copied!": "Copié !",
    "Angle: ": "Angle : ",
    Shape: "Forme",
    Circle: "Cercle",
    Ellipse: "Ellipse",
    "Length: ": "Longueur : ",
    " Uppercase": " Majuscules",
    " Lowercase": " Minuscules",
    " Numbers": " Chiffres",
    " Symbols": " Symboles",
    "Very Weak": "Très faible",
    Weak: "Faible",
    Fair: "Moyenne",
    Strong: "Élevée",
    "Very Strong": "Très élevée"
  };
  var a = "dark" === ((t = t || {}).theme || "light"), r = a ? "#1a1a2e" : "#fff", n = a ? "#e0e0e0" : "#333", l = a ? "#16213e" : "#f5f7fa", o = a ? "#333" : "#ddd";
  e.innerHTML = '<div class="aw-password-gen" style="font-family:\'Inter\',sans-serif;background:' + r + ";color:" + n + ";padding:20px;border-radius:10px;border:1px solid " + o + '"><div class="aw-field" style="margin-bottom:12px"><label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">' + translate("Generated Password") + '</label><div style="display:flex;gap:8px"><input type="text" class="aw-input aw-pwd-output" readonly style="flex:1;padding:10px;border:1px solid ' + o + ";border-radius:6px;font-family:'Courier New',monospace;font-size:15px;background:" + l + ";color:" + n + ';box-sizing:border-box"><button class="aw-btn aw-pwd-copy" style="padding:8px 12px;background:' + l + ";color:" + n + ";border:1px solid " + o + ';border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit">' + translate("Copy") + '</button><button class="aw-btn aw-btn--primary aw-pwd-gen" style="padding:8px 12px;background:#0062CC;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit">' + translate("Generate") + '</button></div></div><div class="aw-pwd-strength" style="height:6px;border-radius:3px;background:' + o + ';margin-bottom:4px;overflow:hidden"><div class="aw-pwd-strength-bar" style="height:100%;width:0;border-radius:3px;transition:width 0.3s,background 0.3s"></div></div><div class="aw-pwd-strength-text" style="font-size:11px;color:#888;margin-bottom:12px"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div class="aw-field"><label class="aw-label" style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">' + translate("Length: ") + '<span class="aw-pwd-len-val">16</span></label><input type="range" class="aw-pwd-length" min="4" max="128" value="16" style="width:100%"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px"><label style="display:flex;align-items:center;gap:4px"><input type="checkbox" class="aw-pwd-upper" checked>' + translate(" Uppercase") + '</label><label style="display:flex;align-items:center;gap:4px"><input type="checkbox" class="aw-pwd-lower" checked>' + translate(" Lowercase") + '</label><label style="display:flex;align-items:center;gap:4px"><input type="checkbox" class="aw-pwd-nums" checked>' + translate(" Numbers") + '</label><label style="display:flex;align-items:center;gap:4px"><input type="checkbox" class="aw-pwd-syms" checked>' + translate(" Symbols") + "</label></div></div>" + (t.footerHTML ? '<div style="margin-top:12px">' + t.footerHTML + "</div>" : "") + "</div>";
  var d = "abcdefghijklmnopqrstuvwxyz", s = e.querySelector(".aw-pwd-output"), i = e.querySelector(".aw-pwd-length"), p = e.querySelector(".aw-pwd-len-val"), c = e.querySelector(".aw-pwd-strength-bar"), w = e.querySelector(".aw-pwd-strength-text");
  function u() {
    var t = parseInt(i.value) || 16, a = "";
    e.querySelector(".aw-pwd-upper").checked && (a += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"),
    e.querySelector(".aw-pwd-lower").checked && (a += d), e.querySelector(".aw-pwd-nums").checked && (a += "0123456789"),
    e.querySelector(".aw-pwd-syms").checked && (a += "!@#$%^&*()_+-=[]{}|;:,.<>?");
    if (!a) {
      s.value = "";
      c.style.width = "0%";
      w.textContent = locale === "fr-FR" ? "Sélectionnez au moins un type de caractère." : "Select at least one character set.";
      return;
    }
    var n = "", poolSize = a.length, limit = 256 - 256 % poolSize;
    while (n.length < t) {
      const bytes = crypto.getRandomValues(new Uint8Array(t));
      for (const byte of bytes) {
        if (byte < limit) n += a[byte % poolSize];
        if (n.length === t) break;
      }
    }
    s.value = n, function(e) {
      var t = e.length, a = 0;
      /[a-z]/.test(e) && a++, /[A-Z]/.test(e) && a++, /[0-9]/.test(e) && a++, /[^a-zA-Z0-9]/.test(e) && a++;
      var r, n, l, o = 0;
      t >= 8 && o++, t >= 12 && o++, t >= 16 && o++, t >= 24 && o++, (o += a) <= 2 ? (r = 20,
      n = "#dc2626", l = "Very Weak") : o <= 4 ? (r = 40, n = "#f97316", l = "Weak") : o <= 5 ? (r = 60,
      n = "#eab308", l = "Fair") : o <= 6 ? (r = 80, n = "#0062CC", l = "Strong") : (r = 100,
      n = "#0062CC", l = "Very Strong"), c.style.width = r + "%", c.style.background = n,
      w.textContent = translate(l) + " (" + Math.floor(e.length * Math.log2(poolSize)) + (locale === "fr-FR" ? " bits d’entropie estimés)" : " bits entropy est.)");
    }(n);
  }
  i.addEventListener("input", function() {
    p.textContent = this.value, u();
  }), e.querySelector(".aw-pwd-gen").addEventListener("click", u), e.querySelector(".aw-pwd-upper").addEventListener("change", u),
  e.querySelector(".aw-pwd-lower").addEventListener("change", u), e.querySelector(".aw-pwd-nums").addEventListener("change", u),
  e.querySelector(".aw-pwd-syms").addEventListener("change", u), e.querySelector(".aw-pwd-copy").addEventListener("click", function() {
    var e = this;
    (async function() {
      try {
        await navigator.clipboard.writeText(s.value);
        e.textContent = translate("Copied!");
      } catch {
        s.focus();
        s.select();
        e.textContent = locale === "fr-FR" ? "Résultat sélectionné : utilisez la commande Copier" : "Output selected: use your Copy command";
      }
      setTimeout(function() {
        e.textContent = translate("Copy");
      }, 3e3);
    })();
  }), u();
};

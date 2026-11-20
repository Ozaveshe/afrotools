!function() {
  "use strict";
  window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.tip_calc = function(a, e) {
    var locale = a && a.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr" ? "fr-FR" : "en";
    function translate(label) {
      return locale === "fr-FR" && french[label] || label;
    }
    var french = {
      "Tip Calculator": "Calculateur de pourboire",
      "Bill Amount": "Montant de l’addition",
      "Tip %": "Pourcentage du pourboire",
      Split: "Nombre de personnes",
      Calculate: "Calculer",
      "Tip Amount": "Montant du pourboire",
      Total: "Total",
      "Per Person": "Total par personne",
      "Tip Per Person": "Pourboire par personne"
    };
    e = e || {}, a.innerHTML = '<div class="aw-title">' + translate("Tip Calculator") + '</div><div class="aw-field"><label class="aw-label" for="aw-bill">' + translate("Bill Amount") + '</label><input class="aw-input" id="aw-bill" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00"></div><div class="aw-row"><div class="aw-field"><label class="aw-label" for="aw-pct">' + translate("Tip %") + '</label><input class="aw-input" id="aw-pct" type="number" min="0" max="100" inputmode="numeric" value="15"></div><div class="aw-field"><label class="aw-label" for="aw-split">' + translate("Split") + '</label><input class="aw-input" id="aw-split" type="number" min="1" max="50" inputmode="numeric" value="1"></div></div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px" id="aw-quick"></div><button class="aw-btn aw-btn--primary" id="aw-calc">' + translate("Calculate") + '</button><div class="aw-result-box" id="aw-res" style="display:none"></div>' + (e.footerHTML || "");
    var l = a.querySelector("#aw-quick");
    [ 10, 15, 18, 20, 25 ].forEach(function(e) {
      var s = document.createElement("button");
      s.className = "aw-btn", s.textContent = e + "%", s.addEventListener("click", function() {
        a.querySelector("#aw-pct").value = e, i();
      }), l.appendChild(s);
    });
    var s = function(a) {
      return a.toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    };
    function i() {
      var e = parseFloat(a.querySelector("#aw-bill").value) || 0, l = parseFloat(a.querySelector("#aw-pct").value) || 0, i = parseInt(a.querySelector("#aw-split").value) || 1;
      if (e <= 0) {
        a.querySelector("#aw-res").style.display = "none";
        return;
      }
      if (e > 0) {
        var t = e * l / 100, n = e + t, r = n / i, c = t / i, u = a.querySelector("#aw-res");
        u.style.display = "block", u.innerHTML = '<div class="aw-result-row"><span class="aw-result-label">' + translate("Tip Amount") + '</span><span class="aw-result-main">' + s(t) + '</span></div><div class="aw-result-row"><span class="aw-result-label">' + translate("Total") + '</span><span class="aw-result-main">' + s(n) + "</span></div>" + (i > 1 ? '<hr class="aw-divider"><div class="aw-result-row"><span class="aw-result-label">' + translate("Per Person") + '</span><span class="aw-result-main">' + s(r) + '</span></div><div class="aw-result-row"><span class="aw-result-label">' + translate("Tip Per Person") + "</span><span>" + s(c) + "</span></div>" : "");
      }
    }
    a.querySelector("#aw-calc").addEventListener("click", i), a.querySelectorAll("input").forEach(function(a) {
      a.addEventListener("keyup", function(a) {
        "Enter" === a.key && i();
      });
    });
  };
}();

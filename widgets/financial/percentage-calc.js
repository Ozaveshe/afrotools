!function() {
  "use strict";
  window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.percentage_calc = function(e, a) {
    var locale = e && e.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr" ? "fr-FR" : "en";
    function translate(label) {
      return locale === "fr-FR" && french[label] || label;
    }
    var french = {
      "Percentage Calculator": "Calculateur de pourcentage",
      "X% of Y": "Pourcentage d’une valeur",
      "X is ?% of Y": "Part dans un total",
      "% Change": "Variation en pourcentage",
      Percentage: "Pourcentage",
      Value: "Valeur",
      Calculate: "Calculer",
      "Old Value": "Valeur initiale",
      "New Value": "Valeur finale"
    };
    a = a || {}, e.innerHTML = '<div class="aw-title">' + translate("Percentage Calculator") + '</div><div class="aw-tabs" id="aw-tabs"><button class="aw-tab aw-tab--active" data-mode="0">' + translate("X% of Y") + '</button><button class="aw-tab" data-mode="1">' + translate("X is ?% of Y") + '</button><button class="aw-tab" data-mode="2">' + translate("% Change") + '</button></div><div class="aw-row"><div class="aw-field"><label class="aw-label" id="aw-lbl1">' + translate("Percentage") + '</label><input class="aw-input" id="aw-v1" type="number" step="any" inputmode="decimal" placeholder="0"></div><div class="aw-field"><label class="aw-label" id="aw-lbl2">' + translate("Value") + '</label><input class="aw-input" id="aw-v2" type="number" step="any" inputmode="decimal" placeholder="0"></div></div><button class="aw-btn aw-btn--primary" id="aw-calc">' + translate("Calculate") + '</button><div class="aw-result-box" id="aw-res" style="display:none"></div>' + (a.footerHTML || "");
    var t = 0, l = [ [ "Percentage", "Value" ], [ "X", "Y" ], [ "Old Value", "New Value" ] ], i = e.querySelectorAll(".aw-tab");
    function n() {
      var a, l, i = parseFloat(e.querySelector("#aw-v1").value) || 0, n = parseFloat(e.querySelector("#aw-v2").value) || 0;
      if (0 === t) a = i * n / 100, l = i + (locale === "fr-FR" ? " % de " : "% of ") + n; else if (1 === t) {
        if (0 === n) {
          e.querySelector("#aw-res").style.display = "none";
          return;
        }
        a = i / n * 100;
        l = locale === "fr-FR" ? i + " représente " + a.toLocaleString(locale, {
          maximumFractionDigits: 2
        }) + " % de " + n : i + " is " + a.toFixed(2) + "% of " + n;
      } else {
        if (0 === i) {
          e.querySelector("#aw-res").style.display = "none";
          return;
        }
        a = (n - i) / i * 100, l = locale === "fr-FR" ? "Variation de " + i + " à " + n : "Change from " + i + " to " + n;
      }
      var s = e.querySelector("#aw-res");
      s.style.display = "block", s.innerHTML = '<div class="aw-result-label">' + l + '</div><div class="aw-result-main">' + a.toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }) + (0 !== t ? "%" : "") + "</div>";
    }
    i.forEach(function(a) {
      a.addEventListener("click", function() {
        i.forEach(function(e) {
          e.classList.remove("aw-tab--active");
        }), a.classList.add("aw-tab--active"), t = parseInt(a.getAttribute("data-mode")),
        e.querySelector("#aw-lbl1").textContent = translate(l[t][0]), e.querySelector("#aw-lbl2").textContent = translate(l[t][1]),
        e.querySelector("#aw-res").style.display = "none";
      });
    }), e.querySelector("#aw-calc").addEventListener("click", n), e.querySelectorAll("input").forEach(function(e) {
      e.addEventListener("keyup", function(e) {
        "Enter" === e.key && n();
      });
    });
  };
}();

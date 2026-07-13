!function() {
  "use strict";
  var t = {
    NG: [ "Lagos", "Abuja", "Port Harcourt" ],
    GH: [ "Accra", "Kumasi" ],
    KE: [ "Nairobi", "Mombasa" ],
    ZA: [ "Johannesburg", "Cape Town" ],
    EG: [ "Cairo", "Alexandria" ],
    SN: [ "Dakar" ],
    CI: [ "Abidjan" ]
  }, e = {
    CA: [ "Toronto", "Vancouver", "Calgary" ],
    UK: [ "London", "Manchester", "Birmingham" ],
    US: [ "New York", "Houston", "Atlanta" ],
    DE: [ "Berlin", "Munich" ],
    AU: [ "Sydney", "Melbourne" ],
    FR: [ "Paris", "Lyon" ],
    AE: [ "Dubai", "Abu Dhabi" ]
  }, n = {
    CA: 1.15,
    UK: 1.1,
    US: 1.25,
    DE: 1,
    AU: 1.22,
    NZ: 1.15,
    AE: .95,
    QA: 1,
    SA: .9,
    SG: 1.18
  }, a = {
    NG: 1.15,
    GH: 1.05,
    KE: 1,
    ZA: .95,
    EG: .9,
    MA: .9,
    SN: 1.05,
    CI: 1.05
  }, o = "study", i = !1;
  function r(t) {
    return document.getElementById(t);
  }
  function u(t, e) {
    var n = r(t), a = n ? Number(n.value) : NaN;
    return Number.isFinite(a) ? a : e;
  }
  function s(t) {
    var e = r(t), n = e && e.querySelector("input");
    return !(!n || !n.checked);
  }
  function d(t, e) {
    var n = r(t);
    n && (n.innerHTML = e.map(function(t) {
      return "<option>" + t + "</option>";
    }).join(""));
  }
  function l(t) {
    return "$" + Math.round(t).toLocaleString();
  }
  function c() {
    var t = r("pwGrid"), e = r("pwNote");
    t && (t.innerHTML = [ [ "study", "Etudes", "Visa, frais scolaires initiaux et installation." ], [ "work", "Travail qualifie", "Dossier emploi, visa, vols et reserves." ], [ "family", "Famille", "Regroupement, preuves et installation." ] ].map(function(t) {
      return '<button type="button" class="pw' + (t[0] === o ? " on" : "") + '" data-visa="' + t[0] + '"><strong>' + t[1] + "</strong><span>" + t[2] + "</span></button>";
    }).join(""), t.querySelectorAll("[data-visa]").forEach(function(t) {
      t.addEventListener("click", function() {
        o = t.getAttribute("data-visa"), c(), i && window.calculate(!0);
      });
    }), e && (e.textContent = "Estimation de planification. Confirmez les frais de visa et preuves de fonds avec la source officielle."));
  }
  window.updOrigin = function() {
    var e = r("oCtry") ? r("oCtry").value : "NG";
    d("oCity", t[e] || [ "Capital city" ]), i && window.calculate(!0);
  }, window.updDest = function() {
    var t = r("dCtry") ? r("dCtry").value : "CA";
    d("dCity", e[t] || [ "Main city" ]), i && window.calculate(!0);
  }, window.recalcIfDone = function() {
    i && window.calculate(!0);
  }, window.calculate = function() {
    var t = r("oCtry") ? r("oCtry").value : "NG", e = r("dCtry") ? r("dCtry").value : "CA", d = "study" === o ? 6200 : "work" === o ? 5200 : 4300, c = d * (a[t] || 1) * (n[e] || 1);
    s("tSpouse") && (c += 1800), s("tKids") && (c += 1200 * u("nKids", 1)), s("tIelts") && (c += 260),
    s("tPrep") && (c += 420), s("tConsult") && (c += 1200), s("tShip") && (c += 900),
    s("tStorage") && (c += 360);
    var p = u("alreadySaved", 0), v = u("monthlyIncome", 0), f = u("savingsRate", 25) / 100, g = Math.max(0, c - p), y = Math.max(0, v * f), m = y > 0 ? Math.ceil(g / y) : null;
    r("totUsd") && (r("totUsd").textContent = l(c)), r("totLocal") && (r("totLocal").textContent = function(t, e) {
      return Math.round(t * function(t) {
        return {
          NG: 1500,
          GH: 14,
          KE: 130,
          ZA: 18,
          EG: 48,
          MA: 10,
          SN: 600,
          CI: 600
        }[t] || 1;
      }(e)).toLocaleString() + " " + function(t) {
        return {
          NG: "NGN",
          GH: "GHS",
          KE: "KES",
          ZA: "ZAR",
          EG: "EGP",
          MA: "MAD",
          SN: "XOF",
          CI: "XOF"
        }[t] || "USD";
      }(e);
    }(c, t)), r("totSub") && (r("totSub").textContent = m ? "Environ " + m + " mois a votre rythme d epargne." : "Ajoutez revenu et epargne pour estimer le delai."),
    r("totBadges") && (r("totBadges").innerHTML = "<span>Visa: " + o + "</span><span>Reste: " + l(g) + "</span>"),
    r("breakdown") && (r("breakdown").innerHTML = '<div style="padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:#fff"><strong>Lecture rapide</strong><p>Budget de base, visa, voyage et installation: ' + l(d) + ". Ajustements famille, tests, conseil et logistique inclus selon vos choix.</p><p>Gardez une marge de 10 a 15% pour taux de change, frais bancaires et rendez-vous supplementaires.</p></div>"),
    r("results") && r("results").classList.add("on"), i = !0;
  }, document.addEventListener("DOMContentLoaded", function() {
    window.updOrigin(), window.updDest(), c(), document.querySelectorAll(".tg input,#monthlyIncome,#savingsRate,#alreadySaved,#nKids,#targetDate").forEach(function(t) {
      t.addEventListener("change", window.recalcIfDone);
    });
  });
}();

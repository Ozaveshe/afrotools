!function() {
  "use strict";
  var t = "petrol";
  function e(t) {
    return String(null == t ? "" : t).replace(/[&<>"']/g, function(t) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[t];
    });
  }
  function countryName(row) {
    try { return new Intl.DisplayNames(['fr'], {type:'region'}).of(row.code) || row.name; } catch (_) { return row.name; }
  }
  function regionName(value) { return {north:'Afrique du Nord',south:'Afrique australe',east:'Afrique de l’Est',west:'Afrique de l’Ouest',central:'Afrique centrale'}[value] || value || 'Non renseignée'; }
  function r(r) {
    var n = document.getElementById("fuelTable");
    if (n) {
      var unit = t === 'lpg' ? 'kg' : 'L';
      var description = document.querySelector('#tableSection .section-sub');
      if (description) description.textContent = 'Instantanés nationaux datés, classés par prix en USD / ' + unit + '. Les montants locaux utilisent la devise du pays. Ce ne sont pas des prix actuels de station.';
      var o = (r && r.countries || []).slice().sort(function(e, r) {
        return (e[t] && "number" == typeof e[t].usd ? e[t].usd : 999) - (r[t] && "number" == typeof r[t].usd ? r[t].usd : 999);
      });
      n.innerHTML = '<div style="overflow:auto;border:1px solid #e2e8f0;border-radius:12px;background:#fff"><table style="width:100%;border-collapse:collapse;font-size:.9rem"><thead><tr style="background:#f8fafc;text-align:left"><th style="padding:12px">Pays</th><th style="padding:12px">Prix</th><th style="padding:12px">Région</th><th style="padding:12px">Source</th><th style="padding:12px">Mise à jour</th></tr></thead><tbody>' + o.map(function(r) {
        return '<tr><td style="padding:12px;border-top:1px solid #e2e8f0"><strong>' + e(countryName(r)) + "</strong><br><span>" + e(r.currency) + '</span></td><td style="padding:12px;border-top:1px solid #e2e8f0">' + function(t, r) {
          var n = t[r] || {};
          return (null === n.price || void 0 === n.price ? "Non disponible" : e(n.price) + " " + e(t.currency) + " / " + unit) + (null === n.usd || void 0 === n.usd ? "" : " ($" + Number(n.usd).toFixed(2) + " / " + unit + ")");
        }(r, t) + '</td><td style="padding:12px;border-top:1px solid #e2e8f0">' + e(regionName(r.region)) + '</td><td style="padding:12px;border-top:1px solid #e2e8f0">' + e(r.source || "AfroTools") + '</td><td style="padding:12px;border-top:1px solid #e2e8f0">' + e(r.last_updated || "Non disponible") + "</td></tr>";
      }).join("") + '</tbody></table></div><p style="margin-top:10px;color:#64748b;font-size:.85rem">Prix indicatifs par litre, sauf le GPL indiqué au kg. Confirmez localement avant tout budget ou achat.</p>';
    }
  }
  fetch("/data/fuel/latest.json", {
    cache: "no-cache"
  }).then(function(t) {
    if (!t.ok) {
      throw new Error(t.status);
    }
    return t.json();
  }).then(function(e) {
    r(e), function(e) {
      document.querySelectorAll(".fuel-tab").forEach(function(n) {
        n.addEventListener("click", function() {
          document.querySelectorAll(".fuel-tab").forEach(function(t) {
            t.classList.remove("active");
          }), n.classList.add("active"), t = n.getAttribute("data-fuel") || "petrol", r(e);
        });
      });
    }(e);
  }).catch(function() {
    var t = document.getElementById("fuelTable");
    t && (t.innerHTML = '<p style="color:#64748b">Les prix du carburant sont temporairement indisponibles.</p>');
  });
}();

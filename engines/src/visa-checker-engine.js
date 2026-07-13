!function() {
  "use strict";
  window.AfroTools = window.AfroTools || {};
  var e = null;
  function r() {
    return e || (e = window.AfroTools.visaData), e;
  }
  var t = {
    KE: {
      visaFreeFor: "ALL",
      duration: 90,
      treaty: "Kenya eTA (visa-free for all Africans since Jan 2024)"
    },
    RW: {
      visaFreeFor: "ALL",
      duration: 90,
      treaty: "Rwanda visa-on-arrival for all African passport holders"
    },
    SC: {
      visaFreeFor: "ALL",
      duration: 90,
      treaty: "Seychelles visa-free for all nationalities"
    },
    BJ: {
      eVisaFor: "ALL",
      duration: 90,
      treaty: "Benin eVisa program"
    },
    ET: {
      voaFor: "ALL",
      duration: 90,
      treaty: "Ethiopia eVisa/VOA program"
    },
    MU: {
      visaFreeFor: "ALL",
      duration: 90,
      treaty: "Mauritius visa-free policy for African nationals"
    }
  }, a = {
    "ZA-MZ": "visa_free",
    "ZA-BW": "visa_free",
    "ZA-LS": "visa_free",
    "ZA-SZ": "visa_free",
    "ZA-NA": "visa_free",
    "ZA-ZM": "visa_free",
    "ZA-ZW": "visa_free",
    "ZA-MW": "visa_free",
    "ZA-MU": "visa_free",
    "BW-ZA": "visa_free",
    "BW-NA": "visa_free",
    "BW-ZM": "visa_free",
    "BW-ZW": "visa_free",
    "BW-LS": "visa_free",
    "BW-SZ": "visa_free",
    "BW-MW": "visa_free",
    "NA-ZA": "visa_free",
    "NA-BW": "visa_free",
    "NA-ZM": "visa_free",
    "NA-ZW": "visa_free",
    "NA-AO": "visa_free",
    "ZM-ZW": "visa_free",
    "ZM-ZA": "visa_free",
    "ZM-BW": "visa_free",
    "ZM-NA": "visa_free",
    "ZM-MW": "visa_free",
    "ZM-TZ": "visa_free",
    "ZW-ZM": "visa_free",
    "ZW-ZA": "visa_free",
    "ZW-BW": "visa_free",
    "ZW-MZ": "visa_free",
    "MZ-ZA": "visa_free",
    "MZ-ZW": "visa_free",
    "MZ-MW": "visa_free",
    "MZ-TZ": "visa_free",
    "TZ-KE": "visa_free",
    "TZ-UG": "visa_free",
    "TZ-RW": "visa_free",
    "TZ-BI": "visa_free",
    "UG-KE": "visa_free",
    "UG-TZ": "visa_free",
    "UG-RW": "visa_free",
    "EG-SD": "visa_free",
    "SD-EG": "visa_free",
    "MA-TN": "visa_free",
    "TN-MA": "visa_free",
    "DZ-TN": "visa_free",
    "TN-DZ": "visa_free",
    "DZ-MA": "visa_free",
    "MA-DZ": "visa_free",
    "LS-ZA": "visa_free",
    "SZ-ZA": "visa_free",
    "MW-ZA": "visa_on_arrival",
    "MW-ZM": "visa_free",
    "MW-MZ": "visa_free",
    "MW-TZ": "visa_free"
  };
  window.AfroTools.VisaCheckerEngine = {
    getVisaStatus: function(e, i) {
      if (e === i) {
        return {
          status: "n_a",
          duration: null,
          treaty: "Same country"
        };
      }
      var s = r();
      if (!s) {
        return {
          status: "unknown"
        };
      }
      var n = s.countries[i], o = s.countries[e];
      if (!n || !o) {
        return {
          status: "unknown"
        };
      }
      var d = t[i];
      if (d) {
        if ("ALL" === d.visaFreeFor) {
          return {
            status: "visa_free",
            duration: d.duration || 90,
            treaty: d.treaty
          };
        }
        if ("ALL" === d.eVisaFor) {
          return {
            status: "e_visa",
            duration: d.duration || 90,
            treaty: d.treaty,
            fee: "Varies"
          };
        }
        if ("ALL" === d.voaFor) {
          return {
            status: "visa_on_arrival",
            duration: d.duration || 90,
            treaty: d.treaty
          };
        }
      }
      var f = e + "-" + i;
      if (a[f]) {
        return {
          status: a[f],
          duration: 90,
          treaty: "Bilateral agreement"
        };
      }
      var v = s.recProtocols;
      for (var l in v) {
        var u = v[l];
        if (u.visaFree) {
          var g = u.members;
          if (-1 !== g.indexOf(e) && -1 !== g.indexOf(i)) {
            return {
              status: "visa_free",
              duration: u.duration || 90,
              treaty: u.name + " Protocol"
            };
          }
        }
      }
      return {
        status: "visa_required",
        duration: null,
        treaty: null,
        fee: "Varies by nationality",
        processingTime: "5-15 business days"
      };
    },
    getAllForDestination: function(e) {
      var t = r();
      if (!t) {
        return [];
      }
      var a = [];
      for (var i in t.countries) {
        if (i !== e) {
          var s = this.getVisaStatus(i, e);
          s.origin = i, s.originName = t.countries[i].name, s.originFlag = t.countries[i].flag,
          a.push(s);
        }
      }
      return a;
    },
    getSummaryStats: function(e) {
      for (var r = this.getAllForDestination(e), t = {
        visaFree: 0,
        visaOnArrival: 0,
        eVisa: 0,
        visaRequired: 0,
        total: r.length
      }, a = 0; a < r.length; a++) {
        switch (r[a].status) {
         case "visa_free":
          t.visaFree++;
          break;

         case "visa_on_arrival":
          t.visaOnArrival++;
          break;

         case "e_visa":
          t.eVisa++;
          break;

         case "visa_required":
          t.visaRequired++;
        }
      }
      return t;
    },
    getStatusLabel: function(e) {
      switch (e) {
       case "visa_free":
        return {
          text: "VISA FREE",
          color: "#16a34a",
          bg: "#dcfce7"
        };

       case "visa_on_arrival":
        return {
          text: "VISA ON ARRIVAL",
          color: "#2563eb",
          bg: "#dbeafe"
        };

       case "e_visa":
        return {
          text: "E-VISA",
          color: "#d97706",
          bg: "#fef3c7"
        };

       case "visa_required":
        return {
          text: "VISA REQUIRED",
          color: "#dc2626",
          bg: "#fee2e2"
        };

       default:
        return {
          text: "UNKNOWN",
          color: "#6b7280",
          bg: "#f3f4f6"
        };
      }
    },
    renderStatusBadge: function(e) {
      var r = this.getStatusLabel(e);
      return '<span style="display:inline-block;padding:.25rem .6rem;border-radius:6px;font-size:.72rem;font-weight:700;letter-spacing:.03em;background:' + r.bg + ";color:" + r.color + '">' + r.text + "</span>";
    },
    renderMatrix: function(e) {
      var r = this.getAllForDestination(e);
      r.sort(function(e, r) {
        var t = {
          visa_free: 0,
          visa_on_arrival: 1,
          e_visa: 2,
          visa_required: 3
        };
        return (t[e.status] || 9) - (t[r.status] || 9);
      });
      for (var t = '<table style="width:100%;border-collapse:collapse;font-size:.85rem"><thead><tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0"><th style="padding:.6rem;text-align:left">Country</th><th style="padding:.6rem;text-align:left">Status</th><th style="padding:.6rem;text-align:left">Duration</th><th style="padding:.6rem;text-align:left">Treaty/Basis</th></tr></thead><tbody>', a = 0; a < r.length; a++) {
        var i = r[a];
        t += '<tr style="border-bottom:1px solid #f1f5f9"><td style="padding:.5rem .6rem">' + i.originFlag + " " + i.originName + '</td><td style="padding:.5rem .6rem">' + this.renderStatusBadge(i.status) + '</td><td style="padding:.5rem .6rem">' + (i.duration ? i.duration + " days" : "—") + '</td><td style="padding:.5rem .6rem;color:#64748b">' + (i.treaty || "—") + "</td></tr>";
      }
      return t + "</tbody></table>";
    },
    renderResultCard: function(e, t) {
      var a = this.getVisaStatus(e, t), i = r(), s = i.countries[e], n = i.countries[t], o = this.getStatusLabel(a.status), d = '<div style="background:' + o.bg + ";border:2px solid " + o.color + ';border-radius:12px;padding:1.5rem;text-align:center;margin:1rem 0">';
      return d += '<div style="font-size:1.8rem;margin-bottom:.5rem">' + s.flag + " → " + n.flag + "</div>",
      d += '<div style="font-size:1.3rem;font-weight:800;color:' + o.color + ';margin-bottom:.5rem">' + o.text + "</div>",
      a.duration && (d += '<div style="font-size:1rem;color:#374151">Stay up to <strong>' + a.duration + " days</strong></div>"),
      a.treaty && (d += '<div style="font-size:.85rem;color:#6b7280;margin-top:.25rem">' + a.treaty + "</div>"),
      a.fee && (d += '<div style="font-size:.85rem;color:#6b7280;margin-top:.25rem">Fee: ' + a.fee + "</div>"),
      d + "</div>";
    },
    initPage: function(e) {
      var t = this, a = r();
      if (a) {
        var i = t.getSummaryStats(e), s = {
          visaFree: "statFree",
          visaOnArrival: "statVoa",
          eVisa: "statEvisa",
          visaRequired: "statReq"
        };
        for (var n in s) {
          var o = document.getElementById(s[n]);
          o && (o.textContent = i[n]);
        }
        var d = document.getElementById("visaMatrix");
        d && (d.innerHTML = t.renderMatrix(e));
        var f = document.getElementById("originSelect");
        f && f.addEventListener("change", function() {
          var r = this.value, a = document.getElementById("visaResult");
          r && a ? a.innerHTML = t.renderResultCard(r, e) : a && (a.innerHTML = "");
        });
        var v = a.entryReq[e], l = a.emergency[e], u = document.getElementById("entryInfo");
        u && v && (u.innerHTML = '<ul style="list-style:none;padding:0;margin:0"><li style="padding:.5rem 0;border-bottom:1px solid #f1f5f9;font-size:.88rem"><strong>Passport validity:</strong> ' + v.passportValidity + '</li><li style="padding:.5rem 0;border-bottom:1px solid #f1f5f9;font-size:.88rem"><strong>Yellow fever:</strong> ' + v.yellowFever + '</li><li style="padding:.5rem 0;font-size:.88rem"><strong>Currency import:</strong> ' + v.currencyImportLimit + "</li></ul>");
        var g = document.getElementById("emergencyInfo");
        g && l && (g.innerHTML = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem;margin-top:.5rem"><div style="text-align:center;padding:.75rem;background:#fee2e2;border-radius:8px"><div style="font-size:.72rem;font-weight:700;color:#991b1b;text-transform:uppercase">Police</div><div style="font-size:1.1rem;font-weight:800;color:#dc2626">' + l.police + '</div></div><div style="text-align:center;padding:.75rem;background:#fef3c7;border-radius:8px"><div style="font-size:.72rem;font-weight:700;color:#92400e;text-transform:uppercase">Ambulance</div><div style="font-size:1.1rem;font-weight:800;color:#d97706">' + l.ambulance + '</div></div><div style="text-align:center;padding:.75rem;background:#dbeafe;border-radius:8px"><div style="font-size:.72rem;font-weight:700;color:#1e40af;text-transform:uppercase">Fire</div><div style="font-size:1.1rem;font-weight:800;color:#2563eb">' + l.fire + "</div></div></div>");
      }
    }
  };
}();

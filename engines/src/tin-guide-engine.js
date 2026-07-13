!function() {
  "use strict";
  window.AfroTools = window.AfroTools || {};
  var e = null;
  window.AfroTools.TinGuideEngine = {
    render: function(t) {
      var r = (e || (e = window.AfroTools.tinGuideData), e);
      return r && r.tin[t] ? {
        country: r.countries[t],
        tin: r.tin[t],
        cc: t
      } : null;
    },
    renderInfoCards: function(e) {
      var t = this.render(e);
      if (!t) {
        return "";
      }
      for (var r = t.tin, i = (t.country, [ {
        val: r.authorityAbbr,
        lbl: "Tax Authority",
        detail: r.authority
      }, {
        val: r.tinName.split("(")[0].trim(),
        lbl: "Local TIN Name"
      }, {
        val: r.tinFormat,
        lbl: "TIN Format"
      }, {
        val: r.cost,
        lbl: "Registration Cost"
      }, {
        val: r.processingTime,
        lbl: "Processing Time"
      }, {
        val: r.onlinePortal ? "Online Available" : "In-Person Only",
        lbl: "Registration Method"
      } ]), n = '<div class="tin-detail-grid">', o = 0; o < i.length; o++) {
        n += '<div class="tin-detail-card"><div class="val">' + i[o].val + '</div><div class="lbl">' + i[o].lbl + "</div>",
        i[o].detail && (n += '<div style="font-size:.72rem;color:#9ca3af;margin-top:.25rem">' + i[o].detail + "</div>"),
        n += "</div>";
      }
      return n + "</div>";
    },
    renderDocs: function(e) {
      var t = this.render(e);
      if (!t) {
        return "";
      }
      for (var r = t.tin.docs, i = [ {
        key: "individual",
        title: "Individual",
        icon: "👤"
      }, {
        key: "business",
        title: "Business / Corporate",
        icon: "🏢"
      }, {
        key: "nonResident",
        title: "Non-Resident",
        icon: "🌍"
      } ], n = '<div class="tin-docs-tabs" style="display:flex;gap:.5rem;margin-bottom:1rem;flex-wrap:wrap">', o = 0; o < i.length; o++) {
        n += '<button class="tin-doc-tab' + (0 === o ? " active" : "") + '" data-tab="' + i[o].key + '" style="padding:.65rem 1.2rem;min-height:44px;border-radius:8px;border:1px solid #e5e7eb;background:' + (0 === o ? "var(--leg,#7c3aed)" : "#fff") + ";color:" + (0 === o ? "#fff" : "#374151") + ';font-size:.88rem;font-weight:600;cursor:pointer;transition:background .2s,color .2s">' + i[o].icon + " " + i[o].title + "</button>";
      }
      for (n += "</div>", o = 0; o < i.length; o++) {
        var l = r[i[o].key];
        if (l && l.length) {
          n += '<ul class="tin-doc-list" data-panel="' + i[o].key + '" style="' + (0 === o ? "" : "display:none;") + 'list-style:none;padding:0;margin:0">';
          for (var a = 0; a < l.length; a++) {
            n += '<li style="display:flex;align-items:flex-start;gap:.6rem;padding:.6rem 0;border-bottom:1px solid #f1f5f9;font-size:.88rem;color:#1a1a2e"><span style="color:var(--leg,#7c3aed);flex-shrink:0">&#10003;</span>' + l[a] + "</li>";
          }
          n += "</ul>";
        }
      }
      return n;
    },
    renderSteps: function(e) {
      var t = this.render(e);
      if (!t) {
        return "";
      }
      for (var r = t.tin.steps, i = '<ol class="tin-steps-list">', n = 0; n < r.length; n++) {
        i += "<li>" + r[n] + "</li>";
      }
      return i += "</ol>", t.tin.onlinePortal && (i += '<div style="margin-top:1rem"><a href="' + t.tin.onlinePortal + '" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:.5rem;padding:.75rem 1.5rem;min-height:44px;background:var(--leg,#7c3aed);color:#fff;border-radius:8px;font-size:.9rem;font-weight:600;text-decoration:none;cursor:pointer;transition:opacity .2s" onmouseover="this.style.opacity=\'.85\'" onmouseout="this.style.opacity=\'1\'">&#x1F310; Register Online at ' + t.tin.authorityAbbr + "</a></div>"),
      i;
    },
    renderVerification: function(e) {
      var t = this.render(e);
      if (!t) {
        return "";
      }
      var r = t.tin, i = '<div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:1.25rem;margin-top:1rem">';
      i += '<h3 style="font-size:.9rem;font-weight:700;margin:0 0 .75rem;color:#374151">HOW TO VERIFY YOUR ' + r.tinName.split("(")[0].trim().toUpperCase() + "</h3>";
      var n = [];
      r.verificationUrl && n.push('<a href="' + r.verificationUrl + '" target="_blank" rel="noopener" style="color:var(--leg,#7c3aed);text-decoration:underline">Online verification portal</a>'),
      r.ussdCode && n.push("USSD: Dial <strong>" + r.ussdCode + "</strong>"), r.onlinePortal && n.push('Check via <a href="' + r.onlinePortal + '" target="_blank" rel="noopener" style="color:var(--leg,#7c3aed);text-decoration:underline">' + r.authorityAbbr + " portal</a>"),
      n.push("Visit any " + r.authorityAbbr + " office with your ID"), i += '<ul style="list-style:none;padding:0;margin:0">';
      for (var o = 0; o < n.length; o++) {
        i += '<li style="padding:.4rem 0;font-size:.85rem;color:#4b5563">&#8226; ' + n[o] + "</li>";
      }
      return i += "</ul>", (i += '<p style="font-size:.82rem;color:#6b7280;margin:.75rem 0 0"><strong>Lost your ' + r.tinName.split("(")[0].trim() + "?</strong> Visit " + r.authorityAbbr + " with your national ID to retrieve it.</p>") + "</div>";
    },
    renderPenalties: function(e) {
      var t = this.render(e);
      if (!t) {
        return "";
      }
      var r = t.tin.penalties, i = '<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:1.25rem;margin-top:1rem">';
      return i += '<h3 style="font-size:.9rem;font-weight:700;margin:0 0 .75rem;color:#991b1b">&#9888; PENALTIES</h3>',
      i += '<ul style="list-style:none;padding:0;margin:0">', i += '<li style="padding:.4rem 0;font-size:.85rem;color:#7f1d1d"><strong>No registration:</strong> ' + r.noRegistration + "</li>",
      (i += '<li style="padding:.4rem 0;font-size:.85rem;color:#7f1d1d"><strong>Filing without TIN:</strong> ' + r.noTIN + "</li>") + "</ul></div>";
    },
    initPage: function(e) {
      var t = this, r = document.getElementById("tinInfoCards"), i = document.getElementById("tinDocs"), n = document.getElementById("tinSteps"), o = document.getElementById("tinVerify"), l = document.getElementById("tinPenalties");
      r && (r.innerHTML = t.renderInfoCards(e)), i && (i.innerHTML = t.renderDocs(e)),
      n && (n.innerHTML = t.renderSteps(e)), o && (o.innerHTML = t.renderVerification(e)),
      l && (l.innerHTML = t.renderPenalties(e));
      for (var a = document.querySelectorAll(".tin-doc-tab"), s = 0; s < a.length; s++) {
        a[s].addEventListener("click", function() {
          for (var e = this.getAttribute("data-tab"), t = document.querySelectorAll(".tin-doc-tab"), r = document.querySelectorAll(".tin-doc-list"), i = 0; i < t.length; i++) {
            t[i].classList.remove("active"), t[i].style.background = "#fff", t[i].style.color = "#374151";
          }
          for (i = 0; i < r.length; i++) {
            r[i].style.display = "none";
          }
          this.classList.add("active"), this.style.background = "var(--leg,#7c3aed)", this.style.color = "#fff";
          var n = document.querySelector('[data-panel="' + e + '"]');
          n && (n.style.display = "");
        });
      }
    }
  };
}();

!function() {
  "use strict";
  var n = {};
  function t(n, t) {
    return "number" != typeof n || isNaN(n) ? 0 : Math.round(n * Math.pow(10, t || 0)) / Math.pow(10, t || 0);
  }
  n.calculate = function(e, a) {
    var r = a[e.animalType];
    if (!r) {
      return {
        error: !0,
        msg: "Unknown animal type."
      };
    }
    var i = r.classes[e.animalClass];
    if (!i) {
      return {
        error: !0,
        msg: "Unknown animal class."
      };
    }
    var o = parseFloat(e.bodyWeight) || 300, c = parseInt(e.numAnimals) || 1, l = a.prices[e.countryCode] || {}, s = l.symbol || "", h = a.ingredients, u = o * i.dmi_pct / 100, m = u * i.cp_pct / 100 * 1e3, g = u * i.tdn_pct / 100 * 1e3, f = u * (i.me_mj || 9), d = e.selectedFeeds || [];
    if (!d.length) {
      return {
        error: !0,
        msg: "Please select at least one feed ingredient."
      };
    }
    var p = [], v = [], y = [], _ = [], E = [];
    d.forEach(function(n) {
      var t = h[n];
      t && ("roughage" === t.cat ? p.push(n) : "energy" === t.cat ? v.push(n) : "protein" === t.cat ? y.push(n) : "mineral" === t.cat ? _.push(n) : "additive" === t.cat && E.push(n));
    });
    var M = i.roughagePct || .6, w = Math.min(.015 * _.length, .03), K = Math.min(.005 * E.length, .01), b = 1 - M - w - K;
    p.length || (b += M, M = 0), v.length || y.length || (M += b, b = 0);
    var T = .65 * b, x = .35 * b;
    v.length || (x += T, T = 0), y.length || (T += x, x = 0);
    var k = M * u, A = T * u, C = x * u, F = w * u, P = K * u, N = [], B = 0, R = 0, j = 0;
    function D(n, e) {
      var a = h[n];
      if (a && !(e <= 0)) {
        var r = e / (a.dm / 100), i = (a.cp || 0) * e / 100 * 1e3, o = (a.tdn || 0) * e / 100 * 1e3, c = l[n] || 0, s = r * c;
        B += i, R += o, j += s, N.push({
          id: n,
          name: a.name,
          cat: a.cat,
          freshKg: t(r, 2),
          dmKg: t(e, 2),
          cp_g: t(i, 0),
          tdn_g: t(o, 0),
          cost: t(s, 2),
          pricePerKg: c,
          dm: a.dm,
          notes: a.notes || ""
        });
      }
    }
    if (p.length && k > 0) {
      var L = k / p.length;
      p.forEach(function(n) {
        D(n, L);
      });
    }
    v.length && A > 0 && (L = A / v.length, v.forEach(function(n) {
      D(n, L);
    })), y.length && C > 0 && (L = C / y.length, y.forEach(function(n) {
      D(n, L);
    })), _.forEach(function(n) {
      D(n, F / Math.max(_.length, 1));
    }), E.forEach(function(n) {
      D(n, P / Math.max(E.length, 1));
    });
    var U = B >= .9 * m, W = R >= .9 * g, q = t(B / (10 * u), 1), I = t(R / (10 * u), 1), O = t(j, 2), S = t(j * c, 2), z = t(30 * j, 2), G = t(j * c * 30, 2), H = t(j * c * 365, 0), J = !!(e.maxBudget && parseFloat(e.maxBudget) > 0 && O > parseFloat(e.maxBudget)), Q = n._altRation(e, a, u, i, p, v, y, _, E, l, h), V = n._schedule(N);
    return {
      ok: !0,
      animalType: e.animalType,
      animalClass: i.label || e.animalClass,
      bodyWeight: o,
      numAnimals: c,
      dmi: t(u, 2),
      req: {
        cp_g: t(m, 0),
        tdn_g: t(g, 0),
        me_mj: t(f, 1)
      },
      prov: {
        cp_g: t(B, 0),
        tdn_g: t(R, 0),
        cp_pct_diet: q,
        tdn_pct_diet: I
      },
      balance: {
        cp_ok: U,
        tdn_ok: W
      },
      ration: N,
      costs: {
        dailyPerAnimal: O,
        dailyTotal: S,
        monthlyPerAnimal: z,
        monthlyTotal: G,
        annualTotal: H
      },
      currency: l.currency || "",
      symbol: s,
      alt: Q,
      schedule: V,
      overBudget: J,
      countryNote: l.note || ""
    };
  }, n._altRation = function(n, e, a, r, i, o, c, l, s, h, u) {
    var m = Math.min(.7, Math.max(r.roughagePct, .55));
    i.length || (m = 0);
    var g = 1 - m - .02, f = .65 * g, d = .35 * g;
    o.length || (d += f, f = 0), c.length || (f += d, d = 0);
    var p = [], v = 0, y = 0, _ = 0, E = i.slice().sort(function(n, t) {
      return (h[n] || 0) - (h[t] || 0);
    }), M = E.slice(0, Math.min(2, E.length));
    if (M.length) {
      var w = m * a / M.length;
      M.forEach(function(n) {
        var e = u[n], a = w / (e.dm / 100), r = a * (h[n] || 0), i = (e.cp || 0) * w / 100 * 1e3, o = (e.tdn || 0) * w / 100 * 1e3;
        y += i, _ += o, v += r, p.push({
          name: e.name,
          freshKg: t(a, 2),
          dmKg: t(w, 2),
          cost: t(r, 2)
        });
      });
    }
    var K = o.slice().sort(function(n, t) {
      return (h[n] || 0) - (h[t] || 0);
    }), b = K.slice(0, Math.min(2, K.length));
    b.length && f > 0 && (w = f * a / b.length, b.forEach(function(n) {
      var e = u[n], a = w / (e.dm / 100), r = a * (h[n] || 0), i = (e.cp || 0) * w / 100 * 1e3, o = (e.tdn || 0) * w / 100 * 1e3;
      y += i, _ += o, v += r, p.push({
        name: e.name,
        freshKg: t(a, 2),
        dmKg: t(w, 2),
        cost: t(r, 2)
      });
    }));
    var T = c.slice().sort(function(n, t) {
      return (h[n] || 0) - (h[t] || 0);
    }), x = T.slice(0, Math.min(2, T.length));
    if (x.length && d > 0 && (w = d * a / x.length, x.forEach(function(n) {
      var e = u[n], a = w / (e.dm / 100), r = a * (h[n] || 0), i = (e.cp || 0) * w / 100 * 1e3, o = (e.tdn || 0) * w / 100 * 1e3;
      y += i, _ += o, v += r, p.push({
        name: e.name,
        freshKg: t(a, 2),
        dmKg: t(w, 2),
        cost: t(r, 2)
      });
    })), u.salt) {
      var k = .005 * a, A = k, C = A * (h.salt || 0);
      v += C, p.push({
        name: "Common salt",
        freshKg: t(A, 3),
        dmKg: t(k, 3),
        cost: t(C, 2)
      });
    }
    return {
      items: p,
      dailyCost: t(v, 2),
      cp_g: t(y, 0),
      tdn_g: t(_, 0)
    };
  }, n._schedule = function(n) {
    var t = n.filter(function(n) {
      return "roughage" === n.cat;
    }), e = n.filter(function(n) {
      return "energy" === n.cat || "protein" === n.cat;
    }), a = n.filter(function(n) {
      return "mineral" === n.cat || "additive" === n.cat;
    }), r = [], i = [];
    return e.forEach(function(n, t) {
      t % 2 == 0 ? r.push(n) : i.push(n);
    }), t.forEach(function(n, t) {
      t % 2 == 0 ? r.push(n) : i.push(n);
    }), a.forEach(function(n) {
      r.push(n);
    }), [ {
      period: "Morning (6–7 am)",
      items: r,
      note: "Mix concentrates and minerals. Offer fresh roughage after concentrates."
    }, {
      period: "Midday",
      items: [],
      note: "Ensure clean fresh water is always available. Provide salt lick free-choice."
    }, {
      period: "Evening (5–6 pm)",
      items: i,
      note: "Remaining concentrates + ad-lib roughage overnight."
    } ];
  }, n.fmt = function(n, t) {
    return "number" != typeof n || isNaN(n) ? "0" : n.toLocaleString(void 0, {
      minimumFractionDigits: t || 0,
      maximumFractionDigits: t || 2
    });
  }, n.fmtCurrency = function(t, e) {
    return (e || "") + " " + n.fmt(t, 2);
  }, window.AfroTools = window.AfroTools || {}, window.AfroTools.LivestockFeedEngine = n;
}();

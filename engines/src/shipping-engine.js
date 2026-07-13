var ShippingEngine = function() {
  "use strict";
  function t(t, e) {
    for (var r = null, a = 0; a < SHIPPING_ROUTES.corridors.length; a++) {
      if (SHIPPING_ROUTES.corridors[a].originCode === t) {
        for (var n = SHIPPING_ROUTES.corridors[a].destinations, i = 0; i < n.length; i++) {
          if (n[i].destCode === e) {
            r = n[i];
            break;
          }
        }
        if (r) {
          break;
        }
      }
    }
    return r;
  }
  return {
    estimate: function(e, r, a, n, i) {
      var s = t(e, r), o = {
        originCode: e,
        destCode: r,
        containerType: a,
        found: !!s
      };
      if (!s) {
        return o.message = "Direct route not found. Rates may be available via transhipment.",
        o;
      }
      if ("LCL" === a && s.sea && s.sea.LCL_cbm) {
        var u = s.sea.LCL_cbm;
        o.sea = {
          minUSD: Math.round(u.min * (n || 1)),
          maxUSD: Math.round(u.max * (n || 1)),
          perCBM: u,
          cbm: n || 1,
          transitDays: s.sea.transitDays,
          type: "LCL"
        };
      } else if ("LCL" !== a && s.sea && s.sea[a]) {
        var d = s.sea[a];
        o.sea = {
          minUSD: d.min,
          maxUSD: d.max,
          transitDays: s.sea.transitDays,
          type: a
        };
      }
      return s.air && "40ft" !== a && "40ftHC" !== a && (o.air = {
        minUSD: s.air.perKg ? Math.round(s.air.perKg.min * (i || 100)) : null,
        maxUSD: s.air.perKg ? Math.round(s.air.perKg.max * (i || 100)) : null,
        perKg: s.air.perKg,
        weightKg: i || 100,
        transitDays: s.air.transitDays
      }), o;
    },
    getOriginPorts: function() {
      return SHIPPING_ROUTES.originPorts;
    },
    getDestPorts: function() {
      return SHIPPING_ROUTES.destPorts;
    },
    getContainerTypes: function() {
      return SHIPPING_ROUTES.containerTypes;
    },
    getDestinations: function(t) {
      var e = SHIPPING_ROUTES.corridors.find(function(e) {
        return e.originCode === t;
      });
      return e ? e.destinations.map(function(t) {
        return SHIPPING_ROUTES.destPorts.find(function(e) {
          return e.code === t.destCode;
        }) || {
          code: t.destCode,
          name: t.destCode
        };
      }) : [];
    },
    findRoute: t,
    getObservations: function(t, e, r, a) {
      var n = [];
      if (a.sea && a.air) {
        var i = (a.sea.minUSD + a.sea.maxUSD) / 2, s = (((a.air.minUSD + a.air.maxUSD) / 2 - i) / i * 100).toFixed(0);
        n.push({
          type: "info",
          text: "Air freight costs approximately " + s + "% more than sea freight on this route — but saves " + (a.sea.transitDays.max - a.air.transitDays.min) + "+ days transit time."
        });
      }
      if (a.sea && a.sea.transitDays) {
        var o = a.sea.transitDays;
        n.push({
          type: "tip",
          text: "Typical sea transit: " + o.min + "–" + o.max + " days. Add 5–15 days for port clearance at destination."
        });
      }
      return n.push({
        type: "warn",
        text: "Rates shown are pre-freight estimates. Final cost depends on shipping line, peak season surcharges, fuel surcharges (BAF), and port congestion charges."
      }), n;
    }
  };
}();

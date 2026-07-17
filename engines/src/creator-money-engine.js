var CreatorMoneyEngine = function() {
  "use strict";
  var e = null;
  function t() {
    return e || (window.AfroAuth && "function" == typeof AfroAuth.getSupabase ? e = AfroAuth.getSupabase() : null);
  }
  function n() {
    return window.AfroAuth && AfroAuth.user ? AfroAuth.user.id : null;
  }
  var r = {
    NGN: {
      symbol: "₦",
      name: "Nigerian Naira"
    },
    KES: {
      symbol: "KES ",
      name: "Kenyan Shilling"
    },
    ZAR: {
      symbol: "R",
      name: "South African Rand"
    },
    GHS: {
      symbol: "GH₵",
      name: "Ghanaian Cedi"
    },
    TZS: {
      symbol: "TZS ",
      name: "Tanzanian Shilling"
    },
    EGP: {
      symbol: "EGP ",
      name: "Egyptian Pound"
    },
    UGX: {
      symbol: "UGX ",
      name: "Ugandan Shilling"
    },
    XOF: {
      symbol: "CFA ",
      name: "CFA Franc (West)"
    },
    XAF: {
      symbol: "CFA ",
      name: "CFA Franc (Central)"
    },
    MAD: {
      symbol: "MAD ",
      name: "Moroccan Dirham"
    },
    USD: {
      symbol: "$",
      name: "US Dollar"
    }
  }, o = "cm_transactions", a = "cm_goals";
  function i(e) {
    try {
      var t = localStorage.getItem(e);
      return t ? JSON.parse(t) : [];
    } catch (e) {
      return [];
    }
  }
  function c(e, t) {
    try {
      localStorage.setItem(e, JSON.stringify(t));
    } catch (e) {}
  }
  function s(e) {
    var t = i(o);
    return e ? t.filter(function(t) {
      return !(e.type && t.type !== e.type || e.month && t.date.slice(0, 7) !== e.month || e.year && t.date.slice(0, 4) !== e.year || e.category && t.category !== e.category || e.source && t.source !== e.source);
    }).sort(function(e, t) {
      return t.date.localeCompare(e.date);
    }) : t;
  }
  function u(e, t) {
    t = t || "NGN";
    var n = s({
      month: e
    }), r = 0, o = 0, a = {}, i = {}, c = [], u = [];
    n.forEach(function(e) {
      if (e.currency === t) {
        if ("income" === e.type) {
          r += e.amount;
          var n = e.source || "other";
          a[n] = (a[n] || 0) + e.amount, c.push(e);
        } else {
          o += e.amount;
          var s = e.category || "custom";
          i[s] = (i[s] || 0) + e.amount, u.push(e);
        }
      }
    });
    var d = r - o, l = r > 0 ? Math.round(d / r * 100) : 0;
    return {
      month: e,
      currency: t,
      income: r,
      expenses: o,
      profit: d,
      margin: l,
      incomeBySource: a,
      expenseByCategory: i,
      incomeItems: c,
      expenseItems: u,
      txCount: n.length
    };
  }
  function d() {
    return i(a);
  }
  function l(e) {
    e.id = e.id || m(), e.current_amount = e.current_amount || 0, e.status = "active",
    e.created_at = (new Date).toISOString();
    var t = d();
    return t.push(e), c(a, t), e;
  }
  function m() {
    return "cm_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }
  return {
    INCOME_SOURCES: [ {
      id: "client",
      label: "Client Payment",
      icon: "💼"
    }, {
      id: "brand_deal",
      label: "Brand Deal",
      icon: "🤝"
    }, {
      id: "digital_product",
      label: "Digital Product",
      icon: "📦"
    }, {
      id: "platform",
      label: "Platform Revenue",
      icon: "📱"
    }, {
      id: "workshop",
      label: "Workshop / Event",
      icon: "🎤"
    }, {
      id: "gift",
      label: "Gift / Tip",
      icon: "🎁"
    }, {
      id: "other",
      label: "Other",
      icon: "💰"
    } ],
    EXPENSE_CATEGORIES: [ {
      id: "equipment",
      label: "Equipment & Gear",
      icon: "📷",
      color: "#3B82F6"
    }, {
      id: "data",
      label: "Data & Internet",
      icon: "📶",
      color: "#8B5CF6"
    }, {
      id: "transport",
      label: "Transport & Travel",
      icon: "🚗",
      color: "#F59E0B"
    }, {
      id: "software",
      label: "Software & Subs",
      icon: "💻",
      color: "#EC4899"
    }, {
      id: "studio",
      label: "Studio & Workspace",
      icon: "🏠",
      color: "#14B8A6"
    }, {
      id: "marketing",
      label: "Marketing & Promo",
      icon: "📣",
      color: "#EF4444"
    }, {
      id: "props",
      label: "Props & Materials",
      icon: "🎨",
      color: "#F97316"
    }, {
      id: "team",
      label: "Team & Assistants",
      icon: "👥",
      color: "#06B6D4"
    }, {
      id: "food",
      label: "Food & Meetings",
      icon: "🍽️",
      color: "#84CC16"
    }, {
      id: "education",
      label: "Education & Courses",
      icon: "📚",
      color: "#6366F1"
    }, {
      id: "custom",
      label: "Other",
      icon: "📋",
      color: "#64748B"
    } ],
    CURRENCIES: r,
    addTransaction: function(e) {
      e.id = e.id || m(), e.created_at = e.created_at || (new Date).toISOString(), e.date = e.date || (new Date).toISOString().slice(0, 10),
      e.synced = !1;
      var r = i(o);
      return r.push(e), c(o, r), async function(e) {
        var r = t(), a = n();
        if (r && a) {
          var s = "income" === e.type ? "creator_income" : "creator_expenses", u = {
            user_id: a,
            amount: e.amount,
            currency: e.currency || "NGN",
            description: e.description || "",
            transaction_date: e.date,
            notes: e.notes || ""
          };
          "income" === e.type ? u.source = e.source || "other" : (u.vendor = e.vendor || "",
          u.is_business_expense = !1 !== e.is_business);
          try {
            await r.from(s).insert(u);
            var d = i(o), l = d.findIndex(function(t) {
              return t.id === e.id;
            });
            l >= 0 && (d[l].synced = !0, c(o, d));
          } catch (e) {}
        }
      }(e), e;
    },
    deleteTransaction: function(e) {
      var r = i(o).filter(function(t) {
        return t.id !== e;
      });
      c(o, r), async function(e) {
        var r = t(), o = n();
        if (r && o) {
          try {
            await r.from("creator_income").delete().eq("id", e).eq("user_id", o), await r.from("creator_expenses").delete().eq("id", e).eq("user_id", o);
          } catch (e) {}
        }
      }(e);
    },
    getTransactions: s,
    getMonthSummary: u,
    getLast6Months: function(e) {
      for (var t = [], n = new Date, r = 5; r >= 0; r--) {
        var o = new Date(n.getFullYear(), n.getMonth() - r, 1), a = o.toISOString().slice(0, 7), i = u(a, e);
        t.push({
          month: a,
          label: o.toLocaleDateString("en-US", {
            month: "short"
          }),
          profit: i.profit,
          income: i.income,
          expenses: i.expenses
        });
      }
      return t;
    },
    getYearSummary: function(e, t) {
      t = t || "NGN", e = e || (new Date).getFullYear().toString();
      for (var n = [], r = 0, o = 0, a = null, i = null, c = 0; c < 12; c++) {
        var s = u(e + "-" + String(c + 1).padStart(2, "0"), t);
        n.push(s), r += s.income, o += s.expenses, (!a || s.profit > a.profit) && (a = s),
        (!i || s.profit < i.profit) && (i = s);
      }
      return {
        year: e,
        currency: t,
        months: n,
        totalIncome: r,
        totalExpenses: o,
        totalProfit: r - o,
        margin: r > 0 ? Math.round((r - o) / r * 100) : 0,
        bestMonth: a,
        worstMonth: i
      };
    },
    getGoals: d,
    addGoal: l,
    updateGoal: function(e, t) {
      var n = d(), r = n.findIndex(function(t) {
        return t.id === e;
      });
      return r >= 0 && (Object.assign(n[r], t), c(a, n)), n[r] || null;
    },
    deleteGoal: function(e) {
      var t = d().filter(function(t) {
        return t.id !== e;
      });
      c(a, t);
    },
    formatMoney: function(e, t) {
      var n, o = r[t = t || "NGN"] || {
        symbol: t + " "
      }, a = Math.abs(e);
      return n = a >= 1e6 ? (a / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : a >= 1e3 ? a.toLocaleString("en-US") : a.toString(),
      (e < 0 ? "-" : "") + o.symbol + n;
    },
    formatMonthLabel: function(e) {
      var t = e.split("-");
      return new Date(parseInt(t[0]), parseInt(t[1]) - 1, 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
      });
    },
    syncFromSupabase: async function() {
      var e = t(), r = n();
      if (e && r) {
        try {
          var a = new Date, s = new Date(a.getFullYear(), a.getMonth() - 1, 1).toISOString().slice(0, 10), [u, d] = await Promise.all([ e.from("creator_income").select("*").eq("user_id", r).gte("transaction_date", s).order("transaction_date", {
            ascending: !1
          }), e.from("creator_expenses").select("*").eq("user_id", r).gte("transaction_date", s).order("transaction_date", {
            ascending: !1
          }) ]), l = [];
          u.data && u.data.forEach(function(e) {
            l.push({
              id: e.id,
              type: "income",
              amount: e.amount,
              currency: e.currency,
              source: e.source,
              description: e.description,
              date: e.transaction_date,
              notes: e.notes,
              synced: !0,
              created_at: e.created_at
            });
          }), d.data && d.data.forEach(function(e) {
            l.push({
              id: e.id,
              type: "expense",
              amount: e.amount,
              currency: e.currency,
              category: e.category_id,
              description: e.description,
              vendor: e.vendor,
              date: e.transaction_date,
              notes: e.notes,
              is_business: e.is_business_expense,
              synced: !0,
              created_at: e.created_at
            });
          });
          var m = i(o).filter(function(e) {
            return !e.synced;
          }), p = {};
          l.forEach(function(e) {
            p[e.id] = !0;
          }), m = m.filter(function(e) {
            return !p[e.id];
          });
          var y = l.concat(m);
          c(o, y);
        } catch (e) {}
      }
    },
    loadDemoData: function(e) {
      e = e || "NGN";
      var t = new Date, n = t.toISOString().slice(0, 7), r = new Date(t.getFullYear(), t.getMonth() - 1, 1).toISOString().slice(0, 7), a = [ {
        type: "income",
        amount: 32e4,
        currency: e,
        source: "client",
        description: "Wedding shoot — Adeyemi family",
        date: n + "-05"
      }, {
        type: "income",
        amount: 1e5,
        currency: e,
        source: "brand_deal",
        description: "Instagram sponsored post — Fanta Nigeria",
        date: n + "-12"
      }, {
        type: "income",
        amount: 5e4,
        currency: e,
        source: "digital_product",
        description: "Lightroom preset pack sales",
        date: n + "-08"
      }, {
        type: "income",
        amount: 25e3,
        currency: e,
        source: "gift",
        description: "Tip from satisfied client",
        date: n + "-18"
      }, {
        type: "expense",
        amount: 12e4,
        currency: e,
        category: "equipment",
        description: "Camera lens rental",
        vendor: "FotoHub Lagos",
        date: n + "-03",
        is_business: !0
      }, {
        type: "expense",
        amount: 6e4,
        currency: e,
        category: "data",
        description: "Monthly data bundle + WiFi",
        vendor: "MTN/Starlink",
        date: n + "-01",
        is_business: !0
      }, {
        type: "expense",
        amount: 48e3,
        currency: e,
        category: "transport",
        description: "Bolt rides to shoots (12 trips)",
        vendor: "Bolt",
        date: n + "-15",
        is_business: !0
      }, {
        type: "expense",
        amount: 4e4,
        currency: e,
        category: "software",
        description: "Adobe Creative Cloud + Canva Pro",
        vendor: "Adobe/Canva",
        date: n + "-01",
        is_business: !0
      }, {
        type: "expense",
        amount: 32e3,
        currency: e,
        category: "studio",
        description: "Studio rental — half month",
        vendor: "TekStudio Lekki",
        date: n + "-01",
        is_business: !0
      }, {
        type: "expense",
        amount: 2e4,
        currency: e,
        category: "marketing",
        description: "Instagram ad boost",
        vendor: "Meta",
        date: n + "-10",
        is_business: !0
      }, {
        type: "expense",
        amount: 15e3,
        currency: e,
        category: "food",
        description: "Client lunch meetings (3)",
        vendor: "Various",
        date: n + "-14",
        is_business: !0
      }, {
        type: "expense",
        amount: 65e3,
        currency: e,
        category: "custom",
        description: "Miscellaneous (fuel, prints, props)",
        vendor: "",
        date: n + "-20",
        is_business: !0
      }, {
        type: "income",
        amount: 25e4,
        currency: e,
        source: "client",
        description: "Corporate headshots — GTBank",
        date: r + "-10"
      }, {
        type: "income",
        amount: 8e4,
        currency: e,
        source: "client",
        description: "Product shoot — Konga",
        date: r + "-22"
      }, {
        type: "income",
        amount: 35e3,
        currency: e,
        source: "platform",
        description: "YouTube AdSense",
        date: r + "-28"
      }, {
        type: "expense",
        amount: 95e3,
        currency: e,
        category: "equipment",
        description: "Memory cards & battery",
        vendor: "Slot Nigeria",
        date: r + "-05",
        is_business: !0
      }, {
        type: "expense",
        amount: 55e3,
        currency: e,
        category: "data",
        description: "Data + WiFi",
        vendor: "MTN",
        date: r + "-01",
        is_business: !0
      }, {
        type: "expense",
        amount: 38e3,
        currency: e,
        category: "transport",
        description: "Transport",
        vendor: "Bolt/Uber",
        date: r + "-15",
        is_business: !0
      }, {
        type: "expense",
        amount: 4e4,
        currency: e,
        category: "software",
        description: "Software subs",
        vendor: "Adobe",
        date: r + "-01",
        is_business: !0
      } ];
      i(o).length > 0 || (a.forEach(function(e) {
        e.id = m(), e.created_at = (new Date).toISOString(), e.synced = !1;
      }), c(o, a), 0 === d().length && (l({
        name: "New camera body (Canon R6 II)",
        target_amount: 5e5,
        current_amount: 32e4,
        currency: e,
        deadline: "2026-06-30"
      }), l({
        name: "Emergency fund (3 months)",
        target_amount: 4e5,
        current_amount: 18e4,
        currency: e,
        deadline: "2026-12-31"
      })));
    }
  };
}();

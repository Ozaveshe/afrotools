window.TVAEngine = {
  RATES: {
    CI: {
      name: "Côte d'Ivoire",
      currency: "XOF",
      symbol: "FCFA",
      flag: "🇨🇮",
      standard: .18,
      reduced: [ {
        rate: .09,
        label: "Réduit (9%)"
      } ]
    },
    SN: {
      name: "Sénégal",
      currency: "XOF",
      symbol: "FCFA",
      flag: "🇸🇳",
      standard: .18,
      reduced: [ {
        rate: .1,
        label: "Réduit (10%)"
      } ]
    },
    CM: {
      name: "Cameroun",
      currency: "XAF",
      symbol: "FCFA",
      flag: "🇨🇲",
      standard: .1925,
      reduced: []
    },
    CD: {
      name: "RD Congo",
      currency: "CDF",
      symbol: "FC",
      flag: "🇨🇩",
      standard: .16,
      reduced: []
    },
    MA: {
      name: "Maroc",
      currency: "MAD",
      symbol: "MAD",
      flag: "🇲🇦",
      standard: .2,
      reduced: [ {
        rate: .14,
        label: "Réduit (14%)"
      }, {
        rate: .1,
        label: "Réduit (10%)"
      }, {
        rate: .07,
        label: "Super réduit (7%)"
      } ]
    },
    DZ: {
      name: "Algérie",
      currency: "DZD",
      symbol: "DA",
      flag: "🇩🇿",
      standard: .19,
      reduced: [ {
        rate: .09,
        label: "Réduit (9%)"
      } ]
    },
    TN: {
      name: "Tunisie",
      currency: "TND",
      symbol: "DT",
      flag: "🇹🇳",
      standard: .19,
      reduced: [ {
        rate: .13,
        label: "Réduit (13%)"
      }, {
        rate: .07,
        label: "Réduit (7%)"
      } ]
    },
    ML: {
      name: "Mali",
      currency: "XOF",
      symbol: "FCFA",
      flag: "🇲🇱",
      standard: .18,
      reduced: []
    },
    BF: {
      name: "Burkina Faso",
      currency: "XOF",
      symbol: "FCFA",
      flag: "🇧🇫",
      standard: .18,
      reduced: []
    },
    NE: {
      name: "Niger",
      currency: "XOF",
      symbol: "FCFA",
      flag: "🇳🇪",
      standard: .19,
      reduced: []
    },
    GN: {
      name: "Guinée",
      currency: "GNF",
      symbol: "FG",
      flag: "🇬🇳",
      standard: .18,
      reduced: []
    },
    CG: {
      name: "Congo",
      currency: "XAF",
      symbol: "FCFA",
      flag: "🇨🇬",
      standard: .18,
      reduced: [ {
        rate: .05,
        label: "Réduit (5%)"
      } ]
    },
    GA: {
      name: "Gabon",
      currency: "XAF",
      symbol: "FCFA",
      flag: "🇬🇦",
      standard: .18,
      reduced: [ {
        rate: .1,
        label: "Réduit (10%)"
      } ]
    },
    TG: {
      name: "Togo",
      currency: "XOF",
      symbol: "FCFA",
      flag: "🇹🇬",
      standard: .18,
      reduced: [ {
        rate: .1,
        label: "Réduit (10%)"
      } ]
    }
  },
  /**
   * amount: HT when mode is "add", TTC when mode is "extract".
   * rate:   decimal fraction, e.g. 0.18 for 18%.
   *
   * A missing amount or rate is not zero VAT. Called with no arguments this
   * used to return { ht: undefined, tva: NaN, ttc: NaN } and any page
   * rendering that showed "NaN FCFA" to the user. Both inputs are required.
   */
  calculate: function(amount, rate, mode) {
    mode = mode || "add";

    var value = typeof amount === "number" ? amount : parseFloat(amount);
    if (!isFinite(value) || value <= 0) {
      return { error: "Saisissez un montant supérieur à zéro." };
    }

    var pct = typeof rate === "number" ? rate : parseFloat(rate);
    // 0 is a real rate (exports are zero-rated), so only reject a missing,
    // non-numeric or out-of-range one. Rates are fractions, never percents.
    if (!isFinite(pct) || pct < 0 || pct >= 1) {
      return { error: "Sélectionnez un taux de TVA valide." };
    }

    if (mode === "add") {
      var tva = value * pct;
      return { ht: value, tva: tva, ttc: value + tva, rate: pct };
    }

    var ht = value / (1 + pct);
    return { ht: ht, tva: value - ht, ttc: value, rate: pct };
  }
};

!function(e) {
  "use strict";
  var t = {}, r = "/.netlify/functions";
  function i() {
    var t = e.AfroAuth && "function" == typeof e.AfroAuth.getSessionToken ? e.AfroAuth.getSessionToken() : null, r = {
      "Content-Type": "application/json"
    };
    return t && (r.Authorization = "Bearer " + t), r;
  }
  var a = {
    informal_fx_rate: "informal_fx_rate",
    forex_rate: "informal_fx_rate",
    forex_rates: "informal_fx_rate",
    remittance_quote: "remittance_quote",
    remittance_quotes: "remittance_quote",
    fuel_price: "fuel_price",
    fuel_prices: "fuel_price",
    transport_fare: "transport_fare",
    transport_fares: "transport_fare",
    transport: "transport_fare",
    staple_price: "staple_price",
    staple_prices: "staple_price",
    product_price: "staple_price",
    product_prices: "staple_price",
    food_prices: "staple_price",
    rent_listing: "rent_listing",
    rent_listings: "rent_listing",
    rent_housing: "rent_listing",
    rent: "rent_listing",
    lease_risk_report: "lease_risk_report",
    lease_risk_check: "lease_risk_report",
    salary_report: "salary_report",
    salaries: "salary_report",
    salary: "salary_report",
    fintech_fee: "fintech_fee",
    fintech_fees: "fintech_fee",
    backup_power_cost: "backup_power_cost",
    business_cost: "backup_power_cost",
    business_costs: "backup_power_cost",
    school_fee: "school_fee",
    school_fees: "school_fee",
    education_cost: "school_fee",
    education_costs: "school_fee",
    clinic_cost: "clinic_cost",
    clinic_costs: "clinic_cost",
    pharmacy_price: "pharmacy_price",
    pharmacy_prices: "pharmacy_price",
    wholesale_retail_spread: "wholesale_retail_spread",
    wholesale_retail: "wholesale_retail_spread"
  }, n = [ {
    id: "informal_fx_rate",
    vertical: "fx_remittance",
    label: "Informal FX Rates",
    emoji: "FX",
    points: 12,
    bonus: 5,
    consensus: 3,
    window_days: 2,
    threshold: .08
  }, {
    id: "remittance_quote",
    vertical: "fx_remittance",
    label: "Remittance Quotes",
    emoji: "RM",
    points: 12,
    bonus: 5,
    consensus: 2,
    window_days: 7,
    threshold: .12
  }, {
    id: "fuel_price",
    vertical: "fuel_transport",
    label: "Fuel Prices",
    emoji: "FL",
    points: 8,
    bonus: 3,
    consensus: 2,
    window_days: 7,
    threshold: .2
  }, {
    id: "transport_fare",
    vertical: "fuel_transport",
    label: "Transport Fares",
    emoji: "TR",
    points: 8,
    bonus: 3,
    consensus: 3,
    window_days: 14,
    threshold: .2
  }, {
    id: "staple_price",
    vertical: "staple_basket",
    label: "Staple Basket Prices",
    emoji: "SB",
    points: 8,
    bonus: 3,
    consensus: 2,
    window_days: 14,
    threshold: .2
  }, {
    id: "rent_listing",
    vertical: "rent_intelligence",
    label: "Rent Intelligence",
    emoji: "RE",
    points: 15,
    bonus: 5,
    consensus: 2,
    window_days: 30,
    threshold: .2
  }, {
    id: "lease_risk_report",
    vertical: "rent_intelligence",
    label: "Lease Risk Check",
    emoji: "LK",
    points: 18,
    bonus: 5,
    consensus: 1,
    window_days: 30,
    threshold: 0
  }, {
    id: "salary_report",
    vertical: "salary_intelligence",
    label: "Salary Intelligence",
    emoji: "SA",
    points: 15,
    bonus: 0,
    consensus: 3,
    window_days: 90,
    threshold: .25
  }, {
    id: "fintech_fee",
    vertical: "fintech_fees",
    label: "Fintech Fees",
    emoji: "FF",
    points: 10,
    bonus: 5,
    consensus: 3,
    window_days: 30,
    threshold: .2
  }, {
    id: "backup_power_cost",
    vertical: "backup_power",
    label: "Backup Power Costs",
    emoji: "BP",
    points: 10,
    bonus: 4,
    consensus: 2,
    window_days: 30,
    threshold: .25
  }, {
    id: "school_fee",
    vertical: "school_fees",
    label: "School Fees",
    emoji: "SC",
    points: 10,
    bonus: 4,
    consensus: 2,
    window_days: 90,
    threshold: .2
  }, {
    id: "clinic_cost",
    vertical: "health_costs",
    label: "Clinic Costs",
    emoji: "CL",
    points: 12,
    bonus: 4,
    consensus: 2,
    window_days: 30,
    threshold: .2
  }, {
    id: "pharmacy_price",
    vertical: "health_costs",
    label: "Pharmacy Prices",
    emoji: "PH",
    points: 10,
    bonus: 4,
    consensus: 2,
    window_days: 30,
    threshold: .2
  }, {
    id: "wholesale_retail_spread",
    vertical: "wholesale_retail",
    label: "Wholesale vs Retail",
    emoji: "WR",
    points: 12,
    bonus: 4,
    consensus: 2,
    window_days: 21,
    threshold: .25
  } ], o = {
    informal_fx_rate: [ {
      key: "base_currency",
      label: "Base Currency",
      type: "text",
      required: !0,
      placeholder: "e.g. USD"
    }, {
      key: "target_currency",
      label: "Target Currency",
      type: "text",
      required: !0,
      placeholder: "e.g. NGN"
    }, {
      key: "buy_rate",
      label: "Buy Rate",
      type: "number",
      required: !0,
      min: 0
    }, {
      key: "sell_rate",
      label: "Sell Rate",
      type: "number",
      required: !1,
      min: 0
    }, {
      key: "market_type",
      label: "Market Type",
      type: "select",
      required: !0,
      options: [ "Street", "BDC", "P2P", "Community Dealer" ]
    } ],
    remittance_quote: [ {
      key: "provider",
      label: "Provider",
      type: "text",
      required: !0,
      placeholder: "e.g. Wise, LemFi"
    }, {
      key: "send_country",
      label: "From Country",
      type: "text",
      required: !0,
      placeholder: "e.g. US"
    }, {
      key: "receive_country",
      label: "To Country",
      type: "text",
      required: !0,
      placeholder: "e.g. NG"
    }, {
      key: "send_amount",
      label: "Send Amount",
      type: "number",
      required: !0,
      min: 0
    }, {
      key: "fee_amount",
      label: "Fee Amount",
      type: "number",
      required: !0,
      min: 0
    }, {
      key: "received_amount",
      label: "Recipient Gets",
      type: "number",
      required: !0,
      min: 0
    }, {
      key: "delivery_minutes",
      label: "Delivery Time (minutes)",
      type: "number",
      required: !1,
      min: 0
    } ],
    fuel_price: [ {
      key: "fuel_type",
      label: "Fuel Type",
      type: "select",
      required: !0,
      options: [ "Petrol", "Diesel", "LPG", "Kerosene" ]
    }, {
      key: "price_per_unit",
      label: "Price per Unit",
      type: "number",
      required: !0,
      min: 0
    }, {
      key: "unit",
      label: "Unit",
      type: "select",
      required: !0,
      options: [ "Liter", "Kilogram", "Gallon" ]
    }, {
      key: "station_name",
      label: "Station or Seller",
      type: "text",
      required: !1
    } ],
    transport_fare: [ {
      key: "transport_type",
      label: "Transport Type",
      type: "select",
      required: !0,
      options: [ "Bus", "Minibus", "Ride-hail", "Motorbike", "Train", "Ferry", "Tricycle" ]
    }, {
      key: "route_from",
      label: "Route From",
      type: "text",
      required: !0
    }, {
      key: "route_to",
      label: "Route To",
      type: "text",
      required: !0
    }, {
      key: "fare",
      label: "Fare",
      type: "number",
      required: !0,
      min: 0
    }, {
      key: "provider",
      label: "Operator",
      type: "text",
      required: !1
    } ],
    staple_price: [ {
      key: "product_name",
      label: "Item Name",
      type: "text",
      required: !0,
      placeholder: "e.g. Rice 1kg"
    }, {
      key: "product_category",
      label: "Category",
      type: "select",
      required: !0,
      options: [ "Food Staples", "Household", "Produce", "Protein", "Other" ]
    }, {
      key: "brand_name",
      label: "Brand (optional)",
      type: "text",
      required: !1
    }, {
      key: "price",
      label: "Observed Price",
      type: "number",
      required: !0,
      min: 0
    }, {
      key: "market_name",
      label: "Market or Store",
      type: "text",
      required: !1
    }, {
      key: "unit",
      label: "Unit",
      type: "text",
      required: !1,
      placeholder: "e.g. per kg, basket, pack"
    } ],
    rent_listing: [ {
      key: "property_type",
      label: "Property Type",
      type: "select",
      required: !0,
      options: [ "Room", "Apartment", "House", "Studio", "Shop", "Office" ]
    }, {
      key: "bedrooms",
      label: "Bedrooms",
      type: "number",
      required: !1,
      min: 0
    }, {
      key: "bathrooms",
      label: "Bathrooms",
      type: "number",
      required: !1,
      min: 0
    }, {
      key: "rent_amount",
      label: "Quoted Rent",
      type: "number",
      required: !0,
      min: 0
    }, {
      key: "rent_period",
      label: "Rent Period",
      type: "select",
      required: !0,
      options: [ "Monthly", "Annual" ]
    }, {
      key: "deposit_amount",
      label: "Deposit Amount",
      type: "number",
      required: !1,
      min: 0
    }, {
      key: "vacancy_status",
      label: "Vacancy Status",
      type: "select",
      required: !1,
      options: [ "Vacant", "Occupied", "Listed" ]
    }, {
      key: "listing_url",
      label: "Listing URL",
      type: "url",
      required: !1
    } ],
    lease_risk_report: [ {
      key: "listing_url",
      label: "Listing URL",
      type: "url",
      required: !0
    }, {
      key: "landlord_name",
      label: "Agent or Landlord Name",
      type: "text",
      required: !1
    }, {
      key: "property_type",
      label: "Property Type",
      type: "select",
      required: !0,
      options: [ "Room", "Apartment", "House", "Studio", "Shop", "Office" ]
    }, {
      key: "asking_rent",
      label: "Asking Rent",
      type: "number",
      required: !0,
      min: 0
    }, {
      key: "deposit_amount",
      label: "Deposit Asked",
      type: "number",
      required: !1,
      min: 0
    }, {
      key: "risk_score",
      label: "Risk Score (0-100)",
      type: "number",
      required: !1,
      min: 0
    }, {
      key: "scam_signals",
      label: "Scam Signals (comma-separated)",
      type: "text",
      required: !1,
      placeholder: "e.g. upfront fee, rushed viewing, no title docs"
    } ],
    salary_report: [ {
      key: "job_title",
      label: "Job Title",
      type: "text",
      required: !0
    }, {
      key: "role_category",
      label: "Role Category",
      type: "select",
      required: !0,
      options: [ "Engineering", "Design", "Sales", "Marketing", "Operations", "Finance", "Healthcare", "Education", "Other" ]
    }, {
      key: "industry",
      label: "Industry",
      type: "text",
      required: !0
    }, {
      key: "experience_level",
      label: "Experience Level",
      type: "select",
      required: !0,
      options: [ "Entry", "Mid", "Senior", "Lead", "Executive" ]
    }, {
      key: "monthly_gross",
      label: "Monthly Gross Pay",
      type: "number",
      required: !0,
      min: 0
    }, {
      key: "monthly_net",
      label: "Monthly Net Pay",
      type: "number",
      required: !1,
      min: 0
    }, {
      key: "company_size",
      label: "Company Size",
      type: "select",
      required: !1,
      options: [ "1-10", "11-50", "51-200", "200+" ]
    }, {
      key: "sector",
      label: "Sector",
      type: "select",
      required: !1,
      options: [ "Private", "Public", "NGO", "Contract" ]
    } ],
    fintech_fee: [ {
      key: "provider",
      label: "Provider",
      type: "text",
      required: !0
    }, {
      key: "transaction_type",
      label: "Fee Type",
      type: "select",
      required: !0,
      options: [ "Transfer", "Withdrawal", "Deposit", "ATM", "POS", "USSD", "Bill Payment" ]
    }, {
      key: "amount_range",
      label: "Amount Band",
      type: "text",
      required: !0,
      placeholder: "e.g. 0-1000"
    }, {
      key: "fee_amount",
      label: "Fee Amount",
      type: "number",
      required: !0,
      min: 0
    }, {
      key: "transaction_channel",
      label: "Channel",
      type: "select",
      required: !1,
      options: [ "App", "USSD", "Agent", "ATM", "Branch" ]
    } ],
    backup_power_cost: [ {
      key: "energy_type",
      label: "Energy Type",
      type: "select",
      required: !0,
      options: [ "Generator Fuel", "Diesel", "Petrol", "LPG", "Inverter Battery", "Solar" ]
    }, {
      key: "product_name",
      label: "Product or Setup",
      type: "text",
      required: !1
    }, {
      key: "cost_amount",
      label: "Observed Cost",
      type: "number",
      required: !0,
      min: 0
    }, {
      key: "unit",
      label: "Unit",
      type: "text",
      required: !1,
      placeholder: "e.g. liter, refill, panel"
    }, {
      key: "quantity",
      label: "Quantity",
      type: "number",
      required: !1,
      min: 0
    }, {
      key: "runtime_hours",
      label: "Runtime Hours (optional)",
      type: "number",
      required: !1,
      min: 0
    } ],
    school_fee: [ {
      key: "institution_name",
      label: "Institution Name",
      type: "text",
      required: !0
    }, {
      key: "education_level",
      label: "Level",
      type: "select",
      required: !0,
      options: [ "Primary", "Secondary", "University", "Vocational", "International" ]
    }, {
      key: "institution_type",
      label: "Institution Type",
      type: "select",
      required: !0,
      options: [ "Public", "Private", "Faith-based", "International" ]
    }, {
      key: "annual_tuition",
      label: "Annual Tuition",
      type: "number",
      required: !0,
      min: 0
    }, {
      key: "extras_total",
      label: "Extras Total",
      type: "number",
      required: !1,
      min: 0
    }, {
      key: "period",
      label: "Fee Period",
      type: "select",
      required: !0,
      options: [ "Annual", "Term", "Semester", "One-time" ]
    } ],
    clinic_cost: [ {
      key: "facility_name",
      label: "Facility Name",
      type: "text",
      required: !0
    }, {
      key: "facility_type",
      label: "Facility Type",
      type: "select",
      required: !0,
      options: [ "Clinic", "Hospital", "Health Centre", "Private Practice" ]
    }, {
      key: "service_name",
      label: "Service Name",
      type: "text",
      required: !0,
      placeholder: "e.g. Consultation, Scan, Delivery"
    }, {
      key: "cost_amount",
      label: "Observed Cost",
      type: "number",
      required: !0,
      min: 0
    }, {
      key: "wait_time_minutes",
      label: "Wait Time (minutes)",
      type: "number",
      required: !1,
      min: 0
    } ],
    pharmacy_price: [ {
      key: "pharmacy_name",
      label: "Pharmacy Name",
      type: "text",
      required: !1
    }, {
      key: "medicine_name",
      label: "Medicine Name",
      type: "text",
      required: !0
    }, {
      key: "brand_name",
      label: "Brand",
      type: "text",
      required: !1
    }, {
      key: "dosage",
      label: "Dosage",
      type: "text",
      required: !1,
      placeholder: "e.g. 500mg"
    }, {
      key: "pack_size",
      label: "Pack Size",
      type: "text",
      required: !1,
      placeholder: "e.g. 10 tablets"
    }, {
      key: "price_amount",
      label: "Observed Price",
      type: "number",
      required: !0,
      min: 0
    } ],
    wholesale_retail_spread: [ {
      key: "market_name",
      label: "Market Name",
      type: "text",
      required: !0
    }, {
      key: "product_name",
      label: "Product Name",
      type: "text",
      required: !0
    }, {
      key: "brand_name",
      label: "Brand",
      type: "text",
      required: !1
    }, {
      key: "wholesale_price",
      label: "Wholesale Price",
      type: "number",
      required: !0,
      min: 0
    }, {
      key: "retail_price",
      label: "Retail Price",
      type: "number",
      required: !0,
      min: 0
    }, {
      key: "spread_pct",
      label: "Spread % (optional)",
      type: "number",
      required: !1,
      min: 0
    } ]
  }, l = {
    DZ: "Algeria",
    AO: "Angola",
    BJ: "Benin",
    BW: "Botswana",
    BF: "Burkina Faso",
    BI: "Burundi",
    CV: "Cabo Verde",
    CM: "Cameroon",
    CF: "Central African Republic",
    TD: "Chad",
    KM: "Comoros",
    CG: "Congo",
    CD: "DR Congo",
    DJ: "Djibouti",
    EG: "Egypt",
    GQ: "Equatorial Guinea",
    ER: "Eritrea",
    SZ: "Eswatini",
    ET: "Ethiopia",
    GA: "Gabon",
    GM: "Gambia",
    GH: "Ghana",
    GN: "Guinea",
    GW: "Guinea-Bissau",
    CI: "Cote d'Ivoire",
    KE: "Kenya",
    LS: "Lesotho",
    LR: "Liberia",
    LY: "Libya",
    MG: "Madagascar",
    MW: "Malawi",
    ML: "Mali",
    MR: "Mauritania",
    MU: "Mauritius",
    MA: "Morocco",
    MZ: "Mozambique",
    NA: "Namibia",
    NE: "Niger",
    NG: "Nigeria",
    RW: "Rwanda",
    ST: "Sao Tome and Principe",
    SN: "Senegal",
    SC: "Seychelles",
    SL: "Sierra Leone",
    SO: "Somalia",
    ZA: "South Africa",
    SS: "South Sudan",
    SD: "Sudan",
    TZ: "Tanzania",
    TG: "Togo",
    TN: "Tunisia",
    UG: "Uganda",
    ZM: "Zambia",
    ZW: "Zimbabwe"
  }, s = {
    DZ: "DZD",
    AO: "AOA",
    BJ: "XOF",
    BW: "BWP",
    BF: "XOF",
    BI: "BIF",
    CV: "CVE",
    CM: "XAF",
    CF: "XAF",
    TD: "XAF",
    KM: "KMF",
    CG: "XAF",
    CD: "CDF",
    DJ: "DJF",
    EG: "EGP",
    GQ: "XAF",
    ER: "ERN",
    SZ: "SZL",
    ET: "ETB",
    GA: "XAF",
    GM: "GMD",
    GH: "GHS",
    GN: "GNF",
    GW: "XOF",
    CI: "XOF",
    KE: "KES",
    LS: "LSL",
    LR: "LRD",
    LY: "LYD",
    MG: "MGA",
    MW: "MWK",
    ML: "XOF",
    MR: "MRU",
    MU: "MUR",
    MA: "MAD",
    MZ: "MZN",
    NA: "NAD",
    NE: "XOF",
    NG: "NGN",
    RW: "RWF",
    ST: "STN",
    SN: "XOF",
    SC: "SCR",
    SL: "SLE",
    SO: "SOS",
    ZA: "ZAR",
    SS: "SSP",
    SD: "SDG",
    TZ: "TZS",
    TG: "XOF",
    TN: "TND",
    UG: "UGX",
    ZM: "ZMW",
    ZW: "ZWL"
  }, u = [ {
    id: "newcomer",
    label: "Newcomer",
    min_points: 0,
    min_trust: 0,
    color: "#94a3b8"
  }, {
    id: "contributor",
    label: "Contributor",
    min_points: 100,
    min_trust: 0,
    color: "#22c55e"
  }, {
    id: "trusted",
    label: "Trusted",
    min_points: 500,
    min_trust: 70,
    color: "#3b82f6"
  }, {
    id: "expert",
    label: "Expert",
    min_points: 2e3,
    min_trust: 85,
    color: "#a855f7"
  }, {
    id: "legend",
    label: "Legend",
    min_points: 1e4,
    min_trust: 90,
    color: "#f59e0b"
  } ];
  function c(e) {
    return e && a[String(e).trim().toLowerCase()] || null;
  }
  function p(e) {
    var t = c(e) || e;
    return n.find(function(e) {
      return e.id === t;
    }) || null;
  }
  async function y(e, i, a) {
    if (a) {
      var n = (o = t[a]) ? Date.now() - o.ts > 3e5 ? null : o.data : null;
      if (n) {
        return n;
      }
    }
    var o, l = await fetch(r + e, i || {}), s = await l.json();
    return a && !s.error && function(e, r) {
      t[e] = {
        data: r,
        ts: Date.now()
      };
    }(a, s), s;
  }
  var d = {
    API_BASE: r,
    DAILY_LIMIT: 20,
    CATEGORIES: n,
    CATEGORY_FIELDS: o,
    CATEGORY_ALIASES: a,
    COUNTRIES: l,
    CURRENCIES: s,
    RANKS: u,
    normalizeCategoryId: c,
    getCategoryById: p,
    getFieldsForCategory: function(e) {
      var t = c(e) || e;
      return o[t] || [];
    },
    getSubmissionPoints: function(e) {
      var t = p(e);
      return t ? t.points : 5;
    },
    getConfirmationBonus: function(e) {
      var t = p(e);
      return t ? t.bonus : 0;
    },
    getCountryName: function(e) {
      return l[e] || e;
    },
    getCurrency: function(e) {
      return s[e] || "USD";
    },
    getRankInfo: function(e) {
      return u.find(function(t) {
        return t.id === e;
      }) || u[0];
    },
    calculateRank: function(e, t) {
      for (var r = u[0], i = u.length - 1; i >= 0; i -= 1) {
        if (e >= u[i].min_points && t >= u[i].min_trust) {
          r = u[i];
          break;
        }
      }
      return r;
    },
    formatPoints: function(e) {
      return e >= 1e4 ? (e / 1e3).toFixed(1) + "k" : Number(e || 0).toLocaleString();
    },
    formatCash: function(e) {
      return "$" + (Number(e || 0) / 100).toFixed(2);
    },
    getStreakBonus: function(e) {
      return e >= 30 ? 100 : e >= 7 ? 20 : e >= 3 ? 5 : 0;
    },
    submitContribution: async function(e) {
      if (e && e.category && !e.subtype && (e.subtype = c(e.category) || e.category),
      e && e.subtype && !e.vertical) {
        var t = p(e.subtype);
        t && (e.vertical = t.vertical);
      }
      return y("/afropoints-submit", {
        method: "POST",
        headers: i(),
        body: JSON.stringify(e)
      });
    },
    getProfile: async function() {
      return y("/afropoints-profile", {
        headers: i()
      }, "ap_profile");
    },
    saveOnboarding: async function(e) {
      var r = await y("/afropoints-profile", {
        method: "POST",
        headers: i(),
        body: JSON.stringify({
          action: "onboarding",
          contributor_persona: e.contributor_persona,
          regular_countries: e.regular_countries || [],
          regular_cities: e.regular_cities || [],
          regular_neighborhoods: e.regular_neighborhoods || [],
          regular_routes: e.regular_routes || [],
          coverage_categories: e.coverage_categories || [],
          submission_frequency: e.submission_frequency,
          payout_preference: e.payout_preference,
          proof_comfort: e.proof_comfort
        })
      });
      return t.ap_profile = null, r;
    },
    getLeaderboard: async function(e, t) {
      var r = "ap_lb_" + (e || "global") + "_" + (t || "all_time");
      return y("/afropoints-leaderboard?scope=" + encodeURIComponent(e || "global") + "&period=" + encodeURIComponent(t || "all_time"), {
        headers: i()
      }, r);
    },
    getActivity: async function(e) {
      return y("/afropoints-profile?action=activity&limit=" + encodeURIComponent(e || 10), {
        headers: i()
      });
    },
    getBadges: async function() {
      return y("/afropoints-profile?action=badges", {
        headers: i()
      }, "ap_badges");
    },
    requestCashout: async function(e, t, r) {
      return y("/afropoints-cashout", {
        method: "POST",
        headers: i(),
        body: JSON.stringify({
          method: e,
          details: t,
          points_amount: r
        })
      });
    },
    getCashoutHistory: async function() {
      return y("/afropoints-cashout?action=history", {
        headers: i()
      });
    },
    submitBuyerLead: async function(e) {
      return y("/data-buyer-leads", {
        method: "POST",
        headers: i(),
        body: JSON.stringify(e)
      });
    },
    getBuyerLeads: async function(e) {
      return y("/data-buyer-leads" + (e && e.status ? "?status=" + encodeURIComponent(e.status) : ""), {
        headers: i()
      });
    }
  };
  e.AfroPointsEngine = d;
}(window);

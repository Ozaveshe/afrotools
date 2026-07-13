var AfroKitchenEngine = function() {
  "use strict";
  var e = null;
  function t() {
    return e || (window.AfroAuth && "function" == typeof AfroAuth.getSupabase ? e = AfroAuth.getSupabase() : window.supabase && window.supabase.createClient && (e = window.supabase.createClient("https://zpclagtgczsygrgztlts.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwY2xhZ3RnY3pzeWdyZ3p0bHRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NTg4MzIsImV4cCI6MjA4OTAzNDgzMn0._G-677vi2UTAhcU3t0aquvmd8lnQUBil53ok_Z623F0")),
    e);
  }
  var r = {};
  function o(e) {
    var t = r[e];
    return t && Date.now() - t.ts < 18e5 ? t.data : null;
  }
  function n(e, t) {
    r[e] = {
      data: t,
      ts: Date.now()
    };
  }
  var i = {
    NG: {
      name: "Nigeria",
      flag: "🇳🇬",
      region: "West Africa",
      currency: {
        code: "NGN",
        symbol: "₦"
      }
    },
    GH: {
      name: "Ghana",
      flag: "🇬🇭",
      region: "West Africa",
      currency: {
        code: "GHS",
        symbol: "GH₵"
      }
    },
    KE: {
      name: "Kenya",
      flag: "🇰🇪",
      region: "East Africa",
      currency: {
        code: "KES",
        symbol: "KSh"
      }
    },
    ZA: {
      name: "South Africa",
      flag: "🇿🇦",
      region: "Southern Africa",
      currency: {
        code: "ZAR",
        symbol: "R"
      }
    },
    EG: {
      name: "Egypt",
      flag: "🇪🇬",
      region: "North Africa",
      currency: {
        code: "EGP",
        symbol: "E£"
      }
    },
    ET: {
      name: "Ethiopia",
      flag: "🇪🇹",
      region: "East Africa",
      currency: {
        code: "ETB",
        symbol: "Br"
      }
    },
    TZ: {
      name: "Tanzania",
      flag: "🇹🇿",
      region: "East Africa",
      currency: {
        code: "TZS",
        symbol: "TSh"
      }
    },
    SN: {
      name: "Senegal",
      flag: "🇸🇳",
      region: "West Africa",
      currency: {
        code: "XOF",
        symbol: "CFA"
      }
    },
    MA: {
      name: "Morocco",
      flag: "🇲🇦",
      region: "North Africa",
      currency: {
        code: "MAD",
        symbol: "MAD"
      }
    },
    CM: {
      name: "Cameroon",
      flag: "🇨🇲",
      region: "West Africa",
      currency: {
        code: "XAF",
        symbol: "FCFA"
      }
    },
    CI: {
      name: "Côte d'Ivoire",
      flag: "🇨🇮",
      region: "West Africa",
      currency: {
        code: "XOF",
        symbol: "CFA"
      }
    },
    UG: {
      name: "Uganda",
      flag: "🇺🇬",
      region: "East Africa",
      currency: {
        code: "UGX",
        symbol: "USh"
      }
    },
    RW: {
      name: "Rwanda",
      flag: "🇷🇼",
      region: "East Africa",
      currency: {
        code: "RWF",
        symbol: "RF"
      }
    },
    MZ: {
      name: "Mozambique",
      flag: "🇲🇿",
      region: "East Africa",
      currency: {
        code: "MZN",
        symbol: "MT"
      }
    },
    MG: {
      name: "Madagascar",
      flag: "🇲🇬",
      region: "East Africa",
      currency: {
        code: "MGA",
        symbol: "Ar"
      }
    },
    ZM: {
      name: "Zambia",
      flag: "🇿🇲",
      region: "East Africa",
      currency: {
        code: "ZMW",
        symbol: "ZK"
      }
    },
    ZW: {
      name: "Zimbabwe",
      flag: "🇿🇼",
      region: "East Africa",
      currency: {
        code: "ZWL",
        symbol: "Z$"
      }
    },
    MW: {
      name: "Malawi",
      flag: "🇲🇼",
      region: "East Africa",
      currency: {
        code: "MWK",
        symbol: "MK"
      }
    },
    SO: {
      name: "Somalia",
      flag: "🇸🇴",
      region: "East Africa",
      currency: {
        code: "SOS",
        symbol: "Sh"
      }
    },
    DZ: {
      name: "Algeria",
      flag: "🇩🇿",
      region: "North Africa",
      currency: {
        code: "DZD",
        symbol: "DA"
      }
    },
    TN: {
      name: "Tunisia",
      flag: "🇹🇳",
      region: "North Africa",
      currency: {
        code: "TND",
        symbol: "DT"
      }
    },
    LY: {
      name: "Libya",
      flag: "🇱🇾",
      region: "North Africa",
      currency: {
        code: "LYD",
        symbol: "LD"
      }
    },
    SD: {
      name: "Sudan",
      flag: "🇸🇩",
      region: "North Africa",
      currency: {
        code: "SDG",
        symbol: "SDG"
      }
    },
    AO: {
      name: "Angola",
      flag: "🇦🇴",
      region: "Southern Africa",
      currency: {
        code: "AOA",
        symbol: "Kz"
      }
    },
    NA: {
      name: "Namibia",
      flag: "🇳🇦",
      region: "Southern Africa",
      currency: {
        code: "NAD",
        symbol: "N$"
      }
    },
    BW: {
      name: "Botswana",
      flag: "🇧🇼",
      region: "Southern Africa",
      currency: {
        code: "BWP",
        symbol: "P"
      }
    },
    LS: {
      name: "Lesotho",
      flag: "🇱🇸",
      region: "Southern Africa",
      currency: {
        code: "LSL",
        symbol: "L"
      }
    },
    SZ: {
      name: "Eswatini",
      flag: "🇸🇿",
      region: "Southern Africa",
      currency: {
        code: "SZL",
        symbol: "E"
      }
    },
    ML: {
      name: "Mali",
      flag: "🇲🇱",
      region: "West Africa",
      currency: {
        code: "XOF",
        symbol: "CFA"
      }
    },
    BF: {
      name: "Burkina Faso",
      flag: "🇧🇫",
      region: "West Africa",
      currency: {
        code: "XOF",
        symbol: "CFA"
      }
    },
    GN: {
      name: "Guinea",
      flag: "🇬🇳",
      region: "West Africa",
      currency: {
        code: "GNF",
        symbol: "FG"
      }
    },
    NE: {
      name: "Niger",
      flag: "🇳🇪",
      region: "West Africa",
      currency: {
        code: "XOF",
        symbol: "CFA"
      }
    },
    TG: {
      name: "Togo",
      flag: "🇹🇬",
      region: "West Africa",
      currency: {
        code: "XOF",
        symbol: "CFA"
      }
    },
    BJ: {
      name: "Benin",
      flag: "🇧🇯",
      region: "West Africa",
      currency: {
        code: "XOF",
        symbol: "CFA"
      }
    },
    SL: {
      name: "Sierra Leone",
      flag: "🇸🇱",
      region: "West Africa",
      currency: {
        code: "SLE",
        symbol: "Le"
      }
    },
    LR: {
      name: "Liberia",
      flag: "🇱🇷",
      region: "West Africa",
      currency: {
        code: "LRD",
        symbol: "L$"
      }
    },
    GM: {
      name: "Gambia",
      flag: "🇬🇲",
      region: "West Africa",
      currency: {
        code: "GMD",
        symbol: "D"
      }
    },
    GW: {
      name: "Guinea-Bissau",
      flag: "🇬🇼",
      region: "West Africa",
      currency: {
        code: "XOF",
        symbol: "CFA"
      }
    },
    CV: {
      name: "Cabo Verde",
      flag: "🇨🇻",
      region: "West Africa",
      currency: {
        code: "CVE",
        symbol: "Esc"
      }
    },
    MR: {
      name: "Mauritania",
      flag: "🇲🇷",
      region: "West Africa",
      currency: {
        code: "MRU",
        symbol: "UM"
      }
    },
    CD: {
      name: "DR Congo",
      flag: "🇨🇩",
      region: "Central Africa",
      currency: {
        code: "CDF",
        symbol: "FC"
      }
    },
    CG: {
      name: "Congo",
      flag: "🇨🇬",
      region: "Central Africa",
      currency: {
        code: "XAF",
        symbol: "FCFA"
      }
    },
    TD: {
      name: "Chad",
      flag: "🇹🇩",
      region: "Central Africa",
      currency: {
        code: "XAF",
        symbol: "FCFA"
      }
    },
    CF: {
      name: "Central African Republic",
      flag: "🇨🇫",
      region: "Central Africa",
      currency: {
        code: "XAF",
        symbol: "FCFA"
      }
    },
    GA: {
      name: "Gabon",
      flag: "🇬🇦",
      region: "Central Africa",
      currency: {
        code: "XAF",
        symbol: "FCFA"
      }
    },
    GQ: {
      name: "Equatorial Guinea",
      flag: "🇬🇶",
      region: "Central Africa",
      currency: {
        code: "XAF",
        symbol: "FCFA"
      }
    },
    ST: {
      name: "São Tomé and Príncipe",
      flag: "🇸🇹",
      region: "Central Africa",
      currency: {
        code: "STN",
        symbol: "Db"
      }
    },
    BI: {
      name: "Burundi",
      flag: "🇧🇮",
      region: "East Africa",
      currency: {
        code: "BIF",
        symbol: "FBu"
      }
    },
    DJ: {
      name: "Djibouti",
      flag: "🇩🇯",
      region: "East Africa",
      currency: {
        code: "DJF",
        symbol: "Fdj"
      }
    },
    ER: {
      name: "Eritrea",
      flag: "🇪🇷",
      region: "East Africa",
      currency: {
        code: "ERN",
        symbol: "Nfk"
      }
    },
    KM: {
      name: "Comoros",
      flag: "🇰🇲",
      region: "East Africa",
      currency: {
        code: "KMF",
        symbol: "CF"
      }
    },
    SC: {
      name: "Seychelles",
      flag: "🇸🇨",
      region: "East Africa",
      currency: {
        code: "SCR",
        symbol: "SR"
      }
    },
    MU: {
      name: "Mauritius",
      flag: "🇲🇺",
      region: "East Africa",
      currency: {
        code: "MUR",
        symbol: "Rs"
      }
    },
    SS: {
      name: "South Sudan",
      flag: "🇸🇸",
      region: "East Africa",
      currency: {
        code: "SSP",
        symbol: "SSP"
      }
    }
  }, a = {
    cups: {
      ml: 250
    },
    tablespoons: {
      ml: 15
    },
    tablespoon: {
      ml: 15
    },
    teaspoons: {
      ml: 5
    },
    teaspoon: {
      ml: 5
    },
    ml: {
      ml: 1
    },
    litres: {
      ml: 1e3
    },
    litre: {
      ml: 1e3
    },
    g: {
      g: 1
    },
    kg: {
      g: 1e3
    },
    derica: {
      ml: 250
    },
    mudu: {
      ml: 2200
    },
    debe: {
      ml: 18e3
    },
    rubber: {
      ml: 500
    },
    congo: {
      ml: 4e3
    },
    paint_bucket: {
      ml: 4e3
    }
  };
  function s(e, t, r) {
    var o = r / t;
    return e.map(function(e) {
      return Object.assign({}, e, {
        scaled_amount: c(e.amount * o)
      });
    });
  }
  function c(e) {
    if (0 === e) {
      return 0;
    }
    var t = [ .125, .25, .333, .5, .667, .75 ], r = Math.floor(e), o = e - r;
    if (o < .06) {
      return r || e;
    }
    for (var n = 0; n < t.length; n++) {
      if (Math.abs(o - t[n]) < .06) {
        return r + t[n];
      }
    }
    return Math.round(10 * e) / 10;
  }
  function u(e) {
    if (0 === e) {
      return "0";
    }
    var t = Math.floor(e), r = e - t;
    if (r < .06) {
      return String(t || e);
    }
    var o = {
      .125: "⅛",
      .25: "¼",
      .333: "⅓",
      .5: "½",
      .667: "⅔",
      .75: "¾"
    };
    for (var n in o) {
      if (Math.abs(r - parseFloat(n)) < .06) {
        return t > 0 ? t + o[n] : o[n];
      }
    }
    return String(Math.round(10 * e) / 10);
  }
  var l = {}, d = 0;
  function m(e) {
    var t = Math.floor(e / 60), r = e % 60;
    return (t < 10 ? "0" : "") + t + ":" + (r < 10 ? "0" : "") + r;
  }
  var g = [ {
    id: "seed-jollof",
    slug: "nigerian-jollof-rice",
    name: "Nigerian Jollof Rice",
    name_local: "Jòlóf Rice",
    description: "The undisputed king of West African dishes — smoky, tomatoey, perfectly spiced one-pot rice that starts arguments at every family gathering.",
    country_code: "NG",
    country_name: "Nigeria",
    region: "West Africa",
    ethnic_group: "Yoruba (popularized nationally)",
    category: "main",
    tags: [ "rice", "tomato", "one-pot", "party", "iconic" ],
    diet_tags: [ "halal", "dairy-free" ],
    prep_time_minutes: 20,
    cook_time_minutes: 45,
    difficulty: "medium",
    default_servings: 6,
    serving_unit: "servings",
    story: "Jollof rice is more than food — it's identity. The Great Jollof Wars between Nigeria and Ghana have raged for decades, with each nation claiming supremacy. The dish originated from the Wolof people of Senegal (Thiéboudienne), traveled through trade routes, and was adapted by every West African country it touched. Nigerian jollof is distinguished by its use of fresh tomatoes and scotch bonnet peppers blended into a base, long-grain parboiled rice, and the prized 'party jollof' smoky bottom — the slightly burnt rice at the bottom of the pot that guests fight over. No Nigerian wedding, naming ceremony, or Christmas is complete without it.",
    occasion: "celebration",
    best_served_with: "Fried plantain (dodo), coleslaw, grilled chicken or beef, and a cold bottle of malt drink or Chapman cocktail",
    regional_variations: "Ghanaian jollof uses basmati rice and more tomato paste for a deeper red color. Senegalese Thiéboudienne adds fish and vegetables. Sierra Leonean jollof uses palm oil. Each version is correct in its own country — and wrong in every other.",
    calories: 420,
    protein_g: 8,
    carbs_g: 62,
    fat_g: 14,
    fiber_g: 3,
    is_featured: !0,
    is_verified: !0,
    view_count: 1e3,
    image_url: "/assets/img/kitchen/jollof-rice-ng.webp",
    ingredients: [ {
      sort_order: 1,
      group_name: "For the rice",
      amount: 3,
      unit: "cups",
      name: "long-grain parboiled rice",
      prep_note: "rinsed until water runs clear"
    }, {
      sort_order: 2,
      group_name: "For the tomato base",
      amount: 6,
      unit: "pieces",
      name: "fresh Roma tomatoes",
      prep_note: "roughly chopped"
    }, {
      sort_order: 3,
      group_name: "For the tomato base",
      amount: 3,
      unit: "pieces",
      name: "red bell peppers (tatashe)",
      prep_note: "deseeded and chopped"
    }, {
      sort_order: 4,
      group_name: "For the tomato base",
      amount: 3,
      unit: "pieces",
      name: "scotch bonnet peppers (ata rodo)",
      prep_note: "adjust to taste"
    }, {
      sort_order: 5,
      group_name: "For the tomato base",
      amount: 1,
      unit: "large",
      name: "onion",
      prep_note: "roughly chopped (for blending)"
    }, {
      sort_order: 6,
      group_name: "For cooking",
      amount: 70,
      unit: "g",
      name: "tomato paste",
      prep_note: "about 4 tablespoons"
    }, {
      sort_order: 7,
      group_name: "For cooking",
      amount: 80,
      unit: "ml",
      name: "vegetable oil or groundnut oil"
    }, {
      sort_order: 8,
      group_name: "For cooking",
      amount: 1,
      unit: "large",
      name: "onion",
      prep_note: "thinly sliced (for frying)"
    }, {
      sort_order: 9,
      group_name: "For cooking",
      amount: 2,
      unit: "pieces",
      name: "bay leaves"
    }, {
      sort_order: 10,
      group_name: "For cooking",
      amount: 1,
      unit: "teaspoon",
      name: "dried thyme"
    }, {
      sort_order: 11,
      group_name: "For cooking",
      amount: 1,
      unit: "teaspoon",
      name: "curry powder"
    }, {
      sort_order: 12,
      group_name: "For cooking",
      amount: 2,
      unit: "cubes",
      name: "seasoning cubes (Maggi/Knorr)"
    }, {
      sort_order: 13,
      group_name: "For cooking",
      amount: 1,
      unit: "teaspoon",
      name: "salt",
      prep_note: "adjust to taste"
    }, {
      sort_order: 14,
      group_name: "For cooking",
      amount: 750,
      unit: "ml",
      name: "chicken stock or water",
      prep_note: "warm"
    }, {
      sort_order: 15,
      group_name: "Optional",
      amount: 1,
      unit: "tablespoon",
      name: "butter",
      is_optional: !0,
      prep_note: "for richness"
    } ],
    steps: [ {
      step_number: 1,
      title: "Blend the tomato base",
      instruction: "Add the fresh tomatoes, red bell peppers, scotch bonnet peppers, and the roughly chopped onion to a blender. Blend until very smooth — no chunks. You should have about 4-5 cups of blended mixture. Set aside.",
      tip: "Don't add water to the blender. The tomatoes have enough liquid. A smooth blend = smoother jollof."
    }, {
      step_number: 2,
      title: "Fry the tomato base",
      instruction: "Heat the vegetable oil in a large heavy-bottomed pot over medium-high heat. Add the thinly sliced onion and fry until translucent (about 3 minutes). Add the tomato paste and fry, stirring constantly, for 2-3 minutes until it darkens slightly.",
      timer_seconds: 180,
      timer_label: "Fry onions",
      tip: "Frying the tomato paste separately before adding the blended tomatoes removes the raw, tinny taste."
    }, {
      step_number: 3,
      title: "Cook down the tomato blend",
      instruction: "Pour in the entire blended tomato mixture. Stir well to combine with the fried paste. Add the bay leaves, thyme, curry powder, and seasoning cubes. Bring to a boil, then reduce heat to medium and let it cook, stirring occasionally, until the oil floats to the top and the mixture has reduced by about half. This is the most important step — don't rush it.",
      timer_seconds: 1800,
      timer_label: "Cook down tomatoes",
      tip: "You'll know it's ready when the oil separates and sits on top. If you taste it and it's still sharp/acidic, keep cooking. This should take 20-30 minutes."
    }, {
      step_number: 4,
      title: "Add rice and stock",
      instruction: "Add the rinsed parboiled rice directly into the tomato base. Stir to coat every grain. Pour in the warm chicken stock. Add salt to taste. Stir once more, then bring to a boil.",
      tip: "The liquid should sit about 1cm above the rice. If not, add a little more stock."
    }, {
      step_number: 5,
      title: "Cover and steam",
      instruction: "Once boiling, reduce heat to the lowest setting. Cover the pot tightly with aluminium foil first, then place the lid on top. The double seal traps steam and cooks the rice evenly. Do NOT open the pot or stir for 30 minutes.",
      timer_seconds: 1800,
      timer_label: "Steam rice (DON'T OPEN)",
      tip: "Resist the urge to check. Every time you lift the lid, you release steam and add 5 minutes to cooking time. Trust the process."
    }, {
      step_number: 6,
      title: "Check and fluff",
      instruction: "After 30 minutes, open the pot. The rice should be cooked through with each grain separate. If there's still liquid, cover and cook 5 more minutes. If the rice is still firm, sprinkle 2-3 tablespoons of water, cover, and steam for another 5 minutes. When done, add butter if using, remove bay leaves, and fluff gently with a fork.",
      tip: "The bottom of the pot may have slightly browned rice — this is the legendary 'party jollof bottom'. Serve it to your favourite person."
    } ]
  }, {
    id: "seed-ugali",
    slug: "ugali-sukuma-wiki",
    name: "Ugali na Sukuma Wiki",
    name_local: "Ugali na Sukuma Wiki",
    description: "Kenya's national comfort food — stiff maize porridge served with sautéed collard greens. Simple, filling, and the foundation of East African home cooking.",
    country_code: "KE",
    country_name: "Kenya",
    region: "East Africa",
    category: "main",
    tags: [ "maize", "greens", "staple", "comfort", "budget-friendly" ],
    diet_tags: [ "vegan", "gluten-free", "dairy-free" ],
    prep_time_minutes: 10,
    cook_time_minutes: 25,
    difficulty: "easy",
    default_servings: 4,
    serving_unit: "servings",
    story: "Ugali is to East Africa what bread is to France — fundamental, daily, and deeply personal. Every Kenyan family makes it slightly differently, and everyone's mother makes it best. The word 'sukuma wiki' literally means 'push the week' in Swahili, because these affordable greens help families stretch their budget through to payday. Together, ugali na sukuma wiki is the most eaten meal in Kenya, served in homes, office cafeterias, and roadside hotels (local restaurants) across the country.",
    occasion: "everyday",
    best_served_with: "Nyama choma (grilled meat), beef stew, fried fish, or just on its own with a cup of chai",
    regional_variations: "In Uganda it's called Posho, in Tanzania it's Ugali (same name, slightly different texture), in Malawi it's Nsima, in Zambia it's Nshima, in Zimbabwe it's Sadza, and in South Africa the softer version is called Pap.",
    calories: 380,
    protein_g: 9,
    carbs_g: 68,
    fat_g: 8,
    fiber_g: 5,
    is_featured: !0,
    is_verified: !0,
    view_count: 800,
    image_url: "/assets/img/recipes/ugali-sukuma-wiki.webp",
    ingredients: [ {
      sort_order: 1,
      group_name: "For ugali",
      amount: 2,
      unit: "cups",
      name: "white maize flour (unga)",
      prep_note: "sifted"
    }, {
      sort_order: 2,
      group_name: "For ugali",
      amount: 3,
      unit: "cups",
      name: "water"
    }, {
      sort_order: 3,
      group_name: "For ugali",
      amount: .5,
      unit: "teaspoon",
      name: "salt"
    }, {
      sort_order: 4,
      group_name: "For sukuma wiki",
      amount: 1,
      unit: "large bunch",
      name: "sukuma wiki (collard greens)",
      prep_note: "washed, stems removed, thinly sliced"
    }, {
      sort_order: 5,
      group_name: "For sukuma wiki",
      amount: 2,
      unit: "tablespoons",
      name: "vegetable oil or cooking fat"
    }, {
      sort_order: 6,
      group_name: "For sukuma wiki",
      amount: 1,
      unit: "medium",
      name: "onion",
      prep_note: "finely diced"
    }, {
      sort_order: 7,
      group_name: "For sukuma wiki",
      amount: 2,
      unit: "pieces",
      name: "tomatoes",
      prep_note: "diced"
    }, {
      sort_order: 8,
      group_name: "For sukuma wiki",
      amount: 1,
      unit: "teaspoon",
      name: "salt"
    }, {
      sort_order: 9,
      group_name: "For sukuma wiki",
      amount: .5,
      unit: "teaspoon",
      name: "Royco seasoning",
      substitution: "Use any chicken or vegetable bouillon powder"
    } ],
    steps: [ {
      step_number: 1,
      title: "Boil water for ugali",
      instruction: "Bring the water to a rolling boil in a heavy-bottomed sufuria (pot). Add the salt.",
      timer_seconds: 300,
      timer_label: "Boil water"
    }, {
      step_number: 2,
      title: "Add maize flour gradually",
      instruction: "Reduce heat to medium. Add about a quarter of the maize flour to the boiling water while stirring with a wooden spoon (mwiko). Let it cook for 2 minutes, stirring to prevent lumps. Then gradually add the remaining flour, mixing vigorously as you go. The mixture will get very thick — this is correct.",
      timer_seconds: 120,
      timer_label: "Initial flour cook",
      tip: "A wooden cooking stick (mwiko) works best. The stirring takes arm strength — this is your workout for the day."
    }, {
      step_number: 3,
      title: "Knead and cook the ugali",
      instruction: "Once all flour is incorporated, press the ugali against the sides and bottom of the pot with the mwiko, turning it over. Cover and let it cook on low heat for 5 minutes. Uncover, knead/press again, cover for another 3-5 minutes. The ugali is done when it pulls away cleanly from the sides of the pot and has a smooth surface.",
      timer_seconds: 480,
      timer_label: "Cook ugali",
      tip: "To serve, wet a plate with water, turn the pot upside down onto it, and tap the bottom. The ugali should slide out in a dome shape."
    }, {
      step_number: 4,
      title: "Prepare the sukuma wiki",
      instruction: "While ugali cooks, heat oil in a pan over medium heat. Fry the diced onion until soft and translucent (about 3 minutes). Add diced tomatoes and cook until they break down (2-3 minutes).",
      timer_seconds: 360,
      timer_label: "Fry onion & tomato"
    }, {
      step_number: 5,
      title: "Cook the greens",
      instruction: "Add the sliced sukuma wiki to the pan. Toss to combine with the onion-tomato mixture. Add salt and Royco seasoning. Stir-fry for 3-5 minutes until the greens are wilted but still bright green. Do not overcook — sukuma wiki should have a slight bite.",
      timer_seconds: 300,
      timer_label: "Cook greens",
      tip: "Overcooking makes sukuma wiki grey and mushy. It should still be vibrant green when you serve."
    }, {
      step_number: 6,
      title: "Serve",
      instruction: "Turn the ugali onto a serving plate. Spoon the sukuma wiki alongside it. To eat: pinch off a piece of ugali with your right hand, make an indent with your thumb, and use it to scoop up the sukuma wiki."
    } ]
  }, {
    id: "seed-doro-wat",
    slug: "ethiopian-doro-wat",
    name: "Doro Wat",
    name_local: "Doro Wat",
    description: "Ethiopia's crown jewel — a rich, deeply spiced chicken stew with hard-boiled eggs, served on injera. The dish that started the global Ethiopian food revolution.",
    country_code: "ET",
    country_name: "Ethiopia",
    region: "East Africa",
    category: "main",
    tags: [ "chicken", "spicy", "stew", "injera", "iconic" ],
    diet_tags: [ "halal", "gluten-free", "dairy-free" ],
    prep_time_minutes: 30,
    cook_time_minutes: 60,
    difficulty: "medium",
    default_servings: 6,
    story: "Doro Wat is the dish Ethiopians reserve for special occasions — holidays, weddings, and the breaking of religious fasts. The word 'doro' means chicken and 'wat' means stew. What makes it extraordinary is berbere, a complex spice blend of chili, fenugreek, cardamom, coriander, and a dozen more spices that each Ethiopian family guards as a secret recipe.",
    occasion: "festive",
    calories: 480,
    protein_g: 32,
    carbs_g: 18,
    fat_g: 30,
    fiber_g: 4,
    is_featured: !0,
    is_verified: !0,
    view_count: 700,
    image_url: "/assets/img/recipes/ethiopian-doro-wat.webp",
    best_served_with: "Injera (Ethiopian sourdough flatbread), side salads, and Ethiopian coffee ceremony",
    ingredients: [ {
      sort_order: 1,
      group_name: "Main",
      amount: 1,
      unit: "whole",
      name: "chicken",
      prep_note: "cut into 12 pieces, skin removed"
    }, {
      sort_order: 2,
      group_name: "Main",
      amount: 4,
      unit: "large",
      name: "red onions",
      prep_note: "very finely diced (no shortcuts)"
    }, {
      sort_order: 3,
      group_name: "Main",
      amount: 3,
      unit: "tablespoons",
      name: "berbere spice blend"
    }, {
      sort_order: 4,
      group_name: "Main",
      amount: 60,
      unit: "g",
      name: "niter kibbeh (Ethiopian spiced butter)",
      prep_note: "or regular butter"
    }, {
      sort_order: 5,
      group_name: "Main",
      amount: 3,
      unit: "tablespoons",
      name: "tomato paste"
    }, {
      sort_order: 6,
      group_name: "Main",
      amount: 4,
      unit: "cloves",
      name: "garlic",
      prep_note: "minced"
    }, {
      sort_order: 7,
      group_name: "Main",
      amount: 1,
      unit: "tablespoon",
      name: "fresh ginger",
      prep_note: "grated"
    }, {
      sort_order: 8,
      group_name: "Main",
      amount: 6,
      unit: "pieces",
      name: "hard-boiled eggs",
      prep_note: "peeled, scored with fork"
    }, {
      sort_order: 9,
      group_name: "Main",
      amount: 1,
      unit: "cup",
      name: "water or chicken stock"
    }, {
      sort_order: 10,
      group_name: "Main",
      amount: 1,
      unit: "tablespoon",
      name: "lemon juice"
    }, {
      sort_order: 11,
      group_name: "Main",
      amount: 1,
      unit: "teaspoon",
      name: "salt"
    }, {
      sort_order: 12,
      group_name: "Main",
      amount: .5,
      unit: "teaspoon",
      name: "black pepper"
    } ],
    steps: [ {
      step_number: 1,
      title: "Dry-fry the onions",
      instruction: "In a large heavy pot over medium heat, add the finely diced onions WITHOUT any oil or butter. Cook, stirring frequently, until they are deeply caramelized and reduced by half. This takes about 20 minutes and is the foundation of the dish.",
      timer_seconds: 1200,
      timer_label: "Caramelize onions",
      tip: "This step is non-negotiable. Ethiopian cooking relies on slowly caramelized onions for depth. Don't add oil or rush it."
    }, {
      step_number: 2,
      title: "Add spices and butter",
      instruction: "Add the niter kibbeh and stir until melted. Add garlic and ginger, cook for 2 minutes. Add the berbere spice and tomato paste. Cook, stirring constantly, for 5 minutes until the oil separates.",
      timer_seconds: 420,
      timer_label: "Cook spices"
    }, {
      step_number: 3,
      title: "Cook the chicken",
      instruction: "Add the chicken pieces and turn to coat in the spice mixture. Add water or stock. Bring to a simmer, cover, and cook for 35-40 minutes until the chicken is very tender and the sauce is thick and rich.",
      timer_seconds: 2400,
      timer_label: "Simmer chicken"
    }, {
      step_number: 4,
      title: "Add eggs and finish",
      instruction: "Add the scored hard-boiled eggs, nestling them into the sauce. Add lemon juice, adjust salt. Simmer uncovered for 10 more minutes so the eggs absorb the flavors.",
      timer_seconds: 600,
      timer_label: "Simmer with eggs",
      tip: "Scoring the eggs lets the berbere sauce seep into them, turning them a beautiful red."
    }, {
      step_number: 5,
      title: "Serve",
      instruction: "Serve the doro wat on a large piece of injera, with extra injera on the side for scooping. Each person should get two pieces of chicken and one egg."
    } ]
  }, {
    id: "seed-bobotie",
    slug: "south-african-bobotie",
    name: "Bobotie",
    name_local: "Bobotie",
    description: "South Africa's national dish — a Cape Malay-spiced minced meat bake with a golden egg custard topping. Sweet, savory, and uniquely African.",
    country_code: "ZA",
    country_name: "South Africa",
    region: "Southern Africa",
    category: "main",
    tags: [ "beef", "curry", "baked", "cape-malay", "iconic" ],
    diet_tags: [ "halal" ],
    prep_time_minutes: 20,
    cook_time_minutes: 45,
    difficulty: "easy",
    default_servings: 6,
    story: "Bobotie traces its roots to the Cape Malay community of Cape Town, descendants of Southeast Asian workers brought to South Africa by the Dutch East India Company in the 17th century. The dish blends Malay spices with local ingredients, creating something found nowhere else in the world.",
    occasion: "everyday",
    calories: 410,
    protein_g: 28,
    carbs_g: 22,
    fat_g: 24,
    fiber_g: 2,
    is_featured: !1,
    is_verified: !0,
    view_count: 500,
    image_url: "/assets/img/recipes/south-african-bobotie.webp",
    best_served_with: "Yellow rice with raisins and turmeric, sambal, and chutney",
    ingredients: [ {
      sort_order: 1,
      group_name: "Meat mixture",
      amount: 1,
      unit: "kg",
      name: "minced beef or lamb"
    }, {
      sort_order: 2,
      group_name: "Meat mixture",
      amount: 2,
      unit: "medium",
      name: "onions",
      prep_note: "finely chopped"
    }, {
      sort_order: 3,
      group_name: "Meat mixture",
      amount: 2,
      unit: "tablespoons",
      name: "curry powder"
    }, {
      sort_order: 4,
      group_name: "Meat mixture",
      amount: 1,
      unit: "tablespoon",
      name: "turmeric"
    }, {
      sort_order: 5,
      group_name: "Meat mixture",
      amount: 2,
      unit: "slices",
      name: "white bread",
      prep_note: "soaked in milk"
    }, {
      sort_order: 6,
      group_name: "Meat mixture",
      amount: 3,
      unit: "tablespoons",
      name: "apricot jam"
    }, {
      sort_order: 7,
      group_name: "Meat mixture",
      amount: 2,
      unit: "tablespoons",
      name: "vinegar"
    }, {
      sort_order: 8,
      group_name: "Meat mixture",
      amount: 30,
      unit: "g",
      name: "raisins or sultanas"
    }, {
      sort_order: 9,
      group_name: "Meat mixture",
      amount: 2,
      unit: "tablespoons",
      name: "butter"
    }, {
      sort_order: 10,
      group_name: "Meat mixture",
      amount: 4,
      unit: "pieces",
      name: "bay leaves"
    }, {
      sort_order: 11,
      group_name: "Topping",
      amount: 2,
      unit: "pieces",
      name: "eggs"
    }, {
      sort_order: 12,
      group_name: "Topping",
      amount: 200,
      unit: "ml",
      name: "milk"
    }, {
      sort_order: 13,
      group_name: "Topping",
      amount: .5,
      unit: "teaspoon",
      name: "salt"
    } ],
    steps: [ {
      step_number: 1,
      title: "Cook the meat mixture",
      instruction: "Preheat oven to 180°C. Heat butter in a large pan. Fry onions until soft (5 minutes). Add curry powder and turmeric, cook 1 minute. Add mince and brown well. Add soaked bread (squeezed), apricot jam, vinegar, raisins, and salt. Mix well.",
      timer_seconds: 600,
      timer_label: "Cook meat"
    }, {
      step_number: 2,
      title: "Transfer to baking dish",
      instruction: "Spoon the meat mixture into a greased baking dish. Press down firmly. Tuck bay leaves into the top."
    }, {
      step_number: 3,
      title: "Make the custard topping",
      instruction: "Whisk eggs, milk, and salt together. Pour evenly over the meat mixture."
    }, {
      step_number: 4,
      title: "Bake",
      instruction: "Bake at 180°C for 35-40 minutes until the custard is set and golden brown on top.",
      timer_seconds: 2400,
      timer_label: "Bake bobotie",
      tip: "The custard should be firm but still slightly wobbly in the center — it will set as it cools."
    }, {
      step_number: 5,
      title: "Serve",
      instruction: "Let rest for 5 minutes before serving. Serve with yellow rice, sambal (diced banana, coconut, chutney), and a side salad."
    } ]
  }, {
    id: "seed-thieb",
    slug: "senegalese-thieboudienne",
    name: "Thiéboudienne",
    name_local: "Ceebu Jën",
    description: "Senegal's national treasure — broken rice cooked in a rich tomato-fish sauce with stuffed fish and vegetables. The original jollof.",
    country_code: "SN",
    country_name: "Senegal",
    region: "West Africa",
    category: "main",
    tags: [ "fish", "rice", "tomato", "one-pot", "iconic" ],
    diet_tags: [ "halal", "dairy-free" ],
    prep_time_minutes: 30,
    cook_time_minutes: 60,
    difficulty: "hard",
    default_servings: 8,
    story: "Thiéboudienne (pronounced cheb-oo-jen) is the ancestor of all jollof rice. It originated in Saint-Louis, Senegal, and is UNESCO-recognized as an Intangible Cultural Heritage of Humanity. The name means 'rice and fish' in Wolof.",
    occasion: "everyday",
    calories: 520,
    protein_g: 28,
    carbs_g: 65,
    fat_g: 16,
    fiber_g: 4,
    is_featured: !0,
    is_verified: !0,
    view_count: 600,
    image_url: "/assets/img/recipes/senegalese-thieboudienne.webp",
    best_served_with: "Served communally from one large platter with lemon wedges and extra hot sauce",
    ingredients: [ {
      sort_order: 1,
      group_name: "Fish",
      amount: 1,
      unit: "kg",
      name: "whole white fish (thiof/grouper)",
      prep_note: "scored on each side"
    }, {
      sort_order: 2,
      group_name: "Stuffing (rôf)",
      amount: 1,
      unit: "bunch",
      name: "parsley",
      prep_note: "finely chopped"
    }, {
      sort_order: 3,
      group_name: "Stuffing (rôf)",
      amount: 4,
      unit: "cloves",
      name: "garlic",
      prep_note: "minced"
    }, {
      sort_order: 4,
      group_name: "Stuffing (rôf)",
      amount: 1,
      unit: "piece",
      name: "scotch bonnet pepper",
      prep_note: "minced"
    }, {
      sort_order: 5,
      group_name: "Stew",
      amount: 150,
      unit: "ml",
      name: "vegetable oil"
    }, {
      sort_order: 6,
      group_name: "Stew",
      amount: 2,
      unit: "large",
      name: "onions",
      prep_note: "sliced"
    }, {
      sort_order: 7,
      group_name: "Stew",
      amount: 200,
      unit: "g",
      name: "tomato paste"
    }, {
      sort_order: 8,
      group_name: "Stew",
      amount: 1,
      unit: "piece",
      name: "dried fish (gédj)"
    }, {
      sort_order: 9,
      group_name: "Stew",
      amount: 1,
      unit: "piece",
      name: "tamarind ball"
    }, {
      sort_order: 10,
      group_name: "Vegetables",
      amount: 1,
      unit: "piece",
      name: "cassava",
      prep_note: "peeled and halved"
    }, {
      sort_order: 11,
      group_name: "Vegetables",
      amount: 2,
      unit: "pieces",
      name: "carrots",
      prep_note: "halved"
    }, {
      sort_order: 12,
      group_name: "Vegetables",
      amount: 1,
      unit: "piece",
      name: "cabbage",
      prep_note: "quartered"
    }, {
      sort_order: 13,
      group_name: "Vegetables",
      amount: 2,
      unit: "pieces",
      name: "eggplant",
      prep_note: "halved"
    }, {
      sort_order: 14,
      group_name: "Rice",
      amount: 500,
      unit: "g",
      name: "broken rice (riz brisé)"
    } ],
    steps: [ {
      step_number: 1,
      title: "Stuff the fish",
      instruction: "Mix parsley, garlic, and scotch bonnet. Stuff into the score marks on the fish. Season fish with salt.",
      tip: "The stuffing (rôf) is what makes Thiéboudienne special."
    }, {
      step_number: 2,
      title: "Fry the fish",
      instruction: "Heat oil in a large pot. Fry the stuffed fish until golden on both sides (about 4 minutes per side). Remove and set aside.",
      timer_seconds: 480,
      timer_label: "Fry fish"
    }, {
      step_number: 3,
      title: "Build the sauce",
      instruction: "In the same oil, fry onions until golden. Add tomato paste and cook for 5 minutes. Add dried fish, tamarind, and enough water to cover (about 1.5L). Bring to a boil.",
      timer_seconds: 600,
      timer_label: "Cook sauce"
    }, {
      step_number: 4,
      title: "Cook vegetables",
      instruction: "Add the vegetables to the pot in order of cooking time: cassava and carrots first, then eggplant and cabbage. Simmer until just tender. Remove vegetables and set aside.",
      timer_seconds: 900,
      timer_label: "Cook vegetables"
    }, {
      step_number: 5,
      title: "Cook the rice",
      instruction: "Add the broken rice to the sauce. The liquid should cover the rice by 1cm. Nestle the fried fish on top. Cover tightly and cook on low heat until rice is done and has absorbed the sauce.",
      timer_seconds: 1800,
      timer_label: "Cook rice"
    }, {
      step_number: 6,
      title: "Serve",
      instruction: "Arrange rice on a large communal platter. Place the fish in the center, surround with vegetables. Drizzle any remaining sauce over the top."
    } ]
  }, {
    id: "seed-koshari",
    slug: "egyptian-koshari",
    name: "Koshari",
    name_local: "Kushari",
    description: "Egypt's beloved street food — layers of rice, lentils, macaroni, and chickpeas topped with spiced tomato sauce and crispy fried onions.",
    country_code: "EG",
    country_name: "Egypt",
    region: "North Africa",
    category: "main",
    tags: [ "vegetarian", "street-food", "carbs", "iconic", "budget-friendly" ],
    diet_tags: [ "vegan", "dairy-free" ],
    prep_time_minutes: 15,
    cook_time_minutes: 45,
    difficulty: "easy",
    default_servings: 6,
    story: "Koshari is Egypt's national dish and the ultimate street food. For as little as 10 Egyptian pounds, you get a towering bowl of carb-on-carb comfort. Every neighborhood in Cairo has its koshari cart or shop, and Egyptians are fiercely loyal to their favorite vendor.",
    occasion: "everyday",
    calories: 450,
    protein_g: 14,
    carbs_g: 78,
    fat_g: 8,
    fiber_g: 7,
    is_featured: !0,
    is_verified: !0,
    view_count: 550,
    image_url: "/assets/img/recipes/egyptian-koshari.webp",
    best_served_with: "Extra dakka (hot sauce) and a cold drink",
    ingredients: [ {
      sort_order: 1,
      group_name: "Base",
      amount: 1,
      unit: "cups",
      name: "Egyptian rice",
      prep_note: "rinsed"
    }, {
      sort_order: 2,
      group_name: "Base",
      amount: 1,
      unit: "cups",
      name: "brown lentils",
      prep_note: "rinsed"
    }, {
      sort_order: 3,
      group_name: "Base",
      amount: 1,
      unit: "cups",
      name: "elbow macaroni"
    }, {
      sort_order: 4,
      group_name: "Base",
      amount: 400,
      unit: "g",
      name: "chickpeas (canned)",
      prep_note: "drained"
    }, {
      sort_order: 5,
      group_name: "Tomato sauce",
      amount: 400,
      unit: "g",
      name: "crushed tomatoes"
    }, {
      sort_order: 6,
      group_name: "Tomato sauce",
      amount: 4,
      unit: "cloves",
      name: "garlic",
      prep_note: "minced"
    }, {
      sort_order: 7,
      group_name: "Tomato sauce",
      amount: 2,
      unit: "tablespoons",
      name: "white vinegar"
    }, {
      sort_order: 8,
      group_name: "Tomato sauce",
      amount: 1,
      unit: "teaspoon",
      name: "cumin"
    }, {
      sort_order: 9,
      group_name: "Tomato sauce",
      amount: .5,
      unit: "teaspoon",
      name: "chili flakes"
    }, {
      sort_order: 10,
      group_name: "Crispy onions",
      amount: 3,
      unit: "large",
      name: "onions",
      prep_note: "thinly sliced into rings"
    }, {
      sort_order: 11,
      group_name: "Crispy onions",
      amount: 250,
      unit: "ml",
      name: "vegetable oil for frying"
    } ],
    steps: [ {
      step_number: 1,
      title: "Cook lentils and rice",
      instruction: "Cook the lentils in boiling water for 15 minutes until almost done. Add the rice to the same pot with fresh water (2:1 ratio) and cook together until both are tender.",
      timer_seconds: 1200,
      timer_label: "Cook lentils & rice"
    }, {
      step_number: 2,
      title: "Cook macaroni",
      instruction: "Boil the macaroni in salted water until al dente. Drain and toss with a little oil to prevent sticking.",
      timer_seconds: 600,
      timer_label: "Cook pasta"
    }, {
      step_number: 3,
      title: "Make the tomato sauce (dakka)",
      instruction: "In a saucepan, heat a tablespoon of oil. Fry garlic until golden. Add crushed tomatoes, vinegar, cumin, chili, salt. Simmer for 15 minutes until thick.",
      timer_seconds: 900,
      timer_label: "Simmer sauce"
    }, {
      step_number: 4,
      title: "Fry the onions",
      instruction: "Heat oil in a pan. Fry the sliced onions, stirring occasionally, until deep golden and crispy. This takes patience. Drain on paper towels.",
      timer_seconds: 600,
      timer_label: "Fry onions",
      tip: "Low and slow is the key to crispy onions. High heat will burn them before they crisp."
    }, {
      step_number: 5,
      title: "Assemble and serve",
      instruction: "In each bowl, layer: rice and lentils first, then macaroni, then chickpeas. Pour hot tomato sauce generously over the top. Crown with a mountain of crispy onions. Serve with extra hot sauce (shatta) on the side."
    } ]
  }, {
    id: "seed-tagine",
    slug: "moroccan-chicken-tagine",
    name: "Chicken Tagine with Preserved Lemons",
    name_local: "Tagine Djaj",
    description: "Morocco's signature slow-cooked stew — tender chicken with preserved lemons, olives, and a fragrant blend of spices in a conical clay pot.",
    country_code: "MA",
    country_name: "Morocco",
    region: "North Africa",
    category: "main",
    tags: [ "chicken", "slow-cooked", "preserved-lemon", "olives", "iconic" ],
    diet_tags: [ "halal", "gluten-free", "dairy-free" ],
    prep_time_minutes: 20,
    cook_time_minutes: 60,
    difficulty: "medium",
    default_servings: 4,
    story: "The tagine is both the conical clay cooking vessel and the dish itself. Moroccan tagine cooking is an art of patience — low heat and long simmering create complex flavors from simple ingredients.",
    occasion: "everyday",
    calories: 390,
    protein_g: 35,
    carbs_g: 12,
    fat_g: 22,
    fiber_g: 3,
    is_featured: !1,
    is_verified: !0,
    view_count: 450,
    image_url: "/assets/img/recipes/moroccan-chicken-tagine.webp",
    best_served_with: "Couscous or crusty Moroccan bread for soaking up the sauce",
    ingredients: [ {
      sort_order: 1,
      group_name: "Main",
      amount: 1,
      unit: "whole",
      name: "chicken",
      prep_note: "cut into 8 pieces"
    }, {
      sort_order: 2,
      group_name: "Main",
      amount: 2,
      unit: "pieces",
      name: "preserved lemons",
      prep_note: "pulp discarded, rind sliced"
    }, {
      sort_order: 3,
      group_name: "Main",
      amount: 150,
      unit: "g",
      name: "green olives"
    }, {
      sort_order: 4,
      group_name: "Main",
      amount: 1,
      unit: "large",
      name: "onion",
      prep_note: "grated"
    }, {
      sort_order: 5,
      group_name: "Spices",
      amount: 1,
      unit: "teaspoon",
      name: "ground ginger"
    }, {
      sort_order: 6,
      group_name: "Spices",
      amount: 1,
      unit: "teaspoon",
      name: "turmeric"
    }, {
      sort_order: 7,
      group_name: "Spices",
      amount: .5,
      unit: "teaspoon",
      name: "saffron threads"
    }, {
      sort_order: 8,
      group_name: "Spices",
      amount: .5,
      unit: "teaspoon",
      name: "black pepper"
    }, {
      sort_order: 9,
      group_name: "Main",
      amount: 3,
      unit: "tablespoons",
      name: "olive oil"
    }, {
      sort_order: 10,
      group_name: "Main",
      amount: 1,
      unit: "bunch",
      name: "fresh coriander",
      prep_note: "chopped"
    }, {
      sort_order: 11,
      group_name: "Main",
      amount: 250,
      unit: "ml",
      name: "water"
    } ],
    steps: [ {
      step_number: 1,
      title: "Marinate the chicken",
      instruction: "In a large bowl, combine chicken pieces with grated onion, ginger, turmeric, saffron, pepper, olive oil, and half the coriander. Mix well and let marinate for at least 30 minutes (or overnight).",
      timer_seconds: 1800,
      timer_label: "Marinate"
    }, {
      step_number: 2,
      title: "Cook the chicken",
      instruction: "Transfer everything to a tagine or heavy pot. Add water. Bring to a simmer, cover, and cook on low heat for 45 minutes, turning chicken halfway through.",
      timer_seconds: 2700,
      timer_label: "Cook chicken"
    }, {
      step_number: 3,
      title: "Add lemons and olives",
      instruction: "Add the preserved lemon rinds and olives. Cook uncovered for 10 more minutes to reduce the sauce slightly.",
      timer_seconds: 600,
      timer_label: "Finish"
    }, {
      step_number: 4,
      title: "Serve",
      instruction: "Garnish with remaining fresh coriander. Serve directly from the tagine with bread or couscous."
    } ]
  }, {
    id: "seed-waakye",
    slug: "ghanaian-waakye",
    name: "Waakye",
    name_local: "Waakye",
    description: "Ghana's iconic rice and beans — stained a deep burgundy with sorghum leaves, served with a parade of sides that make it a complete feast.",
    country_code: "GH",
    country_name: "Ghana",
    region: "West Africa",
    category: "main",
    tags: [ "rice", "beans", "street-food", "iconic", "budget-friendly" ],
    diet_tags: [ "vegan", "gluten-free" ],
    prep_time_minutes: 15,
    cook_time_minutes: 50,
    difficulty: "easy",
    default_servings: 6,
    story: "Waakye (pronounced waa-chay) originated from the Hausa people of Northern Ghana. The distinctive dark color comes from dried sorghum leaves (waakye leaves) or millet stalks added during cooking. It's served on banana leaves and is Ghana's most popular breakfast and lunch street food.",
    occasion: "everyday",
    calories: 360,
    protein_g: 12,
    carbs_g: 60,
    fat_g: 8,
    fiber_g: 6,
    is_featured: !1,
    is_verified: !0,
    view_count: 400,
    image_url: "/assets/img/recipes/ghanaian-waakye.webp",
    best_served_with: "Shito (black pepper sauce), spaghetti, boiled eggs, fried plantain, gari, protein of choice",
    ingredients: [ {
      sort_order: 1,
      group_name: "Main",
      amount: 2,
      unit: "cups",
      name: "rice"
    }, {
      sort_order: 2,
      group_name: "Main",
      amount: 1,
      unit: "cups",
      name: "black-eyed peas or red beans",
      prep_note: "soaked overnight"
    }, {
      sort_order: 3,
      group_name: "Main",
      amount: 3,
      unit: "pieces",
      name: "dried sorghum leaf stalks (waakye leaves)"
    }, {
      sort_order: 4,
      group_name: "Main",
      amount: 1,
      unit: "teaspoon",
      name: "baking soda"
    }, {
      sort_order: 5,
      group_name: "Main",
      amount: 1,
      unit: "teaspoon",
      name: "salt"
    }, {
      sort_order: 6,
      group_name: "Main",
      amount: 5,
      unit: "cups",
      name: "water"
    } ],
    steps: [ {
      step_number: 1,
      title: "Boil the beans",
      instruction: "Add soaked beans, waakye leaves, and baking soda to a pot with water. Boil until beans are half-cooked (about 25 minutes).",
      timer_seconds: 1500,
      timer_label: "Boil beans"
    }, {
      step_number: 2,
      title: "Add rice",
      instruction: "Add the washed rice to the pot. The water should be about 1 inch above the rice. Add salt. Cover and cook on medium heat.",
      timer_seconds: 1200,
      timer_label: "Cook rice"
    }, {
      step_number: 3,
      title: "Steam to finish",
      instruction: "Once most water is absorbed, reduce heat to lowest. Cover tightly and steam for 10 minutes. Remove waakye leaves.",
      timer_seconds: 600,
      timer_label: "Steam"
    }, {
      step_number: 4,
      title: "Serve",
      instruction: "Serve on banana leaves or a plate with your choice of accompaniments: shito, spaghetti, boiled eggs, fried fish, gari, and salad."
    } ]
  } ], p = [ {
    slug: "great-jollof-tour",
    name: "The Great Jollof Tour",
    description: "Jollof rice across West Africa — every country's version",
    is_featured: !0
  }, {
    slug: "street-food-west-africa",
    name: "Street Food of West Africa",
    description: "The best bites from Lagos to Dakar",
    is_featured: !0
  }, {
    slug: "festival-feasts",
    name: "Festival Feasts",
    description: "Dishes for celebrations, weddings, and holidays",
    is_featured: !0
  }, {
    slug: "under-30-minutes",
    name: "Under 30 Minutes",
    description: "Quick African meals for busy weeknights",
    is_featured: !0
  }, {
    slug: "budget-friendly",
    name: "Budget Friendly",
    description: "Filling, delicious meals that won't break the bank",
    is_featured: !1
  }, {
    slug: "east-african-staples",
    name: "East African Staples",
    description: "Ugali, chapati, and the dishes that define the region",
    is_featured: !1
  } ];
  function h(e) {
    var t = g;
    if (!e) {
      return t;
    }
    if (e.country && (t = t.filter(function(t) {
      return t.country_code === e.country;
    })), e.region && (t = t.filter(function(t) {
      return t.region === e.region;
    })), e.category && (t = t.filter(function(t) {
      return t.category === e.category;
    })), e.difficulty && (t = t.filter(function(t) {
      return t.difficulty === e.difficulty;
    })), e.diet && (t = t.filter(function(t) {
      return t.diet_tags && -1 !== t.diet_tags.indexOf(e.diet);
    })), e.featured && (t = t.filter(function(e) {
      return e.is_featured;
    })), e.search) {
      var r = e.search.toLowerCase();
      t = t.filter(function(e) {
        return -1 !== e.name.toLowerCase().indexOf(r) || -1 !== e.description.toLowerCase().indexOf(r) || -1 !== e.country_name.toLowerCase().indexOf(r) || e.tags && e.tags.some(function(e) {
          return -1 !== e.indexOf(r);
        });
      });
    }
    return e.slug && (t = t.filter(function(t) {
      return t.slug === e.slug;
    })), e.limit && (t = t.slice(0, e.limit)), t;
  }
  function f(e) {
    var t = g.find(function(t) {
      return t.slug === e;
    });
    return t && (t.reviews = [], t.avg_rating = null, t.review_count = 0), t || null;
  }
  return {
    COUNTRIES: i,
    REGIONS: [ "West Africa", "East Africa", "North Africa", "Southern Africa", "Central Africa" ],
    CATEGORIES: [ {
      id: "main",
      label: "Main dishes"
    }, {
      id: "stew",
      label: "Stews"
    }, {
      id: "soup",
      label: "Soups"
    }, {
      id: "sauce",
      label: "Sauces"
    }, {
      id: "side",
      label: "Sides"
    }, {
      id: "snack",
      label: "Snacks"
    }, {
      id: "breakfast",
      label: "Breakfast"
    }, {
      id: "dessert",
      label: "Desserts"
    }, {
      id: "drink",
      label: "Drinks"
    } ],
    DIETS: [ "vegetarian", "vegan", "halal", "gluten-free", "dairy-free" ],
    DIFFICULTIES: [ "easy", "medium", "hard", "expert" ],
    SEED_RECIPES: g,
    SEED_COLLECTIONS: p,
    fetchRecipes: async function(e) {
      var r = "recipes_" + JSON.stringify(e || {}), i = o(r);
      if (i) {
        return i;
      }
      var a = t();
      if (!a) {
        return h(e);
      }
      try {
        var s = a.from("recipes").select("*").eq("is_verified", !0);
        e && (e.country && (s = s.eq("country_code", e.country)), e.region && (s = s.eq("region", e.region)),
        e.category && (s = s.eq("category", e.category)), e.difficulty && (s = s.eq("difficulty", e.difficulty)),
        e.diet && (s = s.contains("diet_tags", [ e.diet ])), e.search && (s = s.or("name.ilike.%" + e.search + "%,description.ilike.%" + e.search + "%,country_name.ilike.%" + e.search + "%")),
        e.featured && (s = s.eq("is_featured", !0)), e.slug && (s = s.eq("slug", e.slug)),
        e.ids && e.ids.length && (s = s.in("id", e.ids))), s = s.order("is_featured", {
          ascending: !1
        }).order("view_count", {
          ascending: !1
        }), e && e.limit && (s = s.limit(e.limit));
        var c = await s;
        if (c.error) {
          throw c.error;
        }
        return n(r, c.data), c.data;
      } catch (t) {
        return console.warn("AfroKitchen: Supabase fetch failed, using seed data", t), h(e);
      }
    },
    fetchRecipeBySlug: async function(e) {
      var r = "recipe_" + e, i = o(r);
      if (i) {
        return i;
      }
      var a = t();
      if (!a) {
        return f(e);
      }
      try {
        var s = await a.from("recipes").select("*").eq("slug", e).eq("is_verified", !0).single();
        if (s.error) {
          throw s.error;
        }
        var c = s.data, u = a.from("recipe_ingredients").select("*").eq("recipe_id", c.id).order("sort_order"), l = a.from("recipe_steps").select("*").eq("recipe_id", c.id).order("step_number"), d = a.from("recipe_reviews").select("*").eq("recipe_id", c.id).order("created_at", {
          ascending: !1
        }).limit(20), m = await Promise.all([ u, l, d ]);
        if (c.ingredients = m[0].data || [], c.steps = m[1].data || [], c.reviews = m[2].data || [],
        c.reviews.length > 0) {
          var g = c.reviews.reduce(function(e, t) {
            return e + t.rating;
          }, 0);
          c.avg_rating = Math.round(g / c.reviews.length * 10) / 10, c.review_count = c.reviews.length;
        }
        return a.rpc("increment_recipe_views", {
          recipe_id: c.id
        }).catch(function() {}), n(r, c), c;
      } catch (t) {
        return console.warn("AfroKitchen: Fetch by slug failed, using seed", t), f(e);
      }
    },
    fetchIngredientPrices: async function(e, r) {
      var o = t();
      if (!o) {
        return [];
      }
      try {
        var n = await o.from("recipe_ingredients").select("ingredient_id").eq("recipe_id", e);
        if (!n.data || !n.data.length) {
          return [];
        }
        var i = n.data.map(function(e) {
          return e.ingredient_id;
        }).filter(Boolean);
        return i.length && (await o.from("ingredient_prices").select("*").in("ingredient_id", i).eq("country_code", r)).data || [];
      } catch (e) {
        return [];
      }
    },
    fetchCollections: async function() {
      var e = o("collections");
      if (e) {
        return e;
      }
      var r = t();
      if (!r) {
        return p;
      }
      try {
        var i = await r.from("collections").select("*").order("is_featured", {
          ascending: !1
        });
        if (i.error) {
          throw i.error;
        }
        return n("collections", i.data), i.data;
      } catch (e) {
        return p;
      }
    },
    submitReview: async function(e, r, o, n, i, a) {
      var s = t();
      if (!s) {
        return {
          error: "Database not available"
        };
      }
      try {
        var c = await s.from("recipe_reviews").insert({
          recipe_id: e,
          rating: r,
          comment: o || null,
          author_name: n || "Anonymous",
          country_code: i || null,
          modifications: a || null
        });
        if (c.error) {
          throw c.error;
        }
        return {
          success: !0
        };
      } catch (e) {
        return {
          error: e.message
        };
      }
    },
    submitRecipe: async function(e) {
      var r = t();
      if (!r) {
        return {
          error: "Database not available"
        };
      }
      try {
        var o = await r.from("recipe_submissions").insert({
          name: e.name,
          country_code: e.country_code,
          description: e.description || null,
          ingredients_text: e.ingredients_text,
          steps_text: e.steps_text,
          story: e.story || null,
          submitted_by: e.submitted_by || null,
          email: e.email || null
        });
        if (o.error) {
          throw o.error;
        }
        return {
          success: !0
        };
      } catch (e) {
        return {
          error: e.message
        };
      }
    },
    scaleIngredients: s,
    formatAmount: u,
    convertUnit: function(e, t, r) {
      var o = a[t], n = a[r];
      return o && n ? void 0 !== o.ml && void 0 !== n.ml ? e * o.ml / n.ml : void 0 !== o.g && void 0 !== n.g ? e * o.g / n.g : null : null;
    },
    scaleNutrition: function(e, t) {
      if (!e.calories) {
        return null;
      }
      var r = t / e.default_servings;
      return {
        calories: Math.round(e.calories * r),
        protein_g: Math.round((e.protein_g || 0) * r * 10) / 10,
        carbs_g: Math.round((e.carbs_g || 0) * r * 10) / 10,
        fat_g: Math.round((e.fat_g || 0) * r * 10) / 10,
        fiber_g: Math.round((e.fiber_g || 0) * r * 10) / 10,
        per_serving: {
          calories: e.calories,
          protein_g: e.protein_g,
          carbs_g: e.carbs_g,
          fat_g: e.fat_g,
          fiber_g: e.fiber_g
        }
      };
    },
    calculateRecipeCost: function(e, t, r, o, n) {
      var a = r / t, s = 0, c = "", u = [];
      e.forEach(function(e) {
        var t = function(e, t, r) {
          if (!t || !t.length) {
            return null;
          }
          for (var o = 0; o < t.length; o++) {
            if (t[o].country_code === r) {
              return t[o];
            }
          }
          return null;
        }(0, o, n);
        if (t) {
          c = t.currency_code;
          var r = e.amount * a, i = r / t.quantity * t.price;
          s += i, u.push({
            name: e.name,
            amount: r,
            unit: e.unit,
            cost: Math.round(i),
            currency: c
          });
        } else {
          u.push({
            name: e.name,
            cost: null,
            note: "Price not available"
          });
        }
      });
      var l = n && i[n] ? i[n].currency.symbol : "";
      return {
        totalCost: Math.round(s),
        currency: c,
        symbol: l,
        costPerServing: r > 0 ? Math.round(s / r) : 0,
        breakdown: u,
        note: "Prices are estimates based on current market rates. Actual cost may vary by location and season."
      };
    },
    createTimer: function(e, t, r, o) {
      var n = "timer_" + ++d;
      return l[n] = {
        id: n,
        label: t || "Timer",
        totalSeconds: e,
        remaining: e,
        running: !1,
        interval: null,
        onTick: r || function() {},
        onComplete: o || function() {}
      }, n;
    },
    startTimer: function(e) {
      var t = l[e];
      t && !t.running && (t.running = !0, t.interval = setInterval(function() {
        t.remaining--, t.onTick(t), t.remaining <= 0 && (clearInterval(t.interval), t.running = !1,
        t.remaining = 0, t.onComplete(t), function() {
          try {
            var e = new (window.AudioContext || window.webkitAudioContext);
            [ 523.25, 659.25, 783.99, 1046.5 ].forEach(function(t, r) {
              var o = e.createOscillator(), n = e.createGain();
              o.connect(n), n.connect(e.destination), o.frequency.value = t, o.type = "sine",
              n.gain.value = .15;
              var i = e.currentTime + .2 * r;
              o.start(i), n.gain.exponentialRampToValueAtTime(.001, i + .4), o.stop(i + .4);
            });
          } catch (e) {}
        }());
      }, 1e3));
    },
    pauseTimer: function(e) {
      var t = l[e];
      t && t.running && (clearInterval(t.interval), t.running = !1);
    },
    resetTimer: function(e) {
      var t = l[e];
      t && (clearInterval(t.interval), t.running = !1, t.remaining = t.totalSeconds, t.onTick(t));
    },
    getTimer: function(e) {
      return l[e] || null;
    },
    formatTime: m,
    getStructuredData: function(e, t) {
      var r = s(e.ingredients || [], e.default_servings, t || e.default_servings);
      return {
        "@context": "https://schema.org",
        "@type": "Recipe",
        name: e.name,
        description: e.description,
        image: e.image_url || "https://afrotools.com/assets/img/og-default.png",
        author: {
          "@type": "Organization",
          name: "AfroKitchen by AfroTools"
        },
        datePublished: e.created_at ? e.created_at.slice(0, 10) : "2026-03-17",
        prepTime: "PT" + e.prep_time_minutes + "M",
        cookTime: "PT" + e.cook_time_minutes + "M",
        totalTime: "PT" + (e.prep_time_minutes + e.cook_time_minutes) + "M",
        recipeYield: e.default_servings + " " + (e.serving_unit || "servings"),
        recipeCategory: "main" === e.category ? "Main Course" : e.category,
        recipeCuisine: e.country_name + ", " + e.region,
        nutrition: e.calories ? {
          "@type": "NutritionInformation",
          calories: e.calories + " calories",
          proteinContent: (e.protein_g || 0) + "g",
          carbohydrateContent: (e.carbs_g || 0) + "g",
          fatContent: (e.fat_g || 0) + "g",
          fiberContent: (e.fiber_g || 0) + "g"
        } : void 0,
        recipeIngredient: r.map(function(e) {
          return u(e.scaled_amount) + " " + e.unit + " " + e.name + (e.prep_note ? ", " + e.prep_note : "");
        }),
        recipeInstructions: (e.steps || []).map(function(e) {
          return {
            "@type": "HowToStep",
            name: e.title,
            text: e.instruction
          };
        }),
        aggregateRating: e.avg_rating ? {
          "@type": "AggregateRating",
          ratingValue: e.avg_rating,
          reviewCount: e.review_count
        } : void 0
      };
    },
    shareRecipe: function(e) {
      var t = window.location.origin + "/tools/afrokitchen/recipe.html?slug=" + e.slug, r = e.name + " - " + e.description;
      navigator.share ? navigator.share({
        title: e.name,
        text: r,
        url: t
      }).catch(function() {}) : window.open("https://wa.me/?text=" + encodeURIComponent(r + "\n" + t), "_blank");
    },
    copyRecipeLink: function(e) {
      var t = window.location.origin + "/tools/afrokitchen/recipe.html?slug=" + e.slug;
      return navigator.clipboard && navigator.clipboard.writeText(t), t;
    },
    printRecipe: function(e, t) {
      var r = s(e.ingredients || [], e.default_servings, t), o = "<html><head><title>" + e.name + " - AfroKitchen</title><style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:0 20px;color:#111}h1{font-size:1.8rem;margin-bottom:4px}h2{font-size:1.1rem;margin:24px 0 8px;border-bottom:1px solid #ccc;padding-bottom:4px}.meta{color:#666;font-size:.9rem;margin-bottom:20px}ul{padding-left:20px}li{margin-bottom:6px;font-size:.95rem}ol li{margin-bottom:12px}.tip{color:#666;font-style:italic;font-size:.85rem}@media print{body{margin:0}}</style></head><body><h1>" + e.name + '</h1><div class="meta">' + e.country_name + " | " + e.category + " | Serves " + t + " | " + e.prep_time_minutes + " min prep + " + e.cook_time_minutes + " min cook</div><h2>Ingredients</h2><ul>", n = "";
      r.forEach(function(e) {
        e.group_name && e.group_name !== n && (o += "</ul><strong>" + e.group_name + "</strong><ul>",
        n = e.group_name), o += "<li>" + u(e.scaled_amount) + " " + e.unit + " " + e.name,
        e.prep_note && (o += ", " + e.prep_note), e.is_optional && (o += " (optional)"),
        o += "</li>";
      }), o += "</ul><h2>Instructions</h2><ol>", (e.steps || []).forEach(function(e) {
        o += "<li><strong>" + e.title + "</strong><br>" + e.instruction, e.timer_seconds && (o += "<br><em>Timer: " + m(e.timer_seconds) + "</em>"),
        e.tip && (o += '<br><span class="tip">Tip: ' + e.tip + "</span>"), o += "</li>";
      }), o += "</ol>", e.story && (o += "<h2>Story</h2><p>" + e.story + "</p>"), o += '<p style="margin-top:32px;color:#999;font-size:.8rem">From AfroKitchen by AfroTools.com</p></body></html>';
      var i = window.open("", "_blank");
      i.document.write(o), i.document.close(), i.print();
    }
  };
}();

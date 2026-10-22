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
        scaled_amount: e.source_quantity_unrecorded === true ? "" : c(e.amount * o)
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
  var staticRecipePromise = null;
  function isPublicRecipe(recipe) {
    return !!recipe && recipe.is_published === true && recipe.is_verified === true;
  }
  function publicationUnavailable() {
    var rows = [];
    Object.defineProperty(rows, "publicationUnavailable", { value: true });
    return rows;
  }
  function loadPublishedRecipeIndex() {
    if (!staticRecipePromise) {
      var controller = typeof AbortController === 'function' ? new AbortController() : null, timer;
      var operation = typeof window.fetch === 'function'
        ? Promise.resolve().then(function() { return window.fetch('/tools/afrokitchen/recipe-index.json', { cache: 'no-cache', signal: controller ? controller.signal : undefined }); }).then(function(response) {
          if (!response.ok) throw new Error('Published recipe index unavailable');
          return response.json();
        }).then(function(payload) {
          if (!payload || payload.version !== 2 || !Array.isArray(payload.recipes) ||
              payload.recipes.some(function(row) { return !row || typeof row.is_published !== 'boolean' || typeof row.is_verified !== 'boolean'; })) return null;
          return payload.recipes.filter(isPublicRecipe);
        }) : Promise.resolve(null);
      staticRecipePromise = Promise.race([operation, new Promise(function(resolve) {
        timer = setTimeout(function() { if (controller) controller.abort(); resolve(null); }, 8000);
      })]).catch(function() { return null; }).then(function(rows) {
          clearTimeout(timer); if (controller) controller.abort();
          if (rows === null) staticRecipePromise = null;
          return rows;
        });
    }
    return staticRecipePromise;
  }
  function h(e, rows) {
    if (rows && rows.publicationUnavailable) return rows;
    var t = (rows || []).filter(isPublicRecipe).map(projectAttributedRecipe).filter(Boolean);
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
        return -1 !== String(e.name || '').toLowerCase().indexOf(r) || -1 !== String(e.description || '').toLowerCase().indexOf(r) || -1 !== String(e.country_name || '').toLowerCase().indexOf(r) || e.tags && e.tags.some(function(e) {
          return -1 !== String(e).toLowerCase().indexOf(r);
        });
      });
    }
    if (e.ids && e.ids.length) {
      var ids = e.ids.map(String);
      t = t.filter(function(item) { return ids.indexOf(String(item.id)) !== -1; });
    }
    return e.slug && (t = t.filter(function(t) {
      return t.slug === e.slug;
    })), e.limit && (t = t.slice(0, e.limit)), t;
  }
  // Four finite source-attributed display methods. These do not authorize publication
  // or write canonical recipe data. Shared by browser, static/index owners and API.
  var attributedMethods = {
    "mandazi-tanzania-tz": {
      "id": "7b24d43e-e00f-47fe-8943-0dbf74b81bc0",
      "revision": "mandazi-malaquias-20171122-v1",
      "fields": {
        "description": "Round coconut-cardamom yeast breads, adapted from Miriam Malaquias's Maandazi.",
        "story": "Miriam's version serves eight and advises starting about 90 minutes ahead. Let the dough double; exact preparation and frying durations are not specified. AfroTools has not kitchen-tested this adaptation.",
        "author": "AfroKitchen adaptation; source recipe by Miriam Malaquias",
        "default_servings": 8,
        "serving_unit": "servings",
        "prep_time_minutes": null,
        "cook_time_minutes": null,
        "total_time_minutes": null,
        "image_url": "/assets/img/kitchen/mandazi-tanzania-tz.webp",
        "image_alt": "AI-generated serving illustration of round golden mandazi, one opened to show its airy interior.",
        "calories": null,
        "protein_g": null,
        "carbs_g": null,
        "fat_g": null,
        "fiber_g": null,
        "source": "https://miriammalaquias.com/2017/11/22/maandazi/",
        "diet_tags": [],
        "best_served_with": null,
        "occasion": null,
        "regional_variations": null,
        "yield_status": "recorded",
        "ingredients": [
          {
            "id": "source-mandazi-tanzania-tz-ingredient-1",
            "recipe_id": "7b24d43e-e00f-47fe-8943-0dbf74b81bc0",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "dry yeast",
            "amount": 2.25,
            "unit": "tsp",
            "prep_note": "",
            "is_optional": false,
            "sort_order": 10,
            "group_name": null
          },
          {
            "id": "source-mandazi-tanzania-tz-ingredient-2",
            "recipe_id": "7b24d43e-e00f-47fe-8943-0dbf74b81bc0",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "warm water",
            "amount": 0.5,
            "unit": "cup",
            "prep_note": "",
            "is_optional": false,
            "sort_order": 20,
            "group_name": null
          },
          {
            "id": "source-mandazi-tanzania-tz-ingredient-3",
            "recipe_id": "7b24d43e-e00f-47fe-8943-0dbf74b81bc0",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "sugar",
            "amount": 1,
            "unit": "tsp",
            "prep_note": "For activating the yeast",
            "is_optional": false,
            "sort_order": 30,
            "group_name": null
          },
          {
            "id": "source-mandazi-tanzania-tz-ingredient-4",
            "recipe_id": "7b24d43e-e00f-47fe-8943-0dbf74b81bc0",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "ground cardamom",
            "amount": 1,
            "unit": "tsp",
            "prep_note": "",
            "is_optional": false,
            "sort_order": 40,
            "group_name": null
          },
          {
            "id": "source-mandazi-tanzania-tz-ingredient-5",
            "recipe_id": "7b24d43e-e00f-47fe-8943-0dbf74b81bc0",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "all-purpose flour",
            "amount": 3,
            "unit": "cups",
            "prep_note": "Extra flour only to adjust the dough/work surface",
            "is_optional": false,
            "sort_order": 50,
            "group_name": null
          },
          {
            "id": "source-mandazi-tanzania-tz-ingredient-6",
            "recipe_id": "7b24d43e-e00f-47fe-8943-0dbf74b81bc0",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "sugar",
            "amount": 2,
            "unit": "tbsp",
            "prep_note": "Source allows2–4 tablespoons",
            "is_optional": false,
            "sort_order": 60,
            "group_name": null
          },
          {
            "id": "source-mandazi-tanzania-tz-ingredient-7",
            "recipe_id": "7b24d43e-e00f-47fe-8943-0dbf74b81bc0",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "coconut milk",
            "amount": 0.75,
            "unit": "cup",
            "prep_note": "Start with½ cup; reserve the rest",
            "is_optional": false,
            "sort_order": 70,
            "group_name": null
          },
          {
            "id": "source-mandazi-tanzania-tz-ingredient-8",
            "recipe_id": "7b24d43e-e00f-47fe-8943-0dbf74b81bc0",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "oil",
            "amount": 1,
            "unit": "tbsp",
            "prep_note": "For the dough",
            "is_optional": true,
            "sort_order": 80,
            "group_name": null
          },
          {
            "id": "source-mandazi-tanzania-tz-ingredient-9",
            "recipe_id": "7b24d43e-e00f-47fe-8943-0dbf74b81bc0",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "vegetable oil",
            "amount": null,
            "unit": "as needed",
            "prep_note": "For deep frying",
            "is_optional": false,
            "sort_order": 90,
            "group_name": null,
            "source_quantity_unrecorded": true
          }
        ],
        "steps": [
          {
            "id": "source-mandazi-tanzania-tz-step-1",
            "recipe_id": "7b24d43e-e00f-47fe-8943-0dbf74b81bc0",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 1,
            "title": "Activate yeast",
            "instruction": "Dissolve the starter sugar and yeast in warm water; cover until active.",
            "timer_seconds": null,
            "timer_label": null
          },
          {
            "id": "source-mandazi-tanzania-tz-step-2",
            "recipe_id": "7b24d43e-e00f-47fe-8943-0dbf74b81bc0",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 2,
            "title": "Make dough",
            "instruction": "Stir the remaining sugar, cardamom, optional oil and half a cup of coconut milk into the activated yeast mixture. Mix in the flour; use reserved coconut milk or extra flour to adjust the dough.",
            "timer_seconds": null,
            "timer_label": null
          },
          {
            "id": "source-mandazi-tanzania-tz-step-3",
            "recipe_id": "7b24d43e-e00f-47fe-8943-0dbf74b81bc0",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 3,
            "title": "Knead and rise",
            "instruction": "Knead ten minutes. Cover in an oiled bowl until doubled.",
            "timer_seconds": 600,
            "timer_label": "Kneading only; rising has no fixed timer"
          },
          {
            "id": "source-mandazi-tanzania-tz-step-4",
            "recipe_id": "7b24d43e-e00f-47fe-8943-0dbf74b81bc0",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 4,
            "title": "Cut rounds",
            "instruction": "Knead two minutes, roll about 5 mm thick and cut rounds.",
            "timer_seconds": 120,
            "timer_label": "Second kneading only"
          },
          {
            "id": "source-mandazi-tanzania-tz-step-5",
            "recipe_id": "7b24d43e-e00f-47fe-8943-0dbf74b81bc0",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 5,
            "title": "Fry",
            "instruction": "Deep-fry until golden. Serve warm or at room temperature.",
            "timer_seconds": null,
            "timer_label": null
          }
        ],
        "media": [
          {
            "id": "source-mandazi-tanzania-tz-hero",
            "recipe_id": "7b24d43e-e00f-47fe-8943-0dbf74b81bc0",
            "role": "hero",
            "sort_order": 0,
            "image_url": "/assets/img/kitchen/mandazi-tanzania-tz.webp",
            "alt_text": "AI-generated serving illustration of round golden mandazi, one opened to show its airy interior.",
            "caption": "AI-generated serving illustration of this attributed adaptation; not a kitchen-tested photograph.",
            "source_type": "ai_generated_illustration",
            "credit_text": "AfroKitchen adaptation; source recipe by Miriam Malaquias",
            "credit_url": "https://miriammalaquias.com/2017/11/22/maandazi/",
            "created_at": null,
            "updated_at": null
          }
        ]
      }
    },
    "koba-mg": {
      "id": "3b4af630-750d-467f-939c-7befadf44d32",
      "revision": "koba-firstglobal-p13-small-parcels-v1",
      "fields": {
        "name": "Koba — small steamed parcels",
        "description": "Banana, rice-flour and peanut parcels adapted from the FIRST Global cookbook’s Kobandravina.",
        "story": "This adaptation follows the cookbook’s small leaf-wrapped parcels and ordinary steaming method. Allow about 20–25 minutes for steaming; the15-minute preparation figure comes from the source. AfroTools has not kitchen-tested this adaptation.",
        "author": "AfroKitchen adaptation; source:2020 FIRST Global Flavors of the World, page 13",
        "default_servings": 10,
        "serving_unit": "servings",
        "prep_time_minutes": 15,
        "cook_time_minutes": null,
        "total_time_minutes": null,
        "image_url": "/assets/img/kitchen/koba-mg.webp",
        "image_alt": "AI-generated serving illustration of two leaf-wrapped Koba parcels and an opened parcel showing its pale interior.",
        "calories": null,
        "protein_g": null,
        "carbs_g": null,
        "fat_g": null,
        "fiber_g": null,
        "source": "https://first.global/wp-content/uploads/2020/10/2020-FGC-Flavors-of-the-World-Cookbook_v1.2.pdf",
        "diet_tags": [],
        "best_served_with": null,
        "occasion": null,
        "regional_variations": null,
        "yield_status": "recorded",
        "ingredients": [
          {
            "id": "source-koba-mg-ingredient-1",
            "recipe_id": "3b4af630-750d-467f-939c-7befadf44d32",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "bananas",
            "amount": 3,
            "unit": "whole",
            "prep_note": "Peeled and mashed",
            "is_optional": false,
            "sort_order": 10,
            "group_name": null
          },
          {
            "id": "source-koba-mg-ingredient-2",
            "recipe_id": "3b4af630-750d-467f-939c-7befadf44d32",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "vanilla pod",
            "amount": 1,
            "unit": "pod",
            "prep_note": "Seeds only; source alternatively lists 0.33 tsp vanilla",
            "is_optional": false,
            "sort_order": 20,
            "group_name": null
          },
          {
            "id": "source-koba-mg-ingredient-3",
            "recipe_id": "3b4af630-750d-467f-939c-7befadf44d32",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "peanuts",
            "amount": 30,
            "unit": "g",
            "prep_note": "Crushed",
            "is_optional": false,
            "sort_order": 30,
            "group_name": null
          },
          {
            "id": "source-koba-mg-ingredient-4",
            "recipe_id": "3b4af630-750d-467f-939c-7befadf44d32",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "sugar",
            "amount": 30,
            "unit": "g",
            "prep_note": "",
            "is_optional": false,
            "sort_order": 40,
            "group_name": null
          },
          {
            "id": "source-koba-mg-ingredient-5",
            "recipe_id": "3b4af630-750d-467f-939c-7befadf44d32",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "rice flour",
            "amount": 150,
            "unit": "g",
            "prep_note": "",
            "is_optional": false,
            "sort_order": 50,
            "group_name": null
          },
          {
            "id": "source-koba-mg-ingredient-6",
            "recipe_id": "3b4af630-750d-467f-939c-7befadf44d32",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "banana leaves",
            "amount": null,
            "unit": "as needed",
            "prep_note": "For small parcels; the source allows parchment as an alternative",
            "is_optional": false,
            "sort_order": 60,
            "group_name": null,
            "source_quantity_unrecorded": true
          }
        ],
        "steps": [
          {
            "id": "source-koba-mg-step-1",
            "recipe_id": "3b4af630-750d-467f-939c-7befadf44d32",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 1,
            "title": "Mix batter",
            "instruction": "Mash the bananas. Mix in vanilla seeds, crushed peanuts, sugar and rice flour.",
            "timer_seconds": null,
            "timer_label": null
          },
          {
            "id": "source-koba-mg-step-2",
            "recipe_id": "3b4af630-750d-467f-939c-7befadf44d32",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 2,
            "title": "Prepare wrappers",
            "instruction": "Wash leaves, cut squares, soften briefly in hot water and drain.",
            "timer_seconds": null,
            "timer_label": null
          },
          {
            "id": "source-koba-mg-step-3",
            "recipe_id": "3b4af630-750d-467f-939c-7befadf44d32",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 3,
            "title": "Wrap parcels",
            "instruction": "Put about 3 tablespoons of batter in each wrapper; fold and secure with kitchen twine.",
            "timer_seconds": null,
            "timer_label": null
          },
          {
            "id": "source-koba-mg-step-4",
            "recipe_id": "3b4af630-750d-467f-939c-7befadf44d32",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 4,
            "title": "Steam",
            "instruction": "Steam the small parcels for about 20–25 minutes using the ordinary steamer method.",
            "timer_seconds": 1200,
            "timer_label": "Start checking; approximate 20–25-minute steaming range"
          },
          {
            "id": "source-koba-mg-step-5",
            "recipe_id": "3b4af630-750d-467f-939c-7befadf44d32",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 5,
            "title": "Unwrap",
            "instruction": "Let parcels cool enough to handle, remove wrappers and twine, and serve warm.",
            "timer_seconds": null,
            "timer_label": null
          }
        ],
        "media": [
          {
            "id": "source-koba-mg-hero",
            "recipe_id": "3b4af630-750d-467f-939c-7befadf44d32",
            "role": "hero",
            "sort_order": 0,
            "image_url": "/assets/img/kitchen/koba-mg.webp",
            "alt_text": "AI-generated serving illustration of two leaf-wrapped Koba parcels and an opened parcel showing its pale interior.",
            "caption": "AI-generated serving illustration of the attributed small-parcel adaptation; not kitchen-tested photography.",
            "source_type": "ai_generated_illustration",
            "credit_text": "AfroKitchen adaptation; source:2020 FIRST Global Flavors of the World, page 13",
            "credit_url": "https://first.global/wp-content/uploads/2020/10/2020-FGC-Flavors-of-the-World-Cookbook_v1.2.pdf",
            "created_at": null,
            "updated_at": null
          }
        ]
      }
    },
    "ibihaza-rw": {
      "id": "d7d7e305-3c5d-40db-9033-36843e102176",
      "revision": "ibihaza-georgia-reader-20261017-v1",
      "fields": {
        "name": "Ibihaza",
        "description": "Pumpkin and fully cooked beans, adapted from Georgia Reader for Together Women Rise.",
        "story": "This credited version uses fully cooked beans and chunky pumpkin. The source does not state a serving yield or overall preparation and cooking times. Preparing dried beans is a separate task. AfroTools has not kitchen-tested this adaptation.",
        "regional_variations": null,
        "best_served_with": "Serve warm.",
        "occasion": null,
        "tags": [
          "pumpkin",
          "beans",
          "rwanda"
        ],
        "diet_tags": [],
        "default_servings": null,
        "serving_unit": "servings",
        "prep_time_minutes": null,
        "cook_time_minutes": null,
        "total_time_minutes": null,
        "difficulty": null,
        "calories": null,
        "protein_g": null,
        "carbs_g": null,
        "fat_g": null,
        "fiber_g": null,
        "source": "https://togetherwomenrise.org/recipes/ibihaza/",
        "image_url": "/assets/img/kitchen/ibihaza-rw.webp",
        "author": "AfroKitchen adaptation; recipe by Georgia Reader for Together Women Rise",
        "image_alt": "AI-generated serving illustration of chunky pumpkin, cooked beans and onion in a bowl.",
        "yield_status": "not-recorded",
        "ingredients": [
          {
            "amount": 3,
            "unit": "tbsp",
            "name": "olive oil",
            "prep_note": "",
            "is_optional": false,
            "group_name": "Main",
            "id": "source-ibihaza-rw-ingredient-1",
            "recipe_id": "d7d7e305-3c5d-40db-9033-36843e102176",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "sort_order": 10
          },
          {
            "amount": 1,
            "unit": "cup",
            "name": "purple onion",
            "prep_note": "sliced",
            "is_optional": false,
            "group_name": "Main",
            "id": "source-ibihaza-rw-ingredient-2",
            "recipe_id": "d7d7e305-3c5d-40db-9033-36843e102176",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "sort_order": 20
          },
          {
            "amount": 5,
            "unit": "cups",
            "name": "pie pumpkin",
            "prep_note": "diced, seeds removed, skin retained",
            "is_optional": false,
            "group_name": "Main",
            "id": "source-ibihaza-rw-ingredient-3",
            "recipe_id": "d7d7e305-3c5d-40db-9033-36843e102176",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "sort_order": 30
          },
          {
            "amount": 3,
            "unit": "lb",
            "name": "cooked beans",
            "prep_note": "fully cooked; not dried beans",
            "is_optional": false,
            "group_name": "Main",
            "id": "source-ibihaza-rw-ingredient-4",
            "recipe_id": "d7d7e305-3c5d-40db-9033-36843e102176",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "sort_order": 40
          },
          {
            "amount": 2,
            "unit": "tsp",
            "name": "coriander",
            "prep_note": "",
            "is_optional": false,
            "group_name": "Main",
            "id": "source-ibihaza-rw-ingredient-5",
            "recipe_id": "d7d7e305-3c5d-40db-9033-36843e102176",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "sort_order": 50
          },
          {
            "amount": 2,
            "unit": "tsp",
            "name": "tarragon",
            "prep_note": "",
            "is_optional": false,
            "group_name": "Main",
            "id": "source-ibihaza-rw-ingredient-6",
            "recipe_id": "d7d7e305-3c5d-40db-9033-36843e102176",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "sort_order": 60
          },
          {
            "amount": 3,
            "unit": "cups",
            "name": "water",
            "prep_note": "Start with 3 cups; add up to 1 cup more if needed (source range: 3–4 cups).",
            "is_optional": false,
            "group_name": "Main",
            "id": "source-ibihaza-rw-ingredient-7",
            "recipe_id": "d7d7e305-3c5d-40db-9033-36843e102176",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "sort_order": 70
          },
          {
            "amount": null,
            "unit": "",
            "name": "salt",
            "prep_note": "to taste",
            "is_optional": false,
            "group_name": "Main",
            "id": "source-ibihaza-rw-ingredient-8",
            "recipe_id": "d7d7e305-3c5d-40db-9033-36843e102176",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "sort_order": 80
          },
          {
            "amount": null,
            "unit": "",
            "name": "black pepper",
            "prep_note": "to taste",
            "is_optional": false,
            "group_name": "Main",
            "id": "source-ibihaza-rw-ingredient-9",
            "recipe_id": "d7d7e305-3c5d-40db-9033-36843e102176",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "sort_order": 90
          }
        ],
        "steps": [
          {
            "step_number": 1,
            "title": "Prepare pumpkin",
            "instruction": "Wash the pumpkin, discard seeds and fibres, and dice with skin intact.",
            "timer_seconds": null,
            "timer_label": null,
            "id": "source-ibihaza-rw-step-1",
            "recipe_id": "d7d7e305-3c5d-40db-9033-36843e102176",
            "tip": null,
            "image_url": null,
            "created_at": null
          },
          {
            "step_number": 2,
            "title": "Brown vegetables",
            "instruction": "Heat oil and cook onion with pumpkin until browned; set aside.",
            "timer_seconds": null,
            "timer_label": null,
            "id": "source-ibihaza-rw-step-2",
            "recipe_id": "d7d7e305-3c5d-40db-9033-36843e102176",
            "tip": null,
            "image_url": null,
            "created_at": null
          },
          {
            "step_number": 3,
            "title": "Heat beans",
            "instruction": "Simmer the fully cooked beans, coriander and tarragon in 3 cups of water for 5–10 minutes. Add up to 1 cup more water if needed.",
            "timer_seconds": 300,
            "timer_label": "Check beans",
            "id": "source-ibihaza-rw-step-3",
            "recipe_id": "d7d7e305-3c5d-40db-9033-36843e102176",
            "tip": null,
            "image_url": null,
            "created_at": null
          },
          {
            "step_number": 4,
            "title": "Finish",
            "instruction": "Add the browned pumpkin and onion. Simmer about 15 minutes, checking that the pumpkin is cooked through but still holds its shape. Season with salt and black pepper and serve warm.",
            "timer_seconds": 900,
            "timer_label": "Check pumpkin",
            "id": "source-ibihaza-rw-step-4",
            "recipe_id": "d7d7e305-3c5d-40db-9033-36843e102176",
            "tip": null,
            "image_url": null,
            "created_at": null
          }
        ],
        "media": [
          {
            "id": "source-ibihaza-rw-hero",
            "recipe_id": "d7d7e305-3c5d-40db-9033-36843e102176",
            "role": "hero",
            "sort_order": 0,
            "image_url": "/assets/img/kitchen/ibihaza-rw.webp",
            "alt_text": "AI-generated serving illustration of chunky pumpkin, cooked beans and onion in a bowl.",
            "caption": "AI-generated serving illustration of the attributed pumpkin and cooked-bean adaptation; not a photograph of an AfroTools kitchen-tested batch.",
            "source_type": "ai_generated_illustration",
            "credit_text": "AfroKitchen adaptation; recipe by Georgia Reader for Together Women Rise",
            "credit_url": "https://togetherwomenrise.org/recipes/ibihaza/",
            "created_at": null,
            "updated_at": null
          }
        ]
      }
    },
    "kat-kat-banane-sc": {
      "id": "feabebb3-cd55-48c6-be9a-17f118dddfcc",
      "revision": "katkat-creole-melting-pot-20190910-v1",
      "fields": {
        "name": "Kat-Kat Banane",
        "description": "A savoury plantain and fish dish, adapted from The Creole Melting Pot's trevally katkat.",
        "story": "Adapted from The Creole Melting Pot's savoury trevally katkat. Four servings and 15-minute preparation/45-minute cooking are the publisher's planning estimates, not measured AfroTools results. Check fish, plantain and consistency as you cook. AfroTools has not kitchen-tested this adaptation.",
        "regional_variations": "Other households use different fish or cooking bananas.",
        "best_served_with": "Rice or chilli sauce, if desired.",
        "occasion": "Main meal",
        "tags": [
          "plantain",
          "fish",
          "coconut",
          "seychelles"
        ],
        "diet_tags": [],
        "default_servings": 4,
        "serving_unit": "servings",
        "prep_time_minutes": 15,
        "cook_time_minutes": 45,
        "total_time_minutes": 60,
        "difficulty": "medium",
        "calories": null,
        "protein_g": null,
        "carbs_g": null,
        "fat_g": null,
        "fiber_g": null,
        "source": "https://www.thecreolemeltingpot.com/trevally-katkat-with-green-plantain-katkat-karang/",
        "image_url": "/assets/img/kitchen/kat-kat-banane-sc.webp",
        "author": "AfroKitchen adaptation; recipe by The Creole Melting Pot",
        "image_alt": "AI-generated serving illustration of coarse plantain mash with flaked fish in a creamy coconut mixture.",
        "yield_status": "recorded",
        "ingredients": [
          {
            "sort_order": 10,
            "group_name": "Katkat",
            "amount": 500,
            "unit": "g",
            "name": "boneless trevally",
            "prep_note": "contains fish",
            "is_optional": false,
            "id": "source-kat-kat-banane-sc-ingredient-1",
            "recipe_id": "feabebb3-cd55-48c6-be9a-17f118dddfcc",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null
          },
          {
            "sort_order": 20,
            "group_name": "Katkat",
            "amount": 4,
            "unit": "pieces",
            "name": "unripe plantains",
            "prep_note": "",
            "is_optional": false,
            "id": "source-kat-kat-banane-sc-ingredient-2",
            "recipe_id": "feabebb3-cd55-48c6-be9a-17f118dddfcc",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null
          },
          {
            "sort_order": 30,
            "group_name": "Katkat",
            "amount": 800,
            "unit": "ml",
            "name": "coconut milk",
            "prep_note": "",
            "is_optional": false,
            "id": "source-kat-kat-banane-sc-ingredient-3",
            "recipe_id": "feabebb3-cd55-48c6-be9a-17f118dddfcc",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null
          },
          {
            "sort_order": 40,
            "group_name": "Katkat",
            "amount": 2,
            "unit": "pieces",
            "name": "cinnamon leaves",
            "prep_note": "remove before serving",
            "is_optional": false,
            "id": "source-kat-kat-banane-sc-ingredient-4",
            "recipe_id": "feabebb3-cd55-48c6-be9a-17f118dddfcc",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null
          },
          {
            "sort_order": 50,
            "group_name": "Katkat",
            "amount": null,
            "unit": "",
            "name": "salt and pepper",
            "prep_note": "to taste",
            "is_optional": false,
            "id": "source-kat-kat-banane-sc-ingredient-5",
            "recipe_id": "feabebb3-cd55-48c6-be9a-17f118dddfcc",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null
          },
          {
            "sort_order": 60,
            "group_name": "Cooking",
            "amount": null,
            "unit": "as needed",
            "name": "water",
            "prep_note": "for separate boiling pots",
            "is_optional": false,
            "id": "source-kat-kat-banane-sc-ingredient-6",
            "recipe_id": "feabebb3-cd55-48c6-be9a-17f118dddfcc",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null
          }
        ],
        "steps": [
          {
            "step_number": 1,
            "title": "Cook fish",
            "instruction": "Season fish pieces. Boil gently until cooked, about 10 minutes. Reserve the liquid; cool, check for bones and flake.",
            "timer_seconds": 600,
            "timer_label": "check fish",
            "id": "source-kat-kat-banane-sc-step-1",
            "recipe_id": "feabebb3-cd55-48c6-be9a-17f118dddfcc",
            "tip": null,
            "image_url": null,
            "created_at": null
          },
          {
            "step_number": 2,
            "title": "Cook plantains",
            "instruction": "Trim and halve the washed, unpeeled plantains. Boil separately until tender, about 15 minutes. Cool enough to handle, peel and roughly mash.",
            "timer_seconds": 900,
            "timer_label": "check plantains",
            "id": "source-kat-kat-banane-sc-step-2",
            "recipe_id": "feabebb3-cd55-48c6-be9a-17f118dddfcc",
            "tip": null,
            "image_url": null,
            "created_at": null
          },
          {
            "step_number": 3,
            "title": "Combine",
            "instruction": "Warm the mash with coconut milk. Add fish and cinnamon; simmer 10-15 minutes, stirring frequently. Loosen with reserved fish liquid if needed.",
            "timer_seconds": 600,
            "timer_label": "check consistency",
            "id": "source-kat-kat-banane-sc-step-3",
            "recipe_id": "feabebb3-cd55-48c6-be9a-17f118dddfcc",
            "tip": null,
            "image_url": null,
            "created_at": null
          },
          {
            "step_number": 4,
            "title": "Finish",
            "instruction": "Remove cinnamon, adjust seasoning and serve. Keep a thick, coarse texture with visible fish pieces.",
            "timer_seconds": null,
            "timer_label": null,
            "id": "source-kat-kat-banane-sc-step-4",
            "recipe_id": "feabebb3-cd55-48c6-be9a-17f118dddfcc",
            "tip": null,
            "image_url": null,
            "created_at": null
          }
        ],
        "media": [
          {
            "id": "source-kat-kat-banane-sc-hero",
            "recipe_id": "feabebb3-cd55-48c6-be9a-17f118dddfcc",
            "role": "hero",
            "sort_order": 0,
            "image_url": "/assets/img/kitchen/kat-kat-banane-sc.webp",
            "alt_text": "AI-generated serving illustration of coarse plantain mash with flaked fish in a creamy coconut mixture.",
            "caption": "AI-generated serving illustration of the attributed savoury plantain and trevally adaptation; not kitchen-tested photography.",
            "source_type": "ai_generated_illustration",
            "credit_text": "AfroKitchen adaptation; recipe by The Creole Melting Pot",
            "credit_url": "https://www.thecreolemeltingpot.com/trevally-katkat-with-green-plantain-katkat-karang/",
            "created_at": null,
            "updated_at": null
          }
        ]
      }
    },
    "ndizi-nyama-tz": {
      "id": "63325da8-6678-414f-b431-f88d8d6b2fe1",
      "revision": "ndizi-darlene-international-cuisine-20261017-v1",
      "fields": {
        "name": "Ndizi na Nyama — beef and green plantains",
        "description": "Beef, green plantains and vegetables in coconut-tomato gravy.",
        "story": "An adaptation of Darlene’s International Cuisine recipe, choosing its plantain option. Four servings and 10/45/55-minute estimates come from that source. AfroTools has not kitchen-tested this version.",
        "author": "AfroKitchen adaptation; source recipe by Darlene at International Cuisine",
        "default_servings": 4,
        "serving_unit": "servings",
        "prep_time_minutes": 10,
        "cook_time_minutes": 45,
        "total_time_minutes": 55,
        "image_url": "/assets/img/kitchen/ndizi-nyama-tz.webp",
        "image_alt": "AI-generated serving illustration of beef, pale plantain chunks and carrot slices in tomato-coconut gravy.",
        "calories": null,
        "protein_g": null,
        "carbs_g": null,
        "fat_g": null,
        "fiber_g": null,
        "source": "https://www.internationalcuisine.com/ndizi-nyama/",
        "tags": [
          "plantain",
          "beef",
          "tanzania"
        ],
        "diet_tags": [],
        "best_served_with": null,
        "occasion": null,
        "regional_variations": null,
        "yield_status": "recorded",
        "ingredients": [
          {
            "id": "source-ndizi-nyama-tz-ingredient-1",
            "recipe_id": "63325da8-6678-414f-b431-f88d8d6b2fe1",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "vegetable oil",
            "amount": 2,
            "unit": "tbsp",
            "prep_note": "",
            "is_optional": false,
            "sort_order": 10,
            "group_name": null
          },
          {
            "id": "source-ndizi-nyama-tz-ingredient-2",
            "recipe_id": "63325da8-6678-414f-b431-f88d8d6b2fe1",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "beef fillet",
            "amount": 1,
            "unit": "lb",
            "prep_note": "Cut into approximately 1-inch pieces",
            "is_optional": false,
            "sort_order": 20,
            "group_name": null
          },
          {
            "id": "source-ndizi-nyama-tz-ingredient-3",
            "recipe_id": "63325da8-6678-414f-b431-f88d8d6b2fe1",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "green plantains",
            "amount": 4,
            "unit": "whole",
            "prep_note": "Peeled and cut into approximately 3-inch pieces",
            "is_optional": false,
            "sort_order": 30,
            "group_name": null
          },
          {
            "id": "source-ndizi-nyama-tz-ingredient-4",
            "recipe_id": "63325da8-6678-414f-b431-f88d8d6b2fe1",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "onion",
            "amount": 1,
            "unit": "medium",
            "prep_note": "Chopped",
            "is_optional": false,
            "sort_order": 40,
            "group_name": null
          },
          {
            "id": "source-ndizi-nyama-tz-ingredient-5",
            "recipe_id": "63325da8-6678-414f-b431-f88d8d6b2fe1",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "garlic",
            "amount": 4,
            "unit": "cloves",
            "prep_note": "Minced",
            "is_optional": false,
            "sort_order": 50,
            "group_name": null
          },
          {
            "id": "source-ndizi-nyama-tz-ingredient-6",
            "recipe_id": "63325da8-6678-414f-b431-f88d8d6b2fe1",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "tomatoes",
            "amount": 2,
            "unit": "whole",
            "prep_note": "Diced",
            "is_optional": false,
            "sort_order": 60,
            "group_name": null
          },
          {
            "id": "source-ndizi-nyama-tz-ingredient-7",
            "recipe_id": "63325da8-6678-414f-b431-f88d8d6b2fe1",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "carrot",
            "amount": 1,
            "unit": "whole",
            "prep_note": "Sliced",
            "is_optional": false,
            "sort_order": 70,
            "group_name": null
          },
          {
            "id": "source-ndizi-nyama-tz-ingredient-8",
            "recipe_id": "63325da8-6678-414f-b431-f88d8d6b2fe1",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "coconut milk",
            "amount": 1,
            "unit": "cup",
            "prep_note": "",
            "is_optional": false,
            "sort_order": 80,
            "group_name": null
          },
          {
            "id": "source-ndizi-nyama-tz-ingredient-9",
            "recipe_id": "63325da8-6678-414f-b431-f88d8d6b2fe1",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "water",
            "amount": 2,
            "unit": "cups",
            "prep_note": "About 2 cups; approximate quantity from the source method",
            "is_optional": false,
            "sort_order": 90,
            "group_name": null
          },
          {
            "id": "source-ndizi-nyama-tz-ingredient-10",
            "recipe_id": "63325da8-6678-414f-b431-f88d8d6b2fe1",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "cilantro",
            "amount": 1,
            "unit": "small bunch",
            "prep_note": "Chopped for garnish",
            "is_optional": false,
            "sort_order": 100,
            "group_name": null
          },
          {
            "id": "source-ndizi-nyama-tz-ingredient-11",
            "recipe_id": "63325da8-6678-414f-b431-f88d8d6b2fe1",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "salt and pepper",
            "amount": null,
            "unit": "to taste",
            "prep_note": "Unmeasured seasoning",
            "is_optional": false,
            "sort_order": 110,
            "group_name": null,
            "source_quantity_unrecorded": true
          }
        ],
        "steps": [
          {
            "id": "source-ndizi-nyama-tz-step-1",
            "recipe_id": "63325da8-6678-414f-b431-f88d8d6b2fe1",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 1,
            "title": "Brown aromatics and beef",
            "instruction": "Heat oil over medium heat. Fry onion and garlic until golden, then brown the beef.",
            "timer_seconds": null,
            "timer_label": null
          },
          {
            "id": "source-ndizi-nyama-tz-step-2",
            "recipe_id": "63325da8-6678-414f-b431-f88d8d6b2fe1",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 2,
            "title": "Add vegetables and water",
            "instruction": "Add carrot, tomatoes, about two cups of water and seasoning. Cover and bring to a boil.",
            "timer_seconds": null,
            "timer_label": null
          },
          {
            "id": "source-ndizi-nyama-tz-step-3",
            "recipe_id": "63325da8-6678-414f-b431-f88d8d6b2fe1",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 3,
            "title": "Cook plantains",
            "instruction": "Add plantains; boil about ten minutes before checking their texture.",
            "timer_seconds": 600,
            "timer_label": "Check plantain texture; continue cooking as needed"
          },
          {
            "id": "source-ndizi-nyama-tz-step-4",
            "recipe_id": "63325da8-6678-414f-b431-f88d8d6b2fe1",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 4,
            "title": "Finish with coconut milk",
            "instruction": "Stir in coconut milk; simmer about five minutes, then check that beef and plantains are tender. Continue cooking if needed; garnish with cilantro.",
            "timer_seconds": 300,
            "timer_label": "Check beef and plantain tenderness; continue as needed"
          }
        ],
        "media": [
          {
            "id": "source-ndizi-nyama-tz-hero",
            "recipe_id": "63325da8-6678-414f-b431-f88d8d6b2fe1",
            "role": "hero",
            "sort_order": 0,
            "image_url": "/assets/img/kitchen/ndizi-nyama-tz.webp",
            "alt_text": "AI-generated serving illustration of beef, pale plantain chunks and carrot slices in tomato-coconut gravy.",
            "caption": "AI-generated serving illustration of this attributed adaptation; not a kitchen-tested photograph.",
            "source_type": "ai_generated_illustration",
            "credit_text": "AfroKitchen adaptation; source recipe by Darlene at International Cuisine",
            "credit_url": "https://www.internationalcuisine.com/ndizi-nyama/",
            "created_at": null,
            "updated_at": null
          }
        ]
      }
    },
    "latchiri-kossan-gn": {
      "id": "91740809-c813-417e-8af4-c5c7c989c1be",
      "revision": "latchiri-gassama-maize-cultured-milk-20261017-v1",
      "fields": {
        "name": "Latchiri Kossan — maize with cultured milk",
        "description": "Steamed maize couscous served with ready-made cultured milk; contains dairy.",
        "story": "Adapted from the public Latchiri Kössan document attributed to Youssouf Gassama: 1 kg maize for 12 people. This version uses ready-made cultured milk; it excludes the document’s homemade dairy process. Overall preparation and cooking times are unrecorded. AfroTools has not kitchen-tested it.",
        "author": "AfroKitchen adaptation; document attributed to Youssouf Gassama",
        "default_servings": 12,
        "serving_unit": "servings",
        "prep_time_minutes": null,
        "cook_time_minutes": null,
        "total_time_minutes": null,
        "image_url": "/assets/img/kitchen/latchiri-kossan-gn.webp",
        "image_alt": "AI-generated serving illustration of loose pale maize couscous with white cultured milk in a shallow bowl.",
        "calories": null,
        "protein_g": null,
        "carbs_g": null,
        "fat_g": null,
        "fiber_g": null,
        "source": "https://www.fichier-pdf.fr/2015/07/09/latchiri-ko-ssan/",
        "tags": [
          "maize",
          "cultured-milk",
          "guinea"
        ],
        "diet_tags": [],
        "best_served_with": null,
        "occasion": null,
        "regional_variations": null,
        "yield_status": "recorded",
        "ingredients": [
          {
            "id": "source-latchiri-kossan-gn-ingredient-1",
            "recipe_id": "91740809-c813-417e-8af4-c5c7c989c1be",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "maize flour",
            "amount": 1,
            "unit": "kg",
            "prep_note": "Not corn starch; for steaming",
            "is_optional": false,
            "sort_order": 10,
            "group_name": null
          },
          {
            "id": "source-latchiri-kossan-gn-ingredient-2",
            "recipe_id": "91740809-c813-417e-8af4-c5c7c989c1be",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "water",
            "amount": null,
            "unit": "as needed",
            "prep_note": "For the steamer and moistening",
            "is_optional": false,
            "sort_order": 20,
            "group_name": null,
            "source_quantity_unrecorded": true
          },
          {
            "id": "source-latchiri-kossan-gn-ingredient-3",
            "recipe_id": "91740809-c813-417e-8af4-c5c7c989c1be",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "ready-made cultured milk",
            "amount": null,
            "unit": "as needed",
            "prep_note": "For serving; contains dairy",
            "is_optional": false,
            "sort_order": 30,
            "group_name": null,
            "source_quantity_unrecorded": true
          },
          {
            "id": "source-latchiri-kossan-gn-ingredient-4",
            "recipe_id": "91740809-c813-417e-8af4-c5c7c989c1be",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "salt",
            "amount": null,
            "unit": "to taste",
            "prep_note": "Optional savoury seasoning",
            "is_optional": true,
            "sort_order": 40,
            "group_name": null,
            "source_quantity_unrecorded": true
          },
          {
            "id": "source-latchiri-kossan-gn-ingredient-5",
            "recipe_id": "91740809-c813-417e-8af4-c5c7c989c1be",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "sugar",
            "amount": null,
            "unit": "to taste",
            "prep_note": "Optional sweet serving",
            "is_optional": true,
            "sort_order": 50,
            "group_name": null,
            "source_quantity_unrecorded": true
          }
        ],
        "steps": [
          {
            "id": "source-latchiri-kossan-gn-step-1",
            "recipe_id": "91740809-c813-417e-8af4-c5c7c989c1be",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 1,
            "title": "Prepare the steamer",
            "instruction": "Boil water below the upper basket. Line the basket with a clean, light steaming cloth and add maize flour above the water.",
            "timer_seconds": null,
            "timer_label": null
          },
          {
            "id": "source-latchiri-kossan-gn-step-2",
            "recipe_id": "91740809-c813-417e-8af4-c5c7c989c1be",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 2,
            "title": "First steaming",
            "instruction": "Cover and steam about thirty minutes. Carefully lift the cloth into a bowl; replenish and reboil the steamer water.",
            "timer_seconds": 1800,
            "timer_label": "Check after the first steam; maize needs another steaming"
          },
          {
            "id": "source-latchiri-kossan-gn-step-3",
            "recipe_id": "91740809-c813-417e-8af4-c5c7c989c1be",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 3,
            "title": "Moisten and loosen",
            "instruction": "Separate with a spoon, moisten lightly and rest ten minutes. Once safe to handle, loosen the granules.",
            "timer_seconds": 600,
            "timer_label": "Check and loosen the rested granules before steaming again"
          },
          {
            "id": "source-latchiri-kossan-gn-step-4",
            "recipe_id": "91740809-c813-417e-8af4-c5c7c989c1be",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 4,
            "title": "Second steaming",
            "instruction": "Steam again about thirty minutes, then repeat the moistening, ten-minute rest and loosening. Check softness; if firm, steam for a further 15 minutes, checking water below.",
            "timer_seconds": 1800,
            "timer_label": "Check maize softness; further steaming may be needed"
          },
          {
            "id": "source-latchiri-kossan-gn-step-5",
            "recipe_id": "91740809-c813-417e-8af4-c5c7c989c1be",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 5,
            "title": "Serve with cultured milk",
            "instruction": "Fluff the maize and serve with ready-made cultured milk. Offer sugar or salt to taste.",
            "timer_seconds": null,
            "timer_label": null
          }
        ],
        "media": [
          {
            "id": "source-latchiri-kossan-gn-hero",
            "recipe_id": "91740809-c813-417e-8af4-c5c7c989c1be",
            "role": "hero",
            "sort_order": 0,
            "image_url": "/assets/img/kitchen/latchiri-kossan-gn.webp",
            "alt_text": "AI-generated serving illustration of loose pale maize couscous with white cultured milk in a shallow bowl.",
            "caption": "AI-generated serving illustration of this attributed adaptation; not a kitchen-tested photograph.",
            "source_type": "ai_generated_illustration",
            "credit_text": "AfroKitchen adaptation; document attributed to Youssouf Gassama",
            "credit_url": "https://www.fichier-pdf.fr/2015/07/09/latchiri-ko-ssan/",
            "created_at": null,
            "updated_at": null
          }
        ]
      }
    },
    "kisra-south-sudan-ss": {
      "id": "c0aced74-68d6-437d-b00b-abd1895605f0",
      "revision": "kisra-sudanese-kitchen-20261022-v1",
      "fields": {
        "name": "Kisra – Sudanese Kitchen adaptation",
        "description": "Thin fermented sorghum sheets, adapted from the regional Sudanese Kitchen recipe.",
        "story": "Contains milk from yoghurt. Use fresh, in-date plain yoghurt and clean utensils. A regional adaptation from Sudanese Kitchen, served with stew.",
        "author": "AfroKitchen adaptation of Sudanese Kitchen",
        "source": "https://www.sudanese.kitchen/recipe/kisra",
        "default_servings": null,
        "serving_unit": null,
        "yield_status": "not-recorded",
        "prep_time_minutes": null,
        "cook_time_minutes": null,
        "total_time_minutes": null,
        "image_url": "/assets/img/kitchen/responsive/kisra-south-sudan-ss-1280.webp",
        "image_alt": "AI-generated illustration of thin Kisra sorghum flatbread sheets.",
        "calories": null,
        "protein_g": null,
        "carbs_g": null,
        "fat_g": null,
        "fiber_g": null,
        "nutrition_basis": null,
        "tags": [
          "sorghum",
          "flatbread",
          "fermented"
        ],
        "diet_tags": [],
        "chef_notes": null,
        "best_served_with": "Stew",
        "occasion": null,
        "regional_variations": "Regional recipe adapted from Sudanese Kitchen.",
        "method_review_status": "attributed-source-method",
        "method_review_revision": null,
        "ingredients": [
          {
            "id": "source-kisra-south-sudan-ss-ingredient-1",
            "recipe_id": "c0aced74-68d6-437d-b00b-abd1895605f0",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "is_optional": false,
            "group_name": null,
            "name": "sorghum flour",
            "amount": 250,
            "unit": "g",
            "prep_note": null,
            "sort_order": 10
          },
          {
            "id": "source-kisra-south-sudan-ss-ingredient-2",
            "recipe_id": "c0aced74-68d6-437d-b00b-abd1895605f0",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "is_optional": false,
            "group_name": null,
            "name": "water",
            "amount": 500,
            "unit": "ml",
            "prep_note": "500–750 ml in total; add gradually to make a thin batter",
            "sort_order": 20
          },
          {
            "id": "source-kisra-south-sudan-ss-ingredient-3",
            "recipe_id": "c0aced74-68d6-437d-b00b-abd1895605f0",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "is_optional": false,
            "group_name": null,
            "name": "plain yoghurt",
            "amount": 3,
            "unit": "tbsp",
            "prep_note": "3–4 tbsp; use fresh, in-date yoghurt; contains milk",
            "sort_order": 30
          },
          {
            "id": "source-kisra-south-sudan-ss-ingredient-4",
            "recipe_id": "c0aced74-68d6-437d-b00b-abd1895605f0",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "is_optional": false,
            "group_name": null,
            "name": "oil",
            "amount": null,
            "unit": "",
            "prep_note": "For lightly greasing the saaj",
            "sort_order": 40
          }
        ],
        "steps": [
          {
            "id": "source-kisra-south-sudan-ss-step-1",
            "recipe_id": "c0aced74-68d6-437d-b00b-abd1895605f0",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 1,
            "title": "Mix the batter",
            "instruction": "Whisk 250 g sorghum flour with 500 ml water. Add more water gradually, up to 750 ml total, for a thin pouring batter. Stir in 3–4 tbsp plain yoghurt.",
            "timer_seconds": null,
            "timer_label": null
          },
          {
            "id": "source-kisra-south-sudan-ss-step-2",
            "recipe_id": "c0aced74-68d6-437d-b00b-abd1895605f0",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 2,
            "title": "Ferment overnight",
            "instruction": "Cover the bowl and leave overnight in a cool, dry place. Do not taste raw batter or keep batter as starter for another batch.",
            "timer_seconds": null,
            "timer_label": null
          },
          {
            "id": "source-kisra-south-sudan-ss-step-3",
            "recipe_id": "c0aced74-68d6-437d-b00b-abd1895605f0",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 3,
            "title": "Heat the saaj",
            "instruction": "Heat a saaj or flat griddle and wipe with a little oil.",
            "timer_seconds": null,
            "timer_label": null
          },
          {
            "id": "source-kisra-south-sudan-ss-step-4",
            "recipe_id": "c0aced74-68d6-437d-b00b-abd1895605f0",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 4,
            "title": "Spread a thin sheet",
            "instruction": "Pour about half a cup of batter onto the hot surface. Quickly spread it very thin with a crepe spreader.",
            "timer_seconds": null,
            "timer_label": null
          },
          {
            "id": "source-kisra-south-sudan-ss-step-5",
            "recipe_id": "c0aced74-68d6-437d-b00b-abd1895605f0",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 5,
            "title": "Cook and stack",
            "instruction": "Cook on one side for about 1–2 minutes, until the sheet is set and lifts off. Remove, stack and repeat with the remaining batter. Serve with stew.",
            "timer_seconds": 60,
            "timer_label": "Check sheet; allow about 1–2 minutes per sheet"
          }
        ],
        "media": [
          {
            "id": "source-kisra-south-sudan-ss-hero",
            "recipe_id": "c0aced74-68d6-437d-b00b-abd1895605f0",
            "role": "hero",
            "sort_order": 0,
            "image_url": "/assets/img/kitchen/responsive/kisra-south-sudan-ss-1280.webp",
            "alt_text": "AI-generated illustration of thin Kisra sorghum flatbread sheets.",
            "caption": "AI-generated serving illustration; not a photograph of a kitchen-tested batch.",
            "source_type": "ai_generated_illustration",
            "credit_text": "AfroKitchen adaptation of Sudanese Kitchen",
            "credit_url": "https://www.sudanese.kitchen/recipe/kisra",
            "created_at": null,
            "updated_at": null
          }
        ]
      }
    },
    "mchemsho-tz": {
      "id": "4caf4ed6-13ec-4fbb-8039-ce51a4201cfe",
      "revision": "mchemsho-tatedo-indexed-beef-batch-20261018-v1",
      "fields": {
        "name": "Mchemsho — TaTEDO beef version",
        "description": "Beef, potatoes and vegetables in broth, made in two pressure-cooking stages.",
        "story": "Use a pressure cooker large enough for this batch and follow its fill, liquid and pressure-release instructions. Allow extra time for heat-up and pressure release.",
        "author": "AfroKitchen adaptation of TaTEDO Tanzania eCookbook (2020)",
        "default_servings": null,
        "serving_unit": null,
        "yield_status": "not-recorded",
        "prep_time_minutes": null,
        "cook_time_minutes": null,
        "total_time_minutes": null,
        "image_url": "/assets/img/kitchen/mchemsho-tz.webp",
        "image_alt": "AI-generated illustration of beef Mchemsho with potatoes, carrots, bell pepper, onion and broccoli in light broth.",
        "calories": null,
        "protein_g": null,
        "carbs_g": null,
        "fat_g": null,
        "fiber_g": null,
        "nutrition_basis": null,
        "source": "https://mecs.org.uk/wp-content/uploads/2020/12/Tanzania-Ecook-Book-text-web.pdf",
        "tags": [
          "beef",
          "potato",
          "vegetables",
          "tanzania"
        ],
        "diet_tags": [],
        "chef_notes": null,
        "best_served_with": null,
        "occasion": null,
        "regional_variations": null,
        "ingredients": [
          {
            "id": "source-mchemsho-tz-ingredient-1",
            "recipe_id": "4caf4ed6-13ec-4fbb-8039-ce51a4201cfe",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "beef",
            "amount": 1,
            "unit": "kg",
            "prep_note": "Selected instead of the source chicken option; cut into pieces",
            "is_optional": false,
            "sort_order": 10,
            "group_name": null
          },
          {
            "id": "source-mchemsho-tz-ingredient-2",
            "recipe_id": "4caf4ed6-13ec-4fbb-8039-ce51a4201cfe",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "carrot",
            "amount": 1,
            "unit": "whole",
            "prep_note": "Prepare and cut",
            "is_optional": false,
            "sort_order": 20,
            "group_name": null
          },
          {
            "id": "source-mchemsho-tz-ingredient-3",
            "recipe_id": "4caf4ed6-13ec-4fbb-8039-ce51a4201cfe",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "bell pepper",
            "amount": 1,
            "unit": "whole",
            "prep_note": "Prepare and cut",
            "is_optional": false,
            "sort_order": 30,
            "group_name": null
          },
          {
            "id": "source-mchemsho-tz-ingredient-4",
            "recipe_id": "4caf4ed6-13ec-4fbb-8039-ce51a4201cfe",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "onion",
            "amount": 1,
            "unit": "large",
            "prep_note": "Prepare and cut",
            "is_optional": false,
            "sort_order": 40,
            "group_name": null
          },
          {
            "id": "source-mchemsho-tz-ingredient-5",
            "recipe_id": "4caf4ed6-13ec-4fbb-8039-ce51a4201cfe",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "potatoes",
            "amount": 5,
            "unit": "whole",
            "prep_note": "Prepare and cut",
            "is_optional": false,
            "sort_order": 50,
            "group_name": null
          },
          {
            "id": "source-mchemsho-tz-ingredient-6",
            "recipe_id": "4caf4ed6-13ec-4fbb-8039-ce51a4201cfe",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "broccoli",
            "amount": 2,
            "unit": "heads",
            "prep_note": "Prepare and cut",
            "is_optional": false,
            "sort_order": 60,
            "group_name": null
          },
          {
            "id": "source-mchemsho-tz-ingredient-7",
            "recipe_id": "4caf4ed6-13ec-4fbb-8039-ce51a4201cfe",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "water",
            "amount": 8,
            "unit": "cups",
            "prep_note": "Source batch amount; use a suitably sized appliance within its fill limits",
            "is_optional": false,
            "sort_order": 70,
            "group_name": null
          },
          {
            "id": "source-mchemsho-tz-ingredient-8",
            "recipe_id": "4caf4ed6-13ec-4fbb-8039-ce51a4201cfe",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "salt",
            "amount": null,
            "unit": "to taste",
            "prep_note": "Source quantity not stated",
            "is_optional": false,
            "sort_order": 80,
            "group_name": null,
            "source_quantity_unrecorded": true
          }
        ],
        "steps": [
          {
            "id": "source-mchemsho-tz-step-1",
            "recipe_id": "4caf4ed6-13ec-4fbb-8039-ce51a4201cfe",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 1,
            "title": "Prepare the beef",
            "instruction": "Cut the beef into pieces. Put it in the pressure cooker with 8 cups water.",
            "timer_seconds": null,
            "timer_label": null
          },
          {
            "id": "source-mchemsho-tz-step-2",
            "recipe_id": "4caf4ed6-13ec-4fbb-8039-ce51a4201cfe",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 2,
            "title": "Pressure-cook the beef",
            "instruction": "Bring to pressure following your appliance instructions, then pressure-cook for 20 minutes. Meanwhile, chop the carrot, bell pepper, onion and potatoes, and cut the broccoli into florets.",
            "timer_seconds": 1200,
            "timer_label": "First pressure stage"
          },
          {
            "id": "source-mchemsho-tz-step-3",
            "recipe_id": "4caf4ed6-13ec-4fbb-8039-ce51a4201cfe",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 3,
            "title": "Add the vegetables",
            "instruction": "Release pressure as your appliance directs. Open only when safe, then add the vegetables and salt. Check the liquid against your cooker requirements.",
            "timer_seconds": null,
            "timer_label": null
          },
          {
            "id": "source-mchemsho-tz-step-4",
            "recipe_id": "4caf4ed6-13ec-4fbb-8039-ce51a4201cfe",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 4,
            "title": "Pressure-cook the vegetables",
            "instruction": "Return to pressure, then cook for 7 minutes. Release pressure as directed before opening.",
            "timer_seconds": 420,
            "timer_label": "Second pressure stage"
          },
          {
            "id": "source-mchemsho-tz-step-5",
            "recipe_id": "4caf4ed6-13ec-4fbb-8039-ce51a4201cfe",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 5,
            "title": "Check and serve",
            "instruction": "Check that the beef is tender and the vegetables are cooked; cook a little longer if needed. Adjust salt and serve hot with the broth.",
            "timer_seconds": null,
            "timer_label": null
          }
        ],
        "media": [
          {
            "id": "source-mchemsho-tz-hero",
            "recipe_id": "4caf4ed6-13ec-4fbb-8039-ce51a4201cfe",
            "role": "hero",
            "sort_order": 0,
            "image_url": "/assets/img/kitchen/mchemsho-tz.webp",
            "alt_text": "AI-generated illustration of beef Mchemsho with potatoes, carrots, bell pepper, onion and broccoli in light broth.",
            "caption": "AI-generated serving illustration of this attributed adaptation; not a kitchen-tested photograph.",
            "source_type": "ai_generated_illustration",
            "credit_text": "AfroKitchen adaptation of TaTEDO Tanzania eCookbook (2020)",
            "credit_url": "https://mecs.org.uk/wp-content/uploads/2020/12/Tanzania-Ecook-Book-text-web.pdf",
            "created_at": null,
            "updated_at": null
          }
        ]
      }
    },
    "octopus-curry-sc": {
      "id": "8c0311ea-c7e3-4286-b535-33a75451becd",
      "revision": "octopus-ben-pierce-jones-water-20261018-v1",
      "fields": {
        "name": "Octopus curry — Ben Pierce Jones adaptation",
        "description": "An attributed Seychelles-style octopus and coconut curry, using water and omitting the source’s cilantro garnish.",
        "story": "Adapted from Ben Pierce Jones at Tastes From The Road. The source publishes estimates of 20 minutes preparation, 90 minutes cooking and four servings; it does not separately state total time. Its ingredient list describes boiled octopus while its method includes a preboil. This adaptation starts with cleaned raw octopus and includes that preboil, so do not count it twice if starting with already cooked octopus. Water is selected instead of fish stock; two optional curry leaves and one chilli select within the source ranges. The cilantro garnish is omitted. The image is an AI serving illustration, not evidence of a tested batch; AfroTools has not kitchen-tested this adaptation.",
        "author": "AfroKitchen adaptation of Ben Pierce Jones at Tastes From The Road",
        "default_servings": 4,
        "serving_unit": "servings",
        "yield_status": "recorded",
        "prep_time_minutes": 20,
        "cook_time_minutes": 90,
        "total_time_minutes": null,
        "image_url": "/assets/img/kitchen/responsive/octopus-curry-sc-1280.webp",
        "image_alt": "AI-generated serving illustration of octopus pieces in coconut curry sauce.",
        "calories": null,
        "protein_g": null,
        "carbs_g": null,
        "fat_g": null,
        "fiber_g": null,
        "nutrition_basis": null,
        "source": "https://www.tastesfromtheroad.com/recipes/octopus-curry-from-the-seychelles",
        "tags": [
          "octopus",
          "coconut",
          "seychelles"
        ],
        "diet_tags": [],
        "chef_notes": null,
        "best_served_with": null,
        "occasion": null,
        "regional_variations": null,
        "ingredients": [
          {
            "id": "source-octopus-curry-sc-ingredient-1",
            "recipe_id": "8c0311ea-c7e3-4286-b535-33a75451becd",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "cleaned raw octopus",
            "amount": 1,
            "unit": "large",
            "prep_note": "About 2–3 lb. Raw starting point chosen because the source method includes preboiling, despite its boiled-octopus ingredient wording",
            "is_optional": false,
            "sort_order": 10,
            "group_name": null
          },
          {
            "id": "source-octopus-curry-sc-ingredient-2",
            "recipe_id": "8c0311ea-c7e3-4286-b535-33a75451becd",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "cooking oil",
            "amount": 2,
            "unit": "tablespoons",
            "prep_note": null,
            "is_optional": false,
            "sort_order": 20,
            "group_name": null
          },
          {
            "id": "source-octopus-curry-sc-ingredient-3",
            "recipe_id": "8c0311ea-c7e3-4286-b535-33a75451becd",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "cinnamon sticks",
            "amount": 2,
            "unit": "sticks",
            "prep_note": null,
            "is_optional": false,
            "sort_order": 30,
            "group_name": null
          },
          {
            "id": "source-octopus-curry-sc-ingredient-4",
            "recipe_id": "8c0311ea-c7e3-4286-b535-33a75451becd",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "onion",
            "amount": 1,
            "unit": "whole",
            "prep_note": "Chopped",
            "is_optional": false,
            "sort_order": 40,
            "group_name": null
          },
          {
            "id": "source-octopus-curry-sc-ingredient-5",
            "recipe_id": "8c0311ea-c7e3-4286-b535-33a75451becd",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "garlic",
            "amount": 3,
            "unit": "cloves",
            "prep_note": "Minced",
            "is_optional": false,
            "sort_order": 50,
            "group_name": null
          },
          {
            "id": "source-octopus-curry-sc-ingredient-6",
            "recipe_id": "8c0311ea-c7e3-4286-b535-33a75451becd",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "ginger",
            "amount": 1,
            "unit": "inch",
            "prep_note": "Grated",
            "is_optional": false,
            "sort_order": 60,
            "group_name": null
          },
          {
            "id": "source-octopus-curry-sc-ingredient-7",
            "recipe_id": "8c0311ea-c7e3-4286-b535-33a75451becd",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "curry leaves",
            "amount": 2,
            "unit": "leaves",
            "prep_note": "Optional; two selected from the source range of 2–3",
            "is_optional": true,
            "sort_order": 70,
            "group_name": null
          },
          {
            "id": "source-octopus-curry-sc-ingredient-8",
            "recipe_id": "8c0311ea-c7e3-4286-b535-33a75451becd",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "curry powder",
            "amount": 2,
            "unit": "tablespoons",
            "prep_note": null,
            "is_optional": false,
            "sort_order": 80,
            "group_name": null
          },
          {
            "id": "source-octopus-curry-sc-ingredient-9",
            "recipe_id": "8c0311ea-c7e3-4286-b535-33a75451becd",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "turmeric",
            "amount": 1,
            "unit": "teaspoon",
            "prep_note": null,
            "is_optional": false,
            "sort_order": 90,
            "group_name": null
          },
          {
            "id": "source-octopus-curry-sc-ingredient-10",
            "recipe_id": "8c0311ea-c7e3-4286-b535-33a75451becd",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "paprika",
            "amount": 1,
            "unit": "teaspoon",
            "prep_note": "Optional source ingredient",
            "is_optional": true,
            "sort_order": 100,
            "group_name": null
          },
          {
            "id": "source-octopus-curry-sc-ingredient-11",
            "recipe_id": "8c0311ea-c7e3-4286-b535-33a75451becd",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "chilli",
            "amount": 1,
            "unit": "whole",
            "prep_note": "One selected from the source range of 1–2",
            "is_optional": false,
            "sort_order": 110,
            "group_name": null
          },
          {
            "id": "source-octopus-curry-sc-ingredient-12",
            "recipe_id": "8c0311ea-c7e3-4286-b535-33a75451becd",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "coconut milk",
            "amount": 1,
            "unit": "can",
            "prep_note": "13.5 oz source can",
            "is_optional": false,
            "sort_order": 120,
            "group_name": null
          },
          {
            "id": "source-octopus-curry-sc-ingredient-13",
            "recipe_id": "8c0311ea-c7e3-4286-b535-33a75451becd",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "water",
            "amount": 0.5,
            "unit": "cup",
            "prep_note": "Water selected instead of fish stock",
            "is_optional": false,
            "sort_order": 130,
            "group_name": null
          },
          {
            "id": "source-octopus-curry-sc-ingredient-14",
            "recipe_id": "8c0311ea-c7e3-4286-b535-33a75451becd",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "salt",
            "amount": null,
            "unit": "to taste",
            "prep_note": "Source quantity not stated",
            "is_optional": false,
            "sort_order": 140,
            "group_name": null,
            "source_quantity_unrecorded": true
          },
          {
            "id": "source-octopus-curry-sc-ingredient-15",
            "recipe_id": "8c0311ea-c7e3-4286-b535-33a75451becd",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "black pepper",
            "amount": null,
            "unit": "to taste",
            "prep_note": "Source quantity not stated",
            "is_optional": false,
            "sort_order": 150,
            "group_name": null,
            "source_quantity_unrecorded": true
          },
          {
            "id": "source-octopus-curry-sc-ingredient-16",
            "recipe_id": "8c0311ea-c7e3-4286-b535-33a75451becd",
            "ingredient_id": null,
            "substitution": null,
            "created_at": null,
            "name": "lime",
            "amount": 1,
            "unit": "whole",
            "prep_note": null,
            "is_optional": false,
            "sort_order": 160,
            "group_name": null
          }
        ],
        "steps": [
          {
            "id": "source-octopus-curry-sc-step-1",
            "recipe_id": "8c0311ea-c7e3-4286-b535-33a75451becd",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 1,
            "title": "Preboil the raw octopus",
            "instruction": "Start with cleaned raw octopus for this adaptation. Boil until tender; the source gives an approximate 30–40 minutes. Check tenderness from about 30 minutes and continue as needed, then cut into bite-size pieces. If using already boiled octopus, do not automatically repeat the raw preboil.",
            "timer_seconds": 1800,
            "timer_label": "Check octopus tenderness; continue as needed"
          },
          {
            "id": "source-octopus-curry-sc-step-2",
            "recipe_id": "8c0311ea-c7e3-4286-b535-33a75451becd",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 2,
            "title": "Cook the aromatics",
            "instruction": "Heat the oil with the cinnamon sticks. Add onion, garlic, ginger and the optional curry leaves; cook until fragrant.",
            "timer_seconds": null,
            "timer_label": null
          },
          {
            "id": "source-octopus-curry-sc-step-3",
            "recipe_id": "8c0311ea-c7e3-4286-b535-33a75451becd",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 3,
            "title": "Add spices",
            "instruction": "Stir in curry powder, turmeric, optional paprika and chilli, coating the aromatics.",
            "timer_seconds": null,
            "timer_label": null
          },
          {
            "id": "source-octopus-curry-sc-step-4",
            "recipe_id": "8c0311ea-c7e3-4286-b535-33a75451becd",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 4,
            "title": "Simmer with coconut milk",
            "instruction": "Add the octopus, coconut milk and the selected half cup of water. Simmer approximately 20–25 minutes as described by the source, checking the texture and continuing as needed.",
            "timer_seconds": 1200,
            "timer_label": "Check the curry; continue as needed"
          },
          {
            "id": "source-octopus-curry-sc-step-5",
            "recipe_id": "8c0311ea-c7e3-4286-b535-33a75451becd",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 5,
            "title": "Finish seasoning",
            "instruction": "Season with salt, black pepper and lime. The source calls for a further approximately 5-minute simmer after seasoning. This adaptation omits the cilantro garnish.",
            "timer_seconds": 300,
            "timer_label": "Check final seasoning and texture"
          },
          {
            "id": "source-octopus-curry-sc-step-6",
            "recipe_id": "8c0311ea-c7e3-4286-b535-33a75451becd",
            "tip": null,
            "image_url": null,
            "created_at": null,
            "step_number": 6,
            "title": "Serve the attributed adaptation",
            "instruction": "Serve the curry. Four servings and the 20-minute preparation/90-minute cooking figures are the author’s estimates, not guaranteed completion or a separately established total duration.",
            "timer_seconds": null,
            "timer_label": null
          }
        ],
        "media": [
          {
            "id": "source-octopus-curry-sc-hero",
            "recipe_id": "8c0311ea-c7e3-4286-b535-33a75451becd",
            "role": "hero",
            "sort_order": 0,
            "image_url": "/assets/img/kitchen/responsive/octopus-curry-sc-1280.webp",
            "alt_text": "AI-generated serving illustration of octopus pieces in coconut curry sauce.",
            "caption": "AI-generated serving illustration of this attributed adaptation; not a kitchen-tested photograph.",
            "source_type": "ai_generated_illustration",
            "credit_text": "AfroKitchen adaptation of Ben Pierce Jones at Tastes From The Road",
            "credit_url": "https://www.tastesfromtheroad.com/recipes/octopus-curry-from-the-seychelles",
            "created_at": null,
            "updated_at": null
          }
        ]
      }
    }
  };
  // Exact finite source-method holds; publication approval remains independent.
  var pendingBeverageMethods = {
    "kunu-zaki-ng": {
      "id": "8a2bb743-87d9-462e-bc09-335e78f9584a",
      "fields": {
        "description": "Nigerian millet-based drink. A reviewed preparation method, quantities, duration and yield are not available on this page.",
        "story": null,
        "occasion": null,
        "best_served_with": null,
        "regional_variations": null,
        "method_review_status": "pending-source-method",
        "method_review_revision": "kunu-ikivuguto-source-hold-20261018",
        "prep_time_minutes": null,
        "cook_time_minutes": null,
        "total_time_minutes": null,
        "default_servings": null,
        "serving_unit": null,
        "yield_status": "not-recorded",
        "calories": null,
        "protein_g": null,
        "carbs_g": null,
        "fat_g": null,
        "fiber_g": null,
        "ingredients": [],
        "steps": []
      }
    },
    "ikivuguto-rw": {
      "id": "f2850789-0ffd-41b3-bbaf-e3229132c9e6",
      "fields": {
        "description": "Rwandan cultured milk. A reviewed preparation method, quantities, duration and yield are not available on this page.",
        "story": null,
        "occasion": null,
        "best_served_with": null,
        "regional_variations": null,
        "method_review_status": "pending-source-method",
        "method_review_revision": "kunu-ikivuguto-source-hold-20261018",
        "prep_time_minutes": null,
        "cook_time_minutes": null,
        "total_time_minutes": null,
        "default_servings": null,
        "serving_unit": null,
        "yield_status": "not-recorded",
        "calories": null,
        "protein_g": null,
        "carbs_g": null,
        "fat_g": null,
        "fiber_g": null,
        "ingredients": [],
        "steps": []
      }
    },
    "maheu-zm": {
      "id": "626fd465-87e1-4f93-bca7-747decbf63d0",
      "fields": {
        "story": null,
        "occasion": null,
        "best_served_with": null,
        "regional_variations": null,
        "prep_time_minutes": null,
        "cook_time_minutes": null,
        "total_time_minutes": null,
        "default_servings": null,
        "serving_unit": null,
        "calories": null,
        "protein_g": null,
        "carbs_g": null,
        "fat_g": null,
        "fiber_g": null,
        "description": "Zambian maize-meal drink. A reviewed preparation method, quantities, fermentation conditions, duration and yield are not available on this page.",
        "method_review_status": "pending-source-method",
        "method_review_revision": "kisra-maheu-source-hold-20261018",
        "yield_status": "not-recorded",
        "ingredients": [],
        "steps": [],
        "diet_tags": []
      }
    }
  };
  function pendingRecipeMethodTarget(recipe) {
    if (!recipe || typeof recipe !== 'object') return null;
    if (Object.prototype.hasOwnProperty.call(pendingBeverageMethods, recipe.slug)) return { slug: recipe.slug, hold: pendingBeverageMethods[recipe.slug] };
    var slug = Object.keys(pendingBeverageMethods).find(function(key) { return pendingBeverageMethods[key].id === recipe.id; });
    return slug ? { slug: slug, hold: pendingBeverageMethods[slug] } : null;
  }
  function isPendingRecipeMethod(recipe) {
    return !!pendingRecipeMethodTarget(recipe);
  }
  function isPendingRecipeMethodId(id) {
    return typeof id === 'string' && Object.keys(pendingBeverageMethods).some(function(slug) { return pendingBeverageMethods[slug].id === id.toLowerCase(); });
  }
  function projectPendingRecipeMethod(recipe) {
    var target = pendingRecipeMethodTarget(recipe);
    if (!target) return recipe;
    if (recipe.id !== target.hold.id || recipe.slug !== target.slug) throw new Error('Pending recipe identity mismatch');
    var result = Object.assign({}, recipe, JSON.parse(JSON.stringify(target.hold.fields)), {
      method_revision: null, nutrition_basis: null, chef_notes: null, reviews: [], media: [], avg_rating: null, review_count: null
    });
    if (recipe.slug === 'ikivuguto-rw') result.diet_tags = (recipe.diet_tags || []).filter(function(tag) { return tag !== 'dairy-free'; });
    return result;
  }
  function isAttributedTarget(recipe) {
    return !!(recipe && Object.prototype.hasOwnProperty.call(attributedMethods, recipe.slug));
  }
  function isAttributedRecipe(recipe) {
    var method = isAttributedTarget(recipe) && attributedMethods[recipe.slug];
    return !!(method && isPublicRecipe(recipe) && recipe.id === method.id && recipe.method_revision === method.revision);
  }
  function projectAttributedRecipe(recipe) {
    if (isPendingRecipeMethod(recipe)) return projectPendingRecipeMethod(recipe);
    if (!isAttributedTarget(recipe)) return recipe;
    var method = attributedMethods[recipe.slug];
    if (recipe.id !== method.id || !isPublicRecipe(recipe)) return null;
    return Object.assign({}, recipe, JSON.parse(JSON.stringify(method.fields)), {
      method_revision: method.revision,
      content_representation: 'attributed-source-adaptation',
      reviews: [], avg_rating: null, review_count: 0
    });
  }
  function hasRecordedRecipeYield(recipe) { return !!recipe && !isPendingRecipeMethod(recipe) && recipe.yield_status !== 'not-recorded'; }
  // One reviewed display method; ordinary publication approval is required first.
  function kapentaSourceDetail(recipe, published) {
    if (!recipe || recipe.slug !== 'kapenta-stew-zm') return recipe;
    if (recipe.id !== '76572d95-eb8e-4c78-bbb6-ea754f61c758' || !isPublicRecipe(recipe)) return null;
    var approval = (published || []).find(function(row) { return row.id === recipe.id && row.slug === recipe.slug && isPublicRecipe(row); });
    var detail = approval && approval.curated_detail;
    if (!detail || detail.id !== recipe.id || detail.slug !== recipe.slug || detail.method_revision !== 'kapenta-zambian-kitchen-20261016') return null;
    var fields = detail.fields, allowed = ['name','description','story','author','source','best_served_with','occasion','regional_variations','prep_time_minutes','cook_time_minutes','total_time_minutes','default_servings','serving_unit','yield_status','calories','protein_g','carbs_g','fat_g','fiber_g','diet_tags','image_url','image_alt','ingredients','steps','media'];
    if (!fields || Object.keys(fields).some(function(key) { return allowed.indexOf(key) === -1; }) || fields.yield_status !== 'not-recorded' || fields.default_servings !== null ||
        !Array.isArray(fields.ingredients) || !Array.isArray(fields.steps) || !Array.isArray(fields.media) ||
        fields.ingredients.concat(fields.steps, fields.media).some(function(row) { return !row || row.recipe_id !== recipe.id; })) return null;
    return Object.assign({}, recipe, JSON.parse(JSON.stringify(fields)), { method_revision: detail.method_revision });
  }
  function f(slug, published) {
    if (Object.prototype.hasOwnProperty.call(pendingBeverageMethods, slug)) {
      var pendingApproval = (published || []).find(function(row) { return row.slug === slug && isPublicRecipe(row); });
      return pendingApproval ? projectPendingRecipeMethod(pendingApproval) : null;
    }
    if (Object.prototype.hasOwnProperty.call(attributedMethods, slug)) {
      var sourceApproval = (published || []).find(function(row) { return row.slug === slug && isPublicRecipe(row); });
      return sourceApproval ? projectAttributedRecipe(sourceApproval) : null;
    }
    if (slug === 'kapenta-stew-zm') {
      var approved = (published || []).find(function(row) { return row.slug === slug && isPublicRecipe(row); });
      return approved ? kapentaSourceDetail(Object.assign({}, approved, { reviews: [], avg_rating: null, review_count: 0 }), published) : null;
    }
    var seed = g.find(function(row) { return row.slug === slug; });
    if (!seed || seed.is_published === false || seed.is_verified === false || !published) return null;
    var approval = published.find(function(row) { return row.id === seed.id && row.slug === seed.slug && isPublicRecipe(row); });
    if (!approval) return null;
    return Object.assign({}, seed, { is_published: true, is_verified: true, reviews: [], avg_rating: null, review_count: 0 });
  }
  return {
    projectAttributedRecipe: projectAttributedRecipe,
    isAttributedRecipe: isAttributedRecipe,
    isAttributedTarget: isAttributedTarget,
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
    hasRecordedRecipeYield: hasRecordedRecipeYield,
    isPublicationUnavailable: function(value) { return !!value && value.publicationUnavailable === true; },
    retryPublication: function() { staticRecipePromise = null; r = {}; },
    checkRecipePublication: async function(recipe) {
      if (!recipe || !recipe.slug) return { kind: 'unavailable' };
      if (recipe.is_published === false || recipe.is_verified === false) return { kind: 'withheld' };
      if ((Object.prototype.hasOwnProperty.call(recipe, 'is_published') && recipe.is_published !== true) ||
          (Object.prototype.hasOwnProperty.call(recipe, 'is_verified') && recipe.is_verified !== true)) return { kind: 'unavailable' };
      var uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuid.test(recipe.id || '') && isPublicRecipe(recipe)) return { kind: 'eligible' };
      var children = (recipe.ingredients || []).concat(recipe.steps || []);
      if (!recipe.ingredients || !recipe.ingredients.length || !recipe.steps || !recipe.steps.length ||
          children.some(function(row) { return !row || !uuid.test(row.recipe_id || ''); })) return { kind: 'unavailable' };
      var id = children[0].recipe_id;
      if (children.some(function(row) { return row.recipe_id !== id; }) || (recipe.id && recipe.id !== id)) return { kind: 'unavailable' };
      var published = await loadPublishedRecipeIndex();
      if (!published) return { kind: 'unavailable' };
      return { kind: published.some(function(row) { return row.id === id && row.slug === recipe.slug && isPublicRecipe(row); }) ? 'eligible' : 'withheld' };
    },
    SEED_COLLECTIONS: p,
    fetchRecipes: async function(e) {
      var r = "recipes_" + JSON.stringify(e || {}), i = o(r);
      if (i) {
        return h(e, i);
      }
      var published = await loadPublishedRecipeIndex();
      if (published) {
        var matching = h(e, published);
        n(r, matching);
        return matching;
      }
      if (window.navigator && window.navigator.onLine === false) return publicationUnavailable();
      var a = t();
      if (!a) {
        return publicationUnavailable();
      }
      try {
        var s = a.from("recipes").select("*").eq("is_published", true).eq("is_verified", true);
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
        var eligible = h(e, c.data || []);
        return n(r, eligible), eligible;
      } catch (t) {
        return console.warn("AfroKitchen: Public recipe availability could not be checked"), publicationUnavailable();
      }
    },
    fetchRecipeBySlug: async function(e) {
      var r = "recipe_" + e, i = o(r);
      if (isPublicRecipe(i)) {
        return projectAttributedRecipe(i);
      }
      var published = await loadPublishedRecipeIndex();
      if (window.navigator && window.navigator.onLine === false) return f(e, published) || { publicationUnavailable: true };
      var a = t();
      if (!a) {
        return f(e, published) || { publicationUnavailable: true };
      }
      try {
        var s = await a.from("recipes").select("*").eq("slug", e).eq("is_published", true).eq("is_verified", true).maybeSingle();
        if (s.error) {
          throw s.error;
        }
        if (!s.data || !isPublicRecipe(s.data)) return null;
        var c = s.data;
        if (isPendingRecipeMethod(c)) { c = projectPendingRecipeMethod(c); n(r, c); return c; }
        var u = a.from("recipe_ingredients").select("*").eq("recipe_id", c.id).order("sort_order"), l = a.from("recipe_steps").select("*").eq("recipe_id", c.id).order("step_number"), d = a.from("recipe_reviews").select("*").eq("recipe_id", c.id).order("created_at", {
          ascending: !1
        }).limit(20), mediaQuery = a.from("recipe_media").select("*").eq("recipe_id", c.id).order("sort_order"), m = await Promise.all([ u, l, d, mediaQuery ]);
        if (m[3].error || !Array.isArray(m[3].data) || m[3].data.some(function(row) { return row.recipe_id !== c.id; })) throw new Error("Recipe media unavailable");
        c.media = m[3].data;
        if (c.ingredients = m[0].data || [], c.steps = m[1].data || [], c.reviews = m[2].data || [],
        c.reviews.length > 0) {
          var g = c.reviews.reduce(function(e, t) {
            return e + t.rating;
          }, 0);
          c.avg_rating = Math.round(g / c.reviews.length * 10) / 10, c.review_count = c.reviews.length;
        }
        c = projectAttributedRecipe(kapentaSourceDetail(c, published));
        if (!c) return { publicationUnavailable: true };
        return a.rpc("increment_recipe_views", {
          recipe_id: c.id
        }).catch(function() {}), n(r, c), c;
      } catch (t) {
        return console.warn("AfroKitchen: Public recipe detail availability could not be checked"), f(e, published) || { publicationUnavailable: true };
      }
    },
    fetchIngredientPrices: async function(e, r) {
      if (isPendingRecipeMethodId(e)) return null;
      if (Object.keys(attributedMethods).some(function(slug) { return attributedMethods[slug].id === e; })) return [];
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
      var controller = new AbortController(), timer;
      try {
        return await Promise.race([ (async function() {
          var response = await fetch('/.netlify/functions/afrokitchen-community', {
            method: 'POST', credentials: 'omit', signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.assign({}, e, { action: 'submit-recipe' }))
          });
          var data = await response.json();
          if (response.status === 201 && response.ok && data && data.success === true && data.status === 'pending') return { success: true, status: 'pending' };
          var fields = ['name', 'country_code', 'description', 'ingredients_text', 'steps_text', 'story', 'submitted_by', 'email', 'region_community', 'contributor_type', 'occasion', 'total_time', 'serve_with', 'photo_links', 'photo_permission', 'variations', 'consent'];
          return { error: response.status === 429 ? 'Submission limit reached. Please try later' : 'We could not confirm your recipe was saved', field: data && fields.indexOf(data.field) !== -1 ? data.field : null };
        })(), new Promise(function(resolve, reject) {
          timer = setTimeout(function() { controller.abort(); reject(new Error('Submission timeout')); }, 12000);
        }) ]);
      } catch (error) {
        return { error: 'We could not confirm your recipe was saved' };
      } finally {
        clearTimeout(timer);
        controller.abort();
      }
    },
    scaleIngredients: s,
    formatAmount: u,
    convertUnit: function(e, t, r) {
      var o = a[t], n = a[r];
      return o && n ? void 0 !== o.ml && void 0 !== n.ml ? e * o.ml / n.ml : void 0 !== o.g && void 0 !== n.g ? e * o.g / n.g : null : null;
    },
    scaleNutrition: function(e, t) {
      if (isPendingRecipeMethod(e)) return null;
      function nutrientValue(value) {
        if (typeof value !== 'number' && typeof value !== 'string') return null;
        if (typeof value === 'string' && !/^\s*(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?\s*$/i.test(value)) return null;
        var number = Number(value);
        return Number.isFinite(number) && number >= 0 ? number : null;
      }
      if (nutrientValue(e.calories) === null) return null;
      // Legacy recipe fields have no documented portion basis. Do not infer one or scale them.
      var basis = ['per_serving', 'batch'].indexOf(e.nutrition_basis) !== -1 ? e.nutrition_basis : 'unverified';
      var ratio = basis === 'batch' && Number(e.default_servings) > 0 ? t / e.default_servings : 1;
      var result = { basis: basis, per_serving: null };
      ['calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g'].forEach(function(key) {
        var value = nutrientValue(e[key]);
        result[key] = value === null ? null : Math.round(value * ratio * (key === 'calories' ? 1 : 10)) / (key === 'calories' ? 1 : 10);
      });
      if (basis === 'per_serving') result.per_serving = Object.assign({}, result, { per_serving: undefined });
      return result;
    },
    nutritionLabel: function(nutrition, servings) {
      if (nutrition.basis === 'per_serving') return 'Estimated nutrition per serving. Batch size changes ingredient quantities, not this portion estimate.';
      if (nutrition.basis === 'batch') return 'Estimated nutrition for the whole batch (' + servings + ' servings).';
      return 'Stored nutrition estimates: serving or batch basis not recorded. These values are not recalculated when servings change.';
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
    classifyRecipeDuration: function(value) {
      if (value == null || (typeof value === 'string' && value.trim() === '')) return { kind: 'unknown', minutes: null };
      if (typeof value !== 'number' && typeof value !== 'string') return { kind: 'invalid', minutes: null };
      if (typeof value === 'string' && !/^\s*(?:\d+(?:\.\d+)?|\.\d+)\s*$/.test(value)) return { kind: 'invalid', minutes: null };
      var number = Number(value);
      return Number.isFinite(number) && number >= 0 ? { kind: 'known', minutes: number } : { kind: 'invalid', minutes: null };
    },
    getRecipePressureStages: function(recipe) {
      if (!recipe || recipe.id !== '4caf4ed6-13ec-4fbb-8039-ce51a4201cfe' || !isAttributedRecipe(recipe)) return null;
      var steps = recipe.steps || [];
      return steps.length === 5 && steps[1].timer_seconds === 1200 && steps[3].timer_seconds === 420 ? [20, 7] : null;
    },
    getRecipeKisraStages: function(recipe) {
      if (!recipe || recipe.id !== 'c0aced74-68d6-437d-b00b-abd1895605f0' || !isAttributedRecipe(recipe)) return null;
      var steps = recipe.steps || [];
      return steps.length === 5 && steps[4].timer_seconds === 60 ? { batch: '250 g sorghum flour', ferment: 'Overnight', cook: '1–2 min per sheet' } : null;
    },
    getRecipeTiming: function(recipe) {
      if (isPendingRecipeMethod(recipe)) return { prep: null, cook: null, total: null };
      return { prep: this.classifyRecipeDuration(recipe.prep_time_minutes).minutes, cook: this.classifyRecipeDuration(recipe.cook_time_minutes).minutes, total: this.classifyRecipeDuration(recipe.total_time_minutes).minutes };
    },
    formatRecipeMinutes: function(value) {
      return value === null || value === undefined ? 'Not recorded' : value + ' min';
    },
    getRecipeIllustrationCaption: function(recipe) {
      var media = Array.isArray(recipe.media) ? recipe.media : [];
      var hero = media.find(function(row) { return row.recipe_id === recipe.id && row.role === 'hero' && row.image_url === recipe.image_url && row.source_type === 'ai_generated_illustration'; });
      return hero && typeof hero.caption === 'string' ? hero.caption : '';
    },
    formatTime: m,
    isPendingRecipeMethod: isPendingRecipeMethod,
    isPendingRecipeMethodId: isPendingRecipeMethodId,
    projectPendingRecipeMethod: projectPendingRecipeMethod,
    getStructuredData: function(e, t) {
      if (isPendingRecipeMethod(e)) return null;
      var recordedYield = hasRecordedRecipeYield(e), r = s(e.ingredients || [], recordedYield ? e.default_servings : 1, recordedYield ? t || e.default_servings : 1), timing = this.getRecipeTiming(e);
      if (['prep_time_minutes', 'cook_time_minutes', 'total_time_minutes'].some(function(field) { return this.classifyRecipeDuration(e[field]).kind === 'invalid'; }, this)) return null;
      // Recipe rich-result nutrition describes one serving, never an unknown stored basis.
      var nutrition, servings = Number(e.default_servings);
      if (Number.isFinite(servings) && servings > 0 && ['per_serving', 'batch'].indexOf(e.nutrition_basis) !== -1) {
        var values = this.scaleNutrition(e, 1);
        if (values) {
          nutrition = { '@type': 'NutritionInformation', servingSize: '1 serving' };
          [['calories', 'calories', ' calories'], ['protein_g', 'proteinContent', 'g'], ['carbs_g', 'carbohydrateContent', 'g'], ['fat_g', 'fatContent', 'g'], ['fiber_g', 'fiberContent', 'g']].forEach(function(field) {
            if (values[field[0]] !== null) nutrition[field[1]] = values[field[0]] + field[2];
          });
        }
      }
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
        ...(timing.prep !== null && timing.cook !== null ? { prepTime: "PT" + timing.prep + "M", cookTime: "PT" + timing.cook + "M" } : {}),
        ...(timing.total !== null ? { totalTime: "PT" + timing.total + "M" } : {}),
        ...(recordedYield ? { recipeYield: (t || e.default_servings) + " " + (e.serving_unit || "servings") } : {}),
        recipeCategory: "main" === e.category ? "Main Course" : e.category,
        recipeCuisine: e.country_name + ", " + e.region,
        nutrition: nutrition,
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
        aggregateRating: e.avg_rating && !isAttributedRecipe(e) && !(e.id === "76572d95-eb8e-4c78-bbb6-ea754f61c758" && e.method_revision === "kapenta-zambian-kitchen-20261016") ? {
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
      if (isPendingRecipeMethod(e)) return false;
      if (!hasRecordedRecipeYield(e)) t = 1;
      var timing = this.getRecipeTiming(e);
      var timingText = timing.prep === null && timing.cook === null ? "Time not recorded" : "Prep: " + this.formatRecipeMinutes(timing.prep) + "; cook: " + this.formatRecipeMinutes(timing.cook);
      var r = s(e.ingredients || [], hasRecordedRecipeYield(e) ? e.default_servings : 1, t), o = "<html><head><title>" + e.name + " - AfroKitchen</title><style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:0 20px;color:#111}h1{font-size:1.8rem;margin-bottom:4px}h2{font-size:1.1rem;margin:24px 0 8px;border-bottom:1px solid #ccc;padding-bottom:4px}.meta{color:#666;font-size:.9rem;margin-bottom:20px}ul{padding-left:20px}li{margin-bottom:6px;font-size:.95rem}ol li{margin-bottom:12px}.tip{color:#666;font-style:italic;font-size:.85rem}@media print{body{margin:0}}</style></head><body><h1>" + e.name + '</h1><div class="meta">' + e.country_name + " | " + e.category + (hasRecordedRecipeYield(e) ? " | Serves " + t : " | Yield not recorded; source quantities") + " | " + (timingText) + "</div><h2>Ingredients</h2><ul>", n = "";
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

// Node owners import the same pure projection; no client/database is opened here.
if (typeof module === "object" && module.exports) module.exports = AfroKitchenEngine;

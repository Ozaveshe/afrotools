!function() {
  "use strict";
  var a = {
    INTENT_PATTERNS: [ {
      type: "paye",
      label: "PAYE / Net Pay",
      example: "PAYE Nigeria 450000",
      patterns: [ /^paye\s/i, /\bnet\s*pay\b/i, /\btake[\s-]?home\b/i, /\btax\s+on\s+salary\b/i, /\bincome[\s-]?tax\b/i, /\bhow\s+much\s+.{0,30}(take\s+home|net|after\s+tax)\b/i, /\bgross[- ]to[- ]net\b/i ]
    }, {
      type: "minwage",
      label: "Minimum Wage",
      example: "MINWAGE Nigeria",
      patterns: [ /^min[\s-]?wage\b/i, /\bminimum\s+wage\b/i, /^minwage\b/i, /\blowest\s+(legal\s+)?pay\b/i ]
    }, {
      type: "overtime",
      label: "Overtime",
      example: "OT Kenya 150000 6 hours weekday",
      patterns: [ /^ot\s/i, /^overtime\b/i, /\bextra\s+hours?\b/i, /\bworked?\s+\d+\s+hours?\b/i, /\bovertime\s+pay\b/i, /\btime\s+and\s+a\s+half\b/i ]
    }, {
      type: "leave",
      label: "Leave Entitlements",
      example: "LEAVE South Africa",
      patterns: [ /^leave\b/i, /\bmaternity\s+leave\b/i, /\bpaternity\s+leave\b/i, /\bannual\s+leave\b/i, /\bsick\s+leave\b/i, /\bleave\s+entitlement\b/i, /\bhow\s+many\s+days?\s+leave\b/i ]
    }, {
      type: "pension",
      label: "Pension / Social Security",
      example: "PENSION Nigeria 300000",
      patterns: [ /^pension\b/i, /^nssf\b/i, /^ssnit\b/i, /^gepf\b/i, /\bsocial\s+security\b/i, /^uif\b/i, /^nhf\b/i, /\bpension\s+contribution\b/i, /\bretirement\s+fund\b/i ]
    }, {
      type: "deadline",
      label: "Compliance Deadlines",
      example: "DEADLINE Kenya",
      patterns: [ /^deadline\b/i, /\bwhen\s+is\s+paye\s+due\b/i, /\bfiling\s+deadline\b/i, /\btax\s+deadline\b/i, /\bremittance\s+date\b/i, /\bpaye\s+deadline\b/i ]
    }, {
      type: "salary",
      label: "Salary Benchmark",
      example: "SALARY software engineer Lagos",
      patterns: [ /^salary\s/i, /\bwhat\s+does\s+.{2,40}\s+earn\b/i, /\bmarket\s+rate\b/i, /\bhow\s+much\s+should\s+.{2,30}\s+earn\b/i, /\bsalary\s+range\b/i, /\bbenchmark\s+salary\b/i, /\baverage\s+salary\b/i ]
    }, {
      type: "law",
      label: "Labour Law",
      example: "LAW can my employer deduct for broken equipment Nigeria",
      patterns: [ /^law\s/i, /\bis\s+it\s+legal\b/i, /\bcan\s+my\s+employer\b/i, /\bmy\s+(employment\s+)?rights?\b/i, /\bfired\s+without\b/i, /\bdeduct\s+(from\s+)?salary\b/i, /\bnotice\s+period\b/i, /\bunfair\s+dismissal\b/i, /\bterminate\b/i, /\bredundancy\b/i, /\bwrongful\b/i, /\bseverance\b/i, /\bgardening\s+leave\b/i, /\bemployment\s+contract\b/i ]
    }, {
      type: "help",
      label: "Help / Menu",
      example: "HELP",
      patterns: [ /^help$/i, /^menu$/i, /^hi$/i, /^hello$/i, /^hiya$/i, /\bwhat\s+can\s+you\s+(do|help)\b/i, /^start$/i, /^commands?$/i ]
    } ],
    COUNTRIES: {
      nigeria: "NG",
      nigerian: "NG",
      ng: "NG",
      naija: "NG",
      kenya: "KE",
      kenyan: "KE",
      ke: "KE",
      nairobi: "KE",
      "south africa": "ZA",
      "south african": "ZA",
      za: "ZA",
      sa: "ZA",
      johannesburg: "ZA",
      "cape town": "ZA",
      ghana: "GH",
      ghanaian: "GH",
      gh: "GH",
      accra: "GH",
      tanzania: "TZ",
      tanzanian: "TZ",
      tz: "TZ",
      "dar es salaam": "TZ",
      uganda: "UG",
      ugandan: "UG",
      ug: "UG",
      kampala: "UG",
      ethiopia: "ET",
      ethiopian: "ET",
      et: "ET",
      "addis ababa": "ET",
      egypt: "EG",
      egyptian: "EG",
      eg: "EG",
      cairo: "EG",
      morocco: "MA",
      moroccan: "MA",
      ma: "MA",
      casablanca: "MA",
      senegal: "SN",
      senegalese: "SN",
      sn: "SN",
      dakar: "SN",
      "ivory coast": "CI",
      "cote d'ivoire": "CI",
      ci: "CI",
      abidjan: "CI",
      cameroon: "CM",
      cameroonian: "CM",
      cm: "CM",
      douala: "CM",
      angola: "AO",
      angolan: "AO",
      ao: "AO",
      luanda: "AO",
      mozambique: "MZ",
      mozambican: "MZ",
      mz: "MZ",
      maputo: "MZ",
      zambia: "ZM",
      zambian: "ZM",
      zm: "ZM",
      lusaka: "ZM",
      zimbabwe: "ZW",
      zimbabwean: "ZW",
      zw: "ZW",
      harare: "ZW",
      rwanda: "RW",
      rwandan: "RW",
      rw: "RW",
      kigali: "RW",
      botswana: "BW",
      motswana: "BW",
      bw: "BW",
      gaborone: "BW",
      namibia: "NA",
      namibian: "NA",
      na: "NA",
      windhoek: "NA",
      mali: "ML",
      malian: "ML",
      ml: "ML",
      bamako: "ML",
      "burkina faso": "BF",
      burkinabe: "BF",
      bf: "BF",
      ouagadougou: "BF",
      niger: "NE",
      nigerien: "NE",
      ne: "NE",
      niamey: "NE",
      chad: "TD",
      chadian: "TD",
      td: "TD",
      "n'djamena": "TD",
      sudan: "SD",
      sudanese: "SD",
      sd: "SD",
      khartoum: "SD",
      "south sudan": "SS",
      ss: "SS",
      juba: "SS",
      somalia: "SO",
      somali: "SO",
      so: "SO",
      mogadishu: "SO",
      eritrea: "ER",
      eritrean: "ER",
      er: "ER",
      asmara: "ER",
      djibouti: "DJ",
      djiboutian: "DJ",
      dj: "DJ",
      madagascar: "MG",
      malagasy: "MG",
      mg: "MG",
      antananarivo: "MG",
      malawi: "MW",
      malawian: "MW",
      mw: "MW",
      lilongwe: "MW",
      mauritius: "MU",
      mauritian: "MU",
      mu: "MU",
      "port louis": "MU",
      mauritania: "MR",
      mauritanian: "MR",
      mr: "MR",
      nouakchott: "MR",
      guinea: "GN",
      guinean: "GN",
      gn: "GN",
      conakry: "GN",
      "guinea-bissau": "GW",
      gw: "GW",
      bissau: "GW",
      "equatorial guinea": "GQ",
      gq: "GQ",
      malabo: "GQ",
      gabon: "GA",
      gabonese: "GA",
      ga: "GA",
      libreville: "GA",
      "republic of congo": "CG",
      "congo-brazzaville": "CG",
      cg: "CG",
      brazzaville: "CG",
      "dr congo": "CD",
      drc: "CD",
      cd: "CD",
      kinshasa: "CD",
      "central african republic": "CF",
      car: "CF",
      cf: "CF",
      bangui: "CF",
      benin: "BJ",
      beninese: "BJ",
      bj: "BJ",
      cotonou: "BJ",
      togo: "TG",
      togolese: "TG",
      tg: "TG",
      lome: "TG",
      "sierra leone": "SL",
      "sierra leonean": "SL",
      sl: "SL",
      freetown: "SL",
      liberia: "LR",
      liberian: "LR",
      lr: "LR",
      monrovia: "LR",
      gambia: "GM",
      gambian: "GM",
      gm: "GM",
      banjul: "GM",
      "cabo verde": "CV",
      "cape verde": "CV",
      cv: "CV",
      praia: "CV",
      "sao tome": "ST",
      st: "ST",
      "são tomé": "ST",
      comoros: "KM",
      comorian: "KM",
      km: "KM",
      moroni: "KM",
      seychelles: "SC",
      seychellois: "SC",
      sc: "SC",
      victoria: "SC",
      lesotho: "LS",
      mosotho: "LS",
      ls: "LS",
      maseru: "LS",
      eswatini: "SZ",
      swaziland: "SZ",
      sz: "SZ",
      mbabane: "SZ",
      tunisia: "TN",
      tunisian: "TN",
      tn: "TN",
      tunis: "TN",
      algeria: "DZ",
      algerian: "DZ",
      dz: "DZ",
      algiers: "DZ",
      libya: "LY",
      libyan: "LY",
      ly: "LY",
      tripoli: "LY",
      burundi: "BI",
      burundian: "BI",
      bi: "BI",
      bujumbura: "BI"
    },
    CURRENCIES: {
      NG: {
        code: "NGN",
        symbol: "₦",
        name: "Nigerian Naira"
      },
      KE: {
        code: "KES",
        symbol: "KSh",
        name: "Kenyan Shilling"
      },
      ZA: {
        code: "ZAR",
        symbol: "R",
        name: "South African Rand"
      },
      GH: {
        code: "GHS",
        symbol: "GH₵",
        name: "Ghanaian Cedi"
      },
      TZ: {
        code: "TZS",
        symbol: "TSh",
        name: "Tanzanian Shilling"
      },
      UG: {
        code: "UGX",
        symbol: "USh",
        name: "Ugandan Shilling"
      },
      ET: {
        code: "ETB",
        symbol: "Br",
        name: "Ethiopian Birr"
      },
      EG: {
        code: "EGP",
        symbol: "E£",
        name: "Egyptian Pound"
      },
      MA: {
        code: "MAD",
        symbol: "MAD",
        name: "Moroccan Dirham"
      },
      SN: {
        code: "XOF",
        symbol: "CFA",
        name: "West African CFA"
      },
      ZM: {
        code: "ZMW",
        symbol: "K",
        name: "Zambian Kwacha"
      },
      ZW: {
        code: "ZWL",
        symbol: "Z$",
        name: "Zimbabwean Dollar"
      },
      RW: {
        code: "RWF",
        symbol: "RF",
        name: "Rwandan Franc"
      },
      BW: {
        code: "BWP",
        symbol: "P",
        name: "Botswana Pula"
      },
      NA: {
        code: "NAD",
        symbol: "N$",
        name: "Namibian Dollar"
      }
    },
    FLAGS: {
      NG: "🇳🇬",
      KE: "🇰🇪",
      ZA: "🇿🇦",
      GH: "🇬🇭",
      TZ: "🇹🇿",
      UG: "🇺🇬",
      ET: "🇪🇹",
      EG: "🇪🇬",
      MA: "🇲🇦",
      SN: "🇸🇳",
      CI: "🇨🇮",
      CM: "🇨🇲",
      AO: "🇦🇴",
      MZ: "🇲🇿",
      ZM: "🇿🇲",
      ZW: "🇿🇼",
      RW: "🇷🇼",
      BW: "🇧🇼",
      NA: "🇳🇦",
      ML: "🇲🇱",
      BF: "🇧🇫",
      NE: "🇳🇪",
      TD: "🇹🇩",
      SD: "🇸🇩",
      SS: "🇸🇸",
      SO: "🇸🇴",
      ER: "🇪🇷",
      DJ: "🇩🇯",
      MG: "🇲🇬",
      MW: "🇲🇼",
      MU: "🇲🇺",
      MR: "🇲🇷",
      GN: "🇬🇳",
      GW: "🇬🇼",
      GQ: "🇬🇶",
      GA: "🇬🇦",
      CG: "🇨🇬",
      CD: "🇨🇩",
      CF: "🇨🇫",
      BJ: "🇧🇯",
      TG: "🇹🇬",
      SL: "🇸🇱",
      LR: "🇱🇷",
      GM: "🇬🇲",
      CV: "🇨🇻",
      ST: "🇸🇹",
      KM: "🇰🇲",
      SC: "🇸🇨",
      LS: "🇱🇸",
      SZ: "🇸🇿",
      TN: "🇹🇳",
      DZ: "🇩🇿",
      LY: "🇱🇾",
      BI: "🇧🇮"
    },
    detectIntent: function(a) {
      if (!a || "string" != typeof a) {
        return {
          type: "help",
          country: null,
          salary: null,
          raw: a
        };
      }
      for (var e = a.trim(), n = 0; n < this.INTENT_PATTERNS.length; n++) {
        for (var i = this.INTENT_PATTERNS[n], r = 0; r < i.patterns.length; r++) {
          if (i.patterns[r].test(e)) {
            return {
              type: i.type,
              country: this.parseCountry(e),
              salary: this.parseSalary(e),
              raw: e
            };
          }
        }
      }
      return {
        type: "natural-language",
        country: this.parseCountry(e),
        salary: this.parseSalary(e),
        raw: e
      };
    },
    parseCountry: function(a) {
      for (var e = (a || "").toLowerCase(), n = Object.keys(this.COUNTRIES).sort(function(a, e) {
        return e.length - a.length;
      }), i = 0; i < n.length; i++) {
        var r = n[i], o = e.indexOf(r);
        if (-1 !== o) {
          var s = 0 === o ? " " : e[o - 1], t = o + r.length >= e.length ? " " : e[o + r.length];
          if ((/[\s,.\-_\/]/.test(s) || 0 === o) && (/[\s,.\-_\/]/.test(t) || o + r.length === e.length)) {
            return this.COUNTRIES[r];
          }
        }
      }
      return null;
    },
    parseSalary: function(a) {
      var e = (a || "").replace(/[₦KSh R GH₵ TSh USh Br E£ MAD CFA]/g, " "), n = (e = e.replace(/\b(NGN|KES|ZAR|GHS|TZS|UGX|ETB|EGP|MAD|XOF|ZMW|RWF|BWP|NAD|USD)\b/gi, " ")).match(/(\d[\d,]*\.?\d*)\s*(k|m|thousand|million)?\b/i);
      if (!n) {
        return null;
      }
      var i = parseFloat(n[1].replace(/,/g, ""));
      if (isNaN(i)) {
        return null;
      }
      var r = (n[2] || "").toLowerCase();
      return "k" !== r && "thousand" !== r || (i *= 1e3), "m" !== r && "million" !== r || (i *= 1e6),
      i;
    },
    parseOvertimeParams: function(a) {
      var e = null, n = "weekday", i = a.match(/(\d+\.?\d*)\s*h(ours?)?/i);
      return i && (e = parseFloat(i[1])), /public\s+holiday|ph\b/i.test(a) ? n = "public_holiday" : /weekend|sunday|saturday|sat\b|sun\b/i.test(a) && (n = "weekend"),
      {
        hours: e,
        dayType: n
      };
    },
    formatCurrency: function(a, e) {
      var n = this.CURRENCIES[e];
      return (n ? n.symbol : (e || "") + " ") + Math.round(a).toLocaleString("en-US");
    },
    fmtNum: function(a) {
      return Math.round(a).toLocaleString("en-US");
    },
    getFlag: function(a) {
      return this.FLAGS[a] || "🌍";
    },
    buildHelpMessage: function() {
      return "👋 *Welcome to AfroTools — Africa's #1 payroll calculator.*\n\nI can help with:\n📊 *PAYE & net pay* — type: PAYE Nigeria 300000\n💰 *Minimum wage* — type: MINWAGE Kenya\n⏰ *Overtime* — type: OT Ghana 150000 4 hours\n🌴 *Leave entitlements* — type: LEAVE South Africa\n🏦 *Pension / social security* — type: PENSION Nigeria 300000\n📅 *Compliance deadlines* — type: DEADLINE Kenya\n📊 *Salary benchmarks* — type: SALARY software engineer Lagos\n⚖️ *Labour law* — type: LAW can my employer dock my pay Nigeria\n\n🌍 I cover all *54 African countries*.\n\n_Powered by AfroTools.com — free for everyone, forever._";
    },
    getIntentLabel: function(a) {
      var e = this.INTENT_PATTERNS.find(function(e) {
        return e.type === a;
      });
      return e ? e.label : "General Question";
    }
  };
  "undefined" != typeof window && (window.AfroTools = window.AfroTools || {}, window.AfroTools.engines = window.AfroTools.engines || {},
  window.AfroTools.engines.whatsappBot = a), "undefined" != typeof module && module.exports && (module.exports = a);
}();

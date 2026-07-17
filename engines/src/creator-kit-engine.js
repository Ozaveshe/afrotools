!function() {
  "use strict";
  var e = {
    bold: {
      id: "bold",
      name: "Bold",
      icon: "🔥",
      desc: "Large hero, minimal text, high-impact",
      colors: {
        bg: "#0A0A0A",
        accent: "#F5A623",
        text: "#fff"
      },
      fonts: {
        heading: "Instrument Serif",
        body: "DM Sans"
      },
      niche: [ "photography", "videography", "visual-art" ]
    },
    editorial: {
      id: "editorial",
      name: "Editorial",
      icon: "📰",
      desc: "Magazine layout, text-rich, multi-column",
      colors: {
        bg: "#FAFAF8",
        accent: "#1a1a1a",
        text: "#111"
      },
      fonts: {
        heading: "Instrument Serif",
        body: "DM Sans"
      },
      niche: [ "writing", "journalism", "blogging" ]
    },
    vibrant: {
      id: "vibrant",
      name: "Vibrant",
      icon: "🎨",
      desc: "Colorful, playful, pattern backgrounds",
      colors: {
        bg: "#FFF5E6",
        accent: "#FF6B35",
        text: "#1a1a1a"
      },
      fonts: {
        heading: "DM Sans",
        body: "DM Sans"
      },
      niche: [ "design", "illustration", "fashion" ]
    },
    music: {
      id: "music",
      name: "Music",
      icon: "🎵",
      desc: "Dark theme, waveform accents, streaming stats",
      colors: {
        bg: "#0d0d0d",
        accent: "#1DB954",
        text: "#fff"
      },
      fonts: {
        heading: "DM Sans",
        body: "DM Sans"
      },
      niche: [ "music", "audio", "voice-over" ]
    },
    professional: {
      id: "professional",
      name: "Professional",
      icon: "💼",
      desc: "Clean corporate, charts and metrics",
      colors: {
        bg: "#F8FAFC",
        accent: "#2563EB",
        text: "#1e293b"
      },
      fonts: {
        heading: "DM Sans",
        body: "DM Sans"
      },
      niche: [ "consulting", "speaking", "development" ]
    },
    minimalist: {
      id: "minimalist",
      name: "Minimalist",
      icon: "✨",
      desc: "White space, single accent, elegant",
      colors: {
        bg: "#fff",
        accent: "#111",
        text: "#111"
      },
      fonts: {
        heading: "Instrument Serif",
        body: "DM Sans"
      },
      niche: [ "all" ]
    }
  }, n = {
    NGN: {
      symbol: "₦",
      name: "Nigerian Naira",
      locale: "en-NG"
    },
    KES: {
      symbol: "KSh",
      name: "Kenyan Shilling",
      locale: "en-KE"
    },
    ZAR: {
      symbol: "R",
      name: "South African Rand",
      locale: "en-ZA"
    },
    GHS: {
      symbol: "GH₵",
      name: "Ghanaian Cedi",
      locale: "en-GH"
    },
    USD: {
      symbol: "$",
      name: "US Dollar",
      locale: "en-US"
    },
    GBP: {
      symbol: "£",
      name: "British Pound",
      locale: "en-GB"
    },
    EUR: {
      symbol: "€",
      name: "Euro",
      locale: "en-IE"
    },
    EGP: {
      symbol: "E£",
      name: "Egyptian Pound",
      locale: "en-EG"
    },
    TZS: {
      symbol: "TSh",
      name: "Tanzanian Shilling",
      locale: "en-TZ"
    },
    UGX: {
      symbol: "USh",
      name: "Ugandan Shilling",
      locale: "en-UG"
    },
    RWF: {
      symbol: "RF",
      name: "Rwandan Franc",
      locale: "en-RW"
    },
    XOF: {
      symbol: "CFA",
      name: "West African CFA",
      locale: "fr-SN"
    },
    XAF: {
      symbol: "FCFA",
      name: "Central African CFA",
      locale: "fr-CM"
    },
    MAD: {
      symbol: "MAD",
      name: "Moroccan Dirham",
      locale: "fr-MA"
    }
  };
  function a(e, a) {
    var i = n[a] || n.NGN, o = "string" == typeof e ? parseInt(e.replace(/[^0-9]/g, ""), 10) : e;
    return isNaN(o) ? e : i.symbol + o.toLocaleString();
  }
  window.AfroTools = window.AfroTools || {}, window.AfroTools.CreatorKitEngine = {
    TEMPLATES: e,
    FONT_PAIRINGS: {
      default: {
        heading: "Instrument Serif",
        body: "DM Sans"
      },
      modern: {
        heading: "Inter",
        body: "Space Grotesk"
      },
      elegant: {
        heading: "Playfair Display",
        body: "Lato"
      },
      bold: {
        heading: "Montserrat",
        body: "Open Sans"
      }
    },
    SECTION_TYPES: [ {
      id: "hero",
      label: "Hero / Cover",
      icon: "🎯",
      required: !0
    }, {
      id: "about",
      label: "About / Bio",
      icon: "📝",
      required: !1
    }, {
      id: "portfolio",
      label: "Portfolio",
      icon: "🖼️",
      required: !1
    }, {
      id: "stats",
      label: "Audience Stats",
      icon: "📊",
      required: !1
    }, {
      id: "services",
      label: "Services & Rates",
      icon: "💰",
      required: !1
    }, {
      id: "clients",
      label: "Past Clients",
      icon: "🏢",
      required: !1
    }, {
      id: "testimonials",
      label: "Testimonials",
      icon: "💬",
      required: !1
    }, {
      id: "contact",
      label: "Contact / CTA",
      icon: "📧",
      required: !1
    }, {
      id: "custom",
      label: "Custom Block",
      icon: "✏️",
      required: !1
    } ],
    CURRENCIES: n,
    formatRate: a,
    formatNumber: function(e) {
      var n = "string" == typeof e ? parseInt(e.replace(/[^0-9]/g, ""), 10) : e;
      return isNaN(n) ? e : n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace(/\.0$/, "") + "K" : n.toString();
    },
    suggestTemplate: function(n) {
      if (!n) {
        return e.bold;
      }
      var a = n.toLowerCase();
      for (var i in e) {
        var o = e[i];
        if (o.niche.some(function(e) {
          return -1 !== a.indexOf(e);
        })) {
          return o;
        }
      }
      return e.minimalist;
    },
    getDefaultSectionOrder: function() {
      return [ "hero", "about", "portfolio", "stats", "services", "clients", "testimonials", "contact" ];
    },
    createEmptyKit: function() {
      return {
        template: "bold",
        name: "",
        tagline: "",
        heroImage: null,
        socials: {
          instagram: "",
          twitter: "",
          tiktok: "",
          youtube: ""
        },
        bioTone: "professional",
        bioShort: "",
        bioMedium: "",
        bioLong: "",
        portfolioLayout: "grid-2",
        portfolioImages: [],
        stats: {},
        statsInsight: "",
        showPrices: !0,
        currency: "NGN",
        services: [],
        packages: [ {
          name: "Starter",
          price: "",
          includes: ""
        }, {
          name: "Standard",
          price: "",
          includes: ""
        }, {
          name: "Premium",
          price: "",
          includes: ""
        } ],
        clients: "",
        testimonials: [ {
          quote: "",
          name: ""
        } ],
        contactEmail: "",
        contactPhone: "",
        contactWhatsapp: "",
        bookingUrl: "",
        ctaText: "Let's Work Together",
        accentColor: "#F5A623",
        fontPairing: "default",
        hiddenSections: [],
        sectionOrder: [ "hero", "about", "portfolio", "stats", "services", "clients", "testimonials", "contact" ]
      };
    },
    generateWhatsAppText: function(e) {
      var n = "*" + (e.name || "Rate Card") + "*\n";
      return e.tagline && (n += e.tagline + "\n"), e.services && e.services.length && (n += "\n*Services:*\n",
      e.services.forEach(function(i) {
        n += "• " + i.name, e.showPrices && i.price && (n += " — " + a(i.price, e.currency)),
        n += "\n";
      })), e.packages && e.packages.some(function(e) {
        return e.name && e.price;
      }) && (n += "\n*Packages:*\n", e.packages.forEach(function(i) {
        i.name && i.price && (n += "\n📦 *" + i.name + "* — " + a(i.price, e.currency) + "\n",
        i.includes && i.includes.split("\n").filter(Boolean).forEach(function(e) {
          n += "  ✓ " + e.trim() + "\n";
        }));
      })), e.contactEmail && (n += "\n📩 " + e.contactEmail), e.contactWhatsapp && (n += "\n💬 " + e.contactWhatsapp),
      n;
    }
  };
}();

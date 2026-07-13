var CreatorPageEngine = function() {
  "use strict";
  var e = "afro_creator_page";
  function t(t) {
    try {
      t.updated_at = (new Date).toISOString(), localStorage.setItem(e, JSON.stringify(t));
    } catch (e) {}
  }
  function n() {
    return {
      id: crypto.randomUUID(),
      username: "",
      display_name: "Your Name",
      bio: "Creator, dreamer, builder.",
      avatar_url: "",
      location: "",
      social_links: {},
      theme: "clean",
      accent_color: "#F43F5E",
      font_pairing: "default",
      button_style: "pill",
      button_fill: "solid",
      background_type: "solid",
      background_value: "#ffffff",
      is_published: !0,
      blocks: [ {
        id: crypto.randomUUID(),
        block_type: "link",
        content: {
          title: "My YouTube Channel",
          url: "https://youtube.com",
          icon: "▶️",
          featured: !1
        },
        is_visible: !0,
        sort_order: 0
      }, {
        id: crypto.randomUUID(),
        block_type: "link",
        content: {
          title: "Book a Session",
          url: "#",
          icon: "📅",
          featured: !0
        },
        is_visible: !0,
        sort_order: 1
      }, {
        id: crypto.randomUUID(),
        block_type: "link",
        content: {
          title: "WhatsApp Me",
          url: "https://wa.me/",
          icon: "💬",
          featured: !1,
          type: "whatsapp"
        },
        is_visible: !0,
        sort_order: 2
      } ],
      products: [],
      analytics: {
        views: 0,
        clicks: 0,
        sales: 0,
        revenue: 0
      },
      created_at: (new Date).toISOString(),
      updated_at: (new Date).toISOString()
    };
  }
  function a(e) {
    switch (e) {
     case "link":
      return {
        title: "New Link",
        url: "",
        icon: "🔗",
        featured: !1
      };

     case "product":
      return {
        name: "My Product",
        description: "",
        price: 0,
        currency: "NGN",
        image_url: "",
        product_type: "download"
      };

     case "tip_jar":
      return {
        title: "Support My Work",
        amounts: [ 1e3, 2e3, 5e3 ],
        currency: "NGN"
      };

     case "email_signup":
      return {
        title: "Join My Newsletter",
        subtitle: "Get updates directly in your inbox"
      };

     case "booking":
      return {
        service: "Consultation",
        description: "",
        price: 0,
        currency: "NGN",
        duration: "1 hour"
      };

     case "content":
      return {
        images: [],
        type: "gallery"
      };

     case "testimonial":
      return {
        quote: '"Amazing work!"',
        author: "Happy Client"
      };

     case "text":
      return {
        heading: "Announcement",
        body: "Something exciting is coming...",
        cta_text: "",
        cta_url: ""
      };

     case "spacer":
      return {
        type: "divider",
        height: 20
      };

     default:
      return {};
    }
  }
  function r(t) {
    var n = e + "_events";
    try {
      return JSON.parse(localStorage.getItem(n) || "[]").filter(function(e) {
        return e.page_id === t;
      });
    } catch (e) {
      return [];
    }
  }
  var i = {
    NGN: {
      symbol: "₦",
      name: "Nigerian Naira"
    },
    KES: {
      symbol: "KSh",
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
      symbol: "TSh",
      name: "Tanzanian Shilling"
    },
    UGX: {
      symbol: "USh",
      name: "Ugandan Shilling"
    },
    XOF: {
      symbol: "CFA",
      name: "CFA Franc"
    },
    EGP: {
      symbol: "E£",
      name: "Egyptian Pound"
    },
    USD: {
      symbol: "$",
      name: "US Dollar"
    }
  }, o = "/.netlify/functions/creator-page";
  return {
    THEMES: {
      clean: {
        label: "Clean",
        desc: "White, minimal, modern",
        preview: "#ffffff"
      },
      dark: {
        label: "Dark",
        desc: "Dark background, premium feel",
        preview: "#111827"
      },
      gradient: {
        label: "Gradient",
        desc: "Colorful gradient, vibrant",
        preview: "linear-gradient(135deg,#667eea,#764ba2)"
      },
      neon: {
        label: "Neon",
        desc: "Dark + neon outlines, tech vibe",
        preview: "#0a0a0a"
      },
      warm: {
        label: "Warm",
        desc: "Cream/beige, earthy, organic",
        preview: "#FFF8F0"
      },
      bold: {
        label: "Bold",
        desc: "High contrast, large type",
        preview: "#111111"
      },
      glass: {
        label: "Glass",
        desc: "Frosted blur, modern & sleek",
        preview: "linear-gradient(135deg,#1a1a2e,#16213e)"
      },
      photo: {
        label: "Photo",
        desc: "Background image, scenic",
        preview: "#4a6741"
      }
    },
    BLOCK_TYPES: {
      link: {
        label: "Link Button",
        icon: "🔗",
        desc: "Add a link"
      },
      product: {
        label: "Digital Product",
        icon: "🛍️",
        desc: "Sell a download or service"
      },
      tip_jar: {
        label: "Tip Jar",
        icon: "💝",
        desc: "Accept tips & support"
      },
      email_signup: {
        label: "Email Signup",
        icon: "📧",
        desc: "Grow your newsletter"
      },
      booking: {
        label: "Booking",
        icon: "📅",
        desc: "Let people book you"
      },
      content: {
        label: "Content Showcase",
        icon: "📸",
        desc: "Show off your work"
      },
      testimonial: {
        label: "Testimonial",
        icon: "⭐",
        desc: "Show social proof"
      },
      text: {
        label: "Text / Announcement",
        icon: "📝",
        desc: "Custom heading & text"
      },
      spacer: {
        label: "Spacer / Divider",
        icon: "➖",
        desc: "Visual separator"
      }
    },
    FONT_PAIRINGS: {
      default: {
        display: "'DM Sans', system-ui, sans-serif",
        body: "'DM Sans', system-ui, sans-serif"
      },
      serif: {
        display: "'Instrument Serif', Georgia, serif",
        body: "'DM Sans', system-ui, sans-serif"
      },
      mono: {
        display: "'JetBrains Mono', monospace",
        body: "'DM Sans', system-ui, sans-serif"
      },
      display: {
        display: "'Playfair Display', Georgia, serif",
        body: "'DM Sans', system-ui, sans-serif"
      }
    },
    BUTTON_STYLES: [ "pill", "rounded", "square" ],
    BUTTON_FILLS: [ "solid", "outline", "ghost" ],
    PAYMENT_METHODS: {
      bank_transfer: {
        label: "Bank Transfer",
        icon: "🏦",
        desc: "Direct bank deposit",
        countries: [ "NG", "GH", "KE", "ZA", "TZ" ]
      },
      mpesa: {
        label: "M-Pesa",
        icon: "📱",
        desc: "Mobile money",
        countries: [ "KE", "TZ", "UG", "MZ" ]
      },
      paystack: {
        label: "Paystack",
        icon: "💳",
        desc: "Card & bank payment",
        countries: [ "NG", "GH", "ZA", "KE" ]
      },
      flutterwave: {
        label: "Flutterwave",
        icon: "⚡",
        desc: "30+ African currencies",
        countries: [ "NG", "GH", "KE", "ZA", "TZ", "UG", "RW" ]
      },
      paypal: {
        label: "PayPal",
        icon: "🌍",
        desc: "International buyers",
        countries: [ "ALL" ]
      }
    },
    CURRENCIES: i,
    getLocalPage: function() {
      try {
        var t = localStorage.getItem(e);
        if (t) {
          return JSON.parse(t);
        }
      } catch (e) {}
      return n();
    },
    saveLocalPage: t,
    createDefaultPage: n,
    addBlock: function(e, n, r) {
      var i = {
        id: crypto.randomUUID(),
        block_type: n,
        content: r || a(n),
        is_visible: !0,
        sort_order: e.blocks.length
      };
      return e.blocks.push(i), t(e), i;
    },
    updateBlock: function(e, n, a) {
      var r = e.blocks.find(function(e) {
        return e.id === n;
      });
      return r && (Object.assign(r, a), t(e)), r;
    },
    deleteBlock: function(e, n) {
      e.blocks = e.blocks.filter(function(e) {
        return e.id !== n;
      }), e.blocks.forEach(function(e, t) {
        e.sort_order = t;
      }), t(e);
    },
    moveBlock: function(e, n, a) {
      var r = e.blocks.findIndex(function(e) {
        return e.id === n;
      });
      if (!(r < 0)) {
        var i = "up" === a ? r - 1 : r + 1;
        if (!(i < 0 || i >= e.blocks.length)) {
          var o = e.blocks[r];
          e.blocks[r] = e.blocks[i], e.blocks[i] = o, e.blocks.forEach(function(e, t) {
            e.sort_order = t;
          }), t(e);
        }
      }
    },
    getDefaultBlockContent: a,
    addProduct: function(e, n) {
      return n.id = n.id || crypto.randomUUID(), n.is_active = !0, n.sales_count = 0,
      n.revenue_total = 0, n.created_at = (new Date).toISOString(), e.products.push(n),
      t(e), n;
    },
    deleteProduct: function(e, n) {
      e.products = e.products.filter(function(e) {
        return e.id !== n;
      }), t(e);
    },
    trackEvent: function(t, n, a) {
      var r = e + "_events", i = [];
      try {
        i = JSON.parse(localStorage.getItem(r) || "[]");
      } catch (e) {}
      i.push({
        page_id: t,
        event_type: n,
        details: a || {},
        created_at: (new Date).toISOString()
      }), i.length > 500 && (i = i.slice(-500));
      try {
        localStorage.setItem(r, JSON.stringify(i));
      } catch (e) {}
    },
    getLocalAnalytics: r,
    getAnalyticsSummary: function(e) {
      var t = r(e), n = t.filter(function(e) {
        return "page_view" === e.event_type;
      }).length, a = t.filter(function(e) {
        return "link_click" === e.event_type;
      }).length, i = t.filter(function(e) {
        return "product_view" === e.event_type;
      }).length, o = t.filter(function(e) {
        return "product_purchase" === e.event_type;
      }).length, c = t.filter(function(e) {
        return "email_signup" === e.event_type;
      }).length, l = {};
      return t.forEach(function(e) {
        "link_click" === e.event_type && e.details && e.details.title && (l[e.details.title] = (l[e.details.title] || 0) + 1);
      }), {
        views: n,
        clicks: a,
        productViews: i,
        purchases: o,
        signups: c,
        clicksByBlock: l,
        ctr: n > 0 ? Math.round(a / n * 100) : 0
      };
    },
    detectLinkType: function(e) {
      return e ? e.match(/youtube\.com|youtu\.be/i) ? "youtube" : e.match(/spotify\.com|music\.apple\.com/i) ? "music" : e.match(/wa\.me|whatsapp\.com/i) ? "whatsapp" : e.match(/instagram\.com/i) ? "instagram" : e.match(/tiktok\.com/i) ? "tiktok" : "link" : "link";
    },
    formatPrice: function(e, t) {
      return (i[t = t || "NGN"] || {
        symbol: t + " "
      }).symbol + Number(e).toLocaleString();
    },
    savePage: async function(e) {
      try {
        var t = await fetch(o, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            action: "save-page",
            page: e
          })
        });
        return t.ok ? await t.json() : null;
      } catch (e) {
        return null;
      }
    },
    fetchPage: async function(e) {
      try {
        var t = await fetch(o + "?action=get-page&id=" + encodeURIComponent(e));
        return t.ok ? await t.json() : null;
      } catch (e) {
        return null;
      }
    }
  };
}();

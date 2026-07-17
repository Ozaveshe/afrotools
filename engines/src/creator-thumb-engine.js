!function() {
  "use strict";
  var t = {
    "yt-thumb": {
      w: 1280,
      h: 720,
      label: "YouTube Thumbnail",
      icon: "▶",
      platform: "YouTube"
    },
    "yt-banner": {
      w: 2560,
      h: 1440,
      label: "YouTube Banner",
      icon: "▶",
      platform: "YouTube"
    },
    "tt-cover": {
      w: 1080,
      h: 1920,
      label: "TikTok Cover",
      icon: "♪",
      platform: "TikTok"
    },
    "tt-thumb": {
      w: 1080,
      h: 1920,
      label: "TikTok Thumbnail",
      icon: "♪",
      platform: "TikTok"
    },
    "ig-post": {
      w: 1080,
      h: 1080,
      label: "Instagram Post",
      icon: "◻",
      platform: "Instagram"
    },
    "ig-story": {
      w: 1080,
      h: 1920,
      label: "Instagram Story",
      icon: "◻",
      platform: "Instagram"
    },
    "ig-reel": {
      w: 1080,
      h: 1920,
      label: "Instagram Reel",
      icon: "◻",
      platform: "Instagram"
    },
    "fb-post": {
      w: 1200,
      h: 630,
      label: "Facebook Post",
      icon: "f",
      platform: "Facebook"
    },
    "fb-cover": {
      w: 820,
      h: 312,
      label: "Facebook Cover",
      icon: "f",
      platform: "Facebook"
    },
    "fb-story": {
      w: 1080,
      h: 1920,
      label: "Facebook Story",
      icon: "f",
      platform: "Facebook"
    },
    "x-post": {
      w: 1600,
      h: 900,
      label: "X / Twitter Post",
      icon: "𝕏",
      platform: "X"
    },
    "x-header": {
      w: 1500,
      h: 500,
      label: "X / Twitter Header",
      icon: "𝕏",
      platform: "X"
    },
    "li-post": {
      w: 1200,
      h: 627,
      label: "LinkedIn Post",
      icon: "in",
      platform: "LinkedIn"
    },
    "li-cover": {
      w: 1584,
      h: 396,
      label: "LinkedIn Cover",
      icon: "in",
      platform: "LinkedIn"
    },
    pin: {
      w: 1e3,
      h: 1500,
      label: "Pinterest Pin",
      icon: "P",
      platform: "Pinterest"
    },
    custom: {
      w: 1280,
      h: 720,
      label: "Custom Size",
      icon: "✎",
      platform: "Custom"
    }
  }, e = [ {
    cat: "flags",
    items: [ "🇳🇬", "🇬🇭", "🇰🇪", "🇿🇦", "🇪🇹", "🇹🇿", "🇨🇲", "🇸🇳", "🇨🇮", "🇲🇦", "🇪🇬", "🇷🇼", "🇺🇬", "🇿🇼", "🇲🇿", "🇲🇱", "🇧🇫", "🇳🇪", "🇹🇬", "🇧🇯" ]
  }, {
    cat: "culture",
    items: [ "🥁", "🪘", "🎭", "🪬", "🏺", "🪶", "🌍", "🦁", "🐘", "🦒", "🦓", "🐆", "🦅", "🌴", "🌺", "🪷", "💎", "👑", "✊🏿", "✊🏾" ]
  }, {
    cat: "food",
    items: [ "🍲", "🍛", "🥘", "🫕", "🥜", "🥥", "🍌", "🥭", "🍊", "🌶️", "🫑", "🧅", "🍠", "🌽", "🍚", "🫘", "🥬", "🍍", "🥑", "☕" ]
  }, {
    cat: "music",
    items: [ "🎵", "🎶", "🎤", "🎧", "🎹", "🎸", "🎺", "🪗", "💃🏿", "🕺🏿", "🙌🏿", "👏🏿", "🤲🏿", "🙏🏿", "💪🏿", "🫶🏿", "❤️‍🔥", "🔥", "⚡", "✨" ]
  }, {
    cat: "business",
    items: [ "💰", "📈", "🚀", "💡", "🎯", "📱", "💻", "🏦", "🪙", "💳", "📊", "🏗️", "🌐", "🛡️", "⭐", "🏆", "🎓", "📚", "🤝🏿", "💼" ]
  } ], o = [ {
    id: "kente-01",
    name: "Kente Gold",
    colors: [ "#D4AF37", "#C41E3A", "#006B3C", "#000" ],
    generate: function(t, e) {
      var o = document.createElement("canvas");
      o.width = 80, o.height = 80;
      var n = o.getContext("2d");
      return n.fillStyle = "#D4AF37", n.fillRect(0, 0, 80, 80), n.fillStyle = "#C41E3A",
      n.fillRect(0, 0, 20, 80), n.fillRect(40, 0, 20, 80), n.fillStyle = "#006B3C", n.fillRect(20, 0, 20, 40),
      n.fillRect(60, 40, 20, 40), n.fillStyle = "#000", n.fillRect(0, 20, 80, 4), n.fillRect(0, 56, 80, 4),
      o.toDataURL();
    }
  }, {
    id: "kente-02",
    name: "Kente Royal",
    colors: [ "#1B1464", "#D4AF37", "#C41E3A", "#fff" ],
    generate: function() {
      var t = document.createElement("canvas");
      t.width = 60, t.height = 60;
      var e = t.getContext("2d");
      return e.fillStyle = "#1B1464", e.fillRect(0, 0, 60, 60), e.fillStyle = "#D4AF37",
      e.fillRect(0, 0, 30, 30), e.fillRect(30, 30, 30, 30), e.strokeStyle = "#C41E3A",
      e.lineWidth = 3, e.strokeRect(5, 5, 20, 20), e.strokeRect(35, 35, 20, 20), e.fillStyle = "#fff",
      e.fillRect(12, 12, 6, 6), e.fillRect(42, 42, 6, 6), t.toDataURL();
    }
  }, {
    id: "ankara-01",
    name: "Ankara Circles",
    colors: [ "#FF6B00", "#FFCC00", "#006B3C", "#C41E3A" ],
    generate: function() {
      var t = document.createElement("canvas");
      t.width = 100, t.height = 100;
      var e = t.getContext("2d");
      return e.fillStyle = "#FF6B00", e.fillRect(0, 0, 100, 100), e.fillStyle = "#FFCC00",
      e.beginPath(), e.arc(50, 50, 30, 0, 2 * Math.PI), e.fill(), e.fillStyle = "#006B3C",
      e.beginPath(), e.arc(50, 50, 18, 0, 2 * Math.PI), e.fill(), e.fillStyle = "#C41E3A",
      e.beginPath(), e.arc(50, 50, 8, 0, 2 * Math.PI), e.fill(), e.fillStyle = "#FFCC00",
      e.beginPath(), e.arc(0, 0, 15, 0, 2 * Math.PI), e.fill(), e.beginPath(), e.arc(100, 0, 15, 0, 2 * Math.PI),
      e.fill(), e.beginPath(), e.arc(0, 100, 15, 0, 2 * Math.PI), e.fill(), e.beginPath(),
      e.arc(100, 100, 15, 0, 2 * Math.PI), e.fill(), t.toDataURL();
    }
  }, {
    id: "ankara-02",
    name: "Ankara Waves",
    colors: [ "#E8173F", "#1B1464", "#D4AF37", "#fff" ],
    generate: function() {
      var t = document.createElement("canvas");
      t.width = 80, t.height = 80;
      var e = t.getContext("2d");
      e.fillStyle = "#E8173F", e.fillRect(0, 0, 80, 80), e.strokeStyle = "#D4AF37", e.lineWidth = 4;
      for (var o = 0; o < 3; o++) {
        e.beginPath(), e.moveTo(0, 15 + 25 * o), e.bezierCurveTo(20, 5 + 25 * o, 60, 25 + 25 * o, 80, 15 + 25 * o),
        e.stroke();
      }
      e.strokeStyle = "#1B1464", e.lineWidth = 2;
      for (var n = 0; n < 4; n++) {
        e.beginPath(), e.arc(20 + 20 * n, 40, 6, 0, 2 * Math.PI), e.stroke();
      }
      return t.toDataURL();
    }
  }, {
    id: "mudcloth-01",
    name: "Mudcloth",
    colors: [ "#3D2B1F", "#F5E6C8", "#8B7355", "#000" ],
    generate: function() {
      var t = document.createElement("canvas");
      t.width = 60, t.height = 60;
      var e = t.getContext("2d");
      return e.fillStyle = "#3D2B1F", e.fillRect(0, 0, 60, 60), e.strokeStyle = "#F5E6C8",
      e.lineWidth = 2, e.beginPath(), e.moveTo(10, 0), e.lineTo(10, 60), e.stroke(), e.beginPath(),
      e.moveTo(30, 0), e.lineTo(30, 60), e.stroke(), e.beginPath(), e.moveTo(50, 0), e.lineTo(50, 60),
      e.stroke(), e.beginPath(), e.moveTo(0, 10), e.lineTo(60, 10), e.stroke(), e.beginPath(),
      e.moveTo(0, 30), e.lineTo(60, 30), e.stroke(), e.beginPath(), e.moveTo(0, 50), e.lineTo(60, 50),
      e.stroke(), e.fillStyle = "#F5E6C8", [ 10, 30, 50 ].forEach(function(t) {
        [ 10, 30, 50 ].forEach(function(o) {
          e.beginPath(), e.arc(t, o, 3, 0, 2 * Math.PI), e.fill();
        });
      }), t.toDataURL();
    }
  }, {
    id: "adinkra-01",
    name: "Adinkra Symbols",
    colors: [ "#2C1810", "#D4AF37", "#8B4513", "#F5E6C8" ],
    generate: function() {
      var t = document.createElement("canvas");
      t.width = 80, t.height = 80;
      var e = t.getContext("2d");
      return e.fillStyle = "#2C1810", e.fillRect(0, 0, 80, 80), e.strokeStyle = "#D4AF37",
      e.lineWidth = 2, e.beginPath(), e.arc(40, 40, 20, 0, 1.5 * Math.PI), e.stroke(),
      e.beginPath(), e.arc(40, 40, 12, .5 * Math.PI, 2 * Math.PI), e.stroke(), e.fillStyle = "#D4AF37",
      e.beginPath(), e.arc(40, 20, 4, 0, 2 * Math.PI), e.fill(), e.fillStyle = "#8B4513",
      [ [ 10, 10 ], [ 70, 10 ], [ 10, 70 ], [ 70, 70 ] ].forEach(function(t) {
        e.save(), e.translate(t[0], t[1]), e.rotate(Math.PI / 4), e.fillRect(-5, -5, 10, 10),
        e.restore();
      }), t.toDataURL();
    }
  }, {
    id: "ndebele-01",
    name: "Ndebele",
    colors: [ "#fff", "#0062CC", "#FF3B30", "#FFCC00", "#000" ],
    generate: function() {
      var t = document.createElement("canvas");
      t.width = 80, t.height = 80;
      var e = t.getContext("2d");
      return e.fillStyle = "#fff", e.fillRect(0, 0, 80, 80), e.strokeStyle = "#000", e.lineWidth = 3,
      e.strokeRect(10, 10, 60, 60), e.strokeRect(20, 20, 40, 40), e.fillStyle = "#0062CC",
      e.fillRect(10, 10, 60, 15), e.fillStyle = "#FF3B30", e.fillRect(10, 55, 60, 15),
      e.fillStyle = "#FFCC00", e.fillRect(10, 25, 15, 30), e.fillStyle = "#34C759", e.fillRect(55, 25, 15, 30),
      t.toDataURL();
    }
  }, {
    id: "shweshwe-01",
    name: "Shweshwe",
    colors: [ "#1B4D8E", "#fff", "#87CEEB", "#003366" ],
    generate: function() {
      var t = document.createElement("canvas");
      t.width = 60, t.height = 60;
      var e = t.getContext("2d");
      e.fillStyle = "#1B4D8E", e.fillRect(0, 0, 60, 60), e.fillStyle = "#fff";
      for (var o = 0; o < 3; o++) {
        for (var n = 0; n < 3; n++) {
          e.beginPath(), e.arc(10 + 20 * o, 10 + 20 * n, 4, 0, 2 * Math.PI), e.fill();
        }
      }
      return e.strokeStyle = "rgba(255,255,255,.3)", e.lineWidth = 1, e.beginPath(), e.moveTo(0, 0),
      e.lineTo(60, 60), e.stroke(), e.beginPath(), e.moveTo(60, 0), e.lineTo(0, 60), e.stroke(),
      t.toDataURL();
    }
  } ], n = [ {
    name: "Kente",
    colors: [ "#D4AF37", "#C41E3A", "#006B3C", "#1B1464", "#FF6B00" ]
  }, {
    name: "Sahel",
    colors: [ "#E8A317", "#8B4513", "#DAA520", "#CD853F", "#F5E6C8" ]
  }, {
    name: "Savanna",
    colors: [ "#C19A6B", "#8B7355", "#556B2F", "#DAA520", "#2F4F4F" ]
  }, {
    name: "Lagos Nights",
    colors: [ "#0A1628", "#FF3B30", "#FFD60A", "#E066FF", "#00FFD4" ]
  }, {
    name: "Nairobi",
    colors: [ "#006B3C", "#C41E3A", "#000", "#fff", "#D4AF37" ]
  }, {
    name: "Marrakech",
    colors: [ "#C25A1F", "#1B4D8E", "#D4AF37", "#006B3C", "#F5E6C8" ]
  }, {
    name: "Addis",
    colors: [ "#009739", "#FCDD09", "#E8173F", "#0F47AF", "#fff" ]
  }, {
    name: "Cape Town",
    colors: [ "#0062CC", "#FF6B3B", "#34C759", "#FFD60A", "#fff" ]
  } ], i = [ {
    id: "reaction-01",
    name: "Big Reaction",
    category: "reaction",
    colors: [ "#FF3B30", "#FF6B3B" ],
    layers: [ {
      type: "text",
      content: "I TRIED THIS...",
      x: 60,
      y: 80,
      fontSize: 96,
      fontFamily: "Impact, sans-serif",
      fontWeight: 900,
      color: "#fff",
      outline: !0,
      outlineWidth: 4,
      outlineColor: "#000",
      shadow: !0,
      shadowOffset: 4,
      shadowColor: "rgba(0,0,0,.5)",
      uppercase: !0,
      maxWidth: 700,
      textAlign: "left"
    }, {
      type: "text",
      content: "NEVER AGAIN",
      x: 60,
      y: 380,
      fontSize: 72,
      fontFamily: "Impact, sans-serif",
      fontWeight: 900,
      color: "#FFCC00",
      outline: !0,
      outlineWidth: 3,
      outlineColor: "#000",
      uppercase: !0,
      maxWidth: 500,
      textAlign: "left"
    }, {
      type: "emoji",
      content: "😱",
      x: 1100,
      y: 560,
      size: 100
    } ],
    bg: {
      type: "gradient",
      colors: [ "#FF3B30", "#FF6B3B" ],
      angle: 135
    }
  }, {
    id: "beforeafter-01",
    name: "Before & After",
    category: "beforeafter",
    colors: [ "#E53E3E", "#38A169" ],
    layers: [ {
      type: "shape",
      shape: "rect",
      x: 0,
      y: 0,
      w: 640,
      h: 720,
      fill: "#E53E3E"
    }, {
      type: "shape",
      shape: "rect",
      x: 640,
      y: 0,
      w: 640,
      h: 720,
      fill: "#38A169"
    }, {
      type: "text",
      content: "BEFORE",
      x: 140,
      y: 300,
      fontSize: 64,
      fontFamily: "Impact, sans-serif",
      fontWeight: 900,
      color: "#fff",
      outline: !0,
      outlineWidth: 3,
      outlineColor: "#000",
      uppercase: !0,
      maxWidth: 400,
      textAlign: "center"
    }, {
      type: "text",
      content: "AFTER",
      x: 780,
      y: 300,
      fontSize: 64,
      fontFamily: "Impact, sans-serif",
      fontWeight: 900,
      color: "#fff",
      outline: !0,
      outlineWidth: 3,
      outlineColor: "#000",
      uppercase: !0,
      maxWidth: 400,
      textAlign: "center"
    }, {
      type: "text",
      content: "VS",
      x: 570,
      y: 280,
      fontSize: 80,
      fontFamily: '"Bebas Neue", sans-serif',
      fontWeight: 400,
      color: "#FFD60A",
      outline: !0,
      outlineWidth: 4,
      outlineColor: "#000",
      maxWidth: 140,
      textAlign: "center"
    } ],
    bg: {
      type: "solid",
      color: "#1C1C1E"
    }
  }, {
    id: "tutorial-01",
    name: "Step Tutorial",
    category: "tutorial",
    colors: [ "#0062CC", "#5856D6" ],
    layers: [ {
      type: "text",
      content: "HOW TO",
      x: 60,
      y: 60,
      fontSize: 48,
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 800,
      color: "rgba(255,255,255,.5)",
      uppercase: !0,
      maxWidth: 600,
      textAlign: "left"
    }, {
      type: "text",
      content: "Edit Videos Like a Pro",
      x: 60,
      y: 140,
      fontSize: 72,
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 900,
      color: "#fff",
      outline: !1,
      maxWidth: 700,
      textAlign: "left"
    }, {
      type: "text",
      content: "Step-by-Step Guide",
      x: 60,
      y: 560,
      fontSize: 36,
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 700,
      color: "#FFD60A",
      maxWidth: 500,
      textAlign: "left"
    }, {
      type: "shape",
      shape: "rect",
      x: 60,
      y: 520,
      w: 300,
      h: 4,
      fill: "#FFD60A"
    } ],
    bg: {
      type: "gradient",
      colors: [ "#0062CC", "#5856D6" ],
      angle: 135
    }
  }, {
    id: "vlog-01",
    name: "Casual Vlog",
    category: "vlog",
    colors: [ "#FF9500", "#FFD60A" ],
    layers: [ {
      type: "text",
      content: "A Day in Lagos",
      x: 60,
      y: 200,
      fontSize: 84,
      fontFamily: '"Bebas Neue", sans-serif',
      fontWeight: 400,
      color: "#fff",
      outline: !0,
      outlineWidth: 3,
      outlineColor: "#000",
      shadow: !0,
      shadowOffset: 3,
      shadowColor: "rgba(0,0,0,.5)",
      uppercase: !0,
      maxWidth: 700,
      textAlign: "left"
    }, {
      type: "text",
      content: "VLOG #42",
      x: 60,
      y: 100,
      fontSize: 32,
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 800,
      color: "#FFD60A",
      outline: !0,
      outlineWidth: 2,
      outlineColor: "#000",
      uppercase: !0,
      maxWidth: 300,
      textAlign: "left"
    }, {
      type: "text",
      content: "📍 Victoria Island",
      x: 60,
      y: 600,
      fontSize: 28,
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 700,
      color: "rgba(255,255,255,.8)",
      maxWidth: 400,
      textAlign: "left"
    } ],
    bg: {
      type: "gradient",
      colors: [ "#FF9500", "#FFD60A" ],
      angle: 135
    }
  }, {
    id: "podcast-01",
    name: "Podcast Episode",
    category: "podcast",
    colors: [ "#5856D6", "#AF52DE" ],
    layers: [ {
      type: "shape",
      shape: "circle",
      x: 440,
      y: 110,
      w: 400,
      h: 400,
      fill: "rgba(255,255,255,.1)"
    }, {
      type: "text",
      content: "THE CULTURE TALK",
      x: 60,
      y: 80,
      fontSize: 28,
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 800,
      color: "rgba(255,255,255,.5)",
      uppercase: !0,
      maxWidth: 600,
      textAlign: "left"
    }, {
      type: "text",
      content: "Why African Music Is Taking Over",
      x: 60,
      y: 200,
      fontSize: 56,
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 900,
      color: "#fff",
      maxWidth: 600,
      textAlign: "left"
    }, {
      type: "text",
      content: "EP. 24",
      x: 60,
      y: 580,
      fontSize: 40,
      fontFamily: '"Bebas Neue", sans-serif',
      fontWeight: 400,
      color: "#FFD60A",
      maxWidth: 200,
      textAlign: "left"
    }, {
      type: "emoji",
      content: "🎙️",
      x: 180,
      y: 560,
      size: 48
    } ],
    bg: {
      type: "gradient",
      colors: [ "#5856D6", "#AF52DE" ],
      angle: 135
    }
  }, {
    id: "gaming-01",
    name: "Gaming Highlight",
    category: "gaming",
    colors: [ "#0f0f0f", "#FF2D55" ],
    layers: [ {
      type: "text",
      content: "INSANE CLUTCH",
      x: 60,
      y: 120,
      fontSize: 96,
      fontFamily: '"Anton", sans-serif',
      fontWeight: 400,
      color: "#FF2D55",
      outline: !0,
      outlineWidth: 3,
      outlineColor: "#000",
      shadow: !0,
      shadowOffset: 5,
      shadowColor: "rgba(255,45,85,.3)",
      uppercase: !0,
      maxWidth: 800,
      textAlign: "left"
    }, {
      type: "text",
      content: "1v4 WIN!!",
      x: 60,
      y: 400,
      fontSize: 72,
      fontFamily: '"Bebas Neue", sans-serif',
      fontWeight: 400,
      color: "#fff",
      outline: !0,
      outlineWidth: 3,
      outlineColor: "#000",
      uppercase: !0,
      maxWidth: 500,
      textAlign: "left"
    }, {
      type: "emoji",
      content: "🔥",
      x: 1100,
      y: 50,
      size: 90
    }, {
      type: "emoji",
      content: "⚡",
      x: 1050,
      y: 580,
      size: 80
    } ],
    bg: {
      type: "gradient",
      colors: [ "#0f0f0f", "#FF2D55" ],
      angle: 135
    }
  }, {
    id: "listicle-01",
    name: "Top List",
    category: "listicle",
    colors: [ "#34C759", "#30D158" ],
    layers: [ {
      type: "text",
      content: "7",
      x: 60,
      y: 40,
      fontSize: 280,
      fontFamily: '"Bebas Neue", sans-serif',
      fontWeight: 400,
      color: "rgba(255,255,255,.15)",
      maxWidth: 300,
      textAlign: "left"
    }, {
      type: "text",
      content: "7 THINGS YOU MUST KNOW",
      x: 60,
      y: 280,
      fontSize: 64,
      fontFamily: "Impact, sans-serif",
      fontWeight: 900,
      color: "#fff",
      outline: !0,
      outlineWidth: 3,
      outlineColor: "#000",
      uppercase: !0,
      maxWidth: 800,
      textAlign: "left"
    }, {
      type: "text",
      content: "Before Moving to Africa",
      x: 60,
      y: 520,
      fontSize: 40,
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 700,
      color: "#FFD60A",
      maxWidth: 600,
      textAlign: "left"
    } ],
    bg: {
      type: "gradient",
      colors: [ "#34C759", "#30D158" ],
      angle: 135
    }
  }, {
    id: "drama-01",
    name: "Storytime",
    category: "drama",
    colors: [ "#1C1C1E", "#3A3A3C" ],
    layers: [ {
      type: "text",
      content: "I Can't Believe This Happened...",
      x: 60,
      y: 180,
      fontSize: 72,
      fontFamily: "Impact, sans-serif",
      fontWeight: 900,
      color: "#fff",
      outline: !0,
      outlineWidth: 4,
      outlineColor: "#000",
      shadow: !0,
      shadowOffset: 5,
      shadowColor: "rgba(0,0,0,.7)",
      uppercase: !0,
      maxWidth: 900,
      textAlign: "left"
    }, {
      type: "emoji",
      content: "❓",
      x: 1080,
      y: 50,
      size: 100
    }, {
      type: "emoji",
      content: "❓",
      x: 1e3,
      y: 550,
      size: 80
    }, {
      type: "emoji",
      content: "😱",
      x: 60,
      y: 550,
      size: 90
    } ],
    bg: {
      type: "gradient",
      colors: [ "#1C1C1E", "#3A3A3C" ],
      angle: 135
    }
  }, {
    id: "review-01",
    name: "Product Review",
    category: "review",
    colors: [ "#0D47A1", "#42A5F5" ],
    layers: [ {
      type: "text",
      content: "HONEST REVIEW",
      x: 60,
      y: 60,
      fontSize: 36,
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 800,
      color: "#FFD60A",
      uppercase: !0,
      maxWidth: 400,
      textAlign: "left"
    }, {
      type: "text",
      content: "Is It Worth the Money?",
      x: 60,
      y: 200,
      fontSize: 68,
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 900,
      color: "#fff",
      maxWidth: 700,
      textAlign: "left"
    }, {
      type: "text",
      content: "⭐⭐⭐⭐☆",
      x: 60,
      y: 560,
      fontSize: 48,
      fontFamily: "serif",
      maxWidth: 400,
      textAlign: "left"
    }, {
      type: "shape",
      shape: "rect",
      x: 900,
      y: 120,
      w: 320,
      h: 480,
      fill: "rgba(255,255,255,.08)"
    } ],
    bg: {
      type: "gradient",
      colors: [ "#0D47A1", "#42A5F5" ],
      angle: 135
    }
  }, {
    id: "afro-kente-01",
    name: "Kente Vibes",
    category: "afro",
    colors: [ "#D4AF37", "#C41E3A" ],
    layers: [ {
      type: "text",
      content: "AFRICAN EXCELLENCE",
      x: 60,
      y: 100,
      fontSize: 88,
      fontFamily: '"Anton", sans-serif',
      fontWeight: 400,
      color: "#D4AF37",
      outline: !0,
      outlineWidth: 4,
      outlineColor: "#000",
      shadow: !0,
      shadowOffset: 4,
      shadowColor: "rgba(0,0,0,.7)",
      uppercase: !0,
      maxWidth: 800,
      textAlign: "left"
    }, {
      type: "text",
      content: "The Culture Never Sleeps",
      x: 60,
      y: 420,
      fontSize: 48,
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 700,
      color: "#fff",
      maxWidth: 700,
      textAlign: "left"
    }, {
      type: "shape",
      shape: "rect",
      x: 60,
      y: 380,
      w: 200,
      h: 4,
      fill: "#D4AF37"
    }, {
      type: "emoji",
      content: "👑",
      x: 1100,
      y: 80,
      size: 90
    } ],
    bg: {
      type: "gradient",
      colors: [ "#1B1464", "#2C1810" ],
      angle: 135
    }
  }, {
    id: "afro-naija-01",
    name: "Naija Energy",
    category: "afro",
    colors: [ "#006B3C", "#fff" ],
    layers: [ {
      type: "shape",
      shape: "rect",
      x: 0,
      y: 0,
      w: 1280,
      h: 240,
      fill: "#006B3C"
    }, {
      type: "shape",
      shape: "rect",
      x: 0,
      y: 240,
      w: 1280,
      h: 240,
      fill: "#FFFFFF"
    }, {
      type: "shape",
      shape: "rect",
      x: 0,
      y: 480,
      w: 1280,
      h: 240,
      fill: "#006B3C"
    }, {
      type: "text",
      content: "NAIJA",
      x: 60,
      y: 80,
      fontSize: 120,
      fontFamily: "Impact, sans-serif",
      fontWeight: 900,
      color: "#fff",
      outline: !0,
      outlineWidth: 4,
      outlineColor: "rgba(0,0,0,.5)",
      uppercase: !0,
      maxWidth: 600,
      textAlign: "left"
    }, {
      type: "text",
      content: "NO DEY CARRY LAST",
      x: 60,
      y: 300,
      fontSize: 64,
      fontFamily: '"Bebas Neue", sans-serif',
      fontWeight: 400,
      color: "#006B3C",
      outline: !0,
      outlineWidth: 2,
      outlineColor: "rgba(0,0,0,.15)",
      uppercase: !0,
      maxWidth: 700,
      textAlign: "left"
    }, {
      type: "emoji",
      content: "🇳🇬",
      x: 1050,
      y: 50,
      size: 100
    } ],
    bg: {
      type: "solid",
      color: "#006B3C"
    }
  }, {
    id: "afro-jollof-01",
    name: "Jollof Wars",
    category: "afro",
    colors: [ "#FF3B30", "#FF9500" ],
    layers: [ {
      type: "text",
      content: "JOLLOF WARS",
      x: 60,
      y: 80,
      fontSize: 100,
      fontFamily: "Impact, sans-serif",
      fontWeight: 900,
      color: "#FFCC00",
      outline: !0,
      outlineWidth: 5,
      outlineColor: "#8B0000",
      shadow: !0,
      shadowOffset: 5,
      shadowColor: "rgba(0,0,0,.5)",
      uppercase: !0,
      maxWidth: 800,
      textAlign: "left"
    }, {
      type: "text",
      content: "Which Country Makes It Best?",
      x: 60,
      y: 360,
      fontSize: 48,
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 700,
      color: "#fff",
      maxWidth: 700,
      textAlign: "left"
    }, {
      type: "emoji",
      content: "🍲",
      x: 1050,
      y: 500,
      size: 120
    }, {
      type: "emoji",
      content: "🔥",
      x: 1100,
      y: 60,
      size: 80
    }, {
      type: "emoji",
      content: "🇳🇬",
      x: 60,
      y: 560,
      size: 60
    }, {
      type: "emoji",
      content: "🇬🇭",
      x: 160,
      y: 560,
      size: 60
    }, {
      type: "emoji",
      content: "🇸🇳",
      x: 260,
      y: 560,
      size: 60
    } ],
    bg: {
      type: "gradient",
      colors: [ "#FF3B30", "#FF6B3B" ],
      angle: 135
    }
  }, {
    id: "afro-beats-01",
    name: "Afrobeats",
    category: "afro",
    colors: [ "#E066FF", "#FF2D55" ],
    layers: [ {
      type: "text",
      content: "AFROBEATS",
      x: 60,
      y: 60,
      fontSize: 28,
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 800,
      color: "rgba(255,255,255,.5)",
      uppercase: !0,
      maxWidth: 400,
      textAlign: "left"
    }, {
      type: "text",
      content: "New Music Friday",
      x: 60,
      y: 160,
      fontSize: 80,
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 900,
      color: "#fff",
      maxWidth: 700,
      textAlign: "left"
    }, {
      type: "text",
      content: "🎵 Top African Hits This Week",
      x: 60,
      y: 520,
      fontSize: 36,
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 700,
      color: "#FFD60A",
      maxWidth: 600,
      textAlign: "left"
    }, {
      type: "shape",
      shape: "circle",
      x: 900,
      y: 100,
      w: 300,
      h: 300,
      fill: "rgba(255,255,255,.08)"
    }, {
      type: "emoji",
      content: "🎧",
      x: 990,
      y: 180,
      size: 100
    } ],
    bg: {
      type: "gradient",
      colors: [ "#E066FF", "#FF2D55" ],
      angle: 135
    }
  }, {
    id: "afro-safari-01",
    name: "Safari Adventure",
    category: "afro",
    colors: [ "#C19A6B", "#556B2F" ],
    layers: [ {
      type: "text",
      content: "AFRICAN SAFARI",
      x: 60,
      y: 80,
      fontSize: 90,
      fontFamily: '"Anton", sans-serif',
      fontWeight: 400,
      color: "#F5E6C8",
      outline: !0,
      outlineWidth: 3,
      outlineColor: "#3D2B1F",
      shadow: !0,
      shadowOffset: 4,
      shadowColor: "rgba(0,0,0,.6)",
      uppercase: !0,
      maxWidth: 800,
      textAlign: "left"
    }, {
      type: "text",
      content: "The Wild Awaits",
      x: 60,
      y: 400,
      fontSize: 52,
      fontFamily: '"Bebas Neue", sans-serif',
      fontWeight: 400,
      color: "#DAA520",
      maxWidth: 600,
      textAlign: "left"
    }, {
      type: "emoji",
      content: "🦁",
      x: 1050,
      y: 80,
      size: 100
    }, {
      type: "emoji",
      content: "🐘",
      x: 1050,
      y: 500,
      size: 100
    }, {
      type: "shape",
      shape: "rect",
      x: 0,
      y: 620,
      w: 1280,
      h: 100,
      fill: "rgba(61,43,31,.7)"
    } ],
    bg: {
      type: "gradient",
      colors: [ "#C19A6B", "#556B2F" ],
      angle: 180
    }
  }, {
    id: "afro-diaspora-01",
    name: "Diaspora Connect",
    category: "afro",
    colors: [ "#0A1628", "#0062CC" ],
    layers: [ {
      type: "text",
      content: "CONNECTING",
      x: 60,
      y: 80,
      fontSize: 36,
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 800,
      color: "#0062CC",
      uppercase: !0,
      maxWidth: 400,
      textAlign: "left"
    }, {
      type: "text",
      content: "The African Diaspora",
      x: 60,
      y: 180,
      fontSize: 76,
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 900,
      color: "#fff",
      maxWidth: 700,
      textAlign: "left"
    }, {
      type: "text",
      content: "Home Is Where The Heart Is",
      x: 60,
      y: 520,
      fontSize: 36,
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 700,
      color: "rgba(255,255,255,.6)",
      maxWidth: 600,
      textAlign: "left"
    }, {
      type: "emoji",
      content: "🌍",
      x: 1050,
      y: 80,
      size: 120
    }, {
      type: "shape",
      shape: "rect",
      x: 60,
      y: 480,
      w: 160,
      h: 3,
      fill: "#0062CC"
    } ],
    bg: {
      type: "gradient",
      colors: [ "#0A1628", "#1a2a4a" ],
      angle: 135
    }
  }, {
    id: "afro-fashion-01",
    name: "Ankara Fashion",
    category: "afro",
    colors: [ "#C41E3A", "#D4AF37" ],
    layers: [ {
      type: "text",
      content: "FASHION",
      x: 60,
      y: 60,
      fontSize: 28,
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 800,
      color: "#D4AF37",
      uppercase: !0,
      maxWidth: 400,
      textAlign: "left"
    }, {
      type: "text",
      content: "African Print Collection",
      x: 60,
      y: 160,
      fontSize: 72,
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 900,
      color: "#fff",
      maxWidth: 700,
      textAlign: "left"
    }, {
      type: "text",
      content: "Wear Your Culture",
      x: 60,
      y: 540,
      fontSize: 40,
      fontFamily: '"Bebas Neue", sans-serif',
      fontWeight: 400,
      color: "#D4AF37",
      maxWidth: 500,
      textAlign: "left"
    }, {
      type: "shape",
      shape: "rect",
      x: 900,
      y: 0,
      w: 380,
      h: 720,
      fill: "rgba(196,30,58,.3)"
    } ],
    bg: {
      type: "gradient",
      colors: [ "#1C1C1E", "#3A1520" ],
      angle: 135
    }
  }, {
    id: "afro-tech-01",
    name: "AfroTech",
    category: "afro",
    colors: [ "#00FFD4", "#0062CC" ],
    layers: [ {
      type: "text",
      content: "AFROTECH",
      x: 60,
      y: 60,
      fontSize: 32,
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 800,
      color: "#00FFD4",
      uppercase: !0,
      maxWidth: 400,
      textAlign: "left"
    }, {
      type: "text",
      content: "Building Africa's Digital Future",
      x: 60,
      y: 180,
      fontSize: 68,
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 900,
      color: "#fff",
      maxWidth: 700,
      textAlign: "left"
    }, {
      type: "text",
      content: "Innovation × Culture",
      x: 60,
      y: 540,
      fontSize: 36,
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 700,
      color: "rgba(0,255,212,.7)",
      maxWidth: 500,
      textAlign: "left"
    }, {
      type: "emoji",
      content: "🚀",
      x: 1080,
      y: 80,
      size: 100
    }, {
      type: "shape",
      shape: "rect",
      x: 60,
      y: 500,
      w: 140,
      h: 3,
      fill: "#00FFD4"
    } ],
    bg: {
      type: "gradient",
      colors: [ "#0A1628", "#0f2a3a" ],
      angle: 135
    }
  }, {
    id: "afro-street-01",
    name: "Street Style",
    category: "afro",
    colors: [ "#FFD60A", "#FF3B30" ],
    layers: [ {
      type: "text",
      content: "STREET",
      x: 60,
      y: 60,
      fontSize: 140,
      fontFamily: "Impact, sans-serif",
      fontWeight: 900,
      color: "#FFD60A",
      outline: !0,
      outlineWidth: 5,
      outlineColor: "#000",
      uppercase: !0,
      maxWidth: 700,
      textAlign: "left"
    }, {
      type: "text",
      content: "CULTURE",
      x: 60,
      y: 240,
      fontSize: 140,
      fontFamily: "Impact, sans-serif",
      fontWeight: 900,
      color: "#FF3B30",
      outline: !0,
      outlineWidth: 5,
      outlineColor: "#000",
      uppercase: !0,
      maxWidth: 700,
      textAlign: "left"
    }, {
      type: "text",
      content: "Lagos × Accra × Nairobi",
      x: 60,
      y: 560,
      fontSize: 32,
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 700,
      color: "rgba(255,255,255,.6)",
      maxWidth: 600,
      textAlign: "left"
    }, {
      type: "emoji",
      content: "✊🏿",
      x: 1080,
      y: 80,
      size: 90
    } ],
    bg: {
      type: "gradient",
      colors: [ "#1C1C1E", "#2a2a2e" ],
      angle: 135
    }
  }, {
    id: "afro-food-01",
    name: "African Kitchen",
    category: "afro",
    colors: [ "#FF6B00", "#C41E3A" ],
    layers: [ {
      type: "text",
      content: "COOK WITH ME",
      x: 60,
      y: 60,
      fontSize: 32,
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 800,
      color: "#FFCC00",
      uppercase: !0,
      maxWidth: 500,
      textAlign: "left"
    }, {
      type: "text",
      content: "Nigerian Jollof Recipe",
      x: 60,
      y: 180,
      fontSize: 72,
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 900,
      color: "#fff",
      maxWidth: 700,
      textAlign: "left"
    }, {
      type: "text",
      content: "Easy 30-Minute Meal",
      x: 60,
      y: 540,
      fontSize: 36,
      fontFamily: '"DM Sans", sans-serif',
      fontWeight: 700,
      color: "#fff",
      maxWidth: 500,
      textAlign: "left"
    }, {
      type: "emoji",
      content: "🍲",
      x: 1020,
      y: 400,
      size: 140
    }, {
      type: "shape",
      shape: "rect",
      x: 60,
      y: 500,
      w: 120,
      h: 3,
      fill: "#FFCC00"
    } ],
    bg: {
      type: "gradient",
      colors: [ "#FF6B00", "#C41E3A" ],
      angle: 135
    }
  }, {
    id: "blank-01",
    name: "Blank Canvas",
    category: "blank",
    colors: [ "#FFFFFF", "#F5F5F5" ],
    layers: [],
    bg: {
      type: "solid",
      color: "#FFFFFF"
    }
  } ], a = [], r = {
    type: "solid",
    color: "#FF3B30",
    overlay: 0
  }, l = [], f = -1, s = 0, c = "yt-thumb", y = "ct_projects", g = "ct_current_project";
  function h() {
    try {
      return JSON.parse(localStorage.getItem(y)) || [];
    } catch (t) {
      return [];
    }
  }
  function u(t) {
    try {
      localStorage.setItem(y, JSON.stringify(t));
    } catch (t) {}
  }
  var d = {
    init: function() {
      a = [], r = {
        type: "solid",
        color: "#FF3B30",
        overlay: 0
      }, l = [], f = -1, s = 0, c = "yt-thumb";
    },
    addLayer: function(t) {
      var e = "layer_" + ++s;
      return t.id = e, t.z = a.length + 1, a.push(t), e;
    },
    removeLayer: function(t) {
      a = a.filter(function(e) {
        return e.id !== t;
      });
    },
    updateLayer: function(t, e) {
      var o = a.find(function(e) {
        return e.id === t;
      });
      o && Object.keys(e).forEach(function(t) {
        o[t] = e[t];
      });
    },
    getLayer: function(t) {
      return a.find(function(e) {
        return e.id === t;
      }) || null;
    },
    getLayers: function() {
      return a.slice().sort(function(t, e) {
        return (t.z || 0) - (e.z || 0);
      });
    },
    moveLayer: function(t, e) {
      var o = a.slice().sort(function(t, e) {
        return (t.z || 0) - (e.z || 0);
      }), n = o.findIndex(function(e) {
        return e.id === t;
      });
      if (!(n < 0)) {
        if ("up" === e && n < o.length - 1) {
          var i = o[n].z;
          o[n].z = o[n + 1].z, o[n + 1].z = i;
        } else if ("down" === e && n > 0) {
          var r = o[n].z;
          o[n].z = o[n - 1].z, o[n - 1].z = r;
        }
      }
    },
    setBackground: function(t) {
      Object.keys(t).forEach(function(e) {
        r[e] = t[e];
      });
    },
    getBackground: function() {
      return Object.assign({}, r);
    },
    getTemplates: function() {
      return i;
    },
    loadTemplate: function(t) {
      var e = i.find(function(e) {
        return e.id === t;
      });
      e && (a = [], s = 0, r = Object.assign({}, e.bg), e.layers.forEach(function(t) {
        var e = Object.assign({}, t);
        e.id = "layer_" + ++s, e.z = a.length + 1, a.push(e);
      }));
    },
    getSizes: function() {
      return t;
    },
    getSize: function() {
      return c;
    },
    getSizeObj: function() {
      return t[c] || t["yt-thumb"];
    },
    setSize: function(e) {
      t[e] && (c = e);
    },
    setCustomSize: function(e, o) {
      t.custom.w = e, t.custom.h = o, c = "custom";
    },
    getAfroStickers: function() {
      return e;
    },
    getAfroPatterns: function() {
      return o;
    },
    getAfroPalettes: function() {
      return n;
    },
    pushHistory: function() {
      (l = l.slice(0, f + 1)).push({
        layers: JSON.parse(JSON.stringify(a)),
        background: JSON.parse(JSON.stringify(r)),
        idCounter: s,
        size: c
      }), f = l.length - 1, l.length > 50 && (l.shift(), f--), this.saveLocal();
    },
    undo: function() {
      if (!(f <= 0)) {
        f--;
        var t = l[f];
        a = JSON.parse(JSON.stringify(t.layers)), r = JSON.parse(JSON.stringify(t.background)),
        s = t.idCounter, t.size && (c = t.size);
      }
    },
    redo: function() {
      if (!(f >= l.length - 1)) {
        f++;
        var t = l[f];
        a = JSON.parse(JSON.stringify(t.layers)), r = JSON.parse(JSON.stringify(t.background)),
        s = t.idCounter, t.size && (c = t.size);
      }
    },
    saveLocal: function() {
      try {
        var t = {
          layers: a,
          background: r,
          idCounter: s,
          size: c,
          updatedAt: (new Date).toISOString()
        };
        localStorage.setItem(g, JSON.stringify(t));
      } catch (t) {}
    },
    loadLocal: function() {
      try {
        var e = localStorage.getItem(g);
        if (!e) {
          return !1;
        }
        var o = JSON.parse(e);
        return a = o.layers || [], r = o.background || {
          type: "solid",
          color: "#FF3B30"
        }, s = o.idCounter || 0, o.size && t[o.size] && (c = o.size), !0;
      } catch (t) {
        return !1;
      }
    },
    saveProject: function(t) {
      var e = h(), o = "proj_" + Date.now(), n = {
        id: o,
        name: t || "Untitled",
        size: c,
        layers: JSON.parse(JSON.stringify(a)),
        background: JSON.parse(JSON.stringify(r)),
        idCounter: s,
        createdAt: (new Date).toISOString(),
        updatedAt: (new Date).toISOString()
      };
      return e.unshift(n), u(e), o;
    },
    updateProject: function(t, e) {
      var o = h(), n = o.find(function(e) {
        return e.id === t;
      });
      return !!n && (n.name = e || n.name, n.size = c, n.layers = JSON.parse(JSON.stringify(a)),
      n.background = JSON.parse(JSON.stringify(r)), n.idCounter = s, n.updatedAt = (new Date).toISOString(),
      u(o), !0);
    },
    loadProject: function(e) {
      var o = h().find(function(t) {
        return t.id === e;
      });
      return !!o && (a = JSON.parse(JSON.stringify(o.layers)), r = JSON.parse(JSON.stringify(o.background)),
      s = o.idCounter || 0, o.size && t[o.size] && (c = o.size), o);
    },
    deleteProject: function(t) {
      u(h().filter(function(e) {
        return e.id !== t;
      }));
    },
    duplicateProject: function(t) {
      var e = h(), o = e.find(function(e) {
        return e.id === t;
      });
      if (!o) {
        return null;
      }
      var n = JSON.parse(JSON.stringify(o));
      return n.id = "proj_" + Date.now(), n.name = o.name + " (Copy)", n.createdAt = (new Date).toISOString(),
      n.updatedAt = (new Date).toISOString(), e.unshift(n), u(e), n.id;
    },
    listProjects: function() {
      return h();
    },
    getState: function() {
      return {
        layers: a,
        background: r,
        idCounter: s,
        size: c
      };
    }
  };
  window.AfroTools = window.AfroTools || {}, window.AfroTools.engines = window.AfroTools.engines || {},
  window.AfroTools.engines.creatorThumb = d;
}();

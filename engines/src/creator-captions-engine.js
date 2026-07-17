!function() {
  "use strict";
  var e = {
    instagram: {
      label: "Instagram",
      icon: "&#128247;",
      maxChars: 2200,
      previewChars: 125,
      hashtagStyle: "separated",
      class: "ig"
    },
    x: {
      label: "X / Twitter",
      icon: "&#120143;",
      maxChars: 280,
      previewChars: 280,
      hashtagStyle: "minimal",
      class: "x"
    },
    linkedin: {
      label: "LinkedIn",
      icon: "&#128188;",
      maxChars: 3e3,
      previewChars: 140,
      hashtagStyle: "end",
      class: "li"
    },
    tiktok: {
      label: "TikTok",
      icon: "&#127925;",
      maxChars: 2200,
      previewChars: 150,
      hashtagStyle: "inline",
      class: "tt"
    },
    facebook: {
      label: "Facebook",
      icon: "&#128077;",
      maxChars: 63206,
      previewChars: 140,
      hashtagStyle: "end",
      class: "fb"
    }
  };
  window.AfroTools = window.AfroTools || {}, window.AfroTools.CaptionCraftEngine = {
    PLATFORMS: e,
    TONES: [ {
      id: "casual",
      label: "Casual"
    }, {
      id: "professional",
      label: "Professional"
    }, {
      id: "bold",
      label: "Bold"
    }, {
      id: "playful",
      label: "Playful"
    }, {
      id: "inspirational",
      label: "Inspirational"
    }, {
      id: "educational",
      label: "Educational"
    } ],
    INCLUDE_OPTIONS: [ {
      id: "cta",
      label: "CTA",
      default: !0
    }, {
      id: "hashtags",
      label: "Hashtags",
      default: !0
    }, {
      id: "emoji",
      label: "Emoji",
      default: !0
    }, {
      id: "question",
      label: "Question at end",
      default: !1
    } ],
    buildPrompt: function(a, t, i, s, r, n) {
      var o = e[a] || e.instagram, l = [];
      switch (r ? (l.push("Rewrite and improve this existing caption for " + o.label + ":"),
      l.push('"' + n + '"'), l.push("Generate 3 improved variations.")) : (l.push("Write 3 caption variations for " + o.label + "."),
      l.push("Topic/brief: " + t)), l.push("Tone: " + (i || "casual")), a) {
       case "instagram":
        l.push("INSTAGRAM RULES: First line is the hook (must work in " + o.previewChars + ' chars before "...more"). Use proper line breaks for readability. Max ' + o.maxChars + " chars."),
        s.hashtags && l.push("Add 10-15 hashtags separated from caption by line breaks."),
        s.cta && l.push('Include a CTA like "Link in bio", "Save this post", or "Share with someone who..."');
        break;

       case "x":
        l.push("X/TWITTER RULES: Hard limit " + o.maxChars + " chars per tweet. Punchy, short sentences. Line breaks for emphasis."),
        l.push("Use hashtags VERY sparingly (0-2 max). If content is too long, split into a numbered thread.");
        break;

       case "linkedin":
        l.push('LINKEDIN RULES: First 2 lines visible before "...see more" — make them count. Short paragraphs (1-2 sentences). Professional tone even when casual.'),
        s.question && l.push("End with an engagement question."), l.push("3-5 hashtags at the very end only.");
        break;

       case "tiktok":
        l.push("TIKTOK RULES: Super short (" + o.previewChars + " chars recommended). Emoji-heavy. Hashtags are crucial for discovery.");
        break;

       case "facebook":
        l.push("FACEBOOK RULES: Longer posts OK (100+ words perform well). Storytelling works. End with a question to drive comments.");
      }
      return s.emoji && l.push("Use emoji strategically — not excessive."), s.question && l.push("End with an engagement question."),
      l.push("\nOUTPUT FORMAT — Return ONLY valid JSON, no markdown fences:"), l.push("{"),
      l.push('  "captions": ['), l.push('    { "variation": 1, "label": "The Reliable One", "text": "...", "charCount": 245, "withinLimit": true, "hashtags": ["#tag1","#tag2"], "cta": "Save this for later", "firstLinePreview": "First 125 chars..." },'),
      l.push('    { "variation": 2, "label": "The Bold One", "text": "...", ... },'),
      l.push('    { "variation": 3, "label": "The Creative One", "text": "...", ... }'),
      l.push("  ],"), l.push('  "platformTip": "A helpful tip about this platform..."'),
      l.push("}"), l.join("\n");
    },
    parseOutput: function(e) {
      try {
        var a = JSON.parse(e);
        if (a.captions && Array.isArray(a.captions)) {
          return a;
        }
      } catch (a) {
        var t = e.match(/\{[\s\S]*\}/);
        if (t) {
          try {
            var i = JSON.parse(t[0]);
            if (i.captions) {
              return i;
            }
          } catch (e) {}
        }
      }
      var s = e.split(/(?:variation|option|#)\s*[123]/i).filter(function(e) {
        return e.trim().length > 20;
      });
      s.length < 3 && (s = [ e ]);
      var r = [ "The Reliable One", "The Bold One", "The Creative One" ];
      return {
        captions: s.slice(0, 3).map(function(e, a) {
          var t = e.trim();
          return {
            variation: a + 1,
            label: r[a] || "Option " + (a + 1),
            text: t,
            charCount: t.length,
            withinLimit: !0,
            hashtags: [],
            cta: "",
            firstLinePreview: t.substring(0, 125)
          };
        }),
        platformTip: ""
      };
    },
    createHistoryEntry: function(e, a, t, i) {
      return {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        platform: e,
        topic: a,
        tone: t,
        captions: i,
        createdAt: Date.now()
      };
    },
    formatTimestamp: function(e) {
      var a = new Date(e), t = new Date - a;
      return t < 6e4 ? "Just now" : t < 36e5 ? Math.floor(t / 6e4) + "m ago" : t < 864e5 ? Math.floor(t / 36e5) + "h ago" : t < 6048e5 ? Math.floor(t / 864e5) + "d ago" : a.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short"
      });
    }
  };
}();

!function() {
  "use strict";
  var e = [ {
    id: "youtube",
    label: "YouTube",
    maxChars: 100,
    recommended: 60
  }, {
    id: "blog",
    label: "Blog",
    maxChars: 70,
    recommended: 60
  }, {
    id: "newsletter",
    label: "Newsletter",
    maxChars: 80,
    recommended: 50
  }, {
    id: "instagram",
    label: "Instagram",
    maxChars: 0,
    recommended: 0
  }, {
    id: "x",
    label: "X",
    maxChars: 280,
    recommended: 100
  }, {
    id: "linkedin",
    label: "LinkedIn",
    maxChars: 150,
    recommended: 100
  } ];
  window.AfroTools = window.AfroTools || {}, window.AfroTools.engines = window.AfroTools.engines || {},
  window.AfroTools.engines.creatorTitles = {
    TITLE_STYLES: [ {
      id: "clickbait",
      label: "THE CLICKBAIT",
      icon: "🔥"
    }, {
      id: "seo",
      label: "THE SEO-OPTIMIZED",
      icon: "📊"
    }, {
      id: "storyteller",
      label: "THE STORYTELLER",
      icon: "📚"
    }, {
      id: "listicle",
      label: "THE LISTICLE",
      icon: "🔢"
    }, {
      id: "question",
      label: "THE QUESTION",
      icon: "❓"
    }, {
      id: "bold_claim",
      label: "THE BOLD CLAIM",
      icon: "💥"
    }, {
      id: "howto",
      label: "THE HOW-TO",
      icon: "🛠️"
    }, {
      id: "viral",
      label: "THE VIRAL",
      icon: "⚡"
    } ],
    PLATFORMS: e,
    getCharStatus: function(n, t) {
      var r = e.find(function(e) {
        return e.id === t;
      });
      return r && r.maxChars ? n > r.maxChars ? "over" : r.recommended && n > r.recommended ? "warn" : "ok" : "ok";
    },
    buildPrompt: function(n, t) {
      var r = e.find(function(e) {
        return e.id === t;
      }) || e[0];
      return "Generate 8 title/headline options for this content topic.\n\nTopic: " + n + "\n" + (r.maxChars ? "Platform: " + r.label + " (recommended max " + r.recommended + " chars, hard max " + r.maxChars + " chars)" : "Platform: " + r.label + " (no strict character limit, but first line matters most)") + '\n\nGenerate exactly 8 titles, one per style:\n1. Clickbait — curiosity gap, bold claims, emotional triggers\n2. SEO-Optimized — keywords first, search-friendly, clear intent\n3. Storyteller — personal narrative, journey, transformation\n4. Listicle — numbers, lists, quantified value\n5. Question — provocative question that demands an answer\n6. Bold Claim — controversial, strong opinion, hot take\n7. How-To — practical, clear, actionable\n8. Viral — trend-riding, platform-native, shareable\n\nUse African context naturally when relevant (Lagos, Nairobi, Accra, SA, African creator culture). Never force it.\nVary sentence structure. Make EVERY title genuinely interesting.\nFor YouTube: use brackets like [2026 Guide] or (Watch This) sparingly.\n\nAlso pick the 2 strongest titles and do an A/B comparison explaining which is stronger and why.\n\nReturn ONLY valid JSON, no markdown code fences:\n{"titles":[{"style":"clickbait","title":"...","charCount":58,"whyItWorks":"..."},{"style":"seo","title":"...","charCount":52,"whyItWorks":"..."},...],"abTest":{"titleA":0,"titleB":1,"winner":"A","reason":"..."}}';
    },
    parseResponse: function(e) {
      try {
        var n = e.match(/\{[\s\S]*\}/);
        if (n) {
          return JSON.parse(n[0]);
        }
      } catch (e) {}
      return null;
    },
    createHistoryEntry: function(e, n, t) {
      return {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        topic: e,
        platform: n,
        titles: t || [],
        createdAt: Date.now()
      };
    },
    formatTimestamp: function(e) {
      var n = new Date(e), t = new Date - n;
      return t < 6e4 ? "Just now" : t < 36e5 ? Math.floor(t / 6e4) + "m ago" : t < 864e5 ? Math.floor(t / 36e5) + "h ago" : t < 6048e5 ? Math.floor(t / 864e5) + "d ago" : n.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short"
      });
    }
  };
}();

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
    generateLocal: function(a, t, i, s, r, n) {
      var o = e[a] || e.instagram, l = String(t || "").trim();
      if (!l) {
        return {
          ok: !1,
          error: n === "french" ? "Décrivez d’abord votre publication." : n === "swahili" ? "Eleza chapisho lako kwanza." : "Describe your post first.",
          captions: []
        };
      }
      var c = n === "french", w = n === "swahili", d = String(i || "casual"), u = s || {},
      p = l.replace(/\s+/g, " "), h = p.split(" ").filter(function(e) {
        return e.length > 3;
      }).slice(0, a === "x" ? 2 : 5).map(function(e) {
        return "#" + e.replace(/[^\p{L}\p{N}]/gu, "");
      }).filter(function(e) {
        return e.length > 1;
      }), f = c ? {
        labels: [ "La version claire", "La version audacieuse", "La version narrative" ],
        hooks: [ "Voici l’essentiel :", "Une idée à ne pas ignorer :", "Tout commence par une question simple :" ],
        bodies: [ "Découvrez " + p + ".", p + " mérite toute votre attention.", "Aujourd’hui, nous explorons " + p + "." ],
        ctas: [ "Enregistrez cette publication pour plus tard.", "Partagez-la avec une personne concernée.", "Dites-nous ce que vous en pensez." ],
        question: "Quelle est votre expérience ?",
        tip: "Gardez la première ligne autonome : elle doit rester claire avant le bouton « voir plus »."
      } : w ? {
        labels: [ "Toleo lililo wazi", "Toleo la ujasiri", "Toleo la simulizi" ],
        hooks: [ "Hili ndilo jambo muhimu:", "Wazo moja la kuzingatia:", "Yote huanza na swali rahisi:" ],
        bodies: [ "Mtazamo wa vitendo kuhusu " + p + ".", p + " inastahili kuangaliwa kwa karibu.", "Leo tunaangalia " + p + "." ],
        ctas: [ "Hifadhi chapisho hili kwa baadaye.", "Shiriki na mtu anayelihitaji.", "Tuambie maoni yako." ],
        question: "Uzoefu wako umekuwaje?",
        tip: "Fanya mstari wa kwanza uwe na maana pekee yake ili uendelee kueleweka kabla ya kitufe cha kuona zaidi."
      } : {
        labels: [ "The Clear One", "The Bold One", "The Story One" ],
        hooks: [ "Here is what matters:", "One idea worth your attention:", "It starts with a simple question:" ],
        bodies: [ "A practical look at " + p + ".", p + " deserves a closer look.", "Today, we are exploring " + p + "." ],
        ctas: [ "Save this post for later.", "Share this with someone who needs it.", "Tell us what you think." ],
        question: "What has your experience been?",
        tip: "Make the first line useful on its own so it still works before the platform truncates it."
      }, g = r === "short" ? 0 : r === "long" ? 2 : 1,
      m = [ 0, 1, 2 ].map(function(e) {
        var t = f.hooks[e] + "\n\n" + f.bodies[e];
        return 2 === g && (t += "\n\n" + (c ? "Ajoutez un exemple concret, un résultat ou une leçon afin que le lecteur puisse agir." : w ? "Ongeza mfano halisi, matokeo au somo ili msomaji aweze kuchukua hatua." : "Add a concrete example, result, or lesson so the reader can act.")),
        u.question && (t += "\n\n" + f.question), u.cta && (t += "\n\n" + f.ctas[e]),
        u.emoji && (t = [ "✨ ", "📌 ", "💡 " ][e] + t),
        a === "x" && t.length > o.maxChars && (t = t.slice(0, o.maxChars - 1).trimEnd() + "…"),
        {
          variation: e + 1,
          label: f.labels[e],
          text: t,
          charCount: t.length,
          withinLimit: t.length <= o.maxChars,
          hashtags: u.hashtags ? h : [],
          cta: u.cta ? f.ctas[e] : "",
          firstLinePreview: t.substring(0, o.previewChars)
        };
      });
      return {
        ok: !0,
        mode: "local",
        tone: d,
        language: c ? "french" : w ? "swahili" : n || "english",
        captions: m,
        platformTip: f.tip
      };
    },
    rewriteLocal: function(a, t, i) {
      var s = String(t || "").trim(), r = i === "french", w = i === "swahili";
      if (!s) {
        return {
          ok: !1,
          error: r ? "Collez d’abord une légende à améliorer." : w ? "Bandika caption ya kuboresha kwanza." : "Paste a caption to rewrite.",
          captions: []
        };
      }
      var n = s.replace(/\s+/g, " "), o = e[a] || e.instagram,
      l = r ? [ "À retenir :", "Regard neuf :", "Question du jour :" ] : w ? [ "Jambo la kukumbuka:", "Mtazamo mpya:", "Swali la leo:" ] : [ "Key takeaway:", "A fresh angle:", "Question for today:" ],
      c = r ? [ "Enregistrez cette publication.", "Partagez-la si elle peut aider.", "Qu’en pensez-vous ?" ] : w ? [ "Hifadhi chapisho hili.", "Lishiriki kama linaweza kusaidia.", "Una maoni gani?" ] : [ "Save this post.", "Share it if it helps.", "What do you think?" ],
      d = r ? [ "La version structurée", "La version directe", "La version conversationnelle" ] : w ? [ "Toleo lililopangwa", "Toleo la moja kwa moja", "Toleo la mazungumzo" ] : [ "The Structured One", "The Direct One", "The Conversational One" ],
      u = [ 0, 1, 2 ].map(function(e) {
        var t = l[e] + "\n\n" + n + "\n\n" + c[e];
        return a === "x" && t.length > o.maxChars && (t = t.slice(0, o.maxChars - 1).trimEnd() + "…"),
        {
          variation: e + 1,
          label: d[e],
          text: t,
          charCount: t.length,
          withinLimit: t.length <= o.maxChars,
          hashtags: [],
          cta: c[e],
          firstLinePreview: t.substring(0, o.previewChars)
        };
      });
      return {
        ok: !0,
        mode: "local",
        language: r ? "french" : w ? "swahili" : "english",
        captions: u,
        platformTip: r ? "Relisez chaque proposition et conservez uniquement les faits que vous pouvez vérifier." : w ? "Soma kila pendekezo tena na uhifadhi madai unayoweza kuthibitisha pekee." : "Review each option and keep only claims you can verify."
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
    formatTimestamp: function(e, i) {
      var a = new Date(e), t = new Date - a, s = i === "swahili", r = i === "french";
      return t < 6e4 ? s ? "Sasa hivi" : r ? "À l’instant" : "Just now" : t < 36e5 ? Math.floor(t / 6e4) + (s ? " dk zilizopita" : r ? " min" : "m ago") : t < 864e5 ? Math.floor(t / 36e5) + (s ? " saa zilizopita" : r ? " h" : "h ago") : t < 6048e5 ? Math.floor(t / 864e5) + (s ? " siku zilizopita" : r ? " j" : "d ago") : a.toLocaleDateString(s ? "sw-TZ" : r ? "fr-FR" : "en-GB", {
        day: "numeric",
        month: "short"
      });
    }
  };
}();

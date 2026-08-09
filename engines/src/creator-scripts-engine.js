!function() {
  "use strict";
  var t = {
    "3-5 min": {
      min: 600,
      max: 1100
    },
    "5-8 min": {
      min: 1100,
      max: 1800
    },
    "8-12 min": {
      min: 1800,
      max: 2700
    },
    "12-20 min": {
      min: 2700,
      max: 4500
    }
  };
  window.AfroTools = window.AfroTools || {}, window.AfroTools.CreatorScriptsEngine = {
    SCRIPT_FORMATS: {
      youtube: {
        label: "YouTube Standard",
        icon: "🎬",
        desc: "Hook → Intro → Points → CTA → Outro"
      },
      podcast: {
        label: "Podcast / Audio",
        icon: "🎧",
        desc: "Cold open → Welcome → Discussion → Takeaways"
      },
      voiceover: {
        label: "Voiceover / Narration",
        icon: "🎙️",
        desc: "Clean narration with pause markers"
      },
      educational: {
        label: "Educational / Tutorial",
        icon: "🎓",
        desc: "Objective → Steps → Recap"
      },
      storytime: {
        label: "Storytime",
        icon: "📚",
        desc: "Setup → Rising action → Climax → Lesson"
      }
    },
    DURATION_OPTIONS: [ "3-5 min", "5-8 min", "8-12 min", "12-20 min" ],
    PLATFORM_OPTIONS: [ "YouTube", "TikTok", "Instagram Reels", "Podcast", "Course / LMS" ],
    generateLocalScript: function(input, language) {
      var source = input || {};
      var topic = String(source.topic || "").trim();
      var points = String(source.keyPoints || "").split(/\r?\n|,/).map(function(point) {
        return point.trim();
      }).filter(Boolean).slice(0, 5);
      if (!topic) throw new Error("A topic is required.");
      if (!points.length) throw new Error("Add at least one key point.");
      var fr = language === "fr";
      var sw = language === "sw";
      var sections = [
        {type: "hook", label: fr ? "ACCROCHE" : sw ? "KIVUTIO" : "HOOK", timestamp: "0:00–0:15", text: fr ? "Voici ce qu’il faut comprendre sur " + topic + "." : sw ? "Hili ndilo jambo la kuelewa kuhusu " + topic + "." : "Here is what you need to understand about " + topic + "."},
        {type: "context", label: fr ? "CONTEXTE" : sw ? "MUKTADHA" : "CONTEXT", timestamp: "0:15–0:40", text: fr ? "Commençons par le contexte, les hypothèses et les limites." : sw ? "Anza na muktadha, makisio na mipaka ya mada." : "Start with the context, assumptions, and limits."},
        {type: "main", label: fr ? "POINTS CLÉS" : sw ? "HOJA KUU" : "KEY POINTS", timestamp: "0:40–2:30", text: points.map(function(point, index) { return (index + 1) + ". " + point; }).join("\n")},
        {type: "cta", label: fr ? "CONCLUSION" : sw ? "HITIMISHO" : "CLOSE", timestamp: "2:30–2:45", text: fr ? "Vérifiez les faits, ajoutez vos sources et adaptez ce brouillon à votre public." : sw ? "Hakiki ukweli, ongeza vyanzo na urekebishe rasimu hii kwa hadhira yako." : "Verify the facts, add your sources, and adapt this draft for your audience."}
      ];
      var full = sections.map(function(section) { return section.text; }).join("\n\n");
      return {
        title: topic,
        format: source.format || "youtube",
        language: fr ? "fr" : sw ? "sw" : "en",
        sections: sections,
        fullScript: full,
        wordCount: this.countWords(full),
        estimatedDuration: this.estimateDuration(this.countWords(full))
      };
    },
    DURATION_WORD_MAP: t,
    buildGeneratePrompt: function(e) {
      var n = [];
      n.push("You are ScriptPad, a video script writing expert for African content creators."),
      n.push(""), n.push("RULES:"), n.push("- Generate a COMPLETE script, not an outline. Write every word the creator will say."),
      n.push("- Structure with clear sections, each with a timestamp estimate."), n.push("- Match the requested format: " + (e.format || "youtube"));
      var o = t[e.duration] || t["5-8 min"];
      return n.push("- Target duration: " + (e.duration || "5-8 min") + " (" + o.min + "-" + o.max + " words)"),
      n.push("- Include B-roll/visual suggestions in each section."), n.push("- Include transition phrases between sections."),
      n.push("- Write in SPOKEN language, not written. Short sentences. Contractions. Natural flow."),
      n.push("- African context where relevant — don't force it, but let it be natural."),
      n.push("- Hook must be compelling."), n.push("- CTA must be specific and natural."),
      n.push("- Include delivery notes: [PAUSE], [EMPHASIS], [SHOW SCREEN], [CUT TO B-ROLL]"),
      n.push(""), n.push("VIDEO TOPIC: " + (e.topic || "Untitled")), e.platform && n.push("PLATFORM: " + e.platform),
      e.keyPoints && n.push("KEY POINTS TO COVER: " + e.keyPoints), n.push(""), n.push("OUTPUT FORMAT (respond with ONLY valid JSON, no markdown fences):"),
      n.push("{"), n.push('  "title": "Video title",'), n.push('  "format": "' + (e.format || "youtube") + '",'),
      n.push('  "estimatedDuration": "7:30",'), n.push('  "wordCount": 1650,'), n.push('  "sections": ['),
      n.push("    {"), n.push('      "type": "hook",'), n.push('      "label": "HOOK",'),
      n.push('      "timestamp": "0:00-0:15",'), n.push('      "text": "Full script text for this section...",'),
      n.push('      "visualCues": ["Face close-up", "Show stats graphic"],'), n.push('      "deliveryNotes": "Start quiet, build intensity."'),
      n.push("    }"), n.push("  ],"), n.push('  "fullScript": "Complete concatenated script text...",'),
      n.push('  "keywordSuggestions": ["keyword1", "keyword2"]'), n.push("}"), n.join("\n");
    },
    buildRegeneratePrompt: function(t, e) {
      var n = [];
      return n.push("You are ScriptPad, a video script writing expert for African content creators."),
      n.push(""), n.push("The creator has a script about: " + (e.topic || "a video")),
      n.push("Format: " + (e.format || "youtube")), n.push(""), n.push("They want you to REWRITE just this one section:"),
      n.push("Section type: " + t.type), n.push("Section label: " + t.label), n.push("Current text: " + t.text),
      n.push(""), e.feedback && (n.push("Creator feedback: " + e.feedback), n.push("")),
      n.push("Rewrite this section only. Keep the same type and approximate timestamp."),
      n.push("Write in SPOKEN language. Include delivery notes and visual cues."), n.push(""),
      n.push("OUTPUT FORMAT (respond with ONLY valid JSON, no markdown fences):"), n.push("{"),
      n.push('  "text": "Rewritten section text...",'), n.push('  "visualCues": ["cue1", "cue2"],'),
      n.push('  "deliveryNotes": "Delivery instructions"'), n.push("}"), n.join("\n");
    },
    parseScriptJSON: function(t) {
      try {
        return JSON.parse(t);
      } catch (n) {
        var e = t.match(/\{[\s\S]*\}/);
        if (e) {
          try {
            return JSON.parse(e[0]);
          } catch (t) {}
        }
        return null;
      }
    },
    countWords: function(t) {
      return t ? t.trim().split(/\s+/).filter(function(t) {
        return t.length > 0;
      }).length : 0;
    },
    estimateDuration: function(t) {
      var e = t / 150, n = Math.floor(e), o = Math.round(60 * (e - n));
      return n + ":" + (o < 10 ? "0" : "") + o;
    },
    getFullScript: function(t) {
      return t && t.length ? t.map(function(t) {
        return t.text || "";
      }).join("\n\n") : "";
    },
    buildTeleprompterText: function(t) {
      return t && t.length ? t.map(function(t) {
        var e = t.text || "";
        return (e = (e = (e = (e = e.replace(/\[PAUSE[^\]]*\]/gi, "   ")).replace(/\[EMPHASIS\]/gi, "")).replace(/\[SHOW SCREEN\]/gi, "")).replace(/\[CUT TO B-ROLL[^\]]*\]/gi, "")).trim();
      }).filter(function(t) {
        return t;
      }).join("\n\n") : "";
    },
    createHistoryEntry: function(t, e, n) {
      return {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        topic: t,
        format: e,
        title: n.title || t,
        wordCount: n.wordCount || 0,
        estimatedDuration: n.estimatedDuration || "",
        sectionCount: n.sections ? n.sections.length : 0,
        createdAt: Date.now()
      };
    },
    formatTimestamp: function(t) {
      var e = new Date(t), n = new Date - e;
      return n < 6e4 ? "Just now" : n < 36e5 ? Math.floor(n / 6e4) + "m ago" : n < 864e5 ? Math.floor(n / 36e5) + "h ago" : n < 6048e5 ? Math.floor(n / 864e5) + "d ago" : e.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short"
      });
    },
    exportPlainText: function(t, language) {
      var e = [];
      var sw = language === "sw" || t.language === "sw";
      return e.push(t.title || (sw ? "Script isiyo na jina" : "Untitled Script")), e.push((sw ? "Muundo: " : "Format: ") + (t.format || "youtube") + (sw ? " | Muda: " : " | Duration: ") + (t.estimatedDuration || "N/A")),
      e.push(""), e.push("---"), e.push(""), t.sections && t.sections.forEach(function(t) {
        e.push("[" + t.label + "] (" + t.timestamp + ")"), e.push(""), e.push(t.text), e.push(""),
        t.visualCues && t.visualCues.length && (e.push((sw ? "Vidokezo vya picha: " : "Visual cues: ") + t.visualCues.join(" | ")),
        e.push(""));
      }), t.keywordSuggestions && t.keywordSuggestions.length && (e.push("---"), e.push((sw ? "Maneno muhimu: " : "Keywords: ") + t.keywordSuggestions.join(", "))),
      e.join("\n");
    }
  };
}();

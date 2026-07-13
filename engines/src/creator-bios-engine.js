!function() {
  "use strict";
  var i = {
    instagram: {
      icon: "&#128247;",
      label: "Instagram",
      limit: 150,
      field: "Bio"
    },
    tiktok: {
      icon: "&#127925;",
      label: "TikTok",
      limit: 80,
      field: "Bio"
    },
    x: {
      icon: "&#128038;",
      label: "X / Twitter",
      limit: 160,
      field: "Bio"
    },
    linkedin_headline: {
      icon: "&#128188;",
      label: "LinkedIn Headline",
      limit: 220,
      field: "Headline"
    },
    linkedin_about: {
      icon: "&#128188;",
      label: "LinkedIn About",
      limit: 2600,
      field: "About"
    },
    youtube: {
      icon: "&#9654;&#65039;",
      label: "YouTube",
      limit: 1e3,
      field: "About"
    },
    threads: {
      icon: "&#128172;",
      label: "Threads",
      limit: 150,
      field: "Bio"
    }
  };
  window.AfroTools || (window.AfroTools = {}), window.AfroTools.BioForgeEngine = {
    PLATFORMS: i,
    PLATFORM_ORDER: [ "instagram", "tiktok", "x", "linkedin_headline", "linkedin_about", "youtube", "threads" ],
    buildPrompt: function(t, e, r, a) {
      var o = [];
      if (o.push("You are BioForge, a bio writing expert for African content creators."),
      o.push(""), o.push("CREATOR INFO:"), o.push("- Who: " + t), o.push("- What they do: " + e),
      o.push("- Tone/Vibe: " + r), o.push(""), a) {
        var n = i[a];
        o.push("Generate ONLY a bio for " + n.label + " (" + n.field + ", " + n.limit + " char limit)."),
        o.push(""), o.push("OUTPUT FORMAT (JSON):"), o.push("{"), o.push('  "bios": ['),
        o.push('    { "platform": "' + a + '", "text": "...", "charCount": N, "charLimit": ' + n.limit + ', "withinLimit": true }'),
        o.push("  ]"), o.push("}");
      } else {
        o.push("RULES:"), o.push("- Generate bios for ALL platforms simultaneously"), o.push("- Each bio MUST respect the platform character limit EXACTLY"),
        o.push("- Each bio should feel NATIVE to that platform:"), o.push("  - Instagram (150 chars): visual, emoji structure, line breaks, link reference"),
        o.push("  - TikTok (80 chars): ultra-short, trendy, Gen-Z energy if appropriate"),
        o.push("  - X/Twitter (160 chars): witty, personality-first, no filler words"),
        o.push("  - LinkedIn headline (220 chars): professional keywords, searchable"),
        o.push("  - LinkedIn about (2600 chars): storytelling, credibility, paragraphs"),
        o.push("  - YouTube (1000 chars): discovery-focused, upload schedule mention, keywords"),
        o.push("  - Threads (150 chars): casual, conversational, personality"), o.push("- Use the specified tone consistently across all bios"),
        o.push("- African context natural — location, cultural references, local achievements"),
        o.push("- Emoji usage should match platform norms (heavy on IG/TikTok, minimal on LinkedIn)"),
        o.push('- NEVER use generic filler like "Passionate about..." or "Lover of..."'),
        o.push("- Include ONE unique element that makes the creator memorable"), o.push(""),
        o.push("OUTPUT FORMAT (JSON only, no markdown fences):"), o.push("{"), o.push('  "bios": ['),
        o.push('    { "platform": "instagram", "text": "...", "charCount": N, "charLimit": 150, "withinLimit": true },'),
        o.push('    { "platform": "tiktok", "text": "...", "charCount": N, "charLimit": 80, "withinLimit": true },'),
        o.push('    { "platform": "x", "text": "...", "charCount": N, "charLimit": 160, "withinLimit": true },'),
        o.push('    { "platform": "linkedin_headline", "text": "...", "charCount": N, "charLimit": 220, "withinLimit": true },'),
        o.push('    { "platform": "linkedin_about", "text": "...", "charCount": N, "charLimit": 2600, "withinLimit": true },'),
        o.push('    { "platform": "youtube", "text": "...", "charCount": N, "charLimit": 1000, "withinLimit": true },'),
        o.push('    { "platform": "threads", "text": "...", "charCount": N, "charLimit": 150, "withinLimit": true }'),
        o.push("  ],"), o.push('  "personalBrandTip": "One sentence of unique branding advice for this creator."'),
        o.push("}");
      }
      return o.push(""), o.push("Return ONLY valid JSON. No markdown code fences. No extra text."),
      o.join("\n");
    },
    parseResponse: function(i) {
      try {
        return JSON.parse(i);
      } catch (i) {}
      var t = i.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (t) {
        try {
          return JSON.parse(t[1].trim());
        } catch (i) {}
      }
      var e = i.match(/\{[\s\S]*\}/);
      if (e) {
        try {
          return JSON.parse(e[0]);
        } catch (i) {}
      }
      return {
        bios: [ {
          platform: "instagram",
          text: i,
          charCount: i.length,
          charLimit: 150,
          withinLimit: i.length <= 150
        } ]
      };
    }
  };
}();

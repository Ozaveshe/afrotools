(function (root) {
  "use strict";

  var PLATFORMS = Object.freeze({
    instagram: { label: "Instagram", labelFr: "Instagram", labelSw: "Instagram", limit: 150 },
    tiktok: { label: "TikTok", labelFr: "TikTok", labelSw: "TikTok", limit: 80 },
    x: { label: "X / Twitter", labelFr: "X / Twitter", labelSw: "X / Twitter", limit: 160 },
    linkedin_headline: { label: "LinkedIn headline", labelFr: "Titre LinkedIn", labelSw: "Kichwa cha LinkedIn", limit: 220 },
    linkedin_about: { label: "LinkedIn about", labelFr: "À propos LinkedIn", labelSw: "Kuhusu kwenye LinkedIn", limit: 2600 },
    youtube: { label: "YouTube", labelFr: "YouTube", labelSw: "YouTube", limit: 1000 },
    threads: { label: "Threads", labelFr: "Threads", labelSw: "Threads", limit: 150 }
  });
  var PLATFORM_ORDER = Object.freeze(Object.keys(PLATFORMS));

  var COPY = {
    en: {
      connector: "creating",
      based: "based in",
      achievement: "Known for",
      invitation: "Follow for practical ideas, honest process and work made for African audiences.",
      tip: "Use the same clear promise everywhere, then adapt the opening line to each platform."
    },
    fr: {
      connector: "crée",
      based: "basé·e à",
      achievement: "Reconnu·e pour",
      invitation: "Suivez le compte pour des idées utiles, une démarche transparente et des créations pensées pour les publics africains.",
      tip: "Gardez la même promesse claire partout, puis adaptez la première phrase à chaque plateforme."
    },
    sw: {
      connector: "hutengeneza",
      based: "anaishi",
      achievement: "Anajulikana kwa",
      invitation: "Fuata kwa mawazo ya vitendo, mchakato wa wazi na kazi iliyoundwa kwa hadhira za Afrika.",
      tip: "Tumia ahadi moja iliyo wazi kila mahali, kisha rekebisha sentensi ya kwanza kwa kila jukwaa."
    }
  };

  function clean(value) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  }

  function truncate(value, limit) {
    var text = clean(value);
    if (text.length <= limit) return text;
    return text.slice(0, Math.max(1, limit - 1)).trimEnd() + "…";
  }

  function validateInput(input) {
    input = input || {};
    var who = clean(input.who);
    var what = clean(input.what);
    var errors = [];
    if (!who) errors.push("who");
    if (!what) errors.push("what");
    if (who.length > 120) errors.push("who_too_long");
    if (what.length > 300) errors.push("what_too_long");
    return { valid: errors.length === 0, errors: errors };
  }

  function generate(input, locale) {
    input = input || {};
    locale = locale === "fr" ? "fr" : (locale === "sw" ? "sw" : "en");
    var validation = validateInput(input);
    if (!validation.valid) {
      return { ok: false, errors: validation.errors, bios: [], personalBrandTip: "" };
    }

    var c = COPY[locale];
    var who = clean(input.who);
    var what = clean(input.what);
    var tone = clean(input.tone) || (locale === "fr" ? "professionnel" : (locale === "sw" ? "kitaalamu" : "professional"));
    var location = clean(input.location);
    var achievement = clean(input.achievement);
    var locationLine = location ? " · " + c.based + " " + location : "";
    var achievementLine = achievement ? c.achievement + " " + achievement + "." : "";
    var core = who + " · " + what + locationLine;
    var lines = {
      instagram: core + "\n" + (achievementLine || c.invitation),
      tiktok: who + " · " + what,
      x: core + ". " + (achievementLine || c.invitation),
      linkedin_headline: who + " | " + what + locationLine + " | " + tone,
      linkedin_about: who + " " + c.connector + " " + what + locationLine + ".\n\n" +
        (achievementLine ? achievementLine + "\n\n" : "") + c.invitation,
      youtube: core + ".\n\n" + (achievementLine ? achievementLine + "\n\n" : "") + c.invitation,
      threads: who + " · " + what + locationLine
    };

    return {
      ok: true,
      locale: locale,
      generatedAt: new Date().toISOString(),
      input: {
        who: who,
        what: what,
        tone: tone,
        location: location,
        achievement: achievement
      },
      bios: PLATFORM_ORDER.map(function (platform) {
        var limit = PLATFORMS[platform].limit;
        var text = truncate(lines[platform], limit);
        return {
          platform: platform,
          label: locale === "fr" ? PLATFORMS[platform].labelFr : (locale === "sw" ? PLATFORMS[platform].labelSw : PLATFORMS[platform].label),
          text: text,
          charCount: text.length,
          charLimit: limit,
          withinLimit: text.length <= limit
        };
      }),
      personalBrandTip: c.tip
    };
  }

  function buildPrompt(who, what, tone, singlePlatform) {
    var platform = singlePlatform && PLATFORMS[singlePlatform];
    return [
      "You are BioForge, a bio writing expert for African content creators.",
      "CREATOR INFO:",
      "- Who: " + clean(who),
      "- What they do: " + clean(what),
      "- Tone/Vibe: " + clean(tone),
      platform
        ? "Generate ONLY a bio for " + platform.label + " (" + platform.limit + " char limit)."
        : "Generate bios for all supported platforms and respect every character limit.",
      "Return ONLY valid JSON. No markdown code fences. No extra text."
    ].join("\n");
  }

  function parseResponse(value) {
    var text = String(value == null ? "" : value);
    try { return JSON.parse(text); } catch (_) {}
    var fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) {
      try { return JSON.parse(fenced[1].trim()); } catch (_) {}
    }
    var object = text.match(/\{[\s\S]*\}/);
    if (object) {
      try { return JSON.parse(object[0]); } catch (_) {}
    }
    return {
      bios: [{
        platform: "instagram",
        text: text,
        charCount: text.length,
        charLimit: 150,
        withinLimit: text.length <= 150
      }]
    };
  }

  function serialize(result, format) {
    if (!result || !result.ok) throw new Error("A valid BioForge result is required.");
    if (format === "json") return JSON.stringify(result, null, 2);
    if (format === "txt") {
      return result.bios.map(function (bio) {
        return bio.label + " (" + bio.charCount + "/" + bio.charLimit + ")\n" + bio.text;
      }).join("\n\n") + "\n\n" + result.personalBrandTip;
    }
    throw new Error("Unsupported export format: " + format);
  }

  var engine = {
    PLATFORMS: PLATFORMS,
    PLATFORM_ORDER: PLATFORM_ORDER,
    validateInput: validateInput,
    generate: generate,
    serialize: serialize,
    buildPrompt: buildPrompt,
    parseResponse: parseResponse
  };

  root.AfroTools = root.AfroTools || {};
  root.AfroTools.BioForgeEngine = engine;
  if (typeof module !== "undefined" && module.exports) module.exports = engine;
})(typeof window !== "undefined" ? window : globalThis);

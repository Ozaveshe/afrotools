(function () {
  "use strict";

  var PLATFORMS = {
    instagram: { label: "Instagram", icon: "📷", maxTags: 30, recommended: 15, placement: "Caption or first comment" },
    tiktok: { label: "TikTok", icon: "🎵", maxTags: 8, recommended: 6, placement: "In caption" },
    x: { label: "X", icon: "𝕏", maxTags: 3, recommended: 2, placement: "In post" },
    linkedin: { label: "LinkedIn", icon: "💼", maxTags: 5, recommended: 4, placement: "End of post" },
    youtube: { label: "YouTube", icon: "▶️", maxTags: 15, recommended: 10, placement: "Tags field" }
  };

  var STOP_WORDS = new Set([
    "about", "after", "avec", "behind", "dans", "des", "elle", "entre", "from", "have", "how", "les",
    "pour", "that", "the", "this", "une", "votre", "what", "when", "with", "your"
  ]);
  var AFRICA_HINTS = {
    nigeria: ["NaijaCreative", "MadeInNigeria"],
    lagos: ["LagosCreators", "NaijaCreative"],
    kenya: ["KenyanCreators", "MadeInKenya"],
    nairobi: ["NairobiCreators", "KenyanCreators"],
    senegal: ["CreateursSenegalais", "MadeInSenegal"],
    dakar: ["DakarCreative", "CreateursSenegalais"],
    ghana: ["GhanaCreators", "MadeInGhana"],
    accra: ["AccraCreatives", "GhanaCreators"],
    "south africa": ["SACreatives", "MadeInSouthAfrica"],
    johannesburg: ["JoburgCreatives", "SACreatives"],
    africa: ["AfricanCreators", "MadeInAfrica"],
    afrique: ["CreateursAfricains", "MadeInAfrica"]
  };

  function cleanWords(topic) {
    var normalized = String(topic || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ");
    var seen = new Set();
    return normalized.split(/\s+/).filter(function (word) {
      if (word.length < 3 || STOP_WORDS.has(word) || seen.has(word)) return false;
      seen.add(word);
      return true;
    }).slice(0, 6);
  }

  function pascal(value) {
    return String(value || "").split(/[\s-]+/).filter(Boolean).map(function (part) {
      return part.charAt(0).toUpperCase() + part.slice(1);
    }).join("");
  }

  function unique(items) {
    var seen = new Set();
    return items.filter(function (item) {
      var key = item.toLowerCase();
      if (!item || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function communityTags(topic, locale) {
    var lower = String(topic || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    var tags = [];
    Object.keys(AFRICA_HINTS).forEach(function (hint) {
      if (lower.indexOf(hint) >= 0) tags = tags.concat(AFRICA_HINTS[hint]);
    });
    if (!tags.length) {
      tags = locale === "fr"
        ? ["CreateursAfricains", "CreationAfricaine", "MadeInAfrica"]
        : ["AfricanCreators", "AfricaCreative", "MadeInAfrica"];
    }
    return unique(tags);
  }

  function tagObjects(names, pattern) {
    return names.map(function (name, index) {
      var reach = pattern[index % pattern.length];
      return {
        tag: "#" + pascal(name).replace(/^#/, ""),
        reach: reach,
        estimatedPosts: reach === "high" ? "forte concurrence" : reach === "mid" ? "concurrence moyenne" : "ciblé"
      };
    });
  }

  function takeCycled(pool, count, offset) {
    var result = [];
    for (var i = 0; i < count; i += 1) result.push(pool[(i + offset) % pool.length]);
    return result;
  }

  function generateLocal(topic, platform, locale) {
    var lang = locale === "fr" ? "fr" : "en";
    var config = PLATFORMS[platform] || PLATFORMS.instagram;
    var words = cleanWords(topic);
    if (!words.length) return { error: lang === "fr" ? "Décrivez le sujet de la publication." : "Describe what the post is about." };

    var topicTags = words.map(pascal);
    var broadBase = lang === "fr"
      ? ["CreateurDeContenu", "IdeesDeContenu", "CommunauteCreative", "InspirationCreative", "EntrepreneursCreatifs"]
      : ["ContentCreator", "ContentIdeas", "CreativeCommunity", "CreativeInspiration", "CreativeEntrepreneur"];
    var nicheBase = topicTags.concat(lang === "fr"
      ? ["ConseilsCreateurs", "CoulissesCreation", "StrategieDeContenu", "MarqueCreative"]
      : ["CreatorTips", "BehindTheScenes", "ContentStrategy", "CreativeBrand"]);
    var localBase = communityTags(topic, lang).concat(topicTags.map(function (tag) { return tag + "Africa"; }));
    var count = Math.max(2, config.recommended);
    var all = unique(topicTags.concat(broadBase, nicheBase, localBase));
    while (all.length < count + 4) all.push((lang === "fr" ? "Creation" : "Creative") + (all.length + 1));

    var broad = takeCycled(unique(broadBase.concat(topicTags, localBase)), count, 0);
    var niche = takeCycled(unique(nicheBase.concat(topicTags, localBase)), count, 1);
    var community = takeCycled(unique(localBase.concat(topicTags, nicheBase)), count, 0);
    var names = lang === "fr"
      ? ["PORTÉE ÉQUILIBRÉE", "CIBLAGE DE NICHE", "COMMUNAUTÉ AFRICAINE"]
      : ["BALANCED REACH", "NICHE FOCUS", "AFRICAN COMMUNITY"];
    var strategies = lang === "fr"
      ? [
          "Mélange prudent de tags larges, thématiques et locaux.",
          "Tags précis pour toucher une audience plus qualifiée.",
          "Tags communautaires africains et liés au sujet."
        ]
      : [
          "A careful mix of broad, topic and local tags.",
          "Focused tags for a more relevant audience.",
          "African community and topic-specific tags."
        ];

    return {
      source: "local-deterministic",
      platform: platform in PLATFORMS ? platform : "instagram",
      sets: [broad, niche, community].map(function (tags, index) {
        return {
          name: names[index],
          strategy: strategies[index],
          tags: tagObjects(tags, index === 0 ? ["high", "mid", "niche"] : index === 1 ? ["mid", "niche"] : ["niche", "mid"]),
          totalTags: tags.length,
          estimatedReach: lang === "fr" ? "Non prédit — testez dans vos statistiques" : "Not predicted — test in your analytics"
        };
      }),
      trendingNote: lang === "fr"
        ? "Les tendances changent vite. Vérifiez chaque tag sur la plateforme avant publication."
        : "Trends change quickly. Check each tag on the platform before publishing.",
      avoidList: lang === "fr"
        ? ["Tags hors sujet — risque de faible pertinence", "Tags d’échange d’engagement — qualité faible"]
        : ["Irrelevant tags — low relevance risk", "Engagement-exchange tags — low quality"]
    };
  }

  function serialize(result, format, locale) {
    if (!result || !Array.isArray(result.sets)) return "";
    if (format === "json") return JSON.stringify(result, null, 2);
    var lines = [];
    result.sets.forEach(function (set) {
      lines.push(set.name);
      lines.push(set.strategy || "");
      lines.push(set.tags.map(function (tag) { return tag.tag; }).join(" "));
      lines.push("");
    });
    if (result.trendingNote) lines.push((locale === "fr" ? "Note : " : "Note: ") + result.trendingNote);
    return lines.join("\n").trim() + "\n";
  }

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.TagWaveEngine = {
    PLATFORMS: PLATFORMS,
    DEFAULT_PLATFORM: "instagram",
    REACH_LEVELS: {
      high: { label: "High Reach", desc: "Broad", color: "#FF3B30" },
      mid: { label: "Mid Reach", desc: "Focused", color: "#FFD60A" },
      niche: { label: "Niche", desc: "Community", color: "#34C759" }
    },
    buildPrompt: function (topic, platform) {
      var p = PLATFORMS[platform] || PLATFORMS.instagram;
      return "Generate exactly three relevant hashtag sets for " + p.label + ". Topic: " + topic +
        ". Return valid JSON with sets, name, strategy, tags, tag, reach and estimatedPosts. " +
        "Do not promise reach and do not include engagement-exchange tags.";
    },
    parseSets: function (value) {
      if (value && typeof value === "object" && Array.isArray(value.sets)) return value;
      if (typeof value !== "string") return null;
      try {
        var match = value.match(/\{[\s\S]*\}/);
        return match ? JSON.parse(match[0]) : null;
      } catch (_) {
        return null;
      }
    },
    generateLocal: generateLocal,
    serialize: serialize,
    formatReach: function (value) { return value == null ? "" : String(value); },
    tagsToString: function (tags) { return (tags || []).map(function (tag) { return tag.tag; }).join(" "); },
    createHistoryEntry: function (topic, platform, sets, customMix) {
      return { id: Date.now().toString(36), topic: topic, platform: platform, sets: sets, customMix: customMix || [], createdAt: Date.now() };
    },
    formatTimestamp: function (timestamp, locale) {
      return new Date(timestamp).toLocaleString(locale === "fr" ? "fr-FR" : "en-GB", { dateStyle: "medium", timeStyle: "short" });
    }
  };
}());

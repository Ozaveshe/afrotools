(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.creatorFinalWave = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  var FORMATS = Object.freeze({
    youtube: Object.freeze({ width: 1280, height: 720, label: "YouTube" }),
    instagram: Object.freeze({ width: 1080, height: 1080, label: "Instagram" }),
    linkedin: Object.freeze({ width: 1200, height: 627, label: "LinkedIn" }),
    x: Object.freeze({ width: 1600, height: 900, label: "X" }),
  });

  function clean(value) {
    return String(value == null ? "" : value).trim().replace(/\s+/g, " ");
  }

  function lines(value) {
    return String(value == null ? "" : value)
      .split(/\r?\n/)
      .map(clean)
      .filter(Boolean);
  }

  function number(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function roundMoney(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function requireText(value, label, minimum) {
    var normalized = clean(value);
    if (normalized.length < (minimum || 1)) {
      throw new Error(label + " is required.");
    }
    return normalized;
  }

  function requirePositive(value, label, allowZero) {
    var parsed = number(value);
    if (!Number.isFinite(parsed) || (allowZero ? parsed < 0 : parsed <= 0)) {
      throw new Error(label + " must be " + (allowZero ? "zero or greater." : "greater than zero."));
    }
    return parsed;
  }

  function parseLinks(value, required) {
    var parsed = lines(value).map(function (line, index) {
      var parts = line.split("|");
      var title = clean(parts.shift());
      var url = clean(parts.join("|"));
      if (!title || !/^https?:\/\/\S+$/i.test(url)) {
        throw new Error("Link " + (index + 1) + " must use Label | https://example.com.");
      }
      return { title: title, url: url };
    });
    if (required && !parsed.length) throw new Error("Add at least one valid link.");
    return parsed;
  }

  function carousel(input) {
    var headline = requireText(input.headline, "Headline", 4);
    var audience = requireText(input.audience, "Audience", 3);
    var points = lines(input.points);
    if (points.length < 2 || points.length > 8) {
      throw new Error("Add between two and eight slide points.");
    }
    var slides = [{ kind: "cover", heading: headline, body: audience }];
    points.forEach(function (point, index) {
      slides.push({
        kind: "point",
        heading: String(index + 1).padStart(2, "0"),
        body: point,
      });
    });
    slides.push({
      kind: "close",
      heading: clean(input.callToAction) || "Save this carousel",
      body: clean(input.handle) || audience,
    });
    return {
      owner: "creator-carousel",
      headline: headline,
      audience: audience,
      slides: slides,
      colours: {
        background: clean(input.background) || "#111827",
        accent: clean(input.accent) || "#f59e0b",
      },
      dimensions: { width: 1080, height: 1350 },
      boundary: "Local layout draft; review every slide before publishing.",
    };
  }

  function club(input) {
    var members = Math.round(requirePositive(input.members, "Members"));
    var price = requirePositive(input.monthlyPrice, "Monthly price", true);
    var feePct = requirePositive(input.feePct, "Platform fee", true);
    var costs = requirePositive(input.monthlyCosts, "Monthly costs", true);
    if (feePct > 100) throw new Error("Platform fee cannot exceed 100%.");
    var gross = roundMoney(members * price);
    var platformFees = roundMoney(gross * feePct / 100);
    var net = roundMoney(gross - platformFees - costs);
    return {
      owner: "creator-club",
      name: requireText(input.clubName, "Club name", 3),
      members: members,
      monthlyPrice: price,
      feePct: feePct,
      monthlyCosts: costs,
      grossMonthly: gross,
      platformFees: platformFees,
      netMonthly: net,
      annualNet: roundMoney(net * 12),
      breakEvenMembers: price * (1 - feePct / 100) > 0
        ? Math.ceil(costs / (price * (1 - feePct / 100)))
        : null,
      boundary: "Planning estimate using only the values entered here.",
    };
  }

  function course(input) {
    var title = requireText(input.courseTitle, "Course title", 4);
    var audience = requireText(input.audience, "Audience", 3);
    var modules = lines(input.modules);
    if (modules.length < 2 || modules.length > 12) {
      throw new Error("Add between two and twelve module topics.");
    }
    var price = requirePositive(input.price, "Price", true);
    var students = Math.round(requirePositive(input.students, "Students"));
    var feePct = requirePositive(input.feePct, "Platform fee", true);
    var costs = requirePositive(input.costs, "Costs", true);
    if (feePct > 100) throw new Error("Platform fee cannot exceed 100%.");
    var gross = roundMoney(price * students);
    var platformFees = roundMoney(gross * feePct / 100);
    return {
      owner: "creator-course",
      title: title,
      audience: audience,
      modules: modules.map(function (moduleTitle, index) {
        return { number: index + 1, title: moduleTitle };
      }),
      price: price,
      students: students,
      grossRevenue: gross,
      platformFees: platformFees,
      costs: costs,
      netRevenue: roundMoney(gross - platformFees - costs),
      boundary: "Local outline and sales scenario, not a hosted or published course.",
    };
  }

  function page(input) {
    var displayName = requireText(input.displayName, "Display name", 2);
    var bio = requireText(input.bio, "Bio", 12);
    var links = parseLinks(input.links, true);
    return {
      owner: "creator-page",
      displayName: displayName,
      bio: bio,
      links: links,
      accent: clean(input.accent) || "#2563eb",
      boundary: "Portable local page draft; AfroTools does not host or publish it.",
    };
  }

  function research(input) {
    var topic = requireText(input.topic, "Topic", 4);
    var audience = requireText(input.audience, "Audience", 3);
    var questions = lines(input.questions);
    if (questions.length < 2 || questions.length > 10) {
      throw new Error("Add between two and ten research questions.");
    }
    var sources = parseLinks(input.sources, true);
    return {
      owner: "creator-research",
      topic: topic,
      audience: audience,
      questions: questions,
      sources: sources,
      verificationChecklist: [
        "Open every source and confirm its author or publisher.",
        "Record the publication or update date.",
        "Cross-check changing claims with a second reliable source.",
        "Separate sourced facts from your interpretation.",
      ],
      boundary: "This planner does not fetch, read, rank, or verify the sources.",
    };
  }

  function thumb(input) {
    var format = FORMATS[clean(input.format)] || FORMATS.youtube;
    return {
      owner: "creator-thumb",
      headline: requireText(input.headline, "Headline", 3),
      kicker: clean(input.kicker),
      format: clean(input.format) || "youtube",
      width: format.width,
      height: format.height,
      platform: format.label,
      colours: {
        background: clean(input.background) || "#111827",
        accent: clean(input.accent) || "#f59e0b",
        text: clean(input.textColour) || "#ffffff",
      },
      boundary: "Local canvas composition; verify safe areas and current platform rules.",
    };
  }

  var calculators = Object.freeze({
    "creator-carousel": carousel,
    "creator-club": club,
    "creator-course": course,
    "creator-page": page,
    "creator-research": research,
    "creator-thumb": thumb,
  });

  function calculate(owner, input) {
    var calculator = calculators[owner];
    if (!calculator) throw new Error("Unsupported Creative owner.");
    return calculator(input || {});
  }

  return Object.freeze({
    FORMATS: FORMATS,
    calculate: calculate,
    parseLinks: parseLinks,
  });
});

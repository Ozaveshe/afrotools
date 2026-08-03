(function (root) {
  "use strict";

  var app = document.querySelector("[data-sw-creative-app]");
  var configNode = document.getElementById("swCreativeConfig");
  if (!app || !configNode) return;

  var config = JSON.parse(configNode.textContent);
  var form = app.querySelector("form");
  var fieldsNode = app.querySelector("[data-fields]");
  var statusNode = app.querySelector("[data-status]");
  var resultNode = app.querySelector("[data-result]");
  var exportsNode = app.querySelector("[data-exports]");
  var lastResult = null;

  var LABELS = {
    owner: "Zana", country: "Nchi", symbol: "Sarafu", rate: "Kiwango cha marejeo",
    title: "Kichwa", artType: "Aina ya sanaa", size: "Ukubwa", complexity: "Ugumu",
    rights: "Haki za matumizi", revisions: "Marekebisho", timeline: "Ratiba", hours: "Saa",
    base: "Bei ya msingi", price: "Bei iliyokadiriwa", minPrice: "Kiwango cha chini",
    maxPrice: "Kiwango cha juu", hourlyRate: "Bei kwa saa", sizeMultiplier: "Kizidishi cha ukubwa",
    complexityMultiplier: "Kizidishi cha ugumu", retailUSD: "Bei ya rejareja (USD)",
    monthlySales: "Mauzo ya mwezi", editingTotal: "Jumla ya uhariri", setupTotal: "Gharama za maandalizi",
    printQty: "Nakala za kuchapisha", printTotal: "Jumla ya uchapishaji", totalUSD: "Jumla (USD)",
    totalLocal: "Jumla kwa sarafu ya nchi", royaltyPerCopy: "Mrahaba kwa nakala", breakEven: "Nakala za kufikia gharama",
    platforms: "Majukwaa", projections: "Makadirio", platform: "Jukwaa", followers: "Wafuasi",
    likes: "Likes", comments: "Maoni", shares: "Kushiriki", saves: "Hifadhi", interactions: "Mwingiliano",
    benchmark: "Kigezo", grade: "Daraja", gradeLabel: "Tafsiri ya daraja", tips: "Vidokezo",
    benchmarkLevels: "Viwango vya kulinganisha", monetizationStreams: "Njia za mapato",
    totalRoyalties: "Jumla ya mirabaha", totalLocal: "Jumla kwa sarafu ya nchi", period: "Kipindi",
    periodLabel: "Jina la kipindi", splitTotal: "Jumla ya mgao", shares: "Washiriki na mgao",
    experience: "Uzoefu", shootHours: "Saa za kupiga picha", editHours: "Saa za kuhariri",
    dailyCost: "Gharama ya siku", sessionPrice: "Bei ya session", dayRate: "Bei ya siku",
    monthly: "Kwa mwezi", annual: "Kwa mwaka", downloads: "Downloads", episodes: "Vipindi",
    patrons: "Wafuasi wanaolipa", downloadsPerEpisode: "Downloads kwa kipindi", adTotal: "Mapato ya matangazo",
    sponsorship: "Udhamini", support: "Msaada wa mashabiki", total: "Jumla", streams: "Njia za mapato",
    thresholds: "Viwango vya kufungua njia", format: "Format", pages: "Kurasa", printCost: "Gharama ya uchapishaji",
    hardcoverPrint: "Gharama ya hardcover", best: "Chaguo lenye mrahaba mkubwa", sweetSpots: "Mifano ya bei",
    items: "Vipengele vya package", deposit: "Amana", comparisons: "Ulinganisho wa uzoefu",
    name: "Jina", role: "Jukumu", pct: "Asilimia", shareUSD: "Mgao wa USD", shareLocal: "Mgao wa sarafu ya nchi",
    quarterly: "Kwa robo mwaka", generatedAt: "Muda wa kutengeneza", boundary: "Mpaka wa matumizi",
    members: "Wanachama", monthlyPrice: "Bei ya mwezi", feePct: "Ada ya jukwaa (%)",
    monthlyCosts: "Gharama za mwezi", grossMonthly: "Mapato ghafi ya mwezi", platformFees: "Ada za jukwaa",
    netMonthly: "Mapato halisi ya mwezi", annualNet: "Mapato halisi ya mwaka", breakEvenMembers: "Wanachama wa kufikia gharama",
    audience: "Hadhira", modules: "Moduli", students: "Wanafunzi", grossRevenue: "Mapato ghafi",
    costs: "Gharama", netRevenue: "Mapato halisi", topic: "Mada", questions: "Maswali",
    sources: "Vyanzo", verificationChecklist: "Orodha ya kuhakiki", colours: "Rangi", colors: "Rangi",
    palette: "Paleti", desc: "Maelezo", hex: "HEX", width: "Upana", height: "Urefu",
    label: "Lebo", value: "Thamani", note: "Dokezo", threshold: "Kizingiti", monthly: "Kwa mwezi",
    perCopy: "Kwa nakala", annual: "Kwa mwaka", included: "Imejumuishwa", level: "Kiwango"
  };

  var VALUES = {
    Monthly: "Kila mwezi", Quarterly: "Kila robo mwaka", Annual: "Kila mwaka",
    Excellent: "Bora sana", Good: "Nzuri", Average: "Wastani", "Below Average": "Chini ya wastani",
    "Pre-Roll Ads": "Tangazo la mwanzo", "Mid-Roll Ads": "Tangazo la katikati",
    "Post-Roll Ads": "Tangazo la mwisho", "Direct Sponsorships": "Udhamini wa moja kwa moja",
    "Patreon / Listeners": "Msaada wa wasikilizaji", Merchandise: "Bidhaa za mashabiki",
    "Programmatic Ads": "Matangazo ya kiotomatiki", "Premium Sponsors": "Wadhamini wakubwa",
    "Brand Deals (major)": "Mikataba mikubwa ya brand", "Nano/Micro Brand Deals": "Mikataba ya brand kwa creator mdogo",
    "Affiliate Marketing": "Uuzaji wa affiliate", "Platform Monetization": "Mapato ya jukwaa",
    "Premium Content / Patreon": "Maudhui ya kulipia / Patreon",
    "2nd Photographer": "Mpiga picha wa pili", "Drone Coverage": "Picha za drone",
    "Same-Day Edit (SDE)": "Uhariri wa siku hiyo (SDE)", "40-Page Wedding Album": "Albamu ya harusi ya kurasa 40",
    "60-Page Wedding Album": "Albamu ya harusi ya kurasa 60", "Pre-Wedding Shoot": "Session ya kabla ya harusi",
    "Print Package (40 prints)": "Package ya picha 40 zilizochapishwa", "Additional Coverage Day": "Siku ya ziada ya coverage",
    digital_portrait: "Picha ya kidijitali", digital_illustration: "Mchoro wa kidijitali", oil_portrait: "Picha ya oil",
    acrylic: "Acrylic", watercolour: "Watercolour", pencil: "Penseli", logo: "Logo",
    simple: "Rahisi", detailed: "Yenye maelezo", very_detailed: "Yenye maelezo mengi",
    personal: "Matumizi binafsi", commercial: "Matumizi ya biashara", limited: "Marekebisho yenye kikomo",
    unlimited: "Marekebisho bila kikomo", standard: "Ratiba ya kawaida", rush: "Kazi ya haraka",
    new: "Mwanzo", mid: "Mwenye uzoefu", senior: "Senior", established: "Aliyejijenga",
    portrait: "Portrait", wedding: "Harusi", realestate: "Nyumba", product: "Bidhaa", events: "Tukio",
    entry: "Vifaa vya mwanzo", pro: "Vifaa vya kitaalamu", no: "Digital pekee", basic: "Prints chache", album: "Albamu",
    ebook: "Ebook", paperback: "Paperback", hardcover: "Hardcover",
    "70% tier ($2.99â€“$9.99)": "Kiwango cha 70% ($2.99–$9.99)",
    "35% tier (outside range)": "Kiwango cha 35% (nje ya bei hiyo)", "60â€“70% standard": "Kiwango cha kawaida 60–70%",
    "60% net": "60% baada ya mgawo wa jukwaa", "70% â€” Nigeria focus": "70% — inalenga Nigeria",
    "70% â€” Nigeria/Africa": "70% — inalenga Nigeria na Afrika", "~55% after print cost": "Takriban 55% baada ya gharama ya uchapishaji",
    "Higher margin, limited reach": "Margin kubwa, usambazaji mdogo", "60% after print cost": "60% baada ya gharama ya uchapishaji",
    "55% after print cost": "55% baada ya gharama ya uchapishaji",
    primary: "Rangi kuu", secondary: "Rangi ya pili", accent: "Rangi ya msisitizo", dark: "Rangi nyeusi", background: "Mandharinyuma"
  };

  var ENGAGEMENT_TIPS = {
    instagram: ["Chapisha Reels mara 3–4 kwa wiki na upime matokeo.", "Carousel inaweza kusaidia watu kuhifadhi maudhui.", "Tumia polls na maswali ya Story kwa mazungumzo.", "Jaribu nyakati tofauti kwa hadhira yako badala ya kudhani saa moja inafaa wote.", "Tumia hashtag chache zinazohusiana moja kwa moja na mada."],
    tiktok: ["Jaribu muda ambao hadhira yako iko mtandaoni.", "Tumia sauti inayofaa na hakiki haki za matumizi.", "Video fupi inaweza kusaidia completion rate, lakini pima data yako.", "Jibu maoni kwa wakati bila kuahidi reach.", "Changanya hashtag za niche na chache zinazovuma."],
    twitter: ["Thread inaweza kutoa nafasi ya kueleza mada kwa kina.", "Jibu mazungumzo yanayohusiana na niche yako kwa heshima.", "Poll inaweza kusaidia kupata majibu ya haraka.", "Pima frequency inayofaa hadhira yako.", "Picha au video inaweza kuongeza uwazi wa ujumbe."],
    linkedin: ["Andika post yenye hoja na mfano unaoweza kuthibitishwa.", "Pima siku na saa tofauti kwa hadhira yako ya kazi.", "Shiriki maoni yenye maana kabla na baada ya kuchapisha.", "Tumia hashtag chache zinazohusiana na mada.", "Uzoefu binafsi wenye ushahidi unaweza kuwa na nguvu kuliko tangazo tupu."],
    facebook: ["Kundi linalosimamiwa vizuri linaweza kusaidia mazungumzo.", "Video ya moja kwa moja inahitaji mpango na ruhusa za media.", "Uliza swali linaloweza kujibiwa kwa urahisi.", "Pima saa tofauti kwa hadhira yako.", "Eleza link kwa uwazi na epuka mbinu za kudanganya engagement."]
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function fieldMarkup(field) {
    var id = "swc-" + field.name;
    if (field.type === "checkboxes") {
      return '<fieldset class="swc-field swc-field--wide"><legend>' + escapeHtml(field.label) + '</legend>' +
        '<div class="swc-checks">' + field.options.map(function (option) {
          return '<label class="swc-check"><input type="checkbox" name="' + escapeHtml(field.name) +
            '" value="' + escapeHtml(option.value) + '"' + (option.checked ? " checked" : "") + '><span>' +
            escapeHtml(option.label) + '</span></label>';
        }).join("") + '</div>' + (field.help ? '<p class="swc-help">' + escapeHtml(field.help) + '</p>' : "") + '</fieldset>';
    }
    var common = ' id="' + id + '" name="' + escapeHtml(field.name) + '"' +
      (field.required ? " required" : "") + (field.min != null ? ' min="' + field.min + '"' : "") +
      (field.max != null ? ' max="' + field.max + '"' : "") + (field.step != null ? ' step="' + field.step + '"' : "");
    var control;
    if (field.type === "textarea") {
      control = '<textarea' + common + ' rows="' + (field.rows || 4) + '">' + escapeHtml(field.value || "") + '</textarea>';
    } else if (field.type === "select") {
      control = '<select' + common + '>' + field.options.map(function (option) {
        return '<option value="' + escapeHtml(option.value) + '"' + (option.value === field.value ? " selected" : "") + '>' +
          escapeHtml(option.label) + '</option>';
      }).join("") + '</select>';
    } else {
      control = '<input type="' + escapeHtml(field.type || "text") + '"' + common + ' value="' + escapeHtml(field.value || "") + '">';
    }
    return '<div class="swc-field' + (field.wide ? ' swc-field--wide' : '') + '"><label for="' + id + '">' +
      escapeHtml(field.label) + '</label>' + control + (field.help ? '<p class="swc-help">' + escapeHtml(field.help) + '</p>' : "") + '</div>';
  }

  function values() {
    var output = {};
    config.fields.forEach(function (field) {
      if (field.type === "checkboxes") {
        output[field.name] = Array.from(form.querySelectorAll('[name="' + field.name + '"]:checked'), function (node) { return node.value; });
      } else {
        output[field.name] = form.elements[field.name] ? form.elements[field.name].value : "";
      }
    });
    return output;
  }

  function validate(data) {
    for (var index = 0; index < config.fields.length; index += 1) {
      var field = config.fields[index];
      var value = data[field.name];
      if (field.required && (Array.isArray(value) ? !value.length : !String(value).trim())) {
        return { ok: false, field: field.name, message: "Jaza sehemu ya " + field.label.toLocaleLowerCase("sw") + "." };
      }
      if (field.type === "number" && String(value).trim()) {
        var number = Number(value);
        if (!Number.isFinite(number) || (field.min != null && number < Number(field.min)) || (field.max != null && number > Number(field.max))) {
          return { ok: false, field: field.name, message: "Thamani ya " + field.label.toLocaleLowerCase("sw") + " haikubaliki." };
        }
      }
    }
    if (config.owner === "music-royalty-splitter") {
      var split = Number(data.shareOne) + Number(data.shareTwo) + Number(data.shareThree);
      if (Math.round(split * 100) / 100 !== 100) return { ok: false, field: "shareOne", message: "Asilimia za washiriki lazima zifikie 100%." };
    }
    return { ok: true };
  }

  function engine() {
    var cursor = root;
    config.engineGlobal.split(".").forEach(function (part) { cursor = cursor && cursor[part]; });
    if (!cursor) throw new Error("Injini ya zana haikupatikana.");
    return cursor;
  }

  function calculate(data) {
    var owner = config.owner;
    var api = engine();
    if (owner === "african-palette") {
      var palette = api.getPalette(data.paletteId);
      if (!palette) throw new Error("Chagua paleti halali.");
      return {
        owner: owner,
        palette: data.paletteId,
        name: palette.name,
        desc: "Paleti yenye rangi tano za kuanzia; hakiki contrast na muktadha wa matumizi.",
        colors: palette.colors.map(function (color) { return { hex: color.hex, role: VALUES[color.role] || color.role }; })
      };
    }
    if (owner === "music-royalty-splitter") {
      return api.calculate({
        title: data.title, country: data.country, totalRoyalties: data.totalRoyalties, period: data.period,
        collaborators: [
          { id: 1, name: data.nameOne, role: data.roleOne, pct: data.shareOne },
          { id: 2, name: data.nameTwo, role: data.roleTwo, pct: data.shareTwo },
          { id: 3, name: data.nameThree, role: data.roleThree, pct: data.shareThree }
        ]
      });
    }
    if (owner === "creator-club" || owner === "creator-course" || owner === "creator-research") {
      var planned = api.calculate(owner, data);
      planned.boundary = config.boundary;
      if (owner === "creator-research") {
        planned.verificationChecklist = [
          "Fungua kila chanzo na uthibitishe mwandishi au publisher.",
          "Andika tarehe ya kuchapishwa au kusasishwa.",
          "Linganisha madai yanayobadilika na chanzo kingine cha kuaminika.",
          "Tenganisha ukweli wa chanzo na tafsiri yako."
        ];
      }
      return planned;
    }
    var result = api.calculate(data);
    if (owner === "engagement-rate") result.tips = ENGAGEMENT_TIPS[data.platform] || ENGAGEMENT_TIPS.instagram;
    return result;
  }

  function displayValue(value) {
    if (typeof value === "number") return new Intl.NumberFormat("sw", { maximumFractionDigits: 2 }).format(value);
    if (typeof value === "boolean") return value ? "Ndiyo" : "Hapana";
    return VALUES[String(value)] || String(value == null ? "" : value);
  }

  function listMarkup(items) {
    return '<ol class="swc-result-list">' + items.map(function (item) {
      if (item == null || typeof item !== "object") return '<li>' + escapeHtml(displayValue(item)) + '</li>';
      var parts = Object.keys(item).filter(function (key) { return key !== "id" && key !== "gradeClass"; }).map(function (key) {
        return '<strong>' + escapeHtml(LABELS[key] || key) + ':</strong> ' + escapeHtml(displayValue(item[key]));
      });
      return '<li>' + parts.join(' <span aria-hidden="true">·</span> ') + '</li>';
    }).join("") + '</ol>';
  }

  function resultMarkup(result) {
    return '<dl class="swc-result">' + Object.keys(result).filter(function (key) {
      return key !== "gradeClass" && key !== "rate";
    }).map(function (key) {
      var value = result[key];
      var body;
      if (Array.isArray(value)) body = listMarkup(value);
      else if (value && typeof value === "object") body = listMarkup([value]);
      else body = escapeHtml(displayValue(value));
      return '<div class="swc-result-item"><dt>' + escapeHtml(LABELS[key] || key) + '</dt><dd>' + body + '</dd></div>';
    }).join("") + '</dl>';
  }

  function resultText(result) {
    return config.title + "\n\n" + Object.keys(result).map(function (key) {
      var value = result[key];
      return (LABELS[key] || key) + ": " + (typeof value === "object" ? JSON.stringify(value) : displayValue(value));
    }).join("\n") + "\n\nImeandaliwa ndani ya kivinjari chako. Hakiki makadirio kabla ya kuyatumia.";
  }

  function download(filename, type, content) {
    var blob = new Blob([content], { type: type });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  function setStatus(message, state) {
    statusNode.textContent = message;
    statusNode.dataset.state = state || "ready";
  }

  fieldsNode.innerHTML = config.fields.map(fieldMarkup).join("");

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var data = values();
    var check = validate(data);
    if (!check.ok) {
      lastResult = null;
      resultNode.hidden = true;
      exportsNode.hidden = true;
      setStatus(check.message, "error");
      var invalid = form.elements[check.field];
      if (invalid && invalid.focus) invalid.focus();
      return;
    }
    try {
      var result = calculate(data);
      if (result && result.ok === false) throw new Error("Mgao au taarifa ulizoingiza hazikubaliki.");
      lastResult = result;
      resultNode.innerHTML = resultMarkup(result);
      resultNode.hidden = false;
      exportsNode.hidden = false;
      setStatus("Makadirio yametengenezwa kwenye kifaa chako.", "ready");
      resultNode.focus();
    } catch (error) {
      lastResult = null;
      resultNode.hidden = true;
      exportsNode.hidden = true;
      setStatus("Hatujaweza kutengeneza matokeo. Hakiki taarifa ulizoingiza.", "error");
    }
  });

  app.querySelector("[data-reset]").addEventListener("click", function () {
    form.reset();
    lastResult = null;
    resultNode.hidden = true;
    exportsNode.hidden = true;
    setStatus("Jaza taarifa kisha bonyeza kokotoa.", "ready");
    var first = form.querySelector("input, select, textarea");
    if (first) first.focus();
  });

  app.querySelector("[data-export-json]").addEventListener("click", function () {
    if (!lastResult) return setStatus("Kokotoa kwanza kabla ya kupakua.", "error");
    download(config.owner + "-sw.json", "application/json;charset=utf-8", JSON.stringify(lastResult, null, 2));
  });

  app.querySelector("[data-export-txt]").addEventListener("click", function () {
    if (!lastResult) return setStatus("Kokotoa kwanza kabla ya kupakua.", "error");
    download(config.owner + "-sw.txt", "text/plain;charset=utf-8", resultText(lastResult));
  });

  app.querySelector("[data-copy]").addEventListener("click", function () {
    if (!lastResult) return setStatus("Kokotoa kwanza kabla ya kunakili.", "error");
    var text = resultText(lastResult);
    var copy = root.navigator.clipboard && root.navigator.clipboard.writeText
      ? root.navigator.clipboard.writeText(text)
      : Promise.reject(new Error("clipboard unavailable"));
    copy.then(function () { setStatus("Matokeo yamenakiliwa.", "ready"); }).catch(function () {
      var area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
      setStatus("Matokeo yamenakiliwa.", "ready");
    });
  });
})(window);

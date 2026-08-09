(function (window, document) {
  "use strict";

  var root = document.querySelector("[data-creator-pricing]");
  var engine = window.CreatorPricingEngine;
  if (!root || !engine) return;

  var words = {
    "Nigeria": "Nigeria", "Kenya": "Kenya", "South Africa": "Afrika Kusini", "Ghana": "Ghana",
    "Tanzania": "Tanzania", "Egypt": "Misri", "Ethiopia": "Ethiopia", "Uganda": "Uganda",
    "Rwanda": "Rwanda", "Senegal": "Senegal", "Côte d'Ivoire": "Côte d’Ivoire", "Cameroon": "Kamerun",
    "Morocco": "Moroko", "Tunisia": "Tunisia", "Botswana": "Botswana",
    "Photography": "Upigaji picha", "Videography / Film": "Video na filamu", "Graphic Design": "Ubunifu wa michoro",
    "Music Production": "Utayarishaji wa muziki", "Writing / Copywriting": "Uandishi na copywriting",
    "Web / App Dev": "Utengenezaji wa tovuti na app", "Social Media Mgmt": "Usimamizi wa mitandao ya kijamii",
    "Fashion Design": "Ubunifu wa mitindo", "Illustration / Art": "Uchoraji na sanaa",
    "Voice Over / Audio": "Sauti na voice-over", "Event Planning": "Upangaji wa hafla", "Other": "Nyingine",
    "Wedding": "Harusi", "Portrait": "Picha ya mtu", "Product": "Bidhaa", "Fashion": "Mitindo",
    "Event": "Hafla", "Real Estate": "Mali isiyohamishika", "Food": "Chakula", "Documentary": "Makala ya video",
    "Music Video": "Video ya muziki", "Wedding Film": "Filamu ya harusi", "Commercial": "Tangazo",
    "Corporate": "Kampuni", "Social Media": "Mitandao ya kijamii", "Short Film": "Filamu fupi",
    "Brand Identity": "Utambulisho wa brand", "Print": "Machapisho", "Packaging": "Ufungashaji", "UI/UX": "UI/UX",
    "Motion Graphics": "Michoro inayosonga", "Infographics": "Infografiki", "Afrobeats": "Afrobeats",
    "Amapiano": "Amapiano", "Gospel": "Gospel", "Highlife": "Highlife", "Bongo": "Bongo", "Gengetone": "Gengetone",
    "Jingles": "Jingle", "Film Score": "Muziki wa filamu", "Blog/SEO": "Blogu na SEO", "Copywriting": "Copywriting",
    "Technical": "Kiufundi", "Ghostwriting": "Ghostwriting", "Script": "Script", "PR/Communications": "PR na mawasiliano",
    "Academic": "Kitaaluma", "Frontend": "Frontend", "Backend": "Backend", "Full Stack": "Full stack",
    "Mobile App": "App ya simu", "WordPress": "WordPress", "E-commerce": "Biashara mtandaoni", "API/Integration": "API na uunganishaji",
    "Strategy": "Mkakati", "Content Creation": "Utayarishaji wa maudhui", "Community Mgmt": "Usimamizi wa jumuiya",
    "Paid Ads": "Matangazo ya kulipia", "Influencer": "Influencer", "Analytics": "Uchambuzi", "Bespoke/Custom": "Iliyotengenezwa maalumu",
    "Ready-to-Wear": "Tayari kuvaliwa", "Bridal": "Mavazi ya harusi", "Accessories": "Vifaa vya ziada", "Styling": "Ushauri wa mitindo",
    "Costume": "Kostiumu", "Digital Art": "Sanaa ya kidijitali", "Editorial": "Uhariri", "Children's Book": "Kitabu cha watoto",
    "Comic/Manga": "Katuni na manga", "Murals": "Mchoro wa ukutani", "Portraits": "Picha za watu", "NFT Art": "Sanaa ya NFT",
    "Narration": "Usimulizi", "Podcast": "Podcast", "IVR/Phone": "IVR na simu", "Animation": "Uhuishaji",
    "Audiobook": "Kitabu cha sauti", "Weddings": "Harusi", "Concerts": "Tamasha", "Conference": "Kongamano",
    "Birthday/Social": "Sherehe ya kuzaliwa au kijamii", "Decor Only": "Mapambo pekee",
    "Half-day shoot (4hrs)": "Upigaji wa nusu siku (saa 4)", "Full-day shoot (8hrs)": "Upigaji wa siku nzima (saa 8)",
    "Wedding (full day)": "Harusi (siku nzima)", "Per edited photo": "Kwa kila picha iliyohaririwa", "Photo + video combo": "Picha na video pamoja",
    "Short-form video (30–60s)": "Video fupi (sekunde 30–60)", "Corporate video (3–5 min)": "Video ya kampuni (dakika 3–5)",
    "Social media reel": "Reel ya mitandao", "Logo design": "Ubunifu wa nembo", "Social media set (10 posts)": "Seti ya mitandao (machapisho 10)",
    "Flyer / poster": "Flyer au poster", "Brand identity package": "Kifurushi cha utambulisho wa brand", "Presentation deck": "Wasilisho",
    "Beat/instrumental": "Beat au ala", "Full track production": "Utayarishaji wa wimbo kamili", "Mixing & mastering": "Mixing na mastering",
    "Jingle (30s)": "Jingle (sekunde 30)", "Album production (10 tracks)": "Utayarishaji wa albamu (nyimbo 10)",
    "Blog post (1000 words)": "Makala ya blogu (maneno 1,000)", "Website copy (5 pages)": "Maandishi ya tovuti (kurasa 5)",
    "Social media captions (30)": "Caption za mitandao (30)", "Press release": "Taarifa kwa vyombo vya habari",
    "Ebook / whitepaper": "E-book au whitepaper", "Landing page": "Ukurasa wa kutua", "Full website (5–10 pages)": "Tovuti kamili (kurasa 5–10)",
    "E-commerce store": "Duka la mtandaoni", "Mobile app (MVP)": "App ya simu (MVP)", "API integration": "Uunganishaji wa API",
    "Monthly management": "Usimamizi wa mwezi", "Strategy document": "Hati ya mkakati", "Ad campaign setup": "Kuandaa kampeni ya matangazo",
    "Content calendar (1 month)": "Kalenda ya maudhui (mwezi 1)", "Audit & report": "Ukaguzi na ripoti", "Custom outfit": "Vazi maalumu",
    "Bridal gown": "Gauni la harusi", "Aso-ebi set": "Seti ya aso-ebi", "Collection (10 pieces)": "Mkusanyiko (vipande 10)",
    "Styling session": "Kikao cha mitindo", "Single illustration": "Mchoro mmoja", "Character design": "Ubunifu wa mhusika",
    "Book cover": "Jalada la kitabu", "Comic page": "Ukurasa wa katuni", "Mural design": "Ubunifu wa mchoro wa ukutani",
    "Radio commercial (30s)": "Tangazo la redio (sekunde 30)", "Narration (per minute)": "Usimulizi (kwa dakika)",
    "IVR / phone system": "IVR au mfumo wa simu", "Podcast intro": "Utangulizi wa podcast", "Audiobook (per hour)": "Kitabu cha sauti (kwa saa)",
    "Birthday party": "Sherehe ya kuzaliwa", "Wedding coordination": "Uratibu wa harusi", "Corporate event": "Hafla ya kampuni",
    "Concert / show": "Tamasha au onesho", "Decoration only": "Mapambo pekee", "Half-day project": "Mradi wa nusu siku",
    "Full-day project": "Mradi wa siku nzima", "Multi-day project": "Mradi wa siku kadhaa"
  };

  var form = root.querySelector("form");
  var country = form.elements.country;
  var craft = form.elements.craft;
  var specialty = form.elements.specialty;
  var city = form.elements.city;
  var currency = form.elements.currency;
  var results = root.querySelector("[data-results]");
  var status = root.querySelector("[data-status]");
  var lastReport = null;

  function label(value) { return words[value] || value; }
  function fill(select, rows, valueKey, labeler) {
    select.textContent = "";
    rows.forEach(function (row) {
      var option = document.createElement("option");
      option.value = row[valueKey];
      option.textContent = labeler(row);
      select.appendChild(option);
    });
  }
  function setCountries() {
    fill(country, Object.keys(engine.COUNTRIES).map(function (code) { return { code: code, data: engine.COUNTRIES[code] }; }), "code", function (row) { return label(row.data.name); });
    country.value = "TZ";
  }
  function setCrafts() { fill(craft, engine.CRAFTS, "id", function (row) { return label(row.label); }); }
  function setCurrencies() {
    var seen = {};
    fill(currency, Object.keys(engine.COUNTRIES).map(function (code) { return engine.COUNTRIES[code].currency; }).filter(function (value) {
      if (seen[value]) return false;
      seen[value] = true;
      return true;
    }).map(function (id) { return { id: id }; }), "id", function (row) { return row.id; });
  }
  function refreshSpecialties() {
    var rows = [{ id: "", text: "Huduma ya jumla" }].concat(engine.getSpecialties(craft.value).map(function (value) { return { id: value, text: label(value) }; }));
    fill(specialty, rows, "id", function (row) { return row.text; });
  }
  function refreshCountry() {
    var market = engine.COUNTRIES[country.value];
    var rows = [{ id: "", text: "Mji mwingine au kazi ya mbali" }].concat(engine.getCities(country.value).map(function (value) { return { id: value, text: value }; }));
    fill(city, rows, "id", function (row) { return row.text; });
    if (market) currency.value = market.currency;
  }
  function metric(name, value) { return '<div class="cf-metric"><span>' + name + '</span><strong>' + value + '</strong></div>'; }
  function reportText(report) {
    var craftRow = engine.CRAFTS.find(function (row) { return row.id === report.input.craft; });
    return [
      "Makadirio ya bei ya mtayarishi — AfroTools",
      "Soko: " + label(engine.COUNTRIES[report.input.country].name),
      "Kazi: " + label(craftRow ? craftRow.label : report.input.craft),
      "Bei ya siku: " + report.display.daily,
      "Bei ya saa: " + report.display.hourly,
      "Mradi wa kawaida: " + report.display.project,
      report.disclaimer
    ].join("\n");
  }
  function calculate(event) {
    if (event) event.preventDefault();
    if (!craft.value || !country.value || !engine.COUNTRIES[country.value]) {
      lastReport = null;
      results.hidden = true;
      status.textContent = "Chagua aina ya kazi na soko halali.";
      status.classList.add("cf-error");
      return;
    }
    var input = { craft: craft.value, specialty: specialty.value, country: country.value, city: city.value, experience: form.elements.experience.value, currency: currency.value };
    var rate = engine.calculateRate(input);
    var breakdown = engine.getBreakdown(input.craft, rate);
    var disclaimer = "Haya ni makadirio ya kupanga, si bei rasmi wala ahadi ya soko. Ubadilishaji wa sarafu ni dhana iliyowekwa, si FX ya moja kwa moja. Hakiki sarafu, kazi, haki za matumizi, marekebisho na gharama kabla ya kutuma quotation.";
    lastReport = {
      schemaVersion: 1, tool: "creator-pricing", locale: "sw", generatedAt: new Date().toISOString(), input: input,
      rate: rate, breakdown: breakdown,
      display: { daily: engine.formatRange(rate.daily.min, rate.daily.max, rate.currency), hourly: engine.formatRange(rate.hourly.min, rate.hourly.max, rate.currency), project: engine.formatRange(rate.project.min, rate.project.max, rate.currency) },
      disclaimer: disclaimer
    };
    results.hidden = false;
    results.querySelector("[data-metrics]").innerHTML = metric("Bei ya siku inayopendekezwa", lastReport.display.daily) + metric("Bei ya saa inayopendekezwa", lastReport.display.hourly) + metric("Mradi wa kawaida", lastReport.display.project);
    results.querySelector("[data-breakdown]").innerHTML = breakdown.slice(0, 5).map(function (row) { return "<li><strong>" + label(row.name) + ":</strong> " + engine.formatRange(row.min, row.max, rate.currency) + "</li>"; }).join("");
    results.querySelector("[data-disclaimer]").textContent = disclaimer;
    status.textContent = "Makadirio yamekokotolewa kwenye kifaa chako.";
    status.classList.remove("cf-error");
    root.dispatchEvent(new CustomEvent("swcreatorpricing:report", { detail: lastReport }));
  }
  function download(type) {
    if (!lastReport) calculate();
    if (!lastReport) return;
    var content = type === "json" ? JSON.stringify(lastReport, null, 2) : reportText(lastReport);
    var blob = new Blob([content], { type: type === "json" ? "application/json;charset=utf-8" : "text/plain;charset=utf-8" });
    var href = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "bei-ya-mtayarishi-" + lastReport.input.country.toLowerCase() + "." + type;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(href); }, 0);
    status.textContent = type === "json" ? "Faili ya JSON imepakuliwa." : "Faili ya TXT imepakuliwa.";
  }
  function reset() {
    form.reset();
    country.value = "TZ";
    craft.value = "photography";
    refreshSpecialties();
    refreshCountry();
    lastReport = null;
    results.hidden = true;
    status.textContent = "Fomu imerudishwa kwenye mfano wa Tanzania.";
    status.classList.remove("cf-error");
  }

  form.addEventListener("submit", calculate);
  country.addEventListener("change", refreshCountry);
  craft.addEventListener("change", refreshSpecialties);
  root.querySelector("[data-reset]").addEventListener("click", reset);
  root.querySelector("[data-json]").addEventListener("click", function () { download("json"); });
  root.querySelector("[data-txt]").addEventListener("click", function () { download("txt"); });
  root.querySelector("[data-copy]").addEventListener("click", function () {
    if (!lastReport) calculate();
    if (!lastReport) return;
    var text = reportText(lastReport);
    var done = function () { status.textContent = "Muhtasari umenakiliwa."; };
    var failed = function () { status.textContent = "Kunakili hakukufaulu. Muhtasari umeachwa hapa:\n" + text; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(failed); else failed();
  });

  setCountries();
  setCrafts();
  setCurrencies();
  refreshSpecialties();
  refreshCountry();
})(window, document);

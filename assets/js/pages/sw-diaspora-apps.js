(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.document) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.SwahiliDiaspora = api;
    api.mount(root.document);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var REVIEWED_ON = "2026-07-31";
  var IMMIGRATION_SOURCE_VERSION = "english-owner-blob-829a2b52c4d1-reviewed-2026-07-31";
  var TRACKER_STORAGE_KEY = "afro_sw_visa_timeline_v1";

  var VISA_DOCUMENTS = {
    tourist: [
      "Pasipoti au hati ya kusafiria",
      "Uthibitisho rasmi wa ombi",
      "Risiti ya ada",
      "Orodha rasmi ya njia uliyochagua",
      "Ushahidi wa madhumuni na ratiba ikiwa umeombwa",
      "Ushahidi wa fedha au mdhamini ikiwa umeombwa",
      "Ushahidi wa malazi ikiwa umeombwa",
      "Biometriki, picha, afya, polisi, bima au tafsiri ikiwa zimeombwa"
    ],
    work: [
      "Pasipoti au hati ya kusafiria",
      "Uthibitisho rasmi wa ombi",
      "Ushahidi wa mdhamini au mwajiri",
      "Ushahidi wa taaluma, kibali au ombi",
      "Vyeti au ujuzi ikiwa umeombwa",
      "Orodha rasmi ya njia uliyochagua",
      "Risiti ya ada",
      "Biometriki, afya, polisi au tafsiri ikiwa zimeombwa"
    ],
    student: [
      "Pasipoti au hati ya kusafiria",
      "Uthibitisho rasmi wa ombi",
      "Barua ya udahili au usajili",
      "Ushahidi wa fedha au mdhamini ikiwa umeombwa",
      "Ushahidi wa lugha au masomo ikiwa umeombwa",
      "Orodha rasmi ya njia uliyochagua",
      "Risiti ya ada",
      "Biometriki, afya, polisi au tafsiri ikiwa zimeombwa"
    ],
    pr: [
      "Pasipoti au hati ya kusafiria",
      "Uthibitisho rasmi wa ombi",
      "Mwaliko, uteuzi au ombi ikiwa linahusika",
      "Hati za utambulisho na hali ya kiraia",
      "Ushahidi wa masomo, lugha au kazi ikiwa umeombwa",
      "Orodha rasmi ya njia uliyochagua",
      "Risiti ya ada",
      "Biometriki, afya, polisi au tafsiri ikiwa zimeombwa"
    ],
    family: [
      "Pasipoti au hati ya kusafiria",
      "Uthibitisho rasmi wa ombi",
      "Ushahidi wa hali ya mdhamini",
      "Ushahidi wa uhusiano na hali ya kiraia",
      "Ushahidi wa fedha au malazi ikiwa umeombwa",
      "Orodha rasmi ya njia uliyochagua",
      "Risiti ya ada",
      "Biometriki, afya, polisi au tafsiri ikiwa zimeombwa"
    ]
  };

  var VISA_SOURCES = {
    UK: { label: "Muda rasmi wa visa wa Uingereza", href: "https://www.gov.uk/guidance/visa-processing-times-applications-outside-the-uk" },
    CA: { label: "Muda rasmi wa uchakataji wa Canada", href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/application/check-processing-times.html" },
    AU: { label: "Muda rasmi wa uchakataji wa Australia", href: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-processing-times" },
    US: { label: "Muda rasmi wa miadi ya visa ya Marekani", href: "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/wait-times.html" },
    AE: { label: "Huduma rasmi za ICP za Falme za Kiarabu", href: "https://icp.gov.ae/en/" },
    SC: { label: "Utaratibu rasmi wa visa ya Schengen", href: "https://home-affairs.ec.europa.eu/policies/schengen/visa-policy/applying-schengen-visa_en" }
  };

  function finiteNumber(value) {
    if (value === null || value === undefined || (typeof value === "string" && !value.trim())) return NaN;
    var number = Number(value);
    return Number.isFinite(number) ? number : NaN;
  }

  function calculateCanada(input) {
    var age = finiteNumber(input.age);
    var education = finiteNumber(input.education);
    var clb = finiteNumber(input.clb);
    var canadianExperience = finiteNumber(input.canadianExperience);
    var foreignYears = finiteNumber(input.foreignYears);
    var nomination = finiteNumber(input.nomination);
    var sibling = finiteNumber(input.sibling);
    var canadianStudy = finiteNumber(input.canadianStudy);
    var educationIndex = Number(input.educationIndex);
    var canadianExperienceIndex = Number(input.canadianExperienceIndex);
    if ([age, education, clb, canadianExperience, foreignYears, nomination, sibling, canadianStudy].some(function (value) { return !Number.isFinite(value); })) {
      return { ok: false, error: "Chagua thamani sahihi katika kila sehemu ya Canada." };
    }
    var languagePerAbility = ({ 3: 0, 4: 6, 5: 6, 6: 9, 7: 17, 8: 23, 9: 31, 10: 34 })[clb] || 0;
    var languageTotal = languagePerAbility * 4;
    var basicEducation = educationIndex >= 2 && educationIndex <= 4;
    var advancedEducation = educationIndex >= 5;
    var educationLanguage = 0;
    if (clb >= 7 && (basicEducation || advancedEducation)) {
      educationLanguage = clb >= 9 ? (advancedEducation ? 50 : 25) : (advancedEducation ? 25 : 13);
    }
    var educationCanada = 0;
    if (canadianExperienceIndex >= 1 && (basicEducation || advancedEducation)) {
      educationCanada = canadianExperienceIndex >= 2 ? (advancedEducation ? 50 : 25) : (advancedEducation ? 25 : 13);
    }
    var educationTransfer = Math.min(50, educationLanguage + educationCanada);
    var foreignLanguage = 0;
    if (foreignYears && clb >= 7) {
      foreignLanguage = clb >= 9 ? (foreignYears >= 3 ? 50 : 25) : (foreignYears >= 3 ? 25 : 13);
    }
    var foreignCanada = 0;
    if (foreignYears && canadianExperienceIndex >= 1) {
      foreignCanada = canadianExperienceIndex >= 2 ? (foreignYears >= 3 ? 50 : 25) : (foreignYears >= 3 ? 25 : 13);
    }
    var transferability = Math.min(100, educationTransfer + Math.min(50, foreignLanguage + foreignCanada));
    var total = age + education + languageTotal + canadianExperience + transferability + nomination + sibling + canadianStudy;
    return {
      ok: true,
      route: "Canada Express Entry",
      score: total,
      scoreLabel: total + " pointi",
      subtitle: "Kiwango cha juu cha CRS ni 1,200; karatasi hii inaacha baadhi ya vipengele.",
      tone: "warn",
      verdict: "Haya ni makisio ya vipengele vilivyochaguliwa, si utabiri wa mwaliko. Kizingiti hubadilika kwa kila raundi na kundi.",
      breakdown: [
        ["Umri", age], ["Elimu", education], ["Lugha ya kwanza (CLB sawa kwa stadi 4)", languageTotal],
        ["Uzoefu wa kazi Canada", canadianExperience], ["Uhamishikaji wa ujuzi uliochaguliwa", transferability],
        ["Uteuzi wa jimbo au eneo", nomination], ["Ndugu Canada", sibling], ["Masomo Canada", canadianStudy],
        ["Jumla ya vipengele vilivyochaguliwa", total]
      ],
      recommendation: "Rudia wasifu katika kikokotoo rasmi cha CRS cha IRCC, ongeza vipengele vyote vilivyoachwa na uangalie raundi ya hivi karibuni.",
      sourceVersion: IMMIGRATION_SOURCE_VERSION
    };
  }

  function calculateAustralia(input) {
    var age = finiteNumber(input.age);
    var education = finiteNumber(input.education);
    var english = finiteNumber(input.english);
    var outsideExperience = finiteNumber(input.outsideExperience);
    var australiaExperience = finiteNumber(input.australiaExperience);
    var nomination = finiteNumber(input.nomination);
    var australiaStudy = finiteNumber(input.australiaStudy);
    var partner = finiteNumber(input.partner);
    if ([age, education, english, outsideExperience, australiaExperience, nomination, australiaStudy, partner].some(function (value) { return !Number.isFinite(value); })) {
      return { ok: false, error: "Chagua thamani sahihi katika kila sehemu ya Australia." };
    }
    var employment = Math.min(20, outsideExperience + australiaExperience);
    var total = age + education + english + employment + nomination + australiaStudy + partner;
    return {
      ok: true,
      route: "Australia — uhamiaji wa ujuzi",
      score: total,
      scoreLabel: total + " pointi",
      subtitle: "Kizingiti cha chini ni pointi 65; mwaliko haujahakikishwa.",
      tone: total >= 65 ? "warn" : "danger",
      verdict: total >= 65
        ? "Jumla imefikia pointi 65. Taaluma, tathmini ya ujuzi, subclass, raundi na masharti ya jimbo bado lazima vihakikiwe."
        : "Jumla iko chini ya pointi 65 zinazohitajika kwa expression of interest.",
      breakdown: [
        ["Umri", age], ["Sifa", education], ["Kiingereza", english],
        ["Uzoefu nje na ndani ya Australia (kikomo 20)", employment],
        ["Uteuzi au udhamini unaokubalika wa 491", nomination], ["Masomo Australia", australiaStudy],
        ["Mwenza au mwombaji pekee", partner], ["Jumla ya vipengele vilivyochaguliwa", total]
      ],
      recommendation: "Hakiki kila kipengele katika jedwali rasmi, orodha ya taaluma na mamlaka husika ya tathmini.",
      sourceVersion: IMMIGRATION_SOURCE_VERSION
    };
  }

  function calculateUk(input) {
    var sponsorship = finiteNumber(input.sponsorship);
    var occupation = finiteNumber(input.occupation);
    var english = finiteNumber(input.english);
    var salary = finiteNumber(input.salary);
    var salaryFloor = finiteNumber(input.salaryFloor);
    var goingRateMet = Boolean(input.goingRateMet);
    if ([sponsorship, occupation, english, salary, salaryFloor].some(function (value) { return !Number.isFinite(value); })) {
      return { ok: false, error: "Weka mshahara halali na kila sharti la njia ya Uingereza." };
    }
    if (salary < 0) return { ok: false, error: "Mshahara wa mwaka hauwezi kuwa hasi." };
    var salaryPoints = salary >= salaryFloor && goingRateMet ? 20 : 0;
    var mandatory = sponsorship + occupation + english;
    var total = mandatory + salaryPoints;
    var passed = mandatory >= 50 && total >= 70;
    var verdict = passed
      ? "Majibu yamefikia pointi 70, bila kuthibitisha mdhamini, Certificate of Sponsorship, SOC code, ushahidi au going rate."
      : mandatory < 50
        ? "Pointi 50 za lazima hazijatimia: udhamini, taaluma inayokubalika na Kiingereza lazima zithibitishwe."
        : "Njia ya mshahara haijathibitishwa: kiwango ulichochagua na going rate ya taaluma lazima vyote vitimie.";
    return {
      ok: true,
      route: "Uingereza — Skilled Worker",
      score: total,
      scoreLabel: total + " / 70",
      subtitle: "Pointi 50 za lazima na njia ya mshahara yenye pointi 20.",
      tone: passed ? "warn" : "danger",
      verdict: verdict,
      breakdown: [
        ["Udhamini", sponsorship], ["Taaluma inayokubalika ya SOC 2020", occupation], ["Kiingereza", english],
        ["Njia ya mshahara iliyochaguliwa", salaryPoints],
        ["Mshahara wa mwaka uliowekwa", "£" + salary.toLocaleString("en-GB")],
        ["Going rate imethibitishwa", goingRateMet ? "Ndiyo" : "Hapana"],
        ["Jumla ya ukaguzi uliochaguliwa", total]
      ],
      recommendation: "Mwombe mdhamini athibitishe kwa maandishi SOC code, cheti, mshahara wa msingi, saa, chaguo la pointi na going rate iliyorekebishwa kwa saa.",
      sourceVersion: IMMIGRATION_SOURCE_VERSION
    };
  }

  function calendarFactor(unit) {
    if (unit === "business-days") return 7 / 5;
    if (unit === "weeks") return 7;
    if (unit === "months") return 30.4375;
    return 1;
  }

  function localCalendarDay(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
    if (!match) return NaN;
    var year = Number(match[1]);
    var month = Number(match[2]);
    var day = Number(match[3]);
    var serial = Date.UTC(year, month - 1, day);
    var checked = new Date(serial);
    if (checked.getUTCFullYear() !== year || checked.getUTCMonth() !== month - 1 || checked.getUTCDate() !== day) return NaN;
    return serial;
  }

  function calculateTimeline(input, nowValue) {
    var destination = String(input.destination || "");
    var visaType = String(input.visaType || "");
    var minimum = finiteNumber(input.minimum);
    var maximum = finiteNumber(input.maximum);
    var unit = String(input.unit || "days");
    var submittedDay = localCalendarDay(input.submitted);
    var source = VISA_SOURCES[destination];
    var documents = VISA_DOCUMENTS[visaType];
    if (!source) return { ok: false, error: "Chagua mamlaka ya nchi unayoenda." };
    if (!documents) return { ok: false, error: "Chagua aina ya ombi." };
    if (!Number.isFinite(submittedDay)) return { ok: false, error: "Weka tarehe halisi inayotumiwa na chanzo rasmi." };
    if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum <= 0 || maximum <= 0) {
      return { ok: false, error: "Weka kiwango rasmi cha chini na cha juu kilicho chanya." };
    }
    if (maximum < minimum) return { ok: false, error: "Kiwango cha juu lazima kiwe sawa au kikubwa kuliko cha chini." };
    if (!["days", "business-days", "weeks", "months"].includes(unit)) return { ok: false, error: "Chagua kipimo halali cha muda." };
    var now = nowValue ? new Date(nowValue) : new Date();
    if (Number.isNaN(now.getTime())) return { ok: false, error: "Tarehe ya ndani ya marejeo si halali." };
    var todayDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    var dayMs = 86400000;
    var elapsed = Math.floor((todayDay - submittedDay) / dayMs);
    if (elapsed < 0) return { ok: false, error: "Tarehe haiwezi kuwa ya baadaye." };
    var minDays = Math.ceil(minimum * calendarFactor(unit));
    var maxDays = Math.ceil(maximum * calendarFactor(unit));
    var checks = Array.isArray(input.checks) ? input.checks.map(Boolean).slice(0, documents.length) : [];
    while (checks.length < documents.length) checks.push(false);
    var checkedCount = checks.filter(Boolean).length;
    var status = elapsed < minDays
      ? "Kabla ya tarehe ya kwanza katika dirisha lako la kupanga."
      : elapsed <= maxDays
        ? "Ndani ya dirisha lako la kupanga. Angalia portal rasmi kwa hali ya ombi."
        : "Baada ya dirisha lako la kupanga. Angalia portal rasmi kabla ya kufuatilia.";
    return {
      ok: true,
      schemaVersion: 1,
      reviewedOn: REVIEWED_ON,
      destination: destination,
      visaType: visaType,
      submitted: input.submitted,
      minimum: minimum,
      maximum: maximum,
      unit: unit,
      checks: checks,
      elapsedDays: elapsed,
      minimumCalendarDays: minDays,
      maximumCalendarDays: maxDays,
      earliestDate: new Date(submittedDay + minDays * dayMs).toISOString().slice(0, 10),
      latestDate: new Date(submittedDay + maxDays * dayMs).toISOString().slice(0, 10),
      today: new Date(todayDay).toISOString().slice(0, 10),
      progress: Math.min(100, Math.round((elapsed / maxDays) * 100)),
      checkedCount: checkedCount,
      documentCount: documents.length,
      missingDocuments: documents.filter(function (_document, index) { return !checks[index]; }),
      status: status,
      source: source
    };
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function textDownload(filename, content, type) {
    var blob = new Blob([content], { type: type || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  function copyText(value, done) {
    function fallback() {
      var area = document.createElement("textarea");
      area.value = value;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      var copied = false;
      try { copied = document.execCommand("copy"); } catch (_error) { copied = false; }
      area.remove();
      done(copied);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(function () { done(true); }).catch(fallback);
    } else fallback();
  }

  function formatDate(value) {
    var serial = localCalendarDay(value);
    if (!Number.isFinite(serial)) return value;
    var day = new Date(serial);
    var localDate = new Date(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate());
    return localDate.toLocaleDateString("sw-TZ", { day: "2-digit", month: "short", year: "numeric" });
  }

  function immigrationSummary(result) {
    return [
      "AfroTools — ukaguzi wa pointi za uhamiaji", "Njia: " + result.route, "Matokeo: " + result.scoreLabel,
      result.subtitle, "", result.breakdown.map(function (row) { return row[0] + ": " + row[1]; }).join("\n"), "",
      "Kikomo: " + result.verdict, "Hatua inayofuata: " + result.recommendation,
      "Vyanzo rasmi vilikaguliwa " + REVIEWED_ON + ".",
      "Taarifa ya jumla tu; si uamuzi wa sifa wala ushauri wa kisheria au uhamiaji."
    ].join("\n");
  }

  function timelineSummary(result) {
    return [
      "AfroTools — kalenda binafsi ya ombi la visa", "Mamlaka: " + result.destination,
      "Tarehe iliyowekwa: " + formatDate(result.submitted), "Siku za kalenda zilizopita: " + result.elapsedDays,
      "Dirisha: " + result.minimum + " hadi " + result.maximum + " (" + result.unit + ")",
      "Tarehe ya kwanza ya kupanga: " + formatDate(result.earliestDate),
      "Tarehe ya mwisho ya kupanga: " + formatDate(result.latestDate),
      "Vipengele vilivyotiwa alama: " + result.checkedCount + " / " + result.documentCount,
      "Hali: " + result.status, "Chanzo: " + result.source.href,
      "Hakuna hali rasmi ya ombi inayokisiwa. Hakiki portal ya mamlaka."
    ].join("\n");
  }

  function mountTheme(documentRef) {
    var button = documentRef.querySelector("[data-fd-theme]");
    if (!button) return;
    button.addEventListener("click", function () {
      var current = documentRef.documentElement.getAttribute("data-theme");
      var next = current === "dark" ? "light" : "dark";
      documentRef.documentElement.setAttribute("data-theme", next);
      button.setAttribute("aria-pressed", next === "dark" ? "true" : "false");
      button.textContent = next === "dark" ? "Mandhari nyepesi" : "Mandhari nyeusi";
    });
  }

  function mountImmigration(documentRef) {
    var form = documentRef.getElementById("fd-immigration-form");
    if (!form) return;
    var tabs = Array.prototype.slice.call(documentRef.querySelectorAll("[data-fd-tab]"));
    var panels = Array.prototype.slice.call(documentRef.querySelectorAll("[data-fd-panel]"));
    var error = documentRef.getElementById("fd-immigration-error");
    var results = documentRef.getElementById("fd-immigration-results");
    var status = documentRef.getElementById("fd-immigration-status");
    var currentResult = null;
    var activeRoute = "CA";
    var routeFields = {
      CA: ["fd-ca-age", "fd-ca-education", "fd-ca-clb", "fd-ca-canada-experience", "fd-ca-foreign-experience", "fd-ca-nomination", "fd-ca-sibling", "fd-ca-study"],
      AU: ["fd-au-age", "fd-au-education", "fd-au-english", "fd-au-outside-experience", "fd-au-australia-experience", "fd-au-nomination", "fd-au-study", "fd-au-partner"],
      UK: ["fd-uk-sponsorship", "fd-uk-occupation", "fd-uk-english", "fd-uk-salary", "fd-uk-route", "fd-uk-going-rate"]
    };

    function clearImmigration(message) {
      currentResult = null;
      results.hidden = true;
      error.textContent = "";
      if (message) status.textContent = message;
    }

    function selectTab(route, focus) {
      activeRoute = route;
      tabs.forEach(function (tab) {
        var selected = tab.getAttribute("data-fd-tab") === route;
        tab.setAttribute("aria-selected", selected ? "true" : "false");
        tab.tabIndex = selected ? 0 : -1;
        if (selected && focus) tab.focus();
      });
      panels.forEach(function (panel) { panel.hidden = panel.getAttribute("data-fd-panel") !== route; });
      clearImmigration();
      status.textContent = "Hakuna matokeo yanayohifadhiwa au kutumwa.";
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () { selectTab(tab.getAttribute("data-fd-tab"), false); });
      tab.addEventListener("keydown", function (event) {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        var nextIndex = index;
        if (event.key === "ArrowLeft") nextIndex = (index + tabs.length - 1) % tabs.length;
        if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = tabs.length - 1;
        selectTab(tabs[nextIndex].getAttribute("data-fd-tab"), true);
      });
    });

    function selectValue(id) {
      var element = documentRef.getElementById(id);
      return { value: element.value, index: element.selectedIndex };
    }

    function immigrationStateFromForm() {
      var fields = {};
      routeFields[activeRoute].forEach(function (id) {
        var element = documentRef.getElementById(id);
        fields[id] = { value: element.value, selectedIndex: element.tagName === "SELECT" ? element.selectedIndex : null };
      });
      return { activeRoute: activeRoute, fields: fields };
    }

    function applyImmigrationState(state) {
      if (!state || !routeFields[state.activeRoute] || !state.fields || typeof state.fields !== "object") return false;
      selectTab(state.activeRoute, false);
      var valid = routeFields[state.activeRoute].every(function (id) {
        if (!Object.prototype.hasOwnProperty.call(state.fields, id) || !state.fields[id] || typeof state.fields[id] !== "object") return false;
        var element = documentRef.getElementById(id);
        var field = state.fields[id];
        if (element.tagName === "SELECT") {
          if (!Number.isInteger(field.selectedIndex) || field.selectedIndex < 0 || field.selectedIndex >= element.options.length) return false;
          element.selectedIndex = field.selectedIndex;
        } else {
          element.value = String(field.value);
        }
        return element.value === String(field.value);
      });
      if (!valid) clearImmigration("Export ina ingizo lisilotambulika kwa toleo hili.");
      return valid;
    }

    function calculate() {
      var result;
      if (activeRoute === "CA") {
        var education = selectValue("fd-ca-education");
        var experience = selectValue("fd-ca-canada-experience");
        result = calculateCanada({
          age: documentRef.getElementById("fd-ca-age").value,
          education: education.value,
          educationIndex: education.index,
          clb: documentRef.getElementById("fd-ca-clb").value,
          canadianExperience: experience.value,
          canadianExperienceIndex: experience.index,
          foreignYears: documentRef.getElementById("fd-ca-foreign-experience").value,
          nomination: documentRef.getElementById("fd-ca-nomination").value,
          sibling: documentRef.getElementById("fd-ca-sibling").value,
          canadianStudy: documentRef.getElementById("fd-ca-study").value
        });
      } else if (activeRoute === "AU") {
        result = calculateAustralia({
          age: documentRef.getElementById("fd-au-age").value,
          education: documentRef.getElementById("fd-au-education").value,
          english: documentRef.getElementById("fd-au-english").value,
          outsideExperience: documentRef.getElementById("fd-au-outside-experience").value,
          australiaExperience: documentRef.getElementById("fd-au-australia-experience").value,
          nomination: documentRef.getElementById("fd-au-nomination").value,
          australiaStudy: documentRef.getElementById("fd-au-study").value,
          partner: documentRef.getElementById("fd-au-partner").value
        });
      } else {
        result = calculateUk({
          sponsorship: documentRef.getElementById("fd-uk-sponsorship").value,
          occupation: documentRef.getElementById("fd-uk-occupation").value,
          english: documentRef.getElementById("fd-uk-english").value,
          salary: documentRef.getElementById("fd-uk-salary").value,
          salaryFloor: documentRef.getElementById("fd-uk-route").value,
          goingRateMet: documentRef.getElementById("fd-uk-going-rate").value === "1"
        });
      }
      if (!result.ok) {
        currentResult = null;
        results.hidden = true;
        error.textContent = result.error;
        error.focus();
        return;
      }
      currentResult = result;
      error.textContent = "";
      documentRef.getElementById("fd-result-route").textContent = result.route;
      documentRef.getElementById("fd-result-score").textContent = result.scoreLabel;
      documentRef.getElementById("fd-result-subtitle").textContent = result.subtitle;
      var verdict = documentRef.getElementById("fd-result-verdict");
      verdict.textContent = result.verdict;
      verdict.setAttribute("data-tone", result.tone);
      documentRef.getElementById("fd-result-breakdown").innerHTML = result.breakdown.map(function (row) {
        return '<div class="fd-breakdown-row"><span>' + escapeHtml(row[0]) + "</span><strong>" + escapeHtml(row[1]) + "</strong></div>";
      }).join("");
      documentRef.getElementById("fd-result-recommendation").textContent = result.recommendation;
      results.hidden = false;
      status.textContent = "Matokeo yamekokotolewa ndani ya kivinjari.";
      results.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    form.addEventListener("submit", function (event) { event.preventDefault(); calculate(); });
    form.addEventListener("input", function () {
      if (!currentResult) return;
      currentResult = null;
      results.hidden = true;
      status.textContent = "Umebadilisha taarifa; kokotoa tena.";
    });
    form.addEventListener("reset", function () { setTimeout(function () { selectTab("CA", false); }, 0); });
    documentRef.getElementById("fd-immigration-copy").addEventListener("click", function () {
      if (!currentResult) return void (status.textContent = "Kokotoa matokeo kabla ya kunakili.");
      copyText(immigrationSummary(currentResult), function (copied) { status.textContent = copied ? "Muhtasari umenakiliwa." : "Kivinjari kimezuia kunakili."; });
    });
    documentRef.getElementById("fd-immigration-txt").addEventListener("click", function () {
      if (!currentResult) return void (status.textContent = "Kokotoa matokeo kabla ya kupakua.");
      textDownload("ukaguzi-pointi-uhamiaji.txt", immigrationSummary(currentResult));
      status.textContent = "Faili ya TXT imetengenezwa ndani ya kivinjari.";
    });
    documentRef.getElementById("fd-immigration-json").addEventListener("click", function () {
      if (!currentResult) return void (status.textContent = "Kokotoa matokeo kabla ya kupakua.");
      textDownload("ukaguzi-pointi-uhamiaji.json", JSON.stringify({
        schemaVersion: 1, app: "immigration-points", locale: "sw", generatedAt: new Date().toISOString(),
        sourceVersion: IMMIGRATION_SOURCE_VERSION, input: immigrationStateFromForm(),
        disclaimer: "Taarifa ya jumla tu; si uamuzi wa sifa.", result: currentResult
      }, null, 2), "application/json;charset=utf-8");
      status.textContent = "Faili ya JSON imetengenezwa ndani ya kivinjari.";
    });
    documentRef.getElementById("fd-immigration-print").addEventListener("click", function () {
      if (!currentResult) return void (status.textContent = "Kokotoa matokeo kabla ya kuchapisha.");
      status.textContent = "Kidirisha cha kuchapisha kinafunguliwa. Chagua Hifadhi kama PDF ikiwa kinapatikana.";
      window.print();
    });
    documentRef.getElementById("fd-immigration-import").addEventListener("change", function (event) {
      var file = event.target.files && event.target.files[0];
      event.target.value = "";
      clearImmigration("Export inakaguliwa ndani ya kivinjari.");
      if (!file) return;
      if (file.size > 200000) return void (status.textContent = "Faili imekataliwa: ukubwa wa juu ni KB 200.");
      var reader = new FileReader();
      reader.onload = function () {
        var payload;
        try { payload = JSON.parse(String(reader.result || "")); } catch (_error) { return void (status.textContent = "Faili ya JSON haisomeki."); }
        if (!payload || payload.schemaVersion !== 1 || payload.app !== "immigration-points" || payload.locale !== "sw" || payload.sourceVersion !== IMMIGRATION_SOURCE_VERSION || !applyImmigrationState(payload.input)) {
          return void clearImmigration("Hii si export halali ya toleo hili la kikokotoo.");
        }
        calculate();
        if (!currentResult) return void (status.textContent = "Export ina taarifa zisizo halali; hakuna matokeo yaliyofunguliwa.");
        status.textContent = "Export ya JSON imefunguliwa na kukokotolewa upya ndani ya kivinjari.";
      };
      reader.onerror = function () { clearImmigration("Faili imeshindwa kusomwa ndani ya kivinjari."); };
      reader.readAsText(file);
    });
  }

  function mountVisaTracker(documentRef) {
    var form = documentRef.getElementById("fd-visa-form");
    if (!form) return;
    var grid = documentRef.getElementById("fd-visa-documents");
    var sourceLink = documentRef.getElementById("fd-visa-source-link");
    var error = documentRef.getElementById("fd-visa-error");
    var status = documentRef.getElementById("fd-visa-status");
    var results = documentRef.getElementById("fd-visa-results");
    var currentResult = null;

    function clearVisaResult(message) {
      currentResult = null;
      results.hidden = true;
      error.textContent = "";
      if (message) status.textContent = message;
    }

    function stateFromForm() {
      return {
        destination: documentRef.getElementById("fd-visa-destination").value,
        visaType: documentRef.getElementById("fd-visa-type").value,
        submitted: documentRef.getElementById("fd-visa-submitted").value,
        minimum: documentRef.getElementById("fd-visa-minimum").value,
        maximum: documentRef.getElementById("fd-visa-maximum").value,
        unit: documentRef.getElementById("fd-visa-unit").value,
        checks: Array.prototype.map.call(grid.querySelectorAll('input[type="checkbox"]'), function (input) { return input.checked; })
      };
    }

    function updateSource() {
      var source = VISA_SOURCES[documentRef.getElementById("fd-visa-destination").value];
      if (!source) {
        sourceLink.href = "/sw/diaspora/";
        sourceLink.textContent = "Chagua mamlaka kwanza";
        sourceLink.removeAttribute("target");
        sourceLink.removeAttribute("rel");
      } else {
        sourceLink.href = source.href;
        sourceLink.textContent = source.label;
        sourceLink.target = "_blank";
        sourceLink.rel = "noopener noreferrer";
      }
    }

    function invalidate() {
      if (!currentResult) return;
      clearVisaResult("Umebadilisha taarifa; tengeneza kalenda tena.");
    }

    function renderDocuments(checks) {
      var documents = VISA_DOCUMENTS[documentRef.getElementById("fd-visa-type").value] || [];
      grid.innerHTML = documents.map(function (label, index) {
        var checked = Boolean(checks && checks[index]);
        return '<label class="fd-doc-item" data-checked="' + checked + '"><input type="checkbox" value="' + index + '"' + (checked ? " checked" : "") + "><span>" + escapeHtml(label) + "</span></label>";
      }).join("");
      Array.prototype.forEach.call(grid.querySelectorAll('input[type="checkbox"]'), function (input) {
        input.addEventListener("change", function () {
          input.closest(".fd-doc-item").setAttribute("data-checked", input.checked ? "true" : "false");
          invalidate();
        });
      });
    }

    function renderResult(result) {
      currentResult = result;
      error.textContent = "";
      documentRef.getElementById("fd-visa-elapsed").textContent = result.elapsedDays + " siku";
      documentRef.getElementById("fd-visa-result-status").textContent = result.status;
      documentRef.getElementById("fd-visa-progress").style.width = result.progress + "%";
      documentRef.getElementById("fd-visa-timeline").innerHTML = [
        ["Tarehe iliyowekwa", formatDate(result.submitted)], ["Leo", formatDate(result.today)],
        ["Tarehe ya kwanza ya kupanga", formatDate(result.earliestDate)], ["Tarehe ya mwisho ya kupanga", formatDate(result.latestDate)]
      ].map(function (row) {
        return '<div class="fd-timeline-row"><span>' + escapeHtml(row[0]) + "</span><strong>" + escapeHtml(row[1]) + "</strong></div>";
      }).join("");
      documentRef.getElementById("fd-visa-document-result").innerHTML =
        "<strong>Vipengele " + result.checkedCount + " kati ya " + result.documentCount + " vimetiwa alama.</strong>" +
        "<p>Orodha hii ni ya jumla na haibadilishi orodha rasmi ya njia yako.</p>" +
        (result.missingDocuments.length
          ? '<ul class="fd-next-list">' + result.missingDocuments.map(function (item) { return "<li>Kagua: " + escapeHtml(item) + "</li>"; }).join("") + "</ul>"
          : "<p>Vipengele vyote vya jumla vimetiwa alama; bado hakiki orodha rasmi.</p>");
      documentRef.getElementById("fd-visa-next").innerHTML =
        "<li>Angalia portal rasmi kwa hali au sasisho lolote.</li><li>Thibitisha tarehe rasmi ambayo muda huanza.</li>" +
        "<li>Soma orodha ya hati ya njia na nchi ya kuwasilisha.</li><li>Usiweke nafasi isiyorejeshewa fedha kwa kutegemea dirisha hili.</li>";
      results.hidden = false;
      status.textContent = "Kalenda imekokotolewa ndani ya kivinjari; hakuna kilichohifadhiwa moja kwa moja.";
      results.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function buildTimeline() {
      var result = calculateTimeline(stateFromForm());
      if (!result.ok) {
        currentResult = null;
        results.hidden = true;
        error.textContent = result.error;
        error.focus();
        return;
      }
      renderResult(result);
    }

    documentRef.getElementById("fd-visa-destination").addEventListener("change", function () { updateSource(); invalidate(); });
    documentRef.getElementById("fd-visa-type").addEventListener("change", function () { renderDocuments(); invalidate(); });
    form.addEventListener("input", invalidate);
    form.addEventListener("submit", function (event) { event.preventDefault(); buildTimeline(); });
    form.addEventListener("reset", function () {
      setTimeout(function () {
        renderDocuments();
        updateSource();
        currentResult = null;
        results.hidden = true;
        error.textContent = "";
        status.textContent = "Hakuna taarifa inayohifadhiwa moja kwa moja.";
      }, 0);
    });
    documentRef.getElementById("fd-visa-save").addEventListener("click", function () {
      if (!currentResult) return void (status.textContent = "Tengeneza kalenda kabla ya kuhifadhi.");
      try {
        localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify({
          schemaVersion: 1, locale: "sw", savedAt: new Date().toISOString(), state: stateFromForm()
        }));
        status.textContent = "Imehifadhiwa katika kivinjari hiki pekee.";
      } catch (_error) { status.textContent = "Kivinjari kimezuia hifadhi ya ndani."; }
    });
    documentRef.getElementById("fd-visa-delete").addEventListener("click", function () {
      try { localStorage.removeItem(TRACKER_STORAGE_KEY); } catch (_error) {}
      form.reset();
      status.textContent = "Nakala ya ndani imefutwa.";
    });
    documentRef.getElementById("fd-visa-copy").addEventListener("click", function () {
      if (!currentResult) return void (status.textContent = "Tengeneza kalenda kabla ya kunakili.");
      copyText(timelineSummary(currentResult), function (copied) { status.textContent = copied ? "Muhtasari umenakiliwa." : "Kivinjari kimezuia kunakili."; });
    });
    documentRef.getElementById("fd-visa-txt").addEventListener("click", function () {
      if (!currentResult) return void (status.textContent = "Tengeneza kalenda kabla ya kupakua.");
      textDownload("kalenda-ombi-visa.txt", timelineSummary(currentResult));
      status.textContent = "Faili ya TXT imetengenezwa ndani ya kivinjari.";
    });
    documentRef.getElementById("fd-visa-json").addEventListener("click", function () {
      if (!currentResult) return void (status.textContent = "Tengeneza kalenda kabla ya kupakua.");
      textDownload("kalenda-ombi-visa.json", JSON.stringify({
        schemaVersion: 1, locale: "sw", exportedAt: new Date().toISOString(),
        state: stateFromForm(), result: currentResult,
        disclaimer: "Ni ya kupanga tu; hakuna hali rasmi inayokisiwa."
      }, null, 2), "application/json;charset=utf-8");
      status.textContent = "Faili ya JSON imetengenezwa ndani ya kivinjari.";
    });
    documentRef.getElementById("fd-visa-print").addEventListener("click", function () {
      if (!currentResult) return void (status.textContent = "Tengeneza kalenda kabla ya kuchapisha.");
      status.textContent = "Kidirisha cha kuchapisha kinafunguliwa. Chagua Hifadhi kama PDF ikiwa kinapatikana.";
      window.print();
    });
    documentRef.getElementById("fd-visa-import").addEventListener("change", function (event) {
      var file = event.target.files && event.target.files[0];
      event.target.value = "";
      clearVisaResult("Export inakaguliwa ndani ya kivinjari.");
      if (!file) return;
      if (file.size > 200000) return void (status.textContent = "Faili imekataliwa: ukubwa wa juu ni KB 200.");
      var reader = new FileReader();
      reader.onload = function () {
        var payload;
        try { payload = JSON.parse(String(reader.result || "")); } catch (_error) { return void clearVisaResult("Faili ya JSON haisomeki."); }
        var state = payload && payload.schemaVersion === 1 && payload.locale === "sw" && payload.state;
        if (!state || !VISA_SOURCES[state.destination] || !VISA_DOCUMENTS[state.visaType]) {
          return void clearVisaResult("Hii si faili sahihi ya kalenda ya AfroTools.");
        }
        documentRef.getElementById("fd-visa-destination").value = state.destination;
        documentRef.getElementById("fd-visa-type").value = state.visaType;
        documentRef.getElementById("fd-visa-submitted").value = state.submitted || "";
        documentRef.getElementById("fd-visa-minimum").value = state.minimum || "";
        documentRef.getElementById("fd-visa-maximum").value = state.maximum || "";
        documentRef.getElementById("fd-visa-unit").value = state.unit || "days";
        renderDocuments(state.checks);
        updateSource();
        var result = calculateTimeline(state);
        if (!result.ok) return void clearVisaResult("Faili ina taarifa zisizo halali: " + result.error);
        renderResult(result);
        status.textContent = "Export ya JSON imefunguliwa tena ndani ya kivinjari.";
      };
      reader.onerror = function () { clearVisaResult("Faili imeshindwa kusomwa ndani ya kivinjari."); };
      reader.readAsText(file);
    });

    function restoreLocal() {
      var payload;
      try { payload = JSON.parse(localStorage.getItem(TRACKER_STORAGE_KEY) || "null"); } catch (_error) { payload = null; }
      var state = payload && payload.schemaVersion === 1 && payload.locale === "sw" && payload.state;
      if (!state || !VISA_SOURCES[state.destination] || !VISA_DOCUMENTS[state.visaType]) return;
      documentRef.getElementById("fd-visa-destination").value = state.destination;
      documentRef.getElementById("fd-visa-type").value = state.visaType;
      documentRef.getElementById("fd-visa-submitted").value = state.submitted || "";
      documentRef.getElementById("fd-visa-minimum").value = state.minimum || "";
      documentRef.getElementById("fd-visa-maximum").value = state.maximum || "";
      documentRef.getElementById("fd-visa-unit").value = state.unit || "days";
      renderDocuments(state.checks);
      updateSource();
      var result = calculateTimeline(state);
      if (result.ok) {
        renderResult(result);
        status.textContent = "Nakala imerejeshwa kutoka kivinjari hiki.";
      }
    }

    renderDocuments();
    updateSource();
    restoreLocal();
  }

  function mount(documentRef) {
    function ready() {
      mountTheme(documentRef);
      mountImmigration(documentRef);
      mountVisaTracker(documentRef);
    }
    if (documentRef.readyState === "loading") documentRef.addEventListener("DOMContentLoaded", ready, { once: true });
    else ready();
  }

  return {
    REVIEWED_ON: REVIEWED_ON,
    IMMIGRATION_SOURCE_VERSION: IMMIGRATION_SOURCE_VERSION,
    TRACKER_STORAGE_KEY: TRACKER_STORAGE_KEY,
    VISA_DOCUMENTS: VISA_DOCUMENTS,
    VISA_SOURCES: VISA_SOURCES,
    calculateCanada: calculateCanada,
    calculateAustralia: calculateAustralia,
    calculateUk: calculateUk,
    calculateTimeline: calculateTimeline,
    calendarFactor: calendarFactor,
    immigrationSummary: immigrationSummary,
    timelineSummary: timelineSummary,
    mount: mount
  };
});

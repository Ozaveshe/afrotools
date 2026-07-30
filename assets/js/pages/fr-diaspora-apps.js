(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.document) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.FrenchDiaspora = api;
    api.mount(root.document);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var REVIEWED_ON = "2026-07-29";
  var IMMIGRATION_SOURCE_VERSION = "english-owner-8ce5cac1-reviewed-2026-07-29";
  var TRACKER_STORAGE_KEY = "afro_fr_visa_timeline_v1";

  var VISA_DOCUMENTS = {
    tourist: [
      "Passeport ou document de voyage",
      "Confirmation officielle de la demande",
      "Reçu de paiement des frais",
      "Liste officielle de la voie consultée",
      "Preuve du motif et itinéraire si demandée",
      "Preuve financière ou du répondant si demandée",
      "Preuve d’hébergement ou d’accueil si demandée",
      "Biométrie, photo, santé, police, assurance ou traductions si demandées"
    ],
    work: [
      "Passeport ou document de voyage",
      "Confirmation officielle de la demande",
      "Preuve du répondant ou de l’employeur",
      "Preuve de profession, permis ou pétition",
      "Qualifications ou compétences si demandées",
      "Liste officielle de la voie consultée",
      "Reçu de paiement des frais",
      "Biométrie, santé, police ou traductions si demandées"
    ],
    study: [
      "Passeport ou document de voyage",
      "Confirmation officielle de la demande",
      "Preuve d’admission ou d’inscription",
      "Preuve financière ou du répondant si demandée",
      "Preuve linguistique ou académique si demandée",
      "Liste officielle de la voie consultée",
      "Reçu de paiement des frais",
      "Biométrie, santé, police ou traductions si demandées"
    ],
    pr: [
      "Passeport ou document de voyage",
      "Confirmation officielle de la demande",
      "Invitation, nomination ou pétition si applicable",
      "Documents d’identité et d’état civil",
      "Preuves d’études, langue ou travail si demandées",
      "Liste officielle de la voie consultée",
      "Reçu de paiement des frais",
      "Biométrie, santé, police ou traductions si demandées"
    ],
    family: [
      "Passeport ou document de voyage",
      "Confirmation officielle de la demande",
      "Preuve du statut du répondant",
      "Preuves de relation et d’état civil",
      "Preuve financière ou d’hébergement si demandée",
      "Liste officielle de la voie consultée",
      "Reçu de paiement des frais",
      "Biométrie, santé, police ou traductions si demandées"
    ]
  };

  var VISA_SOURCES = {
    UK: {
      label: "Délais officiels du Royaume-Uni",
      href: "https://www.gov.uk/check-visa-processing-time"
    },
    CA: {
      label: "Délais officiels du Canada",
      href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/application/check-processing-times.html"
    },
    AU: {
      label: "Délais officiels de l’Australie",
      href: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-processing-times"
    },
    US: {
      label: "Délais officiels des rendez-vous américains",
      href: "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/wait-times.html"
    },
    AE: {
      label: "Services officiels ICP des Émirats arabes unis",
      href: "https://icp.gov.ae/en/"
    },
    SC: {
      label: "Procédure officielle de visa Schengen",
      href: "https://home-affairs.ec.europa.eu/policies/schengen/visa-policy/applying-schengen-visa_en"
    }
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
    var values = [age, education, clb, canadianExperience, foreignYears, nomination, sibling, canadianStudy];
    if (values.some(function (value) { return !Number.isFinite(value); })) {
      return { ok: false, error: "Sélectionnez une valeur valide dans chaque champ Canada." };
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
    var foreignTransfer = Math.min(50, foreignLanguage + foreignCanada);
    var transferability = Math.min(100, educationTransfer + foreignTransfer);
    var total = age + education + languageTotal + canadianExperience + transferability + nomination + sibling + canadianStudy;
    return {
      ok: true,
      route: "Canada Express Entry",
      score: total,
      scoreLabel: total + " points",
      subtitle: "Maximum CRS officiel : 1 200; cette feuille omet certains facteurs.",
      tone: "warn",
      verdict: "Estimation de facteurs sélectionnés, jamais une prévision d’invitation. Le seuil varie selon la ronde et la catégorie.",
      breakdown: [
        ["Âge", age],
        ["Études", education],
        ["Première langue (même CLB pour 4 compétences)", languageTotal],
        ["Expérience professionnelle au Canada", canadianExperience],
        ["Transférabilité sélectionnée", transferability],
        ["Nomination provinciale ou territoriale", nomination],
        ["Frère ou sœur au Canada", sibling],
        ["Études au Canada", canadianStudy],
        ["Total des facteurs sélectionnés", total]
      ],
      recommendation: "Refaites le profil dans le calculateur CRS officiel d’IRCC, ajoutez tous les facteurs omis et consultez la dernière ronde d’invitations.",
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
    var values = [age, education, english, outsideExperience, australiaExperience, nomination, australiaStudy, partner];
    if (values.some(function (value) { return !Number.isFinite(value); })) {
      return { ok: false, error: "Sélectionnez une valeur valide dans chaque champ Australie." };
    }
    var employment = Math.min(20, outsideExperience + australiaExperience);
    var total = age + education + english + employment + nomination + australiaStudy + partner;
    var meetsThreshold = total >= 65;
    return {
      ok: true,
      route: "Australie — migration qualifiée",
      score: total,
      scoreLabel: total + " points",
      subtitle: "Seuil minimal : 65 points; aucune invitation n’est garantie.",
      tone: meetsThreshold ? "warn" : "danger",
      verdict: meetsThreshold
        ? "Le total atteint le seuil de 65 points. Profession, évaluation de compétences, sous-classe, ronde et critères d’un État restent à confirmer."
        : "Le total est inférieur au seuil minimal de 65 points pour une expression d’intérêt.",
      breakdown: [
        ["Âge", age],
        ["Qualification", education],
        ["Anglais", english],
        ["Expérience hors et en Australie (plafond 20)", employment],
        ["Nomination ou parrainage 491 admissible", nomination],
        ["Études en Australie", australiaStudy],
        ["Partenaire ou personne seule", partner],
        ["Total des facteurs sélectionnés", total]
      ],
      recommendation: "Vérifiez chaque élément dans la table officielle, la liste des professions et auprès de l’autorité d’évaluation compétente.",
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
      return { ok: false, error: "Renseignez un salaire annuel valide et chaque condition du parcours Royaume-Uni." };
    }
    if (salary < 0) return { ok: false, error: "Le salaire annuel ne peut pas être négatif." };
    var salaryPoints = salary >= salaryFloor && goingRateMet ? 20 : 0;
    var mandatory = sponsorship + occupation + english;
    var total = mandatory + salaryPoints;
    var passed = mandatory >= 50 && total >= 70;
    var verdict;
    var tone;
    if (passed) {
      verdict = "Les réponses atteignent 70 points, sans valider le répondant, le certificat de parrainage, le code SOC, les preuves ou le taux en vigueur.";
      tone = "warn";
    } else if (mandatory < 50) {
      verdict = "Les 50 points obligatoires ne sont pas réunis : parrainage, profession admissible et anglais doivent tous être confirmés.";
      tone = "danger";
    } else {
      verdict = "La voie salariale n’est pas confirmée : le plancher sélectionné et le taux en vigueur de la profession doivent tous deux être atteints.";
      tone = "danger";
    }
    return {
      ok: true,
      route: "Royaume-Uni — Skilled Worker",
      score: total,
      scoreLabel: total + " / 70",
      subtitle: "50 points obligatoires et une voie salariale qualifiée de 20 points.",
      tone: tone,
      verdict: verdict,
      breakdown: [
        ["Parrainage", sponsorship],
        ["Profession admissible SOC 2020", occupation],
        ["Anglais", english],
        ["Voie salariale sélectionnée", salaryPoints],
        ["Salaire annuel saisi", salary.toLocaleString("fr-FR") + " £"],
        ["Taux en vigueur confirmé", goingRateMet ? "Oui" : "Non"],
        ["Total de la vérification sélectionnée", total]
      ],
      recommendation: "Demandez au répondant de confirmer par écrit le code SOC 2020, le certificat, le salaire de base garanti, les heures, l’option de points et le taux en vigueur proratisé.",
      sourceVersion: IMMIGRATION_SOURCE_VERSION
    };
  }

  function calendarFactor(unit) {
    if (unit === "business-days") return 7 / 5;
    if (unit === "weeks") return 7;
    if (unit === "months") return 30.4375;
    return 1;
  }

  function utcDay(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return NaN;
    var parsed = Date.parse(value + "T00:00:00Z");
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function calculateTimeline(input, nowValue) {
    var destination = String(input.destination || "");
    var visaType = String(input.visaType || "");
    var minimum = finiteNumber(input.minimum);
    var maximum = finiteNumber(input.maximum);
    var unit = String(input.unit || "days");
    var submittedUtc = utcDay(input.submitted);
    var source = VISA_SOURCES[destination];
    var documents = VISA_DOCUMENTS[visaType];
    if (!source) return { ok: false, error: "Choisissez la juridiction de destination." };
    if (!documents) return { ok: false, error: "Choisissez une catégorie de demande." };
    if (!Number.isFinite(submittedUtc)) return { ok: false, error: "Saisissez la date utilisée par la source officielle." };
    if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum <= 0 || maximum <= 0) {
      return { ok: false, error: "Saisissez une fourchette officielle minimale et maximale positive." };
    }
    if (maximum < minimum) return { ok: false, error: "Le maximum doit être supérieur ou égal au minimum." };
    if (!["days", "business-days", "weeks", "months"].includes(unit)) {
      return { ok: false, error: "Choisissez une unité de délai valide." };
    }
    var now = nowValue ? new Date(nowValue) : new Date();
    if (Number.isNaN(now.getTime())) return { ok: false, error: "La date de référence interne est invalide." };
    var todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    var dayMs = 86400000;
    var elapsed = Math.floor((todayUtc - submittedUtc) / dayMs);
    if (elapsed < 0) return { ok: false, error: "La date saisie ne peut pas être dans le futur." };
    var minDays = Math.ceil(minimum * calendarFactor(unit));
    var maxDays = Math.ceil(maximum * calendarFactor(unit));
    var checks = Array.isArray(input.checks) ? input.checks.map(Boolean).slice(0, documents.length) : [];
    while (checks.length < documents.length) checks.push(false);
    var checkedCount = checks.filter(Boolean).length;
    var missing = documents.filter(function (_document, index) { return !checks[index]; });
    var status;
    if (elapsed < minDays) status = "Avant la première date de votre fourchette de planification.";
    else if (elapsed <= maxDays) status = "Dans votre fourchette de planification. Consultez le portail officiel pour le statut.";
    else status = "Après votre fourchette de planification. Consultez le portail officiel avant toute demande de suivi.";
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
      earliestDate: new Date(submittedUtc + minDays * dayMs).toISOString().slice(0, 10),
      latestDate: new Date(submittedUtc + maxDays * dayMs).toISOString().slice(0, 10),
      today: new Date(todayUtc).toISOString().slice(0, 10),
      progress: Math.min(100, Math.round((elapsed / maxDays) * 100)),
      checkedCount: checkedCount,
      documentCount: documents.length,
      missingDocuments: missing,
      status: status,
      source: source
    };
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
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

  function formatFrenchDate(value) {
    var parsed = utcDay(value);
    if (!Number.isFinite(parsed)) return value;
    return new Date(parsed).toLocaleDateString("fr-FR", {
      timeZone: "UTC",
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  function immigrationSummary(result) {
    return [
      "AfroTools — vérification de points d’immigration",
      "Parcours : " + result.route,
      "Résultat : " + result.scoreLabel,
      result.subtitle,
      "",
      result.breakdown.map(function (row) { return row[0] + " : " + row[1]; }).join("\n"),
      "",
      "Limite : " + result.verdict,
      "Étape suivante : " + result.recommendation,
      "Sources officielles vérifiées le " + REVIEWED_ON + ".",
      "Information générale uniquement; aucune décision d’admissibilité ni aucun conseil juridique ou migratoire."
    ].join("\n");
  }

  function timelineSummary(result) {
    return [
      "AfroTools — calendrier privé de demande de visa",
      "Juridiction : " + result.destination,
      "Date saisie : " + formatFrenchDate(result.submitted),
      "Jours calendaires écoulés : " + result.elapsedDays,
      "Fourchette saisie : " + result.minimum + " à " + result.maximum + " (" + result.unit + ")",
      "Première date de planification : " + formatFrenchDate(result.earliestDate),
      "Dernière date de planification : " + formatFrenchDate(result.latestDate),
      "Repères cochés : " + result.checkedCount + " / " + result.documentCount,
      "État : " + result.status,
      "Source : " + result.source.href,
      "Aucun statut officiel n’est déduit. Vérifiez le portail de la juridiction."
    ].join("\n");
  }

  function mountTheme(documentRef) {
    var button = documentRef.querySelector("[data-fd-theme]");
    if (!button) return;
    button.addEventListener("click", function () {
      var html = documentRef.documentElement;
      var current = html.getAttribute("data-theme");
      var next = current === "dark" ? "light" : "dark";
      html.setAttribute("data-theme", next);
      button.setAttribute("aria-pressed", next === "dark" ? "true" : "false");
      button.textContent = next === "dark" ? "Thème clair" : "Thème sombre";
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

    function selectTab(route, focus) {
      activeRoute = route;
      tabs.forEach(function (tab) {
        var selected = tab.getAttribute("data-fd-tab") === route;
        tab.setAttribute("aria-selected", selected ? "true" : "false");
        tab.tabIndex = selected ? 0 : -1;
        if (selected && focus) tab.focus();
      });
      panels.forEach(function (panel) {
        panel.hidden = panel.getAttribute("data-fd-panel") !== route;
      });
      currentResult = null;
      results.hidden = true;
      error.textContent = "";
      status.textContent = "Aucun résultat n’est stocké ou envoyé.";
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

    function calculate() {
      var result;
      if (activeRoute === "CA") {
        var caEducation = selectValue("fd-ca-education");
        var caExperience = selectValue("fd-ca-canada-experience");
        result = calculateCanada({
          age: documentRef.getElementById("fd-ca-age").value,
          education: caEducation.value,
          educationIndex: caEducation.index,
          clb: documentRef.getElementById("fd-ca-clb").value,
          canadianExperience: caExperience.value,
          canadianExperienceIndex: caExperience.index,
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
        return '<div class="fd-breakdown-row"><span>' + escapeHtml(row[0]) + '</span><strong>' + escapeHtml(row[1]) + "</strong></div>";
      }).join("");
      documentRef.getElementById("fd-result-recommendation").textContent = result.recommendation;
      results.hidden = false;
      status.textContent = "Résultat calculé localement.";
      results.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      calculate();
    });
    form.addEventListener("input", function () {
      if (currentResult) {
        currentResult = null;
        results.hidden = true;
        status.textContent = "Entrées modifiées; recalculez.";
      }
    });
    form.addEventListener("reset", function () {
      setTimeout(function () { selectTab("CA", false); }, 0);
    });

    documentRef.getElementById("fd-immigration-copy").addEventListener("click", function () {
      if (!currentResult) return void (status.textContent = "Calculez un résultat avant de copier.");
      copyText(immigrationSummary(currentResult), function (copied) {
        status.textContent = copied ? "Résumé copié." : "La copie a été bloquée par ce navigateur.";
      });
    });
    documentRef.getElementById("fd-immigration-txt").addEventListener("click", function () {
      if (!currentResult) return void (status.textContent = "Calculez un résultat avant l’export.");
      textDownload("verification-points-immigration.txt", immigrationSummary(currentResult));
      status.textContent = "Fichier TXT généré localement.";
    });
    documentRef.getElementById("fd-immigration-json").addEventListener("click", function () {
      if (!currentResult) return void (status.textContent = "Calculez un résultat avant l’export.");
      textDownload("verification-points-immigration.json", JSON.stringify({
        schemaVersion: 1,
        locale: "fr",
        generatedAt: new Date().toISOString(),
        disclaimer: "Information générale uniquement; aucune décision d’admissibilité.",
        result: currentResult
      }, null, 2), "application/json;charset=utf-8");
      status.textContent = "Fichier JSON généré localement.";
    });
    documentRef.getElementById("fd-immigration-print").addEventListener("click", function () {
      if (!currentResult) return void (status.textContent = "Calculez un résultat avant l’impression.");
      status.textContent = "Ouverture de l’impression; choisissez Enregistrer au format PDF si disponible.";
      window.print();
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
      var destination = documentRef.getElementById("fd-visa-destination").value;
      var source = VISA_SOURCES[destination];
      if (!source) {
        sourceLink.href = "/fr/diaspora/";
        sourceLink.textContent = "Choisissez d’abord une juridiction";
        sourceLink.removeAttribute("target");
        sourceLink.removeAttribute("rel");
      } else {
        sourceLink.href = source.href;
        sourceLink.textContent = source.label;
        sourceLink.target = "_blank";
        sourceLink.rel = "noopener noreferrer";
      }
    }

    function renderDocuments(checks) {
      var type = documentRef.getElementById("fd-visa-type").value;
      var documents = VISA_DOCUMENTS[type] || [];
      grid.innerHTML = documents.map(function (label, index) {
        var checked = Boolean(checks && checks[index]);
        return '<label class="fd-doc-item" data-checked="' + (checked ? "true" : "false") + '"><input type="checkbox" value="' + index + '"' + (checked ? " checked" : "") + "><span>" + escapeHtml(label) + "</span></label>";
      }).join("");
      Array.prototype.forEach.call(grid.querySelectorAll('input[type="checkbox"]'), function (input) {
        input.addEventListener("change", function () {
          input.closest(".fd-doc-item").setAttribute("data-checked", input.checked ? "true" : "false");
          invalidate();
        });
      });
    }

    function invalidate() {
      if (!currentResult) return;
      currentResult = null;
      results.hidden = true;
      status.textContent = "Entrées modifiées; reconstruisez le calendrier.";
    }

    function renderResult(result) {
      currentResult = result;
      error.textContent = "";
      documentRef.getElementById("fd-visa-elapsed").textContent = result.elapsedDays + (result.elapsedDays === 1 ? " jour" : " jours");
      documentRef.getElementById("fd-visa-result-status").textContent = result.status;
      documentRef.getElementById("fd-visa-progress").style.width = result.progress + "%";
      documentRef.getElementById("fd-visa-timeline").innerHTML = [
        ["Date saisie", formatFrenchDate(result.submitted)],
        ["Aujourd’hui", formatFrenchDate(result.today)],
        ["Première date de planification", formatFrenchDate(result.earliestDate)],
        ["Dernière date de planification", formatFrenchDate(result.latestDate)]
      ].map(function (row) {
        return '<div class="fd-timeline-row"><span>' + escapeHtml(row[0]) + '</span><strong>' + escapeHtml(row[1]) + "</strong></div>";
      }).join("");
      documentRef.getElementById("fd-visa-document-result").innerHTML =
        "<strong>" + result.checkedCount + " repères cochés sur " + result.documentCount + ".</strong>" +
        "<p>Cette liste reste générique et ne remplace jamais la liste officielle de la voie.</p>" +
        (result.missingDocuments.length
          ? "<ul class=\"fd-next-list\">" + result.missingDocuments.map(function (item) { return "<li>À revoir : " + escapeHtml(item) + "</li>"; }).join("") + "</ul>"
          : "<p>Tous les repères génériques sont cochés; la liste officielle reste à vérifier.</p>");
      documentRef.getElementById("fd-visa-next").innerHTML =
        "<li>Consulter le portail officiel pour toute demande ou mise à jour de statut.</li>" +
        "<li>Confirmer la date exacte de départ du délai officiel.</li>" +
        "<li>Relire la liste documentaire propre à la voie et à votre pays de dépôt.</li>" +
        "<li>Ne pas réserver un voyage non remboursable à partir de cette fourchette.</li>";
      results.hidden = false;
      status.textContent = "Calendrier calculé localement; rien n’est enregistré automatiquement.";
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

    documentRef.getElementById("fd-visa-destination").addEventListener("change", function () {
      updateSource();
      invalidate();
    });
    documentRef.getElementById("fd-visa-type").addEventListener("change", function () {
      renderDocuments();
      invalidate();
    });
    form.addEventListener("input", invalidate);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      buildTimeline();
    });
    form.addEventListener("reset", function () {
      setTimeout(function () {
        renderDocuments();
        updateSource();
        currentResult = null;
        results.hidden = true;
        error.textContent = "";
        status.textContent = "Aucune donnée n’est enregistrée automatiquement.";
      }, 0);
    });

    documentRef.getElementById("fd-visa-save").addEventListener("click", function () {
      if (!currentResult) return void (status.textContent = "Construisez le calendrier avant l’enregistrement.");
      var state = stateFromForm();
      try {
        localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify({
          schemaVersion: 1,
          locale: "fr",
          savedAt: new Date().toISOString(),
          state: state
        }));
        status.textContent = "Enregistré uniquement dans ce navigateur.";
      } catch (_error) {
        status.textContent = "Ce navigateur a bloqué l’enregistrement local.";
      }
    });
    documentRef.getElementById("fd-visa-delete").addEventListener("click", function () {
      try { localStorage.removeItem(TRACKER_STORAGE_KEY); } catch (_error) {}
      form.reset();
      status.textContent = "Copie locale supprimée.";
    });
    documentRef.getElementById("fd-visa-copy").addEventListener("click", function () {
      if (!currentResult) return void (status.textContent = "Construisez le calendrier avant de copier.");
      copyText(timelineSummary(currentResult), function (copied) {
        status.textContent = copied ? "Résumé copié." : "La copie a été bloquée.";
      });
    });
    documentRef.getElementById("fd-visa-txt").addEventListener("click", function () {
      if (!currentResult) return void (status.textContent = "Construisez le calendrier avant l’export.");
      textDownload("calendrier-demande-visa.txt", timelineSummary(currentResult));
      status.textContent = "Fichier TXT généré localement.";
    });
    documentRef.getElementById("fd-visa-json").addEventListener("click", function () {
      if (!currentResult) return void (status.textContent = "Construisez le calendrier avant l’export.");
      textDownload("calendrier-demande-visa.json", JSON.stringify({
        schemaVersion: 1,
        locale: "fr",
        exportedAt: new Date().toISOString(),
        state: stateFromForm(),
        result: currentResult,
        disclaimer: "Planification uniquement; aucun statut officiel n’est déduit."
      }, null, 2), "application/json;charset=utf-8");
      status.textContent = "Fichier JSON généré localement.";
    });
    documentRef.getElementById("fd-visa-print").addEventListener("click", function () {
      if (!currentResult) return void (status.textContent = "Construisez le calendrier avant l’impression.");
      status.textContent = "Ouverture de l’impression; choisissez Enregistrer au format PDF si disponible.";
      window.print();
    });
    documentRef.getElementById("fd-visa-import").addEventListener("change", function (event) {
      var file = event.target.files && event.target.files[0];
      event.target.value = "";
      if (!file) return;
      if (file.size > 200000) return void (status.textContent = "Fichier refusé : taille maximale 200 Ko.");
      var reader = new FileReader();
      reader.onload = function () {
        var payload;
        try { payload = JSON.parse(String(reader.result || "")); } catch (_error) {
          return void (status.textContent = "Fichier JSON illisible.");
        }
        var state = payload && payload.schemaVersion === 1 && payload.locale === "fr" && payload.state;
        if (!state || !VISA_SOURCES[state.destination] || !VISA_DOCUMENTS[state.visaType]) {
          return void (status.textContent = "Ce fichier n’est pas un export de calendrier AfroTools compatible.");
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
        if (!result.ok) return void (status.textContent = "Le fichier contient un état invalide : " + result.error);
        renderResult(result);
        status.textContent = "Export JSON rouvert localement.";
      };
      reader.onerror = function () { status.textContent = "Lecture locale du fichier impossible."; };
      reader.readAsText(file);
    });

    function restoreLocal() {
      var payload;
      try { payload = JSON.parse(localStorage.getItem(TRACKER_STORAGE_KEY) || "null"); } catch (_error) { payload = null; }
      var state = payload && payload.schemaVersion === 1 && payload.locale === "fr" && payload.state;
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
        status.textContent = "Copie restaurée depuis ce navigateur.";
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

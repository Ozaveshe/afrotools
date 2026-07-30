(function (window, document) {
  "use strict";

  var root = document.querySelector("[data-creator-pricing]");
  var engine = window.CreatorPricingEngine;
  if (!root || !engine) return;

  var fr = root.getAttribute("data-locale") === "fr";
  var form = root.querySelector("form");
  var country = form.elements.country;
  var craft = form.elements.craft;
  var specialty = form.elements.specialty;
  var city = form.elements.city;
  var currency = form.elements.currency;
  var results = root.querySelector("[data-results]");
  var status = root.querySelector("[data-status]");
  var lastReport = null;
  var frText = {
    "South Africa": "Afrique du Sud", "Egypt": "Égypte", "Ethiopia": "Éthiopie", "Cameroon": "Cameroun", "Morocco": "Maroc",
    "Photography": "Photographie", "Videography / Film": "Vidéographie / film", "Graphic Design": "Design graphique",
    "Music Production": "Production musicale", "Writing / Copywriting": "Rédaction / copywriting", "Web / App Dev": "Développement web / application",
    "Social Media Mgmt": "Gestion des réseaux sociaux", "Fashion Design": "Création de mode", "Illustration / Art": "Illustration / art",
    "Voice Over / Audio": "Voix off / audio", "Event Planning": "Organisation d’événements", "Other": "Autre",
    "Wedding": "Mariage", "Portrait": "Portrait", "Product": "Produit", "Fashion": "Mode", "Event": "Événement",
    "Real Estate": "Immobilier", "Food": "Gastronomie", "Documentary": "Documentaire", "Music Video": "Clip musical",
    "Wedding Film": "Film de mariage", "Commercial": "Publicité", "Corporate": "Entreprise", "Social Media": "Réseaux sociaux",
    "Short Film": "Court métrage", "Brand Identity": "Identité de marque", "Print": "Impression", "Packaging": "Emballage",
    "UI/UX": "UI/UX", "Motion Graphics": "Motion design", "Infographics": "Infographies", "Gospel": "Gospel",
    "Jingles": "Jingles", "Film Score": "Musique de film", "Blog/SEO": "Blog / SEO", "Copywriting": "Copywriting",
    "Technical": "Technique", "Ghostwriting": "Prête-plume", "Script": "Scénario", "PR/Communications": "Relations publiques / communication",
    "Academic": "Académique", "Frontend": "Front-end", "Backend": "Back-end", "Full Stack": "Full stack",
    "Mobile App": "Application mobile", "E-commerce": "Commerce en ligne", "API/Integration": "API / intégration",
    "Strategy": "Stratégie", "Content Creation": "Création de contenu", "Community Mgmt": "Gestion de communauté",
    "Paid Ads": "Publicité payante", "Influencer": "Influence", "Analytics": "Analyse", "Bespoke/Custom": "Sur mesure",
    "Ready-to-Wear": "Prêt-à-porter", "Bridal": "Mariage", "Accessories": "Accessoires", "Styling": "Stylisme",
    "Costume": "Costume", "Digital Art": "Art numérique", "Editorial": "Éditorial", "Children's Book": "Livre jeunesse",
    "Comic/Manga": "BD / manga", "Murals": "Fresques", "Portraits": "Portraits", "NFT Art": "Art NFT",
    "Narration": "Narration", "Podcast": "Podcast", "IVR/Phone": "SVI / téléphone", "Animation": "Animation",
    "Audiobook": "Livre audio", "Weddings": "Mariages", "Concerts": "Concerts", "Conference": "Conférence",
    "Birthday/Social": "Anniversaire / privé", "Decor Only": "Décoration seule",
    "Half-day shoot (4hrs)": "Prise de vue demi-journée (4 h)", "Full-day shoot (8hrs)": "Prise de vue journée (8 h)",
    "Wedding (full day)": "Mariage (journée complète)", "Per edited photo": "Par photo retouchée", "Photo + video combo": "Forfait photo + vidéo",
    "Short-form video (30–60s)": "Vidéo courte (30 à 60 s)", "Music video": "Clip musical", "Corporate video (3–5 min)": "Vidéo d’entreprise (3 à 5 min)",
    "Wedding film": "Film de mariage", "Social media reel": "Reel pour réseaux sociaux", "Logo design": "Création de logo",
    "Social media set (10 posts)": "Lot réseaux sociaux (10 publications)", "Flyer / poster": "Flyer / affiche",
    "Brand identity package": "Forfait identité de marque", "Presentation deck": "Présentation", "Beat/instrumental": "Beat / instrumental",
    "Full track production": "Production d’un titre complet", "Mixing & mastering": "Mixage et mastering", "Jingle (30s)": "Jingle (30 s)",
    "Album production (10 tracks)": "Production d’album (10 titres)", "Blog post (1000 words)": "Article de blog (1 000 mots)",
    "Website copy (5 pages)": "Textes de site (5 pages)", "Social media captions (30)": "Légendes pour réseaux sociaux (30)",
    "Press release": "Communiqué de presse", "Ebook / whitepaper": "Livre numérique / livre blanc", "Landing page": "Page d’atterrissage",
    "Full website (5–10 pages)": "Site complet (5 à 10 pages)", "E-commerce store": "Boutique en ligne",
    "Mobile app (MVP)": "Application mobile (MVP)", "API integration": "Intégration API", "Monthly management": "Gestion mensuelle",
    "Strategy document": "Document stratégique", "Ad campaign setup": "Configuration de campagne publicitaire",
    "Content calendar (1 month)": "Calendrier éditorial (1 mois)", "Audit & report": "Audit et rapport", "Custom outfit": "Tenue sur mesure",
    "Bridal gown": "Robe de mariée", "Aso-ebi set": "Ensemble aso-ebi", "Collection (10 pieces)": "Collection (10 pièces)",
    "Styling session": "Séance de stylisme", "Single illustration": "Illustration unique", "Character design": "Création de personnage",
    "Book cover": "Couverture de livre", "Comic page": "Page de BD", "Mural design": "Conception de fresque",
    "Radio commercial (30s)": "Publicité radio (30 s)", "Narration (per minute)": "Narration (par minute)",
    "IVR / phone system": "SVI / système téléphonique", "Podcast intro": "Introduction de podcast", "Audiobook (per hour)": "Livre audio (par heure)",
    "Birthday party": "Fête d’anniversaire", "Wedding coordination": "Coordination de mariage", "Corporate event": "Événement d’entreprise",
    "Concert / show": "Concert / spectacle", "Decoration only": "Décoration seule", "Half-day project": "Projet demi-journée",
    "Full-day project": "Projet journée", "Multi-day project": "Projet sur plusieurs jours"
  };

  var copy = {
    calculate: fr ? "Calculer mes tarifs" : "Calculate my rates",
    invalid: fr ? "Choisissez un métier et un pays." : "Choose a craft and country.",
    ready: fr ? "Fourchette calculée localement." : "Range calculated locally.",
    copied: fr ? "Résumé copié." : "Summary copied.",
    copyFailed: fr ? "Copie impossible. Le résumé reste affiché." : "Copy failed. The summary remains visible.",
    exported: fr ? "Export téléchargé." : "Export downloaded.",
    daily: fr ? "Tarif journalier conseillé" : "Suggested daily rate",
    hourly: fr ? "Tarif horaire conseillé" : "Suggested hourly rate",
    project: fr ? "Projet type" : "Typical project",
    range: fr ? "Fourchette" : "Range",
    median: fr ? "Point de repère" : "Reference point",
    assumptions: fr ? "Hypothèses" : "Assumptions",
    disclaimer: fr
      ? "Repère de planification, pas un tarif officiel ni une garantie de marché. Les conversions intégrées sont des hypothèses fixes, pas des taux de change en direct. Vérifiez les devises, le brief, les droits, les révisions et les frais."
      : "Planning benchmark, not an official rate or market guarantee. Built-in conversions are fixed assumptions, not live FX. Verify currency, scope, rights, revisions and costs."
  };

  function fillSelect(select, rows, valueKey, label) {
    select.textContent = "";
    rows.forEach(function (row) {
      var option = document.createElement("option");
      option.value = row[valueKey];
      option.textContent = label(row);
      select.appendChild(option);
    });
  }

  function localLabel(value) {
    return fr && frText[value] ? frText[value] : value;
  }

  function setCountries() {
    var rows = Object.keys(engine.COUNTRIES).map(function (code) {
      return { code: code, data: engine.COUNTRIES[code] };
    });
    fillSelect(country, rows, "code", function (row) { return localLabel(row.data.name); });
    country.value = fr ? "SN" : "NG";
  }

  function setCrafts() {
    fillSelect(craft, engine.CRAFTS, "id", function (row) { return localLabel(row.label); });
  }

  function setCurrencies() {
    var seen = {};
    var rows = Object.keys(engine.COUNTRIES).map(function (code) {
      var c = engine.COUNTRIES[code].currency;
      if (seen[c]) return null;
      seen[c] = true;
      return { id: c };
    }).filter(Boolean);
    fillSelect(currency, rows, "id", function (row) { return row.id; });
  }

  function refreshSpecialties() {
    var rows = [{ id: "", label: fr ? "Généraliste" : "General" }].concat(
      engine.getSpecialties(craft.value).map(function (label) { return { id: label, label: localLabel(label) }; })
    );
    fillSelect(specialty, rows, "id", function (row) { return row.label; });
  }

  function refreshCountry() {
    var data = engine.COUNTRIES[country.value];
    var cities = [{ id: "", label: fr ? "Autre ville / à distance" : "Other city / remote" }].concat(
      engine.getCities(country.value).map(function (label) { return { id: label, label: label }; })
    );
    fillSelect(city, cities, "id", function (row) { return row.label; });
    currency.value = data.currency;
  }

  function metric(label, value) {
    return '<div class="cf-metric"><span>' + label + '</span><strong>' + value + "</strong></div>";
  }

  function reportText(report) {
    var craftRow = engine.CRAFTS.find(function (row) { return row.id === report.input.craft; });
    return [
      fr ? "Repère de tarification AfroTools" : "AfroTools pricing benchmark",
      (fr ? "Pays : " : "Country: ") + localLabel(engine.COUNTRIES[report.input.country].name),
      (fr ? "Métier : " : "Craft: ") + localLabel(craftRow ? craftRow.label : report.input.craft),
      (fr ? "Tarif journalier : " : "Daily rate: ") + report.display.daily,
      (fr ? "Tarif horaire : " : "Hourly rate: ") + report.display.hourly,
      (fr ? "Projet type : " : "Typical project: ") + report.display.project,
      copy.disclaimer
    ].join("\n");
  }

  function calculate(event) {
    if (event) event.preventDefault();
    if (!craft.value || !country.value) {
      status.textContent = copy.invalid;
      status.classList.add("cf-error");
      return;
    }
    var input = {
      craft: craft.value,
      specialty: specialty.value,
      country: country.value,
      city: city.value,
      experience: form.elements.experience.value,
      currency: currency.value
    };
    var rate = engine.calculateRate(input);
    var breakdown = engine.getBreakdown(input.craft, rate);
    lastReport = {
      schemaVersion: 1,
      tool: "creator-pricing",
      locale: fr ? "fr" : "en",
      generatedAt: new Date().toISOString(),
      input: input,
      rate: rate,
      breakdown: breakdown,
      display: {
        daily: engine.formatRange(rate.daily.min, rate.daily.max, rate.currency),
        hourly: engine.formatRange(rate.hourly.min, rate.hourly.max, rate.currency),
        project: engine.formatRange(rate.project.min, rate.project.max, rate.currency)
      },
      disclaimer: copy.disclaimer
    };
    results.hidden = false;
    results.querySelector("[data-metrics]").innerHTML =
      metric(copy.daily, lastReport.display.daily) +
      metric(copy.hourly, lastReport.display.hourly) +
      metric(copy.project, lastReport.display.project);
    results.querySelector("[data-breakdown]").innerHTML = breakdown.slice(0, 5).map(function (row) {
      return "<li><strong>" + localLabel(row.name) + ":</strong> " + engine.formatRange(row.min, row.max, rate.currency) + "</li>";
    }).join("");
    results.querySelector("[data-disclaimer]").textContent = copy.disclaimer;
    status.textContent = copy.ready;
    status.classList.remove("cf-error");
  }

  function download(type) {
    if (!lastReport) calculate();
    if (!lastReport) return;
    var content = type === "json" ? JSON.stringify(lastReport, null, 2) : reportText(lastReport);
    var blob = new Blob([content], { type: type === "json" ? "application/json" : "text/plain" });
    var href = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "creator-pricing-" + lastReport.input.country.toLowerCase() + "." + type;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(href); }, 0);
    status.textContent = copy.exported;
  }

  form.addEventListener("submit", calculate);
  country.addEventListener("change", refreshCountry);
  craft.addEventListener("change", refreshSpecialties);
  root.querySelector("[data-json]").addEventListener("click", function () { download("json"); });
  root.querySelector("[data-txt]").addEventListener("click", function () { download("txt"); });
  root.querySelector("[data-copy]").addEventListener("click", function () {
    if (!lastReport) calculate();
    if (!lastReport) return;
    var text = reportText(lastReport);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        status.textContent = copy.copied;
      }).catch(function () {
        status.textContent = copy.copyFailed + "\n" + text;
      });
    } else {
      status.textContent = copy.copyFailed + "\n" + text;
    }
  });

  setCountries();
  setCrafts();
  setCurrencies();
  refreshSpecialties();
  refreshCountry();
  form.querySelector('button[type="submit"]').textContent = copy.calculate;
})(window, document);

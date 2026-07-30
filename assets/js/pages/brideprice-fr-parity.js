(function installFrenchBridePriceParity(window, document) {
  "use strict";
  var data = window.AfroToolsBridePriceData;
  var engine = window.BridePriceCultureEngine;
  var sourceSection = document.getElementById("sources");
  if (!data || !engine || !sourceSection) return;

  var countries = {
    NG: "Nigeria",
    KE: "Kenya",
    GH: "Ghana",
    ZA: "Afrique du Sud",
    UG: "Ouganda",
    TZ: "Tanzanie",
    ET: "Éthiopie",
    MA: "Maroc"
  };

  var context = {
    Igbo: "La démarche Igbo distingue la visite de présentation, l’accord familial et l’Igba Nkwu, où la mariée offre le vin de palme à son choix.",
    Yoruba: "L’Igba Niyawo associe lettre d’engagement, cadeaux listés, tenues aso-ebi et salut respectueux aux aînés.",
    Hausa: "Le Sadaki revient à la mariée selon le cadre islamique; le Kayan Lefe couvre les cadeaux et équipements discutés entre familles.",
    Kikuyu: "Le Ruracio se prépare en plusieurs visites et la négociation des chèvres ou de leur équivalent reste conduite par les familles.",
    Luo: "L’Ayie conserve la référence au bétail et aux émissaires familiaux, même lorsque les familles conviennent d’un règlement monétaire.",
    "Akan (Ashanti)": "Le Tiri Nsa, ou cérémonie du schnaps, met l’accent sur l’accueil du nouveau membre de la famille plutôt que sur un prix.",
    Ewe: "Le Tsifo privilégie des cadeaux et boissons modestes afin de maintenir une cérémonie accessible et respectueuse.",
    Zulu: "Le lobola Zulu est négocié par un médiateur et conserve la référence aux onze bovins, dont l’Inkomo Kamama destiné à la mère.",
    Xhosa: "Le lobola Xhosa associe négociation familiale, bovins, couvertures et vêtements dans un cadre d’ubuntu.",
    Baganda: "La Kwanjula est une présentation familiale structurée où les tenues, présents et rôles des deux familles sont annoncés publiquement.",
    Chagga: "Le Mahali Chagga associe bétail ou contribution monétaire, boissons locales et célébration familiale au pied du Kilimandjaro.",
    Amhara: "Le Tilosh Amhara se prépare par des visites familiales, des cadeaux et une cérémonie du café, en lien avec le mariage orthodoxe.",
    "Amazigh (Berber)": "Le Sadak revient à la mariée dans le cadre islamique; les pratiques amazighes y associent henné, tenues et célébrations familiales."
  };

  var fact = {
    Igbo: "L’Iku Aka et l’Igba Nkwu sont des étapes distinctes; la liste réelle doit toujours être confirmée auprès de la famille concernée.",
    Yoruba: "Le montant symbolique peut rester faible alors que les tenues, cadeaux et la réception représentent l’essentiel du budget.",
    Hausa: "Le Sadaki appartient à la mariée; il ne doit pas être confondu avec les cadeaux Kayan Lefe remis à la famille.",
    Kikuyu: "Les oncles et médiateurs conduisent souvent le Ruracio; la durée et le nombre de visites varient selon la famille.",
    Luo: "Les bovins gardent une forte valeur symbolique, même dans les familles urbaines qui conviennent d’un équivalent en argent.",
    "Akan (Ashanti)": "Une formule Akan résume l’esprit du Tiri Nsa: la famille accueille un fils, elle ne vend pas une fille.",
    Ewe: "La modération du Tsifo vise à ne pas rendre le mariage inaccessible pour des raisons financières.",
    Zulu: "Les discussions restent exprimées en têtes de bétail même lorsque le règlement final est monétaire.",
    Xhosa: "Les couvertures offertes ont une importance culturelle propre et ne sont pas de simples accessoires de cérémonie.",
    Baganda: "La Kwanjula met en scène la présentation et l’identification de la mariée au sein de sa famille.",
    Chagga: "Le Mbege, bière de banane locale, peut faire partie de l’accueil et de la célébration.",
    Amhara: "Les visites préalables permettent aux aînés d’observer le respect et le comportement du futur conjoint.",
    "Amazigh (Berber)": "La nuit du henné transmet des motifs et récits familiaux avant la célébration."
  };

  var itemNames = {
    "Aso-oke for bride": "Aso-oke de la mariée",
    "Bible & Quran": "Bible et Coran",
    "Blankets & clothing": "Couvertures et vêtements",
    "Bride price (cash)": "Contribution matrimoniale en espèces",
    "Bride's clothing": "Vêtements de la mariée",
    "Bride's outfit": "Tenue de la mariée",
    "Cash (bride price)": "Contribution en espèces",
    "Cash (ye zer gezat)": "Contribution ye zer gezat",
    "Cash component": "Part en espèces",
    "Cash envelope": "Enveloppe en espèces",
    "Cash gifts": "Cadeaux en espèces",
    Cattle: "Bovins",
    "Cattle/cash": "Bovins ou équivalent monétaire",
    Clothing: "Vêtements",
    "Clothing & gifts": "Vêtements et cadeaux",
    "Clothing (habesha kemis)": "Vêtement habesha kemis",
    "Coffee ceremony set": "Service pour la cérémonie du café",
    "Dowry box (complete)": "Coffret familial complet",
    "Drinks & provisions": "Boissons et provisions",
    "Drinks (assorted)": "Boissons assorties",
    "Drinks (crates)": "Casiers de boissons",
    "Elders' cash": "Contribution aux aînés",
    "Engagement letter": "Lettre d’engagement",
    "Family gifts": "Cadeaux familiaux",
    "Family outfits": "Tenues familiales",
    "First visit gifts": "Cadeaux de première visite",
    "Food & drinks": "Repas et boissons",
    "Food items": "Produits alimentaires",
    "Fruit basket": "Panier de fruits",
    Goats: "Chèvres",
    "Goats (or cash)": "Chèvres ou équivalent monétaire",
    "Gold jewellery (ye wuqabi)": "Bijoux en or ye wuqabi",
    "Gold jewelry set": "Parure de bijoux en or",
    "Gomesi for family": "Gomesi pour la famille",
    "Henna ceremony": "Cérémonie du henné",
    "Honey & sugar cane": "Miel et canne à sucre",
    "Injera & tej (honey wine)": "Injera et tej, vin de miel",
    "Jewelry set": "Parure de bijoux",
    "Kaftan & djellaba outfits": "Tenues kaftan et djellaba",
    "Kanzu for elders": "Kanzu pour les aînés",
    "Kayan Lefe (household)": "Kayan Lefe pour le foyer",
    "Knocking schnapps": "Schnaps de présentation",
    "Kola nuts & pepper": "Noix de kola et poivre",
    "Kola nuts package": "Lot de noix de kola",
    "Lefe (mother's gifts)": "Lefe, cadeaux à la mère",
    "Lobola cattle": "Bovins du lobola",
    "Lobola cattle (11 head)": "Onze bovins du lobola",
    "Local brew & drinks": "Boisson locale et autres boissons",
    "Mabugo (bark cloth)": "Mabugo, tissu d’écorce",
    "Mahr (Islamic dowry to bride)": "Mahr islamique remis à la mariée",
    Miscellaneous: "Divers",
    "Music & entertainment": "Musique et animation",
    "Palm wine (kegs)": "Fûts de vin de palme",
    "Parents' outfits": "Tenues des parents",
    Provisions: "Provisions",
    "Sadaki (Islamic dowry)": "Sadaki islamique",
    Schnapps: "Schnaps",
    "Shoes & bags": "Chaussures et sacs",
    "Tobacco & snuff": "Tabac et tabac à priser",
    "Tubers of yam": "Tubercules d’igname",
    "Umembeso (gifts)": "Umembeso, cadeaux",
    "Wedding banquet (per day)": "Banquet de mariage par jour"
  };

  var section = document.createElement("section");
  section.className = "dot-card";
  section.id = "guide-culturel";
  section.style.marginTop = "20px";
  section.innerHTML = [
    "<h2 class=\"card-title\">Guide culturel issu du propriétaire anglais</h2>",
    "<p class=\"card-note\">Explorez les mêmes huit pays, treize traditions, fourchettes et postes que l’outil anglais. Ces montants sont des repères éducatifs historiques, jamais un tarif officiel ni une valeur attribuée à une personne.</p>",
    "<div class=\"form-grid\">",
    "<div class=\"field\"><label for=\"ua-bp-country\">Pays du guide</label><select id=\"ua-bp-country\"></select></div>",
    "<div class=\"field\"><label for=\"ua-bp-culture\">Tradition</label><select id=\"ua-bp-culture\"></select></div>",
    "<div class=\"field\"><label for=\"ua-bp-saved\">Épargne déjà disponible</label><input id=\"ua-bp-saved\" type=\"number\" min=\"0\" value=\"0\"></div>",
    "<div class=\"field\"><label for=\"ua-bp-months\">Mois de préparation</label><input id=\"ua-bp-months\" type=\"number\" min=\"1\" max=\"36\" value=\"9\"></div>",
    "<div class=\"field\"><label for=\"ua-bp-homes\">Foyers contributeurs</label><input id=\"ua-bp-homes\" type=\"number\" min=\"1\" value=\"2\"></div>",
    "<div class=\"field\"><label for=\"ua-bp-tone\">Niveau de planification</label><select id=\"ua-bp-tone\"><option value=\"symbolic\">Symbolique et essentiel</option><option value=\"balanced\" selected>Point médian équilibré</option><option value=\"full\">Liste élargie</option></select></div>",
    "</div>",
    "<div class=\"button-row\"><button class=\"btn primary\" id=\"ua-bp-show\" type=\"button\">Afficher le guide culturel</button><button class=\"btn\" id=\"ua-bp-copy\" type=\"button\">Copier le guide</button></div>",
    "<p id=\"ua-bp-status\" role=\"status\" aria-live=\"polite\"></p>",
    "<div id=\"ua-bp-result\" tabindex=\"-1\"></div>"
  ].join("");
  sourceSection.parentElement.insertBefore(section, sourceSection);

  var country = section.querySelector("#ua-bp-country");
  var culture = section.querySelector("#ua-bp-culture");
  var result = section.querySelector("#ua-bp-result");
  var status = section.querySelector("#ua-bp-status");
  var lastPayload = null;

  country.innerHTML = Object.keys(data).map(function (code) {
    return `<option value="${code}">${countries[code]}</option>`;
  }).join("");

  function loadCultures() {
    culture.innerHTML = data[country.value].map(function (item, index) {
      return `<option value="${index}">${item.name} — ${item.localName}</option>`;
    }).join("");
  }

  function money(item, amount) {
    return item.curr + Math.round(Number(amount || 0)).toLocaleString("fr-FR");
  }

  function render() {
    var months = Number(section.querySelector("#ua-bp-months").value);
    var homes = Number(section.querySelector("#ua-bp-homes").value);
    var saved = Number(section.querySelector("#ua-bp-saved").value);
    if (!Number.isFinite(months) || months < 1 || !Number.isFinite(homes) || homes < 1 || !Number.isFinite(saved) || saved < 0) {
      result.textContent = "";
      status.textContent = "Saisissez une durée, un nombre de foyers et une épargne valides.";
      var invalid = !Number.isFinite(months) || months < 1 ? section.querySelector("#ua-bp-months") :
        !Number.isFinite(homes) || homes < 1 ? section.querySelector("#ua-bp-homes") : section.querySelector("#ua-bp-saved");
      invalid.setAttribute("aria-invalid", "true");
      invalid.focus();
      return;
    }
    section.querySelectorAll("[aria-invalid]").forEach(function (field) { field.removeAttribute("aria-invalid"); });
    var item = data[country.value][Number(culture.value) || 0];
    var tone = section.querySelector("#ua-bp-tone").value;
    var calculation = engine.calculate({ culture: item, saved: saved, months: months, homes: homes, tone: tone });
    if (calculation.status !== "ok") {
      result.textContent = "";
      status.textContent = "Le calcul culturel ne peut pas être produit avec ces valeurs.";
      return;
    }
    var target = calculation.values.target;
    var gap = calculation.values.gap;
    var monthly = calculation.values.monthly;
    var perHome = calculation.values.perHome;
    var rows = item.items.map(function (entry) {
      return `<tr><td>${itemNames[entry.n]}</td><td>${item.curr}${entry.r}</td></tr>`;
    }).join("");
    result.innerHTML = [
      `<h3>${item.name} — ${item.localName}</h3>`,
      `<p>${context[item.name]}</p>`,
      `<div class="result-main"><div class="metric"><span>Fourchette éducative de l’outil anglais</span><strong>${item.curr}${item.total}</strong></div><div class="metric"><span>Point médian de planification</span><strong>${money(item, item.totalAvg)}</strong></div></div>`,
      `<div class="split"><div class="mini"><span>Objectif retenu</span><strong>${money(item, target)}</strong></div><div class="mini"><span>Épargne mensuelle sur ${months} mois</span><strong>${money(item, monthly)}</strong></div><div class="mini"><span>Part par foyer</span><strong>${money(item, perHome)}</strong></div></div>`,
      `<div class="status-box"><strong>Contexte culturel</strong><p>${fact[item.name]}</p></div>`,
      `<div style="overflow:auto"><table><thead><tr><th>Poste ou exigence</th><th>Fourchette du propriétaire anglais</th></tr></thead><tbody>${rows}</tbody></table></div>`,
      "<p class=\"notice\">Limite: les pratiques changent selon la famille, le lieu, la religion et la situation. Confirmez le consentement, les attentes et la capacité financière avant toute dépense.</p>"
    ].join("");
    lastPayload = {
      route: "/fr/tools/conseiller-dot/",
      country: countries[country.value],
      culture: item.name,
      localName: item.localName,
      currency: item.curr,
      sourceRange: item.total,
      midpoint: item.totalAvg,
      target: target,
      saved: saved,
      gap: gap,
      months: months,
      monthly: monthly,
      contributingHomes: homes,
      perHome: perHome,
      items: item.items.map(function (entry) {
        return { name: itemNames[entry.n], range: entry.r, midpoint: entry.avg };
      })
    };
    window.AfroToolsFrenchBridePricePayload = lastPayload;
    status.textContent = "Guide culturel calculé localement à partir du propriétaire de données partagé.";
    result.focus();
  }

  country.addEventListener("change", function () { loadCultures(); render(); });
  culture.addEventListener("change", render);
  section.querySelector("#ua-bp-show").addEventListener("click", render);
  section.querySelector("#ua-bp-copy").addEventListener("click", function () {
    if (!lastPayload) render();
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      status.textContent = "Copie indisponible dans ce navigateur.";
      return;
    }
    navigator.clipboard.writeText(JSON.stringify(lastPayload, null, 2)).then(function () {
      status.textContent = "Guide culturel copié.";
    }).catch(function () {
      status.textContent = "Copie indisponible dans ce navigateur.";
    });
  });
  loadCultures();
  render();
})(window, document);

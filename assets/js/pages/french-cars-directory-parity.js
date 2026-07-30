(function initFrenchCarsDirectoryParity() {
  'use strict';

  if (document.documentElement.lang !== 'fr' || location.pathname !== '/fr/cars/') return;

  var app = document.getElementById('carsApp');
  if (!app) return;

  var STORAGE_KEY = 'afrotools.fr.cars.watchlist.v1';
  var countrySlugs = {
    'south-africa': 'afrique-du-sud',
    egypt: 'egypte',
    morocco: 'maroc',
    cameroon: 'cameroun',
    ethiopia: 'ethiopie',
    algeria: 'algerie',
    tunisia: 'tunisie',
    uganda: 'ouganda',
    zambia: 'zambie',
    tanzania: 'tanzanie'
  };
  var countryNames = {
    Nigeria: 'Nigeria',
    Kenya: 'Kenya',
    Ghana: 'Ghana',
    Uganda: 'Ouganda',
    Zambia: 'Zambie',
    Tanzania: 'Tanzanie',
    'South Africa': 'Afrique du Sud',
    Egypt: 'Égypte',
    Morocco: 'Maroc',
    "Cote d'Ivoire": "Côte d'Ivoire",
    Senegal: 'Sénégal',
    Cameroon: 'Cameroun',
    Ethiopia: 'Éthiopie',
    Rwanda: 'Rwanda',
    Angola: 'Angola',
    Algeria: 'Algérie',
    Tunisia: 'Tunisie',
    Mozambique: 'Mozambique',
    Botswana: 'Botswana',
    Namibia: 'Namibie'
  };
  var phrases = {
    'African buyer decision app': 'Outil de décision pour acheteurs africains',
    'Cars': 'Voitures',
    'car price directory': '— annuaire des prix automobiles',
    'Compare source price, import landed cost, local asking price, fuel and maintenance risk, resale confidence, and finance fit in local currency.': 'Comparez prix à la source, coût rendu, prix demandé localement, risques carburant et entretien, revente et financement dans la devise locale.',
    'local currency first': 'devise locale en premier',
    '20 market start': '20 marchés couverts',
    'FX-backed estimates': 'estimations avec taux de change',
    'No dealer quote claims': 'aucune promesse de devis vendeur',
    'Buyer layers': 'Repères pour l’acheteur',
    'Local asking band': 'Fourchette demandée localement',
    'Landed import cost': 'Coût rendu à l’importation',
    'Risk, resale, finance': 'Risque, revente et financement',
    'Search and filter': 'Rechercher et filtrer',
    'matching vehicles': 'véhicules correspondants',
    'Search': 'Recherche',
    'Country': 'Pays',
    'All makes': 'Toutes les marques',
    'Make': 'Marque',
    'All body types': 'Toutes les carrosseries',
    'Body type': 'Carrosserie',
    'All fuel': 'Tous les carburants',
    'Fuel': 'Carburant',
    'Any source': 'Toute provenance',
    'Source market': 'Marché source',
    'Max landed budget': 'Budget rendu maximal',
    'Max monthly finance': 'Mensualité maximale',
    'Max import risk score': 'Score de risque maximal',
    'Minimum resale score': 'Score de revente minimal',
    'Recommendation': 'Recommandation',
    'Any recommendation': 'Toute recommandation',
    'Import likely cheaper': 'Importation probablement moins chère',
    'Import for better spec': 'Importer pour une meilleure configuration',
    'Borderline': 'Écart insuffisant',
    'Buy local likely better': 'Achat local probablement préférable',
    'Too risky': 'Risque trop élevé',
    'Eligibility': 'Admissibilité',
    'Any eligibility': 'Toute admissibilité',
    'Eligible': 'Admissible',
    'Risky': 'À vérifier',
    'Ineligible': 'Non admissible',
    'Compare cars': 'Comparer les voitures',
    'Clear': 'Effacer',
    'Lowest landed cost': 'Coût rendu le plus bas',
    'Best resale band': 'Meilleur potentiel de revente',
    'Lower import risk': 'Risque d’importation plus faible',
    'Country context': 'Contexte du pays',
    'Buyer-ready comparisons': 'Comparaisons pour préparer l’achat',
    'Page': 'Page',
    'Local ask': 'Prix demandé localement',
    'Landed': 'Coût rendu',
    'Finance fit': 'Budget de financement',
    'monthly estimate': 'mensualité estimée',
    'No seeded offer': 'Aucune offre enregistrée',
    'Import risk': 'Risque d’importation',
    'Resale': 'Revente',
    'Open buyer view': 'Ouvrir la fiche acheteur',
    'Import cost': 'Coût d’importation',
    'Showing': 'Affichage',
    'vehicles': 'véhicules',
    'Previous': 'Précédent',
    'Next': 'Suivant',
    'Sources & verification': 'Sources et vérification',
    'confidence': 'confiance',
    'last verified': 'dernière vérification',
    'Not an official valuation, dealer offer, lender approval, or customs decision. Confirm final figures with the authority, clearing agent, lender, and physical inspection.': 'Ni évaluation officielle, ni offre vendeur, ni accord de financement, ni décision douanière. Confirmez les montants auprès de l’autorité, du transitaire, du financeur et par inspection.',
    'How current is this?': 'Quelle est la fraîcheur des données ?',
    'Directory estimate': 'Estimation d’annuaire',
    'indicative price bands, not a live dealer quote.': 'fourchettes indicatives, pas un devis vendeur en direct.',
    'Figures show': 'Les montants affichent',
    'first with USD kept as an audit reference.': 'en premier, avec l’USD comme référence de contrôle.',
    'Indicative bands compiled by AfroTools; confirm the final figure with a dealer or clearing agent before purchase.': 'Fourchettes indicatives compilées par AfroTools ; confirmez le montant final auprès d’un vendeur ou transitaire avant achat.',
    'Lower fuel exposure': 'Exposition carburant plus faible',
    'Moderate fuel exposure': 'Exposition carburant modérée',
    'High fuel exposure': 'Exposition carburant élevée',
    'Lower maintenance risk': 'Risque d’entretien plus faible',
    'Moderate maintenance risk': 'Risque d’entretien modéré',
    'Elevated maintenance risk': 'Risque d’entretien élevé',
    'resale band': 'potentiel de revente',
    'Petrol': 'Essence',
    'Diesel': 'Diesel',
    'Hybrid': 'Hybride',
    'Source': 'Provenance',
    'Lower': 'Faible',
    'Moderate': 'Modéré',
    'Elevated': 'Élevé',
    'High': 'Élevé',
    'Healthy': 'Sain',
    'Strong': 'Fort',
    'Fair': 'Moyen',
    'Slow': 'Lent',
    'Sedan': 'Berline',
    'Hatchback': 'Citadine',
    'Mpv': 'Monospace',
    'Suv': 'SUV',
    'Pickup': 'Pick-up',
    'standard': 'standard',
    'workhorse': 'utilitaire robuste',
    'premium': 'haut de gamme',
    'official': 'officielle',
    'medium': 'moyenne',
    'low': 'faible',
    'Why do these pages show ranges instead of one price?': 'Pourquoi afficher des fourchettes plutôt qu’un prix unique ?',
    'Car import outcomes depend on source price, exchange rate, customs value, port timing, agent cost, registration, and local-market spread. Ranges are more honest than a single blunt number.': 'Le résultat dépend du prix source, du change, de la valeur douanière, du port, du transitaire, de l’immatriculation et du marché local. Une fourchette est plus honnête qu’un montant unique.',
    'Is the local asking price an official valuation?': 'Le prix demandé localement est-il une évaluation officielle ?',
    'No. Local asking ranges come from seed price packs and marketplace or dealer samples. Official valuation for customs comes from the country rule and valuation pack.': 'Non. Les fourchettes locales proviennent de jeux de prix et d’échantillons de vendeurs. La valeur douanière officielle dépend des règles et de l’évaluation du pays.',
    'Can I save a watchlist?': 'Puis-je enregistrer une liste de suivi ?',
    'Yes. Watchlists save locally in the browser first and can be wired to account storage when the authenticated saved-quote backend is available.': 'Oui. La liste de suivi reste d’abord dans ce navigateur et ne nécessite aucun compte.',
    'African Car Landed Cost Calculator': 'Calculateur africain du coût rendu d’un véhicule',
    'Import Duty & Landed Cost Calculator': 'Calculateur de droits et de coût rendu',
    'Import Duty Calculator': 'Calculateur de droits d’importation',
    'African Currency Converter': 'Convertisseur de devises africaines',
    'Car Insurance Tools': 'Outils d’assurance automobile',
    'Car Loan Calculator': 'Calculateur de crédit automobile',
    'FAQ': 'Questions fréquentes',
    'Related AfroTools': 'Outils AfroTools associés',
    'Local currency ceiling': 'Plafond en devise locale',
    'Optional monthly ceiling': 'Plafond mensuel facultatif',
    'Example:': 'Exemple :',
    'Toyota Axio, Hilux, G-Wagon': 'Toyota Axio, Hilux, Classe G'
  };
  var phraseKeys = Object.keys(phrases).sort(function byLength(left, right) {
    return right.length - left.length;
  });
  var phrasePatterns = phraseKeys.map(function compilePhrase(source) {
    var escaped = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return {
      source: source,
      pattern: new RegExp('(^|[^\\p{L}])(' + escaped + ')(?=$|[^\\p{L}])', 'gu')
    };
  });
  var scheduled = false;
  var processing = false;

  function readWatchlist() {
    try {
      var value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }

  function writeWatchlist(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function frenchCarsHref(href) {
    var url = new URL(href, location.href);
    if (!/^\/cars(?:\/|$)/.test(url.pathname)) return href;
    var parts = url.pathname.split('/').filter(Boolean);
    if (parts.length > 1) parts[1] = countrySlugs[parts[1]] || parts[1];
    url.pathname = '/fr/' + parts.join('/') + '/';
    return url.pathname + url.search + url.hash;
  }

  function translate(value) {
    var output = String(value || '');
    if (countryNames[output.trim()]) return output.replace(output.trim(), countryNames[output.trim()]);
    phrasePatterns.forEach(function replacePhrase(entry) {
      output = output.replace(entry.pattern, function translatedPhrase(match, prefix) {
        return prefix + phrases[entry.source];
      });
    });
    Object.keys(countryNames).sort(function byLength(left, right) {
      return right.length - left.length;
    }).forEach(function replaceCountry(source) {
      if (output.indexOf(source) !== -1) output = output.split(source).join(countryNames[source]);
    });
    return output;
  }

  function renderWatchlist() {
    var existing = app.querySelector('[data-fr-cars-watchlist]');
    var cardsPanel = app.querySelector('.cars-panel:has(.cars-card-grid)');
    if (!cardsPanel) return;
    if (!existing) {
      existing = document.createElement('section');
      existing.className = 'cars-panel';
      existing.setAttribute('data-fr-cars-watchlist', '');
      cardsPanel.insertAdjacentElement('afterend', existing);
    }
    var items = readWatchlist();
    var markup = '<div class="cars-section-head"><h2>Liste de suivi locale</h2><span>'
      + items.length + ' véhicule' + (items.length === 1 ? '' : 's') + '</span></div>'
      + '<p class="cars-safe-note">Cette liste reste dans ce navigateur. Aucun véhicule ni budget n’est envoyé.</p>'
      + (items.length
        ? '<ul>' + items.map(function itemRow(item) {
          return '<li><a href="' + item.href + '">' + item.label + '</a> '
            + '<button type="button" class="cars-button secondary" data-fr-cars-watch-remove="' + item.href + '">Retirer</button></li>';
        }).join('') + '</ul>'
        : '<p>Aucun véhicule enregistré.</p>');
    if (existing.innerHTML !== markup) existing.innerHTML = markup;
  }

  function enhanceCards() {
    var grid = app.querySelector('.cars-card-grid');
    if (!grid) return;
    grid.setAttribute('data-fr-cars-result', '');
    var saved = readWatchlist();
    grid.querySelectorAll('.cars-card').forEach(function enhanceCard(card) {
      var link = card.querySelector('h3 a');
      var actions = card.querySelector('.cars-card-actions');
      if (!link || !actions || actions.querySelector('[data-fr-cars-watch]')) return;
      var href = frenchCarsHref(link.getAttribute('href'));
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'cars-button secondary';
      button.setAttribute('data-fr-cars-watch', href);
      button.textContent = saved.some(function savedItem(item) { return item.href === href; })
        ? 'Dans la liste de suivi'
        : 'Ajouter à la liste de suivi';
      actions.appendChild(button);
    });
  }

  function processDirectory() {
    if (processing) return;
    processing = true;
    app.setAttribute('data-fr-cars-full-product', '20-markets-10-make-options');
    var heading = app.querySelector('h1');
    if (heading) heading.textContent = 'Annuaire africain des prix automobiles';
    var heroCopy = app.querySelector('.cars-hero-band p');
    if (heroCopy) {
      heroCopy.textContent = 'Comparez les prix à la source, le coût rendu, la fourchette locale, les risques, la revente et le financement dans la devise du marché choisi.';
    }
    var context = app.querySelector('.cars-insight-grid .cars-insight:last-child');
    if (context) {
      var contextParagraphs = context.querySelectorAll('p');
      if (contextParagraphs[0]) {
        contextParagraphs[0].textContent = 'Le stockage, la manutention, le transitaire, la valorisation et l’immatriculation peuvent modifier fortement le budget final.';
      }
      if (contextParagraphs[1]) {
        contextParagraphs[1].textContent = 'Vérifiez l’âge admissible et toute exception auprès de l’autorité ou d’un professionnel habilité avant paiement.';
      }
    }
    var freshness = app.querySelector('.cars-freshness-note');
    if (freshness) {
      freshness.innerHTML = '<strong>Quelle est la fraîcheur des données ?</strong> Fourchettes indicatives et hypothèses de change enregistrées, jamais un devis vendeur en direct. Confirmez le prix, la douane, les frais, le financement et l’état du véhicule avant achat.';
    }
    var sourceBlock = app.querySelector('.cars-source-block');
    if (sourceBlock) {
      var sourceStatus = sourceBlock.querySelector('.cars-section-head span');
      if (sourceStatus) sourceStatus.textContent = 'Fourchettes de planification enregistrées, non actualisées en direct';
      var sourceIntro = sourceBlock.querySelector(':scope > p');
      if (sourceIntro) {
        sourceIntro.textContent = 'Les marchés sans jeu de règles complet utilisent une estimation d’annuaire. Confirmez l’admissibilité et la valorisation avant d’engager des fonds.';
      }
    }
    app.querySelectorAll('a[href^="/cars"]').forEach(function localizeLink(link) {
      link.setAttribute('href', frenchCarsHref(link.getAttribute('href')));
    });
    app.querySelectorAll('input[name="maxBudgetLocal"],input[name="maxMonthlyLocal"],input[name="maxRisk"],input[name="minLiquidity"]')
      .forEach(function numericInput(input) {
        input.type = 'number';
        input.min = '0';
      });
    var walker = document.createTreeWalker(app, NodeFilter.SHOW_TEXT);
    var textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach(function translateNode(node) {
      var translated = translate(node.nodeValue);
      if (translated !== node.nodeValue) node.nodeValue = translated;
    });
    app.querySelectorAll('[placeholder],[aria-label],[title]').forEach(function translateAttributes(element) {
      ['placeholder', 'aria-label', 'title'].forEach(function updateAttribute(attribute) {
        if (!element.hasAttribute(attribute)) return;
        var translated = translate(element.getAttribute(attribute));
        if (translated !== element.getAttribute(attribute)) element.setAttribute(attribute, translated);
      });
    });
    enhanceCards();
    renderWatchlist();
    processing = false;
  }

  function scheduleProcessing() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(function processMutationBatch() {
      scheduled = false;
      processDirectory();
    }, 0);
  }

  app.addEventListener('click', function handleWatchlist(event) {
    var add = event.target.closest('[data-fr-cars-watch]');
    var remove = event.target.closest('[data-fr-cars-watch-remove]');
    if (!add && !remove) return;
    var items = readWatchlist();
    if (add) {
      var href = add.getAttribute('data-fr-cars-watch');
      var card = add.closest('.cars-card');
      var label = card && card.querySelector('h3') ? card.querySelector('h3').textContent.trim() : href;
      if (!items.some(function savedItem(item) { return item.href === href; })) items.push({ href: href, label: label });
      writeWatchlist(items);
    } else {
      var removeHref = remove.getAttribute('data-fr-cars-watch-remove');
      writeWatchlist(items.filter(function keepItem(item) { return item.href !== removeHref; }));
    }
    processDirectory();
  });

  new MutationObserver(scheduleProcessing).observe(app, { childList: true, subtree: true });
  [0, 250, 1000, 2500].forEach(function boundedPass(delay) {
    setTimeout(processDirectory, delay);
  });
})();

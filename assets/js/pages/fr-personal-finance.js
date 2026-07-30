(function initFrenchPersonalFinance(root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AfroToolsFrenchPersonalFinance = api;
  if (root && root.document) {
    if (root.document.readyState === 'loading') {
      root.document.addEventListener('DOMContentLoaded', api.mount);
    } else {
      api.mount();
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createFrenchPersonalFinance() {
  'use strict';

  var STORAGE_PREFIX = 'afrotools:fr:personal-finance:';
  var REVIEW_DATE = '2026-07-18';
  var CURRENCIES = Object.freeze({
    NG: { code: 'NGN', symbol: '₦', country: 'Nigeria' },
    KE: { code: 'KES', symbol: 'KSh', country: 'Kenya' },
    ZA: { code: 'ZAR', symbol: 'R', country: 'Afrique du Sud' },
    GH: { code: 'GHS', symbol: 'GH₵', country: 'Ghana' },
    EG: { code: 'EGP', symbol: 'E£', country: 'Égypte' },
    ET: { code: 'ETB', symbol: 'Br', country: 'Éthiopie' },
    TZ: { code: 'TZS', symbol: 'TSh', country: 'Tanzanie' },
    UG: { code: 'UGX', symbol: 'USh', country: 'Ouganda' },
    RW: { code: 'RWF', symbol: 'RF', country: 'Rwanda' },
    CI: { code: 'XOF', symbol: 'FCFA', country: 'Côte d’Ivoire' },
    SN: { code: 'XOF', symbol: 'FCFA', country: 'Sénégal' },
    CM: { code: 'XAF', symbol: 'FCFA', country: 'Cameroun' },
    MA: { code: 'MAD', symbol: 'DH', country: 'Maroc' },
    TN: { code: 'TND', symbol: 'DT', country: 'Tunisie' },
    AO: { code: 'AOA', symbol: 'Kz', country: 'Angola' },
    ZM: { code: 'ZMW', symbol: 'ZK', country: 'Zambie' },
    ZW: { code: 'USD', symbol: '$', country: 'Zimbabwe' }
  });

  var HUSTLES = Object.freeze([
    { id: 'freelance_writing', sortName: 'Freelance Writing / Content', name: 'Rédaction freelance et contenu', skills: ['writing'], capitalMin: 0, hoursMin: 5, check: 'Créez deux échantillons adaptés, définissez un petit pilote payant et demandez à plusieurs prospects réels ce qu’ils achèteraient.' },
    { id: 'graphics_design', sortName: 'Graphic Design / Branding', name: 'Design graphique et identité visuelle', skills: ['design'], capitalMin: 50, hoursMin: 10, check: 'Constituez un petit portfolio, cadrez les révisions et les fichiers livrés, puis testez un brief payé.' },
    { id: 'tutoring', sortName: 'Private Tutoring / Online Teaching', name: 'Cours particuliers et enseignement en ligne', skills: ['teaching'], capitalMin: 0, hoursMin: 5, check: 'Confirmez le programme, la protection des mineurs, le lieu ou la plateforme, les conditions de séance et les attentes du responsable.' },
    { id: 'ride_hailing', sortName: 'Ride-Hailing Driver (Uber/Bolt/InDriver)', name: 'Chauffeur VTC', skills: ['driving'], capitalMin: 200, hoursMin: 20, check: 'Vérifiez les règles actuelles de plateforme, permis, assurance, véhicule, sécurité et fiscalité, puis chiffrez carburant, entretien et kilomètres à vide.' },
    { id: 'food_sales', sortName: 'Home Food Business / Catering', name: 'Cuisine à domicile et traiteur', skills: ['cooking'], capitalMin: 50, hoursMin: 10, check: 'Chiffrez ingrédients, emballage, pertes et livraison, puis vérifiez les règles locales d’hygiène, d’étiquetage et de locaux.' },
    { id: 'social_media_mgmt', sortName: 'Social Media Management', name: 'Gestion de réseaux sociaux', skills: ['social', 'writing'], capitalMin: 0, hoursMin: 10, check: 'Préparez un calendrier exemple, cadrez les validations et accès aux comptes, puis vendez un pilote court aux livrables précis.' },
    { id: 'mini_importation', sortName: 'Mini-Importation / eCommerce', name: 'Mini-importation et e-commerce', skills: ['sales'], capitalMin: 200, hoursMin: 10, check: 'Testez la demande avec un petit lot conforme et chiffrez produit, fret, droits, taxes, pertes, retours et dernier kilomètre.' },
    { id: 'photography', sortName: 'Photography / Videography', name: 'Photo et vidéo', skills: ['photography'], capitalMin: 200, hoursMin: 10, check: 'Créez un portfolio respectueux du consentement et chiffrez matériel, transport, montage, stockage, délai et droits d’utilisation.' },
    { id: 'real_estate_agent', sortName: 'Real Estate Agent / Property Finder', name: 'Recherche immobilière et apport d’affaires', skills: ['sales'], capitalMin: 0, hoursMin: 10, check: 'Vérifiez localement licence, mandat, publicité, dépôt et commission avant de représenter un bien ou de manipuler des fonds.' },
    { id: 'beauty_hair', sortName: 'Hair / Beauty / Nails', name: 'Coiffure, beauté et onglerie', skills: ['beauty'], capitalMin: 50, hoursMin: 10, check: 'Confirmez formation, hygiène, produits, allergies, déchets et autorisations locales, puis tarifez une offre limitée.' },
    { id: 'freelance_dev', sortName: 'Web/App Development', name: 'Développement web et applications', skills: ['tech'], capitalMin: 0, hoursMin: 10, check: 'Construisez deux démos fonctionnelles, définissez les critères d’acceptation et la maintenance, puis proposez un pilote payé à périmètre fixe.' },
    { id: 'tailoring', sortName: 'Tailoring / Fashion Design', name: 'Couture et création de mode', skills: ['tailoring'], capitalMin: 200, hoursMin: 20, check: 'Testez une petite commande, documentez mesures et délais, puis chiffrez tissu, fournitures, travail, retouches et risque de reprise.' },
    { id: 'financial_consulting', sortName: 'Financial Advisory / Tax Filing', name: 'Appui financier et fiscal', skills: ['finance'], capitalMin: 0, hoursMin: 5, check: 'Ne proposez que les travaux permis par vos qualifications et règles locales; documentez périmètre, confidentialité, dossiers et responsabilité.' },
    { id: 'agric_produce', sortName: 'Agriculture / Produce Trading', name: 'Agriculture et commerce de produits', skills: ['farming'], capitalMin: 200, hoursMin: 20, check: 'Commencez par un petit cycle et modélisez saisonnalité, pertes, transport, stockage, conditions de l’acheteur et fonds de roulement.' },
    { id: 'repairs_maintenance', sortName: 'Phone/Electronics Repairs', name: 'Réparation de téléphones et appareils', skills: ['repair'], capitalMin: 50, hoursMin: 20, check: 'Formez-vous en pratique, protégez les données client, respectez la sécurité électrique et des batteries, puis cadrez pièces, garantie et dommages.' }
  ]);

  function finiteNonNegative(value) {
    return Number.isFinite(Number(value)) && Number(value) >= 0;
  }

  function fail(field, error) {
    return { ok: false, field: field, error: error };
  }

  function budget503020(input) {
    var fields = ['income', 'currentNeeds', 'currentWants', 'currentSavings'];
    for (var index = 0; index < fields.length; index += 1) {
      if (!finiteNonNegative(input[fields[index]])) {
        return fail(fields[index], 'Saisissez zéro ou un montant positif dans chaque champ.');
      }
    }
    var income = Number(input.income);
    if (income <= 0) return fail('income', 'Saisissez un revenu net mensuel supérieur à zéro.');
    var currentNeeds = Number(input.currentNeeds);
    var currentWants = Number(input.currentWants);
    var currentSavings = Number(input.currentSavings);
    var idealNeeds = income * 0.5;
    var idealWants = income * 0.3;
    var idealSavings = income * 0.2;
    var currentTotal = currentNeeds + currentWants + currentSavings;
    return {
      ok: true,
      income: income,
      idealNeeds: idealNeeds,
      idealWants: idealWants,
      idealSavings: idealSavings,
      currentNeeds: currentNeeds,
      currentWants: currentWants,
      currentSavings: currentSavings,
      currentTotal: currentTotal,
      needsGap: currentNeeds - idealNeeds,
      wantsGap: currentWants - idealWants,
      savingsGap: currentSavings - idealSavings,
      unallocated: income - currentTotal
    };
  }

  function albumBudget(input) {
    var moneyFields = ['studioRate', 'beatCost', 'mixCost', 'masterCost', 'coverArt', 'photoShoot', 'musicVideo', 'distroCost', 'playlistBudget', 'adsBudget', 'prBudget', 'netPerStream'];
    for (var index = 0; index < moneyFields.length; index += 1) {
      if (!finiteNonNegative(input[moneyFields[index]])) {
        return fail(moneyFields[index], 'Saisissez zéro ou un montant positif dans chaque champ monétaire.');
      }
    }
    var tracks = Number(input.tracks);
    var hoursPerTrack = Number(input.hoursPerTrack);
    if (!Number.isInteger(tracks) || tracks < 1 || tracks > 20) return fail('tracks', 'Saisissez un nombre entier de titres entre 1 et 20.');
    if (!Number.isFinite(hoursPerTrack) || hoursPerTrack <= 0) return fail('hoursPerTrack', 'Saisissez un nombre d’heures par titre supérieur à zéro.');
    var recordingCost = Number(input.studioRate) * hoursPerTrack * tracks;
    var mixingCost = Number(input.mixCost) * tracks;
    var production = recordingCost + Number(input.beatCost) + mixingCost + Number(input.masterCost);
    var visuals = Number(input.coverArt) + Number(input.photoShoot) + Number(input.musicVideo);
    var marketing = Number(input.distroCost) + Number(input.playlistBudget) + Number(input.adsBudget) + Number(input.prBudget);
    var total = production + visuals + marketing;
    var netPerStream = Number(input.netPerStream);
    return {
      ok: true,
      tracks: tracks,
      recordingCost: recordingCost,
      mixingCost: mixingCost,
      production: production,
      visuals: visuals,
      marketing: marketing,
      total: total,
      costPerTrack: total / tracks,
      contingency10: total * 0.1,
      contingency20: total * 0.2,
      breakEvenStreams: netPerStream > 0 ? Math.ceil(total / netPerStream) : null
    };
  }

  function filmBudget(input) {
    var fields = ['totalBudget', 'shootDays', 'cashSecured', 'contingencyPct', 'aboveLinePct', 'productionPct', 'postPct', 'marketingPct'];
    for (var index = 0; index < fields.length; index += 1) {
      if (!finiteNonNegative(input[fields[index]])) return fail(fields[index], 'Saisissez zéro ou un nombre positif dans chaque champ.');
    }
    var total = Number(input.totalBudget);
    var shootDays = Number(input.shootDays);
    var contingencyPct = Number(input.contingencyPct);
    var allocations = [Number(input.aboveLinePct), Number(input.productionPct), Number(input.postPct), Number(input.marketingPct)];
    if (total <= 0) return fail('totalBudget', 'Saisissez un budget total supérieur à zéro.');
    if (!Number.isInteger(shootDays) || shootDays < 1) return fail('shootDays', 'Saisissez un nombre entier de jours de tournage supérieur à zéro.');
    if (contingencyPct > 100 || allocations.some(function over100(value) { return value > 100; })) {
      return fail('contingencyPct', 'Chaque pourcentage doit rester entre 0 et 100.');
    }
    var allocationTotal = allocations.reduce(function sum(totalValue, value) { return totalValue + value; }, 0);
    if (Math.abs(allocationTotal - 100) > 0.001) {
      return fail('aboveLinePct', 'Les quatre allocations doivent totaliser 100 %. Total actuel : ' + allocationTotal.toFixed(1) + ' %.');
    }
    var contingency = total * contingencyPct / 100;
    var required = total + contingency;
    var cashSecured = Number(input.cashSecured);
    return {
      ok: true,
      total: total,
      shootDays: shootDays,
      perDay: total / shootDays,
      aboveLine: total * allocations[0] / 100,
      production: total * allocations[1] / 100,
      post: total * allocations[2] / 100,
      marketing: total * allocations[3] / 100,
      allocations: allocations,
      allocationTotal: allocationTotal,
      contingency: contingency,
      required: required,
      cashSecured: cashSecured,
      gap: Math.max(0, required - cashSecured),
      surplus: Math.max(0, cashSecured - required)
    };
  }

  function emergencyFund(input) {
    var fields = ['monthlyExpenses', 'targetMonths', 'oneOffCosts', 'currentSavings', 'monthlyContribution'];
    for (var index = 0; index < fields.length; index += 1) {
      if (!finiteNonNegative(input[fields[index]])) return fail(fields[index], 'Saisissez zéro ou un nombre positif dans chaque champ monétaire.');
    }
    var expenses = Number(input.monthlyExpenses);
    var targetMonths = Number(input.targetMonths);
    if (expenses <= 0) return fail('monthlyExpenses', 'Saisissez des dépenses essentielles mensuelles supérieures à zéro.');
    if (!Number.isInteger(targetMonths) || targetMonths < 1 || targetMonths > 24) {
      return fail('targetMonths', 'Choisissez un nombre entier de mois entre 1 et 24.');
    }
    var oneOff = Number(input.oneOffCosts);
    var currentSavings = Number(input.currentSavings);
    var contribution = Number(input.monthlyContribution);
    var target = expenses * targetMonths + oneOff;
    var gap = Math.max(0, target - currentSavings);
    return {
      ok: true,
      target: target,
      tier1: expenses + oneOff,
      tier2: target,
      tier3: expenses * 6 + oneOff,
      gap: gap,
      monthsToGoal: gap === 0 ? 0 : (contribution > 0 ? Math.ceil(gap / contribution) : null)
    };
  }

  function capitalBandFor(hustle) {
    return hustle.capitalMin === 0 ? 0 : (hustle.capitalMin <= 50 ? 1 : (hustle.capitalMin <= 200 ? 2 : 3));
  }

  function scoreHustle(hustle, skills, hours, capital) {
    var skillMatch = hustle.skills.some(function hasSkill(skill) { return skills.indexOf(skill) >= 0; });
    var skillPoints = skills.length === 0 ? 20 : (skillMatch ? 60 : 0);
    var requiredCapital = capitalBandFor(hustle);
    var capitalPoints = capital >= requiredCapital ? 20 : Math.max(0, 20 - (requiredCapital - capital) * 10);
    var hoursPoints = hours >= hustle.hoursMin ? 20 : Math.round(hours / hustle.hoursMin * 20);
    return {
      score: skillPoints + capitalPoints + hoursPoints,
      skill: skillPoints / 6,
      capital: capitalPoints / 2,
      time: hoursPoints / 2,
      skillMatch: skillMatch,
      requiredCapital: requiredCapital
    };
  }

  function rankSideHustles(input) {
    var hours = Number(input.hours);
    var capital = Number(input.capital);
    var skills = Array.isArray(input.skills) ? input.skills.slice() : [];
    if (!Number.isFinite(hours) || hours <= 0) return fail('hours', 'Choisissez un temps hebdomadaire disponible.');
    if (!Number.isInteger(capital) || capital < 0 || capital > 3) return fail('capital', 'Choisissez une tranche de capital valide.');
    var ranked = HUSTLES.map(function withScore(hustle) {
      return { hustle: hustle, fit: scoreHustle(hustle, skills, hours, capital) };
    }).sort(function byScore(left, right) {
      return right.fit.score - left.fit.score || left.hustle.sortName.localeCompare(right.hustle.sortName);
    });
    return { ok: true, skills: skills, hours: hours, capital: capital, top5: ranked.slice(0, 5) };
  }

  var FORMULAS = Object.freeze({
    'budget-50-30-20': budget503020,
    'budget-album-ep': albumBudget,
    'budget-film': filmBudget,
    'fonds-urgence-securite': emergencyFund,
    'classement-activites': rankSideHustles
  });

  function currencyFor(input) {
    return CURRENCIES[input.country] || CURRENCIES.NG;
  }

  function formatMoney(value, currency) {
    return currency.symbol + ' ' + Math.round(value).toLocaleString('fr-FR');
  }

  function formatNumber(value) {
    return Math.round(value).toLocaleString('fr-FR');
  }

  function percent(value, total) {
    return total > 0 ? Math.round(value / total * 100) + ' %' : '0 %';
  }

  function metric(label, value, note) {
    return '<article class="pf-metric"><span>' + label + '</span><strong>' + value + '</strong><small>' + note + '</small></article>';
  }

  function renderBudget(result, input) {
    var currency = currencyFor(input);
    var rows = [
      ['Besoins', result.idealNeeds, result.currentNeeds, result.needsGap],
      ['Envies', result.idealWants, result.currentWants, result.wantsGap],
      ['Épargne et dette supplémentaire', result.idealSavings, result.currentSavings, result.savingsGap]
    ];
    return '<div class="pf-result-hero"><p>Répartition mensuelle indicative</p><strong>' + formatMoney(result.income, currency) + '</strong><span>' +
      (result.unallocated >= 0 ? formatMoney(result.unallocated, currency) + ' non affectés' : 'Dépassement de ' + formatMoney(-result.unallocated, currency)) +
      '</span></div><div class="pf-metrics">' +
      metric('Besoins · 50 %', formatMoney(result.idealNeeds, currency), 'Plafond indicatif') +
      metric('Envies · 30 %', formatMoney(result.idealWants, currency), 'Part indicative') +
      metric('Épargne · 20 %', formatMoney(result.idealSavings, currency), 'Objectif indicatif') +
      '</div><div class="pf-table-wrap"><table><caption>Comparaison avec vos montants actuels</caption><thead><tr><th>Bloc</th><th>Cible</th><th>Actuel</th><th>Écart</th></tr></thead><tbody>' +
      rows.map(function row(item) {
        var gap = item[3];
        return '<tr><th scope="row">' + item[0] + '</th><td>' + formatMoney(item[1], currency) + '</td><td>' +
          formatMoney(item[2], currency) + ' · ' + percent(item[2], result.income) + '</td><td>' +
          (gap === 0 ? 'Sur la cible' : (gap > 0 ? '+' : '−') + formatMoney(Math.abs(gap), currency)) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function renderAlbum(result, input) {
    var currency = currencyFor(input);
    return '<div class="pf-result-hero"><p>Budget saisi pour la sortie</p><strong>' + formatMoney(result.total, currency) + '</strong><span>' +
      currency.code + ' · aucune conversion automatique</span></div><div class="pf-metrics">' +
      metric('Production audio', formatMoney(result.production, currency), 'Enregistrement, beats, mixage, mastering') +
      metric('Visuels', formatMoney(result.visuals, currency), 'Pochette, photo, vidéo') +
      metric('Sortie et promotion', formatMoney(result.marketing, currency), 'Distribution, playlists, publicité, presse') +
      metric('Coût par titre', formatMoney(result.costPerTrack, currency), result.tracks + ' titre(s)') +
      '</div><div class="pf-table-wrap"><table><caption>Scénarios de marge de sécurité</caption><thead><tr><th>Scénario</th><th>Total</th><th>Réserve ajoutée</th></tr></thead><tbody>' +
      '<tr><th scope="row">Plan saisi</th><td>' + formatMoney(result.total, currency) + '</td><td>' + formatMoney(0, currency) + '</td></tr>' +
      '<tr><th scope="row">Réserve de 10 %</th><td>' + formatMoney(result.total + result.contingency10, currency) + '</td><td>' + formatMoney(result.contingency10, currency) + '</td></tr>' +
      '<tr><th scope="row">Réserve de 20 %</th><td>' + formatMoney(result.total + result.contingency20, currency) + '</td><td>' + formatMoney(result.contingency20, currency) + '</td></tr>' +
      '</tbody></table></div><p class="pf-result-note"><strong>Seuil de recettes nettes par stream :</strong> ' +
      (result.breakEvenStreams === null ? 'ajoutez votre recette nette observée par stream.' : formatNumber(result.breakEvenStreams) + ' streams, selon votre seule hypothèse de recette nette.') + '</p>';
  }

  function renderFilm(result, input) {
    var currency = currencyFor(input);
    var labels = ['Au-dessus de la ligne', 'Production physique', 'Postproduction', 'Marketing et livraison'];
    var amounts = [result.aboveLine, result.production, result.post, result.marketing];
    return '<div class="pf-result-hero"><p>Budget de production saisi</p><strong>' + formatMoney(result.total, currency) + '</strong><span>' +
      currency.code + ' · ' + formatMoney(result.perDay, currency) + ' par jour de tournage</span></div><div class="pf-metrics">' +
      labels.map(function allocation(label, index) {
        return metric(label, formatMoney(amounts[index], currency), result.allocations[index] + ' % saisis');
      }).join('') + '</div><div class="pf-table-wrap"><table><caption>Financement et réserve</caption><tbody>' +
      '<tr><th scope="row">Réserve (' + Number(input.contingencyPct) + ' %)</th><td>' + formatMoney(result.contingency, currency) + '</td></tr>' +
      '<tr><th scope="row">Budget avec réserve</th><td>' + formatMoney(result.required, currency) + '</td></tr>' +
      '<tr><th scope="row">Financement confirmé saisi</th><td>' + formatMoney(result.cashSecured, currency) + '</td></tr>' +
      '<tr><th scope="row">' + (result.gap > 0 ? 'Écart de financement' : 'Solde après réserve') + '</th><td><strong>' +
      formatMoney(result.gap > 0 ? result.gap : result.surplus, currency) + '</strong></td></tr></tbody></table></div>';
  }

  function renderEmergency(result, input) {
    var currency = currencyFor(input);
    var monthsText = result.monthsToGoal === null ? 'Ajoutez une contribution mensuelle' :
      (result.monthsToGoal === 0 ? 'Objectif déjà atteint' : result.monthsToGoal + ' mois au rythme saisi');
    return '<div class="pf-result-hero"><p>Objectif choisi</p><strong>' + formatMoney(result.target, currency) + '</strong><span>' +
      Number(input.targetMonths) + ' mois d’essentiels + coûts ponctuels</span></div><div class="pf-metrics">' +
      metric('Palier 1', formatMoney(result.tier1, currency), '1 mois + coûts ponctuels') +
      metric('Palier choisi', formatMoney(result.tier2, currency), Number(input.targetMonths) + ' mois + coûts ponctuels') +
      metric('Repère 6 mois', formatMoney(result.tier3, currency), 'Comparaison, pas une prescription') +
      metric('Reste à constituer', formatMoney(result.gap, currency), monthsText) +
      '</div>';
  }

  function renderHustles(result) {
    var capitalLabels = ['Aucun nouveau capital', 'Tranche faible', 'Tranche moyenne', 'Tranche élevée'];
    return '<div class="pf-result-hero"><p>Meilleure adéquation aux entrées</p><strong>' + result.top5[0].hustle.name + '</strong><span>Ce classement ne prévoit ni revenu ni bénéfice.</span></div><div class="pf-ranked-list">' +
      result.top5.map(function card(item, index) {
        return '<article class="pf-ranked-card"><span class="pf-rank">#' + (index + 1) + '</span><div><h3>' + item.hustle.name + '</h3><p><strong>' +
          item.fit.score + '/100 d’adéquation</strong> · ' + item.hustle.hoursMin + ' h/semaine minimum · ' +
          capitalLabels[item.fit.requiredCapital] + '</p><dl><div><dt>Compétences</dt><dd>' + item.fit.skill + '/10</dd></div><div><dt>Capital</dt><dd>' +
          item.fit.capital + '/10</dd></div><div><dt>Temps</dt><dd>' + item.fit.time + '/10</dd></div></dl><p><strong>Avant de dépenser :</strong> ' +
          item.hustle.check + '</p></div></article>';
      }).join('') + '</div>';
  }

  var RENDERERS = Object.freeze({
    'budget-50-30-20': renderBudget,
    'budget-album-ep': renderAlbum,
    'budget-film': renderFilm,
    'fonds-urgence-securite': renderEmergency,
    'classement-activites': renderHustles
  });

  function collect(form) {
    var data = {};
    Array.prototype.forEach.call(form.elements, function read(element) {
      if (!element.name || element.type === 'file' || element.type === 'button' || element.type === 'submit') return;
      if (element.type === 'checkbox') {
        if (!data[element.name]) data[element.name] = [];
        if (element.checked) data[element.name].push(element.value);
      } else {
        data[element.name] = element.value;
      }
    });
    return data;
  }

  function applyInputs(form, inputs) {
    Array.prototype.forEach.call(form.elements, function apply(element) {
      if (!element.name || !Object.prototype.hasOwnProperty.call(inputs, element.name)) return;
      if (element.type === 'checkbox') {
        element.checked = Array.isArray(inputs[element.name]) && inputs[element.name].indexOf(element.value) >= 0;
      } else if (element.type !== 'file') {
        element.value = String(inputs[element.name]);
      }
    });
  }

  function status(form, message, kind) {
    var node = form.querySelector('[data-status]');
    if (!node) return;
    node.textContent = message;
    node.dataset.kind = kind || 'info';
  }

  function focusField(form, fieldName) {
    var field = form.elements.namedItem(fieldName);
    if (field && typeof field.focus === 'function') field.focus();
  }

  function clearCalculation(form) {
    form._lastCalculation = null;
    var output = document.querySelector('[data-result]');
    if (!output) return;
    output.hidden = true;
    output.innerHTML = '';
  }

  function calculate(form, options) {
    var app = form.dataset.app;
    var inputs = collect(form);
    var result = FORMULAS[app](inputs);
    if (!result.ok) {
      clearCalculation(form);
      status(form, result.error, 'error');
      focusField(form, result.field);
      return { inputs: inputs, result: result };
    }
    var output = document.querySelector('[data-result]');
    output.innerHTML = RENDERERS[app](result, inputs);
    output.hidden = false;
    status(form, 'Calcul terminé localement. Aucun montant n’a été envoyé.', 'success');
    form._lastCalculation = { inputs: inputs, result: result };
    if (!options || options.scroll !== false) output.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return form._lastCalculation;
  }

  function summaryText(app, calculation) {
    var inputs = calculation.inputs;
    var result = calculation.result;
    var currency = currencyFor(inputs);
    var lines = ['AfroTools · Finances personnelles', 'Application : ' + app, 'Calcul local · estimation de planification', 'Devise affichée : ' + currency.code + ' (aucune conversion)', 'Méthode vérifiée : ' + REVIEW_DATE, ''];
    if (app === 'budget-50-30-20') {
      lines.push('Revenu : ' + formatMoney(result.income, currency), 'Besoins 50 % : ' + formatMoney(result.idealNeeds, currency), 'Envies 30 % : ' + formatMoney(result.idealWants, currency), 'Épargne 20 % : ' + formatMoney(result.idealSavings, currency));
    } else if (app === 'budget-album-ep') {
      lines.push('Budget total : ' + formatMoney(result.total, currency), 'Production audio : ' + formatMoney(result.production, currency), 'Visuels : ' + formatMoney(result.visuals, currency), 'Sortie et promotion : ' + formatMoney(result.marketing, currency));
    } else if (app === 'budget-film') {
      lines.push('Budget de base : ' + formatMoney(result.total, currency), 'Budget avec réserve : ' + formatMoney(result.required, currency), 'Écart de financement : ' + formatMoney(result.gap, currency));
    } else if (app === 'fonds-urgence-securite') {
      lines.push('Objectif : ' + formatMoney(result.target, currency), 'Reste à constituer : ' + formatMoney(result.gap, currency), 'Délai : ' + (result.monthsToGoal === null ? 'contribution requise' : result.monthsToGoal + ' mois'));
    } else {
      result.top5.forEach(function add(item, index) { lines.push((index + 1) + '. ' + item.hustle.name + ' · ' + item.fit.score + '/100'); });
    }
    lines.push('', 'Limite : résultat indicatif fondé uniquement sur les entrées; ce n’est ni un conseil financier, ni un prix, ni une garantie.');
    return lines.join('\n');
  }

  function download(name, content, type) {
    var blob = new Blob([content], { type: type });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function revoke() { URL.revokeObjectURL(url); }, 0);
  }

  function ensureCalculation(form) {
    return calculate(form, { scroll: false });
  }

  function handleAction(form, button) {
    var app = form.dataset.app;
    var action = button.dataset.action;
    var storageKey = STORAGE_PREFIX + app + ':v1';
    if (action === 'calculate') {
      calculate(form);
      return;
    }
    if (action === 'save') {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ schemaVersion: 1, appId: app, savedAt: new Date().toISOString(), inputs: collect(form) }));
        status(form, 'Brouillon enregistré uniquement sur cet appareil.', 'success');
      } catch (error) {
        status(form, 'Le navigateur a refusé l’enregistrement local.', 'error');
      }
      return;
    }
    if (action === 'restore') {
      try {
        var saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
        if (!saved || saved.appId !== app || !saved.inputs) throw new Error('missing');
        applyInputs(form, saved.inputs);
        calculate(form, { scroll: false });
        status(form, 'Brouillon local rouvert et recalculé. Vérifiez les montants.', 'success');
      } catch (error) {
        status(form, 'Aucun brouillon local valide pour cette application.', 'error');
      }
      return;
    }
    if (action === 'reset') {
      form.reset();
      clearCalculation(form);
      try { localStorage.removeItem(storageKey); } catch (error) { /* storage unavailable */ }
      status(form, 'Formulaire réinitialisé et brouillon local supprimé.', 'success');
      return;
    }
    if (action === 'import') {
      form.querySelector('[data-import]').click();
      return;
    }
    var calculation = ensureCalculation(form);
    if (!calculation.result.ok) return;
    var summary = summaryText(app, calculation);
    if (action === 'copy') {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(summary).then(function copied() {
          status(form, 'Résumé copié.', 'success');
        }).catch(function copyFailed() {
          status(form, 'Copie refusée par le navigateur. Utilisez l’export TXT.', 'error');
        });
      } else {
        status(form, 'Copie indisponible. Utilisez l’export TXT.', 'error');
      }
    } else if (action === 'txt') {
      download(app + '-afrotools.txt', summary, 'text/plain;charset=utf-8');
      status(form, 'Fichier TXT préparé localement.', 'success');
    } else if (action === 'json') {
      download(app + '-afrotools.json', JSON.stringify({
        schemaVersion: 1,
        appId: app,
        exportedAt: new Date().toISOString(),
        inputs: calculation.inputs,
        result: calculation.result,
        boundary: 'planning_estimate_browser_local',
        reviewedAt: REVIEW_DATE
      }, null, 2), 'application/json;charset=utf-8');
      status(form, 'Sauvegarde JSON préparée localement; elle peut être réimportée.', 'success');
    } else if (action === 'print') {
      window.print();
      status(form, 'Dialogue d’impression ouvert. Choisissez « Enregistrer au format PDF » si disponible.', 'success');
    }
  }

  function importJson(form, file) {
    var reader = new FileReader();
    reader.addEventListener('load', function loaded() {
      try {
        var payload = JSON.parse(String(reader.result || ''));
        if (!payload || payload.schemaVersion !== 1 || payload.appId !== form.dataset.app || !payload.inputs) throw new Error('invalid');
        applyInputs(form, payload.inputs);
        calculate(form, { scroll: false });
        status(form, 'Sauvegarde JSON rouverte localement. Vérifiez les entrées.', 'success');
      } catch (error) {
        status(form, 'Ce fichier JSON ne correspond pas à cette application.', 'error');
      }
    });
    reader.addEventListener('error', function failed() { status(form, 'Lecture locale du fichier impossible.', 'error'); });
    reader.readAsText(file);
  }

  function applyTheme(choice) {
    var resolved = choice;
    if (choice === 'auto') resolved = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.dataset.theme = resolved;
    document.documentElement.dataset.themeChoice = choice;
    document.documentElement.style.colorScheme = resolved;
    var toggle = document.querySelector('[data-theme-toggle]');
    if (toggle) toggle.textContent = 'Thème : ' + (choice === 'auto' ? 'auto' : (choice === 'dark' ? 'sombre' : 'clair'));
  }

  function cycleTheme() {
    var current = document.documentElement.dataset.themeChoice || 'auto';
    var next = current === 'auto' ? 'light' : (current === 'light' ? 'dark' : 'auto');
    try {
      if (next === 'auto') localStorage.removeItem('aft_theme');
      else localStorage.setItem('aft_theme', next);
    } catch (error) { /* theme still applies for this view */ }
    applyTheme(next);
  }

  function mount() {
    var form = document.querySelector('[data-personal-finance-form]');
    var themeToggle = document.querySelector('[data-theme-toggle]');
    if (themeToggle) {
      themeToggle.addEventListener('click', cycleTheme);
      applyTheme(document.documentElement.dataset.themeChoice || 'auto');
    }
    if (!form || form.dataset.mounted === 'true') return;
    form.dataset.mounted = 'true';
    form.addEventListener('submit', function submitted(event) {
      event.preventDefault();
      calculate(form);
    });
    form.addEventListener('click', function clicked(event) {
      var button = event.target.closest('[data-action]');
      if (!button) return;
      handleAction(form, button);
    });
    var exportActions = document.querySelector('.pf-export-actions');
    if (exportActions) {
      exportActions.addEventListener('click', function exportClicked(event) {
        var button = event.target.closest('[data-action]');
        if (!button) return;
        handleAction(form, button);
      });
    }
    var projectType = form.elements.namedItem('projectType');
    if (projectType) {
      projectType.addEventListener('change', function projectChanged() {
        var tracks = form.elements.namedItem('tracks');
        var defaults = { single: 1, ep: 5, album: 12 };
        if (tracks && defaults[projectType.value]) tracks.value = defaults[projectType.value];
      });
    }
    var importer = form.querySelector('[data-import]');
    if (importer) {
      importer.addEventListener('change', function selected() {
        if (importer.files && importer.files[0]) importJson(form, importer.files[0]);
        importer.value = '';
      });
    }
  }

  return Object.freeze({
    REVIEW_DATE: REVIEW_DATE,
    currencies: CURRENCIES,
    hustles: HUSTLES,
    formulas: FORMULAS,
    mount: mount
  });
});

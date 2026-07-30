(function initFrenchMiningParityPage(root) {
  'use strict';

  var engine = root.AfroToolsMiningPlanners;
  var form = document.getElementById('mining-form');
  if (!engine || !form) return;

  var tool = document.body.getAttribute('data-mining-tool');
  var result = document.getElementById('result');
  var error = document.getElementById('error');
  var status = document.getElementById('status');
  var sourceSummary = document.getElementById('source-summary');
  var breakdown = document.getElementById('breakdown');
  var pdfButton = document.getElementById('pdf');
  var lastReport = null;
  var updatingDynamicFields = false;
  var EVIDENCE_FIELDS = ['sourceName', 'sourceDate', 'sourceConfidence'];

  var COUNTRY_NAMES = {
    BW: 'Botswana', BF: 'Burkina Faso', CD: 'RDC', CI: 'Côte d’Ivoire',
    EG: 'Égypte', GA: 'Gabon', GH: 'Ghana', KE: 'Kenya', LR: 'Liberia',
    MG: 'Madagascar', ML: 'Mali', NA: 'Namibie', NG: 'Nigeria',
    SL: 'Sierra Leone', TZ: 'Tanzanie', ZA: 'Afrique du Sud',
    ZM: 'Zambie', ZW: 'Zimbabwe'
  };
  var MINERAL_NAMES = {
    gold: 'Or', diamond: 'Diamant', bauxite: 'Bauxite', manganese: 'Manganèse',
    gemstone: 'Pierres précieuses', copper: 'Cuivre', coal: 'Charbon',
    platinum: 'Platine (MGP)', cobalt: 'Cobalt', coltan: 'Coltan / tantale',
    iron: 'Minerai de fer', lithium: 'Lithium', uranium: 'Uranium',
    tin: 'Étain', limestone: 'Calcaire', leadZinc: 'Plomb / zinc',
    titanium: 'Minerais de titane'
  };
  var LICENCE_NAMES = {
    reconnaissance: 'Permis de reconnaissance',
    exploration: 'Permis d’exploration',
    prospecting: 'Permis de prospection',
    smallScale: 'Licence minière à petite échelle',
    artisanal: 'Droit minier artisanal',
    mining: 'Licence d’exploitation minière',
    specialMining: 'Licence minière spéciale',
    claim: 'Claim minier'
  };
  var AREA_UNITS = {
    perKm2: 'km²',
    perHa: 'hectares',
    perCadastralUnit: 'unités cadastrales'
  };
  var ERROR_MESSAGES = {
    positive: 'Saisissez une valeur strictement supérieure à zéro.',
    source_price: 'Saisissez un prix provenant de votre référence récente : aucun prix n’est supposé.',
    numeric: 'Les valeurs doivent être numériques.',
    pressures: 'Saisissez la pression du réservoir et la pression en écoulement.',
    pressure_order: 'La pression du réservoir doit être supérieure à la pression en écoulement.',
    radius_order: 'Le rayon de drainage doit être supérieur au rayon du puits.',
    non_negative: 'Saisissez une valeur supérieure ou égale à zéro.',
    percentage: 'Saisissez un pourcentage compris entre 0 et 100.',
    uptime: 'Saisissez une disponibilité supérieure à 0 et inférieure ou égale à 100 %.',
    non_positive_flow: 'Ces hypothèses donnent un débit non positif. Vérifiez le skin et les rayons.',
    gross_or_volume_price: 'Saisissez le revenu brut, ou un volume et un prix strictement positifs.',
    selection: 'Choisissez une juridiction et un type applicable.',
    years: 'Saisissez une durée d’au moins un an.',
    missing_fee: 'Saisissez le frais vérifié : une valeur absente n’est jamais traitée comme zéro.',
    area: 'Cette licence est facturée selon la superficie. Saisissez une superficie positive.',
    missing_rate: 'Saisissez le taux de redevance effectif. Un taux absent n’est jamais traité comme 0 %.',
    team: 'Le nombre de mineurs doit être au moins égal à 1.',
    source_name: 'Indiquez le nom de la source ou du document utilisé pour ce scénario.',
    source_date: 'Indiquez la date à laquelle cette source a été vérifiée.',
    source_date_future: 'La date de vérification ne peut pas être dans le futur.',
    source_confidence: 'Choisissez le niveau de confiance de cette source.'
  };
  var TITLES = {
    'diamond-valuation': 'Rapport d’évaluation indicative du diamant',
    'oil-well-production': 'Rapport de production indicative du puits',
    'oil-gas-revenue': 'Rapport de partage des revenus pétroliers et gaziers',
    'mining-license-fee': 'Rapport de coût de licence minière',
    'mining-royalty': 'Rapport de redevance minière',
    'artisanal-mining-income': 'Rapport de revenu minier artisanal'
  };
  var FILENAMES = {
    'diamond-valuation': 'evaluation-diamant-afrotools.pdf',
    'oil-well-production': 'production-puits-petrole-afrotools.pdf',
    'oil-gas-revenue': 'partage-revenus-petrole-gaz-afrotools.pdf',
    'mining-license-fee': 'cout-licence-miniere-afrotools.pdf',
    'mining-royalty': 'redevance-miniere-afrotools.pdf',
    'artisanal-mining-income': 'revenu-minier-artisanal-afrotools.pdf'
  };

  function field(name) {
    return form.elements.namedItem(name);
  }

  function number(name) {
    var control = field(name);
    if (!control || control.value === '') return null;
    var value = Number(control.value);
    return Number.isFinite(value) ? value : null;
  }

  function value(name) {
    var control = field(name);
    return control ? control.value : '';
  }

  function collectInputs(names) {
    var inputs = {};
    names.forEach(function (name) { inputs[name] = number(name); });
    return inputs;
  }

  function formatNumber(numberValue, decimals) {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(numberValue);
  }

  function formatMoney(numberValue, symbol) {
    return (symbol ? symbol + ' ' : '') + formatNumber(numberValue, 2);
  }

  function formatWhole(numberValue) {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(numberValue));
  }

  function setOutput(name, raw, formatted) {
    var output = document.querySelector('[data-output="' + name + '"]');
    if (!output) return;
    output.dataset.raw = String(raw);
    output.textContent = formatted;
  }

  function clearValidity() {
    Array.prototype.forEach.call(form.elements, function (control) {
      if (control && control.removeAttribute) control.removeAttribute('aria-invalid');
    });
  }

  function showError(failure) {
    clearValidity();
    result.hidden = true;
    result.classList.remove('is-stale');
    pdfButton.disabled = true;
    lastReport = null;
    var control = field(failure.field);
    if (control) {
      control.setAttribute('aria-invalid', 'true');
      control.focus();
    }
    error.textContent = ERROR_MESSAGES[failure.code] || 'Vérifiez les valeurs saisies.';
    error.hidden = false;
    status.textContent = 'Calcul interrompu : corrigez le champ signalé.';
  }

  function evidenceSummary(builtInText) {
    var sourceName = value('sourceName').trim();
    var sourceDate = value('sourceDate');
    var sourceConfidence = value('sourceConfidence');
    var parts = [
      builtInText,
      'Référence du scénario : ' + sourceName + '.',
      'Référence vérifiée le ' + sourceDate + '.',
      'Confiance déclarée : ' + sourceConfidence + '.'
    ];
    parts.push('Calcul local dans ce navigateur : aucune saisie n’est envoyée ni enregistrée.');
    return parts.join(' ');
  }

  function validateEvidence() {
    if (!value('sourceName').trim()) return { field: 'sourceName', code: 'source_name' };
    if (!value('sourceDate')) return { field: 'sourceDate', code: 'source_date' };
    if (value('sourceDate') > localToday()) return { field: 'sourceDate', code: 'source_date_future' };
    if (!value('sourceConfidence')) return { field: 'sourceConfidence', code: 'source_confidence' };
    return null;
  }

  function localToday() {
    var now = new Date();
    var local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function finish(report) {
    clearValidity();
    error.hidden = true;
    breakdown.innerHTML = report.rows.map(function (row) {
      return '<tr><td>' + row[0] + '</td><td>' + row[1] + '</td></tr>';
    }).join('');
    sourceSummary.textContent = report.source;
    result.hidden = false;
    result.classList.remove('is-stale');
    status.textContent = 'Estimation recalculée. Vérifiez les hypothèses et la source avant toute décision.';
    pdfButton.disabled = false;
    lastReport = report;
    result.focus();
  }

  function calculateDiamond() {
    var input = collectInputs(['carat', 'base', 'cut', 'color', 'clarity', 'pWhole', 'pIns', 'pResale']);
    var output = engine.diamond(input);
    if (!output.ok) return showError(output);
    setOutput('retail', output.retail, formatMoney(output.retail, '$'));
    setOutput('wholesale', output.wholesale, formatMoney(output.wholesale, '$'));
    setOutput('insurance', output.insurance, formatMoney(output.insurance, '$'));
    setOutput('resale', output.resale, formatMoney(output.resale, '$'));
    finish({
      rows: [
        ['Valeur de base (carat × prix)', formatMoney(output.baseValue, '$')],
        ['Facteur combiné des 4C', '× ' + formatNumber(output.qualityFactor, 3)],
        ['Valeur indicative ajustée', formatMoney(output.retail, '$')]
      ],
      source: evidenceSummary('Tous les prix sont saisis par l’utilisateur. Les facteurs 4C sont des coefficients relatifs, pas une cotation GIA ou Rapaport. Une expertise gemmologique reste nécessaire.')
    });
  }

  function calculateOilWell() {
    var input = collectInputs(['k', 'h', 'pe', 'pwf', 'mu', 'bo', 're', 'rw', 'skin', 'uptime', 'price', 'opex', 'roy']);
    var output = engine.oilWell(input);
    if (!output.ok) return showError(output);
    setOutput('q', output.q, formatWhole(output.q) + ' bbl/j');
    setOutput('annual', output.annual, formatWhole(output.annual) + ' bbl/an');
    setOutput('net', output.net, formatMoney(output.net, '$'));
    finish({
      rows: [
        ['Production quotidienne', formatWhole(output.q) + ' bbl/j'],
        ['Production annuelle ajustée', formatWhole(output.annual) + ' bbl/an'],
        ['Revenu brut', formatMoney(output.gross, '$')],
        ['Redevance', '− ' + formatMoney(output.royalty, '$')],
        ['Coût d’exploitation', '− ' + formatMoney(output.operating, '$')],
        ['Revenu net indicatif', formatMoney(output.net, '$')]
      ],
      source: evidenceSummary('Formule radiale de Darcy en régime permanent (0,00708 en unités pétrolières). Il s’agit d’un dépistage technique, pas d’une simulation de réservoir ni d’une prévision de terrain.')
    });
  }

  function calculateOilGas() {
    var input = collectInputs(['vol', 'price', 'gross', 'roy', 'costs', 'ceiling', 'conshare', 'tax']);
    var output = engine.oilGas(input);
    if (!output.ok) return showError(output);
    setOutput('contractorNet', output.contractorNet, formatMoney(output.contractorNet, '$'));
    setOutput('governmentTake', output.governmentTake, formatMoney(output.governmentTake, '$'));
    setOutput('governmentPct', output.governmentPct, formatNumber(output.governmentPct, 1) + ' %');
    finish({
      rows: [
        ['Revenu brut', formatMoney(output.gross, '$')],
        ['Redevance', '− ' + formatMoney(output.royalty, '$')],
        ['Cost oil récupéré', formatMoney(output.costOil, '$')],
        ['Profit oil', formatMoney(output.profitOil, '$')],
        ['Part de profit du contractant', formatMoney(output.contractorProfit, '$')],
        ['Part de profit de l’État', formatMoney(output.governmentProfit, '$')],
        ['Impôt sur le profit', formatMoney(output.taxAmount, '$')],
        ['Net du contractant', formatMoney(output.contractorNet, '$')],
        ['Part totale de l’État', formatMoney(output.governmentTake, '$')]
      ],
      source: evidenceSummary('Modèle PSC simplifié fondé uniquement sur vos conditions. Les contrats réels peuvent ajouter ring-fencing, tranches, uplift, report de coûts et clauses particulières.')
    });
  }

  function licenceData() {
    var data = root.MINING_FEES || { countries: {} };
    var country = data.countries[value('country')];
    var record = country && country.licences ? country.licences[value('licence')] : null;
    return { data: data, country: country, record: record };
  }

  function calculateLicence() {
    var selected = licenceData();
    var input = collectInputs(['area', 'years', 'oneOff', 'annual']);
    var output = engine.licence(input, selected.country, selected.record);
    if (!output.ok) return showError(output);
    setOutput('oneOffTotal', output.oneOffTotal, formatMoney(output.oneOffTotal, output.symbol));
    setOutput('annualComputed', output.annualComputed, formatMoney(output.annualComputed, output.symbol));
    setOutput('total', output.total, formatMoney(output.total, output.symbol));
    var authority = selected.country.authority || 'l’autorité minière compétente';
    var confidence = selected.country.confidence === 'high' ? 'élevée'
      : selected.country.confidence === 'medium' ? 'moyenne'
        : selected.country.confidence === 'low' ? 'faible' : 'non notée';
    finish({
      rows: [
        ['Frais de demande / initiaux', formatMoney(output.oneOffTotal, output.symbol)],
        ['Frais annuels calculés', formatMoney(output.annualComputed, output.symbol)],
        ['Durée', output.years + ' an' + (output.years > 1 ? 's' : '')],
        ['Total indicatif', formatMoney(output.total, output.symbol)]
      ],
      source: evidenceSummary('Données intégrées revues ' + (selected.data.lastUpdated || 'date non fournie')
        + '. Autorité citée : ' + authority + '. Confiance des données : ' + confidence
        + '. Les barèmes changent; confirmez le montant actuel avant paiement.')
    });
  }

  function royaltyData() {
    var data = root.MINING_DATA || { countries: {}, sources: {} };
    var country = data.countries[value('country')];
    var mineral = country && country.minerals ? country.minerals[value('mineral')] : null;
    return { data: data, country: country, mineral: mineral };
  }

  function calculateRoyalty() {
    var selected = royaltyData();
    var output = engine.royalty({ gross: number('gross'), rate: number('rate') }, selected.country);
    if (!output.ok) return showError(output);
    setOutput('royalty', output.royalty, formatMoney(output.royalty, output.symbol));
    setOutput('rate', output.rate, formatNumber(output.rate, 2) + ' %');
    setOutput('net', output.net, formatMoney(output.net, output.symbol));
    var source = selected.data.sources && selected.country ? selected.data.sources[selected.country.source] : null;
    var sourceLabel = source ? source.authority : 'ministère des Mines ou administration fiscale compétente';
    finish({
      rows: [
        ['Valeur marchande brute', formatMoney(output.gross, output.symbol)],
        ['Redevance', '− ' + formatMoney(output.royalty, output.symbol)],
        ['Prélèvement distinct', '− ' + formatMoney(output.extraLevy, output.symbol)],
        ['Produit net indicatif', formatMoney(output.net, output.symbol)]
      ],
      source: evidenceSummary('Barèmes intégrés revus ' + (selected.data.lastUpdated || 'date non fournie')
        + '. Source citée : ' + sourceLabel
        + '. Confiance : source officielle citée, taux à reconfirmer selon la date, le prix, le projet et la loi applicable.')
    });
  }

  function calculateArtisanal() {
    var input = collectInputs(['qty', 'formal', 'informalPct', 'costs', 'team']);
    var output = engine.artisanal(input);
    if (!output.ok) return showError(output);
    setOutput('netPerMiner', output.netPerMiner, formatMoney(output.netPerMiner, ''));
    setOutput('annualPerMiner', output.annualPerMiner, formatMoney(output.annualPerMiner, ''));
    setOutput('gap', output.gap, formatMoney(output.gap, ''));
    finish({
      rows: [
        ['Chiffre brut au prix agréé', formatMoney(output.formalGross, '')],
        ['Chiffre brut au prix informel', formatMoney(output.informalGross, '')],
        ['Écart de revenu', '− ' + formatMoney(output.gap, '')],
        ['Net mensuel de l’équipe', formatMoney(output.netTotal, '')],
        ['Net mensuel par mineur', formatMoney(output.netPerMiner, '')]
      ],
      source: evidenceSummary('Quantité, prix, charges et partage sont entièrement saisis par l’utilisateur. Ce résultat ne garantit ni rendement, ni prix, ni légalité de l’activité; vérifiez permis, sécurité, environnement et acheteur agréé.')
    });
  }

  var calculators = {
    'diamond-valuation': calculateDiamond,
    'oil-well-production': calculateOilWell,
    'oil-gas-revenue': calculateOilGas,
    'mining-license-fee': calculateLicence,
    'mining-royalty': calculateRoyalty,
    'artisanal-mining-income': calculateArtisanal
  };

  function populateLicenceOptions() {
    var data = root.MINING_FEES || { countries: {} };
    var countryControl = field('country');
    var licenceControl = field('licence');
    if (!countryControl || !licenceControl) return;
    updatingDynamicFields = true;
    var selectedCountry = countryControl.value;
    countryControl.innerHTML = Object.keys(data.countries).sort(function (left, right) {
      return (COUNTRY_NAMES[left] || data.countries[left].name).localeCompare(COUNTRY_NAMES[right] || data.countries[right].name, 'fr');
    }).map(function (code) {
      return '<option value="' + code + '">' + (COUNTRY_NAMES[code] || data.countries[code].name) + '</option>';
    }).join('');
    countryControl.value = selectedCountry && data.countries[selectedCountry] ? selectedCountry : countryControl.value;
    var country = data.countries[countryControl.value];
    licenceControl.innerHTML = Object.keys(country.licences || {}).map(function (key) {
      return '<option value="' + key + '">' + (LICENCE_NAMES[key] || 'Licence : ' + key) + '</option>';
    }).join('');
    syncLicenceFields();
    updatingDynamicFields = false;
  }

  function syncLicenceFields() {
    var selected = licenceData();
    if (!selected.record) return;
    updatingDynamicFields = true;
    field('oneOff').value = typeof selected.record.oneOff === 'number' ? selected.record.oneOff : '';
    field('annual').value = typeof selected.record.annual === 'number' ? selected.record.annual : '';
    var areaWrap = document.getElementById('area-wrap');
    var unit = AREA_UNITS[selected.record.annualBasis];
    areaWrap.hidden = !unit;
    document.getElementById('area-unit').textContent = unit || '';
    updatingDynamicFields = false;
    markStale();
  }

  function populateRoyaltyOptions() {
    var data = root.MINING_DATA || { countries: {} };
    var countryControl = field('country');
    if (!countryControl) return;
    updatingDynamicFields = true;
    countryControl.innerHTML = Object.keys(data.countries).sort(function (left, right) {
      return (COUNTRY_NAMES[left] || data.countries[left].name).localeCompare(COUNTRY_NAMES[right] || data.countries[right].name, 'fr');
    }).map(function (code) {
      return '<option value="' + code + '">' + (COUNTRY_NAMES[code] || data.countries[code].name) + '</option>';
    }).join('');
    syncRoyaltyMinerals();
    updatingDynamicFields = false;
  }

  function syncRoyaltyMinerals() {
    var selected = royaltyData();
    var mineralControl = field('mineral');
    var country = selected.country;
    if (!country || !mineralControl) return;
    updatingDynamicFields = true;
    mineralControl.innerHTML = Object.keys(country.minerals || {}).map(function (key) {
      return '<option value="' + key + '">' + (MINERAL_NAMES[key] || key) + '</option>';
    }).join('');
    syncRoyaltyRate();
    updatingDynamicFields = false;
  }

  function syncRoyaltyRate() {
    var selected = royaltyData();
    var rate = field('rate');
    var note = document.getElementById('rate-note');
    if (!selected.mineral || !rate || !note) return;
    updatingDynamicFields = true;
    if (selected.mineral.variable) {
      rate.value = '';
      rate.placeholder = 'Saisissez le taux effectif';
      note.textContent = 'Barème variable de ' + selected.mineral.min + ' % à ' + selected.mineral.max
        + ' %. Calculez puis saisissez le taux effectif applicable à votre opération.';
    } else {
      rate.value = selected.mineral.rate;
      note.textContent = 'Taux intégré de ' + selected.mineral.rate
        + ' % : modifiable et à reconfirmer auprès de la source officielle.';
    }
    updatingDynamicFields = false;
    markStale();
  }

  function markStale() {
    if (updatingDynamicFields || result.hidden) return;
    result.classList.add('is-stale');
    pdfButton.disabled = true;
    lastReport = null;
    status.textContent = 'Hypothèses modifiées : recalculez avant d’exporter.';
  }

  function resetPage() {
    form.reset();
    clearValidity();
    error.hidden = true;
    result.hidden = true;
    result.classList.remove('is-stale');
    pdfButton.disabled = true;
    lastReport = null;
    if (tool === 'mining-license-fee') populateLicenceOptions();
    if (tool === 'mining-royalty') populateRoyaltyOptions();
    status.textContent = 'Scénario réinitialisé. Aucune donnée n’a été enregistrée.';
  }

  function exportPdf() {
    if (!lastReport || !root.jspdf || !root.jspdf.jsPDF) return;
    var doc = new root.jspdf.jsPDF({ unit: 'pt', format: 'a4' });
    var y = 54;
    var width = 480;
    var pageBottom = 780;

    function writeWrapped(text, options) {
      var settings = options || {};
      var lines = doc.splitTextToSize(text, width);
      lines.forEach(function (line) {
        if (y > pageBottom) {
          doc.addPage();
          y = 54;
        }
        doc.text(line, 56, y);
        y += settings.lineHeight || 14;
      });
      y += settings.after || 0;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    writeWrapped(TITLES[tool], { lineHeight: 18, after: 8 });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    writeWrapped('AfroTools — estimation de planification locale', { after: 10 });
    lastReport.rows.forEach(function (row) {
      writeWrapped(row[0] + ' : ' + row[1], { after: 4 });
    });
    y += 8;
    if (y > pageBottom) {
      doc.addPage();
      y = 54;
    }
    doc.setFont('helvetica', 'bold');
    writeWrapped('Sources, fraicheur et confiance', { after: 2 });
    doc.setFont('helvetica', 'normal');
    writeWrapped(lastReport.source.replace(/[’]/g, "'"), { after: 16 });
    writeWrapped(
      'Estimation de planification uniquement. Confirmez les donnees, permis, taux, clauses et exigences avec un professionnel et l’autorite competente.',
      { after: 0 }
    );
    doc.save(FILENAMES[tool]);
    status.textContent = 'PDF créé localement. Le fichier n’a pas été envoyé à AfroTools.';
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var evidenceFailure = validateEvidence();
    if (evidenceFailure) {
      showError(evidenceFailure);
      return;
    }
    var calculator = calculators[tool];
    if (calculator) calculator();
  });
  form.addEventListener('input', markStale);
  form.addEventListener('change', markStale);
  EVIDENCE_FIELDS.forEach(function (name) {
    var control = field(name);
    if (!control) return;
    control.addEventListener('input', markStale);
    control.addEventListener('change', markStale);
  });
  var sourceDateControl = field('sourceDate');
  if (sourceDateControl) sourceDateControl.max = localToday();
  document.getElementById('reset').addEventListener('click', resetPage);
  pdfButton.addEventListener('click', exportPdf);

  if (tool === 'mining-license-fee') {
    populateLicenceOptions();
    field('country').addEventListener('change', function () {
      populateLicenceOptions();
    });
    field('licence').addEventListener('change', syncLicenceFields);
  }
  if (tool === 'mining-royalty') {
    populateRoyaltyOptions();
    field('country').addEventListener('change', syncRoyaltyMinerals);
    field('mineral').addEventListener('change', syncRoyaltyRate);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);

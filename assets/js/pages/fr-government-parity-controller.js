(function initFrenchGovernmentParity(root) {
  'use strict';

  var engine = root.AfroTools && root.AfroTools.governmentParityEngine;
  var configNode = document.getElementById('fg-config');
  var form = document.getElementById('fg-form');
  var fields = document.getElementById('fg-fields');
  var result = document.getElementById('fg-result');
  var resultBody = document.getElementById('fg-result-body');
  var status = document.getElementById('fg-status');
  var sourceCard = document.getElementById('fg-source-card');
  var sourceLink = document.getElementById('fg-source-link');
  var sourceMeta = document.getElementById('fg-source-meta');
  var exportJson = document.getElementById('fg-export-json');
  var exportTxt = document.getElementById('fg-export-txt');
  var importInput = document.getElementById('fg-import');
  if (!engine || !configNode || !form || !fields || !result || !resultBody) return;

  var config;
  try {
    config = JSON.parse(configNode.textContent);
  } catch (_) {
    status.textContent = 'Le contrat de cet outil ne peut pas être chargé.';
    return;
  }

  var sourceManifest = null;
  var sourceStatus = null;
  var electionData = null;
  var countryRegistry = [];
  var currentReceipt = null;
  var syncPermitCountry = null;
  var submitButton = form.querySelector('[type="submit"]');

  function element(tag, attributes, text) {
    var node = document.createElement(tag);
    Object.keys(attributes || {}).forEach(function (name) {
      if (name === 'className') node.className = attributes[name];
      else if (name === 'htmlFor') node.htmlFor = attributes[name];
      else if (name === 'hidden') node.hidden = Boolean(attributes[name]);
      else node.setAttribute(name, attributes[name]);
    });
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function field(id, label, type, options) {
    var wrap = element('div', { className: 'fg-field' });
    wrap.appendChild(element('label', { htmlFor: id }, label));
    var input;
    if (type === 'select') {
      input = element('select', { id: id, name: id });
      (options || []).forEach(function (option) {
        input.appendChild(element('option', { value: option[0] }, option[1]));
      });
    } else if (type === 'textarea') {
      input = element('textarea', { id: id, name: id, rows: '5' });
    } else {
      input = element('input', Object.assign({
        id: id,
        name: id,
        type: type || 'text'
      }, options || {}));
    }
    wrap.appendChild(input);
    return wrap;
  }

  function read(id) {
    var input = form.elements[id];
    return input ? input.value : '';
  }

  function currency() {
    return String(read('currency') || 'XOF').trim().toUpperCase();
  }

  function lineList(lines) {
    var list = element('div', { className: 'fg-lines' });
    lines.forEach(function (line) {
      var row = element('div');
      row.appendChild(element('span', {}, line[0]));
      row.appendChild(element('strong', {}, line[1]));
      list.appendChild(row);
    });
    return list;
  }

  function addMetric(text) {
    resultBody.appendChild(element('div', { className: 'fg-metric' }, text));
  }

  function clearResult() {
    resultBody.replaceChildren();
    result.hidden = true;
    currentReceipt = null;
  }

  function toolRecord() {
    return sourceManifest && (sourceManifest.tools || []).find(function (tool) {
      return tool.id === config.id;
    });
  }

  function sourceRecords() {
    var tool = toolRecord();
    if (!tool) return [];
    var ids = new Set(tool.sourceIds || []);
    return (sourceManifest.sources || []).filter(function (source) { return ids.has(source.id); });
  }

  function sourceStatusRecord(sourceId) {
    return sourceStatus && (sourceStatus.sources || []).find(function (source) {
      return source.id === sourceId;
    });
  }

  function selectedSource() {
    var select = form.elements.source;
    if (!select || !select.value) return null;
    return sourceRecords().find(function (source) { return source.id === select.value; }) || null;
  }

  function formatDate(value) {
    var date = new Date(value);
    if (!Number.isFinite(date.getTime())) return 'date de contrôle indisponible';
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(date);
  }

  function sourceCadenceDays() {
    var tool = toolRecord();
    return tool && tool.priority === 'high' ? 7 : 30;
  }

  function roundedAge(value) {
    return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : null;
  }

  function showSource(source) {
    var state = source ? sourceStatusRecord(source.id) : null;
    var freshness = engine.evaluateSourceFreshness(state, sourceCadenceDays());
    sourceLink.hidden = true;
    sourceLink.removeAttribute('href');
    sourceCard.dataset.sourceState = 'unavailable';
    if (!source) {
      sourceMeta.textContent = 'Aucune source officielle n’est disponible dans le registre local. Le résultat reste un brouillon manuel; identifiez l’autorité compétente indépendamment.';
      return {
        mode: 'unavailable',
        sourceId: null,
        checkedAt: null,
        label: 'Source officielle indisponible dans le registre local',
        cadenceDays: freshness.cadenceDays,
        ageDays: freshness.ageDays,
        reason: freshness.reason
      };
    }
    var statusValue = state && state.status || 'manual';
    sourceCard.dataset.sourceState = freshness.available ? 'available' : freshness.mode;
    sourceLink.hidden = false;
    sourceLink.href = source.url;
    sourceLink.textContent = 'Ouvrir ' + source.authority;
    var checked = state && state.checkedAt ? formatDate(state.checkedAt) : 'date de contrôle indisponible';
    var age = roundedAge(freshness.ageDays);
    var explanation;
    if (freshness.available) {
      explanation = 'Preuve technique complète contrôlée le ' + checked + ' (' + age + ' jour(s)), dans la cadence de ' + freshness.cadenceDays + ' jours. Cela ne valide toujours aucun frais, délai, critère, formulaire ni résultat.';
    } else if (freshness.mode === 'stale') {
      explanation = 'Révision manuelle obligatoire: le contrôle date de ' + (age === null ? 'trop longtemps' : age + ' jour(s)') + ' et dépasse la cadence de ' + freshness.cadenceDays + ' jours. Aucun frais, délai, critère, formulaire, service actif ou disponibilité ne peut être déduit.';
    } else {
      explanation = 'Révision manuelle obligatoire: les preuves conjointes sont insuffisantes (' + freshness.reason + ', statut « ' + statusValue + ' », contrôle ' + checked + '). Ni le statut ni la date seuls ne prouvent une disponibilité, un frais, un délai, un critère ou un service actif.';
    }
    sourceMeta.textContent = source.authority + ' — ' + source.title + '. ' + explanation;
    return {
      mode: freshness.mode,
      available: freshness.available,
      sourceId: source.id,
      checkedAt: state && state.checkedAt || null,
      cadenceDays: freshness.cadenceDays,
      ageDays: freshness.ageDays,
      reason: freshness.reason,
      label: source.authority,
      status: statusValue,
      url: source.url
    };
  }

  function appendSourceField() {
    var options = sourceRecords().map(function (source) {
      var suffix = source.country ? ' — ' + source.country : '';
      return [source.id, source.authority + suffix];
    });
    if (!options.length) options = [['', 'Source indisponible — vérification manuelle']];
    fields.appendChild(field('source', config.sourceLabel, 'select', options));
  }

  function renderPlanner() {
    appendSourceField();
    fields.appendChild(field('task', config.taskLabel, 'select', config.tasks || []));
    var set = element('fieldset', { className: 'fg-checks' });
    set.appendChild(element('legend', { className: 'fg-legend' }, 'Points déjà préparés pour vérification officielle'));
    (config.checks || []).forEach(function (check) {
      var label = element('label', { className: 'fg-check' });
      label.appendChild(element('input', { type: 'checkbox', name: 'check', value: check[0] }));
      label.appendChild(element('span', {}, check[1]));
      set.appendChild(label);
    });
    fields.appendChild(set);
  }

  function renderPension() {
    appendSourceField();
    fields.appendChild(field('currency', 'Devise de vos hypothèses', 'text', { value: 'XOF', maxlength: '3', inputmode: 'text' }));
    fields.appendChild(field('currentBalance', 'Solde actuel saisi', 'number', { value: '0', min: '0', step: '0.01', inputmode: 'decimal' }));
    fields.appendChild(field('monthlyContribution', 'Cotisation mensuelle saisie', 'number', { value: '50000', min: '0', step: '0.01', inputmode: 'decimal' }));
    fields.appendChild(field('years', 'Durée de projection (années)', 'number', { value: '20', min: '1', max: '70', step: '1', inputmode: 'numeric' }));
    fields.appendChild(field('annualRate', 'Hypothèse de rendement annuel (%)', 'number', { value: '5', min: '0', max: '100', step: '0.01', inputmode: 'decimal' }));
  }

  function renderLand() {
    appendSourceField();
    fields.appendChild(field('currency', 'Devise de vos hypothèses', 'text', { value: 'XOF', maxlength: '3' }));
    fields.appendChild(field('propertyValue', 'Valeur du bien saisie', 'number', { value: '25000000', min: '0', step: '0.01' }));
    fields.appendChild(field('stampRate', 'Taux de droit de timbre vérifié (%)', 'number', { value: '0', min: '0', max: '100', step: '0.01' }));
    fields.appendChild(field('registrationRate', 'Taux d’enregistrement vérifié (%)', 'number', { value: '0', min: '0', max: '100', step: '0.01' }));
    fields.appendChild(field('fixedCosts', 'Autres devis et frais fixes vérifiés', 'number', { value: '0', min: '0', step: '0.01' }));
    fields.appendChild(field('contingencyRate', 'Marge de prudence (%)', 'number', { value: '10', min: '0', max: '100', step: '0.01' }));
  }

  function renderBudget() {
    appendSourceField();
    fields.appendChild(field('currency', 'Devise des documents', 'text', { value: 'XOF', maxlength: '3' }));
    fields.appendChild(field('budgetLine', 'Nom de la ligne budgétaire', 'text', { placeholder: 'Ex. Santé primaire' }));
    fields.appendChild(field('previousAmount', 'Montant de la période précédente', 'number', { value: '1000000000', min: '0', step: '0.01' }));
    fields.appendChild(field('currentAmount', 'Montant de la période actuelle', 'number', { value: '1200000000', min: '0', step: '0.01' }));
    fields.appendChild(field('population', 'Population de référence', 'number', { value: '1000000', min: '1', step: '1' }));
  }

  function renderPermit() {
    var countries = countryRegistry.map(function (country) {
      var name = country.displayNames && country.displayNames.fr || country.title || country.id;
      return [country.id, name + ' — ' + country.currency];
    }).sort(function (left, right) {
      return left[1].localeCompare(right[1], 'fr');
    });
    fields.appendChild(field('country', 'Pays de destination du permis', 'select', countries));
    appendSourceField();
    fields.appendChild(field('currency', 'Devise utilisée par les devis', 'text', { value: 'XOF', maxlength: '3' }));
    fields.appendChild(field('mainApplicants', 'Demandeurs principaux', 'number', { value: '1', min: '1', max: '100', step: '1' }));
    fields.appendChild(field('dependants', 'Personnes à charge', 'number', { value: '0', min: '0', max: '100', step: '1' }));
    fields.appendChild(field('mainFee', 'Frais officiels vérifiés par demandeur principal', 'number', { value: '0', min: '0', step: '0.01' }));
    fields.appendChild(field('dependantFee', 'Frais officiels vérifiés par personne à charge', 'number', { value: '0', min: '0', step: '0.01' }));
    fields.appendChild(field('supportingCosts', 'Médical, police, traduction, légalisation et pièces', 'number', { value: '0', min: '0', step: '0.01' }));
    fields.appendChild(field('professionalCosts', 'Devis juridique ou professionnel', 'number', { value: '0', min: '0', step: '0.01' }));
    fields.appendChild(field('travelCosts', 'Déplacements, biométrie, rendez-vous et livraison', 'number', { value: '0', min: '0', step: '0.01' }));
    fields.appendChild(field('otherCosts', 'Autre devis ou provision', 'number', { value: '0', min: '0', step: '0.01' }));
    fields.appendChild(field('contingencyRate', 'Marge de prudence (%)', 'number', { value: '10', min: '0', max: '100', step: '0.01' }));
  }

  function hydratePermitCountry() {
    if (config.mode !== 'permit') return;
    var countrySelect = form.elements.country;
    var sourceSelect = form.elements.source;
    var currencyInput = form.elements.currency;
    if (!countrySelect || !sourceSelect) return;

    syncPermitCountry = function updatePermitCountry(countryCode, preferredSourceId) {
      if (countryCode && countryRegistry.some(function (record) { return record.id === countryCode; })) {
        countrySelect.value = countryCode;
      }
      var country = countryRegistry.find(function (record) { return record.id === countrySelect.value; });
      var matching = sourceRecords().filter(function (source) { return source.country === countrySelect.value; });
      sourceSelect.replaceChildren();
      if (!matching.length) {
        sourceSelect.appendChild(element('option', { value: '' }, 'Aucune source liée — vérification manuelle'));
      } else {
        matching.forEach(function (source) {
          sourceSelect.appendChild(element('option', { value: source.id }, source.authority));
        });
        if (preferredSourceId && matching.some(function (source) { return source.id === preferredSourceId; })) {
          sourceSelect.value = preferredSourceId;
        }
      }
      if (country && currencyInput) currencyInput.value = country.currency;
      showSource(selectedSource());
    };

    countrySelect.addEventListener('change', function () {
      syncPermitCountry(countrySelect.value, null);
    });
    syncPermitCountry(countrySelect.value, null);
  }

  function renderFoi() {
    appendSourceField();
    fields.appendChild(field('authority', 'Organisme destinataire', 'text', { placeholder: 'Nom officiel de l’organisme' }));
    fields.appendChild(field('subject', 'Objet précis de la demande', 'text', { placeholder: 'Ex. contrats de maintenance 2025' }));
    fields.appendChild(field('records', 'Documents publics demandés', 'textarea'));
    fields.appendChild(field('format', 'Format souhaité', 'text', { placeholder: 'Ex. copie électronique accessible' }));
  }

  function renderElection() {
    fields.appendChild(field('countryFilter', 'Pays ou territoire', 'select', [['ALL', 'Tous les pays']]));
    fields.appendChild(field('statusFilter', 'Niveau de preuve de la date', 'select', [
      ['ALL', 'Tous les statuts'],
      ['official', 'Date officielle'],
      ['official-revised', 'Date officielle révisée'],
      ['tentative', 'Date provisoire'],
      ['expected', 'Date attendue']
    ]));
  }

  function renderFields() {
    fields.replaceChildren();
    if (config.mode === 'planner') renderPlanner();
    else if (config.mode === 'pension') renderPension();
    else if (config.mode === 'land') renderLand();
    else if (config.mode === 'budget') renderBudget();
    else if (config.mode === 'permit') renderPermit();
    else if (config.mode === 'foi') renderFoi();
    else if (config.mode === 'election') renderElection();
  }

  function receipt(inputs, output, source) {
    return {
      schemaVersion: 1,
      locale: 'fr',
      toolId: config.id,
      route: config.route,
      createdAt: new Date().toISOString(),
      privacyMode: 'browser_local',
      source: source,
      inputs: inputs,
      output: output,
      boundary: 'Préparation locale uniquement. Vérifiez toute règle variable auprès de la source officielle avant décision, paiement ou dépôt.'
    };
  }

  function showPlanner() {
    var selected = Array.from(form.querySelectorAll('[name="check"]:checked')).map(function (node) { return node.value; });
    var gaps = engine.verificationGaps((config.checks || []).map(function (check) {
      return { id: check[0], label: check[1], prompt: check[2] };
    }), selected);
    var source = selectedSource();
    var sourceReceipt = showSource(source);
    var taskSelect = form.elements.task;
    var taskLabel = taskSelect && taskSelect.selectedOptions[0] ? taskSelect.selectedOptions[0].textContent : '';
    addMetric(String(gaps.length) + ' point' + (gaps.length === 1 ? '' : 's') + ' à vérifier');
    resultBody.appendChild(element('p', {}, 'Démarche : ' + taskLabel + '. Vous avez préparé ' + selected.length + ' point(s) sur ' + (config.checks || []).length + '.'));
    var list = element('ul');
    (gaps.length ? gaps : [{ prompt: 'Tous les points sont cochés. Reconfirmez-les sur la source officielle juste avant la démarche.' }]).forEach(function (gap) {
      list.appendChild(element('li', {}, gap.prompt));
    });
    resultBody.appendChild(list);
    currentReceipt = receipt({ task: read('task'), preparedChecks: selected }, {
      gapCount: gaps.length,
      prompts: gaps.map(function (gap) { return gap.prompt; })
    }, sourceReceipt);
  }

  function showPension() {
    var output = engine.calculatePension({
      monthlyContribution: read('monthlyContribution'),
      currentBalance: read('currentBalance'),
      years: read('years'),
      annualRate: read('annualRate')
    });
    if (!output.ok) throw new Error('Saisissez des montants positifs, une durée de 1 à 70 ans et un rendement de 0 à 100 %.');
    var sourceReceipt = showSource(selectedSource());
    addMetric(engine.money(output.total, currency()));
    resultBody.appendChild(lineList([
      ['Solde et cotisations versés', engine.money(output.contributed, currency())],
      ['Croissance du solde actuel', engine.money(output.currentGrowth, currency())],
      ['Croissance des cotisations', engine.money(output.contributionGrowth, currency())]
    ]));
    resultBody.appendChild(element('p', { className: 'fg-note' }, 'Projection mathématique à versements mensuels constants. Elle ne calcule ni prestation légale, ni fiscalité, ni inflation, ni frais, ni droit à pension.'));
    currentReceipt = receipt({
      country: read('country'),
      currency: currency(),
      currentBalance: read('currentBalance'),
      monthlyContribution: read('monthlyContribution'),
      years: read('years'),
      annualRate: read('annualRate')
    }, output, sourceReceipt);
  }

  function showLand() {
    var output = engine.calculateLand({
      propertyValue: read('propertyValue'),
      stampRate: read('stampRate'),
      registrationRate: read('registrationRate'),
      fixedCosts: read('fixedCosts'),
      contingencyRate: read('contingencyRate')
    });
    if (!output.ok) throw new Error('Saisissez des valeurs positives et des taux compris entre 0 et 100 %.');
    var sourceReceipt = showSource(selectedSource());
    addMetric(engine.money(output.total, currency()));
    resultBody.appendChild(lineList([
      ['Droit de timbre saisi', engine.money(output.stamp, currency())],
      ['Enregistrement saisi', engine.money(output.registration, currency())],
      ['Autres devis saisis', engine.money(output.fixedCosts, currency())],
      ['Marge de prudence', engine.money(output.contingency, currency())]
    ]));
    resultBody.appendChild(element('p', { className: 'fg-note' }, 'Scénario fondé uniquement sur vos taux et devis. Il ne vérifie ni titre, ni transfert, ni consentement, ni taxe, ni frais professionnel.'));
    currentReceipt = receipt({
      currency: currency(),
      propertyValue: read('propertyValue'),
      stampRate: read('stampRate'),
      registrationRate: read('registrationRate'),
      fixedCosts: read('fixedCosts'),
      contingencyRate: read('contingencyRate')
    }, output, sourceReceipt);
  }

  function showBudget() {
    var output = engine.calculateBudget({
      previousAmount: read('previousAmount'),
      currentAmount: read('currentAmount'),
      population: read('population')
    });
    if (!output.ok) throw new Error('Saisissez deux montants positifs et une population supérieure à zéro.');
    var sourceReceipt = showSource(selectedSource());
    addMetric((output.changePercent === null ? 'n/a' : output.changePercent.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' %'));
    resultBody.appendChild(lineList([
      ['Variation absolue', engine.money(output.change, currency())],
      ['Montant précédent par habitant', engine.money(output.previousPerPerson, currency())],
      ['Montant actuel par habitant', engine.money(output.currentPerPerson, currency())]
    ]));
    resultBody.appendChild(element('p', { className: 'fg-note' }, 'Comparaison arithmétique seulement. Vérifiez période, unité, classification, inflation, population, vote, exécution et décaissement dans les documents officiels.'));
    currentReceipt = receipt({
      currency: currency(),
      budgetLine: read('budgetLine'),
      previousAmount: read('previousAmount'),
      currentAmount: read('currentAmount'),
      population: read('population')
    }, output, sourceReceipt);
  }

  function showPermit() {
    var output = engine.calculatePermit({
      mainApplicants: read('mainApplicants'),
      dependants: read('dependants'),
      mainFee: read('mainFee'),
      dependantFee: read('dependantFee'),
      supportingCosts: read('supportingCosts'),
      professionalCosts: read('professionalCosts'),
      travelCosts: read('travelCosts'),
      otherCosts: read('otherCosts'),
      contingencyRate: read('contingencyRate')
    });
    if (!output.ok) throw new Error('Saisissez des effectifs entiers dans les limites, des coûts positifs et une marge de 0 à 100 %.');
    var sourceReceipt = showSource(selectedSource());
    addMetric(engine.money(output.total, currency()));
    resultBody.appendChild(lineList([
      ['Frais des demandeurs principaux', engine.money(output.mainTotal, currency())],
      ['Frais des personnes à charge', engine.money(output.dependantTotal, currency())],
      ['Autres coûts saisis', engine.money(output.otherTotal, currency())],
      ['Marge de prudence', engine.money(output.contingency, currency())]
    ]));
    resultBody.appendChild(element('p', { className: 'fg-note' }, 'Budget saisi par l’utilisateur uniquement. Aucun droit au travail, catégorie, parrainage, délai, dépôt ou résultat n’est déterminé.'));
    currentReceipt = receipt({
      country: read('country'),
      currency: currency(),
      mainApplicants: read('mainApplicants'),
      dependants: read('dependants'),
      mainFee: read('mainFee'),
      dependantFee: read('dependantFee'),
      supportingCosts: read('supportingCosts'),
      professionalCosts: read('professionalCosts'),
      travelCosts: read('travelCosts'),
      otherCosts: read('otherCosts'),
      contingencyRate: read('contingencyRate')
    }, output, sourceReceipt);
  }

  function showFoi() {
    var output = engine.createFoiDraft({
      authority: read('authority'),
      subject: read('subject'),
      records: read('records'),
      format: read('format')
    });
    if (!output.ok) throw new Error('Renseignez l’organisme, l’objet et les documents demandés.');
    var sourceReceipt = showSource(selectedSource());
    var preview = element('pre');
    preview.textContent = output.text;
    resultBody.appendChild(preview);
    currentReceipt = receipt({
      authority: read('authority'),
      subject: read('subject'),
      records: read('records'),
      format: read('format')
    }, output, sourceReceipt);
  }

  function electionStatusLabel(value) {
    return {
      official: 'date officielle',
      'official-revised': 'date officielle révisée',
      tentative: 'date provisoire',
      expected: 'date attendue'
    }[value] || 'statut à vérifier';
  }

  function showElection() {
    if (!electionData) throw new Error('Les données électorales locales sont indisponibles. Consultez directement la commission électorale.');
    var countryFilter = read('countryFilter');
    var statusFilter = read('statusFilter');
    var records = (electionData.elections || []).filter(function (record) {
      return (countryFilter === 'ALL' || record.countryCode === countryFilter) &&
        (statusFilter === 'ALL' || record.dateStatus === statusFilter);
    });
    var reviewedRecords = records.map(function (record) {
      return {
        record: record,
        freshness: engine.evaluateElectionFreshness(record, electionData.generatedAt, 7)
      };
    });
    var availableCount = reviewedRecords.filter(function (item) { return item.freshness.available; }).length;
    addMetric(
      availableCount === reviewedRecords.length
        ? String(records.length) + ' scrutin' + (records.length === 1 ? '' : 's') + ' vérifié' + (records.length === 1 ? '' : 's')
        : String(records.length - availableCount) + ' scrutin' + (records.length - availableCount === 1 ? '' : 's') + ' à revalider'
    );
    var list = element('div', { className: 'fg-lines' });
    reviewedRecords.forEach(function (item) {
      var record = item.record;
      var freshness = item.freshness;
      var row = element('div');
      var source = record.sources && record.sources.find(function (item) { return item.type === 'official'; });
      var dateText = freshness.available
        ? record.electionDate + ' — ' + electionStatusLabel(record.dateStatus)
        : 'date non affichée — révision manuelle';
      var text = record.country + ' — ' + record.office + ' — ' + dateText;
      row.appendChild(element('span', {}, text));
      if (source && source.url) {
        var sourceAge = roundedAge(freshness.sourceAgeDays);
        var evidenceLabel = freshness.available
          ? 'Source officielle contrôlée le ' + source.checkedAt
          : 'Preuve officielle hors cadence de 7 jours' + (sourceAge === null ? '' : ' (' + sourceAge + ' jours)');
        var link = element('a', { href: source.url, target: '_blank', rel: 'noopener' }, evidenceLabel);
        row.appendChild(link);
      } else {
        row.appendChild(element('strong', {}, 'Source officielle à rechercher manuellement'));
      }
      list.appendChild(row);
    });
    resultBody.appendChild(list);
    var allAvailable = reviewedRecords.length > 0 && reviewedRecords.every(function (item) {
      return item.freshness.available;
    });
    var hasStale = reviewedRecords.some(function (item) {
      return item.freshness.mode === 'stale';
    });
    sourceCard.dataset.sourceState = allAvailable ? 'available' : (hasStale ? 'stale' : 'manual');
    sourceLink.hidden = true;
    var datasetAge = engine.ageDays(electionData.generatedAt);
    sourceMeta.textContent = allAvailable
      ? 'Jeu local et preuves officielles dans la cadence à haut risque de 7 jours. Une annonce n’est pas une proclamation; ouvrez la source officielle avant de planifier.'
      : 'Révision manuelle obligatoire: le jeu local contrôlé le ' + (electionData.generatedAt || 'date indisponible') +
        (roundedAge(datasetAge) === null ? '' : ' a ' + roundedAge(datasetAge) + ' jour(s)') +
        ' et/ou ses preuves dépassent la cadence à haut risque de 7 jours. Les dates sont masquées; aucune date, échéance, éligibilité ou capacité de dépôt ne peut être déduite.';
    currentReceipt = receipt({ countryFilter: countryFilter, statusFilter: statusFilter }, {
      count: records.length,
      availableCount: availableCount,
      records: reviewedRecords.map(function (item) {
        var record = item.record;
        return {
          id: record.id,
          country: record.country,
          office: record.office,
          electionDate: item.freshness.available ? record.electionDate : null,
          dateStatus: item.freshness.available ? record.dateStatus : 'manual-review',
          checkedAt: record.sources && record.sources[0] && record.sources[0].checkedAt || null,
          freshness: item.freshness
        };
      })
    }, {
      mode: allAvailable ? 'fresh_verified' : (hasStale ? 'stale' : 'manual'),
      available: allAvailable,
      checkedAt: electionData.generatedAt || null,
      ageDays: datasetAge,
      cadenceDays: 7,
      label: 'Commissions électorales citées dans le jeu de données'
    });
  }

  function submit(event) {
    event.preventDefault();
    resultBody.replaceChildren();
    status.textContent = '';
    try {
      if (config.mode === 'planner') showPlanner();
      else if (config.mode === 'pension') showPension();
      else if (config.mode === 'land') showLand();
      else if (config.mode === 'budget') showBudget();
      else if (config.mode === 'permit') showPermit();
      else if (config.mode === 'foi') showFoi();
      else if (config.mode === 'election') showElection();
      result.hidden = false;
      status.textContent = 'Résultat local préparé. Vérifiez la source et les limites affichées.';
      result.focus();
    } catch (error) {
      clearResult();
      status.textContent = error.message || 'Vérifiez les champs.';
      var first = form.querySelector(':invalid, input, select, textarea');
      if (first) first.focus();
    }
  }

  function receiptText(data) {
    var lines = [
      config.title,
      'Créé: ' + data.createdAt,
      'Mode: local au navigateur',
      'Source: ' + (data.source && data.source.label || 'révision manuelle'),
      'État source: ' + (data.source && data.source.mode || 'indisponible'),
      '',
      JSON.stringify(data.output, null, 2),
      '',
      data.boundary
    ];
    return lines.join('\n');
  }

  function download(filename, contents, type) {
    var url = URL.createObjectURL(new Blob([contents], { type: type }));
    var link = element('a', { href: url, download: filename });
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  exportJson.addEventListener('click', function () {
    if (!currentReceipt) return;
    download(config.id + '-fr.json', JSON.stringify(currentReceipt, null, 2), 'application/json;charset=utf-8');
    status.textContent = 'Reçu JSON téléchargé localement.';
  });

  exportTxt.addEventListener('click', function () {
    if (!currentReceipt) return;
    download(config.id + '-fr.txt', receiptText(currentReceipt), 'text/plain;charset=utf-8');
    status.textContent = 'Résumé TXT téléchargé localement.';
  });

  importInput.addEventListener('change', function () {
    var file = importInput.files && importInput.files[0];
    if (!file) return;
    file.text().then(function (text) {
      var saved = JSON.parse(text);
      if (!saved || saved.schemaVersion !== 1 || saved.toolId !== config.id || saved.locale !== 'fr') {
        throw new Error('Ce reçu ne correspond pas à cet outil français.');
      }
      if (config.mode === 'permit' && syncPermitCountry && saved.inputs && saved.inputs.country) {
        syncPermitCountry(saved.inputs.country, saved.source && saved.source.sourceId);
      }
      Object.keys(saved.inputs || {}).forEach(function (name) {
        var input = form.elements[name];
        if (!input) return;
        if (name === 'preparedChecks' && Array.isArray(saved.inputs[name])) {
          Array.from(form.querySelectorAll('[name="check"]')).forEach(function (check) {
            check.checked = saved.inputs[name].indexOf(check.value) !== -1;
          });
        } else if (input.value !== undefined && typeof saved.inputs[name] !== 'object') {
          input.value = saved.inputs[name];
        }
      });
      form.requestSubmit();
      status.textContent = 'Reçu rouvert et recalculé localement.';
    }).catch(function (error) {
      status.textContent = error.message || 'Le reçu JSON ne peut pas être rouvert.';
    }).finally(function () {
      importInput.value = '';
    });
  });

  form.addEventListener('submit', submit);
  form.addEventListener('reset', function () {
    setTimeout(function () {
      clearResult();
      status.textContent = 'Outil réinitialisé.';
      var first = form.querySelector('select, input, textarea');
      if (first) first.focus();
    }, 0);
  });

  function hydrateElectionFilters() {
    if (config.mode !== 'election' || !electionData) return;
    var countries = new Map();
    (electionData.elections || []).forEach(function (record) {
      countries.set(record.countryCode, record.country);
    });
    var select = form.elements.countryFilter;
    Array.from(countries.entries()).sort(function (left, right) {
      return left[1].localeCompare(right[1], 'fr');
    }).forEach(function (item) {
      select.appendChild(element('option', { value: item[0] }, item[1]));
    });
  }

  submitButton.disabled = true;
  Promise.all([
    fetch('/data/government/official-sources.json', { credentials: 'same-origin' }).then(function (response) {
      if (!response.ok) throw new Error('manifest');
      return response.json();
    }),
    fetch('/data/government/source-status.json', { credentials: 'same-origin' }).then(function (response) {
      if (!response.ok) throw new Error('status');
      return response.json();
    }),
    config.mode === 'election'
      ? fetch('/data/government/africa-election-tracker.json', { credentials: 'same-origin' }).then(function (response) {
        if (!response.ok) throw new Error('elections');
        return response.json();
      })
      : Promise.resolve(null),
    config.mode === 'permit'
      ? fetch('/data/registry/countries.json', { credentials: 'same-origin' }).then(function (response) {
        if (!response.ok) throw new Error('countries');
        return response.json();
      })
      : Promise.resolve([])
  ]).then(function (values) {
    sourceManifest = values[0];
    sourceStatus = values[1];
    electionData = values[2];
    countryRegistry = values[3];
    renderFields();
    hydrateElectionFilters();
    hydratePermitCountry();
    submitButton.disabled = false;
    status.textContent = 'Registre officiel local chargé. Disponibilité seulement avec preuve complète dans la cadence de ' +
      (config.mode === 'election' ? 7 : sourceCadenceDays()) +
      ' jours; tout signal incomplet, bloqué ou périmé reste en révision manuelle.';
  }).catch(function () {
    sourceManifest = { tools: [], sources: [] };
    sourceStatus = { sources: [] };
    renderFields();
    submitButton.disabled = false;
    sourceCard.dataset.sourceState = 'unavailable';
    sourceLink.hidden = true;
    sourceMeta.textContent = 'Le registre officiel local est indisponible. L’outil reste en mode manuel et ne fournit aucun lien, règle, frais, délai ou verdict.';
    status.textContent = 'Mode manuel: registre officiel indisponible. Utilisez seulement le brouillon local et identifiez l’autorité compétente.';
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);

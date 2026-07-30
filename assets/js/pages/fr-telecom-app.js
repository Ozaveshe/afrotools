(function initFrenchTelecomApp(root) {
  'use strict';

  var data = typeof TELECOM_DATA !== 'undefined' ? TELECOM_DATA : root.TELECOM_DATA;
  var engine = root.AfroTools && root.AfroTools.engines && root.AfroTools.engines.telecomPlanning;
  var locale = root.AfroTools && root.AfroTools.frTelecomLocalization;
  var configNode = document.getElementById('fr-telecom-config');
  var form = document.getElementById('telecom-form');
  var resultNode = document.getElementById('telecom-results');
  var errorNode = document.getElementById('telecom-errors');
  var exportStatus = document.getElementById('telecom-export-status');
  var copyButton = document.getElementById('telecom-copy');
  var txtButton = document.getElementById('telecom-download-txt');
  var jsonButton = document.getElementById('telecom-download-json');
  var importInput = document.getElementById('telecom-import');
  if (!data || !engine || !locale || !configNode || !form || !resultNode || !errorNode) return;

  var config;
  try {
    config = JSON.parse(configNode.textContent);
  } catch (error) {
    errorNode.textContent = 'La configuration de cet outil est indisponible.';
    return;
  }

  var latest = null;
  var errorMessages = {
    country_unavailable: 'Choisissez un pays pris en charge.',
    invalid_usage: 'Saisissez une durée et des usages valides, sans valeur négative.',
    invalid_assumption: 'Saisissez un montant positif et une fourchette comprise entre 0 % et 100 %.',
    operator_unavailable: 'Choisissez un opérateur proposé pour ce pays.',
    roaming_data_unavailable: 'Le snapshot ne contient pas de tarifs d’itinérance pour ce pays de départ.',
    portability_data_unavailable: 'Le snapshot ne contient pas de fiche de portabilité pour ce pays.',
    sim_data_unavailable: 'Le snapshot ne contient pas de fiche d’enregistrement SIM pour ce pays.',
    invalid_business_usage: 'Saisissez un effectif et un débit minimum supérieurs à zéro.',
    invalid_volume: 'Saisissez un volume de messages supérieur à zéro.',
    sms_pricing_unavailable: 'Aucune hypothèse de prix SMS n’est disponible dans le snapshot pour ce pays.',
    invalid_message_mix: 'Saisissez un volume positif et des pourcentages valides.',
    message_mix_not_100: 'La répartition marketing, utilitaire et service doit totaliser exactement 100 %.',
    comparison_data_unavailable: 'Le snapshot ne contient pas les deux tarifs nécessaires à cette comparaison.'
  };
  var labels = {
    browsing: 'Navigation web',
    social: 'Réseaux sociaux',
    youtube: 'Vidéo / YouTube',
    music: 'Musique en streaming',
    videocall: 'Appels vidéo',
    email: 'E-mails',
    downloads: 'Téléchargements et mises à jour',
    airtime: 'Crédit téléphonique',
    balance: 'Solde',
    transfer: 'Transfert',
    borrow: 'Avance de crédit',
    data: 'Données mobiles',
    customerCare: 'Service client',
    mobileMoney: 'Mobile money',
    mpesa: 'M-Pesa'
  };

  function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function number(value, digits) {
    var parsed = Number(value);
    if (!Number.isFinite(parsed)) return '—';
    return parsed.toLocaleString('fr-FR', {
      maximumFractionDigits: digits === undefined ? 2 : digits,
      minimumFractionDigits: 0
    });
  }

  function money(value, result) {
    var prefix = result.symbol || result.currency || '';
    return (prefix ? escapeHtml(prefix) + ' ' : '') + number(value, 2);
  }

  function destinationMoney(value, result) {
    var prefix = result.destinationSymbol || result.destinationCurrency || '';
    return (prefix ? escapeHtml(prefix) + ' ' : '') + number(value, 2);
  }

  function metric(label, value, note) {
    return '<div class="fr-telecom-metric"><span>' + escapeHtml(label) + '</span><strong>'
      + value + '</strong>' + (note ? '<small>' + escapeHtml(note) + '</small>' : '') + '</div>';
  }

  function table(headers, rows) {
    return '<div class="fr-telecom-table-wrap"><table><thead><tr>'
      + headers.map(function (header) { return '<th scope="col">' + escapeHtml(header) + '</th>'; }).join('')
      + '</tr></thead><tbody>'
      + rows.map(function (row) {
        return '<tr>' + row.map(function (cell, index) {
          return '<td data-label="' + escapeHtml(headers[index]) + '">' + cell + '</td>';
        }).join('') + '</tr>';
      }).join('')
      + '</tbody></table></div>';
  }

  function sourceNotice(result) {
    var source = result.source || engine.snapshotState(data);
    var date = source.reviewedAt || 'date inconnue';
    var age = source.ageDays === null ? '' : ' · ' + source.ageDays + ' jours';
    return '<aside class="fr-telecom-source" data-source-state="' + escapeHtml(source.freshness) + '" role="status">'
      + '<strong>Snapshot de planification archivé</strong>'
      + '<p>Données regroupées le ' + escapeHtml(date) + age
      + '. Confiance : faible. Aucun tarif, code, débit, forfait, couverture, disponibilité ou statut réglementaire n’est présenté comme actuel.</p>'
      + '<a href="/data/telecom/official-sources.json">Voir les sources et les lacunes connues</a></aside>';
  }

  function renderDataPlans(result) {
    if (!result.plans.length) return '<p>Aucun forfait du snapshot ne correspond à ces filtres.</p>';
    return (result.best ? metric('Plus faible prix par Go du snapshot', money(result.best.pricePerGB, result)) : '')
      + table(
        ['Opérateur', 'Forfait archivé', 'Volume', 'Validité', 'Prix archivé', 'Prix / Go'],
        result.plans.map(function (row) {
          return [
            escapeHtml(row.operator),
            escapeHtml(locale.planName(row.name)),
            escapeHtml(locale.dataVolume(row.volume)),
            escapeHtml(locale.validity(row.validity)),
            money(row.price, result),
            money(row.pricePerGB, result)
          ];
        })
      );
  }

  function renderUssd(result) {
    if (!result.codes.length) return '<p>Aucun code archivé ne correspond à cette recherche.</p>';
    return '<p class="fr-telecom-callout">Composez seulement après vérification dans l’application ou le site de l’opérateur. Un code obsolète peut déclencher une action différente.</p>'
      + table(['Usage', 'Opérateur', 'Code archivé'], result.codes.map(function (row) {
        return [escapeHtml(labels[row.category] || row.category), escapeHtml(row.operator), '<code>' + escapeHtml(row.code) + '</code>'];
      }));
  }

  function renderRoaming(result) {
    if (result.sameCountry) return metric('Coût d’itinérance', money(0, result), 'Pays de départ et destination identiques');
    var local = result.localTotalHome === null
      ? destinationMoney(result.localTotalDestination, result)
      : money(result.localTotalHome, result);
    var note = result.localTotalHome === null
      ? 'Pas de conversion : indiquez un taux de change utilisateur si vous souhaitez comparer les deux devises.'
      : 'Conversion effectuée avec votre taux de change, non vérifié par AfroTools.';
    return '<div class="fr-telecom-metrics">'
      + metric('Itinérance estimée', money(result.roamingTotal, result))
      + metric('SIM locale estimée', local, note)
      + metric('Voix', money(result.voiceCost, result), result.totalMinutes + ' minutes')
      + metric('SMS', money(result.smsCost, result), result.totalSms + ' messages')
      + metric('Données', money(result.dataCost, result), number(result.totalDataMB / 1024, 2) + ' Go')
      + '</div>';
  }

  function renderAirtime(result) {
    return '<div class="fr-telecom-metrics">'
      + metric('Montant de crédit', money(result.amount, result), result.operator)
      + metric('Fourchette basse', money(result.lowValue, result), number(result.lowRate * 100, 1) + ' % · hypothèse fixe')
      + metric('Point médian', money(result.midValue, result), 'Hypothèse calculée')
      + metric('Fourchette haute', money(result.highValue, result), number(result.highRate * 100, 1) + ' % · hypothèse fixe')
      + '</div><p class="fr-telecom-callout">Ces pourcentages reproduisent les hypothèses de planification du calculateur anglais. Ils ne décrivent ni une offre observée ni une activité autorisée.</p>';
  }

  function renderPortability(result) {
    var record = result.record;
    return '<p class="fr-telecom-callout">Le champ de disponibilité ci-dessous appartient au snapshot archivé. Il ne prouve pas le statut actuel. Confirmez auprès du régulateur et du nouvel opérateur.</p>'
      + table(['Champ archivé', 'Valeur à vérifier'], [
        ['Disponibilité enregistrée', record.snapshotAvailability ? 'Oui dans le snapshot' : 'Non enregistrée dans le snapshot'],
        ['Régulateur indiqué', escapeHtml(locale.regulator(record.regulatorLabel) || 'Non renseigné')],
        ['Frais enregistrés', record.fee === null ? 'Non renseignés' : money(record.fee, result)],
        ['Processus archivé', escapeHtml(locale.portability(record.processSnapshot || record.notesSnapshot) || 'Non renseigné')]
      ]);
  }

  function renderSim(result) {
    var record = result.record;
    return '<p class="fr-telecom-callout">Ces champs juridiques sont archivés et non vérifiés pour une décision actuelle. N’envoyez ici aucun numéro, document d’identité, NIN, passeport ou donnée biométrique.</p>'
      + table(['Champ archivé', 'Valeur à vérifier auprès du régulateur/opérateur'], [
        ['Obligation enregistrée', record.snapshotMandatory ? 'Oui dans le snapshot' : 'Non dans le snapshot'],
        ['Méthode enregistrée', escapeHtml(locale.sim(record.methodSnapshot) || 'Non renseignée')],
        ['Échéance enregistrée', escapeHtml(locale.sim(record.deadlineSnapshot) || 'Non renseignée')],
        ['Code de contrôle enregistré', escapeHtml(locale.sim(record.checkCodeSnapshot) || 'Non renseigné')],
        ['Conséquence enregistrée', escapeHtml(locale.sim(record.penaltySnapshot) || 'Non renseignée')],
        ['Régulateur indiqué', escapeHtml(locale.regulator(record.regulatorLabel) || 'Non renseigné')]
      ]);
  }

  function renderInternet(result) {
    if (!result.tiers.length) return '<p>Aucune offre ISP archivée n’est disponible pour ce pays.</p>';
    return table(['Fournisseur', 'Technologie', 'Débit annoncé archivé', 'Prix mensuel archivé', 'Coût / Mbit/s'], result.tiers.map(function (row) {
      return [
        escapeHtml(row.provider),
        escapeHtml(locale.networkType(row.type)),
        escapeHtml(locale.speed(row.speed)),
        money(row.price, result),
        money(row.costPerMbps, result)
      ];
    }));
  }

  function renderTechnology(result) {
    var rows = ['Fiber', 'LTE', '5G'].map(function (key) {
      var spec = result.specs[key];
      return [
        key === 'Fiber' ? 'Fibre' : key,
        number(spec.avgSpeed, 0) + ' Mbit/s',
        escapeHtml(spec.latency),
        number(spec.reliability, 0) + ' % (modèle)',
        number(result.providers[key].length, 0) + ' fournisseur(s) dans le snapshot'
      ];
    });
    return metric('Recommandation du modèle', result.recommendation === 'Fiber' ? 'Fibre' : result.recommendation,
      'À confirmer selon la couverture exacte à votre adresse')
      + table(['Technologie', 'Débit moyen du modèle', 'Latence du modèle', 'Fiabilité du modèle', 'Données locales archivées'], rows);
  }

  function renderBusiness(result) {
    var intro = '<div class="fr-telecom-metrics">'
      + metric('Bande passante recommandée', number(result.recommendedBandwidth, 0) + ' Mbit/s')
      + metric('Données mensuelles estimées', number(result.monthlyDataGB, 0) + ' Go')
      + '</div>';
    if (!result.options.length) return intro + '<p>Aucune option archivée n’est disponible pour ce pays.</p>';
    return intro + table(['Option archivée', 'Type', 'Débit', 'Mensuel', 'Coût première année'], result.options.map(function (row) {
      return [
        escapeHtml(locale.businessName(row.name)),
        escapeHtml(locale.networkType(row.type)),
        number(row.speed, 0) + ' Mbit/s',
        money(row.monthly, result),
        money(row.setup + row.monthly * 12, result)
      ];
    }));
  }

  function renderBulkSms(result) {
    return '<div class="fr-telecom-metrics">'
      + metric('Coût mensuel estimé', money(result.totalCost, result), number(result.volume, 0) + ' messages')
      + metric('Coût par SMS', money(result.effectiveRate, result), number(result.discount * 100, 0) + ' % de remise modélisée')
      + metric('Écart face au taux de base', money(result.savings, result), 'Hypothèse, pas remise fournisseur')
      + '</div>';
  }

  function renderWhatsapp(result) {
    return '<div class="fr-telecom-metrics">'
      + metric('WhatsApp Business', money(result.whatsappTotal, result), money(result.whatsappAverage, result) + ' / message')
      + metric('SMS en masse', money(result.smsTotal, result), money(result.smsEffectiveRate, result) + ' / message')
      + metric('Option la moins coûteuse dans le snapshot', result.cheaper === 'whatsapp' ? 'WhatsApp Business' : 'SMS')
      + '</div>'
      + table(['Type', 'Nombre', 'Coût WhatsApp archivé', 'Coût SMS archivé'], ['marketing', 'utility', 'service'].map(function (key) {
        return [
          key === 'marketing' ? 'Marketing' : (key === 'utility' ? 'Utilitaire' : 'Service'),
          number(result.counts[key], 0),
          money(result.whatsappCosts[key], result),
          money(result.counts[key] * result.smsEffectiveRate, result)
        ];
      }));
  }

  function renderTv(result) {
    if (!result.packages.length) return '<p>Aucun bouquet TV archivé n’est disponible pour ce pays.</p>';
    var best = result.bestValue
      ? metric('Plus faible coût par chaîne du snapshot', escapeHtml(result.bestValue.provider + ' · ' + locale.tvName(result.bestValue.name)),
        money(result.bestValue.pricePerChannel, result) + ' / chaîne')
      : '';
    return best + table(['Fournisseur', 'Bouquet archivé', 'Prix mensuel archivé', 'Chaînes', 'Coût / chaîne'], result.packages.map(function (row) {
      return [
        escapeHtml(row.provider),
        escapeHtml(locale.tvName(row.name)),
        money(row.price, result),
        row.streaming ? 'Streaming' : number(row.channels, 0),
        row.streaming ? escapeHtml(locale.tvNote(row.notes) || 'Non comparable') : money(row.pricePerChannel, result)
      ];
    }));
  }

  function renderStarlink(result) {
    var headline = result.starlink
      ? '<div class="fr-telecom-metrics">'
        + metric('Mensuel Starlink archivé', money(result.starlink.monthly, result))
        + metric('Matériel Starlink archivé', money(result.starlink.hardware, result))
        + metric('Coût sur 3 ans', money(result.starlink.yearThree, result))
        + '</div>'
      : '<p>Aucun prix Starlink n’est enregistré dans le snapshot pour ce pays.</p>';
    var availability = '<p class="fr-telecom-callout">Le drapeau de disponibilité du snapshot est '
      + (result.snapshotAvailabilityFlag ? 'positif' : 'négatif')
      + ', mais il est périmé et ne prouve pas la disponibilité actuelle. Vérifiez la carte officielle Starlink et votre adresse.</p>';
    if (!result.local.length) return availability + headline + '<p>Aucune offre ISP locale archivée n’est disponible.</p>';
    return availability + headline + table(['ISP local archivé', 'Type', 'Débit annoncé', 'Mensuel', 'Coût sur 3 ans'], result.local.map(function (row) {
      return [
        escapeHtml(row.name),
        escapeHtml(locale.networkType(row.type)),
        escapeHtml(locale.speed(row.speed)),
        money(row.monthly, result),
        money(row.yearThree, result)
      ];
    }));
  }

  function renderDataUsage(result) {
    var breakdown = result.breakdown.filter(function (row) { return row.mb > 0; });
    var html = '<div class="fr-telecom-metrics">'
      + metric('Consommation mensuelle', number(result.totalGB, 2) + ' Go')
      + metric('Besoin avec marge de 10 %', number(result.bufferedNeedMB / 1024, 2) + ' Go')
      + '</div>'
      + table(['Usage', 'Consommation estimée'], breakdown.map(function (row) {
        return [escapeHtml(labels[row.id] || row.id), number(row.mb / 1024, 2) + ' Go'];
      }));
    if (result.recommendedPlans.length) {
      html += '<h3>Forfaits mensuels archivés proches du besoin</h3>'
        + table(['Opérateur', 'Forfait', 'Volume', 'Prix archivé'], result.recommendedPlans.map(function (row) {
          return [
            escapeHtml(row.operator),
            escapeHtml(locale.planName(row.name)),
            escapeHtml(locale.dataVolume(row.volume)),
            money(row.price, result)
          ];
        }));
    } else {
      html += '<p>Aucun forfait mensuel archivé ne correspond au besoin estimé.</p>';
    }
    return html;
  }

  var renderers = {
    dataPlans: renderDataPlans,
    ussdDirectory: renderUssd,
    roaming: renderRoaming,
    airtime: renderAirtime,
    portability: renderPortability,
    simRegistration: renderSim,
    internet: renderInternet,
    technology: renderTechnology,
    businessInternet: renderBusiness,
    bulkSms: renderBulkSms,
    whatsappVsSms: renderWhatsapp,
    tv: renderTv,
    starlink: renderStarlink,
    dataUsage: renderDataUsage
  };

  function populateCountries() {
    Array.prototype.forEach.call(form.querySelectorAll('[data-country-select]'), function (select) {
      var requireKind = select.getAttribute('data-country-requires');
      var current = select.value;
      select.innerHTML = '<option value="">Choisir un pays…</option>';
      Object.keys(data.countries).sort(function (a, b) {
        return locale.countryName(a, data.countries[a].name)
          .localeCompare(locale.countryName(b, data.countries[b].name), 'fr');
      }).forEach(function (code) {
        var country = data.countries[code];
        if (requireKind && !country[requireKind]) return;
        var option = document.createElement('option');
        option.value = code;
        option.textContent = locale.countryName(code, country.name) + (country.currency ? ' · ' + country.currency : '');
        select.appendChild(option);
      });
      if (current) select.value = current;
    });
  }

  function updateDependentFields() {
    var countryInput = form.querySelector('[name="country"]');
    var country = countryInput && data.countries[countryInput.value];
    var operator = form.querySelector('[name="operator"]');
    if (operator) {
      var current = operator.value;
      operator.innerHTML = config.kind === 'dataPlans'
        ? '<option value="all">Tous les opérateurs</option>'
        : '<option value="">Choisir un opérateur…</option>';
      (country && country.operators || []).forEach(function (item) {
        var option = document.createElement('option');
        option.value = item.name;
        option.textContent = item.name;
        operator.appendChild(option);
      });
      if (current) operator.value = current;
    }
    var category = form.querySelector('[name="category"]');
    if (category) {
      var previous = category.value;
      category.innerHTML = '<option value="all">Tous les usages</option>';
      Object.keys(country && country.ussdCodes || {}).forEach(function (key) {
        var option = document.createElement('option');
        option.value = key;
        option.textContent = labels[key] || key;
        category.appendChild(option);
      });
      if (previous) category.value = previous;
    }
    var maximumPrice = form.querySelector('[name="maxPrice"]');
    if (maximumPrice && config.kind === 'tv') {
      var maximum = 100000;
      if (country) {
        var prices = [];
        (country.tvProviders || []).forEach(function (provider) {
          (provider.packages || []).forEach(function (item) {
            if (Number.isFinite(Number(item.price))) prices.push(Number(item.price));
          });
        });
        if (prices.length) maximum = Math.ceil(Math.max.apply(Math, prices) * 1.1);
      }
      maximumPrice.max = String(maximum);
      maximumPrice.value = String(maximum);
      syncRangeOutput(maximumPrice);
    }
  }

  function collect() {
    var values = {};
    Array.prototype.forEach.call(form.elements, function (field) {
      if (!field.name || field.type === 'submit' || field.type === 'file') return;
      if (field.type === 'number' || field.type === 'range') {
        values[field.name] = field.value === '' ? null : Number(field.value);
      } else {
        values[field.name] = field.value;
      }
    });
    if (config.kind === 'airtime') {
      values.lowRate = 0.7;
      values.highRate = 0.85;
    }
    return values;
  }

  function snapshotInputs() {
    var values = {};
    Array.prototype.forEach.call(form.elements, function (field) {
      if (!field.name || field.type === 'submit' || field.type === 'file') return;
      values[field.name] = field.value;
    });
    return values;
  }

  function setResultActionsAvailable(available) {
    [copyButton, txtButton, jsonButton].forEach(function (button) {
      if (!button) return;
      button.disabled = !available;
      button.hidden = !available;
    });
  }

  function clearLatestResult() {
    latest = null;
    resultNode.innerHTML = '<p class="tel-empty">Renseignez le formulaire pour obtenir un résultat local.</p>';
    exportStatus.textContent = '';
    setResultActionsAvailable(false);
  }

  function syncRangeOutput(field) {
    if (!field || field.type !== 'range') return;
    var output = form.querySelector('[data-range-output="' + field.name + '"]');
    if (output) output.value = field.value;
  }

  function syncWhatsappMix(changed) {
    if (config.kind !== 'whatsappVsSms' || !changed) return;
    var marketing = form.elements.namedItem('marketing');
    var utility = form.elements.namedItem('utility');
    var service = form.elements.namedItem('service');
    if (!marketing || !utility || !service) return;
    var marketingValue = parseInt(marketing.value, 10);
    var utilityValue = parseInt(utility.value, 10);
    var serviceValue = parseInt(service.value, 10);
    var total = marketingValue + utilityValue + serviceValue;
    if (total > 100) {
      var excess = total - 100;
      if (changed.name === 'marketing') {
        utilityValue = Math.max(0, utilityValue - Math.ceil(excess / 2));
        serviceValue = Math.max(0, 100 - marketingValue - utilityValue);
        utility.value = utilityValue;
        service.value = serviceValue;
      } else if (changed.name === 'utility') {
        marketingValue = Math.max(0, marketingValue - Math.ceil(excess / 2));
        serviceValue = Math.max(0, 100 - marketingValue - utilityValue);
        marketing.value = marketingValue;
        service.value = serviceValue;
      } else {
        marketingValue = Math.max(0, marketingValue - Math.ceil(excess / 2));
        utilityValue = Math.max(0, 100 - marketingValue - serviceValue);
        marketing.value = marketingValue;
        utility.value = utilityValue;
      }
    }
    [marketing, utility, service].forEach(syncRangeOutput);
  }

  function run() {
    errorNode.textContent = '';
    clearLatestResult();
    if (!form.reportValidity()) {
      errorNode.textContent = 'Corrigez les champs obligatoires avant de recalculer.';
      return null;
    }
    var calculate = engine[config.kind];
    if (typeof calculate !== 'function') {
      errorNode.textContent = 'Le moteur de cet outil est indisponible.';
      return null;
    }
    var result = calculate(data, collect());
    if (!result || !result.ok) {
      errorNode.textContent = errorMessages[result && result.error] || 'Impossible de produire un résultat avec ces données.';
      return null;
    }
    var renderer = renderers[config.kind];
    resultNode.innerHTML = sourceNotice(result) + '<div class="fr-telecom-result-body">'
      + (renderer ? renderer(result) : '<pre>' + escapeHtml(JSON.stringify(result, null, 2)) + '</pre>')
      + '</div>';
    latest = {
      schemaVersion: 1,
      locale: 'fr',
      toolId: config.toolId,
      kind: config.kind,
      route: config.route,
      engineVersion: engine.version,
      datasetReviewedAt: data.lastUpdated || null,
      inputs: snapshotInputs(),
      result: result
    };
    setResultActionsAvailable(true);
    resultNode.focus();
    return result;
  }

  function exportPayload() {
    if (!latest) {
      errorNode.textContent = 'Calculez ou affichez d’abord un résultat.';
      return null;
    }
    return JSON.stringify(latest, null, 2);
  }

  function download(name, content, type) {
    var url = URL.createObjectURL(new Blob([content], { type: type }));
    var link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
    return Promise.resolve();
  }

  function txtSummary() {
    if (!latest) return '';
    return [
      config.title,
      'Route : ' + config.route,
      'Snapshot : ' + (data.lastUpdated || 'inconnu'),
      'Confiance : faible · données de planification archivées',
      '',
      resultNode.innerText.trim(),
      '',
      'Vérifiez prix, couverture, disponibilité, codes et statut réglementaire auprès de la source officielle avant décision.'
    ].join('\n');
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    run();
  });
  form.addEventListener('reset', function () {
    latest = null;
    window.setTimeout(function () {
      clearLatestResult();
      errorNode.textContent = '';
      if (importInput) importInput.value = '';
      updateDependentFields();
      Array.prototype.forEach.call(form.querySelectorAll('input[type="range"]'), syncRangeOutput);
      exportStatus.textContent = 'Scénario réinitialisé.';
    }, 0);
  });
  form.addEventListener('change', function (event) {
    if (event.target && event.target.hasAttribute('data-country-select')) updateDependentFields();
  });
  form.addEventListener('input', function (event) {
    var field = event.target;
    syncRangeOutput(field);
    if (field && ['marketing', 'utility', 'service'].includes(field.name)) syncWhatsappMix(field);
  });

  copyButton.addEventListener('click', function () {
    var text = txtSummary();
    if (!text) { errorNode.textContent = 'Produisez d’abord un résultat.'; return; }
    copyText(text).then(function () { exportStatus.textContent = 'Résumé copié.'; })
      .catch(function () { exportStatus.textContent = 'Copie impossible. Utilisez le téléchargement TXT.'; });
  });
  txtButton.addEventListener('click', function () {
    var text = txtSummary();
    if (!text) { errorNode.textContent = 'Produisez d’abord un résultat.'; return; }
    download(config.slug + '-afrotools.txt', text, 'text/plain;charset=utf-8');
    exportStatus.textContent = 'TXT téléchargé.';
  });
  jsonButton.addEventListener('click', function () {
    var payload = exportPayload();
    if (!payload) return;
    download(config.slug + '-afrotools.json', payload, 'application/json;charset=utf-8');
    exportStatus.textContent = 'JSON téléchargé.';
  });
  importInput.addEventListener('change', function () {
    var file = this.files && this.files[0];
    if (!file) return;
    file.text().then(function (text) {
      var payload = JSON.parse(text);
      if (!payload || payload.schemaVersion !== 1 || payload.toolId !== config.toolId || !payload.inputs) {
        throw new Error('wrong_tool');
      }
      Object.keys(payload.inputs).forEach(function (name) {
        var field = form.elements.namedItem(name);
        if (field) field.value = payload.inputs[name];
      });
      updateDependentFields();
      Object.keys(payload.inputs).forEach(function (name) {
        var field = form.elements.namedItem(name);
        if (field) {
          field.value = payload.inputs[name];
          syncRangeOutput(field);
        }
      });
      if (run()) exportStatus.textContent = 'Scénario rouvert et recalculé localement.';
    }).catch(function () {
      exportStatus.textContent = 'Fichier refusé : utilisez un export JSON de ce même outil.';
    });
    this.value = '';
  });

  populateCountries();
  updateDependentFields();
  Array.prototype.forEach.call(form.querySelectorAll('input[type="range"]'), syncRangeOutput);
  setResultActionsAvailable(false);
  var state = engine.snapshotState(data);
  var pageSource = document.getElementById('telecom-page-source');
  if (pageSource) {
    pageSource.innerHTML = sourceNotice({ source: state });
  }
})(typeof window !== 'undefined' ? window : globalThis);

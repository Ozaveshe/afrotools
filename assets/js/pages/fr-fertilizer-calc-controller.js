(function frenchFertilizerCalcController(root) {
  'use strict';
  var engine = root.AfroTools && root.AfroTools.FertilizerCalcEngine;
  var data = root.AfroTools && root.AfroTools.FertilizerCalcData;
  var latest = null;
  var inputSnapshot = null;
  function currentInputs() {
    return ['crop', 'area', 'soil', 'yieldTarget', 'currency'].map(function(key) { return id(key).value; }).concat(quoteEnabled ? [quoteEnabled.checked, JSON.stringify(enteredQuote())] : []).join('\u0000');
  }
  function invalidate() {
    latest = null;
    inputSnapshot = null;
    if (root.__FR_AGRI_TEST__) root.__FR_AGRI_TEST__.latest = null;
    id('fertActionsPanel').hidden = true;
    ['fertTitle', 'fertSummary', 'productKg', 'bagCount', 'totalCost', 'nowKg'].forEach(function(key) { id(key).textContent = ''; });
    id('fertBreakdown').replaceChildren();
    id('fertActions').replaceChildren();
    id('fertStatus').textContent = 'À recalculer';
    id('fertStatus').className = 'fert-status';
  }
  function freshResult() {
    if (latest && inputSnapshot !== currentInputs()) invalidate();
    return !!latest;
  }
  function totalYieldUnit(result) { return result.crop.unit.replace('/ha', ''); }
  var CROPS = {
    maize: 'Maïs', rice: 'Riz', cassava: 'Manioc', yam: 'Igname', sorghum: 'Sorgho',
    millet: 'Mil', cowpea: 'Niébé', groundnut: 'Arachide', soybean: 'Soja', cocoa: 'Cacao',
    coffee: 'Café', cotton: 'Coton', wheat: 'Blé', potato: 'Pomme de terre',
    tomato: 'Tomate', plantain: 'Plantain', sweetpotato: 'Patate douce', onion: 'Oignon',
    capsicum: 'Piment / poivron', sugarcane: 'Canne à sucre', banana: 'Banane',
    sunflower: 'Tournesol'
  };
  var TARGETS = { low: 'Faible (subsistance)', medium: 'Moyen (commercial)', high: 'Élevé (intensif)' };
  function id(value) { return document.getElementById(value); }
  function number(value, digits) {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: digits == null ? 1 : digits }).format(Number(value) || 0);
  }
  function money(value, result) { return value == null || !Number.isFinite(Number(value)) ? 'Indisponible' : result.cost.symbol + number(value, 0); }
  function list(node, items) {
    node.replaceChildren();
    items.reduce(function(lines, item) { return lines.concat(String(item).split('\n')); }, []).forEach(function item(text) {
      var li = document.createElement('li');
      li.textContent = text;
      node.appendChild(li);
    });
  }
  function status(message, error) {
    id('fertLine').textContent = message;
    id('fertLine').style.color = error ? '#b91c1c' : '';
  }
  function download(content, type, filename) {
    var url = URL.createObjectURL(new Blob([content], { type: type }));
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function revoke() { URL.revokeObjectURL(url); }, 0);
  }
  function csvCell(value) {
    var text = String(value == null ? '' : value);
    if (typeof value === 'string' && /^[\s]*[=+@-]/.test(text)) text = "'" + text;
    return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }
  var PRODUCTS = { npk15: 'NPK 15-15-15', urea: 'Urée 46-0-0', dap: 'DAP 18-46-0', mop: 'MOP 0-0-60' };
  function planLines(result) {
    var lines = ['Deux scénarios distincts : ne pas additionner les options A et B.', 'Les quantités calculées doivent être confirmées par une analyse de sol et un conseil agronomique local.'];
    ['compound', 'separate'].forEach(function(key, index) {
      var plan = result.productPlans[key];
      lines.push(index === 0 ? 'Option A : NPK 15-15-15 et urée' : 'Option B : DAP, MOP et urée');
      plan.products.forEach(function(product) {
        lines.push(PRODUCTS[product.id] + ' : application calculée ' + number(product.applicationKg, 2) + ' kg; achat ' + product.purchaseBags + ' sacs de 50 kg (' + number(product.purchaseKg, 2) + ' kg); reste non appliqué ' + number(product.remainingKg, 2) + ' kg; coût ' + money(product.purchaseCost, result) + '.');
      });
      lines.push('Total des achats : ' + money(plan.purchaseCost, result) + '.');
      lines.push('Excédent calculé N / P2O5 / K2O : ' + [plan.excess.n, plan.excess.p, plan.excess.k].map(function(value) { return number(value, 2); }).join(' / ') + ' kg.');
      var source = plan.priceProvenance;
      lines.push(plan.priceStatus === 'user-provided-unverified' && source ? 'Prix saisis non vérifiés : ' + source.source + '; date déclarée ' + source.observedOn + '; devise ' + source.currency + '.' : 'Prix illustratifs non datés; ce ne sont pas des prix actuels vérifiés.');
      if (!plan.priceComplete) lines.push('Prix manquants : total indisponible; aucune valeur de remplacement.');
    });
    return lines;
  }
  function scheduleLines(result) {
    if (result.scheduleReview) return ['Calendrier du bananier en cours de révision. Ne suivez pas le calendrier précédent; faites confirmer les dates et la répartition des nutriments par un agronome local.'];
    return result.schedule.slice();
  }
  function reportObject() {
    if (!freshResult()) return null;
    return {
      schemaVersion: 2,
      outil: 'calculateur-engrais',
      langue: 'fr',
      entrees: latest.input,
      culture: { id: latest.crop.id, nom: CROPS[latest.crop.id] || latest.crop.name },
      resultat: {
        parHectare: latest.perHectare,
        besoinsTotaux: latest.totals,
        plansProduits: latest.productPlans,
        sacsOptionA: { uree: latest.bags.urea, npk15: latest.bags.npk15 },
        coutOptionA: latest.cost,
        rendementEstime: latest.yieldEstimate,
        uniteRendement: totalYieldUnit(latest),
        equivalentOrganique: latest.organicEquivalent,
        calendrier: scheduleLines(latest),
        revueCalendrier: latest.scheduleReview || null
      },
      sources: {
        donnees: 'data/agriculture/fertilizer-calc-data.json',
        moteur: 'engines/src/fertilizer-calc-engine.js',
        donneesEnDirect: false
      },
      limites: 'Repère de planification; confirmer par analyse de sol, étiquette produit et conseil agronomique local.',
      confidentialite: 'Calcul local; aucune saisie envoyée à un serveur.'
    };
  }
  function textReport() {
    var report = reportObject();
    if (!report) return '';
    return [
      'AfroTools — calculateur d’engrais',
      'Culture : ' + report.culture.nom,
      'Surface : ' + number(latest.input.area, 2) + ' ha',
      'Objectif : ' + TARGETS[latest.input.target],
      'N-P2O5-K2O par ha : ' + latest.perHectare.n + '-' + latest.perHectare.p + '-' + latest.perHectare.k,
      'Besoins totaux : N ' + latest.totals.n + ' kg; P2O5 ' + latest.totals.p + ' kg; K2O ' + latest.totals.k + ' kg',
      planLines(latest).join('\n'),
      latest.scheduleReview ? scheduleLines(latest).join('\n') : '',
      'Production totale de référence : ' + number(latest.yieldEstimate, 1) + ' ' + totalYieldUnit(latest),
      '',
      'Référentiel statique; aucune donnée en direct.',
      report.limites,
      'Confidentialité : calcul local.'
    ].join('\n');
  }
  var quoteFields = {}, quoteEnabled, quoteCurrency, quoteDescribe;
  function installQuoteFields() {
    var fieldset = document.createElement('fieldset'), legend = document.createElement('legend');
    fieldset.style.minWidth = '0'; legend.textContent = 'Prix fournisseur facultatifs'; fieldset.appendChild(legend);
    var label = document.createElement('label'); quoteEnabled = document.createElement('input');
    quoteEnabled.type = 'checkbox'; quoteEnabled.id = 'useSupplierQuote'; label.htmlFor = quoteEnabled.id;
    label.append(quoteEnabled, document.createTextNode(' Utiliser mes prix au lieu des exemples non datés')); fieldset.appendChild(label);
    var hint = document.createElement('p'); hint.id = 'quoteCurrencyNote'; fieldset.appendChild(hint);
    [['urea', 'Urée : prix par sac de 50 kg', 'number'], ['npk15', 'NPK 15-15-15 : prix par sac de 50 kg', 'number'], ['dap', 'DAP : prix par sac de 50 kg', 'number'], ['mop', 'MOP : prix par sac de 50 kg', 'number'], ['source', 'Fournisseur ou source des prix', 'text'], ['observedOn', 'Date déclarée des prix', 'date']].forEach(function(spec) {
      var group = document.createElement('div'), input = document.createElement('input'), fieldLabel = document.createElement('label');
      group.className = 'fert-field'; input.id = 'quote-' + spec[0]; input.type = spec[2]; input.disabled = true; input.style.maxWidth = '100%'; input.style.minWidth = '0';
      fieldLabel.htmlFor = input.id; fieldLabel.textContent = spec[1]; input.setAttribute('aria-describedby', hint.id);
      if (spec[2] === 'number') { input.min = '0'; input.step = 'any'; input.inputMode = 'decimal'; }
      if (spec[0] === 'source') input.maxLength = 300;
      quoteFields[spec[0]] = input; group.append(fieldLabel, input); fieldset.appendChild(group);
    });
    function describe() { hint.textContent = 'Prix en ' + id('currency').value + '. Laissez un prix inconnu vide; un total nécessitant ce prix restera indisponible. Indiquez au moins un prix, sa source et sa date. Ces prix ne sont pas vérifiés. Les données restent dans ce navigateur et figurent dans vos exports.'; }
    quoteDescribe = describe;
    quoteCurrency = id('currency').value;
    quoteEnabled.addEventListener('change', function() { Object.keys(quoteFields).forEach(function(key) { quoteFields[key].disabled = !quoteEnabled.checked; }); invalidate(); });
    id('currency').addEventListener('change', function() { Object.keys(quoteFields).forEach(function(key) { quoteFields[key].value = ''; }); quoteCurrency = id('currency').value; describe(); invalidate(); });
    var button = id('fertForm').querySelector('[type="submit"]'); if (button) button.parentElement.before(fieldset); else id('fertForm').appendChild(fieldset); describe();
  }
  function enteredQuote() {
    var prices = {}; ['urea', 'npk15', 'dap', 'mop'].forEach(function(key) { if (quoteFields[key].value.trim()) prices[key] = Number(quoteFields[key].value); });
    return { currency: quoteCurrency, prices: prices, source: quoteFields.source.value, observedOn: quoteFields.observedOn.value };
  }
  function calculate() {
    invalidate();
    var area = Number(id('area').value);
    id('fertError').textContent = '';
    if (!Number.isFinite(area) || area <= 0) {
      id('fertError').textContent = 'Saisissez une surface supérieure à zéro.';
      id('area').focus();
      return null;
    }
    var input = {
      cropId: id('crop').value,
      area: area,
      soil: id('soil').value,
      target: id('yieldTarget').value,
      currency: id('currency').value
    };
    if (quoteEnabled.checked) input.priceQuote = enteredQuote();
    var result = engine.calculate(input, data);
    if (!result.ok || !result.productPlans) {
      id('fertError').textContent = result.status === 'invalid-price-quote' ? 'Indiquez au moins un prix positif ou nul, une source et une date valide dans la devise sélectionnée.' : 'La combinaison sélectionnée n’est pas prise en charge.';
      return null;
    }
    latest = result;
    inputSnapshot = currentInputs();
    id('fertStatus').textContent = 'Calcul local';
    id('fertStatus').className = 'fert-status ok';
    id('fertTitle').textContent = (CROPS[result.crop.id] || result.crop.name) + ' — besoins et budget indicatifs';
    id('fertSummary').textContent = 'Surface ' + number(result.input.area, 2) + ' ha; sol ' + id('soil').selectedOptions[0].textContent + '; objectif ' + TARGETS[result.input.target] + '.';
    id('productKg').textContent = result.totals.n + ' / ' + result.totals.p + ' / ' + result.totals.k + ' kg';
    id('bagCount').textContent = 'Option A : ' + result.bags.urea + ' urée; ' + result.bags.npk15 + ' NPK';
    id('totalCost').textContent = money(result.cost.total, result);
    id('nowKg').textContent = number(result.yieldEstimate, 1) + ' ' + totalYieldUnit(result);
    list(id('fertBreakdown'), [
      'Par hectare : N ' + result.perHectare.n + ' kg; P2O5 ' + result.perHectare.p + ' kg; K2O ' + result.perHectare.k + ' kg.',
      'Total : N ' + result.totals.n + ' kg; P2O5 ' + result.totals.p + ' kg; K2O ' + result.totals.k + ' kg.',
      planLines(result).join('\n'),
      'Équivalent fumier bovin : environ ' + result.organicEquivalent.cattleTonnes + '–' + (result.organicEquivalent.cattleTonnes + 2) + ' tonnes.',
      'Équivalent fumier de volaille : environ ' + result.organicEquivalent.poultryTonnes + '–' + (result.organicEquivalent.poultryTonnes + 1) + ' tonnes.'
    ]);
    list(id('fertActions'), scheduleLines(result).map(function schedule(value, index) {
      return 'Étape ' + (index + 1) + ' : ' + value;
    }).concat(result.microTip ? ['Note micronutriments du référentiel : ' + result.microTip] : []));
    id('fertActionsPanel').hidden = false;
    root.__FR_AGRI_TEST__.latest = { result: result };
    status('Calcul d’engrais mis à jour localement.');
    return result;
  }
  async function action(value) {
    if (!freshResult()) return status('Lancez d’abord le calcul.', true);
    var report = reportObject();
    var text = textReport();
    var slug = 'afrotools-calculateur-engrais-' + latest.crop.id;
    if (value === 'copy') await navigator.clipboard.writeText(text);
    else if (value === 'share') await navigator.clipboard.writeText(location.href + '\n\n' + text);
    else if (value === 'save') localStorage.setItem('afrotools:fr-agriculture:fertilizer-calc', JSON.stringify(report));
    else if (value === 'txt') download('\ufeff' + text, 'text/plain;charset=utf-8', slug + '.txt');
    else if (value === 'json') download(JSON.stringify(report, null, 2), 'application/json;charset=utf-8', slug + '.json');
    else if (value === 'csv') {
      var rows = [['option', 'produit', 'surface_ha', 'devise', 'application_kg', 'sacs_50kg', 'achat_kg', 'reste_kg', 'prix_sac', 'cout_produit', 'total_option', 'statut_prix', 'source_prix', 'date_declaree']];
      ['compound', 'separate'].forEach(function(key, index) {
        var plan = latest.productPlans[key], provenance = plan.priceProvenance || {};
        plan.products.forEach(function(product) {
          rows.push([index === 0 ? 'A' : 'B', PRODUCTS[product.id], latest.input.area, latest.input.currency, product.applicationKg, product.purchaseBags, product.purchaseKg, product.remainingKg, product.bagPrice, product.purchaseCost, plan.purchaseCost, plan.priceStatus, provenance.source || '', provenance.observedOn || '']);
        });
      });
      download('\ufeff' + rows.map(function row(valueRow) { return valueRow.map(csvCell).join(','); }).join('\r\n'), 'text/csv;charset=utf-8', slug + '.csv');
    } else if (value === 'pdf') {
      var captured = latest;
      if (!root.AgroReportPdf) return status('Export PDF indisponible. Utilisez le TXT.', true);
      try {
        var documentPdf = await root.AgroReportPdf.buildPdf(text);
        if (!freshResult() || latest !== captured) return status('Les données ont changé. Recalculez avant l’export.', true);
        documentPdf.setProperties({ title: 'AfroTools — rapport engrais', creator: 'AfroTools' });
        documentPdf.save(slug + '.pdf');
      } catch (error) {
        return status('Export PDF indisponible pour ce texte. Utilisez le TXT ou réessayez.', true);
      }
    }
    status(value === 'save' ? 'Scénario enregistré dans ce navigateur.' : 'Action terminée.');
  }
  if (!engine || !data) {
    id('fertError').textContent = 'Le moteur ou le référentiel d’engrais est indisponible.';
    return;
  }
  installQuoteFields();
  ['input', 'change'].forEach(function(type) { id('fertForm').addEventListener(type, invalidate); });
  id('fertForm').addEventListener('submit', function submit(event) { event.preventDefault(); calculate(); });
  id('fertForm').addEventListener('reset', function reset() {
    setTimeout(function clear() {
      invalidate();
      id('fertActionsPanel').hidden = true;
      id('fertError').textContent = '';
      quoteEnabled.checked = false;
      Object.keys(quoteFields).forEach(function(key) { quoteFields[key].value = ''; quoteFields[key].disabled = true; });
      quoteCurrency = id('currency').value;
      quoteDescribe();
      status('');
    }, 0);
  });
  document.addEventListener('click', function click(event) {
    var button = event.target.closest('[data-fert-action]');
    if (button) action(button.dataset.fertAction).catch(function() { status('Action impossible. Essayez un export TXT.', true); });
  });
  root.__FR_AGRI_TEST__ = { latest: null, engine: engine, data: data, calculate: calculate, reportObject: reportObject };
})(typeof window !== 'undefined' ? window : globalThis);

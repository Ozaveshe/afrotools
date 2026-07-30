(function frenchFertilizerCalcController(root) {
  'use strict';
  var engine = root.AfroTools && root.AfroTools.FertilizerCalcEngine;
  var data = root.AfroTools && root.AfroTools.FertilizerCalcData;
  var latest = null;
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
  function money(value, result) { return result.cost.symbol + number(value, 0); }
  function list(node, items) {
    node.replaceChildren();
    items.forEach(function item(text) {
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
    return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }
  function reportObject() {
    if (!latest) return null;
    return {
      schemaVersion: 1,
      outil: 'calculateur-engrais',
      langue: 'fr',
      entrees: latest.input,
      culture: { id: latest.crop.id, nom: CROPS[latest.crop.id] || latest.crop.name },
      resultat: {
        parHectare: latest.perHectare,
        besoinsTotaux: latest.totals,
        sacs: latest.bags,
        cout: latest.cost,
        rendementEstime: latest.yieldEstimate,
        uniteRendement: latest.crop.unit,
        equivalentOrganique: latest.organicEquivalent,
        calendrier: latest.schedule
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
      'Sacs urée : ' + latest.bags.urea + '; sacs NPK 15-15-15 : ' + latest.bags.npk15,
      'Coût estimé : ' + money(latest.cost.total, latest),
      'Rendement de référence : ' + number(latest.yieldEstimate, 1) + ' ' + latest.crop.unit,
      '',
      'Référentiel statique; aucune donnée en direct.',
      report.limites,
      'Confidentialité : calcul local.'
    ].join('\n');
  }
  function calculate() {
    var area = Number(id('area').value);
    id('fertError').textContent = '';
    if (!Number.isFinite(area) || area <= 0) {
      id('fertError').textContent = 'Saisissez une surface supérieure à zéro.';
      id('area').focus();
      return null;
    }
    var result = engine.calculate({
      cropId: id('crop').value,
      area: area,
      soil: id('soil').value,
      target: id('yieldTarget').value,
      currency: id('currency').value
    }, data);
    if (!result.ok) {
      id('fertError').textContent = 'La combinaison sélectionnée n’est pas prise en charge.';
      return null;
    }
    latest = result;
    id('fertStatus').textContent = 'Calcul local';
    id('fertStatus').className = 'fert-status ok';
    id('fertTitle').textContent = (CROPS[result.crop.id] || result.crop.name) + ' — besoins et budget indicatifs';
    id('fertSummary').textContent = 'Surface ' + number(result.input.area, 2) + ' ha; sol ' + id('soil').selectedOptions[0].textContent + '; objectif ' + TARGETS[result.input.target] + '.';
    id('productKg').textContent = result.totals.n + ' / ' + result.totals.p + ' / ' + result.totals.k + ' kg';
    id('bagCount').textContent = result.bags.urea + ' urée; ' + result.bags.npk15 + ' NPK';
    id('totalCost').textContent = money(result.cost.total, result);
    id('nowKg').textContent = number(result.yieldEstimate, 1) + ' ' + result.crop.unit;
    list(id('fertBreakdown'), [
      'Par hectare : N ' + result.perHectare.n + ' kg; P2O5 ' + result.perHectare.p + ' kg; K2O ' + result.perHectare.k + ' kg.',
      'Total : N ' + result.totals.n + ' kg; P2O5 ' + result.totals.p + ' kg; K2O ' + result.totals.k + ' kg.',
      'Urée 46-0-0 : ' + result.bags.urea + ' sacs de 50 kg (' + money(result.cost.urea, result) + ').',
      'DAP théorique : ' + result.bags.dap + ' sacs; MOP théorique : ' + result.bags.mop + ' sacs.',
      'NPK 15-15-15 : ' + result.bags.npk15 + ' sacs de 50 kg (' + money(result.cost.npk15, result) + ').',
      'Équivalent fumier bovin : environ ' + result.organicEquivalent.cattleTonnes + '–' + (result.organicEquivalent.cattleTonnes + 2) + ' tonnes.',
      'Équivalent fumier de volaille : environ ' + result.organicEquivalent.poultryTonnes + '–' + (result.organicEquivalent.poultryTonnes + 1) + ' tonnes.'
    ]);
    list(id('fertActions'), result.schedule.map(function schedule(value, index) {
      return 'Étape ' + (index + 1) + ' : ' + value;
    }).concat(result.microTip ? ['Note micronutriments du référentiel : ' + result.microTip] : []));
    id('fertActionsPanel').hidden = false;
    root.__FR_AGRI_TEST__.latest = { result: result };
    status('Calcul d’engrais mis à jour localement.');
    return result;
  }
  function action(value) {
    if (!latest) return status('Lancez d’abord le calcul.', true);
    var report = reportObject();
    var text = textReport();
    var slug = 'afrotools-calculateur-engrais-' + latest.crop.id;
    if (value === 'copy') navigator.clipboard.writeText(text);
    else if (value === 'share') navigator.clipboard.writeText(location.href + '\n\n' + text);
    else if (value === 'save') localStorage.setItem('afrotools:fr-agriculture:fertilizer-calc', JSON.stringify(report));
    else if (value === 'txt') download('\ufeff' + text, 'text/plain;charset=utf-8', slug + '.txt');
    else if (value === 'json') download(JSON.stringify(report, null, 2), 'application/json;charset=utf-8', slug + '.json');
    else if (value === 'csv') {
      var rows = [
        ['culture_id', 'surface_ha', 'sol', 'objectif', 'devise', 'n_kg_ha', 'p2o5_kg_ha', 'k2o_kg_ha', 'n_total_kg', 'p2o5_total_kg', 'k2o_total_kg', 'sacs_uree', 'sacs_npk15', 'cout_total'],
        [latest.crop.id, latest.input.area, latest.input.soil, latest.input.target, latest.input.currency, latest.perHectare.n, latest.perHectare.p, latest.perHectare.k, latest.totals.n, latest.totals.p, latest.totals.k, latest.bags.urea, latest.bags.npk15, latest.cost.total]
      ];
      download('\ufeff' + rows.map(function row(valueRow) { return valueRow.map(csvCell).join(','); }).join('\r\n'), 'text/csv;charset=utf-8', slug + '.csv');
    } else if (value === 'pdf') {
      var PDF = root.jspdf && root.jspdf.jsPDF;
      if (!PDF) return status('Export PDF indisponible.', true);
      var documentPdf = new PDF({ unit: 'pt', format: 'a4' });
      documentPdf.text(documentPdf.splitTextToSize(text.normalize('NFD').replace(/[\u0300-\u036f]/g, ''), 500), 48, 58);
      documentPdf.save(slug + '.pdf');
    }
    status(value === 'save' ? 'Scénario enregistré dans ce navigateur.' : 'Action terminée.');
  }
  if (!engine || !data) {
    id('fertError').textContent = 'Le moteur ou le référentiel d’engrais est indisponible.';
    return;
  }
  id('fertForm').addEventListener('submit', function submit(event) { event.preventDefault(); calculate(); });
  id('fertForm').addEventListener('reset', function reset() {
    setTimeout(function clear() {
      latest = null;
      root.__FR_AGRI_TEST__.latest = null;
      id('fertActionsPanel').hidden = true;
      id('fertError').textContent = '';
      status('');
    }, 0);
  });
  document.addEventListener('click', function click(event) {
    var button = event.target.closest('[data-fert-action]');
    if (button) action(button.dataset.fertAction);
  });
  root.__FR_AGRI_TEST__ = { latest: null, engine: engine, data: data, calculate: calculate, reportObject: reportObject };
})(typeof window !== 'undefined' ? window : globalThis);

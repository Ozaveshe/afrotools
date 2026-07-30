(function frenchPlantingCalendarController(root) {
  'use strict';
  var engine = root.AfroTools && root.AfroTools.PlantingCalendarEngine;
  var data = root.AfroTools && root.AfroTools.PlantingCalendarData;
  var latest = null;
  var MONTHS = ['Jan', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
  var STATUS = { none: 'Hors saison', plant: 'Semer', grow: 'Croissance', harvest: 'Récolter' };
  var CROPS = {
    'Maize': 'Maïs', 'Maize (Early)': 'Maïs (précoce)', 'Maize (Late)': 'Maïs (tardif)',
    'Maize (Long Rain)': 'Maïs (grande saison des pluies)', 'Maize (Short Rain)': 'Maïs (petite saison des pluies)',
    'Maize (Masika)': 'Maïs (Masika)', 'Maize (Vuli)': 'Maïs (Vuli)', 'Cassava': 'Manioc',
    'Yam': 'Igname', 'Rice': 'Riz', 'Rice (Lowland)': 'Riz de bas-fond',
    'Rice (Rainfed)': 'Riz pluvial', 'Rice (Irrigated)': 'Riz irrigué', 'Plantain': 'Plantain',
    'Cocoa': 'Cacao', 'Oil Palm': 'Palmier à huile', 'Groundnut': 'Arachide',
    'Vegetables': 'Légumes', 'Pepper/Tomato': 'Piment / tomate', 'Cowpea': 'Niébé',
    'Sorghum': 'Sorgho', 'Millet': 'Mil', 'Millet (Pearl)': 'Mil perlé', 'Soybean': 'Soja',
    'Cotton': 'Coton', 'Shea Nut': 'Karité', 'Onion (Dry Season)': 'Oignon (saison sèche)',
    'Tomato (Dry Season)': 'Tomate (saison sèche)', 'Wheat (Irrigated)': 'Blé irrigué',
    'Sesame': 'Sésame', 'Wheat': 'Blé', 'Barley': 'Orge', 'Potato': 'Pomme de terre',
    'Beans': 'Haricot', 'Beans (Long Rain)': 'Haricot (grande saison des pluies)',
    'Beans (Short Rain)': 'Haricot (petite saison des pluies)', 'Coffee': 'Café', 'Tea': 'Thé',
    'Cabbage/Kale': 'Chou / chou kale', 'Teff (Ethiopia)': 'Teff (Éthiopie)',
    'Coconut': 'Noix de coco', 'Cashew Nut': 'Noix de cajou', 'Sisal': 'Sisal',
    'Banana': 'Banane', 'Tobacco': 'Tabac', 'Wheat (Winter)': 'Blé d’hiver',
    'Sunflower': 'Tournesol', 'Sugarcane': 'Canne à sucre', 'Grapes': 'Raisin',
    'Citrus': 'Agrumes', 'Date Palm': 'Palmier dattier', 'Olive': 'Olivier',
    'Faba Bean': 'Fève', 'Lentil': 'Lentille', 'Chickpea': 'Pois chiche'
  };
  function id(value) { return document.getElementById(value); }
  function cropLabel(value) { return CROPS[value] || value; }
  function status(message, error) {
    id('plantingActionStatus').textContent = message;
    id('plantingActionStatus').classList.toggle('is-error', !!error);
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
      outil: 'calendrier-semis',
      langue: 'fr',
      entrees: { zone: latest.zone, regimePluie: latest.rainfall },
      resultat: latest.crops.map(function mapCrop(crop) {
        return {
          cultureId: crop.id,
          culture: cropLabel(crop.id),
          mois: crop.months.map(function mapMonth(month) {
            return { mois: MONTHS[month.monthIndex], code: month.value, statut: STATUS[month.status] };
          })
        };
      }),
      sources: {
        donnees: 'data/agriculture/planting-calendar-data.json',
        moteur: 'engines/src/planting-calendar-engine.js',
        donneesEnDirect: false
      },
      limites: 'Repère saisonnier statique à confirmer avec la météo et le conseil agricole local.',
      confidentialite: 'Calcul local; aucune saisie envoyée à un serveur.'
    };
  }
  function textReport() {
    var report = reportObject();
    if (!report) return '';
    var lines = [
      'AfroTools — calendrier de semis',
      'Zone : ' + id('plantingZone').selectedOptions[0].textContent,
      'Régime des pluies : ' + id('plantingRainfall').selectedOptions[0].textContent,
      ''
    ];
    report.resultat.forEach(function addCrop(crop) {
      var active = crop.mois.filter(function activeMonth(month) { return month.code > 0; })
        .map(function monthText(month) { return month.mois + ' : ' + month.statut; });
      lines.push(crop.culture + ' — ' + active.join(', '));
    });
    lines.push('', 'Source statique; aucune donnée en direct.', report.limites, 'Confidentialité : calcul local.');
    return lines.join('\n');
  }
  function render() {
    var result = engine.calculate({
      zone: id('plantingZone').value,
      rainfall: id('plantingRainfall').value
    }, data);
    if (!result.ok) {
      id('plantingError').textContent = 'Sélectionnez une zone climatique prise en charge.';
      id('plantingZone').focus();
      return null;
    }
    latest = result;
    id('plantingError').textContent = '';
    id('plantingEmpty').hidden = true;
    id('plantingResults').hidden = false;
    id('plantingNote').textContent = result.note === 'bimodal-two-seasons'
      ? 'Régime bimodal : le tableau montre deux saisons de semis lorsque le calendrier canonique les prévoit.'
      : result.note === 'forest-unimodal-warning'
        ? 'Attention : les zones forestières ont souvent deux saisons. Vérifiez le régime pluviométrique de votre localité.'
        : '';
    var body = id('plantingCalendarBody');
    var mobileResults = id('plantingMobileResults');
    body.replaceChildren();
    mobileResults.replaceChildren();
    result.crops.forEach(function addRow(crop) {
      var row = document.createElement('tr');
      var heading = document.createElement('th');
      heading.scope = 'row';
      heading.textContent = cropLabel(crop.id);
      row.appendChild(heading);
      crop.months.forEach(function addMonth(month) {
        var cell = document.createElement('td');
        cell.className = 'calendar-cell ' + month.status;
        cell.textContent = month.status === 'plant' ? 'Semer' : month.status === 'harvest' ? 'Récolter' : '';
        cell.title = STATUS[month.status];
        cell.setAttribute('aria-label', MONTHS[month.monthIndex] + ' : ' + STATUS[month.status]);
        row.appendChild(cell);
      });
      body.appendChild(row);

      var mobileCrop = document.createElement('article');
      mobileCrop.className = 'planting-mobile-crop';
      var mobileHeading = document.createElement('h3');
      mobileHeading.textContent = cropLabel(crop.id);
      var mobileMonths = document.createElement('ul');
      var activeMonths = crop.months.filter(function activeMonth(month) { return month.value > 0; });
      activeMonths.forEach(function addMobileMonth(month) {
        var item = document.createElement('li');
        item.textContent = MONTHS[month.monthIndex] + ' : ' + STATUS[month.status];
        mobileMonths.appendChild(item);
      });
      if (!activeMonths.length) {
        var emptyItem = document.createElement('li');
        emptyItem.textContent = 'Aucune période active dans ce calendrier.';
        mobileMonths.appendChild(emptyItem);
      }
      mobileCrop.append(mobileHeading, mobileMonths);
      mobileResults.appendChild(mobileCrop);
    });
    root.__FR_AGRI_TEST__.latest = { result: result };
    status('Calendrier calculé localement.');
    return result;
  }
  function selectCountry() {
    var selected = engine.selectCountryZone(id('plantingCountry').value, data);
    if (!selected.zone) return;
    id('plantingZone').value = selected.zone;
    id('plantingRainfall').value = selected.rainfall;
  }
  function runAction(action) {
    if (!latest) return status('Générez d’abord le calendrier.', true);
    var report = reportObject();
    var text = textReport();
    var slug = 'afrotools-calendrier-semis-' + latest.zone;
    if (action === 'copy') navigator.clipboard.writeText(text);
    else if (action === 'share') navigator.clipboard.writeText(location.href + '\n\n' + text);
    else if (action === 'save') localStorage.setItem('afrotools:fr-agriculture:planting-calendar', JSON.stringify(report));
    else if (action === 'txt') download('\ufeff' + text, 'text/plain;charset=utf-8', slug + '.txt');
    else if (action === 'json') download(JSON.stringify(report, null, 2), 'application/json;charset=utf-8', slug + '.json');
    else if (action === 'csv') {
      var rows = [['zone', 'regime_pluie', 'culture_id', 'culture', 'mois', 'code', 'statut']];
      report.resultat.forEach(function addCrop(crop) {
        crop.mois.forEach(function addMonth(month) {
          rows.push([latest.zone, latest.rainfall, crop.cultureId, crop.culture, month.mois, month.code, month.statut]);
        });
      });
      download('\ufeff' + rows.map(function line(row) { return row.map(csvCell).join(','); }).join('\r\n'), 'text/csv;charset=utf-8', slug + '.csv');
    } else if (action === 'pdf') {
      var PDF = root.jspdf && root.jspdf.jsPDF;
      if (!PDF) return status('Export PDF indisponible.', true);
      var documentPdf = new PDF({ unit: 'pt', format: 'a4' });
      documentPdf.text(documentPdf.splitTextToSize(text.normalize('NFD').replace(/[\u0300-\u036f]/g, ''), 500), 48, 58);
      documentPdf.save(slug + '.pdf');
    }
    status(action === 'save' ? 'Résultat enregistré dans ce navigateur.' : 'Action terminée.');
  }
  if (!engine || !data) {
    id('plantingError').textContent = 'Le moteur ou le calendrier canonique est indisponible.';
    return;
  }
  id('plantingCountry').addEventListener('change', selectCountry);
  id('plantingForm').addEventListener('submit', function submit(event) { event.preventDefault(); render(); });
  id('plantingForm').addEventListener('reset', function reset() {
    setTimeout(function clear() {
      latest = null;
      root.__FR_AGRI_TEST__.latest = null;
      id('plantingEmpty').hidden = false;
      id('plantingResults').hidden = true;
      id('plantingError').textContent = '';
      status('');
    }, 0);
  });
  document.addEventListener('click', function action(event) {
    var button = event.target.closest('[data-planting-action]');
    if (button) runAction(button.dataset.plantingAction);
  });
  root.__FR_AGRI_TEST__ = {
    latest: null,
    engine: engine,
    data: data,
    calculate: render,
    reportObject: reportObject
  };
})(typeof window !== 'undefined' ? window : globalThis);

(function () {
  'use strict';
  const root = document.getElementById('wage-reference');
  const engine = window.AfroTools && window.AfroTools.MinWageEngine;
  if (!root || !engine) return;
  const $ = id => document.getElementById(id);
  const names = new Intl.DisplayNames(['fr'], { type: 'region' });
  const countryName = c => names.of(c.code) || c.name;
  const number = value => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value);
  const periods = { monthly: 'par mois', daily: 'par jour', hourly: 'par heure' };
  const sourceURL = 'https://www.gov.za/sites/default/files/gcis_document/202602/54075rg11941gon7083.pdf';
  const dateMonths = { January: 'janvier', February: 'février', March: 'mars', April: 'avril', May: 'mai', June: 'juin', July: 'juillet', August: 'août', September: 'septembre', October: 'octobre', November: 'novembre', December: 'décembre' };
  const date = value => String(value).replace(/January|February|March|April|May|June|July|August|September|October|November|December/g, word => dateMonths[word]);
  const rate = c => c.basis === 'hourly' ? c.hourly : c.basis === 'daily' ? c.daily : c.monthly;
  const countries = engine.getAllCountries('name').sort((a, b) => countryName(a).localeCompare(countryName(b), 'fr'));
  const sectorNames = { general: 'Minimum national général', farm: 'Travailleurs agricoles', domestic: 'Travailleurs domestiques', epwp: 'Programme de travaux publics EPWP' };
  function option(select, value, label) { const item = document.createElement('option'); item.value = value; item.textContent = label; select.append(item); }
  for (const c of countries) { option($('referenceCountry'), c.code, countryName(c)); option($('referenceCompare'), c.code, countryName(c)); option($('vf-country'), c.code, countryName(c)); }
  function selected() {
    const c = engine.getCountry($('referenceCountry').value);
    if (!c) return null;
    const sector = (engine.getStateRates(c.code) || []).find(row => row.code === $('referenceSector').value);
    return { c, amount: sector ? sector.rate : rate(c), basis: sector ? sector.basis || c.basis : c.basis, scope: sector ? sectorNames[sector.code] || sector.name : 'Référence nationale enregistrée', effective: sector && sector.effectiveDate || c.effectiveDate };
  }
  function source(c) {
    return c.code === 'ZA' ? 'Gazette 54075, avis R.7083 : taux général et EPWP vérifiés le 16 septembre 2026, applicables depuis le 1 mars 2026. Apprentissages, nettoyage et commerce peuvent relever de barèmes particuliers. Vérifiez la catégorie exacte.' : 'Entrée historique du catalogue : actualité et champ d’application non vérifiés ici. La date enregistrée ne constitue pas une date de dernière vérification. Confirmez le taux auprès de la source officielle applicable.';
  }
  function tableRow(values, heading) {
    const tr = document.createElement('tr');
    for (const value of values) { const cell = document.createElement(heading ? 'th' : 'td'); cell.textContent = value; if (heading) cell.scope = 'col'; tr.append(cell); }
    return tr;
  }
  function renderTable() {
    const query = $('referenceSearch').value.trim().toLocaleLowerCase('fr');
    const rows = countries.filter(c => (countryName(c) + ' ' + c.code + ' ' + c.currency).toLocaleLowerCase('fr').includes(query));
    const body = $('referenceRows'); body.replaceChildren();
    for (const c of rows) {
      const row = tableRow([countryName(c), c.currency, rate(c) > 0 ? number(rate(c)) + ' ' + (periods[c.basis] || '') : 'Taux non renseigné', date(c.effectiveDate), c.code === 'ZA' ? 'Source officielle vérifiée, champ limité' : 'Actualité à vérifier']);
      body.append(row);
    }
    $('referenceCount').textContent = rows.length + ' entrées affichées sur ' + countries.length + '. Un taux absent ne prouve pas l’absence de minimum légal.';
    return rows;
  }
  function render() {
    const entry = selected();
    $('referenceDetail').hidden = !entry;
    if (!entry) { $('referenceStatus').textContent = ''; return; }
    const { c, amount, basis, scope, effective } = entry;
    $('referenceHeading').textContent = countryName(c) + ' — ' + scope;
    $('referenceRate').textContent = amount > 0 ? number(amount) + ' ' + c.currency + ' ' + (periods[basis] || '') : 'Taux non renseigné dans ce catalogue';
    $('referenceDate').textContent = 'Date d’effet enregistrée : ' + date(effective);
    $('referenceSource').textContent = source(c);
    $('referenceOfficial').hidden = c.code !== 'ZA';
    $('referenceOfficial').href = sourceURL;
    $('referenceLaw').textContent = 'Intitulé du texte enregistré (langue de la source) : ' + c.law;
    $('referenceUse').disabled = !(amount > 0);
    const history = $('referenceHistory'); history.replaceChildren();
    for (const point of c.history || []) history.append(tableRow([point.year, point.amount]));
    $('referenceHistoryNote').textContent = 'Historique enregistré, sans vérification rétrospective ici. Les montants nominaux et les bases de conversion peuvent varier entre années.';
    $('referenceLiving').textContent = c.livingWage > 0 ? 'Repère de coût de la vie enregistré : ' + number(c.livingWage) + ' ' + c.currency + ' par mois pour une personne' + (c.livingWageFamily > 0 ? ', ' + number(c.livingWageFamily) + ' pour une famille' : '') + '. Source déclarée : ' + c.livingWageSource + '. Méthode et actualité non vérifiées ici ; ce repère ne constitue pas un minimum légal.' : 'Aucun repère de coût de la vie renseigné.';
    const other = engine.getCountry($('referenceCompare').value);
    $('referenceComparison').textContent = other ? countryName(c) + ' : ' + (rate(c) > 0 ? number(rate(c)) + ' ' + c.currency + ' ' + (periods[c.basis] || '') : 'taux non renseigné') + ' ; ' + countryName(other) + ' : ' + (rate(other) > 0 ? number(rate(other)) + ' ' + other.currency + ' ' + (periods[other.basis] || '') : 'taux non renseigné') + '. Références nationales ; les devises, périodes et champs diffèrent. Aucun classement de pouvoir d’achat.' : 'Choisissez un second pays pour afficher ses références à côté du premier.';
  }
  function changeCountry() {
    $('referenceSector').replaceChildren(); option($('referenceSector'), '', 'Référence nationale');
    for (const row of engine.getStateRates($('referenceCountry').value) || []) option($('referenceSector'), row.code, sectorNames[row.code] || row.name);
    $('referenceSector').disabled = $('referenceSector').options.length < 2;
    $('referenceStatus').textContent = ''; render();
  }
  $('referenceCountry').addEventListener('change', changeCountry);
  $('referenceSector').addEventListener('change', () => { $('referenceStatus').textContent = ''; render(); });
  $('referenceCompare').addEventListener('change', render);
  $('referenceSearch').addEventListener('input', renderTable);
  $('referenceUse').addEventListener('click', () => {
    const entry = selected(); if (!entry || !(entry.amount > 0)) return;
    const { c, amount, basis, scope, effective } = entry;
    if (!$('currency').querySelector('option[value="' + c.currency + '"]') && !Array.from($('currency').options).some(o => o.value === c.currency)) option($('currency'), c.currency, c.currency);
    $('country').value = countryName(c); $('currency').value = c.currency;
    $('minWage').value = amount; $('minPeriod').value = basis;
    $('sector').value = scope;
    // An effective date is not the user's source-check date.
    $('sourceDate').value = '';
    $('sourceNote').value = 'Référence importée : ' + date(effective) + '. ' + source(c) + (c.code === 'ZA' ? ' ' + sourceURL : '');
    $('minWage').dispatchEvent(new Event('input', { bubbles: true }));
    $('referenceStatus').textContent = 'Référence transférée. Salaire payé, heures, charges et déductions conservés. Renseignez la date de votre propre vérification et contrôlez le champ applicable.';
    $('minWage').focus();
  });
  $('referenceReset').addEventListener('click', () => { $('referenceCountry').value = ''; $('referenceCompare').value = ''; $('referenceSearch').value = ''; changeCountry(); renderTable(); $('referenceCountry').focus(); });
  $('referenceCSV').addEventListener('click', () => {
    const rows = [['Pays', 'Devise', 'Taux de référence', 'Base', 'Date d’effet enregistrée', 'Vérification', 'Texte enregistré', 'Source officielle']];
    for (const c of renderTable()) rows.push([countryName(c), c.currency, rate(c) > 0 ? rate(c) : '', periods[c.basis] || '', date(c.effectiveDate), source(c), c.law, c.code === 'ZA' ? sourceURL : '']);
    const csv = rows.map(row => row.map(value => '"' + String(value).replace(/"/g, '""') + '"').join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'afrotools-references-salaire-minimum.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('referenceStatus').textContent = 'Export CSV préparé avec les entrées filtrées, leur base et leurs limites de vérification.';
  });
  renderTable(); changeCountry();
})();

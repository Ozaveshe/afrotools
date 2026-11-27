(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.AfroTools = root.AfroTools || {}; root.AfroTools.ZaHouseholdLpg = api; api.install(root); }
}(typeof window === 'object' ? window : this, function () {
  'use strict';
  function has(object, key) { return object && Object.prototype.hasOwnProperty.call(object, key); }
  function money(cents) { return 'R' + (cents / 100).toFixed(2); }
  function massGrams(value) {
    var text = String(value).trim();
    if (!/^-?\d+(?:\.\d{1,3})?$/.test(text)) throw Error('Enter the LPG contents in kg, with at most three decimal places.');
    var grams = Math.round(Number(text) * 1000);
    if (!Number.isSafeInteger(grams) || grams <= 0 || grams > 48000) throw Error('This household calculator accepts more than 0 and at most 48 kg of LPG.');
    return grams;
  }
  function referenceState(date, reference) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw Error('A valid reference date is required.');
    return date < reference.validFrom ? 'not-yet-effective' : date > reference.validThrough ? 'expired' : 'in-period';
  }
  function calculate(input, reference, date) {
    if (!input || !has(reference.zoneCentsPerKg, input.zone)) throw Error('Choose a published LPG zone.');
    if (!['unknown', 'general', 'saldanha'].includes(input.supply)) throw Error('Choose a supply-schedule option.');
    var grams = massGrams(input.kg), entries = [];
    function add(id, schedule) {
      if (!has(schedule.zoneCentsPerKg, input.zone)) return false;
      var cents = schedule.zoneCentsPerKg[input.zone];
      if (!Number.isSafeInteger(cents) || cents <= 0) throw Error('The selected source rate is unavailable.');
      entries.push({ schedule: id, zone: input.zone, centsPerKg: cents, totalCents: Math.round(cents * grams / 1000), source: schedule.source, url: schedule.url });
      return true;
    }
    if (input.supply !== 'saldanha') add('general', reference);
    if (input.supply !== 'general') {
      var included = add('saldanha', reference.additionalSchedules.saldanha);
      if (!included && input.supply === 'saldanha') throw Error('R.8127 does not list this zone. Confirm the zone and supply schedule with your retailer; do not substitute the other schedule.');
    }
    return { zone: input.zone, massGrams: grams, supply: input.supply, state: referenceState(date, reference), entries: entries, missingSaldanha: input.supply === 'unknown' && entries.length === 1 };
  }
  function search(query, lookup) {
    var text = String(query).trim().toLocaleLowerCase('en-ZA');
    if (text.length < 2) return [];
    return lookup.records.filter(function (row) { return [row.district, row.code || '', row.province].some(function (value) { return value.toLocaleLowerCase('en-ZA').includes(text); }); });
  }
  function southAfricaDate() {
    var parts = new Intl.DateTimeFormat('en', { timeZone: 'Africa/Johannesburg', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    function part(type) { return parts.find(function (item) { return item.type === type; }).value; }
    return part('year') + '-' + part('month') + '-' + part('day');
  }
  function install(win) {
    var doc = win.document, host = doc.querySelector('[data-za-lpg-calculator]');
    if (!host) return;
    var config = JSON.parse(host.querySelector('[data-za-lpg-config]').textContent), form = host.querySelector('form');
    var status = host.querySelector('[data-za-lpg-status]'), result = host.querySelector('[data-za-lpg-result]'), matches = host.querySelector('[data-za-lpg-matches]');
    function field(id) { return host.querySelector('#' + id); }
    function clear() { result.hidden = true; result.replaceChildren(); status.textContent = 'Selection changed. Calculate again; no supplier or zone has been verified automatically.'; }
    function paragraph(parent, text) { var p = doc.createElement('p'); p.textContent = text; parent.appendChild(p); }
    function lookup() {
      clear(); matches.replaceChildren();
      var rows = search(field('zaLpgDistrict').value, config.lookup);
      paragraph(matches, rows.length ? rows.length + ' archival district matches. Read any boundary note, then choose a zone yourself.' : 'No archival district match. Try a historical district name or use the official place-name links below; ask your retailer to confirm the LPG zone.');
      rows.slice(0, 40).forEach(function (row) {
        var item = doc.createElement('li'), button = doc.createElement('button'); button.type = 'button';
        button.textContent = row.district + (row.sourceLabelClipped ? ' [source label clipped]' : '') + ' — ' + row.province + ' — zone ' + row.zone;
        if (row.boundaryCheck || row.sourceLabelClipped) paragraph(item, 'This row needs boundary confirmation. Do not infer the zone from the town name alone; read source page ' + row.sourcePage + ' and confirm with the retailer.');
        button.addEventListener('click', function () { clear(); field('zaLpgZone').value = row.zone; status.textContent = 'Zone ' + row.zone + ' selected from the archival district row. Confirm its boundary and applicable supply schedule with the retailer.'; field('zaLpgZone').focus(); });
        item.appendChild(button); matches.appendChild(item);
      });
      if (rows.length > 40) paragraph(matches, 'Showing the first 40 matches. Narrow your district search.');
    }
    field('zaLpgFind').addEventListener('click', lookup);
    field('zaLpgDistrict').addEventListener('keydown', function (event) { if (event.key === 'Enter') { event.preventDefault(); lookup(); } });
    form.addEventListener('input', clear); form.addEventListener('change', clear);
    form.addEventListener('reset', function () { clear(); matches.replaceChildren(); field('zaLpgDistrict').value = ''; status.textContent = 'Calculator reset. Choose your zone and enter the net LPG contents.'; });
    form.addEventListener('submit', function (event) {
      event.preventDefault(); clear();
      try {
        if (field('zaLpgKg').validity.badInput) throw Error('Enter a valid LPG mass in kg.');
        var value = calculate({ zone: field('zaLpgZone').value, supply: field('zaLpgSupply').value, kg: field('zaLpgKg').value }, config.reference, southAfricaDate());
        paragraph(result, 'LPG contents: ' + (value.massGrams / 1000) + ' kg. Zone ' + value.zone + '. Reference period: ' + config.reference.period + '.');
        if (value.state === 'expired') paragraph(result, 'EXPIRED SCHEDULE: this November reference ended on 1 December 2026. These are historical totals, not current refill prices. Check the latest official notice before purchasing.');
        if (value.state === 'not-yet-effective') paragraph(result, 'This schedule is not yet effective for today. These are dated reference totals, not current refill prices.');
        if (value.supply === 'unknown') paragraph(result, 'Supply route unconfirmed. These conditional totals do not identify your retailer’s applicable cap. Ask which schedule applies.');
        value.entries.forEach(function (entry) {
          var p = doc.createElement('p'), strong = doc.createElement('strong'), a = doc.createElement('a');
          strong.textContent = money(entry.totalCents) + ' for LPG contents only'; p.appendChild(strong);
          p.appendChild(doc.createTextNode(' — ' + money(entry.centsPerKg) + '/kg × ' + (value.massGrams / 1000) + ' kg; ' + (entry.schedule === 'general' ? 'R.8128 general schedule' : 'R.8127 Saldanha-import schedule') + '. '));
          a.href = entry.url; a.textContent = 'Read the dated official notice'; p.appendChild(a); result.appendChild(p);
        });
        if (value.missingSaldanha) paragraph(result, 'Only the general-schedule row is available for this zone. R.8127 has no row for it; absence is not proof of your supplier’s route. Confirm before relying on a price.');
        paragraph(result, 'This is a dated maximum-price reference, not a supplier quote or delivered/new-cylinder total. Use the kilograms of gas, not the empty cylinder’s tare or gross weight. No additional VAT, deposit, delivery or equipment fee is calculated; ask for an itemised quote and do not infer that an extra charge is permitted.');
        result.hidden = false; status.textContent = 'Dated refill reference calculated locally. Confirm zone, supply schedule and latest notice with the retailer.'; result.focus(); result.scrollIntoView({ block: 'start', behavior: 'auto' });
      } catch (error) { status.textContent = error.message; status.tabIndex = -1; status.focus(); status.scrollIntoView({ block: 'center', behavior: 'auto' }); }
    });
    form.querySelector('button[type=submit]').disabled = false;
  }
  return { calculate: calculate, search: search, massGrams: massGrams, referenceState: referenceState, money: money, install: install };
}));

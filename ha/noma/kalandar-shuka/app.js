(function initHaPlanting(root) {
  'use strict';
  var core = root.Ha04;
  var data = root.AfroTools && root.AfroTools.PlantingCalendarData;
  var engine = root.AfroTools && root.AfroTools.PlantingCalendarEngine;
  var latest = null;
  var months = ['Janawari', 'Fabrairu', 'Maris', 'Afrilu', 'Mayu', 'Yuni', 'Yuli', 'Agusta', 'Satumba', 'Oktoba', 'Nuwamba', 'Disamba'];
  var cropNames = {
    'Maize':'Masara','Maize (Early)':'Masarar farko','Maize (Late)':'Masarar baya','Maize (Long Rain)':'Masara ta doguwar damina','Maize (Short Rain)':'Masara ta gajeriyar damina','Maize (Masika)':'Masara ta Masika','Maize (Vuli)':'Masara ta Vuli','Maize (Summer)':'Masarar bazara','Cassava':'Rogo','Yam':'Doya','Rice':'Shinkafa','Rice (Lowland)':'Shinkafar fadama','Rice (Rainfed)':'Shinkafar ruwan sama','Rice (Irrigated)':'Shinkafar ban ruwa','Plantain':'Ayaba mai dafawa','Cocoa':'Koko','Oil Palm':'Dabino mai','Groundnut':'Gyada','Vegetables':'Kayan lambu','Pepper/Tomato':'Barkono/Tumatir','Cowpea':'Wake','Sorghum':'Dawa','Millet':'Gero','Millet (Pearl)':'Gero','Soybean':'Waken soya','Cotton':'Auduga','Shea Nut':'Ƙarite','Onion':'Albasa','Onion (Dry Season)':'Albasa ta rani','Tomato':'Tumatir','Tomato (Dry Season)':'Tumatir na rani','Wheat':'Alkama','Wheat (Irrigated)':'Alkamar ban ruwa','Wheat (Winter)':'Alkamar hunturu','Sesame':'Ridi','Barley':'Sha’ir','Potato':'Dankali','Potato (Spring)':'Dankalin bazara','Potato (Autumn)':'Dankalin kaka','Beans':'Wake','Beans (Long Rain)':'Wake na doguwar damina','Beans (Short Rain)':'Wake na gajeriyar damina','Coffee':'Kofi','Tea':'Shayi','Cabbage/Kale':'Kabeji','Teff (Ethiopia)':'Teff','Coconut':'Kwakwa','Cashew Nut':'Kashu','Sisal':'Sisal','Banana':'Ayaba','Tobacco':'Taba','Sunflower':'Sunflower','Sweet Potato':'Dankali mai zaƙi','Date Palm':'Dabino','Citrus':'Lemu','Olive':'Zaitun','Grapes':'Inabi','Alfalfa / Fodder':'Alfalfa/ciyawar dabbobi','Vegetables (Autumn)':'Kayan lambu na kaka'
  };
  var config = {
    sourceId: 'planting-calendar', route: '/ha/noma/kalandar-shuka/', formId: 'plantingForm', filename: 'afrotools-kalandar-shuka.json',
    sourceLabel: 'FAO Crop Calendar da bayanan kalandar shuka na AfroTools',
    sourceLinks: ['https://www.fao.org/agriculture/crops/information-resources/ir/'], dataReviewed: '2026-08-08', confidence: 'Matsakaici don tsarawa',
    assumptions: ['Tsarin ruwan sama na yankin', 'Iri da wa’adin girma na yau da kullum']
  };
  function monthList(crop, status) {
    var values = []; crop.months.forEach(function (item) { if (item.status === status) values.push(months[item.monthIndex]); });
    return values.length ? values.join(', ') : '—';
  }
  function render(result) {
    var body = core.byId('calendarRows'); body.innerHTML = '';
    result.crops.forEach(function (crop) {
      var row = document.createElement('tr');
      [cropNames[crop.id] || crop.id, monthList(crop, 'plant'), monthList(crop, 'grow'), monthList(crop, 'harvest')].forEach(function (value, index) {
        var cell = document.createElement(index === 0 ? 'th' : 'td'); cell.textContent = value; if (index === 0) cell.scope = 'row'; row.appendChild(cell);
      }); body.appendChild(row);
    });
    core.byId('calendarNote').textContent = result.note === 'bimodal-two-seasons' ? 'Wannan yankin na iya samun lokutan damina biyu; tabbatar da farkon kowace damina a yankinka.' : result.note === 'forest-unimodal-warning' ? 'Ka zaɓi damina guda a yankin daji. Tabbatar ko yankinka yana da damina biyu.' : 'Kalandar ta nuna tsarin da aka adana ga wannan yankin.';
    core.showResult(); core.setStatus('An samar da kalandar a wannan burauzar.');
  }
  function calculate() {
    if (!data || !engine) return core.fail('Injin ko bayanan kalandar ba su samu ba.', core.byId('zone'));
    var input = { zone: core.byId('zone').value, rainfall: core.byId('rainfall').value };
    var result = engine.calculate(input, data);
    if (!result || !result.ok) return core.fail('Zaɓi ingantaccen yankin noma.', core.byId('zone'));
    latest = { input: input, result: result }; api.latest = latest; render(result); return result;
  }
  function report() { return core.baseReport(config, latest.input, latest.result); }
  function initialise() { core.byId('zone').value = 'guinea'; core.byId('rainfall').value = 'unimodal'; }
  var api = { calculate: calculate, report: report, latest: null, initialise: initialise, engine: engine, data: data };
  document.addEventListener('DOMContentLoaded', function () { initialise(); core.bind(config, api); });
})(window);

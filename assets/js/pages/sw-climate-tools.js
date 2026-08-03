(function () {
  'use strict';

  var root = document.querySelector('[data-sw-climate-tool]');
  var api = window.AfroClimateTools;
  if (!root || !api) return;

  var tool = root.getAttribute('data-sw-climate-tool');
  var form = root.querySelector('form');
  var status = root.querySelector('[data-status]');
  var results = root.querySelector('[data-results]');
  var current = null;
  var currentInputs = null;
  var config = {
    'drought-risk': { result: 'Alama ya hatari ya ukame', metrics: ['Hasara inayokadiriwa', 'Upungufu wa maji', 'Eneo lililo hatarini', 'Ishara ya bima'], actions: ['Linganisha tofauti ya mvua uliyoingiza na kituo cha hali ya hewa au huduma rasmi ya eneo lako.', 'Weka zao mbadala na kiwango cha kuanza umwagiliaji kabla ya msimu kuwa mbaya.', 'Hifadhi vipimo vya mvua, mavuno na hasara kwa msimu unaofuata.'] },
    'water-scarcity': { result: 'Alama ya upungufu wa maji', metrics: ['Mahitaji ya kila siku', 'Siku za hifadhi', 'Hifadhi inayopendekezwa', 'Punguzo kwa kutumia tena'], actions: ['Pima matumizi halisi ya maji kwa wiki mbili.', 'Panga hifadhi kwa muda mrefu zaidi wa kukatika kwa maji uliowahi kuona.', 'Thibitisha matumizi salama na yanayoruhusiwa ya maji yanayotumiwa tena.'] },
    'rainfall-tracker': { result: 'Hali ya mvua', metrics: ['Mvua iliyopatikana', 'Mvua iliyotarajiwa', 'Hitaji la umwagiliaji', 'Hitaji la msimu la zao'], actions: ['Tumia kipima mvua au taarifa ya kituo cha eneo kabla ya kubadili tarehe ya kupanda.', 'Tanguliza mashamba yaliyo katika hatua nyeti zaidi ya ukuaji.', 'Hifadhi mvua na mavuno kila mwezi ili kuboresha makadirio yako.'] },
    'carbon-credit': { result: 'Mapato halisi ya carbon credit', metrics: ['Credit kwa mwaka', 'Kipindi cha credit', 'Mapato ghafi', 'Akiba ya buffer'], actions: ['Thibitisha additionality kabla ya kulipia uthibitishaji.', 'Andika mipaka, ridhaa, hali ya awali na wajibu wa MRV.', 'Jaribu bei iliyopunguzwa nusu na gharama za uthibitishaji zilizoongezeka mara mbili.'] },
    'flood-risk': { result: 'Alama ya hatari ya mafuriko', metrics: ['Hasara ya mwaka', 'Bajeti ya bima', 'Uwezekano wa miaka mitano', 'Udhaifu wa jengo'], actions: ['Hakiki ramani za eneo, alama za maji ya mafuriko na njia za mifereji.', 'Linda milango, soketi, nyaraka na bidhaa.', 'Weka kiwango cha mvua au maji kitakachoanzisha uokoaji.'] },
    'air-quality': { result: 'AQI inayokadiriwa', metrics: ['PM2.5 inayokadiriwa', 'Alama ya hewa unayopumua', 'Muda wa nje', 'Gharama ya afya kwa mwaka'], actions: ['Thibitisha kwa kifuatiliaji cha sasa cha AQI au PM2.5 kabla ya shughuli za nje.', 'Punguza kwanza chanzo kikubwa zaidi cha moshi, vumbi au trafiki.', 'Pima asubuhi, barabarani na wakati wa kupika kwa siku saba ikiwa una sensa.'] },
    'deforestation': { result: 'Utoaji wa CO2 unaokadiriwa', metrics: ['Hifadhi ya baadaye iliyopotea', 'Bajeti ya kurejesha', 'Eneo lililoathiriwa', 'Msongamano wa biomass'], actions: ['Thibitisha umiliki wa ardhi, kanuni za misitu, vibali na ridhaa.', 'Chora maeneo ya mito, miteremko, ardhioevu na misitu ya zamani.', 'Jumuisha gharama ya kurejesha kabla ya kuamua kubadili matumizi ya ardhi.'] },
    'waste-management': { result: 'Alama ya mzunguko wa taka', metrics: ['Taka kwa mwezi', 'Gharama ya ukusanyaji', 'Thamani inayoweza kupatikana', 'Taka hatari'], actions: ['Tenganisha taka za chakula, vitu vikavu vinavyoweza kurejelewa na taka zilizobaki.', 'Pima uzito au ujazo kwa siku saba.', 'Omba stakabadhi za uzito na ushahidi wa ukusanyaji.'] },
    'recycling-revenue': { result: 'Mapato halisi ya urejelezaji', metrics: ['Uzito wa vifaa', 'CO2 iliyozuiwa', 'Alama ya ubora', 'Hasara ya uchafu'], actions: ['Zuia chakula na vimiminika kuingia katika vitu vikavu vya kurejelewa.', 'Unganisha mizigo ili kupunguza gharama ya usafiri kwa kilo.', 'Andika mnunuzi, uzito, bei na sababu za kukataliwa.'] },
    'charcoal-vs-clean': { result: 'Akiba katika kipindi', metrics: ['Gharama ya sasa ya mkaa', 'Gharama ya chaguo safi', 'Punguzo la CO2', 'Alama ya hatari ya moshi'], actions: ['Thibitisha bei na upatikanaji wa kujaza nishati karibu na nyumbani.', 'Boresha hewa jikoni sasa na uwaweke watoto mbali na moshi.', 'Linganisha mkopo wa kifaa na matumizi ya mkaa ya kila wiki.'] },
    'ewaste-value': { result: 'Thamani ya makusanyo', metrics: ['Uzito wote', 'CO2 iliyozuiwa', 'Alama ya hatari', 'Kipaumbele cha kufuta data'], actions: ['Ondoa akaunti, SIM, memory card na vifaa vyako binafsi.', 'Usichome waya au betri, na usivunje vifaa bila kinga sahihi.', 'Omba stakabadhi, uzito na mahali taka zitakapopelekwa.'] },
    'tree-planting-roi': { result: 'Thamani halisi ya miaka 25', metrics: ['Miti itakayoishi', 'Mapato ya carbon', 'Thamani ya mazao au mbao', 'Muda wa kurudisha gharama'], actions: ['Panga maji, uzio, udhibiti wa moto na miche ya kubadilisha iliyokufa.', 'Tenganisha faida ya shamba na mapato ya carbon yasiyohakikishwa.', 'Thibitisha umiliki wa ardhi, aina ya miti na njia ya uthibitishaji.'] },
    'sustainability-scorecard': { result: 'Daraja la uendelevu', metrics: ['Nishati', 'Taka', 'Maji', 'Utayari wa kuripoti'], actions: ['Tengeneza jalada la ushahidi wa siku 90.', 'Chagua lengo moja linalopimika na mtu anayewajibika.', 'Linganisha ushahidi na kanuni au kiwango kinachotumika kweli.'] }
  }[tool];
  if (!config) return;

  var translations = {
    Extreme: 'Kali sana', High: 'Juu', Medium: 'Wastani', Lower: 'Chini', Good: 'Nzuri', Moderate: 'Wastani',
    'Unhealthy for sensitive groups': 'Si salama kwa watu walio hatarini', Unhealthy: 'Si salama',
    'Very unhealthy': 'Si salama sana', Hazardous: 'Hatari', 'Severe deficit': 'Upungufu mkubwa',
    'Below normal': 'Chini ya kawaida', 'Near normal': 'Karibu na kawaida', 'Wet spell': 'Kipindi cha mvua nyingi',
    'Commercially plausible': 'Inawezekana kibiashara, ihakikiwe', 'Needs aggregation': 'Inahitaji kuunganishwa na miradi mingine',
    'Positive ROI': 'Faida chanya katika makadirio', 'Needs redesign': 'Hali hii ibadilishwe',
    'Worth collecting': 'Inaweza kulipa kukusanya', 'Consolidate loads': 'Unganisha mizigo',
    'Switch pays back': 'Kubadili kunarudisha gharama', 'Needs subsidy or finance': 'Inahitaji ruzuku au mkopo',
    'Operationally useful': 'Msingi mzuri wa uendeshaji', 'Needs sorting': 'Utenganishaji uboreshwe',
    'Investor-ready baseline': 'Msingi wa kuandaa ushahidi', Improving: 'Inaboreka',
    'Needs a 90-day plan': 'Inahitaji mpango wa siku 90', Yes: 'Ndiyo', No: 'Hapana',
    Normal: 'Kawaida', Monitor: 'Fuatilia', 'Review now': 'Kagua sasa'
  };
  var unitTranslations = { years: 'miaka', year: 'mwaka', planning: 'makadirio', days: 'siku', litres: 'lita' };

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char];
    });
  }
  function translateValue(value) {
    var text = String(value == null ? '' : value);
    return translations[text] || text.replace(' impact', ' — athari').replace(' handling risk', ' — hatari ya kushughulikia');
  }
  function translateUnit(value) { return unitTranslations[value] || String(value || ''); }
  function inputs() {
    var value = {};
    root.querySelectorAll('[data-cl-field]').forEach(function (field) {
      value[field.getAttribute('data-cl-field')] = field.type === 'number' ? Number(field.value) : field.value;
    });
    return value;
  }
  function setStatus(message, ok) {
    status.textContent = message;
    status.className = 'sw-climate-status' + (ok ? ' ok' : '');
  }
  function clearForEdit(event) {
    if (event && event.target) event.target.removeAttribute('aria-invalid');
    current = null;
    currentInputs = null;
    results.hidden = true;
    setStatus('', false);
  }
  function validate() {
    var fields = root.querySelectorAll('[data-cl-field]');
    for (var index = 0; index < fields.length; index += 1) {
      var field = fields[index];
      field.removeAttribute('aria-invalid');
      if (!field.checkValidity()) {
        field.setAttribute('aria-invalid', 'true');
        field.focus();
        return false;
      }
    }
    return true;
  }
  function render(output) {
    root.querySelector('[data-result-label]').textContent = config.result;
    root.querySelector('[data-result-value]').textContent = translateValue(output.value);
    root.querySelector('[data-result-level]').textContent = translateValue(output.level);
    root.querySelector('[data-result-note]').textContent = 'Haya ni matokeo ya modeli ya AfroTools kwa taarifa ulizoingiza. Si data ya moja kwa moja wala uamuzi rasmi.';
    root.querySelector('[data-metrics]').innerHTML = (output.metrics || []).map(function (metric, index) {
      return '<div class="sw-climate-metric"><span>' + escapeHtml(config.metrics[index]) + '</span><strong>' +
        escapeHtml(translateValue(metric.value)) + (metric.unit ? ' ' + escapeHtml(translateUnit(metric.unit)) : '') + '</strong></div>';
    }).join('');
    root.querySelector('[data-plan]').innerHTML = config.actions.map(function (action) { return '<li>' + escapeHtml(action) + '</li>'; }).join('');
    results.hidden = false;
    setStatus('Makadirio yamekamilika kwenye kifaa hiki.', true);
  }
  function calculate(event) {
    if (event) event.preventDefault();
    if (!validate()) return setStatus('Kagua thamani na mipaka iliyoonyeshwa.', false);
    try {
      currentInputs = inputs();
      current = api.calculate(tool, currentInputs);
      render(current);
    } catch (error) {
      current = null;
      results.hidden = true;
      setStatus('Makadirio hayawezi kukamilika kwa thamani hizi.', false);
    }
  }
  function summary() {
    if (!current) return '';
    return ['AFROTOOLS — RIPOTI YA HALI YA HEWA NA MAZINGIRA', root.querySelector('h1').textContent,
      config.result + ': ' + translateValue(current.value), 'Kiwango: ' + translateValue(current.level), '', 'Vipimo:']
      .concat((current.metrics || []).map(function (metric, index) {
        return '- ' + config.metrics[index] + ': ' + translateValue(metric.value) + (metric.unit ? ' ' + translateUnit(metric.unit) : '');
      }), ['', 'Hatua:'].concat(config.actions.map(function (action, index) {
        return (index + 1) + '. ' + action;
      }), ['', 'Makadirio ya kupanga pekee. Modeli ilikaguliwa 28 Aprili 2026; mifano ya nchi ina uhakika mdogo na haisasishwi moja kwa moja.'])).join('\n');
  }
  function copy() {
    var text = summary();
    if (!text) return setStatus('Kamilisha makadirio kwanza.', false);
    var fallback = function () {
      var area = document.createElement('textarea');
      area.value = text; area.style.position = 'fixed'; area.style.opacity = '0';
      document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove();
      setStatus('Muhtasari umenakiliwa.', true);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { setStatus('Muhtasari umenakiliwa.', true); }, fallback);
    } else fallback();
  }
  function save() {
    if (!current) return setStatus('Kamilisha makadirio kwanza.', false);
    try {
      localStorage.setItem('afrotools-sw-climate-' + tool, JSON.stringify(exportPayload()));
      setStatus('Makadirio yamehifadhiwa kwenye kifaa hiki pekee.', true);
    } catch (error) {
      setStatus('Hifadhi ya kifaa haipatikani.', false);
    }
  }
  function exportPayload() {
    return {
      schemaVersion: 1,
      locale: 'sw',
      tool: tool,
      savedAt: new Date().toISOString(),
      inputs: currentInputs,
      result: { value: current.value, level: current.level, metrics: current.metrics }
    };
  }
  function downloadJson() {
    if (!current) return setStatus('Kamilisha makadirio kwanza.', false);
    var blob = new Blob([JSON.stringify(exportPayload(), null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'afrotools-sw-' + tool + '.json';
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    setStatus('Faili ya JSON imepakuliwa.', true);
  }
  function importJson(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    file.text().then(function (text) {
      var payload = JSON.parse(text);
      if (payload.schemaVersion !== 1 || payload.locale !== 'sw' || payload.tool !== tool || !payload.inputs) throw new Error('invalid');
      Object.keys(payload.inputs).forEach(function (key) {
        var field = root.querySelector('[data-cl-field="' + key.replace(/[^a-zA-Z0-9_-]/g, '') + '"]');
        if (field) field.value = payload.inputs[key];
      });
      calculate();
      setStatus('Faili ya JSON imefunguliwa na kukokotolewa tena.', true);
    }).catch(function () {
      setStatus('JSON hii si faili sahihi ya zana hii.', false);
    }).finally(function () { event.target.value = ''; });
  }
  function pdf() {
    if (!current) return setStatus('Kamilisha makadirio kwanza.', false);
    var load = window.jspdf && window.jspdf.jsPDF ? Promise.resolve() : new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = '/assets/vendor/jspdf/jspdf.umd.min.js';
      script.onload = resolve; script.onerror = reject; document.head.appendChild(script);
    });
    load.then(function () {
      var PDF = window.jspdf.jsPDF;
      var doc = new PDF({ unit: 'mm', format: 'a4' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      doc.text(doc.splitTextToSize(summary(), 174), 18, 18);
      doc.save('afrotools-sw-' + tool + '.pdf');
      setStatus('Ripoti ya PDF imetengenezwa kwenye kifaa hiki.', true);
    }).catch(function () { setStatus('Programu ya PDF ya kifaa haipatikani.', false); });
  }

  form.addEventListener('submit', calculate);
  form.addEventListener('input', clearForEdit);
  form.addEventListener('change', clearForEdit);
  root.querySelector('[data-copy]').addEventListener('click', copy);
  root.querySelector('[data-save]').addEventListener('click', save);
  root.querySelector('[data-json]').addEventListener('click', downloadJson);
  root.querySelector('[data-import]').addEventListener('click', function () { root.querySelector('[data-import-file]').click(); });
  root.querySelector('[data-import-file]').addEventListener('change', importJson);
  root.querySelector('[data-pdf]').addEventListener('click', pdf);
}());

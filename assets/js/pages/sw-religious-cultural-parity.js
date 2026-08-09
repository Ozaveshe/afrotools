(function initSwReligiousCulturalPage() {
  'use strict';

  const engine = window.AfroTools && window.AfroTools.religiousCulturalParity;
  const configNode = document.getElementById('sw-rc-config');
  const form = document.getElementById('sw-rc-form');
  const output = document.getElementById('sw-rc-output');
  const status = document.getElementById('sw-rc-status');
  if (!engine || !configNode || !form || !output || !status) return;

  let config;
  let lastResult = null;
  try { config = JSON.parse(configNode.textContent); }
  catch (error) {
    status.textContent = 'Mpangilio wa zana haupatikani. Pakia ukurasa upya.';
    status.dataset.state = 'error';
    return;
  }

  const labels = Object.freeze({
    percentage:'Kiasi cha asilimia uliyochagua', offering:'Sadaka ya ziada', pledgePerPeriod:'Ahadi kwa kipindi', total:'Jumla', remaining:'Salio la hesabu', subtotal:'Jumla ndogo', bufferAmount:'Akiba ya dharura',
    familyA:'Familia ya kwanza', familyB:'Familia ya pili', pending:'Jambo la kuthibitisha', nextStep:'Hatua inayofuata', items:'Vipengee', culture:'Lugha au jamii', purpose:'Matumizi yaliyopangwa', verification:'Njia ya uthibitishaji', text:'Methali ya kuanzia', context:'Tahadhari ya muktadha',
    city:'Jiji la mfano', method:'Njia ya kulinganisha', school:'Njia ya Asr', timeZone:'Ukanda wa saa', date:'Tarehe', fajr:'Fajr', sunrise:'Kuchomoza jua', dhuhr:'Dhuhr', asr:'Asr', maghrib:'Maghrib', isha:'Isha', qibla:'Mwelekeo wa Qibla (digrii)', startDate:'Tarehe ya kuanzia', days:'Siku', firstSuhoor:'Mwisho wa suhoor, siku ya kwanza', firstIftar:'Iftar, siku ya kwanza', lastSuhoor:'Mwisho wa suhoor, siku ya mwisho', lastIftar:'Iftar, siku ya mwisho', rows:'Ratiba ya kila tarehe',
    financed:'Kiasi kinachofadhiliwa', markup:'Ongezeko la gharama', monthly:'Kiasi cha mwezi', hospitality:'Mapokezi ya waombolezaji', candidate:'Jina linalopitiwa', reportedMeaning:'Maana iliyotolewa', reviewer:'Mtu wa kuthibitisha', referenceDate:'Tarehe ya marejeo', marketDay:'Siku ya mzunguko', localAuthority:'Chanzo cha eneo', years:'Miaka kamili', months:'Miezi ya ziada', totalDays:'Siku zote', weekday:'Siku ya kuzaliwa', name:'Pendekezo la jina la siku',
    festival:'Tamasha au tukio', country:'Nchi au jamii', provisionalDate:'Tarehe ya muda', organizer:'Mratibu wa kuthibitisha', respectNote:'Kanuni ya heshima', nextAction:'Hatua inayofuata', discountAmount:'Punguzo', quantity:'Idadi', documented:'Vipengee vilivyoandikwa', missing:'Vipengee visivyoandikwa', followUps:'Mambo ya kufuatilia', totalChecks:'Ukaguzi wote', authority:'Mamlaka ya kuuliza', certification:'Uthibitisho umetolewa', gregorian:'Tarehe ya Gregorian', hijriDay:'Siku ya Hijri ya makisio', hijriMonth:'Namba ya mwezi wa Hijri', hijriMonthName:'Mwezi wa Hijri wa makisio', hijriYear:'Mwaka wa Hijri wa makisio', adjustment:'Marekebisho ya siku', boundary:'Aina ya matokeo'
  });
  const values = Object.freeze({
    true:'Ndiyo, katika hesabu hii tu', false:'Hapana', 'family-review-needed':'Uthibitishaji wa familia unahitajika', 'confirm-exact-date':'Thibitisha tarehe na mratibu', 'tabular-estimate':'Makisio ya kalenda ya hesabu',
    dimanche:'Jumapili', lundi:'Jumatatu', mardi:'Jumanne', mercredi:'Jumatano', jeudi:'Alhamisi', vendredi:'Ijumaa', samedi:'Jumamosi',
    Mouharram:'Muharram', Safar:'Safar', 'Rabi al-Awwal':'Rabi al-Awwal', 'Rabi ath-Thani':'Rabi al-Thani', 'Joumada al-Oula':'Jumada al-Awwal', 'Joumada ath-Thania':'Jumada al-Thani', Rajab:'Rajab', Chaabane:"Sha'ban", Ramadan:'Ramadhani', Chawwal:'Shawwal', 'Dhou al-Qi’da':"Dhul-Qi'dah", 'Dhou al-Hijja':'Dhul-Hijjah'
  });

  function inputs() {
    const data = {};
    new FormData(form).forEach((value, key) => { data[key] = value; });
    return data;
  }
  function display(key, value) {
    if (config.sourceId === 'african-proverbs' && key === 'text') {
      return form.elements.culture.value === 'Swahili' ? 'Haraka haraka haina baraka.' : 'Rejea ya methali inahitaji kuthibitishwa na msemaji wa lugha hiyo.';
    }
    if (config.sourceId === 'african-proverbs' && key === 'context') return 'Thibitisha maneno, maana, jamii na uhusishaji kabla ya kutumia au kuchapisha.';
    if (config.sourceId === 'islamic-calendar' && key === 'gregorian') {
      const date = new Date(`${form.elements.date.value}T00:00:00Z`);
      return new Intl.DateTimeFormat('sw-TZ', { day:'numeric', month:'long', year:'numeric', timeZone:'UTC' }).format(date);
    }
    if (Array.isArray(value) && value.some((item) => item && item.date)) return value.map((item) => `${item.date}: suhoor ${item.suhoor}, iftar ${item.iftar}`).join(' · ');
    if (Array.isArray(value)) return value.map((item) => `${item.item || 'Kipengee'}: ${Number(item.value || 0).toLocaleString('sw-TZ')}`).join(' · ');
    if (typeof value === 'boolean') return values[String(value)];
    if (typeof value === 'number') {
      const currency = form.elements.currency && form.elements.currency.value;
      const formatted = value.toLocaleString('sw-TZ', { maximumFractionDigits: 2 });
      return currency && /total|share|amount|nisab|zakat|monthly|markup|financed|remaining|offering|percentage|hospitality|subtotal|discount/i.test(key) ? `${currency} ${formatted}` : formatted;
    }
    return values[String(value)] || String(value);
  }
  function render(result) {
    const list = document.createElement('dl');
    list.className = 'fr-rc-results-list';
    Object.entries(result).forEach(([key, value]) => {
      const row = document.createElement('div');
      const term = document.createElement('dt');
      const detail = document.createElement('dd');
      term.textContent = labels[key] || key;
      detail.textContent = display(key, value);
      row.append(term, detail); list.appendChild(row);
    });
    output.replaceChildren(list); output.hidden = false;
  }
  function fail(result) {
    const field = result.field && form.elements[result.field];
    const fieldConfig = config.fields.find((item) => item.id === result.field);
    const name = fieldConfig ? fieldConfig.label : 'taarifa';
    const messages = { REQUIRED:`Jaza ${name}.`, INVALID_NUMBER:`Weka namba sahihi kwa ${name}.`, MIN:`${name} iko chini ya kiwango cha chini.`, MAX:`${name} imezidi kiwango cha juu.`, INTEGER:`${name} lazima iwe namba kamili.`, INVALID_TIME:'Weka saa sahihi.', INVALID_DATE:`Weka tarehe sahihi kwa ${name}.`, DATE_ORDER:'Tarehe ya kukokotoa isiwe kabla ya tarehe ya kuzaliwa.', DEPOSIT_EXCEEDS_PRICE:'Amana haiwezi kuzidi bei ya mali.', UNSUPPORTED:`Chaguo la ${name} halitumiki.`, CALCULATION_ERROR:'Hesabu ya ndani imeshindwa.' };
    status.textContent = messages[result.code] || 'Kagua taarifa ulizoingiza.';
    status.dataset.state = 'error'; output.hidden = true; output.replaceChildren(); lastResult = null;
    if (field) { field.setAttribute('aria-invalid', 'true'); field.focus(); }
  }
  function calculate(event) {
    if (event) event.preventDefault();
    form.querySelectorAll('[aria-invalid="true"]').forEach((node) => node.removeAttribute('aria-invalid'));
    const result = engine.calculate(config.engine, inputs());
    if (!result.ok) { fail(result); return null; }
    lastResult = result.values; render(lastResult);
    status.textContent = 'Matokeo yamekokotolewa kwenye kivinjari hiki. Hakuna ingizo lililotumwa.';
    status.dataset.state = 'success'; return lastResult;
  }
  function payload() {
    const result = lastResult || calculate();
    return result && { schemaVersion:1, locale:'sw', tool:config.sourceId, route:config.route, generatedAt:new Date().toISOString(), inputs:inputs(), result, source:config.source, reviewedOn:config.reviewedOn, confidence:config.confidence, boundary:config.boundary, privacy:'Hesabu na faili zimetengenezwa kwenye kivinjari; hakuna ingizo lililotumwa.' };
  }
  function download() {
    const data = payload(); if (!data) return;
    const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], { type:'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `${config.sourceId}-sw-matokeo.json`; document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000); status.textContent = 'Faili ya JSON imepakuliwa kwenye kifaa hiki.';
  }
  function copy() {
    const data = payload(); if (!data) return;
    const text = JSON.stringify(data, null, 2);
    if (!navigator.clipboard || !navigator.clipboard.writeText) { status.textContent = 'Nakili haipatikani; pakua JSON.'; status.dataset.state = 'error'; return; }
    navigator.clipboard.writeText(text).then(() => { status.textContent = 'Muhtasari umenakiliwa.'; }).catch(() => { status.textContent = 'Nakili haikufaulu; pakua JSON.'; status.dataset.state = 'error'; });
  }

  form.addEventListener('submit', calculate);
  form.addEventListener('input', () => { if (!lastResult) return; lastResult = null; output.hidden = true; output.replaceChildren(); status.textContent = 'Taarifa zimebadilika. Kokotoa tena.'; status.dataset.state = 'changed'; });
  document.getElementById('sw-rc-reset').addEventListener('click', () => { setTimeout(() => { lastResult = null; output.hidden = true; output.replaceChildren(); status.textContent = 'Mfano umewekwa upya.'; status.dataset.state = 'changed'; }, 0); });
  document.getElementById('sw-rc-copy').addEventListener('click', copy);
  document.getElementById('sw-rc-download').addEventListener('click', download);
  document.getElementById('sw-rc-print').addEventListener('click', () => { if (!lastResult) calculate(); window.print(); });
  calculate();
})();

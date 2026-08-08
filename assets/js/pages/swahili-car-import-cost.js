(function initSwahiliCarImportCost() {
  'use strict';

  var body = document.body;
  if (!body || body.getAttribute('data-sw-transport-parity') !== 'car-import-cost') return;

  var route = body.getAttribute('data-sw-transport-route') || '/sw/zana/gharama-kuagiza-gari/';
  var status = document.getElementById('swCarImportStatus');
  var error = document.getElementById('swCarImportError');
  var resultIsFresh = false;
  var translations = {
    'Build your landed-cost quote': 'Jenga makadirio ya gharama iliyofika',
    'Start with the car details you know. The engine can work from purchase price, FOB, CIF, or make/model/year valuation seeds.': 'Anza na taarifa za gari ulizo nazo. Injini inaweza kutumia bei ya ununuzi, FOB, CIF au makadirio ya chapa, modeli na mwaka.',
    'Import country': 'Nchi ya kuingiza gari',
    'Source market': 'Soko la ununuzi',
    'Input mode': 'Aina ya taarifa ulizo nazo',
    'Output mode': 'Aina ya makadirio',
    'I know the purchase price': 'Ninajua bei ya ununuzi',
    'I know FOB': 'Ninajua FOB',
    'I know CIF': 'Ninajua CIF',
    'I only know make/model/year': 'Ninajua chapa, modeli na mwaka pekee',
    'I want to compare source markets': 'Nataka kulinganisha masoko ya ununuzi',
    'Official + practical port costs': 'Tozo za mfano na gharama za kawaida za bandari',
    'Official mode': 'Tozo za mfano pekee',
    'Stress test': 'Jaribio la gharama kubwa',
    'Make': 'Chapa',
    'Model': 'Modeli',
    'Trim optional': 'Toleo la gari (si lazima)',
    'Year': 'Mwaka',
    'First registration month': 'Mwezi wa usajili wa kwanza',
    'Fuel type': 'Aina ya mafuta',
    'Engine cc': 'Ukubwa wa injini (cc)',
    'Body type': 'Aina ya mwili wa gari',
    'Drive side': 'Upande wa usukani',
    'Transmission': 'Gia',
    'Condition': 'Hali ya gari',
    'Mileage': 'Kilomita zilizotumika',
    'Purchase price USD': 'Bei ya ununuzi (USD)',
    'FOB USD': 'FOB (USD)',
    'CIF USD': 'CIF (USD)',
    'Advanced costs and finance': 'Gharama za ziada na ufadhili',
    'Freight USD': 'Usafirishaji (USD)',
    'Insurance USD': 'Bima ya usafirishaji (USD)',
    'Official customs value USD': 'Thamani ya forodha (USD)',
    'Port': 'Bandari',
    'Destination city': 'Jiji la mwisho',
    'Delay days': 'Siku za kuchelewa',
    'Storage days': 'Siku za kuhifadhi bandarini',
    'Clearing mode': 'Njia ya kupitisha forodhani',
    'Agent estimate': 'Makadirio ya wakala',
    'DIY estimate': 'Makadirio ya kujifanyia',
    'Down payment %': 'Amana ya awali (%)',
    'APR %': 'Riba ya mwaka APR (%)',
    'Finance months': 'Miezi ya mkopo',
    'Local dealer price USD': 'Bei ya muuzaji wa ndani (USD)',
    'Extra agency charges USD': 'Ada nyingine za wakala (USD)',
    'Calculate landed cost': 'Kokotoa gharama iliyofika',
    'Compare source markets': 'Linganisha masoko ya ununuzi',
    'Estimated on-road cost': 'Makadirio ya gharama ya barabarani',
    'Summary': 'Muhtasari',
    'Official Charges': 'Tozo za mfano',
    'Practical Costs': 'Gharama za kawaida',
    'Registration': 'Usajili',
    'Scenarios': 'Hali tofauti',
    'Compare': 'Linganisha',
    'Documents': 'Nyaraka',
    'FAQ': 'Maswali',
    'Customs value basis': 'Msingi wa thamani ya forodha',
    'Official charges': 'Tozo zinazotokana na pakiti ya kanuni',
    'Third-party, port, and delivery costs': 'Gharama za wahusika wengine, bandari na ufikishaji',
    'Registration and plates': 'Usajili na namba za gari',
    'Scenarios and sensitivity': 'Hali tofauti na mabadiliko ya gharama',
    'Exchange-rate and delay sensitivity': 'Athari za ubadilishaji fedha na ucheleweshaji',
    'Source market comparison': 'Ulinganisho wa masoko ya ununuzi',
    'Document checklist': 'Orodha ya nyaraka',
    'Sources used': 'Vyanzo vilivyotumika',
    'Trust notes': 'Mipaka na kiwango cha kuamini',
    'Ask the AfroTools car import advisor': 'Mwongozo wa ndani wa kuagiza gari',
    'Ask why this country is expensive, what hidden costs to expect, or whether to import or buy locally.': 'Uliza kuhusu dhana, gharama zilizofichika au kulinganisha kuagiza na kununua ndani.',
    'Ask AI with this quote': 'Pata mwongozo wa ndani (hautumiwi mtandaoni)',
    'Export PDF': 'Pakua PDF',
    'Export CSV': 'Pakua CSV',
    'Print': 'Chapisha',
    'Share quote': 'Shiriki njia ya zana',
    'Save locally': 'Hifadhi kwenye kifaa',
    'Saved locally': 'Imehifadhiwa kwenye kifaa',
    'No charges in this block for the active inputs.': 'Hakuna tozo katika sehemu hii kwa taarifa zilizowekwa.',
    'Vehicle + freight + insurance': 'Gari, usafirishaji na bima',
    'Official taxes': 'Kodi za mfano',
    'Official fees': 'Ada za mfano',
    'Practical port costs': 'Gharama za kawaida za bandari',
    'Inland delivery': 'Usafirishaji wa ndani',
    'Monthly finance': 'Malipo ya mkopo kwa mwezi',
    'Resale band': 'Makadirio ya bei ya kuuza tena',
    'Vehicle base / FOB': 'Thamani ya gari / FOB',
    'Freight to port': 'Usafirishaji hadi bandari',
    'Marine insurance': 'Bima ya baharini',
    'CIF / customs value': 'CIF / thamani ya forodha',
    'Best case': 'Hali nafuu',
    'Normal': 'Hali ya kawaida',
    'Painful case': 'Hali ya gharama kubwa',
    'Source': 'Soko',
    'Freight': 'Usafirishaji',
    'Landed': 'Iliyofika',
    'On-road': 'Ya barabarani',
    'Item': 'Kipengele',
    'Rate': 'Kiwango',
    'Local': 'Sarafu ya nchi',
    'January': 'Januari',
    'February': 'Februari',
    'March': 'Machi',
    'April': 'Aprili',
    'May': 'Mei',
    'June': 'Juni',
    'July': 'Julai',
    'August': 'Agosti',
    'September': 'Septemba',
    'October': 'Oktoba',
    'November': 'Novemba',
    'December': 'Desemba',
    'Petrol': 'Petroli',
    'Diesel': 'Dizeli',
    'Hybrid': 'Mseto',
    'Automatic': 'Otomatiki',
    'Manual': 'Mwongozo',
    'Used': 'Limetumika',
    'New': 'Jipya',
    'Right-hand drive': 'Usukani wa kulia',
    'Left-hand drive': 'Usukani wa kushoto'
  };

  function translateText(value) {
    var original = String(value || '');
    var trimmed = original.trim();
    if (Object.prototype.hasOwnProperty.call(translations, trimmed)) {
      return original.replace(trimmed, translations[trimmed]);
    }
    return original;
  }

  function translateSubtree(root) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function translateNode(node) {
      if (node.parentElement && node.parentElement.closest('script,style')) return;
      var translated = translateText(node.nodeValue);
      if (translated !== node.nodeValue) node.nodeValue = translated;
    });
    root.querySelectorAll('[placeholder],[aria-label],[title]').forEach(function translateAttributes(element) {
      ['placeholder', 'aria-label', 'title'].forEach(function update(attribute) {
        if (element.hasAttribute(attribute)) element.setAttribute(attribute, translateText(element.getAttribute(attribute)));
      });
    });
  }

  function keepRouteOnly() {
    if (location.pathname !== route || location.search || location.hash) history.replaceState(null, '', route);
  }

  function clearResult(message) {
    var results = document.getElementById('carImportResults');
    if (results) {
      results.hidden = true;
      results.style.display = 'none';
    }
    resultIsFresh = false;
    if (status) status.textContent = message || 'Badilisha taarifa, kisha kokotoa tena kabla ya kupakua.';
  }

  function installPrivacyBoundary() {
    var nativeReplaceState = history.replaceState.bind(history);
    history.replaceState = function boundedReplaceState(state, title, nextUrl) {
      if (nextUrl) {
        try {
          var parsed = new URL(nextUrl, location.href);
          if (parsed.pathname === route && (parsed.search || parsed.hash)) return nativeReplaceState(state, title, route);
        } catch (urlError) {
          return nativeReplaceState(state, title, route);
        }
      }
      return nativeReplaceState(state, title, nextUrl);
    };
    try {
      localStorage.removeItem('carImportCostLastInput');
      var nativeSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function privacyBoundedSetItem(key, value) {
        if (this === localStorage && key === 'carImportCostLastInput') return;
        return nativeSetItem.call(this, key, value);
      };
    } catch (storageError) { /* local mode remains usable */ }
    keepRouteOnly();
  }

  installPrivacyBoundary();

  document.addEventListener('DOMContentLoaded', function afterOwnerMounts() {
    var attempts = 0;
    function finishSetup() {
      var form = document.getElementById('carImportForm');
      if (!form) {
        attempts += 1;
        if (attempts < 60) setTimeout(finishSetup, 50);
        return;
      }
      form.querySelectorAll('input[type="number"]').forEach(function constrain(input) { input.min = '0'; });
      var cloudSave = document.getElementById('carImportCloudSave');
      if (cloudSave) cloudSave.remove();
      clearResult('Weka taarifa zako, kisha kokotoa makadirio mapya kabla ya kupakua.');
      translateSubtree(body);
      keepRouteOnly();
    }
    finishSetup();
    var queued = false;
    new MutationObserver(function translateChanges() {
      if (queued) return;
      queued = true;
      setTimeout(function processChanges() {
        queued = false;
        translateSubtree(body);
      }, 0);
    }).observe(body, { childList: true, subtree: true, characterData: true });
  });

  document.addEventListener('submit', function validateBeforeCalculation(event) {
    var form = event.target.closest('#carImportForm');
    if (!form) return;
    var invalid = Array.prototype.slice.call(form.querySelectorAll('input,select')).some(function isInvalid(control) {
      return !control.checkValidity() || (control.type === 'number' && control.value !== '' && Number(control.value) < 0);
    });
    if (invalid) {
      event.preventDefault();
      event.stopImmediatePropagation();
      clearResult('Matokeo yamefutwa. Rekebisha thamani hasi au taarifa batili kabla ya kukokotoa tena.');
      if (error) error.textContent = 'Rekebisha taarifa batili kabla ya kuendelea.';
      return;
    }
    resultIsFresh = true;
    var results = document.getElementById('carImportResults');
    if (results) results.style.removeProperty('display');
    if (error) error.textContent = '';
    if (status) status.textContent = 'Makadirio mapya yako tayari. Thibitisha vyanzo na masharti kabla ya kulipa.';
    setTimeout(function afterCalculation() { translateSubtree(body); keepRouteOnly(); }, 0);
  }, true);

  document.addEventListener('input', function staleAfterEdit(event) {
    if (!event.target.closest('#carImportForm') || !resultIsFresh) return;
    clearResult();
  });

  document.addEventListener('click', function localAdviceAndRouteShare(event) {
    var aiButton = event.target.closest('#carImportAskAi');
    if (aiButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      var log = document.getElementById('carImportAiLog');
      var question = document.getElementById('carImportAiQuestion');
      if (log && question && question.value.trim()) {
        var message = document.createElement('div');
        message.className = 'car-import-ai-message assistant';
        message.textContent = 'Mwongozo wa ndani: acha akiba kwa mabadiliko ya fedha, uhifadhi bandarini, tofauti za wakala na tathmini ya mwisho ya forodha. Hakuna taarifa iliyotumwa mtandaoni.';
        log.appendChild(message);
        question.value = '';
        if (status) status.textContent = 'Mwongozo wa ndani umeonyeshwa bila kutuma taarifa mtandaoni.';
      }
      return;
    }
    var shareButton = event.target.closest('#carImportShare');
    if (shareButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      keepRouteOnly();
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(location.origin + route).catch(function ignore() {});
      if (status) status.textContent = 'Njia ya zana pekee imenakiliwa; taarifa za gari hazijashirikiwa.';
    }
  }, true);
})();

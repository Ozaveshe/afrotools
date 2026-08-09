(function (global) {
  'use strict';

  var STRINGS = {
    invalid: 'Weka kiasi kikubwa kuliko sifuri na ada za 0% hadi 100%.',
    amount: 'Kiasi',
    mobileQuote: 'Nukuu ya pesa za simu',
    bankQuote: 'Nukuu ya uhamisho wa benki',
    flat: 'Ada ya kudumu',
    effectiveFee: 'Kiwango halisi cha ada',
    sameEnteredCost: 'GHARAMA ILIYOINGIZWA NI SAWA',
    cheapest: 'GHARAMA NDOGO',
    cheaper: 'Yenye gharama ndogo',
    sameCost: 'Gharama sawa'
  };

  global.AfroToolsFintechI18n = {
    isFrench: function () { return false; },
    isSwahili: function () { return true; },
    text: function (toolId, key, fallback) {
      return toolId === 'mobile-vs-bank' && Object.prototype.hasOwnProperty.call(STRINGS, key)
        ? STRINGS[key]
        : fallback;
    }
  };

  var form = document.querySelector('[data-sw-mobile-bank-form]');
  if (!form) return;
  var result = form.querySelector('#mb-results');
  var error = form.querySelector('#mb-error');
  var actions = form.querySelector('[data-sw-result-actions]');
  var status = form.querySelector('[data-sw-result-status]');

  function setStatus(message) {
    if (status) status.textContent = message;
  }

  function syncActions() {
    var active = Boolean(result && result.classList.contains('on'));
    if (actions) actions.hidden = !active;
    if (!active) setStatus('Kokotoa kwanza ili kuwezesha kunakili au kupakua matokeo.');
  }

  function clearStaleResult() {
    if (result) result.classList.remove('on');
    if (error) {
      error.textContent = '';
      error.classList.remove('on');
    }
    syncActions();
  }

  function field(id) {
    var node = form.querySelector('#' + id);
    return node ? String(node.value || '').trim() : '';
  }

  function visibleExport() {
    if (!result || !result.classList.contains('on')) return '';
    return [
      'AfroTools — Pesa za simu dhidi ya uhamisho wa benki',
      'Nchi na sarafu: ' + field('mb-country'),
      'Tarehe ya nukuu: ' + field('mb-quote-date'),
      'Huduma ya pesa za simu: ' + field('mb-mm-provider'),
      'Chanzo cha ada za pesa za simu: ' + field('mb-mm-source'),
      'Benki: ' + field('mb-bank-provider'),
      'Chanzo cha ada za benki: ' + field('mb-bank-source'),
      '',
      result.innerText.replace(/\n{3,}/g, '\n\n').trim(),
      '',
      'Kadirio la kupanga pekee. Thibitisha nukuu, kodi, ada ya kutoa, mipaka, muda na masharti na watoa huduma kabla ya kutuma pesa.',
      'Fomula na upangaji wa matokeo hauathiriwi na mdhamini au mshirika wa kibiashara.'
    ].join('\n');
  }

  function copyResult() {
    var value = visibleExport();
    if (!value) {
      setStatus('Kokotoa kwanza, kisha nakili matokeo yanayoonekana.');
      return;
    }
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      setStatus('Kunakili kiotomatiki hakupatikani kwenye kivinjari hiki.');
      return;
    }
    navigator.clipboard.writeText(value).then(function () {
      setStatus('Matokeo yamenakiliwa.');
    }).catch(function () {
      setStatus('Kunakili kumeshindikana; chagua maandishi na unakili mwenyewe.');
    });
  }

  function downloadResult() {
    var value = visibleExport();
    if (!value) {
      setStatus('Kokotoa kwanza, kisha pakua matokeo yanayoonekana.');
      return;
    }
    var blob = new Blob([value], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'ulinganisho-pesa-simu-na-benki.txt';
    link.hidden = true;
    document.body.appendChild(link);
    link.click();
    global.setTimeout(function () {
      link.remove();
      URL.revokeObjectURL(url);
    }, 0);
    setStatus('Faili ya TXT imepakuliwa kwenye kifaa hiki.');
  }

  function saveMarker() {
    try {
      localStorage.setItem('afro_sw_mobile_bank_marker_v1', JSON.stringify({
        toolId: 'mobile-vs-bank',
        route: global.location.pathname,
        savedAt: new Date().toISOString(),
        storesFinancialDetails: false
      }));
      setStatus('Alama imehifadhiwa kwenye kifaa hiki bila kiasi, ada au jina la mtoa huduma.');
    } catch (_) {
      setStatus('Hifadhi ya ndani haipatikani kwenye kivinjari hiki.');
    }
  }

  form.addEventListener('input', clearStaleResult);
  form.addEventListener('change', clearStaleResult);
  form.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA' && event.target.tagName !== 'BUTTON') {
      event.preventDefault();
      form.requestSubmit();
    }
  });
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    clearStaleResult();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (typeof global.calcMB === 'function') global.calcMB();
    syncActions();
  });
  form.querySelector('[data-sw-copy-result]').addEventListener('click', copyResult);
  form.querySelector('[data-sw-download-result]').addEventListener('click', downloadResult);
  form.querySelector('[data-sw-save-marker]').addEventListener('click', saveMarker);
  if (global.MutationObserver && result) {
    new MutationObserver(syncActions).observe(result, { attributes: true, attributeFilter: ['class'] });
  }
  syncActions();
}(window));

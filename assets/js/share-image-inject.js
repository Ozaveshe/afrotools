(function () {
  'use strict';
  var COPY = {
    en: {button:'Share as image', pending:'Generating…', first:'Calculate first to create an image.', failed:'Could not generate the image. Try again.', unsupported:'This result cannot be shared as an image.', effective:'Effective tax rate', vat:'VAT', standard:'Standard', reduced:'Reduced', zero:'Zero-rated', exempt:'Exempt', net:'Net', total:'Total', gross:'Gross pay', grossMonthly:'Monthly gross', grossAnnual:'Annual gross', netMonthly:'Monthly take-home', netAnnual:'Annual take-home', netIncome:'Take-home', tax:'Tax', taxMonthly:'Monthly tax', taxAnnual:'Annual tax'},
    fr: {button:'Partager en image', pending:'Création de l’image…', first:'Effectuez un calcul pour créer une image.', failed:'Impossible de créer l’image. Réessayez.', unsupported:'Ce résultat ne peut pas être partagé en image.', effective:'Taux effectif d’imposition', vat:'TVA', standard:'Normal', reduced:'Réduit', zero:'Taux zéro', exempt:'Exonéré', net:'Hors taxe', total:'Total', gross:'Salaire brut', grossMonthly:'Salaire brut mensuel', grossAnnual:'Salaire brut annuel', netMonthly:'Salaire net mensuel', netAnnual:'Salaire net annuel', netIncome:'Salaire net', tax:'Impôt', taxMonthly:'Impôt mensuel', taxAnnual:'Impôt annuel'},
    sw: {button:'Shiriki kama picha', pending:'Inatengeneza picha…', first:'Kokotoa kwanza ili kutengeneza picha.', failed:'Picha haikuweza kutengenezwa. Jaribu tena.', unsupported:'Picha ya matokeo haya haipatikani.', effective:'Kiwango halisi cha kodi', vat:'VAT', standard:'Kawaida', reduced:'Kilichopunguzwa', zero:'Kiwango sifuri', exempt:'Msamaha', net:'Bila kodi', total:'Jumla', gross:'Mshahara ghafi', grossMonthly:'Mshahara ghafi wa mwezi', grossAnnual:'Mshahara ghafi wa mwaka', netMonthly:'Mshahara halisi wa mwezi', netAnnual:'Mshahara halisi wa mwaka', netIncome:'Mshahara halisi', tax:'Kodi', taxMonthly:'Kodi ya mwezi', taxAnnual:'Kodi ya mwaka'}
  };
  var ICON = '<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
  // The renderer URL needs its own revision because /assets/js is cached immutably.
  var CARD_REVISION = 'native-image-20261001';
  function locale() {
    var value = (document.documentElement.lang || location.pathname.split('/')[1] || 'en').toLowerCase().split('-')[0];
    return COPY[value] ? value : 'en';
  }
  // Choose actual present finite fields; zero is a valid result, not a fallback.
  function amount(result, names) {
    for (var i = 0; i < names.length; i++) {
      var value = result[names[i]];
      if ((typeof value === 'number' || (typeof value === 'string' && value.trim())) && Number.isFinite(Number(value))) return {key:names[i], value:Number(value)};
    }
    return null;
  }
  function toolId() {
    var meta = document.querySelector('meta[name="tool-id"]');
    return meta ? meta.content : window.TOOL_ID || location.pathname.replace(/\/$/, '').split('/').pop() || 'unknown';
  }
  function summary(result) {
    var lang = locale(), copy = COPY[lang], id = toolId();
    var heading = document.querySelector('h1'), title = heading ? (heading.innerText || heading.textContent).replace(/\s+/g, ' ').trim() : '';
    var prefix = document.querySelector('.f-prefix'), currency = prefix ? prefix.textContent.trim() : '';
    var format = typeof window.fmt === 'function' ? window.fmt : function (value) { return Math.round(value).toLocaleString(lang); };
    function money(value) {
      var formatted = String(format(value));
      return currency && !formatted.includes(currency) ? currency + ' ' + formatted : formatted;
    }
    var net = amount(result, ['netAmount']), vat = amount(result, ['vatAmount']), total = amount(result, ['totalInclusive']);
    if (net && vat && total) {
      var rate = amount(result, ['rate']);
      var labelMap = {Standard:copy.standard, Reduced:copy.reduced, 'Zero-rated':copy.zero, Exempt:copy.exempt};
      var label = labelMap[result.rateLabel] || result.rateLabel || '';
      var rateText = rate ? (rate.value * 100).toLocaleString(lang, {maximumFractionDigits:2}) + '%' : '';
      return {title:title || copy.vat, value:money(total.value), subtitle:[label, rateText, copy.vat].filter(Boolean).join(' · '), details:[copy.net + ': ' + money(net.value), copy.vat + ': ' + money(vat.value), copy.total + ': ' + money(total.value)].join(' | '), toolUrl:location.pathname, toolId:id};
    }
    var effective = amount(result, ['effectiveRate', 'effective_rate']);
    // A generic rate is only a tax rate when the result also has salary fields.
    var gross = amount(result, ['grossMonthly', 'grossAnnual', 'grossIncome', 'gross']);
    var takeHome = amount(result, ['netMonthly', 'net_monthly', 'netAnnual', 'netIncome']);
    if (!effective && gross && takeHome) effective = amount(result, ['rate']);
    if (!effective || !gross || !takeHome) return null;
    var tax = amount(result, ['taxMonthly', 'monthlyPAYE', 'taxAnnual', 'annualTax', 'tax']);
    var labels = {grossMonthly:copy.grossMonthly, grossAnnual:copy.grossAnnual, grossIncome:copy.gross, gross:copy.gross, netMonthly:copy.netMonthly, net_monthly:copy.netMonthly, netAnnual:copy.netAnnual, netIncome:copy.netIncome, taxMonthly:copy.taxMonthly, monthlyPAYE:copy.taxMonthly, taxAnnual:copy.taxAnnual, annualTax:copy.taxAnnual, tax:copy.tax};
    var details = [labels[gross.key] + ': ' + money(gross.value), labels[takeHome.key] + ': ' + money(takeHome.value)];
    if (tax) details.push(labels[tax.key] + ': ' + money(tax.value));
    var percent = typeof window.pct === 'function' ? window.pct : function (value) { return (value * 100).toLocaleString(lang, {minimumFractionDigits:1, maximumFractionDigits:1}) + '%'; };
    return {title:copy.effective, value:String(percent(effective.value)), subtitle:title, details:details.join(' | '), toolUrl:location.pathname, toolId:id};
  }
  var cardLoad;
  function loadCard() {
    if (window.AfroTools && window.AfroTools.resultCard) return Promise.resolve(window.AfroTools.resultCard);
    if (!cardLoad) cardLoad = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      var timer = setTimeout(function () { script.remove(); cardLoad = null; reject(new Error('Image module unavailable')); }, 10000);
      script.src = '/assets/js/result-card.js?v=' + CARD_REVISION;
      script.onload = function () { clearTimeout(timer); if (window.AfroTools && window.AfroTools.resultCard) resolve(window.AfroTools.resultCard); else { cardLoad = null; reject(new Error('Image module unavailable')); } };
      script.onerror = function () { clearTimeout(timer); script.remove(); cardLoad = null; reject(new Error('Image module unavailable')); };
      document.head.appendChild(script);
    });
    return cardLoad;
  }
  function notify(message, type) {
    if (window.AfroTools && window.AfroTools.toast) window.AfroTools.toast.show(message, type);
  }
  function mount() {
    var row = document.querySelector('.action-row');
    if (!row || row.querySelector('.act-share-image')) return;
    // This adapter understands tax/salary results only. Other apps own their exports.
    if (!/(?:^|[-/_.\s])(paye|vat|tva|salary|salaire|mshahara|kodi|tax)(?=$|[-/_.\s])/i.test(toolId() + ' ' + location.pathname) && !(window.RESULT && summary(window.RESULT))) return;
    var copy = COPY[locale()], button = document.createElement('button');
    button.type = 'button';
    button.className = 'act-btn act-share-image';
    function reset() { button.innerHTML = ICON; button.appendChild(document.createTextNode(' ' + copy.button)); button.disabled = false; button.removeAttribute('aria-busy'); }
    reset();
    button.style.cssText = 'background:#FFF8E8;border:1.5px solid #F0D990;color:#8a5c00;display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:9px 16px;border-radius:8px;font-size:.78rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;';
    button.onmouseover = function () { button.style.background = '#FEF3CD'; };
    button.onmouseout = function () { button.style.background = '#FFF8E8'; };
    button.addEventListener('click', async function () {
      if (!window.RESULT) { notify(copy.first, 'info'); return; }
      var data = summary(window.RESULT);
      if (!data) { notify(copy.unsupported, 'info'); return; }
      button.disabled = true; button.textContent = copy.pending; button.setAttribute('aria-busy', 'true');
      var timer;
      try {
        var card = await loadCard();
        await Promise.race([card.generateAndShare(data), new Promise(function (_, reject) { timer = setTimeout(function () { reject(new Error('Image generation timed out')); }, 30000); })]);
      } catch (_) { notify(copy.failed, 'error'); }
      finally { clearTimeout(timer); reset(); }
    });
    row.appendChild(button);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  setTimeout(mount, 1000);
})();

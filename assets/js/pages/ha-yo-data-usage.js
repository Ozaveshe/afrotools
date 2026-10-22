(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.dataUsage = api;
    api.mount(root.document);
  }
})(typeof window === 'undefined' ? null : window, function () {
  'use strict';
  var copy = {
    ha: {
      range: 'Saka 0–{max}; karin 0.5 awa.',
      required: 'Saka sa’o’i, ko 0.',
      stale: 'Bayanai sun sauya. Sake lissafawa don samun sabon sakamako.',
      reset: 'An mayar da misalin farko. Lissafa don ganin sakamako.',
      result: 'Kiyasin wata (+15%).',
      copied: 'An kwafi sakamakon.',
      copyFailed: 'Ba a iya kwafi ba. Yi amfani da sauke TXT.',
      downloaded: 'An shirya fayil din TXT.',
      downloadFailed: 'Ba a iya shirya fayil ba. Sake gwadawa.',
      report: 'Kiyasin amfani da intanet a wata',
      units: 'Lilo/rana; bidiyo/rana; kiran bidiyo/mako; karatu ko aiki/rana',
      assumptions: 'Kiyasin kwanaki 30 da makonni 4; karin 15%; an zagaye GB zuwa sama.'
    },
    yo: {
      range: 'Tẹ 0–{max}; ìgbésẹ̀ 0.5 wákàtí.',
      required: 'Tẹ wákàtí tàbí 0.',
      stale: 'Àwọn iye ti yí padà. Ṣe ìṣirò lẹ́ẹ̀kan sí i fún àbájáde tuntun.',
      reset: 'A ti dá àpẹẹrẹ àkọ́kọ́ padà. Ṣe ìṣirò láti rí àbájáde.',
      result: 'Fún oṣù kan (+15%).',
      report: 'Àfiyèsí ìlò dátà fún oṣù kan',
      units: 'Wẹẹbu/ọjọ́; fidio/ọjọ́; ìpè fidio/ọ̀sẹ̀; ẹ̀kọ́ tàbí iṣẹ́/ọjọ́; àwùjọ/ọjọ́',
      assumptions: 'Àfiyèsí ọjọ́ 30 àti ọ̀sẹ̀ 4; àfikún 15%; a yí GB sókè.'
    }
  };
  function fields(locale) {
    if (!copy[locale]) throw new Error('Unsupported data-usage locale');
    return locale === 'yo' ? ['browse', 'video', 'calls', 'study', 'social'] : ['browse', 'video', 'calls', 'study'];
  }
  function validate(values, locale) {
    return fields(locale).reduce(function (errors, key) {
      var raw = values[key], maximum = key === 'calls' ? 168 : 24;
      var missing = raw == null || String(raw).trim() === '';
      var number = Number(raw);
      if (missing || !Number.isFinite(number) || number < 0 || number > maximum || !Number.isInteger(number * 2)) {
        errors.push({ field: key, message: missing ? copy[locale].required : copy[locale].range.replace('{max}', maximum) });
      }
      return errors;
    }, []);
  }
  // Existing locale estimate coefficients and rounding are retained exactly.
  // This limited estimate is separate from the English activity/plan catalogue.
  function estimate(values, locale) {
    if (validate(values, locale).length) throw new RangeError('Invalid activity hours');
    var gb = Number(values.browse) * 0.08 * 30 + Number(values.video) * 0.9 * 30 +
      Number(values.calls) * 0.7 * 4 + Number(values.study) * 0.15 * 30;
    if (locale === 'yo') gb += Number(values.social) * 0.12 * 30;
    return Math.ceil(gb * 1.15);
  }
  function report(values, locale, result) {
    var text = copy[locale];
    return text.report + ': ' + result + ' GB\n' + text.units + '\n' +
      fields(locale).map(function (key) { return String(Number(values[key])); }).join('; ') + '\n' +
      text.assumptions + '\n';
  }
  function mount(doc) {
    doc.querySelectorAll('[data-data-usage]').forEach(function (form) {
      if (form.dataset.ready) return;
      form.dataset.ready = 'true';
      var locale = form.dataset.dataUsage, text = copy[locale], view = doc.defaultView;
      var keys = fields(locale), result = form.querySelector('[data-usage-result]');
      var status = form.querySelector('[data-usage-status]'), lastText = '';
      function reveal(target, extra) {
        // Read existing overlay geometry; never hide, dismiss or restyle it.
        var top = 72, bottom = view.innerHeight - 12;
        ['afro-cookie-consent', 'afro-pwa-banner'].forEach(function (id) {
          var banner = doc.getElementById(id);
          if (!banner) return;
          var box = banner.getBoundingClientRect();
          if (box.height && box.width && box.top >= 0) bottom = Math.min(bottom, box.top - 12);
        });
        var box = target.getBoundingClientRect(), last = extra ? extra.getBoundingClientRect() : box;
        var center = (Math.min(box.top, last.top) + Math.max(box.bottom, last.bottom)) / 2;
        view.scrollBy({ top: center - (top + Math.max(top + 80, bottom)) / 2, behavior: 'instant' });
      }
      function clearErrors() {
        keys.forEach(function (key) {
          form.elements[key].removeAttribute('aria-invalid');
          form.querySelector('[data-error="' + key + '"]').textContent = '';
        });
      }
      function clearResult() { lastText = ''; result.hidden = true; result.textContent = ''; }
      function calculate() {
        clearErrors(); clearResult(); status.textContent = '';
        var values = {};
        keys.forEach(function (key) { values[key] = form.elements[key].value; });
        var errors = validate(values, locale);
        errors.forEach(function (error) {
          form.elements[error.field].setAttribute('aria-invalid', 'true');
          form.querySelector('[data-error="' + error.field + '"]').textContent = error.message;
        });
        if (errors.length) {
          var first = form.elements[errors[0].field];
          first.focus({ preventScroll: true });
          reveal(first, form.querySelector('[data-error="' + errors[0].field + '"]'));
          return false;
        }
        var amount = estimate(values, locale), strong = doc.createElement('strong'), explanation = doc.createElement('p');
        strong.textContent = amount + ' GB'; explanation.textContent = text.result;
        result.append(strong, explanation); result.hidden = false;
        lastText = report(values, locale, amount);
        result.focus({ preventScroll: true });
        reveal(result);
        return true;
      }
      form.addEventListener('submit', function (event) { event.preventDefault(); calculate(); });
      form.addEventListener('input', function () {
        var stale = Boolean(lastText); clearErrors(); clearResult();
        status.textContent = stale ? text.stale : '';
      });
      form.addEventListener('reset', function () {
        clearErrors(); clearResult(); status.textContent = text.reset;
        form.elements[keys[0]].focus({ preventScroll: true });
        reveal(form.elements[keys[0]].parentElement);
      });
      var copyButton = form.querySelector('[data-usage-copy]');
      if (copyButton) copyButton.addEventListener('click', function () {
        if (!calculate()) return;
        if (!view.navigator.clipboard || !view.navigator.clipboard.writeText) { status.textContent = text.copyFailed; return; }
        view.navigator.clipboard.writeText(lastText).then(function () { status.textContent = text.copied; })
          .catch(function () { status.textContent = text.copyFailed; });
      });
      var download = form.querySelector('[data-usage-download]');
      if (download) download.addEventListener('click', function () {
        if (!calculate()) return;
        var url, anchor;
        try {
          url = view.URL.createObjectURL(new view.Blob([lastText], { type: 'text/plain;charset=utf-8' }));
          anchor = doc.createElement('a'); anchor.href = url; anchor.download = 'kiyasin-amfanin-intanet.txt';
          doc.body.appendChild(anchor); anchor.click(); status.textContent = text.downloaded;
        } catch (_) { status.textContent = text.downloadFailed; }
        finally { if (anchor) anchor.remove(); if (url) view.setTimeout(function () { view.URL.revokeObjectURL(url); }, 1000); }
      });
    });
  }
  return { estimate: estimate, validate: validate, report: report, mount: mount };
});

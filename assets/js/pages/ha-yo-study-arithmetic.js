(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.studyArithmetic = api;
    api.mount(root.document);
  }
})(typeof window === 'undefined' ? null : window, function () {
  'use strict';
  var grades = Object.freeze({ A1: 1, B2: 2, B3: 3, C4: 4, C5: 5, C6: 6, D7: 7, E8: 8, F9: 9 });
  var defaults = ['Èdè Gẹẹsi', 'Ìṣirò', 'Biology', 'Chemistry', 'Physics', 'Economics', 'Government', 'Literature', 'Agric'];
  var gpaKeys = ['points', 'units', 'oldPoints', 'oldUnits'];
  function validateGpa(values) {
    var errors = gpaKeys.reduce(function (errors, key) {
      var raw = values[key], number = Number(raw), unit = key === 'units' || key === 'oldUnits';
      if (raw == null || String(raw).trim() === '' || !Number.isFinite(number) || number < 0 ||
          (unit && !Number.isInteger(number)) || (key === 'units' && number === 0)) {
        errors.push({ field: key, message: unit ? (key === 'units' ? 'Saka raka’a 1 ko fiye.' : 'Saka cikakkun raka’o’i, ko 0.') : 'Saka maki 0 ko fiye.' });
      }
      return errors;
    }, []);
    if (!errors.some(function (error) { return error.field === 'oldPoints' || error.field === 'oldUnits'; }) &&
        Number(values.oldPoints) > 0 && Number(values.oldUnits) === 0) {
      errors.push({ field: 'oldUnits', message: 'Saka raka’o’i don makin baya.' });
    }
    return errors;
  }
  function gpa(values) {
    if (validateGpa(values).length) throw new RangeError('Invalid totals');
    var p = Number(values.points), u = Number(values.units), op = Number(values.oldPoints), ou = Number(values.oldUnits);
    // The existing weighted totals division and two-decimal presentation are retained.
    var current = p / u, combined = (p + op) / (u + ou);
    if (![current, combined, p + op, u + ou].every(Number.isFinite)) throw new RangeError('Totals too large');
    return { current: current.toFixed(2), combined: combined.toFixed(2) };
  }
  function validateWaec(entries) {
    if (!Array.isArray(entries) || entries.length !== 9) throw new RangeError('Nine subjects required');
    return entries.reduce(function (errors, entry, index) {
      var name = entry && String(entry.name || '').trim();
      if (index < 2 && name !== defaults[index]) errors.push({ field: 'subject-' + index, message: 'Kókó yìí jẹ́ ' + defaults[index] + '.' });
      else if (!name) errors.push({ field: 'subject-' + index, message: 'Tẹ orúkọ kókó.' });
      if (!entry || !Object.prototype.hasOwnProperty.call(grades, entry.grade)) errors.push({ field: 'grade-' + index, message: 'Yan A1 sí F9.' });
      return errors;
    }, []);
  }
  function waec(entries) {
    if (validateWaec(entries).length) throw new RangeError('Invalid subjects');
    var rows = entries.map(function (entry) { return { name: entry.name.trim(), grade: entry.grade, point: grades[entry.grade] }; });
    var best = rows.slice().sort(function (a, b) { return a.point - b.point; }).slice(0, 5);
    var total = best.reduce(function (sum, row) { return sum + row.point; }, 0);
    return { total: total, credits: rows.filter(function (row) { return row.point <= 6; }).length,
      coreOk: rows.slice(0, 2).every(function (row) { return row.point <= 6; }), best: best,
      tone: total <= 15 ? 'Dára gan' : total <= 25 ? 'Ó dára' : 'Ṣàyẹ̀wò lẹ́ẹ̀kansi' };
  }
  function report(entries, result) {
    if (validateWaec(entries).length) throw new RangeError('Invalid subjects');
    return ['AfroTools — WAEC/NECO', 'Àpapọ̀ márùn-ún: ' + result.total, 'Kírẹ́dítì C6+: ' + result.credits + '/9',
      'Gẹẹsi/Ìṣirò: ' + (result.coreOk ? 'Wọ́n ní kírẹ́dítì' : 'Ṣàyẹ̀wò wọn'), 'Ìpele: ' + result.tone,
      'Àwọn kókó márùn-ún: ' + result.best.map(function (row) { return row.name + ' ' + row.grade; }).join(', '), '',
      'Àwọn grẹ́ẹ̀dì:', entries.map(function (row) { return row.name.trim() + ': ' + row.grade; }).join('\n'), '',
      'Àfiyèsí fún ètò ẹ̀kọ́; kì í ṣe àyẹ̀wò èsì òfìsì tàbí ìpinnu ìgbàwọlé.',
      'Jẹ́rìí èsì àti ìlànà pẹ̀lú ẹgbẹ́ ìdánwò àti ilé-ẹ̀kọ́ rẹ.',
      'A ṣe àkópọ̀ yìí lórí ẹ̀rọ rẹ. /yo/awon-ise/kalkuletan-waec-neco/'].join('\n') + '\n';
  }
  function mount(doc) {
    doc.querySelectorAll('[data-study-arithmetic]').forEach(function (form) {
      if (form.dataset.studyReady) return;
      form.dataset.studyReady = 'true';
      var isGpa = form.dataset.studyArithmetic === 'gpa', view = doc.defaultView;
      var result = form.querySelector('[data-study-result]'), detail = form.querySelector('[data-study-detail]');
      var status = form.querySelector('[data-study-status]'), lastReport = '', hasResult = false;
      function node(tag, text) { var element = doc.createElement(tag); element.textContent = text; return element; }
      if (!isGpa) defaults.forEach(function (name, index) {
        var row = node('div', ''); row.className = 'study-subject';
        [['subject-', 'Orúkọ kókó ', 'input'], ['grade-', 'Grẹ́ẹ̀dì kókó ', 'select']].forEach(function (part) {
          var field = node('div', ''), id = part[0] + index, label = node('label', part[1] + (index + 1));
          label.htmlFor = id;
          if (index < 2) label.textContent = part[2] === 'input' ? name + ' (kókó ' + (index + 1) + ')' : 'Grẹ́ẹ̀dì — ' + name;
          var input = doc.createElement(part[2]); input.id = id; input.name = id;
          input.setAttribute('aria-describedby', id + '-error');
          if (part[2] === 'input') { input.type = 'text'; input.value = name; input.defaultValue = name; input.autocomplete = 'off'; input.readOnly = index < 2; }
          else Object.keys(grades).forEach(function (grade, i) { var option = node('option', grade + ' (' + grades[grade] + ')'); option.value = grade; option.defaultSelected = i === 0; input.appendChild(option); });
          var error = node('p', ''); error.id = id + '-error'; error.dataset.studyError = id; error.className = 'study-error'; error.setAttribute('aria-live', 'polite');
          field.append(label, input, error); row.appendChild(field);
        });
        form.querySelector('#subjects').appendChild(row);
      });
      var controls = Array.prototype.slice.call(form.querySelectorAll('input,select'));
      function reveal(target, extra) {
        // Read existing first-visit overlays without hiding, dismissing or changing them.
        var top = 72, bottom = view.innerHeight - 12;
        ['afro-cookie-consent', 'afro-pwa-banner'].forEach(function (id) {
          var banner = doc.getElementById(id); if (!banner) return;
          var box = banner.getBoundingClientRect();
          if (box.height && box.width && box.top >= 0) bottom = Math.min(bottom, box.top - 12);
        });
        var first = target.getBoundingClientRect(), last = extra ? extra.getBoundingClientRect() : first;
        view.scrollBy({ top: (Math.min(first.top, last.top) + Math.max(first.bottom, last.bottom)) / 2 - (top + Math.max(top + 80, bottom)) / 2, behavior: 'instant' });
      }
      function clearErrors() {
        controls.forEach(function (control) { control.removeAttribute('aria-invalid'); });
        form.querySelectorAll('[data-study-error]').forEach(function (error) { error.textContent = ''; });
      }
      function clearResult() { hasResult = false; lastReport = ''; result.hidden = true; result.textContent = ''; if (detail) { detail.hidden = true; detail.textContent = ''; } }
      if (!isGpa) form.addEventListener('focusin', function (event) {
        var control = event.target;
        if (!/^(subject|grade)-[01]$/.test(control.id)) return;
        view.requestAnimationFrame(function () {
          if (doc.activeElement === control) reveal(control.parentElement);
        });
      });
      function calculate() {
        clearErrors(); clearResult(); status.textContent = '';
        var values = {}, entries;
        controls.forEach(function (control) { values[control.name] = control.value; });
        if (!isGpa) entries = defaults.map(function (_, index) { return { name: values['subject-' + index], grade: values['grade-' + index] }; });
        var errors = isGpa ? validateGpa(values) : validateWaec(entries), outcome;
        if (!errors.length) {
          try { outcome = isGpa ? gpa(values) : waec(entries); }
          catch (_) { errors.push({ field: 'points', message: 'Makin sun yi yawa. Rage su.' }); }
        }
        errors.forEach(function (error) {
          form.elements[error.field].setAttribute('aria-invalid', 'true');
          form.querySelector('[data-study-error="' + error.field + '"]').textContent = error.message;
        });
        if (errors.length) {
          var first = form.elements[errors[0].field]; first.focus({ preventScroll: true });
          reveal(first, form.querySelector('[data-study-error="' + errors[0].field + '"]')); return false;
        }
        if (isGpa) {
          result.append(node('strong', 'GPA: ' + outcome.current), node('p', 'CGPA: ' + outcome.combined));
        } else {
          result.append(node('strong', 'Àpapọ̀ márùn-ún: ' + outcome.total), node('p', 'Kírẹ́dítì C6+: ' + outcome.credits + '/9'), node('p', 'Gẹẹsi/Ìṣirò: ' + (outcome.coreOk ? 'Wọ́n ní kírẹ́dítì' : 'Ṣàyẹ̀wò wọn')));
          detail.append(node('p', 'Ìpele: ' + outcome.tone), node('p', 'Àwọn kókó márùn-ún: ' + outcome.best.map(function (row) { return row.name + ' ' + row.grade; }).join(', ')));
          detail.hidden = false; lastReport = report(entries, outcome);
        }
        hasResult = true; result.hidden = false; result.focus({ preventScroll: true }); reveal(result); return true;
      }
      function edited() { var stale = hasResult; clearErrors(); clearResult(); status.textContent = stale ? (isGpa ? 'Bayanai sun sauya. Sake lissafawa.' : 'Àwọn iye ti yí padà. Ṣe ìṣirò lẹ́ẹ̀kan sí i.') : ''; }
      form.addEventListener('submit', function (event) { event.preventDefault(); calculate(); });
      form.addEventListener('input', edited); form.addEventListener('change', edited);
      form.addEventListener('reset', function () {
        clearErrors(); clearResult(); status.textContent = isGpa ? 'An mayar da misalin farko.' : 'A ti dá àpẹẹrẹ àkọ́kọ́ padà.';
        controls[0].focus({ preventScroll: true }); reveal(controls[0].parentElement);
      });
      var download = form.querySelector('[data-education-download]'), copy = form.querySelector('[data-education-copy]');
      if (download) download.addEventListener('click', function () {
        if (!calculate()) return;
        var url, anchor;
        try {
          url = view.URL.createObjectURL(new view.Blob([lastReport], { type: 'text/plain;charset=utf-8' }));
          anchor = doc.createElement('a'); anchor.href = url; anchor.download = 'afrotools-waec-neco-calculator.txt';
          doc.body.appendChild(anchor); anchor.click(); status.textContent = 'A ti pèsè fáìlì TXT.';
        } catch (_) { status.textContent = 'A kò lè pèsè fáìlì. Gbìyànjú lẹ́ẹ̀kan sí i.'; }
        finally { if (anchor) anchor.remove(); if (url) view.setTimeout(function () { view.URL.revokeObjectURL(url); }, 1000); }
      });
      if (copy) copy.addEventListener('click', function () {
        if (!calculate()) return;
        var text = lastReport;
        function failed() { status.textContent = 'A kò lè dà á kọ́. Lo fáìlì TXT.'; }
        if (!view.navigator.clipboard || !view.navigator.clipboard.writeText) { failed(); return; }
        view.navigator.clipboard.writeText(text).then(function () { status.textContent = 'A ti dà àbájáde kọ́.'; }).catch(failed);
      });
    });
  }
  return { gpa: gpa, validateGpa: validateGpa, waec: waec, validateWaec: validateWaec, report: report, mount: mount };
});

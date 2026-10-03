(function (window, document) {
  'use strict';

  var BETTING_TOOLS = ['betting-odds', 'betting-tax'];
  var afconCopyAttempt = 0;
  var afconInputsPending = false;

  var AFCON_RANGE_FIELDS = ['formBoost', 'defenseBoost', 'hostBoost', 'upsetTolerance'];

  function bindAfconRanges(form) {
    if (!form || form.hasAttribute('data-afcon-ranges-bound')) return;
    form.setAttribute('data-afcon-ranges-bound', '');
    AFCON_RANGE_FIELDS.forEach(function (name) {
      var field = form.elements[name];
      if (!field) return;
      field.min = '0';
      field.max = '10';
      field.step = 'any';
      field.required = true;
    });
    var status = document.createElement('p');
    status.id = 'afcon-input-status';
    status.setAttribute('data-afcon-input-status', '');
    status.setAttribute('role', 'alert');
    status.hidden = true;
    form.insertBefore(status, form.querySelector('.sports-actions'));
  }

  function afconRangeError(form) {
    var first = null;
    AFCON_RANGE_FIELDS.forEach(function (name) {
      var field = form.elements[name];
      if (!field) return;
      var value = Number(field.value);
      var invalid = field.value.trim() === '' || !isFinite(value) || value < 0 || value > 10;
      var label = form.querySelector('label[for="' + field.id + '"]');
      var message = invalid ? 'Enter a value from 0 to 10 for ' + (label ? label.textContent : name) + '.' : '';
      field.setCustomValidity(message);
      var describedBy = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (id) {
        return id && id !== 'afcon-input-status';
      });
      if (invalid) {
        field.setAttribute('aria-invalid', 'true');
        describedBy.push('afcon-input-status');
        if (!first) first = { field: field, message: message };
      } else field.removeAttribute('aria-invalid');
      if (describedBy.length) field.setAttribute('aria-describedby', describedBy.join(' '));
      else field.removeAttribute('aria-describedby');
    });
    return first;
  }

  function afconInputStatus(message) {
    var status = document.querySelector('[data-afcon-input-status]');
    if (!status) return;
    status.textContent = message;
    status.hidden = !message;
  }

  function clearAfconInvalidResult() {
    afconInputsPending = true;
    invalidateAfconCopy();
    var results = document.getElementById('sports-results');
    if (results) {
      results.hidden = true;
      results.textContent = '';
    }
  }

  ['input', 'change', 'submit'].forEach(function (type) {
    document.addEventListener(type, function (event) {
      if (toolId() !== 'afcon-predictor') return;
      var form = event.target.closest('#sports-tool-form');
      if (!form) return;
      bindAfconRanges(form);
      var error = afconRangeError(form);
      if (error) {
        clearAfconInvalidResult();
        afconInputStatus(error.message);
        if (type !== 'input') {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
        if (type === 'submit') {
          error.field.focus();
          error.field.reportValidity();
        }
      } else if (type !== 'input') {
        afconInputsPending = false;
        afconInputStatus('');
        var results = document.getElementById('sports-results');
        if (results) results.hidden = false;
      } else if (afconInputsPending) afconInputStatus('Use Calculate to update your report.');
    }, true);
  });

  document.addEventListener('click', function (event) {
    if (toolId() !== 'afcon-predictor' || !event.target.closest('[data-reset]')) return;
    var form = document.getElementById('sports-tool-form');
    if (form) AFCON_RANGE_FIELDS.forEach(function (name) {
      var field = form.elements[name];
      if (!field) return;
      field.setCustomValidity('');
      field.removeAttribute('aria-invalid');
      var ids = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (id) {
        return id && id !== 'afcon-input-status';
      });
      if (ids.length) field.setAttribute('aria-describedby', ids.join(' '));
      else field.removeAttribute('aria-describedby');
    });
    afconInputsPending = false;
    afconInputStatus('');
    var results = document.getElementById('sports-results');
    if (results) results.hidden = false;
  }, true);

  function toolId() {
    return (document.body && document.body.getAttribute('data-sports-tool')) || '';
  }

  function replaceText(root, from, to) {
    var walker = document.createTreeWalker(root, window.NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && node.nodeValue.indexOf(from) !== -1) {
        node.nodeValue = node.nodeValue.split(from).join(to);
      }
    }
  }

  function addBoundary(root, id) {
    if (root.querySelector('[data-day9-sports-boundary]')) return;
    var boundary = document.createElement('aside');
    boundary.className = 'sports-source-card';
    boundary.setAttribute('data-day9-sports-boundary', '');
    boundary.setAttribute('aria-label', 'Planning and source boundary');
    boundary.innerHTML = BETTING_TOOLS.indexOf(id) !== -1
      ? '<h3>Odds literacy, not betting advice</h3>'
        + '<p>This calculator uses only values you enter. It does not fetch live odds, scores or outcomes, identify a winning bet, or make loss recovery safe. Adults only: set a firm loss limit, never borrow to wager, and never chase losses. Tax and operator rules require a current source check.</p>'
      : '<h3>User-entered planning scenario</h3>'
        + '<p>This calculator does not fetch live scores, entrants, prices, earnings, availability or outcomes. Replace every default with figures you can verify and confirm changing facts with the relevant organiser, platform, federation, school or supplier.</p>';
    root.insertBefore(boundary, root.firstChild);
  }

  function makeExportsLocal(root) {
    var gate = root.querySelector('[data-sports-report-gate]');
    if (!gate || gate.getAttribute('data-day9-local-report') === 'true') return;
    gate.setAttribute('data-day9-local-report', 'true');
    var heading = gate.querySelector('h3');
    var intro = gate.querySelector('p');
    var leadForm = gate.querySelector('.sports-lead-form');
    var actions = gate.querySelector('.sports-report-actions');
    var preview = gate.querySelector('[data-report-preview]');
    var note = gate.querySelector('.sports-dashboard-note');

    if (heading) heading.textContent = 'Local report actions';
    if (intro) {
      intro.textContent = 'Print or copy this result in your browser without an email, account or network submission.';
    }
    if (leadForm) leadForm.remove();
    if (actions) {
      actions.hidden = false;
      var save = actions.querySelector('[data-save-report]');
      var dashboard = actions.querySelector('a[href="/dashboard/"]');
      if (save) save.remove();
      if (dashboard) dashboard.remove();
      if (!actions.querySelector('[data-copy-local-report]')) {
        var copy = document.createElement('button');
        copy.type = 'button';
        copy.className = 'sports-btn secondary';
        copy.setAttribute('data-copy-local-report', '');
        copy.textContent = 'Copy local report';
        actions.insertBefore(copy, actions.children[1] || null);
      }
    }
    if (preview) {
      preview.hidden = false;
      preview.setAttribute('tabindex', '0');
      if (toolId() === 'afcon-predictor') {
        preview.classList.add('on');
        preview.setAttribute('aria-label', 'Local report text for manual copying');
        var status = document.createElement('p');
        status.setAttribute('data-afcon-report-status', '');
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        gate.insertBefore(status, preview);
      }
    }
    if (note) {
      note.textContent = 'Nothing is stored or sent by calculating, printing or copying. Use the separate save features only when you intentionally want device or account storage.';
    }
  }

  function apply() {
    var root = document.getElementById('sports-tool-root');
    if (!root) return;
    if (!document.getElementById('day9-sports-reflow')) {
      var style = document.createElement('style');
      style.id = 'day9-sports-reflow';
      style.textContent = 'html,body{max-width:100%;overflow-x:clip}'
        + '#sports-tool-root,#sports-tool-root *{min-width:0}'
        + '#sports-tool-root .sports-panel-kicker,#sports-tool-root span{white-space:normal;overflow-wrap:anywhere}'
        + '#sports-tool-root table{max-width:100%}'
        + '#sports-tool-root .sports-table-wrap{display:block;max-width:100%;overflow-x:auto}'
        + 'body[data-sports-tool="afcon-predictor"] .sports-report-preview{background:var(--color-bg-card);color:var(--color-text)}'
        + 'body[data-sports-tool="afcon-predictor"] [data-afcon-report-status]{color:var(--color-text);font-size:1rem;line-height:1.5;min-height:1.5em}'
        + 'body[data-sports-tool="afcon-predictor"] [data-afcon-input-status]{color:var(--color-text);font-size:1rem;line-height:1.5}';
      document.head.appendChild(style);
    }
    var id = toolId();
    var results = root.querySelector('#sports-results');
    if (id === 'afcon-predictor') {
      bindAfconRanges(document.getElementById('sports-tool-form'));
      var badge = root.querySelector('.sports-status');
      if (badge) replaceText(badge, 'Live calculator', 'Local planning calculator');
      if (afconInputsPending) return;
      if (results) replaceText(results,
        'Competitor tournament tools usually stop at a bracket. This version gives a reusable content angle: favorite rank, field pressure, and likely final path.',
        "Compare your team's rank with the strongest contenders and the suggested final pairing.");
    }
    if (results) {
      results.setAttribute('role', 'status');
      results.setAttribute('aria-live', 'polite');
      addBoundary(results, id);
      makeExportsLocal(results);
      replaceText(results, 'The bet can make sense if that estimate is honest.',
        'A positive mathematical edge depends entirely on the probability estimate and does not predict a win.');
      replaceText(results, 'Live calculator', 'Local planning calculator');
    }
    replaceText(root, 'Betting decision path', 'Odds literacy path');
    replaceText(root, 'Save a report, then continue the path.',
      'Calculate locally, verify assumptions, then continue only if the next tool is useful.');
  }

  function invalidateAfconCopy() {
    afconCopyAttempt += 1;
    var status = document.querySelector('[data-afcon-report-status]');
    if (status) status.textContent = '';
  }

  function copyAfconReport(button) {
    var preview = document.querySelector('[data-report-preview]');
    var status = document.querySelector('[data-afcon-report-status]');
    var text = preview ? preview.textContent : '';
    var attempt = ++afconCopyAttempt;
    if (!text || !status) return;
    function current() {
      return attempt === afconCopyAttempt && toolId() === 'afcon-predictor'
        && button.isConnected && preview.isConnected && status.isConnected
        && preview.textContent === text;
    }
    function unavailable() {
      if (current()) status.textContent = 'Copy is unavailable. Select the report below and copy it manually, or use Print / save PDF.';
    }
    try {
      var clipboard = window.navigator.clipboard;
      if (!clipboard || typeof clipboard.writeText !== 'function') {
        unavailable();
        return;
      }
      status.textContent = 'Copying report…';
      Promise.resolve(clipboard.writeText(text)).then(function () {
        if (current()) status.textContent = 'Report copied locally.';
      }, unavailable);
    } catch (error) {
      unavailable();
    }
  }

  ['input', 'change', 'submit'].forEach(function (type) {
    document.addEventListener(type, function (event) {
      if (toolId() === 'afcon-predictor' && event.target.closest('#sports-tool-form')) invalidateAfconCopy();
    });
  });
  window.addEventListener('pagehide', invalidateAfconCopy);

  document.addEventListener('click', function (event) {
    if (toolId() === 'afcon-predictor' && event.target.closest('[data-reset]')) invalidateAfconCopy();
    var button = event.target.closest('[data-copy-local-report]');
    if (!button) return;
    if (toolId() === 'afcon-predictor') {
      copyAfconReport(button);
      return;
    }
    var preview = document.querySelector('[data-report-preview]');
    var text = preview ? preview.textContent : '';
    var status = document.querySelector('.sports-lead-msg');
    if (!text) return;
    Promise.resolve(window.navigator.clipboard && window.navigator.clipboard.writeText
      ? window.navigator.clipboard.writeText(text)
      : null).then(function () {
      if (status) status.textContent = 'Report copied locally.';
    }).catch(function () {
      if (status) status.textContent = 'Copy was blocked. Select the report text and copy it manually.';
    });
  });

  var observer = new MutationObserver(apply);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
}(window, document));

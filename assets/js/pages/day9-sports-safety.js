(function (window, document) {
  'use strict';

  var BETTING_TOOLS = ['betting-odds', 'betting-tax'];

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
        + '#sports-tool-root .sports-table-wrap{display:block;max-width:100%;overflow-x:auto}';
      document.head.appendChild(style);
    }
    var id = toolId();
    var results = root.querySelector('#sports-results');
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

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-copy-local-report]');
    if (!button) return;
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

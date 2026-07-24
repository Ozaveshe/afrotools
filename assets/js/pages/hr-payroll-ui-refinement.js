(function () {
  'use strict';

  var toolConfigs = {
    '/tools/contractor-vs-employee/': {
      key: 'contractor',
      directoryIntro: 'Choose where the work happens to open the matching classification and statutory-cost context.',
      emptyTitle: 'Your cost comparison will appear here',
      emptyCopy: 'Enter both monthly cost paths, then compare. Cost is kept separate from worker classification.'
    },
    '/tools/domestic-worker/': {
      key: 'domestic',
      directoryIntro: 'Choose the worker location to review the matching household-payroll route and local verification checklist.'
    },
    '/tools/employee-cost/': {
      key: 'employee',
      directoryIntro: 'Choose the employee location to open the matching employer-cost route and statutory verification context.',
      emptyTitle: 'Your employee-cost brief will appear here',
      emptyCopy: 'Add current salary, recurring costs, hiring costs, and dated source evidence to build a reviewable budget.'
    },
    '/tools/gratuity-calculator/': {
      key: 'gratuity',
      directoryIntro: 'Choose the employment location to open the matching final-pay route and local rule-verification context.',
      emptyTitle: 'Your final-pay estimate will appear here',
      emptyCopy: 'Enter the verified gratuity rule, service period, additions, and deductions to reconcile the settlement.'
    },
    '/tools/maternity-leave/': {
      key: 'maternity',
      directoryIntro: 'Choose the employee location to open the matching parental-leave route and official-rule checklist.',
      emptyTitle: 'Your leave comparison will appear here',
      emptyCopy: 'Select a country and enter verified leave, pay, and employer-policy values to compare the scenarios.'
    },
    '/tools/retrenchment-calculator/': {
      key: 'retrenchment',
      directoryIntro: 'Choose the employment location to open the matching restructuring route and procedural review context.',
      emptyTitle: 'Your package estimate will appear here',
      emptyCopy: 'Enter pay, service, verified severance rules, leave, and adjustments to build the package.'
    }
  };

  var resultSelectors = {
    contractor: '#contractor-comparison-result',
    employee: '#employee-cost-result',
    gratuity: '#gratuity-result',
    maternity: '#leaveResults',
    retrenchment: '#retrenchment-result'
  };

  function normalizePath(path) {
    return path.replace(/\/index\.html$/, '/').replace(/\/+$/, '/') || '/';
  }

  function createEmptyState(config) {
    var selector = resultSelectors[config.key];
    var result = selector ? document.querySelector(selector) : null;
    if (!result || !config.emptyTitle || result.previousElementSibling && result.previousElementSibling.classList.contains('hr-result-placeholder')) return;

    var placeholder = document.createElement('div');
    placeholder.className = 'hr-result-placeholder';
    placeholder.setAttribute('role', 'note');
    placeholder.innerHTML =
      '<span class="hr-result-placeholder__mark" aria-hidden="true">01</span>' +
      '<div><strong></strong><p></p></div>';
    placeholder.querySelector('strong').textContent = config.emptyTitle;
    placeholder.querySelector('p').textContent = config.emptyCopy;
    result.parentNode.insertBefore(placeholder, result);

    function sync() {
      var hasResult = result.hidden === false && result.textContent.trim().length > 0;
      if (config.key === 'maternity') hasResult = result.children.length > 0;
      placeholder.hidden = hasResult;
    }

    sync();
    new MutationObserver(sync).observe(result, { attributes: true, childList: true, subtree: true });
  }

  function enhanceCountryDirectory(config) {
    var hub = document.querySelector('.hr-hub');
    var grid = hub && hub.querySelector('.hr-hub-country-grid');
    var heading = hub && hub.querySelector('h2');
    if (!hub || !grid || !heading || hub.querySelector('.hr-country-directory__controls')) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll('.hr-country-card'));
    if (!cards.length) return;

    heading.textContent = 'Find your country route';

    var intro = document.createElement('p');
    intro.className = 'hr-country-directory__intro';
    intro.textContent = config.directoryIntro;
    heading.insertAdjacentElement('afterend', intro);

    var controls = document.createElement('div');
    controls.className = 'hr-country-directory__controls';
    controls.innerHTML =
      '<label><span class="sr-only">Search country routes</span><input class="hr-country-directory__search" type="search" autocomplete="off" placeholder="Search country"></label>' +
      '<button class="hr-country-directory__toggle" type="button" aria-expanded="false">Show all countries</button>' +
      '<p class="hr-country-directory__status" role="status" aria-live="polite"></p>';
    grid.insertAdjacentElement('beforebegin', controls);

    var search = controls.querySelector('.hr-country-directory__search');
    var toggle = controls.querySelector('.hr-country-directory__toggle');
    var status = controls.querySelector('.hr-country-directory__status');
    var expanded = false;
    var initialCount = Math.min(12, cards.length);

    function render() {
      var term = search.value.trim().toLowerCase();
      var matching = 0;
      cards.forEach(function (card, index) {
        var matches = !term || card.textContent.toLowerCase().indexOf(term) !== -1;
        if (matches) matching += 1;
        var visible = matches && (term || expanded || index < initialCount);
        card.dataset.directoryHidden = visible ? 'false' : 'true';
      });

      toggle.hidden = Boolean(term) || cards.length <= initialCount;
      toggle.setAttribute('aria-expanded', String(expanded));
      toggle.textContent = expanded ? 'Show fewer countries' : 'Show all ' + cards.length + ' countries';
      status.textContent = term
        ? matching + (matching === 1 ? ' country matches.' : ' countries match.')
        : expanded
          ? 'Showing all ' + cards.length + ' country routes.'
          : 'Showing ' + initialCount + ' popular routes. Search or expand for all ' + cards.length + '.';
    }

    search.addEventListener('input', render);
    toggle.addEventListener('click', function () {
      expanded = !expanded;
      render();
      if (!expanded) heading.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
    render();
  }

  function init() {
    var config = toolConfigs[normalizePath(window.location.pathname)];
    if (!config) return;
    document.body.classList.add('hr-ui-refined', 'hr-ui-' + config.key);
    enhanceCountryDirectory(config);
    createEmptyState(config);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
}());

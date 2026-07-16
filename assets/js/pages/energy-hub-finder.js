/**
 * Energy hub task finder.
 *
 * Progressive enhancement for /energy/: a category filter plus a tokenised
 * search that narrows the visible app cards. Every query token must match a
 * card's text or topics (AND search), region labels hide when their group is
 * empty, and a polite status line reports how many tools are showing.
 */
(function () {
  'use strict';

  var search = document.getElementById('energyToolSearch');
  var resetButton = document.getElementById('energyToolFinderReset');
  var status = document.getElementById('energyToolFinderStatus');
  var empty = document.getElementById('energyToolFinderEmpty');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.en-tool-card[data-energy-topics]'));
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll('[data-energy-filter]'));
  var grids = Array.prototype.slice.call(document.querySelectorAll('.en-hub .en-tools-grid'));
  var activeFilter = 'all';

  function normalize(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function apply() {
    var query = normalize(search.value);
    var queryTokens = query ? query.split(' ') : [];
    var visibleCount = 0;

    cards.forEach(function (card) {
      var topics = normalize(card.getAttribute('data-energy-topics')).split(' ');
      var matchesFilter = activeFilter === 'all' || topics.indexOf(activeFilter) !== -1;
      var haystack = normalize(card.textContent + ' ' + card.getAttribute('data-energy-topics'));
      var matchesSearch = queryTokens.every(function (token) {
        return haystack.indexOf(token) !== -1;
      });
      card.hidden = !(matchesFilter && matchesSearch);
      if (!card.hidden) {
        visibleCount += 1;
      }
    });

    grids.forEach(function (grid) {
      var visible = !!grid.querySelector('.en-tool-card:not([hidden])');
      var label = grid.previousElementSibling;
      if (label && label.classList.contains('en-region-label')) {
        label.hidden = !visible;
      }
    });

    empty.hidden = visibleCount !== 0;

    if (visibleCount !== cards.length || activeFilter !== 'all' || query) {
      status.textContent = 'Showing ' + visibleCount + ' of ' + cards.length + ' tools' +
        (query ? ' for “' + search.value.trim() + '”.' : '.');
    } else {
      status.textContent = 'Showing all ' + cards.length + ' tools.';
    }
  }

  Array.prototype.forEach.call(document.querySelectorAll('.en-tc-icon svg'), function (svg) {
    svg.parentElement.setAttribute('data-energy-icon', 'ready');
  });

  if (!(search && resetButton && status && empty && cards.length)) {
    return;
  }

  filterButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      activeFilter = button.getAttribute('data-energy-filter') || 'all';
      filterButtons.forEach(function (item) {
        item.setAttribute('aria-pressed', item === button ? 'true' : 'false');
      });
      apply();
    });
  });

  search.addEventListener('input', apply);
  search.addEventListener('search', apply);

  resetButton.addEventListener('click', function () {
    activeFilter = 'all';
    search.value = '';
    filterButtons.forEach(function (item) {
      item.setAttribute('aria-pressed', item.getAttribute('data-energy-filter') === 'all' ? 'true' : 'false');
    });
    apply();
    search.focus();
  });

  apply();
})();

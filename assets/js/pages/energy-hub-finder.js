(function () {
  'use strict';

  var search = document.getElementById('energyToolSearch');
  var reset = document.getElementById('energyToolFinderReset');
  var status = document.getElementById('energyToolFinderStatus');
  var empty = document.getElementById('energyToolFinderEmpty');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.en-tool-card[data-energy-topics]'));
  var filters = Array.prototype.slice.call(document.querySelectorAll('[data-energy-filter]'));
  var grids = Array.prototype.slice.call(document.querySelectorAll('.en-hub .en-tools-grid'));
  var activeFilter = 'all';

  // energy-focus.js provides letter fallbacks for iconless cards. Mark the
  // hub's authored SVGs as ready so that fallback does not replace them.
  Array.prototype.forEach.call(document.querySelectorAll('.en-tc-icon svg'), function (icon) {
    icon.parentElement.setAttribute('data-energy-icon', 'ready');
  });

  if (!search || !reset || !status || !empty || !cards.length) return;

  function normalize(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function searchText(card) {
    return normalize(card.textContent + ' ' + card.getAttribute('data-energy-topics'));
  }

  function updateGroupVisibility() {
    grids.forEach(function (grid) {
      var visible = grid.querySelector('.en-tool-card:not([hidden])');
      var label = grid.previousElementSibling;
      if (label && label.classList.contains('en-region-label')) label.hidden = !visible;
    });
  }

  function applyFinder() {
    var query = normalize(search.value);
    var queryTokens = query ? query.split(' ') : [];
    var visibleCount = 0;

    cards.forEach(function (card) {
      var topics = normalize(card.getAttribute('data-energy-topics')).split(' ');
      var matchesFilter = activeFilter === 'all' || topics.indexOf(activeFilter) !== -1;
      var haystack = searchText(card);
      var matchesSearch = queryTokens.every(function (token) { return haystack.indexOf(token) !== -1; });
      card.hidden = !(matchesFilter && matchesSearch);
      if (!card.hidden) visibleCount += 1;
    });

    updateGroupVisibility();
    empty.hidden = visibleCount !== 0;
    status.textContent = visibleCount === cards.length && activeFilter === 'all' && !query
      ? 'Showing all ' + cards.length + ' tools.'
      : 'Showing ' + visibleCount + ' of ' + cards.length + ' tools' + (query ? ' for “' + search.value.trim() + '”.' : '.');
  }

  filters.forEach(function (button) {
    button.addEventListener('click', function () {
      activeFilter = button.getAttribute('data-energy-filter') || 'all';
      filters.forEach(function (item) {
        item.setAttribute('aria-pressed', item === button ? 'true' : 'false');
      });
      applyFinder();
    });
  });

  search.addEventListener('input', applyFinder);
  search.addEventListener('search', applyFinder);
  reset.addEventListener('click', function () {
    activeFilter = 'all';
    search.value = '';
    filters.forEach(function (item) {
      item.setAttribute('aria-pressed', item.getAttribute('data-energy-filter') === 'all' ? 'true' : 'false');
    });
    applyFinder();
    search.focus();
  });

  applyFinder();
}());

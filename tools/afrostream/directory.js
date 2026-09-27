(function() {
  'use strict';

  var form = document.getElementById('directoryFilters');
  var search = document.getElementById('directorySearch');
  var country = document.getElementById('directoryCountry');
  var clear = document.getElementById('directoryClear');
  var count = document.getElementById('directoryCount');
  var empty = document.getElementById('directoryEmpty');
  if (!form || !search || !country || !clear || !count || !empty) return;

  var groups = Array.prototype.slice.call(document.querySelectorAll('[data-country-group]'));
  var rows = Array.prototype.slice.call(document.querySelectorAll('[data-creator]'));

  function normalize(value) {
    return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  function update() {
    var term = normalize(search.value);
    var selectedCountry = country.value;
    var shown = 0;
    groups.forEach(function(group) {
      var groupShown = 0;
      Array.prototype.forEach.call(group.querySelectorAll('[data-creator]'), function(row) {
        var matches = (!selectedCountry || row.getAttribute('data-country') === selectedCountry) &&
          (!term || normalize(row.textContent).indexOf(term) !== -1);
        row.hidden = !matches;
        if (matches) {
          shown += 1;
          groupShown += 1;
        }
      });
      group.hidden = groupShown === 0;
    });
    count.textContent = shown + ' of ' + rows.length + ' profiles shown';
    empty.hidden = shown !== 0;
  }

  form.hidden = false;
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('submit', function(event) { event.preventDefault(); });
  clear.addEventListener('click', function() {
    search.value = '';
    country.value = '';
    update();
    search.focus();
  });
  document.addEventListener('click', function(event) {
    var link = event.target.closest && event.target.closest('[data-creator] a');
    if (!link || !window.AfroTools || !window.AfroTools.analytics) return;
    window.AfroTools.analytics.track('afrostream_creator_profile_opened', { source_lane: 'directory' });
  });
})();

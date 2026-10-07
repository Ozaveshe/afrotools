(function (window, document) {
  'use strict';

  var lastTripBrief = '';
  var builtSelection = null;
  var stale = false;
  var copyRevision = 0;

  function engine() {
    return window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.igboMarketDays;
  }

  function currentSelection() {
    return [
      document.getElementById('lookupDate').value,
      document.getElementById('tripMarket').value,
      document.getElementById('tripPurpose').value,
      document.getElementById('tripBuffer').value
    ].join('|');
  }

  function setStatus(message) {
    var status = document.getElementById('tripStatus');
    if (status.textContent !== message) status.textContent = message;
  }

  function hideManualCopy() {
    document.getElementById('tripManualCopy').hidden = true;
    document.getElementById('tripBriefText').value = '';
  }

  function focusAndReveal(control) {
    control.focus({ preventScroll: true });
    control.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
  }

  function isValidLookupDate(value) {
    if (!engine().isValidDateKey(value)) return false;
    var parts = value.split('-').map(Number);
    // UTC components avoid device-timezone shifts and Date.UTC's 0–99 year remapping.
    var date = new Date(0);
    date.setUTCFullYear(parts[0], parts[1] - 1, parts[2]);
    return parts[0] >= 1000 && date.getUTCFullYear() === parts[0] &&
      date.getUTCMonth() === parts[1] - 1 && date.getUTCDate() === parts[2] &&
      engine().toDateKey(engine().parseDateKey(value)) === value;
  }

  function validateLookup() {
    var input = document.getElementById('lookupDate');
    var valid = isValidLookupDate(input.value);
    var message = valid ? '' : /^\d{4}-/.test(input.value) && Number(input.value.slice(0, 4)) < 1000
      ? 'This calendar supports years 1000 onward. Choose a supported date.'
      : 'Choose a valid date. The month calendar stays on the last selection.';
    input.setAttribute('aria-invalid', String(!valid));
    document.getElementById('lookupDateStatus').textContent = message;
    document.getElementById('selectedDateResult').hidden = !valid;
    document.getElementById('selectedUpcoming').hidden = !valid;
    document.getElementById('tripPlannerOutput').hidden = !valid;
    document.getElementById('marketDirectory').toggleAttribute('data-invalid-lookup', !valid);
    document.getElementById('shareView').disabled = !valid;
    if (!valid) document.getElementById('shareStatus').textContent = '';
    return valid;
  }

  function refreshTripState() {
    var valid = validateLookup();
    var nextStale = !valid || currentSelection() !== builtSelection;
    var copyButton = document.querySelector('#tripPlannerOutput .trip-copy');
    if (copyButton) copyButton.disabled = nextStale;
    var previousNotice = document.querySelector('#tripPlannerOutput .trip-stale-note');
    if (previousNotice) previousNotice.hidden = !nextStale;
    window.__marketTripBrief = nextStale ? '' : lastTripBrief;
    if (nextStale !== stale) {
      copyRevision += 1;
      hideManualCopy();
      if (!nextStale) setStatus('Trip brief matches the current selections.');
    }
    if (nextStale) setStatus(valid
      ? 'Selections changed. Build a new trip brief before copying.'
      : 'Choose a valid date, then build a new trip brief before copying.');
    stale = nextStale;
    return valid && !stale;
  }

  function showManualCopy(brief, message) {
    var text = document.getElementById('tripBriefText');
    setStatus(message);
    text.value = brief;
    document.getElementById('tripManualCopy').hidden = false;
    focusAndReveal(text);
    text.select();
  }

  async function copyTripBrief() {
    if (!refreshTripState()) return;
    var brief = lastTripBrief;
    var revision = ++copyRevision;
    hideManualCopy();
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
      showManualCopy(brief, 'Clipboard access is unavailable. Select the trip brief below and copy it manually.');
      return;
    }
    try {
      await navigator.clipboard.writeText(brief);
      if (revision === copyRevision) setStatus('Trip brief copied.');
    } catch (_) {
      if (revision === copyRevision) {
        showManualCopy(brief, 'Could not copy automatically. Select the trip brief below and copy it manually.');
      }
    }
  }

  function renderTripPlan() {
    var api = engine();
    var out = document.getElementById('tripPlannerOutput');
    if (!api || !out) return;
    if (!validateLookup()) {
      refreshTripState();
      focusAndReveal(document.getElementById('lookupDate'));
      return;
    }
    var marketId = document.getElementById('tripMarket').value;
    var market = api.marketDirectory.find(function (m) { return m.id === marketId; }) || api.marketDirectory[0];
    var purpose = document.getElementById('tripPurpose').value;
    var buffer = parseInt(document.getElementById('tripBuffer').value, 10) || 0;
    var dateKey = document.getElementById('lookupDate').value;
    var base = api.addDays(api.parseDateKey(dateKey), buffer);
    var dates = api.getUpcomingDates(base, market.dayIndex, 3);
    var day = api.dayDetails[market.dayIndex];
    var purposeNote = {
      shopping: 'Go early, compare at least three stalls, and carry a written target list so the market-day crowd does not push you into impulse buying.',
      vendor: 'Call your supplier a day before, confirm stock and transport, and keep cash/mobile money split so one payment channel failure does not stop the trip.',
      ceremony: 'Use the first matching date for scouting and the second for confirmed purchases after family approval.',
      research: 'Record date, market day, section, stall type, and quoted prices so the visit can become a clean field note.'
    }[purpose];
    lastTripBrief = [
      'IGBO MARKET TRIP BRIEF',
      'Market: ' + market.name + ' (' + market.town + ', ' + market.state + ')',
      'Traditional day: ' + day.name,
      'Next options: ' + dates.map(function (d) { return api.formatDate(d, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); }).join(' | '),
      'Purpose: ' + purpose,
      'Note: ' + purposeNote,
      'Source: ' + market.sourceUrl
    ].join('\n');
    out.innerHTML =
      '<p class="trip-stale-note" hidden><strong>Previous trip brief.</strong> Build a new brief for the current selections.</p>' +
      '<div class="trip-output-grid">' +
      '<div class="trip-output-box"><span>Market day</span><strong>' + day.name + ' / ' + day.alias + '</strong></div>' +
      '<div class="trip-output-box"><span>Best next date</span><strong>' + api.formatDate(dates[0], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) + '</strong></div>' +
      '<div class="trip-output-box"><span>Source</span><strong>' + market.sourceLabel + '</strong></div>' +
      '</div>' +
      '<p><strong>' + market.name + ':</strong> ' + market.descriptor + ' ' + market.operatingPattern + '</p>' +
      '<p>' + purposeNote + '</p>' +
      '<button class="trip-copy" type="button">Copy trip brief</button>';
    out.querySelector('.trip-copy').addEventListener('click', copyTripBrief);
    copyRevision += 1;
    builtSelection = currentSelection();
    stale = false;
    window.__marketTripBrief = lastTripBrief;
    hideManualCopy();
    setStatus('Trip brief ready for ' + market.name + '.');
  }

  function initTripPlanner() {
    var api = engine();
    var marketSelect = document.getElementById('tripMarket');
    if (!api || !marketSelect) return;
    marketSelect.innerHTML = api.marketDirectory.map(function (m) {
      return '<option value="' + m.id + '">' + m.name + ' - ' + m.town + ', ' + m.state + '</option>';
    }).join('');
    document.getElementById('buildTripPlan').addEventListener('click', renderTripPlan);
    document.getElementById('lookupDate').addEventListener('change', function (event) {
      if (!isValidLookupDate(event.currentTarget.value)) {
        // Reject invalid input before the existing calendar's change handler reads it.
        event.stopImmediatePropagation();
        refreshTripState();
      }
    }, true);
    ['lookupDate', 'tripMarket', 'tripPurpose', 'tripBuffer'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', refreshTripState);
    });
    document.getElementById('lookupDate').addEventListener('input', refreshTripState);
    ['useNigeriaToday', 'useDeviceToday', 'calendarGrid'].forEach(function (id) {
      document.getElementById(id).addEventListener('click', refreshTripState);
    });
    renderTripPlan();
  }

  window.copyMarketTripBrief = copyTripBrief;
  // The earlier deferred calendar runtime initializes its date before this listener.
  if (document.readyState === 'complete') initTripPlanner();
  else document.addEventListener('DOMContentLoaded', initTripPlanner, { once: true });
})(window, document);

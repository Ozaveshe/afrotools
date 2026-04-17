(function (window, document) {
  'use strict';

  var engine = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.igboMarketDays;

  if (!engine) {
    return;
  }

  var nigeriaTimeZone = engine.defaultTimeZone;
  var resolvedTimeZone = (Intl.DateTimeFormat().resolvedOptions().timeZone || '').trim();
  var deviceTimeZone = engine.isValidTimeZone(resolvedTimeZone) ? resolvedTimeZone : nigeriaTimeZone;

  var DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var state = {
    selectedDateKey: null,
    currentMonthDate: null,
    filters: {
      query: '',
      state: 'all',
      day: 'all'
    }
  };

  var elements = {
    selectedEyebrow: document.getElementById('selectedEyebrow'),
    selectedName: document.getElementById('selectedDayName'),
    selectedAlias: document.getElementById('selectedDayAlias'),
    selectedDate: document.getElementById('selectedDateMeta'),
    selectedNote: document.getElementById('selectedDayNote'),
    selectedMatch: document.getElementById('selectedMarketMatch'),
    selectedToken: document.getElementById('selectedDayToken'),
    lookupDate: document.getElementById('lookupDate'),
    useNigeriaToday: document.getElementById('useNigeriaToday'),
    useDeviceToday: document.getElementById('useDeviceToday'),
    shareView: document.getElementById('shareView'),
    shareStatus: document.getElementById('shareStatus'),
    nigeriaDayName: document.getElementById('nigeriaDayName'),
    nigeriaDate: document.getElementById('nigeriaDateMeta'),
    nigeriaZone: document.getElementById('nigeriaZoneMeta'),
    deviceDayName: document.getElementById('deviceDayName'),
    deviceDate: document.getElementById('deviceDateMeta'),
    deviceZone: document.getElementById('deviceZoneMeta'),
    compareNote: document.getElementById('compareNote'),
    cycleGrid: document.getElementById('cycleGrid'),
    monthLabel: document.getElementById('monthLabel'),
    calendarGrid: document.getElementById('calendarGrid'),
    prevMonth: document.getElementById('prevMonth'),
    nextMonth: document.getElementById('nextMonth'),
    upcomingGrid: document.getElementById('upcomingGrid'),
    marketSearch: document.getElementById('marketSearch'),
    marketState: document.getElementById('marketState'),
    marketDay: document.getElementById('marketDay'),
    resetFilters: document.getElementById('resetFilters'),
    resultsCount: document.getElementById('resultsCount'),
    directoryResults: document.getElementById('directoryResults'),
    sourceList: document.getElementById('sourceList'),
    referenceSummary: document.getElementById('referenceSummary'),
    referenceDate: document.getElementById('referenceDate')
  };

  function createElement(tagName, className, textContent) {
    var element = document.createElement(tagName);

    if (className) {
      element.className = className;
    }

    if (typeof textContent !== 'undefined') {
      element.textContent = textContent;
    }

    return element;
  }

  function setSelectedDate(dateKey) {
    state.selectedDateKey = dateKey;

    if (!state.currentMonthDate) {
      state.currentMonthDate = new Date(Date.UTC(
        engine.parseDateKey(dateKey).getUTCFullYear(),
        engine.parseDateKey(dateKey).getUTCMonth(),
        1
      ));
    }

    if (elements.lookupDate) {
      elements.lookupDate.value = dateKey;
    }

    syncUrl();
    renderAll();
  }

  function getTodayMeta(timeZone) {
    var dateKey = engine.getTodayDateKey(timeZone);
    var day = engine.getMarketDay(dateKey);

    return {
      timeZone: timeZone,
      dateKey: dateKey,
      day: day,
      label: engine.formatDate(dateKey, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }, timeZone)
    };
  }

  function getSelectionLabel(selectedDateKey, nigeriaTodayKey, deviceTodayKey) {
    if (selectedDateKey === nigeriaTodayKey && selectedDateKey === deviceTodayKey) {
      return 'Today in Nigeria and on your device';
    }

    if (selectedDateKey === nigeriaTodayKey) {
      return 'Nigeria today';
    }

    if (selectedDateKey === deviceTodayKey) {
      return deviceTimeZone === nigeriaTimeZone ? 'Today' : 'Your device today';
    }

    return 'Custom lookup';
  }

  function renderSelectedSummary() {
    var day = engine.getMarketDay(state.selectedDateKey);
    var nigeriaToday = engine.getTodayDateKey(nigeriaTimeZone);
    var deviceToday = engine.getTodayDateKey(deviceTimeZone);
    var matches = engine.marketDirectory.filter(function (market) {
      return market.dayIndex === day.index;
    });

    if (elements.selectedEyebrow) {
      elements.selectedEyebrow.textContent = getSelectionLabel(state.selectedDateKey, nigeriaToday, deviceToday);
    }

    if (elements.selectedName) {
      elements.selectedName.textContent = day.name;
      elements.selectedName.style.color = day.color;
    }

    if (elements.selectedAlias) {
      elements.selectedAlias.textContent = day.alias;
    }

    if (elements.selectedDate) {
      elements.selectedDate.textContent = engine.formatDate(state.selectedDateKey, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }, nigeriaTimeZone);
    }

    if (elements.selectedNote) {
      elements.selectedNote.textContent = day.note;
    }

    if (elements.selectedMatch) {
      elements.selectedMatch.textContent = matches.length + ' named market' + (matches.length === 1 ? '' : 's') + ' in this directory align with ' + day.name + '.';
    }

    if (elements.selectedToken) {
      elements.selectedToken.textContent = day.name.slice(0, 3).toUpperCase();
      elements.selectedToken.style.color = day.color;
      elements.selectedToken.style.background = day.accent;
      elements.selectedToken.style.borderColor = day.color;
    }
  }

  function renderTodayComparison() {
    var nigeriaToday = getTodayMeta(nigeriaTimeZone);
    var deviceToday = getTodayMeta(deviceTimeZone);
    var dayDifference = Math.round((engine.parseDateKey(deviceToday.dateKey).getTime() - engine.parseDateKey(nigeriaToday.dateKey).getTime()) / (24 * 60 * 60 * 1000));
    var note;

    if (elements.nigeriaDayName) {
      elements.nigeriaDayName.textContent = nigeriaToday.day.name;
      elements.nigeriaDayName.style.color = nigeriaToday.day.color;
    }

    if (elements.nigeriaDate) {
      elements.nigeriaDate.textContent = nigeriaToday.label;
    }

    if (elements.nigeriaZone) {
      elements.nigeriaZone.textContent = 'Nigeria market time | ' + nigeriaTimeZone;
    }

    if (elements.deviceDayName) {
      elements.deviceDayName.textContent = deviceToday.day.name;
      elements.deviceDayName.style.color = deviceToday.day.color;
    }

    if (elements.deviceDate) {
      elements.deviceDate.textContent = deviceToday.label;
    }

    if (elements.deviceZone) {
      elements.deviceZone.textContent = deviceTimeZone === nigeriaTimeZone ? 'Same timezone as Nigeria' : 'Your device | ' + deviceTimeZone;
    }

    if (!elements.compareNote) {
      return;
    }

    if (deviceToday.dateKey === nigeriaToday.dateKey) {
      note = 'Your device date matches Nigeria today right now, so the cycle answer is the same in both places.';
    } else if (dayDifference < 0) {
      note = 'Your device is currently ' + Math.abs(dayDifference) + ' calendar day behind Nigeria, so \'today\' can differ for diaspora users.';
    } else {
      note = 'Your device is currently ' + dayDifference + ' calendar day ahead of Nigeria, so \'today\' can differ until Nigeria crosses midnight.';
    }

    elements.compareNote.textContent = note;
  }

  function renderCycleGrid() {
    var selectedIndex = engine.getMarketDayIndex(state.selectedDateKey);
    var fragment = document.createDocumentFragment();

    engine.dayDetails.forEach(function (detail) {
      var button = createElement('button', 'cycle-item' + (detail.index === selectedIndex ? ' is-active' : ''));
      var header = createElement('div', 'cycle-item-head');
      var name = createElement('span', 'cycle-item-name', detail.name);
      var alias = createElement('span', 'cycle-item-alias', detail.alias);
      var note = createElement('p', 'cycle-item-note', detail.note);

      button.type = 'button';
      button.style.setProperty('--day-color', detail.color);
      button.style.setProperty('--day-accent', detail.accent);
      button.addEventListener('click', function () {
        state.filters.day = String(detail.index);
        if (elements.marketDay) {
          elements.marketDay.value = String(detail.index);
        }
        renderDirectory();
        document.getElementById('marketDirectory').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      header.appendChild(name);
      header.appendChild(alias);
      button.appendChild(header);
      button.appendChild(note);
      fragment.appendChild(button);
    });

    elements.cycleGrid.innerHTML = '';
    elements.cycleGrid.appendChild(fragment);
  }

  function renderCalendar() {
    var monthDate = state.currentMonthDate;
    var firstDay = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), 1));
    var lastDay = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 0));
    var fragment = document.createDocumentFragment();

    if (elements.monthLabel) {
      elements.monthLabel.textContent = new Intl.DateTimeFormat('en-NG', {
        timeZone: 'UTC',
        month: 'long',
        year: 'numeric'
      }).format(firstDay);
    }

    DAY_HEADERS.forEach(function (dayName) {
      fragment.appendChild(createElement('div', 'calendar-head', dayName));
    });

    for (var leading = 0; leading < firstDay.getUTCDay(); leading += 1) {
      fragment.appendChild(createElement('div', 'calendar-spacer'));
    }

    for (var dateNumber = 1; dateNumber <= lastDay.getUTCDate(); dateNumber += 1) {
      var date = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), dateNumber));
      var dateKey = engine.toDateKey(date);
      var detail = engine.getMarketDay(dateKey);
      var button = createElement('button', 'calendar-day' + (dateKey === state.selectedDateKey ? ' is-selected' : ''));
      var dateLabel = createElement('span', 'calendar-date', String(dateNumber));
      var badge = createElement('span', 'calendar-market', detail.name.slice(0, 3));

      button.type = 'button';
      button.style.setProperty('--day-color', detail.color);
      button.style.setProperty('--day-accent', detail.accent);
      button.setAttribute('aria-label', engine.formatDate(dateKey, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }, nigeriaTimeZone) + ' | ' + detail.name);
      button.addEventListener('click', function (event) {
        setSelectedDate(event.currentTarget.getAttribute('data-date-key'));
      });
      button.setAttribute('data-date-key', dateKey);

      button.appendChild(dateLabel);
      button.appendChild(badge);
      fragment.appendChild(button);
    }

    elements.calendarGrid.innerHTML = '';
    elements.calendarGrid.appendChild(fragment);
  }

  function renderUpcomingGrid() {
    var fragment = document.createDocumentFragment();

    engine.dayDetails.forEach(function (detail) {
      var card = createElement('article', 'upcoming-item');
      var heading = createElement('div', 'upcoming-item-head');
      var title = createElement('h3', 'upcoming-item-title', detail.name);
      var alias = createElement('span', 'upcoming-item-alias', detail.alias);
      var list = createElement('div', 'upcoming-list');

      heading.style.setProperty('--day-color', detail.color);
      title.style.color = detail.color;
      heading.appendChild(title);
      heading.appendChild(alias);

      engine.getUpcomingDates(state.selectedDateKey, detail.index, 3).forEach(function (date, index) {
        var row = createElement('div', 'upcoming-row');
        var label = createElement('span', 'upcoming-date', engine.formatDate(date, {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }, nigeriaTimeZone));
        var meta = createElement('span', 'upcoming-meta', index === 0 && engine.toDateKey(date) === state.selectedDateKey ? 'Selected date' : 'Next turn');

        row.appendChild(label);
        row.appendChild(meta);
        list.appendChild(row);
      });

      card.appendChild(heading);
      card.appendChild(list);
      fragment.appendChild(card);
    });

    elements.upcomingGrid.innerHTML = '';
    elements.upcomingGrid.appendChild(fragment);
  }

  function buildMarketCard(market) {
    var detail = engine.dayDetails[market.dayIndex];
    var card = createElement('article', 'directory-card');
    var header = createElement('div', 'directory-card-head');
    var titleWrap = createElement('div', 'directory-title-wrap');
    var title = createElement('h3', 'directory-title', market.name);
    var location = createElement('p', 'directory-location', market.town + ', ' + market.state);
    var badge = createElement('span', 'directory-badge', detail.name);
    var descriptor = createElement('p', 'directory-descriptor', market.descriptor);
    var pattern = createElement('p', 'directory-pattern', market.operatingPattern);
    var schedule = createElement('div', 'directory-schedule');
    var source = createElement('a', 'directory-source', market.sourceLabel);

    badge.style.background = detail.accent;
    badge.style.color = detail.color;

    titleWrap.appendChild(title);
    titleWrap.appendChild(location);
    header.appendChild(titleWrap);
    header.appendChild(badge);

    engine.getUpcomingDates(state.selectedDateKey, market.dayIndex, 3).forEach(function (date) {
      var pill = createElement('span', 'schedule-pill', engine.formatDate(date, {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      }, nigeriaTimeZone));

      schedule.appendChild(pill);
    });

    source.href = market.sourceUrl;
    source.target = '_blank';
    source.rel = 'noopener noreferrer';

    card.appendChild(header);
    card.appendChild(descriptor);
    card.appendChild(pattern);
    card.appendChild(schedule);
    card.appendChild(source);

    return card;
  }

  function renderDirectory() {
    var markets = engine.filterMarkets(state.filters);
    var fragment = document.createDocumentFragment();

    if (elements.resultsCount) {
      elements.resultsCount.textContent = markets.length + ' result' + (markets.length === 1 ? '' : 's');
    }

    if (!markets.length) {
      fragment.appendChild(createElement('div', 'directory-empty', 'No named markets match this filter yet. Try another state or clear the search.'));
    } else {
      markets.forEach(function (market) {
        fragment.appendChild(buildMarketCard(market));
      });
    }

    elements.directoryResults.innerHTML = '';
    elements.directoryResults.appendChild(fragment);
  }

  function renderSources() {
    var sources = engine.getSourceList();
    var fragment = document.createDocumentFragment();

    if (elements.referenceDate) {
      elements.referenceDate.textContent = engine.referencePoint.label;
    }

    if (elements.referenceSummary) {
      elements.referenceSummary.textContent = engine.referencePoint.summary;
    }

    sources.forEach(function (source) {
      var item = createElement('li', 'source-item');
      var link = createElement('a', 'source-link', source.label);
      var note = createElement('span', 'source-support', source.supports);

      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';

      item.appendChild(link);
      item.appendChild(note);
      fragment.appendChild(item);
    });

    elements.sourceList.innerHTML = '';
    elements.sourceList.appendChild(fragment);
  }

  function renderAll() {
    renderSelectedSummary();
    renderTodayComparison();
    renderCycleGrid();
    renderCalendar();
    renderUpcomingGrid();
    renderDirectory();
  }

  function syncUrl() {
    var params = new URLSearchParams(window.location.search);
    params.set('date', state.selectedDateKey);
    window.history.replaceState({}, '', window.location.pathname + '?' + params.toString());
  }

  function updateMonth(delta) {
    state.currentMonthDate = new Date(Date.UTC(
      state.currentMonthDate.getUTCFullYear(),
      state.currentMonthDate.getUTCMonth() + delta,
      1
    ));
    renderCalendar();
  }

  function setShareStatus(message, isSuccess) {
    if (!elements.shareStatus) {
      return;
    }

    elements.shareStatus.textContent = message;
    elements.shareStatus.className = 'share-status' + (isSuccess ? ' is-success' : ' is-neutral');
  }

  function buildShareUrl() {
    var params = new URLSearchParams();
    params.set('date', state.selectedDateKey);
    return window.location.origin + window.location.pathname + '?' + params.toString();
  }

  function shareView() {
    var shareUrl = buildShareUrl();

    if (navigator.share) {
      navigator.share({
        title: 'Igbo Market Day Finder',
        text: 'Check this verified Igbo market day lookup.',
        url: shareUrl
      }).then(function () {
        setShareStatus('Shared.', true);
      }).catch(function () {
        setShareStatus('Share cancelled.', false);
      });
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(function () {
        setShareStatus('Link copied to clipboard.', true);
      }).catch(function () {
        setShareStatus('Could not copy automatically. Use the address bar instead.', false);
      });
      return;
    }

    setShareStatus('Copy this URL from the address bar: ' + shareUrl, false);
  }

  function bindEvents() {
    if (elements.lookupDate) {
      elements.lookupDate.addEventListener('change', function (event) {
        if (engine.isValidDateKey(event.target.value)) {
          state.currentMonthDate = new Date(Date.UTC(
            engine.parseDateKey(event.target.value).getUTCFullYear(),
            engine.parseDateKey(event.target.value).getUTCMonth(),
            1
          ));
          setSelectedDate(event.target.value);
        }
      });
    }

    if (elements.useNigeriaToday) {
      elements.useNigeriaToday.addEventListener('click', function () {
        state.currentMonthDate = null;
        setSelectedDate(engine.getTodayDateKey(nigeriaTimeZone));
      });
    }

    if (elements.useDeviceToday) {
      elements.useDeviceToday.addEventListener('click', function () {
        state.currentMonthDate = null;
        setSelectedDate(engine.getTodayDateKey(deviceTimeZone));
      });
    }

    if (elements.prevMonth) {
      elements.prevMonth.addEventListener('click', function () {
        updateMonth(-1);
      });
    }

    if (elements.nextMonth) {
      elements.nextMonth.addEventListener('click', function () {
        updateMonth(1);
      });
    }

    if (elements.shareView) {
      elements.shareView.addEventListener('click', shareView);
    }

    if (elements.marketSearch) {
      elements.marketSearch.addEventListener('input', function (event) {
        state.filters.query = event.target.value;
        renderDirectory();
      });
    }

    if (elements.marketState) {
      elements.marketState.addEventListener('change', function (event) {
        state.filters.state = event.target.value;
        renderDirectory();
      });
    }

    if (elements.marketDay) {
      elements.marketDay.addEventListener('change', function (event) {
        state.filters.day = event.target.value;
        renderDirectory();
      });
    }

    if (elements.resetFilters) {
      elements.resetFilters.addEventListener('click', function () {
        state.filters.query = '';
        state.filters.state = 'all';
        state.filters.day = 'all';
        if (elements.marketSearch) {
          elements.marketSearch.value = '';
        }
        if (elements.marketState) {
          elements.marketState.value = 'all';
        }
        if (elements.marketDay) {
          elements.marketDay.value = 'all';
        }
        renderDirectory();
      });
    }
  }

  function populateFilters() {
    engine.getUniqueStates().forEach(function (stateName) {
      var option = createElement('option', null, stateName);
      option.value = stateName;
      elements.marketState.appendChild(option);
    });

    engine.dayDetails.forEach(function (detail) {
      var option = createElement('option', null, detail.name);
      option.value = String(detail.index);
      elements.marketDay.appendChild(option);
    });
  }

  function init() {
    var params = new URLSearchParams(window.location.search);
    var requestedDate = params.get('date');
    var initialDate = engine.isValidDateKey(requestedDate) ? requestedDate : engine.getTodayDateKey(nigeriaTimeZone);
    var parsedInitialDate = engine.parseDateKey(initialDate);

    state.selectedDateKey = initialDate;
    state.currentMonthDate = new Date(Date.UTC(parsedInitialDate.getUTCFullYear(), parsedInitialDate.getUTCMonth(), 1));

    populateFilters();
    renderSources();
    bindEvents();
    setSelectedDate(initialDate);
  }

  document.addEventListener('DOMContentLoaded', init);
})(window, document);

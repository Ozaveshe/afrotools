(function () {
  'use strict';

  var root = document.querySelector('[data-election-edition]');
  if (!root) return;

  var locale = root.getAttribute('data-election-edition');
  var copy = {
    ha: {
      language: 'ha-NG',
      loading: 'Ana loda jadawalin zaɓe…',
      failed: 'An kasa loda jadawalin. Ka duba shafin hukumar zaɓe kai tsaye ko ka sake gwadawa.',
      empty: 'Babu zaɓe a wannan zaɓin. Canza ƙasa ko nuna duk ranaku.',
      allCountries: 'Duk ƙasashe',
      count: function (n) { return 'An nuna zaɓe ' + n + '.'; },
      ledgerDate: 'Ranar sabunta kundin',
      sourceChecked: 'An duba tushe',
      contextChecked: 'An duba kalandar waje',
      contextLink: 'Duba kalandar waje',
      contextNotOfficial: 'Wannan kalandar ba sanarwar hukumar zaɓe ba ce.',
      exactDayUnconfirmed: 'Ba a tabbatar da takamaiman ranar daga hukuma ba.',
      sourceReviewDue: 'Lokacin sake duba tushe ya yi. Tabbatar a shafin hukuma.',
      sourceNeedsReview: 'Wannan bayanin yana bukatar sake dubawa.',
      officialLink: 'Duba shafin hukumar zaɓe',
      sourceUnavailable: 'Ba a nuna hanyar tushe na hukuma a wannan bayanin ba.',
      dateUnknown: 'Ba a tabbatar da rana ba',
      dateStatus: {
        official: 'Ranar da hukuma ta wallafa',
        'official-revised': 'Ranar hukuma da aka gyara',
        tentative: 'Ranar wucin gadi',
        projected: 'Ranar da ba a tabbatar ba'
      },
      country: {
        NG: 'Najeriya', ST: 'São Tomé da Príncipe', ZM: 'Zambiya',
        CV: 'Cabo Verde', GM: 'Gambiya', SS: 'Sudan ta Kudu',
        KE: 'Kenya', ZA: 'Afirka ta Kudu'
      },
      region: {
        'West Africa': 'Afirka ta Yamma', 'Central Africa': 'Afirka ta Tsakiya',
        'Southern Africa': 'Kudancin Afirka', 'East Africa': 'Gabashin Afirka'
      },
      office: {
        Governor: 'Gwamna', President: 'Shugaban ƙasa',
        'Local government': 'Ƙananan hukumomi', Governors: 'Gwamnoni',
        'President and county governors': 'Shugaban ƙasa da gwamnonin gundumomi',
        'Local councils': 'Majalisun ƙananan hukumomi'
      }
    },
    yo: {
      language: 'yo-NG',
      loading: 'A ń ṣí àtòjọ ìdìbò…',
      failed: 'A kò lè ṣí àtòjọ náà. Ṣàyẹ̀wò ojú ìwé ìgbìmọ̀ ìdìbò tàbí gbìyànjú lẹ́ẹ̀kansi.',
      empty: 'Kò sí ìdìbò nínú àṣàyàn yìí. Yí orílẹ̀-èdè padà tàbí fi gbogbo ọjọ́ hàn.',
      allCountries: 'Gbogbo orílẹ̀-èdè',
      count: function (n) { return 'Ìdìbò ' + n + ' ni a fi hàn.'; },
      ledgerDate: 'Ọjọ́ ìmúdójúìwọ̀n àkọsílẹ̀',
      sourceChecked: 'Ọjọ́ àyẹ̀wò orísun',
      contextChecked: 'Ọjọ́ àyẹ̀wò àtòjọ mìíràn',
      contextLink: 'Ṣí àtòjọ mìíràn',
      contextNotOfficial: 'Àtòjọ yìí kì í ṣe ìkéde ìgbìmọ̀ ìdìbò.',
      exactDayUnconfirmed: 'Ìgbìmọ̀ ìdìbò kò tíì jẹ́rìí ọjọ́ gangan.',
      sourceReviewDue: 'Àkókò àtúnyẹ̀wò orísun ti kọjá. Ṣàyẹ̀wò ojú ìwé ìgbìmọ̀.',
      sourceNeedsReview: 'Àkọsílẹ̀ yìí nílò àtúnyẹ̀wò.',
      officialLink: 'Ṣí ojú ìwé ìgbìmọ̀ ìdìbò',
      sourceUnavailable: 'Kò sí ìjápọ̀ orísun ìjọba nínú àkọsílẹ̀ yìí.',
      dateUnknown: 'Ọjọ́ kò tíì dájú',
      dateStatus: {
        official: 'Ọjọ́ tí ìgbìmọ̀ kéde',
        'official-revised': 'Ọjọ́ ìgbìmọ̀ tí a túnṣe',
        tentative: 'Ọjọ́ tí kò tíì dájú',
        projected: 'Ọjọ́ tí kò tíì dájú'
      },
      country: {
        NG: 'Naijiria', ST: 'São Tomé àti Príncipe', ZM: 'Zàmbíà',
        CV: 'Cabo Verde', GM: 'Gambia', SS: 'Gúúsù Sudan',
        KE: 'Kenya', ZA: 'Gúúsù Áfíríkà'
      },
      region: {
        'West Africa': 'Ìwọ̀ Oòrùn Áfíríkà', 'Central Africa': 'Àárín Áfíríkà',
        'Southern Africa': 'Gúúsù Áfíríkà', 'East Africa': 'Ìlà Oòrùn Áfíríkà'
      },
      office: {
        Governor: 'Gómìnà', President: 'Ààrẹ',
        'Local government': 'Ìjọba ìbílẹ̀', Governors: 'Àwọn gómìnà',
        'President and county governors': 'Ààrẹ àti àwọn gómìnà agbègbè',
        'Local councils': 'Àwọn ìgbìmọ̀ ìbílẹ̀'
      }
    }
  }[locale];

  if (!copy) return;

  var select = root.querySelector('[data-ed-country]');
  var upcoming = root.querySelector('[data-ed-upcoming]');
  var status = root.querySelector('[data-ed-status]');
  var list = root.querySelector('[data-ed-list]');
  var entries = [];
  var generatedAt = '';
  var reviewCadenceDays = 7;

  function node(tag, className, value) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (value != null) element.textContent = value;
    return element;
  }

  function formattedDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return copy.dateUnknown;
    var date = new Date(value + 'T12:00:00Z');
    if (Number.isNaN(date.getTime())) return copy.dateUnknown;
    return new Intl.DateTimeFormat(copy.language, { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
  }

  function formattedMonth(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return copy.dateUnknown;
    var date = new Date(value + 'T12:00:00Z');
    if (Number.isNaN(date.getTime())) return copy.dateUnknown;
    return new Intl.DateTimeFormat(copy.language, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
  }

  function unconfirmedDate(entry) {
    return entry.dateStatus === 'tentative' || entry.dateStatus === 'projected' ||
      !Object.prototype.hasOwnProperty.call(copy.dateStatus, entry.dateStatus);
  }

  function localToday() {
    var now = new Date();
    return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  }

  function dateNoticeSource(entry) {
    var sources = Array.isArray(entry.sources) ? entry.sources : [];
    return sources.filter(function (source) {
      return source && source.type === 'official' && /^https:\/\//i.test(source.url || '');
    })[0] || null;
  }

  function externalDateContext(entry) {
    var first = Array.isArray(entry.sources) ? entry.sources[0] : null;
    return first && first.type !== 'official' && /^https:\/\//i.test(first.url || '') ? first : null;
  }

  function reviewDue(checkedAt) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(checkedAt || '')) return true;
    var age = (Date.now() - new Date(checkedAt + 'T12:00:00Z').getTime()) / 86400000;
    return age > reviewCadenceDays;
  }

  function renderEntry(entry) {
    var article = node('article', 'ed-entry');
    var dateColumn = node('div', 'ed-entry-date');
    var needsConfirmation = unconfirmedDate(entry);
    var date = node('time', '', needsConfirmation ? formattedMonth(entry.electionDate) : formattedDate(entry.electionDate));
    if (/^\d{4}-\d{2}-\d{2}$/.test(entry.electionDate || '')) {
      date.dateTime = needsConfirmation ? entry.electionDate.slice(0, 7) : entry.electionDate;
    }
    dateColumn.appendChild(date);

    var titleColumn = node('div', 'ed-entry-story');
    var country = copy.country[entry.countryCode] || entry.country || '';
    var office = copy.office[entry.office] || entry.office || '';
    titleColumn.appendChild(node('h3', '', country + (office ? ' · ' + office : '')));
    titleColumn.appendChild(node('p', '', copy.region[entry.region] || entry.region || ''));
    titleColumn.appendChild(node('span', 'ed-label', copy.dateStatus[entry.dateStatus] || copy.dateUnknown));

    var sourceColumn = node('div', 'ed-entry-meta');
    var source = dateNoticeSource(entry);
    if (needsConfirmation) {
      var context = externalDateContext(entry);
      sourceColumn.appendChild(node('p', 'ed-caution', copy.exactDayUnconfirmed));
      if (context) {
        sourceColumn.appendChild(node('p', '', copy.contextChecked + ': ' + formattedDate(context.checkedAt)));
        var contextLink = node('a', '', copy.contextLink);
        contextLink.href = context.url;
        contextLink.target = '_blank';
        contextLink.rel = 'noopener noreferrer';
        sourceColumn.appendChild(contextLink);
        sourceColumn.appendChild(node('p', 'ed-caution', copy.contextNotOfficial));
      }
    }
    if (source) {
      sourceColumn.appendChild(node('p', '', copy.sourceChecked + ': ' + formattedDate(source.checkedAt)));
      var link = node('a', '', copy.officialLink);
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      sourceColumn.appendChild(link);
      if (reviewDue(source.checkedAt)) sourceColumn.appendChild(node('p', 'ed-caution', copy.sourceReviewDue));
    } else {
      sourceColumn.appendChild(node('p', 'ed-caution', copy.sourceUnavailable));
    }
    if (entry.sourceStatus !== 'official') sourceColumn.appendChild(node('p', 'ed-caution', copy.sourceNeedsReview));

    article.appendChild(dateColumn);
    article.appendChild(titleColumn);
    article.appendChild(sourceColumn);
    return article;
  }

  function render() {
    var countryCode = select.value;
    var today = localToday();
    var selected = entries.filter(function (entry) {
      return (!countryCode || entry.countryCode === countryCode) &&
        (!upcoming.checked || !entry.electionDate ||
          (unconfirmedDate(entry) ? entry.electionDate.slice(0, 7) >= today.slice(0, 7) : entry.electionDate >= today));
    }).sort(function (a, b) {
      return String(a.electionDate || '').localeCompare(String(b.electionDate || '')) ||
        String(a.country || '').localeCompare(String(b.country || ''));
    });

    list.replaceChildren();
    if (selected.length) selected.forEach(function (entry) { list.appendChild(renderEntry(entry)); });
    else list.appendChild(node('p', 'ed-noscript', copy.empty));
    status.textContent = copy.count(selected.length) + ' ' + copy.ledgerDate + ': ' + formattedDate(generatedAt) + '.';
  }

  status.textContent = copy.loading;
  fetch('/data/government/africa-election-tracker.json', { credentials: 'same-origin' })
    .then(function (response) {
      if (!response.ok) throw new Error('election data unavailable');
      return response.json();
    })
    .then(function (data) {
      if (!data || !Array.isArray(data.elections)) throw new Error('election data invalid');
      entries = data.elections;
      generatedAt = data.generatedAt || '';
      reviewCadenceDays = Number.isFinite(data.reviewCadenceDays) && data.reviewCadenceDays > 0
        ? data.reviewCadenceDays : 7;
      var codes = Array.from(new Set(entries.map(function (entry) { return entry.countryCode; }).filter(Boolean)));
      codes.sort(function (a, b) {
        return (copy.country[a] || a).localeCompare(copy.country[b] || b, copy.language);
      });
      codes.forEach(function (code) {
        var option = node('option', '', copy.country[code] || code);
        option.value = code;
        select.appendChild(option);
      });
      select.addEventListener('change', render);
      upcoming.addEventListener('change', render);
      render();
    })
    .catch(function () {
      list.replaceChildren();
      status.textContent = copy.failed;
    });
})();

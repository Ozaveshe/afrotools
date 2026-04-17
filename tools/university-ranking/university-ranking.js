(function () {
  'use strict';

  var state = {
    filters: {
      search: '',
      country: '',
      type: '',
      strength: '',
      budget: '',
      scholarship: '',
      shortlistOnly: false
    },
    sortField: 'fitScore',
    sortAsc: false,
    profile: {},
    cockpit: { universities: [], destinations: [], budgetSignals: [] }
  };

  function getEl(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function uniqueStrings(values) {
    var seen = {};
    return values.filter(function (value) {
      var key = String(value || '').trim().toLowerCase();
      if (!key || seen[key]) return false;
      seen[key] = true;
      return true;
    }).map(function (value) {
      return String(value || '').trim();
    });
  }

  function splitList(value) {
    if (Array.isArray(value)) return uniqueStrings(value);
    if (!value) return [];
    return uniqueStrings(String(value).split(','));
  }

  function formatNumber(value) {
    var number = Number(value || 0);
    if (isNaN(number)) return '-';
    return number.toLocaleString();
  }

  function buildUniversityId(university) {
    return slugify((university.name || '') + '-' + (university.country || ''));
  }

  function getUniversities() {
    return Array.isArray(window.UNIVERSITIES) ? window.UNIVERSITIES.slice() : [];
  }

  function getCockpitState() {
    if (window.AfroEdu && typeof window.AfroEdu.getCockpitState === 'function') {
      return window.AfroEdu.getCockpitState() || {};
    }
    return {};
  }

  function getProfileState() {
    if (window.EduProfileSync && typeof window.EduProfileSync.getCachedProfile === 'function') {
      return window.EduProfileSync.getCachedProfile() || {};
    }
    return {};
  }

  function getContext() {
    var profile = state.profile || {};
    var cockpit = state.cockpit || {};
    var targetCountries = splitList(profile.target_countries);
    var destinationCountries = (cockpit.destinations || []).map(function (entry) {
      return entry && entry.name ? entry.name : '';
    });
    var targetFields = splitList(profile.target_fields);

    return {
      targetCountries: uniqueStrings(targetCountries.concat(destinationCountries)),
      targetFields: targetFields,
      studyLevel: profile.target_study_level || '',
      gpa: profile.gpa_value || '',
      ielts: profile.ielts_overall || '',
      savedDestinations: cockpit.destinations || [],
      savedBudgetSignals: cockpit.budgetSignals || []
    };
  }

  function normaliseLookup(values) {
    var lookup = {};
    values.forEach(function (value) {
      lookup[String(value || '').trim().toLowerCase()] = true;
    });
    return lookup;
  }

  function compareBudgetMatch(fees, budgetValue) {
    var amount = Number(fees || 0);
    if (!budgetValue) return null;
    var budget = Number(budgetValue);
    if (budget === 500) return amount < 500;
    if (budget === 2000) return amount >= 500 && amount < 2000;
    if (budget === 5000) return amount >= 2000 && amount < 5000;
    if (budget === 99999) return amount >= 5000;
    return null;
  }

  function affordabilitySignal(university) {
    var budgetValue = state.filters.budget;
    var fees = Number(university.fees || 0);
    var reason = '';
    var tradeoff = '';
    var score = 10;

    if (budgetValue) {
      var matches = compareBudgetMatch(fees, budgetValue);
      if (matches) {
        score = 24;
        reason = 'Within your active fee filter';
      } else {
        score = 5;
        tradeoff = 'Outside your active fee filter';
      }
    } else if (fees <= 300) {
      score = 22;
      reason = 'Lower-fee option';
    } else if (fees <= 1000) {
      score = 18;
      reason = 'Affordable fee range';
    } else if (fees <= 3000) {
      score = 12;
      reason = 'Mid-range fee route';
    } else {
      score = 6;
      tradeoff = 'Premium tuition route';
    }

    return {
      score: score,
      reason: reason,
      tradeoff: tradeoff
    };
  }

  function programmeSignal(university, context) {
    var targetFields = context.targetFields.length ? context.targetFields : (state.filters.strength ? [state.filters.strength] : []);
    var score = 10;
    var reason = '';
    var tradeoff = '';

    if (!targetFields.length) {
      return {
        score: score,
        reason: 'Use a field filter or profile target to sharpen programme fit',
        tradeoff: ''
      };
    }

    var lookup = normaliseLookup(targetFields);
    var overlaps = (university.strengths || []).filter(function (strength) {
      return lookup[String(strength || '').trim().toLowerCase()];
    });

    if (overlaps.length) {
      score = 24;
      reason = 'Matches ' + overlaps.slice(0, 2).join(', ');
    } else {
      score = 5;
      tradeoff = 'Field match is not obvious from this dataset';
    }

    return {
      score: score,
      reason: reason,
      tradeoff: tradeoff
    };
  }

  function destinationSignal(university, context) {
    var targetCountries = context.targetCountries;
    var score = 9;
    var reason = '';
    var tradeoff = '';

    if (targetCountries.length) {
      var lookup = normaliseLookup(targetCountries);
      if (lookup[String(university.country || '').trim().toLowerCase()]) {
        score = 18;
        reason = 'Matches your saved destination';
      } else {
        score = 4;
        tradeoff = 'Outside your saved destinations';
      }
    } else if (state.filters.country && university.country === state.filters.country) {
      score = 14;
      reason = 'Matches your active country focus';
    } else {
      reason = 'Country fit will sharpen when you save destinations';
    }

    return {
      score: score,
      reason: reason,
      tradeoff: tradeoff
    };
  }

  function scholarshipSignal(university) {
    if (university.scholarship) {
      return {
        score: 15,
        reason: 'Scholarship-friendly route',
        tradeoff: ''
      };
    }

    return {
      score: 4,
      reason: '',
      tradeoff: 'No scholarship flag in this dataset'
    };
  }

  function researchSignal(university) {
    var rank = Number(university.rank || 999);
    if (rank <= 10) {
      return {
        score: 18,
        reason: 'Top-tier research reputation',
        tradeoff: ''
      };
    }

    if (rank <= 25) {
      return {
        score: 14,
        reason: 'Strong regional reputation',
        tradeoff: ''
      };
    }

    return {
      score: 9,
      reason: 'Useful compare candidate',
      tradeoff: ''
    };
  }

  function evaluateFit(university, context) {
    var affordability = affordabilitySignal(university);
    var programme = programmeSignal(university, context);
    var destination = destinationSignal(university, context);
    var scholarship = scholarshipSignal(university);
    var research = researchSignal(university);
    var reasons = [];
    var tradeoffs = [];

    [affordability, programme, destination, scholarship, research].forEach(function (signal) {
      if (signal.reason) reasons.push(signal.reason);
      if (signal.tradeoff) tradeoffs.push(signal.tradeoff);
    });

    var score = affordability.score + programme.score + destination.score + scholarship.score + research.score;
    if (score > 100) score = 100;

    var label = 'Needs closer review';
    var className = 'fit-review';
    if (score >= 82) {
      label = 'Strong shortlist fit';
      className = 'fit-strong';
    } else if (score >= 68) {
      label = 'Good shortlist fit';
      className = 'fit-good';
    } else if (score >= 52) {
      label = 'Worth comparing';
      className = 'fit-watch';
    }

    return {
      score: score,
      label: label,
      className: className,
      reasons: reasons.slice(0, 3),
      tradeoffs: tradeoffs.slice(0, 2),
      scholarshipFriendly: university.scholarship,
      researchWeight: 100 - Number(university.rank || 99),
      affordabilityWeight: 100 - Math.min(Number(university.fees || 0), 5000) / 50,
      destinationAligned: reasons.indexOf('Matches your saved destination') !== -1 || reasons.indexOf('Matches your active country focus') !== -1
    };
  }

  function hydrateSavedUniversity(saved, universe) {
    var match = universe.find(function (entry) {
      return buildUniversityId(entry) === saved.id || entry.name === saved.name;
    });
    if (!match) {
      return Object.assign({}, saved, {
        fit: saved.fit || evaluateFit(Object.assign({ strengths: [] }, saved), getContext()),
        storedId: saved.id || ''
      });
    }

    return Object.assign({}, match, saved, {
      id: buildUniversityId(match),
      storedId: saved.id || buildUniversityId(match),
      fit: evaluateFit(Object.assign({}, match, saved), getContext())
    });
  }

  function getSavedUniversities(universe) {
    var saved = (state.cockpit.universities || []).map(function (entry) {
      return hydrateSavedUniversity(entry, universe);
    });

    return saved.sort(function (left, right) {
      var leftUpdated = Number(left.updatedAt || left.savedAt || 0);
      var rightUpdated = Number(right.updatedAt || right.savedAt || 0);
      return rightUpdated - leftUpdated;
    });
  }

  function getEnrichedUniversities() {
    var context = getContext();
    return getUniversities().map(function (university) {
      var cloned = Object.assign({}, university);
      cloned.id = buildUniversityId(cloned);
      cloned.fit = evaluateFit(cloned, context);
      return cloned;
    });
  }

  function matchesSearch(university, search) {
    if (!search) return true;
    var haystack = [
      university.name,
      university.country,
      university.type,
      (university.strengths || []).join(' ')
    ].join(' ').toLowerCase();
    return haystack.indexOf(search) !== -1;
  }

  function passesFilters(university, savedLookup) {
    if (!matchesSearch(university, state.filters.search)) return false;
    if (state.filters.country && university.country !== state.filters.country) return false;
    if (state.filters.type && university.type !== state.filters.type) return false;
    if (state.filters.strength && (university.strengths || []).indexOf(state.filters.strength) === -1) return false;
    if (state.filters.scholarship === 'yes' && !university.scholarship) return false;
    if (state.filters.budget && !compareBudgetMatch(university.fees, state.filters.budget)) return false;
    if (state.filters.shortlistOnly && !savedLookup[university.id]) return false;
    return true;
  }

  function compareValues(left, right) {
    if (typeof left === 'string') {
      left = left.toLowerCase();
      right = String(right || '').toLowerCase();
    }
    if (left < right) return state.sortAsc ? -1 : 1;
    if (left > right) return state.sortAsc ? 1 : -1;
    return 0;
  }

  function sortUniversities(universities) {
    return universities.sort(function (left, right) {
      if (state.sortField === 'fitScore') {
        return compareValues(left.fit.score, right.fit.score);
      }
      return compareValues(left[state.sortField], right[state.sortField]);
    });
  }

  function renderHeroStats(savedCount, allCount) {
    getEl('heroUniversityCount').textContent = String(allCount);
    getEl('heroShortlistCount').textContent = String(savedCount);
    getEl('heroDestinationCount').textContent = String((getContext().targetCountries || []).length);
    getEl('heroFocusCount').textContent = String((getContext().targetFields || []).length);
  }

  function renderProfileSummary() {
    var context = getContext();
    var intro = 'Load target countries and fields from Education Hub to make the fit heuristics more personal.';

    if (context.targetCountries.length || context.targetFields.length || context.gpa || context.ielts) {
      intro = 'Fit mode is reading the saved profile first, then using your active filters to refine the shortlist.';
    }

    getEl('profileSummary').textContent = intro;

    var signals = [];
    if (context.targetFields.length) signals.push('Fields: ' + context.targetFields.slice(0, 3).join(', '));
    if (context.targetCountries.length) signals.push('Destinations: ' + context.targetCountries.slice(0, 3).join(', '));
    if (context.studyLevel) signals.push('Level: ' + String(context.studyLevel).replace(/-/g, ' '));
    if (context.gpa) signals.push('GPA: ' + context.gpa);
    if (context.ielts) signals.push('IELTS: ' + context.ielts);
    if (!signals.length) signals.push('No saved study profile yet');

    getEl('profileSignals').innerHTML = signals.map(function (signal) {
      return '<span class="ur-signal">' + escapeHtml(signal) + '</span>';
    }).join('');
  }

  function findTopBy(universities, comparator) {
    if (!universities.length) return null;
    return universities.slice().sort(comparator)[0];
  }

  function renderDecisionHighlights(universities) {
    var cards = [];
    var context = getContext();
    var bestValue = findTopBy(universities, function (left, right) {
      return (left.fees - right.fees) || (right.fit.score - left.fit.score);
    });
    var researchLead = findTopBy(universities, function (left, right) {
      return left.rank - right.rank;
    });
    var scholarshipLead = findTopBy(universities.filter(function (university) {
      return university.scholarship;
    }), function (left, right) {
      return right.fit.score - left.fit.score;
    });
    var destinationLead = findTopBy(universities.filter(function (university) {
      return university.fit.destinationAligned;
    }), function (left, right) {
      return right.fit.score - left.fit.score;
    }) || findTopBy(universities, function (left, right) {
      return right.fit.score - left.fit.score;
    });

    cards.push({
      title: 'Best value right now',
      name: bestValue ? bestValue.name : 'Set filters first',
      copy: bestValue ? ((bestValue.feesLabel || 'Fee range unavailable') + ' · ' + (bestValue.fit.reasons[0] || 'Compare against your budget posture')) : 'Filter the table to surface lower-cost shortlist options.'
    });
    cards.push({
      title: 'Research anchor',
      name: researchLead ? researchLead.name : 'No school available',
      copy: researchLead ? ('Rank ' + researchLead.rank + ' · ' + (researchLead.fit.reasons[0] || 'Strong research signal')) : 'No research signal available yet.'
    });
    cards.push({
      title: 'Scholarship-friendly',
      name: scholarshipLead ? scholarshipLead.name : 'No flagged option in this view',
      copy: scholarshipLead ? (scholarshipLead.fit.label + ' · Use Scholarship Finder to pressure-test funding fit next.') : 'Turn on the scholarship filter if you want only flagged schools.'
    });
    cards.push({
      title: context.targetCountries.length ? 'Destination-aligned' : 'Highest fit in view',
      name: destinationLead ? destinationLead.name : 'No shortlist lead yet',
      copy: destinationLead ? ((destinationLead.country || 'Country unknown') + ' · ' + (destinationLead.fit.reasons[1] || destinationLead.fit.reasons[0] || 'Strong compare candidate')) : 'Save destinations in Education Hub to make this card more personal.'
    });

    getEl('decisionHighlights').innerHTML = cards.map(function (card) {
      return '<article class="ur-highlight-card">' +
        '<strong>' + escapeHtml(card.title) + '</strong>' +
        '<h3>' + escapeHtml(card.name) + '</h3>' +
        '<p>' + escapeHtml(card.copy) + '</p>' +
      '</article>';
    }).join('');
  }

  function renderTable(universities, savedLookup) {
    var body = getEl('uniBody');

    if (!universities.length) {
      body.innerHTML = '<tr><td colspan="8"><div class="ur-empty">No universities match this combination yet. Clear a filter, switch off shortlist mode, or widen the fee range.</div></td></tr>';
      return;
    }

    body.innerHTML = universities.map(function (university) {
      var isSaved = !!savedLookup[university.id];
      var tags = (university.strengths || []).slice(0, 4).map(function (strength) {
        return '<span class="ur-strength">' + escapeHtml(strength) + '</span>';
      }).join('');
      var reasons = university.fit.reasons.length ? university.fit.reasons.join(' · ') : 'Needs more profile context';
      var tradeoff = university.fit.tradeoffs[0] ? 'Watch-out: ' + university.fit.tradeoffs[0] : '';

      return '<tr>' +
        '<td><span class="ur-rank-badge' + (university.rank <= 3 ? ' is-top' : '') + '">' + escapeHtml(university.rank) + '</span></td>' +
        '<td>' +
          '<div class="ur-uni-name"><strong>' + escapeHtml(university.name) + '</strong><span class="ur-type-badge ' + escapeHtml(String(university.type || '').toLowerCase()) + '">' + escapeHtml(university.type || 'University') + '</span></div>' +
          '<div class="ur-meta-line">Founded ' + escapeHtml(university.founded || '-') + ' · ' + escapeHtml(formatNumber(university.students)) + ' students</div>' +
          '<div class="ur-strengths">' + tags + '</div>' +
        '</td>' +
        '<td>' + escapeHtml(university.country) + '</td>' +
        '<td><strong>' + escapeHtml(university.feesLabel || '—') + '</strong><div class="ur-meta-line">' + escapeHtml(university.fit.reasons[0] || 'Check affordability posture') + '</div></td>' +
        '<td>' + escapeHtml(formatNumber(university.students)) + '</td>' +
        '<td><span class="ur-scholarship-badge ' + (university.scholarship ? 'is-yes' : 'is-no') + '">' + (university.scholarship ? 'Scholarships flagged' : 'No flag') + '</span></td>' +
        '<td>' +
          '<span class="ur-fit-badge ' + escapeHtml(university.fit.className) + '">' + escapeHtml(university.fit.label) + '</span>' +
          '<div class="ur-fit-copy"><strong>' + escapeHtml(university.fit.score) + '/100 heuristic fit.</strong> ' + escapeHtml(reasons) + (tradeoff ? '<span class="ur-tradeoff">' + escapeHtml(tradeoff) + '</span>' : '') + '</div>' +
        '</td>' +
        '<td><button class="ur-save-btn' + (isSaved ? ' is-saved' : '') + '" type="button" data-action="toggle-save" data-id="' + escapeHtml(university.id) + '">' + (isSaved ? 'Saved to shortlist' : 'Save to shortlist') + '</button></td>' +
      '</tr>';
    }).join('');
  }

  function renderShortlist(universe) {
    var saved = getSavedUniversities(universe);
    var shortlistGrid = getEl('shortlistGrid');
    var metrics = getEl('shortlistMetrics');
    var note = getEl('shortlistNote');
    var intro = getEl('shortlistIntro');

    renderHeroStats(saved.length, universe.length);
    getEl('shortlistToggle').classList.toggle('is-active', state.filters.shortlistOnly);
    getEl('shortlistToggle').textContent = state.filters.shortlistOnly ? 'Showing shortlist only' : 'Shortlist mode';

    if (!saved.length) {
      metrics.innerHTML = '' +
        '<div class="ur-rail-metric"><strong>Shortlist status</strong><span>0 schools saved</span></div>' +
        '<div class="ur-rail-metric"><strong>Best next move</strong><span>Save 3 to 5 schools to unlock compare mode</span></div>';
      intro.textContent = 'Save schools as you research. This rail will turn them into a real compare view with costs, scholarship signals, and fit tradeoffs.';
      note.textContent = 'Saved schools are not cosmetic anymore. Once a few are here, this rail starts calling out the cheapest route, the strongest research anchor, and the scholarship-friendly options.';
      shortlistGrid.innerHTML = '<div class="ur-empty">No universities saved yet. Start from the table, then come back here to compare the shortlist you are building.</div>';
      return;
    }

    var cheapest = findTopBy(saved, function (left, right) {
      return Number(left.fees || 999999) - Number(right.fees || 999999);
    });
    var researchLead = findTopBy(saved, function (left, right) { return left.rank - right.rank; });
    var scholarshipCount = saved.filter(function (entry) { return !!entry.scholarship; }).length;
    var alignedCount = saved.filter(function (entry) { return entry.fit && entry.fit.destinationAligned; }).length;
    var countries = uniqueStrings(saved.map(function (entry) { return entry.country; }));
    var commonStrengths = {};

    saved.forEach(function (entry) {
      (entry.strengths || []).forEach(function (strength) {
        commonStrengths[strength] = (commonStrengths[strength] || 0) + 1;
      });
    });

    var repeatedStrengths = Object.keys(commonStrengths).filter(function (strength) {
      return commonStrengths[strength] > 1;
    }).slice(0, 3);

    metrics.innerHTML = [
      '<div class="ur-rail-metric"><strong>Most affordable</strong><span>' + escapeHtml((cheapest && cheapest.name) || '—') + '</span></div>',
      '<div class="ur-rail-metric"><strong>Research anchor</strong><span>' + escapeHtml((researchLead && researchLead.name) || '—') + '</span></div>',
      '<div class="ur-rail-metric"><strong>Scholarship-friendly</strong><span>' + escapeHtml(String(scholarshipCount)) + ' of ' + escapeHtml(String(saved.length)) + '</span></div>',
      '<div class="ur-rail-metric"><strong>Destination-aligned</strong><span>' + escapeHtml(String(alignedCount)) + ' shortlist routes</span></div>'
    ].join('');

    intro.textContent = saved.length === 1
      ? 'You have one school saved. Add a few more to expose clearer tradeoffs.'
      : 'You have ' + saved.length + ' saved schools. Use this rail to narrow the shortlist instead of scrolling the whole table again.';

    note.textContent = 'Your shortlist spans ' + countries.length + ' countr' + (countries.length === 1 ? 'y' : 'ies') +
      (repeatedStrengths.length ? ' and keeps repeating ' + repeatedStrengths.join(', ') + '.' : '.');

    shortlistGrid.innerHTML = saved.map(function (entry) {
      var reasons = entry.fit && entry.fit.reasons ? entry.fit.reasons.slice(0, 2) : [];
      var tradeoffs = entry.fit && entry.fit.tradeoffs ? entry.fit.tradeoffs : [];
      return '<article class="ur-short-card">' +
        '<div class="ur-short-top"><span class="ur-fit-badge ' + escapeHtml(entry.fit.className) + '">' + escapeHtml(entry.fit.label) + '</span><button type="button" data-action="remove-save" data-id="' + escapeHtml(entry.id) + '" data-stored-id="' + escapeHtml(entry.storedId || entry.id) + '">Remove</button></div>' +
        '<h3>' + escapeHtml(entry.name) + '</h3>' +
        '<p>' + escapeHtml((entry.country || '') + ' · Rank ' + (entry.rank || '—') + ' · ' + (entry.feesLabel || 'Fees unavailable')) + '</p>' +
        '<div class="ur-short-tags">' + reasons.map(function (reason) {
          return '<span>' + escapeHtml(reason) + '</span>';
        }).join('') + '</div>' +
        (tradeoffs[0] ? '<p style="margin-top:10px">Watch-out: ' + escapeHtml(tradeoffs[0]) + '</p>' : '') +
        '<div class="ur-short-actions"><a href="/tools/scholarship-finder/">Funding fit</a><a href="/tools/degree-checker/">Degree route</a><a href="/tools/education-hub/">Open cockpit</a></div>' +
      '</article>';
    }).join('');
  }

  function renderNextRoutes(savedCount) {
    var cards = [
      {
        title: 'Pressure-test the wider cost route',
        copy: savedCount ? 'You already have schools in view. Now compare the broader destination-cost pressure around the path you are leaning toward.' : 'After you shortlist a few schools, use Study Abroad Cost to understand how your wider destination plan behaves.',
        href: '/tools/study-abroad-cost/',
        cta: 'Open Study Abroad Cost'
      },
      {
        title: 'Pair schools with funding routes',
        copy: 'Scholarship Finder helps you pressure-test whether your shortlist has realistic funding support or needs a cheaper backup route.',
        href: '/tools/scholarship-finder/',
        cta: 'Open Scholarship Finder'
      },
      {
        title: 'Validate qualification readiness',
        copy: 'Use Degree Checker when you need to confirm whether your qualification route still makes sense before you commit to the shortlist.',
        href: '/tools/degree-checker/',
        cta: 'Open Degree Checker'
      },
      {
        title: 'Keep the shortlist inside your cockpit',
        copy: 'Education Hub turns saved schools into a reusable student object beside scholarships, tests, destinations, and deadlines.',
        href: '/tools/education-hub/',
        cta: 'Open Education Hub'
      }
    ];

    getEl('nextRouteGrid').innerHTML = cards.map(function (card) {
      return '<article class="ur-card ur-next-card">' +
        '<span class="ur-section-label">Next step</span>' +
        '<h3>' + escapeHtml(card.title) + '</h3>' +
        '<p>' + escapeHtml(card.copy) + '</p>' +
        '<a class="ur-inline-link is-primary" href="' + escapeHtml(card.href) + '">' + escapeHtml(card.cta) + '</a>' +
      '</article>';
    }).join('');
  }

  function syncContextFromStorage() {
    state.profile = getProfileState();
    state.cockpit = getCockpitState();
  }

  function filterAndRender() {
    syncContextFromStorage();
    var universe = getEnrichedUniversities();
    var savedLookup = {};
    getSavedUniversities(universe).forEach(function (entry) {
      savedLookup[entry.id] = true;
    });

    var filtered = universe.filter(function (university) {
      return passesFilters(university, savedLookup);
    });

    sortUniversities(filtered);
    getEl('countBadge').textContent = filtered.length + (state.filters.shortlistOnly ? ' shortlisted schools' : ' schools in view');
    renderProfileSummary();
    renderDecisionHighlights(filtered.length ? filtered : universe);
    renderTable(filtered, savedLookup);
    renderShortlist(universe);
    renderNextRoutes(Object.keys(savedLookup).length);
  }

  function getUniversityById(id) {
    return getEnrichedUniversities().find(function (university) {
      return university.id === id;
    }) || null;
  }

  function saveUniversity(university) {
    if (!university || !window.AfroEdu || typeof window.AfroEdu.saveUniversity !== 'function') return;

    (getCockpitState().universities || []).forEach(function (entry) {
      if (entry && entry.name === university.name && entry.id !== university.id && typeof window.AfroEdu.removeUniversity === 'function') {
        window.AfroEdu.removeUniversity(entry.id);
      }
    });

    window.AfroEdu.saveUniversity({
      id: university.id,
      name: university.name,
      country: university.country,
      rank: university.rank,
      fees: university.fees,
      feesLabel: university.feesLabel,
      type: university.type,
      students: university.students,
      scholarship: university.scholarship,
      strengths: university.strengths,
      href: '/tools/university-ranking/',
      source: 'university-ranking',
      fitLabel: university.fit.label,
      fitScore: university.fit.score,
      fitReasons: university.fit.reasons,
      tradeoffs: university.fit.tradeoffs,
      note: university.fit.reasons[0] || 'Shortlist compare candidate'
    });

    if (typeof window.AfroEdu.recordActivity === 'function') {
      window.AfroEdu.recordActivity('university-ranking', 'Updated university shortlist', {
        detail: university.name + ' · ' + university.fit.label
      });
    }
  }

  function removeUniversity(id, storedId) {
    if (!id || !window.AfroEdu || typeof window.AfroEdu.removeUniversity !== 'function') return;
    var university = getUniversityById(id);
    window.AfroEdu.removeUniversity(id);
    if (storedId && storedId !== id) {
      window.AfroEdu.removeUniversity(storedId);
    }
    (getCockpitState().universities || []).forEach(function (entry) {
      if (university && entry && entry.name === university.name && entry.id !== id && entry.id !== storedId) {
        window.AfroEdu.removeUniversity(entry.id);
      }
    });
    if (typeof window.AfroEdu.recordActivity === 'function') {
      window.AfroEdu.recordActivity('university-ranking', 'Removed university shortlist', {
        detail: university ? university.name : 'Removed shortlist school'
      });
    }
  }

  function bindControls() {
    getEl('searchInput').addEventListener('input', function (event) {
      state.filters.search = String(event.target.value || '').trim().toLowerCase();
      filterAndRender();
    });

    ['countryFilter', 'typeFilter', 'strengthFilter', 'budgetFilter', 'scholarshipFilter'].forEach(function (id) {
      getEl(id).addEventListener('change', function (event) {
        var key = id.replace('Filter', '');
        if (key === 'country') state.filters.country = event.target.value;
        if (key === 'type') state.filters.type = event.target.value;
        if (key === 'strength') state.filters.strength = event.target.value;
        if (key === 'budget') state.filters.budget = event.target.value;
        if (key === 'scholarship') state.filters.scholarship = event.target.value;
        filterAndRender();
      });
    });

    getEl('shortlistToggle').addEventListener('click', function () {
      state.filters.shortlistOnly = !state.filters.shortlistOnly;
      filterAndRender();
    });

    getEl('clearFiltersBtn').addEventListener('click', function () {
      state.filters = {
        search: '',
        country: '',
        type: '',
        strength: '',
        budget: '',
        scholarship: '',
        shortlistOnly: false
      };

      ['searchInput', 'countryFilter', 'typeFilter', 'strengthFilter', 'budgetFilter', 'scholarshipFilter'].forEach(function (id) {
        getEl(id).value = '';
      });

      filterAndRender();
    });

    getEl('uniTable').addEventListener('click', function (event) {
      var sortTarget = event.target.closest('[data-sort]');
      if (sortTarget) {
        var nextField = sortTarget.getAttribute('data-sort');
        if (state.sortField === nextField) {
          state.sortAsc = !state.sortAsc;
        } else {
          state.sortField = nextField;
          state.sortAsc = nextField === 'fitScore' ? false : true;
        }
        filterAndRender();
        return;
      }

      var actionTarget = event.target.closest('[data-action="toggle-save"]');
      if (!actionTarget) return;

      var university = getUniversityById(actionTarget.getAttribute('data-id'));
      var savedLookup = {};
      getSavedUniversities(getEnrichedUniversities()).forEach(function (entry) {
        savedLookup[entry.id] = true;
      });

      if (university && savedLookup[university.id]) {
        removeUniversity(university.id, university.id);
      } else if (university) {
        saveUniversity(university);
      }

      filterAndRender();
    });

    getEl('shortlistGrid').addEventListener('click', function (event) {
      var removeTarget = event.target.closest('[data-action="remove-save"]');
      if (!removeTarget) return;
      removeUniversity(removeTarget.getAttribute('data-id'), removeTarget.getAttribute('data-stored-id'));
      filterAndRender();
    });
  }

  function populateCountryFilter() {
    var countries = uniqueStrings(getUniversities().map(function (university) {
      return university.country;
    })).sort();

    getEl('countryFilter').innerHTML = '<option value="">All countries</option>' + countries.map(function (country) {
      return '<option value="' + escapeHtml(country) + '">' + escapeHtml(country) + '</option>';
    }).join('');
  }

  function init() {
    if (!getEl('uniTable')) return;
    populateCountryFilter();
    bindControls();
    filterAndRender();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

(function () {
  'use strict';

  var SHORTLIST_KEY = 'afro-scholarship-shortlist';
  var IELTS_STATE_KEY = 'afro-ielts-pathway-state';

  var fallbackScholarships = [
    { name: 'Chevening Scholarship', provider: 'UK Government', destinations: ['uk'], levels: ['masters'], fields: ['any'], funding: 'full', min_gpa_4: 3.0, min_ielts: 6.5, deadline_text: 'Nov', info_url: 'https://www.chevening.org' },
    { name: 'DAAD Scholarship', provider: 'German Academic Exchange Service', destinations: ['eu'], levels: ['masters', 'phd'], fields: ['any'], funding: 'full', min_gpa_4: 3.0, min_ielts: 6.0, deadline_text: 'Oct-Nov', info_url: 'https://www.daad.de' },
    { name: 'Mastercard Foundation Scholars', provider: 'Mastercard Foundation', destinations: ['global'], levels: ['undergrad', 'masters'], fields: ['any'], funding: 'full', min_gpa_4: 3.0, min_ielts: 6.0, deadline_text: 'Varies', info_url: 'https://mastercardfdn.org/all/scholars/' },
    { name: 'Fulbright Foreign Student Program', provider: 'US Department of State', destinations: ['us'], levels: ['masters', 'phd'], fields: ['any'], funding: 'full', min_gpa_4: 3.0, min_ielts: 6.5, deadline_text: 'Feb-Oct', info_url: 'https://foreign.fulbrightonline.org/' },
    { name: 'Commonwealth Scholarship', provider: 'Commonwealth Secretariat', destinations: ['uk'], levels: ['masters', 'phd'], fields: ['any'], funding: 'full', min_gpa_4: 3.0, min_ielts: 6.5, deadline_text: 'Dec', info_url: 'https://cscuk.fcdo.gov.uk/' },
    { name: 'Australia Awards Africa', provider: 'Australian Government', destinations: ['australia'], levels: ['masters'], fields: ['any'], funding: 'full', min_gpa_4: 3.0, min_ielts: 6.5, deadline_text: 'Apr-May', info_url: 'https://www.dfat.gov.au/' }
  ];

  var destinationOptions = [
    'United Kingdom',
    'Canada',
    'Australia',
    'United States',
    'Ireland',
    'Germany',
    'France',
    'Netherlands',
    'Within Africa'
  ];

  var routeOptions = {
    scholarship: { label: 'Scholarship route', href: '/tools/scholarship-finder/' },
    ielts: { label: 'IELTS plan', href: '/tools/ielts-calculator/' },
    budget: { label: 'Budget plan', href: '/tools/study-abroad-cost/' },
    university: { label: 'University shortlist', href: '/tools/university-ranking/' },
    admission: { label: 'Admissions pathway', href: '/tools/university-admission/' },
    jamb: { label: 'AfroJAMB', href: '/jamb/' },
    afrostudy: { label: 'AfroStudy', href: '/education/afrostudy/' }
  };

  var cockpit = {
    profile: {},
    remoteProfile: null,
    cachedProfile: null,
    quickProfile: null,
    state: { universities: [], destinations: [], deadlines: [], budgetSignals: [] },
    scholarships: [],
    matches: [],
    shortlistKeys: [],
    shortlistItems: [],
    activity: [],
    jamb: null,
    ieltsState: null
  };

  function getEl(id) {
    return document.getElementById(id);
  }

  function notify(message, type) {
    if (window.AfroToast && typeof window.AfroToast.show === 'function') {
      window.AfroToast.show(message, type || 'success');
    }
  }

  function safeRead(key, fallback, storage) {
    try {
      var store = storage || localStorage;
      var raw = store.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function escapeHtml(value) {
    var div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }

  function uniqueStrings(list) {
    return (list || []).reduce(function (acc, item) {
      if (!item) return acc;
      var value = String(item).trim();
      if (!value) return acc;
      if (acc.indexOf(value) === -1) acc.push(value);
      return acc;
    }, []);
  }

  function titleCase(value) {
    return String(value || '')
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, function (match) { return match.toUpperCase(); });
  }

  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function formatStudyLevel(level) {
    var map = {
      secondary: 'Secondary',
      undergraduate: 'Undergraduate',
      undergrad: 'Undergraduate',
      postgraduate: 'Postgraduate',
      masters: 'Masterâ€™s',
      phd: 'PhD',
      postdoc: 'Postdoc'
    };
    return map[level] || titleCase(level);
  }

  function formatRelative(dateValue) {
    if (!dateValue) return 'No date set';
    var now = new Date();
    var date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'Invalid date';

    var diff = Math.ceil((date.getTime() - now.getTime()) / 86400000);
    if (diff < 0) return Math.abs(diff) + ' day' + (Math.abs(diff) === 1 ? '' : 's') + ' overdue';
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    return diff + ' days left';
  }

  function formatMoney(value, currency) {
    if (value === null || value === undefined || value === '') return 'â€”';
    var number = Number(value);
    if (isNaN(number)) return 'â€”';
    return (currency || '') + number.toLocaleString();
  }

  function buildScholarshipKey(scholarship) {
    return String(scholarship.application_url || scholarship.info_url || scholarship.name || '').trim().toLowerCase();
  }

  function getScholarshipShortlistKeys() {
    return safeRead(SHORTLIST_KEY, [], localStorage) || [];
  }

  function readIeltsState() {
    return safeRead(IELTS_STATE_KEY, null, localStorage);
  }

  function mapProfileWithFallbacks(remote, cached, quick) {
      var merged = Object.assign({}, cached || {}, quick || {}, remote || {});
      merged.target_countries = uniqueStrings([]
        .concat((remote && remote.target_countries) || [])
        .concat((cached && cached.target_countries) || [])
        .concat((quick && quick.target_countries) || []));
      merged.target_fields = uniqueStrings([]
        .concat((remote && remote.target_fields) || [])
        .concat((cached && cached.target_fields) || [])
        .concat((quick && quick.target_fields) || []));
      return merged;
    }

  function mergeSignalsIntoProfile(profile) {
    var merged = Object.assign({}, profile || {});
    var ieltsState = cockpit.ieltsState;
    var latestBudget = cockpit.state.budgetSignals && cockpit.state.budgetSignals.length ? cockpit.state.budgetSignals[0] : null;
    var savedDestinations = cockpit.state.destinations || [];

    if (!merged.ielts_overall && ieltsState && ieltsState.lastOverall) {
      merged.ielts_overall = parseFloat(ieltsState.lastOverall);
    }

    if (!merged.target_study_level && latestBudget && latestBudget.level) {
      merged.target_study_level = latestBudget.level;
    }

    if ((!merged.target_countries || !merged.target_countries.length) && ieltsState && ieltsState.targetDestination) {
      merged.target_countries = [titleCase(ieltsState.targetDestination)];
    }

    if (latestBudget && latestBudget.destination) {
      merged.target_countries = uniqueStrings((merged.target_countries || []).concat([latestBudget.destination]));
    }

    if (savedDestinations.length) {
      merged.target_countries = uniqueStrings((merged.target_countries || []).concat(savedDestinations.map(function (destination) {
        return destination.name;
      })));
    }

    return merged;
  }

  function normalizeScholarshipDestination(country) {
      var key = String(country || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      var aliases = {
        uk: 'uk',
        'united-kingdom': 'uk',
        britain: 'uk',
        england: 'uk',
        scotland: 'uk',
        wales: 'uk',
        'great-britain': 'uk',
        us: 'us',
        usa: 'us',
        'united-states': 'us',
        america: 'us',
        eu: 'eu',
        europe: 'eu',
        germany: 'eu',
        france: 'eu',
        ireland: 'eu',
        netherlands: 'eu',
        belgium: 'eu',
        sweden: 'eu',
        finland: 'eu',
        norway: 'eu',
        denmark: 'eu',
        spain: 'eu',
        italy: 'eu',
        austria: 'eu',
        canada: 'canada',
        australia: 'australia'
      };

      return aliases[key] || key;
    }

    function buildMatcherProfile(profile) {
      return {
        gpa_value: profile.gpa_value || null,
        gpa_scale: profile.gpa_scale || null,
        ielts_overall: profile.ielts_overall || null,
        target_study_level: profile.target_study_level || null,
        target_fields: uniqueStrings(profile.target_fields || []),
        target_countries: uniqueStrings(profile.target_countries || []).reduce(function (acc, country) {
          var normalized = normalizeScholarshipDestination(country);
          if (normalized && acc.indexOf(normalized) === -1) {
            acc.push(normalized);
          }
          return acc;
        }, [])
      };
    }

  function extractActivity() {
    var history = safeRead('afro_tool_history', [], localStorage) || [];
    var labels = {
      'gpa-calculator': 'Updated GPA profile',
      'ielts-calculator': 'Updated IELTS pathway',
      'degree-checker': 'Checked degree readiness',
      'scholarship-finder': 'Worked scholarship flow',
      'study-abroad-cost': 'Updated cost plan',
      'student-budget': 'Updated monthly survival plan',
      'university-ranking': 'Updated university shortlist',
      'education-hub': 'Updated cockpit',
      'jamb-cbt': 'Took JAMB CBT mock',
      'jamb-score-predictor': 'Ran JAMB score predictor',
      'jamb-aggregate': 'Saved JAMB aggregate score'
    };

    return history.filter(function (item) {
      return labels[item.tool];
    }).slice(0, 8).map(function (item) {
      return {
        label: item.label || labels[item.tool],
        detail: item.detail || '',
        timestamp: item.timestamp || item.date || Date.now()
      };
    });
  }

  function computeCompletion(profile) {
    var fields = [
      'education_level',
      'institution',
      'target_study_level',
      'graduation_date',
      'gpa_value',
      'ielts_overall',
      'target_countries',
      'target_fields'
    ];

    var filled = 0;
    fields.forEach(function (field) {
      var value = profile[field];
      if (Array.isArray(value)) {
        if (value.length) filled += 1;
      } else if (value !== undefined && value !== null && value !== '') {
        filled += 1;
      }
    });

    return {
      filled: filled,
      total: fields.length,
      percent: Math.round((filled / fields.length) * 100)
    };
  }

  function hasDegreeReadinessSignal(signals) {
    var savedRoute = (signals.destinations || []).some(function (destination) {
      var href = destination && destination.href ? destination.href : '';
      var reason = destination && destination.reason ? destination.reason : '';
      return href.indexOf('/tools/degree-checker/') !== -1 || /degree/i.test(reason);
    });

    if (savedRoute) return true;

    return (signals.activity || []).some(function (item) {
      return item && item.label && /degree/i.test(item.label);
    });
  }

  function buildChecklist(profile, signals) {
    var shortlistCount = signals.shortlistItems.length;
    var destinationsCount = signals.destinations.length;
    var universitiesCount = signals.universities.length;
    var budgetCount = signals.budgetSignals.length;
    var deadlineCount = signals.deadlines.length;
    var wantsStudyAbroad = destinationsCount > 0 || (profile.target_countries && profile.target_countries.length > 0);
    var hasScholarMatches = signals.goodMatches > 0;
    var hasDegreeReadiness = hasDegreeReadinessSignal(signals);

    return [
      {
        key: 'profile',
        title: 'Complete your student profile',
        complete: signals.completion.percent >= 60,
        hint: signals.completion.percent >= 60 ? 'Core profile fields are in place.' : 'Add level, institution, target countries, and fields.',
        href: '#profile-editor'
      },
      {
        key: 'gpa',
        title: 'Set your GPA',
        complete: !!profile.gpa_value,
        hint: profile.gpa_value ? 'Current GPA: ' + Number(profile.gpa_value).toFixed(2) + (profile.gpa_scale ? ' / ' + profile.gpa_scale : '') : 'Use the GPA calculator to push your current standing into the cockpit.',
        href: '/tools/gpa-calculator/'
      },
      {
        key: 'ielts',
        title: 'Add IELTS target or score',
        complete: !wantsStudyAbroad || !!profile.ielts_overall,
        hint: profile.ielts_overall ? 'IELTS on file: ' + Number(profile.ielts_overall).toFixed(1) : 'Needed for most study-abroad and many scholarship routes.',
        href: '/tools/ielts-calculator/'
      },
      {
        key: 'degree-readiness',
        title: 'Validate degree readiness',
        complete: !wantsStudyAbroad || hasDegreeReadiness,
        hint: hasDegreeReadiness ? 'A destination-readiness check is already on file.' : 'Use Degree Checker when qualification fit still needs validation.',
        href: '/tools/degree-checker/'
      },
      {
        key: 'scholarships',
        title: 'Build your scholarship shortlist',
        complete: shortlistCount > 0,
        hint: shortlistCount > 0 ? shortlistCount + ' saved scholarship' + (shortlistCount === 1 ? '' : 's') : (hasScholarMatches ? signals.goodMatches + ' good matches available right now.' : 'Run Scholarship Finder after profile setup.'),
        href: '/tools/scholarship-finder/'
      },
      {
        key: 'universities',
        title: 'Save universities or schools',
        complete: universitiesCount >= 3,
        hint: universitiesCount ? universitiesCount + ' saved so far.' : 'Use University Rankings to build the shortlist or quick-add your own school.',
        href: '/tools/university-ranking/'
      },
      {
        key: 'destinations',
        title: 'Set destinations',
        complete: destinationsCount > 0,
        hint: destinationsCount ? destinationsCount + ' destination' + (destinationsCount === 1 ? '' : 's') + ' on file.' : 'Add destinations you are seriously considering.',
        href: '/tools/study-abroad-cost/'
      },
      {
        key: 'budget',
        title: 'Estimate a real cost signal',
        complete: budgetCount > 0,
        hint: budgetCount ? 'Recent cost plan saved to the cockpit.' : 'Study Abroad Cost can save a live affordability signal here.',
        href: '/tools/study-abroad-cost/'
      },
      {
        key: 'deadlines',
        title: 'Track a deadline',
        complete: deadlineCount > 0,
        hint: deadlineCount ? deadlineCount + ' upcoming date' + (deadlineCount === 1 ? '' : 's') + ' tracked.' : 'Add the next application or test milestone.',
        href: '#deadline-form'
      }
    ];
  }

  function buildNextActions(profile, signals) {
    var actions = [];
    var topMatch = signals.matches && signals.matches.length ? signals.matches[0] : null;

    if (signals.completion.percent < 50) {
      actions.push({
        title: 'Complete the core profile first',
        copy: 'Your cockpit is still missing the basics that make recommendations sharper: level, field, destination, and institution.',
        href: '#profile-editor',
        cta: 'Update profile'
      });
    }

    if (!profile.gpa_value) {
      actions.push({
        title: 'Set your GPA',
        copy: 'GPA is still missing, which weakens scholarship, study-abroad, and university-fit guidance across the hub.',
        href: '/tools/gpa-calculator/',
        cta: 'Open GPA calculator'
      });
    }

    if ((profile.target_countries || []).length && !profile.ielts_overall) {
      actions.push({
        title: 'Add your IELTS pathway target',
        copy: 'You already have destination intent, but the hub cannot judge your English readiness yet.',
        href: '/tools/ielts-calculator/',
        cta: 'Plan IELTS'
      });
    }

    if (signals.goodMatches > 0 && signals.shortlistItems.length === 0) {
      actions.push({
        title: 'Turn matches into a shortlist',
        copy: 'You have ' + signals.goodMatches + ' stronger scholarship matches available. Save the best ones so the cockpit can track them.',
        href: '/tools/scholarship-finder/',
        cta: 'Review scholarship matches'
      });
    }

    if (signals.universities.length === 0) {
      actions.push({
        title: 'Save your first universities',
        copy: 'A real application plan usually starts with 3-5 schools. Build the shortlist in University Rankings, then keep the saved schools here.',
        href: '/tools/university-ranking/',
        cta: 'Build shortlist'
      });
    }

    if (signals.destinations.length > 0 && signals.budgetSignals.length === 0) {
      actions.push({
        title: 'Translate destinations into real costs',
        copy: 'You have destination intent on file, but no affordability signal yet. Run one cost scenario so the hub can compare paths.',
        href: '/tools/study-abroad-cost/',
        cta: 'Estimate study abroad cost'
      });
    }

    if (signals.deadlines.length === 0) {
      actions.push({
        title: 'Track the next deadline',
        copy: 'The cockpit gets more valuable when a real application, test, or scholarship date is attached to the plan.',
        href: '#deadline-form',
        cta: 'Add deadline'
      });
    }

    if (!actions.length && topMatch) {
      actions.push({
        title: 'Push from planning into applications',
        copy: 'Your profile is in good shape. Keep refining your shortlist and validate deadlines, costs, and entry requirements for your strongest routes.',
        href: '/tools/scholarship-finder/',
        cta: 'Open scholarship workflow'
      });
    }

    return actions.slice(0, 4);
  }

  function resolveScholarshipShortlist(allScholarships, shortlistKeys) {
    if (!shortlistKeys.length) return [];
    var lookup = {};
    allScholarships.forEach(function (scholarship) {
      lookup[buildScholarshipKey(scholarship)] = scholarship;
    });

    return shortlistKeys.map(function (key) {
      return lookup[key];
    }).filter(Boolean);
  }

  function loadScholarships() {
    return fetch('/api/scholarships').then(function (response) {
      if (!response.ok) throw new Error('scholarship feed unavailable');
      return response.json();
    }).then(function (data) {
      if (data && data.scholarships && data.scholarships.length) return data.scholarships;
      throw new Error('empty scholarship feed');
    }).catch(function () {
      return fallbackScholarships.slice();
    });
  }

  function renderHero(signals) {
    getEl('heroCompletion').textContent = signals.completion.percent + '%';
    getEl('heroMatches').textContent = String(signals.goodMatches);
    getEl('heroSchools').textContent = String(signals.universities.length);
    getEl('heroDeadlines').textContent = String(signals.deadlines.length);

    var primaryAction = signals.nextActions[0];
    if (primaryAction) {
      getEl('nextActionTitle').textContent = primaryAction.title;
      getEl('nextActionCopy').textContent = primaryAction.copy;
      getEl('nextActionPrimary').textContent = primaryAction.cta;
      getEl('nextActionPrimary').setAttribute('href', primaryAction.href);
    }

    getEl('heroModeBadge').textContent = signals.profileMode;
  }

  function renderProfile(profile, signals) {
    getEl('profileModeBadge').textContent = signals.profileMode;
    getEl('profileCompletionValue').textContent = signals.completion.percent + '%';
    getEl('profileCompletionFill').style.width = signals.completion.percent + '%';
    getEl('profileStatusCopy').textContent = signals.profileStatusCopy;
    getEl('profileGpaValue').textContent = profile.gpa_value ? Number(profile.gpa_value).toFixed(2) + (profile.gpa_scale ? ' / ' + profile.gpa_scale : '') : 'Set GPA';
    getEl('profileIeltsValue').textContent = profile.ielts_overall ? Number(profile.ielts_overall).toFixed(1) : 'Add IELTS';
    getEl('profileJambValue').textContent = signals.jambDisplay;
    getEl('profileDestinationValue').textContent = signals.destinations.length ? signals.destinations.map(function (destination) { return destination.name; }).slice(0, 2).join(', ') : 'Set destinations';

    var tags = [];
    if (profile.education_level) tags.push({ label: formatStudyLevel(profile.education_level), tone: 'blue' });
    if (profile.target_study_level) tags.push({ label: formatStudyLevel(profile.target_study_level), tone: 'gold' });
    if (profile.institution) tags.push({ label: profile.institution, tone: 'slate' });
    if (profile.target_fields && profile.target_fields.length) {
      profile.target_fields.slice(0, 3).forEach(function (field) {
        tags.push({ label: titleCase(field), tone: 'green' });
      });
    }

    getEl('profileHighlights').innerHTML = tags.length ? tags.map(function (tag) {
      return '<span class="hub-pill hub-pill-' + tag.tone + '">' + escapeHtml(tag.label) + '</span>';
    }).join('') : '<span class="hub-empty-inline">No profile tags yet. Start with level, field, or destination.</span>';

    getEl('syncHint').innerHTML = signals.remoteProfile
      ? 'Account sync is active. This cockpit can travel with your login.'
      : 'Working in local cockpit mode on this device. <a href="#" data-action="open-auth">Sign in</a> to sync across devices.';

    getEl('edLevel').value = profile.education_level || '';
    getEl('edInstitution').value = profile.institution || '';
    getEl('edGradDate').value = profile.graduation_date || '';
    getEl('edCountries').value = uniqueStrings(profile.target_countries || []).join(', ');
    getEl('edFields').value = uniqueStrings(profile.target_fields || []).join(', ');
    getEl('edStudyLevel').value = profile.target_study_level || '';
  }

  function renderChecklist(signals) {
    var completed = signals.checklist.filter(function (item) { return item.complete; }).length;
    getEl('checklistCount').textContent = completed + '/' + signals.checklist.length;
    getEl('checklistProgressFill').style.width = Math.round((completed / signals.checklist.length) * 100) + '%';

    getEl('checklistList').innerHTML = signals.checklist.map(function (item) {
      return '<a class="hub-check-item' + (item.complete ? ' is-complete' : '') + '" href="' + escapeHtml(item.href) + '">' +
        '<span class="hub-check-mark">' + (item.complete ? '&#10003;' : '&#10132;') + '</span>' +
        '<span class="hub-check-copy"><strong>' + escapeHtml(item.title) + '</strong><span>' + escapeHtml(item.hint) + '</span></span>' +
      '</a>';
    }).join('');
  }

  function renderScholarships(signals) {
    getEl('scholarshipPrimaryCount').textContent = String(signals.goodMatches);
    getEl('scholarshipShortlistCount').textContent = String(signals.shortlistItems.length);
    getEl('scholarshipMatchesCount').textContent = String(signals.matches.length);

    var sourceList = signals.shortlistItems.length ? signals.shortlistItems : signals.matches.slice(0, 4).map(function (match) {
      return match.scholarship;
    });

    getEl('scholarshipSummaryText').textContent = signals.shortlistItems.length
      ? 'You already saved scholarships into a shortlist. Use this card to keep the best ones visible while the hub pushes the next action.'
      : (signals.goodMatches
        ? 'You already have stronger scholarship matches. The next move is to review fit and save the best routes into your shortlist.'
        : 'The hub will show stronger scholarship signals after your GPA, destination, and IELTS profile are clearer.');

    getEl('scholarshipList').innerHTML = sourceList.length ? sourceList.map(function (scholarship) {
      var match = signals.matches.find(function (result) {
        return buildScholarshipKey(result.scholarship) === buildScholarshipKey(scholarship);
      });
      var fit = match ? match.category : (signals.shortlistItems.length ? 'Saved shortlist' : 'Needs fuller profile');
      var fitClass = match ? match.categoryClass : 'match-possible';
      return '<article class="hub-mini-card">' +
        '<div class="hub-mini-top"><span class="hub-fit ' + fitClass + '">' + escapeHtml(fit) + '</span><span class="hub-mini-meta">' + escapeHtml((scholarship.funding || '').toUpperCase() || 'FUNDING') + '</span></div>' +
        '<h4>' + escapeHtml(scholarship.name) + '</h4>' +
        '<p>' + escapeHtml(scholarship.provider || 'Scholarship provider') + '</p>' +
        '<div class="hub-mini-links"><a href="/tools/scholarship-finder/">Open workflow</a>' +
        (scholarship.info_url ? '<a href="' + escapeHtml(scholarship.info_url) + '" target="_blank" rel="noopener">Official details</a>' : '') +
        '</div>' +
      '</article>';
    }).join('') : '<div class="hub-empty-block">No saved scholarships yet. Run Scholarship Finder, save the strongest routes, and they will appear here.</div>';
  }

  function renderUniversities(signals) {
    getEl('universityList').innerHTML = signals.universities.length ? signals.universities.map(function (university) {
      var meta = [];
      if (university.fitLabel) meta.push(university.fitLabel);
      if (university.country) meta.push(university.country);
      if (university.rank) meta.push('Rank ' + university.rank);
      if (university.feesLabel) meta.push(university.feesLabel);
      if (university.note) meta.push(university.note);
      return '<article class="hub-object-card">' +
        '<div class="hub-object-copy"><h4>' + escapeHtml(university.name) + '</h4><p>' + escapeHtml(meta.join(' Â· ') || 'Saved university') + '</p></div>' +
        '<div class="hub-object-actions">' +
          '<a href="' + escapeHtml(university.href || '/tools/university-ranking/') + '">Open</a>' +
          '<button type="button" data-action="remove-university" data-id="' + escapeHtml(university.id) + '">Remove</button>' +
        '</div>' +
      '</article>';
    }).join('') : '<div class="hub-empty-block">No universities saved yet. Save them from the University Shortlist Builder or add one manually below.</div>';
  }

  function renderDestinations(signals) {
    getEl('destinationList').innerHTML = signals.destinations.length ? signals.destinations.map(function (destination) {
      var detail = [];
      if (destination.reason) detail.push(destination.reason);
      if (destination.studyLevel) detail.push(formatStudyLevel(destination.studyLevel));
      return '<article class="hub-object-card">' +
        '<div class="hub-object-copy"><h4>' + escapeHtml(destination.name) + '</h4><p>' + escapeHtml(detail.join(' Â· ') || 'Saved destination') + '</p></div>' +
        '<div class="hub-object-actions">' +
          '<a href="' + escapeHtml(destination.href || '/tools/study-abroad-cost/') + '">Open route</a>' +
          '<button type="button" data-action="remove-destination" data-id="' + escapeHtml(destination.id) + '">Remove</button>' +
        '</div>' +
      '</article>';
    }).join('') : '<div class="hub-empty-block">No destinations saved yet. Add them here or let the cost calculator push them back into the cockpit.</div>';
  }

  function renderBudgetSignals(signals) {
    getEl('budgetSignalList').innerHTML = signals.budgetSignals.length ? signals.budgetSignals.map(function (signal) {
      return '<article class="hub-budget-card">' +
        '<div class="hub-budget-top"><strong>' + escapeHtml(signal.destination) + '</strong><span>' + escapeHtml(formatStudyLevel(signal.level || '')) + '</span></div>' +
        '<div class="hub-budget-grid">' +
          '<div><label>Annual</label><strong>' + escapeHtml(formatMoney(signal.annualTotal, signal.currency)) + '</strong></div>' +
          '<div><label>Total</label><strong>' + escapeHtml(formatMoney(signal.totalCost, signal.currency)) + '</strong></div>' +
        '</div>' +
        '<p>' + escapeHtml((signal.field ? titleCase(signal.field) + ' Â· ' : '') + (signal.years ? signal.years + ' year plan' : 'Saved cost signal')) + '</p>' +
        '<div class="hub-object-actions"><a href="' + escapeHtml(signal.href || '/tools/study-abroad-cost/') + '">Review plan</a>' +
        '<button type="button" data-action="remove-budget" data-id="' + escapeHtml(signal.id) + '">Remove</button></div>' +
      '</article>';
    }).join('') : '<div class="hub-empty-block">No cost signals yet. Run Student Budget Planner or Study Abroad Cost and the most recent estimate will land here.</div>';
  }

  function renderTimeline(signals) {
    getEl('deadlineList').innerHTML = signals.deadlines.length ? signals.deadlines.map(function (deadline) {
      return '<article class="hub-object-card">' +
        '<div class="hub-object-copy"><h4>' + escapeHtml(deadline.title) + '</h4><p>' + escapeHtml(formatRelative(deadline.date) + (deadline.route ? ' Â· ' + deadline.route : '')) + '</p></div>' +
        '<div class="hub-object-actions">' +
          (deadline.href ? '<a href="' + escapeHtml(deadline.href) + '">Open</a>' : '<span class="hub-inline-muted">' + escapeHtml(deadline.date) + '</span>') +
          '<button type="button" data-action="remove-deadline" data-id="' + escapeHtml(deadline.id) + '">Remove</button>' +
        '</div>' +
      '</article>';
    }).join('') : '<div class="hub-empty-block">No deadlines tracked yet. Add the next application, exam, or scholarship date so the cockpit can keep the plan grounded.</div>';
  }

  function renderNextActions(signals) {
    var actions = signals.nextActions.slice(1);
    getEl('nextActionList').innerHTML = actions.length ? actions.map(function (action) {
      return '<a class="hub-action-item" href="' + escapeHtml(action.href) + '">' +
        '<strong>' + escapeHtml(action.title) + '</strong>' +
        '<span>' + escapeHtml(action.copy) + '</span>' +
      '</a>';
    }).join('') : '<div class="hub-empty-inline">No secondary actions right now. Stay on top of deadlines and refine your shortlists.</div>';
  }

  function renderReadiness(signals) {
    var cards = [
      {
        title: 'GPA',
        status: cockpit.profile.gpa_value ? 'On file' : 'Missing',
        detail: cockpit.profile.gpa_value ? Number(cockpit.profile.gpa_value).toFixed(2) + (cockpit.profile.gpa_scale ? ' / ' + cockpit.profile.gpa_scale : '') : 'Use GPA Calculator',
        href: '/tools/gpa-calculator/',
        tone: cockpit.profile.gpa_value ? 'good' : 'warn'
      },
      {
        title: 'IELTS',
        status: cockpit.profile.ielts_overall ? 'Planned' : 'Not set',
        detail: cockpit.profile.ielts_overall ? 'Overall ' + Number(cockpit.profile.ielts_overall).toFixed(1) : 'Set destination and benchmark',
        href: '/tools/ielts-calculator/',
        tone: cockpit.profile.ielts_overall ? 'good' : 'warn'
      },
      {
        title: 'JAMB / Exams',
        status: signals.jambStatus,
        detail: signals.jambDetail,
        href: signals.jambHref,
        tone: signals.jambTone
      }
    ];

    getEl('readinessList').innerHTML = cards.map(function (card) {
      return '<a class="hub-readiness-card" href="' + escapeHtml(card.href) + '">' +
        '<span class="hub-fit hub-fit-' + escapeHtml(card.tone) + '">' + escapeHtml(card.status) + '</span>' +
        '<strong>' + escapeHtml(card.title) + '</strong>' +
        '<p>' + escapeHtml(card.detail) + '</p>' +
      '</a>';
    }).join('');
  }

  function renderStudyRoute(signals) {
    var degreeReady = hasDegreeReadinessSignal(signals);
    var route = [
      { label: 'IELTS Pathway', href: '/tools/ielts-calculator/', complete: !!cockpit.profile.ielts_overall, detail: cockpit.profile.ielts_overall ? 'Score synced into cockpit' : 'Needed for many international routes' },
      { label: 'Degree Check', href: '/tools/degree-checker/', complete: degreeReady, detail: degreeReady ? 'Destination-readiness route saved' : 'Validate qualification fit before you commit' },
      { label: 'University Shortlist', href: '/tools/university-ranking/', complete: signals.universities.length > 0, detail: signals.universities.length ? signals.universities.length + ' school' + (signals.universities.length === 1 ? '' : 's') + ' saved' : 'Save schools into cockpit' },
      { label: 'Cost Signal', href: '/tools/study-abroad-cost/', complete: signals.budgetSignals.length > 0, detail: signals.budgetSignals.length ? 'Recent affordability plan saved' : 'Estimate total cost by destination' },
      { label: 'Scholarship Flow', href: '/tools/scholarship-finder/', complete: signals.shortlistItems.length > 0, detail: signals.shortlistItems.length ? 'Shortlist active' : 'Turn matches into saved funding routes' }
    ];

    getEl('studyRouteList').innerHTML = route.map(function (step) {
      return '<a class="hub-route-step' + (step.complete ? ' is-complete' : '') + '" href="' + escapeHtml(step.href) + '">' +
        '<span class="hub-route-mark">' + (step.complete ? '&#10003;' : '&#8226;') + '</span>' +
        '<span><strong>' + escapeHtml(step.label) + '</strong><small>' + escapeHtml(step.detail) + '</small></span>' +
      '</a>';
    }).join('');
  }

  function renderActivity(signals) {
    getEl('activityFeed').innerHTML = signals.activity.length ? signals.activity.map(function (item) {
      return '<div class="hub-activity-item">' +
        '<span><strong>' + escapeHtml(item.label) + '</strong>' + (item.detail ? '<small>' + escapeHtml(item.detail) + '</small>' : '') + '</span>' +
        '<time>' + escapeHtml(formatRelative(item.timestamp)) + '</time>' +
      '</div>';
    }).join('') : '<div class="hub-empty-block">No recent education activity yet. As you use GPA, degree checks, IELTS, scholarships, or cost tools, the cockpit timeline will update here.</div>';
  }

  function buildSignals() {
    var profile = cockpit.profile;
    var completion = computeCompletion(profile);
    var universities = (cockpit.state.universities || []).slice().sort(function (left, right) {
      return (right.savedAt || 0) - (left.savedAt || 0);
    });
    var destinations = uniqueStrings((profile.target_countries || []).concat((cockpit.state.destinations || []).map(function (item) {
      return item.name;
    }))).map(function (name) {
      var existing = (cockpit.state.destinations || []).find(function (destination) {
        return destination.name === name;
      });
      return existing || { id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name: name, href: '/tools/study-abroad-cost/' };
    });
    var budgetSignals = (cockpit.state.budgetSignals || []).slice().sort(function (left, right) {
      return (right.savedAt || 0) - (left.savedAt || 0);
    });
    var deadlines = (cockpit.state.deadlines || []).slice().sort(function (left, right) {
      return new Date(left.date || '2099-12-31') - new Date(right.date || '2099-12-31');
    });
    var matches = cockpit.matches || [];
    var shortlistItems = cockpit.shortlistItems || [];
    var goodMatches = matches.filter(function (match) { return match.percent >= 60; }).length;
    var profileMode = cockpit.remoteProfile ? 'Account cockpit' : (completion.percent > 0 ? 'Local cockpit' : 'Start cockpit');
    var profileStatusCopy = cockpit.remoteProfile
      ? 'Your account-backed profile is shaping the cockpit across scholarships, tests, and destinations.'
      : (completion.percent > 0
        ? 'You already have local signals on this device. Keep building and sign in later if you want sync.'
        : 'Start with the profile and the hub will turn your tools into one connected journey.');
    var jamb = cockpit.jamb || {};
    var jambDisplay = jamb.jambScore ? String(jamb.jambScore) : (jamb.bestMockAggregate ? jamb.bestMockAggregate + ' mock' : 'Set route');
    var jambStatus = jamb.jambScore ? 'Tracked' : (jamb.mockCount ? 'In progress' : 'Not started');
    var jambDetail = jamb.jambScore ? 'Aggregate score on file' : (jamb.mockCount ? jamb.mockCount + ' mock' + (jamb.mockCount === 1 ? '' : 's') + ' recorded' : 'Route into AfroJAMB or University Admission');
    var jambTone = jamb.jambScore ? 'good' : (jamb.mockCount ? 'ok' : 'warn');
    var jambHref = jamb.mockCount ? '/jamb/' : '/tools/university-admission/';

    var signals = {
      completion: completion,
      universities: universities,
      destinations: destinations,
      budgetSignals: budgetSignals,
      deadlines: deadlines,
      matches: matches,
      shortlistItems: shortlistItems,
      goodMatches: goodMatches,
      activity: cockpit.activity || [],
      profileMode: profileMode,
      profileStatusCopy: profileStatusCopy,
      remoteProfile: cockpit.remoteProfile,
      jambDisplay: jambDisplay,
      jambStatus: jambStatus,
      jambDetail: jambDetail,
      jambTone: jambTone,
      jambHref: jambHref
    };

    signals.checklist = buildChecklist(profile, signals);
    signals.nextActions = buildNextActions(profile, signals);
    return signals;
  }

  function rerender() {
    var signals = buildSignals();
    renderHero(signals);
    renderProfile(cockpit.profile, signals);
    renderChecklist(signals);
    renderScholarships(signals);
    renderUniversities(signals);
    renderDestinations(signals);
    renderBudgetSignals(signals);
    renderTimeline(signals);
    renderNextActions(signals);
    renderReadiness(signals);
    renderStudyRoute(signals);
    renderActivity(signals);
  }

  function formatStudyLevel(level) {
    var map = {
      secondary: 'Secondary',
      undergraduate: 'Undergraduate',
      undergrad: 'Undergraduate',
      bachelors: 'Undergraduate',
      postgraduate: 'Postgraduate',
      masters: "Master's",
      phd: 'PhD',
      postdoc: 'Postdoc'
    };
    return map[level] || titleCase(level);
  }

  function getDaysUntil(dateValue) {
    if (!dateValue) return null;
    var now = new Date();
    var date = new Date(dateValue);
    if (isNaN(date.getTime())) return null;
    return Math.ceil((date.getTime() - now.getTime()) / 86400000);
  }

  function formatTimeAgo(timestamp) {
    var date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Recently';
    var diffMs = Date.now() - date.getTime();
    var diffDays = Math.floor(diffMs / 86400000);
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return diffDays + ' days ago';
    var diffMonths = Math.floor(diffDays / 30);
    if (diffMonths <= 1) return '1 month ago';
    return diffMonths + ' months ago';
  }

  function notify(message, type) {
    if (window.AfroToast && typeof window.AfroToast.show === 'function') {
      window.AfroToast.show(message, type || 'success');
    }
  }

  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function renderHero(signals) {
    var primaryAction = signals.nextActions[0];

    getEl('heroCompletion').textContent = signals.completion.percent + '%';
    getEl('heroMatches').textContent = String(signals.goodMatches);
    getEl('heroSchools').textContent = String(signals.universities.length);
    getEl('heroDeadlines').textContent = String(signals.deadlines.length);
    getEl('heroModeBadge').textContent = signals.profileMode;

    if (getEl('heroStatusCopy')) {
      getEl('heroStatusCopy').textContent = signals.profileStatusCopy;
    }

    if (primaryAction) {
      getEl('nextActionTitle').textContent = primaryAction.title;
      getEl('nextActionCopy').textContent = primaryAction.copy;
      getEl('nextActionPrimary').textContent = primaryAction.cta;
      getEl('nextActionPrimary').setAttribute('href', primaryAction.href);
    }
  }

  function buildNextActions(profile, signals) {
    var actions = [];
    var topMatch = signals.matches && signals.matches.length ? signals.matches[0] : null;
    var nextDeadline = signals.deadlines.length ? signals.deadlines[0] : null;
    var daysUntilNextDeadline = nextDeadline ? getDaysUntil(nextDeadline.date) : null;
    var hasDegreeReadiness = hasDegreeReadinessSignal(signals);

    if (daysUntilNextDeadline !== null && daysUntilNextDeadline <= 21) {
      actions.push({
        title: nextDeadline.title + ' is coming up',
        copy: 'You have ' + formatRelative(nextDeadline.date).toLowerCase() + '. Use the cockpit to keep the plan moving before the deadline slips.',
        href: nextDeadline.href || '#deadline-form',
        cta: 'Review deadline'
      });
    }

    if (signals.completion.percent < 50) {
      actions.push({
        title: 'Complete the core profile first',
        copy: 'Your cockpit is still missing the basics that make recommendations sharper: level, field, destination, and institution.',
        href: '#profile-editor',
        cta: 'Update profile'
      });
    }

    if (!profile.gpa_value) {
      actions.push({
        title: 'Set your GPA',
        copy: 'GPA is still missing, which weakens scholarship, study-abroad, and university-fit guidance across the hub.',
        href: '/tools/gpa-calculator/',
        cta: 'Open GPA calculator'
      });
    }

    if ((profile.target_countries || []).length && !profile.ielts_overall) {
      actions.push({
        title: 'Add your IELTS pathway target',
        copy: 'You already have destination intent, but the hub cannot judge your English readiness yet.',
        href: '/tools/ielts-calculator/',
        cta: 'Plan IELTS'
      });
    }

    if ((profile.target_countries || []).length && !hasDegreeReadiness) {
      actions.push({
        title: 'Validate your degree route',
        copy: 'You already have destination intent, but the cockpit still lacks a degree-readiness signal for those routes.',
        href: '/tools/degree-checker/',
        cta: 'Check degree readiness'
      });
    }

    if (signals.goodMatches > 0 && signals.shortlistItems.length === 0) {
      actions.push({
        title: 'Turn matches into a shortlist',
        copy: 'You have ' + signals.goodMatches + ' stronger scholarship matches available. Save the best ones so the cockpit can track them.',
        href: '/tools/scholarship-finder/',
        cta: 'Review scholarship matches'
      });
    }

    if (signals.universities.length === 0) {
      actions.push({
        title: 'Save your first universities',
        copy: 'A real application plan usually starts with 3-5 schools. Build the shortlist in University Rankings, then keep the saved schools here.',
        href: '/tools/university-ranking/',
        cta: 'Build shortlist'
      });
    }

    if (signals.destinations.length > 0 && signals.budgetSignals.length === 0) {
      actions.push({
        title: 'Translate destinations into real costs',
        copy: 'You have destination intent on file, but no affordability signal yet. Run one cost scenario so the hub can compare paths.',
        href: '/tools/study-abroad-cost/',
        cta: 'Estimate study abroad cost'
      });
    }

    if (signals.deadlines.length === 0) {
      actions.push({
        title: 'Track the next deadline',
        copy: 'The cockpit gets more valuable when a real application, test, or scholarship date is attached to the plan.',
        href: '#deadline-form',
        cta: 'Add deadline'
      });
    }

    if (!actions.length && topMatch) {
      actions.push({
        title: 'Push from planning into applications',
        copy: 'Your profile is in good shape. Keep refining your shortlist and validate deadlines, costs, and entry requirements for your strongest routes.',
        href: '/tools/scholarship-finder/',
        cta: 'Open scholarship workflow'
      });
    }

    if (!actions.length) {
      actions.push({
        title: 'Keep the cockpit current',
        copy: 'You have a solid setup. Refresh scores, budgets, and deadlines as your plan changes.',
        href: '#profile-editor',
        cta: 'Review cockpit'
      });
    }

    return actions.slice(0, 4);
  }

  function renderActivity(signals) {
    getEl('activityFeed').innerHTML = signals.activity.length ? signals.activity.map(function (item) {
      return '<div class="hub-activity-item">' +
        '<span><strong>' + escapeHtml(item.label) + '</strong>' + (item.detail ? '<small>' + escapeHtml(item.detail) + '</small>' : '') + '</span>' +
        '<time>' + escapeHtml(formatTimeAgo(item.timestamp)) + '</time>' +
      '</div>';
    }).join('') : '<div class="hub-empty-block">No recent education activity yet. As you use GPA, degree checks, IELTS, scholarships, or cost tools, the cockpit timeline will update here.</div>';
  }

  function formatMoney(value, currency) {
    if (value === null || value === undefined || value === '') return '-';
    var number = Number(value);
    if (isNaN(number)) return '-';
    return (currency || '') + number.toLocaleString();
  }

  function renderUniversities(signals) {
    getEl('universityList').innerHTML = signals.universities.length ? signals.universities.map(function (university) {
      var meta = [];
      if (university.fitLabel) meta.push(university.fitLabel);
      if (university.country) meta.push(university.country);
      if (university.rank) meta.push('Rank ' + university.rank);
      if (university.feesLabel) meta.push(university.feesLabel);
      if (university.note) meta.push(university.note);
      return '<article class="hub-object-card">' +
        '<div class="hub-object-copy"><h4>' + escapeHtml(university.name) + '</h4><p>' + escapeHtml(meta.join(' - ') || 'Saved university') + '</p></div>' +
        '<div class="hub-object-actions">' +
          '<a href="' + escapeHtml(university.href || '/tools/university-ranking/') + '">Open</a>' +
          '<button type="button" data-action="remove-university" data-id="' + escapeHtml(university.id) + '">Remove</button>' +
        '</div>' +
      '</article>';
    }).join('') : '<div class="hub-empty-block">No universities saved yet. Save them from the University Shortlist Builder or add one manually below.</div>';
  }

  function renderDestinations(signals) {
    getEl('destinationList').innerHTML = signals.destinations.length ? signals.destinations.map(function (destination) {
      var detail = [];
      if (destination.reason) detail.push(destination.reason);
      if (destination.studyLevel) detail.push(formatStudyLevel(destination.studyLevel));
      return '<article class="hub-object-card">' +
        '<div class="hub-object-copy"><h4>' + escapeHtml(destination.name) + '</h4><p>' + escapeHtml(detail.join(' - ') || 'Saved destination') + '</p></div>' +
        '<div class="hub-object-actions">' +
          '<a href="' + escapeHtml(destination.href || '/tools/study-abroad-cost/') + '">Open route</a>' +
          '<button type="button" data-action="remove-destination" data-id="' + escapeHtml(destination.id) + '">Remove</button>' +
        '</div>' +
      '</article>';
    }).join('') : '<div class="hub-empty-block">No destinations saved yet. Add them here or let the cost calculator push them back into the cockpit.</div>';
  }

  function renderBudgetSignals(signals) {
    getEl('budgetSignalList').innerHTML = signals.budgetSignals.length ? signals.budgetSignals.map(function (signal) {
      return '<article class="hub-budget-card">' +
        '<div class="hub-budget-top"><strong>' + escapeHtml(signal.destination) + '</strong><span>' + escapeHtml(formatStudyLevel(signal.level || '')) + '</span></div>' +
        '<div class="hub-budget-grid">' +
          '<div><label>Annual</label><strong>' + escapeHtml(formatMoney(signal.annualTotal, signal.currency)) + '</strong></div>' +
          '<div><label>Total</label><strong>' + escapeHtml(formatMoney(signal.totalCost, signal.currency)) + '</strong></div>' +
        '</div>' +
        '<p>' + escapeHtml((signal.field ? titleCase(signal.field) + ' - ' : '') + (signal.years ? signal.years + ' year plan' : 'Saved cost signal')) + '</p>' +
        '<div class="hub-object-actions"><a href="' + escapeHtml(signal.href || '/tools/study-abroad-cost/') + '">Review plan</a>' +
        '<button type="button" data-action="remove-budget" data-id="' + escapeHtml(signal.id) + '">Remove</button></div>' +
      '</article>';
    }).join('') : '<div class="hub-empty-block">No cost signals yet. Run Student Budget Planner or Study Abroad Cost and the most recent estimate will land here.</div>';
  }

  function renderTimeline(signals) {
    getEl('deadlineList').innerHTML = signals.deadlines.length ? signals.deadlines.map(function (deadline) {
      return '<article class="hub-object-card">' +
        '<div class="hub-object-copy"><h4>' + escapeHtml(deadline.title) + '</h4><p>' + escapeHtml(formatRelative(deadline.date) + (deadline.route ? ' - ' + deadline.route : '')) + '</p></div>' +
        '<div class="hub-object-actions">' +
          (deadline.href ? '<a href="' + escapeHtml(deadline.href) + '">Open</a>' : '<span class="hub-inline-muted">' + escapeHtml(deadline.date || '') + '</span>') +
          '<button type="button" data-action="remove-deadline" data-id="' + escapeHtml(deadline.id) + '">Remove</button>' +
        '</div>' +
      '</article>';
    }).join('') : '<div class="hub-empty-block">No deadlines tracked yet. Add the next application, exam, or scholarship date so the cockpit can keep the plan grounded.</div>';
  }

  function saveProfileEdits() {
    var data = {
      education_level: getEl('edLevel').value || undefined,
      institution: getEl('edInstitution').value.trim() || undefined,
      graduation_date: getEl('edGradDate').value || undefined,
      target_countries: uniqueStrings((getEl('edCountries').value || '').split(',')),
      target_fields: uniqueStrings((getEl('edFields').value || '').split(',')),
      target_study_level: getEl('edStudyLevel').value || undefined
    };

    if (window.EduProfileSync && typeof window.EduProfileSync.update === 'function') {
      window.EduProfileSync.update(data);
    }

    cockpit.profile = mergeSignalsIntoProfile(Object.assign({}, cockpit.profile, data));
    if (window.AfroEdu && typeof window.AfroEdu.recordActivity === 'function') {
      window.AfroEdu.recordActivity('education-hub', 'Updated cockpit profile', 'Profile fields refreshed');
    }
    notify('Education Hub profile updated', 'success');
    rerender();
  }

  function addManualUniversity() {
    var name = getEl('manualUniversityName').value.trim();
    var country = getEl('manualUniversityCountry').value.trim();
    var note = getEl('manualUniversityNote').value.trim();

    if (!name) {
      notify('Add a university name first', 'warning');
      return;
    }

    if (window.AfroEdu && typeof window.AfroEdu.saveUniversity === 'function') {
      window.AfroEdu.saveUniversity({
        id: slugify(name),
        name: name,
        country: country,
        feesLabel: note,
        href: '/tools/university-ranking/',
        savedAt: Date.now()
      });
      window.AfroEdu.recordActivity('education-hub', 'Saved university', name);
    }

    if (window.AfroEdu && typeof window.AfroEdu.getCockpitState === 'function') {
      cockpit.state = window.AfroEdu.getCockpitState();
    }

    getEl('manualUniversityName').value = '';
    getEl('manualUniversityCountry').value = '';
    getEl('manualUniversityNote').value = '';
    notify('University saved to the cockpit', 'success');
    rerender();
  }

  function routeToHref(routeKey) {
    var map = {
      scholarship: '/tools/scholarship-finder/',
      ielts: '/tools/ielts-calculator/',
      budget: '/tools/study-abroad-cost/',
      university: '/tools/university-ranking/',
      admission: '/tools/university-admission/',
      jamb: '/jamb/',
      afrostudy: '/education/afrostudy/'
    };
    return map[routeKey] || '#deadline-form';
  }

  function routeToLabel(routeKey) {
    var map = {
      scholarship: 'Scholarship route',
      ielts: 'IELTS plan',
      budget: 'Budget plan',
      university: 'University shortlist',
      admission: 'Admissions pathway',
      jamb: 'AfroJAMB',
      afrostudy: 'AfroStudy'
    };
    return map[routeKey] || '';
  }

  function addManualDestination() {
    var selected = getEl('destinationSelect').value;
    var custom = getEl('destinationCustom').value.trim();
    var name = custom || selected;
    var reason = getEl('destinationReason').value.trim();
    var studyLevel = getEl('destinationLevel').value;
    var mergedCountries;

    if (!name) {
      notify('Choose or enter a destination first', 'warning');
      return;
    }

    if (window.AfroEdu && typeof window.AfroEdu.saveDestination === 'function') {
      window.AfroEdu.saveDestination({
        id: slugify(name),
        name: name,
        reason: reason,
        studyLevel: studyLevel,
        href: '/tools/study-abroad-cost/',
        savedAt: Date.now()
      });
      window.AfroEdu.recordActivity('education-hub', 'Saved destination', name);
    }

    mergedCountries = uniqueStrings((cockpit.profile.target_countries || []).concat([name]));

    if (window.EduProfileSync && typeof window.EduProfileSync.update === 'function') {
      window.EduProfileSync.update({
        target_countries: mergedCountries,
        target_study_level: studyLevel || cockpit.profile.target_study_level || undefined
      });
    }

    cockpit.profile = mergeSignalsIntoProfile(Object.assign({}, cockpit.profile, {
      target_countries: mergedCountries,
      target_study_level: studyLevel || cockpit.profile.target_study_level
    }));

    if (window.AfroEdu && typeof window.AfroEdu.getCockpitState === 'function') {
      cockpit.state = window.AfroEdu.getCockpitState();
    }

    getEl('destinationSelect').value = '';
    getEl('destinationCustom').value = '';
    getEl('destinationReason').value = '';
    getEl('destinationLevel').value = '';
    notify('Destination saved to the cockpit', 'success');
    rerender();
  }

  function addDeadline() {
    var title = getEl('deadlineTitle').value.trim();
    var date = getEl('deadlineDate').value;
    var routeKey = getEl('deadlineRoute').value;

    if (!title || !date) {
      notify('Add a deadline title and date first', 'warning');
      return;
    }

    if (window.AfroEdu && typeof window.AfroEdu.saveDeadline === 'function') {
      window.AfroEdu.saveDeadline({
        id: slugify(title + '-' + date),
        title: title,
        date: date,
        route: routeToLabel(routeKey),
        href: routeToHref(routeKey),
        savedAt: Date.now()
      });
      window.AfroEdu.recordActivity('education-hub', 'Tracked deadline', title);
    }

    if (window.AfroEdu && typeof window.AfroEdu.getCockpitState === 'function') {
      cockpit.state = window.AfroEdu.getCockpitState();
    }

    getEl('deadlineTitle').value = '';
    getEl('deadlineDate').value = '';
    getEl('deadlineRoute').value = 'scholarship';
    notify('Deadline saved to the cockpit', 'success');
    rerender();
  }

  function bindEvents() {
    document.addEventListener('click', function (event) {
      var action = event.target.getAttribute('data-action');
      var id = event.target.getAttribute('data-id');

      if (action === 'open-auth') {
        event.preventDefault();
        if (window.AfroAuthModal && typeof window.AfroAuthModal.open === 'function') {
          window.AfroAuthModal.open();
        }
        return;
      }

      if (!action || !id || !window.AfroEdu) return;

      if (action === 'remove-university' && typeof window.AfroEdu.removeUniversity === 'function') {
        window.AfroEdu.removeUniversity(id);
      }
      if (action === 'remove-destination' && typeof window.AfroEdu.removeDestination === 'function') {
        window.AfroEdu.removeDestination(id);
      }
      if (action === 'remove-budget' && typeof window.AfroEdu.removeBudgetSignal === 'function') {
        window.AfroEdu.removeBudgetSignal(id);
      }
      if (action === 'remove-deadline' && typeof window.AfroEdu.removeDeadline === 'function') {
        window.AfroEdu.removeDeadline(id);
      }

      if (typeof window.AfroEdu.getCockpitState === 'function') {
        cockpit.state = window.AfroEdu.getCockpitState();
      }
      rerender();
    });

    getEl('saveProfileBtn').addEventListener('click', saveProfileEdits);
    getEl('saveUniversityBtn').addEventListener('click', addManualUniversity);
    getEl('saveDestinationBtn').addEventListener('click', addManualDestination);
    getEl('saveDeadlineBtn').addEventListener('click', addDeadline);
  }

  function applyDestinationOptions() {
    getEl('destinationSelect').innerHTML = '<option value="">Choose saved destination</option>' + destinationOptions.map(function (name) {
      return '<option value="' + escapeHtml(name) + '">' + escapeHtml(name) + '</option>';
    }).join('');
  }

  function collectRemoteAndLocalProfile() {
    var remotePromise = window.EduProfileSync && typeof window.EduProfileSync.getProfile === 'function'
      ? window.EduProfileSync.getProfile().catch(function () { return null; })
      : Promise.resolve(null);
    var cachedProfile = window.EduProfileSync && typeof window.EduProfileSync.getCachedProfile === 'function'
      ? window.EduProfileSync.getCachedProfile()
      : null;
    var quickProfile = window.ScholarshipMatcher && typeof window.ScholarshipMatcher.getQuickProfile === 'function'
      ? window.ScholarshipMatcher.getQuickProfile()
      : null;

    return remotePromise.then(function (remoteProfile) {
      return {
        remoteProfile: remoteProfile,
        cachedProfile: cachedProfile,
        quickProfile: quickProfile
      };
    });
  }

  function init() {
    applyDestinationOptions();
    bindEvents();

    collectRemoteAndLocalProfile().then(function (profileState) {
      var matcherProfile;
      var rawMatches = [];

      cockpit.remoteProfile = profileState.remoteProfile;
      cockpit.cachedProfile = profileState.cachedProfile;
      cockpit.quickProfile = profileState.quickProfile;
      cockpit.state = window.AfroEdu && typeof window.AfroEdu.getCockpitState === 'function'
        ? window.AfroEdu.getCockpitState()
        : cockpit.state;
      cockpit.ieltsState = readIeltsState();
      cockpit.jamb = window.AfroEdu && typeof window.AfroEdu.summary === 'function'
        ? window.AfroEdu.summary()
        : {};
      cockpit.profile = mergeSignalsIntoProfile(mapProfileWithFallbacks(
        profileState.remoteProfile,
        profileState.cachedProfile,
        profileState.quickProfile
      ));
      cockpit.shortlistKeys = getScholarshipShortlistKeys();
      cockpit.activity = extractActivity();

      return loadScholarships().then(function (scholarships) {
        cockpit.scholarships = scholarships;
        cockpit.shortlistItems = resolveScholarshipShortlist(scholarships, cockpit.shortlistKeys);

        if (window.ScholarshipMatcher && typeof window.ScholarshipMatcher.match === 'function') {
          matcherProfile = buildMatcherProfile(cockpit.profile);
          rawMatches = window.ScholarshipMatcher.match(scholarships, matcherProfile) || [];
        }

        cockpit.matches = rawMatches.map(function (match) {
          return Object.assign({}, match, {
            category: match.category || (window.ScholarshipMatcher && typeof window.ScholarshipMatcher.categorize === 'function'
              ? window.ScholarshipMatcher.categorize(match.percent)
              : 'Possible fit'),
            categoryClass: match.categoryClass || (window.ScholarshipMatcher && typeof window.ScholarshipMatcher.categoryClass === 'function'
              ? window.ScholarshipMatcher.categoryClass(match.percent)
              : 'match-possible')
          });
        }).sort(function (left, right) {
          return (right.percent || 0) - (left.percent || 0);
        });

        rerender();
      });
    }).catch(function () {
      cockpit.profile = {};
      cockpit.scholarships = fallbackScholarships.slice();
      cockpit.shortlistItems = [];
      cockpit.matches = [];
      cockpit.activity = extractActivity();
      rerender();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
}());

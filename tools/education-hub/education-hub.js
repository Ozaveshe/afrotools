(function () {
  'use strict';

  var SHORTLIST_KEY = 'afro-scholarship-shortlist';
  var IELTS_STATE_KEY = 'afro-ielts-pathway-state';
  var PROFILE_CACHE_KEY = 'afroedu-profile-cache';
  var QUICK_PROFILE_KEY = 'afro-quick-edu-profile';
  var COCKPIT_KEY = 'afroedu-cockpit-state';
  var ACTIVITY_KEY = 'afro_tool_history';
  var SCHOLARSHIP_CACHE_KEY = 'afroedu-scholarship-feed-cache-v1';

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
    remoteProfile: null,
    cachedProfile: null,
    quickProfile: null,
    profile: {},
    state: emptyCockpitState(),
    scholarships: [],
    scholarshipSource: buildDefaultScholarshipSource(),
    matches: [],
    shortlistKeys: [],
    shortlistItems: [],
    activity: [],
    jamb: {},
    ieltsState: null
  };
  var lastRemoteProfileRefreshAt = 0;

  function emptyCockpitState() {
    return {
      universities: [],
      destinations: [],
      deadlines: [],
      budgetSignals: []
    };
  }

  function buildDefaultScholarshipSource() {
    return {
      mode: 'fallback',
      label: 'Checking feed',
      message: 'Checking scholarship source status.',
      tone: 'ok',
      count: 0,
      cachedAt: null,
      updatedLabel: '',
      isDegraded: false,
      error: ''
    };
  }

  function getEl(id) {
    return document.getElementById(id);
  }

  function setText(id, value) {
    var el = getEl(id);
    if (el) el.textContent = value;
  }

  function setHtml(id, value) {
    var el = getEl(id);
    if (el) el.innerHTML = value;
  }

  function setWidth(id, value) {
    var el = getEl(id);
    if (el) el.style.width = value;
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

  function uniqueStrings(values) {
    return (values || []).reduce(function (acc, value) {
      var next = String(value || '').trim();
      if (!next) return acc;
      if (!acc.some(function (existing) { return existing.toLowerCase() === next.toLowerCase(); })) {
        acc.push(next);
      }
      return acc;
    }, []);
  }

  function titleCase(value) {
    return String(value || '')
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, function (match) {
        return match.toUpperCase();
      });
  }

  function truncateText(value, maxLength) {
    var text = String(value || '').trim();

    if (!text || !maxLength || text.length <= maxLength) return text;
    return text.slice(0, Math.max(0, maxLength - 3)).trim() + '...';
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
      bachelors: 'Undergraduate',
      postgraduate: 'Postgraduate',
      masters: "Master's",
      phd: 'PhD',
      postdoc: 'Postdoc',
      'monthly-budget': 'Monthly Budget'
    };
    return map[level] || titleCase(level);
  }

  function formatRelative(dateValue) {
    if (!dateValue) return 'No date set';

    var date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'Invalid date';

    var diff = Math.ceil((date.getTime() - Date.now()) / 86400000);
    if (diff < 0) return Math.abs(diff) + ' day' + (Math.abs(diff) === 1 ? '' : 's') + ' overdue';
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    return diff + ' days left';
  }

  function formatTimeAgo(timestamp) {
    var date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Recently';

    var diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return diffDays + ' days ago';

    var diffMonths = Math.floor(diffDays / 30);
    if (diffMonths <= 1) return '1 month ago';
    return diffMonths + ' months ago';
  }

  function formatMoney(value, currency) {
    if (value === null || value === undefined || value === '') return '-';

    var number = Number(value);
    if (isNaN(number)) return '-';
    return (currency || '') + number.toLocaleString();
  }

  function getDaysUntil(dateValue) {
    if (!dateValue) return null;

    var date = new Date(dateValue);
    if (isNaN(date.getTime())) return null;
    return Math.ceil((date.getTime() - Date.now()) / 86400000);
  }

  function buildScholarshipKey(scholarship) {
    return String(scholarship && (scholarship.application_url || scholarship.info_url || scholarship.name) || '')
      .trim()
      .toLowerCase();
  }

  function readCachedProfile() {
    if (window.EduProfileSync && typeof window.EduProfileSync.getCachedProfile === 'function') {
      return window.EduProfileSync.getCachedProfile();
    }
    return safeRead(PROFILE_CACHE_KEY, null, localStorage);
  }

  function readQuickProfile() {
    if (window.ScholarshipMatcher && typeof window.ScholarshipMatcher.getQuickProfile === 'function') {
      return window.ScholarshipMatcher.getQuickProfile();
    }
    return safeRead(QUICK_PROFILE_KEY, null, localStorage);
  }

  function readCockpitState() {
    if (window.AfroEdu && typeof window.AfroEdu.getCockpitState === 'function') {
      return window.AfroEdu.getCockpitState() || emptyCockpitState();
    }
    return safeRead(COCKPIT_KEY, emptyCockpitState(), localStorage) || emptyCockpitState();
  }

  function readJambSummary() {
    if (window.AfroEdu && typeof window.AfroEdu.summary === 'function') {
      return window.AfroEdu.summary() || {};
    }
    return {};
  }

  function readIeltsState() {
    return safeRead(IELTS_STATE_KEY, null, localStorage);
  }

  function getScholarshipShortlistKeys() {
    return safeRead(SHORTLIST_KEY, [], localStorage) || [];
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
    var ieltsState = cockpit.ieltsState || {};
    var budgetSignals = cockpit.state.budgetSignals || [];
    var latestBudget = budgetSignals.length ? budgetSignals.slice().sort(sortByRecency)[0] : null;
    var savedDestinations = cockpit.state.destinations || [];

    if (!merged.ielts_overall && ieltsState.lastOverall) {
      merged.ielts_overall = parseFloat(ieltsState.lastOverall);
    }

    if (!merged.target_study_level && latestBudget && latestBudget.level && latestBudget.level !== 'monthly-budget') {
      merged.target_study_level = latestBudget.level;
    }

    if ((!merged.target_countries || !merged.target_countries.length) && ieltsState.targetDestination) {
      merged.target_countries = [titleCase(ieltsState.targetDestination)];
    }

    if (latestBudget && latestBudget.destination && latestBudget.level !== 'monthly-budget') {
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
    var key = slugify(country);
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
      australia: 'australia',
      africa: 'africa',
      global: 'global'
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
        if (normalized && acc.indexOf(normalized) === -1) acc.push(normalized);
        return acc;
      }, [])
    };
  }

  function computeScholarshipMatches(profile, scholarships) {
    if (!window.ScholarshipMatcher || typeof window.ScholarshipMatcher.match !== 'function') return [];
    if (!scholarships.length) return [];

    var rawMatches = window.ScholarshipMatcher.match(scholarships, buildMatcherProfile(profile)) || [];
    return rawMatches.map(function (match) {
      var category = match.category || 'Possible';
      var categoryClass = match.categoryClass;
      if (!categoryClass && typeof window.ScholarshipMatcher.categoryClass === 'function') {
        categoryClass = window.ScholarshipMatcher.categoryClass(category);
      }
      return Object.assign({}, match, {
        category: category,
        categoryClass: categoryClass || 'match-possible'
      });
    }).sort(function (left, right) {
      return (right.percent || 0) - (left.percent || 0);
    });
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

  function extractActivity() {
    var labels = {
      'gpa-calculator': 'Updated GPA profile',
      'ielts-calculator': 'Updated IELTS pathway',
      'degree-checker': 'Checked degree readiness',
      'scholarship-finder': 'Worked scholarship flow',
      'study-abroad-cost': 'Updated affordability route',
      'student-budget': 'Updated monthly survival plan',
      'university-ranking': 'Updated university shortlist',
      'education-hub': 'Updated cockpit',
      'jamb-cbt': 'Took JAMB CBT mock',
      'jamb-score-predictor': 'Ran JAMB score predictor',
      'jamb-aggregate': 'Saved JAMB aggregate score'
    };

    return (safeRead(ACTIVITY_KEY, [], localStorage) || []).filter(function (item) {
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

    var filled = fields.reduce(function (count, field) {
      var value = profile[field];
      if (Array.isArray(value)) return count + (value.length ? 1 : 0);
      return count + ((value !== undefined && value !== null && value !== '') ? 1 : 0);
    }, 0);

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

  function sortByRecency(left, right) {
    return Number(right.updatedAt || right.savedAt || 0) - Number(left.updatedAt || left.savedAt || 0);
  }

  function buildChecklist(profile, signals) {
    var wantsStudyAbroad = signals.destinations.length > 0 || (profile.target_countries && profile.target_countries.length > 0);
    var hasScholarMatches = signals.goodMatches > 0;
    var hasDegreeReadiness = hasDegreeReadinessSignal(signals);
    var scholarshipHint = 'Run Scholarship Finder after profile setup.';

    if (signals.shortlistItems.length) {
      scholarshipHint = signals.shortlistItems.length + ' saved scholarship' + (signals.shortlistItems.length === 1 ? '' : 's');
    } else if (hasScholarMatches) {
      scholarshipHint = signals.goodMatches + ' good matches available right now.';
    }

    if (signals.scholarshipSource.isDegraded) {
      scholarshipHint += ' Feed status: ' + signals.scholarshipSource.label.toLowerCase() + '.';
    }

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
        complete: signals.shortlistItems.length > 0,
        hint: scholarshipHint,
        href: '/tools/scholarship-finder/'
      },
      {
        key: 'universities',
        title: 'Save universities or schools',
        complete: signals.universities.length >= 3,
        hint: signals.universities.length ? signals.universities.length + ' saved so far.' : 'Use University Rankings to build the shortlist or quick-add your own school.',
        href: '/tools/university-ranking/'
      },
      {
        key: 'destinations',
        title: 'Set destinations',
        complete: signals.destinations.length > 0,
        hint: signals.destinations.length ? signals.destinations.length + ' destination' + (signals.destinations.length === 1 ? '' : 's') + ' on file.' : 'Add destinations you are seriously considering.',
        href: '/tools/study-abroad-cost/'
      },
      {
        key: 'budget',
        title: 'Estimate a real cost signal',
        complete: signals.budgetSignals.length > 0,
        hint: signals.budgetSignals.length ? 'Recent cost plan saved to the cockpit.' : 'Study Abroad Cost can save a live affordability signal here.',
        href: '/tools/study-abroad-cost/'
      },
      {
        key: 'deadlines',
        title: 'Track a deadline',
        complete: signals.deadlines.length > 0,
        hint: signals.deadlines.length ? signals.deadlines.length + ' upcoming date' + (signals.deadlines.length === 1 ? '' : 's') + ' tracked.' : 'Add the next application or test milestone.',
        href: '#deadline-form'
      }
    ];
  }

  function buildNextActions(profile, signals) {
    var actions = [];
    var topMatch = signals.matches.length ? signals.matches[0] : null;
    var nextDeadline = signals.deadlines.length ? signals.deadlines[0] : null;
    var daysUntilNextDeadline = nextDeadline ? getDaysUntil(nextDeadline.date) : null;
    var hasDegreeReadiness = hasDegreeReadinessSignal(signals);

    if (daysUntilNextDeadline !== null && daysUntilNextDeadline <= 21) {
      actions.push({
        title: nextDeadline.title + ' is coming up',
        copy: 'You have ' + formatRelative(nextDeadline.date).toLowerCase() + '. Keep the route moving before the date slips.',
        href: nextDeadline.href || '#deadline-form',
        cta: 'Review deadline'
      });
    }

    if (signals.scholarshipSource.isDegraded) {
      actions.push({
        title: 'Scholarship signals are running in backup mode',
        copy: signals.scholarshipSource.message,
        href: '/tools/scholarship-finder/',
        cta: 'Review scholarship flow'
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
        copy: 'A real application plan usually starts with 3 to 5 schools. Build the shortlist in University Rankings, then keep the saved schools here.',
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
        copy: 'Your profile is in good shape. Keep refining shortlists and validating deadlines, costs, and entry requirements for the strongest routes.',
        href: '/tools/scholarship-finder/',
        cta: 'Open scholarship workflow'
      });
    }

    if (!actions.length) {
      actions.push({
        title: 'Keep the cockpit current',
        copy: 'You have a solid setup. Refresh scores, destinations, budgets, and deadlines as the plan changes.',
        href: '#profile-editor',
        cta: 'Review cockpit'
      });
    }

    return actions.slice(0, 4);
  }

  function buildCurrentPlan(signals) {
    var profile = cockpit.profile;
    var degreeReady = hasDegreeReadinessSignal(signals);
    var destinationNames = signals.destinations.map(function (destination) {
      return destination.name;
    });
    var topBudget = signals.budgetSignals.length ? signals.budgetSignals[0] : null;
    var upcomingDeadline = signals.deadlines.length ? signals.deadlines[0] : null;
    var testsReady = [profile.gpa_value, profile.ielts_overall, signals.jambStatus === 'Tracked' || signals.jambStatus === 'In progress'].filter(Boolean).length;

    return [
      {
        key: 'destination',
        title: 'Destination path',
        status: destinationNames.length ? (topBudget ? 'Active' : 'Needs cost check') : 'Not shaped',
        tone: destinationNames.length ? (topBudget ? 'good' : 'warn') : 'warn',
        detail: destinationNames.length ? destinationNames.slice(0, 2).join(', ') : 'No saved destination path yet.',
        meta: topBudget
          ? 'Latest affordability signal: ' + topBudget.destination + ' ' + formatStudyLevel(topBudget.level || '')
          : 'Use Study Abroad Cost to turn destination intent into a real route.',
        href: '/tools/study-abroad-cost/',
        cta: topBudget ? 'Review route' : 'Set destinations'
      },
      {
        key: 'funding',
        title: 'Funding path',
        status: signals.shortlistItems.length ? 'Shortlist active' : (signals.goodMatches ? 'Matches ready' : (signals.scholarshipSource.isDegraded ? 'Backup mode' : 'Needs profile')),
        tone: signals.shortlistItems.length ? 'good' : (signals.goodMatches ? 'ok' : 'warn'),
        detail: signals.shortlistItems.length
          ? signals.shortlistItems.length + ' saved scholarship' + (signals.shortlistItems.length === 1 ? '' : 's')
          : (signals.goodMatches ? signals.goodMatches + ' good matches waiting' : 'No strong funding route locked yet.'),
        meta: signals.scholarshipSource.isDegraded
          ? signals.scholarshipSource.message
          : 'Source: ' + signals.scholarshipSource.label + '.',
        href: '/tools/scholarship-finder/',
        cta: signals.shortlistItems.length ? 'Open shortlist' : 'Review scholarships'
      },
      {
        key: 'tests',
        title: 'Test readiness path',
        status: testsReady >= 3 && degreeReady ? 'Ready to route' : (testsReady > 0 ? 'In progress' : 'Needs setup'),
        tone: testsReady >= 3 && degreeReady ? 'good' : (testsReady > 0 ? 'ok' : 'warn'),
        detail: profile.ielts_overall
          ? 'IELTS ' + Number(profile.ielts_overall).toFixed(1) + ' on file'
          : 'IELTS target not locked yet.',
        meta: degreeReady
          ? 'Degree readiness signal is already in the cockpit.'
          : 'Pair GPA, IELTS, and degree readiness before pushing harder on applications.',
        href: '/tools/ielts-calculator/',
        cta: testsReady >= 3 && degreeReady ? 'Review tests' : 'Strengthen readiness'
      },
      {
        key: 'shortlist',
        title: 'Shortlist health',
        status: signals.universities.length >= 3 && signals.deadlines.length ? 'Operational' : (signals.universities.length ? 'Building' : 'Thin'),
        tone: signals.universities.length >= 3 && signals.deadlines.length ? 'good' : (signals.universities.length ? 'ok' : 'warn'),
        detail: signals.universities.length
          ? signals.universities.length + ' saved school' + (signals.universities.length === 1 ? '' : 's')
          : 'No universities saved yet.',
        meta: upcomingDeadline
          ? 'Next date: ' + upcomingDeadline.title + ' (' + formatRelative(upcomingDeadline.date) + ')'
          : 'Add a real deadline so the shortlist stays anchored to action.',
        href: '/tools/university-ranking/',
        cta: signals.universities.length ? 'Refine shortlist' : 'Build shortlist'
      }
    ];
  }

  function buildSignals() {
    var profile = cockpit.profile;
    var completion = computeCompletion(profile);
    var universities = (cockpit.state.universities || []).slice().sort(sortByRecency);
    var destinations = uniqueStrings((profile.target_countries || []).concat((cockpit.state.destinations || []).map(function (item) {
      return item.name;
    }))).map(function (name) {
      var existing = (cockpit.state.destinations || []).find(function (destination) {
        return destination.name && destination.name.toLowerCase() === name.toLowerCase();
      });
      return existing || {
        id: slugify(name),
        name: name,
        href: '/tools/study-abroad-cost/'
      };
    });
    var budgetSignals = (cockpit.state.budgetSignals || []).slice().sort(sortByRecency);
    var deadlines = (cockpit.state.deadlines || []).slice().sort(function (left, right) {
      return new Date(left.date || '2099-12-31') - new Date(right.date || '2099-12-31');
    });
    var matches = cockpit.matches || [];
    var shortlistItems = cockpit.shortlistItems || [];
    var goodMatches = matches.filter(function (match) {
      return Number(match.percent || 0) >= 60;
    }).length;
    var remoteProfile = cockpit.remoteProfile;
    var profileMode = remoteProfile ? 'Account cockpit' : (completion.percent > 0 ? 'Local cockpit' : 'Start cockpit');
    var profileStatusCopy = remoteProfile
      ? 'Your account-backed profile is shaping the cockpit across scholarships, tests, and destinations.'
      : (completion.percent > 0
        ? 'You already have local signals on this device. Keep building and sign in later if you want sync.'
        : 'Start with the profile and the hub will turn your tools into one connected journey.');
    var jamb = cockpit.jamb || {};
    var jambDisplay = jamb.jambScore ? String(jamb.jambScore) : (jamb.bestMockAggregate ? jamb.bestMockAggregate + ' mock' : 'Set route');
    var jambStatus = jamb.jambScore ? 'Tracked' : (jamb.mockCount ? 'In progress' : 'Not started');
    var jambDetail = jamb.jambScore ? 'Aggregate score on file' : (jamb.mockCount ? jamb.mockCount + ' mock' + (jamb.mockCount === 1 ? '' : 's') + ' recorded' : 'Route into AfroJAMB or University Admission');
    var jambTone = jamb.jambScore ? 'good' : (jamb.mockCount ? 'ok' : 'warn');
    var jambHref = (jamb.jambScore || jamb.mockCount) ? '/jamb/' : '/tools/university-admission/';
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
      remoteProfile: remoteProfile,
      scholarshipSource: cockpit.scholarshipSource || buildDefaultScholarshipSource(),
      jambDisplay: jambDisplay,
      jambStatus: jambStatus,
      jambDetail: jambDetail,
      jambTone: jambTone,
      jambHref: jambHref
    };

    signals.checklist = buildChecklist(profile, signals);
    signals.nextActions = buildNextActions(profile, signals);
    signals.currentPlan = buildCurrentPlan(signals);
    return signals;
  }

  function renderCollection(id, items, emptyHtml, renderer) {
    setHtml(id, items.length ? items.map(renderer).join('') : emptyHtml);
  }

  function renderHero(signals) {
    var primaryAction = signals.nextActions[0];
    var sourceTone = signals.scholarshipSource.isDegraded ? 'warn' : (signals.scholarshipSource.tone || 'ok');
    var destinationFocus = signals.destinations.length
      ? signals.destinations.map(function (destination) { return destination.name; }).slice(0, 2).join(' + ')
      : 'Set destinations';
    var fundingFocus = signals.shortlistItems.length
      ? signals.shortlistItems.length + ' saved scholarship' + (signals.shortlistItems.length === 1 ? '' : 's')
      : (signals.goodMatches
        ? signals.goodMatches + ' good match' + (signals.goodMatches === 1 ? '' : 'es') + ' waiting'
        : (signals.scholarshipSource.isDegraded ? 'Backup feed active' : 'Build your shortlist'));
    var upcomingDeadline = signals.deadlines.length ? signals.deadlines[0] : null;
    var routeStrength = signals.currentPlan.filter(function (card) {
      return card.tone === 'good';
    }).length;
    var routeSupport = signals.currentPlan.filter(function (card) {
      return card.tone === 'ok';
    }).length;
    var operatingMode = signals.remoteProfile
      ? 'Account-linked cockpit'
      : (signals.completion.percent > 0 ? 'Local cockpit active' : 'Cockpit starting');
    var momentumValue = routeStrength >= 3
      ? 'Operational'
      : (routeStrength + routeSupport >= 2 ? 'Building momentum' : 'Starting up');
    var momentumDetail = routeStrength >= 3
      ? 'Destination, funding, tests, and shortlist signals are moving together.'
      : (routeStrength + routeSupport >= 2
        ? 'The route is forming. Keep feeding the cockpit with clearer deadlines and stronger evidence.'
        : 'Add profile, destinations, or shortlists so the cockpit can drive a real plan.');
    var feedBadge = getEl('heroFeedBadge');
    var nextActionPrimary = getEl('nextActionPrimary');

    setText('heroCompletion', signals.completion.percent + '%');
    setText('heroMatches', String(signals.goodMatches));
    setText('heroSchools', String(signals.universities.length));
    setText('heroDeadlines', String(signals.deadlines.length));
    setText('heroModeBadge', signals.profileMode);
    setText('heroStatusCopy', signals.profileStatusCopy);
    setText('heroOperatingMode', operatingMode);
    setText('heroDestinationFocus', destinationFocus);
    setText('heroFundingFocus', fundingFocus);
    setText('heroTimelineFocus', upcomingDeadline
      ? truncateText(upcomingDeadline.title, 28) + ' - ' + formatRelative(upcomingDeadline.date)
      : 'Track the first deadline');
    setText('heroScholarshipMode', signals.scholarshipSource.label);
    setText('heroScholarshipModeDetail', signals.scholarshipSource.message);
    setText('heroMomentumValue', momentumValue);
    setText('heroMomentumDetail', momentumDetail);

    if (feedBadge) {
      feedBadge.textContent = signals.scholarshipSource.label;
      feedBadge.className = 'hub-hero-statuschip hub-hero-statuschip-' + (sourceTone === 'good' ? 'ok' : sourceTone);
    }

    if (primaryAction) {
      setText('nextActionTitle', primaryAction.title);
      setText('nextActionCopy', primaryAction.copy);
      setText('nextActionPrimary', primaryAction.cta);
      if (nextActionPrimary) nextActionPrimary.setAttribute('href', primaryAction.href);
    }
  }

  function renderProfile(signals) {
    var profile = cockpit.profile;
    var destinationPreview = signals.destinations.length
      ? signals.destinations.map(function (destination) { return destination.name; }).slice(0, 2).join(', ')
      : 'Set destinations';
    var tags = [];

    setText('profileModeBadge', signals.profileMode);
    setText('profileCompletionValue', signals.completion.percent + '%');
    setWidth('profileCompletionFill', signals.completion.percent + '%');
    setText('profileStatusCopy', signals.profileStatusCopy);
    setText('profileGpaValue', profile.gpa_value ? Number(profile.gpa_value).toFixed(2) + (profile.gpa_scale ? ' / ' + profile.gpa_scale : '') : 'Set GPA');
    setText('profileIeltsValue', profile.ielts_overall ? Number(profile.ielts_overall).toFixed(1) : 'Add IELTS');
    setText('profileJambValue', signals.jambDisplay);
    setText('profileDestinationValue', destinationPreview);

    if (profile.education_level) tags.push({ label: formatStudyLevel(profile.education_level), tone: 'blue' });
    if (profile.target_study_level) tags.push({ label: formatStudyLevel(profile.target_study_level), tone: 'gold' });
    if (profile.institution) tags.push({ label: profile.institution, tone: 'slate' });
    if (profile.target_fields && profile.target_fields.length) {
      profile.target_fields.slice(0, 3).forEach(function (field) {
        tags.push({ label: titleCase(field), tone: 'green' });
      });
    }

    setHtml('profileHighlights', tags.length
      ? tags.map(function (tag) {
        return '<span class="hub-pill hub-pill-' + tag.tone + '">' + escapeHtml(tag.label) + '</span>';
      }).join('')
      : '<span class="hub-empty-inline">No profile tags yet. Start with level, field, or destination.</span>');

    setHtml('syncHint', signals.remoteProfile
      ? 'Account sync is active. This cockpit can travel with your login.'
      : 'Working in local cockpit mode on this device. <a href="#" data-action="open-auth">Sign in</a> to sync across devices.');

    getEl('edLevel').value = profile.education_level || '';
    getEl('edInstitution').value = profile.institution || '';
    getEl('edGradDate').value = profile.graduation_date || '';
    getEl('edCountries').value = uniqueStrings(profile.target_countries || []).join(', ');
    getEl('edFields').value = uniqueStrings(profile.target_fields || []).join(', ');
    getEl('edStudyLevel').value = profile.target_study_level || '';
  }

  function renderChecklist(signals) {
    var completed = signals.checklist.filter(function (item) { return item.complete; }).length;
    var percent = Math.round((completed / signals.checklist.length) * 100);

    setText('checklistCount', completed + '/' + signals.checklist.length);
    setWidth('checklistProgressFill', percent + '%');
    renderCollection('checklistList', signals.checklist, '', function (item) {
      return '<a class="hub-check-item' + (item.complete ? ' is-complete' : '') + '" href="' + escapeHtml(item.href) + '">' +
        '<span class="hub-check-mark">' + (item.complete ? '&#10003;' : '&#10132;') + '</span>' +
        '<span class="hub-check-copy"><strong>' + escapeHtml(item.title) + '</strong><span>' + escapeHtml(item.hint) + '</span></span>' +
      '</a>';
    });
  }

  function renderCurrentPlan(signals) {
    var strongCount = signals.currentPlan.filter(function (card) { return card.tone === 'good'; }).length;
    var activeStatus = strongCount >= 3 ? 'In motion' : (strongCount >= 1 ? 'Building route' : 'Needs setup');

    setText('currentPlanStatus', activeStatus);
    setText('currentPlanSummary', strongCount >= 3
      ? 'The main route layers are moving together. Keep deadlines and evidence current.'
      : 'The cockpit is tracking the real route. Fill the thin areas so destination, funding, tests, and shortlist health stay connected.');

    renderCollection('currentPlanList', signals.currentPlan, '', function (card) {
      return '<a class="hub-plan-card" href="' + escapeHtml(card.href) + '">' +
        '<div class="hub-plan-top"><strong>' + escapeHtml(card.title) + '</strong><span class="hub-fit hub-fit-' + escapeHtml(card.tone) + '">' + escapeHtml(card.status) + '</span></div>' +
        '<div class="hub-plan-meta"><p>' + escapeHtml(card.detail) + '</p><small>' + escapeHtml(card.meta) + '</small></div>' +
        '<div class="hub-plan-actions"><span>' + escapeHtml(card.cta) + '</span><span class="hub-inline-link">Open</span></div>' +
      '</a>';
    });
  }

  function renderScholarshipSource(signals) {
    var badge = getEl('scholarshipSourceBadge');
    var banner = getEl('scholarshipSourceBanner');

    if (badge) {
      badge.className = 'hub-fit hub-fit-' + (signals.scholarshipSource.tone || 'ok');
      badge.textContent = signals.scholarshipSource.label;
    }

    if (banner) {
      banner.classList.toggle('is-degraded', !!signals.scholarshipSource.isDegraded);
    }

    setText('scholarshipSourceText', signals.scholarshipSource.message);
  }

  function renderScholarships(signals) {
    var sourceList = signals.shortlistItems.length
      ? signals.shortlistItems
      : signals.matches.slice(0, 4).map(function (match) {
        return match.scholarship;
      });
    var summaryText = 'The hub will show stronger scholarship signals after your GPA, destination, and IELTS profile are clearer.';

    if (signals.shortlistItems.length) {
      summaryText = 'Your shortlist is active. Keep the strongest funding routes visible here while the cockpit drives the next action.';
    } else if (signals.goodMatches) {
      summaryText = 'You already have stronger scholarship matches. The next move is to review fit and save the best routes into your shortlist.';
    }

    if (signals.scholarshipSource.isDegraded) {
      summaryText = signals.scholarshipSource.message + ' ' + summaryText;
    }

    setText('scholarshipPrimaryCount', String(signals.goodMatches));
    setText('scholarshipShortlistCount', String(signals.shortlistItems.length));
    setText('scholarshipMatchesCount', String(signals.matches.length));
    setText('scholarshipSummaryText', summaryText);
    renderScholarshipSource(signals);

    renderCollection('scholarshipList', sourceList, '<div class="hub-empty-block">No saved scholarships yet. Run Scholarship Finder, save the strongest routes, and they will appear here.</div>', function (scholarship) {
      var match = signals.matches.find(function (result) {
        return buildScholarshipKey(result.scholarship) === buildScholarshipKey(scholarship);
      });
      var fit = match ? match.category : (signals.shortlistItems.length ? 'Saved shortlist' : 'Needs fuller profile');
      var fitClass = match ? match.categoryClass : 'match-possible';
      return '<article class="hub-mini-card">' +
        '<div class="hub-mini-top"><span class="hub-fit ' + escapeHtml(fitClass) + '">' + escapeHtml(fit) + '</span><span class="hub-mini-meta">' + escapeHtml((scholarship.funding || '').toUpperCase() || 'FUNDING') + '</span></div>' +
        '<h4>' + escapeHtml(scholarship.name) + '</h4>' +
        '<p>' + escapeHtml(scholarship.provider || 'Scholarship provider') + '</p>' +
        '<div class="hub-mini-links"><a href="/tools/scholarship-finder/">Open workflow</a>' +
        (scholarship.info_url ? '<a href="' + escapeHtml(scholarship.info_url) + '" target="_blank" rel="noopener">Official details</a>' : '') +
        '</div>' +
      '</article>';
    });
  }

  function renderUniversities(signals) {
    renderCollection('universityList', signals.universities, '<div class="hub-empty-block">No universities saved yet. Save them from the University Shortlist Builder or add one manually below.</div>', function (university) {
      var meta = [];
      if (university.fitLabel) meta.push(university.fitLabel);
      if (university.country) meta.push(university.country);
      if (university.rank) meta.push('Rank ' + university.rank);
      if (university.feesLabel) meta.push(university.feesLabel);
      if (university.note) meta.push(university.note);

      return '<article class="hub-object-card">' +
        '<div class="hub-object-copy"><h4>' + escapeHtml(university.name) + '</h4><p>' + escapeHtml(meta.join(' · ') || 'Saved university') + '</p></div>' +
        '<div class="hub-object-actions">' +
          '<a href="' + escapeHtml(university.href || '/tools/university-ranking/') + '">Open</a>' +
          '<button type="button" data-action="remove-university" data-id="' + escapeHtml(university.id) + '">Remove</button>' +
        '</div>' +
      '</article>';
    });
  }

  function renderDestinations(signals) {
    renderCollection('destinationList', signals.destinations, '<div class="hub-empty-block">No destinations saved yet. Add them here or let the affordability engine push them back into the cockpit.</div>', function (destination) {
      var detail = [];
      if (destination.reason) detail.push(destination.reason);
      if (destination.studyLevel) detail.push(formatStudyLevel(destination.studyLevel));
      if (destination.field) detail.push(titleCase(destination.field));

      return '<article class="hub-object-card">' +
        '<div class="hub-object-copy"><h4>' + escapeHtml(destination.name) + '</h4><p>' + escapeHtml(detail.join(' · ') || 'Saved destination') + '</p></div>' +
        '<div class="hub-object-actions">' +
          '<a href="' + escapeHtml(destination.href || '/tools/study-abroad-cost/') + '">Open route</a>' +
          '<button type="button" data-action="remove-destination" data-id="' + escapeHtml(destination.id) + '">Remove</button>' +
        '</div>' +
      '</article>';
    });
  }

  function renderBudgetSignals(signals) {
    renderCollection('budgetSignalList', signals.budgetSignals, '<div class="hub-empty-block">No cost signals yet. Run Student Budget Planner or Study Abroad Cost and the most recent estimate will land here.</div>', function (signal) {
      var summary = [];
      if (signal.field) summary.push(titleCase(signal.field));
      if (signal.years && signal.level !== 'monthly-budget') summary.push(signal.years + ' year plan');
      if (signal.note) summary.push(signal.note);

      return '<article class="hub-budget-card">' +
        '<div class="hub-budget-top"><strong>' + escapeHtml(signal.destination) + '</strong><span>' + escapeHtml(formatStudyLevel(signal.level || '')) + '</span></div>' +
        '<div class="hub-budget-grid">' +
          '<div><label>Annual</label><strong>' + escapeHtml(formatMoney(signal.annualTotal, signal.currency)) + '</strong></div>' +
          '<div><label>Total</label><strong>' + escapeHtml(formatMoney(signal.totalCost, signal.currency)) + '</strong></div>' +
        '</div>' +
        '<p>' + escapeHtml(summary.join(' · ') || 'Saved cost signal') + '</p>' +
        '<div class="hub-object-actions"><a href="' + escapeHtml(signal.href || '/tools/study-abroad-cost/') + '">Review plan</a>' +
        '<button type="button" data-action="remove-budget" data-id="' + escapeHtml(signal.id) + '">Remove</button></div>' +
      '</article>';
    });
  }

  function renderTimeline(signals) {
    renderCollection('deadlineList', signals.deadlines, '<div class="hub-empty-block">No deadlines tracked yet. Add the next application, exam, or scholarship date so the cockpit can keep the plan grounded.</div>', function (deadline) {
      return '<article class="hub-object-card">' +
        '<div class="hub-object-copy"><h4>' + escapeHtml(deadline.title) + '</h4><p>' + escapeHtml(formatRelative(deadline.date) + (deadline.route ? ' · ' + deadline.route : '')) + '</p></div>' +
        '<div class="hub-object-actions">' +
          (deadline.href ? '<a href="' + escapeHtml(deadline.href) + '">Open</a>' : '<span class="hub-inline-muted">' + escapeHtml(deadline.date || '') + '</span>') +
          '<button type="button" data-action="remove-deadline" data-id="' + escapeHtml(deadline.id) + '">Remove</button>' +
        '</div>' +
      '</article>';
    });
  }

  function renderNextActions(signals) {
    var secondaryActions = signals.nextActions.slice(1);
    renderCollection('nextActionList', secondaryActions, '<div class="hub-empty-inline">No secondary actions right now. Stay on top of deadlines and refine your shortlists.</div>', function (action) {
      return '<a class="hub-action-item" href="' + escapeHtml(action.href) + '">' +
        '<strong>' + escapeHtml(action.title) + '</strong>' +
        '<span>' + escapeHtml(action.copy) + '</span>' +
      '</a>';
    });
  }

  function renderReadiness(signals) {
    var degreeReady = hasDegreeReadinessSignal(signals);
    var readinessCards = [
      {
        title: 'GPA',
        status: cockpit.profile.gpa_value ? 'On file' : 'Missing',
        detail: cockpit.profile.gpa_value
          ? Number(cockpit.profile.gpa_value).toFixed(2) + (cockpit.profile.gpa_scale ? ' / ' + cockpit.profile.gpa_scale : '')
          : 'Use GPA Calculator to push your current standing into the cockpit.',
        href: '/tools/gpa-calculator/',
        tone: cockpit.profile.gpa_value ? 'good' : 'warn'
      },
      {
        title: 'IELTS',
        status: cockpit.profile.ielts_overall ? 'Tracked' : 'Not set',
        detail: cockpit.profile.ielts_overall
          ? 'Overall ' + Number(cockpit.profile.ielts_overall).toFixed(1) + ' synced into the cockpit.'
          : 'Set a destination benchmark in IELTS Calculator before application pressure builds.',
        href: '/tools/ielts-calculator/',
        tone: cockpit.profile.ielts_overall ? 'good' : 'warn'
      },
      {
        title: 'Degree fit',
        status: degreeReady ? 'Checked' : 'Open loop',
        detail: degreeReady
          ? 'A qualification-readiness signal is already on file.'
          : 'Use Degree Checker if you still need destination-fit validation.',
        href: '/tools/degree-checker/',
        tone: degreeReady ? 'ok' : 'warn'
      },
      {
        title: 'JAMB / local exams',
        status: signals.jambStatus,
        detail: signals.jambDetail,
        href: signals.jambHref,
        tone: signals.jambTone
      }
    ];

    renderCollection('readinessList', readinessCards, '', function (card) {
      return '<a class="hub-readiness-card" href="' + escapeHtml(card.href) + '">' +
        '<span class="hub-fit hub-fit-' + escapeHtml(card.tone) + '">' + escapeHtml(card.status) + '</span>' +
        '<strong>' + escapeHtml(card.title) + '</strong>' +
        '<p>' + escapeHtml(card.detail) + '</p>' +
      '</a>';
    });
  }

  function renderStudyRoute(signals) {
    var degreeReady = hasDegreeReadinessSignal(signals);
    var route = [
      {
        label: 'Profile and GPA',
        href: '#profile-editor',
        complete: signals.completion.percent >= 50 && !!cockpit.profile.gpa_value,
        detail: signals.completion.percent >= 50 && cockpit.profile.gpa_value
          ? 'Core profile is in place and GPA is synced.'
          : 'Start by locking profile basics and academic standing.'
      },
      {
        label: 'IELTS pathway',
        href: '/tools/ielts-calculator/',
        complete: !!cockpit.profile.ielts_overall,
        detail: cockpit.profile.ielts_overall
          ? 'IELTS route synced into the cockpit.'
          : 'Needed for many international routes and scholarship checks.'
      },
      {
        label: 'Degree readiness',
        href: '/tools/degree-checker/',
        complete: degreeReady,
        detail: degreeReady
          ? 'Qualification-fit signal already saved.'
          : 'Validate qualification fit before pushing harder on destination choices.'
      },
      {
        label: 'Destination and cost route',
        href: '/tools/study-abroad-cost/',
        complete: signals.destinations.length > 0 && signals.budgetSignals.length > 0,
        detail: signals.destinations.length > 0 && signals.budgetSignals.length > 0
          ? 'Destination intent and affordability signals are both active.'
          : (signals.destinations.length
            ? 'You have destination intent, but cost signals are still thin.'
            : 'Save destinations, then translate them into affordability scenarios.')
      },
      {
        label: 'Funding and shortlist',
        href: '/tools/scholarship-finder/',
        complete: signals.shortlistItems.length > 0,
        detail: signals.shortlistItems.length > 0
          ? 'Scholarship shortlist is active in the cockpit.'
          : (signals.goodMatches
            ? signals.goodMatches + ' stronger scholarship matches are ready to shortlist.'
            : 'Use Scholarship Finder to turn profile signals into live funding options.')
      },
      {
        label: 'Schools and deadlines',
        href: '/tools/university-ranking/',
        complete: signals.universities.length > 0 && signals.deadlines.length > 0,
        detail: signals.universities.length > 0 && signals.deadlines.length > 0
          ? 'Shortlist and timeline are both anchored to real next steps.'
          : (signals.universities.length
            ? 'Add at least one real deadline so the shortlist becomes operational.'
            : 'Save schools before the route becomes too abstract.')
      }
    ];

    renderCollection('studyRouteList', route, '', function (step) {
      return '<a class="hub-route-step' + (step.complete ? ' is-complete' : '') + '" href="' + escapeHtml(step.href) + '">' +
        '<span class="hub-route-mark">' + (step.complete ? '&#10003;' : '&#8226;') + '</span>' +
        '<span><strong>' + escapeHtml(step.label) + '</strong><small>' + escapeHtml(step.detail) + '</small></span>' +
      '</a>';
    });
  }

  function renderActivity(signals) {
    renderCollection('activityFeed', signals.activity, '<div class="hub-empty-block">No recent education activity yet. As you use GPA, degree checks, IELTS, scholarships, or cost tools, the cockpit timeline will update here.</div>', function (item) {
      return '<div class="hub-activity-item">' +
        '<span><strong>' + escapeHtml(item.label) + '</strong>' + (item.detail ? '<small>' + escapeHtml(item.detail) + '</small>' : '') + '</span>' +
        '<time>' + escapeHtml(formatTimeAgo(item.timestamp)) + '</time>' +
      '</div>';
    });
  }

  function renderDashboard(signals) {
    renderHero(signals);
    renderProfile(signals);
    renderChecklist(signals);
    renderCurrentPlan(signals);
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

  function syncLocalSources() {
    cockpit.cachedProfile = readCachedProfile();
    cockpit.quickProfile = readQuickProfile();
    cockpit.state = readCockpitState();
    cockpit.ieltsState = readIeltsState();
    cockpit.jamb = readJambSummary();
    cockpit.shortlistKeys = getScholarshipShortlistKeys();
    cockpit.activity = extractActivity();
    cockpit.profile = mergeSignalsIntoProfile(mapProfileWithFallbacks(
      cockpit.remoteProfile,
      cockpit.cachedProfile,
      cockpit.quickProfile
    ));
    cockpit.shortlistItems = resolveScholarshipShortlist(cockpit.scholarships, cockpit.shortlistKeys);
    cockpit.matches = computeScholarshipMatches(cockpit.profile, cockpit.scholarships);
  }

  function applySignalsAndRender() {
    syncLocalSources();
    var signals = buildSignals();
    renderDashboard(signals);
    return signals;
  }

  function collectProfileSources(fetchRemote) {
    var shouldFetchRemote = fetchRemote !== false && window.EduProfileSync && typeof window.EduProfileSync.getProfile === 'function';
    var remotePromise = shouldFetchRemote
      ? window.EduProfileSync.getProfile().catch(function () { return null; })
      : Promise.resolve(cockpit.remoteProfile);

    return remotePromise.then(function (remoteProfile) {
      cockpit.remoteProfile = remoteProfile || null;
      cockpit.cachedProfile = readCachedProfile();
      cockpit.quickProfile = readQuickProfile();
      return {
        remoteProfile: cockpit.remoteProfile,
        cachedProfile: cockpit.cachedProfile,
        quickProfile: cockpit.quickProfile
      };
    });
  }

  function loadScholarshipFeed() {
    if (window.AfroScholarshipFeed && typeof window.AfroScholarshipFeed.load === 'function') {
      return window.AfroScholarshipFeed.load().then(function (result) {
        return {
          scholarships: result && Array.isArray(result.scholarships) ? result.scholarships : [],
          meta: result && result.meta ? result.meta : buildDefaultScholarshipSource()
        };
      });
    }

    var cached = safeRead(SCHOLARSHIP_CACHE_KEY, null, localStorage);
    if (cached && Array.isArray(cached.scholarships) && cached.scholarships.length) {
      return Promise.resolve({
        scholarships: cached.scholarships,
        meta: {
          mode: 'cache',
          label: 'Cached feed',
          message: 'Live scholarship feed helper is unavailable. Showing the last cached scholarship dataset on this device.',
          tone: 'warn',
          count: cached.scholarships.length,
          cachedAt: cached.savedAt || null,
          updatedLabel: cached.savedAt ? new Date(cached.savedAt).toLocaleDateString() : '',
          isDegraded: true,
          error: 'scholarship feed helper missing'
        }
      });
    }

    return Promise.resolve({
      scholarships: [],
      meta: {
        mode: 'fallback',
        label: 'Feed unavailable',
        message: 'Scholarship feed is unavailable right now, so match counts may be incomplete until the feed is restored.',
        tone: 'warn',
        count: 0,
        cachedAt: null,
        updatedLabel: '',
        isDegraded: true,
        error: 'scholarship feed helper missing'
      }
    });
  }

  function refreshScholarships() {
    return loadScholarshipFeed().then(function (result) {
      cockpit.scholarships = result.scholarships || [];
      cockpit.scholarshipSource = result.meta || buildDefaultScholarshipSource();
      applySignalsAndRender();
      return result;
    });
  }

  function refreshRemoteProfile() {
    return collectProfileSources(true).then(function () {
      lastRemoteProfileRefreshAt = Date.now();
      applySignalsAndRender();
      return cockpit.profile;
    });
  }

  function updateProfile(payload) {
    var cleaned = {};
    Object.keys(payload || {}).forEach(function (key) {
      if (payload[key] !== undefined) cleaned[key] = payload[key];
    });

    if (!Object.keys(cleaned).length) return cockpit.profile;

    if (window.EduProfileSync && typeof window.EduProfileSync.update === 'function') {
      window.EduProfileSync.update(cleaned);
    } else {
      try {
        var cached = safeRead(PROFILE_CACHE_KEY, {}, localStorage) || {};
        localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(Object.assign({}, cached, cleaned, {
          local_updated_at: Date.now()
        })));
      } catch (error) {
        /* ignore local cache write failures */
      }
    }

    cockpit.cachedProfile = Object.assign({}, cockpit.cachedProfile || {}, cleaned);
    cockpit.profile = mergeSignalsIntoProfile(mapProfileWithFallbacks(
      cockpit.remoteProfile,
      cockpit.cachedProfile,
      cockpit.quickProfile
    ));
    return cockpit.profile;
  }

  function recordActivity(label, detail) {
    if (window.AfroEdu && typeof window.AfroEdu.recordActivity === 'function') {
      window.AfroEdu.recordActivity('education-hub', label, detail ? { detail: detail } : {});
    }
  }

  function saveProfileEdits() {
    updateProfile({
      education_level: getEl('edLevel').value || undefined,
      institution: getEl('edInstitution').value.trim() || undefined,
      graduation_date: getEl('edGradDate').value || undefined,
      target_countries: uniqueStrings((getEl('edCountries').value || '').split(',')),
      target_fields: uniqueStrings((getEl('edFields').value || '').split(',')),
      target_study_level: getEl('edStudyLevel').value || undefined
    });

    recordActivity('Updated cockpit profile', 'Profile fields refreshed');
    notify('Education Hub profile updated', 'success');
    applySignalsAndRender();
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
        id: slugify(name + '-' + country),
        name: name,
        country: country,
        feesLabel: note,
        href: '/tools/university-ranking/',
        source: 'education-hub',
        savedAt: Date.now()
      });
    }

    if (country) {
      updateProfile({
        target_countries: uniqueStrings((cockpit.profile.target_countries || []).concat([country]))
      });
    }

    recordActivity('Saved university', name);
    getEl('manualUniversityName').value = '';
    getEl('manualUniversityCountry').value = '';
    getEl('manualUniversityNote').value = '';
    notify('University saved to the cockpit', 'success');
    applySignalsAndRender();
  }

  function routeToHref(routeKey) {
    return routeOptions[routeKey] ? routeOptions[routeKey].href : '#deadline-form';
  }

  function routeToLabel(routeKey) {
    return routeOptions[routeKey] ? routeOptions[routeKey].label : '';
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
        source: 'education-hub',
        savedAt: Date.now()
      });
    }

    mergedCountries = uniqueStrings((cockpit.profile.target_countries || []).concat([name]));
    updateProfile({
      target_countries: mergedCountries,
      target_study_level: studyLevel || cockpit.profile.target_study_level || undefined
    });

    recordActivity('Saved destination', name);
    getEl('destinationSelect').value = '';
    getEl('destinationCustom').value = '';
    getEl('destinationReason').value = '';
    getEl('destinationLevel').value = '';
    notify('Destination saved to the cockpit', 'success');
    applySignalsAndRender();
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
        source: 'education-hub',
        savedAt: Date.now()
      });
    }

    recordActivity('Tracked deadline', title);
    getEl('deadlineTitle').value = '';
    getEl('deadlineDate').value = '';
    getEl('deadlineRoute').value = 'scholarship';
    notify('Deadline saved to the cockpit', 'success');
    applySignalsAndRender();
  }

  function removeDestinationAndProfile(id) {
    var destination = (cockpit.state.destinations || []).find(function (item) {
      return item && item.id === id;
    });
    var nextCountries;

    if (window.AfroEdu && typeof window.AfroEdu.removeDestination === 'function') {
      window.AfroEdu.removeDestination(id);
    }

    nextCountries = uniqueStrings((cockpit.profile.target_countries || []).filter(function (country) {
      return !destination || String(country || '').toLowerCase() !== String(destination.name || '').toLowerCase();
    }));

    updateProfile({
      target_countries: nextCountries
    });

    recordActivity('Removed destination', destination ? destination.name : 'Destination route removed');
  }

  function handleAction(event) {
    var trigger = event.target.closest('[data-action]');
    var action;
    var id;
    var entry;

    if (!trigger) return;

    action = trigger.getAttribute('data-action');
    id = trigger.getAttribute('data-id');

    if (action === 'open-auth') {
      event.preventDefault();
      if (window.AfroAuthModal && typeof window.AfroAuthModal.open === 'function') {
        window.AfroAuthModal.open();
      }
      return;
    }

    if (!id) return;

    if (action === 'remove-university' && window.AfroEdu && typeof window.AfroEdu.removeUniversity === 'function') {
      entry = (cockpit.state.universities || []).find(function (item) { return item && item.id === id; });
      window.AfroEdu.removeUniversity(id);
      recordActivity('Removed university', entry ? entry.name : 'University removed');
    } else if (action === 'remove-destination') {
      removeDestinationAndProfile(id);
    } else if (action === 'remove-budget' && window.AfroEdu && typeof window.AfroEdu.removeBudgetSignal === 'function') {
      entry = (cockpit.state.budgetSignals || []).find(function (item) { return item && item.id === id; });
      window.AfroEdu.removeBudgetSignal(id);
      recordActivity('Removed budget signal', entry ? entry.destination : 'Budget signal removed');
    } else if (action === 'remove-deadline' && window.AfroEdu && typeof window.AfroEdu.removeDeadline === 'function') {
      entry = (cockpit.state.deadlines || []).find(function (item) { return item && item.id === id; });
      window.AfroEdu.removeDeadline(id);
      recordActivity('Removed deadline', entry ? entry.title : 'Deadline removed');
    } else {
      return;
    }

    applySignalsAndRender();
  }

  function bindEvents() {
    document.addEventListener('click', handleAction);
    getEl('saveProfileBtn').addEventListener('click', saveProfileEdits);
    getEl('saveUniversityBtn').addEventListener('click', addManualUniversity);
    getEl('saveDestinationBtn').addEventListener('click', addManualDestination);
    getEl('saveDeadlineBtn').addEventListener('click', addDeadline);

    window.addEventListener('afroedu:profile-updated', function () {
      applySignalsAndRender();
    });
    window.addEventListener('afroedu:quick-profile-updated', function () {
      applySignalsAndRender();
    });
    window.addEventListener('afroedu:cockpit-updated', function () {
      applySignalsAndRender();
    });
    window.addEventListener('afroedu:activity-updated', function () {
      applySignalsAndRender();
    });
    window.addEventListener('afroedu:scholarship-feed-updated', function (event) {
      if (event && event.detail) {
        cockpit.scholarshipSource = Object.assign(buildDefaultScholarshipSource(), event.detail);
      }
      applySignalsAndRender();
    });
    window.addEventListener('storage', function (event) {
      if (!event.key || [PROFILE_CACHE_KEY, QUICK_PROFILE_KEY, COCKPIT_KEY, ACTIVITY_KEY, SHORTLIST_KEY, SCHOLARSHIP_CACHE_KEY, IELTS_STATE_KEY].indexOf(event.key) !== -1) {
        applySignalsAndRender();
      }
    });
    window.addEventListener('focus', function () {
      if (Date.now() - lastRemoteProfileRefreshAt > 60000) {
        refreshRemoteProfile();
        return;
      }
      applySignalsAndRender();
    });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        if (Date.now() - lastRemoteProfileRefreshAt > 60000) {
          refreshRemoteProfile();
          return;
        }
        applySignalsAndRender();
      }
    });
  }

  function applyDestinationOptions() {
    setHtml('destinationSelect', '<option value="">Choose saved destination</option>' + destinationOptions.map(function (name) {
      return '<option value="' + escapeHtml(name) + '">' + escapeHtml(name) + '</option>';
    }).join(''));
  }

  function init() {
    applyDestinationOptions();
    bindEvents();

    collectProfileSources(true).then(function () {
      lastRemoteProfileRefreshAt = Date.now();
      return refreshScholarships();
    }).then(function () {
      applySignalsAndRender();
    }).catch(function () {
      cockpit.remoteProfile = null;
      cockpit.scholarships = [];
      cockpit.scholarshipSource = {
        mode: 'fallback',
        label: 'Feed unavailable',
        message: 'Scholarship signals are temporarily unavailable. The rest of your cockpit still works normally.',
        tone: 'warn',
        count: 0,
        cachedAt: null,
        updatedLabel: '',
        isDegraded: true,
        error: 'hub init failed'
      };
      applySignalsAndRender();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());

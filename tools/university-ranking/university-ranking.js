(function () {
  'use strict';

  var IELTS_STATE_KEY = 'afro-ielts-pathway-state';
  var COUNTRY_ALIASES = {
    uk: 'United Kingdom',
    'united kingdom': 'United Kingdom',
    britain: 'United Kingdom',
    england: 'United Kingdom',
    usa: 'United States',
    us: 'United States',
    'united states': 'United States',
    canada: 'Canada',
    australia: 'Australia',
    germany: 'Germany',
    ireland: 'Ireland',
    france: 'France',
    netherlands: 'Netherlands',
    africa: 'Within Africa',
    'within africa': 'Within Africa',
    global: 'Global'
  };
  var FIELD_ALIASES = {
    engineering: ['Engineering', 'Technology', 'Science'],
    technology: ['Technology', 'Engineering', 'Science'],
    science: ['Science', 'Engineering', 'Technology'],
    medicine: ['Medicine', 'Science'],
    health: ['Medicine', 'Science'],
    business: ['Business'],
    economics: ['Business'],
    finance: ['Business'],
    law: ['Law'],
    agriculture: ['Agriculture', 'Science'],
    arts: ['Arts'],
    humanities: ['Arts'],
    education: ['Education'],
    it: ['Technology', 'Science', 'Engineering'],
    computing: ['Technology', 'Science', 'Engineering'],
    computer: ['Technology', 'Science', 'Engineering']
  };
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

  function safeRead(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
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

  function titleCase(value) {
    return String(value || '')
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, function (match) {
        return match.toUpperCase();
      });
  }

  function uniqueStrings(values) {
    var seen = {};
    return (values || []).filter(function (value) {
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

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function formatNumber(value) {
    var number = Number(value || 0);
    if (isNaN(number)) return '-';
    return number.toLocaleString();
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

  function formatParts(parts) {
    return (parts || []).filter(Boolean).join(' | ');
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

  function readIeltsState() {
    return safeRead(IELTS_STATE_KEY, null) || {};
  }

  function normaliseLookup(values) {
    var lookup = {};
    (values || []).forEach(function (value) {
      lookup[String(value || '').trim().toLowerCase()] = true;
    });
    return lookup;
  }

  function normaliseCountryName(value) {
    var key = String(value || '').trim().toLowerCase();
    if (!key) return '';
    return COUNTRY_ALIASES[key] || titleCase(key);
  }

  function mapIeltsPathwayLevel(pathway) {
    var key = String(pathway || '').toLowerCase();
    if (!key) return '';
    if (key.indexOf('undergrad') !== -1) return 'undergraduate';
    if (key.indexOf('postgrad') !== -1 || key.indexOf('masters') !== -1 || key.indexOf('phd') !== -1) return 'postgraduate';
    return '';
  }

  function getRecentTimestamp(entry) {
    return Number(
      (entry && (entry.updatedAt || entry.savedAt || entry.timestamp || entry.createdAt)) || 0
    );
  }

  function getLatestEntry(entries, predicate) {
    var filtered = (entries || []).filter(function (entry) {
      return entry && (!predicate || predicate(entry));
    });

    if (!filtered.length) return null;

    return filtered.slice().sort(function (left, right) {
      return getRecentTimestamp(right) - getRecentTimestamp(left);
    })[0];
  }

  function getLatestBudgetSignal(cockpit) {
    return getLatestEntry(cockpit && cockpit.budgetSignals, function (entry) {
      return entry && (entry.destination || entry.affordabilityBand);
    });
  }

  function getLatestDestinationSignal(cockpit) {
    return getLatestEntry(cockpit && cockpit.destinations, function (entry) {
      return entry && entry.name;
    });
  }

  function getLatestDegreeRoute(cockpit) {
    return getLatestEntry(cockpit && cockpit.destinations, function (entry) {
      return entry && (entry.readinessState || entry.assessmentNeed || entry.source === 'degree-checker');
    });
  }

  function normaliseAffordabilityBand(value) {
    var label = String(value || '').trim();
    var lower = label.toLowerCase();

    if (!lower) return { key: '', label: '' };
    if (lower.indexOf('high-risk') !== -1 || lower.indexOf('expensive') !== -1) {
      return { key: 'high-risk', label: label };
    }
    if (lower.indexOf('stretch') !== -1) {
      return { key: 'stretch', label: label };
    }
    if (lower.indexOf('affordable') !== -1) {
      return { key: 'affordable', label: label };
    }
    return { key: '', label: label };
  }

  function normaliseUpfrontBand(value) {
    var label = String(value || '').trim();
    var lower = label.toLowerCase();

    if (!lower) return { key: '', label: '' };
    if (lower.indexOf('heavy') !== -1) return { key: 'heavy', label: label };
    if (lower.indexOf('moderate') !== -1) return { key: 'moderate', label: label };
    if (lower.indexOf('low') !== -1 || lower.indexOf('light') !== -1) return { key: 'light', label: label };
    return { key: '', label: label };
  }

  function normaliseReadinessState(value) {
    var label = String(value || '').trim();
    var lower = label.toLowerCase();

    if (!lower) return { key: '', label: '' };
    if (lower.indexOf('broadly aligned') !== -1 || lower === 'broadly aligned') {
      return { key: 'broad', label: label };
    }
    if (lower.indexOf('requires credential review') !== -1 || lower.indexOf('credential review') !== -1) {
      return { key: 'review', label: label };
    }
    if (lower.indexOf('conditions matter') !== -1 || lower.indexOf('pathway possible') !== -1) {
      return { key: 'conditional', label: label };
    }
    if (lower.indexOf('uncertain') !== -1) {
      return { key: 'uncertain', label: label };
    }
    return { key: '', label: label };
  }

  function normaliseAssessmentNeed(value) {
    var label = String(value || '').trim();
    var lower = label.toLowerCase();

    if (!lower) return { key: '', label: '' };
    if (lower.indexOf('usually required') !== -1 ||
        lower.indexOf('very likely required') !== -1 ||
        lower.indexOf('likely required') !== -1) {
      return { key: 'required', label: label };
    }
    if (lower.indexOf('strongly recommended') !== -1 ||
        lower.indexOf('recommended') !== -1 ||
        lower.indexOf('often helpful') !== -1) {
      return { key: 'recommended', label: label };
    }
    if (lower.indexOf('institution or board-led') !== -1 || lower.indexOf('route-specific') !== -1) {
      return { key: 'route-specific', label: label };
    }
    return { key: '', label: label };
  }

  function isEnglishRoute(destination) {
    var normalised = normaliseCountryName(destination);
    return normalised === 'United Kingdom' ||
      normalised === 'United States' ||
      normalised === 'Canada' ||
      normalised === 'Australia' ||
      normalised === 'Ireland';
  }

  function expandFieldTargets(values) {
    var expanded = [];

    (values || []).forEach(function (value) {
      var key = String(value || '').trim().toLowerCase();
      if (!key) return;

      expanded.push(titleCase(key));
      (FIELD_ALIASES[key] || []).forEach(function (alias) {
        expanded.push(alias);
      });

      Object.keys(FIELD_ALIASES).forEach(function (aliasKey) {
        if (key.indexOf(aliasKey) !== -1) {
          FIELD_ALIASES[aliasKey].forEach(function (alias) {
            expanded.push(alias);
          });
        }
      });
    });

    return uniqueStrings(expanded);
  }

  function getDatasetCountries() {
    return uniqueStrings(getUniversities().map(function (university) {
      return normaliseCountryName(university.country);
    }));
  }

  function hasDirectCoverage(destination) {
    var normalised = normaliseCountryName(destination);
    if (!normalised) return false;
    if (normalised === 'Within Africa') return true;
    return normaliseLookup(getDatasetCountries())[normalised.toLowerCase()] === true;
  }

  function buildIeltsSignal(profile, ieltsState, routeDestination) {
    var profileOverall = Number(profile && profile.ielts_overall || 0);
    var cachedOverall = Number(ieltsState && ieltsState.lastOverall || 0);
    var overall = profileOverall || cachedOverall || 0;
    var planningTarget = Number(ieltsState && ieltsState.planningTarget || 0);
    var targetDestination = normaliseCountryName(ieltsState && ieltsState.targetDestination);
    var relevantDestination = normaliseCountryName(routeDestination || targetDestination);
    var relevant = isEnglishRoute(relevantDestination || targetDestination);
    var label = '';
    var key = 'unknown';

    if (relevant && !overall) {
      key = 'missing';
      label = 'No IELTS score saved';
    } else if (relevant && planningTarget && overall && overall + 0.001 < planningTarget) {
      key = 'below-target';
      label = overall.toFixed(1) + ' overall vs target ' + planningTarget.toFixed(1);
    } else if (overall) {
      key = relevant ? 'ready' : 'logged';
      label = overall.toFixed(1) + ' overall on file';
    } else if (targetDestination && targetDestination !== 'Global') {
      key = 'planning';
      label = 'Planning for ' + targetDestination;
    } else {
      key = 'unknown';
      label = '';
    }

    return {
      key: key,
      label: label,
      overall: overall || '',
      planningTarget: planningTarget || '',
      targetDestination: targetDestination || ''
    };
  }

  function getContext() {
    var profile = state.profile || {};
    var cockpit = state.cockpit || {};
    var ieltsState = readIeltsState();
    var latestBudget = getLatestBudgetSignal(cockpit);
    var latestDestination = getLatestDestinationSignal(cockpit);
    var latestDegreeRoute = getLatestDegreeRoute(cockpit);
    var routeDestination = normaliseCountryName(
      (latestBudget && latestBudget.destination) ||
      (latestDegreeRoute && latestDegreeRoute.name) ||
      (latestDestination && latestDestination.name) ||
      (splitList(profile.target_countries)[0]) ||
      (ieltsState && ieltsState.targetDestination)
    );
    var targetCountries = uniqueStrings(
      splitList(profile.target_countries).map(normaliseCountryName)
        .concat((cockpit.destinations || []).map(function (entry) {
          return normaliseCountryName(entry && entry.name);
        }))
        .concat(routeDestination ? [routeDestination] : [])
        .concat(ieltsState && ieltsState.targetDestination ? [normaliseCountryName(ieltsState.targetDestination)] : [])
    ).filter(function (value) {
      return value && value !== 'Global';
    });
    var targetFields = uniqueStrings(
      splitList(profile.target_fields)
        .concat(latestBudget && latestBudget.field ? [latestBudget.field] : [])
        .concat(latestDegreeRoute && latestDegreeRoute.field ? [latestDegreeRoute.field] : [])
    ).map(function (value) {
      return titleCase(value);
    });
    var primaryField = targetFields[0] || '';
    var studyLevel = (latestBudget && latestBudget.level) || profile.target_study_level || mapIeltsPathwayLevel(ieltsState && ieltsState.targetPathway);
    var affordabilityBand = normaliseAffordabilityBand(latestBudget && latestBudget.affordabilityBand);
    var upfrontBand = normaliseUpfrontBand(latestBudget && latestBudget.upfrontBand);
    var readiness = normaliseReadinessState(
      (latestDegreeRoute && latestDegreeRoute.readinessState) ||
      (latestDestination && latestDestination.readinessState)
    );
    var assessmentNeed = normaliseAssessmentNeed(
      (latestDegreeRoute && latestDegreeRoute.assessmentNeed) ||
      (latestDestination && latestDestination.assessmentNeed)
    );
    var ieltsStatus = buildIeltsSignal(profile, ieltsState, routeDestination);
    var routeCoverageMode = routeDestination
      ? (hasDirectCoverage(routeDestination) ? 'direct' : 'indirect')
      : 'general';
    var targetCountryLookup = normaliseLookup(targetCountries);

    return {
      profile: profile,
      cockpit: cockpit,
      targetCountries: targetCountries,
      targetCountryLookup: targetCountryLookup,
      targetFields: targetFields,
      fieldTargets: expandFieldTargets(targetFields.length ? targetFields : (state.filters.strength ? [state.filters.strength] : [])),
      primaryField: primaryField,
      studyLevel: studyLevel || '',
      gpa: profile.gpa_value || '',
      ielts: profile.ielts_overall || ieltsStatus.overall || '',
      ieltsStatus: ieltsStatus,
      savedDestinations: cockpit.destinations || [],
      savedBudgetSignals: cockpit.budgetSignals || [],
      latestBudget: latestBudget,
      latestDestination: latestDestination,
      latestDegreeRoute: latestDegreeRoute,
      routeDestination: routeDestination,
      routeCoverageMode: routeCoverageMode,
      routeCoverageLabel: routeCoverageMode === 'direct'
        ? 'Direct country coverage exists in this dataset.'
        : (routeCoverageMode === 'indirect'
          ? 'Destination coverage is indirect in this dataset.'
          : 'No saved destination route yet.'),
      affordabilityBand: affordabilityBand,
      upfrontBand: upfrontBand,
      readiness: readiness,
      readinessLabel: readiness.label,
      readinessKey: readiness.key,
      assessmentNeed: assessmentNeed.label,
      assessmentNeedKey: assessmentNeed.key,
      routeRecommendation: latestBudget && latestBudget.routeRecommendation ? latestBudget.routeRecommendation : '',
      englishRoute: isEnglishRoute(routeDestination || ieltsStatus.targetDestination)
    };
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

  function affordabilitySignal(university, context) {
    var budgetValue = state.filters.budget;
    var fees = Number(university.fees || 0);
    var reason = '';
    var tradeoff = '';
    var score = 12;
    var financiallySafer = false;

    if (budgetValue) {
      var matches = compareBudgetMatch(fees, budgetValue);
      if (matches) {
        score = 26;
        reason = 'Within your active fee filter';
        financiallySafer = true;
      } else {
        score = 7;
        tradeoff = 'Outside your active fee filter';
      }
    } else if (context.affordabilityBand.key === 'high-risk') {
      if (fees <= 500) {
        score = 26;
        reason = 'Lower-fee option for a funding-sensitive route';
        financiallySafer = true;
      } else if (fees <= 2000) {
        score = 18;
        reason = 'Mid-fee option under current cost pressure';
        financiallySafer = true;
      } else if (fees <= 5000) {
        score = 10;
        tradeoff = 'Cost lane is already high-pressure and this fee sits on the heavier side';
      } else {
        score = 6;
        tradeoff = 'Premium tuition route under a funding-sensitive lane';
      }
    } else if (context.affordabilityBand.key === 'stretch') {
      if (fees <= 500) {
        score = 24;
        reason = 'Lower-fee route that helps a stretch plan';
        financiallySafer = true;
      } else if (fees <= 2000) {
        score = 20;
        reason = 'Better fee posture for a stretch route';
        financiallySafer = true;
      } else if (fees <= 5000) {
        score = 13;
        reason = 'Manageable only if the rest of the route stays disciplined';
      } else {
        score = 7;
        tradeoff = 'Premium fee route inside a stretch cost lane';
      }
    } else if (context.affordabilityBand.key === 'affordable') {
      if (fees <= 500) {
        score = 22;
        reason = 'Lower-fee option';
        financiallySafer = true;
      } else if (fees <= 2000) {
        score = 19;
        reason = 'Comfortable fee range for the current lane';
        financiallySafer = true;
      } else if (fees <= 5000) {
        score = 14;
        reason = 'Higher cost, but still workable if the wider route holds';
      } else {
        score = 9;
        tradeoff = 'Premium tuition route';
      }
    } else if (fees <= 300) {
      score = 22;
      reason = 'Lower-fee option';
      financiallySafer = true;
    } else if (fees <= 1000) {
      score = 18;
      reason = 'Affordable fee range';
      financiallySafer = true;
    } else if (fees <= 3000) {
      score = 13;
      reason = 'Mid-range fee route';
    } else {
      score = 8;
      tradeoff = 'Premium tuition route';
    }

    if (context.upfrontBand.key === 'heavy' && fees > 2000) {
      score -= 2;
      if (!tradeoff) tradeoff = 'Upfront burden is already heavy, so higher fees add more route pressure';
    }

    return {
      score: clamp(score, 6, 26),
      reason: reason,
      tradeoff: tradeoff,
      financiallySafer: financiallySafer
    };
  }

  function programmeSignal(university, context) {
    var targetFields = context.fieldTargets.length
      ? context.fieldTargets
      : (state.filters.strength ? expandFieldTargets([state.filters.strength]) : []);
    var score = 11;
    var reason = '';
    var tradeoff = '';

    if (!targetFields.length) {
      return {
        score: score,
        reason: 'Add a field focus to sharpen shortlist fit',
        tradeoff: '',
        fieldAligned: false
      };
    }

    var lookup = normaliseLookup(targetFields);
    var overlaps = (university.strengths || []).filter(function (strength) {
      return lookup[String(strength || '').trim().toLowerCase()];
    });

    if (overlaps.length) {
      score = 22;
      reason = 'Field fit: ' + overlaps.slice(0, 2).join(', ');
    } else {
      score = 8;
      tradeoff = 'Field alignment is not obvious from the dataset tags';
    }

    return {
      score: score,
      reason: reason,
      tradeoff: tradeoff,
      fieldAligned: overlaps.length > 0
    };
  }

  function destinationSignal(university, context) {
    var country = normaliseCountryName(university.country);
    var score = 10;
    var reason = '';
    var tradeoff = '';
    var destinationAligned = false;

    if (context.routeDestination === 'Within Africa') {
      score = 14;
      reason = 'Matches your within-Africa route';
      destinationAligned = true;
    } else if (context.routeCoverageMode === 'direct' && context.routeDestination) {
      if (country === context.routeDestination) {
        score = 16;
        reason = 'Direct country match for your saved route';
        destinationAligned = true;
      } else if (context.targetCountryLookup[country.toLowerCase()]) {
        score = 13;
        reason = 'Matches one of your saved destinations';
        destinationAligned = true;
      } else {
        score = 7;
        tradeoff = 'Outside your current route destination';
      }
    } else if (context.routeCoverageMode === 'indirect' && context.routeDestination) {
      if (context.targetCountryLookup[country.toLowerCase()]) {
        score = 12;
        reason = 'Matches one of your saved destinations';
        destinationAligned = true;
      } else {
        score = 10;
        reason = 'Destination fit is indirect for the current route';
      }
    } else if (context.targetCountries.length) {
      if (context.targetCountryLookup[country.toLowerCase()]) {
        score = 14;
        reason = 'Matches one of your saved destinations';
        destinationAligned = true;
      } else {
        score = 8;
        tradeoff = 'Outside your saved destinations';
      }
    } else if (state.filters.country && university.country === state.filters.country) {
      score = 14;
      reason = 'Matches your active country focus';
      destinationAligned = true;
    } else {
      score = 10;
      reason = 'Save a destination route to sharpen country fit';
    }

    return {
      score: score,
      reason: reason,
      tradeoff: tradeoff,
      destinationAligned: destinationAligned
    };
  }

  function scholarshipSignal(university, context) {
    var fundingSensitive = context.affordabilityBand.key === 'high-risk' || context.affordabilityBand.key === 'stretch';

    if (university.scholarship) {
      return {
        score: fundingSensitive ? 16 : 13,
        reason: fundingSensitive ? 'Scholarship-friendly under current cost pressure' : 'Scholarship-friendly route',
        tradeoff: '',
        scholarshipFriendly: true
      };
    }

    return {
      score: fundingSensitive ? 4 : 6,
      reason: '',
      tradeoff: fundingSensitive ? 'Funding route looks sensitive and this school has no scholarship flag' : 'No scholarship flag in this dataset',
      scholarshipFriendly: false
    };
  }

  function researchSignal(university) {
    var rank = Number(university.rank || 999);

    if (rank <= 10) {
      return {
        score: 10,
        reason: 'Top-tier research reputation',
        tradeoff: ''
      };
    }

    if (rank <= 25) {
      return {
        score: 8,
        reason: 'Strong regional reputation',
        tradeoff: ''
      };
    }

    return {
      score: 6,
      reason: 'Useful compare candidate',
      tradeoff: ''
    };
  }

  function routeReadinessSignal(context) {
    var score = 10;
    var reason = '';
    var tradeoff = '';
    var qualificationReview = false;

    if (context.readinessKey === 'broad') {
      score = 10;
      reason = 'Qualification route looks broadly aligned';
    } else if (context.readinessKey === 'review') {
      score = 8;
      tradeoff = 'Qualification may still need credential review';
      qualificationReview = true;
    } else if (context.readinessKey === 'conditional') {
      score = 7;
      tradeoff = 'Qualification route is possible, but conditions still matter';
      qualificationReview = true;
    } else if (context.readinessKey === 'uncertain') {
      score = 6;
      tradeoff = 'Qualification route is still uncertain';
      qualificationReview = true;
    }

    if ((context.assessmentNeedKey === 'required' || context.assessmentNeedKey === 'recommended') && !tradeoff) {
      tradeoff = 'Formal credential review still looks relevant';
      qualificationReview = true;
    }

    if (context.englishRoute && context.ieltsStatus.key === 'missing') {
      score -= 1;
      tradeoff = tradeoff || 'IELTS path is still unset for this route';
    } else if (context.englishRoute && context.ieltsStatus.key === 'below-target') {
      score -= 1;
      tradeoff = tradeoff || 'IELTS target still needs work';
    } else if (context.ieltsStatus.key === 'ready' && !reason) {
      reason = 'IELTS score is already on file';
    }

    return {
      score: clamp(score, 6, 10),
      reason: reason,
      tradeoff: tradeoff,
      qualificationReview: qualificationReview,
      ieltsOpen: context.englishRoute && context.ieltsStatus.key !== 'ready'
    };
  }

  function buildAction(title, href, cta) {
    return {
      title: title,
      href: href,
      cta: cta || title
    };
  }

  function chooseNextTool(context, fit, university) {
    if (fit.qualificationReview) {
      return buildAction('Degree Checker', '/tools/degree-checker/', 'Verify degree fit');
    }

    if (context.englishRoute && context.ieltsStatus.key !== 'ready') {
      return buildAction('IELTS Calculator', '/tools/ielts-calculator/', 'Improve IELTS path');
    }

    if (fit.routeStretch) {
      if (university.scholarship || context.affordabilityBand.key === 'high-risk') {
        return buildAction('Scholarship Finder', '/tools/scholarship-finder/', 'Check scholarships');
      }
      return buildAction('Study Abroad Cost', '/tools/study-abroad-cost/', 'Re-check cost');
    }

    if (!context.latestBudget || context.routeCoverageMode === 'indirect') {
      return buildAction('Study Abroad Cost', '/tools/study-abroad-cost/', 'Pressure-test route');
    }

    if ((context.affordabilityBand.key === 'high-risk' || context.affordabilityBand.key === 'stretch') && university.scholarship) {
      return buildAction('Scholarship Finder', '/tools/scholarship-finder/', 'Check scholarships');
    }

    return buildAction('Education Hub', '/tools/education-hub/', 'Review in cockpit');
  }

  function buildRouteSummary(university, context, flags) {
    var summary = [];

    if (flags.financiallySafer) summary.push('Financially safer inside the current lane');
    if (flags.scholarshipFriendly) summary.push('Scholarship-friendly');
    if (flags.routeStretch) summary.push('Route stretch');
    if (flags.qualificationReview) summary.push(context.assessmentNeed || 'Qualification review likely');
    if (context.routeCoverageMode === 'indirect' && context.routeDestination) {
      summary.push('Indirect fit for ' + context.routeDestination);
    } else if (context.routeDestination && flags.destinationAligned) {
      summary.push('Direct match for ' + context.routeDestination);
    }

    return summary.slice(0, 4).join(' | ');
  }

  function evaluateFit(university, context) {
    var affordability = affordabilitySignal(university, context);
    var programme = programmeSignal(university, context);
    var destination = destinationSignal(university, context);
    var scholarship = scholarshipSignal(university, context);
    var research = researchSignal(university);
    var routeReady = routeReadinessSignal(context);
    var reasons = [];
    var tradeoffs = [];
    var score = affordability.score + programme.score + destination.score + scholarship.score + research.score + routeReady.score;
    var label = 'Route needs caution';
    var className = 'fit-review';
    var routeStretch = (
      (context.affordabilityBand.key === 'high-risk' && affordability.score <= 10) ||
      (context.affordabilityBand.key === 'stretch' && affordability.score <= 8)
    );
    var flags = [];
    var nextTool;
    var routeSummary;

    [affordability, programme, destination, scholarship, research, routeReady].forEach(function (signal) {
      if (signal.reason) reasons.push(signal.reason);
      if (signal.tradeoff) tradeoffs.push(signal.tradeoff);
    });

    if (routeStretch) tradeoffs.unshift('Current cost lane makes this a stretch route');

    score = clamp(score, 0, 100);

    if (score >= 86) {
      label = 'Strong shortlist fit';
      className = 'fit-strong';
    } else if (score >= 72) {
      label = 'Good shortlist fit';
      className = 'fit-good';
    } else if (score >= 58) {
      label = 'Compare carefully';
      className = 'fit-watch';
    }

    if (score >= 86) flags.push({ label: 'Strongest fit', tone: 'good' });
    if (affordability.financiallySafer) flags.push({ label: 'Financially safer', tone: 'good' });
    if (scholarship.scholarshipFriendly) flags.push({ label: 'Scholarship-friendly', tone: 'good' });
    if (routeReady.qualificationReview) flags.push({ label: 'Qualification may need review', tone: 'warn' });
    if (routeStretch) flags.push({ label: 'Route stretch', tone: 'warn' });
    if (context.routeCoverageMode === 'indirect' && context.routeDestination) flags.push({ label: 'Indirect route fit', tone: 'info' });

    nextTool = chooseNextTool(context, {
      routeStretch: routeStretch,
      qualificationReview: routeReady.qualificationReview
    }, university);
    routeSummary = buildRouteSummary(university, context, {
      financiallySafer: affordability.financiallySafer,
      scholarshipFriendly: scholarship.scholarshipFriendly,
      qualificationReview: routeReady.qualificationReview,
      routeStretch: routeStretch,
      destinationAligned: destination.destinationAligned
    });

    return {
      score: score,
      label: label,
      className: className,
      reasons: uniqueStrings(reasons).slice(0, 3),
      tradeoffs: uniqueStrings(tradeoffs).slice(0, 2),
      flags: flags.slice(0, 4),
      flagLabels: flags.map(function (flag) { return flag.label; }).slice(0, 4),
      scholarshipFriendly: scholarship.scholarshipFriendly,
      researchWeight: research.score,
      affordabilityWeight: affordability.score,
      financiallySafer: affordability.financiallySafer,
      destinationAligned: destination.destinationAligned,
      qualificationReview: routeReady.qualificationReview,
      routeStretch: routeStretch,
      ieltsOpen: routeReady.ieltsOpen,
      nextTool: nextTool,
      routeSummary: routeSummary,
      saveNote: routeSummary || uniqueStrings(reasons)[0] || 'Shortlist compare candidate'
    };
  }

  function hydrateSavedUniversity(saved, universe) {
    var match = universe.find(function (entry) {
      return buildUniversityId(entry) === saved.id || entry.name === saved.name;
    });
    var context = getContext();

    if (!match) {
      return Object.assign({}, saved, {
        fit: saved.fit || evaluateFit(Object.assign({ strengths: [] }, saved), context),
        storedId: saved.id || ''
      });
    }

    return Object.assign({}, match, saved, {
      id: buildUniversityId(match),
      storedId: saved.id || buildUniversityId(match),
      fit: evaluateFit(Object.assign({}, match, saved), context)
    });
  }

  function getSavedUniversities(universe) {
    return (state.cockpit.universities || []).map(function (entry) {
      return hydrateSavedUniversity(entry, universe);
    }).sort(function (left, right) {
      return getRecentTimestamp(right) - getRecentTimestamp(left);
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
    var first = left === undefined || left === null ? '' : left;
    var second = right === undefined || right === null ? '' : right;

    if (typeof first === 'string') {
      first = first.toLowerCase();
      second = String(second || '').toLowerCase();
    }

    if (first < second) return state.sortAsc ? -1 : 1;
    if (first > second) return state.sortAsc ? 1 : -1;
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
    var context = getContext();
    getEl('heroUniversityCount').textContent = String(allCount);
    getEl('heroShortlistCount').textContent = String(savedCount);
    getEl('heroDestinationCount').textContent = String((context.targetCountries || []).length);
    getEl('heroFocusCount').textContent = String((context.targetFields || []).length);
  }

  function renderProfileSummary() {
    var context = getContext();
    var intro = 'Load target countries and fields from Education Hub to make the fit heuristics more personal.';
    var banner = getEl('routeBanner');
    var factsNode = getEl('routeFacts');
    var coverageNode = getEl('routeCoverage');
    var routeButton = getEl('applyRouteLensBtn');
    var tone = 'info';
    var bannerText = 'Route-aware guidance stays heuristic and transparent.';
    var signals = [];
    var facts = [];

    if (context.routeDestination || context.affordabilityBand.label || context.readinessLabel) {
      intro = 'The shortlist is reading destination, cost, readiness, and IELTS context from the connected study-abroad lane.';
    } else if (context.targetCountries.length || context.targetFields.length || context.gpa || context.ielts) {
      intro = 'Fit mode is reading the saved profile first, then using your active filters to refine the shortlist.';
    }

    if (context.routeDestination) {
      bannerText = context.routeCoverageMode === 'direct'
        ? 'Route lens active: ' + context.routeDestination + ' has direct coverage in this dataset.'
        : 'Route lens active: ' + context.routeDestination + ' is shaping the shortlist indirectly.';
      tone = context.routeCoverageMode === 'direct'
        ? 'good'
        : (context.affordabilityBand.key === 'high-risk' || context.readinessKey === 'uncertain' ? 'warn' : 'info');
    } else if (context.affordabilityBand.label) {
      bannerText = 'Cost lane active: ' + context.affordabilityBand.label + (context.upfrontBand.label ? ' | ' + context.upfrontBand.label : '') + '.';
      tone = context.affordabilityBand.key === 'high-risk' ? 'warn' : 'info';
    }

    if (context.primaryField) signals.push('Field: ' + context.primaryField);
    if (context.targetCountries.length) signals.push('Destinations: ' + context.targetCountries.slice(0, 3).join(', '));
    if (context.studyLevel) signals.push('Level: ' + formatStudyLevel(context.studyLevel));
    if (context.gpa) signals.push('GPA: ' + context.gpa);
    if (context.ieltsStatus.label) signals.push('IELTS: ' + context.ieltsStatus.label);
    if (!signals.length) signals.push('No saved study profile yet');

    if (context.routeDestination) facts.push({ label: 'Route destination', value: context.routeDestination });
    if (context.affordabilityBand.label) facts.push({ label: 'Cost lane', value: context.affordabilityBand.label });
    if (context.upfrontBand.label) facts.push({ label: 'Upfront', value: context.upfrontBand.label });
    if (context.readinessLabel) facts.push({ label: 'Degree route', value: context.readinessLabel });
    if (context.assessmentNeed) facts.push({ label: 'Assessment', value: context.assessmentNeed });
    if (context.ieltsStatus.label) facts.push({ label: 'IELTS', value: context.ieltsStatus.label });

    getEl('profileSummary').textContent = intro;
    getEl('profileSignals').innerHTML = signals.map(function (signal) {
      return '<span class="ur-signal">' + escapeHtml(signal) + '</span>';
    }).join('');

    if (banner) {
      banner.className = 'ur-route-banner is-' + tone;
      banner.textContent = bannerText;
    }

    if (factsNode) {
      factsNode.innerHTML = facts.length ? facts.map(function (fact) {
        return '<div class="ur-route-fact"><span>' + escapeHtml(fact.label) + '</span><strong>' + escapeHtml(fact.value) + '</strong></div>';
      }).join('') : '';
    }

    if (coverageNode) {
      coverageNode.textContent = context.routeCoverageMode === 'direct'
        ? 'Fit stays heuristic. This dataset directly covers your current route, but it still does not estimate admissions certainty.'
        : (context.routeCoverageMode === 'indirect'
          ? 'Fit stays heuristic. ' + context.routeDestination + ' is not directly represented in this dataset, so destination fit is biased indirectly through affordability, readiness, scholarships, and field match.'
          : 'Fit stays heuristic. Save a destination route in Study Abroad Cost or Education Hub to make this shortlist more specific.');
    }

    if (routeButton) {
      routeButton.textContent = context.routeDestination ? 'Apply ' + context.routeDestination + ' route lens' : 'Apply route lens';
      routeButton.disabled = !(context.routeDestination || context.primaryField || context.affordabilityBand.label || context.readinessLabel);
    }
  }

  function findTopBy(universities, comparator) {
    if (!universities.length) return null;
    return universities.slice().sort(comparator)[0];
  }

  function renderDecisionHighlights(universities) {
    var context = getContext();
    var cards = [];
    var strongestFit = findTopBy(universities, function (left, right) {
      return (right.fit.score - left.fit.score) || (left.rank - right.rank);
    });
    var financiallySafer = findTopBy(universities, function (left, right) {
      return (right.fit.affordabilityWeight - left.fit.affordabilityWeight) || (right.fit.score - left.fit.score);
    });
    var scholarshipLead = findTopBy(universities.filter(function (university) {
      return university.scholarship;
    }), function (left, right) {
      return (right.fit.score - left.fit.score) || (left.rank - right.rank);
    });
    var routeLead = findTopBy(universities.filter(function (university) {
      return university.fit.destinationAligned;
    }), function (left, right) {
      return right.fit.score - left.fit.score;
    }) || strongestFit;

    cards.push({
      title: 'Strongest fit',
      name: strongestFit ? strongestFit.name : 'Set filters first',
      copy: strongestFit
        ? formatParts([strongestFit.fit.routeSummary || strongestFit.fit.reasons[0], strongestFit.feesLabel || 'Fees unavailable'])
        : 'Set route context or filters to surface a clearer lead.'
    });

    cards.push({
      title: context.affordabilityBand.label ? 'Financially safer' : 'Best value right now',
      name: financiallySafer ? financiallySafer.name : 'No safer route yet',
      copy: financiallySafer
        ? formatParts([financiallySafer.feesLabel || 'Fees unavailable', financiallySafer.fit.reasons[0] || 'Compare against your budget posture'])
        : 'Use Study Abroad Cost or a fee filter to pressure-test the shortlist.'
    });

    cards.push({
      title: 'Scholarship-friendly',
      name: scholarshipLead ? scholarshipLead.name : 'No flagged option in this view',
      copy: scholarshipLead
        ? formatParts([scholarshipLead.fit.label, 'Use Scholarship Finder to pressure-test funding fit next.'])
        : 'Turn on the scholarship filter if you want only flagged schools.'
    });

    if (context.routeCoverageMode === 'indirect' && context.routeDestination) {
      cards.push({
        title: 'Coverage note',
        name: context.routeDestination,
        copy: 'This dataset does not directly cover the saved destination, so shortlist quality should lean more on field, cost posture, and readiness than on country match.'
      });
    } else if (context.readinessKey && context.readinessKey !== 'broad') {
      cards.push({
        title: 'Qualification caution',
        name: context.readinessLabel || 'Conditions still matter',
        copy: formatParts([context.assessmentNeed, 'Use Degree Checker before treating prestige as the deciding factor.'])
      });
    } else if (context.englishRoute && context.ieltsStatus.key !== 'ready') {
      cards.push({
        title: 'Language pressure',
        name: 'IELTS still active',
        copy: 'Shortlist quality improves once the English-score route is clearer for this destination path.'
      });
    } else {
      cards.push({
        title: context.routeDestination ? 'Route-aligned lead' : 'Highest fit in view',
        name: routeLead ? routeLead.name : 'No shortlist lead yet',
        copy: routeLead
          ? formatParts([routeLead.country || 'Country unknown', routeLead.fit.reasons[0] || 'Strong compare candidate'])
          : 'Save destinations in Education Hub to make this card more personal.'
      });
    }

    getEl('decisionHighlights').innerHTML = cards.map(function (card) {
      return '<article class="ur-highlight-card">' +
        '<strong>' + escapeHtml(card.title) + '</strong>' +
        '<h3>' + escapeHtml(card.name) + '</h3>' +
        '<p>' + escapeHtml(card.copy) + '</p>' +
      '</article>';
    }).join('');
  }

  function renderFlagRow(flags) {
    if (!flags || !flags.length) return '';
    return '<div class="ur-flag-row">' + flags.slice(0, 3).map(function (flag) {
      return '<span class="ur-fit-flag is-' + escapeHtml(flag.tone || 'info') + '">' + escapeHtml(flag.label) + '</span>';
    }).join('') + '</div>';
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
      var reasons = university.fit.reasons.length ? university.fit.reasons.join(' | ') : 'Needs more route context';
      var tradeoff = university.fit.tradeoffs[0] ? 'Watch-out: ' + university.fit.tradeoffs[0] : '';
      var meta = formatParts([
        university.founded ? 'Founded ' + university.founded : '',
        university.students ? formatNumber(university.students) + ' students' : ''
      ]);

      return '<tr>' +
        '<td><span class="ur-rank-badge' + (university.rank <= 3 ? ' is-top' : '') + '">' + escapeHtml(university.rank) + '</span></td>' +
        '<td>' +
          '<div class="ur-uni-name"><strong>' + escapeHtml(university.name) + '</strong><span class="ur-type-badge ' + escapeHtml(String(university.type || '').toLowerCase()) + '">' + escapeHtml(university.type || 'University') + '</span></div>' +
          '<div class="ur-meta-line">' + escapeHtml(meta || 'University profile') + '</div>' +
          '<div class="ur-strengths">' + tags + '</div>' +
          renderFlagRow(university.fit.flags) +
        '</td>' +
        '<td>' + escapeHtml(university.country) + '</td>' +
        '<td><strong>' + escapeHtml(university.feesLabel || '-') + '</strong><div class="ur-meta-line">' + escapeHtml(university.fit.reasons[0] || 'Check affordability posture') + '</div></td>' +
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

  function pushUniqueAction(actions, action) {
    if (!action || !action.href) return;
    if (actions.some(function (entry) { return entry.href === action.href; })) return;
    actions.push(action);
  }

  function buildShortlistLinks(entry, context) {
    var actions = [];

    pushUniqueAction(actions, entry.fit && entry.fit.nextTool);
    if (entry.fit && entry.fit.qualificationReview) {
      pushUniqueAction(actions, buildAction('Degree Checker', '/tools/degree-checker/', 'Degree route'));
    }
    if (entry.fit && entry.fit.routeStretch) {
      pushUniqueAction(actions, buildAction('Study Abroad Cost', '/tools/study-abroad-cost/', 'Re-check cost'));
    }
    if (entry.scholarship || context.affordabilityBand.key === 'high-risk' || context.affordabilityBand.key === 'stretch') {
      pushUniqueAction(actions, buildAction('Scholarship Finder', '/tools/scholarship-finder/', 'Funding fit'));
    }
    if (context.englishRoute && context.ieltsStatus.key !== 'ready') {
      pushUniqueAction(actions, buildAction('IELTS Calculator', '/tools/ielts-calculator/', 'IELTS path'));
    }
    pushUniqueAction(actions, buildAction('Education Hub', '/tools/education-hub/', 'Open cockpit'));
    return actions.slice(0, 3);
  }

  function renderShortlist(universe) {
    var context = getContext();
    var saved = getSavedUniversities(universe);
    var shortlistGrid = getEl('shortlistGrid');
    var metrics = getEl('shortlistMetrics');
    var note = getEl('shortlistNote');
    var intro = getEl('shortlistIntro');
    var cheapest;
    var scholarshipCount;
    var saferCount;
    var reviewCount;
    var alignedCount;
    var countries;
    var commonStrengths = {};
    var repeatedStrengths;
    var coverageMetricLabel;
    var coverageMetricValue;

    renderHeroStats(saved.length, universe.length);
    getEl('shortlistToggle').classList.toggle('is-active', state.filters.shortlistOnly);
    getEl('shortlistToggle').textContent = state.filters.shortlistOnly ? 'Showing shortlist only' : 'Shortlist mode';

    if (!saved.length) {
      metrics.innerHTML = '' +
        '<div class="ur-rail-metric"><strong>Shortlist status</strong><span>0 schools saved</span></div>' +
        '<div class="ur-rail-metric"><strong>Best next move</strong><span>Save 3 to 5 schools to unlock compare mode</span></div>';
      intro.textContent = 'Save schools as you research. This rail turns a ranking table into a route-aware shortlist with cost, scholarship, and readiness pressure.';
      note.textContent = 'Saved schools are not cosmetic anymore. Once a few are here, this rail starts calling out the safer fee posture, scholarship-friendly routes, and qualification cautions.';
      shortlistGrid.innerHTML = '<div class="ur-empty">No universities saved yet. Start from the table, then come back here to compare the shortlist you are building.</div>';
      return;
    }

    cheapest = findTopBy(saved, function (left, right) {
      return Number(left.fees || 999999) - Number(right.fees || 999999);
    });
    scholarshipCount = saved.filter(function (entry) { return !!entry.scholarship; }).length;
    saferCount = saved.filter(function (entry) { return entry.fit && entry.fit.financiallySafer; }).length;
    reviewCount = saved.filter(function (entry) { return entry.fit && entry.fit.qualificationReview; }).length;
    alignedCount = saved.filter(function (entry) { return entry.fit && entry.fit.destinationAligned; }).length;
    countries = uniqueStrings(saved.map(function (entry) { return entry.country; }));

    saved.forEach(function (entry) {
      (entry.strengths || []).forEach(function (strength) {
        commonStrengths[strength] = (commonStrengths[strength] || 0) + 1;
      });
    });

    repeatedStrengths = Object.keys(commonStrengths).filter(function (strength) {
      return commonStrengths[strength] > 1;
    }).slice(0, 3);

    coverageMetricLabel = context.routeCoverageMode === 'indirect' ? 'Coverage' : 'Route aligned';
    coverageMetricValue = context.routeCoverageMode === 'indirect'
      ? ('Indirect for ' + (context.routeDestination || 'current route'))
      : (alignedCount + ' shortlist routes');

    metrics.innerHTML = [
      '<div class="ur-rail-metric"><strong>Most affordable</strong><span>' + escapeHtml((cheapest && cheapest.name) || '-') + '</span></div>',
      '<div class="ur-rail-metric"><strong>Safer fee posture</strong><span>' + escapeHtml(String(saferCount)) + ' of ' + escapeHtml(String(saved.length)) + '</span></div>',
      '<div class="ur-rail-metric"><strong>Scholarship-friendly</strong><span>' + escapeHtml(String(scholarshipCount)) + ' of ' + escapeHtml(String(saved.length)) + '</span></div>',
      '<div class="ur-rail-metric"><strong>' + escapeHtml(coverageMetricLabel) + '</strong><span>' + escapeHtml(coverageMetricValue) + '</span></div>'
    ].join('');

    if (saved.length === 1) {
      intro.textContent = 'You have one school saved. Add a few more so the rail can expose the real tradeoffs.';
    } else if (context.routeDestination || context.affordabilityBand.label) {
      intro.textContent = 'You have ' + saved.length + ' saved schools against the current route. Use this rail to cut prestige-only choices and keep the shortlist realistic.';
    } else {
      intro.textContent = 'You have ' + saved.length + ' saved schools. Use this rail to narrow the shortlist instead of rescanning the whole table.';
    }

    note.textContent = 'Your shortlist spans ' + countries.length + ' countr' + (countries.length === 1 ? 'y' : 'ies') +
      (repeatedStrengths.length ? ', repeats ' + repeatedStrengths.join(', ') + ', and currently flags ' + reviewCount + ' school' + (reviewCount === 1 ? '' : 's') + ' for closer qualification review.' : '.');

    shortlistGrid.innerHTML = saved.map(function (entry) {
      var routeFlags = (entry.shortlistSignals && entry.shortlistSignals.length
        ? entry.shortlistSignals.map(function (label) { return { label: label, tone: 'info' }; })
        : (entry.fit && entry.fit.flags) || []).slice(0, 4);
      var summary = entry.routeSummary || (entry.fit && entry.fit.routeSummary) || formatParts((entry.fit && entry.fit.reasons) || []);
      var actions = buildShortlistLinks(entry, context);
      var meta = formatParts([entry.country || '', entry.rank ? ('Rank ' + entry.rank) : '', entry.feesLabel || 'Fees unavailable']);

      return '<article class="ur-short-card">' +
        '<div class="ur-short-top"><span class="ur-fit-badge ' + escapeHtml(entry.fit.className) + '">' + escapeHtml(entry.fit.label) + '</span><button type="button" data-action="remove-save" data-id="' + escapeHtml(entry.id) + '" data-stored-id="' + escapeHtml(entry.storedId || entry.id) + '">Remove</button></div>' +
        '<h3>' + escapeHtml(entry.name) + '</h3>' +
        '<p>' + escapeHtml(meta) + '</p>' +
        renderFlagRow(routeFlags) +
        (summary ? '<div class="ur-short-context">' + escapeHtml(summary) + '</div>' : '') +
        '<div class="ur-short-tags">' + ((entry.fit && entry.fit.reasons) || []).slice(0, 2).map(function (reason) {
          return '<span>' + escapeHtml(reason) + '</span>';
        }).join('') + '</div>' +
        ((entry.fit && entry.fit.tradeoffs && entry.fit.tradeoffs[0]) ? '<p class="ur-short-caution">Watch-out: ' + escapeHtml(entry.fit.tradeoffs[0]) + '</p>' : '') +
        '<div class="ur-short-actions">' + actions.map(function (action) {
          return '<a href="' + escapeHtml(action.href) + '">' + escapeHtml(action.cta) + '</a>';
        }).join('') + '</div>' +
      '</article>';
    }).join('');
  }

  function renderNextRoutes(savedCount) {
    var context = getContext();
    var cards = [];

    if (!context.latestBudget || context.routeCoverageMode === 'indirect') {
      cards.push({
        title: context.routeCoverageMode === 'indirect' && context.routeDestination
          ? 'Re-check the destination route'
          : 'Pressure-test the wider cost route',
        copy: context.routeCoverageMode === 'indirect' && context.routeDestination
          ? context.routeDestination + ' is not directly represented in this shortlist dataset, so confirm the wider affordability route before committing too hard to the schools here.'
          : (savedCount
            ? 'You already have schools in view. Now compare the broader destination-cost pressure around the route you are leaning toward.'
            : 'After you shortlist a few schools, use Study Abroad Cost to understand how the wider destination plan behaves.'),
        href: '/tools/study-abroad-cost/',
        cta: 'Open Study Abroad Cost'
      });
    }

    if (context.readinessKey && context.readinessKey !== 'broad') {
      cards.push({
        title: 'Validate qualification readiness',
        copy: (context.readinessLabel || 'Degree readiness still matters') + (context.assessmentNeed ? ' | ' + context.assessmentNeed : '') + '. Re-check this before prestige or ranking becomes the deciding factor.',
        href: '/tools/degree-checker/',
        cta: 'Open Degree Checker'
      });
    }

    if (context.englishRoute && context.ieltsStatus.key !== 'ready') {
      cards.push({
        title: 'Tighten the IELTS route',
        copy: 'An English-score gap can make a shortlist look stronger on paper than it is in practice. Keep the language path honest before you push applications harder.',
        href: '/tools/ielts-calculator/',
        cta: 'Open IELTS Calculator'
      });
    }

    if (context.affordabilityBand.key === 'high-risk' || context.affordabilityBand.key === 'stretch' || savedCount) {
      cards.push({
        title: 'Pair shortlist schools with funding routes',
        copy: 'Scholarship Finder helps you pressure-test whether the shortlist has realistic funding support or needs a cheaper backup route.',
        href: '/tools/scholarship-finder/',
        cta: 'Open Scholarship Finder'
      });
    }

    cards.push({
      title: 'Keep the shortlist inside your cockpit',
      copy: 'Education Hub now reads saved schools as route objects, not just names, so the cockpit can understand shortlist quality instead of only shortlist count.',
      href: '/tools/education-hub/',
      cta: 'Open Education Hub'
    });

    getEl('nextRouteGrid').innerHTML = cards.slice(0, 4).map(function (card) {
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
    var filtered;

    getSavedUniversities(universe).forEach(function (entry) {
      savedLookup[entry.id] = true;
    });

    filtered = universe.filter(function (university) {
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

  function syncFilterInputs() {
    if (getEl('searchInput')) getEl('searchInput').value = state.filters.search || '';
    if (getEl('countryFilter')) getEl('countryFilter').value = state.filters.country || '';
    if (getEl('typeFilter')) getEl('typeFilter').value = state.filters.type || '';
    if (getEl('strengthFilter')) getEl('strengthFilter').value = state.filters.strength || '';
    if (getEl('budgetFilter')) getEl('budgetFilter').value = state.filters.budget || '';
    if (getEl('scholarshipFilter')) getEl('scholarshipFilter').value = state.filters.scholarship || '';
  }

  function getBestStrengthMatch(context) {
    var datasetStrengths = normaliseLookup(uniqueStrings(getUniversities().reduce(function (acc, university) {
      return acc.concat(university.strengths || []);
    }, [])));
    var targets = context.fieldTargets.length ? context.fieldTargets : [];

    return targets.find(function (target) {
      return datasetStrengths[String(target || '').toLowerCase()];
    }) || '';
  }

  function applyRouteLens() {
    syncContextFromStorage();
    var context = getContext();
    var changed = false;
    var matchedStrength = getBestStrengthMatch(context);

    if (!state.filters.country && context.routeCoverageMode === 'direct' && context.routeDestination && context.routeDestination !== 'Within Africa') {
      state.filters.country = context.routeDestination;
      changed = true;
    }

    if (!state.filters.strength && matchedStrength) {
      state.filters.strength = matchedStrength;
      changed = true;
    }

    if (!state.filters.budget && context.affordabilityBand.key === 'high-risk') {
      state.filters.budget = '2000';
      changed = true;
    } else if (!state.filters.budget && context.affordabilityBand.key === 'stretch') {
      state.filters.budget = '5000';
      changed = true;
    }

    if (!state.filters.scholarship && (context.affordabilityBand.key === 'high-risk' || context.affordabilityBand.key === 'stretch')) {
      state.filters.scholarship = 'yes';
      changed = true;
    }

    if (!changed && window.AfroToast && typeof window.AfroToast.show === 'function') {
      window.AfroToast.show('The current route is already reflected in your active filters.', 'info');
    } else if (changed && window.AfroToast && typeof window.AfroToast.show === 'function') {
      window.AfroToast.show('Applied the strongest route lens available from your connected study-abroad context.', 'success');
    }

    syncFilterInputs();
    filterAndRender();
  }

  function shouldSyncCountryIntent(university, context, profile) {
    var existingCountries = splitList(profile && profile.target_countries).map(normaliseCountryName);
    var universityCountry = normaliseCountryName(university && university.country);

    if (!universityCountry) return false;
    if (!existingCountries.length) return true;
    if (state.filters.country && normaliseCountryName(state.filters.country) === universityCountry) return true;
    if (context.routeCoverageMode === 'direct' && context.routeDestination === universityCountry) return true;
    return false;
  }

  function saveUniversity(university) {
    if (!university || !window.AfroEdu || typeof window.AfroEdu.saveUniversity !== 'function') return;
    var profile = getProfileState();
    var context = getContext();
    var routeSignals = university.fit.flagLabels || [];

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
      routeDestination: context.routeDestination || '',
      routeAffordability: context.affordabilityBand.label || '',
      routeUpfront: context.upfrontBand.label || '',
      readinessState: context.readinessLabel || '',
      assessmentNeed: context.assessmentNeed || '',
      ieltsState: context.ieltsStatus.label || '',
      studyLevel: context.studyLevel || '',
      field: context.primaryField || '',
      shortlistSignals: routeSignals.slice(0, 4),
      nextTool: university.fit.nextTool ? university.fit.nextTool.title : '',
      routeSummary: university.fit.routeSummary,
      note: university.fit.reasons[0] || 'Shortlist compare candidate'
    });

    if (window.EduProfileSync && typeof window.EduProfileSync.update === 'function' && shouldSyncCountryIntent(university, context, profile)) {
      window.EduProfileSync.update({
        target_countries: uniqueStrings(splitList(profile.target_countries).concat([university.country]))
      });
    }

    if (typeof window.AfroEdu.recordActivity === 'function') {
      window.AfroEdu.recordActivity('university-ranking', 'Updated route-aware shortlist', {
        detail: formatParts([university.name, university.fit.label, university.fit.routeSummary || university.fit.reasons[0]])
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
      window.AfroEdu.recordActivity('university-ranking', 'Removed shortlist school', {
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
      syncFilterInputs();
      filterAndRender();
    });

    if (getEl('applyRouteLensBtn')) {
      getEl('applyRouteLensBtn').addEventListener('click', applyRouteLens);
    }

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

    window.addEventListener('afroedu:profile-updated', filterAndRender);
    window.addEventListener('afroedu:cockpit-updated', filterAndRender);
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

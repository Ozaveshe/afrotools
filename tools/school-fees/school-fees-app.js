(function (window, document) {
  'use strict';

  var PROFILE_CACHE_KEY = 'afroedu-profile-cache';
  var COCKPIT_KEY = 'afroedu-cockpit-state';
  var routeState = {
    context: null,
    visibleRows: [],
    autoApplied: false
  };

  var COUNTRY_ALIASES = {
    nigeria: { code: 'NG', label: 'Nigeria' },
    kenya: { code: 'KE', label: 'Kenya' },
    ghana: { code: 'GH', label: 'Ghana' },
    'south africa': { code: 'ZA', label: 'South Africa' },
    uganda: { code: 'UG', label: 'Uganda' },
    tanzania: { code: 'TZ', label: 'Tanzania' },
    rwanda: { code: 'RW', label: 'Rwanda' },
    ethiopia: { code: 'ET', label: 'Ethiopia' },
    zambia: { code: 'ZM', label: 'Zambia' },
    botswana: { code: 'BW', label: 'Botswana' },
    namibia: { code: 'NA', label: 'Namibia' },
    zimbabwe: { code: 'ZW', label: 'Zimbabwe' }
  };

  function $(id) {
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

  function titleCase(value) {
    return String(value || '')
      .replace(/[_-]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(function (part) {
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(' ');
  }

  function slugify(value, fallback) {
    var base = String(value || fallback || 'item')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return base || fallback || 'item';
  }

  function normalize(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function formatNumber(value) {
    var numeric = Number(value || 0);
    return Number.isFinite(numeric) ? numeric.toLocaleString() : '0';
  }

  function formatMoney(value, currency) {
    var numeric = Number(value || 0);
    if (!Number.isFinite(numeric)) return '0';
    return (currency ? currency + ' ' : '') + formatNumber(numeric);
  }

  function sortByRecency(left, right) {
    return Number(right && (right.updatedAt || right.savedAt) || 0) - Number(left && (left.updatedAt || left.savedAt) || 0);
  }

  function uniqueStrings(list) {
    var seen = {};
    return (list || []).filter(function (value) {
      var key = normalize(value);
      if (!key || seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function safeCountryLookup(value) {
    return COUNTRY_ALIASES[normalize(value)] || null;
  }

  function educationLevelHint(level) {
    var normalized = normalize(level);
    if (!normalized) return '';
    if (['undergraduate', 'undergrad', 'bachelors', 'postgraduate', 'masters', 'phd'].indexOf(normalized) !== -1) {
      return 'University';
    }
    if (normalized === 'secondary') return 'Secondary';
    if (normalized === 'primary') return 'Primary';
    return titleCase(level);
  }

  function readCockpitState() {
    if (window.AfroEdu && typeof window.AfroEdu.getCockpitState === 'function') {
      return window.AfroEdu.getCockpitState() || {};
    }
    return safeRead(COCKPIT_KEY, {}) || {};
  }

  function buildCountryMix(universities) {
    var counts = {};
    (universities || []).forEach(function (university) {
      var country = university && university.country;
      if (!country) return;
      var key = normalize(country);
      counts[key] = counts[key] || { key: key, label: country, count: 0, code: '' };
      counts[key].count += 1;
      counts[key].code = (safeCountryLookup(country) || {}).code || counts[key].code;
    });
    return Object.keys(counts).map(function (key) {
      return counts[key];
    }).sort(function (left, right) {
      return right.count - left.count;
    });
  }

  function buildCoverage(routeDestination, countryMix) {
    var routeCountry = safeCountryLookup(routeDestination || '');
    if (routeCountry) {
      return {
        kind: 'direct',
        code: routeCountry.code,
        label: 'Direct coverage',
        body: 'Your saved route already points to ' + routeCountry.label + ', so School Fees can start with a relevant country lens.',
        countryLabel: routeCountry.label
      };
    }

    var shortlistCountry = (countryMix || []).find(function (entry) {
      return entry.code;
    });

    if (shortlistCountry) {
      return {
        kind: 'shortlist',
        code: shortlistCountry.code,
        label: 'Shortlist-led coverage',
        body: 'The route destination may be broader, but your saved shortlist already leans toward ' + shortlistCountry.label + '. Start there for a grounded fee comparison.',
        countryLabel: shortlistCountry.label
      };
    }

    if (routeDestination) {
      return {
        kind: 'indirect',
        code: '',
        label: 'Indirect coverage',
        body: 'Your saved route points outside the current School Fees feed. Use this tool to sanity-check African or regional fee pressure, not to infer exact overseas tuition.',
        countryLabel: ''
      };
    }

    return {
      kind: 'general',
      code: '',
      label: 'General mode',
      body: 'No route context is saved yet. The tool still works, but it will stay in general comparison mode until your shortlist or cockpit signals exist.',
      countryLabel: ''
    };
  }

  function buildConnectedContext() {
    var cockpit = readCockpitState();
    var profile = safeRead(PROFILE_CACHE_KEY, {}) || {};
    var universities = (Array.isArray(cockpit.universities) ? cockpit.universities : []).slice().sort(sortByRecency);
    var destinations = (Array.isArray(cockpit.destinations) ? cockpit.destinations : []).slice().sort(sortByRecency);
    var budgetSignals = (Array.isArray(cockpit.budgetSignals) ? cockpit.budgetSignals : []).slice().sort(sortByRecency);
    var latestBudget = budgetSignals[0] || null;
    var leadUniversity = universities[0] || null;
    var leadDestination = destinations[0] || null;
    var routeDestination = (latestBudget && (latestBudget.routeDestination || latestBudget.destination)) || (leadDestination && leadDestination.name) || ((profile.target_countries || [])[0]) || (leadUniversity && leadUniversity.routeDestination) || '';
    var routeAffordability = (latestBudget && latestBudget.affordabilityBand) || (leadUniversity && leadUniversity.routeAffordability) || '';
    var routeUpfront = (latestBudget && (latestBudget.routeUpfront || latestBudget.upfrontBand)) || (leadUniversity && leadUniversity.routeUpfront) || '';
    var studyLevel = (latestBudget && (latestBudget.studyLevel || latestBudget.level)) || (leadUniversity && leadUniversity.studyLevel) || profile.target_study_level || '';
    var field = (latestBudget && latestBudget.field) || (leadUniversity && leadUniversity.field) || ((profile.target_fields || [])[0]) || '';
    var routeSummary = (latestBudget && latestBudget.routeSummary) || (latestBudget && latestBudget.routeRecommendation) || (leadUniversity && leadUniversity.routeSummary) || '';
    var countryMix = buildCountryMix(universities);
    var coverage = buildCoverage(routeDestination, countryMix);

    return {
      profile: profile,
      universities: universities,
      destinations: destinations,
      budgetSignals: budgetSignals,
      latestBudget: latestBudget,
      routeDestination: routeDestination,
      routeAffordability: routeAffordability,
      routeUpfront: routeUpfront,
      studyLevel: studyLevel,
      field: field,
      routeSummary: routeSummary,
      countryMix: countryMix,
      countryMixSummary: summarizeCountryMix(countryMix),
      shortlistContext: universities.length ? buildShortlistContext({
        universities: universities,
        countryMix: countryMix
      }) : '',
      coverage: coverage,
      hasContext: !!(universities.length || budgetSignals.length || routeDestination || studyLevel || field)
    };
  }

  function describeAffordability(value) {
    var normalized = normalize(value);
    if (!normalized) {
      return {
        label: 'No affordability posture',
        tone: 'ok',
        summary: 'You have not locked a finance posture yet, so treat the fee rows as reference inputs rather than route verdicts.'
      };
    }
    if (normalized.indexOf('afford') !== -1 || normalized.indexOf('safer') !== -1 || normalized.indexOf('low') !== -1) {
      return {
        label: 'Financially safer',
        tone: 'good',
        summary: 'Your current route is leaning toward financially safer options, so use School Fees to protect that posture.'
      };
    }
    if (normalized.indexOf('stretch') !== -1) {
      return {
        label: 'Stretch route',
        tone: 'warn',
        summary: 'The active route is already a stretch, so fee comparisons should focus on keeping pressure from worsening.'
      };
    }
    if (normalized.indexOf('high') !== -1 || normalized.indexOf('premium') !== -1 || normalized.indexOf('risk') !== -1 || normalized.indexOf('expensive') !== -1) {
      return {
        label: 'High-pressure route',
        tone: 'risk',
        summary: 'The route is already under fee pressure. Use this page to identify safer fallbacks or prove that monthly planning still works.'
      };
    }
    return {
      label: titleCase(value),
      tone: 'ok',
      summary: 'Use the saved route posture as a lens, but keep treating fee rows as indicative unless the live record clearly confirms them.'
    };
  }

  function computeRowStats(rows) {
    if (!rows || !rows.length) return null;
    var currency = rows[0] && (rows[0].currency_code || rows[0].currency || '');
    var sameCurrency = rows.every(function (row) {
      return (row.currency_code || row.currency || '') === currency;
    });
    if (!sameCurrency) return null;

    var totals = rows.map(function (row) {
      return Number(row.annual_tuition || 0) + Number(row.extras_total || 0);
    }).filter(function (value) {
      return Number.isFinite(value);
    }).sort(function (left, right) {
      return left - right;
    });

    if (!totals.length) return null;

    return {
      currency: currency,
      totals: totals,
      min: totals[0],
      max: totals[totals.length - 1],
      median: totals[Math.floor(totals.length / 2)]
    };
  }

  function percentileFor(value, stats) {
    if (!stats || !stats.totals || !stats.totals.length) return 0.5;
    var index = stats.totals.findIndex(function (item) {
      return value <= item;
    });
    if (index === -1) return 1;
    return stats.totals.length === 1 ? 0.5 : index / (stats.totals.length - 1);
  }

  function matchSavedUniversity(row, universities) {
    var institution = normalize(row && row.institution_name);
    if (!institution) return null;
    return (universities || []).find(function (university) {
      var name = normalize(university && university.name);
      return name && (institution === name || institution.indexOf(name) !== -1 || name.indexOf(institution) !== -1);
    }) || null;
  }

  function classifyFeeRow(row, total, matchedUniversity) {
    var stats = computeRowStats(routeState.visibleRows);
    var posture = describeAffordability(routeState.context && routeState.context.routeAffordability);
    var percentile = percentileFor(total, stats);
    var label = 'Reference';
    var tone = 'ok';
    var note = 'Use Student Budget next if you need to see whether the month still survives after fees.';

    if (matchedUniversity && matchedUniversity.routeAffordability) {
      posture = describeAffordability(matchedUniversity.routeAffordability);
    }

    if (!stats) {
      if (posture.tone === 'good') {
        label = 'Safer route';
        tone = 'good';
      } else if (posture.tone === 'risk') {
        label = 'High pressure';
        tone = 'risk';
      } else if (posture.tone === 'warn') {
        label = 'Stretch route';
        tone = 'warn';
      }
      if (matchedUniversity) {
        note = 'This school is already in your saved shortlist, so use the fee row to verify whether the route still feels realistic.';
      }
      return { label: label, tone: tone, note: note };
    }

    if (posture.tone === 'good') {
      if (percentile <= 0.4) {
        label = 'Safer';
        tone = 'good';
      } else if (percentile <= 0.75) {
        label = 'Stretch';
        tone = 'warn';
      } else {
        label = 'Premium';
        tone = 'risk';
      }
    } else if (posture.tone === 'risk') {
      if (percentile <= 0.2) {
        label = 'Safer';
        tone = 'good';
      } else if (percentile <= 0.55) {
        label = 'Stretch';
        tone = 'warn';
      } else {
        label = 'High pressure';
        tone = 'risk';
      }
    } else {
      if (percentile <= 0.25) {
        label = 'Financially safer';
        tone = 'good';
      } else if (percentile <= 0.65) {
        label = 'Stretch';
        tone = 'warn';
      } else {
        label = 'High pressure';
        tone = 'risk';
      }
    }

    if (matchedUniversity) {
      note = 'Already in your shortlist. Compare this verified row against the saved fee band before you keep the school in the active plan.';
    } else if (label === 'Safer' || label === 'Financially safer') {
      note = 'This row sits in the lower part of the current fee spread, so it is the best candidate for monthly pressure-testing first.';
    } else if (label === 'Stretch') {
      note = 'This fee row is workable only if your monthly budget and route posture still have room for pressure.';
    } else {
      note = 'Treat this row as premium fee pressure until Student Budget proves the monthly route can absorb it.';
    }

    return { label: label, tone: tone, note: note };
  }

  function sourceLabel(value) {
    var map = {
      self_observed: 'Self observed',
      receipt: 'Receipt / schedule',
      official_notice: 'Official notice',
      community_check: 'Community check',
      community_report: 'Community report',
      school_website: 'School website'
    };
    return map[value] || 'Contributor data';
  }

  function summarizeCountryMix(countryMix) {
    if (!(countryMix || []).length) return '';
    return countryMix.slice(0, 2).map(function (entry) {
      return entry.label + (entry.count > 1 ? ' x' + entry.count : '');
    }).join(' | ');
  }

  function buildShortlistContext(context) {
    if (!context || !(context.universities || []).length) return '';

    var parts = [
      context.universities.length + ' saved school' + (context.universities.length === 1 ? '' : 's')
    ];

    if ((context.countryMix || []).length) {
      parts.push(context.countryMix[0].label + ' lead');
    }

    return parts.join(' | ');
  }

  function resolveRouteUpfront(context, matchedUniversity) {
    return (matchedUniversity && matchedUniversity.routeUpfront) ||
      (context && context.routeUpfront) ||
      (context && context.latestBudget && (context.latestBudget.routeUpfront || context.latestBudget.upfrontBand)) ||
      '';
  }

  function getFeeConfidence(row, matchedUniversity) {
    var source = normalize(row && row.source_type);
    var hasProof = !!(row && row.proof_url);

    if ((source === 'school website' || source === 'school_website' || source === 'official notice' || source === 'official_notice' || source === 'receipt') && hasProof) {
      return {
        label: 'Confirmed live fee',
        detail: 'This fee row is backed by a school-linked or official proof source.',
        mode: 'confirmed',
        tone: 'good'
      };
    }

    if (hasProof) {
      return {
        label: 'Proof-linked fee row',
        detail: 'This fee row has supporting proof, but you should still confirm the current school charge yourself.',
        mode: 'proof',
        tone: 'ok'
      };
    }

    if (matchedUniversity) {
      return {
        label: 'Shortlist estimate route',
        detail: 'You are planning around a saved shortlist school, but this fee case is still indicative rather than fully confirmed.',
        mode: 'estimate',
        tone: 'warn'
      };
    }

    return {
      label: 'Indicative fee estimate',
      detail: 'Use this as a planning input, not a guaranteed live tuition figure.',
      mode: 'estimate',
      tone: 'warn'
    };
  }

  function getPlanningMode(context, matchedUniversity, feeConfidence, laneLabel) {
    if (feeConfidence && feeConfidence.mode === 'confirmed') return 'Confirmed fee route';
    if (matchedUniversity) return 'Shortlist estimate route';
    if (/safer/i.test(laneLabel || '')) return 'Safer route';
    if (/stretch/i.test(laneLabel || '')) return 'Stretch route';
    if (/premium|high pressure/i.test(laneLabel || '')) return 'Premium pressure route';
    return (context && context.routeAffordability) || 'Reference fee route';
  }

  function formatObserved(value) {
    if (!value) return '';
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function matchBudgetCityKey(value) {
    var aliases = {
      lagos: 'lagos',
      abuja: 'abuja',
      ibadan: 'ibadan',
      ife: 'ibadan',
      nairobi: 'nairobi',
      mombasa: 'mombasa',
      accra: 'accra',
      kumasi: 'kumasi',
      'cape town': 'capetown',
      johannesburg: 'johannesburg',
      'addis ababa': 'addis',
      kampala: 'kampala',
      'dar es salaam': 'dar',
      kigali: 'kigali'
    };
    return aliases[normalize(value)] || '';
  }

  function buildStudentBudgetHref(row, annualFee, feeLane, matchedUniversity) {
    var params = new URLSearchParams();
    var context = routeState.context || {};
    var feeConfidence = getFeeConfidence(row, matchedUniversity);
    var planningMode = getPlanningMode(context, matchedUniversity, feeConfidence, feeLane && feeLane.label);
    var routeDestination = (matchedUniversity && matchedUniversity.routeDestination) || context.routeDestination || context.coverage.countryLabel || '';
    var routeUpfront = resolveRouteUpfront(context, matchedUniversity);
    var studyLevel = row.education_level || context.studyLevel || '';
    var field = (matchedUniversity && matchedUniversity.field) || context.field || '';
    var shortlistContext = context.shortlistContext || buildShortlistContext(context);
    var countryMixSummary = context.countryMixSummary || summarizeCountryMix(context.countryMix);

    params.set('school', row.institution_name || 'School');
    params.set('annualFee', annualFee || 0);
    if (row.currency_code) params.set('currency', row.currency_code);
    if (row.city) params.set('city', row.city);
    if (feeLane && feeLane.label) params.set('feeBand', feeLane.label);
    if (feeLane && feeLane.note) params.set('feeLaneSummary', feeLane.note);
    if (context.routeAffordability) params.set('routeAffordability', context.routeAffordability);
    if (context.routeSummary) params.set('routeSummary', context.routeSummary);
    if (routeDestination) params.set('routeDestination', routeDestination);
    if (routeUpfront) params.set('routeUpfront', routeUpfront);
    if (studyLevel) params.set('studyLevel', studyLevel);
    if (field) params.set('field', field);
    if (planningMode) params.set('planningMode', planningMode);
    if (feeConfidence.label) params.set('feeConfidence', feeConfidence.label);
    if (feeConfidence.detail) params.set('feeConfidenceDetail', feeConfidence.detail);
    if (row.source_type) params.set('feeSourceLabel', sourceLabel(row.source_type));
    if (shortlistContext) params.set('shortlistContext', shortlistContext);
    if (countryMixSummary) params.set('countryMixSummary', countryMixSummary);
    params.set('source', 'school-fees');
    var cityKey = matchBudgetCityKey(row.city);
    if (cityKey) params.set('cityKey', cityKey);
    return '/tools/student-budget/?' + params.toString();
  }

  function renderRouteBanner() {
    var context = routeState.context;
    var banner = $('sfRouteBanner');
    if (!banner || !context) return;

    var posture = describeAffordability(context.routeAffordability);
    var meta = [];
    if (context.routeDestination) meta.push(context.routeDestination);
    if (context.studyLevel) meta.push(titleCase(context.studyLevel));
    if (context.field) meta.push(titleCase(context.field));
    if (context.countryMix.length) meta.push(context.countryMix[0].label + ' shortlist lead');
    if (context.universities.length) meta.push(context.universities.length + ' saved school' + (context.universities.length === 1 ? '' : 's'));

    banner.classList.add('is-visible');
    banner.innerHTML = '<div class="sf-route-copy">' +
      '<span class="sf-route-kicker">' + escapeHtml(context.hasContext ? 'Connected finance route' : 'General finance route') + '</span>' +
      '<h2 class="sf-route-title">' + escapeHtml(context.hasContext ? posture.label + ' fee comparison' : 'Start with fee comparison, then decide what breaks next') + '</h2>' +
      '<p class="sf-route-body">' + escapeHtml(context.hasContext ? posture.summary + ' ' + context.coverage.body : 'School Fees works best when it can read your shortlist, route pressure, and study level from the cockpit. Save a shortlist first if you want a warmer start.') + '</p>' +
      '<div class="sf-route-meta">' + meta.map(function (item) {
        return '<span class="sf-meta-pill">' + escapeHtml(item) + '</span>';
      }).join('') + '</div>' +
      (context.routeSummary ? '<p class="sf-route-body" style="margin-top:12px;">' + escapeHtml(context.routeSummary) + '</p>' : '') +
      '<div class="sf-route-actions">' +
        '<button class="sf-route-button" type="button" data-sf-action="save-signal">Send finance signal to Education Hub</button>' +
        '<a class="sf-route-button ghost" href="/tools/university-ranking/">Review shortlist</a>' +
      '</div>' +
      '<div class="sf-feedback" id="sfRouteFeedback" aria-live="polite"></div>' +
    '</div>';
  }

  function renderFilterActions() {
    var context = routeState.context;
    var holder = $('sfFilterActions');
    if (!holder) return;

    var items = [];
    if (context.coverage.code) {
      items.push({
        action: 'apply-country',
        value: context.coverage.code,
        label: 'Filter to ' + context.coverage.countryLabel
      });
    }
    if (educationLevelHint(context.studyLevel)) {
      items.push({
        action: 'apply-level',
        value: educationLevelHint(context.studyLevel),
        label: 'Focus ' + educationLevelHint(context.studyLevel) + ' fees'
      });
    }
    if (context.routeAffordability) {
      items.push({
        action: 'open-student-budget',
        value: '',
        label: 'Pressure-test in Student Budget'
      });
    }
    if ($('mdCountry') && ($('mdCountry').value || $('mdLevel').value || $('mdCity').value || $('mdType').value)) {
      items.push({
        action: 'clear-filters',
        value: '',
        label: 'Clear fee lens'
      });
    }

    holder.innerHTML = items.map(function (item) {
      return '<button class="sf-filter-chip" type="button" data-sf-action="' + escapeHtml(item.action) + '" data-sf-value="' + escapeHtml(item.value) + '">' + escapeHtml(item.label) + '</button>';
    }).join('');
  }

  function buildShortlistCard(university) {
    var posture = describeAffordability(university.routeAffordability || '');
    var signals = uniqueStrings([]
      .concat(university.shortlistSignals || [])
      .concat(university.readinessState ? [university.readinessState] : [])
      .concat(university.assessmentNeed ? [university.assessmentNeed] : [])
    ).slice(0, 3);
    var feeText = university.feesLabel || (university.fees ? formatMoney(university.fees, '') : 'Fee band still thin');
    var note = university.routeSummary || university.note || 'Saved from the route-aware shortlist. Treat the fee band as indicative until a live school-fees row confirms it.';

    return '<article class="sf-compare-card">' +
      '<div class="sf-compare-top">' +
        '<div><h4 class="sf-compare-title">' + escapeHtml(university.name) + '</h4><div class="sf-card-meta">' + escapeHtml(uniqueStrings([university.country, titleCase(university.studyLevel), titleCase(university.field)]).join(' | ') || 'Saved shortlist school') + '</div></div>' +
        '<span class="sf-fit-pill sf-fit-' + escapeHtml(posture.tone) + '">' + escapeHtml(posture.label) + '</span>' +
      '</div>' +
      '<div class="sf-card-kpi"><strong>' + escapeHtml(feeText) + '</strong><span>' + escapeHtml(university.fitLabel || 'Saved shortlist fee signal') + '</span></div>' +
      '<div class="sf-card-signals">' + signals.map(function (signal) {
        return '<span class="sf-fit-pill">' + escapeHtml(signal) + '</span>';
      }).join('') + '</div>' +
      '<p class="sf-card-note">' + escapeHtml(note) + '</p>' +
      '<div class="sf-card-actions">' +
        '<a class="sf-mini-link" href="/tools/university-ranking/">Open shortlist</a>' +
        '<a class="sf-mini-link primary" href="/tools/student-budget/?school=' + encodeURIComponent(university.name || 'School') + '&source=school-fees">Open Student Budget</a>' +
      '</div>' +
    '</article>';
  }

  function renderShortlistPanel() {
    var context = routeState.context;
    var panel = $('sfShortlistPanel');
    if (!panel) return;

    if (!context.universities.length) {
      panel.classList.remove('is-visible');
      panel.innerHTML = '';
      return;
    }

    panel.classList.add('is-visible');
    panel.innerHTML = '<div class="sf-section-head">' +
      '<div><span class="sf-section-kicker">Shortlist compare</span><h3>Use saved schools as the warm-start finance board</h3><p class="sf-section-copy">These schools came from your route-aware shortlist. Their fee bands are useful for direction, but still indicative until the live fee feed confirms the exact school record.</p></div>' +
    '</div>' +
    '<div class="sf-compare-grid">' + context.universities.slice(0, 3).map(buildShortlistCard).join('') + '</div>' +
    '<p class="sf-trust-note">Trust note: saved shortlist fee bands come from route-aware shortlist logic, not guaranteed live tuition records. The live feed below remains the more reliable confirmation layer when a matching school exists.</p>';
  }

  function renderNextSteps() {
    var context = routeState.context;
    var holder = $('sfNextSteps');
    var note = $('sfCoverageNote');
    if (!holder || !note) return;

    var steps = [
      {
        href: '/tools/student-budget/',
        title: 'Go to Student Budget',
        copy: context.routeAffordability
          ? 'Use the current fee lane and route posture to see whether the month still works after school costs.'
          : 'Turn annual fees into a monthly reserve so you can see whether fees or living costs are the main blocker.'
      },
      {
        href: '/tools/university-ranking/',
        title: 'Return to University Ranking',
        copy: context.universities.length
          ? 'Keep only the schools whose fees still look realistic after this comparison.'
          : 'Build a route-aware shortlist first so School Fees can start with real school context next time.'
      },
      {
        href: '/tools/education-hub/',
        title: 'Open Education Hub',
        copy: 'Keep the cost signal, shortlist logic, and next step in one cockpit.'
      }
    ];

    if (context.coverage.kind === 'indirect') {
      steps[1] = {
        href: '/tools/study-abroad-cost/',
        title: 'Revisit Study Abroad Cost',
        copy: 'Your route destination sits outside this feed, so use destination affordability to decide whether you should keep pushing or look for safer alternatives.'
      };
    }

    holder.innerHTML = steps.map(function (step) {
      return '<div class="sf-side-route"><strong>' + escapeHtml(step.title) + '</strong><p>' + escapeHtml(step.copy) + '</p><div class="sf-side-actions"><a class="sf-mini-link" href="' + escapeHtml(step.href) + '">Open</a></div></div>';
    }).join('');
    note.textContent = context.coverage.body;
  }

  function setRouteFeedback(message, type) {
    var feedback = $('sfRouteFeedback');
    if (!feedback) return;
    feedback.className = 'sf-feedback is-visible ' + (type || '');
    feedback.textContent = message;
  }

  function inferSignalBand(stats, posture) {
    if (!stats) return posture.label;
    if (posture.tone === 'good') return 'Financially safer fee lane';
    if (posture.tone === 'warn') return 'Stretch fee lane';
    if (posture.tone === 'risk') return 'High-pressure fee lane';
    return 'Reference fee lane';
  }

  function saveFinanceSignal() {
    var context = routeState.context;
    var stats = computeRowStats(routeState.visibleRows);
    var posture = describeAffordability(context.routeAffordability);
    if (!window.AfroEdu || typeof window.AfroEdu.saveBudgetSignal !== 'function') {
      setRouteFeedback('Education Hub bridge is not available right now.', 'warning');
      return;
    }

    var commonCurrency = stats ? stats.currency : '';
    var leadCountry = context.coverage.countryLabel || context.routeDestination || (context.countryMix[0] && context.countryMix[0].label) || 'School fees route';
    var recommendation = posture.tone === 'good'
      ? 'Keep the shortlist in the safer fee lane, then validate the month in Student Budget.'
      : posture.tone === 'risk'
        ? 'Fees are already under pressure. Re-check the shortlist or route before treating this plan as viable.'
        : 'Use Student Budget to prove whether these annual costs still survive at the monthly level.';
    var shortlistContext = context.shortlistContext || buildShortlistContext(context);
    var countryMixSummary = context.countryMixSummary || summarizeCountryMix(context.countryMix);
    var note = context.universities.length
      ? context.universities.slice(0, 3).map(function (university) { return university.name; }).join(', ') + ' | Indicative shortlist fee bands until live records confirm them.'
      : 'Community-sourced and moderator-reviewed fee rows remain indicative until you confirm the live school record yourself.';

    window.AfroEdu.saveBudgetSignal({
      id: 'school-fees-' + slugify(leadCountry + '-' + (context.studyLevel || 'comparison'), 'school-fees'),
      destination: leadCountry,
      level: context.studyLevel || 'school-fees',
      field: context.field || 'fee-comparison',
      years: 1,
      annualTotal: stats ? Math.round(stats.median) : null,
      totalCost: stats ? Math.round(stats.median) : null,
      firstYearTotal: stats ? Math.round(stats.min) : null,
      upfrontCost: stats ? Math.round(stats.max) : null,
      comparisonLabel: context.hasContext ? 'Route-aware fee comparison' : 'School fee comparison',
      affordabilityBand: context.routeAffordability || inferSignalBand(stats, posture),
      upfrontBand: context.coverage.kind === 'indirect' ? 'Needs route rethink' : 'Use with monthly budget',
      routeRecommendation: recommendation,
      routeSummary: context.routeSummary || context.coverage.body,
      routeDestination: context.routeDestination || leadCountry,
      routeUpfront: context.routeUpfront || '',
      studyLevel: context.studyLevel || '',
      schoolName: context.universities[0] ? context.universities[0].name : '',
      planningMode: context.universities.length ? 'Shortlist estimate route' : 'Reference fee route',
      feeConfidence: 'Indicative fee comparison',
      feeConfidenceDetail: note,
      feeSourceLabel: 'School Fees Comparator',
      feeLane: context.routeAffordability || posture.label,
      feeLaneSummary: recommendation,
      shortlistContext: shortlistContext,
      countryMixSummary: countryMixSummary,
      currency: commonCurrency,
      href: '/tools/school-fees/app.html',
      note: note,
      source: 'school-fees'
    });

    if (window.AfroEdu && typeof window.AfroEdu.recordActivity === 'function') {
      window.AfroEdu.recordActivity('school-fees', 'Updated fee comparison', {
        detail: (context.routeAffordability || posture.label) + ' | ' + leadCountry + (stats ? ' | Median ' + formatMoney(stats.median, commonCurrency) : '')
      });
    }

    setRouteFeedback('Finance comparison sent to Education Hub.', 'success');
  }

  function refreshConnectedUI() {
    routeState.context = buildConnectedContext();
    renderRouteBanner();
    renderFilterActions();
    renderShortlistPanel();
    renderNextSteps();
  }

  function applyRouteLens() {
    var context = routeState.context;
    if (routeState.autoApplied || !context || !context.coverage.code) return;
    if (!$('mdCountry') || $('mdCountry').value) return;

    $('mdCountry').value = context.coverage.code;
    if ($('mdLevel') && !$('mdLevel').value && educationLevelHint(context.studyLevel)) {
      $('mdLevel').value = educationLevelHint(context.studyLevel);
    }
    routeState.autoApplied = true;
    if ($('mdRefresh')) $('mdRefresh').click();
  }

  function handleAction(action, value) {
    if (action === 'apply-country' && $('mdCountry')) {
      $('mdCountry').value = value || '';
      if ($('mdRefresh')) $('mdRefresh').click();
      renderFilterActions();
      return;
    }
    if (action === 'apply-level' && $('mdLevel')) {
      $('mdLevel').value = value || '';
      if ($('mdRefresh')) $('mdRefresh').click();
      renderFilterActions();
      return;
    }
    if (action === 'clear-filters') {
      ['mdCountry', 'mdCity', 'mdLevel', 'mdType'].forEach(function (id) {
        if ($(id)) $(id).value = '';
      });
      if ($('mdRefresh')) $('mdRefresh').click();
      renderFilterActions();
      return;
    }
    if (action === 'save-signal') {
      saveFinanceSignal();
      return;
    }
    if (action === 'open-student-budget') {
      window.location.href = '/tools/student-budget/';
    }
  }

  function initObservedField() {
    var field = $('mdObservedAt');
    if (!field) return;
    field.value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  function mountApp() {
    initObservedField();
    refreshConnectedUI();

    window.MarketDataApp.mount({
      endpoint: '/api/school-fees',
      responseKey: 'fees',
      subtype: 'school_fee',
      vertical: 'school_fees',
      reportButtonLabel: 'Submit School Fee',
      renderSummary: function (rows) {
        var context = routeState.context || buildConnectedContext();
        var proofBacked = rows.filter(function (row) { return !!row.proof_url; }).length;
        var stats = computeRowStats(rows);
        routeState.visibleRows = rows.slice();
        return '<div class="md-stat"><div class="md-stat-value">' + rows.length + '</div><div class="md-stat-label">Verified fee rows</div></div>' +
          '<div class="md-stat"><div class="md-stat-value">' + proofBacked + '</div><div class="md-stat-label">Proof-backed rows</div></div>' +
          '<div class="md-stat"><div class="md-stat-value">' + escapeHtml(context.hasContext ? describeAffordability(context.routeAffordability).label : 'General mode') + '</div><div class="md-stat-label">Route posture</div></div>' +
          '<div class="md-stat"><div class="md-stat-value">' + escapeHtml(stats ? formatMoney(stats.median, stats.currency) : (context.universities.length ? String(context.universities.length) : 'Cold start')) + '</div><div class="md-stat-label">' + escapeHtml(stats ? 'Visible median annual fee' : (context.universities.length ? 'Saved shortlist schools' : 'Connected context')) + '</div></div>';
      },
      renderCard: function (row, helpers) {
        var extras = Number(row.extras_total || 0);
        var tuition = Number(row.annual_tuition || 0);
        var total = tuition + extras;
        var observed = formatObserved(row.observed_at);
        var matchedUniversity = matchSavedUniversity(row, routeState.context && routeState.context.universities);
        var feeLane = classifyFeeRow(row, total, matchedUniversity);
        var budgetHref = buildStudentBudgetHref(row, total, feeLane, matchedUniversity);
        var meta = [
          '<span class="md-pill">' + helpers.escapeHtml((row.currency_code || '') + ' ' + helpers.formatNumber(total || 0) + ' total') + '</span>',
          '<span class="md-pill">Tuition ' + helpers.escapeHtml(helpers.formatNumber(tuition || 0)) + '</span>',
          '<span class="md-pill">Extras ' + helpers.escapeHtml(helpers.formatNumber(extras || 0)) + '</span>',
          '<span class="md-pill">' + helpers.escapeHtml(sourceLabel(row.source_type)) + '</span>',
          '<span class="sf-live-pill sf-fit-' + helpers.escapeHtml(feeLane.tone) + '">' + helpers.escapeHtml(feeLane.label) + '</span>'
        ];

        if (matchedUniversity) meta.push('<span class="md-pill">Saved shortlist</span>');
        if (row.proof_url) meta.push('<span class="md-pill">Proof linked</span>');
        if (observed) meta.push('<span class="md-pill">Observed ' + helpers.escapeHtml(observed) + '</span>');

        return '<article class="md-card"><h3>' + helpers.escapeHtml(row.institution_name || 'Institution') + '</h3>' +
          '<p>' + helpers.escapeHtml((row.city || '') + ' | ' + (row.education_level || 'Level') + ' | ' + (row.institution_type || 'Type')) + '</p>' +
          '<div class="md-meta">' + meta.join('') + '</div>' +
          '<div class="sf-card-note-inline">' + helpers.escapeHtml(feeLane.note) + '</div>' +
          '<div class="md-card-actions"><a class="md-card-link" href="' + helpers.escapeHtml(budgetHref) + '">Plan this school in Student Budget</a><a class="md-card-link secondary" href="/tools/education-hub/">Open Education Hub</a></div></article>';
      }
    });

    window.setTimeout(applyRouteLens, 60);
  }

  document.addEventListener('click', function (event) {
    var target = event.target.closest('[data-sf-action]');
    if (!target) return;
    event.preventDefault();
    handleAction(target.getAttribute('data-sf-action'), target.getAttribute('data-sf-value') || '');
  });

  window.addEventListener('afroedu:cockpit-updated', function () {
    refreshConnectedUI();
  });

  window.addEventListener('storage', function (event) {
    if (!event.key || [PROFILE_CACHE_KEY, COCKPIT_KEY].indexOf(event.key) !== -1) {
      refreshConnectedUI();
    }
  });

  mountApp();
})(window, document);

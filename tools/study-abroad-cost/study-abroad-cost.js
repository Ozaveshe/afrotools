(function (root, doc) {
  'use strict';

  var STORAGE_KEY = 'afro-study-abroad-scenarios-v2';
  var MAX_COMPARE = 3;
  var MAX_HISTORY = 6;
  var DEFAULT_SAVE_FEEDBACK = 'Nothing saved yet.';

  var FIELD_LABELS = {
    engineering: 'Engineering / STEM',
    business: 'Business / Management',
    health: 'Health / Medicine',
    social: 'Social Sciences / Humanities',
    law: 'Law / Policy'
  };

  var LEVEL_LABELS = {
    bachelors: "Bachelor's",
    masters: "Master's",
    phd: 'PhD'
  };

  var SCHOLARSHIP_MODES = {
    none: {
      key: 'none',
      label: 'No scholarship offset',
      tuitionCoverage: 0,
      note: 'Full sticker-price planning model.'
    },
    partial: {
      key: 'partial',
      label: 'Partial scholarship',
      tuitionCoverage: 0.4,
      note: 'Reference scenario using roughly 40% tuition support. Real awards vary widely.'
    },
    full: {
      key: 'full',
      label: 'Full tuition scholarship',
      tuitionCoverage: 1,
      note: 'Conservative full-award model: tuition covered, but living support is not assumed unless explicitly stated by the award.'
    }
  };

  var DESTINATIONS = {
    uk: {
      key: 'uk',
      name: 'United Kingdom',
      flag: 'UK',
      symbol: 'GBP',
      currencyLabel: 'GBP',
      tagline: "One-year master's options and strong scholarship brands.",
      pathwayNote: "Strong for taught master's routes, branded scholarships, and a familiar admissions pathway for many African students.",
      scholarshipExamples: ['Chevening', 'Commonwealth', 'GREAT Scholarships'],
      livingRange: [13500, 19000],
      livingOfficial: {
        label: 'Official maintenance proof floor',
        note: 'UKCISA guidance for applications from 2 January 2025: GBP 1,136/month outside London or GBP 1,483/month in London for up to 9 months.',
        min: 10224,
        max: 13347,
        source: 'https://www.ukcisa.org.uk/news/increase-to-maintenance-requirements-for-students-from-2025/'
      },
      healthcare: {
        annualEquivalent: 776,
        note: 'Official student Immigration Health Surcharge rate per year. Upfront payment is rounded in 6-month blocks.'
      },
      governmentFees: [
        {
          label: 'Student visa fee',
          amount: 558,
          note: 'Official fee from 8 April 2026.',
          source: 'https://www.gov.uk/government/publications/visa-regulations-revised-table/home-office-immigration-and-nationality-fees-8-april-2026'
        }
      ],
      setupCost: 1500,
      setupNote: 'Reference estimate for flight, arrival deposit, and first-setup costs from an African origin city.',
      salaryUpsideIndex: 4,
      costIndex: 3,
      upfrontIndex: 3,
      tuition: {
        bachelors: {
          engineering: [18000, 34000],
          business: [18000, 32000],
          health: [26000, 48000],
          social: [16000, 29000],
          law: [18000, 32000]
        },
        masters: {
          engineering: [20000, 35000],
          business: [22000, 38000],
          health: [24000, 42000],
          social: [18000, 30000],
          law: [20000, 36000]
        },
        phd: {
          engineering: [18000, 27000],
          business: [17000, 24000],
          health: [20000, 30000],
          social: [16000, 22000],
          law: [17000, 24000]
        }
      }
    },
    canada: {
      key: 'canada',
      name: 'Canada',
      flag: 'CA',
      symbol: 'CAD',
      currencyLabel: 'CAD',
      tagline: 'Clear proof-of-funds rules and a strong public-college network.',
      pathwayNote: 'Good fit for students comparing study with work-permit and migration planning, but proof-of-funds rules are heavier upfront.',
      scholarshipExamples: ['Vanier', 'Mastercard Foundation', 'Institutional merit awards'],
      livingRange: [22895, 30000],
      livingOfficial: {
        label: 'Official first-year living proof floor',
        note: 'Canada study permit guidance for applications from 1 September 2025 outside Quebec.',
        min: 22895,
        max: 22895,
        source: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents/financial-support.html'
      },
      annualInsurance: 1100,
      insuranceNote: 'Reference estimate; health insurance varies by province and institution.',
      governmentFees: [
        {
          label: 'Study permit fee',
          amount: 150,
          note: 'Official study permit application fee.',
          source: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit.html'
        },
        {
          label: 'Biometrics fee',
          amount: 85,
          note: 'Official biometrics fee for an individual applicant.',
          source: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/apply.html'
        }
      ],
      setupCost: 2200,
      setupNote: 'Reference estimate for flights, winter clothing, housing deposit, and arrival setup.',
      salaryUpsideIndex: 4,
      costIndex: 4,
      upfrontIndex: 4,
      tuition: {
        bachelors: {
          engineering: [26000, 46000],
          business: [23000, 43000],
          health: [26000, 52000],
          social: [19000, 34000],
          law: [24000, 42000]
        },
        masters: {
          engineering: [21000, 38000],
          business: [24000, 44000],
          health: [22000, 40000],
          social: [18000, 32000],
          law: [22000, 38000]
        },
        phd: {
          engineering: [9000, 22000],
          business: [11000, 25000],
          health: [12000, 24000],
          social: [8000, 20000],
          law: [10000, 22000]
        }
      }
    },
    australia: {
      key: 'australia',
      name: 'Australia',
      flag: 'AU',
      symbol: 'AUD',
      currencyLabel: 'AUD',
      tagline: 'Clear visa pricing, higher upfront funds, and strong post-study positioning.',
      pathwayNote: 'Often attractive for high-quality English-language study, but one of the highest upfront funding models in this comparison.',
      scholarshipExamples: ['Australia Awards Africa', 'RTP', 'University merit awards'],
      livingRange: [29710, 36000],
      livingOfficial: {
        label: 'Official financial-capacity floor',
        note: 'Study Australia guidance for individual Student visa applicants from 10 May 2024.',
        min: 29710,
        max: 29710,
        source: 'https://www.studyaustralia.gov.au/en_in/tools-and-resources/news/student-and-temporary-graduate-visa-changes--2024'
      },
      annualInsurance: 950,
      insuranceNote: 'Reference estimate for Overseas Student Health Cover; actual premiums vary by provider and dependants.',
      governmentFees: [
        {
          label: 'Student visa application charge',
          amount: 2000,
          note: 'Official primary applicant fee from 1 July 2025.',
          source: 'https://www.studyaustralia.gov.au/en/tools-and-resources/news/student-visa-application-charge-increase'
        }
      ],
      setupCost: 2500,
      setupNote: 'Reference estimate for flights, arrival accommodation, bond, and essentials.',
      salaryUpsideIndex: 4,
      costIndex: 5,
      upfrontIndex: 5,
      tuition: {
        bachelors: {
          engineering: [30000, 50000],
          business: [28000, 48000],
          health: [38000, 65000],
          social: [22000, 36000],
          law: [30000, 50000]
        },
        masters: {
          engineering: [28000, 46000],
          business: [28000, 50000],
          health: [35000, 56000],
          social: [22000, 38000],
          law: [28000, 47000]
        },
        phd: {
          engineering: [18000, 36000],
          business: [18000, 34000],
          health: [22000, 42000],
          social: [16000, 28000],
          law: [18000, 32000]
        }
      }
    },
    usa: {
      key: 'usa',
      name: 'United States',
      flag: 'US',
      symbol: 'USD',
      currencyLabel: 'USD',
      tagline: 'The widest salary upside, but the least predictable sticker price.',
      pathwayNote: 'Best when you can target assistantships, high-value scholarships, or a strong ROI programme. Sticker prices vary sharply.',
      scholarshipExamples: ['Fulbright', 'Graduate assistantships', 'Mastercard Foundation'],
      livingRange: [18000, 28000],
      annualInsurance: 2400,
      insuranceNote: 'Reference estimate; mandatory student insurance can vary materially by university.',
      governmentFees: [
        {
          label: 'Student visa application fee',
          amount: 185,
          note: 'Official nonimmigrant student visa fee.',
          source: 'https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html'
        },
        {
          label: 'SEVIS I-901 fee',
          amount: 350,
          note: 'Official fee for F/M visa applicants.',
          source: 'https://www.ice.gov/sevis/i901'
        }
      ],
      setupCost: 2500,
      setupNote: 'Reference estimate for flights, housing deposit, arrival setup, and essentials.',
      salaryUpsideIndex: 5,
      costIndex: 5,
      upfrontIndex: 5,
      tuition: {
        bachelors: {
          engineering: [28000, 60000],
          business: [26000, 58000],
          health: [32000, 65000],
          social: [22000, 52000],
          law: [28000, 60000]
        },
        masters: {
          engineering: [25000, 52000],
          business: [30000, 65000],
          health: [32000, 60000],
          social: [22000, 48000],
          law: [28000, 60000]
        },
        phd: {
          engineering: [0, 20000],
          business: [8000, 26000],
          health: [12000, 28000],
          social: [0, 18000],
          law: [10000, 22000]
        }
      }
    },
    germany: {
      key: 'germany',
      name: 'Germany',
      flag: 'DE',
      symbol: 'EUR',
      currencyLabel: 'EUR',
      tagline: 'The strongest public-university affordability case in this set.',
      pathwayNote: 'Often the leanest public-route option, but blocked-account proof and city-by-city housing pressure still matter.',
      scholarshipExamples: ['DAAD', 'Deutschlandstipendium', 'University research funding'],
      livingRange: [11904, 14500],
      livingOfficial: {
        label: 'Official proof-of-funds reference',
        note: 'DAAD planning guidance uses EUR 992/month from 1 January 2025 for visa proof of financial resources.',
        min: 11904,
        max: 11904,
        source: 'https://www.daad.de/en/study-and-research-in-germany/plan-your-studies/costs-of-education-and-living/'
      },
      annualInsurance: 1740,
      insuranceNote: 'Reference estimate using about EUR 145/month for student health insurance.',
      governmentFees: [
        {
          label: 'National visa fee',
          amount: 75,
          note: 'Official national visa application fee.',
          source: 'https://www.auswaertiges-amt.de/de/service/visa-und-aufenthalt/visa-207794'
        }
      ],
      setupCost: 1800,
      setupNote: 'Reference estimate for flights, arrival accommodation, registration setup, and essentials.',
      salaryUpsideIndex: 3,
      costIndex: 1,
      upfrontIndex: 2,
      tuition: {
        bachelors: {
          engineering: [0, 3500],
          business: [0, 6000],
          health: [0, 3000],
          social: [0, 3500],
          law: [0, 4000]
        },
        masters: {
          engineering: [0, 4500],
          business: [0, 8000],
          health: [0, 4000],
          social: [0, 4500],
          law: [0, 5000]
        },
        phd: {
          engineering: [0, 1500],
          business: [0, 1500],
          health: [0, 1500],
          social: [0, 1500],
          law: [0, 1500]
        }
      }
    }
  };

  var state = {
    selectedDestinations: ['uk', 'canada'],
    level: 'masters',
    field: 'engineering',
    years: 1,
    scholarshipMode: 'none',
    lastResults: [],
    lastDecision: null,
    profile: null,
    cockpit: null,
    context: null,
    hasUserInput: false,
    contextAutoApplied: false,
    contextSignature: '',
    saveFeedbackMessage: DEFAULT_SAVE_FEEDBACK,
    hasSavedCurrentComparison: false
  };

  function getEl(id) {
    return doc ? doc.getElementById(id) : null;
  }

  function setSaveFeedback(message, isSaved) {
    var feedback = getEl('saveFeedback');
    state.saveFeedbackMessage = message || DEFAULT_SAVE_FEEDBACK;
    state.hasSavedCurrentComparison = !!isSaved;
    if (feedback) {
      feedback.textContent = state.saveFeedbackMessage;
    }
  }

  function safeStorage(action, key, value) {
    try {
      if (!root.localStorage) return null;
      if (action === 'get') return root.localStorage.getItem(key);
      if (action === 'set') return root.localStorage.setItem(key, value);
    } catch (error) {
      return null;
    }
    return null;
  }

  function parseJson(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function midpoint(range) {
    return Math.round((range[0] + range[1]) / 2);
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function titleCase(value) {
    return String(value || '')
      .split(/[\s-]+/)
      .filter(Boolean)
      .map(function (part) {
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(' ');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatMoney(amount, symbol) {
    if (amount === null || amount === undefined || isNaN(amount)) return 'N/A';
    return symbol + ' ' + Math.round(amount).toLocaleString();
  }

  function formatRange(min, max, symbol) {
    if (min === max) return formatMoney(min, symbol);
    return formatMoney(min, symbol) + ' to ' + formatMoney(max, symbol);
  }

  function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  function levelLabel(level) {
    return LEVEL_LABELS[level] || titleCase(level);
  }

  function fieldLabel(field) {
    return FIELD_LABELS[field] || titleCase(field);
  }

  function profileLevelKey(level) {
    if (level === 'bachelors') return 'undergrad';
    return level;
  }

  function normalizeCountryKey(value) {
    var key = String(value || '').toLowerCase().replace(/[^a-z]+/g, '');
    var aliases = {
      uk: 'uk',
      unitedkingdom: 'uk',
      britain: 'uk',
      greatbritain: 'uk',
      england: 'uk',
      canada: 'canada',
      australia: 'australia',
      usa: 'usa',
      us: 'usa',
      unitedstates: 'usa',
      unitedstatesofamerica: 'usa',
      germany: 'germany',
      deutschland: 'germany'
    };
    return aliases[key] || '';
  }

  function uniqueStrings(values) {
    return (values || []).reduce(function (acc, value) {
      var normalized = String(value || '').trim();
      if (!normalized) return acc;
      if (!acc.some(function (item) { return item.toLowerCase() === normalized.toLowerCase(); })) {
        acc.push(normalized);
      }
      return acc;
    }, []);
  }

  function mapProfileLevel(value) {
    var key = String(value || '').toLowerCase().trim();
    if (!key) return '';
    if (key === 'undergrad' || key === 'undergraduate' || key === 'bachelor' || key === 'bachelors') return 'bachelors';
    if (key === 'masters' || key === 'master' || key === 'postgrad' || key === 'postgraduate') return 'masters';
    if (key === 'phd' || key === 'doctorate' || key === 'doctoral') return 'phd';
    return '';
  }

  function mapProfileField(value) {
    var source = Array.isArray(value) ? value.join(' ') : String(value || '');
    var key = source.toLowerCase();
    if (!key) return '';
    if (/(engineer|stem|computer|ict|tech|science|data)/.test(key)) return 'engineering';
    if (/(business|management|finance|account|commerce|mba|economics)/.test(key)) return 'business';
    if (/(health|medicine|medical|nursing|pharmacy|public health)/.test(key)) return 'health';
    if (/(law|policy|legal|governance)/.test(key)) return 'law';
    if (/(social|humanit|education|arts|history|language|media|communication|politic|sociology)/.test(key)) return 'social';
    return '';
  }

  function getPressureScore(result) {
    return Math.max(result.effectiveCostIndex, result.effectiveUpfrontIndex);
  }

  function bandRank(key) {
    if (key === 'affordable') return 0;
    if (key === 'stretch') return 1;
    return 2;
  }

  function getAffordabilityBand(result) {
    var pressure = getPressureScore(result);

    if (pressure <= 2.4) {
      return {
        key: 'affordable',
        label: 'Affordable',
        compact: 'Affordable',
        tone: 'good',
        note: 'Works in this reference model without heroic funding assumptions.'
      };
    }

    if (pressure <= 3.8) {
      return {
        key: 'stretch',
        label: 'Stretch',
        compact: 'Stretch',
        tone: 'ok',
        note: 'Possible, but only if you manage the route carefully or improve the funding mix.'
      };
    }

    return {
      key: 'high-risk',
      label: 'High-risk / expensive',
      compact: 'High-risk',
      tone: 'risk',
      note: 'This route stays funding-sensitive in the current model and should not be treated as easy.'
    };
  }

  function getUpfrontBand(result) {
    var score = result.effectiveUpfrontIndex;
    if (score <= 2.4) {
      return {
        key: 'light',
        label: 'Low upfront burden'
      };
    }
    if (score <= 3.8) {
      return {
        key: 'moderate',
        label: 'Moderate upfront burden'
      };
    }
    return {
      key: 'heavy',
      label: 'Heavy upfront burden'
    };
  }

  function getHistory() {
    return parseJson(safeStorage('get', STORAGE_KEY), []);
  }

  function saveHistoryItem(item) {
    var history = getHistory();
    history = history.filter(function (entry) {
      return entry.key !== item.key;
    });
    history.unshift(item);
    if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
    safeStorage('set', STORAGE_KEY, JSON.stringify(history));
  }

  function buildScenarioKey(payload) {
    return [
      payload.destinations.join('-'),
      payload.level,
      payload.field,
      payload.years,
      payload.scholarshipMode
    ].join('|');
  }

  function loadScenarioIntoState(item) {
    if (!item) return;
    state.selectedDestinations = (item.destinationKeys || item.destinations || []).slice(0, MAX_COMPARE);
    state.level = item.level || 'masters';
    state.field = item.field || 'engineering';
    state.years = clamp(parseInt(item.years, 10) || 1, 1, 6);
    state.scholarshipMode = item.scholarshipMode || 'none';
    state.hasUserInput = true;
    syncInputsFromState();
    renderDestinationCards();
    runComparison();
  }

  function getCockpitSnapshot() {
    if (root.AfroEdu && typeof root.AfroEdu.getCockpitState === 'function') {
      try {
        return root.AfroEdu.getCockpitState() || {
          universities: [],
          destinations: [],
          deadlines: [],
          budgetSignals: []
        };
      } catch (error) {
        return {
          universities: [],
          destinations: [],
          deadlines: [],
          budgetSignals: []
        };
      }
    }

    return {
      universities: [],
      destinations: [],
      deadlines: [],
      budgetSignals: []
    };
  }

  function getCachedProfileSnapshot() {
    if (root.EduProfileSync && typeof root.EduProfileSync.getCachedProfile === 'function') {
      try {
        return root.EduProfileSync.getCachedProfile() || {};
      } catch (error) {
        return {};
      }
    }
    return {};
  }

  function getLatestBudgetSignal(cockpit) {
    return ((cockpit && cockpit.budgetSignals) || []).slice().sort(function (left, right) {
      return (right.updatedAt || right.savedAt || 0) - (left.updatedAt || left.savedAt || 0);
    })[0] || null;
  }

  function buildContextSignature(context) {
    if (!context) return '';
    return [
      (context.destinationKeys || []).join(','),
      context.level || '',
      context.field || '',
      context.years || '',
      context.ielts || '',
      context.savedUniversities || 0
    ].join('|');
  }

  function buildConnectedContext(profile, cockpit) {
    var latestBudget = getLatestBudgetSignal(cockpit);
    var countryNames = uniqueStrings((profile.target_countries || [])
      .concat(((cockpit.destinations || []).map(function (item) { return item.name; })))
      .concat(latestBudget && latestBudget.destination ? [latestBudget.destination] : []));
    var destinationKeys = countryNames.map(normalizeCountryKey).filter(Boolean).slice(0, MAX_COMPARE);
    var level = mapProfileLevel(profile.target_study_level) || mapProfileLevel(latestBudget && latestBudget.level);
    var field = mapProfileField(profile.target_fields || profile.target_field) || mapProfileField(latestBudget && latestBudget.field);
    var years = clamp(parseInt((latestBudget && latestBudget.years) || state.years, 10) || 1, 1, 6);
    var ielts = profile.ielts_overall ? Number(profile.ielts_overall) : null;
    var gpa = profile.gpa_value || null;

    return {
      destinationKeys: destinationKeys,
      countryNames: countryNames,
      level: level,
      field: field,
      years: years,
      ielts: ielts,
      gpa: gpa,
      savedUniversities: ((cockpit && cockpit.universities) || []).length,
      savedDestinations: ((cockpit && cockpit.destinations) || []).length,
      savedBudgetSignals: ((cockpit && cockpit.budgetSignals) || []).length,
      hasSuggestedScenario: destinationKeys.length > 0 || !!level || !!field
    };
  }

  function renderRouteContext() {
    var node = getEl('routeContext');
    var context = state.context;
    var chips = [];
    var title = 'Use this tool standalone, or pull in your cockpit context.';
    var copy = 'Education Hub, IELTS, and saved shortlist signals can prefill this page without auto-saving any new affordability plan until you choose to.';

    if (!node) return;

    if (context) {
      if (context.level) chips.push(levelLabel(context.level));
      if (context.field) chips.push(fieldLabel(context.field));
      if (context.countryNames && context.countryNames.length) chips = chips.concat(context.countryNames.slice(0, 3));
      if (context.ielts) chips.push('IELTS ' + Number(context.ielts).toFixed(1));
      if (context.gpa) chips.push('GPA ' + context.gpa);
      if (context.savedUniversities) chips.push(context.savedUniversities + ' saved ' + (context.savedUniversities === 1 ? 'university' : 'universities'));

      if (context.hasSuggestedScenario) {
        title = state.contextAutoApplied
          ? 'The comparison is already using your Education Hub context.'
          : 'A saved education route is ready to seed this comparison.';
        copy = state.contextAutoApplied
          ? 'This page pulled in the strongest connected route signals it found. You can still adjust everything manually before saving anything back to the cockpit.'
          : 'Use your saved level, field, destinations, and test signals to start from a real student route instead of a blank calculator.';
      } else if (context.savedBudgetSignals || context.savedDestinations) {
        title = 'Connected signals found, but the route still needs shaping.';
        copy = 'You already have some saved education state. Add clearer destination intent or a target field in Education Hub if you want this page to prefill more aggressively.';
      }
    }

    node.innerHTML = '' +
      '<article class="sa-context-card">' +
        '<div>' +
          '<span class="sa-kicker">Connected route context</span>' +
          '<h3>' + escapeHtml(title) + '</h3>' +
          '<p>' + escapeHtml(copy) + '</p>' +
          '<div class="sa-context-chips">' +
            (chips.length
              ? chips.map(function (chip) {
                return '<span class="sa-context-chip">' + escapeHtml(chip) + '</span>';
              }).join('')
              : '<span class="sa-context-chip">No saved destination path yet</span>') +
          '</div>' +
        '</div>' +
        '<div class="sa-context-actions">' +
          (context && context.hasSuggestedScenario
            ? '<button class="sa-button secondary" type="button" data-action="apply-context">Use cockpit context</button>'
            : '') +
          '<a class="sa-link-button secondary" href="/tools/education-hub/">Open Education Hub</a>' +
        '</div>' +
      '</article>';
  }

  function applyConnectedContext(context, options) {
    var signature;
    var shouldRun;

    if (!context || !context.hasSuggestedScenario) return false;

    signature = buildContextSignature(context);
    if (!options || !options.force) {
      if (state.hasUserInput) return false;
      if (state.contextAutoApplied && state.contextSignature === signature) return false;
    }

    if (context.destinationKeys.length) state.selectedDestinations = context.destinationKeys.slice(0, MAX_COMPARE);
    if (context.level) state.level = context.level;
    if (context.field) state.field = context.field;
    if (context.years) state.years = clamp(parseInt(context.years, 10) || state.years, 1, 6);

    state.contextAutoApplied = true;
    state.contextSignature = signature;
    syncInputsFromState();
    renderDestinationCards();
    renderRouteContext();

    shouldRun = !options || options.runComparison !== false;
    if (shouldRun && state.selectedDestinations.length) {
      runComparison();
    }
    return true;
  }

  function syncConnectedContext(options) {
    state.profile = getCachedProfileSnapshot();
    state.cockpit = getCockpitSnapshot();
    state.context = buildConnectedContext(state.profile, state.cockpit);
    renderRouteContext();

    if (options && options.autoApply) {
      applyConnectedContext(state.context, {
        force: false,
        runComparison: true
      });
    }

    if (root.EduProfileSync && typeof root.EduProfileSync.getProfile === 'function') {
      try {
        var request = root.EduProfileSync.getProfile();
        if (request && typeof request.then === 'function') {
          request.then(function (profile) {
            state.profile = Object.assign({}, state.profile || {}, profile || {});
            state.cockpit = getCockpitSnapshot();
            state.context = buildConnectedContext(state.profile, state.cockpit);
            renderRouteContext();
            if (options && options.autoApply) {
              applyConnectedContext(state.context, {
                force: false,
                runComparison: true
              });
            } else if (state.lastResults.length) {
              renderResults(state.lastResults);
            }
          }).catch(function () {
            /* ignore async profile failures here */
          });
        }
      } catch (error) {
        /* ignore */
      }
    }
  }

  function computeUkHealthcare(years) {
    var totalMonths = (years * 12) + 5;
    var sixMonthBlocks = Math.ceil(totalMonths / 6);
    return Math.round(sixMonthBlocks * 0.5 * DESTINATIONS.uk.healthcare.annualEquivalent);
  }

  function getInsuranceTotals(destination, years) {
    if (destination.key === 'uk') {
      var total = computeUkHealthcare(years);
      return {
        annualEquivalent: destination.healthcare.annualEquivalent,
        firstYear: total,
        programTotal: total,
        note: destination.healthcare.note
      };
    }

    var annual = destination.annualInsurance || 0;
    return {
      annualEquivalent: annual,
      firstYear: annual,
      programTotal: annual * years,
      note: destination.insuranceNote || 'Reference annual insurance estimate.'
    };
  }

  function sumGovernmentFees(destination) {
    return destination.governmentFees.reduce(function (total, fee) {
      return total + fee.amount;
    }, 0);
  }

  function computeUpfrontSignal(destination, years, tuitionPerYear, firstYearAfterOffset, insuranceTotals) {
    var governmentFees = sumGovernmentFees(destination);

    if (destination.key === 'uk') {
      return {
        type: 'range',
        min: destination.livingOfficial.min + governmentFees + insuranceTotals.programTotal,
        max: destination.livingOfficial.max + governmentFees + insuranceTotals.programTotal,
        note: 'Official maintenance proof floor plus current visa fee and modeled IHS. Tuition deposits vary by school.'
      };
    }

    if (destination.key === 'canada') {
      return {
        type: 'value',
        value: destination.livingOfficial.min + governmentFees,
        note: 'Official first-year living proof floor outside Quebec plus study permit and biometrics. Tuition deposits vary by institution.'
      };
    }

    if (destination.key === 'australia') {
      return {
        type: 'value',
        value: destination.livingOfficial.min + governmentFees,
        note: 'Official financial-capacity floor plus current visa application charge. Flights and bond sit on top.'
      };
    }

    if (destination.key === 'germany') {
      return {
        type: 'value',
        value: destination.livingOfficial.min + governmentFees + destination.setupCost,
        note: 'Proof-of-funds reference plus visa and a reference arrival-setup estimate. Health insurance can still add pressure.'
      };
    }

    return {
      type: 'value',
      value: firstYearAfterOffset,
      note: 'Reference first-year funding model. U.S. schools often ask you to show first-year tuition and living funds on the I-20.'
    };
  }

  function computeScenario(destinationKey, payload) {
    var destination = DESTINATIONS[destinationKey];
    var scholarshipMode = SCHOLARSHIP_MODES[payload.scholarshipMode] || SCHOLARSHIP_MODES.none;
    var tuitionRange = destination.tuition[payload.level][payload.field];
    var tuitionPerYear = midpoint(tuitionRange);
    var livingPerYear = midpoint(destination.livingRange);
    var insuranceTotals = getInsuranceTotals(destination, payload.years);
    var governmentFees = sumGovernmentFees(destination);
    var firstYearBase = tuitionPerYear + livingPerYear + insuranceTotals.firstYear + governmentFees + destination.setupCost;
    var programBase = (tuitionPerYear * payload.years) + (livingPerYear * payload.years) + insuranceTotals.programTotal + governmentFees + destination.setupCost;
    var tuitionOffsetTotal = Math.round(tuitionPerYear * payload.years * scholarshipMode.tuitionCoverage);
    var firstYearTuitionOffset = Math.round(tuitionPerYear * scholarshipMode.tuitionCoverage);
    var annualRecurringAfterOffset = Math.max(0, (tuitionPerYear - firstYearTuitionOffset) + livingPerYear + insuranceTotals.annualEquivalent);
    var scholarshipOffset = tuitionOffsetTotal;
    var firstYearAfterOffset = Math.max(0, firstYearBase - firstYearTuitionOffset);
    var programAfterOffset = Math.max(0, programBase - tuitionOffsetTotal);
    var upfrontSignal = computeUpfrontSignal(destination, payload.years, tuitionPerYear, firstYearAfterOffset, insuranceTotals);
    var offsetShare = programBase ? scholarshipOffset / programBase : 0;
    var effectiveCostIndex = destination.costIndex - (offsetShare * 2);
    var effectiveUpfrontIndex = destination.upfrontIndex - (offsetShare * 0.4);

    return {
      key: destination.key,
      name: destination.name,
      flag: destination.flag,
      symbol: destination.symbol,
      level: payload.level,
      field: payload.field,
      years: payload.years,
      scholarshipMode: payload.scholarshipMode,
      tuitionPerYear: tuitionPerYear,
      tuitionRange: tuitionRange,
      livingPerYear: livingPerYear,
      livingRange: destination.livingRange,
      insuranceTotals: insuranceTotals,
      governmentFees: governmentFees,
      setupCost: destination.setupCost,
      annualRecurringAfterOffset: annualRecurringAfterOffset,
      firstYearBase: firstYearBase,
      firstYearAfterOffset: firstYearAfterOffset,
      programBase: programBase,
      programAfterOffset: programAfterOffset,
      scholarshipOffset: scholarshipOffset,
      scholarshipOffsetFirstYear: firstYearTuitionOffset,
      scholarshipModeNote: scholarshipMode.note,
      destination: destination,
      upfrontSignal: upfrontSignal,
      offsetShare: offsetShare,
      salaryUpsideIndex: destination.salaryUpsideIndex,
      effectiveCostIndex: effectiveCostIndex,
      effectiveUpfrontIndex: effectiveUpfrontIndex
    };
  }

  function sortResultsByDecision(left, right) {
    return bandRank(left.affordabilityBand.key) - bandRank(right.affordabilityBand.key) ||
      getPressureScore(left) - getPressureScore(right) ||
      left.effectiveCostIndex - right.effectiveCostIndex ||
      left.effectiveUpfrontIndex - right.effectiveUpfrontIndex;
  }

  function buildScenarioVariants(destinationKey, payload) {
    return ['none', 'partial', 'full'].map(function (modeKey) {
      var variant = computeScenario(destinationKey, Object.assign({}, payload, {
        scholarshipMode: modeKey
      }));
      return {
        mode: modeKey,
        label: SCHOLARSHIP_MODES[modeKey].label,
        result: variant,
        band: getAffordabilityBand(variant)
      };
    });
  }

  function buildScenarioGuidance(variants) {
    var none = variants.find(function (item) { return item.mode === 'none'; }) || variants[0];
    var partial = variants.find(function (item) { return item.mode === 'partial'; }) || none;
    var full = variants.find(function (item) { return item.mode === 'full'; }) || partial;
    var best = variants.slice().sort(function (left, right) {
      return bandRank(left.band.key) - bandRank(right.band.key) ||
        getPressureScore(left.result) - getPressureScore(right.result);
    })[0];
    var partialImprovement = bandRank(none.band.key) - bandRank(partial.band.key);
    var fullImprovement = bandRank(none.band.key) - bandRank(full.band.key);
    var unlock = partialImprovement > 0 ? partial : (fullImprovement > 0 ? full : null);
    var message = 'Funding changes the totals, but living and upfront pressure still matter.';

    if (none.band.key === 'affordable') {
      message = 'Already workable without relying on scholarship support in this reference model.';
    } else if (unlock && unlock.mode === 'partial') {
      message = 'Becomes more viable if you land a partial tuition award, so scholarship search is worth the effort.';
    } else if (unlock && unlock.mode === 'full' && best.band.key !== 'high-risk') {
      message = 'Needs a strong tuition award to become realistically workable, even before living support enters the picture.';
    } else if (best.band.key === 'high-risk') {
      message = 'Even strong tuition support does not remove the living and upfront pressure here.';
    }

    return {
      none: none,
      partial: partial,
      full: full,
      best: best,
      unlock: unlock,
      improvement: Math.max(partialImprovement, fullImprovement, 0),
      message: message
    };
  }

  function enrichResults(results, payload) {
    return results.map(function (result) {
      var variants = buildScenarioVariants(result.key, payload);
      return Object.assign({}, result, {
        affordabilityBand: getAffordabilityBand(result),
        upfrontBand: getUpfrontBand(result),
        scenarioView: buildScenarioGuidance(variants),
        scenarioVariants: variants,
        addedYearCost: result.annualRecurringAfterOffset
      });
    });
  }

  function buildPrimaryAction(results, decision) {
    var profile = state.profile || {};
    var cockpit = state.cockpit || {};
    var bestRoute = decision.bestRoute;
    var hasIelts = !!profile.ielts_overall;
    var savedUniversities = ((cockpit.universities || []).length > 0);

    if (!bestRoute) {
      return {
        key: 'education-hub',
        title: 'Shape the route in Education Hub',
        copy: 'Save a clearer profile first so this comparison can become more personal on the next pass.',
        href: '/tools/education-hub/',
        cta: 'Open Education Hub'
      };
    }

    if (bestRoute.affordabilityBand.key === 'high-risk' || (decision.scholarshipUnlock && decision.scholarshipUnlock.improvement > 0)) {
      return {
        key: 'scholarship',
        title: 'Review scholarship leverage next',
        copy: decision.scholarshipUnlock && decision.scholarshipUnlock.improvement > 0
          ? decision.scholarshipUnlock.name + ' only improves materially if funding support lands.'
          : 'The current route is still funding-sensitive, so Scholarship Finder is the next high-value move.',
        href: '/tools/scholarship-finder/',
        cta: 'Review scholarships'
      };
    }

    if ((bestRoute.key === 'uk' || bestRoute.key === 'canada' || bestRoute.key === 'australia' || bestRoute.key === 'usa') && !hasIelts) {
      return {
        key: 'ielts',
        title: 'Check IELTS readiness next',
        copy: bestRoute.name + ' can stay affordable on paper and still fail later if the English-score route is weak.',
        href: '/tools/ielts-calculator/',
        cta: 'Check IELTS path'
      };
    }

    if (!savedUniversities) {
      return {
        key: 'university',
        title: 'Shortlist universities while the route is still realistic',
        copy: 'The next gain is to protect the affordability edge by saving schools that still fit the route you prefer.',
        href: '/tools/university-ranking/',
        cta: 'Shortlist universities'
      };
    }

    return {
      key: 'degree',
      title: 'Validate degree fit before you commit harder',
      copy: 'Cost clarity helps, but Degree Checker is the gate that stops you funding a route your qualification still struggles to enter.',
      href: '/tools/degree-checker/',
      cta: 'Review degree fit'
    };
  }

  function buildDecisionModel(results) {
    var sorted = results.slice().sort(sortResultsByDecision);
    var bestRoute = sorted[0] || null;
    var lowestUpfront = results.slice().sort(function (left, right) {
      return left.effectiveUpfrontIndex - right.effectiveUpfrontIndex;
    })[0] || null;
    var biggestCaution = results.slice().sort(function (left, right) {
      return bandRank(right.affordabilityBand.key) - bandRank(left.affordabilityBand.key) ||
        getPressureScore(right) - getPressureScore(left);
    })[0] || null;
    var scholarshipUnlock = results.slice().sort(function (left, right) {
      return (right.scenarioView.improvement || 0) - (left.scenarioView.improvement || 0) ||
        bandRank(left.scenarioView.best.band.key) - bandRank(right.scenarioView.best.band.key);
    })[0] || null;
    var nextAction = buildPrimaryAction(results, {
      bestRoute: bestRoute,
      scholarshipUnlock: scholarshipUnlock
    });

    return {
      bestRoute: bestRoute,
      lowestUpfront: lowestUpfront,
      biggestCaution: biggestCaution,
      scholarshipUnlock: scholarshipUnlock && scholarshipUnlock.scenarioView.improvement > 0 ? scholarshipUnlock : null,
      nextAction: nextAction
    };
  }

  function computeHighlights(results) {
    var decision;
    if (!results.length) return [];

    decision = buildDecisionModel(results);

    return [
      {
        label: 'Best affordability route',
        winner: decision.bestRoute.name,
        note: decision.bestRoute.affordabilityBand.compact + ' in the current scenario because cost pressure and upfront burden both stay relatively contained.',
        band: decision.bestRoute.affordabilityBand
      },
      {
        label: 'Lowest upfront burden',
        winner: decision.lowestUpfront.name,
        note: decision.lowestUpfront.upfrontBand.label + ' when proof-of-funds, visa charges, and arrival setup are kept in view.',
        band: decision.lowestUpfront.affordabilityBand
      },
      decision.scholarshipUnlock
        ? {
          label: 'Scholarship unlock',
          winner: decision.scholarshipUnlock.name,
          note: 'Moves from ' + decision.scholarshipUnlock.scenarioView.none.band.compact + ' to ' + decision.scholarshipUnlock.scenarioView.unlock.band.compact + ' if ' + decision.scholarshipUnlock.scenarioView.unlock.label.toLowerCase() + ' lands.',
          band: decision.scholarshipUnlock.scenarioView.unlock.band
        }
        : {
          label: 'Funding reality',
          winner: decision.bestRoute.name,
          note: 'No route materially unlocks on partial support alone in this comparison, so cheaper paths still matter.',
          band: decision.bestRoute.affordabilityBand
        },
      {
        label: 'Biggest caution',
        winner: decision.biggestCaution.name,
        note: decision.biggestCaution.affordabilityBand.compact + ' because the route still combines high overall cost pressure with a tougher upfront hurdle.',
        band: decision.biggestCaution.affordabilityBand
      }
    ];
  }

  function buildSummary(results, payload, decision) {
    if (!decision || !decision.bestRoute) return '';

    if (results.length === 1) {
      return decision.bestRoute.name + ' reads here as a ' + decision.bestRoute.affordabilityBand.compact + ' ' + levelLabel(payload.level) + ' ' + fieldLabel(payload.field) + ' route over ' + payload.years + ' year' + (payload.years === 1 ? '' : 's') + '. Use the scenario ladder below to judge whether it is workable now, or only after funding improves.';
    }

    return decision.bestRoute.name + ' currently looks like the cleanest route to investigate, ' + decision.lowestUpfront.name + ' carries the lightest upfront burden, and ' + decision.biggestCaution.name + ' is the most funding-sensitive path in this ' + levelLabel(payload.level) + ' ' + fieldLabel(payload.field) + ' comparison over ' + payload.years + ' year' + (payload.years === 1 ? '' : 's') + '.';
  }

  function syncInputsFromState() {
    var levelNode = getEl('studyLevel');
    var fieldNode = getEl('studyField');
    var yearsNode = getEl('studyYears');
    var scholarshipNode = getEl('scholarshipMode');

    if (levelNode) levelNode.value = state.level;
    if (fieldNode) fieldNode.value = state.field;
    if (yearsNode) yearsNode.value = String(state.years);
    if (scholarshipNode) scholarshipNode.value = state.scholarshipMode;
  }

  function readStateFromInputs() {
    var levelNode = getEl('studyLevel');
    var fieldNode = getEl('studyField');
    var yearsNode = getEl('studyYears');
    var scholarshipNode = getEl('scholarshipMode');

    state.level = levelNode ? levelNode.value : state.level;
    state.field = fieldNode ? fieldNode.value : state.field;
    state.years = clamp(parseInt(yearsNode ? yearsNode.value : state.years, 10) || 1, 1, 6);
    state.scholarshipMode = scholarshipNode ? scholarshipNode.value : state.scholarshipMode;
  }

  function renderDestinationCards() {
    var node = getEl('destinationCards');
    var helper = getEl('selectionStatus');
    if (!node) return;

    node.innerHTML = Object.keys(DESTINATIONS).map(function (key) {
      var destination = DESTINATIONS[key];
      var isSelected = state.selectedDestinations.indexOf(key) !== -1;
      return '' +
        '<button class="sa-destination-card' + (isSelected ? ' is-selected' : '') + '" type="button" data-destination="' + key + '" aria-pressed="' + (isSelected ? 'true' : 'false') + '">' +
          '<div class="sa-destination-top">' +
            '<span class="sa-destination-flag" aria-hidden="true">' + escapeHtml(destination.flag) + '</span>' +
            '<span class="sa-tag">' + escapeHtml(destination.currencyLabel) + '</span>' +
          '</div>' +
          '<h3>' + escapeHtml(destination.name) + '</h3>' +
          '<p>' + escapeHtml(destination.tagline) + '</p>' +
          '<div class="sa-destination-meta">' +
            '<span class="sa-tag gold">' + escapeHtml(destination.scholarshipExamples[0]) + '</span>' +
            '<span class="sa-tag">Top route</span>' +
          '</div>' +
        '</button>';
    }).join('');

    if (helper) {
      helper.textContent = 'Selected ' + state.selectedDestinations.length + ' of ' + MAX_COMPARE + ' destinations. Choose one for a deep cost read or up to three for comparison.';
    }
  }

  function toggleDestination(destinationKey) {
    var index = state.selectedDestinations.indexOf(destinationKey);
    if (index !== -1) {
      state.selectedDestinations.splice(index, 1);
    } else if (state.selectedDestinations.length < MAX_COMPARE) {
      state.selectedDestinations.push(destinationKey);
    } else {
      state.selectedDestinations.shift();
      state.selectedDestinations.push(destinationKey);
    }

    renderDestinationCards();
  }

  function renderDecisionBrief(decision) {
    var node = getEl('decisionBrief');
    var bestRoute = decision ? decision.bestRoute : null;
    var nextAction = decision ? decision.nextAction : null;

    if (!node) return;

    if (!bestRoute || !nextAction) {
      node.innerHTML = '';
      return;
    }

    node.innerHTML = '' +
      '<article class="sa-brief-card">' +
        '<div class="sa-brief-head">' +
          '<div>' +
            '<span class="sa-kicker">Best route to investigate next</span>' +
            '<h3>' + escapeHtml(bestRoute.name) + '</h3>' +
          '</div>' +
          '<span class="sa-band is-' + escapeHtml(bestRoute.affordabilityBand.tone) + '">' + escapeHtml(bestRoute.affordabilityBand.compact) + '</span>' +
        '</div>' +
        '<p>' + escapeHtml(bestRoute.scenarioView.message) + '</p>' +
        '<div class="sa-brief-gridline">' +
          '<div class="sa-brief-stat"><label>Affordability</label><strong>' + escapeHtml(bestRoute.affordabilityBand.label) + '</strong><span>' + escapeHtml(bestRoute.affordabilityBand.note) + '</span></div>' +
          '<div class="sa-brief-stat"><label>Upfront burden</label><strong>' + escapeHtml(bestRoute.upfrontBand.label) + '</strong><span>' + escapeHtml(bestRoute.upfrontSignal.note) + '</span></div>' +
          '<div class="sa-brief-stat"><label>Programme length</label><strong>' + escapeHtml(bestRoute.years + ' year' + (bestRoute.years === 1 ? '' : 's')) + '</strong><span>Each extra year adds about ' + escapeHtml(formatMoney(bestRoute.addedYearCost, bestRoute.symbol)) + ' in this scenario.</span></div>' +
          '<div class="sa-brief-stat"><label>Recommended next move</label><strong>' + escapeHtml(nextAction.title) + '</strong><span>' + escapeHtml(nextAction.copy) + '</span></div>' +
        '</div>' +
      '</article>';
  }

  function buildDecisionCards(highlights) {
    var node = getEl('decisionHighlights');
    if (!node) return;

    node.innerHTML = highlights.map(function (item) {
      return '' +
        '<article class="sa-decision-card">' +
          '<span class="sa-kicker">' + escapeHtml(item.label) + '</span>' +
          '<strong>' + escapeHtml(item.winner) + '</strong>' +
          '<p>' + escapeHtml(item.note) + '</p>' +
          (item.band ? '<span class="sa-band is-' + escapeHtml(item.band.tone) + '">' + escapeHtml(item.band.compact) + '</span>' : '') +
        '</article>';
    }).join('');
  }

  function renderMatrix(results) {
    var node = getEl('compareMatrix');
    if (!node) return;

    function formatUpfront(result) {
      if (result.upfrontSignal.type === 'range') {
        return formatRange(result.upfrontSignal.min, result.upfrontSignal.max, result.symbol);
      }
      return formatMoney(result.upfrontSignal.value, result.symbol);
    }

    function row(label, note, resolver) {
      return '' +
        '<tr>' +
          '<td class="sa-row-label"><strong>' + escapeHtml(label) + '</strong><span>' + escapeHtml(note) + '</span></td>' +
          results.map(function (result) {
            return '<td>' + resolver(result) + '</td>';
          }).join('') +
        '</tr>';
    }

    node.innerHTML = '' +
      '<thead><tr><th>Cost layer</th>' +
      results.map(function (result) { return '<th>' + escapeHtml(result.name) + '</th>'; }).join('') +
      '</tr></thead>' +
      '<tbody>' +
        row('Affordability posture', 'AfroTools decision band using overall route pressure and upfront burden together.', function (result) {
          return '<strong>' + escapeHtml(result.affordabilityBand.label) + '</strong><small>' + escapeHtml(result.affordabilityBand.note) + '</small>';
        }) +
        row('Tuition per year', 'Reference tuition midpoint for the selected level and field.', function (result) {
          return '<strong>' + formatMoney(result.tuitionPerYear, result.symbol) + '</strong><small>Range: ' + formatRange(result.tuitionRange[0], result.tuitionRange[1], result.symbol) + '</small>';
        }) +
        row('Living per year', 'Living estimate, with official proof floors highlighted where available.', function (result) {
          var official = result.destination.livingOfficial ? 'Official floor: ' + formatRange(result.destination.livingOfficial.min, result.destination.livingOfficial.max, result.symbol) : 'Reference estimate';
          return '<strong>' + formatMoney(result.livingPerYear, result.symbol) + '</strong><small>' + escapeHtml(official) + '</small>';
        }) +
        row('Healthcare / insurance', 'IHS or student insurance model used in the scenario.', function (result) {
          return '<strong>' + formatMoney(result.insuranceTotals.programTotal, result.symbol) + '</strong><small>' + escapeHtml(result.insuranceTotals.note) + '</small>';
        }) +
        row('Government fees', 'Visa, permit, biometrics, or SEVIS charges only.', function (result) {
          return '<strong>' + formatMoney(result.governmentFees, result.symbol) + '</strong><small>' + escapeHtml(result.destination.governmentFees.map(function (fee) { return fee.label; }).join(' + ')) + '</small>';
        }) +
        row('Travel / setup', 'Reference arrival setup cost, not an official government fee.', function (result) {
          return '<strong>' + formatMoney(result.setupCost, result.symbol) + '</strong><small>' + escapeHtml(result.destination.setupNote) + '</small>';
        }) +
        row('First-year estimate', 'The amount this model expects you to fund in year one.', function (result) {
          return '<strong>' + formatMoney(result.firstYearAfterOffset, result.symbol) + '</strong><small>Before scholarship: ' + formatMoney(result.firstYearBase, result.symbol) + '</small>';
        }) +
        row('Full-program estimate', 'The main affordability number for the whole route.', function (result) {
          return '<strong>' + formatMoney(result.programAfterOffset, result.symbol) + '</strong><small>Before scholarship: ' + formatMoney(result.programBase, result.symbol) + '</small>';
        }) +
        row('Extra year if the programme runs longer', 'Useful when you are comparing one-year and multi-year routes.', function (result) {
          return '<strong>' + formatMoney(result.addedYearCost, result.symbol) + '</strong><small>Approximate extra recurring cost for each additional year in the selected scholarship mode.</small>';
        }) +
        row('Scholarship effect', 'Only applies the selected scholarship mode to tuition, not living.', function (result) {
          return '<strong>- ' + formatMoney(result.scholarshipOffset, result.symbol) + '</strong><small>' + escapeHtml(result.scholarshipModeNote) + '</small>';
        }) +
        row('Upfront cash signal', 'Funds-to-show or funds-to-mobilize model before departure.', function (result) {
          return '<strong>' + formatUpfront(result) + '</strong><small>' + escapeHtml(result.upfrontSignal.note) + '</small>';
        }) +
      '</tbody>';
  }

  function renderResultCards(results) {
    var node = getEl('resultCards');
    if (!node) return;

    node.innerHTML = results.map(function (result) {
      var layers = [
        {
          label: 'Tuition',
          note: 'Reference midpoint per year for the selected route.',
          value: formatMoney(result.tuitionPerYear, result.symbol) + ' / year'
        },
        {
          label: 'Living',
          note: result.destination.livingOfficial ? result.destination.livingOfficial.note : 'Reference day-to-day living estimate.',
          value: formatMoney(result.livingPerYear, result.symbol) + ' / year'
        },
        {
          label: 'Healthcare / insurance',
          note: result.insuranceTotals.note,
          value: formatMoney(result.insuranceTotals.programTotal, result.symbol)
        },
        {
          label: 'Government fees + setup',
          note: 'Visa or permit fees plus a reference arrival-setup estimate.',
          value: formatMoney(result.governmentFees + result.setupCost, result.symbol)
        }
      ];
      var activeVariant = result.scenarioVariants.find(function (variant) {
        return variant.mode === state.scholarshipMode;
      }) || result.scenarioVariants[0];

      return '' +
        '<article class="sa-result-card">' +
          '<div class="sa-result-head">' +
            '<div>' +
              '<span class="sa-kicker">' + escapeHtml(levelLabel(result.level)) + ' affordability route</span>' +
              '<div class="sa-result-head-main">' +
                '<h3>' + escapeHtml(result.name) + '</h3>' +
                '<div class="sa-result-chips">' +
                  '<span class="sa-band is-' + escapeHtml(result.affordabilityBand.tone) + '">' + escapeHtml(result.affordabilityBand.compact) + '</span>' +
                  '<span class="sa-result-chip">' + escapeHtml(result.destination.currencyLabel) + '</span>' +
                '</div>' +
              '</div>' +
              '<p>' + escapeHtml(result.destination.pathwayNote) + '</p>' +
            '</div>' +
          '</div>' +
          '<div class="sa-result-grid">' +
            '<div class="sa-stat"><label>First year</label><strong>' + formatMoney(result.firstYearAfterOffset, result.symbol) + '</strong></div>' +
            '<div class="sa-stat"><label>Full route</label><strong>' + formatMoney(result.programAfterOffset, result.symbol) + '</strong></div>' +
            '<div class="sa-stat"><label>Tuition offset</label><strong>- ' + formatMoney(result.scholarshipOffset, result.symbol) + '</strong></div>' +
            '<div class="sa-stat"><label>Upfront signal</label><strong>' + (result.upfrontSignal.type === 'range' ? formatRange(result.upfrontSignal.min, result.upfrontSignal.max, result.symbol) : formatMoney(result.upfrontSignal.value, result.symbol)) + '</strong></div>' +
          '</div>' +
          '<div class="sa-scenario-box">' +
            '<div class="sa-scenario-head"><strong>What changes if funding improves?</strong><span>Current mode: ' + escapeHtml(activeVariant.label) + '</span></div>' +
            '<div class="sa-scenario-grid">' +
              result.scenarioVariants.map(function (variant) {
                return '<div class="sa-scenario-card">' +
                  '<label>' + escapeHtml(variant.label) + '</label>' +
                  '<strong>' + escapeHtml(formatMoney(variant.result.programAfterOffset, variant.result.symbol)) + '</strong>' +
                  '<span>' + escapeHtml(variant.band.note) + '</span>' +
                  '<span class="sa-band is-' + escapeHtml(variant.band.tone) + '">' + escapeHtml(variant.band.compact) + '</span>' +
                '</div>';
              }).join('') +
            '</div>' +
          '</div>' +
          '<ul class="sa-layer-list">' +
            layers.map(function (layer) {
              return '<li class="sa-layer-item"><div><strong>' + escapeHtml(layer.label) + '</strong><span>' + escapeHtml(layer.note) + '</span></div><b>' + escapeHtml(layer.value) + '</b></li>';
            }).join('') +
          '</ul>' +
          '<p class="sa-card-note">' + escapeHtml(result.scenarioView.message + ' Each extra year adds about ' + formatMoney(result.addedYearCost, result.symbol) + ' in this model. ' + result.destination.setupNote) + '</p>' +
          '<div class="sa-card-links">' +
            result.destination.scholarshipExamples.map(function (item) { return '<span>' + escapeHtml(item) + '</span>'; }).join('') +
          '</div>' +
        '</article>';
    }).join('');
  }

  function renderNextSteps(results, decision) {
    var node = getEl('nextSteps');
    var primary = decision ? decision.nextAction : null;
    if (!node) return;

    var destinations = results.map(function (result) {
      return result.name;
    }).join(', ');

    var cards = [
      {
        kicker: 'IELTS readiness',
        title: 'Check if the route clears the English-language bar',
        copy: 'Use IELTS Calculator to compare ' + (destinations || 'your preferred destinations') + ' against study, visa, and migration benchmarks before committing to the more expensive path.',
        href: '/tools/ielts-calculator/',
        cta: 'Check IELTS pathway'
      },
      {
        kicker: 'Scholarship leverage',
        title: 'Offset the expensive route before you rule it out',
        copy: decision && decision.scholarshipUnlock
          ? decision.scholarshipUnlock.name + ' only becomes more viable if funding support lands, so Scholarship Finder is a natural next move.'
          : 'Scholarship Finder is the next move when the numbers only work with support. Keep the affordability gap and shortlist logic in one connected workflow.',
        href: '/tools/scholarship-finder/',
        cta: 'Open Scholarship Finder'
      },
      {
        kicker: 'University shortlist',
        title: 'Keep cost next to school choice',
        copy: 'Use University Rankings to save schools that preserve the route you just pressure-tested instead of separating school fit from budget reality.',
        href: '/tools/university-ranking/',
        cta: 'Shortlist universities'
      },
      {
        kicker: 'Degree fit',
        title: 'Check whether your current qualification maps cleanly',
        copy: 'Degree Checker helps you avoid funding a route that still has credential-recognition friction for the destination you prefer.',
        href: '/tools/degree-checker/',
        cta: 'Review degree equivalency'
      }
    ];

    if (primary) {
      cards = cards.map(function (card) {
        return Object.assign({}, card, {
          recommended: card.href === primary.href,
          copy: card.href === primary.href ? primary.copy : card.copy
        });
      }).sort(function (left, right) {
        return (right.recommended ? 1 : 0) - (left.recommended ? 1 : 0);
      });
    }

    node.innerHTML = cards.map(function (card) {
      return '' +
        '<article class="sa-next-card' + (card.recommended ? ' is-recommended' : '') + '">' +
          '<div class="sa-next-top">' +
            '<span class="sa-kicker">' + escapeHtml(card.kicker) + '</span>' +
            (card.recommended ? '<span class="sa-recommended-badge">Recommended now</span>' : '') +
          '</div>' +
          '<h3>' + escapeHtml(card.title) + '</h3>' +
          '<p>' + escapeHtml(card.copy) + '</p>' +
          '<div class="sa-action-row"><a class="sa-link-button secondary" href="' + escapeHtml(card.href) + '">' + escapeHtml(card.cta) + '</a></div>' +
        '</article>';
    }).join('');
  }

  function renderAssumptions(results) {
    var node = getEl('assumptionGrid');
    if (!node) return;

    var selected = results.length ? results : Object.keys(DESTINATIONS).map(function (key) {
      return computeScenario(key, state);
    });

    node.innerHTML = selected.map(function (result) {
      var source = result.destination.governmentFees[0] ? result.destination.governmentFees[0].source : '';
      var bullets = [];

      if (result.destination.livingOfficial) {
        bullets.push(result.destination.livingOfficial.label + ': ' + result.destination.livingOfficial.note);
      } else {
        bullets.push('Living costs are reference estimates here because there is no single national student-living floor in this model.');
      }

      bullets.push('Tuition uses AfroTools reference ranges for the selected level and field; exact programme pricing varies by school.');
      bullets.push('Highlight cards use an AfroTools reference decision model instead of live FX or salary databases.');

      return '' +
        '<article class="sa-assumption-card">' +
          '<span class="sa-kicker">' + escapeHtml(result.name) + '</span>' +
          '<h3>What is official, and what is only a planning estimate</h3>' +
          '<p>Government fees and published living thresholds are anchored to current official or quasi-official sources. Tuition, setup, insurance, and salary-upside framing stay labeled as reference estimates.</p>' +
          '<ul>' + bullets.map(function (bullet) {
            return '<li>' + escapeHtml(bullet) + '</li>';
          }).join('') + '</ul>' +
          (source ? '<a class="sa-source-link" href="' + escapeHtml(source) + '">Open source</a>' : '') +
        '</article>';
    }).join('');
  }

  function renderHistory() {
    var node = getEl('scenarioHistory');
    if (!node) return;

    var history = getHistory();
    if (!history.length) {
      node.innerHTML = '<div class="sa-empty">No saved comparison scenarios yet. Once you run one, the recent scenario stack will appear here so you can revisit it quickly.</div>';
      return;
    }

    node.innerHTML = history.map(function (item) {
      return '' +
        '<article class="sa-history-card">' +
          '<div class="sa-history-top">' +
            '<div>' +
              '<span class="sa-kicker">' + escapeHtml(formatDate(item.savedAt)) + '</span>' +
              '<h3>' + escapeHtml(item.destinations.join(' vs ')) + '</h3>' +
            '</div>' +
            '<span class="sa-tag">' + escapeHtml(levelLabel(item.level)) + '</span>' +
          '</div>' +
          '<p>' + escapeHtml(fieldLabel(item.field)) + ' | ' + item.years + ' year' + (item.years === 1 ? '' : 's') + ' | ' + escapeHtml(SCHOLARSHIP_MODES[item.scholarshipMode].label) + '</p>' +
          '<div class="sa-action-row"><button class="sa-button secondary" type="button" data-load-scenario="' + escapeHtml(item.key) + '">Load scenario</button></div>' +
        '</article>';
    }).join('');
  }

  function persistScenario(results) {
    var historyItem = {
      key: buildScenarioKey({
        destinations: state.selectedDestinations,
        level: state.level,
        field: state.field,
        years: state.years,
        scholarshipMode: state.scholarshipMode
      }),
      destinations: results.map(function (result) { return result.name; }),
      destinationKeys: state.selectedDestinations.slice(),
      level: state.level,
      field: state.field,
      years: state.years,
      scholarshipMode: state.scholarshipMode,
      savedAt: Date.now()
    };

    saveHistoryItem(historyItem);
    renderHistory();
  }

  function renderResults(results) {
    var panel = getEl('resultsPanel');
    var summary = getEl('decisionSummary');

    state.lastDecision = buildDecisionModel(results);
    if (panel) panel.hidden = false;
    if (summary) summary.textContent = buildSummary(results, state, state.lastDecision);
    setSaveFeedback(
      state.hasSavedCurrentComparison ? state.saveFeedbackMessage : DEFAULT_SAVE_FEEDBACK,
      state.hasSavedCurrentComparison
    );

    renderDecisionBrief(state.lastDecision);
    buildDecisionCards(computeHighlights(results));
    renderMatrix(results);
    renderResultCards(results);
    renderNextSteps(results, state.lastDecision);
    renderAssumptions(results);
  }

  function runComparison() {
    readStateFromInputs();
    setSaveFeedback(DEFAULT_SAVE_FEEDBACK, false);

    if (!state.selectedDestinations.length) {
      state.selectedDestinations = ['uk'];
      renderDestinationCards();
    }

    state.lastResults = enrichResults(state.selectedDestinations.map(function (key) {
      return computeScenario(key, state);
    }), state);

    renderResults(state.lastResults);
    persistScenario(state.lastResults);
  }

  function saveToEducationHub() {
    var bestRoute;
    if (!state.lastResults.length) {
      setSaveFeedback('Run a comparison first so there is something real to save.', false);
      return;
    }

    var countryNames = state.lastResults.map(function (result) { return result.name; });
    bestRoute = state.lastDecision && state.lastDecision.bestRoute ? state.lastDecision.bestRoute : state.lastResults[0];

    if (root.EduProfileSync && typeof root.EduProfileSync.update === 'function') {
      root.EduProfileSync.update({
        target_countries: countryNames,
        target_study_level: profileLevelKey(state.level),
        target_fields: [fieldLabel(state.field)]
      });
    }

    if (root.AfroEdu) {
      state.lastResults.forEach(function (result) {
        if (typeof root.AfroEdu.saveDestination === 'function') {
          root.AfroEdu.saveDestination({
            id: result.key,
            name: result.name,
            reason: result.affordabilityBand.compact + ' route saved from destination decision engine',
            studyLevel: profileLevelKey(state.level),
            field: state.field,
            href: '/tools/study-abroad-cost/'
          });
        }

        if (typeof root.AfroEdu.saveBudgetSignal === 'function') {
          root.AfroEdu.saveBudgetSignal({
            id: result.key + '-' + state.level + '-' + state.field + '-' + state.scholarshipMode,
            destination: result.name,
            level: profileLevelKey(state.level),
            field: state.field,
            years: state.years,
            annualTotal: result.annualRecurringAfterOffset,
            totalCost: result.programAfterOffset,
            firstYearTotal: result.firstYearAfterOffset,
            upfrontCost: result.upfrontSignal.type === 'range' ? result.upfrontSignal.max : result.upfrontSignal.value,
            scholarshipOffset: result.scholarshipOffset,
            scholarshipMode: state.scholarshipMode,
            comparisonLabel: 'Destination decision engine',
            affordabilityBand: result.affordabilityBand.label,
            upfrontBand: result.upfrontBand.label,
            routeRecommendation: result.scenarioView.message,
            note: SCHOLARSHIP_MODES[state.scholarshipMode].label + ' | ' + levelLabel(state.level) + ' ' + fieldLabel(state.field),
            currency: result.symbol,
            href: '/tools/study-abroad-cost/'
          });
        }
      });

      if (typeof root.AfroEdu.recordActivity === 'function') {
        root.AfroEdu.recordActivity('study-abroad-cost', 'Saved affordability comparison', {
          detail: countryNames.join(' vs ') + ' | Best route: ' + bestRoute.name + ' (' + bestRoute.affordabilityBand.compact + ')'
        });
      }
    }

    setSaveFeedback('Saved to Education Hub on this device. Your cockpit can now reuse destinations and affordability signals.', true);
  }

  function resetScenario() {
    state.selectedDestinations = ['uk', 'canada'];
    state.level = 'masters';
    state.field = 'engineering';
    state.years = 1;
    state.scholarshipMode = 'none';
    state.lastResults = [];
    state.lastDecision = null;
    state.hasUserInput = false;
    state.contextAutoApplied = false;
    state.contextSignature = '';
    setSaveFeedback(DEFAULT_SAVE_FEEDBACK, false);

    syncInputsFromState();
    renderDestinationCards();
    renderAssumptions([]);
    renderHistory();
    syncConnectedContext({
      autoApply: false
    });

    var panel = getEl('resultsPanel');
    var summary = getEl('decisionSummary');
    if (panel) panel.hidden = true;
    if (summary) summary.textContent = '';
  }

  function bindEvents() {
    if (!doc) return;

    doc.addEventListener('click', function (event) {
      var destinationTarget = event.target.closest ? event.target.closest('[data-destination]') : null;
      var historyTarget = event.target.closest ? event.target.closest('[data-load-scenario]') : null;
      var actionTarget = event.target.closest ? event.target.closest('[data-action]') : null;
      var destinationKey = destinationTarget ? destinationTarget.getAttribute('data-destination') : event.target.getAttribute('data-destination');
      var historyKey = historyTarget ? historyTarget.getAttribute('data-load-scenario') : event.target.getAttribute('data-load-scenario');
      var action = actionTarget ? actionTarget.getAttribute('data-action') : event.target.getAttribute('data-action');

      if (destinationKey) {
        state.hasUserInput = true;
        toggleDestination(destinationKey);
        return;
      }

      if (action === 'apply-context') {
        applyConnectedContext(state.context, {
          force: true,
          runComparison: true
        });
        return;
      }

      if (historyKey) {
        var item = getHistory().find(function (entry) {
          return entry.key === historyKey;
        });
        if (item) {
          state.hasUserInput = true;
          state.selectedDestinations = (item.destinationKeys || []).slice(0, MAX_COMPARE);
          state.level = item.level;
          state.field = item.field;
          state.years = item.years;
          state.scholarshipMode = item.scholarshipMode;
          syncInputsFromState();
          renderDestinationCards();
          runComparison();
        }
      }
    });

    doc.addEventListener('change', function (event) {
      if (event.target && (event.target.id === 'studyLevel' || event.target.id === 'studyField' || event.target.id === 'studyYears' || event.target.id === 'scholarshipMode')) {
        state.hasUserInput = true;
      }
    });

    getEl('runComparisonBtn').addEventListener('click', runComparison);
    getEl('resetScenarioBtn').addEventListener('click', resetScenario);
    getEl('saveHubBtn').addEventListener('click', saveToEducationHub);

    root.addEventListener('afroedu:profile-updated', function () {
      syncConnectedContext({
        autoApply: false
      });
    });
    root.addEventListener('afroedu:cockpit-updated', function () {
      syncConnectedContext({
        autoApply: false
      });
    });
  }

  function init() {
    if (!doc) return;
    syncInputsFromState();
    renderDestinationCards();
    renderNextSteps([]);
    renderAssumptions([]);
    renderHistory();
    bindEvents();
    syncConnectedContext({
      autoApply: true
    });
  }

  root.AfroStudyAbroadModel = {
    DESTINATIONS: DESTINATIONS,
    SCHOLARSHIP_MODES: SCHOLARSHIP_MODES,
    computeScenario: computeScenario,
    computeHighlights: computeHighlights
  };

  if (doc) {
    if (doc.readyState === 'loading') {
      doc.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})(window, document);

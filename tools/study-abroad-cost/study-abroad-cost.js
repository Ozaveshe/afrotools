(function (root, doc) {
  'use strict';

  var STORAGE_KEY = 'afro-study-abroad-scenarios-v2';
  var MAX_COMPARE = 3;
  var MAX_HISTORY = 6;

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
    lastResults: []
  };

  function getEl(id) {
    return doc ? doc.getElementById(id) : null;
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
    state.selectedDestinations = (item.destinations || []).slice(0, MAX_COMPARE);
    state.level = item.level || 'masters';
    state.field = item.field || 'engineering';
    state.years = clamp(parseInt(item.years, 10) || 1, 1, 6);
    state.scholarshipMode = item.scholarshipMode || 'none';
    syncInputsFromState();
    renderDestinationCards();
    runComparison();
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

  function computeHighlights(results) {
    if (!results.length) return [];

    var mostAffordable = results.slice().sort(function (a, b) {
      return a.effectiveCostIndex - b.effectiveCostIndex;
    })[0];

    var lowestUpfront = results.slice().sort(function (a, b) {
      return a.effectiveUpfrontIndex - b.effectiveUpfrontIndex;
    })[0];

    var bestScholarship = results.slice().sort(function (a, b) {
      return b.offsetShare - a.offsetShare;
    })[0];

    var highestUpside = results.slice().sort(function (a, b) {
      return b.salaryUpsideIndex - a.salaryUpsideIndex;
    })[0];

    return [
      {
        label: 'Most affordable',
        winner: mostAffordable.name,
        note: 'Uses the AfroTools reference affordability model so local-currency totals can still be compared sensibly.'
      },
      {
        label: 'Lowest upfront cash burden',
        winner: lowestUpfront.name,
        note: 'Looks at official proof-of-funds rules where they exist, plus visa and setup pressure.'
      },
      {
        label: 'Best scholarship leverage',
        winner: bestScholarship.name,
        note: Math.round(bestScholarship.offsetShare * 100) + '% of the reference programme cost shifts in the selected scholarship mode.'
      },
      {
        label: 'Highest salary upside',
        winner: highestUpside.name,
        note: 'Directional market-upside signal only. This is not a guaranteed earnings forecast.'
      }
    ];
  }

  function buildSummary(results, payload) {
    if (results.length === 1) {
      return results[0].name + ' is modeled here as a ' + levelLabel(payload.level) + ' ' + fieldLabel(payload.field) + ' route lasting ' + payload.years + ' year' + (payload.years === 1 ? '' : 's') + '. Use the detailed cost layers below to decide whether the route is affordable now, or only with scholarship support.';
    }

    return 'This comparison keeps ' + results.length + ' destinations in the same decision frame for a ' + levelLabel(payload.level) + ' ' + fieldLabel(payload.field) + ' route over ' + payload.years + ' year' + (payload.years === 1 ? '' : 's') + '. The highlight chips use an AfroTools reference model, while the cards keep each destination in its local currency.';
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

  function buildDecisionCards(highlights) {
    var node = getEl('decisionHighlights');
    if (!node) return;

    node.innerHTML = highlights.map(function (item) {
      return '' +
        '<article class="sa-decision-card">' +
          '<span class="sa-kicker">' + escapeHtml(item.label) + '</span>' +
          '<strong>' + escapeHtml(item.winner) + '</strong>' +
          '<p>' + escapeHtml(item.note) + '</p>' +
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

      return '' +
        '<article class="sa-result-card">' +
          '<div class="sa-result-head">' +
            '<div>' +
              '<span class="sa-kicker">' + escapeHtml(levelLabel(result.level)) + ' affordability route</span>' +
              '<h3>' + escapeHtml(result.name) + '</h3>' +
              '<p>' + escapeHtml(result.destination.pathwayNote) + '</p>' +
            '</div>' +
            '<span class="sa-result-chip">' + escapeHtml(result.destination.currencyLabel) + '</span>' +
          '</div>' +
          '<div class="sa-result-grid">' +
            '<div class="sa-stat"><label>First year</label><strong>' + formatMoney(result.firstYearAfterOffset, result.symbol) + '</strong></div>' +
            '<div class="sa-stat"><label>Full route</label><strong>' + formatMoney(result.programAfterOffset, result.symbol) + '</strong></div>' +
            '<div class="sa-stat"><label>Tuition offset</label><strong>- ' + formatMoney(result.scholarshipOffset, result.symbol) + '</strong></div>' +
            '<div class="sa-stat"><label>Upfront signal</label><strong>' + (result.upfrontSignal.type === 'range' ? formatRange(result.upfrontSignal.min, result.upfrontSignal.max, result.symbol) : formatMoney(result.upfrontSignal.value, result.symbol)) + '</strong></div>' +
          '</div>' +
          '<ul class="sa-layer-list">' +
            layers.map(function (layer) {
              return '<li class="sa-layer-item"><div><strong>' + escapeHtml(layer.label) + '</strong><span>' + escapeHtml(layer.note) + '</span></div><b>' + escapeHtml(layer.value) + '</b></li>';
            }).join('') +
          '</ul>' +
          '<p class="sa-card-note">' + escapeHtml(result.destination.setupNote) + '</p>' +
          '<div class="sa-card-links">' +
            result.destination.scholarshipExamples.map(function (item) { return '<span>' + escapeHtml(item) + '</span>'; }).join('') +
          '</div>' +
        '</article>';
    }).join('');
  }

  function renderNextSteps(results) {
    var node = getEl('nextSteps');
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
        copy: 'Scholarship Finder is the next move when the numbers only work with support. Keep the affordability gap and shortlist logic in one connected workflow.',
        href: '/tools/scholarship-finder/',
        cta: 'Open Scholarship Finder'
      },
      {
        kicker: 'University shortlist',
        title: 'Keep cost next to school choice',
        copy: 'Use University Rankings to save schools, then compare them against the affordability signals you just created instead of separating school fit from budget reality.',
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

    node.innerHTML = cards.map(function (card) {
      return '' +
        '<article class="sa-next-card">' +
          '<span class="sa-kicker">' + escapeHtml(card.kicker) + '</span>' +
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
    var feedback = getEl('saveFeedback');

    if (panel) panel.hidden = false;
    if (summary) summary.textContent = buildSummary(results, state);
    if (feedback) feedback.textContent = 'Nothing saved yet.';

    buildDecisionCards(computeHighlights(results));
    renderMatrix(results);
    renderResultCards(results);
    renderNextSteps(results);
    renderAssumptions(results);
  }

  function runComparison() {
    readStateFromInputs();

    if (!state.selectedDestinations.length) {
      state.selectedDestinations = ['uk'];
      renderDestinationCards();
    }

    state.lastResults = state.selectedDestinations.map(function (key) {
      return computeScenario(key, state);
    });

    renderResults(state.lastResults);
    persistScenario(state.lastResults);
  }

  function saveToEducationHub() {
    var feedback = getEl('saveFeedback');
    if (!state.lastResults.length) {
      if (feedback) feedback.textContent = 'Run a comparison first so there is something real to save.';
      return;
    }

    var countryNames = state.lastResults.map(function (result) { return result.name; });

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
            reason: 'Affordability comparison saved',
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
            comparisonLabel: 'Affordability engine',
            note: 'Saved from study-abroad cost comparison',
            currency: result.symbol,
            href: '/tools/study-abroad-cost/'
          });
        }
      });

      if (typeof root.AfroEdu.recordActivity === 'function') {
        root.AfroEdu.recordActivity('study-abroad-cost', 'Saved affordability comparison', {
          detail: countryNames.join(' vs ') + ' | ' + levelLabel(state.level) + ' | ' + fieldLabel(state.field)
        });
      }
    }

    if (feedback) {
      feedback.textContent = 'Saved to Education Hub on this device. Your cockpit can now reuse destinations and affordability signals.';
    }
  }

  function resetScenario() {
    state.selectedDestinations = ['uk', 'canada'];
    state.level = 'masters';
    state.field = 'engineering';
    state.years = 1;
    state.scholarshipMode = 'none';
    state.lastResults = [];

    syncInputsFromState();
    renderDestinationCards();
    renderAssumptions([]);
    renderHistory();

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
      var destinationKey = destinationTarget ? destinationTarget.getAttribute('data-destination') : event.target.getAttribute('data-destination');
      var historyKey = historyTarget ? historyTarget.getAttribute('data-load-scenario') : event.target.getAttribute('data-load-scenario');

      if (destinationKey) {
        toggleDestination(destinationKey);
        return;
      }

      if (historyKey) {
        var item = getHistory().find(function (entry) {
          return entry.key === historyKey;
        });
        if (item) {
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

    getEl('runComparisonBtn').addEventListener('click', runComparison);
    getEl('resetScenarioBtn').addEventListener('click', resetScenario);
    getEl('saveHubBtn').addEventListener('click', saveToEducationHub);
  }

  function init() {
    if (!doc) return;
    syncInputsFromState();
    renderDestinationCards();
    renderNextSteps([]);
    renderAssumptions([]);
    renderHistory();
    bindEvents();
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

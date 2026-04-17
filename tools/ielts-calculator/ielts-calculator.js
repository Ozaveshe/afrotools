var IELTSPathwayTool = (function () {
  'use strict';

  var SCORE_VALUES = [];
  for (var i = 0; i <= 9; i += 0.5) SCORE_VALUES.push(i.toFixed(1));

  var STORAGE_KEY = 'afro-ielts-pathway-state';
  var currentMode = 'academic';

  var IELTS_TO_TOEFL = {
    '9.0': '118-120', '8.5': '115-117', '8.0': '110-114', '7.5': '102-109',
    '7.0': '94-101', '6.5': '79-93', '6.0': '60-78', '5.5': '46-59',
    '5.0': '35-45', '4.5': '32-34', '4.0': '0-31'
  };

  var IELTS_TO_PTE = {
    '9.0': '86-90', '8.5': '83-85', '8.0': '79-82', '7.5': '73-78',
    '7.0': '65-72', '6.5': '58-64', '6.0': '50-57', '5.5': '43-49',
    '5.0': '36-42', '4.5': '30-35', '4.0': '0-29'
  };

  var IELTS_TO_DET = {
    '9.0': '145-160', '8.5': '135-144', '8.0': '125-134', '7.5': '115-124',
    '7.0': '105-114', '6.5': '95-104', '6.0': '85-94', '5.5': '75-84',
    '5.0': '65-74', '4.5': '55-64', '4.0': '0-54'
  };

  var LEVEL_DESC = {
    9: 'Expert user — You have full operational command of English.',
    8.5: 'Very good user — Small slips only under pressure.',
    8: 'Very good user — Strong control even in complex communication.',
    7.5: 'Good user — Strong working command with occasional strain.',
    7: 'Good user — A strong planning score for many competitive routes.',
    6.5: 'Competent user — Often enough for mainstream postgrad planning.',
    6: 'Competent user — Common entry point for many degree pathways.',
    5.5: 'Modest user — Often below stronger postgraduate or scholarship routes.',
    5: 'Modest user — Useful as a baseline but usually not enough for selective pathways.',
    4.5: 'Limited user — More preparation is usually needed before application-stage use.',
    4: 'Limited user — Treat this as preparation territory, not application territory yet.'
  };

  var STUDY_TIPS = {
    listening: {
      low: 'Build listening stamina with recorded lectures, note-taking drills, and accent variety. Focus on catching paraphrases, not just keywords.',
      mid: 'At this band, time pressure and missed details matter more than vocabulary. Practice section transitions and answer transfers.',
      high: 'Maintain range by working with faster lecture audio and mixed accents so you can protect a strong score under pressure.'
    },
    reading: {
      low: 'Focus on skimming, scanning, and question discipline. Do not let one passage eat your time.',
      mid: 'Your next gain usually comes from reducing avoidable misses on inference and matching questions, not from reading every line twice.',
      high: 'Protect your score with harder timed sets and close review of why two near-correct options were wrong.'
    },
    writing: {
      low: 'You will usually gain faster with structure, task response, and grammar control than with advanced vocabulary alone.',
      mid: 'Push coherence, paragraph control, and accurate examples. Stronger editing can move this band meaningfully.',
      high: 'To move higher, polish precision, cohesion, and sentence variety rather than writing longer answers.'
    },
    speaking: {
      low: 'Build fluency through daily spoken practice. Prioritize longer natural answers over memorized phrases.',
      mid: 'Your next gain often comes from stronger examples, clearer organisation, and more flexible paraphrasing.',
      high: 'Protect this score by rehearsing complex follow-up questions and making your language sound natural, not over-rehearsed.'
    }
  };

  var RAW_TABLES = {
    listening: [
      { min: 39, band: 9.0 }, { min: 37, band: 8.5 }, { min: 35, band: 8.0 },
      { min: 32, band: 7.5 }, { min: 30, band: 7.0 }, { min: 26, band: 6.5 },
      { min: 23, band: 6.0 }, { min: 18, band: 5.5 }, { min: 16, band: 5.0 },
      { min: 13, band: 4.5 }, { min: 11, band: 4.0 }
    ],
    readingAcademic: [
      { min: 39, band: 9.0 }, { min: 37, band: 8.5 }, { min: 35, band: 8.0 },
      { min: 33, band: 7.5 }, { min: 30, band: 7.0 }, { min: 27, band: 6.5 },
      { min: 23, band: 6.0 }, { min: 19, band: 5.5 }, { min: 15, band: 5.0 },
      { min: 13, band: 4.5 }, { min: 10, band: 4.0 }
    ],
    readingGeneral: [
      { min: 40, band: 9.0 }, { min: 39, band: 8.5 }, { min: 37, band: 8.0 },
      { min: 36, band: 7.5 }, { min: 34, band: 7.0 }, { min: 32, band: 6.5 },
      { min: 30, band: 6.0 }, { min: 27, band: 5.5 }, { min: 23, band: 5.0 },
      { min: 19, band: 4.5 }, { min: 15, band: 4.0 }
    ]
  };

  var PATHWAY_BENCHMARKS = [
    { id: 'uk-undergrad', destination: 'uk', purpose: 'undergrad-admission', label: 'UK undergraduate planning benchmark', audience: 'University', mode: 'academic', overall: 6.0, minEach: 5.5, note: 'Typical planning range seen across many undergraduate admissions. Specific courses can ask for more.' },
    { id: 'uk-postgrad', destination: 'uk', purpose: 'postgrad-admission', label: 'UK postgraduate planning benchmark', audience: 'University', mode: 'academic', overall: 6.5, minEach: 6.0, note: 'A common taught-master’s planning range. Selective departments or top schools may ask for stronger components.' },
    { id: 'canada-undergrad', destination: 'canada', purpose: 'undergrad-admission', label: 'Canada undergraduate planning benchmark', audience: 'University', mode: 'academic', overall: 6.0, minEach: 5.5, note: 'Useful for first-pass admissions planning across many undergraduate and college routes.' },
    { id: 'canada-postgrad', destination: 'canada', purpose: 'postgrad-admission', label: 'Canada postgraduate planning benchmark', audience: 'University', mode: 'academic', overall: 6.5, minEach: 6.0, note: 'A common master’s planning threshold. Many programs still use their own exact score floor.' },
    { id: 'canada-skilled', destination: 'canada', purpose: 'skilled-migration', label: 'Canada skilled migration planning reference', audience: 'Migration', mode: 'general', overall: 6.0, componentMinimums: { listening: 6.0, reading: 6.0, writing: 6.0, speaking: 6.0 }, note: 'Component bands matter more than overall band for CLB-style planning. Verify the current immigration rule before filing.' },
    { id: 'australia-postgrad', destination: 'australia', purpose: 'postgrad-admission', label: 'Australia postgraduate planning benchmark', audience: 'University', mode: 'academic', overall: 6.5, minEach: 6.0, note: 'A common planning range for many postgraduate applications, not a universal rule.' },
    { id: 'australia-skilled', destination: 'australia', purpose: 'skilled-migration', label: 'Australia skilled migration planning reference', audience: 'Migration', mode: 'general', overall: 7.0, componentMinimums: { listening: 7.0, reading: 7.0, writing: 7.0, speaking: 7.0 }, note: 'This is a stronger skilled-migration planning target. Always confirm the current visa and points rules.' },
    { id: 'newzealand-undergrad', destination: 'new-zealand', purpose: 'undergrad-admission', label: 'New Zealand undergraduate planning benchmark', audience: 'University', mode: 'academic', overall: 6.0, minEach: 5.5, note: 'A practical planning floor for many undergraduate routes.' },
    { id: 'newzealand-postgrad', destination: 'new-zealand', purpose: 'postgrad-admission', label: 'New Zealand postgraduate planning benchmark', audience: 'University', mode: 'academic', overall: 6.5, minEach: 6.0, note: 'A common taught-master’s planning benchmark.' },
    { id: 'usa-undergrad', destination: 'usa', purpose: 'undergrad-admission', label: 'US undergraduate planning benchmark', audience: 'University', mode: 'academic', overall: 6.0, minEach: 5.5, note: 'A simplified planning range for institutions that accept IELTS. Universities still set their own score floors.' },
    { id: 'usa-postgrad', destination: 'usa', purpose: 'postgrad-admission', label: 'US postgraduate planning benchmark', audience: 'University', mode: 'academic', overall: 6.5, minEach: 6.0, note: 'A useful planning target for many graduate-school routes that accept IELTS.' },
    { id: 'ireland-postgrad', destination: 'ireland', purpose: 'postgrad-admission', label: 'Ireland postgraduate planning benchmark', audience: 'University', mode: 'academic', overall: 6.5, minEach: 6.0, note: 'A common planning threshold for many postgraduate applications.' },
    { id: 'global-scholarship', destination: 'global', purpose: 'scholarship-competitiveness', label: 'Competitive scholarship planning benchmark', audience: 'Scholarship', mode: 'academic', overall: 7.0, minEach: 6.5, note: 'Many scholarship files become easier to defend when your English score clears a stronger comfort band.' },
    { id: 'global-work', destination: 'global', purpose: 'work-pathway', label: 'Employer-led work pathway benchmark', audience: 'Work', mode: 'general', overall: 6.0, minEach: 5.5, note: 'Useful for work-led planning when you need proof of working English rather than selective admissions.' }
  ];

  function getEl(id) { return document.getElementById(id); }
  function formatComponentName(name) { return name.charAt(0).toUpperCase() + name.slice(1); }
  function roundOverall(value) { return Math.round(value * 2) / 2; }
  function bandOrFallback(value) { return value === null || value === undefined ? 'Below 4.0' : value.toFixed(1); }

  function populateBandSelects() {
    ['listening', 'reading', 'writing', 'speaking'].forEach(function (id) {
      var select = getEl(id);
      SCORE_VALUES.forEach(function (score) {
        var option = document.createElement('option');
        option.value = score;
        option.textContent = score;
        if (score === '6.5') option.selected = true;
        select.appendChild(option);
      });
    });
  }

  function estimateBandFromRaw(raw, table) {
    if (isNaN(raw) || raw < 0 || raw > 40) return null;
    for (var i = 0; i < table.length; i += 1) {
      if (raw >= table[i].min) return table[i].band;
    }
    return null;
  }

  function getComponentScores() {
    return {
      listening: parseFloat(getEl('listening').value),
      reading: parseFloat(getEl('reading').value),
      writing: parseFloat(getEl('writing').value),
      speaking: parseFloat(getEl('speaking').value)
    };
  }

  function getOverallBand(components) {
    return roundOverall((components.listening + components.reading + components.writing + components.speaking) / 4);
  }

  function getRequiredScore(benchmark, component) {
    return benchmark.componentMinimums && benchmark.componentMinimums[component] !== undefined ? benchmark.componentMinimums[component] : benchmark.minEach;
  }

  function mapCountryValue(value) {
    if (!value) return '';
    var normalized = String(value).toLowerCase();
    if (normalized === 'uk' || normalized.indexOf('united kingdom') !== -1 || normalized.indexOf('britain') !== -1) return 'uk';
    if (normalized.indexOf('canada') !== -1) return 'canada';
    if (normalized.indexOf('australia') !== -1) return 'australia';
    if (normalized.indexOf('new zealand') !== -1) return 'new-zealand';
    if (normalized === 'usa' || normalized.indexOf('united states') !== -1 || normalized.indexOf('america') !== -1) return 'usa';
    if (normalized.indexOf('ireland') !== -1) return 'ireland';
    return '';
  }

  function getSelectedBenchmark() {
    var destination = getEl('targetDestination').value;
    var pathway = getEl('targetPathway').value;
    return PATHWAY_BENCHMARKS.find(function (item) {
      return item.destination === destination && item.purpose === pathway;
    }) || PATHWAY_BENCHMARKS.find(function (item) {
      return item.destination === 'global' && item.purpose === pathway;
    }) || PATHWAY_BENCHMARKS[0];
  }

  function analyseBenchmark(components, overall, benchmark) {
    var componentNames = ['listening', 'reading', 'writing', 'speaking'];
    var modeCompatible = benchmark.mode === 'either' || benchmark.mode === currentMode;
    var componentGaps = [];
    var maxGap = 0;

    componentNames.forEach(function (name) {
      var required = getRequiredScore(benchmark, name);
      var gap = Math.max(0, required - components[name]);
      if (gap > 0) {
        componentGaps.push({ component: name, gap: gap, required: required, score: components[name] });
        if (gap > maxGap) maxGap = gap;
      }
    });

    var chosenOverall = parseFloat(getEl('planningTarget').value) || benchmark.overall;
    var overallGap = Math.max(0, chosenOverall - overall);
    if (overallGap > maxGap) maxGap = overallGap;

    var meets = modeCompatible && overall >= chosenOverall && componentGaps.length === 0;
    var status = meets ? 'meets' : (modeCompatible && maxGap <= 0.5 ? 'close' : 'below');

    return {
      benchmark: benchmark,
      modeCompatible: modeCompatible,
      overallTarget: chosenOverall,
      overallGap: overallGap,
      componentGaps: componentGaps,
      maxGap: maxGap,
      meets: meets,
      status: status
    };
  }

  function sortByGap(items) {
    return items.sort(function (a, b) {
      if (a.meets !== b.meets) return a.meets ? -1 : 1;
      if (a.maxGap !== b.maxGap) return a.maxGap - b.maxGap;
      return a.overallTarget - b.overallTarget;
    });
  }

  function saveLocalState(extra) {
    var state = {
      mode: currentMode,
      targetDestination: getEl('targetDestination').value,
      targetPathway: getEl('targetPathway').value,
      planningTarget: getEl('planningTarget').value,
      rawListening: getEl('rawListening').value,
      rawReading: getEl('rawReading').value,
      listening: getEl('listening').value,
      reading: getEl('reading').value,
      writing: getEl('writing').value,
      speaking: getEl('speaking').value
    };
    if (extra) {
      Object.keys(extra).forEach(function (key) { state[key] = extra[key]; });
    }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (error) {}
  }

  function updatePathSummary() {
    var benchmark = getSelectedBenchmark();
    var customTarget = getEl('planningTarget').value;
    var componentText = benchmark.componentMinimums ? 'component floor varies by section' : 'minimum ' + benchmark.minEach.toFixed(1) + ' in each component';
    var targetText = customTarget ? 'Custom overall target: ' + customTarget + ' with ' + componentText + '.' : 'Planning benchmark: ' + benchmark.overall.toFixed(1) + ' overall with ' + componentText + '.';
    getEl('pathSummaryTitle').textContent = benchmark.label + (benchmark.mode === 'general' ? ' (General)' : ' (Academic)');
    getEl('pathSummaryText').textContent = targetText + ' ' + benchmark.note;
    saveLocalState();
  }

  function updateRawEstimatePreview() {
    var rawListening = parseInt(getEl('rawListening').value, 10);
    var rawReading = parseInt(getEl('rawReading').value, 10);
    var listeningEstimate = estimateBandFromRaw(rawListening, RAW_TABLES.listening);
    var readingTable = currentMode === 'academic' ? RAW_TABLES.readingAcademic : RAW_TABLES.readingGeneral;
    var readingEstimate = estimateBandFromRaw(rawReading, readingTable);
    getEl('rawListeningBand').textContent = rawListening >= 0 && rawListening <= 40 ? bandOrFallback(listeningEstimate) : '—';
    getEl('rawReadingBand').textContent = rawReading >= 0 && rawReading <= 40 ? bandOrFallback(readingEstimate) : '—';
    getEl('readingEstimateLabel').textContent = 'Reading estimate (' + (currentMode === 'academic' ? 'Academic' : 'General') + ')';
    saveLocalState();
  }

  function renderComponents(components) {
    getEl('componentScores').innerHTML = ['listening', 'reading', 'writing', 'speaking'].map(function (name) {
      return '<div class=\"ielts-comp\"><div class=\"ielts-comp-val\">' + components[name].toFixed(1) + '</div><div class=\"ielts-comp-name\">' + formatComponentName(name) + '</div></div>';
    }).join('');
  }

  function renderEquivalents(overall) {
    var key = overall.toFixed(1);
    getEl('toeflScore').textContent = IELTS_TO_TOEFL[key] || 'N/A';
    getEl('pteScore').textContent = IELTS_TO_PTE[key] || 'N/A';
    getEl('duolingoScore').textContent = IELTS_TO_DET[key] || 'N/A';
  }

  function renderVerdict(overall, analysis) {
    var statusMap = {
      meets: { label: 'Meets target', className: 'status-meets', summary: 'You already meet this planning benchmark with your current profile.' },
      close: { label: 'Close to target', className: 'status-close', summary: 'You are close. A focused retake or stronger component balance could move you into range.' },
      below: { label: 'Below target', className: 'status-below', summary: 'You are below this planning benchmark right now. Use the gap view to decide whether to retake, change route, or keep building the rest of your profile.' }
    };
    var statusMeta = statusMap[analysis.status];
    var benchmark = analysis.benchmark;
    var gapItems = [];

    getEl('verdictStatus').textContent = statusMeta.label;
    getEl('verdictStatus').className = 'ielts-status-badge ' + statusMeta.className;
    getEl('verdictMeta').textContent = benchmark.audience + ' benchmark · ' + (benchmark.mode === 'general' ? 'IELTS General' : 'IELTS Academic');
    getEl('verdictTitle').textContent = benchmark.label;

    var summary = statusMeta.summary;
    if (!analysis.modeCompatible) {
      summary = 'Your selected target is usually tied to IELTS ' + (benchmark.mode === 'general' ? 'General Training' : 'Academic') + '. You can still compare scores here, but verify that you are using the right test version.';
    } else if (analysis.overallGap > 0) {
      summary += ' Overall gap: ' + analysis.overallGap.toFixed(1) + '.';
    }
    getEl('verdictSummary').textContent = summary + ' ' + benchmark.note;

    if (!analysis.modeCompatible) {
      gapItems.push('<div class=\"ielts-gap-item\"><strong>Test version:</strong> Switch to IELTS ' + (benchmark.mode === 'general' ? 'General Training' : 'Academic') + ' or verify that this route accepts your current mode.</div>');
    }
    if (analysis.overallGap > 0) {
      gapItems.push('<div class=\"ielts-gap-item\"><strong>Overall gap:</strong> You need ' + analysis.overallTarget.toFixed(1) + ' overall and are currently ' + overall.toFixed(1) + '.</div>');
    }
    analysis.componentGaps.forEach(function (item) {
      gapItems.push('<div class=\"ielts-gap-item\"><strong>' + formatComponentName(item.component) + ':</strong> Need ' + item.required.toFixed(1) + ', current ' + item.score.toFixed(1) + '.</div>');
    });
    if (!gapItems.length) gapItems.push('<div class=\"ielts-gap-item\"><strong>Why you are in range:</strong> Your overall band and component floors both clear the selected planning benchmark.</div>');
    getEl('gapList').innerHTML = gapItems.join('');
  }

  function renderRouteCards(containerId, items, emptyText) {
    var container = getEl(containerId);
    if (!container) return;

    if (!items || !items.length) {
      container.innerHTML = '<div class="ielts-route-empty">' + emptyText + '</div>';
      return;
    }

    container.innerHTML = items.map(function (item) {
      var benchmark = item.benchmark;
      var requirementSummary = benchmark.componentMinimums
        ? 'Component floors matter for this route.'
        : 'Minimum ' + benchmark.minEach.toFixed(1) + ' in each section.';
      var statusText = item.meets ? 'In range now' : 'Gap ' + item.maxGap.toFixed(1);

      return [
        '<div class="ielts-route-card">',
          '<div class="ielts-route-top">',
            '<strong>' + benchmark.label + '</strong>',
            '<span>' + statusText + '</span>',
          '</div>',
          '<p>' + benchmark.audience + ' · ' + (benchmark.mode === 'general' ? 'IELTS General' : 'IELTS Academic') + '</p>',
          '<p>Benchmark: ' + benchmark.overall.toFixed(1) + ' overall. ' + requirementSummary + '</p>',
        '</div>'
      ].join('');
    }).join('');
  }

  function renderQualificationPanels(components, overall) {
    var selectedDestination = getEl('targetDestination').value;
    var analyses = PATHWAY_BENCHMARKS.map(function (benchmark) {
      return analyseBenchmark(components, overall, benchmark);
    }).filter(function (analysis) {
      if (!analysis.modeCompatible) return false;
      if (selectedDestination === 'global') return true;
      return analysis.benchmark.destination === selectedDestination || analysis.benchmark.destination === 'global';
    });

    sortByGap(analyses);

    var available = analyses.filter(function (analysis) { return analysis.meets; }).slice(0, 4);
    var close = analyses.filter(function (analysis) { return !analysis.meets; }).slice(0, 4);

    renderRouteCards('availableRoutes', available, 'You are not fully in range for the filtered routes yet. Use the gap analysis to choose the nearest next step.');
    renderRouteCards('closeRoutes', close, 'No close pathways surfaced for this exact filter. Try a different destination, a different test mode, or a lower planning target.');
  }

  function getTipBand(score) {
    if (score <= 5.5) return 'low';
    if (score <= 6.5) return 'mid';
    return 'high';
  }

  function renderStudyTips(components, analysis) {
    var tips = [];
    var pathway = analysis.benchmark.purpose;
    var rankedComponents = ['listening', 'reading', 'writing', 'speaking'].map(function (name) {
      var gapItem = analysis.componentGaps.filter(function (item) { return item.component === name; })[0];
      return {
        component: name,
        gap: gapItem ? gapItem.gap : 0,
        score: components[name]
      };
    }).sort(function (a, b) {
      if (a.gap !== b.gap) return b.gap - a.gap;
      return a.score - b.score;
    });

    if (analysis.meets) {
      tips.push('<div class="ielts-tip-item"><strong>You already clear this planning benchmark.</strong> Use the rest of your application stack well: shortlist destinations, strengthen documents, and confirm the exact policy on the official route page before you submit.</div>');
    } else if (analysis.status === 'close') {
      tips.push('<div class="ielts-tip-item"><strong>You are close enough for a focused retake strategy.</strong> Protect your strongest sections and train the one or two components with the biggest visible gap before booking another test.</div>');
    } else {
      tips.push('<div class="ielts-tip-item"><strong>Your current score is still in preparation territory for this route.</strong> Treat the score gap as a planning signal: either improve the weakest components first or consider a route with a lower English threshold while you keep building.</div>');
    }

    rankedComponents.slice(0, 2).forEach(function (item) {
      var bank = STUDY_TIPS[item.component];
      var level = getTipBand(item.score);
      tips.push('<div class="ielts-tip-item"><strong>' + formatComponentName(item.component) + ':</strong> ' + bank[level] + '</div>');
    });

    if (pathway === 'scholarship-competitiveness') {
      tips.push('<div class="ielts-tip-item"><strong>Funding next step:</strong> A stronger English score can make your scholarship profile easier to defend. Use Scholarship Finder to see which funding routes still make sense while you improve.</div>');
    } else if (pathway === 'undergrad-admission' || pathway === 'postgrad-admission') {
      tips.push('<div class="ielts-tip-item"><strong>Admissions next step:</strong> Pair this score with destination cost planning and degree-fit checks so you do not optimize only for English while missing affordability or credential requirements.</div>');
    } else {
      tips.push('<div class="ielts-tip-item"><strong>Compliance next step:</strong> Migration and work routes often care about the accepted test version and section minimums. Verify the exact current visa or employer rule before you rely on this planning benchmark.</div>');
    }

    tips.push('<div class="ielts-tip-item"><strong>Keep your profile connected:</strong> This result can feed Education Hub so your scholarship and study-abroad planning stay tied to your real English level.</div>');

    getEl('studyTipsContent').innerHTML = tips.join('');
  }

  function getTargetStudyLevel(pathway) {
    if (pathway === 'undergrad-admission') return 'undergraduate';
    if (pathway === 'postgrad-admission' || pathway === 'scholarship-competitiveness') return 'postgraduate';
    return undefined;
  }

  function saveToEducationProfile(overall, components, analysis, options) {
    options = options || {};
    var destination = getEl('targetDestination').value;
    var pathway = getEl('targetPathway').value;
    var payload = {
      ielts_overall: overall,
      ielts_components: components,
      target_countries: destination === 'global' ? [] : [destination]
    };
    var studyLevel = getTargetStudyLevel(pathway);
    if (studyLevel) payload.target_study_level = studyLevel;

    if (typeof EduProfileSync !== 'undefined' && typeof EduProfileSync.update === 'function') {
      EduProfileSync.update(payload);
    }

    if (options.recordActivity !== false && typeof AfroEdu !== 'undefined' && typeof AfroEdu.recordActivity === 'function') {
      AfroEdu.recordActivity('ielts-calculator', 'Updated IELTS pathway plan', {
        detail: overall.toFixed(1) + ' overall - ' + analysis.benchmark.label
      });
    }
  }

  function setMode(mode) {
    currentMode = mode === 'general' ? 'general' : 'academic';
    getEl('modeAcademic').classList.toggle('is-active', currentMode === 'academic');
    getEl('modeGeneral').classList.toggle('is-active', currentMode === 'general');
    updatePathSummary();
    updateRawEstimatePreview();
    if (getEl('resultsPanel') && !getEl('resultsPanel').classList.contains('hidden')) {
      calculate(false, { recordActivity: false });
    }
  }

  function applyRawEstimates() {
    var rawListening = parseInt(getEl('rawListening').value, 10);
    var rawReading = parseInt(getEl('rawReading').value, 10);
    var listeningEstimate = estimateBandFromRaw(rawListening, RAW_TABLES.listening);
    var readingEstimate = estimateBandFromRaw(rawReading, currentMode === 'academic' ? RAW_TABLES.readingAcademic : RAW_TABLES.readingGeneral);

    if (listeningEstimate !== null) getEl('listening').value = listeningEstimate.toFixed(1);
    if (readingEstimate !== null) getEl('reading').value = readingEstimate.toFixed(1);

    if (typeof AfroEdu !== 'undefined' && typeof AfroEdu.recordActivity === 'function' && (listeningEstimate !== null || readingEstimate !== null)) {
      AfroEdu.recordActivity('ielts-calculator', 'Applied IELTS raw-score estimate', {
        detail: 'Listening ' + bandOrFallback(listeningEstimate) + ' - Reading ' + bandOrFallback(readingEstimate)
      });
    }

    calculate();
  }

  function calculate(scrollToResults, options) {
    options = options || {};
    var components = getComponentScores();
    var overall = getOverallBand(components);
    var benchmark = getSelectedBenchmark();
    var analysis = analyseBenchmark(components, overall, benchmark);

    getEl('overallScore').textContent = overall.toFixed(1);
    getEl('levelDesc').textContent = LEVEL_DESC[overall] || 'Use this score as a planning signal, then verify your exact route requirements.';

    renderComponents(components);
    renderEquivalents(overall);
    renderVerdict(overall, analysis);
    renderQualificationPanels(components, overall);
    renderStudyTips(components, analysis);

    getEl('resultsPanel').classList.remove('hidden');
    getEl('qualificationCard').classList.remove('hidden');
    getEl('actionPlanCard').classList.remove('hidden');

    saveLocalState({ lastOverall: overall.toFixed(1) });
    if (options.syncProfile !== false) {
      saveToEducationProfile(overall, components, analysis, {
        recordActivity: options.recordActivity !== false
      });
    }

    if (scrollToResults !== false && typeof getEl('resultsPanel').scrollIntoView === 'function') {
      getEl('resultsPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function resetCalc() {
    ['rawListening', 'rawReading'].forEach(function (id) {
      getEl(id).value = '';
    });
    ['listening', 'reading', 'writing', 'speaking'].forEach(function (id) {
      getEl(id).value = '6.5';
    });
    getEl('targetDestination').value = 'uk';
    getEl('targetPathway').value = 'undergrad-admission';
    getEl('planningTarget').value = '';
    getEl('resultsPanel').classList.add('hidden');
    getEl('qualificationCard').classList.add('hidden');
    getEl('actionPlanCard').classList.add('hidden');
    setMode('academic');
    updatePathSummary();
    updateRawEstimatePreview();
    saveLocalState({ lastOverall: '' });
  }

  function loadLocalState() {
    var raw;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      raw = null;
    }
    if (!raw) return false;

    try {
      var state = JSON.parse(raw);
      ['targetDestination', 'targetPathway', 'planningTarget', 'rawListening', 'rawReading', 'listening', 'reading', 'writing', 'speaking'].forEach(function (key) {
        if (state[key] !== undefined && state[key] !== null && getEl(key)) {
          getEl(key).value = state[key];
        }
      });
      setMode(state.mode || 'academic');
      return true;
    } catch (error) {
      return false;
    }
  }

  function hydrateFromProfile(profile) {
    if (!profile) return;

    var scoreFieldsAreDefault = ['listening', 'reading', 'writing', 'speaking'].every(function (id) {
      return getEl(id).value === '6.5';
    });

    if (scoreFieldsAreDefault && profile.ielts_components) {
      ['listening', 'reading', 'writing', 'speaking'].forEach(function (id) {
        if (profile.ielts_components[id] !== undefined && profile.ielts_components[id] !== null) {
          getEl(id).value = parseFloat(profile.ielts_components[id]).toFixed(1);
        }
      });
    }

    if (getEl('targetDestination').value === 'uk' && profile.target_countries && profile.target_countries.length) {
      var mappedCountry = mapCountryValue(profile.target_countries[0]);
      if (mappedCountry) getEl('targetDestination').value = mappedCountry;
    }

    if (getEl('targetPathway').value === 'undergrad-admission' && profile.target_study_level) {
      if (profile.target_study_level === 'undergraduate') getEl('targetPathway').value = 'undergrad-admission';
      if (profile.target_study_level === 'postgraduate' || profile.target_study_level === 'phd') getEl('targetPathway').value = 'postgrad-admission';
    }

    if (profile.ielts_components || profile.ielts_overall) {
      updatePathSummary();
      updateRawEstimatePreview();
      calculate(false, { syncProfile: false, recordActivity: false });
    }
  }

  function bindEvents() {
    getEl('modeAcademic').addEventListener('click', function () { setMode('academic'); });
    getEl('modeGeneral').addEventListener('click', function () { setMode('general'); });
    getEl('calculateBtn').addEventListener('click', function () { calculate(); });
    getEl('resetBtn').addEventListener('click', resetCalc);
    getEl('applyRawBtn').addEventListener('click', applyRawEstimates);

    ['targetDestination', 'targetPathway', 'planningTarget'].forEach(function (id) {
      getEl(id).addEventListener('change', function () {
        updatePathSummary();
        if (!getEl('resultsPanel').classList.contains('hidden')) calculate(false, { recordActivity: false });
      });
    });

    ['rawListening', 'rawReading'].forEach(function (id) {
      getEl(id).addEventListener('input', updateRawEstimatePreview);
    });

    ['listening', 'reading', 'writing', 'speaking'].forEach(function (id) {
      getEl(id).addEventListener('change', function () {
        saveLocalState();
        if (!getEl('resultsPanel').classList.contains('hidden')) calculate(false, { recordActivity: false });
      });
    });
  }

  function boot() {
    populateBandSelects();
    var hadLocalState = loadLocalState();
    if (!hadLocalState) {
      setMode('academic');
      updatePathSummary();
      updateRawEstimatePreview();
    }
    bindEvents();

    if (typeof AfroEdu !== 'undefined' && typeof AfroEdu.prefillFromProfile === 'function') {
      AfroEdu.prefillFromProfile(function (profile) {
        hydrateFromProfile(profile);
      });
      return;
    }

    if (typeof EduProfileSync !== 'undefined' && typeof EduProfileSync.getProfile === 'function') {
      EduProfileSync.getProfile().then(function (profile) {
        hydrateFromProfile(profile);
      }).catch(function () {});
    }
  }

  boot();

  return {
    boot: boot
  };
})();

(function () {
  'use strict';

  var SOURCE_COUNTRIES = {
    NG: { name: 'Nigeria', regulator: 'NUC / NBTE / direct transcript verification' },
    KE: { name: 'Kenya', regulator: 'CUE / TVETA / KNQA records' },
    GH: { name: 'Ghana', regulator: 'GTEC / direct transcript verification' },
    ZA: { name: 'South Africa', regulator: 'CHE / SAQA / direct transcript verification' },
    TZ: { name: 'Tanzania', regulator: 'TCU / NACTVET records' },
    UG: { name: 'Uganda', regulator: 'National Council for Higher Education' },
    ET: { name: 'Ethiopia', regulator: 'Ministry of Education / university verification' },
    RW: { name: 'Rwanda', regulator: 'Higher Education Council records' },
    EG: { name: 'Egypt', regulator: 'Supreme Council of Universities / direct verification' },
    MA: { name: 'Morocco', regulator: 'Ministry of Higher Education records' },
    SN: { name: 'Senegal', regulator: 'Ministry of Higher Education records' },
    CM: { name: 'Cameroon', regulator: 'Ministry of Higher Education records' },
    ZW: { name: 'Zimbabwe', regulator: 'Zimbabwe Council for Higher Education' },
    ZM: { name: 'Zambia', regulator: 'Higher Education Authority / TEVETA' }
  };

  var DEGREE_LEVELS = {
    bachelor: { label: "Bachelor's degree", profileValue: 'bachelor' },
    hnd: { label: 'HND / higher diploma', profileValue: 'hnd' },
    pgd: { label: 'Postgraduate diploma', profileValue: 'pgd' },
    master: { label: "Master's degree", profileValue: 'master' },
    phd: { label: 'PhD / doctorate', profileValue: 'phd' }
  };

  var CLASSIFICATIONS = {
    first: { label: 'First class / distinction', studyStrength: 3 },
    'second-upper': { label: 'Second class upper / merit', studyStrength: 2 },
    'second-lower': { label: 'Second class lower / credit', studyStrength: 1 },
    third: { label: 'Third class / pass', studyStrength: 0 }
  };

  var PATHWAYS = {
    study: 'study / admissions',
    work: 'work / employment',
    migration: 'migration / relocation'
  };

  var CONTEXTS = {
    general: 'general route',
    regulated: 'regulated profession / licensed role'
  };

  var STATE_META = {
    broad: { label: 'Broadly recognized', tone: 'good', lead: 'Your qualification level is commonly comparable for this destination.', short: 'Broad fit' },
    evaluation: { label: 'Likely recognized with credential evaluation', tone: 'evaluation', lead: 'The route often works, but formal review is part of the real process.', short: 'Needs evaluation' },
    partial: { label: 'Partial / needs review', tone: 'partial', lead: 'Some pathways stay open, but bridging, top-up study, or case-by-case review is common.', short: 'Partial fit' },
    unclear: { label: 'Pathway unclear', tone: 'unclear', lead: 'Do not treat this as confirmed recognition without a destination-specific review.', short: 'Unclear fit' }
  };

  var DESTINATIONS = {
    UK: {
      name: 'United Kingdom',
      languageSummary: 'IELTS Academic or institution-approved English proof is common for study. Work and migration routes can have their own English-proof rules.',
      officialLinks: [
        { label: 'Ecctis qualification methodology', url: 'https://qls.ecctis.com/methodology' },
        { label: 'UK ENIC guidance', url: 'https://www.enic.org.uk/' }
      ],
      assessment: {
        study: 'Universities make the admission decision, but UK ENIC / Ecctis comparison can help explain the qualification level.',
        work: 'Employers or regulators can ask for a Statement of Comparability or profession-specific registration.',
        migration: 'Migration routes may still require English proof and route-specific qualification evidence even when the degree is broadly comparable.'
      },
      regulatedNote: 'Teaching, healthcare, engineering, law, and other regulated professions can require separate registration beyond a general comparison.'
    },
    USA: {
      name: 'United States',
      languageSummary: 'Universities commonly ask for English-test proof for study. Employers and state boards set their own rules for work and licensing.',
      officialLinks: [
        { label: 'U.S. recognition of foreign qualifications', url: 'https://www.ed.gov/about/initiatives/international-affairs/recognition-of-foreign-qualifications' }
      ],
      assessment: {
        study: 'There is no single national equivalency certificate. The university decides, often using a third-party credential evaluation.',
        work: 'Employers or licensing boards can ask for an independent evaluation before they trust the degree level.',
        migration: 'For migration-linked work routes, the final rule depends on the employer, board, or state-level authority.'
      },
      regulatedNote: 'Licensing-heavy paths such as nursing, teaching, engineering, law, and health professions are especially board-specific in the U.S.'
    },
    CA: {
      name: 'Canada',
      languageSummary: 'IELTS, CELPIP, or French tests can matter depending on study, work, or immigration route. Universities and provinces can set their own rules.',
      officialLinks: [
        { label: 'IRCC foreign educational credential assessment', url: 'https://www.canada.ca/en/immigration-refugees-citizenship/corporate/partners-service-providers/foreign-educational-credential-assessment.html' }
      ],
      assessment: {
        study: 'Universities still make the admission decision, but the qualification level often maps cleanly when documents are complete.',
        work: 'Employers may accept the degree level, but regulated jobs can still require a provincial body or profession-specific review.',
        migration: 'For many immigration routes, an ECA from an IRCC-designated organization is the core education proof.'
      },
      regulatedNote: 'Provincial regulators matter for healthcare, engineering, education, accounting, and other licensed roles.'
    },
    AU: {
      name: 'Australia',
      languageSummary: 'IELTS, PTE, TOEFL, or another accepted test can be required. Study and migration routes do not always use the same gate.',
      officialLinks: [
        { label: 'Australian overseas qualification recognition', url: 'https://www.education.gov.au/international-education/recognise-overseas-qualifications' },
        { label: 'Australian skills assessment for migration', url: 'https://immi.homeaffairs.gov.au/visas/working-in-australia/skills-assessment' }
      ],
      assessment: {
        study: 'Universities make admission decisions directly, but they may still ask for clear transcript and grading evidence.',
        work: 'Employers can accept the degree level, but regulated or migration-linked roles often depend on the relevant assessing authority.',
        migration: 'Skilled migration routes commonly depend on an occupation-specific assessing authority and evidence beyond the degree certificate.'
      },
      regulatedNote: 'Migration and licensed work are heavily occupation-specific in Australia, so a general degree comparison is only the first filter.'
    },
    DE: {
      name: 'Germany',
      languageSummary: 'German or English proof depends on the program or employer. Many work routes still need German, especially outside English-taught environments.',
      officialLinks: [
        { label: 'German Foreign Office recognition FAQ', url: 'https://www.auswaertiges-amt.de/en/visa-service/buergerservice/faq/06-anerkennungd-606684' },
        { label: 'ZAB Statement of Comparability FAQ', url: 'https://zab.kmk.org/en/statement-of-comparability/faq' }
      ],
      assessment: {
        study: 'Universities decide admission, often with anabin or direct records review in the background.',
        work: 'anabin and ZAB matter for many work routes, especially when the employer needs official evidence of comparability.',
        migration: 'Credential recognition can be central for visa or work permission routes, and regulated professions use separate recognition channels.'
      },
      regulatedNote: 'Healthcare, teaching, architecture, engineering, and other regulated professions often need a dedicated recognition process.'
    },
    AE: {
      name: 'United Arab Emirates',
      languageSummary: 'English or Arabic requirements vary by university, employer, and regulator. Do not assume one language-proof rule fits all UAE routes.',
      officialLinks: [
        { label: 'MOHESR qualification recognition service', url: 'https://www.mohesr.gov.ae/En/EServices/ServiceCard/pages/universiycertificateequilization.aspx' }
      ],
      assessment: {
        study: 'Universities may accept the degree level directly, but official recognition or attestation can still matter for some transitions.',
        work: 'Government, public-sector, and regulated roles can require MOHESR recognition or additional verification.',
        migration: 'Residency-linked work planning still depends heavily on employer and sector-specific verification.'
      },
      regulatedNote: 'Healthcare, engineering, education, and government-linked roles can require a more formal recognition path in the UAE.'
    },
    NL: {
      name: 'Netherlands',
      languageSummary: 'English or Dutch proof depends on the course, employer, or migration route. Institutional rules are often decisive.',
      officialLinks: [
        { label: 'Dutch government diploma-evaluation guidance', url: 'https://www.government.nl/topics/education-and-internationalisation/evaluating-qualifications-attained-outside-of-the-netherlands' },
        { label: 'IDW credential evaluation', url: 'https://idw.nl/en/' }
      ],
      assessment: {
        study: 'Institutions make admissions decisions, and IDW can provide formal written evaluation when needed.',
        work: 'Employers may accept the degree level, but formal evaluation can still help for credential-sensitive roles.',
        migration: 'If the route depends on official evidence, IDW or the route owner can still ask for formal documentation beyond the diploma itself.'
      },
      regulatedNote: 'Regulated professions still need profession-specific approval, even when a diploma is broadly comparable.'
    }
  };

  var EQUIVALENCIES = {
    bachelor: {
      UK: { equiv: "Bachelor's degree / honours route", framework: 'RQF / FHEQ level 6 comparison', status: 'broad', note: 'A recognized African bachelor degree often maps to a UK bachelor-level route, but the institution or route owner still decides.' },
      USA: { equiv: "Bachelor's degree", framework: 'Institution-led bachelor comparison', status: 'evaluation', note: 'Comparison is usually possible, but the receiving school, employer, or board decides how it is used.' },
      CA: { equiv: "Bachelor's degree", framework: 'Bachelor-level route with ECA or institution review', status: 'broad', note: 'The level is commonly comparable, but immigration and regulated work can still require designated assessment.' },
      AU: { equiv: "Bachelor's degree", framework: 'AQF level 7 style comparison', status: 'broad', note: 'The degree level is commonly comparable, but study and migration routes do not always use the same decision process.' },
      DE: { equiv: "Bachelor's degree / first-cycle qualification", framework: 'University or ZAB/anabin comparison', status: 'evaluation', note: 'Recognition can be strong, but formal comparability evidence is still common for official work routes.' },
      AE: { equiv: "Bachelor's degree", framework: 'Recognition or attestation route may apply', status: 'evaluation', note: 'Employers often understand the level, but formal recognition can still matter for official or regulated use.' },
      NL: { equiv: "Bachelor's degree", framework: 'Dutch HBO / WO review route', status: 'evaluation', note: 'The degree level can compare well, but written evaluation or institutional review may still be needed.' }
    },
    hnd: {
      UK: { equiv: 'Higher diploma / below full bachelor', framework: 'Level 5 route, often bridge-entry', status: 'partial', note: 'This is more often treated as a bridge or top-up route than a direct bachelor replacement.' },
      USA: { equiv: 'Associate / partial undergraduate route', framework: 'Case-by-case transfer-style review', status: 'partial', note: 'The receiving school or evaluator may treat it as sub-bachelor study rather than a full degree.' },
      CA: { equiv: 'Diploma / short-cycle route', framework: 'Often below full bachelor for ECA use', status: 'partial', note: 'It can still help, but it is usually weaker than a clean bachelor route for education-only decisions.' },
      AU: { equiv: 'Diploma / advanced diploma route', framework: 'AQF 5-6 style review', status: 'partial', note: 'This can still support some applied or technical routes, but it is not the safest assumption for bachelor-level equivalency.' },
      DE: { equiv: 'Non-degree or unclear direct match', framework: 'Needs detailed route review', status: 'unclear', note: 'Do not assume direct bachelor recognition without specific institutional or official review.' },
      AE: { equiv: 'Diploma / technical qualification', framework: 'Sector-specific recognition route', status: 'partial', note: 'Technical and employer-led routes can stay open, but official degree-gated roles are harder to assume.' },
      NL: { equiv: 'Short-cycle / associate-type route', framework: 'Below direct WO / HBO bachelor fit', status: 'partial', note: 'Plan around bridge-entry, top-up, or case-by-case review rather than automatic bachelor recognition.' }
    },
    pgd: {
      UK: { equiv: 'Postgraduate diploma', framework: 'Level 7, below full master', status: 'evaluation', note: 'The study level is visible, but it does not replace a full master degree.' },
      USA: { equiv: 'Post-baccalaureate graduate study', framework: 'Graduate diploma / certificate route', status: 'evaluation', note: 'The receiving institution still decides how much weight to give it.' },
      CA: { equiv: 'Post-bachelor diploma', framework: 'Additional graduate study route', status: 'evaluation', note: 'This can strengthen a profile, but it does not automatically behave like a full master degree.' },
      AU: { equiv: 'Graduate diploma / certificate route', framework: 'AQF level 8 style comparison', status: 'evaluation', note: 'Comparable as post-bachelor study, but still not a clean master replacement.' },
      DE: { equiv: 'Additional post-degree study', framework: 'Below clear master equivalency', status: 'partial', note: 'Use caution and expect institutional or official review rather than a clean master outcome.' },
      AE: { equiv: 'Postgraduate diploma', framework: 'Additional graduate study', status: 'evaluation', note: 'Can support profile-building, but employers and universities may still treat it separately from a full master.' },
      NL: { equiv: 'Post-bachelor specialisation route', framework: 'Additional study, not full master equivalency', status: 'evaluation', note: 'The route can be useful, but the destination still decides whether it closes a master-level requirement.' }
    },
    master: {
      UK: { equiv: "Master's degree", framework: 'RQF / FHEQ level 7 comparison', status: 'broad', note: 'A recognized African master degree is commonly comparable at master level for study and many work routes.' },
      USA: { equiv: "Master's degree", framework: 'Graduate-level comparison, institution-led', status: 'evaluation', note: 'The level can compare strongly, but the receiving institution, employer, or board still decides its use.' },
      CA: { equiv: "Master's degree", framework: 'Master-level route with ECA or direct review', status: 'broad', note: 'This is commonly strong for study planning, but immigration or regulated work can still need formal review.' },
      AU: { equiv: "Master's degree", framework: 'AQF level 9 style comparison', status: 'broad', note: 'The qualification level is usually strong, though skilled migration still depends on occupation-specific assessment.' },
      DE: { equiv: "Master's degree", framework: 'Second-cycle qualification with formal review routes', status: 'evaluation', note: 'Recognition can be strong, but official evidence still matters for some employers and formal routes.' },
      AE: { equiv: "Master's degree", framework: 'Recognition / attestation route may still apply', status: 'evaluation', note: 'Employers may understand the level quickly, but official recognition can still matter for certain sectors.' },
      NL: { equiv: "Master's degree", framework: 'WO master-level review route', status: 'evaluation', note: 'The level is often strong, but the final admission or employer decision still belongs to the destination.' }
    },
    phd: {
      UK: { equiv: 'Doctoral degree', framework: 'RQF / FHEQ level 8 comparison', status: 'broad', note: 'A recognized African doctorate is commonly comparable at doctoral level.' },
      USA: { equiv: 'Doctoral degree', framework: 'Doctoral comparison, institution-led', status: 'evaluation', note: 'The level is usually clear, but institutions, employers, and boards still control final recognition.' },
      CA: { equiv: 'Doctoral degree', framework: 'Doctoral route with ECA or direct review', status: 'broad', note: 'The level is usually strong, but regulated or immigration-led routes can still need formal documentation.' },
      AU: { equiv: 'Doctoral degree', framework: 'AQF level 10 style comparison', status: 'broad', note: 'The academic level is usually strong, though work and migration still remain route-specific.' },
      DE: { equiv: 'Doctoral degree', framework: 'Doctoral route with official review options', status: 'evaluation', note: 'The degree level is strong, but formal route ownership still matters when proof is requested.' },
      AE: { equiv: 'Doctoral degree', framework: 'Recognition / attestation route may still apply', status: 'evaluation', note: 'The degree level is usually strong, but official recognition may still be requested for some sectors.' },
      NL: { equiv: 'Doctoral degree', framework: 'Doctoral-level review route', status: 'evaluation', note: 'The level is usually strong, but official written evaluation can still help in formal contexts.' }
    }
  };

  var GRADE_EQUIV = {
    first: { UK: 'First / strong honours', USA: 'Roughly high GPA / strong standing', CA: 'A range / strong standing', AU: 'High distinction range', DE: 'Stronger grade band', AE: 'Excellent standing', NL: 'Strong standing / upper range' },
    'second-upper': { UK: '2:1 style standing', USA: 'Good GPA range', CA: 'B+ to A- range', AU: 'Distinction range', DE: 'Good grade band', AE: 'Very good standing', NL: 'Solid upper range' },
    'second-lower': { UK: '2:2 style standing', USA: 'Mid GPA range', CA: 'B range', AU: 'Credit range', DE: 'Mid grade band', AE: 'Good standing', NL: 'Workable range' },
    third: { UK: 'Third / pass route', USA: 'Lower passing range', CA: 'Lower passing range', AU: 'Pass range', DE: 'Lower pass band', AE: 'Pass route', NL: 'Lower pass route' }
  };

  var REGION_MAP = {
    ECOWAS: ['NG', 'GH', 'SN'],
    EAC: ['KE', 'TZ', 'UG', 'RW'],
    SADC: ['ZA', 'ZW', 'ZM']
  };

  var appState = { lastResult: null };
  var elements = {};

  function getEl(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function uniqueStrings(list) {
    return (list || []).filter(function (value, index, array) {
      return value && array.indexOf(value) === index;
    });
  }

  function slugify(value) {
    return String(value || 'route').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'route';
  }

  function isHigherDegree(level) {
    return level === 'master' || level === 'phd';
  }

  function buildResultSummary(selection, equivalency, destination, statusMeta) {
    var degree = DEGREE_LEVELS[selection.degreeLevel];
    var grade = CLASSIFICATIONS[selection.classification];
    var source = SOURCE_COUNTRIES[selection.sourceCountry];
    var context = selection.routeContext === 'regulated' ? ' in a regulated-profession context' : '';

    return 'Assuming a recognized ' + source.name + ' institution and complete documents, your ' + degree.label.toLowerCase() + ' with ' + grade.label.toLowerCase() + ' is currently best treated as ' + statusMeta.label.toLowerCase() + ' for ' + destination.name + context + '. The comparison level is ' + equivalency.equiv.toLowerCase() + ', but the destination route owner still makes the final call.';
  }

  function getStudyReadiness(selection, equivalency, destination) {
    var gradeStrength = CLASSIFICATIONS[selection.classification].studyStrength;
    var isPartial = equivalency.status === 'partial' || equivalency.status === 'unclear';

    if (selection.degreeLevel === 'hnd') {
      return {
        status: isPartial ? 'Bridge route' : 'Conditional route',
        body: 'For study planning, treat this more like a top-up, bridge, or flexible-admission route than a guaranteed direct bachelor-level fit. Look closely at institutions that publish transfer, top-up, or diploma-to-degree progression rules.'
      };
    }

    if (selection.degreeLevel === 'pgd') {
      return {
        status: equivalency.status === 'partial' ? 'Conditional route' : 'Post-bachelor route',
        body: 'This can strengthen postgraduate readiness, but it should not be treated as a full master replacement. Expect universities to decide how much weight it carries for the exact program you want.'
      };
    }

    if (isPartial) {
      return {
        status: 'Needs school-level review',
        body: 'Do not plan around automatic admission. Use institution-by-institution review and be ready for bridge, pre-master, or additional document requests.'
      };
    }

    if (gradeStrength >= 2 || isHigherDegree(selection.degreeLevel)) {
      return {
        status: 'Good planning base',
        body: destination.name + ' looks like a viable next planning layer for admissions, provided your exact course, transcripts, and language proof also fit.'
      };
    }

    if (gradeStrength === 1) {
      return {
        status: 'Viable but selective',
        body: 'The route can still work, but more selective schools may ask for stronger evidence, additional experience, or a more flexible admissions path.'
      };
    }

    return {
      status: 'Use caution',
      body: 'This result can still support study planning, but lower classifications often push you toward flexible schools, bridge-entry, or extra evidence before admission becomes realistic.'
    };
  }

  function getWorkMigrationReadiness(selection, equivalency) {
    var regulated = selection.routeContext === 'regulated';
    var prefix = selection.pathwayGoal === 'migration' ? 'For migration-linked planning' : 'For work planning';

    if (equivalency.status === 'broad') {
      return {
        status: regulated ? 'Level may fit, licensing still pending' : 'Reasonable base',
        body: prefix + ', the degree level itself is not the only gate. Employers, regulators, and immigration owners can still ask for formal assessment, direct verification, experience, or language evidence.'
      };
    }

    if (equivalency.status === 'evaluation') {
      return {
        status: 'Plan for formal review',
        body: prefix + ', do not assume the destination will trust the degree label alone. A credential evaluation or route-specific review is likely part of the real path.'
      };
    }

    if (equivalency.status === 'partial') {
      return {
        status: regulated ? 'High caution' : 'Selective fit',
        body: prefix + ', this route may still work in some employer-led or technical cases, but it is not the safest assumption for roles that explicitly gate on degree level.'
      };
    }

    return {
      status: 'Do not assume direct fit',
      body: prefix + ', treat this as exploratory until a destination-specific authority, employer, or regulator confirms the exact pathway.'
    };
  }

  function getAssessmentNeed(selection, destination, status) {
    var label = 'Route-specific';

    if (selection.pathwayGoal === 'migration' && (destination.name === 'Canada' || destination.name === 'Australia')) {
      label = 'Usually required';
    } else if (destination.name === 'United States') {
      label = 'Institution or board-led';
    } else if (status === 'broad' && selection.pathwayGoal === 'study') {
      label = 'Often helpful';
    } else if (status === 'evaluation') {
      label = 'Likely required';
    } else if (status === 'partial' || status === 'unclear') {
      label = 'Strongly recommended';
    }

    if (selection.routeContext === 'regulated' && label !== 'Usually required') {
      label = 'Very likely required';
    }

    return {
      label: label,
      body: destination.assessment[selection.pathwayGoal] || destination.assessment.study
    };
  }

  function getAdditionalRequirements(selection, destination, status) {
    var list = [
      destination.languageSummary,
      'Official transcripts, degree certificate, and direct institutional verification are still central for serious applications.',
      'The awarding institution must be recognized in ' + SOURCE_COUNTRIES[selection.sourceCountry].name + ' for the comparison to hold real weight.'
    ];

    if (selection.degreeLevel === 'hnd') {
      list.push('Bridge, top-up, or transfer-entry planning is more realistic than assuming a clean direct-degree replacement.');
    }

    if (selection.degreeLevel === 'pgd') {
      list.push('You may still need to prove full master-level readiness separately, because postgraduate diplomas do not automatically replace a full master degree.');
    }

    if (CLASSIFICATIONS[selection.classification].studyStrength === 0 && selection.pathwayGoal === 'study') {
      list.push('Lower classifications often need a more flexible admissions strategy, stronger supporting evidence, or a step-down route.');
    }

    if (selection.routeContext === 'regulated') {
      list.push(destination.regulatedNote);
    }

    if (status === 'partial' || status === 'unclear') {
      list.push('Treat the route as conditional until a real destination owner confirms the exact recognition path.');
    }

    return uniqueStrings(list);
  }

  function getDocumentChecklist(selection) {
    var items = [
      'Degree certificate or final award letter',
      'Official transcripts or statement of results',
      'Passport or national identity record',
      'Certified translation if documents are not in the route language',
      'University registrar contact or source-verification path'
    ];

    if (selection.routeContext === 'regulated' || selection.degreeLevel === 'hnd' || selection.degreeLevel === 'pgd') {
      items.push('Module list, syllabus, or course breakdown if the destination asks for a deeper academic review');
    }

    if (selection.pathwayGoal !== 'work') {
      items.push('Language-test evidence or a plan to produce it for the destination route');
    }

    if (selection.pathwayGoal !== 'study') {
      items.push('CV, work history, or professional-registration evidence if the route is employment or migration-led');
    }

    return uniqueStrings(items);
  }

  function getRegionalNote(sourceCountry) {
    if (REGION_MAP.ECOWAS.indexOf(sourceCountry) !== -1) {
      return 'West African mobility agreements can help inside the region, but a destination outside ECOWAS will still judge the degree through its own admissions, immigration, or regulatory process.';
    }
    if (REGION_MAP.EAC.indexOf(sourceCountry) !== -1) {
      return 'East African recognition cooperation can support regional mobility, but a destination outside East Africa will still care most about destination-owned assessment and direct transcript verification.';
    }
    if (REGION_MAP.SADC.indexOf(sourceCountry) !== -1) {
      return 'Southern African regional familiarity can help with context, but formal recognition outside the region still belongs to the destination school, employer, or regulator.';
    }
    return 'Country name alone never guarantees recognition. The strongest practical signal is still a recognized home institution plus complete, directly verifiable documents.';
  }

  function buildToolCards(selection, status) {
    var primaryId = 'ielts';
    if (selection.pathwayGoal === 'study' && (status === 'partial' || status === 'unclear')) primaryId = 'ranking';
    if (selection.pathwayGoal !== 'study' && (status === 'partial' || status === 'unclear')) primaryId = 'hub';

    return [
      { id: 'ielts', title: 'IELTS Calculator', href: '/tools/ielts-calculator/', copy: 'Check the English-proof side of the route so degree comparability is not the only signal in your plan.' },
      { id: 'cost', title: 'Study Abroad Cost', href: '/tools/study-abroad-cost/', copy: 'Pressure-test whether the destination still works after tuition, living costs, visa fees, and scholarship scenarios.' },
      { id: 'ranking', title: 'University Ranking', href: '/tools/university-ranking/', copy: 'Shortlist institutions and routes that look realistic for your qualification level, flexibility, and destination.' },
      { id: 'scholarship', title: 'Scholarship Finder', href: '/tools/scholarship-finder/', copy: 'Use your destination plan to check whether funding can actually make the route viable.' },
      { id: 'hub', title: 'Education Hub', href: '/tools/education-hub/', copy: 'Save the route, keep your destination stack connected, and return later when you have IELTS, budget, or shortlist updates.' }
    ].map(function (tool) {
      var tag = tool.id === primaryId ? 'Recommended first move' : 'Next tool';
      if (tool.id === 'ranking' && tool.id === primaryId) tag = 'Recommended for flexible entry';
      if (tool.id === 'hub' && tool.id === primaryId) tag = 'Recommended fallback route';
      return Object.assign({}, tool, { primary: tool.id === primaryId, tag: tag });
    });
  }

  function calculate(selection) {
    var equivalency = EQUIVALENCIES[selection.degreeLevel][selection.targetCountry];
    var destination = DESTINATIONS[selection.targetCountry];
    var statusMeta = STATE_META[equivalency.status];

    return {
      selection: selection,
      equivalency: equivalency,
      destination: destination,
      gradeEquivalent: (GRADE_EQUIV[selection.classification] || {})[selection.targetCountry] || 'Evaluator-specific',
      statusMeta: statusMeta,
      studyReadiness: getStudyReadiness(selection, equivalency, destination),
      workReadiness: getWorkMigrationReadiness(selection, equivalency),
      assessment: getAssessmentNeed(selection, destination, equivalency.status),
      requirements: getAdditionalRequirements(selection, destination, equivalency.status),
      checklist: getDocumentChecklist(selection),
      tools: buildToolCards(selection, equivalency.status),
      summary: buildResultSummary(selection, equivalency, destination, statusMeta),
      regionalNote: getRegionalNote(selection.sourceCountry)
    };
  }

  function renderLinks(list) {
    return (list || []).map(function (link) {
      return '<li><a href="' + escapeHtml(link.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(link.label) + '</a></li>';
    }).join('');
  }

  function renderBullets(list) {
    return (list || []).map(function (item) {
      return '<li>' + escapeHtml(item) + '</li>';
    }).join('');
  }

  function renderToolCards(tools) {
    return tools.map(function (tool) {
      return '<article class="dc-tool-card' + (tool.primary ? ' primary' : '') + '">' +
        '<span class="dc-tool-tag">' + escapeHtml(tool.tag) + '</span>' +
        '<h3>' + escapeHtml(tool.title) + '</h3>' +
        '<p>' + escapeHtml(tool.copy) + '</p>' +
        '<div class="dc-tool-links"><a class="dc-tool-link' + (tool.primary ? ' primary' : '') + '" href="' + escapeHtml(tool.href) + '">Open tool</a></div>' +
      '</article>';
    }).join('');
  }

  function renderResult(result) {
    var selection = result.selection;
    var source = SOURCE_COUNTRIES[selection.sourceCountry];
    var level = DEGREE_LEVELS[selection.degreeLevel];
    var classification = CLASSIFICATIONS[selection.classification];

    elements.resultsMount.innerHTML =
      '<div class="dc-overview-grid">' +
        '<article class="dc-state-card">' +
          '<span class="dc-state-badge ' + escapeHtml(result.statusMeta.tone) + '">' + escapeHtml(result.statusMeta.label) + '</span>' +
          '<h3 class="dc-result-title">' + escapeHtml(result.destination.name) + ' readiness for your ' + escapeHtml(PATHWAYS[selection.pathwayGoal]) + '</h3>' +
          '<p class="dc-summary">' + escapeHtml(result.summary) + '</p>' +
          '<div class="dc-meta-grid">' +
            '<div class="dc-meta-item"><label>Your route</label><strong>' + escapeHtml(level.label) + '</strong></div>' +
            '<div class="dc-meta-item"><label>Comparable level</label><strong>' + escapeHtml(result.equivalency.equiv) + '</strong></div>' +
            '<div class="dc-meta-item"><label>Grade read-across</label><strong>' + escapeHtml(result.gradeEquivalent) + '</strong></div>' +
            '<div class="dc-meta-item"><label>Framework note</label><strong>' + escapeHtml(result.equivalency.framework) + '</strong></div>' +
          '</div>' +
          '<div class="dc-state-actions">' +
            '<button class="dc-button" id="saveRouteBtn" type="button">Save this route to Education Hub</button>' +
            '<span class="dc-save-feedback" id="saveFeedback">Save the route if you want the cockpit to remember this destination.</span>' +
          '</div>' +
        '</article>' +
        '<article class="dc-card">' +
          '<div class="dc-card-top"><div><div class="dc-card-kicker">Recognition view</div><h3>What the result actually means</h3></div><span class="dc-card-status">' + escapeHtml(result.statusMeta.short) + '</span></div>' +
          '<p>' + escapeHtml(result.statusMeta.lead) + '</p>' +
          '<p>' + escapeHtml(result.equivalency.note) + '</p>' +
          '<ul class="dc-bullet-list">' +
            '<li>Source-country regulator signal: ' + escapeHtml(source.regulator) + '</li>' +
            '<li>Grade context: ' + escapeHtml(classification.label) + '</li>' +
            '<li>Route context: ' + escapeHtml(CONTEXTS[selection.routeContext]) + '</li>' +
            '<li>Final authority: destination institution, employer, regulator, immigration owner, or formal evaluator</li>' +
          '</ul>' +
        '</article>' +
      '</div>' +
      '<div class="dc-readiness-grid">' +
        '<article class="dc-card"><div class="dc-card-top"><div><div class="dc-card-kicker">Study readiness</div><h3>' + escapeHtml(result.studyReadiness.status) + '</h3></div></div><p>' + escapeHtml(result.studyReadiness.body) + '</p></article>' +
        '<article class="dc-card"><div class="dc-card-top"><div><div class="dc-card-kicker">Work / migration readiness</div><h3>' + escapeHtml(result.workReadiness.status) + '</h3></div></div><p>' + escapeHtml(result.workReadiness.body) + '</p></article>' +
        '<article class="dc-card"><div class="dc-card-top"><div><div class="dc-card-kicker">Credential assessment</div><h3>' + escapeHtml(result.assessment.label) + '</h3></div></div><p>' + escapeHtml(result.assessment.body) + '</p></article>' +
        '<article class="dc-card"><div class="dc-card-top"><div><div class="dc-card-kicker">Language proof</div><h3>Still a separate gate</h3></div></div><p>' + escapeHtml(result.destination.languageSummary) + '</p></article>' +
      '</div>' +
      '<div class="dc-detail-grid">' +
        '<article class="dc-card"><div class="dc-card-top"><div><div class="dc-card-kicker">Official route owner</div><h3>' + escapeHtml(result.destination.name) + ' guidance</h3></div></div><p>Use these official sources to validate the live route before you treat this planning view as final.</p><ul class="dc-link-list">' + renderLinks(result.destination.officialLinks) + '</ul></article>' +
        '<article class="dc-card"><div class="dc-card-top"><div><div class="dc-card-kicker">Likely additional requirements</div><h3>What usually comes next</h3></div></div><ul class="dc-bullet-list">' + renderBullets(result.requirements) + '</ul></article>' +
        '<article class="dc-card"><div class="dc-card-top"><div><div class="dc-card-kicker">Document checklist</div><h3>Prepare the evidence now</h3></div></div><ul class="dc-bullet-list">' + renderBullets(result.checklist) + '</ul></article>' +
      '</div>' +
      '<div class="dc-region-note">' + escapeHtml(result.regionalNote) + '</div>' +
      '<div class="dc-next-grid">' + renderToolCards(result.tools) + '</div>';

    elements.resultPanel.hidden = false;
    elements.resultLead.textContent = 'Indicative outcome for ' + result.destination.name + '. Use this to plan the next gate, not to replace an official evaluation.';
    elements.resultPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function getSelection() {
    return {
      sourceCountry: elements.sourceCountry.value,
      degreeLevel: elements.degreeLevel.value,
      classification: elements.classification.value,
      targetCountry: elements.targetCountry.value,
      pathwayGoal: elements.pathwayGoal.value,
      routeContext: elements.routeContext.value
    };
  }

  function getMergedCountries(destinationName) {
    var cached = window.EduProfileSync && typeof window.EduProfileSync.getCachedProfile === 'function'
      ? window.EduProfileSync.getCachedProfile()
      : null;
    return uniqueStrings(((cached && cached.target_countries) || []).concat([destinationName]));
  }

  function saveRoute() {
    var result = appState.lastResult;
    var feedback = getEl('saveFeedback');

    if (!result) return;

    try {
      if (window.AfroEdu && typeof window.AfroEdu.saveDestination === 'function') {
        window.AfroEdu.saveDestination({
          id: slugify(result.destination.name + '-' + result.selection.pathwayGoal + '-' + result.selection.degreeLevel),
          name: result.destination.name,
          reason: result.statusMeta.label + ' - ' + PATHWAYS[result.selection.pathwayGoal],
          source: 'degree-checker',
          href: '/tools/degree-checker/'
        });
      }

      if (window.EduProfileSync && typeof window.EduProfileSync.update === 'function') {
        window.EduProfileSync.update({
          education_level: DEGREE_LEVELS[result.selection.degreeLevel].profileValue,
          target_countries: getMergedCountries(result.destination.name)
        });
      }

      if (window.AfroEdu && typeof window.AfroEdu.recordActivity === 'function') {
        window.AfroEdu.recordActivity('degree-checker', 'Saved degree readiness route', {
          detail: result.destination.name + ' - ' + result.statusMeta.label
        });
      }

      feedback.textContent = 'Saved to Education Hub. Your cockpit can now treat ' + result.destination.name + ' as a live destination route.';
      feedback.className = 'dc-save-feedback success';
    } catch (error) {
      feedback.textContent = 'Could not save this route just now. You can still use the result locally.';
      feedback.className = 'dc-save-feedback error';
    }
  }

  function onSubmit(event) {
    var result;
    event.preventDefault();
    result = calculate(getSelection());
    appState.lastResult = result;

    if (window.AfroEdu && typeof window.AfroEdu.recordActivity === 'function') {
      window.AfroEdu.recordActivity('degree-checker', 'Checked degree readiness', {
        detail: result.destination.name + ' - ' + result.statusMeta.label
      });
    }

    renderResult(result);
  }

  function bindEvents() {
    elements.form.addEventListener('submit', onSubmit);
    document.addEventListener('click', function (event) {
      if (event.target && event.target.id === 'saveRouteBtn') {
        saveRoute();
      }
    });
  }

  function init() {
    elements = {
      form: getEl('degreeForm'),
      sourceCountry: getEl('sourceCountry'),
      degreeLevel: getEl('degreeLevel'),
      classification: getEl('classification'),
      targetCountry: getEl('targetCountry'),
      pathwayGoal: getEl('pathwayGoal'),
      routeContext: getEl('routeContext'),
      resultPanel: getEl('resultPanel'),
      resultLead: getEl('resultLead'),
      resultsMount: getEl('resultsMount')
    };
    bindEvents();
  }

  document.addEventListener('DOMContentLoaded', init);
}());

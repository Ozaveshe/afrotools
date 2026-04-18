(function () {
  'use strict';

  function getEducationRegistryTools() {
    return (typeof AFRO_TOOLS !== 'undefined' ? AFRO_TOOLS : []).filter(function (tool) {
      return (tool.lang || 'en') === 'en' && tool.category === 'education';
    });
  }

  function buildRegistryMap() {
    var map = {};
    getEducationRegistryTools().forEach(function (tool) {
      map[tool.id] = tool;
    });
    return map;
  }

  function cloneList(list) {
    return (list || []).slice();
  }

  function resolveTools(ids, registryMap) {
    return ids.map(function (id) {
      return registryMap[id];
    }).filter(Boolean);
  }

  function uniqueCount(list) {
    return cloneList(list).length;
  }

  var BUCKETS = [
    {
      key: 'exam-prep-admissions',
      title: 'Exam Prep & Admissions',
      icon: '🎓',
      description: 'Admissions routing, country-native score calculators, and exam-readiness tools for African grading systems.',
      toolIds: [
        'university-admission',
        'waec-calculator',
        'jamb-aggregate',
        'kcse-calculator',
        'matric-points',
        'gpa-calculator'
      ],
      featuredIds: [
        'university-admission',
        'waec-calculator',
        'jamb-aggregate',
        'kcse-calculator',
        'matric-points',
        'gpa-calculator'
      ]
    },
    {
      key: 'student-finance',
      title: 'Student Finance',
      icon: '💰',
      description: 'School-fee comparison, monthly survival planning, savings, and loan repayment tools for students and families.',
      toolIds: [
        'school-fees',
        'student-budget',
        'boarding-school',
        'edu-savings',
        'student-loan-repay',
        'ke-helb'
      ],
      featuredIds: [
        'school-fees',
        'student-budget',
        'boarding-school',
        'edu-savings',
        'student-loan-repay',
        'ke-helb'
      ],
      toolOverrides: {
        'school-fees': {
          desc: 'The canonical education cost explorer for comparing annual tuition and extras before you commit to a school path.'
        },
        'student-budget': {
          desc: 'The monthly survival planner for testing whether housing, living costs, fees, or support gaps are breaking the month.'
        }
      }
    },
    {
      key: 'scholarships-study-abroad',
      title: 'Scholarships & Study Abroad',
      icon: '🌍',
      description: 'One flagship scholarship flow, a destination affordability engine, IELTS pathway planning, a degree-readiness bridge, and university shortlist building.',
      toolIds: [
        'scholarship-finder',
        'degree-checker',
        'study-abroad-cost',
        'university-ranking',
        'ielts-calculator'
      ],
      featuredIds: [
        'scholarship-finder',
        'study-abroad-cost',
        'degree-checker',
        'university-ranking',
        'ielts-calculator'
      ],
      toolOverrides: {
        'degree-checker': {
          desc: 'Turn African degree equivalency into destination-readiness guidance for study, work, migration, and the next tool to use.'
        },
        'study-abroad-cost': {
          desc: 'Compare UK, Canada, Australia, USA, and Germany across tuition, living costs, visa fees, insurance, and scholarship scenarios.'
        },
        'university-ranking': {
          desc: 'Build a school shortlist with fit heuristics, compare tradeoffs, and save universities back into the student cockpit.'
        }
      }
    },
    {
      key: 'academic-tools',
      title: 'Academic Tools',
      icon: '📚',
      description: 'Study utilities, writing helpers, and STEM tools used during coursework and revision.',
      toolIds: [
        'study-planner',
        'flashcard-maker',
        'exam-countdown',
        'exam-timetable',
        'course-load',
        'citation-generator',
        'word-counter',
        'plagiarism-pct',
        'periodic-table',
        'algebra-solver',
        'statistics-calc',
        'fraction-calc',
        'percentage-calc',
        'scientific-calc',
        'roman-numerals',
        'binary-converter'
      ],
      featuredIds: [
        'study-planner',
        'flashcard-maker',
        'exam-countdown',
        'exam-timetable',
        'course-load',
        'citation-generator',
        'word-counter',
        'plagiarism-pct'
      ]
    },
    {
      key: 'career-teaching',
      title: 'Career & Teaching',
      icon: '🚀',
      description: 'Teaching, service, and career-planning tools connected to study outcomes and educator workflows.',
      toolIds: [
        'teacher-salary',
        'tutoring-rate',
        'cert-roi',
        'coding-bootcamp',
        'interview-prep',
        'nysc-allowance',
        'national-service-gh',
        'classroom-size'
      ],
      featuredIds: [
        'teacher-salary',
        'tutoring-rate',
        'cert-roi',
        'coding-bootcamp',
        'interview-prep',
        'nysc-allowance'
      ]
    },
    {
      key: 'education-products-platforms',
      title: 'Education Products / Platforms',
      icon: '🧭',
      description: 'Productized education experiences in the AfroTools ecosystem.',
      toolIds: ['education-hub'],
      featuredIds: ['education-hub'],
      productBucket: true
    }
  ];

  var PRODUCT_SURFACES = [
    {
      key: 'education-hub',
      registryId: 'education-hub',
      title: 'Education Hub',
      href: '/tools/education-hub/',
      summary: 'Operating-layer student cockpit for profile, scholarships, universities, destinations, cost signals, and next-step orchestration.',
      productType: 'Registry-backed platform',
      accent: 'Registry + product'
    },
    {
      key: 'afrojamb',
      title: 'AfroJAMB',
      href: '/jamb/',
      summary: 'Productized JAMB prep surface with CBT mocks, past questions, and AI tutoring.',
      productType: 'Ecosystem product',
      accent: 'Off-registry product',
      icon: '⚡'
    },
    {
      key: 'afrostudy',
      title: 'AfroStudy',
      href: '/education/afrostudy/',
      summary: 'Productized KCSE prep surface with exam simulation, flashcards, and subject drills.',
      productType: 'Ecosystem product',
      accent: 'Off-registry product',
      icon: '📘'
    }
  ];

  var SUBHUBS = {
    fees: {
      key: 'fees',
      title: 'Education Fees & Cost Planning',
      eyebrow: 'Student Finance',
      description: 'Start with School Fees Comparator for annual tuition context, then use Student Budget Planner for the monthly survival plan.',
      toolIds: [
        'school-fees',
        'student-budget',
        'boarding-school',
        'edu-savings',
        'student-loan-repay'
      ],
      toolOverrides: {
        'school-fees': {
          desc: 'Compare annual tuition and extras first, then move the chosen school into monthly planning.'
        },
        'student-budget': {
          desc: 'Turn city costs, housing modes, and fee reserves into a practical monthly survival verdict.'
        }
      },
      relatedLinks: [
        { label: 'Education hub', href: '/education/' },
        { label: 'Student loans', href: '/education/loans/' },
        { label: 'Scholarships', href: '/education/scholarships/' }
      ]
    },
    loans: {
      key: 'loans',
      title: 'Student Loans & Repayment',
      eyebrow: 'Student Finance',
      description: 'Track student-loan repayment paths, the canonical Kenya HELB calculator, and the monthly budget pressure that creates financing gaps.',
      toolIds: [
        'student-loan-repay',
        'ke-helb',
        'student-budget',
        'edu-savings'
      ],
      toolOverrides: {
        'student-budget': {
          desc: 'Use the monthly survival planner when you need to prove whether the gap is really a loan problem or a cost-structure problem.'
        }
      },
      relatedLinks: [
        { label: 'Education hub', href: '/education/' },
        { label: 'Fees & cost planning', href: '/education/fees/' },
        { label: 'Scholarships', href: '/education/scholarships/' }
      ]
    },
    scholarships: {
      key: 'scholarships',
      title: 'Scholarships & Funding Opportunities',
      eyebrow: 'Scholarships & Study Abroad',
      description: 'Use one flagship scholarship flow, then connect it to affordability scenarios, IELTS readiness, degree-readiness checks, and destination research.',
      toolIds: [
        'scholarship-finder',
        'degree-checker',
        'study-abroad-cost',
        'university-ranking',
        'ielts-calculator'
      ],
      toolOverrides: {
        'degree-checker': {
          desc: 'Check whether your qualification still looks viable for the destination before you over-invest in scholarship or admissions planning.'
        },
        'study-abroad-cost': {
          desc: 'Compare destination affordability and scholarship-offset scenarios before you decide which route is realistic.'
        },
        'university-ranking': {
          desc: 'Turn school research into a shortlist with compare notes, scholarship-friendly routes, and saved universities.'
        }
      },
      relatedLinks: [
        { label: 'Education hub', href: '/education/' },
        { label: 'Study abroad', href: '/education/study-abroad/' },
        { label: 'Education Hub platform', href: '/tools/education-hub/' }
      ]
    },
    'study-abroad': {
      key: 'study-abroad',
      title: 'Study Abroad Planning Tools',
      eyebrow: 'Scholarships & Study Abroad',
      description: 'Compare destinations side by side, pressure-test affordability, plan IELTS targets, bridge degree equivalency into readiness, and connect scholarships with university shortlist building.',
      toolIds: [
        'study-abroad-cost',
        'degree-checker',
        'scholarship-finder',
        'university-ranking',
        'ielts-calculator'
      ],
      toolOverrides: {
        'degree-checker': {
          desc: 'The degree-readiness bridge for study abroad: see comparability, credential-assessment need, and the next tool to use.'
        },
        'study-abroad-cost': {
          desc: 'The affordability engine for study abroad: compare tuition, living, visa, insurance, and scholarship scenarios across destinations.'
        },
        'university-ranking': {
          desc: 'The university shortlist builder for comparing school tradeoffs before you apply.'
        }
      },
      relatedLinks: [
        { label: 'Education hub', href: '/education/' },
        { label: 'Scholarships', href: '/education/scholarships/' },
        { label: 'Education Hub platform', href: '/tools/education-hub/' }
      ]
    }
  };

  function resolveBuckets() {
    var registryMap = buildRegistryMap();
    return BUCKETS.map(function (bucket) {
      var overrides = bucket.toolOverrides || {};
      var allTools = resolveTools(bucket.toolIds, registryMap).map(function (tool) {
        return overrides[tool.id] ? Object.assign({}, tool, overrides[tool.id]) : tool;
      });
      var featuredTools = resolveTools(bucket.featuredIds, registryMap).map(function (tool) {
        return overrides[tool.id] ? Object.assign({}, tool, overrides[tool.id]) : tool;
      });
      return {
        key: bucket.key,
        title: bucket.title,
        icon: bucket.icon,
        description: bucket.description,
        productBucket: !!bucket.productBucket,
        registryCount: uniqueCount(allTools),
        featuredCount: uniqueCount(featuredTools),
        allTools: allTools,
        featuredTools: featuredTools
      };
    });
  }

  function resolveProductSurfaces() {
    var registryMap = buildRegistryMap();
    return PRODUCT_SURFACES.map(function (product) {
      var registryTool = product.registryId ? registryMap[product.registryId] : null;
      return {
        key: product.key,
        title: product.title,
        href: product.href,
        summary: product.summary,
        productType: product.productType,
        accent: product.accent,
        icon: product.icon || (registryTool ? registryTool.icon : '🎓'),
        registryTool: registryTool
      };
    });
  }

  function resolveSubhub(key) {
    var config = SUBHUBS[key];
    if (!config) return null;
    var registryMap = buildRegistryMap();
    var overrides = config.toolOverrides || {};
    return {
      key: config.key,
      title: config.title,
      eyebrow: config.eyebrow,
      description: config.description,
      relatedLinks: cloneList(config.relatedLinks),
      tools: resolveTools(config.toolIds, registryMap).map(function (tool) {
        return overrides[tool.id] ? Object.assign({}, tool, overrides[tool.id]) : tool;
      })
    };
  }

  function auditTaxonomy() {
    var registryTools = getEducationRegistryTools();
    var assigned = {};
    var duplicates = [];
    var registryIds = {};

    registryTools.forEach(function (tool) {
      registryIds[tool.id] = true;
    });

    BUCKETS.forEach(function (bucket) {
      bucket.toolIds.forEach(function (id) {
        if (assigned[id]) {
          duplicates.push(id);
        }
        assigned[id] = bucket.key;
      });
    });

    var missing = Object.keys(registryIds).filter(function (id) {
      return !assigned[id];
    });

    return {
      registryCount: registryTools.length,
      assignedCount: Object.keys(assigned).length,
      duplicateIds: duplicates,
      missingIds: missing
    };
  }

  function getRegistryCount() {
    return getEducationRegistryTools().length;
  }

  window.AfroEducation = {
    getRegistryCount: getRegistryCount,
    getBuckets: resolveBuckets,
    getProductSurfaces: resolveProductSurfaces,
    getSubhub: resolveSubhub,
    getRegistryTools: getEducationRegistryTools,
    auditTaxonomy: auditTaxonomy
  };
})();

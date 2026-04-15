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
      description: 'Score calculators, admissions checkers, and exam-readiness tools for African grading systems.',
      toolIds: [
        'waec-calculator',
        'jamb-aggregate',
        'kcse-calculator',
        'matric-points',
        'gpa-calculator',
        'university-admission'
      ],
      featuredIds: [
        'waec-calculator',
        'jamb-aggregate',
        'kcse-calculator',
        'matric-points',
        'gpa-calculator',
        'university-admission'
      ]
    },
    {
      key: 'student-finance',
      title: 'Student Finance',
      icon: '💰',
      description: 'Fees, budgeting, savings, and loan repayment tools for students and families.',
      toolIds: [
        'school-fees',
        'student-budget',
        'boarding-school',
        'edu-savings',
        'student-loan-repay',
        'ke-helb',
        'helb-repayment'
      ],
      featuredIds: [
        'school-fees',
        'student-budget',
        'boarding-school',
        'edu-savings',
        'student-loan-repay',
        'helb-repayment'
      ]
    },
    {
      key: 'scholarships-study-abroad',
      title: 'Scholarships & Study Abroad',
      icon: '🌍',
      description: 'Scholarship discovery, study-abroad planning, credential checks, and destination research.',
      toolIds: [
        'scholarship-finder',
        'scholarship-check',
        'degree-checker',
        'study-abroad-cost',
        'university-ranking',
        'ielts-calculator'
      ],
      featuredIds: [
        'scholarship-finder',
        'scholarship-check',
        'study-abroad-cost',
        'degree-checker',
        'university-ranking',
        'ielts-calculator'
      ]
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
      summary: 'Personalized education journey layer for academic profile, scholarships, and saved progress.',
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
      description: 'Plan tuition, boarding, monthly budgets, and education savings from one focused hub.',
      toolIds: [
        'school-fees',
        'student-budget',
        'boarding-school',
        'edu-savings',
        'student-loan-repay'
      ],
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
      description: 'Track student-loan repayment paths, HELB tools, and supporting budget planning.',
      toolIds: [
        'student-loan-repay',
        'ke-helb',
        'helb-repayment',
        'student-budget',
        'edu-savings'
      ],
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
      description: 'Find scholarships, check eligibility, and prepare your profile for study funding routes.',
      toolIds: [
        'scholarship-finder',
        'scholarship-check',
        'degree-checker',
        'university-ranking',
        'ielts-calculator'
      ],
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
      description: 'Estimate destination costs, check degree fit, and connect scholarships with travel-study planning.',
      toolIds: [
        'study-abroad-cost',
        'degree-checker',
        'scholarship-finder',
        'scholarship-check',
        'university-ranking',
        'ielts-calculator'
      ],
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
      var allTools = resolveTools(bucket.toolIds, registryMap);
      var featuredTools = resolveTools(bucket.featuredIds, registryMap);
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
    return {
      key: config.key,
      title: config.title,
      eyebrow: config.eyebrow,
      description: config.description,
      relatedLinks: cloneList(config.relatedLinks),
      tools: resolveTools(config.toolIds, registryMap)
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

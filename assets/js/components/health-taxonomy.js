'use strict';
(function(){
  function registry(){return (typeof AFRO_TOOLS !== 'undefined' ? AFRO_TOOLS : []).filter(function(tool){return (tool.lang || 'en') === 'en';});}
  function healthTools(){return registry().filter(function(tool){return tool.category === 'health';});}
  function byId(){var map={};registry().forEach(function(tool){map[tool.id]=tool;});return map;}
  function clone(items){return (items || []).slice();}
  function pick(ids,map){return ids.map(function(id){return map[id];}).filter(Boolean);}
  var buckets=[
  {
    "key": "vitals-body-metrics",
    "title": "Vitals & Body Metrics",
    "icon": "📏",
    "description": "BMI, waist ratio, hydration, blood pressure, and diabetes-risk tools used for everyday body metrics and monitoring.",
    "toolIds": [
      "bmi-calculator",
      "blood-pressure",
      "diabetes-risk",
      "waist-hip-ratio",
      "water-intake",
      "bmi-calc-tools"
    ],
    "featuredIds": [
      "bmi-calculator",
      "blood-pressure",
      "diabetes-risk",
      "waist-hip-ratio",
      "water-intake"
    ]
  },
  {
    "key": "lab-reports-medical-interpretation",
    "title": "Lab Reports & Medical Interpretation",
    "icon": "🩺",
    "description": "AI interpretation and screening-style tools for lab results, genotype, blood group, and sickle-cell compatibility.",
    "toolIds": [
      "medical-report",
      "genotype-checker",
      "blood-group",
      "sickle-cell"
    ],
    "featuredIds": [
      "medical-report",
      "genotype-checker",
      "blood-group",
      "sickle-cell"
    ]
  },
  {
    "key": "nutrition-fitness",
    "title": "Nutrition & Fitness",
    "icon": "🥗",
    "description": "African-food calorie tools, meal planning, and activity-focused wellness tools for diet and fitness routines.",
    "toolIds": [
      "calorie-counter",
      "african-meal-plan",
      "home-workout",
      "gym-cost-compare",
      "calorie-counter-tools"
    ],
    "featuredIds": [
      "calorie-counter",
      "african-meal-plan",
      "home-workout",
      "gym-cost-compare"
    ]
  },
  {
    "key": "womens-family-health",
    "title": "Women's & Family Health",
    "icon": "👶",
    "description": "Fertility, pregnancy, childbirth, child growth, breastfeeding, and family-planning tools for ongoing family-health decisions.",
    "toolIds": [
      "due-date",
      "ovulation-calc",
      "maternal-mortality",
      "childbirth-cost",
      "csection-vs-natural",
      "pregnancy-nutrition",
      "child-growth",
      "breastfeeding-tracker",
      "vaccine-schedule",
      "due-date-tools"
    ],
    "featuredIds": [
      "due-date",
      "ovulation-calc",
      "childbirth-cost",
      "child-growth",
      "pregnancy-nutrition",
      "maternal-mortality"
    ]
  },
  {
    "key": "health-costs-insurance",
    "title": "Health Costs & Insurance",
    "icon": "💳",
    "description": "Cost comparison and care-planning tools for hospital visits, clinic prices, pharmacy prices, treatment choices, mental health, dental work, and travel-for-care decisions.",
    "toolIds": [
      "hospital-cost",
      "clinic-costs",
      "pharmacy-prices",
      "dental-cost",
      "drug-price-compare",
      "traditional-vs-western",
      "medical-tourism",
      "eye-care-cost",
      "mental-health-cost"
    ],
    "featuredIds": [
      "hospital-cost",
      "clinic-costs",
      "pharmacy-prices",
      "drug-price-compare",
      "dental-cost",
      "medical-tourism",
      "mental-health-cost"
    ]
  },
  {
    "key": "clinical-professional-utilities",
    "title": "Clinical / Professional Utilities",
    "icon": "🧪",
    "description": "More operational health tools for dosage, prevention, water safety, infectious-disease risk, and treatment tracking.",
    "toolIds": [
      "drug-dosage",
      "malaria-risk",
      "water-quality",
      "hiv-treatment-cost",
      "tb-tracker",
      "cholera-risk",
      "ebola-checklist",
      "hep-b-screening"
    ],
    "featuredIds": [
      "drug-dosage",
      "malaria-risk",
      "water-quality",
      "hiv-treatment-cost",
      "tb-tracker"
    ]
  }
];
  var flagships=[
  {
    "key": "medical-report",
    "registryId": "medical-report",
    "title": "Medical Report Interpreter",
    "href": "/tools/medical-report/",
    "summary": "AI-first surface for CBC, lipid, liver, kidney, thyroid, and diabetes report interpretation.",
    "surfaceType": "Registry flagship",
    "mode": "AI report tool",
    "audience": "Clinical + personal"
  },
  {
    "key": "bmi-calculator",
    "registryId": "bmi-calculator",
    "title": "BMI Calculator for Africans",
    "href": "/health/bmi-calculator/",
    "summary": "Flagship vitals surface with BMI, waist context, and African body-composition framing.",
    "surfaceType": "Registry flagship",
    "mode": "Calculator",
    "audience": "Personal wellness"
  },
  {
    "key": "calorie-counter",
    "registryId": "calorie-counter",
    "title": "Calorie Counter (African Foods)",
    "href": "/health/calorie-counter/",
    "summary": "Flagship nutrition surface with 200+ local foods, macros, and meal-tracking flows.",
    "surfaceType": "Registry flagship",
    "mode": "Tracker / calculator",
    "audience": "Personal wellness"
  },
  {
    "key": "due-date",
    "registryId": "due-date",
    "title": "Pregnancy Due Date Calculator",
    "href": "/health/pregnancy-due-date/",
    "summary": "Flagship family-health surface for due date, milestones, and delivery-planning context.",
    "surfaceType": "Registry flagship",
    "mode": "Calculator + planner",
    "audience": "Women's & family health"
  },
  {
    "key": "health-insurance-compare",
    "registryId": "health-insurance-compare",
    "title": "Health Insurance Comparator",
    "href": "/tools/health-insurance-compare/",
    "summary": "Connected insurance surface for comparing coverage, premiums, and plan structure across African markets.",
    "surfaceType": "Connected surface",
    "mode": "Comparator",
    "audience": "Costs & coverage"
  }
];
  var overlapGroups=[
  {
    "key": "bmi-surfaces",
    "label": "BMI surfaces",
    "toolIds": [
      "bmi-calculator",
      "bmi-calc-tools"
    ]
  },
  {
    "key": "calorie-surfaces",
    "label": "Calorie-counter surfaces",
    "toolIds": [
      "calorie-counter",
      "calorie-counter-tools"
    ]
  },
  {
    "key": "due-date-surfaces",
    "label": "Pregnancy due-date surfaces",
    "toolIds": [
      "due-date",
      "due-date-tools"
    ]
  },
  {
    "key": "genetics-screening",
    "label": "Genetics and compatibility tools",
    "toolIds": [
      "genotype-checker",
      "blood-group",
      "sickle-cell"
    ]
  },
  {
    "key": "care-cost-planning",
    "label": "Care cost-planning tools",
    "toolIds": [
      "hospital-cost",
      "clinic-costs",
      "pharmacy-prices",
      "childbirth-cost",
      "csection-vs-natural",
      "dental-cost",
      "medical-tourism"
    ]
  }
];
  var subhubs={
  "costs": {
    "key": "costs",
    "title": "Health Costs & Treatment Planning",
    "eyebrow": "Health Costs & Insurance",
    "description": "Use this route when the job is comparing treatment costs, clinic prices, pharmacy prices, procedure tradeoffs, and likely out-of-pocket care expenses.",
    "primaryLabel": "Focused health tools",
    "connectedLabel": "Connected coverage tools",
    "toolIds": [
      "hospital-cost",
      "clinic-costs",
      "pharmacy-prices",
      "dental-cost",
      "drug-price-compare",
      "traditional-vs-western",
      "medical-tourism",
      "eye-care-cost",
      "mental-health-cost"
    ],
    "connectedIds": [
      "health-insurance-compare",
      "health-contribution"
    ],
    "relatedLinks": [
      {
        "label": "Health hub",
        "href": "/health/"
      },
      {
        "label": "Insurance & contribution planning",
        "href": "/health/insurance/"
      },
      {
        "label": "Medical Report Interpreter",
        "href": "/tools/medical-report/"
      }
    ],
    "note": "Coverage tools are surfaced separately because they live in the Insurance category and are not part of the Health registry count."
  },
  "insurance": {
    "key": "insurance",
    "title": "Health Insurance & Contribution Planning",
    "eyebrow": "Connected Insurance Surfaces",
    "description": "Start here when you need plan comparison, national health-contribution guidance, and the cost tools that make coverage decisions tangible.",
    "primaryLabel": "Related health tools",
    "connectedLabel": "Insurance-category surfaces",
    "toolIds": [
      "hospital-cost",
      "clinic-costs",
      "pharmacy-prices",
      "drug-price-compare",
      "due-date",
      "childbirth-cost",
      "medical-tourism"
    ],
    "connectedIds": [
      "health-insurance-compare",
      "health-contribution"
    ],
    "relatedLinks": [
      {
        "label": "Health hub",
        "href": "/health/"
      },
      {
        "label": "Health costs & treatment planning",
        "href": "/health/costs/"
      },
      {
        "label": "Pregnancy due-date surface",
        "href": "/health/pregnancy-due-date/"
      }
    ],
    "note": "Health Insurance Comparator and Health Contribution are linked here for navigation, but they remain outside the Health registry total because their registry home is Insurance."
  }
};
  window.AfroHealth={
    getBuckets:function(){var map=byId();return buckets.map(function(bucket){var all=pick(bucket.toolIds,map);var featured=pick(bucket.featuredIds,map);return {key:bucket.key,title:bucket.title,icon:bucket.icon,description:bucket.description,registryCount:all.length,featuredCount:featured.length,allTools:all,featuredTools:featured};});},
    getFlagshipSurfaces:function(){var map=byId();return flagships.map(function(surface){var tool=surface.registryId ? map[surface.registryId] : null;return {key:surface.key,title:surface.title,href:surface.href,summary:surface.summary,surfaceType:surface.surfaceType,mode:surface.mode,audience:surface.audience,registryTool:tool,inHealthRegistry:!!(tool && tool.category === 'health'),icon:tool ? tool.icon : '🏥'};});},
    getRegistryCount:function(){return healthTools().length;},
    getRegistryTools:healthTools,
    getSubhub:function(key){var subhub=subhubs[key];if(!subhub)return null;var map=byId();return {key:subhub.key,title:subhub.title,eyebrow:subhub.eyebrow,description:subhub.description,primaryLabel:subhub.primaryLabel,connectedLabel:subhub.connectedLabel,relatedLinks:clone(subhub.relatedLinks),note:subhub.note,tools:pick(subhub.toolIds,map),connectedTools:pick(subhub.connectedIds,map)};},
    getOverlapGroups:function(){var map=byId();return overlapGroups.map(function(group){return {key:group.key,label:group.label,tools:pick(group.toolIds,map)};});},
    auditTaxonomy:function(){var health=healthTools();var assigned={};var duplicates=[];var known={};health.forEach(function(tool){known[tool.id]=true;});buckets.forEach(function(bucket){bucket.toolIds.forEach(function(id){if(assigned[id])duplicates.push(id);assigned[id]=bucket.key;});});var missing=Object.keys(known).filter(function(id){return !assigned[id];});return {registryCount:health.length,assignedCount:Object.keys(assigned).length,duplicateIds:duplicates,missingIds:missing};}
  };
})();

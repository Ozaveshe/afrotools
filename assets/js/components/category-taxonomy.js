(function (root, factory) {
  'use strict';

  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AfroToolsCategoryTaxonomy = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var AGRICULTURE_BUCKETS = [
    {
      key: 'crop-planning-yield',
      slug: 'crop-planning-yield',
      label: 'Crop Planning & Yield',
      summary: 'Planting calendars, yield targets, fertilizer planning, seed rates, harvest timing, and field readiness.',
      families: [
        'tools/planting-calendar',
        'tools/crop-yield',
        'tools/fertilizer-calc',
        'crop-yield',
        'fertilizer',
        'seed-rate',
        'harvest-date',
        'crop-rotation',
        'soil-ph',
        'farm-size-converter'
      ],
      keywords: ['yield', 'planting', 'seed', 'fertilizer', 'harvest', 'rotation', 'soil', 'farm size'],
      featuredToolIds: [
        'crop-yield-estimator',
        'fertilizer-calculator',
        'seed-rate-calculator',
        'harvest-date-estimator'
      ]
    },
    {
      key: 'livestock-poultry',
      slug: 'livestock-poultry',
      label: 'Livestock & Poultry',
      summary: 'Poultry ROI, fish farming, feed formulation, and vaccination planning for animal-based agriculture.',
      families: [
        'poultry-roi',
        'fish-farming',
        'livestock-feed',
        'vaccination-schedule'
      ],
      keywords: ['livestock', 'poultry', 'fish', 'feed', 'vaccination', 'broiler', 'layer', 'aquaculture'],
      featuredToolIds: [
        'poultry-roi-calculator',
        'fish-farming-roi',
        'livestock-feed-calculator',
        'vaccination-schedule'
      ]
    },
    {
      key: 'farm-finance-roi',
      slug: 'farm-finance-roi',
      label: 'Farm Finance & ROI',
      summary: 'Season budgets, profit models, and ROI tools for farm-level financial planning.',
      families: [
        'farm-profit',
        'farm-budget',
        'tools/agric-profit'
      ],
      keywords: ['profit', 'budget', 'roi', 'margin', 'cash flow', 'economics'],
      featuredToolIds: [
        'farm-profit-calculator',
        'farm-budget',
        'agric-profit'
      ]
    },
    {
      key: 'inputs-feed-operations',
      slug: 'inputs-feed-operations',
      label: 'Inputs, Feed & Operations',
      summary: 'Input price comparison, dosage guidance, and day-to-day farm operating calculators.',
      families: [
        'input-prices',
        'pesticide-dosage'
      ],
      keywords: ['input', 'dosage', 'agrochemical', 'operations', 'sprayer', 'comparator'],
      featuredToolIds: [
        'input-prices',
        'pesticide-dosage-calculator'
      ]
    },
    {
      key: 'irrigation-weather-climate',
      slug: 'irrigation-weather-climate',
      label: 'Irrigation, Weather & Climate',
      summary: 'Crop water requirement planning and irrigation scheduling for climate-sensitive production.',
      families: ['irrigation'],
      keywords: ['irrigation', 'water', 'climate', 'weather', 'penman'],
      featuredToolIds: ['irrigation-calculator']
    },
    {
      key: 'market-prices-trade-post-harvest',
      slug: 'market-prices-trade-post-harvest',
      label: 'Market Prices, Trade & Post-Harvest',
      summary: 'Commodity prices, export workflows, crop processing, and post-harvest storage or loss analysis.',
      families: [
        'commodity-prices',
        'cocoa-tracker',
        'coffee-calculator',
        'cassava-processing',
        'storage-loss',
        'export-docs'
      ],
      keywords: ['market', 'price', 'export', 'trade', 'processing', 'storage', 'post-harvest', 'warehouse'],
      featuredToolIds: [
        'commodity-prices',
        'cassava-processing-calculator',
        'cocoa-tracker',
        'export-docs'
      ]
    },
    {
      key: 'equipment-infrastructure',
      slug: 'equipment-infrastructure',
      label: 'Equipment & Infrastructure',
      summary: 'Mechanization, greenhouse economics, and infrastructure decisions that shape farm capacity.',
      families: [
        'greenhouse',
        'tractor-calculator'
      ],
      keywords: ['tractor', 'equipment', 'greenhouse', 'mechanization', 'infrastructure'],
      featuredToolIds: [
        'greenhouse-cost-estimator',
        'tractor-calculator'
      ]
    },
    {
      key: 'products-platforms',
      slug: 'products-platforms',
      label: 'Agriculture Products / Platforms',
      summary: 'Loan access, insurance, payroll, warehouse finance, and cooperative tooling that support agribusiness operations.',
      families: [
        'farm-payroll',
        'farm-loans',
        'crop-insurance',
        'warehouse-receipt',
        'cooperative-calculator'
      ],
      keywords: ['loan', 'insurance', 'payroll', 'cooperative', 'warehouse receipt', 'platform'],
      featuredToolIds: [
        'farm-loans-hub',
        'crop-insurance',
        'farm-payroll-calculator',
        'warehouse-receipt'
      ]
    }
  ];

  var AGRICULTURE_FAMILY_TO_BUCKET = {};
  var AGRICULTURE_BUCKET_LOOKUP = {};
  var AGRICULTURE_FEATURED_TOOL_IDS = [
    'farm-profit-calculator',
    'crop-yield-estimator',
    'fertilizer-calculator',
    'poultry-roi-calculator',
    'commodity-prices',
    'greenhouse-cost-estimator'
  ];
  var AGRICULTURE_WORKFLOWS = [
    {
      key: 'season-planning',
      title: 'Plan a Growing Season',
      summary: 'Move from planting date to yield target, fertilizer plan, irrigation schedule, and budget.',
      toolIds: [
        'planting-calendar',
        'crop-yield-estimator',
        'fertilizer-calculator',
        'irrigation-calculator',
        'farm-budget'
      ]
    },
    {
      key: 'livestock-unit-economics',
      title: 'Model Livestock Unit Economics',
      summary: 'Stress-test poultry or fish profitability, then price feed and health management before scaling.',
      toolIds: [
        'poultry-roi-calculator',
        'fish-farming-roi',
        'livestock-feed-calculator',
        'vaccination-schedule'
      ]
    },
    {
      key: 'post-harvest-trade',
      title: 'Protect Margin After Harvest',
      summary: 'Compare market prices, storage losses, processing upside, and export paperwork before selling.',
      toolIds: [
        'commodity-prices',
        'storage-loss',
        'cassava-processing-calculator',
        'export-docs'
      ]
    }
  ];

  AGRICULTURE_BUCKETS.forEach(function (bucket) {
    AGRICULTURE_BUCKET_LOOKUP[bucket.key] = bucket;
    bucket.families.forEach(function (familyKey) {
      AGRICULTURE_FAMILY_TO_BUCKET[familyKey] = bucket.key;
    });
  });

  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function normalizeHref(href, fallback) {
    return String(href || fallback || '')
      .trim()
      .replace(/\/index\.html$/i, '')
      .replace(/\/+$/, '')
      .toLowerCase();
  }

  function getToolFamilyKey(tool) {
    var href = normalizeHref(tool && tool.href, tool && tool.id);
    var agMatch = href.match(/^\/agriculture\/([^/]+)/);
    if (agMatch) return agMatch[1];

    var toolsMatch = href.match(/^\/tools\/([^/]+)/);
    if (toolsMatch) return 'tools/' + toolsMatch[1];

    return href || String((tool && tool.id) || '').toLowerCase();
  }

  function getToolSearchText(tool) {
    var values = [
      tool && tool.id,
      tool && tool.name,
      tool && tool.desc,
      tool && tool.href
    ];

    if (tool && tool.tags && typeof tool.tags.join === 'function') {
      values.push(tool.tags.join(' '));
    }

    return normalizeText(values.join(' '));
  }

  function getMatchingAgricultureBuckets(tool) {
    var familyKey = getToolFamilyKey(tool);
    var exactBucket = AGRICULTURE_FAMILY_TO_BUCKET[familyKey];
    if (exactBucket) {
      return [exactBucket];
    }

    var haystack = getToolSearchText(tool);
    return AGRICULTURE_BUCKETS.filter(function (bucket) {
      return bucket.keywords.some(function (keyword) {
        return haystack.indexOf(normalizeText(keyword)) !== -1;
      });
    }).map(function (bucket) {
      return bucket.key;
    });
  }

  function isActiveEnglishAgricultureTool(tool) {
    var lang = tool && tool.lang ? tool.lang : 'en';
    return Boolean(
      tool &&
      tool.category === 'agriculture' &&
      lang === 'en' &&
      (tool.status === 'live' || tool.status === 'new')
    );
  }

  function byPriority(toolA, toolB) {
    var priorityDiff = Number(toolB.priority || 0) - Number(toolA.priority || 0);
    if (priorityDiff !== 0) return priorityDiff;
    return String(toolA.name || '').localeCompare(String(toolB.name || ''));
  }

  function buildFamilyStats(tools) {
    var stats = {};

    tools.forEach(function (tool) {
      var familyKey = getToolFamilyKey(tool);
      if (!stats[familyKey]) {
        stats[familyKey] = {
          key: familyKey,
          count: 0,
          tools: []
        };
      }
      stats[familyKey].count += 1;
      stats[familyKey].tools.push(tool);
    });

    return Object.keys(stats).map(function (familyKey) {
      var stat = stats[familyKey];
      stat.tools.sort(byPriority);
      stat.anchorTool = stat.tools[0];
      return stat;
    }).sort(function (familyA, familyB) {
      var countDiff = familyB.count - familyA.count;
      if (countDiff !== 0) return countDiff;
      return familyA.key.localeCompare(familyB.key);
    });
  }

  function mapToolsById(tools) {
    var result = {};
    tools.forEach(function (tool) {
      result[tool.id] = tool;
    });
    return result;
  }

  function pickExistingTools(toolIds, toolMap) {
    return toolIds.map(function (toolId) {
      return toolMap[toolId];
    }).filter(Boolean);
  }

  function getAgricultureTaxonomyReport(tools) {
    var agricultureTools = (tools || []).filter(isActiveEnglishAgricultureTool);
    var duplicates = [];
    var missing = [];
    var buckets = AGRICULTURE_BUCKETS.map(function (bucket) {
      return {
        key: bucket.key,
        slug: bucket.slug,
        label: bucket.label,
        summary: bucket.summary,
        featuredToolIds: bucket.featuredToolIds.slice(),
        tools: []
      };
    });
    var bucketMap = {};
    var toolMap;

    buckets.forEach(function (bucket) {
      bucketMap[bucket.key] = bucket;
    });

    agricultureTools.forEach(function (tool) {
      var matches = getMatchingAgricultureBuckets(tool);

      if (matches.length === 0) {
        missing.push(tool);
        return;
      }

      if (matches.length > 1) {
        duplicates.push({
          tool: tool,
          bucketKeys: matches.slice()
        });
        return;
      }

      bucketMap[matches[0]].tools.push(tool);
    });

    toolMap = mapToolsById(agricultureTools);

    buckets.forEach(function (bucket) {
      bucket.tools.sort(byPriority);
      bucket.count = bucket.tools.length;
      bucket.familyStats = buildFamilyStats(bucket.tools);
      bucket.familyCount = bucket.familyStats.length;
      bucket.topFamilies = bucket.familyStats.slice(0, 3);
      bucket.featuredTools = pickExistingTools(bucket.featuredToolIds, toolMap);
      if (!bucket.featuredTools.length) {
        bucket.featuredTools = bucket.tools.slice(0, 4);
      }
    });

    return {
      totalTools: agricultureTools.length,
      bucketedCount: buckets.reduce(function (sum, bucket) {
        return sum + bucket.count;
      }, 0),
      buckets: buckets,
      bucketMap: bucketMap,
      missingAssignments: missing,
      duplicateAssignments: duplicates,
      featuredTools: pickExistingTools(AGRICULTURE_FEATURED_TOOL_IDS, toolMap),
      workflows: AGRICULTURE_WORKFLOWS.map(function (workflow) {
        return {
          key: workflow.key,
          title: workflow.title,
          summary: workflow.summary,
          tools: pickExistingTools(workflow.toolIds, toolMap)
        };
      })
    };
  }

  function getAgricultureBucketByKey(bucketKey) {
    return AGRICULTURE_BUCKET_LOOKUP[bucketKey] || null;
  }

  return {
    agriculture: {
      buckets: AGRICULTURE_BUCKETS.slice(),
      featuredToolIds: AGRICULTURE_FEATURED_TOOL_IDS.slice(),
      workflows: AGRICULTURE_WORKFLOWS.slice(),
      getBucketByKey: getAgricultureBucketByKey,
      getMatchingBuckets: getMatchingAgricultureBuckets,
      getToolFamilyKey: getToolFamilyKey,
      isActiveTool: isActiveEnglishAgricultureTool,
      getReport: getAgricultureTaxonomyReport
    },
    normalizeHref: normalizeHref
  };
});

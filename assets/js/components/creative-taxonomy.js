(function () {
  'use strict';

  function isCreativeRegistryTool(tool) {
    var lang = tool.lang || 'en';
    var status = tool.status || '';
    var phase = tool.phase || '';
    return lang === 'en'
      && tool.category === 'creative'
      && phase === 'LIVE'
      && status !== 'planned'
      && status !== 'queued';
  }

  function getCreativeRegistryTools() {
    return (typeof AFRO_TOOLS !== 'undefined' ? AFRO_TOOLS : []).filter(isCreativeRegistryTool);
  }

  function buildRegistryMap() {
    var map = {};
    getCreativeRegistryTools().forEach(function (tool) {
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

  function deriveLabel(name) {
    var parts = String(name || '').split(/\s+(?:\u2014|-)\s+/);
    return (parts[0] || name || '').trim();
  }

  function sanitizeSummary(summary) {
    var normalized = String(summary || '').replace(/\s+/g, ' ').trim();
    if (!normalized) return '';
    if (normalized.length > 180) {
      return normalized.slice(0, 177).replace(/[,\s]+$/, '') + '...';
    }
    return normalized;
  }

  function sortDecoratedTools(list) {
    return cloneList(list).sort(function (a, b) {
      var priorityDelta = (b.priority || 0) - (a.priority || 0);
      if (priorityDelta) return priorityDelta;
      return a.label.localeCompare(b.label);
    });
  }

  var TOOL_OVERRIDES = {
    afrostream: {
      label: 'AfroStream',
      summary: 'Live African creator discovery, rankings, creator news, and market proof across streaming platforms.'
    },
    'book-publishing-cost': {
      label: 'Book Publishing Cost'
    },
    'creator-analytics': {
      label: 'CreatorAnalytics',
      summary: 'Track creator performance across platforms, spot winners, and keep reporting in one place.'
    },
    'creator-calendar': {
      label: 'CreatorCalendar'
    },
    'creator-course': {
      label: 'CreatorCourse',
      summary: 'Build paid courses with lessons, quizzes, certificates, and local-currency sales pages.'
    },
    'creator-money': {
      label: 'CreatorMoney'
    },
    'creator-page': {
      label: 'CreatorPage'
    },
    'creator-pricing': {
      label: 'CreatorPricing'
    },
    'creator-record': {
      label: 'CreatorRecord'
    },
    'creator-schedule': {
      label: 'CreatorSchedule'
    },
    'engagement-rate': {
      label: 'Engagement Rate'
    },
    'linkedin-optimizer': {
      label: 'LinkedIn Optimizer'
    },
    'personal-brand-audit': {
      label: 'Personal Brand Audit'
    },
    'photography-pricing': {
      label: 'Photography Pricing'
    },
    'podcast-monetization': {
      label: 'Podcast Monetization'
    },
    'self-publishing-royalty': {
      label: 'Self-Publishing Royalty'
    },
    'social-media-calendar': {
      label: 'Social Media Calendar'
    },
    'wedding-photo-package': {
      label: 'Wedding Photo Package'
    }
  };

  var BUCKETS = [
    {
      key: 'content-creation',
      title: 'Content Creation',
      description: 'Research, plan, write, and repurpose creator content without leaving the AfroTools stack.',
      theme: 'ink',
      toolIds: [
        'creator-calendar',
        'creator-captions',
        'creator-hooks',
        'creator-mind',
        'creator-polish',
        'creator-repurpose',
        'creator-research',
        'creator-scripts',
        'creator-titles',
        'social-media-calendar'
      ],
      featuredIds: [
        'creator-mind',
        'creator-scripts',
        'creator-research',
        'creator-hooks',
        'creator-captions',
        'creator-repurpose'
      ]
    },
    {
      key: 'visual-editing',
      title: 'Visual & Editing',
      description: 'Design, resize, record, clip, and polish creator assets for every major platform.',
      theme: 'rose',
      toolIds: [
        'african-palette',
        'creator-canvas',
        'creator-carousel',
        'creator-clip',
        'creator-record',
        'creator-resize',
        'creator-stock',
        'creator-thumb',
        'creator-voice'
      ],
      featuredIds: [
        'creator-thumb',
        'creator-canvas',
        'creator-carousel',
        'creator-clip',
        'creator-record',
        'creator-voice'
      ]
    },
    {
      key: 'creator-business',
      title: 'Creator Business',
      description: 'Package the work, price it properly, manage clients, and run the business side of creative work.',
      theme: 'sand',
      toolIds: [
        'art-commission',
        'creator-brand',
        'creator-desk',
        'creator-invoice',
        'creator-kit',
        'creator-money',
        'creator-pricing',
        'creator-split',
        'photography-pricing',
        'wedding-photo-package'
      ],
      featuredIds: [
        'creator-kit',
        'creator-invoice',
        'creator-pricing',
        'creator-money',
        'creator-desk',
        'creator-brand'
      ]
    },
    {
      key: 'audience-growth',
      title: 'Audience Growth',
      description: 'Strengthen creator profiles, distribution, scheduling, newsletter growth, and audience proof.',
      theme: 'sky',
      toolIds: [
        'creator-analytics',
        'creator-bios',
        'creator-hashtags',
        'creator-mail',
        'creator-schedule',
        'engagement-rate',
        'linkedin-optimizer',
        'personal-brand-audit'
      ],
      featuredIds: [
        'creator-schedule',
        'creator-mail',
        'engagement-rate',
        'personal-brand-audit',
        'creator-bios',
        'creator-hashtags'
      ]
    },
    {
      key: 'monetization-commerce',
      title: 'Monetization & Commerce',
      description: 'Model royalties, product revenue, publishing economics, and the money paths behind creator output.',
      theme: 'mint',
      toolIds: [
        'book-publishing-cost',
        'music-royalty-splitter',
        'podcast-monetization',
        'self-publishing-royalty'
      ],
      featuredIds: [
        'podcast-monetization',
        'music-royalty-splitter',
        'self-publishing-royalty',
        'book-publishing-cost'
      ]
    },
    {
      key: 'creative-products-platforms',
      title: 'Creative Products / Platforms',
      description: 'Registry-backed platform-style products that extend beyond a single utility workflow.',
      theme: 'cobalt',
      toolIds: [
        'afrostream',
        'creator-club',
        'creator-course',
        'creator-page',
        'creator-team'
      ],
      featuredIds: [
        'afrostream',
        'creator-page',
        'creator-club',
        'creator-course',
        'creator-team'
      ],
      productBucket: true
    }
  ];

  var PRODUCT_SURFACES = [
    {
      key: 'creator-studio',
      title: 'Creator Studio',
      href: '#content-creation',
      summary: 'The creation surface for scripting, research, design, recording, editing, and repurposing.',
      productType: 'Ecosystem surface',
      accent: 'Curated on this page',
      bucketKeys: ['content-creation', 'visual-editing'],
      icon: 'Studio'
    },
    {
      key: 'creator-suite',
      title: 'Creator Suite',
      href: '#creator-business',
      summary: 'The business surface for pricing, pitching, operating, audience systems, and monetization.',
      productType: 'Ecosystem surface',
      accent: 'Curated on this page',
      bucketKeys: ['creator-business', 'audience-growth', 'monetization-commerce'],
      icon: 'Suite'
    },
    {
      key: 'afrostream',
      registryId: 'afrostream',
      title: 'AfroStream',
      href: '/tools/afrostream/',
      summary: 'The live discovery and rankings platform for African creators.',
      productType: 'Registry-backed platform',
      accent: 'Counted in registry total',
      bucketKeys: ['creative-products-platforms'],
      icon: 'Live'
    },
    {
      key: 'streamer-university',
      title: 'Streamer University',
      href: '/tools/afrostream/university/',
      summary: 'The learning layer that teaches creators how to use the system and fix bottlenecks.',
      productType: 'Ecosystem learning surface',
      accent: 'Off-registry surface',
      bucketKeys: ['content-creation', 'audience-growth', 'monetization-commerce'],
      icon: 'Learn'
    }
  ];

  function decorateTool(tool) {
    var override = TOOL_OVERRIDES[tool.id] || {};
    return {
      id: tool.id,
      href: tool.href,
      icon: tool.icon,
      label: override.label || deriveLabel(tool.name),
      fullName: tool.name,
      summary: override.summary || sanitizeSummary(tool.desc),
      priority: tool.priority || 0,
      revenue: tool.revenue || '',
      status: tool.status || ''
    };
  }

  function resolveBuckets() {
    var registryMap = buildRegistryMap();
    return BUCKETS.map(function (bucket) {
      var featuredIdMap = {};
      bucket.featuredIds.forEach(function (id) {
        featuredIdMap[id] = true;
      });

      var allTools = sortDecoratedTools(resolveTools(bucket.toolIds, registryMap).map(decorateTool));
      var featuredTools = resolveTools(bucket.featuredIds, registryMap).map(decorateTool);
      var remainingTools = allTools.filter(function (tool) {
        return !featuredIdMap[tool.id];
      });

      return {
        key: bucket.key,
        title: bucket.title,
        description: bucket.description,
        theme: bucket.theme,
        productBucket: !!bucket.productBucket,
        registryCount: allTools.length,
        featuredCount: featuredTools.length,
        allTools: allTools,
        featuredTools: featuredTools,
        remainingTools: remainingTools,
        sampleLabels: featuredTools.slice(0, 4).map(function (tool) {
          return tool.label;
        })
      };
    });
  }

  function resolveProductSurfaces() {
    var registryMap = buildRegistryMap();
    var bucketMap = {};

    resolveBuckets().forEach(function (bucket) {
      bucketMap[bucket.key] = bucket;
    });

    return PRODUCT_SURFACES.map(function (surface) {
      var registryTool = surface.registryId ? registryMap[surface.registryId] : null;
      var poweredBuckets = (surface.bucketKeys || []).map(function (key) {
        return bucketMap[key];
      }).filter(Boolean);

      var poweredToolCount = poweredBuckets.reduce(function (total, bucket) {
        return total + bucket.registryCount;
      }, 0);

      return {
        key: surface.key,
        title: surface.title,
        href: surface.href,
        summary: surface.summary,
        productType: surface.productType,
        accent: surface.accent,
        icon: surface.icon,
        registryTool: registryTool ? decorateTool(registryTool) : null,
        poweredBuckets: poweredBuckets.map(function (bucket) {
          return {
            key: bucket.key,
            title: bucket.title,
            registryCount: bucket.registryCount
          };
        }),
        poweredToolCount: poweredToolCount
      };
    });
  }

  function auditTaxonomy() {
    var registryTools = getCreativeRegistryTools();
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

  function getOverview() {
    var buckets = resolveBuckets();
    var surfaces = resolveProductSurfaces();
    var productBucketCount = buckets.reduce(function (total, bucket) {
      return total + (bucket.productBucket ? bucket.registryCount : 0);
    }, 0);
    var registryBackedSurfaces = surfaces.filter(function (surface) {
      return !!surface.registryTool;
    }).length;

    return {
      registryCount: getCreativeRegistryTools().length,
      bucketCount: buckets.length,
      productSurfaceCount: surfaces.length,
      productBucketCount: productBucketCount,
      standardToolCount: getCreativeRegistryTools().length - productBucketCount,
      registryBackedSurfaceCount: registryBackedSurfaces,
      offRegistrySurfaceCount: surfaces.length - registryBackedSurfaces
    };
  }

  function getBucket(key) {
    var buckets = resolveBuckets();
    for (var i = 0; i < buckets.length; i++) {
      if (buckets[i].key === key) return buckets[i];
    }
    return null;
  }

  window.AfroCreative = {
    getRegistryTools: getCreativeRegistryTools,
    getRegistryCount: function () {
      return getCreativeRegistryTools().length;
    },
    getToolDisplay: decorateTool,
    getBuckets: resolveBuckets,
    getBucket: getBucket,
    getProductSurfaces: resolveProductSurfaces,
    getOverview: getOverview,
    auditTaxonomy: auditTaxonomy
  };
})();

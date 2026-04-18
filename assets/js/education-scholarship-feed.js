(function (globalRoot, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(null);
    return;
  }

  globalRoot.AfroScholarshipFeed = factory(globalRoot);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  var CACHE_KEY = 'afroedu-scholarship-feed-cache-v1';
  var FALLBACK_SCHOLARSHIPS = [
    {
      name: 'Chevening Scholarship',
      provider: 'UK Government (FCDO)',
      levels: ['masters'],
      destinations: ['uk'],
      fields: ['any'],
      funding: 'full',
      description: 'Fully funded master\'s in the UK. Covers tuition, living, flights, and visa.',
      min_gpa_4: 3.0,
      min_gpa_5: 3.5,
      min_ielts: 6.5,
      deadline_text: 'Nov (annual)',
      info_url: 'https://www.chevening.org'
    },
    {
      name: 'Rhodes Scholarship',
      provider: 'Rhodes Trust',
      levels: ['masters', 'phd'],
      destinations: ['uk'],
      fields: ['any'],
      funding: 'full',
      description: 'Fully funded postgraduate study at Oxford, including dedicated African constituencies.',
      min_gpa_4: 3.7,
      min_gpa_5: 4.5,
      min_ielts: 7.0,
      deadline_text: 'Jul-Oct',
      info_url: 'https://www.rhodeshouse.ox.ac.uk'
    },
    {
      name: 'Gates Cambridge Scholarship',
      provider: 'Gates Foundation',
      levels: ['masters', 'phd'],
      destinations: ['uk'],
      fields: ['any'],
      funding: 'full',
      description: 'Full-cost scholarship for postgraduate study at the University of Cambridge.',
      min_gpa_4: 3.7,
      min_gpa_5: 4.5,
      min_ielts: 7.5,
      deadline_text: 'Oct-Dec',
      info_url: 'https://www.gatescambridge.org'
    },
    {
      name: 'Fulbright Foreign Student Program',
      provider: 'US Department of State',
      levels: ['masters', 'phd'],
      destinations: ['us'],
      fields: ['any'],
      funding: 'full',
      description: 'Graduate study in the United States with tuition, living, flights, and insurance support.',
      min_gpa_4: 3.0,
      min_gpa_5: 3.5,
      min_ielts: 6.5,
      deadline_text: 'Feb-Oct',
      info_url: 'https://foreign.fulbrightonline.org'
    },
    {
      name: 'DAAD Scholarship',
      provider: 'German Academic Exchange Service',
      levels: ['masters', 'phd', 'postdoc'],
      destinations: ['eu'],
      fields: ['any'],
      funding: 'full',
      description: 'Multiple German scholarship programmes covering tuition and living support.',
      min_gpa_4: 3.0,
      min_gpa_5: 3.5,
      min_ielts: 6.0,
      deadline_text: 'Oct-Nov',
      info_url: 'https://www.daad.de'
    },
    {
      name: 'Erasmus Mundus Joint Masters',
      provider: 'European Commission',
      levels: ['masters'],
      destinations: ['eu'],
      fields: ['stem', 'arts', 'any'],
      funding: 'full',
      description: 'Joint European master\'s routes with tuition, living, and travel support.',
      min_gpa_4: 3.0,
      min_gpa_5: 3.5,
      min_ielts: 6.5,
      deadline_text: 'Jan-Feb',
      info_url: 'https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus'
    },
    {
      name: 'Mastercard Foundation Scholars',
      provider: 'Mastercard Foundation',
      levels: ['undergrad', 'masters'],
      destinations: ['global'],
      fields: ['any'],
      funding: 'full',
      description: 'Partner-university scholarship routes for economically disadvantaged African students.',
      min_gpa_4: 3.0,
      min_gpa_5: 3.5,
      min_ielts: 6.0,
      deadline_text: 'Varies',
      info_url: 'https://mastercardfdn.org/all/scholars'
    },
    {
      name: 'Commonwealth Scholarship',
      provider: 'Commonwealth Secretariat',
      levels: ['masters', 'phd'],
      destinations: ['uk'],
      fields: ['any'],
      funding: 'full',
      description: 'Commonwealth-funded postgraduate study routes for eligible African countries.',
      min_gpa_4: 3.0,
      min_gpa_5: 3.5,
      min_ielts: 6.5,
      deadline_text: 'Dec',
      info_url: 'https://cscuk.fcdo.gov.uk'
    },
    {
      name: 'Turkish Government Scholarship',
      provider: 'Republic of Turkey',
      levels: ['undergrad', 'masters', 'phd'],
      destinations: ['eu'],
      fields: ['any'],
      funding: 'full',
      description: 'Government-funded study in Turkey with relatively broad eligibility and coverage.',
      min_gpa_4: 2.5,
      min_gpa_5: 3.0,
      min_ielts: null,
      deadline_text: 'Jan-Feb',
      info_url: 'https://turkiyeburslari.gov.tr'
    },
    {
      name: 'Hungarian Government Scholarship',
      provider: 'Tempus Public Foundation',
      levels: ['undergrad', 'masters', 'phd'],
      destinations: ['eu'],
      fields: ['any'],
      funding: 'full',
      description: 'Stipendium Hungaricum routes covering tuition and a student stipend.',
      min_gpa_4: 2.5,
      min_gpa_5: 3.0,
      min_ielts: 5.5,
      deadline_text: 'Jan',
      info_url: 'https://stipendiumhungaricum.hu'
    }
  ];

  function safeRead(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function safeWrite(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      /* ignore cache write failures */
    }
  }

  function cloneScholarships(list) {
    return (list || []).map(function (item) {
      return Object.assign({}, item);
    });
  }

  function formatTimestamp(timestamp) {
    var date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'an unknown time';
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function dispatchFeedEvent(detail) {
    if (!root || typeof root.dispatchEvent !== 'function' || typeof root.CustomEvent !== 'function') return;
    root.dispatchEvent(new CustomEvent('afroedu:scholarship-feed-updated', { detail: detail || {} }));
  }

  function buildMeta(mode, scholarships, options) {
    var settings = options || {};
    var cachedAt = settings.cachedAt || null;
    var stale = !!settings.stale;
    var isDegraded = mode === 'fallback' || stale;
    var tone = isDegraded ? 'warn' : 'good';
    var label = 'Live feed';
    var message = 'Live scholarship feed loaded.';

    if (mode === 'cache') {
      label = 'Cached feed';
      message = stale
        ? 'Live scholarship feed is unavailable. Showing the last successful sync' + (cachedAt ? ' from ' + formatTimestamp(cachedAt) : '') + '.'
        : 'Showing the latest cached scholarship snapshot' + (cachedAt ? ' from ' + formatTimestamp(cachedAt) : '') + '.';
    } else if (mode === 'fallback') {
      label = 'Curated fallback';
      message = 'Live scholarship feed is unavailable. Showing a narrower curated backup dataset instead.';
    }

    return {
      mode: mode,
      label: label,
      message: message,
      tone: tone,
      count: scholarships.length,
      cachedAt: cachedAt,
      updatedLabel: cachedAt ? formatTimestamp(cachedAt) : '',
      isDegraded: isDegraded,
      stale: stale,
      error: settings.error ? String(settings.error) : ''
    };
  }

  function readCachedFeed() {
    var cached = safeRead(CACHE_KEY, null);
    if (!cached || !Array.isArray(cached.scholarships) || !cached.scholarships.length) {
      return null;
    }
    return {
      savedAt: cached.savedAt || null,
      scholarships: cloneScholarships(cached.scholarships)
    };
  }

  function cacheLiveFeed(scholarships, savedAt) {
    safeWrite(CACHE_KEY, {
      savedAt: savedAt || Date.now(),
      scholarships: cloneScholarships(scholarships)
    });
  }

  function normalizeMode(data) {
    var mode = data && typeof data.mode === 'string' ? String(data.mode).toLowerCase() : '';
    if (mode === 'fallback') return 'fallback';
    if (mode === 'cache' || mode === 'cached') return 'cache';
    if (data && data.stale) return 'cache';
    return 'live';
  }

  function resolveServerFeed(data) {
    var mode = normalizeMode(data);
    var scholarships = Array.isArray(data && data.scholarships)
      ? cloneScholarships(data.scholarships)
      : [];
    var cachedAt = data && (data.cachedAt || data.timestamp || data.updatedAt || data.fetchedAt || data.syncedAt) || null;

    if (mode === 'fallback' && !scholarships.length) {
      scholarships = cloneScholarships(FALLBACK_SCHOLARSHIPS);
    }

    if (!scholarships.length) {
      throw new Error('empty scholarship feed');
    }

    return {
      scholarships: scholarships,
      meta: buildMeta(mode, scholarships, {
        cachedAt: cachedAt,
        stale: !!(data && data.stale),
        error: data && data.error ? data.error : ''
      }),
      shouldCache: mode !== 'fallback',
      cacheTimestamp: cachedAt || Date.now()
    };
  }

  function resolveDegradedFeed(error) {
    var cached = readCachedFeed();
    if (cached) {
      var cachedMeta = buildMeta('cache', cached.scholarships, {
        cachedAt: cached.savedAt,
        error: error
      });
      dispatchFeedEvent(cachedMeta);
      return {
        scholarships: cached.scholarships,
        meta: cachedMeta
      };
    }

    var fallback = cloneScholarships(FALLBACK_SCHOLARSHIPS);
    var fallbackMeta = buildMeta('fallback', fallback, {
      error: error
    });
    dispatchFeedEvent(fallbackMeta);
    return {
      scholarships: fallback,
      meta: fallbackMeta
    };
  }

  function load(options) {
    var settings = options || {};
    var endpoint = settings.endpoint || '/api/scholarships';

    return fetch(endpoint).then(function (response) {
      if (!response.ok) {
        throw new Error('scholarship feed unavailable (' + response.status + ')');
      }
      return response.json();
    }).then(function (data) {
      var resolved = resolveServerFeed(data);
      if (resolved.shouldCache) {
        cacheLiveFeed(resolved.scholarships, resolved.cacheTimestamp);
      }
      dispatchFeedEvent(resolved.meta);

      return { scholarships: resolved.scholarships, meta: resolved.meta };
    }).catch(function (error) {
      return resolveDegradedFeed(error && error.message ? error.message : error);
    });
  }

  return {
    CACHE_KEY: CACHE_KEY,
    load: load,
    getFallbackScholarships: function () {
      return cloneScholarships(FALLBACK_SCHOLARSHIPS);
    },
    getCachedFeed: readCachedFeed
  };
});

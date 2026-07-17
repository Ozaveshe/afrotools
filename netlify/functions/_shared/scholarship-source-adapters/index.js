const DEFAULT_USER_AGENT = 'AfroToolsScholarshipBot/1.0 (+https://afrotools.com/tools/scholarship-finder/)';

const ADAPTER_VERSION = '2026-05-22';

const DISCOVERY_ONLY_ADAPTERS = new Set([
  'bachelorsportal_sitemap_discovery',
  'studyportals_sitemap_discovery'
]);

const REFERENCE_ONLY_ADAPTERS = new Set([
  'findaphd_reference_only',
  'manual_reference_only'
]);

function ensureObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizeRulePath(pathname) {
  return String(pathname || '/').trim() || '/';
}

function parseRobots(robotsText) {
  const groups = [];
  let current = null;

  String(robotsText || '').split(/\r?\n/).forEach(function (line) {
    const clean = line.split('#')[0].trim();
    if (!clean) return;
    const parts = clean.split(':');
    const key = String(parts.shift() || '').trim().toLowerCase();
    const value = parts.join(':').trim();
    if (!key) return;

    if (key === 'user-agent') {
      current = { userAgents: [value.toLowerCase()], rules: [] };
      groups.push(current);
      return;
    }

    if (!current) return;
    if (key === 'allow' || key === 'disallow') {
      current.rules.push({ type: key, path: normalizeRulePath(value) });
    }
  });

  return groups;
}

function ruleMatches(rulePath, pathname) {
  if (!rulePath) return false;
  if (rulePath === '/') return true;
  const prefix = rulePath.replace(/\*.*$/, '');
  return pathname.indexOf(prefix || rulePath) === 0;
}

function robotsAllows(robotsText, targetUrl, userAgent) {
  const pathname = new URL(targetUrl).pathname || '/';
  const agent = String(userAgent || DEFAULT_USER_AGENT).toLowerCase();
  const groups = parseRobots(robotsText).filter(function (group) {
    return group.userAgents.indexOf('*') !== -1 || group.userAgents.some(function (value) {
      return agent.indexOf(value) !== -1;
    });
  });

  let winning = null;
  groups.forEach(function (group) {
    group.rules.forEach(function (rule) {
      if (!ruleMatches(rule.path, pathname)) return;
      if (!winning || rule.path.length > winning.path.length) {
        winning = rule;
      }
    });
  });

  return !winning || winning.type !== 'disallow';
}

async function fetchRobots(url, options) {
  const settings = options || {};
  const target = new URL(url);
  const robotsUrl = target.origin + '/robots.txt';
  const response = await fetch(robotsUrl, {
    headers: {
      'User-Agent': settings.userAgent || DEFAULT_USER_AGENT,
      Accept: 'text/plain,*/*;q=0.8'
    }
  });
  const text = await response.text();
  return {
    robotsUrl: robotsUrl,
    status: response.status,
    ok: response.ok,
    body: text
  };
}

async function checkRobots(url, options) {
  const robots = await fetchRobots(url, options);
  return {
    robotsUrl: robots.robotsUrl,
    robotsStatus: robots.status,
    robotsAllowed: robots.ok ? robotsAllows(robots.body, url, options && options.userAgent) : false,
    robotsBody: robots.body
  };
}

async function fetchSourceItemsWithAdapter(source, options) {
  const parserKey = String(source && source.parser_key || '').trim();
  const crawlPolicy = ensureObject(source && source.crawl_policy);
  const adapterKey = String(source && source.adapter_key || parserKey || '').trim();

  if (DISCOVERY_ONLY_ADAPTERS.has(parserKey)) {
    return {
      rawItems: [],
      manualReview: true,
      warning: 'discovery_only_source: canonical provider review required before row creation',
      adapter: {
        adapter_key: adapterKey || 'studyportals_discovery',
        adapter_version: ADAPTER_VERSION,
        crawl_policy: crawlPolicy,
        robots_allowed: source && source.robots_allowed === true
      }
    };
  }

  if (REFERENCE_ONLY_ADAPTERS.has(parserKey)) {
    return {
      rawItems: [],
      manualReview: true,
      warning: 'reference_only_source: permission or official provider URL required before automated ingestion',
      adapter: {
        adapter_key: adapterKey || 'reference_only',
        adapter_version: ADAPTER_VERSION,
        crawl_policy: crawlPolicy,
        robots_allowed: source && source.robots_allowed === true
      }
    };
  }

  return null;
}

module.exports = {
  ADAPTER_VERSION: ADAPTER_VERSION,
  DEFAULT_USER_AGENT: DEFAULT_USER_AGENT,
  checkRobots: checkRobots,
  fetchSourceItemsWithAdapter: fetchSourceItemsWithAdapter,
  parseRobots: parseRobots,
  robotsAllows: robotsAllows
};

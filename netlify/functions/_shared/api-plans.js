var API_PLAN_LIMITS = {
  free: {
    tier: 'free',
    label: 'Free API',
    day: 100,
    month: 3000,
  },
  growth: {
    tier: 'growth',
    label: 'API Growth',
    day: 10000,
    month: 300000,
  },
  starter: {
    tier: 'growth',
    label: 'API Growth',
    day: 10000,
    month: 300000,
  },
  pro: {
    tier: 'pro',
    label: 'API Pro',
    day: 100000,
    month: 3000000,
  },
  enterprise: {
    tier: 'enterprise',
    label: 'Enterprise/custom',
    day: -1,
    month: -1,
  },
};

var API_TIER_RANK = {
  free: 0,
  growth: 1,
  pro: 2,
  enterprise: 3,
};

function normalizeApiTier(tier) {
  var value = String(tier || 'free').toLowerCase().trim();
  if (value === 'starter') return 'growth';
  if (Object.prototype.hasOwnProperty.call(API_TIER_RANK, value)) return value;
  return 'free';
}

function getApiPlanLimit(tier) {
  var normalized = normalizeApiTier(tier);
  return API_PLAN_LIMITS[normalized] || API_PLAN_LIMITS.free;
}

function getApiTierRank(tier) {
  return API_TIER_RANK[normalizeApiTier(tier)] || 0;
}

module.exports = {
  API_PLAN_LIMITS: API_PLAN_LIMITS,
  normalizeApiTier: normalizeApiTier,
  getApiPlanLimit: getApiPlanLimit,
  getApiTierRank: getApiTierRank,
};

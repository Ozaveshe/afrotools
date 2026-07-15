'use strict';

const ENTITLED_TIERS = Object.freeze([
  'pro',
  'premium',
  'team',
  'business',
  'enterprise',
  'admin',
  'lifetime',
  'trialing'
]);
const ENTITLED_TIER_SET = new Set(ENTITLED_TIERS);

function normalizeTier(tier) {
  return String(tier || 'free').trim().toLowerCase() || 'free';
}

function resolveProfileEntitlement(profile, now) {
  const tier = normalizeTier(profile && profile.subscription_tier);
  const expiresAt = profile && profile.subscription_expires_at
    ? String(profile.subscription_expires_at)
    : null;

  if (!ENTITLED_TIER_SET.has(tier)) {
    return { isPro: false, tier, expiresAt, reason: 'tier_not_entitled' };
  }

  if (!expiresAt) {
    return { isPro: true, tier, expiresAt: null, reason: 'active_non_expiring' };
  }

  const expiresAtMs = Date.parse(expiresAt);
  if (Number.isNaN(expiresAtMs)) {
    return { isPro: false, tier, expiresAt, reason: 'invalid_expiry' };
  }

  const nowMs = now == null ? Date.now() : new Date(now).getTime();
  if (!Number.isFinite(nowMs) || expiresAtMs <= nowMs) {
    return { isPro: false, tier, expiresAt, reason: 'expired' };
  }

  return { isPro: true, tier, expiresAt, reason: 'active' };
}

async function resolveUserEntitlement(options) {
  const config = options || {};
  const userId = String(config.userId || '').trim();
  const supabaseUrl = String(config.supabaseUrl || '').replace(/\/+$/, '');
  const serviceKey = String(config.serviceKey || '').trim();
  const fetchImpl = config.fetchImpl || (typeof fetch === 'function' ? fetch : null);

  if (!userId || !supabaseUrl || !serviceKey || !fetchImpl) {
    return { isPro: false, tier: 'free', expiresAt: null, reason: 'lookup_unavailable' };
  }

  const endpoint = supabaseUrl + '/rest/v1/profiles?id=eq.' + encodeURIComponent(userId) +
    '&select=subscription_tier,subscription_expires_at&limit=1';

  try {
    const response = await fetchImpl(endpoint, {
      headers: {
        apikey: serviceKey,
        Authorization: 'Bearer ' + serviceKey
      }
    });

    if (!response.ok) {
      return { isPro: false, tier: 'free', expiresAt: null, reason: 'profile_lookup_failed' };
    }

    const rows = await response.json();
    if (!Array.isArray(rows) || !rows[0]) {
      return { isPro: false, tier: 'free', expiresAt: null, reason: 'profile_missing' };
    }

    return resolveProfileEntitlement(rows[0], config.now);
  } catch (error) {
    return { isPro: false, tier: 'free', expiresAt: null, reason: 'profile_lookup_failed' };
  }
}

module.exports = {
  ENTITLED_TIERS,
  normalizeTier,
  resolveProfileEntitlement,
  resolveUserEntitlement
};

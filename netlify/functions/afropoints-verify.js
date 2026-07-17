const { getAllowedOrigin } = require('./utils/cors');
const {
  SUPABASE_URL,
  SUPABASE_KEY,
  SUBTYPE_CONFIGS,
  getConfirmationBonus,
  getMetricKey,
  getNumericValue,
  publishToDomain,
  sbRequest
} = require('./_shared/market-data');

function corsHeaders(event) {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin'
  };
}

function reply(statusCode, body, headers) {
  return { statusCode, headers, body: JSON.stringify(body) };
}

function calculateRank(totalEarned, trustScore) {
  if (totalEarned >= 10000 && trustScore >= 90) return 'legend';
  if (totalEarned >= 2000 && trustScore >= 85) return 'expert';
  if (totalEarned >= 500 && trustScore >= 70) return 'trusted';
  if (totalEarned >= 100) return 'contributor';
  return 'newcomer';
}

function toSubmission(contribution) {
  return {
    subtype: contribution.subtype || contribution.data_category,
    vertical: contribution.vertical,
    country_code: contribution.country_code,
    city: contribution.city,
    neighborhood: contribution.neighborhood,
    observed_at: contribution.observed_at || contribution.submitted_at,
    source_type: contribution.source_type,
    proof_url: contribution.proof_url,
    photo_url: contribution.photo_url,
    currency_code: contribution.currency_code,
    unit: contribution.unit,
    quantity: contribution.quantity,
    provider_name: contribution.provider_name,
    merchant_name: contribution.merchant_name,
    route_name: contribution.route_name,
    business_context: contribution.business_context,
    payload: contribution.payload || {}
  };
}

function median(values) {
  if (!values.length) return null;
  const sorted = values.slice().sort(function (left, right) { return left - right; });
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

async function fetchProfile(userId) {
  const rows = await sbRequest('GET', 'points_profiles?user_id=eq.' + userId);
  return Array.isArray(rows) && rows[0]
    ? rows[0]
    : {
        user_id: userId,
        total_earned: 0,
        total_spent: 0,
        current_balance: 0,
        contributions_count: 0,
        confirmations_count: 0,
        trust_score: 50,
        current_streak: 0,
        longest_streak: 0,
        rank: 'newcomer',
        badges: []
      };
}

async function saveProfile(profile) {
  const payload = {
    total_earned: profile.total_earned || 0,
    total_spent: profile.total_spent || 0,
    current_balance: profile.current_balance || 0,
    contributions_count: profile.contributions_count || 0,
    confirmations_count: profile.confirmations_count || 0,
    trust_score: profile.trust_score || 0,
    current_streak: profile.current_streak || 0,
    longest_streak: profile.longest_streak || 0,
    rank: profile.rank || 'newcomer',
    badges: profile.badges || [],
    primary_country: profile.primary_country || null,
    primary_city: profile.primary_city || null,
    contributor_persona: profile.contributor_persona || null,
    regular_countries: profile.regular_countries || [],
    regular_cities: profile.regular_cities || [],
    regular_neighborhoods: profile.regular_neighborhoods || [],
    regular_routes: profile.regular_routes || [],
    coverage_categories: profile.coverage_categories || [],
    submission_frequency: profile.submission_frequency || null,
    payout_preference: profile.payout_preference || null,
    proof_comfort: profile.proof_comfort || null,
    onboarding_completed_at: profile.onboarding_completed_at || null,
    last_submission_at: profile.last_submission_at || null,
    updated_at: new Date().toISOString()
  };

  const existing = await sbRequest('GET', 'points_profiles?user_id=eq.' + profile.user_id);
  if (Array.isArray(existing) && existing[0]) {
    await sbRequest('PATCH', 'points_profiles?user_id=eq.' + profile.user_id, payload, {
      Prefer: 'return=minimal'
    });
    return;
  }

  await sbRequest('POST', 'points_profiles', {
    user_id: profile.user_id,
    created_at: new Date().toISOString(),
    ...payload
  }, {
    Prefer: 'return=minimal'
  });
}

async function insertConfidenceRecord(contribution, score, corroborationCount) {
  const submission = toSubmission(contribution);
  const sourceName = contribution.provider_name || contribution.merchant_name || contribution.city;
  const numericValue = getNumericValue(submission);
  if (numericValue === null || numericValue === undefined) return;

  await sbRequest('POST', 'data_confidence', {
    category: submission.vertical || submission.subtype,
    country_code: submission.country_code,
    metric: getMetricKey(submission),
    value: numericValue,
    confidence: Math.max(0.01, Math.min(1, score / 100)),
    source_type: submission.source_type || 'crowd',
    source_name: sourceName,
    verified_by_count: corroborationCount,
    flagged: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, {
    Prefer: 'return=minimal'
  });
}

async function rewardConfirmedContribution(contribution, corroborationCount, score) {
  const subtype = contribution.subtype || contribution.data_category;
  const bonus = getConfirmationBonus(subtype);
  const confirmedAt = new Date().toISOString();

  await sbRequest('PATCH', 'contributions?id=eq.' + contribution.id, {
    status: 'confirmed',
    confidence_score: score,
    confirmed_by_count: corroborationCount,
    bonus_awarded: bonus > 0,
    confirmed_at: confirmedAt
  }, {
    Prefer: 'return=minimal'
  });

  if (bonus > 0) {
    await sbRequest('POST', 'points_ledger', {
      user_id: contribution.user_id,
      amount: bonus,
      reason: 'confirmation_bonus',
      contribution_id: contribution.id,
      description: 'Consensus confirmed: ' + subtype.replace(/_/g, ' ')
    }, { Prefer: 'return=minimal' });
  }

  const profile = await fetchProfile(contribution.user_id);
  profile.total_earned = Number(profile.total_earned || 0) + bonus;
  profile.current_balance = Number(profile.current_balance || 0) + bonus;
  profile.confirmations_count = Number(profile.confirmations_count || 0) + 1;
  profile.trust_score = Math.min(100, Number(profile.trust_score || 50) + 1);
  profile.rank = calculateRank(Number(profile.total_earned || 0), Number(profile.trust_score || 0));
  await saveProfile(profile);

  await insertConfidenceRecord(contribution, score, corroborationCount);
  await publishToDomain(toSubmission(contribution), contribution, 'verified');
}

async function penalizeFlaggedContribution(contribution) {
  await sbRequest('PATCH', 'contributions?id=eq.' + contribution.id, {
    status: 'flagged',
    review_required: true,
    review_reason: 'consensus_outlier'
  }, {
    Prefer: 'return=minimal'
  });

  const profile = await fetchProfile(contribution.user_id);
  profile.trust_score = Math.max(0, Number(profile.trust_score || 50) - 5);
  profile.rank = calculateRank(Number(profile.total_earned || 0), Number(profile.trust_score || 0));
  await saveProfile(profile);
}

function buildGroupKey(contribution) {
  return [
    contribution.country_code,
    String(contribution.city || '').toLowerCase(),
    getMetricKey(toSubmission(contribution))
  ].join('|');
}

exports.handler = async function (event) {
  const headers = corsHeaders(event);

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Method not allowed' }, headers);
  if (!SUPABASE_KEY) return reply(500, { error: 'Server not configured' }, headers);

  try {
    let confirmed = 0;
    let flagged = 0;

    for (const subtype of Object.keys(SUBTYPE_CONFIGS)) {
      const config = SUBTYPE_CONFIGS[subtype];
      const cutoff = new Date(Date.now() - config.windowDays * 86400000).toISOString();
      const pending = await sbRequest(
        'GET',
        'contributions?status=eq.pending&data_category=eq.' + encodeURIComponent(subtype) + '&submitted_at=gte.' + cutoff + '&order=country_code,city&select=*'
      );

      if (!Array.isArray(pending) || pending.length === 0) continue;

      const groups = {};
      pending.forEach(function (entry) {
        const key = buildGroupKey(entry);
        if (!groups[key]) groups[key] = [];
        groups[key].push(entry);
      });

      for (const key of Object.keys(groups)) {
        const uniqueByUser = {};
        const unique = groups[key].filter(function (entry) {
          if (uniqueByUser[entry.user_id]) return false;
          uniqueByUser[entry.user_id] = true;
          return true;
        });

        if (unique.length < config.consensusMin) continue;

        const values = unique
          .map(function (entry) { return getNumericValue(toSubmission(entry)); })
          .filter(function (value) { return value !== null && value > 0; });

        if (values.length < config.consensusMin) continue;

        const med = median(values);
        if (!med) continue;

        const withinThreshold = unique.filter(function (entry) {
          const value = getNumericValue(toSubmission(entry));
          if (!value) return false;
          if (config.thresholdPct === 0) return true;
          return Math.abs(value - med) / med <= config.thresholdPct;
        });

        if (withinThreshold.length < config.consensusMin) continue;

        const score = Math.min(100, Math.round((withinThreshold.length / unique.length) * 100));

        for (const entry of withinThreshold) {
          await rewardConfirmedContribution(entry, withinThreshold.length, score);
          confirmed += 1;
        }

        const outliers = unique.filter(function (entry) {
          const value = getNumericValue(toSubmission(entry));
          return value && Math.abs(value - med) / med > 0.5;
        });

        for (const entry of outliers) {
          await penalizeFlaggedContribution(entry);
          flagged += 1;
        }
      }
    }

    return reply(200, { success: true, confirmed, flagged }, headers);
  } catch (error) {
    console.error('AfroPoints verify error:', error);
    return reply(500, { error: 'Internal server error' }, headers);
  }
};

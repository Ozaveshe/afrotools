const { getAllowedOrigin } = require('./utils/cors');
const {
  SUPABASE_URL,
  SUPABASE_KEY,
  cleanText,
  sbRequest,
  normalizeSubmission,
  getSubmissionPoints,
  getRecentBaseline,
  calculateConfidence,
  getReviewReason,
  buildContributionRecord,
  buildDomainRecord,
  getMetricKey,
  getNumericValue
} = require('./_shared/market-data');

const BADGE_DEFS = {
  first_blood: { name: 'First Blood', bonus: 10 },
  streak_7: { name: 'Week Warrior', bonus: 0 },
  streak_30: { name: 'Monthly Machine', bonus: 0 }
};

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

function mergeUnique(existing, nextValue) {
  const values = Array.isArray(existing) ? existing.slice() : [];
  if (!nextValue) return values;
  if (!values.includes(nextValue)) values.push(nextValue);
  return values;
}

function mergeUniqueMany(existing, valuesToAdd) {
  let values = Array.isArray(existing) ? existing.slice() : [];
  (valuesToAdd || []).forEach(function (value) {
    values = mergeUnique(values, value);
  });
  return values;
}

function mergeBadges(existing, badgeIds) {
  return mergeUniqueMany(existing, badgeIds);
}

function calculateRank(totalEarned, trustScore) {
  if (totalEarned >= 10000 && trustScore >= 90) return 'legend';
  if (totalEarned >= 2000 && trustScore >= 85) return 'expert';
  if (totalEarned >= 500 && trustScore >= 70) return 'trusted';
  if (totalEarned >= 100) return 'contributor';
  return 'newcomer';
}

function validateContributionGate(profile, submission) {
  if (!profile || !profile.onboarding_completed_at) {
    return 'Set up your contributor profile before submitting AfroPoints data.';
  }

  const coverage = Array.isArray(profile.coverage_categories) ? profile.coverage_categories : [];
  if (coverage.length === 0) {
    return 'Choose the data categories you can cover before submitting.';
  }

  if (!coverage.includes(submission.subtype)) {
    return 'This data category is outside your verified contributor coverage. Update your AfroPoints profile to add it.';
  }

  const countries = Array.isArray(profile.regular_countries)
    ? profile.regular_countries.map(function (country) {
      return cleanText(country) ? cleanText(country).toUpperCase() : null;
    }).filter(Boolean)
    : [];
  if (countries.length === 0) {
    return 'Choose the countries you can cover before submitting.';
  }

  if (!countries.includes(String(submission.country_code || '').toUpperCase())) {
    return 'This country is outside your contributor coverage. Update your AfroPoints profile before submitting here.';
  }

  return null;
}

async function getUser(event) {
  const auth = event.headers?.authorization || event.headers?.Authorization || '';
  if (!auth.startsWith('Bearer ')) return null;

  const token = auth.slice(7);
  try {
    const response = await fetch(SUPABASE_URL + '/auth/v1/user', {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: 'Bearer ' + token
      }
    });
    if (!response.ok) return null;
    const user = await response.json();
    return { id: user.id, token };
  } catch {
    return null;
  }
}

async function fetchProfile(userId) {
  const rows = await sbRequest('GET', 'points_profiles?user_id=eq.' + userId);
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function addLedgerEntry(entry) {
  return sbRequest('POST', 'points_ledger', entry, { Prefer: 'return=minimal' });
}

async function ensureDailyCapacity(userId, subtype) {
  const today = new Date().toISOString().slice(0, 10);
  const path = [
    'contributions?select=id',
    'user_id=eq.' + userId,
    'data_category=eq.' + encodeURIComponent(subtype),
    'submitted_at=gte.' + today + 'T00:00:00Z'
  ].join('&');
  const rows = await sbRequest('GET', path);
  return !Array.isArray(rows) || rows.length < 20;
}

async function queueReview(submission, baseline, contributionId, reason) {
  const changePct = baseline.changePct === null || baseline.changePct === undefined ? null : Number(baseline.changePct.toFixed(2));
  return sbRequest('POST', 'review_queue', {
    category: submission.subtype,
    country_code: submission.country_code,
    metric: getMetricKey(submission),
    scraped_value: getNumericValue(submission),
    previous_value: baseline.baselineValue,
    change_pct: changePct,
    reason,
    status: 'pending',
    notes: 'AfroPoints contribution ' + contributionId + ' requires manual review'
  }, { Prefer: 'return=minimal' });
}

function getProofBonus(submission) {
  return submission.proof_url || submission.photo_url ? 2 : 0;
}

exports.handler = async function (event) {
  const headers = corsHeaders(event);

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Method not allowed' }, headers);
  if (!SUPABASE_KEY) return reply(500, { error: 'Server not configured' }, headers);

  const user = await getUser(event);
  if (!user) return reply(401, { error: 'Authentication required' }, headers);

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return reply(400, { error: 'Invalid JSON' }, headers);
  }

  const normalized = normalizeSubmission(body);
  if (normalized.error) return reply(400, { error: normalized.error }, headers);

  try {
    const submission = normalized.submission;
    const existingProfile = await fetchProfile(user.id);
    const gateError = validateContributionGate(existingProfile, submission);
    if (gateError) return reply(403, { error: gateError, action: 'profile_required' }, headers);

    const hasCapacity = await ensureDailyCapacity(user.id, submission.subtype);
    if (!hasCapacity) {
      return reply(429, { error: 'Daily limit reached for this category (20/day)' }, headers);
    }

    const baseline = await getRecentBaseline(submission, 40);
    const reviewReason = getReviewReason(submission, baseline);
    const confidenceScore = calculateConfidence(submission, existingProfile, baseline);

    const contributionRecord = buildContributionRecord(user.id, submission, confidenceScore, reviewReason);
    const inserted = await sbRequest('POST', 'contributions', contributionRecord, {
      Prefer: 'return=representation'
    });

    if (!Array.isArray(inserted) || !inserted[0]) {
      return reply(500, { error: 'Failed to save contribution' }, headers);
    }

    const savedContribution = inserted[0];
    const domainRecord = buildDomainRecord(submission, user.id, savedContribution.id, confidenceScore, reviewReason);

    if (domainRecord) {
      const table = require('./_shared/market-data').getSubtypeConfig(submission.subtype)?.table;
      if (table) {
        await sbRequest('POST', table, domainRecord, { Prefer: 'return=minimal' });
      }
    }

    if (reviewReason) {
      await queueReview(submission, baseline, savedContribution.id, reviewReason);
    }

    const submissionPoints = getSubmissionPoints(submission.subtype);
    const proofBonus = getProofBonus(submission);
    const submissionTotal = submissionPoints + proofBonus;

    await addLedgerEntry({
      user_id: user.id,
      amount: submissionTotal,
      reason: 'submission',
      contribution_id: savedContribution.id,
      description: submission.subtype.replace(/_/g, ' ') + ' in ' + submission.city + ', ' + submission.country_code
    });

    const previousEarned = existingProfile ? Number(existingProfile.total_earned || 0) : 0;
    const previousBalance = existingProfile ? Number(existingProfile.current_balance || 0) : 0;
    const previousCount = existingProfile ? Number(existingProfile.contributions_count || 0) : 0;
    const previousStreak = existingProfile ? Number(existingProfile.current_streak || 0) : 0;
    const trustScore = Number(existingProfile?.trust_score || 50);
    const previousBadges = Array.isArray(existingProfile?.badges) ? existingProfile.badges : [];

    const nextCount = previousCount + 1;

    let nextStreak = previousStreak;
    if (existingProfile?.last_submission_at) {
      const hoursSinceLastSubmission = (Date.now() - new Date(existingProfile.last_submission_at).getTime()) / 3600000;
      if (hoursSinceLastSubmission > 24 && hoursSinceLastSubmission <= 48) nextStreak += 1;
      else if (hoursSinceLastSubmission > 48) nextStreak = 1;
    } else {
      nextStreak = 1;
    }

    const longestStreak = Math.max(Number(existingProfile?.longest_streak || 0), nextStreak);
    let streakBonus = 0;
    if (nextStreak >= 30 && previousStreak < 30) streakBonus = 100;
    else if (nextStreak >= 7 && previousStreak < 7) streakBonus = 20;
    else if (nextStreak >= 3 && previousStreak < 3) streakBonus = 5;

    if (streakBonus > 0) {
      await addLedgerEntry({
        user_id: user.id,
        amount: streakBonus,
        reason: 'streak_bonus',
        description: nextStreak + '-day streak bonus'
      });
    }

    const badgeAwards = [];
    let badgeBonus = 0;

    if (nextCount === 1 && !previousBadges.includes('first_blood')) {
      badgeAwards.push({ id: 'first_blood', name: BADGE_DEFS.first_blood.name });
      badgeBonus += BADGE_DEFS.first_blood.bonus;
    }
    if (nextStreak >= 7 && previousStreak < 7 && !previousBadges.includes('streak_7')) {
      badgeAwards.push({ id: 'streak_7', name: BADGE_DEFS.streak_7.name });
    }
    if (nextStreak >= 30 && previousStreak < 30 && !previousBadges.includes('streak_30')) {
      badgeAwards.push({ id: 'streak_30', name: BADGE_DEFS.streak_30.name });
    }

    if (badgeBonus > 0) {
      await addLedgerEntry({
        user_id: user.id,
        amount: badgeBonus,
        reason: 'badge_bonus',
        contribution_id: savedContribution.id,
        description: 'Badge unlocked: ' + badgeAwards.map(function (badge) { return badge.name; }).join(', ')
      });
    }

    const finalEarned = previousEarned + submissionTotal + streakBonus + badgeBonus;
    const finalBalance = previousBalance + submissionTotal + streakBonus + badgeBonus;
    const nextBadges = mergeBadges(previousBadges, badgeAwards.map(function (badge) { return badge.id; }));
    const nextRank = calculateRank(finalEarned, trustScore);

    const profilePayload = {
      user_id: user.id,
      total_earned: finalEarned,
      current_balance: finalBalance,
      contributions_count: nextCount,
      current_streak: nextStreak,
      longest_streak: longestStreak,
      rank: nextRank,
      badges: nextBadges,
      primary_country: submission.country_code,
      primary_city: submission.city,
      coverage_categories: mergeUnique(Array.isArray(existingProfile?.coverage_categories) ? existingProfile.coverage_categories : [], submission.subtype),
      regular_countries: mergeUnique(Array.isArray(existingProfile?.regular_countries) ? existingProfile.regular_countries : [], submission.country_code),
      regular_cities: mergeUnique(Array.isArray(existingProfile?.regular_cities) ? existingProfile.regular_cities : [], submission.city),
      regular_neighborhoods: mergeUnique(Array.isArray(existingProfile?.regular_neighborhoods) ? existingProfile.regular_neighborhoods : [], submission.neighborhood),
      regular_routes: mergeUnique(Array.isArray(existingProfile?.regular_routes) ? existingProfile.regular_routes : [], submission.route_name),
      payout_preference: cleanText(existingProfile?.payout_preference),
      contributor_persona: cleanText(existingProfile?.contributor_persona),
      submission_frequency: cleanText(existingProfile?.submission_frequency),
      proof_comfort: cleanText(existingProfile?.proof_comfort),
      last_submission_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (existingProfile) {
      await sbRequest('PATCH', 'points_profiles?user_id=eq.' + user.id, profilePayload, {
        Prefer: 'return=representation'
      });
    } else {
      await sbRequest('POST', 'points_profiles', {
        ...profilePayload,
        total_spent: 0,
        confirmations_count: 0,
        trust_score: trustScore,
        created_at: new Date().toISOString()
      }, {
        Prefer: 'return=minimal'
      });
    }

    return reply(200, {
      success: true,
      contribution_id: savedContribution.id,
      subtype: submission.subtype,
      vertical: submission.vertical,
      points_awarded: submissionTotal,
      streak_bonus: streakBonus,
      badge_bonus: badgeBonus,
      badges_earned: badgeAwards,
      new_balance: finalBalance,
      rank: nextRank,
      streak: nextStreak,
      confidence_score: confidenceScore,
      review_required: Boolean(reviewReason),
      review_reason: reviewReason,
      baseline_value: baseline.baselineValue,
      change_pct: baseline.changePct
    }, headers);
  } catch (error) {
    console.error('AfroPoints submit error:', error);
    return reply(500, { error: 'Internal server error' }, headers);
  }
};

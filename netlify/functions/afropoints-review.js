const { getAllowedOrigin } = require('./utils/cors');
const {
  SUPABASE_URL,
  SUPABASE_KEY,
  cleanText,
  getConfirmationBonus,
  getMetricKey,
  getNumericValue,
  publishToDomain,
  sbRequest
} = require('./_shared/market-data');

function headers(event) {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin'
  };
}

function reply(statusCode, body, responseHeaders) {
  return { statusCode, headers: responseHeaders, body: JSON.stringify(body) };
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

async function getUser(event) {
  const auth = event.headers?.authorization || event.headers?.Authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  try {
    const res = await fetch(SUPABASE_URL + '/auth/v1/user', {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + token }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function isAdmin(userId) {
  const profiles = await sbRequest('GET', 'profiles?id=eq.' + userId + '&select=role');
  return Array.isArray(profiles) && profiles[0] && profiles[0].role === 'admin';
}

async function getProfile(userId) {
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

async function insertConfidenceRecord(contribution) {
  const submission = toSubmission(contribution);
  const numericValue = getNumericValue(submission);
  if (numericValue === null || numericValue === undefined) return;
  await sbRequest('POST', 'data_confidence', {
    category: submission.vertical || submission.subtype,
    country_code: submission.country_code,
    metric: getMetricKey(submission),
    value: numericValue,
    confidence: Math.max(0.01, Math.min(1, Number(contribution.confidence_score || 70) / 100)),
    source_type: submission.source_type || 'crowd',
    source_name: contribution.provider_name || contribution.merchant_name || contribution.city,
    verified_by_count: Math.max(1, Number(contribution.confirmed_by_count || 1)),
    flagged: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, {
    Prefer: 'return=minimal'
  });
}

async function applySubmissionDecision(userId, body) {
  const contributionId = body.contribution_id || body.id;
  const decision = cleanText(body.decision);
  const notes = cleanText(body.notes);
  const reviewQueueId = cleanText(body.review_queue_id);

  if (!contributionId || !decision) return { status: 400, body: { error: 'Missing contribution_id or decision' } };

  const contributions = await sbRequest('GET', 'contributions?id=eq.' + contributionId + '&select=*');
  if (!Array.isArray(contributions) || !contributions[0]) {
    return { status: 404, body: { error: 'Contribution not found' } };
  }

  const contribution = contributions[0];

  if (decision === 'approve') {
    if (contribution.status !== 'confirmed') {
      const bonus = getConfirmationBonus(contribution.subtype || contribution.data_category);
      await sbRequest('PATCH', 'contributions?id=eq.' + contribution.id, {
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        confirmed_by_count: Math.max(1, Number(contribution.confirmed_by_count || 1)),
        bonus_awarded: bonus > 0,
        review_required: false,
        review_reason: null
      }, { Prefer: 'return=minimal' });

      if (bonus > 0) {
        await sbRequest('POST', 'points_ledger', {
          user_id: contribution.user_id,
          amount: bonus,
          reason: 'confirmation_bonus',
          contribution_id: contribution.id,
          description: 'Manual review confirmed: ' + (contribution.subtype || contribution.data_category)
        }, { Prefer: 'return=minimal' });
      }

      const profile = await getProfile(contribution.user_id);
      profile.total_earned = Number(profile.total_earned || 0) + bonus;
      profile.current_balance = Number(profile.current_balance || 0) + bonus;
      profile.confirmations_count = Number(profile.confirmations_count || 0) + 1;
      profile.trust_score = Math.min(100, Number(profile.trust_score || 50) + 1);
      profile.rank = calculateRank(Number(profile.total_earned || 0), Number(profile.trust_score || 0));
      await saveProfile(profile);
    }

    await publishToDomain(toSubmission(contribution), contribution, 'verified');
    await insertConfidenceRecord(contribution);
  } else if (decision === 'reject') {
    await sbRequest('PATCH', 'contributions?id=eq.' + contribution.id, {
      status: 'rejected',
      review_required: true,
      review_reason: notes || contribution.review_reason || 'review_rejected'
    }, { Prefer: 'return=minimal' });
    await publishToDomain(toSubmission(contribution), contribution, 'rejected');
  } else {
    await sbRequest('PATCH', 'contributions?id=eq.' + contribution.id, {
      status: 'pending_review',
      review_required: true,
      review_reason: notes || contribution.review_reason || 'needs_followup'
    }, { Prefer: 'return=minimal' });
  }

  if (reviewQueueId) {
    await sbRequest('PATCH', 'review_queue?id=eq.' + reviewQueueId, {
      status: decision,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      notes
    }, { Prefer: 'return=minimal' });
  }

  return { status: 200, body: { success: true } };
}

async function applyPayoutDecision(userId, body) {
  const id = body.id;
  const decision = cleanText(body.decision);
  const notes = cleanText(body.notes);
  if (!id || !decision) return { status: 400, body: { error: 'Missing id or decision' } };

  const payload = {
    status: decision,
    processed_at: decision === 'hold' ? null : new Date().toISOString()
  };

  if (notes) {
    payload.payout_details = { reviewer_note: notes };
  }

  await sbRequest('PATCH', 'cashout_requests?id=eq.' + id, payload, {
    Prefer: 'return=minimal'
  });
  return { status: 200, body: { success: true } };
}

async function applyBuyerLeadDecision(userId, body) {
  const id = body.id;
  const decision = cleanText(body.decision);
  const notes = cleanText(body.notes);
  if (!id || !decision) return { status: 400, body: { error: 'Missing id or decision' } };

  await sbRequest('PATCH', 'data_buyer_leads?id=eq.' + id, {
    review_status: decision,
    notes,
    reviewed_by: userId,
    reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, {
    Prefer: 'return=minimal'
  });

  return { status: 200, body: { success: true } };
}

exports.handler = async function (event) {
  const responseHeaders = headers(event);
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: responseHeaders, body: '' };
  if (!SUPABASE_KEY) return reply(500, { error: 'Server not configured' }, responseHeaders);

  const user = await getUser(event);
  if (!user || !(await isAdmin(user.id))) {
    return reply(403, { error: 'Admin access required' }, responseHeaders);
  }

  try {
    if (event.httpMethod === 'GET') {
      const submissions = await sbRequest('GET', 'contributions?select=*&review_required=eq.true&status=in.(pending_review,pending)&order=submitted_at.desc&limit=30');
      const queue = await sbRequest('GET', 'review_queue?select=*&status=eq.pending&order=created_at.desc&limit=30');
      const cashouts = await sbRequest('GET', 'cashout_requests?select=*&status=eq.pending&order=created_at.desc&limit=30');
      const buyerLeads = await sbRequest('GET', 'data_buyer_leads?select=*&order=created_at.desc&limit=30');

      return reply(200, {
        summary: {
          pending_submissions: Array.isArray(submissions) ? submissions.length : 0,
          pending_reviews: Array.isArray(queue) ? queue.length : 0,
          pending_cashouts: Array.isArray(cashouts) ? cashouts.length : 0,
          buyer_leads: Array.isArray(buyerLeads) ? buyerLeads.filter(function (lead) {
            return ['new', 'needs_context'].includes(lead.review_status);
          }).length : 0
        },
        submissions: Array.isArray(submissions) ? submissions : [],
        review_queue: Array.isArray(queue) ? queue : [],
        cashouts: Array.isArray(cashouts) ? cashouts : [],
        buyer_leads: Array.isArray(buyerLeads) ? buyerLeads : []
      }, responseHeaders);
    }

    if (event.httpMethod !== 'POST') {
      return reply(405, { error: 'Method not allowed' }, responseHeaders);
    }

    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return reply(400, { error: 'Invalid JSON' }, responseHeaders);
    }

    const kind = cleanText(body.kind);
    let result;
    if (kind === 'submission') result = await applySubmissionDecision(user.id, body);
    else if (kind === 'payout') result = await applyPayoutDecision(user.id, body);
    else if (kind === 'buyer_lead') result = await applyBuyerLeadDecision(user.id, body);
    else result = { status: 400, body: { error: 'Unknown review kind' } };

    return reply(result.status, result.body, responseHeaders);
  } catch (error) {
    console.error('AfroPoints review error:', error);
    return reply(500, { error: 'Internal server error' }, responseHeaders);
  }
};

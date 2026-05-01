const SUPABASE_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const SUBTYPE_CONFIGS = {
  informal_fx_rate: {
    vertical: 'fx_remittance',
    label: 'Informal FX Rate',
    points: 12,
    bonus: 5,
    consensusMin: 3,
    windowDays: 2,
    thresholdPct: 0.08,
    table: null,
    reviewOnNewLocation: false
  },
  remittance_quote: {
    vertical: 'fx_remittance',
    label: 'Remittance Quote',
    points: 12,
    bonus: 5,
    consensusMin: 2,
    windowDays: 7,
    thresholdPct: 0.12,
    table: 'remittance_quotes',
    reviewOnNewLocation: false
  },
  fuel_price: {
    vertical: 'fuel_transport',
    label: 'Fuel Price',
    points: 8,
    bonus: 3,
    consensusMin: 2,
    windowDays: 7,
    thresholdPct: 0.2,
    table: null,
    reviewOnNewLocation: false
  },
  transport_fare: {
    vertical: 'fuel_transport',
    label: 'Transport Fare',
    points: 8,
    bonus: 3,
    consensusMin: 3,
    windowDays: 14,
    thresholdPct: 0.2,
    table: 'transport_fares',
    reviewOnNewLocation: true,
    reviewOnNewRoute: true
  },
  staple_price: {
    vertical: 'staple_basket',
    label: 'Staple Price',
    points: 8,
    bonus: 3,
    consensusMin: 2,
    windowDays: 14,
    thresholdPct: 0.2,
    table: null,
    reviewOnNewLocation: false
  },
  rent_listing: {
    vertical: 'rent_intelligence',
    label: 'Rent Listing',
    points: 15,
    bonus: 5,
    consensusMin: 2,
    windowDays: 30,
    thresholdPct: 0.2,
    table: 'rent_listings',
    reviewAlways: true,
    reviewOnNewLocation: true
  },
  lease_risk_report: {
    vertical: 'rent_intelligence',
    label: 'Lease Risk Report',
    points: 18,
    bonus: 5,
    consensusMin: 1,
    windowDays: 30,
    thresholdPct: 0,
    table: 'lease_risk_reports',
    reviewAlways: true,
    reviewOnNewLocation: true
  },
  salary_report: {
    vertical: 'salary_intelligence',
    label: 'Salary Report',
    points: 15,
    bonus: 0,
    consensusMin: 3,
    windowDays: 90,
    thresholdPct: 0.25,
    table: 'salary_reports',
    reviewOnNewLocation: false
  },
  fintech_fee: {
    vertical: 'fintech_fees',
    label: 'Fintech Fee',
    points: 10,
    bonus: 5,
    consensusMin: 3,
    windowDays: 30,
    thresholdPct: 0.2,
    table: 'fintech_fee_reports',
    reviewOnNewLocation: false
  },
  backup_power_cost: {
    vertical: 'backup_power',
    label: 'Backup Power Cost',
    points: 10,
    bonus: 4,
    consensusMin: 2,
    windowDays: 30,
    thresholdPct: 0.25,
    table: 'backup_power_reports',
    reviewOnNewLocation: false
  },
  school_fee: {
    vertical: 'school_fees',
    label: 'School Fee',
    points: 10,
    bonus: 4,
    consensusMin: 2,
    windowDays: 90,
    thresholdPct: 0.2,
    table: 'school_fee_reports',
    reviewOnNewLocation: false
  },
  clinic_cost: {
    vertical: 'health_costs',
    label: 'Clinic Cost',
    points: 12,
    bonus: 4,
    consensusMin: 2,
    windowDays: 30,
    thresholdPct: 0.2,
    table: 'clinic_cost_reports',
    reviewAlways: true,
    reviewOnNewLocation: true
  },
  pharmacy_price: {
    vertical: 'health_costs',
    label: 'Pharmacy Price',
    points: 10,
    bonus: 4,
    consensusMin: 2,
    windowDays: 30,
    thresholdPct: 0.2,
    table: 'pharmacy_price_reports',
    reviewAlways: true,
    reviewOnNewLocation: true
  },
  wholesale_retail_spread: {
    vertical: 'wholesale_retail',
    label: 'Wholesale vs Retail Spread',
    points: 12,
    bonus: 4,
    consensusMin: 2,
    windowDays: 21,
    thresholdPct: 0.25,
    table: 'wholesale_retail_reports',
    reviewOnNewLocation: false
  }
};

const SOURCE_TTL_HOURS = {
  fintech_fee: {
    official_notice: 24 * 30,
    receipt: 24 * 14,
    self_observed: 24 * 7,
    merchant_quote: 24 * 7,
    community_check: 24 * 7,
    default: 24 * 7
  },
  remittance_quote: {
    official_notice: 24,
    receipt: 24,
    self_observed: 24,
    merchant_quote: 12,
    community_check: 12,
    default: 12
  }
};

const SUBTYPE_ALIASES = {
  informal_fx_rate: 'informal_fx_rate',
  forex_rate: 'informal_fx_rate',
  forex_rates: 'informal_fx_rate',
  remittance_quote: 'remittance_quote',
  remittance_quotes: 'remittance_quote',
  fuel_price: 'fuel_price',
  fuel_prices: 'fuel_price',
  transport_fare: 'transport_fare',
  transport_fares: 'transport_fare',
  transport: 'transport_fare',
  staple_price: 'staple_price',
  staple_prices: 'staple_price',
  product_price: 'staple_price',
  product_prices: 'staple_price',
  meal_price: 'staple_price',
  food_prices: 'staple_price',
  rent_listing: 'rent_listing',
  rent_listings: 'rent_listing',
  rent_housing: 'rent_listing',
  rent: 'rent_listing',
  lease_risk_report: 'lease_risk_report',
  lease_risk_check: 'lease_risk_report',
  lease_scam: 'lease_risk_report',
  salary_report: 'salary_report',
  salary_reports: 'salary_report',
  salary: 'salary_report',
  salaries: 'salary_report',
  fintech_fee: 'fintech_fee',
  fintech_fees: 'fintech_fee',
  business_cost: 'backup_power_cost',
  business_costs: 'backup_power_cost',
  backup_power_cost: 'backup_power_cost',
  school_fee: 'school_fee',
  school_fees: 'school_fee',
  education_cost: 'school_fee',
  education_costs: 'school_fee',
  clinic_cost: 'clinic_cost',
  clinic_costs: 'clinic_cost',
  pharmacy_price: 'pharmacy_price',
  pharmacy_prices: 'pharmacy_price',
  wholesale_retail_spread: 'wholesale_retail_spread',
  wholesale_retail: 'wholesale_retail_spread',
  wholesale_prices: 'wholesale_retail_spread'
};

function cleanText(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizeCoordinate(value, min, max) {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < min || numeric > max) return null;
  return numeric;
}

function normalizeNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function safePayload(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizeSubtype(raw) {
  if (!raw) return null;
  return SUBTYPE_ALIASES[String(raw).trim().toLowerCase()] || null;
}

function getSubtypeConfig(subtype) {
  return SUBTYPE_CONFIGS[subtype] || null;
}

function getVertical(subtype) {
  return getSubtypeConfig(subtype)?.vertical || 'market_data';
}

function getSubmissionPoints(subtype) {
  return getSubtypeConfig(subtype)?.points || 5;
}

function getConfirmationBonus(subtype) {
  return getSubtypeConfig(subtype)?.bonus || 0;
}

function addHours(isoString, hours) {
  const base = isoString ? new Date(isoString) : new Date();
  if (!Number.isFinite(base.getTime())) return null;
  return new Date(base.getTime() + hours * 3600000).toISOString();
}

function getSourceTtlHours(submission, overrideHours) {
  const subtype = submission?.subtype;
  const sourceType = cleanText(submission?.source_type) || 'default';
  const config = SOURCE_TTL_HOURS[subtype] || {};
  const manualOverride = normalizeNumber(overrideHours);
  if (manualOverride && manualOverride > 0) return manualOverride;
  return config[sourceType] || config.default || null;
}

function buildExpiresAt(submission, overrideHours) {
  const ttlHours = getSourceTtlHours(submission, overrideHours);
  if (!ttlHours) return null;
  return addHours(submission?.observed_at, ttlHours);
}

function buildPublishedAt(reviewReason) {
  return reviewReason ? null : new Date().toISOString();
}

function getRouteName(submission) {
  const payload = submission.payload || {};
  return cleanText(submission.route_name) ||
    cleanText(payload.route_name) ||
    [cleanText(payload.route_from), cleanText(payload.route_to)].filter(Boolean).join(' - ') ||
    null;
}

function getMetricKey(submission) {
  const payload = submission.payload || {};
  switch (submission.subtype) {
    case 'informal_fx_rate':
      return [
        cleanText(payload.base_currency) || 'USD',
        cleanText(payload.target_currency) || submission.currency_code || 'LOCAL',
        cleanText(submission.provider_name) || cleanText(payload.market_type) || 'street'
      ].join(':');
    case 'remittance_quote':
      return [
        cleanText(payload.send_country) || 'origin',
        cleanText(payload.receive_country) || submission.country_code,
        cleanText(submission.provider_name) || cleanText(payload.provider) || 'provider'
      ].join(':');
    case 'transport_fare':
      return getRouteName(submission) || [submission.country_code, submission.city, 'route'].join(':');
    case 'staple_price':
      return cleanText(payload.product_name) || cleanText(payload.item_name) || 'staple';
    case 'rent_listing':
      return [
        cleanText(payload.property_type) || 'property',
        cleanText(payload.bedrooms) || normalizeNumber(payload.bedrooms) || 'na'
      ].join(':');
    case 'lease_risk_report':
      return cleanText(payload.listing_url) || cleanText(payload.landlord_name) || 'lease-risk';
    case 'salary_report':
      return [
        cleanText(payload.job_title) || cleanText(payload.role_title) || 'role',
        cleanText(payload.experience_level) || cleanText(payload.experience_years) || 'na'
      ].join(':');
    case 'fintech_fee':
      return [
        cleanText(submission.provider_name) || cleanText(payload.provider) || 'provider',
        cleanText(payload.transaction_type) || cleanText(payload.fee_type) || 'fee'
      ].join(':');
    case 'school_fee':
      return [
        cleanText(payload.institution_name) || 'school',
        cleanText(payload.education_level) || 'general'
      ].join(':');
    case 'clinic_cost':
      return [
        cleanText(payload.facility_name) || 'facility',
        cleanText(payload.service_name) || 'service'
      ].join(':');
    case 'pharmacy_price':
      return [
        cleanText(payload.medicine_name) || 'medicine',
        cleanText(payload.dosage) || cleanText(payload.pack_size) || 'standard'
      ].join(':');
    case 'wholesale_retail_spread':
      return [
        cleanText(payload.product_name) || 'product',
        cleanText(payload.market_name) || submission.city || 'market'
      ].join(':');
    case 'fuel_price':
      return cleanText(payload.fuel_type) || 'fuel';
    case 'backup_power_cost':
      return cleanText(payload.energy_type) || cleanText(payload.fuel_type) || 'power';
    default:
      return submission.subtype;
  }
}

function getNumericValue(submission) {
  const payload = submission.payload || {};
  switch (submission.subtype) {
    case 'informal_fx_rate':
      return normalizeNumber(payload.buy_rate) || normalizeNumber(payload.mid_rate) || normalizeNumber(payload.sell_rate);
    case 'remittance_quote':
      return normalizeNumber(payload.received_amount) || normalizeNumber(payload.fx_rate) || normalizeNumber(payload.fee_amount);
    case 'fuel_price':
      return normalizeNumber(payload.price_per_unit) || normalizeNumber(payload.price);
    case 'transport_fare':
      return normalizeNumber(payload.fare) || normalizeNumber(payload.price);
    case 'staple_price':
      return normalizeNumber(payload.price);
    case 'rent_listing':
      return normalizeNumber(payload.monthly_rent) || normalizeMonthlyRent(payload);
    case 'lease_risk_report':
      return normalizeNumber(payload.asking_rent) || normalizeNumber(payload.risk_score);
    case 'salary_report':
      return normalizeNumber(payload.monthly_gross) || normalizeNumber(payload.total_cash_comp);
    case 'fintech_fee':
      return normalizeNumber(payload.fee_amount) || normalizeNumber(payload.fee_percentage);
    case 'backup_power_cost':
      return normalizeNumber(payload.cost_amount) || normalizeNumber(payload.price_per_unit) || normalizeNumber(payload.price);
    case 'school_fee':
      return normalizeNumber(payload.annual_tuition) || normalizeNumber(payload.amount);
    case 'clinic_cost':
      return normalizeNumber(payload.cost_amount);
    case 'pharmacy_price':
      return normalizeNumber(payload.price_amount) || normalizeNumber(payload.price);
    case 'wholesale_retail_spread':
      return normalizeNumber(payload.spread_pct) || normalizeNumber(payload.retail_price);
    default:
      return null;
  }
}

function normalizeMonthlyRent(payload) {
  const amount = normalizeNumber(payload.rent_amount);
  const period = String(payload.rent_period || '').toLowerCase();
  if (!amount) return null;
  if (period === 'annual' || period === 'yearly') return amount / 12;
  return amount;
}

function median(values) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const sorted = values.slice().sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

async function sbRequest(method, path, body, extraHeaders) {
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json',
    ...(extraHeaders || {})
  };
  const response = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function getRecentBaseline(submission, limit) {
  const size = Math.min(Math.max(limit || 50, 1), 100);
  const path = [
    'contributions?select=payload,provider_name,merchant_name,route_name,confidence_score,observed_at,submitted_at',
    'status=eq.confirmed',
    'data_category=eq.' + encodeURIComponent(submission.subtype),
    'country_code=eq.' + encodeURIComponent(submission.country_code),
    'city=eq.' + encodeURIComponent(submission.city),
    'order=observed_at.desc.nullslast,submitted_at.desc',
    'limit=' + size
  ].join('&');
  const rows = await sbRequest('GET', path);
  const sameMetricRows = Array.isArray(rows) ? rows.filter(function (row) {
    return getMetricKey({
      subtype: submission.subtype,
      country_code: submission.country_code,
      city: submission.city,
      payload: row.payload || {},
      provider_name: row.provider_name,
      merchant_name: row.merchant_name,
      route_name: row.route_name
    }) === getMetricKey(submission);
  }) : [];

  const values = sameMetricRows
    .map(function (row) {
      return getNumericValue({
        subtype: submission.subtype,
        payload: row.payload || {}
      });
    })
    .filter(function (value) {
      return value !== null && value > 0;
    });

  const baselineValue = median(values);
  const currentValue = getNumericValue(submission);
  let changePct = null;
  if (baselineValue && currentValue) {
    changePct = ((currentValue - baselineValue) / baselineValue) * 100;
  }

  return {
    rows: sameMetricRows,
    count: sameMetricRows.length,
    baselineValue,
    currentValue,
    changePct
  };
}

function calculateConfidence(submission, profile, baseline) {
  const observedAt = submission.observed_at ? new Date(submission.observed_at) : new Date();
  const ageHours = Number.isFinite(observedAt.getTime()) ? Math.max(0, (Date.now() - observedAt.getTime()) / 3600000) : 0;
  const trustScore = Number(profile?.trust_score || 50);

  let score = 30;
  if (submission.proof_url) score += 18;
  if (submission.photo_url && !submission.proof_url) score += 12;

  switch (submission.source_type) {
    case 'receipt':
      score += 22;
      break;
    case 'official_notice':
      score += 20;
      break;
    case 'self_observed':
      score += 18;
      break;
    case 'merchant_quote':
      score += 16;
      break;
    case 'community_check':
      score += 10;
      break;
    default:
      score += 6;
  }

  if (ageHours <= 24) score += 12;
  else if (ageHours <= 24 * 7) score += 8;
  else if (ageHours <= 24 * 30) score += 4;

  if (submission.latitude !== null && submission.longitude !== null) score += 10;
  else if (submission.neighborhood) score += 5;
  else if (submission.city) score += 2;

  score += Math.round((trustScore / 100) * 15);

  if (baseline && baseline.count > 0 && baseline.changePct !== null) {
    const delta = Math.abs(baseline.changePct);
    if (delta <= 5) score += 15;
    else if (delta <= 20) score += 8;
    else score -= 8;
  }

  return Math.max(5, Math.min(95, score));
}

function getReviewReason(submission, baseline) {
  const config = getSubtypeConfig(submission.subtype);
  if (!config) return 'unsupported_subtype';
  if (config.reviewAlways) return 'manual_review_required';
  if (config.reviewOnNewRoute && !baseline.count) return 'new_route';
  if (config.reviewOnNewLocation && !baseline.count) return 'new_city';
  if (baseline.changePct !== null && Math.abs(baseline.changePct) > 20) return 'outlier_above_20pct';
  return null;
}

function normalizeSubmission(body) {
  const payload = safePayload(body.payload);
  const subtype = normalizeSubtype(body.subtype || body.category || body.data_category);
  if (!subtype) {
    return { error: 'Unsupported category or subtype' };
  }

  const countryCode = cleanText(body.country_code);
  const city = cleanText(body.city);
  const currencyCode = cleanText(body.currency_code) || cleanText(payload.currency_code);
  const observedAt = cleanText(body.observed_at) || cleanText(payload.observed_at);
  const sourceType = cleanText(body.source_type) || cleanText(payload.source_type) || 'self_observed';
  const latitude = normalizeCoordinate(body.latitude, -90, 90);
  const longitude = normalizeCoordinate(body.longitude, -180, 180);

  if (!countryCode || countryCode.length !== 2) return { error: 'Invalid country_code' };
  if (!city || city.length < 2) return { error: 'City is required' };
  if (!currencyCode || currencyCode.length !== 3) return { error: 'Invalid currency_code' };
  if ((body.latitude || body.longitude) && (latitude === null || longitude === null)) return { error: 'Invalid coordinates supplied' };

  const normalized = {
    vertical: cleanText(body.vertical) || getVertical(subtype),
    subtype,
    category: subtype,
    country_code: countryCode.toUpperCase(),
    city,
    neighborhood: cleanText(body.neighborhood),
    observed_at: observedAt ? new Date(observedAt).toISOString() : new Date().toISOString(),
    source_type: sourceType,
    proof_url: cleanText(body.proof_url) || cleanText(payload.proof_url),
    photo_url: cleanText(body.photo_url),
    latitude,
    longitude,
    currency_code: currencyCode.toUpperCase(),
    unit: cleanText(body.unit) || cleanText(payload.unit),
    quantity: normalizeNumber(body.quantity) || normalizeNumber(payload.quantity),
    provider_name: cleanText(body.provider_name) || cleanText(payload.provider) || cleanText(payload.provider_name),
    merchant_name: cleanText(body.merchant_name) || cleanText(payload.merchant_name) || cleanText(payload.market_name),
    route_name: cleanText(body.route_name) || cleanText(payload.route_name) || null,
    business_context: cleanText(body.business_context) || cleanText(payload.business_context),
    payload
  };

  return { submission: normalized };
}

function buildContributionRecord(userId, submission, confidenceScore, reviewReason) {
  return {
    user_id: userId,
    data_category: submission.subtype,
    vertical: submission.vertical,
    subtype: submission.subtype,
    country_code: submission.country_code,
    city: submission.city,
    neighborhood: submission.neighborhood,
    currency_code: submission.currency_code,
    payload: submission.payload,
    photo_url: submission.photo_url,
    proof_url: submission.proof_url,
    observed_at: submission.observed_at,
    source_type: submission.source_type,
    unit: submission.unit,
    quantity: submission.quantity,
    provider_name: submission.provider_name,
    merchant_name: submission.merchant_name,
    route_name: getRouteName(submission),
    business_context: submission.business_context,
    latitude: submission.latitude,
    longitude: submission.longitude,
    status: reviewReason ? 'pending_review' : 'pending',
    review_required: Boolean(reviewReason),
    review_reason: reviewReason,
    confidence_score: confidenceScore,
    points_awarded: getSubmissionPoints(submission.subtype)
  };
}

function buildDomainRecord(submission, userId, contributionId, confidenceScore, reviewReason) {
  const payload = submission.payload || {};
  const sourceName = cleanText(submission.source_name) || submission.provider_name;
  const sourceUrl = cleanText(submission.source_url) || submission.proof_url;
  const baseRecord = {
    contribution_id: contributionId,
    user_id: userId,
    verification_state: reviewReason ? 'needs_review' : 'pending',
    review_status: reviewReason ? 'pending' : 'queued',
    is_public: false,
    confidence_score: confidenceScore,
    country_code: submission.country_code,
    city: submission.city,
    neighborhood: submission.neighborhood,
    observed_at: submission.observed_at,
    source_type: submission.source_type,
    source_name: sourceName,
    source_url: sourceUrl,
    ingestion_method: cleanText(submission.ingestion_method) || 'community',
    proof_url: submission.proof_url,
    photo_url: submission.photo_url,
    payload,
    published_at: buildPublishedAt(reviewReason),
    expires_at: buildExpiresAt(submission, payload.ttl_hours),
    last_checked_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  switch (submission.subtype) {
    case 'remittance_quote':
      return {
        ...baseRecord,
        send_country: cleanText(payload.send_country),
        receive_country: cleanText(payload.receive_country) || submission.country_code,
        send_currency: cleanText(payload.send_currency),
        receive_currency: cleanText(payload.receive_currency) || submission.currency_code,
        send_amount: normalizeNumber(payload.send_amount),
        fee_amount: normalizeNumber(payload.fee_amount),
        fx_rate: normalizeNumber(payload.fx_rate),
        received_amount: normalizeNumber(payload.received_amount),
        delivery_minutes: normalizeNumber(payload.delivery_minutes),
        provider_name: submission.provider_name,
        payout_method: cleanText(payload.payout_method),
        funding_method: cleanText(payload.funding_method)
      };
    case 'transport_fare':
      return {
        ...baseRecord,
        route_name: getRouteName(submission),
        route_from: cleanText(payload.route_from),
        route_to: cleanText(payload.route_to),
        fare_amount: normalizeNumber(payload.fare),
        currency_code: submission.currency_code,
        transport_mode: cleanText(payload.transport_type),
        provider_name: submission.provider_name
      };
    case 'rent_listing':
      return {
        ...baseRecord,
        property_type: cleanText(payload.property_type),
        bedrooms: normalizeNumber(payload.bedrooms),
        bathrooms: normalizeNumber(payload.bathrooms),
        monthly_rent: normalizeMonthlyRent(payload),
        lease_term_months: normalizeLeaseTerm(payload),
        deposit_amount: normalizeNumber(payload.deposit_amount),
        furnishing: cleanText(payload.is_furnished) || cleanText(payload.furnishing),
        vacancy_status: cleanText(payload.vacancy_status),
        landlord_type: cleanText(payload.landlord_type),
        listing_url: cleanText(payload.listing_url)
      };
    case 'lease_risk_report':
      return {
        ...baseRecord,
        listing_url: cleanText(payload.listing_url),
        landlord_name: cleanText(payload.landlord_name),
        property_type: cleanText(payload.property_type),
        asking_rent: normalizeNumber(payload.asking_rent) || normalizeMonthlyRent(payload),
        deposit_amount: normalizeNumber(payload.deposit_amount),
        lease_term_months: normalizeLeaseTerm(payload),
        risk_score: normalizeNumber(payload.risk_score),
        scam_signals: Array.isArray(payload.scam_signals) ? payload.scam_signals : []
      };
    case 'salary_report':
      return {
        ...baseRecord,
        role_title: cleanText(payload.job_title) || cleanText(payload.role_title),
        role_category: cleanText(payload.role_category),
        industry: cleanText(payload.industry),
        experience_level: cleanText(payload.experience_level) || cleanText(payload.experience_years),
        company_size: cleanText(payload.company_size),
        sector: cleanText(payload.sector),
        monthly_gross: normalizeNumber(payload.monthly_gross),
        monthly_net: normalizeNumber(payload.monthly_net),
        total_cash_comp: normalizeNumber(payload.total_cash_comp),
        compensation_period: cleanText(payload.compensation_period) || 'monthly'
      };
    case 'fintech_fee':
      return {
        ...baseRecord,
        provider_name: submission.provider_name,
        fee_type: cleanText(payload.transaction_type) || cleanText(payload.fee_type),
        amount_band: cleanText(payload.amount_range) || cleanText(payload.amount_band),
        fee_amount: normalizeNumber(payload.fee_amount),
        fee_percentage: normalizeNumber(payload.fee_percentage),
        transaction_channel: cleanText(payload.transaction_channel),
        customer_segment: cleanText(payload.customer_segment)
      };
    case 'backup_power_cost':
      return {
        ...baseRecord,
        energy_type: cleanText(payload.energy_type) || cleanText(payload.fuel_type),
        product_name: cleanText(payload.product_name),
        provider_name: submission.provider_name,
        cost_amount: normalizeNumber(payload.cost_amount) || normalizeNumber(payload.price_per_unit) || normalizeNumber(payload.price),
        currency_code: submission.currency_code,
        unit: submission.unit,
        quantity: submission.quantity,
        runtime_hours: normalizeNumber(payload.runtime_hours),
        power_size_va: normalizeNumber(payload.power_size_va)
      };
    case 'school_fee':
      return {
        ...baseRecord,
        institution_name: cleanText(payload.institution_name),
        education_level: cleanText(payload.education_level),
        institution_type: cleanText(payload.institution_type),
        fee_period: cleanText(payload.period) || cleanText(payload.fee_period),
        annual_tuition: normalizeNumber(payload.annual_tuition) || normalizeNumber(payload.amount),
        extras_total: normalizeNumber(payload.extras_total),
        currency_code: submission.currency_code
      };
    case 'clinic_cost':
      return {
        ...baseRecord,
        facility_name: cleanText(payload.facility_name),
        facility_type: cleanText(payload.facility_type),
        service_name: cleanText(payload.service_name),
        cost_amount: normalizeNumber(payload.cost_amount),
        currency_code: submission.currency_code,
        wait_time_minutes: normalizeNumber(payload.wait_time_minutes)
      };
    case 'pharmacy_price':
      return {
        ...baseRecord,
        pharmacy_name: cleanText(payload.pharmacy_name),
        medicine_name: cleanText(payload.medicine_name),
        brand_name: cleanText(payload.brand_name),
        dosage: cleanText(payload.dosage),
        pack_size: cleanText(payload.pack_size),
        price_amount: normalizeNumber(payload.price_amount) || normalizeNumber(payload.price),
        currency_code: submission.currency_code
      };
    case 'wholesale_retail_spread':
      return {
        ...baseRecord,
        market_name: cleanText(payload.market_name),
        product_name: cleanText(payload.product_name),
        brand_name: cleanText(payload.brand_name),
        wholesale_price: normalizeNumber(payload.wholesale_price),
        retail_price: normalizeNumber(payload.retail_price),
        spread_pct: normalizeNumber(payload.spread_pct),
        currency_code: submission.currency_code
      };
    default:
      return null;
  }
}

function buildImportedSourceRecord(dataset, source) {
  const normalizedDataset = normalizeSubtype(dataset) || dataset;
  const sourceKey = cleanText(source?.source_key) ||
    [normalizedDataset, cleanText(source?.source_name) || cleanText(source?.provider_name) || 'source']
      .filter(Boolean)
      .join(':')
      .toLowerCase()
      .replace(/[^a-z0-9:_-]+/g, '-');

  return {
    dataset: normalizedDataset,
    source_key: sourceKey,
    source_name: cleanText(source?.source_name) || cleanText(source?.provider_name) || 'Unknown source',
    source_type: cleanText(source?.source_type) || 'official_notice',
    base_url: cleanText(source?.base_url) || cleanText(source?.source_url),
    country_scope: Array.isArray(source?.country_scope) ? source.country_scope.filter(Boolean) : [],
    provider_scope: Array.isArray(source?.provider_scope) ? source.provider_scope.filter(Boolean) : [],
    cadence_hours: normalizeNumber(source?.cadence_hours) || 24,
    ttl_hours: normalizeNumber(source?.ttl_hours) || getSourceTtlHours({ subtype: normalizedDataset, source_type: cleanText(source?.source_type) || 'official_notice' }) || 24,
    active: source?.active !== false,
    notes: cleanText(source?.notes),
    updated_at: new Date().toISOString()
  };
}

function buildImportedSubmission(dataset, record, sourceRecord) {
  const normalizedSubtype = normalizeSubtype(dataset);
  const payload = safePayload(record?.payload);
  const receiveCountry = cleanText(record?.receive_country) || cleanText(payload.receive_country) || cleanText(record?.country_code);
  const countryCode = cleanText(record?.country_code) || receiveCountry;
  const city = cleanText(record?.city) || cleanText(payload.city) || (normalizedSubtype === 'remittance_quote' ? 'Online' : 'National');
  const currencyCode = cleanText(record?.currency_code) ||
    cleanText(record?.receive_currency) ||
    cleanText(payload.currency_code) ||
    cleanText(payload.receive_currency) ||
    'USD';
  const observedAt = cleanText(record?.observed_at) || cleanText(record?.quoted_at) || cleanText(payload.observed_at) || new Date().toISOString();
  const sourceType = cleanText(record?.source_type) || cleanText(sourceRecord?.source_type) || 'official_notice';
  const providerName = cleanText(record?.provider_name) || cleanText(payload.provider_name) || cleanText(payload.provider);
  const sourceUrl = cleanText(record?.source_url) || cleanText(record?.proof_url) || cleanText(sourceRecord?.base_url);
  const observedDate = new Date(observedAt);
  const observedIso = Number.isFinite(observedDate.getTime()) ? observedDate.toISOString() : new Date().toISOString();

  return {
    subtype: normalizedSubtype,
    vertical: getVertical(normalizedSubtype),
    category: normalizedSubtype,
    country_code: (countryCode || '').toUpperCase(),
    city,
    neighborhood: cleanText(record?.neighborhood) || cleanText(payload.neighborhood),
    observed_at: observedIso,
    source_type: sourceType,
    source_name: cleanText(record?.source_name) || cleanText(sourceRecord?.source_name) || providerName,
    source_url: sourceUrl,
    proof_url: cleanText(record?.proof_url) || sourceUrl,
    photo_url: cleanText(record?.photo_url),
    currency_code: (currencyCode || 'USD').toUpperCase(),
    provider_name: providerName,
    merchant_name: cleanText(record?.merchant_name),
    route_name: cleanText(record?.route_name),
    business_context: cleanText(record?.business_context),
    payload: {
      ...payload,
      send_country: cleanText(record?.send_country) || cleanText(payload.send_country),
      receive_country: receiveCountry ? receiveCountry.toUpperCase() : null,
      send_currency: cleanText(record?.send_currency) || cleanText(payload.send_currency),
      receive_currency: cleanText(record?.receive_currency) || cleanText(payload.receive_currency) || currencyCode,
      send_amount: normalizeNumber(record?.send_amount) || normalizeNumber(payload.send_amount),
      fee_amount: normalizeNumber(record?.fee_amount) || normalizeNumber(payload.fee_amount),
      fx_rate: normalizeNumber(record?.fx_rate) || normalizeNumber(payload.fx_rate),
      received_amount: normalizeNumber(record?.received_amount) || normalizeNumber(payload.received_amount),
      delivery_minutes: normalizeNumber(record?.delivery_minutes) || normalizeNumber(payload.delivery_minutes),
      payout_method: cleanText(record?.payout_method) || cleanText(payload.payout_method),
      funding_method: cleanText(record?.funding_method) || cleanText(payload.funding_method),
      fee_type: cleanText(record?.fee_type) || cleanText(payload.fee_type),
      amount_band: cleanText(record?.amount_band) || cleanText(payload.amount_band),
      fee_percentage: normalizeNumber(record?.fee_percentage) || normalizeNumber(payload.fee_percentage),
      transaction_channel: cleanText(record?.transaction_channel) || cleanText(payload.transaction_channel),
      customer_segment: cleanText(record?.customer_segment) || cleanText(payload.customer_segment),
      ttl_hours: normalizeNumber(record?.ttl_hours) || normalizeNumber(payload.ttl_hours) || normalizeNumber(sourceRecord?.ttl_hours)
    },
    ingestion_method: cleanText(record?.ingestion_method) || 'official_ingest'
  };
}

function buildImportedDomainRecord(dataset, sourceRecord, record, options) {
  const submission = buildImportedSubmission(dataset, record, sourceRecord);
  const confidenceScore = normalizeNumber(record?.confidence_score) || 90;
  const publish = options?.publish !== false;
  const now = new Date().toISOString();
  const domainRecord = buildDomainRecord(submission, null, null, confidenceScore, publish ? null : 'manual_review_required');
  if (!domainRecord) return null;

  return {
    ...domainRecord,
    source_id: sourceRecord?.id || null,
    source_name: submission.source_name,
    source_url: submission.source_url,
    ingestion_method: submission.ingestion_method || 'official_ingest',
    verification_state: publish ? 'verified' : 'needs_review',
    review_status: publish ? 'approved' : 'pending',
    is_public: publish,
    published_at: publish ? now : null,
    verified_at: publish ? now : null,
    last_checked_at: now
  };
}

function normalizeLeaseTerm(payload) {
  const direct = normalizeNumber(payload.lease_term_months);
  if (direct) return direct;
  const period = String(payload.rent_period || payload.lease_term || '').toLowerCase();
  if (period === 'annual' || period === 'yearly') return 12;
  if (period === 'monthly') return 1;
  return null;
}

async function publishToDomain(submission, contribution, verificationState) {
  const table = getSubtypeConfig(submission.subtype)?.table;
  if (table) {
    const isVerified = verificationState === 'verified';
    await sbRequest('PATCH', table + '?contribution_id=eq.' + contribution.id, {
      verification_state: verificationState,
      review_status: isVerified ? 'approved' : 'rejected',
      is_public: isVerified,
      published_at: isVerified ? new Date().toISOString() : null,
      verified_at: isVerified ? new Date().toISOString() : null,
      expires_at: isVerified ? buildExpiresAt(submission, submission.payload?.ttl_hours) : null,
      last_checked_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { Prefer: 'return=representation' });
  }

  if (verificationState !== 'verified') return;

  if (submission.subtype === 'informal_fx_rate') {
    const payload = submission.payload || {};
    await sbRequest('POST', 'p2p_rates', {
      platform: submission.provider_name || cleanText(payload.platform) || 'Street Market',
      asset: cleanText(payload.base_currency) || 'USD',
      fiat: cleanText(payload.target_currency) || submission.currency_code,
      buy_price: normalizeNumber(payload.buy_rate),
      sell_price: normalizeNumber(payload.sell_rate) || normalizeNumber(payload.buy_rate),
      methods: Array.isArray(payload.methods) ? payload.methods : [submission.source_type],
      trust_score: Math.round(Number(contribution.confidence_score || 60)),
      fees_maker: normalizeNumber(payload.fees_maker),
      fees_taker: normalizeNumber(payload.fees_taker),
      platform_url: submission.proof_url,
      countries: [submission.country_code],
      is_active: true,
      notes: cleanText(payload.notes) || 'AfroPoints verified contributor rate',
      updated_at: new Date().toISOString()
    }, { Prefer: 'return=minimal' });
  }

  if (submission.subtype === 'fuel_price') {
    const payload = submission.payload || {};
    const fuelType = String(payload.fuel_type || '').toLowerCase();
    const value = getNumericValue(submission);
    if (value) {
      const update = {
        country_code: submission.country_code,
        country_name: cleanText(payload.country_name) || submission.country_code,
        petrol_usd: fuelType.includes('petrol') ? value : null,
        diesel_usd: fuelType.includes('diesel') ? value : null,
        lpg_usd: fuelType.includes('lpg') || fuelType.includes('gas') ? value : null,
        petrol_change: 'stable',
        diesel_change: 'stable',
        regulated: Boolean(payload.regulated),
        updated_at: new Date().toISOString(),
        updated_by: 'afropoints'
      };
      await sbRequest('POST', 'fuel_prices', update, {
        Prefer: 'resolution=merge-duplicates,return=minimal'
      });
    }
  }

  if (submission.subtype === 'staple_price') {
    const payload = submission.payload || {};
    await sbRequest('POST', 'community_prices', {
      product_name: cleanText(payload.product_name) || cleanText(payload.item_name),
      country_code: submission.country_code,
      city: submission.city,
      market_name: submission.merchant_name || submission.neighborhood || cleanText(payload.market_name),
      price: normalizeNumber(payload.price),
      currency_code: submission.currency_code,
      submitted_by: contribution.user_id,
      photo_url: submission.photo_url,
      status: 'confirmed',
      created_at: new Date().toISOString()
    }, { Prefer: 'return=minimal' });
  }
}

module.exports = {
  SUPABASE_URL,
  SUPABASE_KEY,
  SUBTYPE_CONFIGS,
  SUBTYPE_ALIASES,
  cleanText,
  normalizeCoordinate,
  normalizeNumber,
  normalizeSubtype,
  getSubtypeConfig,
  getVertical,
  getSubmissionPoints,
  getConfirmationBonus,
  getSourceTtlHours,
  buildExpiresAt,
  getMetricKey,
  getNumericValue,
  getRecentBaseline,
  calculateConfidence,
  getReviewReason,
  normalizeSubmission,
  buildContributionRecord,
  buildDomainRecord,
  buildImportedSourceRecord,
  buildImportedSubmission,
  buildImportedDomainRecord,
  publishToDomain,
  sbRequest
};

const { createClient } = require('@supabase/supabase-js');
const deadlineOverrides = require('../data/scholarships/deadline-overrides.json');

const PROJECT_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SERVICE_KEY =
  process.env.SUPABASE_AUTH_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY;
const DRY_RUN = process.argv.includes('--dry-run');

function normalizeStatus(override) {
  if (deadlineConfidence(override) === 'no_single_public_deadline') return 'variable';
  const status = String(override.status || '').toLowerCase();
  if (['open', 'upcoming', 'unclear', 'closed', 'variable'].includes(status)) return status;
  const deadline = override.deadline_date ? new Date(override.deadline_date) : null;
  if (deadline && !Number.isNaN(deadline.getTime()) && deadline.getTime() < Date.now()) return 'closed';
  return override.deadline_date ? 'upcoming' : 'unclear';
}

function normalizeDatabaseStatus(override) {
  const status = normalizeStatus(override);
  return status === 'variable' ? 'unclear' : status;
}

function deadlineConfidence(override) {
  const explicit = String(override.deadline_confidence || override.confidence || '').toLowerCase();
  if (explicit === 'no_single_public_deadline') return explicit;
  if (explicit === 'verified') return explicit;
  return override.deadline_date ? 'verified' : 'no_single_public_deadline';
}

function deadlineResolution(override) {
  return override.deadline_date ? 'exact_date' : 'no_single_public_deadline';
}

function buildPatch(override, now) {
  const confidence = deadlineConfidence(override);
  const providerUrl = override.official_provider_url || override.provider_source_url || '';
  const patch = {
    deadline_date: override.deadline_date || null,
    deadline_text: override.deadline_text || null,
    status: normalizeDatabaseStatus(override),
    proof_level: confidence === 'verified'
      ? 'official_deadline_manual_review'
      : 'official_deadline_no_single_public_date',
    last_verified_at: now,
    last_seen_at: now
  };
  if (providerUrl) {
    patch.source_url = providerUrl;
    patch.official_url = providerUrl;
  }
  return patch;
}

function buildSnapshot(current, override) {
  const confidence = deadlineConfidence(override);
  const providerUrl = override.official_provider_url || override.provider_source_url || '';
  const snapshot = Object.assign({}, current && typeof current === 'object' ? current : {}, {
    deadline_confidence: confidence,
    deadline_resolution: deadlineResolution(override),
    deadline_source_url: override.deadline_source_url || null,
    deadline_notes: override.deadline_notes || '',
    deadline_date: override.deadline_date || null,
    deadline_text: override.deadline_text || null,
    deadline_status: normalizeStatus(override),
    deadline_evidence: override.evidence || '',
    deadline_checked_urls: Array.isArray(override.checked_urls) ? override.checked_urls : [],
    deadline_override: Object.assign({}, override, {
      applied_from: 'data/scholarships/deadline-overrides.json'
    })
  });
  if (providerUrl) {
    snapshot.source_url = providerUrl;
    snapshot.official_url = providerUrl;
    snapshot.info_url = providerUrl;
    snapshot.application_url = providerUrl;
  }
  return snapshot;
}

async function main() {
  const entries = Object.entries(deadlineOverrides.overrides || {});
  const now = new Date().toISOString();
  const planned = entries.map(([slug, override]) => ({
    slug,
    patch: buildPatch(override, now)
  }));

  if (DRY_RUN) {
    console.log(JSON.stringify({
      dryRun: true,
      plannedUpdates: planned.length,
      slugs: planned.map((item) => item.slug)
    }, null, 2));
    return;
  }

  if (!SERVICE_KEY) {
    throw new Error('Missing Supabase service key. Set SUPABASE_SERVICE_ROLE_KEY or run with --dry-run.');
  }

  const client = createClient(PROJECT_URL, SERVICE_KEY, {
    auth: { persistSession: false }
  });
  const results = [];

  for (const item of planned) {
    const { data: existing, error: fetchError } = await client
      .from('scholarships')
      .select('slug,raw_snapshot')
      .eq('slug', item.slug)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) {
      results.push({ slug: item.slug, matched: 0, row: null });
      continue;
    }

    const override = deadlineOverrides.overrides[item.slug];
    const patch = Object.assign({}, item.patch, {
      raw_snapshot: buildSnapshot(existing.raw_snapshot, override)
    });

    const { data, error } = await client
      .from('scholarships')
      .update(patch)
      .eq('slug', item.slug)
      .select('slug,title,deadline_date,deadline_text,status,proof_level,raw_snapshot');

    if (error) throw error;
    results.push({
      slug: item.slug,
      matched: Array.isArray(data) ? data.length : 0,
      row: Array.isArray(data) && data.length ? data[0] : null
    });
  }

  console.log(JSON.stringify({
    dryRun: false,
    plannedUpdates: planned.length,
    updated: results.filter((item) => item.matched > 0).length,
    missing: results.filter((item) => item.matched === 0).map((item) => item.slug),
    results
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

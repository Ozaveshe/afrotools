/**
 * AfroTools — Scheduled Scholarship Verification
 * Runs daily at 4 AM UTC via Netlify Scheduled Functions.
 *
 * 1. Fetches all active scholarships from Supabase
 * 2. HEAD-checks each URL to verify it's still live
 * 3. Marks scholarships as inactive after 3+ consecutive failures
 * 4. Refreshes the Netlify Blobs cache
 */

const { setData } = require('./_shared/data-store');

const SUPABASE_DATA_URL = 'https://jbmhfpkzbgyeodsqhprx.supabase.co';
const SUPABASE_DATA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpibWhmcGt6Ymd5ZW9kc3FocHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MTg2NzIsImV4cCI6MjA2MDE5NDY3Mn0.71rkEJm1dXSKJSNPFLAmdLU-_XmEf0-UrFaLW5XUGQ0';

const MAX_FAILURES = 3;
const CHECK_TIMEOUT_MS = 10000; // 10s per URL
const BATCH_SIZE = 10; // check 10 at a time

async function fetchAllScholarships(serviceKey) {
  const url = `${SUPABASE_DATA_URL}/rest/v1/scholarships?select=id,name,info_url,application_url,consecutive_failures,is_active`;
  const res = await fetch(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });
  if (!res.ok) throw new Error(`Fetch scholarships: HTTP ${res.status}`);
  return res.json();
}

async function checkURL(url) {
  if (!url) return true; // no URL to check = fine
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'AfroTools-ScholarshipBot/1.0' },
    });
    clearTimeout(timer);
    return res.ok || res.status === 405 || res.status === 403; // Some sites block HEAD but are live
  } catch (err) {
    return false;
  }
}

async function updateScholarship(serviceKey, id, updates) {
  const url = `${SUPABASE_DATA_URL}/rest/v1/scholarships?id=eq.${id}`;
  await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(updates),
  });
}

async function refreshCache(serviceKey) {
  const url = `${SUPABASE_DATA_URL}/rest/v1/scholarships?is_active=eq.true&select=*&order=name.asc`;
  const res = await fetch(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });
  if (!res.ok) return;
  const scholarships = await res.json();
  await setData('scholarships-latest', {
    data: scholarships,
    timestamp: new Date().toISOString(),
    count: scholarships.length,
  });
  console.log(`[scholarship-verify] Cache refreshed with ${scholarships.length} scholarships`);
}

exports.handler = async function () {
  console.log('[scholarship-verify] Starting daily scholarship verification...');

  const serviceKey = process.env.SUPABASE_DATA_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) {
    console.error('[scholarship-verify] No service key configured');
    return { statusCode: 500, body: 'No service key' };
  }

  let scholarships;
  try {
    scholarships = await fetchAllScholarships(serviceKey);
  } catch (err) {
    console.error('[scholarship-verify] Failed to fetch:', err.message);
    return { statusCode: 500, body: err.message };
  }

  console.log(`[scholarship-verify] Checking ${scholarships.length} scholarships...`);

  let verified = 0;
  let failed = 0;
  let deactivated = 0;
  const now = new Date().toISOString();

  // Process in batches to avoid overwhelming
  for (let i = 0; i < scholarships.length; i += BATCH_SIZE) {
    const batch = scholarships.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (s) => {
      const urlToCheck = s.info_url || s.application_url;
      const isLive = await checkURL(urlToCheck);

      if (isLive) {
        verified++;
        if (s.consecutive_failures > 0 || !s.is_active) {
          await updateScholarship(serviceKey, s.id, {
            consecutive_failures: 0,
            is_active: true,
            last_verified: now,
            updated_at: now,
          });
        } else {
          await updateScholarship(serviceKey, s.id, {
            last_verified: now,
            updated_at: now,
          });
        }
      } else {
        failed++;
        const newFailures = (s.consecutive_failures || 0) + 1;
        const shouldDeactivate = newFailures >= MAX_FAILURES;

        if (shouldDeactivate) {
          deactivated++;
          console.log(`[scholarship-verify] Deactivating: ${s.name} (${newFailures} failures)`);
        }

        await updateScholarship(serviceKey, s.id, {
          consecutive_failures: newFailures,
          is_active: shouldDeactivate ? false : s.is_active,
          updated_at: now,
        });
      }
    }));
  }

  // Refresh the cache
  await refreshCache(serviceKey);

  const summary = `Verified: ${verified}, Failed: ${failed}, Deactivated: ${deactivated}`;
  console.log(`[scholarship-verify] Complete. ${summary}`);

  return { statusCode: 200, body: summary };
};

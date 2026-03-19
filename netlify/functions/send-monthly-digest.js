/**
 * Monthly Digest Email — scheduled Netlify function
 *
 * Runs on the 1st of each month at 8 AM UTC.
 * Sends personalized "Your Numbers" digest emails via Resend API.
 *
 * Schedule configured in netlify.toml:
 *   [functions."send-monthly-digest"]
 *     schedule = "0 8 1 * *"
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'AfroTools <hello@afrotools.com>';
const BATCH_SIZE = 50;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

exports.handler = async function (event) {
  if (!RESEND_API_KEY) {
    console.log('[digest] RESEND_API_KEY not set — skipping digest send');
    return { statusCode: 200, body: 'Skipped: no RESEND_API_KEY' };
  }
  if (!SUPABASE_SERVICE_KEY) {
    console.log('[digest] SUPABASE_SERVICE_ROLE_KEY not set — skipping');
    return { statusCode: 200, body: 'Skipped: no SUPABASE_SERVICE_ROLE_KEY' };
  }

  var sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  var now = new Date();
  var lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  var lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  var monthName = MONTH_NAMES[now.getMonth()];
  var year = now.getFullYear();
  var lastMonthName = MONTH_NAMES[lastMonth.getMonth()];

  var sent = 0;
  var errors = 0;
  var offset = 0;
  var hasMore = true;

  while (hasMore) {
    // Fetch batch of users who opted in and completed onboarding
    var { data: users, error: fetchErr } = await sb
      .from('profiles')
      .select('id, name, country_code, currency, email_unsubscribe_token')
      .eq('email_digest_enabled', true)
      .eq('onboarding_completed', true)
      .range(offset, offset + BATCH_SIZE - 1)
      .order('id');

    if (fetchErr) {
      console.error('[digest] Error fetching profiles:', fetchErr.message);
      break;
    }

    if (!users || users.length === 0) {
      hasMore = false;
      break;
    }

    for (var i = 0; i < users.length; i++) {
      var user = users[i];

      try {
        // Get user email from auth.users via service role
        var { data: authUser } = await sb.auth.admin.getUserById(user.id);
        if (!authUser || !authUser.user || !authUser.user.email) continue;
        var email = authUser.user.email;

        // Fetch last month's calculations
        var { data: calcs } = await sb
          .from('calculation_history')
          .select('tool_name, result_summary, created_at')
          .eq('user_id', user.id)
          .gte('created_at', lastMonth.toISOString())
          .lte('created_at', lastMonthEnd.toISOString())
          .order('created_at', { ascending: false })
          .limit(5);

        // Fetch FX rates for their currency
        var fxData = null;
        if (user.currency && user.currency !== 'USD') {
          var { data: fx } = await sb
            .from('fx_snapshots')
            .select('pair, rate, change_pct')
            .like('pair', '%/' + user.currency)
            .order('snapshot_date', { ascending: false })
            .limit(3);
          if (fx && fx.length > 0) fxData = fx;
        }

        // Fetch salary benchmark
        var benchmarkData = null;
        if (user.country_code) {
          var { data: bench } = await sb
            .from('salary_benchmarks')
            .select('percentile, median_salary, currency')
            .eq('country_code', user.country_code)
            .limit(1)
            .single();
          if (bench) benchmarkData = bench;
        }

        var displayName = (user.name || '').split(' ')[0] || 'there';
        var hasActivity = calcs && calcs.length > 0;
        var unsubUrl = 'https://afrotools.com/api/email/unsubscribe?token=' + user.email_unsubscribe_token;

        var html = hasActivity
          ? buildDigestEmail(displayName, monthName, year, lastMonthName, calcs, fxData, benchmarkData, unsubUrl)
          : buildGetStartedEmail(displayName, monthName, year, unsubUrl);

        var text = hasActivity
          ? buildDigestText(displayName, monthName, year, lastMonthName, calcs, fxData, benchmarkData, unsubUrl)
          : buildGetStartedText(displayName, monthName, year, unsubUrl);

        // Send via Resend
        var res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + RESEND_API_KEY,
          },
          body: JSON.stringify({
            from: EMAIL_FROM,
            to: email,
            subject: 'Your ' + monthName + ' ' + year + ' Financial Summary \u2014 AfroTools',
            html: html,
            text: text,
          }),
        });

        if (res.ok) {
          sent++;
          // Update last digest timestamp
          await sb
            .from('profiles')
            .update({ email_last_digest_at: now.toISOString() })
            .eq('id', user.id);
        } else {
          var errBody = await res.text();
          console.error('[digest] Resend error for ' + user.id + ':', errBody);
          errors++;
        }
      } catch (err) {
        console.error('[digest] Error for user ' + user.id + ':', err.message);
        errors++;
      }
    }

    if (users.length < BATCH_SIZE) {
      hasMore = false;
    } else {
      offset += BATCH_SIZE;
    }
  }

  console.log('[digest] Done: ' + sent + ' sent, ' + errors + ' errors');
  return { statusCode: 200, body: 'Sent: ' + sent + ', Errors: ' + errors };
};

// ─── HTML Email Builder (with activity) ───

function buildDigestEmail(name, monthName, year, lastMonthName, calcs, fxData, benchmark, unsubUrl) {
  var activityHtml = '';
  if (calcs && calcs.length > 0) {
    activityHtml += '<div style="margin-bottom:8px;font-size:14px;color:#475569;">' + calcs.length + ' calculation' + (calcs.length !== 1 ? 's' : '') + ' in ' + lastMonthName + '</div>';
    var latest = calcs[0];
    activityHtml += '<div style="font-size:14px;color:#1e293b;">Last: <strong>' + esc(latest.tool_name) + '</strong>';
    if (latest.result_summary) activityHtml += ' &mdash; ' + esc(latest.result_summary);
    activityHtml += '</div>';
  }

  var fxHtml = '';
  if (fxData && fxData.length > 0) {
    fxHtml = '<tr><td style="padding:0 24px 24px;">' +
      '<div style="font-size:13px;font-weight:700;color:#007AFF;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px;">\uD83D\uDCB1 FX Rates</div>';
    for (var i = 0; i < fxData.length; i++) {
      var fx = fxData[i];
      var arrow = fx.change_pct >= 0 ? '\u2191' : '\u2193';
      var color = fx.change_pct >= 0 ? '#059669' : '#dc2626';
      fxHtml += '<div style="font-size:14px;color:#1e293b;margin-bottom:4px;">' +
        esc(fx.pair) + ': <strong>' + Number(fx.rate).toLocaleString() + '</strong> ' +
        '<span style="color:' + color + ';">(' + arrow + Math.abs(fx.change_pct || 0).toFixed(1) + '%)</span></div>';
    }
    fxHtml += '</td></tr>';
  }

  var benchHtml = '';
  if (benchmark) {
    benchHtml = '<tr><td style="padding:0 24px 24px;">' +
      '<div style="font-size:13px;font-weight:700;color:#007AFF;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px;">\uD83D\uDCC8 Salary Benchmark</div>' +
      '<div style="font-size:14px;color:#1e293b;">Median salary in your country: <strong>' +
      (benchmark.currency || '') + ' ' + Number(benchmark.median_salary || 0).toLocaleString() + '</strong></div>' +
      '</td></tr>';
  }

  return emailShell(
    'Your ' + monthName + ' ' + year + ' Numbers',
    'Hi ' + esc(name) + ',',
    '<tr><td style="padding:0 24px 24px;">' +
      '<div style="font-size:13px;font-weight:700;color:#007AFF;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px;">\uD83D\uDCCA Your Activity</div>' +
      activityHtml +
    '</td></tr>' +
    fxHtml +
    benchHtml +
    '<tr><td style="padding:0 24px 24px;">' +
      '<div style="font-size:13px;font-weight:700;color:#007AFF;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px;">\uD83D\uDD27 Recommended For You</div>' +
      '<div style="font-size:14px;color:#1e293b;margin-bottom:4px;">\u2022 <a href="https://afrotools.com/tools/savings-goal/" style="color:#007AFF;text-decoration:none;">Savings Goal Calculator</a> \u2014 plan your targets</div>' +
      '<div style="font-size:14px;color:#1e293b;">\u2022 <a href="https://afrotools.com/tools/inflation-calc/" style="color:#007AFF;text-decoration:none;">Inflation Calculator</a> \u2014 see real purchasing power</div>' +
    '</td></tr>',
    unsubUrl
  );
}

// ─── HTML Email Builder (no activity — "Get Started") ───

function buildGetStartedEmail(name, monthName, year, unsubUrl) {
  return emailShell(
    'Your ' + monthName + ' ' + year + ' Summary',
    'Hi ' + esc(name) + ',',
    '<tr><td style="padding:0 24px 24px;">' +
      '<div style="font-size:14px;color:#475569;line-height:1.6;">You haven\'t used any tools yet this month. Here are some great ones to get started:</div>' +
    '</td></tr>' +
    '<tr><td style="padding:0 24px 24px;">' +
      '<div style="font-size:14px;color:#1e293b;margin-bottom:6px;">\u2022 <a href="https://afrotools.com/nigeria/ng-salary-tax.html" style="color:#007AFF;text-decoration:none;">Nigeria PAYE Calculator</a> \u2014 know your take-home</div>' +
      '<div style="font-size:14px;color:#1e293b;margin-bottom:6px;">\u2022 <a href="https://afrotools.com/tools/savings-goal/" style="color:#007AFF;text-decoration:none;">Savings Goal Calculator</a> \u2014 set a target</div>' +
      '<div style="font-size:14px;color:#1e293b;">\u2022 <a href="https://afrotools.com/crypto/" style="color:#007AFF;text-decoration:none;">Crypto Dashboard</a> \u2014 track your portfolio</div>' +
    '</td></tr>',
    unsubUrl
  );
}

// ─── Shared email shell ───

function emailShell(headline, greeting, bodyRows, unsubUrl) {
  return '<!DOCTYPE html>' +
    '<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
    '<body style="margin:0;padding:0;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,\'DM Sans\',system-ui,sans-serif;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:24px 0;">' +
    '<tr><td align="center">' +
      '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">' +
        // Header
        '<tr><td style="background:#0f172a;padding:24px 24px 20px;text-align:center;">' +
          '<div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">AFROTOOLS</div>' +
          '<div style="font-size:13px;color:#94a3b8;margin-top:4px;">' + esc(headline) + '</div>' +
        '</td></tr>' +
        // Greeting
        '<tr><td style="padding:24px 24px 16px;">' +
          '<div style="font-size:16px;font-weight:600;color:#1e293b;">' + greeting + '</div>' +
          '<div style="font-size:14px;color:#64748b;margin-top:4px;">Here\'s your monthly financial snapshot from AfroTools.</div>' +
        '</td></tr>' +
        // Dynamic body sections
        bodyRows +
        // CTA
        '<tr><td style="padding:8px 24px 24px;text-align:center;">' +
          '<a href="https://afrotools.com/dashboard/" style="display:inline-block;background:#007AFF;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">Open Your Dashboard \u2192</a>' +
        '</td></tr>' +
        // Footer
        '<tr><td style="background:#F8FAFD;padding:20px 24px;border-top:1px solid #E2E8F0;text-align:center;">' +
          '<div style="font-size:12px;color:#94a3b8;">AfroTools \u2014 Africa\'s Financial Toolkit</div>' +
          '<div style="font-size:12px;color:#94a3b8;margin-top:6px;"><a href="' + esc(unsubUrl) + '" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a> from monthly digests</div>' +
        '</td></tr>' +
      '</table>' +
    '</td></tr>' +
    '</table>' +
    '</body></html>';
}

// ─── Plain-text fallbacks ───

function buildDigestText(name, monthName, year, lastMonthName, calcs, fxData, benchmark, unsubUrl) {
  var lines = [
    'AFROTOOLS - Your ' + monthName + ' ' + year + ' Numbers',
    '',
    'Hi ' + name + ',',
    '',
    'YOUR ACTIVITY',
  ];
  if (calcs && calcs.length > 0) {
    lines.push(calcs.length + ' calculation(s) in ' + lastMonthName);
    lines.push('Last: ' + calcs[0].tool_name + (calcs[0].result_summary ? ' - ' + calcs[0].result_summary : ''));
  }
  lines.push('');
  if (fxData && fxData.length > 0) {
    lines.push('FX RATES');
    for (var i = 0; i < fxData.length; i++) {
      var fx = fxData[i];
      var dir = fx.change_pct >= 0 ? '+' : '';
      lines.push(fx.pair + ': ' + Number(fx.rate).toLocaleString() + ' (' + dir + (fx.change_pct || 0).toFixed(1) + '%)');
    }
    lines.push('');
  }
  if (benchmark) {
    lines.push('SALARY BENCHMARK');
    lines.push('Median: ' + (benchmark.currency || '') + ' ' + Number(benchmark.median_salary || 0).toLocaleString());
    lines.push('');
  }
  lines.push('Open your dashboard: https://afrotools.com/dashboard/');
  lines.push('');
  lines.push('---');
  lines.push('Unsubscribe: ' + unsubUrl);
  return lines.join('\n');
}

function buildGetStartedText(name, monthName, year, unsubUrl) {
  return [
    'AFROTOOLS - Your ' + monthName + ' ' + year + ' Summary',
    '',
    'Hi ' + name + ',',
    '',
    "You haven't used any tools yet this month. Try these:",
    '- Nigeria PAYE Calculator: https://afrotools.com/nigeria/ng-salary-tax.html',
    '- Savings Goal Calculator: https://afrotools.com/tools/savings-goal/',
    '- Crypto Dashboard: https://afrotools.com/crypto/',
    '',
    'Open your dashboard: https://afrotools.com/dashboard/',
    '',
    '---',
    'Unsubscribe: ' + unsubUrl,
  ].join('\n');
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

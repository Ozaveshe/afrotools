'use strict';

const { createClient } = require('@supabase/supabase-js');
const { getStore } = require('@netlify/blobs');
const { withScheduledProof } = require('./_shared/scheduled-proof');

const PRACTICE_POOL = ((require('../../data/jamb/pools/practice-pool.json') || {}).questions || []).filter(isLaunchSafeQuestion);
const SUPABASE_URL = process.env.SUPABASE_URL_DATA || 'https://jbmhfpkzbgyeodsqhprx.supabase.co';
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_DATA_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'AfroJAMB <hello@afrotools.com>';
const DELIVERY_TIMEZONE = 'Africa/Lagos';
const DELIVERY_STORE = 'jamb-daily-delivery';
const SITE_URL = process.env.URL || process.env.DEPLOY_PRIME_URL || 'https://afrotools.com';
const VISUAL_DEPENDENT_RE = /use the diagram|use the figure|diagram below|diagram above|figure above|graph above|illustration above|circuit above|bar chart above|pie chart above|histogram above/i;
const SUBJECT_LABELS = {
  english: 'Use of English',
  mathematics: 'Mathematics',
  physics: 'Physics',
  chemistry: 'Chemistry',
  biology: 'Biology',
  government: 'Government',
  economics: 'Economics',
  literature: 'Literature',
  crk: 'CRK',
  commerce: 'Commerce',
  accounts: 'Accounts',
};
const SUBJECT_POOLS = buildSubjectPools(PRACTICE_POOL);

exports.handler = withScheduledProof('scheduled-send-jamb-daily', async function () {
  if (!SUPABASE_SERVICE_KEY) {
    console.log('[jamb-daily-send] SUPABASE service key not set - skipping');
    return { statusCode: 200, body: 'Skipped: no Supabase service key' };
  }
  if (!RESEND_API_KEY) {
    console.log('[jamb-daily-send] RESEND_API_KEY not set - skipping');
    return { statusCode: 200, body: 'Skipped: no RESEND_API_KEY' };
  }

  var timeWindow = getLagosTimeWindow(new Date());
  var supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  var query = await supabase
    .from('jamb_daily_subscribers')
    .select('id, contact, channel, subjects, send_hour, active')
    .eq('active', true)
    .eq('send_hour', timeWindow.hour)
    .eq('channel', 'email');

  if (query.error) {
    console.error('[jamb-daily-send] subscriber fetch error:', query.error.message);
    return { statusCode: 500, body: 'Subscriber fetch failed' };
  }

  var subscribers = query.data || [];
  var sent = 0;
  var skipped = 0;
  var errors = 0;

  for (var i = 0; i < subscribers.length; i++) {
    var subscriber = subscribers[i];
    try {
      if (await wasAlreadySent(subscriber.contact, timeWindow.dayKey)) {
        skipped++;
        continue;
      }

      var packet = buildDailyPacket(subscriber, timeWindow.dayKey);
      if (!packet) {
        skipped++;
        continue;
      }

      var ok = await sendDailyEmail(subscriber.contact, packet, timeWindow);
      if (ok) {
        sent++;
        await markSent(subscriber.contact, timeWindow.dayKey, {
          question_id: packet.question.id,
          subject: packet.subject,
          sent_at: new Date().toISOString(),
        });
      } else {
        errors++;
      }
    } catch (err) {
      errors++;
      console.error('[jamb-daily-send] failed for ' + subscriber.contact + ':', err.message);
    }
  }

  console.log('[jamb-daily-send] day=' + timeWindow.dayKey + ' hour=' + timeWindow.hour + ' sent=' + sent + ' skipped=' + skipped + ' errors=' + errors);
  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      dayKey: timeWindow.dayKey,
      hour: timeWindow.hour,
      total: subscribers.length,
      sent: sent,
      skipped: skipped,
      errors: errors,
    }),
  };
});

function isLaunchSafeQuestion(question) {
  var text = ((question && question.question) || '') + ' ' + Object.values((question && question.options) || {}).join(' ');
  return !!question && !!question.answer && !question.has_diagram && !VISUAL_DEPENDENT_RE.test(text);
}

function buildSubjectPools(questions) {
  return (questions || []).reduce(function (acc, question) {
    if (!acc[question.subject]) acc[question.subject] = [];
    acc[question.subject].push(question);
    return acc;
  }, {});
}

function getLagosTimeWindow(now) {
  var map = {};
  new Intl.DateTimeFormat('en-CA', {
    timeZone: DELIVERY_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(now).forEach(function (part) {
    if (part.type !== 'literal') map[part.type] = part.value;
  });
  return {
    dayKey: map.year + '-' + map.month + '-' + map.day,
    hour: Number(map.hour),
  };
}

function buildDailyPacket(subscriber, dayKey) {
  var subjects = (Array.isArray(subscriber.subjects) ? subscriber.subjects : [])
    .filter(function (subject) {
      return SUBJECT_POOLS[subject] && SUBJECT_POOLS[subject].length;
    });
  if (!subjects.length) subjects = Object.keys(SUBJECT_POOLS);
  if (!subjects.length) return null;

  var subject = subjects[simpleHash(subscriber.contact + '|subject|' + dayKey) % subjects.length];
  var pool = SUBJECT_POOLS[subject] || PRACTICE_POOL;
  if (!pool || !pool.length) return null;

  var question = pool[simpleHash(subscriber.contact + '|question|' + dayKey) % pool.length];
  if (!question) return null;

  return {
    subject: subject,
    subjectLabel: SUBJECT_LABELS[subject] || subject,
    question: question,
    answerText: question.options && question.answer ? question.options[question.answer] : '',
  };
}

async function sendDailyEmail(to, packet, timeWindow) {
  var unsubscribeUrl = SITE_URL + '/.netlify/functions/jamb-daily-signup?unsubscribe=' + encodeURIComponent(to);
  var html = buildDailyHtml(packet, timeWindow, unsubscribeUrl);
  var text = buildDailyText(packet, timeWindow, unsubscribeUrl);
  var res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: to,
      subject: 'AfroJAMB Daily Question: ' + packet.subjectLabel,
      html: html,
      text: text,
    }),
  });

  if (!res.ok) {
    console.error('[jamb-daily-send] Resend error for ' + to + ':', await res.text());
    return false;
  }
  return true;
}

function buildDailyHtml(packet, timeWindow, unsubscribeUrl) {
  var optionsHtml = ['A', 'B', 'C', 'D', 'E']
    .filter(function (letter) {
      return packet.question.options && packet.question.options[letter];
    })
    .map(function (letter) {
      return '<div style="padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;font-size:14px;line-height:1.6;color:#334155;margin-bottom:8px;">' +
        '<strong style="display:inline-block;width:22px;color:#64748b;">' + letter + '.</strong> ' + esc(packet.question.options[letter]) +
      '</div>';
    })
    .join('');

  var answerText = packet.question.answer
    ? packet.question.answer + '. ' + esc(packet.answerText || '')
    : 'Answer key unavailable';

  return '<!DOCTYPE html>' +
    '<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
    '<body style="margin:0;padding:0;background:#eef3fb;font-family:-apple-system,BlinkMacSystemFont,DM Sans,system-ui,sans-serif;color:#0f172a;">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef3fb;padding:28px 0;">' +
        '<tr><td align="center">' +
          '<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #dbe7f6;">' +
            '<tr><td style="padding:28px 28px 18px;background:linear-gradient(135deg,#0a1628 0%,#0063d1 100%);color:#ffffff;">' +
              '<div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#fbbf24;margin-bottom:8px;">AfroJAMB Daily Question</div>' +
              '<div style="font-size:28px;font-weight:800;letter-spacing:-.03em;">One question for ' + esc(packet.subjectLabel) + '</div>' +
              '<div style="font-size:14px;line-height:1.6;color:rgba(255,255,255,.84);margin-top:8px;">Delivered for your ' + formatHourLabel(timeWindow.hour) + ' Nigeria-time study slot. Try it before you reveal the answer.</div>' +
            '</td></tr>' +
            '<tr><td style="padding:24px 28px 10px;">' +
              '<div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#2563eb;margin-bottom:8px;">JAMB ' + esc(packet.subjectLabel) + (packet.question.year ? ' - ' + packet.question.year : '') + '</div>' +
              '<div style="font-size:18px;line-height:1.65;color:#0f172a;font-weight:600;margin-bottom:18px;">' + esc(packet.question.question) + '</div>' +
              optionsHtml +
            '</td></tr>' +
            '<tr><td style="padding:10px 28px 0;">' +
              '<div style="padding:16px 18px;border-radius:14px;background:#eff6ff;border:1px solid #bfdbfe;">' +
                '<div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#1d4ed8;margin-bottom:6px;">Reveal answer</div>' +
                '<div style="font-size:16px;line-height:1.6;color:#0f172a;"><strong>' + answerText + '</strong></div>' +
              '</div>' +
            '</td></tr>' +
            '<tr><td style="padding:20px 28px 28px;">' +
              '<div style="font-size:14px;line-height:1.7;color:#475569;margin-bottom:16px;">Want the full explanation and more practice in the same subject? Open AfroJAMB and keep the momentum going.</div>' +
              '<a href="' + SITE_URL + '/jamb/tutor/" style="display:inline-block;background:#0062CC;color:#ffffff;text-decoration:none;padding:13px 20px;border-radius:999px;font-size:14px;font-weight:700;margin-right:8px;">Open AI Tutor</a>' +
              '<a href="' + SITE_URL + '/jamb/cbt/" style="display:inline-block;background:#ffffff;color:#0063D1;text-decoration:none;padding:13px 20px;border-radius:999px;font-size:14px;font-weight:700;border:1.5px solid #bfdbfe;">Start CBT Mock</a>' +
              '<div style="margin-top:16px;font-size:12px;line-height:1.7;color:#64748b;">No spam. <a href="' + unsubscribeUrl + '" style="color:#2563eb;">Stop these daily emails</a>.</div>' +
            '</td></tr>' +
          '</table>' +
        '</td></tr>' +
      '</table>' +
    '</body></html>';
}

function buildDailyText(packet, timeWindow, unsubscribeUrl) {
  var lines = [
    'AFROJAMB DAILY QUESTION',
    '',
    packet.subjectLabel + (packet.question.year ? ' - JAMB ' + packet.question.year : ''),
    '',
    packet.question.question,
    '',
  ];
  ['A', 'B', 'C', 'D', 'E'].forEach(function (letter) {
    if (packet.question.options && packet.question.options[letter]) {
      lines.push(letter + '. ' + packet.question.options[letter]);
    }
  });
  lines.push('');
  lines.push('Correct answer: ' + packet.question.answer + '. ' + (packet.answerText || ''));
  lines.push('');
  lines.push('Continue with the full toolset: ' + SITE_URL + '/jamb/');
  lines.push('AI Tutor: ' + SITE_URL + '/jamb/tutor/');
  lines.push('CBT Mock: ' + SITE_URL + '/jamb/cbt/');
  lines.push('');
  lines.push('Scheduled for your ' + formatHourLabel(timeWindow.hour) + ' Nigeria-time study slot.');
  lines.push('Unsubscribe: ' + unsubscribeUrl);
  return lines.join('\n');
}

async function wasAlreadySent(contact, dayKey) {
  try {
    var store = getStore(DELIVERY_STORE);
    var key = dayKey + ':' + simpleHash(String(contact).toLowerCase());
    return !!(await store.get(key, { type: 'json' }));
  } catch (err) {
    return false;
  }
}

async function markSent(contact, dayKey, payload) {
  try {
    var store = getStore(DELIVERY_STORE);
    var key = dayKey + ':' + simpleHash(String(contact).toLowerCase());
    await store.setJSON(key, payload);
  } catch (err) {
    console.log('[jamb-daily-send] delivery marker skipped:', err.message);
  }
}

function simpleHash(input) {
  var hash = 2166136261;
  for (var i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function formatHourLabel(hr) {
  if (hr === 0) return '12:00 AM';
  if (hr < 12) return hr + ':00 AM';
  if (hr === 12) return '12:00 PM';
  return (hr - 12) + ':00 PM';
}

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

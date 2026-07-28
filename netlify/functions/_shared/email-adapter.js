const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'AfroTools <hello@afrotools.com>';
const EMAIL_MARKETING_FROM = process.env.EMAIL_MARKETING_FROM || '';
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || '';

function isEmailConfigured() {
  return !!RESEND_API_KEY;
}

function isMarketingPaused() {
  return /^(1|true|yes|on)$/i.test(String(process.env.EMAIL_MARKETING_PAUSED || '').trim());
}

function safeTags(tags) {
  if (!Array.isArray(tags)) return undefined;
  var cleaned = tags
    .filter(function (tag) { return tag && tag.name && tag.value; })
    .slice(0, 10)
    .map(function (tag) {
      return {
        name: String(tag.name).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 256),
        value: String(tag.value).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 256),
      };
    });
  return cleaned.length ? cleaned : undefined;
}

async function sendEmail(message) {
  if (!isEmailConfigured()) {
    return {
      ok: false,
      provider: 'resend',
      providerStatus: 'provider_missing',
      error: 'RESEND_API_KEY not configured'
    };
  }

  if (message && message.marketing === true && isMarketingPaused()) {
    return {
      ok: false,
      provider: 'resend',
      providerStatus: 'marketing_paused',
      error: 'Marketing email is paused by EMAIL_MARKETING_PAUSED'
    };
  }

  var headers = Object.assign({}, message.headers || {});
  if (message.unsubscribeUrl) {
    headers['List-Unsubscribe'] = '<' + message.unsubscribeUrl + '>';
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
  }

  var payload = {
    from: message.from || (message.marketing === true && EMAIL_MARKETING_FROM ? EMAIL_MARKETING_FROM : EMAIL_FROM),
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text
  };
  if (message.replyTo || EMAIL_REPLY_TO) payload.reply_to = message.replyTo || EMAIL_REPLY_TO;
  if (Object.keys(headers).length) payload.headers = headers;
  var tags = safeTags(message.tags);
  if (tags) payload.tags = tags;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + RESEND_API_KEY
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    var rawError = await response.text();
    var providerStatus = 'failed';
    try {
      var parsedError = JSON.parse(rawError);
      providerStatus = parsedError.name || parsedError.code || providerStatus;
    } catch (e) {
      // Preserve the raw provider response for server-side diagnostics.
    }
    return {
      ok: false,
      provider: 'resend',
      providerStatus: providerStatus,
      error: rawError
    };
  }

  var data = {};
  try {
    data = await response.json();
  } catch (e) {
    data = {};
  }
  return {
    ok: true,
    provider: 'resend',
    providerStatus: 'sent',
    id: data.id || null
  };
}

module.exports = {
  EMAIL_FROM,
  EMAIL_MARKETING_FROM,
  EMAIL_REPLY_TO,
  isEmailConfigured,
  isMarketingPaused,
  sendEmail
};

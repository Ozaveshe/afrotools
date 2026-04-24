const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'AfroTools <hello@afrotools.com>';

function isEmailConfigured() {
  return !!RESEND_API_KEY;
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

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + RESEND_API_KEY
    },
    body: JSON.stringify({
      from: message.from || EMAIL_FROM,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text
    })
  });

  if (!response.ok) {
    return {
      ok: false,
      provider: 'resend',
      providerStatus: 'failed',
      error: await response.text()
    };
  }

  return {
    ok: true,
    provider: 'resend',
    providerStatus: 'sent'
  };
}

module.exports = {
  EMAIL_FROM,
  isEmailConfigured,
  sendEmail
};

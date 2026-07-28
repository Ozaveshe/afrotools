const assert = require('assert');
const crypto = require('crypto');
const path = require('path');

const ADAPTER = path.join(__dirname, '..', 'netlify', 'functions', '_shared', 'email-adapter.js');
const WEBHOOK = path.join(__dirname, '..', 'netlify', 'functions', 'resend-webhook.js');
const WEEKLY = path.join(__dirname, '..', 'netlify', 'functions', 'send-weekly-newsletter.js');

function loadAdapter(env) {
  delete require.cache[require.resolve(ADAPTER)];
  process.env.RESEND_API_KEY = env.RESEND_API_KEY || '';
  process.env.EMAIL_MARKETING_PAUSED = env.EMAIL_MARKETING_PAUSED || '';
  process.env.EMAIL_MARKETING_FROM = env.EMAIL_MARKETING_FROM || '';
  process.env.EMAIL_REPLY_TO = env.EMAIL_REPLY_TO || '';
  return require(ADAPTER);
}

(async function run() {
  var originalFetch = global.fetch;
  var originalKey = process.env.RESEND_API_KEY;
  var originalPaused = process.env.EMAIL_MARKETING_PAUSED;
  var originalMarketingFrom = process.env.EMAIL_MARKETING_FROM;
  var originalReplyTo = process.env.EMAIL_REPLY_TO;
  try {
    var missing = loadAdapter({});
    var missingResult = await missing.sendEmail({ to: 'person@example.test' });
    assert.equal(missingResult.providerStatus, 'provider_missing');

    var paused = loadAdapter({ RESEND_API_KEY: 're_test', EMAIL_MARKETING_PAUSED: 'true' });
    var pausedResult = await paused.sendEmail({ to: 'person@example.test', marketing: true });
    assert.equal(pausedResult.providerStatus, 'marketing_paused');

    var captured;
    global.fetch = async function (_url, options) {
      captured = JSON.parse(options.body);
      return {
        ok: true,
        json: async function () { return { id: 'email_test_123' }; },
      };
    };
    var active = loadAdapter({
      RESEND_API_KEY: 're_test',
      EMAIL_MARKETING_FROM: 'AfroTools Brief <brief@afrotools.com>',
      EMAIL_REPLY_TO: 'hello@afrotools.com',
    });
    var sent = await active.sendEmail({
      to: 'person@example.test',
      subject: 'Useful update',
      html: '<p>Hello</p>',
      text: 'Hello',
      marketing: true,
      unsubscribeUrl: 'https://afrotools.com/api/email/unsubscribe?token=test',
      tags: [{ name: 'email_type', value: 'weekly_brief' }],
    });
    assert.equal(sent.id, 'email_test_123');
    assert.equal(captured.from, 'AfroTools Brief <brief@afrotools.com>');
    assert.equal(captured.reply_to, 'hello@afrotools.com');
    assert.equal(captured.headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click');
    assert.match(captured.headers['List-Unsubscribe'], /^<https:\/\/afrotools\.com\//);
    assert.deepEqual(captured.tags, [{ name: 'email_type', value: 'weekly_brief' }]);

    const webhook = require(WEBHOOK);
    const rawSecret = crypto.randomBytes(32);
    const secret = 'whsec_' + rawSecret.toString('base64');
    const body = JSON.stringify({ type: 'email.complained', data: { to: ['Person@Example.test'] } });
    const timestamp = Math.floor(Date.now() / 1000);
    const id = 'msg_test_123';
    const signature = crypto
      .createHmac('sha256', rawSecret)
      .update(id + '.' + timestamp + '.' + body)
      .digest('base64');
    const event = {
      body,
      headers: {
        'svix-id': id,
        'svix-timestamp': String(timestamp),
        'svix-signature': 'v1,' + signature,
      },
    };
    assert.equal(webhook.verifyWebhook(event, secret, timestamp), true);
    assert.equal(webhook.verifyWebhook(event, secret, timestamp + 301), false);
    assert.equal(webhook.suppressionReason({ type: 'email.bounced', data: { bounce: { type: 'Permanent' } } }), 'permanent_bounce');
    assert.equal(webhook.suppressionReason({ type: 'email.bounced', data: { bounce: { type: 'Transient' } } }), '');
    assert.deepEqual(webhook.recipientEmails({ data: { to: ['Person@Example.test'] } }), ['person@example.test']);

    const weekly = require(WEEKLY);
    const editionDates = [
      new Date('2026-07-06T08:00:00Z'),
      new Date('2026-07-13T08:00:00Z'),
      new Date('2026-07-20T08:00:00Z'),
      new Date('2026-07-27T08:00:00Z'),
    ];
    const editions = editionDates.map(function (date) {
      return weekly.weeklyEdition({ country_code: 'NG' }, date).id;
    });
    assert.equal(new Set(editions).size, 4, 'four consecutive weeks should rotate through four editions');
    editionDates.forEach(function (date) {
      var message = weekly.buildWeeklyMessage(
        { email: 'person@example.test', name: 'Ada', country_code: 'NG' },
        'https://afrotools.com/api/email/unsubscribe?token=test',
        date
      );
      assert.equal(message.tags.length, 3);
      assert.equal((message.html.match(/utm_content=/g) || []).length, 1, 'weekly email should have one primary content CTA');
      assert.match(message.text, /Unsubscribe: https:\/\/afrotools\.com\//);
    });

    console.log('email-delivery-safety: ok');
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalKey;
    if (originalPaused === undefined) delete process.env.EMAIL_MARKETING_PAUSED;
    else process.env.EMAIL_MARKETING_PAUSED = originalPaused;
    if (originalMarketingFrom === undefined) delete process.env.EMAIL_MARKETING_FROM;
    else process.env.EMAIL_MARKETING_FROM = originalMarketingFrom;
    if (originalReplyTo === undefined) delete process.env.EMAIL_REPLY_TO;
    else process.env.EMAIL_REPLY_TO = originalReplyTo;
    delete require.cache[require.resolve(ADAPTER)];
  }
})().catch(function (error) {
  console.error(error);
  process.exitCode = 1;
});

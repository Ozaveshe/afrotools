const { sendEmail, isEmailConfigured } = require('./email-adapter');

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function firstName(name, email) {
  var base = String(name || '').trim() || String(email || '').split('@')[0] || 'there';
  return base.split(/\s+/)[0] || 'there';
}

function textFromHtml(html) {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function shell(title, preview, bodyHtml, ctaLabel, ctaUrl, unsubscribeUrl) {
  return '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + esc(title) + '</title></head>' +
    '<body style="margin:0;background:#f5f7fb;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#152238;">' +
    '<div style="display:none;max-height:0;overflow:hidden;">' + esc(preview) + '</div>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb;padding:24px 12px;">' +
    '<tr><td align="center"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e3eaf4;border-radius:8px;overflow:hidden;">' +
    '<tr><td style="padding:24px 24px 18px;background:#0f172a;color:#ffffff;">' +
    '<div style="font-size:20px;font-weight:800;letter-spacing:0;">AfroTools</div>' +
    '<div style="font-size:13px;color:#b6c2d6;margin-top:4px;">Tools, reports, and local work trails for Africa.</div>' +
    '</td></tr>' +
    '<tr><td style="padding:24px;font-size:15px;line-height:1.65;color:#24324a;">' +
    bodyHtml +
    '<p style="margin:24px 0 6px;"><a href="' + esc(ctaUrl) + '" style="display:inline-block;background:#0f6ddf;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:8px;">' + esc(ctaLabel) + '</a></p>' +
    '</td></tr>' +
    '<tr><td style="padding:18px 24px;background:#f8fafc;border-top:1px solid #e3eaf4;font-size:12px;line-height:1.55;color:#64748b;">' +
    '<div>You are receiving this because you created an AfroTools account or requested a report/download.</div>' +
    (unsubscribeUrl ? '<div style="margin-top:8px;"><a href="' + esc(unsubscribeUrl) + '" style="color:#64748b;text-decoration:underline;">Unsubscribe</a> from AfroTools digest and follow-up emails.</div>' : '') +
    '</td></tr>' +
    '</table></td></tr></table></body></html>';
}

function featureRow(title, text, linkLabel, linkUrl) {
  return '<tr><td style="padding:14px 0;border-top:1px solid #e3eaf4;">' +
    '<div style="font-size:15px;font-weight:800;color:#152238;margin-bottom:4px;">' + esc(title) + '</div>' +
    '<div style="font-size:14px;line-height:1.55;color:#475569;margin-bottom:6px;">' + esc(text) + '</div>' +
    '<a href="' + esc(linkUrl) + '" style="color:#0f6ddf;text-decoration:none;font-weight:700;font-size:14px;">' + esc(linkLabel) + '</a>' +
    '</td></tr>';
}

function toolName(value, fallback) {
  var text = String(value || '').trim();
  if (!text) text = String(fallback || '').trim();
  if (!text) return 'AfroTools';
  return text.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function buildWelcomeHtml(name, mode) {
  var delayed = mode === 'founding_user_welcome';
  return '<p style="margin:0 0 14px;">Hi ' + esc(name) + ',</p>' +
    (delayed
      ? '<p style="margin:0 0 14px;">You created an AfroTools account before our email engine was ready. That does not make this late. It makes you one of the first people inside the product while it is still becoming stronger.</p>'
      : '<p style="margin:0 0 14px;">Welcome to AfroTools. Your account is ready, and it gives you a place to keep useful African tools, reports, calculations, and work trails together.</p>') +
    '<p style="margin:0 0 16px;">AfroTools is built for practical work: salary and PAYE checks, PDF/report downloads, country-specific calculators, content tools, AfroKitchen, business helpers, and a dashboard you can return to when the numbers matter again.</p>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 2px;">' +
      featureRow(
        'Keep your work in one place',
        'Use the dashboard to return to saved tools, report trails, calculations, and account activity instead of starting from scratch.',
        'Open your dashboard',
        'https://afrotools.com/dashboard/?utm_source=resend&utm_medium=email&utm_campaign=welcome_existing_users'
      ) +
      featureRow(
        'Use tools built around African realities',
        'Find tax, salary, business, travel, education, PDF, food, finance, and country-specific tools without hunting across random sites.',
        'Explore tools',
        'https://afrotools.com/search/?utm_source=resend&utm_medium=email&utm_campaign=welcome_existing_users'
      ) +
      featureRow(
        'Turn downloads into a useful trail',
        'When you download reports or PDFs, AfroTools can help you keep the context connected so the next step is easier.',
        'Try the PDF workspace',
        'https://afrotools.com/pdf/?utm_source=resend&utm_medium=email&utm_campaign=welcome_existing_users'
      ) +
    '</table>' +
    '<p style="margin:18px 0 0;color:#475569;">We will use email carefully: helpful product updates, useful tool recommendations, and practical reminders. No noise for the sake of noise.</p>';
}

function buildWelcomeText(name, mode, unsubscribeUrl) {
  var delayed = mode === 'founding_user_welcome';
  var lines = [
    delayed
      ? 'Welcome to AfroTools - you are early here'
      : 'Welcome to AfroTools - your workspace is ready',
    '',
    'Hi ' + name + ',',
    '',
    delayed
      ? 'You created an AfroTools account before our email engine was ready. That does not make this late. It makes you one of the first people inside the product while it is still becoming stronger.'
      : 'Welcome to AfroTools. Your account is ready, and it gives you a place to keep useful African tools, reports, calculations, and work trails together.',
    '',
    'AfroTools is built for practical work: salary and PAYE checks, PDF/report downloads, country-specific calculators, content tools, AfroKitchen, business helpers, and a dashboard you can return to when the numbers matter again.',
    '',
    'What you can do now:',
    '',
    '1. Keep your work in one place',
    'Use the dashboard to return to saved tools, report trails, calculations, and account activity instead of starting from scratch.',
    'https://afrotools.com/dashboard/?utm_source=resend&utm_medium=email&utm_campaign=welcome_existing_users',
    '',
    '2. Use tools built around African realities',
    'Find tax, salary, business, travel, education, PDF, food, finance, and country-specific tools without hunting across random sites.',
    'https://afrotools.com/search/?utm_source=resend&utm_medium=email&utm_campaign=welcome_existing_users',
    '',
    '3. Turn downloads into a useful trail',
    'When you download reports or PDFs, AfroTools can help you keep the context connected so the next step is easier.',
    'https://afrotools.com/pdf/?utm_source=resend&utm_medium=email&utm_campaign=welcome_existing_users',
    '',
    'We will use email carefully: helpful product updates, useful tool recommendations, and practical reminders. No noise for the sake of noise.',
  ];
  if (unsubscribeUrl) {
    lines.push('', 'Unsubscribe: ' + unsubscribeUrl);
  }
  return lines.join('\n');
}

function buildLifecycleMessage(kind, recipient) {
  var email = recipient.email;
  var name = firstName(recipient.name, email);
  var unsubscribeUrl = recipient.unsubscribeUrl || '';

  if (kind === 'onboarding_nudge') {
    var onboardingSubject = 'Three quick ways to make AfroTools useful';
    var onboardingHtml = '<p style="margin:0 0 14px;">Hi ' + esc(name) + ',</p>' +
      '<p style="margin:0 0 14px;">Your AfroTools account is ready. The best first move is not complicated: pick one tool you actually need, save it, and let the dashboard keep the thread for later.</p>' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 2px;">' +
        featureRow(
          'Set your local context',
          'Add your country and currency so tools, reports, and recommendations can feel less generic.',
          'Update profile',
          'https://afrotools.com/dashboard/?utm_source=resend&utm_medium=email&utm_campaign=onboarding_nudge'
        ) +
        featureRow(
          'Save one tool you will reuse',
          'Salary, tax, PDF, scholarship, business, food, and country tools are easier to return to when saved.',
          'Find a tool',
          'https://afrotools.com/search/?utm_source=resend&utm_medium=email&utm_campaign=onboarding_nudge'
        ) +
        featureRow(
          'Keep report work connected',
          'If you generate PDFs or reports, use the dashboard so your next visit starts with context, not guesswork.',
          'Open dashboard',
          'https://afrotools.com/dashboard/?utm_source=resend&utm_medium=email&utm_campaign=onboarding_nudge'
        ) +
      '</table>' +
      '<p style="margin:18px 0 0;color:#475569;">This is a gentle setup nudge, not another noisy sequence. One useful saved path is enough to start.</p>';
    var onboarding = shell(
      onboardingSubject,
      'A simple first setup path for your AfroTools account.',
      onboardingHtml,
      'Open your dashboard',
      'https://afrotools.com/dashboard/?utm_source=resend&utm_medium=email&utm_campaign=onboarding_nudge',
      unsubscribeUrl
    );
    return {
      to: email,
      subject: onboardingSubject,
      html: onboarding,
      text: textFromHtml(onboarding),
    };
  }

  if (kind === 'activity_milestone') {
    var activityTitle = toolName(recipient.activityTitle || recipient.toolName, recipient.toolSlug || recipient.activityType);
    var activitySubject = 'Nice, your AfroTools workspace has started';
    var activityHtml = '<p style="margin:0 0 14px;">Hi ' + esc(name) + ',</p>' +
      '<p style="margin:0 0 14px;">Good move. You have started building a useful AfroTools trail with <strong>' + esc(activityTitle) + '</strong>.</p>' +
      '<p style="margin:0 0 14px;">The next useful step is to keep that work connected: save related tools, return through the dashboard, and use the same workspace when you need a report, calculation, checklist, or country-specific helper again.</p>' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 2px;">' +
        featureRow(
          'Return to the work trail',
          'Your dashboard is the place to continue from saved tools, calculations, reports, and workspace items.',
          'Open dashboard',
          'https://afrotools.com/dashboard/?utm_source=resend&utm_medium=email&utm_campaign=activity_milestone'
        ) +
        featureRow(
          'Find the next related tool',
          'Search the directory when the next job is a calculator, PDF helper, education route, business helper, or country page.',
          'Search tools',
          'https://afrotools.com/search/?utm_source=resend&utm_medium=email&utm_campaign=activity_milestone'
        ) +
      '</table>' +
      '<p style="margin:18px 0 0;color:#475569;">Small trails compound. That is the product doing its job.</p>';
    var activity = shell(
      activitySubject,
      'Your first useful AfroTools activity is worth keeping connected.',
      activityHtml,
      'Open your dashboard',
      'https://afrotools.com/dashboard/?utm_source=resend&utm_medium=email&utm_campaign=activity_milestone',
      unsubscribeUrl
    );
    return {
      to: email,
      subject: activitySubject,
      html: activity,
      text: textFromHtml(activity),
    };
  }

  if (kind === 'pdf_lead_welcome') {
    var tool = recipient.toolSlug ? recipient.toolSlug.replace(/-/g, ' ') : 'your report';
    var pdfHtml = '<p style="margin:0 0 14px;">Hi ' + esc(name) + ',</p>' +
      '<p style="margin:0 0 14px;">Your AfroTools report trail is ready. You can keep using the calculator, save related work to your dashboard, and come back when you need the figures again.</p>' +
      '<p style="margin:0 0 14px;">A good next step is to save the report context, then use the dashboard to track related tools, files, and calculations.</p>' +
      '<p style="margin:0;color:#64748b;font-size:13px;">Requested from: ' + esc(tool) + '</p>';
    var pdfSubject = 'Your AfroTools report trail is ready';
    var pdf = shell(pdfSubject, 'Keep your AfroTools report and follow-up work connected.', pdfHtml, 'Open your dashboard', 'https://afrotools.com/dashboard/', unsubscribeUrl);
    return {
      to: email,
      subject: pdfSubject,
      html: pdf,
      text: textFromHtml(pdf),
    };
  }

  if (kind === 'pdf_lead_followup') {
    var reportTool = toolName(recipient.toolSlug, 'your report');
    var leadSubject = 'Keep your AfroTools report from going cold';
    var leadHtml = '<p style="margin:0 0 14px;">Hi ' + esc(name) + ',</p>' +
      '<p style="margin:0 0 14px;">You recently used AfroTools to unlock <strong>' + esc(reportTool) + '</strong>. A report is more useful when the next step is easy to find.</p>' +
      '<p style="margin:0 0 14px;">Create or open your AfroTools account to keep downloads, calculators, saved tools, and follow-up work in one dashboard.</p>' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 2px;">' +
        featureRow(
          'Save the context',
          'Keep the report trail attached to related tools so you can return without rebuilding the same work.',
          'Open dashboard',
          'https://afrotools.com/dashboard/?utm_source=resend&utm_medium=email&utm_campaign=pdf_lead_followup'
        ) +
        featureRow(
          'Find related helpers',
          'Search salary, tax, PDF, education, country, business, food, and finance tools built for African use cases.',
          'Explore tools',
          'https://afrotools.com/search/?utm_source=resend&utm_medium=email&utm_campaign=pdf_lead_followup'
        ) +
      '</table>' +
      '<p style="margin:18px 0 0;color:#475569;">This is the follow-up we should have had from day one: useful, calm, and tied to the report you requested.</p>';
    var lead = shell(
      leadSubject,
      'A practical follow-up for your AfroTools report download.',
      leadHtml,
      'Open AfroTools',
      'https://afrotools.com/dashboard/?utm_source=resend&utm_medium=email&utm_campaign=pdf_lead_followup',
      unsubscribeUrl
    );
    return {
      to: email,
      subject: leadSubject,
      html: lead,
      text: textFromHtml(lead),
    };
  }

  var subject = kind === 'founding_user_welcome'
    ? 'Welcome to AfroTools - you are early here'
    : 'Welcome to AfroTools - your workspace is ready';
  var preview = kind === 'founding_user_welcome'
    ? 'A proper welcome for the first AfroTools users.'
    : 'Your AfroTools account is ready.';
  var html = shell(
    subject,
    preview,
    buildWelcomeHtml(name, kind),
    'Open your dashboard',
    'https://afrotools.com/dashboard/?utm_source=resend&utm_medium=email&utm_campaign=welcome_existing_users',
    unsubscribeUrl
  );
  return {
    to: email,
    subject: subject,
    html: html,
    text: buildWelcomeText(name, kind, unsubscribeUrl),
  };
}

async function sendLifecycleEmail(kind, recipient) {
  if (!recipient || !recipient.email) {
    return { ok: false, provider: 'resend', providerStatus: 'invalid_recipient', error: 'Missing recipient email' };
  }
  if (!isEmailConfigured()) {
    return { ok: false, provider: 'resend', providerStatus: 'provider_missing', error: 'RESEND_API_KEY not configured' };
  }
  return sendEmail(buildLifecycleMessage(kind, recipient));
}

module.exports = {
  buildLifecycleMessage: buildLifecycleMessage,
  sendLifecycleEmail: sendLifecycleEmail,
};

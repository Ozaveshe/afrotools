const SENSITIVE_PAYLOAD_KEYS = [
  'cvText',
  'resumeText',
  'coverLetterText',
  'jobDescription',
  'documentContent',
  'documentText',
  'pdfText',
  'fileText',
  'profileData',
  'educationProfile',
  'financialData',
  'legalFacts',
  'healthData',
  'personalProfile',
];

function getHeader(headers, name) {
  if (!headers) return '';
  const direct = headers[name] || headers[name.toLowerCase()] || headers[name.toUpperCase()];
  if (direct) return direct;
  const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === name.toLowerCase());
  return key ? headers[key] : '';
}

function hasSensitivePayload(value, depth = 0) {
  if (!value || depth > 4) return false;
  if (Array.isArray(value)) return value.some((item) => hasSensitivePayload(item, depth + 1));
  if (typeof value !== 'object') return false;
  return Object.keys(value).some((key) => (
    SENSITIVE_PAYLOAD_KEYS.includes(key) || hasSensitivePayload(value[key], depth + 1)
  ));
}

function hasAiContentConsent(event, body) {
  const headerConsent = getHeader(event && event.headers, 'x-afrotools-ai-content-consent');
  const bodyConsent = body && (
    body.aiContentConsent ||
    body.ai_content_consent ||
    body.consent?.aiContentIncluded ||
    body.consent?.documentProfileContentIncluded
  );
  return String(headerConsent || bodyConsent || '').toLowerCase() === 'accepted' || bodyConsent === true;
}

function aiContentConsentRequiredResponse(headers) {
  const reply = 'AI was not contacted. This request includes document, profile, financial, legal, health, or CV content and needs explicit AI content consent.';
  return {
    statusCode: 428,
    headers,
    body: JSON.stringify({
      ok: false,
      error: 'ai_content_consent_required',
      reply,
      text: reply,
    }),
  };
}

function rejectSensitivePayloadWithoutConsent(event, body, headers) {
  if (!hasSensitivePayload(body)) return null;
  if (hasAiContentConsent(event, body)) return null;
  return aiContentConsentRequiredResponse(headers);
}

module.exports = {
  SENSITIVE_PAYLOAD_KEYS,
  getHeader,
  hasSensitivePayload,
  hasAiContentConsent,
  aiContentConsentRequiredResponse,
  rejectSensitivePayloadWithoutConsent,
};

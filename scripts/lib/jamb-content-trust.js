'use strict';

const crypto = require('node:crypto');
const { visualAssetHash } = require('./jamb-visual-assets');

const CONTEXT_REFERENCE = /\b(?:the|this|above|following)\s+(?:passage|extract|poem|stanza)\b|\b(?:author|writer)\s+(?:observes|believes|argues|suggests|implies|apparently|means)\b|\baccording to (?:the\s+)?(?:author|writer)\b|\blines?\s+\d+/i;
const VISUAL_REFERENCE = /\b(?:diagram|figure|graph|illustration|circuit|chart|histogram|table|map)\s+(?:above|below|shown|provided)|\b(?:use|using|from|in)\s+the\s+(?:diagram|figure|graph|illustration|circuit|chart|histogram|table|map)\b/i;
const OCR_ARTIFACT = /\[PAGE\s+\d+\]|\uFFFD|\b(?:TODO|FIXME|REPLACE_ME)\b/i;
const EXPLANATION_UNCERTAINTY = /\b(?:rechecking|guess(?:ing|ed)?|cannot determine|not enough information|none of the (?:given |provided )?options|no (?:given |provided )?option matches)\b|\.{3}\s*\(/i;
const SOURCED_PERMISSION_BASES = new Set(['written-permission', 'open-license', 'original-work']);
const AI_VERIFICATION_METHODS = new Set(['ai-calculation-checked', 'ai-source-checked']);

function canonicalJson(value) {
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().filter(key => value[key] !== undefined)
      .map(key => JSON.stringify(key) + ':' + canonicalJson(value[key])).join(',') + '}';
  }
  return JSON.stringify(value);
}

// Pin every field, including context/assets/provenance. A content change invalidates
// the previous review instead of silently inheriting its approval.
function questionFingerprint(question) {
  return crypto.createHash('sha256').update(canonicalJson(question)).digest('hex');
}

function nonempty(value) { return typeof value === 'string' && value.trim().length > 0; }
function validReviewDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function completeReview(review) {
  return !!review && review.status === 'accepted' && nonempty(review.reviewer)
    && validReviewDate(review.reviewed_at) && nonempty(review.evidence);
}

// An owner's instruction to reuse supplied material is recorded as an owner
// authorization, never relabelled as an exam-board licence or permission letter.
function sourceUseAccepted(source) {
  const permission = source && source.permission;
  if (permission && permission.status === 'permitted' && SOURCED_PERMISSION_BASES.has(permission.basis)
      && completeReview({ status: 'accepted', reviewer: permission.reviewed_by,
        reviewed_at: permission.reviewed_at, evidence: permission.evidence })) return true;
  const authorization = source && source.reuse_authorization;
  return !!authorization && authorization.status === 'authorized-by-owner'
    && authorization.basis === 'user-provided-material'
    && authorization.scope === 'AfroTools past-question practice'
    && nonempty(source.source_file) && /^[a-f0-9]{64}$/.test(source.content_sha256 || '')
    && authorization.material_sha256 === source.content_sha256
    && nonempty(authorization.instruction_ref) && nonempty(authorization.authorized_by)
    && validReviewDate(authorization.authorized_at);
}

function assessQuestion(question, ledger = { questions: {}, sources: {} }, context = {}) {
  const reasons = [];
  const q = question && typeof question === 'object' && !Array.isArray(question) ? question : {};
  const prompt = typeof q.question === 'string' ? q.question.trim() : '';
  const options = q.options && typeof q.options === 'object' && !Array.isArray(q.options) ? q.options : {};
  const keys = Object.keys(options).sort();
  const optionTexts = Object.values(options).map(value => typeof value === 'string' ? value.trim() : '');
  const content = [prompt, ...optionTexts].join(' ');
  const explanation = typeof q.explanation === 'string' ? q.explanation : q.ai_explanation;
  const fingerprint = questionFingerprint(q);
  const review = (ledger.questions || {})[q.id];
  const source = review && (ledger.sources || {})[review.source_id];

  if (!nonempty(q.id)) reasons.push('missing_id');
  if (context.duplicateIds && context.duplicateIds.has(q.id)) reasons.push('duplicate_id');
  if (!nonempty(q.subject)) reasons.push('missing_subject');
  if (prompt.length < 12) reasons.push('incomplete_prompt');
  if (![4, 5, 6].includes(keys.length) || keys.join('') !== 'ABCDEF'.slice(0, keys.length)) reasons.push('incomplete_options');
  if (optionTexts.some(value => !value)) reasons.push('empty_option');
  if (new Set(optionTexts.map(value => value.toLowerCase().replace(/\s+/g, ' '))).size !== optionTexts.length) reasons.push('duplicate_option_text');
  if (q.format !== keys.length) reasons.push('option_format_mismatch');
  if (!nonempty(q.answer)) reasons.push('missing_answer');
  else if (!keys.includes(q.answer)) reasons.push('answer_not_in_options');
  if (OCR_ARTIFACT.test(content)) reasons.push('ocr_or_placeholder_artifact');
  if (/<\/?(?:script|style|head|body|html|iframe|a|div)\b/i.test(content)) reasons.push('markup_in_question');
  if (CONTEXT_REFERENCE.test(prompt) && !nonempty(q.passage)) reasons.push('missing_passage_or_context');
  if ((q.has_diagram || VISUAL_REFERENCE.test(content)) && !(nonempty(q.image) && nonempty(q.image_alt))) reasons.push('missing_visual_or_description');
  if (nonempty(q.image) && !completeReview(review && review.asset_review)) reasons.push('asset_review_missing');
  if (nonempty(q.image)) {
    const assetHash = visualAssetHash(q.image);
    if (!assetHash) reasons.push('unsupported_visual_asset');
    else if (review?.asset_review?.content_sha256 !== assetHash) reasons.push('asset_content_changed');
  }
  if (!nonempty(explanation)) reasons.push('missing_explanation');
  else if (EXPLANATION_UNCERTAINTY.test(explanation)) reasons.push('explanation_requires_correction');
  if (q.verification !== undefined && (!q.verification || typeof q.verification !== 'object'
      || Array.isArray(q.verification)
      || Object.keys(q.verification).sort().join(',') !== 'method,reviewed_at'
      || !AI_VERIFICATION_METHODS.has(q.verification.method)
      || !validReviewDate(q.verification.reviewed_at))) reasons.push('invalid_verification_label');
  if (!review) reasons.push('review_record_missing');
  else {
    if (review.content_sha256 !== fingerprint) reasons.push('review_content_changed');
    if (!completeReview(review.question_review)) reasons.push('question_review_missing');
    if (!completeReview(review.answer_review)) reasons.push('answer_review_missing');
    if (!completeReview(review.explanation_review)) reasons.push('explanation_review_missing');
    if (review.answer_review?.reviewer_type === 'ai'
        && (!AI_VERIFICATION_METHODS.has(q.verification?.method)
          || q.verification.reviewed_at !== review.answer_review.reviewed_at)) {
      reasons.push('verification_label_missing');
    }
    if (!nonempty(review.source_id) || !source) reasons.push('source_record_missing');
  }
  if (!sourceUseAccepted(source)) reasons.push('permission_unverified');
  return { id: q.id || null, subject: q.subject || null, content_sha256: fingerprint,
    state: reasons.length ? 'quarantined' : 'eligible', reasons };
}

function auditQuestions(questions, ledger) {
  const ids = new Map();
  for (const q of questions) if (q && q.id) ids.set(q.id, (ids.get(q.id) || 0) + 1);
  const duplicateIds = new Set([...ids].filter(([, count]) => count > 1).map(([id]) => id));
  const records = questions.map(q => assessQuestion(q, ledger, { duplicateIds }));
  const reasons = {}; const subjects = {};
  for (const record of records) {
    for (const reason of record.reasons) reasons[reason] = (reasons[reason] || 0) + 1;
    const subject = subjects[record.subject || 'unknown'] ||= { total: 0, eligible: 0, quarantined: 0 };
    subject.total++; subject[record.state]++;
  }
  return { total: records.length, eligible: records.filter(r => r.state === 'eligible').length,
    quarantined: records.filter(r => r.state === 'quarantined').length, reasons, subjects, records };
}

module.exports = { canonicalJson, questionFingerprint, completeReview, sourceUseAccepted, assessQuestion, auditQuestions };

'use strict';

const { validatePublication, validateReviewedObject, without } = require('../../../scripts/lib/jamb-publication');
const { auditQuestions } = require('../../../scripts/lib/jamb-content-trust');

function createReviewedBank(pool, index, ledger) {
  validatePublication(index);
  validatePublication(pool, index.review_revision);
  if (!Array.isArray(pool.questions) || pool.count !== pool.questions.length || pool.answered_count !== pool.count
      || index.stats?.total !== pool.count || index.stats?.answered !== pool.count) throw new Error('Invalid JAMB reviewed counts');
  const raw = pool.questions.map(q => without(validateReviewedObject(q), 'review'));
  if (auditQuestions(raw, ledger).quarantined) throw new Error('JAMB publication includes an ineligible question');
  const byId = new Map(pool.questions.map(q => [q.id, q]));
  const counts = {};
  for (const q of pool.questions) counts[q.subject] = (counts[q.subject] || 0) + 1;
  for (const [subject, stats] of Object.entries(index.stats.by_subject || {})) {
    if (stats.total !== (counts[subject] || 0) || stats.answered !== stats.total) throw new Error('JAMB subject counts changed');
  }
  function question(id, revision) {
    if (revision !== index.review_revision || typeof id !== 'string' || !byId.has(id)) {
      const error = new Error('This question is not available in the current reviewed bank. Refresh the practice page.');
      error.code = 'question_unavailable'; throw error;
    }
    return byId.get(id);
  }
  function attempt(body) {
    const ids = body.question_ids;
    if (!Array.isArray(ids) || !ids.length || ids.length > 200 || new Set(ids).size !== ids.length) throw new Error('Invalid question IDs');
    const questions = ids.map(id => question(id, body.pool_revision));
    const subjects = [...new Set(questions.map(q => q.subject))];
    if (!Array.isArray(body.subjects) || subjects.length !== body.subjects.length || subjects.some(s => !body.subjects.includes(s))) {
      throw new Error('Attempt subjects do not match its reviewed questions');
    }
    if (!body.answers || typeof body.answers !== 'object' || Array.isArray(body.answers)) throw new Error('Invalid answers');
    const answers = {}; const totals = {}; const correct = {};
    for (const [key, value] of Object.entries(body.answers)) {
      if (!/^(0|[1-9]\d*)$/.test(key) || Number(key) >= ids.length) throw new Error('Invalid answer index');
      if (value === null || value === '') continue;
      if (typeof value !== 'string' || !Object.hasOwn(questions[Number(key)].options, value)) throw new Error('Invalid answer choice');
      answers[key] = value;
    }
    questions.forEach((q, i) => {
      totals[q.subject] = (totals[q.subject] || 0) + 1;
      correct[q.subject] = (correct[q.subject] || 0) + (answers[i] === q.answer ? 1 : 0);
    });
    const subjectScores = Object.fromEntries(subjects.map(s => [s, Math.round(correct[s] / totals[s] * 100)]));
    // Keep the existing storage scale for compatibility. This is practice
    // performance only and has no validated relationship to a future UTME score.
    const score = Math.round(subjects.reduce((sum, s) => sum + subjectScores[s], 0) / (100 * subjects.length) * 400);
    return { question_ids: ids, subjects, answers, subject_scores: subjectScores, score, review_revision: index.review_revision };
  }
  return { questions: pool.questions, revision: index.review_revision, question, attempt,
    availability: { status: pool.count ? 'ready' : 'awaiting-review', review_revision: index.review_revision,
      available_subjects: Object.keys(counts), counts } };
}

let current;
function getReviewedBank() {
  if (!current) current = createReviewedBank(require('../../../data/jamb/pools/practice-pool.json'),
    require('../../../data/jamb/pools/index.json'), require('../../../data/jamb/review-ledger.json'));
  return current;
}
function dailyAvailability(bank = getReviewedBank()) {
  const counts = {};
  for (const q of bank.questions) if (!q.image && !q.has_diagram) counts[q.subject] = (counts[q.subject] || 0) + 1;
  return { status: Object.keys(counts).length ? 'ready' : 'awaiting-review', review_revision: bank.revision,
    available_subjects: Object.keys(counts), counts };
}
function reviewedTutorRequest(body, bank = getReviewedBank()) {
  const q = bank.question(body.question_id, body.pool_revision);
  if (q.image || q.has_diagram) {
    const error = new Error('This question requires its visual context.'); error.code = 'question_requires_visual'; throw error;
  }
  return { ...body, tool: 'jamb-tutor-' + q.subject, messages: undefined, history: undefined, context: undefined, system: undefined,
    matchedTool: undefined, userContext: undefined,
    message: 'Explain the following reviewed practice question using its reviewed answer and explanation. Do not change the answer key. '
      + 'Label additional AI guidance as AI-generated and acknowledge uncertainty.\n'
      + JSON.stringify({ question: q.question, passage: q.passage, image: q.image, image_alt: q.image_alt,
        options: q.options, answer: q.answer, explanation: q.explanation || q.ai_explanation }) };
}
module.exports = { createReviewedBank, getReviewedBank, dailyAvailability, reviewedTutorRequest };

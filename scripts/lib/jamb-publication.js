'use strict';

const { questionFingerprint: digest, auditQuestions, completeReview, sourceUseAccepted } = require('./jamb-content-trust');

const SUBJECTS = Object.freeze({ english: 'Use of English', mathematics: 'Mathematics', physics: 'Physics',
  chemistry: 'Chemistry', biology: 'Biology', government: 'Government', economics: 'Economics',
  literature: 'Literature in English', crk: 'Christian Religious Knowledge', commerce: 'Commerce', accounts: 'Principles of Accounts' });
const HASH = /^[a-f0-9]{64}$/;
const QUESTION_FIELDS = new Set(['id', 'subject', 'year', 'num', 'question', 'options', 'answer', 'format',
  'has_diagram', 'ai_explanation', 'explanation', 'passage', 'image', 'image_alt', 'topic', 'verification']);

function without(object, key) { const copy = { ...object }; delete copy[key]; return copy; }
function reviewed(object) { return { ...object, review: { status: 'reviewed', content_sha256: digest(object) } }; }
function seal(object, revision) {
  const payload = { schema_version: 1, review_revision: revision, ...object };
  return { ...payload, publication: { policy: 'reviewed-only', content_sha256: digest(payload) } };
}
function validatePublication(payload, revision) {
  if (!payload || payload.schema_version !== 1 || !HASH.test(payload.review_revision || '')
      || (revision && payload.review_revision !== revision)
      || payload.publication?.policy !== 'reviewed-only'
      || payload.publication.content_sha256 !== digest(without(payload, 'publication'))) {
    throw new Error('JAMB publication is missing, stale or has changed');
  }
  return payload;
}
function validateReviewedObject(object) {
  if (!object || object.review?.status !== 'reviewed'
      || object.review.content_sha256 !== digest(without(object, 'review'))) throw new Error('JAMB object has no matching review digest');
  return object;
}
function normalizeCard(deck, card) {
  const content = { deck_id: deck.id, subject: deck.subject, front: card.front, back: card.back };
  return { id: deck.id + '-' + digest(content), ...content };
}
function buildPublications(pool, flashcards, ledger) {
  if (ledger?.schema_version !== 1 || !Array.isArray(pool?.questions) || !Array.isArray(flashcards?.decks)) {
    throw new Error('Invalid JAMB source or review ledger');
  }
  const revision = digest({ policy_version: 1, pool, flashcards, ledger });
  const audit = auditQuestions(pool.questions, ledger);
  const questions = pool.questions.filter((q, i) => audit.records[i].state === 'eligible').map(q => {
    if (!Object.hasOwn(SUBJECTS, q.subject) || Object.keys(q).some(k => !QUESTION_FIELDS.has(k))) {
      throw new Error('Reviewed question has unsupported subject or public fields: ' + q.id);
    }
    return reviewed(q);
  });
  const files = {};
  const counts = list => ({ count: list.length, answered_count: list.length, questions: list });
  files['pools/practice-pool.json'] = seal(counts(questions), revision);
  const bySubject = {};
  const patterns = {};
  for (const [subject, name] of Object.entries(SUBJECTS)) {
    const subset = questions.filter(q => q.subject === subject);
    bySubject[subject] = { name, total: subset.length, answered: subset.length, with_diagrams: subset.filter(q => q.has_diagram).length };
    files['pools/' + subject + '.json'] = seal({ subject, name, ...counts(subset) }, revision);
    if (!subset.length) continue;
    const topics = new Map(); const yearDistribution = {};
    for (const q of subset) {
      const topic = typeof q.topic === 'string' && q.topic.trim() ? q.topic.trim() : 'Unclassified';
      if (!topics.has(topic)) topics.set(topic, { topic, total: 0, yearly: {} });
      const item = topics.get(topic); item.total++;
      if (Number.isInteger(q.year)) {
        item.yearly[q.year] = (item.yearly[q.year] || 0) + 1;
        yearDistribution[q.year] = (yearDistribution[q.year] || 0) + 1;
      }
    }
    patterns[subject] = { name, total_questions: subset.length, topics: [...topics.values()].sort((a, b) => a.topic.localeCompare(b.topic)),
      years_covered: Object.keys(yearDistribution).map(Number).sort((a, b) => a - b), year_distribution: yearDistribution,
      predictions_2026: [], recent_years_used: [] };
  }
  const years = questions.map(q => q.year).filter(Number.isInteger);
  files['pools/index.json'] = seal({ stats: { total: questions.length, answered: questions.length,
    with_diagrams: questions.filter(q => q.has_diagram).length, by_subject: bySubject },
  year_range: years.length ? [Math.min(...years), Math.max(...years)] : [], subjects: Object.keys(SUBJECTS) }, revision);
  files['pools/patterns.json'] = seal({ subjects: patterns }, revision);
  const decks = [];
  const deckIds = new Set();
  for (const deck of flashcards.decks) {
    if (!deck.id || deckIds.has(deck.id) || !Object.hasOwn(SUBJECTS, deck.subject) || !Array.isArray(deck.cards)) {
      throw new Error('Invalid or duplicate source flashcard deck');
    }
    deckIds.add(deck.id);
    const normalized = deck.cards.map(card => normalizeCard(deck, card));
    const frequencies = new Map();
    for (const card of normalized) frequencies.set(card.id, (frequencies.get(card.id) || 0) + 1);
    const cards = normalized.filter(card => {
      const review = ledger.flashcards?.[card.id];
      return frequencies.get(card.id) === 1 && typeof card.front === 'string' && card.front.trim()
        && typeof card.back === 'string' && card.back.trim() && !/<\/?(?:script|iframe|html)\b/i.test(card.front + card.back)
        && review?.content_sha256 === digest(card) && completeReview(review.front_review) && completeReview(review.back_review)
        && sourceUseAccepted(ledger.sources?.[review.source_id]);
    }).map(reviewed);
    if (cards.length) decks.push(reviewed({ id: deck.id, subject: deck.subject, name: deck.name, emoji: deck.emoji,
      description: cards.length + ' reviewed study cards', cards }));
  }
  files['flashcard-decks.json'] = seal({ decks }, revision);
  return { revision, audit, files };
}

module.exports = { SUBJECTS, without, reviewed, seal, validatePublication, validateReviewedObject, normalizeCard, buildPublications };

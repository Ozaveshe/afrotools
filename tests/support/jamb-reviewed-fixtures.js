'use strict';
const { questionFingerprint } = require('../../scripts/lib/jamb-content-trust');
const revision = 'a'.repeat(64);
function reviewed(question) {
  return { ...question, review: { status: 'reviewed', content_sha256: questionFingerprint(question) } };
}
function publication(payload) {
  return { ...payload, publication: { policy: 'reviewed-only', content_sha256: questionFingerprint(payload) } };
}
function questions() {
  return ['first', 'middle', 'last'].map((id, num) => reviewed({ id, num, subject: 'mathematics', year: 2027,
    question: 'What is the value of 6 multiplied by 7? Synthetic fixture ' + id,
    options: { A: '36', B: '42', C: '48', D: '49' }, answer: 'B', format: 4,
    has_diagram: false, explanation: 'Six groups of seven contain 42 items.' }));
}
function bank(rows = questions(), rev = revision) {
  const bySubject = {};
  rows.forEach(q => { bySubject[q.subject] = { answered: (bySubject[q.subject]?.answered || 0) + 1 }; });
  return {
    index: publication({ schema_version: 1, review_revision: rev, stats: { by_subject: bySubject } }),
    pool: publication({ schema_version: 1, review_revision: rev, count: rows.length, answered_count: rows.length, questions: rows })
  };
}
module.exports = { revision, reviewed, publication, questions, bank };

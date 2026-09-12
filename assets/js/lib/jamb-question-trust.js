(function (root) {
  'use strict';
  var registered = new WeakMap();
  var currentRevision = null;
  var HEX = /^[a-f0-9]{64}$/;

  function canonicalJson(value) {
    if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
    if (value && typeof value === 'object') {
      return '{' + Object.keys(value).sort().filter(function (key) { return value[key] !== undefined; })
        .map(function (key) { return JSON.stringify(key) + ':' + canonicalJson(value[key]); }).join(',') + '}';
    }
    return JSON.stringify(value);
  }
  async function digest(value) {
    if (!root.crypto || !root.crypto.subtle) throw new Error('Question verification is unavailable in this browser.');
    var bytes = await root.crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalJson(value)));
    return Array.from(new Uint8Array(bytes)).map(function (byte) { return byte.toString(16).padStart(2, '0'); }).join('');
  }
  function without(value, key) {
    var copy = {};
    Object.keys(value).forEach(function (name) { if (name !== key) copy[name] = value[name]; });
    return copy;
  }
  function freeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.keys(value).forEach(function (key) { freeze(value[key]); });
      Object.freeze(value);
    }
    return value;
  }
  async function validatePublication(payload, index) {
    if (!payload || payload.schema_version !== 1 || !HEX.test(payload.review_revision || '')) {
      throw new Error('The reviewed question publication is unavailable.');
    }
    if (index && payload.review_revision !== index.review_revision) throw new Error('Question reviews changed. Reload to use the current bank.');
    var publication = payload.publication;
    if (!publication || publication.policy !== 'reviewed-only' || !HEX.test(publication.content_sha256 || '') ||
        await digest(without(payload, 'publication')) !== publication.content_sha256) {
      throw new Error('The question publication could not be verified.');
    }
    return freeze(payload);
  }
  async function validateReviewedObject(object) {
    if (!object || !object.review || object.review.status !== 'reviewed' || !HEX.test(object.review.content_sha256 || '') ||
        await digest(without(object, 'review')) !== object.review.content_sha256) {
      throw new Error('An item has no valid content review.');
    }
    return freeze(object);
  }
  async function fetchJson(url) {
    var response = await root.fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('The reviewed bank could not be loaded. Please try again.');
    return response.json();
  }
  async function fetchIndex() {
    try {
      var index = await validatePublication(await fetchJson('/data/jamb/pools/index.json'));
      currentRevision = index.review_revision;
      return index;
    } catch (error) {
      currentRevision = null;
      throw error;
    }
  }
  async function validatePool(pool, index) {
    await validatePublication(index);
    await validatePublication(pool, index);
    if (currentRevision !== index.review_revision) throw new Error('Question reviews changed; refresh the current index.');
    if (!Array.isArray(pool.questions) || pool.count !== pool.questions.length || pool.answered_count !== pool.questions.length) {
      throw new Error('The reviewed question counts are invalid.');
    }
    var ids = new Set();
    for (var question of pool.questions) {
      await validateReviewedObject(question);
      var options = question.options;
      var keys = options && !Array.isArray(options) ? Object.keys(options).sort() : [];
      if (typeof question.id !== 'string' || !question.id.trim() || ids.has(question.id) ||
          typeof question.subject !== 'string' || !question.subject.trim() ||
          typeof question.question !== 'string' || question.question.trim().length < 12 ||
          !/^(ABCD|ABCDE|ABCDEF)$/.test(keys.join('')) || question.format !== keys.length ||
          !keys.includes(question.answer) || keys.some(function (key) { return typeof options[key] !== 'string' || !options[key].trim(); }) ||
          new Set(keys.map(function (key) { return options[key].trim().toLowerCase(); })).size !== keys.length) {
        throw new Error('A reviewed question has invalid or duplicate content.');
      }
      ids.add(question.id);
    }
    // Register only after the entire publication passes, never a partial bank.
    pool.questions.forEach(function (question) { registered.set(question, pool.review_revision); });
    return pool;
  }
  async function loadPool(url) {
    var index = await fetchIndex();
    try {
      return await validatePool(await fetchJson(url || '/data/jamb/pools/practice-pool.json'), index);
    } catch (error) {
      currentRevision = null;
      throw error;
    }
  }
  function assertEligible(questions, revision) {
    var ids = new Set();
    if (!HEX.test(revision || '') || revision !== currentRevision || !Array.isArray(questions)) throw new Error('Question reviews changed; reload the reviewed bank.');
    questions.forEach(function (question) {
      if (!question || registered.get(question) !== revision || ids.has(question.id)) throw new Error('Unreviewed or duplicate question; reload the reviewed bank.');
      ids.add(question.id);
    });
    return true;
  }
  root.AfroJAMB = root.AfroJAMB || {};
  root.AfroJAMB.QuestionTrust = Object.freeze({ canonicalJson: canonicalJson, digest: digest,
    fetchIndex: fetchIndex, validatePublication: validatePublication, validateReviewedObject: validateReviewedObject,
    validatePool: validatePool, loadPool: loadPool, assertEligible: assertEligible });
}(window));

(function (root) {
  'use strict';

  // These revisions identify the two earlier reviewed, original-only banks.
  // The hashes below are pinned from their published question pools, not
  // recomputed from the current bank. Existing snapshots store only IDs.
  var LEGACY_MAX = Object.freeze({
    '84a11be138a1e2b25d0db124f8d925290cfb00282d71021dd5d9f653c1a6d3bd': 12,
    '7fdc0826891c9b33d6f83be340f0ab4f3d14b7bec805bc53d6fe03d3534099a3': 20
  });
  var LEGACY_HASHES = Object.freeze({
    mathematics: Object.freeze([
      "59a439a8a2bf7f0f1c670727a783ba2b3378a10d0d5b6b6513fc1cc4e87ee078",
      "f1e4a4abd207738ad2ab229dc1fe8d8d085796e63945092f077fd286603b3f0c",
      "0d89de80192f71b9cb105c13ba604d24a009ef19f357a6d3f5963466a67befea",
      "39a61229e52c231a12d9db7eb999aab0bf69e3049a1799c6b7583b8a52c33ffd",
      "fda9879287ee78eb9efd2a1fe605050d803f637a8cc7be4be8d9679224a6b632",
      "c14b9d72e6bfcd47f1031dd10acde439717e1b0d8070d95491f31ee721c76dbc",
      "aae8a35237d1028e4a9a4c50e9594ea25e61bb6ea2388a0fbfd071f8ff9ece44",
      "7bc66155cdde2f760e97b6bb0f87b6a57a946709eae2f49b38180999b4b33c9b",
      "397ce53297e6c0d6dd5e908d0ea40f73ad623ef72140b9da14e7fe3070ce4b8b",
      "cb300b7c0f50c819aa49d7912e07c0e6586d3d12ff18779e00f6f549478a2abb",
      "ccbeb9b8ed2131b124451852acda4e0969fe6dcf1bc6e0f2e6117e2bf2add258",
      "412da1763faa94a5a2e119cba3108e33a937b2df30d5ffe1e757624096439cfb",
      "c487ca0a19d422077682c9d29a95781e16391daf7177685e4f26e8963066c6a0",
      "f40278f2aafc0bf78d4d163de2831235371ee8b1bd051a7759992bb2466cfff6",
      "a573712cee2b8d2b85233ea16b8e6136aabe306000f87d6458e37c80f374f8b7",
      "f13575dc991ed32c90bbefa8208b1b4e75382f27c5798aad1f3f111ae41c6ad3",
      "cbc85ac250674c48d1272f6b97c3a03f66754414035102233969f42e0623eeac",
      "c17a90d45b8a6003be4262b1df8679c9ad1def688d19b22443010062c1dc7e6d",
      "62713edbc1f2b942db263dd0635871a29c1f201648227ce6ea17edf28643a445",
      "e3609a84d3aecd3183dc25efe50e47fa52c7128c4192a17c41102ed072b06b8b"
    ]),
    english: Object.freeze([
      "8ec83a45dc6243032e83c2e1a82701a2173991a3b39af703787c1e2d55d6e1ba",
      "306708ece3b2a181b1b7faaef4ebdc0acae4e1b4c049e250d05234f12ebc1d92",
      "4b46d10797109bb11c040fe485ace808faecef09fc4ee76d154f377fa6ed3829",
      "a695faeb8fd2ded8e23fb3647fe3d94bda7d82eb1942a77ab101f8e5a0bf2ac6",
      "a4ad60a811abfe53e8458288a8d80b74f2902794462766c225139a160da3fb68",
      "38b1f5e153e25aae11deb5c30a99e6286b0b322f2c1d00bcfdcb3a34e6e5d7a5",
      "431cec848297e982fcf6629b405fd3ed2c92d06adad5e673f8d7bff6a53ff1c1",
      "a8fb2f185785cb9d74bdcb36ae347da344ec254768cd3a734e6576a3f8a2edef",
      "8f3fc17594aa6c2b5ebd9eaa2615e19dc487009a25bb4802aa952486b0906cc9",
      "6ade9fda6489ffa2da1533bea11a7ce659d9d82250022a8bf751955cfadbe365",
      "b212ded274f004ac4c7194edfd42cd14b3d7a0c81ac64a071d0ce9fe99966478",
      "f8bc6219c9e5e9037084ec6b389522be6ca0c941793366efb19e8fdd5b5368cb",
      "60bbb6da6b5ba6505e5b67f0d6719ab5b589c4659b0108d66e8d2b5a8a13045b",
      "2b730ef78e3e9d5e91a32068819663f3ac13a732521fe19d2bf71188808b38e8",
      "e7363e429d85751ce49b2d6aa911f8eb04ab2cf8139775249e40c3ccfd01fe0d",
      "53dbe8fde865d1d4b49831612d05febc830c8fa2637ffdbf8df1e2234627b5f0",
      "cf8dbe4e8905a78f2f6c111eae113e5d26ddbcecce133654484a67e36b9081c1",
      "e784d6c71e1df069977589b82659b2edbeec0307c25083c9a57aa59fa21cfbf6",
      "af90024f62c899910f2c04e6e333b5e4bb02fa5cf294c5bb74f455b42ddfae12",
      "5e40b2af3daedea4f8363212a8e2abaca8574d984ec7713804bc86c25d333d0d"
    ])
  });
  var HEX = /^[a-f0-9]{64}$/;

  function indexedMap(value, length, validValue) {
    return !!value && typeof value === 'object' && !Array.isArray(value) &&
      Object.keys(value).every(function (key) {
        return /^(0|[1-9][0-9]*)$/.test(key) && Number(key) < length && validValue(value[key], Number(key));
      });
  }

  function migrate(saved, pool) {
    if (!saved || saved.mode !== 'original-practice' || saved.year !== null ||
        !pool || pool.kind !== 'original-practice' ||
        pool.collection_id !== 'afrotools-original-jamb-practice-v1' ||
        !HEX.test(pool.review_revision || '') || !HEX.test(saved.poolRevision || '') ||
        !Array.isArray(pool.questions) || !Array.isArray(saved.questionIds) ||
        saved.questionIds.length !== 12 || new Set(saved.questionIds).size !== 12 ||
        !Array.isArray(saved.subjects) || saved.subjects.length !== 1 ||
        !Number.isInteger(saved.currentIndex) || saved.currentIndex < 0 || saved.currentIndex >= 12 ||
        !Number.isFinite(saved.startedAt) || saved.startedAt <= 0 ||
        saved.durationMs !== 20 * 60 * 1000) return null;

    var subject = saved.subjects[0];
    var prefix = subject === 'mathematics' ? 'math' : subject === 'english' ? 'english' : null;
    if (!prefix || saved.currentSubject !== subject) return null;

    // The current publication must have passed its full seal and per-item
    // checks before any old snapshot can be translated to its revision.
    var trust = root.AfroJAMB && root.AfroJAMB.QuestionTrust;
    try {
      if (!trust || !trust.assertEligible(pool.questions, pool.review_revision)) return null;
    } catch (error) { return null; }

    var sameRevision = pool.review_revision === saved.poolRevision;
    var max = LEGACY_MAX[saved.poolRevision];
    var savedHashes = saved.originalReviewSchema === 2 && Array.isArray(saved.questionReviewHashes) &&
      saved.questionReviewHashes.length === 12 ? saved.questionReviewHashes : null;
    if (!sameRevision && !max && !savedHashes) return null;
    var currentById = new Map(pool.questions.map(function (question) { return [question.id, question]; }));
    var selected = [];
    for (var i = 0; i < saved.questionIds.length; i++) {
      var id = saved.questionIds[i];
      var match = typeof id === 'string' && new RegExp('^ato-' + prefix + '-v1-([0-9]{2})$').exec(id);
      if (!match) return null;
      var ordinal = Number(match[1]);
      var question = currentById.get(id);
      var expected = sameRevision ? question && question.review && question.review.content_sha256 :
        max ? ordinal >= 1 && ordinal <= max && LEGACY_HASHES[subject][ordinal - 1] : savedHashes[i];
      if (!HEX.test(expected || '') || !question || question.subject !== subject ||
          question.year !== null || question.num !== null || question.format !== 4 ||
          question.review?.status !== 'reviewed' || question.review.content_sha256 !== expected) return null;
      selected.push(question);
    }
    if (!indexedMap(saved.answers, selected.length, function (answer, index) {
      return Object.prototype.hasOwnProperty.call(selected[index].options, answer);
    }) || !indexedMap(saved.marked, selected.length, function (marked) { return typeof marked === 'boolean'; })) return null;

    // Work only in memory. CBT.restore writes the new revision after its own
    // current-pool verification; failed migrations leave saved history alone.
    return Object.assign({}, saved, { poolRevision: pool.review_revision });
  }

  var api = Object.freeze({ migrate: migrate });
  root.AfroJAMB = root.AfroJAMB || {};
  root.AfroJAMB.OriginalResume = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
}(typeof window !== 'undefined' ? window : globalThis));

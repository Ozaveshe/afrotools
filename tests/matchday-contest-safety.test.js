#!/usr/bin/env node
'use strict';

const assert = require('assert');
const Safety = require('../assets/js/lib/matchday-contest-safety.js');

assert.strictEqual(Safety.isLocked('2026-06-11T20:00:00Z', '2026-06-11T20:00:01Z'), true, 'deadline should lock after kickoff');
assert.strictEqual(Safety.isLocked('2026-06-11T20:00:00Z', '2026-06-11T19:59:59Z'), false, 'deadline should stay open before kickoff');

let edit = Safety.canEditPrediction({ lockDeadlineUtc: '2026-06-11T20:00:00Z' }, '2026-06-11T20:00:01Z');
assert.strictEqual(edit.allowed, false, 'entry should not edit after lock');
assert.strictEqual(edit.reason, 'locked-before-kickoff');

edit = Safety.canEditPrediction({ lockedAt: '2026-06-11T19:59:59Z' }, '2026-06-11T19:59:58Z');
assert.strictEqual(edit.allowed, false, 'server locked entries should not edit');
assert.strictEqual(edit.reason, 'server-locked');

let record = Safety.validateSafetyRecord({
  ipHash: 'sha256:iphash',
  userAgentHash: 'sha256:uahash',
  deviceSignalHash: 'sha256:devicehash',
  termsAcceptedAt: '2026-06-01T12:00:00Z',
  submittedAt: '2026-06-01T12:01:00Z'
});
assert.strictEqual(record.valid, true, 'hashed safety signals should validate');

record = Safety.validateSafetyRecord({
  ipAddress: '203.0.113.7',
  userAgent: 'raw UA',
  deviceFingerprint: 'raw device'
});
assert.strictEqual(record.valid, false, 'raw sensitive signals should be rejected');
assert(record.errors.length >= 3, 'raw signal validation should report all unsafe keys');

const entries = [
  {
    entryId: 'a',
    ipHash: 'sha256:ip1',
    userAgentHash: 'sha256:ua1',
    deviceSignalHash: 'sha256:device1',
    prediction: { matchPick: { matchId: 'm1', resultPick: 'morocco' } }
  },
  {
    entryId: 'b',
    ipHash: 'sha256:ip1',
    userAgentHash: 'sha256:ua2',
    deviceSignalHash: 'sha256:device2',
    prediction: { matchPick: { matchId: 'm1', resultPick: 'morocco' } }
  },
  {
    entryId: 'c',
    ipHash: 'sha256:ip3',
    userAgentHash: 'sha256:ua2',
    deviceSignalHash: 'sha256:device3',
    prediction: { matchPick: { matchId: 'm1', resultPick: 'senegal' } }
  }
];

const duplicateSignals = Safety.detectDuplicateSignals(entries);
assert.strictEqual(duplicateSignals.ipHashClusters.length, 1, 'same IP hash should be clustered');
assert.strictEqual(duplicateSignals.userAgentHashClusters.length, 1, 'same user agent hash should be clustered');
assert.strictEqual(duplicateSignals.deviceSignalHashClusters.length, 0, 'unique device hashes should not be clustered');

const identicalPatterns = Safety.detectIdenticalPredictionPatterns(entries);
assert.strictEqual(identicalPatterns.length, 1, 'identical prediction signatures should be clustered');
assert.deepStrictEqual(identicalPatterns[0].entryIds, ['a', 'b']);

const gate = Safety.buildLaunchGate({
  serverSideLockRequired: true,
  emailVerificationRequired: true,
  oneAccountPerPerson: true,
  adminReviewRequired: true,
  manualWinnerVerificationRequired: true,
  legalReviewStatus: 'required-before-launch'
});
assert.strictEqual(gate.blocked, true, 'static MVP should keep prize launch blocked');
assert(gate.blockers.includes('backend-enforcement-not-connected'), 'backend blocker should remain explicit');

console.log('matchday-contest-safety.test.js passed');

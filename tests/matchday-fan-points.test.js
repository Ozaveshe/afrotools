'use strict';

const assert = require('assert');
const fanPoints = require('../assets/js/lib/matchday-fan-points.js');

function event(type, extra = {}) {
  return Object.assign({
    eventId: `${type}-${Math.random().toString(36).slice(2)}`,
    type,
    timestamp: '2026-06-12T12:00:00.000Z',
    referrerId: 'fan-a',
    referredUserId: 'fan-b'
  }, extra);
}

function testZeroPointReferralEvents() {
  const score = fanPoints.calculateFanScore([
    event('referral_link_copied'),
    event('referral_visit')
  ]);
  assert.strictEqual(score.fanPoints, 0, 'copy and visit events must not award Fan Points');
  assert.strictEqual(score.referralPoints, 0, 'copy and visit events must not award referral points');
}

function testPendingUntilLockedPrediction() {
  const pending = fanPoints.calculateFanScore([
    event('referral_verified_session')
  ]);
  assert.strictEqual(pending.fanPoints, 0, 'verified referral stays pending until first locked prediction');
  assert.strictEqual(pending.pendingReferralPoints, 2, 'verified referral should expose pending Fan Points');

  const awarded = fanPoints.calculateFanScore([
    event('referral_verified_session'),
    event('referral_first_locked_prediction')
  ]);
  assert.strictEqual(awarded.referralPoints, 5, 'verified plus first locked prediction should award 5 Fan Points');
  assert.strictEqual(awarded.fanPoints, 5, 'awarded referral points should count as Fan Points');
}

function testReferralCapAndDeduplication() {
  const events = [];
  for (let i = 0; i < 10; i += 1) {
    events.push(event('referral_verified_session', { referredUserId: `fan-${i}` }));
    events.push(event('referral_first_locked_prediction', { referredUserId: `fan-${i}` }));
  }
  events.push(event('referral_verified_session', { referredUserId: 'fan-1' }));
  events.push(event('referral_first_locked_prediction', { referredUserId: 'fan-1' }));
  const score = fanPoints.calculateFanScore(events);
  assert.strictEqual(score.referralPoints, 25, 'referral points should cap at 25');
}

function testPredictionPointsStaySeparate() {
  const row = fanPoints.buildScoreTypes(18, [
    event('referral_verified_session'),
    event('referral_first_locked_prediction'),
    event('whatsapp_share'),
    event('share_card_cta')
  ]);
  assert.strictEqual(row.predictionPoints, 18, 'Prediction Points must remain unchanged by referrals and shares');
  assert.strictEqual(row.cashPrizePoints, 18, 'cash-prize score must mirror Prediction Points only');
  assert(row.fanPoints > 0, 'Fan Points should still count non-cash engagement');
  assert(row.note.includes('never changes Prediction Points'), 'separation note should be explicit');
}

function testReferralFlags() {
  const flags = fanPoints.findReferralFlags([
    event('referral_verified_session', { referrerId: 'fan-a', referredUserId: 'fan-a' }),
    event('referral_verified_session', { referredUserId: 'fan-b', deviceSignalHash: 'device-1', ipHash: 'ip-1' }),
    event('referral_verified_session', { referredUserId: 'fan-c', deviceSignalHash: 'device-1', ipHash: 'ip-1', timestamp: '2026-06-12T12:02:00.000Z' }),
    event('referral_verified_session', { referredUserId: 'fan-d', ipHash: 'ip-1', timestamp: '2026-06-12T12:03:00.000Z' })
  ], { clusterThreshold: 3, rapidWindowMinutes: 10 });
  const ruleIds = new Set(flags.map((flag) => flag.ruleId));
  assert(ruleIds.has('self-referral'), 'self-referrals should be flagged');
  assert(ruleIds.has('same-device-referral'), 'same-device referrals should be flagged');
  assert(ruleIds.has('repeated-ip-cluster'), 'repeated IP clusters should be flagged');
  assert(ruleIds.has('suspicious-rapid-signups'), 'rapid signup clusters should be flagged');
}

testZeroPointReferralEvents();
testPendingUntilLockedPrediction();
testReferralCapAndDeduplication();
testPredictionPointsStaySeparate();
testReferralFlags();

console.log('Matchday fan points tests passed.');

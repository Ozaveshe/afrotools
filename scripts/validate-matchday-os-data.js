#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'data', 'matchday-os', 'tournament.json');
const CONTENT_PATH = path.join(ROOT, 'data', 'matchday-os', 'content.json');

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function readData() {
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

function readContent() {
  return JSON.parse(fs.readFileSync(CONTENT_PATH, 'utf8'));
}

function assertId(value, label) {
  assert(typeof value === 'string' && /^[a-z0-9][a-z0-9_-]*$/.test(value), `${label} must be a slug id`);
}

function validateUnique(items, getId, label) {
  const seen = new Set();
  for (const item of items) {
    const id = getId(item);
    assertId(id, `${label} id`);
    assert(!seen.has(id), `Duplicate ${label} id: ${id}`);
    seen.add(id);
  }
  return seen;
}

function validateTimeZones(data) {
  const cities = data.timeZones && data.timeZones.displayCities;
  assert(Array.isArray(cities) && cities.length >= 16, 'timeZones.displayCities must include the required African city set');
  const required = [
    'lagos', 'abuja', 'accra', 'abidjan', 'dakar', 'casablanca', 'cairo', 'johannesburg',
    'nairobi', 'addis-ababa', 'kampala', 'dar-es-salaam', 'kigali', 'kinshasa', 'lusaka', 'harare'
  ];
  const cityIds = new Set(cities.map((city) => city.cityId));
  for (const id of required) assert(cityIds.has(id), `Missing time-zone city: ${id}`);

  for (const city of cities) {
    assertId(city.cityId, 'cityId');
    assert(typeof city.city === 'string' && city.city.length >= 2, `${city.cityId} city is required`);
    assert(typeof city.timeZone === 'string' && city.timeZone.startsWith('Africa/'), `${city.cityId} must use an Africa/* time zone`);
    try {
      new Intl.DateTimeFormat('en', { timeZone: city.timeZone }).format(new Date());
    } catch (error) {
      fail(`${city.cityId} has invalid IANA timeZone: ${city.timeZone}`);
    }
  }
}

function validateTeams(data) {
  const teams = data.teams;
  assert(Array.isArray(teams) && teams.length > 0, 'teams must be a non-empty array');
  const teamIds = validateUnique(teams, (team) => team.teamId, 'team');
  const africanTeams = teams.filter((team) => team.isAfricanTeam);
  assert(africanTeams.length >= 10, 'expected at least 10 African teams');

  for (const team of teams) {
    assert(typeof team.name === 'string' && team.name.length >= 2, `${team.teamId} name is required`);
    assert(typeof team.shortLabel === 'string' && team.shortLabel.length >= 2, `${team.teamId} shortLabel is required`);
    assert(typeof team.isAfricanTeam === 'boolean', `${team.teamId} isAfricanTeam must be boolean`);
    if (team.isAfricanTeam) {
      assert(team.confederation === 'CAF', `${team.teamId} African team must have confederation CAF`);
      assert(typeof team.fanRoomSlug === 'string' && team.fanRoomSlug.length >= 2, `${team.teamId} fanRoomSlug is required`);
      assert(/^#[0-9A-Fa-f]{6}$/.test(team.primaryColor), `${team.teamId} primaryColor must be hex`);
      assert(/^#[0-9A-Fa-f]{6}$/.test(team.secondaryColor), `${team.teamId} secondaryColor must be hex`);
    }
  }

  return teamIds;
}

function validateGroups(data, teamIds) {
  const groups = data.groups || [];
  const groupIds = validateUnique(groups, (group) => group.groupId, 'group');
  for (const group of groups) {
    assert(typeof group.name === 'string' && group.name.length >= 2, `${group.groupId} name is required`);
    assert(Array.isArray(group.teamIds), `${group.groupId} teamIds must be an array`);
    for (const teamId of group.teamIds) {
      assert(teamId === null || teamIds.has(teamId), `${group.groupId} references missing team ${teamId}`);
    }
    assert(Array.isArray(group.tableRows), `${group.groupId} tableRows must be an array`);
    for (const row of group.tableRows) {
      assert(row.teamId === null || teamIds.has(row.teamId), `${group.groupId} table row references missing team ${row.teamId}`);
      for (const field of ['played', 'won', 'drawn', 'lost', 'goalsFor', 'goalsAgainst', 'goalDiff', 'points']) {
        assert(Number.isFinite(row[field]), `${group.groupId} ${field} must be numeric`);
      }
    }
  }
  return groupIds;
}

function validateFixtures(data, teamIds, groupIds, venueIds, statuses, phases) {
  const fixtures = data.fixtures || [];
  validateUnique(fixtures, (fixture) => fixture.matchId, 'fixture');
  for (const fixture of fixtures) {
    assert(phases.has(fixture.stage), `${fixture.matchId} has unknown stage ${fixture.stage}`);
    assert(fixture.group === null || groupIds.has(fixture.group), `${fixture.matchId} has unknown group ${fixture.group}`);
    assert(fixture.homeTeamId === null || teamIds.has(fixture.homeTeamId), `${fixture.matchId} has unknown homeTeamId ${fixture.homeTeamId}`);
    assert(fixture.awayTeamId === null || teamIds.has(fixture.awayTeamId), `${fixture.matchId} has unknown awayTeamId ${fixture.awayTeamId}`);
    assert(venueIds.has(fixture.venue), `${fixture.matchId} has unknown venue ${fixture.venue}`);
    assert(statuses.has(fixture.status), `${fixture.matchId} has unknown status ${fixture.status}`);
    assert(typeof fixture.resultFinal === 'boolean', `${fixture.matchId} resultFinal must be boolean`);
    assert(typeof fixture.isAfricaFocus === 'boolean', `${fixture.matchId} isAfricaFocus must be boolean`);
    assert(Array.isArray(fixture.featuredMarkets), `${fixture.matchId} featuredMarkets must be an array`);
    if (fixture.kickoffUtc !== null) {
      const parsed = new Date(fixture.kickoffUtc);
      assert(!Number.isNaN(parsed.getTime()), `${fixture.matchId} kickoffUtc must be ISO date or null`);
    }
    if (fixture.status === 'placeholder') {
      assert(fixture.isPlaceholder === true, `${fixture.matchId} placeholder status requires isPlaceholder=true`);
      assert(fixture.homeScore === null && fixture.awayScore === null && fixture.resultFinal === false, `${fixture.matchId} placeholder cannot carry score/final result`);
    }
  }
}

function collectKeys(value, keys = []) {
  if (!value || typeof value !== 'object') return keys;
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, keys);
    return keys;
  }
  for (const key of Object.keys(value)) {
    keys.push(key);
    collectKeys(value[key], keys);
  }
  return keys;
}

function validatePredictionGame(data) {
  const game = data.predictionGame;
  assert(game && game.freeToEnter === true && game.skillBased === true, 'predictionGame must be free-to-enter and skill-based');
  assert(game.entryCostUsd === 0, 'predictionGame entryCostUsd must be 0');
  assert(game.mode === 'frontend-local-only', 'predictionGame mode must state frontend-local-only until persistence exists');
  assert(game.lockPolicy && game.lockPolicy.label === 'Predictions lock before kickoff', 'predictionGame lock policy must expose kickoff locking');
  validatePrizeRules(game);
  assert(game.leaderboard && Array.isArray(game.leaderboard.rows) && game.leaderboard.rows.length === 0, 'predictionGame leaderboard must stay empty until backend persistence exists');
  assert(game.scoring, 'predictionGame scoring config is required');
  const expected = {
    correctWinner: 3,
    correctDraw: 4,
    exactScore: 8,
    correctGroupQualifier: 10,
    correctChampion: 25,
    africanTeamBonus: 2
  };
  for (const [key, value] of Object.entries(expected)) {
    assert(game.scoring[key] === value, `predictionGame scoring.${key} must be ${value}`);
  }
  const typeIds = new Set((game.predictionTypes || []).map((type) => type.typeId));
  for (const required of ['match_winner', 'exact_score', 'draw_prediction', 'group_qualifiers', 'best_african_team', 'semi_finalists', 'finalists', 'champion']) {
    assert(typeIds.has(required), `predictionGame missing prediction type ${required}`);
  }
  const requiredSchemas = ['prediction', 'userPrediction', 'scoreCalculation', 'leaderboardRow', 'lockDeadline'];
  for (const schema of requiredSchemas) {
    assert(game.schemas && game.schemas[schema], `predictionGame missing ${schema} schema`);
  }
  const blockedKeys = new Set(['odds', 'stake', 'wager', 'entryFee', 'paidEntry', 'cashOut', 'payout']);
  for (const key of collectKeys(game)) {
    assert(!blockedKeys.has(key), `predictionGame must not define gambling/payment key: ${key}`);
  }
  validateFanPoints(game.fanPoints);
  validateAntiCheat(game.antiCheat);
}

function validatePrizeRules(game) {
  assert(game.prizePoolUsd === 1200, 'predictionGame prizePoolUsd must be 1200');
  assert(game.prizeMaxUsd === 500, 'predictionGame prizeMaxUsd must be 500');
  assert(game.prizeHeadline && game.prizeHeadline.includes('Win up to $500'), 'predictionGame prizeHeadline must mention win up to $500');
  assert(Array.isArray(game.prizeTable) && game.prizeTable.length === 10, 'predictionGame prizeTable must include Top 10 rows');
  const total = game.prizeTable.reduce((sum, row) => sum + row.prizeUsd, 0);
  assert(total === game.prizePoolUsd, 'predictionGame prizeTable must sum to prizePoolUsd');
  const expected = [500, 250, 150, 75, 60, 45, 35, 30, 30, 25];
  game.prizeTable.forEach((row, index) => {
    assert(row.rank === index + 1, `prizeTable row ${index + 1} rank is wrong`);
    assert(row.prizeUsd === expected[index], `prizeTable rank ${row.rank} prize must be ${expected[index]}`);
  });
  const rules = game.cashPrizeRules || {};
  assert(rules.winnerCount === 10, 'cashPrizeRules must award Top 10 verified players');
  assert(rules.publicTrackerDisplayCount === 20, 'cashPrizeRules must allow a Top 20 public tracker');
  assert(rules.predictionPointsOnly === true, 'cashPrizeRules must use Prediction Points only');
  assert(rules.fanPointsAffectCashPrize === false, 'Fan Points must not affect cash prizes');
  assert(rules.payoutPage === '/matchday-os/prizes/', 'cashPrizeRules payoutPage must point to /matchday-os/prizes/');
  assert(rules.publicLeaderboardNotice && rules.publicLeaderboardNotice.includes('public leaderboard is provisional'), 'cashPrizeRules must warn that the public leaderboard is provisional');
  assert(rules.top20TrackerCopy && rules.top20TrackerCopy.includes('Top 20') && rules.top20TrackerCopy.includes('Top 10'), 'cashPrizeRules must explain Top 20 tracker vs Top 10 cash winners');
  assert(Array.isArray(rules.tieBreakers) && rules.tieBreakers.length === 5, 'cashPrizeRules must include five tie-breakers');
  assert((rules.tieBreakers[0] || '').includes('exact scores'), 'first tie-breaker must be exact scores');
  assert(Array.isArray(rules.importantDates) && rules.importantDates.length >= 6, 'cashPrizeRules must include important date placeholders');
  assert((rules.payoutOptions || []).includes('crypto'), 'cashPrizeRules payout options may include crypto');
  assert(rules.payoutSafetyCopy && rules.payoutSafetyCopy.includes('never ask winners to pay a fee'), 'payout safety copy is required');
  assert(rules.cryptoSafetyCopy && rules.cryptoSafetyCopy.includes('where lawful and practical'), 'crypto payout safety copy is required');
  const leaderboard = game.leaderboard || {};
  assert(leaderboard.displayCount === 20, 'leaderboard shell must support Top 20 public display');
  assert(leaderboard.cashPrizeWinnerCount === 10, 'leaderboard shell must keep cash prizes to Top 10');
  assert(leaderboard.verificationNotice && leaderboard.verificationNotice.includes('provisional'), 'leaderboard shell must include provisional verification notice');
}

function validateFanPoints(fanPoints) {
  assert(fanPoints && fanPoints.status === 'frontend-local-demo-backend-ready', 'fanPoints must be a local-demo backend-ready shell');
  assert(fanPoints.mode === 'separate-from-cash-prize-leaderboard', 'fanPoints must declare separation from cash-prize leaderboard');
  assert(typeof fanPoints.publicCopy === 'string' && fanPoints.publicCopy.includes('Cash-prize winners are decided by Prediction Points only'), 'fanPoints public copy must separate Fan Points from cash-prize winners');
  assert(typeof fanPoints.separationNotice === 'string' && fanPoints.separationNotice.includes('do not decide cash-prize winners'), 'fanPoints separation notice is required');

  const scoreTypes = fanPoints.scoreTypes || [];
  const scoreTypeIds = new Set(scoreTypes.map((type) => type.scoreTypeId));
  assert(scoreTypeIds.has('prediction_points'), 'fanPoints scoreTypes must include prediction_points');
  assert(scoreTypeIds.has('fan_points'), 'fanPoints scoreTypes must include fan_points');
  const predictionPoints = scoreTypes.find((type) => type.scoreTypeId === 'prediction_points');
  const fanScore = scoreTypes.find((type) => type.scoreTypeId === 'fan_points');
  assert(predictionPoints.cashPrizeRanking === true, 'Prediction Points must decide cash-prize ranking');
  assert(predictionPoints.referralInfluence === false, 'Prediction Points must reject referral influence');
  assert(fanScore.cashPrizeRanking === false, 'Fan Points must not decide cash-prize ranking');
  assert(fanScore.fanRecognition === true, 'Fan Points must be for fan recognition');

  const scoring = fanPoints.scoring || {};
  const expected = {
    verifiedReferral: 2,
    referralFirstLockedPrediction: 3,
    maxReferralReward: 25
  };
  for (const [key, value] of Object.entries(expected)) {
    assert(scoring[key] === value, `fanPoints scoring.${key} must be ${value}`);
  }
  assert(scoring.referralAwardTiming === 'pending-until-first-locked-prediction', 'referral rewards must stay pending until first locked prediction');

  const rules = fanPoints.referralRules || {};
  assert(rules.copyReferralLink && rules.copyReferralLink.fanPoints === 0, 'copy referral link must track no points');
  assert(rules.friendVisit && rules.friendVisit.fanPoints === 0, 'friend visit must track no points');
  assert(rules.verifiedSession && rules.verifiedSession.fanPoints === 2, 'verified referral session must be worth 2 Fan Points');
  assert(rules.firstLockedPrediction && rules.firstLockedPrediction.fanPoints === 3, 'first locked prediction referral reward must be worth 3 Fan Points');
  assert(rules.maxReferralReward === 25, 'referral max reward must be 25 Fan Points');
  assert(rules.oneRewardPerReferredUser === true, 'one referral reward per referred user is required');
  assert(rules.selfReferralsAllowed === false, 'self-referrals must not be allowed');
  assert(rules.cashPrizeRankingInfluence === false, 'referral points must not influence cash-prize ranking');

  for (const schema of ['referralEvent', 'fanPointsLedgerRow', 'topFanRow', 'referralReviewFlag']) {
    assert(fanPoints.schemas && fanPoints.schemas[schema], `fanPoints missing ${schema} schema`);
  }

  const abuse = fanPoints.abuseProtection || {};
  assert(abuse.status === 'backend-required', 'fanPoints abuseProtection must require backend enforcement');
  assert(abuse.doNotStoreRawSensitiveSignalsInFrontend === true, 'fanPoints must reject raw sensitive frontend storage');
  for (const required of ['ipHash', 'deviceSignalHash', 'userAgentHash']) {
    assert((abuse.requiredHashFields || []).includes(required), `fanPoints abuseProtection missing ${required}`);
  }
  const ruleIds = new Set((abuse.detectionRules || []).map((rule) => rule.ruleId));
  for (const required of ['self-referral', 'same-device-referral', 'repeated-ip-cluster', 'suspicious-rapid-signups', 'one-reward-per-referred-user']) {
    assert(ruleIds.has(required), `fanPoints abuseProtection missing ${required}`);
  }
  assert(fanPoints.topFans && Array.isArray(fanPoints.topFans.rows) && fanPoints.topFans.rows.length === 0, 'Top Fans must stay empty until backend data exists');
}

function validateAntiCheat(antiCheat) {
  assert(antiCheat && antiCheat.status === 'design-only-backend-required', 'antiCheat must be design-only until backend enforcement exists');
  assert(antiCheat.launchGateStatus === 'blocked-until-server-enforced', 'antiCheat launch gate must block prize launch');
  for (const field of [
    'serverSideLockRequired',
    'noEditsAfterLock',
    'oneAccountPerPerson',
    'emailVerificationRequired',
    'adminReviewRequired',
    'manualWinnerVerificationRequired',
    'termsAcceptanceRequired'
  ]) {
    assert(antiCheat[field] === true, `antiCheat.${field} must be true`);
  }
  assert(antiCheat.legalReviewStatus === 'required-before-launch', 'antiCheat legal review must be required before launch');
  assert(antiCheat.serverSignals && antiCheat.serverSignals.storeRawSensitiveSignals === false, 'antiCheat must reject raw sensitive signal storage');
  for (const required of ['ipHash', 'userAgentHash', 'deviceSignalHash']) {
    assert((antiCheat.serverSignals.requiredHashFields || []).includes(required), `antiCheat missing required hash field ${required}`);
  }
  const trustCopy = antiCheat.publicTrustCopy || [];
  for (const required of [
    'Predictions lock before kickoff',
    'Free to enter',
    'No purchase required',
    'Winners are verified before payout',
    'Suspicious or duplicate entries may be disqualified',
    'This is a skill-based prediction challenge, not betting'
  ]) {
    assert(trustCopy.includes(required), `antiCheat public trust copy missing: ${required}`);
  }
  const ruleIds = new Set((antiCheat.detectionRules || []).map((rule) => rule.ruleId));
  for (const required of ['duplicate-account-signal', 'suspicious-ip-cluster', 'identical-prediction-pattern', 'late-entry-attempt']) {
    assert(ruleIds.has(required), `antiCheat missing detection rule ${required}`);
  }
  for (const schema of ['contestEntrySafety', 'adminReviewItem', 'adminAuditLog']) {
    assert(antiCheat.schemas && antiCheat.schemas[schema], `antiCheat missing ${schema} schema`);
  }
  assert(antiCheat.operatorShell && antiCheat.operatorShell.exportLeaderboardEnabled === false, 'operator shell export must stay disabled until backend admin tooling exists');
  for (const key of collectKeys(antiCheat)) {
    assert(!['ipAddress', 'ip', 'userAgent', 'deviceFingerprint', 'fingerprint', 'rawFingerprint'].includes(key), `antiCheat must not define raw sensitive key: ${key}`);
  }
}

function validateMatchdayContent(content, data, teamIds) {
  assert(content && content.mode === 'static-editorial-seed', 'content mode must be static-editorial-seed');
  assert(Array.isArray(content.contentTypes), 'contentTypes must be an array');
  for (const required of ['preview', 'reaction', 'strategy', 'fan_debate', 'explainer', 'viewing_guide', 'sponsor_safe_feature']) {
    assert(content.contentTypes.includes(required), `contentTypes missing ${required}`);
  }

  const fixtures = new Set((data.fixtures || []).map((fixture) => fixture.matchId));
  const groups = new Set((data.groups || []).map((group) => group.groupId));
  const postIds = new Set();

  function assertTeams(items, label) {
    for (const item of items || []) {
      for (const teamId of item.teamIds || []) {
        assert(teamIds.has(teamId), `${label} references missing team ${teamId}`);
      }
    }
  }

  for (const post of content.dailyMatchPreviews || []) {
    assertId(post.postId, 'dailyMatchPreviews postId');
    assert(content.contentTypes.includes(post.type), `${post.postId} has unknown content type ${post.type}`);
    assert(!postIds.has(post.postId), `Duplicate content postId ${post.postId}`);
    postIds.add(post.postId);
    assert(post.fixtureId === null || fixtures.has(post.fixtureId), `${post.postId} references missing fixture ${post.fixtureId}`);
  }
  assertTeams(content.dailyMatchPreviews, 'dailyMatchPreviews');
  assertTeams(content.africanTeamWatch, 'africanTeamWatch');
  assertTeams(content.strategyPrompts, 'strategyPrompts');
  assertTeams(content.fanPolls, 'fanPolls');
  assertTeams(content.postMatchReactions, 'postMatchReactions');
  assertTeams(content.tomorrowInAfricanFootball, 'tomorrowInAfricanFootball');

  const polls = new Set((content.fanPolls || []).map((poll) => poll.pollId));
  assert(polls.size >= 1, 'fanPolls must include at least one poll shell');
  for (const poll of content.fanPolls || []) {
    assertId(poll.pollId, 'pollId');
    assert(poll.status === 'poll_shell', `${poll.pollId} must be a poll_shell`);
    assert(Array.isArray(poll.options) && poll.options.length >= 2, `${poll.pollId} needs at least two options`);
  }

  const featured = content.featuredSlots || {};
  assert(featured.matchOfTheDay, 'featuredSlots.matchOfTheDay is required');
  assert(featured.playerToWatch, 'featuredSlots.playerToWatch is required');
  assert(featured.groupPressureMeter, 'featuredSlots.groupPressureMeter is required');
  if (featured.matchOfTheDay.fixtureId) assert(fixtures.has(featured.matchOfTheDay.fixtureId), 'matchOfTheDay references missing fixture');
  if (featured.groupPressureMeter.groupId) assert(groups.has(featured.groupPressureMeter.groupId), 'groupPressureMeter references missing group');

  const requiredShareTemplates = [
    'today-african-matches',
    'my-predictions-today',
    'leaderboard-rank',
    'country-room-support',
    'viewing-center-flyer',
    'group-table-snapshot',
    'knockout-path',
    'match-result-reaction',
    'prize-challenge-invite',
    'sponsor-daily-card'
  ];
  const shareTemplates = content.shareCardTemplates || [];
  const shareTemplateIds = validateUnique(shareTemplates, (template) => template.templateId, 'share card template');
  for (const templateId of requiredShareTemplates) {
    assert(shareTemplateIds.has(templateId), `shareCardTemplates missing ${templateId}`);
  }
  for (const template of shareTemplates) {
    assert(typeof template.label === 'string' && template.label.length >= 3, `${template.templateId} label is required`);
    assert(typeof template.description === 'string' && template.description.length >= 12, `${template.templateId} description is required`);
    assert(typeof template.status === 'string' && template.status.length >= 3, `${template.templateId} status is required`);
  }

  const commercial = content.commercialInventory;
  assert(commercial && commercial.status === 'sponsor-ready-shell', 'commercialInventory must be a sponsor-ready-shell');
  assert(typeof commercial.audienceDataPolicy === 'string' && commercial.audienceDataPolicy.includes('privately'), 'commercialInventory must keep audience data private');
  assert(Array.isArray(commercial.fanSafeRules) && commercial.fanSafeRules.length >= 6, 'commercialInventory needs fan-safe rules');
  const requiredPlacements = [
    'matchday-os-main-sponsor',
    'prediction-challenge-sponsor',
    'leaderboard-sponsor',
    'african-teams-tracker-sponsor',
    'country-room-sponsor',
    'daily-match-card-sponsor',
    'viewing-center-flyer-sponsor',
    'newsletter-update-sponsor',
    'blog-strategy-post-sponsor'
  ];
  const placementIds = validateUnique(commercial.placements || [], (placement) => placement.placementId, 'commercial placement');
  for (const placementId of requiredPlacements) {
    assert(placementIds.has(placementId), `commercialInventory missing placement ${placementId}`);
  }
  for (const placement of commercial.placements || []) {
    assert(typeof placement.label === 'string' && placement.label.length >= 3, `${placement.placementId} label is required`);
    assert(typeof placement.surface === 'string' && placement.surface.length >= 10, `${placement.placementId} surface is required`);
    assert(typeof placement.status === 'string' && placement.status.length >= 3, `${placement.placementId} status is required`);
  }
  const kitIds = validateUnique(commercial.viewingCenterKit || [], (item) => item.itemId, 'viewing-center kit item');
  for (const kitId of ['flyer-generator', 'todays-matches-poster', 'show-matches-here-card', 'sponsor-supported-poster', 'whatsapp-event-card']) {
    assert(kitIds.has(kitId), `viewingCenterKit missing ${kitId}`);
  }
  assert(Array.isArray(commercial.buyerQuestions) && commercial.buyerQuestions.length >= 6, 'commercialInventory needs buyer-question copy');
  for (const item of commercial.buyerQuestions || []) {
    assert(typeof item.question === 'string' && item.question.endsWith('?'), 'buyer question must be a question');
    assert(typeof item.answer === 'string' && item.answer.length >= 20, `${item.question} answer is too short`);
  }

  const africanTeamIds = new Set((data.teams || []).filter((team) => team.isAfricanTeam).map((team) => team.teamId));
  const roomTeamIds = new Set((content.countryRooms || []).map((room) => room.teamId));
  for (const teamId of africanTeamIds) {
    assert(roomTeamIds.has(teamId), `countryRooms missing African team ${teamId}`);
  }
  for (const room of content.countryRooms || []) {
    assert(teamIds.has(room.teamId), `countryRoom references missing team ${room.teamId}`);
    if (room.pollId) assert(polls.has(room.pollId), `${room.teamId} room references missing poll ${room.pollId}`);
    for (const postId of room.latestPostIds || []) {
      assert(postIds.has(postId), `${room.teamId} room references missing post ${postId}`);
    }
  }
}

function main() {
  const data = readData();
  const content = readContent();
  assert(data.schemaVersion, 'schemaVersion is required');
  assert(data.officialPartnership === false, 'officialPartnership must stay false');
  assert(Array.isArray(data.tournamentPhases), 'tournamentPhases must be an array');
  const phases = validateUnique(data.tournamentPhases, (phase) => phase.phaseId, 'phase');
  const statuses = validateUnique(data.matchStatuses || [], (status) => status.status, 'match status');
  validateTimeZones(data);
  const teamIds = validateTeams(data);
  const venueIds = validateUnique(data.stadiums || [], (venue) => venue.venueId, 'venue');
  const groupIds = validateGroups(data, teamIds);
  validateFixtures(data, teamIds, groupIds, venueIds, statuses, phases);
  validatePredictionGame(data);
  validateMatchdayContent(content, data, teamIds);
  console.log(`Matchday OS data valid: ${data.teams.length} teams, ${data.fixtures.length} fixtures, ${data.groups.length} groups, ${data.timeZones.displayCities.length} city time zones.`);
}

try {
  main();
} catch (error) {
  console.error(`Matchday OS data validation failed: ${error.message}`);
  process.exitCode = 1;
}

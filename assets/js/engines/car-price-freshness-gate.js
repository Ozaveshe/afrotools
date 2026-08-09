(function factory(root, build) {
  if (typeof module === 'object' && module.exports) module.exports = build();
  else root.AfroCarPriceFreshnessGate = build();
}(typeof self !== 'undefined' ? self : this, function createGate() {
  'use strict';

  function dateValue(value) {
    var parsed = new Date(value || '');
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function ageDays(value, now) {
    var date = dateValue(value);
    var reference = dateValue(now) || new Date();
    return date ? Math.max(0, Math.floor((reference.getTime() - date.getTime()) / 86400000)) : null;
  }

  function assess(dataset, context, evidence, now) {
    var limit = Number(dataset && dataset.staleAfterDays) || 120;
    var sourceDate = context && context.sourcePrice && context.sourcePrice.lastUpdated;
    var localDate = context && context.localPrice && context.localPrice.lastUpdated;
    var generatedAt = dataset && dataset.generatedAt;
    var ages = {
      dataset: ageDays(generatedAt, now),
      source: ageDays(sourceDate, now),
      local: ageDays(localDate, now)
    };
    var endpointBlocked = (evidence && evidence.officialEndpoints || []).some(function endpointNeedsReview(row) {
      return row.reviewStatus !== 'reachable';
    });
    var stale = [ages.dataset, ages.source, ages.local].some(function outsideWindow(age) {
      return age === null || age > limit;
    });
    var allowed = !stale && !endpointBlocked
      && evidence && evidence.releasePolicy
      && evidence.releasePolicy.allowCurrentPriceClaim === true
      && evidence.releasePolicy.allowRecommendation === true;
    return {
      stale: stale,
      endpointBlocked: endpointBlocked,
      allowed: Boolean(allowed),
      ages: ages,
      limitDays: limit,
      sourceDate: sourceDate || '',
      localDate: localDate || '',
      generatedAt: generatedAt || '',
      status: allowed ? 'current' : 'blocked'
    };
  }

  function evidenceRow(context, assessment) {
    return {
      vehicle: context.vehicle.year + ' ' + context.vehicle.make + ' ' + context.vehicle.model,
      country: context.country.name,
      countryCode: context.country.code,
      sourceMarket: context.sourceMarket,
      currency: context.localCurrency,
      sourceBandUsd: [context.sourcePrice.min, context.sourcePrice.median, context.sourcePrice.max],
      sourceCollectedAt: assessment.sourceDate,
      sourceConfidence: context.sourcePrice.confidence,
      sourceType: context.sourcePrice.sourceType,
      localBandUsd: [context.localPrice.min, context.localPrice.median, context.localPrice.max],
      localCollectedAt: assessment.localDate,
      localConfidence: context.localPrice.confidence,
      localSourceType: context.localPrice.sourceType,
      datasetGeneratedAt: assessment.generatedAt,
      freshnessStatus: assessment.status,
      currentPriceClaim: false,
      recommendation: 'blocked',
      disclaimer: 'Historical planning evidence only; verify a current seller quote, official rules and vehicle condition before acting.'
    };
  }

  return { ageDays: ageDays, assess: assess, evidenceRow: evidenceRow };
}));

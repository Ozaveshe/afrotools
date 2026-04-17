const { handleMarketDataRequest } = require('./_shared/market-data-api');

exports.handler = async function (event) {
  return handleMarketDataRequest(event, {
    endpoint: 'lease-risk',
    authScope: 'property',
    table: 'lease_risk_reports',
    select: '*',
    baseFilters: ['is_public=eq.true'],
    responseKey: 'reports',
    extendFilters(filters, params, appendFilter) {
      if (params.min_risk_score) filters.push('risk_score=gte.' + encodeURIComponent(params.min_risk_score));
    }
  });
};

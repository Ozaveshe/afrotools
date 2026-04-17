const { handleMarketDataRequest } = require('./_shared/market-data-api');

exports.handler = async function (event) {
  return handleMarketDataRequest(event, {
    endpoint: 'fintech-fees',
    authScope: 'fintech',
    table: 'fintech_fee_reports',
    select: '*',
    baseFilters: ['is_public=eq.true'],
    providerField: 'provider_name',
    responseKey: 'fees',
    extendFilters(filters, params, appendFilter) {
      if (params.fee_type) appendFilter(filters, 'fee_type', params.fee_type);
    }
  });
};

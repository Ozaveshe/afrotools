const { handleMarketDataRequest } = require('./_shared/market-data-api');

exports.handler = async function (event) {
  return handleMarketDataRequest(event, {
    endpoint: 'remittance-quotes',
    authScope: 'forex',
    table: 'remittance_quotes',
    select: '*',
    baseFilters: ['is_public=eq.true'],
    providerField: 'provider_name',
    responseKey: 'quotes'
  });
};

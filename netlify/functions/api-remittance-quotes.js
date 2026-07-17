const { handleMarketDataRequest } = require('./_shared/market-data-api');

exports.handler = async function (event) {
  return handleMarketDataRequest(event, {
    endpoint: 'remittance-quotes',
    authScope: 'forex',
    table: 'remittance_quotes',
    select: '*',
    baseFilters: ['is_public=eq.true'],
    providerField: 'provider_name',
    responseKey: 'quotes',
    extendFilters(filters, params, appendFilter) {
      if (params.send_country) appendFilter(filters, 'send_country', params.send_country.toUpperCase());
      if (params.receive_country) appendFilter(filters, 'receive_country', params.receive_country.toUpperCase());
      if (params.payout_method) appendFilter(filters, 'payout_method', params.payout_method);
      if (params.funding_method) appendFilter(filters, 'funding_method', params.funding_method);
    }
  });
};

exports.handler = require('./_shared/with-api').withApi(exports.handler, { name: 'api-remittance-quotes' });

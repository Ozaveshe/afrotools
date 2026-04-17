const { handleMarketDataRequest } = require('./_shared/market-data-api');

exports.handler = async function (event) {
  return handleMarketDataRequest(event, {
    endpoint: 'fx-spreads',
    authScope: 'forex',
    table: 'p2p_rates',
    select: '*',
    baseFilters: ['is_active=eq.true'],
    order: 'updated_at.desc',
    defaultLimit: 40,
    providerField: 'platform',
    responseKey: 'rates',
    extendFilters(filters, params, appendFilter) {
      if (params.asset) appendFilter(filters, 'asset', params.asset.toUpperCase());
      if (params.fiat) appendFilter(filters, 'fiat', params.fiat.toUpperCase());
    }
  });
};

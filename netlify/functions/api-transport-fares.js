const { handleMarketDataRequest } = require('./_shared/market-data-api');

exports.handler = async function (event) {
  return handleMarketDataRequest(event, {
    endpoint: 'transport-fares',
    authScope: 'transport',
    table: 'transport_fares',
    select: '*',
    baseFilters: ['is_public=eq.true'],
    providerField: 'provider_name',
    responseKey: 'fares',
    extendFilters(filters, params, appendFilter) {
      if (params.route_name) appendFilter(filters, 'route_name', params.route_name);
      if (params.route_from) appendFilter(filters, 'route_from', params.route_from);
      if (params.route_to) appendFilter(filters, 'route_to', params.route_to);
      if (params.mode) appendFilter(filters, 'transport_mode', params.mode);
    }
  });
};

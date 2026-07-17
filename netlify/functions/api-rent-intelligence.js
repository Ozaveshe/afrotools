const { handleMarketDataRequest } = require('./_shared/market-data-api');

exports.handler = async function (event) {
  return handleMarketDataRequest(event, {
    endpoint: 'rent-intelligence',
    authScope: 'property',
    table: 'rent_listings',
    select: '*',
    baseFilters: ['is_public=eq.true'],
    responseKey: 'listings',
    extendFilters(filters, params, appendFilter) {
      if (params.property_type) appendFilter(filters, 'property_type', params.property_type);
      if (params.bedrooms) appendFilter(filters, 'bedrooms', params.bedrooms);
    }
  });
};

const { handleMarketDataRequest } = require('./_shared/market-data-api');

exports.handler = async function (event) {
  return handleMarketDataRequest(event, {
    endpoint: 'pharmacy-prices',
    authScope: 'health',
    table: 'pharmacy_price_reports',
    select: '*',
    baseFilters: ['is_public=eq.true'],
    responseKey: 'prices',
    extendFilters(filters, params, appendFilter) {
      if (params.medicine_name) appendFilter(filters, 'medicine_name', params.medicine_name);
      if (params.brand_name) appendFilter(filters, 'brand_name', params.brand_name);
    }
  });
};

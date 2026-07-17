const { handleMarketDataRequest } = require('./_shared/market-data-api');

exports.handler = async function (event) {
  return handleMarketDataRequest(event, {
    endpoint: 'wholesale-retail-spreads',
    authScope: 'commodity-prices',
    table: 'wholesale_retail_reports',
    select: '*',
    baseFilters: ['is_public=eq.true'],
    responseKey: 'spreads',
    extendFilters(filters, params, appendFilter) {
      if (params.market_name) appendFilter(filters, 'market_name', params.market_name);
      if (params.product_name) appendFilter(filters, 'product_name', params.product_name);
    }
  });
};

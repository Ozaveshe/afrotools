const { handleMarketDataRequest } = require('./_shared/market-data-api');

exports.handler = async function (event) {
  return handleMarketDataRequest(event, {
    endpoint: 'clinic-costs',
    authScope: 'health',
    table: 'clinic_cost_reports',
    select: '*',
    baseFilters: ['is_public=eq.true'],
    responseKey: 'costs',
    extendFilters(filters, params, appendFilter) {
      if (params.facility_type) appendFilter(filters, 'facility_type', params.facility_type);
      if (params.service_name) appendFilter(filters, 'service_name', params.service_name);
    }
  });
};

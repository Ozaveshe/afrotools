const { handleMarketDataRequest } = require('./_shared/market-data-api');

exports.handler = async function (event) {
  return handleMarketDataRequest(event, {
    endpoint: 'school-fees',
    authScope: 'education',
    table: 'school_fee_reports',
    select: '*',
    baseFilters: ['is_public=eq.true'],
    responseKey: 'fees',
    extendFilters(filters, params, appendFilter) {
      if (params.education_level) appendFilter(filters, 'education_level', params.education_level);
      if (params.institution_type) appendFilter(filters, 'institution_type', params.institution_type);
    }
  });
};

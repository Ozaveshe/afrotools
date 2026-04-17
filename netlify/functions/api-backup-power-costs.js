const { handleMarketDataRequest } = require('./_shared/market-data-api');

exports.handler = async function (event) {
  return handleMarketDataRequest(event, {
    endpoint: 'backup-power-costs',
    authScope: 'electricity',
    table: 'backup_power_reports',
    select: '*',
    baseFilters: ['is_public=eq.true'],
    providerField: 'provider_name',
    responseKey: 'costs',
    extendFilters(filters, params, appendFilter) {
      if (params.energy_type) appendFilter(filters, 'energy_type', params.energy_type);
    }
  });
};

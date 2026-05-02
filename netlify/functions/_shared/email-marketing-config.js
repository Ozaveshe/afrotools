function cleanEnvValue(value) {
  return String(value || '').trim().replace(/^['"]|['"]$/g, '');
}

function firstEnv(keys) {
  for (var i = 0; i < keys.length; i++) {
    var value = cleanEnvValue(process.env[keys[i]]);
    if (value) return value;
  }
  return '';
}

function getMarketingSupabaseConfig() {
  var url = firstEnv([
    'SUPABASE_MARKETING_URL',
    'SUPABASE_LEADS_URL',
    'SUPABASE_AUTH_URL',
    'SUPABASE_URL',
    'SUPABASE_DATA_URL',
  ]) || 'https://zpclagtgczsygrgztlts.supabase.co';

  var serviceKey = firstEnv([
    'SUPABASE_MARKETING_SERVICE_ROLE_KEY',
    'SUPABASE_LEADS_SERVICE_ROLE_KEY',
    'SUPABASE_AUTH_SERVICE_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_SERVICE_KEY',
    'SUPABASE_DATA_SERVICE_ROLE_KEY',
  ]);

  return { url: url, serviceKey: serviceKey };
}

module.exports = {
  cleanEnvValue: cleanEnvValue,
  firstEnv: firstEnv,
  getMarketingSupabaseConfig: getMarketingSupabaseConfig,
};

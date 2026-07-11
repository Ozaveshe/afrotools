var crypto = require('crypto');
var source = require('../../../data/api-tool-catalog.v1.json');

var SCHEMA_VERSION = '1.0.0';
var INTEGRATION_MODES = ['api', 'widget', 'link'];
var ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
var COUNTRY = /^(ALL|[A-Z]{2})$/;
var ABSOLUTE_URL = /^https:\/\/[a-z0-9.-]+(?:\/[^\s]*)?$/i;

function fail(message) {
  throw new Error('Invalid tool catalog metadata: ' + message);
}

function validateToolMetadata(tool) {
  if (!tool || typeof tool !== 'object' || Array.isArray(tool)) fail('tool must be an object');
  if (tool.schemaVersion !== SCHEMA_VERSION) fail('unsupported schemaVersion');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tool.id || '')) fail('invalid id');
  if (typeof tool.name !== 'string' || !tool.name.trim()) fail('missing name for ' + tool.id);
  if (typeof tool.description !== 'string' || !tool.description.trim()) fail('missing description for ' + tool.id);
  if (tool.category !== 'career') fail('invalid category for ' + tool.id);
  if (typeof tool.published !== 'boolean') fail('published must be boolean for ' + tool.id);
  if (!INTEGRATION_MODES.includes(tool.integrationMode)) fail('invalid integrationMode for ' + tool.id);
  if (!ABSOLUTE_URL.test(tool.canonicalUrl || '')) fail('invalid canonicalUrl for ' + tool.id);
  if (!Array.isArray(tool.countries) || !tool.countries.length || tool.countries.some(function (code) { return !COUNTRY.test(code); })) fail('invalid countries for ' + tool.id);
  if (!ISO_DATE.test(tool.lastVerified || '')) fail('invalid lastVerified for ' + tool.id);
  if (tool.rulesVersion !== null && (typeof tool.rulesVersion !== 'string' || !tool.rulesVersion.trim())) fail('invalid rulesVersion for ' + tool.id);
  if (typeof tool.disclaimer !== 'string' || !tool.disclaimer.trim()) fail('missing disclaimer for ' + tool.id);
  if (!tool.attribution || tool.attribution.required !== true || typeof tool.attribution.text !== 'string' || !ABSOLUTE_URL.test(tool.attribution.url || '')) fail('invalid attribution for ' + tool.id);

  if (tool.integrationMode === 'api') {
    if (!tool.api || !['GET', 'POST'].includes(tool.api.method) || !/^\/api\/v1\//.test(tool.api.path || '')) fail('invalid api contract for ' + tool.id);
    if (!ABSOLUTE_URL.test(tool.inputSchema || '') || !ABSOLUTE_URL.test(tool.outputSchema || '')) fail('API schema references required for ' + tool.id);
    if (tool.widget !== null) fail('API tool cannot claim a widget for ' + tool.id);
  } else if (tool.integrationMode === 'widget') {
    if (!tool.widget || !ABSOLUTE_URL.test(tool.widget.url || '')) fail('invalid widget contract for ' + tool.id);
    if (tool.api !== null) fail('widget tool cannot claim an API for ' + tool.id);
  } else if (tool.api !== null || tool.widget !== null || tool.inputSchema !== null || tool.outputSchema !== null) {
    fail('link tool cannot claim API, widget, or schemas for ' + tool.id);
  }
  return tool;
}

function validateSupportingApi(api) {
  if (!api || typeof api !== 'object') fail('supporting API must be an object');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(api.id || '')) fail('invalid supporting API id');
  if (!['GET', 'POST'].includes(api.method) || !/^\/api\/v1\//.test(api.path || '')) fail('invalid supporting API route');
  if (!ABSOLUTE_URL.test(api.inputSchema || '') || !ABSOLUTE_URL.test(api.outputSchema || '')) fail('invalid supporting API schemas');
  if (!ISO_DATE.test(api.lastVerified || '')) fail('invalid supporting API verification date');
  return api;
}

function buildCatalog(records) {
  if (!Array.isArray(records)) fail('catalog must be an array');
  var seen = new Set();
  var tools = records.map(validateToolMetadata).filter(function (tool) { return tool.published; });
  tools.forEach(function (tool) {
    if (seen.has(tool.id)) fail('duplicate id ' + tool.id);
    seen.add(tool.id);
  });
  return tools.sort(function (left, right) {
    return left.priority === right.priority
      ? left.name.localeCompare(right.name)
      : right.priority - left.priority;
  });
}

function salaryPadiCatalog() {
  if (source.schemaVersion !== SCHEMA_VERSION || !ISO_DATE.test(source.publishedAt || '')) {
    fail('invalid catalog envelope');
  }
  var tools = buildCatalog(source.tools);
  var supportingApis = Array.isArray(source.supportingApis)
    ? source.supportingApis.map(validateSupportingApi)
    : fail('supportingApis must be an array');
  return {
    schemaVersion: SCHEMA_VERSION,
    product: 'salarypadi',
    category: 'career',
    publishedAt: source.publishedAt,
    lastVerified: tools.reduce(function (latest, tool) {
      return tool.lastVerified > latest ? tool.lastVerified : latest;
    }, '1970-01-01'),
    count: tools.length,
    tools: tools,
    supportingApis: supportingApis,
    contract: {
      schema: 'https://afrotools.com/api/schemas/v1/tool-catalog-response.schema.json',
      documentation: 'https://afrotools.com/api/docs/#salarypadi-catalog',
      attribution: 'Data and tools by AfroTools — https://afrotools.com',
    },
  };
}

function catalogEtag(body) {
  return '"sha256-' + crypto.createHash('sha256').update(JSON.stringify(body)).digest('base64url') + '"';
}

module.exports = {
  SCHEMA_VERSION: SCHEMA_VERSION,
  INTEGRATION_MODES: INTEGRATION_MODES,
  validateToolMetadata: validateToolMetadata,
  validateSupportingApi: validateSupportingApi,
  buildCatalog: buildCatalog,
  salaryPadiCatalog: salaryPadiCatalog,
  catalogEtag: catalogEtag,
};

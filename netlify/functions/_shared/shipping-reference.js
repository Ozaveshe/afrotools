'use strict';

const SOURCE = 'AfroTools unreviewed shipping planning references';
const LPI_URL = 'https://api.worldbank.org/v2/country/ALL/indicator/LP.LPI.OVRL.XQ?date=2020:2025&format=json&per_page=500';
const referenceFields = () => ({source_type: 'reference', reference_status: 'unverified_reference', reference_reviewed_at: null, current_prices: false});
function iso(value, now) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(value)) return null;
  const date = new Date(value), clock = new Date(now);
  if (!Number.isFinite(date.getTime()) || !Number.isFinite(clock.getTime()) || date.getTime() > clock.getTime() || date.toISOString().slice(0,19) !== value.slice(0,19)) return null;
  return date.toISOString();
}
function sameDemurrage(value, expected) {
  if (!expected) return value === null;
  return value && value.free_days === expected.free_days && value.rate_after === expected.rate_after && value.congestion_risk === expected.congestion_risk;
}
function referenceClaim(value) {
  return value && (value.source_type === undefined || value.source_type === 'reference') &&
    (value.reference_status === undefined || value.reference_status === 'unverified_reference') &&
    (value.reference_reviewed_at === undefined || value.reference_reviewed_at === null) &&
    (value.current_prices === undefined || value.current_prices === false);
}
function onlyKeys(value, keys) {
  return value && Object.keys(value).every(key => keys.includes(key));
}
const CLAIM_KEYS = ['source_type','reference_status','reference_reviewed_at','current_prices'];
function normalizeSnapshot(payload, now, catalog) {
  if (!referenceClaim(payload) || !catalog || !Array.isArray(catalog.routes) || !catalog.ports || !catalog.demurrage || !Array.isArray(payload.routes) || !Array.isArray(payload.ports)) return null;
  const collected = iso(payload.collected_at || payload.timestamp, now);
  if (!collected || (payload.collected_at && !iso(payload.timestamp, now))) return null;
  const modern = payload.schemaVersion === 1 && payload.snapshot_type === 'reference' && payload.source === SOURCE;
  const legacy = payload.schemaVersion === undefined && payload.snapshot_type === undefined && payload.source === undefined;
  if (!modern && !legacy) return null;
  if (!onlyKeys(payload,['schemaVersion','snapshot_type','source','timestamp','collected_at','routes','ports','route_count','port_count',...CLAIM_KEYS]) ||
      (modern && iso(payload.timestamp,now) !== collected)) return null;
  if (payload.routes.length !== catalog.routes.length || payload.ports.length !== Object.keys(catalog.ports).length ||
      payload.route_count !== payload.routes.length || payload.port_count !== payload.ports.length) return null;
  const expectedRoutes = new Map(catalog.routes.map(row => [row.from + '\0' + row.to, row])), seenRoutes = new Set(), seenPorts = new Set();
  for (const row of payload.routes) {
    if (!referenceClaim(row) || !onlyKeys(row,['origin','destination','destination_port','destination_country','rate_20ft_usd','rate_40ft_usd','transit_days','last_updated','source','collected_at',...CLAIM_KEYS]) ||
        row.source !== 'reference' || !Object.hasOwn(catalog.ports, row.destination_port)) return null;
    const key = row.origin + '\0' + row.destination_port, expected = expectedRoutes.get(key), port = catalog.ports[row.destination_port];
    if (!expected || seenRoutes.has(key) || row.destination !== port.name || row.destination_country !== port.country ||
        row.rate_20ft_usd !== expected.rate_20ft || row.rate_40ft_usd !== expected.rate_40ft || row.transit_days !== expected.transit_days) return null;
    seenRoutes.add(key);
  }
  for (const row of payload.ports) {
    const expected = row && Object.hasOwn(catalog.ports, row.id) && catalog.ports[row.id];
    if (!referenceClaim(row) || !onlyKeys(row,['id','code','country','name','type','demurrage','logistics_score','logistics_year','logistics_source','logistics_observation',...CLAIM_KEYS]) ||
        !expected || seenPorts.has(row.id) || ['code','country','name','type'].some(key => row[key] !== expected[key]) ||
        !sameDemurrage(row.demurrage, Object.hasOwn(catalog.demurrage, row.id) ? catalog.demurrage[row.id] : null) ||
        (row.demurrage && (!referenceClaim(row.demurrage) || !onlyKeys(row.demurrage,['free_days','rate_after','congestion_risk',...CLAIM_KEYS])))) return null;
    if (row.logistics_score !== null && (!Number.isFinite(row.logistics_score) || row.logistics_score < 0 || row.logistics_score > 5 ||
        !/^\d{4}$/.test(String(row.logistics_year)) || Number(row.logistics_year) > new Date(now).getUTCFullYear())) return null;
    if (row.logistics_score === null && row.logistics_year !== null) return null;
    if (row.logistics_source !== undefined && row.logistics_source !== null &&
        (!onlyKeys(row.logistics_source,['name','url']) || row.logistics_source.name !== 'World Bank LPI' || row.logistics_source.url !== LPI_URL || row.logistics_score === null)) return null;
    seenPorts.add(row.id);
  }
  return {schemaVersion: 1, snapshot_type: 'reference', source: SOURCE, ...referenceFields(), timestamp: collected, collected_at: collected,
    routes: payload.routes.map(row => ({...row, last_updated: null, collected_at: collected, ...referenceFields()})),
    ports: payload.ports.map(row => ({...row, ...referenceFields(), demurrage: row.demurrage ? {...row.demurrage, ...referenceFields()} : null,
      logistics_observation: row.logistics_score !== null ? {value:row.logistics_score, year:String(row.logistics_year),
        source_type:'dated_statistical_context', current_price_evidence:false,
        source:row.logistics_source || null, attribution_status:row.logistics_source ? 'collector_declared' : 'legacy_unverified'} : null})),
    port_count: payload.ports.length, route_count: payload.routes.length};
}
function buildSnapshot(data, now, catalog) {
  const legacy = {timestamp:now, routes:data.routes, ports:data.ports, route_count:data.routes.length, port_count:data.ports.length};
  const normalized = normalizeSnapshot(legacy, now, catalog);
  if (!normalized) throw new Error('Shipping reference output does not match the maintained planning catalog');
  return normalized;
}
function referenceStatus(payload, meta, now, staleAfterMinutes, catalog) {
  const normalized = normalizeSnapshot(payload, now, catalog), collected = normalized?.collected_at || null;
  const age = collected ? Math.floor((new Date(now).getTime()-Date.parse(collected))/60000) : null;
  const collection = !normalized ? 'offline' : age > staleAfterMinutes ? 'stale' : meta?.status && !['ok','live'].includes(meta.status) ? 'degraded' : 'ok';
  return {updatedAt:collected,collected_at:collected,age_minutes:age,source:normalized ? SOURCE : null, ...referenceFields(),
    status:normalized ? 'stale' : 'offline',collection_status:collection,availability:normalized ? 'reference' : 'unavailable',
    records_count:normalized?.route_count || 0,port_count:normalized?.port_count || 0,confidence:null,blob_present:!!payload};
}
module.exports = {SOURCE, LPI_URL, normalizeSnapshot, buildSnapshot, referenceStatus};

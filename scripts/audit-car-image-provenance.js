#!/usr/bin/env node
// Audit image availability and evidence for every distinct Car Pricer identity.
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const manifests = [
  'image-upload-manifest.csv',
  'image-upload-manifest-wave-1.csv',
  'image-upload-manifest-wave-2-ev-luxury.csv',
  'image-upload-manifest-wave-3-premium-ev.csv'
];

function parseCsv(input) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char === '"' && quoted && input[i + 1] === '"') { cell += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && input[i + 1] === '\n') i += 1;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = []; cell = '';
    } else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const headers = rows.shift() || [];
  return rows.map(cells => Object.fromEntries(headers.map((name, index) => [name, cells[index] || ''])));
}

function publicPath(row) {
  const directory = row.save_directory.replace(/\\/g, '/');
  const marker = '/assets/img/cars/';
  const index = directory.indexOf(marker);
  if (index < 0 || !/^[-a-z0-9.]+$/i.test(row.image_name)) throw new Error(`Invalid image manifest path: ${row.vehicle_id}`);
  return `${directory.slice(index).replace(/\/$/, '')}/${row.image_name}`;
}

function audit() {
  const pack = JSON.parse(fs.readFileSync(path.join(root, 'data/cars/price-intelligence.json'), 'utf8'));
  const library = JSON.parse(fs.readFileSync(path.join(root, 'data/image-generation/image-library.json'), 'utf8'));
  const libraryByPath = new Map(library.images.map(asset => [asset.path, asset]));
  const assetById = new Map(pack.mediaLibrary.assets.map(asset => [asset.id, asset]));
  const primaryByVehicle = new Map(pack.mediaLibrary.bindings
    .filter(binding => binding.vehicleId && binding.isPrimary)
    .map(binding => [binding.vehicleId, assetById.get(binding.assetId)]));
  const active = new Set(pack.vehicles.map(vehicle => vehicle.id));
  const manifestRows = manifests.flatMap(file => parseCsv(fs.readFileSync(path.join(root, 'data/cars', file), 'utf8')));
  const catalogIds = new Set(['master-vehicle-catalog.csv', 'import-duty-vehicle-estimates.csv']
    .flatMap(file => parseCsv(fs.readFileSync(path.join(root, 'data/cars', file), 'utf8')))
    .map(row => row.vehicle_id));
  const rows = new Map();
  const duplicates = [];
  for (const entry of manifestRows) {
    if (rows.has(entry.vehicle_id)) { duplicates.push(entry.vehicle_id); continue; }
    const expectedPath = publicPath(entry);
    const linked = primaryByVehicle.get(entry.vehicle_id);
    const imagePath = linked && linked.imageUrl.startsWith('/assets/img/cars/') ? linked.imageUrl : expectedPath;
    const inventory = libraryByPath.get(imagePath);
    rows.set(entry.vehicle_id, {
      vehicle_id: entry.vehicle_id,
      make: entry.make,
      model: entry.model,
      year: Number(entry.year),
      priced_profile: active.has(entry.vehicle_id),
      image_path: imagePath,
      file_exists: fs.existsSync(path.join(root, imagePath.slice(1))),
      media_source_type: linked?.sourceType || 'unassigned',
      rights_evidence: linked?.licenseUrl || linked?.licenseId || linked?.rightsHolder ? 'recorded' : 'missing',
      visual_review: inventory?.text_status || 'not-recorded',
      exact_model_review: 'not-recorded'
    });
  }
  const details = [...rows.values()].sort((left, right) => left.vehicle_id.localeCompare(right.vehicle_id));
  if (details.length !== 482) throw new Error(`Expected 482 distinct identities; found ${details.length}`);
  const missingManifest = [...catalogIds].filter(id => !rows.has(id));
  const extraManifest = [...rows.keys()].filter(id => !catalogIds.has(id));
  if (missingManifest.length || extraManifest.length) throw new Error(`Image manifests differ from catalog: missing ${missingManifest.join(', ')}, extra ${extraManifest.join(', ')}`);
  const count = predicate => details.filter(predicate).length;
  return {
    summary: {
      identities: details.length,
      duplicate_manifest_ids: duplicates,
      priced_profiles: count(row => row.priced_profile),
      image_files_present: count(row => row.file_exists),
      image_files_missing: count(row => !row.file_exists),
      labelled_licensed: count(row => row.media_source_type === 'licensed'),
      labelled_generated: count(row => row.media_source_type === 'generated'),
      rights_evidence_recorded: count(row => row.rights_evidence === 'recorded'),
      visual_review_recorded: count(row => row.visual_review !== 'not-reviewed' && row.visual_review !== 'not-recorded'),
      exact_model_review_recorded: count(row => row.exact_model_review !== 'not-recorded')
    },
    vehicles: details
  };
}

if (require.main === module) {
  const result = audit();
  process.stdout.write(`${JSON.stringify(process.argv.includes('--details') ? result : result.summary, null, 2)}\n`);
}

module.exports = { audit, parseCsv, publicPath };

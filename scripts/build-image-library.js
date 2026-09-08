#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const vm = require('vm');
const { imageSize } = require('./lib/image-size');
const ROOT = path.resolve(__dirname, '..');
const OUT = 'data/image-generation';
const recipeAliases = require('../data/image-generation/recipe-image-aliases.json').aliases;
const imageExt = /\.(?:png|jpe?g|webp|gif|svg|avif|ico)$/i;
const excluded = /^(?:node_modules|dist|\.git|\.codex|\.agents|\.claude|reports|artifacts|audit-results|test-results|playwright-report|ops|tests)\//;
function read(file) { return fs.readFileSync(path.join(ROOT, file), 'utf8'); }
function write(file, value) { fs.mkdirSync(path.dirname(path.join(ROOT, file)), { recursive: true }); fs.writeFileSync(path.join(ROOT, file), value); }
function json(file, value) { write(file, JSON.stringify(value, null, 2) + '\n'); }
function files() {
  return [...new Set(cp.execFileSync('git', ['ls-files', '-c', '-o', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }).split(/\r?\n/).filter(f => f && !excluded.test(f) && fs.existsSync(path.join(ROOT, f))))].sort();
}
function locale(file) { return /^(fr|sw|ha|yo)\//.exec(file)?.[1] || 'en'; }
function routeFile(route) {
  const bare = route.split(/[?#]/)[0].replace(/^\//, '');
  return [bare, bare + '.html', bare.replace(/\/$/, '') + '/index.html'].find(f => fs.existsSync(path.join(ROOT, f)) && fs.statSync(path.join(ROOT, f)).isFile()) || null;
}
function registry() {
  const sandbox = { console, setTimeout, clearTimeout };
  vm.createContext(sandbox); vm.runInContext(read('assets/js/components/tool-registry.js'), sandbox);
  return { rows: sandbox.AFRO_TOOLS, imageIndex: sandbox.TOOL_CARD_IMAGE_EXTENSIONS || {}, imagePath: sandbox.getToolCardImagePath };
}
function csv(rows, keys) { return '\uFEFF' + [keys, ...rows.map(row => keys.map(k => Array.isArray(row[k]) ? row[k].join('; ') : row[k] ?? ''))].map(row => row.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n') + '\n'; }
function build() {
  const all = files();
  const incoming = JSON.parse(read(OUT + '/kitchen-import-2026-09-08.json')).images;
  const reviewed = new Map(incoming.map(r => [r.path, r]));
  const shared = JSON.parse(read(OUT + '/reviewed-shared-artwork.json'));
  for (const id of shared.tool_ids) reviewed.set('/assets/img/tools/' + id + '.webp', { text_status:'text-free-reviewed', locale_reuse:true, review_note:shared.note });
  reviewed.set('/assets/img/kitchen/kondowole.webp', { text_status:'text-free-reviewed', locale_reuse:true, review_note:'Visually reviewed for same-dish image alias kondowole-mw; no visible text.' });
  const byPath = new Map();
  for (const file of all.filter(f => imageExt.test(f))) {
    const bytes = fs.readFileSync(path.join(ROOT, file));
    const dimensions = imageSize(path.join(ROOT, file));
    const review = reviewed.get('/' + file);
    byPath.set(file, { id: file.replace(/\.[^.]+$/, ''), path: '/' + file, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length, width: dimensions?.w || null, height: dimensions?.h || null, family: file.startsWith('assets/img/') ? (file.split('/').length > 3 ? file.split('/')[2] : 'brand-and-banners') : file.split('/')[0], status: review?.status || 'unassigned', placements: [], text_status: review?.text_status || (/\.svg$/.test(file) && /<text\b/i.test(bytes.toString()) ? 'contains-text' : 'not-reviewed'), locale_reuse: review?.locale_reuse || false, duplicate_of: null, review_note: review?.review_note || 'Visual/text review pending; reference scan is not visual approval.' });
  }
  const missing = new Map();
  function placement(file, owner, kind) {
    const item = byPath.get(file);
    if (item && !item.placements.some(p => p.path === owner && p.kind === kind)) item.placements.push({ path: owner, kind, locale: locale(owner) });
  }
  for (const [name,field] of [['live-creator-image-references.json','local_avatar'],['live-news-image-references.json','image_url']]) {
    const evidence=JSON.parse(read(OUT+'/'+name));
    if(evidence.project_ref!=='zpclagtgczsygrgztlts')throw new Error('Incorrect media evidence project');
    for(const row of evidence.rows){const ref=String(row[field]||'').replace(/^https:\/\/(?:www\.)?afrotools\.com/,'').replace(/^\//,'');if(byPath.has(ref))placement(ref,evidence.table+':'+row.slug,'live-database-reference');}
  }
  for (const file of all.filter(f => /\.(?:html|css|js|json|webmanifest|svg)$/.test(f) && !f.startsWith(OUT + '/') && !/^scripts\//.test(f))) {
    const source = read(file).replace(/\\\//g, '/');
    if(/(?:href|src)=["']\/favicon\.ico["']/.test(source))placement('favicon.ico',file,'page-reference');
    for (const match of source.matchAll(/(?:https?:\/\/(?:www\.)?afrotools\.com)?\/?(?:assets|images|img)\/[a-zA-Z0-9_./%+@-]+\.(?:png|jpe?g|webp|gif|svg|avif|ico)/gi)) {
      let ref = match[0].replace(/^https?:\/\/(?:www\.)?afrotools\.com/, '').replace(/^\//, '');
      try { ref = decodeURIComponent(ref); } catch { continue; }
      const relative = path.posix.normalize(path.posix.join(path.posix.dirname(file), ref));
      if (!byPath.has(ref) && byPath.has(relative)) ref = relative;
      const kind = /\.html$/.test(file) ? 'page-reference' : /\.css$/.test(file) ? 'style-reference' : 'runtime-or-data-reference';
      if (byPath.has(ref)) placement(ref, file, kind);
      else if (/\.html$/.test(file) && !match[0].includes('%')) {
        if (!missing.has(ref)) missing.set(ref, []);
        missing.get(ref).push(file);
      }
    }
  }
  const manifest = JSON.parse(read('tools/afrokitchen/seo-manifest.json'));
  const { rows, imagePath } = registry();
  for (const r of rows) {
    const asset = imagePath(r);
    const owner = routeFile(r.href || r.url || r.path || '/tools/' + r.id + '/');
    if (asset && owner) placement(asset.replace(/^\//,''), owner, 'shared-tool-card');
  }
  for (const r of manifest.recipes) {
    const imageSlug = recipeAliases[r.slug] || r.slug;
    const image = [...byPath.keys()].find(p => new RegExp('^assets/img/kitchen/' + imageSlug + '(?:-1)?\\.(webp|png|jpe?g)$').test(p));
    if (image) {
      placement(image, 'tools/afrokitchen/recipes/' + r.slug + '/index.html', 'recipe-pipeline');
      placement(image, 'tools/afrokitchen/index.html', 'recipe-card-pipeline');
    }
  }
  const hashes = new Map();
  const images = [...byPath.values()].sort((a, b) => b.placements.length - a.placements.length || a.path.localeCompare(b.path));
  const decisionsPath=path.join(ROOT,OUT,'placement-decisions.json');
  const decisions=new Map(fs.existsSync(decisionsPath)?JSON.parse(fs.readFileSync(decisionsPath,'utf8')).images.map(x=>[x.path,x]):[]);
  for (const item of images) {
    if (hashes.has(item.sha256)) item.duplicate_of = hashes.get(item.sha256);
    else hashes.set(item.sha256, item.path);
    if (item.status !== 'needs-review') item.status = item.placements.length ? 'placed' : item.duplicate_of ? 'duplicate-review' : 'unassigned';
    item.placements.sort((a,b) => a.path.localeCompare(b.path) || a.kind.localeCompare(b.kind));
    item.locales_in_use = [...new Set(item.placements.map(p => p.locale))].sort();
    item.assignment = item.placements.length ? item.placements[0].path : item.duplicate_of ? 'Review duplicate of ' + item.duplicate_of : 'Library review queue: ' + item.family;
    const decision=decisions.get(item.path);
    if(decision){if(decision.sha256!==item.sha256)throw new Error('Reviewed image hash changed: '+item.path);item.placement_decision=decision.decision;item.review_note=decision.reason;item.assignment=decision.owner;item.text_status=decision.text_status||item.text_status;if(item.status==='unassigned'&&decision.decision!=='active')item.status=decision.decision;}
  }
  images.sort((a,b) => a.path.localeCompare(b.path));
  const generated_at = new Date().toISOString();
  const summary = { images: images.length, placed: images.filter(i=>i.status==='placed').length, unassigned: images.filter(i=>i.status==='unassigned').length, duplicates: images.filter(i=>i.duplicate_of).length, held: images.filter(i=>i.status==='needs-review').length, text_free_reviewed: images.filter(i=>i.locale_reuse).length, shared_across_locales: images.filter(i=>i.locales_in_use.length>1).length, bytes: images.reduce((s,i)=>s+i.bytes,0), missing_reference_candidates: missing.size };
  summary.placement_review_resolved=decisions.size;
  summary.lifecycle_counts=images.reduce((o,i)=>(o[i.status]=(o[i.status]||0)+1,o),{});
  json(OUT + '/image-library.json', { schema_version: 1, generated_at, source_commit: cp.execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim(), scope: 'Repository product images plus dated verified AfroTools Supabase creator/news media bindings. Excludes build, dependency, test and evidence directories. Lifecycle decisions distinguish active use from reserved, retired and rejected artwork. No claim of exhaustive runtime reachability or live URL availability.', summary, images });
  json(OUT + '/missing-image-references.json', { schema_version: 1, generated_at, note: 'Static reference candidates: may include dormant templates and dynamic fallbacks. Review before changing routes.', images: [...missing].map(([path, owners]) => ({ path: '/' + path, owners: [...new Set(owners)] })) });
  write(OUT + '/image-library.csv', csv(images.map(i=>({...i,locales:i.locales_in_use,placement_count:i.placements.length})), ['path','family','status','assignment','width','height','bytes','sha256','duplicate_of','placement_count','text_status','locale_reuse','locales','review_note']));
  return { images, manifest, generated_at, summary, byPath };
}
function nextBatch(library) {
  const { images, manifest, generated_at, byPath } = library;
  const batch_id = process.argv.find(a=>a.startsWith('--batch='))?.slice(8) || '2026-09-08';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(batch_id)) throw new Error('Batch must be YYYY-MM-DD');
  const existing = new Set(images.map(i=>i.path.replace(/\.[^.]+$/, '')));
  const queue = [];
  const add = row => { if (!existing.has(row.path.replace(/\.[^.]+$/, '')) && !queue.some(q=>q.path===row.path) && routeFile(row.route)) queue.push({ ...row, status:'pending', locale_reuse:true }); };
  for (const r of manifest.recipes) {
    if (recipeAliases[r.slug]) continue;
    if ([...existing].some(p => p === '/assets/img/kitchen/' + r.slug || p === '/assets/img/kitchen/' + r.slug + '-1')) continue;
    const held = images.find(i => i.path === '/assets/img/new/' + r.slug + '.webp' && i.status === 'needs-review');
    const ingredientNames = (r.ingredients || []).filter(i=>!i.is_optional).map(i=>i.name).slice(0,9).join(', ');
    add({ id:'recipe-' + r.slug, type:'recipe-hero', priority:held ? 100 : r.is_featured ? 90 : 75, name:r.name, route:r.route_path, path:'/assets/img/kitchen/' + r.slug + '.webp', dimensions:'1200x800', alt:r.name + ' from ' + r.country_name, source:'tools/afrokitchen/seo-manifest.json', prompt:`Create one realistic editorial food photograph of ${r.name} from ${r.country_name}. Recipe brief: ${r.description} Main ingredients from the saved recipe: ${ingredientNames}. Show the finished dish with the correct texture, cooking method and serving form. Natural window light, simple neutral table, realistic food colour, an appetising three-quarter view, entire main plate inside the central 80% for card cropping. Landscape 1200x800. No words, labels, lettering, flags, logos, watermarks, collage or UI. Do not replace the dish with a generic stew or invent decorative ingredients. ${held ? 'Replacement required: '+held.review_note : ''} Deliver WebP under the exact destination filename.`, reason:held ? held.review_note : 'Recipe has no local hero in any supported extension.' });
  }
  const directory = JSON.parse(read('data/tool-directory.json'));
  for (const t of directory) {
    if (t.language && t.language !== 'en') continue;
    const { rows } = registryCache || (registryCache = registry());
    const row = rows.find(r=>r.id===t.id);
    const id = row?.imageId || row?.sourceId || t.id;
    if (existing.has('/assets/img/tools/' + id)) continue;
    add({ id:'tool-' + id, type:'tool-card', priority:Math.min(89, Math.max(60,Number(t.priority)||60)), name:t.name, route:t.url, path:'/assets/img/tools/' + id + '.webp', dimensions:'1200x630', alt:'Concept illustration for ' + t.name, source:'data/tool-directory.json', prompt:`Create a restrained editorial concept illustration for AfroTools ${t.name}. Purpose: ${t.description}. Communicate the core task through a few recognisable physical objects or simple unlabelled shapes, accurate proportions and a calm neutral surface with a restrained blue accent. Avoid a fake app screenshot or fabricated output. Show relevant contemporary African context only when the task calls for it; avoid stereotypical patterns, flags or generic continent silhouettes. Landscape 1200x630, central subject within 80% safe crop, clear at thumbnail size. Absolutely no text, digits, currency symbols, lettering, logos, watermarks, charts with invented values or claims of official endorsement. Same artwork will serve matching translated pages; labels remain in HTML. Deliver WebP under the exact destination filename.`, reason:'No image for the registry artwork id in any existing extension.' });
  }
  // The existing cuisine pipeline consumes numbered serving/gallery shots.
  // Prefer missing heroes first, then a useful second view for recipes that already have one.
  for (const r of manifest.recipes) {
    if (recipeAliases[r.slug]) continue;
    const hero = images.find(i => i.path === '/assets/img/kitchen/' + r.slug + '.webp' || i.path === '/assets/img/kitchen/' + r.slug + '-1.webp');
    if (!hero) continue;
    add({ id:'recipe-serving-' + r.slug, type:'recipe-serving-detail', priority:r.is_featured ? 55 : 50, name:r.name + ' — serving detail', route:r.route_path, path:'/assets/img/kitchen/' + r.slug + '-2.webp', dimensions:'1200x800', alt:'Serving detail of ' + r.name, source:'tools/afrokitchen/seo-manifest.json', reference_image:hero.path, prompt:`Create a second editorial food photograph of ${r.name} from ${r.country_name}, using the existing hero ${hero.path} as the visual reference for the same dish, ingredients, tableware and lighting. Recipe brief: ${r.description}. Show a closer serving view that reveals the interior or texture, using a serving utensil appropriate to the food; do not merely crop or duplicate the hero. Keep the portion believable and appetising, with no extra ingredients unsupported by the recipe. Landscape 1200x800, natural window light, realistic colour, main portion safely within central 80%. No text, numbers, labels, flags, logos, watermark, collage or UI. Deliver WebP with exact destination filename.`, reason:'Local hero exists, but the serving-detail slot -2 is absent in every extension.' });
  }
  queue.sort((a,b)=>b.priority-a.priority || a.id.localeCompare(b.id));
  const selected=queue.slice(0,200).map((r,i)=>({...r,batch_id,order:i+1}));
  if(selected.length!==200) throw new Error('Only '+selected.length+' verified gaps; do not pad the batch.');
  const pack={schema_version:1,batch_id,generated_at,total:200,remaining_candidates:queue.length-200,note:'Generate only this batch. Before a later batch, import and review delivered assets, rebuild inventory, then select remaining gaps. Existing artwork in any extension is excluded. No automated generation or publishing.',images:selected};
  json(OUT+'/next-200.json',pack);
  write(OUT+'/next-200.csv',csv(selected,['order','id','type','priority','name','route','path','dimensions','reference_image','alt','locale_reuse','status','reason','prompt']));
  write(OUT+'/next-200.md',`# AfroTools image batch ${batch_id}\n\n200 images. Text-free artwork is shared by equivalent translated pages; localize alt text and captions in HTML. Review every generated result before placement. These prompts use the saved repository catalogue, not a fresh source audit.\n\n`+selected.map(r=>`## ${r.order}. ${r.name}\n\n- Destination: \`${r.path}\`\n- Route: ${r.route}\n- Dimensions: ${r.dimensions}\n- Priority: ${r.priority}\n- Alt text (English): ${r.alt}\n- Reason: ${r.reason}\n\n${r.prompt}\n`).join('\n'));
  write(OUT+'/image-audit.md',`# Image library audit\n\nGenerated ${generated_at}. Repository proof only; no deployment.\n\n`+Object.entries(library.summary).map(([k,v])=>`- ${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`).join('\n')+`\n\n## Review boundaries\n\nAll product image files are inventoried and hashed. Existing raster artwork is not labelled text-free without visual review. Shared references across languages do not prove text-free content. Unassigned files and duplicates have explicit review assignments; none are deleted or forced onto unrelated pages. Reference candidates are not verified live 404s. The 60 accepted new food images were visually checked; three are held with reasons in the import receipt.\n\n## Reuse\n\nUse one canonical asset path for the same subject in every locale; translate HTML alt text/captions instead of burning text into pixels. The shared tool registry and AfroKitchen cuisine image data already support canonical paths. Do not reuse an English social card with embedded text as translated artwork. Do not conflate related but distinct regional dishes.\n\n## Daily batch\n\nRun node scripts/build-image-library.js --batch=YYYY-MM-DD after reviewed deliveries are imported. The next-200 outputs are the current work queue; pending prompts remain pending until their files exist and pass review. CSV includes exact destination, route, priority and complete prompt.\n`);
  console.log(JSON.stringify({...library.summary,batch:batch_id,queued:selected.length,types:selected.reduce((a,r)=>(a[r.type]=(a[r.type]||0)+1,a),{})}));
}
let registryCache;
if(require.main===module) nextBatch(build());
module.exports={build,nextBatch,routeFile,csv};

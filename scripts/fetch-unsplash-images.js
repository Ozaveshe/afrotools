#!/usr/bin/env node
/**
 * AfroKitchen — Unsplash Image Mapper
 * Fetches food photography for every recipe and saves a mapping JSON.
 *
 * Usage:
 *   node scripts/fetch-unsplash-images.js --key=UNSPLASH_ACCESS_KEY [options]
 *
 * Options:
 *   --key=KEY              Unsplash access key (required)
 *   --pexels-key=KEY       Pexels API key (optional fallback)
 *   --resume-from=N        Skip first N recipes (default: 0)
 *   --apply                PATCH image_url into Supabase after mapping
 *   --supabase-key=KEY     Supabase service role key (needed for --apply writes)
 *   --dry-run              Process only first 3 recipes (test mode)
 *   --batch-limit=N        Max Unsplash API calls before pausing (default: 45)
 */

'use strict';

var https = require('https');
var http  = require('http');
var fs    = require('fs');
var path  = require('path');
var urlLib = require('url');

// ─── Hardcoded Supabase credentials (main instance — where recipes live) ──────
var SUPABASE_URL      = 'https://zpclagtgczsygrgztlts.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwY2xhZ3RnY3pzeWdyZ3p0bHRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NTg4MzIsImV4cCI6MjA4OTAzNDgzMn0._G-677vi2UTAhcU3t0aquvmd8lnQUBil53ok_Z623F0';

// ─── Paths ────────────────────────────────────────────────────────────────────
var REPO_ROOT      = path.resolve(__dirname, '..');
var OUTPUT_FILE    = path.join(REPO_ROOT, 'tools', 'afrokitchen', 'recipe-images.json');
var PROGRESS_FILE  = path.join(REPO_ROOT, 'tools', 'afrokitchen', 'recipe-images-progress.json');

// ─── Parse CLI args ───────────────────────────────────────────────────────────
var args = {};
process.argv.slice(2).forEach(function (arg) {
  var m = arg.match(/^--([^=]+)(?:=(.+))?$/);
  if (m) args[m[1]] = m[2] !== undefined ? m[2] : true;
});

var UNSPLASH_KEY     = args['key'];
var PEXELS_KEY       = args['pexels-key'] || null;
var RESUME_FROM      = parseInt(args['resume-from'] || '0', 10);
var APPLY            = !!args['apply'];
var SUPABASE_WR_KEY  = args['supabase-key'] || SUPABASE_ANON_KEY;
var DRY_RUN          = !!args['dry-run'];
var BATCH_LIMIT      = parseInt(args['batch-limit'] || '45', 10);
var BATCH_WAIT_MS    = 65 * 60 * 1000; // 65 minutes

if (!UNSPLASH_KEY) {
  console.error('\nError: --key=UNSPLASH_ACCESS_KEY is required\n');
  console.error('Usage: node scripts/fetch-unsplash-images.js --key=YOUR_KEY');
  console.error('       See scripts/README-unsplash-setup.md for details\n');
  process.exit(1);
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
function httpRequest(method, reqUrl, headers, body) {
  return new Promise(function (resolve, reject) {
    var parsed = urlLib.parse(reqUrl);
    var bodyBuf = body ? Buffer.from(JSON.stringify(body)) : null;
    var opts = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.path,
      method: method,
      headers: Object.assign(
        { 'User-Agent': 'AfroKitchen-ImageMapper/1.0' },
        headers || {},
        bodyBuf ? { 'Content-Length': bodyBuf.length } : {}
      )
    };
    var mod = parsed.protocol === 'https:' ? https : http;
    var req = mod.request(opts, function (res) {
      var data = '';
      res.on('data', function (c) { data += c; });
      res.on('end', function () {
        var parsed2;
        try { parsed2 = JSON.parse(data); } catch (e) { parsed2 = data; }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed2 });
      });
    });
    req.on('error', reject);
    if (bodyBuf) req.write(bodyBuf);
    req.end();
  });
}

function httpGet(url, headers) {
  return httpRequest('GET', url, headers, null);
}

function httpPatch(url, headers, body) {
  return httpRequest('PATCH', url, Object.assign({ 'Content-Type': 'application/json' }, headers), body);
}

function sleep(ms) {
  return new Promise(function (r) { setTimeout(r, ms); });
}

// ─── Supabase ─────────────────────────────────────────────────────────────────
async function fetchAllRecipes() {
  console.log('Fetching recipe list from Supabase...');
  var url = SUPABASE_URL + '/rest/v1/recipes'
    + '?select=id,slug,name,category,country_name,country_code'
    + '&order=name&limit=500';
  var res = await httpGet(url, {
    'apikey':        SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
  });
  if (res.status !== 200 || !Array.isArray(res.body)) {
    throw new Error('Supabase fetch failed (' + res.status + '): ' + JSON.stringify(res.body).slice(0, 200));
  }
  console.log('Found ' + res.body.length + ' recipes.\n');
  return res.body;
}

async function applyToSupabase(recipeId, imageUrl, imageAlt) {
  var url = SUPABASE_URL + '/rest/v1/recipes?id=eq.' + recipeId;
  var body = { image_url: imageUrl };
  if (imageAlt) body.image_alt = imageAlt;
  var res = await httpPatch(url, {
    'apikey':        SUPABASE_WR_KEY,
    'Authorization': 'Bearer ' + SUPABASE_WR_KEY,
    'Prefer':        'return=minimal'
  }, body);
  return res.status >= 200 && res.status < 300;
}

// ─── Unsplash ─────────────────────────────────────────────────────────────────
var unsplashCallCount = 0;

async function searchUnsplash(query) {
  unsplashCallCount++;
  var encoded = encodeURIComponent(query);
  var url = 'https://api.unsplash.com/search/photos?query=' + encoded
    + '&per_page=5&orientation=landscape&content_filter=high';
  var res = await httpGet(url, {
    'Authorization':  'Client-ID ' + UNSPLASH_KEY,
    'Accept-Version': 'v1'
  });
  // Rate-limited — wait a full cycle then retry
  if (res.status === 429) {
    console.log('\n  [rate-limit] Unsplash returned 429. Waiting 65 min...');
    await sleep(BATCH_WAIT_MS);
    unsplashCallCount = 0;
    return searchUnsplash(query);
  }
  if (res.status !== 200 || !res.body || !Array.isArray(res.body.results)) return null;
  var results = res.body.results;
  if (!results.length) return null;
  // Prefer landscape (width > height) — usually already filtered, but double-check
  for (var i = 0; i < results.length; i++) {
    if (results[i].width && results[i].height && results[i].width >= results[i].height) {
      return results[i];
    }
  }
  return results[0]; // fallback to first
}

// ─── Pexels ───────────────────────────────────────────────────────────────────
async function searchPexels(query) {
  if (!PEXELS_KEY) return null;
  var encoded = encodeURIComponent(query);
  var url = 'https://api.pexels.com/v1/search?query=' + encoded + '&per_page=5&orientation=landscape';
  var res = await httpGet(url, { 'Authorization': PEXELS_KEY });
  if (res.status !== 200 || !res.body || !Array.isArray(res.body.photos)) return null;
  var photos = res.body.photos;
  return photos.length ? photos[0] : null;
}

// ─── Query strategy ───────────────────────────────────────────────────────────
function buildQueries(recipe) {
  var name     = recipe.name || '';
  var country  = recipe.country_name || '';
  var category = (recipe.category || 'main').replace(/_/g, ' ');
  return [
    name + ' African food',
    name + ' ' + country + ' food',
    name + ' food',
    name,
    category + ' African food'
  ];
}

// ─── Format image entries ─────────────────────────────────────────────────────
function formatUnsplash(photo, query) {
  var rawBase = (photo.urls.raw || photo.urls.regular || '').split('?')[0];
  return {
    thumb:             rawBase + '?w=400&fit=crop&q=80&auto=format',
    full:              rawBase + '?w=1080&fit=crop&q=80&auto=format',
    photographer:      photo.user ? photo.user.name : null,
    photographer_url:  photo.user && photo.user.links
                         ? photo.user.links.html + '?utm_source=afrotools&utm_medium=referral'
                         : null,
    unsplash_url:      photo.links
                         ? photo.links.html + '?utm_source=afrotools&utm_medium=referral'
                         : null,
    photo_id:          photo.id || null,
    source:            'unsplash',
    query_used:        query,
    match_quality:     'matched'
  };
}

function formatPexels(photo, query) {
  return {
    thumb:             photo.src ? photo.src.medium : null,
    full:              photo.src ? (photo.src.large2x || photo.src.large) : null,
    photographer:      photo.photographer || null,
    photographer_url:  photo.photographer_url
                         ? photo.photographer_url + '?utm_source=afrotools&utm_medium=referral'
                         : null,
    unsplash_url:      photo.url
                         ? photo.url + '?utm_source=afrotools&utm_medium=referral'
                         : null,
    photo_id:          photo.id ? String(photo.id) : null,
    source:            'pexels',
    query_used:        query,
    match_quality:     'matched'
  };
}

// ─── Progress file ────────────────────────────────────────────────────────────
function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    }
  } catch (e) { /* fresh start */ }
  return { recipes: {} };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('AfroKitchen — Unsplash Image Mapper');
  console.log('====================================');
  if (DRY_RUN) console.log('DRY RUN: Processing first 3 recipes only\n');
  if (APPLY)   console.log('APPLY MODE: Will PATCH Supabase image_url after mapping\n');

  var recipes = await fetchAllRecipes();
  if (DRY_RUN) recipes = recipes.slice(0, 3);

  var total    = recipes.length;
  var progress = loadProgress();
  var matched  = 0;
  var failed   = 0;

  // Count already-done entries from a previous run
  Object.keys(progress.recipes).forEach(function (slug) {
    if ((progress.recipes[slug] || {}).match_quality === 'matched') matched++;
    else failed++;
  });

  // ── Per-recipe loop ──
  for (var i = RESUME_FROM; i < total; i++) {
    var recipe = recipes[i];
    var slug   = recipe.slug;

    // Already mapped in a previous run — skip
    if (progress.recipes[slug]) {
      var q = progress.recipes[slug].match_quality;
      console.log('[' + (i + 1) + '/' + total + '] SKIP  ' + slug + ' (' + q + ')');
      continue;
    }

    // Batch-limit guard
    if (unsplashCallCount >= BATCH_LIMIT) {
      console.log('\n⚠  Batch limit reached (' + BATCH_LIMIT + ' Unsplash calls).');
      console.log('   Progress saved. Waiting 65 minutes...');
      console.log('   (Or Ctrl-C and restart with --resume-from=' + i + ')\n');
      saveProgress(progress);
      await sleep(BATCH_WAIT_MS);
      unsplashCallCount = 0;
    }

    var queries    = buildQueries(recipe);
    var bestMatch  = null;
    var queryUsed  = queries[0];

    // Try Unsplash queries in priority order
    for (var q2 = 0; q2 < queries.length; q2++) {
      if (unsplashCallCount >= BATCH_LIMIT) break;
      var photo = await searchUnsplash(queries[q2]);
      if (photo) {
        bestMatch = formatUnsplash(photo, queries[q2]);
        queryUsed = queries[q2];
        break;
      }
      await sleep(400); // be polite between retries
    }

    // Pexels fallback if Unsplash returned nothing
    if (!bestMatch && PEXELS_KEY) {
      var pPhoto = await searchPexels(recipe.name + ' food');
      if (pPhoto) {
        bestMatch = formatPexels(pPhoto, recipe.name + ' food');
        queryUsed = recipe.name + ' food (pexels)';
      }
    }

    if (bestMatch) {
      progress.recipes[slug] = bestMatch;
      matched++;
      console.log('[' + (i + 1) + '/' + total + '] ✓  ' + slug);
      console.log('        → ' + (bestMatch.thumb || '').slice(0, 70) + '...');
      console.log('        by ' + (bestMatch.photographer || 'unknown') + ' [' + (bestMatch.source || '') + ']');
    } else {
      progress.recipes[slug] = {
        thumb: null, full: null,
        photographer: null, photographer_url: null, unsplash_url: null,
        photo_id: null, source: null,
        query_used:    queryUsed,
        match_quality: 'none',
        fallback:      'category-' + (recipe.category || 'main')
      };
      failed++;
      console.log('[' + (i + 1) + '/' + total + '] ✗  ' + slug + ' — no match');
    }

    // Save progress every 10 recipes
    if ((i + 1) % 10 === 0) saveProgress(progress);

    // Throttle: 1.2 s between recipes (keeps well under rate limit)
    await sleep(1200);
  }

  // ── Save final output ──
  saveProgress(progress);

  var output = {
    _generated:  new Date().toISOString(),
    _source:     'Unsplash API — https://unsplash.com',
    _license:    'Unsplash License — hotlink only, do NOT re-host images',
    _attribution:'Required: show photographer credit on pages using these images',
    _total:      total,
    _matched:    matched,
    _failed:     failed,
    recipes:     progress.recipes
  };
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');

  console.log('\n─────────────────────────────────────');
  console.log('✓ Saved → ' + OUTPUT_FILE);
  console.log('  Total: ' + total + '  |  Matched: ' + matched + '  |  No match: ' + failed);

  // ── Apply to Supabase ──
  if (APPLY) {
    console.log('\nApplying image_url to Supabase...');
    var applyOk = 0;
    var applyFail = 0;
    for (var j = 0; j < recipes.length; j++) {
      var r2 = recipes[j];
      var entry = progress.recipes[r2.slug];
      if (!entry || !entry.full) { process.stdout.write('-'); continue; }
      var alt  = r2.name + ' — ' + (r2.country_name || '') + ' recipe';
      var ok   = await applyToSupabase(r2.id, entry.full, alt);
      if (ok) { applyOk++; process.stdout.write('.'); }
      else    { applyFail++; process.stdout.write('x'); }
      await sleep(80);
    }
    console.log('\n✓ Applied: ' + applyOk + '  |  Failed: ' + applyFail);
    if (applyFail > 0) {
      console.log('\n  Tip: Supabase anon key may lack UPDATE permission.');
      console.log('  Re-run with --supabase-key=YOUR_SERVICE_ROLE_KEY');
    }
  }

  console.log('\nNext steps:');
  console.log('  1. Review tools/afrokitchen/recipe-images.json');
  console.log('  2. Fix bad matches in tools/afrokitchen/recipe-images-override.json');
  if (!APPLY) {
    console.log('  3. Run with --apply --supabase-key=SERVICE_ROLE_KEY to update Supabase');
  }
  console.log('  ' + (!APPLY ? '4' : '3') + '. git add -A && git commit -m "feat: add Unsplash food photography" && git push');
  console.log('');
}

main().catch(function (err) {
  console.error('\nFatal error:', err.message || err);
  process.exit(1);
});

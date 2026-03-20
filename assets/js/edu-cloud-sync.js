/**
 * AfroTools — Education Cloud Sync
 *
 * Offline-first sync: saves to localStorage immediately,
 * then debounced sync to Supabase when logged in.
 * On login, merges cloud data with local (cloud wins on conflict).
 *
 * Usage:
 *   EduCloudSync.save('gpa', data)    — save locally + queue sync
 *   EduCloudSync.load('gpa')          — load from localStorage
 *   EduCloudSync.syncAll()            — force full sync
 *   EduCloudSync.onLogin()            — merge cloud → local
 */
var EduCloudSync = (function () {
  'use strict';

  var SYNC_DEBOUNCE = 3000; // 3 seconds
  var LS_PREFIX = 'afro_edu_';
  var _timers = {};

  // Table config: localStorage key → Supabase table → unique key strategy
  var TABLES = {
    gpa: { table: 'education_gpa_records', lsKey: 'gpa_data', upsertKey: 'user_id' },
    flashcards: { table: 'education_flashcard_decks', lsKey: 'fc_state', multi: true },
    studyplan: { table: 'education_study_plans', lsKey: 'sp_data', upsertKey: 'user_id' }
  };

  /* ── localStorage helpers ── */
  function lsGet(key) {
    try { return JSON.parse(localStorage.getItem(LS_PREFIX + key)); }
    catch (e) { return null; }
  }

  function lsSet(key, data) {
    try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(data)); }
    catch (e) { /* quota exceeded — silent */ }
  }

  /* ── Auth helpers ── */
  function isLoggedIn() {
    return window.AfroAuth && typeof AfroAuth.isLoggedIn === 'function' && AfroAuth.isLoggedIn();
  }

  function getToken() {
    if (!isLoggedIn()) return Promise.resolve(null);
    if (typeof AfroAuth.getSessionTokenAsync === 'function') return AfroAuth.getSessionTokenAsync();
    if (typeof AfroAuth.getSessionToken === 'function') return Promise.resolve(AfroAuth.getSessionToken());
    return Promise.resolve(null);
  }

  function getUserId() {
    if (!window.AfroAuth || typeof AfroAuth.getUser !== 'function') return null;
    var user = AfroAuth.getUser();
    return user ? user.id : null;
  }

  /* ── Core: save locally + queue sync ── */
  function save(type, data) {
    var cfg = TABLES[type];
    if (!cfg) return;

    // Save to localStorage immediately
    lsSet(cfg.lsKey, data);

    // Mark dirty
    lsSet(cfg.lsKey + '_dirty', true);

    // Debounced sync to cloud
    clearTimeout(_timers[type]);
    _timers[type] = setTimeout(function () {
      syncToCloud(type);
    }, SYNC_DEBOUNCE);
  }

  /* ── Core: load from localStorage ── */
  function load(type) {
    var cfg = TABLES[type];
    if (!cfg) return null;
    return lsGet(cfg.lsKey);
  }

  /* ── Sync single type to Supabase ── */
  function syncToCloud(type) {
    if (!isLoggedIn()) return;
    var cfg = TABLES[type];
    if (!cfg) return;

    var data = lsGet(cfg.lsKey);
    if (!data) return;

    var userId = getUserId();
    if (!userId) return;

    getToken().then(function (token) {
      if (!token) return;

      var payload;
      if (type === 'gpa') {
        payload = {
          user_id: userId,
          grading_system: data.system || 'nigerian_federal',
          semesters: JSON.stringify(data.semesters || []),
          cgpa: data.cgpa || null,
          total_credits: data.totalCredits || 0,
          updated_at: new Date().toISOString()
        };
      } else if (type === 'flashcards') {
        // Sync each deck separately
        var decks = data.decks || [];
        decks.forEach(function (deck) {
          var deckPayload = {
            user_id: userId,
            deck_name: deck.name,
            cards: JSON.stringify(deck.cards || []),
            card_count: (deck.cards || []).length,
            updated_at: new Date().toISOString()
          };
          upsertToSupabase(cfg.table, deckPayload, token, 'user_id,deck_name');
        });
        lsSet(cfg.lsKey + '_dirty', false);
        return;
      } else if (type === 'studyplan') {
        payload = {
          user_id: userId,
          plan_name: data.planName || 'My Plan',
          subjects: JSON.stringify(data.subjects || []),
          preferences: JSON.stringify(data.preferences || {}),
          timetable: data.timetable ? JSON.stringify(data.timetable) : null,
          updated_at: new Date().toISOString()
        };
      }

      if (payload) {
        upsertToSupabase(cfg.table, payload, token, cfg.upsertKey).then(function () {
          lsSet(cfg.lsKey + '_dirty', false);
          console.log('[edu-cloud] Synced ' + type);
        });
      }
    }).catch(function () { /* silent */ });
  }

  /* ── Upsert to Supabase via REST ── */
  function upsertToSupabase(table, payload, token, onConflict) {
    // Use the data Supabase instance
    var url = 'https://jbmhfpkzbgyeodsqhprx.supabase.co/rest/v1/' + table;
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpibWhmcGt6Ymd5ZW9kc3FocHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNDEwNTgsImV4cCI6MjA1MDYxNzA1OH0.8sxJDkel7MJBZxJ-JXf3bEqIyp-cGQROL-6RBLUBpmg',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(payload)
    }).catch(function () { /* silent */ });
  }

  /* ── Load from cloud on login (cloud wins) ── */
  function onLogin() {
    if (!isLoggedIn()) return;

    getToken().then(function (token) {
      if (!token) return;
      var userId = getUserId();
      if (!userId) return;

      // Load each type from cloud
      Object.keys(TABLES).forEach(function (type) {
        var cfg = TABLES[type];
        var isDirty = lsGet(cfg.lsKey + '_dirty');

        loadFromCloud(cfg.table, token, userId).then(function (cloudData) {
          if (!cloudData || cloudData.length === 0) {
            // No cloud data — push local if dirty
            if (isDirty) syncToCloud(type);
            return;
          }

          if (type === 'gpa' && cloudData[0]) {
            var cd = cloudData[0];
            var local = lsGet(cfg.lsKey);
            var cloudTime = new Date(cd.updated_at).getTime();
            var localTime = local && local.updated_at ? new Date(local.updated_at).getTime() : 0;

            if (cloudTime >= localTime) {
              // Cloud wins
              lsSet(cfg.lsKey, {
                system: cd.grading_system,
                semesters: typeof cd.semesters === 'string' ? JSON.parse(cd.semesters) : cd.semesters,
                cgpa: cd.cgpa,
                totalCredits: cd.total_credits,
                updated_at: cd.updated_at
              });
              lsSet(cfg.lsKey + '_dirty', false);
            } else if (isDirty) {
              syncToCloud(type);
            }
          } else if (type === 'flashcards') {
            // Merge decks: cloud wins per deck
            var local = lsGet(cfg.lsKey) || { decks: [] };
            var localDecks = local.decks || [];
            var cloudDecks = cloudData.map(function (cd) {
              return {
                name: cd.deck_name,
                cards: typeof cd.cards === 'string' ? JSON.parse(cd.cards) : cd.cards,
                updated_at: cd.updated_at
              };
            });

            // Merge: for each cloud deck, replace local if newer
            cloudDecks.forEach(function (cd) {
              var idx = -1;
              localDecks.forEach(function (ld, i) {
                if (ld.name === cd.name) idx = i;
              });
              if (idx >= 0) {
                var localTime = localDecks[idx].updated_at ? new Date(localDecks[idx].updated_at).getTime() : 0;
                if (new Date(cd.updated_at).getTime() >= localTime) {
                  localDecks[idx] = cd;
                }
              } else {
                localDecks.push(cd);
              }
            });
            local.decks = localDecks;
            lsSet(cfg.lsKey, local);
            lsSet(cfg.lsKey + '_dirty', false);
          } else if (type === 'studyplan' && cloudData[0]) {
            var cd = cloudData[0];
            var local = lsGet(cfg.lsKey);
            var cloudTime = new Date(cd.updated_at).getTime();
            var localTime = local && local.updated_at ? new Date(local.updated_at).getTime() : 0;

            if (cloudTime >= localTime) {
              lsSet(cfg.lsKey, {
                planName: cd.plan_name,
                subjects: typeof cd.subjects === 'string' ? JSON.parse(cd.subjects) : cd.subjects,
                preferences: typeof cd.preferences === 'string' ? JSON.parse(cd.preferences) : cd.preferences,
                timetable: cd.timetable ? (typeof cd.timetable === 'string' ? JSON.parse(cd.timetable) : cd.timetable) : null,
                updated_at: cd.updated_at
              });
              lsSet(cfg.lsKey + '_dirty', false);
            } else if (isDirty) {
              syncToCloud(type);
            }
          }
        }).catch(function () { /* silent */ });
      });
    }).catch(function () { /* silent */ });
  }

  /* ── Load from Supabase ── */
  function loadFromCloud(table, token, userId) {
    var url = 'https://jbmhfpkzbgyeodsqhprx.supabase.co/rest/v1/' + table + '?user_id=eq.' + userId;
    return fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + token,
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpibWhmcGt6Ymd5ZW9kc3FocHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNDEwNTgsImV4cCI6MjA1MDYxNzA1OH0.8sxJDkel7MJBZxJ-JXf3bEqIyp-cGQROL-6RBLUBpmg'
      }
    }).then(function (res) { return res.json(); })
    .catch(function () { return []; });
  }

  /* ── Sync all types ── */
  function syncAll() {
    Object.keys(TABLES).forEach(function (type) {
      syncToCloud(type);
    });
  }

  return {
    save: save,
    load: load,
    syncAll: syncAll,
    onLogin: onLogin
  };
})();

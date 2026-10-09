// Local PDF history: metadata and file bytes commit or roll back together.
(function () {
  'use strict';
  var DB = 'afrotools-pdf-workspace', FILES = 'recent-files', ITEMS = 'recent-operations', STATE = 'history-state';
  var ready = null, section = document.getElementById('pdf-saved-section'), grid = document.getElementById('pdf-saved-grid');
  var limit = 2, isPro = false, renderVersion = 0;
  function failure(code) { var e = new Error(code); e.code = code; return e; }
  function open() {
    return new Promise(function (resolve, reject) {
      var settled = false, request;
      try { request = indexedDB.open(DB, 2); } catch (_) { reject(failure('READ_FAILED')); return; }
      request.onupgradeneeded = function () {
        [FILES, ITEMS, STATE].forEach(function (name) { if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name); });
      };
      request.onblocked = function () { settled = true; reject(failure('BLOCKED')); };
      request.onerror = function () { settled = true; reject(failure('READ_FAILED')); };
      request.onsuccess = function () {
        if (settled) { request.result.close(); return; }
        request.result.onversionchange = function () { request.result.close(); };
        resolve(request.result);
      };
    });
  }
  function transaction(names, mode, action) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx, result, problem;
        try { tx = db.transaction(names, mode); } catch (_) { db.close(); reject(failure(mode === 'readonly' ? 'READ_FAILED' : 'WRITE_FAILED')); return; }
        function fail(code) { problem = failure(typeof code === 'string' ? code : mode === 'readonly' ? 'READ_FAILED' : 'WRITE_FAILED'); try { tx.abort(); } catch (_) {} }
        function on(request, callback) {
          request.onsuccess = function () { try { callback(request.result); } catch (e) { fail(e.code || 'INVALID_STORAGE'); } };
        }
        tx.oncomplete = function () { db.close(); resolve(result); };
        tx.onabort = function () { db.close(); reject(problem || failure(mode === 'readonly' ? 'READ_FAILED' : 'WRITE_FAILED')); };
        tx.onerror = function () {}; // The abort event owns failure reporting.
        try { action(tx, function (value) { result = value; }, on, fail); }
        catch (e) { fail(e.code || 'WRITE_FAILED'); }
      });
    });
  }
  function initialize() {
    if (!ready) ready = transaction([FILES, ITEMS, STATE], 'readwrite', function (tx, done, on) {
      on(tx.objectStore(STATE).get('legacy-imported'), function (imported) {
        if (imported) return;
        if (!window.SaveState) throw failure('READ_FAILED');
        // Read and validate before writing anything. Never delete old metadata or
        // unindexed bytes: they may be the user's only recoverable copy.
        var legacy = new window.SaveState('pdf-workspace', {maxFree:10}).getAll();
        legacy.forEach(function (record) {
          on(tx.objectStore(FILES).get(record.id), function (bytes) {
            tx.objectStore(ITEMS).put({id:record.id,title:record.title,createdAt:record.createdAt,updatedAt:record.updatedAt,data:{operation:record.data && typeof record.data.operation === 'string' ? record.data.operation : '',hasFile:!!bytes}}, record.id);
          });
        });
        tx.objectStore(STATE).put(true, 'legacy-imported');
      });
    }).catch(function (e) { ready = null; throw e; });
    return ready;
  }
  var store = {
    list: function () { return initialize().then(function () { return transaction([ITEMS], 'readonly', function (tx, done, on) { on(tx.objectStore(ITEMS).getAll(), function (items) { done(items.sort(function (a,b) { return b.updatedAt-a.updatedAt; })); }); }); }); },
    save: function (title, operation, bytes) {
      var id = window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
      var now = Date.now(), copy = bytes ? new Uint8Array(bytes) : null;
      var item = {id:id,title:String(title || 'PDF'),createdAt:now,updatedAt:now,data:{operation:String(operation || ''),hasFile:!!copy}};
      return initialize().then(function () { return transaction([ITEMS, FILES], 'readwrite', function (tx, done, on) {
        on(tx.objectStore(ITEMS).count(), function (count) {
          if (count >= 10) throw failure('LIMIT_REACHED');
          if (copy) tx.objectStore(FILES).put(copy,id);
          tx.objectStore(ITEMS).put(item,id); done(item);
        });
      }); });
    },
    get: function (id) { return initialize().then(function () { return transaction([ITEMS, FILES], 'readonly', function (tx, done, on) { on(tx.objectStore(ITEMS).get(id), function (item) { on(tx.objectStore(FILES).get(id), function (bytes) { done({item:item || null,bytes:bytes || null}); }); }); }); }); },
    remove: function (id) { return initialize().then(function () { return transaction([ITEMS, FILES], 'readwrite', function (tx) { tx.objectStore(FILES).delete(id); tx.objectStore(ITEMS).delete(id); }); }); }
  };
  window.AfroPdfHistory = store;
  function language() { return (document.documentElement.lang || 'en').split('-')[0]; }
  function copy(key) {
    var messages = {
      blocked:['Close other PDF Workspace tabs, then retry. Existing files are unchanged.','Fermez les autres onglets de l’espace PDF, puis réessayez. Les fichiers existants sont conservés.','Funga vichupo vingine vya nafasi ya PDF, kisha ujaribu tena. Faili zilizopo hazijabadilishwa.'],
      missing:['This entry has no saved PDF copy. Your current document is unchanged.','Cette entrée ne contient pas de copie PDF enregistrée. Le document actuel est conservé.','Rekodi hii haina nakala ya PDF iliyohifadhiwa. Hati yako ya sasa haijabadilishwa.'],
      invalid:['This saved PDF could not be opened.','Ce PDF enregistré n’a pas pu être ouvert.','PDF hii iliyohifadhiwa haikuweza kufunguliwa.'],
      remove:['Delete this saved PDF and its history entry?','Supprimer ce PDF enregistré et son historique ?','Ufute PDF hii iliyohifadhiwa na rekodi yake?'],
      resume:['Resume','Reprendre','Endelea'],delete:['Delete','Supprimer','Futa'],
      empty:['No saved PDF operations.','Aucune opération PDF enregistrée.','Hakuna shughuli za PDF zilizohifadhiwa.'],
      free:['Free: showing last 2 PDF operations','Gratuit : les 2 dernières opérations PDF','Bure: shughuli 2 za mwisho za PDF'],
      pro:['Pro: showing last 10 PDF operations','Pro : les 10 dernières opérations PDF','Pro: shughuli 10 za mwisho za PDF'],
      upgrade:['Upgrade to view remaining saved operations','Passer à Pro pour voir les autres opérations','Boresha mpango ili kuona shughuli nyingine'],
      opening:['Opening recent PDF…','Ouverture du PDF récent…','Inafungua PDF ya hivi karibuni…'],
      downloaded:['Downloaded PDF','PDF téléchargé','PDF iliyopakuliwa']
    };
    return messages[key][language()==='fr'?1:language()==='sw'?2:0];
  }
  function report(error) {
    var message = error.code === 'BLOCKED' ? copy('blocked') : error.code === 'MISSING' ? copy('missing') : error.code === 'INVALID_PDF' ? copy('invalid') : window.SaveState ? window.SaveState.message(error,language()) : copy('blocked');
    if (section) section.style.display='';
    var status=document.getElementById('pdfHistoryError');
    if (!status && grid) { status=document.createElement('p');status.id='pdfHistoryError';status.setAttribute('role','status');grid.before(status); }
    if (status) status.textContent=message;
    if (typeof window.toast==='function') window.toast(message,1);
  }
  function clearError() { var status=document.getElementById('pdfHistoryError');if(status)status.remove(); }
  async function render() {
    if (!section || !grid) return;
    var version=++renderVersion;
    try {
      var all=await store.list();if(version!==renderVersion)return;
      clearError();grid.replaceChildren();section.style.display='';
      var head=section.querySelector('[data-pdf-history-status]');
      if(!head){head=document.createElement('div');head.dataset.pdfHistoryStatus='';grid.before(head);}
      head.textContent=all.length?copy(isPro?'pro':'free'):copy('empty');
      if(all.length>limit){var link=document.createElement('a');link.href='/pro/';link.textContent=copy('upgrade');head.append(' ',link);}
      all.slice(0,limit).forEach(function(item){
        var card=document.createElement('article');card.dataset.pdfHistoryId=item.id;card.style.cssText='flex:1;min-width:180px;max-width:240px;padding:12px;border:1px solid #64748b;border-radius:10px;overflow-wrap:anywhere';
        var title=document.createElement('strong'),operation=document.createElement('p'),time=document.createElement('time'),actions=document.createElement('div');
        title.textContent=item.title;operation.textContent=item.data.operation==='Downloaded PDF'?copy('downloaded'):item.data.operation;
        time.dateTime=new Date(item.updatedAt).toISOString();time.textContent=new Date(item.updatedAt).toLocaleString(language());
        [['resume',window.pdfResumeSaved],['delete',window.pdfDelSaved]].forEach(function(action){var button=document.createElement('button');button.type='button';button.dataset.pdfHistoryAction=action[0];button.textContent=copy(action[0]);button.style.cssText='min-width:44px;min-height:44px;margin-right:8px';button.addEventListener('click',function(){action[1](item.id);});actions.appendChild(button);});
        card.append(title,operation,time,actions);grid.appendChild(card);
      });
    } catch(e) { if(version===renderVersion)report(e); }
  }
  window.pdfSaveOp=async function(name,operation,bytes){try{var item=await store.save(name,operation,bytes);await render();return item;}catch(e){report(e);return null;}};
  window.pdfDelSaved=async function(id){if(!window.confirm(copy('remove')))return false;try{await store.remove(id);await render();var next=grid.querySelector('button')||section.querySelector('[data-pdf-history-status]');if(next){next.tabIndex=0;next.focus();}return true;}catch(e){report(e);return false;}};
  window.pdfResumeSaved=async function(id){
    try{
      var result=await store.get(id);if(!result.item||!result.bytes)throw failure('MISSING');
      var opened=await window.queueWorkspaceFile(new File([result.bytes],result.item.title,{type:'application/pdf'}));
      if(opened===false)throw failure('INVALID_PDF');
      if(opened===true)clearError();
    }
    catch(e){if(typeof window.hideP==='function')window.hideP();report(e.code?e:failure('READ_FAILED'));}
  };
  function readJson(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch(_){return null;}}
  function validExpiry(value){if(!value)return true;var ms=Date.parse(value);return Number.isNaN(ms)||ms>Date.now();}
  function refreshPlan(){
    var cache=readJson('afro_pro_status_cache'),profile=readJson('afro_profile_cache'),user=(profile&&profile.user)||readJson('afro_auth_v2')||{},tier=String(user.subscription_tier||user.tier||user.plan||'').toLowerCase(),role=String(user.role||'').toLowerCase();
    isPro=!!(cache&&cache.isPro&&validExpiry(cache.expiresAt))||((role==='admin'||role==='owner'||['pro','premium','team','business','enterprise','lifetime','trialing'].includes(tier))&&validExpiry(user.subscription_expires_at||user.pro_expires_at||user.expires_at));
    limit=isPro?10:2;render();
    if(window.AfroProGate&&window.AfroProGate.getStatus)window.AfroProGate.getStatus().then(function(status){isPro=!!(status&&status.isPro);limit=isPro?10:2;render();}).catch(function(){});
  }
  refreshPlan();window.addEventListener('afro-auth-change',refreshPlan);window.addEventListener('afro-pro-gate-ready',refreshPlan);
})();

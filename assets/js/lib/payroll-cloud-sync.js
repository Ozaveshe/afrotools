/* Explicit account copies for Payroll journeys. Device autosave remains separate. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) { root.AfroTools = root.AfroTools || {}; root.AfroTools.payrollCloudSync = api; }
})(typeof window === 'undefined' ? null : window, function () {
  'use strict';
  var VERSION = 'payroll-workflow-sync-v1';
  function account() {
    var auth = window.AfroAuth;
    if (!auth || (auth.isLoggedIn && !auth.isLoggedIn())) return '';
    var user = auth.getUser && auth.getUser();
    return user && user.id || '';
  }
  function create(options) {
    var grant = '', generation = 0, revision = 0, busy = false, backup = null;
    function message(text) { options.status(text); }
    function allowed(run, id) { return run === generation && grant === id && !!id && options.account() === id; }
    function stop() {
      generation++; grant = ''; busy = false;
      if (options.reset) options.reset();
      message('Device-only. Account access is off. Existing account copies are not deleted.');
    }
    function changed() {
      revision++;
      if (grant && options.account() !== grant) { stop(); return; }
      if (grant) message('Device changes are not saved to your account. Choose Save to account when ready.');
    }
    function consent(checked) {
      stop();
      if (!checked) return false;
      grant = options.account();
      if (!grant) { message('Sign in first. Your device copy is unchanged.'); return false; }
      message('Account access enabled for this account on this page. Choose Save or Load; nothing has been sent.');
      return true;
    }
    function permission(run, id, timestamp) {
      return { accountId: id, consentVersion: VERSION, consentedAt: timestamp,
        canRequest: function () { return allowed(run, id); } };
    }
    function error(result) {
      var reason = result && result.reason;
      if (reason === 'backend-unavailable') return 'Account storage is unavailable. Your device copy is unchanged; try again later.';
      if (reason === 'client-unavailable') return 'Account connection is unavailable. Your device copy is unchanged.';
      if (reason === 'unconfirmed') return 'The account save was not confirmed. Keep your device copy and retry when ready.';
      if (reason === 'invalid-copy') return 'This copy is incompatible with the current journey. Your device copy is unchanged.';
      return 'Account request failed. Your device copy is unchanged; try again when ready.';
    }
    async function request(kind) {
      var id = grant, run = generation;
      if (!allowed(run, id)) { stop(); return false; }
      if (busy) return false;
      var snapshot = kind === 'save' ? options.snapshot() : null;
      var edit = revision;
      if (kind === 'save' && !snapshot) { message('Start a valid journey and save its device copy before saving to your account.'); return false; }
      busy = true;
      if (options.busy) options.busy(true);
      message(kind === 'save' ? 'Saving this copy to your account…' : 'Loading account copy…');
      try {
        var p = permission(run, id, kind === 'save' ? new Date().toISOString() : undefined);
        var result = kind === 'save' ? await options.engine.syncToSupabase(options.journeyId, id, snapshot, p) :
          kind === 'list' ? await options.engine.getIncompleteJourneysFromSupabase(id, p) :
          await options.engine.loadProgressFromSupabase(options.journeyId, id, p);
        if (!allowed(run, id)) return false;
        if (!result || !result.ok) { message(error(result)); return false; }
        if (edit !== revision) { message('Device changes occurred during this request. No account copy was restored; newer device changes still need saving.'); return false; }
        if (kind === 'save') { message('This device copy was saved to your account. Later edits stay on this device until you Save again.'); return true; }
        if (kind === 'list') { options.list(result.journeys); message(result.journeys.length ? 'Account journey list loaded. Open a journey, then explicitly Load its account copy.' : 'No incomplete account journeys found. Device progress is unchanged.'); return true; }
        if (!result.progress) { message('No account copy exists for this journey. Your device copy is unchanged.'); return true; }
        if (!options.confirm('Replace this journey on this device with the account copy, including country, pay, role and checklist? A device backup will be kept so you can Undo here.')) {
          message('Account copy was not restored. Your device copy is unchanged.'); return false;
        }
        if (!allowed(run, id) || edit !== revision) return false;
        var saved = options.backup();
        if (!saved) { message('Could not keep a device backup. Nothing was replaced.'); return false; }
        backup = saved;
        if (!options.restore(result.progress)) { message('Account copy could not be restored. Your device backup is retained.'); return false; }
        revision++;
        if (options.undoAvailable) options.undoAvailable(true);
        message('Account copy restored for review. Previous device draft is retained; Undo is available on this page. Nothing was calculated or submitted.');
        return true;
      } catch (errorValue) {
        if (allowed(run, id)) message('Account request failed. Your device copy is unchanged; try again when ready.');
        return false;
      } finally {
        if (run === generation) { busy = false; if (options.busy) options.busy(false); }
      }
    }
    return { consent: consent, stop: stop, changed: changed, accountChanged: function () { if (grant && options.account() !== grant) stop(); },
      save: function () { return request('save'); }, load: function () { return request('load'); }, list: function () { return request('list'); },
      undo: function () {
        if (!backup || !options.confirm('Restore your previous device draft? Current device changes will be replaced.')) return false;
        generation++; busy = false;
        if (!options.undo(backup)) { message('Previous device draft could not be restored. The backup is retained.'); return false; }
        backup = null; revision++;
        if (options.busy) options.busy(false);
        if (options.undoAvailable) options.undoAvailable(false);
        message('Previous device draft restored. Your account copy was not changed.'); return true;
      } };
  }
  function mount(options) {
    var doc = options.document || document;
    var checkbox = doc.getElementById('apo-account-consent'), status = doc.getElementById('apo-account-status');
    if (!checkbox || !status) return null;
    var save = doc.getElementById('apo-account-save'), load = doc.getElementById('apo-account-load'), undo = doc.getElementById('apo-account-undo');
    options.account = options.account || account;
    options.status = function (text) { status.textContent = text; };
    function buttons(disabled) { if (save) save.disabled = disabled; if (load) load.disabled = disabled; }
    options.busy = function (busy) { buttons(busy || !checkbox.checked); };
    options.reset = function () { checkbox.checked = false; buttons(true); if (options.clearList) options.clearList(); };
    options.undoAvailable = function (available) { if (undo) undo.hidden = !available; };
    options.confirm = options.confirm || function (text) { return window.confirm(text); };
    var controller = create(options);
    checkbox.addEventListener('change', function () { var checked = checkbox.checked; var enabled = controller.consent(checked); checkbox.checked = enabled; buttons(!enabled); });
    if (save) save.addEventListener('click', controller.save);
    if (load) load.addEventListener('click', options.list ? controller.list : controller.load);
    if (undo) undo.addEventListener('click', controller.undo);
    window.addEventListener('afro-auth-change', controller.accountChanged);
    window.addEventListener('pagehide', controller.stop);
    controller.stop();
    return controller;
  }
  return { VERSION: VERSION, create: create, mount: mount };
});

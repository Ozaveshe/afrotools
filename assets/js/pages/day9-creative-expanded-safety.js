(function () {
  'use strict';

  var match = location.pathname.match(/^\/tools\/(creator-[a-z0-9-]+)\/app\/?$/);
  if (!match) return;

  var toolId = match[1];
  var mediaRules = {
    'creator-carousel': { accept: ['image/'], maxMb: 25 },
    'creator-clip': { accept: ['video/'], maxMb: 250 },
    'creator-kit': { accept: ['image/'], maxMb: 25 },
    'creator-mail': { accept: ['image/'], maxMb: 15 },
    'creator-record': { accept: ['video/', 'audio/'], maxMb: 250 },
    'creator-resize': { accept: ['image/'], maxMb: 25 },
    'creator-stock': { accept: ['image/', 'video/'], maxMb: 100 },
    'creator-thumb': { accept: ['image/'], maxMb: 25 },
    'creator-voice': { accept: ['audio/'], maxMb: 100 }
  };

  function announce(message, isError) {
    var status = document.getElementById('day9-creative-status');
    if (!status) return;
    status.textContent = message;
    status.style.color = isError ? '#f87171' : '';
  }

  function addBoundary() {
    if (document.getElementById('day9-creative-boundary')) return;
    var note = document.createElement('aside');
    note.id = 'day9-creative-boundary';
    note.setAttribute('aria-label', 'Privacy and export boundary');
    note.style.cssText = 'margin:8px 12px;padding:9px 12px;border:1px solid rgba(148,163,184,.35);border-radius:8px;font:12px/1.45 system-ui,sans-serif;color:inherit;background:rgba(15,23,42,.08)';
    note.innerHTML = '<strong>Local workspace:</strong> Files and unsaved edits stay in this browser unless you explicitly choose an online or account action. Reopen exported files before relying on them; recordings depend on browser codec support. <span id="day9-creative-status" role="status" aria-live="polite"></span>';
    var target = document.querySelector('main, [role="main"], .app-main, body > div');
    if (target && target.parentNode) target.parentNode.insertBefore(note, target);
    else document.body.insertBefore(note, document.body.firstChild);
  }

  function addReflowStyles() {
    if (document.getElementById('day9-creative-expanded-reflow')) return;
    var style = document.createElement('style');
    style.id = 'day9-creative-expanded-reflow';
    style.textContent =
      'html,body{max-width:100%;overflow-x:clip}' +
      '#day9-creative-boundary{box-sizing:border-box;max-width:calc(100% - 24px);overflow-wrap:anywhere}' +
      '@media(max-width:700px){' +
      '.cbk-topbar,.ck-topbar,.cpg-topbar-inner,.crz-header{height:auto!important;min-width:0;flex-wrap:wrap}' +
      '.cbk-topbar-actions,.cpg-topbar-actions,.crz-header-actions{min-width:0;max-width:100%;flex-wrap:wrap;justify-content:flex-start}' +
      '.ck-topbar>*{min-width:0;max-width:100%}' +
      '.csc-view-tabs{box-sizing:border-box;width:100%!important;max-width:100%;justify-content:flex-start;overflow-x:auto}' +
      '.cs-stats{box-sizing:border-box;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;width:100%!important;max-width:100%}' +
      '.cs-stat-card{box-sizing:border-box;min-width:0!important;width:auto!important}' +
      '.csk-spotlight-grid{display:flex!important;max-width:100%;overflow-x:auto;overscroll-behavior-inline:contain}' +
      '}';
    document.head.appendChild(style);
  }

  function validateFile(event) {
    var input = event.target;
    if (!input || input.tagName !== 'INPUT' || input.type !== 'file' || !input.files || !input.files.length) return;
    var rule = mediaRules[toolId];
    if (!rule) return;

    var files = Array.prototype.slice.call(input.files);
    var invalid = files.find(function (file) {
      return file.size > rule.maxMb * 1024 * 1024 ||
        (file.type && !rule.accept.some(function (prefix) { return file.type.indexOf(prefix) === 0; }));
    });

    if (!invalid) {
      announce(files.length + ' file' + (files.length === 1 ? '' : 's') + ' ready for local processing.', false);
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    input.value = '';
    announce('File rejected. Use ' + rule.accept.join(' or ') + ' files up to ' + rule.maxMb + ' MB.', true);
  }

  function labelOnlineActions() {
    document.querySelectorAll('button, a').forEach(function (control) {
      var text = (control.textContent || '').trim();
      if (!/\bAI\b/i.test(text) || control.dataset.day9OnlineLabelled) return;
      control.dataset.day9OnlineLabelled = 'true';
      if (!/\bonline\b/i.test(text)) {
        control.setAttribute('aria-description', 'Online action; review the content before sending.');
        control.title = (control.title ? control.title + ' ' : '') + 'Online action: review content before sending.';
      }
    });
  }

  document.addEventListener('change', validateFile, true);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      addReflowStyles();
      addBoundary();
      labelOnlineActions();
    });
  } else {
    addReflowStyles();
    addBoundary();
    labelOnlineActions();
  }
})();

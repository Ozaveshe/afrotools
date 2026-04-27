(function () {
  'use strict';

  var STORE_KEY = 'afro_insurance_workspace';

  function readPlans() {
    try {
      var items = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
      return Array.isArray(items) ? items.slice(0, 12) : [];
    } catch (e) {
      return [];
    }
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function safeHref(href) {
    var text = String(href || '').trim();
    if (!text) return '/insurance/';
    if (text.charAt(0) === '/' || text.charAt(0) === '#') return text.replace(/"/g, '%22');
    return '/insurance/';
  }

  function timeAgo(dateValue) {
    var time = new Date(dateValue || Date.now()).getTime();
    if (!Number.isFinite(time)) return 'Saved recently';
    var diff = Math.max(0, Date.now() - time);
    var minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return minutes + 'm ago';
    var hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + 'h ago';
    var days = Math.floor(hours / 24);
    return days + 'd ago';
  }

  function renderPanel(panel, plans) {
    if (!plans.length) {
      panel.innerHTML = '<div class="ws-empty">No insurance buyer packs saved yet.</div>';
      return;
    }
    panel.innerHTML = plans.map(function (item) {
      var tools = Array.isArray(item.workflowTools) ? item.workflowTools.length : 0;
      var href = item.href || (item.toolSlug ? '/tools/' + String(item.toolSlug).replace(/[^a-z0-9-]/gi, '') + '/' : '/insurance/');
      var meta = [item.country || item.workflowId || 'Insurance', timeAgo(item.savedAt), tools ? tools + ' workflow app' + (tools === 1 ? '' : 's') : 'Buyer pack'].filter(Boolean).join(' | ');
      return '<article class="saved-item">' +
        '<div class="saved-content">' +
          '<h3>' + escapeHtml(item.title || 'Insurance buyer pack') + '</h3>' +
          '<div class="saved-value">' + escapeHtml(item.summary || 'Saved insurance workflow and PDF-ready buyer pack.') + '</div>' +
          '<div class="saved-meta">' + escapeHtml(meta) + '</div>' +
        '</div>' +
        '<div class="saved-actions">' +
          '<a class="btn-small" href="' + escapeHtml(safeHref(href)) + '">Open</a>' +
          '<a class="btn-small" href="/insurance/">Insurance hub</a>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  function wireTab(container, tab) {
    tab.addEventListener('click', function () {
      container.querySelectorAll('.ws-tab').forEach(function (node) { node.classList.remove('active'); });
      container.querySelectorAll('.ws-panel').forEach(function (node) { node.classList.remove('active'); });
      tab.classList.add('active');
      var panel = container.querySelector('[data-ws-panel="ws-insurance"]');
      if (panel) panel.classList.add('active');
    });
  }

  function injectInsuranceWorkspace() {
    var plans = readPlans();
    if (!plans.length) return;
    var container = document.getElementById('myWorkspaceContent');
    if (!container) return;
    var tabs = container.querySelector('.ws-tabs');
    var panels = container.querySelector('.ws-panels');
    if (!tabs || !panels) return;

    var tab = container.querySelector('[data-ws="ws-insurance"]');
    if (!tab) {
      tab = document.createElement('button');
      tab.className = 'ws-tab';
      tab.type = 'button';
      tab.setAttribute('data-ws', 'ws-insurance');
      tab.innerHTML = 'INS Insurance';
      tabs.appendChild(tab);
      wireTab(container, tab);
    }

    var panel = container.querySelector('[data-ws-panel="ws-insurance"]');
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'ws-panel';
      panel.id = 'ws-insurance';
      panel.setAttribute('data-ws-panel', 'ws-insurance');
      panels.appendChild(panel);
    }
    renderPanel(panel, plans);
  }

  function install() {
    var original = window.renderMyWorkspace;
    if (typeof original === 'function' && !original.__insurancePatched) {
      var patched = function () {
        var result = original.apply(this, arguments);
        return Promise.resolve(result).then(function (value) {
          injectInsuranceWorkspace();
          return value;
        });
      };
      patched.__insurancePatched = true;
      window.renderMyWorkspace = patched;
    }
    injectInsuranceWorkspace();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
  window.addEventListener('storage', function (event) {
    if (event.key === STORE_KEY) injectInsuranceWorkspace();
  });
  window.addEventListener('focus', injectInsuranceWorkspace);
  window.setTimeout(install, 1200);
  window.setTimeout(injectInsuranceWorkspace, 3500);
})();

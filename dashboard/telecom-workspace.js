(function () {
  'use strict';

  var STORE_KEY = 'afro_telecom_workspace';

  function readItems() {
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

  function escapeJs(value) {
    return String(value == null ? '' : value)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/</g, '\\x3c')
      .replace(/>/g, '\\x3e');
  }

  function safeHref(href) {
    var text = String(href || '').trim();
    if (!text) return '/telecom/';
    if (text.charAt(0) === '/' || text.charAt(0) === '#') return text.replace(/"/g, '%22');
    return '/telecom/';
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

  function renderPanel(panel, items) {
    if (!items.length) {
      panel.innerHTML = '<div class="ws-empty">No telecom plans saved yet.</div>';
      return;
    }
    panel.innerHTML = items.map(function (item) {
      var steps = Array.isArray(item.steps) ? item.steps.length : 0;
      var meta = [
        item.countryName || item.country || 'Africa',
        item.workflowLabel || item.workflow || 'Telecom',
        timeAgo(item.updatedAt || item.createdAt),
        steps ? steps + ' workflow app' + (steps === 1 ? '' : 's') : 'Brief'
      ].filter(Boolean).join(' | ');
      return '<article class="saved-item">' +
        '<div class="saved-content">' +
          '<h3>' + escapeHtml(item.title || 'Telecom plan') + '</h3>' +
          '<div class="saved-value">' + escapeHtml(item.summary || 'Saved telecom workflow and PDF-ready brief.') + '</div>' +
          '<div class="saved-meta">' + escapeHtml(meta) + '</div>' +
        '</div>' +
        '<div class="saved-actions">' +
          '<a class="btn-small" href="' + escapeHtml(safeHref(item.href)) + '">Open</a>' +
          '<button class="btn-small" type="button" onclick="deleteTelecomWorkspace(\'' + escapeJs(item.id) + '\')">Remove</button>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  function wireTabs(container) {
    container.querySelectorAll('.ws-tab').forEach(function (tab) {
      if (tab.__telecomWorkspaceWired) return;
      tab.__telecomWorkspaceWired = true;
      tab.addEventListener('click', function () {
        var id = tab.getAttribute('data-ws');
        container.querySelectorAll('.ws-tab').forEach(function (node) { node.classList.remove('active'); });
        container.querySelectorAll('.ws-panel').forEach(function (node) { node.classList.remove('active'); });
        tab.classList.add('active');
        var panel = container.querySelector('[data-ws-panel="' + id + '"]');
        if (panel) panel.classList.add('active');
      });
    });
  }

  function ensureWorkspaceShell(container) {
    var tabs = container.querySelector('.ws-tabs');
    var panels = container.querySelector('.ws-panels');
    if (!tabs || !panels) {
      container.innerHTML = '<div class="ws-tabs"></div><div class="ws-panels"></div>';
      tabs = container.querySelector('.ws-tabs');
      panels = container.querySelector('.ws-panels');
    }
    return { tabs: tabs, panels: panels };
  }

  function injectTelecomWorkspace() {
    var items = readItems();
    if (!items.length) return;
    var container = document.getElementById('myWorkspaceContent');
    if (!container) return;
    var shell = ensureWorkspaceShell(container);
    var hasActive = !!container.querySelector('.ws-tab.active');

    var tab = container.querySelector('[data-ws="ws-telecom"]');
    if (!tab) {
      tab = document.createElement('button');
      tab.className = 'ws-tab' + (hasActive ? '' : ' active');
      tab.type = 'button';
      tab.setAttribute('data-ws', 'ws-telecom');
      tab.innerHTML = 'TEL Telecom';
      shell.tabs.appendChild(tab);
    }

    var panel = container.querySelector('[data-ws-panel="ws-telecom"]');
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'ws-panel' + (hasActive ? '' : ' active');
      panel.id = 'ws-telecom';
      panel.setAttribute('data-ws-panel', 'ws-telecom');
      shell.panels.appendChild(panel);
    }

    renderPanel(panel, items);
    wireTabs(container);
  }

  window.deleteTelecomWorkspace = function (id) {
    if (!id || !confirm('Remove this telecom workspace item?')) return;
    var items = readItems();
    var removed = null;
    items = items.filter(function (item) {
      if (item && item.id === id) {
        removed = item;
        return false;
      }
      return true;
    });
    try { localStorage.setItem(STORE_KEY, JSON.stringify(items)); } catch (e) {}
    injectTelecomWorkspace();
    if (window.renderActionCenter) window.renderActionCenter();
    if (window.AfroWorkspace && AfroWorkspace.isSignedIn && AfroWorkspace.isSignedIn() && removed) {
      AfroWorkspace.remove({ itemType: removed.itemType || 'telecom-brief', itemKey: id }).catch(function (e) {
        console.warn('[TelecomWorkspace] delete sync failed:', e.message || e);
      });
    }
  };

  function install() {
    var original = window.renderMyWorkspace;
    if (typeof original === 'function' && !original.__telecomPatched) {
      var patched = function () {
        var result = original.apply(this, arguments);
        return Promise.resolve(result).then(function (value) {
          injectTelecomWorkspace();
          return value;
        });
      };
      patched.__telecomPatched = true;
      window.renderMyWorkspace = patched;
    }
    injectTelecomWorkspace();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
  window.addEventListener('storage', function (event) {
    if (event.key === STORE_KEY) injectTelecomWorkspace();
  });
  window.addEventListener('focus', injectTelecomWorkspace);
  window.setTimeout(install, 1200);
  window.setTimeout(injectTelecomWorkspace, 3500);
})();

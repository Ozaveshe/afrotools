(function () {
  'use strict';

  var STORE_KEY = 'afro_climate_workspace';

  function readReports() {
    try {
      var items = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
      return Array.isArray(items) ? items.filter(function (item) { return item && item.id; }).slice(0, 12) : [];
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
    if (!text) return '/climate/';
    if (text.charAt(0) === '/' || text.charAt(0) === '#') return text.replace(/"/g, '%22');
    return '/climate/';
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

  function renderPanel(panel, reports) {
    if (!reports.length) {
      panel.innerHTML = '<div class="ws-empty">No climate reports saved yet. Run any Climate app and choose Save to dashboard.</div>';
      return;
    }
    panel.innerHTML = reports.map(function (item) {
      var nextTools = Array.isArray(item.nextTools) ? item.nextTools.slice(0, 2) : [];
      var meta = [
        item.countryName || item.country || 'Africa',
        item.workflow || item.toolName || 'Climate',
        timeAgo(item.createdAt || item.savedAt)
      ].filter(Boolean).join(' | ');
      return '<article class="saved-item">' +
        '<div class="saved-content">' +
          '<h3>' + escapeHtml(item.title || 'Climate report') + '</h3>' +
          '<div class="saved-value">' + escapeHtml((item.resultLabel || 'Result') + ': ' + (item.resultValue || item.level || 'Saved scenario')) + '</div>' +
          '<div class="saved-meta">' + escapeHtml(meta) + '</div>' +
          (item.resultSub ? '<div class="saved-meta">' + escapeHtml(item.resultSub) + '</div>' : '') +
          (nextTools.length ? '<div class="energy-plan-next">' + nextTools.map(function (step) {
            return '<a href="' + escapeHtml(safeHref(step.href)) + '">' + escapeHtml(step.label || step.shortName || 'Next step') + '</a>';
          }).join('') + '</div>' : '') +
        '</div>' +
        '<div class="saved-actions">' +
          '<a class="btn-small" href="' + escapeHtml(safeHref(item.href)) + '">Open</a>' +
          '<a class="btn-small" href="/climate/">Climate hub</a>' +
          '<button class="btn-small" type="button" data-climate-report-remove="' + escapeHtml(item.id) + '">Remove</button>' +
        '</div>' +
      '</article>';
    }).join('');

    panel.querySelectorAll('[data-climate-report-remove]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        window.deleteClimateWorkspace(btn.getAttribute('data-climate-report-remove'));
      });
    });
  }

  function wireTabs(container) {
    container.querySelectorAll('.ws-tab').forEach(function (tab) {
      if (tab.__climateWorkspaceWired) return;
      tab.__climateWorkspaceWired = true;
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

  function injectClimateWorkspace() {
    var reports = readReports();
    if (!reports.length) return;
    var container = document.getElementById('myWorkspaceContent');
    if (!container) return;
    var shell = ensureWorkspaceShell(container);
    var hasActive = !!container.querySelector('.ws-tab.active');

    var tab = container.querySelector('[data-ws="ws-climate"]');
    if (!tab) {
      tab = document.createElement('button');
      tab.className = 'ws-tab' + (hasActive ? '' : ' active');
      tab.type = 'button';
      tab.setAttribute('data-ws', 'ws-climate');
      tab.innerHTML = 'CLI Climate Reports';
      shell.tabs.appendChild(tab);
    }

    var panel = container.querySelector('[data-ws-panel="ws-climate"]');
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'ws-panel' + (hasActive ? '' : ' active');
      panel.id = 'ws-climate';
      panel.setAttribute('data-ws-panel', 'ws-climate');
      shell.panels.appendChild(panel);
    }

    renderPanel(panel, reports);
    wireTabs(container);
  }

  window.deleteClimateWorkspace = function deleteClimateWorkspace(id) {
    if (!id || !confirm('Remove this climate report?')) return;
    var reports = readReports();
    var removed = null;
    reports = reports.filter(function (item) {
      if (item && item.id === id) {
        removed = item;
        return false;
      }
      return true;
    });
    try { localStorage.setItem(STORE_KEY, JSON.stringify(reports)); } catch (e) {}
    injectClimateWorkspace();
    if (window.renderActionCenter) window.renderActionCenter();
    if (window.AfroWorkspace && AfroWorkspace.isSignedIn && AfroWorkspace.isSignedIn() && removed) {
      AfroWorkspace.remove({ itemType: removed.itemType || 'climate-scenario', itemKey: id }).catch(function (e) {
        console.warn('[ClimateWorkspace] delete sync failed:', e.message || e);
      });
    }
  };

  function install() {
    var original = window.renderMyWorkspace;
    if (typeof original === 'function' && !original.__climatePatched) {
      var patched = function () {
        var result = original.apply(this, arguments);
        return Promise.resolve(result).then(function (value) {
          injectClimateWorkspace();
          return value;
        });
      };
      patched.__climatePatched = true;
      window.renderMyWorkspace = patched;
    }
    injectClimateWorkspace();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
  window.addEventListener('storage', function (event) {
    if (event.key === STORE_KEY) injectClimateWorkspace();
  });
  window.addEventListener('focus', injectClimateWorkspace);
  window.addEventListener('afro-workspace-change', function (event) {
    var detail = event && event.detail ? event.detail : {};
    if (!detail.itemType || detail.itemType === 'climate-scenario') injectClimateWorkspace();
  });
  window.setTimeout(install, 1200);
  window.setTimeout(injectClimateWorkspace, 3500);
})();

(function () {
  'use strict';

  var WORKSPACE_TIMEOUT_MS = 9000;
  var WORKSPACE_ITEM_TYPES = [
    'cv-draft',
    'cv',
    'floor-plan-draft',
    'floor-plan',
    'invoice-draft',
    'markdown-draft'
  ];
  var LAST_WORKSPACE_ITEMS = [];

  function promiseWithTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise(function (_, reject) {
        setTimeout(function () {
          reject(new Error('timeout'));
        }, ms || WORKSPACE_TIMEOUT_MS);
      })
    ]);
  }

  function escapeHtml(value) {
    var node = document.createElement('div');
    node.textContent = value || '';
    return node.innerHTML;
  }

  function formatRelativeTime(value) {
    if (!value) return 'recently';

    var timestamp = new Date(value).getTime();
    if (!Number.isFinite(timestamp)) return 'recently';

    var seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';

    var days = Math.floor(seconds / 86400);
    if (days === 1) return 'yesterday';
    if (days < 7) return days + 'd ago';

    return new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  function formatWorkspaceCurrency(value, currency) {
    if (value === null || value === undefined || value === '') return '--';

    if (typeof value === 'number' && Number.isFinite(value)) {
      try {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency || 'USD',
          maximumFractionDigits: 0
        }).format(value);
      } catch (error) {
        return (currency || 'USD') + ' ' + Number(value).toLocaleString();
      }
    }

    return String(value);
  }

  function readJson(key, fallback) {
    if (!window.AfroWorkspace) return fallback;
    return window.AfroWorkspace.readJson(key, fallback);
  }

  function writeJson(key, value) {
    if (!window.AfroWorkspace) return;
    window.AfroWorkspace.writeJson(key, value);
  }

  function writeText(key, value) {
    if (!window.AfroWorkspace) return;
    window.AfroWorkspace.writeText(key, value);
  }

  async function getFavoriteToolItems() {
    if (typeof window._savedToolsInstance !== 'undefined' && window._savedToolsInstance && typeof window._savedToolsInstance.getAll === 'function') {
      return promiseWithTimeout(window._savedToolsInstance.getAll(), WORKSPACE_TIMEOUT_MS).catch(function () {
        return [];
      });
    }

    var localFavorites = [];
    try {
      localFavorites = JSON.parse(localStorage.getItem('afro_favs_v2') || '[]');
    } catch (error) {
      localFavorites = [];
    }

    return localFavorites.map(function (slug) {
      return { slug: slug, savedAt: null };
    });
  }

  function getHistoryItems(limit) {
    if (typeof currentUser === 'undefined' || !currentUser || typeof window.AfroHistory === 'undefined' || !window.AfroHistory || typeof window.AfroHistory.getRecent !== 'function') {
      return Promise.resolve([]);
    }

    return promiseWithTimeout(window.AfroHistory.getRecent(limit || 10), WORKSPACE_TIMEOUT_MS).catch(function () {
      return [];
    });
  }

  function getWorkspaceToolHref(toolId, registryTool) {
    if (registryTool && registryTool.href) return registryTool.href;
    return '/tools/' + toolId + '/';
  }

  function summarizeHistoryEntry(item) {
    var outputs = item && item.outputs ? item.outputs : {};
    var currency = item && item.currency ? item.currency : 'USD';
    var numericCandidates = [
      { value: outputs.net_monthly, label: 'Net pay' },
      { value: outputs.netMonthly, label: 'Net pay' },
      { value: outputs.net_pay, label: 'Net pay' },
      { value: outputs.takeHome, label: 'Take-home' },
      { value: outputs.total, label: 'Total' },
      { value: outputs.result, label: 'Result' },
      { value: outputs.tax_due, label: 'Tax due' },
      { value: outputs.tax, label: 'Tax' }
    ];

    for (var index = 0; index < numericCandidates.length; index += 1) {
      var candidate = numericCandidates[index];
      if (typeof candidate.value === 'number' && Number.isFinite(candidate.value)) {
        return {
          label: candidate.label,
          value: formatWorkspaceCurrency(candidate.value, currency)
        };
      }
    }

    if (typeof outputs.effective_rate === 'number' && Number.isFinite(outputs.effective_rate)) {
      return { label: 'Effective rate', value: outputs.effective_rate.toFixed(1) + '%' };
    }

    if (typeof outputs.effectiveRate === 'number' && Number.isFinite(outputs.effectiveRate)) {
      return { label: 'Effective rate', value: outputs.effectiveRate.toFixed(1) + '%' };
    }

    return { label: 'Saved result', value: 'Open to view details' };
  }

  function getActiveWorkspaceTab() {
    var active = document.querySelector('#myWorkspaceContent .ws-tab.active');
    return active ? active.getAttribute('data-ws') : null;
  }

  async function fetchWorkspaceItems() {
    if (!window.AfroWorkspace || !window.AfroWorkspace.isSignedIn()) {
      LAST_WORKSPACE_ITEMS = [];
      return [];
    }

    try {
      var items = await promiseWithTimeout(window.AfroWorkspace.list({
        itemTypes: WORKSPACE_ITEM_TYPES,
        limit: 120
      }), WORKSPACE_TIMEOUT_MS);
      LAST_WORKSPACE_ITEMS = Array.isArray(items) ? items : [];
      return LAST_WORKSPACE_ITEMS;
    } catch (error) {
      console.warn('[DashboardSync] Workspace fetch failed:', error.message || error);
      return LAST_WORKSPACE_ITEMS;
    }
  }

  function sortByUpdatedDesc(items) {
    return (items || []).slice().sort(function (left, right) {
      var leftTime = window.AfroWorkspace.getTimestamp(left.updatedAt || left.updated_at || left.savedAt);
      var rightTime = window.AfroWorkspace.getTimestamp(right.updatedAt || right.updated_at || right.savedAt);
      return rightTime - leftTime;
    });
  }

  function mirrorWorkspaceItemsToLocal(items) {
    var workspaceItems = Array.isArray(items) ? items : [];

    var cvDraft = null;
    var cvList = [];
    var floorDraft = null;
    var floorPlans = [];
    var invoiceDraft = null;
    var markdownDraft = null;

    workspaceItems.forEach(function (item) {
      if (!item || !item.item_type) return;

      if (item.item_type === 'cv-draft' && item.payload) {
        cvDraft = item.payload;
        return;
      }

      if (item.item_type === 'cv' && item.payload) {
        cvList.push(item.payload);
        return;
      }

      if (item.item_type === 'floor-plan-draft' && item.payload) {
        floorDraft = item.payload;
        return;
      }

      if (item.item_type === 'floor-plan' && item.payload) {
        floorPlans.push(item.payload);
        return;
      }

      if (item.item_type === 'invoice-draft' && item.payload) {
        invoiceDraft = item.payload;
        return;
      }

      if (item.item_type === 'markdown-draft' && item.payload) {
        markdownDraft = item.payload;
      }
    });

    if (cvDraft) {
      writeJson('afro_cv_data', cvDraft);
      writeJson('cv_builder_data', cvDraft);
    }

    if (cvList.length) {
      writeJson('afro_cv_list', sortByUpdatedDesc(cvList));
    }

    if (floorDraft) {
      writeJson('afro_fp_autosave', floorDraft);
      if (floorDraft.projectId) {
        writeJson('afro_fp_' + floorDraft.projectId, floorDraft);
      }
    }

    if (floorPlans.length) {
      var floorSummaries = sortByUpdatedDesc(floorPlans).map(function (plan) {
        writeJson('afro_fp_' + plan.id, plan);
        return {
          id: plan.id,
          name: plan.name || 'Untitled Plan',
          updatedAt: plan.updatedAt || plan.savedAt || Date.now(),
          rooms: typeof plan.rooms === 'number'
            ? plan.rooms
            : Array.isArray(plan.objects)
              ? plan.objects.filter(function (object) { return object && object.type === 'room'; }).length
              : 0,
          area: typeof plan.area === 'number'
            ? plan.area
            : typeof plan.totalArea === 'number'
              ? plan.totalArea
              : 0
        };
      });
      writeJson('afro_fp_list', floorSummaries);
    }

    if (invoiceDraft) {
      writeJson('afro_invoice_draft', invoiceDraft);
    }

    if (markdownDraft) {
      writeJson('afro_markdown_draft', markdownDraft);
      writeText('md-editor-content', markdownDraft.content || '');
    }
  }

  function countSavedDocuments() {
    var count = 0;

    if (localStorage.getItem('afro_invoice_draft')) count += 1;
    if (localStorage.getItem('afro_cv_data') || localStorage.getItem('cv_builder_data')) count += 1;
    if (localStorage.getItem('afro_markdown_draft')) count += 1;
    if (localStorage.getItem('afro_paye_saved')) count += 1;

    try {
      var cvs = JSON.parse(localStorage.getItem('afro_cv_list') || '[]');
      count += cvs.length;
    } catch (error) {
      // Ignore malformed local data.
    }

    return count;
  }

  function refreshMissionSummaryCards() {
    var summaryCards = document.getElementById('mnSummaryCards');
    if (!summaryCards) return;

    var count = countSavedDocuments();
    var cards = summaryCards.querySelectorAll('.mn-summary-card');
    var documentsCard = null;

    Array.prototype.forEach.call(cards, function (card) {
      var label = card.querySelector('.mn-card-label');
      if (label && label.textContent.trim() === 'Saved Documents') {
        documentsCard = card;
      }
    });

    if (!count) {
      if (documentsCard) documentsCard.remove();
      return;
    }

    var cardHtml = '<div class="mn-summary-card">' +
      '<div class="mn-card-label">Saved Documents</div>' +
      '<div class="mn-card-value">' + count + '</div>' +
      '<div class="mn-card-sub"><a href="#myWorkspace" class="mn-link">View vault &rarr;</a></div>' +
    '</div>';

    if (documentsCard) {
      documentsCard.outerHTML = cardHtml;
    } else {
      summaryCards.insertAdjacentHTML('beforeend', cardHtml);
    }
  }

  async function getWorkspaceBackedState() {
    var items = await fetchWorkspaceItems();
    if (items.length) {
      mirrorWorkspaceItemsToLocal(items);
    }

    var cvs = [];
    var plans = [];
    var hasDocs = false;

    try { cvs = JSON.parse(localStorage.getItem('afro_cv_list') || '[]'); } catch (error) { cvs = []; }
    try { plans = JSON.parse(localStorage.getItem('afro_fp_list') || '[]'); } catch (error) { plans = []; }

    hasDocs = !!(
      localStorage.getItem('afro_invoice_draft') ||
      localStorage.getItem('afro_cv_data') ||
      localStorage.getItem('cv_builder_data') ||
      localStorage.getItem('afro_paye_saved') ||
      localStorage.getItem('afro_markdown_draft')
    );

    return {
      items: items,
      cvs: Array.isArray(cvs) ? cvs : [],
      plans: Array.isArray(plans) ? plans : [],
      hasDocs: hasDocs
    };
  }

  function renderWorkspaceFavoriteGrid(container, favoriteItems) {
    var registry = typeof AFRO_TOOLS !== 'undefined' ? AFRO_TOOLS : [];
    var items = Array.isArray(favoriteItems) ? favoriteItems : [];
    var syncBanner = typeof currentUser !== 'undefined' && currentUser
      ? '<div style="grid-column:1/-1;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:14px 16px;color:#1D4ED8;font-size:0.82rem;line-height:1.5;">Your saved tools are linked to your AfroTools account and follow you across browsers, phones, and laptops.</div>'
      : '';

    if (items.length === 0) {
      container.innerHTML = syncBanner +
        '<div style="background:#F9FAFB;border:1.5px dashed #D1D5DB;border-radius:12px;padding:24px;text-align:center;color:#6B7280;font-size:.85rem;grid-column:1/-1;">' +
        '<div style="font-size:2rem;margin-bottom:8px;">&#9733;</div>' +
        'No saved tools yet.<br>' +
        '<span style="font-size:.78rem;">Tap the star on any tool page and it will appear here everywhere you sign in.</span>' +
        '</div>';
      return;
    }

    container.innerHTML = syncBanner + items.map(function (item) {
      var toolId = item.slug || item.tool_id;
      var registryTool = registry.find(function (tool) { return tool.id === toolId; });
      var meta = toolMetadata[toolId] || (registryTool ? { name: registryTool.name, icon: registryTool.icon || '&#128736;' } : { name: toolId.replace(/-/g, ' '), icon: '&#128736;' });
      var href = getWorkspaceToolHref(toolId, registryTool);
      var imgSrc = '/assets/img/tools/' + toolId + '.webp';
      var imgFallback = '/assets/img/tools/' + toolId + '.svg';
      var subtitle = item.savedAt ? 'Saved ' + formatRelativeTime(item.savedAt) : 'Synced to your account';

      return '<a href="' + href + '" style="background:#fff;border:1.5px solid #E5E7EB;border-radius:14px;padding:14px 12px;text-decoration:none;color:inherit;display:flex;flex-direction:column;gap:10px;transition:all .18s;min-height:170px;" onmouseover="this.style.borderColor=\'#007AFF\';this.style.transform=\'translateY(-3px)\';this.style.boxShadow=\'0 8px 20px rgba(0,122,255,.10)\'" onmouseout="this.style.borderColor=\'#E5E7EB\';this.style.transform=\'none\';this.style.boxShadow=\'none\'">' +
        '<div style="width:48px;height:48px;border-radius:12px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;font-size:1.4rem;overflow:hidden;"><img src="' + imgSrc + '" alt="' + escapeHtml(meta.name || 'Tool') + '" width="36" height="36" style="width:36px;height:36px;object-fit:contain;border-radius:8px;" onerror="this.onerror=function(){this.outerHTML=\'' + escapeHtml(meta.icon || '&#128736;') + '\'};this.src=\'' + imgFallback + '\'"></div>' +
        '<div style="font-size:.82rem;font-weight:700;color:#111827;line-height:1.35;">' + escapeHtml(meta.name) + '</div>' +
        '<div style="font-size:.74rem;color:#6B7280;line-height:1.45;">' + escapeHtml(subtitle) + '</div>' +
        '<div style="margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:10px;">' +
          '<span style="font-size:.72rem;font-weight:700;color:#007AFF;">Open tool</span>' +
          '<button type="button" style="border:none;background:#FEE2E2;color:#B91C1C;border-radius:999px;padding:6px 10px;font-size:.7rem;font-weight:700;cursor:pointer;" onclick="event.preventDefault();event.stopPropagation();removeFavoriteFromWorkspace(\'' + toolId + '\')">Remove</button>' +
        '</div>' +
      '</a>';
    }).join('');
  }

  function renderWorkspaceHistory(container, historyItems) {
    var items = Array.isArray(historyItems) ? historyItems : [];
    var intro = '<div style="margin-bottom:14px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:14px 16px;color:#475569;font-size:0.82rem;line-height:1.5;">Recent calculations are loaded from your signed-in AfroTools account, so they are available on every device.</div>';

    if (items.length === 0) {
      container.innerHTML = intro +
        '<div style="padding:20px;text-align:center;color:#64748B;font-size:0.85rem;background:#F8FAFC;border-radius:12px;border:1.5px dashed #CBD5E1;">' +
        '<p style="margin-bottom:8px;font-weight:600;color:#1E293B;">No synced calculations yet</p>' +
        '<span style="font-size:.78rem;">Run a calculator while signed in and your recent results will appear here automatically.</span>' +
        '</div>';
      return;
    }

    container.innerHTML = intro + '<div class="cv-card-grid">' + items.map(function (item) {
      var toolId = item.tool_slug || '';
      var registryTool = typeof AFRO_TOOLS !== 'undefined' ? AFRO_TOOLS.find(function (tool) { return tool.id === toolId; }) : null;
      var summary = summarizeHistoryEntry(item);
      var href = getWorkspaceToolHref(toolId, registryTool);
      var toolName = item.tool_name || (registryTool ? registryTool.name : toolId.replace(/-/g, ' ')) || 'Calculation';
      var metaParts = [];

      if (item.country_code) metaParts.push(item.country_code);
      if (item.currency) metaParts.push(item.currency);
      metaParts.push(formatRelativeTime(item.created_at));

      return '<div class="cv-card">' +
        '<div class="cv-card-name">' + escapeHtml(toolName) + '</div>' +
        '<div class="cv-card-meta">' + escapeHtml(metaParts.join(' | ')) + '</div>' +
        '<div style="margin-top:10px;display:flex;flex-direction:column;gap:4px;">' +
          '<div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:#94A3B8;font-weight:700;">' + escapeHtml(summary.label) + '</div>' +
          '<div style="font-size:1rem;font-weight:700;color:#0F172A;">' + escapeHtml(summary.value) + '</div>' +
        '</div>' +
        '<div class="cv-card-actions">' +
          '<a class="cv-card-edit" href="' + href + '">Open tool</a>' +
          '<a class="cv-card-dup" href="' + href + '">Recalculate</a>' +
        '</div>' +
      '</div>';
    }).join('') + '</div>';
  }

  window.removeFavoriteFromWorkspace = async function (toolId) {
    if (!toolId) return;

    try {
      if (typeof window._savedToolsInstance !== 'undefined' && window._savedToolsInstance && typeof window._savedToolsInstance.remove === 'function') {
        await window._savedToolsInstance.remove(toolId);
      } else {
        var localFavorites = JSON.parse(localStorage.getItem('afro_favs_v2') || '[]');
        localStorage.setItem('afro_favs_v2', JSON.stringify(localFavorites.filter(function (item) {
          return item !== toolId;
        })));
      }

      if (typeof updateQuickStats === 'function') updateQuickStats();
      if (typeof renderMyWorkspace === 'function') renderMyWorkspace({ activeTab: 'ws-favs' });
      if (typeof showToast === 'function') showToast('Removed from My Tools');
    } catch (error) {
      console.warn('[DashboardSync] Failed to remove favorite:', error);
      if (typeof showToast === 'function') showToast('Could not remove this saved tool', 'error');
    }
  };

  window.loadFavorites = async function (favoriteItems) {
    var container = document.getElementById('favoritesContainer');
    if (!container) return;

    container.innerHTML = '<div style="grid-column:1/-1;color:#94A3B8;font-size:.82rem;padding:12px 0;">Loading your saved tools...</div>';

    var items = Array.isArray(favoriteItems) ? favoriteItems : await getFavoriteToolItems();
    renderWorkspaceFavoriteGrid(container, items);
  };

  window.loadSyncedCalculationHistory = async function (historyItems) {
    var container = document.getElementById('workspaceHistoryContainer');
    if (!container) return;

    container.innerHTML = '<div style="color:#94A3B8;font-size:.82rem;padding:12px 0;">Loading your synced calculations...</div>';
    renderWorkspaceHistory(container, Array.isArray(historyItems) ? historyItems : await getHistoryItems(12));
  };

  window.renderMyWorkspace = async function (options) {
    var container = document.getElementById('myWorkspaceContent');
    if (!container) return;

    var preferredTab = options && options.activeTab ? options.activeTab : getActiveWorkspaceTab();

    var results = await Promise.all([
      getFavoriteToolItems(),
      getHistoryItems(12),
      getWorkspaceBackedState()
    ]);

    var favoriteItems = results[0];
    var historyItems = results[1];
    var workspaceState = results[2];
    var tabs = [];

    if (typeof currentUser !== 'undefined' && currentUser) {
      tabs.push({ id: 'ws-favs', label: 'My Tools', icon: '&#9733;' });
      tabs.push({ id: 'ws-history', label: 'Calculations', icon: '&#128202;' });
    }

    if (workspaceState.cvs.length > 0) {
      tabs.push({ id: 'ws-cvs', label: 'My CVs', icon: '&#128221;' });
    }

    if (workspaceState.plans.length > 0) {
      tabs.push({ id: 'ws-plans', label: 'Floor Plans', icon: '&#127968;' });
    }

    if (workspaceState.hasDocs) {
      tabs.push({ id: 'ws-docs', label: 'Documents', icon: '&#128193;' });
    }

    if (tabs.length === 0) {
      container.innerHTML = '<div class="ws-empty"><div style="font-size:2rem;margin-bottom:8px;">&#9733;</div>Start using tools to build your workspace.<br><span style="font-size:.78rem;color:#9CA3AF;">When you sign in, favorites, documents, and recent calculations sync across devices.</span></div>';
      refreshMissionSummaryCards();
      return;
    }

    var activeTab = tabs.some(function (tab) { return tab.id === preferredTab; }) ? preferredTab : tabs[0].id;

    var html = '<div class="ws-tabs">' + tabs.map(function (tab) {
      return '<button class="ws-tab' + (tab.id === activeTab ? ' active' : '') + '" data-ws="' + tab.id + '">' + tab.icon + ' ' + tab.label + '</button>';
    }).join('') + '</div>';

    html += '<div class="ws-panels">';
    tabs.forEach(function (tab) {
      html += '<div class="ws-panel' + (tab.id === activeTab ? ' active' : '') + '" data-ws-panel="' + tab.id + '" id="' + tab.id + '"></div>';
    });
    html += '</div>';

    container.innerHTML = html;

    container.querySelectorAll('.ws-tab').forEach(function (tabButton) {
      tabButton.addEventListener('click', function () {
        var nextTab = tabButton.getAttribute('data-ws');
        container.querySelectorAll('.ws-tab').forEach(function (button) { button.classList.remove('active'); });
        container.querySelectorAll('.ws-panel').forEach(function (panel) { panel.classList.remove('active'); });
        tabButton.classList.add('active');
        var panel = container.querySelector('[data-ws-panel="' + nextTab + '"]');
        if (panel) panel.classList.add('active');
      });
    });

    if (document.getElementById('ws-favs')) {
      var favoritesPanel = document.getElementById('ws-favs');
      favoritesPanel.id = 'favoritesContainer';
      favoritesPanel.className += ' favorites-grid';
      await window.loadFavorites(favoriteItems);
      favoritesPanel.id = 'ws-favs';
    }

    if (document.getElementById('ws-history')) {
      var historyPanel = document.getElementById('ws-history');
      historyPanel.id = 'workspaceHistoryContainer';
      await window.loadSyncedCalculationHistory(historyItems);
      historyPanel.id = 'ws-history';
    }

    if (document.getElementById('ws-cvs')) {
      var cvsPanel = document.getElementById('ws-cvs');
      cvsPanel.id = 'myCVsContainer';
      if (typeof loadMyCVs === 'function') loadMyCVs();
      cvsPanel.id = 'ws-cvs';
    }

    if (document.getElementById('ws-plans')) {
      var plansPanel = document.getElementById('ws-plans');
      plansPanel.id = 'myFloorPlansContainer';
      if (typeof loadMyFloorPlans === 'function') loadMyFloorPlans();
      plansPanel.id = 'ws-plans';
    }

    if (document.getElementById('ws-docs')) {
      var docsPanel = document.getElementById('ws-docs');
      docsPanel.id = 'myDocumentsContainer';
      if (typeof loadMyDocuments === 'function') loadMyDocuments();
      docsPanel.id = 'ws-docs';
    }

    if (typeof updateQuickStats === 'function') updateQuickStats();
    refreshMissionSummaryCards();
  };

  async function upsertWorkspaceCV(item) {
    if (!window.AfroWorkspace || !window.AfroWorkspace.isSignedIn()) return;

    await window.AfroWorkspace.upsert({
      itemType: 'cv',
      itemKey: item.id,
      toolSlug: 'cv-builder',
      title: item.title || 'Untitled CV',
      summary: window.AfroWorkspace.summarizeText(
        (((item.data || {}).fn || '') + ' ' + (((item.data || {}).ln) || '')).trim() || (item.template || 'CV template'),
        120
      ),
      href: '/tools/cv-builder/?cv=' + encodeURIComponent(item.id),
      payload: item,
      meta: {
        country: item.country || '',
        template: item.template || ''
      }
    });
  }

  async function upsertWorkspacePlan(plan) {
    if (!window.AfroWorkspace || !window.AfroWorkspace.isSignedIn()) return;

    await window.AfroWorkspace.upsert({
      itemType: 'floor-plan',
      itemKey: plan.id,
      toolSlug: 'floor-planner',
      title: plan.name || 'Untitled Plan',
      summary: [
        typeof plan.rooms === 'number' ? plan.rooms + ' rooms' : '',
        typeof plan.area === 'number' ? plan.area.toFixed(1) + ' m2' : ''
      ].filter(Boolean).join(' | '),
      href: '/engineering/floor-planner/?project=' + encodeURIComponent(plan.id),
      payload: plan,
      meta: {
        rooms: plan.rooms || 0,
        area: plan.area || 0
      }
    });
  }

  function attachDashboardWorkspaceOverrides() {
    window.duplicateDashboardCV = async function (id) {
      try {
        var cvs = JSON.parse(localStorage.getItem('afro_cv_list') || '[]');
        var cv = cvs.find(function (item) { return item.id === id; });
        if (!cv) return;

        var newCV = JSON.parse(JSON.stringify(cv));
        newCV.id = 'cv_' + Date.now();
        newCV.title = (cv.title || 'Untitled CV') + ' (Copy)';
        newCV.createdAt = Date.now();
        newCV.updatedAt = Date.now();
        cvs.unshift(newCV);
        localStorage.setItem('afro_cv_list', JSON.stringify(cvs));

        await upsertWorkspaceCV(newCV);
        if (typeof loadMyCVs === 'function') loadMyCVs();
        refreshMissionSummaryCards();
      } catch (error) {
        console.warn('[DashboardSync] duplicateDashboardCV failed:', error);
      }
    };

    window.deleteDashboardCV = async function (id) {
      if (!confirm('Delete this CV?')) return;

      try {
        var cvs = JSON.parse(localStorage.getItem('afro_cv_list') || '[]');
        cvs = cvs.filter(function (item) { return item.id !== id; });
        localStorage.setItem('afro_cv_list', JSON.stringify(cvs));

        if (window.AfroWorkspace && window.AfroWorkspace.isSignedIn()) {
          await window.AfroWorkspace.remove({ itemType: 'cv', itemKey: id });
        }

        if (typeof loadMyCVs === 'function') loadMyCVs();
        refreshMissionSummaryCards();
      } catch (error) {
        console.warn('[DashboardSync] deleteDashboardCV failed:', error);
      }
    };

    window.duplicateDashboardFP = async function (id) {
      try {
        var plans = JSON.parse(localStorage.getItem('afro_fp_list') || '[]');
        var summary = plans.find(function (item) { return item.id === id; });
        if (!summary) return;

        var planData = JSON.parse(localStorage.getItem('afro_fp_' + id) || '{}');
        var newId = 'fp_' + Date.now();
        var duplicatedPlan = JSON.parse(JSON.stringify(planData));

        duplicatedPlan.id = newId;
        duplicatedPlan.name = (summary.name || 'Untitled Plan') + ' (Copy)';
        duplicatedPlan.updatedAt = Date.now();
        duplicatedPlan.savedAt = Date.now();

        localStorage.setItem('afro_fp_' + newId, JSON.stringify(duplicatedPlan));

        var duplicatedSummary = {
          id: newId,
          name: duplicatedPlan.name,
          updatedAt: duplicatedPlan.updatedAt,
          rooms: summary.rooms || 0,
          area: summary.area || 0
        };
        plans.unshift(duplicatedSummary);
        localStorage.setItem('afro_fp_list', JSON.stringify(plans));

        duplicatedPlan.rooms = duplicatedSummary.rooms;
        duplicatedPlan.area = duplicatedSummary.area;
        await upsertWorkspacePlan(duplicatedPlan);
        if (typeof loadMyFloorPlans === 'function') loadMyFloorPlans();
      } catch (error) {
        console.warn('[DashboardSync] duplicateDashboardFP failed:', error);
      }
    };

    window.deleteDashboardFP = async function (id) {
      if (!confirm('Delete this floor plan?')) return;

      try {
        var plans = JSON.parse(localStorage.getItem('afro_fp_list') || '[]');
        plans = plans.filter(function (item) { return item.id !== id; });
        localStorage.setItem('afro_fp_list', JSON.stringify(plans));
        localStorage.removeItem('afro_fp_' + id);

        if (window.AfroWorkspace && window.AfroWorkspace.isSignedIn()) {
          await window.AfroWorkspace.remove({ itemType: 'floor-plan', itemKey: id });
        }

        if (typeof loadMyFloorPlans === 'function') loadMyFloorPlans();
      } catch (error) {
        console.warn('[DashboardSync] deleteDashboardFP failed:', error);
      }
    };
  }

  function attachDashboardWorkspaceListeners() {
    if (window._dashboardWorkspaceListenersAttached) return;
    window._dashboardWorkspaceListenersAttached = true;

    window.addEventListener('afro-favorites-change', function () {
      if (typeof isLoggedIn !== 'undefined' && isLoggedIn && typeof renderMyWorkspace === 'function') {
        renderMyWorkspace({ activeTab: getActiveWorkspaceTab() });
      }
    });

    window.addEventListener('afro-workspace-change', function () {
      if (typeof isLoggedIn !== 'undefined' && isLoggedIn && typeof renderMyWorkspace === 'function') {
        renderMyWorkspace({ activeTab: getActiveWorkspaceTab() });
      }
    });

    window.addEventListener('storage', function (event) {
      var watchedKeys = {
        afro_favs_v2: true,
        afro_cv_list: true,
        afro_fp_list: true,
        afro_invoice_draft: true,
        afro_markdown_draft: true
      };

      if (!watchedKeys[event.key]) return;
      if (typeof isLoggedIn !== 'undefined' && isLoggedIn && typeof renderMyWorkspace === 'function') {
        renderMyWorkspace({ activeTab: getActiveWorkspaceTab() });
      }
    });

    window.addEventListener('focus', function () {
      if (typeof isLoggedIn !== 'undefined' && isLoggedIn && typeof renderMyWorkspace === 'function') {
        renderMyWorkspace({ activeTab: getActiveWorkspaceTab() });
      }
    });
  }

  function attachDashboardAuthExtensions() {
    if (typeof window.AfroAuth === 'undefined' || !window.AfroAuth) return;

    if (typeof window.AfroAuth.getSessionTokenAsync !== 'function') {
      window.AfroAuth.getSessionTokenAsync = async function () {
        var supabase = typeof window.AfroAuth.getSupabase === 'function' ? window.AfroAuth.getSupabase() : null;
        if (supabase && supabase.auth && typeof supabase.auth.getSession === 'function') {
          var sessionResult = await supabase.auth.getSession();
          if (sessionResult && sessionResult.data && sessionResult.data.session && sessionResult.data.session.access_token) {
            return sessionResult.data.session.access_token;
          }
        }
        return typeof window.AfroAuth.getSessionToken === 'function' ? window.AfroAuth.getSessionToken() : null;
      };
    }

    if (typeof window.AfroAuth.updatePassword !== 'function') {
      window.AfroAuth.updatePassword = async function (newPassword) {
        try {
          var supabase = typeof window.AfroAuth.getSupabase === 'function' ? window.AfroAuth.getSupabase() : null;
          if (!supabase || !supabase.auth || typeof supabase.auth.updateUser !== 'function') {
            return { ok: false, error: 'Auth session is not ready yet.' };
          }

          var result = await supabase.auth.updateUser({ password: newPassword });
          if (result && result.error) {
            return { ok: false, error: result.error.message };
          }

          return { ok: true };
        } catch (error) {
          return { ok: false, error: error.message || 'Password update failed' };
        }
      };
    }
  }

  attachDashboardWorkspaceOverrides();
  attachDashboardWorkspaceListeners();
  attachDashboardAuthExtensions();

  if (typeof isLoggedIn !== 'undefined' && isLoggedIn && typeof renderMyWorkspace === 'function') {
    renderMyWorkspace();
  }
})();

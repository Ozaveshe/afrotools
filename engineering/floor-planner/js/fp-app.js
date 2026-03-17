/**
 * AfroPlan App — Main orchestrator
 * Ties together canvas, walls, objects, furniture, templates
 * Handles save/load, export, AI integration, dashboard
 */
var FPApp = (function() {
  'use strict';

  var currentTool = 'select';
  var projectId = null;
  var projectName = 'Untitled Plan';
  var autoSaveTimer = null;
  var isDirty = false;

  function init() {
    FPCanvas.init();
    FPWalls.init();
    FPObjects.init();
    FPFurniture.init();

    setupToolbar();
    setupActionBar();
    setupAiBar();
    setupModals();
    setupMobile();
    loadAutoSave();
    startAutoSave();

    // Track hover for cursor
    FPCanvas.on('hover', function(id) {
      // Update internal hover state for rendering
    });
    FPCanvas.on('objectsChanged', function() {
      isDirty = true;
      FPObjects.showEmptyProperties();
    });
    FPCanvas.on('selectionChanged', function(ids) {
      if (ids.length === 1) {
        var obj = FPCanvas.getObject(ids[0]);
        if (obj) FPObjects.showProperties(obj);
      } else {
        FPObjects.showEmptyProperties();
      }
    });

    // Units selector
    var unitsEl = document.getElementById('fpUnits');
    if (unitsEl) {
      unitsEl.addEventListener('change', function() {
        FPCanvas.units = this.value;
      });
    }

    // Check URL for project param
    var params = new URLSearchParams(window.location.search);
    var pid = params.get('project');
    if (pid) loadProject(pid);

    // GA4 event
    if (typeof gtag === 'function') gtag('event', 'tool_view', { tool: 'floor-planner' });
  }

  // ── Toolbar ──
  function setupToolbar() {
    var toolbar = document.getElementById('fpToolbar');
    if (!toolbar) return;
    toolbar.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-tool]');
      if (!btn) return;
      setTool(btn.dataset.tool);
    });
  }

  function setTool(tool) {
    currentTool = tool;
    // Toggle furniture panel
    var furnPanel = document.getElementById('fpFurniturePanel');
    if (furnPanel) furnPanel.hidden = tool !== 'furniture';

    // Update toolbar active state
    document.querySelectorAll('.fp-tool').forEach(function(el) {
      el.classList.toggle('active', el.dataset.tool === tool);
    });

    // Update cursor
    var canvas = document.getElementById('fpCanvas');
    var cursors = {
      select: 'default', wall: 'crosshair', door: 'copy', window: 'copy',
      furniture: 'default', measure: 'crosshair', label: 'text', erase: 'not-allowed'
    };
    if (canvas) canvas.style.cursor = cursors[tool] || 'default';
  }

  // ── Action Bar ──
  function setupActionBar() {
    bind('fpUndo', 'click', function() { FPCanvas.undo(); });
    bind('fpRedo', 'click', function() { FPCanvas.redo(); });
    bind('fpSave', 'click', saveProject);
    bind('fpExportPdf', 'click', function() { loadLazy('fp-export', function() { FPExport.toPDF(); }); });
    bind('fpExportPng', 'click', function() { loadLazy('fp-export', function() { FPExport.toPNG(); }); });
    bind('fpExportBoq', 'click', function() { loadLazy('fp-export', function() { FPExport.toBOQPDF(); }); });
    bind('fpShare', 'click', shareProject);
    bind('fpOptimize', 'click', function() { loadLazy('fp-ai', function() { runOptimize(); }); });
    bind('fpEstimateCost', 'click', function() { loadLazy('fp-cost', function() { runCostEstimate(); }); });
    bind('fpAiChat', 'click', toggleChat);

    // Properties panel toggle
    bind('fpPropsClose', 'click', function() {
      document.getElementById('fpProps').classList.toggle('collapsed');
    });
  }

  // ── AI Bar ──
  function setupAiBar() {
    var input = document.getElementById('fpAiInput');
    var btn = document.getElementById('fpAiGenerate');
    if (!btn || !input) return;
    btn.addEventListener('click', function() {
      var desc = input.value.trim();
      if (!desc) return;
      generateFromAI(desc);
    });
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        var desc = input.value.trim();
        if (desc) generateFromAI(desc);
      }
    });
  }

  function generateFromAI(description) {
    var btn = document.getElementById('fpAiGenerate');
    var origText = btn.textContent;
    btn.textContent = 'Generating...';
    btn.disabled = true;

    loadLazy('fp-ai', function() {
      FPAi.generateFloorPlan(description).then(function(plan) {
        btn.textContent = origText;
        btn.disabled = false;
        if (plan) {
          FPCanvas.pushUndo();
          loadPlanData(plan);
          FPCanvas.fitAll();
          isDirty = true;
          if (typeof gtag === 'function') gtag('event', 'plan_generated_ai', { tool: 'floor-planner' });
        }
      }).catch(function(err) {
        btn.textContent = origText;
        btn.disabled = false;
        alert('AI generation failed: ' + (err.message || err));
      });
    });
  }

  function runOptimize() {
    var planData = exportPlanData();
    FPAi.optimizeLayout(planData).then(function(suggestions) {
      // Show suggestions in a modal
      var modal = document.getElementById('fpCostModal');
      var content = document.getElementById('fpCostContent');
      if (modal && content) {
        content.innerHTML = '<h3 style="margin-bottom:12px">Layout Optimization Suggestions</h3>' +
          '<div style="white-space:pre-wrap;line-height:1.6;font-size:14px">' + escHtml(suggestions) + '</div>';
        modal.querySelector('.fp-modal-header h2').textContent = 'AI Layout Optimizer';
        modal.hidden = false;
      }
    }).catch(function(err) {
      alert('Optimization failed: ' + (err.message || err));
    });
  }

  function runCostEstimate() {
    var planData = exportPlanData();
    var result = FPCost.estimate(planData, 'NG');
    var html = FPCost.renderEstimate(result, 'NG');
    var modal = document.getElementById('fpCostModal');
    var content = document.getElementById('fpCostContent');
    if (modal && content) {
      modal.querySelector('.fp-modal-header h2').textContent = 'Construction Cost Estimate';
      content.innerHTML = html;
      modal.hidden = false;
      // Country selector handler
      var sel = content.querySelector('#fpCostCountry');
      if (sel) {
        sel.addEventListener('change', function() {
          var code = this.value;
          var newResult = FPCost.estimate(planData, code);
          content.innerHTML = FPCost.renderEstimate(newResult, code);
        });
      }
      if (typeof gtag === 'function') gtag('event', 'cost_estimated', { tool: 'floor-planner' });
    }
  }

  // ── Chat ──
  function toggleChat() {
    var drawer = document.getElementById('fpChatDrawer');
    if (!drawer) return;
    drawer.hidden = !drawer.hidden;
    if (!drawer.hidden) setupChat();
  }

  function setupChat() {
    var sendBtn = document.getElementById('fpChatSend');
    var input = document.getElementById('fpChatInput');
    if (!sendBtn || sendBtn._bound) return;
    sendBtn._bound = true;

    function send() {
      var msg = input.value.trim();
      if (!msg) return;
      input.value = '';
      appendChatMsg(msg, 'user');
      loadLazy('fp-ai', function() {
        FPAi.chat(msg, exportPlanData()).then(function(reply) {
          appendChatMsg(reply, 'ai');
        }).catch(function() {
          appendChatMsg('Sorry, I couldn\'t process that. Please try again.', 'ai');
        });
      });
    }

    sendBtn.addEventListener('click', send);
    input.addEventListener('keydown', function(e) { if (e.key === 'Enter') send(); });

    var closeBtn = document.getElementById('fpChatClose');
    if (closeBtn) closeBtn.addEventListener('click', function() {
      document.getElementById('fpChatDrawer').hidden = true;
    });
  }

  function appendChatMsg(text, role) {
    var container = document.getElementById('fpChatMessages');
    if (!container) return;
    var div = document.createElement('div');
    div.className = 'fp-chat-msg ' + role;
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  // ── Templates ──
  function setupModals() {
    // Templates button
    bind('fpTemplatesBtn', 'click', showTemplates);

    // Close all modals on overlay click or X
    document.querySelectorAll('.fp-modal-overlay').forEach(function(overlay) {
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) overlay.hidden = true;
      });
    });
    document.querySelectorAll('[data-close]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var el = document.getElementById(btn.dataset.close);
        if (el) el.hidden = true;
      });
    });
  }

  function showTemplates() {
    var modal = document.getElementById('fpTemplatesModal');
    var grid = document.getElementById('fpTemplatesGrid');
    if (!modal || !grid) return;

    if (typeof FPTemplates === 'undefined') {
      grid.innerHTML = '<p style="text-align:center;padding:20px;color:var(--color-text-muted)">Loading templates...</p>';
      modal.hidden = false;
      return;
    }

    var templates = FPTemplates.getAll();
    var html = '<div class="fp-tmpl-grid">';
    templates.forEach(function(t) {
      html += '<div class="fp-tmpl-card" data-tmpl="' + t.key + '">';
      html += '<div class="fp-tmpl-preview"><div style="font-size:32px;opacity:0.3">&#9633;</div></div>';
      html += '<div class="fp-tmpl-name">' + escHtml(t.name) + '</div>';
      html += '<div class="fp-tmpl-meta">' + escHtml(t.country) + ' &middot; ' + t.rooms + ' rooms &middot; ' + t.area + ' m&sup2;</div>';
      html += '</div>';
    });
    html += '</div>';
    grid.innerHTML = html;

    grid.querySelectorAll('.fp-tmpl-card').forEach(function(card) {
      card.addEventListener('click', function() {
        var key = card.dataset.tmpl;
        var objects = FPTemplates.loadTemplate(key);
        if (objects) {
          FPCanvas.pushUndo();
          FPCanvas.clearAll();
          objects.forEach(function(o) { FPCanvas.addObject(o); });
          FPCanvas.fitAll();
          isDirty = true;
          projectName = card.querySelector('.fp-tmpl-name').textContent;
          modal.hidden = true;
          if (typeof gtag === 'function') gtag('event', 'template_loaded', { tool: 'floor-planner', template: key });
        }
      });
    });

    modal.hidden = false;
  }

  // ── Save / Load ──
  function saveProject() {
    if (!projectId) projectId = 'fp_' + Date.now();
    var name = prompt('Project name:', projectName);
    if (name === null) return;
    projectName = name || projectName;

    var data = {
      id: projectId,
      name: projectName,
      objects: FPCanvas.getObjects(),
      units: FPCanvas.units,
      gridSize: FPCanvas.gridSize,
      updatedAt: Date.now()
    };

    // Save to project list
    var list = JSON.parse(localStorage.getItem('afro_fp_list') || '[]');
    var idx = list.findIndex(function(p) { return p.id === projectId; });
    var meta = { id: projectId, name: projectName, updatedAt: data.updatedAt, rooms: FPCanvas.getObjects('room').length, area: totalArea() };
    if (idx >= 0) list[idx] = meta; else list.unshift(meta);
    localStorage.setItem('afro_fp_list', JSON.stringify(list));
    localStorage.setItem('afro_fp_' + projectId, JSON.stringify(data));
    isDirty = false;
    alert('Project saved: ' + projectName);
  }

  function loadProject(pid) {
    var raw = localStorage.getItem('afro_fp_' + pid);
    if (!raw) return;
    try {
      var data = JSON.parse(raw);
      projectId = data.id;
      projectName = data.name || 'Untitled Plan';
      FPCanvas.clearAll();
      if (data.objects) data.objects.forEach(function(o) { FPCanvas.addObject(o); });
      if (data.units) FPCanvas.units = data.units;
      if (data.gridSize) FPCanvas.gridSize = data.gridSize;
      FPCanvas.fitAll();
    } catch (e) { /* ignore corrupt data */ }
  }

  function startAutoSave() {
    autoSaveTimer = setInterval(function() {
      if (!isDirty) return;
      var data = {
        objects: FPCanvas.getObjects(),
        units: FPCanvas.units,
        gridSize: FPCanvas.gridSize,
        projectId: projectId,
        projectName: projectName,
        savedAt: Date.now()
      };
      localStorage.setItem('afro_fp_autosave', JSON.stringify(data));
      isDirty = false;
    }, 30000); // every 30 seconds
  }

  function loadAutoSave() {
    // Check for URL project param first
    if (new URLSearchParams(window.location.search).get('project')) return;
    var raw = localStorage.getItem('afro_fp_autosave');
    if (!raw) return;
    try {
      var data = JSON.parse(raw);
      if (data.objects && data.objects.length > 0) {
        projectId = data.projectId;
        projectName = data.projectName || 'Untitled Plan';
        data.objects.forEach(function(o) { FPCanvas.addObject(o); });
        if (data.units) FPCanvas.units = data.units;
        FPCanvas.fitAll();
      }
    } catch (e) { /* ignore */ }
  }

  // ── Share ──
  function shareProject() {
    var data = exportPlanData();
    var json = JSON.stringify(data);
    if (json.length > 8000) {
      alert('Plan is too large to share via URL. Save and share the project instead.');
      return;
    }
    try {
      var encoded = btoa(encodeURIComponent(json));
      var url = window.location.origin + '/engineering/floor-planner/#plan=' + encoded;
      navigator.clipboard.writeText(url).then(function() {
        alert('Share link copied to clipboard!');
      }).catch(function() {
        prompt('Copy this share link:', url);
      });
    } catch (e) {
      alert('Could not generate share link.');
    }
  }

  // ── Plan data import/export ──
  function exportPlanData() {
    var walls = FPCanvas.getObjects('wall');
    var doors = FPCanvas.getObjects('door');
    var windows = FPCanvas.getObjects('window');
    var rooms = FPCanvas.getObjects('room');
    var furniture = FPCanvas.getObjects('furniture');
    var ta = totalArea();
    return { walls: walls, doors: doors, windows: windows, rooms: rooms, furniture: furniture, totalArea: ta };
  }

  function loadPlanData(plan) {
    FPCanvas.clearAll();
    if (plan.walls) plan.walls.forEach(function(w) {
      w.type = 'wall';
      w.thickness = w.thickness || 0.15;
      w.material = w.material || 'block';
      FPCanvas.addObject(w);
    });
    if (plan.doors) plan.doors.forEach(function(d) {
      d.type = 'door';
      d.width = d.width || 0.9;
      d.angle = d.angle || 0;
      d.subtype = d.subtype || 'single';
      FPCanvas.addObject(d);
    });
    if (plan.windows) plan.windows.forEach(function(w) {
      w.type = 'window';
      w.width = w.width || 1.2;
      w.angle = w.angle || 0;
      w.subtype = w.subtype || 'double';
      FPCanvas.addObject(w);
    });
    if (plan.rooms) plan.rooms.forEach(function(r) {
      r.type = 'room';
      r.color = r.color || FPWalls.ROOM_COLORS[r.name] || FPWalls.ROOM_COLORS['default'];
      FPCanvas.addObject(r);
    });
    if (plan.furniture) plan.furniture.forEach(function(f) {
      f.type = 'furniture';
      f.rotation = f.rotation || 0;
      FPCanvas.addObject(f);
    });
    FPCanvas.render();
  }

  function totalArea() {
    var rooms = FPCanvas.getObjects('room');
    var total = 0;
    rooms.forEach(function(r) { total += r.area || 0; });
    return total;
  }

  // ── Mobile ──
  function setupMobile() {
    var fab = document.getElementById('fpMobileFab');
    if (fab) {
      fab.addEventListener('click', function() {
        toggleChat();
      });
    }
    // Mobile tool button (on canvas tap when no tool active)
    if (window.innerWidth <= 768) {
      // Create mobile bottom tools
      var grid = document.getElementById('fpMobileToolsGrid');
      if (grid) {
        var tools = [
          { tool: 'select', label: 'Select', icon: '👆' },
          { tool: 'wall', label: 'Wall', icon: '🧱' },
          { tool: 'door', label: 'Door', icon: '🚪' },
          { tool: 'window', label: 'Window', icon: '🪟' },
          { tool: 'furniture', label: 'Furniture', icon: '🛋️' },
          { tool: 'measure', label: 'Measure', icon: '📏' },
          { tool: 'erase', label: 'Erase', icon: '🧹' },
          { tool: 'label', label: 'Label', icon: '🏷️' }
        ];
        grid.innerHTML = tools.map(function(t) {
          return '<button class="fp-tool" data-tool="' + t.tool + '" style="width:auto;height:auto;padding:10px"><span style="font-size:20px">' + t.icon + '</span><span>' + t.label + '</span></button>';
        }).join('');
        grid.addEventListener('click', function(e) {
          var btn = e.target.closest('[data-tool]');
          if (btn) {
            setTool(btn.dataset.tool);
            document.getElementById('fpMobileTools').hidden = true;
          }
        });
      }
    }
  }

  // ── Lazy loading ──
  var loadedScripts = {};
  function loadLazy(name, callback) {
    if (loadedScripts[name]) { callback(); return; }
    var src = '/engineering/floor-planner/js/' + name + '.js';
    var s = document.createElement('script');
    s.src = src;
    s.onload = function() { loadedScripts[name] = true; callback(); };
    s.onerror = function() { alert('Failed to load ' + name); };
    document.head.appendChild(s);
  }

  // ── Helpers ──
  function bind(id, event, fn) {
    var el = document.getElementById(id);
    if (el) el.addEventListener(event, fn);
  }

  function escHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // ── Check for shared plan in URL hash ──
  function checkShareHash() {
    var hash = window.location.hash;
    if (hash && hash.indexOf('#plan=') === 0) {
      try {
        var encoded = hash.substring(6);
        var json = decodeURIComponent(atob(encoded));
        var plan = JSON.parse(json);
        loadPlanData(plan);
        FPCanvas.fitAll();
        window.location.hash = '';
      } catch (e) { /* ignore corrupt hash */ }
    }
  }

  // ── Boot ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { init(); checkShareHash(); });
  } else {
    init();
    checkShareHash();
  }

  return {
    get currentTool() { return currentTool; },
    setTool: setTool,
    exportPlanData: exportPlanData,
    loadPlanData: loadPlanData,
    saveProject: saveProject,
    loadProject: loadProject,
    get projectName() { return projectName; },
    get projectId() { return projectId; }
  };
})();

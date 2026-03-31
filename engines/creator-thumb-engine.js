/**
 * ThumbnailForge Engine — Canvas layer management, templates, history, persistence
 * IIFE module on window.AfroTools.engines.creatorThumb
 */
(function() {
  'use strict';

  // ── AUTH HELPERS ──
  var supabaseClient = null;
  function getSupabase() {
    if (supabaseClient) return supabaseClient;
    if (window.AfroAuth && typeof AfroAuth.getSupabase === 'function') {
      supabaseClient = AfroAuth.getSupabase();
      return supabaseClient;
    }
    return null;
  }
  function getUserId() {
    if (window.AfroAuth && AfroAuth.user) return AfroAuth.user.id;
    return null;
  }
  function scopedKey(base) {
    var uid = getUserId();
    return uid ? base + '_' + uid : base;
  }

  var _layers = [];
  var _background = { type: 'solid', color: '#FF3B30', overlay: 0 };
  var _history = [];
  var _historyIndex = -1;
  var _idCounter = 0;

  // ── TEMPLATES ──
  var TEMPLATES = [
    {
      id: 'reaction-01', name: 'Big Reaction', category: 'reaction',
      colors: ['#FF3B30', '#FF6B3B'],
      layers: [
        { type: 'text', content: 'I TRIED THIS...', x: 60, y: 80, fontSize: 96, fontFamily: 'Impact, sans-serif', fontWeight: 900, color: '#fff', outline: true, outlineWidth: 4, outlineColor: '#000', shadow: true, shadowOffset: 4, shadowColor: 'rgba(0,0,0,.5)', uppercase: true, maxWidth: 700, textAlign: 'left' },
        { type: 'text', content: 'NEVER AGAIN', x: 60, y: 380, fontSize: 72, fontFamily: 'Impact, sans-serif', fontWeight: 900, color: '#FFCC00', outline: true, outlineWidth: 3, outlineColor: '#000', uppercase: true, maxWidth: 500, textAlign: 'left' },
        { type: 'emoji', content: '😱', x: 1100, y: 560, size: 100 }
      ],
      bg: { type: 'gradient', colors: ['#FF3B30', '#FF6B3B'], angle: 135 }
    },
    {
      id: 'beforeafter-01', name: 'Before & After', category: 'beforeafter',
      colors: ['#1C1C1E', '#3A3A3C'],
      layers: [
        { type: 'shape', shape: 'rect', x: 0, y: 0, w: 640, h: 720, fill: '#E53E3E' },
        { type: 'shape', shape: 'rect', x: 640, y: 0, w: 640, h: 720, fill: '#38A169' },
        { type: 'text', content: 'BEFORE', x: 140, y: 300, fontSize: 64, fontFamily: 'Impact, sans-serif', fontWeight: 900, color: '#fff', outline: true, outlineWidth: 3, outlineColor: '#000', uppercase: true, maxWidth: 400, textAlign: 'center' },
        { type: 'text', content: 'AFTER', x: 780, y: 300, fontSize: 64, fontFamily: 'Impact, sans-serif', fontWeight: 900, color: '#fff', outline: true, outlineWidth: 3, outlineColor: '#000', uppercase: true, maxWidth: 400, textAlign: 'center' },
        { type: 'text', content: 'VS', x: 570, y: 280, fontSize: 80, fontFamily: '"Bebas Neue", sans-serif', fontWeight: 400, color: '#FFD60A', outline: true, outlineWidth: 4, outlineColor: '#000', maxWidth: 140, textAlign: 'center' }
      ],
      bg: { type: 'solid', color: '#1C1C1E' }
    },
    {
      id: 'tutorial-01', name: 'Step Tutorial', category: 'tutorial',
      colors: ['#007AFF', '#5856D6'],
      layers: [
        { type: 'text', content: 'HOW TO', x: 60, y: 60, fontSize: 48, fontFamily: '"DM Sans", sans-serif', fontWeight: 800, color: 'rgba(255,255,255,.5)', uppercase: true, maxWidth: 600, textAlign: 'left' },
        { type: 'text', content: 'Edit Videos Like a Pro', x: 60, y: 140, fontSize: 72, fontFamily: '"Montserrat", sans-serif', fontWeight: 900, color: '#fff', outline: false, maxWidth: 700, textAlign: 'left' },
        { type: 'text', content: 'Step-by-Step Guide', x: 60, y: 560, fontSize: 36, fontFamily: '"DM Sans", sans-serif', fontWeight: 700, color: '#FFD60A', maxWidth: 500, textAlign: 'left' },
        { type: 'shape', shape: 'rect', x: 60, y: 520, w: 300, h: 4, fill: '#FFD60A' }
      ],
      bg: { type: 'gradient', colors: ['#007AFF', '#5856D6'], angle: 135 }
    },
    {
      id: 'vlog-01', name: 'Casual Vlog', category: 'vlog',
      colors: ['#FF9500', '#FFD60A'],
      layers: [
        { type: 'text', content: 'A Day in Lagos', x: 60, y: 200, fontSize: 84, fontFamily: '"Bebas Neue", sans-serif', fontWeight: 400, color: '#fff', outline: true, outlineWidth: 3, outlineColor: '#000', shadow: true, shadowOffset: 3, shadowColor: 'rgba(0,0,0,.5)', uppercase: true, maxWidth: 700, textAlign: 'left' },
        { type: 'text', content: 'VLOG #42', x: 60, y: 100, fontSize: 32, fontFamily: '"DM Sans", sans-serif', fontWeight: 800, color: '#FFD60A', outline: true, outlineWidth: 2, outlineColor: '#000', uppercase: true, maxWidth: 300, textAlign: 'left' },
        { type: 'text', content: '📍 Victoria Island', x: 60, y: 600, fontSize: 28, fontFamily: '"DM Sans", sans-serif', fontWeight: 700, color: 'rgba(255,255,255,.8)', maxWidth: 400, textAlign: 'left' }
      ],
      bg: { type: 'gradient', colors: ['#FF9500', '#FFD60A'], angle: 135 }
    },
    {
      id: 'podcast-01', name: 'Podcast Episode', category: 'podcast',
      colors: ['#5856D6', '#AF52DE'],
      layers: [
        { type: 'shape', shape: 'circle', x: 440, y: 110, w: 400, h: 400, fill: 'rgba(255,255,255,.1)' },
        { type: 'text', content: 'THE CULTURE TALK', x: 60, y: 80, fontSize: 28, fontFamily: '"DM Sans", sans-serif', fontWeight: 800, color: 'rgba(255,255,255,.5)', uppercase: true, maxWidth: 600, textAlign: 'left' },
        { type: 'text', content: 'Why African Music Is Taking Over', x: 60, y: 200, fontSize: 56, fontFamily: '"Montserrat", sans-serif', fontWeight: 900, color: '#fff', maxWidth: 600, textAlign: 'left' },
        { type: 'text', content: 'EP. 24', x: 60, y: 580, fontSize: 40, fontFamily: '"Bebas Neue", sans-serif', fontWeight: 400, color: '#FFD60A', maxWidth: 200, textAlign: 'left' },
        { type: 'emoji', content: '🎙️', x: 180, y: 560, size: 48 }
      ],
      bg: { type: 'gradient', colors: ['#5856D6', '#AF52DE'], angle: 135 }
    },
    {
      id: 'gaming-01', name: 'Gaming Highlight', category: 'gaming',
      colors: ['#0f0f0f', '#FF2D55'],
      layers: [
        { type: 'text', content: 'INSANE CLUTCH', x: 60, y: 120, fontSize: 96, fontFamily: '"Anton", sans-serif', fontWeight: 400, color: '#FF2D55', outline: true, outlineWidth: 3, outlineColor: '#000', shadow: true, shadowOffset: 5, shadowColor: 'rgba(255,45,85,.3)', uppercase: true, maxWidth: 800, textAlign: 'left' },
        { type: 'text', content: '1v4 WIN!!', x: 60, y: 400, fontSize: 72, fontFamily: '"Bebas Neue", sans-serif', fontWeight: 400, color: '#fff', outline: true, outlineWidth: 3, outlineColor: '#000', uppercase: true, maxWidth: 500, textAlign: 'left' },
        { type: 'emoji', content: '🔥', x: 1100, y: 50, size: 90 },
        { type: 'emoji', content: '⚡', x: 1050, y: 580, size: 80 }
      ],
      bg: { type: 'gradient', colors: ['#0f0f0f', '#FF2D55'], angle: 135 }
    },
    {
      id: 'listicle-01', name: 'Top List', category: 'listicle',
      colors: ['#34C759', '#30D158'],
      layers: [
        { type: 'text', content: '7', x: 60, y: 40, fontSize: 280, fontFamily: '"Bebas Neue", sans-serif', fontWeight: 400, color: 'rgba(255,255,255,.15)', maxWidth: 300, textAlign: 'left' },
        { type: 'text', content: '7 THINGS YOU MUST KNOW', x: 60, y: 280, fontSize: 64, fontFamily: 'Impact, sans-serif', fontWeight: 900, color: '#fff', outline: true, outlineWidth: 3, outlineColor: '#000', uppercase: true, maxWidth: 800, textAlign: 'left' },
        { type: 'text', content: 'Before Moving to Africa', x: 60, y: 520, fontSize: 40, fontFamily: '"DM Sans", sans-serif', fontWeight: 700, color: '#FFD60A', maxWidth: 600, textAlign: 'left' }
      ],
      bg: { type: 'gradient', colors: ['#34C759', '#30D158'], angle: 135 }
    },
    {
      id: 'drama-01', name: 'Storytime', category: 'drama',
      colors: ['#1C1C1E', '#3A3A3C'],
      layers: [
        { type: 'text', content: 'I Can\'t Believe This Happened...', x: 60, y: 180, fontSize: 72, fontFamily: 'Impact, sans-serif', fontWeight: 900, color: '#fff', outline: true, outlineWidth: 4, outlineColor: '#000', shadow: true, shadowOffset: 5, shadowColor: 'rgba(0,0,0,.7)', uppercase: true, maxWidth: 900, textAlign: 'left' },
        { type: 'emoji', content: '❓', x: 1080, y: 50, size: 100 },
        { type: 'emoji', content: '❓', x: 1000, y: 550, size: 80 },
        { type: 'emoji', content: '😱', x: 60, y: 550, size: 90 }
      ],
      bg: { type: 'gradient', colors: ['#1C1C1E', '#3A3A3C'], angle: 135, overlay: 0 }
    },
    {
      id: 'review-01', name: 'Product Review', category: 'review',
      colors: ['#0D47A1', '#42A5F5'],
      layers: [
        { type: 'text', content: 'HONEST REVIEW', x: 60, y: 60, fontSize: 36, fontFamily: '"DM Sans", sans-serif', fontWeight: 800, color: '#FFD60A', uppercase: true, maxWidth: 400, textAlign: 'left' },
        { type: 'text', content: 'Is It Worth the Money?', x: 60, y: 200, fontSize: 68, fontFamily: '"Montserrat", sans-serif', fontWeight: 900, color: '#fff', maxWidth: 700, textAlign: 'left' },
        { type: 'text', content: '⭐⭐⭐⭐☆', x: 60, y: 560, fontSize: 48, fontFamily: 'serif', maxWidth: 400, textAlign: 'left' },
        { type: 'shape', shape: 'rect', x: 900, y: 120, w: 320, h: 480, fill: 'rgba(255,255,255,.08)' }
      ],
      bg: { type: 'gradient', colors: ['#0D47A1', '#42A5F5'], angle: 135 }
    },
    {
      id: 'blank-01', name: 'Blank Canvas', category: 'blank',
      colors: ['#FFFFFF', '#F5F5F5'],
      layers: [],
      bg: { type: 'solid', color: '#FFFFFF' }
    }
  ];

  // ── ENGINE ──
  var ThumbEngine = {
    init: function() {
      _layers = [];
      _background = { type: 'solid', color: '#FF3B30', overlay: 0 };
      _history = [];
      _historyIndex = -1;
      _idCounter = 0;
    },

    // ── LAYER MANAGEMENT ──
    addLayer: function(props) {
      var id = 'layer_' + (++_idCounter);
      props.id = id;
      props.z = _layers.length + 1;
      _layers.push(props);
      return id;
    },

    removeLayer: function(id) {
      _layers = _layers.filter(function(l) { return l.id !== id; });
    },

    updateLayer: function(id, props) {
      var layer = _layers.find(function(l) { return l.id === id; });
      if (!layer) return;
      Object.keys(props).forEach(function(k) { layer[k] = props[k]; });
    },

    getLayer: function(id) {
      return _layers.find(function(l) { return l.id === id; }) || null;
    },

    getLayers: function() {
      return _layers.slice().sort(function(a, b) { return (a.z || 0) - (b.z || 0); });
    },

    moveLayer: function(id, direction) {
      var sorted = _layers.slice().sort(function(a, b) { return (a.z || 0) - (b.z || 0); });
      var idx = sorted.findIndex(function(l) { return l.id === id; });
      if (idx < 0) return;
      if (direction === 'up' && idx < sorted.length - 1) {
        var temp = sorted[idx].z;
        sorted[idx].z = sorted[idx + 1].z;
        sorted[idx + 1].z = temp;
      } else if (direction === 'down' && idx > 0) {
        var tmp = sorted[idx].z;
        sorted[idx].z = sorted[idx - 1].z;
        sorted[idx - 1].z = tmp;
      }
    },

    // ── BACKGROUND ──
    setBackground: function(props) {
      Object.keys(props).forEach(function(k) { _background[k] = props[k]; });
    },

    getBackground: function() {
      return Object.assign({}, _background);
    },

    // ── TEMPLATES ──
    getTemplates: function() {
      return TEMPLATES;
    },

    loadTemplate: function(templateId) {
      var tmpl = TEMPLATES.find(function(t) { return t.id === templateId; });
      if (!tmpl) return;
      _layers = [];
      _idCounter = 0;
      _background = Object.assign({}, tmpl.bg);

      tmpl.layers.forEach(function(layerDef) {
        var layer = Object.assign({}, layerDef);
        layer.id = 'layer_' + (++_idCounter);
        layer.z = _layers.length + 1;
        _layers.push(layer);
      });
    },

    // ── HISTORY (UNDO/REDO) ──
    pushHistory: function() {
      // Trim future states
      _history = _history.slice(0, _historyIndex + 1);
      _history.push({
        layers: JSON.parse(JSON.stringify(_layers)),
        background: JSON.parse(JSON.stringify(_background)),
        idCounter: _idCounter
      });
      _historyIndex = _history.length - 1;

      // Limit history size
      if (_history.length > 50) {
        _history.shift();
        _historyIndex--;
      }

      // Auto-save
      this.saveLocal();
    },

    undo: function() {
      if (_historyIndex <= 0) return;
      _historyIndex--;
      var state = _history[_historyIndex];
      _layers = JSON.parse(JSON.stringify(state.layers));
      _background = JSON.parse(JSON.stringify(state.background));
      _idCounter = state.idCounter;
    },

    redo: function() {
      if (_historyIndex >= _history.length - 1) return;
      _historyIndex++;
      var state = _history[_historyIndex];
      _layers = JSON.parse(JSON.stringify(state.layers));
      _background = JSON.parse(JSON.stringify(state.background));
      _idCounter = state.idCounter;
    },

    // ── LOCAL STORAGE ──
    saveLocal: function() {
      try {
        var data = {
          layers: _layers,
          background: _background,
          idCounter: _idCounter,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('ct_current_project', JSON.stringify(data));
      } catch (e) { /* quota exceeded — silent */ }
    },

    loadLocal: function() {
      try {
        var raw = localStorage.getItem('ct_current_project');
        if (!raw) return false;
        var data = JSON.parse(raw);
        _layers = data.layers || [];
        _background = data.background || { type: 'solid', color: '#FF3B30' };
        _idCounter = data.idCounter || 0;
        return true;
      } catch (e) { return false; }
    }
  };

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.engines = window.AfroTools.engines || {};
  window.AfroTools.engines.creatorThumb = ThumbEngine;
})();

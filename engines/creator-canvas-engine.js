/**
 * CreatorCanvas Engine — Design & Template Management
 * Template generation, format definitions, element helpers, brand kit utilities
 */
(function() {
  'use strict';

  var CreatorCanvas = {
    id: 'creator-canvas',
    version: '1.0.0',

    // ── FORMAT DEFINITIONS ──────────────────────────────────────────
    FORMATS: {
      'ig-post':      { w: 1080, h: 1080, label: 'IG Post' },
      'ig-story':     { w: 1080, h: 1920, label: 'IG Story' },
      'ig-carousel':  { w: 1080, h: 1080, label: 'IG Carousel' },
      'yt-thumb':     { w: 1280, h: 720,  label: 'YT Thumbnail' },
      'tiktok':       { w: 1080, h: 1920, label: 'TikTok Cover' },
      'x-post':       { w: 1200, h: 675,  label: 'X Post' },
      'fb-cover':     { w: 820,  h: 312,  label: 'FB Cover' },
      'wa-status':    { w: 1080, h: 1920, label: 'WhatsApp' },
      'event-flyer':  { w: 1080, h: 1350, label: 'Event Flyer' },
      'a4':           { w: 2480, h: 3508, label: 'A4 Poster' }
    },

    // ── CATEGORIES ──────────────────────────────────────────────────
    CATEGORIES: ['quotes','promo','announcement','event','music','photography','food','fashion','business','minimalist'],

    // ── COLOR PALETTES ──────────────────────────────────────────────
    PALETTES: [
      { name: 'Ankara Flame',   colors: ['#E65100','#FF9800'] },
      { name: 'Savanna Green',  colors: ['#1B5E20','#4CAF50'] },
      { name: 'Adire Purple',   colors: ['#4A148C','#AB47BC'] },
      { name: 'Ocean Blue',     colors: ['#0D47A1','#42A5F5'] },
      { name: 'Dashiki Red',    colors: ['#B71C1C','#EF5350'] },
      { name: 'Gold Coast',     colors: ['#F57F17','#FFEE58'] },
      { name: 'Emerald Forest', colors: ['#004D40','#26A69A'] },
      { name: 'Indigo Night',   colors: ['#1A237E','#7986CB'] },
      { name: 'Earth Brown',    colors: ['#3E2723','#8D6E63'] },
      { name: 'Slate Storm',    colors: ['#263238','#78909C'] },
      { name: 'Hibiscus Pink',  colors: ['#880E4F','#F06292'] },
      { name: 'Deep Violet',    colors: ['#311B92','#B388FF'] }
    ],

    // ── CURATED FONTS ───────────────────────────────────────────────
    FONTS: [
      'DM Sans', 'Inter', 'Poppins', 'Nunito', 'Raleway',
      'Instrument Serif', 'Playfair Display', 'Space Grotesk',
      'Bebas Neue', 'Righteous', 'Staatliches', 'Archivo Black',
      'Alfa Slab One', 'Caveat', 'Shadows Into Light', 'Pacifico'
    ],

    // ── TEMPLATE TITLES ─────────────────────────────────────────────
    TITLES: [
      'Bold Statement', 'Clean Promo', 'Modern Announcement', 'Event Night',
      'Music Drop', 'Photo Showcase', 'Food Feature', 'Fashion Forward',
      'Business Pro', 'Minimal Quote', 'Hot Take', 'Motivation Monday',
      'Product Launch', 'Sale Alert', 'Behind the Scenes', 'Tutorial Thumb',
      'Reaction Face', 'Top 10 List', 'Before & After', 'Testimonial',
      'Sunday Vibes', 'Giveaway Post', 'Price List', 'Opening Hours',
      'Job Vacancy', 'Market Special', 'New Arrival', 'Flash Sale',
      'Thank You', 'Coming Soon', 'Countdown', 'Live Now',
      'Podcast Cover', 'Recipe Card', 'Fit Check', 'Hair Goals',
      'Travel Diary', 'Workshop', 'Free Template', 'Brand Story',
      'Milestone', 'Challenge', 'Menu Board', 'Meme Template',
      'Mood Board', 'Infographic', 'Stats Post', 'Carousel Slide',
      'Poll Graphic', 'Tip of the Day'
    ],

    EMOJIS: ['🔥','💡','📢','🎉','🎵','📸','🍲','👗','💼','✨',
             '🗣️','💪','🚀','🏷️','🎬','📚','😱','🏆','✅','⭐'],

    /**
     * Generate the full seed template library (50 templates)
     * Called by app.html on load: engine.getTemplates()
     */
    getTemplates: function() {
      var formats = [
        { format: 'yt-thumb',     w: 1280, h: 720,  label: 'YouTube' },
        { format: 'ig-post',      w: 1080, h: 1080, label: 'IG Post' },
        { format: 'ig-story',     w: 1080, h: 1920, label: 'IG Story' },
        { format: 'event-flyer',  w: 1080, h: 1350, label: 'Flyer' },
        { format: 'x-post',       w: 1200, h: 675,  label: 'X Post' },
        { format: 'wa-status',    w: 1080, h: 1920, label: 'WhatsApp' },
        { format: 'ig-carousel',  w: 1080, h: 1080, label: 'Carousel' },
        { format: 'fb-cover',     w: 820,  h: 312,  label: 'FB Cover' },
        { format: 'tiktok',       w: 1080, h: 1920, label: 'TikTok' },
        { format: 'a4',           w: 2480, h: 3508, label: 'A4' }
      ];
      var cats = this.CATEGORIES;
      var palettes = this.PALETTES;
      var titles = this.TITLES;
      var emojis = this.EMOJIS;
      var templates = [];

      for (var i = 0; i < 50; i++) {
        var fIdx = i % formats.length;
        var cIdx = i % cats.length;
        var pIdx = i % palettes.length;
        var f = formats[fIdx];
        var p = palettes[pIdx];
        var title = titles[i % titles.length];

        // Build canvas_data with 1-3 elements depending on category
        var elements = [];
        var headlineSize = f.h > 1200 ? 72 : (f.w > 1000 ? 64 : 48);

        // All templates get a headline
        elements.push({
          id: 'e1', type: 'text',
          content: title.toUpperCase(),
          x: Math.round(f.w * 0.08),
          y: Math.round(f.h * 0.35),
          width: Math.round(f.w * 0.84),
          height: headlineSize + 20,
          style: { fontFamily: 'DM Sans', fontSize: headlineSize, fontWeight: 900, color: '#ffffff', textAlign: 'center' }
        });

        // Some categories get a subtitle
        if (cIdx < 7) {
          elements.push({
            id: 'e2', type: 'text',
            content: cats[cIdx].charAt(0).toUpperCase() + cats[cIdx].slice(1) + ' · AfroTools',
            x: Math.round(f.w * 0.15),
            y: Math.round(f.h * 0.35) + headlineSize + 30,
            width: Math.round(f.w * 0.7),
            height: 30,
            style: { fontFamily: 'DM Sans', fontSize: 20, fontWeight: 500, color: 'rgba(255,255,255,0.75)', textAlign: 'center' }
          });
        }

        // Business / promo get a CTA bar
        if (cats[cIdx] === 'promo' || cats[cIdx] === 'business' || cats[cIdx] === 'event') {
          elements.push({
            id: 'e3', type: 'shape', shape: 'rect', fill: 'rgba(0,0,0,0.35)',
            x: Math.round(f.w * 0.2), y: Math.round(f.h * 0.75),
            width: Math.round(f.w * 0.6), height: 48
          });
        }

        templates.push({
          id: 'tmpl_' + (i + 1),
          name: title,
          format: f.format,
          width: f.w,
          height: f.h,
          formatLabel: f.label,
          category: cats[cIdx],
          colors: p.colors,
          palette: p.name,
          emoji: emojis[i % emojis.length],
          canvas_data: {
            background: { type: 'gradient', colors: p.colors, angle: 135 },
            elements: elements
          }
        });
      }

      return templates;
    },

    /**
     * Get format info by key
     */
    getFormat: function(key) {
      return this.FORMATS[key] || null;
    },

    /**
     * Create a blank canvas_data for a given format
     */
    createBlank: function(formatKey) {
      var f = this.FORMATS[formatKey];
      if (!f) f = { w: 1080, h: 1080 };
      return {
        width: f.w,
        height: f.h,
        canvas_data: {
          background: { type: 'solid', color: '#ffffff' },
          elements: []
        }
      };
    },

    /**
     * Generate a unique element ID
     */
    genId: function() {
      return 'el_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    },

    /**
     * Create a text element with defaults
     */
    createTextElement: function(content, options) {
      var opts = options || {};
      return {
        id: this.genId(),
        type: 'text',
        content: content || 'YOUR TEXT HERE',
        x: opts.x || 50,
        y: opts.y || 50,
        width: opts.width || 400,
        height: opts.height || 80,
        opacity: opts.opacity != null ? opts.opacity : 1,
        zIndex: opts.zIndex || 1,
        style: {
          fontFamily: opts.fontFamily || 'DM Sans',
          fontSize: opts.fontSize || 48,
          fontWeight: opts.fontWeight || 700,
          color: opts.color || '#000000',
          textAlign: opts.textAlign || 'center',
          fontStyle: opts.fontStyle || 'normal',
          textDecoration: opts.textDecoration || 'none',
          textTransform: opts.textTransform || 'none'
        }
      };
    },

    /**
     * Create an image element
     */
    createImageElement: function(src, options) {
      var opts = options || {};
      return {
        id: this.genId(),
        type: 'image',
        src: src || '',
        x: opts.x || 50,
        y: opts.y || 50,
        width: opts.width || 300,
        height: opts.height || 300,
        opacity: opts.opacity != null ? opts.opacity : 1,
        zIndex: opts.zIndex || 1,
        filter: opts.filter || ''
      };
    },

    /**
     * Create a shape element
     */
    createShapeElement: function(shape, fill, options) {
      var opts = options || {};
      return {
        id: this.genId(),
        type: 'shape',
        shape: shape || 'rect',
        fill: fill || '#ffffff',
        x: opts.x || 50,
        y: opts.y || 50,
        width: opts.width || 200,
        height: opts.height || 200,
        opacity: opts.opacity != null ? opts.opacity : 1,
        zIndex: opts.zIndex || 1
      };
    },

    /**
     * Apply brand kit colors/fonts to a canvas_data
     */
    applyBrandKit: function(canvasData, brandKit) {
      if (!brandKit) return canvasData;
      var data = JSON.parse(JSON.stringify(canvasData));

      // Apply brand primary color to background if gradient
      if (brandKit.colors && brandKit.colors.length >= 2 && data.background && data.background.type === 'gradient') {
        data.background.colors = [brandKit.colors[0], brandKit.colors[1]];
      }

      // Apply brand font to text elements
      if (brandKit.primaryFont && data.elements) {
        data.elements.forEach(function(el) {
          if (el.type === 'text' && el.style) {
            el.style.fontFamily = brandKit.primaryFont;
          }
        });
      }

      return data;
    },

    /**
     * Calculate scale to fit canvas in a container
     */
    fitScale: function(canvasW, canvasH, containerW, containerH) {
      return Math.min(containerW / canvasW, containerH / canvasH, 1);
    },

    /**
     * Generate a WhatsApp share message for a design
     */
    generateShareMessage: function(designName, format) {
      var msg = '🎨 Check out my design: ' + (designName || 'Untitled') + '\n';
      if (format) msg += '📐 ' + format + '\n';
      msg += '\nMade with CreatorCanvas on AfroTools\nhttps://afrotools.com/tools/creator-canvas/';
      return encodeURIComponent(msg);
    },

    /**
     * Export-friendly canvas dimensions for social platforms
     */
    getExportInfo: function(formatKey) {
      var f = this.FORMATS[formatKey];
      if (!f) return null;
      var platforms = {
        'ig-post': { platform: 'Instagram', type: 'Feed Post', safeZone: '90% center' },
        'ig-story': { platform: 'Instagram', type: 'Story/Reel', safeZone: 'Top 15% & bottom 20% may be covered' },
        'ig-carousel': { platform: 'Instagram', type: 'Carousel Slide', safeZone: '90% center' },
        'yt-thumb': { platform: 'YouTube', type: 'Thumbnail', safeZone: 'Avoid bottom-right (timestamp overlay)' },
        'tiktok': { platform: 'TikTok', type: 'Cover/Story', safeZone: 'Center 60% for text' },
        'x-post': { platform: 'X (Twitter)', type: 'Post Image', safeZone: 'Full bleed' },
        'fb-cover': { platform: 'Facebook', type: 'Cover Photo', safeZone: 'Mobile crops sides heavily' },
        'wa-status': { platform: 'WhatsApp', type: 'Status', safeZone: 'Top 10% & bottom 15% covered on some phones' },
        'event-flyer': { platform: 'General', type: 'Event Flyer', safeZone: 'Full bleed, keep text 5% from edges' },
        'a4': { platform: 'Print', type: 'A4 Poster', safeZone: '10mm bleed zone on all edges' }
      };
      return Object.assign({}, f, platforms[formatKey] || {});
    }
  };

  // Register on global namespace
  if (!window.AfroTools) window.AfroTools = {};
  if (!window.AfroTools.engines) window.AfroTools.engines = {};
  window.AfroTools.engines.creatorCanvas = CreatorCanvas;
})();

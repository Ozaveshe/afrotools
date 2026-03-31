/**
 * CreatorPage Engine — Data layer for Link Page & Digital Storefront
 * Handles pages, blocks, products, themes, and analytics
 */
var CreatorPageEngine = (function () {
  'use strict';

  // ─── SUPABASE ───
  var _supabase = null;
  function getSupabase() {
    if (_supabase) return _supabase;
    if (window.AfroAuth && typeof AfroAuth.getSupabase === 'function') {
      _supabase = AfroAuth.getSupabase();
    } else if (window.supabase && window.supabase.createClient) {
      _supabase = window.supabase.createClient(
        'https://zpclagtgczsygrgztlts.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwY2xhZ3RnY3pzeWdyZ3p0bHRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NTg4MzIsImV4cCI6MjA4OTAzNDgzMn0._G-677vi2UTAhcU3t0aquvmd8lnQUBil53ok_Z623F0'
      );
    }
    return _supabase;
  }

  // ─── THEMES ───
  var THEMES = {
    clean:    { label: 'Clean',    desc: 'White, minimal, modern',          preview: '#ffffff' },
    dark:     { label: 'Dark',     desc: 'Dark background, premium feel',   preview: '#111827' },
    gradient: { label: 'Gradient', desc: 'Colorful gradient, vibrant',      preview: 'linear-gradient(135deg,#667eea,#764ba2)' },
    neon:     { label: 'Neon',     desc: 'Dark + neon outlines, tech vibe', preview: '#0a0a0a' },
    warm:     { label: 'Warm',     desc: 'Cream/beige, earthy, organic',    preview: '#FFF8F0' },
    bold:     { label: 'Bold',     desc: 'High contrast, large type',       preview: '#111111' },
    glass:    { label: 'Glass',    desc: 'Frosted blur, modern & sleek',    preview: 'linear-gradient(135deg,#1a1a2e,#16213e)' },
    photo:    { label: 'Photo',    desc: 'Background image, scenic',        preview: '#4a6741' }
  };

  // ─── BLOCK TYPES ───
  var BLOCK_TYPES = {
    link:        { label: 'Link Button',       icon: '🔗', desc: 'Add a link' },
    product:     { label: 'Digital Product',    icon: '🛍️', desc: 'Sell a download or service' },
    tip_jar:     { label: 'Tip Jar',            icon: '💝', desc: 'Accept tips & support' },
    email_signup:{ label: 'Email Signup',       icon: '📧', desc: 'Grow your newsletter' },
    booking:     { label: 'Booking',            icon: '📅', desc: 'Let people book you' },
    content:     { label: 'Content Showcase',   icon: '📸', desc: 'Show off your work' },
    testimonial: { label: 'Testimonial',        icon: '⭐', desc: 'Show social proof' },
    text:        { label: 'Text / Announcement',icon: '📝', desc: 'Custom heading & text' },
    spacer:      { label: 'Spacer / Divider',   icon: '➖', desc: 'Visual separator' }
  };

  // ─── FONT PAIRINGS ───
  var FONT_PAIRINGS = {
    'default':  { display: "'DM Sans', system-ui, sans-serif", body: "'DM Sans', system-ui, sans-serif" },
    'serif':    { display: "'Instrument Serif', Georgia, serif", body: "'DM Sans', system-ui, sans-serif" },
    'mono':     { display: "'JetBrains Mono', monospace", body: "'DM Sans', system-ui, sans-serif" },
    'display':  { display: "'Playfair Display', Georgia, serif", body: "'DM Sans', system-ui, sans-serif" }
  };

  // ─── BUTTON STYLES ───
  var BUTTON_STYLES = ['pill', 'rounded', 'square'];
  var BUTTON_FILLS = ['solid', 'outline', 'ghost'];

  // ─── PAYMENT METHODS ───
  var PAYMENT_METHODS = {
    bank_transfer: { label: 'Bank Transfer', icon: '🏦', desc: 'Direct bank deposit', countries: ['NG','GH','KE','ZA','TZ'] },
    mpesa:         { label: 'M-Pesa',        icon: '📱', desc: 'Mobile money',         countries: ['KE','TZ','UG','MZ'] },
    paystack:      { label: 'Paystack',       icon: '💳', desc: 'Card & bank payment',  countries: ['NG','GH','ZA','KE'] },
    flutterwave:   { label: 'Flutterwave',    icon: '⚡', desc: '30+ African currencies',countries: ['NG','GH','KE','ZA','TZ','UG','RW'] },
    paypal:        { label: 'PayPal',          icon: '🌍', desc: 'International buyers',  countries: ['ALL'] }
  };

  // ─── LOCAL STORAGE ───
  var LS_KEY = 'afro_creator_page';

  function getLocalPage() {
    try {
      var data = localStorage.getItem(LS_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return createDefaultPage();
  }

  function saveLocalPage(page) {
    try {
      page.updated_at = new Date().toISOString();
      localStorage.setItem(LS_KEY, JSON.stringify(page));
    } catch (e) {}
  }

  function createDefaultPage() {
    return {
      id: crypto.randomUUID(),
      username: '',
      display_name: 'Your Name',
      bio: 'Creator, dreamer, builder.',
      avatar_url: '',
      location: '',
      social_links: {},
      theme: 'clean',
      accent_color: '#F43F5E',
      font_pairing: 'default',
      button_style: 'pill',
      button_fill: 'solid',
      background_type: 'solid',
      background_value: '#ffffff',
      is_published: true,
      blocks: [
        {
          id: crypto.randomUUID(),
          block_type: 'link',
          content: { title: 'My YouTube Channel', url: 'https://youtube.com', icon: '▶️', featured: false },
          is_visible: true,
          sort_order: 0
        },
        {
          id: crypto.randomUUID(),
          block_type: 'link',
          content: { title: 'Book a Session', url: '#', icon: '📅', featured: true },
          is_visible: true,
          sort_order: 1
        },
        {
          id: crypto.randomUUID(),
          block_type: 'link',
          content: { title: 'WhatsApp Me', url: 'https://wa.me/', icon: '💬', featured: false, type: 'whatsapp' },
          is_visible: true,
          sort_order: 2
        }
      ],
      products: [],
      analytics: { views: 0, clicks: 0, sales: 0, revenue: 0 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // ─── BLOCK MANAGEMENT ───
  function addBlock(page, blockType, content) {
    var block = {
      id: crypto.randomUUID(),
      block_type: blockType,
      content: content || getDefaultBlockContent(blockType),
      is_visible: true,
      sort_order: page.blocks.length
    };
    page.blocks.push(block);
    saveLocalPage(page);
    return block;
  }

  function updateBlock(page, blockId, updates) {
    var block = page.blocks.find(function (b) { return b.id === blockId; });
    if (block) {
      Object.assign(block, updates);
      saveLocalPage(page);
    }
    return block;
  }

  function deleteBlock(page, blockId) {
    page.blocks = page.blocks.filter(function (b) { return b.id !== blockId; });
    page.blocks.forEach(function (b, i) { b.sort_order = i; });
    saveLocalPage(page);
  }

  function moveBlock(page, blockId, direction) {
    var idx = page.blocks.findIndex(function (b) { return b.id === blockId; });
    if (idx < 0) return;
    var newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= page.blocks.length) return;
    var temp = page.blocks[idx];
    page.blocks[idx] = page.blocks[newIdx];
    page.blocks[newIdx] = temp;
    page.blocks.forEach(function (b, i) { b.sort_order = i; });
    saveLocalPage(page);
  }

  function getDefaultBlockContent(type) {
    switch (type) {
      case 'link': return { title: 'New Link', url: '', icon: '🔗', featured: false };
      case 'product': return { name: 'My Product', description: '', price: 0, currency: 'NGN', image_url: '', product_type: 'download' };
      case 'tip_jar': return { title: 'Support My Work', amounts: [1000, 2000, 5000], currency: 'NGN' };
      case 'email_signup': return { title: 'Join My Newsletter', subtitle: 'Get updates directly in your inbox' };
      case 'booking': return { service: 'Consultation', description: '', price: 0, currency: 'NGN', duration: '1 hour' };
      case 'content': return { images: [], type: 'gallery' };
      case 'testimonial': return { quote: '"Amazing work!"', author: 'Happy Client' };
      case 'text': return { heading: 'Announcement', body: 'Something exciting is coming...', cta_text: '', cta_url: '' };
      case 'spacer': return { type: 'divider', height: 20 };
      default: return {};
    }
  }

  // ─── PRODUCT MANAGEMENT ───
  function addProduct(page, product) {
    product.id = product.id || crypto.randomUUID();
    product.is_active = true;
    product.sales_count = 0;
    product.revenue_total = 0;
    product.created_at = new Date().toISOString();
    page.products.push(product);
    saveLocalPage(page);
    return product;
  }

  function deleteProduct(page, productId) {
    page.products = page.products.filter(function (p) { return p.id !== productId; });
    saveLocalPage(page);
  }

  // ─── ANALYTICS HELPERS ───
  function trackEvent(pageId, eventType, details) {
    // Lightweight tracking — batch in localStorage, flush to server
    var key = LS_KEY + '_events';
    var events = [];
    try { events = JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) {}
    events.push({
      page_id: pageId,
      event_type: eventType,
      details: details || {},
      created_at: new Date().toISOString()
    });
    // Keep max 500 events locally
    if (events.length > 500) events = events.slice(-500);
    try { localStorage.setItem(key, JSON.stringify(events)); } catch (e) {}
  }

  function getLocalAnalytics(pageId) {
    var key = LS_KEY + '_events';
    try {
      var events = JSON.parse(localStorage.getItem(key) || '[]');
      return events.filter(function (e) { return e.page_id === pageId; });
    } catch (e) { return []; }
  }

  function getAnalyticsSummary(pageId) {
    var events = getLocalAnalytics(pageId);
    var views = events.filter(function (e) { return e.event_type === 'page_view'; }).length;
    var clicks = events.filter(function (e) { return e.event_type === 'link_click'; }).length;
    var productViews = events.filter(function (e) { return e.event_type === 'product_view'; }).length;
    var purchases = events.filter(function (e) { return e.event_type === 'product_purchase'; }).length;
    var signups = events.filter(function (e) { return e.event_type === 'email_signup'; }).length;

    // Click breakdown by block
    var clicksByBlock = {};
    events.forEach(function (e) {
      if (e.event_type === 'link_click' && e.details && e.details.title) {
        clicksByBlock[e.details.title] = (clicksByBlock[e.details.title] || 0) + 1;
      }
    });

    return {
      views: views,
      clicks: clicks,
      productViews: productViews,
      purchases: purchases,
      signups: signups,
      clicksByBlock: clicksByBlock,
      ctr: views > 0 ? Math.round((clicks / views) * 100) : 0
    };
  }

  // ─── URL DETECTION ───
  function detectLinkType(url) {
    if (!url) return 'link';
    if (url.match(/youtube\.com|youtu\.be/i)) return 'youtube';
    if (url.match(/spotify\.com|music\.apple\.com/i)) return 'music';
    if (url.match(/wa\.me|whatsapp\.com/i)) return 'whatsapp';
    if (url.match(/instagram\.com/i)) return 'instagram';
    if (url.match(/tiktok\.com/i)) return 'tiktok';
    return 'link';
  }

  // ─── CURRENCY FORMATTING ───
  var CURRENCIES = {
    NGN: { symbol: '₦', name: 'Nigerian Naira' },
    KES: { symbol: 'KSh', name: 'Kenyan Shilling' },
    ZAR: { symbol: 'R', name: 'South African Rand' },
    GHS: { symbol: 'GH₵', name: 'Ghanaian Cedi' },
    TZS: { symbol: 'TSh', name: 'Tanzanian Shilling' },
    UGX: { symbol: 'USh', name: 'Ugandan Shilling' },
    XOF: { symbol: 'CFA', name: 'CFA Franc' },
    EGP: { symbol: 'E£', name: 'Egyptian Pound' },
    USD: { symbol: '$', name: 'US Dollar' }
  };

  function formatPrice(amount, currency) {
    currency = currency || 'NGN';
    var info = CURRENCIES[currency] || { symbol: currency + ' ' };
    return info.symbol + Number(amount).toLocaleString();
  }

  // ─── NETLIFY FUNCTIONS ───
  var BASE_URL = '/.netlify/functions/creator-page';

  async function savePage(page) {
    try {
      var res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save-page', page: page })
      });
      return res.ok ? await res.json() : null;
    } catch (e) { return null; }
  }

  async function fetchPage(identifier) {
    try {
      var res = await fetch(BASE_URL + '?action=get-page&id=' + encodeURIComponent(identifier));
      return res.ok ? await res.json() : null;
    } catch (e) { return null; }
  }

  // ─── PUBLIC API ───
  return {
    THEMES: THEMES,
    BLOCK_TYPES: BLOCK_TYPES,
    FONT_PAIRINGS: FONT_PAIRINGS,
    BUTTON_STYLES: BUTTON_STYLES,
    BUTTON_FILLS: BUTTON_FILLS,
    PAYMENT_METHODS: PAYMENT_METHODS,
    CURRENCIES: CURRENCIES,

    getLocalPage: getLocalPage,
    saveLocalPage: saveLocalPage,
    createDefaultPage: createDefaultPage,

    addBlock: addBlock,
    updateBlock: updateBlock,
    deleteBlock: deleteBlock,
    moveBlock: moveBlock,
    getDefaultBlockContent: getDefaultBlockContent,

    addProduct: addProduct,
    deleteProduct: deleteProduct,

    trackEvent: trackEvent,
    getLocalAnalytics: getLocalAnalytics,
    getAnalyticsSummary: getAnalyticsSummary,

    detectLinkType: detectLinkType,
    formatPrice: formatPrice,

    savePage: savePage,
    fetchPage: fetchPage
  };
})();

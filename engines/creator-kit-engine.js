/**
 * CreatorKit Engine — Media Kit & Rate Card Builder
 * Template data, section management, formatting utilities
 */
!function(){"use strict";

var TEMPLATES = {
  bold: { id: 'bold', name: 'Bold', icon: '🔥', desc: 'Large hero, minimal text, high-impact', colors: { bg: '#0A0A0A', accent: '#F5A623', text: '#fff' }, fonts: { heading: 'Instrument Serif', body: 'DM Sans' }, niche: ['photography','videography','visual-art'] },
  editorial: { id: 'editorial', name: 'Editorial', icon: '📰', desc: 'Magazine layout, text-rich, multi-column', colors: { bg: '#FAFAF8', accent: '#1a1a1a', text: '#111' }, fonts: { heading: 'Instrument Serif', body: 'DM Sans' }, niche: ['writing','journalism','blogging'] },
  vibrant: { id: 'vibrant', name: 'Vibrant', icon: '🎨', desc: 'Colorful, playful, pattern backgrounds', colors: { bg: '#FFF5E6', accent: '#FF6B35', text: '#1a1a1a' }, fonts: { heading: 'DM Sans', body: 'DM Sans' }, niche: ['design','illustration','fashion'] },
  music: { id: 'music', name: 'Music', icon: '🎵', desc: 'Dark theme, waveform accents, streaming stats', colors: { bg: '#0d0d0d', accent: '#1DB954', text: '#fff' }, fonts: { heading: 'DM Sans', body: 'DM Sans' }, niche: ['music','audio','voice-over'] },
  professional: { id: 'professional', name: 'Professional', icon: '💼', desc: 'Clean corporate, charts and metrics', colors: { bg: '#F8FAFC', accent: '#2563EB', text: '#1e293b' }, fonts: { heading: 'DM Sans', body: 'DM Sans' }, niche: ['consulting','speaking','development'] },
  minimalist: { id: 'minimalist', name: 'Minimalist', icon: '✨', desc: 'White space, single accent, elegant', colors: { bg: '#fff', accent: '#111', text: '#111' }, fonts: { heading: 'Instrument Serif', body: 'DM Sans' }, niche: ['all'] }
};

var FONT_PAIRINGS = {
  'default': { heading: 'Instrument Serif', body: 'DM Sans' },
  'modern': { heading: 'Inter', body: 'Space Grotesk' },
  'elegant': { heading: 'Playfair Display', body: 'Lato' },
  'bold': { heading: 'Montserrat', body: 'Open Sans' }
};

var SECTION_TYPES = [
  { id: 'hero', label: 'Hero / Cover', icon: '🎯', required: true },
  { id: 'about', label: 'About / Bio', icon: '📝', required: false },
  { id: 'portfolio', label: 'Portfolio', icon: '🖼️', required: false },
  { id: 'stats', label: 'Audience Stats', icon: '📊', required: false },
  { id: 'services', label: 'Services & Rates', icon: '💰', required: false },
  { id: 'clients', label: 'Past Clients', icon: '🏢', required: false },
  { id: 'testimonials', label: 'Testimonials', icon: '💬', required: false },
  { id: 'contact', label: 'Contact / CTA', icon: '📧', required: false },
  { id: 'custom', label: 'Custom Block', icon: '✏️', required: false }
];

var CURRENCIES = {
  NGN: { symbol: '₦', name: 'Nigerian Naira', locale: 'en-NG' },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling', locale: 'en-KE' },
  ZAR: { symbol: 'R', name: 'South African Rand', locale: 'en-ZA' },
  GHS: { symbol: 'GH₵', name: 'Ghanaian Cedi', locale: 'en-GH' },
  USD: { symbol: '$', name: 'US Dollar', locale: 'en-US' },
  GBP: { symbol: '£', name: 'British Pound', locale: 'en-GB' },
  EUR: { symbol: '€', name: 'Euro', locale: 'en-IE' },
  EGP: { symbol: 'E£', name: 'Egyptian Pound', locale: 'en-EG' },
  TZS: { symbol: 'TSh', name: 'Tanzanian Shilling', locale: 'en-TZ' },
  UGX: { symbol: 'USh', name: 'Ugandan Shilling', locale: 'en-UG' },
  RWF: { symbol: 'RF', name: 'Rwandan Franc', locale: 'en-RW' },
  XOF: { symbol: 'CFA', name: 'West African CFA', locale: 'fr-SN' },
  XAF: { symbol: 'FCFA', name: 'Central African CFA', locale: 'fr-CM' },
  MAD: { symbol: 'MAD', name: 'Moroccan Dirham', locale: 'fr-MA' }
};

function formatRate(amount, currencyCode) {
  var c = CURRENCIES[currencyCode] || CURRENCIES.NGN;
  var num = typeof amount === 'string' ? parseInt(amount.replace(/[^0-9]/g,''), 10) : amount;
  if (isNaN(num)) return amount;
  return c.symbol + num.toLocaleString();
}

function formatNumber(val) {
  var n = typeof val === 'string' ? parseInt(val.replace(/[^0-9]/g,''), 10) : val;
  if (isNaN(n)) return val;
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'K';
  return n.toString();
}

function suggestTemplate(craft) {
  if (!craft) return TEMPLATES.bold;
  var lower = craft.toLowerCase();
  for (var key in TEMPLATES) {
    var tpl = TEMPLATES[key];
    if (tpl.niche.some(function(n) { return lower.indexOf(n) !== -1; })) return tpl;
  }
  return TEMPLATES.minimalist;
}

function getDefaultSectionOrder() {
  return ['hero','about','portfolio','stats','services','clients','testimonials','contact'];
}

function createEmptyKit() {
  return {
    template: 'bold',
    name: '', tagline: '', heroImage: null,
    socials: { instagram: '', twitter: '', tiktok: '', youtube: '' },
    bioTone: 'professional', bioShort: '', bioMedium: '', bioLong: '',
    portfolioLayout: 'grid-2', portfolioImages: [],
    stats: {}, statsInsight: '',
    showPrices: true, currency: 'NGN',
    services: [], packages: [
      { name: 'Starter', price: '', includes: '' },
      { name: 'Standard', price: '', includes: '' },
      { name: 'Premium', price: '', includes: '' }
    ],
    clients: '',
    testimonials: [{ quote: '', name: '' }],
    contactEmail: '', contactPhone: '', contactWhatsapp: '', bookingUrl: '',
    ctaText: "Let's Work Together",
    accentColor: '#F5A623', fontPairing: 'default',
    hiddenSections: [],
    sectionOrder: getDefaultSectionOrder()
  };
}

function generateWhatsAppText(kit) {
  var text = '*' + (kit.name || 'Rate Card') + '*\n';
  if (kit.tagline) text += kit.tagline + '\n';
  if (kit.services && kit.services.length) {
    text += '\n*Services:*\n';
    kit.services.forEach(function(s) {
      text += '• ' + s.name;
      if (kit.showPrices && s.price) text += ' — ' + formatRate(s.price, kit.currency);
      text += '\n';
    });
  }
  if (kit.packages && kit.packages.some(function(p) { return p.name && p.price; })) {
    text += '\n*Packages:*\n';
    kit.packages.forEach(function(p) {
      if (!p.name || !p.price) return;
      text += '\n📦 *' + p.name + '* — ' + formatRate(p.price, kit.currency) + '\n';
      if (p.includes) {
        p.includes.split('\n').filter(Boolean).forEach(function(item) {
          text += '  ✓ ' + item.trim() + '\n';
        });
      }
    });
  }
  if (kit.contactEmail) text += '\n📩 ' + kit.contactEmail;
  if (kit.contactWhatsapp) text += '\n💬 ' + kit.contactWhatsapp;
  return text;
}

window.AfroTools = window.AfroTools || {};
window.AfroTools.CreatorKitEngine = {
  TEMPLATES: TEMPLATES,
  FONT_PAIRINGS: FONT_PAIRINGS,
  SECTION_TYPES: SECTION_TYPES,
  CURRENCIES: CURRENCIES,
  formatRate: formatRate,
  formatNumber: formatNumber,
  suggestTemplate: suggestTemplate,
  getDefaultSectionOrder: getDefaultSectionOrder,
  createEmptyKit: createEmptyKit,
  generateWhatsAppText: generateWhatsAppText
};

}();

(() => {
  'use strict';

  const STORAGE_KEY = 'afro_flyer_studio_state_v2';
  const BRAND_KEY = 'afro_flyer_brand_v1';
  const HISTORY_KEY = 'afro_flyer_history_v1';

  const SIZES = {
    instagram: { label: 'Instagram portrait', width: 1080, height: 1350 },
    square: { label: 'Square post', width: 1080, height: 1080 },
    story: { label: 'Story or status', width: 1080, height: 1920 },
    a4: { label: 'A4 print', width: 2480, height: 3508 },
    letter: { label: 'Letter print', width: 2550, height: 3300 }
  };

  const PALETTES = {
    midnight: { label: 'Midnight', primary: '#0f172a', secondary: '#2563eb', accent: '#facc15', textColor: '#ffffff' },
    lagoon: { label: 'Lagoon', primary: '#063f46', secondary: '#0891b2', accent: '#facc15', textColor: '#ffffff' },
    crimson: { label: 'Crimson', primary: '#3b0a16', secondary: '#be123c', accent: '#fda4af', textColor: '#ffffff' },
    paper: { label: 'Clean paper', primary: '#f8fafc', secondary: '#e2e8f0', accent: '#2563eb', textColor: '#111827' },
    forest: { label: 'Forest', primary: '#052e16', secondary: '#15803d', accent: '#fbbf24', textColor: '#ffffff' },
    violet: { label: 'Violet', primary: '#2e1065', secondary: '#7c3aed', accent: '#f0abfc', textColor: '#ffffff' }
  };

  const TEMPLATES = {
    church: ['Church service', 'Worship, vigil, thanksgiving', 'church', 'City Chapel', 'NIGHT OF WORSHIP', 'Prayer, worship, healing', 'Friday, 9PM till dawn', 'City Chapel, Ibadan', 'Guest ministers, choir sessions, and prayer rooms open all night.', 'Invite someone', 'WhatsApp: +234 801 234 5678', 'Free entry', 'Come early for seats', 'bold-center', 'midnight'],
    music: ['Afrobeats night', 'Concert, DJ, party', 'music', 'Rooftop Arena', 'AFROBEATS NIGHT', 'DJs, live acts, food, cocktails', 'Friday, 8PM', 'Rooftop Arena, Nairobi', 'Live DJ sets, guest artists, food vendors, and VIP tables.', 'Book your ticket', 'Tickets via WhatsApp', 'VIP tables available', 'Dress vibrant', 'photo-top', 'violet'],
    market: ['Market sale', 'Promo, shop, launch', 'sale', 'Aba Market Hub', 'MARKET DAY SALE', 'Fresh stock, new prices', 'This Saturday, 7AM', 'Open Market, Aba', 'Bulk deals, new arrivals, fabric, shoes, and household supplies.', 'Shop early', 'Call to reserve', 'Up to 35% off', 'Early buyers get first pick', 'ticket-strip', 'forest'],
    business: ['Business clinic', 'Workshop, launch, webinar', 'business', 'AfroTools Lab', 'SMALL BUSINESS CLINIC', 'Pricing, tax, and growth', 'Thursday, 10AM', 'Online and in-person', 'Practical sessions for invoices, payroll, marketing, and bookkeeping.', 'Reserve a seat', 'afrotools.com', 'Free registration', 'Seats are limited', 'split-billboard', 'lagoon'],
    food: ['Food pop-up', 'Restaurant, menu, kitchen', 'food', "Mama's Kitchen", 'JOLLOF WEEKEND', 'Smoky rice, grills, small chops', 'Saturday and Sunday', 'Lekki Food Court', 'Family packs, takeaway boxes, suya sides, and chilled drinks.', 'Pre-order now', 'DM or WhatsApp to order', 'From NGN 4,500', 'Limited slots', 'split-billboard', 'crimson'],
    school: ['Campus week', 'School, class, club', 'school', 'Student Union', 'CAMPUS WEEK', 'Games, music, awards', 'Monday to Friday, 4PM', 'Main Bowl', 'Debates, sports, talent show, tech booth, and community night.', 'Join the week', 'Ask your class rep', 'Student access', 'Bring your ID', 'schedule-card', 'lagoon'],
    wedding: ['Wedding invite', 'Family celebration', 'wedding', 'The Families', 'WEDDING CELEBRATION', 'Together with their families', 'Saturday, 11AM', 'Civic Centre, Accra', 'Ceremony, reception, photos, dinner, and dance.', 'RSVP', 'RSVP by WhatsApp', 'Invitation only', 'Traditional colors welcome', 'minimal-print', 'paper'],
    fundraiser: ['Fundraiser', 'Community, charity, cause', 'event', 'Community Circle', 'COMMUNITY FUNDRAISER', 'Support the school roof project', 'Sunday, 2PM', 'Town Hall', 'Food, music, pledges, donor recognition, and project updates.', 'Donate or attend', 'Call the committee desk', 'Open donation', 'Every contribution counts', 'schedule-card', 'forest']
  };

  const TEMPLATE_KEYS = ['label', 'detail', 'type', 'organizer', 'headline', 'subline', 'dateTime', 'venue', 'details', 'cta', 'contact', 'price', 'note', 'layout', 'palette'];
  const templateObject = (id) => TEMPLATE_KEYS.reduce((out, key, index) => ({ ...out, [key]: TEMPLATES[id][index] }), {});
  const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
  const $ = (id) => document.getElementById(id);

  const initialTemplate = templateObject('church');
  const initialPalette = PALETTES[initialTemplate.palette];
  const DEFAULT_STATE = {
    template: 'church',
    type: initialTemplate.type,
    organizer: initialTemplate.organizer,
    headline: initialTemplate.headline,
    subline: initialTemplate.subline,
    dateTime: initialTemplate.dateTime,
    venue: initialTemplate.venue,
    details: initialTemplate.details,
    cta: initialTemplate.cta,
    contact: initialTemplate.contact,
    price: initialTemplate.price,
    note: initialTemplate.note,
    size: 'instagram',
    layout: initialTemplate.layout,
    font: 'impact',
    palette: initialTemplate.palette,
    primary: initialPalette.primary,
    secondary: initialPalette.secondary,
    accent: initialPalette.accent,
    textColor: initialPalette.textColor,
    textScale: 100,
    bgZoom: 100,
    bgShift: 0,
    showGuides: true,
    exportFormat: 'image/png',
    quality: 0.9,
    filenameSuffix: 'event-flyer',
    backgroundName: '',
    backgroundSrc: '',
    logoName: '',
    logoSrc: '',
    qrName: '',
    qrSrc: ''
  };

  let state = { ...DEFAULT_STATE };
  let els = {};
  let backgroundImage = null;
  let logoImage = null;
  let qrImage = null;
  let ideas = [];
  let history = [];
  let saveTimer = null;

  function readJson(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function setStatus(message) {
    if (els.status) els.status.textContent = message;
  }

  function slugify(value) {
    return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'flyer';
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  function hexToRgb(hex) {
    let value = String(hex || '').replace('#', '').trim();
    if (value.length === 3) value = value.split('').map((part) => part + part).join('');
    const number = parseInt(value, 16);
    return Number.isFinite(number) ? { r: (number >> 16) & 255, g: (number >> 8) & 255, b: number & 255 } : { r: 17, g: 24, b: 39 };
  }

  function rgba(hex, alpha) {
    const rgb = hexToRgb(hex);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }

  function luminance(hex) {
    const rgb = hexToRgb(hex);
    const channels = [rgb.r, rgb.g, rgb.b].map((channel) => {
      const value = channel / 255;
      return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    });
    return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
  }

  function contrastRatio(a, b) {
    return (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
  }

  function detectTemplate(text) {
    const lower = clean(text).toLowerCase();
    if (/church|worship|prayer|vigil|thanksgiving|service/.test(lower)) return 'church';
    if (/wedding|bride|groom|marriage|engagement/.test(lower)) return 'wedding';
    if (/food|restaurant|jollof|kitchen|menu|suya|grill/.test(lower)) return 'food';
    if (/sale|discount|market|promo|shop|offer/.test(lower)) return 'market';
    if (/school|campus|class|student|lesson|training/.test(lower)) return 'school';
    if (/music|party|concert|dj|show|club|afrobeats/.test(lower)) return 'music';
    if (/fundraiser|donation|charity|community|cause/.test(lower)) return 'fundraiser';
    return 'business';
  }

  function inferHeadline(prompt, templateId) {
    let value = clean(prompt)
      .replace(/^(please\s+)?(create|make|design|build|generate)\s+(an?\s+)?/i, '')
      .replace(/\b(flyer|poster|flier|graphic|design)\b/gi, ' ');
    value = value.split(/\b(?:for|on|at|with|featuring|where|venue:|location:|date:)\b/i)[0];
    value = clean(value).replace(/[.!?]+$/g, '');
    if (!value || value.length < 4) value = templateObject(templateId).headline;
    if (value.length > 58) value = value.slice(0, 58).replace(/\s+\S*$/, '');
    return clean(value).toUpperCase();
  }

  function extractDateTime(prompt, fallback) {
    const text = clean(prompt);
    const day = text.match(/\b(?:mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow|this\s+\w+|next\s+\w+)\b[^.;\n]*/i);
    const date = text.match(/\b(?:\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2})(?:[^.;\n]{0,50})?/i);
    const time = text.match(/\b\d{1,2}(?::\d{2})?\s?(?:am|pm)\b/i);
    const match = day || date;
    if (match) return clean(match[0].split(/\s+\bat\b|\s+\bvenue\b|\s+\blocation\b/i)[0].replace(/[,\s]+$/, '')) || fallback;
    return time ? clean(time[0]) : fallback;
  }

  function extractVenue(prompt, fallback) {
    const text = clean(prompt);
    const explicit = text.match(/\b(?:venue|location)\s*:\s*([^.;\n]{3,90})/i);
    const atVenue = text.match(/\bat\s+([^.;\n]{3,90})/i);
    const raw = explicit ? explicit[1] : (atVenue ? atVenue[1] : '');
    const value = raw.replace(/\b(?:free entry|free|tickets?|entry|whatsapp|call|dm|rsvp|make it|premium|warm|easy to read)\b.*$/i, '').replace(/[,\s]+$/g, '');
    return clean(value) || fallback;
  }

  function extractContact(prompt, fallback) {
    const phone = clean(prompt).match(/(\+?\d[\d\s().-]{7,}\d)/);
    if (phone) return `WhatsApp: ${clean(phone[1])}`;
    const email = clean(prompt).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    if (email) return email[0];
    const url = clean(prompt).match(/\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.[a-z]{2,}(?:\/\S*)?/i);
    return url ? url[0] : fallback;
  }

  function extractPrice(prompt, fallback) {
    const text = clean(prompt);
    const free = text.match(/\bfree(?:\s+entry|\s+registration|\s+access)?\b/i);
    if (free) return clean(free[0]).replace(/\bfree\b/i, 'Free');
    const price = text.match(/\b(?:NGN|KES|GHS|ZAR|TZS|UGX|RWF|XOF|XAF|EGP|USD|\$|N|KSh|GHC|R)\s?[\d,.]+(?:\s?(?:off|only|per head|per person))?/i);
    return price ? clean(price[0]) : fallback;
  }

  function inferSubline(prompt, fallback) {
    const parts = clean(prompt).split(/[.!?]/).map(clean).filter(Boolean);
    const useful = parts.find((part) => (
      !/^(create|make|design|build|generate)\b/i.test(part) &&
      !/\+?\d[\d\s().-]{7,}\d/.test(part) &&
      !/\b(?:whatsapp|call|dm|rsvp|free entry|free registration|make it)\b/i.test(part) &&
      part.length > 10
    ));
    return useful ? useful.slice(0, 74) : fallback;
  }

  function inferDetails(prompt, fallback) {
    const lower = clean(prompt).toLowerCase();
    const parts = [];
    if (/premium|elegant|luxury/.test(lower)) parts.push('Premium visual style');
    if (/whatsapp|status/.test(lower)) parts.push('Optimized for WhatsApp sharing');
    if (/print|poster|a4/.test(lower)) parts.push('Ready for print and social versions');
    if (/church|worship|prayer/.test(lower)) parts.push('Clear worship time, venue, and invite line');
    return parts.length ? parts.join('. ') : fallback;
  }

  function headlineIdeas(headline, type) {
    const base = clean(headline || 'Your event').toUpperCase();
    const noun = type === 'sale' ? 'OFFER' : type === 'food' ? 'MENU' : type === 'church' ? 'SERVICE' : 'EVENT';
    return [base, `${base} THIS WEEK`, `DO NOT MISS ${base}`, `${base} - RSVP NOW`, `YOUR ${noun} STARTS HERE`].map((item) => item.slice(0, 64));
  }

  function parsePrompt(prompt) {
    const templateId = detectTemplate(prompt);
    const template = templateObject(templateId);
    const headline = inferHeadline(prompt, templateId);
    return {
      template: templateId,
      type: template.type,
      organizer: template.organizer,
      headline,
      subline: inferSubline(prompt, template.subline),
      dateTime: extractDateTime(prompt, template.dateTime),
      venue: extractVenue(prompt, template.venue),
      details: inferDetails(prompt, template.details),
      cta: template.cta,
      contact: extractContact(prompt, template.contact),
      price: extractPrice(prompt, template.price),
      note: /whatsapp|status/i.test(prompt) ? 'Built for WhatsApp sharing' : template.note,
      layout: template.layout,
      palette: template.palette,
      filenameSuffix: slugify(headline)
    };
  }

  function applyDraft(draft, message) {
    const templateId = draft.template && TEMPLATES[draft.template] ? draft.template : detectTemplate(draft.headline || draft.type || '');
    const paletteId = draft.palette && PALETTES[draft.palette] ? draft.palette : (templateObject(templateId).palette || state.palette);
    const palette = PALETTES[paletteId] || PALETTES.lagoon;
    state = {
      ...state,
      ...draft,
      template: templateId,
      type: draft.type || templateObject(templateId).type,
      palette: paletteId,
      primary: draft.primary || palette.primary,
      secondary: draft.secondary || palette.secondary,
      accent: draft.accent || palette.accent,
      textColor: draft.textColor || palette.textColor,
      filenameSuffix: draft.filenameSuffix || slugify(draft.headline || state.headline)
    };
    ideas = headlineIdeas(state.headline, state.type);
    syncForm();
    renderIdeas();
    render();
    saveSoon();
    setStatus(message);
  }

  function generateLocal() {
    const prompt = clean(els.prompt?.value);
    if (!prompt) {
      ideas = headlineIdeas(state.headline, state.type);
      renderIdeas();
      setStatus('Add a prompt or pick a template');
      return;
    }
    applyDraft(parsePrompt(prompt), 'Local draft generated');
  }

  function parseAiJson(reply) {
    const text = String(reply || '').trim();
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced ? fenced[1] : (text.match(/\{[\s\S]*\}/)?.[0] || text);
    try {
      const parsed = JSON.parse(candidate);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  async function generateWithAi() {
    const prompt = clean(els.prompt?.value);
    if (!prompt) {
      setStatus('Add a prompt first');
      return;
    }
    if (!els.aiConsent?.checked) {
      setStatus('Tick consent before AI assist');
      return;
    }

    setStatus('Asking AI assist');
    try {
      const response = await fetch('/.netlify/functions/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-AfroTools-AI-Consent': 'accepted' },
        body: JSON.stringify({
          tool: 'site-assistant',
          aiConsent: 'accepted',
          context: 'AI Flyer & Poster Studio prompt-to-flyer draft',
          system: [
            'You are AfroTools AI Flyer Studio. Return only compact JSON.',
            'Keys: type, template, organizer, headline, subline, dateTime, venue, details, cta, contact, price, note, layout, palette.',
            `Allowed templates: ${Object.keys(TEMPLATES).join(', ')}.`,
            `Allowed palettes: ${Object.keys(PALETTES).join(', ')}.`,
            'Use practical African event wording. Keep headline under 7 words.'
          ].join('\n'),
          message: prompt
        })
      });
      if (!response.ok) throw new Error(`AI request failed (${response.status})`);
      const body = await response.json();
      const draft = parseAiJson(body.reply || body.text || body.message || '');
      if (!draft) throw new Error('AI reply was not structured');
      applyDraft(draft, 'AI draft applied');
    } catch (error) {
      applyDraft(parsePrompt(prompt), 'AI unavailable, local draft used');
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function drawCover(ctx, image, x, y, w, h, zoom = 1, shift = 0) {
    if (!image || !image.naturalWidth || !image.naturalHeight) return false;
    const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight) * zoom;
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    ctx.drawImage(image, x + ((w - width) / 2) + shift, y + ((h - height) / 2), width, height);
    return true;
  }

  function wrap(ctx, text, width, maxLines = 3) {
    const words = clean(text).split(' ').filter(Boolean);
    const lines = [];
    let line = '';
    words.forEach((word) => {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width <= width || !line) {
        line = next;
      } else {
        lines.push(line);
        line = word;
      }
    });
    if (line) lines.push(line);
    if (lines.length <= maxLines) return lines;
    const trimmed = lines.slice(0, maxLines);
    let last = trimmed[trimmed.length - 1];
    while (ctx.measureText(`${last}...`).width > width && last.length > 5) last = last.slice(0, -1);
    trimmed[trimmed.length - 1] = `${last.trim()}...`;
    return trimmed;
  }

  function headlineFont() {
    if (state.font === 'serif') return '"Instrument Serif", Georgia, serif';
    if (state.font === 'mono') return '"Courier New", monospace';
    if (state.font === 'dm') return '"DM Sans", Arial, sans-serif';
    return 'Impact, "Arial Black", "DM Sans", sans-serif';
  }

  function badge(ctx, text, x, y, scale) {
    const value = clean(text);
    if (!value) return 0;
    const font = Math.max(22, 28 * scale);
    ctx.save();
    ctx.font = `900 ${font}px "DM Sans", Arial, sans-serif`;
    const w = Math.min(ctx.canvas.width - x - (60 * scale), ctx.measureText(value).width + (font * 1.25));
    const h = font * 1.72;
    roundRect(ctx, x, y, w, h, h * 0.35);
    ctx.fillStyle = state.accent;
    ctx.fill();
    ctx.fillStyle = contrastRatio(state.accent, '#111827') > 4.5 ? '#111827' : '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(value, x + (font * 0.55), y + (h / 2) + 1, w - font);
    ctx.restore();
    return h;
  }

  function headline(ctx, text, x, y, width, options = {}) {
    const size = options.size || 70;
    ctx.save();
    ctx.font = `900 ${size}px ${options.font || headlineFont()}`;
    ctx.textAlign = options.align || 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = options.shadow === false ? 0 : Math.max(8, size * 0.14);
    ctx.shadowOffsetY = options.shadow === false ? 0 : Math.max(3, size * 0.05);
    const lines = wrap(ctx, text, width, options.maxLines || 3);
    lines.forEach((line, index) => {
      const yPos = y + (index * size * 0.94);
      if (options.stroke !== false) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.76)';
        ctx.lineWidth = Math.max(3, size * 0.07);
        ctx.strokeText(line, x, yPos);
      }
      ctx.fillStyle = options.color || state.textColor;
      ctx.fillText(line, x, yPos);
    });
    ctx.restore();
  }

  function infoPill(ctx, text, x, y, width, scale, light = false) {
    const value = clean(text);
    if (!value) return 0;
    const font = Math.max(22, 28 * scale);
    const h = font * 1.82;
    ctx.save();
    ctx.font = `850 ${font}px "DM Sans", Arial, sans-serif`;
    const w = Math.min(width, ctx.measureText(value).width + (font * 1.25));
    roundRect(ctx, x, y, w, h, h * 0.25);
    ctx.fillStyle = light ? 'rgba(255, 255, 255, 0.93)' : 'rgba(0, 0, 0, 0.44)';
    ctx.fill();
    ctx.fillStyle = light ? '#111827' : '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(value, x + (font * 0.55), y + (h / 2) + 1, w - font);
    ctx.restore();
    return h;
  }

  function drawBackground(ctx, w, h) {
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, state.primary);
    gradient.addColorStop(1, state.secondary);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    if (backgroundImage) {
      drawCover(ctx, backgroundImage, 0, 0, w, h, Number(state.bgZoom) / 100, (Number(state.bgShift) / 100) * w * 0.25);
      ctx.fillStyle = rgba(state.primary, 0.52);
      ctx.fillRect(0, 0, w, h);
    }
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = state.accent;
    ctx.lineWidth = Math.max(2, w * 0.004);
    const gap = Math.max(64, w * 0.11);
    for (let x = -h; x < w + h; x += gap) {
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x + h, 0);
      ctx.stroke();
    }
    ctx.restore();
    if (state.layout === 'minimal-print') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = state.primary;
      ctx.fillRect(0, 0, w, h * 0.16);
      ctx.fillStyle = state.accent;
      ctx.fillRect(0, h * 0.16, w, Math.max(12, Math.min(w, h) * 0.012));
    }
  }

  function drawLogo(ctx, margin, scale) {
    const size = Math.max(78, Math.min(ctx.canvas.width, ctx.canvas.height) * 0.085);
    ctx.save();
    roundRect(ctx, margin, margin, size, size, size * 0.22);
    ctx.clip();
    if (logoImage) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(margin, margin, size, size);
      drawCover(ctx, logoImage, margin, margin, size, size);
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(margin, margin, size, size);
      ctx.fillStyle = state.accent;
      ctx.font = `900 ${Math.max(26, 32 * scale)}px "DM Sans", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const initials = clean(state.organizer).split(/\s+/).slice(0, 2).map((word) => word[0]?.toUpperCase()).join('') || 'AT';
      ctx.fillText(initials, margin + (size / 2), margin + (size / 2) + 1);
    }
    ctx.restore();
  }

  function drawQr(ctx, w, h, margin) {
    const size = Math.max(86, Math.min(w, h) * 0.09);
    const x = w - margin - size;
    const y = h - margin - size;
    ctx.save();
    roundRect(ctx, x, y, size, size, size * 0.12);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.clip();
    if (qrImage) {
      drawCover(ctx, qrImage, x, y, size, size);
    } else {
      ctx.fillStyle = '#111827';
      const inset = size * 0.08;
      const cell = (size - (2 * inset)) / 5;
      for (let row = 0; row < 5; row += 1) {
        for (let col = 0; col < 5; col += 1) {
          if ((row + col) % 2 === 0 || row === 0 || col === 4) ctx.fillRect(x + inset + (col * cell), y + inset + (row * cell), cell * 0.72, cell * 0.72);
        }
      }
    }
    ctx.restore();
  }

  function drawLayout(ctx, w, h, margin, scale, headSize) {
    const content = w - (2 * margin);
    const light = state.layout === 'minimal-print';
    if (state.layout === 'photo-top') {
      ctx.save();
      roundRect(ctx, margin, margin * 1.6, content, h * 0.38, Math.min(w, h) * 0.025);
      ctx.clip();
      if (!drawCover(ctx, backgroundImage, margin, margin * 1.6, content, h * 0.38, Number(state.bgZoom) / 100)) {
        const fill = ctx.createLinearGradient(margin, margin, w - margin, h * 0.45);
        fill.addColorStop(0, rgba(state.accent, 0.9));
        fill.addColorStop(1, 'rgba(255, 255, 255, 0.18)');
        ctx.fillStyle = fill;
        ctx.fillRect(margin, margin * 1.6, content, h * 0.38);
      }
      ctx.restore();
      badge(ctx, state.price || state.type.toUpperCase(), margin, h * 0.51, scale);
      headline(ctx, state.headline, margin, h * 0.63, content, { size: headSize });
      return;
    }
    if (state.layout === 'split-billboard') {
      ctx.save();
      roundRect(ctx, w * 0.51, margin * 1.4, w * 0.42, h - (margin * 2.6), Math.min(w, h) * 0.025);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
      ctx.fill();
      if (backgroundImage) {
        ctx.clip();
        drawCover(ctx, backgroundImage, w * 0.51, margin * 1.4, w * 0.42, h - (margin * 2.6), Number(state.bgZoom) / 100);
      }
      ctx.restore();
      badge(ctx, state.price || state.cta, margin, h * 0.25, scale);
      headline(ctx, state.headline, margin, h * 0.38, w * 0.45, { size: headSize * 0.92, maxLines: 4 });
      return;
    }
    if (state.layout === 'ticket-strip') {
      ctx.save();
      roundRect(ctx, margin, h * 0.67, content, h * 0.22, Math.min(w, h) * 0.025);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fill();
      ctx.fillStyle = state.accent;
      ctx.fillRect(margin, h * 0.67, content, Math.max(10, Math.min(w, h) * 0.012));
      ctx.restore();
      headline(ctx, state.headline, w / 2, h * 0.36, content, { size: headSize, align: 'center' });
      badge(ctx, state.price || 'SPECIAL', margin * 1.35, h * 0.72, scale);
      return;
    }
    if (state.layout === 'schedule-card') {
      ctx.save();
      roundRect(ctx, margin, h * 0.18, content, h * 0.66, Math.min(w, h) * 0.028);
      ctx.fillStyle = contrastRatio(state.primary, '#ffffff') > 3 ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.92)';
      ctx.fill();
      ctx.restore();
      badge(ctx, state.type.toUpperCase(), margin * 1.35, h * 0.23, scale);
      headline(ctx, state.headline, margin * 1.35, h * 0.38, w - (margin * 2.7), { size: headSize * 0.78, color: state.textColor, shadow: false, stroke: false });
      return;
    }
    if (light) {
      headline(ctx, state.headline, margin, h * 0.34, content, { size: headSize * 0.82, color: '#111827', shadow: false, stroke: false });
      return;
    }
    badge(ctx, state.price || state.type.toUpperCase(), margin, h * 0.26, scale);
    headline(ctx, state.headline, w / 2, h * 0.43, content, { size: headSize, align: 'center' });
  }

  function drawInfo(ctx, w, h, margin, scale) {
    const light = state.layout === 'minimal-print';
    const maxWidth = w - (2 * margin) - Math.max(0, w * 0.12);
    let y = light ? h * 0.57 : h * 0.72;
    [state.subline, state.dateTime, state.venue, `${state.cta || 'RSVP'}${state.contact ? ` - ${state.contact}` : ''}`].forEach((line) => {
      y += infoPill(ctx, line, margin, y, maxWidth, scale, light) + (12 * scale);
    });
    const body = clean([state.details, state.note].filter(Boolean).join(' | '));
    if (body) {
      ctx.save();
      const font = Math.max(22, 28 * scale);
      ctx.font = `800 ${font}px "DM Sans", Arial, sans-serif`;
      ctx.fillStyle = light ? '#334155' : 'rgba(255, 255, 255, 0.92)';
      wrap(ctx, body, w - (2 * margin), 2).forEach((line, index, lines) => {
        ctx.fillText(line, margin, h - (margin * 0.65) - ((lines.length - index - 1) * font * 1.3));
      });
      ctx.restore();
    }
  }

  function drawGuides(ctx, w, h, margin, scale) {
    if (!state.showGuides) return;
    ctx.save();
    ctx.setLineDash([18 * scale, 12 * scale]);
    ctx.strokeStyle = state.layout === 'minimal-print' ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255, 255, 255, 0.78)';
    ctx.lineWidth = Math.max(2, 3 * scale);
    ctx.strokeRect(margin, margin, w - (2 * margin), h - (2 * margin));
    ctx.setLineDash([]);
    ctx.fillStyle = state.layout === 'minimal-print' ? 'rgba(15, 23, 42, 0.58)' : 'rgba(255, 255, 255, 0.82)';
    ctx.font = `850 ${Math.max(18, 21 * scale)}px "DM Sans", Arial, sans-serif`;
    ctx.fillText('safe area', margin + (12 * scale), margin + (28 * scale));
    ctx.restore();
  }

  function drawPoster(canvas, options = {}) {
    const size = SIZES[state.size] || SIZES.instagram;
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const min = Math.min(w, h);
    const scale = min / 1080;
    const margin = Math.max(58 * scale, min * 0.055);
    const headSize = Math.max(58 * scale, Math.min(160 * scale, min * 0.105 * (Number(state.textScale) / 100)));
    drawBackground(ctx, w, h);
    drawLogo(ctx, margin, scale);
    drawQr(ctx, w, h, margin);
    drawLayout(ctx, w, h, margin, scale, headSize);
    drawInfo(ctx, w, h, margin, scale);
    if (options.guides !== false) drawGuides(ctx, w, h, margin, scale);
  }

  function score() {
    const words = clean(state.headline).split(/\s+/).filter(Boolean).length;
    const ratio = contrastRatio(state.primary, state.textColor);
    let total = 0;
    if (words > 0 && words <= 7) total += 22;
    if (ratio >= 4.5 || backgroundImage) total += 18;
    if (clean(state.dateTime)) total += 15;
    if (clean(state.venue)) total += 15;
    if (clean(state.cta || state.contact)) total += 15;
    if (backgroundImage || logoImage || qrImage || clean(state.organizer)) total += 10;
    if (state.showGuides) total += 5;
    return { words, ratio, total };
  }

  function renderChecklist() {
    if (!els.checklist) return;
    const current = score();
    const size = SIZES[state.size] || SIZES.instagram;
    const items = [
      [current.words > 0 && current.words <= 7, current.words <= 7 ? 'Headline is short enough for mobile previews.' : 'Shorten the headline to 7 words or fewer.'],
      [current.ratio >= 4.5 || backgroundImage, current.ratio >= 4.5 ? 'Base text contrast is strong.' : 'Check contrast after background and color choices.'],
      [!!clean(state.dateTime), clean(state.dateTime) ? 'Date and time are visible.' : 'Add a clear date and time.'],
      [!!clean(state.venue), clean(state.venue) ? 'Venue or location is visible.' : 'Add the venue or location.'],
      [!!clean(state.cta || state.contact), clean(state.cta || state.contact) ? 'CTA or contact line is present.' : 'Add a response action or contact.'],
      [size.width >= 1080, `Current canvas is ${size.width} x ${size.height} px.`],
      [state.showGuides, state.showGuides ? 'Safe guides are visible while editing.' : 'Turn on safe guides before final export.']
    ];
    els.checklist.innerHTML = items.map(([ok, text]) => `<li class="${ok ? '' : 'warn'}"><i>${ok ? 'OK' : '!'}</i><span>${escapeHtml(text)}</span></li>`).join('');
  }

  function renderHistory() {
    if (!els.history) return;
    els.history.innerHTML = history.length
      ? history.slice(0, 6).map((item) => `<div class="flyer-history-item"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.size)} - ${escapeHtml(item.format)} - ${escapeHtml(item.time)}</span></div>`).join('')
      : '<p class="flyer-empty">Downloaded flyers in this browser will appear here.</p>';
  }

  function render() {
    if (!els.canvas) return;
    drawPoster(els.canvas);
    const size = SIZES[state.size] || SIZES.instagram;
    const current = score();
    if (els.previewTitle) els.previewTitle.textContent = size.label;
    if (els.sizeMetric) els.sizeMetric.textContent = `${size.width} x ${size.height}`;
    if (els.readabilityMetric) els.readabilityMetric.textContent = current.ratio >= 4.5 || backgroundImage ? 'Strong' : 'Review';
    if (els.readyMetric) els.readyMetric.textContent = `${current.total}/100`;
    renderChecklist();
    renderHistory();
  }

  function syncForm() {
    const map = {
      type: els.type,
      organizer: els.organizer,
      headline: els.headline,
      subline: els.subline,
      dateTime: els.dateTime,
      venue: els.venue,
      details: els.details,
      cta: els.cta,
      contact: els.contact,
      price: els.price,
      note: els.note,
      size: els.size,
      layout: els.layout,
      font: els.font,
      primary: els.primary,
      secondary: els.secondary,
      accent: els.accent,
      textColor: els.textColor,
      textScale: els.textScale,
      bgZoom: els.bgZoom,
      bgShift: els.bgShift,
      exportFormat: els.format,
      quality: els.quality,
      filenameSuffix: els.suffix
    };
    Object.keys(map).forEach((key) => {
      if (map[key]) map[key].value = state[key] ?? '';
    });
    if (els.guides) els.guides.checked = !!state.showGuides;
    if (els.textScaleValue) els.textScaleValue.textContent = `${state.textScale}%`;
    if (els.bgZoomValue) els.bgZoomValue.textContent = `${state.bgZoom}%`;
    if (els.bgShiftValue) els.bgShiftValue.textContent = `${state.bgShift}%`;
    if (els.qualityValue) els.qualityValue.textContent = `${Math.round(Number(state.quality) * 100)}%`;
    if (els.backgroundName) els.backgroundName.textContent = state.backgroundName || 'Choose image';
    if (els.logoName) els.logoName.textContent = state.logoName || 'Choose logo';
    if (els.qrName) els.qrName.textContent = state.qrName || 'Choose QR';
    document.querySelectorAll('[data-flyer-template]').forEach((button) => button.classList.toggle('is-active', button.getAttribute('data-flyer-template') === state.template));
    document.querySelectorAll('[data-flyer-palette]').forEach((button) => button.classList.toggle('is-active', button.getAttribute('data-flyer-palette') === state.palette));
  }

  function saveSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        setStatus('Saved locally');
      } catch (error) {
        setStatus('Preview updated');
      }
    }, 180);
  }

  function updateState(key, value) {
    if (key === 'showGuides') state[key] = !!value;
    else if (['textScale', 'bgZoom', 'bgShift', 'quality'].includes(key)) state[key] = Number(value);
    else state[key] = value;
    if (['primary', 'secondary', 'accent', 'textColor'].includes(key)) state.palette = 'custom';
    syncForm();
    render();
    saveSoon();
  }

  function renderIdeas() {
    if (!els.hookList) return;
    els.hookList.innerHTML = ideas.map((idea) => `<button type="button" class="flyer-hook-btn" data-flyer-hook="${encodeURIComponent(idea)}">${escapeHtml(idea)}</button>`).join('');
  }

  function renderChoices() {
    if (els.templateGrid) {
      els.templateGrid.innerHTML = Object.keys(TEMPLATES).map((id) => {
        const item = templateObject(id);
        return `<button type="button" class="flyer-choice" data-flyer-template="${id}"><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.detail)}</span></button>`;
      }).join('');
    }
    if (els.paletteGrid) {
      els.paletteGrid.innerHTML = Object.keys(PALETTES).map((id) => {
        const item = PALETTES[id];
        return `<button type="button" class="flyer-palette" data-flyer-palette="${id}"><span class="flyer-swatches"><i style="background:${item.primary}"></i><i style="background:${item.secondary}"></i><i style="background:${item.accent}"></i></span>${escapeHtml(item.label)}</button>`;
      }).join('');
    }
  }

  function applyTemplate(id) {
    if (!TEMPLATES[id]) return;
    const template = templateObject(id);
    const palette = PALETTES[template.palette] || PALETTES.lagoon;
    state = {
      ...state,
      template: id,
      type: template.type,
      organizer: template.organizer,
      headline: template.headline,
      subline: template.subline,
      dateTime: template.dateTime,
      venue: template.venue,
      details: template.details,
      cta: template.cta,
      contact: template.contact,
      price: template.price,
      note: template.note,
      layout: template.layout,
      palette: template.palette,
      primary: palette.primary,
      secondary: palette.secondary,
      accent: palette.accent,
      textColor: palette.textColor,
      filenameSuffix: slugify(template.headline)
    };
    ideas = headlineIdeas(state.headline, state.type);
    syncForm();
    renderIdeas();
    render();
    saveSoon();
    setStatus(`${template.label} template loaded`);
  }

  function applyPalette(id) {
    const palette = PALETTES[id];
    if (!palette) return;
    state = { ...state, palette: id, primary: palette.primary, secondary: palette.secondary, accent: palette.accent, textColor: palette.textColor };
    syncForm();
    render();
    saveSoon();
    setStatus(`${palette.label} palette applied`);
  }

  function exportExtension() {
    if (state.exportFormat === 'image/jpeg') return 'jpg';
    if (state.exportFormat === 'image/webp') return 'webp';
    return 'png';
  }

  function toBlob(canvas) {
    return new Promise((resolve) => canvas.toBlob(resolve, state.exportFormat, Number(state.quality)));
  }

  async function downloadFlyer(title = state.headline, prefix = 'flyer') {
    const canvas = document.createElement('canvas');
    drawPoster(canvas, { guides: false });
    const blob = await toBlob(canvas);
    if (!blob) {
      setStatus('Export failed');
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${prefix}-${state.size}-${slugify(title || state.filenameSuffix)}.${exportExtension()}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
    const size = SIZES[state.size] || SIZES.instagram;
    const now = new Date();
    history.unshift({ title: clean(title).slice(0, 72), size: `${size.width} x ${size.height}`, format: exportExtension().toUpperCase(), time: now.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) });
    history = history.slice(0, 8);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (error) {}
    renderHistory();
    setStatus('Flyer downloaded');
  }

  async function exportVariants() {
    const original = state.size;
    for (const size of ['instagram', 'square', 'story']) {
      state.size = size;
      syncForm();
      render();
      await downloadFlyer(state.headline, `flyer-${size}`);
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    state.size = original;
    syncForm();
    render();
    saveSoon();
    setStatus('Variants exported');
  }

  function copyText(text, message) {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => setStatus(message)).catch(() => fallbackCopy(text, message));
    } else {
      fallbackCopy(text, message);
    }
  }

  function fallbackCopy(text, message) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      setStatus(message);
    } catch (error) {
      setStatus('Copy failed');
    }
    textarea.remove();
  }

  function captionText() {
    return [state.headline, state.subline, state.dateTime, state.venue, state.price, `${state.cta || 'RSVP'}${state.contact ? `: ${state.contact}` : ''}`].filter(Boolean).join('\n');
  }

  function printBrief() {
    const size = SIZES[state.size] || SIZES.instagram;
    return [
      'Flyer handoff brief',
      `Headline: ${state.headline}`,
      `Organizer: ${state.organizer}`,
      `Date/time: ${state.dateTime}`,
      `Venue: ${state.venue}`,
      `CTA: ${state.cta}`,
      `Contact: ${state.contact}`,
      `Canvas: ${size.label} (${size.width} x ${size.height})`,
      `Layout: ${state.layout}`,
      `Colors: ${state.primary}, ${state.secondary}, ${state.accent}, ${state.textColor}`,
      `Export: ${exportExtension().toUpperCase()} at ${Math.round(Number(state.quality) * 100)}% quality`
    ].join('\n');
  }

  function designLink() {
    const portable = { ...state, backgroundSrc: '', logoSrc: '', qrSrc: '', backgroundName: '', logoName: '', qrName: '' };
    const encoded = btoa(JSON.stringify(portable)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    return `${window.location.origin}${window.location.pathname}#design=${encodeURIComponent(encoded)}`;
  }

  function saveBrand() {
    const brand = {
      organizer: state.organizer,
      palette: state.palette,
      primary: state.primary,
      secondary: state.secondary,
      accent: state.accent,
      textColor: state.textColor,
      logoName: state.logoName,
      logoSrc: state.logoSrc && state.logoSrc.length < 700000 ? state.logoSrc : '',
      contact: state.contact
    };
    try {
      localStorage.setItem(BRAND_KEY, JSON.stringify(brand));
      setStatus('Brand kit saved');
    } catch (error) {
      setStatus('Brand kit too large');
    }
  }

  async function loadBrand() {
    const brand = readJson(localStorage.getItem(BRAND_KEY), null);
    if (!brand) {
      setStatus('No saved brand kit yet');
      return;
    }
    state = { ...state, ...brand };
    if (brand.logoSrc) await loadImage(brand.logoSrc, 'logo', brand.logoName || 'Saved logo');
    syncForm();
    render();
    saveSoon();
    setStatus('Brand kit loaded');
  }

  function resetStudio() {
    state = { ...DEFAULT_STATE };
    backgroundImage = null;
    logoImage = null;
    qrImage = null;
    ideas = headlineIdeas(state.headline, state.type);
    syncForm();
    renderIdeas();
    render();
    saveSoon();
    setStatus('Reset complete');
  }

  function loadFile(file, slot) {
    if (!file || !/^image\//.test(file.type)) {
      setStatus('Choose an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => loadImage(String(reader.result || ''), slot, file.name);
    reader.onerror = () => setStatus('Image could not load');
    reader.readAsDataURL(file);
  }

  function loadImage(src, slot, name) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        if (slot === 'background') {
          backgroundImage = image;
          state.backgroundName = name || 'Background image';
          state.backgroundSrc = src.length < 1700000 ? src : '';
        } else if (slot === 'logo') {
          logoImage = image;
          state.logoName = name || 'Logo';
          state.logoSrc = src.length < 700000 ? src : '';
        } else {
          qrImage = image;
          state.qrName = name || 'QR image';
          state.qrSrc = src.length < 700000 ? src : '';
        }
        syncForm();
        render();
        saveSoon();
        setStatus(`${slot.charAt(0).toUpperCase()}${slot.slice(1)} loaded`);
        resolve();
      };
      image.onerror = () => {
        setStatus('Image could not load');
        resolve();
      };
      image.src = src;
    });
  }

  function parseHashState() {
    const match = String(window.location.hash || '').match(/design=([^&]+)/);
    if (!match) return null;
    try {
      let encoded = decodeURIComponent(match[1]).replace(/-/g, '+').replace(/_/g, '/');
      while (encoded.length % 4) encoded += '=';
      return JSON.parse(atob(encoded));
    } catch (error) {
      return null;
    }
  }

  function collectElements() {
    els = {
      status: $('flyerStatus'),
      prompt: $('flyerPrompt'),
      generateLocal: $('flyerGenerateLocal'),
      generateAi: $('flyerGenerateAi'),
      aiConsent: $('flyerAiConsent'),
      hookList: $('flyerHookList'),
      templateGrid: $('flyerTemplateGrid'),
      paletteGrid: $('flyerPaletteGrid'),
      type: $('flyerType'),
      organizer: $('flyerOrganizer'),
      headline: $('flyerHeadline'),
      subline: $('flyerSubline'),
      dateTime: $('flyerDateTime'),
      venue: $('flyerVenue'),
      details: $('flyerDetails'),
      cta: $('flyerCta'),
      contact: $('flyerContact'),
      price: $('flyerPrice'),
      note: $('flyerNote'),
      size: $('flyerSize'),
      layout: $('flyerLayout'),
      font: $('flyerFont'),
      primary: $('flyerPrimary'),
      secondary: $('flyerSecondary'),
      accent: $('flyerAccent'),
      textColor: $('flyerTextColor'),
      backgroundInput: $('flyerBackgroundInput'),
      backgroundName: $('flyerBackgroundName'),
      logoInput: $('flyerLogoInput'),
      logoName: $('flyerLogoName'),
      qrInput: $('flyerQrInput'),
      qrName: $('flyerQrName'),
      textScale: $('flyerTextScale'),
      textScaleValue: $('flyerTextScaleValue'),
      bgZoom: $('flyerBgZoom'),
      bgZoomValue: $('flyerBgZoomValue'),
      bgShift: $('flyerBgShift'),
      bgShiftValue: $('flyerBgShiftValue'),
      guides: $('flyerGuides'),
      canvas: $('flyerCanvas'),
      previewTitle: $('flyerPreviewTitle'),
      sizeMetric: $('flyerSizeMetric'),
      readabilityMetric: $('flyerReadabilityMetric'),
      readyMetric: $('flyerReadyMetric'),
      format: $('flyerFormat'),
      quality: $('flyerQuality'),
      qualityValue: $('flyerQualityValue'),
      suffix: $('flyerSuffix'),
      download: $('flyerDownload'),
      exportVariants: $('flyerExportVariants'),
      copyCaption: $('flyerCopyCaption'),
      copyBrief: $('flyerCopyBrief'),
      copyLink: $('flyerCopyLink'),
      saveBrand: $('flyerSaveBrand'),
      loadBrand: $('flyerLoadBrand'),
      reset: $('flyerReset'),
      checklist: $('flyerChecklist'),
      history: $('flyerHistory')
    };
  }

  function bindEvents() {
    document.addEventListener('click', (event) => {
      const templateButton = event.target.closest('[data-flyer-template]');
      if (templateButton) {
        applyTemplate(templateButton.getAttribute('data-flyer-template'));
        return;
      }
      const paletteButton = event.target.closest('[data-flyer-palette]');
      if (paletteButton) {
        applyPalette(paletteButton.getAttribute('data-flyer-palette'));
        return;
      }
      const hookButton = event.target.closest('[data-flyer-hook]');
      if (hookButton) updateState('headline', decodeURIComponent(hookButton.getAttribute('data-flyer-hook') || ''));
    });
    document.querySelectorAll('[data-flyer-field]').forEach((field) => {
      const eventName = field.type === 'checkbox' ? 'change' : 'input';
      field.addEventListener(eventName, () => updateState(field.getAttribute('data-flyer-field'), field.type === 'checkbox' ? field.checked : field.value));
      if (field.tagName === 'SELECT') field.addEventListener('change', () => updateState(field.getAttribute('data-flyer-field'), field.value));
    });
    els.generateLocal?.addEventListener('click', generateLocal);
    els.generateAi?.addEventListener('click', generateWithAi);
    els.backgroundInput?.addEventListener('change', () => loadFile(els.backgroundInput.files?.[0], 'background'));
    els.logoInput?.addEventListener('change', () => loadFile(els.logoInput.files?.[0], 'logo'));
    els.qrInput?.addEventListener('change', () => loadFile(els.qrInput.files?.[0], 'qr'));
    els.download?.addEventListener('click', () => downloadFlyer(state.headline, 'flyer'));
    els.exportVariants?.addEventListener('click', exportVariants);
    els.copyCaption?.addEventListener('click', () => copyText(captionText(), 'Caption copied'));
    els.copyBrief?.addEventListener('click', () => copyText(printBrief(), 'Print brief copied'));
    els.copyLink?.addEventListener('click', () => copyText(designLink(), 'Design link copied'));
    els.saveBrand?.addEventListener('click', saveBrand);
    els.loadBrand?.addEventListener('click', loadBrand);
    els.reset?.addEventListener('click', resetStudio);
  }

  async function hydrateImages() {
    if (state.backgroundSrc) await loadImage(state.backgroundSrc, 'background', state.backgroundName);
    if (state.logoSrc) await loadImage(state.logoSrc, 'logo', state.logoName);
    if (state.qrSrc) await loadImage(state.qrSrc, 'qr', state.qrName);
  }

  async function init() {
    collectElements();
    if (!els.canvas) return;
    const saved = readJson(localStorage.getItem(STORAGE_KEY), null);
    const linked = parseHashState();
    state = { ...DEFAULT_STATE, ...(saved || {}), ...(linked || {}) };
    if (!SIZES[state.size]) state.size = 'instagram';
    if (!PALETTES[state.palette] && state.palette !== 'custom') state.palette = 'midnight';
    history = readJson(localStorage.getItem(HISTORY_KEY), []);
    ideas = headlineIdeas(state.headline, state.type);
    renderChoices();
    syncForm();
    renderIdeas();
    bindEvents();
    await hydrateImages();
    render();
    setStatus('Ready');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.flyerStudio = {
    render,
    parsePrompt,
    getState: () => ({ ...state }),
    getSizes: () => ({ ...SIZES }),
    getTemplates: () => Object.keys(TEMPLATES).reduce((out, id) => ({ ...out, [id]: templateObject(id) }), {})
  };
})();

/**
 * CreatorSplit Engine — Royalty & Collaboration Splitter for African Creatives
 * IIFE module: split management, member/earning/payout CRUD, localStorage offline-first
 */
var CreatorSplitEngine = (function () {
  'use strict';

  // ── SUPABASE ──
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

  // ── CONSTANTS ──
  var COLLAB_COLORS = [
    '#6366F1', '#F43F5E', '#10B981', '#F59E0B', '#0EA5E9',
    '#8B5CF6', '#EC4899', '#14B8A6', '#EF4444', '#22C55E'
  ];

  var PROJECT_TYPES = [
    { id: 'music', label: 'Music', icon: '🎵', desc: 'Track, EP, or Album' },
    { id: 'video', label: 'Video / Film', icon: '🎬', desc: 'Video or film project' },
    { id: 'photography', label: 'Photography', icon: '📷', desc: 'Photography project' },
    { id: 'design', label: 'Design', icon: '🎨', desc: 'Design or creative project' },
    { id: 'content', label: 'Content', icon: '📱', desc: 'Content collaboration' },
    { id: 'live_event', label: 'Live Event', icon: '🎤', desc: 'Live event or show' },
    { id: 'other', label: 'Other', icon: '📋', desc: 'Other collaboration' }
  ];

  var ROLES_BY_TYPE = {
    music: ['Artist', 'Producer', 'Songwriter', 'Mix Engineer', 'Master Engineer', 'Featured Artist', 'Manager', 'Label', 'Beat Maker', 'Vocalist'],
    video: ['Director', 'Videographer', 'Editor', 'Colorist', 'Sound Designer', 'Talent', 'Producer', 'Writer'],
    photography: ['Photographer', 'Model', 'Stylist', 'MUA', 'Retoucher', 'Art Director'],
    design: ['Designer', 'Illustrator', 'Copywriter', 'Art Director', 'Client'],
    content: ['Creator', 'Editor', 'Manager', 'Collaborator', 'Brand'],
    live_event: ['Performer', 'Promoter', 'Venue', 'Sound Engineer', 'Manager', 'DJ'],
    other: ['Collaborator', 'Manager', 'Contributor']
  };

  var EARNING_SOURCES = [
    { id: 'streaming', label: 'Streaming', icon: '🎧' },
    { id: 'sync', label: 'Sync / Licensing', icon: '📺' },
    { id: 'live', label: 'Live Performance', icon: '🎤' },
    { id: 'merch', label: 'Merchandise', icon: '👕' },
    { id: 'licensing', label: 'Licensing', icon: '📄' },
    { id: 'other', label: 'Other', icon: '💰' }
  ];

  var PAYOUT_METHODS = [
    { id: 'bank_transfer', label: 'Bank Transfer' },
    { id: 'mpesa', label: 'M-Pesa' },
    { id: 'cash', label: 'Cash' },
    { id: 'paystack', label: 'Paystack' },
    { id: 'other', label: 'Other' }
  ];

  var CURRENCIES = {
    NGN: { symbol: '\u20A6', name: 'Nigerian Naira' },
    KES: { symbol: 'KES ', name: 'Kenyan Shilling' },
    ZAR: { symbol: 'R', name: 'South African Rand' },
    GHS: { symbol: 'GH\u20B5', name: 'Ghanaian Cedi' },
    TZS: { symbol: 'TZS ', name: 'Tanzanian Shilling' },
    EGP: { symbol: 'EGP ', name: 'Egyptian Pound' },
    UGX: { symbol: 'UGX ', name: 'Ugandan Shilling' },
    XOF: { symbol: 'CFA ', name: 'CFA Franc (West)' },
    XAF: { symbol: 'CFA ', name: 'CFA Franc (Central)' },
    MAD: { symbol: 'MAD ', name: 'Moroccan Dirham' },
    USD: { symbol: '$', name: 'US Dollar' }
  };

  // AI-suggested default splits by project type and role
  var DEFAULT_SPLITS = {
    music: {
      'Artist': 40, 'Producer': 25, 'Songwriter': 15, 'Mix Engineer': 8,
      'Master Engineer': 5, 'Featured Artist': 15, 'Manager': 10, 'Label': 20,
      'Beat Maker': 25, 'Vocalist': 30
    },
    video: {
      'Director': 30, 'Videographer': 20, 'Editor': 15, 'Colorist': 8,
      'Sound Designer': 8, 'Talent': 20, 'Producer': 20, 'Writer': 12
    },
    photography: {
      'Photographer': 60, 'Model': 20, 'Stylist': 8, 'MUA': 7,
      'Retoucher': 10, 'Art Director': 15
    },
    design: {
      'Designer': 50, 'Illustrator': 35, 'Copywriter': 20, 'Art Director': 25, 'Client': 0
    },
    content: {
      'Creator': 45, 'Editor': 20, 'Manager': 15, 'Collaborator': 30, 'Brand': 0
    },
    live_event: {
      'Performer': 40, 'Promoter': 25, 'Venue': 15, 'Sound Engineer': 8, 'Manager': 12, 'DJ': 30
    },
    other: {
      'Collaborator': 50, 'Manager': 15, 'Contributor': 35
    }
  };

  // ── LOCAL STORAGE ──
  var SPLITS_KEY = 'cs_splits';
  var MEMBERS_KEY = 'cs_members';
  var EARNINGS_KEY = 'cs_earnings';
  var PAYOUTS_KEY = 'cs_payouts';

  function getLocalData(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function setLocalData(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
  }

  // ── SPLIT MANAGEMENT ──
  function createSplit(data) {
    var split = {
      id: data.id || generateId(),
      name: data.name || 'Untitled Split',
      project_type: data.project_type || 'other',
      description: data.description || '',
      work_url: data.work_url || '',
      status: data.status || 'draft',
      share_token: generateToken(),
      total_earnings: 0,
      currency: data.currency || 'NGN',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    var all = getLocalData(SPLITS_KEY);
    all.push(split);
    setLocalData(SPLITS_KEY, all);
    return split;
  }

  function updateSplit(id, updates) {
    var all = getLocalData(SPLITS_KEY);
    var idx = all.findIndex(function (s) { return s.id === id; });
    if (idx >= 0) {
      Object.assign(all[idx], updates);
      all[idx].updated_at = new Date().toISOString();
      setLocalData(SPLITS_KEY, all);
      return all[idx];
    }
    return null;
  }

  function deleteSplit(id) {
    setLocalData(SPLITS_KEY, getLocalData(SPLITS_KEY).filter(function (s) { return s.id !== id; }));
    setLocalData(MEMBERS_KEY, getLocalData(MEMBERS_KEY).filter(function (m) { return m.split_id !== id; }));
    setLocalData(EARNINGS_KEY, getLocalData(EARNINGS_KEY).filter(function (e) { return e.split_id !== id; }));
    setLocalData(PAYOUTS_KEY, getLocalData(PAYOUTS_KEY).filter(function (p) { return p.split_id !== id; }));
  }

  function getSplit(id) {
    return getLocalData(SPLITS_KEY).find(function (s) { return s.id === id; }) || null;
  }

  function getSplits(filters) {
    var all = getLocalData(SPLITS_KEY);
    if (!filters) return all.sort(function (a, b) { return b.updated_at.localeCompare(a.updated_at); });
    return all.filter(function (s) {
      if (filters.status && s.status !== filters.status) return false;
      return true;
    }).sort(function (a, b) { return b.updated_at.localeCompare(a.updated_at); });
  }

  // ── MEMBER MANAGEMENT ──
  function addMember(data) {
    var member = {
      id: data.id || generateId(),
      split_id: data.split_id,
      name: data.name || '',
      role: data.role || 'Collaborator',
      percentage: data.percentage || 0,
      contact_whatsapp: data.contact_whatsapp || '',
      contact_email: data.contact_email || '',
      has_acknowledged: data.has_acknowledged || false,
      acknowledged_at: null,
      color: data.color || COLLAB_COLORS[getMembers(data.split_id).length % COLLAB_COLORS.length],
      is_self: data.is_self || false,
      created_at: new Date().toISOString()
    };
    var all = getLocalData(MEMBERS_KEY);
    all.push(member);
    setLocalData(MEMBERS_KEY, all);
    return member;
  }

  function updateMember(id, updates) {
    var all = getLocalData(MEMBERS_KEY);
    var idx = all.findIndex(function (m) { return m.id === id; });
    if (idx >= 0) {
      Object.assign(all[idx], updates);
      setLocalData(MEMBERS_KEY, all);
      return all[idx];
    }
    return null;
  }

  function removeMember(id) {
    setLocalData(MEMBERS_KEY, getLocalData(MEMBERS_KEY).filter(function (m) { return m.id !== id; }));
  }

  function getMembers(splitId) {
    return getLocalData(MEMBERS_KEY).filter(function (m) { return m.split_id === splitId; });
  }

  // ── EARNINGS ──
  function addEarning(data) {
    var earning = {
      id: data.id || generateId(),
      split_id: data.split_id,
      amount: data.amount || 0,
      currency: data.currency || 'NGN',
      source: data.source || 'other',
      description: data.description || '',
      earning_date: data.earning_date || new Date().toISOString().slice(0, 10),
      created_at: new Date().toISOString()
    };
    var all = getLocalData(EARNINGS_KEY);
    all.push(earning);
    setLocalData(EARNINGS_KEY, all);

    // Update total_earnings on split
    var split = getSplit(data.split_id);
    if (split) {
      var total = getEarnings(data.split_id).reduce(function (sum, e) { return sum + e.amount; }, 0);
      updateSplit(data.split_id, { total_earnings: total });
    }
    return earning;
  }

  function getEarnings(splitId) {
    return getLocalData(EARNINGS_KEY).filter(function (e) { return e.split_id === splitId; })
      .sort(function (a, b) { return b.earning_date.localeCompare(a.earning_date); });
  }

  function getTotalEarnings(splitId) {
    return getEarnings(splitId).reduce(function (sum, e) { return sum + e.amount; }, 0);
  }

  // ── PAYOUTS ──
  function addPayout(data) {
    var payout = {
      id: data.id || generateId(),
      split_id: data.split_id,
      member_id: data.member_id,
      amount: data.amount || 0,
      currency: data.currency || 'NGN',
      method: data.method || 'bank_transfer',
      payout_date: data.payout_date || new Date().toISOString().slice(0, 10),
      notes: data.notes || '',
      created_at: new Date().toISOString()
    };
    var all = getLocalData(PAYOUTS_KEY);
    all.push(payout);
    setLocalData(PAYOUTS_KEY, all);
    return payout;
  }

  function getPayouts(splitId) {
    return getLocalData(PAYOUTS_KEY).filter(function (p) { return p.split_id === splitId; })
      .sort(function (a, b) { return b.payout_date.localeCompare(a.payout_date); });
  }

  function getMemberPayouts(memberId) {
    return getLocalData(PAYOUTS_KEY).filter(function (p) { return p.member_id === memberId; });
  }

  // ── CALCULATIONS ──
  function calculateMemberEarnings(splitId) {
    var members = getMembers(splitId);
    var totalEarned = getTotalEarnings(splitId);
    var result = [];

    members.forEach(function (m) {
      var owed = Math.round(totalEarned * (m.percentage / 100));
      var paid = getMemberPayouts(m.id).reduce(function (sum, p) { return sum + p.amount; }, 0);
      result.push({
        member: m,
        owed: owed,
        paid: paid,
        balance: owed - paid
      });
    });
    return result;
  }

  function projectEarnings(splitId, hypotheticalAmount) {
    var members = getMembers(splitId);
    return members.map(function (m) {
      return {
        member: m,
        amount: Math.round(hypotheticalAmount * (m.percentage / 100))
      };
    });
  }

  function suggestSplits(projectType, roles) {
    var defaults = DEFAULT_SPLITS[projectType] || DEFAULT_SPLITS.other;
    var totalDefault = 0;
    var suggestions = [];

    roles.forEach(function (role) {
      var pct = defaults[role] || 20;
      suggestions.push({ role: role, percentage: pct });
      totalDefault += pct;
    });

    // Normalize to 100%
    if (totalDefault !== 100 && totalDefault > 0) {
      var factor = 100 / totalDefault;
      var running = 0;
      suggestions.forEach(function (s, i) {
        if (i === suggestions.length - 1) {
          s.percentage = 100 - running;
        } else {
          s.percentage = Math.round(s.percentage * factor);
          running += s.percentage;
        }
      });
    }
    return suggestions;
  }

  // ── AGREEMENT TEXT ──
  function generateAgreement(splitId) {
    var split = getSplit(splitId);
    if (!split) return '';
    var members = getMembers(splitId);
    var today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    var text = 'COLLABORATION SPLIT AGREEMENT\n';
    text += '═══════════════════════════════\n\n';
    text += 'Project: ' + split.name + '\n';
    text += 'Type: ' + (PROJECT_TYPES.find(function (t) { return t.id === split.project_type; }) || {}).label + '\n';
    if (split.description) text += 'Description: ' + split.description + '\n';
    text += 'Date: ' + today + '\n\n';

    text += 'PARTIES & SPLIT\n';
    text += '───────────────\n';
    members.forEach(function (m) {
      text += '• ' + m.name + ' (' + m.role + ') — ' + m.percentage + '%\n';
    });

    text += '\nREVENUE TYPES COVERED\n';
    text += '─────────────────────\n';
    text += 'This agreement covers all revenue from: streaming, sync/licensing, live performance, merchandise, and any other income generated by this project.\n\n';

    text += 'TERMS\n';
    text += '─────\n';
    text += '1. All parties agree to the percentages above for revenue generated by this project.\n';
    text += '2. Earnings will be distributed within 14 days of receipt.\n';
    text += '3. Changes to this agreement require consent from all parties.\n';
    text += '4. Any party may request an audit of earnings records.\n\n';

    text += 'NOTE: This is a record of understanding between collaborators, not a legal contract. For legally binding agreements, consult a lawyer.\n\n';
    text += 'Generated by AfroTools CreatorSplit — ' + today;
    return text;
  }

  function generateWhatsAppMessage(splitId) {
    var split = getSplit(splitId);
    if (!split) return '';
    var members = getMembers(splitId);
    var msg = 'Hey! Here\'s our split agreement for *' + split.name + '*:\n\n';
    members.forEach(function (m) {
      msg += '• ' + m.name + ' (' + m.role + '): *' + m.percentage + '%*\n';
    });
    msg += '\nView the full agreement on AfroTools CreatorSplit';
    return msg;
  }

  // ── FORMAT HELPERS ──
  function formatMoney(amount, currency) {
    currency = currency || 'NGN';
    var c = CURRENCIES[currency] || { symbol: currency + ' ' };
    var abs = Math.abs(amount);
    var formatted;
    if (abs >= 1000000) {
      formatted = (abs / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    } else if (abs >= 1000) {
      formatted = abs.toLocaleString('en-US');
    } else {
      formatted = abs.toString();
    }
    return (amount < 0 ? '-' : '') + c.symbol + formatted;
  }

  // ── SVG DONUT CHART ──
  function buildDonutData(members) {
    var total = members.reduce(function (s, m) { return s + m.percentage; }, 0);
    var segments = [];
    var offset = 0;
    var circumference = 2 * Math.PI * 40; // radius = 40

    members.forEach(function (m) {
      var pct = total > 0 ? (m.percentage / total) : 0;
      var dash = pct * circumference;
      segments.push({
        member: m,
        dashArray: dash + ' ' + (circumference - dash),
        dashOffset: -offset,
        color: m.color
      });
      offset += dash;
    });
    return { segments: segments, total: total, circumference: circumference };
  }

  function renderDonutSVG(members) {
    var data = buildDonutData(members);
    var svg = '<svg viewBox="0 0 100 100" class="cs-donut-svg">';
    // Background circle
    svg += '<circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="18"/>';
    // Segments (in reverse so first member is on top)
    for (var i = data.segments.length - 1; i >= 0; i--) {
      var seg = data.segments[i];
      svg += '<circle cx="50" cy="50" r="40" fill="none" stroke="' + seg.color + '" stroke-width="18" ' +
        'stroke-dasharray="' + seg.dashArray + '" stroke-dashoffset="' + seg.dashOffset + '" ' +
        'transform="rotate(-90 50 50)" style="opacity:.85" data-member-id="' + seg.member.id + '"/>';
    }
    // Center text
    svg += '<text x="50" y="48" class="cs-donut-center">' + data.total + '%</text>';
    svg += '<text x="50" y="58" class="cs-donut-center-sub">allocated</text>';
    svg += '</svg>';
    return svg;
  }

  // ── STATS ──
  function getStats() {
    var splits = getSplits();
    var activeSplits = splits.filter(function (s) { return s.status === 'active' || s.status === 'pending'; }).length;
    var allEarnings = getLocalData(EARNINGS_KEY);
    var totalEarned = allEarnings.reduce(function (sum, e) { return sum + e.amount; }, 0);
    var allPayouts = getLocalData(PAYOUTS_KEY);
    var totalPaid = allPayouts.reduce(function (sum, p) { return sum + p.amount; }, 0);
    var allMembers = getLocalData(MEMBERS_KEY);
    var uniqueNames = {};
    allMembers.forEach(function (m) { if (!m.is_self) uniqueNames[m.name] = true; });

    return {
      activeSplits: activeSplits,
      totalEarned: totalEarned,
      pendingPayouts: totalEarned - totalPaid,
      collaborators: Object.keys(uniqueNames).length
    };
  }

  // ── DEMO DATA ──
  function loadDemoData(currency) {
    currency = currency || 'NGN';
    var existing = getLocalData(SPLITS_KEY);
    if (existing.length > 0) return;

    // Demo split 1 — music collab
    var split1 = createSplit({
      name: 'Lagos Nights (Single)',
      project_type: 'music',
      description: 'Afrobeats single — producer + vocalist collab',
      status: 'active',
      currency: currency
    });
    addMember({ split_id: split1.id, name: 'You', role: 'Producer', percentage: 35, color: COLLAB_COLORS[0], is_self: true, has_acknowledged: true });
    addMember({ split_id: split1.id, name: 'Chidi Okeke', role: 'Artist', percentage: 40, color: COLLAB_COLORS[1], contact_whatsapp: '+234 801 234 5678', has_acknowledged: true });
    addMember({ split_id: split1.id, name: 'Amara Eze', role: 'Songwriter', percentage: 15, color: COLLAB_COLORS[2], has_acknowledged: true });
    addMember({ split_id: split1.id, name: 'DJ Flex', role: 'Mix Engineer', percentage: 10, color: COLLAB_COLORS[3], has_acknowledged: false });

    addEarning({ split_id: split1.id, amount: 250000, currency: currency, source: 'streaming', description: 'Spotify + Apple Music — January', earning_date: '2026-01-28' });
    addEarning({ split_id: split1.id, amount: 180000, currency: currency, source: 'streaming', description: 'Spotify + Apple Music — February', earning_date: '2026-02-28' });
    addEarning({ split_id: split1.id, amount: 500000, currency: currency, source: 'sync', description: 'MTN ad placement', earning_date: '2026-03-10' });

    addPayout({ split_id: split1.id, member_id: getMembers(split1.id)[1].id, amount: 160000, currency: currency, method: 'bank_transfer', payout_date: '2026-02-05', notes: 'Jan streaming payout' });
    addPayout({ split_id: split1.id, member_id: getMembers(split1.id)[2].id, amount: 37500, currency: currency, method: 'bank_transfer', payout_date: '2026-02-05', notes: 'Jan streaming payout' });

    // Demo split 2 — video project
    var split2 = createSplit({
      name: 'Brand Video — Konga',
      project_type: 'video',
      description: 'Product launch video for Konga e-commerce',
      status: 'active',
      currency: currency
    });
    addMember({ split_id: split2.id, name: 'You', role: 'Director', percentage: 40, color: COLLAB_COLORS[0], is_self: true, has_acknowledged: true });
    addMember({ split_id: split2.id, name: 'Tunde Bakare', role: 'Videographer', percentage: 30, color: COLLAB_COLORS[4], has_acknowledged: true });
    addMember({ split_id: split2.id, name: 'Ngozi Adamu', role: 'Editor', percentage: 30, color: COLLAB_COLORS[5], has_acknowledged: true });

    addEarning({ split_id: split2.id, amount: 800000, currency: currency, source: 'other', description: 'Client payment — 50% upfront', earning_date: '2026-03-01' });

    // Demo split 3 — draft
    var split3 = createSplit({
      name: 'Photography Lookbook',
      project_type: 'photography',
      description: 'Fashion lookbook with model and stylist',
      status: 'draft',
      currency: currency
    });
    addMember({ split_id: split3.id, name: 'You', role: 'Photographer', percentage: 55, color: COLLAB_COLORS[0], is_self: true });
    addMember({ split_id: split3.id, name: 'Adaeze Nwosu', role: 'Model', percentage: 25, color: COLLAB_COLORS[6] });
    addMember({ split_id: split3.id, name: 'Bimpe Ogun', role: 'Stylist', percentage: 20, color: COLLAB_COLORS[7] });
  }

  // ── HELPERS ──
  function generateId() {
    return 'cs_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function generateToken() {
    var chars = 'abcdef0123456789';
    var token = '';
    for (var i = 0; i < 32; i++) token += chars.charAt(Math.floor(Math.random() * chars.length));
    return token;
  }

  // ── PUBLIC API ──
  return {
    COLLAB_COLORS: COLLAB_COLORS,
    PROJECT_TYPES: PROJECT_TYPES,
    ROLES_BY_TYPE: ROLES_BY_TYPE,
    EARNING_SOURCES: EARNING_SOURCES,
    PAYOUT_METHODS: PAYOUT_METHODS,
    CURRENCIES: CURRENCIES,
    DEFAULT_SPLITS: DEFAULT_SPLITS,

    createSplit: createSplit,
    updateSplit: updateSplit,
    deleteSplit: deleteSplit,
    getSplit: getSplit,
    getSplits: getSplits,

    addMember: addMember,
    updateMember: updateMember,
    removeMember: removeMember,
    getMembers: getMembers,

    addEarning: addEarning,
    getEarnings: getEarnings,
    getTotalEarnings: getTotalEarnings,

    addPayout: addPayout,
    getPayouts: getPayouts,
    getMemberPayouts: getMemberPayouts,

    calculateMemberEarnings: calculateMemberEarnings,
    projectEarnings: projectEarnings,
    suggestSplits: suggestSplits,

    generateAgreement: generateAgreement,
    generateWhatsAppMessage: generateWhatsAppMessage,

    formatMoney: formatMoney,
    buildDonutData: buildDonutData,
    renderDonutSVG: renderDonutSVG,
    getStats: getStats,
    loadDemoData: loadDemoData
  };
})();

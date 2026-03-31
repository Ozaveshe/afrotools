/**
 * CreatorMoney Engine — Finance Tracker for African Creatives
 * IIFE module: income/expense tracking, aggregation, goals, reports
 * Uses Supabase for persistence, IndexedDB for offline-first
 */
var CreatorMoneyEngine = (function () {
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
  var INCOME_SOURCES = [
    { id: 'client', label: 'Client Payment', icon: '💼' },
    { id: 'brand_deal', label: 'Brand Deal', icon: '🤝' },
    { id: 'digital_product', label: 'Digital Product', icon: '📦' },
    { id: 'platform', label: 'Platform Revenue', icon: '📱' },
    { id: 'workshop', label: 'Workshop / Event', icon: '🎤' },
    { id: 'gift', label: 'Gift / Tip', icon: '🎁' },
    { id: 'other', label: 'Other', icon: '💰' }
  ];

  var EXPENSE_CATEGORIES = [
    { id: 'equipment', label: 'Equipment & Gear', icon: '📷', color: '#3B82F6' },
    { id: 'data', label: 'Data & Internet', icon: '📶', color: '#8B5CF6' },
    { id: 'transport', label: 'Transport & Travel', icon: '🚗', color: '#F59E0B' },
    { id: 'software', label: 'Software & Subs', icon: '💻', color: '#EC4899' },
    { id: 'studio', label: 'Studio & Workspace', icon: '🏠', color: '#14B8A6' },
    { id: 'marketing', label: 'Marketing & Promo', icon: '📣', color: '#EF4444' },
    { id: 'props', label: 'Props & Materials', icon: '🎨', color: '#F97316' },
    { id: 'team', label: 'Team & Assistants', icon: '👥', color: '#06B6D4' },
    { id: 'food', label: 'Food & Meetings', icon: '🍽️', color: '#84CC16' },
    { id: 'education', label: 'Education & Courses', icon: '📚', color: '#6366F1' },
    { id: 'custom', label: 'Other', icon: '📋', color: '#64748B' }
  ];

  var CURRENCIES = {
    NGN: { symbol: '₦', name: 'Nigerian Naira' },
    KES: { symbol: 'KES ', name: 'Kenyan Shilling' },
    ZAR: { symbol: 'R', name: 'South African Rand' },
    GHS: { symbol: 'GH₵', name: 'Ghanaian Cedi' },
    TZS: { symbol: 'TZS ', name: 'Tanzanian Shilling' },
    EGP: { symbol: 'EGP ', name: 'Egyptian Pound' },
    UGX: { symbol: 'UGX ', name: 'Ugandan Shilling' },
    XOF: { symbol: 'CFA ', name: 'CFA Franc (West)' },
    XAF: { symbol: 'CFA ', name: 'CFA Franc (Central)' },
    MAD: { symbol: 'MAD ', name: 'Moroccan Dirham' },
    USD: { symbol: '$', name: 'US Dollar' }
  };

  // ── LOCAL STORAGE (offline-first) ──
  var STORAGE_KEY = 'cm_transactions';
  var GOALS_KEY = 'cm_goals';

  function getLocalData(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function setLocalData(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
  }

  // ── TRANSACTION MANAGEMENT ──
  function addTransaction(tx) {
    // tx: { type: 'income'|'expense', amount, currency, source|category, description, date, ... }
    tx.id = tx.id || generateId();
    tx.created_at = tx.created_at || new Date().toISOString();
    tx.date = tx.date || new Date().toISOString().slice(0, 10);
    tx.synced = false;

    var all = getLocalData(STORAGE_KEY);
    all.push(tx);
    setLocalData(STORAGE_KEY, all);

    // Try to sync to Supabase
    syncTransaction(tx);
    return tx;
  }

  function deleteTransaction(id) {
    var all = getLocalData(STORAGE_KEY);
    var filtered = all.filter(function (t) { return t.id !== id; });
    setLocalData(STORAGE_KEY, filtered);
    // Delete from Supabase
    deleteFromSupabase(id);
  }

  function getTransactions(filters) {
    var all = getLocalData(STORAGE_KEY);
    if (!filters) return all;

    return all.filter(function (t) {
      if (filters.type && t.type !== filters.type) return false;
      if (filters.month) {
        var txMonth = t.date.slice(0, 7);
        if (txMonth !== filters.month) return false;
      }
      if (filters.year) {
        var txYear = t.date.slice(0, 4);
        if (txYear !== filters.year) return false;
      }
      if (filters.category && t.category !== filters.category) return false;
      if (filters.source && t.source !== filters.source) return false;
      return true;
    }).sort(function (a, b) { return b.date.localeCompare(a.date); });
  }

  // ── AGGREGATION ──
  function getMonthSummary(yearMonth, currency) {
    currency = currency || 'NGN';
    var all = getTransactions({ month: yearMonth });
    var income = 0, expenses = 0;
    var incomeBySource = {};
    var expenseByCategory = {};
    var incomeItems = [];
    var expenseItems = [];

    all.forEach(function (t) {
      if (t.currency !== currency) return; // skip other currencies for now
      if (t.type === 'income') {
        income += t.amount;
        var src = t.source || 'other';
        incomeBySource[src] = (incomeBySource[src] || 0) + t.amount;
        incomeItems.push(t);
      } else {
        expenses += t.amount;
        var cat = t.category || 'custom';
        expenseByCategory[cat] = (expenseByCategory[cat] || 0) + t.amount;
        expenseItems.push(t);
      }
    });

    var profit = income - expenses;
    var margin = income > 0 ? Math.round((profit / income) * 100) : 0;

    return {
      month: yearMonth,
      currency: currency,
      income: income,
      expenses: expenses,
      profit: profit,
      margin: margin,
      incomeBySource: incomeBySource,
      expenseByCategory: expenseByCategory,
      incomeItems: incomeItems,
      expenseItems: expenseItems,
      txCount: all.length
    };
  }

  function getLast6Months(currency) {
    var months = [];
    var now = new Date();
    for (var i = 5; i >= 0; i--) {
      var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      var ym = d.toISOString().slice(0, 7);
      var summary = getMonthSummary(ym, currency);
      months.push({
        month: ym,
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        profit: summary.profit,
        income: summary.income,
        expenses: summary.expenses
      });
    }
    return months;
  }

  function getYearSummary(year, currency) {
    currency = currency || 'NGN';
    year = year || new Date().getFullYear().toString();
    var months = [];
    var totalIncome = 0, totalExpenses = 0;
    var bestMonth = null, worstMonth = null;

    for (var m = 0; m < 12; m++) {
      var ym = year + '-' + String(m + 1).padStart(2, '0');
      var summary = getMonthSummary(ym, currency);
      months.push(summary);
      totalIncome += summary.income;
      totalExpenses += summary.expenses;
      if (!bestMonth || summary.profit > bestMonth.profit) bestMonth = summary;
      if (!worstMonth || summary.profit < worstMonth.profit) worstMonth = summary;
    }

    return {
      year: year,
      currency: currency,
      months: months,
      totalIncome: totalIncome,
      totalExpenses: totalExpenses,
      totalProfit: totalIncome - totalExpenses,
      margin: totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0,
      bestMonth: bestMonth,
      worstMonth: worstMonth
    };
  }

  // ── FINANCIAL GOALS ──
  function getGoals() { return getLocalData(GOALS_KEY); }

  function addGoal(goal) {
    goal.id = goal.id || generateId();
    goal.current_amount = goal.current_amount || 0;
    goal.status = 'active';
    goal.created_at = new Date().toISOString();
    var goals = getGoals();
    goals.push(goal);
    setLocalData(GOALS_KEY, goals);
    return goal;
  }

  function updateGoal(id, updates) {
    var goals = getGoals();
    var idx = goals.findIndex(function (g) { return g.id === id; });
    if (idx >= 0) {
      Object.assign(goals[idx], updates);
      setLocalData(GOALS_KEY, goals);
    }
    return goals[idx] || null;
  }

  function deleteGoal(id) {
    var goals = getGoals().filter(function (g) { return g.id !== id; });
    setLocalData(GOALS_KEY, goals);
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

  function formatMonthLabel(yearMonth) {
    var parts = yearMonth.split('-');
    var d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  // ── SUPABASE SYNC ──
  async function syncTransaction(tx) {
    var sb = getSupabase();
    var userId = getUserId();
    if (!sb || !userId) return;

    var table = tx.type === 'income' ? 'creator_income' : 'creator_expenses';
    var row = {
      user_id: userId,
      amount: tx.amount,
      currency: tx.currency || 'NGN',
      description: tx.description || '',
      transaction_date: tx.date,
      notes: tx.notes || ''
    };

    if (tx.type === 'income') {
      row.source = tx.source || 'other';
    } else {
      row.vendor = tx.vendor || '';
      row.is_business_expense = tx.is_business !== false;
    }

    try {
      await sb.from(table).insert(row);
      // Mark as synced
      var all = getLocalData(STORAGE_KEY);
      var idx = all.findIndex(function (t) { return t.id === tx.id; });
      if (idx >= 0) { all[idx].synced = true; setLocalData(STORAGE_KEY, all); }
    } catch (e) { /* Will retry next time */ }
  }

  async function deleteFromSupabase(id) {
    var sb = getSupabase();
    var userId = getUserId();
    if (!sb || !userId) return;
    try {
      await sb.from('creator_income').delete().eq('id', id).eq('user_id', userId);
      await sb.from('creator_expenses').delete().eq('id', id).eq('user_id', userId);
    } catch (e) {}
  }

  async function syncFromSupabase() {
    var sb = getSupabase();
    var userId = getUserId();
    if (!sb || !userId) return;

    try {
      var now = new Date();
      var startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);

      var [incomeRes, expenseRes] = await Promise.all([
        sb.from('creator_income').select('*').eq('user_id', userId).gte('transaction_date', startOfLastMonth).order('transaction_date', { ascending: false }),
        sb.from('creator_expenses').select('*').eq('user_id', userId).gte('transaction_date', startOfLastMonth).order('transaction_date', { ascending: false })
      ]);

      var remote = [];
      if (incomeRes.data) {
        incomeRes.data.forEach(function (r) {
          remote.push({ id: r.id, type: 'income', amount: r.amount, currency: r.currency, source: r.source, description: r.description, date: r.transaction_date, notes: r.notes, synced: true, created_at: r.created_at });
        });
      }
      if (expenseRes.data) {
        expenseRes.data.forEach(function (r) {
          remote.push({ id: r.id, type: 'expense', amount: r.amount, currency: r.currency, category: r.category_id, description: r.description, vendor: r.vendor, date: r.transaction_date, notes: r.notes, is_business: r.is_business_expense, synced: true, created_at: r.created_at });
        });
      }

      // Merge: keep local unsynced + remote
      var local = getLocalData(STORAGE_KEY);
      var unsynced = local.filter(function (t) { return !t.synced; });
      var remoteIds = {};
      remote.forEach(function (r) { remoteIds[r.id] = true; });
      unsynced = unsynced.filter(function (t) { return !remoteIds[t.id]; });
      var merged = remote.concat(unsynced);
      setLocalData(STORAGE_KEY, merged);
    } catch (e) {}
  }

  // ── DEMO DATA ──
  function loadDemoData(currency) {
    currency = currency || 'NGN';
    var now = new Date();
    var ym = now.toISOString().slice(0, 7);
    var lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);

    var demo = [
      // This month income
      { type: 'income', amount: 320000, currency: currency, source: 'client', description: 'Wedding shoot — Adeyemi family', date: ym + '-05' },
      { type: 'income', amount: 100000, currency: currency, source: 'brand_deal', description: 'Instagram sponsored post — Fanta Nigeria', date: ym + '-12' },
      { type: 'income', amount: 50000, currency: currency, source: 'digital_product', description: 'Lightroom preset pack sales', date: ym + '-08' },
      { type: 'income', amount: 25000, currency: currency, source: 'gift', description: 'Tip from satisfied client', date: ym + '-18' },
      // This month expenses
      { type: 'expense', amount: 120000, currency: currency, category: 'equipment', description: 'Camera lens rental', vendor: 'FotoHub Lagos', date: ym + '-03', is_business: true },
      { type: 'expense', amount: 60000, currency: currency, category: 'data', description: 'Monthly data bundle + WiFi', vendor: 'MTN/Starlink', date: ym + '-01', is_business: true },
      { type: 'expense', amount: 48000, currency: currency, category: 'transport', description: 'Bolt rides to shoots (12 trips)', vendor: 'Bolt', date: ym + '-15', is_business: true },
      { type: 'expense', amount: 40000, currency: currency, category: 'software', description: 'Adobe Creative Cloud + Canva Pro', vendor: 'Adobe/Canva', date: ym + '-01', is_business: true },
      { type: 'expense', amount: 32000, currency: currency, category: 'studio', description: 'Studio rental — half month', vendor: 'TekStudio Lekki', date: ym + '-01', is_business: true },
      { type: 'expense', amount: 20000, currency: currency, category: 'marketing', description: 'Instagram ad boost', vendor: 'Meta', date: ym + '-10', is_business: true },
      { type: 'expense', amount: 15000, currency: currency, category: 'food', description: 'Client lunch meetings (3)', vendor: 'Various', date: ym + '-14', is_business: true },
      { type: 'expense', amount: 65000, currency: currency, category: 'custom', description: 'Miscellaneous (fuel, prints, props)', vendor: '', date: ym + '-20', is_business: true },
      // Last month
      { type: 'income', amount: 250000, currency: currency, source: 'client', description: 'Corporate headshots — GTBank', date: lastMonth + '-10' },
      { type: 'income', amount: 80000, currency: currency, source: 'client', description: 'Product shoot — Konga', date: lastMonth + '-22' },
      { type: 'income', amount: 35000, currency: currency, source: 'platform', description: 'YouTube AdSense', date: lastMonth + '-28' },
      { type: 'expense', amount: 95000, currency: currency, category: 'equipment', description: 'Memory cards & battery', vendor: 'Slot Nigeria', date: lastMonth + '-05', is_business: true },
      { type: 'expense', amount: 55000, currency: currency, category: 'data', description: 'Data + WiFi', vendor: 'MTN', date: lastMonth + '-01', is_business: true },
      { type: 'expense', amount: 38000, currency: currency, category: 'transport', description: 'Transport', vendor: 'Bolt/Uber', date: lastMonth + '-15', is_business: true },
      { type: 'expense', amount: 40000, currency: currency, category: 'software', description: 'Software subs', vendor: 'Adobe', date: lastMonth + '-01', is_business: true },
    ];

    var existing = getLocalData(STORAGE_KEY);
    if (existing.length > 0) return; // Don't overwrite existing data

    demo.forEach(function (d) {
      d.id = generateId();
      d.created_at = new Date().toISOString();
      d.synced = false;
    });
    setLocalData(STORAGE_KEY, demo);

    // Demo goals
    if (getGoals().length === 0) {
      addGoal({ name: 'New camera body (Canon R6 II)', target_amount: 500000, current_amount: 320000, currency: currency, deadline: '2026-06-30' });
      addGoal({ name: 'Emergency fund (3 months)', target_amount: 400000, current_amount: 180000, currency: currency, deadline: '2026-12-31' });
    }
  }

  // ── HELPERS ──
  function generateId() {
    return 'cm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  // ── PUBLIC API ──
  return {
    INCOME_SOURCES: INCOME_SOURCES,
    EXPENSE_CATEGORIES: EXPENSE_CATEGORIES,
    CURRENCIES: CURRENCIES,

    addTransaction: addTransaction,
    deleteTransaction: deleteTransaction,
    getTransactions: getTransactions,
    getMonthSummary: getMonthSummary,
    getLast6Months: getLast6Months,
    getYearSummary: getYearSummary,

    getGoals: getGoals,
    addGoal: addGoal,
    updateGoal: updateGoal,
    deleteGoal: deleteGoal,

    formatMoney: formatMoney,
    formatMonthLabel: formatMonthLabel,

    syncFromSupabase: syncFromSupabase,
    loadDemoData: loadDemoData
  };
})();

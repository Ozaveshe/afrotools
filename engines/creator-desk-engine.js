/**
 * CreatorDesk Engine — Client & Project Manager
 * Pipeline management, client analytics, status tracking
 */
!function(){"use strict";

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

var STATUSES = [
  { id: 'lead', label: 'Lead', color: '#94a3b8', desc: 'Potential projects, inquiries' },
  { id: 'quoted', label: 'Quoted', color: '#f59e0b', desc: 'Quote sent, awaiting response' },
  { id: 'active', label: 'Active', color: '#0EA5E9', desc: 'Work in progress' },
  { id: 'review', label: 'Review', color: '#8b5cf6', desc: 'Delivered, awaiting feedback' },
  { id: 'completed', label: 'Completed', color: '#10b981', desc: 'Done, invoiced or paid' },
  { id: 'on_hold', label: 'On Hold', color: '#9ca3af', desc: 'Paused projects' }
];

var PRIORITY_LEVELS = [
  { id: 'low', label: 'Low', color: 'transparent' },
  { id: 'medium', label: 'Medium', color: '#f59e0b' },
  { id: 'high', label: 'High', color: '#ef4444' }
];

var AVATAR_COLORS = ['#0EA5E9','#8b5cf6','#f59e0b','#10b981','#ef4444','#ec4899','#f97316','#06b6d4','#6366f1','#84cc16'];

function getInitials(name) {
  if (!name) return '?';
  return name.split(/\s+/).map(function(w) { return w[0]; }).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name) {
  var hash = 0;
  for (var i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getDueUrgency(dateStr) {
  if (!dateStr) return { class: 'none', label: '', daysLeft: null };
  var now = new Date(); now.setHours(0,0,0,0);
  var due = new Date(dateStr + 'T00:00:00');
  var diff = Math.ceil((due - now) / 86400000);
  if (diff < 0) return { class: 'overdue', label: Math.abs(diff) + 'd overdue', daysLeft: diff };
  if (diff === 0) return { class: 'overdue', label: 'Due today', daysLeft: 0 };
  if (diff <= 3) return { class: 'overdue', label: 'Due in ' + diff + 'd', daysLeft: diff };
  if (diff <= 7) return { class: 'soon', label: 'Due in ' + diff + 'd', daysLeft: diff };
  return { class: 'safe', label: due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), daysLeft: diff };
}

function getTaskProgress(tasks) {
  if (!tasks || !tasks.length) return { total: 0, done: 0, pct: 0 };
  var done = tasks.filter(function(t) { return t.done; }).length;
  return { total: tasks.length, done: done, pct: Math.round((done / tasks.length) * 100) };
}

function getPipelineStats(projects) {
  var now = new Date(); now.setHours(0,0,0,0);
  var weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7);
  var activeProjects = projects.filter(function(p) { return p.status !== 'completed' && p.status !== 'on_hold' && p.status !== 'cancelled'; });

  return {
    active: projects.filter(function(p) { return p.status === 'active'; }).length,
    dueThisWeek: activeProjects.filter(function(p) {
      if (!p.due) return false;
      var d = new Date(p.due + 'T00:00:00');
      return d >= now && d <= weekEnd;
    }).length,
    overdue: activeProjects.filter(function(p) {
      if (!p.due) return false;
      return new Date(p.due + 'T00:00:00') < now;
    }).length,
    totalValue: activeProjects.reduce(function(sum, p) {
      return sum + (parseInt((p.value || '0').toString().replace(/[^0-9]/g, ''), 10) || 0);
    }, 0),
    totalProjects: projects.length,
    completedProjects: projects.filter(function(p) { return p.status === 'completed'; }).length
  };
}

function getClientAnalytics(clientName, projects) {
  var clientProjects = projects.filter(function(p) { return p.client === clientName; });
  var completed = clientProjects.filter(function(p) { return p.status === 'completed'; });
  var revenue = completed.reduce(function(s, p) {
    return s + (parseInt((p.value || '0').toString().replace(/[^0-9]/g, ''), 10) || 0);
  }, 0);
  var active = clientProjects.filter(function(p) { return p.status === 'active' || p.status === 'review'; }).length;

  return {
    totalProjects: clientProjects.length,
    activeProjects: active,
    completedProjects: completed.length,
    totalRevenue: revenue,
    averageValue: completed.length ? Math.round(revenue / completed.length) : 0,
    lastProjectDate: clientProjects.length ?
      Math.max.apply(null, clientProjects.map(function(p) { return p.createdAt || 0; })) : null
  };
}

function createProject(data) {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: data.name || '',
    client: data.client || '',
    status: data.status || 'lead',
    priority: data.priority || 'medium',
    value: data.value || '',
    currency: data.currency || 'NGN',
    due: data.due || '',
    tasks: data.tasks || [],
    notes: [{ text: 'Project created', type: 'system', time: Date.now() }],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

function createClient(data) {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: data.name || '',
    company: data.company || '',
    email: data.email || '',
    phone: data.phone || '',
    whatsapp: data.whatsapp || '',
    country: data.country || '',
    notes: data.notes || '',
    createdAt: Date.now()
  };
}

window.AfroTools = window.AfroTools || {};
window.AfroTools.CreatorDeskEngine = {
  STATUSES: STATUSES,
  PRIORITY_LEVELS: PRIORITY_LEVELS,
  getInitials: getInitials,
  getAvatarColor: getAvatarColor,
  getDueUrgency: getDueUrgency,
  getTaskProgress: getTaskProgress,
  getPipelineStats: getPipelineStats,
  getClientAnalytics: getClientAnalytics,
  createProject: createProject,
  createClient: createClient
};

}();

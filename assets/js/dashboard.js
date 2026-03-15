/**
 * AFROTOOLS DASHBOARD — Enhanced Widgets
 * Renders: Tax Calendar, Alerts, Recommendations, YoY Comparison
 */
(function(window) {
  'use strict';

  // Country name → 2-letter code map for tax calendar compatibility
  const COUNTRY_CODE_MAP = {
    'nigeria': 'NG', 'kenya': 'KE', 'south africa': 'ZA', 'ghana': 'GH',
    'egypt': 'EG', 'tanzania': 'TZ', 'rwanda': 'RW', 'uganda': 'UG',
    'morocco': 'MA', 'ethiopia': 'ET', 'senegal': 'SN', 'cameroon': 'CM',
    'côte d\'ivoire': 'CI', 'ivory coast': 'CI', 'algeria': 'DZ',
    'tunisia': 'TN', 'zambia': 'ZM', 'zimbabwe': 'ZW', 'botswana': 'BW',
    'mozambique': 'MZ', 'angola': 'AO', 'namibia': 'NA', 'mauritius': 'MU',
    'malawi': 'MW', 'sudan': 'SD', 'libya': 'LY', 'dr congo': 'CD',
    'congo': 'CG', 'gabon': 'GA', 'benin': 'BJ', 'togo': 'TG',
    'burkina faso': 'BF', 'mali': 'ML', 'niger': 'NE', 'chad': 'TD',
    'sierra leone': 'SL', 'liberia': 'LR', 'guinea': 'GN',
    'south sudan': 'SS', 'madagascar': 'MG', 'eswatini': 'SZ',
    'lesotho': 'LS', 'gambia': 'GM', 'cabo verde': 'CV',
    'equatorial guinea': 'GQ', 'comoros': 'KM', 'djibouti': 'DJ',
    'eritrea': 'ER', 'somalia': 'SO', 'seychelles': 'SC',
    'são tomé and príncipe': 'ST', 'mauritania': 'MR', 'burundi': 'BI',
    'central african republic': 'CF'
  };

  function resolveCountryCode(country) {
    if (!country) return 'NG';
    // Already a 2-letter code
    if (country.length === 2 && country === country.toUpperCase()) return country;
    // Look up by full name
    const code = COUNTRY_CODE_MAP[country.toLowerCase()];
    return code || 'NG';
  }

  function renderTaxCalendar(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !window.AfroTaxCalendar) return;

    const user = AfroAuth.getUser();
    const country = resolveCountryCode(user?.country);
    const deadlines = AfroTaxCalendar.getUpcomingDeadlines(country, 60);

    if (deadlines.length === 0) {
      container.innerHTML = '<p class="dash-empty">No upcoming deadlines in the next 60 days.</p>';
      return;
    }

    container.innerHTML = deadlines.map(d => {
      const urgency = d.daysUntil <= 7 ? 'urgent' : d.daysUntil <= 14 ? 'soon' : 'normal';
      const dateStr = d.nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `
        <div class="cal-item cal-${urgency}">
          <div class="cal-date">${dateStr}</div>
          <div class="cal-info">
            <div class="cal-name">${d.name}</div>
            <div class="cal-meta">${d.authority} &middot; ${d.daysUntil === 0 ? 'Today!' : d.daysUntil === 1 ? 'Tomorrow' : d.daysUntil + ' days'}</div>
          </div>
          ${urgency === 'urgent' ? '<span class="cal-badge-urgent">URGENT</span>' : ''}
        </div>
      `;
    }).join('');
  }

  function renderAlerts(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !window.AfroTaxCalendar) return;

    const user = AfroAuth.getUser();
    const country = resolveCountryCode(user?.country);
    const dismissed = JSON.parse(localStorage.getItem('afro_alerts_dismissed_' + (user?.id || 'guest')) || '[]');
    const alerts = AfroTaxCalendar.getAlerts(country).filter(a => !dismissed.includes(a.date + a.title));

    if (alerts.length === 0) {
      container.innerHTML = '<p class="dash-empty">No new regulatory alerts.</p>';
      return;
    }

    container.innerHTML = alerts.map(a => `
      <div class="alert-item alert-${a.severity}">
        <div class="alert-header">
          <span class="alert-severity">${a.severity === 'high' ? '🔴' : '🟡'} ${a.severity.toUpperCase()}</span>
          <button class="alert-dismiss" data-alert="${a.date + a.title}" aria-label="Dismiss">&times;</button>
        </div>
        <div class="alert-title">${a.title}</div>
        <div class="alert-desc">${a.desc}</div>
        <div class="alert-date">${new Date(a.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
      </div>
    `).join('');

    // Bind dismiss buttons
    container.querySelectorAll('.alert-dismiss').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.alert;
        dismissed.push(key);
        localStorage.setItem('afro_alerts_dismissed_' + (user?.id || 'guest'), JSON.stringify(dismissed));
        btn.closest('.alert-item').remove();
      });
    });
  }

  function renderRecommendations(containerId) {
    const container = document.getElementById(containerId);
    if (!container || typeof AFRO_TOOLS === 'undefined') return;

    const user = AfroAuth.getUser();
    const stats = AfroData.getUsageStats();
    const recentIds = AfroData.getRecentTools().map(r => r.toolId);

    // Get live tools in user's top category and country
    let recs = AFRO_TOOLS.filter(t =>
      (t.status === 'live' || t.status === 'new') &&
      !recentIds.includes(t.id) &&
      (stats.topCategory ? t.category === stats.topCategory : true) &&
      (user?.country ? (t.countries.includes('ALL') || t.countries.includes(user.country)) : true)
    ).sort((a, b) => b.priority - a.priority).slice(0, 4);

    // Fallback: show top tools if no category match
    if (recs.length === 0) {
      recs = AFRO_TOOLS.filter(t => (t.status === 'live' || t.status === 'new') && !recentIds.includes(t.id))
        .sort((a, b) => b.priority - a.priority).slice(0, 4);
    }

    if (recs.length === 0) {
      container.innerHTML = '<p class="dash-empty">Explore our tools to get personalized recommendations.</p>';
      return;
    }

    container.innerHTML = recs.map(t => `
      <a href="${t.href}" class="rec-card">
        <span class="rec-icon">${t.icon}</span>
        <div class="rec-info">
          <div class="rec-name">${t.name}</div>
          <div class="rec-desc">${t.desc.substring(0, 60)}${t.desc.length > 60 ? '...' : ''}</div>
        </div>
      </a>
    `).join('');
  }

  function renderYoYComparison(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Find PAYE tool IDs the user has saved data for
    const saved = AfroData.getAllSaved();
    const payeTools = Object.keys(saved).filter(id => id.includes('paye') || id.includes('salary-tax'));

    if (payeTools.length === 0) {
      container.innerHTML = '<p class="dash-empty">Calculate your PAYE to track changes over time.</p>';
      return;
    }

    const toolId = payeTools[0];
    const history = AfroData.load(toolId, 5);

    if (history.length < 2) {
      container.innerHTML = '<p class="dash-empty">Make at least 2 calculations to see trends.</p>';
      return;
    }

    const latest = history[0].data;
    const previous = history[1].data;

    const rows = [
      { label: 'Gross Income', latest: latest.gross || latest.grossAnnual, previous: previous.gross || previous.grossAnnual },
      { label: 'Net Income', latest: latest.netAnnual || latest.netMonthly, previous: previous.netAnnual || previous.netMonthly },
      { label: 'Effective Rate', latest: latest.effectiveRate, previous: previous.effectiveRate, isPct: true },
    ].filter(r => r.latest != null && r.previous != null);

    if (rows.length === 0) {
      container.innerHTML = '<p class="dash-empty">Saved data format not compatible for comparison.</p>';
      return;
    }

    const fmtNum = n => typeof n === 'number' ? Math.round(n).toLocaleString() : n;
    const fmtVal = (v, isPct) => isPct ? (parseFloat(v).toFixed(1) + '%') : fmtNum(v);

    container.innerHTML = `
      <table class="yoy-table">
        <thead><tr><th></th><th>Latest</th><th>Previous</th><th>Change</th></tr></thead>
        <tbody>${rows.map(r => {
          const diff = (r.latest || 0) - (r.previous || 0);
          const cls = diff > 0 ? 'yoy-up' : diff < 0 ? 'yoy-down' : 'yoy-flat';
          return `<tr><td class="yoy-label">${r.label}</td><td>${fmtVal(r.latest, r.isPct)}</td><td>${fmtVal(r.previous, r.isPct)}</td><td class="${cls}">${diff > 0 ? '+' : ''}${fmtVal(diff, r.isPct)}</td></tr>`;
        }).join('')}</tbody>
      </table>
      <div class="yoy-dates">Latest: ${new Date(history[0].date).toLocaleDateString()} | Previous: ${new Date(history[1].date).toLocaleDateString()}</div>
    `;
  }

  // Initialize all dashboard widgets
  function initDashboard() {
    renderTaxCalendar('taxCalendar');
    renderAlerts('taxAlerts');
    renderRecommendations('recommendations');
    renderYoYComparison('yoyComparison');
  }

  window.AfroDashboard = { initDashboard, renderTaxCalendar, renderAlerts, renderRecommendations, renderYoYComparison };
})(window);

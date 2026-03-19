/**
 * <result-chart> — Zero-dependency Canvas chart web component
 * Supports: donut (default), pie, bar
 *
 * Usage:
 *   <result-chart type="donut" title="Your Salary Breakdown" currency="NGN"></result-chart>
 *   chart.setData([{ label: 'Take-Home', value: 485000, color: '#007AFF' }, ...]);
 */
(function () {
  'use strict';

  var COLORS = ['#007AFF','#EF4444','#F59E0B','#8B5CF6','#10B981','#EC4899','#6366F1','#14B8A6'];

  var STYLE = '\
    :host{display:block;width:100%;font-family:"DM Sans",system-ui,sans-serif}\
    .rc-wrap{display:flex;flex-direction:column;align-items:center;padding:16px 0}\
    .rc-title{font-size:.85rem;font-weight:700;margin-bottom:12px;text-align:center}\
    canvas{display:block}\
    .rc-legend{display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:14px;justify-content:center}\
    .rc-leg-item{display:flex;align-items:center;gap:6px;font-size:.75rem;line-height:1.3}\
    .rc-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}\
    .rc-leg-val{font-weight:600}\
    .rc-leg-pct{opacity:.6}\
    .rc-bar-wrap{width:100%;max-width:500px}\
    .rc-bar-row{display:flex;align-items:center;gap:10px;margin-bottom:8px}\
    .rc-bar-lbl{width:100px;font-size:.75rem;font-weight:500;text-align:right;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\
    .rc-bar-track{flex:1;height:24px;background:rgba(128,128,128,.1);border-radius:6px;overflow:hidden;position:relative}\
    .rc-bar-fill{height:100%;border-radius:6px;transition:width .6s ease}\
    .rc-bar-val{font-size:.75rem;font-weight:600;min-width:70px;text-align:left}\
    @media(max-width:480px){\
      .rc-bar-lbl{width:70px;font-size:.7rem}\
      .rc-bar-val{font-size:.7rem;min-width:50px}\
    }\
  ';

  function ResultChart() {
    var el = Reflect.construct(HTMLElement, [], ResultChart);
    el._data = null;
    el._animId = null;
    el._resizeObs = null;
    return el;
  }
  ResultChart.prototype = Object.create(HTMLElement.prototype);
  ResultChart.prototype.constructor = ResultChart;

  ResultChart.observedAttributes = ['type', 'title', 'currency'];

  ResultChart.prototype.connectedCallback = function () {
    var shadow = this.attachShadow({ mode: 'open' });
    var style = document.createElement('style');
    style.textContent = STYLE;
    shadow.appendChild(style);
    var wrap = document.createElement('div');
    wrap.className = 'rc-wrap';
    wrap.style.display = 'none';
    shadow.appendChild(wrap);
    this._wrap = wrap;
  };

  ResultChart.prototype.setData = function (data) {
    if (!data || !data.length) return;
    this._data = data.map(function (d, i) {
      return { label: d.label, value: d.value, color: d.color || COLORS[i % COLORS.length] };
    });
    this._render();
  };

  ResultChart.prototype._isDark = function () {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  ResultChart.prototype._textColor = function () {
    return this._isDark() ? '#E2E8F0' : '#1E293B';
  };

  ResultChart.prototype._fmtCurrency = function (val) {
    var cur = this.getAttribute('currency') || 'NGN';
    try {
      return new Intl.NumberFormat('en', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(val);
    } catch (e) {
      return cur + ' ' + val.toLocaleString();
    }
  };

  ResultChart.prototype._fmtShort = function (val) {
    if (val >= 1000000) return (val / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
    return val.toString();
  };

  ResultChart.prototype._render = function () {
    if (!this._wrap || !this._data) return;
    var type = this.getAttribute('type') || 'donut';
    this._wrap.innerHTML = '';
    this._wrap.style.display = 'flex';

    // Title
    var titleAttr = this.getAttribute('title');
    if (titleAttr) {
      var h = document.createElement('div');
      h.className = 'rc-title';
      h.textContent = titleAttr;
      h.style.color = this._textColor();
      this._wrap.appendChild(h);
    }

    if (type === 'bar') {
      this._renderBar();
    } else {
      this._renderDonut(type === 'pie');
    }
  };

  // ── Donut / Pie ──────────────────────────────
  ResultChart.prototype._renderDonut = function (isPie) {
    var self = this;
    var data = this._data;
    var total = data.reduce(function (s, d) { return s + d.value; }, 0);
    if (total === 0) return;

    var isMobile = window.innerWidth < 480;
    var size = isMobile ? 260 : 340;
    var dpr = window.devicePixelRatio || 1;
    var outerR = (isMobile ? 100 : 130);
    var innerR = isPie ? 0 : (isMobile ? 55 : 70);
    var cx = size / 2, cy = size / 2;

    var canvas = document.createElement('canvas');
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    this._wrap.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Animate
    var startTime = null;
    var DURATION = 600;

    function draw(progress) {
      ctx.clearRect(0, 0, size, size);
      var endAngle = -Math.PI / 2 + Math.PI * 2 * progress;
      var angle = -Math.PI / 2;

      for (var i = 0; i < data.length; i++) {
        var slice = (data[i].value / total) * Math.PI * 2;
        var sliceEnd = Math.min(angle + slice, endAngle);
        if (angle >= endAngle) break;

        ctx.beginPath();
        ctx.moveTo(cx + innerR * Math.cos(angle), cy + innerR * Math.sin(angle));
        ctx.arc(cx, cy, outerR, angle, sliceEnd);
        ctx.arc(cx, cy, innerR, sliceEnd, angle, true);
        ctx.closePath();
        ctx.fillStyle = data[i].color;
        ctx.fill();

        angle += slice;
      }

      // Center text (donut only)
      if (!isPie && progress >= 1) {
        var mainItem = data[0];
        var cur = self.getAttribute('currency') || 'NGN';
        ctx.fillStyle = self._textColor();
        ctx.textAlign = 'center';
        ctx.font = 'bold ' + (isMobile ? '16' : '20') + 'px "DM Sans",system-ui,sans-serif';
        ctx.fillText(cur + ' ' + self._fmtShort(mainItem.value), cx, cy - 4);
        ctx.font = (isMobile ? '11' : '13') + 'px "DM Sans",system-ui,sans-serif';
        ctx.globalAlpha = 0.65;
        ctx.fillText(mainItem.label, cx, cy + 16);
        ctx.fillText(((mainItem.value / total) * 100).toFixed(1) + '%', cx, cy + 32);
        ctx.globalAlpha = 1;
      }
    }

    function animate(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / DURATION, 1);
      var ease = 1 - Math.pow(1 - progress, 3);
      draw(ease);
      if (progress < 1) self._animId = requestAnimationFrame(animate);
    }
    if (self._animId) cancelAnimationFrame(self._animId);
    self._animId = requestAnimationFrame(animate);

    // Legend
    this._renderLegend(total);
  };

  // ── Bar Chart ────────────────────────────────
  ResultChart.prototype._renderBar = function () {
    var data = this._data.slice().sort(function (a, b) { return b.value - a.value; });
    var maxVal = data[0] ? data[0].value : 1;
    var total = data.reduce(function (s, d) { return s + d.value; }, 0);
    var self = this;

    var barWrap = document.createElement('div');
    barWrap.className = 'rc-bar-wrap';

    data.forEach(function (d) {
      var row = document.createElement('div');
      row.className = 'rc-bar-row';

      var lbl = document.createElement('div');
      lbl.className = 'rc-bar-lbl';
      lbl.textContent = d.label;
      lbl.style.color = self._textColor();

      var track = document.createElement('div');
      track.className = 'rc-bar-track';
      var fill = document.createElement('div');
      fill.className = 'rc-bar-fill';
      fill.style.background = d.color;
      fill.style.width = '0%';
      track.appendChild(fill);

      var val = document.createElement('div');
      val.className = 'rc-bar-val';
      val.textContent = self._fmtCurrency(d.value);
      val.style.color = self._textColor();

      row.appendChild(lbl);
      row.appendChild(track);
      row.appendChild(val);
      barWrap.appendChild(row);

      // Animate bar width
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          fill.style.width = Math.max((d.value / maxVal) * 100, 2) + '%';
        });
      });
    });

    this._wrap.appendChild(barWrap);
    this._renderLegend(total);
  };

  // ── Legend ────────────────────────────────────
  ResultChart.prototype._renderLegend = function (total) {
    var self = this;
    var legend = document.createElement('div');
    legend.className = 'rc-legend';

    this._data.forEach(function (d) {
      var item = document.createElement('div');
      item.className = 'rc-leg-item';

      var dot = document.createElement('span');
      dot.className = 'rc-dot';
      dot.style.background = d.color;

      var lbl = document.createElement('span');
      lbl.textContent = d.label;
      lbl.style.color = self._textColor();

      var val = document.createElement('span');
      val.className = 'rc-leg-val';
      val.textContent = self._fmtCurrency(d.value);
      val.style.color = self._textColor();

      var pct = document.createElement('span');
      pct.className = 'rc-leg-pct';
      pct.textContent = '(' + ((d.value / total) * 100).toFixed(1) + '%)';
      pct.style.color = self._textColor();

      item.appendChild(dot);
      item.appendChild(lbl);
      item.appendChild(val);
      item.appendChild(pct);
      legend.appendChild(item);
    });

    this._wrap.appendChild(legend);
  };

  ResultChart.prototype.disconnectedCallback = function () {
    if (this._animId) cancelAnimationFrame(this._animId);
    if (this._resizeObs) this._resizeObs.disconnect();
  };

  if (!customElements.get('result-chart')) {
    customElements.define('result-chart', ResultChart);
  }
})();

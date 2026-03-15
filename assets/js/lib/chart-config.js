/**
 * AfroTools Chart Color Palette + Defaults
 * Used by EVERY chart on the site. Light, clean, Apple-inspired.
 * Load BEFORE any chart rendering code.
 */
(function () {
  'use strict';

  var AfroChartColors = {
    // Primary series colors (use in order for multi-series charts)
    series: [
      '#007AFF',  // Blue (primary)
      '#5AC8FA',  // Light blue
      '#34C759',  // Green
      '#FF9500',  // Orange
      '#AF52DE',  // Purple
      '#FF3B30',  // Red
      '#FFCC00',  // Yellow
      '#00C7BE',  // Teal
      '#FF6482',  // Pink
      '#8E8E93',  // Gray
    ],

    // Doughnut/pie chart colors (softer, more variety)
    doughnut: [
      '#007AFF',  // Net pay — blue
      '#FF9500',  // PAYE tax — orange
      '#34C759',  // Pension — green
      '#AF52DE',  // NHF — purple
      '#5AC8FA',  // NHIS / SHIF — light blue
      '#FF3B30',  // Other deductions — red
      '#FFCC00',  // SDL — yellow
      '#00C7BE',  // UIF — teal
    ],

    // Background versions (15% opacity) for fills
    seriesBg: [
      'rgba(0, 122, 255, 0.15)',
      'rgba(90, 200, 250, 0.15)',
      'rgba(52, 199, 89, 0.15)',
      'rgba(255, 149, 0, 0.15)',
      'rgba(175, 82, 222, 0.15)',
      'rgba(255, 59, 48, 0.15)',
    ],

    // Grid and axes
    grid: 'rgba(0, 0, 0, 0.04)',
    gridBorder: 'rgba(0, 0, 0, 0.08)',
    tickText: '#94A3B8',

    // Tooltip
    tooltipBg: '#1E293B',
    tooltipText: '#FFFFFF',
    tooltipBorder: 'transparent',
  };

  // Default Chart.js config overrides
  var AfroChartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { family: "'DM Sans', sans-serif", size: 12 },
          color: '#64748B',
        }
      },
      tooltip: {
        backgroundColor: AfroChartColors.tooltipBg,
        titleColor: AfroChartColors.tooltipText,
        bodyColor: AfroChartColors.tooltipText,
        borderWidth: 0,
        cornerRadius: 8,
        padding: 12,
        titleFont: { family: "'DM Sans', sans-serif", weight: '600' },
        bodyFont: { family: "'DM Sans', sans-serif" },
      }
    },
    scales: {
      x: {
        grid: { color: AfroChartColors.grid, drawBorder: false },
        ticks: { color: AfroChartColors.tickText, font: { family: "'DM Sans', sans-serif", size: 11 } },
      },
      y: {
        grid: { color: AfroChartColors.grid, drawBorder: false },
        ticks: { color: AfroChartColors.tickText, font: { family: "'DM Sans', sans-serif", size: 11 } },
      }
    },
    animation: {
      duration: 600,
      easing: 'easeOutQuart',
    }
  };

  // Export for use across the site
  window.AfroChartColors = AfroChartColors;
  window.AfroChartDefaults = AfroChartDefaults;
})();

(function (root) {
  'use strict';
  function controlRegistry() { return root.AfroProAppRegistry || null; }
  function dailyRegistry() { return root.AfroProDailyOsRegistry || null; }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function group(registry, name) {
    return registry && registry.getApps ? registry.getApps().map(function (app) { app.group = name; app.safeRoute = registry.safeRoute(app); return app; }) : [];
  }
  function control() { return group(controlRegistry(), 'control'); }
  function daily() { return group(dailyRegistry(), 'daily'); }
  function apps() { return control().concat(daily()); }
  function backbone() { var registry = controlRegistry(); return registry && registry.getSupportRoutes ? registry.getSupportRoutes() : []; }
  function routable(app) { return app.routeExists !== false; }
  function summary() {
    var c = control(), d = daily(), all = c.concat(d), support = backbone();
    return {
      totalApps: all.length, controlApps: c.length, dailyApps: d.length,
      appRoutesReady: all.filter(routable).length, // Compatibility: route presence, not workflow readiness.
      activeApps: all.filter(function (a) { return a.routeStatus === 'active'; }).length,
      implementedCores: all.filter(function (a) { return a.capabilities && a.capabilities.workflow === 'Implemented core'; }).length,
      conceptApps: all.filter(function (a) { return a.capabilities && a.capabilities.workflow === 'Concept only'; }).length,
      shellApps: all.filter(function (a) { return a.routeStatus !== 'active'; }).length,
      blockedApps: all.filter(function (a) { return a.routeStatus === 'blocked'; }).length,
      backboneRoutes: support.length, backboneReady: support.filter(routable).length,
      totalRoutableSurfaces: all.length + support.length,
      readyRoutableSurfaces: all.filter(routable).length + support.filter(routable).length
    };
  }
  var api = {
    getControlApps: control, getDailyApps: daily, getBackboneRoutes: backbone, getApps: apps,
    getApp: function (id) { return apps().find(function (a) { return a.id === id; }) || null; },
    getGroups: function () { return { control: control(), daily: daily(), backbone: backbone() }; },
    getRouteManifest: function () { return apps().concat(backbone().map(function (a) { a.group = 'backbone'; return a; })).map(function (a) { return copy({ id: a.id, name: a.name, group: a.group, route: a.route, aliasRoute: a.aliasRoute || '', routeExists: routable(a), routeStatus: a.routeStatus || 'shell', shellState: a.shellState || 'Shared route', safeRoute: a.safeRoute || a.route }); }); },
    getSummary: summary,
    isReadyForRegisteredRoutes: function () { var all = apps(); return all.length > 0 && all.every(routable) && new Set(all.map(function (a) { return a.id; })).size === all.length; },
    isReadyForTwentyApps: function () { return api.isReadyForRegisteredRoutes(); }, // Historical API name retained.
    safeRoute: function (a) { return a && (a.safeRoute || a.route) || '/pro/workspace/'; }
  };
  root.AfroTools = root.AfroTools || {}; root.AfroTools.proArchitecture = api; root.AfroProArchitecture = api;
})(typeof window !== 'undefined' ? window : globalThis);

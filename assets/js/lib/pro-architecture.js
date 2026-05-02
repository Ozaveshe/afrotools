;(function (root) {
  "use strict";

  function controlRegistry() {
    return root.AfroProAppRegistry || root.AfroTools && root.AfroTools.proAppRegistry || null;
  }

  function dailyRegistry() {
    return root.AfroProDailyOsRegistry || root.AfroTools && root.AfroTools.proDailyOsRegistry || null;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function getControlApps() {
    var api = controlRegistry();
    return api && api.getApps ? api.getApps() : [];
  }

  function getDailyApps() {
    var api = dailyRegistry();
    return api && api.getApps ? api.getApps() : [];
  }

  function getBackboneRoutes() {
    var api = controlRegistry();
    return api && api.getSupportRoutes ? api.getSupportRoutes() : [];
  }

  function decorateApps(items, group) {
    return asArray(items).map(function (app) {
      var copy = clone(app);
      copy.group = group;
      copy.safeRoute = safeRoute(copy);
      return copy;
    });
  }

  function safeRoute(item) {
    if (!item) return "/pro/workspace/";
    if (item.group === "daily") {
      var daily = dailyRegistry();
      return daily && daily.safeRoute ? daily.safeRoute(item) : item.route || "/pro/apps/daily-os/";
    }
    var control = controlRegistry();
    return control && control.safeRoute ? control.safeRoute(item) : item.route || "/pro/apps/";
  }

  function getApps() {
    return decorateApps(getControlApps(), "control").concat(decorateApps(getDailyApps(), "daily"));
  }

  function getApp(id) {
    var apps = getApps();
    for (var i = 0; i < apps.length; i += 1) {
      if (apps[i].id === id) return clone(apps[i]);
    }
    return null;
  }

  function getRouteManifest() {
    var appRoutes = getApps().map(function (app) {
      return {
        id: app.id,
        name: app.name,
        group: app.group,
        route: app.route,
        aliasRoute: app.aliasRoute || "",
        routeExists: app.routeExists !== false,
        routeStatus: app.routeStatus || "shell",
        shellState: app.shellState || "Shell",
        safeRoute: app.safeRoute || safeRoute(app)
      };
    });

    var backboneRoutes = getBackboneRoutes().map(function (route) {
      return {
        id: route.id,
        name: route.name,
        group: "backbone",
        route: route.route,
        aliasRoute: "",
        routeExists: route.routeExists !== false,
        routeStatus: route.routeStatus || "active",
        shellState: route.routeStatus || "active",
        safeRoute: route.safeRoute || route.route
      };
    });

    return appRoutes.concat(backboneRoutes);
  }

  function routeReady(item) {
    return item && item.routeExists !== false;
  }

  function isShell(item) {
    var value = [item.routeStatus, item.shellState, item.statusTone].join(" ").toLowerCase();
    return value.indexOf("shell") !== -1 || value.indexOf("local") !== -1 || value.indexOf("priority") !== -1;
  }

  function isBlocked(item) {
    var value = [item.routeStatus, item.shellState, item.statusTone].join(" ").toLowerCase();
    return value.indexOf("blocked") !== -1;
  }

  function getSummary() {
    var controlApps = decorateApps(getControlApps(), "control");
    var dailyApps = decorateApps(getDailyApps(), "daily");
    var apps = controlApps.concat(dailyApps);
    var backbone = getBackboneRoutes();
    return {
      totalApps: apps.length,
      controlApps: controlApps.length,
      dailyApps: dailyApps.length,
      appRoutesReady: apps.filter(routeReady).length,
      activeApps: apps.filter(function (app) { return app.routeStatus === "active"; }).length,
      shellApps: apps.filter(isShell).length,
      blockedApps: apps.filter(isBlocked).length,
      backboneRoutes: backbone.length,
      backboneReady: backbone.filter(routeReady).length,
      totalRoutableSurfaces: apps.length + backbone.length,
      readyRoutableSurfaces: apps.filter(routeReady).length + backbone.filter(routeReady).length
    };
  }

  function getGroups() {
    return {
      control: decorateApps(getControlApps(), "control"),
      daily: decorateApps(getDailyApps(), "daily"),
      backbone: getBackboneRoutes()
    };
  }

  function isReadyForTwentyApps() {
    var summary = getSummary();
    return summary.controlApps === 10 && summary.dailyApps === 10 && summary.totalApps === 20 && summary.appRoutesReady === 20;
  }

  var api = {
    getControlApps: getControlApps,
    getDailyApps: getDailyApps,
    getBackboneRoutes: getBackboneRoutes,
    getApps: getApps,
    getApp: getApp,
    getGroups: getGroups,
    getRouteManifest: getRouteManifest,
    getSummary: getSummary,
    isReadyForTwentyApps: isReadyForTwentyApps,
    safeRoute: safeRoute
  };

  root.AfroTools = root.AfroTools || {};
  root.AfroTools.proArchitecture = api;
  root.AfroProArchitecture = api;
})(typeof window !== "undefined" ? window : globalThis);

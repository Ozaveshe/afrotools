"use strict";

const routeApi = require("./route-contract");
const { fileToPublicRoute } = require("./canonical-aliases");

const DEFAULT_SITE_ORIGIN = "https://afrotools.com";
const PERMANENT_REDIRECT_CODES = new Set([301, 308]);

function createPreferredPageUrlResolver(options = {}) {
  const siteOrigin = options.siteOrigin || DEFAULT_SITE_ORIGIN;
  const graph = options.graph || routeApi.buildRouteGraph();

  return function resolvePreferredPageUrl(filePath) {
    const servedRoute = fileToPublicRoute(filePath);
    const resolution = routeApi.resolveFinalRoute(graph, servedRoute);
    const finalRoute = resolution.finalRoute;

    if (
      resolution.hops < 1 ||
      !PERMANENT_REDIRECT_CODES.has(resolution.statusCode) ||
      typeof finalRoute !== "string" ||
      !finalRoute.startsWith("/")
    ) {
      return `${siteOrigin}${servedRoute}`;
    }

    return `${siteOrigin}${finalRoute}`;
  };
}

module.exports = {
  createPreferredPageUrlResolver,
};

/* AfroTools — Shipping Engine /engines/shipping-engine.js */
var ShippingEngine = (function() {
  'use strict';

  function findRoute(originCode, destCode) {
    var corridor = null;
    for (var i = 0; i < SHIPPING_ROUTES.corridors.length; i++) {
      if (SHIPPING_ROUTES.corridors[i].originCode === originCode) {
        var dests = SHIPPING_ROUTES.corridors[i].destinations;
        for (var j = 0; j < dests.length; j++) {
          if (dests[j].destCode === destCode) { corridor = dests[j]; break; }
        }
        if (corridor) break;
      }
    }
    return corridor;
  }

  function estimate(originCode, destCode, containerType, cbm, weightKg) {
    var route = findRoute(originCode, destCode);
    var result = { originCode: originCode, destCode: destCode, containerType: containerType, found: !!route };
    if (!route) {
      result.message = 'Direct route not found. Rates may be available via transhipment.';
      return result;
    }
    if (containerType === 'LCL' && route.sea && route.sea['LCL_cbm']) {
      var lcl = route.sea['LCL_cbm'];
      result.sea = {
        minUSD: Math.round(lcl.min * (cbm || 1)),
        maxUSD: Math.round(lcl.max * (cbm || 1)),
        perCBM: lcl,
        cbm: cbm || 1,
        transitDays: route.sea.transitDays,
        type: 'LCL'
      };
    } else if (containerType !== 'LCL' && route.sea && route.sea[containerType]) {
      var sea = route.sea[containerType];
      result.sea = { minUSD: sea.min, maxUSD: sea.max, transitDays: route.sea.transitDays, type: containerType };
    }
    if (route.air && containerType !== '40ft' && containerType !== '40ftHC') {
      result.air = {
        minUSD: route.air.perKg ? Math.round(route.air.perKg.min * (weightKg || 100)) : null,
        maxUSD: route.air.perKg ? Math.round(route.air.perKg.max * (weightKg || 100)) : null,
        perKg: route.air.perKg,
        weightKg: weightKg || 100,
        transitDays: route.air.transitDays
      };
    }
    return result;
  }

  function getOriginPorts() { return SHIPPING_ROUTES.originPorts; }
  function getDestPorts() { return SHIPPING_ROUTES.destPorts; }
  function getContainerTypes() { return SHIPPING_ROUTES.containerTypes; }

  function getDestinations(originCode) {
    var corridor = SHIPPING_ROUTES.corridors.find(function(c){ return c.originCode === originCode; });
    if (!corridor) return [];
    return corridor.destinations.map(function(d) {
      var port = SHIPPING_ROUTES.destPorts.find(function(p){ return p.code === d.destCode; });
      return port || { code: d.destCode, name: d.destCode };
    });
  }

  function getObservations(originCode, destCode, containerType, costResult) {
    var obs = [];
    if (costResult.sea && costResult.air) {
      var seaMid = (costResult.sea.minUSD + costResult.sea.maxUSD) / 2;
      var airMid = (costResult.air.minUSD + costResult.air.maxUSD) / 2;
      var premium = ((airMid - seaMid) / seaMid * 100).toFixed(0);
      obs.push({ type:'info', text:'Air freight costs approximately ' + premium + '% more than sea freight on this route — but saves ' + ((costResult.sea.transitDays.max - costResult.air.transitDays.min)) + '+ days transit time.' });
    }
    if (costResult.sea && costResult.sea.transitDays) {
      var td = costResult.sea.transitDays;
      obs.push({ type:'tip', text:'Typical sea transit: ' + td.min + '–' + td.max + ' days. Add 5–15 days for port clearance at destination.' });
    }
    obs.push({ type:'warn', text:'Rates shown are pre-freight estimates. Final cost depends on shipping line, peak season surcharges, fuel surcharges (BAF), and port congestion charges.' });
    return obs;
  }

  return { estimate: estimate, getOriginPorts: getOriginPorts, getDestPorts: getDestPorts, getContainerTypes: getContainerTypes, getDestinations: getDestinations, findRoute: findRoute, getObservations: getObservations };
})();

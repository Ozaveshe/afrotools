(function initFrenchTransportRouteMap(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./french-route-map.generated.js"));
  } else {
    root.AfroToolsAIFrenchRouteMap = factory(root.AfroToolsAIFrenchRouteMap);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function mergeFrenchTransportRoutes(base) {
  "use strict";
  var current = base && typeof base === "object" ? base : {};
  var routes = Object.assign({}, current.routes || {}, {
  "/tools/car-import-cost/": "/fr/tools/cout-importation-voiture/",
  "/cars/": "/fr/cars/",
  "/tools/ride-fare/": "/fr/tools/tarif-vtc-taxi/",
  "/tools/boda-income/": "/fr/tools/revenu-boda/",
  "/tools/matatu-fare/": "/fr/tools/tarif-matatu-danfo/",
  "/tools/delivery-cost/": "/fr/tools/cout-livraison/",
  "/tools/car-loan-vs-cash/": "/fr/tools/voiture-credit-vs-comptant/",
  "/tools/vehicle-registration/": "/fr/tools/checklist-immatriculation-vehicule/",
  "/tools/roadworthiness/": "/fr/tools/checklist-visite-technique/",
  "/tools/vehicle-depreciation/": "/fr/tools/depreciation-vehicule/",
  "/tools/fleet-fuel/": "/fr/tools/budget-carburant-flotte/",
  "/tools/last-mile-delivery/": "/fr/tools/dernier-kilometre/",
  "/tools/parking-fee/": "/fr/tools/frais-parking/",
  "/tools/route-cost/": "/fr/tools/calculateur-du-cout-d-un-trajet/",
  "/tools/toll-calc/": "/fr/tools/calculateur-frais-peage/",
  "/tools/truck-load/": "/fr/tools/optimiseur-chargement-camion/",
  "/tools/vehicle-operating-cost/": "/fr/tools/cout-utilisation-vehicule/",
  "/tools/vehicle-tracker-roi/": "/fr/tools/roi-traceur-vehicule/"
});
  return Object.freeze(Object.assign({}, current, {
    schemaVersion: 1,
    locale: "fr",
    source: "data/transport/french-parity.json",
    routes: Object.freeze(routes)
  }));
});

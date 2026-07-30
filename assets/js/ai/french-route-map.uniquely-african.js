(function installFrenchUniquelyAfricanRouteMap(root) {
  "use strict";
  var payload = Object.freeze({"schemaVersion":1,"programme":"fr-uniquely-african-parity","source":"data/localization/fr-uniquely-african-parity-manifest.json","denominator":34,"routes":{"/tools/japa-calculator/":"/fr/tools/calculateur-japa/","/tools/mobile-money-fees/":"/fr/tools/frais-mobile-money/","/tools/fintech-fee-watch/":"/fr/tools/suivi-frais-fintech/","/tools/ajo-tracker/":"/fr/tools/suivi-tontine/","/tools/electricity-estimator/":"/fr/tools/estimateur-electricite/","/tools/fuel-cost/":"/fr/tools/cout-carburant/","/tools/hawala-tracker/":"/fr/tools/suivi-hawala/","/tools/burial-cost/":"/fr/tools/cout-funerailles/","/tools/staple-basket/":"/fr/tools/panier-produits-base/","/tools/wholesale-retail-spread/":"/fr/tools/marge-gros-detail/","/tools/land-size/":"/fr/tools/taille-terrain/","/tools/naira-to-words/":"/fr/tools/naira-en-lettres/","/tools/amount-words-ke/":"/fr/tools/montant-lettres-ke/","/tools/amount-words-gh/":"/fr/tools/montant-lettres-gh/","/tools/susu-tracker/":"/fr/tools/suivi-susu/","/tools/whatsapp-link/":"/fr/tools/lien-whatsapp/","/tools/remittance-compare/":"/fr/tools/transfert-argent/","/tools/informal-fx-watch/":"/fr/tools/taux-change-parallele/","/tools/remittance-v2/":"/fr/tools/transfert-v2/","/tools/cost-of-living/":"/fr/tools/cout-de-la-vie/","/tools/afroatlas/":"/fr/tools/afroatlas/","/tools/afropoints/":"/fr/tools/afropoints/","/tools/afrokitchen/":"/fr/tools/afrocuisine/","/tools/africa-conflict/":"/fr/tools/carte-conflits-afrique/","/tools/brideprice-advisor/":"/fr/tools/conseiller-dot/","/tools/ajo-interest/":"/fr/tools/interet-tontine/","/tools/diaspora-guide/":"/fr/tools/guide-diaspora/","/tools/nollywood-pitch/":"/fr/tools/pitch-nollywood/","/tools/okada-income/":"/fr/tools/revenu-okada/","/tools/market-days/":"/fr/tools/jours-marche/","/tools/ajo-chama/":"/fr/tools/ajo-chama/","/tools/afroprices/":"/fr/tools/afroprix/","/tools/ankara-kente-cost/":"/fr/tools/cout-ankara-kente/","/tools/fabric-cost/":"/fr/tools/cout-tissu-matiere/"}});
  var shared = root && root.AfroToolsAIFrenchRouteMap;
  if (!shared || !shared.routes) throw new Error("The base French AI route map must load first.");
  Object.keys(payload.routes).forEach(function (englishRoute) {
    var expected = payload.routes[englishRoute];
    var current = shared.routes[englishRoute];
    if (current && current !== expected) {
      throw new Error("Conflicting French AI route for " + englishRoute);
    }
    shared.routes[englishRoute] = expected;
  });
  root.AfroToolsAIFrenchUniquelyAfricanRouteMap = payload;
})(typeof globalThis !== "undefined" ? globalThis : this);

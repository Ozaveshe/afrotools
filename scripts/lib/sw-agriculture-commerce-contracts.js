"use strict";
const commerce = {
  "coffee-calculator": {
    "input": {
      "countryCode": "KE",
      "species": "arabica",
      "treesPerHa": 1200,
      "yieldLevel": "average",
      "processingMethod": "washed",
      "gradeId": "AB",
      "farmHa": 1,
      "regionIdx": 0
    },
    "description": "Kadiria mavuno, kahawa bichi, mapato na gharama ya uchakataji kwa shamba lako; hakiki bei na mavuno ya eneo."
  },
  "cooperative-calculator": {
    "input": {
      "currency": "KES",
      "coopType": "agri",
      "memberProducePayment": null,
      "producePaymentsIncluded": false,
      "method": "patronage",
      "revenue": 100000,
      "expenses": 70000,
      "members": 50,
      "myProduce": 10,
      "totalProduce": 500,
      "myShares": 10,
      "totalShares": 500,
      "marketPrice": 100,
      "saccoRate": 10,
      "hybridPatronagePct": 70,
      "allocations": {
        "reserve": 20,
        "education": 5,
        "dividend": 20,
        "social": 5,
        "retained": 50
      }
    },
    "description": "Gawa ziada kwa ushiriki, hisa na akiba kwa kanuni unazoingiza, kisha hakiki jumla na sera ya ushirika wako."
  },
  "warehouse-receipt": {
    "input": {
      "countryCode": "KE",
      "commodity": "maize",
      "quantityTonnes": 10,
      "harvestPricePerTonne": 40000,
      "ltvPct": 60,
      "annualRatePct": 14,
      "periodMonths": 6,
      "storagePerTonneMonth": 300,
      "insuranceAnnualPct": 1,
      "handlingPerTonne": 500,
      "priceIncreasePct": 20
    },
    "description": "Linganisha mauzo ya mavuno na ufadhili wa stakabadhi pamoja na gharama."
  }
};
const formScripts = {"coffee-calculator":"/assets/js/lib/sw-coffee-form.js","cooperative-calculator":"/assets/js/lib/sw-cooperative-form.js","warehouse-receipt":"/assets/js/lib/sw-warehouse-receipt-form.js"};
function isCommerceApp(app) { return Object.hasOwn(commerce, app.id); }
function prepareCommerceApp(app) { return isCommerceApp(app) ? { ...app, ...commerce[app.id], scripts: [...app.scripts, formScripts[app.id]] } : app; }
function runtimeScripts(app) { return isCommerceApp(app) ? `<script src="/assets/js/pages/sw-agriculture-commerce.js"></script><script src="/assets/js/lib/sw-accessibility.js" defer></script>` : `<script src="/assets/js/pages/sw-agriculture-assigned-parity.js"></script>`; }
module.exports = {isCommerceApp,prepareCommerceApp,runtimeScripts};

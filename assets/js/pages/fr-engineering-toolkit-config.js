(function () {
  'use strict';
  window.AfroFrenchEngineeringToolkitConfigs = {
  "/fr/ingenierie/afrodraft/": {
    "id": "afrodraft",
    "source": "/engineering/afrodraft/",
    "route": "/fr/ingenierie/afrodraft/",
    "kind": "",
    "floating": false,
    "afrodraft": false,
    "name": "AfroDraft CAO 2D — dossier de revue",
    "kicker": "Revue technique",
    "description": "Préparez et exportez un dessin technique 2D directement dans le navigateur.",
    "modes": [
      "Planification initiale",
      "Revue de l’estimation",
      "Dossier de chantier",
      "Contrôle technique"
    ],
    "modeValues": [
      "Student drawing",
      "Site sketch",
      "Approval sheet",
      "Contractor detail"
    ],
    "presets": [],
    "checks": [
      "Définissez les unités, tracez la géométrie, ajoutez les cotes, puis contrôlez les calques avant export.",
      "Vérifiez toutes les dimensions sur site et faites valider les plans destinés à l’exécution par un professionnel qualifié.",
      "Consignez les dimensions, unités, prix, taux de perte et exclusions utilisés.",
      "Comparez le résultat aux plans, aux relevés de site et aux devis de fournisseurs."
    ],
    "risks": [
      "Vérifiez toutes les dimensions sur site et faites valider les plans destinés à l’exécution par un professionnel qualifié.",
      "Une hypothèse non vérifiée peut modifier les quantités, le coût ou la sécurité du projet.",
      "Les prix, normes et conditions de chantier varient selon le pays et la localité."
    ],
    "procurement": [
      "Dimensions et quantités vérifiées",
      "Hypothèses et exclusions datées",
      "Prix et disponibilité confirmés localement",
      "Marge de perte ou de sécurité justifiée",
      "Plans, relevés et devis de référence",
      "Validation professionnelle requise avant exécution"
    ],
    "sequence": [
      "Renseigner les données du projet",
      "Lancer le calcul ou préparer le plan",
      "Contrôler les hypothèses et les alertes",
      "Comparer les résultats aux sources locales",
      "Enregistrer ou exporter le dossier de décision"
    ],
    "companions": [
      {
        "label": "Outil associé 1",
        "href": "/engineering/afrodraft/app"
      },
      {
        "label": "Planificateur de plan d’étage",
        "href": "/fr/ingenierie/planificateur-etage/"
      },
      {
        "label": "Constructeur de devis quantitatif",
        "href": "/fr/tools/devis-quantitatif/"
      }
    ],
    "thresholds": [],
    "benchmark": ""
  },
  "/fr/ingenierie/planificateur-etage/": {
    "id": "afroplan-floor-planner",
    "source": "/engineering/floor-planner/",
    "route": "/fr/ingenierie/planificateur-etage/",
    "kind": "",
    "floating": true,
    "afrodraft": false,
    "name": "Planificateur de plan d’étage — dossier de revue",
    "kicker": "Revue technique",
    "description": "Composez un plan d’étage, estimez les surfaces et préparez un quantitatif local.",
    "modes": [
      "Planification initiale",
      "Revue de l’estimation",
      "Dossier de chantier",
      "Contrôle technique"
    ],
    "modeValues": [
      "New bungalow",
      "Apartment layout",
      "Rental unit",
      "Shop conversion"
    ],
    "presets": [
      {
        "label": "Scénario 1 — Planificateur de plan d’étage",
        "values": {
          "fpAiInput": "3 bedroom bungalow with living room, kitchen, 2 bathrooms, front porch, and laundry on a 60x120 ft plot"
        },
        "note": "",
        "autoRun": false
      },
      {
        "label": "Scénario 2 — Planificateur de plan d’étage",
        "values": {
          "fpAiInput": "2 bedroom rental apartment with open living area, cross ventilation, compact kitchen, and shared bathroom stack"
        },
        "note": "",
        "autoRun": false
      }
    ],
    "checks": [
      "Choisissez un modèle ou dessinez les pièces, portes et fenêtres, puis examinez les surfaces et le coût indicatif.",
      "Le plan obtenu sert à la préparation du projet et ne remplace pas un plan architectural ou structurel approuvé.",
      "Consignez les dimensions, unités, prix, taux de perte et exclusions utilisés.",
      "Comparez le résultat aux plans, aux relevés de site et aux devis de fournisseurs."
    ],
    "risks": [
      "Le plan obtenu sert à la préparation du projet et ne remplace pas un plan architectural ou structurel approuvé.",
      "Une hypothèse non vérifiée peut modifier les quantités, le coût ou la sécurité du projet.",
      "Les prix, normes et conditions de chantier varient selon le pays et la localité."
    ],
    "procurement": [
      "Dimensions et quantités vérifiées",
      "Hypothèses et exclusions datées",
      "Prix et disponibilité confirmés localement",
      "Marge de perte ou de sécurité justifiée",
      "Plans, relevés et devis de référence"
    ],
    "sequence": [
      "Renseigner les données du projet",
      "Lancer le calcul ou préparer le plan",
      "Contrôler les hypothèses et les alertes",
      "Comparer les résultats aux sources locales",
      "Enregistrer ou exporter le dossier de décision"
    ],
    "companions": [
      {
        "label": "Estimateur de coût de construction",
        "href": "/fr/tools/plan-etage/"
      },
      {
        "label": "Dimensionnement des fenêtres et portes",
        "href": "/fr/tools/dimensionnement-fenetres-portes/"
      },
      {
        "label": "Constructeur de devis quantitatif",
        "href": "/fr/tools/devis-quantitatif/"
      }
    ],
    "thresholds": [],
    "benchmark": "Comparez cette estimation aux offres locales, aux relevés de site et aux exigences professionnelles applicables."
  },
  "/fr/tools/calculateur-solaire/": {
    "id": "solar-calculator",
    "source": "/tools/solar-calculator/",
    "route": "/fr/tools/calculateur-solaire/",
    "kind": "",
    "floating": false,
    "afrodraft": false,
    "name": "Calculateur solaire — dossier de revue",
    "kicker": "Revue technique",
    "description": "Dimensionnez les panneaux, la batterie et l’onduleur à partir de vos usages électriques.",
    "modes": [
      "Planification initiale",
      "Revue de l’estimation",
      "Dossier de chantier",
      "Contrôle technique"
    ],
    "modeValues": [
      "Home backup",
      "Shop uptime",
      "Clinic or school",
      "Generator replacement"
    ],
    "presets": [
      {
        "label": "Scénario 1 — Calculateur solaire",
        "values": {
          "systemType": "hybrid",
          "panelWatts": "450",
          "battType": "lifepo4",
          "backupDays": "2",
          "currency": "NGN",
          "degradation": "0.7",
          "genCost": "950"
        },
        "note": "",
        "autoRun": false
      },
      {
        "label": "Scénario 2 — Calculateur solaire",
        "values": {
          "systemType": "hybrid",
          "panelWatts": "550",
          "battType": "lifepo4",
          "backupDays": "1",
          "currency": "KES",
          "degradation": "0.6"
        },
        "note": "",
        "autoRun": false
      }
    ],
    "checks": [
      "Additionnez les appareils, leurs puissances et leurs durées d’utilisation, puis appliquez les heures solaires et la marge de sécurité.",
      "Confirmez l’irradiation, les pertes, la tension et les prix avec un installateur avant achat.",
      "Consignez les dimensions, unités, prix, taux de perte et exclusions utilisés.",
      "Comparez le résultat aux plans, aux relevés de site et aux devis de fournisseurs."
    ],
    "risks": [
      "Confirmez l’irradiation, les pertes, la tension et les prix avec un installateur avant achat.",
      "Une hypothèse non vérifiée peut modifier les quantités, le coût ou la sécurité du projet.",
      "Les prix, normes et conditions de chantier varient selon le pays et la localité."
    ],
    "procurement": [
      "Dimensions et quantités vérifiées",
      "Hypothèses et exclusions datées",
      "Prix et disponibilité confirmés localement",
      "Marge de perte ou de sécurité justifiée"
    ],
    "sequence": [
      "Renseigner les données du projet",
      "Lancer le calcul ou préparer le plan",
      "Contrôler les hypothèses et les alertes",
      "Comparer les résultats aux sources locales",
      "Enregistrer ou exporter le dossier de décision"
    ],
    "companions": [
      {
        "label": "Dimensionnement de groupe électrogène",
        "href": "/fr/tools/dimensionnement-generateur/"
      },
      {
        "label": "Calculateur de charge électrique",
        "href": "/fr/tools/charge-electrique/"
      },
      {
        "label": "Constructeur de devis quantitatif",
        "href": "/fr/tools/devis-quantitatif/"
      }
    ],
    "thresholds": [
      {
        "id": "backupDays",
        "min": 3,
        "message": "Confirmez l’irradiation, les pertes, la tension et les prix avec un installateur avant achat."
      }
    ],
    "benchmark": "Comparez cette estimation aux offres locales, aux relevés de site et aux exigences professionnelles applicables."
  },
  "/fr/tools/plan-etage/": {
    "id": "floor-plan",
    "source": "/tools/floor-plan/",
    "route": "/fr/tools/plan-etage/",
    "kind": "",
    "floating": false,
    "afrodraft": false,
    "name": "Estimateur de coût de construction — dossier de revue",
    "kicker": "Revue technique",
    "description": "Estimez la surface bâtie et le budget de construction selon la ville et le niveau de finition.",
    "modes": [
      "Planification initiale",
      "Revue de l’estimation",
      "Dossier de chantier",
      "Contrôle technique"
    ],
    "modeValues": [
      "Early budget",
      "Client feasibility",
      "Contractor comparison",
      "Loan estimate"
    ],
    "presets": [
      {
        "label": "Scénario 1 — Estimateur de coût de construction",
        "values": {
          "buildType": "bungalow",
          "finishQuality": "standard",
          "location": "lagos"
        },
        "note": "",
        "autoRun": false
      },
      {
        "label": "Scénario 2 — Estimateur de coût de construction",
        "values": {
          "buildType": "apartment",
          "finishQuality": "premium",
          "location": "nairobi"
        },
        "note": "",
        "autoRun": false
      }
    ],
    "checks": [
      "Renseignez le type de bâtiment, les pièces, la surface et la finition pour obtenir un budget ventilé.",
      "Les prix sont des hypothèses de planification; exigez des devis locaux et une étude de site.",
      "Consignez les dimensions, unités, prix, taux de perte et exclusions utilisés.",
      "Comparez le résultat aux plans, aux relevés de site et aux devis de fournisseurs."
    ],
    "risks": [
      "Les prix sont des hypothèses de planification; exigez des devis locaux et une étude de site.",
      "Une hypothèse non vérifiée peut modifier les quantités, le coût ou la sécurité du projet.",
      "Les prix, normes et conditions de chantier varient selon le pays et la localité."
    ],
    "procurement": [
      "Dimensions et quantités vérifiées",
      "Hypothèses et exclusions datées",
      "Prix et disponibilité confirmés localement",
      "Marge de perte ou de sécurité justifiée",
      "Plans, relevés et devis de référence"
    ],
    "sequence": [
      "Renseigner les données du projet",
      "Lancer le calcul ou préparer le plan",
      "Contrôler les hypothèses et les alertes",
      "Comparer les résultats aux sources locales",
      "Enregistrer ou exporter le dossier de décision"
    ],
    "companions": [
      {
        "label": "Constructeur de devis quantitatif",
        "href": "/fr/tools/devis-quantitatif/"
      },
      {
        "label": "Planificateur de plan d’étage",
        "href": "/fr/ingenierie/planificateur-etage/"
      },
      {
        "label": "Estimateur de rénovation",
        "href": "/fr/tools/cout-renovation/"
      }
    ],
    "thresholds": [],
    "benchmark": "Comparez cette estimation aux offres locales, aux relevés de site et aux exigences professionnelles applicables."
  },
  "/fr/tools/devis-quantitatif/": {
    "id": "boq-generator",
    "source": "/tools/boq-builder/",
    "route": "/fr/tools/devis-quantitatif/",
    "kind": "",
    "floating": false,
    "afrodraft": false,
    "name": "Constructeur de devis quantitatif — dossier de revue",
    "kicker": "Revue technique",
    "description": "Préparez un devis quantitatif structuré avec postes, quantités, prix unitaires et totaux.",
    "modes": [
      "Planification initiale",
      "Revue de l’estimation",
      "Dossier de chantier",
      "Contrôle technique"
    ],
    "modeValues": [
      "Tender issue",
      "Client budget",
      "Contractor pricing",
      "Variation pricing"
    ],
    "presets": [],
    "checks": [
      "Sélectionnez un modèle, adaptez chaque ligne, puis vérifiez sous-totaux, taxes, marge et contingence.",
      "Contrôlez les métrés et les prix auprès du métreur et des fournisseurs avant consultation.",
      "Consignez les dimensions, unités, prix, taux de perte et exclusions utilisés.",
      "Comparez le résultat aux plans, aux relevés de site et aux devis de fournisseurs."
    ],
    "risks": [
      "Contrôlez les métrés et les prix auprès du métreur et des fournisseurs avant consultation.",
      "Une hypothèse non vérifiée peut modifier les quantités, le coût ou la sécurité du projet.",
      "Les prix, normes et conditions de chantier varient selon le pays et la localité."
    ],
    "procurement": [
      "Dimensions et quantités vérifiées",
      "Hypothèses et exclusions datées",
      "Prix et disponibilité confirmés localement",
      "Marge de perte ou de sécurité justifiée",
      "Plans, relevés et devis de référence"
    ],
    "sequence": [
      "Renseigner les données du projet",
      "Lancer le calcul ou préparer le plan",
      "Contrôler les hypothèses et les alertes",
      "Comparer les résultats aux sources locales",
      "Enregistrer ou exporter le dossier de décision"
    ],
    "companions": [
      {
        "label": "Calculateur de dosage du béton",
        "href": "/fr/tools/dosage-beton/"
      },
      {
        "label": "Calculateur d’armatures",
        "href": "/fr/tools/calculateur-armature/"
      },
      {
        "label": "Calculateur de toiture",
        "href": "/fr/tools/calculateur-toiture/"
      }
    ],
    "thresholds": [],
    "benchmark": "Comparez cette estimation aux offres locales, aux relevés de site et aux exigences professionnelles applicables."
  },
  "/fr/tools/calcul-structure/": {
    "id": "structural-calc",
    "source": "/tools/structural-calc/",
    "route": "/fr/tools/calcul-structure/",
    "kind": "",
    "floating": false,
    "afrodraft": false,
    "name": "Calculateur de structure — dossier de revue",
    "kicker": "Revue technique",
    "description": "Effectuez un prédimensionnement indicatif des poutres et des charges.",
    "modes": [
      "Planification initiale",
      "Revue de l’estimation",
      "Dossier de chantier",
      "Contrôle technique"
    ],
    "modeValues": [
      "Beam check",
      "Column check",
      "Slab check",
      "Footing check"
    ],
    "presets": [
      {
        "label": "Scénario 1 — Calculateur de structure",
        "values": {
          "b-span": "4.5",
          "b-udl": "12",
          "b-fcu": "25",
          "b-fy": "500",
          "b-width": "225",
          "b-cover": "25"
        },
        "note": "",
        "autoRun": false
      },
      {
        "label": "Scénario 2 — Calculateur de structure",
        "values": {
          "f-load": "450",
          "f-sbc": "150",
          "f-fcu": "25",
          "f-colsize": "300"
        },
        "note": "",
        "autoRun": false
      }
    ],
    "checks": [
      "Saisissez la portée, les charges, les matériaux et les conditions d’appui pour examiner les dimensions proposées.",
      "Ce prédimensionnement ne constitue pas une note de calcul signée; faites vérifier la structure par un ingénieur.",
      "Consignez les dimensions, unités, prix, taux de perte et exclusions utilisés.",
      "Comparez le résultat aux plans, aux relevés de site et aux devis de fournisseurs."
    ],
    "risks": [
      "Ce prédimensionnement ne constitue pas une note de calcul signée; faites vérifier la structure par un ingénieur.",
      "Une hypothèse non vérifiée peut modifier les quantités, le coût ou la sécurité du projet.",
      "Les prix, normes et conditions de chantier varient selon le pays et la localité."
    ],
    "procurement": [
      "Dimensions et quantités vérifiées",
      "Hypothèses et exclusions datées",
      "Prix et disponibilité confirmés localement",
      "Marge de perte ou de sécurité justifiée",
      "Plans, relevés et devis de référence"
    ],
    "sequence": [
      "Renseigner les données du projet",
      "Lancer le calcul ou préparer le plan",
      "Contrôler les hypothèses et les alertes",
      "Comparer les résultats aux sources locales",
      "Enregistrer ou exporter le dossier de décision"
    ],
    "companions": [
      {
        "label": "Calculateur d’armatures",
        "href": "/fr/tools/calculateur-armature/"
      },
      {
        "label": "Calculateur de dosage du béton",
        "href": "/fr/tools/dosage-beton/"
      },
      {
        "label": "Constructeur de devis quantitatif",
        "href": "/fr/tools/devis-quantitatif/"
      }
    ],
    "thresholds": [],
    "benchmark": "Comparez cette estimation aux offres locales, aux relevés de site et aux exigences professionnelles applicables."
  },
  "/fr/tools/charge-electrique/": {
    "id": "electrical-load",
    "source": "/tools/electrical-load/",
    "route": "/fr/tools/charge-electrique/",
    "kind": "",
    "floating": false,
    "afrodraft": false,
    "name": "Calculateur de charge électrique — dossier de revue",
    "kicker": "Revue technique",
    "description": "Totalisez les charges, le courant et la puissance de pointe d’une installation.",
    "modes": [
      "Planification initiale",
      "Revue de l’estimation",
      "Dossier de chantier",
      "Contrôle technique"
    ],
    "modeValues": [
      "House wiring",
      "Shop load",
      "Office panel",
      "Generator backup"
    ],
    "presets": [
      {
        "label": "Scénario 1 — Calculateur de charge électrique",
        "values": {
          "country": "NG",
          "phase": "1",
          "diversity": "0.7"
        },
        "note": "",
        "autoRun": false
      },
      {
        "label": "Scénario 2 — Calculateur de charge électrique",
        "values": {
          "country": "KE",
          "phase": "3",
          "diversity": "0.8"
        },
        "note": "",
        "autoRun": false
      }
    ],
    "checks": [
      "Ajoutez les appareils, leur quantité, leur puissance et leur simultanéité, puis contrôlez phase, tension et réserve.",
      "Un électricien qualifié doit confirmer les protections, câbles, mise à la terre et règles locales.",
      "Consignez les dimensions, unités, prix, taux de perte et exclusions utilisés.",
      "Comparez le résultat aux plans, aux relevés de site et aux devis de fournisseurs."
    ],
    "risks": [
      "Un électricien qualifié doit confirmer les protections, câbles, mise à la terre et règles locales.",
      "Une hypothèse non vérifiée peut modifier les quantités, le coût ou la sécurité du projet.",
      "Les prix, normes et conditions de chantier varient selon le pays et la localité."
    ],
    "procurement": [
      "Dimensions et quantités vérifiées",
      "Hypothèses et exclusions datées",
      "Prix et disponibilité confirmés localement",
      "Marge de perte ou de sécurité justifiée",
      "Plans, relevés et devis de référence"
    ],
    "sequence": [
      "Renseigner les données du projet",
      "Lancer le calcul ou préparer le plan",
      "Contrôler les hypothèses et les alertes",
      "Comparer les résultats aux sources locales",
      "Enregistrer ou exporter le dossier de décision"
    ],
    "companions": [
      {
        "label": "Dimensionnement de groupe électrogène",
        "href": "/fr/tools/dimensionnement-generateur/"
      },
      {
        "label": "Calculateur solaire",
        "href": "/fr/tools/calculateur-solaire/"
      },
      {
        "label": "Constructeur de devis quantitatif",
        "href": "/fr/tools/devis-quantitatif/"
      }
    ],
    "thresholds": [],
    "benchmark": "Comparez cette estimation aux offres locales, aux relevés de site et aux exigences professionnelles applicables."
  },
  "/fr/tools/dosage-beton/": {
    "id": "concrete-calc",
    "source": "/tools/concrete-mix/",
    "route": "/fr/tools/dosage-beton/",
    "kind": "",
    "floating": false,
    "afrodraft": false,
    "name": "Calculateur de dosage du béton — dossier de revue",
    "kicker": "Revue technique",
    "description": "Calculez les volumes de ciment, sable, granulats et eau pour un ouvrage.",
    "modes": [
      "Planification initiale",
      "Revue de l’estimation",
      "Dossier de chantier",
      "Contrôle technique"
    ],
    "modeValues": [
      "Slab pour",
      "Foundation pour",
      "Column pour",
      "Small site batching"
    ],
    "presets": [
      {
        "label": "Scénario 1 — Calculateur de dosage du béton",
        "values": {
          "grade": "M20",
          "shape": "slab",
          "sLen": "10",
          "sWid": "8",
          "sDep": "0.125",
          "bagSize": "50",
          "wastage": "10",
          "country": "NG"
        },
        "note": "",
        "autoRun": false
      },
      {
        "label": "Scénario 2 — Calculateur de dosage du béton",
        "values": {
          "grade": "M25",
          "shape": "column",
          "cW": "0.3",
          "cD": "0.3",
          "cH": "3",
          "cQ": "8",
          "wastage": "10"
        },
        "note": "",
        "autoRun": false
      }
    ],
    "checks": [
      "Renseignez les dimensions, le dosage et la marge de perte pour obtenir les quantités de matériaux.",
      "Adaptez le mélange à la résistance, aux granulats, à l’humidité et aux prescriptions du projet.",
      "Consignez les dimensions, unités, prix, taux de perte et exclusions utilisés.",
      "Comparez le résultat aux plans, aux relevés de site et aux devis de fournisseurs."
    ],
    "risks": [
      "Adaptez le mélange à la résistance, aux granulats, à l’humidité et aux prescriptions du projet.",
      "Une hypothèse non vérifiée peut modifier les quantités, le coût ou la sécurité du projet.",
      "Les prix, normes et conditions de chantier varient selon le pays et la localité."
    ],
    "procurement": [
      "Dimensions et quantités vérifiées",
      "Hypothèses et exclusions datées",
      "Prix et disponibilité confirmés localement",
      "Marge de perte ou de sécurité justifiée",
      "Plans, relevés et devis de référence",
      "Validation professionnelle requise avant exécution"
    ],
    "sequence": [
      "Renseigner les données du projet",
      "Lancer le calcul ou préparer le plan",
      "Contrôler les hypothèses et les alertes",
      "Comparer les résultats aux sources locales",
      "Enregistrer ou exporter le dossier de décision"
    ],
    "companions": [
      {
        "label": "Calculateur d’armatures",
        "href": "/fr/tools/calculateur-armature/"
      },
      {
        "label": "Calculateur de structure",
        "href": "/fr/tools/calcul-structure/"
      },
      {
        "label": "Constructeur de devis quantitatif",
        "href": "/fr/tools/devis-quantitatif/"
      }
    ],
    "thresholds": [],
    "benchmark": "Comparez cette estimation aux offres locales, aux relevés de site et aux exigences professionnelles applicables."
  },
  "/fr/tools/calculateur-peinture/": {
    "id": "paint-calc",
    "source": "/tools/paint-calculator/",
    "route": "/fr/tools/calculateur-peinture/",
    "kind": "",
    "floating": false,
    "afrodraft": false,
    "name": "Calculateur de peinture — dossier de revue",
    "kicker": "Revue technique",
    "description": "Estimez les litres, couches et pots nécessaires pour les surfaces à peindre.",
    "modes": [
      "Planification initiale",
      "Revue de l’estimation",
      "Dossier de chantier",
      "Contrôle technique"
    ],
    "modeValues": [
      "Interior repaint",
      "New plaster",
      "Exterior weathercoat",
      "Rental refresh"
    ],
    "presets": [
      {
        "label": "Scénario 1 — Calculateur de peinture",
        "values": {
          "unit": "m",
          "roomShape": "rect",
          "length": "5",
          "width": "4",
          "height": "3",
          "ceiling": "yes",
          "paintType": "emulsion",
          "surfaceType": "new",
          "coats": "2",
          "brandCountry": "NG"
        },
        "note": "",
        "autoRun": false
      },
      {
        "label": "Scénario 2 — Calculateur de peinture",
        "values": {
          "paintType": "weathercoat",
          "surfaceType": "rough",
          "coats": "2",
          "brandCountry": "ZA"
        },
        "note": "",
        "autoRun": false
      }
    ],
    "checks": [
      "Saisissez murs, ouvertures, rendement, nombre de couches et marge de perte.",
      "Le rendement réel dépend du support, de la préparation, de la couleur et du produit choisi.",
      "Consignez les dimensions, unités, prix, taux de perte et exclusions utilisés.",
      "Comparez le résultat aux plans, aux relevés de site et aux devis de fournisseurs."
    ],
    "risks": [
      "Le rendement réel dépend du support, de la préparation, de la couleur et du produit choisi.",
      "Une hypothèse non vérifiée peut modifier les quantités, le coût ou la sécurité du projet.",
      "Les prix, normes et conditions de chantier varient selon le pays et la localité."
    ],
    "procurement": [
      "Dimensions et quantités vérifiées",
      "Hypothèses et exclusions datées",
      "Prix et disponibilité confirmés localement",
      "Marge de perte ou de sécurité justifiée",
      "Plans, relevés et devis de référence",
      "Validation professionnelle requise avant exécution"
    ],
    "sequence": [
      "Renseigner les données du projet",
      "Lancer le calcul ou préparer le plan",
      "Contrôler les hypothèses et les alertes",
      "Comparer les résultats aux sources locales",
      "Enregistrer ou exporter le dossier de décision"
    ],
    "companions": [
      {
        "label": "Estimateur de rénovation",
        "href": "/fr/tools/cout-renovation/"
      },
      {
        "label": "Constructeur de devis quantitatif",
        "href": "/fr/tools/devis-quantitatif/"
      },
      {
        "label": "Calculateur de carrelage",
        "href": "/fr/tools/calculateur-carrelage/"
      }
    ],
    "thresholds": [],
    "benchmark": "Comparez cette estimation aux offres locales, aux relevés de site et aux exigences professionnelles applicables."
  },
  "/fr/tools/calculateur-carrelage/": {
    "id": "tiles-calc",
    "source": "/tools/tiles-calc/",
    "route": "/fr/tools/calculateur-carrelage/",
    "kind": "",
    "floating": false,
    "afrodraft": false,
    "name": "Calculateur de carrelage — dossier de revue",
    "kicker": "Revue technique",
    "description": "Calculez le nombre de carreaux, boîtes, colle et joints nécessaires.",
    "modes": [
      "Planification initiale",
      "Revue de l’estimation",
      "Dossier de chantier",
      "Contrôle technique"
    ],
    "modeValues": [
      "Floor tiling",
      "Bathroom walls",
      "Kitchen splashback",
      "External paving"
    ],
    "presets": [
      {
        "label": "Scénario 1 — Calculateur de carrelage",
        "values": {
          "roomLength": "6",
          "roomWidth": "4",
          "surfaceType": "floor",
          "tileSize": "60x60",
          "wastage": "10",
          "pattern": "straight"
        },
        "note": "",
        "autoRun": false
      },
      {
        "label": "Scénario 2 — Calculateur de carrelage",
        "values": {
          "roomLength": "3",
          "roomWidth": "2.4",
          "surfaceType": "both",
          "wallHeight": "2.4",
          "tileSize": "30x60",
          "wastage": "15",
          "pattern": "brick"
        },
        "note": "",
        "autoRun": false
      }
    ],
    "checks": [
      "Renseignez la surface, le format du carreau, le contenu des boîtes et la marge de coupe.",
      "Vérifiez le calepinage, les lots et les réserves avant commande.",
      "Consignez les dimensions, unités, prix, taux de perte et exclusions utilisés.",
      "Comparez le résultat aux plans, aux relevés de site et aux devis de fournisseurs."
    ],
    "risks": [
      "Vérifiez le calepinage, les lots et les réserves avant commande.",
      "Une hypothèse non vérifiée peut modifier les quantités, le coût ou la sécurité du projet.",
      "Les prix, normes et conditions de chantier varient selon le pays et la localité."
    ],
    "procurement": [
      "Dimensions et quantités vérifiées",
      "Hypothèses et exclusions datées",
      "Prix et disponibilité confirmés localement",
      "Marge de perte ou de sécurité justifiée",
      "Plans, relevés et devis de référence",
      "Validation professionnelle requise avant exécution"
    ],
    "sequence": [
      "Renseigner les données du projet",
      "Lancer le calcul ou préparer le plan",
      "Contrôler les hypothèses et les alertes",
      "Comparer les résultats aux sources locales",
      "Enregistrer ou exporter le dossier de décision"
    ],
    "companions": [
      {
        "label": "Calculateur de peinture",
        "href": "/fr/tools/calculateur-peinture/"
      },
      {
        "label": "Estimateur de rénovation",
        "href": "/fr/tools/cout-renovation/"
      },
      {
        "label": "Constructeur de devis quantitatif",
        "href": "/fr/tools/devis-quantitatif/"
      }
    ],
    "thresholds": [],
    "benchmark": "Comparez cette estimation aux offres locales, aux relevés de site et aux exigences professionnelles applicables."
  },
  "/fr/tools/dimensionnement-citerne/": {
    "id": "water-tank",
    "source": "/tools/water-tank/",
    "route": "/fr/tools/dimensionnement-citerne/",
    "kind": "",
    "floating": false,
    "afrodraft": false,
    "name": "Dimensionnement de réservoir d’eau — dossier de revue",
    "kicker": "Revue technique",
    "description": "Dimensionnez le stockage selon les usagers, la consommation quotidienne et l’autonomie souhaitée.",
    "modes": [
      "Planification initiale",
      "Revue de l’estimation",
      "Dossier de chantier",
      "Contrôle technique"
    ],
    "modeValues": [
      "Household backup",
      "Compound storage",
      "School storage",
      "Rainwater harvesting"
    ],
    "presets": [
      {
        "label": "Scénario 1 — Dimensionnement de réservoir d’eau",
        "values": {
          "people": "5",
          "propertyType": "duplex",
          "reliability": "3",
          "backupDays": "3",
          "country": "NG",
          "tankPosition": "elevated",
          "rainwater": "no"
        },
        "note": "",
        "autoRun": false
      },
      {
        "label": "Scénario 2 — Dimensionnement de réservoir d’eau",
        "values": {
          "people": "6",
          "propertyType": "bungalow",
          "reliability": "5",
          "backupDays": "5",
          "rainwater": "yes",
          "roofArea": "120"
        },
        "note": "",
        "autoRun": false
      }
    ],
    "checks": [
      "Le contrat accepté calcule le besoin quotidien, applique l’autonomie et la réserve, puis recommande une capacité standard.",
      "Confirmez la qualité de l’eau, la fondation, la pompe, les canalisations et les règles sanitaires.",
      "Consignez les dimensions, unités, prix, taux de perte et exclusions utilisés.",
      "Comparez le résultat aux plans, aux relevés de site et aux devis de fournisseurs."
    ],
    "risks": [
      "Confirmez la qualité de l’eau, la fondation, la pompe, les canalisations et les règles sanitaires.",
      "Une hypothèse non vérifiée peut modifier les quantités, le coût ou la sécurité du projet.",
      "Les prix, normes et conditions de chantier varient selon le pays et la localité."
    ],
    "procurement": [
      "Dimensions et quantités vérifiées",
      "Hypothèses et exclusions datées",
      "Prix et disponibilité confirmés localement",
      "Marge de perte ou de sécurité justifiée",
      "Plans, relevés et devis de référence",
      "Validation professionnelle requise avant exécution"
    ],
    "sequence": [
      "Renseigner les données du projet",
      "Lancer le calcul ou préparer le plan",
      "Contrôler les hypothèses et les alertes",
      "Comparer les résultats aux sources locales",
      "Enregistrer ou exporter le dossier de décision"
    ],
    "companions": [
      {
        "label": "Calculateur de matériaux de plomberie",
        "href": "/fr/tools/materiaux-plomberie/"
      },
      {
        "label": "Estimateur de coût de forage",
        "href": "/fr/tools/cout-forage/"
      },
      {
        "label": "Constructeur de devis quantitatif",
        "href": "/fr/tools/devis-quantitatif/"
      }
    ],
    "thresholds": [],
    "benchmark": "Comparez cette estimation aux offres locales, aux relevés de site et aux exigences professionnelles applicables."
  },
  "/fr/tools/calculateur-toiture/": {
    "id": "roofing-calc",
    "source": "/tools/roof-calculator/",
    "route": "/fr/tools/calculateur-toiture/",
    "kind": "",
    "floating": false,
    "afrodraft": false,
    "name": "Calculateur de toiture — dossier de revue",
    "kicker": "Revue technique",
    "description": "Estimez la surface de couverture, les feuilles, liteaux et accessoires.",
    "modes": [
      "Planification initiale",
      "Revue de l’estimation",
      "Dossier de chantier",
      "Contrôle technique"
    ],
    "modeValues": [
      "New roof",
      "Replacement roof",
      "Small extension",
      "Warehouse roof"
    ],
    "presets": [
      {
        "label": "Scénario 1 — Calculateur de toiture",
        "values": {
          "bldgLength": "12",
          "bldgWidth": "9",
          "roofType": "gable",
          "roofPitch": "25",
          "overhang": "0.45",
          "sections": "2",
          "material": "longspan",
          "wastage": "10"
        },
        "note": "",
        "autoRun": false
      },
      {
        "label": "Scénario 2 — Calculateur de toiture",
        "values": {
          "roofType": "hip",
          "roofPitch": "30",
          "material": "steptile",
          "wastage": "15"
        },
        "note": "",
        "autoRun": false
      }
    ],
    "checks": [
      "Saisissez longueur, largeur, pente, débords, type de couverture et marge de coupe.",
      "Faites contrôler la charpente, les fixations, le vent, l’étanchéité et les détails de rive.",
      "Consignez les dimensions, unités, prix, taux de perte et exclusions utilisés.",
      "Comparez le résultat aux plans, aux relevés de site et aux devis de fournisseurs."
    ],
    "risks": [
      "Faites contrôler la charpente, les fixations, le vent, l’étanchéité et les détails de rive.",
      "Une hypothèse non vérifiée peut modifier les quantités, le coût ou la sécurité du projet.",
      "Les prix, normes et conditions de chantier varient selon le pays et la localité."
    ],
    "procurement": [
      "Dimensions et quantités vérifiées",
      "Hypothèses et exclusions datées",
      "Prix et disponibilité confirmés localement",
      "Marge de perte ou de sécurité justifiée",
      "Plans, relevés et devis de référence",
      "Validation professionnelle requise avant exécution",
      "Dimensions et quantités vérifiées"
    ],
    "sequence": [
      "Renseigner les données du projet",
      "Lancer le calcul ou préparer le plan",
      "Contrôler les hypothèses et les alertes",
      "Comparer les résultats aux sources locales",
      "Enregistrer ou exporter le dossier de décision"
    ],
    "companions": [
      {
        "label": "Calculateur d’échafaudage",
        "href": "/fr/tools/calculateur-echafaudage/"
      },
      {
        "label": "Estimateur de coût de construction",
        "href": "/fr/tools/plan-etage/"
      },
      {
        "label": "Constructeur de devis quantitatif",
        "href": "/fr/tools/devis-quantitatif/"
      }
    ],
    "thresholds": [],
    "benchmark": "Comparez cette estimation aux offres locales, aux relevés de site et aux exigences professionnelles applicables."
  },
  "/fr/tools/cout-forage/": {
    "id": "borehole-cost",
    "source": "/tools/borehole-cost/",
    "route": "/fr/tools/cout-forage/",
    "kind": "",
    "floating": false,
    "afrodraft": false,
    "name": "Estimateur de coût de forage — dossier de revue",
    "kicker": "Revue technique",
    "description": "Préparez un budget de forage, tubage, pompe, essais et équipements.",
    "modes": [
      "Planification initiale",
      "Revue de l’estimation",
      "Dossier de chantier",
      "Contrôle technique"
    ],
    "modeValues": [
      "Domestic borehole",
      "Commercial supply",
      "Irrigation",
      "Community water"
    ],
    "presets": [
      {
        "label": "Scénario 1 — Estimateur de coût de forage",
        "values": {
          "country": "ng",
          "purpose": "domestic",
          "depth": "80",
          "geology": "hard",
          "pump": "submersible",
          "tank": "2000"
        },
        "note": "",
        "autoRun": false
      },
      {
        "label": "Scénario 2 — Estimateur de coût de forage",
        "values": {
          "purpose": "community",
          "depth": "120",
          "geology": "medium",
          "pump": "solar",
          "tank": "10000"
        },
        "note": "",
        "autoRun": false
      }
    ],
    "checks": [
      "Renseignez profondeur, géologie, diamètre, pompe et options pour obtenir un budget ventilé.",
      "La profondeur productive et la qualité d’eau exigent une étude hydrogéologique et des analyses.",
      "Consignez les dimensions, unités, prix, taux de perte et exclusions utilisés.",
      "Comparez le résultat aux plans, aux relevés de site et aux devis de fournisseurs."
    ],
    "risks": [
      "La profondeur productive et la qualité d’eau exigent une étude hydrogéologique et des analyses.",
      "Une hypothèse non vérifiée peut modifier les quantités, le coût ou la sécurité du projet.",
      "Les prix, normes et conditions de chantier varient selon le pays et la localité."
    ],
    "procurement": [
      "Dimensions et quantités vérifiées",
      "Hypothèses et exclusions datées",
      "Prix et disponibilité confirmés localement",
      "Marge de perte ou de sécurité justifiée",
      "Plans, relevés et devis de référence",
      "Validation professionnelle requise avant exécution"
    ],
    "sequence": [
      "Renseigner les données du projet",
      "Lancer le calcul ou préparer le plan",
      "Contrôler les hypothèses et les alertes",
      "Comparer les résultats aux sources locales",
      "Enregistrer ou exporter le dossier de décision"
    ],
    "companions": [
      {
        "label": "Dimensionnement de réservoir d’eau",
        "href": "/fr/tools/dimensionnement-citerne/"
      },
      {
        "label": "Calculateur solaire",
        "href": "/fr/tools/calculateur-solaire/"
      },
      {
        "label": "Calculateur de matériaux de plomberie",
        "href": "/fr/tools/materiaux-plomberie/"
      }
    ],
    "thresholds": [],
    "benchmark": "Comparez cette estimation aux offres locales, aux relevés de site et aux exigences professionnelles applicables."
  },
  "/fr/tools/calculateur-armature/": {
    "id": "rebar-calc",
    "source": "/tools/rebar-calculator/",
    "route": "/fr/tools/calculateur-armature/",
    "kind": "",
    "floating": false,
    "afrodraft": false,
    "name": "Calculateur d’armatures — dossier de revue",
    "kicker": "Revue technique",
    "description": "Préparez les longueurs de coupe, le poids d’acier et un bordereau d’armatures.",
    "modes": [
      "Planification initiale",
      "Revue de l’estimation",
      "Dossier de chantier",
      "Contrôle technique"
    ],
    "modeValues": [
      "Beam bars",
      "Column links",
      "Slab mesh",
      "Footing reinforcement"
    ],
    "presets": [
      {
        "label": "Scénario 1 — Calculateur d’armatures",
        "values": {
          "country": "NG",
          "wastage": "10"
        },
        "note": "",
        "autoRun": false
      },
      {
        "label": "Scénario 2 — Calculateur d’armatures",
        "values": {
          "country": "KE",
          "wastage": "15"
        },
        "note": "",
        "autoRun": false
      }
    ],
    "checks": [
      "Définissez diamètre, espacement, dimensions, recouvrements et prix pour calculer barres et poids.",
      "Les diamètres, ancrages et recouvrements doivent suivre les plans et la norme applicable.",
      "Consignez les dimensions, unités, prix, taux de perte et exclusions utilisés.",
      "Comparez le résultat aux plans, aux relevés de site et aux devis de fournisseurs."
    ],
    "risks": [
      "Les diamètres, ancrages et recouvrements doivent suivre les plans et la norme applicable.",
      "Une hypothèse non vérifiée peut modifier les quantités, le coût ou la sécurité du projet.",
      "Les prix, normes et conditions de chantier varient selon le pays et la localité."
    ],
    "procurement": [
      "Dimensions et quantités vérifiées",
      "Hypothèses et exclusions datées",
      "Prix et disponibilité confirmés localement",
      "Marge de perte ou de sécurité justifiée",
      "Plans, relevés et devis de référence",
      "Validation professionnelle requise avant exécution"
    ],
    "sequence": [
      "Renseigner les données du projet",
      "Lancer le calcul ou préparer le plan",
      "Contrôler les hypothèses et les alertes",
      "Comparer les résultats aux sources locales",
      "Enregistrer ou exporter le dossier de décision"
    ],
    "companions": [
      {
        "label": "Calculateur de structure",
        "href": "/fr/tools/calcul-structure/"
      },
      {
        "label": "Calculateur de dosage du béton",
        "href": "/fr/tools/dosage-beton/"
      },
      {
        "label": "Constructeur de devis quantitatif",
        "href": "/fr/tools/devis-quantitatif/"
      }
    ],
    "thresholds": [],
    "benchmark": "Comparez cette estimation aux offres locales, aux relevés de site et aux exigences professionnelles applicables."
  },
  "/fr/tools/dimensionnement-generateur/": {
    "id": "generator-sizing",
    "source": "/tools/generator-sizing/",
    "route": "/fr/tools/dimensionnement-generateur/",
    "kind": "",
    "floating": false,
    "afrodraft": false,
    "name": "Dimensionnement de groupe électrogène — dossier de revue",
    "kicker": "Revue technique",
    "description": "Estimez la puissance continue et de démarrage nécessaire.",
    "modes": [
      "Planification initiale",
      "Revue de l’estimation",
      "Dossier de chantier",
      "Contrôle technique"
    ],
    "modeValues": [
      "Home backup",
      "Office standby",
      "Shop cold chain",
      "Site generator"
    ],
    "presets": [
      {
        "label": "Scénario 1 — Dimensionnement de groupe électrogène",
        "values": {
          "presetAppliance": "-- Select appliance --",
          "customName": "Water pump",
          "customWatts": "750"
        },
        "note": "",
        "autoRun": false
      },
      {
        "label": "Scénario 2 — Dimensionnement de groupe électrogène",
        "values": {
          "customName": "Printer and router cluster",
          "customWatts": "900"
        },
        "note": "",
        "autoRun": false
      }
    ],
    "checks": [
      "Additionnez les charges, appliquez les facteurs de démarrage et prévoyez une réserve d’exploitation.",
      "Confirmez le régime, les moteurs, la température, l’altitude et la qualité de puissance avec le fournisseur.",
      "Consignez les dimensions, unités, prix, taux de perte et exclusions utilisés.",
      "Comparez le résultat aux plans, aux relevés de site et aux devis de fournisseurs."
    ],
    "risks": [
      "Confirmez le régime, les moteurs, la température, l’altitude et la qualité de puissance avec le fournisseur.",
      "Une hypothèse non vérifiée peut modifier les quantités, le coût ou la sécurité du projet.",
      "Les prix, normes et conditions de chantier varient selon le pays et la localité."
    ],
    "procurement": [
      "Dimensions et quantités vérifiées",
      "Hypothèses et exclusions datées",
      "Prix et disponibilité confirmés localement",
      "Marge de perte ou de sécurité justifiée",
      "Plans, relevés et devis de référence",
      "Validation professionnelle requise avant exécution"
    ],
    "sequence": [
      "Renseigner les données du projet",
      "Lancer le calcul ou préparer le plan",
      "Contrôler les hypothèses et les alertes",
      "Comparer les résultats aux sources locales",
      "Enregistrer ou exporter le dossier de décision"
    ],
    "companions": [
      {
        "label": "Calculateur de charge électrique",
        "href": "/fr/tools/charge-electrique/"
      },
      {
        "label": "Calculateur solaire",
        "href": "/fr/tools/calculateur-solaire/"
      },
      {
        "label": "Constructeur de devis quantitatif",
        "href": "/fr/tools/devis-quantitatif/"
      }
    ],
    "thresholds": [],
    "benchmark": "Comparez cette estimation aux offres locales, aux relevés de site et aux exigences professionnelles applicables."
  },
  "/fr/tools/generateur-boq/": {
    "id": "boq-gen",
    "source": "/tools/boq-generator/",
    "route": "/fr/tools/generateur-boq/",
    "kind": "",
    "floating": false,
    "afrodraft": false,
    "name": "Générateur de bordereau quantitatif — dossier de revue",
    "kicker": "Revue technique",
    "description": "Générez un bordereau indicatif à partir du type, de la surface et du niveau de finition.",
    "modes": [
      "Planification initiale",
      "Revue de l’estimation",
      "Dossier de chantier",
      "Contrôle technique"
    ],
    "modeValues": [
      "Residential estimate",
      "Commercial estimate",
      "Warehouse estimate",
      "Owner budget"
    ],
    "presets": [
      {
        "label": "Scénario 1 — Générateur de bordereau quantitatif",
        "values": {
          "country": "NG",
          "buildType": "res3",
          "floorArea": "160",
          "floors": "1",
          "wallHeight": "3",
          "wallType": "block9",
          "roofType": "zinc",
          "finishing": "standard",
          "contingency": "10"
        },
        "note": "",
        "autoRun": false
      },
      {
        "label": "Scénario 2 — Générateur de bordereau quantitatif",
        "values": {
          "country": "KE",
          "buildType": "comm",
          "floorArea": "300",
          "floors": "2",
          "finishing": "premium",
          "contingency": "12"
        },
        "note": "",
        "autoRun": false
      }
    ],
    "checks": [
      "Le calcul applique les postes et rendements du modèle, puis ventile quantités et coûts.",
      "Le bordereau doit être remétré sur les plans définitifs avant achat ou appel d’offres.",
      "Consignez les dimensions, unités, prix, taux de perte et exclusions utilisés.",
      "Comparez le résultat aux plans, aux relevés de site et aux devis de fournisseurs."
    ],
    "risks": [
      "Le bordereau doit être remétré sur les plans définitifs avant achat ou appel d’offres.",
      "Une hypothèse non vérifiée peut modifier les quantités, le coût ou la sécurité du projet.",
      "Les prix, normes et conditions de chantier varient selon le pays et la localité."
    ],
    "procurement": [
      "Dimensions et quantités vérifiées",
      "Hypothèses et exclusions datées",
      "Prix et disponibilité confirmés localement",
      "Marge de perte ou de sécurité justifiée",
      "Plans, relevés et devis de référence"
    ],
    "sequence": [
      "Renseigner les données du projet",
      "Lancer le calcul ou préparer le plan",
      "Contrôler les hypothèses et les alertes",
      "Comparer les résultats aux sources locales",
      "Enregistrer ou exporter le dossier de décision"
    ],
    "companions": [
      {
        "label": "Constructeur de devis quantitatif",
        "href": "/fr/tools/devis-quantitatif/"
      },
      {
        "label": "Planificateur de plan d’étage",
        "href": "/fr/ingenierie/planificateur-etage/"
      },
      {
        "label": "Estimateur de coût de construction",
        "href": "/fr/tools/plan-etage/"
      }
    ],
    "thresholds": [],
    "benchmark": "Comparez cette estimation aux offres locales, aux relevés de site et aux exigences professionnelles applicables."
  },
  "/fr/tools/cout-renovation/": {
    "id": "home-renovation-cost",
    "source": "/tools/home-renovation-cost/",
    "route": "/fr/tools/cout-renovation/",
    "kind": "",
    "floating": false,
    "afrodraft": false,
    "name": "Estimateur de rénovation — dossier de revue",
    "kicker": "Revue technique",
    "description": "Évaluez un budget de rénovation par pièce, niveau de travaux et localisation.",
    "modes": [
      "Planification initiale",
      "Revue de l’estimation",
      "Dossier de chantier",
      "Contrôle technique"
    ],
    "modeValues": [
      "Cosmetic refresh",
      "Kitchen and bath",
      "Full renovation",
      "Rental turnover"
    ],
    "presets": [
      {
        "label": "Scénario 1 — Estimateur de rénovation",
        "values": {
          "country": "NG",
          "quality": "budget",
          "propSize": "90",
          "scope": "cosmetic"
        },
        "note": "",
        "autoRun": false
      },
      {
        "label": "Scénario 2 — Estimateur de rénovation",
        "values": {
          "country": "ZA",
          "quality": "mid",
          "propSize": "120",
          "scope": "full"
        },
        "note": "",
        "autoRun": false
      }
    ],
    "checks": [
      "Sélectionnez les pièces et travaux, ajustez les surfaces et appliquez la marge d’imprévus.",
      "Inspectez l’existant et demandez des devis; les défauts cachés peuvent modifier fortement le coût.",
      "Consignez les dimensions, unités, prix, taux de perte et exclusions utilisés.",
      "Comparez le résultat aux plans, aux relevés de site et aux devis de fournisseurs."
    ],
    "risks": [
      "Inspectez l’existant et demandez des devis; les défauts cachés peuvent modifier fortement le coût.",
      "Une hypothèse non vérifiée peut modifier les quantités, le coût ou la sécurité du projet.",
      "Les prix, normes et conditions de chantier varient selon le pays et la localité."
    ],
    "procurement": [
      "Dimensions et quantités vérifiées",
      "Hypothèses et exclusions datées",
      "Prix et disponibilité confirmés localement",
      "Marge de perte ou de sécurité justifiée",
      "Plans, relevés et devis de référence"
    ],
    "sequence": [
      "Renseigner les données du projet",
      "Lancer le calcul ou préparer le plan",
      "Contrôler les hypothèses et les alertes",
      "Comparer les résultats aux sources locales",
      "Enregistrer ou exporter le dossier de décision"
    ],
    "companions": [
      {
        "label": "Calculateur de peinture",
        "href": "/fr/tools/calculateur-peinture/"
      },
      {
        "label": "Calculateur de carrelage",
        "href": "/fr/tools/calculateur-carrelage/"
      },
      {
        "label": "Constructeur de devis quantitatif",
        "href": "/fr/tools/devis-quantitatif/"
      }
    ],
    "thresholds": [],
    "benchmark": "Comparez cette estimation aux offres locales, aux relevés de site et aux exigences professionnelles applicables."
  },
  "/fr/tools/dimensionnement-fosse-septique/": {
    "id": "septic-tank",
    "source": "/tools/septic-tank/",
    "route": "/fr/tools/dimensionnement-fosse-septique/",
    "kind": "",
    "floating": false,
    "afrodraft": false,
    "name": "Dimensionnement de fosse septique — dossier de revue",
    "kicker": "Revue technique",
    "description": "Dimensionnez le volume, les compartiments et le dispositif d’infiltration.",
    "modes": [
      "Planification initiale",
      "Revue de l’estimation",
      "Dossier de chantier",
      "Contrôle technique"
    ],
    "modeValues": [
      "Private home",
      "School toilets",
      "Clinic sanitation",
      "Compound upgrade"
    ],
    "presets": [
      {
        "label": "Scénario 1 — Dimensionnement de fosse septique",
        "values": {
          "st-country": "NG",
          "st-people": "6",
          "st-btype": "residential",
          "st-toilets": "2",
          "st-soil": "loam",
          "st-material": "concrete",
          "st-soak": "yes"
        },
        "note": "",
        "autoRun": false
      },
      {
        "label": "Scénario 2 — Dimensionnement de fosse septique",
        "values": {
          "st-people": "60",
          "st-btype": "school",
          "st-toilets": "8",
          "st-soil": "laterite",
          "st-material": "concrete",
          "st-soak": "yes"
        },
        "note": "",
        "autoRun": false
      }
    ],
    "checks": [
      "Le moteur utilise le nombre d’usagers, les effluents, la rétention, les boues et le sol.",
      "Vérifiez le sol, les distances sanitaires, la nappe et l’autorisation auprès des autorités locales.",
      "Consignez les dimensions, unités, prix, taux de perte et exclusions utilisés.",
      "Comparez le résultat aux plans, aux relevés de site et aux devis de fournisseurs."
    ],
    "risks": [
      "Vérifiez le sol, les distances sanitaires, la nappe et l’autorisation auprès des autorités locales.",
      "Une hypothèse non vérifiée peut modifier les quantités, le coût ou la sécurité du projet.",
      "Les prix, normes et conditions de chantier varient selon le pays et la localité."
    ],
    "procurement": [
      "Dimensions et quantités vérifiées",
      "Hypothèses et exclusions datées",
      "Prix et disponibilité confirmés localement",
      "Marge de perte ou de sécurité justifiée",
      "Plans, relevés et devis de référence",
      "Validation professionnelle requise avant exécution"
    ],
    "sequence": [
      "Renseigner les données du projet",
      "Lancer le calcul ou préparer le plan",
      "Contrôler les hypothèses et les alertes",
      "Comparer les résultats aux sources locales",
      "Enregistrer ou exporter le dossier de décision"
    ],
    "companions": [
      {
        "label": "Calculateur de matériaux de plomberie",
        "href": "/fr/tools/materiaux-plomberie/"
      },
      {
        "label": "Dimensionnement de réservoir d’eau",
        "href": "/fr/tools/dimensionnement-citerne/"
      },
      {
        "label": "Constructeur de devis quantitatif",
        "href": "/fr/tools/devis-quantitatif/"
      }
    ],
    "thresholds": [
      {
        "id": "st-people",
        "min": 30,
        "message": "Vérifiez le sol, les distances sanitaires, la nappe et l’autorisation auprès des autorités locales."
      }
    ],
    "benchmark": "Comparez cette estimation aux offres locales, aux relevés de site et aux exigences professionnelles applicables."
  },
  "/fr/tools/cout-cloture/": {
    "id": "fence-cost",
    "source": "/tools/fence-cost/",
    "route": "/fr/tools/cout-cloture/",
    "kind": "",
    "floating": false,
    "afrodraft": false,
    "name": "Estimateur de coût de clôture — dossier de revue",
    "kicker": "Revue technique",
    "description": "Estimez matériaux, poteaux, portail, main-d’œuvre et coût total d’une clôture.",
    "modes": [
      "Planification initiale",
      "Revue de l’estimation",
      "Dossier de chantier",
      "Contrôle technique"
    ],
    "modeValues": [
      "Residential boundary",
      "Farm perimeter",
      "Commercial security",
      "Estate frontage"
    ],
    "presets": [
      {
        "label": "Scénario 1 — Estimateur de coût de clôture",
        "values": {
          "fc-country": "NG",
          "fc-length": "100",
          "fc-height": "1.8",
          "fc-type": "block_render",
          "fc-gates": "1",
          "fc-gate-type": "manual_double",
          "fc-topping": "none"
        },
        "note": "",
        "autoRun": false
      },
      {
        "label": "Scénario 2 — Estimateur de coût de clôture",
        "values": {
          "fc-height": "2.4",
          "fc-type": "electric",
          "fc-gates": "2",
          "fc-gate-type": "sliding",
          "fc-topping": "razor"
        },
        "note": "",
        "autoRun": false
      }
    ],
    "checks": [
      "Saisissez le périmètre, la hauteur, le type de clôture, les portails et les conditions du terrain.",
      "Confirmez limites foncières, fondations, sécurité et prix locaux avant travaux.",
      "Consignez les dimensions, unités, prix, taux de perte et exclusions utilisés.",
      "Comparez le résultat aux plans, aux relevés de site et aux devis de fournisseurs."
    ],
    "risks": [
      "Confirmez limites foncières, fondations, sécurité et prix locaux avant travaux.",
      "Une hypothèse non vérifiée peut modifier les quantités, le coût ou la sécurité du projet.",
      "Les prix, normes et conditions de chantier varient selon le pays et la localité."
    ],
    "procurement": [
      "Dimensions et quantités vérifiées",
      "Hypothèses et exclusions datées",
      "Prix et disponibilité confirmés localement",
      "Marge de perte ou de sécurité justifiée",
      "Plans, relevés et devis de référence",
      "Validation professionnelle requise avant exécution"
    ],
    "sequence": [
      "Renseigner les données du projet",
      "Lancer le calcul ou préparer le plan",
      "Contrôler les hypothèses et les alertes",
      "Comparer les résultats aux sources locales",
      "Enregistrer ou exporter le dossier de décision"
    ],
    "companions": [
      {
        "label": "Estimateur de préparation de terrain",
        "href": "/fr/tools/estimateur-du-cout-de-preparation-d-un-terrain/"
      },
      {
        "label": "Constructeur de devis quantitatif",
        "href": "/fr/tools/devis-quantitatif/"
      },
      {
        "label": "Estimateur de construction routière",
        "href": "/fr/tools/estimateur-du-cout-de-construction-routiere/"
      }
    ],
    "thresholds": [],
    "benchmark": "Comparez cette estimation aux offres locales, aux relevés de site et aux exigences professionnelles applicables."
  },
  "/fr/tools/cout-piscine/": {
    "id": "swimming-pool-cost",
    "source": "/tools/swimming-pool-cost/",
    "route": "/fr/tools/cout-piscine/",
    "kind": "",
    "floating": false,
    "afrodraft": false,
    "name": "Estimateur de coût de piscine — dossier de revue",
    "kicker": "Revue technique",
    "description": "Préparez dimensions, volume, équipements et budget indicatif d’une piscine.",
    "modes": [
      "Planification initiale",
      "Revue de l’estimation",
      "Dossier de chantier",
      "Contrôle technique"
    ],
    "modeValues": [
      "Home pool",
      "Short-let amenity",
      "Hotel pool",
      "Training pool"
    ],
    "presets": [
      {
        "label": "Scénario 1 — Estimateur de coût de piscine",
        "values": {
          "sp-country": "NG",
          "sp-length": "8",
          "sp-width": "4",
          "sp-depth": "1.5",
          "sp-type": "concrete",
          "sp-finish": "tile",
          "sp-use": "residential",
          "sp-extras": "lighting"
        },
        "note": "",
        "autoRun": false
      },
      {
        "label": "Scénario 2 — Estimateur de coût de piscine",
        "values": {
          "sp-length": "15",
          "sp-width": "6",
          "sp-depth": "1.8",
          "sp-type": "concrete",
          "sp-finish": "pebble",
          "sp-use": "commercial",
          "sp-extras": "fence"
        },
        "note": "",
        "autoRun": false
      }
    ],
    "checks": [
      "Le calcul combine terrassement, structure, finition, filtration, accessoires et main-d’œuvre.",
      "Une étude de sol et des plans techniques sont nécessaires pour le drainage, la structure et la sécurité.",
      "Consignez les dimensions, unités, prix, taux de perte et exclusions utilisés.",
      "Comparez le résultat aux plans, aux relevés de site et aux devis de fournisseurs."
    ],
    "risks": [
      "Une étude de sol et des plans techniques sont nécessaires pour le drainage, la structure et la sécurité.",
      "Une hypothèse non vérifiée peut modifier les quantités, le coût ou la sécurité du projet.",
      "Les prix, normes et conditions de chantier varient selon le pays et la localité."
    ],
    "procurement": [
      "Dimensions et quantités vérifiées",
      "Hypothèses et exclusions datées",
      "Prix et disponibilité confirmés localement",
      "Marge de perte ou de sécurité justifiée",
      "Plans, relevés et devis de référence",
      "Validation professionnelle requise avant exécution",
      "Dimensions et quantités vérifiées"
    ],
    "sequence": [
      "Renseigner les données du projet",
      "Lancer le calcul ou préparer le plan",
      "Contrôler les hypothèses et les alertes",
      "Comparer les résultats aux sources locales",
      "Enregistrer ou exporter le dossier de décision"
    ],
    "companions": [
      {
        "label": "Dimensionnement de réservoir d’eau",
        "href": "/fr/tools/dimensionnement-citerne/"
      },
      {
        "label": "Calculateur de matériaux de plomberie",
        "href": "/fr/tools/materiaux-plomberie/"
      },
      {
        "label": "Constructeur de devis quantitatif",
        "href": "/fr/tools/devis-quantitatif/"
      }
    ],
    "thresholds": [],
    "benchmark": "Comparez cette estimation aux offres locales, aux relevés de site et aux exigences professionnelles applicables."
  },
  "/fr/tools/honoraires-architecte/": {
    "id": "architectural-fee",
    "source": "/tools/architectural-fee/",
    "route": "/fr/tools/honoraires-architecte/",
    "kind": "",
    "floating": false,
    "afrodraft": false,
    "name": "Calculateur d’honoraires d’architecte — dossier de revue",
    "kicker": "Revue technique",
    "description": "Estimez une fourchette d’honoraires selon le budget, la complexité et les services.",
    "modes": [
      "Planification initiale",
      "Revue de l’estimation",
      "Dossier de chantier",
      "Contrôle technique"
    ],
    "modeValues": [
      "Concept design",
      "Approval drawings",
      "Working drawings",
      "Full service"
    ],
    "presets": [
      {
        "label": "Scénario 1 — Calculateur d’honoraires d’architecte",
        "values": {
          "af-country": "NG",
          "af-btype": "residential_simple",
          "af-area": "180",
          "af-value": "45000000",
          "af-scope": "full",
          "af-arch-cat": "small_firm"
        },
        "note": "",
        "autoRun": false
      },
      {
        "label": "Scénario 2 — Calculateur d’honoraires d’architecte",
        "values": {
          "af-btype": "commercial_small",
          "af-area": "350",
          "af-scope": "approval",
          "af-arch-cat": "large_firm"
        },
        "note": "",
        "autoRun": false
      }
    ],
    "checks": [
      "Appliquez le barème indicatif au coût de construction, puis ajustez phases et options.",
      "Les honoraires réels dépendent du contrat, du pays, du périmètre et des conditions de mission.",
      "Consignez les dimensions, unités, prix, taux de perte et exclusions utilisés.",
      "Comparez le résultat aux plans, aux relevés de site et aux devis de fournisseurs."
    ],
    "risks": [
      "Les honoraires réels dépendent du contrat, du pays, du périmètre et des conditions de mission.",
      "Une hypothèse non vérifiée peut modifier les quantités, le coût ou la sécurité du projet.",
      "Les prix, normes et conditions de chantier varient selon le pays et la localité."
    ],
    "procurement": [
      "Dimensions et quantités vérifiées",
      "Hypothèses et exclusions datées",
      "Prix et disponibilité confirmés localement",
      "Marge de perte ou de sécurité justifiée",
      "Plans, relevés et devis de référence"
    ],
    "sequence": [
      "Renseigner les données du projet",
      "Lancer le calcul ou préparer le plan",
      "Contrôler les hypothèses et les alertes",
      "Comparer les résultats aux sources locales",
      "Enregistrer ou exporter le dossier de décision"
    ],
    "companions": [
      {
        "label": "Planificateur de plan d’étage",
        "href": "/fr/ingenierie/planificateur-etage/"
      },
      {
        "label": "AfroDraft CAO 2D",
        "href": "/fr/ingenierie/afrodraft/"
      },
      {
        "label": "Estimateur de coût de construction",
        "href": "/fr/tools/plan-etage/"
      }
    ],
    "thresholds": [],
    "benchmark": "Comparez cette estimation aux offres locales, aux relevés de site et aux exigences professionnelles applicables."
  },
  "/fr/tools/estimateur-du-cout-de-preparation-d-un-terrain/": {
    "id": "site-clearance",
    "source": "/tools/site-clearing/",
    "route": "/fr/tools/estimateur-du-cout-de-preparation-d-un-terrain/",
    "kind": "",
    "floating": false,
    "afrodraft": false,
    "name": "Estimateur de préparation de terrain — dossier de revue",
    "kicker": "Revue technique",
    "description": "Estimez débroussaillage, arbres, décapage, démolition et évacuation.",
    "modes": [
      "Planification initiale",
      "Revue de l’estimation",
      "Dossier de chantier",
      "Contrôle technique"
    ],
    "modeValues": [
      "House plot",
      "Farm clearing",
      "Road corridor",
      "Commercial site"
    ],
    "presets": [
      {
        "label": "Scénario 1 — Estimateur de préparation de terrain",
        "values": {
          "sc-country": "NG",
          "sc-area": "0.25",
          "sc-veg": "medium",
          "sc-terrain": "flat",
          "sc-topsoil": "yes",
          "sc-trees": "5",
          "sc-demo": "small",
          "sc-waste": "haul"
        },
        "note": "",
        "autoRun": false
      },
      {
        "label": "Scénario 2 — Estimateur de préparation de terrain",
        "values": {
          "sc-area": "1",
          "sc-veg": "dense",
          "sc-terrain": "gentle",
          "sc-topsoil": "yes",
          "sc-trees": "40",
          "sc-waste": "chip"
        },
        "note": "",
        "autoRun": false
      }
    ],
    "checks": [
      "Le moteur applique les rendements et prix du pays à la surface, au terrain et aux options.",
      "Confirmez accès, déchets, réseaux, environnement et volumes après visite du site.",
      "Consignez les dimensions, unités, prix, taux de perte et exclusions utilisés.",
      "Comparez le résultat aux plans, aux relevés de site et aux devis de fournisseurs."
    ],
    "risks": [
      "Confirmez accès, déchets, réseaux, environnement et volumes après visite du site.",
      "Une hypothèse non vérifiée peut modifier les quantités, le coût ou la sécurité du projet.",
      "Les prix, normes et conditions de chantier varient selon le pays et la localité."
    ],
    "procurement": [
      "Dimensions et quantités vérifiées",
      "Hypothèses et exclusions datées",
      "Prix et disponibilité confirmés localement",
      "Marge de perte ou de sécurité justifiée",
      "Plans, relevés et devis de référence",
      "Validation professionnelle requise avant exécution"
    ],
    "sequence": [
      "Renseigner les données du projet",
      "Lancer le calcul ou préparer le plan",
      "Contrôler les hypothèses et les alertes",
      "Comparer les résultats aux sources locales",
      "Enregistrer ou exporter le dossier de décision"
    ],
    "companions": [
      {
        "label": "Estimateur de construction routière",
        "href": "/fr/tools/estimateur-du-cout-de-construction-routiere/"
      },
      {
        "label": "Estimateur de coût de clôture",
        "href": "/fr/tools/cout-cloture/"
      },
      {
        "label": "Constructeur de devis quantitatif",
        "href": "/fr/tools/devis-quantitatif/"
      }
    ],
    "thresholds": [
      {
        "id": "sc-trees",
        "min": 20,
        "message": "Confirmez accès, déchets, réseaux, environnement et volumes après visite du site."
      }
    ],
    "benchmark": "Comparez cette estimation aux offres locales, aux relevés de site et aux exigences professionnelles applicables."
  },
  "/fr/tools/estimateur-du-cout-de-construction-routiere/": {
    "id": "road-construction-cost",
    "source": "/tools/road-construction-cost/",
    "route": "/fr/tools/estimateur-du-cout-de-construction-routiere/",
    "kind": "",
    "floating": false,
    "afrodraft": false,
    "name": "Estimateur de construction routière — dossier de revue",
    "kicker": "Revue technique",
    "description": "Estimez le coût d’une route selon longueur, largeur, revêtement et terrain.",
    "modes": [
      "Planification initiale",
      "Revue de l’estimation",
      "Dossier de chantier",
      "Contrôle technique"
    ],
    "modeValues": [
      "Estate road",
      "Farm access",
      "Urban street",
      "Industrial yard"
    ],
    "presets": [
      {
        "label": "Scénario 1 — Estimateur de construction routière",
        "values": {
          "rc-country": "KE",
          "rc-length": "1",
          "rc-width": "3.5",
          "rc-surface": "gravel",
          "rc-terrain": "rolling",
          "rc-location": "rural",
          "rc-drainage": "yes",
          "rc-lighting": "no"
        },
        "note": "",
        "autoRun": false
      },
      {
        "label": "Scénario 2 — Estimateur de construction routière",
        "values": {
          "rc-length": "0.5",
          "rc-width": "7.3",
          "rc-surface": "asphalt",
          "rc-terrain": "flat",
          "rc-location": "urban",
          "rc-drainage": "yes",
          "rc-lighting": "yes"
        },
        "note": "",
        "autoRun": false
      }
    ],
    "checks": [
      "Le moteur applique les prix du pays, les coefficients de terrain et les options de drainage ou éclairage.",
      "Une étude topographique, géotechnique, hydraulique et de trafic reste indispensable.",
      "Consignez les dimensions, unités, prix, taux de perte et exclusions utilisés.",
      "Comparez le résultat aux plans, aux relevés de site et aux devis de fournisseurs."
    ],
    "risks": [
      "Une étude topographique, géotechnique, hydraulique et de trafic reste indispensable.",
      "Une hypothèse non vérifiée peut modifier les quantités, le coût ou la sécurité du projet.",
      "Les prix, normes et conditions de chantier varient selon le pays et la localité."
    ],
    "procurement": [
      "Dimensions et quantités vérifiées",
      "Hypothèses et exclusions datées",
      "Prix et disponibilité confirmés localement",
      "Marge de perte ou de sécurité justifiée",
      "Plans, relevés et devis de référence",
      "Validation professionnelle requise avant exécution"
    ],
    "sequence": [
      "Renseigner les données du projet",
      "Lancer le calcul ou préparer le plan",
      "Contrôler les hypothèses et les alertes",
      "Comparer les résultats aux sources locales",
      "Enregistrer ou exporter le dossier de décision"
    ],
    "companions": [
      {
        "label": "Estimateur de préparation de terrain",
        "href": "/fr/tools/estimateur-du-cout-de-preparation-d-un-terrain/"
      },
      {
        "label": "Calculateur de dosage du béton",
        "href": "/fr/tools/dosage-beton/"
      },
      {
        "label": "Constructeur de devis quantitatif",
        "href": "/fr/tools/devis-quantitatif/"
      }
    ],
    "thresholds": [],
    "benchmark": "Comparez cette estimation aux offres locales, aux relevés de site et aux exigences professionnelles applicables."
  },
  "/fr/tools/calculateur-echafaudage/": {
    "id": "scaffolding-calc",
    "source": "/tools/scaffolding-calc/",
    "route": "/fr/tools/calculateur-echafaudage/",
    "kind": "",
    "floating": false,
    "afrodraft": false,
    "name": "Calculateur d’échafaudage — dossier de revue",
    "kicker": "Revue technique",
    "description": "Calculez surface, tubes, planchers, raccords, location ou achat et main-d’œuvre.",
    "modes": [
      "Planification initiale",
      "Revue de l’estimation",
      "Dossier de chantier",
      "Contrôle technique"
    ],
    "modeValues": [
      "Facade works",
      "Roof access",
      "Painting access",
      "Heavy-duty platform"
    ],
    "presets": [
      {
        "label": "Scénario 1 — Calculateur d’échafaudage",
        "values": {
          "sg-country": "NG",
          "sg-perimeter": "60",
          "sg-height": "6",
          "sg-type": "system",
          "sg-mode": "rent",
          "sg-weeks": "4",
          "sg-labour": "yes"
        },
        "note": "",
        "autoRun": false
      },
      {
        "label": "Scénario 2 — Calculateur d’échafaudage",
        "values": {
          "sg-perimeter": "30",
          "sg-height": "3",
          "sg-type": "tube_coupler",
          "sg-mode": "rent",
          "sg-weeks": "2",
          "sg-labour": "yes"
        },
        "note": "",
        "autoRun": false
      }
    ],
    "checks": [
      "Le moteur partagé utilise périmètre, hauteur, type, durée et tarifs du pays.",
      "Un responsable compétent doit vérifier ancrages, charges, stabilité, accès et inspections.",
      "Consignez les dimensions, unités, prix, taux de perte et exclusions utilisés.",
      "Comparez le résultat aux plans, aux relevés de site et aux devis de fournisseurs."
    ],
    "risks": [
      "Un responsable compétent doit vérifier ancrages, charges, stabilité, accès et inspections.",
      "Une hypothèse non vérifiée peut modifier les quantités, le coût ou la sécurité du projet.",
      "Les prix, normes et conditions de chantier varient selon le pays et la localité."
    ],
    "procurement": [
      "Dimensions et quantités vérifiées",
      "Hypothèses et exclusions datées",
      "Prix et disponibilité confirmés localement",
      "Marge de perte ou de sécurité justifiée",
      "Plans, relevés et devis de référence",
      "Validation professionnelle requise avant exécution"
    ],
    "sequence": [
      "Renseigner les données du projet",
      "Lancer le calcul ou préparer le plan",
      "Contrôler les hypothèses et les alertes",
      "Comparer les résultats aux sources locales",
      "Enregistrer ou exporter le dossier de décision"
    ],
    "companions": [
      {
        "label": "Calculateur de toiture",
        "href": "/fr/tools/calculateur-toiture/"
      },
      {
        "label": "Calculateur de peinture",
        "href": "/fr/tools/calculateur-peinture/"
      },
      {
        "label": "Constructeur de devis quantitatif",
        "href": "/fr/tools/devis-quantitatif/"
      }
    ],
    "thresholds": [
      {
        "id": "sg-height",
        "min": 3.1,
        "message": "Un responsable compétent doit vérifier ancrages, charges, stabilité, accès et inspections."
      }
    ],
    "benchmark": "Comparez cette estimation aux offres locales, aux relevés de site et aux exigences professionnelles applicables."
  },
  "/fr/tools/dimensionnement-fenetres-portes/": {
    "id": "window-door-sizing",
    "source": "/tools/window-door-sizing/",
    "route": "/fr/tools/dimensionnement-fenetres-portes/",
    "kind": "",
    "floating": false,
    "afrodraft": false,
    "name": "Dimensionnement des fenêtres et portes — dossier de revue",
    "kicker": "Revue technique",
    "description": "Préparez un tableau de fenêtres et portes avec ventilation, dimensions et coûts.",
    "modes": [
      "Planification initiale",
      "Revue de l’estimation",
      "Dossier de chantier",
      "Contrôle technique"
    ],
    "modeValues": [
      "Residential schedule",
      "Office fit-out",
      "Retail frontage",
      "Replacement work"
    ],
    "presets": [
      {
        "label": "Scénario 1 — Dimensionnement des fenêtres et portes",
        "values": {
          "wd-country": "NG",
          "wd-btype": "residential",
          "wd-rooms": "6",
          "wd-room-area": "14",
          "wd-ext-doors": "2",
          "wd-int-doors": "8",
          "wd-win-mat": "aluminium",
          "wd-win-type": "casement",
          "wd-door-mat": "steel_security",
          "wd-int-mat": "flush_hdf"
        },
        "note": "",
        "autoRun": false
      },
      {
        "label": "Scénario 2 — Dimensionnement des fenêtres et portes",
        "values": {
          "wd-btype": "retail",
          "wd-rooms": "3",
          "wd-room-area": "30",
          "wd-ext-doors": "2",
          "wd-win-type": "fixed",
          "wd-door-mat": "aluminium_glass"
        },
        "note": "",
        "autoRun": false
      }
    ],
    "checks": [
      "Le moteur partagé combine pièces, surface, matériaux, types, quincaillerie et tarifs du pays.",
      "Vérifiez ventilation, lumière, sécurité, évacuation, linteaux et règles locales.",
      "Consignez les dimensions, unités, prix, taux de perte et exclusions utilisés.",
      "Comparez le résultat aux plans, aux relevés de site et aux devis de fournisseurs."
    ],
    "risks": [
      "Vérifiez ventilation, lumière, sécurité, évacuation, linteaux et règles locales.",
      "Une hypothèse non vérifiée peut modifier les quantités, le coût ou la sécurité du projet.",
      "Les prix, normes et conditions de chantier varient selon le pays et la localité."
    ],
    "procurement": [
      "Dimensions et quantités vérifiées",
      "Hypothèses et exclusions datées",
      "Prix et disponibilité confirmés localement",
      "Marge de perte ou de sécurité justifiée",
      "Plans, relevés et devis de référence",
      "Validation professionnelle requise avant exécution"
    ],
    "sequence": [
      "Renseigner les données du projet",
      "Lancer le calcul ou préparer le plan",
      "Contrôler les hypothèses et les alertes",
      "Comparer les résultats aux sources locales",
      "Enregistrer ou exporter le dossier de décision"
    ],
    "companions": [
      {
        "label": "Planificateur de plan d’étage",
        "href": "/fr/ingenierie/planificateur-etage/"
      },
      {
        "label": "Calculateur d’honoraires d’architecte",
        "href": "/fr/tools/honoraires-architecte/"
      },
      {
        "label": "Constructeur de devis quantitatif",
        "href": "/fr/tools/devis-quantitatif/"
      }
    ],
    "thresholds": [],
    "benchmark": "Comparez cette estimation aux offres locales, aux relevés de site et aux exigences professionnelles applicables."
  },
  "/fr/tools/materiaux-plomberie/": {
    "id": "plumbing-material",
    "source": "/tools/plumbing-material/",
    "route": "/fr/tools/materiaux-plomberie/",
    "kind": "",
    "floating": false,
    "afrodraft": false,
    "name": "Calculateur de matériaux de plomberie — dossier de revue",
    "kicker": "Revue technique",
    "description": "Estimez tuyaux, raccords, appareils sanitaires, réservoir et main-d’œuvre.",
    "modes": [
      "Planification initiale",
      "Revue de l’estimation",
      "Dossier de chantier",
      "Contrôle technique"
    ],
    "modeValues": [
      "New house",
      "Duplex services",
      "Small commercial",
      "Renovation plumbing"
    ],
    "presets": [
      {
        "label": "Scénario 1 — Calculateur de matériaux de plomberie",
        "values": {
          "pm-country": "NG",
          "pm-type": "3bed",
          "pm-pipe": "ppr",
          "pm-baths": "3",
          "pm-tank": "yes",
          "pm-tank-size": "2000",
          "pm-labour": "yes"
        },
        "note": "",
        "autoRun": false
      },
      {
        "label": "Scénario 2 — Calculateur de matériaux de plomberie",
        "values": {
          "pm-type": "commercial",
          "pm-pipe": "upvc",
          "pm-baths": "6",
          "pm-tank": "yes",
          "pm-tank-size": "5000",
          "pm-labour": "yes"
        },
        "note": "",
        "autoRun": false
      }
    ],
    "checks": [
      "Le moteur partagé applique le type de bâtiment, les salles d’eau, le matériau et les tarifs du pays.",
      "Confirmez pression, diamètres, pentes, ventilation, qualité d’eau et prescriptions locales.",
      "Consignez les dimensions, unités, prix, taux de perte et exclusions utilisés.",
      "Comparez le résultat aux plans, aux relevés de site et aux devis de fournisseurs."
    ],
    "risks": [
      "Confirmez pression, diamètres, pentes, ventilation, qualité d’eau et prescriptions locales.",
      "Une hypothèse non vérifiée peut modifier les quantités, le coût ou la sécurité du projet.",
      "Les prix, normes et conditions de chantier varient selon le pays et la localité."
    ],
    "procurement": [
      "Dimensions et quantités vérifiées",
      "Hypothèses et exclusions datées",
      "Prix et disponibilité confirmés localement",
      "Marge de perte ou de sécurité justifiée",
      "Plans, relevés et devis de référence",
      "Validation professionnelle requise avant exécution",
      "Dimensions et quantités vérifiées"
    ],
    "sequence": [
      "Renseigner les données du projet",
      "Lancer le calcul ou préparer le plan",
      "Contrôler les hypothèses et les alertes",
      "Comparer les résultats aux sources locales",
      "Enregistrer ou exporter le dossier de décision"
    ],
    "companions": [
      {
        "label": "Dimensionnement de réservoir d’eau",
        "href": "/fr/tools/dimensionnement-citerne/"
      },
      {
        "label": "Dimensionnement de fosse septique",
        "href": "/fr/tools/dimensionnement-fosse-septique/"
      },
      {
        "label": "Constructeur de devis quantitatif",
        "href": "/fr/tools/devis-quantitatif/"
      }
    ],
    "thresholds": [],
    "benchmark": "Comparez cette estimation aux offres locales, aux relevés de site et aux exigences professionnelles applicables."
  }
};
}());

"use strict";

const FRENCH_WIDGET_PARENT_PAGES = [
  {
    id: "mobile-money-fees",
    slug: "frais-mobile-money",
    category: "Paiements mobiles",
    title: "Widget frais mobile money",
    description: "Aider les lecteurs a estimer les frais mobile money avant un transfert, un paiement marchand ou une collecte communautaire.",
    fullFrenchPath: "/fr/tools/frais-mobile-money/",
    englishSource: "widgets/iframe/african-mobile-money-fees",
    primaryUse: "Blogs finance, pages d'association, comparateurs de services et guides pratiques pour utilisateurs mobile money.",
    caution: "Verifier la langue visible du widget avant publication et diriger les utilisateurs francophones vers la page complete en francais.",
  },
  {
    id: "remittance-compare",
    slug: "transfert-argent",
    category: "Diaspora et transferts",
    title: "Widget comparaison de transfert d'argent",
    description: "Presenter une comparaison simple des couts de transfert pour les familles, diasporas et petites entreprises.",
    fullFrenchPath: "/fr/tools/transfert-argent/",
    englishSource: "widgets/iframe/african-remittance-compare",
    primaryUse: "Guides diaspora, pages de services financiers et contenus d'explication sur les frais de transfert.",
    caution: "Ne pas promettre le meilleur tarif en temps reel si la page d'accueil ou le widget ne confirme pas les donnees disponibles.",
  },
  {
    id: "currency-converter",
    slug: "convertisseur-devises",
    category: "Devises",
    title: "Widget convertisseur de devises africaines",
    description: "Donner un repere de conversion pour les monnaies africaines, les prix, les factures et les budgets transfrontaliers.",
    fullFrenchPath: "/fr/tools/convertisseur-devises/",
    englishSource: "widgets/iframe/financial-currency-converter",
    primaryUse: "Pages de prix, guides pays, articles business et tableaux de bord qui doivent afficher un repere de change.",
    caution: "Presenter la conversion comme une estimation et envoyer les utilisateurs vers l'outil complet pour verifier le contexte.",
  },
  {
    id: "vat-calculator",
    slug: "taxe-valeur-ajoutee",
    category: "TVA",
    title: "Widget calculateur de TVA",
    description: "Calculer rapidement un montant hors taxe, toutes taxes comprises ou la TVA incluse dans un prix.",
    fullFrenchPath: "/fr/tools/calculateur-tva/",
    englishSource: "widgets/iframe/financial-vat-calculator",
    primaryUse: "Pages de facturation, guides fiscaux, supports de formation et outils pour petites entreprises.",
    caution: "Garder les cas pays sensibles sur les pages fiscales completes quand les taux ou regles locales changent.",
  },
  {
    id: "import-duty",
    slug: "droits-douane",
    category: "Importation",
    title: "Widget estimation des droits de douane",
    description: "Aider un importateur a poser une premiere estimation de couts avant de verifier les regles officielles.",
    fullFrenchPath: "/fr/tools/droits-douane/",
    englishSource: "widgets/iframe/ecommerce-import-duty",
    primaryUse: "Guides import, pages e-commerce, contenus logistiques et ressources pour commercants.",
    caution: "Decrire le resultat comme une estimation et garder les calculs officiels ou pays precis sur les pages dediees.",
  },
  {
    id: "invoice-fee-widget",
    slug: "frais-facture",
    category: "Facturation",
    title: "Widget frais de paiement sur facture",
    description: "Estimer les frais de plateforme ou de paiement avant d'envoyer une facture a un client.",
    fullFrenchPath: "/fr/tools/generateur-factures/",
    englishSource: "widgets/iframe/business-invoice-fee-widget",
    primaryUse: "Pages de freelance, guides PME, ressources de facturation et contenus pour prestataires.",
    caution: "Lier la page complete de facture en francais lorsque l'utilisateur doit creer ou partager une facture.",
  },
  {
    id: "crop-yield-estimator",
    slug: "rendement-agricole",
    category: "Agriculture",
    title: "Widget estimation de rendement agricole",
    description: "Estimer un volume de recolte a partir de la surface cultivee et du rendement attendu.",
    fullFrenchPath: "/fr/agriculture/crop-yield/",
    englishSource: "widgets/iframe/agriculture-crop-yield-estimator",
    primaryUse: "Pages cooperatives, guides intrants, contenus de vulgarisation agricole et ressources terrain.",
    caution: "Presenter le resultat comme un scenario de planification, pas comme une prediction agronomique garantie.",
  },
  {
    id: "farm-budget-estimator",
    slug: "budget-agricole",
    category: "Agriculture",
    title: "Widget budget d'exploitation agricole",
    description: "Additionner semences, intrants, main-d'oeuvre, transport et autres couts pour preparer un budget de ferme.",
    fullFrenchPath: "/fr/agriculture/farm-budget/",
    englishSource: "widgets/iframe/agriculture-farm-budget-estimator",
    primaryUse: "Pages de formation agricole, cooperatives, ONG, institutions de microfinance et guides de planification.",
    caution: "Adapter les montants localement et garder les conseils financiers detailles sur les pages completes.",
  },
];

const ENGLISH_SOURCE_BY_FRENCH_WIDGET_SLUG = new Map(
  FRENCH_WIDGET_PARENT_PAGES.map((item) => [item.slug, item.englishSource])
);

function englishSourceForFrenchWidgetParentSlug(slug) {
  return ENGLISH_SOURCE_BY_FRENCH_WIDGET_SLUG.get(slug) || null;
}

module.exports = {
  FRENCH_WIDGET_PARENT_PAGES,
  englishSourceForFrenchWidgetParentSlug,
};

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");
const { localizeVisibleLanguage } = require("./lib/french-visible-language");
const { enhanceCategory } = require("./lib/localized-category-standard");
const { analyticsVersion, bootstrapVersion, canonicalLoaderTag, earlyBootstrapTag } = require("./inject-analytics-loader");
const FRENCH_VISIBLE_COPY = require("./lib/french-energy-visible-copy");
const {
  FRENCH_ENERGY_APPS,
  REVIEWED_AT,
} = require("./lib/french-energy-parity-contract");

const ROOT = path.resolve(__dirname, "..");
const CHECK = process.argv.includes("--check");
const SITE = "https://afrotools.com";
const FRENCH_COPY_REPLACEMENTS = new Map([
  ["Nigeria, Ghana, Kenya, South Africa, Zambia, Côte d'Ivoire and Senegal are not auto-calculated until exact current provider/class schedules are parsed and reviewed. A regulator homepage or national benchmark is not enough.", "Le Nigeria, le Ghana, le Kenya, l’Afrique du Sud, la Zambie, la Côte d’Ivoire et le Sénégal ne sont pas calculés automatiquement tant que les grilles exactes et actuelles par fournisseur et catégorie ne sont pas analysées et vérifiées. La page d’accueil d’un régulateur ou une moyenne nationale ne suffit pas."],
  ["Actual bills and token receipts may include taxes, levies, fixed charges, minimum charges, arrears, debt recovery, meter corrections or time-of-use pricing. Enter receipt deductions where known and verify the result before paying or disputing a charge.", "Les factures et reçus de recharge réels peuvent inclure taxes, prélèvements, frais fixes, minimums, arriérés, recouvrement de dette, corrections de compteur ou tarification horaire. Saisissez les déductions connues et vérifiez le résultat avant de payer ou de contester un montant."],
  ["Automatic estimates need an exact official provider-and-class schedule plus a passing validity and freshness check. Use a current local rate when that evidence is missing.", "Les estimations automatiques exigent une grille officielle exacte par fournisseur et catégorie, ainsi qu’un contrôle réussi de validité et de fraîcheur. Utilisez un tarif local à jour lorsque ces preuves manquent."],
  ["Estimate the cost of running a generator before opening a country page. It uses the same Africa energy data as the country calculators and adds a rough grid and solar comparison.", "Estimez le coût d’utilisation d’un groupe électrogène avant d’ouvrir une page pays. L’outil reprend les mêmes données énergétiques africaines que les calculateurs pays et ajoute une comparaison indicative avec le réseau et le solaire."],
  ["Estimate fuel spend above, then replace the bundled planning price with today's pump price or a recent receipt before using the result for a weekly cash plan, maintenance discussion, or solar comparison.", "Estimez la dépense de carburant ci-dessus, puis remplacez le prix indicatif intégré par le prix à la pompe du jour ou celui d’un reçu récent avant d’utiliser le résultat pour un budget hebdomadaire, un entretien ou une comparaison solaire."],
  ["Use a real price: enter the pump price from a recent receipt and keep its date with the exported estimate.", "Utilisez un prix réel : saisissez le prix à la pompe d’un reçu récent et conservez sa date avec l’estimation exportée."],
  ["Check consumption: compare the estimate with litres used during a known run period; generator model, age, load and maintenance can move the result.", "Vérifiez la consommation : comparez l’estimation aux litres utilisés pendant une période connue ; le modèle, l’âge, la charge et l’entretien du groupe peuvent modifier le résultat."],
  ["Bundled energy data reviewed 2026-03. The page labels that value as a planning default and keeps a user-entered pump price local to the browser.", "Données énergétiques intégrées révisées en mars 2026. La page présente cette valeur comme une hypothèse de planification et conserve dans le navigateur le prix à la pompe saisi par l’utilisateur."],
  ["Use today's diesel or petrol pump price, ideally from a recent receipt. The bundled country value is a dated planning default and can be restored with the reset button.", "Utilisez le prix du diesel ou de l’essence à la pompe aujourd’hui, idéalement tiré d’un reçu récent. La valeur pays intégrée est une hypothèse datée que le bouton de réinitialisation peut restaurer."],
  ["Confirm the actual fuel price and consumption curve with a receipt, manual or technician. Follow ventilation, transfer-switch, noise, fire and carbon-monoxide safety requirements.", "Confirmez le prix réel du carburant et la courbe de consommation à l’aide d’un reçu, du manuel ou d’un technicien. Respectez les exigences de ventilation, d’inverseur, de bruit, d’incendie et de sécurité contre le monoxyde de carbone."]
  ,
  ["Free Prepaid Meter Unit Calculator for all 54 African countries. Select your country to calculate with local rates and data. Covering all 54 African nations with local rates and data.", "Calculateur gratuit d’unités de compteur prépayé pour les 54 pays africains. Sélectionnez votre pays pour utiliser les tarifs et données locales."],
  ["Start with a country and account-class tariff, subtract the charges shown on your receipt, then compare the expected kWh with the units actually delivered.", "Choisissez un pays et le tarif de votre catégorie de compte, soustrayez les frais indiqués sur le reçu, puis comparez les kWh attendus aux unités réellement livrées."],
  ["A tariff or service-band change, VAT or levies, fixed charges, arrears, meter debt recovery, leaving a lifeline band, or a different vending channel can reduce delivered units. Compare the receipt breakdown with the current utility or regulator tariff.", "Un changement de tarif ou de tranche de service, la TVA, des prélèvements, des frais fixes, des arriérés, le recouvrement d’une dette de compteur, la sortie d’un tarif social ou un autre canal de vente peuvent réduire les unités livrées. Comparez le détail du reçu au tarif actuel du fournisseur ou du régulateur."],
  ["No. It only estimates expected kWh and receipt variance. Buy tokens through a licensed vending channel, and never paste a token number or meter number into this calculator.", "Non. L’outil estime seulement les kWh attendus et l’écart avec le reçu. Achetez les jetons auprès d’un canal agréé et ne collez jamais un numéro de jeton ou de compteur dans ce calculateur."],
  ["Keep the original receipt, token record, meter number, tariff or service class, vending date and channel, payment record, and a photo of the meter units before loading. Do not paste those identifiers into this calculator.", "Conservez le reçu original, l’enregistrement du jeton, le numéro du compteur, la classe tarifaire, la date et le canal d’achat, la preuve de paiement ainsi qu’une photo des unités avant chargement. Ne collez pas ces identifiants dans le calculateur."],
  ["Start with the country where the system will be installed, then move into payback, generator savings, battery backup, monthly bill impact, system cost, and cash or financing assumptions.", "Commencez par le pays d’installation, puis examinez le délai de retour, les économies de groupe électrogène, l’autonomie de la batterie, l’effet sur la facture mensuelle, le coût du système et les hypothèses de paiement ou de financement."],
  ["Choose a country solar ROI page, compare generator savings, battery backup, monthly bill impact, system cost, and cash or financing assumptions. Use a country page for a quick check, then use the full decision tool for generator spend, battery backup, outages, and financing.", "Choisissez une page pays du calculateur solaire, puis comparez les économies de groupe électrogène, l’autonomie de la batterie, l’effet sur la facture mensuelle, le coût du système et les hypothèses de paiement comptant ou de financement. Utilisez la page pays pour une vérification rapide, puis l’outil de décision complet pour les dépenses de groupe, les coupures, la batterie et le financement."],
  ["Choose from popular countries or search the country list. The country page opens with local currency and Solar ROI assumptions.", "Choisissez un pays populaire ou recherchez-le dans la liste. La page pays s’ouvre avec la devise locale et les hypothèses de rendement solaire."],
  ["Choose from popular countries or all 54 African countries. The country page opens with local currency and Solar ROI assumptions.", "Choisissez parmi les pays populaires ou les 54 pays africains. La page pays s’ouvre avec la devise locale et les hypothèses du calculateur solaire."],
  ["Energy & Utilities", "Énergie et services essentiels"],
  ["Solar ROI Decision Tool", "Outil de décision sur la rentabilité solaire"],
  ["Search Solar ROI countries", "Rechercher un pays pour le calculateur solaire"],
  ["Search or select country", "Rechercher ou sélectionner un pays"],
  ["Open country page", "Ouvrir la page pays"],
  ["Solar planning export actions", "Actions d’export de la planification solaire"],
  ["Copy planning brief", "Copier la fiche de planification"],
  ["Download JSON", "Télécharger le JSON"],
  ["Select a country to prepare a solar ROI planning brief.", "Sélectionnez un pays pour préparer une fiche de planification de rentabilité solaire."],
  ["Selected-country defaults", "Valeurs indicatives du pays sélectionné"],
  ["Loading the selected country's planning assumptions.", "Chargement des hypothèses de planification du pays sélectionné."],
  ["Confidence unavailable", "Confiance indisponible"],
  ["Unavailable", "Indisponible"],
  ["Generator fuel", "Carburant du groupe électrogène"],
  ["Install cost", "Coût d’installation"],
  ["Planning defaults for the country calculator. Replace them with a current bill, fuel receipt, site assessment, and written installer quote.", "Valeurs indicatives du calculateur pays. Remplacez-les par une facture récente, un reçu de carburant, une étude du site et un devis écrit de l’installateur."],
  ["Planning defaults for the country calculator. Edit them there using a current bill, fuel receipt, site assessment, and written installer quote.", "Valeurs indicatives du calculateur pays. Modifiez-les à partir d’une facture récente, d’un reçu de carburant, d’une étude du site et d’un devis écrit de l’installateur."],
  ["Use the country page first, then move to the specific calculator that answers your next question. For background reading, start with the generator vs solar guide .", "Utilisez d’abord la page pays, puis ouvrez le calculateur précis qui répond à votre question suivante. Pour le contexte, commencez par le guide groupe électrogène ou solaire."],
  ["Enter your monthly grid bill, generator spend, outage hours, system size, battery choice, and financing assumptions. The calculator compares current energy spend with a solar scenario and estimates how long savings may take to recover the system cost.", "Saisissez la facture mensuelle du réseau, les dépenses de groupe électrogène, les heures de coupure, la taille du système, le choix de batterie et les hypothèses de financement. Le calculateur compare les dépenses actuelles à un scénario solaire et estime le temps nécessaire pour amortir le système."],
  ["Yes, include generator fuel if you use a petrol or diesel generator for backup power. Generator savings can materially change payback, especially for shops, clinics, schools, churches, cold rooms, and SMEs with frequent outages.", "Oui, incluez le carburant si vous utilisez un groupe à essence ou diesel. Les économies de carburant peuvent modifier fortement le délai de retour, notamment pour les boutiques, cliniques, écoles, lieux de culte, chambres froides et PME souvent privées d’électricité."],
  ["Not always. A battery is mainly for backup and night-time essential loads. Solar without a large battery can pay back faster, but it will not keep appliances running during outages.", "Pas toujours. Une batterie sert surtout aux secours et aux charges essentielles de nuit. Un système solaire sans grande batterie peut s’amortir plus vite, mais il ne maintiendra pas les appareils pendant les coupures."],
  ["Start from daily kWh, peak load, outage hours, and essential appliances. A small home may start around 1-2 kW, a family home around 3-5 kW, and businesses should do a load estimate before choosing a size.", "Partez des kWh quotidiens, de la puissance de pointe, des heures de coupure et des appareils essentiels. Un petit logement peut commencer autour de 1 à 2 kW, une maison familiale autour de 3 à 5 kW ; une entreprise doit établir un bilan de charge avant de choisir."],
  ["No. Use this for early planning and quote comparison. PVWatts, PVGIS, Global Solar Atlas, and installer design tools can model location, roof, shading, inverter limits, and production more precisely.", "Non. Utilisez cet outil pour une première planification et la comparaison de devis. PVWatts, PVGIS, Global Solar Atlas et les outils de conception des installateurs modélisent plus précisément le lieu, le toit, l’ombrage, les limites de l’onduleur et la production."],
  ["It is a planning estimate, not a quote. Accuracy improves when you use recent bills, real fuel receipts, a load profile, local solar yield, current equipment quotes, and finance terms from the provider.", "Il s’agit d’une estimation de planification, pas d’un devis. La précision augmente avec des factures récentes, de vrais reçus de carburant, un profil de charge, le rendement solaire local, des devis actuels et les conditions de financement du fournisseur."],
  ["Use the country page when you already know the installation market. Use the specialist tools when the decision is really about fuel, load size, battery runtime, or quote comparison.", "Utilisez la page pays lorsque vous connaissez déjà le marché d’installation. Utilisez les outils spécialisés lorsque la décision porte surtout sur le carburant, la puissance, l’autonomie de batterie ou la comparaison de devis."],
  ["The country pages are planning calculators that combine user-entered bills, generator spend, system size, battery choice, solar yield, performance ratio, maintenance, and financing assumptions. The root page routes you to the right local calculator and exports a quote-checklist brief.", "Les pages pays sont des calculateurs de planification qui combinent les factures saisies, les dépenses de groupe, la taille du système, la batterie, le rendement solaire, le ratio de performance, l’entretien et le financement. La page principale vous dirige vers le bon calculateur local et exporte une fiche de contrôle des devis."],
  ["Root-page briefs are local planning checklists. Replace static assumptions with a current bill, fuel receipt, installer quote, and finance terms before comparing payback.", "Les fiches de la page principale sont des listes locales de planification. Remplacez les hypothèses statiques par une facture actuelle, un reçu de carburant, un devis d’installateur et les conditions de financement avant de comparer le retour sur investissement."],
  ["Use recent grid bills, fuel receipts, outage hours, and written installer quotes before relying on a payback result.", "Utilisez des factures récentes du réseau, des reçus de carburant, les heures de coupure et des devis écrits avant de vous fier au délai de retour."],
  ["Disclaimer: Country selection and copied briefs are processed locally in your browser. This is not an installer design, live tariff feed, official energy assessment, loan quote, or financial advice.", "Avertissement : la sélection du pays et les fiches copiées sont traitées localement dans votre navigateur. Il ne s’agit ni d’une étude d’installateur, ni d’un flux tarifaire en direct, ni d’un audit énergétique officiel, ni d’une offre de prêt ou d’un conseil financier."],
  ["Compare generator fuel and maintenance against a solar and battery kit over one year and five years. Use local prices, outages, finance terms, and grid spend to decide which backup path is cheaper and more reliable.", "Comparez le carburant et l’entretien d’un groupe électrogène à un kit solaire avec batterie sur un an et cinq ans. Utilisez les prix locaux, les coupures, le financement et les dépenses du réseau pour choisir la solution de secours la moins coûteuse et la plus fiable."],
  ["Reviewed 16 May 2026. Market starter profiles use the bundled Energy dataset reviewed 2026-03; your receipts, utility bill, supplier quotes, generator manual, and installer warranty should replace those planning defaults. Prices are not live feeds.", "Révisé le 16 mai 2026. Les profils de départ utilisent le jeu de données Énergie intégré, révisé en mars 2026 ; vos reçus, facture d’électricité, devis fournisseurs, manuel du groupe et garantie de l’installateur doivent remplacer ces valeurs indicatives. Les prix ne sont pas des flux en direct."],
  ["Complete the inputs to see whether solar, generator, or a hybrid backup plan is stronger for this scenario.", "Renseignez tous les champs pour déterminer si le solaire, le groupe électrogène ou une solution hybride convient le mieux à ce scénario."],
  ["Payback is the first month where cumulative solar cost is less than or equal to cumulative generator cost.", "Le délai de retour correspond au premier mois où le coût solaire cumulé devient inférieur ou égal au coût cumulé du groupe électrogène."],
  ["Use this source checklist before committing money. The tool is based on user-entered assumptions, not a live official price feed.", "Consultez cette liste de sources avant d’engager des fonds. L’outil repose sur vos hypothèses, pas sur un flux officiel de prix en direct."],
  ["This is an estimate only for planning. It does not replace a licensed electrical design, installer site survey, generator manual, lender quote, insurance review, or official utility guidance.", "Cette estimation sert uniquement à la planification. Elle ne remplace pas une étude électrique agréée, une visite de site, le manuel du groupe, une offre de financement, une analyse d’assurance ou les consignes officielles du fournisseur d’énergie."],
  ["Use these tools to size loads, check fuel burn, and turn the estimate into a budget or vendor brief.", "Utilisez ces outils pour dimensionner les charges, vérifier la consommation de carburant et transformer l’estimation en budget ou en fiche fournisseur."],
  ["Free Electricity Tariff Calculator for all 54 African countries. Select your country to calculate with local rates and data. Covering all 54 African nations with local rates and data.", "Calculateur gratuit de tarifs d’électricité pour les 54 pays africains. Sélectionnez votre pays pour utiliser les tarifs et données locales."],
  ["Start with a bundled country and account-class tariff, then replace it with the rate on your latest bill or token receipt. The estimate stays in your browser and shows each charge separately.", "Commencez avec le tarif pays et la catégorie de compte intégrés, puis remplacez-le par le taux de votre dernière facture ou de votre reçu de jeton. L’estimation reste dans le navigateur et détaille chaque charge."],
  ["Use the rate per kWh on your latest bill, token receipt, utility notice, or regulator notice. The bundled country value is a dated planning default and may not match your service band, meter type, distributor, or current tariff.", "Utilisez le tarif par kWh de votre dernière facture, reçu de jeton, notification du fournisseur ou du régulateur. La valeur pays intégrée est une hypothèse datée qui peut différer de votre tranche de service, type de compteur, distributeur ou tarif actuel."],
  ["Utilities may apply tariff bands, fixed or service charges, VAT or tax, arrears, debt recovery, estimated readings, fuel or forex adjustments, and meter corrections. Add known fixed charges and compare the breakdown with your bill.", "Les fournisseurs peuvent appliquer des tranches tarifaires, des frais fixes ou de service, la TVA, des arriérés, un recouvrement de dette, des relevés estimés, des ajustements de carburant ou de change et des corrections de compteur. Ajoutez les frais fixes connus et comparez le détail à votre facture."],
  ["Use it as a planning check, not an official determination. Keep the original bill, meter photos, token receipts, payment records, and the current utility or regulator tariff notice when you raise a dispute.", "Utilisez-le comme contrôle de planification, pas comme décision officielle. Conservez la facture originale, les photos du compteur, les reçus de jetons, les preuves de paiement et l’avis tarifaire actuel du fournisseur ou du régulateur en cas de contestation."],
  ["Check whether a power bill is close to the amount your kWh usage, tariff, fixed charges, VAT, arrears, and meter type suggest. Export the variance and a dispute checklist before calling the utility.", "Vérifiez si une facture d’électricité correspond approximativement à la consommation en kWh, au tarif, aux frais fixes, à la TVA, aux arriérés et au type de compteur. Exportez l’écart et une liste de contestation avant de contacter le fournisseur."],
  ["Reviewed 16 May 2026. Use your current bill, meter reading, tariff sheet, utility notice, and official electricity regulator or energy authority updates. This page does not use live tariff feeds.", "Révisé le 16 mai 2026. Utilisez votre facture actuelle, le relevé du compteur, la grille tarifaire, l’avis du fournisseur et les mises à jour officielles du régulateur ou de l’autorité de l’énergie. Cette page n’utilise pas de flux tarifaire en direct."],
  ["Meter-reading evidence: enter numeric readings only—never an account number, meter number, phone number, or payment reference. Results are not stored automatically; use Copy or CSV only when you choose.", "Preuve de relevé : saisissez uniquement des valeurs numériques, jamais un numéro de compte, de compteur, de téléphone ou une référence de paiement. Les résultats ne sont pas enregistrés automatiquement ; utilisez Copier ou CSV seulement si vous le choisissez."],
  ["The calculation method rebuilds the bill from your tariff inputs, then compares the result with the actual bill.", "La méthode reconstitue la facture à partir des tarifs saisis, puis compare le résultat à la facture réelle."],
  ["Use current local records. The page is not a live tariff database and does not claim official bill approval.", "Utilisez des documents locaux à jour. La page n’est pas une base tarifaire en direct et ne prétend pas valider officiellement la facture."],
  ["This tool is an estimate only. It does not replace the utility's official account ledger, a licensed meter test, regulator decision, or legal advice.", "Cet outil fournit uniquement une estimation. Il ne remplace ni le relevé officiel du fournisseur, ni un test de compteur agréé, ni une décision du régulateur ou un conseil juridique."]
  ,
  ["enter the pump price from a recent receipt and keep its date with the exported estimate.", "saisissez le prix à la pompe d’un reçu récent et conservez sa date avec l’estimation exportée."],
  ["compare the estimate with litres used during a known run period; generator model, age, load and maintenance can move the result.", "comparez l’estimation aux litres utilisés pendant une période connue ; le modèle, l’âge, la charge et l’entretien du groupe peuvent modifier le résultat."],
  ["The page labels that value as a planning default and keeps a user-entered pump price local to the browser.", "La page présente cette valeur comme une hypothèse de planification et conserve dans le navigateur le prix à la pompe saisi par l’utilisateur."],
  ["Use the country page first, then move to the specific calculator that answers your next question. For background reading, start with the ", "Utilisez d’abord la page pays, puis ouvrez le calculateur précis qui répond à votre question suivante. Pour le contexte, commencez par le "],
  ["Country selection and copied briefs are processed locally in your browser. This is not an installer design, live tariff feed, official energy assessment, loan quote, or financial advice.", "La sélection du pays et les fiches copiées sont traitées localement dans votre navigateur. Il ne s’agit ni d’une étude d’installateur, ni d’un flux tarifaire en direct, ni d’un audit énergétique officiel, ni d’une offre de prêt ou d’un conseil financier."],
  ["enter numeric readings only—never an account number, meter number, phone number, or payment reference. Results are not stored automatically; use Copy or CSV only when you choose.", "saisissez uniquement des valeurs numériques, jamais un numéro de compte, de compteur, de téléphone ou une référence de paiement. Les résultats ne sont pas enregistrés automatiquement ; utilisez Copier ou CSV seulement si vous le choisissez."]
]);

function knownEnergyTransforms() {
  return [...FRENCH_COPY_REPLACEMENTS, ...FRENCH_VISIBLE_COPY].map(([english, french]) => [
    new RegExp(String(english).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
    french,
  ]);
}

function runtimeVisibleTransforms() {
  const runtime = fs.readFileSync(path.join(ROOT, "assets/js/pages/french-energy-parity.js"), "utf8");
  const match = runtime.match(/var exact = (\[[\s\S]*?\]);\s*\n\s*var words =/);
  if (!match) throw new Error("French Energy runtime translation catalog is unreadable.");
  const exact = vm.runInNewContext(match[1]);
  return exact.map(([english, french]) => [
    new RegExp(String(english).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
    french,
  ]);
}

function fileForRoute(route) {
  return path.join(ROOT, route.replace(/^\/|\/$/g, ""), "index.html");
}

function replaceMeta(html, attribute, attributeValue, value) {
  const escaped = String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const marker = attributeValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(<meta\\s+[^>]*${attribute}=[\"']${marker}[\"'][^>]*content=[\"'])[^\"']*([\"'][^>]*>)`, "i");
  const reverse = new RegExp(`(<meta\\s+[^>]*content=[\"'])[^\"']*([\"'][^>]*${attribute}=[\"']${marker}[\"'][^>]*>)`, "i");
  if (pattern.test(html)) return html.replace(pattern, `$1${escaped}$2`);
  if (reverse.test(html)) return html.replace(reverse, `$1${escaped}$2`);
  return html;
}

function replaceTitle(html, title) {
  return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title} | AfroTools</title>`);
}

function replaceFirstH1(html, title) {
  return html.replace(/(<h1\b[^>]*>)[\s\S]*?(<\/h1>)/i, `$1${title}$2`);
}

function routeMap() {
  return Object.fromEntries(FRENCH_ENERGY_APPS.map((app) => [app.enRoute, app.frRoute]));
}

function configPayload(app) {
  return {
    id: app.id,
    title: app.title,
    description: app.description,
    enRoute: app.enRoute,
    frRoute: app.frRoute,
    reviewedAt: app.reviewedAt,
    sourceLabel: app.sourceLabel,
    confidence: app.confidence,
    routeMap: routeMap(),
  };
}

function alternateTag(html, language) {
  const escaped = language.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `<link\\b(?=[^>]*\\brel=["']alternate["'])(?=[^>]*\\bhreflang=["']${escaped}["'])[^>]*>`,
    "i"
  );
  return html.match(pattern)?.[0] || "";
}

function postProcess(app) {
  const output = fileForRoute(app.frRoute);
  let html = fs.readFileSync(output, "utf8");
  const englishHtml = fs.readFileSync(fileForRoute(app.sourceRoute), "utf8");
  const canonical = `${SITE}${app.frRoute}`;
  const image = `${SITE}${app.image}`;

  html = replaceTitle(html, app.title);
  html = replaceMeta(html, "name", "description", app.description);
  html = replaceMeta(html, "property", "og:description", app.description);
  html = replaceMeta(html, "name", "twitter:description", app.description);
  html = html
    .replace(/(<meta\s+[^>]*property=["']og:title["'][^>]*content=["'])[^"']*(["'][^>]*>)/i, `$1${app.title} | AfroTools$2`)
    .replace(/(<meta\s+[^>]*name=["']twitter:title["'][^>]*content=["'])[^"']*(["'][^>]*>)/i, `$1${app.title} | AfroTools$2`)
    .replace(/(<meta\s+[^>]*property=["']og:url["'][^>]*content=["'])[^"']*(["'][^>]*>)/i, `$1${canonical}$2`)
    .replace(/(<meta\s+[^>]*property=["']og:image["'][^>]*content=["'])[^"']*(["'][^>]*>)/i, `$1${image}$2`)
    .replace(/"inLanguage"\s*:\s*"[^"]*"/g, '"inLanguage": "fr"')
    .replace(/<html\b([^>]*)\blang=["'][^"']*["']([^>]*)>/i, '<html$1lang="fr"$2>')
    .replace(/<body\b([^>]*)>/i, (match, attributes) => {
      if (/class=["'][^"']*fr-energy-parity/.test(match)) return match;
      if (/class=["']/.test(match)) return match.replace(/class=(["'])([^"']*)\1/, 'class=$1$2 fr-energy-parity$1');
      return `<body${attributes} class="fr-energy-parity">`;
    });

  html = replaceFirstH1(html, app.title);
  html = localizeVisibleLanguage(
    html,
    [...knownEnergyTransforms(), ...runtimeVisibleTransforms()]
  );

  html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${canonical}">`);
  if (app.standaloneLocalizedAlias) {
    html = html.replace(/<link\b(?=[^>]*\brel=["']alternate["'])[^>]*>\s*/gi, "");
    html = html.replace(
      "</head>",
      `<link rel="alternate" hreflang="fr" href="${canonical}">\n<link rel="alternate" hreflang="x-default" href="${canonical}">\n</head>`
    );
  } else {
    if (!new RegExp(`hreflang=["']en["'][^>]+${app.enRoute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(html)) {
      html = html.replace("</head>", `<link rel="alternate" hreflang="en" href="${SITE}${app.enRoute}">\n</head>`);
    }
    if (!new RegExp(`hreflang=["']fr["'][^>]+${app.frRoute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(html)) {
      html = html.replace("</head>", `<link rel="alternate" hreflang="fr" href="${canonical}">\n</head>`);
    }
    const swahiliAlternate = alternateTag(englishHtml, "sw");
    html = html.replace(
      /<link\b(?=[^>]*\brel=["']alternate["'])(?=[^>]*\bhreflang=["']sw["'])[^>]*>\s*/gi,
      ""
    );
    if (swahiliAlternate) {
      html = html.replace("</head>", `${swahiliAlternate}\n</head>`);
    }
  }

  html = html.replace(/<meta\s+name=["']afrotools-source-owner["'][^>]*>\s*/gi, "");
  html = html.replace(/<meta\s+name=["']afrotools-content-id["'][^>]*>\s*/gi, "");
  html = html.replace(
    /(<meta\s+charset=[^>]+>)/i,
    `$1\n<meta name="afrotools-source-owner" content="scripts/build-french-energy-parity.js">\n<meta name="afrotools-content-id" content="fr-energy-parity:${app.id}">`
  );

  html = html.replace(/<link\s+rel=["']stylesheet["']\s+href=["']\/assets\/css\/french-energy-parity\.css[^>]*>\s*/gi, "");
  html = html.replace(/<script\s+type=["']application\/ld\+json["']\s+data-fr-energy-schema>[\s\S]*?<\/script>\s*/gi, "");
  html = html.replace(/<script\s+type=["']application\/json["']\s+data-fr-energy-config>[\s\S]*?<\/script>\s*/gi, "");
  const appSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: app.title,
    description: app.description,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    inLanguage: "fr",
    url: canonical,
    isBasedOn: `${SITE}${app.enRoute}`,
    image,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  }).replace(/</g, "\\u003c");
  html = html.replace(
    "</head>",
    `<link rel="stylesheet" href="/assets/css/french-energy-parity.css">\n` +
    `<script type="application/ld+json" data-fr-energy-schema>${appSchema}</script>\n` +
    `<script type="application/json" data-fr-energy-config>${JSON.stringify(configPayload(app)).replace(/</g, "\\u003c")}</script>\n</head>`
  );

  const summary = `<section class="fr-energy-native-summary" aria-label="Résumé de l’outil" style="width:min(1120px,calc(100% - 32px));margin:18px auto;padding:16px;border:1px solid #dbe4ef;border-radius:14px;background:#fff;color:#0f172a"><p style="margin:0;line-height:1.65">${app.description} Les calculs restent locaux sur cet appareil.</p></section>`;
  if (!html.includes("fr-energy-native-summary")) {
    html = html.replace(/(<\/h1>)/i, `$1\n${summary}`);
  }

  html = html
    .replace(/href=(["'])\/fr\/tools\/\1/gi, "href=$1/fr/all-tools/$1")
    .replace(/href=(["'])\/fr\/terms\/\1/gi, "href=$1/fr/terms-of-use/$1")
    .replace(/href=(["'])\/fr\/tools\/fuel-tracker\/\1/gi, "href=$1/fr/tools/suivi-carburant/$1");

  html = html.replace(/<script\s+src=["']\/assets\/js\/pages\/french-energy-parity\.js["'][^>]*><\/script>\s*/gi, "");
  html = html.replace("</body>", `<script src="/assets/js/pages/french-energy-parity.js"></script>\n</body>`);
  fs.writeFileSync(output, html);
}

function buildHub() {
  const analyticsBootstrap = earlyBootstrapTag(bootstrapVersion(), analyticsVersion());
  const analyticsLoader = canonicalLoaderTag(analyticsVersion());
  const cards = FRENCH_ENERGY_APPS.map((app) => `
      <article class="energy-card" data-intent="${app.intent}">
        <a href="${app.frRoute}">
          <img src="${app.image}" width="800" height="450" loading="lazy" alt="" aria-hidden="true">
          <div><span>${app.intent}</span><h2>${app.title}</h2><p>${app.description}</p><strong>Ouvrir l’outil →</strong></div>
        </a>
      </article>`).join("");
  const itemList = FRENCH_ENERGY_APPS.map((app, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: app.title,
    url: `${SITE}${app.frRoute}`,
  }));
  const schema = JSON.stringify([
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Énergie et services publics — AfroTools",
      description: "Vingt calculateurs énergie en français pour l’électricité, le solaire, les batteries, l’eau, le GPL, les coupures et les générateurs.",
      url: `${SITE}/fr/energy/`,
      inLanguage: "fr",
      mainEntity: { "@type": "ItemList", numberOfItems: 20, itemListElement: itemList },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: `${SITE}/fr/` },
        { "@type": "ListItem", position: 2, name: "Énergie et services publics", item: `${SITE}/fr/energy/` },
      ],
    },
  ]).replace(/</g, "\\u003c");

  const html = enhanceCategory(`<!doctype html>
<html lang="fr" data-theme-choice="auto">
<head>
  ${analyticsBootstrap}
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="afrotools-source-owner" content="scripts/build-french-energy-parity.js">
  <meta name="afrotools-content-id" content="fr-energy-parity:hub">
  <title>20 outils énergie et services publics en français | AfroTools</title>
  <meta name="description" content="Vingt calculateurs énergie complets en français : électricité, solaire, batteries, eau, GPL, coupures, biogaz et générateurs.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${SITE}/fr/energy/">
  <link rel="alternate" hreflang="en" href="${SITE}/energy/">
  <link rel="alternate" hreflang="fr" href="${SITE}/fr/energy/">
  <link rel="alternate" hreflang="sw" href="${SITE}/sw/nishati-na-huduma/">
  <link rel="alternate" hreflang="x-default" href="${SITE}/energy/">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:title" content="20 outils énergie et services publics en français | AfroTools">
  <meta property="og:description" content="Calculez factures, solaire, batteries, eau, GPL, coupures, biogaz et générateurs avec des hypothèses africaines explicites.">
  <meta property="og:url" content="${SITE}/fr/energy/">
  <meta property="og:image" content="${SITE}/assets/img/og/og-default.png">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">${schema}</script>
  <link rel="stylesheet" href="/assets/css/design-system.css">
  <link rel="stylesheet" href="/assets/css/global.min.css">
  <style>
    .energy-shell{width:min(1180px,calc(100% - 32px));margin:0 auto;padding:96px 0 56px}
    .energy-hero{max-width:850px}.energy-hero h1{font-size:clamp(2.2rem,6vw,4.6rem);line-height:1;margin:.25rem 0 1rem}.energy-hero p{font-size:1.08rem;line-height:1.7;color:var(--color-text-muted,#475569)}
    .energy-finder{margin:28px 0;padding:16px;border:1px solid var(--color-border,#dbe4ef);border-radius:16px;background:var(--color-surface,#fff)}
    .energy-finder label{display:grid;gap:7px;font-weight:800}.energy-finder input{min-height:48px;border:1px solid var(--color-border,#cbd5e1);border-radius:10px;padding:10px 12px;font:inherit;background:var(--color-bg,#fff);color:inherit}
    .energy-count{margin:10px 0 0;color:var(--color-text-muted,#475569)}
    .energy-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.energy-card{min-width:0;border:1px solid var(--color-border,#dbe4ef);border-radius:16px;overflow:hidden;background:var(--color-surface,#fff)}
    .energy-card a{display:grid;height:100%;color:inherit;text-decoration:none}.energy-card img{width:100%;height:160px;object-fit:cover}.energy-card div{display:grid;align-content:start;gap:7px;padding:16px}.energy-card span{text-transform:capitalize;color:#0f766e;font-size:.78rem;font-weight:850}.energy-card h2{font-size:1.05rem;margin:0}.energy-card p{margin:0;color:var(--color-text-muted,#475569);line-height:1.55}.energy-card strong{margin-top:5px;color:var(--color-primary,#2563eb)}
    .energy-card a:focus-visible,.energy-finder input:focus-visible{outline:3px solid #60a5fa;outline-offset:3px}.energy-empty{padding:28px;text-align:center;border:1px dashed #94a3b8;border-radius:14px}
    @media(max-width:860px){.energy-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:520px){.energy-shell{width:calc(100% - 20px);padding-top:76px}.energy-grid{grid-template-columns:1fr}.energy-card img{height:145px}}
    @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
  </style>
</head>
<body>
  <afro-navbar></afro-navbar>
  <main class="energy-shell">
    <nav aria-label="Fil d’Ariane"><a href="/fr/">Accueil</a> / Énergie</nav>
    <header class="energy-hero"><p>Énergie et services publics</p><h1>20 outils, du compteur à l’autonomie</h1><p>Chaque outil conserve la formule et les hypothèses de son application anglaise, avec une interface française, les unités et devises du pays, un état de fraîcheur explicite et des exports locaux.</p></header>
    <section class="energy-finder" aria-labelledby="energy-finder-title">
      <h2 id="energy-finder-title">Trouver un outil</h2>
      <label for="energy-search">Besoin, appareil ou type de coût
        <input id="energy-search" type="search" autocomplete="off" placeholder="Ex. batterie, facture, GPL, solaire, coupure">
      </label>
      <p class="energy-count" aria-live="polite"><strong data-energy-count>20</strong> outils affichés sur 20.</p>
    </section>
    <section class="energy-grid" aria-label="Catalogue des 20 outils énergie">${cards}</section>
    <p class="energy-empty" data-energy-empty hidden>Aucun outil ne correspond. Effacez la recherche pour revoir les 20 outils.</p>
  </main>
  <afro-footer></afro-footer>
  <script src="/assets/js/components/navbar.min.js" defer></script>
  <script src="/assets/js/components/footer.min.js" defer></script>
  <script>
    (function(){var input=document.getElementById("energy-search"),cards=Array.from(document.querySelectorAll(".energy-card")),count=document.querySelector("[data-energy-count]"),empty=document.querySelector("[data-energy-empty]");function run(){var q=input.value.trim().toLocaleLowerCase("fr");var visible=0;cards.forEach(function(card){var show=!q||card.textContent.toLocaleLowerCase("fr").includes(q);card.hidden=!show;if(show)visible+=1});count.textContent=String(visible);empty.hidden=visible!==0}input.addEventListener("input",run);run()})();
  </script>
  ${analyticsLoader}
</body>
</html>`, "fr");
  fs.mkdirSync(path.dirname(fileForRoute("/fr/energy/")), { recursive: true });
  fs.writeFileSync(fileForRoute("/fr/energy/"), html);
}

function validateOutput(app) {
  const output = fileForRoute(app.frRoute);
  if (!fs.existsSync(output)) throw new Error(`Missing French Energy route: ${app.frRoute}`);
  const html = fs.readFileSync(output, "utf8");
  const required = [
    `fr-energy-parity:${app.id}`,
    `data-fr-energy-config`,
    `/assets/css/french-energy-parity.css`,
    `/assets/js/pages/french-energy-parity.js`,
    `href="${SITE}${app.frRoute}"`,
    `"inLanguage":"fr"`,
  ];
  if (!app.standaloneLocalizedAlias) required.push(`hreflang="en"`, `hreflang="fr"`, `hreflang="sw"`);
  required.forEach((token) => {
    if (!html.includes(token)) throw new Error(`${app.frRoute} missing ${token}`);
  });
}

function main() {
  if (!CHECK) {
    for (const app of FRENCH_ENERGY_APPS) {
      if (app.buildSourceId) {
        fs.copyFileSync(fileForRoute("/fr/tools/tarifs-electricite/"), fileForRoute(app.frRoute));
      } else {
        execFileSync(process.execPath, [
          path.join(ROOT, "scripts/build-i18n.js"),
          "--lang", "fr",
          "--page", `tools/${app.id}`,
          "--overwrite-existing",
        ], { cwd: ROOT, stdio: "pipe" });
      }
      postProcess(app);
      console.log(`Built ${app.frRoute}`);
    }
    buildHub();
  }

  FRENCH_ENERGY_APPS.forEach(validateOutput);
  const hub = fs.readFileSync(fileForRoute("/fr/energy/"), "utf8");
  const cardCount = (hub.match(/class="energy-card"/g) || []).length;
  if (cardCount !== 20 || !hub.includes('"numberOfItems":20') || !hub.includes('hreflang="sw"')) {
    throw new Error(`French Energy hub denominator mismatch: ${cardCount}/20`);
  }
  console.log(`French Energy parity ${CHECK ? "check" : "build"} passed: 20/20 apps.`);
}

main();

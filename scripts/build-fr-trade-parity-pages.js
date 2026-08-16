"use strict";

const fs = require("fs");
const path = require("path");
const { normalizeBuildManagedHtml } = require("./lib/shared-asset-references");

const root = path.resolve(__dirname, "..");
const check = process.argv.includes("--check");
const slugArgument = process.argv.find((argument) => argument.startsWith("--slugs="));
const requestedSlugs = slugArgument
  ? new Set(slugArgument.slice("--slugs=".length).split(",").map((slug) => slug.trim()).filter(Boolean))
  : null;

function field(label, name, options = {}) {
  const wide = options.wide ? " fr-trade-field--wide" : "";
  const required = options.required ? " required" : "";
  const min = options.min !== undefined ? ` min="${options.min}"` : "";
  const step = options.step !== undefined ? ` step="${options.step}"` : "";
  const value = options.value !== undefined ? ` value="${options.value}"` : "";
  const placeholder = options.placeholder ? ` placeholder="${options.placeholder}"` : "";
  const help = options.help ? `<small>${options.help}</small>` : "";
  if (options.type === "select") {
    const choices = (options.choices || []).map(([key, text]) => `<option value="${key}">${text}</option>`).join("");
    return `<div class="fr-trade-field${wide}"><label for="${name}">${label}</label><select id="${name}" name="${name}"${required}>${options.blank === false ? "" : '<option value="">Choisir…</option>'}${choices}</select>${help}</div>`;
  }
  if (options.type === "textarea") {
    return `<div class="fr-trade-field${wide}"><label for="${name}">${label}</label><textarea id="${name}" name="${name}"${required}${placeholder}></textarea>${help}</div>`;
  }
  if (options.type === "checkbox") {
    return `<label class="fr-trade-check${wide}"><input type="checkbox" name="${name}"${options.checked ? " checked" : ""}><span><strong>${label}</strong>${options.help ? `<br><small>${options.help}</small>` : ""}</span></label>`;
  }
  return `<div class="fr-trade-field${wide}"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${options.type || "text"}"${required}${min}${step}${value}${placeholder} inputmode="${options.type === "number" ? "decimal" : "text"}">${help}</div>`;
}

const currencies = [["USD", "USD"], ["EUR", "EUR"], ["XOF", "XOF"], ["XAF", "XAF"], ["NGN", "NGN"], ["KES", "KES"], ["ZAR", "ZAR"], ["GHS", "GHS"], ["MAD", "MAD"]];
const currencyField = (value = "USD") => field("Devise de travail", "currency", { type: "select", blank: false, choices: currencies.map(([key, text]) => [key, key === value ? `${text} (par défaut)` : text]) });

const pages = [
  {
    slug: "cout-rendu", tool: "landed-cost", en: "/tools/import-duty/", sw: "/sw/zana/gharama-bidhaa/", image: "import-duty.webp",
    title: "Calculateur de coût rendu import | AfroTools", name: "Calculateur de coût rendu",
    description: "Estimez en français le coût rendu d’une importation avec FOB, fret, assurance, droits, TVA, frais locaux et coût unitaire.",
    eyebrow: "Importation · budget local", lead: "Construisez un coût rendu transparent à partir de vos propres taux, sans masquer les hypothèses douanières.",
    intro: "Saisissez les montants et taux provenant de votre devis, transitaire ou autorité. Aucun taux légal n’est inventé ni récupéré en arrière-plan.",
    dataScripts: ["/data/trade/country-duty-rates.js", "/data/trade/landed-cost-data.js", "/data/trade/fx-history.js", "/engines/landed-cost-engine.js"],
    fields: [
      field("Pays de destination", "destCountry", { type: "select", blank: false, choices: [] }),
      field("Port d’arrivée", "port", { type: "select", blank: false, choices: [] }),
      field("Valeur FOB (USD)", "fobUSD", { type: "number", min: 0, step: .01, required: true, placeholder: "10000" }),
      field("Fret international (USD)", "freightUSD", { type: "number", min: 0, step: .01, value: 0 }),
      field("Assurance (USD)", "insuranceUSD", { type: "number", min: 0, step: .01, value: 0 }),
      field("Taux de droits (%)", "dutyRate", { type: "number", min: 0, step: .01, value: 0, help: "À confirmer avec le tarif national applicable au code SH." }),
      field("Taux de change local pour 1 USD", "fxRate", { type: "number", min: 0.000001, step: .000001, required: true, value: 1 }),
      field("Nombre d’unités", "quantity", { type: "number", min: 1, step: 1, value: 1 }),
      field("Courtage local", "brokerFeeLocal", { type: "number", min: 0, step: .01, value: 0 }),
      field("Manutention locale", "handlingLocal", { type: "number", min: 0, step: .01, value: 0 }),
      field("Transport local", "haulageLocal", { type: "number", min: 0, step: .01, value: 0 }),
      field("Prix de vente local par unité", "sellPriceLocal", { type: "number", min: 0, step: .01, value: 0 })
    ],
    sources: [["Registre AfroTools des autorités douanières", "/data/trade/official-sources.json"], ["Organisation mondiale des douanes", "https://www.wcoomd.org/"]],
    warning: "Estimation de planification uniquement. La base TVA, les exonérations, le classement et les prélèvements varient selon le pays et la marchandise.",
    faq: [["Le résultat est-il un montant officiel ?", "Non. Il applique uniquement vos valeurs et taux. La déclaration douanière et l’autorité compétente restent la référence."], ["Pourquoi laisser les taux à zéro ?", "Pour éviter qu’un taux ancien ou absent soit présenté comme gratuit ou officiel. Vous devez saisir le taux vérifié pour votre opération."]]
  },
  {
    slug: "calculateur-credit-documentaire", tool: "lc-fees", en: "/tools/lc-calculator/", sw: "/sw/zana/ada-lc/", image: "lc-calculator.webp",
    title: "Frais de crédit documentaire (LC) | AfroTools", name: "Calculateur de crédit documentaire",
    description: "Estimez localement les commissions d’ouverture, confirmation, financement, SWIFT et avenants d’un crédit documentaire.",
    eyebrow: "Commerce international · banque", lead: "Transformez la grille tarifaire de votre banque en une estimation lisible du coût d’un crédit documentaire.",
    intro: "Les frais bancaires sont commerciaux et variables. Entrez la grille qui vous a été communiquée; les taux proposés ne sont pas présentés comme actuels.",
    dataScripts: ["/engines/lc-fee-engine.js"],
    fields: [
      field("Valeur du crédit documentaire (USD)", "lcValue", { type: "number", min: 0, step: .01, required: true }),
      field("Pays de la banque émettrice", "countryCode", { type: "select", blank: false, choices: [["KE", "Kenya"], ["NG", "Nigeria"], ["GH", "Ghana"], ["ZA", "Afrique du Sud"], ["EG", "Égypte"], ["MA", "Maroc"], ["ET", "Éthiopie"], ["TZ", "Tanzanie"], ["UG", "Ouganda"], ["CI", "Côte d’Ivoire"]] }),
      field("Type de crédit documentaire", "lcType", { type: "select", blank: false, choices: [["sight", "À vue"], ["usance30", "Usance 30 jours"], ["usance60", "Usance 60 jours"], ["usance90", "Usance 90 jours"], ["usance180", "Usance 180 jours"]] }),
      field("Nombre d’avenants", "amendments", { type: "number", min: 0, step: 1, value: 0 }),
      field("Inclure une confirmation bancaire", "confirmed", { type: "checkbox" }),
      field("Inclure le dépôt de marge", "includeMargin", { type: "checkbox" })
    ],
    sources: [["Chambre de commerce internationale", "https://iccwbo.org/"], ["Registre de sources Commerce AfroTools", "/data/trade/official-sources.json"]],
    warning: "Demandez les minimums, taxes, marges de change, garanties et périodes de facturation à la banque émettrice et à la banque confirmatrice.",
    faq: [["Pourquoi le calcul utilise-t-il des périodes de 90 jours ?", "De nombreuses grilles facturent par trimestre ou fraction de trimestre. Adaptez le taux si votre banque applique une autre base."], ["AfroTools recommande-t-il une banque ?", "Non. L’outil compare uniquement les paramètres que vous saisissez."]]
  },
  {
    slug: "documents-export", tool: "export-documents", en: "/tools/export-docs/", sw: "/sw/zana/orodha-nyaraka-usafirishaji/", image: "export-docs-trade.webp",
    title: "Checklist documents d’exportation | AfroTools", name: "Checklist documents d’exportation",
    description: "Préparez une checklist française des documents export selon trajet, produit, transport, paiement, origine préférentielle et réglementation.",
    eyebrow: "Export · dossier documentaire", lead: "Préparez un jeu documentaire cohérent avant la réservation, la banque et la déclaration.",
    intro: "Cette checklist organise le travail; elle ne remplace pas les exigences propres au code SH, au pays, au produit, au client ou au crédit documentaire.",
    dataScripts: ["/data/trade/export-docs-data.js", "/engines/export-docs-engine.js"],
    fields: [
      field("Pays exportateur", "exportCountry", { type: "select", blank: false, choices: [] }),
      field("Catégorie de produit", "productCat", { type: "select", blank: false, choices: [] }),
      field("Destination / régime", "exportDest", { type: "select", blank: false, choices: [] })
    ],
    sources: [["Organisation mondiale des douanes", "https://www.wcoomd.org/"], ["Organisation mondiale du commerce", "https://www.wto.org/"], ["Secrétariat de la ZLECAf", "https://au-afcfta.org/"]],
    warning: "La checklist ne confirme ni licence, ni admissibilité préférentielle, ni conformité documentaire. Vérifiez le portail douanier et les conditions du transporteur ou de la banque.",
    faq: [["La checklist couvre-t-elle tous les documents ?", "Non. Elle fournit un noyau de préparation et ajoute des signaux selon vos réponses. Le produit et la destination peuvent imposer d’autres pièces."], ["Puis-je l’envoyer à ma banque ?", "Oui comme brouillon de travail, après relecture et adaptation aux conditions exactes de la banque."]]
  },
  {
    slug: "comparateur-financement-commerce", tool: "trade-finance", en: "/tools/trade-finance-comparator/", sw: "/sw/zana/kilinganisha-fedha-za-biashara/", image: "trade-finance-comparator.webp",
    title: "Comparateur financement du commerce | AfroTools", name: "Comparateur de financement commercial",
    description: "Comparez en français LC, remise documentaire, virement anticipé, compte ouvert et garantie stand-by avec vos propres frais.",
    eyebrow: "Trésorerie · risque commercial", lead: "Comparez le coût estimé et le niveau de protection de cinq instruments sans confondre prix bas et risque faible.",
    intro: "Les taux sont entièrement modifiables. Le classement financier n’est pas une recommandation bancaire ni une évaluation de la contrepartie.",
    dataScripts: ["/data/trade/trade-finance-data.js", "/engines/trade-finance-engine.js"],
    fields: [
      field("Valeur commerciale (USD)", "tradeValue", { type: "number", min: 0, step: .01, required: true }),
      field("Pays de la banque", "countryCode", { type: "select", blank: false, choices: [["KE", "Kenya"], ["NG", "Nigeria"], ["GH", "Ghana"], ["ZA", "Afrique du Sud"], ["EG", "Égypte"], ["MA", "Maroc"], ["ET", "Éthiopie"], ["TZ", "Tanzanie"], ["UG", "Ouganda"], ["CI", "Côte d’Ivoire"]] }),
      field("Instrument à détailler", "instrumentId", { type: "select", blank: false, choices: [["lc_sight", "LC à vue"], ["lc_usance", "LC usance"], ["tt_advance", "Virement anticipé"], ["cad", "Remise documentaire"], ["open_account", "Compte ouvert"], ["sblc", "Garantie stand-by"]] }),
      field("Durée (jours)", "tenorDays", { type: "number", min: 0, step: 1, value: 90 }),
      field("LC confirmée", "confirmed", { type: "checkbox", checked: true }),
      field("Première transaction avec ce partenaire", "firstTime", { type: "checkbox" }),
      field("Paiement différé nécessaire", "needDeferred", { type: "checkbox" }),
      field("Relation commerciale régulière", "regular", { type: "checkbox" }),
      field("Transaction intra-africaine", "intraAfrica", { type: "checkbox" })
    ],
    sources: [["Chambre de commerce internationale", "https://iccwbo.org/"], ["Afreximbank", "https://www.afreximbank.com/"]],
    warning: "Les frais, garanties, marges, délais et niveaux de recours dépendent du contrat et des banques. Confirmez chaque scénario par écrit.",
    faq: [["Pourquoi l’option la moins chère n’est-elle pas forcément recommandée ?", "Parce que le risque de non-livraison, de non-paiement ou de non-conformité documentaire peut dépasser l’économie de frais."], ["Les taux viennent-ils d’Afreximbank ?", "Non. Les calculs utilisent exclusivement les taux que vous saisissez. Les liens servent de repères institutionnels."]]
  },
  {
    slug: "suivi-matieres-premieres", tool: "commodity-tracker", en: "/tools/commodity-tracker/", sw: "/sw/zana/ufuatiliaji-bei-za-bidhaa/", image: "commodity-tracker.webp",
    title: "Matières premières africaines : repère 2024 | AfroTools", name: "Repère des matières premières",
    description: "Explorez en français un instantané 2024 des matières premières par pays africain, avec limites, millésime et exports locaux.",
    eyebrow: "Données commerciales · historique", lead: "Explorez un jeu de données statique et daté sans le présenter comme un cours en direct.",
    intro: "Utilisez ce repère pour formuler une question ou préparer une recherche. Pour une transaction, confirmez le prix, le grade, l’unité, la date et le lieu de livraison.",
    dataScripts: ["/data/trade/commodity-trade-data.js", "/engines/commodity-engine.js"],
    fields: [
      field("Pays", "country", { type: "select", required: true, choices: [] }), field("Filtrer par matière ou catégorie", "commodity", { placeholder: "cacao, cuivre, énergie…" })
    ],
    sources: [["UN Comtrade", "https://comtradeplus.un.org/"], ["Banque mondiale — marchés de matières premières", "https://www.worldbank.org/en/research/commodity-markets"]],
    warning: "Données AfroTools de planification datées de 2024. Aucun prix, volume ou classement n’est en direct.",
    faq: [["Puis-je utiliser ces valeurs pour fixer un prix aujourd’hui ?", "Non. Elles servent de contexte historique. Utilisez une source de marché datée et adaptée au grade, à l’unité et au lieu."], ["Pourquoi afficher 2024 ?", "Le millésime visible empêche de confondre l’instantané du jeu de données avec une valeur actuelle."]]
  },
  {
    slug: "comparateur-paiements", tool: "payment-comparator", en: "/tools/payment-comparator/", image: "payment-comparator.webp",
    title: "Comparateur paiements B2B Afrique | AfroTools", name: "Comparateur de paiements B2B",
    description: "Comparez trois options de paiement B2B avec frais fixes, pourcentage, marge de change, montant net et délai saisis par vos soins.",
    eyebrow: "Paiements · coûts modifiables", lead: "Comparez des devis réels sans transformer d’anciens tarifs commerciaux en promesses actuelles.",
    intro: "Remplacez les exemples par les conditions écrites de chaque prestataire. Le calcul reste local et n’envoie aucun montant.",
    dataScripts: ["/data/trade/b2b-payments-data.js", "/engines/payment-comparator-engine.js"],
    fields: [
      field("Montant à envoyer (USD)", "amount", { type: "number", min: 0, step: .01, required: true }),
      field("Fréquence du scénario", "frequency", { type: "select", blank: false, choices: [["monthly", "Mensuelle"], ["weekly", "Hebdomadaire"], ["daily", "Quotidienne"]] }),
      field("Prestataire du scénario", "scenarioProvider", { type: "select", blank: false, choices: [] })
    ],
    sources: [["PAPSS", "https://papss.com/"], ["Banque centrale ou prestataire concerné", "/data/trade/official-sources.json"]],
    warning: "Disponibilité, tarifs, taux de change, plafonds et délais peuvent changer. Vérifiez le corridor et le montant net avant validation.",
    faq: [["AfroTools connaît-il les frais actuels des prestataires ?", "Non. Vous saisissez les frais du devis ou de la grille que vous avez vérifiée."], ["Pourquoi inclure la marge de change ?", "Un faible frais affiché peut être compensé par un taux de change moins favorable."]]
  },
  {
    slug: "regles-origine-sadc", tool: "sadc-roo", en: "/tools/sadc-roo/", image: "sadc-roo.webp",
    title: "Pré-vérification règles d’origine SADC | AfroTools", name: "Pré-vérification d’origine SADC",
    description: "Préparez en français la valeur régionale, le code SH, les preuves et les signaux d’origine SADC sans revendiquer une décision officielle.",
    eyebrow: "SADC · origine préférentielle", lead: "Calculez une part régionale indicative et organisez les preuves, sans remplacer la règle spécifique au produit.",
    intro: "Le seuil de valeur n’est qu’un scénario saisi. Certaines règles reposent sur un changement tarifaire, un procédé, une matière ou une condition propre au produit.",
    dataScripts: ["/engines/sadc-roo-engine.js"],
    fields: [
      field("Chapitre SH", "hsChapter", { type: "number", min: 1, max: 97, step: 1, required: true, placeholder: "09" }),
      field("Pays exportateur SADC", "exportCountry", { type: "select", blank: false, choices: [] }),
      field("Pays importateur SADC", "importCountry", { type: "select", blank: false, choices: [] }),
      field("Valeur départ usine (USD)", "exWorksPrice", { type: "number", min: 0, step: .01, required: true }),
      field("Matières non-SADC (USD)", "nonSadcCost", { type: "number", min: 0, step: .01, required: true }),
      field("Produit entièrement obtenu", "whollyObtained", { type: "checkbox" }),
      field("Changement de position tarifaire documenté", "hasCTH", { type: "checkbox" }),
      field("Règle textile « fabric-forward » respectée", "hasFabricFwd", { type: "checkbox" })
    ],
    sources: [["Secrétariat SADC", "https://www.sadc.int/"], ["Organisation mondiale des douanes", "https://www.wcoomd.org/"]],
    warning: "Ne réclamez aucun tarif préférentiel sur ce seul résultat. Confirmez la règle d’origine exacte, le code SH et les preuves auprès de l’autorité compétente.",
    faq: [["Un pourcentage supérieur au seuil prouve-t-il l’origine ?", "Non. Il indique seulement que votre scénario de valeur atteint le seuil saisi. La règle produit peut imposer d’autres critères."], ["Pourquoi demander le code SH ?", "Les règles d’origine sont généralement rattachées au classement du produit. Un classement erroné change le test applicable."]]
  },
  {
    slug: "facture-proforma", tool: "proforma-invoice", en: "/tools/proforma-invoice/", sw: "/sw/zana/ankara-proforma/", image: "proforma-invoice.webp",
    title: "Générateur facture proforma export | AfroTools", name: "Générateur de facture proforma",
    description: "Créez localement un projet français de facture proforma avec parties, articles, Incoterm, paiement, fret, assurance et exports.",
    eyebrow: "Export · document commercial", lead: "Préparez un projet proforma complet, relisible et exportable sans compte ni envoi de données.",
    intro: "Le document généré est un brouillon commercial. Il ne constitue ni facture fiscale, ni déclaration douanière, ni garantie de paiement.",
    fields: [
      field("Référence proforma", "reference", { required: true, placeholder: "PF-2026-001" }), field("Date d’émission", "issueDate", { type: "date", required: true }), field("Date de validité", "validity", { type: "date", required: true }),
      field("Vendeur — nom et adresse", "seller", { type: "textarea", wide: true, required: true }), field("Acheteur — nom et adresse", "buyer", { type: "textarea", wide: true, required: true }),
      field("Vendeur — téléphone", "sellerPhone"), field("Vendeur — courriel", "sellerEmail", { type: "email" }), field("Vendeur — immatriculation", "sellerReg"), field("Licence export", "sellerLicense"),
      field("Acheteur — téléphone", "buyerPhone"), field("Acheteur — courriel", "buyerEmail", { type: "email" }), field("Licence import", "buyerLicense"),
      currencyField(), field("Incoterm et lieu nommé", "incoterm", { required: true, placeholder: "CIF Port d’Abidjan, Incoterms® 2020" }),
      field("Port de chargement", "loadPort"), field("Port de déchargement", "dischargePort"), field("Pays d’origine", "originCountry"),
      field("Conditions de paiement", "paymentTerms", { wide: true, required: true }), field("Délai de livraison", "deliveryTerms", { wide: true }), field("Code SH / pays d’origine", "hsOrigin", { wide: true, placeholder: "À vérifier pour chaque article" }),
      ...Array.from({ length: 10 }, (_, index) => index + 1).flatMap((index) => [
        field(`Article ${index} — description`, `item${index}`, { wide: true, required: index === 1 }),
        field(`Article ${index} — code SH`, `itemHs${index}`),
        field(`Article ${index} — quantité`, `qty${index}`, { type: "number", min: 0, step: .01, value: index === 1 ? 1 : 0 }),
        field(`Article ${index} — unité`, `unit${index}`, { type: "select", blank: false, choices: [["pcs", "Pièces"], ["kg", "kg"], ["tonnes", "Tonnes"], ["cartons", "Cartons"], ["bags", "Sacs"], ["litres", "Litres"]] }),
        field(`Article ${index} — prix unitaire`, `price${index}`, { type: "number", min: 0, step: .01, value: 0 })
      ]),
      field("Fret", "freight", { type: "number", min: 0, step: .01, value: 0 }), field("Assurance", "insurance", { type: "number", min: 0, step: .01, value: 0 }),
      field("Emballage", "packaging", { type: "number", min: 0, step: .01, value: 0 }), field("Inspection", "inspection", { type: "number", min: 0, step: .01, value: 0 }),
      field("Marques et numéros", "marks", { type: "textarea", wide: true }), field("Conditions complémentaires", "conditions", { type: "textarea", wide: true })
    ],
    sources: [["Organisation mondiale des douanes", "https://www.wcoomd.org/"], ["Chambre de commerce internationale — Incoterms", "https://iccwbo.org/business-solutions/incoterms-rules/"]],
    warning: "Relisez identités, banque, devise, Incoterm, lieu nommé, origine et code SH. Le PDF AfroTools reste un brouillon à approuver.",
    faq: [["Une facture proforma est-elle une facture fiscale ?", "Non. C’est une offre ou un document préparatoire; les exigences fiscales dépendent du pays."], ["Les données sont-elles enregistrées ?", "Non. Le calcul et les exports sont produits dans votre navigateur."]]
  },
  {
    slug: "generateur-connaissement", tool: "bill-of-lading", en: "/tools/bol-generator/", sw: "/sw/zana/bill-of-lading/", image: "bol-generator.webp",
    title: "Brouillon de connaissement en français | AfroTools", name: "Préparateur de connaissement",
    description: "Préparez localement un brouillon français de connaissement avec parties, trajet, navire, conteneur, colis, poids et instructions.",
    eyebrow: "Transport maritime · brouillon", lead: "Rassemblez les instructions d’expédition avant transmission au transporteur ou à son agent.",
    intro: "AfroTools ne délivre pas de connaissement. L’export est un brouillon non négociable destiné à la relecture.",
    fields: [
      field("Chargeur — nom et adresse", "shipper", { type: "textarea", wide: true, required: true }), field("Destinataire — nom et adresse", "consignee", { type: "textarea", wide: true, required: true }),
      field("Partie à notifier", "notify", { type: "textarea", wide: true }), field("Transporteur", "carrier"), field("Navire", "vessel"), field("Voyage", "voyage"),
      field("Numéro de connaissement", "blNumber"), field("Référence de réservation", "bookingReference"), field("Date à bord", "onBoardDate", { type: "date" }),
      field("Port de chargement", "loadPort", { required: true }), field("Port de déchargement", "dischargePort", { required: true }), field("Lieu de réception", "placeReceipt"), field("Lieu de livraison", "placeDelivery"),
      field("Conteneur", "container"), field("Numéro de scellé", "seal"), field("Nombre et type de colis", "packages"),
      field("Description de la marchandise", "cargo", { type: "textarea", wide: true, required: true }), field("Poids brut (kg)", "grossWeight", { type: "number", min: 0, step: .01 }), field("Volume (m³)", "volume", { type: "number", min: 0, step: .001 }),
      currencyField(), field("Fret déclaré", "freight", { type: "number", min: 0, step: .01, value: 0 }), field("Fret payable à", "freightPayable", { type: "select", blank: false, choices: [["origin", "Origine"], ["destination", "Destination"]] }),
      field("Nombre d’originaux", "originals", { type: "number", min: 0, step: 1, value: 3 }), field("Droit / juridiction", "jurisdiction"), field("Instructions complémentaires", "instructions", { type: "textarea", wide: true })
    ],
    sources: [["Transporteur ou agent maritime concerné", "/data/trade/official-sources.json"], ["Chambre de commerce internationale", "https://iccwbo.org/"]],
    warning: "Le transporteur reste seul responsable de l’émission, du nombre d’originaux, du statut négociable et des mentions finales.",
    faq: [["Ce PDF est-il un connaissement valide ?", "Non. C’est un brouillon de préparation. Seul le transporteur ou son agent peut émettre le document final."], ["Puis-je saisir des données confidentielles ?", "Le traitement reste local, mais utilisez un appareil de confiance et relisez le fichier avant partage."]]
  },
  {
    slug: "checklist-transfert-donnees", tool: "cross-border-data", en: "/tools/cross-border-data/", sw: "/sw/zana/uhamishaji-data-mpaka/", image: "cross-border-data.webp",
    title: "Transferts de données dans 15 pays africains | AfroTools", name: "Guide des transferts de données",
    description: "Explorez en français les lois, autorités, mécanismes et étapes de transfert transfrontalier de données de 15 pays africains.",
    eyebrow: "Données personnelles · 15 juridictions", lead: "Choisissez le pays d’origine pour examiner sa loi, son autorité, les mécanismes de transfert et les étapes de conformité.",
    intro: "Le guide utilise le même modèle de profil pays que l’application anglaise. Il ne demande aucune donnée personnelle et ne remplace pas un avis juridique.",
    fields: [
      field("Pays d’origine des données", "countryCode", { type: "select", required: true, blank: false, choices: [
        ["NG", "Nigeria"], ["ZA", "Afrique du Sud"], ["KE", "Kenya"], ["GH", "Ghana"], ["RW", "Rwanda"],
        ["MA", "Maroc"], ["MU", "Maurice"], ["EG", "Égypte"], ["TZ", "Tanzanie"], ["UG", "Ouganda"],
        ["TN", "Tunisie"], ["SN", "Sénégal"], ["CI", "Côte d’Ivoire"], ["CM", "Cameroun"], ["AO", "Angola"]
      ] })
    ],
    sources: [["Union africaine — Convention de Malabo", "https://au.int/en/treaties/african-union-convention-cyber-security-and-personal-data-protection"], ["Autorité de protection des données compétente", "/data/trade/official-sources.json"]],
    warning: "Outil de préparation, pas avis juridique. Les mécanismes, autorisations et restrictions changent selon les deux pays et le secteur.",
    faq: [["AfroTools analyse-t-il des données personnelles ?", "Non. Le choix d’un pays ouvre uniquement une fiche réglementaire locale."], ["La fiche autorise-t-elle le transfert ?", "Non. Vérifiez la loi, le mécanisme, l’autorité, le secteur et le pays destinataire avant tout transfert."]]
  },
  {
    slug: "delai-dedouanement", tool: "customs-time", en: "/tools/customs-time/", sw: "/sw/zana/muda-wa-kupitisha-forodha/", image: "customs-time.webp",
    title: "Estimateur de délai de dédouanement | AfroTools", name: "Estimateur de délai douanier",
    description: "Estimez en français délais, frais d’agent et stockage pour dix ports et corridors africains selon le type de marchandise et l’état du dossier.",
    eyebrow: "Douane · 10 ports et corridors", lead: "Choisissez une destination, le type de marchandise et l’état des documents pour reproduire le modèle pays de l’application anglaise.",
    intro: "Les références pays sont des hypothèses de planification, pas des données portuaires en direct. Confirmez chaque montant et délai par écrit.",
    fields: [
      field("Pays / corridor de destination", "country", { type: "select", required: true, blank: false, choices: [
        ["nigeria", "Nigeria — Apapa"], ["kenya", "Kenya — Mombasa"], ["kenya_icd", "Kenya — Nairobi ICD"],
        ["southafrica", "Afrique du Sud — Durban / Le Cap"], ["ghana", "Ghana — Tema"],
        ["ethiopia", "Éthiopie — Djibouti / Addis-Abeba"], ["tanzania", "Tanzanie — Dar es Salaam"],
        ["rwanda", "Rwanda — Kigali Dry Port"], ["egypt", "Égypte — Port-Saïd / Alexandrie"], ["senegal", "Sénégal — Dakar"]
      ] }),
      field("Type de marchandise", "goodsType", { type: "select", required: true, blank: false, choices: [
        ["commercial", "Marchandises commerciales"], ["personal", "Effets personnels"], ["vehicles", "Véhicules"],
        ["food", "Alimentation / agriculture"], ["pharma", "Pharmaceutique"], ["electronics", "Électronique"]
      ] }),
      field("État des documents", "documentStatus", { type: "select", required: true, blank: false, choices: [
        ["complete", "Dossier complet"], ["partial", "Dossier partiel"], ["missing", "Documents essentiels manquants"]
      ] }),
      field("Valeur CAF de la cargaison (USD)", "cargoValue", { type: "number", min: 0, step: .01, value: 10000, required: true })
    ],
    sources: [["Registre AfroTools des douanes nationales", "/data/trade/official-sources.json"], ["Organisation mondiale des douanes", "https://www.wcoomd.org/"]],
    warning: "Aucun délai n’est garanti. Confirmez l’arrivée, le manifeste, les permis, le paiement, l’inspection et la mainlevée avec les acteurs réels.",
    faq: [["D’où vient la fourchette ?", "Du même profil pays et du même moteur de documentation et de type de marchandise que l’application anglaise. Aucun flux portuaire en direct n’est interrogé."], ["Comment éviter les surestaries ?", "Préparez les documents et permis avant arrivée, désignez les intervenants, puis obtenez un calendrier écrit du transporteur et du terminal."]]
  },
  {
    slug: "calculateur-de-poids-d-expedition", tool: "shipping-weight", en: "/tools/shipping-weight/", sw: "/sw/zana/uzito-wa-usafirishaji/", image: "shipping-weight.webp",
    title: "Poids volumétrique et coût d’expédition | AfroTools", name: "Calculateur de poids d’expédition",
    description: "Calculez en français poids réel, poids volumétrique, poids facturable, fret, carburant, assurance, frais fixes et marge de sécurité.",
    eyebrow: "Fret · poids facturable", lead: "Comparez poids réel et volumétrique puis construisez un budget à partir du tarif écrit du transporteur.",
    intro: "Le diviseur, l’arrondi et les suppléments varient. Saisissez ceux du devis au lieu d’utiliser une promesse générique.",
    fields: [
      field("Nombre de colis", "packages", { type: "number", min: 1, step: 1, value: 1 }), field("Poids réel par colis (kg)", "actualWeight", { type: "number", min: 0, step: .01, required: true }),
      field("Longueur par colis (cm)", "length", { type: "number", min: 0, step: .1, required: true }), field("Largeur par colis (cm)", "width", { type: "number", min: 0, step: .1, required: true }),
      field("Hauteur par colis (cm)", "height", { type: "number", min: 0, step: .1, required: true }), field("Diviseur volumétrique", "divisor", { type: "number", min: 1, step: 1, value: 5000, help: "Remplacez par la valeur du transporteur." }),
      currencyField(), field("Tarif par kg facturable", "rate", { type: "number", min: 0, step: .01, value: 0 }),
      field("Surcharge carburant (%)", "fuelRate", { type: "number", min: 0, step: .01, value: 0 }), field("Valeur déclarée", "declaredValue", { type: "number", min: 0, step: .01, value: 0 }),
      field("Assurance (%)", "insuranceRate", { type: "number", min: 0, step: .01, value: 0 }), field("Frais fixes", "fixedCharges", { type: "number", min: 0, step: .01, value: 0 }),
      field("Marge de sécurité (%)", "contingencyRate", { type: "number", min: 0, step: .01, value: 0 })
    ],
    sources: [["Devis et grille du transporteur", "/data/trade/official-sources.json"], ["Association internationale du transport aérien", "https://www.iata.org/"]],
    warning: "Le calcul n’applique aucun minimum, arrondi, zone distante, manutention spéciale ou taxe non saisi.",
    faq: [["Quel poids est facturé ?", "Dans ce scénario, le plus élevé entre poids réel et poids volumétrique. Le transporteur peut appliquer un arrondi ou un minimum supplémentaire."], ["Le diviseur 5 000 est-il universel ?", "Non. C’est un exemple modifiable. Utilisez le diviseur indiqué sur votre devis."]]
  },
  {
    slug: "liste-colisage", tool: "packing-list", en: "/tools/packing-list/", sw: "/sw/zana/orodha-ya-kupakia/", image: "packing-list.webp",
    title: "Générateur de liste de colisage export | AfroTools", name: "Générateur de liste de colisage",
    description: "Préparez une liste de colisage française avec nombres de colis, poids nets et bruts, dimensions, CBM et utilisation indicative des conteneurs.",
    eyebrow: "Export · colisage", lead: "Vérifiez colis, poids et volume avant de transmettre le brouillon au transporteur, à la banque ou à la douane.",
    intro: "Saisissez des totaux par ligne de colisage. Le calcul reste local; le document exporté est un brouillon à rapprocher de la facture et du document de transport.",
    fields: [
      field("Numéro de liste de colisage", "reference", { required: true, placeholder: "PL-2026-001" }), field("Date", "packingDate", { type: "date", required: true }), field("Référence facture", "invoiceReference"),
      field("Chargeur", "shipper", { type: "textarea", wide: true, required: true }), field("Destinataire", "consignee", { type: "textarea", wide: true, required: true }), field("Partie à notifier", "notify", { type: "textarea", wide: true }),
      field("Navire / voyage", "vessel"), field("Pays d’origine", "originCountry"), field("Port de chargement", "loadPort", { required: true }), field("Port de déchargement", "dischargePort", { required: true }),
      ...Array.from({ length: 10 }, (_, index) => index + 1).flatMap((index) => [
        field(`Ligne ${index} — description`, `description${index}`, { wide: true, required: index === 1 }),
        field(`Ligne ${index} — nombre de colis`, `count${index}`, { type: "number", min: 0, step: 1, value: index === 1 ? 1 : 0 }),
        field(`Ligne ${index} — poids net total (kg)`, `net${index}`, { type: "number", min: 0, step: .001, value: 0 }),
        field(`Ligne ${index} — poids brut total (kg)`, `gross${index}`, { type: "number", min: 0, step: .001, value: 0 }),
        field(`Ligne ${index} — longueur par colis (cm)`, `length${index}`, { type: "number", min: 0, step: .1, value: 0 }),
        field(`Ligne ${index} — largeur par colis (cm)`, `width${index}`, { type: "number", min: 0, step: .1, value: 0 }),
        field(`Ligne ${index} — hauteur par colis (cm)`, `height${index}`, { type: "number", min: 0, step: .1, value: 0 })
      ])
    ],
    sources: [["Transporteur ou transitaire concerné", "/data/trade/official-sources.json"], ["Organisation mondiale des douanes", "https://www.wcoomd.org/"]],
    warning: "Confirmez les marques, unités, poids certifiés, dimensions, numéro de facture, exigences du transporteur et règles de la destination avant expédition.",
    faq: [["Le CBM est-il une mesure certifiée ?", "Non. Il est calculé à partir des dimensions saisies. Utilisez les mesures finales du fournisseur ou du transporteur."], ["Le PDF remplace-t-il la liste du transporteur ?", "Non. C’est un brouillon de travail à faire approuver et rapprocher des autres documents."]]
  },
  {
    slug: "recherche-code-sh", tool: "hs-code-lookup", en: "/tools/hs-code-lookup/", sw: "/sw/zana/utafutaji-msimbo-hs/", image: "hs-code-lookup.webp",
    title: "Recherche de code SH et droits indicatifs | AfroTools", name: "Recherche de code SH",
    description: "Recherchez un produit ou un code SH avec le même moteur de nomenclature et de taux indicatifs que l’application anglaise.",
    eyebrow: "Douane · classement", lead: "Recherchez une famille SH, ouvrez le code correspondant et comparez les taux indicatifs disponibles par pays.",
    intro: "Le moteur fournit des pistes de classement. La sous-position nationale et la décision douanière doivent être confirmées avant déclaration.",
    dataScripts: ["/data/trade/hs-codes-database.js", "/data/trade/country-duty-rates.js", "/engines/hs-lookup-engine.js"],
    fields: [
      field("Produit ou code SH", "query", { required: true, placeholder: "café ou 0901" }),
      field("Pays pour les droits indicatifs", "dutyCountry", { type: "select", blank: false, choices: [["NG", "Nigeria"], ["KE", "Kenya"], ["ZA", "Afrique du Sud"], ["GH", "Ghana"], ["CI", "Côte d’Ivoire"], ["SN", "Sénégal"], ["CM", "Cameroun"], ["MA", "Maroc"], ["EG", "Égypte"]] })
    ],
    sources: [["Organisation mondiale des douanes", "https://www.wcoomd.org/"], ["Registre douanier AfroTools", "/data/trade/official-sources.json"]],
    warning: "La recherche n’est pas une décision de classement. Confirmez le code complet, la version tarifaire et les mesures nationales auprès de la douane.",
    faq: [["Puis-je déclarer avec le premier résultat ?", "Non. Comparez la composition, l’usage et la description légale, puis obtenez une validation si nécessaire."], ["Les taux sont-ils définitifs ?", "Non. Ils sont indicatifs et peuvent exclure prélèvements, exonérations et mesures produit."]]
  },
  {
    slug: "estimateur-fret", tool: "shipping-estimator", en: "/tools/shipping-estimator/", sw: "/sw/zana/makisio-ya-usafirishaji-wa-biashara/", image: "shipping-estimator.webp",
    title: "Estimateur de fret Afrique | AfroTools", name: "Estimateur de fret",
    description: "Comparez les fourchettes mer et air du même moteur de corridors utilisé par l’application anglaise.",
    eyebrow: "Logistique · corridors", lead: "Choisissez origine, destination et unité de chargement pour obtenir les fourchettes et délais du registre daté.",
    intro: "Les résultats sont des repères pré-fret. Demandez un devis écrit incluant surcharges, congestion, manutention et livraison.",
    dataScripts: ["/data/trade/shipping-routes.js", "/engines/shipping-engine.js"],
    fields: [
      field("Port d’origine", "originPort", { type: "select", blank: false, choices: [] }),
      field("Port de destination", "destPort", { type: "select", blank: false, choices: [] }),
      field("Type de chargement", "containerType", { type: "select", blank: false, choices: [] }),
      field("Volume LCL (m³)", "cbm", { type: "number", min: 0.01, step: .01, value: 1 }),
      field("Poids aérien (kg)", "weightKg", { type: "number", min: 0.1, step: .1, value: 100 })
    ],
    sources: [["Registre de corridors AfroTools", "/data/trade/shipping-routes.js"], ["Organisation maritime internationale", "https://www.imo.org/"]],
    warning: "Les prix et délais ne sont pas des devis et peuvent être périmés. Confirmez le corridor, la date, le type de conteneur et toutes les surcharges.",
    faq: [["Pourquoi une fourchette ?", "Le fret varie selon saison, ligne, espace disponible, carburant et congestion."], ["Mer ou air ?", "Comparez coût, délai, valeur, péremption et besoin de trésorerie."]]
  },
  {
    slug: "impact-fx-import", tool: "fx-import-impact", en: "/tools/fx-import-impact/", sw: "/sw/zana/athari-forex-kuagiza/", image: "fx-import-impact.webp",
    title: "Impact du change sur une importation | AfroTools", name: "Impact du change import",
    description: "Mesurez le coût local et les scénarios de change avec le même historique pays que l’application anglaise.",
    eyebrow: "Change · import", lead: "Transformez un montant USD en coût local, testez des scénarios et calculez le taux de change de rentabilité.",
    intro: "L’historique est daté et ne constitue pas un taux exécutable. Remplacez le taux par celui de votre banque ou fournisseur.",
    dataScripts: ["/data/trade/fx-history.js", "/engines/fx-impact-engine.js"],
    fields: [
      field("Pays / devise", "countryCode", { type: "select", blank: false, choices: [["NG", "Nigeria — NGN"], ["KE", "Kenya — KES"], ["ZA", "Afrique du Sud — ZAR"], ["GH", "Ghana — GHS"], ["EG", "Égypte — EGP"], ["ET", "Éthiopie — ETB"], ["TZ", "Tanzanie — TZS"], ["UG", "Ouganda — UGX"], ["RW", "Rwanda — RWF"], ["ZM", "Zambie — ZMW"], ["MA", "Maroc — MAD"], ["TN", "Tunisie — TND"], ["AO", "Angola — AOA"], ["CI", "Côte d’Ivoire — XOF"], ["CM", "Cameroun — XAF"]] }),
      field("Coût import en USD", "usdAmount", { type: "number", min: 0, step: .01, required: true }),
      field("Taux local pour 1 USD", "fxRate", { type: "number", min: 0.000001, step: .000001, required: true }),
      field("Prix de vente local", "sellPrice", { type: "number", min: 0, step: .01, value: 0 }),
      field("Autres coûts locaux", "otherCosts", { type: "number", min: 0, step: .01, value: 0 })
    ],
    sources: [["Historique de change AfroTools", "/data/trade/fx-history.js"], ["Banque centrale du pays concerné", "/data/trade/official-sources.json"]],
    warning: "Aucun taux en direct n’est fourni. Vérifiez le taux applicable, la marge bancaire, les frais et la date de règlement.",
    faq: [["Que montre le scénario ?", "Le même montant USD recalculé à plusieurs variations autour du taux saisi."], ["Le seuil est-il un conseil de prix ?", "Non. Il indique seulement le taux maximal compatible avec le prix et les autres coûts saisis."]]
  },
  {
    slug: "calculateur-surestaries", tool: "demurrage-calculator", en: "/tools/demurrage-calculator/", sw: "/sw/zana/gharama-za-demurrage/", image: "demurrage-calculator.webp",
    title: "Calculateur de surestaries portuaires | AfroTools", name: "Calculateur de surestaries",
    description: "Calculez paliers, stockage et frais portuaires avec le même moteur de ports que l’application anglaise.",
    eyebrow: "Port · immobilisation", lead: "Choisissez le port, le conteneur et le nombre de jours pour voir la franchise et les paliers applicables.",
    intro: "Le registre est un repère de planification. Demandez au terminal et à la ligne maritime la grille contractuelle de votre dossier.",
    dataScripts: ["/data/trade/port-demurrage.js", "/engines/demurrage-engine.js"],
    fields: [
      field("Port", "portCode", { type: "select", blank: false, choices: [] }),
      field("Type de conteneur", "containerType", { type: "select", blank: false, choices: [["20ft", "20 pieds"], ["40ft", "40 pieds"], ["40ftHC", "40 pieds HC"]] }),
      field("Jours au port", "daysAtPort", { type: "number", min: 0, step: 1, required: true }),
      field("Unités locales pour 1 USD", "fxRate", { type: "number", min: 0.000001, step: .000001, value: 1 })
    ],
    sources: [["Registre portuaire AfroTools", "/data/trade/port-demurrage.js"], ["Terminal et ligne maritime concernés", "/data/trade/official-sources.json"]],
    warning: "La franchise, les paliers, le stockage et les frais changent par contrat. Vérifiez la grille de votre connaissement.",
    faq: [["Quand les frais commencent-ils ?", "Après la franchise du port ou de la ligne, selon le contrat."], ["Le stockage est-il inclus ?", "Le moteur affiche les postes disponibles dans le registre pour le port sélectionné."]]
  },
  {
    slug: "calculateur-incoterms", tool: "incoterms-calculator", en: "/tools/incoterms-calculator/", sw: "/sw/zana/kikokotoo-incoterms/", image: "incoterms-calculator.webp",
    title: "Calculateur Incoterms 2020 | AfroTools", name: "Calculateur Incoterms",
    description: "Répartissez les coûts vendeur-acheteur et comparez deux Incoterms avec le moteur Incoterms 2020 partagé.",
    eyebrow: "Contrat · responsabilités", lead: "Saisissez les postes de coût, choisissez deux termes et comparez transfert de risque et charge financière.",
    intro: "Le résultat aide à préparer une offre. Le contrat, le lieu nommé, le mode et la version Incoterms doivent être écrits sans ambiguïté.",
    dataScripts: ["/data/trade/incoterms-data.js", "/engines/incoterms-engine.js"],
    fields: [
      field("Incoterm principal", "termCode", { type: "select", blank: false, choices: [] }),
      field("Incoterm de comparaison", "compareCode", { type: "select", blank: false, choices: [] }),
      ...["packaging", "loading_origin", "export_customs", "inland_origin", "loading_vessel", "freight", "insurance", "unloading_dest", "import_customs", "duties_taxes", "inland_dest", "delivery"].map((id) =>
        field(id.replaceAll("_", " "), `cost_${id}`, { type: "number", min: 0, step: .01, value: 0 })
      )
    ],
    sources: [["Chambre de commerce internationale", "https://iccwbo.org/"], ["Registre Incoterms AfroTools", "/data/trade/incoterms-data.js"]],
    warning: "Utilisez la publication officielle ICC et un contrat relu. Le calcul ne détermine ni propriété ni paiement.",
    faq: [["Risque et coût passent-ils au même endroit ?", "Pas toujours. Les termes C illustrent précisément cette différence."], ["Quel terme pour un conteneur ?", "FCA, CPT ou CIP sont souvent plus adaptés que FOB/CFR/CIF, selon l’opération."]]
  },
  {
    slug: "suivi-zlecaf", tool: "afcfta-tracker", en: "/tools/afcfta-tracker/", sw: "/sw/zana/ufuatiliaji-ushuru-afcfta/", image: "afcfta-tracker.webp",
    title: "Suivi ZLECAf par corridor | AfroTools", name: "Suivi ZLECAf",
    description: "Vérifiez l’état du corridor et la réduction indicative de catégorie A avec le même registre ZLECAf que l’application anglaise.",
    eyebrow: "ZLECAf · corridor", lead: "Comparez les états de ratification, dépôt de barème et commerce guidé des deux pays avant de chiffrer une préférence.",
    intro: "Le registre est daté et ne remplace pas le tarif officiel. Une préférence exige aussi la ligne tarifaire, la règle d’origine et le certificat corrects.",
    dataScripts: ["/data/trade/afcfta-schedule.js"],
    fields: [
      field("Pays d’origine", "originCountry", { type: "select", blank: false, choices: [] }),
      field("Pays de destination", "destinationCountry", { type: "select", blank: false, choices: [] }),
      field("Code SH (facultatif)", "hsCode", { placeholder: "8517.12" }),
      field("Catégorie tarifaire", "tariffCategory", { type: "select", blank: false, choices: [["A", "Catégorie A"], ["B", "Catégorie B"], ["C", "Catégorie C"]] }),
      field("Droit NPF de référence (%)", "baseDuty", { type: "number", min: 0, step: .01, value: 0 }),
      field("Année du scénario", "scenarioYear", { type: "number", min: 2021, max: 2033, step: 1, value: 2026 })
    ],
    sources: [["Secrétariat de la ZLECAf", "https://au-afcfta.org/"], ["Registre ZLECAf AfroTools", "/data/trade/afcfta-schedule.js"]],
    warning: "Le résultat est un signal de planification. Vérifiez la concession officielle, la règle d’origine, le certificat et l’activation du corridor.",
    faq: [["Un corridor actif garantit-il zéro droit ?", "Non. La ligne doit être libéralisée, l’origine satisfaite et la preuve acceptée."], ["Que signifie la catégorie C ?", "Elle couvre les lignes exclues de la libéralisation; le droit de référence continue normalement de s’appliquer."]]
  },
  {
    slug: "generateur-certificat-origine", tool: "coo-generator", en: "/tools/coo-generator/", sw: "/sw/zana/cheti-asili/", image: "coo-generator.webp",
    title: "Brouillon de certificat d’origine | AfroTools", name: "Générateur de certificat d’origine",
    description: "Préparez un brouillon et testez les critères d’origine avec le même moteur de modèles que l’application anglaise.",
    eyebrow: "Origine · document", lead: "Choisissez le régime, renseignez les parties et la marchandise, puis générez le jeu de champs attendu par le modèle.",
    intro: "Le fichier est un brouillon local. Seule l’autorité habilitée peut émettre ou accepter le certificat final.",
    dataScripts: ["/data/trade/coo-templates.js", "/engines/coo-engine.js"],
    fields: [
      field("Modèle", "templateId", { type: "select", blank: false, choices: [] }),
      field("Exportateur — nom", "exporter_name", { required: true }), field("Exportateur — adresse", "exporter_address", { required: true }),
      field("Pays exportateur", "exporter_country", { type: "select", blank: false, choices: [] }),
      field("Destinataire — nom", "consignee_name", { required: true }), field("Destinataire — adresse", "consignee_address", { required: true }),
      field("Pays de destination", "consignee_country", { type: "select", blank: false, choices: [] }),
      field("Transport et trajet", "transport_details", { wide: true, required: true }),
      field("Pays d’origine", "country_of_origin", { required: true }), field("Description des marchandises", "goods_description", { type: "textarea", wide: true, required: true }),
      field("Code SH", "hs_code", { required: true }), field("Quantité / unités", "quantity", { required: true }),
      field("Poids brut (kg)", "gross_weight", { type: "number", min: 0, step: .001, required: true }),
      field("Valeur FOB (USD)", "fob_value", { type: "number", min: 0, step: .01, value: 0 }),
      field("Numéro de facture", "invoice_number", { required: true }), field("Date de facture", "invoice_date", { type: "date", required: true }),
      field("Référence ZLECAf", "afcfta_ref_number"), field("Numéro d’agrément ETLS", "etls_approval_number"),
      field("Lieu de déclaration", "declaration_place", { required: true }), field("Date de déclaration", "declaration_date", { type: "date", required: true }),
      field("Signataire autorisé", "authorized_signatory", { required: true }),
      field("Valeur départ usine (USD)", "exWorksPrice", { type: "number", min: 0, step: .01, value: 0 }),
      field("Matières non originaires (USD)", "nonOriginatingMaterialsCost", { type: "number", min: 0, step: .01, value: 0 }),
      field("Entièrement obtenu", "hasWhollyObtained", { type: "checkbox" }),
      field("Changement de position tarifaire", "hasCTH", { type: "checkbox" }),
      field("Procédé spécifique", "processType", { type: "checkbox" })
    ],
    sources: [["Autorité nationale d’émission", "/data/trade/official-sources.json"], ["Secrétariat de la ZLECAf", "https://au-afcfta.org/"]],
    warning: "Ce brouillon ne prouve ni l’origine ni l’éligibilité tarifaire. Faites valider le modèle, les critères et les pièces par l’autorité compétente.",
    faq: [["Le PDF est-il un certificat officiel ?", "Non. Il s’agit d’un brouillon de préparation."], ["Comment choisir le modèle ?", "Utilisez le régime applicable au corridor et confirmez le formulaire auprès de l’autorité d’émission."]]
  }
];

function schema(page) {
  return JSON.stringify([
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: page.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "fr",
      url: `https://afrotools.com/fr/tools/${page.slug}/`,
      description: page.description,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      provider: { "@type": "Organization", name: "AfroTools", url: "https://afrotools.com/" },
      image: `https://afrotools.com/assets/img/tools/${page.image}`
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: "https://afrotools.com/fr/" },
        { "@type": "ListItem", position: 2, name: "Commerce et importation", item: "https://afrotools.com/fr/trade/" },
        { "@type": "ListItem", position: 3, name: page.name, item: `https://afrotools.com/fr/tools/${page.slug}/` }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: "fr",
      mainEntity: page.faq.map(([question, answer]) => ({
        "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer }
      }))
    }
  ], null, 2);
}

function pageHtml(page) {
  const sourceLinks = page.sources.map(([label, url]) => `<li><a href="${url}"${url.startsWith("http") ? ' rel="noopener noreferrer"' : ""}>${label}</a></li>`).join("");
  const faq = page.faq.map(([question, answer]) => `<details><summary>${question}</summary><p>${answer}</p></details>`).join("");
  const dataScripts = (page.dataScripts || []).map((src) => `<script src="${src}"></script>`).join("\n");
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="index,follow">
  <meta name="afrotools-content-id" content="fr-trade-parity:${page.tool}">
  <meta name="afrotools-source-owner" content="scripts/build-fr-trade-parity-pages.js">
  <title>${page.title}</title>
  <meta name="description" content="${page.description}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:title" content="${page.title}">
  <meta property="og:description" content="${page.description}">
  <meta property="og:url" content="https://afrotools.com/fr/tools/${page.slug}/">
  <meta property="og:image" content="https://afrotools.com/assets/img/tools/${page.image}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${page.title}">
  <meta name="twitter:description" content="${page.description}">
  <meta name="twitter:image" content="https://afrotools.com/assets/img/tools/${page.image}">
  <link rel="stylesheet" href="/assets/css/tokens.min.css?v=f987f2a8">
  <link rel="stylesheet" href="/assets/css/global.min.css?v=0ff6e9dc">
  <link rel="stylesheet" href="/assets/css/fr-trade-parity.css">
  <script type="application/ld+json">
${schema(page)}
</script>
  <script src="/assets/js/components/navbar.min.js?v=65f906d7" defer></script>
  <script src="/assets/js/components/footer.min.js?v=fb81e3cd" defer></script>
<link rel="canonical" href="https://afrotools.com/fr/tools/${page.slug}/">
<link rel="alternate" hreflang="en" href="https://afrotools.com${page.en}">
<link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/tools/${page.slug}/">
${page.sw ? `<link rel="alternate" hreflang="sw" href="https://afrotools.com${page.sw}">
` : ""}<link rel="alternate" hreflang="x-default" href="https://afrotools.com${page.en}">
</head>
<body>
  <afro-navbar></afro-navbar>
  <main class="fr-trade-shell" data-fr-trade-app data-tool="${page.tool}">
    <nav class="fr-trade-breadcrumb" aria-label="Fil d’Ariane"><a href="/fr/">Accueil</a> / <a href="/fr/trade/">Commerce et importation</a> / ${page.name}</nav>
    <header class="fr-trade-hero">
      <p class="fr-trade-eyebrow">${page.eyebrow}</p>
      <h1>${page.name}</h1>
      <p class="fr-trade-lead">${page.lead}</p>
      <ul class="fr-trade-badges" aria-label="Caractéristiques"><li>Interface française native</li><li>Calcul local</li><li>Exports sans compte</li><li>Hypothèses visibles</li></ul>
    </header>
    <div class="fr-trade-layout">
      <section class="fr-trade-card" aria-labelledby="workflow-title">
        <h2 id="workflow-title">Préparer le résultat</h2>
        <p class="fr-trade-intro">${page.intro}</p>
        <form class="fr-trade-form" data-trade-form>
          <div class="fr-trade-fields">${page.fields.join("\n")}</div>
          <div class="fr-trade-actions">
            <button class="fr-trade-button fr-trade-button--primary" type="submit">Calculer et vérifier</button>
            <button class="fr-trade-button fr-trade-button--secondary" type="reset">Réinitialiser</button>
          </div>
          <p class="fr-trade-status" data-trade-status tabindex="-1" role="status" aria-live="polite">Renseignez les champs puis lancez le calcul.</p>
        </form>
        <section class="fr-trade-result" data-trade-result tabindex="-1" aria-labelledby="result-title" hidden>
          <h2 class="fr-trade-print-title">${page.name}</h2>
          <h2 id="result-title">Résultat et contrôles</h2>
          <p class="fr-trade-result-summary" data-trade-summary></p>
          <div class="fr-trade-metrics" data-trade-metrics></div>
          <div data-trade-rows></div>
          <ul class="fr-trade-list" data-trade-notes></ul>
          <h3>Exporter ce résultat local</h3>
          <div class="fr-trade-export-actions" aria-label="Formats d’export">
            <button class="fr-trade-button fr-trade-button--secondary" type="button" data-export="pdf">PDF</button>
            <button class="fr-trade-button fr-trade-button--secondary" type="button" data-export="csv">CSV</button>
            <button class="fr-trade-button fr-trade-button--secondary" type="button" data-export="json">JSON</button>
            <button class="fr-trade-button fr-trade-button--secondary" type="button" data-export="txt">TXT</button>
            ${page.tool === "export-documents" ? '<label class="fr-trade-button fr-trade-button--secondary">Rouvrir JSON<input type="file" accept="application/json,.json" data-import-json aria-label="Rouvrir un export JSON"></label>' : ""}
          </div>
        </section>
      </section>
      <aside class="fr-trade-aside" aria-label="Sources et limites">
        <section class="fr-trade-card">
          <h2>Confidentialité</h2>
          <p class="fr-trade-note fr-trade-note--privacy"><strong>Local par défaut.</strong> Les champs, calculs et fichiers restent dans ce navigateur. Aucun compte, téléversement ou appel IA n’est requis.</p>
        </section>
        <section class="fr-trade-card">
          <h2>Limite importante</h2>
          <p class="fr-trade-note fr-trade-note--warning">${page.warning}</p>
        </section>
        <section class="fr-trade-card">
          <h2>Sources à consulter</h2>
          <p class="fr-trade-note fr-trade-note--source">Registre de référence revu en mai 2026. Les tarifs commerciaux et valeurs variables doivent être vérifiés à la date de l’opération.</p>
          <ul class="fr-trade-list">${sourceLinks}</ul>
        </section>
      </aside>
    </div>
    <section class="fr-trade-card fr-trade-faq" aria-labelledby="faq-title">
      <h2 id="faq-title">Questions fréquentes</h2>${faq}
    </section>
  </main>
  <afro-footer></afro-footer>
${dataScripts}
  <script src="/engines/trade-utility-engine.js"></script>
  <script src="/assets/vendor/jspdf/jspdf.umd.min.js"></script>
  <script src="/assets/js/pages/fr-trade-parity.js"></script>
  <script src="/assets/js/lazy-analytics.js?v=630f8a7d" defer></script>
</body>
</html>
`;
}

function main() {
  const selectedPages = requestedSlugs
    ? pages.filter((page) => requestedSlugs.has(page.slug))
    : pages;
  if (requestedSlugs && selectedPages.length !== requestedSlugs.size) {
    const found = new Set(selectedPages.map((page) => page.slug));
    const missing = [...requestedSlugs].filter((slug) => !found.has(slug));
    throw new Error(`Unknown French Trade owner slug(s): ${missing.join(", ")}`);
  }
  const changed = [];
  for (const page of selectedPages) {
    const target = path.join(root, "fr", "tools", page.slug, "index.html");
    const output = pageHtml(page);
    const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
    if (normalizeBuildManagedHtml(current) === normalizeBuildManagedHtml(output)) continue;
    changed.push(path.relative(root, target));
    if (!check) {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, output, "utf8");
    }
  }
  if (check && changed.length) {
    console.error(`French Trade parity output is stale (${changed.length} file(s)):\n${changed.join("\n")}`);
    process.exitCode = 1;
    return;
  }
  console.log(`${check ? "Checked" : "Built"} ${selectedPages.length} native French Trade & Import page(s); ${changed.length} ${check ? "stale" : "updated"}.`);
}

if (require.main === module) main();

module.exports = { pages, pageHtml };

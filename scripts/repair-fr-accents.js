#!/usr/bin/env node
"use strict";

/**
 * repair-fr-accents.js
 *
 * Repairs ASCII-only ("literal") French across fr/ pages: restores diacritics
 * on words that are never valid French without their accents.
 *
 * Scope per file:
 *   - visible text nodes (outside script/style/code/pre/textarea/kbd/samp/svg/noscript)
 *   - visible attributes: alt, placeholder, aria-label, title, and content= on
 *     description/keywords/og:/twitter: meta tags
 *   - JSON-LD string values for copy keys (name, description, headline, text, ...)
 *
 * Never touches: URLs, slugs, hrefs, ids, classes, code samples, scripts.
 * Dictionary only contains unambiguous corrections (single valid accented form).
 * Idempotent: accented output never matches the dictionary again.
 *
 * Usage:
 *   node scripts/repair-fr-accents.js            # dry-run report
 *   node scripts/repair-fr-accents.js --fix      # apply changes
 *   node scripts/repair-fr-accents.js --fix --dir fr/blog   # limit scope
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const APPLY = args.includes("--fix");
const dirArg = (args.find((a) => a.startsWith("--dir=")) || "").replace("--dir=", "");
const SCAN_DIR = path.join(ROOT, dirArg || "fr");

// lowercase unaccented -> accented. Capitalized variants are derived automatically.
// RULE: only words with exactly ONE valid accented form and NO valid unaccented
// French/English-brand homograph. Ambiguous stems (marche, cote, general, meme,
// role, eleve, cree, genere, precedent risk-cases...) are intentionally excluded
// unless covered by a safe phrase below.
const WORDS = {
  generateur: "générateur", generateurs: "générateurs",
  cout: "coût", couts: "coûts", coute: "coûte", coutent: "coûtent", couteux: "coûteux", couteuse: "coûteuse",
  impot: "impôt", impots: "impôts",
  electricite: "électricité", electrique: "électrique", electriques: "électriques", electromenager: "électroménager",
  securite: "sécurité", securise: "sécurisé", securisee: "sécurisée",
  fiscalite: "fiscalité", fiscalites: "fiscalités",
  apercu: "aperçu", apercus: "aperçus",
  telecharger: "télécharger", telechargement: "téléchargement", telechargements: "téléchargements", telechargez: "téléchargez",
  telephone: "téléphone", telephones: "téléphones", telephonie: "téléphonie",
  numero: "numéro", numeros: "numéros",
  verification: "vérification", verifications: "vérifications", verifier: "vérifier", verifiez: "vérifiez", verifie: "vérifié", verifiee: "vérifiée", verifiees: "vérifiées",
  resultat: "résultat", resultats: "résultats",
  reponse: "réponse", reponses: "réponses",
  annee: "année", annees: "années",
  budgetez: "budgétez", budgetaire: "budgétaire", budgetaires: "budgétaires", budgetisation: "budgétisation",
  prealable: "préalable", prealables: "préalables",
  reglementation: "réglementation", reglementations: "réglementations", reglementaire: "réglementaire",
  categorie: "catégorie", categories: "catégories",
  penalite: "pénalité", penalites: "pénalités",
  interet: "intérêt", interets: "intérêts",
  premiere: "première", premieres: "premières",
  derniere: "dernière", dernieres: "dernières",
  deja: "déjà",
  apres: "après",
  tres: "très",
  etape: "étape", etapes: "étapes",
  methode: "méthode", methodes: "méthodes", methodologie: "méthodologie",
  modele: "modèle", modeles: "modèles",
  systeme: "système", systemes: "systèmes",
  probleme: "problème", problemes: "problèmes",
  matiere: "matière", matieres: "matières",
  scenario: "scénario", scenarios: "scénarios",
  scolarite: "scolarité",
  universite: "université", universites: "universités",
  qualite: "qualité", qualites: "qualités",
  quantite: "quantité", quantites: "quantités",
  propriete: "propriété", proprietes: "propriétés", proprietaire: "propriétaire", proprietaires: "propriétaires",
  activite: "activité", activites: "activités",
  capacite: "capacité", capacites: "capacités",
  rentabilite: "rentabilité",
  depense: "dépense", depenses: "dépenses", depenser: "dépenser", depensez: "dépensez",
  economie: "économie", economies: "économies", economiser: "économiser", economisez: "économisez", economique: "économique", economiques: "économiques",
  devaluation: "dévaluation",
  monetaire: "monétaire", monetaires: "monétaires",
  regulier: "régulier", reguliere: "régulière", regulierement: "régulièrement",
  reference: "référence", references: "références",
  francais: "français", francaise: "française", francaises: "françaises",
  epargne: "épargne", epargnez: "épargnez", epargnant: "épargnant", epargnants: "épargnants",
  eligibilite: "éligibilité", eligible: "éligible", eligibles: "éligibles",
  reduction: "réduction", reductions: "réductions", reduire: "réduire", reduisez: "réduisez",
  precision: "précision", precisions: "précisions", precis: "précis", precise: "précise", precisez: "précisez",
  vehicule: "véhicule", vehicules: "véhicules",
  medecin: "médecin", medecins: "médecins", medical: "médical", medicale: "médicale", medicaux: "médicaux",
  region: "région", regions: "régions", regional: "régional", regionale: "régionale", regionaux: "régionaux",
  periode: "période", periodes: "périodes",
  duree: "durée", durees: "durées",
  estimee: "estimée", estimees: "estimées",
  detaillee: "détaillée", detaillees: "détaillées",
  superieur: "supérieur", superieure: "supérieure", superieurs: "supérieurs", superieures: "supérieures",
  inferieur: "inférieur", inferieure: "inférieure", inferieurs: "inférieurs", inferieures: "inférieures",
  cle: "clé", cles: "clés",
  fenetre: "fenêtre", fenetres: "fenêtres",
  hopital: "hôpital", hopitaux: "hôpitaux",
  controle: "contrôle", controles: "contrôles", controler: "contrôler", controlez: "contrôlez",
  etranger: "étranger", etrangere: "étrangère", etrangers: "étrangers", etrangeres: "étrangères",
  etre: "être",
  ecole: "école", ecoles: "écoles",
  etudiant: "étudiant", etudiants: "étudiants", etudiante: "étudiante", etudiantes: "étudiantes",
  etude: "étude", etudes: "études",
  energie: "énergie", energies: "énergies", energetique: "énergétique", energetiques: "énergétiques",
  equipement: "équipement", equipements: "équipements",
  remuneration: "rémunération", remunerations: "rémunérations", remunere: "rémunéré", remuneree: "rémunérée",
  experience: "expérience", experiences: "expériences",
  education: "éducation", educatif: "éducatif", educative: "éducative",
  developpement: "développement", developpeur: "développeur", developpeurs: "développeurs", developper: "développer", developpez: "développez",
  strategie: "stratégie", strategies: "stratégies", strategique: "stratégique", strategiques: "stratégiques",
  beneficiaire: "bénéficiaire", beneficiaires: "bénéficiaires", benefice: "bénéfice", benefices: "bénéfices", beneficier: "bénéficier", beneficiez: "bénéficiez",
  operation: "opération", operations: "opérations", operationnel: "opérationnel", operationnelle: "opérationnelle", operateur: "opérateur", operateurs: "opérateurs",
  creez: "créez", creee: "créée", creees: "créées", creation: "création", creations: "créations",
  preferee: "préférée", preferees: "préférées",
  procedure: "procédure", procedures: "procédures",
  proces: "procès",
  acces: "accès", acceder: "accéder", accedez: "accédez",
  succes: "succès",
  deces: "décès",
  "frais generaux": "frais généraux",
  hebergement: "hébergement",
  debut: "début", debuts: "débuts", debutant: "débutant", debutants: "débutants",
  demarrage: "démarrage", demarrer: "démarrer", demarrez: "démarrez",
  "marche noir": "marché noir",
  "mois precedents": "mois précédents",
  presentation: "présentation", presente: "présenté", presentee: "présentée",
  independant: "indépendant", independants: "indépendants", independante: "indépendante", independance: "indépendance",
  irregulier: "irrégulier", irreguliere: "irrégulière", irreguliers: "irréguliers",
  "salaire eleve": "salaire élevé",
  "prix eleve": "prix élevé",
  "plus elevee": "plus élevée", "plus eleve": "plus élevé", "plus eleves": "plus élevés", "plus elevees": "plus élevées",
  "taux eleve": "taux élevé", "taux eleves": "taux élevés",
  necessaire: "nécessaire", necessaires: "nécessaires",
  specifique: "spécifique", specifiques: "spécifiques",
  "simulateur agree": "simulateur agréé",
  "agree par": "agréé par",
  "a jour": "à jour",
  "a rebours": "à rebours",
  "a partir de": "à partir de",
  "a l'etranger": "à l'étranger",
  "grace a": "grâce à",
  "pres de": "près de",
  "peut-etre": "peut-être",
  "c'est-a-dire": "c'est-à-dire",
  "au-dela": "au-delà",
  "meme si": "même si",
  "de meme": "de même",
  "le meme": "le même",
  "la meme": "la même",
  "les memes": "les mêmes",
  "a ete": "a été",
  "ont ete": "ont été",
  senegal: "Sénégal", senegalais: "sénégalais", senegalaise: "sénégalaise",
  benin: "Bénin", beninois: "béninois", beninoise: "béninoise",
  "cote d'ivoire": "Côte d'Ivoire",
  "cote d’ivoire": "Côte d’Ivoire",
  "Cote d'Ivoire": "Côte d'Ivoire",
  "Cote d’Ivoire": "Côte d’Ivoire",
  "etats-unis": "États-Unis",
  // batch 2
  reparation: "réparation", reparations: "réparations",
  specification: "spécification", specifications: "spécifications",
  exposee: "exposée", exposees: "exposées",
  frequentes: "fréquentes", frequemment: "fréquemment", frequence: "fréquence",
  integration: "intégration", integrations: "intégrations",
  telephonique: "téléphonique", telephoniques: "téléphoniques",
  ecran: "écran", ecrans: "écrans",
  etat: "état", etats: "états",
  arretez: "arrêtez",
  cheque: "chèque", cheques: "chèques",
  prevision: "prévision", previsions: "prévisions", previsionnel: "prévisionnel", previsionnelle: "prévisionnelle",
  prevoir: "prévoir", prevoyez: "prévoyez", prevue: "prévue", prevues: "prévues", prevu: "prévu", prevus: "prévus",
  different: "différent", differents: "différents", differente: "différente", differentes: "différentes",
  difference: "différence", differences: "différences",
  "des maintenant": "dès maintenant", "des que": "dès que",
  credit: "crédit", credits: "crédits",
  debit: "débit", depot: "dépôt", depots: "dépôts",
  bareme: "barème", baremes: "barèmes",
  arriere: "arrière", carriere: "carrière", carrieres: "carrières",
  salarie: "salarié", salaries: "salariés", salariee: "salariée",
  employe: "employé", employes: "employés", employee: "employée", employees: "employées",
  conge: "congé", conges: "congés",
  generation: "génération", generique: "générique",
  cinema: "cinéma", television: "télévision", video: "vidéo", videos: "vidéos",
  piece: "pièce", pieces: "pièces",
  kilometrage: "kilométrage", kilometre: "kilomètre", kilometres: "kilomètres",
  "marche automobile": "marché automobile", "sur le marche": "sur le marché",
  "prix du marche": "prix du marché", "au marche": "au marché", "marche local": "marché local",
  reservation: "réservation", reservations: "réservations",
  aeroport: "aéroport", aeroports: "aéroports",
  hotel: "hôtel", hotels: "hôtels",
  numerique: "numérique", numeriques: "numériques",
  gerer: "gérer", gerez: "gérez",
  prive: "privé", privee: "privée", prives: "privés", privees: "privées",
  societe: "société", societes: "sociétés",
  efficacite: "efficacité", productivite: "productivité", disponibilite: "disponibilité",
  compatibilite: "compatibilité", responsabilite: "responsabilité",
  possibilite: "possibilité", possibilites: "possibilités",
  opportunite: "opportunité", opportunites: "opportunités",
  communaute: "communauté", communautes: "communautés",
  identite: "identité", liberte: "liberté", realite: "réalité",
  actualite: "actualité", actualites: "actualités",
  deuxieme: "deuxième", troisieme: "troisième", quatrieme: "quatrième", cinquieme: "cinquième", sixieme: "sixième",
  pret: "prêt", prets: "prêts", prete: "prête", pretes: "prêtes",
  recu: "reçu", recus: "reçus",
  ecart: "écart", ecarts: "écarts",
  egal: "égal", egale: "égale", egalement: "également",
  eleveur: "éleveur", eleveurs: "éleveurs", elevage: "élevage", elevages: "élevages",
  cereale: "céréale", cereales: "céréales",
  legume: "légume", legumes: "légumes",
  betail: "bétail", recolte: "récolte", recoltes: "récoltes",
  "de mais": "de maïs", "du mais": "du maïs", "le mais": "le maïs",
  "saison seche": "saison sèche",
  cafe: "café", cafes: "cafés",
  evolution: "évolution", evolutions: "évolutions",
  eglise: "église", eglises: "églises",
  ceremonie: "cérémonie", ceremonies: "cérémonies",
  mariee: "mariée",
  "la vie a": "la vie à",
  "comparee a": "comparée à", "compare a": "comparé à",
  desormais: "désormais",
  fiabilite: "fiabilité",
  itineraire: "itinéraire", itineraires: "itinéraires",
  peage: "péage", peages: "péages",
  ferie: "férié", feries: "fériés",
  megawatt: "mégawatt",
  // batch 3
  hypothese: "hypothèse", hypotheses: "hypothèses",
  decision: "décision", decisions: "décisions",
  "rendement reel": "rendement réel", "taux reel": "taux réel",
  deduction: "déduction", deductions: "déductions",
  declaration: "déclaration", declarations: "déclarations", declarer: "déclarer", declarez: "déclarez",
  exoneration: "exonération", exonerations: "exonérations", exoneree: "exonérée",
  prelevement: "prélèvement", prelevements: "prélèvements",
  regime: "régime", regimes: "régimes",
  plafonnee: "plafonnée",
  indemnite: "indemnité", indemnites: "indemnités",
  anciennete: "ancienneté", preavis: "préavis",
  publicite: "publicité", publicites: "publicités",
  medias: "médias",
  reseau: "réseau", reseaux: "réseaux",
  donnee: "donnée", donnees: "données",
  confidentialite: "confidentialité",
  parametre: "paramètre", parametres: "paramètres",
  critere: "critère", criteres: "critères",
  caractere: "caractère", caracteres: "caractères",
  generer: "générer", generez: "générez", regenerer: "régénérer",
  integrer: "intégrer", integrez: "intégrez",
  creer: "créer",
  modifiee: "modifiée", enregistree: "enregistrée",
  ecrire: "écrire", ecrit: "écrit", ecrite: "écrite",
  rediger: "rédiger", redigez: "rédigez", redigee: "rédigée",
  resume: "résumé", resumes: "résumés",
  diplome: "diplôme", diplomes: "diplômes",
  competence: "compétence", competences: "compétences",
  metier: "métier", metiers: "métiers",
  generale: "générale", generales: "générales", generaux: "généraux",
  reussite: "réussite", echec: "échec", echecs: "échecs",
  pedagogique: "pédagogique",
  pere: "père", mere: "mère", frere: "frère", freres: "frères",
  heritier: "héritier", heritiers: "héritiers", heritage: "héritage", heriter: "hériter",
  funerailles: "funérailles",
  sante: "santé", hygiene: "hygiène", bebe: "bébé",
  assuree: "assurée",
  revision: "révision", revisions: "révisions",
  importee: "importée", importees: "importées", exportee: "exportée", exportees: "exportées",
  electronique: "électronique", electroniques: "électroniques",
  electrogene: "électrogène",
  prepaye: "prépayé", prepayee: "prépayée",
  "moyenne generale": "moyenne générale",
  priere: "prière", prieres: "prières",
  careme: "carême", mosquee: "mosquée", dime: "dîme", pelerinage: "pèlerinage",
  fete: "fête", fetes: "fêtes",
  celebration: "célébration", celebrations: "célébrations",
  priorite: "priorité", priorites: "priorités",
  "marche boursier": "marché boursier", boursiere: "boursière",
  echeance: "échéance", echeances: "échéances", echeancier: "échéancier",
  mensualite: "mensualité", mensualites: "mensualités",
  annuite: "annuité", annuites: "annuités",
  hypotheque: "hypothèque", hypotheques: "hypothèques",
  metre: "mètre", metres: "mètres", carre: "carré", carres: "carrés",
  delai: "délai", delais: "délais",
  residence: "résidence", resident: "résident", residents: "résidents",
  citoyennete: "citoyenneté",
  depart: "départ", departs: "départs",
  arrivee: "arrivée", arrivees: "arrivées",
  sejour: "séjour", sejours: "séjours",
  aerien: "aérien", aerienne: "aérienne",
  medicament: "médicament", medicaments: "médicaments",
  ingredient: "ingrédient", ingredients: "ingrédients",
  preparation: "préparation", preparations: "préparations",
  fraicheur: "fraîcheur",
  reelle: "réelle", reelles: "réelles",
  personnalisee: "personnalisée", personnalisees: "personnalisées",
  entite: "entité", entites: "entités",
  dependre: "dépendre", budgeter: "budgéter",
  exigee: "exigée", exigees: "exigées",
  editable: "éditable", editables: "éditables",
  concu: "conçu", concue: "conçue", concus: "conçus", concues: "conçues",
  preparez: "préparez", preparer: "préparer",
  "Usage recommande": "Usage recommandé",
  envoye: "envoyé", envoyee: "envoyée",
  "source conserve": "source conservé",
  "fichier selectionne": "fichier sélectionné",
  adaptes: "adaptés", adaptee: "adaptée", adaptees: "adaptées",
  decoupe: "découpe", decoupes: "découpes",
  recent: "récent", recente: "récente", recents: "récents", recentes: "récentes",
  certifiee: "certifiée", certifiees: "certifiées",
  verifies: "vérifiés",
  "par defaut": "par défaut",
  "montant declare": "montant déclaré",
  supplement: "supplément", supplements: "suppléments",
  basees: "basées", basee: "basée",
  consultees: "consultées", consultee: "consultée",
};

// Build regex list: longest keys first so phrases win over single words.
const ENTRIES = Object.entries(WORDS)
  .sort((a, b) => b[0].length - a[0].length)
  .map(([from, to]) => {
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    // \b doesn't handle accented boundaries well; use lookarounds on [a-zA-ZÀ-ÿ'-]
    const guard = (body) => new RegExp(`(?<![A-Za-zÀ-ÿ-])${body}(?![A-Za-zÀ-ÿ-])`, "g");
    return [
      { re: guard(escapeRe(from)), to },
      { re: guard(escapeRe(cap(from))), to: cap(to) },
    ];
  })
  .flat();

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fixText(text) {
  if (!text || !/[A-Za-z]/.test(text)) return text;
  if (text.includes("://")) {
    // Protect URLs inside mixed text: split on whitespace, skip url-ish tokens
    return text
      .split(/(\s+)/)
      .map((tok) => (tok.includes("://") || tok.startsWith("/") ? tok : applyDict(tok)))
      .join("");
  }
  return applyDict(text);
}

// "l enregistrement" -> "l'enregistrement": a standalone l/d/j/n/c/qu before a
// vowel-initial word is never valid French — the apostrophe was dropped.
// ("a" and "s" are excluded: both are real standalone words/verb forms.)
// Lowercase only: uppercase single letters collide with acronyms ("vitamine D est").
const ELISION_RE = /(?<![A-Za-zÀ-ÿ'’-])([ldjnc]|[qQ]u) (?=[aeiouhàâäéèêëîïôöùûüAEIOUHÀÂÉÈÊËÎÏÔÙÛ][a-zà-ÿ])/g;
// Uppercase elision only at sentence start ("C est une..." but never "vitamine C est").
const ELISION_START_RE = /(^|[>.!?…:]\s*)([CLDNJ]|Qu|S) (?=[aeiouhàâéèêëîïôùûAEIOUHÀÂÉÈÊËÎÏÔÙÛ][a-zà-ÿ])/g;
// REMOVED: generic "a + -er word" -> "à" rule. English leak sentences ("for a
// sharper estimate") share the -er suffix and get corrupted. Only whitelisted
// French infinitives are safe:
const A_INFINITIVE_RE = /(?<![A-Za-zÀ-ÿ'’-])a (?=(?:v[ée]rifier|confirmer|payer|utiliser|suivre|budg[ée]ter|[ée]viter|comparer|calculer|pr[ée]voir|pr[ée]parer|d[ée]clarer|t[ée]l[ée]charger|imprimer|exporter|copier|corriger|ajuster|valider|surveiller|n[ée]gocier|documenter|anticiper|financer|rembourser|renouveler|planifier)(?![a-zà-ÿ]))/g;
// "de 5 a 10" -> "de 5 à 10"
const NUM_RANGE_RE = /(\d) a (?=\d)/g;

function applyDict(text) {
  let out = text;
  for (const { re, to } of ENTRIES) {
    re.lastIndex = 0;
    if (re.test(out)) {
      re.lastIndex = 0;
      out = out.replace(re, to);
    }
  }
  out = out.replace(ELISION_RE, "$1'");
  out = out.replace(ELISION_START_RE, "$1$2'");
  out = out.replace(A_INFINITIVE_RE, "à ");
  out = out.replace(NUM_RANGE_RE, "$1 à ");
  return out;
}

const SKIP_CONTAINERS = new Set(["script", "style", "code", "pre", "textarea", "kbd", "samp", "svg", "noscript"]);
const VISIBLE_ATTRS = ["alt", "placeholder", "aria-label", "title"];
const META_CONTENT_RE = /(name|property)=["'](description|keywords|og:title|og:description|og:site_name|twitter:title|twitter:description)["']/i;
const JSONLD_COPY_KEYS = new Set([
  "name", "description", "headline", "alternateName", "text", "slogan",
  "disambiguatingDescription", "caption", "keywords", "abstract", "articleSection",
]);

function fixJsonLd(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return raw; // malformed — leave untouched
  }
  const walk = (node) => {
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === "object") {
      const out = {};
      for (const [k, v] of Object.entries(node)) {
        if (typeof v === "string" && JSONLD_COPY_KEYS.has(k) && !v.includes("://") && !v.startsWith("/")) {
          out[k] = applyDict(v);
        } else {
          out[k] = walk(v);
        }
      }
      return out;
    }
    return node;
  };
  const fixed = walk(data);
  const serialized = JSON.stringify(fixed);
  return serialized === JSON.stringify(data) ? raw : serialized;
}

function fixAttributes(tag) {
  let out = tag;
  const tagName = (out.match(/^<\s*([a-zA-Z0-9-]+)/) || [])[1] || "";
  // meta content=
  if (/^<\s*meta\b/i.test(out) && META_CONTENT_RE.test(out)) {
    out = out.replace(/content=("([^"]*)"|'([^']*)')/i, (m, _q, dq, sq) => {
      const val = dq !== undefined ? dq : sq;
      if (val === undefined || val.includes("://")) return m;
      const fixed = applyDict(val);
      if (fixed === val) return m;
      return dq !== undefined ? `content="${fixed}"` : `content='${fixed}'`;
    });
  }
  if (tagName.toLowerCase() === "meta" || tagName.toLowerCase() === "link") return out;
  for (const attr of VISIBLE_ATTRS) {
    const re = new RegExp(`(\\s${attr}=)("([^"]*)"|'([^']*)')`, "gi");
    out = out.replace(re, (m, prefix, _q, dq, sq) => {
      const val = dq !== undefined ? dq : sq;
      if (!val || val.includes("://") || val.startsWith("/")) return m;
      const fixed = applyDict(val);
      if (fixed === val) return m;
      return dq !== undefined ? `${prefix}"${fixed}"` : `${prefix}'${fixed}'`;
    });
  }
  return out;
}

function processHtml(html) {
  const parts = html.split(/(<[^>]*>)/);
  const skipStack = [];
  let jsonLdDepth = false;
  let out = "";
  let buffer = null; // collects json-ld raw content

  for (const part of parts) {
    if (part.startsWith("<")) {
      const m = part.match(/^<\s*(\/)?\s*([a-zA-Z0-9-]+)/);
      const closing = Boolean(m && m[1]);
      const name = m ? m[2].toLowerCase() : "";

      if (!closing && name === "script" && /application\/ld\+json/i.test(part)) {
        out += part;
        jsonLdDepth = true;
        buffer = "";
        continue;
      }
      if (jsonLdDepth && closing && name === "script") {
        out += fixJsonLd(buffer) + part;
        jsonLdDepth = false;
        buffer = null;
        continue;
      }
      if (jsonLdDepth) {
        buffer += part;
        continue;
      }

      if (SKIP_CONTAINERS.has(name)) {
        if (closing) {
          const idx = skipStack.lastIndexOf(name);
          if (idx !== -1) skipStack.splice(idx, 1);
        } else if (!/\/>\s*$/.test(part)) {
          skipStack.push(name);
        }
        out += part;
        continue;
      }

      out += skipStack.length ? part : fixAttributes(part);
      continue;
    }

    // text node
    if (jsonLdDepth) {
      buffer += part;
    } else if (skipStack.length) {
      out += part;
    } else {
      out += fixText(part);
    }
  }
  return out;
}

function collectHtmlFiles(dir) {
  const found = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.html$/i.test(e.name)) found.push(p);
    }
  };
  walk(dir);
  return found;
}

function main() {
  const files = collectHtmlFiles(SCAN_DIR);
  let changed = 0;
  const perDir = {};
  const samples = [];

  for (const file of files) {
    const before = fs.readFileSync(file, "utf8");
    const after = processHtml(before);
    if (after !== before) {
      changed += 1;
      const rel = path.relative(ROOT, file).replace(/\\/g, "/");
      const top = rel.split("/").slice(0, 2).join("/");
      perDir[top] = (perDir[top] || 0) + 1;
      if (samples.length < 8) samples.push(rel);
      if (APPLY) fs.writeFileSync(file, after, "utf8");
    }
  }

  console.log(JSON.stringify({
    mode: APPLY ? "fix" : "dry-run",
    scanned: files.length,
    filesNeedingRepair: changed,
    byTopDir: Object.fromEntries(Object.entries(perDir).sort((a, b) => b[1] - a[1]).slice(0, 20)),
    samples,
  }, null, 2));
}

if (require.main === module) main();

module.exports = { processHtml, applyDict, fixText };

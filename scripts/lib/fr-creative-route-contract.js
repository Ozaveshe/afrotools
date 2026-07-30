"use strict";

const OWNERS = Object.freeze([
  ["african-palette", "palette-couleurs-africaines"],
  ["afrostream", "afrostream-afrique-s-createur-streaming-hub"],
  ["art-commission", "prix-commande-art"],
  ["book-publishing-cost", "cout-publication-livre"],
  ["creator-analytics", "stats-createur"],
  ["creator-bios", "bio-createur"],
  ["creator-brand", "kit-de-marque-pour-createur"],
  ["creator-calendar", "calendrier-createur"],
  ["creator-canvas", "canevas-de-projet-pour-createur"],
  ["creator-captions", "legendes-createur"],
  ["creator-carousel", "createur-de-carrousel"],
  ["creator-clip", "decoupe-de-video-pour-createur"],
  ["creator-club", "club-des-createurs"],
  ["creator-course", "cours-pour-createurs"],
  ["creator-desk", "bureau-du-createur"],
  ["creator-hashtags", "hashtags-createur"],
  ["creator-hooks", "accroches-de-contenu-pour-createur"],
  ["creator-invoice", "facture-createur"],
  ["creator-kit", "kit-media-pour-createur"],
  ["creator-mail", "courriels-pour-createur"],
  ["creator-mind", "idees-de-contenu-pour-createur"],
  ["creator-money", "revenus-du-createur"],
  ["creator-page", "page-createur"],
  ["creator-polish", "amelioration-de-contenu-pour-createur"],
  ["creator-pricing", "tarification-pour-createur"],
  ["creator-record", "enregistrement-pour-createur"],
  ["creator-repurpose", "reutilisation-de-contenu-pour-createur"],
  ["creator-research", "recherche-de-contenu-pour-createur"],
  ["creator-resize", "redimensionnement-pour-createur"],
  ["creator-schedule", "planning-du-createur"],
  ["creator-scripts", "scripts-video-pour-createur"],
  ["creator-split", "repartition-des-revenus-entre-createurs"],
  ["creator-stock", "mediatheque-pour-createur"],
  ["creator-team", "equipe-du-createur"],
  ["creator-thumb", "miniature-pour-createur"],
  ["creator-titles", "titres-de-contenu-pour-createur"],
  ["creator-voice", "voix-de-marque-du-createur"],
  ["engagement-rate", "taux-engagement"],
  ["linkedin-optimizer", "optimiseur-linkedin"],
  ["music-royalty-splitter", "partage-redevances-musicales"],
  ["personal-brand-audit", "audit-marque-personnelle"],
  ["photography-pricing", "prix-seance-photo"],
  ["podcast-monetization", "monetisation-podcast"],
  ["self-publishing-royalty", "calculateur-de-droits-d-autoedition"],
  ["social-media-calendar", "calendrier-medias-sociaux"],
  ["wedding-photo-package", "forfait-photo-mariage"],
]);

const WORKSPACES = Object.freeze(
  OWNERS.filter(([englishId]) => englishId.startsWith("creator-"))
);

const IN_LANGUAGE_LAUNCHERS = Object.freeze([
  "palette-couleurs-africaines",
  "prix-commande-art",
  "cout-publication-livre",
  "stats-createur",
  "calendrier-createur",
  "legendes-createur",
  "decoupe-de-video-pour-createur",
  "bureau-du-createur",
  "accroches-de-contenu-pour-createur",
  "facture-createur",
  "idees-de-contenu-pour-createur",
  "enregistrement-pour-createur",
  "reutilisation-de-contenu-pour-createur",
  "scripts-video-pour-createur",
  "repartition-des-revenus-entre-createurs",
  "titres-de-contenu-pour-createur",
  "voix-de-marque-du-createur",
  "taux-engagement",
  "optimiseur-linkedin",
  "partage-redevances-musicales",
  "audit-marque-personnelle",
  "prix-seance-photo",
  "monetisation-podcast",
  "calculateur-de-droits-d-autoedition",
]);

const LANES = Object.freeze([
  {
    id: "planifier",
    title: "Planifier et publier",
    description:
      "Transformez une idée en calendrier, script, légende et programme de diffusion.",
    ownerIds: Object.freeze([
      "creator-calendar",
      "creator-captions",
      "creator-hooks",
      "creator-mind",
      "creator-repurpose",
      "creator-research",
      "creator-schedule",
      "creator-scripts",
      "creator-titles",
      "social-media-calendar",
    ]),
  },
  {
    id: "marque",
    title: "Construire une marque et une audience",
    description:
      "Clarifiez votre identité, vos supports et la façon dont votre audience vous trouve.",
    ownerIds: Object.freeze([
      "african-palette",
      "creator-bios",
      "creator-brand",
      "creator-canvas",
      "creator-carousel",
      "creator-hashtags",
      "creator-kit",
      "creator-page",
      "creator-polish",
      "creator-thumb",
      "creator-voice",
      "engagement-rate",
      "linkedin-optimizer",
      "personal-brand-audit",
    ]),
  },
  {
    id: "media",
    title: "Produire des médias",
    description:
      "Préparez, découpez, enregistrez et organisez vos images, vidéos et sons localement.",
    ownerIds: Object.freeze([
      "afrostream",
      "creator-clip",
      "creator-record",
      "creator-resize",
      "creator-stock",
      "photography-pricing",
      "wedding-photo-package",
    ]),
  },
  {
    id: "revenus",
    title: "Chiffrer et monétiser",
    description:
      "Estimez prix, coûts, redevances et revenus sans masquer les hypothèses.",
    ownerIds: Object.freeze([
      "art-commission",
      "book-publishing-cost",
      "creator-analytics",
      "creator-invoice",
      "creator-money",
      "creator-pricing",
      "creator-split",
      "music-royalty-splitter",
      "podcast-monetization",
      "self-publishing-royalty",
    ]),
  },
  {
    id: "organisation",
    title: "Organiser son activité",
    description:
      "Gérez votre bureau, vos cours, votre communauté, vos messages et votre équipe.",
    ownerIds: Object.freeze([
      "creator-club",
      "creator-course",
      "creator-desk",
      "creator-mail",
      "creator-team",
    ]),
  },
]);

function validateContract() {
  const ownerIds = OWNERS.map(([englishId]) => englishId);
  const slugs = OWNERS.map(([, frenchSlug]) => frenchSlug);
  const laneOwnerIds = LANES.flatMap((lane) => lane.ownerIds);
  if (OWNERS.length !== 46 || new Set(ownerIds).size !== 46) {
    throw new Error("French Creative contract must contain 46 unique launchers.");
  }
  if (new Set(slugs).size !== 46) {
    throw new Error("French Creative contract must contain 46 unique French slugs.");
  }
  if (WORKSPACES.length !== 33) {
    throw new Error("French Creative contract must contain 33 workspaces.");
  }
  if (
    laneOwnerIds.length !== 46 ||
    laneOwnerIds.some((ownerId) => !ownerIds.includes(ownerId)) ||
    ownerIds.some((ownerId) => !laneOwnerIds.includes(ownerId))
  ) {
    throw new Error("Every French Creative launcher must belong to exactly one lane.");
  }
}

validateContract();

module.exports = {
  HUB_ROUTE: "/fr/creative/",
  IN_LANGUAGE_LAUNCHERS,
  LANES,
  OWNERS,
  WORKSPACES,
  validateContract,
};

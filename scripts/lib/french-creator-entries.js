"use strict";

const entries = {
  "accroches-de-contenu-pour-createur": ["Créer mes accroches", "Indiquez votre sujet et votre plateforme pour obtenir six accroches à comparer. Téléchargez les accroches en texte ou en JSON."],
  "bureau-du-createur": ["Ouvrir mon registre de projets", "Suivez vos collaborations avec leur client, leur montant, leur devise et leur échéance. Le registre s’exporte en CSV ou en JSON."],
  "calendrier-createur": ["Planifier mes publications", "Choisissez un sujet, une date de début et vos plateformes. Retrouvez chaque publication dans le calendrier et exportez-le en CSV ou en JSON."],
  "decoupe-de-video-pour-createur": ["Découper ma vidéo", "Choisissez un fichier vidéo, déplacez les deux poignées de la chronologie pour garder le passage voulu, puis exportez la séquence en WebM."],
  "enregistrement-pour-createur": ["Enregistrer mon écran ou ma caméra", "Choisissez l’écran, la webcam ou le son seul. Autorisez les appareils nécessaires, arrêtez la capture et téléchargez votre enregistrement WebM."],
  "idees-de-contenu-pour-createur": ["Trouver des idées de contenu", "Précisez votre sujet, votre public et votre plateforme. Comparez les idées proposées puis téléchargez-les pour préparer vos publications."],
  "legendes-createur": ["Rédiger mes légendes", "Indiquez le sujet, la plateforme, le ton et la longueur pour obtenir des variantes. Vous pouvez aussi réécrire une légende existante."],
  "repartition-des-revenus-entre-createurs": ["Calculer les parts", "Indiquez le revenu, la devise et la part de chaque collaborateur. Vérifiez le montant de chacun et téléchargez la répartition."],
  "reutilisation-de-contenu-pour-createur": ["Adapter mon contenu", "Collez votre texte source, choisissez les plateformes de destination et récupérez un brouillon adapté à chacune."],
  "scripts-video-pour-createur": ["Écrire mon script vidéo", "Renseignez le sujet, le format et les points à traiter. Générez un premier script que vous pouvez exporter en texte ou en JSON."],
  "titres-de-contenu-pour-createur": ["Créer mes titres", "Saisissez votre sujet et choisissez votre plateforme. Comparez les titres proposés et exportez-les en texte ou en JSON."],
  "voix-de-marque-du-createur": ["Ouvrir mon studio audio", "Enregistrez au micro ou importez un fichier audio, écoutez et modifiez la piste, puis exportez votre montage."]
};

function enhance(html, slug) {
  if (!entries[slug]) return html;
  const [label, description] = entries[slug];
  const app = "/fr/tools/" + slug + "/app";
  return html.replace(/<p class="lead">[\s\S]*?<\/p>/, '<p class="lead">' + description + '</p>')
    .replace(/<div class="action-row">[\s\S]*?<\/div>/, '<div class="action-row"><a class="primary-action" href="' + app + '">' + label + '</a></div>')
    .replace(/\s*<section class="prep-panel"[^>]*>[\s\S]*?<\/section>/, "")
    .replace(/<script>(?:(?!<\/script>)[\s\S])*?document\.querySelector\('\[data-fr-prep\]'\)[\s\S]*?<\/script>/, "")
    .replace(/^[ \t]+$/gm, "");
}

module.exports = { entries, enhance };

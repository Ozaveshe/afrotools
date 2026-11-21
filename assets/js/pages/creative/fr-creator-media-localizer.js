(function () {
  "use strict";
  var TERMS = [
    ["CreatorRecord Workspace", "Espace CreatorRecord"],
    ["CreatorClip Workspace", "Espace CreatorClip"],
    ["CreatorVoice Studio", "Studio CreatorVoice"],
    ["Screen + Webcam", "Écran + webcam"],
    ["Screen Only", "Écran uniquement"],
    ["Webcam Only", "Webcam uniquement"],
    ["Audio Only", "Audio uniquement"],
    ["Record your screen, tab, or window", "Enregistrez votre écran, un onglet ou une fenêtre"],
    ["Record from your camera", "Enregistrez depuis votre caméra"],
    ["PiP webcam overlay on screen", "Webcam en incrustation sur l'écran"],
    ["Record mic and system audio", "Enregistrez le micro et l'audio système"],
    ["Loading microphones...", "Chargement des microphones..."],
    ["Click the record button or press", "Cliquez sur le bouton d'enregistrement ou appuyez sur"],
    ["to start recording", "pour commencer l'enregistrement"],
    ["Drop your video here", "Déposez votre vidéo ici"],
    ["or click to browse files", "ou cliquez pour parcourir les fichiers"],
    ["Choose Video", "Choisir une vidéo"],
    ["Save Project", "Enregistrer le projet"],
    ["Load Project", "Charger le projet"],
    ["New Video", "Nouvelle vidéo"],
    ["Export Video", "Exporter la vidéo"],
    ["Export Audio", "Exporter l'audio"],
    ["Export & Download", "Exporter et télécharger"],
    ["Download WebM", "Télécharger le WebM"],
    ["Exporting...", "Exportation..."],
    ["Downloading...", "Téléchargement..."],
    ["Video exported!", "Vidéo exportée !"],
    ["WAV exported", "WAV exporté"],
    ["Preparing export...", "Préparation de l'export..."],
    ["No audio to export", "Aucun audio à exporter"],
    ["Format not fully supported in this browser, exporting as WAV", "Format partiellement pris en charge ; export WAV utilisé"],
    ["Untitled Project", "Projet sans titre"],
    ["Episode title...", "Titre de l'épisode..."],
    ["Your name...", "Votre nom..."],
    ["Project Name", "Nom du projet"],
    ["Recording", "Enregistrement"],
    ["Record", "Enregistrer"],
    ["Resume", "Reprendre"],
    ["Pause", "Pause"],
    ["Stop", "Arrêter"],
    ["Cancel", "Annuler"],
    ["History", "Historique"],
    ["Projects", "Projets"],
    ["Library", "Bibliothèque"],
    ["Edit", "Modifier"],
    ["Export", "Exporter"],
    ["Save", "Enregistrer"],
    ["Delete", "Supprimer"],
    ["Download", "Télécharger"],
    ["Upload", "Importer"],
    ["Quality", "Qualité"],
    ["Format", "Format"],
    ["Microphone", "Microphone"],
    ["Camera", "Caméra"],
    ["Captions", "Sous-titres"],
    ["Trim", "Découper"],
    ["Text", "Texte"],
    ["Overlays", "Superpositions"],
    ["Speed", "Vitesse"],
    ["Volume", "Volume"],
    ["Background", "Arrière-plan"],
    ["Start", "Début"],
    ["End", "Fin"],
    ["Duration", "Durée"],
    ["File size", "Taille du fichier"],
    ["No recordings yet", "Aucun enregistrement"],
    ["No projects yet", "Aucun projet"],
    ["Permission denied", "Autorisation refusée"],
    ["Microphone access denied", "Accès au microphone refusé"],
    ["Camera access denied", "Accès à la caméra refusé"]
  ];
  TERMS.push(
    ["Auto-Generate Captions","Créer les sous-titres"], ["Add Caption","Ajouter un sous-titre"], ["Clear All","Tout effacer"],
    ["No captions yet. Click \"Auto-Generate\" to create captions from audio, or add them manually.","Aucun sous-titre. Lancez la génération depuis la piste audio ou ajoutez-les manuellement."],
    ["Add Text Overlay","Ajouter du texte"], ["Text Overlays","Textes superposés"], ["Full video","Vidéo entière"],
    ["TIMELINE","Chronologie"], ["Filters","Filtres"], ["Resize","Redimensionner"], ["Preparing...","Préparation…"],
    ["System audio","Son du système"], ["Noise suppression","Réduction du bruit"], ["Mirror","Miroir"],
    ["Shape","Forme"], ["PiP Position","Position de l’incrustation"], ["3-2-1 countdown","Compte à rebours"],
    ["Loading cameras...","Chargement des caméras…"], ["Preview appears here","L’aperçu apparaîtra ici"],
    ["Pick a mode and hit record","Choisissez un mode, puis lancez l’enregistrement"], ["Recent Recordings","Enregistrements récents"],
    ["Trim Start","Début de la sélection"], ["Trim End","Fin de la sélection"], ["Full Screen","Plein écran"],
    ["About","À propos"], ["Caption Style","Style de sous-titres"], ["Font","Police"], ["Size","Taille"],
    ["Color","Couleur"], ["BG Color","Couleur de fond"], ["Enable BG","Activer le fond"], ["Position","Position"],
    ["Bottom","Bas"], ["Center","Centre"], ["Top","Haut"], ["Platform Size","Format de diffusion"], ["Landscape","Paysage"],
    ["Square","Carré"], ["Background Fill","Remplissage du fond"], ["Black","Noir"], ["White","Blanc"],
    ["Gradient","Dégradé"], ["Blur","Flou"], ["Video Filters","Filtres vidéo"], ["None","Aucun"], ["Grayscale","Niveaux de gris"],
    ["Warm","Chaud"], ["Cool","Froid"], ["High Contrast","Contraste élevé"], ["Adjustments","Réglages"],
    ["Brightness","Luminosité"], ["Contrast","Contraste"], ["Playback Speed","Vitesse de lecture"], ["Audio Controls","Réglages audio"],
    ["Mute","Couper le son"], ["Fade In","Fondu en ouverture"], ["Fade Out","Fondu en fermeture"], ["Cut","Couper"],
    ["Drag & drop audio here or","Déposez votre fichier audio ici ou"], ["click to browse","parcourez vos fichiers"],
    ["MP3, WAV, OGG, M4A supported","Formats acceptés : MP3, WAV, OGG et M4A"], ["WAV (Lossless)","WAV (sans perte)"],
    ["MP3 (Compressed)","MP3 (compressé)"], ["Saved Projects","Projets enregistrés"], ["Sound Library","Bibliothèque de sons"],
    ["Main recording","Enregistrement principal"], ["Undo","Annuler la modification"], ["Redo","Rétablir"], ["Split","Scinder"],
    ["Normalize","Normaliser"], ["Noise Reduce","Réduire le bruit"], ["Reverse","Inverser"], ["Insert Silence","Insérer un silence"],
    ["Multi-Track Mixer","Mixage multipiste"], ["Artist","Artiste"], ["Title","Titre"]
  );
  TERMS.push(
    ["Pause/Resume", "Mettre en pause ou reprendre"], ["Toggle system audio", "Activer ou couper le son du système"],
    ["Toggle microphone", "Activer ou couper le microphone"], ["Toggle noise reduction", "Activer ou couper la réduction du bruit"],
    ["Toggle mirror preview", "Activer ou couper l’aperçu miroir"], ["Toggle countdown", "Activer ou couper le compte à rebours"],
    ["Circle", "Cercle"], ["Rounded Rectangle", "Rectangle arrondi"], ["Pen (red)", "Stylo rouge"],
    ["Highlighter (yellow)", "Surligneur jaune"], ["Arrow", "Flèche"], ["Eraser", "Gomme"], ["Done!", "Terminé !"], ["Video playback failed.", "Impossible de lire la vidéo."]
  );
  const translations = new Map(TERMS);
  function translate(value) {
    // Keep icon/keyboard adornments and avoid changing user-provided titles or filenames.
    if (value.startsWith("Video loaded: ")) return "Vidéo chargée : " + value.slice("Video loaded: ".length);
    if (value.includes("&nbsp;")) return value.split("&nbsp;").map(translate).join("&nbsp;");
    if (/^\d+:\d+ selected$/.test(value)) return value.replace(/ selected$/, " sélectionnées");
    const match = /^(\s*[^\p{L}\p{N}]*)(.*?)(\s*(?:\([A-Z]\))?\s*)$/u.exec(value);
    if (!match) return value;
    const translated = translations.get(match[2]);
    return translated ? match[1] + translated + match[3] : value;
  }
  if (typeof module === "object" && module.exports) {
    module.exports = { translate };
    return;
  }
  window.AfroToolsCreatorRecordLocale = {
    strings: {
      permissionDenied: "Autorisation refusée. Vérifiez les autorisations du navigateur pour cet appareil.",
      policyBlocked: "La politique de cette page bloque l’accès à la caméra ou au microphone.",
      deviceBusy: "L’appareil est occupé ou inaccessible.",
      missingDevice: "L’appareil sélectionné est indisponible. Choisissez un autre appareil.",
      codecUnsupported: "Ce navigateur ne peut pas enregistrer dans ce format.",
      cancelled: "Enregistrement annulé", complete: "Enregistrement terminé.", delete: "Supprimer",
      deleted: "Enregistrement supprimé", download: "Télécharger", downloading: "Téléchargement…",
      enterText: "Saisissez le texte :", failed: "Aucune donnée enregistrée.", getReady: "Préparez-vous…",
      mediaUnsupported: "Ce navigateur ne prend pas en charge l’enregistrement de médias.",
      noRecordings: "Aucun enregistrement", noTracks: "Aucune piste disponible",
      preview: "Aperçu", recorderUnsupported: "L’enregistrement est indisponible dans ce navigateur.",
      screenUnsupported: "La capture d’écran est indisponible dans ce navigateur.",
      noCameras: "Aucune caméra disponible", camera: "Caméra", errorPrefix: "Erreur :"
    }
  };
  function start() {
    const targets = document.querySelectorAll("#toast, #exportBtn, #recordBtn, #downloadBtn, #exportProgressText, #progressText, #trimLabel");
    for (const target of targets) {
      new MutationObserver(() => {
        for (const node of target.childNodes) {
          if (node.nodeType !== Node.TEXT_NODE) continue;
          const text = translate(node.nodeValue);
          if (text !== node.nodeValue) node.nodeValue = text;
        }
      }).observe(target, { childList: true, characterData: true, subtree: true });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

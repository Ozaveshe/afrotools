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
  TERMS.sort(function (a, b) { return b[0].length - a[0].length; });
  function replace(value) {
    var next = value || "";
    TERMS.forEach(function (pair) {
      var escaped = pair[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      next = next.replace(new RegExp("\\b" + escaped + "\\b", "g"), pair[1]);
    });
    return next;
  }
  function localize(root) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var parent = node.parentElement;
        return !node.nodeValue.trim() || (parent && /^(script|style|code|pre)$/i.test(parent.tagName))
          ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var next = replace(node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
    });
    root.querySelectorAll("[aria-label],[title],[placeholder],input[value]").forEach(function (element) {
      ["aria-label", "title", "placeholder", "value"].forEach(function (attribute) {
        if (!element.hasAttribute(attribute)) return;
        var current = element.getAttribute(attribute);
        var next = replace(current);
        if (next !== current) element.setAttribute(attribute, next);
      });
    });
  }
  function start() {
    localize(document.body);
    new MutationObserver(function (records) {
      records.forEach(function (record) {
        Array.from(record.addedNodes).forEach(function (node) {
          if (node.nodeType === 1) localize(node);
          else if (node.nodeType === 3 && node.parentElement) localize(node.parentElement);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

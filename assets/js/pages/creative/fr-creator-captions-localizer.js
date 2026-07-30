!function() {
  "use strict";

  if (document.documentElement.lang !== "fr") return;

  var exact = {
    "Sign in to CaptionCraft": "Connexion à CaptionCraft",
    "Sign In to Continue": "Se connecter pour continuer",
    "Learn more about CaptionCraft": "En savoir plus sur CaptionCraft",
    "Write": "Rédiger",
    "Rewrite": "Réécrire",
    "History": "Historique",
    "Favorites": "Favoris",
    "Guest mode": "Mode invité",
    "Sign Out": "Déconnexion",
    "Captions today": "Légendes aujourd’hui",
    "Saved favorites": "Favoris enregistrés",
    "Describe your post": "Décrivez votre publication",
    "Platform": "Plateforme",
    "Tone": "Ton",
    "Caption Length": "Longueur de la légende",
    "Language": "Langue",
    "Include": "Inclure",
    "Casual": "Décontracté",
    "Professional": "Professionnel",
    "Bold": "Audacieux",
    "Playful": "Ludique",
    "Inspirational": "Inspirant",
    "Educational": "Pédagogique",
    "Short": "Courte",
    "Medium": "Moyenne",
    "Long": "Longue",
    "English": "Anglais",
    "Pidgin English": "Anglais pidgin",
    "French": "Français",
    "Portuguese": "Portugais",
    "Call to Action": "Appel à l’action",
    "Hashtags": "Mots-dièse",
    "Question": "Question",
    "Hook First Line": "Accroche en première ligne",
    "Optional AI assist": "Assistance IA facultative",
    "Generate Captions": "Créer les légendes",
    "Your captions will appear here": "Vos légendes apparaîtront ici",
    "Describe your post, pick a platform and tone, then hit Generate.": "Décrivez la publication, choisissez une plateforme et un ton, puis lancez la création.",
    "Paste your existing caption": "Collez votre légende actuelle",
    "Rewrite Caption": "Réécrire la légende",
    "Paste a caption to rewrite": "Collez une légende à améliorer",
    "Get 3 improved versions with better hooks, formatting, and CTAs.": "Obtenez 3 versions améliorées avec de meilleures accroches, une mise en forme claire et des appels à l’action.",
    "A/B Compare": "Comparaison A/B",
    "Compare Side-by-Side": "Comparer côte à côte",
    "Clear": "Effacer",
    "Export All as .txt": "Exporter tout en .txt",
    "Copy": "Copier",
    "No Tags": "Sans mots-dièse",
    "Tags Only": "Mots-dièse uniquement",
    "Share": "Partager",
    "Save": "Enregistrer",
    "Saved": "Enregistré",
    "Compare": "Comparer",
    "Tip:": "Conseil :"
  };

  var phrases = [
    [
      "When checked, your topic, platform, tone and selected options are sent to AfroTools’ caption service. Leave unchecked to generate locally in this browser.",
      "Si vous cochez cette case, votre sujet, la plateforme, le ton et les options choisies sont envoyés au service de légendes AfroTools. Laissez-la décochée pour créer localement dans ce navigateur."
    ],
    [
      "When checked, the pasted caption and platform are sent to AfroTools’ caption service. Leave unchecked to rewrite locally in this browser.",
      "Si vous cochez cette case, la légende collée et la plateforme sont envoyées au service de légendes AfroTools. Laissez-la décochée pour réécrire localement dans ce navigateur."
    ]
  ];

  function translateText(value) {
    var trimmed = value.trim();
    if (exact[trimmed]) return value.replace(trimmed, exact[trimmed]);
    var next = value;
    phrases.forEach(function(pair) {
      next = next.replace(pair[0], pair[1]);
    });
    return next;
  }

  function translate(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      root.nodeValue = translateText(root.nodeValue || "");
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE) {
      [ "placeholder", "aria-label", "title" ].forEach(function(name) {
        if (root.hasAttribute(name)) root.setAttribute(name, translateText(root.getAttribute(name)));
      });
    }
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) node.nodeValue = translateText(node.nodeValue || "");
  }

  function init() {
    document.title = "Atelier de légendes créateur | AfroTools";
    translate(document.body);
    var language = document.getElementById("langSelect");
    if (language) language.value = "french";
    new MutationObserver(function(records) {
      records.forEach(function(record) {
        record.addedNodes.forEach(translate);
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
}();

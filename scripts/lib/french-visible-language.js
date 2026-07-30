"use strict";

const VISIBLE_LANGUAGE_TRANSFORMS = Object.freeze([
  [/\bprivacy policy\b/gi, "politique de confidentialité"],
  [/\bterms of use\b/gi, "conditions d’utilisation"],
  [/\bcontact us\b/gi, "nous contacter"],
  [/\bcalculators\b/gi, "calculateurs"],
  [/\bcalculator\b/gi, "calculateur"],
  [/\bcalculate\b/gi, "calculer"],
  [/\benter\b/gi, "saisissez"],
  [/\bresults\b/gi, "résultats"],
  [/\bresult\b/gi, "résultat"],
  [/\breset\b/gi, "réinitialiser"],
  [/\bsave\b/gi, "enregistrer"],
  [/\bdownload\b/gi, "télécharger"],
  [/\bsearch\b/gi, "rechercher"],
  [/\bselect\b/gi, "sélectionner"],
  [/\bamount\b/gi, "montant"],
  [/\bmonthly\b/gi, "mensuel"],
  [/\bannual\b/gi, "annuel"],
  [/\bsubmit\b/gi, "envoyer"],
  [/\bloading\b/gi, "chargement"],
  [/\berror\b/gi, "erreur"],
  [/\brequired\b/gi, "obligatoire"],
  [/\bnext\b/gi, "suivant"],
  [/\bprevious\b/gi, "précédent"],
  [/\bprint\b/gi, "imprimer"],
  [/\bshare\b/gi, "partager"],
  [/\bcopy\b/gi, "copier"],
]);

function applyTransforms(value, transforms = VISIBLE_LANGUAGE_TRANSFORMS) {
  return transforms.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    value
  );
}

function translateVisibleFragment(fragment, transforms = VISIBLE_LANGUAGE_TRANSFORMS) {
  return fragment
    .replace(
      /(^|>)([^<]+)(?=<|$)/g,
      (whole, boundary, text) => `${boundary}${applyTransforms(text, transforms)}`
    )
    .replace(
      /\b(placeholder|aria-label|title|alt|value)=(['"])(.*?)\2/gi,
      (whole, attribute, quote, text) =>
        `${attribute}=${quote}${applyTransforms(text, transforms)}${quote}`
    );
}

function localizeVisibleLanguage(html, transforms = VISIBLE_LANGUAGE_TRANSFORMS) {
  let cursor = 0;
  let localized = "";
  const protectedBlock =
    /<(script|style|noscript|textarea|pre|code)\b[\s\S]*?<\/\1\s*>/gi;

  for (const match of html.matchAll(protectedBlock)) {
    localized += translateVisibleFragment(
      html.slice(cursor, match.index),
      transforms
    );
    localized += match[0];
    cursor = match.index + match[0].length;
  }
  localized += translateVisibleFragment(html.slice(cursor), transforms);
  return localized;
}

module.exports = {
  VISIBLE_LANGUAGE_TRANSFORMS,
  applyTransforms,
  localizeVisibleLanguage,
  translateVisibleFragment,
};

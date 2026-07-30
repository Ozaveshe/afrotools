(function () {
  "use strict";

  var payload = document.getElementById("fr-health-translations");
  if (!payload) return;

  var dictionary = {};
  try {
    dictionary = JSON.parse(payload.textContent || "{}");
  } catch (_error) {
    dictionary = {};
  }

  var critical = {
    "Download PDF": "Télécharger le PDF",
    "Download TXT": "Télécharger le TXT",
    "Print / save PDF": "Imprimer / enregistrer en PDF",
    "Print or save as PDF": "Imprimer ou enregistrer en PDF",
    "Clear": "Effacer",
    "Reset": "Réinitialiser",
    "Calculate": "Calculer",
    "Result": "Résultat",
    "Results": "Résultats",
    "Observed ratio interval": "Intervalle de rapport observé",
    "Waist spread": "Écart du tour de taille",
    "Hip spread": "Écart du tour de hanche",
    "An HbA/HbS pattern is commonly described as sickle cell trait. Trait is different from sickle cell disease; the report and a qualified clinician must confirm the individual result.": "Un profil HbA/HbS est couramment décrit comme un trait drépanocytaire. Le trait diffère de la drépanocytose ; le rapport complet et un professionnel de santé qualifié doivent confirmer le résultat individuel.",
    "High-performance liquid chromatography (HPLC)": "Chromatographie liquide haute performance (HPLC)",
    "Does the complete report contain any additional haemoglobin fractions or comments I should understand?": "Le rapport complet contient-il d'autres fractions d'hémoglobine ou des commentaires que je devrais comprendre ?",
    "Would a clinician or genetic counsellor recommend any follow-up for my personal context?": "Un clinicien ou un conseiller en génétique recommanderait-il un suivi adapté à mon contexte personnel ?",
    "What newborn screening and confirmatory follow-up are available locally if this is relevant to family planning?": "Quel dépistage néonatal et quel suivi de confirmation sont disponibles localement si cela concerne un projet familial ?",
    "Enter the result notation exactly as it appears on the report.": "Saisissez la notation du résultat exactement telle qu'elle apparaît sur le rapport.",
    "Testing and diagnosis are separate. Marker combinations, timing and clinical context determine whether more evaluation is required; this app cannot diagnose or rule out hepatitis B.": "Le dépistage et le diagnostic sont distincts. Les combinaisons de marqueurs, le calendrier et le contexte clinique déterminent si une évaluation complémentaire est nécessaire ; cette application ne peut ni diagnostiquer ni exclure l’hépatite B.",
    "Pregnancy: arrange hepatitis B screening through prenatal care promptly during this pregnancy; do not wait for this export.": "Grossesse : organisez rapidement un dépistage de l’hépatite B dans le cadre des soins prénatals pendant cette grossesse ; n’attendez pas cet export.",
    "Privacy": "Confidentialité",
    "Sources": "Sources",
    "Official sources": "Sources officielles",
    "Source check": "Vérification des sources",
    "Reviewed 26 July 2026": "Révisé le 26 juillet 2026",
    "Sources checked: 26 July 2026.": "Sources vérifiées le 26 juillet 2026.",
    "This tool does not diagnose": "Cet outil ne pose aucun diagnostic",
    "not a diagnosis": "pas un diagnostic",
    "not medical advice": "pas un avis médical",
    "does not replace medical advice": "ne remplace pas un avis médical",
    "does not replace professional medical advice": "ne remplace pas l'avis d'un professionnel de santé",
    "Seek urgent local care": "Consultez d'urgence un service de santé local",
    "Do not wait for this tool.": "N'attendez pas le résultat de cet outil.",
    "Do not wait for this checklist.": "N'attendez pas la fin de cette liste de contrôle.",
    "Runs in this browser": "Fonctionne dans ce navigateur",
    "stays in this browser": "reste dans ce navigateur",
    "stay in this browser": "restent dans ce navigateur",
    "No upload": "Aucun téléversement",
    "No account": "Aucun compte requis",
    "No diagnosis": "Aucun diagnostic",
    "Educational use only": "Usage éducatif uniquement",
    "Local first": "Traitement local d'abord",
    "Optional AI": "IA facultative",
    "Save on this device": "Enregistrer sur cet appareil",
    "Download PDF": "Télécharger le PDF",
    "Download local TXT": "Télécharger le TXT local",
    "Downloaded locally.": "Téléchargé localement.",
    "PDF downloaded locally.": "PDF téléchargé localement.",
    "TXT downloaded locally.": "TXT téléchargé localement.",
    "PDF library unavailable. Use TXT.": "Bibliothèque PDF indisponible. Utilisez le TXT.",
    "Required": "Obligatoire",
    "Invalid": "Non valide",
    "Please enter": "Veuillez saisir",
    "Please select": "Veuillez sélectionner",
    "Questions to ask": "Questions à poser",
    "Next steps": "Étapes suivantes",
    "Next action": "Prochaine étape",
    "Before you continue": "Avant de continuer",
    "Before you calculate": "Avant de calculer",
    "Frequently Asked Questions": "Questions fréquentes",
    "Related tools": "Outils associés",
    "Related AfroTools": "Outils AfroTools associés",
    "Home": "Accueil",
    "All tools": "Tous les outils",
    "All Tools": "Tous les outils",
    "Health": "Santé",
    "Health tools": "Outils santé",
    "Tools": "Outils",
    "Dark mode": "Mode sombre",
    "Observed BMI interval": "Intervalle d’IMC observé",
    "Height spread": "Écart de taille",
    "Weight spread": "Écart de poids",
    "You recorded": "Vous avez enregistré",
    "Within shown range": "Dans la plage indiquée",
    "Total Markers": "Marqueurs au total",
    "Done!": "Terminé !",
    "COMPLETE BLOOD COUNT (CBC)": "NUMÉRATION FORMULE SANGUINE (NFS)",
    "COMPLETE BLOOD COUNT": "NUMÉRATION FORMULE SANGUINE",
    "NORMAL": "DANS LA PLAGE",
    "Reference range": "Plage de référence",
    "White blood cells fight infection. Low counts may mean reduced immune defence; high counts often occur with infection, inflammation or stress.": "Les globules blancs participent à la défense contre les infections. Un taux bas peut indiquer une défense immunitaire réduite ; un taux élevé peut accompagner une infection, une inflammation ou un stress.",
    "White blood cells fight infection. Low counts may mean weakened immunity; high counts often indicate infection or inflammation.": "Les globules blancs participent à la défense contre les infections. Un taux bas peut indiquer une immunité affaiblie ; un taux élevé accompagne souvent une infection ou une inflammation.",
    "Laboratory range used. This range was parsed from the uploaded report; verify it against the original document.": "Plage du laboratoire utilisée. Cette plage a été extraite du rapport importé ; vérifiez-la dans le document original.",
    "Laboratory range used. This range was parsed from the same line as the result. Check it against the original report.": "Plage du laboratoire utilisée. Cette plage a été extraite de la même ligne que le résultat ; vérifiez-la dans le rapport original.",
    "These recognized markers are within the general range. How often should I repeat these tests?": "Ces marqueurs reconnus se situent dans la plage générale. À quelle fréquence dois-je refaire ces analyses ?",
    "Are there any additional tests I should consider based on my symptoms or medical history?": "D’autres analyses sont-elles à envisager selon mes symptômes ou mes antécédents médicaux ?",
    "Are there symptoms or changes that should prompt me to seek care sooner?": "Quels symptômes ou changements devraient m’amener à consulter plus rapidement ?",
    "Are there any additional tests you recommend based on my age and health history?": "Recommandez-vous d’autres analyses compte tenu de mon âge et de mes antécédents de santé ?",
    "Are there symptoms, medicines, pregnancy status, or history that change how you interpret these results?": "Certains symptômes, médicaments, une grossesse ou mes antécédents changent-ils l’interprétation de ces résultats ?",
    "First day of your last menstrual period": "Premier jour de vos dernières règles",
    "at or below the 10 µg/L provisional guideline value": "inférieur ou égal à la valeur guide provisoire de 10 µg/L",
    "above the 10 µg/L provisional guideline value": "supérieur à la valeur guide provisoire de 10 µg/L",
    "at or below the 1.5 mg/L guideline value": "inférieur ou égal à la valeur guide de 1,5 mg/L",
    "above the 1.5 mg/L guideline value; climate and total intake still require local interpretation": "supérieur à la valeur guide de 1,5 mg/L ; le climat et l’apport total nécessitent encore une interprétation locale",
    "at or below the 1 NTU operational target used here": "inférieur ou égal à la cible opérationnelle de 1 NTU utilisée ici",
    "above the 1 NTU target but not above the 5 NTU fallback operational flag; treatment context needs review": "supérieur à la cible de 1 NTU sans dépasser le seuil opérationnel de secours de 5 NTU ; le contexte de traitement doit être examiné",
    "above the 5 NTU fallback operational flag; effective disinfection may be compromised": "supérieur au seuil opérationnel de secours de 5 NTU ; l’efficacité de la désinfection peut être compromise",
    "January": "janvier",
    "February": "février",
    "March": "mars",
    "April": "avril",
    "May": "mai",
    "June": "juin",
    "July": "juillet",
    "August": "août",
    "September": "septembre",
    "October": "octobre",
    "November": "novembre",
    "December": "décembre"
  };

  Object.keys(critical).forEach(function (key) {
    dictionary[key] = critical[key];
  });

  var phrases = Object.keys(dictionary)
    .filter(function (key) {
      return key.length >= 4 && /[A-Za-z]/.test(key) && !/^https?:|^\//.test(key);
    })
    .sort(function (a, b) {
      return b.length - a.length;
    });
  var translatedValues = typeof WeakMap === "function" ? new WeakMap() : null;

  function translate(value) {
    var original = String(value == null ? "" : value);
    var trimmed = original.trim();
    if (!trimmed || !/[A-Za-z]/.test(trimmed)) return original;
    if (dictionary[trimmed]) {
      return original.replace(trimmed, dictionary[trimmed]);
    }
    var result = original;
    phrases.some(function (english) {
      if (result.indexOf(english) === -1) return false;
      result = result.split(english).join(dictionary[english]);
      return false;
    });
    result = result.replace(
      /^All (\d+) recognized markers fall within their displayed (?:reference ranges|plage de références)\. This does not confirm overall health\. Verify every range-source label against the original report and discuss symptoms, missing markers, and retest timing with your healthcare provider\.$/,
      "Les $1 marqueurs reconnus se situent dans les plages de référence affichées. Cela ne confirme pas l’état de santé général. Vérifiez chaque plage et sa source dans le rapport original, puis discutez avec votre professionnel de santé des symptômes, des marqueurs manquants et du calendrier de contrôle."
    );
    result = result.replace(
      /(\d+) weeks?, (\d+) days? by calendar estimate/g,
      "$1 semaines, $2 jours selon l’estimation calendaire"
    );
    result = result.replace(
      /(\d+) drink (entry|entries)\b/g,
      function (_match, count) {
        return count + (count === "1" ? " entrée de boisson" : " entrées de boisson");
      }
    );
    result = result.replace(
      /The logged total is ([\d,.]+) mL (above|below) the entered clinician-provided target\. This is arithmetic only; do not change a clinical fluid plan without the prescribing team\./g,
      function (_match, amount, direction) {
        return "Le total enregistré est " + amount + " mL "
          + (direction === "above" ? "au-dessus" : "en dessous")
          + " de l’objectif fourni par le clinicien. Il s’agit uniquement d’arithmétique ; ne modifiez pas un plan hydrique clinique sans l’équipe qui l’a prescrit.";
      }
    );
    result = result.replace(
      /(At or above|Below) the selected ([\d.]+) population reference/g,
      function (_match, band, threshold) {
        return (band === "At or above" ? "À la hauteur ou au-dessus de" : "En dessous de")
          + " la référence de population sélectionnée de " + threshold;
      }
    );
    result = result.replace(
      /The entered readings produce ratios from ([\d.]+) to ([\d.]+)\./g,
      "Les mesures saisies produisent des rapports de $1 à $2."
    );
    [
      ["January", "janvier"], ["February", "février"], ["March", "mars"],
      ["April", "avril"], ["May", "mai"], ["June", "juin"],
      ["July", "juillet"], ["August", "août"], ["September", "septembre"],
      ["October", "octobre"], ["November", "novembre"], ["December", "décembre"]
    ].forEach(function (month) {
      result = result.replace(
        new RegExp("(\\b\\d{1,2}\\s+)" + month[0] + "(\\s+\\d{4}\\b)", "g"),
        "$1" + month[1] + "$2"
      );
    });
    result = result.replace(/(\d{4})\s+to\s+(\d)/g, "$1 au $2");
    result = result.replace(/\bAfroOutils\b/g, "AfroTools");
    return result;
  }

  function skip(node) {
    var parent = node && node.parentElement;
    return !parent || /^(SCRIPT|STYLE|CODE|PRE|NOSCRIPT|TEXTAREA)$/.test(parent.tagName)
      || Boolean(parent.closest("[data-no-fr-health-translate]"));
  }

  function translateTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE || skip(node)) return;
    var parent = node.parentElement;
    if (parent && parent.tagName === "A" && /^\/[a-z0-9][^\s]*$/i.test(String(node.nodeValue || "").trim())) return;
    if (translatedValues && translatedValues.get(node) === node.nodeValue) return;
    var translated = translate(node.nodeValue);
    if (translated !== node.nodeValue) {
      if (translatedValues) translatedValues.set(node, translated);
      node.nodeValue = translated;
    } else if (translatedValues) {
      translatedValues.delete(node);
    }
  }

  function translateElement(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return;
    ["aria-label", "placeholder", "title", "alt"].forEach(function (name) {
      if (!element.hasAttribute(name)) return;
      var original = element.getAttribute(name);
      var translated = translate(original);
      if (translated !== original) element.setAttribute(name, translated);
    });
    if (element.tagName === "INPUT" && /^(button|submit|reset)$/.test(element.type || "")) {
      element.value = translate(element.value);
    }
    Array.prototype.forEach.call(element.childNodes, function (child) {
      if (child.nodeType === Node.TEXT_NODE) translateTextNode(child);
      else if (child.nodeType === Node.ELEMENT_NODE) translateElement(child);
    });
  }

  function repairMedicalDynamicCopy() {
    var root = document.getElementById("resultsContainer");
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      var value = String(node.nodeValue || "");
      var repaired = value
        .replace(/COMPLETE BLOOD COUNT \(CBC\)/g, "NUMÉRATION FORMULE SANGUINE (NFS)")
        .replace(/COMPLETE BLOOD COUNT/g, "NUMÉRATION FORMULE SANGUINE")
        .replace(/\bNORMAL\b/g, "DANS LA PLAGE")
        .replace(
          /Laboratory range used\. This range was parsed from the same line as the result\. Check it against the original report\./g,
          "Plage du laboratoire utilisée. Cette plage a été extraite de la même ligne que le résultat ; vérifiez-la dans le rapport original."
        );
      if (repaired !== value) node.nodeValue = repaired;
    }
    document.documentElement.setAttribute("data-fr-health-medical-repair", "complete");
  }

  function init() {
    document.documentElement.setAttribute("data-fr-health-runtime-version", "wave3-deep-2");
    translateElement(document.body);
    repairMedicalDynamicCopy();
    document.documentElement.setAttribute("data-fr-health-ready", "true");
    var sweepTimer = null;
    var observer = new MutationObserver(function (records) {
      records.forEach(function (record) {
        if (record.type === "characterData") translateTextNode(record.target);
        Array.prototype.forEach.call(record.addedNodes || [], function (node) {
          if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
          else if (node.nodeType === Node.ELEMENT_NODE) translateElement(node);
        });
      });
      repairMedicalDynamicCopy();
      if (sweepTimer) window.clearTimeout(sweepTimer);
      sweepTimer = window.setTimeout(function () {
        sweepTimer = null;
        translateElement(document.body);
        repairMedicalDynamicCopy();
      }, 20);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

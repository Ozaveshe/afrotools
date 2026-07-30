(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.EducationRouteEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const routes = Object.freeze({
    nigeria: {
      owner: "JAMB et l’établissement visé",
      source: "https://eligibility.jamb.gov.ng/",
      steps: ["Vérifier le programme et la combinaison de matières dans JAMB IBASS", "Relever la méthode de sélection actuelle de l’établissement", "Confirmer les dates, documents et frais dans le portail officiel"]
    },
    kenya: {
      owner: "KUCCPS et l’établissement visé",
      source: "https://students.kuccps.net/programmes/",
      steps: ["Relever le code exact du programme KUCCPS", "Confirmer la note moyenne et les matières minimales", "Vérifier le cycle, la date limite et le reçu officiel"]
    },
    "south-africa": {
      owner: "L’université visée et, si nécessaire, le NBT",
      source: "https://www.education.gov.za/Curriculum/NationalSeniorCertificate%28NSC%29Examinations/FAQsonExams.aspx",
      steps: ["Vérifier le niveau général NSC", "Relever la méthode APS propre à l’université", "Confirmer matières, NBT, documents et date limite"]
    },
    ghana: {
      owner: "L’établissement visé et la GTEC",
      source: "https://gtec.edu.gh/unrecognised-institutions/",
      steps: ["Vérifier le statut de l’établissement et du programme", "Relever les matières et la méthode d’agrégat publiées", "Confirmer le cycle, les documents, frais et portail"]
    },
    zimbabwe: {
      owner: "L’université visée et la ZIMCHE",
      source: "https://zimche.ac.zw/higher-education-institutions/",
      steps: ["Vérifier le statut auprès de la ZIMCHE", "Relever les exigences O-Level et A-Level du programme", "Confirmer l’admission, les documents, frais et date limite"]
    }
  });

  function plan(input) {
    input = input || {};
    const country = String(input.country || "");
    const route = routes[country];
    const programme = String(input.programme || "").trim();
    const institution = String(input.institution || "").trim();
    if (!route) return { ok: false, error: "Choisissez un pays pris en charge." };
    if (!programme || !institution) return { ok: false, error: "Indiquez le programme et l’établissement visés." };
    const checked = input.requirementsChecked === "yes";
    const gaps = checked ? route.steps.slice(1) : route.steps.slice();
    return {
      ok: true,
      country,
      programme,
      institution,
      owner: route.owner,
      source: route.source,
      steps: route.steps.slice(),
      gaps,
      stepCount: route.steps.length,
      gapCount: gaps.length,
      boundary: "Cette feuille ne prédit ni éligibilité, ni admission, ni place."
    };
  }

  return { routes, plan };
});

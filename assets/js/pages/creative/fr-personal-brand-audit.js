(() => {
  "use strict";
  const actions = {
    LinkedIn: ["LinkedIn", "Ajoutez à votre profil un projet récent et demandez à un ancien collègue une recommandation liée à ce travail."],
    "Social Media": ["Réseaux sociaux", "Choisissez le réseau que consulte votre public. Publiez un exemple concret de votre travail et notez les questions reçues."],
    "Digital / SEO": ["Présence dans les moteurs de recherche", "Créez ou actualisez une page de portfolio avec votre nom, votre spécialité et un exemple de réalisation."],
    "Content Creation": ["Création de contenu", "Transformez une difficulté rencontrée au travail en un court article. Décrivez la méthode et le résultat."],
    "Offline Reputation": ["Réputation hors ligne", "Proposez une démonstration de votre travail à une association professionnelle ou à un groupe local."],
    Credentials: ["Formation et certifications", "Recensez les compétences demandées dans votre domaine et choisissez une preuve de maîtrise à présenter dans votre portfolio."]
  };
  const form = document.getElementById("brand-form");
  const results = document.getElementById("brand-results");
  const report = document.getElementById("brand-report");
  const format = new Intl.NumberFormat("fr", { maximumFractionDigits: 1 });
  function clearReport() {
    results.hidden = true;
    report.textContent = "";
  }
  form.addEventListener("input", clearReport);
  form.addEventListener("change", clearReport);
  form.addEventListener("reset", clearReport);
  form.addEventListener("submit", event => {
    event.preventDefault();
    const scores = window.AfroTools.PersonalBrandAuditEngine.calculate(Object.fromEntries(new FormData(form)));
    const [priority, action] = actions[scores.weakest.name];
    report.textContent = [
      "Score : " + scores.total + "/100 · Note " + scores.grade, "",
      ...scores.categories.map(category => actions[category.name][0] + " : " + format.format(category.score) + "/" + category.max),
      "", "Priorité : " + priority, "Cette semaine : " + action,
      "Dans un mois : refaites l’audit et comparez cet axe avec le bilan téléchargé."
    ].join("\n");
    results.hidden = false;
    results.querySelector("h2").focus();
  });
  document.getElementById("brand-download").addEventListener("click", () => {
    if (!report.textContent) return;
    const url = URL.createObjectURL(new Blob([report.textContent], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "audit-marque-personnelle.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  });
})();

window.AfroWidgets = window.AfroWidgets || {};
window.AfroWidgets.IELTS = function (root, options = {}) {
  const fr = root.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr";
  const label = (english, french) => fr ? french : english;
  const number = new Intl.NumberFormat(fr ? "fr" : "en", {maximumFractionDigits: 3});
  const form = document.createElement("form");
  form.style.cssText = "display:grid;gap:12px;color:inherit;font:inherit";
  function field(title, optional) {
    const wrapper = document.createElement("label");
    wrapper.textContent = title;
    const select = document.createElement("select");
    select.className = "aw-select";
    select.style.cssText = "display:block;width:100%;min-height:44px";
    select.add(new Option(optional ? label("No target", "Aucun objectif") : label("Choose a band", "Choisir une note"), ""));
    for (let half = 0; half <= 18; half++) select.add(new Option(number.format(half / 2), String(half / 2)));
    wrapper.append(select);
    form.append(wrapper);
    return select;
  }
  const title = document.createElement("h2");
  title.textContent = label("IELTS overall band", "Note globale IELTS");
  form.append(title);
  const skills = [label("Listening","Compréhension orale"), label("Reading","Compréhension écrite"), label("Writing","Expression écrite"), label("Speaking","Expression orale")];
  const scores = skills.map(skill => field(skill, false));
  const goal = field(label("Overall band required by your programme (optional)", "Note globale exigée par votre formation (facultatif)"), true);
  const minimum = field(label("Required minimum in every skill (optional)", "Note minimale exigée par compétence (facultatif)"), true);
  const submit = document.createElement("button");
  submit.className = "aw-btn";
  submit.textContent = label("Calculate overall band", "Calculer la note globale");
  const result = document.createElement("output");
  result.setAttribute("aria-live","polite");
  const source = document.createElement("a");
  source.href = "https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail";
  source.target = "_blank";
  source.rel = "noopener";
  source.textContent = label("IELTS scoring and rounding rules", "Barème et règles d’arrondi de l’IELTS");
  form.append(submit, result, source);
  form.addEventListener("input", () => { result.textContent = ""; });
  form.addEventListener("submit", event => {
    event.preventDefault();
    const missing = scores.find(item => item.value === "");
    if (missing) {
      result.textContent = label("Choose a band for each of the four skills.", "Choisissez une note pour chacune des quatre compétences.");
      missing.focus();
      return;
    }
    const values = scores.map(item => Number(item.value));
    const average = values.reduce((sum, value) => sum + value, 0) / 4;
    const band = Math.round(2 * average) / 2;
    const lines = [label("Overall band", "Note globale") + " " + number.format(band), label("Average", "Moyenne") + " " + number.format(average)];
    if (goal.value !== "") lines.push(band >= Number(goal.value) ? label("Overall target met", "Objectif global atteint") : label("Below overall target", "Objectif global à atteindre"));
    if (minimum.value !== "") {
      const below = skills.filter((_, index) => values[index] < Number(minimum.value));
      lines.push(below.length ? label("Below the required minimum", "Sous le minimum demandé") + " — " + below.join(", ") : label("All skills meet the minimum", "Minimum atteint dans chaque compétence"));
    }
    result.textContent = lines.join(" · ");
  });
  root.replaceChildren(form);
  if (options.footerHTML) form.insertAdjacentHTML("afterend", options.footerHTML);
};

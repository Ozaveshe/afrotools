'use strict';

const fs = require('node:fs');
const path = require('node:path');

const route = '/fr/agriculture/calendrier-recolte-mauritanie/';
function render() {
  return `<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Calendrier de récolte en Mauritanie | AfroTools</title>
<meta name="description" content="Estimez la date et la fenêtre de récolte en Mauritanie selon la culture, la zone, la variété et le mode d’arrosage.">
<link rel="canonical" href="https://afrotools.com${route}">
<meta name="afrotools-country-id" content="MR">
<style>*{box-sizing:border-box}body{margin:0;background:#f5f8f3;color:#20382b;font:1.05rem/1.55 system-ui,sans-serif}main{max-width:46rem;margin:auto;padding:1rem}a{color:#16553c}section,form{padding:1rem;border:1px solid #aec2b4;background:white;border-radius:.5rem;margin:1rem 0}h1,h2{line-height:1.2}label{display:block;margin:.6rem 0;font-weight:600}input,select,button{font:inherit;max-width:100%;padding:.6rem}input,select{display:block;width:100%;border:1px solid #708b77;border-radius:.3rem;background:white;color:inherit}button{border:0;border-radius:.3rem;background:#205839;color:white;cursor:pointer}#error{color:#972e14}#window{font-weight:650}a:focus-visible,input:focus-visible,select:focus-visible,button:focus-visible{outline:3px solid #986b00;outline-offset:2px}</style>
<script defer src="/data/agriculture/mr-agri-data.js"></script><script defer src="/data/agriculture/crop-growth-data.js"></script><script defer src="/engines/country-harvest-date-engine.js"></script><script defer src="/assets/js/pages/fr-mauritania-harvest.js"></script>
</head><body><main>
<nav aria-label="Navigation"><a href="/fr/agriculture/harvest-date/">Estimateur général de récolte</a> · <a href="/agriculture/harvest-date/mauritania" lang="en" hreflang="en">English</a></nav>
<h1>Calendrier de récolte en Mauritanie</h1><p>À partir de votre date de semis, estimez une fenêtre de récolte pour votre parcelle. Le calcul tient compte de la zone de culture, de la précocité de la variété et de l’irrigation.</p>
<noscript>Activez JavaScript pour effectuer le calcul sur cet appareil.</noscript>
<form id="harvest"><label>Culture<select id="crop" required></select></label><label>Zone de culture<select id="region" required></select></label>
<label>Date de semis<input type="date" id="planting" required></label>
<label>Variété<select id="variety"><option value="early">Précoce</option><option value="medium" selected>Intermédiaire</option><option value="late">Tardive</option></select></label>
<label>Mode de culture<select id="irrigation"><option value="rainfed">Pluvial</option><option value="irrigated">Irrigué</option></select></label>
<p id="error" role="alert"></p><button type="submit" disabled>Estimer la récolte</button></form>
<section id="result" hidden><h2 id="result-title" tabindex="-1">Votre récolte estimée</h2><p id="summary"></p><p id="window"></p><p id="detail"></p></section>
<section><h2>Comment interpréter cette fenêtre</h2><p>La fenêtre s’étend sur les sept jours qui précèdent et les sept jours qui suivent la date estimée. Le modèle utilise une température moyenne de référence pour chaque zone et une durée de croissance de la variété. Il ne tient pas compte de la météo observée dans votre champ. Avant de récolter, vérifiez la maturité des plantes et les indications propres à votre variété.</p><p>Le mil, le sorgho, le riz, le niébé et le maïs disposent d’un cycle de croissance dans ce modèle. Le palmier dattier n’y dispose pas d’une durée de maturité exploitable.</p></section>
</main></body></html>
`;
}

function sync(root, check) {
  const file = path.join(root, route.slice(1), 'index.html');
  const content = render();
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content) return;
  if (check) throw new Error('La page française de récolte en Mauritanie doit être régénérée.');
  fs.mkdirSync(path.dirname(file), {recursive:true});
  fs.writeFileSync(file, content);
}
module.exports = {sync};

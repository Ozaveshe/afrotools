const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const englishAppPath = path.join(ROOT, "tools/creator-hashtags/app.html");
const frenchDir = path.join(ROOT, "fr/tools/hashtags-createur");
const frenchAppPath = path.join(frenchDir, "app.html");
const frenchIndexPath = path.join(frenchDir, "index.html");
const englishIndexPath = path.join(ROOT, "tools/creator-hashtags/index.html");

function replaceOnce(source, search, replacement, label) {
  if (!source.includes(search)) throw new Error(`Missing ${label}`);
  return source.replace(search, replacement);
}

let english = fs.readFileSync(englishAppPath, "utf8");
if (!english.includes("/assets/js/pages/creative/creator-hashtags-app-controller.js")) {
english = english.replace(
  /<script>\s*!function\(\) \{[\s\S]*?\}\(\);\s*<\/script>\s*(?=<script src="\/assets\/js\/pages\/day9-creative-expanded-safety\.js)/,
  '<script src="/assets/js/pages/creative/creator-hashtags-app-controller.js"></script>\n'
);
english = english.replace(/href="style\.css\?v=bc1cebe6"/, 'href="/tools/creator-hashtags/style.css?v=bc1cebe6"');
english = replaceOnce(
  english,
  '<link rel="canonical" href="https://afrotools.com/tools/creator-hashtags/app">',
  '<link rel="canonical" href="https://afrotools.com/tools/creator-hashtags/app">\n' +
    '<link rel="alternate" hreflang="en" href="https://afrotools.com/tools/creator-hashtags/app">\n' +
    '<link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/tools/hashtags-createur/app">\n' +
    '<link rel="alternate" hreflang="x-default" href="https://afrotools.com/tools/creator-hashtags/app">',
  "English app canonical"
);
english = replaceOnce(
  english,
  '      <label class="cht-input-label" style="margin-top:16px">Platform</label>\n      <div class="cht-platforms" id="platformPills"></div>',
  '      <label class="cht-input-label" style="margin-top:16px">Platform</label>\n' +
    '      <div class="cht-platforms" id="platformPills"></div>\n' +
    '      <label class="cht-input-label" for="generationMode" style="margin-top:16px">Generation mode</label>\n' +
    '      <select class="cht-input-field" id="generationMode"><option value="local">Local, deterministic (recommended)</option><option value="ai">Optional AI assist</option></select>\n' +
    '      <label id="aiConsentWrap" class="cht-consent" hidden><input type="checkbox" id="aiConsent"> I agree to send the topic and selected platform to AfroTools AI. The exact topic above will leave this browser.</label>',
  "generation controls"
);
english = replaceOnce(
  english,
  '    <div class="cht-output" id="outputArea"></div>',
  '    <div class="cht-output" id="outputArea" aria-live="polite"></div>\n' +
    '    <div class="cht-mix-actions" id="exportActions" hidden><button type="button" class="cht-action-btn" id="downloadTxt">Download TXT</button><button type="button" class="cht-action-btn" id="downloadJson">Download JSON</button></div>',
  "output area"
);
english = replaceOnce(
  english,
  '<div id="historyPanel" class="cht-history-overlay" style="display:none">\n    <div class="cht-history-panel">',
  '<div id="historyPanel" class="cht-history-overlay" role="dialog" aria-modal="true" aria-labelledby="historyTitle" style="display:none">\n    <div class="cht-history-panel">',
  "history dialog"
);
english = english
  .replace("<h3>History</h3>", '<h3 id="historyTitle">Local history</h3>')
  .replace('onclick="document.getElementById(\'historyPanel\').style.display=\'none\'"', 'id="historyClose" aria-label="Close history"');
english = replaceOnce(
  english,
  "    .cht-loading-dot:nth-child(3) { animation-delay:.4s; }",
  "    .cht-loading-dot:nth-child(3) { animation-delay:.4s; }\n" +
    "    .cht-consent{display:flex;align-items:flex-start;gap:9px;margin-top:12px;color:var(--cht-muted);font-size:.82rem;line-height:1.45}.cht-consent[hidden]{display:none}.cht-consent input{margin-top:3px}.cht-history-item{display:grid;width:100%;text-align:left;color:inherit}.cht-input-field[id=generationMode]{min-height:48px}.cht-tag{font-family:inherit}",
  "accessibility styles"
);
}
if (!english.includes('<meta property="og:title"')) {
  english = english.replace(
    '<meta name="robots" content="noindex, follow">',
    '<meta name="robots" content="noindex, follow">\n' +
      '  <meta name="description" content="Create, compare, copy and export platform-specific hashtag sets locally.">\n' +
      '  <meta property="og:title" content="TagWave hashtag workspace | AfroTools">\n' +
      '  <meta property="og:description" content="Build platform-specific hashtag sets locally, with optional consent-based AI assist.">\n' +
      '  <meta property="og:image" content="https://afrotools.com/assets/img/tools/creator-hashtags.webp">'
  );
}
fs.writeFileSync(englishAppPath, english);

let englishIndex = fs.readFileSync(englishIndexPath, "utf8");
const landingReplacements = [
  ["Generate strategic hashtag sets for every platform. Trending, niche, and community tags with reach-level categorization. Built for African creators.", "Generate three locally created hashtag sets for Instagram, TikTok, X, LinkedIn or YouTube, then copy or export them. Built for African creators."],
  ["The right tags, every time. 3 strategic sets per generation — broad reach, niche play, and community tags. Copy, paste, post.", "Build three practical hashtag sets locally, compare them, then copy or export your choice."],
  ["AI-powered hashtag generator with strategic reach-level categorization. Built for African content creators across Instagram, TikTok, X, LinkedIn, and YouTube.", "Local-first hashtag generator with optional consent-based AI assistance for African content creators across Instagram, TikTok, X, LinkedIn, and YouTube."],
  ["Stop guessing which hashtags work. TagWave generates 3 strategic sets per post — broad reach, niche play, and community tags — with reach-level categorization so you know exactly what each tag does. Built for African creators.", "Build three useful hashtag sets per post — balanced, niche, and African community — then verify each tag on the platform before publishing."],
  ["Each generation gives you Broad Reach (max impressions), Niche Play (higher engagement), and Community (local authority). Different strategies, one generation.", "Each local generation gives you Balanced Reach, Niche Focus, and African Community sets. They are starting points, not reach predictions."],
  ["<h3>Reach-Level Color Coding</h3>", "<h3>Strategy Color Coding</h3>"],
  ["Red for high reach (1M+ posts), yellow for mid (100K-1M), green for niche (&lt;100K). See your strategy at a glance.", "Red marks broader tags, yellow marks focused tags, and green marks community or niche tags. These labels are not live post counts."],
  ["See your reach balance, count vs. platform max, and copy with one tap.", "See the mix by strategy, compare it with the platform maximum, and copy with one tap."],
  ["Red = High (1M+ posts, broad discovery), Yellow = Mid (100K-1M, sweet spot), Green = Niche (under 100K, community engagement).", "Red = broader, Yellow = focused, Green = niche or community. These are strategy labels, not live platform counts."],
  ["The builder shows your count, platform max, and reach balance.", "The builder shows your count, platform maximum, and strategy mix."],
  ["Yes. 5 generations per day free. All platforms, all features included.", "Yes. Local generation, copying, TXT export and JSON export are free and do not require an account."]
];
for (const [from, to] of landingReplacements) englishIndex = englishIndex.split(from).join(to);
fs.writeFileSync(englishIndexPath, englishIndex);

const replacements = [
  ['lang="en"', 'lang="fr"'],
  ["TagWave Workspace | AfroTools", "Espace Hashtag Créateur | AfroTools"],
  ["https://afrotools.com/tools/creator-hashtags/app", "https://afrotools.com/fr/tools/hashtags-createur/app"],
  ['hreflang="en" href="https://afrotools.com/fr/tools/hashtags-createur/app"', 'hreflang="en" href="https://afrotools.com/tools/creator-hashtags/app"'],
  ['hreflang="fr" href="https://afrotools.com/fr/tools/hashtags-createur/app"', 'hreflang="fr" href="https://afrotools.com/fr/tools/hashtags-createur/app"'],
  ['href="index.html" class="cht-app-logo"', 'href="/fr/tools/hashtags-createur/" class="cht-app-logo"'],
  ['title="History"', 'title="Historique" aria-label="Ouvrir l’historique"'],
  ["What's the post about?", "Quel est le sujet de la publication ?"],
  ["Behind the scenes of a Lagos wedding photoshoot...", "Coulisses d’une séance photo de mariage à Dakar…"],
  [">Platform</label>", ">Plateforme</label>"],
  [">Generation mode</label>", ">Mode de génération</label>"],
  [">Local, deterministic (recommended)</option>", ">Local et déterministe (recommandé)</option>"],
  [">Optional AI assist</option>", ">Assistance IA facultative</option>"],
  ["I agree to send the topic and selected platform to AfroTools AI. The exact topic above will leave this browser.", "J’accepte d’envoyer le sujet et la plateforme sélectionnée à AfroTools AI. Le sujet exact ci-dessus quittera ce navigateur."],
  ["Generate Tags", "Générer les hashtags"],
  ["High Reach (1M+)", "Portée large"],
  ["Mid Reach (100Kâ€“1M)", "Portée intermédiaire"],
  ["Niche (&lt;100K)", "Niche ciblée"],
  ["Download TXT", "Télécharger TXT"],
  ["Download JSON", "Télécharger JSON"],
  ["BUILD YOUR OWN MIX", "COMPOSER VOTRE MÉLANGE"],
  ["0 of 30 max", "0 / 30 maximum"],
  ["Tap tags above to add/remove from your mix", "Sélectionnez les hashtags ci-dessus pour composer votre mélange."],
  ["Tap tags above to start building", "Sélectionnez des hashtags ci-dessus."],
  ["You've exceeded the recommended tag count for this platform", "Vous dépassez le nombre conseillé pour cette plateforme."],
  ["Copy Mix", "Copier le mélange"],
  ["> Clear</button>", "> Effacer</button>"],
  ['id="historyTitle">Local history', 'id="historyTitle">Historique local'],
  ['aria-label="Close history"', 'aria-label="Fermer l’historique"']
];
let frenchApp = english;
for (const [from, to] of replacements) frenchApp = frenchApp.split(from).join(to);
frenchApp = frenchApp
  .replace(
    /<link\b[^>]*\bhref=["']https:\/\/fonts\.googleapis\.com\/[^"']*["'][^>]*>\s*/gi,
    ""
  )
  .replace(
    /<link\b[^>]*\brel=["']preconnect["'][^>]*\bhref=["']https:\/\/fonts\.(?:googleapis|gstatic)\.com["'][^>]*>\s*/gi,
    ""
  )
  .replace(
    /<script\b[^>]*\bsrc=["']\/assets\/js\/supabase-auth\.js[^"']*["'][^>]*><\/script>\s*/gi,
    ""
  )
  .replace(/<link rel="alternate" hreflang="(?:en|fr|x-default)"[^>]+>\s*/g, "")
  .replace(
    "</head>",
    '<link rel="alternate" hreflang="en" href="https://afrotools.com/tools/creator-hashtags/app">\n' +
      '<link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/tools/hashtags-createur/app">\n' +
      '<link rel="alternate" hreflang="x-default" href="https://afrotools.com/tools/creator-hashtags/app">\n</head>'
  )
  .replace("Mid Reach (100Kâ€“1M)", "Portée intermédiaire")
  .replace("&#128465; Clear", "&#128465; Effacer")
  .replace("TagWave hashtag workspace | AfroTools", "Espace Hashtag Créateur | AfroTools")
  .replace("Create, compare, copy and export platform-specific hashtag sets locally.", "Créez, comparez, copiez et exportez localement des jeux de hashtags adaptés à chaque plateforme.")
  .replace("Build platform-specific hashtag sets locally, with optional consent-based AI assist.", "Composez des jeux de hashtags localement, avec une assistance IA facultative soumise à accord.");
fs.mkdirSync(frenchDir, { recursive: true });
fs.writeFileSync(frenchAppPath, frenchApp);

const index = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Générateur de hashtags créateur par plateforme | AfroTools</title>
  <meta name="description" content="Créez gratuitement trois jeux de hashtags adaptés à Instagram, TikTok, X, LinkedIn ou YouTube. Mode local, export TXT et JSON, sans promesse de portée.">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="Générateur de hashtags créateur | AfroTools">
  <meta property="og:description" content="Composez des jeux larges, de niche et communautaires en français, puis exportez-les localement.">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:url" content="https://afrotools.com/fr/tools/hashtags-createur/">
  <meta property="og:image" content="https://afrotools.com/assets/img/tools/creator-hashtags.webp">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="https://afrotools.com/fr/tools/hashtags-createur/">
  <link rel="alternate" hreflang="en" href="https://afrotools.com/tools/creator-hashtags/">
  <link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/tools/hashtags-createur/">
  <link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/hashtag-za-maudhui/">
  <link rel="alternate" hreflang="x-default" href="https://afrotools.com/tools/creator-hashtags/">
  <link rel="stylesheet" href="/assets/css/global.min.css?v=0ff6e9dc">
  <link rel="stylesheet" href="/assets/css/tokens.min.css?v=f987f2a8">
  <link rel="stylesheet" href="/assets/css/theme-dark.min.css?v=e7def0f1">
  <style>
    body{background:#f7f9fc;color:#13213c}.fr-hash{max-width:1040px;margin:auto;padding:92px 20px 64px}.fr-hash__hero{display:grid;grid-template-columns:1.25fr .75fr;gap:28px;align-items:center}.fr-hash h1{font-size:clamp(2.25rem,7vw,4.4rem);line-height:1.02;margin:.25rem 0 1rem}.fr-hash p{font-size:1.05rem;line-height:1.7;color:#475569}.fr-hash__eyebrow{font-weight:800;color:#be123c;text-transform:uppercase;letter-spacing:.08em}.fr-hash__cta{display:inline-flex;background:#be123c;color:white;padding:14px 20px;border-radius:10px;text-decoration:none;font-weight:800;min-height:48px;align-items:center}.fr-hash__panel,.fr-hash__card{background:white;border:1px solid #dce3ed;border-radius:16px;padding:24px}.fr-hash__tags{display:flex;flex-wrap:wrap;gap:8px}.fr-hash__tags span{padding:7px 12px;border-radius:99px;background:#fff1f2;color:#9f1239;font-weight:700}.fr-hash__grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:42px}.fr-hash__note{margin-top:24px;padding:16px;border-left:4px solid #0f766e;background:#ecfdf5}.fr-hash a:focus-visible{outline:3px solid #2563eb;outline-offset:3px}@media(max-width:720px){.fr-hash__hero,.fr-hash__grid{grid-template-columns:1fr}.fr-hash{padding-top:72px}}[data-theme=dark] body{background:#09090b;color:#fff}[data-theme=dark] .fr-hash__panel,[data-theme=dark] .fr-hash__card{background:#18181b;border-color:#3f3f46}[data-theme=dark] .fr-hash p{color:#d4d4d8}
  </style>
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"SoftwareApplication","name":"Générateur de hashtags créateur","applicationCategory":"BusinessApplication","operatingSystem":"Web","inLanguage":"fr","url":"https://afrotools.com/fr/tools/hashtags-createur/","description":"Générateur local de jeux de hashtags par plateforme, avec export TXT et JSON.","isBasedOn":"https://afrotools.com/tools/creator-hashtags/","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},"image":"https://afrotools.com/assets/img/tools/creator-hashtags.webp","provider":{"@type":"Organization","name":"AfroTools","url":"https://afrotools.com/"}}</script>
  <script>(function(){try{var t=localStorage.getItem("aft_theme");var d=matchMedia("(prefers-color-scheme:dark)").matches;document.documentElement.setAttribute("data-theme",t==="dark"||t==="light"?t:d?"dark":"light")}catch(_){}}())</script>
</head>
<body>
  <div id="navbar"></div>
  <main class="fr-hash">
    <nav aria-label="Fil d’Ariane"><a href="/fr/">Accueil</a> / <a href="/fr/creative/">Création</a> / Hashtags</nav>
    <section class="fr-hash__hero">
      <div>
        <div class="fr-hash__eyebrow">Stratégie de contenu locale</div>
        <h1>Des hashtags utiles, sans promesse de portée</h1>
        <p>Décrivez votre publication, choisissez la plateforme et obtenez trois approches : portée équilibrée, niche et communauté africaine. Le mode recommandé fonctionne entièrement dans votre navigateur.</p>
        <a class="fr-hash__cta" href="/fr/tools/hashtags-createur/app">Créer mes jeux de hashtags</a>
      </div>
      <aside class="fr-hash__panel" aria-label="Aperçu">
        <h2>Exemple de mélange</h2>
        <div class="fr-hash__tags"><span>#CreateursAfricains</span><span>#DakarCreative</span><span>#ConseilsCreateurs</span><span>#PhotoMariage</span></div>
        <p>Les niveaux de portée sont des catégories de stratégie, pas des données en direct.</p>
      </aside>
    </section>
    <div class="fr-hash__grid">
      <section class="fr-hash__card"><h2>Résultat contrôlable</h2><p>Sélectionnez les tags utiles, composez votre mélange et copiez-le en un geste.</p></section>
      <section class="fr-hash__card"><h2>Exports ouverts</h2><p>Téléchargez le résultat en TXT lisible ou en JSON structuré, sans compte.</p></section>
      <section class="fr-hash__card"><h2>IA facultative</h2><p>Le mode local est utilisé par défaut. L’envoi du sujet à l’IA demande un accord explicite.</p></section>
    </div>
    <p class="fr-hash__note"><strong>À vérifier avant publication :</strong> recherchez chaque hashtag dans la plateforme, confirmez sa pertinence et retirez les tags interdits ou détournés. AfroTools ne prédit pas la portée.</p>
  </main>
  <div id="footer"></div>
  <script src="/assets/js/components/navbar.min.js?v=65f906d7"></script>
  <script src="/assets/js/components/footer.min.js?v=fb81e3cd"></script>
  <script src="/assets/js/lib/dark-mode.js?v=5cb64ba3" defer></script>
  <script src="/assets/js/lazy-analytics.js?v=630f8a7d" defer></script>
</body>
</html>
`;
fs.writeFileSync(frenchIndexPath, index);
console.log("Built English shared controller owner and native French Creator Hashtags surfaces.");

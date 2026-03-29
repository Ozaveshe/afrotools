#!/usr/bin/env bash
# Generate French versions of ALL agriculture pages (637 total)
# Uses English directory structure: /fr/agriculture/[english-subdir]/
# Each page embeds the English tool via iframe

set -uo pipefail

BASE="C:/Users/Oza/Documents/afrotools"
EN_DIR="$BASE/agriculture"
FR_DIR="$BASE/fr/agriculture"

mkdir -p "$FR_DIR"

# ── Title translations (english-slug → French title) ──
declare -A FR_TITLE=(
  ["cassava-processing"]="Transformation du manioc"
  ["cocoa-tracker"]="Suivi du cours du cacao"
  ["coffee-calculator"]="Calculateur café"
  ["commodity-prices"]="Prix des matières premières agricoles"
  ["cooperative-calculator"]="Calculateur coopérative"
  ["crop-insurance"]="Assurance récolte"
  ["crop-rotation"]="Planificateur de rotation des cultures"
  ["crop-yield"]="Calculateur de rendement"
  ["export-docs"]="Documents d'exportation agricole"
  ["farm-budget"]="Budget d'exploitation agricole"
  ["farm-loans"]="Prêts agricoles"
  ["farm-payroll"]="Gestion paie agricole"
  ["farm-profit"]="Calculateur profit exploitation"
  ["farm-size-converter"]="Convertisseur de superficie agricole"
  ["fertilizer"]="Calculateur d'engrais"
  ["fish-farming"]="Calculateur pisciculture"
  ["greenhouse"]="Calculateur serre"
  ["harvest-date"]="Calendrier de récolte"
  ["input-prices"]="Prix des intrants agricoles"
  ["irrigation"]="Calculateur d'irrigation"
  ["livestock-feed"]="Calculateur alimentation bétail"
  ["pesticide-dosage"]="Calculateur dosage pesticide"
  ["poultry-roi"]="ROI aviculture"
  ["seed-rate"]="Calculateur taux de semis"
  ["soil-ph"]="Testeur pH du sol"
  ["storage-loss"]="Calculateur pertes de stockage"
  ["tractor-calculator"]="Calculateur tracteur"
  ["vaccination-schedule"]="Calendrier de vaccination"
  ["warehouse-receipt"]="Récépissé d'entrepôt"
)

# ── Short French descriptions per tool ──
declare -A FR_DESC=(
  ["cassava-processing"]="Calculez la rentabilité de la transformation du manioc en garri, farine, amidon ou chips avec les coûts locaux."
  ["cocoa-tracker"]="Suivez le cours du cacao en temps réel et analysez les tendances de prix pour les producteurs africains."
  ["coffee-calculator"]="Calculez les coûts de production et la rentabilité de votre exploitation caféière en Afrique."
  ["commodity-prices"]="Comparez les prix des matières premières agricoles dans les marchés africains en temps réel."
  ["cooperative-calculator"]="Évaluez les avantages financiers d'une coopérative agricole : partage des coûts et revenus."
  ["crop-insurance"]="Estimez les primes et couvertures d'assurance récolte adaptées aux cultures africaines."
  ["crop-rotation"]="Planifiez la rotation optimale de vos cultures pour maximiser les rendements et la santé du sol."
  ["crop-yield"]="Estimez les rendements de vos cultures par zone agro-écologique avec des données locales."
  ["export-docs"]="Générez les documents nécessaires à l'exportation de produits agricoles depuis l'Afrique."
  ["farm-budget"]="Créez un budget complet pour votre exploitation agricole avec les coûts et revenus prévisionnels."
  ["farm-loans"]="Comparez les options de prêts agricoles et calculez les mensualités avec les taux locaux."
  ["farm-payroll"]="Gérez la paie de vos employés agricoles avec les charges sociales et réglementations locales."
  ["farm-profit"]="Calculez le profit net de votre exploitation : revenus, coûts de production et marge."
  ["farm-size-converter"]="Convertissez entre hectares, acres, arpents et unités de mesure locales africaines."
  ["fertilizer"]="Calculez les besoins en engrais NPK pour vos cultures avec les produits et prix locaux."
  ["fish-farming"]="Estimez la rentabilité de votre projet piscicole : tilapia, poisson-chat et plus."
  ["greenhouse"]="Calculez les coûts d'installation et d'exploitation d'une serre en Afrique."
  ["harvest-date"]="Déterminez les dates optimales de semis et de récolte pour vos cultures et votre région."
  ["input-prices"]="Comparez les prix des intrants agricoles : semences, engrais, pesticides par pays."
  ["irrigation"]="Calculez les besoins en eau d'irrigation selon la culture, le sol et le climat local."
  ["livestock-feed"]="Calculez les rations alimentaires optimales pour votre bétail avec les ingrédients locaux."
  ["pesticide-dosage"]="Calculez le dosage exact de pesticide selon la culture, la surface et le produit."
  ["poultry-roi"]="Calculez le retour sur investissement de votre élevage avicole : poulets de chair ou pondeuses."
  ["seed-rate"]="Calculez la quantité optimale de semences par hectare selon la culture et les conditions."
  ["soil-ph"]="Analysez le pH de votre sol et obtenez des recommandations d'amendement pour vos cultures."
  ["storage-loss"]="Estimez les pertes post-récolte et les coûts de stockage pour optimiser votre chaîne."
  ["tractor-calculator"]="Calculez les coûts d'acquisition et d'exploitation d'un tracteur pour votre exploitation."
  ["vaccination-schedule"]="Planifiez le calendrier de vaccination de votre bétail selon les normes locales."
  ["warehouse-receipt"]="Générez des récépissés d'entrepôt pour le financement garanti par vos stocks agricoles."
)

# ── Country name translations ──
declare -A COUNTRY_FR=(
  ["algeria"]="Algérie" ["angola"]="Angola" ["benin"]="Bénin" ["botswana"]="Botswana"
  ["burkina-faso"]="Burkina Faso" ["burundi"]="Burundi" ["cabo-verde"]="Cap-Vert"
  ["cameroon"]="Cameroun" ["central-african-republic"]="République centrafricaine"
  ["chad"]="Tchad" ["comoros"]="Comores" ["congo-brazzaville"]="Congo-Brazzaville"
  ["cote-d-ivoire"]="Côte d'Ivoire" ["djibouti"]="Djibouti" ["dr-congo"]="RD Congo"
  ["egypt"]="Égypte" ["equatorial-guinea"]="Guinée équatoriale" ["eritrea"]="Érythrée"
  ["eswatini"]="Eswatini" ["ethiopia"]="Éthiopie" ["gabon"]="Gabon" ["gambia"]="Gambie"
  ["ghana"]="Ghana" ["guinea"]="Guinée" ["guinea-bissau"]="Guinée-Bissau"
  ["kenya"]="Kenya" ["lesotho"]="Lesotho" ["liberia"]="Libéria" ["libya"]="Libye"
  ["madagascar"]="Madagascar" ["malawi"]="Malawi" ["mali"]="Mali"
  ["mauritania"]="Mauritanie" ["mauritius"]="Maurice" ["morocco"]="Maroc"
  ["mozambique"]="Mozambique" ["namibia"]="Namibie" ["niger"]="Niger"
  ["nigeria"]="Nigéria" ["rwanda"]="Rwanda" ["sao-tome-and-principe"]="São Tomé-et-Príncipe"
  ["senegal"]="Sénégal" ["seychelles"]="Seychelles" ["sierra-leone"]="Sierra Leone"
  ["somalia"]="Somalie" ["south-africa"]="Afrique du Sud" ["south-sudan"]="Soudan du Sud"
  ["sudan"]="Soudan" ["tanzania"]="Tanzanie" ["togo"]="Togo" ["tunisia"]="Tunisie"
  ["uganda"]="Ouganda" ["zambia"]="Zambie" ["zimbabwe"]="Zimbabwe"
)

# ── Counter ──
COUNT=0

# ── Generate the agriculture hub index page ──
generate_hub_index() {
  local out="$FR_DIR/index.html"
  cat > "$out" << 'HUBEOF'
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="view-transition" content="same-origin">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Outils Agricoles pour l'Afrique &mdash; 630+ Calculateurs | AfroTools</title>
<meta name="description" content="Calculateurs agricoles gratuits pour les 54 pays africains. Rendement des cultures, besoins en engrais NPK, irrigation, budget d'exploitation et analyse de rentabilité avec des données locales.">
<link rel="canonical" href="https://afrotools.com/fr/agriculture/">
<link rel="alternate" hreflang="en" href="https://afrotools.com/agriculture/">
<link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/agriculture/">
<link rel="alternate" hreflang="x-default" href="https://afrotools.com/agriculture/">
<meta property="og:title" content="Outils Agricoles pour l'Afrique &mdash; AfroTools">
<meta property="og:description" content="Calculateurs gratuits de rendement, engrais et irrigation pour les 54 pays africains avec des prix et données agronomiques locaux.">
<meta property="og:url" content="https://afrotools.com/fr/agriculture/">
<meta property="og:type" content="website">
<meta property="og:image" content="https://afrotools.com/assets/img/og/cat-agriculture.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="AfroTools">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Outils Agricoles pour l'Afrique &mdash; AfroTools">
<meta name="twitter:description" content="Calculateurs gratuits de rendement, engrais et irrigation pour les 54 pays africains.">
<meta name="twitter:image" content="https://afrotools.com/assets/img/og/cat-agriculture.png">
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"WebPage","name":"Outils Agricoles pour l'Afrique","url":"https://afrotools.com/fr/agriculture/","description":"Calculateurs agricoles gratuits pour les 54 pays africains.","inLanguage":"fr","author":{"@type":"Organization","name":"AfroTools","url":"https://afrotools.com"},"breadcrumb":{"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Accueil","item":"https://afrotools.com/fr/"},{"@type":"ListItem","position":2,"name":"Agriculture","item":"https://afrotools.com/fr/agriculture/"}]}}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap"></noscript>
<link rel="stylesheet" href="/assets/css/tokens.min.css">
<link rel="stylesheet" href="/assets/css/global.min.css">
<link rel="stylesheet" href="/assets/css/agriculture.css">
<script src="/assets/js/components/navbar.min.js" defer></script>
<script src="/assets/js/components/footer.min.js" defer></script>
</head>
<body>
<afro-navbar active="tools"></afro-navbar>
<iframe src="/agriculture/" style="width:100%;min-height:100vh;border:none" loading="lazy" title="Outils Agricoles pour l'Afrique"></iframe>
<afro-footer></afro-footer>
</body>
</html>
HUBEOF
  COUNT=$((COUNT + 1))
  echo "  [hub] fr/agriculture/index.html"
}

# ── Generate a sub-tool index page ──
generate_tool_index() {
  local slug="$1"
  local title="${FR_TITLE[$slug]}"
  local desc="${FR_DESC[$slug]}"
  local outdir="$FR_DIR/$slug"
  local outfile="$outdir/index.html"

  mkdir -p "$outdir"

  cat > "$outfile" << EOF
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="view-transition" content="same-origin">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} &mdash; Afrique | AfroTools</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="https://afrotools.com/fr/agriculture/${slug}/">
<link rel="alternate" hreflang="en" href="https://afrotools.com/agriculture/${slug}/">
<link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/agriculture/${slug}/">
<link rel="alternate" hreflang="x-default" href="https://afrotools.com/agriculture/${slug}/">
<meta property="og:title" content="${title} &mdash; AfroTools">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="https://afrotools.com/fr/agriculture/${slug}/">
<meta property="og:type" content="website">
<meta property="og:image" content="https://afrotools.com/assets/img/og-default.png">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="AfroTools">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title} &mdash; AfroTools">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="https://afrotools.com/assets/img/og-default.png">
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"CollectionPage","name":"${title}","url":"https://afrotools.com/fr/agriculture/${slug}/","description":"${desc}","inLanguage":"fr","author":{"@type":"Organization","name":"AfroTools","url":"https://afrotools.com"}}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap"></noscript>
<link rel="stylesheet" href="/assets/css/tokens.min.css">
<link rel="stylesheet" href="/assets/css/global.min.css">
<link rel="stylesheet" href="/assets/css/agriculture.css">
<script src="/assets/js/components/navbar.min.js" defer></script>
<script src="/assets/js/components/footer.min.js" defer></script>
</head>
<body>
<afro-navbar active="tools"></afro-navbar>
<iframe src="/agriculture/${slug}/" style="width:100%;min-height:100vh;border:none" loading="lazy" title="${title}"></iframe>
<afro-footer></afro-footer>
</body>
</html>
EOF
  COUNT=$((COUNT + 1))
}

# ── Generate a country page ──
generate_country_page() {
  local slug="$1"
  local country_slug="$2"
  local title="${FR_TITLE[$slug]}"
  local country_name="${COUNTRY_FR[$country_slug]:-$country_slug}"
  local desc="${FR_DESC[$slug]}"
  local outfile="$FR_DIR/$slug/${country_slug}.html"

  cat > "$outfile" << EOF
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="view-transition" content="same-origin">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} &mdash; ${country_name} | AfroTools</title>
<meta name="description" content="${desc} Données pour ${country_name}.">
<link rel="canonical" href="https://afrotools.com/fr/agriculture/${slug}/${country_slug}/">
<link rel="alternate" hreflang="en" href="https://afrotools.com/agriculture/${slug}/${country_slug}/">
<link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/agriculture/${slug}/${country_slug}/">
<link rel="alternate" hreflang="x-default" href="https://afrotools.com/agriculture/${slug}/${country_slug}/">
<meta property="og:title" content="${title} &mdash; ${country_name} | AfroTools">
<meta property="og:description" content="${desc} Données pour ${country_name}.">
<meta property="og:url" content="https://afrotools.com/fr/agriculture/${slug}/${country_slug}/">
<meta property="og:type" content="website">
<meta property="og:image" content="https://afrotools.com/assets/img/og-default.png">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="AfroTools">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title} &mdash; ${country_name} | AfroTools">
<meta name="twitter:description" content="${desc} Données pour ${country_name}.">
<meta name="twitter:image" content="https://afrotools.com/assets/img/og-default.png">
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"WebApplication","name":"${title} — ${country_name}","url":"https://afrotools.com/fr/agriculture/${slug}/${country_slug}/","applicationCategory":"UtilityApplication","operatingSystem":"All","description":"${desc} ${country_name}.","inLanguage":"fr","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},"author":{"@type":"Organization","name":"AfroTools","url":"https://afrotools.com"}}
</script>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"AfroTools","item":"https://afrotools.com/fr/"},{"@type":"ListItem","position":2,"name":"Agriculture","item":"https://afrotools.com/fr/agriculture/"},{"@type":"ListItem","position":3,"name":"${title}","item":"https://afrotools.com/fr/agriculture/${slug}/"},{"@type":"ListItem","position":4,"name":"${country_name}","item":"https://afrotools.com/fr/agriculture/${slug}/${country_slug}/"}]}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap"></noscript>
<link rel="stylesheet" href="/assets/css/tokens.min.css">
<link rel="stylesheet" href="/assets/css/global.min.css">
<link rel="stylesheet" href="/assets/css/agriculture.css">
<script src="/assets/js/components/navbar.min.js" defer></script>
<script src="/assets/js/components/footer.min.js" defer></script>
</head>
<body>
<afro-navbar active="tools"></afro-navbar>
<iframe src="/agriculture/${slug}/${country_slug}/" style="width:100%;min-height:100vh;border:none" loading="lazy" title="${title} — ${country_name}"></iframe>
<afro-footer></afro-footer>
</body>
</html>
EOF
  COUNT=$((COUNT + 1))
}

# ══════════════════════════════════════════
#  MAIN — loop through every English file
# ══════════════════════════════════════════

echo "=== Generating French agriculture pages ==="

# 1. Hub index
generate_hub_index

# 2. Each sub-tool
for tool_dir in "$EN_DIR"/*/; do
  slug=$(basename "$tool_dir")

  # Skip if not in our translation map
  if [[ -z "${FR_TITLE[$slug]+x}" ]]; then
    echo "  [skip] $slug (no translation mapping)"
    continue
  fi

  # Generate tool index
  generate_tool_index "$slug"
  echo "  [tool] fr/agriculture/$slug/index.html"

  # Generate country pages
  local_count=0
  for page in "$tool_dir"*.html; do
    [[ ! -f "$page" ]] && continue
    filename=$(basename "$page")
    [[ "$filename" == "index.html" ]] && continue
    [[ "$filename" == _* ]] && continue

    country_slug="${filename%.html}"
    generate_country_page "$slug" "$country_slug"
    local_count=$((local_count + 1))
  done
  echo "  [countries] $slug: $local_count country pages"
done

echo ""
echo "=== Done! Created $COUNT French agriculture pages ==="

#!/usr/bin/env bash
# Generate all 54 farm-payroll country pages
# Run from: /agriculture/farm-payroll/
# Usage: bash _gen_pages.sh

set -e
DIR="$(cd "$(dirname "$0")" && pwd)"

# Format: "CODE|name|flag|slug|paye_link|paye_code"
COUNTRIES=(
  "NG|Nigeria|🇳🇬|nigeria|/nigeria/ng-salary-tax.html|ng-salary-tax"
  "GH|Ghana|🇬🇭|ghana|/ghana/gh-paye.html|gh-paye"
  "CI|Cote d'Ivoire|🇨🇮|cote-d-ivoire|/cote-divoire/ci-paye.html|ci-paye"
  "SN|Senegal|🇸🇳|senegal|/senegal/sn-paye.html|sn-paye"
  "ML|Mali|🇲🇱|mali|/mali/ml-paye.html|ml-paye"
  "BF|Burkina Faso|🇧🇫|burkina-faso|/burkina-faso/bf-paye.html|bf-paye"
  "NE|Niger|🇳🇪|niger|/niger/ne-paye.html|ne-paye"
  "GN|Guinea|🇬🇳|guinea|/guinea/gn-paye.html|gn-paye"
  "BJ|Benin|🇧🇯|benin|/benin/bj-paye.html|bj-paye"
  "TG|Togo|🇹🇬|togo|/togo/tg-paye.html|tg-paye"
  "SL|Sierra Leone|🇸🇱|sierra-leone|/sierra-leone/sl-paye.html|sl-paye"
  "LR|Liberia|🇱🇷|liberia|/liberia/lr-paye.html|lr-paye"
  "MR|Mauritania|🇲🇷|mauritania|/mauritania/mr-paye.html|mr-paye"
  "GM|Gambia|🇬🇲|gambia|/gambia/gm-paye.html|gm-paye"
  "GW|Guinea-Bissau|🇬🇼|guinea-bissau|/guinea-bissau/gw-paye.html|gw-paye"
  "CV|Cabo Verde|🇨🇻|cabo-verde|/cape-verde/cv-paye.html|cv-paye"
  "KE|Kenya|🇰🇪|kenya|/kenya/ke-paye.html|ke-paye"
  "ET|Ethiopia|🇪🇹|ethiopia|/ethiopia/et-paye.html|et-paye"
  "TZ|Tanzania|🇹🇿|tanzania|/tanzania/tz-paye.html|tz-paye"
  "UG|Uganda|🇺🇬|uganda|/uganda/ug-paye.html|ug-paye"
  "RW|Rwanda|🇷🇼|rwanda|/rwanda/rw-paye.html|rw-paye"
  "BI|Burundi|🇧🇮|burundi|/burundi/bi-paye.html|bi-paye"
  "SO|Somalia|🇸🇴|somalia|/somalia/so-paye.html|so-paye"
  "DJ|Djibouti|🇩🇯|djibouti|/djibouti/dj-paye.html|dj-paye"
  "ER|Eritrea|🇪🇷|eritrea|/eritrea/er-paye.html|er-paye"
  "SS|South Sudan|🇸🇸|south-sudan|/south-sudan/ss-paye.html|ss-paye"
  "CD|DR Congo|🇨🇩|dr-congo|/dr-congo/cd-paye.html|cd-paye"
  "CM|Cameroon|🇨🇲|cameroon|/cameroon/cm-paye.html|cm-paye"
  "CG|Congo (Brazzaville)|🇨🇬|congo-brazzaville|/congo/cg-paye.html|cg-paye"
  "GA|Gabon|🇬🇦|gabon|/gabon/ga-paye.html|ga-paye"
  "GQ|Equatorial Guinea|🇬🇶|equatorial-guinea|/eq-guinea/gq-paye.html|gq-paye"
  "CF|Central African Republic|🇨🇫|central-african-republic|/car/cf-paye.html|cf-paye"
  "TD|Chad|🇹🇩|chad|/chad/td-paye.html|td-paye"
  "ST|Sao Tome and Principe|🇸🇹|sao-tome-and-principe|/sao-tome/st-paye.html|st-paye"
  "ZA|South Africa|🇿🇦|south-africa|/south-africa/za-paye.html|za-paye"
  "MZ|Mozambique|🇲🇿|mozambique|/mozambique/mz-paye.html|mz-paye"
  "ZM|Zambia|🇿🇲|zambia|/zambia/zm-paye.html|zm-paye"
  "ZW|Zimbabwe|🇿🇼|zimbabwe|/zimbabwe/zw-paye.html|zw-paye"
  "MW|Malawi|🇲🇼|malawi|/malawi/mw-paye.html|mw-paye"
  "AO|Angola|🇦🇴|angola|/angola/ao-paye.html|ao-paye"
  "NA|Namibia|🇳🇦|namibia|/namibia/na-paye.html|na-paye"
  "BW|Botswana|🇧🇼|botswana|/botswana/bw-paye.html|bw-paye"
  "LS|Lesotho|🇱🇸|lesotho|/lesotho/ls-paye.html|ls-paye"
  "SZ|Eswatini|🇸🇿|eswatini|/eswatini/sz-paye.html|sz-paye"
  "EG|Egypt|🇪🇬|egypt|/egypt/eg-paye.html|eg-paye"
  "MA|Morocco|🇲🇦|morocco|/morocco/ma-paye.html|ma-paye"
  "DZ|Algeria|🇩🇿|algeria|/algeria/dz-paye.html|dz-paye"
  "TN|Tunisia|🇹🇳|tunisia|/tunisia/tn-paye.html|tn-paye"
  "LY|Libya|🇱🇾|libya|/libya/ly-paye.html|ly-paye"
  "SD|Sudan|🇸🇩|sudan|/sudan/sd-paye.html|sd-paye"
  "MG|Madagascar|🇲🇬|madagascar|/madagascar/mg-paye.html|mg-paye"
  "MU|Mauritius|🇲🇺|mauritius|/mauritius/mu-paye.html|mu-paye"
  "SC|Seychelles|🇸🇨|seychelles|/seychelles/sc-paye.html|sc-paye"
  "KM|Comoros|🇰🇲|comoros|/comoros/km-paye.html|km-paye"
)

generate_page() {
  local CODE="$1"
  local NAME="$2"
  local FLAG="$3"
  local SLUG="$4"
  local PAYE_LINK="$5"
  local FILE="$DIR/$SLUG.html"

  cat > "$FILE" << HTMLEOF
<!DOCTYPE html>
<html data-chat-bundle="/assets/js/bundles/chat.bd27dfaf.min.js" lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Farm Worker Payroll Calculator for ${NAME} &mdash; Wages &amp; Deductions | AfroTools</title>
<meta name="description" content="Calculate farm worker wages, deductions, and take-home pay in ${NAME}. Agricultural minimum wage, pension, health insurance, and PAYE for permanent, casual, and seasonal farm workers.">
<link rel="canonical" href="https://afrotools.com/agriculture/farm-payroll/${SLUG}">

<meta property="og:title" content="${NAME} Farm Worker Payroll Calculator &mdash; AfroTools">
<meta property="og:description" content="Calculate farm worker wages, deductions and take-home pay in ${NAME}. Covers permanent, casual, seasonal and piece-rate workers.">
<meta property="og:url" content="https://afrotools.com/agriculture/farm-payroll/${SLUG}">
<meta property="og:type" content="website">
<meta property="og:image" content="https://afrotools.com/assets/img/og-default.png">
<meta property="og:locale" content="en_US">
<meta property="og:site_name" content="AfroTools">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${NAME} Farm Worker Payroll Calculator &mdash; AfroTools">
<meta name="twitter:description" content="Calculate farm worker wages and take-home pay in ${NAME}. Agricultural minimum wage &amp; deductions.">
<meta name="twitter:image" content="https://afrotools.com/assets/img/og-default.png">

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "${NAME} Farm Worker Payroll Calculator",
  "url": "https://afrotools.com/agriculture/farm-payroll/${SLUG}",
  "applicationCategory": "UtilityApplication",
  "operatingSystem": "All",
  "description": "Calculate farm worker wages, deductions and take-home pay in ${NAME}. Covers permanent, casual, seasonal and piece-rate workers with minimum wage compliance.",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "author": { "@type": "Organization", "name": "AfroTools", "url": "https://afrotools.com" }
}
<\/script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "AfroTools", "item": "https://afrotools.com/" },
    { "@type": "ListItem", "position": 2, "name": "Agriculture", "item": "https://afrotools.com/agriculture/" },
    { "@type": "ListItem", "position": 3, "name": "Farm Worker Payroll Calculator", "item": "https://afrotools.com/agriculture/farm-payroll/" },
    { "@type": "ListItem", "position": 4, "name": "${NAME}", "item": "https://afrotools.com/agriculture/farm-payroll/${SLUG}" }
  ]
}
<\/script>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap">
<link rel="stylesheet" href="/assets/css/tokens.min.css">
<link rel="stylesheet" href="/assets/css/global.min.css">
<script src="/assets/js/components/navbar.min.js" defer><\/script>
<script src="/assets/js/components/footer.min.js" defer><\/script>

<style>
:root {
  --calc-accent: #0062CC;
  --calc-accent-rgb: 0, 122, 255;
  --calc-accent-dark: #0063D1;
  --calc-accent-light: #E8F2FF;
  --calc-accent-pale: #EBF4FF;
}
*, *::before, *::after { box-sizing: border-box; }
body { font-family: 'DM Sans', sans-serif; background: #F8F9FA; color: #1A1A2E; margin: 0; }

.tool-hero { background: #0A1628; padding: 36px 0 32px; position: relative; overflow: hidden; }
.tool-hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 20% 50%, rgba(0,122,255,0.12) 0%, transparent 60%); pointer-events: none; }
.tool-hero .container { position: relative; z-index: 1; max-width: 1100px; margin: 0 auto; padding: 0 24px; }
.breadcrumb { font-size: 0.75rem; font-weight: 500; color: rgba(255,255,255,0.4); margin-bottom: 16px; }
.breadcrumb a { color: rgba(255,255,255,0.5); text-decoration: none; }
.breadcrumb a:hover { color: #fff; }
.breadcrumb span { margin: 0 6px; opacity: 0.4; }
.tool-hero h1 { font-size: clamp(1.6rem, 3vw, 2.2rem); font-weight: 800; color: #fff; margin: 0 0 8px; letter-spacing: -0.02em; }
.tool-hero h1 em { color: var(--calc-accent); font-style: normal; }
.tool-hero-sub { font-size: 0.875rem; color: rgba(255,255,255,0.65); max-width: 600px; line-height: 1.6; margin: 0 0 16px; }
.hero-badges { display: flex; flex-wrap: wrap; gap: 8px; }
.badge { padding: 4px 10px; border-radius: 100px; font-size: 0.72rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; }
.badge-blue { background: rgba(0,122,255,0.15); color: var(--calc-accent); }
.badge-grey { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.6); }

.tool-main { max-width: 1100px; margin: -20px auto 48px; padding: 0 24px; position: relative; z-index: 2; }

.card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin-bottom: 24px; }
.card-head { padding: 16px 22px; background: #F8FAFD; border-bottom: 1px solid #f1f5f9; border-radius: 10px 10px 0 0; display: flex; align-items: center; justify-content: space-between; }
.card-title { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #3D5A80; margin: 0; display: flex; align-items: center; gap: 6px; }
.card-body { padding: 22px; }
.card-toggle { background: none; border: 1px solid #CBD5E1; border-radius: 6px; padding: 4px 10px; font-size: 0.72rem; font-weight: 600; color: #64748b; cursor: pointer; }
.card-toggle:hover { background: #f1f5f9; }

.section-body { display: block; }
.section-body.collapsed { display: none; }

.field { margin-bottom: 16px; }
.field.full { grid-column: 1 / -1; }
.f-label-text { display: block; font-size: 0.75rem; font-weight: 700; color: #2D3A5A; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em; }
.f-label-hint { font-size: 0.7rem; font-weight: 400; color: #64748b; margin-left: 6px; text-transform: none; }
.f-input, .f-select { font-family: 'DM Sans', sans-serif; font-size: 0.9rem; padding: 11px 13px; border: 1.5px solid #CBD5E1; border-radius: 6px; background: #F4F7FA; color: #0f172a; outline: none; width: 100%; }
.f-input:focus, .f-select:focus { border-color: var(--calc-accent); background: #fff; box-shadow: 0 0 0 3px rgba(0,122,255,0.1); }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media(max-width:640px) { .form-grid { grid-template-columns: 1fr; } }

.cross-link { font-size: 0.75rem; color: var(--calc-accent); text-decoration: none; font-weight: 600; }
.cross-link:hover { text-decoration: underline; }

.hint-text { font-size: 0.72rem; color: #64748b; margin-top: 4px; line-height: 1.4; }

.calc-btn { width: 100%; padding: 14px; font-family: 'DM Sans', sans-serif; font-size: 0.88rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; background: var(--calc-accent); color: #fff; border: none; border-radius: 100px; cursor: pointer; margin-top: 8px; transition: filter 0.15s, transform 0.15s; }
.calc-btn:hover { filter: brightness(0.85); transform: translateY(-1px); }

.results-wrap { display: none; }
.results-wrap.on { display: block; animation: resultsFade 0.4s ease; }
@keyframes resultsFade { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }

.payslip-hero { text-align: center; padding: 28px 16px; border-radius: 10px 10px 0 0; background: linear-gradient(135deg, #0A3E1A 0%, #1a5e30 100%); }
.payslip-net { font-size: clamp(2rem, 5vw, 3rem); font-weight: 800; color: #fff; }
.payslip-label { font-size: 0.78rem; color: rgba(255,255,255,0.6); margin-top: 6px; }
.payslip-sub { font-size: 0.85rem; color: rgba(255,255,255,0.75); margin-top: 6px; }

.summary-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.summary-table tr td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; }
.summary-table .section-head td { font-weight: 700; font-size: 0.72rem; text-transform: uppercase; color: #3D5A80; background: #F8FAFD; padding: 10px 10px 6px; }
.summary-table .total-row td { font-weight: 800; border-top: 2px solid #e2e8f0; padding-top: 10px; }
.summary-table .indent { padding-left: 22px; color: #64748b; }
.summary-table .amount { text-align: right; font-weight: 600; }
.summary-table .pct { text-align: right; font-size: 0.72rem; color: #94a3b8; }
.positive-val { color: #16a34a; font-weight: 700; }
.negative-val { color: #ef4444; font-weight: 700; }

.metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin: 16px 0; }
.metric-card { background: #F8FAFD; border-radius: 8px; padding: 14px; text-align: center; }
.metric-val { font-size: 1.15rem; font-weight: 800; color: var(--calc-accent); }
.metric-label { font-size: 0.7rem; color: #64748b; margin-top: 3px; line-height: 1.3; }

.mw-check { padding: 12px 16px; border-radius: 8px; font-size: 0.82rem; font-weight: 600; margin: 12px 0; }
.mw-check.ok { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
.mw-check.warn { background: #fef9c3; border: 1px solid #fde047; color: #854d0e; }

.labor-law-box { background: #F8FAFD; border-radius: 8px; padding: 16px; margin-top: 12px; font-size: 0.82rem; line-height: 1.6; }
.labor-law-box strong { color: #2D3A5A; }

.cross-tools { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-top: 12px; }
.cross-tool-card { background: var(--calc-accent-pale); border: 1px solid var(--calc-accent-light); border-radius: 8px; padding: 12px; text-decoration: none; color: #1A1A2E; display: flex; align-items: center; gap: 10px; transition: box-shadow 0.2s; }
.cross-tool-card:hover { box-shadow: 0 4px 12px rgba(0,122,255,0.12); }
.cross-tool-icon { font-size: 1.4rem; flex-shrink: 0; }
.cross-tool-text { font-size: 0.8rem; }
.cross-tool-name { font-weight: 700; color: var(--calc-accent); }
.cross-tool-desc { color: #64748b; font-size: 0.72rem; margin-top: 2px; }

.sources-footer { font-size: 0.72rem; color: #94a3af; text-align: center; padding: 24px 0; line-height: 1.6; }

.collapsible-toggle { background: none; border: none; color: var(--calc-accent); font-size: 0.78rem; font-weight: 600; cursor: pointer; padding: 0; margin-top: 8px; }

@media print {
  .tool-hero, afro-navbar, afro-footer, .calc-btn, .card-toggle { display: none !important; }
  .results-wrap { display: block !important; }
  .section-body.collapsed { display: block !important; }
}
</style>
</head>

<body class="tool-page">
<afro-navbar theme="dark" active="tools"></afro-navbar>

<section class="tool-hero">
  <div class="container">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a><span>/</span>
      <a href="/agriculture/">Agriculture</a><span>/</span>
      <a href="/agriculture/farm-payroll/">Farm Worker Payroll</a><span>/</span>
      <span aria-current="page">${NAME}</span>
    </nav>
    <h1><span aria-hidden="true">${FLAG}</span> ${NAME} <em>Farm Worker Payroll Calculator</em></h1>
    <p class="tool-hero-sub">Calculate farm worker wages, deductions, and take-home pay in ${NAME}. Covers permanent staff, casual daily workers, seasonal harvesters, and piece-rate workers — with agricultural minimum wage compliance check.</p>
    <div class="hero-badges">
      <span class="badge badge-blue">&#128119; 4 Worker Types</span>
      <span class="badge badge-grey">&#128204; Min Wage Check</span>
      <span class="badge badge-grey">&#128176; Employer Cost</span>
      <span class="badge badge-grey">&#127760; Free</span>
    </div>
  </div>
</section>

<main class="tool-main">

<!-- SECTION 1: Worker Setup -->
<div class="card">
  <div class="card-head">
    <span class="card-title">&#128119; Section 1: Worker Setup</span>
  </div>
  <div class="card-body section-body" id="sec1Body">
    <div class="form-grid">
      <div class="field">
        <label class="f-label-text" for="selWorkerType">Worker Type</label>
        <select class="f-select" id="selWorkerType" onchange="onWorkerTypeChange()">
          <option value="permanent">Permanent / Full-time (monthly salary)</option>
          <option value="casual">Casual / Daily hire</option>
          <option value="seasonal">Seasonal (harvest workers)</option>
          <option value="piece_rate">Piece-rate / Task-based</option>
        </select>
      </div>
      <div class="field">
        <label class="f-label-text" for="inpNumWorkers">Number of Workers</label>
        <input class="f-input" id="inpNumWorkers" type="number" min="1" step="1" value="1">
        <div class="hint-text">Enter more than 1 to see total farm labour cost</div>
      </div>

      <!-- Permanent -->
      <div class="field full" id="fldPermanent">
        <label class="f-label-text" for="inpMonthlySalary">Monthly Gross Salary <span id="lblCurrency" class="f-label-hint"></span></label>
        <input class="f-input" id="inpMonthlySalary" type="number" min="0" step="1" value="0">
        <div class="hint-text" id="hintMinWage"></div>
      </div>

      <!-- Casual / Seasonal -->
      <div class="field" id="fldDailyRate" style="display:none;">
        <label class="f-label-text" for="inpDailyRate">Daily Rate <span id="lblCurrency2" class="f-label-hint"></span></label>
        <input class="f-input" id="inpDailyRate" type="number" min="0" step="1" value="0">
        <div class="hint-text" id="hintDailyMin"></div>
      </div>
      <div class="field" id="fldDaysWorked" style="display:none;">
        <label class="f-label-text" for="inpDaysWorked">Days Worked <span class="f-label-hint">(this month / season)</span></label>
        <input class="f-input" id="inpDaysWorked" type="number" min="1" max="31" step="1" value="26">
      </div>

      <!-- Piece rate -->
      <div class="field" id="fldRatePerUnit" style="display:none;">
        <label class="f-label-text" for="inpRatePerUnit">Rate per Unit <span id="lblCurrency3" class="f-label-hint"></span></label>
        <input class="f-input" id="inpRatePerUnit" type="number" min="0" step="0.01" value="0">
        <div class="hint-text" id="hintPieceRate"></div>
      </div>
      <div class="field" id="fldUnitsCompleted" style="display:none;">
        <label class="f-label-text" for="inpUnitsCompleted">Units Completed</label>
        <input class="f-input" id="inpUnitsCompleted" type="number" min="0" step="1" value="0">
      </div>

      <div class="field">
        <label class="f-label-text" for="inpOvertimeHours">Overtime Hours <span class="f-label-hint">(per month)</span></label>
        <input class="f-input" id="inpOvertimeHours" type="number" min="0" step="0.5" value="0">
      </div>
    </div>
  </div>
</div>

<!-- SECTION 2: In-Kind Benefits (collapsible) -->
<div class="card">
  <div class="card-head">
    <span class="card-title">&#127968; Section 2: In-Kind Benefits <span style="font-size:0.7rem;font-weight:400;color:#94a3b8;">(optional)</span></span>
    <button class="card-toggle" onclick="toggleSection('sec2Body', this)">Collapse</button>
  </div>
  <div class="card-body section-body" id="sec2Body">
    <div class="form-grid">
      <div class="field">
        <label class="f-label-text" for="inpHousingValue">Housing Value <span class="f-label-hint">(monthly, local currency)</span></label>
        <input class="f-input" id="inpHousingValue" type="number" min="0" step="1" value="0">
        <div class="hint-text">Enter estimated rental value of accommodation provided. Added to gross for deduction purposes.</div>
      </div>
      <div class="field">
        <label class="f-label-text" for="inpFoodValue">Food / Rations Value <span class="f-label-hint">(monthly, local currency)</span></label>
        <input class="f-input" id="inpFoodValue" type="number" min="0" step="1" value="0">
        <div class="hint-text">Value of meals or food rations provided to the worker.</div>
      </div>
    </div>
  </div>
</div>

<button class="calc-btn" onclick="runCalculation()">&#128204; Calculate Farm Payroll</button>

<!-- RESULTS -->
<div class="results-wrap" id="resultsWrap">

  <div class="card">
    <div class="payslip-hero" id="payslipHero">
      <div class="payslip-net" id="resNetPay"></div>
      <div class="payslip-label">Net Take-Home Pay (per worker)</div>
      <div class="payslip-sub" id="resGrossSub"></div>
    </div>
    <div class="card-body">
      <h3 style="font-size:0.72rem;font-weight:700;text-transform:uppercase;color:#3D5A80;margin:0 0 12px;">Payslip Breakdown</h3>
      <table class="summary-table" id="payslipTable"></table>
    </div>
  </div>

  <div class="card">
    <div class="card-head"><span class="card-title">&#127970; Employer Cost Summary</span></div>
    <div class="card-body">
      <div class="metrics-grid" id="metricsGrid"></div>
      <table class="summary-table" id="employerTable"></table>
    </div>
  </div>

  <div class="card">
    <div class="card-head"><span class="card-title">&#128204; Minimum Wage Compliance</span></div>
    <div class="card-body">
      <div id="mwCheckBox"></div>
      <div class="labor-law-box" id="laborLawBox"></div>
    </div>
  </div>

  <div class="card">
    <div class="card-head"><span class="card-title">&#128279; Related Tools</span></div>
    <div class="card-body">
      <div class="cross-tools" id="crossTools"></div>
    </div>
  </div>

</div><!-- /results-wrap -->

<p class="sources-footer">Data sources: ILO NATLEX database &bull; national labour ministry gazettes &bull; AfroTools research (2024). For formal tax computation, use the PAYE calculator linked above. Minimum wages are approximate and subject to annual revision.</p>

</main>

<afro-footer></afro-footer>

<script src="/data/agriculture/farm-payroll-data.js"><\/script>
<script src="/engines/farm-payroll-engine.js"><\/script>
<script>
(function () {
  'use strict';

  var COUNTRY_CODE = '${CODE}';
  var COUNTRY_NAME = '${NAME}';
  var CD = (window.AfroTools.FarmPayrollData || {})[COUNTRY_CODE] || {};
  var ENG = window.AfroTools.FarmPayrollEngine || {};
  var sym = CD.symbol || '';
  var currency = CD.currency || '';

  // Initialise UI
  function init() {
    // Set currency labels
    var lbls = document.querySelectorAll('[id^="lblCurrency"]');
    for (var i = 0; i < lbls.length; i++) { lbls[i].textContent = '(' + currency + ')'; }

    // Min wage hints
    var mwHint = document.getElementById('hintMinWage');
    if (mwHint) {
      var mw = CD.agriMinWage_monthly || CD.nationalMinWage_monthly;
      if (mw) {
        mwHint.textContent = 'Agricultural minimum wage: ' + sym + mw.toLocaleString() + '/month';
      } else {
        mwHint.textContent = 'No legislated minimum wage in ' + COUNTRY_NAME;
      }
    }
    var dHint = document.getElementById('hintDailyMin');
    if (dHint && CD.agriMinWage_daily) {
      dHint.textContent = 'Agricultural daily minimum: ' + sym + CD.agriMinWage_daily.toLocaleString();
    }
    var prHint = document.getElementById('hintPieceRate');
    if (prHint && CD.typicalDailyRate) {
      prHint.textContent = 'Typical daily earnings: ' + sym + (CD.typicalDailyRate.low || 0).toLocaleString() + ' – ' + sym + (CD.typicalDailyRate.high || 0).toLocaleString();
    }

    onWorkerTypeChange();
  }

  window.onWorkerTypeChange = function () {
    var wt = document.getElementById('selWorkerType').value;
    var show = function (id, v) { var el = document.getElementById(id); if (el) el.style.display = v ? '' : 'none'; };
    show('fldPermanent',   wt === 'permanent');
    show('fldDailyRate',   wt === 'casual' || wt === 'seasonal' || wt === 'piece_rate');
    show('fldDaysWorked',  wt === 'casual' || wt === 'seasonal');
    show('fldRatePerUnit', wt === 'piece_rate');
    show('fldUnitsCompleted', wt === 'piece_rate');

    // Re-label daily rate field for piece rate
    var dailyLabel = document.querySelector('#fldDailyRate .f-label-text');
    if (dailyLabel) {
      if (wt === 'piece_rate') {
        dailyLabel.innerHTML = 'Rate per Unit <span class="f-label-hint">(' + currency + ')</span>';
      } else {
        dailyLabel.innerHTML = 'Daily Rate <span class="f-label-hint">(' + currency + ')</span>';
      }
    }
  };

  window.toggleSection = function (id, btn) {
    var el = document.getElementById(id);
    if (!el) return;
    var collapsed = el.classList.toggle('collapsed');
    btn.textContent = collapsed ? 'Expand' : 'Collapse';
  };

  window.runCalculation = function () {
    var wt = document.getElementById('selWorkerType').value;
    var inputs = {
      workerType: wt,
      grossPay:        parseFloat(document.getElementById('inpMonthlySalary').value) || parseFloat(document.getElementById('inpDailyRate').value) || 0,
      daysWorked:      parseFloat(document.getElementById('inpDaysWorked') ? document.getElementById('inpDaysWorked').value : 26) || 26,
      ratePerUnit:     parseFloat(document.getElementById('inpRatePerUnit') ? document.getElementById('inpRatePerUnit').value : 0) || 0,
      unitsCompleted:  parseFloat(document.getElementById('inpUnitsCompleted') ? document.getElementById('inpUnitsCompleted').value : 0) || 0,
      overtimeHours:   parseFloat(document.getElementById('inpOvertimeHours').value) || 0,
      inKindHousing:   parseFloat(document.getElementById('inpHousingValue').value) || 0,
      inKindFood:      parseFloat(document.getElementById('inpFoodValue').value) || 0,
      numWorkers:      parseInt(document.getElementById('inpNumWorkers').value) || 1
    };

    // For piece_rate, grossPay = ratePerUnit * unitsCompleted (set before passing)
    if (wt === 'piece_rate') {
      inputs.grossPay = 0; // engine handles piece_rate
    }

    if (!ENG.calculate) { alert('Calculator not loaded. Please refresh.'); return; }
    var r = ENG.calculate(inputs, CD);
    if (r.error) { alert(r.message); return; }

    renderResults(r, inputs);
  };

  function renderResults(r, inputs) {
    var wrap = document.getElementById('resultsWrap');
    wrap.classList.add('on');
    wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Payslip hero
    document.getElementById('resNetPay').textContent = r.fNet;
    document.getElementById('resGrossSub').textContent = 'Gross: ' + r.fGross + '  |  Deductions: ' + r.fDeductions;

    // Payslip table
    var pt = document.getElementById('payslipTable');
    var ptRows = '';
    ptRows += '<tr class="section-head"><td colspan="3">Earnings</td></tr>';
    ptRows += '<tr><td class="indent">Base Pay</td><td class="amount">' + r.sym + fmt(r.baseGross) + '</td><td class="pct"></td></tr>';
    if (r.overtimePay > 0) ptRows += '<tr><td class="indent">Overtime Pay</td><td class="amount">' + r.sym + fmt(r.overtimePay) + '</td><td class="pct"></td></tr>';
    if (r.inKindValue > 0) ptRows += '<tr><td class="indent">In-Kind Benefits</td><td class="amount">' + r.sym + fmt(r.inKindValue) + '</td><td class="pct"></td></tr>';
    ptRows += '<tr class="total-row"><td>Gross Pay</td><td class="amount">' + r.fGross + '</td><td class="pct">100%</td></tr>';

    if (r.deductions && r.deductions.length) {
      ptRows += '<tr class="section-head"><td colspan="3">Deductions</td></tr>';
      r.deductions.forEach(function (d) {
        var pct = r.grossForDeductions > 0 ? (d.amount / r.grossForDeductions * 100).toFixed(1) + '%' : '';
        ptRows += '<tr><td class="indent">' + d.name + ' (' + d.rate + '%)</td><td class="amount negative-val">-' + r.sym + fmt(d.amount) + '</td><td class="pct">' + pct + '</td></tr>';
      });
      ptRows += '<tr><td class="indent" style="color:#94a3b8;font-size:0.75rem;" colspan="3">PAYE Income Tax: <a href="' + (r.payeLink || '#') + '" style="color:var(--calc-accent);">Calculate with ' + COUNTRY_NAME + ' PAYE Calculator &rarr;</a></td></tr>';
    } else {
      ptRows += '<tr><td colspan="3" style="color:#64748b;font-size:0.82rem;padding:10px;">No statutory deductions apply to informal farm workers in ' + COUNTRY_NAME + ' (or farm workers are typically exempt). <a href="' + (r.payeLink || '#') + '" style="color:var(--calc-accent);">Check PAYE &rarr;</a></td></tr>';
    }
    ptRows += '<tr class="total-row"><td><strong>Net Take-Home</strong></td><td class="amount positive-val">' + r.fNet + '</td><td class="pct"></td></tr>';
    pt.innerHTML = ptRows;

    // Metrics
    var mg = document.getElementById('metricsGrid');
    mg.innerHTML = ''
      + '<div class="metric-card"><div class="metric-val">' + r.fEmployerCost + '</div><div class="metric-label">Total Cost per Worker / Month</div></div>'
      + '<div class="metric-card"><div class="metric-val">' + r.fFarmMonthlyCost + '</div><div class="metric-label">Farm Monthly Labour Cost (' + r.numWorkers + ' workers)</div></div>'
      + '<div class="metric-card"><div class="metric-val">' + r.fFarmAnnualCost + '</div><div class="metric-label">Farm Annual Labour Cost</div></div>'
      + (r.typicalDailyRate ? '<div class="metric-card"><div class="metric-val">' + r.sym + (r.typicalDailyRate.mid || 0).toLocaleString() + '</div><div class="metric-label">Typical Daily Rate in ' + COUNTRY_NAME + '</div></div>' : '');

    // Employer table
    var et = document.getElementById('employerTable');
    var etRows = '<tr class="section-head"><td colspan="2">Employer Cost Breakdown</td></tr>';
    etRows += '<tr><td>Employee Gross Pay</td><td class="amount">' + r.fGross + '</td></tr>';
    if (r.employerContributions) {
      r.employerContributions.forEach(function (ec) {
        etRows += '<tr><td class="indent">' + ec.name + '</td><td class="amount">' + r.sym + fmt(ec.amount) + '</td></tr>';
      });
    }
    etRows += '<tr class="total-row"><td><strong>Total Cost to Employer</strong></td><td class="amount">' + r.fEmployerCost + '</td></tr>';
    et.innerHTML = etRows;

    // Minimum wage check
    var mwBox = document.getElementById('mwCheckBox');
    if (r.mwCheck) {
      var mc = r.mwCheck;
      var cls = mc.compliant ? 'ok' : 'warn';
      var icon = mc.compliant ? '&#9989;' : '&#9888;&#65039;';
      var mwLabel = mc.isDaily ? '/day' : '/month';
      var diffText = mc.compliant
        ? r.sym + fmt(mc.diff) + mwLabel + ' above agricultural minimum wage'
        : r.sym + fmt(mc.diff) + mwLabel + ' BELOW agricultural minimum wage';
      mwBox.innerHTML = '<div class="mw-check ' + cls + '">' + icon + ' Agricultural minimum wage in ' + COUNTRY_NAME + ': ' + r.sym + mc.minWage.toLocaleString() + mwLabel + '. Your rate is ' + diffText + '.</div>';
    } else {
      mwBox.innerHTML = '<div class="mw-check ok">&#9432; ' + COUNTRY_NAME + ' does not have a legislated agricultural minimum wage. Wages are set by market rates and negotiation.</div>';
    }

    // Labor law
    var ll = r.laborLaw || {};
    var llBox = document.getElementById('laborLawBox');
    llBox.innerHTML = '<strong>Labour Law Summary — ' + COUNTRY_NAME + '</strong><br>'
      + (ll.maxHoursPerDay ? '&#128336; Max ' + ll.maxHoursPerDay + ' hours/day, ' + (ll.maxHoursPerWeek || 40) + ' hours/week &bull; ' : '')
      + (ll.overtimeRate ? 'Overtime at ' + ll.overtimeRate + '&times; &bull; ' : '')
      + (ll.annualLeave_days ? ll.annualLeave_days + ' days annual leave &bull; ' : '')
      + (ll.publicHolidays ? ll.publicHolidays + ' public holidays' : '')
      + (ll.notes ? '<br><span style="color:#64748b;">' + ll.notes + '</span>' : '');

    // Cross-links
    var ct = document.getElementById('crossTools');
    ct.innerHTML = ''
      + '<a class="cross-tool-card" href="' + (r.payeLink || '#') + '"><span class="cross-tool-icon">&#128181;</span><div class="cross-tool-text"><div class="cross-tool-name">' + COUNTRY_NAME + ' PAYE Calculator</div><div class="cross-tool-desc">Compute exact income tax deductions</div></div></a>'
      + '<a class="cross-tool-card" href="/agriculture/farm-profit/' + slugify(COUNTRY_NAME) + '"><span class="cross-tool-icon">&#128202;</span><div class="cross-tool-text"><div class="cross-tool-name">Farm Profit/Loss Calculator</div><div class="cross-tool-desc">Full farm profitability analysis</div></div></a>'
      + '<a class="cross-tool-card" href="/agriculture/farm-payroll/"><span class="cross-tool-icon">&#127758;</span><div class="cross-tool-text"><div class="cross-tool-name">All 54 Countries</div><div class="cross-tool-desc">Switch to another country</div></div></a>';
  }

  function fmt(n) {
    if (!isFinite(n)) return '0';
    return Math.round(Math.abs(n)).toLocaleString('en-US');
  }

  function slugify(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
<\/script>
</body>
</html>
HTMLEOF

  echo "Created: $SLUG.html"
}

for entry in "\${COUNTRIES[@]}"; do
  IFS='|' read -r CODE NAME FLAG SLUG PAYE_LINK PAYE_CODE <<< "\$entry"
  generate_page "\$CODE" "\$NAME" "\$FLAG" "\$SLUG" "\$PAYE_LINK"
done

echo "Done! Generated \${#COUNTRIES[@]} country pages."

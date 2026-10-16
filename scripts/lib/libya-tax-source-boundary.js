'use strict';

// This directory identifies legislation; it does not verify calculator rates.
const LEGISLATION_URL = 'https://tax.gov.ly/Law1.aspx';
const DIRECTORY_TITLE = 'Libya Tax Authority legislation directory (not rate verification)';
const PENDING_SCOPE = 'The legislation directory lists Income Tax Law No. 7 of 2010. Current rates, deductions, exemptions, registration thresholds and effective dates used by this calculator have not been verified against the applicable legislation.';
const isLibyaTool = id => id === 'ly-paye' || id === 'ly-vat';

function curateVerification(entry, previous) {
  if (!entry || !isLibyaTool(entry.tool_id)) return entry;
  return {
    ...entry,
    source_urls: [LEGISLATION_URL],
    source_titles: [DIRECTORY_TITLE],
    // Preserve the historical record. Finding a directory is not a new review.
    last_verified: previous ? previous.last_verified : entry.last_verified,
    verified_by: 'Current calculation review pending; legacy audit record retained',
    verification_status: 'calculation-review-pending',
    source_scope: 'legislation-directory-only',
    law_or_version: PENDING_SCOPE,
  };
}

function curateSourceEntry(entry) {
  if (!entry || !['paye-ly-source', 'vat-ly-source'].includes(entry.id)) return entry;
  return {
    ...entry,
    sourceName: DIRECTORY_TITLE,
    sourceUrl: LEGISLATION_URL,
    sourceType: 'official',
    confidence: 'low_confidence',
    notes: PENDING_SCOPE + ' Historical review dates are retained; this directory link does not refresh them.',
    displayDisclaimer: 'Planning arithmetic only. The stored assumptions are not verified current Libyan tax rules. Confirm the applicable legislation and treatment with the Libya Tax Authority or a qualified adviser before relying on a result.',
  };
}

function pendingPanelCopy(lang) {
  return lang === 'fr' ? {
    kicker: 'Revue du calcul en attente',
    lead: 'Ce répertoire permet de rechercher les textes. Il ne valide pas les taux, retenues, exonérations, seuils ni dates applicables aux hypothèses du calculateur.',
    lastVerified: 'Date d’audit historique, sans vérification actuelle :',
    sourceLinks: 'Répertoire législatif — référence uniquement',
    lawVersion: 'Ce qui reste à vérifier',
  } : {
    kicker: 'Calculation review pending',
    lead: 'Use this directory to find legislation. It does not validate the rates, deductions, exemptions, thresholds or effective dates behind the calculator assumptions.',
    lastVerified: 'Legacy audit date, not current verification:',
    sourceLinks: 'Legislation directory — reference only',
    lawVersion: 'What remains unverified',
  };
}

function ownsPendingSourcePanel(sourceId, html) {
  const toolId = sourceId === 'paye-ly-source' ? 'ly-paye' : sourceId === 'vat-ly-source' ? 'ly-vat' : null;
  return !!toolId && html.includes(`data-tool-verification-panel data-tool-id="${toolId}"`) && html.includes(LEGISLATION_URL);
}

function localizeValue(value, lang) {
  if (lang !== 'fr') return value;
  if (value === DIRECTORY_TITLE) return 'Répertoire législatif de l’administration fiscale libyenne (sans vérification des taux)';
  if (value === PENDING_SCOPE) return 'Le répertoire législatif mentionne la loi n° 7 de 2010 relative à l’impôt sur le revenu. Les taux, retenues, exonérations, seuils d’inscription et dates applicables aux hypothèses de ce calculateur restent à vérifier dans les textes pertinents.';
  if (value === 'Current calculation review pending; legacy audit record retained') return 'Revue du calcul en attente ; ancien relevé d’audit conservé';
  return value;
}

function applyPageScope(html, toolId, lang) {
  if (!isLibyaTool(toolId)) return html;
  // Display copy only: never touch inline scripts, input defaults or dates in data.
  const replacements = lang === 'fr' ? [
    ['— LTA', '— estimation'],
    ["Calculateur d'impôt sur le revenu (PAYE) en Libye 2026. Tranches LTA, cotisations sociales et déductions automatiques en LYD.", 'Estimation PAYE en Libye avec les hypothèses affichées. Tranches, cotisations et retenues actuelles à confirmer avant utilisation.'],
    ['Calculez votre impôt sur le salaire en Libye avec les tranches LTA 2026.', 'Estimation du salaire en Libye ; tranches et retenues actuelles à confirmer.'],
    ['Calculateur de TVA en Libye 2026. Taux standard, exemptions, montants TTC et HT. Conforme LTA.', 'Calcul de TVA en Libye avec un taux saisi. Montants TTC et HT à titre indicatif ; règles fiscales actuelles non vérifiées.'],
    ['Calculez la TVA en Libye avec les taux LTA 2026. TTC, HT et exemptions.', 'Calculez les montants TTC et HT avec vos hypothèses. Taux et traitement fiscal actuels à confirmer.'],
    ['Calculez la TVA en Libye avec les taux LTA 2026.', 'Calcul indicatif avec vos hypothèses ; taux actuels à confirmer.'],
    ['Calculez la TVA en Libye à taux standard, exemptions et montants TTC/HT. Conforme LTA 2026.', 'Calculez les montants TTC et HT avec vos hypothèses. Les taux, exonérations et obligations actuels restent à vérifier.'],
    ['Calculez la TVA en Libye — taux standard, exemptions et montants TTC/HT. Conforme LTA 2026.', 'Calculez les montants TTC et HT avec vos hypothèses. Les taux, exonérations et obligations actuels restent à vérifier.'],
    ['Calculez votre salaire net en Libye avec les tranches fiscales LTA 2026. Cotisations sociales et déductions incluses.', 'Estimez votre salaire net avec les hypothèses affichées. Les tranches, cotisations, retenues et dates applicables restent à vérifier.'],
    ['Dernière vérification editoriale: 2026. Utilisez le résultat comme repere de travail, puis conservez la source, la date et le contexte de votre vérification.', 'Revue du calcul en attente. Conservez le texte officiel, sa date et le contexte de votre vérification avant de vous fier au résultat.'],
  ] : [
    ['Progressive 5%–10% income tax + 0.5% stamp duty, plus 5.125% social security + 1% Social Unity Fund. Monthly calculation.', 'Stored planning assumptions, not currently verified: progressive 5%–10% income tax + 0.5% stamp duty, plus 5.125% social security + 1% Social Unity Fund. Monthly calculation.'],
    ['Last verified: 2025 · Currency: LYD', 'Current calculation review pending · Currency: LYD'],
    ['Standard 0% VAT. Calculate VAT-inclusive, VAT-exclusive, reverse VAT extraction, and multi-item invoice totals. Accurate 2026 SRTD rates.', 'Planning arithmetic using the displayed or entered rate. Calculate inclusive, exclusive, reverse and multi-item totals. Current Libyan tax treatment and rates remain unverified.'],
    ['SRTD 2026', 'Tax review pending'],
    ['Last verified: 2026 · Source: SRTD (financialministry.gov.sd)', 'Current calculation review pending · Legislation directory is a reference, not rate verification'],
    ['<strong>2026 Rates:</strong>', '<strong>Unverified planning assumptions:</strong>'],
    ['Tax authority: SRTD.', 'These assumptions do not establish a current tax or registration obligation.'],
    ['Register with SRTD when turnover exceeds this', 'Stored planning threshold; registration requirement unverified'],
    ['<span>Tax Authority</span><span class="val">SRTD</span>', '<span>Tax evidence</span><span class="val">Review pending</span>'],
    ['Rates are for guidance only. Always verify with SRTD (financialministry.gov.sd) for official rates and your specific tax situation. AfroTools is not a tax advisor.', 'Stored values are planning assumptions, not verified current rules. Consult the Libya Tax Authority legislation and a qualified adviser for the applicable tax treatment, registration and filing duties. AfroTools is not a tax advisor.'],
  ];
  // Keep scripts byte-exact even if a display literal also occurs in an export.
  return html.split(/(<script\b[^>]*>[\s\S]*?<\/script\s*>)/gi).map((part, i) => {
    if (i % 2) {
      // Correct only these two display descriptions; dates and schema stay put.
      if (lang === 'fr' && /^<script\b[^>]*type="application\/ld\+json"/i.test(part)) {
        return part.replace('Calculate Libya take-home pay with LTA tax bands 2026.', 'Estimation du salaire en Libye ; tranches et retenues actuelles à confirmer.')
          .replace('Calculate Libya VAT with LTA rates 2026.', 'Calcul indicatif avec vos hypothèses ; taux actuels à confirmer.');
      }
      return part;
    }
    for (const [before, after] of replacements) {
      if (!part.includes(after)) part = part.split(before).join(after);
    }
    return part;
  }).join('');
}

module.exports = { LEGISLATION_URL, isLibyaTool, curateVerification, curateSourceEntry, pendingPanelCopy, ownsPendingSourcePanel, localizeValue, applyPageScope };

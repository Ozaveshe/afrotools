const labels = {
  "fr": [
    "Partager le lien de l’outil",
    "Pour envoyer la facture terminée, téléchargez le PDF.",
    "Générateur de factures AfroTools",
    "Créez une facture avec AfroTools.",
    "Cette facture est un brouillon distinct non enregistré. Son total ne comprend aucune taxe supplémentaire. Vérifiez la description et le traitement fiscal, puis enregistrez ou exportez la facture avant de quitter la page."
  ],
  "sw": [
    "Shiriki kiungo cha zana",
    "Ili kutuma ankara iliyokamilika, pakua PDF.",
    "Kizalishaji cha ankara cha AfroTools",
    "Tengeneza ankara kwa kutumia AfroTools.",
    "Hii ni rasimu tofauti ya ankara ambayo haijahifadhiwa. Jumla yake haina kodi ya ziada. Kagua maelezo ya bidhaa na kodi, kisha hifadhi au hamisha ankara kabla ya kuondoka."
  ]
};

function localizeInvoiceToolShare(html, locale) {
  const [label, note, title, text, transferNotice] = labels[locale];
  const button = /<button class="btn" id="btnShare"[^>]*>[\s\S]*?<\/button>(?:\s*<small>[^<]*<\/small>)?/;
  const handler = /(\$\('btnShare'\)\.addEventListener\('click',[\s\S]*?shareState\.share\) \{)[\s\S]*?(AfroTools\.shareState\.share\(\{)[\s\S]*?\}\);/;
  return html.replace(button, '<button class="btn" id="btnShare" type="button" aria-label="' + label + '">' + label + '</button>\n        <small>' + note + '</small>')
    .replace(/(<p\b[^>]*\bid=["']convertedInvoiceNotice["'][^>]*>)[\s\S]*?(<\/p>)/i, '$1' + transferNotice + '$2')
    .replace(handler, '$1\n    $2\n      title: ' + JSON.stringify(title) + ',\n      text: ' + JSON.stringify(text) + ',\n      baseUrl: location.origin + location.pathname,\n      state: {}\n    });');
}

module.exports = { localizeInvoiceToolShare };

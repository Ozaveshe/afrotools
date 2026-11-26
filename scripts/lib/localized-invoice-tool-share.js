const labels = {
  "fr": [
    "Partager le lien de l’outil",
    "Pour envoyer la facture terminée, téléchargez le PDF.",
    "Générateur de factures AfroTools",
    "Créez une facture avec AfroTools."
  ],
  "sw": [
    "Shiriki kiungo cha zana",
    "Ili kutuma ankara iliyokamilika, pakua PDF.",
    "Kizalishaji cha ankara cha AfroTools",
    "Tengeneza ankara kwa kutumia AfroTools."
  ]
};

function localizeInvoiceToolShare(html, locale) {
  const [label, note, title, text] = labels[locale];
  const button = /<button class="btn" id="btnShare"[^>]*>[\s\S]*?<\/button>(?:\s*<small>[^<]*<\/small>)?/;
  const handler = /(\$\('btnShare'\)\.addEventListener\('click',[\s\S]*?shareState\.share\) \{)[\s\S]*?(AfroTools\.shareState\.share\(\{)[\s\S]*?\}\);/;
  return html.replace(button, '<button class="btn" id="btnShare" type="button" aria-label="' + label + '">' + label + '</button>\n        <small>' + note + '</small>')
    .replace(handler, '$1\n    $2\n      title: ' + JSON.stringify(title) + ',\n      text: ' + JSON.stringify(text) + ',\n      baseUrl: location.origin + location.pathname,\n      state: {}\n    });');
}

module.exports = { localizeInvoiceToolShare };

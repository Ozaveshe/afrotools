(function () {
  'use strict';
  const currencies = {"NG": "NGN", "GH": "GHS", "CI": "XOF", "SN": "XOF", "CM": "XAF", "KE": "KES", "TZ": "TZS", "UG": "UGX", "RW": "RWF", "MU": "MUR", "ZA": "ZAR", "ZM": "ZMW", "BW": "BWP", "ZW": "USD", "EG": "EGP", "MA": "MAD"};
  const references = {
  "NG": [
    "https://edojudiciary.gov.ng/wp-content/uploads/2022/05/Practice-Direction-on-Newly-Revised-Fees-and-Fines-for-Magistrates-Courts-Benin-City.pdf",
    "Benin City magistrates’ fees (Edo State, 2022)",
    "Frais du tribunal de première instance de Benin City (État d’Edo, 2022)"
  ],
  "SN": [
    "https://justice.sec.gouv.sn/pouvoir-judiciaire/tribunaux-de-commerce/",
    "Senegal Ministry of Justice: commercial courts",
    "Ministère de la Justice du Sénégal : tribunaux de commerce"
  ],
  "CI": [
    "https://tribunalcommerceabidjan.ci/presentation_greffe",
    "Registry of the Abidjan Commercial Court",
    "Greffe du Tribunal de commerce d’Abidjan"
  ],
  "ZA": [
    "https://justice.gov.za/legislation/notices/2025/20251024-gg53572rg11899gon6752-RB-MC.pdf",
    "Magistrates’ courts tariff amendments, 24 October 2025",
    "Modification des tarifs des tribunaux de première instance, 24 octobre 2025"
  ],
  "GH": [
    "https://judicial.gov.gh/jsweb/index.php/jsg-services/court-services/courtfees",
    "Judicial Service of Ghana: court fees",
    "Judicial Service of Ghana : frais judiciaires"
  ],
  "KE": [
    "https://judiciary.go.ke/download/court-fees-assessment-schedule/",
    "Kenya Judiciary: court fees assessment schedule",
    "Kenya Judiciary : barème des frais"
  ],
  "BW": [
    "https://www.justice.gov.bw/sites/default/files/Tariffs/court_fees_magistrate.pdf",
    "Botswana magistrates’ court fees",
    "Frais des magistrates’ courts du Botswana"
  ]
};
  function currency(country) { return currencies[country]; }
  function total(country, filing, service) {
    if (!currency(country) || !String(filing).trim() || !String(service).trim()) return null;
    const scale = 10 ** new Intl.NumberFormat('en', {style:'currency', currency:currency(country)}).resolvedOptions().maximumFractionDigits;
    const amounts = [Number(filing), Number(service)];
    const minor = amounts.map(value => Math.round(value * scale));
    if (amounts.some((value,i) => value < 0 || !Number.isFinite(value) || Math.abs(value * scale - minor[i]) > 0.000001) ||
        !Number.isSafeInteger(minor[0] + minor[1])) return null;
    return (minor[0] + minor[1]) / scale;
  }
  function reference(node, country, french) {
    node.replaceChildren();
    const entry = references[country];
    if (!entry) {
      node.textContent = french ? 'Demandez un devis daté au greffe concerné.' : 'Request a dated quote from the registry handling your case.';
      return;
    }
    const a = document.createElement('a');
    a.href = entry[0]; a.textContent = entry[french ? 2 : 1]; node.appendChild(a);
  }
  window.AfroCourtQuote = { currency, total, reference };
}());

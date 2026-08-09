"use strict";

const fs = require("node:fs");
const path = require("node:path");

const COPY = {
  "creator-desk": [
    ["Build a private project ledger", "Jenga daftari binafsi la miradi"], ["Project name", "Jina la mradi"],
    ["Client label", "Jina la mteja"], ["Status", "Hali"], ["Quoted", "Imetolewa bei"], ["Lead", "Matarajio"],
    ["Active", "Inaendelea"], ["Review", "Mapitio"], ["Completed", "Imekamilika"], ["Value", "Thamani"],
    ["Currency", "Sarafu"], ["Due date", "Tarehe ya mwisho"], ["Private notes", "Maelezo binafsi"],
    ["Add project", "Ongeza mradi"], ["Download JSON", "Pakua JSON"], ["Download CSV", "Pakua CSV"],
    ["Session-local and private:", "Ya kikao na binafsi:"], ["Project", "Mradi"], ["Client", "Mteja"],
    ["Local Creator Project Desk", "Dawati la miradi ya mtayarishi"], ["CreatorDesk", "Dawati la mtayarishi"]
  ],
  "creator-hashtags": [
    ["What's the post about?", "Chapisho linahusu nini?"], ["Platform", "Jukwaa"], ["Generation mode", "Njia ya kutengeneza"],
    ["Local, deterministic (recommended)", "Ya ndani, ya uhakika (inapendekezwa)"], ["Optional AI assist", "Msaada wa AI wa hiari"],
    ["I agree to send the topic and selected platform to AfroTools AI. The exact topic above will leave this browser.", "Ninakubali kutuma mada na jukwaa nililochagua kwa AfroTools AI. Mada iliyo juu itaondoka kwenye kivinjari hiki."],
    ["Generate Tags", "Tengeneza hashtag"], ["High Reach", "Ufikiaji mkubwa"], ["Mid Reach", "Ufikiaji wa kati"],
    ["Niche", "Maalumu"], ["Download TXT", "Pakua TXT"], ["Download JSON", "Pakua JSON"],
    ["BUILD YOUR OWN MIX", "JENGA MCHANGANYIKO WAKO"], ["Tap tags above to add/remove from your mix", "Gusa hashtag kuongeza au kuondoa kwenye mchanganyiko"],
    ["Tap tags above to start building", "Gusa hashtag zilizo juu kuanza"], ["You've exceeded the recommended tag count for this platform", "Umezidi idadi ya hashtag inayopendekezwa kwa jukwaa hili"],
    ["Copy Mix", "Nakili mchanganyiko"], ["Clear", "Futa"], ["Local history", "Historia ya ndani"],
    ["Close history", "Funga historia"], ["History", "Historia"]
  ],
  "creator-invoice": [
    ["Prepare a clear invoice", "Andaa ankara iliyo wazi"], ["Local invoicing", "Ankara ya ndani"], ["Issuer and client", "Mtoa huduma na mteja"],
    ["Issuer name", "Jina la mtoa huduma"], ["Issuer email (optional)", "Barua pepe ya mtoa huduma (hiari)"],
    ["Client name", "Jina la mteja"], ["Client email (optional)", "Barua pepe ya mteja (hiari)"], ["Invoice details", "Maelezo ya ankara"],
    ["Invoice number", "Namba ya ankara"], ["Currency", "Sarafu"], ["Issue date", "Tarehe ya kutolewa"], ["Due date", "Tarehe ya mwisho"],
    ["Tax label", "Jina la kodi"], ["Tax rate (%)", "Kiwango cha kodi (%)"], ["Discount type", "Aina ya punguzo"],
    ["Percentage", "Asilimia"], ["Fixed amount", "Kiasi maalumu"], ["Discount value", "Thamani ya punguzo"],
    ["Services", "Huduma"], ["Description", "Maelezo"], ["Quantity", "Idadi"], ["Unit price", "Bei kwa kipengele"],
    ["Notes and terms (optional)", "Maelezo na masharti (hiari)"], ["Calculate invoice", "Kokotoa ankara"],
    ["Save locally", "Hifadhi ndani"], ["Restore draft", "Rejesha rasimu"], ["Preview", "Hakiki"],
    ["Subtotal", "Jumla ndogo"], ["Discount", "Punguzo"], ["Tax", "Kodi"], ["Total", "Jumla"],
    ["Copy summary", "Nakili muhtasari"], ["Download JSON", "Pakua JSON"], ["Download TXT", "Pakua TXT"], ["Download PDF", "Pakua PDF"],
    ["Privacy:", "Faragha:"], ["Verify before issuing:", "Thibitisha kabla ya kutoa:"], ["Back to CreatorInvoice", "Rudi kwenye Ankara ya mtayarishi"],
    ["Creator Invoice Workspace", "Ankara ya mtayarishi"]
  ]
};

function build(root, owner, cfg) {
  const source = path.join(root, "tools", owner, "app.html");
  let html = fs.readFileSync(source, "utf8");
  const canonical = `/sw/zana/${cfg.slug}/`;
  const protectedBlocks = [];
  html = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, (block) => {
    protectedBlocks.push(block);
    return `__SW_PROTECTED_${protectedBlocks.length - 1}__`;
  });
  html = html.split(/(<[^>]+>)/).map((part) => {
    if (part.startsWith("<")) return part;
    for (const pair of (COPY[owner] || []).slice().sort((a, b) => b[0].length - a[0].length)) part = part.split(pair[0]).join(pair[1]);
    return part;
  }).join("").replace(/__SW_PROTECTED_(\d+)__/g, (_, index) => protectedBlocks[Number(index)]);
  html = html
    .replace(/ data-chat-bundle="[^"]+"/i, "")
    .replace(/<html([^>]*?)lang="en"/i, '<html$1lang="sw"')
    .replace(/<meta name="robots" content="[^"]+">/i, '<meta name="robots" content="index, follow">')
    .replace(/<link rel="alternate"[^>]+>\s*/gi, "")
    .replace(/<link rel="canonical" href="[^"]+">/i, `<link rel="canonical" href="https://afrotools.com${canonical}">`)
    .replace(new RegExp(`https://afrotools\\.com/tools/${owner}/app`, "g"), `https://afrotools.com${canonical}`)
    .replace(/href="(?:index|app)\.html"/g, `href="${canonical}"`)
    .replace(/<script src="\/assets\/js\/analytics-bootstrap\.js[^>]*><\/script>\s*/i, "")
    .replace(/<script src="\/assets\/js\/supabase-auth\.js[^>]*><\/script>\s*/i, "")
    .replace(/<script src="\/assets\/js\/lib\/creator-profile\.js[^>]*><\/script>\s*/i, "")
    .replace(/<script src="\/assets\/js\/lazy-analytics\.js[^>]*><\/script>\s*/i, "")
    .replace(/<link rel="preconnect" href="https:\/\/fonts\.(?:googleapis|gstatic)\.com"[^>]*>\s*/gi, "")
    .replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>\s*/gi, "")
    .replace(/data-lang="en"/g, 'data-lang="sw"');
  html = html
    .replace(/<meta name="description" content="[^"]+">/i, `<meta name="description" content="${cfg.description}">`)
    .replace(/<meta property="og:title" content="[^"]+">/i, `<meta property="og:title" content="${cfg.title}">`)
    .replace(/<meta property="og:description" content="[^"]+">/i, `<meta property="og:description" content="${cfg.description}">`);
  html = html.replace(/title="History"/g, 'title="Historia"').replace(/aria-label="Close history"/g, 'aria-label="Funga historia"');
  const schema = html.includes('application/ld+json') ? '' : `<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"WebApplication",name:cfg.title,url:`https://afrotools.com${canonical}`,inLanguage:"sw",applicationCategory:"UtilitiesApplication",operatingSystem:"Web",isAccessibleForFree:true})}</script>`;
  const meta = `<meta name="geo.region" content="002"><meta property="og:locale" content="sw_KE">${schema}<link rel="alternate" hreflang="en" href="https://afrotools.com/tools/${owner}/"><link rel="alternate" hreflang="fr" href="https://afrotools.com${cfg.fr}"><link rel="alternate" hreflang="sw" href="https://afrotools.com${canonical}"><link rel="alternate" hreflang="x-default" href="https://afrotools.com/tools/${owner}/">`;
  const mobile = owner === 'creator-desk' ? '<style>@media(max-width:480px){.ccn-output{overflow-x:auto;max-width:100%}.ccn-table{min-width:0;width:100%;display:block}.ccn-table thead{display:none}.ccn-table tbody,.ccn-table tr,.ccn-table td{display:block;width:100%}.ccn-table td{overflow-wrap:anywhere}}</style>' : '';
  return html.replace(/<\/head>/i, meta + mobile + "</head>").replace(/<\/body>/i, '<script src="/assets/js/lib/sw-accessibility.js" defer></script></body>');
}

module.exports = { build };

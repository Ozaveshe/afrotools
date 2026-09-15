'use strict';
const TEXT={en:{heading:'Sources &amp; verification',report:'Report calculation error',contact:'/contact/'},fr:{heading:'Sources et vérification',report:'Signaler une erreur de calcul',contact:'/fr/contact/'},sw:{heading:'Vyanzo na uthibitisho',report:'Ripoti kosa la hesabu',contact:'/sw/wasiliana/'}};
function reportLink(locale,id){const t=TEXT[locale];return `<p><a class="tool-verification-report" href="${t.contact}?topic=calculation-error&amp;tool=${id}">${t.report}</a></p>`;}
function dedicatedContract(html){
 const owner=html.match(/<meta name="afrotools-source-owner" content="scripts\/build-(morocco|tunisia)-paye\.js">/);if(!owner)return null;
 const country=owner[1],locale=html.match(/<html\b[^>]*lang="([^"]+)"/)[1],code=country==='morocco'?'ma':'tn';
 const copy=require('./'+country+'-paye-content')[locale],section=html.match(new RegExp('<section[^>]*aria-labelledby="'+code+'-sources-heading"[^>]*>[\\s\\S]*?<\\/section>'))?.[0]||'';
 const errors=[];for(const key of ['scope','method','confidence'])if(!section.includes(copy[key]))errors.push('missing visible '+key);
 if(!/15 (?:September|septembre|Septemba) 2026/.test(copy.confidence))errors.push('missing recorded evidence date');
 const sources=country==='morocco'?['https://www.finances.gov.ma/Publication/dgi/2025/CGI-2026-FR.pdf','https://www.acaps.ma/fr/files/fichesynthetiquecnsspdf']:['https://jibaya.tn/wp-content/uploads/2026/03/11.pdf','https://www.finances.gov.tn/sites/default/files/2024-12/LF2025.pdf'];
 for(const source of sources)if(!section.includes('href="'+source+'"'))errors.push('missing source '+source);
 if(!section.includes('data-tool-verification-panel')||!section.includes('data-tool-id="'+code+'-paye"'))errors.push('missing verification identity');
 if(!section.includes(reportLink(locale,code+'-paye')))errors.push('missing local report path');
 return {country,locale,errors};
}
module.exports={TEXT,reportLink,dedicatedContract};

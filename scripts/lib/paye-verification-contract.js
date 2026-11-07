'use strict';
const TEXT={en:{heading:'Sources &amp; verification',report:'Report calculation error',contact:'/contact/'},fr:{heading:'Sources et vérification',report:'Signaler une erreur de calcul',contact:'/fr/contact/'},sw:{heading:'Vyanzo na uthibitisho',report:'Ripoti kosa la hesabu',contact:'/sw/wasiliana/'}};
function reportLink(locale,id){const t=TEXT[locale];return `<p><a class="tool-verification-report" href="${t.contact}?topic=calculation-error&amp;tool=${id}">${t.report}</a></p>`;}
function dedicatedContract(html){
 if(/data-senegal-paye-disclosure-en=/.test(html)){
  const section=html.match(/<section\b[^>]*data-senegal-paye-disclosure-en="2026-11-07"[^>]*>[\s\S]*?<\/section>/)?.[0]||'';
  const errors=[];
  if(!/<html\b[^>]*lang="en"/.test(html))errors.push('Senegal English disclosure requires English page');
  for(const marker of ['data-tool-verification-panel','data-tool-id="sn-paye"','data-source-record-id="ledger-tool-sn-paye-en"','id="sn-en-sources"','datetime="2026-11-07"'])if(!section.includes(marker))errors.push('missing Senegal English marker '+marker);
  for(const phrase of ['resident','twelve months','Family income-tax relief','TRIMF','general IPRES','as of 1 January 2026','unconfirmed','IPM','supplementary retirement','employer CSS'])if(!section.includes(phrase))errors.push('missing Senegal English scope '+phrase);
  for(const url of ['https://www.dgid.sn/storage/docs/CGI-2025.pdf','https://www.cleiss.fr/docs/cotisations/senegal.html','https://dgtss.gouv.sn/wp-content/uploads/simple-file-list/Cadre-juridique/Lois/JO-Loi-2026-19-du-03-septembre-2026-portant-CODE-SECURITE-SOCIALE.pdf'])if(!section.includes('href="'+url+'"'))errors.push('missing Senegal English source '+url);
  if(!section.includes('class="tool-verification-report"')||!section.includes('href="/contact/?topic=calculation-error&amp;tool=sn-paye"'))errors.push('missing English report link');
  if(/data-source-meta-id="(?:paye-sn-source|ledger-tool-sn-paye-en)"/.test(html))errors.push('redundant generic Senegal English source hook');
  return {country:'senegal',locale:'en',sourceId:'ledger-tool-sn-paye-en',errors};
 }
 if(/data-senegal-paye-disclosure=/.test(html)){
  const section=html.match(/<section\b[^>]*data-senegal-paye-disclosure="2026-11-07"[^>]*>[\s\S]*?<\/section>/)?.[0]||'';
  const errors=[];
  if(!/<html\b[^>]*lang="fr"/.test(html))errors.push('Senegal disclosure requires French page');
  for(const marker of ['data-tool-verification-panel','data-tool-id="sn-paye-fr"','data-source-record-id="ledger-tool-sn-paye-fr"','id="sn-sources-heading"','datetime="2026-11-07"'])if(!section.includes(marker))errors.push('missing Senegal marker '+marker);
  for(const phrase of ['résident','douze mois','réduction familiale','TRIMF','IPRES général','au 1er janvier 2026','non confirmés','IPM','retraite complémentaire','employeur CSS'])if(!section.includes(phrase))errors.push('missing Senegal scope '+phrase);
  for(const url of ['https://www.dgid.sn/storage/docs/CGI-2025.pdf','https://www.cleiss.fr/docs/cotisations/senegal.html','https://dgtss.gouv.sn/wp-content/uploads/simple-file-list/Cadre-juridique/Lois/JO-Loi-2026-19-du-03-septembre-2026-portant-CODE-SECURITE-SOCIALE.pdf'])if(!section.includes('href="'+url+'"'))errors.push('missing Senegal source '+url);
  if(!section.includes('class="tool-verification-report"')||!section.includes('href="/fr/contact/?topic=calculation-error&amp;tool=sn-paye-fr"'))errors.push('missing French report link');
  if(/data-source-meta-id="(?:paye-sn-source|ledger-tool-sn-paye-fr)"/.test(html))errors.push('redundant generic Senegal source hook');
  return {country:'senegal',locale:'fr',sourceId:'ledger-tool-sn-paye-fr',errors};
 }
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

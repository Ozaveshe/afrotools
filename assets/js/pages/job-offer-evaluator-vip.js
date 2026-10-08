(function(){
"use strict";
var lang=document.documentElement.lang||"en";
var localeNav=document.querySelector(".joe-nav a:last-child");
if(localeNav&&lang==="fr")localeNav.href="/fr/";
if(localeNav&&lang==="sw")localeNav.href="/sw/";
var T={
en:{offer:"Offer",pay:"Monthly pay used for comparison",cash:"Monthly cash allowances",benefits:"Your monthly benefit estimate",costs:"Monthly required work costs",bonus:"Expected annual bonus",once:"One-off costs",fit:"Role fit",learn:"Learning and growth",flex:"Flexibility",stable:"Stability / certainty",team:"Manager and team confidence",currency:"Currency code or symbol — use the same unit for every amount",calc:"Compare my entries",clear:"Clear",copy:"Copy",csv:"CSV",json:"JSON",pdf:"PDF",weights:"Your decision weights",financial:"Financial value",result:"Worksheet result",annual:"Adjusted first-year value",score:"Weighted preference score",delta:"Offer B minus Offer A",invalid:"Choose one currency/unit, check that amounts are zero or higher, ratings are 0–10, and at least one weight is above zero.",cleared:"Inputs and results cleared.",ready:"Comparison updated. No winner or recommendation is assigned.",pdfFail:"PDF library is unavailable. Your data has not left this browser."},
fr:{offer:"Offre",pay:"Rémunération mensuelle comparée",cash:"Allocations mensuelles en espèces",benefits:"Votre estimation mensuelle des avantages",costs:"Frais professionnels mensuels",bonus:"Prime annuelle attendue",once:"Frais ponctuels",fit:"Adéquation du poste",learn:"Apprentissage et évolution",flex:"Flexibilité",stable:"Stabilité / certitude",team:"Confiance envers manager et équipe",currency:"Code ou symbole monétaire — utilisez la même unité partout",calc:"Comparer mes données",clear:"Effacer",copy:"Copier",csv:"CSV",json:"JSON",pdf:"PDF",weights:"Vos pondérations",financial:"Valeur financière",result:"Résultat de la feuille",annual:"Valeur ajustée de la première année",score:"Score pondéré de préférence",delta:"Offre B moins Offre A",invalid:"Choisissez une devise/unité, vérifiez les montants, les notes de 0 à 10 et ajoutez au moins un poids positif.",cleared:"Données et résultats effacés.",ready:"Comparaison mise à jour. Aucun gagnant ni recommandation.",pdfFail:"La bibliothèque PDF est indisponible. Vos données restent dans ce navigateur."},
sw:{offer:"Ofa",pay:"Malipo ya mwezi ya kulinganisha",cash:"Posho za pesa kwa mwezi",benefits:"Makadirio yako ya faida kwa mwezi",costs:"Gharama za kazi kwa mwezi",bonus:"Bonasi ya mwaka unayotarajia",once:"Gharama za mara moja",fit:"Ulinganifu wa jukumu",learn:"Kujifunza na ukuaji",flex:"Unyumbufu",stable:"Uthabiti / uhakika",team:"Imani kwa meneja na timu",currency:"Msimbo au alama ya sarafu — tumia kitengo kimoja kwa kiasi chote",calc:"Linganisha nilichoingiza",clear:"Futa",copy:"Nakili",csv:"CSV",json:"JSON",pdf:"PDF",weights:"Uzito wa maamuzi yako",financial:"Thamani ya kifedha",result:"Matokeo ya karatasi",annual:"Thamani ya mwaka wa kwanza",score:"Alama ya upendeleo yenye uzito",delta:"Ofa B pungufu/zaidi ya Ofa A",invalid:"Chagua sarafu/kitengo kimoja, kagua kiasi, alama 0–10, na uzito mmoja uwe zaidi ya sifuri.",cleared:"Data na matokeo yamefutwa.",ready:"Ulinganisho umesasishwa. Hakuna mshindi au pendekezo.",pdfFail:"Maktaba ya PDF haipatikani. Data yako haijatoka kwenye kivinjari hiki."}}[lang]||null; T=T||T.en;
var exportCopy={
  en:{unit:"Currency / unit:",conversion:"no conversion",points:"points",note:"Every monetary amount and result uses the user-chosen {unit} unit; no currency conversion is performed."},
  fr:{unit:"Devise / unité :",conversion:"sans conversion",points:"points",note:"Chaque montant et résultat utilise l’unité {unit} choisie ; aucune conversion monétaire n’est effectuée.",method:"Valeur annuelle = 12 × (rémunération mensuelle + allocations mensuelles + estimation mensuelle des avantages - frais professionnels mensuels) + prime annuelle attendue - frais ponctuels. Le score financier correspond à chaque valeur annuelle non négative divisée par la plus élevée des valeurs annuelles positives. Les autres notes sont saisies par vous de 0 à 10. Le score final est la moyenne pondérée normalisée. L’ordre des offres est conservé ; aucune recommandation n’est formulée."},
  sw:{unit:"Sarafu / kitengo:",conversion:"hakuna ubadilishaji",points:"alama",note:"Kila kiasi na matokeo hutumia kitengo cha {unit} ulichochagua; hakuna ubadilishaji wa sarafu.",method:"Thamani ya mwaka = 12 × (malipo ya mwezi + posho za pesa za mwezi + makadirio ya faida za mwezi - gharama za kazi za mwezi) + bonasi ya mwaka inayotarajiwa - gharama za mara moja. Alama ya kifedha ni kila thamani ya mwaka isiyo hasi ikigawanywa kwa thamani chanya ya juu zaidi ya mwaka. Alama nyingine za 0 hadi 10 zinatolewa na wewe. Alama ya mwisho ni wastani unaotumia uzito uliosawazishwa. Mpangilio wa ofa unabaki uleule; hakuna pendekezo linalotolewa."}
};var exportLabels=exportCopy[lang]||exportCopy.en;
var criteria=[["roleFit","fit"],["learning","learn"],["flexibility","flex"],["stability","stable"],["team","team"]];
function e(tag,attrs,text){var n=document.createElement(tag);Object.keys(attrs||{}).forEach(function(k){n.setAttribute(k,attrs[k]);});if(text)n.textContent=text;return n}
function field(parent,key,label,type,max){var l=e("label",{},label),i=e("input",{name:key,type:type||"number",min:"0",step:"any"});if(max)i.max=max;l.appendChild(i);parent.appendChild(l)}
document.querySelectorAll("[data-offer]").forEach(function(box,idx){field(box,"label",T.offer+" "+(idx?"B":"A"),"text");["pay","cash","benefits","costs","bonus","once"].forEach(function(k){field(box,{pay:"monthlyPay",cash:"monthlyCash",benefits:"monthlyBenefits",costs:"monthlyCosts",bonus:"annualBonus",once:"oneOffCosts"}[k],T[k]);});criteria.forEach(function(r){field(box,r[0],T[r[1]]+" (0–10)","number",10);});box.querySelector('[name=label]').value=T.offer+" "+(idx?"B":"A")});
var weightBox=document.querySelector("[data-weights]");field(weightBox,"currency",T.currency,"text");weightBox.querySelector('[name="currency"]').maxLength=8;[["financial","financial"]].concat(criteria).forEach(function(r){field(weightBox,r[0],T[r[1]]+" (%)","number")});var defaults=[40,20,15,10,10,5];weightBox.querySelectorAll('input[type="number"]').forEach(function(x,i){x.value=defaults[i]});
var latest=null,status=document.getElementById("joe-status"),results=document.getElementById("joe-results");
function read(){return Array.from(document.querySelectorAll("[data-offer]")).map(function(box){var o={};box.querySelectorAll("input").forEach(function(x){o[x.name]=x.value});return o})}
function weights(){var o={};weightBox.querySelectorAll("input").forEach(function(x){o[x.name]=x.value});return o}
function currency(){var value=weightBox.querySelector('[name="currency"]').value.trim().slice(0,8);if(!value)throw new Error("CURRENCY_REQUIRED");return value}
function render(){try{var unit=currency();latest=window.JobOfferEngine.compare(read(),weights());latest.currencyUnit=unit;var cards=results.querySelectorAll("[data-result]");latest.offers.forEach(function(o,i){cards[i].querySelector("h3").textContent=o.label;cards[i].querySelector(".joe-annual").textContent=T.annual+": "+unit+" "+o.annualValue.toLocaleString();cards[i].querySelector(".joe-score").textContent=o.weightedScore+"/100"});document.getElementById("joe-delta").textContent=T.delta+": "+unit+" "+latest.annualDelta.toLocaleString()+" · "+latest.scoreDelta+" "+exportLabels.points;results.classList.add("on");status.textContent=T.ready}catch(_){latest=null;results.classList.remove("on");status.textContent=T.invalid}}
function exportMethod(){return latest.methodology+" Every monetary amount and result uses the user-chosen "+latest.currencyUnit+" unit; no currency conversion is performed."}
function payload(){return JSON.stringify({currencyUnit:latest.currencyUnit,inputs:read(),weights:weights(),result:latest,methodology:exportMethod()},null,2)}
function download(blob,name){var u=URL.createObjectURL(blob),a=e("a",{href:u,download:name});a.click();setTimeout(function(){URL.revokeObjectURL(u)},1000)}
function csvText(value){var text=String(value);if(/^[\s\u0000-\u001f]*[=+\-@]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"'}
document.getElementById("joe-calc").onclick=render;
document.getElementById("joe-clear").onclick=function(){document.querySelectorAll("[data-offer] input").forEach(function(x){x.value=""});weightBox.querySelector('[name="currency"]').value="";latest=null;results.classList.remove("on");status.textContent=T.cleared};
document.getElementById("joe-copy").onclick=function(){if(latest)navigator.clipboard.writeText(payload())};
document.getElementById("joe-json").onclick=function(){if(latest)download(new Blob([payload()],{type:"application/json"}),"job-offer-comparison.json")};
document.getElementById("joe-csv").onclick=function(){if(latest)download(new Blob(["currency_unit,offer,annual_value,weighted_score\n"+latest.offers.map(function(o){return csvText(latest.currencyUnit)+","+csvText(o.label)+","+o.annualValue+","+o.weightedScore}).join("\n")],{type:"text/csv"}),"job-offer-comparison.csv")};
document.getElementById("joe-pdf").onclick=function(){
  if(!latest)return;
  try{
    var J=window.jspdf.jsPDF,d=new J(),y=20;
    var width=d.internal.pageSize.getWidth()-30,bottom=d.internal.pageSize.getHeight()-15;
    function paragraph(text,size,gap){
      d.setFontSize(size);
      var lines=d.splitTextToSize(String(text).replace(/\u2212/g,"-"),width),lineHeight=size*0.3528*1.3;
      lines.forEach(function(line){if(y+lineHeight>bottom){d.addPage();y=20}d.text(line,15,y);y+=lineHeight});
      y+=gap||0;
    }
    paragraph(T.result,18,3);
    paragraph(exportLabels.unit+" "+latest.currencyUnit+" ("+exportLabels.conversion+")",9,7);
    latest.offers.forEach(function(o){
      paragraph(o.label,13,2);
      paragraph(T.annual+": "+latest.currencyUnit+" "+o.annualValue.toLocaleString(),10,1);
      paragraph(T.score+": "+o.weightedScore+"/100",10,7);
    });
    paragraph((exportLabels.method||latest.methodology)+" "+exportLabels.note.replace("{unit}",latest.currencyUnit),10,0);
    d.save("job-offer-comparison.pdf");
  }catch(_){status.textContent=T.pdfFail}
};
document.getElementById("joe-calc").textContent=T.calc;document.getElementById("joe-clear").textContent=T.clear;document.getElementById("joe-copy").textContent=T.copy;document.getElementById("joe-weights-title").textContent=T.weights;document.getElementById("joe-results-title").textContent=T.result;
document.querySelectorAll("input").forEach(function(x){x.addEventListener("input",function(){if(latest){latest=null;results.classList.remove("on");status.textContent=""}})});
})();

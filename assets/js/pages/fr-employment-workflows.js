(() => {
 'use strict';
 const root=document.querySelector('[data-hr-workflow]'),mode=root.dataset.hrWorkflow;
 const form=document.querySelector('#criteria'),items=document.querySelector('#items'),heading=document.querySelector('#heading'),summary=document.querySelector('#summary');
 const official={
   KE:['Kenya Revenue Authority','https://www.kra.go.ke/component/kra_faq/faq/729'],
   ZA:['South African Revenue Service','https://www.sars.gov.za/types-of-tax/pay-as-you-earn/completing-the-monthly-employer-declaration-emp201/']
 };
 function textNode(tag,text){const el=document.createElement(tag);el.textContent=text;return el;}
 function link(label,href){const anchor=textNode('a',label);anchor.href=href;return anchor;}
 function get(key){try{return JSON.parse(localStorage.getItem(key)||'[]');}catch{return [];}}
 function set(key,list){try{localStorage.setItem(key,JSON.stringify(list));}catch{}}
 function check(key,id,label,changed){const el=document.createElement('label'),box=document.createElement('input');box.type='checkbox';box.checked=get(key).includes(id);el.append(box,document.createTextNode(label));box.addEventListener('change',()=>{const selected=new Set(get(key));if(box.checked)selected.add(id);else selected.delete(id);set(key,[...selected]);changed();});return el;}
 const stepLabels={
 'Check Minimum Wage':'Vérifier le salaire minimum', 'Calculate Total Staff Cost':'Chiffrer le coût employeur', 'Generate Offer Letter':'Préparer la lettre d’offre', 'Set Up First Payslip':'Préparer le premier bulletin', 'Set Up Pension':'Vérifier les formalités de retraite', 'Register Social Security':'Préparer l’affiliation sociale', 'Set Compliance Alerts':'Planifier une échéance', 'Evaluate the Offer':'Évaluer l’offre', 'Benchmark vs Market':'Comparer la rémunération', 'Check Leave Entitlements':'Vérifier les droits à congé', 'Understand Pension Deductions':'Estimer les retenues de retraite', 'Set Pay Change Alerts':'Consulter les avis réglementaires', 'Compare Staff Costs by Country':'Comparer les coûts employeur', 'Check Minimum Wages':'Vérifier les minima salariaux', 'Review Employer Contributions':'Vérifier les cotisations employeur', 'Review Filing Deadlines':'Revoir les échéances déclaratives', 'Generate Country Contracts':'Préparer les contrats locaux', 'Get Labour Law Briefing':'Vérifier la réglementation locale', 'Check Notice Period':'Vérifier le préavis', 'Calculate Leave Encashment':'Chiffrer les congés restants', 'Calculate UIF / Social Security Exit':'Vérifier les formalités UIF de départ', 'Generate Termination Letter':'Préparer la lettre de fin de contrat', 'Generate Final Payslip':'Préparer le dernier bulletin', 'Review Compliance':'Vérifier le dossier de départ'
 };
 const paths={'minimum-wage':'salaire-minimum','staff-cost':'cout-employe','payslip-generator':'generateur-fiche-paie','compliance-calendar':'calendrier-de-conformite-des-entreprises','regulatory-alerts':'suivi-des-alertes-reglementaires'};
 function payroll() {
   const engine=window.AfroTools.engines.afropayrollOs,c=form.country.value,j=form.journey.value,key='afrotools:fr:paie:'+j+':'+c;
   const steps=engine.JOURNEYS[j].steps.filter(s=>engine.stepAppliesToCountry(s,c));
   heading.textContent=form.journey.selectedOptions[0].text+' · '+form.country.selectedOptions[0].text;
   const count=()=>{summary.textContent=items.querySelectorAll('input:checked').length+' / '+steps.length+' étapes effectuées.';};
   for(const [index,step] of steps.entries()){const li=document.createElement('li');li.append(check(key,index,stepLabels[step.label]||step.label,count));if(paths[step.toolId])li.append(' · ',link('Ouvrir l’outil','/fr/tools/'+paths[step.toolId]+'/#'+c));items.append(li);}count();
 }
 const news=[
 {country_code:'KE',change_type:'tax',published:'2025-10-06',id:'kra-2025-10-06',title:'Paie et déductions au Kenya',description:'La KRA rappelle aux employeurs d’appliquer les déductions, exonérations et allègements auxquels le salarié a droit. Vérifiez les justificatifs et la déclaration PAYE.',url:'https://www.kra.go.ke/news-center/public-notices/2307-guidance-on-employer-obligations-in-applying-income-tax-deductions%2C-reliefs-and-exemptions'},
 {country_code:'ZA',change_type:'pension',published:'2024-09-02',id:'sars-2024-09-02',title:'Épargne retraite en deux composantes en Afrique du Sud',description:'Le SARS précise les démarches fiscales concernant la part d’épargne accessible depuis le 1er septembre 2024. Vérifiez la directive applicable au retrait envisagé.',url:'https://www.sars.gov.za/latest-news/tax-directives-enhancements-and-tax-implications-of-the-two-pot-retirement-system/'}
 ];
 function alerts(){heading.textContent='Avis officiels';const matches=window.RAEngine.filterChanges(news,form.country.value,form.type.value);summary.textContent=matches.length?matches.length+' avis dans cette sélection. Sources consultées le 21 novembre 2026.':'Aucun avis dans cette sélection pour ces filtres.';for(const n of matches){const li=document.createElement('li');li.append(textNode('h3',n.title),textNode('p',n.description),link('Publication du '+new Date(n.published+'T12:00:00').toLocaleDateString('fr'),n.url),' · ',check('afrotools:fr:avis-lus',n.id,'Marquer comme lu',()=>{}));items.append(li);}}
 const reminder=document.querySelector('#reminder');
 const pad=n=>String(n).padStart(2,'0');
 const localDate=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
 function calendar(){
   const c=form.country.value;heading.textContent='Rappel de déclaration';reminder.title.value='';reminder.date.value='';
   if(!official[c]){summary.textContent='Saisissez la date et le libellé confirmés par votre administration.';return;}
   if(!form.month.value){summary.textContent='Choisissez le mois de paie.';return;}
   const [year,month]=form.month.value.split('-').map(Number),next=new Date(year,month,1);
   const day=c==='KE'?9:7,eng=window.ComplianceCalendarEngine;
   const date=eng.computeDueDate({frequency:'monthly',due_day:day},next.getMonth()+1,next.getFullYear());
   if(c==='ZA')while([0,6].includes(date.getDay()))date.setDate(date.getDate()-1);
   reminder.title.value=c==='KE'?'Déclaration et versement PAYE – Kenya':'Déclaration EMP201 – Afrique du Sud';
   reminder.date.value=localDate(date);
   summary.textContent=c==='KE'?'La KRA fixe le dépôt et le paiement au plus tard au 9 du mois suivant.':'Le SARS fixe l’échéance au 7 du mois suivant, avancée au jour ouvrable précédent en cas de week-end ou de jour férié. Le rappel tient compte des week-ends. Vérifiez les jours fériés puis ajustez la date.';
   const li=document.createElement('li');li.append(link(official[c][0],official[c][1]),' · Source consultée le 21 novembre 2026.');items.append(li);
 }
 if(reminder){reminder.addEventListener('submit',e=>{e.preventDefault();if(!reminder.reportValidity())return;
   const day=reminder.date.value.replaceAll('-',''),title=reminder.title.value.replace(/\\/g,'\\\\').replace(/[,;]/g,c=>'\\'+c).replace(/[\r\n]/g,' ');
   const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
   const content=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//AfroTools//Rappel employeur FR//FR','BEGIN:VEVENT','UID:'+crypto.randomUUID()+'@afrotools.com','DTSTAMP:'+stamp,'DTSTART;VALUE=DATE:'+day,'SUMMARY:'+title,'END:VEVENT','END:VCALENDAR',''].join('\r\n');
   const url=URL.createObjectURL(new Blob([content],{type:'text/calendar;charset=utf-8'})),a=link('Télécharger',url);a.download='rappel-employeur-'+day+'.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });form.month.value=localDate(new Date()).slice(0,7);}
 const code=location.hash.slice(1).toUpperCase();if([...form.country.options].some(o=>o.value===code))form.country.value=code;else if(mode!=='regulatory-alerts')form.country.value='KE';
 function render(){items.replaceChildren();if(mode==='afropayroll-os')payroll();else if(mode==='compliance-calendar')calendar();else alerts();}
 form.addEventListener('input',render);form.addEventListener('submit',e=>e.preventDefault());render();
})();

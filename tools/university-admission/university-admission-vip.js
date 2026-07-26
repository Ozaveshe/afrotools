(function(){
'use strict';
var ROUTES={
 nigeria:{
  title:'Nigeria admission route',
  summary:'Use JAMB’s official programme eligibility information and CAPS process, then verify the target institution’s current subject, screening and programme requirements.',
  steps:[
   ['Check the programme in JAMB IBASS','Confirm entry mode, institution, programme, O-Level subjects and UTME subject combination in the official eligibility checker.'],
   ['Reproduce score arithmetic if useful','Use AfroTools WAEC or JAMB calculators only to check arithmetic from your entered results; they do not establish eligibility or admission.'],
   ['Check the institution’s current admissions page','Confirm its programme requirements, screening method, current cutoff policy, documents, deadlines and applicant instructions.'],
   ['Use the official JAMB process','Upload required results and monitor the central admissions process through official JAMB services.']
  ],
  links:[['JAMB IBASS eligibility checker','https://eligibility.jamb.gov.ng/'],['JAMB CAPS information','https://www.jamb.gov.ng/caps'],['JAMB candidate portal','https://portal.jamb.gov.ng/']],
  support:['WAEC / NECO calculator','/tools/waec-calculator/','JAMB aggregate calculator','/tools/jamb-aggregate/'],
  checks:['Programme and entry mode confirmed in JAMB IBASS','Required O-Level and UTME subject combinations recorded','Target institution’s current programme page checked','Screening or Post-UTME method and deadline checked','Required results uploaded through the official process','Admission status checked only through official channels']
 },
 kenya:{
  title:'Kenya admission route',
  summary:'Use KUCCPS programme pages for current minimum subjects, programme codes and placement information. Meeting a minimum permits consideration; it does not guarantee placement.',
  steps:[
   ['Find the exact programme on KUCCPS','Record its programme code, institutions, minimum mean grade and minimum subject requirements.'],
   ['Review current placement information','Check the active cycle, application window and official applicant eligibility on KUCCPS.'],
   ['Compare official placement data','Use the cluster weight and current or prior cutoff information shown in the official portal; selection is competitive and capacity-dependent.'],
   ['Submit and retain the official receipt','Arrange programme choices in the portal and keep the confirmation or receipt.']
  ],
  links:[['KUCCPS programme search','https://students.kuccps.net/programmes/'],['KUCCPS placement guidance','https://kuccps.net/placem'],['KUCCPS student portal','https://students.kuccps.net/']],
  support:['KCSE grade calculator','/tools/kcse-calculator/'],
  checks:['Current placement cycle and deadline confirmed','Exact programme code recorded','Mean-grade and subject minimums recorded','Cluster weight or official cutoff information checked','Institution and programme accreditation checked','Application choices and receipt saved']
 },
 southafrica:{
  title:'South Africa admission route',
  summary:'Start with the official NSC study-level minimum, then use each university’s current prospectus or programme page for APS, subjects, selection tests and deadlines.',
  steps:[
   ['Confirm the NSC study-level minimum','Use Department of Basic Education guidance to understand the general Higher Certificate, Diploma or Bachelor study-level minimum.'],
   ['Read the target university’s prospectus','Record the institution’s own APS method, required subjects, achievement levels and programme selection rules.'],
   ['Check whether an NBT is required','The NBT project does not decide which test or deadline applies; the institution and faculty do.'],
   ['Apply in each official institution portal','Track separate deadlines, document requirements and application receipts.']
  ],
  links:[['Department of Basic Education NSC guidance','https://www.education.gov.za/Curriculum/NationalSeniorCertificate%28NSC%29Examinations/FAQsonExams.aspx'],['National Benchmark Test guidance','https://nbt.uct.ac.za/content/how-book-test']],
  support:['Matric APS calculator','/tools/matric-points/'],
  checks:['NSC study-level minimum reviewed','Institution-specific APS method recorded','Required subjects and achievement levels recorded','NBT requirement and deadline checked with institution','Programme closing date and documents confirmed','Official application receipt saved']
 },
 ghana:{
  title:'Ghana admission route',
  summary:'Use the target institution’s current admissions page for WASSCE subjects, aggregate calculation and programme rules. Confirm recognition or accreditation with GTEC; no single aggregate applies to every institution or programme.',
  steps:[
   ['Choose a recognised institution and programme','Use GTEC information to investigate institutional and programme recognition before paying or applying.'],
   ['Open the institution’s current admissions page','Record the exact core and elective subjects, aggregate method, programme-specific rules and admission category.'],
   ['Check the current application cycle','Confirm deadline, document requirements, result-entry instructions, fees and the official applicant portal.'],
   ['Keep the institution’s response','Admission decisions and joining instructions must come from the institution’s official channel.']
  ],
  links:[['GTEC recognition notices','https://gtec.edu.gh/unrecognised-institutions/'],['University of Ghana entry requirements (institution example)','https://admissions.ug.edu.gh/undergraduate/entry-requirements?page=1']],
  support:['WAEC / NECO grade calculator','/tools/waec-calculator/'],
  checks:['Institution and programme recognition investigated','Current institution admissions page opened','Required core and elective subjects recorded','Institution’s aggregate method and programme rule recorded','Deadline, documents, fees and portal confirmed','Official application receipt saved']
 },
 zimbabwe:{
  title:'Zimbabwe admission route',
  summary:'Confirm the institution and programme through ZIMCHE, then use the university’s current admissions page for O-Level, A-Level, subject-combination and programme-specific requirements.',
  steps:[
   ['Confirm institution and programme status','Use ZIMCHE’s institution and accreditation information before applying.'],
   ['Read the university’s current entry requirements','General O-Level and A-Level minimums can differ by institution and do not replace programme-specific subject rules.'],
   ['Check programme and intake details','Record the required subjects, intake, deadline, documents, fees and official application portal.'],
   ['Treat selection as competitive','Meeting published minimums allows consideration; it is not an admission guarantee.']
  ],
  links:[['ZIMCHE higher education institutions','https://zimche.ac.zw/higher-education-institutions/'],['ZIMCHE accreditation information','https://www.zimche.ac.zw/accreditation/'],['University of Zimbabwe undergraduate requirements (institution example)','https://www.uz.ac.zw/index.php/admissions/undergraduate']],
  support:null,
  checks:['Institution listed or status confirmed with ZIMCHE','Programme accreditation investigated','Current university requirements page opened','Required O-Level, A-Level and subject mix recorded','Intake, deadline, documents, fees and portal confirmed','Official application receipt saved']
 }
};
var active='nigeria';
var $=function(id){return document.getElementById(id);};
function node(tag,text,className){var el=document.createElement(tag);if(text!=null)el.textContent=text;if(className)el.className=className;return el;}
function render(country,focus){
 var route=ROUTES[country];if(!route)return;active=country;
 $('countrySelect').value=country;
 document.querySelectorAll('[data-country]').forEach(function(button){button.setAttribute('aria-pressed',String(button.dataset.country===country));});
 $('route-title').textContent=route.title;$('routeSummary').textContent=route.summary;
 var steps=$('routeSteps');steps.replaceChildren();
 route.steps.forEach(function(item){var li=node('li');li.append(node('strong',item[0]),document.createTextNode(item[1]));steps.appendChild(li);});
 var links=$('officialLinks');links.replaceChildren();
 route.links.forEach(function(item){var a=node('a',item[0]+' ↗');a.href=item[1];a.target='_blank';a.rel='noopener';links.appendChild(a);});
 var support=$('calculatorSupport');support.replaceChildren();
 var intro=node('strong','AfroTools supporting calculator: ');support.appendChild(intro);
 if(route.support){
  route.support.forEach(function(value,index){if(index%2===0){var a=node('a',value);a.href=route.support[index+1];support.appendChild(a);if(index+2<route.support.length)support.appendChild(document.createTextNode(' · '));}});
  support.appendChild(document.createTextNode('. Use it for arithmetic only, then return to the official requirements.'));
 }else support.appendChild(document.createTextNode('No generic score calculator is recommended for this route. Use the institution’s published requirements.'));
 var checks=$('checklistItems');checks.replaceChildren();
 route.checks.forEach(function(text,index){var label=node('label',null,'ua-check');var input=document.createElement('input');input.type='checkbox';input.dataset.check=String(index);label.append(input,node('span',text));checks.appendChild(label);});
 $('actionStatus').textContent='';
 if(focus)$('route-title').focus();
}
function pack(){
 var route=ROUTES[active];var lines=['AfroTools University Admission Verification Checklist','Country route: '+route.title,'Official links checked by AfroTools: 26 July 2026',''];
 lines.push('Route summary: '+route.summary,'','Official sources:');
 route.links.forEach(function(item){lines.push('- '+item[0]+': '+item[1]);});
 lines.push('','Verification checklist:');
 document.querySelectorAll('[data-check]').forEach(function(input,index){lines.push((input.checked?'[x] ':'[ ] ')+route.checks[index]);});
 lines.push('','Add before applying: target institution, programme, admission category, source URL, checked date, required subjects, current selection rule, deadline, documents, fees and official receipt.');
 lines.push('','Important: this checklist is not an eligibility result or admission prediction. Requirements, competition and capacity change. Verify everything with the current official owner and institution.');
 return lines.join('\n');
}
function status(message){$('actionStatus').textContent=message;}
function copy(){navigator.clipboard.writeText(pack()).then(function(){status('Checklist copied.');}).catch(function(){status('Copy is unavailable. Download the TXT checklist instead.');});}
function download(){var url=URL.createObjectURL(new Blob([pack()],{type:'text/plain;charset=utf-8'}));var a=document.createElement('a');a.href=url;a.download=active+'-university-admission-verification.txt';a.click();URL.revokeObjectURL(url);status('TXT checklist downloaded.');}
$('countrySelect').addEventListener('change',function(event){render(event.target.value,true);});
document.querySelectorAll('[data-country]').forEach(function(button){button.addEventListener('click',function(){render(button.dataset.country,true);});});
$('copyPlan').addEventListener('click',copy);$('downloadPlan').addEventListener('click',download);$('printPlan').addEventListener('click',function(){window.print();});
$('clearChecks').addEventListener('click',function(){document.querySelectorAll('[data-check]').forEach(function(input){input.checked=false;});status('Checklist cleared.');});
render(active,false);
}());

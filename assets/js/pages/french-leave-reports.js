(function(root){
 'use strict';
 var fontsPromise;
 function loadFonts(){if(!fontsPromise)fontsPromise=Promise.all(['Regular','Bold'].map(async function(style){var response=await fetch('/assets/fonts/noto-sans/NotoSans-'+style+'.ttf',{credentials:'omit',referrerPolicy:'no-referrer'});if(!response.ok)throw Error('font');var bytes=new Uint8Array(await response.arrayBuffer()),binary='';for(var i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode.apply(null,bytes.subarray(i,i+8192));return btoa(binary);})).catch(function(error){fontsPromise=null;throw error;});return fontsPromise;}
 function validateBackup(value,countries){
  if(!value||value.schemaVersion!==1||value.tool!=='leave-calculator'||!value.inputs||typeof value.inputs!=='object'||Array.isArray(value.inputs))throw Error('backup');
  var inputs=value.inputs,keys=Object.keys(inputs);if(keys.length!==2||!keys.includes('country')||!keys.includes('daysTaken')||!Object.prototype.hasOwnProperty.call(countries,inputs.country)||typeof inputs.daysTaken!=='number'||!Number.isFinite(inputs.daysTaken)||inputs.daysTaken<0||inputs.daysTaken>366||!Number.isInteger(inputs.daysTaken*2))throw Error('backup');
  return {country:inputs.country,daysTaken:inputs.daysTaken};
 }
 async function pdf(options){
  await root.AfroTools.pdf.loadJsPDF();var fonts=await loadFonts();
  // Abort if form inputs changed while local PDF/font assets were loading.
  if(options.isCurrent&&!options.isCurrent())return false;
  var doc=new root.jspdf.jsPDF({unit:'mm',format:'a4',compress:true});
  ['normal','bold'].forEach(function(style,index){var name='LeaveNoto-'+style+'.ttf';doc.addFileToVFS(name,fonts[index]);doc.addFont(name,'LeaveNoto',style);});
  var y=22,page=1;
  function header(){doc.setFont('LeaveNoto','bold');doc.setFontSize(17);doc.setTextColor(15,23,42);doc.text('Congés — rapport de planification',18,20);doc.setFont('LeaveNoto','normal');doc.setFontSize(9);doc.text('AfroTools · '+new Date().toLocaleDateString('fr-FR',{timeZone:'UTC'}),18,28);y=40;}
  function footer(){doc.setFont('LeaveNoto','normal');doc.setFontSize(8);doc.setTextColor(80,80,80);doc.text('Rapport local · afrotools.com · Page '+page,18,286);}
  function text(value,bold){doc.setFont('LeaveNoto',bold?'bold':'normal');doc.setFontSize(bold?11:10);doc.setTextColor(15,23,42);var lines=doc.splitTextToSize(String(value).normalize('NFC'),174);lines.forEach(function(line){if(y>270){footer();doc.addPage();page++;header();}doc.text(line,18,y);y+=6;});y+=3;}
  header();text('Scénario saisi',true);text('Pays : '+options.country);text('Jours de congé annuel déjà pris : '+options.daysTaken);
  text('Résultats enregistrés',true);options.rows.forEach(function(row){text(row[0]+' : '+row[1]);});
  text('Sources et limites',true);text('Référence du registre : '+options.source);text('Date du registre : '+options.checkedDate);text('Ces références ne constituent pas une vérification du droit actuel. Confirmez le contrat, les unités de congé, les dates d’application et les conditions auprès de l’autorité ou de votre employeur.');footer();doc.save('rapport-conges-fr.pdf');if(root.gtag)root.gtag('event','pdf_download',{tool_name:'leave-fr',country:options.country,method:'direct'});return true;
 }
 root.AfroTools=root.AfroTools||{};root.AfroTools.leaveReports={pdf:pdf,validateBackup:validateBackup};
})(window);

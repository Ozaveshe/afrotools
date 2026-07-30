(function (window, document) {
  "use strict";

  var BREACH_SENS={low:.7,medium:1,high:1.4,critical:1.9};
  var BREACH_DETECT={fast:.85,medium:1,slow:1.35};
  var BREACH_AUTHORITIES={
    NG:{law:"Nigeria Data Protection Act 2023",action:"Vérifiez sans délai les obligations de notification auprès de la Nigeria Data Protection Commission (NDPC).",authority:"Nigeria Data Protection Commission",url:"https://www.ndpc.gov.ng/resources/"},
    ZA:{law:"Protection of Personal Information Act (POPIA)",action:"Vérifiez les exigences de notification de violation auprès de l’Information Regulator.",authority:"Information Regulator South Africa",url:"https://inforegulator.org.za/popia/"},
    KE:{law:"Data Protection Act 2019",action:"Vérifiez les exigences et le canal de signalement d’une violation auprès de l’Office of the Data Protection Commissioner.",authority:"Office of the Data Protection Commissioner",url:"https://www.odpc.go.ke/report-a-data-breach/"},
    GH:{law:"Data Protection Act 2012 (Act 843)",action:"Vérifiez les obligations de l’organisation et les démarches actuelles auprès de la Data Protection Commission.",authority:"Data Protection Commission Ghana",url:"https://www.dataprotection.org.gh/"},
    EG:{law:"Personal Data Protection Law No. 151 of 2020",action:"Faites qualifier les obligations applicables et vérifiez les informations officielles actuelles du MCIT.",authority:"Ministry of Communications and Information Technology",url:"https://mcit.gov.eg/"}
  };
  var CYBER_AUTHORITIES={
    NG:{law:"Nigeria Data Protection Act 2023",authority:"Nigeria Data Protection Commission",url:"https://www.ndpc.gov.ng/"},
    KE:{law:"Data Protection Act 2019",authority:"Office of the Data Protection Commissioner",url:"https://www.odpc.go.ke/"},
    ZA:{law:"Protection of Personal Information Act (POPIA)",authority:"Information Regulator South Africa",url:"https://inforegulator.org.za/popia/"},
    GH:{law:"Data Protection Act 2012 (Act 843)",authority:"Data Protection Commission Ghana",url:"https://www.dataprotection.org.gh/"},
    EG:{law:"Personal Data Protection Law No. 151 of 2020",authority:"Ministry of Communications and Information Technology",url:"https://mcit.gov.eg/"}
  };
  var FIRE_AUTHORITIES={
    NG:{law:"Exigences fédérales, étatiques et locales de sécurité incendie",authority:"Federal Fire Service",url:"https://fedfire.gov.ng/about-us/"},
    ZA:{law:"Occupational Health and Safety Act et exigences municipales applicables",authority:"South African Government",url:"https://www.gov.za/documents/occupational-health-and-safety-act"},
    KE:{law:"Exigences de santé, sécurité au travail et incendie applicables",authority:"Ministry of Labour and Social Protection",url:"https://www.labour.go.ke/"},
    GH:{law:"Exigences de certification et permis incendie applicables",action:"Le portail GNFS renvoie actuellement une erreur serveur; confirmez la procédure et le point de contact avant toute démarche.",authority:"Ghana National Fire Service",url:"https://www.mint.gov.gh/agencies/ghana-national-fire-service/"}
  };
  var COMMON_PASSWORDS=["password","123456","password1","qwerty","abc123","letmein","monkey","1234567890","iloveyou","admin","welcome","login","pass","master","dragon","sunshine","princess","football","shadow","superman","michael","jessica","password123","batman","trustno1","hello123","starwars","mustang","access","flower","jesus","ninja","ashley","bailey","passw0rd","maggie","hello","donald","654321","qwerty123","charlie","andrew","matthew","daniel","george","jordan","abcdef","111111","123123","qazwsx","1q2w3e","!@#$%^","matrix","p@ssword","p@ssw0rd","pass123","africa","nigeria","kenya","ghana","lagos","nairobi","accra","cairo","abuja","money"];
  function finite(value, min, max, label) {
    var number=Number(value);
    if(!Number.isFinite(number)||number<min||number>max) throw new RangeError(label);
    return number;
  }
  function fmt(number, decimals) {
    return Number(number).toLocaleString("fr-FR",{minimumFractionDigits:decimals||0,maximumFractionDigits:decimals||0});
  }
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g,function(char){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char];});
  }
  function cctvEngine(input) {
    var cameras=finite(input.cameras,1,64,"Le nombre de caméras doit être compris entre 1 et 64.");
    if((input.cameraType==="analog"&&input.recorder==="nvr")||(input.cameraType!=="analog"&&input.recorder==="dvr")) throw new RangeError("Choisissez un DVR pour les caméras analogiques, ou un NVR/cloud pour les caméras IP.");
    var cameraCost=finite(input.cameraUnitCost,0,1000000000,"Saisissez le coût unitaire d’une caméra.");
    var totalCameras=cameraCost*cameras;
    var recorderUnits=input.recorder==="cloud"?0:Math.round(finite(input.recorderUnits,0,64,"Saisissez un nombre d’enregistreurs valide."));
    var recorderUnitCost=input.recorder==="cloud"?0:finite(input.recorderUnitCost,0,1000000000,"Saisissez le coût unitaire d’un enregistreur.");
    var recorderCost=recorderUnitCost*recorderUnits;
    var storage=finite(input.storage,1,52,"Choisissez une durée de conservation valide.");
    var hddCount=input.recorder==="cloud"?0:Math.round(finite(input.storageUnits,0,128,"Saisissez un nombre d’unités de stockage valide."));
    var hddCost=input.recorder==="cloud"?0:finite(input.storageUnitCost,0,1000000000,"Saisissez le coût unitaire du stockage.")*hddCount;
    var cloudMonthly=input.recorder==="cloud"?finite(input.cloudMonthly,0,1000000000,"Saisissez le coût cloud mensuel."):0;
    var installCost=input.installation==="professional"?finite(input.installationTotal,0,1000000000,"Saisissez le devis d’installation."):0;
    var monitoringCost=input.monitoring==="yes"?finite(input.monitoringMonthly,0,1000000000,"Saisissez le coût mensuel de surveillance."):0;
    var hardwareTotal=totalCameras+recorderCost+hddCost;
    var setupTotal=hardwareTotal+installCost;
    var monthlyTotal=monitoringCost+cloudMonthly;
    return {setupTotal:setupTotal,monthlyTotal:monthlyTotal,fiveYear:setupTotal+monthlyTotal*60,totalCameras:totalCameras,recorderCost:recorderCost,hddCost:hddCost,hddCount:hddCount,installCost:installCost,recorderUnits:recorderUnits,recorderUnitCost:recorderUnitCost,cameraCost:cameraCost,cameras:cameras,storage:storage,currency:String(input.currencyLabel||"NGN ").trim().slice(0,12)+" "};
  }
  function sharedHomeSecurityEngine() {
    if(!window.AfroToolsHomeSecurityCost||typeof window.AfroToolsHomeSecurityCost.calculate!=="function")throw new Error("Le moteur partagé du coût de sécurité est indisponible.");
    return window.AfroToolsHomeSecurityCost;
  }
  function calculateHomeSecurity(input) {
    try{return sharedHomeSecurityEngine().calculate(input);}
    catch(error){
      var labels={invalid_country:"pays",invalid_homeType:"type de logement",invalid_riskLevel:"niveau de risque",invalid_securityLevel:"niveau de protection"};
      if(error&&labels[error.code])throw new RangeError("Choisissez un "+labels[error.code]+" valide.");
      throw error;
    }
  }
  function breachEngine(input) {
    var records=Math.round(finite(input.records,1,100000000,"Le nombre d’enregistrements doit être compris entre 1 et 100 000 000."));
    var base=finite(input.basePerRecord,1,10000,"Le coût par enregistrement doit être compris entre 1 et 10 000 USD.");
    var adjusted=base*BREACH_SENS[input.sensitivity]*BREACH_DETECT[input.detection];
    var rows={
      records:records,
      recordCost:records*adjusted,
      notification:finite(input.notificationCost,0,1000000000,"Saisissez le budget de notification."),
      forensics:finite(input.forensicsCost,0,1000000000,"Saisissez le budget d’investigation."),
      legal:finite(input.legalCost,0,1000000000,"Saisissez le budget juridique."),
      pr:finite(input.communicationCost,0,1000000000,"Saisissez le budget de communication."),
      remediation:finite(input.remediationCost,0,1000000000,"Saisissez le budget de remédiation."),
      downtime:finite(input.downtimeCost,0,1000000000,"Saisissez le coût d’interruption.")
    };
    var total=rows.recordCost+rows.notification+rows.forensics+rows.legal+rows.pr+rows.remediation+rows.downtime;
    var exchangeRate=finite(input.exchangeRate,0.000001,1000000000,"Saisissez un taux de change USD valide.");
    return {totalUSD:total,totalLocal:total*exchangeRate,perRecord:total/records,adjustedPerRecord:adjusted,rows:rows,records:records,exchangeRate:exchangeRate,currency:String(input.currencyLabel||"NGN ").trim().slice(0,12)+" "};
  }
  function cyberEngine(input) {
    var domains=[
      {label:"Sécurité réseau",max:20,checks:["firewall","vpn","wifi_secure","network_monitor"]},
      {label:"Protection des données",max:20,checks:["encryption","backup","data_policy","privacy_policy"]},
      {label:"Contrôle d’accès",max:20,checks:["mfa","least_priv","pw_policy","access_review"]},
      {label:"Sécurité des terminaux",max:15,checks:["antivirus","os_updates","device_policy"]},
      {label:"Sensibilisation",max:15,checks:["sec_training","phishing_sim","sec_policy"]},
      {label:"Réponse aux incidents",max:10,checks:["incident_plan","incident_drill"]}
    ];
    var selected=new Set(input.checks||[]);
    var results=domains.map(function(domain){var checked=domain.checks.filter(function(id){return selected.has(id);}).length;return {label:domain.label,score:checked*5,max:domain.max,missing:domain.checks.filter(function(id){return !selected.has(id);})};});
    var baseScore=results.reduce(function(total,row){return total+row.score;},0);
    var incidentPenalty=input.incidents==="minor"?5:input.incidents==="major"?15:0;
    var score=baseScore-incidentPenalty;
    score=Math.max(0,Math.min(100,score));
    var grade=score>=90?"A":score>=75?"B":score>=60?"C":score>=45?"D":"F";
    return {score:score,baseScore:baseScore,incidentPenalty:incidentPenalty,grade:grade,domains:results,missing:results.reduce(function(all,row){return all.concat(row.missing);},[])};
  }
  function fireEngine(input) {
    finite(input.area,10,1000000,"La surface doit être comprise entre 10 et 1 000 000 m².");
    finite(input.floors,1,300,"Le nombre d’étages doit être compris entre 1 et 300.");
    finite(input.occupants,1,1000000,"Le nombre d’occupants doit être compris entre 1 et 1 000 000.");
    if(!window.AfroToolsSecurityFire)throw new Error("Le moteur partagé de sécurité incendie est indisponible.");
    var result=window.AfroToolsSecurityFire.calculate(input);
    result.remediation=finite(input.remediationBudget,0,1000000000,"Saisissez le budget de remédiation à tester.");
    result.maintenance=finite(input.maintenanceBudget,0,1000000000,"Saisissez le budget d’entretien à tester.");
    result.currency=String(input.currencyLabel||"NGN ").trim().slice(0,12)+" ";
    return result;
  }
  function entropy(password) {
    var size=0;
    if(/[a-z]/.test(password))size+=26;if(/[A-Z]/.test(password))size+=26;if(/[0-9]/.test(password))size+=10;if(/[^a-zA-Z0-9]/.test(password))size+=32;
    return password.length*Math.log2(size||1);
  }
  function scorePassword(password) {
    if(!password)return 0;
    var score=Math.min(40,Math.round(entropy(password)*.8));
    if(password.length>=8)score+=5;if(password.length>=12)score+=5;if(password.length>=16)score+=5;
    if(/[a-z]/.test(password))score+=5;if(/[A-Z]/.test(password))score+=5;if(/[0-9]/.test(password))score+=5;if(/[^a-zA-Z0-9]/.test(password))score+=10;
    if(COMMON_PASSWORDS.indexOf(password.toLowerCase())>-1)score=Math.min(score,10);
    if(/^(.)\1+$/.test(password))score=Math.min(score,5);
    if(/^(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|qwe|wer|ert|rty|tyu|yui|uio|iop|asd|sdf|dfg|fgh|ghj|hjk|jkl|zxc|xcv|cvb|vbn|bnm)/.test(password.toLowerCase()))score-=10;
    return Math.max(0,Math.min(100,score));
  }
  function crackTime(bits) {
    var seconds=Math.pow(2,bits)/1e10;
    if(seconds<1)return "instantanément";if(seconds<60)return Math.round(seconds)+" secondes";if(seconds<3600)return Math.round(seconds/60)+" minutes";if(seconds<86400)return Math.round(seconds/3600)+" heures";if(seconds<2592000)return Math.round(seconds/86400)+" jours";if(seconds<31536000)return Math.round(seconds/2592000)+" mois";if(seconds<1e9)return Math.round(seconds/31536000)+" ans";if(seconds<1e12)return Math.round(seconds/31536000/1e6)+" millions d’années";return "plus d’un milliard d’années";
  }
  function secureIndex(max) {
    if(!Number.isInteger(max)||max<1||max>4294967296)throw new RangeError("Limite aléatoire invalide.");
    if(!window.crypto||typeof window.crypto.getRandomValues!=="function")throw new Error("Le générateur cryptographique du navigateur est indisponible.");
    var range=4294967296,limit=range-(range%max),values=new Uint32Array(1);
    do{window.crypto.getRandomValues(values);}while(values[0]>=limit);
    return values[0]%max;
  }
  function generatePassword(length) {
    var count=finite(length,12,128,"La longueur générée doit être comprise entre 12 et 128.");
    var alphabet="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*+-_=?:";
    var value="";
    for(var i=0;i<count;i++)value+=alphabet.charAt(secureIndex(alphabet.length));
    return value;
  }
  function generatePassphrase() {
    var wordsSource=window.AfroToolsFrenchPassphraseWords;
    if(!Array.isArray(wordsSource)||wordsSource.length!==2048||new Set(wordsSource).size!==2048)throw new Error("Le vocabulaire français de 2 048 mots est indisponible.");
    var words=[];
    for(var i=0;i<6;i++)words.push(wordsSource[secureIndex(wordsSource.length)]);
    return words.join("-");
  }

  var CHECK_LABELS={
    firewall:"Pare-feu déployé",vpn:"VPN pour les accès distants",wifi_secure:"Wi-Fi chiffré (WPA3/WPA2)",network_monitor:"Surveillance du trafic réseau",
    encryption:"Données chiffrées au repos",backup:"Sauvegardes régulières et testées",data_policy:"Politique de conservation/suppression",privacy_policy:"Politique de confidentialité publiée",
    mfa:"Authentification multifacteur (MFA)",least_priv:"Principe du moindre privilège",pw_policy:"Politique de mots de passe robustes",access_review:"Revue périodique des accès",
    antivirus:"Antivirus ou EDR sur les appareils",os_updates:"Mises à jour système et logiciel",device_policy:"Politique pour appareils mobiles/BYOD",
    sec_training:"Formation de sensibilisation",phishing_sim:"Exercices de phishing",sec_policy:"Politique de sécurité écrite",incident_plan:"Plan de réponse aux incidents",incident_drill:"Exercice de crise annuel"
  };
  var RECOMMENDATIONS={
    backup:"Mettre en place la règle 3-2-1 et tester la restauration chaque mois.",mfa:"Activer la MFA en priorité sur messagerie, banque et services cloud.",incident_plan:"Documenter qui isole, décide, conserve les preuves et contacte l’autorité.",encryption:"Activer le chiffrement complet des postes et supports.",os_updates:"Activer les mises à jour automatiques et suivre les exceptions.",firewall:"Déployer et configurer un pare-feu adapté au réseau.",pw_policy:"Exiger des phrases de passe longues et un gestionnaire fiable.",privacy_policy:"Publier une politique exacte et adaptée aux traitements réels.",antivirus:"Déployer une protection des terminaux et surveiller les alertes.",least_priv:"Retirer les droits administrateur inutiles.",sec_training:"Former les équipes avec des exemples adaptés.",wifi_secure:"Remplacer les identifiants par défaut et utiliser WPA3/WPA2.",access_review:"Désactiver rapidement les comptes des personnes parties.",data_policy:"Définir des durées de conservation et une suppression vérifiable.",network_monitor:"Mettre en place une surveillance réseau de base.",vpn:"Sécuriser les accès distants via un VPN administré.",device_policy:"Définir les règles BYOD et l’effacement à distance.",sec_policy:"Écrire une politique courte et applicable.",phishing_sim:"Tester régulièrement les réflexes sans piéger les salariés.",incident_drill:"Organiser un exercice de crise au moins une fois par an."
  };
  var FIRE_LABELS=[
    "Extincteurs adaptés, accessibles et contrôlés","Système fixe d’extinction si requis","Réseau de tuyaux ou dévidoirs vérifié","Réserve d’eau ou pompage incendie vérifié",
    "Détecteurs de fumée/chaleur testés","Alarme incendie audible et visible","Centrale et signalisation contrôlées","Sorties dégagées et suffisantes","Éclairage de secours testé",
    "Signalétique d’évacuation visible","Point de rassemblement défini","Plan d’évacuation affiché","Formation et exercice documentés","Registre d’inspection à jour",
    "Installation électrique inspectée","Structure et compartimentage examinés","Accès des secours dégagé"
  ];

  function field(label,name,type,value,options,help) {
    var control;
    if(options){control='<select class="frs-select" name="'+name+'" id="'+name+'">'+options.map(function(option){return '<option value="'+esc(option[0])+'"'+(String(option[0])===String(value)?" selected":"")+'>'+esc(option[1])+'</option>';}).join("")+"</select>";}
    else{control='<input class="frs-input" id="'+name+'" name="'+name+'" type="'+(type||"text")+'" value="'+esc(value==null?"":value)+'"'+(type==="number"?' inputmode="decimal"':"")+">";}
    return '<label class="frs-field" for="'+name+'"><span>'+esc(label)+'</span>'+control+(help?'<small class="frs-help">'+esc(help)+"</small>":"")+"</label>";
  }
  function actions(appId,options) {
    options=options||{};
    var html='<div class="frs-actions"><button class="frs-button" type="submit">'+esc(options.submit||"Calculer")+"</button>";
    if(!options.sensitive){
      html+='<button class="frs-button frs-button-secondary" type="reset" data-reset>Réinitialiser</button><button class="frs-button frs-button-secondary" type="button" data-copy>Copier le résumé</button><button class="frs-button frs-button-secondary" type="button" data-print>Imprimer / enregistrer en PDF</button>';
      if(options.reopen!==false)html+='<button class="frs-button frs-button-secondary" type="button" data-export>Exporter JSON</button><button class="frs-button frs-button-secondary" type="button" data-import>Rouvrir JSON</button><input class="frs-file" type="file" accept="application/json,.json" data-import-file aria-label="Choisir un export JSON à rouvrir">';
    }
    return html+'</div><p class="frs-status" id="'+appId+'-status" role="status" aria-live="polite"></p>';
  }
  function resultShell(appId) {
    return '<section class="frs-results" id="'+appId+'-results" tabindex="-1" aria-live="polite"><div data-result-content></div></section>';
  }
  function formValues(form) {
    var data={};
    Array.prototype.forEach.call(form.elements,function(control){if(!control.name||control.type==="file"||control.type==="password")return;if(control.type==="checkbox"){if(!data[control.name])data[control.name]=[];if(control.checked)data[control.name].push(control.value);}else data[control.name]=control.value;});
    return data;
  }
  function schemaControls(form) {
    var controls={};
    Array.prototype.forEach.call(form.elements,function(control){
      if(!control.name||control.type==="file"||control.type==="password"||control.type==="submit"||control.type==="reset"||control.type==="button")return;
      if(!controls[control.name])controls[control.name]=[];
      controls[control.name].push(control);
    });
    return controls;
  }
  function restoreValues(form,data) {
    var controls=schemaControls(form),expected=Object.keys(controls),received=Object.keys(data);
    if(expected.length!==received.length||expected.some(function(name){return !Object.prototype.hasOwnProperty.call(data,name);})||received.some(function(name){return !Object.prototype.hasOwnProperty.call(controls,name);}))throw new Error("Le fichier contient une option inconnue, un champ inconnu ou manquant.");
    expected.forEach(function(name){
      var group=controls[name],first=group[0],value=data[name];
      if(first.type==="checkbox"){
        if(!Array.isArray(value)||value.some(function(item){return typeof item!=="string";}))throw new Error("Le fichier contient une sélection invalide.");
        var allowed=group.map(function(item){return item.value;});
        if(value.some(function(item){return allowed.indexOf(item)===-1;}))throw new Error("Le fichier contient une option inconnue.");
        group.forEach(function(control){control.checked=value.indexOf(control.value)>-1;});
        return;
      }
      if(typeof value!=="string")throw new Error("Le fichier contient une valeur invalide.");
      if(first.tagName==="SELECT"&&!Array.prototype.some.call(first.options,function(option){return option.value===value;}))throw new Error("Le fichier contient une option inconnue.");
      first.value=value;
    });
  }
  function status(root,message,state) {
    var node=root.querySelector(".frs-status");if(!node)return;node.textContent=message||"";if(state)node.dataset.state=state;else delete node.dataset.state;
  }
  function showResult(root,html) {
    var result=root.querySelector(".frs-results");result.querySelector("[data-result-content]").innerHTML=html;result.dataset.visible="true";result.focus({preventScroll:true});result.scrollIntoView({behavior:window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
  }
  function clearResult(root) {
    var result=root.querySelector(".frs-results");
    if(!result)return;
    var content=result.querySelector("[data-result-content]");
    if(content)content.replaceChildren();
    result.dataset.visible="false";
  }
  function copyText(text,done,failed) {
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done).catch(function(){fallbackCopy(text,done,failed);});}else fallbackCopy(text,done,failed);
  }
  function fallbackCopy(text,done,failed) {
    try{var area=document.createElement("textarea");area.value=text;area.readOnly=true;area.style.position="fixed";area.style.opacity="0";document.body.appendChild(area);area.select();var ok=document.execCommand("copy");area.remove();if(ok)done();else failed();}catch(error){failed();}
  }
  function downloadJson(appId,data) {
    var blob=new Blob([JSON.stringify({schemaVersion:1,app:appId,locale:"fr",data:data},null,2)],{type:"application/json"});var url=URL.createObjectURL(blob);var link=document.createElement("a");link.href=url;link.download="afrotools-"+appId+"-fr.json";document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
  }
  function bindStandard(root,appId,calculate,summary,clearState) {
    var form=root.querySelector("form");
    function invalidate(){clearResult(root);if(clearState)clearState();}
    form.addEventListener("submit",function(event){event.preventDefault();invalidate();status(root,"");try{calculate(formValues(form));status(root,"Résultat prêt. Vérifiez les hypothèses et les sources locales.","success");}catch(error){status(root,error&&error.message?error.message:"Saisie invalide.","error");}});
    form.addEventListener("reset",function(){window.setTimeout(function(){invalidate();status(root,"Outil réinitialisé.","success");},0);});
    var copy=root.querySelector("[data-copy]");if(copy)copy.addEventListener("click",function(){var text=summary();if(!text){status(root,"Calculez d’abord un résultat.","error");return;}copyText(text,function(){status(root,"Résumé copié sans donnée secrète.","success");},function(){status(root,"Copie bloquée. Sélectionnez le résumé ou utilisez l’impression.","error");});});
    var print=root.querySelector("[data-print]");if(print)print.addEventListener("click",function(){if(!summary()){status(root,"Calculez d’abord un résultat.","error");return;}window.print();});
    var exportButton=root.querySelector("[data-export]"),importButton=root.querySelector("[data-import]"),file=root.querySelector("[data-import-file]");
    if(exportButton)exportButton.addEventListener("click",function(){downloadJson(appId,formValues(form));status(root,"Fichier JSON local exporté.","success");});
    if(importButton&&file)importButton.addEventListener("click",function(){file.click();});
    if(file)file.addEventListener("change",function(){var selected=file.files&&file.files[0];if(!selected)return;invalidate();if(selected.size>1048576){status(root,"Fichier trop volumineux. Limite : 1 Mo.","error");file.value="";return;}var reader=new FileReader();reader.onload=function(){try{var parsed=JSON.parse(String(reader.result||"")),keys=parsed&&typeof parsed==="object"&&!Array.isArray(parsed)?Object.keys(parsed):[];if(!parsed||keys.length!==4||["schemaVersion","app","locale","data"].some(function(key){return !Object.prototype.hasOwnProperty.call(parsed,key);})||parsed.schemaVersion!==1||parsed.app!==appId||parsed.locale!=="fr"||!parsed.data||typeof parsed.data!=="object"||Array.isArray(parsed.data))throw new Error("Ce fichier ne correspond pas à cet outil.");restoreValues(form,parsed.data);form.requestSubmit();status(root,"Fichier rouvert et résultat recalculé localement.","success");}catch(error){invalidate();status(root,error.message||"Fichier JSON invalide.","error");}finally{file.value="";}};reader.onerror=function(){invalidate();status(root,"Impossible de lire ce fichier local.","error");};reader.readAsText(selected);});
  }
  function metric(label,value,note){return '<div class="frs-metric"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong>'+(note?'<span>'+esc(note)+"</span>":"")+"</div>";}
  function table(headers,rows){return '<div class="frs-table-wrap"><table class="frs-table"><thead><tr>'+headers.map(function(item){return "<th>"+esc(item)+"</th>";}).join("")+"</tr></thead><tbody>"+rows.map(function(row){return "<tr>"+row.map(function(item,index){return '<td data-label="'+esc(headers[index]||"Valeur")+'">'+item+"</td>";}).join("")+"</tr>";}).join("")+"</tbody></table></div>";}
  function officialContext(context,intro){return '<aside class="frs-notice"><strong>'+esc(intro)+'</strong> '+esc(context.law)+'. '+(context.action?esc(context.action)+" ":"")+'<a href="'+esc(context.url)+'" target="_blank" rel="noopener noreferrer">'+esc(context.authority)+' — source officielle</a>.</aside>';}
  function countryOptions(extra){var base=[["NG","Nigeria"],["KE","Kenya"],["ZA","Afrique du Sud"],["GH","Ghana"],["EG","Égypte"]];if(extra)base.push(["TZ","Tanzanie"]);return base;}
  var HOME_OPTION_LABELS={
    country:{NG:"Nigeria (NGN)",KE:"Kenya (KES)",ZA:"Afrique du Sud (ZAR)",GH:"Ghana (GHS)",EG:"Égypte (EGP)",TZ:"Tanzanie (TZS)"},
    homeType:{flat:"Appartement",bungalow:"Maison de plain-pied",duplex:"Duplex / maison jumelée",mansion:"Grande propriété / concession"},
    riskLevel:{low:"Faible (résidence fermée, sécurité 24 h/24)",medium:"Moyen (quartier résidentiel)",high:"Élevé (zone plus exposée)"},
    securityLevel:{basic:"Essentiel (CCTV uniquement)",standard:"Standard (CCTV + alarme)",premium:"Renforcé (CCTV + alarme + gardiennage)"}
  };
  function homeContractField(label,id,help) {
    var control=sharedHomeSecurityEngine().CONTROL_CONTRACT.find(function(item){return item.id===id;});
    if(!control)throw new Error("Contrat de contrôle introuvable : "+id+".");
    return field(label,id,"",control.defaultValue,control.values.map(function(value){return [value,HOME_OPTION_LABELS[id][value]];}),help);
  }

  function renderCctv(root) {
    root.innerHTML='<div class="frs-app-head"><h2>Configurer le système CCTV</h2><p>Entrez vos propres devis et hypothèses : aucun prix de marché ni taux en direct n’est intégré.</p></div><form class="frs-form"><div class="frs-grid">'+
      field("Libellé de devise","currencyLabel","text","NGN",null,"Exemple : NGN, KES ou XOF.")+field("Nombre de caméras","cameras","number",4,null,"De 1 à 64.")+
      field("Type de caméra","cameraType","","ip",[["analog","Analogique"],["ip","IP"],["ptz","PTZ"],["dome","Dôme"],["bullet","Bullet"]])+
      field("Enregistreur","recorder","","nvr",[["dvr","DVR"],["nvr","NVR"],["cloud","Cloud"]])+field("Conservation","storage","","2",[["1","1 semaine"],["2","2 semaines"],["4","4 semaines"],["8","8 semaines"]])+
      field("Installation","installation","","professional",[["professional","Professionnelle"],["diy","À faire soi-même"]])+field("Surveillance mensuelle","monitoring","","yes",[["no","Non"],["yes","Oui"]])+
      field("Coût unitaire d’une caméra","cameraUnitCost","number",40000,null,"Hypothèse modifiable issue de votre devis.")+
      field("Nombre d’enregistreurs","recorderUnits","number",1,null,"Mettez 0 pour le cloud.")+
      field("Coût unitaire d’un enregistreur","recorderUnitCost","number",60000)+
      field("Unités de stockage","storageUnits","number",2,null,"Nombre d’unités facturées par le fournisseur.")+
      field("Coût unitaire du stockage","storageUnitCost","number",20000)+
      field("Devis total d’installation","installationTotal","number",32000)+
      field("Surveillance mensuelle","monitoringMonthly","number",15000)+
      field("Abonnement cloud mensuel","cloudMonthly","number",0,null,"Utilisé uniquement avec l’enregistreur cloud.")+
      "</div>"+actions("cctv-cost",{submit:"Calculer le coût CCTV"})+"</form>"+resultShell("cctv-cost");
    var last=null;
    bindStandard(root,"cctv-cost",function(input){last=cctvEngine(input);var s=last.currency;var rows=[["Caméras",s+fmt(last.totalCameras),String(last.cameras)],["Enregistreur",s+fmt(last.recorderCost),String(last.recorderUnits)],["Stockage",s+fmt(last.hddCost),String(last.hddCount)],["Installation",s+fmt(last.installCost),"—"]];showResult(root,'<div class="frs-result-hero"><div><span>Coût initial selon vos hypothèses</span><div class="frs-result-value">'+esc(s+fmt(last.setupTotal))+'</div><div class="frs-result-note">Coût mensuel saisi : '+esc(s+fmt(last.monthlyTotal))+'</div></div><strong>5 ans<br>'+esc(s+fmt(last.fiveYear))+'</strong></div><div class="frs-metrics">'+metric("Caméras",s+fmt(last.totalCameras))+metric("Enregistreur + stockage",s+fmt(last.recorderCost+last.hddCost))+metric("Installation",s+fmt(last.installCost))+metric("Par caméra",s+fmt(last.setupTotal/last.cameras))+"</div>"+table(["Élément","Coût saisi/calculé","Quantité"],rows)+'<p class="frs-notice"><strong>Frontière des données :</strong> tous les prix proviennent des champs que vous avez vérifiés ou modifiés; AfroTools ne fournit aucun prix fournisseur ou taux en direct.</p><p class="frs-notice frs-warning"><strong>À vérifier :</strong> compatibilité, couverture, vision nocturne, alimentation de secours, rétention, droits d’accès aux images, garantie et devis locaux.</p>');},function(){return last?["Estimation CCTV",last.currency+fmt(last.setupTotal)+" installation",last.currency+fmt(last.monthlyTotal)+" par mois",last.currency+fmt(last.fiveYear)+" sur cinq ans","Montants saisis par l’utilisateur; aucun prix de marché en direct."].join("\n"):"";},function(){last=null;});
  }
  function renderHome(root) {
    root.innerHTML='<div class="frs-app-head"><h2>Estimer une configuration comparable</h2><p>Choisissez le même pays, type de logement, niveau de risque déclaré et niveau de protection que dans l’application anglaise canonique.</p></div><form class="frs-form"><div class="frs-grid">'+
      homeContractField("Pays","country","Six marchés et devises, avec hypothèses illustratives intégrées.")+
      homeContractField("Type de logement","homeType","Ajuste la taille estimée du système CCTV.")+
      homeContractField("Niveau de risque du quartier","riskLevel","Déclaration de planification, pas évaluation de sécurité.")+
      homeContractField("Niveau de protection souhaité","securityLevel","Essentiel, standard ou renforcé selon le contrat canonique.")+
      "</div>"+actions("home-security-cost",{submit:"Calculer les coûts"})+"</form>"+resultShell("home-security-cost");
    var last=null,lastInput=null;
    bindStandard(root,"home-security-cost",function(input){
      last=calculateHomeSecurity(input);lastInput=input;var s=last.currency;
      var rows=[["Système CCTV",s+fmt(last.cctvSetup),s+fmt(last.maintenance),s+fmt(last.cctvSetup/5+last.maintenance*12),HOME_OPTION_LABELS.securityLevel[input.securityLevel]]];
      if(input.securityLevel!=="basic")rows.push(["Système d’alarme",s+fmt(last.alarmSetup),s+fmt(last.monitoring),s+fmt(last.alarmSetup/5+last.monitoring*12),"Avec surveillance"]);
      if(last.guardMonthly>0)rows.push(["Gardiennage","—",s+fmt(last.guardMonthly),s+fmt(last.guardMonthly*12),input.riskLevel==="high"?"Gardien armé dans l’hypothèse canonique":"Gardien non armé dans l’hypothèse canonique"]);
      rows.push(["TOTAL",s+fmt(last.totalSetup),s+fmt(last.totalMonthly),s+fmt(last.annualCost),"Scénario de planification"]);
      showResult(root,'<div class="frs-result-hero"><div><span>Coût d’installation estimé</span><div class="frs-result-value">'+esc(s+fmt(last.totalSetup))+'</div><div class="frs-result-note">Fonctionnement mensuel estimé : '+esc(s+fmt(last.totalMonthly))+'</div></div><strong>Coût annualisé<br>'+esc(s+fmt(last.annualCost))+'</strong></div><div class="frs-metrics">'+metric("Installation",s+fmt(last.totalSetup))+metric("Mensuel",s+fmt(last.totalMonthly))+metric("Total sur 5 ans",s+fmt(last.fiveYear))+metric("Contexte",HOME_OPTION_LABELS.homeType[input.homeType],HOME_OPTION_LABELS.riskLevel[input.riskLevel])+"</div>"+table(["Composant","Installation","Mensuel","Annualisé","Hypothèse"],rows)+'<p class="frs-notice"><strong>Source et fraîcheur :</strong> barèmes illustratifs intégrés pour six marchés, hérités du propriétaire anglais et revus avec ce contrat le 29 juillet 2026. Il ne s’agit ni de prix fournisseurs, ni d’un flux en direct.</p><p class="frs-notice"><strong>Confiance :</strong> élevée pour la reproductibilité de la formule entre les versions anglaise et française; faible pour un prix local actuel sans visite du site ni devis détaillé.</p><p class="frs-notice frs-warning">Demandez une visite du site couvrant entrées, angles morts, éclairage, panne électrique/réseau, stockage, confidentialité, maintenance, licence du gardiennage et conditions de l’assureur. Aucun niveau ne garantit la sécurité, un ROI ou une remise d’assurance.</p>');
    },function(){return last?["Estimation de sécurité du logement",HOME_OPTION_LABELS.country[lastInput.country]+" — "+HOME_OPTION_LABELS.homeType[lastInput.homeType],HOME_OPTION_LABELS.riskLevel[lastInput.riskLevel]+" — "+HOME_OPTION_LABELS.securityLevel[lastInput.securityLevel],last.currency+fmt(last.totalSetup)+" installation",last.currency+fmt(last.totalMonthly)+" par mois",last.currency+fmt(last.annualCost)+" coût annualisé",last.currency+fmt(last.fiveYear)+" sur cinq ans","Barèmes illustratifs intégrés; aucune garantie de sécurité, de ROI ou d’assurance."].join("\n"):"";},function(){last=null;lastInput=null;});
    root.querySelector("form").addEventListener("change",function(){if(root.querySelector(".frs-results").dataset.visible==="true"){clearResult(root);last=null;lastInput=null;status(root,"Paramètres modifiés : le résultat précédent a été effacé. Recalculez pour obtenir une estimation à jour.");}});
  }
  function renderBreach(root) {
    root.innerHTML='<div class="frs-app-head"><h2>Construire un scénario de violation</h2><p>Entrez vos budgets de réponse et votre taux de change. Les amendes sont exclues : elles dépendent des faits et du droit applicable.</p></div><form class="frs-form"><div class="frs-grid">'+
      field("Pays (contexte juridique)","country","","NG",countryOptions(false))+field("Libellé de devise locale","currencyLabel","text","NGN")+field("Taux local pour 1 USD","exchangeRate","number",1660,null,"Hypothèse saisie, jamais un taux en direct.")+
      field("Enregistrements exposés","records","number",10000,null,"De 1 à 100 000 000.")+field("Coût de base par enregistrement (USD)","basePerRecord","number",165)+
      field("Sensibilité","sensitivity","","medium",[["low","Faible × 0,7"],["medium","Moyenne × 1"],["high","Élevée × 1,4"],["critical","Critique × 1,9"]])+field("Délai de détection","detection","","medium",[["fast","Rapide × 0,85"],["medium","Moyen × 1"],["slow","Lent × 1,35"]])+
      field("Notifications (USD)","notificationCost","number",20000)+field("Investigation numérique (USD)","forensicsCost","number",37500)+
      field("Conseil juridique (USD)","legalCost","number",50000)+field("Communication de crise (USD)","communicationCost","number",20000)+
      field("Remédiation (USD)","remediationCost","number",62500)+field("Interruption d’activité (USD)","downtimeCost","number",80000)+
      "</div>"+actions("data-breach-cost",{submit:"Estimer le coût"})+"</form>"+resultShell("data-breach-cost");
    var last=null;
    bindStandard(root,"data-breach-cost",function(input){last=breachEngine(input);var r=last.rows,s=last.currency,authority=BREACH_AUTHORITIES[input.country]||BREACH_AUTHORITIES.NG;var rows=[["Coût par enregistrement","$"+fmt(r.recordCost)],["Notifications","$"+fmt(r.notification)],["Investigation numérique","$"+fmt(r.forensics)],["Conseil juridique/réglementaire","$"+fmt(r.legal)],["Communication de crise","$"+fmt(r.pr)],["Remédiation","$"+fmt(r.remediation)],["Interruption d’activité","$"+fmt(r.downtime)]];showResult(root,'<div class="frs-result-hero"><div><span>Scénario total selon vos hypothèses</span><div class="frs-result-value">$'+fmt(last.totalUSD)+'</div><div class="frs-result-note">Conversion saisie : '+esc(s+fmt(last.totalLocal))+'</div></div><strong>Par enregistrement<br>$'+fmt(last.perRecord,2)+'</strong></div><div class="frs-metrics">'+metric("Enregistrements",fmt(last.records))+metric("Coût total","$"+fmt(last.totalUSD))+metric("Par enregistrement","$"+fmt(last.perRecord,2))+metric("Taux saisi","1 USD = "+fmt(last.exchangeRate,2)+" "+s.trim())+"</div>"+table(["Poste","USD saisis/calculés"],rows)+'<p class="frs-notice"><strong>Frontière des données :</strong> les coûts de réponse et le taux de change viennent de vos champs; les sources officielles ci-dessous couvrent les obligations, pas ces valeurs.</p>'+officialContext(authority,"Contexte du pays :")+'<p class="frs-notice frs-danger"><strong>Incident réel :</strong> isolez sans détruire les preuves, activez le plan de réponse, faites qualifier les obligations de notification et utilisez le canal actuel de l’autorité compétente.</p>');},function(){return last?["Scénario de violation de données","$"+fmt(last.totalUSD),last.currency+fmt(last.totalLocal)+" conversion saisie","$"+fmt(last.perRecord,2)+" par enregistrement","Coûts et taux saisis par l’utilisateur; amendes non estimées."].join("\n"):"";},function(){last=null;});
  }
  function renderCyber(root) {
    var checks=Object.keys(CHECK_LABELS).map(function(id){return '<label class="frs-check"><input type="checkbox" name="checks" value="'+id+'"><span>'+esc(CHECK_LABELS[id])+"</span></label>";}).join("");
    root.innerHTML='<div class="frs-app-head"><h2>Autoévaluation transparente</h2><p>Chaque contrôle coché vaut cinq points. Un incident mineur retire 5 points et un incident majeur 15 points; le résultat affiche cette déduction.</p></div><form class="frs-form"><div class="frs-grid">'+
      field("Pays","country","","NG",countryOptions(false))+field("Secteur","industry","","services",[["services","Services"],["retail","Commerce"],["finance","Finance"],["health","Santé"],["education","Éducation"],["ngo","ONG"]])+field("Effectif","employees","","1-10",[["1-10","1–10"],["11-50","11–50"],["51-250","51–250"],["250+","Plus de 250"]])+field("Sensibilité des données","dataSensitivity","","medium",[["low","Faible"],["medium","Moyenne"],["high","Élevée"]])+field("Incidents récents","incidents","","none",[["none","Aucun (0 point)"],["minor","Mineur (−5 points)"],["major","Majeur (−15 points)"]])+
      '</div><fieldset class="frs-check-group"><legend class="frs-legend">Contrôles réellement en place et vérifiables</legend><div class="frs-checks">'+checks+"</div></fieldset>"+actions("cybersecurity-assessment",{submit:"Lancer l’évaluation"})+"</form>"+resultShell("cybersecurity-assessment");
    var last=null;
    bindStandard(root,"cybersecurity-assessment",function(input){last=cyberEngine(input);var authority=CYBER_AUTHORITIES[input.country]||CYBER_AUTHORITIES.NG;var labels={A:"Risque faible — posture solide",B:"Risque modéré — quelques écarts",C:"Risque élevé — plusieurs écarts critiques",D:"Risque fort — vulnérabilités importantes",F:"Risque critique — action immédiate"};var priorities=last.missing.slice().sort(function(a,b){var order=["backup","mfa","incident_plan","encryption","os_updates","firewall","pw_policy","privacy_policy","antivirus","least_priv","sec_training"];return (order.indexOf(a)<0?99:order.indexOf(a))-(order.indexOf(b)<0?99:order.indexOf(b));}).slice(0,3);var rows=last.domains.map(function(row){return [esc(row.label),row.score+"/"+row.max,Math.round(row.score/row.max*100)+" %"];});showResult(root,'<div class="frs-result-hero"><div><span>Score global</span><div class="frs-result-value">'+last.score+'/100</div><div class="frs-result-note">'+esc(labels[last.grade])+'</div></div><strong>Note<br>'+last.grade+'</strong></div><div class="frs-metrics">'+metric("Contrôles",last.baseScore+"/100")+metric("Déduction incident","−"+last.incidentPenalty+" points")+metric("Score final",last.score+"/100")+"</div>"+table(["Domaine","Points","Taux"],rows)+'<h3 style="margin-top:20px">Priorités</h3><ol>'+priorities.map(function(id){return "<li><strong>"+esc(CHECK_LABELS[id])+"</strong> — "+esc(RECOMMENDATIONS[id]||"Vérifier et mettre en œuvre ce contrôle.")+"</li>";}).join("")+'</ol>'+officialContext(authority,"Cadre national à vérifier :")+'<aside class="frs-notice"><strong>Calcul explicite :</strong> '+last.baseScore+' points de contrôles − '+last.incidentPenalty+' points liés à l’incident déclaré = '+last.score+'/100.</aside><aside class="frs-notice"><strong>Cadre de contrôle :</strong> comparez aussi les preuves aux six fonctions du <a href="https://www.nist.gov/cyberframework" target="_blank" rel="noopener noreferrer">NIST Cybersecurity Framework 2.0</a>. Cette référence ne remplace pas la loi ni les exigences sectorielles.</aside><p class="frs-notice frs-warning">Ce score n’est ni un audit, ni une certification, ni une conclusion juridique. Conservez des preuves et vérifiez la loi, le régulateur, le secteur et les faits de tout incident.</p>');},function(){return last?["Autoévaluation cybersécurité",last.baseScore+"/100 contrôles","−"+last.incidentPenalty+" points incident",last.score+"/100 — note "+last.grade,"Checklist de planification uniquement; contrôles et obligations à vérifier."].join("\n"):"";},function(){last=null;});
  }
  function renderFire(root) {
    var weights=window.AfroToolsSecurityFire&&window.AfroToolsSecurityFire.WEIGHTS||[];
    var checks=FIRE_LABELS.map(function(label,index){var id="c"+(index+1),points=weights[index];return '<label class="frs-check"><input type="checkbox" name="checks" value="'+id+'"><span>'+esc(label)+(points?" — "+points+" points":"")+"</span></label>";}).join("");
    root.innerHTML='<div class="frs-app-head"><h2>Revue de préparation incendie</h2><p>Marquez uniquement les éléments vérifiés par une preuve récente.</p></div><form class="frs-form"><div class="frs-grid">'+
      field("Pays","country","","NG",[["NG","Nigeria"],["KE","Kenya"],["ZA","Afrique du Sud"],["GH","Ghana"]])+field("Type de site","propType","","office",[["office","Bureau"],["warehouse","Entrepôt"],["retail","Commerce"],["restaurant","Restaurant"],["hospital","Établissement de santé"],["school","École"]])+field("Surface (m²)","area","number",500)+field("Étages","floors","number",2)+field("Occupants","occupants","number",50)+field("Libellé de devise","currencyLabel","text","NGN")+field("Budget de remédiation à tester","remediationBudget","number",250000,null,"Votre estimation ou devis; aucun prix de marché intégré.")+field("Budget d’entretien à tester","maintenanceBudget","number",12500,null,"Votre hypothèse de période, à documenter dans le dossier.")+
      '</div><fieldset class="frs-check-group"><legend class="frs-legend">17 contrôles — 100 points pondérés</legend><div class="frs-checks">'+checks+"</div></fieldset>"+actions("fire-safety-checklist",{submit:"Évaluer la préparation"})+"</form>"+resultShell("fire-safety-checklist");
    var last=null;
    bindStandard(root,"fire-safety-checklist",function(input){last=fireEngine(input);var authority=FIRE_AUTHORITIES[input.country]||FIRE_AUTHORITIES.NG;var grade=last.score>=85?"Préparation solide — à vérifier sur site":last.score>=70?"Bonne préparation — revoir les écarts":last.score>=50?"Préparation partielle — actions requises":"Préparation faible — revue urgente";var rows=last.failed.slice().sort(function(a,b){return b.points-a.points;}).slice(0,10).map(function(item){return [esc(FIRE_LABELS[Number(item.id.slice(1))-1]),item.points+" points",item.points>=7?"Critique":item.points>=4?"Élevée":"Moyenne"];});showResult(root,'<div class="frs-result-hero"><div><span>Score de préparation</span><div class="frs-result-value">'+last.score+'/100</div><div class="frs-result-note">'+esc(grade)+'</div></div><strong>Budget de remédiation saisi<br>'+esc(last.currency+fmt(last.remediation))+'</strong></div><div class="frs-metrics">'+metric("Score",last.score+" %")+metric("Écarts",String(last.failed.length))+metric("Budget saisi",last.currency+fmt(last.remediation))+metric("Entretien saisi",last.currency+fmt(last.maintenance))+"</div>"+(rows.length?table(["Action","Poids","Priorité"],rows):'<p class="frs-notice">Tous les points sont marqués comme vérifiés. Maintenez les preuves et organisez les inspections requises.</p>')+'<p class="frs-notice"><strong>Frontière des données :</strong> le score additionne les poids visibles des 17 contrôles (100 points au total); les deux budgets viennent uniquement de vos champs et ne sont pas des estimations AfroTools.</p>'+officialContext(authority,"Autorité et exigences à vérifier :")+'<p class="frs-notice frs-warning">Ce résultat n’est ni une inspection, ni un certificat, ni un verdict de conformité, ni une consigne d’urgence.</p>');},function(){return last?["Préparation sécurité incendie",last.score+"/100",last.currency+fmt(last.remediation)+" budget de remédiation saisi","Ni inspection, ni certificat, ni verdict de conformité."].join("\n"):"";},function(){last=null;});
  }
  function renderPassword(root) {
    root.innerHTML='<div class="frs-app-head"><h2>Analyser localement un exemple</h2><p>Le champ n’est ni enregistré, ni copié, ni exporté. Évitez tout mot de passe réellement utilisé.</p></div><form class="frs-form" autocomplete="off"><label class="frs-field" for="password"><span>Mot de passe à tester</span><div class="frs-password-wrap"><input class="frs-input" id="password" name="password" type="password" autocomplete="new-password" autocorrect="off" autocapitalize="off" spellcheck="false"><button class="frs-password-toggle" type="button" data-toggle aria-label="Afficher le mot de passe">Afficher</button></div><small class="frs-help">Aucune requête, sauvegarde, copie, impression ou export du secret.</small></label><div class="frs-scorebar" aria-hidden="true"><span data-scorebar style="width:0"></span></div>'+actions("password-strength",{submit:"Analyser",sensitive:true})+"</form>"+resultShell("password-strength");
    var input=root.querySelector("#password"),toggle=root.querySelector("[data-toggle]"),form=root.querySelector("form");
    toggle.addEventListener("click",function(){var show=input.type==="password";input.type=show?"text":"password";toggle.textContent=show?"Masquer":"Afficher";toggle.setAttribute("aria-label",(show?"Masquer":"Afficher")+" le mot de passe");});
    function suggestionHtml(){return '<section class="frs-notice frs-password-suggestions" aria-labelledby="frs-password-suggestions"><h3 id="frs-password-suggestions">Suggestions générées localement</h3><p><strong>Identifiant aléatoire de 16 caractères :</strong> <code data-generated-password>'+esc(generatePassword(16))+'</code></p><p><strong>Phrase de passe de six mots :</strong> <code data-generated-passphrase>'+esc(generatePassphrase())+'</code></p><button class="frs-button frs-button-secondary" type="button" data-regenerate>Régénérer localement</button><p class="frs-help">Le navigateur tire uniformément six mots parmi 2 048 avec <code>crypto.getRandomValues</code>, soit 66 bits de sélection aléatoire. Le vocabulaire français BIP-39 est utilisé uniquement comme liste de mots, jamais comme phrase de récupération. L’outil ne propose aucun bouton de copie, d’export ou d’enregistrement et masque ces suggestions à l’impression.</p></section>';}
    function bindRegenerate(){var button=root.querySelector("[data-regenerate]");if(!button)return;button.addEventListener("click",function(){root.querySelector("[data-generated-password]").textContent=generatePassword(16);root.querySelector("[data-generated-passphrase]").textContent=generatePassphrase();status(root,"Nouvelles suggestions générées localement.","success");});}
    function analyze(){var value=input.value;if(!value){root.querySelector("[data-scorebar]").style.width="0";root.querySelector(".frs-results").dataset.visible="false";status(root,"Saisissez un exemple non utilisé.");return;}var score=scorePassword(value),bits=entropy(value),band=score>=60?"strong":score>=40?"fair":"weak";var bar=root.querySelector("[data-scorebar]");bar.style.width=score+"%";bar.dataset.band=band;var checks=[["Au moins 12 caractères",value.length>=12],["Minuscules",/[a-z]/.test(value)],["Majuscules",/[A-Z]/.test(value)],["Chiffres",/[0-9]/.test(value)],["Caractères spéciaux",/[^a-zA-Z0-9]/.test(value)],["Absent de la petite liste locale",COMMON_PASSWORDS.indexOf(value.toLowerCase())===-1]];showResult(root,'<div class="frs-result-hero"><div><span>Score heuristique</span><div class="frs-result-value">'+score+'/100</div><div class="frs-result-note">Entropie estimée : '+bits.toFixed(1)+' bits</div></div><strong>Temps indicatif<br>'+esc(crackTime(bits))+'</strong></div><div class="frs-metrics">'+metric("Longueur",String(value.length))+metric("Entropie",bits.toFixed(0)+" bits")+metric("Types utilisés",String([/[a-z]/,/[A-Z]/,/[0-9]/,/[^a-zA-Z0-9]/].filter(function(regex){return regex.test(value);}).length)+"/4")+metric("Score",score+"/100")+'</div><ul>'+checks.map(function(item){return "<li>"+(item[1]?"✓":"✗")+" "+esc(item[0])+"</li>";}).join("")+'</ul>'+suggestionHtml()+'<p class="frs-notice frs-warning">Ce score ne détecte ni la réutilisation, ni toutes les fuites connues, ni le phishing, ni les logiciels malveillants. Utilisez un gestionnaire fiable, une phrase de passe longue et la MFA. Consultez les <a href="https://pages.nist.gov/800-63-4/sp800-63b.html#passwordver" target="_blank" rel="noopener noreferrer">recommandations NIST SP 800-63B</a>.</p>');bindRegenerate();status(root,"Analyse terminée entièrement dans ce navigateur.","success");}
    form.addEventListener("submit",function(event){event.preventDefault();analyze();});input.addEventListener("input",analyze);
  }

  var PHISHING_QUESTIONS=[
    {scenario:"EMAIL — « Votre compte bancaire sera fermé sous 24 h. Cliquez sur gtbank-secure-verify.net et confirmez vos données. »",question:"Quel est le réflexe le plus sûr ?",options:["Cliquer immédiatement","Ouvrir l’application bancaire ou le site officiel indépendamment","Transférer le message à un ami"],answer:1,explanation:"Le domaine ressemblant et la pression sont des signaux de phishing. N’utilisez ni le lien ni les coordonnées du message."},
    {scenario:"SMS — « Vous avez gagné 500 000 ₦. Envoyez BVN, code PIN et numéro de compte à une adresse Gmail. »",question:"Que faire ?",options:["Envoyer les informations","Supprimer et signaler sans répondre","Répondre STOP"],answer:1,explanation:"Une récompense exigeant des identifiants bancaires par messagerie est une fraude. Vérifiez toute promotion dans l’application officielle."},
    {scenario:"EMAIL fiscal synthétique — l’expéditeur et le lien affichent un domaine officiel, avec un numéro d’assistance non vérifié.",question:"Le texte affiché suffit-il à prouver l’authenticité ?",options:["Oui, le domaine affiché suffit","Non, tous les messages fiscaux sont faux","Non : ouvrir soi-même le portail officiel"],answer:2,explanation:"Le texte visible et l’expéditeur peuvent être falsifiés. Ouvrez indépendamment le portail de l’autorité."},
    {scenario:"WHATSAPP — Un inconnu propose 30 % d’un héritage de 4,5 M$ si vous gardez le secret et répondez.",question:"De quel type de message s’agit-il ?",options:["Affaire juridique probable","Fraude à l’avance de frais","Héritage à vérifier en répondant"],answer:1,explanation:"Héritage inattendu, récompense énorme et secret imposé sont des signaux classiques de fraude."},
    {scenario:"EMAIL emploi — offre sans entretien, domaine ressemblant à une grande marque et frais de contrôle à payer sur un compte personnel.",question:"Quelle conclusion est la plus sûre ?",options:["L’entreprise existe donc l’offre est sûre","C’est une fraude à l’emploi","Payer pour voir"],answer:1,explanation:"Une offre non sollicitée avec paiement demandé et domaine ressemblant doit être vérifiée sur le site carrière ouvert indépendamment."},
    {scenario:"SMS opérateur — « SIM désactivée sous 48 h », avec lien raccourci bit.ly pour mettre à jour le KYC.",question:"Que faire ?",options:["Cliquer vu l’urgence","Ouvrir l’application/site officiel ou aller en agence","Rappeler l’expéditeur"],answer:1,explanation:"Le lien raccourci masque la destination. Utilisez uniquement un canal officiel ouvert indépendamment."},
    {scenario:"EMAIL — alerte de débit non reconnu avec un numéro à appeler immédiatement. Les coordonnées de cet exemple sont fictives.",question:"Comment réagir ?",options:["Appeler le numéro du message","Utiliser le numéro de la carte, de l’application ou du site officiel","Répondre à l’email"],answer:1,explanation:"Vérifiez par un canal connu. Les coordonnées affichées dans un message peuvent être falsifiées."},
    {scenario:"WHATSAPP — Un contact prétend avoir perdu son téléphone et demande un virement urgent vers un autre nom, tout en interdisant d’appeler.",question:"Quel est le meilleur réflexe ?",options:["Envoyer car le contact est enregistré","Vérifier par un autre canal déjà connu","Poser des questions dans le même chat"],answer:1,explanation:"Urgence, nouveau numéro, bénéficiaire différent et refus d’appel évoquent une usurpation de compte."},
    {scenario:"EMAIL — support@paypa1.com demande de confirmer un compte « PayPal » sur paypa1.com.",question:"Quel détail est déterminant ?",options:["Le mot Support","Le chiffre 1 remplace la lettre l dans le domaine","Il faut cliquer pour savoir"],answer:1,explanation:"Le domaine homographe paypa1.com n’est pas paypal.com. Saisissez vous-même l’adresse officielle."},
    {scenario:"MESSAGE SOCIAL — un compte récent imitant une banque centrale garantit 140 % de rendement et demande un paiement par message privé.",question:"De quoi s’agit-il ?",options:["Programme public crédible","Fraude à l’investissement","Offre à approfondir en message privé"],answer:1,explanation:"Rendement extrême garanti, usurpation, paiement privé et rareté artificielle sont des signaux de fraude."}
  ];
  function renderPhishing(root) {
    root.innerHTML='<div class="frs-app-head"><h2>10 situations synthétiques</h2><p>Aucune adresse, offre, personne ou coordonnée de ces exemples ne doit être considérée comme réelle.</p></div><div class="frs-form" data-quiz><div data-start><button class="frs-button" type="button" data-start-button>Commencer le quiz</button></div><div data-question hidden><div class="frs-progress" aria-hidden="true"><span data-progress style="width:0"></span></div><p data-progress-label></p><div data-question-content></div><div class="frs-actions"><button class="frs-button" type="button" data-next hidden>Question suivante</button></div></div><p class="frs-status" role="status" aria-live="polite"></p></div>'+resultShell("phishing-quiz");
    var index=0,score=0,answers=[],questionWrap=root.querySelector("[data-question]"),content=root.querySelector("[data-question-content]"),next=root.querySelector("[data-next]"),lastSummary="";
    function renderQuestion(){var q=PHISHING_QUESTIONS[index];root.querySelector("[data-progress]").style.width=((index+1)/PHISHING_QUESTIONS.length*100)+"%";root.querySelector("[data-progress-label]").textContent="Question "+(index+1)+" sur "+PHISHING_QUESTIONS.length+" — score "+score;content.innerHTML='<div class="frs-scenario">'+esc(q.scenario)+'</div><h3 tabindex="-1">'+esc(q.question)+'</h3><div class="frs-options" role="group">'+q.options.map(function(option,i){return '<button class="frs-option" type="button" data-answer="'+i+'">'+esc(option)+"</button>";}).join("")+'</div><p class="frs-notice" data-explanation hidden></p>';content.querySelector("h3").focus({preventScroll:true});next.hidden=true;}
    root.querySelector("[data-start-button]").addEventListener("click",function(){index=0;score=0;answers=[];root.querySelector("[data-start]").hidden=true;questionWrap.hidden=false;root.querySelector(".frs-results").dataset.visible="false";renderQuestion();});
    content.addEventListener("click",function(event){var button=event.target.closest("[data-answer]");if(!button||answers[index])return;var q=PHISHING_QUESTIONS[index],selected=Number(button.dataset.answer),correct=selected===q.answer;if(correct)score++;answers[index]={selected:selected,correct:correct};Array.prototype.forEach.call(content.querySelectorAll("[data-answer]"),function(option){option.disabled=true;var value=Number(option.dataset.answer);if(value===q.answer)option.dataset.result="correct";else if(value===selected)option.dataset.result="wrong";});var explanation=content.querySelector("[data-explanation]");explanation.hidden=false;explanation.textContent=q.explanation;next.hidden=false;next.textContent=index===PHISHING_QUESTIONS.length-1?"Voir les résultats":"Question suivante";next.focus();});
    next.addEventListener("click",function(){if(index<PHISHING_QUESTIONS.length-1){index++;renderQuestion();return;}questionWrap.hidden=true;var grade=score>=9?"Résultat solide":score>=6?"En progression":"À retravailler";lastSummary=["Résumé du quiz phishing","Score : "+score+"/10 — "+grade,"Réflexes : ouvrir soi-même l’application ou le site officiel; ne jamais partager mot de passe, PIN ou code à usage unique; vérifier par un canal connu; signaler les messages suspects.","Quiz à exemples fixes, pas une note de sécurité."].join("\n");showResult(root,'<div class="frs-result-hero"><div><span>Score final</span><div class="frs-result-value">'+score+'/10</div><div class="frs-result-note">'+grade+' — résultat de formation, pas note de sécurité</div></div><strong>'+answers.filter(function(a){return a.correct;}).length+' réponses correctes</strong></div><p class="frs-notice">Ouvrez vous-même les applications et sites officiels, vérifiez via un canal connu et ne cédez jamais à l’urgence d’un message.</p><div class="frs-actions"><button class="frs-button frs-button-secondary" type="button" data-quiz-copy>Copier le résumé non sensible</button><button class="frs-button frs-button-secondary" type="button" data-quiz-print>Imprimer / PDF</button><button class="frs-button" type="button" data-restart>Recommencer</button></div>');var result=root.querySelector(".frs-results");result.querySelector("[data-quiz-copy]").addEventListener("click",function(){copyText(lastSummary,function(){status(root,"Résumé de formation copié.","success");},function(){status(root,"Copie bloquée.","error");});});result.querySelector("[data-quiz-print]").addEventListener("click",function(){window.print();});result.querySelector("[data-restart]").addEventListener("click",function(){root.querySelector("[data-start]").hidden=false;result.dataset.visible="false";root.querySelector("[data-start-button]").focus();});});
  }

  var RENDERERS={"cctv-cost":renderCctv,"home-security-cost":renderHome,"data-breach-cost":renderBreach,"cybersecurity-assessment":renderCyber,"fire-safety-checklist":renderFire,"password-strength":renderPassword,"phishing-quiz":renderPhishing};
  function mount() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-fr-security-app]"),function(root){var id=root.getAttribute("data-fr-security-app"),renderer=RENDERERS[id];if(renderer)renderer(root);else root.innerHTML='<p class="frs-notice frs-danger">Outil indisponible.</p>';});
  }
  window.AfroToolsFrenchSecurity={engines:{cctv:cctvEngine,homeSecurity:calculateHomeSecurity,dataBreach:breachEngine,cybersecurity:cyberEngine,fireSafety:fireEngine,passwordScore:scorePassword,passwordEntropy:entropy,generatePassword:generatePassword,generatePassphrase:generatePassphrase},mount:mount};
  if(document){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();}
})(typeof window!=="undefined"?window:this,typeof document!=="undefined"?document:null);

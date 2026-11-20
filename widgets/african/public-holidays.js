window.AfroWidgets = window.AfroWidgets || {};
window.AfroWidgets.publicHolidays = function(root, options) {
  const archive={NG:[{d:"2025-01-01",n:"New Year's Day"},{d:"2025-03-30",n:"Eid al-Fitr (est.)"},{d:"2025-03-31",n:"Eid al-Fitr Day 2"},{d:"2025-04-18",n:"Good Friday"},{d:"2025-04-21",n:"Easter Monday"},{d:"2025-05-01",n:"Workers' Day"},{d:"2025-06-06",n:"Eid al-Adha (est.)"},{d:"2025-06-07",n:"Eid al-Adha Day 2"},{d:"2025-06-12",n:"Democracy Day"},{d:"2025-09-05",n:"Eid al-Maulid (est.)"},{d:"2025-10-01",n:"Independence Day"},{d:"2025-12-25",n:"Christmas Day"},{d:"2025-12-26",n:"Boxing Day"}],KE:[{d:"2025-01-01",n:"New Year's Day"},{d:"2025-03-30",n:"Eid al-Fitr (est.)"},{d:"2025-04-18",n:"Good Friday"},{d:"2025-04-21",n:"Easter Monday"},{d:"2025-05-01",n:"Labour Day"},{d:"2025-06-01",n:"Madaraka Day"},{d:"2025-06-06",n:"Eid al-Adha (est.)"},{d:"2025-10-10",n:"Huduma Day"},{d:"2025-10-20",n:"Mashujaa Day"},{d:"2025-12-12",n:"Jamhuri Day"},{d:"2025-12-25",n:"Christmas Day"},{d:"2025-12-26",n:"Boxing Day"}],ZA:[{d:"2025-01-01",n:"New Year's Day"},{d:"2025-03-21",n:"Human Rights Day"},{d:"2025-04-18",n:"Good Friday"},{d:"2025-04-21",n:"Family Day"},{d:"2025-04-27",n:"Freedom Day"},{d:"2025-05-01",n:"Workers' Day"},{d:"2025-06-16",n:"Youth Day"},{d:"2025-08-09",n:"Women's Day"},{d:"2025-09-24",n:"Heritage Day"},{d:"2025-12-16",n:"Reconciliation"},{d:"2025-12-25",n:"Christmas Day"},{d:"2025-12-26",n:"Day of Goodwill"}],GH:[{d:"2025-01-01",n:"New Year's Day"},{d:"2025-01-07",n:"Constitution Day"},{d:"2025-03-06",n:"Independence Day"},{d:"2025-03-30",n:"Eid al-Fitr (est.)"},{d:"2025-04-18",n:"Good Friday"},{d:"2025-04-21",n:"Easter Monday"},{d:"2025-05-01",n:"May Day"},{d:"2025-05-25",n:"Africa Day"},{d:"2025-06-06",n:"Eid al-Adha (est.)"},{d:"2025-07-01",n:"Republic Day"},{d:"2025-08-04",n:"Founders' Day"},{d:"2025-09-21",n:"Nkrumah Day"},{d:"2025-12-25",n:"Christmas Day"},{d:"2025-12-26",n:"Boxing Day"}],EG:[{d:"2025-01-07",n:"Coptic Christmas"},{d:"2025-01-25",n:"Revolution Day"},{d:"2025-03-30",n:"Eid al-Fitr (est.)"},{d:"2025-04-20",n:"Coptic Easter"},{d:"2025-04-21",n:"Sham el-Nessim"},{d:"2025-04-25",n:"Sinai Liberation"},{d:"2025-05-01",n:"Labour Day"},{d:"2025-06-06",n:"Eid al-Adha (est.)"},{d:"2025-06-30",n:"June 30 Revolution"},{d:"2025-07-23",n:"Revolution Day"},{d:"2025-10-06",n:"Armed Forces Day"},{d:"2025-09-05",n:"Mawlid al-Nabi (est.)"}],TZ:[{d:"2025-01-01",n:"New Year's Day"},{d:"2025-01-12",n:"Zanzibar Revolution"},{d:"2025-03-30",n:"Eid al-Fitr (est.)"},{d:"2025-04-07",n:"Karume Day"},{d:"2025-04-18",n:"Good Friday"},{d:"2025-04-21",n:"Easter Monday"},{d:"2025-04-26",n:"Union Day"},{d:"2025-05-01",n:"Workers' Day"},{d:"2025-06-06",n:"Eid al-Adha (est.)"},{d:"2025-07-07",n:"Saba Saba"},{d:"2025-08-08",n:"Nane Nane"},{d:"2025-09-05",n:"Maulid (est.)"},{d:"2025-12-09",n:"Independence Day"},{d:"2025-12-25",n:"Christmas Day"},{d:"2025-12-26",n:"Boxing Day"}]};
  const translations={
      "Working Days Calculator": "Calculateur de jours ouvrés",
      "Start Date": "Date de début",
      "End Date": "Date de fin",
      "Country (for public holidays)": "Pays du calendrier",
      Nigeria: "Nigéria",
      Kenya: "Kenya",
      "South Africa": "Afrique du Sud",
      Ghana: "Ghana",
      "No holidays (weekends only)": "Aucun calendrier (week-ends uniquement)",
      Calculate: "Calculer",
      "Working Days": "Jours ouvrés",
      Calendar: "Jours calendaires",
      Weekends: "Jours de week-end",
      Holidays: "Jours de fermeture en semaine",
      "New Year's Day": "Jour de l’an",
      "Good Friday": "Vendredi saint",
      "Easter Monday": "Lundi de Pâques",
      "Christmas Day": "Noël",
      "Boxing Day": "Lendemain de Noël",
      "Workers' Day": "Fête du Travail",
      "Labour Day": "Fête du Travail",
      "Democracy Day": "Journée de la démocratie",
      "Independence Day": "Fête de l’indépendance",
      "Human Rights Day": "Journée des droits humains",
      "Human Rights Day (observed)": "Journée des droits humains (report)",
      "Family Day": "Journée de la famille",
      "Freedom Day": "Journée de la liberté",
      "Youth Day": "Journée de la jeunesse",
      "National Women's Day": "Journée nationale des femmes",
      "National Women's Day (observed)": "Journée nationale des femmes (report)",
      "Heritage Day": "Journée du patrimoine",
      "Day of Reconciliation": "Journée de la réconciliation",
      "Day of Goodwill": "Journée de la bienveillance",
      "Day of Goodwill (observed)": "Journée de la bienveillance (report)",
      "May Day": "Fête du Travail",
      "Farmers' Day": "Journée des agriculteurs",
      "Constitution Day": "Journée de la Constitution"
    };
  const fr=root.ownerDocument.documentElement.dataset.afroWidgetLocale==="fr";
  const say=(en,native)=>fr?native:en;
  const num=value=>value.toLocaleString(fr?"fr":"en",{maximumFractionDigits:2});
  const form=document.createElement("form");form.noValidate=true;form.style.cssText="display:grid;gap:10px";
  root.replaceChildren(form);
  function node(tag,text,parent=form){const el=document.createElement(tag);el.textContent=text;parent.append(el);return el;}
  function number(label,parent,initial){
   const wrap=node("label",label,parent),input=node("input","",wrap);input.type="number";input.step="any";input.min="0";input.className="aw-input";if(initial!==undefined)input.value=initial;return input;
  }
  function action(text,type,parent=form){const el=node("button",text,parent);el.type=type;el.className="aw-btn";return el;}
  function finish(run){
   action(say("Calculate","Calculer"),"submit");
   const result=node("output","");result.setAttribute("aria-live","polite");form.addEventListener("input",()=>{result.textContent="";});form.addEventListener("submit",ev=>{ev.preventDefault();result.textContent=run();});
   if(options?.footerHTML)root.insertAdjacentHTML("beforeend",options.footerHTML);
  }
  const common=window.AfroTools?.leaveHolidayReference||{};const records=Object.fromEntries(Object.entries(common).map(([cc,yrs])=>[cc,{...yrs}]));records.EG={2025:archive.EG};records.TZ={2025:archive.TZ};
  records.EG[2026]=[["01-07","Coptic Christmas","Noël copte"],["01-29","Revolution and Police Day","Révolution et fête de la police"],...["19","20","21","22","23"].map(d=>["03-"+d,"Eid al-Fitr","Aïd el-Fitr"]),["04-13","Sham El-Nessim","Cham el-Nessim"],["04-25","Sinai Liberation Day","Libération du Sinaï"],["05-07","Labour Day","Fête du Travail"],["05-26","Day of Arafah","Jour d’Arafat"],...["27","28","29","30","31"].map(d=>["05-"+d,"Eid al-Adha","Aïd el-Adha"]),["06-18","Islamic New Year","Nouvel an hégirien"],["07-02","June Revolution","Révolution de juin"],["07-23","July Revolution","Révolution de juillet"],["08-27","Prophet’s Birthday","Mawlid"],["10-06","Armed Forces Day","Fête des forces armées"]].map(([md,n,f])=>({d:"2026-"+md,n,f}));
  records.TZ[2026]=[["01-01","New Year","Nouvel an"],["01-12","Zanzibar Revolution","Révolution de Zanzibar"],["03-20","Eid al-Fitr*","Aïd el-Fitr*"],["03-21","Eid al-Fitr*","Aïd el-Fitr*"],["04-03","Good Friday","Vendredi saint"],["04-06","Easter Monday","Lundi de Pâques"],["04-07","Karume Day","Journée Karume"],["04-26","Union Day","Fête de l’Union"],["05-01","Labour Day","Fête du Travail"],["05-27","Eid al-Adha*","Aïd el-Adha*"],["07-07","Saba Saba","Saba Saba"],["08-08","Nane Nane","Nane Nane"],["08-25","Mawlid*","Mawlid*"],["10-14","Nyerere Day","Journée Nyerere"],["12-09","Independence Day","Fête de l’indépendance"],["12-25","Christmas","Noël"],["12-26","Boxing Day","Lendemain de Noël"]].map(([md,n,f])=>({d:"2026-"+md,n,f}));
  if(records.ZA?.[2026]&&!records.ZA[2026].some(row=>row.d==="2026-08-10"))records.ZA[2026]=[...records.ZA[2026],{d:"2026-08-10",n:"National Women's Day (observed)"}];
  const links={NG:"https://interior.gov.ng/",KE:"https://new.kenyalaw.org/akn/ke/act/1912/21",GH:"https://mint.gov.gh/documents/statutory-holidays-commemorative-days-in-the-republic-of-ghana-for-the-year-2026",ZA:"https://www.gov.za/about-sa/public-holidays",EG:"https://www.presidency.eg/ar/مصر/العطلات-الرسمية/",TZ:"https://dse.co.tz/storage/news/HopTtaYPXi9RqX5c8aOmW8Jyu8CmyWH8dYzzmAdZ.pdf"};
  node("h2",say("Public holiday calendar","Calendrier des jours fériés"));const country=node("select","",node("label",say("Country","Pays"))),year=node("select","",node("label",say("Year","Année")));country.className=year.className="aw-select";const regions=new Intl.DisplayNames([fr?"fr":"en"],{type:"region"});for(const cc of Object.keys(records))country.add(new Option(regions.of(cc),cc));
  const ref=node("a","");ref.target="_blank";ref.rel="noopener";const help=node("p",""),result=node("ul","");
  function display(){const cc=country.value,rows=records[cc]?.[year.value]||[];ref.href=links[cc];ref.textContent=say("Check published dates","Consulter le calendrier publié");help.textContent=cc==="TZ"&&year.value==="2026"?say("Dar es Salaam Stock Exchange calendar. Asterisks mark dates subject to moon sighting.","Calendrier de la Bourse de Dar es Salaam. Les astérisques signalent les dates dépendant de l’observation de la lune."):say("Planning calendar. Check the linked source for announced changes.","Calendrier indicatif. Consultez la source pour les changements annoncés.");result.replaceChildren();for(const row of [...rows].sort((a,b)=>a.d.localeCompare(b.d))){const date=new Intl.DateTimeFormat(fr?"fr":"en",{dateStyle:"full",timeZone:"UTC"}).format(Date.parse(row.d+"T00:00:00Z"));let name=row.n;if(cc==="KE"&&row.d.endsWith("-10-10"))name="Mazingira Day";node("li",date+" · "+(fr?(row.f||translations[name]||name):name),result);}}
  function change(){year.replaceChildren();for(const yr of Object.keys(records[country.value]||{}).sort().reverse())year.add(new Option(yr,yr));if([...year.options].some(o=>o.value===String(new Date().getFullYear())))year.value=String(new Date().getFullYear());display();}
  country.addEventListener("change",change);year.addEventListener("change",display);change();if(options?.footerHTML)root.insertAdjacentHTML("beforeend",options.footerHTML);
};

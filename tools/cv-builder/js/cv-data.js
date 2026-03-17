/* ═══════════════════════════════════════════════════════════════
   AfroTools CV Builder — Data, Constants & Country Norms
   ═══════════════════════════════════════════════════════════════ */

// ── Country Norms ─────────────────────────────────────────────
const COUNTRY_NORMS = {
  NG:{n:'Nigeria',f:'\u{1F1F3}\u{1F1EC}',photo:1,dob:1,mar:1,gen:1,so:1,nat:1,soL:'State of Origin',soP:'Anambra State',nyscField:1,h:'Nigerian employers expect personal details, state of origin, NYSC details, and references with full contact information. Two pages standard.'},
  KE:{n:'Kenya',f:'\u{1F1F0}\u{1F1EA}',photo:1,dob:1,mar:1,gen:1,so:0,nat:1,idField:1,h:'Kenyan CVs include photo, DOB, ID number, and KCSE/KCPE grades. Keep to 2\u20133 pages.'},
  ZA:{n:'South Africa',f:'\u{1F1FF}\u{1F1E6}',photo:0,dob:0,mar:0,gen:0,so:0,nat:0,dlField:1,healthField:1,h:'No personal details \u2014 Employment Equity Act. Include driver\u2019s licence status. Focus on achievements and metrics.'},
  GH:{n:'Ghana',f:'\u{1F1EC}\u{1F1ED}',photo:1,dob:1,mar:1,gen:1,so:1,nat:1,soL:'Region / Hometown',soP:'Ashanti Region',nsField:1,h:'Include personal details, hometown, and National Service. WASSCE results important for entry-level.'},
  EG:{n:'Egypt',f:'\u{1F1EA}\u{1F1EC}',photo:1,dob:1,mar:1,gen:1,so:0,nat:1,milField:1,relField:1,h:'Include personal details. Military status for males. Photo expected. Arabic + English CV versions often needed.'},
  ET:{n:'Ethiopia',f:'\u{1F1EA}\u{1F1F9}',photo:1,dob:1,mar:1,gen:1,so:0,nat:1,h:'Include personal details. Amharic proficiency valued.'},
  TZ:{n:'Tanzania',f:'\u{1F1F9}\u{1F1FF}',photo:1,dob:1,mar:1,gen:1,so:0,nat:1,h:'Include personal details. Swahili proficiency valued.'},
  RW:{n:'Rwanda',f:'\u{1F1F7}\u{1F1FC}',photo:1,dob:1,mar:0,gen:1,so:0,nat:1,h:'Concise 2-page CVs. English, French, Kinyarwanda valued.'},
  UG:{n:'Uganda',f:'\u{1F1FA}\u{1F1EC}',photo:1,dob:1,mar:1,gen:1,so:1,nat:1,soL:'District of Origin',soP:'Wakiso District',h:'Include personal details and district of origin.'},
  SN:{n:'Senegal',f:'\u{1F1F8}\u{1F1F3}',photo:1,dob:1,mar:1,gen:1,so:0,nat:1,h:'French CV format. Photo and personal details required.'},
  CI:{n:"C\u00f4te d'Ivoire",f:'\u{1F1E8}\u{1F1EE}',photo:1,dob:1,mar:1,gen:1,so:0,nat:1,h:'French CV format with photo and personal details.'},
  CM:{n:'Cameroon',f:'\u{1F1E8}\u{1F1F2}',photo:1,dob:1,mar:1,gen:1,so:1,nat:1,soL:'Region of Origin',soP:'Centre Region',h:'Bilingual French/English CVs valued.'},
  MA:{n:'Morocco',f:'\u{1F1F2}\u{1F1E6}',photo:1,dob:1,mar:1,gen:1,so:0,nat:1,h:'French format. French and Arabic essential.'},
  TN:{n:'Tunisia',f:'\u{1F1F9}\u{1F1F3}',photo:1,dob:1,mar:1,gen:1,so:0,nat:1,milField:1,h:'French conventions. Military status for males.'},
  DZ:{n:'Algeria',f:'\u{1F1E9}\u{1F1FF}',photo:1,dob:1,mar:1,gen:1,so:0,nat:1,milField:1,h:'French format CV. Military service status for males.'},
  AO:{n:'Angola',f:'\u{1F1E6}\u{1F1F4}',photo:1,dob:1,mar:1,gen:1,so:0,nat:1,h:'Portuguese language. Personal details included.'},
  MZ:{n:'Mozambique',f:'\u{1F1F2}\u{1F1FF}',photo:1,dob:1,mar:1,gen:1,so:0,nat:1,h:'Portuguese language. Personal details included.'},
  BW:{n:'Botswana',f:'\u{1F1E7}\u{1F1FC}',photo:1,dob:1,mar:0,gen:0,so:0,nat:1,h:'Modern format. Photo optional.'},
  ZW:{n:'Zimbabwe',f:'\u{1F1FF}\u{1F1FC}',photo:1,dob:1,mar:1,gen:1,so:0,nat:1,h:'Personal details included. English standard.'},
  ZM:{n:'Zambia',f:'\u{1F1FF}\u{1F1F2}',photo:1,dob:1,mar:1,gen:1,so:0,nat:1,h:'Personal details included.'},
  MW:{n:'Malawi',f:'\u{1F1F2}\u{1F1FC}',photo:1,dob:1,mar:1,gen:1,so:0,nat:1,h:'Personal details included.'},
  NA:{n:'Namibia',f:'\u{1F1F3}\u{1F1E6}',photo:1,dob:1,mar:0,gen:0,so:0,nat:1,h:'Similar to South African format.'},
  CD:{n:'DR Congo',f:'\u{1F1E8}\u{1F1E9}',photo:1,dob:1,mar:1,gen:1,so:0,nat:1,h:'French format. Personal details included.'},
  SD:{n:'Sudan',f:'\u{1F1F8}\u{1F1E9}',photo:1,dob:1,mar:1,gen:1,so:0,nat:1,h:'Arabic and English. Personal details included.'},
  LY:{n:'Libya',f:'\u{1F1F1}\u{1F1FE}',photo:1,dob:1,mar:1,gen:1,so:0,nat:1,h:'Arabic format. Personal details included.'},
  OTHER:{n:'Other African',f:'\u{1F30D}',photo:1,dob:1,mar:1,gen:1,so:0,nat:1,h:'Most African countries expect personal details and references with full contact information.'},
  INTL:{n:'International',f:'\u{1F310}',photo:0,dob:0,mar:0,gen:0,so:0,nat:0,h:'No personal details. Focus on quantified achievements and ATS-compatible formatting.'},
};

// ── Templates ─────────────────────────────────────────────────
const TEMPLATES = [
  // Classic (existing, improved)
  {id:'slate',      name:'Slate',            group:'Classic',      colors:['#1e293b','#3b82f6','#0f172a'],    tags:['professional','sidebar','ats'], level:'all',   industry:'all'},
  {id:'ember',      name:'Ember',            group:'Classic',      colors:['#c2410c','#ea580c','#9a3412'],    tags:['warm','bold'],                  level:'all',   industry:'all'},
  {id:'phantom',    name:'Phantom',          group:'Classic',      colors:['#000','#374151','#6b7280'],       tags:['minimal','two-column'],         level:'all',   industry:'all'},
  {id:'indigo',     name:'Indigo',           group:'Classic',      colors:['#4338ca','#312e81','#6366f1'],    tags:['gradient','modern'],            level:'all',   industry:'all'},
  {id:'noir',       name:'Noir',             group:'Classic',      colors:['#0f172a','#334155','#64748b'],    tags:['dark','sidebar'],               level:'all',   industry:'all'},
  {id:'stone',      name:'Stone',            group:'Classic',      colors:['#78716c','#57534e','#a8a29e'],    tags:['warm','earthy'],                level:'all',   industry:'all'},
  // African market-specific (new)
  {id:'lagos',      name:'Lagos Corporate',  group:'African',      colors:['#0A1628','#007AFF','#F5A623'],    tags:['ats','banking','nysc','sidebar'],level:'all',   industry:'finance',  country:'NG'},
  {id:'cape',       name:'Cape Town Modern', group:'African',      colors:['#007AFF','#0063D1','#4DA3FF'],    tags:['clean','references','sa'],      level:'all',   industry:'all',      country:'ZA'},
  {id:'nairobi',    name:'Nairobi Executive',group:'African',      colors:['#0063D1','#0d7377','#323232'],    tags:['executive','east-africa'],      level:'senior',industry:'all',      country:'KE'},
  {id:'accra',      name:'Accra Graduate',   group:'African',      colors:['#F5A623','#b45309','#78350f'],    tags:['entry-level','skills-first'],   level:'entry', industry:'all',      country:'GH'},
  {id:'cairo',      name:'Cairo Bilingual',  group:'African',      colors:['#0A1628','#007AFF','#d4a017'],    tags:['bilingual','photo','rtl'],      level:'all',   industry:'all',      country:'EG'},
  {id:'abuja',      name:'Abuja Government', group:'African',      colors:['#1e293b','#333333','#666666'],    tags:['government','formal','dense'],  level:'all',   industry:'government',country:'NG'},
  {id:'kigali',     name:'Kigali Tech',      group:'African',      colors:['#0063D1','#6366f1','#007AFF'],    tags:['tech','dev','github'],          level:'all',   industry:'tech'},
  {id:'panaf',      name:'Pan-African Minimal',group:'African',    colors:['#000000','#333333','#666666'],    tags:['ats','minimal','plain'],        level:'all',   industry:'all'},
  {id:'franco',     name:'Francophone Standard',group:'African',   colors:['#0063D1','#0A1628','#F5A623'],    tags:['french','francophone'],         level:'all',   industry:'all'},
  {id:'diaspora',   name:'Diaspora / Japa',  group:'African',      colors:['#007AFF','#6366f1','#0063D1'],    tags:['international','equivalency'], level:'all',   industry:'all'},
];

const TEMPLATE_GROUPS = [
  {label: 'Classic', items: TEMPLATES.filter(t => t.group === 'Classic')},
  {label: 'African', items: TEMPLATES.filter(t => t.group === 'African')},
];

const LANG_LEVELS = ['Beginner','Elementary','Intermediate','Upper Intermediate','Fluent','Native'];

const ACCENT_COLORS = [
  {value: 'var(--color-primary)', hex: '#007AFF', label: 'Blue'},
  {value: '#2563EB', hex: '#2563EB', label: 'Royal'},
  {value: '#dc2626', hex: '#dc2626', label: 'Red'},
  {value: '#9333ea', hex: '#9333ea', label: 'Purple'},
  {value: '#0891b2', hex: '#0891b2', label: 'Cyan'},
  {value: '#d97706', hex: '#d97706', label: 'Amber'},
  {value: '#374151', hex: '#374151', label: 'Gray'},
];

// ── Degree Options ────────────────────────────────────────────
const DEGREE_OPTIONS = [
  '--- Secondary ---',
  'WAEC / SSCE', 'NECO / SSCE', 'WASSCE', 'KCSE', 'KCPE', 'Matric (Grade 12)', 'Baccalaur\u00e9at', 'GCE O-Level', 'GCE A-Level',
  '--- Diploma ---',
  'OND (Ordinary National Diploma)', 'HND (Higher National Diploma)', 'National Diploma', 'Certificate', 'Advanced Certificate',
  '--- Undergraduate ---',
  'B.Sc', 'B.A', 'B.Eng', 'B.Ed', 'B.Com', 'B.Tech', 'LLB', 'MBBS / MBChB', 'B.Pharm', 'B.Arch',
  '--- Postgraduate ---',
  'PGD (Postgraduate Diploma)', 'M.Sc', 'M.A', 'MBA', 'M.Eng', 'M.Ed', 'LLM', 'MPH',
  '--- Doctoral ---',
  'Ph.D', 'DBA', 'M.D',
  '--- Professional ---',
  'ICAN / ACA', 'ACCA', 'CIPM', 'CFA', 'PMP', 'ICPAK (CPA-K)', 'CIMA', 'CIPD', 'SHRM', 'Other',
];

// ── Empty data model ──────────────────────────────────────────
function createEmptyCV() {
  return {
    fn:'', ln:'', title:'', email:'', phone:'', phoneCode:'+234', loc:'', web:'', linkedin:'',
    dob:'', nat:'', gen:'', mar:'', so:'', sp:false,
    showPhoto:false, photo:null,
    // Country-specific
    nyscStatus:'', nyscYear:'', nyscState:'', nyscPPA:'',
    dlStatus:'', healthStatus:'',
    milStatus:'', religion:'',
    idNumber:'', nsYear:'', nsOrg:'',
    lga:'', genotype:'',
    summary:'',
    exps:[{t:'',c:'',l:'',s:'',e:'',cur:false,d:''}],
    edus:[{deg:'',sch:'',loc:'',y1:'',y2:'',g:''}],
    projs:[{n:'',url:'',tech:'',d:''}],
    showProjs:false,
    skills:{h:'',s:'',t:''},
    certs:[{n:'',i:'',y:''}],
    langs:[{l:'',lv:'Fluent'}],
    refs:[{n:'',t:'',org:'',p:'',e:'',rel:''}],
    showRefs:true,
    extras:{awards:'',hobbies:'',volunteer:'',publications:'',memberships:''},
    customSections:[],
  };
}

// ── Phone Codes ───────────────────────────────────────────────
const PHONE_CODES = [
  {code:'+234',country:'NG',label:'+234 Nigeria'},
  {code:'+254',country:'KE',label:'+254 Kenya'},
  {code:'+27',country:'ZA',label:'+27 South Africa'},
  {code:'+233',country:'GH',label:'+233 Ghana'},
  {code:'+20',country:'EG',label:'+20 Egypt'},
  {code:'+251',country:'ET',label:'+251 Ethiopia'},
  {code:'+255',country:'TZ',label:'+255 Tanzania'},
  {code:'+250',country:'RW',label:'+250 Rwanda'},
  {code:'+256',country:'UG',label:'+256 Uganda'},
  {code:'+221',country:'SN',label:'+221 Senegal'},
  {code:'+225',country:'CI',label:'+225 C\u00f4te d\'Ivoire'},
  {code:'+237',country:'CM',label:'+237 Cameroon'},
  {code:'+212',country:'MA',label:'+212 Morocco'},
  {code:'+216',country:'TN',label:'+216 Tunisia'},
  {code:'+213',country:'DZ',label:'+213 Algeria'},
  {code:'+244',country:'AO',label:'+244 Angola'},
  {code:'+258',country:'MZ',label:'+258 Mozambique'},
  {code:'+267',country:'BW',label:'+267 Botswana'},
  {code:'+263',country:'ZW',label:'+263 Zimbabwe'},
  {code:'+260',country:'ZM',label:'+260 Zambia'},
  {code:'+265',country:'MW',label:'+265 Malawi'},
  {code:'+264',country:'NA',label:'+264 Namibia'},
  {code:'+243',country:'CD',label:'+243 DR Congo'},
  {code:'+249',country:'SD',label:'+249 Sudan'},
  {code:'+218',country:'LY',label:'+218 Libya'},
  {code:'+1',country:'INTL',label:'+1 USA/Canada'},
  {code:'+44',country:'INTL',label:'+44 UK'},
];

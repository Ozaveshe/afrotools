var fs = require('fs');
var path = require('path');

var SEO = {
  nigeria: { reg: "NAICOM (National Insurance Commission)", pen: "0.5%", fact: "Third-party motor insurance in Nigeria is NGN 15,000/year (NAICOM standardized since Jan 2023), covering up to NGN 3M in third-party property damage. Major providers include Leadway, AXA Mansard, AIICO, NEM Insurance, and Custodian. Verify your policy at askniid.org or dial *565*11#." },
  kenya: { reg: "IRA (Insurance Regulatory Authority)", pen: "2.4%", fact: "Kenya motor third-party costs KES 5,000-8,000/year. Comprehensive runs 3.5-7% of vehicle value. Since Oct 2024, NHIF was replaced by SHIF at 2.75% of gross salary with no cap. Major insurers include Jubilee, Britam, CIC, and APA." },
  "south-africa": { reg: "FSCA and the Prudential Authority", pen: "12.2%", fact: "South Africa has no mandatory comprehensive car insurance. The Road Accident Fund (RAF) covers personal injury via a R2.18/litre fuel levy. Comprehensive cover averages R800-R1,400/month. OUTsurance, Discovery Insure, Santam, and MiWay lead the market. COIDA rates range from 0.22% to 8.26% of payroll." },
  ghana: { reg: "NIC (National Insurance Commission)", pen: "1.2%", fact: "Ghana mandatory third-party motor insurance was raised to GHS 530/year for private saloon cars (taxis GHS 637) in 2025. NHIA (formerly NHIS) is funded through 2.5% VAT levy plus 2.5% of SSNIT contributions. Major insurers: Enterprise Insurance, SIC, Star Assurance, Hollard Ghana." },
  egypt: { reg: "FRA (Financial Regulatory Authority)", pen: "0.9%", fact: "Egypt compulsory third-party motor insurance is tiered by engine capacity: EGP 225/year up to 1030cc, EGP 350 for 1030-1330cc, EGP 750 for 1330-1630cc, and EGP 120 for EV/hybrid vehicles. Major insurers: GIG Egypt, AXA Egypt, Allianz Egypt, Misr Insurance." },
  ethiopia: { reg: "National Bank of Ethiopia (NBE)", pen: "0.4%", fact: "NBE Directive SIB/60/2023 sets comprehensive motor premium rates at 1.5-4% of vehicle value. Awash Insurance is the largest private insurer. CBHI (Community-Based Health Insurance) covers 32 million people at ETB 500/year per household." },
  tanzania: { reg: "TIRA (Tanzania Insurance Regulatory Authority)", pen: "0.62%", fact: "Tanzania mandatory third-party motor insurance costs TZS 118,000/year. NHIF contributions are 6% of basic salary (3% employer + 3% employee). A Universal Health Insurance system launching in 2026 will standardize coverage at TZS 150,000/year." },
  uganda: { reg: "IRA (Insurance Regulatory Authority of Uganda)", pen: "0.74%", fact: "Uganda motor third-party (MTP) covers COMESA zones at UGX 400,000-600,000/year. MTP limits are UGX 1M per person and UGX 10M aggregate. The market has 144 licensed players. Major insurers: Jubilee Allianz, Alliance Africa, APA, Sanlam." },
  rwanda: { reg: "BNR (National Bank of Rwanda)", pen: "1.9%", fact: "Rwanda Mutuelle de Sante health insurance achieves 85%+ coverage. Tiered premiums: middle-income RWF 3,000/year, higher-income RWF 7,000/year. Rwanda targets 5% insurance penetration by 2035. Major motor insurers: SORAS, Radiant, Prime, BK Insurance." },
  "cote-d-ivoire": { reg: "CIMA and Direction des Assurances", pen: "1.5%", fact: "Largest CIMA zone insurance market. Since Jan 2023, first to fully digitalize insurance certificates. Since Jan 2025, valid technical inspection required or 25-30% premium penalty. CMU health covers 21M citizens at 1,000 FCFA/month/person (70% coverage, 30% co-pay)." },
  cameroon: { reg: "CIMA and Ministry of Finance", pen: "1%", fact: "Second-largest CIMA zone market. Third-party starts from 25,000-50,000 FCFA/year under uniform CIMA Code standards across 14 African countries. Zenithe Insurance became the first online insurer in the CIMA zone." },
  senegal: { reg: "CIMA and ARTP", pen: "1.2%", fact: "Senegal motor insurance market had estimated gross premiums of $150.52M in 2025. AXA KARANGUE package starts at 149,000 FCFA. Askia Assurances pioneered digital insurance certificates. Other major providers: Sanlam, Allianz Senegal, AMSA." },
  morocco: { reg: "ACAPS", pen: "3.9%", fact: "Africa second-largest insurance market (8.7% of continental premiums). Motor uses Bonus-Malus coefficient (CRM): base third-party ~2,235 MAD/year, best-case 2,013 MAD (CRM 0.9), worst-case 3,122 MAD (CRM 1.4). EV/ecological vehicles get 30% discount. AMO health: 4.11% employer + 2.26% employee." },
  tunisia: { reg: "CGA (Comite General des Assurances)", pen: "2.1%", fact: "Tunisia insurance market reached TND 3,820M revenue in 2024, motor accounting for 40% of total. Bureau Central de Tarification sets mandatory motor rates. 2025 reforms expanded compensation definitions. CNAM health contributions total 6.75% of salary. Major insurers: STAR, GAT, COMAR, Astree." },
  angola: { reg: "ARSEG", pen: "0.7%", fact: "Angola mandatory motor insurance for vehicles under 1600cc costs KZ 30,196-35,734/year, with ENSA offering the lowest. Motor Guarantee Fund covers uninsured vehicle victims. INSS contributions increased to 15% employer + 3% employee in mid-2025." },
  algeria: { reg: "CNA (Conseil National des Assurances)", pen: "0.7%", fact: "Algeria insurance is dominated by state-owned SAA and CAAR. Motor insurance is the largest segment. Social security (CNAS) health: 12.5% employer + 1.5% employee." },
  benin: { reg: "CIMA / Direction des Assurances", pen: "0.8%", fact: "Benin follows CIMA Code standards. Major providers include Fedas, Saham, and NSIA." },
  botswana: { reg: "NBFIRA", pen: "3.5%", fact: "Botswana has one of southern Africa more developed insurance markets. Motor insurance is mandatory under the Road Traffic Act." },
  "burkina-faso": { reg: "CIMA / Direction des Assurances", pen: "0.5%", fact: "Burkina Faso follows CIMA Code standards. Major insurers include SONAR, UAB, and Allianz." },
  burundi: { reg: "Banque de la Republique du Burundi", pen: "0.3%", fact: "Burundi insurance market is small but growing. SOCABU is the dominant insurer." },
  "cabo-verde": { reg: "Banco de Cabo Verde", pen: "1.8%", fact: "Cabo Verde has a relatively high insurance penetration for its size. Garantia is the largest insurer." },
  "central-african-republic": { reg: "CIMA", pen: "0.2%", fact: "CAR insurance market is one of Africa smallest. CIMA Code applies for motor insurance." },
  chad: { reg: "CIMA", pen: "0.3%", fact: "Chad follows CIMA Code standards. The insurance market is developing slowly." },
  comoros: { reg: "Banque Centrale des Comores", pen: "0.3%", fact: "Comoros has a very small insurance market. Motor third-party is nominally mandatory." },
  "congo-brazzaville": { reg: "CIMA", pen: "0.8%", fact: "Congo-Brazzaville follows CIMA Code. ARC is a major provider." },
  djibouti: { reg: "Banque Centrale de Djibouti", pen: "0.5%", fact: "Djibouti insurance sector is small but serves its strategic port economy." },
  "dr-congo": { reg: "ARCA", pen: "0.2%", fact: "DR Congo liberalized its insurance market in 2020, ending SONAS 54-year monopoly. Over 20 new companies have been licensed." },
  "equatorial-guinea": { reg: "CIMA", pen: "0.4%", fact: "Equatorial Guinea follows CIMA Code. Oil economy drives demand for commercial insurance." },
  eritrea: { reg: "Ministry of Finance", pen: "0.2%", fact: "Eritrea insurance market is state-controlled with limited private sector participation." },
  eswatini: { reg: "FSRA", pen: "2.5%", fact: "Eswatini has a developed insurance sector relative to its size." },
  gabon: { reg: "CIMA", pen: "1.5%", fact: "Gabon has one of the higher insurance penetration rates in the CIMA zone, driven by its oil economy." },
  gambia: { reg: "CBG (Central Bank of The Gambia)", pen: "0.6%", fact: "Gambia insurance market is small. Major providers: Trust Bank Insurance and Capital Insurance." },
  "guinea-bissau": { reg: "CIMA", pen: "0.1%", fact: "Guinea-Bissau has one of Africa least developed insurance markets." },
  guinea: { reg: "CIMA", pen: "0.3%", fact: "Guinea follows CIMA Code. UGAR and NSIA are major providers." },
  lesotho: { reg: "Central Bank of Lesotho", pen: "2%", fact: "Lesotho insurance market is influenced by proximity to South Africa advanced sector." },
  liberia: { reg: "CBL (Central Bank of Liberia)", pen: "0.3%", fact: "Liberia insurance market is rebuilding post-conflict. NICOL and BSIC are key players." },
  libya: { reg: "Insurance Supervisory Authority", pen: "0.4%", fact: "Libya insurance market has been disrupted by conflict. Libya Insurance Company is the largest." },
  madagascar: { reg: "CSBF", pen: "0.5%", fact: "Madagascar insurance market is dominated by ARO and Ny Havana." },
  malawi: { reg: "RBM (Reserve Bank of Malawi)", pen: "1.2%", fact: "Malawi insurance market includes NICO, Old Mutual, and FDH." },
  mali: { reg: "CIMA", pen: "0.5%", fact: "Mali follows CIMA Code. SONAVIE and Saham are major providers." },
  mauritania: { reg: "CIMA-adjacent regulations", pen: "0.4%", fact: "Mauritania insurance market is small and developing." },
  mauritius: { reg: "FSC", pen: "5.8%", fact: "Mauritius has Africa highest insurance penetration rate, driven by life insurance and its financial center status." },
  mozambique: { reg: "ISSM", pen: "0.7%", fact: "Mozambique insurance market is growing. Hollard, Fidelidade, and SIM are major players." },
  namibia: { reg: "NAMFISA", pen: "6%", fact: "Namibia has one of Africa highest insurance penetration rates, reflecting ties to the South African market." },
  niger: { reg: "CIMA", pen: "0.2%", fact: "Niger follows CIMA Code. The insurance market is one of the smallest in West Africa." },
  "sao-tome-and-principe": { reg: "BCSTP", pen: "0.3%", fact: "Sao Tome has a minimal insurance market." },
  seychelles: { reg: "FSA", pen: "3%", fact: "Seychelles has a well-regulated insurance sector for its small population." },
  "sierra-leone": { reg: "SLICOM", pen: "0.3%", fact: "Sierra Leone insurance market is rebuilding. SLICOM oversees 12+ licensed insurers." },
  somalia: { reg: "No functioning insurance regulator", pen: "~0%", fact: "Somalia lacks a formal insurance regulatory framework. Islamic Takaful insurance operates informally in some areas." },
  "south-sudan": { reg: "Bank of South Sudan", pen: "0.1%", fact: "South Sudan insurance market is nascent, impacted by conflict and economic instability." },
  sudan: { reg: "Insurance Supervisory Authority", pen: "0.3%", fact: "Sudan operates under Islamic (Takaful) insurance principles. Shiekan and Blue Nile are major providers." },
  togo: { reg: "CIMA", pen: "0.5%", fact: "Togo follows CIMA Code. NSIA, Saham, and Allianz operate in the market." },
  zambia: { reg: "PIA (Pensions and Insurance Authority)", pen: "1%", fact: "Zambia insurance market includes Hollard, Professional Insurance, ZSIC, and Madison. NAPSA covers social security." },
  zimbabwe: { reg: "IPEC", pen: "2.5%", fact: "Zimbabwe insurance market operates in a multi-currency environment. Old Mutual, First Mutual, and Zimnat are major providers." }
};

var TOOLS = ['car-insurance', 'motor-third-party', 'workers-comp', 'health-contribution'];
var basePath = path.join(__dirname, '..', 'tools');
var updated = 0;

TOOLS.forEach(function(tool) {
  var toolDir = path.join(basePath, tool);
  if (!fs.existsSync(toolDir)) return;

  var files = fs.readdirSync(toolDir).filter(function(f) { return f.endsWith('.html') && f !== 'index.html'; });

  files.forEach(function(file) {
    var slug = file.replace('.html', '');
    var info = SEO[slug];
    if (!info) return;

    var filePath = path.join(toolDir, file);
    var html = fs.readFileSync(filePath, 'utf8');

    var oldText = /<p>Insurance penetration in Africa remains below 3% on average, yet the need for financial protection is immense\.[^<]*<\/p>/;
    if (oldText.test(html)) {
      var newText = '<p>' + info.fact + ' The market is regulated by ' + info.reg + ', with insurance penetration at ' + info.pen + ' of GDP.</p>';
      html = html.replace(oldText, newText);
      fs.writeFileSync(filePath, html);
      updated++;
    }
  });
});

console.log('Updated ' + updated + ' pages with country-specific SEO content');

// Also update x15 tools
var TOOLS15 = ['health-insurance-compare', 'life-insurance-calc', 'funeral-insurance', 'business-insurance', 'crop-insurance-calc', 'microinsurance'];
TOOLS15.forEach(function(tool) {
  var toolDir = path.join(basePath, tool);
  if (!fs.existsSync(toolDir)) return;

  var files = fs.readdirSync(toolDir).filter(function(f) { return f.endsWith('.html') && f !== 'index.html'; });

  files.forEach(function(file) {
    var slug = file.replace('.html', '');
    var info = SEO[slug];
    if (!info) return;

    var filePath = path.join(toolDir, file);
    var html = fs.readFileSync(filePath, 'utf8');

    var oldText = /<p>Insurance penetration in Africa remains below 3% on average, yet the need for financial protection is immense\.[^<]*<\/p>/;
    if (oldText.test(html)) {
      var newText = '<p>' + info.fact + ' The market is regulated by ' + info.reg + ', with insurance penetration at ' + info.pen + ' of GDP.</p>';
      html = html.replace(oldText, newText);
      fs.writeFileSync(filePath, html);
      updated++;
    }
  });
});

console.log('Total updated: ' + updated + ' pages');

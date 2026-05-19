const { createClient } = require('@supabase/supabase-js');

const PROJECT_URL = process.env.SUPABASE_AUTH_URL || 'https://zpclagtgczsygrgztlts.supabase.co';
const SERVICE_KEY =
  process.env.SUPABASE_AUTH_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY;

const BACKUP_SOURCE_KEY = 'afrotools-curated-backup';
const CONCURRENCY = Number(process.env.SCHOLARSHIP_SEED_CONCURRENCY || 8);
const LINK_TIMEOUT_MS = Number(process.env.SCHOLARSHIP_SEED_LINK_TIMEOUT_MS || 6000);
const SKIP_LINK_CHECK = process.env.SCHOLARSHIP_SEED_SKIP_LINK_CHECK === '1';
const ALLOW_HTTP_BLOCKED = process.env.SCHOLARSHIP_SEED_ALLOW_HTTP_BLOCKED !== '0';
const DRY_RUN = process.argv.includes('--dry-run');

const seedEntries = [
  ['australia-awards-africa', 'Australia Awards Africa', 'Australian Government', 'https://www.dfat.gov.au/people-to-people/australia-awards', 'australia', 'masters', 'full'],
  ['manaaki-new-zealand-scholarships', 'Manaaki New Zealand Scholarships', 'New Zealand Ministry of Foreign Affairs and Trade', 'https://www.nzscholarships.govt.nz/', 'global', 'undergrad|masters|phd', 'full'],
  ['chinese-government-scholarship', 'Chinese Government Scholarship', 'China Scholarship Council', 'https://www.campuschina.org/', 'global', 'undergrad|masters|phd', 'full'],
  ['educanada-scholarships', 'EduCanada Scholarships', 'Government of Canada', 'https://www.educanada.ca/scholarships-bourses/index.aspx', 'canada', 'undergrad|masters|phd|postdoc', 'partial'],
  ['ireland-fellows-programme', 'Ireland Fellows Programme', 'Irish Aid', 'https://www.irishaidfellowships.ie/', 'eu', 'masters', 'full'],
  ['swedish-institute-scholarships', 'Swedish Institute Scholarships', 'Swedish Institute', 'https://si.se/en/apply/scholarships/', 'eu', 'masters', 'full'],
  ['mext-scholarships', 'MEXT Scholarships', 'Government of Japan', 'https://www.studyinjapan.go.jp/en/planning/scholarships/mext-scholarships/', 'global', 'undergrad|masters|phd', 'full'],
  ['study-in-nl-scholarships', 'Study in NL Scholarships', 'Nuffic', 'https://www.studyinnl.org/finances/scholarships', 'eu', 'undergrad|masters', 'partial'],
  ['campus-france-campusbourses', 'Campus France CampusBourses', 'Campus France', 'https://campusbourses.campusfrance.org/', 'eu', 'undergrad|masters|phd', 'partial'],
  ['afdb-jads', 'AfDB Japan Africa Dream Scholarship', 'African Development Bank', 'https://www.afdb.org/en/about-us/careers/japan-africa-dream-scholarship-jads-program', 'global', 'masters', 'full'],
  ['pan-african-university-scholarships', 'Pan African University Scholarships', 'African Union', 'https://www.au-pau.org/', 'africa', 'masters|phd', 'full'],
  ['isdb-scholarships', 'IsDB Scholarship Programmes', 'Islamic Development Bank', 'https://www.isdb.org/scholarships', 'global', 'undergrad|masters|phd|postdoc', 'full'],
  ['aga-khan-international-scholarship', 'Aga Khan Foundation International Scholarship Programme', 'Aga Khan Foundation', 'https://the.akdn/en/what-we-do/developing-human-capacity/education/international-scholarships', 'global', 'masters|phd', 'partial'],
  ['rotary-peace-fellowships', 'Rotary Peace Fellowships', 'Rotary International', 'https://www.rotary.org/en/our-programs/peace-fellowships', 'global', 'masters', 'full'],
  ['joint-japan-imf-scholarship', 'Joint Japan/IMF Scholarship Program', 'International Monetary Fund', 'https://www.imf.org/en/About/Factsheets/Sheets/2023/Joint-Japan-IMF-Scholarship-Program', 'global', 'masters', 'full'],
  ['adb-japan-scholarship-program', 'ADB Japan Scholarship Program', 'Asian Development Bank', 'https://www.adb.org/work-with-us/careers/japan-scholarship-program', 'global', 'masters', 'full'],
  ['wells-mountain-initiative-scholars', 'Wells Mountain Initiative Scholars Program', 'Wells Mountain Initiative', 'https://wellsmountaininitiative.org/our-programs/scholars-program/', 'global', 'undergrad', 'partial'],
  ['aauw-international-fellowships', 'AAUW International Fellowships', 'AAUW', 'https://www.aauw.org/resources/programs/fellowships-grants/current-opportunities/international/', 'us', 'masters|phd|postdoc', 'partial'],
  ['peo-international-peace-scholarship', 'P.E.O. International Peace Scholarship', 'P.E.O. International', 'https://www.peointernational.org/international-peace-scholarship-fund/', 'us|canada', 'masters|phd', 'partial'],
  ['zonta-amelia-earhart-fellowship', 'Amelia Earhart Fellowship', 'Zonta International', 'https://www.zonta.org/Web/Programs/Education/Amelia_Earhart_Fellowship', 'global', 'phd', 'partial'],
  ['schlumberger-faculty-for-future', 'Faculty for the Future Fellowships', 'SLB Foundation', 'https://www.slb.com/who-we-are/schlumberger-foundation/faculty-for-the-future', 'global', 'phd|postdoc', 'partial'],
  ['margaret-mcnamara-education-grants', 'Margaret McNamara Education Grants', 'MMEG', 'https://www.mmeg.org/', 'global', 'undergrad|masters|phd', 'partial'],
  ['owsd-phd-fellowship', 'OWSD PhD Fellowship', 'Organization for Women in Science for the Developing World', 'https://owsd.net/career-development/phd-fellowship', 'global', 'phd', 'full'],
  ['twas-fellowships', 'TWAS Fellowships', 'The World Academy of Sciences', 'https://twas.org/opportunities/fellowships', 'global', 'phd|postdoc', 'full'],
  ['owsd-early-career-fellowships', 'OWSD Early Career Fellowships', 'Organization for Women in Science for the Developing World', 'https://owsd.net/career-development/early-career-fellowships', 'global', 'postdoc', 'partial'],
  ['unesco-fellowships', 'UNESCO Fellowships', 'UNESCO', 'https://www.unesco.org/en/fellowships', 'global', 'masters|phd|postdoc', 'partial'],
  ['un-nippon-foundation-fellowship', 'UN Nippon Foundation Fellowship', 'United Nations', 'https://www.un.org/oceancapacity/content/un-nippon-foundation-fellowship', 'global', 'masters|phd', 'full'],
  ['mo-ibrahim-foundation-fellowships', 'Mo Ibrahim Foundation Fellowships', 'Mo Ibrahim Foundation', 'https://mo.ibrahim.foundation/fellowships', 'africa', 'masters|phd|postdoc', 'full'],
  ['canon-collins-scholarships', 'Canon Collins Scholarships', 'Canon Collins Trust', 'https://canoncollins.org/scholarships/', 'africa', 'masters|phd', 'partial'],
  ['mandela-rhodes-scholarship', 'Mandela Rhodes Scholarship', 'Mandela Rhodes Foundation', 'https://mandelarhodes.org/scholarship/', 'africa', 'masters', 'full'],
  ['allan-gray-orbis-fellowship', 'Allan Gray Orbis Fellowship', 'Allan Gray Orbis Foundation', 'https://www.allangrayorbis.org/fellowship-programme/', 'africa', 'undergrad', 'full'],
  ['moshal-scholarship-program', 'Moshal Scholarship Program', 'Moshal Program', 'https://moshalscholarship.org/', 'africa', 'undergrad', 'full'],
  ['university-of-edinburgh-mastercard-foundation-scholars', 'University of Edinburgh Mastercard Foundation Scholars Program', 'University of Edinburgh', 'https://www.ed.ac.uk/global/mastercard-foundation', 'uk', 'masters', 'full'],
  ['oxford-mastercard-foundation-afox-scholarships', 'Oxford Mastercard Foundation AfOx Scholarships', 'University of Oxford', 'https://www.afox.ox.ac.uk/mastercard-foundation-afox-scholarships', 'uk', 'masters', 'full'],
  ['cambridge-mastercard-foundation-scholars', 'Cambridge Mastercard Foundation Scholars Program', 'University of Cambridge', 'https://www.mastercardfoundation.fund.cam.ac.uk/', 'uk', 'masters', 'full'],
  ['toronto-mastercard-foundation-scholars', 'University of Toronto Mastercard Foundation Scholars Program', 'University of Toronto', 'https://future.utoronto.ca/finances/awards/mastercard-foundation-scholars-program/', 'canada', 'undergrad', 'full'],
  ['mcgill-mastercard-foundation-scholars', 'McGill Mastercard Foundation Scholars Program', 'McGill University', 'https://www.mcgill.ca/mastercardfdn-scholars/', 'canada', 'masters', 'full'],
  ['ubc-mastercard-foundation-scholars', 'UBC Mastercard Foundation Scholars Program', 'University of British Columbia', 'https://mastercardfdn.scholars.ubc.ca/', 'canada', 'undergrad', 'full'],
  ['sciences-po-mastercard-foundation-scholars', 'Sciences Po Mastercard Foundation Scholars Program', 'Sciences Po', 'https://www.sciencespo.fr/students/en/fees-funding/bursaries-financial-aid/mastercard-foundation-scholars-program/', 'eu', 'masters', 'full'],
  ['university-of-pretoria-mastercard-foundation-scholarship', 'University of Pretoria Mastercard Foundation Scholars Program', 'University of Pretoria', 'https://www.up.ac.za/mastercard-foundation-scholarship-program', 'africa', 'undergrad|masters', 'full'],
  ['uct-mastercard-foundation-scholars', 'University of Cape Town Mastercard Foundation Scholars Program', 'University of Cape Town', 'https://uct.ac.za/students/fees-funding/scholarships-funding/mastercard-foundation-scholars-program', 'africa', 'undergrad|masters', 'full'],
  ['ashesi-scholarships', 'Ashesi University Scholarships', 'Ashesi University', 'https://www.ashesi.edu.gh/admissions/scholarships.html', 'africa', 'undergrad', 'partial'],
  ['aims-mastercard-foundation-scholars', 'AIMS Mastercard Foundation Scholars Program', 'African Institute for Mathematical Sciences', 'https://nexteinstein.org/mastercard-foundation-scholars-program/', 'africa', 'masters', 'full'],
  ['alu-fees-financing', 'African Leadership University Scholarships and Financing', 'African Leadership University', 'https://www.alueducation.com/admissions/fees-financing/', 'africa', 'undergrad|masters', 'partial'],
  ['usiu-africa-mastercard-foundation-scholars', 'USIU-Africa Mastercard Foundation Scholars Program', 'United States International University Africa', 'https://www.usiu.ac.ke/mastercard-foundation-scholars-program/', 'africa', 'undergrad', 'full'],
  ['oxford-clarendon-scholarships', 'Clarendon Scholarships', 'University of Oxford', 'https://www.ox.ac.uk/clarendon', 'uk', 'masters|phd', 'full'],
  ['reach-oxford-scholarship', 'Reach Oxford Scholarship', 'University of Oxford', 'https://www.ox.ac.uk/admissions/undergraduate/fees-and-funding/oxford-support/reach-oxford-scholarship', 'uk', 'undergrad', 'full'],
  ['weidenfeld-hoffmann-scholarships', 'Weidenfeld-Hoffmann Scholarships and Leadership Programme', 'University of Oxford', 'https://www.ox.ac.uk/admissions/graduate/fees-and-funding/fees-funding-and-scholarship-search/weidenfeld-hoffmann-scholarships-and-leadership-programme', 'uk', 'masters', 'full'],
  ['oxford-pershing-square-scholarship', 'Oxford Pershing Square Scholarship', 'University of Oxford', 'https://www.sbs.ox.ac.uk/oxford-experience/scholarships-and-funding/pershing-square-scholarship', 'uk', 'masters', 'partial'],
  ['cambridge-trust-scholarships', 'Cambridge Trust Scholarships', 'Cambridge Trust', 'https://www.cambridgetrust.org/scholarships/', 'uk', 'undergrad|masters|phd', 'partial'],
  ['lse-graduate-support-scheme', 'LSE Graduate Support Scheme', 'London School of Economics', 'https://www.lse.ac.uk/study-at-lse/Graduate/fees-and-funding/graduate-support-scheme', 'uk', 'masters', 'partial'],
  ['lse-masters-awards', "LSE Master's Awards", 'London School of Economics', 'https://www.lse.ac.uk/study-at-lse/Graduate/fees-and-funding/masters-awards', 'uk', 'masters', 'partial'],
  ['imperial-presidents-phd-scholarships', "President's PhD Scholarships", 'Imperial College London', 'https://www.imperial.ac.uk/study/fees-and-funding/scholarships-search/presidents-phd-scholarships/', 'uk', 'phd', 'full'],
  ['ucl-global-masters-scholarship', 'UCL Global Masters Scholarship', 'University College London', 'https://www.ucl.ac.uk/scholarships/ucl-global-masters-scholarship', 'uk', 'masters', 'partial'],
  ['ucl-global-undergraduate-scholarship', 'UCL Global Undergraduate Scholarship', 'University College London', 'https://www.ucl.ac.uk/scholarships/ucl-global-undergraduate-scholarship', 'uk', 'undergrad', 'partial'],
  ['kings-college-london-scholarships', "King's College London Scholarships", "King's College London", 'https://www.kcl.ac.uk/study/undergraduate/fees-and-funding/scholarships-and-bursaries', 'uk', 'undergrad|masters', 'partial'],
  ['manchester-equity-merit-scholarships', 'Manchester Equity and Merit Scholarships', 'University of Manchester', 'https://www.manchester.ac.uk/study/masters/fees-and-funding/masters-scholarships-funding/equity-merit-scholarships/', 'uk', 'masters', 'full'],
  ['bristol-think-big-undergraduate', 'Think Big Undergraduate Scholarships', 'University of Bristol', 'https://www.bristol.ac.uk/students/support/finances/scholarships/think-big-undergraduate/', 'uk', 'undergrad', 'partial'],
  ['bristol-think-big-postgraduate', 'Think Big Postgraduate Scholarships', 'University of Bristol', 'https://www.bristol.ac.uk/students/support/finances/scholarships/think-big-postgraduate/', 'uk', 'masters', 'partial'],
  ['sheffield-international-undergraduate-merit', 'International Undergraduate Merit Scholarship', 'University of Sheffield', 'https://www.sheffield.ac.uk/international/fees-and-funding/scholarships/undergraduate/international-undergraduate-merit-scholarship', 'uk', 'undergrad', 'partial'],
  ['sheffield-international-postgraduate-merit', 'International Postgraduate Taught Merit Scholarship', 'University of Sheffield', 'https://www.sheffield.ac.uk/international/fees-and-funding/scholarships/postgraduate/international-postgraduate-taught-merit-scholarship', 'uk', 'masters', 'partial'],
  ['nottingham-developing-solutions-masters', 'Developing Solutions Masters Scholarship', 'University of Nottingham', 'https://www.nottingham.ac.uk/studywithus/international-applicants/scholarships-fees-and-finance/scholarships/developing-solutions-masters-scholarship.aspx', 'uk', 'masters', 'partial'],
  ['sussex-chancellors-international-scholarships', "Chancellor's International Scholarships", 'University of Sussex', 'https://www.sussex.ac.uk/study/fees-funding/masters-scholarships/view/1541-Chancellors-International-Scholarships', 'uk', 'masters', 'partial'],
  ['warwick-chancellors-international-scholarship', "Chancellor's International Scholarship", 'University of Warwick', 'https://warwick.ac.uk/services/dc/schols_fund/scholarships_and_funding/chancellors_int', 'uk', 'phd', 'full'],
  ['edinburgh-online-learning-masters-scholarships', 'Edinburgh Global Online Learning Masters Scholarships', 'University of Edinburgh', 'https://www.ed.ac.uk/student-funding/postgraduate/e-learning/online-distance-learning', 'uk', 'masters', 'partial'],
  ['soas-scholarships', 'SOAS Scholarships', 'SOAS University of London', 'https://www.soas.ac.uk/study/fees-and-funding/scholarships', 'uk', 'undergrad|masters|phd', 'partial'],
  ['glasgow-international-leadership-scholarship', 'International Leadership Scholarship', 'University of Glasgow', 'https://www.gla.ac.uk/scholarships/internationalleadershipscholarship/', 'uk', 'masters', 'partial'],
  ['knight-hennessy-scholars', 'Knight-Hennessy Scholars', 'Stanford University', 'https://knight-hennessy.stanford.edu/', 'us', 'masters|phd', 'full'],
  ['stanford-africa-mba-fellowship', 'Stanford Africa MBA Fellowship', 'Stanford Graduate School of Business', 'https://www.gsb.stanford.edu/programs/mba/financial-aid/types-aid/stanford-africa-mba-fellowship', 'us', 'masters', 'full'],
  ['princeton-financial-aid', 'Princeton Financial Aid', 'Princeton University', 'https://admission.princeton.edu/cost-aid/financial-aid', 'us', 'undergrad', 'partial'],
  ['mit-scholarships', 'MIT Scholarships', 'Massachusetts Institute of Technology', 'https://sfs.mit.edu/undergraduate-students/types-of-aid/mit-scholarship/', 'us', 'undergrad', 'partial'],
  ['yale-scholarships-grants', 'Yale Scholarships and Grants', 'Yale University', 'https://finaid.yale.edu/costs-affordability/types-aid/scholarships-and-grants', 'us', 'undergrad', 'partial'],
  ['columbia-international-financial-aid', 'Columbia International Financial Aid', 'Columbia University', 'https://undergrad.admissions.columbia.edu/affordability/international', 'us', 'undergrad', 'partial'],
  ['amherst-international-financial-aid', 'Amherst International Financial Aid', 'Amherst College', 'https://www.amherst.edu/admission/financial_aid/international', 'us', 'undergrad', 'partial'],
  ['berea-international-student-financial-aid', 'Berea College International Student Financial Aid', 'Berea College', 'https://www.berea.edu/admissions/costs-and-financial-aid-for-international-students', 'us', 'undergrad', 'partial'],
  ['uchicago-international-financial-aid', 'UChicago International Financial Aid', 'University of Chicago', 'https://collegeadmissions.uchicago.edu/financial-support/international-financial-aid', 'us', 'undergrad', 'partial'],
  ['duke-karsh-international-scholarship', 'Karsh International Scholarship', 'Duke University', 'https://ousf.duke.edu/merit-scholarships/karsh-international-scholarship/', 'us', 'undergrad', 'full'],
  ['asu-mastercard-foundation-scholars', 'ASU Mastercard Foundation Scholars Program', 'Arizona State University', 'https://eoss.asu.edu/mcfsp', 'us', 'undergrad|masters', 'full'],
  ['berkeley-mastercard-foundation-scholars', 'UC Berkeley Mastercard Foundation Scholars Program', 'University of California Berkeley', 'https://mastercardfdn.berkeley.edu/', 'us', 'masters', 'full'],
  ['toronto-lester-b-pearson-scholarship', 'Lester B. Pearson International Scholarship', 'University of Toronto', 'https://future.utoronto.ca/pearson/about/', 'canada', 'undergrad', 'full'],
  ['ubc-international-scholars-program', 'UBC International Scholars Program', 'University of British Columbia', 'https://you.ubc.ca/financial-planning/scholarships-awards-international-students/international-scholars/', 'canada', 'undergrad', 'partial'],
  ['york-university-international-scholarships', 'York University International Scholarships', 'York University', 'https://futurestudents.yorku.ca/financing-your-degree/scholarships-bursaries/international', 'canada', 'undergrad', 'partial'],
  ['calgary-international-entrance-scholarship', 'University of Calgary International Entrance Scholarship', 'University of Calgary', 'https://www.ucalgary.ca/registrar/finances/awards-scholarships-and-bursaries', 'canada', 'undergrad', 'partial'],
  ['waterloo-international-student-entrance-scholarships', 'Waterloo International Student Entrance Scholarships', 'University of Waterloo', 'https://uwaterloo.ca/student-awards-financial-aid/awards/international-student-entrance-scholarships', 'canada', 'undergrad', 'partial'],
  ['mcgill-entrance-scholarships', 'McGill Entrance Scholarships', 'McGill University', 'https://www.mcgill.ca/studentaid/scholarships-aid/future-undergrads/entrance-scholarships', 'canada', 'undergrad', 'partial'],
  ['vanier-canada-graduate-scholarships', 'Vanier Canada Graduate Scholarships', 'Government of Canada', 'https://vanier.gc.ca/', 'canada', 'phd', 'full'],
  ['banting-postdoctoral-fellowships', 'Banting Postdoctoral Fellowships', 'Government of Canada', 'https://banting.fellowships-bourses.gc.ca/', 'canada', 'postdoc', 'full'],
  ['trudeau-foundation-doctoral-scholarships', 'Trudeau Foundation Doctoral Scholarships', 'Pierre Elliott Trudeau Foundation', 'https://www.trudeaufoundation.ca/become-scholar', 'canada', 'phd', 'partial'],
  ['melbourne-graduate-research-scholarships', 'Graduate Research Scholarships', 'University of Melbourne', 'https://scholarships.unimelb.edu.au/awards/graduate-research-scholarships', 'australia', 'masters|phd', 'full'],
  ['anu-chancellors-international-scholarship', "ANU Chancellor's International Scholarship", 'Australian National University', 'https://www.anu.edu.au/study/scholarships/find-a-scholarship/anu-chancellors-international-scholarship', 'australia', 'undergrad|masters', 'partial'],
  ['sydney-international-scholarship', 'University of Sydney International Scholarship', 'University of Sydney', 'https://www.sydney.edu.au/scholarships/e/university-sydney-international-scholarship.html', 'australia', 'masters|phd', 'full'],
  ['monash-international-merit-scholarship', 'Monash International Merit Scholarship', 'Monash University', 'https://www.monash.edu/study/fees-scholarships/scholarships/find-a-scholarship/monash-international-merit-scholarship-5770', 'australia', 'undergrad|masters', 'partial'],
  ['unsw-international-scholarships', 'UNSW International Scholarships', 'UNSW Sydney', 'https://www.unsw.edu.au/study/how-to-apply/scholarships/international', 'australia', 'undergrad|masters', 'partial'],
  ['uq-international-excellence-scholarship', 'UQ International Excellence Scholarship', 'University of Queensland', 'https://scholarships.uq.edu.au/scholarship/international-excellence-scholarship', 'australia', 'undergrad|masters', 'partial'],
  ['adelaide-global-academic-excellence-scholarship', 'Global Academic Excellence Scholarship', 'University of Adelaide', 'https://www.adelaide.edu.au/scholarships/global-academic-excellence-scholarship-international', 'australia', 'undergrad|masters', 'partial'],
  ['macquarie-vice-chancellors-international-scholarship', "Vice-Chancellor's International Scholarship", 'Macquarie University', 'https://www.mq.edu.au/study/admissions-and-entry/scholarships/international/vice-chancellors-international-scholarship', 'australia', 'undergrad|masters', 'partial'],
  ['deakin-vice-chancellors-international-scholarship', "Vice-Chancellor's International Scholarship", 'Deakin University', 'https://www.deakin.edu.au/study/fees-and-scholarships/scholarships/find-a-scholarship/deakin-vice-chancellors-international-scholarship', 'australia', 'undergrad|masters', 'partial'],
  ['auckland-international-student-excellence-scholarship', 'International Student Excellence Scholarship', 'University of Auckland', 'https://www.auckland.ac.nz/en/study/scholarships-and-awards/find-a-scholarship/international-student-excellence-scholarship-843-all.html', 'global', 'undergrad|masters', 'partial'],
  ['victoria-wellington-tongarewa-scholarship', 'Tongarewa Scholarship', 'Victoria University of Wellington', 'https://www.wgtn.ac.nz/scholarships/current/tongarewa-scholarship', 'global', 'undergrad|masters', 'partial'],
  ['eiffel-excellence-scholarship', 'Eiffel Excellence Scholarship Program', 'Campus France', 'https://www.campusfrance.org/en/eiffel-scholarship-program-of-excellence', 'eu', 'masters|phd', 'full'],
  ['ens-international-selection', 'ENS International Selection', 'Ecole Normale Superieure', 'https://www.ens.psl.eu/en/academics/admissions/international-selection', 'eu', 'masters', 'full'],
  ['sciences-po-emile-boutmy-scholarship', 'Emile Boutmy Scholarship', 'Sciences Po', 'https://www.sciencespo.fr/students/en/fees-funding/bursaries-financial-aid/emile-boutmy-scholarship/', 'eu', 'undergrad|masters', 'partial'],
  ['epfl-excellence-fellowships', 'EPFL Excellence Fellowships', 'EPFL', 'https://www.epfl.ch/education/master/master-excellence-fellowships/', 'eu', 'masters', 'partial'],
  ['eth-excellence-scholarship', 'ETH Zurich Excellence Scholarship and Opportunity Programme', 'ETH Zurich', 'https://ethz.ch/students/en/studies/financial/scholarships/excellencescholarship.html', 'eu', 'masters', 'full'],
  ['unige-excellence-master-fellowships', 'University of Geneva Excellence Master Fellowships', 'University of Geneva', 'https://www.unige.ch/sciences/en/enseignement/formations/masters/excellencemasterfellowships/', 'eu', 'masters', 'partial'],
  ['tu-delft-justus-louise-van-effen-scholarships', 'Justus and Louise van Effen Excellence Scholarships', 'TU Delft', 'https://www.tudelft.nl/en/education/practical-matters/scholarships/justus-louise-van-effen-excellence-scholarships', 'eu', 'masters', 'full'],
  ['university-of-twente-scholarship', 'University of Twente Scholarship', 'University of Twente', 'https://www.utwente.nl/en/education/scholarship-finder/university-of-twente-scholarship/', 'eu', 'masters', 'partial'],
  ['radboud-scholarship-programme', 'Radboud Scholarship Programme', 'Radboud University', 'https://www.ru.nl/en/education/scholarships/radboud-scholarship-programme', 'eu', 'masters', 'partial'],
  ['leiden-excellence-scholarship', 'Leiden University Excellence Scholarship', 'Leiden University', 'https://www.universiteitleiden.nl/en/scholarships/sea/leiden-university-excellence-scholarship-lexs', 'eu', 'masters', 'partial'],
  ['utrecht-excellence-scholarships', 'Utrecht Excellence Scholarships', 'Utrecht University', 'https://www.uu.nl/en/masters/general-information/international-students/financial-matters/grants-and-scholarships/utrecht-excellence-scholarships', 'eu', 'masters', 'partial'],
  ['ku-leuven-global-minds-doctoral-scholarships', 'KU Leuven Global Minds Doctoral Scholarships', 'KU Leuven', 'https://www.kuleuven.be/global/global-development/global-minds/doctoral-scholarships', 'eu', 'phd', 'full'],
  ['vlir-uos-icp-connect-scholarships', 'VLIR-UOS ICP Connect Scholarships', 'VLIR-UOS', 'https://www.vliruos.be/en/scholarships', 'eu', 'masters', 'full'],
  ['deutschlandstipendium', 'Deutschlandstipendium', 'Federal Ministry of Education and Research Germany', 'https://www.deutschlandstipendium.de/de/english-1700.html', 'eu', 'undergrad|masters', 'partial'],
  ['heinrich-boll-foundation-scholarships', 'Heinrich Boll Foundation Scholarships', 'Heinrich Boll Foundation', 'https://www.boell.de/en/scholarships', 'eu', 'undergrad|masters|phd', 'partial'],
  ['friedrich-ebert-foundation-scholarships', 'Friedrich Ebert Stiftung Scholarships', 'Friedrich Ebert Stiftung', 'https://www.fes.de/en/studienfoerderung', 'eu', 'undergrad|masters|phd', 'partial'],
  ['konrad-adenauer-foundation-scholarships', 'Konrad Adenauer Foundation Scholarships for Foreign Students', 'Konrad Adenauer Stiftung', 'https://www.kas.de/en/web/begabtenfoerderung-und-kultur/foreign-students', 'eu', 'masters|phd', 'partial'],
  ['rosa-luxemburg-foundation-scholarships', 'Rosa Luxemburg Foundation Scholarships', 'Rosa Luxemburg Foundation', 'https://www.rosalux.de/en/foundation/studienwerk', 'eu', 'masters|phd', 'partial'],
  ['nigeria-federal-scholarship-board', 'Nigeria Federal Scholarship Board Awards', 'Federal Scholarship Board Nigeria', 'https://fsbn.com.ng/', 'africa', 'undergrad|masters|phd', 'partial'],
  ['ptdf-overseas-scholarship-scheme', 'PTDF Overseas Scholarship Scheme', 'Petroleum Technology Development Fund', 'https://ptdf.gov.ng/scholarship/', 'global', 'masters|phd', 'full'],
  ['nlng-scholarships', 'NLNG Scholarships', 'Nigeria LNG', 'https://www.nigerialng.com/Corporate-Social-Responsibility/Education/Pages/NLNG-Scholarships.aspx', 'africa', 'undergrad', 'partial'],
  ['mtn-foundation-scholarship', 'MTN Foundation Scholarship', 'MTN Nigeria Foundation', 'https://www.mtn.ng/scholarships/', 'africa', 'undergrad', 'partial'],
  ['shell-nigeria-scholarships', 'Shell Nigeria Scholarships', 'Shell Nigeria', 'https://www.shell.com.ng/sustainability/communities/education-programmes/scholarships.html', 'africa', 'undergrad', 'partial'],
  ['ghana-scholarships-secretariat', 'Ghana Scholarships Secretariat', 'Government of Ghana', 'https://www.scholarships.gov.gh/', 'africa', 'undergrad|masters|phd', 'partial'],
  ['kenya-ministry-education-scholarships', 'Kenya Ministry of Education Scholarships', 'Government of Kenya', 'https://www.education.go.ke/scholarships', 'africa', 'undergrad|masters', 'partial'],
  ['mauritius-africa-scholarship-scheme', 'Mauritius Africa Scholarship Scheme', 'Government of Mauritius', 'https://education.govmu.org/Pages/Mauritius-Africa-Scholarship-Scheme.aspx', 'africa', 'undergrad|masters|phd', 'full'],
  ['south-africa-nrf-funding', 'NRF Funding Opportunities', 'National Research Foundation South Africa', 'https://www.nrf.ac.za/funding/', 'africa', 'masters|phd|postdoc', 'partial'],
  ['south-africa-nsfas', 'NSFAS Bursary Scheme', 'National Student Financial Aid Scheme South Africa', 'https://www.nsfas.org.za/content/', 'africa', 'undergrad', 'partial'],
  ['southampton-scholarships', 'University of Southampton Scholarships', 'University of Southampton', 'https://www.southampton.ac.uk/study/fees-funding/scholarships', 'uk', 'undergrad|masters|phd', 'partial'],
  ['queen-mary-scholarships', 'Queen Mary Scholarships', 'Queen Mary University of London', 'https://www.qmul.ac.uk/scholarships/', 'uk', 'undergrad|masters|phd', 'partial'],
  ['city-scholarships', "City St George's Scholarships", "City St George's University of London", 'https://www.citystgeorges.ac.uk/prospective-students/finance/scholarships', 'uk', 'undergrad|masters', 'partial'],
  ['exeter-funding', 'University of Exeter Funding and Scholarships', 'University of Exeter', 'https://www.exeter.ac.uk/study/funding/', 'uk', 'undergrad|masters|phd', 'partial'],
  ['durham-scholarships', 'Durham University Scholarships', 'Durham University', 'https://www.durham.ac.uk/study/scholarships/', 'uk', 'undergrad|masters|phd', 'partial'],
  ['kent-scholarships', 'University of Kent Scholarships', 'University of Kent', 'https://www.kent.ac.uk/scholarships', 'uk', 'undergrad|masters|phd', 'partial'],
  ['essex-scholarships', 'University of Essex Scholarships', 'University of Essex', 'https://www.essex.ac.uk/scholarships', 'uk', 'undergrad|masters|phd', 'partial'],
  ['brunel-scholarships', 'Brunel University Scholarships', 'Brunel University London', 'https://www.brunel.ac.uk/scholarships', 'uk', 'undergrad|masters|phd', 'partial'],
  ['westminster-scholarships', 'University of Westminster Scholarships', 'University of Westminster', 'https://www.westminster.ac.uk/study/fees-and-funding/scholarships', 'uk', 'undergrad|masters', 'partial'],
  ['uea-scholarships', 'University of East Anglia Scholarships', 'University of East Anglia', 'https://www.uea.ac.uk/study/fees-and-funding/scholarships', 'uk', 'undergrad|masters|phd', 'partial'],
  ['strathclyde-scholarships', 'University of Strathclyde Scholarships', 'University of Strathclyde', 'https://www.strath.ac.uk/studywithus/scholarships/', 'uk', 'undergrad|masters|phd', 'partial'],
  ['aberdeen-funding', 'University of Aberdeen Funding', 'University of Aberdeen', 'https://www.abdn.ac.uk/study/funding/', 'uk', 'undergrad|masters|phd', 'partial'],
  ['st-andrews-scholarships', 'University of St Andrews Scholarships', 'University of St Andrews', 'https://www.st-andrews.ac.uk/study/fees-and-funding/scholarships/', 'uk', 'undergrad|masters|phd', 'partial'],
  ['royal-holloway-scholarships', 'Royal Holloway Scholarships', 'Royal Holloway University of London', 'https://www.royalholloway.ac.uk/studying-here/fees-and-funding/scholarships/', 'uk', 'undergrad|masters|phd', 'partial'],
  ['goldsmiths-scholarships', 'Goldsmiths Scholarships', 'Goldsmiths University of London', 'https://www.gold.ac.uk/fees-funding/scholarships/', 'uk', 'undergrad|masters|phd', 'partial'],
  ['middlesex-scholarships', 'Middlesex University Scholarships', 'Middlesex University', 'https://www.mdx.ac.uk/study-with-us/fees-and-funding/scholarships/', 'uk', 'undergrad|masters', 'partial'],
  ['carleton-awards', 'Carleton Awards and Financial Aid', 'Carleton University', 'https://carleton.ca/awards/', 'canada', 'undergrad|masters|phd', 'partial'],
  ['western-national-scholarship', 'Western National Scholarship Program', 'Western University', 'https://registrar.uwo.ca/student_finances/scholarships_awards/national_scholarship_program.html', 'canada', 'undergrad', 'partial'],
  ['concordia-scholarships', 'Concordia Scholarships and Funding', 'Concordia University', 'https://www.concordia.ca/students/financial/scholarships-funding.html', 'canada', 'undergrad|masters|phd', 'partial'],
  ['saskatchewan-scholarships', 'University of Saskatchewan Scholarships', 'University of Saskatchewan', 'https://students.usask.ca/money/scholarships.php', 'canada', 'undergrad|masters|phd', 'partial'],
  ['sfu-financial-aid-awards', 'SFU Financial Aid and Awards', 'Simon Fraser University', 'https://www.sfu.ca/students/financialaid.html', 'canada', 'undergrad|masters', 'partial'],
  ['ottawa-scholarships-awards', 'University of Ottawa Scholarships and Awards', 'University of Ottawa', 'https://www.uottawa.ca/study/fees-financial-support/scholarships-awards', 'canada', 'undergrad|masters|phd', 'partial'],
  ['rmit-international-scholarships', 'RMIT International Scholarships', 'RMIT University', 'https://www.rmit.edu.au/study-with-us/international-students/apply-to-rmit-international-students/fees-and-scholarships/scholarships', 'australia', 'undergrad|masters|phd', 'partial'],
  ['curtin-scholarships', 'Curtin Scholarships', 'Curtin University', 'https://scholarships.curtin.edu.au/', 'australia', 'undergrad|masters|phd', 'partial'],
  ['uts-international-scholarships', 'UTS International Student Scholarships', 'University of Technology Sydney', 'https://www.uts.edu.au/study/international/essential-information/scholarships-international-students', 'australia', 'undergrad|masters', 'partial'],
  ['wollongong-scholarships', 'University of Wollongong Scholarships', 'University of Wollongong', 'https://www.uow.edu.au/study/scholarships/', 'australia', 'undergrad|masters|phd', 'partial'],
  ['flinders-scholarships', 'Flinders Scholarships', 'Flinders University', 'https://www.flinders.edu.au/scholarships', 'australia', 'undergrad|masters|phd', 'partial'],
  ['copenhagen-masters-scholarships', 'University of Copenhagen Scholarships', 'University of Copenhagen', 'https://studies.ku.dk/masters/tuition-fees-scholarships/scholarships/', 'eu', 'masters', 'partial'],
  ['chalmers-scholarships', 'Chalmers Scholarships', 'Chalmers University of Technology', 'https://www.chalmers.se/en/education/fees-finance/scholarships/', 'eu', 'masters', 'partial'],
  ['aalto-scholarships', 'Aalto Scholarships and Tuition Fees', 'Aalto University', 'https://www.aalto.fi/en/admission-services/scholarships-and-tuition-fees', 'eu', 'undergrad|masters|phd', 'partial'],
  ['polimi-scholarships', 'Politecnico di Milano Scholarships', 'Politecnico di Milano', 'https://www.polimi.it/en/international-prospective-students/laurea-magistrale-programmes-equivalent-to-master-of-science/scholarships', 'eu', 'masters', 'partial'],
  ['padua-scholarships', 'University of Padua Scholarships', 'University of Padua', 'https://www.unipd.it/en/scholarships', 'eu', 'undergrad|masters|phd', 'partial'],
  ['ie-university-scholarships', 'IE University Scholarships', 'IE University', 'https://www.ie.edu/financial-aid/scholarships/', 'eu', 'undergrad|masters', 'partial'],
  ['erasmus-rotterdam-scholarships', 'Erasmus University Rotterdam Scholarships', 'Erasmus University Rotterdam', 'https://www.eur.nl/en/education/practical-matters/financial-matters/scholarships-grants', 'eu', 'undergrad|masters|phd', 'partial']
];

const rejectStatuses = new Set([400, 404, 500]);
const allowedBlockedStatuses = new Set([403, 405]);

function splitList(value) {
  return String(value || '')
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);
}

function fieldsFor(entry) {
  const text = (entry[1] + ' ' + entry[2]).toLowerCase();
  if (/science|technology|engineering|mathematics|aims|epfl|eth|nrf|twas|owsd|faculty|mext|jads/.test(text)) return ['stem', 'any'];
  if (/mba|business|economics|bocconi|london school of economics|pershing/.test(text)) return ['business', 'any'];
  if (/peace|law|policy|government|governance|ibrahim/.test(text)) return ['law', 'any'];
  if (/agriculture|environment|development|world bank|afdb|isdb/.test(text)) return ['agric', 'development', 'any'];
  return ['any'];
}

function shouldKeepStatus(status) {
  if (SKIP_LINK_CHECK) return true;
  if (typeof status === 'number' && status < 400) return true;
  return ALLOW_HTTP_BLOCKED && allowedBlockedStatuses.has(status);
}

async function linkStatus(url) {
  if (SKIP_LINK_CHECK) return 'skipped';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LINK_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'Mozilla/5.0 AfroTools scholarship source check' }
    });
    clearTimeout(timer);
    return response.status;
  } catch (error) {
    clearTimeout(timer);
    return 'ERR';
  }
}

function buildRow(entry, status, sourceId, now) {
  const levels = splitList(entry[5]);
  const destinations = splitList(entry[4]);
  const fields = fieldsFor(entry);
  const funding = entry[6] || 'partial';
  const blocked = allowedBlockedStatuses.has(status);
  const summary = entry[1] + ' from ' + entry[2] +
    '. Curated official-link record for African students to verify cycle dates, eligibility, and application requirements on the provider page.';

  return {
    slug: entry[0],
    title: entry[1],
    provider: entry[2],
    source_url: entry[3],
    official_url: entry[3],
    destination_countries: destinations,
    eligible_origins: ['Africa', 'global'],
    study_levels: levels,
    fields,
    funding_type: funding,
    min_gpa: null,
    min_ielts: null,
    deadline_date: null,
    deadline_text: 'Check official page',
    status: 'unclear',
    confidence_mode: 'curated',
    proof_level: blocked ? 'official_link_http_blocked' : 'official_link',
    summary,
    last_seen_at: now,
    last_verified_at: now,
    last_source_id: sourceId,
    is_featured: false,
    is_active: true,
    raw_snapshot: {
      source_key: BACKUP_SOURCE_KEY,
      source_type: 'curated_import',
      source_name: 'AfroTools curated scholarship backup',
      parser_key: 'curated_official_link_expansion',
      trust_level: 'curated',
      application_url: entry[3],
      info_url: entry[3],
      source_url: entry[3],
      official_url: entry[3],
      levels,
      destinations,
      fields,
      funding,
      verification_status: status,
      curated_at: now
    }
  };
}

async function mapLimit(items, limit, iterator) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: limit }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await iterator(items[index], index);
    }
  }));
  return results;
}

async function main() {
  if (!SERVICE_KEY && !DRY_RUN) {
    throw new Error('Missing Supabase service key. Set SUPABASE_SERVICE_ROLE_KEY or run with --dry-run.');
  }

  const statuses = await mapLimit(seedEntries, Math.max(1, CONCURRENCY), (entry) => linkStatus(entry[3]));
  const now = new Date().toISOString();
  const skipped = [];

  let sourceId = 'dry-run-source';
  let client = null;
  if (!DRY_RUN) {
    client = createClient(PROJECT_URL, SERVICE_KEY, { auth: { persistSession: false } });
    const { data: source, error: sourceError } = await client
      .from('scholarship_sources')
      .select('id')
      .eq('source_key', BACKUP_SOURCE_KEY)
      .maybeSingle();
    if (sourceError) throw sourceError;
    if (!source || !source.id) throw new Error('Missing ' + BACKUP_SOURCE_KEY + ' source row');
    sourceId = source.id;
  }

  const rows = seedEntries
    .map((entry, index) => ({ entry, status: statuses[index] }))
    .filter(({ entry, status }) => {
      const keep = shouldKeepStatus(status) && !rejectStatuses.has(status);
      if (!keep) skipped.push({ slug: entry[0], status, url: entry[3] });
      return keep;
    })
    .map(({ entry, status }) => buildRow(entry, status, sourceId, now));

  if (!DRY_RUN) {
    for (let index = 0; index < rows.length; index += 50) {
      const batch = rows.slice(index, index + 50);
      const { error } = await client.from('scholarships').upsert(batch, { onConflict: 'slug' });
      if (error) throw error;
    }
  }

  let activeCount = null;
  if (!DRY_RUN) {
    const { count, error } = await client
      .from('scholarships')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    if (error) throw error;
    activeCount = count;
  }

  console.log(JSON.stringify({
    dryRun: DRY_RUN,
    candidates: seedEntries.length,
    upserted: DRY_RUN ? 0 : rows.length,
    wouldUpsert: DRY_RUN ? rows.length : undefined,
    skipped: skipped.length,
    activeCount,
    skippedSample: skipped.slice(0, 20)
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

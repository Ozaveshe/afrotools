-- ============================================================
-- Scholarship Seed Data
-- Target: DATA instance (jbmhfpkzbgyeodsqhprx.supabase.co)
-- ============================================================

-- Create scholarships table
CREATE TABLE IF NOT EXISTS scholarships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  levels TEXT[] NOT NULL,
  destinations TEXT[] NOT NULL,
  fields TEXT[] NOT NULL,
  funding TEXT NOT NULL CHECK (funding IN ('full', 'partial')),
  description TEXT,
  eligibility_countries TEXT[],
  min_gpa_4 NUMERIC(3,2),
  min_gpa_5 NUMERIC(3,2),
  min_ielts NUMERIC(3,1),
  deadline_text TEXT,
  deadline_month INT CHECK (deadline_month BETWEEN 1 AND 12),
  application_url TEXT,
  info_url TEXT,
  source TEXT DEFAULT 'manual',
  is_active BOOLEAN DEFAULT true,
  consecutive_failures INT DEFAULT 0,
  last_verified TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scholarships_active ON scholarships (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_scholarships_levels ON scholarships USING GIN (levels);
CREATE INDEX IF NOT EXISTS idx_scholarships_destinations ON scholarships USING GIN (destinations);
CREATE INDEX IF NOT EXISTS idx_scholarships_fields ON scholarships USING GIN (fields);

-- RLS
ALTER TABLE scholarships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active scholarships" ON scholarships FOR SELECT USING (is_active = true);

-- ============================================================
-- SEED DATA — 120+ Scholarships for African Students
-- ============================================================

-- Clear existing data
TRUNCATE scholarships;

INSERT INTO scholarships (name, provider, levels, destinations, fields, funding, description, min_gpa_4, min_gpa_5, min_ielts, deadline_text, deadline_month, info_url) VALUES

-- ===================== FULLY FUNDED — UK =====================
('Chevening Scholarship', 'UK Government (FCDO)', '{masters}', '{uk}', '{any}', 'full',
 'Fully funded Master''s in the UK. Covers tuition, living, flights, visa. Open to all African countries. Must have 2+ years work experience and demonstrate leadership potential.',
 3.0, 3.5, 6.5, 'Nov (annual)', 11, 'https://www.chevening.org'),

('Rhodes Scholarship', 'Rhodes Trust', '{masters,phd}', '{uk}', '{any}', 'full',
 'Study at University of Oxford. Fully funded. Africa has dedicated slots for Nigeria, Kenya, East/West/Southern Africa. One of the most prestigious scholarships globally.',
 3.7, 4.5, 7.0, 'Jul-Oct (varies by country)', 7, 'https://www.rhodeshouse.ox.ac.uk'),

('Gates Cambridge Scholarship', 'Gates Foundation', '{masters,phd}', '{uk}', '{any}', 'full',
 'Full-cost scholarship at University of Cambridge. Open to all countries outside UK. ~100 awards per year globally. Must demonstrate outstanding academic achievement.',
 3.7, 4.5, 7.5, 'Oct/Dec', 10, 'https://www.gatescambridge.org'),

('Commonwealth Scholarship', 'Commonwealth Secretariat', '{masters,phd}', '{uk}', '{any}', 'full',
 'For citizens of Commonwealth African countries. Master''s or PhD at UK universities. Strong development focus. Covers tuition, living, flights.',
 3.0, 3.5, 6.5, 'Dec', 12, 'https://cscuk.fcdo.gov.uk'),

('Clarendon Scholarship (Oxford)', 'University of Oxford', '{masters,phd}', '{uk}', '{any}', 'full',
 'Covers tuition and generous living allowance at Oxford. ~140 awards per year. Automatic consideration for all graduate applicants. Highly competitive.',
 3.7, 4.5, 7.0, 'Jan', 1, 'https://www.ox.ac.uk/clarendon'),

('Skoll Scholarship (Oxford)', 'Skoll Foundation', '{masters}', '{uk}', '{business}', 'full',
 'MBA at Said Business School, Oxford. For social entrepreneurs. Covers full tuition + stipend.',
 3.5, 4.2, 7.0, 'Jan', 1, 'https://www.sbs.ox.ac.uk/skoll-scholarships'),

('Think Big Scholarship (Bristol)', 'University of Bristol', '{undergrad,masters}', '{uk}', '{any}', 'full',
 'Covers full tuition fees for international students at University of Bristol. Multiple awards available for African students.',
 3.3, 4.0, 6.5, 'Mar', 3, 'https://www.bristol.ac.uk/scholarships'),

('Denys Holland Scholarship (UCL)', 'University College London', '{undergrad}', '{uk}', '{any}', 'full',
 'For undergraduates who without financial support would be unable to study at UCL. Covers tuition + living costs.',
 3.3, 4.0, 6.5, 'Mar', 3, 'https://www.ucl.ac.uk/scholarships'),

('Edinburgh Global Scholarship', 'University of Edinburgh', '{masters,phd}', '{uk}', '{any}', 'partial',
 'Tuition fee discount of up to 50% for international postgraduate students. Multiple awards.',
 3.3, 4.0, 6.5, 'Apr', 4, 'https://www.ed.ac.uk/student-funding/postgraduate'),

('Westminster Full Scholarship', 'University of Westminster', '{undergrad,masters}', '{uk}', '{any}', 'full',
 'Covers full tuition, accommodation, living expenses and flights. Highly competitive. Available for students from developing countries.',
 3.5, 4.2, 6.5, 'May', 5, 'https://www.westminster.ac.uk/study/fees-and-funding'),

('Said Business School Scholarship', 'University of Oxford', '{masters}', '{uk}', '{business}', 'full',
 'Full scholarship for MBA students from Africa. Covers tuition and living costs. Preference for students who plan to return to Africa.',
 3.5, 4.2, 7.0, 'Jan', 1, 'https://www.sbs.ox.ac.uk/programmes/oxford-mba'),

('Weidenfeld-Hoffmann Scholarship', 'University of Oxford', '{masters}', '{uk}', '{any}', 'full',
 'For outstanding students from developing countries. Covers tuition and living expenses at Oxford. Strong leadership track record required.',
 3.7, 4.5, 7.0, 'Jan', 1, 'https://www.ox.ac.uk/weidenfeld-hoffmann'),

-- ===================== FULLY FUNDED — US =====================
('Fulbright Foreign Student Program', 'US Department of State', '{masters,phd}', '{us}', '{any}', 'full',
 'Graduate study in the US. Available in most African countries. Covers tuition, living, flights, health insurance. One of the most recognized programs worldwide.',
 3.0, 3.5, 6.5, 'Feb-Oct (varies by country)', 2, 'https://foreign.fulbrightonline.org'),

('MasterCard Foundation Scholars', 'Mastercard Foundation', '{undergrad,masters}', '{global}', '{any}', 'full',
 'Study at partner universities worldwide (including African ones). Targets academically talented but economically disadvantaged Africans. Covers everything.',
 3.0, 3.5, 6.0, 'Varies by partner university', NULL, 'https://mastercardfdn.org/all/scholars'),

('Schwarzman Scholars', 'Schwarzman Foundation', '{masters}', '{global}', '{business,law}', 'full',
 'One-year Master''s at Tsinghua University, Beijing. Full funding. Focus on global affairs, economics, business. Strong leadership focus.',
 3.5, 4.2, 7.0, 'Sep', 9, 'https://www.schwarzmanscholars.org'),

('Joint Japan/World Bank Graduate Scholarship', 'World Bank / Japan', '{masters}', '{us,global}', '{business,stem,agric}', 'full',
 'For mid-career professionals from developing countries. Master''s in development-related fields. Tuition, living, travel covered.',
 3.0, 3.5, 6.5, 'Apr', 4, 'https://www.worldbank.org/en/programs/scholarships'),

('Humphrey Fellowship Program', 'US Department of State', '{masters}', '{us}', '{any}', 'full',
 'Non-degree program for experienced professionals. 10 months at a US university. Professional enrichment, not academic degree. Covers everything.',
 NULL, NULL, 6.0, 'Jun-Sep (varies)', 6, 'https://www.humphreyfellowship.org'),

('AAUW International Fellowship', 'American Association of University Women', '{masters,phd,postdoc}', '{us}', '{any}', 'full',
 'For women pursuing full-time graduate or postdoctoral study in the US. $18,000-$30,000 awards. Open to all nationalities.',
 3.0, 3.5, 6.5, 'Nov', 11, 'https://www.aauw.org/resources/programs/fellowships-grants'),

('Stanford Knight-Hennessy Scholars', 'Stanford University', '{masters,phd}', '{us}', '{any}', 'full',
 'Full funding for graduate study at Stanford. Up to 3 years. Covers tuition, stipend, travel. ~100 scholars per year globally.',
 3.7, 4.5, 7.0, 'Oct', 10, 'https://knight-hennessy.stanford.edu'),

('Harvard Kennedy School Scholarship', 'Harvard University', '{masters}', '{us}', '{law,business}', 'full',
 'Need-based financial aid for Master in Public Policy or Administration. International students eligible. Covers up to full tuition.',
 3.5, 4.2, 7.0, 'Dec', 12, 'https://www.hks.harvard.edu/financial-aid'),

('MIT Graduate Fellowship', 'MIT', '{masters,phd}', '{us}', '{stem}', 'full',
 'Research and teaching assistantships covering tuition and stipend. Available across all STEM departments. Merit-based.',
 3.5, 4.2, 7.0, 'Dec-Jan', 12, 'https://oge.mit.edu/finances/fellowships'),

('Yale World Fellows', 'Yale University', '{masters}', '{us}', '{any}', 'full',
 'Non-degree program for emerging global leaders. 4 months at Yale. Fully funded including travel. Mid-career professionals.',
 NULL, NULL, 7.0, 'Dec', 12, 'https://worldfellows.yale.edu'),

-- ===================== FULLY FUNDED — EUROPE =====================
('DAAD Scholarship', 'German Academic Exchange Service', '{masters,phd,postdoc}', '{eu}', '{any}', 'full',
 'Study in Germany. Multiple programmes including Development-Related Postgraduate Courses (EPOS). Taught in English or German. ~25% acceptance rate.',
 3.0, 3.5, 6.0, 'Oct-Nov', 10, 'https://www.daad.de'),

('Erasmus Mundus Joint Masters', 'European Commission', '{masters}', '{eu}', '{stem,arts,any}', 'full',
 'Study at multiple European universities. Tuition + living + travel. Many programmes available. Excellent for networking across EU.',
 3.0, 3.5, 6.5, 'Jan-Feb', 1, 'https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus'),

('ETH Zurich Excellence Scholarship', 'ETH Zurich', '{masters}', '{eu}', '{stem}', 'full',
 'For outstanding Master''s students at ETH Zurich, Switzerland. Covers tuition + living. Extremely competitive. Top 3 technical university in Europe.',
 3.7, 4.5, 7.0, 'Dec', 12, 'https://ethz.ch/en/studies/financial/scholarships'),

('KAAD Scholarship (Germany)', 'Catholic Academic Exchange Service', '{masters,phd}', '{eu}', '{any}', 'full',
 'For students from developing countries. Study in Germany. Monthly stipend + tuition + allowances. Must be Catholic or Christian.',
 3.0, 3.5, 6.0, 'Jun/Dec', 6, 'https://www.kaad.de'),

('Turkish Government Scholarship', 'Republic of Turkey', '{undergrad,masters,phd}', '{eu}', '{any}', 'full',
 'Study in Turkey. Covers tuition, accommodation, living, health, flights, Turkish language course. High acceptance rate compared to UK/US scholarships.',
 2.5, 3.0, NULL, 'Jan-Feb', 1, 'https://turkiyeburslari.gov.tr'),

('Hungarian Government Scholarship', 'Tempus Public Foundation', '{undergrad,masters,phd}', '{eu}', '{any}', 'full',
 'Study in Hungary. Stipendium Hungaricum. Covers tuition, living, health insurance. Available for most African countries.',
 2.5, 3.0, 5.5, 'Jan', 1, 'https://stipendiumhungaricum.hu'),

('Chinese Government Scholarship', 'China Scholarship Council', '{undergrad,masters,phd}', '{global}', '{any}', 'full',
 'Study in China. Multiple types: bilateral, university, Great Wall, EU. Covers everything. Apply through Chinese embassy or university.',
 2.5, 3.0, NULL, 'Jan-Apr', 1, 'https://www.campuschina.org'),

('Holland Scholarship', 'Dutch Ministry of Education', '{undergrad,masters}', '{eu}', '{any}', 'partial',
 'EUR 5,000 one-time grant for non-EU/EEA students studying in the Netherlands. Wide university participation.',
 3.0, 3.5, 6.0, 'Feb-May', 2, 'https://www.studyinholland.nl/finances/scholarships/holland-scholarship'),

('Swiss Government Excellence Scholarship', 'Swiss Confederation', '{phd,postdoc}', '{eu}', '{stem,arts}', 'full',
 'Research or PhD at Swiss universities. Covers tuition, monthly allowance, health insurance, flights. Through Swiss embassy.',
 3.5, 4.2, 6.5, 'Aug-Nov (varies)', 8, 'https://www.sbfi.admin.ch/scholarships'),

('Swedish Institute Scholarship', 'Swedish Institute', '{masters}', '{eu}', '{any}', 'full',
 'Master''s studies in Sweden. Covers tuition, living, travel, insurance. For students from developing countries. Strong sustainability focus.',
 3.0, 3.5, 6.5, 'Feb', 2, 'https://si.se/en/apply/scholarships'),

('Norwegian Quota Scheme', 'Norwegian Government', '{masters,phd}', '{eu}', '{any}', 'full',
 'Study at Norwegian universities. No tuition fees (public universities). Living costs grant available. For students from developing countries.',
 3.0, 3.5, 6.0, 'Dec', 12, 'https://www.studyinnorway.no'),

('Italian Government Scholarship', 'Italian Ministry of Foreign Affairs', '{masters,phd}', '{eu}', '{any}', 'full',
 'Study in Italy. 6-9 month grants for research, Master''s or PhD. Covers tuition + monthly stipend. Apply through Italian embassy.',
 3.0, 3.5, NULL, 'Apr-Jun', 4, 'https://studyinitaly.esteri.it'),

('Belgian VLIR-UOS Scholarship', 'VLIR-UOS', '{masters}', '{eu}', '{stem,agric,health}', 'full',
 'Master''s at Flemish universities in Belgium. Covers everything. For professionals from developing countries. Strong development relevance required.',
 3.0, 3.5, 6.0, 'Feb', 2, 'https://www.vliruos.be/en/scholarships'),

('Eiffel Excellence Scholarship (France)', 'French Ministry of Europe and Foreign Affairs', '{masters,phd}', '{eu}', '{stem,business,law}', 'full',
 'Study in France at Master''s or PhD level. Monthly allowance of EUR 1,181-1,700. Covers housing, health, activities. Prestigious.',
 3.5, 4.2, 6.0, 'Jan', 1, 'https://www.campusfrance.org/en/eiffel-scholarship-program-of-excellence'),

('University of Bologna Study Grants', 'University of Bologna', '{undergrad,masters}', '{eu}', '{any}', 'partial',
 'Tuition fee waivers and study grants for international students. Multiple awards. One of Europe''s oldest universities.',
 3.0, 3.5, 6.0, 'Mar', 3, 'https://www.unibo.it/en/services-and-opportunities/study-grants-and-subsidies'),

-- ===================== FULLY FUNDED — CANADA =====================
('Vanier Canada Graduate', 'Government of Canada', '{phd}', '{canada}', '{stem,health,arts}', 'full',
 '$50,000/year for 3 years for PhD study in Canada. Open to international students including Africans. Highly competitive.',
 3.7, 4.5, 7.0, 'Nov', 11, 'https://vanier.gc.ca'),

('Canada-CARICOM Leadership Scholarships', 'Government of Canada', '{undergrad,masters,phd}', '{canada}', '{any}', 'full',
 'Short-term exchange and study opportunities at Canadian institutions. For students from Caribbean and African countries.',
 3.0, 3.5, 6.5, 'Feb', 2, 'https://www.educanada.ca/scholarships'),

('Trudeau Foundation Scholarship', 'Pierre Elliott Trudeau Foundation', '{phd}', '{canada}', '{arts,law}', 'full',
 'Up to $60,000/year for PhD in social sciences and humanities. Includes travel and networking. Extremely prestigious.',
 3.7, 4.5, 7.0, 'Dec', 12, 'https://www.trudeaufoundation.ca'),

('University of Toronto Lester B. Pearson', 'University of Toronto', '{undergrad}', '{canada}', '{any}', 'full',
 'Full scholarship for exceptional international undergrads. Covers tuition, books, incidentals, full residence support for 4 years.',
 3.7, 4.5, 6.5, 'Nov', 11, 'https://future.utoronto.ca/pearson'),

('McGill Entrance Scholarships', 'McGill University', '{undergrad}', '{canada}', '{any}', 'partial',
 '$3,000-$12,000 renewable entrance scholarships for international students. Automatic consideration upon application.',
 3.5, 4.2, 6.5, 'Jan', 1, 'https://www.mcgill.ca/studentaid/scholarships'),

-- ===================== FULLY FUNDED — AUSTRALIA =====================
('Australia Awards', 'Australian Government (DFAT)', '{masters,phd}', '{australia}', '{any}', 'full',
 'Fully funded study in Australia. Available for select African countries. Strong development outcomes focus. Covers everything.',
 3.0, 3.5, 6.5, 'Apr-May', 4, 'https://www.dfat.gov.au/people-to-people/australia-awards'),

('University of Melbourne Graduate Research', 'University of Melbourne', '{phd}', '{australia}', '{any}', 'full',
 'Covers tuition, living, and relocation allowance for PhD students. Automatic consideration for all international research applicants.',
 3.5, 4.2, 6.5, 'Oct', 10, 'https://study.unimelb.edu.au/how-to-apply/graduate-research'),

('ANU Chancellor''s International Scholarship', 'Australian National University', '{undergrad}', '{australia}', '{any}', 'partial',
 'Up to 50% tuition fee reduction for high-achieving international students. Based on academic merit.',
 3.5, 4.2, 6.5, 'Dec', 12, 'https://www.anu.edu.au/study/scholarships'),

('Monash International Merit Scholarship', 'Monash University', '{undergrad}', '{australia}', '{any}', 'partial',
 '$10,000 per year tuition fee waiver for international undergraduates. Renewable. Based on academic achievement.',
 3.3, 4.0, 6.5, 'Rolling', NULL, 'https://www.monash.edu/study/fees-scholarships'),

-- ===================== WITHIN AFRICA =====================
('Mwalimu Nyerere AU Scholarship', 'African Union', '{masters,phd}', '{africa}', '{any}', 'full',
 'Study at African universities. Promotes intra-Africa academic mobility. Covers tuition and stipend.',
 3.0, 3.5, NULL, 'Varies', NULL, 'https://www.au.int'),

('Mandela Rhodes Scholarship', 'Mandela Rhodes Foundation', '{masters}', '{africa}', '{any}', 'full',
 'For Africans studying at South African universities. Leadership development + academic funding. Must be under 30.',
 3.0, 3.5, NULL, 'Jun', 6, 'https://www.mandelarhodes.org'),

('AIMS Scholarship', 'African Institute for Mathematical Sciences', '{masters}', '{africa}', '{stem}', 'full',
 'Fully funded Master''s in Mathematical Sciences at AIMS centres across Africa (South Africa, Ghana, Cameroon, Rwanda, Senegal, Tanzania).',
 3.0, 3.5, 6.0, 'Mar', 3, 'https://nexteinstein.org'),

('University of Cape Town Postgraduate Funding', 'UCT', '{masters,phd}', '{africa}', '{any}', 'partial',
 'Multiple funding streams for postgraduate study at UCT. Merit and need-based. For African students.',
 3.3, 4.0, 6.0, 'Jul-Oct', 7, 'https://www.uct.ac.za/main/postgraduate-funding'),

('Wits University Postgrad Merit Award', 'University of the Witwatersrand', '{masters,phd}', '{africa}', '{any}', 'partial',
 'Merit-based awards for postgraduate study at Wits. Multiple categories. For South African and African students.',
 3.0, 3.5, 6.0, 'Aug', 8, 'https://www.wits.ac.za/bursaries-and-scholarships'),

('Stellenbosch University Postgrad Bursary', 'Stellenbosch University', '{masters,phd}', '{africa}', '{any}', 'partial',
 'Various bursaries and fellowships for postgraduate study. Merit and need-based options. Research focus.',
 3.0, 3.5, 6.0, 'Jul', 7, 'https://www.sun.ac.za/english/pgstudies/Pages/Bursaries.aspx'),

('Makerere University Graduate Fellowship', 'Makerere University', '{masters,phd}', '{africa}', '{any}', 'partial',
 'Partial funding for postgraduate study at Makerere, Uganda. For East African students. Teaching assistantship available.',
 3.0, 3.5, NULL, 'Apr', 4, 'https://www.mak.ac.ug'),

('University of Ghana Graduate Scholarship', 'University of Ghana', '{masters,phd}', '{africa}', '{any}', 'partial',
 'Partial tuition waivers and stipends for postgraduate study at UG Legon. For Ghanaian and African students.',
 3.0, 3.5, NULL, 'Mar', 3, 'https://www.ug.edu.gh'),

('PASET-RSIF PhD Scholarship', 'Partnership for Skills in Applied Sciences', '{phd}', '{africa}', '{stem}', 'full',
 'PhD training at African flagship universities. Research in ICT, food security, minerals, energy. World Bank supported.',
 3.3, 4.0, 6.0, 'Mar-May', 3, 'https://www.rsif-paset.org'),

('African Leadership University Scholarship', 'ALU', '{undergrad}', '{africa}', '{business,stem}', 'partial',
 'Need-based and merit scholarships for undergraduate study in Rwanda and Mauritius. Innovation-focused curriculum.',
 2.5, 3.0, 5.5, 'Rolling', NULL, 'https://www.alueducation.com'),

('Ashesi University Scholarship', 'Ashesi University', '{undergrad}', '{africa}', '{stem,business}', 'partial',
 'Need-based financial aid covering up to 100% of tuition at Ashesi, Ghana. ~50% of students receive aid.',
 3.0, 3.5, NULL, 'Mar', 3, 'https://www.ashesi.edu.gh/admissions/financial-aid'),

-- ===================== COUNTRY-SPECIFIC — NIGERIA =====================
('PTDF Scholarship Nigeria', 'Nigerian Government (PTDF)', '{masters,phd}', '{global}', '{stem,business}', 'full',
 'For Nigerians only. Overseas and local postgraduate scholarships. Petroleum-related fields preferred but not exclusive.',
 3.0, 3.5, 6.5, 'Mar-May', 3, 'https://ptdf.gov.ng'),

('BEA Scholarship Nigeria', 'Bilateral Education Agreement', '{undergrad,masters,phd}', '{global}', '{any}', 'full',
 'Nigerian government bilateral scholarship for study in partner countries (Russia, China, Cuba, Morocco, etc.). Apply through Federal Scholarship Board.',
 2.5, 3.0, NULL, 'Apr', 4, 'https://www.fsb.gov.ng'),

('NNPC/Total Scholarship Nigeria', 'NNPC/Total', '{undergrad}', '{africa}', '{stem}', 'full',
 'For Nigerian undergraduates studying STEM fields at Nigerian universities. Covers tuition + stipend. Merit-based.',
 3.0, 3.5, NULL, 'Jul-Sep', 7, 'https://www.nnpcgroup.com'),

('Agbami Medical & Engineering Scholarship', 'Agbami Partners (NNPC)', '{undergrad}', '{africa}', '{stem,health}', 'full',
 'For Nigerian students in medicine and engineering. Covers tuition and living. Must maintain high GPA.',
 3.3, 4.0, NULL, 'Jun', 6, 'https://www.agbami.com'),

('MTN Foundation Scholarship Nigeria', 'MTN Nigeria', '{undergrad}', '{africa}', '{any}', 'partial',
 'For Nigerian undergraduates in any field. N200,000 per academic session. Must have minimum CGPA of 3.5/5.0.',
 2.8, 3.5, NULL, 'Oct', 10, 'https://www.mtn.ng/foundation'),

('Shell SPDC Scholarship Nigeria', 'Shell Nigeria', '{undergrad}', '{africa}', '{stem}', 'full',
 'For Nigerian undergraduates in STEM. Covers tuition and living. For students from Niger Delta host communities and national applicants.',
 3.0, 3.5, NULL, 'Jun', 6, 'https://www.shell.com.ng/sustainability'),

('TETFund Scholarship Nigeria', 'Tertiary Education Trust Fund', '{masters,phd}', '{global}', '{any}', 'full',
 'For academic staff of Nigerian tertiary institutions. Overseas and local PhD/Masters. Apply through institution.',
 3.0, 3.5, 6.0, 'Feb', 2, 'https://tetfund.gov.ng'),

-- ===================== COUNTRY-SPECIFIC — KENYA =====================
('CDF Bursary Kenya', 'Constituency Development Fund', '{undergrad}', '{africa}', '{any}', 'partial',
 'For Kenyan students at public universities. Apply through constituency office. Covers partial tuition.',
 NULL, NULL, NULL, 'Jan-Mar', 1, 'https://www.ngcdf.go.ke'),

('HELB Loan Kenya', 'Higher Education Loans Board', '{undergrad,masters}', '{africa}', '{any}', 'partial',
 'Government loans for Kenyan students at approved institutions. Low interest. Undergraduate and postgraduate. Apply online.',
 NULL, NULL, NULL, 'Apr', 4, 'https://www.helb.co.ke'),

('KCB Foundation Scholarship Kenya', 'KCB Foundation', '{undergrad}', '{africa}', '{any}', 'full',
 'For bright but needy Kenyan students. Covers tuition, accommodation, upkeep. Must demonstrate financial need.',
 2.5, 3.0, NULL, 'Mar', 3, 'https://kcbgroup.com/foundation'),

('Equity Bank Wings to Fly', 'Equity Group Foundation', '{undergrad}', '{africa}', '{any}', 'full',
 'For academically gifted but economically disadvantaged Kenyan students. Covers secondary and university education.',
 3.0, 3.5, NULL, 'Jan', 1, 'https://equitygroupfoundation.com'),

-- ===================== COUNTRY-SPECIFIC — GHANA =====================
('GETFund Scholarship Ghana', 'Ghana Education Trust Fund', '{masters,phd}', '{global}', '{any}', 'full',
 'For Ghanaian students for postgraduate study abroad. Covers tuition, living, travel. Must return to Ghana after studies.',
 3.0, 3.5, 6.0, 'Apr', 4, 'https://www.getfund.gov.gh'),

('Jubilee Scholarship Ghana', 'Government of Ghana', '{undergrad}', '{africa}', '{any}', 'partial',
 'For needy but brilliant Ghanaian students. Covers tuition at Ghanaian public universities.',
 2.5, 3.0, NULL, 'Sep', 9, 'https://www.ghana.gov.gh'),

-- ===================== COUNTRY-SPECIFIC — SOUTH AFRICA =====================
('NSFAS South Africa', 'National Student Financial Aid Scheme', '{undergrad}', '{africa}', '{any}', 'full',
 'For South African students from low-income households. Covers tuition, accommodation, meals, books, transport at public universities and TVET colleges.',
 NULL, NULL, NULL, 'Sep-Nov', 9, 'https://www.nsfas.org.za'),

('Funza Lushaka Bursary SA', 'Department of Basic Education', '{undergrad}', '{africa}', '{arts}', 'full',
 'For South African students studying teaching/education. Full bursary with work-back obligation. Priority subjects: maths, science, languages.',
 NULL, NULL, NULL, 'Jan', 1, 'https://www.funzalushaka.doe.gov.za'),

('Allan Gray Orbis Fellowship SA', 'Allan Gray Orbis Foundation', '{undergrad}', '{africa}', '{business}', 'full',
 'For high-potential South African students. Covers university fees + entrepreneurship development program. Strong selection process.',
 3.3, 4.0, NULL, 'Mar', 3, 'https://www.allangrayorbis.org'),

-- ===================== COUNTRY-SPECIFIC — EAST AFRICA =====================
('Mastercard Foundation at RUFORUM', 'Mastercard Foundation / RUFORUM', '{masters,phd}', '{africa}', '{agric,stem}', 'full',
 'For East and Southern African students pursuing agriculture and STEM Master''s/PhD at African universities in the RUFORUM network.',
 3.0, 3.5, NULL, 'Mar', 3, 'https://www.ruforum.org'),

('East African Community Scholarship', 'EAC', '{undergrad,masters}', '{africa}', '{any}', 'partial',
 'For students from EAC member states (Kenya, Uganda, Tanzania, Rwanda, Burundi, South Sudan, DRC). Study within EAC partner universities.',
 2.5, 3.0, NULL, 'Varies', NULL, 'https://www.eac.int'),

-- ===================== FOUNDATIONS & PRIVATE =====================
('Mo Ibrahim Foundation Scholarship', 'Mo Ibrahim Foundation', '{masters}', '{uk}', '{business,law}', 'full',
 'Governance and leadership focused. MBA at SOAS or governance programme at partner universities. For Africans committed to governance.',
 3.0, 3.5, 6.5, 'Jan', 1, 'https://mo.ibrahim.foundation/fellowships'),

('African Development Bank Scholarship', 'AfDB / Japan', '{masters}', '{global}', '{stem,business,agric}', 'full',
 'Japan-Africa Dream Scholarship (JADS) for Master''s in Japan. KOAFEC for study in Korea. Multiple programmes.',
 3.0, 3.5, 6.0, 'Varies', NULL, 'https://www.afdb.org'),

('Aga Khan Foundation Scholarship', 'Aga Khan Foundation', '{masters,phd}', '{global}', '{any}', 'partial',
 '50% grant / 50% loan for postgraduate study. Available for students from select African countries (Kenya, Uganda, Tanzania, Mozambique, Madagascar, Egypt).',
 3.0, 3.5, 6.0, 'Mar', 3, 'https://www.akdn.org/our-agencies/aga-khan-foundation'),

('Tony Elumelu Foundation Entrepreneurship', 'Tony Elumelu Foundation', '{undergrad,masters}', '{africa}', '{business}', 'full',
 'Not a traditional scholarship — $5,000 seed capital + training for African entrepreneurs. 1,000 beneficiaries per year. All 54 African countries.',
 NULL, NULL, NULL, 'Mar', 3, 'https://www.tonyelumelufoundation.org'),

('Mandela Washington Fellowship (YALI)', 'US Department of State', '{undergrad,masters}', '{us}', '{business,law}', 'full',
 'For young African leaders aged 25-35. 6-week leadership institute at US university + optional internship. Not a degree program.',
 NULL, NULL, 6.0, 'Sep-Oct', 9, 'https://www.mandelawashingtonfellowship.org'),

('African Women''s Development Fund Grant', 'AWDF', '{masters}', '{africa,global}', '{any}', 'partial',
 'Grants for African women in higher education and professional development. Various amounts. Focus on gender equality.',
 NULL, NULL, NULL, 'Rolling', NULL, 'https://awdf.org'),

('Canon Collins Trust Scholarship', 'Canon Collins Trust', '{masters,phd}', '{uk,africa}', '{law,arts}', 'full',
 'For Southern African students studying in UK or South Africa. Focus on social justice, human rights. Covers tuition + living.',
 3.0, 3.5, 6.5, 'Mar', 3, 'https://canoncollins.org.uk'),

('Rotary Peace Fellowship', 'Rotary Foundation', '{masters}', '{global}', '{law,arts}', 'full',
 'Master''s in peace and conflict resolution at partner universities globally. Covers tuition, room, board, travel. 50 fellows per year.',
 3.0, 3.5, 7.0, 'May', 5, 'https://www.rotary.org/en/our-programs/peace-fellowships'),

('Ford Foundation International Fellowship', 'Ford Foundation / IIE', '{masters,phd}', '{global}', '{any}', 'full',
 'For individuals who will use graduate education to become leaders in their fields. Covers tuition + living + related expenses.',
 3.0, 3.5, 6.5, 'Varies', NULL, 'https://www.fordfoundation.org'),

('Open Society Foundation Scholarship', 'Open Society Foundations', '{undergrad,masters}', '{global}', '{law,arts}', 'full',
 'Multiple scholarship programs for students from marginalized communities. Covers tuition and living. Focus on civil society.',
 3.0, 3.5, 6.0, 'Varies', NULL, 'https://www.opensocietyfoundations.org'),

('Jack Kent Cooke Foundation', 'Jack Kent Cooke Foundation', '{undergrad}', '{us}', '{any}', 'full',
 'Transfer scholarship for community college students transferring to 4-year institutions. Up to $55,000/year. Includes international students.',
 3.5, 4.2, 6.0, 'Nov', 11, 'https://www.jkcf.org'),

('Mastercard Foundation at AKU', 'Mastercard Foundation / Aga Khan University', '{undergrad,masters}', '{africa}', '{health,stem}', 'full',
 'For East African students studying health sciences at Aga Khan University. Covers tuition, living, and professional development.',
 3.0, 3.5, 6.0, 'Mar', 3, 'https://www.aku.edu'),

('Firoz Lalji Africa Institute Scholarship', 'London School of Economics', '{masters}', '{uk}', '{business,law,arts}', 'full',
 'For African students studying at LSE. Covers tuition and partial living costs. Focus on Africa-related studies.',
 3.5, 4.2, 7.0, 'Apr', 4, 'https://www.lse.ac.uk/africa'),

-- ===================== STEM-SPECIFIC =====================
('Google Africa Developer Scholarship', 'Google', '{undergrad,masters}', '{global}', '{stem}', 'full',
 'Free online training and certification in Android, Cloud, Mobile Web. Not traditional scholarship but provides free tech education + job-ready skills.',
 NULL, NULL, NULL, 'Varies', NULL, 'https://developers.google.com/community/gdsc'),

('OWSD PhD Fellowship', 'Organization for Women in Science', '{phd}', '{africa,global}', '{stem}', 'full',
 'For women from developing countries pursuing PhD in STEM at developing country institutions. Covers everything. UNESCO supported.',
 3.0, 3.5, 6.0, 'Apr', 4, 'https://owsd.net'),

('TWAS-DFG Cooperation Visits', 'The World Academy of Sciences', '{phd,postdoc}', '{eu}', '{stem}', 'full',
 'Research visits of 1-3 months to German laboratories. For young scientists from developing countries. Travel + living covered.',
 3.0, 3.5, NULL, 'Oct', 10, 'https://twas.org'),

('African Mathematics Millennium Science Initiative', 'AMMSI', '{masters,phd}', '{africa}', '{stem}', 'partial',
 'Grants for mathematics and science postgraduate study at African universities. Supports research and conference attendance.',
 3.0, 3.5, NULL, 'Varies', NULL, 'https://www.ammsi.org'),

('Microsoft 4Afrika Scholarship', 'Microsoft', '{undergrad,masters}', '{global}', '{stem}', 'partial',
 'Skills development and scholarship support for African students in technology. Includes internship opportunities.',
 2.5, 3.0, NULL, 'Rolling', NULL, 'https://www.microsoft.com/en-us/corporate-responsibility/skills-employability'),

('Schlumberger Foundation FFTF', 'Schlumberger Foundation', '{phd,postdoc}', '{global}', '{stem}', 'full',
 'Faculty for the Future. For women from developing countries pursuing PhD/postdoc in STEM. Up to $50,000/year. Must return home.',
 3.3, 4.0, 6.5, 'Nov', 11, 'https://www.slb.com/who-we-are/schlumberger-foundation'),

-- ===================== BUSINESS & LEADERSHIP =====================
('Africa Oxford Initiative', 'University of Oxford', '{phd,postdoc}', '{uk}', '{any}', 'full',
 'Travel grants and visiting fellowships for African researchers at Oxford. Short-term visits and collaborative research.',
 3.5, 4.2, 7.0, 'Varies', NULL, 'https://www.afriox.ox.ac.uk'),

('SOAS University of London Scholarship', 'SOAS', '{masters}', '{uk}', '{arts,law,business}', 'partial',
 'Various scholarships for African students. Partial tuition fee waivers. Focus on Asian, African and Middle Eastern studies.',
 3.0, 3.5, 6.5, 'May', 5, 'https://www.soas.ac.uk/study/student-finance/scholarships'),

('African Economic Research Consortium', 'AERC', '{masters,phd}', '{africa}', '{business}', 'full',
 'For African students studying economics. Master''s at Joint Facility for Electives (JFE) partner universities. PhD in economics.',
 3.0, 3.5, 6.0, 'Feb', 2, 'https://aercafrica.org'),

('Emerging Leaders in Technology and Engineering', 'Royal Academy of Engineering', '{undergrad,masters}', '{uk}', '{stem}', 'partial',
 'Awards for African engineering students. Includes mentoring and networking. Partial financial support.',
 3.0, 3.5, 6.5, 'Varies', NULL, 'https://www.raeng.org.uk/grants-prizes'),

-- ===================== HEALTH & MEDICINE =====================
('Wellcome Trust Africa Programmes', 'Wellcome Trust', '{phd,postdoc}', '{africa,uk}', '{health}', 'full',
 'Research funding for health scientists based in Africa. Multiple schemes: PhD, postdoc, fellowship. Generous funding.',
 3.3, 4.0, 6.5, 'Varies', NULL, 'https://wellcome.org/what-we-do/our-work/research-africa'),

('WHO TDR Research Training Grant', 'World Health Organization', '{masters,phd}', '{global}', '{health}', 'full',
 'Research training in tropical disease research. For scientists from low-income countries. Covers tuition, travel, stipend.',
 3.0, 3.5, 6.0, 'Mar', 3, 'https://tdr.who.int/grants'),

('Fogarty International Center Training Grant', 'US NIH', '{phd,postdoc}', '{us}', '{health}', 'full',
 'Research training for health scientists from developing countries. Programs at US institutions. Long-term and short-term.',
 3.3, 4.0, 6.5, 'Varies', NULL, 'https://www.fic.nih.gov'),

('CARTA PhD Fellowship', 'Consortium for Advanced Research Training in Africa', '{phd}', '{africa}', '{health}', 'full',
 'PhD training in public and population health at African universities. Includes seminar series and research support.',
 3.0, 3.5, 6.0, 'Mar', 3, 'https://cartafrica.org'),

-- ===================== LAW & GOVERNANCE =====================
('Chevening/African Union Fellowship', 'UK Government / African Union', '{masters}', '{uk}', '{law,business}', 'full',
 'Combined Chevening and AU program for future African leaders in governance. Study at UK university + AU attachment.',
 3.0, 3.5, 6.5, 'Nov', 11, 'https://www.chevening.org'),

('International Criminal Court Internship', 'ICC', '{masters}', '{eu}', '{law}', 'partial',
 'Internship at ICC in The Hague. For law students/graduates. Unpaid but provides invaluable experience. Travel support available.',
 3.0, 3.5, 6.0, 'Varies', NULL, 'https://www.icc-cpi.int/get-involved/internships-visiting-professionals'),

-- ===================== AGRICULTURE & ENVIRONMENT =====================
('CGIAR Research Fellowship', 'CGIAR', '{masters,phd,postdoc}', '{global}', '{agric}', 'full',
 'Research positions at CGIAR centers worldwide. For agricultural scientists from developing countries. Includes IITA, ICRISAT, CIMMYT.',
 3.0, 3.5, 6.0, 'Rolling', NULL, 'https://www.cgiar.org'),

('RUFORUM Graduate Research Grant', 'RUFORUM', '{masters,phd}', '{africa}', '{agric}', 'full',
 'For agricultural research students at RUFORUM member universities in Africa. Covers tuition and research costs.',
 3.0, 3.5, NULL, 'Feb', 2, 'https://www.ruforum.org'),

('AWARD Fellowship for African Women in Ag', 'CGIAR Gender Platform', '{phd,postdoc}', '{africa}', '{agric}', 'full',
 'African Women in Agricultural Research and Development. Mentoring, science skills, leadership training. For women researchers.',
 3.0, 3.5, NULL, 'May', 5, 'https://www.awardfellowships.org'),

-- ===================== ARTS & HUMANITIES =====================
('Africa-UK Doctoral Training Partnership', 'AHRC/UKRI', '{phd}', '{uk}', '{arts}', 'full',
 'Joint PhD between UK and African universities. Fully funded. Focus on arts and humanities research with African relevance.',
 3.5, 4.2, 7.0, 'Jan', 1, 'https://www.ukri.org'),

('Prince Claus Fund', 'Prince Claus Fund', '{masters}', '{global}', '{arts}', 'partial',
 'Grants for cultural practitioners and organizations in Africa, Asia, Latin America. Not traditional scholarship. Supports creative work.',
 NULL, NULL, NULL, 'Rolling', NULL, 'https://princeclausfund.org'),

-- ===================== GENERAL / MULTI-COUNTRY =====================
('Kofi Annan Fellowship', 'Kofi Annan Foundation', '{masters}', '{eu}', '{business,law}', 'full',
 'For young Africans pursuing Master''s in business or governance at European partner institutions. Covers tuition + living.',
 3.0, 3.5, 6.5, 'Apr', 4, 'https://www.kofiannanfoundation.org'),

('African Union Kwame Nkrumah Scientific Award', 'African Union', '{phd,postdoc}', '{africa}', '{stem}', 'full',
 'Award for outstanding African researchers in life/earth sciences, basic science/technology/innovation. Cash prize + research grant.',
 3.5, 4.2, NULL, 'Jun', 6, 'https://www.au.int'),

('Next Einstein Forum Fellowship', 'NEF / African Institute for Mathematical Sciences', '{phd,postdoc}', '{africa,global}', '{stem}', 'partial',
 'For young African scientists. Networking, mentoring, visibility. Not a traditional scholarship but provides research support.',
 3.0, 3.5, NULL, 'Varies', NULL, 'https://nef.org'),

('Japanese Government MEXT Scholarship', 'Government of Japan', '{undergrad,masters,phd}', '{global}', '{any}', 'full',
 'Study in Japan. Full coverage: tuition, living, flights. Apply through Japanese embassy. Includes Japanese language training.',
 3.0, 3.5, NULL, 'Apr', 4, 'https://www.mext.go.jp'),

('Korean Government KGSP Scholarship', 'Government of South Korea', '{undergrad,masters,phd}', '{global}', '{any}', 'full',
 'Study in South Korea (Global Korea Scholarship). Full coverage. Includes 1 year Korean language training. Apply via embassy or university.',
 2.8, 3.4, NULL, 'Mar', 3, 'https://www.studyinkorea.go.kr'),

('New Zealand Development Scholarship', 'MFAT New Zealand', '{masters,phd}', '{global}', '{any}', 'full',
 'For students from developing countries. Study at New Zealand universities. Full coverage. Strong development focus.',
 3.0, 3.5, 6.5, 'Mar', 3, 'https://www.mfat.govt.nz/en/aid-and-development'),

('Singapore Government Scholarship', 'Singapore Ministry of Education', '{undergrad,phd}', '{global}', '{stem,business}', 'full',
 'Study at NUS, NTU, or SMU. Covers tuition + living. Service bond required. Highly competitive.',
 3.5, 4.2, 6.5, 'Mar', 3, 'https://www.moe.gov.sg/financial-matters/awards-scholarships'),

('Indian Council for Cultural Relations', 'Government of India', '{undergrad,masters,phd}', '{global}', '{any}', 'full',
 'Study in India under ICCR scholarship. Full coverage including tuition, living, travel. Apply through Indian embassy.',
 2.5, 3.0, NULL, 'Apr', 4, 'https://www.iccr.gov.in'),

('Russian Government Scholarship', 'Government of Russia', '{undergrad,masters,phd}', '{global}', '{any}', 'full',
 'Study in Russia. Covers tuition. Some programs include living stipend. Wide range of fields. Apply through Russian embassy.',
 2.5, 3.0, NULL, 'Feb', 2, 'https://education-in-russia.com'),

('Polish National Agency NAWA', 'Polish National Agency for Academic Exchange', '{masters,phd}', '{eu}', '{any}', 'full',
 'Study in Poland. Multiple programs. Covers tuition + living allowance. For students from developing countries.',
 3.0, 3.5, NULL, 'Feb', 2, 'https://nawa.gov.pl/en'),

('Czech Government Scholarship', 'Czech Republic Government', '{undergrad,masters,phd}', '{eu}', '{any}', 'full',
 'Study in Czech Republic. No tuition at public universities for Czech-taught programs. Scholarship covers living costs.',
 2.5, 3.0, NULL, 'Sep', 9, 'https://www.studyin.cz'),

('Romanian Government Scholarship', 'Romanian Ministry of Foreign Affairs', '{undergrad,masters,phd}', '{eu}', '{any}', 'full',
 'For students from non-EU developing countries. Covers tuition + monthly stipend. Wide range of programs.',
 2.5, 3.0, NULL, 'Mar', 3, 'https://www.mae.ro/en'),

('Egyptian Government Scholarship', 'Al-Azhar University / Egyptian Ministry', '{undergrad,masters,phd}', '{africa}', '{any}', 'full',
 'For African and Muslim-majority country students. Study at Al-Azhar or Egyptian public universities. Covers tuition + stipend.',
 2.5, 3.0, NULL, 'Jun', 6, 'https://www.mohesr.gov.eg'),

('Moroccan Government AMCI', 'Moroccan Agency for International Cooperation', '{undergrad,masters,phd}', '{africa}', '{any}', 'full',
 'For African students. Study in Morocco. Covers tuition + living + health insurance. French or Arabic medium. Very accessible.',
 2.5, 3.0, NULL, 'Jul', 7, 'https://www.amci.ma'),

('Algerian Government Scholarship', 'Algerian Ministry of Higher Education', '{undergrad,masters,phd}', '{africa}', '{any}', 'full',
 'For African students from partner countries. Study at Algerian universities. French medium. Covers tuition + modest stipend.',
 2.5, 3.0, NULL, 'Sep', 9, 'https://www.mesrs.dz'),

('Tunisia Government Scholarship', 'Tunisian Ministry of Higher Education', '{undergrad,masters}', '{africa}', '{any}', 'partial',
 'For African students. Study in Tunisia. French or Arabic medium. Partial coverage. Growing international student population.',
 2.5, 3.0, NULL, 'Jul', 7, 'https://www.mes.tn'),

('DAAD In-Country/In-Region Scholarship', 'DAAD', '{masters,phd}', '{africa}', '{any}', 'full',
 'Study at African partner universities supported by DAAD. Covers tuition + living. For students who prefer to study within Africa.',
 3.0, 3.5, 6.0, 'Oct', 10, 'https://www.daad.de/en/find-funding'),

('Commonwealth Distance Learning Scholarship', 'Commonwealth Secretariat', '{masters}', '{global}', '{any}', 'partial',
 'For online/distance Master''s at UK universities. Covers tuition fees only. Ideal for working professionals.',
 3.0, 3.5, 6.0, 'Apr', 4, 'https://cscuk.fcdo.gov.uk'),

('African Peacebuilding Network Fellowship', 'Social Science Research Council', '{phd,postdoc}', '{global}', '{law,arts}', 'full',
 'Research fellowships for African scholars working on conflict and peacebuilding. Up to $15,000. Includes residency at US institutions.',
 3.0, 3.5, 6.5, 'Jan', 1, 'https://www.ssrc.org/programs/africa'),

('Islamic Development Bank Scholarship', 'IsDB', '{undergrad,masters,phd}', '{global}', '{stem,health}', 'full',
 'For students from IsDB member countries (most African countries). Study in any member country. Covers tuition + living + travel.',
 3.0, 3.5, NULL, 'Mar', 3, 'https://www.isdb.org'),

('Commonwealth Shared Scholarship', 'Commonwealth / UK Universities', '{masters}', '{uk}', '{any}', 'full',
 'Joint funding by UK government and universities. For students from least developed Commonwealth countries. Full coverage.',
 3.0, 3.5, 6.5, 'Dec', 12, 'https://cscuk.fcdo.gov.uk'),

('Cambridge Trust Scholarship', 'University of Cambridge', '{masters,phd}', '{uk}', '{any}', 'full',
 'For outstanding international students at Cambridge. Covers tuition + maintenance. ~250 awards per year. Automatic consideration.',
 3.7, 4.5, 7.0, 'Dec', 12, 'https://www.cambridgetrust.org'),

('Queen Elizabeth Commonwealth Scholarship', 'Association of Commonwealth Universities', '{masters}', '{global}', '{any}', 'full',
 'Low-cost Master''s at universities in low/middle income Commonwealth countries. For South-South academic exchange.',
 3.0, 3.5, 6.0, 'Varies', NULL, 'https://www.acu.ac.uk/funding-opportunities'),

('USAID Higher Education Partnerships', 'USAID', '{masters,phd}', '{us,africa}', '{agric,health,stem}', 'full',
 'Through various USAID programs like Feed the Future. Partnerships between US and African universities. Covers tuition + research.',
 3.0, 3.5, 6.0, 'Varies', NULL, 'https://www.usaid.gov/education'),

('Global Health Corps Fellowship', 'Global Health Corps', '{undergrad,masters}', '{africa,us}', '{health}', 'full',
 'Paid fellowship (not scholarship). Place young professionals in health organizations in Africa and US. 13-month placement.',
 NULL, NULL, NULL, 'Jan', 1, 'https://ghcorps.org'),

('Atlas Corps Fellowship', 'Atlas Corps', '{undergrad,masters}', '{us}', '{any}', 'full',
 'Professional fellowship for international social change leaders. 6-18 months at US organizations. Covers living + travel. Not degree.',
 NULL, NULL, 6.0, 'Rolling', NULL, 'https://atlascorps.org'),

('Heinrich Boll Foundation Scholarship', 'Heinrich Boll Foundation', '{undergrad,masters,phd}', '{eu}', '{any}', 'full',
 'Study in Germany. For students committed to green/sustainability values. Monthly stipend + tuition. Open to international students.',
 3.0, 3.5, 6.0, 'Mar/Sep', 3, 'https://www.boell.de/en/foundation/scholarships'),

('Konrad Adenauer Foundation Scholarship', 'Konrad Adenauer Stiftung', '{undergrad,masters,phd}', '{eu}', '{any}', 'full',
 'Study in Germany. For students with strong academic record and social engagement. Monthly stipend + tuition. German language helpful.',
 3.0, 3.5, 6.0, 'Jul', 7, 'https://www.kas.de/en/scholarships'),

('Friedrich Ebert Foundation Scholarship', 'Friedrich Ebert Stiftung', '{undergrad,masters,phd}', '{eu}', '{arts,law}', 'full',
 'Study in Germany. Focus on social democracy and workers'' rights. Monthly stipend + tuition. Must show social/political engagement.',
 3.0, 3.5, 6.0, 'Varies', NULL, 'https://www.fes.de/studienfoerderung'),

('Rosa Luxemburg Foundation Scholarship', 'Rosa Luxemburg Stiftung', '{undergrad,masters,phd}', '{eu}', '{arts,law}', 'full',
 'Study in Germany. For students committed to social justice. Monthly stipend. Open to international students from developing countries.',
 3.0, 3.5, 6.0, 'Apr/Oct', 4, 'https://www.rosalux.de/stiftung/studienwerk');

/**
 * AFROTOOLS NAVBAR — Everything Platform Edition
 * Mega-menu with 34 categories from tool registry. Mobile drawer. Web Component.
 */
(function () {
  'use strict';

  const NAV_ITEMS = [
    {
      id: 'financial', label: 'Salary & Tax', labelFr: 'Salaire & Impôts', labelSw: 'Mshahara & Kodi', icon: '💰',
      desc: 'PAYE, income tax, FX, crypto', descFr: 'PAYE, impôt, change, crypto', descSw: 'PAYE, kodi, sarafu, crypto',
      href: '/salary-tax/', hrefFr: '/fr/salary-tax/', hrefSw: '/sw/mshahara-na-kodi/', color: '#e8f0fd', accent: '#0062CC',
      tools: [
        { label: 'Nigeria PAYE Calculator', href: '/nigeria/ng-salary-tax', emoji: '🇳🇬', badge: 'LIVE' },
        { label: 'Kenya PAYE Calculator', href: '/kenya/ke-paye', emoji: '🇰🇪', badge: 'LIVE' },
        { label: 'South Africa SARS Tax', href: '/south-africa/za-paye', emoji: '🇿🇦', badge: 'LIVE' },
        { label: 'Ghana PAYE + SSNIT', href: '/ghana/gh-paye', emoji: '🇬🇭', badge: 'LIVE' },
        { label: 'Egypt Income Tax', href: '/egypt/eg-paye', emoji: '🇪🇬', badge: 'LIVE' },
        { label: 'AI Business Planner', href: '/tools/business-planner/', emoji: '📋', badge: 'LIVE' },
        { label: 'Mortgage Calculator', href: '/tools/mortgage-calculator/', emoji: '🏠', badge: 'LIVE' },
        { label: 'Bank Charges Comparator', href: '/tools/bank-charges/', emoji: '🏦', badge: 'LIVE' },
        { label: 'FIRE Calculator for Africa', href: '/tools/retirement-planner/', emoji: '🏖️', badge: 'LIVE' },
        { label: 'Minimum Wage Checker', href: '/tools/minimum-wage/', emoji: '💰', badge: 'NEW' },
        { label: 'Overtime Calculator', href: '/tools/overtime-calc/', emoji: '⏰', badge: 'NEW' },
        { label: 'Leave & PTO Calculator', href: '/tools/leave-calculator/', emoji: '🏖️', badge: 'NEW' },
        { label: 'Social Security Calculator', href: '/tools/social-security/', emoji: '🛡️', badge: 'NEW' },
        { label: 'Pension Projection', href: '/tools/pension-projection/', emoji: '📈', badge: 'NEW' },
        { label: 'All 54 PAYE Calculators →', href: '/salary-tax/', emoji: '💰' },
      ]
    },
    {
      id: 'hr-payroll', label: 'HR & Payroll', labelFr: 'RH & Paie', labelSw: 'Rasilimali Watu', icon: '💼',
      desc: 'Employee cost, leave, severance', descFr: 'Coût employé, congés, licenciement', descSw: 'Gharama, likizo, fidia',
      href: '/hr-payroll/', color: '#f0fdfa', accent: '#0d9488',
      tools: [
        { label: 'Employee Cost Calculator', href: '/tools/employee-cost/', emoji: '💸', badge: 'NEW' },
        { label: 'Contractor vs Employee', href: '/tools/contractor-vs-employee/', emoji: '⚖️', badge: 'NEW' },
        { label: 'Maternity/Paternity Leave', href: '/tools/maternity-leave/', emoji: '🤰', badge: 'NEW' },
        { label: 'Gratuity & Severance', href: '/tools/gratuity-calculator/', emoji: '💵', badge: 'NEW' },
        { label: 'Retrenchment Package', href: '/tools/retrenchment-calculator/', emoji: '📦', badge: 'NEW' },
        { label: 'Work Permit Cost Guide', href: '/tools/work-permit-cost/', emoji: '🛂', badge: 'NEW' },
        { label: 'Freelancer Rate Card', href: '/tools/freelancer-rate/', emoji: '📋', badge: 'NEW' },
        { label: 'Domestic Worker Guide', href: '/tools/domestic-worker/', emoji: '🏠', badge: 'NEW' },
        { label: 'All HR & Payroll Tools →', href: '/hr-payroll/', emoji: '💼' },
      ]
    },
    {
      id: 'document-pdf', label: 'Document & PDF', labelFr: 'Documents & PDF', labelSw: 'Nyaraka na PDF', icon: '📄',
      desc: 'Merge, split, compress, convert', descFr: 'Fusionner, diviser, compresser, convertir', descSw: 'Unganisha, gawanya, bana, badilisha',
      href: '/document-pdf/', hrefFr: '/fr/document-pdf/', hrefSw: '/sw/hati-na-pdf/', color: '#eff6ff', accent: '#3b82f6',
      tools: [
        { label: 'CV / Resume Builder', href: '/tools/cv-builder/', emoji: '📝', badge: 'LIVE' },
        { label: 'PDF Editor', href: '/tools/pdf-editor/', emoji: '✏️', badge: 'LIVE' },
        { label: 'PDF Workspace', href: '/tools/pdf-workspace/', emoji: '📄', badge: 'LIVE' },
        { label: 'Invoice Generator', href: '/tools/invoice-generator/', emoji: '🧾', badge: 'LIVE' },
        { label: 'PDF Merge & Split', href: '/tools/pdf-merge-split/', emoji: '📑', badge: 'LIVE' },
        { label: 'PDF Compressor', href: '/tools/pdf-compress/', emoji: '🗜️', badge: 'LIVE' },
        { label: 'PDF Format Converter', href: '/tools/pdf-convert/', emoji: '🔄', badge: 'LIVE' },
        { label: 'AI Chat with PDF', href: '/tools/pdf-chat/', emoji: '💬', badge: 'NEW' },
        { label: 'PDF eSignature', href: '/tools/pdf-sign/', emoji: '✍️', badge: 'LIVE' },
        { label: 'Cover Letter Generator', href: '/tools/cover-letter-generator/', emoji: '✉️', badge: 'LIVE' },
        { label: 'All PDF Tools →', href: '/document-pdf/', emoji: '📄' },
      ],
      toolsFr: [
        { label: 'Fusionner et diviser PDF', href: '/fr/tools/fusionner-diviser-pdf/', emoji: '📑', badge: 'LIVE' },
        { label: 'Compresser PDF', href: '/fr/tools/compresser-pdf/', emoji: '🗜️', badge: 'LIVE' },
        { label: 'Convertir PDF', href: '/fr/tools/convertir-pdf/', emoji: '🔄', badge: 'LIVE' },
        { label: 'PDF en image', href: '/fr/tools/pdf-en-image/', emoji: '🖼️', badge: 'LIVE' },
        { label: 'Filigrane PDF', href: '/fr/tools/filigrane-pdf/', emoji: '💧', badge: 'LIVE' },
        { label: 'Numérotation PDF', href: '/fr/tools/numerotation-pdf/', emoji: '#', badge: 'LIVE' },
        { label: 'Comparer PDF', href: '/fr/tools/comparer-pdf/', emoji: '🔍', badge: 'LIVE' },
        { label: 'Réorganiser PDF', href: '/fr/tools/reorganiser-pdf/', emoji: '↕️', badge: 'LIVE' },
        { label: 'En-tête et pied de page PDF', href: '/fr/tools/entete-pied-pdf/', emoji: '📄', badge: 'LIVE' },
        { label: 'Numérotation Bates PDF', href: '/fr/tools/numerotation-bates-pdf/', emoji: '🏷️', badge: 'LIVE' },
        { label: 'Rechercher et remplacer PDF', href: '/fr/tools/rechercher-remplacer-pdf/', emoji: '✏️', badge: 'LIVE' },
        { label: 'Réparer PDF', href: '/fr/tools/reparer-pdf/', emoji: '🛠️', badge: 'LIVE' },
        { label: 'HTML en PDF', href: '/fr/tools/html-en-pdf/', emoji: '🌐', badge: 'LIVE' },
        { label: 'Remplir un formulaire PDF', href: '/fr/tools/remplir-formulaire-pdf/', emoji: '📝', badge: 'LIVE' },
      ]
    },
    {
      id: 'image-design', label: 'Image & Design', labelFr: 'Image & Design', labelSw: 'Picha na Ubunifu', icon: '🖼️',
      desc: 'Compress, resize, QR codes', descFr: 'Compresser, redimensionner, codes QR', descSw: 'Bana, badilisha ukubwa, misimbo QR',
      href: '/image-design/', hrefFr: '/fr/image-design/', color: '#fdf2f8', accent: '#ec4899',
      tools: [
        { label: 'Image Compressor', href: '/tools/image-compress/', emoji: '📷', badge: 'LIVE' },
        { label: 'Background Remover', href: '/tools/background-remover/', emoji: '✂️', badge: 'LIVE' },
        { label: 'Image Resizer & Converter', href: '/tools/image-resize/', emoji: '↔️', badge: 'LIVE' },
        { label: 'QR Code Generator', href: '/tools/qr-generator/', emoji: '📲', badge: 'LIVE' },
        { label: 'Passport Photo Tool', href: '/tools/passport-photo/', emoji: '📸', badge: 'LIVE' },
        { label: 'Meme Generator', href: '/tools/meme-generator/', emoji: '😂', badge: 'LIVE' },
        { label: 'Flyer & Poster Maker', href: '/tools/flyer-maker/', emoji: '📰', badge: 'LIVE' },
        { label: 'Logo Maker', href: '/tools/logo-maker/', emoji: '🏷️', badge: 'LIVE' },
        { label: 'Image to Text (OCR)', href: '/tools/image-to-text/', emoji: '🔤', badge: 'LIVE' },
        { label: 'All Image Tools →', href: '/image-design/', emoji: '🖼️' },
      ]
    },
    {
      id: 'developer', label: 'Developer Tools', labelFr: 'Outils Dev', labelSw: 'Zana za Dev', icon: '⌨️',
      desc: 'JSON, Base64, hash, regex', descFr: 'JSON, Base64, hachage, regex', descSw: 'JSON, Base64, hash, regex',
      href: '/developer-tools/', hrefFr: '/fr/developer-tools/', color: '#ede9fe', accent: '#8b5cf6',
      tools: [
        { label: 'JSON Formatter & Validator', href: '/tools/json-formatter/', emoji: '{ }', badge: 'LIVE' },
        { label: 'API Tester (Postman Lite)', href: '/tools/api-tester/', emoji: '🧪', badge: 'LIVE' },
        { label: 'Regex Tester', href: '/tools/regex-tester/', emoji: '🔍', badge: 'LIVE' },
        { label: 'Base64 Encoder/Decoder', href: '/tools/base64/', emoji: '🔐', badge: 'LIVE' },
        { label: 'JWT Decoder', href: '/tools/jwt-decoder/', emoji: '🪙', badge: 'LIVE' },
        { label: 'Text/Code Diff Checker', href: '/tools/diff-checker/', emoji: '🔀', badge: 'LIVE' },
        { label: 'Markdown Editor', href: '/tools/markdown-editor/', emoji: '📝', badge: 'LIVE' },
        { label: 'USSD Code Simulator', href: '/tools/ussd-simulator/', emoji: '📞', badge: 'LIVE' },
        { label: 'African API Directory', href: '/tools/african-api-directory/', emoji: '🌍', badge: 'NEW' },
        { label: 'USSD Flow Builder', href: '/tools/ussd-flow-builder/', emoji: '📞', badge: 'NEW' },
        { label: 'African Domain Checker', href: '/tools/african-domains/', emoji: '🌐', badge: 'NEW' },
        { label: 'PWA Manifest Generator', href: '/tools/pwa-manifest/', emoji: '📱', badge: 'NEW' },
        { label: 'African Color Palette', href: '/tools/african-palette/', emoji: '🎨', badge: 'NEW' },
        { label: 'Hosting Cost Comparator', href: '/tools/hosting-compare/', emoji: '☁️', badge: 'NEW' },
        { label: 'Docker Compose Generator', href: '/tools/docker-compose-gen/', emoji: '🐳', badge: 'NEW' },
        { label: 'Commit Message Generator', href: '/tools/commit-message-gen/', emoji: '📝', badge: 'NEW' },
        { label: 'All Developer Tools →', href: '/developer-tools/', emoji: '⌨️' },
      ]
    },
    {
      id: 'education', label: 'Education', labelFr: 'Éducation', labelSw: 'Elimu', icon: '🎓',
      desc: 'GPA, WAEC, loans, fees', descFr: 'GPA, WAEC, prêts, frais scolaires', descSw: 'GPA, NECTA, mikopo, ada',
      href: '/education/', hrefFr: '/fr/education/', hrefSw: '/sw/elimu/', color: '#EEF4FF', accent: '#3B82F6',
      tools: [
        { label: 'AfroJAMB Hub — CBT + AI Tutor', href: '/jamb/', emoji: '🎯', badge: 'NEW' },
        { label: 'JAMB CBT Mock Exam', href: '/jamb/cbt/', emoji: '⚡', badge: 'NEW' },
        { label: 'JAMB AI Tutor', href: '/jamb/tutor/', emoji: '🤖', badge: 'NEW' },
        { label: 'JAMB Past Questions Bank', href: '/jamb/past-questions/', emoji: '📚', badge: 'NEW' },
        { label: 'WAEC/NECO Grade Calculator', href: '/tools/waec-calculator/', emoji: '📋', badge: 'LIVE' },
        { label: 'JAMB Aggregate Calculator', href: '/tools/jamb-aggregate/', emoji: '🎓', badge: 'LIVE' },
        { label: 'GPA/CGPA Calculator', href: '/tools/gpa-calculator/', emoji: '🎓', badge: 'LIVE' },
        { label: 'Matric APS Score (SA)', href: '/tools/matric-points/', emoji: '🎓', badge: 'LIVE' },
        { label: 'School Fees Comparison Tool', href: '/tools/school-fees/', emoji: '🏫', badge: 'NEW' },
        { label: 'Study Abroad Cost Calculator', href: '/tools/study-abroad-cost/', emoji: '✈️', badge: 'NEW' },
        { label: 'Teacher Salary Scale Lookup', href: '/tools/teacher-salary/', emoji: '👨‍🏫', badge: 'NEW' },
        { label: 'Student Loan Repayment Calc', href: '/tools/student-loan-repay/', emoji: '💰', badge: 'NEW' },
        { label: 'NYSC Allowance Calculator', href: '/tools/nysc-allowance/', emoji: '🇳🇬', badge: 'NEW' },
        { label: 'Kenya HELB Calculator', href: '/tools/ke-helb/', emoji: '🇰🇪', badge: 'NEW' },
        { label: 'KCSE Grade Calculator', href: '/tools/kcse-calculator/', emoji: '🇰🇪', badge: 'NEW' },
        { label: 'Ghana NSS Allowance', href: '/tools/national-service-gh/', emoji: '🇬🇭', badge: 'NEW' },
        { label: 'University Admission Points', href: '/tools/university-admission/', emoji: '🎓', badge: 'NEW' },
        { label: 'Scholarship Finder', href: '/tools/scholarship-finder/', emoji: '🏆', badge: 'LIVE' },
        { label: 'Student Budget Planner', href: '/tools/student-budget/', emoji: '💸', badge: 'NEW' },
        { label: 'Coding Bootcamp Comparator', href: '/tools/coding-bootcamp/', emoji: '💻', badge: 'NEW' },
        { label: 'Exam Countdown Timer', href: '/tools/exam-countdown/', emoji: '⏳', badge: 'LIVE' },
        { label: 'Citation Generator', href: '/tools/citation-generator/', emoji: '📖', badge: 'LIVE' },
        { label: 'All Education Tools →', href: '/education/', emoji: '🎓' },
      ]
    },
    {
      id: 'health', label: 'Health & Wellness', labelFr: 'Santé & Bien-être', labelSw: 'Afya na Ustawi', icon: '🏥',
      desc: 'Disease tools, hospital costs, nutrition — 27 tools, always free', descFr: 'Maladies, frais d\'hôpital, nutrition — 27 outils', descSw: 'Magonjwa, gharama za hospitali, lishe — zana 27',
      href: '/health/', hrefFr: '/fr/health/', hrefSw: '/sw/afya/', color: '#fce8e8', accent: '#dc2626',
      tools: [
        { label: 'Medical Report Interpreter', href: '/tools/medical-report/', emoji: '🩺', badge: 'LIVE' },
        { label: 'Genotype Compatibility Checker', href: '/tools/genotype-checker/', emoji: '🧬', badge: 'NEW' },
        { label: 'Blood Group Compatibility', href: '/tools/blood-group/', emoji: '🩸', badge: 'NEW' },
        { label: 'Sickle Cell Genotype Advisor', href: '/tools/sickle-cell/', emoji: '🔬', badge: 'LIVE' },
        { label: 'Childbirth Cost Calculator', href: '/tools/childbirth-cost/', emoji: '🤱', badge: 'NEW' },
        { label: 'Drug/Medicine Price Comparator', href: '/tools/drug-price-compare/', emoji: '💊', badge: 'NEW' },
        { label: 'Dental Procedure Cost Estimator', href: '/tools/dental-cost/', emoji: '🦷', badge: 'NEW' },
        { label: 'Hospital Cost Estimator', href: '/tools/hospital-cost/', emoji: '🏥', badge: 'LIVE' },
        { label: 'African Meal Plan Generator', href: '/tools/african-meal-plan/', emoji: '🍽️', badge: 'NEW' },
        { label: 'Child Growth Chart (WHO)', href: '/tools/child-growth/', emoji: '📊', badge: 'NEW' },
        { label: 'Calorie Counter (African Foods)', href: '/health/calorie-counter/', emoji: '🍲', badge: 'LIVE' },
        { label: 'Maternal Mortality Risk Tool', href: '/tools/maternal-mortality/', emoji: '🤰', badge: 'NEW' },
        { label: 'All Health Tools →', href: '/health/', emoji: '🏥' },
      ]
    },
    {
      id: 'insurance', label: 'Insurance', labelFr: 'Assurance', labelSw: 'Bima', icon: '🛡️',
      desc: 'Car, health, life, funeral, business, travel — 300+ calculators, 54 countries',
      descFr: 'Auto, santé, vie, obsèques, entreprise, voyage — 300+ calculateurs, 54 pays',
      descSw: 'Gari, afya, maisha, mazishi, biashara, safari — vikokotoo 300+, nchi 54',
      href: '/insurance/', hrefFr: '/fr/health-insurance/', color: '#f0f4f8', accent: '#1e3a5f',
      tools: [
        { label: 'Car Insurance Estimator', href: '/tools/car-insurance/', emoji: '🚗', badge: 'LIVE' },
        { label: 'Health Insurance Comparator', href: '/tools/health-insurance-compare/', emoji: '🏥', badge: 'LIVE' },
        { label: 'Life Insurance Calculator', href: '/tools/life-insurance-calc/', emoji: '💚', badge: 'LIVE' },
        { label: 'Funeral Insurance Calculator', href: '/tools/funeral-insurance/', emoji: '🕯️', badge: 'LIVE' },
        { label: 'Motor Third-Party Premium', href: '/tools/motor-third-party/', emoji: '🛣️', badge: 'LIVE' },
        { label: 'Business Insurance Estimator', href: '/tools/business-insurance/', emoji: '🏢', badge: 'LIVE' },
        { label: 'Travel Insurance Estimator', href: '/tools/travel-insurance/', emoji: '✈️', badge: 'LIVE' },
        { label: 'Workers Compensation', href: '/tools/workers-comp/', emoji: '👷', badge: 'LIVE' },
        { label: 'Health Contribution (NHIF/SHIF)', href: '/tools/health-contribution/', emoji: '🩺', badge: 'LIVE' },
        { label: 'All Insurance Tools →', href: '/insurance/', emoji: '🛡️' },
      ]
    },
    {
      id: 'fintech', label: 'Fintech & Banking', labelFr: 'Fintech & Banque', labelSw: 'Fintech na Benki', icon: '💳',
      desc: 'Savings, loans, mobile money, remittance — 54 countries',
      descFr: 'Épargne, prêts, mobile money, transferts — 54 pays',
      descSw: 'Akiba, mikopo, pesa za simu, uhamisho — nchi 54',
      href: '/fintech/', color: '#f5f3ff', accent: '#8b5cf6',
      tools: [
        { label: 'Remittance Fee Comparator', href: '/tools/remittance-compare/', emoji: '💸', badge: 'LIVE' },
        { label: 'Mobile Money vs Bank Transfer', href: '/tools/mobile-vs-bank/', emoji: '📱', badge: 'LIVE' },
        { label: 'Fixed Deposit Rate Comparator', href: '/tools/fixed-deposit/', emoji: '🏦', badge: 'LIVE' },
        { label: 'Treasury Bill Yield Calculator', href: '/tools/tbill-calc/', emoji: '📊', badge: 'LIVE' },
        { label: 'Real Return After Inflation', href: '/tools/real-return/', emoji: '📈', badge: 'LIVE' },
        { label: 'Loan Shark vs Bank Rate', href: '/tools/loan-shark-compare/', emoji: '⚠️', badge: 'LIVE' },
        { label: 'Microfinance Loan Calculator', href: '/tools/microfinance-loan/', emoji: '🤝', badge: 'LIVE' },
        { label: 'Digital Lending App Rates', href: '/tools/digital-lending/', emoji: '📲', badge: 'LIVE' },
        { label: 'SACCO/Credit Union Calculator', href: '/tools/sacco-calc/', emoji: '🏘️', badge: 'LIVE' },
        { label: 'Payment Gateway Fee Compare', href: '/tools/payment-gateway/', emoji: '💳', badge: 'LIVE' },
        { label: 'BNPL Cost Calculator', href: '/tools/bnpl-calc/', emoji: '🛒', badge: 'LIVE' },
        { label: 'Emergency Fund Calculator', href: '/tools/emergency-fund/', emoji: '🛡️', badge: 'LIVE' },
        { label: 'All Fintech Tools →', href: '/fintech/', emoji: '💳' },
      ]
    },
    {
      id: 'agriculture', label: 'Agriculture', labelFr: 'Agriculture', labelSw: 'Kilimo', icon: '🌾',
      desc: 'Crop yield, seed rate, fertilizer, irrigation, farm profit — 54 countries',
      descFr: 'Rendement, semences, engrais, irrigation, profit agricole — 54 pays',
      descSw: 'Mavuno, mbegu, mbolea, umwagiliaji, faida ya shamba — nchi 54',
      href: '/agriculture/', hrefFr: '/fr/agriculture/', hrefSw: '/sw/kilimo/', color: '#E8F2FF', accent: '#007AFF',
      tools: [
        { label: 'Crop Yield Estimators', href: '/agriculture/crop-yield/', emoji: '🌱', badge: 'LIVE' },
        { label: 'Seed Rate Calculators', href: '/agriculture/seed-rate/', emoji: '🌿', badge: 'LIVE' },
        { label: 'Fertilizer Calculators', href: '/agriculture/fertilizer/', emoji: '🧪', badge: 'LIVE' },
        { label: 'Irrigation Calculators', href: '/agriculture/irrigation/', emoji: '💧', badge: 'LIVE' },
        { label: 'Farm Profit/Loss Calculator', href: '/agriculture/farm-profit/', emoji: '📊', badge: 'LIVE' },
      ]
    },
    {
      id: 'ecommerce', label: 'VAT & Business Tax', labelFr: 'TVA & Fiscalité', labelSw: 'VAT na Kodi', icon: '🧾',
      desc: 'VAT, margins, break-even', descFr: 'TVA, marges, seuil de rentabilité', descSw: 'VAT, faida, hatua ya usawa',
      href: '/vat-business-tax/', hrefFr: '/fr/vat-business-tax/', hrefSw: '/sw/vat-na-kodi/', color: '#fff7ed', accent: '#f59e0b',
      tools: [
        { label: 'Pan-African VAT Calculator', href: '/tools/vat-calculator/vat-calc', emoji: '💱', badge: 'LIVE' },
        { label: 'Nigeria VAT (7.5%)', href: '/nigeria/ng-vat', emoji: '🇳🇬', badge: 'LIVE' },
        { label: 'South Africa VAT (15%)', href: '/south-africa/za-vat', emoji: '🇿🇦', badge: 'LIVE' },
        { label: 'Kenya VAT (16%)', href: '/kenya/ke-vat', emoji: '🇰🇪', badge: 'LIVE' },
        { label: 'Ghana VAT + NHIL', href: '/ghana/gh-vat', emoji: '🇬🇭', badge: 'LIVE' },
        { label: 'Egypt VAT (14%)', href: '/egypt/eg-vat', emoji: '🇪🇬', badge: 'LIVE' },
        { label: 'All 50+ VAT Calculators →', href: '/vat-business-tax/', emoji: '🧾' },
      ]
    },
    {
      id: 'legal', label: 'Legal & Compliance', labelFr: 'Juridique & Conformité', labelSw: 'Kisheria & Uzingatiaji', icon: '⚖️',
      desc: 'Business registration, contracts, data privacy, personal legal — 54 countries',
      descFr: 'Enregistrement, contrats, confidentialité, juridique personnel — 54 pays',
      descSw: 'Usajili wa biashara, mikataba, faragha ya data, kisheria — nchi 54',
      href: '/legal/', hrefFr: '/fr/legal/', color: '#f5f3ff', accent: '#7c3aed',
      tools: [
        { label: 'Business Registration Checklist', href: '/tools/business-registration/', emoji: '📋', badge: 'LIVE' },
        { label: 'Company Type Selector', href: '/tools/company-type-selector/', emoji: '🏢', badge: 'LIVE' },
        { label: 'NDA Generator', href: '/tools/nda-generator/', emoji: '📄', badge: 'LIVE' },
        { label: 'Privacy Policy Generator', href: '/tools/privacy-policy-gen/', emoji: '🔒', badge: 'LIVE' },
        { label: 'Will / Testament Generator', href: '/tools/will-generator/', emoji: '📜', badge: 'LIVE' },
        { label: 'NDPA Compliance Checker', href: '/tools/ndpa-checker/', emoji: '🇳🇬', badge: 'LIVE' },
        { label: 'POPIA Compliance Checker', href: '/tools/popia-checker/', emoji: '🇿🇦', badge: 'LIVE' },
        { label: 'Child Support Calculator', href: '/tools/child-support/', emoji: '👶', badge: 'LIVE' },
        { label: 'Court Fee Calculator', href: '/tools/court-fees/', emoji: '⚖️', badge: 'LIVE' },
        { label: 'All Legal Tools →', href: '/legal/', emoji: '⚖️' },
      ]
    },
    {
      id: 'data-productivity', label: 'Business & ROI', labelFr: 'Business & ROI', labelSw: 'Biashara na Faida', icon: '📊',
      desc: 'Productivity, data, investment', descFr: 'Productivité, données, investissement', descSw: 'Tija, data, uwekezaji',
      href: '/data-productivity/', hrefFr: '/fr/data-productivity/', hrefSw: '/sw/data-na-tija/', color: '#eef2ff', accent: '#6366f1',
      tools: [
        { label: 'Monthly Budget Planner', href: '/tools/budget-planner/', emoji: '📋', badge: 'LIVE' },
        { label: 'Unit Converter (African)', href: '/tools/unit-converter/', emoji: '📏', badge: 'LIVE' },
        { label: 'Public Holiday Calendar', href: '/tools/public-holidays/', emoji: '📅', badge: 'LIVE' },
        { label: 'Working Days Calculator', href: '/tools/working-days/', emoji: '📆', badge: 'LIVE' },
        { label: 'Time Zone Converter', href: '/tools/time-zone/', emoji: '🕐', badge: 'LIVE' },
        { label: 'Age Calculator', href: '/tools/age-calculator/', emoji: '🎂', badge: 'LIVE' },
        { label: 'Pomodoro Timer', href: '/tools/pomodoro/', emoji: '🍅', badge: 'LIVE' },
        { label: 'All Business & ROI Tools →', href: '/data-productivity/', emoji: '📊' },
      ]
    },
    {
      id: 'language', label: 'Language & Translation', labelFr: 'Langues & Traduction', labelSw: 'Lugha na Tafsiri', icon: '🗣️',
      desc: 'Yoruba, Swahili, Hausa, Amharic', descFr: 'Yoruba, Swahili, Haoussa, Amharique', descSw: 'Kiyoruba, Kiswahili, Kihausa, Kiamhari',
      href: '/language/', hrefFr: '/fr/language/', hrefSw: '/sw/lugha-na-tafsiri/', color: '#faf5ff', accent: '#a855f7',
      tools: [
        { label: 'Nigerian Pidgin Translator', href: '/tools/pidgin-translator/', emoji: '🗣️', badge: 'LIVE' },
        { label: 'Swahili Translator', href: '/tools/swahili-translator/', emoji: '🌍', badge: 'LIVE' },
        { label: 'Yoruba Translator', href: '/tools/yoruba-translator/', emoji: '🇳🇬', badge: 'LIVE' },
        { label: 'Hausa Translator', href: '/tools/hausa-translator/', emoji: '🇳🇬', badge: 'LIVE' },
        { label: 'Amharic Translator', href: '/tools/amharic-translator/', emoji: '🇪🇹', badge: 'LIVE' },
        { label: 'African Name Meaning', href: '/tools/african-name-meaning/', emoji: '✨', badge: 'LIVE' },
        { label: 'Francophone Africa Translator', href: '/tools/french-african/', emoji: '🇨🇮', badge: 'LIVE' },
        { label: 'All Language Tools →', href: '/language/', emoji: '🗣️' },
      ]
    },
    {
      id: 'african', label: 'Uniquely African', labelFr: 'Spécialités Africaines', labelSw: 'Vya Kiafrika', icon: '🌍',
      desc: 'Japa, generator, ajo, mobile money', descFr: 'Épargne collective, mobile money, recettes', descSw: 'Japa, jenereta, chama, pesa za simu',
      href: '/african/', hrefFr: '/fr/african/', color: '#fef2f2', accent: '#dc2626',
      tools: [
        { label: 'AfroPoints — Earn Money', href: '/tools/afropoints/', emoji: '🎯', badge: 'NEW' },
        { label: 'AfroAtlas Explorer', href: '/tools/afroatlas/', emoji: '🌍', badge: 'NEW' },
        { label: 'AfroKitchen Recipes', href: '/tools/afrokitchen/', emoji: '🍲', badge: 'LIVE' },
        { label: 'AfroConflict', href: '/tools/africa-conflict/', emoji: '⚔️', badge: 'LIVE' },
      ]
    },
    {
      id: 'francophone', label: 'Outils en Français', icon: '🇫🇷',
      desc: 'Salaire net, TVA — 14 pays',
      href: '/fr/', color: '#eef6ff', accent: '#0055A4',
      tools: [
        { label: "Côte d'Ivoire — Salaire", href: '/fr/cote-divoire/calculateur-salaire-net', emoji: '🇨🇮', badge: 'LIVE' },
        { label: 'Sénégal — Salaire', href: '/fr/senegal/calculateur-salaire-net', emoji: '🇸🇳', badge: 'LIVE' },
        { label: 'Cameroun — Salaire', href: '/fr/cameroun/calculateur-salaire-net', emoji: '🇨🇲', badge: 'LIVE' },
        { label: 'RD Congo — Salaire', href: '/fr/rdc/calculateur-salaire-net', emoji: '🇨🇩', badge: 'LIVE' },
        { label: 'Maroc — Salaire', href: '/fr/maroc/calculateur-salaire-net', emoji: '🇲🇦', badge: 'LIVE' },
        { label: 'Algérie — Salaire', href: '/fr/algerie/calculateur-salaire-net', emoji: '🇩🇿', badge: 'LIVE' },
        { label: 'Tunisie — Salaire', href: '/fr/tunisie/calculateur-salaire-net', emoji: '🇹🇳', badge: 'LIVE' },
        { label: 'Mali — Salaire', href: '/fr/mali/calculateur-salaire-net', emoji: '🇲🇱', badge: 'LIVE' },
        { label: 'Burkina Faso — Salaire', href: '/fr/burkina-faso/calculateur-salaire-net', emoji: '🇧🇫', badge: 'LIVE' },
        { label: 'Niger — Salaire', href: '/fr/niger/calculateur-salaire-net', emoji: '🇳🇪', badge: 'LIVE' },
        { label: 'Guinée — Salaire', href: '/fr/guinee/calculateur-salaire-net', emoji: '🇬🇳', badge: 'LIVE' },
        { label: 'Congo — Salaire', href: '/fr/congo/calculateur-salaire-net', emoji: '🇨🇬', badge: 'LIVE' },
        { label: 'Gabon — Salaire', href: '/fr/gabon/calculateur-salaire-net', emoji: '🇬🇦', badge: 'LIVE' },
        { label: 'Togo — Salaire', href: '/fr/togo/calculateur-salaire-net', emoji: '🇹🇬', badge: 'LIVE' },
        { label: 'Tous les calculateurs TVA →', href: '/fr/', emoji: '🧾' },
      ]
    },
    {
      id: 'trade', label: 'Trade & Import', labelFr: 'Commerce & Import', labelSw: 'Biashara na Uagizaji', icon: '🚢',
      desc: 'LC, duties, incoterms, ECOWAS, SADC, AfCFTA', descFr: 'LC, droits de douane, incotermes', descSw: 'LC, ushuru, incoterms, ECOWAS, SADC, AfCFTA',
      href: '/trade/', hrefFr: '/fr/trade/', color: '#E8F2FF', accent: '#007AFF',
      tools: [
        { label: 'AfCFTA Tariff Tracker', href: '/tools/afcfta-tracker/', emoji: '🌍', badge: 'LIVE' },
        { label: 'Landed Cost Calculator', href: '/tools/landed-cost/', emoji: '📦', badge: 'LIVE' },
        { label: 'Shipping Cost Estimator', href: '/tools/shipping-estimator/', emoji: '🚢', badge: 'LIVE' },
        { label: 'FX Import Cost Impact', href: '/tools/fx-import-impact/', emoji: '💱', badge: 'LIVE' },
        { label: 'LC Fee Calculator', href: '/tools/lc-calculator/', emoji: '🏦', badge: 'LIVE' },
        { label: 'Export Docs Checklist', href: '/tools/export-docs/', emoji: '📋', badge: 'LIVE' },
        { label: 'Certificate of Origin', href: '/tools/coo-generator/', emoji: '📜', badge: 'LIVE' },
        { label: 'Port Demurrage Calculator', href: '/tools/demurrage-calculator/', emoji: '⚓', badge: 'LIVE' },
        { label: 'Incoterms 2020 Calculator', href: '/tools/incoterms-calculator/', emoji: '⚖️', badge: 'LIVE' },
        { label: 'Trade Finance Comparator', href: '/tools/trade-finance-comparator/', emoji: '💼', badge: 'NEW' },
        { label: 'Commodity Trade Tracker', href: '/tools/commodity-tracker/', emoji: '📈', badge: 'NEW' },
        { label: 'B2B Payment Comparator', href: '/tools/payment-comparator/', emoji: '💸', badge: 'NEW' },
        { label: 'ECOWAS Levy Calculator', href: '/tools/ecowas-levy/', emoji: '🌍', badge: 'NEW' },
        { label: 'SADC Rules of Origin', href: '/tools/sadc-roo/', emoji: '🌐', badge: 'NEW' },
        { label: 'EAC Common External Tariff', href: '/tools/eac-cet/', emoji: '🏷️', badge: 'NEW' },
        { label: 'Proforma Invoice Generator', href: '/tools/proforma-invoice/', emoji: '📄', badge: 'NEW' },
        { label: 'Packing List Generator', href: '/tools/packing-list/', emoji: '📦', badge: 'NEW' },
        { label: 'Bill of Lading Template', href: '/tools/bol-generator/', emoji: '🚢', badge: 'NEW' },
      ]
    },
    {
      id: 'telecom', label: 'Telecom & Mobile', labelFr: 'Télécom & Mobile', labelSw: 'Mawasiliano', icon: '📱',
      desc: 'Data plans, USSD codes, roaming, ISPs', descFr: 'Forfaits data, codes USSD, itinérance', descSw: 'Mipango ya data, misimbo ya USSD',
      href: '/telecom/', hrefSw: '/sw/mawasiliano-na-mtandao/', color: '#ECFEFF', accent: '#06B6D4',
      tools: [
        { label: 'Data Plan Comparator', href: '/telecom/data-plan-compare/', emoji: '📊', badge: 'LIVE' },
        { label: 'USSD Code Directory', href: '/telecom/ussd-directory/', emoji: '📱', badge: 'LIVE' },
        { label: 'Roaming Cost Calculator', href: '/telecom/roaming-cost/', emoji: '✈️', badge: 'LIVE' },
        { label: 'Mobile Money Fees', href: '/tools/mobile-money-fees/', emoji: '💸', badge: 'LIVE' },
        { label: 'Starlink vs Local ISP', href: '/telecom/starlink-compare/', emoji: '🛰️', badge: 'NEW' },
        { label: 'DStv/GOtv Comparator', href: '/telecom/tv-compare/', emoji: '📺', badge: 'NEW' },
        { label: 'Data Usage Calculator', href: '/telecom/data-usage-calc/', emoji: '📈', badge: 'LIVE' },
        { label: 'Airtime to Cash Value', href: '/telecom/airtime-value/', emoji: '💰', badge: 'NEW' },
        { label: 'Number Portability Guide', href: '/telecom/number-portability/', emoji: '🔄', badge: 'NEW' },
        { label: 'SIM Registration Checker', href: '/telecom/sim-registration/', emoji: '🪪', badge: 'NEW' },
        { label: 'Internet Speed vs Cost', href: '/telecom/internet-compare/', emoji: '🌐', badge: 'NEW' },
        { label: 'All Telecom Tools →', href: '/telecom/', emoji: '📱' },
      ]
    },
    {
      id: 'energy', label: 'Energy & Utilities', labelFr: 'Énergie & Utilitaires', labelSw: 'Nishati na Huduma', icon: '⚡',
      desc: 'Electricity tariff, solar ROI, generator fuel, water bills', descFr: 'Tarifs électricité, ROI solaire, coût générateur', descSw: 'Umeme, jua, mafuta ya jenereta, bili ya maji',
      href: '/energy/', color: '#FFFBEB', accent: '#F59E0B',
      tools: [
        { label: 'Electricity Tariff Calculator', href: '/tools/electricity-tariff/', emoji: '⚡', badge: 'LIVE' },
        { label: 'Solar Panel ROI Calculator', href: '/tools/solar-roi/', emoji: '☀️', badge: 'LIVE' },
        { label: 'Prepaid Meter Calculator', href: '/tools/prepaid-meter/', emoji: '🔢', badge: 'LIVE' },
        { label: 'Generator Fuel Cost', href: '/tools/generator-fuel/', emoji: '⛽', badge: 'LIVE' },
        { label: 'Solar vs Generator', href: '/tools/solar-vs-generator/', emoji: '⚖️', badge: 'LIVE' },
        { label: 'Electricity Bill Verifier', href: '/tools/electricity-bill-verify/', emoji: '🔍', badge: 'LIVE' },
        { label: 'Water Bill Calculator', href: '/tools/water-bill/', emoji: '💧', badge: 'LIVE' },
        { label: 'Gas / LPG Cost', href: '/tools/gas-lpg-cost/', emoji: '🔥', badge: 'LIVE' },
        { label: 'PayGo Solar Calculator', href: '/tools/paygo-solar/', emoji: '🌤️', badge: 'LIVE' },
        { label: 'Outage Cost (Business)', href: '/tools/outage-cost/', emoji: '🔌', badge: 'LIVE' },
        { label: 'Solar Sizing Calculator', href: '/tools/solar-sizing/', emoji: '🛠️', badge: 'LIVE' },
        { label: 'Battery & Inverter Sizing', href: '/tools/battery-sizing/', emoji: '🔋', badge: 'LIVE' },
        { label: 'Home Energy Audit', href: '/tools/energy-audit/', emoji: '🏠', badge: 'LIVE' },
        { label: 'Appliance Power Calculator', href: '/tools/appliance-power/', emoji: '🔌', badge: 'LIVE' },
        { label: 'Backup Duration Calculator', href: '/tools/backup-duration/', emoji: '🔦', badge: 'LIVE' },
        { label: 'Diesel vs Solar Farm', href: '/tools/diesel-vs-solar-farm/', emoji: '🌾', badge: 'LIVE' },
        { label: 'Mini-Grid Feasibility', href: '/tools/mini-grid-feasibility/', emoji: '🏘️', badge: 'LIVE' },
        { label: 'Carbon Footprint (Energy)', href: '/tools/carbon-footprint-energy/', emoji: '🌍', badge: 'LIVE' },
        { label: 'EV Charging Cost', href: '/tools/ev-charging/', emoji: '🚗', badge: 'LIVE' },
        { label: 'Biogas Digester ROI', href: '/tools/biogas-roi/', emoji: '🐄', badge: 'LIVE' },
        { label: 'All Energy Tools →', href: '/energy/', emoji: '⚡' },
      ]
    },
    {
      id: 'engineering', label: 'Engineering', labelFr: 'Ingénierie', labelSw: 'Uhandisi', icon: '🔧',
      desc: 'BOQ, concrete, electrical, rebar, roofing, construction budgets', descFr: 'Métré, béton, électrique, ferraillage', descSw: 'BOQ, zege, umeme, nondo, paa',
      href: '/engineering/', hrefSw: '/sw/ujenzi-na-uhandisi/', color: '#f5f5f4', accent: '#78716c',
      tools: [
        { label: 'BOQ Builder', href: '/tools/boq-builder/', emoji: '📋', badge: 'LIVE' },
        { label: 'Concrete Mix', href: '/tools/concrete-mix/', emoji: '🏗️', badge: 'LIVE' },
        { label: 'Electrical Load', href: '/tools/electrical-load/', emoji: '⚡', badge: 'LIVE' },
        { label: 'Rebar Calculator', href: '/tools/rebar-calculator/', emoji: '🔩', badge: 'NEW' },
        { label: 'Roof Material Calculator', href: '/tools/roof-calculator/', emoji: '🏗️', badge: 'LIVE' },
        { label: 'Tiles Calculator', href: '/tools/tiles-calc/', emoji: '🔲', badge: 'LIVE' },
        { label: 'Paint Coverage Calculator', href: '/tools/paint-calculator/', emoji: '🎨', badge: 'LIVE' },
        { label: 'Water Tank Size Calculator', href: '/tools/water-tank/', emoji: '💧', badge: 'LIVE' },
        { label: 'Borehole Cost Estimator', href: '/tools/borehole-cost/', emoji: '🌊', badge: 'LIVE' },
        { label: 'Home Renovation Budget', href: '/tools/home-renovation-cost/', emoji: '🏠', badge: 'LIVE' },
        { label: 'Structural Load Calculator', href: '/tools/structural-calc/', emoji: '📐', badge: 'LIVE' },
        { label: 'Septic Tank Size Calculator', href: '/tools/septic-tank/', emoji: '🚿', badge: 'NEW' },
        { label: 'Fence Cost Calculator', href: '/tools/fence-cost/', emoji: '🧱', badge: 'NEW' },
        { label: 'Swimming Pool Cost Estimator', href: '/tools/swimming-pool-cost/', emoji: '🏊', badge: 'NEW' },
        { label: 'Architectural Drawing Fee Calc', href: '/tools/architectural-fee/', emoji: '📏', badge: 'NEW' },
        { label: 'All Engineering Tools →', href: '/engineering/', emoji: '🔧' },
      ]
    },
    {
      id: 'government', label: 'Government & Civic', labelFr: 'Gouvernement & Civique', labelSw: 'Serikali na Uraia', icon: '🏛️',
      desc: 'Passports, ID, voter registration, pensions, land fees — 20 tools',
      descFr: 'Passeports, identité, vote, retraites, foncier — 20 outils',
      descSw: 'Pasipoti, vitambulisho, upigaji kura, pensheni — zana 20',
      href: '/government/', color: '#eff6ff', accent: '#1d4ed8',
      tools: [
        { label: 'Passport Application Checklist', href: '/tools/passport-checklist/', emoji: '🛂', badge: 'NEW' },
        { label: 'Visa Requirement Checker (Africa)', href: '/tools/visa-checker/', emoji: '✈️', badge: 'NEW' },
        { label: 'National ID Registration Guide', href: '/tools/national-id-guide/', emoji: '🪪', badge: 'NEW' },
        { label: 'Voter Registration Guide', href: '/tools/voter-registration/', emoji: '🗳️', badge: 'NEW' },
        { label: 'National Pension Estimator', href: '/tools/national-pension/', emoji: '📈', badge: 'NEW' },
        { label: 'Land Registry Fee Calculator', href: '/tools/land-registry-fees/', emoji: '🏠', badge: 'NEW' },
        { label: 'Birth/Death Certificate Guide', href: '/tools/birth-death-cert/', emoji: '📜', badge: 'NEW' },
        { label: 'Marriage Certificate Guide', href: '/tools/marriage-cert/', emoji: '💍', badge: 'NEW' },
        { label: 'FOI Request Template', href: '/tools/foi-template/', emoji: '📋', badge: 'NEW' },
        { label: 'Government Scholarship Finder', href: '/tools/gov-scholarship/', emoji: '🎓', badge: 'NEW' },
        { label: 'Social Welfare Eligibility Checker', href: '/tools/social-welfare/', emoji: '🤝', badge: 'NEW' },
        { label: 'Public Holiday Calendar', href: '/tools/public-holidays/', emoji: '📅', badge: 'LIVE' },
        { label: 'Budget Allocation Comparator', href: '/tools/budget-comparator/', emoji: '📊', badge: 'NEW' },
        { label: 'All Government Tools →', href: '/government/', emoji: '🏛️' },
      ]
    },
    {
      id: 'small-business', label: 'Small Business', labelFr: 'Petites Entreprises', labelSw: 'Biashara Ndogo', icon: '🏪',
      desc: 'POS agents, mini-importation, market stalls, e-commerce — 45 tools',
      descFr: 'Agents POS, mini-import, marchés, e-commerce — 45 outils',
      descSw: 'Wakala wa POS, uagizaji, masoko, e-commerce — zana 45',
      href: '/small-business/', color: '#fff7ed', accent: '#ea580c',
      tools: [
        { label: 'Startup Runway Calculator', href: '/tools/startup-runway/', emoji: '🚀', badge: 'NEW' },
        { label: 'Market Size (TAM/SAM/SOM)', href: '/tools/tam-sam-som/', emoji: '📊', badge: 'NEW' },
        { label: 'Unit Economics Calculator', href: '/tools/unit-economics/', emoji: '💡', badge: 'NEW' },
        { label: 'Burn Rate Calculator', href: '/tools/burn-rate/', emoji: '🔥', badge: 'NEW' },
        { label: 'Cash Flow Forecast Tool', href: '/tools/cash-flow-forecast/', emoji: '💰', badge: 'NEW' },
        { label: 'POS Agent Business Calculator', href: '/tools/pos-agent/', emoji: '📱', badge: 'NEW' },
        { label: 'Mini-Importation Profit Calc', href: '/tools/mini-importation/', emoji: '📦', badge: 'NEW' },
        { label: 'Mama Put / Food Vendor Calc', href: '/tools/mama-put/', emoji: '🍲', badge: 'NEW' },
        { label: 'Marketplace Fee Comparator', href: '/tools/marketplace-fees/', emoji: '🛍️', badge: 'NEW' },
        { label: 'Market Stall Profit Calculator', href: '/tools/market-stall-profit/', emoji: '🏪', badge: 'LIVE' },
        { label: 'AI Business Planner', href: '/tools/business-planner/', emoji: '📋', badge: 'LIVE' },
        { label: 'Break-Even Calculator', href: '/tools/break-even/', emoji: '📉', badge: 'LIVE' },
        { label: 'Churn Rate Calculator', href: '/tools/churn-rate/', emoji: '🔄', badge: 'NEW' },
        { label: 'All SME Tools →', href: '/small-business/', emoji: '🏪' },
      ]
    },
    {
      id: 'transport', label: 'Transport & Logistics', labelFr: 'Transport & Logistique', labelSw: 'Usafiri na Usafirishaji', icon: '🚛',
      desc: 'Fuel, vehicle import, ride fares, boda-boda — 54 countries',
      descFr: 'Carburant, importation véhicule, tarifs taxi, logistique — 54 pays',
      descSw: 'Mafuta, gari, nauli, boda-boda — nchi 54',
      href: '/transport/', color: '#fef3c7', accent: '#d97706',
      tools: [
        { label: 'Fuel Cost per Trip Calculator', href: '/tools/fuel-cost/', emoji: '⛽', badge: 'LIVE' },
        { label: 'Vehicle Import Duty Calculator', href: '/tools/vehicle-import-duty/', emoji: '🚗', badge: 'LIVE' },
        { label: 'Ride-Hailing Fare Estimator', href: '/tools/ride-fare/', emoji: '🛺', badge: 'LIVE' },
        { label: 'Boda-Boda/Okada Income Calc', href: '/tools/boda-income/', emoji: '🏍️', badge: 'LIVE' },
        { label: 'Matatu/Danfo Route Fare Calc', href: '/tools/matatu-fare/', emoji: '🚌', badge: 'LIVE' },
        { label: 'Delivery Cost Estimator', href: '/tools/delivery-cost/', emoji: '📦', badge: 'LIVE' },
        { label: 'Car Loan vs Cash Purchase', href: '/tools/car-loan-vs-cash/', emoji: '💰', badge: 'LIVE' },
        { label: 'Vehicle Import Checklist', href: '/tools/vehicle-registration/', emoji: '🪪', badge: 'LIVE' },
        { label: 'Road Worthiness Checklist', href: '/tools/roadworthiness/', emoji: '✅', badge: 'LIVE' },
        { label: 'Vehicle Depreciation Calc', href: '/tools/vehicle-depreciation/', emoji: '📉', badge: 'NEW' },
        { label: 'All Transport Tools →', href: '/transport/', emoji: '🚛' },
      ]
    },
    {
      id: 'personal-finance', label: 'Personal Finance', labelFr: 'Finance Personnelle', labelSw: 'Fedha Binafsi', icon: '💼',
      desc: 'Budgeting, life events, tax extensions — 25 tools for African realities',
      descFr: 'Budget, événements de vie, impôts — 25 outils pour réalités africaines',
      descSw: 'Bajeti, matukio ya maisha, kodi — zana 25 kwa hali ya Afrika',
      href: '/personal-finance/', color: '#f0fdf4', accent: '#16a34a',
      tools: [
        { label: '50/30/20 Budget Calculator', href: '/tools/50-30-20-budget/', emoji: '💰', badge: 'NEW' },
        { label: 'Zero-Based Budget Planner', href: '/tools/zero-based-budget/', emoji: '📋', badge: 'NEW' },
        { label: 'Annual Financial Review', href: '/tools/annual-financial-review/', emoji: '📅', badge: 'NEW' },
        { label: 'Multi-Income Tracker', href: '/tools/multi-income-tracker/', emoji: '💵', badge: 'NEW' },
        { label: 'Baby Cost Estimator', href: '/tools/baby-cost/', emoji: '👶', badge: 'NEW' },
        { label: 'Back-to-School Budget', href: '/tools/back-to-school/', emoji: '🎒', badge: 'NEW' },
        { label: 'WHT Calculator', href: '/tools/wht-calculator/', emoji: '🧾', badge: 'NEW' },
        { label: 'Side Hustle to Full-Time Calc', href: '/tools/side-hustle-to-fulltime/', emoji: '🚀', badge: 'NEW' },
        { label: 'Funeral Savings Planner', href: '/tools/funeral-savings/', emoji: '🕊️', badge: 'NEW' },
        { label: 'Wedding Budget (African)', href: '/tools/wedding-budget-african/', emoji: '💍', badge: 'NEW' },
        { label: 'All Personal Finance Tools →', href: '/personal-finance/', emoji: '💼' },
      ]
    },
    {
      id: 'diaspora', label: 'Diaspora', labelFr: 'Diaspora', labelSw: 'Diaspora', icon: '✈️',
      desc: 'Visa tracking, immigration, remittances — 17 tools for Africans abroad',
      descFr: 'Visa, immigration, transferts — 17 outils pour Africains à l\'étranger',
      descSw: 'Visa, uhamiaji, uhamisho — zana 17 kwa Waafrika nje',
      href: '/diaspora/', color: '#eff6ff', accent: '#2563eb',
      tools: [
        { label: 'Japa Calculator', href: '/tools/japa-calculator/', emoji: '🌍', badge: 'NEW' },
        { label: 'Visa Tracker', href: '/tools/visa-tracker/', emoji: '📝', badge: 'NEW' },
        { label: 'Immigration Points Calculator', href: '/tools/immigration-points/', emoji: '📊', badge: 'NEW' },
        { label: 'Cultural Adjustment Guide', href: '/tools/cultural-adjustment/', emoji: '🤝', badge: 'NEW' },
        { label: 'IELTS/TOEFL Score Converter', href: '/tools/ielts-toefl-converter/', emoji: '📚', badge: 'NEW' },
        { label: 'Embassy Wait Time Tracker', href: '/tools/embassy-wait-time/', emoji: '⏱️', badge: 'NEW' },
        { label: 'Money Transfer Tracker', href: '/tools/money-transfer-tracker/', emoji: '💸', badge: 'NEW' },
        { label: 'Cost of Living Comparator', href: '/tools/cost-of-living-compare/', emoji: '🏙️', badge: 'NEW' },
        { label: 'Double Taxation Checker', href: '/tools/double-taxation/', emoji: '🧾', badge: 'NEW' },
        { label: 'Diaspora Investment Calculator', href: '/tools/diaspora-investment/', emoji: '📈', badge: 'NEW' },
        { label: 'All Diaspora Tools →', href: '/diaspora/', emoji: '✈️' },
      ]
    },
    {
      id: 'religious-cultural', label: 'Religious & Cultural', labelFr: 'Religieux & Culturel', labelSw: 'Dini na Utamaduni', icon: '🕌',
      desc: 'Zakat, prayer times, Ramadan, halal, proverbs — Islamic, Christian & Traditional',
      descFr: 'Zakat, heures de prière, Ramadan, halal, proverbes — Islam, Christianisme & Tradition',
      descSw: 'Zaka, nyakati za sala, Ramadhan, halali, methali — Kiislamu, Kikristo & Jadi',
      href: '/religious-cultural/', color: '#fffbeb', accent: '#d97706',
      tools: [
        { label: 'Zakat Calculator', href: '/tools/zakat-calculator/', emoji: '🌙', badge: 'NEW' },
        { label: 'Prayer Times Calculator', href: '/tools/prayer-times/', emoji: '🕌', badge: 'NEW' },
        { label: 'Ramadan Timetable', href: '/tools/ramadan-timetable/', emoji: '📅', badge: 'NEW' },
        { label: 'Halal Compliance Checker', href: '/tools/halal-compliance/', emoji: '✅', badge: 'NEW' },
        { label: 'Hajj Budget Planner', href: '/tools/hajj-budget/', emoji: '🕋', badge: 'NEW' },
        { label: 'Islamic Calendar', href: '/tools/islamic-calendar/', emoji: '🗓️', badge: 'NEW' },
        { label: 'Tithe Calculator', href: '/tools/tithe-calculator/', emoji: '⛪', badge: 'NEW' },
        { label: 'Wedding Budget Planner', href: '/tools/wedding-budget/', emoji: '💒', badge: 'NEW' },
        { label: 'African Proverbs Library', href: '/tools/african-proverbs/', emoji: '📖', badge: 'NEW' },
        { label: 'Naming Ceremony Cost Calc', href: '/tools/naming-ceremony/', emoji: '🎉', badge: 'NEW' },
        { label: 'All Religious & Cultural Tools →', href: '/religious-cultural/', emoji: '🕌' },
      ]
    },
    {
      id: 'climate', label: 'Climate & Environment', labelFr: 'Climat & Environnement', labelSw: 'Hali ya Hewa na Mazingira', icon: '🌿',
      desc: 'Carbon credits, drought risk, flood risk, air quality, e-waste — 54 countries',
      descFr: 'Crédits carbone, risque sécheresse, qualité air, déchets — 54 pays',
      descSw: 'Mikopo ya kaboni, ukame, mafuriko, hali ya hewa — nchi 54',
      href: '/climate/', color: '#f0fdf4', accent: '#059669',
      tools: [
        { label: 'Carbon Credit Calculator', href: '/tools/carbon-credit/', emoji: '🌱', badge: 'NEW' },
        { label: 'Drought Risk Assessor', href: '/tools/drought-risk/', emoji: '☀️', badge: 'NEW' },
        { label: 'Flood Risk Calculator', href: '/tools/flood-risk/', emoji: '🌊', badge: 'NEW' },
        { label: 'Air Quality Index Tool', href: '/tools/air-quality/', emoji: '🌬️', badge: 'NEW' },
        { label: 'Tree Planting ROI', href: '/tools/tree-planting-roi/', emoji: '🌳', badge: 'NEW' },
        { label: 'E-Waste Value Calculator', href: '/tools/ewaste-value/', emoji: '♻️', badge: 'NEW' },
        { label: 'Water Scarcity Estimator', href: '/tools/water-scarcity/', emoji: '💧', badge: 'NEW' },
        { label: 'Recycling Revenue Calculator', href: '/tools/recycling-revenue/', emoji: '🗃️', badge: 'NEW' },
        { label: 'Sustainability Scorecard', href: '/tools/sustainability-scorecard/', emoji: '📊', badge: 'NEW' },
        { label: 'Charcoal vs Clean Energy', href: '/tools/charcoal-vs-clean/', emoji: '⚡', badge: 'NEW' },
        { label: 'All Climate Tools →', href: '/climate/', emoji: '🌿' },
      ]
    },
    {
      id: 'sports', label: 'Sports & Entertainment', labelFr: 'Sports & Divertissement', labelSw: 'Michezo na Burudani', icon: '⚽',
      desc: 'Betting odds, AFCON predictor, music royalties, Nollywood — 54 countries',
      descFr: 'Cotes paris, prédicteur AFCON, redevances musicales, Nollywood — 54 pays',
      descSw: 'Uwezekano wa kubeti, AFCON, mrabaha wa muziki — nchi 54',
      href: '/sports/', color: '#fdf4ff', accent: '#9333ea',
      tools: [
        { label: 'Betting Odds Calculator', href: '/tools/betting-odds/', emoji: '🎲', badge: 'NEW' },
        { label: 'AFCON Match Predictor', href: '/tools/afcon-predictor/', emoji: '🏆', badge: 'NEW' },
        { label: 'Fantasy Football Value Calc', href: '/tools/fantasy-football/', emoji: '⚽', badge: 'NEW' },
        { label: 'Betting Tax Calculator', href: '/tools/betting-tax/', emoji: '🧾', badge: 'NEW' },
        { label: 'Streaming Royalties Estimator', href: '/tools/streaming-royalties/', emoji: '🎵', badge: 'NEW' },
        { label: 'DJ Booking Rate Calculator', href: '/tools/dj-booking-rate/', emoji: '🎧', badge: 'NEW' },
        { label: 'Concert Budget Planner', href: '/tools/concert-budget/', emoji: '🎤', badge: 'NEW' },
        { label: 'Event Ticket Revenue Calc', href: '/tools/event-ticket-revenue/', emoji: '🎟️', badge: 'NEW' },
        { label: 'Nollywood Box Office Tracker', href: '/tools/nollywood-box-office/', emoji: '🎬', badge: 'NEW' },
        { label: 'Sports Scholarship Estimator', href: '/tools/sports-scholarship/', emoji: '🎓', badge: 'NEW' },
        { label: 'All Sports & Entertainment Tools →', href: '/sports/', emoji: '⚽' },
      ]
    },
    {
      id: 'mining', label: 'Mining & Extractives', labelFr: 'Mines & Extractives', labelSw: 'Madini na Uchimbaji', icon: '⛏️',
      desc: 'Gold, diamonds, oil, mining royalties — Africa holds 30% of world minerals',
      descFr: 'Or, diamants, pétrole, redevances minières — l\'Afrique détient 30% des minéraux',
      descSw: 'Dhahabu, almasi, mafuta, mrabaha wa madini — Afrika ina 30% ya madini',
      href: '/mining/', color: '#fef9c3', accent: '#ca8a04',
      tools: [
        { label: 'Gold Price Tracker', href: '/tools/gold-price-tracker/', emoji: '🥇', badge: 'NEW' },
        { label: 'Diamond Valuation Calculator', href: '/tools/diamond-valuation/', emoji: '💎', badge: 'NEW' },
        { label: 'Mining Royalty Calculator', href: '/tools/mining-royalty/', emoji: '📊', badge: 'NEW' },
        { label: 'Oil Production Estimator', href: '/tools/oil-production/', emoji: '🛢️', badge: 'NEW' },
        { label: 'Oil & Gas Revenue Calc', href: '/tools/oil-gas-revenue/', emoji: '⚡', badge: 'NEW' },
        { label: 'Artisanal Mining Income Calc', href: '/tools/artisanal-mining/', emoji: '⛏️', badge: 'NEW' },
        { label: 'Mining License Fee Estimator', href: '/tools/mining-license-fee/', emoji: '📋', badge: 'NEW' },
        { label: 'Mineral Export Duty Calc', href: '/tools/mineral-export-duty/', emoji: '🚢', badge: 'NEW' },
        { label: 'Mining Env. Impact Assessor', href: '/tools/mining-env-impact/', emoji: '🌿', badge: 'NEW' },
        { label: 'Petroleum Pricing Calculator', href: '/tools/petroleum-pricing/', emoji: '⛽', badge: 'NEW' },
        { label: 'All Mining Tools →', href: '/mining/', emoji: '⛏️' },
      ]
    },
    {
      id: 'creative', label: 'Creative Economy', labelFr: 'Économie Créative', labelSw: 'Uchumi wa Ubunifu', icon: '🎨',
      desc: 'Music royalties, Nollywood, African fashion, content creator tools',
      descFr: 'Droits musicaux, Nollywood, mode africaine, créateurs de contenu',
      descSw: 'Mrabaha wa muziki, Nollywood, mitindo ya Afrika, waundaji wa maudhui',
      href: '/creative/', color: '#FDF4FF', accent: '#DB2777',
      tools: [
        { label: 'ThumbnailForge — Thumbnail Maker', href: '/tools/creator-thumb/', emoji: '📸', badge: 'NEW' },
        { label: 'CarouselStudio — Carousel Maker', href: '/tools/creator-carousel/', emoji: '🎞️', badge: 'NEW' },
        { label: 'CreatorCalendar — Content Planner', href: '/tools/creator-calendar/', emoji: '📅', badge: 'NEW' },
        { label: 'CreatorPage — Link Page & Store', href: '/tools/creator-page/', emoji: '🔗', badge: 'NEW' },
        { label: 'CreatorPricing — Know Your Worth', href: '/tools/creator-pricing/', emoji: '💰', badge: 'LIVE' },
        { label: 'CreatorMoney — Finance Tracker', href: '/tools/creator-money/', emoji: '📊', badge: 'LIVE' },
        { label: 'CreatorSplit — Collab Splitter', href: '/tools/creator-split/', emoji: '🤝', badge: 'LIVE' },
        { label: 'CreatorInvoice — Invoice Builder', href: '/tools/creator-invoice/', emoji: '🧾', badge: 'LIVE' },
        { label: 'CreatorCanvas — Design Studio', href: '/tools/creator-canvas/', emoji: '🎨', badge: 'LIVE' },
        { label: 'CreatorKit — Media Kit Builder', href: '/tools/creator-kit/', emoji: '✨', badge: 'LIVE' },
        { label: 'CreatorDesk — Client & Project CRM', href: '/tools/creator-desk/', emoji: '📋', badge: 'LIVE' },
        { label: 'CreatorMind — AI Script & Brief Writer', href: '/tools/creator-mind/', emoji: '🔮', badge: 'LIVE' },
        { label: 'TitleSmith — Title & Headline Generator', href: '/tools/creator-titles/', emoji: '⚡', badge: 'NEW' },
        { label: 'BioForge — Platform Bio Generator', href: '/tools/creator-bios/', emoji: '🌿', badge: 'NEW' },
        { label: 'HookFactory — Video Hook Generator', href: '/tools/creator-hooks/', emoji: '🎣', badge: 'NEW' },
        { label: 'TagWave — Hashtag Generator', href: '/tools/creator-hashtags/', emoji: '#️⃣', badge: 'NEW' },
        { label: 'CaptionCraft — AI Caption Writer', href: '/tools/creator-captions/', emoji: '✍️', badge: 'NEW' },
        { label: 'ScriptPad — Video Script Generator', href: '/tools/creator-scripts/', emoji: '📝', badge: 'NEW' },
        { label: 'Repurpose — Content Repurposer', href: '/tools/creator-repurpose/', emoji: '♻️', badge: 'NEW' },
        { label: 'ResizeKit — Social Image Resizer', href: '/tools/creator-resize/', emoji: '✂️', badge: 'NEW' },
        { label: 'Music Royalty Splitter', href: '/tools/music-royalty-splitter/', emoji: '🎵', badge: 'NEW' },
        { label: 'Album/EP Release Budget', href: '/tools/album-budget/', emoji: '💿', badge: 'NEW' },
        { label: 'Fashion Brand Startup Cost', href: '/tools/fashion-brand-startup/', emoji: '👗', badge: 'NEW' },
        { label: 'YouTube Revenue Estimator', href: '/tools/youtube-revenue/', emoji: '▶️', badge: 'NEW' },
        { label: 'Influencer Rate Card Generator', href: '/tools/influencer-rate/', emoji: '📱', badge: 'NEW' },
        { label: 'TikTok/IG Engagement Rate Calc', href: '/tools/engagement-rate/', emoji: '📊', badge: 'NEW' },
        { label: 'Graphic Design Pricing', href: '/tools/graphic-design-pricing/', emoji: '🖼️', badge: 'NEW' },
        { label: 'Event Decoration Cost Calc', href: '/tools/event-decoration-cost/', emoji: '🎪', badge: 'NEW' },
        { label: 'Art Commission Price Calc', href: '/tools/art-commission/', emoji: '🎨', badge: 'NEW' },
        { label: 'CreatorStock — Stock Media Browser', href: '/tools/creator-stock/', emoji: '🖼️', badge: 'NEW' },
        { label: 'CreatorAnalytics — Performance Tracker', href: '/tools/creator-analytics/', emoji: '📈', badge: 'NEW' },
        { label: 'CreatorRecord — Screen Recorder', href: '/tools/creator-record/', emoji: '🎬', badge: 'NEW' },
        { label: 'CreatorPolish — AI Writing Tool', href: '/tools/creator-polish/', emoji: '✏️', badge: 'NEW' },
        { label: 'CreatorClip — Video Clipper', href: '/tools/creator-clip/', emoji: '🎞️', badge: 'NEW' },
        { label: 'CreatorVoice — Audio Recorder', href: '/tools/creator-voice/', emoji: '🎙️', badge: 'NEW' },
        { label: 'CreatorMail — Newsletter Builder', href: '/tools/creator-mail/', emoji: '📧', badge: 'NEW' },
        { label: 'CreatorClub — Membership Platform', href: '/tools/creator-club/', emoji: '🏆', badge: 'NEW' },
        { label: 'CreatorCourse — Course Builder', href: '/tools/creator-course/', emoji: '🎓', badge: 'NEW' },
        { label: 'CreatorResearch — AI Research', href: '/tools/creator-research/', emoji: '🔍', badge: 'NEW' },
        { label: 'CreatorTeam — Collaboration', href: '/tools/creator-team/', emoji: '👥', badge: 'NEW' },
        { label: 'CreatorBrand — Brand Kit Manager', href: '/tools/creator-brand/', emoji: '💎', badge: 'NEW' },
        { label: 'CreatorSchedule — Social Scheduler', href: '/tools/creator-schedule/', emoji: '📅', badge: 'NEW' },
        { label: 'All Creative Economy Tools →', href: '/creative/', emoji: '🎨' },
      ]
    },
    {
      id: 'afrostream', label: 'AfroStream', labelFr: 'AfroStream', labelSw: 'AfroStream', icon: '🎬',
      desc: 'African creator streaming hub — live streams, rankings, net worth, news',
      descFr: 'Hub de streaming pour créateurs africains — lives, classements, actualités',
      descSw: 'Kituo cha utiririshaji wa waundaji wa Afrika — moja kwa moja, viwango',
      href: '/tools/afrostream/', color: '#FAF5FF', accent: '#A855F7',
      tools: [
        { label: 'AfroStream — Live Now', href: '/tools/afrostream/', emoji: '🔴', badge: 'NEW' },
        { label: 'Creator Rankings', href: '/tools/afrostream/rankings.html', emoji: '🏆', badge: 'NEW' },
        { label: 'Creator News', href: '/tools/afrostream/news.html', emoji: '📰', badge: 'NEW' },
        { label: 'Stream Calendar', href: '/tools/afrostream/calendar.html', emoji: '📅', badge: 'NEW' },
        { label: 'Community Hub', href: '/tools/afrostream/community.html', emoji: '🤝', badge: 'NEW' },
      ]
    },
    {
      id: 'security', label: 'Security & Safety', labelFr: 'Sécurité & Sûreté', labelSw: 'Usalama na Ulinzi', icon: '🔒',
      desc: 'Home security, cybersecurity, business continuity, risk',
      descFr: 'Sécurité domicile, cybersécurité, continuité d\'activité',
      descSw: 'Usalama wa nyumba, mtandao, uendelevu wa biashara',
      href: '/security/', color: '#F8FAFC', accent: '#475569',
      tools: [
        { label: 'Home Security Cost Estimator', href: '/tools/home-security-cost/', emoji: '🏠', badge: 'NEW' },
        { label: 'CCTV System Cost Calculator', href: '/tools/cctv-cost/', emoji: '📷', badge: 'NEW' },
        { label: 'Cybersecurity Risk Assessment', href: '/tools/cybersecurity-assessment/', emoji: '💻', badge: 'NEW' },
        { label: 'Password Strength Checker', href: '/tools/password-strength/', emoji: '🔐', badge: 'NEW' },
        { label: 'Phishing Detection Quiz', href: '/tools/phishing-quiz/', emoji: '🎣', badge: 'NEW' },
        { label: 'Data Breach Cost Estimator', href: '/tools/data-breach-cost/', emoji: '⚠️', badge: 'NEW' },
        { label: 'Vehicle Tracker ROI Calculator', href: '/tools/vehicle-tracker-roi/', emoji: '🚗', badge: 'NEW' },
        { label: 'Fire Safety Compliance Checklist', href: '/tools/fire-safety-checklist/', emoji: '🔥', badge: 'NEW' },
        { label: 'All Security Tools →', href: '/security/', emoji: '🔒' },
      ]
    },
    {
      id: 'travel', label: 'Travel & Tourism', labelFr: 'Voyage & Tourisme', labelSw: 'Usafiri na Utalii', icon: '🌍',
      desc: 'Safari cost, beach holidays, airport transfers, packing lists',
      descFr: 'Coût safari, vacances plage, transferts aéroport, listes d\'emballage',
      descSw: 'Gharama ya safari, likizo pwani, usafiri wa uwanja',
      href: '/travel/', color: '#F0F9FF', accent: '#0EA5E9',
      tools: [
        { label: 'African Safari Cost Calculator', href: '/tools/safari-cost/', emoji: '🦁', badge: 'NEW' },
        { label: 'Beach Holiday Budget (Africa)', href: '/tools/beach-holiday-budget/', emoji: '🏖️', badge: 'NEW' },
        { label: 'Travel Vaccination Schedule', href: '/tools/travel-vaccination-cost/', emoji: '💉', badge: 'NEW' },
        { label: 'Airport Transfer Comparator', href: '/tools/airport-transfer/', emoji: '🚗', badge: 'NEW' },
        { label: 'Airbnb vs Hotel (Africa)', href: '/tools/airbnb-vs-hotel/', emoji: '🏨', badge: 'NEW' },
        { label: 'Festival Travel Budget', href: '/tools/festival-travel-budget/', emoji: '🎪', badge: 'NEW' },
        { label: 'Travel Packing List Generator', href: '/tools/travel-packing-list/', emoji: '🧳', badge: 'NEW' },
        { label: 'All Travel Tools →', href: '/travel/', emoji: '🌍' },
      ]
    },
    {
      id: 'career', label: 'Career & Development', labelFr: 'Carrière & Développement', labelSw: 'Kazi na Maendeleo', icon: '📈',
      desc: 'Salary negotiation, freelance, personal brand, retirement',
      descFr: 'Négociation salaire, freelance, marque personnelle, retraite',
      descSw: 'Mazungumzo ya mshahara, uhuru, chapa ya kibinafsi, kustaafu',
      href: '/career/', color: '#EEF2FF', accent: '#6366F1',
      tools: [
        { label: 'Salary Negotiation Calculator', href: '/tools/salary-negotiation/', emoji: '💼', badge: 'NEW' },
        { label: 'Career Switch Financial Impact', href: '/tools/career-switch/', emoji: '🔄', badge: 'NEW' },
        { label: 'Side Hustle Profitability Ranker', href: '/tools/side-hustle-ranker/', emoji: '💡', badge: 'NEW' },
        { label: 'Personal Brand Audit Tool', href: '/tools/personal-brand-audit/', emoji: '⭐', badge: 'NEW' },
        { label: 'LinkedIn Profile Optimizer', href: '/tools/linkedin-optimizer/', emoji: '🔗', badge: 'NEW' },
        { label: 'Interview Preparation Checklist', href: '/tools/interview-prep/', emoji: '✅', badge: 'NEW' },
        { label: 'Retirement Readiness Score', href: '/tools/retirement-readiness/', emoji: '🏖️', badge: 'NEW' },
        { label: 'Career Growth Trajectory Calc', href: '/tools/career-growth/', emoji: '📈', badge: 'NEW' },
        { label: 'All Career Tools →', href: '/career/', emoji: '📈' },
      ]
    },
    {
      id: 'afrowork', label: 'AfroWork Suite', labelFr: 'Suite AfroWork', labelSw: 'Mfumo wa AfroWork', icon: '⚙️',
      desc: 'Payroll OS, compliance calendar, salary database, AI labour law advisor, document generator',
      descFr: 'OS de paie, calendrier conformité, base salaires, conseiller juridique IA, générateur docs',
      descSw: 'Mfumo wa mishahara, kalenda ya uzingatifu, hifadhidata ya mishahara, mshauri wa kisheria AI',
      href: '/afrowork/', color: '#FFFBEB', accent: '#D97706',
      tools: [
        { label: 'AfroPayroll OS — Hire-to-Retire Workflow', href: '/tools/afropayroll-os/', emoji: '🔄', badge: 'LIVE' },
        { label: 'Compliance Calendar — Statutory Deadlines', href: '/tools/compliance-calendar/', emoji: '📅', badge: 'SOON' },
        { label: 'Regulatory Change Alerts', href: '/tools/regulatory-alerts/', emoji: '🔔', badge: 'NEW' },
        { label: 'AI Labour Law Advisor', href: '/tools/labour-law-advisor/', emoji: '⚖️', badge: 'SOON' },
        { label: 'AfroSalary Database', href: '/tools/afrosalary-db/', emoji: '📊', badge: 'SOON' },
        { label: 'Document Generator Suite', href: '/tools/doc-generator/', emoji: '📄', badge: 'LIVE' },
        { label: 'Payroll API — B2B', href: '/afrowork/api/', emoji: '🔌', badge: 'SOON' },
        { label: 'WhatsApp Payroll Bot', href: '/afrowork/whatsapp/', emoji: '💬', badge: 'SOON' },
        { label: 'All AfroWork Features →', href: '/afrowork/', emoji: '⚙️' },
      ]
    },
  ];

  const SW_CATEGORY_HREFS = {
    financial: '/sw/mshahara-na-kodi/',
    'hr-payroll': '/sw/kazi-na-ajira/',
    'document-pdf': '/sw/hati-na-pdf/',
    'image-design': '/sw/picha-na-design/',
    developer: '/sw/zana-za-developer/',
    education: '/sw/elimu/',
    health: '/sw/afya/',
    insurance: '/sw/bima/',
    fintech: '/sw/fintech/',
    agriculture: '/sw/kilimo/',
    ecommerce: '/sw/vat-na-kodi/',
    legal: '/sw/biashara-na-uzingatiaji/',
    'data-productivity': '/sw/data-na-tija/',
    telecom: '/sw/mawasiliano-na-mtandao/',
    african: '/sw/nchi/',
    trade: '/sw/biashara-ya-nje/',
    government: '/sw/serikali-na-nyaraka/',
    'small-business': '/sw/biashara-ndogo/',
    transport: '/sw/usafiri-na-magari/',
    'personal-finance': '/sw/fintech/',
    diaspora: '/sw/serikali-na-nyaraka/',
    'religious-cultural': '/sw/dini-na-utamaduni/',
    climate: '/sw/hali-ya-hewa-na-mazingira/',
    energy: '/sw/nishati-na-huduma/',
    engineering: '/sw/ujenzi-na-uhandisi/',
        creative: '/sw/ubunifu-na-watayarishi/',
    career: '/sw/kazi-na-ajira/',
    afrowork: '/sw/kazi-na-ajira/'
  };

  // 16 categories for the Tools dropdown. Keep top-level navbar categories out of this grid.
  const TOOL_MENU_IDS = [
    'image-design', 'developer', 'education', 'health',
    'insurance', 'fintech', 'agriculture', 'legal',
    'language', 'trade', 'telecom', 'energy',
    'engineering', 'government', 'transport', 'personal-finance'
  ];

  const TOOL_MENU_COPY = {
    yo: {
      'image-design': { label: 'Àwòrán àti Dísáìn', desc: 'Dín, tún iwọn ṣe, QR kóòdù' },
      developer: { label: 'Irinṣẹ́ Olùdàgbàsókè', desc: 'JSON, Base64, hash, regex' },
      education: { label: 'Ẹ̀kọ́', desc: 'GPA, WAEC, awin, owó ilé-ẹ̀kọ́' },
      health: { label: 'Ìlera àti Ìtọju Ara', desc: 'Àrùn, owó ilé ìwòsàn, ounjẹ' },
      insurance: { label: 'Ìdánilójú', desc: 'Ọkọ, ìlera, ìgbésí ayé, ìrìnàjò' },
      fintech: { label: 'Fintech àti Bánkì', desc: 'Ìfipamọ́, awin, mobile money' },
      agriculture: { label: 'Ọ̀gbìn', desc: 'Ìkórè, irúgbìn, ajílẹ̀, omi' },
      legal: { label: 'Òfin àti Ìbámu', desc: 'Ìforúkọsílẹ̀, adehun, data privacy' },
      language: { label: 'Èdè àti Ìtumọ̀', desc: 'Yorùbá, Swahili, Hausa, Amharic' },
      trade: { label: 'Ìṣòwò àti Gbigbewọlé', desc: 'Ọkọ ojú omi, duty, incoterms' },
      telecom: { label: 'Tẹlifoonu àti Móbáìlì', desc: 'Data, USSD, roaming, ISP' },
      energy: { label: 'Agbára àti Ìpèsè', desc: 'Ina, solar, generator, omi' },
      engineering: { label: 'Ìmọ̀ Ẹ̀rọ', desc: 'BOQ, concrete, ina, ikọ́lé' },
      government: { label: 'Ìjọba àti Ara Ìlú', desc: 'Passport, ID, ìforúkọsílẹ̀ olùdìbò' },
      transport: { label: 'Ìrìnàjò àti Ẹru', desc: 'Epo, ọkọ, delivery, naira ọkọ' },
      'personal-finance': { label: 'Ìṣúná Ara Ẹni', desc: 'Budget, ìdílé, owó-ori' }
    },
    ha: {
      'image-design': { label: 'Hoto da Zane', desc: 'Matsa hoto, canja girma, QR code' },
      developer: { label: 'Kayan Developer', desc: 'JSON, Base64, hash, regex' },
      education: { label: 'Ilimi', desc: 'GPA, WAEC, rance, kuɗin makaranta' },
      health: { label: 'Lafiya da Walwala', desc: 'Cuta, kuɗin asibiti, abinci' },
      insurance: { label: 'Inshora', desc: 'Mota, lafiya, rai, tafiya' },
      fintech: { label: 'Fintech da Banki', desc: 'Ajiya, rance, mobile money' },
      agriculture: { label: 'Noma', desc: 'Amfanin gona, iri, taki, ban ruwa' },
      legal: { label: "Doka da Bin Ka'ida", desc: "Rajista, kwangila, sirrin bayanai" },
      language: { label: 'Harshe da Fassara', desc: 'Yoruba, Swahili, Hausa, Amharic' },
      trade: { label: 'Kasuwanci da Shigo da Kaya', desc: 'Jirgi, haraji, incoterms' },
      telecom: { label: 'Sadarwa da Wayar Hannu', desc: 'Data, USSD, roaming, ISP' },
      energy: { label: 'Makamashi da Ayyuka', desc: 'Wutar lantarki, solar, generator' },
      engineering: { label: 'Injiniyanci', desc: 'BOQ, kankare, lantarki, gini' },
      government: { label: "Gwamnati da Jama'a", desc: "Fasfo, ID, rajistar zaɓe" },
      transport: { label: 'Sufuri da Jigila', desc: 'Mai, mota, delivery, farashi' },
      'personal-finance': { label: 'Kuɗin Kai', desc: 'Budget, al’amuran gida, haraji' }
    }
  };

  const BUSINESS_LINKS = [
    {
      label: 'Widgets',
      href: '/widgets/',
      icon: 'W',
      desc: 'Free embeds, Widget Pro, white-label setup, analytics, and lead capture.'
    },
    {
      label: 'API',
      href: '/api/',
      icon: 'API',
      desc: 'Sandbox keys, API Growth pilots, Pro access, and enterprise data subscriptions.'
    },
    {
      label: 'Sponsored Tools',
      href: '/sponsored-tools/',
      icon: 'SP',
      desc: 'Tool, category, and country sponsorship placements with pilot pricing.'
    },
    {
      label: 'Custom Calculators',
      href: '/custom-calculators/',
      icon: 'CC',
      desc: 'Branded calculators for HR, payroll, fintech, accounting, schools, and media.'
    },
    {
      label: 'Media Kit',
      href: '/media-kit/',
      icon: 'MK',
      desc: 'Audience, inventory, offer ladder, pricing ranges, placements, and FAQ.'
    }
  ];

  function localizedItemText(item, field, lang) {
    var overrides = TOOL_MENU_COPY[lang] && TOOL_MENU_COPY[lang][item.id];
    if (overrides && overrides[field]) return overrides[field];
    if (lang === 'fr' && item[field + 'Fr']) return item[field + 'Fr'];
    if (lang === 'sw' && item[field + 'Sw']) return item[field + 'Sw'];
    return item[field] || '';
  }

  const COUNTRY_LINKS = [
    { label: 'Nigeria', href: '/nigeria/' },
    { label: 'Kenya', href: '/kenya/' },
    { label: 'Ghana', href: '/ghana/' },
    { label: 'South Africa', href: '/south-africa/' },
    { label: 'Egypt', href: '/egypt/' },
    { label: 'Tanzania', href: '/tanzania/' },
    { label: 'Rwanda', href: '/rwanda/' },
    { label: 'Senegal', href: '/senegal/' },
  ];

  const MARK = `<svg viewBox="0 0 68 68" fill="none" xmlns="http://www.w3.org/2000/svg" style="height:30px;width:30px;flex-shrink:0">
    <polygon points="34,20 48,34 34,48 20,34" fill="#0062CC"/>
    <polygon points="34,2  44,14 34,20 24,14" fill="#F5A623"/>
    <polygon points="34,48 44,60 34,68 24,60" fill="#0047AB"/>
    <polygon points="2,24  14,34 2,44  -10,34" fill="#0062CC" opacity="0.7"/>
    <polygon points="52,24 64,34 52,44 40,34"  fill="#0062CC" opacity="0.55"/>
  </svg>`;

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; font-family: 'DM Sans', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
    :host {
      display: block;
      position: sticky;
      top: 0;
      z-index: 500;
      --nav-shell-height: 64px;
      --nav-inline-pad: 20px;
      --nav-safe-top: env(safe-area-inset-top, 0px);
      --nav-safe-right: env(safe-area-inset-right, 0px);
      --nav-safe-bottom: env(safe-area-inset-bottom, 0px);
      --nav-safe-left: env(safe-area-inset-left, 0px);
    }

    nav {
      position: relative;
      height: var(--nav-shell-height);
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      display: flex; align-items: center;
      padding: 0 max(var(--nav-inline-pad), var(--nav-safe-right)) 0 max(var(--nav-inline-pad), var(--nav-safe-left));
      transition: box-shadow 0.2s;
    }
    nav.scrolled { box-shadow: 0 1px 0 rgba(0,0,0,0.06); }

    .inner {
      max-width: min(1360px, calc(100vw - 32px)); margin: 0 auto; width: 100%;
      display: flex; align-items: center; gap: 10px;
    }

    /* LOGO */
    .logo {
      display: flex; align-items: center; gap: 9px;
      text-decoration: none; flex-shrink: 0; margin-right: 8px;
    }
    .logo-name { font-size: 1rem; font-weight: 800; letter-spacing: 0.02em; color: #111827; }
    .logo-name b { color: #0062CC; }
    .logo-tag { font-size: 0.44rem; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: #9ca3af; display: block; margin-top: 2px; }

    /* NAV LINKS */
    .nav-links { display: flex; align-items: center; justify-content: flex-start; list-style: none; flex: 1 1 auto; gap: 4px; overflow: hidden; min-width: 0; }
    li { position: relative; }

    .lnk {
      display: flex; align-items: center; gap: 4px;
      padding: 7px 12px; border-radius: 980px;
      font-size: 0.81rem; font-weight: 600; color: #374151;
      text-decoration: none; border: none; background: transparent;
      cursor: pointer; white-space: nowrap;
      transition: color 0.13s, background 0.13s;
      min-height: 40px;
    }
    .lnk:hover, .lnk.open { color: #0062CC; background: #EEF4FF; }
    .lnk.active { color: #0062CC; position: relative; }
    .lnk.active::after { content: ''; position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%); width: 16px; height: 2px; background: #0062CC; border-radius: 2px; }
    .chev { width: 7px; height: 4px; flex-shrink: 0; opacity: 0.4; transition: transform 0.18s, opacity 0.13s; }
    .lnk.open .chev { transform: rotate(180deg); opacity: 1; color: #0062CC; }

    /* MEGA MENU */
    .mega {
      position: fixed;
      top: var(--nav-shell-height); left: 0; right: 0;
      background: rgba(255,255,255,0.97);
      -webkit-backdrop-filter: saturate(180%) blur(20px);
      backdrop-filter: saturate(180%) blur(20px);
      border-bottom: 1px solid rgba(0,0,0,0.07);
      box-shadow: 0 18px 42px rgba(15,23,42,0.08);
      opacity: 0; visibility: hidden;
      transform: translateY(-6px);
      transition: opacity 0.16s ease, visibility 0.16s ease, transform 0.16s ease;
      z-index: 499;
      pointer-events: none;
    }
    .mega.open {
      opacity: 1; visibility: visible;
      transform: translateY(0);
      pointer-events: all;
    }

    .mega-inner {
      max-width: 1200px; margin: 0 auto;
      padding: 22px 20px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .tools-mega-grid {
      max-width: 1240px;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
    }
    .business-mega-grid {
      max-width: 980px;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 10px;
    }

    .mega-col {
      border-radius: 12px; padding: 15px;
      border: 1px solid #edf1f7;
      transition: border-color 0.13s, background 0.13s;
      display: flex; align-items: center; gap: 9px;
      text-decoration: none; cursor: pointer;
    }
    .mega-col:hover { border-color: var(--col-accent, #0062CC); background: #f8fbff; }
    .business-col {
      align-items: flex-start;
      flex-direction: column;
      min-height: 136px;
      gap: 10px;
    }
    .business-col .mega-col-icon {
      color: #0062CC;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0;
    }

    .mega-col-icon {
      width: 34px; height: 34px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem; flex-shrink: 0;
    }
    .mega-col-name { font-size: 0.83rem; font-weight: 600; color: #334155; line-height: 1.2; }
    .mega-col-desc { font-size: 0.65rem; font-weight: 400; color: #64748b; margin-top: 1px; }

    .mega-footer {
      max-width: 1200px; margin: 0 auto;
      padding: 10px 20px 14px;
      border-top: 1px solid #f3f4f6;
      display: flex; align-items: center; justify-content: space-between;
    }
    .mega-footer-note { font-size: 0.68rem; color: #64748b; font-weight: 600; }
    .mega-footer-lnk { font-size: 0.72rem; font-weight: 700; color: #0062CC; text-decoration: none; }
    .mega-footer-lnk:hover { text-decoration: underline; }

    .country-search-panel {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: minmax(240px, 360px) 1fr;
      gap: 12px;
      align-items: start;
      padding: 2px 0 8px;
    }
    .country-search-label {
      display: block;
      margin-bottom: 6px;
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #64748b;
    }
    .country-search-box {
      display: flex;
      align-items: center;
      min-height: 44px;
      border: 1px solid #dbe3ef;
      border-radius: 12px;
      background: #fff;
      padding: 0 12px;
    }
    .country-search-box:focus-within {
      border-color: #0062CC;
      box-shadow: 0 0 0 3px rgba(0,98,204,0.12);
    }
    .country-search-input {
      width: 100%;
      border: 0;
      outline: 0;
      background: transparent;
      color: #111827;
      font: inherit;
      font-size: 0.88rem;
      font-weight: 600;
    }
    .country-search-input::placeholder { color: #94a3b8; font-weight: 500; }
    .country-search-results {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      min-height: 0;
    }
    .country-search-results:empty { display: none; }
    .country-search-result {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      min-height: 44px;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid #edf1f7;
      color: #1f2937;
      text-decoration: none;
      background: #fff;
      font-size: 0.84rem;
      font-weight: 800;
    }
    .country-search-result:hover { border-color: #0062CC; color: #0062CC; background: #f8fbff; }
    .country-search-meta { color: #64748b; font-size: 0.68rem; font-weight: 700; }

    /* RIGHT */
    .right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; margin-left: auto; }
    .country-control-shell { width: 156px; flex: 0 0 156px; }
    .pill-54 { font-size: 0.66rem; font-weight: 600; color: #6b7280; padding: 4px 10px; border-radius: 20px; border: 1px solid #e5e7eb; background: #f9fafb; white-space: nowrap; }

    .btn-login {
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 0.79rem; font-weight: 600; color: #374151;
      padding: 7px 14px; border-radius: 980px;
      border: 1.5px solid rgba(0,0,0,0.12); background: rgba(0,0,0,0.03);
      text-decoration: none; white-space: nowrap;
      transition: all 0.13s; cursor: pointer;
      min-height: 40px;
    }
    .btn-login:hover { border-color: #0062CC; color: #0062CC; }
    .btn-login.is-user {
      width: 42px;
      min-width: 42px;
      padding: 0;
      gap: 0;
      border-color: rgba(0,0,0,0.12);
      background: #f8fafc;
    }
    .btn-login.is-user:hover {
      background: #EEF4FF;
      border-color: #0062CC;
    }
    .nav-user-avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #0062CC;
      color: #fff;
      font-size: 0.68rem;
      font-weight: 800;
      line-height: 1;
    }
    .nav-user-name {
      display: none;
    }
    .ap-nav-badge {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      min-height: 32px;
      background: rgba(245,158,11,0.12);
      color: #B45309;
      font-size: 0.68rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 100px;
      text-decoration: none;
      white-space: nowrap;
    }

    .btn-pro {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 56px; padding: 7px 14px; border-radius: 980px;
      border: 1.5px solid #BFDBFE;
      background: #fff;
      color: #0B63CE; text-decoration: none; white-space: nowrap;
      font-size: 0.78rem; font-weight: 700; letter-spacing: 0;
      transition: transform 0.13s, box-shadow 0.13s, background 0.13s, border-color 0.13s;
      box-shadow: 0 2px 8px rgba(15,23,42,0.05);
      min-height: 40px;
    }
    .btn-pro:hover {
      background: #EFF6FF;
      border-color: #0062CC;
      box-shadow: 0 5px 14px rgba(0,98,204,0.12);
      transform: translateY(-1px);
    }
    .btn-pro.is-free {
      background: #F8FAFC;
      border-color: #CBD5E1;
      color: #0F172A;
    }
    .btn-pro.is-pro {
      background: #ECFDF5;
      border-color: #A7F3D0;
      color: #047857;
      box-shadow: 0 3px 10px rgba(4,120,87,0.08);
    }

    .cta {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 8px 16px; border-radius: 980px;
      font-size: 0.79rem; font-weight: 700;
      text-decoration: none; background: #0062CC; color: #fff;
      border: none; cursor: pointer; white-space: nowrap;
      transition: background 0.13s, transform 0.1s;
      box-shadow: 0 1px 4px rgba(0,122,255,0.28);
      min-height: 40px;
    }
    .cta:hover  { background: #005BBF; transform: translateY(-1px); }
    .cta:active { transform: translateY(0); }

    /* LANGUAGE SWITCHER */
    .lang-switch { position: relative; display: flex; align-items: center; }
    .lang-btn {
      display: flex; align-items: center; gap: 4px;
      padding: 4px 8px; border-radius: 980px;
      font-size: 0.73rem; font-weight: 700; color: #374151;
      border: 1.5px solid rgba(0,0,0,0.1); background: rgba(0,0,0,0.02);
      cursor: pointer; white-space: nowrap; transition: all 0.13s;
      font-family: 'DM Sans', system-ui, sans-serif;
      min-height: 40px;
    }
    .lang-btn-label { transition: width 0.15s, opacity 0.15s; }
    .lang-btn:hover { border-color: #0062CC; color: #0062CC; background: #EEF4FF; }
    .lang-drop {
      display: none; position: absolute; top: calc(100% + 6px); right: 0;
      background: #fff; border-radius: 10px; border: 1px solid #e5e7eb;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12); min-width: 150px; z-index: 600;
      overflow: hidden;
    }
    .lang-drop.open { display: block; }
    .lang-opt {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px; font-size: 0.82rem; font-weight: 500; color: #374151;
      text-decoration: none; transition: background 0.1s; cursor: pointer;
    }
    .lang-opt:hover { background: #EEF4FF; }
    .lang-opt.active { font-weight: 700; color: #0062CC; background: #f0f7ff; }

    /* HAMBURGER */
    .burger {
      display: none; flex-direction: column; justify-content: center; gap: 5px;
      width: 44px; height: 44px; background: transparent; border: none;
      cursor: pointer; padding: 10px; border-radius: 6px; flex-shrink: 0;
    }
    .burger:hover { background: #f3f4f6; }
    .burger span { display: block; width: 100%; height: 2px; background: #374151; border-radius: 2px; transition: all 0.22s; }
    .burger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .burger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
    .burger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

    /* MOBILE DRAWER */
    .mob {
      display: none; position: fixed;
      top: var(--nav-shell-height); left: 0; right: 0; bottom: 0;
      background: #fff; z-index: 498;
      overflow-y: auto; flex-direction: column;
      opacity: 0; pointer-events: none;
      transition: opacity 0.2s;
      min-height: calc(100dvh - var(--nav-shell-height));
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
      padding-right: var(--nav-safe-right);
      padding-bottom: calc(20px + var(--nav-safe-bottom));
      padding-left: var(--nav-safe-left);
    }
    .mob.open { opacity: 1; pointer-events: all; }
    .mob-country-context { padding: 16px 18px 0; }

    .mob-section-label {
      font-size: 0.68rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
      color: #9ca3af; padding: 14px 20px 6px;
    }
    .mob-country-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      padding: 0 16px 8px;
    }
    .mob-country-link {
      min-height: 44px;
      display: flex; align-items: center; justify-content: center;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid #e5e7eb;
      color: #1f2937;
      background: #fff;
      font-size: 0.86rem;
      font-weight: 700;
      text-decoration: none;
    }
    .mob-country-link:hover { border-color: #0062CC; color: #0062CC; background: #f8fbff; }
    .mob-country-search {
      display: flex;
      align-items: center;
      min-height: 48px;
      margin: 0 16px 10px;
      padding: 0 12px;
      border-radius: 10px;
      border: 1px solid #dbe3ef;
      background: #fff;
    }
    .mob-country-search:focus-within {
      border-color: #0062CC;
      box-shadow: 0 0 0 3px rgba(0,98,204,0.12);
    }
    .mob-country-search-input {
      width: 100%;
      border: 0;
      outline: 0;
      background: transparent;
      color: #111827;
      font: inherit;
      font-size: 16px;
      font-weight: 600;
    }
    .mob-country-results {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
      padding: 0 16px 8px;
    }
    .mob-country-results:empty { display: none; }
    .mob-country-results .country-search-result { width: 100%; }
    .mob-cat {
      display: flex; align-items: center; gap: 12px;
      padding: 13px 20px; border-bottom: 1px solid #f9fafb;
      text-decoration: none; transition: background 0.1s; min-height: 58px;
    }
    .mob-cat:hover { background: #f9fafb; }
    .mob-cat-icon {
      width: 38px; height: 38px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem; flex-shrink: 0;
    }
    .mob-cat-label { font-size: 0.92rem; font-weight: 600; color: #334155; }
    .mob-cat-desc  { font-size: 0.7rem; font-weight: 400; color: #6b7280; margin-top: 1px; }
    .mob-arr { margin-left: auto; font-size: 0.7rem; color: #9ca3af; }

    .mob-footer {
      padding: 20px; border-top: 1px solid #f3f4f6; margin-top: 8px;
      display: flex; flex-direction: column; gap: 10px;
    }
    .mob-footer a { min-height: 48px; }
    .mob-cta {
      display: flex; align-items: center; justify-content: center;
      padding: 15px; border-radius: 980px; font-size: 0.95rem; font-weight: 700;
      text-decoration: none; background: #0062CC; color: white; min-height: 52px;
    }
    .mob-login {
      display: flex; align-items: center; justify-content: center;
      padding: 13px; border-radius: 8px; font-size: 0.9rem; font-weight: 600;
      text-decoration: none; border: 1.5px solid #e5e7eb; color: #374151;
    }
    .mob-pro-link {
      display: flex; align-items: center; justify-content: center;
      padding: 13px; border-radius: 8px; font-size: 0.9rem; font-weight: 700;
      text-decoration: none; border: 1.5px solid #BFDBFE; color: #0B63CE; background: #fff;
      box-shadow: 0 2px 8px rgba(15,23,42,0.05);
    }
    .mob-pro-link.is-free {
      border-color: #CBD5E1;
      color: #0F172A;
      background: #F8FAFC;
    }
    .mob-pro-link.is-pro {
      border-color: #A7F3D0;
      color: #047857;
      background: #ECFDF5;
    }
    .mob-note { text-align: center; font-size: 0.7rem; font-weight: 500; color: #9ca3af; }

    /* RESPONSIVE — progressive collapse */
    .pill-54 { display: none; }
    @media (max-width: 1320px) {
      .inner { gap: 8px; }
      .logo { margin-right: 4px; }
      .lnk { padding-left: 10px; padding-right: 10px; }
      .right { gap: 6px; }
      .country-control-shell { width: 148px; flex-basis: 148px; }
      .search-btn .search-kbd { display: none; }
      .btn-pro { padding-left: 12px; padding-right: 12px; }
    }
    @media (max-width: 1120px) {
      .business-mega-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
    @media (max-width: 1180px) {
      .nav-links li:nth-child(6) { display: none; }
    }
    @media (max-width: 1120px) {
      .nav-links li:nth-child(5) { display: none; }
    }
    @media (max-width: 1100px) {
      .country-control-shell { display: none; }
      .cta { display: none; }
      .lang-btn-label { display: none; }
      .lang-btn { padding: 5px 7px; font-size: 0.9rem; }
      .btn-pro { min-width: 0; padding: 7px 12px; }
    }
    @media (max-width: 940px) {
      .nav-links, .pill-54, .cta, .btn-pro { display: none; }
      .lang-switch { display: none; }
      .btn-login { display: none; }
      .btn-login .nav-user-name, .btn-login .user-menu-name { display: none !important; width: 0 !important; height: 0 !important; overflow: hidden !important; font-size: 0 !important; }
      .btn-login span:first-child { margin-right: 0 !important; }
      .burger { display: flex; }
      .mob    { display: flex; }
      nav     {
        padding-left: max(16px, var(--nav-safe-left));
        padding-right: max(16px, var(--nav-safe-right));
        max-width: 100vw !important;
        overflow-x: hidden !important;
      }
    }
    @media (max-width: 480px) {
      :host {
        --nav-shell-height: 56px;
        --nav-inline-pad: 16px;
      }
      .logo-tag { display: none; }
    }

    /* SEARCH BUTTON */
    .search-btn {
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; border-radius: 980px;
      border: 1px solid rgba(0,0,0,0.1); background: rgba(0,0,0,0.04);
      cursor: pointer; color: #6b7280;
      transition: all 0.13s; flex-shrink: 0;
    }
    .search-btn:hover { border-color: #0062CC; color: #0062CC; background: #EEF4FF; }
    .search-btn:focus-visible, .lnk:focus-visible, .btn-login:focus-visible, .btn-pro:focus-visible, .mob-pro-link:focus-visible, .burger:focus-visible, .lang-btn:focus-visible {
      outline: 3px solid rgba(0,98,204,0.22);
      outline-offset: 2px;
    }
    .search-btn svg { width: 16px; height: 16px; }
    .search-btn-label { display: none; font-size: 0.79rem; font-weight: 700; }
    .search-kbd {
      font-size: 0.65rem; font-weight: 600; color: #9ca3af;
      margin-left: 4px; background: #f3f4f6; border-radius: 4px;
      padding: 1px 5px; border: 1px solid #e5e7eb;
      display: none;
    }
    @media (min-width: 941px) {
      .search-btn { width: auto; padding: 0 10px; gap: 6px; }
      .search-btn-label { display: inline; }
      .search-kbd { display: inline; }
    }

    /* SEARCH OVERLAY */
    .search-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.4);
      backdrop-filter: blur(4px);
      display: flex; align-items: flex-start; justify-content: center;
      padding-top: 12vh;
      opacity: 0; visibility: hidden;
      transition: opacity 0.16s, visibility 0.16s;
    }
    .search-overlay.open { opacity: 1; visibility: visible; }

    .search-modal {
      width: 100%; max-width: 560px;
      background: #fff; border-radius: 14px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.08);
      overflow: hidden;
      transform: translateY(-12px) scale(0.97);
      transition: transform 0.18s ease;
      margin: 0 16px;
    }
    .search-overlay.open .search-modal {
      transform: translateY(0) scale(1);
    }

    .search-input-wrap {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 18px;
      border-bottom: 1px solid #f3f4f6;
    }
    .search-input-wrap svg { width: 18px; height: 18px; color: #9ca3af; flex-shrink: 0; }
    .search-input {
      flex: 1; border: none; outline: none;
      font-size: 1rem; font-weight: 500; color: #111827;
      font-family: 'DM Sans', system-ui, sans-serif;
      background: transparent;
    }
    .search-input::placeholder { color: #c4c8cc; }
    .search-esc {
      font-size: 0.68rem; font-weight: 600; color: #9ca3af;
      background: #f3f4f6; border-radius: 4px;
      padding: 2px 7px; border: 1px solid #e5e7eb;
      cursor: pointer; flex-shrink: 0;
    }

    .search-results {
      max-height: 400px; overflow-y: auto;
      padding: 6px;
    }
    .search-results::-webkit-scrollbar { width: 6px; }
    .search-results::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }

    .search-result {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px; border-radius: 10px;
      text-decoration: none; color: inherit;
      transition: background 0.1s;
      cursor: pointer;
    }
    .search-result:hover, .search-result.active {
      background: #EEF4FF;
    }
    .search-result-icon {
      width: 38px; height: 38px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.15rem; flex-shrink: 0;
      background: #f3f4f6;
    }
    .search-result-name {
      font-size: 0.85rem; font-weight: 700; color: #111827;
      line-height: 1.2;
    }
    .search-result-name mark {
      background: #DBEAFE; color: #1D4ED8;
      border-radius: 2px; padding: 0 1px;
    }
    .search-result-desc {
      font-size: 0.7rem; font-weight: 400; color: #6b7280;
      margin-top: 2px;
      display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;
    }
    .search-result-cat {
      font-size: 0.65rem; font-weight: 600; color: #9ca3af;
      text-transform: uppercase; letter-spacing: 0.06em;
      margin-top: 2px;
    }

    .search-empty {
      padding: 32px 16px; text-align: center;
    }
    .search-empty-icon { font-size: 2rem; margin-bottom: 8px; }
    .search-empty-text { font-size: 0.85rem; font-weight: 600; color: #6b7280; }
    .search-empty-hint { font-size: 0.72rem; color: #9ca3af; margin-top: 4px; }

    .search-footer {
      padding: 10px 18px;
      border-top: 1px solid #f3f4f6;
      display: flex; align-items: center; justify-content: space-between;
    }
    .search-footer-hint {
      font-size: 0.68rem; color: #9ca3af; font-weight: 500;
      display: flex; align-items: center; gap: 8px;
    }
    .search-footer-hint kbd {
      background: #f3f4f6; border: 1px solid #e5e7eb;
      border-radius: 3px; padding: 1px 5px;
      font-size: 0.65rem; font-weight: 600; font-family: inherit;
    }

    /* RECENT TOOLS in search */
    .search-section-label {
      font-size: 0.68rem; font-weight: 700; letter-spacing: 0.1em;
      text-transform: uppercase; color: #9ca3af;
      padding: 10px 12px 4px;
    }
    .recent-clear {
      font-size: 0.68rem; font-weight: 600; color: #0062CC;
      cursor: pointer; float: right; background: none; border: none;
      font-family: inherit; padding: 0;
    }
    .recent-clear:hover { text-decoration: underline; }

    /* MOBILE SEARCH in drawer */
    .mob-search-bar {
      display: flex; align-items: center; gap: 10px;
      margin: 12px 16px 4px; padding: 11px 14px;
      border-radius: 10px; border: 1.5px solid #e5e7eb;
      background: #f9fafb;
      transition: border-color 0.13s;
      min-height: 52px;
    }
    .mob-search-bar:focus-within { border-color: #0062CC; background: #fff; }
    .mob-search-bar svg { width: 16px; height: 16px; color: #9ca3af; flex-shrink: 0; }
    .mob-search-input {
      flex: 1; border: none; outline: none;
      font-size: 16px; font-weight: 500; color: #111827;
      font-family: 'DM Sans', system-ui, sans-serif;
      background: transparent;
    }
    .mob-search-input::placeholder { color: #c4c8cc; }
    .mob-search-results {
      padding: 0 8px 8px;
    }
    .mob-search-results .search-result {
      padding: 12px 12px;
      min-height: 56px;
    }
    .mob-search-results .search-result-icon {
      width: 40px; height: 40px;
    }
    .mob-search-empty {
      padding: 20px 16px; text-align: center;
      font-size: 0.8rem; color: #9ca3af; font-weight: 500;
    }

    /* MOBILE LANGUAGE PICKER */
    .mob-lang-section { padding: 6px 16px 2px; }
    .mob-lang-row {
      display: flex; flex-wrap: wrap; gap: 8px;
    }
    .mob-lang-opt {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 8px 14px; border-radius: 980px;
      font-size: 0.82rem; font-weight: 600; color: #374151;
      text-decoration: none; border: 1.5px solid #e5e7eb;
      background: #f9fafb; transition: all 0.13s;
    }
    .mob-lang-opt:hover { border-color: #0062CC; color: #0062CC; background: #EEF4FF; }
    .mob-lang-opt.active { border-color: #0062CC; color: #0062CC; background: #EEF4FF; font-weight: 700; }
  `;

  class AfroNavbar extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._menuOpen = false;
      this._megaOpen = false;
      this._lockedScrollY = 0;
      this._bodyLocked = false;
    }

    connectedCallback() {
      // P4-03: Inject favicon if not already present
      if (!document.querySelector('link[rel="icon"]')) {
        var link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/svg+xml';
        link.href = '/assets/img/logo-mark.svg';
        document.head.appendChild(link);
      }
      this._render(); this._bind();
    }

    disconnectedCallback() {
      if (this._bodyLocked) this._unlockBodyScroll();
    }
    get active() { return this.getAttribute('active') || ''; }

    _getLang() {
      var segs = window.location.pathname.split('/');
      var first = segs[1];
      if (['fr','sw','yo','ha'].indexOf(first) !== -1) return first;
      return document.documentElement.lang || 'en';
    }

    _langSwitcherHTML() {
      var cur = this._getLang();
      var LANGS = [
        { code: 'en', label: 'English' },
        { code: 'fr', label: 'Français' },
        { code: 'sw', label: 'Kiswahili' },
        { code: 'yo', label: 'Yorùbá' },
        { code: 'ha', label: 'Hausa' },
      ];
      var curObj = LANGS.find(function(l){ return l.code === cur; }) || LANGS[0];
      var opts = LANGS.map(function(l) {
        var active = l.code === cur ? ' active' : '';
        var check = l.code === cur ? '✓' : '';
        // Build URL for this language
        var p = window.location.pathname;
        if (cur !== 'en') p = p.replace(new RegExp('^/' + cur + '(/|$)'), '/');
        var href = l.code !== 'en' ? '/' + l.code + (p.startsWith('/') ? '' : '/') + p : p;
        return '<a href="' + href + '" class="lang-opt' + active + '"><span class="lang-opt-check">' + check + '</span>' + l.label + '</a>';
      }).join('');
      return '<div class="lang-switch"><button class="lang-btn" id="langBtn" type="button" aria-label="Change language">🌐 <span class="lang-btn-label">' + curObj.label + '</span></button><div class="lang-drop" id="langDrop">' + opts + '</div></div>';
    }

    _navItems() {
      var lang = this._getLang();
      return (lang === 'fr' || lang === 'sw') ? NAV_ITEMS.filter(c => c.id !== 'francophone') : NAV_ITEMS;
    }

    _localizedHref(item, lang) {
      if (!item) return '#';
      var cur = lang || this._getLang();
      if (cur === 'fr' && item.hrefFr) return item.hrefFr;
      if (cur === 'sw') return SW_CATEGORY_HREFS[item.id] || item.hrefSw || item.href || '#';
      return item.href || '#';
    }

    _megaContent() {
      var lang = this._getLang();
      var isFr = lang === 'fr';
      var isSw = lang === 'sw';
      var featured = TOOL_MENU_IDS.map(id => this._navItems().find(c => c.id === id)).filter(Boolean);
      var html = featured.map(cat => {
        var href = this._localizedHref(cat, lang);
        var label = localizedItemText(cat, 'label', lang);
        var desc = localizedItemText(cat, 'desc', lang);
        return `
        <a href="${href}" class="mega-col" data-cat="${cat.id}" style="--col-accent:${cat.accent}">
          <div class="mega-col-icon" style="background:${cat.color}">${cat.icon}</div>
          <div>
            <div class="mega-col-name">${label}</div>
            <div class="mega-col-desc">${desc}</div>
          </div>
        </a>`;
      }).join('');
      return html;
    }

    _countriesHref() {
      var lang = this._getLang();
      if (lang === 'fr') return '/fr/countries/';
      if (lang === 'sw') return '/sw/nchi/';
      return '/countries/';
    }

    _countriesContent() {
      var lang = this._getLang();
      var isFr = lang === 'fr';
      var isSw = lang === 'sw';
      var searchLabel = isSw ? 'Tafuta nchi' : isFr ? 'Rechercher un pays' : 'Country search';
      var searchPlaceholder = isSw ? 'Tafuta Nigeria, Kenya...' : isFr ? 'Rechercher Nigeria, Kenya...' : 'Search Nigeria, Kenya, Ghana...';
      var itemDesc = isSw ? 'Zana za nchi' : isFr ? 'Outils par pays' : 'Country tools and tax pages';
      var html = `
        <div class="country-search-panel">
          <div>
            <label class="country-search-label" for="countrySearchInput">${searchLabel}</label>
            <div class="country-search-box">
              <input id="countrySearchInput" class="country-search-input" type="search" placeholder="${searchPlaceholder}" autocomplete="off" aria-label="${searchLabel}">
            </div>
          </div>
          <div class="country-search-results" id="countrySearchResults" role="listbox" aria-label="${searchLabel}"></div>
        </div>`;
      html += COUNTRY_LINKS.map(country => `
        <a href="${this._countryHref(country.label)}" class="mega-col" style="--col-accent:#0062CC">
          <div class="mega-col-icon" style="background:#EEF4FF">${country.label.charAt(0)}</div>
          <div>
            <div class="mega-col-name">${country.label}</div>
            <div class="mega-col-desc">${itemDesc}</div>
          </div>
        </a>`).join('');
      var allLabel = isSw ? 'Nchi zote 54 ->' : isFr ? 'Les 54 pays ->' : 'All 54 countries ->';
      var allDesc = isSw ? 'Chagua nchi yako' : isFr ? 'Choisissez votre pays' : 'Choose your country';
      html += `
        <a href="${this._countriesHref()}" class="mega-col" style="--col-accent:#0062CC">
          <div class="mega-col-icon" style="background:#EEF4FF">54</div>
          <div>
            <div class="mega-col-name">${allLabel}</div>
            <div class="mega-col-desc">${allDesc}</div>
          </div>
        </a>`;
      return html;
    }

    _businessContent() {
      return BUSINESS_LINKS.map(item => `
        <a href="${item.href}" class="mega-col business-col" style="--col-accent:#0062CC">
          <div class="mega-col-icon" style="background:#EEF4FF">${item.icon}</div>
          <div>
            <div class="mega-col-name">${item.label}</div>
            <div class="mega-col-desc">${item.desc}</div>
          </div>
        </a>`).join('');
    }

    _mobileBusinessContent() {
      return BUSINESS_LINKS.map(item => `
        <a href="${item.href}" class="mob-cat">
          <div class="mob-cat-icon" style="background:#EEF4FF;color:#0062CC;font-size:0.75rem;font-weight:800">${item.icon}</div>
          <div>
            <div class="mob-cat-label">${item.label}</div>
            <div class="mob-cat-desc">${item.desc}</div>
          </div>
          <span class="mob-arr">â€º</span>
        </a>`).join('');
    }

    _mobileContent() {
      var lang = this._getLang();
      var isFr = lang === 'fr';
      var isSw = lang === 'sw';
      var featured = TOOL_MENU_IDS.map(id => this._navItems().find(c => c.id === id)).filter(Boolean);
      var html = featured.map(cat => {
        var href = this._localizedHref(cat, lang);
        var label = localizedItemText(cat, 'label', lang);
        var desc = localizedItemText(cat, 'desc', lang);
        return `
        <a href="${href}" class="mob-cat">
          <div class="mob-cat-icon" style="background:${cat.color}">${cat.icon}</div>
          <div>
            <div class="mob-cat-label">${label}</div>
            <div class="mob-cat-desc">${desc}</div>
          </div>
          <span class="mob-arr">›</span>
        </a>`;
      }).join('');
      var allLabel = isSw ? 'Makundi Yote →' : isFr ? 'Toutes les catégories →' : 'All 28 Categories →';
      var allDesc = isSw ? 'Tazama makundi yote' : isFr ? 'Voir toutes les catégories' : 'Browse every tool category';
      var allHref = isFr ? '/fr/categories/' : '/categories/';
      allLabel = isSw ? 'Zana Zote ->' : isFr ? 'Tous les outils ->' : 'All Tools ->';
      allDesc = isSw ? 'Tafuta na chuja zana zote' : isFr ? 'Rechercher et filtrer tous les outils' : 'Search and filter every tool';
      allHref = isSw ? '/sw/zana-zote/' : isFr ? '/fr/all-tools/' : '/all-tools/';
      html += `
        <a href="${allHref}" class="mob-cat" style="border-top:2px solid #e5e7eb;margin-top:4px">
          <div class="mob-cat-icon" style="background:#EEF4FF">🧭</div>
          <div>
            <div class="mob-cat-label" style="color:#0062CC">${allLabel}</div>
            <div class="mob-cat-desc">${allDesc}</div>
          </div>
          <span class="mob-arr">›</span>
        </a>`;
      return html;
    }

    _mobileCountriesContent() {
      var html = COUNTRY_LINKS.slice(0, 6).map(country => {
        return '<a href="' + this._countryHref(country.label) + '" class="mob-country-link">' + country.label + '</a>';
      }).join('');
      var lang = this._getLang();
      var allLabel = lang === 'sw' ? 'Nchi zote' : lang === 'fr' ? 'Tous les pays' : 'All countries';
      html += '<a href="' + this._countriesHref() + '" class="mob-country-link">' + allLabel + '</a>';
      return html;
    }

    _countryHref(name) {
      var lang = this._getLang();
      var overrides = {
        'Cabo Verde': 'cape-verde',
        'Central African Republic': lang === 'sw' ? 'central-african-republic' : 'central-africa',
        'Côte d\'Ivoire': 'cote-divoire',
        'DR Congo': lang === 'en' ? 'drc' : 'dr-congo',
        'Republic of the Congo': 'congo',
        'Congo': 'congo',
        'São Tomé and Príncipe': 'sao-tome',
        'São Tomé & Príncipe': 'sao-tome',
      };
      var slug = overrides[name] || String(name || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      var prefix = lang === 'fr' ? '/fr' : lang === 'sw' ? '/sw' : '';
      return slug ? prefix + '/' + slug + '/' : this._countriesHref();
    }

    _countrySearchItems(countries) {
      var source = Array.isArray(countries) && countries.length ? countries : COUNTRY_LINKS.map(function(country) {
        return { name: country.label };
      });
      return source.map(country => {
        var name = country.name || country.label || '';
        return {
          label: name,
          href: country.href || this._countryHref(name),
          meta: country.currency || '',
        };
      });
    }

    _loadCountryData() {
      return new Promise(resolve => {
        if (Array.isArray(window.AFRICAN_COUNTRIES)) {
          resolve(window.AFRICAN_COUNTRIES);
          return;
        }
        var src = '/assets/js/data/african-countries.js';
        var existing = document.querySelector('script[src="' + src + '"], script[src$="/assets/js/data/african-countries.js"]');
        var finish = () => resolve(Array.isArray(window.AFRICAN_COUNTRIES) ? window.AFRICAN_COUNTRIES : []);
        if (existing) {
          existing.addEventListener('load', finish, { once: true });
          existing.addEventListener('error', () => resolve([]), { once: true });
          setTimeout(finish, 500);
          return;
        }
        var script = document.createElement('script');
        script.src = src;
        script.onload = finish;
        script.onerror = () => resolve([]);
        document.head.appendChild(script);
      });
    }

    _mobileLangHTML() {
      var cur = this._getLang();
      var LANGS = [
        { code: 'en', label: 'English', flag: '🇬🇧' },
        { code: 'fr', label: 'Français', flag: '🇫🇷' },
        { code: 'sw', label: 'Kiswahili', flag: '🇰🇪' },
        { code: 'yo', label: 'Yorùbá', flag: '🇳🇬' },
        { code: 'ha', label: 'Hausa', flag: '🇳🇬' },
      ];
      var opts = LANGS.map(function(l) {
        var active = l.code === cur ? ' active' : '';
        var p = window.location.pathname;
        if (cur !== 'en') p = p.replace(new RegExp('^/' + cur + '(/|$)'), '/');
        var href = l.code !== 'en' ? '/' + l.code + (p.startsWith('/') ? '' : '/') + p : p;
        return '<a href="' + href + '" class="mob-lang-opt' + active + '">' + l.flag + ' ' + l.label + '</a>';
      }).join('');
      var langLabel = cur === 'fr' ? 'Langue' : cur === 'sw' ? 'Lugha' : 'Language';
      return '<div class="mob-lang-section"><div class="mob-section-label">' + langLabel + '</div><div class="mob-lang-row">' + opts + '</div></div>';
    }

    _escapeHtml(value) {
      return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    _cleanDisplayName(value, fallback) {
      const cleaned = String(value || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/[<>]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return cleaned || fallback || 'Dashboard';
    }

    _render() {
      var lang = this._getLang();
      var isFr = lang === 'fr';
      var isSw = lang === 'sw';
      var T = {
        homeHref:     isSw ? '/sw/'                         : isFr ? '/fr/'                                             : '/',
        tag:          isSw ? 'Jukwaa la Afrika'             : isFr ? 'La plateforme africaine'                          : "Africa's Everything Platform",
        allTools:     isSw ? 'Zana Zote'                    : isFr ? 'Tous les outils'                                  : 'All Tools',
        tools:        isSw ? 'Zana'                         : isFr ? 'Outils'                                           : 'Tools',
        countries:    isSw ? 'Nchi'                         : isFr ? 'Pays'                                             : 'Countries',
        countriesHref:isSw ? '/sw/nchi/'                    : isFr ? '/fr/countries/'                                  : '/countries/',
        business:     isSw ? 'Biashara'                     : isFr ? 'Business'                                         : 'For business',
        businessNote: isSw ? 'Widgets, API, ufadhili, na vikokotoo maalum' : isFr ? 'Widgets, API, sponsoring, calculateurs sur mesure' : 'Widgets, API, sponsorships, custom calculators, and media inventory',
        businessBrowse:isSw ? 'Fungua media kit ->'         : isFr ? 'Ouvrir le media kit ->'                           : 'Open media kit ->',
        businessBrowseHref:'/media-kit/',
        resources:    isSw ? 'Rasilimali'                   : isFr ? 'Ressources'                                       : 'Resources',
        resourcesHref:isSw ? '/sw/'                         : isFr ? '/fr/blog/'                                        : '/blog/',
        search:       isSw ? 'Tafuta'                       : isFr ? 'Recherche'                                        : 'Search',
        startByCountry:isSw ? 'Anza kwa nchi'               : isFr ? 'Commencer par pays'                               : 'Start by country',
        countrySearchPh:isSw ? 'Tafuta nchi...'             : isFr ? 'Rechercher un pays...'                            : 'Search countries...',
        salaryTax:    isSw ? 'Mshahara &amp; Kodi'          : isFr ? 'Salaire &amp; Impôts'                             : 'Salary &amp; Tax',
        salaryHref:   isSw ? '/sw/mshahara-na-kodi/'        : isFr ? '/fr/salary-tax/'                                  : '/salary-tax/',
        pdfTools:     isSw ? 'Zana za PDF'                  : isFr ? 'Outils PDF'                                       : 'PDF Tools',
        pdfHref:      isSw ? '/sw/hati-na-pdf/'             : isFr ? '/fr/document-pdf/'                                : '/document-pdf/',
        devTools:     isSw ? 'Zana za Dev'                  : isFr ? 'Outils Dev'                                       : 'Dev Tools',
        devHref:      isSw ? '/sw/zana-za-developer/'       : isFr ? '/fr/developer-tools/'                             : '/developer-tools/',
        african:      isSw ? 'Kiafrika'                     : isFr ? 'Africain'                                         : 'African',
        africanHref:  isFr ? '/fr/african/'                                     : '/african/',
        education:    isSw ? 'Elimu'                        : isFr ? 'Éducation'                                        : 'Education',
        educationHref:isSw ? '/sw/elimu/'                   : isFr ? '/fr/education/'                                   : '/education/',
        insurance:    isSw ? 'Bima'                         : isFr ? 'Santé &amp; Assurance'                            : 'Insurance',
        insuranceHref:isSw ? '/sw/bima/'                    : isFr ? '/fr/health-insurance/'                            : '/insurance/',
        countries54:  isSw ? '🌍 Nchi 54'                   : isFr ? '🌍 54 pays'                                       : '🌍 54 countries',
        signIn:       isSw ? 'Ingia'                        : isFr ? 'Connexion'                                        : 'Sign in',
        ariaNav:      isSw ? 'Urambazaji mkuu'              : isFr ? 'Navigation principale'                            : 'Main navigation',
        ariaMenu:     isSw ? 'Menyu ya urambazaji'          : isFr ? 'Menu de navigation'                               : 'Navigation menu',
        ariaSearch:   isSw ? 'Tafuta zana'                  : isFr ? 'Rechercher des outils'                            : 'Search tools',
        megaNote:     isSw ? '🌍 Nchi 54 za Afrika · bure · bila usajili'       : isFr ? '🌍 54 pays africains · gratuit · sans inscription': '🌍 54 African countries · free forever · no sign-up required',
        browseAll:    isSw ? 'Tazama zana zote →'           : isFr ? 'Voir tous les outils →'                           : 'Browse all tools →',
        browseHref:   isSw ? '/sw/zana-zote/'               : isFr ? '/fr/all-tools/'                                   : '/all-tools/',
        allCats:      isSw ? 'Makundi Yote'                 : isFr ? 'Toutes les catégories'                            : 'All Categories',
        searchPh:     isSw ? 'Tafuta zana...'               : isFr ? 'Rechercher des outils...'                         : 'Search tools...',
        mobSignIn:    isSw ? 'Ingia'                        : isFr ? 'Connexion'                                        : 'Sign In',
        proHref:      isFr ? '/fr/pro/'                     : '/pro/',
        proLabel:     isSw ? 'Pro'                          : isFr ? 'Pro'                                              : 'Pro',
        proUpgrade:   isSw ? 'Pata Pro'                     : isFr ? 'Passer Pro'                                       : 'Upgrade Pro',
        proWorkspace: isSw ? 'Pro Workspace'                : isFr ? 'Espace Pro'                                       : 'Pro Workspace',
        dashboardHref:isFr ? '/fr/dashboard/'               : '/dashboard/',
        authHref:     '/auth/?mode=login&next=' + encodeURIComponent(isFr ? '/fr/dashboard/' : '/dashboard/'),
        vaultHref:    isFr ? '/fr/dashboard/vault/'         : '/dashboard/vault/',
        mobNote:      isSw ? '🌍 Nchi 54 · bure · bila usajili'                 : isFr ? '🌍 54 pays · gratuit · sans inscription'          : '🌍 54 countries · always free · no sign-up required',
        srchEmpty:    isSw ? 'Zana 2,594+ za Afrika'          : isFr ? '2 594+ outils africains'                            : 'Search 2,594+ African tools',
        srchHint:     isSw ? 'Jaribu "PAYE", "PDF", "kodi", "BMI"…'            : isFr ? 'Essayez "PAYE", "salaire", "TVA"…'               : 'Try "PAYE", "PDF", "japa", "BMI"…',
      };
      var T_BY_LANG = {
        yo: {
          tag: 'Pẹpẹ irinṣẹ Afirika',
          allTools: 'Gbogbo irinṣẹ',
          tools: 'Irinṣẹ',
          countries: 'Orilẹ-ede',
          business: 'Iṣowo',
          resources: 'Ìmọ̀ràn',
          search: 'Wa',
          startByCountry: 'Bẹrẹ pẹ̀lú orilẹ-ede',
          countrySearchPh: 'Wa orilẹ-ede...',
          salaryTax: 'Owó iṣẹ́ &amp; Owo-ori',
          signIn: 'Wọlé',
          ariaNav: 'Ìrìnàjò àkọ́kọ́',
          ariaMenu: 'Menyu ìrìnàjò',
          ariaSearch: 'Wa irinṣẹ',
          megaNote: 'Orílẹ̀-èdè Afirika 54 · ọfẹ · kò sí ìforúkọsílẹ̀',
          browseAll: 'Wo gbogbo irinṣẹ ->',
          allCats: 'Gbogbo Ẹ̀ka',
          searchPh: 'Wa irinṣẹ...',
          mobSignIn: 'Wọlé',
          proLabel: 'Pro',
          proUpgrade: 'Ṣí Pro',
          proWorkspace: 'Pro Workspace',
          mobNote: 'Orílẹ̀-èdè 54 · ọfẹ · kò sí ìforúkọsílẹ̀',
          srchEmpty: 'Wa irinṣẹ Afirika 2,594+',
          srchHint: 'Gbìyànjú "PAYE", "PDF", "owo-ori"...'
        },
        ha: {
          tag: 'Dandalin kayan aikin Afirka',
          allTools: 'Dukkan kayan aiki',
          tools: 'Kayan aiki',
          countries: 'Kasashe',
          business: 'Kasuwanci',
          resources: 'Albarkatu',
          search: 'Bincike',
          startByCountry: 'Fara da kasa',
          countrySearchPh: 'Nemi kasa...',
          salaryTax: 'Albashi &amp; Haraji',
          signIn: 'Shiga',
          ariaNav: 'Babban kewayawa',
          ariaMenu: 'Menu na kewayawa',
          ariaSearch: 'Bincika kayan aiki',
          megaNote: 'Kasashen Afirka 54 · kyauta · babu rajista',
          browseAll: 'Duba duk kayan aiki ->',
          allCats: 'Dukkan Rukuni',
          searchPh: 'Bincika kayan aiki...',
          mobSignIn: 'Shiga',
          proLabel: 'Pro',
          proUpgrade: 'Bude Pro',
          proWorkspace: 'Pro Workspace',
          mobNote: 'Kasashe 54 · kyauta · babu rajista',
          srchEmpty: 'Bincika kayan aikin Afirka 2,594+',
          srchHint: 'Gwada "PAYE", "PDF", "haraji"...'
        }
      };
      if (T_BY_LANG[lang]) Object.assign(T, T_BY_LANG[lang]);

      this.shadowRoot.innerHTML = `
        <style>${CSS}</style>
        <nav role="navigation" aria-label="${T.ariaNav}">
          <div class="inner">
            <a href="${T.homeHref}" class="logo" aria-label="AfroTools home">
              ${MARK}
              <div>
                <span class="logo-name">AFRO<b>TOOLS</b></span>
                <span class="logo-tag">${T.tag}</span>
              </div>
            </a>

            <ul class="nav-links">
              <li>
                <button class="lnk" id="allBtn" type="button" aria-haspopup="true" aria-expanded="false">
                  ${T.tools}
                  <svg class="chev" viewBox="0 0 7 4" fill="none">
                    <polyline points="0.5,0.5 3.5,3.5 6.5,0.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </li>
              <li>
                <button class="lnk" id="countriesBtn" type="button" aria-haspopup="true" aria-expanded="false">
                  ${T.countries}
                  <svg class="chev" viewBox="0 0 7 4" fill="none">
                    <polyline points="0.5,0.5 3.5,3.5 6.5,0.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </li>
              <li><a href="${T.salaryHref}" class="lnk">${T.salaryTax}</a></li>
              <li><a href="${T.pdfHref}" class="lnk">PDF</a></li>
              <li>
                <button class="lnk" id="businessBtn" type="button" aria-haspopup="true" aria-expanded="false">
                  ${T.business}
                  <svg class="chev" viewBox="0 0 7 4" fill="none">
                    <polyline points="0.5,0.5 3.5,3.5 6.5,0.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </li>
              <li><a href="${T.resourcesHref}" class="lnk">${T.resources}</a></li>
            </ul>

            <div class="right">
              <div class="country-control-shell">
                <afro-country-selector variant="nav" redirect="country" label="Change country"></afro-country-selector>
              </div>
              ${this._langSwitcherHTML()}
              <button class="search-btn cp-trigger" id="searchBtn" type="button" aria-label="${T.ariaSearch}">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="8.5" cy="8.5" r="5.5"/><line x1="13" y1="13" x2="18" y2="18"/>
                </svg>
                <span class="search-btn-label">${T.search}</span>
                <span class="search-kbd cp-trigger-kbd">Ctrl K</span>
              </button>
              <a href="${T.proHref}" class="btn-pro" data-pro-nav="true">${T.proLabel}</a>
              <a href="${T.authHref}" class="btn-login">${T.signIn}</a>
              <button class="burger" type="button" aria-label="Open menu" aria-expanded="false">
                <span></span><span></span><span></span>
              </button>
            </div>
          </div>
        </nav>

        <div class="mega" id="mega" role="menu" aria-label="${T.allTools}">
          <div class="mega-inner tools-mega-grid">
            ${this._megaContent()}
          </div>
          <div class="mega-footer">
            <span class="mega-footer-note">${T.megaNote}</span>
            <a href="${T.browseHref}" class="mega-footer-lnk">${T.browseAll}</a>
          </div>
        </div>

        <div class="mega" id="countriesMega" role="menu" aria-label="${T.countries}">
          <div class="mega-inner">
            ${this._countriesContent()}
          </div>
          <div class="mega-footer">
            <span class="mega-footer-note">${T.countries} - 54 African countries</span>
            <a href="${T.countriesHref}" class="mega-footer-lnk">View all</a>
          </div>
        </div>

        <div class="mega" id="businessMega" role="menu" aria-label="${T.business}">
          <div class="mega-inner business-mega-grid">
            ${this._businessContent()}
          </div>
          <div class="mega-footer">
            <span class="mega-footer-note">${T.businessNote}</span>
            <a href="${T.businessBrowseHref}" class="mega-footer-lnk">${T.businessBrowse}</a>
          </div>
        </div>

        <div class="mob" role="dialog" aria-modal="true" aria-label="${T.ariaMenu}">
          <div class="mob-search-bar">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="8.5" cy="8.5" r="5.5"/><line x1="13" y1="13" x2="18" y2="18"/>
            </svg>
            <input class="mob-search-input" type="text" placeholder="${T.searchPh}" aria-label="${T.ariaSearch}" autocomplete="off"/>
          </div>
          <div class="mob-search-results" id="mobSearchResults" role="listbox" aria-label="Search results"></div>
          <div class="mob-country-block">
            <div class="mob-section-label">${T.startByCountry}</div>
            <div class="mob-country-search">
              <input id="mobileCountrySearchInput" class="mob-country-search-input" type="search" placeholder="${T.countrySearchPh}" autocomplete="off" aria-label="${T.startByCountry}">
            </div>
            <div class="mob-country-results" id="mobileCountrySearchResults" role="listbox" aria-label="${T.startByCountry}"></div>
            <div class="mob-country-grid">${this._mobileCountriesContent()}</div>
          </div>
          <div class="mob-business-block">
            <div class="mob-section-label">${T.business}</div>
            ${this._mobileBusinessContent()}
          </div>
          <div id="mobCategoriesWrap">
            <div class="mob-section-label">${T.allCats}</div>
            ${this._mobileContent()}
          </div>
          ${this._mobileLangHTML()}
          <div class="mob-country-context">
            <afro-country-selector variant="mobile" redirect="country" diaspora label="${T.startByCountry}"></afro-country-selector>
          </div>
          <div class="mob-footer">
            <a href="${T.proHref}" class="mob-pro-link" data-pro-nav="mobile">${T.proLabel}</a>
            <a href="${T.authHref}" class="mob-login">${T.mobSignIn}</a>
            <a href="${T.vaultHref}" class="mob-vault-link" style="display:none;padding:10px 13px;border-radius:8px;font-size:0.85rem;font-weight:600;text-decoration:none;color:#0062CC;border:1.5px solid #0062CC;text-align:center;">📁 My Vault</a>
            <a href="/tools/afropoints/" class="mob-points-link" style="display:none;padding:10px 13px;border-radius:8px;font-size:0.85rem;font-weight:600;text-decoration:none;color:#F59E0B;border:1.5px solid rgba(245,158,11,0.3);background:rgba(245,158,11,0.06);text-align:center;">🎯 AfroPoints</a>
            <p class="mob-note">${T.mobNote}</p>
          </div>
        </div>

`;
    }

    _bind() {
      const sr     = this.shadowRoot;
      const nav    = sr.querySelector('nav');
      const allBtn = sr.querySelector('#allBtn');
      const mega   = sr.querySelector('#mega');
      const countriesBtn = sr.querySelector('#countriesBtn');
      const countriesMega = sr.querySelector('#countriesMega');
      const businessBtn = sr.querySelector('#businessBtn');
      const businessMega = sr.querySelector('#businessMega');
      const searchBtn = sr.querySelector('#searchBtn');
      const burger = sr.querySelector('.burger');
      const mob    = sr.querySelector('.mob');

      // Scroll shadow
      if (this._scrollFn) window.removeEventListener('scroll', this._scrollFn);
      this._scrollFn = () => nav.classList.toggle('scrolled', window.scrollY > 4);
      window.addEventListener('scroll', this._scrollFn, { passive: true });
      this._scrollFn();

      const openMega  = () => {
        this._megaOpen = true;
        closeCountries();
        closeBusiness();
        allBtn?.classList.add('open');
        mega?.classList.add('open');
        allBtn?.setAttribute('aria-expanded','true');
      };
      const closeMega = () => {
        this._megaOpen = false;
        allBtn?.classList.remove('open');
        mega?.classList.remove('open');
        allBtn?.setAttribute('aria-expanded','false');
      };
      const openCountries = () => {
        this._countriesOpen = true;
        closeMega();
        closeBusiness();
        countriesBtn?.classList.add('open');
        countriesMega?.classList.add('open');
        countriesBtn?.setAttribute('aria-expanded','true');
      };
      const closeCountries = () => {
        this._countriesOpen = false;
        countriesBtn?.classList.remove('open');
        countriesMega?.classList.remove('open');
        countriesBtn?.setAttribute('aria-expanded','false');
      };
      const openBusiness = () => {
        this._businessOpen = true;
        closeMega();
        closeCountries();
        businessBtn?.classList.add('open');
        businessMega?.classList.add('open');
        businessBtn?.setAttribute('aria-expanded','true');
      };
      const closeBusiness = () => {
        this._businessOpen = false;
        businessBtn?.classList.remove('open');
        businessMega?.classList.remove('open');
        businessBtn?.setAttribute('aria-expanded','false');
      };
      const closeMenus = () => { closeMega(); closeCountries(); closeBusiness(); };
      const resetMobileSearch = () => {
        const mobSearchInput = sr.querySelector('.mob-search-input');
        const mobSearchResults = sr.querySelector('#mobSearchResults');
        const mobCategoriesWrap = sr.querySelector('#mobCategoriesWrap');
        const mobCountryBlock = sr.querySelector('.mob-country-block');
        const mobBusinessBlock = sr.querySelector('.mob-business-block');
        const mobileCountrySearchInput = sr.querySelector('#mobileCountrySearchInput');
        const mobileCountrySearchResults = sr.querySelector('#mobileCountrySearchResults');
        if (mobSearchInput) mobSearchInput.value = '';
        if (mobSearchResults) mobSearchResults.innerHTML = '';
        if (mobCategoriesWrap) mobCategoriesWrap.style.display = '';
        if (mobCountryBlock) mobCountryBlock.style.display = '';
        if (mobBusinessBlock) mobBusinessBlock.style.display = '';
        if (mobileCountrySearchInput) mobileCountrySearchInput.value = '';
        if (mobileCountrySearchResults) mobileCountrySearchResults.innerHTML = '';
      };
      const setMenuOpen = (isOpen) => {
        this._menuOpen = isOpen;
        burger?.classList.toggle('open', this._menuOpen);
        mob?.classList.toggle('open', this._menuOpen);
        burger?.setAttribute('aria-expanded', String(this._menuOpen));
        if (this._menuOpen) {
          closeMenus();
          this._lockBodyScroll();
          return;
        }
        this._unlockBodyScroll();
        resetMobileSearch();
      };

      // Click toggle
      allBtn?.addEventListener('click', e => { e.stopPropagation(); this._megaOpen ? closeMega() : openMega(); });
      countriesBtn?.addEventListener('click', e => { e.stopPropagation(); this._countriesOpen ? closeCountries() : openCountries(); });
      businessBtn?.addEventListener('click', e => { e.stopPropagation(); this._businessOpen ? closeBusiness() : openBusiness(); });
      searchBtn?.addEventListener('click', e => {
        e.preventDefault();
        if (typeof window.__openCommandPalette === 'function') {
          window.__openCommandPalette();
          return;
        }
        window.location.href = '/search/';
      });

      // Hover — keep open while moving between button and mega
      let hoverTimer;
      const navEl = allBtn?.closest('li');
      navEl?.addEventListener('mouseenter', () => { clearTimeout(hoverTimer); openMega(); });
      navEl?.addEventListener('mouseleave', () => { hoverTimer = setTimeout(closeMega, 200); });
      mega?.addEventListener('mouseenter', () => clearTimeout(hoverTimer));
      mega?.addEventListener('mouseleave', () => { hoverTimer = setTimeout(closeMega, 200); });

      let countriesHoverTimer;
      const countriesNavEl = countriesBtn?.closest('li');
      countriesNavEl?.addEventListener('mouseenter', () => { clearTimeout(countriesHoverTimer); openCountries(); });
      countriesNavEl?.addEventListener('mouseleave', () => { countriesHoverTimer = setTimeout(closeCountries, 200); });
      countriesMega?.addEventListener('mouseenter', () => clearTimeout(countriesHoverTimer));
      countriesMega?.addEventListener('mouseleave', () => { countriesHoverTimer = setTimeout(closeCountries, 200); });

      let businessHoverTimer;
      const businessNavEl = businessBtn?.closest('li');
      businessNavEl?.addEventListener('mouseenter', () => { clearTimeout(businessHoverTimer); openBusiness(); });
      businessNavEl?.addEventListener('mouseleave', () => { businessHoverTimer = setTimeout(closeBusiness, 200); });
      businessMega?.addEventListener('mouseenter', () => clearTimeout(businessHoverTimer));
      businessMega?.addEventListener('mouseleave', () => { businessHoverTimer = setTimeout(closeBusiness, 200); });

      // Tool sub-panels: disabled — category cards navigate directly to their pages

      // Click outside
      if (this._outsideFn) document.removeEventListener('click', this._outsideFn);
      this._outsideFn = e => { if (!this.contains(e.target)) closeMenus(); };
      document.addEventListener('click', this._outsideFn);

      // Language switcher toggle
      const langBtn = sr.querySelector('#langBtn');
      const langDrop = sr.querySelector('#langDrop');
      langBtn?.addEventListener('click', e => {
        e.stopPropagation();
        langDrop.classList.toggle('open');
      });
      document.addEventListener('click', () => langDrop?.classList.remove('open'));

      // Escape
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          closeMenus();
          langDrop?.classList.remove('open');
          if (this._menuOpen) setMenuOpen(false);
        }
      });

      // Mobile hamburger
      burger?.addEventListener('click', () => {
        setMenuOpen(!this._menuOpen);
      });

      mob?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        setMenuOpen(false);
      }));

      // ── ACTIVE PAGE INDICATOR ──
      const path = window.location.pathname;
      sr.querySelectorAll('.nav-links .lnk[href]').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href !== '/' && path.startsWith(href)) {
          link.classList.add('active');
        }
      });
      const activePath = path.replace(/^\/(fr|sw)(?=\/)/, '');
      if (/^\/(countries|nchi|nigeria|kenya|ghana|south-africa|egypt|tanzania|rwanda|senegal)(\/|$)/.test(activePath)) {
        countriesBtn?.classList.add('active');
      }
      if (/^\/(all-tools|zana-zote|categories|tools|zana)(\/|$)/.test(activePath)) {
        allBtn?.classList.add('active');
      }
      if (/^\/(widgets|api|sponsored-tools|custom-calculators|media-kit|business-enquiry)(\/|$)/.test(activePath)) {
        businessBtn?.classList.add('active');
      }

      // ── RECENTLY USED TOOLS (localStorage) ──
      const RECENT_KEY = 'aft_recent_tools';
      const MAX_RECENT = 5;

      const getRecent = () => {
        try {
          return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
        } catch { return []; }
      };

      const saveRecent = (tool) => {
        try {
          let recent = getRecent().filter(t => t.href !== tool.href);
          recent.unshift(tool);
          if (recent.length > MAX_RECENT) recent = recent.slice(0, MAX_RECENT);
          localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
        } catch {}
      };

      // Track page visit as recently used
      if (typeof AFRO_TOOLS !== 'undefined' && Array.isArray(AFRO_TOOLS)) {
        const currentTool = AFRO_TOOLS.find(t => t.status === 'live' && path.startsWith(t.href));
        if (currentTool) {
          saveRecent({ name: currentTool.name, href: currentTool.href, icon: currentTool.icon || '🔧' });
        }
      }

      // ── SEARCH (desktop handled by command-palette.js) ──
      const mobSearchInput   = sr.querySelector('.mob-search-input');
      const mobSearchResults = sr.querySelector('#mobSearchResults');
      const mobCategoriesWrap = sr.querySelector('#mobCategoriesWrap');
      const mobCountryBlock = sr.querySelector('.mob-country-block');
      const mobBusinessBlock = sr.querySelector('.mob-business-block');
      const countrySearchInput = sr.querySelector('#countrySearchInput');
      const countrySearchResults = sr.querySelector('#countrySearchResults');
      const mobileCountrySearchInput = sr.querySelector('#mobileCountrySearchInput');
      const mobileCountrySearchResults = sr.querySelector('#mobileCountrySearchResults');

      let _activeIdx = -1;

      const getTools = () => {
        if (typeof AFRO_TOOLS !== 'undefined' && Array.isArray(AFRO_TOOLS)) {
          var pageLang = document.documentElement.lang || 'en';
          return AFRO_TOOLS.filter(t => t.status === 'live' && (t.lang || 'en') === pageLang);
        }
        return null;
      };

      const escapeHtml = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

      const highlightMatch = (text, query) => {
        if (!query) return escapeHtml(text);
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return escapeHtml(text).replace(new RegExp('(' + escaped + ')', 'gi'), '<mark>$1</mark>');
      };

      const getCategoryLabel = (catId) => {
        const cat = NAV_ITEMS.find(c => c.id === catId);
        return cat ? cat.label : catId;
      };

      const searchTools = (query) => {
        const tools = getTools();
        if (!tools) return null;
        if (!query || query.length < 1) return [];
        const q = query.toLowerCase().trim();
        const scored = [];
        for (const t of tools) {
          const nameL = t.name.toLowerCase();
          const descL = t.desc.toLowerCase();
          let score = 0;
          if (nameL === q) score = 100;
          else if (nameL.startsWith(q)) score = 80;
          else if (nameL.includes(q)) score = 60;
          else if (descL.includes(q)) score = 30;
          else {
            const words = q.split(/\s+/);
            const allMatch = words.every(w => nameL.includes(w) || descL.includes(w));
            if (allMatch) score = 20;
          }
          if (score > 0) scored.push({ tool: t, score });
        }
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, 8).map(s => s.tool);
      };

      const normalizeCountryQuery = value => String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

      const renderCountryResults = (input, container, limit) => {
        if (!input || !container) return;
        var query = input.value.trim();
        if (!query) {
          container.innerHTML = '';
          return;
        }
        container.innerHTML = '<div class="country-search-result" aria-live="polite">Loading countries...</div>';
        this._loadCountryData().then(countries => {
          var q = normalizeCountryQuery(query);
          var results = this._countrySearchItems(countries).filter(country => {
            return normalizeCountryQuery(country.label + ' ' + country.meta).indexOf(q) !== -1;
          }).slice(0, limit || 6);
          if (!results.length) {
            container.innerHTML = '<a class="country-search-result" href="' + this._countriesHref() + '"><span>No exact country found</span><span class="country-search-meta">View all</span></a>';
            return;
          }
          container.innerHTML = results.map(country => {
            return '<a class="country-search-result" role="option" href="' + country.href + '"><span>' + escapeHtml(country.label) + '</span><span class="country-search-meta">' + escapeHtml(country.meta || 'Open') + '</span></a>';
          }).join('');
        });
      };

      const bindCountrySearch = (input, container, limit) => {
        if (!input || !container) return;
        input.addEventListener('focus', () => this._loadCountryData());
        input.addEventListener('input', () => renderCountryResults(input, container, limit));
        input.addEventListener('keydown', e => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          var first = container.querySelector('a');
          window.location.href = first ? first.href : this._countriesHref();
        });
      };

      bindCountrySearch(countrySearchInput, countrySearchResults, 6);
      bindCountrySearch(mobileCountrySearchInput, mobileCountrySearchResults, 5);

      // ── Search capture: send queries to /api/capture-search for product intelligence ──
      let _captureTimer = null;
      let _captureCount = 0;
      const _captureSessionId = (() => {
        try {
          let sid = sessionStorage.getItem('_afro_search_sid');
          if (!sid) { sid = crypto.randomUUID(); sessionStorage.setItem('_afro_search_sid', sid); }
          return sid;
        } catch { return null; }
      })();

      const captureSearch = (query, resultsCount, source) => {
        clearTimeout(_captureTimer);
        if (!query || query.length < 2 || _captureCount >= 20) return;
        _captureTimer = setTimeout(() => {
          _captureCount++;
          try {
            const payload = JSON.stringify({
              query: query.slice(0, 200),
              results_count: resultsCount,
              source: source || 'navbar',
              page_url: location.href,
              session_id: _captureSessionId
            });
            if (navigator.sendBeacon) {
              navigator.sendBeacon('/api/capture-search', payload);
            }
          } catch {}
        }, 500);
      };

      const renderResults = (tools, query, container) => {
        if (tools === null) {
          container.innerHTML = '<div class="search-empty"><div class="search-empty-icon">⏳</div><div class="search-empty-text">Loading tools…</div><div class="search-empty-hint">Tool registry not loaded yet</div></div>';
          return;
        }
        if (!query || query.length < 1) {
          // Show recently used tools if any
          const recent = getRecent();
          if (recent.length > 0) {
            container.innerHTML = '<div class="search-section-label">Recently Used <button class="recent-clear" id="clearRecent">Clear</button></div>' +
              recent.map((t, i) => `
                <a href="${t.href}" class="search-result${i === 0 ? ' active' : ''}" data-idx="${i}" role="option" aria-selected="${i === 0}">
                  <div class="search-result-icon">${escapeHtml(t.icon || '🔧')}</div>
                  <div>
                    <div class="search-result-name">${escapeHtml(t.name)}</div>
                  </div>
                </a>`).join('') +
              '<div class="search-section-label" style="padding-top:16px">All Tools</div>' +
              '<div class="search-empty" style="padding:16px"><div class="search-empty-hint">Type to search 2,594+ tools</div></div>';
            _activeIdx = 0;
            container.querySelector('#clearRecent')?.addEventListener('click', e => {
              e.preventDefault(); e.stopPropagation();
              try { localStorage.removeItem(RECENT_KEY); } catch {}
              container.innerHTML = '<div class="search-empty"><div class="search-empty-icon">🔍</div><div class="search-empty-text">Search 2,594+ African tools</div><div class="search-empty-hint">Try "PAYE", "PDF", "japa", "BMI"…</div></div>';
            });
            return;
          }
          container.innerHTML = '<div class="search-empty"><div class="search-empty-icon">🔍</div><div class="search-empty-text">Search 2,594+ African tools</div><div class="search-empty-hint">Try "PAYE", "PDF", "japa", "BMI"…</div></div>';
          return;
        }
        if (tools.length === 0) {
          container.innerHTML = '<div class="search-empty"><div class="search-empty-icon">😔</div><div class="search-empty-text">No tools found</div><div class="search-empty-hint">Try a different search term</div></div>';
          return;
        }
        _activeIdx = 0;
        container.innerHTML = tools.map((t, i) => `
          <a href="${t.href}" class="search-result${i === 0 ? ' active' : ''}" data-idx="${i}" role="option" aria-selected="${i === 0}">
            <div class="search-result-icon">${escapeHtml(t.icon || '🔧')}</div>
            <div>
              <div class="search-result-name">${highlightMatch(t.name, query)}</div>
              <div class="search-result-desc">${escapeHtml(t.desc)}</div>
              <div class="search-result-cat">${escapeHtml(getCategoryLabel(t.category))}</div>
            </div>
          </a>`).join('');
      };

      // ── MOBILE SEARCH (desktop search handled by command-palette.js) ──
      let _mobDebounce;
      mobSearchInput?.addEventListener('input', () => {
        clearTimeout(_mobDebounce);
        _mobDebounce = setTimeout(() => {
          const q = mobSearchInput.value.trim();
          if (!q) {
            mobSearchResults.innerHTML = '';
            mobCategoriesWrap.style.display = '';
            if (mobCountryBlock) mobCountryBlock.style.display = '';
            if (mobBusinessBlock) mobBusinessBlock.style.display = '';
            return;
          }
          const results = searchTools(q);
          if (results === null) {
            mobSearchResults.innerHTML = '<div class="mob-search-empty">Loading tools…</div>';
            mobCategoriesWrap.style.display = 'none';
            if (mobCountryBlock) mobCountryBlock.style.display = 'none';
            if (mobBusinessBlock) mobBusinessBlock.style.display = 'none';
            return;
          }
          if (results.length === 0) {
            mobSearchResults.innerHTML = '<div class="mob-search-empty">No tools found</div>';
            mobCategoriesWrap.style.display = 'none';
            if (mobCountryBlock) mobCountryBlock.style.display = 'none';
            if (mobBusinessBlock) mobBusinessBlock.style.display = 'none';
            // Analytics: track mobile search no results
            if (q && q.length >= 2 && window.AfroTools?.analytics) {
              window.AfroTools.analytics.trackSearch(q, 0, 'navbar');
              window.AfroTools.analytics.trackSearchNoResults(q, 'navbar');
            }
            captureSearch(q, 0, 'navbar');
            return;
          }
          mobCategoriesWrap.style.display = 'none';
          if (mobCountryBlock) mobCountryBlock.style.display = 'none';
          if (mobBusinessBlock) mobBusinessBlock.style.display = 'none';
          mobSearchResults.innerHTML = results.map(t => `
            <a href="${t.href}" class="search-result" role="option">
              <div class="search-result-icon">${escapeHtml(t.icon || '🔧')}</div>
              <div>
                <div class="search-result-name">${highlightMatch(t.name, q)}</div>
                <div class="search-result-desc">${escapeHtml(t.desc)}</div>
              </div>
            </a>`).join('');
          // Analytics: track mobile search
          if (q && q.length >= 2 && window.AfroTools?.analytics) {
            window.AfroTools.analytics.trackSearch(q, results.length, 'navbar');
          }
          captureSearch(q, results.length, 'navbar');
        }, 100);
      });

      // Clear mobile search when closing drawer
      // ── AUTH STATE: update Sign-in button when user logs in/out ──
      const loginBtn = sr.querySelector('.btn-login');
      const proBtn = sr.querySelector('.btn-pro');
      const mobLoginBtn = sr.querySelector('.mob-login');
      const mobProLink = sr.querySelector('.mob-pro-link');
      const mobVaultLink = sr.querySelector('.mob-vault-link');
      const mobPointsLink = sr.querySelector('.mob-points-link');

      var _apBadgeLoaded = false;
      var _apBadgeRequestToken = '';
      var _proNavRequestToken = 0;
      const readNavJson = (key) => {
        try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch(e) { return null; }
      };
      const isExpiredProValue = (value) => {
        if (!value) return false;
        var time = Date.parse(value);
        return !Number.isNaN(time) && time <= Date.now();
      };
      const sameNavUser = (base, extra) => {
        if (!base || !extra) return false;
        if (base.id && extra.id && base.id === extra.id) return true;
        if (base.email && extra.email && String(base.email).toLowerCase() === String(extra.email).toLowerCase()) return true;
        return false;
      };
      const mergeCachedProUser = (user, status) => {
        if (!user || !user.id) return null;
        var merged = Object.assign({}, user);
        var profile = status && status.profile || status && status.user || null;
        if (profile && sameNavUser(user, profile)) {
          merged = Object.assign(merged, profile, {
            tier: profile.subscription_tier || profile.tier || merged.tier || 'free',
            subscription_tier: profile.subscription_tier || profile.tier || merged.subscription_tier || merged.tier || 'free',
            subscription_expires_at: profile.subscription_expires_at || merged.subscription_expires_at || null
          });
        }
        var cachedProfile = readNavJson('afro_profile_cache');
        if (cachedProfile && cachedProfile.user && sameNavUser(user, cachedProfile.user)) {
          var cachedUser = cachedProfile.user;
          merged = Object.assign(merged, cachedUser, {
            tier: cachedUser.subscription_tier || cachedUser.tier || merged.tier || 'free',
            subscription_tier: cachedUser.subscription_tier || cachedUser.tier || merged.subscription_tier || merged.tier || 'free',
            subscription_expires_at: cachedUser.subscription_expires_at || merged.subscription_expires_at || null
          });
        }
        var cachedStatus = readNavJson('afro_pro_status_cache');
        var cacheFresh = cachedStatus && cachedStatus.cachedAt && Date.now() - Number(cachedStatus.cachedAt) < 5 * 60 * 1000;
        var cacheMatches = cachedStatus && (!cachedStatus.email || String(cachedStatus.email).toLowerCase() === String(user.email || '').toLowerCase());
        if (cacheFresh && cacheMatches) {
          merged.tier = cachedStatus.tier || merged.tier;
          merged.subscription_tier = cachedStatus.tier || merged.subscription_tier || merged.tier;
          merged.subscription_expires_at = cachedStatus.expiresAt || merged.subscription_expires_at || null;
          if (cachedStatus.isPro && !isExpiredProValue(merged.subscription_expires_at)) {
            merged.tier = merged.tier || 'pro';
            merged.subscription_tier = merged.subscription_tier || 'pro';
          }
        }
        return merged;
      };
      const isProUser = (user) => {
        var tier = String((user && (user.subscription_tier || user.tier || user.plan)) || '').toLowerCase();
        var role = String((user && user.role) || '').toLowerCase();
        var expiry = user && (user.subscription_expires_at || user.pro_expires_at || user.expires_at);
        return (role === 'admin' || role === 'owner' || ['pro', 'premium', 'team', 'business', 'enterprise', 'lifetime', 'trialing'].indexOf(tier) !== -1) && !isExpiredProValue(expiry);
      };
      const setProNav = (user, status) => {
        user = mergeCachedProUser(user, status);
        var _lang = this._getLang();
        var _proHref = _lang === 'fr' ? '/fr/pro/' : '/pro/';
        var _workspaceHref = _lang === 'fr' ? '/fr/pro/' : '/pro/workspace/';
        var _isPro = isProUser(user);
        var _hasUser = !!(user && user.id);
        var _label = _isPro
          ? (_lang === 'fr' ? 'Espace Pro' : 'Pro Workspace')
          : _hasUser
            ? (_lang === 'sw' ? 'Pata Pro' : _lang === 'fr' ? 'Passer Pro' : 'Upgrade Pro')
            : 'Pro';
        var _href = _isPro ? _workspaceHref : _proHref;
        if (proBtn) {
          proBtn.textContent = _label;
          proBtn.href = _href;
          proBtn.className = 'btn-pro' + (_isPro ? ' is-pro' : _hasUser ? ' is-free' : '');
          proBtn.setAttribute('aria-label', _isPro ? 'Open AfroTools Pro Workspace' : 'Open AfroTools Pro plans');
        }
        if (mobProLink) {
          mobProLink.textContent = _isPro ? _label : (_hasUser ? _label : 'AfroTools Pro');
          mobProLink.href = _href;
          mobProLink.className = 'mob-pro-link' + (_isPro ? ' is-pro' : _hasUser ? ' is-free' : '');
          mobProLink.setAttribute('aria-label', _isPro ? 'Open AfroTools Pro Workspace' : 'Open AfroTools Pro plans');
        }
      };
      const refreshProNavFromGate = (user) => {
        if (!user || !user.id || !window.AfroProGate || typeof window.AfroProGate.getStatus !== 'function') return;
        var requestToken = ++_proNavRequestToken;
        window.AfroProGate.getStatus({ fresh: false }).then(function(status) {
          if (requestToken !== _proNavRequestToken) return;
          if (!window.AfroAuth || !AfroAuth.isLoggedIn || !AfroAuth.isLoggedIn()) return;
          var activeUser = AfroAuth.getUser ? AfroAuth.getUser() : user;
          if (!sameNavUser(user, activeUser)) return;
          setProNav(activeUser, status);
        }).catch(function() {});
      };
      const resetSignedOutAuthUI = () => {
        _apBadgeLoaded = false;
        _apBadgeRequestToken = '';
        sr.querySelectorAll('.ap-nav-badge').forEach(function(el) { el.remove(); });
        setProNav(null);
        if (mobVaultLink) mobVaultLink.style.display = 'none';
        if (mobPointsLink) {
          mobPointsLink.style.display = 'none';
          mobPointsLink.textContent = '🎯 AfroPoints';
        }
      };
      const clearRejectedAuth = (reason) => {
        if (window.AfroAuthSessionBridge && typeof window.AfroAuthSessionBridge.clear === 'function') {
          window.AfroAuthSessionBridge.clear(reason);
          return;
        }
        try {
          localStorage.removeItem('afro_auth_v2');
          localStorage.removeItem('afro_session_v3');
          localStorage.removeItem('afro_profile_cache');
        } catch(e) {}
        window.dispatchEvent(new CustomEvent('afro-auth-change', { detail: { user: null, authenticated: false, reason: reason || 'session-rejected' } }));
      };
      const updateAuthUI = () => {
        var _lang = this._getLang();
        var _dashboardHref = _lang === 'fr' ? '/fr/dashboard/' : '/dashboard/';
        var _authHref = '/auth/?mode=login&next=' + encodeURIComponent(_dashboardHref);
        var _dashboardLabel = _lang === 'fr' ? 'Tableau de bord' : 'Dashboard';
        setProNav(null);
        if (typeof AfroAuth === 'undefined' || !AfroAuth.isLoggedIn || !AfroAuth.isLoggedIn()) {
          resetSignedOutAuthUI();
          // Not logged in — show Sign in (i18n)
          var _signLabel = _lang === 'sw' ? 'Ingia' : _lang === 'fr' ? 'Connexion' : 'Sign in';
          if (loginBtn) {
            loginBtn.className = 'btn-login';
            loginBtn.textContent = _signLabel;
            loginBtn.href = _authHref;
            loginBtn.removeAttribute('aria-label');
            loginBtn.removeAttribute('title');
            loginBtn.onclick = function(e) { if (typeof AfroAuth !== 'undefined' && AfroAuth.openModal) { e.preventDefault(); AfroAuth.openModal(); } };
          }
          if (mobLoginBtn) {
            mobLoginBtn.textContent = _signLabel;
            mobLoginBtn.href = _authHref;
            mobLoginBtn.onclick = function(e) { if (typeof AfroAuth !== 'undefined' && AfroAuth.openModal) { e.preventDefault(); AfroAuth.openModal(); } };
          }
          return;
        }
        const user = AfroAuth.getUser();
        setProNav(user);
        refreshProNavFromGate(user);
        const displayName = this._cleanDisplayName(user && user.name, _dashboardLabel);
        const name = displayName.split(' ')[0] || _dashboardLabel;
        const safeName = this._escapeHtml(name);
        const initial = this._escapeHtml((name[0] || 'D').toUpperCase());
        // Desktop: show avatar initial + first name
        if (loginBtn) {
          loginBtn.className = 'btn-login is-user';
          loginBtn.href = _dashboardHref;
          loginBtn.onclick = null;
          loginBtn.setAttribute('aria-label', displayName + ' - ' + _dashboardLabel);
          loginBtn.setAttribute('title', displayName + ' - ' + _dashboardLabel);
          loginBtn.innerHTML = '<span class="nav-user-avatar" aria-hidden="true">' + initial + '</span><span class="nav-user-name user-menu-name">' + safeName + '</span>';
        }
        // AfroPoints badge — show points balance next to avatar (once only)
        if (!_apBadgeLoaded) {
          _apBadgeLoaded = true;
          try {
            var token = AfroAuth.getSessionToken ? AfroAuth.getSessionToken() : null;
            if (token) {
              _apBadgeRequestToken = token;
              fetch('/.netlify/functions/afropoints-profile', { headers: { Authorization: 'Bearer ' + token } })
                .then(function(r) {
                  if (r.status === 401 || r.status === 403) {
                    resetSignedOutAuthUI();
                    clearRejectedAuth('afropoints-profile-rejected');
                    return null;
                  }
                  return r.json();
                })
                .then(function(p) {
                  if (!p || p.error || !(p.current_balance >= 0)) return;
                  var activeToken = null;
                  try { activeToken = AfroAuth.getSessionToken ? AfroAuth.getSessionToken() : null; } catch(e) {}
                  if (!AfroAuth.isLoggedIn || !AfroAuth.isLoggedIn() || activeToken !== _apBadgeRequestToken) return;
                  sr.querySelectorAll('.ap-nav-badge').forEach(function(el) { el.remove(); });
                  var badge = document.createElement('a');
                  badge.href = '/tools/afropoints/';
                  badge.className = 'ap-nav-badge';
                  badge.title = 'AfroPoints Balance';
                  var pts = p.current_balance || 0;
                  var display = pts >= 10000 ? (pts / 1000).toFixed(1) + 'k' : pts.toLocaleString();
                  badge.textContent = '🎯 ' + display;
                  if (p.current_streak > 0) badge.textContent += ' 🔥';
                  if (loginBtn && loginBtn.parentNode) loginBtn.parentNode.insertBefore(badge, loginBtn.nextSibling);
                  // Update mobile points link with balance
                  if (mobPointsLink) mobPointsLink.textContent = '🎯 AfroPoints — ' + display + (p.current_streak > 0 ? ' 🔥' : '');
                }).catch(function() {});
            }
          } catch(e) {}
        }
        // Mobile: show name + vault link
        if (mobLoginBtn) {
          mobLoginBtn.href = _dashboardHref;
          mobLoginBtn.onclick = null;
          mobLoginBtn.textContent = name + ' \u2014 ' + _dashboardLabel;
        }
        if (mobVaultLink) mobVaultLink.style.display = '';
        if (mobPointsLink) mobPointsLink.style.display = '';
      };

      // Run on initial load (auth may already be ready)
      const tryInitialAuth = () => {
        if (typeof AfroAuth !== 'undefined' && AfroAuth.isLoggedIn) {
          updateAuthUI();
        }
      };
      // Check immediately and also after a short delay (auth script may not be loaded yet)
      tryInitialAuth();
      setTimeout(tryInitialAuth, 500);
      setTimeout(tryInitialAuth, 1500);

      // Listen for auth state changes
      window.addEventListener('afro-auth-change', updateAuthUI);
      window.addEventListener('afro-pro-gate-ready', updateAuthUI);
      window.addEventListener('dashboard-auth-state-change', function(event) {
        var state = event && event.detail && event.detail.state;
        if (state === 'signedOut' || state === 'sessionError') {
          resetSignedOutAuthUI();
          clearRejectedAuth('dashboard-' + state);
        }
      });
    }

    _lockBodyScroll() {
      if (this._bodyLocked) return;
      this._lockedScrollY = window.scrollY || window.pageYOffset || 0;
      document.body.style.position = 'fixed';
      document.body.style.top = '-' + this._lockedScrollY + 'px';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      this._bodyLocked = true;
    }

    _unlockBodyScroll() {
      if (!this._bodyLocked) return;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, this._lockedScrollY || 0);
      this._bodyLocked = false;
    }
  }

  function _globalNavLang() {
    var segs = window.location.pathname.split('/');
    var first = segs[1];
    if (['fr','sw','yo','ha'].indexOf(first) !== -1) return first;
    return document.documentElement.lang || 'en';
  }

  function _localizedGlobalNavItems() {
    var lang = _globalNavLang();
    if (lang !== 'fr' && lang !== 'sw' && lang !== 'yo' && lang !== 'ha') return NAV_ITEMS;
    return NAV_ITEMS.map(function(item) {
      var copy = Object.assign({}, item);
      if (lang === 'fr') {
        if (item.hrefFr) copy.href = item.hrefFr;
        if (item.labelFr) copy.label = item.labelFr;
        if (item.descFr) copy.desc = item.descFr;
        if (item.toolsFr) copy.tools = item.toolsFr;
      } else if (lang === 'sw') {
        var swHref = SW_CATEGORY_HREFS[item.id] || item.hrefSw;
        if (swHref) copy.href = swHref;
        if (item.labelSw) copy.label = item.labelSw;
        if (item.descSw) copy.desc = item.descSw;
        if (item.toolsSw) copy.tools = item.toolsSw;
      } else if (lang === 'yo' || lang === 'ha') {
        copy.label = localizedItemText(item, 'label', lang);
        copy.desc = localizedItemText(item, 'desc', lang);
      }
      return copy;
    });
  }

  /* Expose localized NAV_ITEMS globally for command palette + other consumers */
  window.__AFRO_NAV_ITEMS = _localizedGlobalNavItems();
  window.__AFRO_BUSINESS_NAV_ITEMS = BUSINESS_LINKS.slice();

  if (!customElements.get('afro-navbar')) {
    customElements.define('afro-navbar', AfroNavbar);
  }

  (function _countrySelectorLoader() {
    if (customElements.get('afro-country-selector')) return;
    if (document.querySelector('script[src*="country-selector.js"]')) return;
    var s = document.createElement('script');
    s.id = 'afro-country-selector-js';
    s.src = '/assets/js/components/country-selector.js?v=1';
    s.defer = true;
    document.head.appendChild(s);
  })();

  /* ── LAZY-LOAD AUTH SYSTEM (every page gets login/signup capability) ── */
  setTimeout(function() {
    function _authLS(src, cb) {
      if (document.querySelector('script[src*="' + src.split('/').pop() + '"]')) { if (cb) cb(); return; }
      var s = document.createElement('script');
      s.src = src;
      s.onload = function() { if (cb) cb(); };
      s.onerror = function() { if (cb) cb(); };
      document.body.appendChild(s);
    }
    _authLS('/assets/js/data/african-countries.js', function() {
      _authLS('/assets/js/afro-auth.js', function() {
        _authLS('/assets/js/components/auth-modal.js', function() {
          _authLS('/assets/js/auth-cookie-upgrade.js?v=4');
        });
      });
    });
  }, 800);

  /* ── PWA: inject manifest, theme-color & service worker from navbar (every page) ── */
  (function _pwa() {
    if (!document.querySelector('link[rel="manifest"]')) {
      const l = document.createElement('link'); l.rel = 'manifest'; l.href = '/manifest.json';
      document.head.appendChild(l);
    }
    if (!document.querySelector('meta[name="theme-color"]')) {
      const m = document.createElement('meta'); m.name = 'theme-color'; m.content = '#0062CC';
      document.head.appendChild(m);
    }
    const s = document.createElement('script'); s.src = '/assets/js/pwa-install.js'; s.defer = true;
    document.head.appendChild(s);
  })();

  /* ── DEFERRED SCRIPTS: load after main thread is idle ── */
  var _idle = window.requestIdleCallback || function(cb) { setTimeout(cb, 1500); };

  /* Analytics: load early (not idle-deferred) so auto-tracking initializes on DOMContentLoaded */
  if (!document.getElementById('afro-analytics-js')) {
    var _as = document.createElement('script'); _as.id = 'afro-analytics-js';
    _as.src = '/assets/js/lib/analytics.js'; document.head.appendChild(_as);
  }

  _idle(function() {
    /* Animations */
    if (!document.getElementById('afro-animations-css')) {
      var l = document.createElement('link'); l.id = 'afro-animations-css';
      l.rel = 'stylesheet'; l.href = '/assets/css/animations.css';
      document.head.appendChild(l);
    }
    if (!document.getElementById('afro-animations-js')) {
      var s = document.createElement('script'); s.id = 'afro-animations-js';
      s.src = '/assets/js/animations.js'; s.defer = true;
      document.head.appendChild(s);
    }

    /* Error boundary (global error handler + UI helpers) */
    if (!document.getElementById('afro-error-boundary-js')) {
      var eb = document.createElement('script'); eb.id = 'afro-error-boundary-js';
      eb.src = '/assets/js/lib/error-boundary.js'; eb.defer = true;
      document.head.appendChild(eb);
    }

    /* Command Palette (Ctrl+K search) */
    if (!document.getElementById('afro-cmd-palette-js')) {
      var cp = document.createElement('script'); cp.id = 'afro-cmd-palette-js';
      cp.src = '/assets/js/components/command-palette.js'; cp.defer = true;
      document.head.appendChild(cp);
    }

    /* Pro gate */
    if (window.AfroProGate || document.getElementById('afro-pro-gate-js') || document.querySelector('script[src*="/assets/js/pro-gate.js"]')) {
      window.dispatchEvent(new CustomEvent('afro-pro-gate-ready'));
    } else {
      var pg = document.createElement('script'); pg.id = 'afro-pro-gate-js'; pg.src = '/assets/js/pro-gate.js'; pg.defer = true;
      pg.onload = function() { window.dispatchEvent(new CustomEvent('afro-pro-gate-ready')); };
      document.head.appendChild(pg);
    }

    /* Share image (tool pages only) */
    if (document.querySelector('.action-row') && !document.getElementById('afro-share-img-js')) {
      var si = document.createElement('script'); si.id = 'afro-share-img-js';
      si.src = '/assets/js/share-image-inject.js'; si.defer = true;
      document.head.appendChild(si);
    }
  });

  /* Auth: load afro-auth.js (consolidated Supabase auth) */
  _idle(function() {
    if (window._afroAuthLoaded) return;
    if (!document.getElementById('afro-auth-js')) {
      var s = document.createElement('script'); s.id = 'afro-auth-js';
      s.src = '/assets/js/afro-auth.js?v=6'; document.head.appendChild(s);
    }
  });
})();

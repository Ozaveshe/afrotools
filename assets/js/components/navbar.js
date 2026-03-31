/**
 * AFROTOOLS NAVBAR — Everything Platform Edition
 * Mega-menu with 12 categories from tool registry. Mobile drawer. Web Component.
 */
(function () {
  'use strict';

  const NAV_ITEMS = [
    {
      id: 'financial', label: 'Salary & Tax', labelFr: 'Salaire & Impôts', labelSw: 'Mshahara & Kodi', icon: '💰',
      desc: 'PAYE, income tax, FX, crypto', descFr: 'PAYE, impôt, change, crypto', descSw: 'PAYE, kodi, sarafu, crypto',
      href: '/salary-tax/', hrefFr: '/fr/', hrefSw: '/sw/mshahara-na-kodi/', color: '#e8f0fd', accent: '#0062CC',
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
      id: 'document-pdf', label: 'Document & PDF', labelFr: 'Documents & PDF', labelSw: 'Nyaraka na PDF', icon: '📄',
      desc: 'Merge, split, compress, convert', descFr: 'Fusionner, diviser, compresser, convertir', descSw: 'Unganisha, gawanya, bana, badilisha',
      href: '/document-pdf/', hrefSw: '/sw/zana-za-pdf/', color: '#eff6ff', accent: '#3b82f6',
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
      ]
    },
    {
      id: 'image-design', label: 'Image & Design', labelFr: 'Image & Design', labelSw: 'Picha na Ubunifu', icon: '🖼️',
      desc: 'Compress, resize, QR codes', descFr: 'Compresser, redimensionner, codes QR', descSw: 'Bana, badilisha ukubwa, misimbo QR',
      href: '/image-design/', color: '#fdf2f8', accent: '#ec4899',
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
      href: '/developer-tools/', color: '#ede9fe', accent: '#8b5cf6',
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
      href: '/education/', hrefSw: '/sw/zana-za-elimu/', color: '#EEF4FF', accent: '#3B82F6',
      tools: [
        { label: 'WAEC/NECO Grade Calculator', href: '/tools/waec-calculator/', emoji: '📋', badge: 'LIVE' },
        { label: 'JAMB Aggregate Calculator', href: '/tools/jamb-aggregate/', emoji: '🎓', badge: 'LIVE' },
        { label: 'GPA/CGPA Calculator', href: '/tools/gpa-calculator/', emoji: '🎓', badge: 'LIVE' },
        { label: 'Matric APS Score (SA)', href: '/tools/matric-points/', emoji: '🎓', badge: 'LIVE' },
        { label: 'School Fees Comparison Tool', href: '/tools/school-fees/', emoji: '🏫', badge: 'NEW' },
        { label: 'Study Abroad Cost Calculator', href: '/tools/study-abroad-cost/', emoji: '✈️', badge: 'NEW' },
        { label: 'Teacher Salary Scale Lookup', href: '/tools/teacher-salary/', emoji: '👨‍🏫', badge: 'NEW' },
        { label: 'Student Loan Repayment Calc', href: '/tools/student-loan-repay/', emoji: '💰', badge: 'NEW' },
        { label: 'NYSC Allowance Calculator', href: '/tools/nysc-allowance/', emoji: '🇳🇬', badge: 'NEW' },
        { label: 'HELB Repayment Calculator', href: '/tools/helb-repayment/', emoji: '🇰🇪', badge: 'NEW' },
        { label: 'KCSE Grade Calculator', href: '/tools/kcse-calculator/', emoji: '🇰🇪', badge: 'NEW' },
        { label: 'Ghana NSS Allowance', href: '/tools/national-service-gh/', emoji: '🇬🇭', badge: 'NEW' },
        { label: 'University Admission Points', href: '/tools/university-admission/', emoji: '🎓', badge: 'NEW' },
        { label: 'Scholarship Eligibility Checker', href: '/tools/scholarship-check/', emoji: '🏆', badge: 'NEW' },
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
      href: '/health/', hrefSw: '/sw/afya-na-bima/', color: '#fce8e8', accent: '#dc2626',
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
      href: '/insurance/', color: '#f0f4f8', accent: '#1e3a5f',
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
      href: '/agriculture/', hrefSw: '/sw/kilimo/', color: '#E8F2FF', accent: '#007AFF',
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
      href: '/vat-business-tax/', hrefFr: '/fr/', hrefSw: '/sw/vat-na-kodi/', color: '#fff7ed', accent: '#f59e0b',
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
      href: '/legal/', color: '#f5f3ff', accent: '#7c3aed',
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
      href: '/data-productivity/', hrefSw: '/sw/biashara-na-faida/', color: '#eef2ff', accent: '#6366f1',
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
      href: '/language/', color: '#faf5ff', accent: '#a855f7',
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
      href: '/african/', color: '#fef2f2', accent: '#dc2626',
      tools: [
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
      href: '/trade/', color: '#E8F2FF', accent: '#007AFF',
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
      href: '/telecom/', color: '#ECFEFF', accent: '#06B6D4',
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
      href: '/engineering/', color: '#f5f5f4', accent: '#78716c',
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
        { label: 'All Creative Economy Tools →', href: '/creative/', emoji: '🎨' },
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
  ];

  // 11 main categories shown in the mega menu + "All Categories" card = 12 items (3 rows × 4)
  const MEGA_IDS = [
    'financial', 'document-pdf', 'image-design', 'developer',
    'education', 'health', 'fintech', 'trade',
    'energy', 'small-business', 'legal'
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
    }

    nav {
      position: relative;
      height: 60px;
      background: rgba(248, 250, 253, 0.98);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      display: flex; align-items: center;
      padding: 0 20px;
      transition: box-shadow 0.2s;
    }
    nav.scrolled { box-shadow: 0 1px 0 rgba(0,0,0,0.06), 0 4px 24px rgba(0,0,0,0.04); }

    .inner {
      max-width: 1200px; margin: 0 auto; width: 100%;
      display: flex; align-items: center; gap: 2px;
    }

    /* LOGO */
    .logo {
      display: flex; align-items: center; gap: 9px;
      text-decoration: none; flex-shrink: 0; margin-right: 12px;
    }
    .logo-name { font-size: 1rem; font-weight: 800; letter-spacing: 0.02em; color: #111827; }
    .logo-name b { color: #0062CC; }
    .logo-tag { font-size: 0.44rem; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: #9ca3af; display: block; margin-top: 2px; }

    /* NAV LINKS */
    .nav-links { display: flex; align-items: center; list-style: none; flex: 1; gap: 0; overflow: hidden; min-width: 0; }
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
      top: 60px; left: 0; right: 0;
      background: rgba(255,255,255,0.97);
      -webkit-backdrop-filter: saturate(180%) blur(20px);
      backdrop-filter: saturate(180%) blur(20px);
      border-bottom: 1px solid rgba(0,0,0,0.07);
      box-shadow: 0 16px 48px rgba(0,71,227,0.07), 0 2px 8px rgba(0,0,0,0.04);
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
      padding: 20px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
    }

    .mega-col {
      border-radius: 10px; padding: 14px;
      border: 1.5px solid transparent;
      transition: border-color 0.13s, background 0.13s;
      display: flex; align-items: center; gap: 9px;
      text-decoration: none; cursor: pointer;
    }
    .mega-col:hover { border-color: var(--col-accent, #0062CC); background: #f0f7ff; }

    .mega-col-icon {
      width: 34px; height: 34px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem; flex-shrink: 0;
    }
    .mega-col-name { font-size: 0.83rem; font-weight: 800; color: #111827; line-height: 1.2; }
    .mega-col-desc { font-size: 0.65rem; font-weight: 400; color: #9ca3af; margin-top: 1px; }

    .mega-footer {
      max-width: 1200px; margin: 0 auto;
      padding: 10px 20px 14px;
      border-top: 1px solid #f3f4f6;
      display: flex; align-items: center; justify-content: space-between;
    }
    .mega-footer-note { font-size: 0.68rem; color: #9ca3af; font-weight: 500; }
    .mega-footer-lnk { font-size: 0.72rem; font-weight: 700; color: #0062CC; text-decoration: none; }
    .mega-footer-lnk:hover { text-decoration: underline; }

    /* RIGHT */
    .right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; margin-left: auto; }
    .pill-54 { font-size: 0.66rem; font-weight: 600; color: #6b7280; padding: 4px 10px; border-radius: 20px; border: 1px solid #e5e7eb; background: #f9fafb; white-space: nowrap; }

    .btn-login {
      font-size: 0.79rem; font-weight: 600; color: #374151;
      padding: 7px 14px; border-radius: 980px;
      border: 1.5px solid rgba(0,0,0,0.12); background: rgba(0,0,0,0.03);
      text-decoration: none; white-space: nowrap;
      transition: all 0.13s; cursor: pointer;
    }
    .btn-login:hover { border-color: #0062CC; color: #0062CC; }

    .cta {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 8px 16px; border-radius: 980px;
      font-size: 0.79rem; font-weight: 700;
      text-decoration: none; background: #0062CC; color: #fff;
      border: none; cursor: pointer; white-space: nowrap;
      transition: background 0.13s, transform 0.1s;
      box-shadow: 0 1px 4px rgba(0,122,255,0.28);
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
      top: 60px; left: 0; right: 0; bottom: 0;
      background: #fff; z-index: 498;
      overflow-y: auto; flex-direction: column;
      opacity: 0; pointer-events: none;
      transition: opacity 0.2s;
      padding-bottom: env(safe-area-inset-bottom, 48px);
    }
    .mob.open { opacity: 1; pointer-events: all; }

    .mob-section-label {
      font-size: 0.58rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
      color: #9ca3af; padding: 14px 20px 6px;
    }
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
    .mob-cat-label { font-size: 0.92rem; font-weight: 700; color: #111827; }
    .mob-cat-desc  { font-size: 0.7rem; font-weight: 400; color: #6b7280; margin-top: 1px; }
    .mob-arr { margin-left: auto; font-size: 0.7rem; color: #9ca3af; }

    .mob-footer {
      padding: 20px; border-top: 1px solid #f3f4f6; margin-top: 8px;
      display: flex; flex-direction: column; gap: 10px;
    }
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
    .mob-note { text-align: center; font-size: 0.7rem; font-weight: 500; color: #9ca3af; }

    /* RESPONSIVE — progressive collapse */
    .pill-54 { display: none; }
    @media (max-width: 1100px) {
      .cta { display: none; }
      .lang-btn-label { display: none; }
      .lang-btn { padding: 5px 7px; font-size: 0.9rem; }
    }
    @media (max-width: 940px) {
      .nav-links, .pill-54, .cta { display: none; }
      .lang-switch { display: none; }
      .btn-login { border: none; padding: 4px 8px; max-width: none; overflow: hidden; font-size: 0.75rem; }
      .btn-login .nav-user-name, .btn-login .user-menu-name { display: none !important; width: 0 !important; height: 0 !important; overflow: hidden !important; font-size: 0 !important; }
      .btn-login span:first-child { margin-right: 0 !important; }
      .burger { display: flex; }
      .mob    { display: flex; }
      nav     { padding: 0 16px; max-width: 100vw !important; overflow-x: hidden !important; }
    }
    @media (max-width: 480px) {
      .logo-tag { display: none; }
      nav { height: 56px; }
      .mob { top: 56px; }
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
    .search-btn svg { width: 16px; height: 16px; }
    .search-kbd {
      font-size: 0.55rem; font-weight: 600; color: #9ca3af;
      margin-left: 4px; background: #f3f4f6; border-radius: 4px;
      padding: 1px 5px; border: 1px solid #e5e7eb;
      display: none;
    }
    @media (min-width: 941px) {
      .search-btn { width: auto; padding: 0 10px; gap: 6px; }
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
      font-size: 0.6rem; font-weight: 600; color: #9ca3af;
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
      font-size: 0.55rem; font-weight: 600; color: #9ca3af;
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
      font-size: 0.62rem; color: #9ca3af; font-weight: 500;
      display: flex; align-items: center; gap: 8px;
    }
    .search-footer-hint kbd {
      background: #f3f4f6; border: 1px solid #e5e7eb;
      border-radius: 3px; padding: 1px 5px;
      font-size: 0.58rem; font-weight: 600; font-family: inherit;
    }

    /* RECENT TOOLS in search */
    .search-section-label {
      font-size: 0.58rem; font-weight: 700; letter-spacing: 0.1em;
      text-transform: uppercase; color: #9ca3af;
      padding: 10px 12px 4px;
    }
    .recent-clear {
      font-size: 0.58rem; font-weight: 600; color: #0062CC;
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
    }
    .mob-search-bar:focus-within { border-color: #0062CC; background: #fff; }
    .mob-search-bar svg { width: 16px; height: 16px; color: #9ca3af; flex-shrink: 0; }
    .mob-search-input {
      flex: 1; border: none; outline: none;
      font-size: 0.9rem; font-weight: 500; color: #111827;
      font-family: 'DM Sans', system-ui, sans-serif;
      background: transparent;
    }
    .mob-search-input::placeholder { color: #c4c8cc; }
    .mob-search-results {
      padding: 0 8px 8px;
    }
    .mob-search-results .search-result {
      padding: 12px 12px;
    }
    .mob-search-results .search-result-icon {
      width: 36px; height: 36px;
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

    _megaContent() {
      var lang = this._getLang();
      var isFr = lang === 'fr';
      var isSw = lang === 'sw';
      var featured = MEGA_IDS.map(id => this._navItems().find(c => c.id === id)).filter(Boolean);
      var html = featured.map(cat => {
        var href = isSw && cat.hrefSw ? cat.hrefSw : isFr && cat.hrefFr ? cat.hrefFr : cat.href;
        var label = isSw && cat.labelSw ? cat.labelSw : isFr && cat.labelFr ? cat.labelFr : cat.label;
        var desc = isSw && cat.descSw ? cat.descSw : isFr && cat.descFr ? cat.descFr : cat.desc;
        return `
        <a href="${href}" class="mega-col" data-cat="${cat.id}" style="--col-accent:${cat.accent}">
          <div class="mega-col-icon" style="background:${cat.color}">${cat.icon}</div>
          <div>
            <div class="mega-col-name">${label}</div>
            <div class="mega-col-desc">${desc}</div>
          </div>
        </a>`;
      }).join('');
      var allLabel = isSw ? 'Makundi Yote →' : isFr ? 'Toutes les catégories →' : 'All Categories →';
      var allDesc = isSw ? 'Makundi 28 yote' : isFr ? '28 catégories' : 'All 28 categories';
      html += `
        <a href="/categories/" class="mega-col" style="--col-accent:#0062CC">
          <div class="mega-col-icon" style="background:#EEF4FF">🧭</div>
          <div>
            <div class="mega-col-name">${allLabel}</div>
            <div class="mega-col-desc">${allDesc}</div>
          </div>
        </a>`;
      return html;
    }

    _mobileContent() {
      var lang = this._getLang();
      var isFr = lang === 'fr';
      var isSw = lang === 'sw';
      var featured = MEGA_IDS.map(id => this._navItems().find(c => c.id === id)).filter(Boolean);
      var html = featured.map(cat => {
        var href = isSw && cat.hrefSw ? cat.hrefSw : isFr && cat.hrefFr ? cat.hrefFr : cat.href;
        var label = isSw && cat.labelSw ? cat.labelSw : isFr && cat.labelFr ? cat.labelFr : cat.label;
        var desc = isSw && cat.descSw ? cat.descSw : isFr && cat.descFr ? cat.descFr : cat.desc;
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
      html += `
        <a href="/categories/" class="mob-cat" style="border-top:2px solid #e5e7eb;margin-top:4px">
          <div class="mob-cat-icon" style="background:#EEF4FF">🧭</div>
          <div>
            <div class="mob-cat-label" style="color:#0062CC">${allLabel}</div>
            <div class="mob-cat-desc">${allDesc}</div>
          </div>
          <span class="mob-arr">›</span>
        </a>`;
      return html;
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

    _render() {
      var lang = this._getLang();
      var isFr = lang === 'fr';
      var isSw = lang === 'sw';
      var T = {
        tag:          isSw ? 'Jukwaa la Afrika'             : isFr ? 'La plateforme africaine'                          : "Africa's Everything Platform",
        allTools:     isSw ? 'Zana Zote'                    : isFr ? 'Tous les outils'                                  : 'All Tools',
        salaryTax:    isSw ? 'Mshahara &amp; Kodi'          : isFr ? 'Salaire &amp; Impôts'                             : 'Salary &amp; Tax',
        salaryHref:   isSw ? '/sw/mshahara-na-kodi/'        : isFr ? '/fr/'                                             : '/salary-tax/',
        pdfTools:     isSw ? 'Zana za PDF'                  : isFr ? 'Outils PDF'                                       : 'PDF Tools',
        devTools:     isSw ? 'Zana za Dev'                  : isFr ? 'Outils Dev'                                       : 'Dev Tools',
        african:      isSw ? 'Kiafrika'                     : isFr ? 'Africain'                                         : 'African',
        education:    isSw ? 'Elimu'                        : isFr ? 'Éducation'                                        : 'Education',
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
        mobNote:      isSw ? '🌍 Nchi 54 · bure · bila usajili'                 : isFr ? '🌍 54 pays · gratuit · sans inscription'          : '🌍 54 countries · always free · no sign-up required',
        srchEmpty:    isSw ? 'Zana 100+ za Afrika'          : isFr ? '100+ outils africains'                            : 'Search 100+ African tools',
        srchHint:     isSw ? 'Jaribu "PAYE", "PDF", "kodi", "BMI"…'            : isFr ? 'Essayez "PAYE", "salaire", "TVA"…'               : 'Try "PAYE", "PDF", "japa", "BMI"…',
      };

      this.shadowRoot.innerHTML = `
        <style>${CSS}</style>
        <nav role="navigation" aria-label="${T.ariaNav}">
          <div class="inner">
            <a href="/" class="logo" aria-label="AfroTools home">
              ${MARK}
              <div>
                <span class="logo-name">AFRO<b>TOOLS</b></span>
                <span class="logo-tag">${T.tag}</span>
              </div>
            </a>

            <ul class="nav-links">
              <li>
                <button class="lnk" id="allBtn" type="button" aria-haspopup="true" aria-expanded="false">
                  ${T.allTools}
                  <svg class="chev" viewBox="0 0 7 4" fill="none">
                    <polyline points="0.5,0.5 3.5,3.5 6.5,0.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </li>
              <li><a href="${T.salaryHref}" class="lnk">${T.salaryTax}</a></li>
              <li><a href="${isSw ? '/sw/zana-za-pdf/' : '/document-pdf/'}" class="lnk">${T.pdfTools}</a></li>
              <li><a href="/developer-tools/" class="lnk">${T.devTools}</a></li>
              <li><a href="/african/" class="lnk">${T.african}</a></li>
              <li><a href="${isSw ? '/sw/zana-za-elimu/' : '/education/'}" class="lnk">${T.education}</a></li>
              <li><a href="${isSw ? '/blog/' : isFr ? '/fr/blog/' : '/blog/'}" class="lnk">Blog</a></li>
              <li><a href="/api/" class="lnk">API</a></li>
              <li><a href="/pro/" class="lnk" style="color:#F5A623;font-weight:700">Pro</a></li>
            </ul>

            <div class="right">
              <button class="search-btn" id="searchBtn" type="button" aria-label="${T.ariaSearch}">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="8.5" cy="8.5" r="5.5"/><line x1="13" y1="13" x2="18" y2="18"/>
                </svg>
                <span class="search-kbd">Ctrl K</span>
              </button>
              ${this._langSwitcherHTML()}
              <span class="pill-54">${T.countries54}</span>
              <a href="/dashboard/" class="btn-login">${T.signIn}</a>
              <button class="burger" type="button" aria-label="Open menu" aria-expanded="false">
                <span></span><span></span><span></span>
              </button>
            </div>
          </div>
        </nav>

        <div class="mega" id="mega" role="menu" aria-label="${T.allTools}">
          <div class="mega-inner">
            ${this._megaContent()}
          </div>
          <div class="mega-footer">
            <span class="mega-footer-note">${T.megaNote}</span>
            <a href="${T.browseHref}" class="mega-footer-lnk">${T.browseAll}</a>
          </div>
        </div>

        <div class="mob" role="dialog" aria-modal="true" aria-label="${T.ariaMenu}">
          <div class="mob-search-bar">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="8.5" cy="8.5" r="5.5"/><line x1="13" y1="13" x2="18" y2="18"/>
            </svg>
            <input class="mob-search-input" type="text" placeholder="${T.searchPh}" aria-label="${T.ariaSearch}" autocomplete="off"/>
          </div>
          <div class="mob-search-results" id="mobSearchResults"></div>
          <div id="mobCategoriesWrap">
            <div class="mob-section-label">${T.allCats}</div>
            ${this._mobileContent()}
          </div>
          ${this._mobileLangHTML()}
          <div class="mob-footer">
            <a href="/dashboard/" class="mob-login">${T.mobSignIn}</a>
            <a href="/dashboard/vault/" class="mob-vault-link" style="display:none;padding:10px 13px;border-radius:8px;font-size:0.85rem;font-weight:600;text-decoration:none;color:#0062CC;border:1.5px solid #0062CC;text-align:center;">📁 My Vault</a>
            <p class="mob-note">${T.mobNote}</p>
          </div>
        </div>

        <div class="search-overlay" id="searchOverlay" role="dialog" aria-modal="true" aria-label="${T.ariaSearch}">
          <div class="search-modal">
            <div class="search-input-wrap">
              <svg viewBox="0 0 20 20" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="8.5" cy="8.5" r="5.5"/><line x1="13" y1="13" x2="18" y2="18"/>
              </svg>
              <input class="search-input" id="searchInput" type="text" placeholder="${T.searchPh}" aria-label="${T.ariaSearch}" autocomplete="off"/>
              <span class="search-esc" id="searchEsc">ESC</span>
            </div>
            <div class="search-results" id="searchResults">
              <div class="search-empty">
                <div class="search-empty-icon">🔍</div>
                <div class="search-empty-text">${T.srchEmpty}</div>
                <div class="search-empty-hint">${T.srchHint}</div>
              </div>
            </div>
            <div class="search-footer">
              <div class="search-footer-hint">
                <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
                <span><kbd>↵</kbd> open</span>
                <span><kbd>esc</kbd> close</span>
              </div>
            </div>
          </div>
        </div>`;
    }

    _bind() {
      const sr     = this.shadowRoot;
      const nav    = sr.querySelector('nav');
      const allBtn = sr.querySelector('#allBtn');
      const mega   = sr.querySelector('#mega');
      const burger = sr.querySelector('.burger');
      const mob    = sr.querySelector('.mob');

      // Scroll shadow
      if (this._scrollFn) window.removeEventListener('scroll', this._scrollFn);
      this._scrollFn = () => nav.classList.toggle('scrolled', window.scrollY > 4);
      window.addEventListener('scroll', this._scrollFn, { passive: true });
      this._scrollFn();

      const openMega  = () => { this._megaOpen = true;  allBtn.classList.add('open'); mega.classList.add('open'); allBtn.setAttribute('aria-expanded','true'); };
      const closeMega = () => { this._megaOpen = false; allBtn.classList.remove('open'); mega.classList.remove('open'); allBtn.setAttribute('aria-expanded','false'); };

      // Click toggle
      allBtn?.addEventListener('click', e => { e.stopPropagation(); this._megaOpen ? closeMega() : openMega(); });

      // Hover — keep open while moving between button and mega
      let hoverTimer;
      const navEl = allBtn?.closest('li');
      navEl?.addEventListener('mouseenter', () => { clearTimeout(hoverTimer); openMega(); });
      navEl?.addEventListener('mouseleave', () => { hoverTimer = setTimeout(closeMega, 200); });
      mega?.addEventListener('mouseenter', () => clearTimeout(hoverTimer));
      mega?.addEventListener('mouseleave', () => { hoverTimer = setTimeout(closeMega, 200); });

      // Tool sub-panels: disabled — category cards navigate directly to their pages

      // Click outside
      if (this._outsideFn) document.removeEventListener('click', this._outsideFn);
      this._outsideFn = e => { if (!this.contains(e.target)) closeMega(); };
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
        if (e.key === 'Escape') { closeMega(); langDrop?.classList.remove('open'); if (this._menuOpen) burger?.click(); }
      });

      // Mobile hamburger
      burger?.addEventListener('click', () => {
        this._menuOpen = !this._menuOpen;
        burger.classList.toggle('open', this._menuOpen);
        mob.classList.toggle('open', this._menuOpen);
        burger.setAttribute('aria-expanded', String(this._menuOpen));
        document.body.style.overflow = this._menuOpen ? 'hidden' : '';
        if (this._menuOpen) closeMega();
      });

      mob?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        this._menuOpen = false;
        burger?.classList.remove('open');
        mob.classList.remove('open');
        document.body.style.overflow = '';
      }));

      // ── ACTIVE PAGE INDICATOR ──
      const path = window.location.pathname;
      sr.querySelectorAll('.nav-links .lnk[href]').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href !== '/' && path.startsWith(href)) {
          link.classList.add('active');
        }
      });

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

      // ── SEARCH ──
      const searchBtn     = sr.querySelector('#searchBtn');
      const searchOverlay = sr.querySelector('#searchOverlay');
      const searchInput   = sr.querySelector('#searchInput');
      const searchResults = sr.querySelector('#searchResults');
      const searchEsc     = sr.querySelector('#searchEsc');
      const mobSearchInput   = sr.querySelector('.mob-search-input');
      const mobSearchResults = sr.querySelector('#mobSearchResults');
      const mobCategoriesWrap = sr.querySelector('#mobCategoriesWrap');

      // Mac detection for shortcut label
      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
      const kbdEl = sr.querySelector('.search-kbd');
      if (kbdEl) kbdEl.textContent = isMac ? '⌘ K' : 'Ctrl K';

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
                <a href="${t.href}" class="search-result${i === 0 ? ' active' : ''}" data-idx="${i}">
                  <div class="search-result-icon">${escapeHtml(t.icon || '🔧')}</div>
                  <div>
                    <div class="search-result-name">${escapeHtml(t.name)}</div>
                  </div>
                </a>`).join('') +
              '<div class="search-section-label" style="padding-top:16px">All Tools</div>' +
              '<div class="search-empty" style="padding:16px"><div class="search-empty-hint">Type to search 400+ tools</div></div>';
            _activeIdx = 0;
            container.querySelector('#clearRecent')?.addEventListener('click', e => {
              e.preventDefault(); e.stopPropagation();
              try { localStorage.removeItem(RECENT_KEY); } catch {}
              container.innerHTML = '<div class="search-empty"><div class="search-empty-icon">🔍</div><div class="search-empty-text">Search 100+ African tools</div><div class="search-empty-hint">Try "PAYE", "PDF", "japa", "BMI"…</div></div>';
            });
            return;
          }
          container.innerHTML = '<div class="search-empty"><div class="search-empty-icon">🔍</div><div class="search-empty-text">Search 100+ African tools</div><div class="search-empty-hint">Try "PAYE", "PDF", "japa", "BMI"…</div></div>';
          return;
        }
        if (tools.length === 0) {
          container.innerHTML = '<div class="search-empty"><div class="search-empty-icon">😔</div><div class="search-empty-text">No tools found</div><div class="search-empty-hint">Try a different search term</div></div>';
          return;
        }
        _activeIdx = 0;
        container.innerHTML = tools.map((t, i) => `
          <a href="${t.href}" class="search-result${i === 0 ? ' active' : ''}" data-idx="${i}">
            <div class="search-result-icon">${escapeHtml(t.icon || '🔧')}</div>
            <div>
              <div class="search-result-name">${highlightMatch(t.name, query)}</div>
              <div class="search-result-desc">${escapeHtml(t.desc)}</div>
              <div class="search-result-cat">${escapeHtml(getCategoryLabel(t.category))}</div>
            </div>
          </a>`).join('');
      };

      const openSearch = () => {
        searchOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
        _activeIdx = -1;
        setTimeout(() => searchInput.focus(), 60);
      };

      const closeSearch = () => {
        searchOverlay.classList.remove('open');
        document.body.style.overflow = this._menuOpen ? 'hidden' : '';
        searchInput.value = '';
        searchResults.innerHTML = '<div class="search-empty"><div class="search-empty-icon">🔍</div><div class="search-empty-text">Search 100+ African tools</div><div class="search-empty-hint">Try "PAYE", "PDF", "japa", "BMI"…</div></div>';
        _activeIdx = -1;
      };

      // Open search
      searchBtn?.addEventListener('click', e => { e.stopPropagation(); openSearch(); });
      searchEsc?.addEventListener('click', closeSearch);

      // Click overlay to close
      searchOverlay?.addEventListener('click', e => { if (e.target === searchOverlay) closeSearch(); });

      // Search input handler
      let _debounce;
      searchInput?.addEventListener('input', () => {
        clearTimeout(_debounce);
        _debounce = setTimeout(() => {
          const q = searchInput.value.trim();
          const results = searchTools(q);
          renderResults(results, q, searchResults);
          // Analytics: track search events
          if (q && q.length >= 2 && window.AfroTools?.analytics) {
            const count = results ? results.length : 0;
            window.AfroTools.analytics.trackSearch(q, count, 'navbar');
            if (count === 0) {
              window.AfroTools.analytics.trackSearchNoResults(q, 'navbar');
            }
          }
          // Capture search for product intelligence (debounced 500ms in captureSearch)
          captureSearch(q, results ? results.length : 0, 'navbar');
        }, 80);
      });

      // Keyboard nav in search
      searchInput?.addEventListener('keydown', e => {
        const items = searchResults.querySelectorAll('.search-result');
        if (!items.length) return;
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          _activeIdx = Math.min(_activeIdx + 1, items.length - 1);
          items.forEach((el, i) => el.classList.toggle('active', i === _activeIdx));
          items[_activeIdx]?.scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          _activeIdx = Math.max(_activeIdx - 1, 0);
          items.forEach((el, i) => el.classList.toggle('active', i === _activeIdx));
          items[_activeIdx]?.scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (_activeIdx >= 0 && items[_activeIdx]) {
            const href = items[_activeIdx].getAttribute('href');
            if (href) window.location.href = href;
          }
        }
      });

      // Click on result
      searchResults?.addEventListener('click', e => {
        const result = e.target.closest('.search-result');
        if (result) {
          closeSearch();
        }
      });

      // Global keyboard shortcuts (Ctrl+K / Cmd+K and Escape)
      if (this._searchKeyFn) document.removeEventListener('keydown', this._searchKeyFn);
      this._searchKeyFn = e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          if (searchOverlay.classList.contains('open')) closeSearch();
          else openSearch();
        }
        if (e.key === 'Escape' && searchOverlay.classList.contains('open')) {
          closeSearch();
        }
      };
      document.addEventListener('keydown', this._searchKeyFn);

      // ── MOBILE SEARCH ──
      let _mobDebounce;
      mobSearchInput?.addEventListener('input', () => {
        clearTimeout(_mobDebounce);
        _mobDebounce = setTimeout(() => {
          const q = mobSearchInput.value.trim();
          if (!q) {
            mobSearchResults.innerHTML = '';
            mobCategoriesWrap.style.display = '';
            return;
          }
          const results = searchTools(q);
          if (results === null) {
            mobSearchResults.innerHTML = '<div class="mob-search-empty">Loading tools…</div>';
            mobCategoriesWrap.style.display = 'none';
            return;
          }
          if (results.length === 0) {
            mobSearchResults.innerHTML = '<div class="mob-search-empty">No tools found</div>';
            mobCategoriesWrap.style.display = 'none';
            // Analytics: track mobile search no results
            if (q && q.length >= 2 && window.AfroTools?.analytics) {
              window.AfroTools.analytics.trackSearch(q, 0, 'navbar');
              window.AfroTools.analytics.trackSearchNoResults(q, 'navbar');
            }
            captureSearch(q, 0, 'navbar');
            return;
          }
          mobCategoriesWrap.style.display = 'none';
          mobSearchResults.innerHTML = results.map(t => `
            <a href="${t.href}" class="search-result">
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
      const origBurgerClick = () => {
        if (!this._menuOpen && mobSearchInput) {
          mobSearchInput.value = '';
          mobSearchResults.innerHTML = '';
          if (mobCategoriesWrap) mobCategoriesWrap.style.display = '';
        }
      };
      burger?.addEventListener('click', origBurgerClick);

      // ── AUTH STATE: update Sign-in button when user logs in/out ──
      const loginBtn = sr.querySelector('.btn-login');
      const mobLoginBtn = sr.querySelector('.mob-login');
      const mobVaultLink = sr.querySelector('.mob-vault-link');

      const updateAuthUI = () => {
        if (typeof AfroAuth === 'undefined' || !AfroAuth.isLoggedIn || !AfroAuth.isLoggedIn()) {
          // Not logged in — show Sign in (i18n)
          var _lang = this._getLang();
          var _signLabel = _lang === 'sw' ? 'Ingia' : _lang === 'fr' ? 'Connexion' : 'Sign in';
          if (loginBtn) {
            loginBtn.textContent = _signLabel;
            loginBtn.href = '#';
            loginBtn.onclick = function(e) { e.preventDefault(); if (typeof AfroAuth !== 'undefined' && AfroAuth.openModal) AfroAuth.openModal(); else window.location.href = '/dashboard/'; };
          }
          if (mobLoginBtn) {
            mobLoginBtn.textContent = _signLabel;
            mobLoginBtn.href = '#';
            mobLoginBtn.onclick = function(e) { e.preventDefault(); if (typeof AfroAuth !== 'undefined' && AfroAuth.openModal) AfroAuth.openModal(); else window.location.href = '/dashboard/'; };
          }
          if (mobVaultLink) mobVaultLink.style.display = 'none';
          return;
        }
        const user = AfroAuth.getUser();
        const name = (user && user.name) ? user.name.split(' ')[0] : 'Dashboard';
        const initial = name[0].toUpperCase();
        // Desktop: show avatar initial + first name
        if (loginBtn) {
          loginBtn.href = '/dashboard/';
          loginBtn.innerHTML = '<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;background:#0062CC;color:#fff;border-radius:50%;font-size:10px;font-weight:800;margin-right:5px;">' + initial + '</span><span class="nav-user-name user-menu-name">' + name + '</span>';
        }
        // Mobile: show name + vault link
        if (mobLoginBtn) {
          mobLoginBtn.href = '/dashboard/';
          mobLoginBtn.textContent = name + ' \u2014 Dashboard';
        }
        if (mobVaultLink) mobVaultLink.style.display = '';
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
    }
  }

  if (!customElements.get('afro-navbar')) {
    customElements.define('afro-navbar', AfroNavbar);
  }

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
          _authLS('/assets/js/auth-cookie-upgrade.js');
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

    /* Pro gate */
    var pg = document.createElement('script'); pg.src = '/assets/js/pro-gate.js'; pg.defer = true;
    document.head.appendChild(pg);

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

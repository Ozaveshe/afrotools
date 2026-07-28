'use strict';

// Discovery ownership for all 32 canonical categories. A category without a
// native French hub routes to the French all-tools filter; it must not point at
// a path that silently serves the English hub.
const FRENCH_CATEGORIES = [
  { key: 'financial', title: 'Finances, salaire et fiscalité', href: '/fr/salary-tax/', nativeHub: true, icon: 'FI', bg: '#eff6ff', description: 'Salaire net, PAYE, cotisations, épargne, change et décisions financières.' },
  { key: 'hr-payroll', title: 'Paie et ressources humaines', href: '/fr/all-tools/?category=hr-payroll', nativeHub: false, icon: 'RH', bg: '#f0fdfa', description: 'Coût employeur, congés, heures supplémentaires et opérations de paie.' },
  { key: 'document-pdf', title: 'Documents et PDF', href: '/fr/document-pdf/', nativeHub: true, icon: 'PDF', bg: '#eff6ff', description: 'Créer, convertir, organiser et exporter des documents dans le navigateur.' },
  { key: 'image-design', title: 'Image et design', href: '/fr/image-design/', nativeHub: true, icon: 'IM', bg: '#fdf2f8', description: 'Redimensionnement, conversion, couleurs et préparation de visuels.' },
  { key: 'developer', title: 'Outils pour développeurs', href: '/fr/developer-tools/', nativeHub: true, icon: 'DEV', bg: '#ede9fe', description: 'JSON, API, code, texte et utilitaires techniques.' },
  { key: 'education', title: 'Éducation', href: '/fr/education/', nativeHub: true, icon: 'ED', bg: '#eff6ff', description: 'Notes, examens, études, bourses et planification scolaire.' },
  { key: 'health', title: 'Santé et bien-être', href: '/fr/health/', nativeHub: true, icon: 'SA', bg: '#fce8e8', description: 'Outils de préparation et de suivi avec limites de sécurité explicites.' },
  { key: 'insurance', title: 'Assurance', href: '/fr/all-tools/?category=insurance', nativeHub: false, icon: 'AS', bg: '#f0fdfa', description: 'Primes, couverture, sinistres et comparaison de scénarios.' },
  { key: 'fintech', title: 'Fintech et services bancaires', href: '/fr/all-tools/?category=fintech', nativeHub: false, icon: 'FT', bg: '#ecfdf5', description: 'Paiements, frais bancaires, mobile money et services financiers numériques.' },
  { key: 'agriculture', title: 'Agriculture', href: '/fr/agriculture/', nativeHub: true, icon: 'AG', bg: '#f0fdf4', description: 'Rendements, intrants, élevage, exploitation et commercialisation.' },
  { key: 'ecommerce', title: 'TVA et fiscalité des entreprises', href: '/fr/vat-business-tax/', nativeHub: true, icon: 'TVA', bg: '#fff7ed', description: 'TVA, retenues, droits, facturation et obligations commerciales.' },
  { key: 'legal', title: 'Immobilier, hypothèque et juridique', href: '/fr/mortgage-property/', nativeHub: true, icon: 'IMMO', bg: '#e0f2fe', description: 'Logement, propriété, contrats, conformité et démarches juridiques.' },
  { key: 'data-productivity', title: 'Business, données et productivité', href: '/fr/business-roi/', nativeHub: true, icon: 'ROI', bg: '#eef2ff', description: 'Rentabilité, organisation, analyse et prise de décision.' },
  { key: 'language', title: 'Langues et traduction', href: '/fr/language/', nativeHub: true, icon: 'LG', bg: '#faf5ff', description: 'Texte, translittération et aides linguistiques africaines.' },
  { key: 'african', title: 'Spécialités africaines', href: '/fr/uniquely-african/', nativeHub: true, icon: 'AF', bg: '#fef2f2', description: 'Outils conçus autour de pratiques, devises et besoins africains.' },
  { key: 'trade', title: 'Commerce et importation', href: '/fr/trade/', nativeHub: true, icon: 'CO', bg: '#fff7ed', description: 'Douane, import-export, coût rendu et commerce régional.' },
  { key: 'telecom', title: 'Télécom et mobile', href: '/fr/telecom/', nativeHub: true, icon: 'TEL', bg: '#eef2ff', description: 'Données mobiles, appareils, réseaux et connectivité.' },
  { key: 'energy', title: 'Énergie et services publics', href: '/fr/energy/', nativeHub: true, icon: 'EN', bg: '#fffbeb', description: 'Électricité, solaire, carburant, compteurs et énergie de secours.' },
  { key: 'engineering', title: 'Ingénierie et construction', href: '/fr/all-tools/?category=engineering', nativeHub: false, icon: 'ING', bg: '#f5f5f4', description: 'Quantités, structures, matériaux, plans et chantiers.' },
  { key: 'creative', title: 'Économie créative', href: '/fr/all-tools/?category=creative', nativeHub: false, icon: 'CR', bg: '#fdf2f8', description: 'Création, médias, production, tarifs et contenus.' },
  { key: 'security', title: 'Sécurité et protection', href: '/fr/all-tools/?category=security', nativeHub: false, icon: 'SEC', bg: '#f9fafb', description: 'Prévention, confidentialité, preuves et préparation aux risques.' },
  { key: 'government', title: 'Administration et services publics', href: '/fr/all-tools/?category=government', nativeHub: false, icon: 'ADM', bg: '#eff6ff', description: 'Identité, documents, élections et démarches administratives.' },
  { key: 'small-business', title: 'Petites entreprises et PME', href: '/fr/all-tools/?category=small-business', nativeHub: false, icon: 'PME', bg: '#fff7ed', description: 'Prix, coûts, marges, trésorerie et opérations quotidiennes.' },
  { key: 'transport', title: 'Transport et logistique', href: '/fr/transport/', nativeHub: true, icon: 'TR', bg: '#fff7ed', description: 'Véhicules, itinéraires, livraisons, coûts et logistique.' },
  { key: 'travel-tourism', title: 'Voyage et tourisme', href: '/fr/travel/', nativeHub: true, icon: 'VOY', bg: '#e0f2fe', description: 'Budget, préparation, visas, santé du voyage et tourisme.' },
  { key: 'personal-finance', title: 'Finances personnelles', href: '/fr/all-tools/?category=personal-finance', nativeHub: false, icon: 'FP', bg: '#f5f3ff', description: 'Budget, dette, épargne et décisions financières du foyer.' },
  { key: 'diaspora', title: 'Diaspora', href: '/fr/all-tools/?category=diaspora', nativeHub: false, icon: 'DI', bg: '#e0f2fe', description: 'Transferts, mobilité, fiscalité et projets transfrontaliers.' },
  { key: 'career', title: 'Carrière et développement', href: '/fr/all-tools/?category=career', nativeHub: false, icon: 'CA', bg: '#f5f3ff', description: 'CV, emploi, négociation et progression professionnelle.' },
  { key: 'religious-cultural', title: 'Religion et culture', href: '/fr/all-tools/?category=religious-cultural', nativeHub: false, icon: 'RC', bg: '#fef3c7', description: 'Calendriers, pratiques, événements et planification culturelle.' },
  { key: 'climate', title: 'Climat et environnement', href: '/fr/all-tools/?category=climate', nativeHub: false, icon: 'CL', bg: '#f0fdf4', description: 'Carbone, eau, risques climatiques et durabilité.' },
  { key: 'sports', title: 'Sports et divertissement', href: '/fr/all-tools/?category=sports', nativeHub: false, icon: 'SP', bg: '#fef2f2', description: 'Performance, événements, équipes et activités sportives.' },
  { key: 'mining', title: 'Mines et industries extractives', href: '/fr/all-tools/?category=mining', nativeHub: false, icon: 'MI', bg: '#f5f5f4', description: 'Redevances, licences, production et économie extractive.' }
];

module.exports = { FRENCH_CATEGORIES };

/* AfroTools WAEC Calculator — Exam Systems Data
   All African secondary exam systems.
   Loaded as: window.WAEC_EXAM_SYSTEMS */

var WAEC_EXAM_SYSTEMS = {
  'ng-waec': {
    id: 'ng-waec',
    name: 'Nigeria \u2014 WAEC/NECO',
    flag: '\u{1F1F3}\u{1F1EC}',
    gradeScale: 'A1-F9',
    bestOf: 5,
    includeCompulsory: ['English Language', 'Mathematics'],
    grades: {
      'A1': { points: 1, label: 'Excellent (75\u2013100%)', color: '#10B981' },
      'B2': { points: 2, label: 'Very Good (70\u201374%)', color: '#10B981' },
      'B3': { points: 3, label: 'Good (65\u201369%)', color: '#10B981' },
      'C4': { points: 4, label: 'Credit (60\u201364%)', color: '#F59E0B' },
      'C5': { points: 5, label: 'Credit (55\u201359%)', color: '#F59E0B' },
      'C6': { points: 6, label: 'Credit (50\u201354%)', color: '#F59E0B' },
      'D7': { points: 7, label: 'Pass (45\u201349%)', color: '#F97316' },
      'E8': { points: 8, label: 'Pass (40\u201344%)', color: '#F97316' },
      'F9': { points: 9, label: 'Fail (0\u201339%)', color: '#EF4444' }
    },
    aggregateRanges: [
      { name: 'Excellent', min: 5, max: 7, color: '#10B981' },
      { name: 'Very Good', min: 8, max: 12, color: '#3B82F6' },
      { name: 'Credit', min: 13, max: 20, color: '#F59E0B' },
      { name: 'Pass', min: 21, max: 30, color: '#F97316' },
      { name: 'Weak', min: 31, max: 45, color: '#EF4444' }
    ],
    minCredit: 'C6',
    fact: 'In Nigeria, most universities require a minimum of 5 credits including English and Mathematics.'
  },

  'gh-waec': {
    id: 'gh-waec',
    name: 'Ghana \u2014 WASSCE',
    flag: '\u{1F1EC}\u{1F1ED}',
    gradeScale: 'A1-F9',
    bestOf: 6,
    bestOfRule: '3 core + 3 elective',
    includeCompulsory: ['English Language', 'Mathematics', 'Integrated Science'],
    grades: {
      'A1': { points: 1, label: 'Excellent', color: '#10B981' },
      'B2': { points: 2, label: 'Very Good', color: '#10B981' },
      'B3': { points: 3, label: 'Good', color: '#10B981' },
      'C4': { points: 4, label: 'Credit', color: '#F59E0B' },
      'C5': { points: 5, label: 'Credit', color: '#F59E0B' },
      'C6': { points: 6, label: 'Credit', color: '#F59E0B' },
      'D7': { points: 7, label: 'Pass', color: '#F97316' },
      'E8': { points: 8, label: 'Pass', color: '#F97316' },
      'F9': { points: 9, label: 'Fail', color: '#EF4444' }
    },
    aggregateRanges: [
      { name: 'Excellent', min: 6, max: 10, color: '#10B981' },
      { name: 'Very Good', min: 11, max: 18, color: '#3B82F6' },
      { name: 'Good', min: 19, max: 24, color: '#F59E0B' },
      { name: 'Pass', min: 25, max: 36, color: '#F97316' },
      { name: 'Weak', min: 37, max: 54, color: '#EF4444' }
    ],
    minCredit: 'C6',
    fact: 'Ghana WASSCE uses best 6 subjects: 3 core (English, Maths, Science/Social) + 3 electives.'
  },

  'sl-waec': {
    id: 'sl-waec',
    name: 'Sierra Leone \u2014 WASSCE',
    flag: '\u{1F1F8}\u{1F1F1}',
    gradeScale: 'A1-F9',
    bestOf: 5,
    includeCompulsory: ['English Language', 'Mathematics'],
    grades: null,
    useGradesFrom: 'ng-waec',
    fact: 'Sierra Leone uses the same WAEC grading as Nigeria.'
  },

  'lr-waec': {
    id: 'lr-waec',
    name: 'Liberia \u2014 WASSCE',
    flag: '\u{1F1F1}\u{1F1F7}',
    gradeScale: 'A1-F9',
    bestOf: 5,
    includeCompulsory: ['English Language', 'Mathematics'],
    grades: null,
    useGradesFrom: 'ng-waec',
    fact: 'Liberia adopted the WASSCE exam system in 2013.'
  },

  'gm-waec': {
    id: 'gm-waec',
    name: 'The Gambia \u2014 WASSCE/GABECE',
    flag: '\u{1F1EC}\u{1F1F2}',
    gradeScale: 'A1-F9',
    bestOf: 5,
    includeCompulsory: ['English Language', 'Mathematics'],
    grades: null,
    useGradesFrom: 'ng-waec',
    fact: 'The Gambia uses both WASSCE and GABECE (Gambia Basic Education Certificate Exam).'
  },

  'za-nsc': {
    id: 'za-nsc',
    name: 'South Africa \u2014 NSC (Matric)',
    flag: '\u{1F1FF}\u{1F1E6}',
    gradeScale: '1-7',
    bestOf: 6,
    bestOfRule: 'APS from best 6 subjects (excl. Life Orientation)',
    grades: {
      '7': { points: 7, label: 'Outstanding (80\u2013100%)', color: '#10B981' },
      '6': { points: 6, label: 'Meritorious (70\u201379%)', color: '#10B981' },
      '5': { points: 5, label: 'Substantial (60\u201369%)', color: '#3B82F6' },
      '4': { points: 4, label: 'Adequate (50\u201359%)', color: '#F59E0B' },
      '3': { points: 3, label: 'Moderate (40\u201349%)', color: '#F97316' },
      '2': { points: 2, label: 'Elementary (30\u201339%)', color: '#EF4444' },
      '1': { points: 1, label: 'Not Achieved (0\u201329%)', color: '#EF4444' }
    },
    passTypes: [
      { name: 'Bachelor Pass', requirement: 'Min 4 subjects at Level 4+ (50%+), including HL language' },
      { name: 'Diploma Pass', requirement: 'Min 3 subjects at Level 4+ (50%+), plus achievement rating of 3+' },
      { name: 'Higher Certificate', requirement: 'Min NSC pass with achievement rating of 2+ in HL language' }
    ],
    fact: 'South Africa uses APS (Admission Point Score) calculated from your best 6 matric subjects.'
  },

  'ke-kcse': {
    id: 'ke-kcse',
    name: 'Kenya \u2014 KCSE',
    flag: '\u{1F1F0}\u{1F1EA}',
    gradeScale: 'A to E',
    bestOf: 7,
    grades: {
      'A':  { points: 12, label: 'Plain A', color: '#10B981' },
      'A-': { points: 11, label: 'A minus', color: '#10B981' },
      'B+': { points: 10, label: 'B plus', color: '#3B82F6' },
      'B':  { points: 9,  label: 'Plain B', color: '#3B82F6' },
      'B-': { points: 8,  label: 'B minus', color: '#3B82F6' },
      'C+': { points: 7,  label: 'C plus', color: '#F59E0B' },
      'C':  { points: 6,  label: 'Plain C', color: '#F59E0B' },
      'C-': { points: 5,  label: 'C minus', color: '#F59E0B' },
      'D+': { points: 4,  label: 'D plus', color: '#F97316' },
      'D':  { points: 3,  label: 'Plain D', color: '#F97316' },
      'D-': { points: 2,  label: 'D minus', color: '#F97316' },
      'E':  { points: 1,  label: 'E', color: '#EF4444' }
    },
    aggregateRanges: [
      { name: 'A (Excellent)', min: 81, max: 84, color: '#10B981' },
      { name: 'B (Good)', min: 61, max: 80, color: '#3B82F6' },
      { name: 'C (Average)', min: 41, max: 60, color: '#F59E0B' },
      { name: 'D (Below Average)', min: 21, max: 40, color: '#F97316' },
      { name: 'E (Weak)', min: 7, max: 20, color: '#EF4444' }
    ],
    fact: 'Kenya KCSE uses 12 grade levels (A to E) with points from 12 down to 1.'
  },

  'tz-csee': {
    id: 'tz-csee',
    name: 'Tanzania \u2014 CSEE',
    flag: '\u{1F1F9}\u{1F1FF}',
    gradeScale: 'A-F',
    bestOf: 7,
    grades: {
      'A': { points: 1, label: 'Excellent (81\u2013100%)', color: '#10B981' },
      'B': { points: 2, label: 'Very Good (61\u201380%)', color: '#3B82F6' },
      'C': { points: 3, label: 'Good (41\u201360%)', color: '#F59E0B' },
      'D': { points: 4, label: 'Satisfactory (21\u201340%)', color: '#F97316' },
      'F': { points: 5, label: 'Fail (0\u201320%)', color: '#EF4444' }
    },
    divisions: [
      { name: 'Division I', maxPoints: 7, min: 7, max: 17 },
      { name: 'Division II', maxPoints: 17, min: 18, max: 21 },
      { name: 'Division III', maxPoints: 21, min: 22, max: 25 },
      { name: 'Division IV', maxPoints: 25, min: 26, max: 33 },
      { name: 'Division 0 (Fail)', maxPoints: 99, min: 34, max: 35 }
    ],
    fact: 'Tanzania CSEE uses Divisions I\u2013IV, where Division I (7\u201317 pts) is the highest.'
  },

  'ug-uce': {
    id: 'ug-uce',
    name: 'Uganda \u2014 UCE',
    flag: '\u{1F1FA}\u{1F1EC}',
    gradeScale: 'D1-F9',
    bestOf: 8,
    grades: {
      'D1': { points: 1, label: 'Distinction 1', color: '#10B981' },
      'D2': { points: 2, label: 'Distinction 2', color: '#10B981' },
      'C3': { points: 3, label: 'Credit 3', color: '#3B82F6' },
      'C4': { points: 4, label: 'Credit 4', color: '#3B82F6' },
      'C5': { points: 5, label: 'Credit 5', color: '#F59E0B' },
      'C6': { points: 6, label: 'Credit 6', color: '#F59E0B' },
      'P7': { points: 7, label: 'Pass 7', color: '#F97316' },
      'P8': { points: 8, label: 'Pass 8', color: '#F97316' },
      'F9': { points: 9, label: 'Fail', color: '#EF4444' }
    },
    fact: 'Uganda UCE uses D1\u2013F9 grades, similar to WAEC but with D for Distinction.'
  },

  'zw-zimsec': {
    id: 'zw-zimsec',
    name: 'Zimbabwe \u2014 ZIMSEC O-Level',
    flag: '\u{1F1FF}\u{1F1FC}',
    gradeScale: 'A*-U',
    bestOf: 6,
    grades: {
      'A*': { points: 1, label: 'Exceptional', color: '#10B981' },
      'A':  { points: 2, label: 'Very Good', color: '#10B981' },
      'B':  { points: 3, label: 'Good', color: '#3B82F6' },
      'C':  { points: 4, label: 'Satisfactory', color: '#F59E0B' },
      'D':  { points: 5, label: 'Acceptable', color: '#F97316' },
      'E':  { points: 6, label: 'Weak', color: '#F97316' },
      'U':  { points: 9, label: 'Ungraded', color: '#EF4444' }
    },
    fact: 'Zimbabwe ZIMSEC follows the Cambridge-style A*\u2013U grading system.'
  },

  'fr-bac': {
    id: 'fr-bac',
    name: 'Francophone Africa \u2014 Baccalaur\u00e9at',
    flag: '\u{1F30D}',
    gradeScale: '/20',
    inputType: 'score',
    scoreMax: 20,
    grades: null,
    classifications: [
      { name: 'Tr\u00e8s Bien', min: 16, max: 20, color: '#10B981' },
      { name: 'Bien', min: 14, max: 15.99, color: '#3B82F6' },
      { name: 'Assez Bien', min: 12, max: 13.99, color: '#F59E0B' },
      { name: 'Passable', min: 10, max: 11.99, color: '#94A3B8' },
      { name: '\u00C9chec (Fail)', min: 0, max: 9.99, color: '#EF4444' }
    ],
    countries: 'Senegal, C\u00f4te d\'Ivoire, Cameroon (Franco), Mali, Burkina Faso, Niger, Togo, Benin, Guinea, DRC, Congo, Gabon, Chad, CAR, Algeria, Morocco, Tunisia',
    fact: 'Francophone African countries use the /20 Baccalaur\u00e9at scale inherited from the French system.'
  },

  'na-bac': {
    id: 'na-bac',
    name: 'North Africa \u2014 Thanaweya Amma / Bac',
    flag: '\u{1F30D}',
    gradeScale: 'Percentage',
    inputType: 'percentage',
    grades: null,
    classifications: [
      { name: 'Excellent', min: 85, max: 100, color: '#10B981' },
      { name: 'Very Good', min: 75, max: 84.99, color: '#3B82F6' },
      { name: 'Good', min: 65, max: 74.99, color: '#F59E0B' },
      { name: 'Pass', min: 50, max: 64.99, color: '#94A3B8' },
      { name: 'Fail', min: 0, max: 49.99, color: '#EF4444' }
    ],
    countries: 'Egypt, Libya, Sudan',
    fact: 'Egypt\'s Thanaweya Amma requires 50%+ to pass, with 85%+ for top-tier university admission.'
  }
};

/* Helper: resolve shared grades */
(function() {
  for (var key in WAEC_EXAM_SYSTEMS) {
    var sys = WAEC_EXAM_SYSTEMS[key];
    if (sys.useGradesFrom && !sys.grades) {
      var src = WAEC_EXAM_SYSTEMS[sys.useGradesFrom];
      if (src) {
        sys.grades = src.grades;
        sys.aggregateRanges = src.aggregateRanges;
        sys.minCredit = src.minCredit;
      }
    }
  }
})();

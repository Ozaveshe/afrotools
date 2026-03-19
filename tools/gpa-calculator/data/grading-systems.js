/* AfroTools GPA Calculator — Grading Systems Data
   9 African university grading systems with full configuration.
   Loaded as: window.GPA_GRADING_SYSTEMS */

var GPA_GRADING_SYSTEMS = {
  'nigerian-federal': {
    id: 'nigerian-federal',
    name: 'Nigerian Federal/State Universities (5.0 Scale)',
    flag: '\u{1F1F3}\u{1F1EC}',
    scale: 5.0,
    inputType: 'grade',
    creditRange: [1, 6],
    grades: {
      'A':  { points: 5.0, min: 70, max: 100, color: '#10B981' },
      'B':  { points: 4.0, min: 60, max: 69,  color: '#10B981' },
      'C':  { points: 3.0, min: 50, max: 59,  color: '#F59E0B' },
      'D':  { points: 2.0, min: 45, max: 49,  color: '#F59E0B' },
      'E':  { points: 1.0, min: 40, max: 44,  color: '#F97316' },
      'F':  { points: 0.0, min: 0,  max: 39,  color: '#EF4444' }
    },
    classes: [
      { name: 'First Class',          min: 4.50, max: 5.00, color: '#10B981', icon: '\u{1F3C6}' },
      { name: 'Second Class Upper',   min: 3.50, max: 4.49, color: '#3B82F6', icon: '\u{1F31F}' },
      { name: 'Second Class Lower',   min: 2.40, max: 3.49, color: '#F59E0B', icon: '\u{1F4DA}' },
      { name: 'Third Class',          min: 1.50, max: 2.39, color: '#F97316', icon: '\u{1F4D6}' },
      { name: 'Pass',                 min: 1.00, max: 1.49, color: '#94A3B8', icon: '\u2705' },
      { name: 'Fail',                 min: 0,    max: 0.99, color: '#EF4444', icon: '\u274C' }
    ],
    fact: 'CGPA of 4.5+ qualifies you for First Class honours in Nigerian federal universities.'
  },

  'nigerian-private': {
    id: 'nigerian-private',
    name: 'Nigerian Private Universities (4.0 Scale)',
    flag: '\u{1F1F3}\u{1F1EC}',
    scale: 4.0,
    inputType: 'grade',
    creditRange: [1, 6],
    grades: {
      'A':  { points: 4.0, min: 70, max: 100, color: '#10B981' },
      'B+': { points: 3.5, min: 65, max: 69,  color: '#10B981' },
      'B':  { points: 3.0, min: 60, max: 64,  color: '#3B82F6' },
      'C+': { points: 2.5, min: 55, max: 59,  color: '#F59E0B' },
      'C':  { points: 2.0, min: 50, max: 54,  color: '#F59E0B' },
      'D':  { points: 1.0, min: 45, max: 49,  color: '#F97316' },
      'F':  { points: 0.0, min: 0,  max: 44,  color: '#EF4444' }
    },
    classes: [
      { name: 'First Class',          min: 3.60, max: 4.00, color: '#10B981', icon: '\u{1F3C6}' },
      { name: 'Second Class Upper',   min: 3.00, max: 3.59, color: '#3B82F6', icon: '\u{1F31F}' },
      { name: 'Second Class Lower',   min: 2.50, max: 2.99, color: '#F59E0B', icon: '\u{1F4DA}' },
      { name: 'Third Class',          min: 2.00, max: 2.49, color: '#F97316', icon: '\u{1F4D6}' },
      { name: 'Pass',                 min: 1.00, max: 1.99, color: '#94A3B8', icon: '\u2705' },
      { name: 'Fail',                 min: 0,    max: 0.99, color: '#EF4444', icon: '\u274C' }
    ],
    fact: 'Private universities in Nigeria use a 4.0 scale, similar to the US grading system.'
  },

  'kenyan': {
    id: 'kenyan',
    name: 'Kenyan Universities (4.0 with +/-)',
    flag: '\u{1F1F0}\u{1F1EA}',
    scale: 4.0,
    inputType: 'grade',
    creditRange: [1, 6],
    grades: {
      'A':  { points: 4.0, min: 75, max: 100, color: '#10B981' },
      'A-': { points: 3.7, min: 73, max: 74,  color: '#10B981' },
      'B+': { points: 3.3, min: 70, max: 72,  color: '#3B82F6' },
      'B':  { points: 3.0, min: 65, max: 69,  color: '#3B82F6' },
      'B-': { points: 2.7, min: 60, max: 64,  color: '#3B82F6' },
      'C+': { points: 2.3, min: 55, max: 59,  color: '#F59E0B' },
      'C':  { points: 2.0, min: 50, max: 54,  color: '#F59E0B' },
      'C-': { points: 1.7, min: 45, max: 49,  color: '#F97316' },
      'D+': { points: 1.3, min: 42, max: 44,  color: '#F97316' },
      'D':  { points: 1.0, min: 40, max: 41,  color: '#F97316' },
      'D-': { points: 0.7, min: 35, max: 39,  color: '#EF4444' },
      'E':  { points: 0.0, min: 0,  max: 34,  color: '#EF4444' }
    },
    classes: [
      { name: 'First Class Honours',  min: 3.60, max: 4.00, color: '#10B981', icon: '\u{1F3C6}' },
      { name: 'Second Class Upper',   min: 3.00, max: 3.59, color: '#3B82F6', icon: '\u{1F31F}' },
      { name: 'Second Class Lower',   min: 2.50, max: 2.99, color: '#F59E0B', icon: '\u{1F4DA}' },
      { name: 'Pass',                 min: 2.00, max: 2.49, color: '#94A3B8', icon: '\u2705' },
      { name: 'Fail',                 min: 0,    max: 1.99, color: '#EF4444', icon: '\u274C' }
    ],
    fact: 'Kenyan universities use +/- grades for finer differentiation, with 12 grade options.'
  },

  'ghanaian': {
    id: 'ghanaian',
    name: 'Ghanaian Universities (KNUST/UG/UCC)',
    flag: '\u{1F1EC}\u{1F1ED}',
    scale: 4.0,
    inputType: 'grade',
    creditRange: [1, 4],
    grades: {
      'A':  { points: 4.0, min: 80, max: 100, color: '#10B981' },
      'B+': { points: 3.5, min: 75, max: 79,  color: '#10B981' },
      'B':  { points: 3.0, min: 70, max: 74,  color: '#3B82F6' },
      'C+': { points: 2.5, min: 65, max: 69,  color: '#F59E0B' },
      'C':  { points: 2.0, min: 60, max: 64,  color: '#F59E0B' },
      'D+': { points: 1.5, min: 55, max: 59,  color: '#F97316' },
      'D':  { points: 1.0, min: 50, max: 54,  color: '#F97316' },
      'F':  { points: 0.0, min: 0,  max: 49,  color: '#EF4444' }
    },
    classes: [
      { name: 'First Class',          min: 3.60, max: 4.00, color: '#10B981', icon: '\u{1F3C6}' },
      { name: 'Second Class Upper',   min: 3.00, max: 3.59, color: '#3B82F6', icon: '\u{1F31F}' },
      { name: 'Second Class Lower',   min: 2.50, max: 2.99, color: '#F59E0B', icon: '\u{1F4DA}' },
      { name: 'Third Class',          min: 2.00, max: 2.49, color: '#F97316', icon: '\u{1F4D6}' },
      { name: 'Fail',                 min: 0,    max: 1.99, color: '#EF4444', icon: '\u274C' }
    ],
    fact: 'KNUST, UG, and UCC all use the same 4.0 grading scale across Ghana.'
  },

  'south-african': {
    id: 'south-african',
    name: 'South African Universities (Percentage)',
    flag: '\u{1F1FF}\u{1F1E6}',
    scale: 100,
    inputType: 'percentage',
    creditRange: [1, 48],
    grades: null,
    percentToGPA4: function(pct) {
      if (pct >= 75) return 4.0;
      if (pct >= 70) return 3.5;
      if (pct >= 60) return 3.0;
      if (pct >= 50) return 2.0;
      return 0.0;
    },
    classes: [
      { name: 'Distinction',   min: 75, max: 100, color: '#10B981', icon: '\u{1F3C6}' },
      { name: 'Merit',         min: 70, max: 74,  color: '#3B82F6', icon: '\u{1F31F}' },
      { name: 'Credit',        min: 60, max: 69,  color: '#F59E0B', icon: '\u{1F4DA}' },
      { name: 'Pass',          min: 50, max: 59,  color: '#94A3B8', icon: '\u2705' },
      { name: 'Fail',          min: 0,  max: 49,  color: '#EF4444', icon: '\u274C' }
    ],
    fact: 'South African universities use percentage grades directly — 75%+ is a Distinction.'
  },

  'east-african': {
    id: 'east-african',
    name: 'East African (Uganda/Rwanda/Tanzania)',
    flag: '\u{1F30D}',
    scale: 5.0,
    inputType: 'grade',
    creditRange: [1, 6],
    grades: {
      'A':  { points: 5.0, min: 80, max: 100, color: '#10B981' },
      'B+': { points: 4.0, min: 75, max: 79,  color: '#10B981' },
      'B':  { points: 3.5, min: 65, max: 74,  color: '#3B82F6' },
      'C+': { points: 3.0, min: 60, max: 64,  color: '#F59E0B' },
      'C':  { points: 2.5, min: 55, max: 59,  color: '#F59E0B' },
      'C-': { points: 2.0, min: 50, max: 54,  color: '#F97316' },
      'D':  { points: 1.5, min: 40, max: 49,  color: '#F97316' },
      'F':  { points: 0.0, min: 0,  max: 39,  color: '#EF4444' }
    },
    classes: [
      { name: 'First Class',          min: 4.40, max: 5.00, color: '#10B981', icon: '\u{1F3C6}' },
      { name: 'Second Class Upper',   min: 3.60, max: 4.39, color: '#3B82F6', icon: '\u{1F31F}' },
      { name: 'Second Class Lower',   min: 2.80, max: 3.59, color: '#F59E0B', icon: '\u{1F4DA}' },
      { name: 'Pass',                 min: 2.00, max: 2.79, color: '#94A3B8', icon: '\u2705' },
      { name: 'Fail',                 min: 0,    max: 1.99, color: '#EF4444', icon: '\u274C' }
    ],
    fact: 'East African universities follow similar grading across Uganda, Rwanda, and Tanzania.'
  },

  'ethiopian': {
    id: 'ethiopian',
    name: 'Ethiopian Universities (4.0)',
    flag: '\u{1F1EA}\u{1F1F9}',
    scale: 4.0,
    inputType: 'grade',
    creditRange: [1, 5],
    grades: {
      'A+': { points: 4.0,  min: 90, max: 100, color: '#10B981' },
      'A':  { points: 4.0,  min: 85, max: 89,  color: '#10B981' },
      'A-': { points: 3.75, min: 80, max: 84,  color: '#10B981' },
      'B+': { points: 3.5,  min: 75, max: 79,  color: '#3B82F6' },
      'B':  { points: 3.0,  min: 70, max: 74,  color: '#3B82F6' },
      'B-': { points: 2.75, min: 65, max: 69,  color: '#3B82F6' },
      'C+': { points: 2.5,  min: 60, max: 64,  color: '#F59E0B' },
      'C':  { points: 2.0,  min: 50, max: 59,  color: '#F59E0B' },
      'C-': { points: 1.75, min: 45, max: 49,  color: '#F97316' },
      'D':  { points: 1.0,  min: 40, max: 44,  color: '#F97316' },
      'F':  { points: 0.0,  min: 0,  max: 39,  color: '#EF4444' }
    },
    classes: [
      { name: 'Great Distinction',  min: 3.75, max: 4.00, color: '#10B981', icon: '\u{1F3C6}' },
      { name: 'Distinction',        min: 3.50, max: 3.74, color: '#3B82F6', icon: '\u{1F31F}' },
      { name: 'Very Great Credit',  min: 3.00, max: 3.49, color: '#F59E0B', icon: '\u{1F4DA}' },
      { name: 'Great Credit',       min: 2.50, max: 2.99, color: '#F97316', icon: '\u{1F4D6}' },
      { name: 'Pass',               min: 2.00, max: 2.49, color: '#94A3B8', icon: '\u2705' },
      { name: 'Fail',               min: 0,    max: 1.99, color: '#EF4444', icon: '\u274C' }
    ],
    fact: 'Ethiopian universities have higher grade cutoffs \u2014 you need 85%+ for a straight A.'
  },

  'francophone': {
    id: 'francophone',
    name: 'Francophone Africa (Score /20)',
    flag: '\u{1F30D}',
    scale: 20,
    inputType: 'score',
    scoreMax: 20,
    creditRange: [1, 10],
    grades: null,
    scoreToLabel: function(score) {
      if (score >= 16) return 'Tr\u00e8s Bien';
      if (score >= 14) return 'Bien';
      if (score >= 12) return 'Assez Bien';
      if (score >= 10) return 'Passable';
      return 'Insuffisant';
    },
    classes: [
      { name: 'Tr\u00e8s Bien (Excellent)',   min: 16, max: 20, color: '#10B981', icon: '\u{1F3C6}' },
      { name: 'Bien (Good)',                   min: 14, max: 15.99, color: '#3B82F6', icon: '\u{1F31F}' },
      { name: 'Assez Bien (Fairly Good)',      min: 12, max: 13.99, color: '#F59E0B', icon: '\u{1F4DA}' },
      { name: 'Passable (Satisfactory)',       min: 10, max: 11.99, color: '#94A3B8', icon: '\u2705' },
      { name: 'Insuffisant (Fail)',            min: 0,  max: 9.99,  color: '#EF4444', icon: '\u274C' }
    ],
    fact: 'Francophone African universities use the /20 scale inherited from the French education system \u2014 14/20 is considered Very Good.'
  },

  'egyptian': {
    id: 'egyptian',
    name: 'Egyptian Universities (Percentage)',
    flag: '\u{1F1EA}\u{1F1EC}',
    scale: 100,
    inputType: 'percentage',
    creditRange: [1, 6],
    grades: null,
    percentToGPA4: function(pct) {
      if (pct >= 85) return 4.0;
      if (pct >= 75) return 3.5;
      if (pct >= 65) return 3.0;
      if (pct >= 50) return 2.0;
      return 0.0;
    },
    classes: [
      { name: 'Excellent (Mumtaz)',      min: 85, max: 100, color: '#10B981', icon: '\u{1F3C6}' },
      { name: 'Very Good (Jayyed Jiddan)', min: 75, max: 84,  color: '#3B82F6', icon: '\u{1F31F}' },
      { name: 'Good (Jayyed)',           min: 65, max: 74,  color: '#F59E0B', icon: '\u{1F4DA}' },
      { name: 'Pass (Maqbool)',          min: 50, max: 64,  color: '#94A3B8', icon: '\u2705' },
      { name: 'Fail (Rasib)',            min: 0,  max: 49,  color: '#EF4444', icon: '\u274C' }
    ],
    fact: 'Egyptian universities require 85%+ for an Excellent (Mumtaz) classification.'
  }
};

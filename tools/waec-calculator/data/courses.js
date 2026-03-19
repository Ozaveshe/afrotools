/* AfroTools WAEC Calculator — Course Requirements Data
   University course admission requirements.
   Loaded as: window.WAEC_COURSES */

var WAEC_COURSES = {
  sciences: {
    label: 'Sciences',
    courses: [
      { id: 'medicine', name: 'Medicine & Surgery', required: ['English Language', 'Mathematics', 'Biology', 'Chemistry', 'Physics'], minGrade: 'C6', jambSubjects: ['English', 'Biology', 'Chemistry', 'Physics'], typicalCutoff: 250 },
      { id: 'pharmacy', name: 'Pharmacy', required: ['English Language', 'Mathematics', 'Biology', 'Chemistry', 'Physics'], minGrade: 'C6', jambSubjects: ['English', 'Biology', 'Chemistry', 'Physics/Mathematics'], typicalCutoff: 230 },
      { id: 'nursing', name: 'Nursing Science', required: ['English Language', 'Mathematics', 'Biology', 'Chemistry', 'Physics'], minGrade: 'C6', jambSubjects: ['English', 'Biology', 'Chemistry', 'Physics'], typicalCutoff: 200 },
      { id: 'dentistry', name: 'Dentistry', required: ['English Language', 'Mathematics', 'Biology', 'Chemistry', 'Physics'], minGrade: 'C6', jambSubjects: ['English', 'Biology', 'Chemistry', 'Physics'], typicalCutoff: 240 },
      { id: 'medlab', name: 'Medical Laboratory Science', required: ['English Language', 'Mathematics', 'Biology', 'Chemistry', 'Physics'], minGrade: 'C6', jambSubjects: ['English', 'Biology', 'Chemistry', 'Physics'], typicalCutoff: 200 },
      { id: 'physio', name: 'Physiotherapy', required: ['English Language', 'Mathematics', 'Biology', 'Chemistry', 'Physics'], minGrade: 'C6', jambSubjects: ['English', 'Biology', 'Chemistry', 'Physics'], typicalCutoff: 220 },
      { id: 'vetmed', name: 'Veterinary Medicine', required: ['English Language', 'Mathematics', 'Biology', 'Chemistry', 'Physics'], minGrade: 'C6', jambSubjects: ['English', 'Biology', 'Chemistry', 'Physics'], typicalCutoff: 200 },
      { id: 'optometry', name: 'Optometry', required: ['English Language', 'Mathematics', 'Biology', 'Chemistry', 'Physics'], minGrade: 'C6', jambSubjects: ['English', 'Biology', 'Chemistry', 'Physics'], typicalCutoff: 210 }
    ]
  },
  engineering: {
    label: 'Engineering',
    courses: [
      { id: 'civil', name: 'Civil Engineering', required: ['English Language', 'Mathematics', 'Physics', 'Chemistry'], minGrade: 'C6', jambSubjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], typicalCutoff: 200 },
      { id: 'mechanical', name: 'Mechanical Engineering', required: ['English Language', 'Mathematics', 'Physics', 'Chemistry'], minGrade: 'C6', jambSubjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], typicalCutoff: 200 },
      { id: 'electrical', name: 'Electrical/Electronic Engineering', required: ['English Language', 'Mathematics', 'Physics', 'Chemistry'], minGrade: 'C6', jambSubjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], typicalCutoff: 210 },
      { id: 'chemical', name: 'Chemical Engineering', required: ['English Language', 'Mathematics', 'Physics', 'Chemistry'], minGrade: 'C6', jambSubjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], typicalCutoff: 210 },
      { id: 'petroleum', name: 'Petroleum Engineering', required: ['English Language', 'Mathematics', 'Physics', 'Chemistry'], minGrade: 'C6', jambSubjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], typicalCutoff: 220 },
      { id: 'computer-eng', name: 'Computer Engineering', required: ['English Language', 'Mathematics', 'Physics', 'Chemistry'], minGrade: 'C6', jambSubjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], typicalCutoff: 200 },
      { id: 'agric-eng', name: 'Agricultural Engineering', required: ['English Language', 'Mathematics', 'Physics', 'Chemistry'], minGrade: 'C6', jambSubjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], typicalCutoff: 180 },
      { id: 'mechatronics', name: 'Mechatronics Engineering', required: ['English Language', 'Mathematics', 'Physics', 'Chemistry'], minGrade: 'C6', jambSubjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], typicalCutoff: 200 }
    ]
  },
  technology: {
    label: 'Technology',
    courses: [
      { id: 'cs', name: 'Computer Science', required: ['English Language', 'Mathematics', 'Physics'], minGrade: 'C6', jambSubjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], typicalCutoff: 200 },
      { id: 'softeng', name: 'Software Engineering', required: ['English Language', 'Mathematics', 'Physics'], minGrade: 'C6', jambSubjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], typicalCutoff: 200 },
      { id: 'cybersec', name: 'Cyber Security', required: ['English Language', 'Mathematics', 'Physics'], minGrade: 'C6', jambSubjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], typicalCutoff: 190 },
      { id: 'it', name: 'Information Technology', required: ['English Language', 'Mathematics'], minGrade: 'C6', jambSubjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], typicalCutoff: 180 },
      { id: 'datascience', name: 'Data Science', required: ['English Language', 'Mathematics', 'Physics'], minGrade: 'C6', jambSubjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], typicalCutoff: 200 }
    ]
  },
  social: {
    label: 'Social Sciences',
    courses: [
      { id: 'economics', name: 'Economics', required: ['English Language', 'Mathematics', 'Economics'], minGrade: 'C6', jambSubjects: ['English', 'Mathematics', 'Economics', 'Government'], typicalCutoff: 200 },
      { id: 'accounting', name: 'Accounting', required: ['English Language', 'Mathematics', 'Economics'], minGrade: 'C6', jambSubjects: ['English', 'Mathematics', 'Economics', 'Accounting'], typicalCutoff: 200 },
      { id: 'bizadmin', name: 'Business Administration', required: ['English Language', 'Mathematics', 'Economics'], minGrade: 'C6', jambSubjects: ['English', 'Mathematics', 'Economics', 'Government'], typicalCutoff: 190 },
      { id: 'banking', name: 'Banking & Finance', required: ['English Language', 'Mathematics', 'Economics'], minGrade: 'C6', jambSubjects: ['English', 'Mathematics', 'Economics', 'Accounting'], typicalCutoff: 180 },
      { id: 'polsci', name: 'Political Science', required: ['English Language', 'Government'], minGrade: 'C6', jambSubjects: ['English', 'Government', 'Economics', 'History/CRS'], typicalCutoff: 200 },
      { id: 'intrel', name: 'International Relations', required: ['English Language', 'Government'], minGrade: 'C6', jambSubjects: ['English', 'Government', 'Economics', 'History'], typicalCutoff: 200 },
      { id: 'masscomm', name: 'Mass Communication', required: ['English Language', 'Government'], minGrade: 'C6', jambSubjects: ['English', 'Government', 'Economics', 'Literature'], typicalCutoff: 200 },
      { id: 'sociology', name: 'Sociology', required: ['English Language', 'Government'], minGrade: 'C6', jambSubjects: ['English', 'Government', 'Economics', 'CRS/IRS'], typicalCutoff: 180 },
      { id: 'psychology', name: 'Psychology', required: ['English Language', 'Biology'], minGrade: 'C6', jambSubjects: ['English', 'Biology', 'Chemistry', 'Physics/Mathematics'], typicalCutoff: 200 },
      { id: 'pubadmin', name: 'Public Administration', required: ['English Language', 'Government'], minGrade: 'C6', jambSubjects: ['English', 'Government', 'Economics', 'Mathematics'], typicalCutoff: 180 }
    ]
  },
  law: {
    label: 'Law',
    courses: [
      { id: 'law', name: 'Law (LL.B)', required: ['English Language', 'Literature in English'], minGrade: 'C6', jambSubjects: ['English', 'Literature', 'Government', 'Economics/CRS'], typicalCutoff: 250 }
    ]
  },
  arts: {
    label: 'Arts & Humanities',
    courses: [
      { id: 'english', name: 'English & Literary Studies', required: ['English Language', 'Literature in English'], minGrade: 'C6', jambSubjects: ['English', 'Literature', 'Government', 'History/CRS'], typicalCutoff: 200 },
      { id: 'history', name: 'History & International Studies', required: ['English Language', 'Government', 'History'], minGrade: 'C6', jambSubjects: ['English', 'History', 'Government', 'Economics'], typicalCutoff: 180 },
      { id: 'philosophy', name: 'Philosophy', required: ['English Language', 'Government'], minGrade: 'C6', jambSubjects: ['English', 'Government', 'CRS/IRS', 'Literature'], typicalCutoff: 180 },
      { id: 'theatre', name: 'Theatre Arts', required: ['English Language', 'Literature in English'], minGrade: 'C6', jambSubjects: ['English', 'Literature', 'Government', 'CRS/IRS'], typicalCutoff: 180 }
    ]
  },
  environmental: {
    label: 'Environmental Sciences',
    courses: [
      { id: 'architecture', name: 'Architecture', required: ['English Language', 'Mathematics', 'Physics'], minGrade: 'C6', jambSubjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], typicalCutoff: 200 },
      { id: 'estate', name: 'Estate Management', required: ['English Language', 'Mathematics', 'Economics'], minGrade: 'C6', jambSubjects: ['English', 'Mathematics', 'Economics', 'Geography'], typicalCutoff: 180 },
      { id: 'building', name: 'Building Technology', required: ['English Language', 'Mathematics', 'Physics'], minGrade: 'C6', jambSubjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], typicalCutoff: 180 },
      { id: 'qs', name: 'Quantity Surveying', required: ['English Language', 'Mathematics', 'Physics'], minGrade: 'C6', jambSubjects: ['English', 'Mathematics', 'Physics', 'Chemistry/Economics'], typicalCutoff: 180 }
    ]
  },
  agriculture: {
    label: 'Agriculture',
    courses: [
      { id: 'agric', name: 'Agriculture', required: ['English Language', 'Mathematics', 'Chemistry', 'Biology'], minGrade: 'C6', jambSubjects: ['English', 'Chemistry', 'Biology', 'Mathematics/Physics'], typicalCutoff: 160 },
      { id: 'foodsci', name: 'Food Science & Technology', required: ['English Language', 'Mathematics', 'Chemistry', 'Biology'], minGrade: 'C6', jambSubjects: ['English', 'Chemistry', 'Biology', 'Mathematics/Physics'], typicalCutoff: 170 }
    ]
  },
  education: {
    label: 'Education',
    courses: [
      { id: 'education', name: 'Education (Various)', required: ['English Language', 'Mathematics'], minGrade: 'C6', jambSubjects: ['English', 'Mathematics/Government', 'Subject 1', 'Subject 2'], typicalCutoff: 160 }
    ]
  }
};

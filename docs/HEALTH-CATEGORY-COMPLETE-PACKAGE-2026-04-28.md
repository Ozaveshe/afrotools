# Health Category Complete Package Pass

Review date: 28 April 2026

Scope: `/health/` homepage plus every English registry-backed Health app. Registry count verified at 42 apps.

What changed:

- Rebuilt the homepage as a workflow entry point with six Health journeys.
- Added a distinct competitor-informed action kit to every Health app.
- Added a shared Health workflow runtime for dashboard saves, email-gated PDF plans, and cross-tool continuation.
- Improved generated Health app form semantics with names, required fields, input modes, and result snapshots for saved plans.
- Connected local Health plans into the dashboard workspace while keeping account sync honest and opportunistic.

App-by-app pass:

| Tool ID | App | Bucket | Competitor or benchmark checked | Implemented improvement | Source |
| --- | --- | --- | --- | --- | --- |
| medical-report | Medical Report Interpreter | labs | Ada and lab-analyzer style apps | Added private dashboard/PDF actions, clinic-question framing, and a source-backed benchmark block. | https://www.cdc.gov/sickle-cell/about/index.html |
| bmi-calculator | BMI Calculator for Africans | vitals | NHS BMI calculator | Added a saveable BMI plan with waist follow-up, dashboard storage, and gated PDF export. | https://www.nhs.uk/health-assessment-tools/calculate-your-body-mass-index/calculate-bmi-for-adults |
| due-date | Pregnancy Due Date Calculator | family | BabyCenter and NHS due-date tools | Added family-health workflow routing, PDF visit-prep output, and dashboard continuity. | https://www.who.int/publications/i/item/9789241549912 |
| calorie-counter | Calorie Counter (African Foods) | nutrition | MyFitnessPal | Added nutrition workflow saving so African-food calorie results can become a weekly plan. | https://www.who.int/news-room/fact-sheets/detail/healthy-diet |
| malaria-risk | Malaria Risk by Region | clinical | CDC and WHO travel-health checkers | Added clinical-safety workflow actions, source-backed escalation, and dashboard handoff. | https://www.who.int/news-room/fact-sheets/detail/malaria |
| ovulation-calc | Ovulation & Fertility Calculator | family | Flo and Clue | Added family-health workflow routing plus dashboard/PDF actions for appointment planning. | https://www.who.int/publications/i/item/9789241549912 |
| drug-dosage | Medication Dosage Calculator | clinical | Medscape and Epocrates | Added stricter workflow copy, save/PDF actions, and a medication-verification benchmark block. | https://www.who.int/groups/expert-committee-on-selection-and-use-of-essential-medicines/essential-medicines-lists |
| water-quality | Water Safety Checker | clinical | WHO water-safety checklists | Added clinical-safety workflow routing with PDF checklist and dashboard capture. | https://www.who.int/news-room/fact-sheets/detail/drinking-water |
| water-intake | Water Intake Calculator | vitals | Mayo-style hydration calculators | Added vitals workflow save/PDF actions and repeat-check dashboard storage. | https://www.who.int/news-room/fact-sheets/detail/drinking-water |
| vaccine-schedule | African Child Vaccine Schedule | family | CDC immunization schedule app | Added family-health PDF planning and dashboard handoff around local clinic confirmation. | https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-age.html |
| waist-hip-ratio | Waist-Hip Ratio Calculator | vitals | WHO and NHS body-measurement guidance | Added vitals workflow actions and PDF export for trend tracking. | https://www.nhs.uk/health-assessment-tools/calculate-your-body-mass-index/calculate-bmi-for-adults |
| blood-pressure | Blood Pressure Tracker | vitals | American Heart Association BP trackers | Added dashboard/PDF report actions and vitals workflow continuity. | https://www.who.int/news-room/fact-sheets/detail/hypertension |
| hospital-cost | African Hospital Cost Estimator | costs | Healthcare Bluebook | Added care-cost workflow, quote-proof prompts, and email-gated PDF plan. | https://healthcarebluebook.com/ |
| clinic-costs | Clinic Costs | costs | Healthcare Bluebook and local clinic quote tools | Added care-cost workflow saving and dashboard review prompts for community price intelligence. | https://healthcarebluebook.com/ |
| pharmacy-prices | Pharmacy Prices | costs | GoodRx | Added GoodRx-style benchmark prompts, PDF gate, and dashboard continuity. | https://www.goodrx.com/ |
| sickle-cell | Sickle Cell Genotype Advisor | labs | CDC sickle cell resources | Added labs workflow routing and a saveable questions-for-clinic plan. | https://www.cdc.gov/sickle-cell/about/index.html |
| diabetes-risk | Diabetes Risk Calculator | vitals | ADA diabetes risk test | Added ADA-style benchmark framing plus vitals workflow dashboard/PDF actions. | https://diabetes.org/diabetes-risk-test |
| bmi-calc-tools | BMI Calculator | vitals | CDC adult BMI categories | Added dashboard/PDF plan actions and related vitals workflow links. | https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html |
| calorie-counter-tools | African Food Calorie Counter | nutrition | MyFitnessPal | Added nutrition workflow save/PDF actions and next-tool routing. | https://www.who.int/news-room/fact-sheets/detail/healthy-diet |
| due-date-tools | Pregnancy Due Date Calculator | family | NHS due-date guidance | Added family-health workflow save/PDF actions and milestone planning prompts. | https://www.who.int/publications/i/item/9789241549912 |
| genotype-checker | Genotype Compatibility Checker | labs | Premarital genotype counselling tools | Added labs workflow plan, red-flag copy, and dashboard/PDF actions. | https://www.cdc.gov/sickle-cell/about/index.html |
| blood-group | Blood Group Compatibility Checker | labs | Blood compatibility references | Added labs workflow handoff, clinic-question prompts, and gated PDF export. | https://www.who.int/publications/i/item/9789241549912 |
| maternal-mortality | Maternal Mortality Risk Assessment | family | WHO antenatal risk guidance | Added family-health workflow save/PDF actions and urgent-warning framing. | https://www.who.int/publications/i/item/9789241549912 |
| childbirth-cost | Childbirth Cost Calculator | family | Hospital cost estimators | Added care and family workflow routing with PDF budget capture. | https://healthcarebluebook.com/ |
| csection-vs-natural | C-Section vs Natural Birth Cost | family | Procedure cost comparison tools | Added family-health PDF planning and dashboard save actions. | https://www.who.int/publications/i/item/9789241549912 |
| dental-cost | Dental Procedure Cost Estimator | costs | Dental procedure cost estimators | Added care-cost workflow capture and quote-proof PDF output. | https://healthcarebluebook.com/ |
| drug-price-compare | Drug/Medicine Price Comparator | costs | GoodRx | Added medicine-price benchmark block plus dashboard/PDF handoff. | https://www.goodrx.com/ |
| traditional-vs-western | Traditional vs Western Medicine Cost | costs | Cost-effectiveness comparison tools | Added care-cost workflow routing and clinician-review PDF notes. | https://www.who.int/groups/expert-committee-on-selection-and-use-of-essential-medicines/essential-medicines-lists |
| african-meal-plan | African Meal Plan Generator | nutrition | Cronometer and meal planner apps | Added nutrition workflow save/PDF actions and local-plate checklist. | https://www.who.int/news-room/fact-sheets/detail/healthy-diet |
| child-growth | Child Growth Chart (WHO + African Context) | family | WHO child growth standards | Added family-health dashboard/PDF plan and WHO benchmark block. | https://www.who.int/tools/child-growth-standards |
| hiv-treatment-cost | HIV/AIDS Treatment Cost Calculator | clinical | MyTherapy medication reminder app | Added clinical workflow save/PDF actions and adherence-oriented dashboard plan. | https://www.who.int/news-room/fact-sheets/detail/hiv-aids |
| tb-tracker | Tuberculosis Treatment Tracker | clinical | MyTherapy and TB adherence trackers | Added clinical workflow capture with dashboard/PDF tracker output. | https://www.who.int/news-room/fact-sheets/detail/tuberculosis |
| cholera-risk | Cholera Risk Assessment Tool | clinical | WHO cholera guidance | Added clinical-safety workflow with gated PDF checklist. | https://www.who.int/news-room/fact-sheets/detail/cholera |
| ebola-checklist | Ebola Preparedness Checklist | clinical | WHO Ebola guidance | Added clinical-safety workflow capture and PDF checklist. | https://www.who.int/news-room/fact-sheets/detail/ebola-disease |
| hep-b-screening | Hepatitis B Screening Cost Estimator | clinical | WHO Hepatitis B guidance | Added clinical workflow save/PDF plan and source-backed screening prompts. | https://www.who.int/news-room/fact-sheets/detail/hepatitis-b |
| medical-tourism | Medical Tourism Cost Comparator | costs | CDC medical tourism guidance | Added care-cost workflow save/PDF actions and CDC-style safety prompts. | https://wwwnc.cdc.gov/travel/page/medical-tourism |
| eye-care-cost | Eye Care Cost Calculator | costs | Warby Parker and optical cost tools | Added care-cost workflow capture and quote-proof PDF output. | https://healthcarebluebook.com/ |
| mental-health-cost | Mental Health Service Cost Finder | costs | BetterHelp and therapy marketplace flows | Added care-cost workflow saving and a PDF plan with crisis-care limits. | https://www.who.int/news-room/fact-sheets/detail/mental-health-strengthening-our-response |
| pregnancy-nutrition | Pregnancy Nutrition Calculator (African Diet) | family | BabyCenter nutrition trackers | Added family and nutrition workflow actions plus PDF visit prep. | https://www.who.int/news-room/fact-sheets/detail/healthy-diet |
| breastfeeding-tracker | Breastfeeding Tracker | family | Baby tracking apps | Added family-health dashboard/PDF capture around feeding-session logs. | https://www.who.int/news-room/fact-sheets/detail/breastfeeding |
| gym-cost-compare | Gym Membership Cost Comparator | nutrition | Gym comparison and fitness apps | Added nutrition/activity workflow save/PDF actions. | https://www.who.int/news-room/fact-sheets/detail/physical-activity |
| home-workout | Home Workout Calorie Burner | nutrition | Nike Training Club and Fitbod | Added nutrition/activity workflow capture and PDF habit plan. | https://www.who.int/news-room/fact-sheets/detail/physical-activity |

Dashboard and capture behavior:

- `assets/js/health-workflow.js` stores Health plans in `localStorage.afro_health_plans` and sends a workspace upsert only when the shared account workspace API is available.
- PDF export is gated by a lightweight Health email modal and posts to `/api/capture-lead` with `source=health-pdf-gate`.
- The dashboard reads the Health plan cache as a first-class workspace tab and action-center signal.

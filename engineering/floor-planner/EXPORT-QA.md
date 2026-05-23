# Floor Planner Export QA

Run this checklist before shipping export changes on `/engineering/floor-planner/`.

1. Open the planner and load a template with at least three rooms, doors, windows, and one site object.
2. Click `PNG` and confirm the download contains only the plan canvas, labels, and dimensions. The sidebar, toolbar, chat, modals, and bottom action bar must not appear.
3. Click `PDF` and confirm the file includes AfroTools branding, project title, country, city, currency, generation date, plan image, schedules, BOQ summary, detailed BOQ, price sources, assumptions, confidence notes, and disclaimer.
4. Disconnect the PDF library or block `/assets/vendor/jspdf/jspdf.umd.min.js`, click `PDF`, and confirm the fallback modal offers printable HTML, PNG, and BOQ CSV.
5. Click `BOQ` and verify the preview opens with PDF, CSV, XLSX, and Printable HTML actions. Missing prices must still export quantities with warning text.
6. Export BOQ CSV and check it opens in a spreadsheet with item, quantity, unit, rate, amount, source, and note columns.
7. Export BOQ XLSX where SheetJS is available. If unavailable, confirm the UI shows a polished error and CSV remains available.
8. Click `Print` from the Engineering Pack area and confirm the printable report hides the editor UI and page-breaks cleanly between plan, schedules, and BOQ.
9. Confirm no browser `alert()` appears and no visible export button silently fails.
10. Check mobile width around 390px: export buttons must remain tappable and fallback modals must fit without horizontal overflow.

## MVP Trust Sprint Checks

1. Enter `3 bedroom on a one acre`, click Generate, and confirm a site-aware 3-bedroom house appears with compound/site objects. It must not load `Block of 4 Flats`.
2. Open Estimate Cost for the generated plan. Confirm Kenya shows `KSh`, Nigeria shows `NGN`/`₦`, and every estimate displays source, assumptions, confidence, and warnings.
3. Click Optimize Layout twice and compare the plan before and after. The geometry must not change.
4. Open Templates and confirm templates are grouped by African categories with visible SVG thumbnails.
5. Clear the canvas and click PDF, PNG, or BOQ. Confirm the app shows a helpful validation modal instead of exporting an empty/fake artifact.
6. Click Chat or AI BOQ Notes with no AI consent stored. Confirm the AI consent modal appears and declining keeps local templates, estimates, BOQ, exports, save, and share usable.
7. Open Templates and confirm at least 20 African template cards appear across Family homes, Rental/investment, Low-cost builds, Urban compact plots, Rural/compound homes, Mixed-use buildings, Student housing, and Diaspora builds.
8. Use template filters for country, plot, bedrooms, use, budget, and type. Confirm filtered cards still show mini-plan SVGs and no blank placeholders.
9. Click a template card and confirm the details view appears before loading, with room list, assumptions, editable-dimensions note, and BOQ confidence.

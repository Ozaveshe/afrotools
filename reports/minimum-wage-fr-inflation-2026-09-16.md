# French minimum-wage inflation view — 2026-09-16

Base e77371c4. Fresh fetched origin/main7e2fba2b3cc82959cf903b72172ada1231f91a13. Isolatedtree minimum-wage-fr-inflation-20260916/afrotools, branchcodex/minimum-wage-fr-inflation-20260916.

## Source-owned addition

French authoredpage loads existing minimum-wage-inflation.js helper and newminimum-wage-fr-inflation.js renderer. The country-selected recorded series has nominal/real SVGcurves, accessible native table, gain/loss/no-change summary, actualyears and a CSVexport. Each realpoint andsummary use the existing protected summarize helper; no rates/CPI/historychanged. CSVuses exact numericvalues, native headings, country/currency/baseyear and provenance limits. It excludes manualpayroll andsubscription/reportfields. Unsupportedcountry/reset clearsgraph/table and disablesexport. Sectorselector does not alter the nationalhistoricalseries, explicitly explained.

Economicdata is not validated by rendering. CPI source/verificationdate unspecified; the view says so. It does not call storedobservations currentlivingcosts. Reference metadata alreadycheckedZAstatutoryfloor is not applied as CPIverification.

## Evidence

- Focused4ChromiumtestsPASS10.7s: newFRchart/CSV/missing/reset/mobile and existingEN/SWsummarychecks.
- ReopenedMA CSVasserts2024nominal3015,CPI120,real2512.5,base2020. Browserchecks nativegain0.9%,NG loss,ZA2026,EPWP nationalseriesdisclosure.
- Newsection axe serious/critical checks pass light/dark at320/390; no documenthorizontaloverflow, exportkeyboardfocus reachable.
- Existing independentinflationnodefixturesPASS (gain/loss/zero/non100CPI/invalidCPI).
- CQ796artifacts394/394PASS; protectedhelper unchanged. Newfile is a rendering/export consumer of that arithmetic, not a new economicmodel.
- Syntax/diffpass. InitialunanchoredPlaywrightfilter matchedworktreefolder and collected unrelatedspecs, failingeducation43vs42 and SW_EXPORT_IDcontract beforetests; anchoredfilename rerun isolates intended4tests.
- Visuals: siblingfr-inflation-visual/fr-390-dark.png viewed. EnlargedSVGaxislabels afterfirstinspection. Fullsectionscreenshot includes existingfixednavbar/assistantoverlap; not evidence those globals are fixed. Values/table and chart remain responsive; no wholepagea11ycertification.
- No livewrites, external submissions, deployment or newdatafreshnessclaims. Fullreleasebuild/dist verification left tocoordinator.

Hreflang validation passed: 11,560 pages and 5,289 equivalence groups. build:i18n:validate also passed with no generated-output changes.

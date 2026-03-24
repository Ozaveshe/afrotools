# Prompt 12: Bulk Payroll Calculator (Pro Feature)

## Context

Read these files first:
- `assets/js/engines/ng-paye.js` (example PAYE engine — pure function)
- `assets/js/engines/` (all available engines)
- `assets/js/components/pro-gate.js` (pro feature gating)
- `docs/PLATFORM_STANDARDS.md` (naming conventions)
- `assets/js/lib/pdf-template.js` (PDF generation)

Individual PAYE calculators handle one employee at a time. Companies running payroll across Africa need batch processing. This is a clear enterprise/pro feature.

## Objective

Build a **Bulk Payroll Calculator** that accepts a CSV of employees and returns PAYE calculations for all of them. Pro-only feature.

### URL: `/tools/bulk-payroll/index.html`

### Features

1. **CSV Upload**: Drag-and-drop or file picker for CSV
2. **CSV Template**: Downloadable template with required columns
3. **Column Mapping**: Auto-detect columns, let user confirm mapping
4. **Batch Processing**: Run PAYE engine for each row, show progress
5. **Results Table**: Sortable table with all employees' tax breakdowns
6. **Summary Stats**: Total gross payroll, total tax, total net, average effective rate
7. **Export Options**:
   - CSV download (with all calculated columns added)
   - Excel-formatted CSV (with headers and formatting)
   - PDF payroll report
8. **Multi-Country**: Support employees across different countries in one batch

### CSV Template Columns

```csv
employee_name,country_code,gross_salary_monthly,employment_type,pension_rate,period
John Doe,NG,500000,employed,8,monthly
Jane Smith,KE,150000,employed,6,monthly
```

Required: `country_code`, `gross_salary_monthly`
Optional: `employee_name`, `employment_type`, `pension_rate`, `period`

### Pro Gating

- Free users: max 5 employees per batch
- Pro users: up to 500 employees per batch
- Enterprise: unlimited + API access

## Constraints

- ALL processing happens CLIENT-SIDE — no employee data sent to server (privacy critical for payroll)
- PAYE engines are loaded dynamically based on unique country codes in the CSV
- Use `FileReader` API for CSV parsing (no external CSV library)
- Follow design system tokens and patterns
- Progress bar for large batches (process in chunks of 50 via `requestIdleCallback`)
- Results table must be virtual-scrolled or paginated for 500+ rows (use simple pagination, not a virtual scroll library)
- CSV export uses `Blob` + `URL.createObjectURL` + `<a download>`
- PDF report follows PLATFORM_STANDARDS.md format
- Error handling: invalid rows should be flagged (red highlight) but not stop the entire batch
- Add to tool-registry.js with `tier: 'pro'`

## Implementation Steps

1. Create `tools/bulk-payroll/index.html`:
   - Standard page structure
   - Hero: "Bulk Payroll Calculator — Process payroll across Africa"
   - Upload zone: drag-and-drop area with file picker fallback
   - Template download link
   - Column mapping UI (shown after upload)
   - Progress bar
   - Results table with sort/filter
   - Summary stats cards
   - Export buttons (CSV, PDF)
2. Create `tools/bulk-payroll/bulk-payroll.js`:
   - CSV parser (handle commas in quoted fields, BOM, different line endings)
   - Column auto-detection (fuzzy match column names to expected fields)
   - Column mapping UI
   - Dynamic engine loading for unique countries in CSV
   - Batch processor with progress reporting
   - Results table rendering with pagination (25 rows per page)
   - Sort by any column
   - Summary statistics calculation
   - CSV export generation
   - PDF report generation
3. Create `tools/bulk-payroll/bulk-payroll.css`:
   - Upload zone styling (drag-over state, file icon)
   - Table styling (zebra rows, sticky header, scrollable)
   - Progress bar animation
   - Error row highlighting
4. Add to tool-registry.js
5. Run `npm run minify` and `npm run sitemap`

## Verification

- Upload template CSV with 5 employees across NG, KE, GH
- Column mapping should auto-detect correctly
- All 5 employees should calculate correctly (compare with individual calculators)
- Summary stats should match manual addition
- Download CSV → open in Excel → confirm all columns present with calculated values
- Download PDF → confirm payroll report format
- Try uploading 6 employees as free user → pro gate should trigger
- Test with malformed CSV (missing columns, bad numbers) → errors flagged, valid rows still processed
- Test with 100+ rows → progress bar should show, UI should not freeze

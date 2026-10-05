# Hausa invoice document modes and CV theme repair

Date: 5 October 2026. Isolated worktree: `ha-document-completion-20261005`.
Base: integrated localization candidate `2ef6c2d74ea08f0f4c047bf639908e68ff36099a`.
This batch follows the separately committed all-locale JSON import repair
`7f584c05`; it changes only the Hausa document owners and its tests.

## Product changes

- Invoice users can choose a Hausa invoice, receipt or estimate. The selected
  type controls preview headings, reference labels, PDF headings/file prefix,
  JSON backups and local saved invoices. Changing type does not invent a
  payment: entered amounts and paid status are preserved. The UI states this.
- Unknown or missing imported document types safely select invoice, including
  legacy backups. New invoice resets the type and payment fields.
- Template changes retain the selected document type. The existing export
  review requirement is invalidated by type changes and imports.
- Saved-client names/company names are escaped in their cards. Client removal
  and template load/delete actions have Hausa accessible names and preserve
  the authored suffix literally.
- The Hausa CV brief uses theme tokens for panels, inputs, labels, results and
  notes. Buttons have sufficient text contrast, and keyboard focus stays
  visible. This is still the short CV brief, not the complete English editor.

Source owners: `ha/kayan-aiki/kirkiro-invoice/index.html`,
`ha/kayan-aiki/gina-cv/index.html`, `assets/css/hausa-cv-brief.css`.
No shared English/French/Swahili source or calculation formula was changed.

## Verification

- PASS: the two new cases in `tests/e2e/hausa-document-modes-theme.spec.js`.
  All three real PDFs reopen with native headings, exact Hausa names and the
  expected balance. JSON import, local save/reload, unknown/legacy types,
  review invalidation, new-document reset and literal saved-client markup pass.
  Synthetic private markers are absent from observed request URLs/bodies.
- PASS: the two existing `hausa-document-parity.spec.js` cases on this source,
  covering the real cookie decline control, required fields, TXT/Unicode PDF,
  tax invariance, sharing consent, local recovery and 320/390px reflow.
- PASS: real navigation theme toggle; light/dark at 320/390px with no horizontal
  overflow. Computed text contrast is at least 4.5:1 for the checked heading,
  field label, input, textarea, buttons, result and note. Keyboard Tab advances
  between the name and role fields. Light/dark screenshots were inspected.
- No browser page errors in the new cases. An initial test used a nonexistent
  saved-list selector; another did not expand the advanced new-invoice control.
  These test interactions were corrected and the complete new suite rerun.

Full integration build, deploy artifact, CI and exact-production checks belong
to the release owner and are not claimed by this isolated batch. Native-human
editorial approval, full Hausa CV parity, screen-reader/OS-print review and
the broader Hausa route backlog remain open. No live account/provider work,
production deployment, real CV or real financial data was used.

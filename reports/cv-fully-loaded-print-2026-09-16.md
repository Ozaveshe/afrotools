# CV fully loaded print window — blank-output repair

With every local stylesheet loaded, the EN/FR/SW Pan-African Minimal long fixture printed one blank page. Direct Chromium reproduced it outside the routed test harness. The legacy cv-builder.css rule body>*:not(#cvpreview) hid the dedicated print window's enclosing main, and its ID specificity defeated later class overrides.

The legacy rule now excludes body.cv-export-print-body. Original-page print handling remains scoped to its existing body; the dedicated popup can show its document wrapper. This is a one-selector source repair, separate from pagination and field changes.

The new browser contract waits for every stylesheet and fonts, then generates actual print PDFs. EN ten-family long-fixture verification passes: full accented name, all ten work entries, late custom/reference fields and native education heading survive parsing; text bounds and paper dimensions fit A4. Every EN page was rendered into contact sheets and inspected. French/Swahili equivalent checks are continuing; no claim for them in this checkpoint.

Visual inspection reveals remaining layout work: oversized keep-together sections leave excessive blank space on first pages, and Nairobi has an extra blank final page in this fixture. The selector repair restores content but does not certify print-layout completeness. Earlier print checks that waited only one stylesheet were incomplete and are superseded for fully loaded print behavior.

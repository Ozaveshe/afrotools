# Design review: image compressor workflow

## Verified findings and repairs

- A public repository WebP (600 x 400, approximately 6.6 KB) produced an 8,210-byte output. The tool previously clamped this to `0% saved`. Queue, aggregate metrics, comparison details and local history now distinguish larger output from savings.
- Aggregate savings compare completed outputs with their corresponding originals, excluding unfinished or failed files from that percentage.
- The comparison slider previously interpreted zero as its 50% default. Both endpoints now work.
- Checkbox accessible names now use their visible labels instead of implementation names such as `NoUpscale`.
- The compressor's night-mode hero and section labels now use readable colors. Shared English/Swahili CSS and engine ownership is preserved.
- Swahili output was regenerated through `scripts/build-sw-image-compress.js`; size labels and runtime messages are translated.

## Browser evidence

Local in-app Chromium, 390 x 844 viewport, public repository image only. No private user files or live database actions.

- English processing completes, with original and output previews both 600 x 400.
- Revised result: `22.4% larger`; aggregate: `22% larger`.
- Comparison Home key sets value 0 and rendered clip to `inset(0px 0px 0px 0%)`.
- Explicitly selected dark theme: hero rgb(11,21,36), section eyebrow rgb(255,181,138).
- Swahili processing completes: `22.4% kubwa zaidi` in details and `22% kubwa zaidi` in metrics. All three checkbox names are readable Swahili.
- Document client width and scroll width are both 384px in both checked routes.
- Save triggers `Page.downloadWillBegin` with suggested filename `image-compress-compressed.webp` and 8,210 bytes. The in-app browser then reports `Page.downloadProgress: canceled`. Download completion and opening the downloaded file remain unverified. No console warnings/errors in this checked action.

## Validation

- PASS: shared-owner/privacy/format/SEO/generator contract test.
- PASS: new behavior tests for larger/smaller/equal/waiting size reports and comparison values 0/50/100.
- PASS: syntax checks for the engine and Swahili adapter; `git diff --check`.
- Updated the historical engine byte-hash test: it froze the initial extraction and rejected intentional bug fixes. Both locales still must reference the same owner; existing privacy, encoding and generator assertions remain. New behavior tests cover the fixes.

## Broader audit evidence

Static `audit-tool-quality.js` run scored 3,688 routes, representing 5,402 expanded instances. It flags 39 F rows; no browser smoke is implied by these static scores. The generated Markdown is in `reports/design-tool-review-20260915/tool-quality-ranking.md`. Detailed JSON/CSV are local ignored artifacts under `artifacts/design-tool-review-20260915/` to avoid committing about 11 MB of regenerable evidence. The report's default JSON/CSV links point to the standard output location; use the artifact paths above for this run.

Next: inspect the flagged routes and audit image references across the public HTML set; continue document/export workflows and broader theme/viewport compatibility. The full goal is still active. No build/release/cache regeneration, push, merge or deployment is claimed.

# v5 43e6f10 Decision

## Recommendation

B. KEEP `43e6f10` BUT ADD FOLLOW-UP CLEANUP COMMITS.

## Rationale

`43e6f10` is not a clean review unit. It changed 8,746 files and mixed source code, styles, scripts, tests, generated/static HTML, minified assets, audit evidence, screenshots, and unrelated or suspicious carryover. That is bad release hygiene.

A blind revert is also not the safest next step. Current v5 verification shows that the quality gains are real and still active:

- Full Playwright: 79 passed
- Product-quality Playwright subset: 14 passed
- Comprehensive crawl: 8,501 routes, 0 broken pages, 0 broken internal links, 0 broken images
- Hreflang: 0 errors
- Mobile audit: 97 issue-bearing pages, unchanged from v3/v4 target
- Deploy build and deploy artifact audit: passed
- Security scan: passed

The release-control problem is reviewability and manual ownership of suspicious carryover, not a proven production break from `43e6f10` itself.

## Risk Level

Medium.

The product gates are green, but the commit history and current checkout still contain large generated churn. The repo is safe to continue from `43e6f10` only with follow-up cleanup and manual review. Do not ship the current dirty working tree as one bundle.

## Human Maintainer Commands

Recommended safe path:

```powershell
# 1. Create a follow-up branch from current main.
git switch main
git pull --ff-only
git switch -c codex/v5-release-control-followup

# 2. Review suspicious 43e6f10 files one by one.
git show 43e6f10 -- data/audits/public-claim-registry.json
git show 43e6f10 -- data/automation/automation-registry.json
git show 43e6f10 -- data/scholarships/official-sources.json
git show 43e6f10 -- docs/AUTOMATION-REGISTRY.md
git show 43e6f10 -- llms-full.txt

# 3. Stage follow-up fixes separately from generated output and audit evidence.
git status --short
git diff --check
git add <reviewed-source-files>
git diff --cached --check
git commit -m "test: stabilize full Playwright release suite"
```

If a rollback is required after human review, prefer a dedicated rollback branch and extract known-good source fixes before reverting the landed mega-commit:

```powershell
git switch main
git pull --ff-only
git switch -c codex/revert-43e6f10-review
git revert 43e6f10
# Then cherry-pick or reapply only reviewed source fixes and rerun the full verification stack.
```

Do not history-rewrite `43e6f10` unless the team confirms that the commit has not been deployed or shared and force-push is allowed.

## Manual Review Areas

- `jamb/` changes included in `43e6f10`
- `tools/cv-builder/` changes included in `43e6f10` and later current dirty state
- `tools/study-abroad-cost/` changes included in `43e6f10` and later current dirty state
- `assets/css/product-backbone.css`, which appears in later history/current dirty state rather than `43e6f10`
- Automation/source-truth files: `data/audits/public-claim-registry.json`, `data/automation/automation-registry.json`, `data/scholarships/official-sources.json`, `docs/AUTOMATION-REGISTRY.md`, `llms-full.txt`
- Generated/static HTML churn across thousands of pages

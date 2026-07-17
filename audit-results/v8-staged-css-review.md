# v8 staged CSS review

## Files staged

- `assets/css/global.css`
- `assets/css/global.min.css`

## Diff review

The staged source CSS change narrows the hero view transition selector:

```css
.hero,
-.compare-hero,
-[class*="-hero"] {
+.compare-hero {
  view-transition-name: hero;
}
```

In plain terms: `view-transition-name: hero` no longer applies to every class ending in `-hero`; it applies only to `.hero` and `.compare-hero`.

## Minified CSS

The minified CSS matches the source-level selector change:

- before: `.hero,.compare-hero,[class*="-hero"]{view-transition-name:hero}`
- after: `.hero,.compare-hero{view-transition-name:hero}`

## Checks

- `git diff --cached --check`: PASS
- `git diff --cached --numstat -- assets/css/global.css assets/css/global.min.css`: 2 staged files, 2 insertions, 3 deletions.

## Exclusions confirmed

- No generated HTML is staged.
- No audit artifacts are staged.
- No package/config files are staged.
- No unrelated style changes are staged.

## Verdict

The staged CSS diff is reviewable and scoped, but it was not committed because process safety and snapshot stability failed.

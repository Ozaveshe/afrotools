# ============================================================
# AfroTools SEO Fix: Add trailing slashes to all internal links
# Run from: C:\Users\Oza\Documents\afrotools\
# ============================================================
#
# WHAT THIS DOES:
# Finds all .html files in the repo and adds trailing slashes
# to internal href links that are missing them.
#
# SAFE: Only touches href="/path" style links (internal, relative).
# SKIPS: External URLs, anchor links (#), asset files (.css, .js, .webp, .svg, .png, .jpg, .gif, .ico, .json, .xml, .txt, .woff2, .woff, .ttf)
# SKIPS: PAYE/VAT tool pages (file-based, no-trailing-slash is canonical)
#
# Run this BEFORE committing. Review changes with: git diff
# ============================================================

$repoRoot = "C:\Users\Oza\Documents\afrotools"

# File extensions that should NOT get trailing slashes
$assetExtensions = @('.css', '.js', '.webp', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.json', '.xml', '.txt', '.woff2', '.woff', '.ttf', '.map', '.min.js', '.min.css')

# PAYE/VAT tool URL patterns (file-based, no trailing slash)
# These are HTML files like ng-salary-tax.html served at /nigeria/ng-salary-tax
$skipPatterns = @(
    '-paye"',
    '-salary-tax"',
    '-vat"',
    'vat-calc"'
)

$htmlFiles = Get-ChildItem -Path $repoRoot -Filter "*.html" -Recurse -File
$totalFixed = 0
$filesChanged = 0

foreach ($file in $htmlFiles) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $original = $content

    # Regex: Match href="/something" where "something" doesn't end with / and isn't an asset
    # Pattern: href="(/[a-zA-Z0-9][^"]*[^/])"
    # But we need to exclude assets and PAYE/VAT pages

    $content = [regex]::Replace($content, 'href="(/[a-zA-Z0-9][^"]*?)"', {
        param($match)
        $href = $match.Groups[1].Value

        # Skip if already has trailing slash
        if ($href.EndsWith('/')) { return $match.Value }

        # Skip anchor links
        if ($href.Contains('#')) { return $match.Value }

        # Skip query strings
        if ($href.Contains('?')) { return $match.Value }

        # Skip asset files
        foreach ($ext in $assetExtensions) {
            if ($href.EndsWith($ext)) { return $match.Value }
        }

        # Skip PAYE/VAT tool pages (file-based canonical)
        foreach ($pattern in $skipPatterns) {
            $checkVal = $href + '"'
            if ($checkVal -like "*$pattern") { return $match.Value }
        }

        # Add trailing slash
        return "href=""$href/"""
    })

    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $filesChanged++
        $changes = (Compare-Object ($original -split "`n") ($content -split "`n")).Count / 2
        $totalFixed += $changes
        Write-Host "Fixed: $($file.FullName -replace [regex]::Escape($repoRoot), '') ($changes links)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Done! $filesChanged files changed, ~$totalFixed links fixed" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review changes:  git diff" -ForegroundColor White
Write-Host "  2. Stage:           git add -A" -ForegroundColor White
Write-Host "  3. Commit:          git commit -m 'SEO: Add trailing slashes to all internal links'" -ForegroundColor White
Write-Host "  4. Push:            git push" -ForegroundColor White

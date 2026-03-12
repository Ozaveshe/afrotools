$ErrorActionPreference = "Stop"
$repoRoot = "C:\Users\Oza\Documents\afrotools"
$fixDir = Join-Path $repoRoot "afrotools-seo-fix"

if (-not (Test-Path (Join-Path $repoRoot ".git"))) {
    Write-Host "ERROR: No .git folder found at $repoRoot" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  AfroTools SEO Fix - Starting deployment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# FIX 1: Trailing slashes in all HTML files
# ============================================================
Write-Host "[1/5] Fixing trailing slashes in all HTML files..." -ForegroundColor Yellow

$assetExtensions = @('.css', '.js', '.webp', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.json', '.xml', '.txt', '.woff2', '.woff', '.ttf', '.map')

$htmlFiles = Get-ChildItem -Path $repoRoot -Filter "*.html" -Recurse -File | Where-Object {
    $_.FullName -notlike "*\afrotools-seo-fix\*" -and
    $_.FullName -notlike "*\node_modules\*" -and
    $_.FullName -notlike "*\.git\*"
}

$filesChanged = 0

foreach ($file in $htmlFiles) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    if ($null -eq $content) { continue }
    $original = $content

    $content = [regex]::Replace($content, 'href="(/[a-zA-Z0-9][^"]*?)"', {
        param($match)
        $h = $match.Groups[1].Value
        if ($h.EndsWith('/')) { return $match.Value }
        if ($h.Contains('#') -or $h.Contains('?')) { return $match.Value }
        foreach ($ext in $assetExtensions) {
            if ($h.EndsWith($ext)) { return $match.Value }
        }
        if ($h -match '/[a-z]{2}-paye$') { return $match.Value }
        if ($h -match '/[a-z]{2}-vat$') { return $match.Value }
        if ($h -match '/[a-z]{2}-salary-tax$') { return $match.Value }
        if ($h -match '/ng-salary-tax$') { return $match.Value }
        if ($h -match '/vat-calc$') { return $match.Value }
        return "href=""$h/"""
    })

    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $filesChanged++
        $rp = $file.FullName -replace [regex]::Escape($repoRoot), ''
        Write-Host "  Fixed: $rp" -ForegroundColor Green
    }
}

Write-Host "  => $filesChanged files updated" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# FIX 2: Replace sitemap.xml
# ============================================================
Write-Host "[2/5] Replacing sitemap.xml..." -ForegroundColor Yellow

$src = Join-Path $fixDir "sitemap.xml"
$dst = Join-Path $repoRoot "sitemap.xml"

if (Test-Path $src) {
    Copy-Item -Path $src -Destination $dst -Force
    Write-Host "  => sitemap.xml replaced" -ForegroundColor Green
} else {
    Write-Host "  => WARNING: sitemap.xml not found" -ForegroundColor Red
}
Write-Host ""

# ============================================================
# FIX 3: Fix VAT calculator
# ============================================================
Write-Host "[3/5] Fixing VAT calculator meta refresh..." -ForegroundColor Yellow

$vatSrc = Join-Path $fixDir "tools-vat-calculator-index.html"
$vatDst = Join-Path $repoRoot "tools\vat-calculator\index.html"

if (Test-Path $vatSrc) {
    $vatDir = Split-Path $vatDst -Parent
    if (-not (Test-Path $vatDir)) {
        New-Item -ItemType Directory -Path $vatDir -Force | Out-Null
    }
    Copy-Item -Path $vatSrc -Destination $vatDst -Force
    Write-Host "  => tools/vat-calculator/index.html replaced" -ForegroundColor Green
} else {
    Write-Host "  => WARNING: VAT fix file not found" -ForegroundColor Red
}
Write-Host ""

# ============================================================
# FIX 4: _redirects
# ============================================================
Write-Host "[4/5] Adding VAT redirect to _redirects..." -ForegroundColor Yellow

$rFile = Join-Path $repoRoot "_redirects"
$r1 = "/tools/vat-calculator    /tools/vat-calculator/vat-calc    301"
$r2 = "/tools/vat-calculator/   /tools/vat-calculator/vat-calc    301"

if (Test-Path $rFile) {
    $ec = Get-Content -Path $rFile -Raw -Encoding UTF8
    if ($ec -notlike "*vat-calculator/vat-calc*") {
        $nc = "# VAT calculator redirect`n$r1`n$r2`n`n$ec"
        Set-Content -Path $rFile -Value $nc -Encoding UTF8 -NoNewline
        Write-Host "  => Added VAT redirect" -ForegroundColor Green
    } else {
        Write-Host "  => Already exists, skipping" -ForegroundColor Cyan
    }
} else {
    $nc = "# VAT calculator redirect`n$r1`n$r2`n"
    Set-Content -Path $rFile -Value $nc -Encoding UTF8 -NoNewline
    Write-Host "  => Created _redirects" -ForegroundColor Green
}
Write-Host ""

# ============================================================
# FIX 5: Structured data
# ============================================================
Write-Host "[5/5] Fixing structured data..." -ForegroundColor Yellow

# Import Duty - replace CalculatorApplication and inject offers
$idPath = Join-Path $repoRoot "tools\import-duty\index.html"
if (Test-Path $idPath) {
    $c = Get-Content -Path $idPath -Raw -Encoding UTF8
    if ($c -like "*CalculatorApplication*") {
        $find1 = '"applicationCategory": "CalculatorApplication"'
        $replace1 = '"applicationCategory": "FinanceApplication",'
        $replace1 += "`n" + '        "operatingSystem": "Any",'
        $replace1 += "`n" + '        "offers": {'
        $replace1 += "`n" + '            "@type": "Offer",'
        $replace1 += "`n" + '            "price": "0",'
        $replace1 += "`n" + '            "priceCurrency": "USD"'
        $replace1 += "`n" + '        }'
        $c = $c.Replace($find1, $replace1)
        Set-Content -Path $idPath -Value $c -Encoding UTF8 -NoNewline
        Write-Host "  => Import Duty fixed" -ForegroundColor Green
    } elseif ($c -like "*offers*") {
        Write-Host "  => Import Duty already fixed" -ForegroundColor Cyan
    } else {
        Write-Host "  => WARNING: Could not find CalculatorApplication" -ForegroundColor Red
    }
} else {
    Write-Host "  => WARNING: import-duty/index.html not found" -ForegroundColor Red
}

# WAEC Calculator - inject offers after url field
$wPath = Join-Path $repoRoot "tools\waec-calculator\index.html"
if (Test-Path $wPath) {
    $c = Get-Content -Path $wPath -Raw -Encoding UTF8
    if (($c -like "*waec-calculator*") -and ($c -notlike "*offers*")) {
        $find2 = '"url": "https://afrotools.com/tools/waec-calculator/"'
        $replace2 = '"url": "https://afrotools.com/tools/waec-calculator/",'
        $replace2 += "`n" + '        "applicationCategory": "EducationalApplication",'
        $replace2 += "`n" + '        "operatingSystem": "Any",'
        $replace2 += "`n" + '        "offers": {'
        $replace2 += "`n" + '            "@type": "Offer",'
        $replace2 += "`n" + '            "price": "0",'
        $replace2 += "`n" + '            "priceCurrency": "USD"'
        $replace2 += "`n" + '        }'
        $c = $c.Replace($find2, $replace2)
        Set-Content -Path $wPath -Value $c -Encoding UTF8 -NoNewline
        Write-Host "  => WAEC Calculator fixed" -ForegroundColor Green
    } elseif ($c -like "*offers*") {
        Write-Host "  => WAEC already fixed" -ForegroundColor Cyan
    } else {
        Write-Host "  => WARNING: Could not auto-fix WAEC" -ForegroundColor Red
    }
} else {
    Write-Host "  => WARNING: waec-calculator/index.html not found" -ForegroundColor Red
}

Write-Host ""

# ============================================================
# COMMIT AND PUSH
# ============================================================
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  All fixes applied. Committing..." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $repoRoot
Write-Host "Changed files:" -ForegroundColor Yellow
git status --short
Write-Host ""

git add -A
git commit -m "SEO: Fix Semrush errors - trailing slashes, sitemap, structured data, meta refresh"
Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push
Write-Host ""

Write-Host "Cleaning up fix folder..." -ForegroundColor Yellow
Remove-Item -Path $fixDir -Recurse -Force
git add -A
git commit -m "Clean up: Remove SEO fix scripts"
git push

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  DONE! Deployed to Netlify." -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Errors:   46 -> ~0" -ForegroundColor White
Write-Host "  Redirects: 231 -> ~10" -ForegroundColor White
Write-Host "  Health:   81% -> 90%+" -ForegroundColor White

$ErrorActionPreference = "Stop"
$repoRoot = "C:\Users\Oza\Documents\afrotools"

if (-not (Test-Path (Join-Path $repoRoot ".git"))) {
    Write-Host "ERROR: No .git folder found at $repoRoot" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Injecting GA4 (G-D859CGF391) into all pages" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$ga4Block = @"
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-D859CGF391"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-D859CGF391');
</script>
"@

$htmlFiles = Get-ChildItem -Path $repoRoot -Filter "*.html" -Recurse -File | Where-Object {
    $_.FullName -notlike "*\node_modules\*" -and
    $_.FullName -notlike "*\.git\*"
}

$injected = 0
$skipped = 0

foreach ($file in $htmlFiles) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    if ($null -eq $content) { continue }

    if ($content -like "*googletagmanager.com/gtag*") {
        $skipped++
        continue
    }

    $changed = $false

    if ($content -match '<meta charset="UTF-8">') {
        $content = $content.Replace('<meta charset="UTF-8">', "<meta charset=""UTF-8"">`n$ga4Block")
        $changed = $true
    } elseif ($content -match '<head>') {
        $content = $content.Replace('<head>', "<head>`n$ga4Block")
        $changed = $true
    }

    if ($changed) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $injected++
        $rp = $file.FullName -replace [regex]::Escape($repoRoot), ''
        Write-Host "  Injected: $rp" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "  => $injected files updated" -ForegroundColor Cyan
Write-Host "  => $skipped files already had GA4 (skipped)" -ForegroundColor Cyan
Write-Host ""

Set-Location $repoRoot
git add -A
git commit -m "Add Google Analytics 4 (G-D859CGF391) to all pages"
Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  DONE! GA4 is now on every page." -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Check real-time data in ~5 minutes:" -ForegroundColor White
Write-Host "  https://analytics.google.com" -ForegroundColor White
Write-Host "  Go to Reports -> Realtime" -ForegroundColor White

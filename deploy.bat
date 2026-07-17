@echo off
REM ═══ AfroTools Hub Deploy Script ═══
REM Run this from your Downloads folder after downloading all-hubs.zip
REM It extracts to the repo and pushes to GitHub

set REPO=C:\Users\Oza\Documents\afrotools

echo Extracting hub pages...
powershell -Command "Expand-Archive -Path '%~dp0all-hubs.zip' -DestinationPath '%REPO%' -Force"

echo Fixing tool-registry.js apostrophe...
powershell -Command "(Get-Content '%REPO%\assets\js\components\tool-registry.js') -replace \"Arm's length\", 'Arms-length' | Set-Content '%REPO%\assets\js\components\tool-registry.js'\"

cd /d %REPO%
echo.
echo Adding files to git...
git add -A

echo.
echo Files staged:
git status --short

echo.
echo Committing...
git commit -m "All 54 hubs: hover fix, breadcrumb links, registry apostrophe fix"

echo.
echo Pushing to GitHub...
git push

echo.
echo ═══ DONE — Netlify will deploy in ~15 seconds ═══
pause

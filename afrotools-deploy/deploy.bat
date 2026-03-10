@echo off
REM ═══════════════════════════════════════════════════════════
REM  AfroTools — Deploy Script
REM  1. Drop ALL downloaded files into a folder called "afrotools-deploy"
REM  2. Put "afrotools-deploy" inside your repo root
REM  3. Double-click deploy.bat OR run: afrotools-deploy\deploy.bat
REM ═══════════════════════════════════════════════════════════

setlocal
cd /d "%~dp0"
echo.
echo  AfroTools Deploy
echo  ================
echo.

REM ── Validate registry syntax ──
echo  [1/5] Validating tool-registry.js...
node -e "eval(require('fs').readFileSync('tool-registry.js','utf8')); console.log('  OK: ' + AFRO_TOOLS.length + ' tools')" 2>nul
if %errorlevel% neq 0 (
    echo  ERROR: tool-registry.js has syntax error. Fix it first.
    pause & exit /b 1
)

REM ── Core files (go to repo root = one level up) ──
echo.
echo  [2/5] Core files...
copy /y "index.html"       "..\index.html"                            >nul && echo    OK  index.html
copy /y "_redirects"       "..\_redirects"                            >nul && echo    OK  _redirects
if not exist "..\assets\js\components" mkdir "..\assets\js\components"
copy /y "tool-registry.js" "..\assets\js\components\tool-registry.js" >nul && echo    OK  assets/js/components/tool-registry.js

REM ── Search page ──
echo.
echo  [3/5] Search page...
if not exist "..\search" mkdir "..\search"
copy /y "search--index.html" "..\search\index.html" >nul && echo    OK  search/index.html

REM ── 12 Category pages ──
echo.
echo  [4/5] Category pages...
for %%C in (salary-tax document-pdf image-design developer-tools education health vat-business-tax mortgage-property business-roi language uniquely-african engineering) do (
    if not exist "..\%%C" mkdir "..\%%C"
    copy /y "%%C--index.html" "..\%%C\index.html" >nul && echo    OK  %%C/index.html
)

REM ── Git ──
echo.
echo  [5/5] Committing and pushing...
cd ..
git add .
git commit -m "feat: homepage, search, 12 category pages, registry [258 tools]"
git push

echo.
echo  ================================
echo  Done. Netlify builds in ~15s.
echo.
echo  https://afrotools.com
echo  https://afrotools.com/search?q=paye
echo  https://afrotools.com/salary-tax
echo  ================================
pause

@echo off
title Push Guys Guys Gallery to GitHub
echo ========================================================
echo   Pushing Guys Guys Night Shoot to GitHub
echo   Repository: https://github.com/shamsul-haq-shuvo/guys-guys-night-shoot.git
echo ========================================================
echo.
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo Successfully pushed to GitHub!
    echo Now enable GitHub Pages in your repo Settings:
    echo https://github.com/shamsul-haq-shuvo/guys-guys-night-shoot/settings/pages
) else (
    echo If this failed, make sure you created the public repo 'guys-guys-night-shoot'
    echo on https://github.com/new first!
)
pause

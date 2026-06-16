@echo off
title Launch Timelapse Recorder
cd /d "%~dp0"

set "APP_URL=https://timelapse-recorder.netlify.app"

echo Opening Timelapse Recorder...
start "" "%APP_URL%"

echo.
echo Timelapse Recorder should open in your browser.
echo Bookmark the page or click Install in the app header to pin it.
echo.
echo For local development instead, use Start Timelapse Recorder.bat
echo.
pause

@echo off
title Build Timelapse Extension
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed.
  echo Install it from https://nodejs.org then run this file again.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo First run: installing dependencies...
  call npm install
  if errorlevel 1 (
    echo Install failed.
    pause
    exit /b 1
  )
)

echo Building browser extension...
call npm run build:extension
if errorlevel 1 (
  echo Build failed.
  pause
  exit /b 1
)

echo.
echo Extension is ready.
echo.
echo In the browser extensions page that opens:
echo   1. Turn ON Developer mode  ^(top right^)
echo   2. Click Load unpacked
echo   3. Select this folder:
echo      %~dp0extension
echo.
echo After loading, click the puzzle icon and pin Timelapse Recorder.
echo.

where brave >nul 2>nul
if not errorlevel 1 (
  start "" "brave://extensions"
) else (
  start "" "chrome://extensions"
)

pause

@echo off
title Timelapse Recorder
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

echo Starting Timelapse Recorder...
start "Timelapse Recorder Server" /min cmd /k "npm run dev"

echo Waiting for server...
timeout /t 4 /nobreak >nul

start "" "http://localhost:5173"

echo.
echo Browser should open automatically.
echo.
echo To pin the app: click Install in the header, or use the install icon in the address bar.
echo After installing, launch Timelapse from Start menu or taskbar.
echo.
echo Keep the minimized "Timelapse Recorder Server" window running while you use the app.
echo Close that window when you are done.
echo.
pause

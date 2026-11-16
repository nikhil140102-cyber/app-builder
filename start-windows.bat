@echo off
setlocal
cd /d "%~dp0"
title App Builder
echo.
echo  ===================================================
echo   App Builder
echo  ===================================================
echo.

where node >nul 2>nul
if errorlevel 1 goto :nonode
node -e "process.exit(+process.versions.node.split(String.fromCharCode(46))[0] < 20 ? 1 : 0)"
if errorlevel 1 goto :oldnode

echo %CD% | find /I "OneDrive" >nul
if not errorlevel 1 goto :onedrive

if not exist ".env" copy ".env.example" ".env" >nul
rem Install packages on first start, and again whenever an update changes package.json
fc /b "package.json" "node_modules\.installed-package.json" >nul 2>nul
if not errorlevel 1 goto :run
echo  [1/2] Installing packages. This takes a few minutes after an update...
call npm install
if errorlevel 1 goto :failed
copy /y "package.json" "node_modules\.installed-package.json" >nul

:run
echo  [2/2] Starting. Your browser opens http://localhost:3000 in a few seconds.
echo       Keep this window open while you work. Close it to stop the builder.
echo.
start "" /b cmd /c "timeout /t 8 /nobreak >nul & start http://localhost:3000"
call npm run dev
goto :end

:nonode
echo  [X] Node.js is not installed. Install the LTS version from nodejs.org, then run this file again.
start https://nodejs.org
goto :end

:oldnode
echo  [X] Your Node.js is too old. Install version 20 or newer from nodejs.org.
goto :end

:onedrive
echo  [X] This folder is inside OneDrive: %CD%
echo      OneDrive locks files while syncing and breaks the builder.
echo      Copy this whole folder to C:\projects\app-builder and run start-windows.bat from there.
goto :end

:failed
echo.
echo  [X] Installing packages failed. Check your internet connection and run this file again.

:end
echo.
pause

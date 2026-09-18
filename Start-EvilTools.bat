@echo off
title EvilTools PF2e Suite
cd /d "%~dp0"
echo ========================================================
echo Starting EvilTools: PF2e Remaster Craft & Scribe Suite...
echo ========================================================
echo Opening browser to http://localhost:5173 ...
start "" "http://localhost:5173"
npm run dev
pause

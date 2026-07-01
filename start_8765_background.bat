@echo off
setlocal
cd /d "%~dp0"
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /r /c:":8765 .*LISTENING"') do taskkill /pid %%p /f >nul 2>nul
set NSGLAMOUR_NO_BROWSER=1
set NSGLAMOUR_ENABLE_CHARA_IMPORT=1
python scripts\app.py >> nsglamour-server.log 2>> nsglamour-server.err.log

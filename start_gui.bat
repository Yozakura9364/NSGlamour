@echo off
setlocal
cd /d "%~dp0"
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /r /c:":8765 .*LISTENING"') do taskkill /pid %%p /f >nul 2>nul
for /f "skip=1 tokens=2 delims=," %%p in ('wmic process where "name='python.exe' and commandline like '%%NSGlamour%%app.py%%'" get processid /format:csv 2^>nul') do taskkill /pid %%p /f >nul 2>nul
set NSGLAMOUR_ENABLE_CHARA_IMPORT=1
python scripts\app.py

@echo off
setlocal
cd /d "%~dp0"
echo Updating NSGlamour equipment data from GitHub CSV sources...
echo.
python scripts\build_item_mapping.py
if errorlevel 1 (
  echo.
  echo Update failed. Please check the output above.
  pause
  exit /b 1
)
echo.
echo Update complete. Restart the local UI if it was already open.
pause

@echo off
setlocal
chcp 65001 >nul
set "TOOL_DIR=%~dp0"

python "%TOOL_DIR%batch_loadout_export.py"

if errorlevel 1 pause
endlocal

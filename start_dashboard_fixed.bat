@echo off
echo 🚀 Iniciando Grok-Beast Trading Dashboard...
echo.

REM Activar entorno virtual
call .venv\Scripts\activate

REM Configurar PYTHONPATH
set PYTHONPATH=%CD%

REM Iniciar dashboard
python scripts/run_dashboard.py

pause
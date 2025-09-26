@echo off
echo 🚀 Iniciando Grok-Beast Trading Dashboard (Versión Funcional)...
echo.

REM Activar entorno virtual
call .venv\Scripts\activate

REM Iniciar dashboard simplificado
python scripts/run_dashboard_simple.py

pause




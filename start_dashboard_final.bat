@echo off
echo 🚀 Iniciando Grok-Beast Trading Dashboard (Versión Final)...
echo.

REM Activar entorno virtual
call .venv\Scripts\activate

echo ✅ Entorno virtual activado
echo 🌐 Iniciando servidor en http://localhost:8000
echo 📊 Dashboard React disponible
echo 🔌 WebSocket en ws://localhost:8000/ws
echo.

REM Iniciar dashboard
".venv\Scripts\python.exe" scripts\run_dashboard_simple.py

echo.
echo ❌ Dashboard detenido
pause




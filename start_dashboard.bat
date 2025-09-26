@echo off
echo.
echo ========================================
echo    GROK-BEAST DASHBOARD v2.0.0
echo ========================================
echo.
echo 🚀 Iniciando servidor...
echo.

cd /d "%~dp0"

REM Verificar que el frontend esté compilado
if not exist "frontend\dist\index.html" (
    echo ❌ Frontend no compilado. Compilando...
    cd frontend
    call npm run build
    cd ..
    echo ✅ Frontend compilado
)

REM Iniciar servidor
echo 🌐 Servidor iniciado en: http://localhost:8000
echo 📱 PWA: Instalable como app nativa
echo 🤖 AI: Assistant integrado
echo 📊 Analytics: Backtesting y métricas avanzadas
echo 🔔 Alertas: Telegram, Email, SMS, Push
echo 🎮 Gamificación: Achievements y leaderboard
echo 🔐 Seguridad: 2FA y audit logs
echo 🌐 Multi-Exchange: Arbitraje automático
echo 🧠 ML: Dashboard de modelos
echo 📱 Mobile: App React Native
echo.
echo ⏹️  Presiona Ctrl+C para detener
echo.

python scripts/flask_server.py
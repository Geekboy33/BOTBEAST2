@echo off
echo.
echo ========================================
echo    GROK-BEAST DASHBOARD v2.0.0
echo    TRADING INTERFACE COMPLETA
echo ========================================
echo.
echo 🚀 Iniciando servidor avanzado...
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

REM Iniciar servidor avanzado
echo 🌐 Servidor avanzado iniciado en: http://localhost:8000
echo 📱 PWA: Instalable como app nativa
echo 🤖 AI: Assistant integrado con análisis predictivo
echo 📊 Analytics: Backtesting y métricas avanzadas
echo 🔔 Alertas: Telegram, Email, SMS, Push notifications
echo 🎮 Gamificación: Achievements y leaderboard
echo 🔐 Seguridad: 2FA y audit logs
echo 🌐 Multi-Exchange: Arbitraje automático
echo 🧠 ML: Dashboard de modelos de machine learning
echo 📱 Mobile: App React Native completa
echo.
echo ✨ NUEVAS FUNCIONALIDADES:
echo • 🚀 Trading Interface completa con órdenes en tiempo real
echo • 📋 Gestión de órdenes (crear, cancelar, seguir)
echo • 💼 Historial de trades con análisis de PnL
echo • 📊 Posiciones actuales con métricas en vivo
echo • 🔮 AI Assistant con análisis predictivo y voz
echo • 🔔 Sistema de alertas avanzado multi-canal
echo • 📈 Analytics con backtesting y métricas de riesgo
echo • 🎯 Simulador de trading con competencias
echo • 🌐 Multi-Exchange con oportunidades de arbitraje
echo • 🧠 Dashboard ML con métricas de modelos
echo • 🔐 Seguridad avanzada con 2FA
echo • 📱 App móvil React Native
echo.
echo 🎯 ENDPOINTS DISPONIBLES:
echo • /api/orders - Gestión de órdenes
echo • /api/trades - Historial de trades
echo • /api/metrics - Métricas de trading
echo • /api/portfolio - Portfolio actual
echo • /api/prices - Precios en tiempo real
echo • /api/alerts - Sistema de alertas
echo • /api/analytics - Analytics avanzados
echo • /api/ml/models - Modelos ML
echo • /api/exchanges - Exchanges soportados
echo • /api/arbitrage - Oportunidades de arbitraje
echo • /ws - WebSocket para datos en tiempo real
echo • /metrics - Métricas Prometheus
echo.
echo ⏹️  Presiona Ctrl+C para detener
echo.

python scripts/advanced_server.py





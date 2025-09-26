@echo off
REM Script de instalación automática para Windows - Grok-Beast Trading Bot

echo 🚀 INSTALADOR AUTOMÁTICO - GROK-BEAST TRADING BOT
echo ==================================================

echo 🖥️  Sistema detectado: Windows

REM 1️⃣ Verificar prerequisitos
echo.
echo 📦 VERIFICANDO PREREQUISITOS
echo =============================

REM Verificar Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python no encontrado. Instala Python 3.11+ desde python.org
    pause
    exit /b 1
) else (
    echo ✅ Python encontrado
)

REM Verificar Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js no encontrado. Instala Node.js 18+ desde nodejs.org
    pause
    exit /b 1
) else (
    echo ✅ Node.js encontrado
)

REM Verificar npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm no encontrado
    pause
    exit /b 1
) else (
    echo ✅ npm encontrado
)

REM 2️⃣ Instalar Ollama
echo.
echo 🤖 INSTALANDO OLLAMA
echo ====================

echo 📥 Para Windows, instala Ollama manualmente:
echo    1. Ve a https://ollama.com/download
echo    2. Descarga e instala Ollama
echo    3. Abre PowerShell como administrador
echo    4. Ejecuta: ollama serve
echo    5. En otra terminal: ollama pull gpt-oss-120-turbo
echo.
echo Presiona Enter cuando hayas completado la instalación...
pause

REM 3️⃣ Crear entorno virtual Python
echo.
echo 🐍 CONFIGURANDO ENTORNO PYTHON
echo ===============================

echo 📁 Creando entorno virtual...
python -m venv .venv

echo 🔧 Activando entorno virtual...
call .venv\Scripts\activate

echo ⬆️  Actualizando pip...
python -m pip install --upgrade pip

echo 📦 Instalando dependencias Python...
pip install -r requirements.txt

REM 4️⃣ Configurar frontend
echo.
echo ⚛️  CONFIGURANDO FRONTEND REACT
echo ================================

echo 📦 Instalando dependencias Node.js...
cd frontend
npm install

echo 🏗️  Compilando aplicación...
npm run build

echo 🔙 Volviendo al directorio raíz...
cd ..

REM 5️⃣ Configurar variables de entorno
echo.
echo ⚙️  CONFIGURANDO VARIABLES DE ENTORNO
echo =====================================

if not exist ".env" (
    echo 📝 Creando archivo .env...
    copy env.example .env
    echo ✅ Archivo .env creado desde env.example
) else (
    echo ✅ Archivo .env ya existe
)

REM 6️⃣ Verificar instalación
echo.
echo 🔍 VERIFICANDO INSTALACIÓN
echo ===========================

echo 🧪 Ejecutando verificador del sistema...
python scripts\verify_system.py

echo.
echo 🎉 INSTALACIÓN COMPLETADA
echo =========================
echo.
echo 📋 PRÓXIMOS PASOS:
echo    1. Activar entorno virtual: .venv\Scripts\activate
echo    2. Iniciar dashboard: python scripts\run_dashboard.py
echo    3. En otra terminal, iniciar bot: python scripts\run_bot.py
echo    4. Abrir navegador: http://localhost:8000
echo.
echo 📚 Para más información, consulta docs\OLLAMA_SETUP.md
echo.
echo 🚀 ¡Disfruta del trading automatizado con IA!
pause




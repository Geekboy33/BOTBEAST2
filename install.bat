@echo off
REM Script de instalación para Grok-Beast Dashboard (Windows)

echo 🚀 Instalando Grok-Beast Dashboard...

REM Verificar que Node.js esté instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no está instalado. Por favor instala Node.js 20+ desde https://nodejs.org
    pause
    exit /b 1
)

REM Verificar que Python esté instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python no está instalado. Por favor instala Python 3.11+
    pause
    exit /b 1
)

echo ✅ Node.js y Python encontrados

REM Instalar dependencias de Python
echo 📦 Instalando dependencias de Python...
python -m venv .venv
call .venv\Scripts\activate.bat
pip install -r requirements.txt

REM Instalar dependencias del frontend
echo 📦 Instalando dependencias del frontend...
cd frontend
npm install

REM Compilar el frontend
echo 🔨 Compilando frontend...
npm run build

cd ..

echo ✅ Instalación completada!
echo.
echo Para ejecutar el dashboard:
echo   python scripts/run_dashboard.py
echo.
echo Para ejecutar el bot:
echo   python scripts/run_bot.py
echo.
echo El dashboard estará disponible en: http://localhost:8000
pause











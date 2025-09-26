#!/bin/bash
# Script de instalación automática para Grok-Beast Trading Bot

set -e  # Salir si hay errores

echo "🚀 INSTALADOR AUTOMÁTICO - GROK-BEAST TRADING BOT"
echo "=================================================="

# Detectar sistema operativo
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    OS="windows"
else
    OS="unknown"
fi

echo "🖥️  Sistema detectado: $OS"

# 1️⃣ Instalar dependencias del sistema
echo ""
echo "📦 INSTALANDO DEPENDENCIAS DEL SISTEMA"
echo "======================================"

if [[ "$OS" == "linux" ]]; then
    echo "🐧 Detectado Linux - Instalando con apt..."
    sudo apt update
    sudo apt install -y python3 python3-venv python3-pip nodejs npm git curl
    
elif [[ "$OS" == "macos" ]]; then
    echo "🍎 Detectado macOS - Verificando Homebrew..."
    if ! command -v brew &> /dev/null; then
        echo "Instalando Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    brew install python node git
    
elif [[ "$OS" == "windows" ]]; then
    echo "🪟 Detectado Windows - Instalación manual requerida:"
    echo "   1. Instalar Python 3.11+ desde python.org"
    echo "   2. Instalar Node.js 18+ desde nodejs.org"
    echo "   3. Instalar Git desde git-scm.com"
    echo "   Presiona Enter cuando hayas completado la instalación..."
    read
fi

# 2️⃣ Instalar Ollama
echo ""
echo "🤖 INSTALANDO OLLAMA"
echo "===================="

if [[ "$OS" == "linux" ]] || [[ "$OS" == "macos" ]]; then
    echo "📥 Descargando e instalando Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
    
    echo "🚀 Iniciando daemon de Ollama..."
    ollama serve &
    sleep 5
    
    echo "📦 Descargando modelo base..."
    ollama pull gpt-oss-120-turbo
    
elif [[ "$OS" == "windows" ]]; then
    echo "🪟 Para Windows, instala Ollama manualmente:"
    echo "   1. Ve a https://ollama.com/download"
    echo "   2. Descarga e instala Ollama"
    echo "   3. Abre PowerShell como administrador"
    echo "   4. Ejecuta: ollama serve"
    echo "   5. En otra terminal: ollama pull gpt-oss-120-turbo"
    echo "   Presiona Enter cuando hayas completado..."
    read
fi

# 3️⃣ Crear entorno virtual Python
echo ""
echo "🐍 CONFIGURANDO ENTORNO PYTHON"
echo "==============================="

echo "📁 Creando entorno virtual..."
python3 -m venv .venv

echo "🔧 Activando entorno virtual..."
source .venv/bin/activate

echo "⬆️  Actualizando pip..."
pip install --upgrade pip

echo "📦 Instalando dependencias Python..."
pip install -r requirements.txt

# 4️⃣ Configurar frontend
echo ""
echo "⚛️  CONFIGURANDO FRONTEND REACT"
echo "==============================="

echo "📦 Instalando dependencias Node.js..."
cd frontend
npm install

echo "🏗️  Compilando aplicación..."
npm run build

echo "🔙 Volviendo al directorio raíz..."
cd ..

# 5️⃣ Configurar variables de entorno
echo ""
echo "⚙️  CONFIGURANDO VARIABLES DE ENTORNO"
echo "====================================="

if [[ ! -f ".env" ]]; then
    echo "📝 Creando archivo .env..."
    cp env.example .env
    echo "✅ Archivo .env creado desde env.example"
else
    echo "✅ Archivo .env ya existe"
fi

# 6️⃣ Verificar instalación
echo ""
echo "🔍 VERIFICANDO INSTALACIÓN"
echo "==========================="

echo "🧪 Ejecutando verificador del sistema..."
python scripts/verify_system.py

echo ""
echo "🎉 INSTALACIÓN COMPLETADA"
echo "========================="
echo ""
echo "📋 PRÓXIMOS PASOS:"
echo "   1. Activar entorno virtual: source .venv/bin/activate"
echo "   2. Iniciar dashboard: python scripts/run_dashboard.py"
echo "   3. En otra terminal, iniciar bot: python scripts/run_bot.py"
echo "   4. Abrir navegador: http://localhost:8000"
echo ""
echo "📚 Para más información, consulta docs/OLLAMA_SETUP.md"
echo ""
echo "🚀 ¡Disfruta del trading automatizado con IA!"




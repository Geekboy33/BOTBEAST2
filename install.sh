#!/bin/bash
# Script de instalación para Grok-Beast Dashboard

echo "🚀 Instalando Grok-Beast Dashboard..."

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 20+ desde https://nodejs.org"
    exit 1
fi

# Verificar que Python esté instalado
if ! command -v python &> /dev/null; then
    echo "❌ Python no está instalado. Por favor instala Python 3.11+"
    exit 1
fi

echo "✅ Node.js y Python encontrados"

# Instalar dependencias de Python
echo "📦 Instalando dependencias de Python..."
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Instalar dependencias del frontend
echo "📦 Instalando dependencias del frontend..."
cd frontend
npm install

# Compilar el frontend
echo "🔨 Compilando frontend..."
npm run build

cd ..

echo "✅ Instalación completada!"
echo ""
echo "Para ejecutar el dashboard:"
echo "  python scripts/run_dashboard.py"
echo ""
echo "Para ejecutar el bot:"
echo "  python scripts/run_bot.py"
echo ""
echo "El dashboard estará disponible en: http://localhost:8000"











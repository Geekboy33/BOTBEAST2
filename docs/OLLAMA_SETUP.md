# 🤖 Configuración de Ollama - Grok-Beast Trading Bot

## 📋 Prerequisitos

### 1. Instalar Ollama

#### Linux/macOS:
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

#### Windows:
Descargar desde: https://ollama.com/download

### 2. Arrancar Ollama
```bash
ollama serve &
```

### 3. Descargar Modelo Base
```bash
ollama pull gpt-oss-120-turbo
```

### 4. Verificar Instalación
```bash
ollama list
ollama run gpt-oss-120-turbo "Hola, ¿funcionas?"
```

## 🔧 Configuración del Proyecto

### 1. Crear Entorno Virtual
```bash
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# o
.venv\Scripts\activate     # Windows
```

### 2. Instalar Dependencias
```bash
pip install -r requirements.txt
```

### 3. Configurar Variables de Entorno
```bash
cp env.example .env
# Editar .env con tus configuraciones
```

### 4. Compilar Frontend
```bash
cd frontend
npm install
npm run build
cd ..
```

## 🚀 Ejecución

### 1. Iniciar Dashboard
```bash
python scripts/run_dashboard.py
```
Acceder a: http://localhost:8000

### 2. Iniciar Bot (en otra terminal)
```bash
python scripts/run_bot.py
```

## 🎯 Entrenamiento del Modelo

### 1. Generar Datos de Entrenamiento
Ejecutar el bot por unas horas para generar transiciones en:
`gbsb/ai/ollama_transitions.jsonl`

### 2. Crear Modelo Fine-tuned
```bash
ollama create trader-oss-120 -f Modelfile.trader
```

### 3. Entrenar con Datos Generados
```bash
ollama train trader-oss-120 -f gbsb/ai/ollama_transitions.jsonl \
    --epochs 3 --batch 8 --learning-rate 0.0005
```

### 4. Usar Modelo Entrenado
Cambiar en `.env`:
```
OLLAMA_MODEL=trader-oss-120
```

## 📊 Monitoreo

### Métricas Disponibles
- **Reward Total**: `gbsb_rl_reward_total`
- **Epsilon**: `gbsb_rl_epsilon`
- **Loss**: `gbsb_rl_loss`

### Endpoints de API
- `/api/bot/status` - Estado del bot
- `/api/virtual/status` - Estado del virtual trader
- `/api/health` - Health check

## 🔧 Troubleshooting

### Ollama no responde
```bash
# Verificar que Ollama esté corriendo
ps aux | grep ollama

# Reiniciar Ollama
pkill ollama
ollama serve &
```

### Modelo no encontrado
```bash
# Verificar modelos disponibles
ollama list

# Re-descargar modelo
ollama pull gpt-oss-120-turbo
```

### Error de conexión
Verificar que `OLLAMA_HOST` en `.env` sea correcto:
```
OLLAMA_HOST=http://127.0.0.1:11434
```

## 📈 Optimización

### Para Mejor Performance
1. **GPU**: Usar GPU para Ollama si está disponible
2. **RAM**: Mínimo 16GB, recomendado 32GB+
3. **CPU**: 8+ cores para mejor throughput

### Configuración de Hardware
```bash
# Configurar Ollama para usar GPU
export OLLAMA_GPU_LAYERS=20

# Configurar memoria
export OLLAMA_MAX_LOADED_MODELS=1
```

## 🔄 Flujo de Trabajo

1. **Desarrollo**: Usar `gpt-oss-120-turbo` base
2. **Testing**: Ejecutar bot en `DRY_RUN=true`
3. **Recolección**: Generar transiciones por días/semanas
4. **Entrenamiento**: Fine-tune con datos recolectados
5. **Producción**: Usar modelo fine-tuned

## 📝 Logs y Debugging

### Logs del Bot
```bash
tail -f logs/trading_bot.log
```

### Logs de Ollama
```bash
tail -f ~/.ollama/logs/server.log
```

### Debug de Transiciones
```bash
tail -f gbsb/ai/ollama_transitions.jsonl
```

---

*Para más información, consultar la documentación completa en `/docs`*




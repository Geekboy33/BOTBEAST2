# 🚀 Grok-Beast Scalping Bot

Bot de trading automatizado con múltiples estrategias: Scalping con Q-learning, Market Making, Arbitrage y Controlador AI.

## 🎯 Características

- **Scalper Engine**: Q-learning + Smart Money Concepts
- **Market Maker**: Órdenes límite alrededor del mid-price
- **Arbitrage**: Diferencias de precio entre exchanges
- **AI Controller**: Red de políticas que elige la estrategia óptima
- **Dashboard React**: Interfaz moderna con métricas en tiempo real
- **WebSocket**: Logs en vivo y métricas streaming
- **Prometheus**: Métricas avanzadas para monitoreo

## 📁 Estructura del Proyecto

```
grok_beast_scalping_bot/
├─ frontend/                     # React Dashboard
│   ├─ src/
│   │   ├─ components/           # Componentes React
│   │   ├─ api/                  # Helpers para FastAPI
│   │   ├─ hooks/                # Hooks personalizados
│   │   └─ App.tsx              # App principal
│   ├─ package.json
│   └─ vite.config.ts
├─ gbsb/                        # Código Python del bot
├─ scripts/
│   ├─ run_dashboard.py         # Servidor FastAPI + React
│   └─ run_bot.py              # Ejecutar el bot
├─ Dockerfile                   # Con frontend incluido
└─ requirements.txt
```

## 🚀 Instalación Rápida

### Opción 1: Script Automático
```bash
# Linux/Mac
chmod +x install.sh
./install.sh

# Windows
install.bat
```

### Opción 2: Manual

1. **Instalar dependencias de Python:**
```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

2. **Instalar dependencias del frontend:**
```bash
cd frontend
npm install
npm run build
cd ..
```

3. **Configurar variables de entorno:**
```bash
cp .env.example .env
# Edita .env con tus tokens y configuraciones
```

## 🎮 Uso

### Ejecutar Dashboard
```bash
python scripts/run_dashboard.py
```
Abre http://localhost:8000 para ver el dashboard React.

### Ejecutar Bot
```bash
python scripts/run_bot.py
```

### Desarrollo Frontend
```bash
cd frontend
npm run dev
```
Frontend en http://localhost:5173 con hot-reload.

## 🐳 Docker

```bash
docker build -t grok-beast .
docker run -p 8000:8000 grok-beast
```

## 📊 Dashboard Features

- **Módulos**: Estado de cada estrategia (Scalper, Maker, Arbitrage, AI)
- **Configuración**: Formulario para ajustar parámetros del bot
- **Log en Vivo**: WebSocket con mensajes de trading en tiempo real
- **Métricas**: Gráficos de reward acumulado con Recharts
- **Responsive**: Diseño adaptativo con Tailwind CSS

## 🔧 Configuración

Variables principales en `.env`:

```env
# Trading
DRY_RUN=True                    # Modo simulación
MAKER_ENABLED=True              # Habilitar Market Maker
MAKER_SPREAD=0.001              # Spread para órdenes límite
ARB_ENABLED=True                # Habilitar Arbitrage
ARB_MIN_SPREAD=0.002            # Spread mínimo para arbitrage
AI_CONTROLLER_ENABLED=True      # Habilitar controlador AI

# APIs
TWITTER_BEARER_TOKEN=xxx        # Token de Twitter API
BINANCE_API_KEY=xxx             # API Key de Binance
BINANCE_SECRET_KEY=xxx          # Secret de Binance
```

## 📈 Métricas

- **Prometheus**: http://localhost:8000/metrics
- **Métricas Avanzadas**: http://localhost:8000/metrics/advanced
- **Grafana**: Configura para scrappear los endpoints

## 🧠 Entrenamiento AI

```bash
# Entrenar controlador offline
python scripts/train_controller.py

# Optimización genética de hiperparámetros
python -c "from gbsb.ai.genetic_optimizer import evolve; evolve()"
```

## 🛠️ Desarrollo

### Estructura Frontend
- `src/components/`: Componentes React reutilizables
- `src/api/`: Helpers para comunicación con FastAPI
- `src/hooks/`: Hooks personalizados (WebSocket, etc.)

### Tecnologías
- **Backend**: Python, FastAPI, WebSockets
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Gráficos**: Recharts
- **HTTP**: Axios
- **AI**: PyTorch, Stable-Baselines3

## 📝 Licencia

MIT License - Ver LICENSE para detalles.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## ⚠️ Disclaimer

Este software es solo para fines educativos. El trading con criptomonedas conlleva riesgos significativos. Usa siempre `DRY_RUN=True` para pruebas y nunca arriesgues más de lo que puedes permitirte perder.











# scripts/run_dashboard.py
import sys
import os
from pathlib import Path

# Agregar el directorio padre al path para importar gbsb
current_dir = Path(__file__).parent.parent
sys.path.insert(0, str(current_dir))

import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

# Importamos el router y el Engine
from gbsb.dashboard.api import router as api_router
from gbsb.trading.engine import ScalperEngine
from gbsb.config import settings

app = FastAPI(
    title="Grok-Beast Trading Bot API",
    description="API para el sistema de trading automatizado con IA",
    version="2.0.0"
)

# Incluir router de API
app.include_router(api_router, prefix="/api")

# --- Instancia única del Engine (para que los endpoints accedan a ella) ---
class MockModel:
    def predict(self, features):
        import random
        return random.choice([-1, 0, 1])

class MockExchange:
    def create_order(self, symbol, side, quantity, price):
        return {"order_id": f"mock_{symbol}_{side}"}

class MockSizer:
    def calculate_size(self, symbol, price, signal):
        return 0.001

class MockHedger:
    pass

# Crear instancias mock para testing
model = MockModel()
exchange = MockExchange()
sizer = MockSizer()
hedger = MockHedger()

# Crear engine principal
symbols = settings.SYMBOLS.split(",") if settings.SYMBOLS else ["BTCUSDT", "ETHUSDT"]
engine = ScalperEngine(symbols, model, exchange, sizer, hedger)

# Inyectar engine en el router
api_router.engine = engine

# --- Servir el bundle React (frontend/dist) ---
static_path = Path(__file__).parent.parent / "frontend" / "dist"
if static_path.exists():
    app.mount("/", StaticFiles(directory=static_path, html=True), name="react")
else:
    print("⚠️  Frontend not built. Run 'npm run build' in frontend directory")

@app.get("/")
async def root():
    return {"message": "Grok-Beast Trading Bot API", "version": "2.0.0"}

if __name__ == "__main__":
    print("🚀 Servidor Grok-Beast Trading API iniciado")
    print(f"📁 Sirviendo archivos desde: {static_path}")
    print("🌐 API disponible en: http://localhost:8000")
    print("📊 WebSocket en: ws://localhost:8000/ws")
    print("📈 Métricas Prometheus: http://localhost:8000/metrics")
    
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
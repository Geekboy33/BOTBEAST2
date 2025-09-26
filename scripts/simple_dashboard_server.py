#!/usr/bin/env python3
"""
Servidor simple para el dashboard de Grok-Beast
Sirve el frontend compilado y proporciona APIs básicas
"""

import os
import sys
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import threading
import time
from datetime import datetime
import random

# Configuración
FRONTEND_DIR = Path(__file__).parent.parent / "frontend" / "dist"
PORT = 8000

class DashboardHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(FRONTEND_DIR), **kwargs)
    
    def do_GET(self):
        # Si es una ruta de API, manejar aquí
        if self.path.startswith('/api/'):
            self.handle_api_request()
        else:
            # Para todas las demás rutas, servir el index.html
            if self.path == '/' or not os.path.exists(str(FRONTEND_DIR) + self.path):
                self.path = '/index.html'
            super().do_GET()
    
    def handle_api_request(self):
        """Manejar peticiones de API"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        if self.path == '/api/status':
            data = {
                "status": "online",
                "version": "2.0.0",
                "uptime": "2h 15m",
                "modules": {
                    "scalper": {"enabled": True, "status": "online", "trades_today": 15},
                    "maker": {"enabled": True, "status": "online", "spread": 0.001},
                    "arbitrage": {"enabled": True, "status": "online", "opportunities": 3},
                    "ai_controller": {"enabled": True, "status": "online", "accuracy": 0.85}
                },
                "active_orders": 0,
                "total_trades": 0,
                "daily_pnl": 0.0
            }
        elif self.path == '/api/config':
            data = {
                "exchanges": ["binance", "coinbase", "kraken"],
                "symbols": ["BTC/USDT", "ETH/USDT", "ADA/USDT"],
                "risk_level": "medium",
                "max_position_size": 1000,
                "stop_loss": 0.02,
                "take_profit": 0.05
            }
        elif self.path == '/api/orders':
            data = [
                {
                    "id": "ord_001",
                    "symbol": "BTC/USDT",
                    "side": "buy",
                    "amount": 0.1,
                    "price": 45000,
                    "status": "open",
                    "timestamp": datetime.now().isoformat()
                }
            ]
        elif self.path == '/api/prices':
            data = {
                "BTC/USDT": 45000 + random.randint(-1000, 1000),
                "ETH/USDT": 3000 + random.randint(-100, 100),
                "ADA/USDT": 0.5 + random.uniform(-0.1, 0.1)
            }
        elif self.path == '/api/exchanges':
            data = {
                "binance": {
                    "name": "Binance",
                    "status": "connected",
                    "balance": 5000.0,
                    "fees": {"maker": 0.001, "taker": 0.001},
                    "supported_pairs": ["BTCUSDT", "ETHUSDT", "BNBUSDT"]
                },
                "coinbase": {
                    "name": "Coinbase Pro",
                    "status": "connected",
                    "balance": 3000.0,
                    "fees": {"maker": 0.005, "taker": 0.005},
                    "supported_pairs": ["BTC-USD", "ETH-USD"]
                },
                "kraken": {
                    "name": "Kraken",
                    "status": "disconnected",
                    "balance": 0.0,
                    "fees": {"maker": 0.0016, "taker": 0.0026},
                    "supported_pairs": ["XBTUSD", "ETHUSD"]
                }
            }
        elif self.path == '/api/bots':
            data = [
                {
                    "id": "scalper_1",
                    "name": "Scalper Q-Learning",
                    "type": "scalper",
                    "status": "running",
                    "mode": "demo",
                    "uptime": 3600,
                    "trades": 15,
                    "pnl": 125.50,
                    "winRate": 0.68
                },
                {
                    "id": "maker_1",
                    "name": "Market Maker Pro",
                    "type": "maker",
                    "status": "stopped",
                    "mode": "demo",
                    "uptime": 0,
                    "trades": 8,
                    "pnl": 45.20,
                    "winRate": 0.75
                },
                {
                    "id": "arbitrage_1",
                    "name": "Arbitrage Hunter",
                    "type": "arbitrage",
                    "status": "running",
                    "mode": "real",
                    "uptime": 7200,
                    "trades": 3,
                    "pnl": 89.75,
                    "winRate": 1.0
                }
            ]
        elif self.path == '/api/bot-logic':
            data = {
                "modules": [
                    {
                        "id": "scalper_qlearning",
                        "name": "Scalper Q-Learning",
                        "type": "scalper",
                        "description": "Algoritmo de aprendizaje por refuerzo que aprende patrones de scalping óptimos",
                        "algorithm": "Q-Learning con función de recompensa basada en profit factor y drawdown",
                        "status": "active",
                        "performance": {
                            "winRate": 0.68,
                            "profitFactor": 2.1,
                            "sharpeRatio": 1.85,
                            "maxDrawdown": 0.08
                        }
                    },
                    {
                        "id": "market_maker",
                        "name": "Market Maker Pro",
                        "type": "maker",
                        "description": "Estrategia de market making que coloca órdenes límite alrededor del mid-price",
                        "algorithm": "Algoritmo de market making adaptativo con ajuste dinámico de spreads",
                        "status": "active",
                        "performance": {
                            "winRate": 0.75,
                            "profitFactor": 1.8,
                            "sharpeRatio": 2.1,
                            "maxDrawdown": 0.05
                        }
                    }
                ],
                "decisionFlow": [
                    {"step": 1, "module": "ai_controller", "action": "analyze_market", "condition": "market_data_available"},
                    {"step": 2, "module": "ai_controller", "action": "select_strategy", "condition": "volatility > 0.02"},
                    {"step": 3, "module": "scalper_qlearning", "action": "execute_scalp", "condition": "spread > min_spread"}
                ],
                "riskManagement": {
                    "maxPositionSize": 10000,
                    "stopLossPercentage": 0.05,
                    "takeProfitPercentage": 0.10,
                    "maxDailyLoss": 500
                }
            }
        else:
            data = {"message": "API endpoint not found", "path": self.path}
        
        self.wfile.write(json.dumps(data).encode())
    
    def do_OPTIONS(self):
        """Manejar peticiones OPTIONS para CORS"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def main():
    """Función principal"""
    print("🚀 Servidor Grok-Beast Dashboard iniciado")
    print(f"📁 Sirviendo archivos desde: {FRONTEND_DIR}")
    print(f"🌐 Abre tu navegador en: http://localhost:{PORT}")
    print("⏹️  Presiona Ctrl+C para detener el servidor")
    
    if not FRONTEND_DIR.exists():
        print(f"❌ Error: Directorio frontend no encontrado: {FRONTEND_DIR}")
        sys.exit(1)
    
    try:
        server = HTTPServer(('0.0.0.0', PORT), DashboardHandler)
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Servidor detenido")
        server.shutdown()

if __name__ == "__main__":
    main()

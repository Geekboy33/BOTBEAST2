# scripts/run_dashboard_simple.py
import sys
import os
from pathlib import Path

# Agregar el directorio padre al path para importar gbsb
current_dir = Path(__file__).parent.parent
sys.path.insert(0, str(current_dir))

import uvicorn
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from typing import Dict, Any, List, Optional
import structlog
import json
import asyncio
from datetime import datetime, timedelta, timezone
import random

# Configurar logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)

app = FastAPI(
    title="Grok-Beast Trading Bot API",
    description="API para el sistema de trading automatizado con IA",
    version="2.0.0"
)

# Almacenamiento en memoria para datos del dashboard
dashboard_data = {
    "orders": [],
    "trades": [],
    "alerts": [],
    "prices": {},
    "portfolio": {},
    "metrics": {},
    "logs": []
}

# Conexiones WebSocket activas
active_connections: List[WebSocket] = []

# ==================== ENDPOINTS PARA TRADING ====================

@app.get("/api/orders")
async def get_orders():
    """Obtener todas las órdenes"""
    return dashboard_data["orders"]

@app.post("/api/orders")
async def create_order(order_data: dict):
    """Crear nueva orden"""
    order_id = f"order_{len(dashboard_data['orders']) + 1}_{int(datetime.now().timestamp())}"
    order = {
        "id": order_id,
        "symbol": order_data.get("symbol", "BTCUSDT"),
        "side": order_data.get("side", "buy"),
        "type": order_data.get("type", "market"),
        "quantity": order_data.get("quantity", 0.001),
        "price": order_data.get("price", 0),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    dashboard_data["orders"].append(order)
    return {"success": True, "order_id": order_id}

@app.delete("/api/orders/{order_id}")
async def cancel_order(order_id: str):
    """Cancelar orden"""
    for order in dashboard_data["orders"]:
        if order["id"] == order_id and order["status"] == "pending":
            order["status"] = "cancelled"
            order["updated_at"] = datetime.now(timezone.utc).isoformat()
            return {"success": True}
    raise HTTPException(status_code=404, detail="Order not found")

@app.get("/api/trades")
async def get_trades():
    """Obtener todos los trades"""
    return dashboard_data["trades"]

@app.get("/api/prices")
async def get_prices():
    """Obtener precios actuales"""
    # Generar precios simulados si no existen
    if not dashboard_data["prices"]:
        symbols = ["BTCUSDT", "ETHUSDT", "ADAUSDT", "SOLUSDT", "DOTUSDT"]
        for symbol in symbols:
            base_price = {
                "BTCUSDT": 45000,
                "ETHUSDT": 3000,
                "ADAUSDT": 0.5,
                "SOLUSDT": 100,
                "DOTUSDT": 8
            }.get(symbol, 100)
            
            # Agregar variación aleatoria
            variation = random.uniform(-0.05, 0.05)
            price = base_price * (1 + variation)
            dashboard_data["prices"][symbol] = round(price, 2)
    
    return dashboard_data["prices"]

# ==================== ENDPOINTS PARA ALERTAS ====================

@app.get("/api/alerts")
async def get_alerts():
    """Obtener todas las alertas"""
    return dashboard_data["alerts"]

@app.post("/api/alerts")
async def create_alert(alert_data: dict):
    """Crear nueva alerta"""
    alert_id = f"alert_{len(dashboard_data['alerts']) + 1}_{int(datetime.now().timestamp())}"
    alert = {
        "id": alert_id,
        "type": alert_data.get("type", "price"),
        "condition": alert_data.get("condition", "above"),
        "value": alert_data.get("value", 0),
        "symbol": alert_data.get("symbol", "BTCUSDT"),
        "channels": alert_data.get("channels", []),
        "enabled": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    dashboard_data["alerts"].append(alert)
    return {"success": True, "alert_id": alert_id}

@app.delete("/api/alerts/{alert_id}")
async def delete_alert(alert_id: str):
    """Eliminar alerta"""
    dashboard_data["alerts"] = [a for a in dashboard_data["alerts"] if a["id"] != alert_id]
    return {"success": True}

# ==================== ENDPOINTS PARA PORTFOLIO ====================

@app.get("/api/portfolio")
async def get_portfolio():
    """Obtener información del portfolio"""
    if not dashboard_data["portfolio"]:
        # Generar datos de portfolio simulados
        dashboard_data["portfolio"] = {
            "total_balance": 10000.0,
            "available_balance": 8500.0,
            "positions": [
                {
                    "symbol": "BTCUSDT",
                    "side": "long",
                    "size": 0.1,
                    "entry_price": 45000,
                    "current_price": 45500,
                    "pnl": 50.0,
                    "pnl_percent": 1.11
                },
                {
                    "symbol": "ETHUSDT",
                    "side": "short",
                    "size": 1.0,
                    "entry_price": 3000,
                    "current_price": 2950,
                    "pnl": 50.0,
                    "pnl_percent": 1.67
                }
            ],
            "daily_pnl": 150.0,
            "total_pnl": 2500.0,
            "win_rate": 0.75
        }
    
    return dashboard_data["portfolio"]

@app.get("/api/portfolio/metrics")
async def get_portfolio_metrics():
    """Obtener métricas del portfolio"""
    portfolio = dashboard_data["portfolio"]
    return {
        "total_balance": portfolio.get("total_balance", 0),
        "daily_pnl": portfolio.get("daily_pnl", 0),
        "total_pnl": portfolio.get("total_pnl", 0),
        "win_rate": portfolio.get("win_rate", 0),
        "sharpe_ratio": 1.25,
        "max_drawdown": 0.15,
        "total_trades": 150,
        "active_positions": len(portfolio.get("positions", []))
    }

# Endpoint duplicado removido

# ==================== ENDPOINTS PARA CONFIGURACIÓN ====================

@app.get("/api/config")
async def get_config():
    """Obtener configuración actual"""
    return {
        "dry_run": True,
        "maker_enabled": True,
        "arb_enabled": True,
        "ai_controller_enabled": True,
        "virtual_trader_enabled": True,
        "ollama_model": "gpt-oss:120b",
        "risk_level": "conservative",
        "max_position_size": 0.1,
        "stop_loss_percent": 0.02,
        "take_profit_percent": 0.04
    }

@app.post("/api/config")
async def update_config(config_data: dict):
    """Actualizar configuración"""
    logger.info(f"Config updated: {config_data}")
    return {"success": True, "message": "Configuration updated"}

# ==================== ENDPOINTS PARA MÉTRICAS ====================

@app.get("/api/metrics")
async def get_metrics():
    """Obtener métricas del sistema"""
    return {
        "total_trades": len(dashboard_data["trades"]),
        "active_orders": len([o for o in dashboard_data["orders"] if o["status"] == "pending"]),
        "daily_pnl": dashboard_data["portfolio"].get("daily_pnl", 0),
        "win_rate": dashboard_data["portfolio"].get("win_rate", 0),
        "system_uptime": "2h 15m",
        "cpu_usage": 45.2,
        "memory_usage": 68.5,
        "api_calls_per_minute": 120
    }

@app.get("/api/metrics/advanced")
async def get_advanced_metrics():
    """Obtener métricas avanzadas"""
    return {
        "trading_metrics": {
            "total_trades": 150,
            "winning_trades": 113,
            "losing_trades": 37,
            "win_rate": 0.753,
            "avg_win": 45.2,
            "avg_loss": -28.7,
            "profit_factor": 1.58,
            "sharpe_ratio": 1.25,
            "max_drawdown": 0.15,
            "recovery_factor": 8.33
        },
        "system_metrics": {
            "cpu_usage": 45.2,
            "memory_usage": 68.5,
            "disk_usage": 23.1,
            "network_latency": 12.5,
            "api_calls_per_minute": 120,
            "error_rate": 0.02
        },
        "ai_metrics": {
            "model_accuracy": 0.85,
            "prediction_confidence": 0.78,
            "training_samples": 10000,
            "last_training": "2024-01-15T08:30:00Z",
            "epsilon_value": 0.1,
            "reward_trend": "increasing"
        }
    }

# ==================== WEBSOCKET PARA LOGS EN VIVO ====================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket para logs en tiempo real"""
    await websocket.accept()
    active_connections.append(websocket)
    
    try:
        while True:
            # Simular logs en tiempo real
            log_entry = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "level": random.choice(["INFO", "WARNING", "ERROR"]),
                "message": random.choice([
                    "[SCALPER] Signal generated: BUY BTCUSDT @ 45000",
                    "[MARKET_MAKER] Order placed: SELL ETHUSDT @ 3000",
                    "[ARBITRAGE] Opportunity detected: BTCUSDT spread 0.5%",
                    "[AI_CONTROLLER] Action selected: SCALPER",
                    "[VIRTUAL] Position opened: LONG ADAUSDT @ 0.52",
                    "[VIRTUAL] Position closed: SHORT SOLUSDT @ 98.5 (+2.1%)",
                    "[OLLAMA] Prediction: Market trending up, confidence 0.85"
                ]),
                "module": random.choice(["SCALPER", "MARKET_MAKER", "ARBITRAGE", "AI_CONTROLLER", "VIRTUAL", "OLLAMA"])
            }
            
            dashboard_data["logs"].append(log_entry)
            # Mantener solo los últimos 100 logs
            if len(dashboard_data["logs"]) > 100:
                dashboard_data["logs"] = dashboard_data["logs"][-100:]
            
            await websocket.send_text(json.dumps(log_entry))
            await asyncio.sleep(random.uniform(1, 5))  # Enviar logs cada 1-5 segundos
            
    except WebSocketDisconnect:
        active_connections.remove(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        if websocket in active_connections:
            active_connections.remove(websocket)

# ==================== ENDPOINTS PARA STATUS GENERAL ====================

@app.get("/api/status")
async def get_status():
    """Estado general del sistema"""
    return {
        "status": "online",
        "version": "2.0.0",
        "uptime": "2h 15m",
        "modules": {
            "scalper": {
                "enabled": True,
                "status": "online",
                "trades_today": 15
            },
            "maker": {
                "enabled": True,
                "status": "online",
                "spread": 0.001
            },
            "arbitrage": {
                "enabled": True,
                "status": "online",
                "opportunities": 3
            },
            "ai_controller": {
                "enabled": True,
                "status": "online",
                "accuracy": 0.85
            }
        },
        "active_orders": len([o for o in dashboard_data["orders"] if o["status"] == "pending"]),
        "total_trades": len(dashboard_data["trades"]),
        "daily_pnl": dashboard_data["portfolio"].get("daily_pnl", 0)
    }

@app.get("/api/health")
async def health_check():
    """Health check del sistema"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "2.0.0"
    }

@app.get("/health")
async def health_check_alt():
    """Health check alternativo"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "2.0.0"
    }

# ==================== ENDPOINTS PARA BOT ====================

@app.get("/api/bot/status")
async def bot_status():
    """Estado del bot de trading"""
    return {
        "status": "running",
        "symbols": ["BTCUSDT", "ETHUSDT", "ADAUSDT"],
        "last_signals": {"BTCUSDT": 1, "ETHUSDT": -1, "ADAUSDT": 0},
        "virtual_trader_enabled": True
    }

@app.get("/api/bot/metrics")
async def bot_metrics():
    """Métricas del bot"""
    return {
        "total_trades": 150,
        "win_rate": 0.75,
        "total_pnl": 2500.0,
        "sharpe_ratio": 1.25,
        "max_drawdown": 0.15
    }

@app.post("/api/bot/start")
async def start_bot():
    """Iniciar el bot"""
    return {"success": True, "message": "Bot started successfully"}

@app.post("/api/bot/stop")
async def stop_bot():
    """Detener el bot"""
    return {"success": True, "message": "Bot stopped successfully"}

@app.get("/api/bot/status")
async def bot_status_alt():
    """Estado del bot (alternativo)"""
    return await bot_status()

@app.get("/api/bot/metrics")
async def bot_metrics_alt():
    """Métricas del bot (alternativo)"""
    return await bot_metrics()

# ==================== ENDPOINTS PARA VIRTUAL TRADER ====================

@app.get("/api/virtual/status")
async def virtual_status():
    """Estado del VirtualTrader"""
    return {
        "open_positions": {
            "BTCUSDT": {
                "side": "long",
                "entry": 45000.0,
                "size": 0.1,
                "tp": 46500.0,
                "sl": 43500.0,
                "opened_at": "2024-01-15T10:30:00Z"
            }
        },
        "closed_stats": {
            "total_trades": 25,
            "cumulative_return": 0.15,
            "current_equity": 11500.0
        }
    }

# ==================== ENDPOINTS ADICIONALES ====================

@app.get("/api/modules")
async def get_modules():
    """Obtener estado de todos los módulos"""
    return {
        "scalper": {
            "enabled": True,
            "status": "online",
            "trades_today": 15,
            "profit_today": 125.50
        },
        "market_maker": {
            "enabled": True,
            "status": "online",
            "spread": 0.001,
            "orders_placed": 45
        },
        "arbitrage": {
            "enabled": True,
            "status": "online",
            "opportunities": 3,
            "profit_today": 89.25
        },
        "ai_controller": {
            "enabled": True,
            "status": "online",
            "accuracy": 0.85,
            "predictions_today": 120
        },
        "virtual_trader": {
            "enabled": True,
            "status": "online",
            "positions": 1,
            "total_trades": 25
        },
        "pair_scanner": {
            "enabled": True,
            "status": "online",
            "pairs_scanned": 150,
            "opportunities_found": 8
        },
        "news_filter": {
            "enabled": True,
            "status": "online",
            "news_processed": 45,
            "signals_generated": 3
        },
        "risk_manager": {
            "enabled": True,
            "status": "online",
            "max_exposure": 0.15,
            "current_exposure": 0.08
        }
    }

@app.get("/api/analytics")
async def get_analytics():
    """Obtener análisis técnico avanzado"""
    return {
        "technical_indicators": {
            "rsi": {"BTCUSDT": 65.2, "ETHUSDT": 58.7, "ADAUSDT": 42.1},
            "macd": {"BTCUSDT": 125.5, "ETHUSDT": -45.2, "ADAUSDT": 78.9},
            "bollinger": {"BTCUSDT": {"upper": 46500, "middle": 45000, "lower": 43500}}
        },
        "support_resistance": {
            "BTCUSDT": {
                "support": [44000, 43000, 42000],
                "resistance": [46000, 47000, 48000]
            },
            "ETHUSDT": {
                "support": [2900, 2800, 2700],
                "resistance": [3100, 3200, 3300]
            }
        },
        "fibonacci": {
            "BTCUSDT": {
                "retracements": [0.236, 0.382, 0.5, 0.618, 0.786],
                "extensions": [1.272, 1.414, 1.618]
            }
        },
        "ict_analysis": {
            "order_blocks": 5,
            "fair_value_gaps": 3,
            "liquidity_sweeps": 2,
            "market_structure": "bullish"
        },
        "session_analysis": {
            "american": {"volume": 0.45, "trend": "bullish"},
            "asian": {"volume": 0.25, "trend": "sideways"},
            "european": {"volume": 0.30, "trend": "bullish"}
        }
    }

@app.get("/api/exchanges")
async def get_exchanges():
    """Obtener estado de exchanges conectados"""
    return {
        "binance": {
            "connected": True,
            "status": "online",
            "balance": {"USDT": 5000.0, "BTC": 0.1},
            "pairs_available": 1200
        },
        "kraken": {
            "connected": True,
            "status": "online",
            "balance": {"USDT": 3000.0, "BTC": 0.05},
            "pairs_available": 800
        },
        "kucoin": {
            "connected": False,
            "status": "offline",
            "balance": {"USDT": 0.0, "BTC": 0.0},
            "pairs_available": 0
        },
        "okx": {
            "connected": True,
            "status": "online",
            "balance": {"USDT": 2000.0, "BTC": 0.03},
            "pairs_available": 600
        }
    }

@app.get("/api/arbitrage")
async def get_arbitrage_opportunities():
    """Obtener oportunidades de arbitraje"""
    return {
        "opportunities": [
            {
                "symbol": "BTCUSDT",
                "exchanges": ["binance", "kraken"],
                "spread": 0.8,
                "profit_potential": 125.50,
                "volume_available": 0.5
            },
            {
                "symbol": "ETHUSDT",
                "exchanges": ["binance", "okx"],
                "spread": 0.5,
                "profit_potential": 89.25,
                "volume_available": 2.0
            }
        ],
        "total_opportunities": 2,
        "total_profit_potential": 214.75
    }

@app.get("/api/scanner")
async def get_scanner_results():
    """Obtener resultados del scanner de pares"""
    return {
        "spot_pairs": [
            {"symbol": "BTCUSDT", "volume_24h": 2500000, "change_24h": 2.5, "signal": "buy"},
            {"symbol": "ETHUSDT", "volume_24h": 1800000, "change_24h": 1.8, "signal": "buy"},
            {"symbol": "ADAUSDT", "volume_24h": 800000, "change_24h": -0.5, "signal": "sell"}
        ],
        "futures_pairs": [
            {"symbol": "BTCUSDT", "volume_24h": 3500000, "change_24h": 3.2, "signal": "buy"},
            {"symbol": "ETHUSDT", "volume_24h": 2200000, "change_24h": 2.1, "signal": "buy"}
        ],
        "total_scanned": 150,
        "opportunities_found": 8
    }

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

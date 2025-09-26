# gbsb/dashboard/api.py
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from typing import Dict, Any, List, Optional
import structlog
import json
import asyncio
from datetime import datetime, timedelta
import random

logger = structlog.get_logger(__name__)

router = APIRouter()

# Variable global para el engine (se inyecta desde run_dashboard.py)
engine = None

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

@router.get("/bot/status")
async def bot_status():
    """Estado del bot de trading"""
    if not engine:
        raise HTTPException(status_code=503, detail="Engine not initialized")
    
    try:
        status = engine.get_status()
        return {
            "status": "running" if status["is_running"] else "stopped",
            "symbols": status["symbols"],
            "last_signals": status["last_signals"],
            "virtual_trader_enabled": status["virtual_trader_enabled"]
        }
    except Exception as e:
        logger.error(f"Error getting bot status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/bot/metrics")
async def bot_metrics():
    """Métricas del bot"""
    return {
        "total_trades": 0,  # Implementar contador real
        "win_rate": 0.0,
        "total_pnl": 0.0,
        "sharpe_ratio": 0.0,
        "max_drawdown": 0.0
    }

@router.get("/virtual/status")
async def virtual_status():
    """
    Devuelve el snapshot del VirtualTrader (posición abierta, equity, stats)
    """
    if not engine or not engine.virtual_trader:
        raise HTTPException(status_code=404, detail="VirtualTrader no está habilitado")
    
    try:
        snapshot = engine.virtual_trader.snapshot()
        return snapshot
    except Exception as e:
        logger.error(f"Error getting virtual trader status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bot/start")
async def start_bot():
    """Iniciar el bot"""
    if not engine:
        raise HTTPException(status_code=503, detail="Engine not initialized")
    
    try:
        engine.start()
        return {"success": True, "message": "Bot started successfully"}
    except Exception as e:
        logger.error(f"Error starting bot: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bot/stop")
async def stop_bot():
    """Detener el bot"""
    if not engine:
        raise HTTPException(status_code=503, detail="Engine not initialized")
    
    try:
        engine.stop()
        return {"success": True, "message": "Bot stopped successfully"}
    except Exception as e:
        logger.error(f"Error stopping bot: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """Health check del sistema"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "version": "2.0.0"
    }

# ==================== ENDPOINTS PARA TRADING ====================

@router.get("/orders")
async def get_orders():
    """Obtener todas las órdenes"""
    return dashboard_data["orders"]

@router.post("/orders")
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
        "created_at": datetime.utcnow().isoformat() + "Z",
        "updated_at": datetime.utcnow().isoformat() + "Z"
    }
    dashboard_data["orders"].append(order)
    return {"success": True, "order_id": order_id}

@router.delete("/orders/{order_id}")
async def cancel_order(order_id: str):
    """Cancelar orden"""
    for order in dashboard_data["orders"]:
        if order["id"] == order_id and order["status"] == "pending":
            order["status"] = "cancelled"
            order["updated_at"] = datetime.utcnow().isoformat() + "Z"
            return {"success": True}
    raise HTTPException(status_code=404, detail="Order not found")

@router.get("/trades")
async def get_trades():
    """Obtener todos los trades"""
    return dashboard_data["trades"]

@router.get("/prices")
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

@router.get("/alerts")
async def get_alerts():
    """Obtener todas las alertas"""
    return dashboard_data["alerts"]

@router.post("/alerts")
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
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    dashboard_data["alerts"].append(alert)
    return {"success": True, "alert_id": alert_id}

@router.delete("/alerts/{alert_id}")
async def delete_alert(alert_id: str):
    """Eliminar alerta"""
    dashboard_data["alerts"] = [a for a in dashboard_data["alerts"] if a["id"] != alert_id]
    return {"success": True}

# ==================== ENDPOINTS PARA PORTFOLIO ====================

@router.get("/portfolio")
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

@router.get("/portfolio/metrics")
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

# ==================== ENDPOINTS PARA CONFIGURACIÓN ====================

@router.get("/config")
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

@router.post("/config")
async def update_config(config_data: dict):
    """Actualizar configuración"""
    # En una implementación real, esto guardaría en archivo de configuración
    logger.info(f"Config updated: {config_data}")
    return {"success": True, "message": "Configuration updated"}

# ==================== ENDPOINTS PARA MÉTRICAS ====================

@router.get("/metrics")
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

@router.get("/metrics/advanced")
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

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket para logs en tiempo real"""
    await websocket.accept()
    active_connections.append(websocket)
    
    try:
        while True:
            # Simular logs en tiempo real
            log_entry = {
                "timestamp": datetime.utcnow().isoformat() + "Z",
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

@router.get("/status")
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

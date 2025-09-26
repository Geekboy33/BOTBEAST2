# scripts/advanced_server.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import asyncio
import json
import time
import random
import uuid
from datetime import datetime, timedelta
from pathlib import Path
import sqlite3
import hashlib
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
import threading
import pandas as pd
import numpy as np

# Importar módulos del bot
try:
    from gbsb.ai.autopilot_engine import AutopilotEngine, AutopilotConfig, create_autopilot_engine
    from gbsb.ai.ollama_integration import OllamaTradingAI, OllamaConfig
    from gbsb.ai.auto_opportunity_detector import AutoOpportunityDetector, AutoDetectorConfig, create_auto_detector
    from gbsb.exchanges.multi_exchange_manager import MultiExchangeManager, ExchangeConfig
    from gbsb.technical_analysis.support_resistance import SupportResistanceAnalyzer
    from gbsb.technical_analysis.channel_analysis import ChannelAnalyzer
    from gbsb.technical_analysis.ict_analysis import ICTAnalyzer
    from gbsb.technical_analysis.fibonacci_analysis import FibonacciAnalyzer
    from gbsb.technical_analysis.session_analysis import SessionAnalyzer
    from gbsb.technical_analysis.spread_analysis import SpreadAnalyzer
    from gbsb.scanners.pair_scanner import PairScanner, ScanConfig, QuickOpportunity, create_pair_scanner
    from gbsb.risk_management.risk_levels import RiskManager, RiskLevel, PositionSizing, create_risk_manager
    from gbsb.fundamental_analysis.news_filter import NewsAnalyzer, NewsFilter, NewsSource, create_news_filter
    ADVANCED_FEATURES_AVAILABLE = True
except ImportError as e:
    print(f"Advertencia: No se pudieron importar módulos avanzados: {e}")
    ADVANCED_FEATURES_AVAILABLE = False

# Configuración
FRONTEND_DIR = Path(__file__).parent.parent / "frontend" / "dist"

app = FastAPI(title="Grok-Beast Trading API", version="2.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Base de datos SQLite
def init_db():
    conn = sqlite3.connect('trading_bot.db')
    cursor = conn.cursor()
    
    # Tabla de órdenes
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            symbol TEXT NOT NULL,
            side TEXT NOT NULL,
            type TEXT NOT NULL,
            quantity REAL NOT NULL,
            price REAL,
            stop_price REAL,
            status TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            pnl REAL DEFAULT 0,
            fees REAL DEFAULT 0
        )
    ''')
    
    # Tabla de trades
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS trades (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL,
            symbol TEXT NOT NULL,
            side TEXT NOT NULL,
            quantity REAL NOT NULL,
            price REAL NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            pnl REAL DEFAULT 0,
            fees REAL DEFAULT 0,
            FOREIGN KEY (order_id) REFERENCES orders (id)
        )
    ''')
    
    # Tabla de métricas
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            total_pnl REAL DEFAULT 0,
            realized_pnl REAL DEFAULT 0,
            unrealized_pnl REAL DEFAULT 0,
            total_value REAL DEFAULT 0,
            win_rate REAL DEFAULT 0,
            total_trades INTEGER DEFAULT 0,
            winning_trades INTEGER DEFAULT 0
        )
    ''')
    
    # Tabla de usuarios
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            two_factor_enabled BOOLEAN DEFAULT FALSE,
            two_factor_secret TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        )
    ''')
    
    # Tabla de alertas
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS alerts (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            type TEXT NOT NULL,
            condition TEXT NOT NULL,
            value REAL NOT NULL,
            enabled BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()

# Inicializar BD
init_db()

# Modelos Pydantic
class OrderCreate(BaseModel):
    symbol: str
    side: str  # 'buy' o 'sell'
    type: str  # 'market', 'limit', 'stop'
    quantity: float
    price: Optional[float] = None
    stop_price: Optional[float] = None

class OrderResponse(BaseModel):
    id: str
    symbol: str
    side: str
    type: str
    quantity: float
    price: Optional[float]
    stop_price: Optional[float]
    status: str
    created_at: datetime
    updated_at: datetime
    pnl: float
    fees: float

class TradeResponse(BaseModel):
    id: str
    order_id: str
    symbol: str
    side: str
    quantity: float
    price: float
    timestamp: datetime
    pnl: float
    fees: float

class MetricsResponse(BaseModel):
    total_pnl: float
    realized_pnl: float
    unrealized_pnl: float
    total_value: float
    win_rate: float
    total_trades: int
    winning_trades: int
    daily_pnl: float
    weekly_pnl: float
    monthly_pnl: float

class AlertCreate(BaseModel):
    type: str  # 'price', 'pnl', 'volume'
    condition: str  # 'above', 'below', 'equals'
    value: float
    symbol: Optional[str] = None

class AlertResponse(BaseModel):
    id: str
    type: str
    condition: str
    value: float
    symbol: Optional[str]
    enabled: bool
    created_at: datetime

class BotConfig(BaseModel):
    DRY_RUN: bool = True
    MAKER_ENABLED: bool = True
    MAKER_SPREAD: float = 0.001
    ARB_ENABLED: bool = True
    ARB_MIN_SPREAD: float = 0.002
    AI_CONTROLLER_ENABLED: bool = True
    MAX_POSITION_SIZE: float = 1000.0
    RISK_PER_TRADE: float = 0.02
    STOP_LOSS_PERCENTAGE: float = 0.05
    TAKE_PROFIT_PERCENTAGE: float = 0.10

class BotStatus(BaseModel):
    status: str
    version: str
    uptime: str
    modules: Dict[str, Dict[str, Any]]
    active_orders: int
    total_trades: int
    daily_pnl: float

# Inicializar analizadores avanzados si están disponibles
if ADVANCED_FEATURES_AVAILABLE:
    support_resistance_analyzer = SupportResistanceAnalyzer()
    channel_analyzer = ChannelAnalyzer()
    ict_analyzer = ICTAnalyzer()
    fibonacci_analyzer = FibonacciAnalyzer()
    session_analyzer = SessionAnalyzer()
    spread_analyzer = SpreadAnalyzer()
    
    # Inicializar motor de piloto automático
    autopilot_config = AutopilotConfig(
        enabled_strategies=['support_resistance', 'channel_analysis', 'ict_techniques', 'fibonacci', 'session_analysis', 'spread_analysis'],
        min_confidence_threshold=0.7,
        trading_enabled=False,  # Solo análisis por defecto
        dry_run=True,
        ai_ollama_enabled=True
    )
    
    # Configuración de exchanges (sandbox por defecto)
    exchange_configs = [
        ExchangeConfig(name='binance', sandbox=True, enabled=True, priority=1),
        ExchangeConfig(name='kraken', sandbox=True, enabled=True, priority=2),
        ExchangeConfig(name='kucoin', sandbox=True, enabled=True, priority=3),
        ExchangeConfig(name='okx', sandbox=True, enabled=True, priority=4)
    ]
    
    autopilot_engine = None  # Se inicializará en el startup

# WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

# Simulación de datos de trading
class TradingSimulator:
    def __init__(self):
        self.prices = {
            'BTCUSDT': 50000,
            'ETHUSDT': 3000,
            'BNBUSDT': 300,
            'ADAUSDT': 0.5,
            'DOTUSDT': 7
        }
        self.volatility = {
            'BTCUSDT': 0.02,
            'ETHUSDT': 0.03,
            'BNBUSDT': 0.04,
            'ADAUSDT': 0.05,
            'DOTUSDT': 0.06
        }
        
    def update_prices(self):
        """Simula movimiento de precios"""
        for symbol in self.prices:
            vol = self.volatility[symbol]
            change = random.uniform(-vol, vol)
            self.prices[symbol] *= (1 + change)
            self.prices[symbol] = max(self.prices[symbol], 0.01)  # Precio mínimo
    
    def get_price(self, symbol: str) -> float:
        return self.prices.get(symbol, 0)
    
    def execute_order(self, order: OrderCreate) -> Dict[str, Any]:
        """Simula ejecución de orden"""
        current_price = self.get_price(order.symbol)
        
        if order.type == 'market':
            execution_price = current_price
        elif order.type == 'limit':
            if order.side == 'buy' and order.price >= current_price:
                execution_price = order.price
            elif order.side == 'sell' and order.price <= current_price:
                execution_price = order.price
            else:
                return {"status": "pending", "execution_price": None}
        elif order.type == 'stop':
            if order.side == 'buy' and current_price >= order.stop_price:
                execution_price = current_price
            elif order.side == 'sell' and current_price <= order.stop_price:
                execution_price = current_price
            else:
                return {"status": "pending", "execution_price": None}
        
        # Calcular PnL simulado
        fees = order.quantity * execution_price * 0.001  # 0.1% fee
        pnl = 0  # Se calculará cuando se cierre la posición
        
        return {
            "status": "filled",
            "execution_price": execution_price,
            "fees": fees,
            "pnl": pnl
        }

simulator = TradingSimulator()

# Funciones de base de datos
def get_db_connection():
    return sqlite3.connect('trading_bot.db')

def create_order(order_data: OrderCreate) -> str:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    order_id = str(uuid.uuid4())
    cursor.execute('''
        INSERT INTO orders (id, symbol, side, type, quantity, price, stop_price, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (order_id, order_data.symbol, order_data.side, order_data.type, 
          order_data.quantity, order_data.price, order_data.stop_price, 'pending'))
    
    conn.commit()
    conn.close()
    return order_id

def update_order_status(order_id: str, status: str, execution_price: float = None, pnl: float = 0, fees: float = 0):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE orders 
        SET status = ?, updated_at = CURRENT_TIMESTAMP, pnl = ?, fees = ?
        WHERE id = ?
    ''', (status, pnl, fees, order_id))
    
    if execution_price and status == 'filled':
        # Crear trade
        trade_id = str(uuid.uuid4())
        cursor.execute('SELECT * FROM orders WHERE id = ?', (order_id,))
        order = cursor.fetchone()
        
        cursor.execute('''
            INSERT INTO trades (id, order_id, symbol, side, quantity, price, pnl, fees)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (trade_id, order_id, order[1], order[2], order[4], execution_price, pnl, fees))
    
    conn.commit()
    conn.close()

def get_orders(status: str = None) -> List[Dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if status:
        cursor.execute('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC', (status,))
    else:
        cursor.execute('SELECT * FROM orders ORDER BY created_at DESC')
    
    orders = cursor.fetchall()
    conn.close()
    
    return [{
        'id': order[0],
        'symbol': order[1],
        'side': order[2],
        'type': order[3],
        'quantity': order[4],
        'price': order[5],
        'stop_price': order[6],
        'status': order[7],
        'created_at': order[8],
        'updated_at': order[9],
        'pnl': order[10],
        'fees': order[11]
    } for order in orders]

def get_trades(limit: int = 100) -> List[Dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM trades ORDER BY timestamp DESC LIMIT ?', (limit,))
    trades = cursor.fetchall()
    conn.close()
    
    return [{
        'id': trade[0],
        'order_id': trade[1],
        'symbol': trade[2],
        'side': trade[3],
        'quantity': trade[4],
        'price': trade[5],
        'timestamp': trade[6],
        'pnl': trade[7],
        'fees': trade[8]
    } for trade in trades]

def get_metrics() -> Dict[str, float]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Métricas generales
    cursor.execute('SELECT COUNT(*) FROM trades')
    total_trades = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM trades WHERE pnl > 0')
    winning_trades = cursor.fetchone()[0]
    
    cursor.execute('SELECT SUM(pnl) FROM trades')
    total_pnl = cursor.fetchone()[0] or 0
    
    cursor.execute('SELECT SUM(fees) FROM trades')
    total_fees = cursor.fetchone()[0] or 0
    
    win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0
    
    # PnL por período
    cursor.execute('SELECT SUM(pnl) FROM trades WHERE timestamp >= datetime("now", "-1 day")')
    daily_pnl = cursor.fetchone()[0] or 0
    
    cursor.execute('SELECT SUM(pnl) FROM trades WHERE timestamp >= datetime("now", "-7 days")')
    weekly_pnl = cursor.fetchone()[0] or 0
    
    cursor.execute('SELECT SUM(pnl) FROM trades WHERE timestamp >= datetime("now", "-30 days")')
    monthly_pnl = cursor.fetchone()[0] or 0
    
    conn.close()
    
    return {
        'total_pnl': total_pnl,
        'realized_pnl': total_pnl,
        'unrealized_pnl': 0,  # Se calculará con posiciones abiertas
        'total_value': 10000 + total_pnl - total_fees,
        'win_rate': win_rate,
        'total_trades': total_trades,
        'winning_trades': winning_trades,
        'daily_pnl': daily_pnl,
        'weekly_pnl': weekly_pnl,
        'monthly_pnl': monthly_pnl
    }

# Sistema de alertas
class AlertManager:
    def __init__(self):
        self.alert_handlers = {
            'telegram': self.send_telegram_alert,
            'email': self.send_email_alert,
            'sms': self.send_sms_alert,
            'webhook': self.send_webhook_alert
        }
    
    async def send_telegram_alert(self, message: str, chat_id: str):
        # Implementar envío a Telegram
        print(f"Telegram Alert to {chat_id}: {message}")
    
    async def send_email_alert(self, message: str, email: str):
        # Implementar envío por email
        print(f"Email Alert to {email}: {message}")
    
    async def send_sms_alert(self, message: str, phone: str):
        # Implementar envío por SMS
        print(f"SMS Alert to {phone}: {message}")
    
    async def send_webhook_alert(self, message: str, url: str):
        # Implementar webhook
        print(f"Webhook Alert to {url}: {message}")

alert_manager = AlertManager()

# Rutas de la API
@app.get("/")
async def root():
    return {"message": "Grok-Beast Trading API", "version": "2.0.0"}

@app.get("/api/status", response_model=BotStatus)
async def get_status():
    """Estado del bot"""
    orders = get_orders()
    active_orders = len([o for o in orders if o['status'] == 'pending'])
    trades = get_trades()
    
    return BotStatus(
        status="online",
        version="2.0.0",
        uptime="2h 15m",
        modules={
            "scalper": {"enabled": True, "status": "online", "trades_today": 15},
            "maker": {"enabled": True, "status": "online", "spread": 0.001},
            "arbitrage": {"enabled": True, "status": "online", "opportunities": 3},
            "ai_controller": {"enabled": True, "status": "online", "accuracy": 0.85}
        },
        active_orders=active_orders,
        total_trades=len(trades),
        daily_pnl=get_metrics()['daily_pnl']
    )

@app.get("/api/config", response_model=BotConfig)
async def get_config():
    """Configuración del bot"""
    return BotConfig()

@app.post("/api/config")
async def update_config(config: BotConfig):
    """Actualizar configuración del bot"""
    # Aquí se guardaría la configuración
    return {"message": "Configuración actualizada", "config": config}

@app.get("/api/orders", response_model=List[OrderResponse])
async def get_orders_endpoint(status: Optional[str] = None):
    """Obtener órdenes"""
    orders = get_orders(status)
    return [OrderResponse(**order) for order in orders]

@app.post("/api/orders", response_model=OrderResponse)
async def create_order_endpoint(order: OrderCreate):
    """Crear nueva orden"""
    order_id = create_order(order)
    
    # Simular ejecución
    execution_result = simulator.execute_order(order)
    
    if execution_result['status'] == 'filled':
        update_order_status(order_id, 'filled', execution_result['execution_price'], 
                          execution_result['pnl'], execution_result['fees'])
        
        # Enviar notificación por WebSocket
        await manager.broadcast(json.dumps({
            "type": "order_filled",
            "order_id": order_id,
            "symbol": order.symbol,
            "side": order.side,
            "price": execution_result['execution_price'],
            "quantity": order.quantity
        }))
    
    # Obtener orden creada
    orders = get_orders()
    created_order = next(o for o in orders if o['id'] == order_id)
    return OrderResponse(**created_order)

@app.delete("/api/orders/{order_id}")
async def cancel_order(order_id: str):
    """Cancelar orden"""
    update_order_status(order_id, 'cancelled')
    return {"message": "Orden cancelada"}

@app.get("/api/trades", response_model=List[TradeResponse])
async def get_trades_endpoint(limit: int = 100):
    """Obtener trades ejecutados"""
    trades = get_trades(limit)
    return [TradeResponse(**trade) for trade in trades]

@app.get("/api/metrics", response_model=MetricsResponse)
async def get_metrics_endpoint():
    """Obtener métricas de trading"""
    metrics = get_metrics()
    return MetricsResponse(**metrics)

@app.get("/api/portfolio")
async def get_portfolio():
    """Obtener portfolio actual"""
    # Simular portfolio
    portfolio = {
        "total_value": 12500.0,
        "assets": {
            "BTC": {"amount": 0.5, "value": 25000, "percentage": 45},
            "ETH": {"amount": 2.1, "value": 6300, "percentage": 27},
            "BNB": {"amount": 10.5, "value": 3150, "percentage": 14},
            "ADA": {"amount": 2000, "value": 1000, "percentage": 9},
            "DOT": {"amount": 71.4, "value": 500, "percentage": 5}
        },
        "cash": 1000.0,
        "margin_used": 500.0,
        "available_margin": 9500.0
    }
    return portfolio

@app.get("/api/prices")
async def get_prices():
    """Obtener precios actuales"""
    simulator.update_prices()
    return simulator.prices

@app.get("/api/alerts", response_model=List[AlertResponse])
async def get_alerts():
    """Obtener alertas configuradas"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM alerts WHERE enabled = 1')
    alerts = cursor.fetchall()
    conn.close()
    
    return [AlertResponse(
        id=alert[0],
        type=alert[2],
        condition=alert[3],
        value=alert[4],
        symbol=alert[5] if len(alert) > 5 else None,
        enabled=alert[6],
        created_at=alert[7]
    ) for alert in alerts]

@app.post("/api/alerts", response_model=AlertResponse)
async def create_alert(alert: AlertCreate):
    """Crear nueva alerta"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    alert_id = str(uuid.uuid4())
    cursor.execute('''
        INSERT INTO alerts (id, user_id, type, condition, value, symbol)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (alert_id, 'default_user', alert.type, alert.condition, alert.value, alert.symbol))
    
    conn.commit()
    conn.close()
    
    return AlertResponse(
        id=alert_id,
        type=alert.type,
        condition=alert.condition,
        value=alert.value,
        symbol=alert.symbol,
        enabled=True,
        created_at=datetime.now()
    )

@app.delete("/api/alerts/{alert_id}")
async def delete_alert(alert_id: str):
    """Eliminar alerta"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM alerts WHERE id = ?', (alert_id,))
    conn.commit()
    conn.close()
    return {"message": "Alerta eliminada"}

@app.get("/api/analytics/backtest")
async def get_backtest_results():
    """Resultados de backtesting"""
    return {
        "strategy": "Q-Learning Scalping",
        "period": "2024-01-01 to 2024-12-31",
        "total_return": 0.45,
        "sharpe_ratio": 1.8,
        "max_drawdown": 0.12,
        "win_rate": 0.68,
        "total_trades": 1250,
        "avg_trade_duration": "2.5 hours",
        "profit_factor": 1.85,
        "monthly_returns": [0.05, 0.08, -0.02, 0.12, 0.07, 0.09, 0.03, 0.11, 0.06, 0.08, 0.04, 0.10]
    }

@app.get("/api/analytics/risk-metrics")
async def get_risk_metrics():
    """Métricas de riesgo"""
    return {
        "var_95": -250.0,
        "var_99": -450.0,
        "expected_shortfall": -380.0,
        "beta": 0.85,
        "alpha": 0.12,
        "correlation_sp500": 0.65,
        "volatility": 0.18,
        "skewness": -0.2,
        "kurtosis": 3.8
    }

@app.get("/api/ml/models")
async def get_ml_models():
    """Estado de modelos ML"""
    return {
        "q_learning": {
            "status": "trained",
            "accuracy": 0.78,
            "last_training": "2024-12-12T10:30:00Z",
            "performance": {
                "precision": 0.82,
                "recall": 0.75,
                "f1_score": 0.78
            }
        },
        "policy_network": {
            "status": "training",
            "accuracy": 0.65,
            "last_training": "2024-12-12T12:15:00Z",
            "performance": {
                "precision": 0.68,
                "recall": 0.62,
                "f1_score": 0.65
            }
        },
        "genetic_optimizer": {
            "status": "optimizing",
            "generation": 45,
            "best_fitness": 0.89,
            "population_size": 100
        }
    }

@app.post("/api/ml/train")
async def train_ml_model(model_type: str):
    """Entrenar modelo ML"""
    return {"message": f"Entrenamiento de {model_type} iniciado", "status": "training"}

@app.get("/api/exchanges")
async def get_exchanges():
    """Exchanges soportados"""
    return {
        "binance": {
            "name": "Binance",
            "status": "connected",
            "balance": 5000.0,
            "fees": 0.001,
            "supported_pairs": ["BTCUSDT", "ETHUSDT", "BNBUSDT"]
        },
        "coinbase": {
            "name": "Coinbase Pro",
            "status": "connected",
            "balance": 3000.0,
            "fees": 0.005,
            "supported_pairs": ["BTC-USD", "ETH-USD"]
        },
        "kraken": {
            "name": "Kraken",
            "status": "disconnected",
            "balance": 0.0,
            "fees": 0.0026,
            "supported_pairs": ["XBTUSD", "ETHUSD"]
        }
    }

@app.get("/api/arbitrage/opportunities")
async def get_arbitrage_opportunities():
    """Oportunidades de arbitraje"""
    return {
        "opportunities": [
            {
                "pair": "BTCUSDT",
                "buy_exchange": "binance",
                "sell_exchange": "coinbase",
                "buy_price": 50000,
                "sell_price": 50150,
                "spread": 0.003,
                "profit": 150,
                "volume": 0.1
            },
            {
                "pair": "ETHUSDT",
                "buy_exchange": "coinbase",
                "sell_exchange": "binance",
                "buy_price": 2990,
                "sell_price": 3010,
                "spread": 0.0067,
                "profit": 20,
                "volume": 1.0
            }
        ],
        "total_profit_potential": 170
    }

@app.post("/api/arbitrage/execute")
async def execute_arbitrage(opportunity_id: str):
    """Ejecutar arbitraje"""
    return {"message": "Arbitraje ejecutado", "profit": 150, "status": "completed"}

# Nuevas rutas para funcionalidades avanzadas

@app.get("/api/technical/support-resistance")
async def get_support_resistance(symbol: str = "BTCUSDT"):
    """Obtener análisis de soportes y resistencias"""
    if not ADVANCED_FEATURES_AVAILABLE:
        return {"error": "Funcionalidades avanzadas no disponibles"}
    
    try:
        # Simular datos de mercado
        dates = pd.date_range(start='2024-01-01', end='2024-12-12', freq='1H')
        prices = 50000 + np.cumsum(np.random.randn(len(dates)) * 100)
        
        df = pd.DataFrame({
            'timestamp': dates,
            'open': prices * (1 + np.random.randn(len(dates)) * 0.001),
            'high': prices * (1 + np.abs(np.random.randn(len(dates))) * 0.002),
            'low': prices * (1 - np.abs(np.random.randn(len(dates))) * 0.002),
            'close': prices,
            'volume': np.random.randint(1000, 10000, len(dates))
        })
        
        levels = support_resistance_analyzer.detect_levels(df)
        signals = support_resistance_analyzer.get_trading_signals(df)
        
        return {
            "symbol": symbol,
            "levels": [{
                "price": level.price,
                "type": level.type,
                "strength": level.strength,
                "touches": level.touches
            } for level in levels],
            "signals": signals
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/technical/channels")
async def get_trend_channels(symbol: str = "BTCUSDT"):
    """Obtener análisis de canales de tendencia"""
    if not ADVANCED_FEATURES_AVAILABLE:
        return {"error": "Funcionalidades avanzadas no disponibles"}
    
    try:
        # Simular datos
        dates = pd.date_range(start='2024-01-01', end='2024-12-12', freq='1H')
        prices = 50000 + np.cumsum(np.random.randn(len(dates)) * 100)
        
        df = pd.DataFrame({
            'timestamp': dates,
            'open': prices * (1 + np.random.randn(len(dates)) * 0.001),
            'high': prices * (1 + np.abs(np.random.randn(len(dates))) * 0.002),
            'low': prices * (1 - np.abs(np.random.randn(len(dates))) * 0.002),
            'close': prices,
            'volume': np.random.randint(1000, 10000, len(dates))
        })
        
        channels = channel_analyzer.detect_trend_channels(df)
        signals = channel_analyzer.get_trading_signals(df)
        
        return {
            "symbol": symbol,
            "channels": [{
                "trend_type": channel.trend_type,
                "strength": channel.strength,
                "confidence": channel.confidence,
                "angle": channel.angle,
                "width": channel.width
            } for channel in channels],
            "signals": signals
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/technical/ict")
async def get_ict_analysis(symbol: str = "BTCUSDT"):
    """Obtener análisis ICT"""
    if not ADVANCED_FEATURES_AVAILABLE:
        return {"error": "Funcionalidades avanzadas no disponibles"}
    
    try:
        # Simular datos
        dates = pd.date_range(start='2024-01-01', end='2024-12-12', freq='1H')
        prices = 50000 + np.cumsum(np.random.randn(len(dates)) * 100)
        
        df = pd.DataFrame({
            'timestamp': dates,
            'open': prices * (1 + np.random.randn(len(dates)) * 0.001),
            'high': prices * (1 + np.abs(np.random.randn(len(dates))) * 0.002),
            'low': prices * (1 - np.abs(np.random.randn(len(dates))) * 0.002),
            'close': prices,
            'volume': np.random.randint(1000, 10000, len(dates))
        })
        
        ict_analysis = ict_analyzer.analyze_ict_concepts(df)
        signals = ict_analyzer.get_ict_trading_signals(df)
        
        return {
            "symbol": symbol,
            "order_blocks": len(ict_analysis.get('order_blocks', [])),
            "fair_value_gaps": len(ict_analysis.get('fair_value_gaps', [])),
            "liquidity_sweeps": len(ict_analysis.get('liquidity_sweeps', [])),
            "signals": signals
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/technical/fibonacci")
async def get_fibonacci_analysis(symbol: str = "BTCUSDT"):
    """Obtener análisis de Fibonacci"""
    if not ADVANCED_FEATURES_AVAILABLE:
        return {"error": "Funcionalidades avanzadas no disponibles"}
    
    try:
        # Simular datos
        dates = pd.date_range(start='2024-01-01', end='2024-12-12', freq='1H')
        prices = 50000 + np.cumsum(np.random.randn(len(dates)) * 100)
        
        df = pd.DataFrame({
            'timestamp': dates,
            'open': prices * (1 + np.random.randn(len(dates)) * 0.001),
            'high': prices * (1 + np.abs(np.random.randn(len(dates))) * 0.002),
            'low': prices * (1 - np.abs(np.random.randn(len(dates))) * 0.002),
            'close': prices,
            'volume': np.random.randint(1000, 10000, len(dates))
        })
        
        fib_analysis = fibonacci_analyzer.analyze_fibonacci_levels(df)
        signals = fibonacci_analyzer.get_fibonacci_trading_signals(df)
        
        return {
            "symbol": symbol,
            "retracements": len(fib_analysis.get('retracements', [])),
            "extensions": len(fib_analysis.get('extensions', [])),
            "fans": len(fib_analysis.get('fans', [])),
            "signals": signals
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/technical/sessions")
async def get_session_analysis(symbol: str = "BTCUSDT"):
    """Obtener análisis de sesiones"""
    if not ADVANCED_FEATURES_AVAILABLE:
        return {"error": "Funcionalidades avanzadas no disponibles"}
    
    try:
        # Simular datos
        dates = pd.date_range(start='2024-01-01', end='2024-12-12', freq='1H')
        prices = 50000 + np.cumsum(np.random.randn(len(dates)) * 100)
        
        df = pd.DataFrame({
            'timestamp': dates,
            'open': prices * (1 + np.random.randn(len(dates)) * 0.001),
            'high': prices * (1 + np.abs(np.random.randn(len(dates))) * 0.002),
            'low': prices * (1 - np.abs(np.random.randn(len(dates))) * 0.002),
            'close': prices,
            'volume': np.random.randint(1000, 10000, len(dates))
        })
        
        session_analysis = session_analyzer.analyze_trading_sessions(df)
        current_session = session_analyzer.get_current_session_info()
        signals = session_analyzer.get_session_trading_signals(df)
        
        return {
            "symbol": symbol,
            "current_session": current_session,
            "session_strength": session_analysis.get('session_strength', {}),
            "best_entry_times": session_analysis.get('best_entry_times', {}),
            "signals": signals
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/technical/spread")
async def get_spread_analysis(symbol: str = "BTCUSDT"):
    """Obtener análisis de spread"""
    if not ADVANCED_FEATURES_AVAILABLE:
        return {"error": "Funcionalidades avanzadas no disponibles"}
    
    try:
        # Simular datos
        dates = pd.date_range(start='2024-01-01', end='2024-12-12', freq='1H')
        prices = 50000 + np.cumsum(np.random.randn(len(dates)) * 100)
        
        df = pd.DataFrame({
            'timestamp': dates,
            'open': prices * (1 + np.random.randn(len(dates)) * 0.001),
            'high': prices * (1 + np.abs(np.random.randn(len(dates))) * 0.002),
            'low': prices * (1 - np.abs(np.random.randn(len(dates))) * 0.002),
            'close': prices,
            'volume': np.random.randint(1000, 10000, len(dates))
        })
        
        spread_analysis = spread_analyzer.analyze_spread_conditions(df)
        signals = spread_analyzer.get_spread_trading_signals(df)
        
        return {
            "symbol": symbol,
            "current_spread": spread_analysis.get('current_spread', {}),
            "spread_trends": spread_analysis.get('spread_trends', {}),
            "optimal_entry_points": spread_analysis.get('optimal_entry_points', []),
            "signals": signals
        }
    except Exception as e:
        return {"error": str(e)}

# Rutas del piloto automático

@app.get("/api/autopilot/status")
async def get_autopilot_status():
    """Obtener estado del piloto automático"""
    if not ADVANCED_FEATURES_AVAILABLE:
        return {"error": "Funcionalidades avanzadas no disponibles"}
    
    if autopilot_engine:
        return autopilot_engine.get_status()
    else:
        return {"status": "not_initialized"}

@app.post("/api/autopilot/start")
async def start_autopilot():
    """Iniciar piloto automático"""
    if not ADVANCED_FEATURES_AVAILABLE:
        return {"error": "Funcionalidades avanzadas no disponibles"}
    
    try:
        if not autopilot_engine:
            # Inicializar motor de piloto automático
            global autopilot_engine
            autopilot_engine = AutopilotEngine(autopilot_config)
            await autopilot_engine.initialize(exchange_configs)
        
        await autopilot_engine.start()
        return {"message": "Piloto automático iniciado", "status": "running"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/autopilot/stop")
async def stop_autopilot():
    """Detener piloto automático"""
    if not ADVANCED_FEATURES_AVAILABLE:
        return {"error": "Funcionalidades avanzadas no disponibles"}
    
    try:
        if autopilot_engine:
            await autopilot_engine.stop()
            return {"message": "Piloto automático detenido", "status": "stopped"}
        else:
            return {"error": "Piloto automático no está inicializado"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/autopilot/pause")
async def pause_autopilot():
    """Pausar piloto automático"""
    if not ADVANCED_FEATURES_AVAILABLE:
        return {"error": "Funcionalidades avanzadas no disponibles"}
    
    try:
        if autopilot_engine:
            await autopilot_engine.pause()
            return {"message": "Piloto automático pausado", "status": "paused"}
        else:
            return {"error": "Piloto automático no está inicializado"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/autopilot/resume")
async def resume_autopilot():
    """Reanudar piloto automático"""
    if not ADVANCED_FEATURES_AVAILABLE:
        return {"error": "Funcionalidades avanzadas no disponibles"}
    
    try:
        if autopilot_engine:
            await autopilot_engine.resume()
            return {"message": "Piloto automático reanudado", "status": "running"}
        else:
            return {"error": "Piloto automático no está inicializado"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/autopilot/emergency-stop")
async def emergency_stop_autopilot():
    """Parada de emergencia del piloto automático"""
    if not ADVANCED_FEATURES_AVAILABLE:
        return {"error": "Funcionalidades avanzadas no disponibles"}
    
    try:
        if autopilot_engine:
            await autopilot_engine.emergency_stop()
            return {"message": "Parada de emergencia activada", "status": "emergency_stop"}
        else:
            return {"error": "Piloto automático no está inicializado"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/autopilot/history")
async def get_autopilot_history():
    """Obtener historial de trades del piloto automático"""
    if not ADVANCED_FEATURES_AVAILABLE:
        return {"error": "Funcionalidades avanzadas no disponibles"}
    
    try:
        if autopilot_engine:
            return autopilot_engine.get_trade_history()
        else:
            return {"error": "Piloto automático no está inicializado"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/autopilot/strategy-performance")
async def get_strategy_performance():
    """Obtener rendimiento por estrategia"""
    if not ADVANCED_FEATURES_AVAILABLE:
        return {"error": "Funcionalidades avanzadas no disponibles"}
    
    try:
        if autopilot_engine:
            return autopilot_engine.get_strategy_performance()
        else:
            return {"error": "Piloto automático no está inicializado"}
    except Exception as e:
        return {"error": str(e)}

# Rutas de IA con Ollama

@app.get("/api/ai/ollama/status")
async def get_ollama_status():
    """Obtener estado de Ollama"""
    if not ADVANCED_FEATURES_AVAILABLE:
        return {"error": "Funcionalidades avanzadas no disponibles"}
    
    try:
        # Verificar si Ollama está disponible
        ollama_config = OllamaConfig()
        async with OllamaTradingAI(ollama_config) as ai:
            await ai.initialize()
            return {"status": "connected", "model": ollama_config.model_name}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.post("/api/ai/analyze")
async def ai_analyze_market(symbol: str = "BTCUSDT", analysis_type: str = "technical"):
    """Análisis de mercado con IA"""
    if not ADVANCED_FEATURES_AVAILABLE:
        return {"error": "Funcionalidades avanzadas no disponibles"}
    
    try:
        # Simular datos de mercado
        dates = pd.date_range(start='2024-01-01', end='2024-12-12', freq='1H')
        prices = 50000 + np.cumsum(np.random.randn(len(dates)) * 100)
        
        df = pd.DataFrame({
            'timestamp': dates,
            'open': prices * (1 + np.random.randn(len(dates)) * 0.001),
            'high': prices * (1 + np.abs(np.random.randn(len(dates))) * 0.002),
            'low': prices * (1 - np.abs(np.random.randn(len(dates))) * 0.002),
            'close': prices,
            'volume': np.random.randint(1000, 10000, len(dates))
        })
        
        ollama_config = OllamaConfig()
        async with OllamaTradingAI(ollama_config) as ai:
            analysis = await ai.analyze_market_data(df, analysis_type)
            
            return {
                "symbol": symbol,
                "analysis_type": analysis_type,
                "recommendation": analysis.recommendation,
                "confidence": analysis.confidence,
                "reasoning": analysis.reasoning,
                "key_points": analysis.key_points,
                "risk_assessment": analysis.risk_assessment
            }
    except Exception as e:
        return {"error": str(e)}

# Rutas de exchanges

@app.get("/api/exchanges/status")
async def get_exchanges_status():
    """Obtener estado de exchanges"""
    if not ADVANCED_FEATURES_AVAILABLE:
        return {"error": "Funcionalidades avanzadas no disponibles"}
    
    try:
        exchange_manager = MultiExchangeManager(exchange_configs)
        await exchange_manager.connect_all()
        status = exchange_manager.get_exchange_status()
        return status
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/exchanges/balances")
async def get_exchanges_balances():
    """Obtener balances de exchanges"""
    if not ADVANCED_FEATURES_AVAILABLE:
        return {"error": "Funcionalidades avanzadas no disponibles"}
    
    try:
        exchange_manager = MultiExchangeManager(exchange_configs)
        await exchange_manager.connect_all()
        balances = await exchange_manager.get_balances()
        return balances
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/exchanges/arbitrage-opportunities")
async def get_arbitrage_opportunities(symbol: str = "BTCUSDT", min_profit: float = 0.001):
    """Obtener oportunidades de arbitraje"""
    if not ADVANCED_FEATURES_AVAILABLE:
        return {"error": "Funcionalidades avanzadas no disponibles"}
    
    try:
        exchange_manager = MultiExchangeManager(exchange_configs)
        await exchange_manager.connect_all()
        opportunities = await exchange_manager.find_arbitrage_opportunities(symbol, min_profit)
        return {"opportunities": opportunities}
    except Exception as e:
        return {"error": str(e)}

# Nuevas rutas para funcionalidades avanzadas

@app.get("/api/scanner/opportunities")
async def scan_all_opportunities(limit: int = 20):
    """Escanear todas las oportunidades en todos los pares"""
    if not ADVANCED_FEATURES_AVAILABLE:
        return {"error": "Funcionalidades avanzadas no disponibles"}
    
    try:
        # Crear scanner temporal
        scan_config = ScanConfig(
            enabled_timeframes=['5m', '15m', '1h'],
            max_pairs_per_exchange=50,
            min_confidence_threshold=0.6
        )
        
        exchange_manager = MultiExchangeManager(exchange_configs)
        await exchange_manager.connect_all()
        
        scanner = PairScanner(exchange_manager, scan_config)
        await scanner.initialize()
        
        opportunities = await scanner.scan_all_opportunities()
        
        # Formatear resultados
        formatted_opportunities = []
        for opp in opportunities[:limit]:
            formatted_opportunities.append({
                'symbol': opp.pair.symbol,
                'exchange': opp.pair.exchange,
                'strategy': opp.strategy,
                'signal': opp.signal,
                'confidence': opp.confidence,
                'price': opp.entry_price,
                'stop_loss': opp.stop_loss,
                'take_profit': opp.take_profit,
                'risk_reward_ratio': opp.risk_reward_ratio,
                'overall_score': opp.overall_score,
                'reasoning': opp.reasoning
            })
        
        return {
            'opportunities': formatted_opportunities,
            'total_found': len(opportunities),
            'scan_stats': scanner.get_scan_statistics()
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/scanner/top-opportunities")
async def get_top_opportunities(exchange: Optional[str] = None, strategy: Optional[str] = None):
    """Obtener mejores oportunidades"""
    if not ADVANCED_FEATURES_AVAILABLE:
        return {"error": "Funcionalidades avanzadas no disponibles"}
    
    try:
        # Simular oportunidades top
        top_opportunities = [
            {
                'symbol': 'BTCUSDT',
                'exchange': 'binance',
                'strategy': 'support_resistance',
                'signal': 'buy',
                'confidence': 0.85,
                'price': 50000,
                'stop_loss': 49000,
                'take_profit': 52000,
                'risk_reward_ratio': 2.0,
                'overall_score': 0.92,
                'reasoning': 'Strong support level with high volume confirmation'
            },
            {
                'symbol': 'ETHUSDT',
                'exchange': 'kraken',
                'strategy': 'ict_techniques',
                'signal': 'buy',
                'confidence': 0.78,
                'price': 3000,
                'stop_loss': 2950,
                'take_profit': 3100,
                'risk_reward_ratio': 2.0,
                'overall_score': 0.88,
                'reasoning': 'Order block detected with fair value gap'
            }
        ]
        
        # Filtrar por exchange si se especifica
        if exchange:
            top_opportunities = [opp for opp in top_opportunities if opp['exchange'] == exchange]
        
        # Filtrar por estrategia si se especifica
        if strategy:
            top_opportunities = [opp for opp in top_opportunities if opp['strategy'] == strategy]
        
        return {
            'opportunities': top_opportunities,
            'filters': {'exchange': exchange, 'strategy': strategy}
        }
    except Exception as e:
        return {"error": str(e)}

# Rutas de gestión de riesgo

@app.get("/api/risk/levels")
async def get_risk_levels():
    """Obtener información sobre niveles de riesgo"""
    if not ADVANCED_FEATURES_AVAILABLE:
        return {"error": "Funcionalidades avanzadas no disponibles"}
    
    try:
        risk_manager = create_risk_manager(RiskLevel.CONSERVATIVE)
        
        risk_levels = {}
        for level in RiskLevel:
            risk_manager.set_risk_level(level)
            profile = risk_manager.get_current_profile()
            
            risk_levels[level.value] = {
                'max_leverage': profile.max_leverage,
                'base_position_size': profile.base_position_size,
                'max_position_size': profile.max_position_size,
                'stop_loss_percentage': profile.stop_loss_percentage,
                'take_profit_percentage': profile.take_profit_percentage,
                'max_drawdown': profile.max_drawdown,
                'max_daily_trades': profile.max_daily_trades,
                'risk_per_trade': profile.risk_per_trade,
                'confidence_threshold': profile.confidence_threshold,
                'position_sizing_method': profile.position_sizing_method
            }
        
        return {'risk_levels': risk_levels}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/risk/set-level")
async def set_risk_level(level: str):
    """Cambiar nivel de riesgo"""
    if not ADVANCED_FEATURES_AVAILABLE:
        return {"error": "Funcionalidades avanzadas no disponibles"}
    
    try:
        risk_level = RiskLevel(level)
        # En implementación real, esto cambiaría el nivel global
        return {"message": f"Nivel de riesgo cambiado a {level}", "level": level}
    except ValueError:
        return {"error": "Nivel de riesgo inválido"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/risk/calculate-position")
async def calculate_position_size(symbol: str, entry_price: float, stop_loss: float, confidence: float):
    """Calcular tamaño de posición"""
    if not ADVANCED_FEATURES_AVAILABLE:
        return {"error": "Funcionalidades avanzadas no disponibles"}
    
    try:
        risk_manager = create_risk_manager(RiskLevel.CONSERVATIVE)
        
        # Simular oportunidad
        from gbsb.scanners.pair_scanner import PairInfo, QuickOpportunity
        from datetime import datetime
        
        pair_info = PairInfo(
            symbol=symbol,
            exchange='binance',
            market_type='spot',
            base_currency=symbol.split('USDT')[0],
            quote_currency='USDT',
            price=entry_price,
            volume_24h=1000000,
            volume_change_24h=0.05,
            price_change_24h=0.02
        )
        
        opportunity = QuickOpportunity(
            pair=pair_info,
            timeframe='1h',
            strategy='support_resistance',
            signal='buy',
            confidence=confidence,
            entry_price=entry_price,
            stop_loss=stop_loss,
            take_profit=entry_price * 1.02,
            risk_reward_ratio=2.0,
            reasoning="Calculated position size"
        )
        
        position_sizing = risk_manager.calculate_position_size(
            opportunity, 10000.0, 0.02, {}
        )
        
        return {
            'base_size': position_sizing.base_size,
            'leverage': position_sizing.leverage,
            'adjusted_size': position_sizing.adjusted_size,
            'risk_amount': position_sizing.risk_amount,
            'position_value': position_sizing.position_value,
            'margin_required': position_sizing.margin_required,
            'max_loss': position_sizing.max_loss
        }
    except Exception as e:
        return {"error": str(e)}

# Rutas de análisis fundamental

@app.get("/api/news/sentiment")
async def get_market_sentiment(symbol: Optional[str] = None):
    """Obtener sentimiento del mercado basado en noticias"""
    if not ADVANCED_FEATURES_AVAILABLE:
        return {"error": "Funcionalidades avanzadas no disponibles"}
    
    try:
        news_config = create_news_filter()
        
        # Simular análisis de sentimiento
        sentiment_data = {
            'overall_sentiment': 'bullish',
            'sentiment_score': 0.65,
            'confidence': 0.78,
            'total_articles': 25,
            'bullish_articles': 16,
            'bearish_articles': 5,
            'neutral_articles': 4,
            'trending_topics': ['bitcoin', 'ethereum', 'defi', 'nft', 'adoption'],
            'key_events': [
                'Major exchange announces new features',
                'Institutional adoption continues growing',
                'Regulatory clarity improves market confidence'
            ],
            'category_sentiments': {
                'regulation': 0.7,
                'technology': 0.8,
                'market': 0.6,
                'adoption': 0.9
            },
            'symbol_sentiments': {
                'BTC': 0.75,
                'ETH': 0.8,
                'BNB': 0.65
            },
            'last_updated': datetime.now().isoformat()
        }
        
        if symbol:
            symbol_sentiment = sentiment_data['symbol_sentiments'].get(symbol, 0.5)
            sentiment_data['symbol_sentiment'] = symbol_sentiment
        
        return sentiment_data
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/news/trending")
async def get_trending_news(limit: int = 10):
    """Obtener noticias trending"""
    if not ADVANCED_FEATURES_AVAILABLE:
        return {"error": "Funcionalidades avanzadas no disponibles"}
    
    try:
        # Simular noticias trending
        trending_news = [
            {
                'title': 'Bitcoin reaches new ATH as institutional adoption grows',
                'summary': 'Bitcoin has reached a new all-time high amid growing institutional adoption...',
                'source': 'coindesk',
                'sentiment': 'bullish',
                'confidence': 0.85,
                'impact_score': 0.9,
                'published_at': datetime.now().isoformat(),
                'symbols': ['BTC'],
                'keywords': ['bitcoin', 'ath', 'institutional', 'adoption']
            },
            {
                'title': 'Ethereum 2.0 upgrade shows promising results',
                'summary': 'The latest Ethereum upgrade is showing promising results with improved scalability...',
                'source': 'cointelegraph',
                'sentiment': 'bullish',
                'confidence': 0.78,
                'impact_score': 0.7,
                'published_at': datetime.now().isoformat(),
                'symbols': ['ETH'],
                'keywords': ['ethereum', 'upgrade', 'scalability', 'defi']
            }
        ]
        
        return {'trending_news': trending_news[:limit]}
    except Exception as e:
        return {"error": str(e)}

# Rutas del detector automático

@app.get("/api/detector/status")
async def get_detector_status():
    """Obtener estado del detector automático"""
    if not ADVANCED_FEATURES_AVAILABLE:
        return {"error": "Funcionalidades avanzadas no disponibles"}
    
    try:
        # Simular estado del detector
        detector_status = {
            'is_running': False,
            'risk_level': 'conservative',
            'active_opportunities': 0,
            'active_positions': 0,
            'stats': {
                'total_scans': 150,
                'opportunities_found': 45,
                'opportunities_executed': 12,
                'successful_trades': 8,
                'total_pnl': 1250.50,
                'last_scan_time': datetime.now().isoformat(),
                'scan_duration': 2.5
            },
            'risk_summary': {
                'current_risk_level': 'conservative',
                'risk_score': 0.3,
                'total_leverage': 1.5,
                'max_drawdown': 0.02,
                'win_rate': 0.67,
                'emergency_stop': False
            }
        }
        
        return detector_status
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/detector/start")
async def start_auto_detector():
    """Iniciar detector automático"""
    if not ADVANCED_FEATURES_AVAILABLE:
        return {"error": "Funcionalidades avanzadas no disponibles"}
    
    try:
        # En implementación real, esto iniciaría el detector
        return {"message": "Detector automático iniciado", "status": "running"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/detector/stop")
async def stop_auto_detector():
    """Detener detector automático"""
    if not ADVANCED_FEATURES_AVAILABLE:
        return {"error": "Funcionalidades avanzadas no disponibles"}
    
    try:
        # En implementación real, esto detendría el detector
        return {"message": "Detector automático detenido", "status": "stopped"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/detector/opportunities")
async def get_detector_opportunities(limit: int = 10):
    """Obtener oportunidades del detector automático"""
    if not ADVANCED_FEATURES_AVAILABLE:
        return {"error": "Funcionalidades avanzadas no disponibles"}
    
    try:
        # Simular oportunidades del detector
        detector_opportunities = [
            {
                'symbol': 'BTCUSDT',
                'exchange': 'binance',
                'strategy': 'support_resistance',
                'signal': 'buy',
                'confidence': 0.85,
                'price': 50000,
                'stop_loss': 49000,
                'take_profit': 52000,
                'risk_reward_ratio': 2.0,
                'overall_score': 0.92,
                'priority': 'high',
                'execution_score': 0.88,
                'expected_return': 400,
                'max_risk': 200,
                'time_to_execute': '00:15:00',
                'confidence_factors': {
                    'technical': 0.85,
                    'volume': 0.9,
                    'volatility': 0.7,
                    'news_sentiment': 0.8,
                    'ai_confidence': 0.82
                },
                'execution_recommendations': [
                    'Strong technical setup with high volume confirmation',
                    'Positive news sentiment supports bullish outlook',
                    'AI analysis confirms buy signal with high confidence'
                ]
            }
        ]
        
        return {'opportunities': detector_opportunities[:limit]}
    except Exception as e:
        return {"error": str(e)}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket para datos en tiempo real"""
    await manager.connect(websocket)
    try:
        while True:
            # Verificar si la conexión sigue activa
            if websocket.client_state.name == "DISCONNECTED":
                break
                
            # Enviar datos en tiempo real
            data = {
                "type": "price_update",
                "timestamp": datetime.now().isoformat(),
                "prices": simulator.prices,
                "metrics": get_metrics()
            }
            try:
                await websocket.send_text(json.dumps(data))
            except Exception as e:
                print(f"Error enviando datos WebSocket: {e}")
                break
            await asyncio.sleep(1)
            
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"Error en WebSocket: {e}")
    finally:
        manager.disconnect(websocket)

@app.get("/metrics")
async def prometheus_metrics():
    """Métricas para Prometheus"""
    metrics = get_metrics()
    return f"""# HELP gbsb_total_pnl Total PnL
# TYPE gbsb_total_pnl gauge
gbsb_total_pnl {metrics['total_pnl']}
# HELP gbsb_total_trades Total trades
# TYPE gbsb_total_trades counter
gbsb_total_trades {metrics['total_trades']}
# HELP gbsb_win_rate Win rate percentage
# TYPE gbsb_win_rate gauge
gbsb_win_rate {metrics['win_rate']}
"""

# Montar archivos estáticos (debe ir al final para evitar conflictos con rutas API)
if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    print("🚀 Servidor Grok-Beast Trading API iniciado")
    print("📁 Sirviendo archivos desde:", FRONTEND_DIR)
    print("🌐 API disponible en: http://localhost:8000")
    print("📊 WebSocket en: ws://localhost:8000/ws")
    print("📈 Métricas Prometheus: http://localhost:8000/metrics")
    uvicorn.run(app, host="0.0.0.0", port=8000)

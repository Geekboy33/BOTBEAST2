# 📚 API Documentation - Grok-Beast Trading Bot

## 📋 Tabla de Contenidos

1. [Información General](#información-general)
2. [Autenticación](#autenticación)
3. [Endpoints de Trading](#endpoints-de-trading)
4. [Endpoints de Análisis Técnico](#endpoints-de-análisis-técnico)
5. [Endpoints de Autopilot](#endpoints-de-autopilot)
6. [Endpoints de IA](#endpoints-de-ia)
7. [Endpoints de Exchanges](#endpoints-de-exchanges)
8. [Endpoints de Gestión de Riesgo](#endpoints-de-gestión-de-riesgo)
9. [Endpoints de Monitoreo](#endpoints-de-monitoreo)
10. [Códigos de Error](#códigos-de-error)
11. [Ejemplos de Uso](#ejemplos-de-uso)

---

## 📖 Información General

### Base URL
```
http://localhost:8000/api
```

### Versión
```
v2.0.0
```

### Formato de Respuesta
Todas las respuestas están en formato JSON.

### Rate Limiting
- **Límite**: 100 requests por minuto por IP
- **Headers de respuesta**:
  - `X-Rate-Limit-Remaining`: Requests restantes
  - `X-Rate-Limit-Reset`: Timestamp de reset

---

## 🔐 Autenticación

### Bearer Token
```http
Authorization: Bearer <token>
```

### Obtener Token
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "trader",
  "password": "password123"
}
```

**Respuesta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

---

## 🚀 Endpoints de Trading

### Estado del Bot
```http
GET /api/bot/status
```

**Respuesta:**
```json
{
  "status": "running",
  "version": "2.0.0",
  "uptime": "2d 5h 30m",
  "active_orders": 3,
  "total_trades_today": 45,
  "pnl_today": 1250.75
}
```

### Métricas del Bot
```http
GET /api/bot/metrics
```

**Respuesta:**
```json
{
  "total_trades": 1250,
  "win_rate": 67.5,
  "total_pnl": 15750.25,
  "sharpe_ratio": 2.3,
  "max_drawdown": 5.2,
  "avg_trade_duration": "15m 30s"
}
```

### Crear Orden
```http
POST /api/trading/orders
Content-Type: application/json

{
  "symbol": "BTCUSDT",
  "side": "BUY",
  "type": "LIMIT",
  "quantity": 0.001,
  "price": 45000.00,
  "stop_price": 44000.00
}
```

**Respuesta:**
```json
{
  "order_id": "ord_123456789",
  "status": "pending",
  "symbol": "BTCUSDT",
  "side": "BUY",
  "quantity": 0.001,
  "price": 45000.00,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Obtener Órdenes
```http
GET /api/trading/orders?symbol=BTCUSDT&status=open&limit=50
```

**Parámetros:**
- `symbol` (opcional): Filtro por símbolo
- `status` (opcional): Filtro por estado (open, filled, cancelled)
- `limit` (opcional): Número máximo de resultados (default: 50)

**Respuesta:**
```json
{
  "orders": [
    {
      "order_id": "ord_123456789",
      "symbol": "BTCUSDT",
      "side": "BUY",
      "type": "LIMIT",
      "quantity": 0.001,
      "price": 45000.00,
      "status": "open",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 50
}
```

### Cancelar Orden
```http
DELETE /api/trading/orders/{order_id}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "order_id": "ord_123456789"
}
```

---

## 📊 Endpoints de Análisis Técnico

### Análisis de Soportes y Resistencias
```http
GET /api/technical/support-resistance?symbol=BTCUSDT&timeframe=1h&limit=100
```

**Parámetros:**
- `symbol` (requerido): Símbolo de trading
- `timeframe` (opcional): Marco temporal (1m, 5m, 15m, 30m, 1h, 4h, 1d)
- `limit` (opcional): Número de puntos de datos

**Respuesta:**
```json
{
  "symbol": "BTCUSDT",
  "timeframe": "1h",
  "signals": [
    {
      "type": "support",
      "price": 44500.00,
      "strength": 0.85,
      "touches": 3,
      "confidence": 0.78
    },
    {
      "type": "resistance",
      "price": 45500.00,
      "strength": 0.92,
      "touches": 4,
      "confidence": 0.85
    }
  ],
  "confidence": 0.82,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Análisis de Canales
```http
GET /api/technical/channels?symbol=BTCUSDT&timeframe=4h
```

**Respuesta:**
```json
{
  "symbol": "BTCUSDT",
  "timeframe": "4h",
  "channels": [
    {
      "type": "uptrend",
      "upper_bound": 46000.00,
      "lower_bound": 44000.00,
      "slope": 0.0025,
      "confidence": 0.75,
      "breakout_probability": 0.65
    }
  ],
  "signals": [
    {
      "type": "channel_bounce",
      "direction": "up",
      "entry_price": 44100.00,
      "target_price": 45900.00,
      "stop_loss": 43800.00,
      "confidence": 0.72
    }
  ]
}
```

### Análisis ICT
```http
GET /api/technical/ict?symbol=BTCUSDT&timeframe=1h
```

**Respuesta:**
```json
{
  "symbol": "BTCUSDT",
  "timeframe": "1h",
  "order_blocks": [
    {
      "type": "bullish",
      "high": 45200.00,
      "low": 44800.00,
      "strength": 0.88,
      "timeframe": "4h",
      "confidence": 0.82
    }
  ],
  "fair_value_gaps": [
    {
      "type": "bullish",
      "high": 45100.00,
      "low": 44950.00,
      "filled": false,
      "confidence": 0.75
    }
  ],
  "liquidity_sweeps": [
    {
      "type": "bearish",
      "price": 45300.00,
      "timestamp": "2024-01-15T09:45:00Z",
      "strength": 0.65
    }
  ],
  "signals": [
    {
      "type": "order_block_entry",
      "direction": "long",
      "entry_price": 44850.00,
      "target_price": 45200.00,
      "stop_loss": 44700.00,
      "confidence": 0.78
    }
  ]
}
```

### Análisis Fibonacci
```http
GET /api/technical/fibonacci?symbol=BTCUSDT&timeframe=4h
```

**Respuesta:**
```json
{
  "symbol": "BTCUSDT",
  "timeframe": "4h",
  "fibonacci_levels": [
    {
      "level": "23.6%",
      "price": 44250.00,
      "type": "retracement",
      "strength": 0.72
    },
    {
      "level": "38.2%",
      "price": 43800.00,
      "type": "retracement",
      "strength": 0.85
    },
    {
      "level": "161.8%",
      "price": 46800.00,
      "type": "extension",
      "strength": 0.78
    }
  ],
  "signals": [
    {
      "type": "fibonacci_bounce",
      "level": "38.2%",
      "direction": "bullish",
      "entry_price": 43850.00,
      "target_price": 44200.00,
      "confidence": 0.82
    }
  ]
}
```

### Análisis de Sesiones
```http
GET /api/technical/sessions?symbol=BTCUSDT
```

**Respuesta:**
```json
{
  "symbol": "BTCUSDT",
  "session_analysis": {
    "asian_session": {
      "volume_ratio": 0.25,
      "volatility": 0.012,
      "trend": "sideways"
    },
    "european_session": {
      "volume_ratio": 0.35,
      "volatility": 0.018,
      "trend": "bullish"
    },
    "american_session": {
      "volume_ratio": 0.40,
      "volatility": 0.022,
      "trend": "bullish"
    }
  },
  "optimal_entry_times": [
    {
      "session": "european",
      "start_time": "08:00",
      "end_time": "10:00",
      "confidence": 0.85
    },
    {
      "session": "american",
      "start_time": "14:00",
      "end_time": "16:00",
      "confidence": 0.78
    }
  ]
}
```

### Análisis de Spread
```http
GET /api/technical/spread?symbol=BTCUSDT
```

**Respuesta:**
```json
{
  "symbol": "BTCUSDT",
  "spread_analysis": {
    "current_spread": 2.5,
    "avg_spread": 3.2,
    "spread_trend": "decreasing",
    "liquidity_score": 0.88
  },
  "liquidity_conditions": {
    "bid_depth": 15.5,
    "ask_depth": 18.2,
    "order_book_imbalance": 0.15,
    "optimal_entry": true
  },
  "signals": [
    {
      "type": "spread_compression",
      "confidence": 0.75,
      "recommendation": "good_entry"
    }
  ]
}
```

---

## 🤖 Endpoints de Autopilot

### Estado del Autopilot
```http
GET /api/autopilot/status
```

**Respuesta:**
```json
{
  "status": "running",
  "is_running": true,
  "enabled_strategies": [
    "support_resistance",
    "ict_techniques",
    "fibonacci"
  ],
  "current_risk_level": "conservative",
  "active_signals": 3,
  "last_analysis": "2024-01-15T10:30:00Z"
}
```

### Iniciar Autopilot
```http
POST /api/autopilot/start
Content-Type: application/json

{
  "enabled_strategies": ["support_resistance", "ict_techniques"],
  "risk_level": "conservative",
  "max_position_size": 1000.00,
  "dry_run": true
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Autopilot started successfully",
  "config": {
    "enabled_strategies": ["support_resistance", "ict_techniques"],
    "risk_level": "conservative",
    "max_position_size": 1000.00,
    "dry_run": true
  }
}
```

### Detener Autopilot
```http
POST /api/autopilot/stop
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Autopilot stopped successfully"
}
```

### Pausar/Reanudar Autopilot
```http
POST /api/autopilot/pause
POST /api/autopilot/resume
```

### Parada de Emergencia
```http
POST /api/autopilot/emergency-stop
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Emergency stop executed",
  "actions_taken": [
    "All open orders cancelled",
    "All positions closed",
    "Autopilot stopped"
  ]
}
```

### Historial del Autopilot
```http
GET /api/autopilot/history?limit=50&offset=0
```

**Respuesta:**
```json
{
  "trades": [
    {
      "trade_id": "trade_123",
      "symbol": "BTCUSDT",
      "side": "BUY",
      "quantity": 0.001,
      "price": 45000.00,
      "pnl": 25.50,
      "strategy": "support_resistance",
      "confidence": 0.85,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "performance": {
    "total_trades": 45,
    "winning_trades": 32,
    "win_rate": 71.1,
    "total_pnl": 1250.75,
    "sharpe_ratio": 2.1,
    "max_drawdown": 3.2
  }
}
```

### Rendimiento por Estrategia
```http
GET /api/autopilot/strategy-performance
```

**Respuesta:**
```json
{
  "strategies": {
    "support_resistance": {
      "trades": 15,
      "win_rate": 73.3,
      "avg_pnl": 18.5,
      "total_pnl": 277.5,
      "confidence_avg": 0.82
    },
    "ict_techniques": {
      "trades": 12,
      "win_rate": 66.7,
      "avg_pnl": 22.3,
      "total_pnl": 267.6,
      "confidence_avg": 0.78
    },
    "fibonacci": {
      "trades": 18,
      "win_rate": 72.2,
      "avg_pnl": 15.8,
      "total_pnl": 284.4,
      "confidence_avg": 0.85
    }
  }
}
```

---

## 🧠 Endpoints de IA

### Estado de Ollama
```http
GET /api/ai/ollama/status
```

**Respuesta:**
```json
{
  "status": "connected",
  "model": "gpt-oss-120b-turbo",
  "version": "1.0.0",
  "last_ping": "2024-01-15T10:30:00Z",
  "response_time_ms": 1250
}
```

### Análisis con IA
```http
POST /api/ai/analyze
Content-Type: application/json

{
  "symbol": "BTCUSDT",
  "analysis_type": "market_sentiment",
  "data": {
    "price": 45000,
    "volume": 1000000,
    "technical_indicators": {
      "rsi": 65.5,
      "macd": 125.3,
      "bollinger_position": 0.7
    }
  }
}
```

**Respuesta:**
```json
{
  "analysis": {
    "sentiment": "bullish",
    "confidence": 0.78,
    "reasoning": "Technical indicators show bullish momentum with RSI in neutral territory and MACD showing positive divergence. Volume is above average, indicating strong interest.",
    "recommendations": [
      "Consider long position with tight stop loss",
      "Monitor for breakout above resistance at 45500",
      "Watch for volume confirmation on any moves"
    ],
    "risk_factors": [
      "Overbought conditions possible if price continues up",
      "Market volatility may increase",
      "External news events could impact sentiment"
    ]
  },
  "confidence": 0.78,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🔄 Endpoints de Exchanges

### Estado de Exchanges
```http
GET /api/exchanges/status
```

**Respuesta:**
```json
{
  "exchanges": {
    "binance": {
      "status": "connected",
      "last_ping": "2024-01-15T10:30:00Z",
      "rate_limits": {
        "requests_per_minute": 1200,
        "remaining": 1150
      }
    },
    "kraken": {
      "status": "connected",
      "last_ping": "2024-01-15T10:30:00Z",
      "rate_limits": {
        "requests_per_minute": 600,
        "remaining": 580
      }
    }
  }
}
```

### Balances de Exchanges
```http
GET /api/exchanges/balances
```

**Respuesta:**
```json
{
  "balances": {
    "binance": {
      "BTC": {
        "free": 0.025,
        "locked": 0.001,
        "total": 0.026
      },
      "USDT": {
        "free": 1250.75,
        "locked": 50.00,
        "total": 1300.75
      }
    },
    "kraken": {
      "BTC": {
        "free": 0.015,
        "locked": 0.0,
        "total": 0.015
      },
      "USDT": {
        "free": 750.25,
        "locked": 25.00,
        "total": 775.25
      }
    }
  },
  "total_value_usdt": 2081.50
}
```

### Oportunidades de Arbitraje
```http
GET /api/exchanges/arbitrage-opportunities?symbol=BTCUSDT&min_profit=0.001
```

**Respuesta:**
```json
{
  "opportunities": [
    {
      "symbol": "BTCUSDT",
      "buy_exchange": "kraken",
      "sell_exchange": "binance",
      "buy_price": 44950.00,
      "sell_price": 45050.00,
      "profit_percentage": 0.22,
      "profit_amount": 1.00,
      "volume_available": 0.5,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## ⚖️ Endpoints de Gestión de Riesgo

### Niveles de Riesgo
```http
GET /api/risk/levels
```

**Respuesta:**
```json
{
  "current_level": "conservative",
  "available_levels": {
    "conservative": {
      "max_leverage": 2.0,
      "position_size_percent": 0.02,
      "stop_loss_percent": 0.01,
      "take_profit_percent": 0.02
    },
    "risky": {
      "max_leverage": 5.0,
      "position_size_percent": 0.05,
      "stop_loss_percent": 0.015,
      "take_profit_percent": 0.03
    },
    "turbo": {
      "max_leverage": 10.0,
      "position_size_percent": 0.10,
      "stop_loss_percent": 0.02,
      "take_profit_percent": 0.05
    }
  }
}
```

### Establecer Nivel de Riesgo
```http
POST /api/risk/set-level
Content-Type: application/json

{
  "risk_level": "risky"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Risk level updated successfully",
  "new_level": "risky",
  "config": {
    "max_leverage": 5.0,
    "position_size_percent": 0.05,
    "stop_loss_percent": 0.015,
    "take_profit_percent": 0.03
  }
}
```

### Calcular Tamaño de Posición
```http
POST /api/risk/calculate-position
Content-Type: application/json

{
  "account_balance": 10000,
  "symbol": "BTCUSDT",
  "risk_level": "conservative"
}
```

**Respuesta:**
```json
{
  "position_size": 0.022,
  "stop_loss": 44550.00,
  "take_profit": 45450.00,
  "risk_amount": 100.00,
  "leverage": 2.0,
  "margin_required": 495.00
}
```

---

## 📊 Endpoints de Monitoreo

### Métricas del Sistema
```http
GET /api/monitoring/system-metrics
```

**Respuesta:**
```json
{
  "cpu_percent": 45.2,
  "memory_percent": 67.8,
  "disk_percent": 34.5,
  "network_io": {
    "bytes_sent": 1250000,
    "bytes_recv": 2100000
  },
  "load_average": [1.2, 1.5, 1.8],
  "uptime_seconds": 172800
}
```

### Métricas de la Aplicación
```http
GET /api/monitoring/app-metrics
```

**Respuesta:**
```json
{
  "active_connections": 45,
  "requests_per_second": 12.5,
  "response_time_avg": 0.125,
  "error_rate": 0.02,
  "cache_hit_rate": 0.85,
  "database_connections": 8
}
```

### Estado de Salud
```http
GET /api/monitoring/health
```

**Respuesta:**
```json
{
  "status": "healthy",
  "checks": {
    "database": {
      "status": "healthy",
      "response_time_ms": 5
    },
    "redis": {
      "status": "healthy",
      "memory_usage": "10MB"
    },
    "disk_space": {
      "status": "healthy",
      "free_percent": 65.5
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Alertas Activas
```http
GET /api/monitoring/alerts
```

**Respuesta:**
```json
{
  "active_alerts": [
    {
      "id": "alert_123",
      "severity": "warning",
      "message": "High CPU usage detected",
      "metric": "cpu_percent",
      "value": 85.5,
      "threshold": 80.0,
      "timestamp": "2024-01-15T10:25:00Z"
    }
  ],
  "total_active": 1
}
```

---

## ❌ Códigos de Error

### Códigos HTTP Estándar
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error

### Códigos de Error Personalizados
- `1001` - Invalid trading symbol
- `1002` - Insufficient balance
- `1003` - Order size too small
- `1004` - Order size too large
- `1005` - Price out of range
- `2001` - Exchange connection failed
- `2002` - Rate limit exceeded
- `2003` - Invalid API credentials
- `3001` - Autopilot not running
- `3002` - Invalid strategy configuration
- `3003` - Risk level not allowed
- `4001` - AI service unavailable
- `4002` - Analysis timeout
- `5001` - Database connection error
- `5002` - Cache service unavailable

### Formato de Error
```json
{
  "error": {
    "code": 1001,
    "message": "Invalid trading symbol",
    "details": "Symbol 'INVALID' is not supported",
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_123456789"
  }
}
```

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Análisis Completo de BTCUSDT
```bash
# 1. Obtener análisis técnico
curl -X GET "http://localhost:8000/api/technical/support-resistance?symbol=BTCUSDT&timeframe=1h" \
  -H "Authorization: Bearer <token>"

# 2. Obtener análisis ICT
curl -X GET "http://localhost:8000/api/technical/ict?symbol=BTCUSDT&timeframe=1h" \
  -H "Authorization: Bearer <token>"

# 3. Analizar con IA
curl -X POST "http://localhost:8000/api/ai/analyze" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSDT",
    "analysis_type": "market_sentiment",
    "data": {"price": 45000, "volume": 1000000}
  }'
```

### Ejemplo 2: Configurar Autopilot
```bash
# 1. Iniciar autopilot
curl -X POST "http://localhost:8000/api/autopilot/start" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled_strategies": ["support_resistance", "ict_techniques"],
    "risk_level": "conservative",
    "dry_run": true
  }'

# 2. Verificar estado
curl -X GET "http://localhost:8000/api/autopilot/status" \
  -H "Authorization: Bearer <token>"

# 3. Ver historial
curl -X GET "http://localhost:8000/api/autopilot/history?limit=10" \
  -H "Authorization: Bearer <token>"
```

### Ejemplo 3: Monitoreo del Sistema
```bash
# 1. Verificar salud del sistema
curl -X GET "http://localhost:8000/api/monitoring/health" \
  -H "Authorization: Bearer <token>"

# 2. Obtener métricas
curl -X GET "http://localhost:8000/api/monitoring/system-metrics" \
  -H "Authorization: Bearer <token>"

# 3. Ver alertas activas
curl -X GET "http://localhost:8000/api/monitoring/alerts" \
  -H "Authorization: Bearer <token>"
```

### Ejemplo 4: Trading Manual
```bash
# 1. Crear orden
curl -X POST "http://localhost:8000/api/trading/orders" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSDT",
    "side": "BUY",
    "type": "LIMIT",
    "quantity": 0.001,
    "price": 45000.00
  }'

# 2. Ver órdenes activas
curl -X GET "http://localhost:8000/api/trading/orders?status=open" \
  -H "Authorization: Bearer <token>"

# 3. Cancelar orden
curl -X DELETE "http://localhost:8000/api/trading/orders/ord_123456789" \
  -H "Authorization: Bearer <token>"
```

---

## 🔗 WebSocket API

### Conexión WebSocket
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onopen = function() {
    console.log('WebSocket connected');
};

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Received:', data);
};
```

### Tipos de Mensajes

#### Datos de Mercado en Tiempo Real
```json
{
  "type": "market_data",
  "symbol": "BTCUSDT",
  "price": 45000.00,
  "volume": 1250000,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Señales de Trading
```json
{
  "type": "trading_signal",
  "symbol": "BTCUSDT",
  "signal": "BUY",
  "confidence": 0.85,
  "strategy": "support_resistance",
  "entry_price": 44850.00,
  "target_price": 45200.00,
  "stop_loss": 44700.00,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Estado del Autopilot
```json
{
  "type": "autopilot_status",
  "status": "running",
  "active_signals": 3,
  "last_trade": {
    "symbol": "BTCUSDT",
    "side": "BUY",
    "pnl": 25.50
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Alertas del Sistema
```json
{
  "type": "system_alert",
  "severity": "warning",
  "message": "High CPU usage detected",
  "metric": "cpu_percent",
  "value": 85.5,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 📝 Notas Adicionales

### Rate Limiting
- Las APIs tienen límites de rate limiting configurados
- Respeta los headers `X-Rate-Limit-Remaining` y `X-Rate-Limit-Reset`
- Implementa backoff exponencial si recibes error 429

### Paginación
- Todos los endpoints que retornan listas soportan paginación
- Usa los parámetros `limit` y `offset`
- El límite máximo por request es 1000

### Timestamps
- Todos los timestamps están en formato ISO 8601 UTC
- Formato: `YYYY-MM-DDTHH:MM:SSZ`

### Validación
- Todos los inputs son validados y sanitizados
- Los símbolos deben estar en la lista de símbolos soportados
- Los precios y cantidades deben ser números positivos válidos

### Seguridad
- Todas las APIs requieren autenticación (excepto health checks)
- Usa HTTPS en producción
- Los tokens tienen expiración configurable
- Implementa 2FA para cuentas administrativas

---

## 🆘 Soporte

Para soporte técnico o reportar bugs:
- **Email**: support@grok-beast.com
- **Documentación**: https://docs.grok-beast.com
- **GitHub Issues**: https://github.com/grok-beast/issues

---

*Última actualización: 2024-01-15*




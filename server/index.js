import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '../dist')));

// ==================== BOT MODULES DATA ====================
const botModules = {
  scalper_engine: {
    id: 'scalper_engine',
    name: 'Scalper Engine',
    type: 'trading',
    status: 'active',
    enabled: true,
    description: 'Q-learning + Smart Money Concepts',
    performance: 85.2,
    trades_today: 15,
    profit_today: 125.50,
    last_signal: new Date().toISOString(),
    algorithm: 'Q-Learning with risk-aware rewards',
    parameters: {
      learning_rate: 0.001,
      epsilon: 0.1,
      batch_size: 32,
      min_spread: 0.0005
    }
  },
  market_maker: {
    id: 'market_maker',
    name: 'Market Maker',
    type: 'trading',
    status: 'active',
    enabled: true,
    description: 'Órdenes límite alrededor del mid-price',
    performance: 78.5,
    trades_today: 45,
    profit_today: 89.25,
    spread: 0.001,
    orders_placed: 45,
    last_signal: new Date().toISOString(),
    algorithm: 'Adaptive market making with dynamic spreads'
  },
  arbitrage_engine: {
    id: 'arbitrage_engine',
    name: 'Arbitrage Engine',
    type: 'trading',
    status: 'active',
    enabled: true,
    description: 'Diferencias de precio entre exchanges',
    performance: 92.1,
    trades_today: 3,
    profit_today: 214.75,
    opportunities: 3,
    last_signal: new Date().toISOString(),
    algorithm: 'Multi-exchange arbitrage detection'
  },
  ai_controller: {
    id: 'ai_controller',
    name: 'AI Controller',
    type: 'ai',
    status: 'active',
    enabled: true,
    description: 'Red de políticas que elige la estrategia óptima',
    performance: 88.7,
    accuracy: 0.85,
    predictions_today: 120,
    last_signal: new Date().toISOString(),
    algorithm: 'Neural network policy selector with Ollama integration'
  },
  virtual_trader: {
    id: 'virtual_trader',
    name: 'Virtual Trader',
    type: 'trading',
    status: 'active',
    enabled: true,
    description: 'Simulador de paper trading',
    performance: 94.3,
    positions: 1,
    total_trades: 25,
    equity: 11500.0,
    last_signal: new Date().toISOString(),
    algorithm: 'Virtual position management with TP/SL'
  },
  pair_scanner: {
    id: 'pair_scanner',
    name: 'Pair Scanner',
    type: 'analysis',
    status: 'active',
    enabled: true,
    description: 'Escaneo automático de pares',
    performance: 89.4,
    pairs_scanned: 150,
    opportunities_found: 8,
    last_signal: new Date().toISOString(),
    algorithm: 'Multi-timeframe opportunity detection'
  },
  news_filter: {
    id: 'news_filter',
    name: 'News Filter',
    type: 'analysis',
    status: 'active',
    enabled: true,
    description: 'Análisis fundamental con filtro de noticias',
    performance: 73.8,
    news_processed: 45,
    signals_generated: 3,
    last_signal: new Date().toISOString(),
    algorithm: 'NLP sentiment analysis with news filtering'
  },
  risk_manager: {
    id: 'risk_manager',
    name: 'Risk Manager',
    type: 'risk',
    status: 'active',
    enabled: true,
    description: 'Gestión de riesgo con 3 niveles',
    performance: 95.2,
    max_exposure: 0.15,
    current_exposure: 0.08,
    last_signal: new Date().toISOString(),
    algorithm: 'Multi-level risk management (Conservative/Risky/Turbo)'
  },
  support_resistance: {
    id: 'support_resistance',
    name: 'Support/Resistance Analyzer',
    type: 'analysis',
    status: 'active',
    enabled: true,
    description: 'Detección automática de niveles clave',
    performance: 82.3,
    levels_detected: 12,
    last_signal: new Date().toISOString(),
    algorithm: 'Pivot point detection with fractal analysis'
  },
  ict_analysis: {
    id: 'ict_analysis',
    name: 'ICT Analysis',
    type: 'analysis',
    status: 'active',
    enabled: true,
    description: 'Order Blocks, FVG, Liquidity Sweeps',
    performance: 79.8,
    order_blocks: 5,
    fair_value_gaps: 3,
    liquidity_sweeps: 2,
    last_signal: new Date().toISOString(),
    algorithm: 'Inner Circle Trader concepts implementation'
  },
  fibonacci_analysis: {
    id: 'fibonacci_analysis',
    name: 'Fibonacci Analysis',
    type: 'analysis',
    status: 'active',
    enabled: true,
    description: 'Retrocesos, extensiones, abanicos',
    performance: 76.4,
    retracements: 8,
    extensions: 5,
    last_signal: new Date().toISOString(),
    algorithm: 'Multi-level Fibonacci analysis with time zones'
  },
  session_analysis: {
    id: 'session_analysis',
    name: 'Session Analysis',
    type: 'analysis',
    status: 'active',
    enabled: true,
    description: 'Análisis por sesiones de trading',
    performance: 84.1,
    current_session: 'european',
    session_strength: 0.8,
    last_signal: new Date().toISOString(),
    algorithm: 'Asian/European/American session analysis'
  },
  spread_analysis: {
    id: 'spread_analysis',
    name: 'Spread Analysis',
    type: 'analysis',
    status: 'active',
    enabled: true,
    description: 'Análisis de spreads y liquidez',
    performance: 81.6,
    current_spread: 0.001,
    liquidity_score: 0.88,
    last_signal: new Date().toISOString(),
    algorithm: 'Bid-ask spread optimization with liquidity analysis'
  },
  channel_analysis: {
    id: 'channel_analysis',
    name: 'Channel Analysis',
    type: 'analysis',
    status: 'active',
    enabled: true,
    description: 'Detección de canales de tendencia',
    performance: 77.9,
    channels_detected: 3,
    last_signal: new Date().toISOString(),
    algorithm: 'Trend channel detection with parallel lines'
  },
  autopilot_engine: {
    id: 'autopilot_engine',
    name: 'Autopilot Engine',
    type: 'ai',
    status: 'active',
    enabled: true,
    description: 'Trading automático con IA',
    performance: 87.6,
    trades_today: 45,
    profit_today: 890.30,
    confidence: 0.85,
    last_signal: new Date().toISOString(),
    algorithm: 'AI-driven automated trading with multiple strategies'
  },
  opportunity_detector: {
    id: 'opportunity_detector',
    name: 'Opportunity Detector',
    type: 'ai',
    status: 'active',
    enabled: true,
    description: 'Detección automática de oportunidades',
    performance: 83.7,
    trades_today: 12,
    profit_today: 320.15,
    opportunities_detected: 8,
    last_signal: new Date().toISOString(),
    algorithm: 'Automated opportunity detection with AI validation'
  }
};

// Exchange data
const exchanges = {
  binance: {
    name: 'Binance',
    status: 'connected',
    balance: { USDT: 5000.0, BTC: 0.1, ETH: 2.0 },
    pairs_available: 1200,
    fees: { maker: 0.001, taker: 0.001 }
  },
  kraken: {
    name: 'Kraken',
    status: 'connected',
    balance: { USDT: 3000.0, BTC: 0.05, ETH: 1.5 },
    pairs_available: 800,
    fees: { maker: 0.0016, taker: 0.0026 }
  },
  kucoin: {
    name: 'KuCoin',
    status: 'connected',
    balance: { USDT: 2000.0, BTC: 0.03, ETH: 1.0 },
    pairs_available: 600,
    fees: { maker: 0.001, taker: 0.001 }
  },
  okx: {
    name: 'OKX',
    status: 'offline',
    balance: { USDT: 0.0, BTC: 0.0, ETH: 0.0 },
    pairs_available: 0,
    fees: { maker: 0.001, taker: 0.001 }
  }
};

// Market data
let marketData = {
  BTCUSDT: 45230.50,
  ETHUSDT: 3120.75,
  ADAUSDT: 0.52,
  SOLUSDT: 98.45,
  DOTUSDT: 8.25
};

// Storage for orders and trades
let orders = [];
let trades = [];
let alerts = [];

// ==================== API ENDPOINTS ====================

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    version: '2.0.0',
    uptime: '2h 15m',
    modules: Object.fromEntries(
      Object.entries(botModules).map(([key, module]) => [
        key, {
          enabled: module.enabled,
          status: module.status,
          trades_today: module.trades_today || 0,
          profit_today: module.profit_today || 0
        }
      ])
    ),
    active_orders: orders.filter(o => o.status === 'pending').length,
    total_trades: trades.length,
    daily_pnl: Object.values(botModules).reduce((sum, m) => sum + (m.profit_today || 0), 0)
  });
});

// Modules endpoint
app.get('/api/modules', (req, res) => {
  res.json(botModules);
});

// Bot status endpoint
app.get('/api/bot/status', (req, res) => {
  res.json({
    status: 'running',
    symbols: Object.keys(marketData),
    last_signals: Object.fromEntries(
      Object.entries(botModules).map(([key, module]) => [key, 1])
    ),
    virtual_trader_enabled: true,
    ai_enabled: true,
    ollama_connected: true
  });
});

// Bot metrics endpoint
app.get('/api/bot/metrics', (req, res) => {
  const totalTrades = Object.values(botModules).reduce((sum, m) => sum + (m.trades_today || 0), 0);
  const totalProfit = Object.values(botModules).reduce((sum, m) => sum + (m.profit_today || 0), 0);
  const avgPerformance = Object.values(botModules).reduce((sum, m) => sum + m.performance, 0) / Object.keys(botModules).length;

  res.json({
    total_trades: totalTrades,
    win_rate: 0.75,
    total_pnl: totalProfit,
    sharpe_ratio: 1.25,
    max_drawdown: 0.15,
    avg_performance: avgPerformance
  });
});

// Virtual trader status
app.get('/api/virtual/status', (req, res) => {
  res.json({
    open_positions: {
      BTCUSDT: {
        side: 'long',
        entry: 45000.0,
        size: 0.1,
        tp: 46500.0,
        sl: 43500.0,
        opened_at: new Date().toISOString()
      }
    },
    closed_stats: {
      total_trades: 25,
      cumulative_return: 0.15,
      current_equity: 11500.0,
      max_equity: 12000.0,
      drawdown: 0.04
    }
  });
});

// Technical analysis endpoints
app.get('/api/analytics', (req, res) => {
  res.json({
    technical_indicators: {
      rsi: { BTCUSDT: 65.2, ETHUSDT: 58.7, ADAUSDT: 42.1 },
      macd: { BTCUSDT: 125.5, ETHUSDT: -45.2, ADAUSDT: 78.9 },
      bollinger: { 
        BTCUSDT: { upper: 46500, middle: 45000, lower: 43500 },
        ETHUSDT: { upper: 3200, middle: 3100, lower: 3000 }
      }
    },
    support_resistance: {
      BTCUSDT: {
        support: [44000, 43000, 42000],
        resistance: [46000, 47000, 48000]
      },
      ETHUSDT: {
        support: [2900, 2800, 2700],
        resistance: [3200, 3300, 3400]
      }
    },
    fibonacci: {
      BTCUSDT: {
        retracements: [0.236, 0.382, 0.5, 0.618, 0.786],
        extensions: [1.272, 1.414, 1.618]
      }
    },
    ict_analysis: {
      order_blocks: botModules.ict_analysis.order_blocks,
      fair_value_gaps: botModules.ict_analysis.fair_value_gaps,
      liquidity_sweeps: botModules.ict_analysis.liquidity_sweeps,
      market_structure: 'bullish'
    },
    session_analysis: {
      american: { volume: 0.45, trend: 'bullish' },
      asian: { volume: 0.25, trend: 'sideways' },
      european: { volume: 0.30, trend: 'bullish' }
    }
  });
});

// Exchanges endpoint
app.get('/api/exchanges', (req, res) => {
  res.json(exchanges);
});

// Arbitrage opportunities
app.get('/api/arbitrage', (req, res) => {
  res.json({
    opportunities: [
      {
        symbol: 'BTCUSDT',
        exchanges: ['binance', 'kraken'],
        spread: 0.8,
        profit_potential: 125.50,
        volume_available: 0.5
      },
      {
        symbol: 'ETHUSDT',
        exchanges: ['binance', 'okx'],
        spread: 0.5,
        profit_potential: 89.25,
        volume_available: 2.0
      }
    ],
    total_opportunities: 2,
    total_profit_potential: 214.75
  });
});

// Scanner results
app.get('/api/scanner', (req, res) => {
  res.json({
    spot_pairs: [
      { symbol: 'BTCUSDT', volume_24h: 2500000, change_24h: 2.5, signal: 'buy' },
      { symbol: 'ETHUSDT', volume_24h: 1800000, change_24h: 1.8, signal: 'buy' },
      { symbol: 'ADAUSDT', volume_24h: 800000, change_24h: -0.5, signal: 'sell' }
    ],
    futures_pairs: [
      { symbol: 'BTCUSDT', volume_24h: 3500000, change_24h: 3.2, signal: 'buy' },
      { symbol: 'ETHUSDT', volume_24h: 2200000, change_24h: 2.1, signal: 'buy' }
    ],
    total_scanned: 150,
    opportunities_found: 8
  });
});

// Orders endpoints
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const order = {
    id: `order_${Date.now()}`,
    ...req.body,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  orders.push(order);
  res.json({ success: true, order_id: order.id });
});

app.delete('/api/orders/:id', (req, res) => {
  const orderId = req.params.id;
  const orderIndex = orders.findIndex(o => o.id === orderId);
  if (orderIndex !== -1) {
    orders[orderIndex].status = 'cancelled';
    orders[orderIndex].updated_at = new Date().toISOString();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

// Trades endpoint
app.get('/api/trades', (req, res) => {
  res.json(trades);
});

// Prices endpoint
app.get('/api/prices', (req, res) => {
  res.json(marketData);
});

// Portfolio endpoint
app.get('/api/portfolio', (req, res) => {
  res.json({
    total_balance: 10000.0,
    available_balance: 8500.0,
    positions: [
      {
        symbol: 'BTCUSDT',
        side: 'long',
        size: 0.1,
        entry_price: 45000,
        current_price: marketData.BTCUSDT,
        pnl: (marketData.BTCUSDT - 45000) * 0.1,
        pnl_percent: ((marketData.BTCUSDT - 45000) / 45000) * 100
      }
    ],
    daily_pnl: 150.0,
    total_pnl: 2500.0,
    win_rate: 0.75
  });
});

// Portfolio metrics
app.get('/api/portfolio/metrics', (req, res) => {
  res.json({
    total_balance: 10000.0,
    daily_pnl: 150.0,
    total_pnl: 2500.0,
    win_rate: 0.75,
    sharpe_ratio: 1.25,
    max_drawdown: 0.15,
    total_trades: 150,
    active_positions: 1
  });
});

// Alerts endpoints
app.get('/api/alerts', (req, res) => {
  res.json(alerts);
});

app.post('/api/alerts', (req, res) => {
  const alert = {
    id: `alert_${Date.now()}`,
    ...req.body,
    enabled: true,
    created_at: new Date().toISOString()
  };
  alerts.push(alert);
  res.json({ success: true, alert_id: alert.id });
});

// Configuration endpoints
app.get('/api/config', (req, res) => {
  res.json({
    dry_run: true,
    maker_enabled: true,
    arb_enabled: true,
    ai_controller_enabled: true,
    virtual_trader_enabled: true,
    ollama_model: 'gpt-oss:120b',
    risk_level: 'conservative',
    max_position_size: 0.1,
    stop_loss_percent: 0.02,
    take_profit_percent: 0.04
  });
});

app.post('/api/config', (req, res) => {
  console.log('Config updated:', req.body);
  res.json({ success: true, message: 'Configuration updated' });
});

// Metrics endpoint
app.get('/api/metrics', (req, res) => {
  res.json({
    total_trades: trades.length,
    active_orders: orders.filter(o => o.status === 'pending').length,
    daily_pnl: Object.values(botModules).reduce((sum, m) => sum + (m.profit_today || 0), 0),
    win_rate: 0.75,
    system_uptime: '2h 15m',
    cpu_usage: 45.2,
    memory_usage: 68.5,
    api_calls_per_minute: 120
  });
});

// Advanced metrics
app.get('/api/metrics/advanced', (req, res) => {
  res.json({
    trading_metrics: {
      total_trades: 150,
      winning_trades: 113,
      losing_trades: 37,
      win_rate: 0.753,
      avg_win: 45.2,
      avg_loss: -28.7,
      profit_factor: 1.58,
      sharpe_ratio: 1.25,
      max_drawdown: 0.15,
      recovery_factor: 8.33
    },
    system_metrics: {
      cpu_usage: 45.2,
      memory_usage: 68.5,
      disk_usage: 23.1,
      network_latency: 12.5,
      api_calls_per_minute: 120,
      error_rate: 0.02
    },
    ai_metrics: {
      model_accuracy: 0.85,
      prediction_confidence: 0.78,
      training_samples: 10000,
      last_training: new Date().toISOString(),
      epsilon_value: 0.1,
      reward_trend: 'increasing'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Bot control endpoints
app.post('/api/bot/start', (req, res) => {
  res.json({ success: true, message: 'Bot started successfully' });
});

app.post('/api/bot/stop', (req, res) => {
  res.json({ success: true, message: 'Bot stopped successfully' });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// ==================== WEBSOCKET FOR REAL-TIME LOGS ====================
const connectedClients = new Set();

wss.on('connection', (ws) => {
  connectedClients.add(ws);
  console.log('WebSocket client connected');

  ws.on('close', () => {
    connectedClients.remove(ws);
    console.log('WebSocket client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    connectedClients.delete(ws);
  });
});

// Broadcast logs to all connected clients
function broadcastLog(logEntry) {
  const message = JSON.stringify(logEntry);
  connectedClients.forEach(ws => {
    if (ws.readyState === ws.OPEN) {
      try {
        ws.send(message);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        connectedClients.delete(ws);
      }
    }
  });
}

// Simulate real-time logs
setInterval(() => {
  const modules = Object.keys(botModules);
  const randomModule = modules[Math.floor(Math.random() * modules.length)];
  const module = botModules[randomModule];
  
  const logMessages = [
    `Signal generated: BUY BTCUSDT @ ${marketData.BTCUSDT.toFixed(2)}`,
    `Order placed: SELL ETHUSDT @ ${marketData.ETHUSDT.toFixed(2)}`,
    `Opportunity detected: ${randomModule.toUpperCase()} spread 0.5%`,
    `Action selected: ${randomModule.toUpperCase()}`,
    `Position opened: LONG ADAUSDT @ ${marketData.ADAUSDT.toFixed(4)}`,
    `Position closed: SHORT SOLUSDT @ ${marketData.SOLUSDT.toFixed(2)} (+2.1%)`,
    `Prediction: Market trending up, confidence ${(Math.random() * 0.3 + 0.7).toFixed(2)}`
  ];

  const logEntry = {
    timestamp: new Date().toISOString(),
    level: Math.random() > 0.8 ? 'WARNING' : 'INFO',
    message: logMessages[Math.floor(Math.random() * logMessages.length)],
    module: randomModule.toUpperCase()
  };

  broadcastLog(logEntry);
}, 2000);

// Update market data periodically
setInterval(() => {
  Object.keys(marketData).forEach(symbol => {
    const change = (Math.random() - 0.5) * 0.02; // ±1% change
    marketData[symbol] = Math.max(0.01, marketData[symbol] * (1 + change));
  });
}, 5000);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Grok-Beast Trading Dashboard running on http://localhost:${PORT}`);
  console.log(`📊 WebSocket server running for real-time data`);
  console.log(`🤖 All ${Object.keys(botModules).length} bot modules initialized`);
  console.log(`🔄 ${Object.keys(exchanges).length} exchanges configured`);
});
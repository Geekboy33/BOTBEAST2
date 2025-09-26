import React, { useState, useEffect } from 'react';

// Datos de todos los módulos del bot BOTBEAST2
const botModules = {
  scalper_engine: {
    name: 'Scalper Engine',
    type: 'trading',
    status: 'active',
    performance: 85.2,
    trades_today: 15,
    profit_today: 125.50,
    description: 'Q-learning + Smart Money Concepts'
  },
  market_maker: {
    name: 'Market Maker',
    type: 'trading', 
    status: 'active',
    performance: 78.5,
    trades_today: 45,
    profit_today: 89.25,
    description: 'Órdenes límite alrededor del mid-price'
  },
  arbitrage_engine: {
    name: 'Arbitrage Engine',
    type: 'trading',
    status: 'active', 
    performance: 92.1,
    trades_today: 3,
    profit_today: 214.75,
    description: 'Diferencias de precio entre exchanges'
  },
  ai_controller: {
    name: 'AI Controller',
    type: 'ai',
    status: 'active',
    performance: 88.7,
    predictions_today: 120,
    profit_today: 0,
    description: 'Red de políticas que elige la estrategia óptima'
  },
  virtual_trader: {
    name: 'Virtual Trader',
    type: 'trading',
    status: 'active',
    performance: 94.3,
    trades_today: 25,
    profit_today: 320.15,
    description: 'Simulador de paper trading'
  },
  pair_scanner: {
    name: 'Pair Scanner',
    type: 'analysis',
    status: 'active',
    performance: 89.4,
    pairs_scanned: 150,
    opportunities_found: 8,
    description: 'Escaneo automático de pares'
  },
  news_filter: {
    name: 'News Filter',
    type: 'analysis',
    status: 'active',
    performance: 73.8,
    news_processed: 45,
    signals_generated: 3,
    description: 'Análisis fundamental con filtro de noticias'
  },
  risk_manager: {
    name: 'Risk Manager',
    type: 'risk',
    status: 'active',
    performance: 95.2,
    max_exposure: 0.15,
    current_exposure: 0.08,
    description: 'Gestión de riesgo con 3 niveles'
  },
  support_resistance: {
    name: 'Support/Resistance',
    type: 'analysis',
    status: 'active',
    performance: 82.3,
    levels_detected: 12,
    description: 'Detección automática de niveles clave'
  },
  ict_analysis: {
    name: 'ICT Analysis',
    type: 'analysis',
    status: 'active',
    performance: 79.8,
    order_blocks: 5,
    fair_value_gaps: 3,
    description: 'Order Blocks, FVG, Liquidity Sweeps'
  },
  fibonacci_analysis: {
    name: 'Fibonacci Analysis',
    type: 'analysis',
    status: 'active',
    performance: 76.4,
    retracements: 8,
    extensions: 5,
    description: 'Retrocesos, extensiones, abanicos'
  },
  session_analysis: {
    name: 'Session Analysis',
    type: 'analysis',
    status: 'active',
    performance: 84.1,
    current_session: 'european',
    description: 'Análisis por sesiones de trading'
  },
  spread_analysis: {
    name: 'Spread Analysis',
    type: 'analysis',
    status: 'active',
    performance: 81.6,
    current_spread: 0.001,
    description: 'Análisis de spreads y liquidez'
  },
  channel_analysis: {
    name: 'Channel Analysis',
    type: 'analysis',
    status: 'active',
    performance: 77.9,
    channels_detected: 3,
    description: 'Detección de canales de tendencia'
  },
  autopilot_engine: {
    name: 'Autopilot Engine',
    type: 'ai',
    status: 'active',
    performance: 87.6,
    trades_today: 45,
    profit_today: 890.30,
    description: 'Trading automático con IA'
  },
  opportunity_detector: {
    name: 'Opportunity Detector',
    type: 'ai',
    status: 'active',
    performance: 83.7,
    trades_today: 12,
    profit_today: 320.15,
    description: 'Detección automática de oportunidades'
  }
};

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [prices, setPrices] = useState({
    BTCUSDT: 45230.50,
    ETHUSDT: 3120.75,
    ADAUSDT: 0.52,
    SOLUSDT: 98.45,
    DOTUSDT: 8.25
  });
  const [logs, setLogs] = useState([]);

  // Simular actualizaciones de precios
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev => {
        const newPrices = { ...prev };
        Object.keys(newPrices).forEach(symbol => {
          const change = (Math.random() - 0.5) * 0.02;
          newPrices[symbol] = Math.max(0.01, newPrices[symbol] * (1 + change));
        });
        return newPrices;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Simular logs del sistema
  useEffect(() => {
    const logMessages = [
      '[SCALPER] Signal generated: BUY BTCUSDT @ 45000',
      '[MARKET_MAKER] Order placed: SELL ETHUSDT @ 3000',
      '[ARBITRAGE] Opportunity detected: BTCUSDT spread 0.5%',
      '[AI_CONTROLLER] Action selected: SCALPER',
      '[VIRTUAL] Position opened: LONG ADAUSDT @ 0.52',
      '[OLLAMA] Prediction: Market trending up, confidence 0.85',
      '[PAIR_SCANNER] 8 new opportunities found',
      '[NEWS_FILTER] 3 relevant news items processed',
      '[RISK_MANAGER] Exposure check: 8% current, 15% max'
    ];

    const interval = setInterval(() => {
      const randomMessage = logMessages[Math.floor(Math.random() * logMessages.length)];
      const newLog = {
        timestamp: new Date().toLocaleTimeString(),
        message: randomMessage,
        level: Math.random() > 0.8 ? 'WARNING' : 'INFO'
      };
      
      setLogs(prev => [newLog, ...prev.slice(0, 19)]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    return status === 'active' ? '#10B981' : '#EF4444';
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'trading': return '💹';
      case 'analysis': return '📊';
      case 'ai': return '🤖';
      case 'risk': return '⚖️';
      default: return '📦';
    }
  };

  const totalTrades = Object.values(botModules).reduce((sum, m) => sum + (m.trades_today || 0), 0);
  const totalPnL = Object.values(botModules).reduce((sum, m) => sum + (m.profit_today || 0), 0);
  const activeModules = Object.values(botModules).filter(m => m.status === 'active').length;

  return (
    <div style={{ minHeight: '100vh', background: '#111827', color: 'white', fontFamily: 'system-ui' }}>
      {/* Header */}
      <header style={{ 
        background: '#1F2937', 
        padding: '1rem 2rem', 
        borderBottom: '1px solid #374151',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FCD34D', margin: 0 }}>
            GROK-BEAST
          </h1>
          <div style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>
            Advanced Trading System v2.0.0
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              borderRadius: '50%', 
              background: '#10B981',
              animation: 'pulse 2s infinite'
            }}></div>
            <span style={{ fontSize: '0.875rem' }}>SYSTEM ONLINE</span>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{ 
        background: '#1F2937', 
        padding: '0 2rem',
        borderBottom: '1px solid #374151'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { key: 'overview', label: '📊 Overview' },
            { key: 'trading', label: '💹 Trading' },
            { key: 'modules', label: '🤖 Modules' },
            { key: 'analytics', label: '📈 Analytics' },
            { key: 'ai', label: '🧠 AI Control' },
            { key: 'portfolio', label: '💼 Portfolio' },
            { key: 'logs', label: '📋 Logs' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '0.75rem 1rem',
                background: activeTab === tab.key ? '#FCD34D' : 'transparent',
                color: activeTab === tab.key ? '#111827' : '#9CA3AF',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ padding: '2rem' }}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* System Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div style={{ background: '#1F2937', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #374151' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>Total Modules</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FCD34D' }}>{activeModules}/16</div>
                <div style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>All systems operational</div>
              </div>
              
              <div style={{ background: '#1F2937', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #374151' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>Total Trades</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3B82F6' }}>{totalTrades}</div>
                <div style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>Trades executed today</div>
              </div>
              
              <div style={{ background: '#1F2937', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #374151' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>Total P&L</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10B981' }}>+${totalPnL.toFixed(2)}</div>
                <div style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>Profit generated today</div>
              </div>
              
              <div style={{ background: '#1F2937', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #374151' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>System Uptime</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8B5CF6' }}>2h 15m</div>
                <div style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>Running continuously</div>
              </div>
            </div>

            {/* Current Prices */}
            <div style={{ background: '#1F2937', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #374151' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 1rem 0' }}>💰 Current Market Prices</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {Object.entries(prices).map(([symbol, price]) => {
                  const change = (Math.random() - 0.5) * 10;
                  return (
                    <div key={symbol} style={{ 
                      background: '#374151', 
                      padding: '1rem', 
                      borderRadius: '0.5rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '0.875rem', color: '#9CA3AF', marginBottom: '0.25rem' }}>{symbol}</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>${price.toFixed(2)}</div>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        color: change >= 0 ? '#10B981' : '#EF4444' 
                      }}>
                        {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bot Modules Grid */}
            <div style={{ background: '#1F2937', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #374151' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 1rem 0' }}>🤖 Active Bot Modules</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                {Object.values(botModules).map((module, index) => (
                  <div key={index} style={{ 
                    background: '#374151', 
                    padding: '1rem', 
                    borderRadius: '0.5rem',
                    border: '1px solid #4B5563'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>{getTypeIcon(module.type)}</span>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>{module.name}</h4>
                      </div>
                      <div style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        background: getStatusColor(module.status)
                      }}></div>
                    </div>
                    
                    <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: '0 0 0.75rem 0' }}>
                      {module.description}
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#9CA3AF' }}>Performance:</span>
                        <span style={{ fontWeight: '600' }}>{module.performance}%</span>
                      </div>
                      {module.trades_today !== undefined && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#9CA3AF' }}>Trades Today:</span>
                          <span style={{ fontWeight: '600', color: '#3B82F6' }}>{module.trades_today}</span>
                        </div>
                      )}
                      {module.profit_today !== undefined && module.profit_today > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#9CA3AF' }}>Profit Today:</span>
                          <span style={{ fontWeight: '600', color: '#10B981' }}>${module.profit_today.toFixed(2)}</span>
                        </div>
                      )}
                      {module.pairs_scanned !== undefined && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#9CA3AF' }}>Pairs Scanned:</span>
                          <span style={{ fontWeight: '600', color: '#8B5CF6' }}>{module.pairs_scanned}</span>
                        </div>
                      )}
                      {module.predictions_today !== undefined && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#9CA3AF' }}>Predictions:</span>
                          <span style={{ fontWeight: '600', color: '#F59E0B' }}>{module.predictions_today}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Trading Tab */}
        {activeTab === 'trading' && (
          <div style={{ background: '#1F2937', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #374151' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 1rem 0' }}>💹 Trading Interface</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {Object.entries(prices).map(([symbol, price]) => (
                <div key={symbol} style={{ 
                  background: '#374151', 
                  padding: '1rem', 
                  borderRadius: '0.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>{symbol}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${price.toFixed(2)}</div>
                  <div style={{ fontSize: '0.875rem', color: '#10B981' }}>+2.3%</div>
                </div>
              ))}
            </div>

            <div style={{ background: '#374151', padding: '1rem', borderRadius: '0.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 1rem 0' }}>Create New Order</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                <select style={{ 
                  background: '#4B5563', 
                  color: 'white', 
                  padding: '0.5rem', 
                  borderRadius: '0.25rem',
                  border: '1px solid #6B7280'
                }}>
                  <option>BTCUSDT</option>
                  <option>ETHUSDT</option>
                  <option>ADAUSDT</option>
                </select>
                <select style={{ 
                  background: '#4B5563', 
                  color: 'white', 
                  padding: '0.5rem', 
                  borderRadius: '0.25rem',
                  border: '1px solid #6B7280'
                }}>
                  <option>BUY</option>
                  <option>SELL</option>
                </select>
                <input 
                  type="number" 
                  placeholder="Quantity"
                  style={{ 
                    background: '#4B5563', 
                    color: 'white', 
                    padding: '0.5rem', 
                    borderRadius: '0.25rem',
                    border: '1px solid #6B7280'
                  }}
                />
                <button style={{
                  background: '#10B981',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.25rem',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                  Create Order
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modules Tab */}
        {activeTab === 'modules' && (
          <div style={{ background: '#1F2937', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #374151' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 1rem 0' }}>🤖 Bot Modules Management</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1rem' }}>
              {Object.values(botModules).map((module, index) => (
                <div key={index} style={{ 
                  background: '#374151', 
                  padding: '1.5rem', 
                  borderRadius: '0.5rem',
                  border: '1px solid #4B5563'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{getTypeIcon(module.type)}</span>
                      <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>{module.name}</h3>
                        <div style={{ fontSize: '0.75rem', color: '#9CA3AF', textTransform: 'uppercase' }}>
                          {module.type}
                        </div>
                      </div>
                    </div>
                    <div style={{ 
                      width: '16px', 
                      height: '16px', 
                      borderRadius: '50%', 
                      background: getStatusColor(module.status)
                    }}></div>
                  </div>
                  
                  <p style={{ fontSize: '0.875rem', color: '#D1D5DB', margin: '0 0 1rem 0' }}>
                    {module.description}
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#9CA3AF' }}>Performance:</span>
                      <span style={{ fontWeight: '600' }}>{module.performance}%</span>
                    </div>
                    {module.trades_today !== undefined && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#9CA3AF' }}>Trades:</span>
                        <span style={{ fontWeight: '600', color: '#3B82F6' }}>{module.trades_today}</span>
                      </div>
                    )}
                    {module.profit_today !== undefined && module.profit_today > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#9CA3AF' }}>Profit:</span>
                        <span style={{ fontWeight: '600', color: '#10B981' }}>${module.profit_today.toFixed(2)}</span>
                      </div>
                    )}
                    {module.pairs_scanned !== undefined && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#9CA3AF' }}>Pairs:</span>
                        <span style={{ fontWeight: '600', color: '#8B5CF6' }}>{module.pairs_scanned}</span>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <button style={{
                      flex: 1,
                      background: '#EF4444',
                      color: 'white',
                      padding: '0.5rem',
                      borderRadius: '0.25rem',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}>
                      Disable
                    </button>
                    <button style={{
                      flex: 1,
                      background: '#3B82F6',
                      color: 'white',
                      padding: '0.5rem',
                      borderRadius: '0.25rem',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}>
                      Config
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div style={{ background: '#1F2937', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #374151' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 1rem 0' }}>📈 Advanced Analytics</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              <div style={{ background: '#374151', padding: '1rem', borderRadius: '0.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 1rem 0' }}>Technical Indicators</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#9CA3AF' }}>RSI (BTCUSDT):</span>
                    <span style={{ fontWeight: '600' }}>65.2</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#9CA3AF' }}>MACD:</span>
                    <span style={{ fontWeight: '600', color: '#10B981' }}>+125.5</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#9CA3AF' }}>Bollinger Upper:</span>
                    <span style={{ fontWeight: '600' }}>${(prices.BTCUSDT * 1.02).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#9CA3AF' }}>Bollinger Lower:</span>
                    <span style={{ fontWeight: '600' }}>${(prices.BTCUSDT * 0.98).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div style={{ background: '#374151', padding: '1rem', borderRadius: '0.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 1rem 0' }}>Support & Resistance</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div>
                    <div style={{ color: '#10B981', fontSize: '0.875rem', fontWeight: '600' }}>Support Levels:</div>
                    <div style={{ fontSize: '0.75rem', color: '#D1D5DB' }}>
                      ${(prices.BTCUSDT * 0.97).toFixed(0)}, ${(prices.BTCUSDT * 0.95).toFixed(0)}, ${(prices.BTCUSDT * 0.93).toFixed(0)}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#EF4444', fontSize: '0.875rem', fontWeight: '600' }}>Resistance Levels:</div>
                    <div style={{ fontSize: '0.75rem', color: '#D1D5DB' }}>
                      ${(prices.BTCUSDT * 1.03).toFixed(0)}, ${(prices.BTCUSDT * 1.05).toFixed(0)}, ${(prices.BTCUSDT * 1.07).toFixed(0)}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: '#374151', padding: '1rem', borderRadius: '0.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 1rem 0' }}>ICT Analysis</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#9CA3AF' }}>Order Blocks:</span>
                    <span style={{ fontWeight: '600', color: '#3B82F6' }}>5 detected</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#9CA3AF' }}>Fair Value Gaps:</span>
                    <span style={{ fontWeight: '600', color: '#10B981' }}>3 identified</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#9CA3AF' }}>Liquidity Sweeps:</span>
                    <span style={{ fontWeight: '600', color: '#8B5CF6' }}>2 executed</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#9CA3AF' }}>Market Structure:</span>
                    <span style={{ fontWeight: '600', color: '#10B981' }}>Bullish</span>
                  </div>
                </div>
              </div>

              <div style={{ background: '#374151', padding: '1rem', borderRadius: '0.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 1rem 0' }}>Session Analysis</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#9CA3AF' }}>American Session:</span>
                    <span style={{ fontWeight: '600', color: '#10B981' }}>45% vol, Bullish</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#9CA3AF' }}>Asian Session:</span>
                    <span style={{ fontWeight: '600', color: '#F59E0B' }}>25% vol, Sideways</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#9CA3AF' }}>European Session:</span>
                    <span style={{ fontWeight: '600', color: '#10B981' }}>30% vol, Bullish</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Control Tab */}
        {activeTab === 'ai' && (
          <div style={{ background: '#1F2937', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #374151' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 1rem 0' }}>🧠 AI Control Center</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              <div style={{ background: '#374151', padding: '1rem', borderRadius: '0.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 1rem 0' }}>Ollama AI Status</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#9CA3AF' }}>Model:</span>
                    <span style={{ fontWeight: '600' }}>gpt-oss:120b</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#9CA3AF' }}>Status:</span>
                    <span style={{ fontWeight: '600', color: '#10B981' }}>CONNECTED</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#9CA3AF' }}>Accuracy:</span>
                    <span style={{ fontWeight: '600' }}>85%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#9CA3AF' }}>Predictions Today:</span>
                    <span style={{ fontWeight: '600', color: '#8B5CF6' }}>120</span>
                  </div>
                </div>
              </div>

              <div style={{ background: '#374151', padding: '1rem', borderRadius: '0.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 1rem 0' }}>Autopilot Configuration</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', color: '#9CA3AF', marginBottom: '0.25rem' }}>
                      Risk Level
                    </label>
                    <select style={{ 
                      width: '100%',
                      background: '#4B5563', 
                      color: 'white', 
                      padding: '0.5rem', 
                      borderRadius: '0.25rem',
                      border: '1px solid #6B7280'
                    }}>
                      <option>Conservative (1-2x)</option>
                      <option>Risky (3-5x)</option>
                      <option>Turbo (6-10x)</option>
                    </select>
                  </div>
                  
                  <button style={{
                    width: '100%',
                    background: '#10B981',
                    color: 'white',
                    padding: '0.75rem',
                    borderRadius: '0.25rem',
                    border: 'none',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}>
                    START AUTOPILOT
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <div style={{ background: '#1F2937', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #374151' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 1rem 0' }}>💼 Portfolio Management</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: '#374151', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>$10,250.00</div>
                <div style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>Total Balance</div>
              </div>
              <div style={{ background: '#374151', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10B981' }}>+$3,096.25</div>
                <div style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>Total P&L</div>
              </div>
              <div style={{ background: '#374151', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3B82F6' }}>73.3%</div>
                <div style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>Win Rate</div>
              </div>
              <div style={{ background: '#374151', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8B5CF6' }}>3</div>
                <div style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>Active Positions</div>
              </div>
            </div>

            <div style={{ background: '#374151', padding: '1rem', borderRadius: '0.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 1rem 0' }}>Active Positions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { symbol: 'BTCUSDT', side: 'LONG', size: '0.1', pnl: '+$50.00', pnlPercent: '+1.11%' },
                  { symbol: 'ETHUSDT', side: 'SHORT', size: '1.0', pnl: '+$50.00', pnlPercent: '+1.67%' },
                  { symbol: 'ADAUSDT', side: 'LONG', size: '1000', pnl: '-$25.00', pnlPercent: '-2.40%' }
                ].map((position, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: '#4B5563',
                    borderRadius: '0.25rem'
                  }}>
                    <div>
                      <span style={{ fontWeight: '600' }}>{position.symbol}</span>
                      <span style={{ 
                        marginLeft: '0.5rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: position.side === 'LONG' ? '#10B981' : '#EF4444'
                      }}>
                        {position.side}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontWeight: '600',
                        color: position.pnl.startsWith('+') ? '#10B981' : '#EF4444'
                      }}>
                        {position.pnl}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                        {position.pnlPercent}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div style={{ background: '#1F2937', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #374151' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 1rem 0' }}>📋 System Logs</h2>
            
            <div style={{ 
              background: '#000000', 
              padding: '1rem', 
              borderRadius: '0.5rem',
              height: '400px',
              overflowY: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.875rem'
            }}>
              {logs.length === 0 ? (
                <div style={{ color: '#9CA3AF', textAlign: 'center', paddingTop: '2rem' }}>
                  Waiting for system logs...
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} style={{ 
                    marginBottom: '0.25rem',
                    color: log.level === 'WARNING' ? '#F59E0B' : '#10B981'
                  }}>
                    [{log.timestamp}] {log.level}: {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
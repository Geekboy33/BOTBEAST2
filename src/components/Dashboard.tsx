import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

interface BotModule {
  id: string;
  name: string;
  type: 'trading' | 'analysis' | 'ai' | 'risk';
  status: 'active' | 'inactive' | 'error';
  enabled: boolean;
  description: string;
  algorithm: string;
  performance: number;
  trades_today?: number;
  profit_today?: number;
  pairs_scanned?: number;
  opportunities_found?: number;
  predictions_today?: number;
  accuracy?: number;
  config: Record<string, any>;
  dependencies: string[];
  last_signal: string;
}

interface SystemMetrics {
  status: string;
  version: string;
  uptime: string;
  total_modules: number;
  active_modules: number;
  total_trades: number;
  total_pnl: number;
}

interface MarketData {
  [symbol: string]: {
    price: number;
    change: number;
    volume: number;
  };
}

export default function Dashboard() {
  const [modules, setModules] = useState<Record<string, BotModule>>({});
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    status: 'online',
    version: '2.0.0',
    uptime: '2h 15m',
    total_modules: 16,
    active_modules: 16,
    total_trades: 312,
    total_pnl: 3096.25
  });
  const [marketData, setMarketData] = useState<MarketData>({
    BTCUSDT: { price: 45230.50, change: 2.3, volume: 2500000 },
    ETHUSDT: { price: 3120.75, change: 1.8, volume: 1800000 },
    ADAUSDT: { price: 0.52, change: -0.5, volume: 800000 },
    SOLUSDT: { price: 98.45, change: 3.2, volume: 650000 },
    DOTUSDT: { price: 8.25, change: 1.1, volume: 450000 }
  });

  useEffect(() => {
    loadSystemData();
    const interval = setInterval(loadSystemData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemData = async () => {
    try {
      // Load system status
      const statusResponse = await fetch('/api/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setSystemMetrics(statusData);
      }

      // Load modules
      const modulesResponse = await fetch('/api/modules');
      if (modulesResponse.ok) {
        const modulesData = await modulesResponse.json();
        setModules(modulesData);
      }

      // Load market data
      const pricesResponse = await fetch('/api/prices');
      if (pricesResponse.ok) {
        const pricesData = await pricesResponse.json();
        setMarketData(pricesData);
      }
    } catch (error) {
      console.log('Using mock data - API not available');
      // Use mock data when API is not available
      setModules({
        scalper_engine: {
          id: 'scalper_engine',
          name: 'Scalper Engine',
          type: 'trading',
          status: 'active',
          enabled: true,
          description: 'Q-learning + Smart Money Concepts',
          algorithm: 'Deep Q-Network with risk-aware rewards',
          performance: 85.2,
          trades_today: 15,
          profit_today: 125.50,
          config: { learning_rate: 0.001, epsilon: 0.1 },
          dependencies: ['market_data', 'ai_controller'],
          last_signal: new Date().toISOString()
        },
        market_maker: {
          id: 'market_maker',
          name: 'Market Maker',
          type: 'trading',
          status: 'active',
          enabled: true,
          description: 'Órdenes límite alrededor del mid-price',
          algorithm: 'Adaptive market making with dynamic spreads',
          performance: 78.5,
          trades_today: 45,
          profit_today: 89.25,
          config: { base_spread: 0.001, volatility_multiplier: 1.5 },
          dependencies: ['order_book'],
          last_signal: new Date().toISOString()
        },
        arbitrage_engine: {
          id: 'arbitrage_engine',
          name: 'Arbitrage Engine',
          type: 'trading',
          status: 'active',
          enabled: true,
          description: 'Diferencias de precio entre exchanges',
          algorithm: 'Multi-exchange arbitrage detection',
          performance: 92.1,
          trades_today: 3,
          profit_today: 214.75,
          config: { min_spread: 0.001, max_execution_time: 5 },
          dependencies: ['multi_exchange'],
          last_signal: new Date().toISOString()
        },
        virtual_trader: {
          id: 'virtual_trader',
          name: 'Virtual Trader',
          type: 'trading',
          status: 'active',
          enabled: true,
          description: 'Simulador de paper trading',
          algorithm: 'Virtual position management with TP/SL',
          performance: 94.3,
          trades_today: 25,
          profit_today: 320.15,
          config: { initial_balance: 100000, sl_percent: 0.015 },
          dependencies: ['signal_generator'],
          last_signal: new Date().toISOString()
        },
        pair_scanner: {
          id: 'pair_scanner',
          name: 'Pair Scanner',
          type: 'trading',
          status: 'active',
          enabled: true,
          description: 'Escaneo automático de pares',
          algorithm: 'Multi-timeframe opportunity detection',
          performance: 89.4,
          pairs_scanned: 150,
          opportunities_found: 8,
          config: { scan_interval: 30, min_confidence: 0.6 },
          dependencies: ['exchange_manager'],
          last_signal: new Date().toISOString()
        },
        autopilot_engine: {
          id: 'autopilot_engine',
          name: 'Autopilot Engine',
          type: 'ai',
          status: 'active',
          enabled: true,
          description: 'Trading automático con IA',
          algorithm: 'AI-driven automated trading',
          performance: 87.6,
          trades_today: 45,
          profit_today: 890.30,
          config: { min_confidence: 0.7, max_position_size: 1000 },
          dependencies: ['all_analyzers', 'ai_controller'],
          last_signal: new Date().toISOString()
        },
        support_resistance: {
          id: 'support_resistance',
          name: 'Support/Resistance Analyzer',
          type: 'analysis',
          status: 'active',
          enabled: true,
          description: 'Detección automática de niveles clave',
          algorithm: 'Pivot point detection with fractal analysis',
          performance: 82.3,
          config: { min_touches: 2, tolerance: 0.001 },
          dependencies: ['market_data'],
          last_signal: new Date().toISOString()
        },
        ict_analysis: {
          id: 'ict_analysis',
          name: 'ICT Analysis',
          type: 'analysis',
          status: 'active',
          enabled: true,
          description: 'Order Blocks, FVG, Liquidity Sweeps',
          algorithm: 'Inner Circle Trader concepts',
          performance: 79.8,
          config: { min_block_strength: 0.3 },
          dependencies: ['market_data', 'volume_analysis'],
          last_signal: new Date().toISOString()
        },
        fibonacci_analysis: {
          id: 'fibonacci_analysis',
          name: 'Fibonacci Analysis',
          type: 'analysis',
          status: 'active',
          enabled: true,
          description: 'Retrocesos, extensiones, abanicos',
          algorithm: 'Multi-level Fibonacci analysis',
          performance: 76.4,
          config: { min_swing_size: 0.02 },
          dependencies: ['market_data'],
          last_signal: new Date().toISOString()
        },
        session_analysis: {
          id: 'session_analysis',
          name: 'Session Analysis',
          type: 'analysis',
          status: 'active',
          enabled: true,
          description: 'Análisis por sesiones de trading',
          algorithm: 'Asian/European/American session analysis',
          performance: 84.1,
          config: { overlap_multiplier: 1.5 },
          dependencies: ['market_data'],
          last_signal: new Date().toISOString()
        },
        spread_analysis: {
          id: 'spread_analysis',
          name: 'Spread Analysis',
          type: 'analysis',
          status: 'active',
          enabled: true,
          description: 'Análisis de spreads y liquidez',
          algorithm: 'Bid-ask spread optimization',
          performance: 81.6,
          config: { min_spread_threshold: 0.001 },
          dependencies: ['order_book'],
          last_signal: new Date().toISOString()
        },
        channel_analysis: {
          id: 'channel_analysis',
          name: 'Channel Analysis',
          type: 'analysis',
          status: 'active',
          enabled: true,
          description: 'Detección de canales de tendencia',
          algorithm: 'Trend channel detection',
          performance: 77.9,
          config: { min_touches: 3 },
          dependencies: ['market_data'],
          last_signal: new Date().toISOString()
        },
        news_filter: {
          id: 'news_filter',
          name: 'News Filter',
          type: 'analysis',
          status: 'active',
          enabled: true,
          description: 'Análisis fundamental con filtro de noticias',
          algorithm: 'NLP sentiment analysis',
          performance: 73.8,
          config: { min_relevance: 0.3 },
          dependencies: ['news_api'],
          last_signal: new Date().toISOString()
        },
        ai_controller: {
          id: 'ai_controller',
          name: 'AI Controller',
          type: 'ai',
          status: 'active',
          enabled: true,
          description: 'Red de políticas que elige la estrategia óptima',
          algorithm: 'Neural network policy selector',
          performance: 88.7,
          predictions_today: 120,
          accuracy: 0.85,
          config: { model: 'gpt-oss:120b', epsilon: 0.1 },
          dependencies: ['ollama_client'],
          last_signal: new Date().toISOString()
        },
        risk_manager: {
          id: 'risk_manager',
          name: 'Risk Manager',
          type: 'risk',
          status: 'active',
          enabled: true,
          description: 'Gestión de riesgo con 3 niveles',
          algorithm: 'Multi-level risk management',
          performance: 95.2,
          config: { current_level: 'conservative' },
          dependencies: ['portfolio_manager'],
          last_signal: new Date().toISOString()
        },
        opportunity_detector: {
          id: 'opportunity_detector',
          name: 'Opportunity Detector',
          type: 'ai',
          status: 'active',
          enabled: true,
          description: 'Detección automática de oportunidades',
          algorithm: 'AI-powered opportunity detection',
          performance: 83.7,
          trades_today: 12,
          profit_today: 320.15,
          config: { min_execution_score: 0.7 },
          dependencies: ['pair_scanner', 'ai_controller'],
          last_signal: new Date().toISOString()
        }
      });
    }
  };

  // Simulate real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prev => {
        const newData = { ...prev };
        Object.keys(newData).forEach(symbol => {
          const change = (Math.random() - 0.5) * 0.02; // ±1% change
          newData[symbol].price *= (1 + change);
          newData[symbol].change = change * 100;
        });
        return newData;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'inactive': return 'text-red-400';
      case 'error': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'inactive': return 'bg-red-600';
      case 'error': return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trading': return '💹';
      case 'analysis': return '📊';
      case 'ai': return '🤖';
      case 'risk': return '⚖️';
      default: return '📦';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'trading': return 'border-green-500';
      case 'analysis': return 'border-blue-500';
      case 'ai': return 'border-purple-500';
      case 'risk': return 'border-red-500';
      default: return 'border-gray-500';
    }
  };

  // Prepare chart data
  const modulePerformanceData = Object.values(modules).map(module => ({
    name: module.name.split(' ')[0],
    performance: module.performance,
    trades: module.trades_today || 0,
    profit: module.profit_today || 0
  }));

  const moduleTypeDistribution = Object.values(modules).reduce((acc, module) => {
    acc[module.type] = (acc[module.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(moduleTypeDistribution).map(([type, count]) => ({
    name: type,
    value: count,
    color: type === 'trading' ? '#10B981' : 
           type === 'analysis' ? '#3B82F6' :
           type === 'ai' ? '#8B5CF6' :
           type === 'risk' ? '#EF4444' : '#6B7280'
  }));

  const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#F59E0B'];

  return (
    <div className="space-y-8">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">System Status</h3>
              <p className="text-2xl font-bold text-green-400">
                {systemMetrics.status.toUpperCase()}
              </p>
            </div>
            <div className="w-4 h-4 rounded-full bg-green-600 animate-pulse"></div>
          </div>
          <div className="mt-4 text-sm text-gray-400">
            Uptime: {systemMetrics.uptime}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Active Modules</h3>
              <p className="text-2xl font-bold text-green-400">
                {systemMetrics.active_modules}/{systemMetrics.total_modules}
              </p>
            </div>
            <div className="text-3xl">🤖</div>
          </div>
          <div className="mt-4 text-sm text-gray-400">
            All systems operational
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Total Trades</h3>
              <p className="text-2xl font-bold text-blue-400">
                {systemMetrics.total_trades}
              </p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
          <div className="mt-4 text-sm text-gray-400">
            Trades executed today
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Total P&L</h3>
              <p className="text-2xl font-bold text-green-400">
                +${systemMetrics.total_pnl.toFixed(2)}
              </p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
          <div className="mt-4 text-sm text-gray-400">
            Profit generated today
          </div>
        </div>
      </div>

      {/* Market Prices */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">💰 Real-Time Market Prices</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(marketData).map(([symbol, data]) => (
            <div key={symbol} className="bg-gray-700 p-4 rounded-lg text-center">
              <div className="text-sm text-gray-400 mb-1">{symbol}</div>
              <div className="text-xl font-bold text-white">${data.price.toFixed(2)}</div>
              <div className={`text-sm ${data.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)}%
              </div>
              <div className="text-xs text-gray-500">
                Vol: ${(data.volume / 1000000).toFixed(1)}M
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module Performance Chart */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Module Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modulePerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="performance" fill="#FCD34D" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Module Type Distribution */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Module Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bot Modules Grid */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-6">🤖 Bot Modules - Complete BOTBEAST2 Implementation</h3>
        
        {/* Module Categories */}
        {Object.entries(
          Object.values(modules).reduce((acc, module) => {
            if (!acc[module.type]) acc[module.type] = [];
            acc[module.type].push(module);
            return acc;
          }, {} as Record<string, BotModule[]>)
        ).map(([type, typeModules]) => (
          <div key={type} className="mb-8">
            <h4 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <span>{getTypeIcon(type)}</span>
              <span className="capitalize">{type} Modules ({typeModules.length})</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {typeModules.map((module) => (
                <div 
                  key={module.id} 
                  className={`bg-gray-700 rounded-lg p-4 border-l-4 ${getTypeColor(module.type)} hover:bg-gray-600 transition-colors`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getTypeIcon(module.type)}</span>
                      <h4 className="font-semibold text-white">{module.name}</h4>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${getStatusBg(module.status)}`}></div>
                  </div>
                  
                  <p className="text-sm text-gray-300 mb-3">{module.description}</p>
                  <p className="text-xs text-gray-400 mb-3 italic">{module.algorithm}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Performance:</span>
                      <span className="font-semibold text-white">{module.performance}%</span>
                    </div>
                    
                    {module.trades_today !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Trades Today:</span>
                        <span className="font-semibold text-blue-400">{module.trades_today}</span>
                      </div>
                    )}
                    
                    {module.profit_today !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Profit Today:</span>
                        <span className={`font-semibold ${module.profit_today >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${module.profit_today.toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    {module.pairs_scanned !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Pairs Scanned:</span>
                        <span className="font-semibold text-purple-400">{module.pairs_scanned}</span>
                      </div>
                    )}
                    
                    {module.predictions_today !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Predictions:</span>
                        <span className="font-semibold text-cyan-400">{module.predictions_today}</span>
                      </div>
                    )}
                    
                    {module.accuracy !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Accuracy:</span>
                        <span className="font-semibold text-green-400">{(module.accuracy * 100).toFixed(1)}%</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-600">
                    <div className="text-xs text-gray-400 mb-2">
                      Dependencies: {module.dependencies.join(', ')}
                    </div>
                    <div className="text-xs text-gray-500">
                      Last Signal: {new Date(module.last_signal).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* System Summary */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">📈 System Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-400">
              {Object.values(modules).filter(m => m.type === 'trading').length}
            </div>
            <div className="text-sm text-gray-400">Trading Modules</div>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-400">
              {Object.values(modules).filter(m => m.type === 'analysis').length}
            </div>
            <div className="text-sm text-gray-400">Analysis Modules</div>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-400">
              {Object.values(modules).filter(m => m.type === 'ai').length}
            </div>
            <div className="text-sm text-gray-400">AI Modules</div>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-400">
              {Object.values(modules).filter(m => m.type === 'risk').length}
            </div>
            <div className="text-sm text-gray-400">Risk Modules</div>
          </div>
        </div>
      </div>
    </div>
  );
}
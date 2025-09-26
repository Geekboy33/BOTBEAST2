// src/components/AdvancedAnalytics.tsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, AreaChart, Area } from 'recharts';

interface TechnicalIndicator {
  name: string;
  value: number;
  signal: 'bullish' | 'bearish' | 'neutral';
  strength: number;
  description: string;
}

interface SupportResistance {
  level: number;
  type: 'support' | 'resistance';
  strength: number;
  touches: number;
  lastTouch: string;
}

interface ICTAnalysis {
  orderBlocks: Array<{
    high: number;
    low: number;
    type: 'bullish' | 'bearish';
    strength: number;
    timestamp: string;
  }>;
  fairValueGaps: Array<{
    high: number;
    low: number;
    type: 'bullish' | 'bearish';
    filled: boolean;
  }>;
  liquiditySweeps: Array<{
    level: number;
    type: 'buy' | 'sell';
    timestamp: string;
    volume: number;
  }>;
}

interface FibonacciLevel {
  level: number;
  percentage: number;
  type: 'retracement' | 'extension';
  price: number;
  touched: boolean;
}

interface SessionAnalysis {
  session: string;
  volume: number;
  volatility: number;
  range: number;
  dominance: number;
}

export default function AdvancedAnalytics() {
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [timeframe, setTimeframe] = useState('1h');
  const [technicalIndicators, setTechnicalIndicators] = useState<TechnicalIndicator[]>([]);
  const [supportResistance, setSupportResistance] = useState<SupportResistance[]>([]);
  const [ictAnalysis, setIctAnalysis] = useState<ICTAnalysis>({ orderBlocks: [], fairValueGaps: [], liquiditySweeps: [] });
  const [fibonacciLevels, setFibonacciLevels] = useState<FibonacciLevel[]>([]);
  const [sessionAnalysis, setSessionAnalysis] = useState<SessionAnalysis[]>([]);
  const [priceData, setPriceData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'technical' | 'ict' | 'fibonacci' | 'sessions'>('overview');

  useEffect(() => {
    loadAnalyticsData();
    const interval = setInterval(loadAnalyticsData, 10000);
    return () => clearInterval(interval);
  }, [selectedSymbol, timeframe]);

  const loadAnalyticsData = async () => {
    try {
      // Simular datos de análisis técnico
      const currentPrice = 43217.21; // Precio base BTC
      
      // Indicadores técnicos
      setTechnicalIndicators([
        { name: 'RSI (14)', value: 45.2, signal: 'neutral', strength: 0.6, description: 'Momentum oscillator showing neutral conditions' },
        { name: 'MACD', value: 0.0234, signal: 'bullish', strength: 0.7, description: 'Trend following indicator showing bullish divergence' },
        { name: 'BB Upper', value: currentPrice * 1.02, signal: 'neutral', strength: 0.5, description: 'Bollinger Bands upper level' },
        { name: 'BB Lower', value: currentPrice * 0.98, signal: 'neutral', strength: 0.5, description: 'Bollinger Bands lower level' },
        { name: 'EMA 20', value: currentPrice * 1.001, signal: 'bullish', strength: 0.8, description: '20-period Exponential Moving Average' },
        { name: 'EMA 50', value: currentPrice * 0.998, signal: 'bearish', strength: 0.6, description: '50-period Exponential Moving Average' },
        { name: 'Volume Profile', value: 85.3, signal: 'bullish', strength: 0.9, description: 'High volume at current levels' },
        { name: 'ATR', value: currentPrice * 0.015, signal: 'neutral', strength: 0.4, description: 'Average True Range for volatility' }
      ]);

      // Soporte y Resistencia
      setSupportResistance([
        { level: currentPrice * 1.05, type: 'resistance', strength: 0.8, touches: 3, lastTouch: '2 hours ago' },
        { level: currentPrice * 1.03, type: 'resistance', strength: 0.6, touches: 2, lastTouch: '6 hours ago' },
        { level: currentPrice * 0.97, type: 'support', strength: 0.9, touches: 4, lastTouch: '1 hour ago' },
        { level: currentPrice * 0.95, type: 'support', strength: 0.7, touches: 2, lastTouch: '8 hours ago' },
        { level: currentPrice * 0.93, type: 'support', strength: 0.8, touches: 3, lastTouch: '12 hours ago' }
      ]);

      // Análisis ICT
      setIctAnalysis({
        orderBlocks: [
          { high: currentPrice * 1.02, low: currentPrice * 0.99, type: 'bullish', strength: 0.8, timestamp: '4 hours ago' },
          { high: currentPrice * 1.01, low: currentPrice * 0.98, type: 'bearish', strength: 0.6, timestamp: '8 hours ago' }
        ],
        fairValueGaps: [
          { high: currentPrice * 1.008, low: currentPrice * 1.005, type: 'bullish', filled: false },
          { high: currentPrice * 0.995, low: currentPrice * 0.992, type: 'bearish', filled: true }
        ],
        liquiditySweeps: [
          { level: currentPrice * 1.05, type: 'sell', timestamp: '3 hours ago', volume: 1250000 },
          { level: currentPrice * 0.93, type: 'buy', timestamp: '12 hours ago', volume: 980000 }
        ]
      });

      // Niveles de Fibonacci
      setFibonacciLevels([
        { level: currentPrice * 1.236, percentage: 123.6, type: 'extension', price: currentPrice * 1.236, touched: false },
        { level: currentPrice * 1.0, percentage: 100.0, type: 'retracement', price: currentPrice, touched: true },
        { level: currentPrice * 0.786, percentage: 78.6, type: 'retracement', price: currentPrice * 0.786, touched: true },
        { level: currentPrice * 0.618, percentage: 61.8, type: 'retracement', price: currentPrice * 0.618, touched: false },
        { level: currentPrice * 0.382, percentage: 38.2, type: 'retracement', price: currentPrice * 0.382, touched: true },
        { level: currentPrice * 0.236, percentage: 23.6, type: 'retracement', price: currentPrice * 0.236, touched: false }
      ]);

      // Análisis de sesiones
      setSessionAnalysis([
        { session: 'Asian', volume: 1250000, volatility: 1.2, range: currentPrice * 0.02, dominance: 0.3 },
        { session: 'European', volume: 2100000, volatility: 1.8, range: currentPrice * 0.035, dominance: 0.5 },
        { session: 'American', volume: 2800000, volatility: 2.1, range: currentPrice * 0.04, dominance: 0.7 },
        { session: 'Overlap EU/US', volume: 1800000, volatility: 2.5, range: currentPrice * 0.045, dominance: 0.9 }
      ]);

      // Datos de precio para gráficos
      const priceDataArray = Array.from({ length: 100 }, (_, i) => {
        const time = new Date(Date.now() - (100 - i) * 60000); // Últimas 100 minutos
        const basePrice = currentPrice;
        const variation = Math.sin(i * 0.1) * 0.02 + Math.random() * 0.01;
        const price = basePrice * (1 + variation);
        
        return {
          time: time.toISOString(),
          price: price,
          volume: Math.random() * 1000000,
          rsi: 30 + Math.random() * 40,
          macd: (Math.random() - 0.5) * 0.1,
          bbUpper: price * 1.02,
          bbLower: price * 0.98
        };
      });
      
      setPriceData(priceDataArray);

    } catch (error) {
      console.error('Error loading analytics data:', error);
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'bullish': return 'text-green-400';
      case 'bearish': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 0.8) return 'bg-green-600';
    if (strength >= 0.6) return 'bg-yellow-600';
    if (strength >= 0.4) return 'bg-orange-600';
    return 'bg-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Advanced Analytics</h2>
        <div className="flex space-x-4">
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-2"
          >
            <option value="BTCUSDT">BTCUSDT</option>
            <option value="ETHUSDT">ETHUSDT</option>
            <option value="BNBUSDT">BNBUSDT</option>
            <option value="ADAUSDT">ADAUSDT</option>
            <option value="DOTUSDT">DOTUSDT</option>
          </select>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-2"
          >
            <option value="5m">5m</option>
            <option value="15m">15m</option>
            <option value="1h">1h</option>
            <option value="4h">4h</option>
            <option value="1d">1d</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'technical', label: 'Technical Analysis' },
          { key: 'ict', label: 'ICT Analysis' },
          { key: 'fibonacci', label: 'Fibonacci' },
          { key: 'sessions', label: 'Session Analysis' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-yellow-400 text-yellow-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Price Chart with Indicators */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Price Chart - {selectedSymbol}</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#9CA3AF"
                    tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                  />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="bbUpper" 
                    stroke="#6B7280" 
                    fill="none" 
                    strokeDasharray="5 5"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="bbLower" 
                    stroke="#6B7280" 
                    fill="none" 
                    strokeDasharray="5 5"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#FCD34D" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Key Metrics</h3>
            <div className="space-y-4">
              {technicalIndicators.slice(0, 6).map((indicator, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <div>
                    <div className="font-semibold">{indicator.name}</div>
                    <div className="text-sm text-gray-400">{indicator.description}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${getSignalColor(indicator.signal)}`}>
                      {indicator.value.toFixed(4)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        indicator.signal === 'bullish' ? 'bg-green-400' :
                        indicator.signal === 'bearish' ? 'bg-red-400' : 'bg-gray-400'
                      }`}></div>
                      <div className={`w-16 h-2 rounded-full bg-gray-600`}>
                        <div 
                          className={`h-2 rounded-full ${getStrengthColor(indicator.strength)}`}
                          style={{ width: `${indicator.strength * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Technical Analysis Tab */}
      {activeTab === 'technical' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Support & Resistance */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Support & Resistance</h3>
            <div className="space-y-3">
              {supportResistance.map((level, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      level.type === 'support' ? 'bg-green-400' : 'bg-red-400'
                    }`}></div>
                    <div>
                      <div className="font-semibold">${level.level.toFixed(2)}</div>
                      <div className="text-sm text-gray-400">
                        {level.type} • {level.touches} touches
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">{level.lastTouch}</div>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 rounded-full bg-gray-600">
                        <div 
                          className={`h-2 rounded-full ${getStrengthColor(level.strength)}`}
                          style={{ width: `${level.strength * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold">
                        {(level.strength * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Indicators */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Technical Indicators</h3>
            <div className="space-y-3">
              {technicalIndicators.map((indicator, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <div>
                    <div className="font-semibold">{indicator.name}</div>
                    <div className="text-sm text-gray-400">{indicator.description}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${getSignalColor(indicator.signal)}`}>
                      {indicator.value.toFixed(4)}
                    </div>
                    <div className="text-sm capitalize">{indicator.signal}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ICT Analysis Tab */}
      {activeTab === 'ict' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Blocks */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Order Blocks</h3>
            <div className="space-y-3">
              {ictAnalysis.orderBlocks.map((block, index) => (
                <div key={index} className="p-3 bg-gray-700 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      block.type === 'bullish' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {block.type.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-400">{block.timestamp}</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div>High: ${block.high.toFixed(2)}</div>
                    <div>Low: ${block.low.toFixed(2)}</div>
                    <div>Strength: {(block.strength * 100).toFixed(0)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fair Value Gaps */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Fair Value Gaps</h3>
            <div className="space-y-3">
              {ictAnalysis.fairValueGaps.map((gap, index) => (
                <div key={index} className="p-3 bg-gray-700 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      gap.type === 'bullish' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {gap.type.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      gap.filled ? 'bg-gray-600 text-white' : 'bg-yellow-600 text-white'
                    }`}>
                      {gap.filled ? 'FILLED' : 'ACTIVE'}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div>High: ${gap.high.toFixed(2)}</div>
                    <div>Low: ${gap.low.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Liquidity Sweeps */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Liquidity Sweeps</h3>
            <div className="space-y-3">
              {ictAnalysis.liquiditySweeps.map((sweep, index) => (
                <div key={index} className="p-3 bg-gray-700 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      sweep.type === 'buy' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {sweep.type.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-400">{sweep.timestamp}</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div>Level: ${sweep.level.toFixed(2)}</div>
                    <div>Volume: {(sweep.volume / 1000000).toFixed(2)}M</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fibonacci Tab */}
      {activeTab === 'fibonacci' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fibonacci Levels */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Fibonacci Levels</h3>
            <div className="space-y-3">
              {fibonacciLevels.map((level, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      level.touched ? 'bg-yellow-400' : 'bg-gray-400'
                    }`}></div>
                    <div>
                      <div className="font-semibold">{level.percentage}%</div>
                      <div className="text-sm text-gray-400">{level.type}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${level.price.toFixed(2)}</div>
                    <div className="text-sm text-gray-400">
                      {level.touched ? 'Touched' : 'Not touched'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fibonacci Chart */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Fibonacci Retracement</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#9CA3AF"
                    tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                  />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#FCD34D" 
                    strokeWidth={2}
                    dot={false}
                  />
                  {/* Fibonacci lines would be added here */}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Session Analysis Tab */}
      {activeTab === 'sessions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Session Metrics */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Trading Sessions</h3>
            <div className="space-y-4">
              {sessionAnalysis.map((session, index) => (
                <div key={index} className="p-4 bg-gray-700 rounded">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{session.session}</h4>
                    <span className="text-sm text-gray-400">
                      {(session.dominance * 100).toFixed(0)}% dominance
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Volume</div>
                      <div className="font-semibold">{(session.volume / 1000000).toFixed(2)}M</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Volatility</div>
                      <div className="font-semibold">{session.volatility.toFixed(2)}%</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Range</div>
                      <div className="font-semibold">${session.range.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Strength</div>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-2 rounded-full bg-gray-600">
                          <div 
                            className={`h-2 rounded-full ${getStrengthColor(session.dominance)}`}
                            style={{ width: `${session.dominance * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs">{(session.dominance * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Session Comparison Chart */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Session Comparison</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sessionAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="session" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="volume" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Volume"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="volatility" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    name="Volatility"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
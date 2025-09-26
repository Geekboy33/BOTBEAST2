import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface AnalyticsData {
  technical_indicators: {
    rsi: Record<string, number>;
    macd: Record<string, number>;
    bollinger: Record<string, any>;
  };
  support_resistance: Record<string, any>;
  fibonacci: Record<string, any>;
  ict_analysis: {
    order_blocks: number;
    fair_value_gaps: number;
    liquidity_sweeps: number;
    market_structure: string;
  };
  session_analysis: Record<string, any>;
}

export default function AnalyticsPanel() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [activeTab, setActiveTab] = useState<'technical' | 'ict' | 'fibonacci' | 'sessions'>('technical');

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.log('Using mock analytics data');
      // Mock analytics data
      setAnalytics({
        technical_indicators: {
          rsi: { BTCUSDT: 65.2, ETHUSDT: 58.7, ADAUSDT: 42.1 },
          macd: { BTCUSDT: 125.5, ETHUSDT: -45.2, ADAUSDT: 78.9 },
          bollinger: {
            BTCUSDT: { upper: 46500, middle: 45000, lower: 43500 }
          }
        },
        support_resistance: {
          BTCUSDT: {
            support: [44000, 43000, 42000],
            resistance: [46000, 47000, 48000]
          },
          ETHUSDT: {
            support: [2900, 2800, 2700],
            resistance: [3100, 3200, 3300]
          }
        },
        fibonacci: {
          BTCUSDT: {
            retracements: [0.236, 0.382, 0.5, 0.618, 0.786],
            extensions: [1.272, 1.414, 1.618]
          }
        },
        ict_analysis: {
          order_blocks: 5,
          fair_value_gaps: 3,
          liquidity_sweeps: 2,
          market_structure: 'bullish'
        },
        session_analysis: {
          american: { volume: 0.45, trend: 'bullish' },
          asian: { volume: 0.25, trend: 'sideways' },
          european: { volume: 0.30, trend: 'bullish' }
        }
      });
    }
  };

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">📈 Advanced Analytics</h2>
        <div className="flex space-x-4">
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
          >
            <option value="BTCUSDT">BTCUSDT</option>
            <option value="ETHUSDT">ETHUSDT</option>
            <option value="ADAUSDT">ADAUSDT</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {[
          { key: 'technical', label: 'Technical Indicators' },
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

      {/* Technical Indicators Tab */}
      {activeTab === 'technical' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Technical Indicators</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
                <span className="text-gray-300">RSI (14)</span>
                <span className="text-xl font-bold text-white">
                  {analytics.technical_indicators.rsi[selectedSymbol]}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
                <span className="text-gray-300">MACD</span>
                <span className="text-xl font-bold text-white">
                  {analytics.technical_indicators.macd[selectedSymbol]}
                </span>
              </div>
              {analytics.technical_indicators.bollinger[selectedSymbol] && (
                <div className="p-3 bg-gray-700 rounded">
                  <div className="text-gray-300 mb-2">Bollinger Bands</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Upper:</span>
                      <span className="text-white">${analytics.technical_indicators.bollinger[selectedSymbol].upper}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Middle:</span>
                      <span className="text-white">${analytics.technical_indicators.bollinger[selectedSymbol].middle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Lower:</span>
                      <span className="text-white">${analytics.technical_indicators.bollinger[selectedSymbol].lower}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Support & Resistance</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-md font-semibold text-green-400 mb-2">Support Levels</h4>
                <div className="space-y-2">
                  {analytics.support_resistance[selectedSymbol]?.support.map((level: number, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                      <span className="text-gray-300">S{index + 1}</span>
                      <span className="text-white font-semibold">${level.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-semibold text-red-400 mb-2">Resistance Levels</h4>
                <div className="space-y-2">
                  {analytics.support_resistance[selectedSymbol]?.resistance.map((level: number, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                      <span className="text-gray-300">R{index + 1}</span>
                      <span className="text-white font-semibold">${level.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ICT Analysis Tab */}
      {activeTab === 'ict' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Order Blocks</h3>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{analytics.ict_analysis.order_blocks}</div>
              <div className="text-sm text-gray-400">Detected</div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Fair Value Gaps</h3>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{analytics.ict_analysis.fair_value_gaps}</div>
              <div className="text-sm text-gray-400">Identified</div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Liquidity Sweeps</h3>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">{analytics.ict_analysis.liquidity_sweeps}</div>
              <div className="text-sm text-gray-400">Executed</div>
            </div>
          </div>
        </div>
      )}

      {/* Fibonacci Tab */}
      {activeTab === 'fibonacci' && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Fibonacci Analysis</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-semibold text-blue-400 mb-3">Retracements</h4>
              <div className="space-y-2">
                {analytics.fibonacci[selectedSymbol]?.retracements.map((level: number, index: number) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                    <span className="text-gray-300">{(level * 100).toFixed(1)}%</span>
                    <span className="text-white font-semibold">Active</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-md font-semibold text-yellow-400 mb-3">Extensions</h4>
              <div className="space-y-2">
                {analytics.fibonacci[selectedSymbol]?.extensions.map((level: number, index: number) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                    <span className="text-gray-300">{(level * 100).toFixed(1)}%</span>
                    <span className="text-white font-semibold">Target</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Trading Sessions Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(analytics.session_analysis).map(([session, data]: [string, any]) => (
              <div key={session} className="bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-3 capitalize">{session} Session</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Volume:</span>
                    <span className="text-white font-semibold">{(data.volume * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trend:</span>
                    <span className={`font-semibold capitalize ${
                      data.trend === 'bullish' ? 'text-green-400' :
                      data.trend === 'bearish' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {data.trend}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
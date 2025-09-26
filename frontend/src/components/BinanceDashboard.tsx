// src/components/BinanceDashboard.tsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import PortfolioManagement from './PortfolioManagement';
import AdvancedAnalytics from './AdvancedAnalytics';
import ExchangeManager from './ExchangeManager';
import SettingsPanel from './SettingsPanel';

interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

interface OrderBook {
  bids: [number, number][];
  asks: [number, number][];
}

interface TechnicalIndicator {
  name: string;
  value: number;
  signal: 'bullish' | 'bearish' | 'neutral';
}

interface AIConfig {
  autopilot: boolean;
  riskLevel: 'conservative' | 'risky' | 'turbo';
  leverage: number;
  maxPositions: number;
  stopLoss: number;
  takeProfit: number;
}

export default function BinanceDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'trading' | 'portfolio' | 'analytics' | 'exchanges' | 'ai' | 'settings'>('overview');
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBook>({ bids: [], asks: [] });
  const [technicalIndicators, setTechnicalIndicators] = useState<TechnicalIndicator[]>([]);
  const [aiConfig, setAIConfig] = useState<AIConfig>({
    autopilot: false,
    riskLevel: 'conservative',
    leverage: 1,
    maxPositions: 5,
    stopLoss: 2,
    takeProfit: 5
  });
  const [newOrder, setNewOrder] = useState({
    symbol: 'BTCUSDT',
    side: 'buy' as 'buy' | 'sell',
    type: 'limit' as 'market' | 'limit' | 'stop',
    quantity: 0,
    price: 0,
    stopPrice: 0
  });

  // Cargar datos del mercado
  useEffect(() => {
    const loadMarketData = async () => {
      try {
        const response = await fetch('/api/prices');
        const prices = await response.json();
        
        const marketDataArray: MarketData[] = Object.entries(prices).map(([symbol, price]) => ({
          symbol,
          price: price as number,
          change24h: (Math.random() - 0.5) * 1000,
          changePercent24h: (Math.random() - 0.5) * 10,
          volume24h: Math.random() * 1000000,
          high24h: (price as number) * (1 + Math.random() * 0.05),
          low24h: (price as number) * (1 - Math.random() * 0.05)
        }));
        
        setMarketData(marketDataArray);
        
        // Simular order book
        const currentPrice = prices[selectedSymbol] as number;
        const bids: [number, number][] = [];
        const asks: [number, number][] = [];
        
        for (let i = 0; i < 10; i++) {
          bids.push([currentPrice - (i + 1) * 10, Math.random() * 100]);
          asks.push([currentPrice + (i + 1) * 10, Math.random() * 100]);
        }
        
        setOrderBook({ bids, asks });
        
        // Simular indicadores técnicos
        setTechnicalIndicators([
          { name: 'RSI', value: 45.2, signal: 'neutral' },
          { name: 'MACD', value: 0.0234, signal: 'bullish' },
          { name: 'BB Upper', value: currentPrice * 1.02, signal: 'neutral' },
          { name: 'BB Lower', value: currentPrice * 0.98, signal: 'neutral' },
          { name: 'Support', value: currentPrice * 0.95, signal: 'bullish' },
          { name: 'Resistance', value: currentPrice * 1.05, signal: 'bearish' }
        ]);
      } catch (error) {
        console.error('Error loading market data:', error);
      }
    };

    loadMarketData();
    const interval = setInterval(loadMarketData, 5000);
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const createOrder = async () => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
      
      if (response.ok) {
        setNewOrder({
          symbol: selectedSymbol,
          side: 'buy',
          type: 'limit',
          quantity: 0,
          price: 0,
          stopPrice: 0
        });
      }
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const toggleAutopilot = async () => {
    const newConfig = { ...aiConfig, autopilot: !aiConfig.autopilot };
    setAIConfig(newConfig);
    
    try {
      await fetch('/api/bot/' + (newConfig.autopilot ? 'start' : 'stop'), {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error toggling autopilot:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-yellow-400">GROK-BEAST</h1>
            <div className="text-sm text-gray-400">Advanced Trading Platform</div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${aiConfig.autopilot ? 'bg-green-400' : 'bg-gray-400'}`}></div>
              <span className="text-sm">{aiConfig.autopilot ? 'AUTOPILOT ON' : 'MANUAL'}</span>
            </div>
            
            <button
              onClick={toggleAutopilot}
              className={`px-4 py-2 rounded font-semibold ${
                aiConfig.autopilot 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {aiConfig.autopilot ? 'STOP AI' : 'START AI'}
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 border-r border-gray-700 min-h-screen">
          <nav className="p-4">
            <div className="space-y-2">
              {[
            { key: 'overview', label: 'Overview', icon: '📊' },
            { key: 'trading', label: 'Trading', icon: '💹' },
            { key: 'portfolio', label: 'Portfolio', icon: '💼' },
            { key: 'analytics', label: 'Analytics', icon: '📈' },
            { key: 'exchanges', label: 'Exchanges', icon: '🔄' },
            { key: 'ai', label: 'AI Control', icon: '🤖' },
            { key: 'settings', label: 'Settings', icon: '⚙️' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-left transition-colors ${
                    activeTab === tab.key
                      ? 'bg-yellow-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Market Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {marketData.slice(0, 4).map(market => (
                  <div key={market.symbol} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">{market.symbol}</h3>
                      <span className={`text-sm ${market.changePercent24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {market.changePercent24h >= 0 ? '+' : ''}{market.changePercent24h.toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-2xl font-bold">${market.price.toFixed(2)}</div>
                    <div className="text-sm text-gray-400">
                      Vol: ${(market.volume24h / 1000).toFixed(0)}K
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold mb-4">Portfolio Performance</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Balance:</span>
                      <span className="font-semibold">$10,250.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">24h P&L:</span>
                      <span className="text-green-400 font-semibold">+$125.50 (+1.24%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Active Positions:</span>
                      <span className="font-semibold">3</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold mb-4">AI Status</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={`font-semibold ${aiConfig.autopilot ? 'text-green-400' : 'text-gray-400'}`}>
                        {aiConfig.autopilot ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Risk Level:</span>
                      <span className="font-semibold capitalize">{aiConfig.riskLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Leverage:</span>
                      <span className="font-semibold">{aiConfig.leverage}x</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold mb-4">Trading Activity</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Orders Today:</span>
                      <span className="font-semibold">15</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Win Rate:</span>
                      <span className="text-green-400 font-semibold">73.3%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Avg Trade:</span>
                      <span className="font-semibold">$8.35</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Chart */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Price Chart - {selectedSymbol}</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={Array.from({ length: 50 }, (_, i) => ({
                      time: i,
                      price: marketData.find(m => m.symbol === selectedSymbol)?.price || 0 + Math.sin(i * 0.1) * 100
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="time" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                      <Line type="monotone" dataKey="price" stroke="#FCD34D" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Trading Tab */}
          {activeTab === 'trading' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Order Form */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Place Order</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Symbol</label>
                    <select
                      value={newOrder.symbol}
                      onChange={(e) => setNewOrder({...newOrder, symbol: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                      aria-label="Select trading symbol"
                    >
                      {marketData.map(market => (
                        <option key={market.symbol} value={market.symbol}>{market.symbol}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setNewOrder({...newOrder, side: 'buy'})}
                      className={`py-2 px-4 rounded font-semibold ${
                        newOrder.side === 'buy' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      BUY
                    </button>
                    <button
                      onClick={() => setNewOrder({...newOrder, side: 'sell'})}
                      className={`py-2 px-4 rounded font-semibold ${
                        newOrder.side === 'sell' 
                          ? 'bg-red-600 text-white' 
                          : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      SELL
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Order Type</label>
                    <select
                      value={newOrder.type}
                      onChange={(e) => setNewOrder({...newOrder, type: e.target.value as any})}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                      aria-label="Select order type"
                    >
                      <option value="market">Market</option>
                      <option value="limit">Limit</option>
                      <option value="stop">Stop</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Quantity</label>
                    <input
                      type="number"
                      step="0.001"
                      value={newOrder.quantity}
                      onChange={(e) => setNewOrder({...newOrder, quantity: parseFloat(e.target.value)})}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                      placeholder="Enter quantity"
                      aria-label="Trading quantity"
                    />
                  </div>

                  {newOrder.type !== 'market' && (
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newOrder.price}
                        onChange={(e) => setNewOrder({...newOrder, price: parseFloat(e.target.value)})}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                        placeholder="Enter price"
                        aria-label="Order price"
                      />
                    </div>
                  )}

                  <button
                    onClick={createOrder}
                    className={`w-full py-3 rounded font-semibold ${
                      newOrder.side === 'buy' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {newOrder.side.toUpperCase()} {newOrder.symbol}
                  </button>
                </div>
              </div>

              {/* Order Book */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Order Book - {selectedSymbol}</h3>
                <div className="space-y-2">
                  <div className="text-sm text-gray-400 grid grid-cols-3 gap-4">
                    <span>Price</span>
                    <span>Amount</span>
                    <span>Total</span>
                  </div>
                  
                  {/* Asks */}
                  {orderBook.asks.slice().reverse().map(([price, amount], i) => (
                    <div key={i} className="grid grid-cols-3 gap-4 text-sm">
                      <span className="text-red-400">${price.toFixed(2)}</span>
                      <span>{amount.toFixed(4)}</span>
                      <span>${(price * amount).toFixed(2)}</span>
                    </div>
                  ))}
                  
                  {/* Current Price */}
                  <div className="border-t border-b border-gray-600 py-2 my-2">
                    <div className="text-center font-semibold text-yellow-400">
                      ${marketData.find(m => m.symbol === selectedSymbol)?.price.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  
                  {/* Bids */}
                  {orderBook.bids.map(([price, amount], i) => (
                    <div key={i} className="grid grid-cols-3 gap-4 text-sm">
                      <span className="text-green-400">${price.toFixed(2)}</span>
                      <span>{amount.toFixed(4)}</span>
                      <span>${(price * amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Indicators */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Technical Analysis</h3>
                <div className="space-y-3">
                  {technicalIndicators.map((indicator, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-gray-300">{indicator.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{indicator.value.toFixed(4)}</span>
                        <div className={`w-2 h-2 rounded-full ${
                          indicator.signal === 'bullish' ? 'bg-green-400' :
                          indicator.signal === 'bearish' ? 'bg-red-400' : 'bg-gray-400'
                        }`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Portfolio Tab */}
          {activeTab === 'portfolio' && (
            <PortfolioManagement />
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <AdvancedAnalytics />
          )}

          {/* Exchanges Tab */}
          {activeTab === 'exchanges' && (
            <ExchangeManager />
          )}

          {/* AI Control Tab */}
          {activeTab === 'ai' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">AI Configuration</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Autopilot Mode</span>
                    <button
                      onClick={() => setAIConfig({...aiConfig, autopilot: !aiConfig.autopilot})}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        aiConfig.autopilot ? 'bg-green-600' : 'bg-gray-600'
                      }`}
                      aria-label={`Toggle autopilot mode ${aiConfig.autopilot ? 'off' : 'on'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        aiConfig.autopilot ? 'translate-x-6' : 'translate-x-0.5'
                      }`}></div>
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Risk Level</label>
                    <select
                      value={aiConfig.riskLevel}
                      onChange={(e) => setAIConfig({...aiConfig, riskLevel: e.target.value as any})}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                      aria-label="Select AI risk level"
                    >
                      <option value="conservative">Conservative (1-2x)</option>
                      <option value="risky">Risky (3-5x)</option>
                      <option value="turbo">Turbo (6-10x)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Max Leverage</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={aiConfig.leverage}
                      onChange={(e) => setAIConfig({...aiConfig, leverage: parseInt(e.target.value)})}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                      placeholder="Enter max leverage"
                      aria-label="Maximum leverage"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Max Positions</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={aiConfig.maxPositions}
                      onChange={(e) => setAIConfig({...aiConfig, maxPositions: parseInt(e.target.value)})}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                      placeholder="Enter max positions"
                      aria-label="Maximum positions"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Stop Loss (%)</label>
                    <input
                      type="number"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={aiConfig.stopLoss}
                      onChange={(e) => setAIConfig({...aiConfig, stopLoss: parseFloat(e.target.value)})}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                      placeholder="Enter stop loss percentage"
                      aria-label="Stop loss percentage"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Take Profit (%)</label>
                    <input
                      type="number"
                      min="0.1"
                      max="20"
                      step="0.1"
                      value={aiConfig.takeProfit}
                      onChange={(e) => setAIConfig({...aiConfig, takeProfit: parseFloat(e.target.value)})}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                      placeholder="Enter take profit percentage"
                      aria-label="Take profit percentage"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">AI Performance</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-700 rounded">
                      <div className="text-2xl font-bold text-green-400">73.3%</div>
                      <div className="text-sm text-gray-400">Win Rate</div>
                    </div>
                    <div className="text-center p-4 bg-gray-700 rounded">
                      <div className="text-2xl font-bold text-blue-400">1.85</div>
                      <div className="text-sm text-gray-400">Profit Factor</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-700 rounded">
                      <div className="text-2xl font-bold text-yellow-400">2.3%</div>
                      <div className="text-sm text-gray-400">Max Drawdown</div>
                    </div>
                    <div className="text-center p-4 bg-gray-700 rounded">
                      <div className="text-2xl font-bold text-purple-400">156</div>
                      <div className="text-sm text-gray-400">Total Trades</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-gray-400">Recent AI Decisions:</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>BTCUSDT - BUY Signal</span>
                        <span className="text-green-400">+2.3%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ETHUSDT - HOLD</span>
                        <span className="text-gray-400">0.0%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ADAUSDT - SELL Signal</span>
                        <span className="text-red-400">-1.2%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <SettingsPanel />
          )}
        </main>
      </div>
    </div>
  );
}

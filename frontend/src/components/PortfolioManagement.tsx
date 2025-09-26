// src/components/PortfolioManagement.tsx
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';

interface Position {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  margin: number;
  leverage: number;
  stopLoss?: number;
  takeProfit?: number;
  openedAt: string;
}

interface PortfolioMetrics {
  totalBalance: number;
  availableBalance: number;
  totalPnl: number;
  totalPnlPercent: number;
  dailyPnl: number;
  dailyPnlPercent: number;
  winRate: number;
  totalTrades: number;
  maxDrawdown: number;
  sharpeRatio: number;
  profitFactor: number;
}

interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: string;
  pnl: number;
  fees: number;
  type: string;
}

export default function PortfolioManagement() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [metrics, setMetrics] = useState<PortfolioMetrics>({
    totalBalance: 10000,
    availableBalance: 7500,
    totalPnl: 2500,
    totalPnlPercent: 25,
    dailyPnl: 125,
    dailyPnlPercent: 1.25,
    winRate: 73.3,
    totalTrades: 156,
    maxDrawdown: 2.3,
    sharpeRatio: 1.85,
    profitFactor: 1.65
  });
  const [trades, setTrades] = useState<Trade[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'positions' | 'history' | 'analytics'>('overview');

  useEffect(() => {
    loadPortfolioData();
    const interval = setInterval(loadPortfolioData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadPortfolioData = async () => {
    try {
      // Cargar portfolio
      const portfolioResponse = await fetch('/api/portfolio');
      const portfolioData = await portfolioResponse.json();
      
      // Cargar trades
      const tradesResponse = await fetch('/api/trades');
      const tradesData = await tradesResponse.json();
      
      // Simular posiciones basadas en trades
      const positionsArray: Position[] = [];
      const tradeMap = new Map<string, any>();
      
      tradesData.forEach((trade: Trade) => {
        const key = trade.symbol;
        if (!tradeMap.has(key)) {
          tradeMap.set(key, {
            symbol: trade.symbol,
            totalQuantity: 0,
            totalCost: 0,
            totalPnl: 0,
            trades: []
          });
        }
        
        const pos = tradeMap.get(key);
        pos.trades.push(trade);
        
        if (trade.side === 'buy') {
          pos.totalQuantity += trade.quantity;
          pos.totalCost += trade.price * trade.quantity;
        } else {
          pos.totalQuantity -= trade.quantity;
          pos.totalCost -= trade.price * trade.quantity;
        }
        pos.totalPnl += trade.pnl;
      });
      
      // Convertir a posiciones
      tradeMap.forEach((pos, symbol) => {
        if (pos.totalQuantity !== 0) {
          const avgPrice = pos.totalCost / Math.abs(pos.totalQuantity);
          const currentPrice = Math.random() * avgPrice * 1.1 + avgPrice * 0.9; // Simular precio actual
          const pnl = (currentPrice - avgPrice) * pos.totalQuantity;
          const pnlPercent = (pnl / Math.abs(pos.totalCost)) * 100;
          
          positionsArray.push({
            symbol,
            side: pos.totalQuantity > 0 ? 'long' : 'short',
            size: Math.abs(pos.totalQuantity),
            entryPrice: avgPrice,
            currentPrice,
            pnl,
            pnlPercent,
            margin: Math.abs(pos.totalCost) * 0.1, // 10% margin
            leverage: 1,
            stopLoss: avgPrice * (pos.totalQuantity > 0 ? 0.95 : 1.05),
            takeProfit: avgPrice * (pos.totalQuantity > 0 ? 1.05 : 0.95),
            openedAt: pos.trades[0]?.timestamp || new Date().toISOString()
          });
        }
      });
      
      setPositions(positionsArray);
      setTrades(tradesData);
      
    } catch (error) {
      console.error('Error loading portfolio data:', error);
    }
  };

  const closePosition = async (symbol: string) => {
    try {
      // Simular cierre de posición
      setPositions(prev => prev.filter(p => p.symbol !== symbol));
    } catch (error) {
      console.error('Error closing position:', error);
    }
  };

  const updateStopLoss = async (symbol: string, newStopLoss: number) => {
    try {
      setPositions(prev => prev.map(p => 
        p.symbol === symbol ? { ...p, stopLoss: newStopLoss } : p
      ));
    } catch (error) {
      console.error('Error updating stop loss:', error);
    }
  };

  // Datos para gráficos
  const pieData = positions.map(pos => ({
    name: pos.symbol,
    value: Math.abs(pos.size * pos.currentPrice),
    pnl: pos.pnl
  }));

  const performanceData = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    balance: metrics.totalBalance + (Math.random() - 0.5) * 1000,
    pnl: (Math.random() - 0.5) * 200
  }));

  const tradesData = trades.slice(-20).map((trade, i) => ({
    trade: i + 1,
    pnl: trade.pnl,
    cumulative: trades.slice(0, trades.indexOf(trade) + 1).reduce((sum, t) => sum + t.pnl, 0)
  }));

  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Portfolio Management</h2>
        <div className="flex space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-400">Total Balance</div>
            <div className="text-xl font-bold">${metrics.totalBalance.toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">24h P&L</div>
            <div className={`text-xl font-bold ${metrics.dailyPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {metrics.dailyPnl >= 0 ? '+' : ''}${metrics.dailyPnl.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'positions', label: 'Positions' },
          { key: 'history', label: 'History' },
          { key: 'analytics', label: 'Analytics' }
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
          {/* Portfolio Distribution */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Portfolio Distribution</h3>
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
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
            <div className="mt-4 space-y-2">
              {pieData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span>{item.name}</span>
                  </div>
                  <span className="font-semibold">${item.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-700 rounded">
                <div className="text-2xl font-bold text-green-400">{metrics.winRate}%</div>
                <div className="text-sm text-gray-400">Win Rate</div>
              </div>
              <div className="text-center p-4 bg-gray-700 rounded">
                <div className="text-2xl font-bold text-blue-400">{metrics.profitFactor}</div>
                <div className="text-sm text-gray-400">Profit Factor</div>
              </div>
              <div className="text-center p-4 bg-gray-700 rounded">
                <div className="text-2xl font-bold text-yellow-400">{metrics.sharpeRatio}</div>
                <div className="text-sm text-gray-400">Sharpe Ratio</div>
              </div>
              <div className="text-center p-4 bg-gray-700 rounded">
                <div className="text-2xl font-bold text-red-400">{metrics.maxDrawdown}%</div>
                <div className="text-sm text-gray-400">Max Drawdown</div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-semibold mb-3">Balance History</h4>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="day" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                    <Line type="monotone" dataKey="balance" stroke="#FCD34D" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Positions Tab */}
      {activeTab === 'positions' && (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3">Symbol</th>
                  <th className="text-left py-3">Side</th>
                  <th className="text-left py-3">Size</th>
                  <th className="text-left py-3">Entry Price</th>
                  <th className="text-left py-3">Current Price</th>
                  <th className="text-left py-3">P&L</th>
                  <th className="text-left py-3">P&L %</th>
                  <th className="text-left py-3">Stop Loss</th>
                  <th className="text-left py-3">Take Profit</th>
                  <th className="text-left py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {positions.map(position => (
                  <tr key={position.symbol} className="border-b border-gray-700">
                    <td className="py-3 font-semibold">{position.symbol}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        position.side === 'long' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-red-600 text-white'
                      }`}>
                        {position.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3">{position.size.toFixed(6)}</td>
                    <td className="py-3">${position.entryPrice.toFixed(2)}</td>
                    <td className="py-3">${position.currentPrice.toFixed(2)}</td>
                    <td className={`py-3 font-semibold ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${position.pnl.toFixed(2)}
                    </td>
                    <td className={`py-3 font-semibold ${position.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                    </td>
                    <td className="py-3">
                      <input
                        type="number"
                        value={position.stopLoss || 0}
                        onChange={(e) => updateStopLoss(position.symbol, parseFloat(e.target.value))}
                        className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="py-3">
                      <input
                        type="number"
                        value={position.takeProfit || 0}
                        className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => closePosition(position.symbol)}
                        className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm font-semibold"
                      >
                        Close
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3">Time</th>
                  <th className="text-left py-3">Symbol</th>
                  <th className="text-left py-3">Side</th>
                  <th className="text-left py-3">Quantity</th>
                  <th className="text-left py-3">Price</th>
                  <th className="text-left py-3">P&L</th>
                  <th className="text-left py-3">Fees</th>
                  <th className="text-left py-3">Type</th>
                </tr>
              </thead>
              <tbody>
                {trades.map(trade => (
                  <tr key={trade.id} className="border-b border-gray-700">
                    <td className="py-3 text-sm">
                      {new Date(trade.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 font-semibold">{trade.symbol}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        trade.side === 'buy' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-red-600 text-white'
                      }`}>
                        {trade.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3">{trade.quantity.toFixed(6)}</td>
                    <td className="py-3">${trade.price.toFixed(2)}</td>
                    <td className={`py-3 font-semibold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${trade.pnl.toFixed(2)}
                    </td>
                    <td className="py-3">${trade.fees.toFixed(4)}</td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-gray-600 rounded text-xs">
                        {trade.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Trade Performance</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tradesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="trade" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                  <Line type="monotone" dataKey="pnl" stroke="#EF4444" strokeWidth={2} name="P&L per Trade" />
                  <Line type="monotone" dataKey="cumulative" stroke="#10B981" strokeWidth={2} name="Cumulative P&L" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Daily P&L Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                  <Bar dataKey="pnl" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface Portfolio {
  total_balance: number;
  available_balance: number;
  positions: Array<{
    symbol: string;
    side: string;
    size: number;
    entry_price: number;
    current_price: number;
    pnl: number;
    pnl_percent: number;
  }>;
  daily_pnl: number;
  total_pnl: number;
}

interface PortfolioMetrics {
  total_balance: number;
  daily_pnl: number;
  total_pnl: number;
  win_rate: number;
  sharpe_ratio: number;
  max_drawdown: number;
  total_trades: number;
  active_positions: number;
}

export default function PortfolioManager() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);

  useEffect(() => {
    loadPortfolioData();
    const interval = setInterval(loadPortfolioData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadPortfolioData = async () => {
    try {
      const [portfolioRes, metricsRes] = await Promise.all([
        fetch('/api/portfolio'),
        fetch('/api/portfolio/metrics')
      ]);

      if (portfolioRes.ok) {
        const portfolioData = await portfolioRes.json();
        setPortfolio(portfolioData);
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      }
    } catch (error) {
      console.log('Using mock portfolio data');
      setPortfolio({
        total_balance: 10000,
        available_balance: 7500,
        positions: [
          {
            symbol: 'BTCUSDT',
            side: 'long',
            size: 0.1,
            entry_price: 45000,
            current_price: 45230.50,
            pnl: 23.05,
            pnl_percent: 0.51
          },
          {
            symbol: 'ETHUSDT',
            side: 'short',
            size: 1.0,
            entry_price: 3000,
            current_price: 2950,
            pnl: 50.0,
            pnl_percent: 1.67
          }
        ],
        daily_pnl: 125.50,
        total_pnl: 2500.75
      });

      setMetrics({
        total_balance: 10000,
        daily_pnl: 125.50,
        total_pnl: 2500.75,
        win_rate: 0.73,
        sharpe_ratio: 1.85,
        max_drawdown: 0.08,
        total_trades: 156,
        active_positions: 2
      });
    }
  };

  if (!portfolio || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  const pieData = portfolio.positions.map((pos, index) => ({
    name: pos.symbol,
    value: Math.abs(pos.size * pos.current_price),
    color: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]
  }));

  const performanceData = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    balance: portfolio.total_balance + (Math.random() - 0.5) * 1000,
    pnl: (Math.random() - 0.5) * 200
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">💼 Portfolio Manager</h2>
        <div className="flex space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-400">Total Balance</div>
            <div className="text-xl font-bold text-white">${portfolio.total_balance.toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Daily P&L</div>
            <div className={`text-xl font-bold ${portfolio.daily_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {portfolio.daily_pnl >= 0 ? '+' : ''}${portfolio.daily_pnl.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white">Total Balance</h3>
          <div className="text-2xl font-bold text-white">${portfolio.total_balance.toLocaleString()}</div>
          <div className="text-sm text-gray-400">Available: ${portfolio.available_balance.toLocaleString()}</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white">Total P&L</h3>
          <div className={`text-2xl font-bold ${portfolio.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {portfolio.total_pnl >= 0 ? '+' : ''}${portfolio.total_pnl.toFixed(2)}
          </div>
          <div className="text-sm text-gray-400">
            {((portfolio.total_pnl / portfolio.total_balance) * 100).toFixed(2)}% return
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white">Win Rate</h3>
          <div className="text-2xl font-bold text-blue-400">{(metrics.win_rate * 100).toFixed(1)}%</div>
          <div className="text-sm text-gray-400">{metrics.total_trades} total trades</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white">Active Positions</h3>
          <div className="text-2xl font-bold text-purple-400">{portfolio.positions.length}</div>
          <div className="text-sm text-gray-400">Open positions</div>
        </div>
      </div>

      {/* Portfolio Distribution and Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Portfolio Distribution</h3>
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

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Performance History</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Line type="monotone" dataKey="balance" stroke="#FCD34D" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Active Positions */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Active Positions</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2 text-gray-400">Symbol</th>
                <th className="text-left py-2 text-gray-400">Side</th>
                <th className="text-left py-2 text-gray-400">Size</th>
                <th className="text-left py-2 text-gray-400">Entry Price</th>
                <th className="text-left py-2 text-gray-400">Current Price</th>
                <th className="text-left py-2 text-gray-400">P&L</th>
                <th className="text-left py-2 text-gray-400">P&L %</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.positions.map((position, index) => (
                <tr key={index} className="border-b border-gray-700">
                  <td className="py-2 font-semibold text-white">{position.symbol}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      position.side === 'long' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {position.side.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 text-white">{position.size}</td>
                  <td className="py-2 text-white">${position.entry_price.toFixed(2)}</td>
                  <td className="py-2 text-white">${position.current_price.toFixed(2)}</td>
                  <td className={`py-2 font-semibold ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${position.pnl.toFixed(2)}
                  </td>
                  <td className={`py-2 font-semibold ${position.pnl_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {position.pnl_percent >= 0 ? '+' : ''}{position.pnl_percent.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
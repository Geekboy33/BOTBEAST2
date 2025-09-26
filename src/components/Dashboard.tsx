import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

interface SystemStatus {
  status: string;
  version: string;
  uptime: string;
  modules: Record<string, any>;
  active_orders: number;
  total_trades: number;
  daily_pnl: number;
}

interface ModuleData {
  id: string;
  name: string;
  type: string;
  status: string;
  enabled: boolean;
  performance: number;
  trades_today?: number;
  profit_today?: number;
}

const Dashboard: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [modules, setModules] = useState<Record<string, ModuleData>>({});
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [portfolio, setPortfolio] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load system status
      const statusRes = await fetch('/api/status');
      const statusData = await statusRes.json();
      setSystemStatus(statusData);

      // Load modules
      const modulesRes = await fetch('/api/modules');
      const modulesData = await modulesRes.json();
      setModules(modulesData);

      // Load prices
      const pricesRes = await fetch('/api/prices');
      const pricesData = await pricesRes.json();
      setPrices(pricesData);

      // Load portfolio
      const portfolioRes = await fetch('/api/portfolio');
      const portfolioData = await portfolioRes.json();
      setPortfolio(portfolioData);

      // Load metrics
      const metricsRes = await fetch('/api/metrics');
      const metricsData = await metricsRes.json();
      setMetrics(metricsData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'active': return 'text-green-400';
      case 'offline':
      case 'inactive': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'online':
      case 'active': return 'bg-green-600';
      case 'offline':
      case 'inactive': return 'bg-red-600';
      case 'warning': return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
  };

  const getModuleTypeIcon = (type: string) => {
    switch (type) {
      case 'trading': return '💹';
      case 'analysis': return '📊';
      case 'ai': return '🤖';
      case 'risk': return '⚖️';
      default: return '📦';
    }
  };

  // Prepare chart data
  const modulePerformanceData = Object.values(modules).map(module => ({
    name: module.name.split(' ')[0],
    performance: module.performance,
    trades: module.trades_today || 0,
    profit: module.profit_today || 0
  }));

  const priceChartData = Object.entries(prices).map(([symbol, price]) => ({
    symbol,
    price,
    change: (Math.random() - 0.5) * 10
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

  const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#F59E0B', '#06B6D4'];

  if (!systemStatus) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">System Status</h3>
              <p className={`text-2xl font-bold ${getStatusColor(systemStatus.status)}`}>
                {systemStatus.status.toUpperCase()}
              </p>
            </div>
            <div className={`w-4 h-4 rounded-full ${getStatusBg(systemStatus.status)}`}></div>
          </div>
          <div className="mt-4 text-sm text-gray-400">
            Uptime: {systemStatus.uptime}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Active Modules</h3>
              <p className="text-2xl font-bold text-green-400">
                {Object.values(modules).filter(m => m.enabled).length}/{Object.keys(modules).length}
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
              <h3 className="text-lg font-semibold text-white">Daily P&L</h3>
              <p className="text-2xl font-bold text-green-400">
                +${systemStatus.daily_pnl.toFixed(2)}
              </p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
          <div className="mt-4 text-sm text-gray-400">
            {systemStatus.total_trades} trades today
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Active Orders</h3>
              <p className="text-2xl font-bold text-blue-400">
                {systemStatus.active_orders}
              </p>
            </div>
            <div className="text-3xl">📋</div>
          </div>
          <div className="mt-4 text-sm text-gray-400">
            Orders pending execution
          </div>
        </div>
      </div>

      {/* Current Prices */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">💰 Current Market Prices</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(prices).map(([symbol, price]) => {
            const change = (Math.random() - 0.5) * 10;
            return (
              <div key={symbol} className="bg-gray-700 p-4 rounded-lg text-center">
                <div className="text-sm text-gray-400 mb-1">{symbol}</div>
                <div className="text-xl font-bold text-white">${price.toFixed(2)}</div>
                <div className={`text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module Performance */}
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

        {/* Module Distribution */}
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

      {/* Active Modules Grid */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">🤖 Active Bot Modules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.values(modules).map((module) => (
            <div key={module.id} className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getModuleTypeIcon(module.type)}</span>
                  <h4 className="font-semibold text-white text-sm">{module.name}</h4>
                </div>
                <div className={`w-3 h-3 rounded-full ${getStatusBg(module.status)}`}></div>
              </div>
              
              <p className="text-xs text-gray-400 mb-3">{module.description}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Performance:</span>
                  <span className="font-semibold text-white">{module.performance}%</span>
                </div>
                {module.trades_today !== undefined && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Trades Today:</span>
                    <span className="font-semibold text-blue-400">{module.trades_today}</span>
                  </div>
                )}
                {module.profit_today !== undefined && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Profit Today:</span>
                    <span className={`font-semibold ${module.profit_today >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${module.profit_today.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      {portfolio && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">💼 Portfolio Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-700 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-white">${portfolio.total_balance.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Total Balance</div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-400">+${portfolio.daily_pnl.toFixed(2)}</div>
              <div className="text-sm text-gray-400">Daily P&L</div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-400">{(portfolio.win_rate * 100).toFixed(1)}%</div>
              <div className="text-sm text-gray-400">Win Rate</div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-400">{portfolio.positions.length}</div>
              <div className="text-sm text-gray-400">Active Positions</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
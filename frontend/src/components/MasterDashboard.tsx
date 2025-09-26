// src/components/MasterDashboard.tsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import APIConfiguration from './APIConfiguration';

interface SystemStatus {
  name: string;
  status: 'online' | 'offline' | 'error' | 'warning';
  uptime: string;
  performance: number;
  lastUpdate: string;
  description: string;
}

interface BotModule {
  id: string;
  name: string;
  type: 'trading' | 'analysis' | 'ai' | 'exchange' | 'risk' | 'news';
  status: 'active' | 'inactive' | 'error';
  enabled: boolean;
  description: string;
  performance: number;
  lastSignal: string;
  trades: number;
  pnl: number;
}

interface APIConfig {
  exchange: string;
  apiKey: string;
  secret: string;
  sandbox: boolean;
  enabled: boolean;
  balance: number;
  lastUpdate: string;
}

export default function MasterDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'trading' | 'analysis' | 'ai' | 'exchanges' | 'config' | 'logs'>('overview');
  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>([]);
  const [botModules, setBotModules] = useState<BotModule[]>([]);
  const [apiConfigs, setApiConfigs] = useState<APIConfig[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  useEffect(() => {
    loadSystemData();
    const interval = setInterval(loadSystemData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemData = async () => {
    try {
      // Simular datos del sistema
      setSystemStatus([
        {
          name: 'Scalper Engine',
          status: 'online',
          uptime: '2h 15m',
          performance: 85.2,
          lastUpdate: new Date().toISOString(),
          description: 'Q-learning + Smart-Money Concepts'
        },
        {
          name: 'Market Maker',
          status: 'online',
          uptime: '2h 15m',
          performance: 78.5,
          lastUpdate: new Date().toISOString(),
          description: 'Órdenes límite alrededor del mid-price'
        },
        {
          name: 'Arbitrage Engine',
          status: 'online',
          uptime: '2h 15m',
          performance: 92.1,
          lastUpdate: new Date().toISOString(),
          description: 'Diferencias de precio entre exchanges'
        },
        {
          name: 'AI Controller',
          status: 'online',
          uptime: '2h 15m',
          performance: 88.7,
          lastUpdate: new Date().toISOString(),
          description: 'Red de políticas que elige la estrategia'
        },
        {
          name: 'Virtual Trader',
          status: 'online',
          uptime: '2h 15m',
          performance: 94.3,
          lastUpdate: new Date().toISOString(),
          description: 'Simulador de paper trading'
        },
        {
          name: 'Ollama AI',
          status: 'online',
          uptime: '2h 15m',
          performance: 91.8,
          lastUpdate: new Date().toISOString(),
          description: 'IA local GPT OSS 120B Turbo'
        }
      ]);

      setBotModules([
        {
          id: 'scalper',
          name: 'Scalper Engine',
          type: 'trading',
          status: 'active',
          enabled: true,
          description: 'Q-learning + Smart-Money Concepts',
          performance: 85.2,
          lastSignal: '2 min ago',
          trades: 156,
          pnl: 1250.50
        },
        {
          id: 'maker',
          name: 'Market Maker',
          type: 'trading',
          status: 'active',
          enabled: true,
          description: 'Órdenes límite alrededor del mid-price',
          performance: 78.5,
          lastSignal: '5 min ago',
          trades: 89,
          pnl: 850.25
        },
        {
          id: 'arbitrage',
          name: 'Arbitrage Engine',
          type: 'trading',
          status: 'active',
          enabled: true,
          description: 'Diferencias de precio entre exchanges',
          performance: 92.1,
          lastSignal: '1 min ago',
          trades: 67,
          pnl: 2100.75
        },
        {
          id: 'ai_controller',
          name: 'AI Controller',
          type: 'ai',
          status: 'active',
          enabled: true,
          description: 'Red de políticas que elige la estrategia',
          performance: 88.7,
          lastSignal: '3 min ago',
          trades: 0,
          pnl: 0
        },
        {
          id: 'support_resistance',
          name: 'Support/Resistance',
          type: 'analysis',
          status: 'active',
          enabled: true,
          description: 'Detección automática de niveles clave',
          performance: 82.3,
          lastSignal: '4 min ago',
          trades: 0,
          pnl: 0
        },
        {
          id: 'ict_analysis',
          name: 'ICT Analysis',
          type: 'analysis',
          status: 'active',
          enabled: true,
          description: 'Order Blocks, FVG, Liquidity Sweeps',
          performance: 79.8,
          lastSignal: '6 min ago',
          trades: 0,
          pnl: 0
        },
        {
          id: 'fibonacci',
          name: 'Fibonacci Analysis',
          type: 'analysis',
          status: 'active',
          enabled: true,
          description: 'Retrocesos, extensiones, abanicos',
          performance: 76.4,
          lastSignal: '8 min ago',
          trades: 0,
          pnl: 0
        },
        {
          id: 'session_analysis',
          name: 'Session Analysis',
          type: 'analysis',
          status: 'active',
          enabled: true,
          description: 'Análisis por sesiones de trading',
          performance: 84.1,
          lastSignal: '7 min ago',
          trades: 0,
          pnl: 0
        },
        {
          id: 'spread_analysis',
          name: 'Spread Analysis',
          type: 'analysis',
          status: 'active',
          enabled: true,
          description: 'Análisis de spreads y liquidez',
          performance: 81.6,
          lastSignal: '9 min ago',
          trades: 0,
          pnl: 0
        },
        {
          id: 'channel_analysis',
          name: 'Channel Analysis',
          type: 'analysis',
          status: 'active',
          enabled: true,
          description: 'Detección de canales de tendencia',
          performance: 77.9,
          lastSignal: '10 min ago',
          trades: 0,
          pnl: 0
        },
        {
          id: 'pair_scanner',
          name: 'Pair Scanner',
          type: 'trading',
          status: 'active',
          enabled: true,
          description: 'Scanner de oportunidades rápidas',
          performance: 89.4,
          lastSignal: '30 sec ago',
          trades: 23,
          pnl: 450.80
        },
        {
          id: 'risk_manager',
          name: 'Risk Manager',
          type: 'risk',
          status: 'active',
          enabled: true,
          description: 'Gestión de riesgo con 3 niveles',
          performance: 95.2,
          lastSignal: '1 min ago',
          trades: 0,
          pnl: 0
        },
        {
          id: 'news_filter',
          name: 'News Filter',
          type: 'news',
          status: 'active',
          enabled: true,
          description: 'Filtro de noticias para análisis fundamental',
          performance: 73.8,
          lastSignal: '15 min ago',
          trades: 0,
          pnl: 0
        },
        {
          id: 'autopilot',
          name: 'Autopilot Engine',
          type: 'ai',
          status: 'active',
          enabled: true,
          description: 'Trading automático con IA',
          performance: 87.6,
          lastSignal: '2 min ago',
          trades: 45,
          pnl: 890.30
        },
        {
          id: 'opportunity_detector',
          name: 'Opportunity Detector',
          type: 'ai',
          status: 'active',
          enabled: true,
          description: 'Detección automática de oportunidades',
          performance: 83.7,
          lastSignal: '4 min ago',
          trades: 12,
          pnl: 320.15
        }
      ]);

      setApiConfigs([
        {
          exchange: 'Binance',
          apiKey: '***',
          secret: '***',
          sandbox: false,
          enabled: true,
          balance: 12500.50,
          lastUpdate: new Date().toISOString()
        },
        {
          exchange: 'Kraken',
          apiKey: '***',
          secret: '***',
          sandbox: false,
          enabled: true,
          balance: 8750.25,
          lastUpdate: new Date().toISOString()
        },
        {
          exchange: 'KuCoin',
          apiKey: '***',
          secret: '***',
          sandbox: true,
          enabled: true,
          balance: 5600.75,
          lastUpdate: new Date().toISOString()
        },
        {
          exchange: 'OKX',
          apiKey: '',
          secret: '',
          sandbox: true,
          enabled: false,
          balance: 0,
          lastUpdate: new Date().toISOString()
        }
      ]);

    } catch (error) {
      console.error('Error loading system data:', error);
    }
  };

  const toggleModule = async (moduleId: string) => {
    try {
      setBotModules(prev => prev.map(module => 
        module.id === moduleId 
          ? { ...module, enabled: !module.enabled, status: module.enabled ? 'inactive' : 'active' }
          : module
      ));
    } catch (error) {
      console.error('Error toggling module:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'active': return 'text-green-400';
      case 'offline':
      case 'inactive': return 'text-red-400';
      case 'error': return 'text-red-400';
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
      case 'error': return 'bg-red-600';
      case 'warning': return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trading': return '💹';
      case 'analysis': return '📊';
      case 'ai': return '🤖';
      case 'exchange': return '🔄';
      case 'risk': return '⚖️';
      case 'news': return '📰';
      default: return '📦';
    }
  };

  // Datos para gráficos
  const performanceData = systemStatus.map(system => ({
    name: system.name.split(' ')[0],
    performance: system.performance,
    uptime: system.uptime
  }));

  const moduleTypes = botModules.reduce((acc, module) => {
    acc[module.type] = (acc[module.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(moduleTypes).map(([type, count]) => ({
    name: type,
    value: count,
    color: type === 'trading' ? '#10B981' : 
           type === 'analysis' ? '#3B82F6' :
           type === 'ai' ? '#8B5CF6' :
           type === 'exchange' ? '#F59E0B' :
           type === 'risk' ? '#EF4444' : '#6B7280'
  }));

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-yellow-400">GROK-BEAST</h1>
            <div className="text-sm text-gray-400">Advanced Trading System</div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="text-sm">SYSTEM ONLINE</span>
            </div>
            
            <button
              onClick={() => setIsConfigOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold"
            >
              API Configuration
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
                { key: 'overview', label: 'System Overview', icon: '📊' },
                { key: 'modules', label: 'Bot Modules', icon: '🤖' },
                { key: 'trading', label: 'Trading Systems', icon: '💹' },
                { key: 'analysis', label: 'Technical Analysis', icon: '📈' },
                { key: 'ai', label: 'AI Systems', icon: '🧠' },
                { key: 'exchanges', label: 'Exchanges', icon: '🔄' },
                { key: 'config', label: 'Configuration', icon: '⚙️' },
                { key: 'logs', label: 'System Logs', icon: '📋' }
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
              {/* System Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {systemStatus.map((system, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{system.name}</h3>
                      <div className={`w-3 h-3 rounded-full ${getStatusBg(system.status)}`}></div>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{system.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Performance:</span>
                        <span className="font-semibold">{system.performance}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Uptime:</span>
                        <span className="font-semibold">{system.uptime}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Performance Chart */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">System Performance</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                      <Bar dataKey="performance" fill="#FCD34D" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Module Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold mb-4">Module Distribution</h3>
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
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold mb-4">System Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
                      <span className="text-gray-300">Total Modules</span>
                      <span className="text-xl font-bold text-yellow-400">{botModules.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
                      <span className="text-gray-300">Active Modules</span>
                      <span className="text-xl font-bold text-green-400">
                        {botModules.filter(m => m.enabled).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
                      <span className="text-gray-300">Total Trades</span>
                      <span className="text-xl font-bold text-blue-400">
                        {botModules.reduce((sum, m) => sum + m.trades, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
                      <span className="text-gray-300">Total P&L</span>
                      <span className="text-xl font-bold text-green-400">
                        ${botModules.reduce((sum, m) => sum + m.pnl, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modules Tab */}
          {activeTab === 'modules' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Bot Modules Management</h2>
                <div className="flex space-x-2">
                  <button className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold">
                    Enable All
                  </button>
                  <button className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold">
                    Disable All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {botModules.map((module) => (
                  <div key={module.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getTypeIcon(module.type)}</span>
                        <h3 className="font-semibold">{module.name}</h3>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${getStatusBg(module.status)}`}></div>
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-3">{module.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Performance:</span>
                        <span className="font-semibold">{module.performance}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Last Signal:</span>
                        <span className="font-semibold">{module.lastSignal}</span>
                      </div>
                      {module.trades > 0 && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Trades:</span>
                            <span className="font-semibold">{module.trades}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">P&L:</span>
                            <span className={`font-semibold ${module.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              ${module.pnl.toFixed(2)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleModule(module.id)}
                        className={`flex-1 px-3 py-2 rounded font-semibold text-sm ${
                          module.enabled
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {module.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded font-semibold text-sm">
                        Config
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trading Systems Tab */}
          {activeTab === 'trading' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Trading Systems</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {botModules.filter(m => m.type === 'trading').map((module) => (
                  <div key={module.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">{module.name}</h3>
                      <div className={`w-3 h-3 rounded-full ${getStatusBg(module.status)}`}></div>
                    </div>
                    
                    <p className="text-gray-400 mb-4">{module.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-700 rounded">
                        <div className="text-2xl font-bold text-yellow-400">{module.performance}%</div>
                        <div className="text-sm text-gray-400">Performance</div>
                      </div>
                      <div className="text-center p-3 bg-gray-700 rounded">
                        <div className="text-2xl font-bold text-blue-400">{module.trades}</div>
                        <div className="text-sm text-gray-400">Trades</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">P&L:</span>
                      <span className={`font-bold ${module.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${module.pnl.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technical Analysis Tab */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Technical Analysis Systems</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {botModules.filter(m => m.type === 'analysis').map((module) => (
                  <div key={module.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">{module.name}</h3>
                      <div className={`w-3 h-3 rounded-full ${getStatusBg(module.status)}`}></div>
                    </div>
                    
                    <p className="text-gray-400 mb-4">{module.description}</p>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Performance:</span>
                      <span className="font-bold text-yellow-400">{module.performance}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Systems Tab */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">AI Systems</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {botModules.filter(m => m.type === 'ai').map((module) => (
                  <div key={module.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">{module.name}</h3>
                      <div className={`w-3 h-3 rounded-full ${getStatusBg(module.status)}`}></div>
                    </div>
                    
                    <p className="text-gray-400 mb-4">{module.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-700 rounded">
                        <div className="text-2xl font-bold text-purple-400">{module.performance}%</div>
                        <div className="text-sm text-gray-400">Accuracy</div>
                      </div>
                      <div className="text-center p-3 bg-gray-700 rounded">
                        <div className="text-2xl font-bold text-green-400">{module.trades}</div>
                        <div className="text-sm text-gray-400">AI Trades</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">AI P&L:</span>
                      <span className={`font-bold ${module.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${module.pnl.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exchanges Tab */}
          {activeTab === 'exchanges' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Exchange Configuration</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {apiConfigs.map((config, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">{config.exchange}</h3>
                      <div className={`w-3 h-3 rounded-full ${config.enabled ? 'bg-green-600' : 'bg-red-600'}`}></div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">API Key:</span>
                        <span className="font-mono text-sm">{config.apiKey}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Secret:</span>
                        <span className="font-mono text-sm">{config.secret}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Sandbox:</span>
                        <span className={`font-semibold ${config.sandbox ? 'text-yellow-400' : 'text-green-400'}`}>
                          {config.sandbox ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Balance:</span>
                        <span className="font-bold text-green-400">${config.balance.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Configuration Tab */}
          {activeTab === 'config' && (
            <APIConfiguration />
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">System Logs</h2>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="h-96 overflow-y-auto bg-black rounded p-4 font-mono text-sm">
                  <div className="text-green-400">[2024-01-15 10:30:15] INFO: System started successfully</div>
                  <div className="text-blue-400">[2024-01-15 10:30:16] INFO: All modules initialized</div>
                  <div className="text-yellow-400">[2024-01-15 10:30:17] WARNING: KuCoin API rate limit approaching</div>
                  <div className="text-green-400">[2024-01-15 10:30:18] INFO: Scalper Engine: Signal generated for BTCUSDT</div>
                  <div className="text-green-400">[2024-01-15 10:30:19] INFO: AI Controller: Action selected: BUY</div>
                  <div className="text-green-400">[2024-01-15 10:30:20] INFO: Virtual Trader: Position opened LONG BTCUSDT</div>
                  <div className="text-blue-400">[2024-01-15 10:30:21] INFO: Risk Manager: Position size calculated: 0.1 BTC</div>
                  <div className="text-green-400">[2024-01-15 10:30:22] INFO: Arbitrage Engine: Opportunity detected on KuCoin</div>
                  <div className="text-purple-400">[2024-01-15 10:30:23] INFO: Ollama AI: Analysis completed, confidence: 87%</div>
                  <div className="text-green-400">[2024-01-15 10:30:24] INFO: Pair Scanner: 3 new opportunities found</div>
                  <div className="text-blue-400">[2024-01-15 10:30:25] INFO: News Filter: 2 relevant news items processed</div>
                  <div className="text-green-400">[2024-01-15 10:30:26] INFO: System running optimally</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* API Configuration Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">API Configuration</h3>
              <button
                onClick={() => setIsConfigOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Exchange</label>
                <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2" aria-label="Select Exchange">
                  <option value="binance">Binance</option>
                  <option value="kraken">Kraken</option>
                  <option value="kucoin">KuCoin</option>
                  <option value="okx">OKX</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">API Key</label>
                <input
                  type="text"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  placeholder="Enter API Key"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Secret Key</label>
                <input
                  type="password"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  placeholder="Enter Secret Key"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" aria-label="Use Sandbox/Testnet" />
                <label className="text-sm text-gray-400">Use Sandbox/Testnet</label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsConfigOpen(false)}
                  className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

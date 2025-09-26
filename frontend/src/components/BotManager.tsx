// src/components/BotManager.tsx
import React, { useState, useEffect } from 'react';
import { 
  PlayIcon, 
  StopIcon, 
  CogIcon, 
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

interface BotInstance {
  id: string;
  name: string;
  type: 'scalper' | 'maker' | 'arbitrage' | 'ai_controller';
  status: 'running' | 'stopped' | 'error' | 'paused';
  mode: 'demo' | 'real';
  uptime: number;
  trades: number;
  pnl: number;
  winRate: number;
  lastActivity: Date;
  config: {
    maxPositionSize: number;
    riskPerTrade: number;
    stopLoss: number;
    takeProfit: number;
    spread: number;
    minSpread: number;
  };
  metrics: {
    totalVolume: number;
    avgTradeSize: number;
    maxDrawdown: number;
    sharpeRatio: number;
    profitFactor: number;
  };
  exchanges: string[];
  aiServices: string[];
}

interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  timestamp: Date;
  pnl: number;
  status: 'open' | 'closed' | 'cancelled';
}

export default function BotManager() {
  const [bots, setBots] = useState<BotInstance[]>([
    {
      id: 'scalper_1',
      name: 'Scalper Q-Learning',
      type: 'scalper',
      status: 'running',
      mode: 'demo',
      uptime: 3600,
      trades: 15,
      pnl: 125.50,
      winRate: 0.68,
      lastActivity: new Date(),
      config: {
        maxPositionSize: 1000,
        riskPerTrade: 0.02,
        stopLoss: 0.05,
        takeProfit: 0.10,
        spread: 0.001,
        minSpread: 0.0005
      },
      metrics: {
        totalVolume: 15000,
        avgTradeSize: 1000,
        maxDrawdown: 0.08,
        sharpeRatio: 1.85,
        profitFactor: 2.1
      },
      exchanges: ['binance', 'coinbase'],
      aiServices: ['openai']
    },
    {
      id: 'maker_1',
      name: 'Market Maker Pro',
      type: 'maker',
      status: 'stopped',
      mode: 'demo',
      uptime: 0,
      trades: 8,
      pnl: 45.20,
      winRate: 0.75,
      lastActivity: new Date(Date.now() - 300000),
      config: {
        maxPositionSize: 2000,
        riskPerTrade: 0.01,
        stopLoss: 0.03,
        takeProfit: 0.08,
        spread: 0.001,
        minSpread: 0.0008
      },
      metrics: {
        totalVolume: 8000,
        avgTradeSize: 1000,
        maxDrawdown: 0.05,
        sharpeRatio: 2.1,
        profitFactor: 1.8
      },
      exchanges: ['binance'],
      aiServices: []
    },
    {
      id: 'arbitrage_1',
      name: 'Arbitrage Hunter',
      type: 'arbitrage',
      status: 'running',
      mode: 'real',
      uptime: 7200,
      trades: 3,
      pnl: 89.75,
      winRate: 1.0,
      lastActivity: new Date(),
      config: {
        maxPositionSize: 5000,
        riskPerTrade: 0.005,
        stopLoss: 0.02,
        takeProfit: 0.15,
        spread: 0.002,
        minSpread: 0.001
      },
      metrics: {
        totalVolume: 25000,
        avgTradeSize: 8333,
        maxDrawdown: 0.02,
        sharpeRatio: 3.2,
        profitFactor: 4.5
      },
      exchanges: ['binance', 'coinbase', 'kraken'],
      aiServices: ['anthropic']
    },
    {
      id: 'ai_controller_1',
      name: 'AI Master Controller',
      type: 'ai_controller',
      status: 'paused',
      mode: 'demo',
      uptime: 1800,
      trades: 12,
      pnl: -15.30,
      winRate: 0.58,
      lastActivity: new Date(Date.now() - 600000),
      config: {
        maxPositionSize: 3000,
        riskPerTrade: 0.015,
        stopLoss: 0.04,
        takeProfit: 0.12,
        spread: 0.0015,
        minSpread: 0.001
      },
      metrics: {
        totalVolume: 12000,
        avgTradeSize: 1000,
        maxDrawdown: 0.12,
        sharpeRatio: 0.8,
        profitFactor: 0.9
      },
      exchanges: ['binance', 'coinbase'],
      aiServices: ['openai', 'anthropic', 'cohere']
    }
  ]);

  const [selectedBot, setSelectedBot] = useState<BotInstance | null>(null);
  const [botTrades, setBotTrades] = useState<Trade[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'trades' | 'config' | 'metrics'>('overview');

  useEffect(() => {
    // Simular trades en tiempo real
    const interval = setInterval(() => {
      setBotTrades(prev => {
        const newTrade: Trade = {
          id: Math.random().toString(36).substr(2, 9),
          symbol: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT'][Math.floor(Math.random() * 3)],
          side: Math.random() > 0.5 ? 'buy' : 'sell',
          amount: Math.random() * 0.1 + 0.01,
          price: 45000 + Math.random() * 5000,
          timestamp: new Date(),
          pnl: (Math.random() - 0.5) * 100,
          status: 'open'
        };
        return [newTrade, ...prev.slice(0, 9)];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const toggleBot = (botId: string) => {
    setBots(prev => prev.map(bot => {
      if (bot.id === botId) {
        const newStatus = bot.status === 'running' ? 'stopped' : 
                         bot.status === 'stopped' ? 'running' : 
                         bot.status === 'paused' ? 'running' : 'stopped';
        return { ...bot, status: newStatus };
      }
      return bot;
    }));
  };

  const pauseBot = (botId: string) => {
    setBots(prev => prev.map(bot => 
      bot.id === botId ? { ...bot, status: 'paused' } : bot
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
      case 'stopped':
        return <XCircleIcon className="w-5 h-5 text-gray-400" />;
      case 'paused':
        return <ClockIcon className="w-5 h-5 text-yellow-400" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />;
      default:
        return <XCircleIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-green-400';
      case 'stopped':
        return 'text-gray-400';
      case 'paused':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'scalper':
        return 'bg-green-600';
      case 'maker':
        return 'bg-blue-600';
      case 'arbitrage':
        return 'bg-yellow-600';
      case 'ai_controller':
        return 'bg-purple-600';
      default:
        return 'bg-gray-600';
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <CogIcon className="w-6 h-6 text-blue-400" />
            Gestión de Bots
          </h2>
          <p className="text-gray-400 mt-1">
            Controla y monitorea todos tus bots de trading
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            <span className="text-green-400 font-medium">
              {bots.filter(b => b.status === 'running').length}
            </span> ejecutándose
          </div>
          <div className="text-sm text-gray-400">
            <span className="text-yellow-400 font-medium">
              {bots.filter(b => b.status === 'paused').length}
            </span> pausados
          </div>
        </div>
      </div>

      {/* Bot Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {bots.map((bot) => (
          <div 
            key={bot.id} 
            className={`bg-gray-800 rounded-lg p-6 border cursor-pointer transition-all hover:border-blue-500 ${
              selectedBot?.id === bot.id ? 'border-blue-500' : 'border-gray-700'
            }`}
            onClick={() => setSelectedBot(bot)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(bot.type)}`}>
                  <span className="text-white font-bold text-sm">
                    {bot.type.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{bot.name}</h3>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(bot.status)}
                    <span className={`text-sm ${getStatusColor(bot.status)}`}>
                      {bot.status === 'running' ? 'Ejecutándose' : 
                       bot.status === 'paused' ? 'Pausado' : 
                       bot.status === 'error' ? 'Error' : 'Detenido'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBot(bot.id);
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    bot.status === 'running'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {bot.status === 'running' ? (
                    <StopIcon className="w-4 h-4" />
                  ) : (
                    <PlayIcon className="w-4 h-4" />
                  )}
                </button>
                {bot.status === 'running' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      pauseBot(bot.id);
                    }}
                    className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                  >
                    <ClockIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">PnL</span>
                <span className={`font-semibold ${bot.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {bot.pnl >= 0 ? '+' : ''}{formatCurrency(bot.pnl)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Trades</span>
                <span className="text-white font-medium">{bot.trades}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Win Rate</span>
                <span className="text-white font-medium">{(bot.winRate * 100).toFixed(1)}%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Uptime</span>
                <span className="text-white font-medium">{formatUptime(bot.uptime)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Modo</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  bot.mode === 'real' 
                    ? 'bg-red-600/20 text-red-400' 
                    : 'bg-blue-600/20 text-blue-400'
                }`}>
                  {bot.mode === 'real' ? 'Real' : 'Demo'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bot Detail Panel */}
      {selectedBot && (
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getTypeColor(selectedBot.type)}`}>
                  <span className="text-white font-bold text-lg">
                    {selectedBot.type.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{selectedBot.name}</h3>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedBot.status)}
                    <span className={`text-sm ${getStatusColor(selectedBot.status)}`}>
                      {selectedBot.status === 'running' ? 'Ejecutándose' : 
                       selectedBot.status === 'paused' ? 'Pausado' : 
                       selectedBot.status === 'error' ? 'Error' : 'Detenido'}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className={`text-sm ${
                      selectedBot.mode === 'real' ? 'text-red-400' : 'text-blue-400'
                    }`}>
                      {selectedBot.mode === 'real' ? 'Modo Real' : 'Modo Demo'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleBot(selectedBot.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedBot.status === 'running'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {selectedBot.status === 'running' ? (
                    <>
                      <StopIcon className="w-4 h-4 inline mr-2" />
                      Parar Bot
                    </>
                  ) : (
                    <>
                      <PlayIcon className="w-4 h-4 inline mr-2" />
                      Iniciar Bot
                    </>
                  )}
                </button>
                {selectedBot.status === 'running' && (
                  <button
                    onClick={() => pauseBot(selectedBot.id)}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <ClockIcon className="w-4 h-4 inline mr-2" />
                    Pausar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-700">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Resumen', icon: ChartBarIcon },
                { id: 'trades', label: 'Trades', icon: CurrencyDollarIcon },
                { id: 'config', label: 'Configuración', icon: CogIcon },
                { id: 'metrics', label: 'Métricas', icon: ArrowTrendingUpIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-400">PnL Total</div>
                    <div className={`text-2xl font-bold ${selectedBot.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedBot.pnl >= 0 ? '+' : ''}{formatCurrency(selectedBot.pnl)}
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-400">Trades Ejecutados</div>
                    <div className="text-2xl font-bold text-white">{selectedBot.trades}</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-400">Win Rate</div>
                    <div className="text-2xl font-bold text-white">{(selectedBot.winRate * 100).toFixed(1)}%</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-400">Tiempo Activo</div>
                    <div className="text-2xl font-bold text-white">{formatUptime(selectedBot.uptime)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Exchanges Conectados</h4>
                    <div className="space-y-2">
                      {selectedBot.exchanges.map((exchange) => (
                        <div key={exchange} className="flex items-center justify-between">
                          <span className="text-gray-300 capitalize">{exchange}</span>
                          <CheckCircleIcon className="w-4 h-4 text-green-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3">Servicios IA</h4>
                    <div className="space-y-2">
                      {selectedBot.aiServices.length > 0 ? (
                        selectedBot.aiServices.map((service) => (
                          <div key={service} className="flex items-center justify-between">
                            <span className="text-gray-300 capitalize">{service}</span>
                            <CheckCircleIcon className="w-4 h-4 text-green-400" />
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">No hay servicios IA conectados</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'trades' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-white">Trades Recientes</h4>
                  <div className="text-sm text-gray-400">
                    Última actualización: {new Date().toLocaleTimeString()}
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-600">
                        <th className="text-left py-2 text-gray-400">Símbolo</th>
                        <th className="text-left py-2 text-gray-400">Lado</th>
                        <th className="text-left py-2 text-gray-400">Cantidad</th>
                        <th className="text-left py-2 text-gray-400">Precio</th>
                        <th className="text-left py-2 text-gray-400">PnL</th>
                        <th className="text-left py-2 text-gray-400">Estado</th>
                        <th className="text-left py-2 text-gray-400">Hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {botTrades.map((trade) => (
                        <tr key={trade.id} className="border-b border-gray-700">
                          <td className="py-2 text-white font-medium">{trade.symbol}</td>
                          <td className="py-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              trade.side === 'buy' 
                                ? 'bg-green-600/20 text-green-400' 
                                : 'bg-red-600/20 text-red-400'
                            }`}>
                              {trade.side.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2 text-white">{trade.amount.toFixed(4)}</td>
                          <td className="py-2 text-white">{formatCurrency(trade.price)}</td>
                          <td className="py-2">
                            <span className={`font-medium ${
                              trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                            </span>
                          </td>
                          <td className="py-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              trade.status === 'open' 
                                ? 'bg-blue-600/20 text-blue-400'
                                : trade.status === 'closed'
                                ? 'bg-green-600/20 text-green-400'
                                : 'bg-gray-600/20 text-gray-400'
                            }`}>
                              {trade.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2 text-gray-400">{trade.timestamp.toLocaleTimeString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'config' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4">Parámetros de Trading</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Posición Máxima (USDT)
                        </label>
                        <input
                          type="number"
                          value={selectedBot.config.maxPositionSize}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Riesgo por Trade (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={selectedBot.config.riskPerTrade}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Stop Loss (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={selectedBot.config.stopLoss}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Take Profit (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={selectedBot.config.takeProfit}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4">Configuración Específica</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Spread Objetivo
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          value={selectedBot.config.spread}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Spread Mínimo
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          value={selectedBot.config.minSpread}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                    Guardar Configuración
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'metrics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-400">Volumen Total</div>
                    <div className="text-2xl font-bold text-white">{formatCurrency(selectedBot.metrics.totalVolume)}</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-400">Tamaño Promedio</div>
                    <div className="text-2xl font-bold text-white">{formatCurrency(selectedBot.metrics.avgTradeSize)}</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-400">Max Drawdown</div>
                    <div className="text-2xl font-bold text-red-400">{(selectedBot.metrics.maxDrawdown * 100).toFixed(1)}%</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-400">Sharpe Ratio</div>
                    <div className="text-2xl font-bold text-white">{selectedBot.metrics.sharpeRatio.toFixed(2)}</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-400">Profit Factor</div>
                    <div className="text-2xl font-bold text-white">{selectedBot.metrics.profitFactor.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}





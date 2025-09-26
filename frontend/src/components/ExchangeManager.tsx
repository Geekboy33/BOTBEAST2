// src/components/ExchangeManager.tsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Exchange {
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  balance: number;
  activeOrders: number;
  totalTrades: number;
  dailyVolume: number;
  fees: number;
  lastUpdate: string;
  apiKey?: string;
  secret?: string;
}

interface ArbitrageOpportunity {
  symbol: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  spreadPercent: number;
  volume: number;
  potentialProfit: number;
  timestamp: string;
}

interface PairScanner {
  symbol: string;
  exchanges: string[];
  price: number;
  volume24h: number;
  change24h: number;
  opportunities: number;
  signals: Array<{
    type: string;
    strength: number;
    exchange: string;
  }>;
}

export default function ExchangeManager() {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [arbitrageOpportunities, setArbitrageOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [pairScanner, setPairScanner] = useState<PairScanner[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'arbitrage' | 'scanner' | 'config'>('overview');
  const [selectedExchange, setSelectedExchange] = useState<string>('');
  const [newExchange, setNewExchange] = useState({
    name: '',
    apiKey: '',
    secret: '',
    sandbox: true
  });

  useEffect(() => {
    loadExchangeData();
    const interval = setInterval(loadExchangeData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadExchangeData = async () => {
    try {
      // Simular datos de exchanges
      const exchangesData: Exchange[] = [
        {
          name: 'Binance',
          status: 'connected',
          balance: 12500.50,
          activeOrders: 3,
          totalTrades: 156,
          dailyVolume: 25000.00,
          fees: 0.001,
          lastUpdate: new Date().toISOString()
        },
        {
          name: 'Kraken',
          status: 'connected',
          balance: 8750.25,
          activeOrders: 1,
          totalTrades: 89,
          dailyVolume: 18000.00,
          fees: 0.0016,
          lastUpdate: new Date().toISOString()
        },
        {
          name: 'KuCoin',
          status: 'connected',
          balance: 5600.75,
          activeOrders: 2,
          totalTrades: 67,
          dailyVolume: 12000.00,
          fees: 0.001,
          lastUpdate: new Date().toISOString()
        },
        {
          name: 'OKX',
          status: 'disconnected',
          balance: 0,
          activeOrders: 0,
          totalTrades: 0,
          dailyVolume: 0,
          fees: 0.001,
          lastUpdate: new Date().toISOString()
        }
      ];

      setExchanges(exchangesData);

      // Simular oportunidades de arbitraje
      const arbitrageData: ArbitrageOpportunity[] = [
        {
          symbol: 'BTCUSDT',
          buyExchange: 'KuCoin',
          sellExchange: 'Binance',
          buyPrice: 43150.00,
          sellPrice: 43200.00,
          spread: 50.00,
          spreadPercent: 0.116,
          volume: 2.5,
          potentialProfit: 125.00,
          timestamp: new Date().toISOString()
        },
        {
          symbol: 'ETHUSDT',
          buyExchange: 'Kraken',
          sellExchange: 'KuCoin',
          buyPrice: 2850.00,
          sellPrice: 2865.00,
          spread: 15.00,
          spreadPercent: 0.526,
          volume: 10.0,
          potentialProfit: 150.00,
          timestamp: new Date().toISOString()
        }
      ];

      setArbitrageOpportunities(arbitrageData);

      // Simular scanner de pares
      const scannerData: PairScanner[] = [
        {
          symbol: 'BTCUSDT',
          exchanges: ['Binance', 'Kraken', 'KuCoin'],
          price: 43217.21,
          volume24h: 2500000000,
          change24h: 2.3,
          opportunities: 3,
          signals: [
            { type: 'Support Break', strength: 0.8, exchange: 'Binance' },
            { type: 'Volume Spike', strength: 0.9, exchange: 'Kraken' }
          ]
        },
        {
          symbol: 'ETHUSDT',
          exchanges: ['Binance', 'Kraken', 'KuCoin'],
          price: 2866.32,
          volume24h: 1200000000,
          change24h: -1.2,
          opportunities: 2,
          signals: [
            { type: 'Resistance Test', strength: 0.7, exchange: 'KuCoin' },
            { type: 'MACD Bullish', strength: 0.6, exchange: 'Binance' }
          ]
        },
        {
          symbol: 'ADAUSDT',
          exchanges: ['Binance', 'Kraken'],
          price: 0.52,
          volume24h: 350000000,
          change24h: 5.8,
          opportunities: 1,
          signals: [
            { type: 'Breakout', strength: 0.85, exchange: 'Binance' }
          ]
        }
      ];

      setPairScanner(scannerData);

    } catch (error) {
      console.error('Error loading exchange data:', error);
    }
  };

  const connectExchange = async (exchangeName: string) => {
    try {
      setExchanges(prev => prev.map(ex => 
        ex.name === exchangeName ? { ...ex, status: 'connected' } : ex
      ));
    } catch (error) {
      console.error('Error connecting exchange:', error);
    }
  };

  const disconnectExchange = async (exchangeName: string) => {
    try {
      setExchanges(prev => prev.map(ex => 
        ex.name === exchangeName ? { ...ex, status: 'disconnected' } : ex
      ));
    } catch (error) {
      console.error('Error disconnecting exchange:', error);
    }
  };

  const addExchange = async () => {
    try {
      const newExchangeData: Exchange = {
        name: newExchange.name,
        status: 'connected',
        balance: 0,
        activeOrders: 0,
        totalTrades: 0,
        dailyVolume: 0,
        fees: 0.001,
        lastUpdate: new Date().toISOString(),
        apiKey: newExchange.apiKey,
        secret: newExchange.secret
      };

      setExchanges(prev => [...prev, newExchangeData]);
      setNewExchange({ name: '', apiKey: '', secret: '', sandbox: true });
    } catch (error) {
      console.error('Error adding exchange:', error);
    }
  };

  const executeArbitrage = async (opportunity: ArbitrageOpportunity) => {
    try {
      // Simular ejecución de arbitraje
      console.log('Executing arbitraje:', opportunity);
    } catch (error) {
      console.error('Error executing arbitraje:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-400';
      case 'disconnected': return 'text-red-400';
      case 'error': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-600';
      case 'disconnected': return 'bg-red-600';
      case 'error': return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
  };

  // Datos para gráficos
  const exchangeVolumeData = exchanges.map(ex => ({
    name: ex.name,
    volume: ex.dailyVolume,
    balance: ex.balance
  }));

  const arbitrageHistoryData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    opportunities: Math.floor(Math.random() * 10) + 1,
    profit: Math.random() * 1000
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Exchange Manager</h2>
        <div className="flex space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-400">Connected Exchanges</div>
            <div className="text-xl font-bold text-green-400">
              {exchanges.filter(ex => ex.status === 'connected').length}/{exchanges.length}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Arbitrage Opportunities</div>
            <div className="text-xl font-bold text-yellow-400">{arbitrageOpportunities.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'arbitrage', label: 'Arbitrage' },
          { key: 'scanner', label: 'Pair Scanner' },
          { key: 'config', label: 'Configuration' }
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
          {/* Exchange Status */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Exchange Status</h3>
            <div className="space-y-3">
              {exchanges.map((exchange, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusBg(exchange.status)}`}></div>
                    <div>
                      <div className="font-semibold">{exchange.name}</div>
                      <div className="text-sm text-gray-400">
                        Balance: ${exchange.balance.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${getStatusColor(exchange.status)}`}>
                      {exchange.status.toUpperCase()}
                    </div>
                    <div className="flex space-x-2 mt-2">
                      {exchange.status === 'connected' ? (
                        <button
                          onClick={() => disconnectExchange(exchange.name)}
                          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          onClick={() => connectExchange(exchange.name)}
                          className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Exchange Metrics */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Exchange Metrics</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={exchangeVolumeData}>
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
                  <Bar dataKey="volume" fill="#8B5CF6" name="Daily Volume" />
                  <Bar dataKey="balance" fill="#10B981" name="Balance" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Arbitrage Tab */}
      {activeTab === 'arbitrage' && (
        <div className="space-y-6">
          {/* Active Opportunities */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Arbitrage Opportunities</h3>
            <div className="space-y-3">
              {arbitrageOpportunities.map((opportunity, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-700 rounded">
                  <div className="flex items-center space-x-4">
                    <div>
                      <div className="font-semibold text-lg">{opportunity.symbol}</div>
                      <div className="text-sm text-gray-400">
                        Buy: {opportunity.buyExchange} @ ${opportunity.buyPrice.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-400">
                        Sell: {opportunity.sellExchange} @ ${opportunity.sellPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-400">
                      +{opportunity.spreadPercent.toFixed(3)}%
                    </div>
                    <div className="text-sm text-gray-400">
                      Profit: ${opportunity.potentialProfit.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-400">
                      Volume: {opportunity.volume}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => executeArbitrage(opportunity)}
                      className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold"
                    >
                      Execute
                    </button>
                    <button className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded font-semibold">
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Arbitrage History */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Arbitrage History (24h)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={arbitrageHistoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="hour" stroke="#9CA3AF" />
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
                    dataKey="opportunities" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Opportunities"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#FCD34D" 
                    strokeWidth={2}
                    name="Profit ($)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Scanner Tab */}
      {activeTab === 'scanner' && (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3">Symbol</th>
                  <th className="text-left py-3">Price</th>
                  <th className="text-left py-3">24h Change</th>
                  <th className="text-left py-3">24h Volume</th>
                  <th className="text-left py-3">Exchanges</th>
                  <th className="text-left py-3">Opportunities</th>
                  <th className="text-left py-3">Signals</th>
                  <th className="text-left py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pairScanner.map((pair, index) => (
                  <tr key={index} className="border-b border-gray-700">
                    <td className="py-3 font-semibold">{pair.symbol}</td>
                    <td className="py-3">${pair.price.toFixed(2)}</td>
                    <td className={`py-3 font-semibold ${pair.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {pair.change24h >= 0 ? '+' : ''}{pair.change24h.toFixed(2)}%
                    </td>
                    <td className="py-3">${(pair.volume24h / 1000000).toFixed(0)}M</td>
                    <td className="py-3">
                      <div className="flex space-x-1">
                        {pair.exchanges.map((exchange, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-600 rounded text-xs">
                            {exchange}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-yellow-600 rounded text-xs font-semibold">
                        {pair.opportunities}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="space-y-1">
                        {pair.signals.map((signal, i) => (
                          <div key={i} className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              signal.strength >= 0.8 ? 'bg-green-400' :
                              signal.strength >= 0.6 ? 'bg-yellow-400' : 'bg-red-400'
                            }`}></div>
                            <span className="text-xs">{signal.type}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3">
                      <button className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm font-semibold">
                        Analyze
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Configuration Tab */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add New Exchange */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Add New Exchange</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Exchange Name</label>
                <select
                  value={newExchange.name}
                  onChange={(e) => setNewExchange({...newExchange, name: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                >
                  <option value="">Select Exchange</option>
                  <option value="Binance">Binance</option>
                  <option value="Kraken">Kraken</option>
                  <option value="KuCoin">KuCoin</option>
                  <option value="OKX">OKX</option>
                  <option value="Coinbase">Coinbase</option>
                  <option value="Bybit">Bybit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">API Key</label>
                <input
                  type="text"
                  value={newExchange.apiKey}
                  onChange={(e) => setNewExchange({...newExchange, apiKey: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  placeholder="Enter API Key"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Secret Key</label>
                <input
                  type="password"
                  value={newExchange.secret}
                  onChange={(e) => setNewExchange({...newExchange, secret: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  placeholder="Enter Secret Key"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newExchange.sandbox}
                  onChange={(e) => setNewExchange({...newExchange, sandbox: e.target.checked})}
                  className="rounded"
                />
                <label className="text-sm text-gray-400">Use Sandbox/Testnet</label>
              </div>

              <button
                onClick={addExchange}
                className="w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold"
              >
                Add Exchange
              </button>
            </div>
          </div>

          {/* Exchange Settings */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Exchange Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Default Exchange</label>
                <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2">
                  <option value="Binance">Binance</option>
                  <option value="Kraken">Kraken</option>
                  <option value="KuCoin">KuCoin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Max Concurrent Orders</label>
                <input
                  type="number"
                  defaultValue="10"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Order Timeout (seconds)</label>
                <input
                  type="number"
                  defaultValue="30"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Min Spread for Arbitrage (%)</label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue="0.1"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <label className="text-sm text-gray-400">Enable Auto-Arbitrage</label>
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <label className="text-sm text-gray-400">Enable Pair Scanner</label>
              </div>

              <button className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold">
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




import React, { useState, useEffect } from 'react';

interface Exchange {
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  api_key: string;
  secret: string;
  sandbox: boolean;
  enabled: boolean;
  balance: Record<string, number>;
  fees: { maker: number; taker: number };
  pairs: string[];
}

export default function ExchangeManager() {
  const [exchanges, setExchanges] = useState<Record<string, Exchange>>({});
  const [selectedExchange, setSelectedExchange] = useState('');
  const [configMode, setConfigMode] = useState(false);
  const [newConfig, setNewConfig] = useState({
    api_key: '',
    secret: '',
    sandbox: true
  });

  useEffect(() => {
    loadExchanges();
  }, []);

  const loadExchanges = async () => {
    try {
      const response = await fetch('/api/exchanges');
      if (response.ok) {
        const data = await response.json();
        setExchanges(data);
      }
    } catch (error) {
      console.log('Using mock exchange data');
      setExchanges({
        binance: {
          name: 'Binance',
          status: 'connected',
          api_key: '***configured***',
          secret: '***configured***',
          sandbox: true,
          enabled: true,
          balance: { USDT: 5000, BTC: 0.1, ETH: 2.0 },
          fees: { maker: 0.001, taker: 0.001 },
          pairs: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT']
        },
        kraken: {
          name: 'Kraken',
          status: 'connected',
          api_key: '***configured***',
          secret: '***configured***',
          sandbox: true,
          enabled: true,
          balance: { USDT: 3000, BTC: 0.05, ETH: 1.0 },
          fees: { maker: 0.0016, taker: 0.0026 },
          pairs: ['BTCUSD', 'ETHUSD']
        },
        kucoin: {
          name: 'KuCoin',
          status: 'connected',
          api_key: '***configured***',
          secret: '***configured***',
          sandbox: true,
          enabled: true,
          balance: { USDT: 2000, BTC: 0.03, ETH: 0.8 },
          fees: { maker: 0.001, taker: 0.001 },
          pairs: ['BTC-USDT', 'ETH-USDT']
        },
        okx: {
          name: 'OKX',
          status: 'disconnected',
          api_key: '',
          secret: '',
          sandbox: true,
          enabled: false,
          balance: { USDT: 0, BTC: 0, ETH: 0 },
          fees: { maker: 0.0008, taker: 0.001 },
          pairs: []
        }
      });
    }
  };

  const testConnection = async (exchangeId: string) => {
    try {
      const response = await fetch(`/api/exchanges/${exchangeId}/test`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await loadExchanges();
      }
    } catch (error) {
      console.error('Error testing connection:', error);
    }
  };

  const saveConfig = async (exchangeId: string) => {
    try {
      const response = await fetch(`/api/exchanges/${exchangeId}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      
      if (response.ok) {
        await loadExchanges();
        setConfigMode(false);
        setNewConfig({ api_key: '', secret: '', sandbox: true });
      }
    } catch (error) {
      console.error('Error saving config:', error);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">🔄 Exchange Manager</h2>
        <div className="flex space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-400">Connected Exchanges</div>
            <div className="text-xl font-bold text-green-400">
              {Object.values(exchanges).filter(ex => ex.status === 'connected').length}/{Object.keys(exchanges).length}
            </div>
          </div>
        </div>
      </div>

      {/* Exchange Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(exchanges).map(([id, exchange]) => (
          <div key={id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{exchange.name}</h3>
              <div className={`w-3 h-3 rounded-full ${getStatusBg(exchange.status)}`}></div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Status:</span>
                <span className={`font-semibold ${getStatusColor(exchange.status)}`}>
                  {exchange.status.toUpperCase()}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">API Key:</span>
                <span className="text-white font-mono text-xs">{exchange.api_key || 'Not configured'}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Sandbox:</span>
                <span className={`font-semibold ${exchange.sandbox ? 'text-yellow-400' : 'text-green-400'}`}>
                  {exchange.sandbox ? 'Yes' : 'No'}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Maker Fee:</span>
                <span className="text-white font-semibold">{(exchange.fees.maker * 100).toFixed(3)}%</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-600">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Balance:</h4>
              <div className="space-y-1">
                {Object.entries(exchange.balance).map(([asset, amount]) => (
                  <div key={asset} className="flex justify-between text-sm">
                    <span className="text-gray-400">{asset}:</span>
                    <span className="text-white font-semibold">{amount.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => testConnection(id)}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm font-semibold text-white"
              >
                Test
              </button>
              <button
                onClick={() => {
                  setSelectedExchange(id);
                  setConfigMode(true);
                }}
                className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm font-semibold text-white"
              >
                Configure
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Configuration Modal */}
      {configMode && selectedExchange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                Configure {exchanges[selectedExchange]?.name}
              </h3>
              <button
                onClick={() => setConfigMode(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">API Key</label>
                <input
                  type="text"
                  value={newConfig.api_key}
                  onChange={(e) => setNewConfig({...newConfig, api_key: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="Enter API Key"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Secret Key</label>
                <input
                  type="password"
                  value={newConfig.secret}
                  onChange={(e) => setNewConfig({...newConfig, secret: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="Enter Secret Key"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newConfig.sandbox}
                  onChange={(e) => setNewConfig({...newConfig, sandbox: e.target.checked})}
                  className="rounded"
                />
                <label className="text-sm text-gray-400">Use Sandbox/Testnet</label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setConfigMode(false)}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => saveConfig(selectedExchange)}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
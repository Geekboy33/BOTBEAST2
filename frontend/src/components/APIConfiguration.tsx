// src/components/APIConfiguration.tsx
import React, { useState, useEffect } from 'react';
import { useFormValidation, commonValidations, ValidationRules } from '../hooks/useFormValidation';

interface ExchangeConfig {
  id: string;
  name: string;
  apiKey: string;
  secret: string;
  sandbox: boolean;
  enabled: boolean;
  balance: number;
  lastUpdate: string;
  status: 'connected' | 'disconnected' | 'error';
  permissions: string[];
}

interface TestResult {
  exchange: string;
  success: boolean;
  message: string;
  balance?: number;
  permissions?: string[];
}

export default function APIConfiguration() {
  const [configs, setConfigs] = useState<ExchangeConfig[]>([]);
  const [selectedExchange, setSelectedExchange] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  
  // Validación de formulario
  const validationRules: ValidationRules = {
    exchange: { required: true },
    apiKey: commonValidations.apiKey,
    secret: { required: true, min: 10 },
  };
  
  const {
    data: newConfig,
    errors,
    setFieldValue,
    setFieldTouched,
    validateForm,
    resetForm,
    getFieldError,
    isValid
  } = useFormValidation({
    exchange: '',
    apiKey: '',
    secret: '',
    sandbox: true
  }, validationRules);

  const exchanges = [
    { id: 'binance', name: 'Binance', url: 'https://api.binance.com' },
    { id: 'kraken', name: 'Kraken', url: 'https://api.kraken.com' },
    { id: 'kucoin', name: 'KuCoin', url: 'https://api.kucoin.com' },
    { id: 'okx', name: 'OKX', url: 'https://www.okx.com' },
    { id: 'coinbase', name: 'Coinbase Pro', url: 'https://api.exchange.coinbase.com' },
    { id: 'bybit', name: 'Bybit', url: 'https://api.bybit.com' }
  ];

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      // Simular configuraciones existentes
      const mockConfigs: ExchangeConfig[] = [
        {
          id: 'binance',
          name: 'Binance',
          apiKey: '***binance_key***',
          secret: '***binance_secret***',
          sandbox: false,
          enabled: true,
          balance: 12500.50,
          lastUpdate: new Date().toISOString(),
          status: 'connected',
          permissions: ['spot', 'futures', 'margin']
        },
        {
          id: 'kraken',
          name: 'Kraken',
          apiKey: '***kraken_key***',
          secret: '***kraken_secret***',
          sandbox: false,
          enabled: true,
          balance: 8750.25,
          lastUpdate: new Date().toISOString(),
          status: 'connected',
          permissions: ['spot', 'margin']
        },
        {
          id: 'kucoin',
          name: 'KuCoin',
          apiKey: '***kucoin_key***',
          secret: '***kucoin_secret***',
          sandbox: true,
          enabled: true,
          balance: 5600.75,
          lastUpdate: new Date().toISOString(),
          status: 'connected',
          permissions: ['spot', 'futures']
        },
        {
          id: 'okx',
          name: 'OKX',
          apiKey: '',
          secret: '',
          sandbox: true,
          enabled: false,
          balance: 0,
          lastUpdate: new Date().toISOString(),
          status: 'disconnected',
          permissions: []
        }
      ];

      setConfigs(mockConfigs);
    } catch (error) {
      console.error('Error loading configurations:', error);
    }
  };

  const saveConfiguration = async (config: any) => {
    try {
      const response = await fetch('/api/config/exchanges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        await loadConfigurations();
        setNewConfig({ exchange: '', apiKey: '', secret: '', sandbox: true });
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
    }
  };

  const testConnection = async (exchangeId: string) => {
    setIsTesting(true);
    try {
      const response = await fetch(`/api/test/exchange/${exchangeId}`, {
        method: 'POST'
      });

      const result = await response.json();
      
      setTestResults(prev => [...prev.filter(r => r.exchange !== exchangeId), {
        exchange: exchangeId,
        success: result.success,
        message: result.message,
        balance: result.balance,
        permissions: result.permissions
      }]);

      // Actualizar configuración si la prueba fue exitosa
      if (result.success) {
        setConfigs(prev => prev.map(config => 
          config.id === exchangeId 
            ? { 
                ...config, 
                status: 'connected',
                balance: result.balance || config.balance,
                permissions: result.permissions || config.permissions,
                lastUpdate: new Date().toISOString()
              }
            : config
        ));
      }

    } catch (error) {
      console.error('Error testing connection:', error);
      setTestResults(prev => [...prev.filter(r => r.exchange !== exchangeId), {
        exchange: exchangeId,
        success: false,
        message: 'Connection test failed'
      }]);
    } finally {
      setIsTesting(false);
    }
  };

  const deleteConfiguration = async (exchangeId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta configuración?')) {
      try {
        await fetch(`/api/config/exchanges/${exchangeId}`, {
          method: 'DELETE'
        });
        await loadConfigurations();
      } catch (error) {
        console.error('Error deleting configuration:', error);
      }
    }
  };

  const toggleConfiguration = async (exchangeId: string) => {
    try {
      const config = configs.find(c => c.id === exchangeId);
      if (config) {
        const response = await fetch(`/api/config/exchanges/${exchangeId}/toggle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: !config.enabled })
        });

        if (response.ok) {
          setConfigs(prev => prev.map(c => 
            c.id === exchangeId 
              ? { ...c, enabled: !c.enabled, status: !c.enabled ? 'connected' : 'disconnected' }
              : c
          ));
        }
      }
    } catch (error) {
      console.error('Error toggling configuration:', error);
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
        <h2 className="text-2xl font-bold">API Configuration</h2>
        <div className="flex space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-400">Connected Exchanges</div>
            <div className="text-xl font-bold text-green-400">
              {configs.filter(c => c.status === 'connected').length}/{configs.length}
            </div>
          </div>
        </div>
      </div>

      {/* Add New Configuration */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Add New Exchange</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Exchange</label>
            <select
              value={newConfig.exchange}
              onChange={(e) => setNewConfig({...newConfig, exchange: e.target.value})}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
            >
              <option value="">Select Exchange</option>
              {exchanges.map(exchange => (
                <option key={exchange.id} value={exchange.id}>{exchange.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">API Key</label>
            <input
              type="text"
              value={newConfig.apiKey}
              onChange={(e) => setNewConfig({...newConfig, apiKey: e.target.value})}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
              placeholder="Enter API Key"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Secret Key</label>
            <input
              type="password"
              value={newConfig.secret}
              onChange={(e) => setNewConfig({...newConfig, secret: e.target.value})}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
              placeholder="Enter Secret Key"
            />
          </div>

          <div className="flex items-end">
            <div className="flex items-center space-x-2 w-full">
              <input
                type="checkbox"
                checked={newConfig.sandbox}
                onChange={(e) => setNewConfig({...newConfig, sandbox: e.target.checked})}
                className="rounded"
              />
              <label className="text-sm text-gray-400">Sandbox</label>
            </div>
            <button
              onClick={() => saveConfiguration(newConfig)}
              className="ml-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Existing Configurations */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Exchange Configurations</h3>
        {configs.map((config) => (
          <div key={config.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <h4 className="text-lg font-semibold">{config.name}</h4>
                <div className={`w-3 h-3 rounded-full ${getStatusBg(config.status)}`}></div>
                <span className={`text-sm font-semibold ${getStatusColor(config.status)}`}>
                  {config.status.toUpperCase()}
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => testConnection(config.id)}
                  disabled={isTesting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded font-semibold"
                >
                  {isTesting ? 'Testing...' : 'Test'}
                </button>
                <button
                  onClick={() => toggleConfiguration(config.id)}
                  className={`px-4 py-2 rounded font-semibold ${
                    config.enabled 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {config.enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => deleteConfiguration(config.id)}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">API Key</label>
                <div className="bg-gray-700 border border-gray-600 rounded px-3 py-2 font-mono text-sm">
                  {config.apiKey}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Secret Key</label>
                <div className="bg-gray-700 border border-gray-600 rounded px-3 py-2 font-mono text-sm">
                  {config.secret}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Balance</label>
                <div className="bg-gray-700 border border-gray-600 rounded px-3 py-2 font-semibold text-green-400">
                  ${config.balance.toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Permissions</label>
                <div className="bg-gray-700 border border-gray-600 rounded px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {config.permissions.map(permission => (
                      <span key={permission} className="px-2 py-1 bg-blue-600 rounded text-xs">
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Test Results */}
            {testResults.find(r => r.exchange === config.id) && (
              <div className="mt-4 p-3 rounded">
                {testResults.find(r => r.exchange === config.id)?.success ? (
                  <div className="text-green-400">
                    ✅ Connection successful: {testResults.find(r => r.exchange === config.id)?.message}
                  </div>
                ) : (
                  <div className="text-red-400">
                    ❌ Connection failed: {testResults.find(r => r.exchange === config.id)?.message}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Exchange Information */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Exchange Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exchanges.map((exchange) => (
            <div key={exchange.id} className="bg-gray-700 rounded p-4">
              <h4 className="font-semibold mb-2">{exchange.name}</h4>
              <div className="text-sm text-gray-400 space-y-1">
                <div>URL: {exchange.url}</div>
                <div>Status: {configs.find(c => c.id === exchange.id)?.status || 'Not configured'}</div>
                <div>Type: {exchange.id === 'binance' || exchange.id === 'kucoin' || exchange.id === 'okx' ? 'Spot & Futures' : 'Spot'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-400 mb-2">🔒 Security Notice</h4>
        <div className="text-sm text-yellow-200 space-y-1">
          <p>• Always use API keys with minimal required permissions</p>
          <p>• Enable IP whitelisting when possible</p>
          <p>• Use sandbox/testnet mode for testing</p>
          <p>• Never share your API keys with anyone</p>
          <p>• Regularly rotate your API keys</p>
        </div>
      </div>
    </div>
  );
}
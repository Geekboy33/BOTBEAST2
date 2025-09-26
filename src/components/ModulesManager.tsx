import React, { useState, useEffect } from 'react';

interface BotModule {
  id: string;
  name: string;
  type: 'trading' | 'analysis' | 'ai' | 'risk';
  status: 'active' | 'inactive' | 'error';
  enabled: boolean;
  description: string;
  algorithm: string;
  performance: number;
  config: Record<string, any>;
  dependencies: string[];
  last_signal: string;
  [key: string]: any;
}

export default function ModulesManager() {
  const [modules, setModules] = useState<Record<string, BotModule>>({});
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [configMode, setConfigMode] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Record<string, any>>({});

  useEffect(() => {
    loadModules();
    const interval = setInterval(loadModules, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadModules = async () => {
    try {
      const response = await fetch('/api/modules');
      if (response.ok) {
        const data = await response.json();
        setModules(data);
      }
    } catch (error) {
      console.log('Using mock modules data');
    }
  };

  const toggleModule = async (moduleId: string) => {
    try {
      const response = await fetch(`/api/modules/${moduleId}/toggle`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await loadModules();
      }
    } catch (error) {
      console.error('Error toggling module:', error);
    }
  };

  const saveConfig = async (moduleId: string) => {
    try {
      const response = await fetch(`/api/modules/${moduleId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingConfig)
      });
      
      if (response.ok) {
        await loadModules();
        setConfigMode(false);
        setEditingConfig({});
      }
    } catch (error) {
      console.error('Error saving config:', error);
    }
  };

  const openConfig = (moduleId: string) => {
    const module = modules[moduleId];
    if (module) {
      setSelectedModule(moduleId);
      setEditingConfig(module.config);
      setConfigMode(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'inactive': return 'text-red-400';
      case 'error': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'inactive': return 'bg-red-600';
      case 'error': return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trading': return '💹';
      case 'analysis': return '📊';
      case 'ai': return '🤖';
      case 'risk': return '⚖️';
      default: return '📦';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'trading': return 'border-green-500';
      case 'analysis': return 'border-blue-500';
      case 'ai': return 'border-purple-500';
      case 'risk': return 'border-red-500';
      default: return 'border-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">🤖 Bot Modules Manager</h2>
        <div className="flex space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-400">Active Modules</div>
            <div className="text-xl font-bold text-green-400">
              {Object.values(modules).filter(m => m.enabled).length}/{Object.keys(modules).length}
            </div>
          </div>
        </div>
      </div>

      {/* Module Categories */}
      {Object.entries(
        Object.values(modules).reduce((acc, module) => {
          if (!acc[module.type]) acc[module.type] = [];
          acc[module.type].push(module);
          return acc;
        }, {} as Record<string, BotModule[]>)
      ).map(([type, typeModules]) => (
        <div key={type} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <span>{getTypeIcon(type)}</span>
            <span className="capitalize">{type} Modules ({typeModules.length})</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {typeModules.map((module) => (
              <div 
                key={module.id} 
                className={`bg-gray-700 rounded-lg p-4 border-l-4 ${getTypeColor(module.type)} hover:bg-gray-600 transition-colors cursor-pointer`}
                onClick={() => setSelectedModule(module.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getTypeIcon(module.type)}</span>
                    <h4 className="font-semibold text-white">{module.name}</h4>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${getStatusBg(module.status)}`}></div>
                </div>
                
                <p className="text-sm text-gray-300 mb-2">{module.description}</p>
                <p className="text-xs text-gray-400 mb-3 italic">{module.algorithm}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Performance:</span>
                    <span className="font-semibold text-white">{module.performance}%</span>
                  </div>
                  
                  {module.trades_today !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Trades Today:</span>
                      <span className="font-semibold text-blue-400">{module.trades_today}</span>
                    </div>
                  )}
                  
                  {module.profit_today !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Profit Today:</span>
                      <span className={`font-semibold ${module.profit_today >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${module.profit_today.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleModule(module.id);
                    }}
                    className={`flex-1 px-3 py-2 rounded text-sm font-semibold ${
                      module.enabled
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {module.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      openConfig(module.id);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm font-semibold text-white"
                  >
                    Config
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Configuration Modal */}
      {configMode && selectedModule && modules[selectedModule] && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                Configure {modules[selectedModule].name}
              </h3>
              <button
                onClick={() => setConfigMode(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.entries(editingConfig).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm text-gray-400 mb-1 capitalize">
                    {key.replace(/_/g, ' ')}
                  </label>
                  <input
                    type={typeof value === 'number' ? 'number' : 'text'}
                    value={value}
                    onChange={(e) => setEditingConfig({
                      ...editingConfig,
                      [key]: typeof value === 'number' ? parseFloat(e.target.value) : e.target.value
                    })}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  />
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setConfigMode(false)}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => saveConfig(selectedModule)}
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
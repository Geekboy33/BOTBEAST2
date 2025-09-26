import React, { useState, useEffect } from 'react';

interface BotModule {
  id: string;
  name: string;
  type: string;
  status: string;
  enabled: boolean;
  description: string;
  performance: number;
  algorithm: string;
  last_signal: string;
  [key: string]: any;
}

const ModulesManager: React.FC = () => {
  const [modules, setModules] = useState<Record<string, BotModule>>({});
  const [selectedModule, setSelectedModule] = useState<string>('');

  useEffect(() => {
    loadModules();
    const interval = setInterval(loadModules, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadModules = async () => {
    try {
      const response = await fetch('/api/modules');
      const data = await response.json();
      setModules(data);
    } catch (error) {
      console.error('Error loading modules:', error);
    }
  };

  const toggleModule = async (moduleId: string) => {
    try {
      const module = modules[moduleId];
      const newStatus = module.enabled ? 'inactive' : 'active';
      
      setModules(prev => ({
        ...prev,
        [moduleId]: {
          ...prev[moduleId],
          enabled: !prev[moduleId].enabled,
          status: newStatus
        }
      }));
    } catch (error) {
      console.error('Error toggling module:', error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'inactive': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'inactive': return 'bg-red-600';
      case 'warning': return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
  };

  const modulesByType = Object.values(modules).reduce((acc, module) => {
    if (!acc[module.type]) acc[module.type] = [];
    acc[module.type].push(module);
    return acc;
  }, {} as Record<string, BotModule[]>);

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
      {Object.entries(modulesByType).map(([type, typeModules]) => (
        <div key={type} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <span>{getModuleTypeIcon(type)}</span>
            <span>{type.charAt(0).toUpperCase() + type.slice(1)} Modules</span>
            <span className="text-sm text-gray-400">({typeModules.length})</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {typeModules.map((module) => (
              <div 
                key={module.id} 
                className={`bg-gray-700 rounded-lg p-4 border cursor-pointer transition-all hover:border-blue-500 ${
                  selectedModule === module.id ? 'border-blue-500' : 'border-gray-600'
                }`}
                onClick={() => setSelectedModule(module.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getModuleTypeIcon(module.type)}</span>
                    <h4 className="font-semibold text-white">{module.name}</h4>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${getStatusBg(module.status)}`}></div>
                </div>
                
                <p className="text-sm text-gray-400 mb-3">{module.description}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Performance:</span>
                    <span className="font-semibold text-white">{module.performance}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Status:</span>
                    <span className={`font-semibold ${getStatusColor(module.status)}`}>
                      {module.status.toUpperCase()}
                    </span>
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
                  <button className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm font-semibold text-white">
                    Config
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Module Details */}
      {selectedModule && modules[selectedModule] && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">
            {modules[selectedModule].name} - Details
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Algorithm</h4>
              <p className="text-gray-300 mb-4">{modules[selectedModule].algorithm}</p>
              
              <h4 className="text-lg font-semibold text-white mb-3">Parameters</h4>
              <div className="space-y-2">
                {modules[selectedModule].parameters && Object.entries(modules[selectedModule].parameters).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-400">{key}:</span>
                    <span className="text-white font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Performance Metrics</h4>
              <div className="space-y-3">
                <div className="bg-gray-700 p-3 rounded">
                  <div className="text-sm text-gray-400">Overall Performance</div>
                  <div className="text-2xl font-bold text-white">{modules[selectedModule].performance}%</div>
                </div>
                {modules[selectedModule].trades_today !== undefined && (
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-sm text-gray-400">Trades Today</div>
                    <div className="text-2xl font-bold text-blue-400">{modules[selectedModule].trades_today}</div>
                  </div>
                )}
                {modules[selectedModule].profit_today !== undefined && (
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-sm text-gray-400">Profit Today</div>
                    <div className={`text-2xl font-bold ${modules[selectedModule].profit_today >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${modules[selectedModule].profit_today.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModulesManager;
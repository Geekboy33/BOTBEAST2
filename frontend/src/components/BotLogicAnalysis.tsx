// src/components/BotLogicAnalysis.tsx
import React, { useState, useEffect } from 'react';
import { 
  CpuChipIcon, 
  ChartBarIcon, 
  LightBulbIcon,
  CogIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface BotModule {
  id: string;
  name: string;
  type: 'scalper' | 'maker' | 'arbitrage' | 'ai_controller';
  description: string;
  algorithm: string;
  parameters: {
    [key: string]: {
      value: number;
      min: number;
      max: number;
      description: string;
    };
  };
  performance: {
    winRate: number;
    profitFactor: number;
    sharpeRatio: number;
    maxDrawdown: number;
    avgTradeDuration: number;
    tradesPerDay: number;
  };
  dependencies: string[];
  status: 'active' | 'inactive' | 'learning';
}

interface TradingLogic {
  modules: BotModule[];
  decisionFlow: {
    step: number;
    module: string;
    action: string;
    condition: string;
    nextStep?: number;
  }[];
  riskManagement: {
    maxPositionSize: number;
    stopLossPercentage: number;
    takeProfitPercentage: number;
    maxDailyLoss: number;
    correlationLimit: number;
  };
  marketConditions: {
    volatility: number;
    trend: 'bullish' | 'bearish' | 'sideways';
    volume: 'high' | 'medium' | 'low';
    liquidity: 'high' | 'medium' | 'low';
  };
}

export default function BotLogicAnalysis() {
  const [logic, setLogic] = useState<TradingLogic>({
    modules: [
      {
        id: 'scalper_qlearning',
        name: 'Scalper Q-Learning',
        type: 'scalper',
        description: 'Algoritmo de aprendizaje por refuerzo que aprende patrones de scalping óptimos',
        algorithm: 'Q-Learning con función de recompensa basada en profit factor y drawdown',
        parameters: {
          learningRate: { value: 0.1, min: 0.01, max: 0.5, description: 'Tasa de aprendizaje del algoritmo' },
          discountFactor: { value: 0.95, min: 0.8, max: 0.99, description: 'Factor de descuento para recompensas futuras' },
          epsilon: { value: 0.1, min: 0.01, max: 0.3, description: 'Probabilidad de exploración vs explotación' },
          minSpread: { value: 0.0005, min: 0.0001, max: 0.002, description: 'Spread mínimo para ejecutar trades' },
          maxHoldTime: { value: 300, min: 60, max: 1800, description: 'Tiempo máximo de hold en segundos' }
        },
        performance: {
          winRate: 0.68,
          profitFactor: 2.1,
          sharpeRatio: 1.85,
          maxDrawdown: 0.08,
          avgTradeDuration: 180,
          tradesPerDay: 15
        },
        dependencies: ['market_data', 'order_book'],
        status: 'active'
      },
      {
        id: 'market_maker',
        name: 'Market Maker Pro',
        type: 'maker',
        description: 'Estrategia de market making que coloca órdenes límite alrededor del mid-price',
        algorithm: 'Algoritmo de market making adaptativo con ajuste dinámico de spreads',
        parameters: {
          baseSpread: { value: 0.001, min: 0.0005, max: 0.005, description: 'Spread base para órdenes límite' },
          volatilityMultiplier: { value: 1.5, min: 1.0, max: 3.0, description: 'Multiplicador de volatilidad' },
          inventorySkew: { value: 0.1, min: 0.05, max: 0.3, description: 'Sesgo por inventario' },
          maxInventory: { value: 1000, min: 100, max: 5000, description: 'Inventario máximo permitido' },
          rebalanceThreshold: { value: 0.2, min: 0.1, max: 0.5, description: 'Umbral para rebalanceo' }
        },
        performance: {
          winRate: 0.75,
          profitFactor: 1.8,
          sharpeRatio: 2.1,
          maxDrawdown: 0.05,
          avgTradeDuration: 3600,
          tradesPerDay: 8
        },
        dependencies: ['order_book', 'inventory_tracker'],
        status: 'active'
      },
      {
        id: 'arbitrage_hunter',
        name: 'Arbitrage Hunter',
        type: 'arbitrage',
        description: 'Detecta y ejecuta oportunidades de arbitraje entre exchanges',
        algorithm: 'Algoritmo de detección de arbitraje en tiempo real con ejecución automática',
        parameters: {
          minSpread: { value: 0.001, min: 0.0005, max: 0.01, description: 'Spread mínimo para arbitraje' },
          maxExecutionTime: { value: 5, min: 1, max: 30, description: 'Tiempo máximo de ejecución en segundos' },
          slippageTolerance: { value: 0.0005, min: 0.0001, max: 0.002, description: 'Tolerancia a slippage' },
          minVolume: { value: 1000, min: 100, max: 10000, description: 'Volumen mínimo para arbitraje' },
          correlationThreshold: { value: 0.95, min: 0.8, max: 0.99, description: 'Umbral de correlación' }
        },
        performance: {
          winRate: 1.0,
          profitFactor: 4.5,
          sharpeRatio: 3.2,
          maxDrawdown: 0.02,
          avgTradeDuration: 120,
          tradesPerDay: 3
        },
        dependencies: ['multi_exchange_data', 'execution_engine'],
        status: 'active'
      },
      {
        id: 'ai_controller',
        name: 'AI Master Controller',
        type: 'ai_controller',
        description: 'Controlador principal que selecciona la estrategia óptima basada en condiciones de mercado',
        algorithm: 'Red neuronal de políticas que aprende a seleccionar estrategias óptimas',
        parameters: {
          learningRate: { value: 0.001, min: 0.0001, max: 0.01, description: 'Tasa de aprendizaje de la red' },
          batchSize: { value: 32, min: 16, max: 128, description: 'Tamaño del batch de entrenamiento' },
          hiddenLayers: { value: 3, min: 2, max: 5, description: 'Número de capas ocultas' },
          neuronsPerLayer: { value: 128, min: 64, max: 512, description: 'Neuronas por capa' },
          dropoutRate: { value: 0.2, min: 0.1, max: 0.5, description: 'Tasa de dropout' }
        },
        performance: {
          winRate: 0.58,
          profitFactor: 0.9,
          sharpeRatio: 0.8,
          maxDrawdown: 0.12,
          avgTradeDuration: 900,
          tradesPerDay: 12
        },
        dependencies: ['all_modules', 'market_analysis', 'risk_manager'],
        status: 'learning'
      }
    ],
    decisionFlow: [
      { step: 1, module: 'ai_controller', action: 'analyze_market', condition: 'market_data_available', nextStep: 2 },
      { step: 2, module: 'ai_controller', action: 'select_strategy', condition: 'volatility > 0.02', nextStep: 3 },
      { step: 3, module: 'scalper_qlearning', action: 'execute_scalp', condition: 'spread > min_spread', nextStep: 4 },
      { step: 4, module: 'risk_manager', action: 'check_risk', condition: 'position_size < max_size', nextStep: 5 },
      { step: 5, module: 'execution_engine', action: 'place_order', condition: 'all_checks_passed', nextStep: 6 },
      { step: 6, module: 'monitor', action: 'track_position', condition: 'order_filled', nextStep: 7 },
      { step: 7, module: 'scalper_qlearning', action: 'update_q_table', condition: 'trade_closed', nextStep: 1 }
    ],
    riskManagement: {
      maxPositionSize: 10000,
      stopLossPercentage: 0.05,
      takeProfitPercentage: 0.10,
      maxDailyLoss: 500,
      correlationLimit: 0.7
    },
    marketConditions: {
      volatility: 0.025,
      trend: 'bullish',
      volume: 'high',
      liquidity: 'high'
    }
  });

  const [selectedModule, setSelectedModule] = useState<BotModule | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'flow' | 'risk'>('overview');

  const getModuleIcon = (type: string) => {
    switch (type) {
      case 'scalper':
        return <ArrowTrendingUpIcon className="w-5 h-5 text-green-400" />;
      case 'maker':
        return <CurrencyDollarIcon className="w-5 h-5 text-blue-400" />;
      case 'arbitrage':
        return <ChartBarIcon className="w-5 h-5 text-yellow-400" />;
      case 'ai_controller':
        return <CpuChipIcon className="w-5 h-5 text-purple-400" />;
      default:
        return <CogIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400';
      case 'inactive':
        return 'text-gray-400';
      case 'learning':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="w-4 h-4 text-green-400" />;
      case 'inactive':
        return <ExclamationTriangleIcon className="w-4 h-4 text-gray-400" />;
      case 'learning':
        return <ClockIcon className="w-4 h-4 text-yellow-400" />;
      default:
        return <ExclamationTriangleIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'bullish':
        return <ArrowTrendingUpIcon className="w-4 h-4 text-green-400" />;
      case 'bearish':
        return <ArrowTrendingDownIcon className="w-4 h-4 text-red-400" />;
      default:
        return <ChartBarIcon className="w-4 h-4 text-yellow-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <LightBulbIcon className="w-6 h-6 text-blue-400" />
            Análisis de Lógica del Bot
          </h2>
          <p className="text-gray-400 mt-1">
            Comprende cómo funciona la inteligencia artificial del bot de trading
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            <span className="text-green-400 font-medium">
              {logic.modules.filter(m => m.status === 'active').length}
            </span> módulos activos
          </div>
          <div className="text-sm text-gray-400">
            <span className="text-yellow-400 font-medium">
              {logic.modules.filter(m => m.status === 'learning').length}
            </span> aprendiendo
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Resumen', icon: ChartBarIcon },
            { id: 'modules', label: 'Módulos', icon: CpuChipIcon },
            { id: 'flow', label: 'Flujo de Decisión', icon: CogIcon },
            { id: 'risk', label: 'Gestión de Riesgo', icon: ExclamationTriangleIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Market Conditions */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5 text-blue-400" />
              Condiciones de Mercado Actuales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400">Volatilidad</div>
                <div className="text-2xl font-bold text-white">{(logic.marketConditions.volatility * 100).toFixed(2)}%</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400">Tendencia</div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(logic.marketConditions.trend)}
                  <span className="text-lg font-semibold text-white capitalize">
                    {logic.marketConditions.trend}
                  </span>
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400">Volumen</div>
                <div className="text-2xl font-bold text-white capitalize">
                  {logic.marketConditions.volume}
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400">Liquidez</div>
                <div className="text-2xl font-bold text-white capitalize">
                  {logic.marketConditions.liquidity}
                </div>
              </div>
            </div>
          </div>

          {/* Module Performance Summary */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CpuChipIcon className="w-5 h-5 text-purple-400" />
              Rendimiento de Módulos
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {logic.modules.map((module) => (
                <div key={module.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getModuleIcon(module.type)}
                      <span className="font-semibold text-white">{module.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(module.status)}
                      <span className={`text-sm ${getStatusColor(module.status)}`}>
                        {module.status === 'active' ? 'Activo' : 
                         module.status === 'learning' ? 'Aprendiendo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">Win Rate:</span>
                      <span className="text-white ml-2">{(module.performance.winRate * 100).toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Profit Factor:</span>
                      <span className="text-white ml-2">{module.performance.profitFactor.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Sharpe Ratio:</span>
                      <span className="text-white ml-2">{module.performance.sharpeRatio.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Trades/Día:</span>
                      <span className="text-white ml-2">{module.performance.tradesPerDay}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Management Summary */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
              Gestión de Riesgo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400">Posición Máxima</div>
                <div className="text-xl font-bold text-white">${logic.riskManagement.maxPositionSize.toLocaleString()}</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400">Stop Loss</div>
                <div className="text-xl font-bold text-white">{(logic.riskManagement.stopLossPercentage * 100).toFixed(1)}%</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400">Take Profit</div>
                <div className="text-xl font-bold text-white">{(logic.riskManagement.takeProfitPercentage * 100).toFixed(1)}%</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400">Pérdida Diaria Máx</div>
                <div className="text-xl font-bold text-white">${logic.riskManagement.maxDailyLoss}</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-400">Límite Correlación</div>
                <div className="text-xl font-bold text-white">{(logic.riskManagement.correlationLimit * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modules Tab */}
      {activeTab === 'modules' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {logic.modules.map((module) => (
              <div 
                key={module.id} 
                className={`bg-gray-800 rounded-lg p-6 border cursor-pointer transition-all hover:border-blue-500 ${
                  selectedModule?.id === module.id ? 'border-blue-500' : 'border-gray-700'
                }`}
                onClick={() => setSelectedModule(module)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getModuleIcon(module.type)}
                    <div>
                      <h3 className="text-lg font-semibold text-white">{module.name}</h3>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(module.status)}
                        <span className={`text-sm ${getStatusColor(module.status)}`}>
                          {module.status === 'active' ? 'Activo' : 
                           module.status === 'learning' ? 'Aprendiendo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-gray-300 text-sm mb-4">{module.description}</p>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-400">Algoritmo:</span>
                    <p className="text-sm text-white">{module.algorithm}</p>
                  </div>
                  
                  <div>
                    <span className="text-sm text-gray-400">Dependencias:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {module.dependencies.map((dep) => (
                        <span key={dep} className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded text-xs">
                          {dep.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Module Detail */}
          {selectedModule && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">{selectedModule.name}</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Parámetros</h4>
                  <div className="space-y-3">
                    {Object.entries(selectedModule.parameters).map(([key, param]) => (
                      <div key={key} className="bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-300">{key}</span>
                          <span className="text-sm text-white">{param.value}</span>
                        </div>
                        <div className="text-xs text-gray-400 mb-2">{param.description}</div>
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ 
                              width: `${((param.value - param.min) / (param.max - param.min)) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>{param.min}</span>
                          <span>{param.max}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Métricas de Rendimiento</h4>
                  <div className="space-y-3">
                    <div className="bg-gray-700 rounded-lg p-3">
                      <div className="text-sm text-gray-400">Win Rate</div>
                      <div className="text-2xl font-bold text-white">{(selectedModule.performance.winRate * 100).toFixed(1)}%</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-3">
                      <div className="text-sm text-gray-400">Profit Factor</div>
                      <div className="text-2xl font-bold text-white">{selectedModule.performance.profitFactor.toFixed(2)}</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-3">
                      <div className="text-sm text-gray-400">Sharpe Ratio</div>
                      <div className="text-2xl font-bold text-white">{selectedModule.performance.sharpeRatio.toFixed(2)}</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-3">
                      <div className="text-sm text-gray-400">Max Drawdown</div>
                      <div className="text-2xl font-bold text-red-400">{(selectedModule.performance.maxDrawdown * 100).toFixed(1)}%</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-3">
                      <div className="text-sm text-gray-400">Duración Promedio</div>
                      <div className="text-2xl font-bold text-white">{selectedModule.performance.avgTradeDuration}s</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-3">
                      <div className="text-sm text-gray-400">Trades por Día</div>
                      <div className="text-2xl font-bold text-white">{selectedModule.performance.tradesPerDay}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Decision Flow Tab */}
      {activeTab === 'flow' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CogIcon className="w-5 h-5 text-blue-400" />
              Flujo de Decisión del Bot
            </h3>
            <div className="space-y-4">
              {logic.decisionFlow.map((step, index) => (
                <div key={step.step} className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {step.step}
                  </div>
                  <div className="flex-1 bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white">{step.module}</span>
                      <span className="text-sm text-gray-400">Paso {step.step}</span>
                    </div>
                    <div className="text-sm text-gray-300 mb-2">
                      <span className="text-blue-400">Acción:</span> {step.action}
                    </div>
                    <div className="text-sm text-gray-300">
                      <span className="text-green-400">Condición:</span> {step.condition}
                    </div>
                  </div>
                  {step.nextStep && (
                    <div className="flex-shrink-0">
                      <ArrowTrendingDownIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Risk Management Tab */}
      {activeTab === 'risk' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
              Configuración de Gestión de Riesgo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Posición Máxima (USDT)
                  </label>
                  <input
                    type="number"
                    value={logic.riskManagement.maxPositionSize}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Stop Loss (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={logic.riskManagement.stopLossPercentage * 100}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Take Profit (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={logic.riskManagement.takeProfitPercentage * 100}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Pérdida Diaria Máxima (USDT)
                  </label>
                  <input
                    type="number"
                    value={logic.riskManagement.maxDailyLoss}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Límite de Correlación (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={logic.riskManagement.correlationLimit * 100}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="pt-4">
                  <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                    Guardar Configuración de Riesgo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





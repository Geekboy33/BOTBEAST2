// src/components/MLDashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ScatterChart, Scatter,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

interface ModelPerformance {
  name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  lastTrained: Date;
  status: 'active' | 'training' | 'retired';
}

interface FeatureImportance {
  feature: string;
  importance: number;
  category: 'technical' | 'fundamental' | 'sentiment' | 'volume';
}

interface PredictionAccuracy {
  date: string;
  actual: number;
  predicted: number;
  error: number;
}

interface TrainingMetrics {
  epoch: number;
  loss: number;
  accuracy: number;
  valLoss: number;
  valAccuracy: number;
}

export default function MLDashboard() {
  const [modelPerformance, setModelPerformance] = useState<ModelPerformance[]>([]);
  const [featureImportance, setFeatureImportance] = useState<FeatureImportance[]>([]);
  const [predictionAccuracy, setPredictionAccuracy] = useState<PredictionAccuracy[]>([]);
  const [trainingMetrics, setTrainingMetrics] = useState<TrainingMetrics[]>([]);
  const [activeTab, setActiveTab] = useState<'models' | 'features' | 'predictions' | 'training'>('models');
  const [isRetraining, setIsRetraining] = useState(false);

  useEffect(() => {
    // Load ML data
    const mockModels: ModelPerformance[] = [
      {
        name: 'Q-Learning Scalper',
        accuracy: 0.847,
        precision: 0.823,
        recall: 0.856,
        f1Score: 0.839,
        lastTrained: new Date('2024-01-15'),
        status: 'active'
      },
      {
        name: 'LSTM Price Predictor',
        accuracy: 0.792,
        precision: 0.778,
        recall: 0.801,
        f1Score: 0.789,
        lastTrained: new Date('2024-01-14'),
        status: 'active'
      },
      {
        name: 'Random Forest Classifier',
        accuracy: 0.734,
        precision: 0.721,
        recall: 0.745,
        f1Score: 0.733,
        lastTrained: new Date('2024-01-13'),
        status: 'training'
      },
      {
        name: 'SVM Trend Detector',
        accuracy: 0.681,
        precision: 0.665,
        recall: 0.692,
        f1Score: 0.678,
        lastTrained: new Date('2024-01-10'),
        status: 'retired'
      }
    ];

    const mockFeatures: FeatureImportance[] = [
      { feature: 'RSI', importance: 0.234, category: 'technical' },
      { feature: 'MACD', importance: 0.198, category: 'technical' },
      { feature: 'Volume Spike', importance: 0.187, category: 'volume' },
      { feature: 'Twitter Sentiment', importance: 0.156, category: 'sentiment' },
      { feature: 'Order Book Imbalance', importance: 0.134, category: 'technical' },
      { feature: 'Price Momentum', importance: 0.123, category: 'technical' },
      { feature: 'Market Cap', importance: 0.098, category: 'fundamental' },
      { feature: 'News Sentiment', importance: 0.087, category: 'sentiment' },
      { feature: 'Volatility', importance: 0.076, category: 'technical' },
      { feature: 'Social Volume', importance: 0.065, category: 'sentiment' }
    ];

    const mockPredictions: PredictionAccuracy[] = Array.from({ length: 30 }, (_, i) => {
      const actual = 45000 + Math.random() * 5000;
      const predicted = actual + (Math.random() - 0.5) * 1000;
      return {
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        actual,
        predicted,
        error: Math.abs(actual - predicted)
      };
    });

    const mockTraining: TrainingMetrics[] = Array.from({ length: 50 }, (_, i) => ({
      epoch: i + 1,
      loss: 0.8 * Math.exp(-i / 20) + 0.1 + Math.random() * 0.05,
      accuracy: Math.min(0.95, 0.5 + (i / 50) * 0.45 + Math.random() * 0.02),
      valLoss: 0.9 * Math.exp(-i / 25) + 0.15 + Math.random() * 0.05,
      valAccuracy: Math.min(0.92, 0.45 + (i / 50) * 0.47 + Math.random() * 0.02)
    }));

    setModelPerformance(mockModels);
    setFeatureImportance(mockFeatures);
    setPredictionAccuracy(mockPredictions);
    setTrainingMetrics(mockTraining);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'training': return 'text-yellow-400';
      case 'retired': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🟢';
      case 'training': return '🟡';
      case 'retired': return '🔴';
      default: return '⚪';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical': return '#10B981';
      case 'fundamental': return '#3B82F6';
      case 'sentiment': return '#F59E0B';
      case 'volume': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const retrainModel = async (modelName: string) => {
    setIsRetraining(true);
    // Simulate retraining
    setTimeout(() => {
      setModelPerformance(prev => prev.map(model => 
        model.name === modelName 
          ? { ...model, lastTrained: new Date(), status: 'active' }
          : model
      ));
      setIsRetraining(false);
    }, 3000);
  };

  const getModelRanking = () => {
    return modelPerformance
      .filter(model => model.status === 'active')
      .sort((a, b) => b.f1Score - a.f1Score);
  };

  const getFeatureRadarData = () => {
    const categories = ['technical', 'fundamental', 'sentiment', 'volume'];
    return categories.map(category => {
      const features = featureImportance.filter(f => f.category === category);
      const avgImportance = features.reduce((sum, f) => sum + f.importance, 0) / features.length;
      return {
        category: category.charAt(0).toUpperCase() + category.slice(1),
        importance: avgImportance * 100
      };
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Machine Learning Dashboard</h3>
        <div className="flex space-x-2">
          {(['models', 'features', 'predictions', 'training'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded text-sm ${
                activeTab === tab ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              {tab === 'models' && 'Modelos'}
              {tab === 'features' && 'Características'}
              {tab === 'predictions' && 'Predicciones'}
              {tab === 'training' && 'Entrenamiento'}
            </button>
          ))}
        </div>
      </div>

      {/* Models Tab */}
      {activeTab === 'models' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold">Rendimiento de Modelos</h4>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isRetraining ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
              <span className="text-sm text-gray-400">
                {isRetraining ? 'Reentrenando...' : 'Sistema Activo'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h5 className="font-semibold mb-4">Ranking de Modelos</h5>
              <div className="space-y-3">
                {getModelRanking().map((model, index) => (
                  <div key={model.name} className="bg-gray-700 p-4 rounded">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-500 text-black' :
                          index === 1 ? 'bg-gray-400 text-black' :
                          index === 2 ? 'bg-orange-500 text-black' :
                          'bg-gray-600 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h6 className="font-semibold">{model.name}</h6>
                          <div className="flex items-center space-x-2">
                            <span>{getStatusIcon(model.status)}</span>
                            <span className={`text-sm ${getStatusColor(model.status)}`}>
                              {model.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-semibold">
                          {(model.f1Score * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-400">F1 Score</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                      <div className="text-center">
                        <div className="text-blue-400 font-semibold">
                          {(model.accuracy * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400">Accuracy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-yellow-400 font-semibold">
                          {(model.precision * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400">Precision</div>
                      </div>
                      <div className="text-center">
                        <div className="text-purple-400 font-semibold">
                          {(model.recall * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400">Recall</div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">
                          Último entrenamiento: {model.lastTrained.toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => retrainModel(model.name)}
                          disabled={isRetraining}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-3 py-1 rounded text-sm"
                        >
                          Reentrenar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h5 className="font-semibold mb-4">Comparación de Métricas</h5>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={getModelRanking().slice(0, 3)}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" />
                  <PolarRadiusAxis domain={[0, 1]} />
                  <Radar
                    name="Accuracy"
                    dataKey="accuracy"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="Precision"
                    dataKey="precision"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="Recall"
                    dataKey="recall"
                    stroke="#F59E0B"
                    fill="#F59E0B"
                    fillOpacity={0.3}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Features Tab */}
      {activeTab === 'features' && (
        <div className="space-y-6">
          <h4 className="font-semibold">Importancia de Características</h4>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h5 className="font-semibold mb-4">Top Características</h5>
              <div className="space-y-2">
                {featureImportance.slice(0, 8).map((feature, index) => (
                  <div key={feature.feature} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: getCategoryColor(feature.category) }} />
                      <div>
                        <div className="font-semibold">{feature.feature}</div>
                        <div className="text-sm text-gray-400 capitalize">{feature.category}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{(feature.importance * 100).toFixed(1)}%</div>
                      <div className="w-24 bg-gray-600 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full"
                          style={{ 
                            width: `${feature.importance * 100}%`,
                            backgroundColor: getCategoryColor(feature.category)
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h5 className="font-semibold mb-4">Distribución por Categoría</h5>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={getFeatureRadarData()}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis domain={[0, 25]} />
                  <Radar
                    name="Importance"
                    dataKey="importance"
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-700 p-4 rounded">
            <h5 className="font-semibold mb-4">Categorías de Características</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['technical', 'fundamental', 'sentiment', 'volume'].map(category => {
                const features = featureImportance.filter(f => f.category === category);
                const avgImportance = features.reduce((sum, f) => sum + f.importance, 0) / features.length;
                return (
                  <div key={category} className="text-center">
                    <div 
                      className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: getCategoryColor(category) }}
                    >
                      {features.length}
                    </div>
                    <div className="font-semibold capitalize">{category}</div>
                    <div className="text-sm text-gray-400">
                      {(avgImportance * 100).toFixed(1)}% avg
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Predictions Tab */}
      {activeTab === 'predictions' && (
        <div className="space-y-6">
          <h4 className="font-semibold">Precisión de Predicciones</h4>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h5 className="font-semibold mb-4">Predicciones vs Realidad</h5>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={predictionAccuracy.slice(-15)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number, name: string) => [
                    `$${value.toLocaleString()}`,
                    name === 'actual' ? 'Real' : 'Predicho'
                  ]} />
                  <Legend />
                  <Line type="monotone" dataKey="actual" stroke="#10B981" strokeWidth={2} />
                  <Line type="monotone" dataKey="predicted" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h5 className="font-semibold mb-4">Error de Predicción</h5>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={predictionAccuracy.slice(-15)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Error']} />
                  <Area type="monotone" dataKey="error" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700 p-4 rounded text-center">
              <h5 className="font-semibold text-green-400">MAE</h5>
              <p className="text-2xl font-bold">
                ${(predictionAccuracy.reduce((sum, p) => sum + p.error, 0) / predictionAccuracy.length).toFixed(2)}
              </p>
              <p className="text-sm text-gray-400">Error Absoluto Medio</p>
            </div>
            <div className="bg-gray-700 p-4 rounded text-center">
              <h5 className="font-semibold text-blue-400">RMSE</h5>
              <p className="text-2xl font-bold">
                ${Math.sqrt(predictionAccuracy.reduce((sum, p) => sum + p.error * p.error, 0) / predictionAccuracy.length).toFixed(2)}
              </p>
              <p className="text-sm text-gray-400">Raíz del Error Cuadrático</p>
            </div>
            <div className="bg-gray-700 p-4 rounded text-center">
              <h5 className="font-semibold text-yellow-400">R²</h5>
              <p className="text-2xl font-bold">0.847</p>
              <p className="text-sm text-gray-400">Coeficiente de Determinación</p>
            </div>
          </div>
        </div>
      )}

      {/* Training Tab */}
      {activeTab === 'training' && (
        <div className="space-y-6">
          <h4 className="font-semibold">Métricas de Entrenamiento</h4>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h5 className="font-semibold mb-4">Loss y Accuracy</h5>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trainingMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="epoch" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="loss" stroke="#EF4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="valLoss" stroke="#F59E0B" strokeWidth={2} />
                  <Line type="monotone" dataKey="accuracy" stroke="#10B981" strokeWidth={2} />
                  <Line type="monotone" dataKey="valAccuracy" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h5 className="font-semibold mb-4">Progreso del Entrenamiento</h5>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Loss</span>
                    <span>{trainingMetrics[trainingMetrics.length - 1]?.loss.toFixed(4)}</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(1 - trainingMetrics[trainingMetrics.length - 1]?.loss) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Accuracy</span>
                    <span>{(trainingMetrics[trainingMetrics.length - 1]?.accuracy * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${trainingMetrics[trainingMetrics.length - 1]?.accuracy * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Validation Loss</span>
                    <span>{trainingMetrics[trainingMetrics.length - 1]?.valLoss.toFixed(4)}</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(1 - trainingMetrics[trainingMetrics.length - 1]?.valLoss) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Validation Accuracy</span>
                    <span>{(trainingMetrics[trainingMetrics.length - 1]?.valAccuracy * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${trainingMetrics[trainingMetrics.length - 1]?.valAccuracy * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-700 p-4 rounded">
            <h5 className="font-semibold mb-4">Estado del Entrenamiento</h5>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">50</div>
                <div className="text-sm text-gray-400">Épocas Completadas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">94.2%</div>
                <div className="text-sm text-gray-400">Accuracy Final</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">0.089</div>
                <div className="text-sm text-gray-400">Loss Final</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">2.3h</div>
                <div className="text-sm text-gray-400">Tiempo Total</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





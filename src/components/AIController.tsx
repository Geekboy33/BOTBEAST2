import React, { useState, useEffect } from 'react';

interface AIStatus {
  autopilot_enabled: boolean;
  ollama_connected: boolean;
  model: string;
  accuracy: number;
  predictions_today: number;
  confidence: number;
}

const AIController: React.FC = () => {
  const [aiStatus, setAIStatus] = useState<AIStatus>({
    autopilot_enabled: false,
    ollama_connected: true,
    model: 'gpt-oss:120b',
    accuracy: 0.85,
    predictions_today: 120,
    confidence: 0.78
  });

  const [riskLevel, setRiskLevel] = useState<'conservative' | 'risky' | 'turbo'>('conservative');
  const [maxLeverage, setMaxLeverage] = useState(2);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7);

  const toggleAutopilot = async () => {
    try {
      const endpoint = aiStatus.autopilot_enabled ? '/api/bot/stop' : '/api/bot/start';
      const response = await fetch(endpoint, { method: 'POST' });
      
      if (response.ok) {
        setAIStatus(prev => ({
          ...prev,
          autopilot_enabled: !prev.autopilot_enabled
        }));
      }
    } catch (error) {
      console.error('Error toggling autopilot:', error);
    }
  };

  const updateRiskLevel = async (newLevel: 'conservative' | 'risky' | 'turbo') => {
    setRiskLevel(newLevel);
    
    // Update leverage based on risk level
    const leverageMap = {
      conservative: 2,
      risky: 5,
      turbo: 10
    };
    setMaxLeverage(leverageMap[newLevel]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">🧠 AI Controller</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${aiStatus.ollama_connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm text-gray-400">Ollama {aiStatus.ollama_connected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <button
            onClick={toggleAutopilot}
            className={`px-6 py-2 rounded font-semibold ${
              aiStatus.autopilot_enabled 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {aiStatus.autopilot_enabled ? 'STOP AUTOPILOT' : 'START AUTOPILOT'}
          </button>
        </div>
      </div>

      {/* AI Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Autopilot Status</h3>
              <p className={`text-2xl font-bold ${aiStatus.autopilot_enabled ? 'text-green-400' : 'text-red-400'}`}>
                {aiStatus.autopilot_enabled ? 'ACTIVE' : 'INACTIVE'}
              </p>
            </div>
            <div className="text-3xl">🤖</div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">AI Model</h3>
              <p className="text-lg font-bold text-blue-400">{aiStatus.model}</p>
            </div>
            <div className="text-3xl">🧠</div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Accuracy</h3>
              <p className="text-2xl font-bold text-green-400">{(aiStatus.accuracy * 100).toFixed(1)}%</p>
            </div>
            <div className="text-3xl">🎯</div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Predictions Today</h3>
              <p className="text-2xl font-bold text-purple-400">{aiStatus.predictions_today}</p>
            </div>
            <div className="text-3xl">🔮</div>
          </div>
        </div>
      </div>

      {/* AI Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">AI Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Risk Level</label>
              <div className="grid grid-cols-3 gap-2">
                {(['conservative', 'risky', 'turbo'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => updateRiskLevel(level)}
                    className={`p-3 rounded font-semibold text-sm ${
                      riskLevel === level 
                        ? 'bg-yellow-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                    <div className="text-xs mt-1">
                      {level === 'conservative' && '1-2x'}
                      {level === 'risky' && '3-5x'}
                      {level === 'turbo' && '6-10x'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Max Leverage</label>
              <input
                type="number"
                min="1"
                max="10"
                value={maxLeverage}
                onChange={(e) => setMaxLeverage(parseInt(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Confidence Threshold</label>
              <input
                type="number"
                min="0.1"
                max="1"
                step="0.1"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-300">Enable Autopilot</span>
              <button
                onClick={toggleAutopilot}
                className={`w-12 h-6 rounded-full transition-colors ${
                  aiStatus.autopilot_enabled ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  aiStatus.autopilot_enabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}></div>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">AI Performance</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-700 rounded">
                <div className="text-2xl font-bold text-green-400">{(aiStatus.accuracy * 100).toFixed(1)}%</div>
                <div className="text-sm text-gray-400">Accuracy</div>
              </div>
              <div className="text-center p-4 bg-gray-700 rounded">
                <div className="text-2xl font-bold text-blue-400">{(aiStatus.confidence * 100).toFixed(1)}%</div>
                <div className="text-sm text-gray-400">Confidence</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Model:</span>
                <span className="text-white font-semibold">{aiStatus.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Predictions Today:</span>
                <span className="text-white font-semibold">{aiStatus.predictions_today}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Risk Level:</span>
                <span className="text-white font-semibold capitalize">{riskLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Max Leverage:</span>
                <span className="text-white font-semibold">{maxLeverage}x</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Strategies */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">🎯 Active AI Strategies</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Support/Resistance', enabled: true, confidence: 0.82 },
            { name: 'ICT Techniques', enabled: true, confidence: 0.78 },
            { name: 'Fibonacci Analysis', enabled: true, confidence: 0.85 },
            { name: 'Session Analysis', enabled: true, confidence: 0.73 },
            { name: 'Channel Analysis', enabled: false, confidence: 0.69 },
            { name: 'Spread Analysis', enabled: true, confidence: 0.76 }
          ].map((strategy, index) => (
            <div key={index} className="bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white">{strategy.name}</h4>
                <div className={`w-3 h-3 rounded-full ${strategy.enabled ? 'bg-green-600' : 'bg-gray-600'}`}></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Confidence:</span>
                <span className="text-white font-semibold">{(strategy.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIController;
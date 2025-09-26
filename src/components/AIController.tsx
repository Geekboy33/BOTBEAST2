import React, { useState, useEffect } from 'react';

interface AIStatus {
  ollama_connected: boolean;
  model: string;
  accuracy: number;
  predictions_today: number;
  last_prediction: string;
}

export default function AIController() {
  const [aiStatus, setAIStatus] = useState<AIStatus>({
    ollama_connected: true,
    model: 'gpt-oss:120b',
    accuracy: 0.85,
    predictions_today: 120,
    last_prediction: new Date().toISOString()
  });

  const [autopilotEnabled, setAutopilotEnabled] = useState(false);
  const [riskLevel, setRiskLevel] = useState<'conservative' | 'risky' | 'turbo'>('conservative');
  const [maxLeverage, setMaxLeverage] = useState(2);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7);

  useEffect(() => {
    loadAIStatus();
    const interval = setInterval(loadAIStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadAIStatus = async () => {
    try {
      const response = await fetch('/api/ai/status');
      if (response.ok) {
        const data = await response.json();
        setAIStatus(data);
      }
    } catch (error) {
      console.log('Using mock AI data');
    }
  };

  const toggleAutopilot = async () => {
    try {
      const endpoint = autopilotEnabled ? '/api/bot/stop' : '/api/bot/start';
      const response = await fetch(endpoint, { method: 'POST' });
      
      if (response.ok) {
        setAutopilotEnabled(!autopilotEnabled);
      }
    } catch (error) {
      console.error('Error toggling autopilot:', error);
    }
  };

  const updateRiskLevel = async (newLevel: 'conservative' | 'risky' | 'turbo') => {
    try {
      const response = await fetch('/api/risk/set-level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ risk_level: newLevel })
      });
      
      if (response.ok) {
        setRiskLevel(newLevel);
        
        // Update leverage based on risk level
        const leverageMap = {
          conservative: 2,
          risky: 5,
          turbo: 10
        };
        setMaxLeverage(leverageMap[newLevel]);
      }
    } catch (error) {
      console.error('Error updating risk level:', error);
    }
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
              autopilotEnabled 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {autopilotEnabled ? 'STOP AUTOPILOT' : 'START AUTOPILOT'}
          </button>
        </div>
      </div>

      {/* AI Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Autopilot Status</h3>
              <p className={`text-2xl font-bold ${autopilotEnabled ? 'text-green-400' : 'text-red-400'}`}>
                {autopilotEnabled ? 'ACTIVE' : 'INACTIVE'}
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
                <div className="text-2xl font-bold text-blue-400">{aiStatus.predictions_today}</div>
                <div className="text-sm text-gray-400">Predictions</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Model:</span>
                <span className="text-white font-semibold">{aiStatus.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Risk Level:</span>
                <span className="text-white font-semibold capitalize">{riskLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Max Leverage:</span>
                <span className="text-white font-semibold">{maxLeverage}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Confidence:</span>
                <span className="text-white font-semibold">{confidenceThreshold}</span>
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
}
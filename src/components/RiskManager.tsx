import React, { useState, useEffect } from 'react';

const RiskManager: React.FC = () => {
  const [riskLevel, setRiskLevel] = useState<'conservative' | 'risky' | 'turbo'>('conservative');
  const [maxExposure, setMaxExposure] = useState(0.15);
  const [currentExposure, setCurrentExposure] = useState(0.08);
  const [stopLoss, setStopLoss] = useState(2.0);
  const [takeProfit, setTakeProfit] = useState(5.0);

  const riskProfiles = {
    conservative: {
      max_leverage: 2.0,
      position_size: 0.02,
      stop_loss: 0.01,
      take_profit: 0.02,
      description: 'Low risk, stable returns'
    },
    risky: {
      max_leverage: 5.0,
      position_size: 0.05,
      stop_loss: 0.015,
      take_profit: 0.03,
      description: 'Medium risk, higher returns'
    },
    turbo: {
      max_leverage: 10.0,
      position_size: 0.10,
      stop_loss: 0.02,
      take_profit: 0.05,
      description: 'High risk, maximum returns'
    }
  };

  const updateRiskLevel = (newLevel: 'conservative' | 'risky' | 'turbo') => {
    setRiskLevel(newLevel);
    const profile = riskProfiles[newLevel];
    setStopLoss(profile.stop_loss * 100);
    setTakeProfit(profile.take_profit * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">⚖️ Risk Management</h2>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-400">Current Exposure</div>
            <div className="text-xl font-bold text-yellow-400">{(currentExposure * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Risk Level Selection */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Risk Level Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(riskProfiles).map(([level, profile]) => (
            <div
              key={level}
              onClick={() => updateRiskLevel(level as any)}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                riskLevel === level 
                  ? 'border-yellow-400 bg-yellow-400/10' 
                  : 'border-gray-600 bg-gray-700 hover:border-gray-500'
              }`}
            >
              <h4 className="text-lg font-semibold text-white mb-2 capitalize">{level}</h4>
              <p className="text-sm text-gray-400 mb-4">{profile.description}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Leverage:</span>
                  <span className="text-white font-semibold">{profile.max_leverage}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Position Size:</span>
                  <span className="text-white font-semibold">{(profile.position_size * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Stop Loss:</span>
                  <span className="text-white font-semibold">{(profile.stop_loss * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Take Profit:</span>
                  <span className="text-white font-semibold">{(profile.take_profit * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white">Max Exposure</h3>
          <div className="text-2xl font-bold text-red-400">{(maxExposure * 100).toFixed(1)}%</div>
          <div className="text-sm text-gray-400">Portfolio limit</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white">Current Exposure</h3>
          <div className="text-2xl font-bold text-yellow-400">{(currentExposure * 100).toFixed(1)}%</div>
          <div className="text-sm text-gray-400">Active positions</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white">Stop Loss</h3>
          <div className="text-2xl font-bold text-red-400">{stopLoss.toFixed(1)}%</div>
          <div className="text-sm text-gray-400">Auto stop loss</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white">Take Profit</h3>
          <div className="text-2xl font-bold text-green-400">{takeProfit.toFixed(1)}%</div>
          <div className="text-sm text-gray-400">Auto take profit</div>
        </div>
      </div>

      {/* Risk Controls */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Risk Controls</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Max Exposure (%)</label>
              <input
                type="number"
                min="1"
                max="50"
                step="0.1"
                value={maxExposure * 100}
                onChange={(e) => setMaxExposure(parseFloat(e.target.value) / 100)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Stop Loss (%)</label>
              <input
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={stopLoss}
                onChange={(e) => setStopLoss(parseFloat(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Take Profit (%)</label>
              <input
                type="number"
                min="0.1"
                max="20"
                step="0.1"
                value={takeProfit}
                onChange={(e) => setTakeProfit(parseFloat(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-red-900/20 border border-red-600 rounded-lg">
              <h4 className="font-semibold text-red-400 mb-2">⚠️ Risk Warning</h4>
              <p className="text-sm text-red-200">
                High leverage trading carries significant risk. Only use leverage you can afford to lose.
                The system will automatically reduce leverage if drawdown exceeds limits.
              </p>
            </div>

            <div className="p-4 bg-blue-900/20 border border-blue-600 rounded-lg">
              <h4 className="font-semibold text-blue-400 mb-2">🛡️ Protection Features</h4>
              <ul className="text-sm text-blue-200 space-y-1">
                <li>• Automatic stop loss execution</li>
                <li>• Position size limits</li>
                <li>• Drawdown protection</li>
                <li>• Emergency stop functionality</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Current Risk Status */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Current Risk Status</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Portfolio Exposure</span>
              <span className="text-white">{(currentExposure * 100).toFixed(1)}% / {(maxExposure * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all ${
                  currentExposure / maxExposure > 0.8 ? 'bg-red-500' :
                  currentExposure / maxExposure > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${(currentExposure / maxExposure) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-700 rounded">
              <div className="text-lg font-bold text-green-400">SAFE</div>
              <div className="text-sm text-gray-400">Risk Level</div>
            </div>
            <div className="text-center p-3 bg-gray-700 rounded">
              <div className="text-lg font-bold text-blue-400">1.85</div>
              <div className="text-sm text-gray-400">Sharpe Ratio</div>
            </div>
            <div className="text-center p-3 bg-gray-700 rounded">
              <div className="text-lg font-bold text-yellow-400">2.3%</div>
              <div className="text-sm text-gray-400">Max Drawdown</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskManager;
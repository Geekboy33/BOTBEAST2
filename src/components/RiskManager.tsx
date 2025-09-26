import React, { useState, useEffect } from 'react';

interface RiskLevel {
  max_leverage: number;
  position_size: number;
  stop_loss: number;
  take_profit: number;
  description: string;
}

interface RiskData {
  current_level: string;
  available_levels: Record<string, RiskLevel>;
  current_exposure: number;
  max_exposure: number;
}

export default function RiskManager() {
  const [riskData, setRiskData] = useState<RiskData>({
    current_level: 'conservative',
    available_levels: {
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
    },
    current_exposure: 0.08,
    max_exposure: 0.15
  });

  useEffect(() => {
    loadRiskData();
  }, []);

  const loadRiskData = async () => {
    try {
      const response = await fetch('/api/risk/levels');
      if (response.ok) {
        const data = await response.json();
        setRiskData(data);
      }
    } catch (error) {
      console.log('Using mock risk data');
    }
  };

  const updateRiskLevel = async (newLevel: string) => {
    try {
      const response = await fetch('/api/risk/set-level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ risk_level: newLevel })
      });
      
      if (response.ok) {
        setRiskData(prev => ({ ...prev, current_level: newLevel }));
      }
    } catch (error) {
      console.error('Error updating risk level:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">⚖️ Risk Management</h2>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-400">Current Exposure</div>
            <div className="text-xl font-bold text-yellow-400">{(riskData.current_exposure * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Risk Level Selection */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Risk Level Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(riskData.available_levels).map(([level, profile]) => (
            <div
              key={level}
              onClick={() => updateRiskLevel(level)}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                riskData.current_level === level 
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
          <div className="text-2xl font-bold text-red-400">{(riskData.max_exposure * 100).toFixed(1)}%</div>
          <div className="text-sm text-gray-400">Portfolio limit</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white">Current Exposure</h3>
          <div className="text-2xl font-bold text-yellow-400">{(riskData.current_exposure * 100).toFixed(1)}%</div>
          <div className="text-sm text-gray-400">Active positions</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white">Stop Loss</h3>
          <div className="text-2xl font-bold text-red-400">
            {(riskData.available_levels[riskData.current_level].stop_loss * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-400">Auto stop loss</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white">Take Profit</h3>
          <div className="text-2xl font-bold text-green-400">
            {(riskData.available_levels[riskData.current_level].take_profit * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-400">Auto take profit</div>
        </div>
      </div>

      {/* Current Risk Status */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Current Risk Status</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Portfolio Exposure</span>
              <span className="text-white">{(riskData.current_exposure * 100).toFixed(1)}% / {(riskData.max_exposure * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all ${
                  riskData.current_exposure / riskData.max_exposure > 0.8 ? 'bg-red-500' :
                  riskData.current_exposure / riskData.max_exposure > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${(riskData.current_exposure / riskData.max_exposure) * 100}%` }}
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
}
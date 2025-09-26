import React, { useState, useEffect } from 'react';

interface LogEntry {
  timestamp: string;
  level: string;
  module: string;
  message: string;
}

export default function SystemLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Simulate WebSocket connection for logs
    setIsConnected(true);
    
    // Generate mock logs
    const generateLog = () => {
      const modules = [
        'SCALPER_ENGINE', 'MARKET_MAKER', 'ARBITRAGE_ENGINE', 'AI_CONTROLLER',
        'VIRTUAL_TRADER', 'PAIR_SCANNER', 'NEWS_FILTER', 'RISK_MANAGER',
        'SUPPORT_RESISTANCE', 'ICT_ANALYSIS', 'FIBONACCI_ANALYSIS', 
        'SESSION_ANALYSIS', 'SPREAD_ANALYSIS', 'CHANNEL_ANALYSIS',
        'AUTOPILOT_ENGINE', 'OPPORTUNITY_DETECTOR'
      ];
      
      const messages = [
        'Signal generated for BTCUSDT',
        'Analysis completed with 85% confidence',
        'Position opened: LONG ETHUSDT @ 3120',
        'Risk check passed - exposure within limits',
        'Opportunity detected with 0.8 confidence',
        'Order executed successfully',
        'Stop loss triggered for ADAUSDT',
        'Take profit reached for SOLUSDT',
        'Market structure analysis: Bullish',
        'Fibonacci level touched at 0.618',
        'Session overlap detected: EU/US',
        'Spread compression identified',
        'Channel breakout confirmed',
        'News sentiment: Positive (0.75)',
        'AI prediction accuracy: 87%',
        'Virtual trade closed: +$25.50'
      ];

      const levels = ['INFO', 'WARNING', 'ERROR', 'SUCCESS'];
      
      const newLog: LogEntry = {
        timestamp: new Date().toISOString(),
        level: levels[Math.floor(Math.random() * levels.length)],
        module: modules[Math.floor(Math.random() * modules.length)],
        message: messages[Math.floor(Math.random() * messages.length)]
      };

      setLogs(prev => [newLog, ...prev.slice(0, 199)]); // Keep last 200 logs
    };

    // Generate initial logs
    for (let i = 0; i < 20; i++) {
      setTimeout(generateLog, i * 100);
    }

    // Continue generating logs
    const interval = setInterval(generateLog, 2000);
    return () => clearInterval(interval);
  }, []);

  const getLogColor = (level: string) => {
    switch (level) {
      case 'INFO': return 'text-blue-400';
      case 'WARNING': return 'text-yellow-400';
      case 'ERROR': return 'text-red-400';
      case 'SUCCESS': return 'text-green-400';
      default: return 'text-white';
    }
  };

  const getModuleColor = (module: string) => {
    const colors: Record<string, string> = {
      'SCALPER_ENGINE': 'text-green-400',
      'MARKET_MAKER': 'text-blue-400',
      'ARBITRAGE_ENGINE': 'text-yellow-400',
      'AI_CONTROLLER': 'text-purple-400',
      'VIRTUAL_TRADER': 'text-cyan-400',
      'PAIR_SCANNER': 'text-orange-400',
      'NEWS_FILTER': 'text-pink-400',
      'RISK_MANAGER': 'text-red-400',
      'SUPPORT_RESISTANCE': 'text-indigo-400',
      'ICT_ANALYSIS': 'text-teal-400',
      'FIBONACCI_ANALYSIS': 'text-lime-400',
      'SESSION_ANALYSIS': 'text-amber-400',
      'SPREAD_ANALYSIS': 'text-emerald-400',
      'CHANNEL_ANALYSIS': 'text-violet-400',
      'AUTOPILOT_ENGINE': 'text-fuchsia-400',
      'OPPORTUNITY_DETECTOR': 'text-rose-400'
    };
    return colors[module] || 'text-white';
  };

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.level === filter || log.module === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">📋 System Logs</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
            <span className="text-sm text-gray-400">
              {isConnected ? 'Live Stream Active' : 'Disconnected'}
            </span>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
          >
            <option value="all">All Logs</option>
            <option value="INFO">Info</option>
            <option value="WARNING">Warnings</option>
            <option value="ERROR">Errors</option>
            <option value="SUCCESS">Success</option>
          </select>
        </div>
      </div>

      {/* Log Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-white">Total Logs</h3>
          <div className="text-2xl font-bold text-blue-400">{logs.length}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-white">Info</h3>
          <div className="text-2xl font-bold text-blue-400">
            {logs.filter(log => log.level === 'INFO').length}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-white">Warnings</h3>
          <div className="text-2xl font-bold text-yellow-400">
            {logs.filter(log => log.level === 'WARNING').length}
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-white">Errors</h3>
          <div className="text-2xl font-bold text-red-400">
            {logs.filter(log => log.level === 'ERROR').length}
          </div>
        </div>
      </div>

      {/* Logs Display */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Real-time System Logs</h3>
        </div>
        <div className="p-4 h-96 overflow-y-auto bg-black rounded-b-lg font-mono text-sm">
          {filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              {isConnected ? 'Waiting for logs...' : 'Connecting to log stream...'}
            </div>
          ) : (
            filteredLogs.map((log, index) => (
              <div key={index} className="mb-1 hover:bg-gray-800 p-1 rounded">
                <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                <span className={`font-semibold ${getLogColor(log.level)}`}>
                  [{log.level}]
                </span>{' '}
                <span className={`font-semibold ${getModuleColor(log.module)}`}>
                  [{log.module}]
                </span>{' '}
                <span className="text-white">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
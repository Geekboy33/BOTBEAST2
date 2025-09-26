import React, { useState, useEffect } from 'react';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  module: string;
}

const SystemLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    // Connect to WebSocket for real-time logs
    const ws = new WebSocket(`ws://${window.location.host}/ws`);
    
    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected for logs');
    };

    ws.onmessage = (event) => {
      try {
        const logEntry: LogEntry = JSON.parse(event.data);
        setLogs(prev => [...prev, logEntry].slice(-200)); // Keep last 200 logs
      } catch (error) {
        console.error('Error parsing log message:', error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
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
      'SYSTEM': 'text-gray-400'
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
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
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
            <option value="SCALPER_ENGINE">Scalper</option>
            <option value="MARKET_MAKER">Market Maker</option>
            <option value="ARBITRAGE_ENGINE">Arbitrage</option>
            <option value="AI_CONTROLLER">AI Controller</option>
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
};

export default SystemLogs;
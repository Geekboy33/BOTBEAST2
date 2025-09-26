import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import TradingInterface from './components/TradingInterface';
import ModulesManager from './components/ModulesManager';
import AnalyticsPanel from './components/AnalyticsPanel';
import ExchangeManager from './components/ExchangeManager';
import AIController from './components/AIController';
import RiskManager from './components/RiskManager';
import PortfolioManager from './components/PortfolioManager';
import SystemLogs from './components/SystemLogs';
import './App.css';

function Navigation() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/trading', label: 'Trading', icon: '💹' },
    { path: '/modules', label: 'Modules', icon: '🤖' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
    { path: '/exchanges', label: 'Exchanges', icon: '🔄' },
    { path: '/ai', label: 'AI Control', icon: '🧠' },
    { path: '/risk', label: 'Risk', icon: '⚖️' },
    { path: '/portfolio', label: 'Portfolio', icon: '💼' },
    { path: '/logs', label: 'Logs', icon: '📋' }
  ];

  return (
    <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-yellow-400">GROK-BEAST</h1>
          <div className="text-sm text-gray-400">Advanced Trading Platform v2.0.0</div>
        </div>
        
        <div className="flex items-center space-x-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                location.pathname === item.path
                  ? 'bg-yellow-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-sm text-green-400">SYSTEM ONLINE</span>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  const [systemStatus, setSystemStatus] = useState({
    status: 'online',
    uptime: '2h 15m',
    total_modules: 16,
    active_modules: 16
  });

  useEffect(() => {
    // Load system status
    const loadStatus = async () => {
      try {
        const response = await fetch('/api/status');
        if (response.ok) {
          const data = await response.json();
          setSystemStatus(data);
        }
      } catch (error) {
        console.log('API not available, using mock data');
      }
    };

    loadStatus();
    const interval = setInterval(loadStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        <Navigation />
        
        <main className="container mx-auto px-6 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/trading" element={<TradingInterface />} />
            <Route path="/modules" element={<ModulesManager />} />
            <Route path="/analytics" element={<AnalyticsPanel />} />
            <Route path="/exchanges" element={<ExchangeManager />} />
            <Route path="/ai" element={<AIController />} />
            <Route path="/risk" element={<RiskManager />} />
            <Route path="/portfolio" element={<PortfolioManager />} />
            <Route path="/logs" element={<SystemLogs />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
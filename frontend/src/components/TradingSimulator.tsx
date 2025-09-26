// src/components/TradingSimulator.tsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  timestamp: Date;
  pnl?: number;
  status: 'open' | 'closed';
}

interface SimulationConfig {
  initialBalance: number;
  leverage: number;
  riskPerTrade: number;
  maxTrades: number;
  strategy: 'scalping' | 'swing' | 'arbitrage' | 'custom';
}

interface CompetitionPlayer {
  id: string;
  name: string;
  balance: number;
  trades: number;
  winRate: number;
  profit: number;
  rank: number;
}

export default function TradingSimulator() {
  const [config, setConfig] = useState<SimulationConfig>({
    initialBalance: 10000,
    leverage: 1,
    riskPerTrade: 2,
    maxTrades: 100,
    strategy: 'scalping'
  });
  
  const [trades, setTrades] = useState<Trade[]>([]);
  const [currentBalance, setCurrentBalance] = useState(config.initialBalance);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'simulator' | 'competition' | 'backtest'>('simulator');
  const [competitionPlayers, setCompetitionPlayers] = useState<CompetitionPlayer[]>([]);

  useEffect(() => {
    // Load competition data
    const mockPlayers: CompetitionPlayer[] = [
      { id: '1', name: 'CryptoMaster', balance: 12500, trades: 45, winRate: 72, profit: 2500, rank: 1 },
      { id: '2', name: 'TradingPro', balance: 11200, trades: 38, winRate: 68, profit: 1200, rank: 2 },
      { id: '3', name: 'BotBeast', balance: 10800, trades: 42, winRate: 65, profit: 800, rank: 3 },
      { id: '4', name: 'ProfitKing', balance: 9800, trades: 35, winRate: 71, profit: -200, rank: 4 },
      { id: '5', name: 'RiskMaster', balance: 9200, trades: 28, winRate: 75, profit: -800, rank: 5 }
    ];
    setCompetitionPlayers(mockPlayers);
  }, []);

  const generateMockTrade = (): Trade => {
    const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT'];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const side = Math.random() > 0.5 ? 'buy' : 'sell';
    const price = 50000 + Math.random() * 10000; // Mock price
    const quantity = 0.001 + Math.random() * 0.01;
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      symbol,
      side,
      price,
      quantity,
      timestamp: new Date(),
      status: 'open'
    };
  };

  const startSimulation = async () => {
    setIsSimulating(true);
    setTrades([]);
    setCurrentBalance(config.initialBalance);
    
    const newTrades: Trade[] = [];
    let balance = config.initialBalance;
    
    // Simulate trades
    for (let i = 0; i < config.maxTrades; i++) {
      const trade = generateMockTrade();
      
      // Simulate PnL
      const pnl = (Math.random() - 0.4) * trade.price * trade.quantity * config.leverage;
      trade.pnl = pnl;
      trade.status = 'closed';
      
      balance += pnl;
      newTrades.push(trade);
      
      // Update state every 10 trades for smooth animation
      if (i % 10 === 0) {
        setTrades([...newTrades]);
        setCurrentBalance(balance);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    setTrades(newTrades);
    setCurrentBalance(balance);
    
    // Calculate results
    const totalTrades = newTrades.length;
    const winningTrades = newTrades.filter(t => (t.pnl || 0) > 0).length;
    const winRate = (winningTrades / totalTrades) * 100;
    const totalProfit = balance - config.initialBalance;
    const maxDrawdown = calculateMaxDrawdown(newTrades);
    
    setSimulationResults({
      totalTrades,
      winRate,
      totalProfit,
      maxDrawdown,
      finalBalance: balance,
      sharpeRatio: calculateSharpeRatio(newTrades)
    });
    
    setIsSimulating(false);
  };

  const calculateMaxDrawdown = (trades: Trade[]): number => {
    let peak = config.initialBalance;
    let maxDD = 0;
    
    trades.forEach(trade => {
      const currentBalance = config.initialBalance + trades
        .slice(0, trades.indexOf(trade) + 1)
        .reduce((sum, t) => sum + (t.pnl || 0), 0);
      
      if (currentBalance > peak) peak = currentBalance;
      const drawdown = (peak - currentBalance) / peak;
      if (drawdown > maxDD) maxDD = drawdown;
    });
    
    return maxDD * 100;
  };

  const calculateSharpeRatio = (trades: Trade[]): number => {
    const returns = trades.map(t => (t.pnl || 0) / config.initialBalance);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev > 0 ? avgReturn / stdDev : 0;
  };

  const joinCompetition = () => {
    // Simulate joining competition
    const playerId = Math.random().toString(36).substr(2, 9);
    const newPlayer: CompetitionPlayer = {
      id: playerId,
      name: `Player_${playerId.substr(0, 4)}`,
      balance: config.initialBalance,
      trades: 0,
      winRate: 0,
      profit: 0,
      rank: competitionPlayers.length + 1
    };
    
    setCompetitionPlayers([...competitionPlayers, newPlayer]);
  };

  const getPerformanceData = () => {
    let cumulativeBalance = config.initialBalance;
    return trades.map((trade, index) => {
      cumulativeBalance += trade.pnl || 0;
      return {
        trade: index + 1,
        balance: cumulativeBalance,
        pnl: trade.pnl || 0
      };
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Trading Simulator</h3>
        <div className="flex space-x-2">
          {(['simulator', 'competition', 'backtest'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded text-sm ${
                activeTab === tab ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              {tab === 'simulator' && 'Simulador'}
              {tab === 'competition' && 'Competencia'}
              {tab === 'backtest' && 'Backtest'}
            </button>
          ))}
        </div>
      </div>

      {/* Simulator Tab */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Balance Inicial</label>
              <input
                type="number"
                value={config.initialBalance}
                onChange={(e) => setConfig({ ...config, initialBalance: Number(e.target.value) })}
                className="w-full p-2 bg-gray-700 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Leverage</label>
              <select
                value={config.leverage}
                onChange={(e) => setConfig({ ...config, leverage: Number(e.target.value) })}
                className="w-full p-2 bg-gray-700 rounded"
              >
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={5}>5x</option>
                <option value={10}>10x</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Riesgo por Trade (%)</label>
              <input
                type="number"
                value={config.riskPerTrade}
                onChange={(e) => setConfig({ ...config, riskPerTrade: Number(e.target.value) })}
                className="w-full p-2 bg-gray-700 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Trades</label>
              <input
                type="number"
                value={config.maxTrades}
                onChange={(e) => setConfig({ ...config, maxTrades: Number(e.target.value) })}
                className="w-full p-2 bg-gray-700 rounded"
              />
            </div>
          </div>

          {/* Strategy Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Estrategia</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(['scalping', 'swing', 'arbitrage', 'custom'] as const).map((strategy) => (
                <button
                  key={strategy}
                  onClick={() => setConfig({ ...config, strategy })}
                  className={`p-3 rounded ${
                    config.strategy === strategy ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  {strategy.charAt(0).toUpperCase() + strategy.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Start Simulation */}
          <div className="flex justify-center">
            <button
              onClick={startSimulation}
              disabled={isSimulating}
              className={`px-8 py-3 rounded font-semibold ${
                isSimulating ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isSimulating ? 'Simulando...' : 'Iniciar Simulación'}
            </button>
          </div>

          {/* Results */}
          {simulationResults && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-700 p-4 rounded text-center">
                <h5 className="font-semibold text-blue-400">Total Trades</h5>
                <p className="text-2xl font-bold">{simulationResults.totalTrades}</p>
              </div>
              <div className="bg-gray-700 p-4 rounded text-center">
                <h5 className="font-semibold text-green-400">Win Rate</h5>
                <p className="text-2xl font-bold">{simulationResults.winRate.toFixed(1)}%</p>
              </div>
              <div className="bg-gray-700 p-4 rounded text-center">
                <h5 className="font-semibold text-yellow-400">Profit Total</h5>
                <p className="text-2xl font-bold">${simulationResults.totalProfit.toFixed(2)}</p>
              </div>
              <div className="bg-gray-700 p-4 rounded text-center">
                <h5 className="font-semibold text-red-400">Max Drawdown</h5>
                <p className="text-2xl font-bold">{simulationResults.maxDrawdown.toFixed(2)}%</p>
              </div>
            </div>
          )}

          {/* Performance Chart */}
          {trades.length > 0 && (
            <div className="bg-gray-700 p-4 rounded">
              <h4 className="font-semibold mb-4">Rendimiento en Tiempo Real</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getPerformanceData()}>
                  <XAxis dataKey="trade" />
                  <YAxis />
                  <Tooltip formatter={(value: number, name: string) => [
                    name === 'balance' ? `$${value.toFixed(2)}` : `$${value.toFixed(2)}`,
                    name === 'balance' ? 'Balance' : 'PnL'
                  ]} />
                  <Legend />
                  <Line type="monotone" dataKey="balance" stroke="#10B981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Competition Tab */}
      {activeTab === 'competition' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold">Competencia Global</h4>
            <button
              onClick={joinCompetition}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
              Unirse a Competencia
            </button>
          </div>

          <div className="space-y-2">
            {competitionPlayers.map((player) => (
              <div key={player.id} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    player.rank === 1 ? 'bg-yellow-500 text-black' :
                    player.rank === 2 ? 'bg-gray-400 text-black' :
                    player.rank === 3 ? 'bg-orange-500 text-black' :
                    'bg-gray-600 text-white'
                  }`}>
                    {player.rank}
                  </div>
                  <div>
                    <div className="font-semibold">{player.name}</div>
                    <div className="text-sm text-gray-400">{player.trades} trades</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${player.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${player.profit.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">{player.winRate}% win rate</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Backtest Tab */}
      {activeTab === 'backtest' && (
        <div className="space-y-6">
          <h4 className="font-semibold">Backtesting Histórico</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-700 p-4 rounded">
              <h5 className="font-semibold mb-4">Rendimiento por Período</h5>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { period: '1M', return: 12.5 },
                  { period: '3M', return: 28.3 },
                  { period: '6M', return: 45.7 },
                  { period: '1Y', return: 89.2 }
                ]}>
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`${value}%`, 'Retorno']} />
                  <Bar dataKey="return" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-gray-700 p-4 rounded">
              <h5 className="font-semibold mb-4">Métricas de Riesgo</h5>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Sharpe Ratio:</span>
                  <span className="text-green-400 font-semibold">2.1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Drawdown:</span>
                  <span className="text-red-400 font-semibold">-15.8%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">VaR (95%):</span>
                  <span className="text-yellow-400 font-semibold">2.3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Calmar Ratio:</span>
                  <span className="text-blue-400 font-semibold">5.6</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





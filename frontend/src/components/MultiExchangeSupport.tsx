// src/components/MultiExchangeSupport.tsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Exchange {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance';
  fees: {
    maker: number;
    taker: number;
  };
  balance: {
    [key: string]: number;
  };
  lastUpdate: Date;
}

interface ArbitrageOpportunity {
  id: string;
  pair: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  profit: number;
  volume: number;
  timestamp: Date;
}

interface LiquidityData {
  exchange: string;
  pair: string;
  bid: number;
  ask: number;
  spread: number;
  volume24h: number;
}

export default function MultiExchangeSupport() {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [arbitrageOpportunities, setArbitrageOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [liquidityData, setLiquidityData] = useState<LiquidityData[]>([]);
  const [activeTab, setActiveTab] = useState<'exchanges' | 'arbitrage' | 'liquidity' | 'portfolio'>('exchanges');
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>(['binance', 'coinbase']);

  useEffect(() => {
    // Load exchanges data
    const mockExchanges: Exchange[] = [
      {
        id: 'binance',
        name: 'Binance',
        status: 'online',
        fees: { maker: 0.001, taker: 0.001 },
        balance: { BTC: 0.5, ETH: 2.1, USDT: 15000 },
        lastUpdate: new Date()
      },
      {
        id: 'coinbase',
        name: 'Coinbase Pro',
        status: 'online',
        fees: { maker: 0.005, taker: 0.005 },
        balance: { BTC: 0.3, ETH: 1.8, USDT: 8000 },
        lastUpdate: new Date()
      },
      {
        id: 'kraken',
        name: 'Kraken',
        status: 'online',
        fees: { maker: 0.0016, taker: 0.0026 },
        balance: { BTC: 0.2, ETH: 1.2, USDT: 5000 },
        lastUpdate: new Date()
      },
      {
        id: 'huobi',
        name: 'Huobi',
        status: 'maintenance',
        fees: { maker: 0.002, taker: 0.002 },
        balance: { BTC: 0.1, ETH: 0.8, USDT: 3000 },
        lastUpdate: new Date()
      }
    ];

    const mockArbitrage: ArbitrageOpportunity[] = [
      {
        id: '1',
        pair: 'BTCUSDT',
        buyExchange: 'Kraken',
        sellExchange: 'Binance',
        buyPrice: 45230,
        sellPrice: 45350,
        spread: 0.26,
        profit: 120,
        volume: 0.1,
        timestamp: new Date()
      },
      {
        id: '2',
        pair: 'ETHUSDT',
        buyExchange: 'Coinbase',
        sellExchange: 'Kraken',
        buyPrice: 3120,
        sellPrice: 3145,
        spread: 0.80,
        profit: 25,
        volume: 1.0,
        timestamp: new Date()
      }
    ];

    const mockLiquidity: LiquidityData[] = [
      { exchange: 'Binance', pair: 'BTCUSDT', bid: 45320, ask: 45350, spread: 0.07, volume24h: 1250000 },
      { exchange: 'Coinbase', pair: 'BTCUSDT', bid: 45280, ask: 45320, spread: 0.09, volume24h: 890000 },
      { exchange: 'Kraken', pair: 'BTCUSDT', bid: 45230, ask: 45280, spread: 0.11, volume24h: 450000 },
      { exchange: 'Binance', pair: 'ETHUSDT', bid: 3120, ask: 3125, spread: 0.16, volume24h: 890000 },
      { exchange: 'Coinbase', pair: 'ETHUSDT', bid: 3115, ask: 3120, spread: 0.16, volume24h: 650000 },
      { exchange: 'Kraken', pair: 'ETHUSDT', bid: 3110, ask: 3115, spread: 0.16, volume24h: 320000 }
    ];

    setExchanges(mockExchanges);
    setArbitrageOpportunities(mockArbitrage);
    setLiquidityData(mockLiquidity);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-400';
      case 'offline': return 'text-red-400';
      case 'maintenance': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return '🟢';
      case 'offline': return '🔴';
      case 'maintenance': return '🟡';
      default: return '⚪';
    }
  };

  const toggleExchange = (exchangeId: string) => {
    setSelectedExchanges(prev => 
      prev.includes(exchangeId) 
        ? prev.filter(id => id !== exchangeId)
        : [...prev, exchangeId]
    );
  };

  const executeArbitrage = async (opportunity: ArbitrageOpportunity) => {
    try {
      // Simulate arbitrage execution
      console.log('Executing arbitrage:', opportunity);
      // In real implementation, this would call the backend API
    } catch (error) {
      console.error('Error executing arbitrage:', error);
    }
  };

  const getTotalPortfolioValue = () => {
    const totalValue: { [key: string]: number } = {};
    
    exchanges.forEach(exchange => {
      Object.entries(exchange.balance).forEach(([asset, amount]) => {
        totalValue[asset] = (totalValue[asset] || 0) + amount;
      });
    });
    
    return totalValue;
  };

  const getArbitrageChartData = () => {
    return arbitrageOpportunities.map(opp => ({
      pair: opp.pair,
      spread: opp.spread,
      profit: opp.profit
    }));
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Multi-Exchange Support</h3>
        <div className="flex space-x-2">
          {(['exchanges', 'arbitrage', 'liquidity', 'portfolio'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded text-sm ${
                activeTab === tab ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              {tab === 'exchanges' && 'Exchanges'}
              {tab === 'arbitrage' && 'Arbitraje'}
              {tab === 'liquidity' && 'Liquidez'}
              {tab === 'portfolio' && 'Portfolio'}
            </button>
          ))}
        </div>
      </div>

      {/* Exchanges Tab */}
      {activeTab === 'exchanges' && (
        <div className="space-y-4">
          <h4 className="font-semibold">Exchanges Conectados</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exchanges.map((exchange) => (
              <div key={exchange.id} className="bg-gray-700 p-4 rounded">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h5 className="font-semibold">{exchange.name}</h5>
                    <div className="flex items-center space-x-2">
                      <span>{getStatusIcon(exchange.status)}</span>
                      <span className={`text-sm ${getStatusColor(exchange.status)}`}>
                        {exchange.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedExchanges.includes(exchange.id)}
                      onChange={() => toggleExchange(exchange.id)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-checked:bg-green-600 rounded-full peer-checked:after:translate-x-full 
                        after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Maker Fee:</span>
                    <span>{(exchange.fees.maker * 100).toFixed(3)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Taker Fee:</span>
                    <span>{(exchange.fees.taker * 100).toFixed(3)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Última actualización:</span>
                    <span>{exchange.lastUpdate.toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-600">
                  <h6 className="text-sm font-semibold mb-2">Balance:</h6>
                  <div className="space-y-1">
                    {Object.entries(exchange.balance).map(([asset, amount]) => (
                      <div key={asset} className="flex justify-between text-sm">
                        <span>{asset}:</span>
                        <span>{amount.toFixed(4)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Arbitrage Tab */}
      {activeTab === 'arbitrage' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold">Oportunidades de Arbitraje</h4>
            <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
              Actualizar
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h5 className="font-semibold mb-4">Oportunidades Activas</h5>
              <div className="space-y-3">
                {arbitrageOpportunities.map((opp) => (
                  <div key={opp.id} className="bg-gray-700 p-4 rounded">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h6 className="font-semibold">{opp.pair}</h6>
                        <p className="text-sm text-gray-400">
                          Comprar en {opp.buyExchange} → Vender en {opp.sellExchange}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-semibold">
                          +{opp.spread.toFixed(2)}%
                        </div>
                        <div className="text-sm text-gray-400">
                          ${opp.profit.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-400 mb-3">
                      <span>Compra: ${opp.buyPrice.toLocaleString()}</span>
                      <span>Venta: ${opp.sellPrice.toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => executeArbitrage(opp)}
                      className="w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
                    >
                      Ejecutar Arbitraje
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h5 className="font-semibold mb-4">Análisis de Spreads</h5>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getArbitrageChartData()}>
                  <XAxis dataKey="pair" />
                  <YAxis />
                  <Tooltip formatter={(value: number, name: string) => [
                    name === 'spread' ? `${value.toFixed(2)}%` : `$${value.toFixed(2)}`,
                    name === 'spread' ? 'Spread' : 'Profit'
                  ]} />
                  <Legend />
                  <Bar dataKey="spread" fill="#10B981" name="Spread %" />
                  <Bar dataKey="profit" fill="#3B82F6" name="Profit $" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Liquidity Tab */}
      {activeTab === 'liquidity' && (
        <div className="space-y-6">
          <h4 className="font-semibold">Análisis de Liquidez</h4>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h5 className="font-semibold mb-4">Comparación de Spreads</h5>
              <div className="space-y-2">
                {liquidityData
                  .filter(data => data.pair === 'BTCUSDT')
                  .map((data, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-700 rounded">
                      <div>
                        <div className="font-semibold">{data.exchange}</div>
                        <div className="text-sm text-gray-400">
                          Bid: ${data.bid.toLocaleString()} | Ask: ${data.ask.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-yellow-400 font-semibold">
                          {data.spread.toFixed(2)}%
                        </div>
                        <div className="text-sm text-gray-400">
                          Vol: ${(data.volume24h / 1000000).toFixed(1)}M
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h5 className="font-semibold mb-4">Volumen 24h por Exchange</h5>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={liquidityData.filter(data => data.pair === 'BTCUSDT')}>
                  <XAxis dataKey="exchange" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`$${(value / 1000000).toFixed(1)}M`, 'Volumen']} />
                  <Bar dataKey="volume24h" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Tab */}
      {activeTab === 'portfolio' && (
        <div className="space-y-6">
          <h4 className="font-semibold">Portfolio Unificado</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {Object.entries(getTotalPortfolioValue()).map(([asset, amount]) => (
              <div key={asset} className="bg-gray-700 p-4 rounded text-center">
                <h5 className="font-semibold text-blue-400">{asset}</h5>
                <p className="text-2xl font-bold">{amount.toFixed(4)}</p>
                <p className="text-sm text-gray-400">
                  ${(amount * 45000).toLocaleString()} {/* Mock price */}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-gray-700 p-4 rounded">
            <h5 className="font-semibold mb-4">Distribución por Exchange</h5>
            <div className="space-y-3">
              {exchanges.map((exchange) => (
                <div key={exchange.id}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">{exchange.name}</span>
                    <span className="text-sm text-gray-400">
                      ${Object.entries(exchange.balance)
                        .reduce((sum, [asset, amount]) => sum + amount * 45000, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ 
                        width: `${(Object.entries(exchange.balance)
                          .reduce((sum, [asset, amount]) => sum + amount * 45000, 0) / 
                          Object.values(getTotalPortfolioValue())
                          .reduce((sum, amount) => sum + amount * 45000, 0)) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





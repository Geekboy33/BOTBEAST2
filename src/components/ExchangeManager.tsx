import React, { useState, useEffect } from 'react';

interface Exchange {
  name: string;
  status: string;
  balance: Record<string, number>;
  pairs_available: number;
  fees: {
    maker: number;
    taker: number;
  };
}

const ExchangeManager: React.FC = () => {
  const [exchanges, setExchanges] = useState<Record<string, Exchange>>({});
  const [arbitrageOpportunities, setArbitrageOpportunities] = useState<any>(null);
  const [scannerResults, setScannerResults] = useState<any>(null);

  useEffect(() => {
    loadExchangeData();
    const interval = setInterval(loadExchangeData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadExchangeData = async () => {
    try {
      const [exchangesRes, arbitrageRes, scannerRes] = await Promise.all([
        fetch('/api/exchanges'),
        fetch('/api/arbitrage'),
        fetch('/api/scanner')
      ]);

      const exchangesData = await exchangesRes.json();
      const arbitrageData = await arbitrageRes.json();
      const scannerData = await scannerRes.json();

      setExchanges(exchangesData);
      setArbitrageOpportunities(arbitrageData);
      setScannerResults(scannerData);
    } catch (error) {
      console.error('Error loading exchange data:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-400';
      case 'disconnected': return 'text-red-400';
      case 'offline': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-600';
      case 'disconnected': return 'bg-red-600';
      case 'offline': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">🔄 Exchange Manager</h2>
        <div className="flex space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-400">Connected Exchanges</div>
            <div className="text-xl font-bold text-green-400">
              {Object.values(exchanges).filter(ex => ex.status === 'connected').length}/{Object.keys(exchanges).length}
            </div>
          </div>
        </div>
      </div>

      {/* Exchange Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(exchanges).map(([id, exchange]) => (
          <div key={id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{exchange.name}</h3>
              <div className={`w-3 h-3 rounded-full ${getStatusBg(exchange.status)}`}></div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Status:</span>
                <span className={`font-semibold ${getStatusColor(exchange.status)}`}>
                  {exchange.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Pairs:</span>
                <span className="text-white font-semibold">{exchange.pairs_available}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Maker Fee:</span>
                <span className="text-white font-semibold">{(exchange.fees.maker * 100).toFixed(3)}%</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-600">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Balance:</h4>
              <div className="space-y-1">
                {Object.entries(exchange.balance).map(([asset, amount]) => (
                  <div key={asset} className="flex justify-between text-sm">
                    <span className="text-gray-400">{asset}:</span>
                    <span className="text-white font-semibold">{amount.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Arbitrage Opportunities */}
      {arbitrageOpportunities && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">🔄 Arbitrage Opportunities</h3>
          <div className="space-y-3">
            {arbitrageOpportunities.opportunities.map((opp: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div>
                  <h4 className="font-semibold text-white">{opp.symbol}</h4>
                  <p className="text-sm text-gray-400">
                    {opp.exchanges.join(' ↔ ')}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-400">
                    {opp.spread.toFixed(2)}% spread
                  </div>
                  <div className="text-sm text-gray-400">
                    Profit: ${opp.profit_potential.toFixed(2)}
                  </div>
                </div>
                <button className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white font-semibold">
                  Execute
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pair Scanner Results */}
      {scannerResults && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">📊 Pair Scanner Results</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-semibold text-blue-400 mb-3">Spot Pairs</h4>
              <div className="space-y-2">
                {scannerResults.spot_pairs.map((pair: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                    <div>
                      <span className="font-semibold text-white">{pair.symbol}</span>
                      <div className="text-sm text-gray-400">
                        Vol: ${(pair.volume_24h / 1000000).toFixed(1)}M
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${pair.change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pair.change_24h >= 0 ? '+' : ''}{pair.change_24h.toFixed(2)}%
                      </div>
                      <div className={`text-xs px-2 py-1 rounded ${
                        pair.signal === 'buy' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {pair.signal.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-md font-semibold text-purple-400 mb-3">Futures Pairs</h4>
              <div className="space-y-2">
                {scannerResults.futures_pairs.map((pair: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                    <div>
                      <span className="font-semibold text-white">{pair.symbol}</span>
                      <div className="text-sm text-gray-400">
                        Vol: ${(pair.volume_24h / 1000000).toFixed(1)}M
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${pair.change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pair.change_24h >= 0 ? '+' : ''}{pair.change_24h.toFixed(2)}%
                      </div>
                      <div className={`text-xs px-2 py-1 rounded ${
                        pair.signal === 'buy' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {pair.signal.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPanel;
// src/components/PortfolioVisual.tsx
import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

type PortfolioAsset = {
  symbol: string;
  value: number;
  percentage: number;
  color: string;
};

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function PortfolioVisual() {
  const [portfolio, setPortfolio] = useState<PortfolioAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        // Simular datos del portfolio (en producción vendría de la API)
        const mockData: PortfolioAsset[] = [
          { symbol: 'BTC', value: 5000, percentage: 45, color: COLORS[0] },
          { symbol: 'ETH', value: 3000, percentage: 27, color: COLORS[1] },
          { symbol: 'BNB', value: 1500, percentage: 14, color: COLORS[2] },
          { symbol: 'ADA', value: 1000, percentage: 9, color: COLORS[3] },
          { symbol: 'DOT', value: 500, percentage: 5, color: COLORS[4] }
        ];

        setPortfolio(mockData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching portfolio:', error);
        setIsLoading(false);
      }
    };

    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const totalValue = portfolio.reduce((sum, asset) => sum + asset.value, 0);

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 h-80 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Distribución del Portfolio</h3>
        <div className="text-2xl font-bold text-green-400">
          ${totalValue.toLocaleString()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gráfico de Pie */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={portfolio}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {portfolio.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Valor']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Lista de activos */}
        <div className="space-y-2">
          {portfolio.map((asset, index) => (
            <div key={asset.symbol} className="flex items-center justify-between p-2 bg-gray-700 rounded">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: asset.color }}
                />
                <span className="font-semibold">{asset.symbol}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">
                  ${asset.value.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">
                  {asset.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}





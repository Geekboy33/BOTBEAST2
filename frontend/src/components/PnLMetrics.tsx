// src/components/PnLMetrics.tsx
import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import axios from 'axios';

type PnLPoint = {
  time: string;
  pnl: number;
  unrealizedPnL: number;
  realizedPnL: number;
  totalValue: number;
};

export default function PnLMetrics() {
  const [data, setData] = useState<PnLPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPnL = async () => {
      try {
        // Simular datos de PnL (en producción vendría de la API)
        const mockData = {
          pnl: Math.random() * 1000 - 500,
          unrealizedPnL: Math.random() * 500 - 250,
          realizedPnL: Math.random() * 300 - 150,
          totalValue: 10000 + Math.random() * 2000
        };

        const newPoint: PnLPoint = {
          time: new Date().toLocaleTimeString(),
          pnl: mockData.pnl,
          unrealizedPnL: mockData.unrealizedPnL,
          realizedPnL: mockData.realizedPnL,
          totalValue: mockData.totalValue
        };

        setData(prev => [...prev, newPoint].slice(-50)); // Keep last 50 points
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching PnL data:', error);
        setIsLoading(false);
      }
    };

    fetchPnL();
    const interval = setInterval(fetchPnL, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const currentPnL = data[data.length - 1]?.pnl || 0;
  const isPositive = currentPnL >= 0;

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
        <h3 className="text-lg font-semibold">Métricas de PnL</h3>
        <div className={`text-2xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          ${currentPnL.toFixed(2)}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-sm text-gray-400">PnL Total</div>
          <div className={`text-lg font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            ${currentPnL.toFixed(2)}
          </div>
        </div>
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-sm text-gray-400">PnL Realizado</div>
          <div className="text-lg font-semibold text-blue-400">
            ${data[data.length - 1]?.realizedPnL.toFixed(2) || '0.00'}
          </div>
        </div>
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-sm text-gray-400">PnL No Realizado</div>
          <div className="text-lg font-semibold text-yellow-400">
            ${data[data.length - 1]?.unrealizedPnL.toFixed(2) || '0.00'}
          </div>
        </div>
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-sm text-gray-400">Valor Total</div>
          <div className="text-lg font-semibold text-white">
            ${data[data.length - 1]?.totalValue.toFixed(2) || '0.00'}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip 
            formatter={(value: number, name: string) => [
              `$${value.toFixed(2)}`, 
              name === 'pnl' ? 'PnL Total' : name
            ]}
          />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="pnl" 
            stroke={isPositive ? "#10B981" : "#EF4444"} 
            fill={isPositive ? "#10B981" : "#EF4444"}
            fillOpacity={0.3}
            name="PnL Total"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}





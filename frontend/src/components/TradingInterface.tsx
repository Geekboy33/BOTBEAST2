// src/components/TradingInterface.tsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop';
  quantity: number;
  price?: number;
  stop_price?: number;
  status: 'pending' | 'filled' | 'cancelled';
  created_at: string;
  updated_at: string;
  pnl: number;
  fees: number;
}

interface Trade {
  id: string;
  order_id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: string;
  pnl: number;
  fees: number;
}

interface PriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function TradingInterface() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [activeTab, setActiveTab] = useState<'orders' | 'trades' | 'positions' | 'analytics'>('orders');
  const [newOrder, setNewOrder] = useState({
    symbol: 'BTCUSDT',
    side: 'buy' as 'buy' | 'sell',
    type: 'market' as 'market' | 'limit' | 'stop',
    quantity: 0.001,
    price: 0,
    stop_price: 0
  });
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    loadOrders();
    loadTrades();
    loadPrices();
    
    // Actualizar datos cada 5 segundos
    const interval = setInterval(() => {
      loadOrders();
      loadTrades();
      loadPrices();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const loadTrades = async () => {
    try {
      const response = await fetch('/api/trades');
      const data = await response.json();
      setTrades(data);
    } catch (error) {
      console.error('Error loading trades:', error);
    }
  };

  const loadPrices = async () => {
    try {
      const response = await fetch('/api/prices');
      const data = await response.json();
      
      // Convertir a formato con cambios
      const priceData: Record<string, PriceData> = {};
      Object.entries(data).forEach(([symbol, price]) => {
        const previousPrice = prices[symbol]?.price || price;
        const change = price - previousPrice;
        const changePercent = (change / previousPrice) * 100;
        
        priceData[symbol] = {
          symbol,
          price: price as number,
          change,
          changePercent
        };
      });
      
      setPrices(priceData);
    } catch (error) {
      console.error('Error loading prices:', error);
    }
  };

  const createOrder = async () => {
    setIsCreatingOrder(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newOrder),
      });
      
      if (response.ok) {
        await loadOrders();
        setNewOrder({
          symbol: 'BTCUSDT',
          side: 'buy',
          type: 'market',
          quantity: 0.001,
          price: 0,
          stop_price: 0
        });
      }
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });
      await loadOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'filled': return 'text-green-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getSideColor = (side: string) => {
    return side === 'buy' ? 'text-green-400' : 'text-red-400';
  };

  // Calcular posiciones actuales
  const positions = React.useMemo(() => {
    const posMap = new Map<string, any>();
    
    trades.forEach(trade => {
      const key = trade.symbol;
      if (!posMap.has(key)) {
        posMap.set(key, {
          symbol: trade.symbol,
          quantity: 0,
          avgPrice: 0,
          totalCost: 0,
          pnl: 0,
          fees: 0
        });
      }
      
      const pos = posMap.get(key);
      if (trade.side === 'buy') {
        pos.quantity += trade.quantity;
        pos.totalCost += trade.price * trade.quantity;
        pos.avgPrice = pos.totalCost / pos.quantity;
      } else {
        pos.quantity -= trade.quantity;
        pos.totalCost -= trade.price * trade.quantity;
      }
      pos.pnl += trade.pnl;
      pos.fees += trade.fees;
    });
    
    return Array.from(posMap.values()).filter(pos => pos.quantity !== 0);
  }, [trades]);

  // Datos para gráficos
  const pnlChartData = trades.slice(-30).map(trade => ({
    time: new Date(trade.timestamp).toLocaleTimeString(),
    pnl: trade.pnl,
    cumulative: trades.slice(0, trades.indexOf(trade) + 1).reduce((sum, t) => sum + t.pnl, 0)
  }));

  const volumeChartData = trades.reduce((acc, trade) => {
    const date = new Date(trade.timestamp).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = { date, volume: 0, trades: 0 };
    }
    acc[date].volume += trade.quantity * trade.price;
    acc[date].trades += 1;
    return acc;
  }, {} as Record<string, any>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">🚀 Trading Interface</h2>
        
        {/* Precios en tiempo real */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {Object.entries(prices).map(([symbol, data]) => (
            <div key={symbol} className="bg-gray-700 p-3 rounded">
              <div className="text-sm text-gray-400">{symbol}</div>
              <div className="text-lg font-semibold">${data.price.toFixed(2)}</div>
              <div className={`text-sm ${data.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)} ({data.changePercent.toFixed(2)}%)
              </div>
            </div>
          ))}
        </div>

        {/* Crear nueva orden */}
        <div className="bg-gray-700 p-4 rounded">
          <h3 className="text-lg font-semibold mb-4">Nueva Orden</h3>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Símbolo</label>
              <select
                value={newOrder.symbol}
                onChange={(e) => setNewOrder({...newOrder, symbol: e.target.value})}
                className="w-full bg-gray-600 text-white rounded px-3 py-2"
              >
                <option value="BTCUSDT">BTCUSDT</option>
                <option value="ETHUSDT">ETHUSDT</option>
                <option value="BNBUSDT">BNBUSDT</option>
                <option value="ADAUSDT">ADAUSDT</option>
                <option value="DOTUSDT">DOTUSDT</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Lado</label>
              <select
                value={newOrder.side}
                onChange={(e) => setNewOrder({...newOrder, side: e.target.value as 'buy' | 'sell'})}
                className="w-full bg-gray-600 text-white rounded px-3 py-2"
              >
                <option value="buy">Comprar</option>
                <option value="sell">Vender</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tipo</label>
              <select
                value={newOrder.type}
                onChange={(e) => setNewOrder({...newOrder, type: e.target.value as 'market' | 'limit' | 'stop'})}
                className="w-full bg-gray-600 text-white rounded px-3 py-2"
              >
                <option value="market">Market</option>
                <option value="limit">Limit</option>
                <option value="stop">Stop</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Cantidad</label>
              <input
                type="number"
                step="0.001"
                value={newOrder.quantity}
                onChange={(e) => setNewOrder({...newOrder, quantity: parseFloat(e.target.value)})}
                className="w-full bg-gray-600 text-white rounded px-3 py-2"
              />
            </div>
            
            {newOrder.type !== 'market' && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Precio</label>
                <input
                  type="number"
                  step="0.01"
                  value={newOrder.price}
                  onChange={(e) => setNewOrder({...newOrder, price: parseFloat(e.target.value)})}
                  className="w-full bg-gray-600 text-white rounded px-3 py-2"
                />
              </div>
            )}
            
            <div className="flex items-end">
              <button
                onClick={createOrder}
                disabled={isCreatingOrder}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded font-semibold"
              >
                {isCreatingOrder ? 'Creando...' : 'Crear Orden'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800 rounded-lg">
        <div className="flex border-b border-gray-700">
          {[
            { key: 'orders', label: '📋 Órdenes', count: orders.length },
            { key: 'trades', label: '💼 Trades', count: trades.length },
            { key: 'positions', label: '📊 Posiciones', count: positions.length },
            { key: 'analytics', label: '📈 Analytics', count: 0 }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-3 font-semibold ${
                activeTab === tab.key
                  ? 'bg-green-600 text-white border-b-2 border-green-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Tab: Órdenes */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2">ID</th>
                      <th className="text-left py-2">Símbolo</th>
                      <th className="text-left py-2">Lado</th>
                      <th className="text-left py-2">Tipo</th>
                      <th className="text-left py-2">Cantidad</th>
                      <th className="text-left py-2">Precio</th>
                      <th className="text-left py-2">Estado</th>
                      <th className="text-left py-2">PnL</th>
                      <th className="text-left py-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id} className="border-b border-gray-700">
                        <td className="py-2 text-sm">{order.id.slice(0, 8)}...</td>
                        <td className="py-2 font-semibold">{order.symbol}</td>
                        <td className={`py-2 font-semibold ${getSideColor(order.side)}`}>
                          {order.side === 'buy' ? '🟢' : '🔴'} {order.side.toUpperCase()}
                        </td>
                        <td className="py-2">{order.type}</td>
                        <td className="py-2">{order.quantity}</td>
                        <td className="py-2">${order.price?.toFixed(2) || 'Market'}</td>
                        <td className={`py-2 font-semibold ${getStatusColor(order.status)}`}>
                          {order.status.toUpperCase()}
                        </td>
                        <td className={`py-2 font-semibold ${order.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${order.pnl.toFixed(2)}
                        </td>
                        <td className="py-2">
                          {order.status === 'pending' && (
                            <button
                              onClick={() => cancelOrder(order.id)}
                              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                            >
                              Cancelar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Trades */}
          {activeTab === 'trades' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2">ID</th>
                      <th className="text-left py-2">Símbolo</th>
                      <th className="text-left py-2">Lado</th>
                      <th className="text-left py-2">Cantidad</th>
                      <th className="text-left py-2">Precio</th>
                      <th className="text-left py-2">Timestamp</th>
                      <th className="text-left py-2">PnL</th>
                      <th className="text-left py-2">Fees</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map(trade => (
                      <tr key={trade.id} className="border-b border-gray-700">
                        <td className="py-2 text-sm">{trade.id.slice(0, 8)}...</td>
                        <td className="py-2 font-semibold">{trade.symbol}</td>
                        <td className={`py-2 font-semibold ${getSideColor(trade.side)}`}>
                          {trade.side === 'buy' ? '🟢' : '🔴'} {trade.side.toUpperCase()}
                        </td>
                        <td className="py-2">{trade.quantity}</td>
                        <td className="py-2">${trade.price.toFixed(2)}</td>
                        <td className="py-2 text-sm">{new Date(trade.timestamp).toLocaleString()}</td>
                        <td className={`py-2 font-semibold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${trade.pnl.toFixed(2)}
                        </td>
                        <td className="py-2">${trade.fees.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Posiciones */}
          {activeTab === 'positions' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {positions.map(position => (
                  <div key={position.symbol} className="bg-gray-700 p-4 rounded">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-lg">{position.symbol}</h3>
                      <span className={`text-sm font-semibold ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${position.pnl.toFixed(2)}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Cantidad:</span>
                        <span>{position.quantity.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Precio Promedio:</span>
                        <span>${position.avgPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Valor Actual:</span>
                        <span>${(position.quantity * (prices[position.symbol]?.price || 0)).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Fees:</span>
                        <span>${position.fees.toFixed(4)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Analytics */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Gráfico de PnL */}
              <div className="bg-gray-700 p-4 rounded">
                <h3 className="text-lg font-semibold mb-4">PnL por Trade</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={pnlChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="pnl" stroke="#10B981" strokeWidth={2} />
                    <Line type="monotone" dataKey="cumulative" stroke="#3B82F6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Gráfico de Volumen */}
              <div className="bg-gray-700 p-4 rounded">
                <h3 className="text-lg font-semibold mb-4">Volumen de Trading</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.values(volumeChartData)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="volume" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}





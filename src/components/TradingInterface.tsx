import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
}

interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: string;
  pnl: number;
  fees: number;
}

export default function TradingInterface() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [prices, setPrices] = useState<Record<string, any>>({});
  const [newOrder, setNewOrder] = useState({
    symbol: 'BTCUSDT',
    side: 'buy' as 'buy' | 'sell',
    type: 'market' as 'market' | 'limit' | 'stop',
    quantity: 0.001,
    price: 0,
    stop_price: 0
  });
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  useEffect(() => {
    loadTradingData();
    const interval = setInterval(loadTradingData, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadTradingData = async () => {
    try {
      const [ordersRes, tradesRes, pricesRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/trades'),
        fetch('/api/prices')
      ]);

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      }

      if (tradesRes.ok) {
        const tradesData = await tradesRes.json();
        setTrades(tradesData);
      }

      if (pricesRes.ok) {
        const pricesData = await pricesRes.json();
        setPrices(pricesData);
      }
    } catch (error) {
      console.log('Using mock trading data');
      // Mock data when API is not available
      setPrices({
        BTCUSDT: { price: 45230.50, change: 2.3 },
        ETHUSDT: { price: 3120.75, change: 1.8 },
        ADAUSDT: { price: 0.52, change: -0.5 },
        SOLUSDT: { price: 98.45, change: 3.2 },
        DOTUSDT: { price: 8.25, change: 1.1 }
      });
    }
  };

  const createOrder = async () => {
    setIsCreatingOrder(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });

      if (response.ok) {
        await loadTradingData();
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
      await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
      await loadTradingData();
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">💹 Advanced Trading Interface</h2>
        
        {/* Real-time Prices */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {Object.entries(prices).map(([symbol, data]) => (
            <div key={symbol} className="bg-gray-700 p-3 rounded-lg text-center">
              <div className="text-sm text-gray-400">{symbol}</div>
              <div className="text-lg font-bold text-white">${data.price?.toFixed(2) || '0.00'}</div>
              <div className={`text-sm ${(data.change || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(data.change || 0) >= 0 ? '+' : ''}{(data.change || 0).toFixed(2)}%
              </div>
            </div>
          ))}
        </div>

        {/* Order Creation Form */}
        <div className="bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Create New Order</h3>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Symbol</label>
              <select
                value={newOrder.symbol}
                onChange={(e) => setNewOrder({...newOrder, symbol: e.target.value})}
                className="w-full bg-gray-600 text-white rounded px-3 py-2 border border-gray-500"
              >
                {Object.keys(prices).map(symbol => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Side</label>
              <select
                value={newOrder.side}
                onChange={(e) => setNewOrder({...newOrder, side: e.target.value as 'buy' | 'sell'})}
                className="w-full bg-gray-600 text-white rounded px-3 py-2 border border-gray-500"
              >
                <option value="buy">BUY</option>
                <option value="sell">SELL</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Type</label>
              <select
                value={newOrder.type}
                onChange={(e) => setNewOrder({...newOrder, type: e.target.value as any})}
                className="w-full bg-gray-600 text-white rounded px-3 py-2 border border-gray-500"
              >
                <option value="market">Market</option>
                <option value="limit">Limit</option>
                <option value="stop">Stop</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Quantity</label>
              <input
                type="number"
                step="0.001"
                value={newOrder.quantity}
                onChange={(e) => setNewOrder({...newOrder, quantity: parseFloat(e.target.value)})}
                className="w-full bg-gray-600 text-white rounded px-3 py-2 border border-gray-500"
              />
            </div>
            
            {newOrder.type !== 'market' && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={newOrder.price}
                  onChange={(e) => setNewOrder({...newOrder, price: parseFloat(e.target.value)})}
                  className="w-full bg-gray-600 text-white rounded px-3 py-2 border border-gray-500"
                />
              </div>
            )}
            
            <div className="flex items-end">
              <button
                onClick={createOrder}
                disabled={isCreatingOrder}
                className={`w-full px-4 py-2 rounded font-semibold ${
                  newOrder.side === 'buy' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } text-white disabled:bg-gray-600`}
              >
                {isCreatingOrder ? 'Creating...' : `${newOrder.side.toUpperCase()} ${newOrder.symbol}`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Orders and Trades Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Orders */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">📋 Active Orders</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 text-gray-400">Symbol</th>
                  <th className="text-left py-2 text-gray-400">Side</th>
                  <th className="text-left py-2 text-gray-400">Type</th>
                  <th className="text-left py-2 text-gray-400">Quantity</th>
                  <th className="text-left py-2 text-gray-400">Price</th>
                  <th className="text-left py-2 text-gray-400">Status</th>
                  <th className="text-left py-2 text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-gray-400">
                      No active orders
                    </td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr key={order.id} className="border-b border-gray-700">
                      <td className="py-2 font-semibold text-white">{order.symbol}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          order.side === 'buy' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                        }`}>
                          {order.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 text-white">{order.type}</td>
                      <td className="py-2 text-white">{order.quantity}</td>
                      <td className="py-2 text-white">${order.price?.toFixed(2) || 'Market'}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          order.status === 'pending' ? 'bg-yellow-600 text-white' : 
                          order.status === 'filled' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                        }`}>
                          {order.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => cancelOrder(order.id)}
                            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs text-white"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Trades */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">💼 Recent Trades</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 text-gray-400">Symbol</th>
                  <th className="text-left py-2 text-gray-400">Side</th>
                  <th className="text-left py-2 text-gray-400">Quantity</th>
                  <th className="text-left py-2 text-gray-400">Price</th>
                  <th className="text-left py-2 text-gray-400">P&L</th>
                  <th className="text-left py-2 text-gray-400">Time</th>
                </tr>
              </thead>
              <tbody>
                {trades.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-gray-400">
                      No trades yet
                    </td>
                  </tr>
                ) : (
                  trades.slice(-10).map(trade => (
                    <tr key={trade.id} className="border-b border-gray-700">
                      <td className="py-2 font-semibold text-white">{trade.symbol}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          trade.side === 'buy' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                        }`}>
                          {trade.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 text-white">{trade.quantity}</td>
                      <td className="py-2 text-white">${trade.price.toFixed(2)}</td>
                      <td className={`py-2 font-semibold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${trade.pnl.toFixed(2)}
                      </td>
                      <td className="py-2 text-gray-400">
                        {new Date(trade.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Trading Analytics */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">📈 Trading Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-400">{trades.length}</div>
            <div className="text-sm text-gray-400">Total Trades</div>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-400">
              {trades.length > 0 ? ((trades.filter(t => t.pnl > 0).length / trades.length) * 100).toFixed(1) : '0.0'}%
            </div>
            <div className="text-sm text-gray-400">Win Rate</div>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-400">
              ${trades.reduce((sum, t) => sum + t.pnl, 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-400">Total P&L</div>
          </div>
          <div className="bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-400">{orders.filter(o => o.status === 'pending').length}</div>
            <div className="text-sm text-gray-400">Pending Orders</div>
          </div>
        </div>

        {/* P&L Chart */}
        {trades.length > 0 && (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trades.slice(-20).map((trade, index) => ({
                trade: index + 1,
                pnl: trade.pnl,
                cumulative: trades.slice(0, trades.indexOf(trade) + 1).reduce((sum, t) => sum + t.pnl, 0)
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="trade" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Line type="monotone" dataKey="pnl" stroke="#EF4444" strokeWidth={2} name="P&L per Trade" />
                <Line type="monotone" dataKey="cumulative" stroke="#10B981" strokeWidth={2} name="Cumulative P&L" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
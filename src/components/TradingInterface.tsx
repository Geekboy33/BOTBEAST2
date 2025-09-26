import React, { useState, useEffect } from 'react';

interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop';
  quantity: number;
  price?: number;
  status: string;
  created_at: string;
}

const TradingInterface: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [newOrder, setNewOrder] = useState({
    symbol: 'BTCUSDT',
    side: 'buy' as 'buy' | 'sell',
    type: 'market' as 'market' | 'limit' | 'stop',
    quantity: 0.001,
    price: 0
  });

  useEffect(() => {
    loadTradingData();
    const interval = setInterval(loadTradingData, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadTradingData = async () => {
    try {
      const [ordersRes, pricesRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/prices')
      ]);

      const ordersData = await ordersRes.json();
      const pricesData = await pricesRes.json();

      setOrders(ordersData);
      setPrices(pricesData);
    } catch (error) {
      console.error('Error loading trading data:', error);
    }
  };

  const createOrder = async () => {
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
          price: 0
        });
      }
    } catch (error) {
      console.error('Error creating order:', error);
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
        <h2 className="text-2xl font-bold text-white mb-4">💹 Trading Interface</h2>
        
        {/* Current Prices */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {Object.entries(prices).map(([symbol, price]) => (
            <div key={symbol} className="bg-gray-700 p-3 rounded-lg text-center">
              <div className="text-sm text-gray-400">{symbol}</div>
              <div className="text-lg font-bold text-white">${price.toFixed(2)}</div>
              <div className="text-xs text-green-400">+2.3%</div>
            </div>
          ))}
        </div>

        {/* Order Form */}
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
                className={`w-full px-4 py-2 rounded font-semibold ${
                  newOrder.side === 'buy' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } text-white`}
              >
                {newOrder.side.toUpperCase()} {newOrder.symbol}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">📋 Active Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
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
              {orders.map(order => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TradingInterface;
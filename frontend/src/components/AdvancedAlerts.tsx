// src/components/AdvancedAlerts.tsx
import React, { useState, useEffect } from 'react';

interface Alert {
  id: string;
  type: 'price' | 'pnl' | 'volume' | 'trade' | 'risk';
  condition: 'above' | 'below' | 'equals' | 'change';
  value: number;
  symbol?: string;
  enabled: boolean;
  created_at: string;
  channels: string[];
}

interface AlertChannel {
  id: string;
  name: string;
  type: 'telegram' | 'email' | 'sms' | 'webhook' | 'push';
  enabled: boolean;
  config: Record<string, any>;
}

export default function AdvancedAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [channels, setChannels] = useState<AlertChannel[]>([]);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newAlert, setNewAlert] = useState({
    type: 'price' as Alert['type'],
    condition: 'above' as Alert['condition'],
    value: 0,
    symbol: 'BTCUSDT',
    channels: [] as string[]
  });
  const [newChannel, setNewChannel] = useState({
    name: '',
    type: 'telegram' as AlertChannel['type'],
    config: {} as Record<string, any>
  });

  useEffect(() => {
    loadAlerts();
    loadChannels();
  }, []);

  const loadAlerts = async () => {
    try {
      const response = await fetch('/api/alerts');
      const data = await response.json();
      setAlerts(data);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const loadChannels = async () => {
    // Simular canales configurados
    const mockChannels: AlertChannel[] = [
      {
        id: '1',
        name: 'Telegram Personal',
        type: 'telegram',
        enabled: true,
        config: { chat_id: '@username', bot_token: '***' }
      },
      {
        id: '2',
        name: 'Email Principal',
        type: 'email',
        enabled: true,
        config: { email: 'user@example.com' }
      },
      {
        id: '3',
        name: 'SMS Emergencias',
        type: 'sms',
        enabled: false,
        config: { phone: '+1234567890' }
      },
      {
        id: '4',
        name: 'Webhook Discord',
        type: 'webhook',
        enabled: true,
        config: { url: 'https://discord.com/api/webhooks/...' }
      }
    ];
    setChannels(mockChannels);
  };

  const createAlert = async () => {
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAlert),
      });
      
      if (response.ok) {
        await loadAlerts();
        setShowCreateAlert(false);
        setNewAlert({
          type: 'price',
          condition: 'above',
          value: 0,
          symbol: 'BTCUSDT',
          channels: []
        });
      }
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      await fetch(`/api/alerts/${alertId}`, {
        method: 'DELETE',
      });
      await loadAlerts();
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const toggleAlert = async (alertId: string, enabled: boolean) => {
    // Implementar toggle de alerta
    console.log('Toggle alert:', alertId, enabled);
  };

  const createChannel = async () => {
    // Implementar creación de canal
    console.log('Create channel:', newChannel);
    setShowCreateChannel(false);
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'price': return '💰';
      case 'pnl': return '📈';
      case 'volume': return '📊';
      case 'trade': return '💼';
      case 'risk': return '⚠️';
      default: return '🔔';
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'telegram': return '📱';
      case 'email': return '📧';
      case 'sms': return '💬';
      case 'webhook': return '🔗';
      case 'push': return '🔔';
      default: return '📡';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">🔔 Sistema de Alertas Avanzado</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowCreateAlert(true)}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold"
            >
              + Nueva Alerta
            </button>
            <button
              onClick={() => setShowCreateChannel(true)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold"
            >
              + Nuevo Canal
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-700 p-4 rounded">
            <div className="text-2xl font-bold text-green-400">{alerts.filter(a => a.enabled).length}</div>
            <div className="text-sm text-gray-400">Alertas Activas</div>
          </div>
          <div className="bg-gray-700 p-4 rounded">
            <div className="text-2xl font-bold text-blue-400">{channels.filter(c => c.enabled).length}</div>
            <div className="text-sm text-gray-400">Canales Configurados</div>
          </div>
          <div className="bg-gray-700 p-4 rounded">
            <div className="text-2xl font-bold text-yellow-400">24</div>
            <div className="text-sm text-gray-400">Alertas Hoy</div>
          </div>
          <div className="bg-gray-700 p-4 rounded">
            <div className="text-2xl font-bold text-purple-400">98%</div>
            <div className="text-sm text-gray-400">Tasa de Entrega</div>
          </div>
        </div>
      </div>

      {/* Canales de Alerta */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">📡 Canales de Notificación</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {channels.map(channel => (
            <div key={channel.id} className="bg-gray-700 p-4 rounded">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{getChannelIcon(channel.type)}</span>
                  <span className="font-semibold">{channel.name}</span>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-semibold ${
                  channel.enabled ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                }`}>
                  {channel.enabled ? 'Activo' : 'Inactivo'}
                </div>
              </div>
              <div className="text-sm text-gray-400 mb-2">
                Tipo: {channel.type.toUpperCase()}
              </div>
              <div className="text-xs text-gray-500">
                {Object.entries(channel.config).map(([key, value]) => (
                  <div key={key}>
                    {key}: {typeof value === 'string' && value.length > 20 ? value.slice(0, 20) + '...' : value}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex space-x-2">
                <button className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">
                  Configurar
                </button>
                <button className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm">
                  Probar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alertas Configuradas */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">🚨 Alertas Configuradas</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2">Tipo</th>
                <th className="text-left py-2">Condición</th>
                <th className="text-left py-2">Valor</th>
                <th className="text-left py-2">Símbolo</th>
                <th className="text-left py-2">Canales</th>
                <th className="text-left py-2">Estado</th>
                <th className="text-left py-2">Creada</th>
                <th className="text-left py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map(alert => (
                <tr key={alert.id} className="border-b border-gray-700">
                  <td className="py-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getAlertTypeIcon(alert.type)}</span>
                      <span className="font-semibold">{alert.type.toUpperCase()}</span>
                    </div>
                  </td>
                  <td className="py-2">{alert.condition}</td>
                  <td className="py-2 font-semibold">
                    {alert.type === 'price' ? '$' : ''}{alert.value}
                    {alert.type === 'pnl' ? '%' : ''}
                  </td>
                  <td className="py-2">{alert.symbol || 'Todos'}</td>
                  <td className="py-2">
                    <div className="flex space-x-1">
                      {alert.channels.map(channelId => {
                        const channel = channels.find(c => c.id === channelId);
                        return channel ? (
                          <span key={channelId} className="text-lg" title={channel.name}>
                            {getChannelIcon(channel.type)}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </td>
                  <td className="py-2">
                    <button
                      onClick={() => toggleAlert(alert.id, !alert.enabled)}
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        alert.enabled ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                      }`}
                    >
                      {alert.enabled ? 'Activa' : 'Inactiva'}
                    </button>
                  </td>
                  <td className="py-2 text-sm">{new Date(alert.created_at).toLocaleDateString()}</td>
                  <td className="py-2">
                    <div className="flex space-x-2">
                      <button className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs">
                        Editar
                      </button>
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Crear Alerta */}
      {showCreateAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Crear Nueva Alerta</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tipo de Alerta</label>
                <select
                  value={newAlert.type}
                  onChange={(e) => setNewAlert({...newAlert, type: e.target.value as Alert['type']})}
                  className="w-full bg-gray-600 text-white rounded px-3 py-2"
                >
                  <option value="price">Precio</option>
                  <option value="pnl">PnL</option>
                  <option value="volume">Volumen</option>
                  <option value="trade">Trade</option>
                  <option value="risk">Riesgo</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Condición</label>
                <select
                  value={newAlert.condition}
                  onChange={(e) => setNewAlert({...newAlert, condition: e.target.value as Alert['condition']})}
                  className="w-full bg-gray-600 text-white rounded px-3 py-2"
                >
                  <option value="above">Por encima de</option>
                  <option value="below">Por debajo de</option>
                  <option value="equals">Igual a</option>
                  <option value="change">Cambio de</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Valor</label>
                <input
                  type="number"
                  step="0.01"
                  value={newAlert.value}
                  onChange={(e) => setNewAlert({...newAlert, value: parseFloat(e.target.value)})}
                  className="w-full bg-gray-600 text-white rounded px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Símbolo</label>
                <select
                  value={newAlert.symbol}
                  onChange={(e) => setNewAlert({...newAlert, symbol: e.target.value})}
                  className="w-full bg-gray-600 text-white rounded px-3 py-2"
                >
                  <option value="BTCUSDT">BTCUSDT</option>
                  <option value="ETHUSDT">ETHUSDT</option>
                  <option value="BNBUSDT">BNBUSDT</option>
                  <option value="ADAUSDT">ADAUSDT</option>
                  <option value="DOTUSDT">DOTUSDT</option>
                  <option value="">Todos los símbolos</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Canales</label>
                <div className="space-y-2">
                  {channels.filter(c => c.enabled).map(channel => (
                    <label key={channel.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newAlert.channels.includes(channel.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewAlert({...newAlert, channels: [...newAlert.channels, channel.id]});
                          } else {
                            setNewAlert({...newAlert, channels: newAlert.channels.filter(id => id !== channel.id)});
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{getChannelIcon(channel.type)} {channel.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowCreateAlert(false)}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={createAlert}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
              >
                Crear Alerta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Crear Canal */}
      {showCreateChannel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Crear Nuevo Canal</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nombre</label>
                <input
                  type="text"
                  value={newChannel.name}
                  onChange={(e) => setNewChannel({...newChannel, name: e.target.value})}
                  className="w-full bg-gray-600 text-white rounded px-3 py-2"
                  placeholder="Ej: Telegram Personal"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tipo</label>
                <select
                  value={newChannel.type}
                  onChange={(e) => setNewChannel({...newChannel, type: e.target.value as AlertChannel['type']})}
                  className="w-full bg-gray-600 text-white rounded px-3 py-2"
                >
                  <option value="telegram">Telegram</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="webhook">Webhook</option>
                  <option value="push">Push Notification</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Configuración</label>
                <textarea
                  value={JSON.stringify(newChannel.config, null, 2)}
                  onChange={(e) => {
                    try {
                      const config = JSON.parse(e.target.value);
                      setNewChannel({...newChannel, config});
                    } catch (error) {
                      // Ignore invalid JSON
                    }
                  }}
                  className="w-full bg-gray-600 text-white rounded px-3 py-2 h-24 text-sm font-mono"
                  placeholder='{"chat_id": "@username", "bot_token": "..."}'
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowCreateChannel(false)}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={createChannel}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
              >
                Crear Canal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
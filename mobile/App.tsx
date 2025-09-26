// mobile/App.tsx - React Native App
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Alert,
  Linking
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

interface TradingData {
  price: number;
  timestamp: string;
  pnl: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  type: 'success' | 'error' | 'warning';
}

export default function App() {
  const [tradingData, setTradingData] = useState<TradingData[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'trading' | 'alerts' | 'settings'>('dashboard');

  useEffect(() => {
    // Load initial data
    loadTradingData();
    loadNotifications();
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      updateTradingData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadTradingData = () => {
    const mockData: TradingData[] = Array.from({ length: 20 }, (_, i) => ({
      price: 45000 + Math.random() * 5000,
      timestamp: new Date(Date.now() - (19 - i) * 60000).toISOString(),
      pnl: (Math.random() - 0.5) * 1000
    }));
    setTradingData(mockData);
  };

  const loadNotifications = () => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: 'Orden Ejecutada',
        message: 'BUY BTCUSDT @ $45,230',
        timestamp: new Date(),
        type: 'success'
      },
      {
        id: '2',
        title: 'Alerta de Precio',
        message: 'BTC superó $46,000',
        timestamp: new Date(Date.now() - 300000),
        type: 'warning'
      },
      {
        id: '3',
        title: 'Error de Conexión',
        message: 'Reconectando con Binance...',
        timestamp: new Date(Date.now() - 600000),
        type: 'error'
      }
    ];
    setNotifications(mockNotifications);
  };

  const updateTradingData = () => {
    const newData = {
      price: 45000 + Math.random() * 5000,
      timestamp: new Date().toISOString(),
      pnl: (Math.random() - 0.5) * 1000
    };
    setTradingData(prev => [...prev.slice(-19), newData]);
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return '#10B981';
      case 'error': return '#EF4444';
      case 'warning': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  const openWebDashboard = () => {
    Linking.openURL('http://localhost:8000');
  };

  const renderDashboard = () => (
    <ScrollView style={styles.tabContent}>
      {/* Status Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Estado del Sistema</Text>
          <View style={[styles.statusIndicator, { backgroundColor: isConnected ? '#10B981' : '#EF4444' }]} />
        </View>
        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <Text style={styles.statusValue}>$45,230</Text>
            <Text style={styles.statusLabel}>Precio BTC</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusValue}>+$1,250</Text>
            <Text style={styles.statusLabel}>PnL Hoy</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusValue}>68.5%</Text>
            <Text style={styles.statusLabel}>Win Rate</Text>
          </View>
        </View>
      </View>

      {/* Price Chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Precio BTC</Text>
        <LineChart
          data={{
            labels: ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30'],
            datasets: [{
              data: tradingData.slice(-6).map(d => d.price / 1000)
            }]
          }}
          width={width - 40}
          height={200}
          chartConfig={{
            backgroundColor: '#1F2937',
            backgroundGradientFrom: '#1F2937',
            backgroundGradientTo: '#374151',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16
            },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: '#10B981'
            }
          }}
          bezier
          style={styles.chart}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Acciones Rápidas</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>Ver Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionText}>Configurar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📈</Text>
            <Text style={styles.actionText}>Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>🔔</Text>
            <Text style={styles.actionText}>Alertas</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderTrading = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Portfolio</Text>
        <View style={styles.portfolioGrid}>
          <View style={styles.portfolioItem}>
            <Text style={styles.portfolioAsset}>BTC</Text>
            <Text style={styles.portfolioAmount}>0.5</Text>
            <Text style={styles.portfolioValue}>$22,615</Text>
          </View>
          <View style={styles.portfolioItem}>
            <Text style={styles.portfolioAsset}>ETH</Text>
            <Text style={styles.portfolioAmount}>2.1</Text>
            <Text style={styles.portfolioValue}>$6,510</Text>
          </View>
          <View style={styles.portfolioItem}>
            <Text style={styles.portfolioAsset}>USDT</Text>
            <Text style={styles.portfolioAmount}>15,000</Text>
            <Text style={styles.portfolioValue}>$15,000</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Órdenes Recientes</Text>
        <View style={styles.orderList}>
          <View style={styles.orderItem}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderSymbol}>BTCUSDT</Text>
              <Text style={styles.orderTime}>Hace 2 min</Text>
            </View>
            <View style={styles.orderDetails}>
              <Text style={styles.orderSide}>BUY</Text>
              <Text style={styles.orderPrice}>$45,230</Text>
            </View>
          </View>
          <View style={styles.orderItem}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderSymbol}>ETHUSDT</Text>
              <Text style={styles.orderTime}>Hace 15 min</Text>
            </View>
            <View style={styles.orderDetails}>
              <Text style={styles.orderSide}>SELL</Text>
              <Text style={styles.orderPrice}>$3,120</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderAlerts = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notificaciones</Text>
        <View style={styles.notificationList}>
          {notifications.map((notification) => (
            <View key={notification.id} style={styles.notificationItem}>
              <View style={styles.notificationIcon}>
                <Text style={styles.notificationEmoji}>
                  {getNotificationIcon(notification.type)}
                </Text>
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationTime}>
                  {notification.timestamp.toLocaleTimeString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderSettings = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Configuración</Text>
        <View style={styles.settingList}>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Notificaciones Push</Text>
            <View style={styles.toggle}>
              <View style={[styles.toggleButton, { backgroundColor: '#10B981' }]} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Modo Oscuro</Text>
            <View style={styles.toggle}>
              <View style={[styles.toggleButton, { backgroundColor: '#10B981' }]} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Biométrico</Text>
            <View style={styles.toggle}>
              <View style={[styles.toggleButton, { backgroundColor: '#6B7280' }]} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Información</Text>
        <View style={styles.infoList}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Versión</Text>
            <Text style={styles.infoValue}>2.0.0</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Última actualización</Text>
            <Text style={styles.infoValue}>Hace 2 días</Text>
          </View>
          <TouchableOpacity style={styles.infoItem} onPress={openWebDashboard}>
            <Text style={styles.infoLabel}>Dashboard Web</Text>
            <Text style={styles.infoValue}>Abrir →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Grok-Beast</Text>
        <View style={styles.headerStatus}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10B981' : '#EF4444' }]} />
          <Text style={styles.statusText}>
            {isConnected ? 'Conectado' : 'Desconectado'}
          </Text>
        </View>
      </View>

      {/* Tab Content */}
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'trading' && renderTrading()}
      {activeTab === 'alerts' && renderAlerts()}
      {activeTab === 'settings' && renderSettings()}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {(['dashboard', 'trading', 'alerts', 'settings'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.navItem, activeTab === tab && styles.navItemActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={styles.navIcon}>
              {tab === 'dashboard' && '📊'}
              {tab === 'trading' && '💰'}
              {tab === 'alerts' && '🔔'}
              {tab === 'settings' && '⚙️'}
            </Text>
            <Text style={[styles.navLabel, activeTab === tab && styles.navLabelActive]}>
              {tab === 'dashboard' && 'Dashboard'}
              {tab === 'trading' && 'Trading'}
              {tab === 'alerts' && 'Alertas'}
              {tab === 'settings' && 'Config'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  statusLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  portfolioGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  portfolioItem: {
    alignItems: 'center',
  },
  portfolioAsset: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  portfolioAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  portfolioValue: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  orderList: {
    marginTop: 10,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  orderInfo: {
    flex: 1,
  },
  orderSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  orderTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  orderDetails: {
    alignItems: 'flex-end',
  },
  orderSide: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
  },
  orderPrice: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 2,
  },
  notificationList: {
    marginTop: 10,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  notificationIcon: {
    marginRight: 12,
  },
  notificationEmoji: {
    fontSize: 20,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  notificationTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  settingList: {
    marginTop: 10,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  settingLabel: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  toggle: {
    width: 50,
    height: 30,
    backgroundColor: '#374151',
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#6B7280',
  },
  infoList: {
    marginTop: 10,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  infoLabel: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  infoValue: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingVertical: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navItemActive: {
    backgroundColor: '#374151',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  navLabelActive: {
    color: '#10B981',
    fontWeight: 'bold',
  },
});





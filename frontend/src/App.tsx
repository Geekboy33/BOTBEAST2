// src/App.tsx
import React, { useEffect, useState, Suspense, lazy } from "react";
import { fetchStatus } from "./api/statusApi";
import { useNotifications } from "./hooks/useNotifications";
import { usePWA } from "./hooks/usePWA";

// Lazy loading de componentes pesados
const MasterDashboard = lazy(() => import("./components/MasterDashboard"));
const BinanceDashboard = lazy(() => import("./components/BinanceDashboard"));
const ErrorBoundary = lazy(() => import("./components/ErrorBoundary"));

type BotStatus = {
  status: string;
  version: string;
};

export default function App() {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardMode, setDashboardMode] = useState<'master' | 'binance' | 'legacy'>('master');
  const { notifications, addNotification, removeNotification } = useNotifications();
  const { showInstallPrompt, installApp, dismissInstallPrompt } = usePWA();

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const statusData = await fetchStatus();
        setStatus(statusData);
        addNotification({
          type: 'success',
          title: 'Sistema Conectado',
          message: `Bot ${statusData.version} está funcionando correctamente`
        });
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Error de Conexión',
          message: 'No se pudo conectar con el backend'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadStatus();
  }, [addNotification]);

  // Simular alertas de trading
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        addNotification({
          type: Math.random() > 0.5 ? 'success' : 'warning',
          title: 'Nueva Orden',
          message: `Orden ${Math.random() > 0.5 ? 'BUY' : 'SELL'} ejecutada en BTCUSDT`,
          duration: 3000
        });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [addNotification]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-white">Cargando Grok-Beast...</div>
        </div>
      </div>
    );
  }

  // Dashboard Mode Selector
  const renderDashboard = () => {
    const DashboardComponent = dashboardMode === 'binance' ? BinanceDashboard : MasterDashboard;
    
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <div className="text-xl font-semibold text-white">Cargando Dashboard...</div>
          </div>
        </div>
      }>
        <DashboardComponent />
      </Suspense>
    );
  };

  return (
    <ErrorBoundary>
      <div>
        {/* Dashboard Mode Selector */}
        <div className="fixed top-4 left-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-2">
            <div className="flex space-x-1">
              <button
                onClick={() => setDashboardMode('master')}
                className={`px-3 py-1 rounded text-xs font-semibold ${
                  dashboardMode === 'master' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}
                aria-label="Switch to Master Dashboard"
              >
                Master
              </button>
              <button
                onClick={() => setDashboardMode('binance')}
                className={`px-3 py-1 rounded text-xs font-semibold ${
                  dashboardMode === 'binance' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}
                aria-label="Switch to Binance Dashboard"
              >
                Binance
              </button>
            </div>
          </div>
        </div>

        {renderDashboard()}
      
      {/* Notification Center */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg shadow-lg max-w-sm ${
              notification.type === 'success' ? 'bg-green-600' :
              notification.type === 'error' ? 'bg-red-600' :
              notification.type === 'warning' ? 'bg-yellow-600' : 'bg-blue-600'
            }`}
          >
            <div className="font-semibold">{notification.title}</div>
            <div className="text-sm opacity-90">{notification.message}</div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="absolute top-2 right-2 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* PWA Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-4 right-4 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg z-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-yellow-400">Instalar App</h3>
              <p className="text-sm text-gray-400">Instala Grok-Beast para acceso rápido</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={installApp}
                className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded text-sm"
              >
                Instalar
              </button>
              <button
                onClick={dismissInstallPrompt}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-sm"
              >
                Ahora no
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );

}
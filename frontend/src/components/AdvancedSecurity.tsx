// src/components/AdvancedSecurity.tsx
import React, { useState, useEffect } from 'react';

interface SecuritySettings {
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  sessionTimeout: number;
  loginAttempts: number;
  maxLoginAttempts: number;
  lastLogin: Date;
  ipWhitelist: string[];
  auditLogs: AuditLog[];
}

interface AuditLog {
  id: string;
  timestamp: Date;
  action: string;
  user: string;
  ip: string;
  status: 'success' | 'failed' | 'blocked';
  details: string;
}

export default function AdvancedSecurity() {
  const [settings, setSettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    biometricEnabled: false,
    sessionTimeout: 30,
    loginAttempts: 0,
    maxLoginAttempts: 5,
    lastLogin: new Date(),
    ipWhitelist: ['192.168.1.1', '10.0.0.1'],
    auditLogs: []
  });

  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [activeTab, setActiveTab] = useState<'settings' | 'audit' | 'sessions'>('settings');

  useEffect(() => {
    // Load security settings and audit logs
    const mockAuditLogs: AuditLog[] = [
      {
        id: '1',
        timestamp: new Date('2024-01-15T10:30:00'),
        action: 'LOGIN',
        user: 'admin@grok-beast.com',
        ip: '192.168.1.100',
        status: 'success',
        details: 'Login exitoso con 2FA'
      },
      {
        id: '2',
        timestamp: new Date('2024-01-15T10:25:00'),
        action: 'LOGIN_ATTEMPT',
        user: 'admin@grok-beast.com',
        ip: '192.168.1.100',
        status: 'failed',
        details: 'Código 2FA incorrecto'
      },
      {
        id: '3',
        timestamp: new Date('2024-01-15T09:45:00'),
        action: 'CONFIG_CHANGE',
        user: 'admin@grok-beast.com',
        ip: '192.168.1.100',
        status: 'success',
        details: 'Configuración de bot modificada'
      },
      {
        id: '4',
        timestamp: new Date('2024-01-15T09:30:00'),
        action: 'TRADE_EXECUTION',
        user: 'system',
        ip: '127.0.0.1',
        status: 'success',
        details: 'Orden BUY ejecutada: BTCUSDT @ $45,230'
      },
      {
        id: '5',
        timestamp: new Date('2024-01-15T08:15:00'),
        action: 'LOGIN_ATTEMPT',
        user: 'unknown',
        ip: '203.0.113.1',
        status: 'blocked',
        details: 'Múltiples intentos de login fallidos'
      }
    ];

    setSettings(prev => ({
      ...prev,
      auditLogs: mockAuditLogs
    }));
  }, []);

  const enable2FA = async () => {
    try {
      // Simulate 2FA setup
      const mockQRCode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      setQrCode(mockQRCode);
      setShow2FASetup(true);
    } catch (error) {
      console.error('Error setting up 2FA:', error);
    }
  };

  const verify2FA = async () => {
    try {
      // Simulate verification
      if (verificationCode === '123456') { // Mock verification
        setSettings(prev => ({ ...prev, twoFactorEnabled: true }));
        setShow2FASetup(false);
        addAuditLog('2FA_ENABLED', 'success', 'Autenticación de dos factores habilitada');
      } else {
        addAuditLog('2FA_VERIFICATION', 'failed', 'Código de verificación incorrecto');
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error);
    }
  };

  const enableBiometric = async () => {
    try {
      // Check if biometric is available
      if ('credentials' in navigator) {
        setSettings(prev => ({ ...prev, biometricEnabled: true }));
        addAuditLog('BIOMETRIC_ENABLED', 'success', 'Autenticación biométrica habilitada');
      } else {
        alert('Autenticación biométrica no disponible en este dispositivo');
      }
    } catch (error) {
      console.error('Error enabling biometric:', error);
    }
  };

  const addAuditLog = (action: string, status: 'success' | 'failed' | 'blocked', details: string) => {
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      action,
      user: 'admin@grok-beast.com',
      ip: '192.168.1.100',
      status,
      details
    };

    setSettings(prev => ({
      ...prev,
      auditLogs: [newLog, ...prev.auditLogs]
    }));
  };

  const addIPToWhitelist = (ip: string) => {
    if (ip && !settings.ipWhitelist.includes(ip)) {
      setSettings(prev => ({
        ...prev,
        ipWhitelist: [...prev.ipWhitelist, ip]
      }));
      addAuditLog('IP_WHITELIST_ADD', 'success', `IP ${ip} añadida a la lista blanca`);
    }
  };

  const removeIPFromWhitelist = (ip: string) => {
    setSettings(prev => ({
      ...prev,
      ipWhitelist: prev.ipWhitelist.filter(i => i !== ip)
    }));
    addAuditLog('IP_WHITELIST_REMOVE', 'success', `IP ${ip} removida de la lista blanca`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'blocked': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'failed': return '❌';
      case 'blocked': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Seguridad Avanzada</h3>
        <div className="flex space-x-2">
          {(['settings', 'audit', 'sessions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded text-sm ${
                activeTab === tab ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              {tab === 'settings' && 'Configuración'}
              {tab === 'audit' && 'Auditoría'}
              {tab === 'sessions' && 'Sesiones'}
            </button>
          ))}
        </div>
      </div>

      {/* Security Status */}
      <div className="mb-6 p-4 bg-gray-700 rounded">
        <h4 className="font-semibold mb-3">Estado de Seguridad</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${settings.twoFactorEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm">
              2FA: {settings.twoFactorEnabled ? 'Habilitado' : 'Deshabilitado'}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${settings.biometricEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm">
              Biométrico: {settings.biometricEnabled ? 'Habilitado' : 'Deshabilitado'}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm">
              Último Login: {settings.lastLogin.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* 2FA Setup */}
          <div className="bg-gray-700 p-4 rounded">
            <h4 className="font-semibold mb-4">Autenticación de Dos Factores</h4>
            {!settings.twoFactorEnabled ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  Añade una capa extra de seguridad a tu cuenta
                </p>
                <button
                  onClick={enable2FA}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
                >
                  Configurar 2FA
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">✅</span>
                  <span className="text-green-400 font-semibold">2FA Habilitado</span>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, twoFactorEnabled: false }))}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
                >
                  Deshabilitar 2FA
                </button>
              </div>
            )}

            {show2FASetup && (
              <div className="mt-4 p-4 bg-gray-600 rounded">
                <h5 className="font-semibold mb-2">Configurar 2FA</h5>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">
                      Escanea este código QR con tu app de autenticación:
                    </p>
                    <div className="w-32 h-32 bg-white rounded flex items-center justify-center">
                      <span className="text-gray-600 text-xs">QR Code</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Código de Verificación
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full p-2 bg-gray-700 rounded"
                      placeholder="123456"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={verify2FA}
                      className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
                    >
                      Verificar
                    </button>
                    <button
                      onClick={() => setShow2FASetup(false)}
                      className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Biometric Authentication */}
          <div className="bg-gray-700 p-4 rounded">
            <h4 className="font-semibold mb-4">Autenticación Biométrica</h4>
            {!settings.biometricEnabled ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  Usa tu huella dactilar o reconocimiento facial para acceder
                </p>
                <button
                  onClick={enableBiometric}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
                >
                  Habilitar Biométrico
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">✅</span>
                  <span className="text-green-400 font-semibold">Biométrico Habilitado</span>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, biometricEnabled: false }))}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
                >
                  Deshabilitar Biométrico
                </button>
              </div>
            )}
          </div>

          {/* Session Management */}
          <div className="bg-gray-700 p-4 rounded">
            <h4 className="font-semibold mb-4">Gestión de Sesiones</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Timeout de Sesión (minutos)
                </label>
                <input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeout: Number(e.target.value) }))}
                  className="w-full p-2 bg-gray-600 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Máximo Intentos de Login
                </label>
                <input
                  type="number"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxLoginAttempts: Number(e.target.value) }))}
                  className="w-full p-2 bg-gray-600 rounded"
                />
              </div>
            </div>
          </div>

          {/* IP Whitelist */}
          <div className="bg-gray-700 p-4 rounded">
            <h4 className="font-semibold mb-4">Lista Blanca de IPs</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                {settings.ipWhitelist.map((ip, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-600 rounded">
                    <span className="font-mono text-sm">{ip}</span>
                    <button
                      onClick={() => removeIPFromWhitelist(ip)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="192.168.1.100"
                  className="flex-1 p-2 bg-gray-600 rounded"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addIPToWhitelist((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    addIPToWhitelist(input.value);
                    input.value = '';
                  }}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
                >
                  Añadir IP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Tab */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <h4 className="font-semibold">Registro de Auditoría</h4>
          <div className="space-y-2">
            {settings.auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-gray-700 rounded">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span>{getStatusIcon(log.status)}</span>
                      <span className="font-semibold">{log.action}</span>
                      <span className={`text-sm ${getStatusColor(log.status)}`}>
                        {log.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{log.details}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>Usuario: {log.user}</span>
                      <span>IP: {log.ip}</span>
                      <span>{log.timestamp.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <h4 className="font-semibold">Sesiones Activas</h4>
          <div className="space-y-2">
            <div className="p-3 bg-gray-700 rounded">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">Sesión Principal</div>
                  <div className="text-sm text-gray-400">
                    IP: 192.168.1.100 | Última actividad: hace 2 minutos
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-400">Activa</span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-gray-700 rounded">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">Sesión Móvil</div>
                  <div className="text-sm text-gray-400">
                    IP: 192.168.1.101 | Última actividad: hace 15 minutos
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-yellow-400">Inactiva</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





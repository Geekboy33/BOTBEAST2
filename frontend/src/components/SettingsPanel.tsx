// src/components/SettingsPanel.tsx
import React, { useState, useEffect } from 'react';

interface SystemSettings {
  dryRun: boolean;
  maxPositions: number;
  defaultRiskLevel: 'conservative' | 'risky' | 'turbo';
  stopLossPercent: number;
  takeProfitPercent: number;
  maxDrawdownPercent: number;
  leverageMultiplier: number;
}

interface NotificationSettings {
  email: string;
  telegram: string;
  sms: string;
  webhook: string;
  priceAlerts: boolean;
  pnlAlerts: boolean;
  errorAlerts: boolean;
  tradeAlerts: boolean;
}

interface AISettings {
  model: string;
  autopilotEnabled: boolean;
  riskLevel: 'conservative' | 'risky' | 'turbo';
  maxLeverage: number;
  confidenceThreshold: number;
  learningRate: number;
  epsilon: number;
  updateFrequency: number;
}

interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number;
  ipWhitelist: string[];
  biometricAuth: boolean;
  auditLogs: boolean;
  encryptionLevel: 'basic' | 'standard' | 'high';
}

export default function SettingsPanel() {
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    dryRun: true,
    maxPositions: 5,
    defaultRiskLevel: 'conservative',
    stopLossPercent: 2.0,
    takeProfitPercent: 5.0,
    maxDrawdownPercent: 10.0,
    leverageMultiplier: 1.0
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email: '',
    telegram: '',
    sms: '',
    webhook: '',
    priceAlerts: true,
    pnlAlerts: true,
    errorAlerts: true,
    tradeAlerts: false
  });

  const [aiSettings, setAISettings] = useState<AISettings>({
    model: 'gpt-oss:120b',
    autopilotEnabled: false,
    riskLevel: 'conservative',
    maxLeverage: 3,
    confidenceThreshold: 0.7,
    learningRate: 0.001,
    epsilon: 0.1,
    updateFrequency: 30
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorAuth: false,
    sessionTimeout: 3600,
    ipWhitelist: [],
    biometricAuth: false,
    auditLogs: true,
    encryptionLevel: 'standard'
  });

  const [activeTab, setActiveTab] = useState<'system' | 'notifications' | 'ai' | 'security' | 'advanced'>('system');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/config');
      const config = await response.json();
      
      // Actualizar configuraciones con datos del servidor
      if (config.system) setSystemSettings(config.system);
      if (config.notifications) setNotificationSettings(config.notifications);
      if (config.ai) setAISettings(config.ai);
      if (config.security) setSecuritySettings(config.security);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: systemSettings,
          notifications: notificationSettings,
          ai: aiSettings,
          security: securitySettings
        })
      });

      if (response.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (confirm('¿Estás seguro de que quieres restaurar la configuración por defecto?')) {
      loadSettings();
    }
  };

  const addIPAddress = (ip: string) => {
    if (ip && !securitySettings.ipWhitelist.includes(ip)) {
      setSecuritySettings(prev => ({
        ...prev,
        ipWhitelist: [...prev.ipWhitelist, ip]
      }));
    }
  };

  const removeIPAddress = (ip: string) => {
    setSecuritySettings(prev => ({
      ...prev,
      ipWhitelist: prev.ipWhitelist.filter(addr => addr !== ip)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Settings & Configuration</h2>
        <div className="flex space-x-4">
          <button
            onClick={resetToDefaults}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded font-semibold"
          >
            Reset to Defaults
          </button>
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className={`px-6 py-2 rounded font-semibold ${
              isSaving 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Save Status */}
      {saveStatus === 'success' && (
        <div className="bg-green-600 text-white p-4 rounded-lg">
          ✅ Settings saved successfully!
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="bg-red-600 text-white p-4 rounded-lg">
          ❌ Error saving settings. Please try again.
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {[
          { key: 'system', label: 'System' },
          { key: 'notifications', label: 'Notifications' },
          { key: 'ai', label: 'AI Settings' },
          { key: 'security', label: 'Security' },
          { key: 'advanced', label: 'Advanced' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-yellow-400 text-yellow-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* System Settings Tab */}
      {activeTab === 'system' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Trading Configuration</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Dry Run Mode</span>
                <button
                  onClick={() => setSystemSettings({...systemSettings, dryRun: !systemSettings.dryRun})}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    systemSettings.dryRun ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    systemSettings.dryRun ? 'translate-x-6' : 'translate-x-0.5'
                  }`}></div>
                </button>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Max Concurrent Positions</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={systemSettings.maxPositions}
                  onChange={(e) => setSystemSettings({...systemSettings, maxPositions: parseInt(e.target.value)})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Default Risk Level</label>
                <select
                  value={systemSettings.defaultRiskLevel}
                  onChange={(e) => setSystemSettings({...systemSettings, defaultRiskLevel: e.target.value as any})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                >
                  <option value="conservative">Conservative (1-2x)</option>
                  <option value="risky">Risky (3-5x)</option>
                  <option value="turbo">Turbo (6-10x)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Stop Loss (%)</label>
                <input
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={systemSettings.stopLossPercent}
                  onChange={(e) => setSystemSettings({...systemSettings, stopLossPercent: parseFloat(e.target.value)})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Take Profit (%)</label>
                <input
                  type="number"
                  min="0.1"
                  max="20"
                  step="0.1"
                  value={systemSettings.takeProfitPercent}
                  onChange={(e) => setSystemSettings({...systemSettings, takeProfitPercent: parseFloat(e.target.value)})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Risk Management</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Max Drawdown (%)</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  step="0.1"
                  value={systemSettings.maxDrawdownPercent}
                  onChange={(e) => setSystemSettings({...systemSettings, maxDrawdownPercent: parseFloat(e.target.value)})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Leverage Multiplier</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.1"
                  value={systemSettings.leverageMultiplier}
                  onChange={(e) => setSystemSettings({...systemSettings, leverageMultiplier: parseFloat(e.target.value)})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>

              <div className="p-4 bg-yellow-900 border border-yellow-600 rounded">
                <h4 className="font-semibold text-yellow-400 mb-2">⚠️ Risk Warning</h4>
                <p className="text-sm text-yellow-200">
                  High leverage trading carries significant risk. Only use leverage you can afford to lose.
                  The system will automatically reduce leverage if drawdown exceeds limits.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Settings Tab */}
      {activeTab === 'notifications' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Notification Channels</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={notificationSettings.email}
                  onChange={(e) => setNotificationSettings({...notificationSettings, email: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Telegram Bot Token</label>
                <input
                  type="text"
                  value={notificationSettings.telegram}
                  onChange={(e) => setNotificationSettings({...notificationSettings, telegram: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  placeholder="Bot Token"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">SMS Number</label>
                <input
                  type="tel"
                  value={notificationSettings.sms}
                  onChange={(e) => setNotificationSettings({...notificationSettings, sms: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  placeholder="+1234567890"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Webhook URL</label>
                <input
                  type="url"
                  value={notificationSettings.webhook}
                  onChange={(e) => setNotificationSettings({...notificationSettings, webhook: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  placeholder="https://your-webhook.com/endpoint"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Alert Types</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Price Alerts</span>
                <button
                  onClick={() => setNotificationSettings({...notificationSettings, priceAlerts: !notificationSettings.priceAlerts})}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    notificationSettings.priceAlerts ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    notificationSettings.priceAlerts ? 'translate-x-6' : 'translate-x-0.5'
                  }`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">P&L Alerts</span>
                <button
                  onClick={() => setNotificationSettings({...notificationSettings, pnlAlerts: !notificationSettings.pnlAlerts})}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    notificationSettings.pnlAlerts ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    notificationSettings.pnlAlerts ? 'translate-x-6' : 'translate-x-0.5'
                  }`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Error Alerts</span>
                <button
                  onClick={() => setNotificationSettings({...notificationSettings, errorAlerts: !notificationSettings.errorAlerts})}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    notificationSettings.errorAlerts ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    notificationSettings.errorAlerts ? 'translate-x-6' : 'translate-x-0.5'
                  }`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Trade Alerts</span>
                <button
                  onClick={() => setNotificationSettings({...notificationSettings, tradeAlerts: !notificationSettings.tradeAlerts})}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    notificationSettings.tradeAlerts ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    notificationSettings.tradeAlerts ? 'translate-x-6' : 'translate-x-0.5'
                  }`}></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Settings Tab */}
      {activeTab === 'ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">AI Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">AI Model</label>
                <select
                  value={aiSettings.model}
                  onChange={(e) => setAISettings({...aiSettings, model: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                >
                  <option value="gpt-oss:120b">GPT OSS 120B</option>
                  <option value="trader-oss-120">Trader OSS 120 (Fine-tuned)</option>
                  <option value="llama2:7b">Llama 2 7B</option>
                  <option value="codellama:7b">Code Llama 7B</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Autopilot Mode</span>
                <button
                  onClick={() => setAISettings({...aiSettings, autopilotEnabled: !aiSettings.autopilotEnabled})}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    aiSettings.autopilotEnabled ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    aiSettings.autopilotEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}></div>
                </button>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Max Leverage</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={aiSettings.maxLeverage}
                  onChange={(e) => setAISettings({...aiSettings, maxLeverage: parseInt(e.target.value)})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Confidence Threshold</label>
                <input
                  type="number"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={aiSettings.confidenceThreshold}
                  onChange={(e) => setAISettings({...aiSettings, confidenceThreshold: parseFloat(e.target.value)})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Learning Parameters</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Learning Rate</label>
                <input
                  type="number"
                  min="0.0001"
                  max="0.01"
                  step="0.0001"
                  value={aiSettings.learningRate}
                  onChange={(e) => setAISettings({...aiSettings, learningRate: parseFloat(e.target.value)})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Epsilon (Exploration)</label>
                <input
                  type="number"
                  min="0.01"
                  max="1"
                  step="0.01"
                  value={aiSettings.epsilon}
                  onChange={(e) => setAISettings({...aiSettings, epsilon: parseFloat(e.target.value)})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Update Frequency (seconds)</label>
                <input
                  type="number"
                  min="10"
                  max="300"
                  value={aiSettings.updateFrequency}
                  onChange={(e) => setAISettings({...aiSettings, updateFrequency: parseInt(e.target.value)})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>

              <div className="p-4 bg-blue-900 border border-blue-600 rounded">
                <h4 className="font-semibold text-blue-400 mb-2">🤖 AI Information</h4>
                <p className="text-sm text-blue-200">
                  The AI model learns from your trading patterns and market conditions.
                  Higher confidence threshold means more conservative decisions.
                  Epsilon controls exploration vs exploitation balance.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Settings Tab */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Authentication</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Two-Factor Authentication</span>
                <button
                  onClick={() => setSecuritySettings({...securitySettings, twoFactorAuth: !securitySettings.twoFactorAuth})}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    securitySettings.twoFactorAuth ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    securitySettings.twoFactorAuth ? 'translate-x-6' : 'translate-x-0.5'
                  }`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Biometric Authentication</span>
                <button
                  onClick={() => setSecuritySettings({...securitySettings, biometricAuth: !securitySettings.biometricAuth})}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    securitySettings.biometricAuth ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    securitySettings.biometricAuth ? 'translate-x-6' : 'translate-x-0.5'
                  }`}></div>
                </button>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Session Timeout (seconds)</label>
                <input
                  type="number"
                  min="300"
                  max="86400"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Encryption Level</label>
                <select
                  value={securitySettings.encryptionLevel}
                  onChange={(e) => setSecuritySettings({...securitySettings, encryptionLevel: e.target.value as any})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                >
                  <option value="basic">Basic (AES-128)</option>
                  <option value="standard">Standard (AES-256)</option>
                  <option value="high">High (AES-256 + RSA)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Access Control</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Audit Logs</span>
                <button
                  onClick={() => setSecuritySettings({...securitySettings, auditLogs: !securitySettings.auditLogs})}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    securitySettings.auditLogs ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    securitySettings.auditLogs ? 'translate-x-6' : 'translate-x-0.5'
                  }`}></div>
                </button>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">IP Whitelist</label>
                <div className="space-y-2">
                  {securitySettings.ipWhitelist.map((ip, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-700 rounded px-3 py-2">
                      <span className="text-sm">{ip}</span>
                      <button
                        onClick={() => removeIPAddress(ip)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="192.168.1.1"
                      className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addIPAddress((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.querySelector('input[placeholder="192.168.1.1"]') as HTMLInputElement;
                        if (input) {
                          addIPAddress(input.value);
                          input.value = '';
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-red-900 border border-red-600 rounded">
                <h4 className="font-semibold text-red-400 mb-2">🔒 Security Notice</h4>
                <p className="text-sm text-red-200">
                  Enable 2FA and IP whitelisting for maximum security.
                  Audit logs track all system activities for compliance.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Settings Tab */}
      {activeTab === 'advanced' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">System Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Log Level</label>
                <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2">
                  <option value="DEBUG">DEBUG</option>
                  <option value="INFO">INFO</option>
                  <option value="WARNING">WARNING</option>
                  <option value="ERROR">ERROR</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Cache TTL (seconds)</label>
                <input
                  type="number"
                  min="10"
                  max="3600"
                  defaultValue="300"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Database Connection Pool</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  defaultValue="10"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Enable Metrics</span>
                <button className="w-12 h-6 rounded-full bg-green-600">
                  <div className="w-5 h-5 bg-white rounded-full translate-x-6"></div>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">API Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">API Rate Limit (requests/min)</label>
                <input
                  type="number"
                  min="10"
                  max="10000"
                  defaultValue="1000"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">WebSocket Buffer Size</label>
                <input
                  type="number"
                  min="1024"
                  max="1048576"
                  defaultValue="65536"
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Enable API Keys</span>
                <button className="w-12 h-6 rounded-full bg-green-600">
                  <div className="w-5 h-5 bg-white rounded-full translate-x-6"></div>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">CORS Enabled</span>
                <button className="w-12 h-6 rounded-full bg-green-600">
                  <div className="w-5 h-5 bg-white rounded-full translate-x-6"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




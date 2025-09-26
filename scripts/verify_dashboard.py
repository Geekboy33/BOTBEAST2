#!/usr/bin/env python3
"""
Script de verificación del dashboard Grok-Beast Trading Bot
Verifica que todos los endpoints y funcionalidades estén operativos
"""

import requests
import json
import time
from datetime import datetime

class DashboardVerifier:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.checks_passed = 0
        self.checks_failed = 0
        self.warnings = []
    
    def print_header(self, title):
        print(f"\n{'='*60}")
        print(f"🔍 {title}")
        print(f"{'='*60}")
    
    def print_check(self, name, status, details=""):
        if status:
            print(f"✅ {name}")
            self.checks_passed += 1
        else:
            print(f"❌ {name}")
            self.checks_failed += 1
            if details:
                print(f"   {details}")
    
    def print_warning(self, message):
        print(f"⚠️  {message}")
        self.warnings.append(message)
    
    def test_endpoint(self, endpoint, expected_keys=None):
        """Probar un endpoint específico"""
        try:
            response = requests.get(f"{self.base_url}{endpoint}", timeout=5)
            if response.status_code == 200:
                data = response.json()
                if expected_keys:
                    for key in expected_keys:
                        if key not in data:
                            return False, f"Missing key: {key}"
                return True, data
            else:
                return False, f"HTTP {response.status_code}"
        except Exception as e:
            return False, str(e)
    
    def test_post_endpoint(self, endpoint, data):
        """Probar un endpoint POST"""
        try:
            response = requests.post(
                f"{self.base_url}{endpoint}", 
                json=data, 
                headers={"Content-Type": "application/json"},
                timeout=5
            )
            if response.status_code in [200, 201]:
                return True, response.json()
            else:
                return False, f"HTTP {response.status_code}"
        except Exception as e:
            return False, str(e)
    
    def verify_basic_endpoints(self):
        """Verificar endpoints básicos"""
        self.print_header("VERIFICACIÓN DE ENDPOINTS BÁSICOS")
        
        # Status
        success, data = self.test_endpoint("/api/status", ["status", "version", "modules"])
        self.print_check("API Status", success, data if not success else "")
        
        # Health
        success, data = self.test_endpoint("/api/health", ["status", "version"])
        self.print_check("Health Check", success, data if not success else "")
        
        # Config
        success, data = self.test_endpoint("/api/config")
        self.print_check("Configuration", success, data if not success else "")
        
        # Metrics
        success, data = self.test_endpoint("/api/metrics")
        self.print_check("Metrics", success, data if not success else "")
    
    def verify_trading_endpoints(self):
        """Verificar endpoints de trading"""
        self.print_header("VERIFICACIÓN DE ENDPOINTS DE TRADING")
        
        # Orders
        success, data = self.test_endpoint("/api/orders")
        self.print_check("Get Orders", success, data if not success else "")
        
        # Create Order
        order_data = {
            "symbol": "BTCUSDT",
            "side": "buy",
            "type": "market",
            "quantity": 0.001
        }
        success, data = self.test_post_endpoint("/api/orders", order_data)
        self.print_check("Create Order", success, data if not success else "")
        
        # Trades
        success, data = self.test_endpoint("/api/trades")
        self.print_check("Get Trades", success, data if not success else "")
        
        # Prices
        success, data = self.test_endpoint("/api/prices")
        self.print_check("Get Prices", success, data if not success else "")
        
        if success and data:
            symbols = list(data.keys())
            print(f"   📊 Precios disponibles para: {', '.join(symbols)}")
    
    def verify_portfolio_endpoints(self):
        """Verificar endpoints de portfolio"""
        self.print_header("VERIFICACIÓN DE ENDPOINTS DE PORTFOLIO")
        
        # Portfolio
        success, data = self.test_endpoint("/api/portfolio")
        self.print_check("Get Portfolio", success, data if not success else "")
        
        # Portfolio Metrics
        success, data = self.test_endpoint("/api/portfolio/metrics")
        self.print_check("Portfolio Metrics", success, data if not success else "")
    
    def verify_alert_endpoints(self):
        """Verificar endpoints de alertas"""
        self.print_header("VERIFICACIÓN DE ENDPOINTS DE ALERTAS")
        
        # Get Alerts
        success, data = self.test_endpoint("/api/alerts")
        self.print_check("Get Alerts", success, data if not success else "")
        
        # Create Alert
        alert_data = {
            "type": "price",
            "condition": "above",
            "value": 50000,
            "symbol": "BTCUSDT",
            "channels": ["telegram"]
        }
        success, data = self.test_post_endpoint("/api/alerts", alert_data)
        self.print_check("Create Alert", success, data if not success else "")
    
    def verify_bot_endpoints(self):
        """Verificar endpoints del bot"""
        self.print_header("VERIFICACIÓN DE ENDPOINTS DEL BOT")
        
        # Bot Status
        success, data = self.test_endpoint("/api/bot/status", ["status", "symbols"])
        self.print_check("Bot Status", success, data if not success else "")
        
        # Bot Metrics
        success, data = self.test_endpoint("/api/bot/metrics")
        self.print_check("Bot Metrics", success, data if not success else "")
        
        # Start Bot
        success, data = self.test_post_endpoint("/api/bot/start", {})
        self.print_check("Start Bot", success, data if not success else "")
        
        # Stop Bot
        success, data = self.test_post_endpoint("/api/bot/stop", {})
        self.print_check("Stop Bot", success, data if not success else "")
    
    def verify_virtual_trader(self):
        """Verificar Virtual Trader"""
        self.print_header("VERIFICACIÓN DE VIRTUAL TRADER")
        
        success, data = self.test_endpoint("/api/virtual/status")
        self.print_check("Virtual Trader Status", success, data if not success else "")
        
        if success and data:
            open_positions = data.get("open_positions", {})
            closed_stats = data.get("closed_stats", {})
            print(f"   📈 Posiciones abiertas: {len(open_positions)}")
            print(f"   💰 Trades totales: {closed_stats.get('total_trades', 0)}")
            print(f"   📊 Retorno acumulado: {closed_stats.get('cumulative_return', 0):.2%}")
    
    def verify_frontend(self):
        """Verificar que el frontend esté accesible"""
        self.print_header("VERIFICACIÓN DEL FRONTEND")
        
        try:
            response = requests.get(f"{self.base_url}/", timeout=5)
            if response.status_code == 200:
                content = response.text
                if "Grok-Beast" in content or "React" in content or "index.html" in content:
                    self.print_check("Frontend React", True)
                    print(f"   📄 Tamaño de respuesta: {len(content)} bytes")
                else:
                    self.print_check("Frontend React", False, "Contenido no reconocido")
            else:
                self.print_check("Frontend React", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.print_check("Frontend React", False, str(e))
    
    def test_websocket(self):
        """Probar conexión WebSocket"""
        self.print_header("VERIFICACIÓN DE WEBSOCKET")
        
        try:
            import websocket
            import threading
            
            received_messages = []
            
            def on_message(ws, message):
                received_messages.append(message)
            
            def on_error(ws, error):
                print(f"   ❌ Error WebSocket: {error}")
            
            def on_close(ws, close_status_code, close_msg):
                print("   🔌 Conexión WebSocket cerrada")
            
            def on_open(ws):
                print("   🔌 Conexión WebSocket establecida")
            
            # Conectar WebSocket
            ws_url = self.base_url.replace("http", "ws") + "/ws"
            ws = websocket.WebSocketApp(
                ws_url,
                on_open=on_open,
                on_message=on_message,
                on_error=on_error,
                on_close=on_close
            )
            
            # Ejecutar en hilo separado
            wst = threading.Thread(target=ws.run_forever)
            wst.daemon = True
            wst.start()
            
            # Esperar mensajes
            time.sleep(3)
            
            if received_messages:
                self.print_check("WebSocket Logs", True)
                print(f"   📨 Mensajes recibidos: {len(received_messages)}")
                # Mostrar último mensaje
                if received_messages:
                    last_msg = json.loads(received_messages[-1])
                    print(f"   📝 Último log: {last_msg.get('message', 'N/A')}")
            else:
                self.print_check("WebSocket Logs", False, "No se recibieron mensajes")
            
            ws.close()
            
        except ImportError:
            self.print_check("WebSocket Logs", False, "websocket-client no instalado")
            self.print_warning("Instalar: pip install websocket-client")
        except Exception as e:
            self.print_check("WebSocket Logs", False, str(e))
    
    def generate_report(self):
        """Generar reporte final"""
        self.print_header("REPORTE FINAL")
        
        total_checks = self.checks_passed + self.checks_failed
        success_rate = (self.checks_passed / total_checks * 100) if total_checks > 0 else 0
        
        print(f"📊 Estadísticas:")
        print(f"   ✅ Checks exitosos: {self.checks_passed}")
        print(f"   ❌ Checks fallidos: {self.checks_failed}")
        print(f"   📈 Tasa de éxito: {success_rate:.1f}%")
        
        if self.warnings:
            print(f"\n⚠️  Advertencias ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"   - {warning}")
        
        if success_rate >= 90:
            print(f"\n🎉 ¡Dashboard funcionando correctamente!")
            print(f"🌐 Accede a: {self.base_url}")
        elif success_rate >= 70:
            print(f"\n⚠️  Dashboard parcialmente funcional. Revisa los errores.")
        else:
            print(f"\n❌ Dashboard con problemas significativos. Revisa la configuración.")
        
        print(f"\n🚀 COMANDOS PARA INICIAR:")
        print(f"   1. Dashboard: python scripts/run_dashboard_simple.py")
        print(f"   2. Navegador: {self.base_url}")
    
    def run_all_checks(self):
        """Ejecutar todas las verificaciones"""
        print("🚀 VERIFICADOR DEL DASHBOARD GROK-BEAST TRADING BOT")
        print(f"🌐 Verificando: {self.base_url}")
        
        self.verify_basic_endpoints()
        self.verify_trading_endpoints()
        self.verify_portfolio_endpoints()
        self.verify_alert_endpoints()
        self.verify_bot_endpoints()
        self.verify_virtual_trader()
        self.verify_frontend()
        self.test_websocket()
        self.generate_report()

if __name__ == "__main__":
    verifier = DashboardVerifier()
    verifier.run_all_checks()




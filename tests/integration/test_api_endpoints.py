"""
Tests de integración para endpoints de API
"""
import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import json

# Importar la aplicación FastAPI
import sys
from pathlib import Path
root_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(root_dir))

from scripts.advanced_server import app


@pytest.fixture
def client():
    """Cliente de test para FastAPI"""
    return TestClient(app)


class TestHealthEndpoints:
    """Tests para endpoints de salud"""
    
    def test_root_endpoint(self, client):
        """Test endpoint raíz"""
        response = client.get("/")
        assert response.status_code == 200
    
    def test_health_endpoint(self, client):
        """Test endpoint de salud"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"
    
    def test_metrics_endpoint(self, client):
        """Test endpoint de métricas"""
        response = client.get("/metrics")
        assert response.status_code == 200
        # Verificar que retorna métricas en formato Prometheus
        assert "grok_beast_" in response.text


class TestBotStatusEndpoints:
    """Tests para endpoints de estado del bot"""
    
    def test_bot_status(self, client):
        """Test estado del bot"""
        response = client.get("/api/bot/status")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "version" in data
        assert "uptime" in data
    
    def test_bot_metrics(self, client):
        """Test métricas del bot"""
        response = client.get("/api/bot/metrics")
        assert response.status_code == 200
        data = response.json()
        assert "total_trades" in data
        assert "win_rate" in data
        assert "total_pnl" in data


class TestTechnicalAnalysisEndpoints:
    """Tests para endpoints de análisis técnico"""
    
    def test_support_resistance_analysis(self, client):
        """Test análisis de soportes y resistencias"""
        response = client.get("/api/technical/support-resistance?symbol=BTCUSDT")
        assert response.status_code == 200
        data = response.json()
        assert "signals" in data
        assert "confidence" in data
        assert "support_levels" in data
        assert "resistance_levels" in data
    
    def test_channel_analysis(self, client):
        """Test análisis de canales"""
        response = client.get("/api/technical/channels?symbol=BTCUSDT")
        assert response.status_code == 200
        data = response.json()
        assert "signals" in data
        assert "channels" in data
    
    def test_ict_analysis(self, client):
        """Test análisis ICT"""
        response = client.get("/api/technical/ict?symbol=BTCUSDT")
        assert response.status_code == 200
        data = response.json()
        assert "signals" in data
        assert "order_blocks" in data
        assert "fair_value_gaps" in data
    
    def test_fibonacci_analysis(self, client):
        """Test análisis Fibonacci"""
        response = client.get("/api/technical/fibonacci?symbol=BTCUSDT")
        assert response.status_code == 200
        data = response.json()
        assert "signals" in data
        assert "fibonacci_levels" in data
    
    def test_session_analysis(self, client):
        """Test análisis de sesiones"""
        response = client.get("/api/technical/sessions?symbol=BTCUSDT")
        assert response.status_code == 200
        data = response.json()
        assert "session_analysis" in data
        assert "optimal_entry_times" in data
    
    def test_spread_analysis(self, client):
        """Test análisis de spread"""
        response = client.get("/api/technical/spread?symbol=BTCUSDT")
        assert response.status_code == 200
        data = response.json()
        assert "spread_analysis" in data
        assert "liquidity_conditions" in data


class TestAutopilotEndpoints:
    """Tests para endpoints de piloto automático"""
    
    def test_autopilot_status(self, client):
        """Test estado del piloto automático"""
        response = client.get("/api/autopilot/status")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "is_running" in data
        assert "enabled_strategies" in data
    
    def test_autopilot_start(self, client):
        """Test iniciar piloto automático"""
        response = client.post("/api/autopilot/start")
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert "message" in data
    
    def test_autopilot_stop(self, client):
        """Test detener piloto automático"""
        response = client.post("/api/autopilot/stop")
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert "message" in data
    
    def test_autopilot_pause(self, client):
        """Test pausar piloto automático"""
        response = client.post("/api/autopilot/pause")
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
    
    def test_autopilot_resume(self, client):
        """Test reanudar piloto automático"""
        response = client.post("/api/autopilot/resume")
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
    
    def test_autopilot_emergency_stop(self, client):
        """Test parada de emergencia"""
        response = client.post("/api/autopilot/emergency-stop")
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
    
    def test_autopilot_history(self, client):
        """Test historial del piloto automático"""
        response = client.get("/api/autopilot/history")
        assert response.status_code == 200
        data = response.json()
        assert "trades" in data
        assert "performance" in data
    
    def test_strategy_performance(self, client):
        """Test rendimiento de estrategias"""
        response = client.get("/api/autopilot/strategy-performance")
        assert response.status_code == 200
        data = response.json()
        assert "strategies" in data


class TestAIEndpoints:
    """Tests para endpoints de IA"""
    
    def test_ollama_status(self, client):
        """Test estado de Ollama"""
        response = client.get("/api/ai/ollama/status")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "model" in data
    
    def test_ai_analyze(self, client):
        """Test análisis con IA"""
        payload = {
            "symbol": "BTCUSDT",
            "analysis_type": "market_sentiment",
            "data": {"price": 45000, "volume": 1000000}
        }
        response = client.post("/api/ai/analyze", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "analysis" in data
        assert "confidence" in data


class TestExchangeEndpoints:
    """Tests para endpoints de exchanges"""
    
    def test_exchanges_status(self, client):
        """Test estado de exchanges"""
        response = client.get("/api/exchanges/status")
        assert response.status_code == 200
        data = response.json()
        assert "exchanges" in data
    
    def test_exchanges_balances(self, client):
        """Test balances de exchanges"""
        response = client.get("/api/exchanges/balances")
        assert response.status_code == 200
        data = response.json()
        assert "balances" in data
    
    def test_arbitrage_opportunities(self, client):
        """Test oportunidades de arbitraje"""
        response = client.get("/api/exchanges/arbitrage-opportunities?symbol=BTCUSDT")
        assert response.status_code == 200
        data = response.json()
        assert "opportunities" in data


class TestScannerEndpoints:
    """Tests para endpoints del escáner"""
    
    def test_scanner_opportunities(self, client):
        """Test oportunidades del escáner"""
        response = client.get("/api/scanner/opportunities")
        assert response.status_code == 200
        data = response.json()
        assert "opportunities" in data
        assert "scan_stats" in data
    
    def test_top_opportunities(self, client):
        """Test mejores oportunidades"""
        response = client.get("/api/scanner/top-opportunities?limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "opportunities" in data


class TestRiskManagementEndpoints:
    """Tests para endpoints de gestión de riesgo"""
    
    def test_risk_levels(self, client):
        """Test niveles de riesgo"""
        response = client.get("/api/risk/levels")
        assert response.status_code == 200
        data = response.json()
        assert "current_level" in data
        assert "available_levels" in data
    
    def test_set_risk_level(self, client):
        """Test establecer nivel de riesgo"""
        payload = {"risk_level": "conservative"}
        response = client.post("/api/risk/set-level", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
    
    def test_calculate_position(self, client):
        """Test cálculo de posición"""
        payload = {
            "account_balance": 10000,
            "symbol": "BTCUSDT",
            "risk_level": "conservative"
        }
        response = client.post("/api/risk/calculate-position", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "position_size" in data
        assert "stop_loss" in data
        assert "take_profit" in data


class TestNewsEndpoints:
    """Tests para endpoints de noticias"""
    
    def test_news_sentiment(self, client):
        """Test sentimiento de noticias"""
        response = client.get("/api/news/sentiment")
        assert response.status_code == 200
        data = response.json()
        assert "sentiment" in data
        assert "confidence" in data
    
    def test_trending_news(self, client):
        """Test noticias trending"""
        response = client.get("/api/news/trending")
        assert response.status_code == 200
        data = response.json()
        assert "news" in data
        assert "trends" in data
    
    def test_news_analysis(self, client):
        """Test análisis de noticias"""
        payload = {"query": "bitcoin", "limit": 10}
        response = client.post("/api/news/analyze", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "analysis" in data
        assert "articles" in data


class TestErrorHandling:
    """Tests para manejo de errores"""
    
    def test_invalid_symbol(self, client):
        """Test símbolo inválido"""
        response = client.get("/api/technical/support-resistance?symbol=INVALID")
        # Debería manejar el error gracefully
        assert response.status_code in [200, 400, 422]
    
    def test_missing_parameters(self, client):
        """Test parámetros faltantes"""
        response = client.post("/api/risk/calculate-position", json={})
        assert response.status_code == 422  # Validation error
    
    def test_invalid_risk_level(self, client):
        """Test nivel de riesgo inválido"""
        payload = {"risk_level": "invalid"}
        response = client.post("/api/risk/set-level", json=payload)
        assert response.status_code in [200, 400, 422]


@pytest.mark.asyncio
async def test_websocket_connection():
    """Test conexión WebSocket"""
    # Este test requeriría un cliente WebSocket real
    # Por ahora, solo verificamos que el endpoint existe
    client = TestClient(app)
    
    # WebSocket endpoint debería existir
    with client.websocket_connect("/ws") as websocket:
        # Test básico de conexión
        assert websocket is not None


def test_cors_headers(client):
    """Test headers CORS"""
    response = client.options("/api/bot/status")
    assert "access-control-allow-origin" in response.headers
    assert "access-control-allow-methods" in response.headers
    assert "access-control-allow-headers" in response.headers


def test_api_response_format_consistency(client):
    """Test consistencia en formato de respuestas"""
    endpoints = [
        "/api/bot/status",
        "/api/autopilot/status",
        "/api/technical/support-resistance?symbol=BTCUSDT",
        "/api/ai/ollama/status"
    ]
    
    for endpoint in endpoints:
        response = client.get(endpoint)
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, dict)
            assert "status" in data or "signals" in data or "analysis" in data




"""
Tests unitarios para el motor de piloto automático
"""
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime

from gbsb.ai.autopilot_engine import AutopilotEngine, AutopilotConfig, AutopilotStatus


class TestAutopilotConfig:
    """Tests para AutopilotConfig"""
    
    def test_default_config(self):
        """Test configuración por defecto"""
        config = AutopilotConfig()
        
        assert config.enabled_strategies == []
        assert config.min_confidence_threshold == 0.7
        assert config.trading_enabled is False
        assert config.dry_run is True
        assert config.ai_ollama_enabled is False
    
    def test_custom_config(self):
        """Test configuración personalizada"""
        config = AutopilotConfig(
            enabled_strategies=['support_resistance', 'ict_techniques'],
            min_confidence_threshold=0.8,
            trading_enabled=True,
            dry_run=False,
            ai_ollama_enabled=True
        )
        
        assert config.enabled_strategies == ['support_resistance', 'ict_techniques']
        assert config.min_confidence_threshold == 0.8
        assert config.trading_enabled is True
        assert config.dry_run is False
        assert config.ai_ollama_enabled is True


class TestAutopilotEngine:
    """Tests para AutopilotEngine"""
    
    @pytest.fixture
    def autopilot_config(self):
        """Configuración de test para autopilot"""
        return AutopilotConfig(
            enabled_strategies=['support_resistance'],
            min_confidence_threshold=0.7,
            trading_enabled=False,
            dry_run=True,
            ai_ollama_enabled=False
        )
    
    @pytest.fixture
    def autopilot_engine(self, autopilot_config):
        """Instancia de AutopilotEngine para testing"""
        return AutopilotEngine(autopilot_config)
    
    def test_initialization(self, autopilot_engine):
        """Test inicialización del motor"""
        assert autopilot_engine is not None
        assert autopilot_engine.status == AutopilotStatus.STOPPED
        assert autopilot_engine.is_running is False
        assert len(autopilot_engine.current_signals) == 0
        assert len(autopilot_engine.trade_history) == 0
    
    def test_analyzers_initialization(self, autopilot_engine):
        """Test que todos los analizadores se inicialicen correctamente"""
        assert autopilot_engine.support_resistance is not None
        assert autopilot_engine.channel_analyzer is not None
        assert autopilot_engine.ict_analyzer is not None
        assert autopilot_engine.fibonacci_analyzer is not None
        assert autopilot_engine.session_analyzer is not None
        assert autopilot_engine.spread_analyzer is not None
    
    @pytest.mark.asyncio
    async def test_initialize_with_exchange_configs(self, autopilot_engine, mock_exchange_config):
        """Test inicialización con configuraciones de exchange"""
        exchange_configs = [mock_exchange_config]
        
        # Mock de exchange manager
        with patch('gbsb.ai.autopilot_engine.MultiExchangeManager') as mock_manager:
            mock_instance = AsyncMock()
            mock_instance.connect_all = AsyncMock()
            mock_manager.return_value = mock_instance
            
            await autopilot_engine.initialize(exchange_configs)
            
            assert autopilot_engine.exchange_manager is not None
            mock_instance.connect_all.assert_called_once()
    
    def test_start_autopilot(self, autopilot_engine):
        """Test iniciar piloto automático"""
        autopilot_engine.start()
        
        assert autopilot_engine.status == AutopilotStatus.RUNNING
        assert autopilot_engine.is_running is True
    
    def test_stop_autopilot(self, autopilot_engine):
        """Test detener piloto automático"""
        autopilot_engine.start()
        autopilot_engine.stop()
        
        assert autopilot_engine.status == AutopilotStatus.STOPPED
        assert autopilot_engine.is_running is False
    
    def test_pause_autopilot(self, autopilot_engine):
        """Test pausar piloto automático"""
        autopilot_engine.start()
        autopilot_engine.pause()
        
        assert autopilot_engine.status == AutopilotStatus.PAUSED
        assert autopilot_engine.is_running is False
    
    def test_resume_autopilot(self, autopilot_engine):
        """Test reanudar piloto automático"""
        autopilot_engine.start()
        autopilot_engine.pause()
        autopilot_engine.resume()
        
        assert autopilot_engine.status == AutopilotStatus.RUNNING
        assert autopilot_engine.is_running is True
    
    def test_emergency_stop(self, autopilot_engine):
        """Test parada de emergencia"""
        autopilot_engine.start()
        autopilot_engine.emergency_stop()
        
        assert autopilot_engine.status == AutopilotStatus.EMERGENCY_STOP
        assert autopilot_engine.is_running is False
    
    @pytest.mark.asyncio
    async def test_analyze_market_data(self, autopilot_engine, mock_market_data):
        """Test análisis de datos de mercado"""
        result = await autopilot_engine.analyze_market_data('BTCUSDT', mock_market_data)
        
        assert isinstance(result, dict)
        assert 'signals' in result
        assert 'confidence' in result
        assert 'timestamp' in result
    
    @pytest.mark.asyncio
    async def test_execute_trade_signal(self, autopilot_engine):
        """Test ejecución de señal de trading"""
        # Mock signal
        signal = {
            'symbol': 'BTCUSDT',
            'side': 'BUY',
            'confidence': 0.8,
            'price': 45000,
            'quantity': 0.001
        }
        
        with patch.object(autopilot_engine, 'exchange_manager') as mock_manager:
            mock_manager.place_order = AsyncMock(return_value={'order_id': 'test_123'})
            
            result = await autopilot_engine.execute_trade_signal(signal)
            
            assert isinstance(result, dict)
            assert 'success' in result
            assert 'order_id' in result or 'error' in result
    
    def test_get_performance_metrics(self, autopilot_engine):
        """Test obtención de métricas de rendimiento"""
        metrics = autopilot_engine.get_performance_metrics()
        
        assert isinstance(metrics, dict)
        assert 'total_trades' in metrics
        assert 'win_rate' in metrics
        assert 'total_pnl' in metrics
        assert 'sharpe_ratio' in metrics
        assert 'max_drawdown' in metrics
        assert 'last_update' in metrics
    
    def test_update_metrics(self, autopilot_engine):
        """Test actualización de métricas"""
        initial_trades = autopilot_engine.metrics.total_trades
        
        # Simular trade exitoso
        trade_data = {
            'symbol': 'BTCUSDT',
            'side': 'BUY',
            'quantity': 0.001,
            'price': 45000,
            'pnl': 50.0,
            'timestamp': datetime.now()
        }
        
        autopilot_engine.trade_history.append(trade_data)
        autopilot_engine._update_metrics()
        
        assert autopilot_engine.metrics.total_trades == initial_trades + 1
        assert autopilot_engine.metrics.total_pnl == 50.0
    
    def test_risk_management_integration(self, autopilot_engine):
        """Test integración con gestión de riesgo"""
        # Verificar que el motor tiene integración con risk management
        assert hasattr(autopilot_engine, 'risk_manager') or 'risk' in str(type(autopilot_engine))


@pytest.mark.asyncio
async def test_autopilot_workflow_integration(autopilot_config, mock_market_data):
    """Test flujo completo de integración del piloto automático"""
    engine = AutopilotEngine(autopilot_config)
    
    # Inicializar
    with patch('gbsb.ai.autopilot_engine.MultiExchangeManager') as mock_manager:
        mock_instance = AsyncMock()
        mock_instance.connect_all = AsyncMock()
        mock_manager.return_value = mock_instance
        
        await engine.initialize([mock_exchange_config])
    
    # Iniciar
    engine.start()
    assert engine.status == AutopilotStatus.RUNNING
    
    # Analizar datos
    result = await engine.analyze_market_data('BTCUSDT', mock_market_data)
    assert isinstance(result, dict)
    
    # Obtener métricas
    metrics = engine.get_performance_metrics()
    assert isinstance(metrics, dict)
    
    # Detener
    engine.stop()
    assert engine.status == AutopilotStatus.STOPPED




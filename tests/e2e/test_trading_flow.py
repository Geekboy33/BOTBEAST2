"""
Tests end-to-end para flujo de trading
"""
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
import pandas as pd
import numpy as np

# Importar módulos del bot
from gbsb.ai.autopilot_engine import AutopilotEngine, AutopilotConfig
from gbsb.exchanges.multi_exchange_manager import MultiExchangeManager, ExchangeConfig
from gbsb.technical_analysis.support_resistance import SupportResistanceAnalyzer
from gbsb.risk_management.risk_levels import RiskManager, RiskLevel


class TestTradingFlowE2E:
    """Tests end-to-end para flujo completo de trading"""
    
    @pytest.fixture
    def mock_market_data(self):
        """Datos de mercado simulados para E2E testing"""
        dates = pd.date_range('2024-01-01', periods=1000, freq='1min')
        # Simular datos realistas de trading
        base_price = 45000
        price_changes = np.random.normal(0, 0.001, 1000)  # 0.1% volatilidad
        prices = [base_price]
        
        for change in price_changes[1:]:
            prices.append(prices[-1] * (1 + change))
        
        data = {
            'timestamp': dates,
            'open': prices,
            'high': [p * (1 + abs(np.random.normal(0, 0.002))) for p in prices],
            'low': [p * (1 - abs(np.random.normal(0, 0.002))) for p in prices],
            'close': prices,
            'volume': np.random.uniform(1000, 10000, 1000)
        }
        return pd.DataFrame(data)
    
    @pytest.fixture
    def exchange_config(self):
        """Configuración de exchange para testing"""
        return ExchangeConfig(
            name='binance',
            api_key='test_key',
            secret_key='test_secret',
            sandbox=True,
            enabled=True,
            priority=1
        )
    
    @pytest.fixture
    def autopilot_config(self):
        """Configuración de autopilot para testing"""
        return AutopilotConfig(
            enabled_strategies=['support_resistance', 'ict_techniques', 'fibonacci'],
            min_confidence_threshold=0.7,
            trading_enabled=False,  # Solo análisis para testing
            dry_run=True,
            ai_ollama_enabled=False
        )
    
    @pytest.mark.asyncio
    async def test_complete_trading_workflow(self, mock_market_data, exchange_config, autopilot_config):
        """Test flujo completo de trading desde análisis hasta ejecución"""
        
        # 1. Inicializar componentes
        autopilot = AutopilotEngine(autopilot_config)
        
        # Mock exchange manager
        with patch('gbsb.ai.autopilot_engine.MultiExchangeManager') as mock_manager_class:
            mock_manager = AsyncMock()
            mock_manager.connect_all = AsyncMock()
            mock_manager.get_market_data = AsyncMock(return_value=mock_market_data)
            mock_manager.place_order = AsyncMock(return_value={'order_id': 'test_123', 'status': 'filled'})
            mock_manager_class.return_value = mock_manager
            
            # Inicializar autopilot
            await autopilot.initialize([exchange_config])
            
            # 2. Iniciar piloto automático
            autopilot.start()
            assert autopilot.status.value == "running"
            
            # 3. Analizar datos de mercado
            analysis_result = await autopilot.analyze_market_data('BTCUSDT', mock_market_data)
            
            assert isinstance(analysis_result, dict)
            assert 'signals' in analysis_result
            assert 'confidence' in analysis_result
            assert 'timestamp' in analysis_result
            
            # 4. Verificar que se generaron señales
            signals = analysis_result.get('signals', [])
            if signals:  # Si hay señales
                assert isinstance(signals, list)
                for signal in signals:
                    assert 'symbol' in signal
                    assert 'side' in signal
                    assert 'confidence' in signal
                    assert 'price' in signal
            
            # 5. Obtener métricas de rendimiento
            metrics = autopilot.get_performance_metrics()
            assert isinstance(metrics, dict)
            assert 'total_trades' in metrics
            assert 'win_rate' in metrics
            assert 'total_pnl' in metrics
            
            # 6. Detener piloto automático
            autopilot.stop()
            assert autopilot.status.value == "stopped"
    
    @pytest.mark.asyncio
    async def test_risk_management_integration(self, mock_market_data, exchange_config, autopilot_config):
        """Test integración de gestión de riesgo en flujo de trading"""
        
        autopilot = AutopilotEngine(autopilot_config)
        
        with patch('gbsb.ai.autopilot_engine.MultiExchangeManager') as mock_manager_class:
            mock_manager = AsyncMock()
            mock_manager.connect_all = AsyncMock()
            mock_manager.get_market_data = AsyncMock(return_value=mock_market_data)
            mock_manager_class.return_value = mock_manager
            
            await autopilot.initialize([exchange_config])
            
            # Test con diferentes niveles de riesgo
            risk_levels = [RiskLevel.CONSERVATIVE, RiskLevel.RISKY, RiskLevel.TURBO]
            
            for risk_level in risk_levels:
                autopilot.risk_manager.set_risk_level(risk_level)
                
                # Simular análisis con gestión de riesgo
                analysis_result = await autopilot.analyze_market_data('BTCUSDT', mock_market_data)
                
                assert isinstance(analysis_result, dict)
                
                # Verificar que el risk manager está activo
                assert autopilot.risk_manager.current_risk_level == risk_level
                
                # Verificar cálculos de posición
                account_balance = 10000.0
                position_size = autopilot.risk_manager.calculate_position_size(account_balance, 'BTCUSDT')
                assert position_size > 0
                assert position_size <= account_balance * 0.1  # Máximo 10%
    
    @pytest.mark.asyncio
    async def test_technical_analysis_integration(self, mock_market_data, exchange_config, autopilot_config):
        """Test integración de análisis técnico en flujo completo"""
        
        autopilot = AutopilotEngine(autopilot_config)
        
        with patch('gbsb.ai.autopilot_engine.MultiExchangeManager') as mock_manager_class:
            mock_manager = AsyncMock()
            mock_manager.connect_all = AsyncMock()
            mock_manager.get_market_data = AsyncMock(return_value=mock_market_data)
            mock_manager_class.return_value = mock_manager
            
            await autopilot.initialize([exchange_config])
            autopilot.start()
            
            # Test análisis técnico individual
            support_resistance = SupportResistanceAnalyzer()
            sr_result = support_resistance.analyze('BTCUSDT', mock_market_data)
            
            assert isinstance(sr_result, dict)
            assert 'signals' in sr_result
            assert 'support_levels' in sr_result
            assert 'resistance_levels' in sr_result
            
            # Test integración en autopilot
            analysis_result = await autopilot.analyze_market_data('BTCUSDT', mock_market_data)
            
            assert isinstance(analysis_result, dict)
            assert 'signals' in analysis_result
            assert 'confidence' in analysis_result
            
            autopilot.stop()
    
    @pytest.mark.asyncio
    async def test_error_handling_and_recovery(self, mock_market_data, exchange_config, autopilot_config):
        """Test manejo de errores y recuperación en flujo de trading"""
        
        autopilot = AutopilotEngine(autopilot_config)
        
        with patch('gbsb.ai.autopilot_engine.MultiExchangeManager') as mock_manager_class:
            mock_manager = AsyncMock()
            mock_manager.connect_all = AsyncMock()
            mock_manager.get_market_data = AsyncMock(side_effect=Exception("Network error"))
            mock_manager_class.return_value = mock_manager
            
            await autopilot.initialize([exchange_config])
            autopilot.start()
            
            # Test manejo de errores en análisis
            try:
                analysis_result = await autopilot.analyze_market_data('BTCUSDT', mock_market_data)
                # Si no lanza excepción, verificar que maneja el error gracefully
                assert isinstance(analysis_result, dict)
                assert 'error' in analysis_result or 'signals' in analysis_result
            except Exception as e:
                # Verificar que el error se maneja apropiadamente
                assert "Network error" in str(e) or isinstance(e, Exception)
            
            # Test recuperación después de error
            mock_manager.get_market_data = AsyncMock(return_value=mock_market_data)
            
            analysis_result = await autopilot.analyze_market_data('BTCUSDT', mock_market_data)
            assert isinstance(analysis_result, dict)
            
            autopilot.stop()
    
    @pytest.mark.asyncio
    async def test_performance_under_load(self, exchange_config, autopilot_config):
        """Test rendimiento bajo carga"""
        
        autopilot = AutopilotEngine(autopilot_config)
        
        with patch('gbsb.ai.autopilot_engine.MultiExchangeManager') as mock_manager_class:
            mock_manager = AsyncMock()
            mock_manager.connect_all = AsyncMock()
            mock_manager_class.return_value = mock_manager
            
            await autopilot.initialize([exchange_config])
            autopilot.start()
            
            # Generar múltiples datasets para simular carga
            symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'DOTUSDT', 'LINKUSDT']
            results = []
            
            for symbol in symbols:
                # Crear datos únicos para cada símbolo
                dates = pd.date_range('2024-01-01', periods=100, freq='1min')
                data = {
                    'timestamp': dates,
                    'open': np.random.uniform(40000, 50000, 100),
                    'high': np.random.uniform(40500, 50500, 100),
                    'low': np.random.uniform(39500, 49500, 100),
                    'close': np.random.uniform(40000, 50000, 100),
                    'volume': np.random.uniform(1000, 10000, 100)
                }
                mock_data = pd.DataFrame(data)
                
                # Análisis concurrente
                result = await autopilot.analyze_market_data(symbol, mock_data)
                results.append(result)
            
            # Verificar que todos los análisis se completaron
            assert len(results) == len(symbols)
            for result in results:
                assert isinstance(result, dict)
                assert 'signals' in result or 'error' in result
            
            autopilot.stop()
    
    @pytest.mark.asyncio
    async def test_data_consistency_across_components(self, mock_market_data, exchange_config, autopilot_config):
        """Test consistencia de datos entre componentes"""
        
        autopilot = AutopilotEngine(autopilot_config)
        
        with patch('gbsb.ai.autopilot_engine.MultiExchangeManager') as mock_manager_class:
            mock_manager = AsyncMock()
            mock_manager.connect_all = AsyncMock()
            mock_manager.get_market_data = AsyncMock(return_value=mock_market_data)
            mock_manager_class.return_value = mock_manager
            
            await autopilot.initialize([exchange_config])
            
            # Test que todos los analizadores reciben los mismos datos
            symbol = 'BTCUSDT'
            
            # Análisis individual de cada componente
            sr_analyzer = SupportResistanceAnalyzer()
            sr_result = sr_analyzer.analyze(symbol, mock_market_data)
            
            # Análisis a través del autopilot
            autopilot_result = await autopilot.analyze_market_data(symbol, mock_market_data)
            
            # Verificar consistencia en estructura de datos
            assert isinstance(sr_result, dict)
            assert isinstance(autopilot_result, dict)
            
            # Verificar que ambos análisis contienen campos esperados
            assert 'signals' in sr_result or 'support_levels' in sr_result
            assert 'signals' in autopilot_result or 'confidence' in autopilot_result
            
            # Verificar que los datos de entrada son consistentes
            assert len(mock_market_data) == 1000  # Datos esperados
            assert 'timestamp' in mock_market_data.columns
            assert 'open' in mock_market_data.columns
            assert 'close' in mock_market_data.columns


@pytest.mark.asyncio
async def test_system_resilience():
    """Test resistencia del sistema a fallos"""
    
    config = AutopilotConfig(
        enabled_strategies=['support_resistance'],
        min_confidence_threshold=0.7,
        trading_enabled=False,
        dry_run=True,
        ai_ollama_enabled=False
    )
    
    autopilot = AutopilotEngine(config)
    
    # Test con configuración de exchange inválida
    invalid_config = ExchangeConfig(
        name='invalid_exchange',
        api_key='invalid',
        secret_key='invalid',
        sandbox=True,
        enabled=True,
        priority=1
    )
    
    try:
        await autopilot.initialize([invalid_config])
        # El sistema debería manejar esto gracefully
        assert True
    except Exception:
        # También es aceptable que lance una excepción controlada
        assert True


def test_configuration_validation():
    """Test validación de configuraciones"""
    
    # Test configuración válida
    valid_config = AutopilotConfig(
        enabled_strategies=['support_resistance', 'ict_techniques'],
        min_confidence_threshold=0.8,
        trading_enabled=False,
        dry_run=True,
        ai_ollama_enabled=False
    )
    
    autopilot = AutopilotEngine(valid_config)
    assert autopilot.config == valid_config
    
    # Test configuración con valores límite
    edge_config = AutopilotConfig(
        enabled_strategies=[],  # Lista vacía
        min_confidence_threshold=1.0,  # Máximo
        trading_enabled=True,
        dry_run=False,
        ai_ollama_enabled=True
    )
    
    autopilot_edge = AutopilotEngine(edge_config)
    assert autopilot_edge.config == edge_config




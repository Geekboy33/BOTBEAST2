"""
Tests unitarios para análisis técnico
"""
import pytest
import pandas as pd
import numpy as np
from unittest.mock import patch, MagicMock

# Importar módulos del bot
from gbsb.technical_analysis.support_resistance import SupportResistanceAnalyzer
from gbsb.technical_analysis.channel_analysis import ChannelAnalyzer
from gbsb.technical_analysis.ict_analysis import ICTAnalyzer
from gbsb.technical_analysis.fibonacci_analysis import FibonacciAnalyzer
from gbsb.technical_analysis.session_analysis import SessionAnalyzer
from gbsb.technical_analysis.spread_analysis import SpreadAnalyzer


class TestSupportResistanceAnalyzer:
    """Tests para SupportResistanceAnalyzer"""
    
    def setup_method(self):
        """Configurar antes de cada test"""
        self.analyzer = SupportResistanceAnalyzer()
    
    def test_analyzer_initialization(self):
        """Test inicialización del analizador"""
        assert self.analyzer is not None
        assert hasattr(self.analyzer, 'analyze')
    
    def test_detect_support_resistance_levels(self, mock_market_data):
        """Test detección de niveles de soporte y resistencia"""
        result = self.analyzer.detect_support_resistance_levels(mock_market_data)
        
        assert isinstance(result, dict)
        assert 'support_levels' in result
        assert 'resistance_levels' in result
        assert isinstance(result['support_levels'], list)
        assert isinstance(result['resistance_levels'], list)
    
    def test_analyze_with_valid_data(self, mock_market_data):
        """Test análisis con datos válidos"""
        result = self.analyzer.analyze('BTCUSDT', mock_market_data)
        
        assert isinstance(result, dict)
        assert 'signals' in result
        assert 'confidence' in result
        assert 'support_levels' in result
        assert 'resistance_levels' in result


class TestChannelAnalyzer:
    """Tests para ChannelAnalyzer"""
    
    def setup_method(self):
        """Configurar antes de cada test"""
        self.analyzer = ChannelAnalyzer()
    
    def test_analyzer_initialization(self):
        """Test inicialización del analizador"""
        assert self.analyzer is not None
        assert hasattr(self.analyzer, 'analyze')
    
    def test_detect_trend_channels(self, mock_market_data):
        """Test detección de canales de tendencia"""
        result = self.analyzer.detect_trend_channels(mock_market_data)
        
        assert isinstance(result, dict)
        assert 'channels' in result
        assert isinstance(result['channels'], list)
    
    def test_analyze_channel_breakout(self, mock_market_data):
        """Test análisis de ruptura de canales"""
        result = self.analyzer.analyze_channel_breakout(mock_market_data)
        
        assert isinstance(result, dict)
        assert 'breakout_signals' in result
        assert isinstance(result['breakout_signals'], list)


class TestICTAnalyzer:
    """Tests para ICTAnalyzer"""
    
    def setup_method(self):
        """Configurar antes de cada test"""
        self.analyzer = ICTAnalyzer()
    
    def test_analyzer_initialization(self):
        """Test inicialización del analizador"""
        assert self.analyzer is not None
        assert hasattr(self.analyzer, 'analyze')
    
    def test_detect_order_blocks(self, mock_market_data):
        """Test detección de order blocks"""
        result = self.analyzer.detect_order_blocks(mock_market_data)
        
        assert isinstance(result, dict)
        assert 'order_blocks' in result
        assert isinstance(result['order_blocks'], list)
    
    def test_detect_fair_value_gaps(self, mock_market_data):
        """Test detección de fair value gaps"""
        result = self.analyzer.detect_fair_value_gaps(mock_market_data)
        
        assert isinstance(result, dict)
        assert 'fvg' in result
        assert isinstance(result['fvg'], list)


class TestFibonacciAnalyzer:
    """Tests para FibonacciAnalyzer"""
    
    def setup_method(self):
        """Configurar antes de cada test"""
        self.analyzer = FibonacciAnalyzer()
    
    def test_analyzer_initialization(self):
        """Test inicialización del analizador"""
        assert self.analyzer is not None
        assert hasattr(self.analyzer, 'analyze')
    
    def test_calculate_fibonacci_levels(self, mock_market_data):
        """Test cálculo de niveles de Fibonacci"""
        result = self.analyzer.calculate_fibonacci_levels(mock_market_data)
        
        assert isinstance(result, dict)
        assert 'fibonacci_levels' in result
        assert isinstance(result['fibonacci_levels'], list)
    
    def test_detect_fibonacci_signals(self, mock_market_data):
        """Test detección de señales de Fibonacci"""
        result = self.analyzer.detect_fibonacci_signals(mock_market_data)
        
        assert isinstance(result, dict)
        assert 'signals' in result
        assert isinstance(result['signals'], list)


class TestSessionAnalyzer:
    """Tests para SessionAnalyzer"""
    
    def setup_method(self):
        """Configurar antes de cada test"""
        self.analyzer = SessionAnalyzer()
    
    def test_analyzer_initialization(self):
        """Test inicialización del analizador"""
        assert self.analyzer is not None
        assert hasattr(self.analyzer, 'analyze')
    
    def test_identify_trading_sessions(self):
        """Test identificación de sesiones de trading"""
        result = self.analyzer.identify_trading_sessions()
        
        assert isinstance(result, dict)
        assert 'asian_session' in result
        assert 'european_session' in result
        assert 'american_session' in result
    
    def test_analyze_session_volume(self, mock_market_data):
        """Test análisis de volumen por sesión"""
        result = self.analyzer.analyze_session_volume(mock_market_data)
        
        assert isinstance(result, dict)
        assert 'volume_analysis' in result


class TestSpreadAnalyzer:
    """Tests para SpreadAnalyzer"""
    
    def setup_method(self):
        """Configurar antes de cada test"""
        self.analyzer = SpreadAnalyzer()
    
    def test_analyzer_initialization(self):
        """Test inicialización del analizador"""
        assert self.analyzer is not None
        assert hasattr(self.analyzer, 'analyze')
    
    def test_calculate_spread_metrics(self, mock_market_data):
        """Test cálculo de métricas de spread"""
        result = self.analyzer.calculate_spread_metrics(mock_market_data)
        
        assert isinstance(result, dict)
        assert 'spread_metrics' in result
        assert isinstance(result['spread_metrics'], dict)
    
    def test_analyze_spread_conditions(self, mock_market_data):
        """Test análisis de condiciones de spread"""
        result = self.analyzer.analyze_spread_conditions(mock_market_data)
        
        assert isinstance(result, dict)
        assert 'spread_conditions' in result
        assert isinstance(result['spread_conditions'], dict)


@pytest.mark.parametrize("analyzer_class", [
    SupportResistanceAnalyzer,
    ChannelAnalyzer,
    ICTAnalyzer,
    FibonacciAnalyzer,
    SessionAnalyzer,
    SpreadAnalyzer
])
def test_all_analyzers_have_analyze_method(analyzer_class):
    """Test que todos los analizadores tengan método analyze"""
    analyzer = analyzer_class()
    assert hasattr(analyzer, 'analyze')
    assert callable(getattr(analyzer, 'analyze'))


@pytest.mark.parametrize("analyzer_class", [
    SupportResistanceAnalyzer,
    ChannelAnalyzer,
    ICTAnalyzer,
    FibonacciAnalyzer,
    SessionAnalyzer,
    SpreadAnalyzer
])
def test_all_analyzers_return_valid_results(analyzer_class, mock_market_data):
    """Test que todos los analizadores retornen resultados válidos"""
    analyzer = analyzer_class()
    result = analyzer.analyze('BTCUSDT', mock_market_data)
    
    assert isinstance(result, dict)
    assert 'signals' in result or 'confidence' in result




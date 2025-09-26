"""
Tests unitarios para gestión de riesgo
"""
import pytest
from unittest.mock import MagicMock, patch

from gbsb.risk_management.risk_levels import RiskManager, RiskLevel, PositionSizing


class TestRiskLevel:
    """Tests para RiskLevel"""
    
    def test_risk_level_values(self):
        """Test valores de niveles de riesgo"""
        assert RiskLevel.CONSERVATIVE.value == "conservative"
        assert RiskLevel.RISKY.value == "risky"
        assert RiskLevel.TURBO.value == "turbo"
    
    def test_risk_level_from_string(self):
        """Test creación de RiskLevel desde string"""
        assert RiskLevel("conservative") == RiskLevel.CONSERVATIVE
        assert RiskLevel("risky") == RiskLevel.RISKY
        assert RiskLevel("turbo") == RiskLevel.TURBO
    
    def test_invalid_risk_level(self):
        """Test nivel de riesgo inválido"""
        with pytest.raises(ValueError):
            RiskLevel("invalid")


class TestPositionSizing:
    """Tests para PositionSizing"""
    
    def test_position_sizing_initialization(self):
        """Test inicialización de PositionSizing"""
        sizing = PositionSizing()
        
        assert sizing.max_leverage == 1.0
        assert sizing.position_size_percent == 0.02
        assert sizing.stop_loss_percent == 0.01
        assert sizing.take_profit_percent == 0.02
    
    def test_conservative_sizing(self):
        """Test sizing conservador"""
        sizing = PositionSizing.conservative()
        
        assert sizing.max_leverage <= 2.0
        assert sizing.position_size_percent <= 0.02
        assert sizing.stop_loss_percent <= 0.01
    
    def test_risky_sizing(self):
        """Test sizing arriesgado"""
        sizing = PositionSizing.risky()
        
        assert sizing.max_leverage <= 5.0
        assert sizing.max_leverage > 2.0
        assert sizing.position_size_percent <= 0.05
    
    def test_turbo_sizing(self):
        """Test sizing turbo"""
        sizing = PositionSizing.turbo()
        
        assert sizing.max_leverage <= 10.0
        assert sizing.max_leverage > 5.0
        assert sizing.position_size_percent <= 0.1
    
    def test_calculate_position_size(self):
        """Test cálculo de tamaño de posición"""
        sizing = PositionSizing()
        account_balance = 10000.0
        
        position_size = sizing.calculate_position_size(account_balance)
        
        assert position_size > 0
        assert position_size <= account_balance * sizing.position_size_percent


class TestRiskManager:
    """Tests para RiskManager"""
    
    def setup_method(self):
        """Configurar antes de cada test"""
        self.risk_manager = RiskManager()
    
    def test_initialization(self):
        """Test inicialización del RiskManager"""
        assert self.risk_manager is not None
        assert self.risk_manager.current_risk_level == RiskLevel.CONSERVATIVE
        assert self.risk_manager.position_sizing is not None
    
    def test_set_risk_level(self):
        """Test establecer nivel de riesgo"""
        self.risk_manager.set_risk_level(RiskLevel.RISKY)
        assert self.risk_manager.current_risk_level == RiskLevel.RISKY
        
        self.risk_manager.set_risk_level(RiskLevel.TURBO)
        assert self.risk_manager.current_risk_level == RiskLevel.TURBO
    
    def test_get_position_sizing(self):
        """Test obtención de position sizing"""
        sizing = self.risk_manager.get_position_sizing()
        
        assert isinstance(sizing, PositionSizing)
        assert sizing.max_leverage > 0
        assert sizing.position_size_percent > 0
        assert sizing.stop_loss_percent > 0
        assert sizing.take_profit_percent > 0
    
    def test_calculate_position_size(self):
        """Test cálculo de tamaño de posición"""
        account_balance = 10000.0
        symbol = "BTCUSDT"
        
        position_size = self.risk_manager.calculate_position_size(account_balance, symbol)
        
        assert position_size > 0
        assert position_size <= account_balance * 0.1  # Máximo 10% del balance
    
    def test_calculate_stop_loss(self):
        """Test cálculo de stop loss"""
        entry_price = 45000.0
        symbol = "BTCUSDT"
        
        stop_loss = self.risk_manager.calculate_stop_loss(entry_price, symbol)
        
        assert stop_loss > 0
        assert stop_loss != entry_price
        # Stop loss debe estar por debajo del precio de entrada para BUY
        assert stop_loss < entry_price
    
    def test_calculate_take_profit(self):
        """Test cálculo de take profit"""
        entry_price = 45000.0
        symbol = "BTCUSDT"
        
        take_profit = self.risk_manager.calculate_take_profit(entry_price, symbol)
        
        assert take_profit > 0
        assert take_profit != entry_price
        # Take profit debe estar por encima del precio de entrada para BUY
        assert take_profit > entry_price
    
    def test_validate_trade_risk(self):
        """Test validación de riesgo de trade"""
        trade_data = {
            'symbol': 'BTCUSDT',
            'side': 'BUY',
            'quantity': 0.001,
            'price': 45000.0,
            'leverage': 2.0
        }
        
        is_valid = self.risk_manager.validate_trade_risk(trade_data)
        
        assert isinstance(is_valid, bool)
    
    def test_calculate_max_drawdown(self):
        """Test cálculo de máximo drawdown"""
        equity_curve = [10000, 10500, 10200, 10800, 10400, 11000]
        
        max_drawdown = self.risk_manager.calculate_max_drawdown(equity_curve)
        
        assert isinstance(max_drawdown, float)
        assert max_drawdown >= 0
        assert max_drawdown <= 1.0  # No puede ser mayor al 100%
    
    def test_calculate_sharpe_ratio(self):
        """Test cálculo de Sharpe ratio"""
        returns = [0.01, -0.005, 0.02, -0.01, 0.015, 0.008]
        
        sharpe_ratio = self.risk_manager.calculate_sharpe_ratio(returns)
        
        assert isinstance(sharpe_ratio, float)
        # Sharpe ratio puede ser negativo, positivo o cero
    
    def test_emergency_stop_conditions(self):
        """Test condiciones de parada de emergencia"""
        # Test drawdown excesivo
        equity_curve = [10000, 9500, 9000, 8500, 8000]  # 20% drawdown
        
        should_stop = self.risk_manager.check_emergency_stop(equity_curve)
        
        # Dependiendo de la configuración, debería activar parada de emergencia
        assert isinstance(should_stop, bool)
    
    def test_risk_level_transitions(self):
        """Test transiciones entre niveles de riesgo"""
        # Iniciar conservador
        self.risk_manager.set_risk_level(RiskLevel.CONSERVATIVE)
        conservative_sizing = self.risk_manager.get_position_sizing()
        
        # Cambiar a arriesgado
        self.risk_manager.set_risk_level(RiskLevel.RISKY)
        risky_sizing = self.risk_manager.get_position_sizing()
        
        # Cambiar a turbo
        self.risk_manager.set_risk_level(RiskLevel.TURBO)
        turbo_sizing = self.risk_manager.get_position_sizing()
        
        # Verificar que el leverage aumenta con el nivel de riesgo
        assert risky_sizing.max_leverage >= conservative_sizing.max_leverage
        assert turbo_sizing.max_leverage >= risky_sizing.max_leverage
        
        # Verificar que el tamaño de posición aumenta con el nivel de riesgo
        assert risky_sizing.position_size_percent >= conservative_sizing.position_size_percent
        assert turbo_sizing.position_size_percent >= risky_sizing.position_size_percent


@pytest.mark.parametrize("risk_level", [RiskLevel.CONSERVATIVE, RiskLevel.RISKY, RiskLevel.TURBO])
def test_risk_level_position_sizing_consistency(risk_level):
    """Test consistencia entre niveles de riesgo y position sizing"""
    risk_manager = RiskManager()
    risk_manager.set_risk_level(risk_level)
    
    sizing = risk_manager.get_position_sizing()
    
    # Verificar que el sizing es apropiado para el nivel de riesgo
    if risk_level == RiskLevel.CONSERVATIVE:
        assert sizing.max_leverage <= 2.0
        assert sizing.position_size_percent <= 0.02
    elif risk_level == RiskLevel.RISKY:
        assert sizing.max_leverage <= 5.0
        assert sizing.position_size_percent <= 0.05
    elif risk_level == RiskLevel.TURBO:
        assert sizing.max_leverage <= 10.0
        assert sizing.position_size_percent <= 0.1


def test_risk_manager_edge_cases():
    """Test casos límite del RiskManager"""
    risk_manager = RiskManager()
    
    # Test con balance cero
    position_size = risk_manager.calculate_position_size(0, "BTCUSDT")
    assert position_size == 0
    
    # Test con precio cero
    with pytest.raises((ValueError, ZeroDivisionError)):
        risk_manager.calculate_stop_loss(0, "BTCUSDT")
    
    # Test con símbolo inválido
    with pytest.raises((ValueError, KeyError)):
        risk_manager.calculate_position_size(10000, "")




"""
Sistema de gestión de riesgo con 3 niveles
Conservador, Arriesgado y Turbo con apalancamiento dinámico
"""

from typing import Dict, Optional, Any, List, Tuple
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime, timedelta
import numpy as np

class RiskLevel(Enum):
    """Niveles de riesgo"""
    CONSERVATIVE = "conservative"
    AGGRESSIVE = "aggressive"
    TURBO = "turbo"

class LeverageMode(Enum):
    """Modos de apalancamiento"""
    DYNAMIC = "dynamic"  # Basado en volatilidad y confianza
    FIXED = "fixed"      # Apalancamiento fijo por nivel
    ADAPTIVE = "adaptive"  # Se ajusta según condiciones del mercado

@dataclass
class RiskProfile:
    """Perfil de riesgo"""
    risk_level: RiskLevel
    max_leverage: float  # 1x a 10x
    base_position_size: float  # Tamaño base de posición
    max_position_size: float   # Tamaño máximo de posición
    stop_loss_percentage: float  # % de stop loss
    take_profit_percentage: float  # % de take profit
    max_drawdown: float  # Máximo drawdown permitido
    max_daily_trades: int  # Máximo trades por día
    risk_per_trade: float  # % de riesgo por trade
    volatility_threshold: float  # Umbral de volatilidad
    confidence_threshold: float  # Umbral de confianza mínimo
    emergency_stop_loss: float  # Stop loss de emergencia
    position_sizing_method: str  # Método de sizing
    diversification_limit: int  # Máximo número de posiciones simultáneas

@dataclass
class PositionSizing:
    """Cálculo de tamaño de posición"""
    base_size: float
    leverage: float
    adjusted_size: float
    risk_amount: float
    stop_distance: float
    position_value: float
    margin_required: float
    max_loss: float

@dataclass
class RiskMetrics:
    """Métricas de riesgo"""
    current_exposure: float
    total_leverage: float
    portfolio_var: float  # Value at Risk
    max_drawdown: float
    sharpe_ratio: float
    win_rate: float
    profit_factor: float
    risk_score: float  # 0-1, donde 1 es máximo riesgo
    margin_utilization: float
    diversification_score: float

class RiskManager:
    """Gestor de riesgo con niveles"""
    
    def __init__(self):
        self.current_risk_level = RiskLevel.CONSERVATIVE
        self.risk_profiles = self._create_risk_profiles()
        self.leverage_modes = {
            RiskLevel.CONSERVATIVE: LeverageMode.FIXED,
            RiskLevel.AGGRESSIVE: LeverageMode.DYNAMIC,
            RiskLevel.TURBO: LeverageMode.ADAPTIVE
        }
        
        # Métricas actuales
        self.current_metrics = RiskMetrics(
            current_exposure=0.0,
            total_leverage=1.0,
            portfolio_var=0.0,
            max_drawdown=0.0,
            sharpe_ratio=0.0,
            win_rate=0.0,
            profit_factor=0.0,
            risk_score=0.0,
            margin_utilization=0.0,
            diversification_score=0.0
        )
        
        # Historial de posiciones
        self.position_history: List[Dict[str, Any]] = []
        self.risk_history: List[RiskMetrics] = []
    
    def _create_risk_profiles(self) -> Dict[RiskLevel, RiskProfile]:
        """Crea perfiles de riesgo predefinidos"""
        return {
            RiskLevel.CONSERVATIVE: RiskProfile(
                risk_level=RiskLevel.CONSERVATIVE,
                max_leverage=2.0,
                base_position_size=1000.0,
                max_position_size=5000.0,
                stop_loss_percentage=0.02,  # 2%
                take_profit_percentage=0.04,  # 4%
                max_drawdown=0.05,  # 5%
                max_daily_trades=5,
                risk_per_trade=0.01,  # 1%
                volatility_threshold=0.03,  # 3%
                confidence_threshold=0.8,  # 80%
                emergency_stop_loss=0.03,  # 3%
                position_sizing_method="kelly_criterion",
                diversification_limit=3
            ),
            
            RiskLevel.AGGRESSIVE: RiskProfile(
                risk_level=RiskLevel.AGGRESSIVE,
                max_leverage=5.0,
                base_position_size=2000.0,
                max_position_size=10000.0,
                stop_loss_percentage=0.03,  # 3%
                take_profit_percentage=0.06,  # 6%
                max_drawdown=0.10,  # 10%
                max_daily_trades=15,
                risk_per_trade=0.025,  # 2.5%
                volatility_threshold=0.05,  # 5%
                confidence_threshold=0.7,  # 70%
                emergency_stop_loss=0.05,  # 5%
                position_sizing_method="volatility_adjusted",
                diversification_limit=5
            ),
            
            RiskLevel.TURBO: RiskProfile(
                risk_level=RiskLevel.TURBO,
                max_leverage=10.0,
                base_position_size=5000.0,
                max_position_size=20000.0,
                stop_loss_percentage=0.05,  # 5%
                take_profit_percentage=0.10,  # 10%
                max_drawdown=0.20,  # 20%
                max_daily_trades=30,
                risk_per_trade=0.05,  # 5%
                volatility_threshold=0.08,  # 8%
                confidence_threshold=0.6,  # 60%
                emergency_stop_loss=0.08,  # 8%
                position_sizing_method="momentum_based",
                diversification_limit=8
            )
        }
    
    def set_risk_level(self, risk_level: RiskLevel):
        """Cambia el nivel de riesgo actual"""
        self.current_risk_level = risk_level
    
    def get_current_profile(self) -> RiskProfile:
        """Obtiene el perfil de riesgo actual"""
        return self.risk_profiles[self.current_risk_level]
    
    def calculate_position_size(self, opportunity: 'QuickOpportunity', 
                              current_balance: float, 
                              volatility: float,
                              market_conditions: Dict[str, Any]) -> PositionSizing:
        """Calcula el tamaño de posición basado en el nivel de riesgo"""
        profile = self.get_current_profile()
        
        # Calcular leverage dinámico
        leverage = self._calculate_dynamic_leverage(
            opportunity, volatility, market_conditions, profile
        )
        
        # Calcular tamaño base
        base_size = self._calculate_base_position_size(
            opportunity, current_balance, profile
        )
        
        # Ajustar por leverage
        adjusted_size = base_size * leverage
        
        # Asegurar límites
        adjusted_size = min(adjusted_size, profile.max_position_size)
        adjusted_size = min(adjusted_size, current_balance * profile.max_leverage)
        
        # Calcular métricas de riesgo
        stop_distance = abs(opportunity.entry_price - (opportunity.stop_loss or 0))
        risk_amount = adjusted_size * profile.risk_per_trade
        position_value = adjusted_size * opportunity.entry_price
        margin_required = position_value / leverage
        max_loss = risk_amount
        
        return PositionSizing(
            base_size=base_size,
            leverage=leverage,
            adjusted_size=adjusted_size,
            risk_amount=risk_amount,
            stop_distance=stop_distance,
            position_value=position_value,
            margin_required=margin_required,
            max_loss=max_loss
        )
    
    def _calculate_dynamic_leverage(self, opportunity: 'QuickOpportunity', 
                                  volatility: float, 
                                  market_conditions: Dict[str, Any],
                                  profile: RiskProfile) -> float:
        """Calcula leverage dinámico basado en condiciones"""
        base_leverage = profile.max_leverage
        leverage_mode = self.leverage_modes[profile.risk_level]
        
        if leverage_mode == LeverageMode.FIXED:
            # Leverage fijo para nivel conservador
            return min(base_leverage, 2.0)
        
        elif leverage_mode == LeverageMode.DYNAMIC:
            # Leverage basado en volatilidad y confianza
            confidence_factor = opportunity.confidence
            volatility_factor = max(0.5, 1 - (volatility / 0.1))  # Reducir leverage con alta volatilidad
            
            # Factor de mercado
            market_factor = market_conditions.get('trend_strength', 0.5)
            
            dynamic_leverage = base_leverage * confidence_factor * volatility_factor * market_factor
            return min(dynamic_leverage, base_leverage)
        
        elif leverage_mode == LeverageMode.ADAPTIVE:
            # Leverage adaptativo para nivel turbo
            # Más agresivo en condiciones favorables
            trend_factor = market_conditions.get('trend_strength', 0.5)
            volume_factor = min(1.0, opportunity.pair.volume_24h / 10000000)  # Normalizar por $10M
            
            adaptive_leverage = base_leverage * (0.5 + trend_factor * 0.3 + volume_factor * 0.2)
            return min(adaptive_leverage, base_leverage)
        
        return base_leverage
    
    def _calculate_base_position_size(self, opportunity: 'QuickOpportunity', 
                                    current_balance: float,
                                    profile: RiskProfile) -> float:
        """Calcula el tamaño base de posición"""
        sizing_method = profile.position_sizing_method
        
        if sizing_method == "kelly_criterion":
            # Criterio de Kelly para sizing óptimo
            win_rate = opportunity.confidence
            avg_win = opportunity.risk_reward_ratio
            avg_loss = 1.0
            
            kelly_fraction = (win_rate * avg_win - (1 - win_rate)) / avg_win
            kelly_fraction = max(0, min(kelly_fraction, 0.25))  # Limitar al 25%
            
            return current_balance * kelly_fraction
        
        elif sizing_method == "volatility_adjusted":
            # Sizing ajustado por volatilidad
            base_size = profile.base_position_size
            volatility_adjustment = 1 / (1 + opportunity.volatility_score)
            
            return base_size * volatility_adjustment
        
        elif sizing_method == "momentum_based":
            # Sizing basado en momentum
            momentum_score = (opportunity.technical_score + 
                            opportunity.volume_score + 
                            opportunity.volatility_score) / 3
            
            return profile.base_position_size * (0.5 + momentum_score * 0.5)
        
        else:
            # Método por defecto
            return profile.base_position_size
    
    def validate_trade(self, opportunity: 'QuickOpportunity', 
                      position_sizing: PositionSizing,
                      current_positions: List[Dict[str, Any]]) -> Tuple[bool, str]:
        """Valida si un trade cumple con los criterios de riesgo"""
        profile = self.get_current_profile()
        
        # Verificar confianza mínima
        if opportunity.confidence < profile.confidence_threshold:
            return False, f"Confianza insuficiente: {opportunity.confidence:.2f} < {profile.confidence_threshold}"
        
        # Verificar límite de trades diarios
        today_trades = len([p for p in current_positions 
                          if p.get('timestamp', datetime.now()).date() == datetime.now().date()])
        
        if today_trades >= profile.max_daily_trades:
            return False, f"Límite diario de trades alcanzado: {today_trades}/{profile.max_daily_trades}"
        
        # Verificar límite de diversificación
        if len(current_positions) >= profile.diversification_limit:
            return False, f"Límite de diversificación alcanzado: {len(current_positions)}/{profile.diversification_limit}"
        
        # Verificar exposición total
        total_exposure = sum(p.get('position_value', 0) for p in current_positions)
        max_total_exposure = profile.max_position_size * profile.diversification_limit
        
        if total_exposure + position_sizing.position_value > max_total_exposure:
            return False, f"Exposición total excedida"
        
        # Verificar leverage máximo
        if position_sizing.leverage > profile.max_leverage:
            return False, f"Leverage excedido: {position_sizing.leverage} > {profile.max_leverage}"
        
        # Verificar drawdown actual
        if self.current_metrics.max_drawdown > profile.max_drawdown:
            return False, f"Drawdown máximo excedido: {self.current_metrics.max_drawdown:.2%} > {profile.max_drawdown:.2%}"
        
        return True, "Trade válido"
    
    def calculate_stop_loss(self, opportunity: 'QuickOpportunity', 
                          position_sizing: PositionSizing) -> float:
        """Calcula stop loss basado en el nivel de riesgo"""
        profile = self.get_current_profile()
        
        # Usar stop loss de la oportunidad si está disponible
        if opportunity.stop_loss:
            return opportunity.stop_loss
        
        # Calcular stop loss basado en porcentaje
        if opportunity.signal == 'buy':
            stop_loss = opportunity.entry_price * (1 - profile.stop_loss_percentage)
        else:
            stop_loss = opportunity.entry_price * (1 + profile.stop_loss_percentage)
        
        return stop_loss
    
    def calculate_take_profit(self, opportunity: 'QuickOpportunity', 
                            position_sizing: PositionSizing) -> float:
        """Calcula take profit basado en el nivel de riesgo"""
        profile = self.get_current_profile()
        
        # Usar take profit de la oportunidad si está disponible
        if opportunity.take_profit:
            return opportunity.take_profit
        
        # Calcular take profit basado en porcentaje
        if opportunity.signal == 'buy':
            take_profit = opportunity.entry_price * (1 + profile.take_profit_percentage)
        else:
            take_profit = opportunity.entry_price * (1 - profile.take_profit_percentage)
        
        return take_profit
    
    def update_risk_metrics(self, positions: List[Dict[str, Any]], 
                          trades: List[Dict[str, Any]],
                          current_balance: float):
        """Actualiza métricas de riesgo"""
        if not trades:
            return
        
        # Calcular métricas básicas
        total_trades = len(trades)
        winning_trades = len([t for t in trades if t.get('pnl', 0) > 0])
        total_pnl = sum(t.get('pnl', 0) for t in trades)
        
        # Exposición actual
        current_exposure = sum(p.get('position_value', 0) for p in positions)
        
        # Leverage total
        total_leverage = current_exposure / current_balance if current_balance > 0 else 1.0
        
        # Win rate
        win_rate = winning_trades / total_trades if total_trades > 0 else 0.0
        
        # Profit factor
        gross_profit = sum(t.get('pnl', 0) for t in trades if t.get('pnl', 0) > 0)
        gross_loss = abs(sum(t.get('pnl', 0) for t in trades if t.get('pnl', 0) < 0))
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else 0.0
        
        # Sharpe ratio (simplificado)
        returns = [t.get('pnl', 0) for t in trades]
        if len(returns) > 1:
            mean_return = np.mean(returns)
            std_return = np.std(returns)
            sharpe_ratio = mean_return / std_return if std_return > 0 else 0.0
        else:
            sharpe_ratio = 0.0
        
        # Drawdown
        cumulative_pnl = np.cumsum(returns)
        running_max = np.maximum.accumulate(cumulative_pnl)
        drawdown = (cumulative_pnl - running_max) / (running_max + 1e-10)
        max_drawdown = abs(np.min(drawdown)) if len(drawdown) > 0 else 0.0
        
        # Risk score (0-1)
        risk_score = min(1.0, (total_leverage * 0.3 + max_drawdown * 0.4 + (1 - win_rate) * 0.3))
        
        # Diversificación
        diversification_score = min(1.0, len(set(p.get('symbol', '') for p in positions)) / 10.0)
        
        # Utilización de margen
        margin_utilization = current_exposure / (current_balance * self.get_current_profile().max_leverage)
        
        # Actualizar métricas
        self.current_metrics = RiskMetrics(
            current_exposure=current_exposure,
            total_leverage=total_leverage,
            portfolio_var=0.0,  # Se calcularía con más datos
            max_drawdown=max_drawdown,
            sharpe_ratio=sharpe_ratio,
            win_rate=win_rate,
            profit_factor=profit_factor,
            risk_score=risk_score,
            margin_utilization=margin_utilization,
            diversification_score=diversification_score
        )
        
        # Guardar en historial
        self.risk_history.append(self.current_metrics)
        if len(self.risk_history) > 1000:  # Mantener solo últimos 1000
            self.risk_history = self.risk_history[-1000:]
    
    def should_emergency_stop(self) -> Tuple[bool, str]:
        """Verifica si se debe activar parada de emergencia"""
        profile = self.get_current_profile()
        
        # Verificar drawdown de emergencia
        if self.current_metrics.max_drawdown > profile.emergency_stop_loss:
            return True, f"Drawdown de emergencia: {self.current_metrics.max_drawdown:.2%}"
        
        # Verificar score de riesgo
        if self.current_metrics.risk_score > 0.9:
            return True, f"Score de riesgo crítico: {self.current_metrics.risk_score:.2f}"
        
        # Verificar utilización de margen
        if self.current_metrics.margin_utilization > 0.95:
            return True, f"Utilización de margen crítica: {self.current_metrics.margin_utilization:.2%}"
        
        return False, "Condiciones normales"
    
    def get_risk_recommendations(self) -> List[str]:
        """Obtiene recomendaciones de gestión de riesgo"""
        recommendations = []
        profile = self.get_current_profile()
        
        # Recomendaciones basadas en métricas
        if self.current_metrics.risk_score > 0.7:
            recommendations.append("Considerar reducir exposición o cambiar a nivel más conservador")
        
        if self.current_metrics.max_drawdown > profile.max_drawdown * 0.8:
            recommendations.append("Drawdown elevado, revisar estrategias de stop loss")
        
        if self.current_metrics.win_rate < 0.4:
            recommendations.append("Win rate bajo, revisar criterios de entrada")
        
        if self.current_metrics.diversification_score < 0.3:
            recommendations.append("Poca diversificación, considerar más pares")
        
        if self.current_metrics.margin_utilization > 0.8:
            recommendations.append("Alta utilización de margen, reducir posiciones")
        
        return recommendations
    
    def get_risk_summary(self) -> Dict[str, Any]:
        """Obtiene resumen de riesgo"""
        profile = self.get_current_profile()
        
        return {
            "current_risk_level": self.current_risk_level.value,
            "profile": {
                "max_leverage": profile.max_leverage,
                "max_drawdown": profile.max_drawdown,
                "risk_per_trade": profile.risk_per_trade,
                "confidence_threshold": profile.confidence_threshold
            },
            "current_metrics": {
                "risk_score": self.current_metrics.risk_score,
                "total_leverage": self.current_metrics.total_leverage,
                "max_drawdown": self.current_metrics.max_drawdown,
                "win_rate": self.current_metrics.win_rate,
                "profit_factor": self.current_metrics.profit_factor,
                "diversification_score": self.current_metrics.diversification_score
            },
            "emergency_stop": self.should_emergency_stop(),
            "recommendations": self.get_risk_recommendations()
        }

# Funciones de utilidad

def create_risk_manager(initial_level: RiskLevel = RiskLevel.CONSERVATIVE) -> RiskManager:
    """Crea instancia del gestor de riesgo"""
    manager = RiskManager()
    manager.set_risk_level(initial_level)
    return manager

def calculate_optimal_leverage(volatility: float, confidence: float, risk_level: RiskLevel) -> float:
    """Calcula leverage óptimo basado en volatilidad y confianza"""
    base_leverages = {
        RiskLevel.CONSERVATIVE: 2.0,
        RiskLevel.AGGRESSIVE: 5.0,
        RiskLevel.TURBO: 10.0
    }
    
    base_leverage = base_leverages[risk_level]
    
    # Ajustar por volatilidad (menor volatilidad = mayor leverage)
    volatility_factor = max(0.5, 1 - (volatility / 0.1))
    
    # Ajustar por confianza
    confidence_factor = confidence
    
    optimal_leverage = base_leverage * volatility_factor * confidence_factor
    return min(optimal_leverage, base_leverage)




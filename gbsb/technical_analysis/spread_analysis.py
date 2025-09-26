"""
Módulo de análisis de spread
Implementa análisis avanzado de spreads bid-ask para optimizar entradas
Incluye análisis de liquidez, costos de transacción y timing óptimo
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
import talib

@dataclass
class SpreadMetrics:
    """Métricas de spread"""
    timestamp: pd.Timestamp
    bid: float
    ask: float
    spread_absolute: float
    spread_percentage: float
    mid_price: float
    volume_bid: float
    volume_ask: float
    imbalance: float  # Diferencia entre volumen bid y ask

@dataclass
class LiquiditySnapshot:
    """Snapshot de liquidez"""
    timestamp: pd.Timestamp
    price_levels: List[Dict[str, float]]  # {price, volume, side}
    total_bid_volume: float
    total_ask_volume: float
    depth_ratio: float  # Proporción de liquidez bid/ask
    weighted_mid: float

@dataclass
class OptimalEntry:
    """Punto de entrada óptimo"""
    timestamp: pd.Timestamp
    entry_price: float
    side: str  # 'buy' o 'sell'
    spread_cost: float
    slippage_estimate: float
    confidence: float
    reason: str

class SpreadAnalyzer:
    """Analizador de spreads y liquidez"""
    
    def __init__(self):
        self.spread_history: List[SpreadMetrics] = []
        self.liquidity_snapshots: List[LiquiditySnapshot] = []
        self.optimal_entries: List[OptimalEntry] = []
        
        # Configuración de análisis
        self.min_spread_threshold = 0.001  # 0.1% mínimo
        self.max_spread_threshold = 0.01   # 1% máximo
        self.volume_weight_threshold = 0.7  # 70% del volumen total
        
    def analyze_spread_conditions(self, df: pd.DataFrame, orderbook_data: Optional[Dict] = None) -> Dict[str, any]:
        """Analiza condiciones de spread en tiempo real"""
        analysis = {
            'current_spread': self.calculate_current_spread(df, orderbook_data),
            'spread_trends': self.analyze_spread_trends(df),
            'liquidity_analysis': self.analyze_liquidity_conditions(df, orderbook_data),
            'optimal_entry_points': self.find_optimal_entry_points(df, orderbook_data),
            'slippage_estimation': self.estimate_slippage(df, orderbook_data),
            'cost_analysis': self.analyze_trading_costs(df),
            'timing_recommendations': self.get_timing_recommendations(df)
        }
        
        return analysis
    
    def calculate_current_spread(self, df: pd.DataFrame, orderbook_data: Optional[Dict] = None) -> Optional[SpreadMetrics]:
        """Calcula el spread actual"""
        if orderbook_data:
            # Usar datos de orderbook si están disponibles
            bid = orderbook_data.get('best_bid_price', 0)
            ask = orderbook_data.get('best_ask_price', 0)
            bid_volume = orderbook_data.get('best_bid_volume', 0)
            ask_volume = orderbook_data.get('best_ask_volume', 0)
        else:
            # Simular spread basado en datos históricos
            current_price = df.iloc[-1]['close']
            volatility = df['close'].pct_change().std()
            
            # Simular spread basado en volatilidad
            spread_percentage = max(0.001, min(0.01, volatility * 10))
            spread_absolute = current_price * spread_percentage
            
            bid = current_price - spread_absolute / 2
            ask = current_price + spread_absolute / 2
            bid_volume = df.get('volume', pd.Series([1000] * len(df))).iloc[-1] * 0.3
            ask_volume = df.get('volume', pd.Series([1000] * len(df))).iloc[-1] * 0.3
        
        if bid > 0 and ask > 0:
            spread_absolute = ask - bid
            spread_percentage = spread_absolute / ((bid + ask) / 2)
            mid_price = (bid + ask) / 2
            imbalance = (bid_volume - ask_volume) / (bid_volume + ask_volume) if (bid_volume + ask_volume) > 0 else 0
            
            spread_metrics = SpreadMetrics(
                timestamp=pd.Timestamp.now(),
                bid=bid,
                ask=ask,
                spread_absolute=spread_absolute,
                spread_percentage=spread_percentage,
                mid_price=mid_price,
                volume_bid=bid_volume,
                volume_ask=ask_volume,
                imbalance=imbalance
            )
            
            self.spread_history.append(spread_metrics)
            return spread_metrics
        
        return None
    
    def analyze_spread_trends(self, df: pd.DataFrame, lookback: int = 100) -> Dict[str, any]:
        """Analiza tendencias del spread"""
        if len(self.spread_history) < 2:
            return {'trend': 'insufficient_data'}
        
        recent_spreads = self.spread_history[-lookback:]
        
        # Calcular tendencia del spread
        spread_values = [s.spread_percentage for s in recent_spreads]
        timestamps = [s.timestamp for s in recent_spreads]
        
        if len(spread_values) < 2:
            return {'trend': 'insufficient_data'}
        
        # Análisis de tendencia
        x = np.arange(len(spread_values))
        slope, intercept = np.polyfit(x, spread_values, 1)
        
        # Calcular estadísticas
        avg_spread = np.mean(spread_values)
        std_spread = np.std(spread_values)
        min_spread = np.min(spread_values)
        max_spread = np.max(spread_values)
        
        # Determinar tendencia
        if slope > 0.0001:
            trend = 'widening'
        elif slope < -0.0001:
            trend = 'tightening'
        else:
            trend = 'stable'
        
        # Identificar patrones
        patterns = self._identify_spread_patterns(spread_values)
        
        # Calcular volatilidad del spread
        spread_volatility = np.std(np.diff(spread_values))
        
        return {
            'trend': trend,
            'slope': slope,
            'average_spread': avg_spread,
            'std_spread': std_spread,
            'min_spread': min_spread,
            'max_spread': max_spread,
            'spread_volatility': spread_volatility,
            'patterns': patterns,
            'trend_strength': abs(slope) / std_spread if std_spread > 0 else 0
        }
    
    def analyze_liquidity_conditions(self, df: pd.DataFrame, orderbook_data: Optional[Dict] = None) -> Dict[str, any]:
        """Analiza condiciones de liquidez"""
        liquidity_analysis = {
            'current_liquidity': self._assess_current_liquidity(df, orderbook_data),
            'liquidity_trends': self._analyze_liquidity_trends(df),
            'depth_analysis': self._analyze_market_depth(orderbook_data),
            'imbalance_analysis': self._analyze_order_imbalance(df, orderbook_data),
            'liquidity_zones': self._identify_liquidity_zones(df)
        }
        
        return liquidity_analysis
    
    def find_optimal_entry_points(self, df: pd.DataFrame, orderbook_data: Optional[Dict] = None) -> List[OptimalEntry]:
        """Encuentra puntos de entrada óptimos basados en spread y liquidez"""
        optimal_entries = []
        
        current_spread = self.calculate_current_spread(df, orderbook_data)
        if not current_spread:
            return optimal_entries
        
        # Criterios para entrada óptima
        criteria = {
            'low_spread': current_spread.spread_percentage < self.min_spread_threshold * 2,
            'good_liquidity': self._assess_current_liquidity(df, orderbook_data)['score'] > 0.7,
            'balanced_orderbook': abs(current_spread.imbalance) < 0.3,
            'low_volatility': df['close'].pct_change().std() < 0.02
        }
        
        # Calcular score de entrada
        entry_score = sum(criteria.values()) / len(criteria)
        
        if entry_score > 0.6:  # Umbral para entrada óptima
            # Determinar lado de entrada basado en imbalance
            if current_spread.imbalance > 0.1:  # Más volumen en bid, considerar venta
                side = 'sell'
                entry_price = current_spread.ask
                reason = 'high_bid_imbalance'
            elif current_spread.imbalance < -0.1:  # Más volumen en ask, considerar compra
                side = 'buy'
                entry_price = current_spread.bid
                reason = 'high_ask_imbalance'
            else:
                # Entrada neutral basada en tendencia
                recent_trend = self._get_recent_trend(df)
                if recent_trend > 0:
                    side = 'buy'
                    entry_price = current_spread.ask
                    reason = 'uptrend_entry'
                else:
                    side = 'sell'
                    entry_price = current_spread.bid
                    reason = 'downtrend_entry'
            
            # Calcular costos
            spread_cost = current_spread.spread_percentage / 2  # Costo de medio spread
            slippage_estimate = self._estimate_slippage_for_size(df, orderbook_data, 1000)  # Para orden de 1000
            
            optimal_entry = OptimalEntry(
                timestamp=pd.Timestamp.now(),
                entry_price=entry_price,
                side=side,
                spread_cost=spread_cost,
                slippage_estimate=slippage_estimate,
                confidence=entry_score,
                reason=reason
            )
            
            optimal_entries.append(optimal_entry)
            self.optimal_entries.append(optimal_entry)
        
        return optimal_entries
    
    def estimate_slippage(self, df: pd.DataFrame, orderbook_data: Optional[Dict] = None) -> Dict[str, float]:
        """Estima slippage para diferentes tamaños de orden"""
        slippage_estimates = {}
        
        order_sizes = [100, 500, 1000, 5000, 10000]  # Tamaños en unidades base
        
        for size in order_sizes:
            slippage = self._estimate_slippage_for_size(df, orderbook_data, size)
            slippage_estimates[f'size_{size}'] = slippage
        
        return slippage_estimates
    
    def analyze_trading_costs(self, df: pd.DataFrame) -> Dict[str, any]:
        """Analiza costos totales de trading"""
        if len(self.spread_history) < 10:
            return {'insufficient_data': True}
        
        recent_spreads = self.spread_history[-50:]  # Últimos 50 spreads
        
        # Calcular costos promedio
        avg_spread_cost = np.mean([s.spread_percentage for s in recent_spreads]) / 2
        avg_imbalance_impact = np.mean([abs(s.imbalance) * s.spread_percentage / 2 for s in recent_spreads])
        
        # Costos por sesión
        costs_by_session = self._calculate_costs_by_session(recent_spreads)
        
        # Recomendaciones de timing
        optimal_times = self._find_optimal_trading_times(recent_spreads)
        
        return {
            'average_spread_cost': avg_spread_cost,
            'average_imbalance_impact': avg_imbalance_impact,
            'total_cost_estimate': avg_spread_cost + avg_imbalance_impact,
            'costs_by_session': costs_by_session,
            'optimal_trading_times': optimal_times,
            'cost_efficiency_score': self._calculate_cost_efficiency_score(avg_spread_cost, avg_imbalance_impact)
        }
    
    def get_timing_recommendations(self, df: pd.DataFrame) -> Dict[str, any]:
        """Obtiene recomendaciones de timing para trading"""
        recommendations = {
            'current_conditions': self._assess_current_trading_conditions(df),
            'best_entry_times': self._find_best_entry_times(df),
            'avoid_times': self._find_avoid_times(df),
            'session_recommendations': self._get_session_recommendations(df),
            'volatility_considerations': self._get_volatility_recommendations(df)
        }
        
        return recommendations
    
    def get_spread_trading_signals(self, df: pd.DataFrame, orderbook_data: Optional[Dict] = None) -> Dict[str, any]:
        """Genera señales de trading basadas en análisis de spread"""
        signals = {
            'spread_optimal_entry': False,
            'liquidity_entry': False,
            'cost_efficient_entry': False,
            'timing_entry': False,
            'confidence': 0.0,
            'entry_reason': None,
            'recommended_size': 0,
            'estimated_costs': 0.0
        }
        
        # Analizar condiciones actuales
        spread_analysis = self.analyze_spread_conditions(df, orderbook_data)
        current_spread = spread_analysis['current_spread']
        
        if not current_spread:
            return signals
        
        # Verificar condiciones óptimas
        conditions = {
            'spread_ok': current_spread.spread_percentage < 0.005,  # Spread < 0.5%
            'liquidity_ok': spread_analysis['liquidity_analysis']['current_liquidity']['score'] > 0.6,
            'costs_ok': spread_analysis['cost_analysis'].get('cost_efficiency_score', 0) > 0.7,
            'timing_ok': spread_analysis['timing_recommendations']['current_conditions']['score'] > 0.6
        }
        
        # Calcular confianza general
        confidence = sum(conditions.values()) / len(conditions)
        
        if confidence > 0.6:
            signals['confidence'] = confidence
            
            # Determinar tipo de entrada
            if conditions['spread_ok'] and conditions['liquidity_ok']:
                signals['spread_optimal_entry'] = True
                signals['entry_reason'] = 'optimal_spread_liquidity'
            
            if conditions['liquidity_ok'] and not conditions['spread_ok']:
                signals['liquidity_entry'] = True
                signals['entry_reason'] = 'good_liquidity_poor_spread'
            
            if conditions['costs_ok']:
                signals['cost_efficient_entry'] = True
                signals['entry_reason'] = 'cost_efficient_conditions'
            
            if conditions['timing_ok']:
                signals['timing_entry'] = True
                signals['entry_reason'] = 'optimal_timing'
            
            # Recomendar tamaño de orden
            slippage_estimates = spread_analysis['slippage_estimation']
            optimal_size = self._find_optimal_order_size(slippage_estimates)
            signals['recommended_size'] = optimal_size
            
            # Estimar costos
            spread_cost = current_spread.spread_percentage / 2
            slippage_cost = slippage_estimates.get(f'size_{optimal_size}', 0.001)
            signals['estimated_costs'] = spread_cost + slippage_cost
        
        return signals
    
    # Métodos auxiliares
    
    def _assess_current_liquidity(self, df: pd.DataFrame, orderbook_data: Optional[Dict] = None) -> Dict[str, any]:
        """Evalúa la liquidez actual"""
        if orderbook_data:
            # Usar datos reales de orderbook
            bid_volume = orderbook_data.get('total_bid_volume', 0)
            ask_volume = orderbook_data.get('total_ask_volume', 0)
            depth_levels = orderbook_data.get('depth_levels', 10)
        else:
            # Simular liquidez basada en volumen histórico
            recent_volume = df.get('volume', pd.Series([1000] * len(df))).tail(10).mean()
            bid_volume = recent_volume * 0.4
            ask_volume = recent_volume * 0.4
            depth_levels = 5
        
        total_volume = bid_volume + ask_volume
        
        # Calcular score de liquidez (0-1)
        volume_score = min(total_volume / 10000, 1.0)  # Normalizar por 10k volumen
        balance_score = 1 - abs(bid_volume - ask_volume) / total_volume if total_volume > 0 else 0
        depth_score = min(depth_levels / 10, 1.0)
        
        liquidity_score = (volume_score * 0.5 + balance_score * 0.3 + depth_score * 0.2)
        
        return {
            'score': liquidity_score,
            'bid_volume': bid_volume,
            'ask_volume': ask_volume,
            'total_volume': total_volume,
            'balance': balance_score,
            'depth_levels': depth_levels
        }
    
    def _analyze_liquidity_trends(self, df: pd.DataFrame) -> Dict[str, any]:
        """Analiza tendencias de liquidez"""
        if len(df) < 20:
            return {'trend': 'insufficient_data'}
        
        # Simular análisis de tendencias de liquidez
        volumes = df.get('volume', pd.Series([1000] * len(df))).tail(20)
        
        # Calcular tendencia
        x = np.arange(len(volumes))
        slope = np.polyfit(x, volumes, 1)[0]
        
        avg_volume = volumes.mean()
        volume_std = volumes.std()
        
        if slope > avg_volume * 0.1:
            trend = 'increasing'
        elif slope < -avg_volume * 0.1:
            trend = 'decreasing'
        else:
            trend = 'stable'
        
        return {
            'trend': trend,
            'slope': slope,
            'average_volume': avg_volume,
            'volume_std': volume_std,
            'trend_strength': abs(slope) / volume_std if volume_std > 0 else 0
        }
    
    def _analyze_market_depth(self, orderbook_data: Optional[Dict] = None) -> Dict[str, any]:
        """Analiza profundidad del mercado"""
        if not orderbook_data:
            return {'depth_score': 0.5, 'levels': 5, 'concentration': 0.3}
        
        depth_levels = orderbook_data.get('depth_levels', 5)
        total_bid_volume = orderbook_data.get('total_bid_volume', 1000)
        total_ask_volume = orderbook_data.get('total_ask_volume', 1000)
        
        # Calcular concentración (qué tan concentrado está el volumen en los primeros niveles)
        top_bid_volume = orderbook_data.get('top_bid_volume', total_bid_volume * 0.6)
        top_ask_volume = orderbook_data.get('top_ask_volume', total_ask_volume * 0.6)
        
        bid_concentration = top_bid_volume / total_bid_volume if total_bid_volume > 0 else 0
        ask_concentration = top_ask_volume / total_ask_volume if total_ask_volume > 0 else 0
        avg_concentration = (bid_concentration + ask_concentration) / 2
        
        # Score de profundidad (0-1)
        depth_score = min(depth_levels / 10, 1.0) * (1 - avg_concentration)
        
        return {
            'depth_score': depth_score,
            'levels': depth_levels,
            'concentration': avg_concentration,
            'bid_concentration': bid_concentration,
            'ask_concentration': ask_concentration
        }
    
    def _analyze_order_imbalance(self, df: pd.DataFrame, orderbook_data: Optional[Dict] = None) -> Dict[str, any]:
        """Analiza desequilibrio de órdenes"""
        if orderbook_data:
            bid_volume = orderbook_data.get('total_bid_volume', 1000)
            ask_volume = orderbook_data.get('total_ask_volume', 1000)
        else:
            # Simular basado en volatilidad y tendencia
            recent_trend = df['close'].pct_change().tail(5).mean()
            base_volume = df.get('volume', pd.Series([1000] * len(df))).tail(10).mean()
            
            if recent_trend > 0.001:  # Tendencia alcista
                bid_volume = base_volume * 0.6
                ask_volume = base_volume * 0.4
            elif recent_trend < -0.001:  # Tendencia bajista
                bid_volume = base_volume * 0.4
                ask_volume = base_volume * 0.6
            else:
                bid_volume = base_volume * 0.5
                ask_volume = base_volume * 0.5
        
        total_volume = bid_volume + ask_volume
        imbalance = (bid_volume - ask_volume) / total_volume if total_volume > 0 else 0
        
        return {
            'imbalance': imbalance,
            'bid_volume': bid_volume,
            'ask_volume': ask_volume,
            'total_volume': total_volume,
            'imbalance_strength': abs(imbalance)
        }
    
    def _identify_liquidity_zones(self, df: pd.DataFrame) -> List[Dict]:
        """Identifica zonas de alta liquidez"""
        if len(df) < 20:
            return []
        
        # Buscar niveles de precio con mayor volumen
        price_levels = {}
        for _, row in df.tail(50).iterrows():
            price = round(row['close'], 2)
            volume = row.get('volume', 1000)
            
            if price in price_levels:
                price_levels[price] += volume
            else:
                price_levels[price] = volume
        
        # Ordenar por volumen y tomar los top 5
        sorted_levels = sorted(price_levels.items(), key=lambda x: x[1], reverse=True)
        top_liquidity_zones = []
        
        for price, volume in sorted_levels[:5]:
            top_liquidity_zones.append({
                'price': price,
                'volume': volume,
                'strength': volume / sorted_levels[0][1] if sorted_levels else 1.0
            })
        
        return top_liquidity_zones
    
    def _estimate_slippage_for_size(self, df: pd.DataFrame, orderbook_data: Optional[Dict] = None, order_size: float = 1000) -> float:
        """Estima slippage para un tamaño de orden específico"""
        if orderbook_data:
            # Usar datos reales de orderbook para estimar slippage
            depth_levels = orderbook_data.get('depth_levels', 5)
            avg_volume_per_level = orderbook_data.get('avg_volume_per_level', order_size / 5)
            
            # Estimar slippage basado en profundidad
            levels_needed = order_size / avg_volume_per_level
            slippage_per_level = 0.0001  # 0.01% por nivel
            
            return min(levels_needed * slippage_per_level, 0.01)  # Máximo 1%
        else:
            # Simular slippage basado en volatilidad
            volatility = df['close'].pct_change().std()
            base_slippage = volatility * 0.1  # 10% de la volatilidad
            
            # Ajustar por tamaño de orden
            size_multiplier = min(order_size / 1000, 3.0)  # Hasta 3x para órdenes grandes
            
            return min(base_slippage * size_multiplier, 0.01)  # Máximo 1%
    
    def _identify_spread_patterns(self, spread_values: List[float]) -> List[str]:
        """Identifica patrones en el spread"""
        patterns = []
        
        if len(spread_values) < 10:
            return patterns
        
        # Patrón de spread estrecho
        if all(s < 0.002 for s in spread_values[-5:]):
            patterns.append('tight_spread')
        
        # Patrón de spread amplio
        if all(s > 0.005 for s in spread_values[-5:]):
            patterns.append('wide_spread')
        
        # Patrón de spread volátil
        spread_std = np.std(spread_values[-10:])
        if spread_std > np.mean(spread_values[-10:]) * 0.5:
            patterns.append('volatile_spread')
        
        # Patrón de spread estable
        if spread_std < np.mean(spread_values[-10:]) * 0.1:
            patterns.append('stable_spread')
        
        return patterns
    
    def _get_recent_trend(self, df: pd.DataFrame, periods: int = 10) -> float:
        """Obtiene la tendencia reciente"""
        if len(df) < periods:
            return 0
        
        recent_prices = df['close'].tail(periods)
        return (recent_prices.iloc[-1] - recent_prices.iloc[0]) / recent_prices.iloc[0]
    
    def _calculate_costs_by_session(self, spread_history: List[SpreadMetrics]) -> Dict[str, float]:
        """Calcula costos por sesión de trading"""
        # Simular análisis por sesión
        return {
            'asian': 0.002,
            'european': 0.003,
            'american': 0.004,
            'overlap': 0.001
        }
    
    def _find_optimal_trading_times(self, spread_history: List[SpreadMetrics]) -> List[Dict]:
        """Encuentra los mejores momentos para trading"""
        # Simular análisis de timing óptimo
        return [
            {'hour': 8, 'spread': 0.001, 'liquidity': 'high'},
            {'hour': 14, 'spread': 0.002, 'liquidity': 'high'},
            {'hour': 20, 'spread': 0.0015, 'liquidity': 'medium'}
        ]
    
    def _calculate_cost_efficiency_score(self, spread_cost: float, imbalance_impact: float) -> float:
        """Calcula score de eficiencia de costos"""
        total_cost = spread_cost + imbalance_impact
        max_acceptable_cost = 0.005  # 0.5%
        
        if total_cost <= max_acceptable_cost:
            return 1 - (total_cost / max_acceptable_cost)
        else:
            return 0
    
    def _assess_current_trading_conditions(self, df: pd.DataFrame) -> Dict[str, any]:
        """Evalúa condiciones actuales de trading"""
        current_volatility = df['close'].pct_change().std()
        current_volume = df.get('volume', pd.Series([1000] * len(df))).tail(5).mean()
        
        # Score de condiciones (0-1)
        volatility_score = max(0, 1 - current_volatility * 50)  # Menos volatilidad = mejor
        volume_score = min(current_volume / 5000, 1.0)  # Normalizar por volumen
        
        conditions_score = (volatility_score * 0.6 + volume_score * 0.4)
        
        return {
            'score': conditions_score,
            'volatility': current_volatility,
            'volume': current_volume,
            'volatility_score': volatility_score,
            'volume_score': volume_score,
            'recommendation': 'trade' if conditions_score > 0.6 else 'wait'
        }
    
    def _find_best_entry_times(self, df: pd.DataFrame) -> List[Dict]:
        """Encuentra los mejores momentos para entrar"""
        # Simular análisis de timing
        return [
            {'time': '08:00', 'reason': 'asian_european_overlap', 'score': 0.9},
            {'time': '14:00', 'reason': 'european_american_overlap', 'score': 0.95},
            {'time': '20:00', 'reason': 'american_session_start', 'score': 0.8}
        ]
    
    def _find_avoid_times(self, df: pd.DataFrame) -> List[Dict]:
        """Encuentra momentos a evitar"""
        return [
            {'time': '22:00-02:00', 'reason': 'low_liquidity', 'score': 0.2},
            {'time': '12:00-13:00', 'reason': 'lunch_break', 'score': 0.3}
        ]
    
    def _get_session_recommendations(self, df: pd.DataFrame) -> Dict[str, str]:
        """Obtiene recomendaciones por sesión"""
        return {
            'asian': 'range_trading',
            'european': 'breakout_trading',
            'american': 'trend_following'
        }
    
    def _get_volatility_recommendations(self, df: pd.DataFrame) -> Dict[str, any]:
        """Obtiene recomendaciones basadas en volatilidad"""
        current_vol = df['close'].pct_change().std()
        
        if current_vol > 0.03:
            return {'recommendation': 'reduce_position_size', 'reason': 'high_volatility'}
        elif current_vol < 0.01:
            return {'recommendation': 'increase_position_size', 'reason': 'low_volatility'}
        else:
            return {'recommendation': 'normal_trading', 'reason': 'moderate_volatility'}
    
    def _find_optimal_order_size(self, slippage_estimates: Dict[str, float]) -> int:
        """Encuentra el tamaño óptimo de orden basado en slippage"""
        # Encontrar el tamaño con menor slippage
        best_size = 100
        best_slippage = float('inf')
        
        for size_key, slippage in slippage_estimates.items():
            if slippage < best_slippage:
                best_slippage = slippage
                size_str = size_key.replace('size_', '')
                best_size = int(size_str)
        
        return best_size




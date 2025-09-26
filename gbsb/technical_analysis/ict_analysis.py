"""
Módulo de análisis ICT (Inner Circle Trader)
Implementa las técnicas avanzadas de Michael Huddleston (ICT)
Incluye: Order Blocks, Fair Value Gaps, Liquidity Sweeps, Market Structure, etc.
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional, Set
from dataclasses import dataclass
from datetime import datetime, timedelta
import talib

@dataclass
class OrderBlock:
    """Order Block - Zona de órdenes institucionales"""
    high: float
    low: float
    open: float
    close: float
    timestamp: pd.Timestamp
    type: str  # 'bullish' o 'bearish'
    strength: float  # 0-1
    touched: bool = False
    index: int = 0

@dataclass
class FairValueGap:
    """Fair Value Gap - Gaps de valor justo"""
    high: float
    low: float
    timestamp: pd.Timestamp
    type: str  # 'bullish' o 'bearish'
    strength: float  # 0-1
    filled: bool = False
    index: int = 0

@dataclass
class LiquiditySweep:
    """Liquidity Sweep - Barrido de liquidez"""
    price: float
    timestamp: pd.Timestamp
    type: str  # 'buy_side' o 'sell_side'
    volume: float
    strength: float  # 0-1
    index: int = 0

@dataclass
class MarketStructure:
    """Market Structure - Estructura del mercado"""
    swing_high: float
    swing_low: float
    timestamp: pd.Timestamp
    type: str  # 'BOS' (Break of Structure) o 'CHoCH' (Change of Character)
    direction: str  # 'bullish' o 'bearish'
    index: int = 0

class ICTAnalyzer:
    """Analizador de técnicas ICT"""
    
    def __init__(self):
        self.order_blocks: List[OrderBlock] = []
        self.fair_value_gaps: List[FairValueGap] = []
        self.liquidity_sweeps: List[LiquiditySweep] = []
        self.market_structures: List[MarketStructure] = []
        self.swing_points: List[Dict] = []
    
    def analyze_ict_concepts(self, df: pd.DataFrame) -> Dict[str, any]:
        """Analiza todos los conceptos ICT en los datos"""
        analysis = {
            'order_blocks': self.detect_order_blocks(df),
            'fair_value_gaps': self.detect_fair_value_gaps(df),
            'liquidity_sweeps': self.detect_liquidity_sweeps(df),
            'market_structure': self.analyze_market_structure(df),
            'kill_zones': self.detect_kill_zones(df),
            'consequent_encroachment': self.detect_consequent_encroachment(df),
            'optimal_trade_entry': self.find_optimal_trade_entry(df)
        }
        
        return analysis
    
    def detect_order_blocks(self, df: pd.DataFrame, lookback: int = 50) -> List[OrderBlock]:
        """Detecta Order Blocks - Zonas de órdenes institucionales"""
        order_blocks = []
        
        if len(df) < 10:
            return order_blocks
        
        # Buscar en ventanas deslizantes
        for i in range(5, len(df) - 5):
            # Definir ventana para análisis
            window = df.iloc[i-5:i+5]
            
            # Order Block Bullish: Vela alcista seguida de velas bajistas
            if self._is_bullish_order_block(window, i):
                ob = OrderBlock(
                    high=window.iloc[0]['high'],
                    low=window.iloc[0]['low'],
                    open=window.iloc[0]['open'],
                    close=window.iloc[0]['close'],
                    timestamp=df.index[i],
                    type='bullish',
                    strength=self._calculate_ob_strength(window, 'bullish'),
                    index=i
                )
                order_blocks.append(ob)
            
            # Order Block Bearish: Vela bajista seguida de velas alcistas
            if self._is_bearish_order_block(window, i):
                ob = OrderBlock(
                    high=window.iloc[0]['high'],
                    low=window.iloc[0]['low'],
                    open=window.iloc[0]['open'],
                    close=window.iloc[0]['close'],
                    timestamp=df.index[i],
                    type='bearish',
                    strength=self._calculate_ob_strength(window, 'bearish'),
                    index=i
                )
                order_blocks.append(ob)
        
        # Filtrar Order Blocks válidos y actualizar si han sido tocados
        valid_obs = []
        for ob in order_blocks:
            if ob.strength > 0.3:  # Filtro de fuerza mínima
                # Verificar si ha sido tocado
                ob.touched = self._check_ob_touched(df, ob)
                valid_obs.append(ob)
        
        self.order_blocks = valid_obs
        return valid_obs
    
    def _is_bullish_order_block(self, window: pd.DataFrame, index: int) -> bool:
        """Verifica si una ventana contiene un Order Block alcista"""
        if len(window) < 6:
            return False
        
        # Primera vela debe ser alcista y fuerte
        first_candle = window.iloc[0]
        if first_candle['close'] <= first_candle['open']:
            return False
        
        # Verificar que sea una vela significativa (body > 60% del rango)
        body_size = abs(first_candle['close'] - first_candle['open'])
        total_range = first_candle['high'] - first_candle['low']
        
        if body_size / total_range < 0.6:
            return False
        
        # Las siguientes velas deben ser bajistas o laterales
        bearish_following = 0
        for i in range(1, min(4, len(window))):
            candle = window.iloc[i]
            if candle['close'] < candle['open']:
                bearish_following += 1
        
        # Debe haber al menos 2 velas bajistas siguientes
        return bearish_following >= 2
    
    def _is_bearish_order_block(self, window: pd.DataFrame, index: int) -> bool:
        """Verifica si una ventana contiene un Order Block bajista"""
        if len(window) < 6:
            return False
        
        # Primera vela debe ser bajista y fuerte
        first_candle = window.iloc[0]
        if first_candle['close'] >= first_candle['open']:
            return False
        
        # Verificar que sea una vela significativa (body > 60% del rango)
        body_size = abs(first_candle['close'] - first_candle['open'])
        total_range = first_candle['high'] - first_candle['low']
        
        if body_size / total_range < 0.6:
            return False
        
        # Las siguientes velas deben ser alcistas o laterales
        bullish_following = 0
        for i in range(1, min(4, len(window))):
            candle = window.iloc[i]
            if candle['close'] > candle['open']:
                bullish_following += 1
        
        # Debe haber al menos 2 velas alcistas siguientes
        return bullish_following >= 2
    
    def _calculate_ob_strength(self, window: pd.DataFrame, ob_type: str) -> float:
        """Calcula la fuerza de un Order Block"""
        if len(window) == 0:
            return 0
        
        first_candle = window.iloc[0]
        
        # Factor 1: Tamaño del cuerpo de la vela
        body_size = abs(first_candle['close'] - first_candle['open'])
        total_range = first_candle['high'] - first_candle['low']
        body_ratio = body_size / total_range if total_range > 0 else 0
        
        # Factor 2: Volumen (si está disponible)
        volume_factor = 1.0
        if 'volume' in window.columns:
            avg_volume = window['volume'].mean()
            first_volume = first_candle['volume']
            volume_factor = min(first_volume / avg_volume, 2.0) / 2.0
        
        # Factor 3: Número de velas de seguimiento
        following_candles = len(window) - 1
        following_factor = min(following_candles / 5.0, 1.0)
        
        strength = (body_ratio * 0.5 + volume_factor * 0.3 + following_factor * 0.2)
        return min(strength, 1.0)
    
    def _check_ob_touched(self, df: pd.DataFrame, ob: OrderBlock) -> bool:
        """Verifica si un Order Block ha sido tocado por el precio"""
        # Buscar desde el índice del OB hasta el final
        for i in range(ob.index + 1, len(df)):
            candle = df.iloc[i]
            
            if ob.type == 'bullish':
                # Para OB bullish, el precio debe tocar la zona (low del OB)
                if candle['low'] <= ob.high and candle['high'] >= ob.low:
                    return True
            else:
                # Para OB bearish, el precio debe tocar la zona (high del OB)
                if candle['low'] <= ob.high and candle['high'] >= ob.low:
                    return True
        
        return False
    
    def detect_fair_value_gaps(self, df: pd.DataFrame) -> List[FairValueGap]:
        """Detecta Fair Value Gaps - Gaps de valor justo"""
        gaps = []
        
        if len(df) < 3:
            return gaps
        
        for i in range(1, len(df) - 1):
            prev_candle = df.iloc[i-1]
            current_candle = df.iloc[i]
            next_candle = df.iloc[i+1]
            
            # Fair Value Gap Bullish: Gap entre high de vela previa y low de vela siguiente
            if (prev_candle['high'] < next_candle['low'] and
                current_candle['close'] > current_candle['open']):
                
                gap = FairValueGap(
                    high=next_candle['low'],
                    low=prev_candle['high'],
                    timestamp=df.index[i],
                    type='bullish',
                    strength=self._calculate_fvg_strength(prev_candle, current_candle, next_candle),
                    index=i
                )
                gaps.append(gap)
            
            # Fair Value Gap Bearish: Gap entre low de vela previa y high de vela siguiente
            elif (prev_candle['low'] > next_candle['high'] and
                  current_candle['close'] < current_candle['open']):
                
                gap = FairValueGap(
                    high=prev_candle['low'],
                    low=next_candle['high'],
                    timestamp=df.index[i],
                    type='bearish',
                    strength=self._calculate_fvg_strength(prev_candle, current_candle, next_candle),
                    index=i
                )
                gaps.append(gap)
        
        # Filtrar gaps válidos y verificar si han sido llenados
        valid_gaps = []
        for gap in gaps:
            if gap.strength > 0.3:
                gap.filled = self._check_fvg_filled(df, gap)
                valid_gaps.append(gap)
        
        self.fair_value_gaps = valid_gaps
        return valid_gaps
    
    def _calculate_fvg_strength(self, prev_candle: pd.Series, current_candle: pd.Series, next_candle: pd.Series) -> float:
        """Calcula la fuerza de un Fair Value Gap"""
        # Factor 1: Tamaño del gap
        gap_size = abs(prev_candle['high'] - next_candle['low'])
        avg_range = (prev_candle['high'] - prev_candle['low'] + 
                    next_candle['high'] - next_candle['low']) / 2
        size_factor = min(gap_size / avg_range, 1.0)
        
        # Factor 2: Fuerza de la vela del medio
        body_size = abs(current_candle['close'] - current_candle['open'])
        total_range = current_candle['high'] - current_candle['low']
        body_factor = body_size / total_range if total_range > 0 else 0
        
        # Factor 3: Volumen (si está disponible)
        volume_factor = 1.0
        if 'volume' in current_candle:
            volume_factor = min(current_candle['volume'] / 1000000, 1.0)  # Normalizar
        
        strength = (size_factor * 0.4 + body_factor * 0.4 + volume_factor * 0.2)
        return min(strength, 1.0)
    
    def _check_fvg_filled(self, df: pd.DataFrame, fvg: FairValueGap) -> bool:
        """Verifica si un Fair Value Gap ha sido llenado"""
        for i in range(fvg.index + 1, len(df)):
            candle = df.iloc[i]
            
            # El gap se llena si el precio toca el área del gap
            if (candle['low'] <= fvg.high and candle['high'] >= fvg.low):
                return True
        
        return False
    
    def detect_liquidity_sweeps(self, df: pd.DataFrame, lookback: int = 20) -> List[LiquiditySweep]:
        """Detecta Liquidity Sweeps - Barridos de liquidez"""
        sweeps = []
        
        if len(df) < lookback + 5:
            return sweeps
        
        # Encontrar swing highs y lows
        swing_highs = self._find_swing_highs(df, lookback)
        swing_lows = self._find_swing_lows(df, lookback)
        
        # Buscar barridos de liquidez
        for i in range(lookback, len(df) - 5):
            current_candle = df.iloc[i]
            
            # Sweep de liquidez compradora (rompe swing low)
            for swing_low in swing_lows:
                if (swing_low['index'] < i and 
                    current_candle['low'] < swing_low['price'] and
                    current_candle['close'] > current_candle['open']):
                    
                    sweep = LiquiditySweep(
                        price=swing_low['price'],
                        timestamp=df.index[i],
                        type='buy_side',
                        volume=current_candle.get('volume', 0),
                        strength=self._calculate_sweep_strength(current_candle, swing_low['price']),
                        index=i
                    )
                    sweeps.append(sweep)
            
            # Sweep de liquidez vendedora (rompe swing high)
            for swing_high in swing_highs:
                if (swing_high['index'] < i and 
                    current_candle['high'] > swing_high['price'] and
                    current_candle['close'] < current_candle['open']):
                    
                    sweep = LiquiditySweep(
                        price=swing_high['price'],
                        timestamp=df.index[i],
                        type='sell_side',
                        volume=current_candle.get('volume', 0),
                        strength=self._calculate_sweep_strength(current_candle, swing_high['price']),
                        index=i
                    )
                    sweeps.append(sweep)
        
        # Filtrar sweeps válidos
        valid_sweeps = [s for s in sweeps if s.strength > 0.3]
        self.liquidity_sweeps = valid_sweeps
        return valid_sweeps
    
    def _find_swing_highs(self, df: pd.DataFrame, lookback: int) -> List[Dict]:
        """Encuentra swing highs"""
        swing_highs = []
        
        for i in range(lookback, len(df) - lookback):
            current_high = df.iloc[i]['high']
            
            # Verificar si es el máximo en el rango de lookback
            is_swing_high = True
            for j in range(i - lookback, i + lookback + 1):
                if j != i and df.iloc[j]['high'] >= current_high:
                    is_swing_high = False
                    break
            
            if is_swing_high:
                swing_highs.append({
                    'index': i,
                    'price': current_high,
                    'timestamp': df.index[i]
                })
        
        return swing_highs
    
    def _find_swing_lows(self, df: pd.DataFrame, lookback: int) -> List[Dict]:
        """Encuentra swing lows"""
        swing_lows = []
        
        for i in range(lookback, len(df) - lookback):
            current_low = df.iloc[i]['low']
            
            # Verificar si es el mínimo en el rango de lookback
            is_swing_low = True
            for j in range(i - lookback, i + lookback + 1):
                if j != i and df.iloc[j]['low'] <= current_low:
                    is_swing_low = False
                    break
            
            if is_swing_low:
                swing_lows.append({
                    'index': i,
                    'price': current_low,
                    'timestamp': df.index[i]
                })
        
        return swing_lows
    
    def _calculate_sweep_strength(self, candle: pd.Series, sweep_price: float) -> float:
        """Calcula la fuerza de un liquidity sweep"""
        # Factor 1: Distancia del sweep
        if candle['low'] < sweep_price:  # Buy side sweep
            sweep_distance = abs(sweep_price - candle['low'])
        else:  # Sell side sweep
            sweep_distance = abs(candle['high'] - sweep_price)
        
        candle_range = candle['high'] - candle['low']
        distance_factor = min(sweep_distance / candle_range, 1.0)
        
        # Factor 2: Volumen
        volume_factor = 1.0
        if 'volume' in candle:
            volume_factor = min(candle['volume'] / 1000000, 1.0)
        
        # Factor 3: Fuerza de la vela
        body_size = abs(candle['close'] - candle['open'])
        body_factor = body_size / candle_range if candle_range > 0 else 0
        
        strength = (distance_factor * 0.4 + volume_factor * 0.3 + body_factor * 0.3)
        return min(strength, 1.0)
    
    def analyze_market_structure(self, df: pd.DataFrame) -> List[MarketStructure]:
        """Analiza la estructura del mercado (BOS/CHoCH)"""
        structures = []
        
        if len(df) < 20:
            return structures
        
        swing_highs = self._find_swing_highs(df, 10)
        swing_lows = self._find_swing_lows(df, 10)
        
        # Analizar cambios de estructura
        for i in range(1, len(df)):
            current_candle = df.iloc[i]
            
            # BOS (Break of Structure) - Continúa la tendencia
            # CHoCH (Change of Character) - Cambia la tendencia
            
            # Verificar breaks de swing highs (estructura bajista)
            for swing_high in swing_highs:
                if (swing_high['index'] < i and 
                    current_candle['high'] > swing_high['price']):
                    
                    # Determinar si es BOS o CHoCH
                    structure_type = self._determine_structure_type(df, swing_high, i, 'high')
                    
                    structure = MarketStructure(
                        swing_high=swing_high['price'],
                        swing_low=0,  # Se calculará después
                        timestamp=df.index[i],
                        type=structure_type,
                        direction='bullish',
                        index=i
                    )
                    structures.append(structure)
            
            # Verificar breaks de swing lows (estructura alcista)
            for swing_low in swing_lows:
                if (swing_low['index'] < i and 
                    current_candle['low'] < swing_low['price']):
                    
                    structure_type = self._determine_structure_type(df, swing_low, i, 'low')
                    
                    structure = MarketStructure(
                        swing_high=0,  # Se calculará después
                        swing_low=swing_low['price'],
                        timestamp=df.index[i],
                        type=structure_type,
                        direction='bearish',
                        index=i
                    )
                    structures.append(structure)
        
        self.market_structures = structures
        return structures
    
    def _determine_structure_type(self, df: pd.DataFrame, swing_point: Dict, break_index: int, point_type: str) -> str:
        """Determina si es BOS o CHoCH"""
        # Análisis simplificado - en implementación real sería más complejo
        # BOS: Continúa la tendencia existente
        # CHoCH: Cambia la tendencia
        
        # Verificar tendencia previa
        if break_index < 20:
            return 'BOS'
        
        prev_swings = []
        for i in range(max(0, break_index - 20), break_index):
            if point_type == 'high':
                if df.iloc[i]['high'] > df.iloc[i-1]['high'] and df.iloc[i]['high'] > df.iloc[i+1]['high']:
                    prev_swings.append(df.iloc[i]['high'])
            else:
                if df.iloc[i]['low'] < df.iloc[i-1]['low'] and df.iloc[i]['low'] < df.iloc[i+1]['low']:
                    prev_swings.append(df.iloc[i]['low'])
        
        if len(prev_swings) < 2:
            return 'BOS'
        
        # Análisis de tendencia
        if point_type == 'high':
            # Si los swings highs están subiendo, es BOS
            # Si están bajando y ahora rompe, es CHoCH
            if prev_swings[-1] > prev_swings[-2]:
                return 'BOS'
            else:
                return 'CHoCH'
        else:
            # Si los swings lows están bajando, es BOS
            # Si están subiendo y ahora rompe, es CHoCH
            if prev_swings[-1] < prev_swings[-2]:
                return 'BOS'
            else:
                return 'CHoCH'
    
    def detect_kill_zones(self, df: pd.DataFrame) -> Dict[str, List]:
        """Detecta Kill Zones - Zonas de alta probabilidad"""
        kill_zones = {
            'london_kill_zone': [],
            'new_york_kill_zone': [],
            'asian_kill_zone': []
        }
        
        if len(df) < 24:  # Necesitamos al menos 24 horas
            return kill_zones
        
        # Analizar cada hora del día
        for i in range(len(df)):
            timestamp = df.index[i]
            hour = timestamp.hour
            
            # London Kill Zone: 7:00-10:00 UTC
            if 7 <= hour < 10:
                kill_zones['london_kill_zone'].append({
                    'timestamp': timestamp,
                    'price': df.iloc[i]['close'],
                    'volume': df.iloc[i].get('volume', 0),
                    'index': i
                })
            
            # New York Kill Zone: 13:00-16:00 UTC
            elif 13 <= hour < 16:
                kill_zones['new_york_kill_zone'].append({
                    'timestamp': timestamp,
                    'price': df.iloc[i]['close'],
                    'volume': df.iloc[i].get('volume', 0),
                    'index': i
                })
            
            # Asian Kill Zone: 0:00-3:00 UTC
            elif 0 <= hour < 3:
                kill_zones['asian_kill_zone'].append({
                    'timestamp': timestamp,
                    'price': df.iloc[i]['close'],
                    'volume': df.iloc[i].get('volume', 0),
                    'index': i
                })
        
        return kill_zones
    
    def detect_consequent_encroachment(self, df: pd.DataFrame) -> List[Dict]:
        """Detecta Consequent Encroachment - Encroachment consecutivo"""
        encroachments = []
        
        if len(df) < 10:
            return encroachments
        
        # Buscar patrones de encroachment en Fair Value Gaps
        for i in range(2, len(df) - 2):
            if self._is_consequent_encroachment(df, i):
                encroachments.append({
                    'timestamp': df.index[i],
                    'price': df.iloc[i]['close'],
                    'type': 'consequent_encroachment',
                    'strength': self._calculate_encroachment_strength(df, i),
                    'index': i
                })
        
        return encroachments
    
    def _is_consequent_encroachment(self, df: pd.DataFrame, index: int) -> bool:
        """Verifica si hay consequent encroachment en un índice"""
        # Implementación simplificada
        # En realidad sería más complejo, analizando múltiples FVGs
        current_candle = df.iloc[index]
        prev_candle = df.iloc[index - 1]
        
        # Patrón básico de encroachment
        return (prev_candle['close'] < prev_candle['open'] and  # Vela bajista previa
                current_candle['close'] > current_candle['open'] and  # Vela alcista actual
                current_candle['low'] < prev_candle['close'])  # Encroachment
    
    def _calculate_encroachment_strength(self, df: pd.DataFrame, index: int) -> float:
        """Calcula la fuerza del consequent encroachment"""
        # Implementación básica
        return 0.7  # Valor fijo por simplicidad
    
    def find_optimal_trade_entry(self, df: pd.DataFrame) -> Dict[str, any]:
        """Encuentra la entrada óptima basada en conceptos ICT"""
        entry_signals = {
            'order_block_entry': None,
            'fvg_entry': None,
            'liquidity_sweep_entry': None,
            'market_structure_entry': None,
            'kill_zone_entry': None,
            'overall_confidence': 0.0
        }
        
        if len(df) < 10:
            return entry_signals
        
        current_price = df.iloc[-1]['close']
        
        # Buscar Order Blocks cercanos y no tocados
        for ob in self.order_blocks:
            if not ob.touched and abs(ob.low - current_price) / current_price < 0.01:
                if ob.type == 'bullish' and current_price >= ob.low:
                    entry_signals['order_block_entry'] = {
                        'price': ob.low,
                        'type': 'bullish',
                        'strength': ob.strength,
                        'confidence': 0.8
                    }
                elif ob.type == 'bearish' and current_price <= ob.high:
                    entry_signals['order_block_entry'] = {
                        'price': ob.high,
                        'type': 'bearish',
                        'strength': ob.strength,
                        'confidence': 0.8
                    }
        
        # Buscar Fair Value Gaps no llenados
        for fvg in self.fair_value_gaps:
            if not fvg.filled and fvg.low <= current_price <= fvg.high:
                entry_signals['fvg_entry'] = {
                    'price_range': (fvg.low, fvg.high),
                    'type': fvg.type,
                    'strength': fvg.strength,
                    'confidence': 0.7
                }
        
        # Verificar si estamos en Kill Zone
        current_hour = df.index[-1].hour
        if 7 <= current_hour < 10 or 13 <= current_hour < 16 or 0 <= current_hour < 3:
            entry_signals['kill_zone_entry'] = {
                'zone': 'london' if 7 <= current_hour < 10 else 'new_york' if 13 <= current_hour < 16 else 'asian',
                'confidence': 0.6
            }
        
        # Calcular confianza general
        confidences = [signal.get('confidence', 0) for signal in entry_signals.values() 
                      if isinstance(signal, dict) and 'confidence' in signal]
        
        if confidences:
            entry_signals['overall_confidence'] = max(confidences)
        
        return entry_signals
    
    def get_ict_trading_signals(self, df: pd.DataFrame) -> Dict[str, any]:
        """Genera señales de trading basadas en conceptos ICT"""
        signals = {
            'bullish_setup': False,
            'bearish_setup': False,
            'confluence_score': 0.0,
            'risk_reward_ratio': 1.0,
            'entry_price': 0.0,
            'stop_loss': 0.0,
            'take_profit': 0.0,
            'confidence': 0.0
        }
        
        optimal_entry = self.find_optimal_trade_entry(df)
        
        if optimal_entry['overall_confidence'] > 0.6:
            # Calcular confluencia de señales
            confluence_factors = []
            
            if optimal_entry['order_block_entry']:
                confluence_factors.append(optimal_entry['order_block_entry']['confidence'])
            
            if optimal_entry['fvg_entry']:
                confluence_factors.append(optimal_entry['fvg_entry']['confidence'])
            
            if optimal_entry['kill_zone_entry']:
                confluence_factors.append(optimal_entry['kill_zone_entry']['confidence'])
            
            if confluence_factors:
                signals['confluence_score'] = np.mean(confluence_factors)
                signals['confidence'] = optimal_entry['overall_confidence']
                
                # Determinar dirección
                if optimal_entry['order_block_entry'] and optimal_entry['order_block_entry']['type'] == 'bullish':
                    signals['bullish_setup'] = True
                    signals['entry_price'] = optimal_entry['order_block_entry']['price']
                    signals['stop_loss'] = signals['entry_price'] * 0.995  # 0.5% stop
                    signals['take_profit'] = signals['entry_price'] * 1.015  # 1.5% target
                    signals['risk_reward_ratio'] = 3.0
                
                elif optimal_entry['order_block_entry'] and optimal_entry['order_block_entry']['type'] == 'bearish':
                    signals['bearish_setup'] = True
                    signals['entry_price'] = optimal_entry['order_block_entry']['price']
                    signals['stop_loss'] = signals['entry_price'] * 1.005  # 0.5% stop
                    signals['take_profit'] = signals['entry_price'] * 0.985  # 1.5% target
                    signals['risk_reward_ratio'] = 3.0
        
        return signals




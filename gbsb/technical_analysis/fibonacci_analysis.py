"""
Módulo de análisis de Fibonacci
Implementa retrocesos de Fibonacci, extensiones, abanicos y proyecciones
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
import math

@dataclass
class FibonacciLevel:
    """Nivel de Fibonacci"""
    ratio: float
    price: float
    type: str  # 'retracement', 'extension', 'projection'
    strength: float  # 0-1
    touches: int = 0

@dataclass
class FibonacciRetracement:
    """Retroceso de Fibonacci"""
    high_price: float
    low_price: float
    levels: List[FibonacciLevel]
    swing_high_index: int
    swing_low_index: int
    direction: str  # 'uptrend' o 'downtrend'
    strength: float  # 0-1

@dataclass
class FibonacciExtension:
    """Extensión de Fibonacci"""
    point_a: float  # Punto de inicio
    point_b: float  # Punto de corrección
    point_c: float  # Punto de proyección
    levels: List[FibonacciLevel]
    direction: str  # 'bullish' o 'bearish'
    strength: float  # 0-1

@dataclass
class FibonacciFan:
    """Abanico de Fibonacci"""
    anchor_point: Tuple[float, int]  # (precio, índice)
    fan_lines: List[Dict[str, float]]  # Lista de líneas del abanico
    direction: str  # 'uptrend' o 'downtrend'
    strength: float  # 0-1

class FibonacciAnalyzer:
    """Analizador de Fibonacci"""
    
    def __init__(self):
        # Ratios estándar de Fibonacci
        self.retracement_ratios = [0.0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0]
        self.extension_ratios = [0.0, 0.382, 0.618, 1.0, 1.272, 1.414, 1.618, 2.0, 2.618]
        self.fan_ratios = [0.236, 0.382, 0.5, 0.618, 0.786]
        
        self.retracements: List[FibonacciRetracement] = []
        self.extensions: List[FibonacciExtension] = []
        self.fans: List[FibonacciFan] = []
    
    def analyze_fibonacci_levels(self, df: pd.DataFrame) -> Dict[str, any]:
        """Analiza todos los niveles de Fibonacci en los datos"""
        analysis = {
            'retracements': self.calculate_retracements(df),
            'extensions': self.calculate_extensions(df),
            'fans': self.calculate_fibonacci_fans(df),
            'time_zones': self.calculate_fibonacci_time_zones(df),
            'arcs': self.calculate_fibonacci_arcs(df),
            'projections': self.calculate_fibonacci_projections(df)
        }
        
        return analysis
    
    def calculate_retracements(self, df: pd.DataFrame, min_swing_size: float = 0.02) -> List[FibonacciRetracement]:
        """Calcula retrocesos de Fibonacci"""
        retracements = []
        
        if len(df) < 20:
            return retracements
        
        # Encontrar swing highs y lows significativos
        swing_highs = self._find_significant_swing_highs(df, min_swing_size)
        swing_lows = self._find_significant_swing_lows(df, min_swing_size)
        
        # Calcular retrocesos para tendencias alcistas
        for swing_high in swing_highs:
            for swing_low in swing_lows:
                if (swing_low['index'] > swing_high['index'] and  # Low después de high
                    swing_low['price'] < swing_high['price']):    # Precio bajó
                    
                    retracement = self._create_retracement(
                        df, swing_high, swing_low, 'uptrend'
                    )
                    if retracement:
                        retracements.append(retracement)
        
        # Calcular retrocesos para tendencias bajistas
        for swing_low in swing_lows:
            for swing_high in swing_highs:
                if (swing_high['index'] > swing_low['index'] and  # High después de low
                    swing_high['price'] > swing_low['price']):    # Precio subió
                    
                    retracement = self._create_retracement(
                        df, swing_high, swing_low, 'downtrend'
                    )
                    if retracement:
                        retracements.append(retracement)
        
        # Filtrar y ordenar por fuerza
        valid_retracements = [r for r in retracements if r.strength > 0.3]
        valid_retracements.sort(key=lambda x: x.strength, reverse=True)
        
        self.retracements = valid_retracements
        return valid_retracements
    
    def _create_retracement(self, df: pd.DataFrame, swing_high: Dict, swing_low: Dict, direction: str) -> Optional[FibonacciRetracement]:
        """Crea un retroceso de Fibonacci"""
        high_price = swing_high['price']
        low_price = swing_low['price']
        
        # Calcular niveles de retroceso
        levels = []
        for ratio in self.retracement_ratios:
            if direction == 'uptrend':
                price = high_price - (high_price - low_price) * ratio
            else:  # downtrend
                price = low_price + (high_price - low_price) * ratio
            
            # Contar toques en este nivel
            touches = self._count_level_touches(df, price, swing_high['index'], swing_low['index'])
            
            level = FibonacciLevel(
                ratio=ratio,
                price=price,
                type='retracement',
                strength=min(touches / 3.0, 1.0)
            )
            level.touches = touches
            levels.append(level)
        
        # Calcular fuerza general del retroceso
        total_touches = sum(level.touches for level in levels)
        strength = min(total_touches / 10.0, 1.0)
        
        return FibonacciRetracement(
            high_price=high_price,
            low_price=low_price,
            levels=levels,
            swing_high_index=swing_high['index'],
            swing_low_index=swing_low['index'],
            direction=direction,
            strength=strength
        )
    
    def calculate_extensions(self, df: pd.DataFrame, min_swing_size: float = 0.015) -> List[FibonacciExtension]:
        """Calcula extensiones de Fibonacci"""
        extensions = []
        
        if len(df) < 30:
            return extensions
        
        # Encontrar patrones ABC para extensiones
        swing_points = self._find_all_swing_points(df, min_swing_size)
        
        # Buscar patrones de 3 puntos (A, B, C)
        for i in range(len(swing_points) - 2):
            point_a = swing_points[i]
            point_b = swing_points[i + 1]
            point_c = swing_points[i + 2]
            
            # Verificar si forma un patrón válido
            if self._is_valid_abc_pattern(point_a, point_b, point_c):
                extension = self._create_extension(point_a, point_b, point_c)
                if extension:
                    extensions.append(extension)
        
        # Filtrar extensiones válidas
        valid_extensions = [e for e in extensions if e.strength > 0.3]
        valid_extensions.sort(key=lambda x: x.strength, reverse=True)
        
        self.extensions = valid_extensions
        return valid_extensions
    
    def _create_extension(self, point_a: Dict, point_b: Dict, point_c: Dict) -> Optional[FibonacciExtension]:
        """Crea una extensión de Fibonacci"""
        # Calcular distancia AB
        ab_distance = abs(point_b['price'] - point_a['price'])
        
        # Determinar dirección
        if point_c['price'] > point_a['price']:
            direction = 'bullish'
        else:
            direction = 'bearish'
        
        # Calcular niveles de extensión
        levels = []
        for ratio in self.extension_ratios:
            if direction == 'bullish':
                price = point_c['price'] + ab_distance * ratio
            else:
                price = point_c['price'] - ab_distance * ratio
            
            level = FibonacciLevel(
                ratio=ratio,
                price=price,
                type='extension',
                strength=0.5  # Valor base
            )
            levels.append(level)
        
        # Calcular fuerza basada en el patrón
        strength = self._calculate_extension_strength(point_a, point_b, point_c)
        
        return FibonacciExtension(
            point_a=point_a['price'],
            point_b=point_b['price'],
            point_c=point_c['price'],
            levels=levels,
            direction=direction,
            strength=strength
        )
    
    def calculate_fibonacci_fans(self, df: pd.DataFrame) -> List[FibonacciFan]:
        """Calcula abanicos de Fibonacci"""
        fans = []
        
        if len(df) < 20:
            return fans
        
        # Encontrar swing points significativos
        swing_highs = self._find_significant_swing_highs(df, 0.02)
        swing_lows = self._find_significant_swing_lows(df, 0.02)
        
        # Crear abanicos desde swing highs (tendencia bajista)
        for swing_high in swing_highs:
            fan = self._create_bearish_fan(df, swing_high)
            if fan:
                fans.append(fan)
        
        # Crear abanicos desde swing lows (tendencia alcista)
        for swing_low in swing_lows:
            fan = self._create_bullish_fan(df, swing_low)
            if fan:
                fans.append(fan)
        
        # Filtrar abanicos válidos
        valid_fans = [f for f in fans if f.strength > 0.3]
        valid_fans.sort(key=lambda x: x.strength, reverse=True)
        
        self.fans = valid_fans
        return valid_fans
    
    def _create_bearish_fan(self, df: pd.DataFrame, swing_high: Dict) -> Optional[FibonacciFan]:
        """Crea un abanico bajista desde un swing high"""
        anchor_price = swing_high['price']
        anchor_index = swing_high['index']
        
        # Encontrar el swing low más bajo después del swing high
        swing_low_after = None
        for i in range(anchor_index, len(df)):
            if i > anchor_index + 5:  # Buscar después de 5 barras
                current_low = df.iloc[i]['low']
                if swing_low_after is None or current_low < swing_low_after['price']:
                    swing_low_after = {
                        'price': current_low,
                        'index': i
                    }
        
        if not swing_low_after:
            return None
        
        # Calcular líneas del abanico
        fan_lines = []
        base_distance = anchor_price - swing_low_after['price']
        
        for ratio in self.fan_ratios:
            slope = base_distance * ratio / (swing_low_after['index'] - anchor_index)
            intercept = anchor_price - slope * anchor_index
            
            fan_lines.append({
                'ratio': ratio,
                'slope': slope,
                'intercept': intercept
            })
        
        # Calcular fuerza del abanico
        strength = self._calculate_fan_strength(df, fan_lines, anchor_index)
        
        return FibonacciFan(
            anchor_point=(anchor_price, anchor_index),
            fan_lines=fan_lines,
            direction='downtrend',
            strength=strength
        )
    
    def _create_bullish_fan(self, df: pd.DataFrame, swing_low: Dict) -> Optional[FibonacciFan]:
        """Crea un abanico alcista desde un swing low"""
        anchor_price = swing_low['price']
        anchor_index = swing_low['index']
        
        # Encontrar el swing high más alto después del swing low
        swing_high_after = None
        for i in range(anchor_index, len(df)):
            if i > anchor_index + 5:  # Buscar después de 5 barras
                current_high = df.iloc[i]['high']
                if swing_high_after is None or current_high > swing_high_after['price']:
                    swing_high_after = {
                        'price': current_high,
                        'index': i
                    }
        
        if not swing_high_after:
            return None
        
        # Calcular líneas del abanico
        fan_lines = []
        base_distance = swing_high_after['price'] - anchor_price
        
        for ratio in self.fan_ratios:
            slope = base_distance * ratio / (swing_high_after['index'] - anchor_index)
            intercept = anchor_price - slope * anchor_index
            
            fan_lines.append({
                'ratio': ratio,
                'slope': slope,
                'intercept': intercept
            })
        
        # Calcular fuerza del abanico
        strength = self._calculate_fan_strength(df, fan_lines, anchor_index)
        
        return FibonacciFan(
            anchor_point=(anchor_price, anchor_index),
            fan_lines=fan_lines,
            direction='uptrend',
            strength=strength
        )
    
    def calculate_fibonacci_time_zones(self, df: pd.DataFrame) -> List[Dict]:
        """Calcula zonas temporales de Fibonacci"""
        time_zones = []
        
        if len(df) < 50:
            return time_zones
        
        # Encontrar swing point significativo
        swing_points = self._find_all_swing_points(df, 0.02)
        
        if len(swing_points) < 2:
            return time_zones
        
        # Usar el swing point más significativo como base
        base_point = max(swing_points, key=lambda x: x.get('strength', 0))
        base_index = base_point['index']
        
        # Calcular zonas temporales usando la secuencia de Fibonacci
        fibonacci_sequence = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144]
        
        for fib_num in fibonacci_sequence:
            target_index = base_index + fib_num
            
            if target_index < len(df):
                time_zone = {
                    'index': target_index,
                    'timestamp': df.index[target_index],
                    'fibonacci_number': fib_num,
                    'price': df.iloc[target_index]['close'],
                    'strength': self._calculate_time_zone_strength(df, target_index)
                }
                time_zones.append(time_zone)
        
        return time_zones
    
    def calculate_fibonacci_arcs(self, df: pd.DataFrame) -> List[Dict]:
        """Calcula arcos de Fibonacci"""
        arcs = []
        
        if len(df) < 30:
            return arcs
        
        # Encontrar swing points para crear arcos
        swing_highs = self._find_significant_swing_highs(df, 0.02)
        swing_lows = self._find_significant_swing_lows(df, 0.02)
        
        # Crear arcos desde swing highs
        for swing_high in swing_highs:
            arc = self._create_fibonacci_arc(df, swing_high, 'bearish')
            if arc:
                arcs.append(arc)
        
        # Crear arcos desde swing lows
        for swing_low in swing_lows:
            arc = self._create_fibonacci_arc(df, swing_low, 'bullish')
            if arc:
                arcs.append(arc)
        
        return arcs
    
    def calculate_fibonacci_projections(self, df: pd.DataFrame) -> List[Dict]:
        """Calcula proyecciones de Fibonacci"""
        projections = []
        
        if len(df) < 20:
            return projections
        
        # Encontrar patrones de 3 puntos para proyecciones
        swing_points = self._find_all_swing_points(df, 0.015)
        
        for i in range(len(swing_points) - 2):
            point_a = swing_points[i]
            point_b = swing_points[i + 1]
            point_c = swing_points[i + 2]
            
            # Calcular proyecciones basadas en el patrón ABC
            projection = self._create_fibonacci_projection(point_a, point_b, point_c)
            if projection:
                projections.append(projection)
        
        return projections
    
    def _find_significant_swing_highs(self, df: pd.DataFrame, min_size: float) -> List[Dict]:
        """Encuentra swing highs significativos"""
        swing_highs = []
        
        for i in range(10, len(df) - 10):
            current_high = df.iloc[i]['high']
            
            # Verificar si es un máximo local
            is_swing_high = True
            for j in range(i - 10, i + 11):
                if j != i and df.iloc[j]['high'] >= current_high:
                    is_swing_high = False
                    break
            
            if is_swing_high:
                # Calcular tamaño del swing
                left_low = min(df.iloc[i-10:i]['low'])
                right_low = min(df.iloc[i:i+10]['low'])
                swing_size = (current_high - min(left_low, right_low)) / current_high
                
                if swing_size >= min_size:
                    swing_highs.append({
                        'price': current_high,
                        'index': i,
                        'timestamp': df.index[i],
                        'size': swing_size,
                        'strength': swing_size
                    })
        
        return swing_highs
    
    def _find_significant_swing_lows(self, df: pd.DataFrame, min_size: float) -> List[Dict]:
        """Encuentra swing lows significativos"""
        swing_lows = []
        
        for i in range(10, len(df) - 10):
            current_low = df.iloc[i]['low']
            
            # Verificar si es un mínimo local
            is_swing_low = True
            for j in range(i - 10, i + 11):
                if j != i and df.iloc[j]['low'] <= current_low:
                    is_swing_low = False
                    break
            
            if is_swing_low:
                # Calcular tamaño del swing
                left_high = max(df.iloc[i-10:i]['high'])
                right_high = max(df.iloc[i:i+10]['high'])
                swing_size = (max(left_high, right_high) - current_low) / current_low
                
                if swing_size >= min_size:
                    swing_lows.append({
                        'price': current_low,
                        'index': i,
                        'timestamp': df.index[i],
                        'size': swing_size,
                        'strength': swing_size
                    })
        
        return swing_lows
    
    def _find_all_swing_points(self, df: pd.DataFrame, min_size: float) -> List[Dict]:
        """Encuentra todos los puntos pivote significativos"""
        swing_points = []
        
        # Combinar swing highs y lows
        swing_highs = self._find_significant_swing_highs(df, min_size)
        swing_lows = self._find_significant_swing_lows(df, min_size)
        
        # Agregar tipo y combinar
        for sh in swing_highs:
            sh['type'] = 'high'
            swing_points.append(sh)
        
        for sl in swing_lows:
            sl['type'] = 'low'
            swing_points.append(sl)
        
        # Ordenar por índice
        swing_points.sort(key=lambda x: x['index'])
        
        return swing_points
    
    def _count_level_touches(self, df: pd.DataFrame, level_price: float, start_index: int, end_index: int, tolerance: float = 0.002) -> int:
        """Cuenta cuántas veces el precio toca un nivel de Fibonacci"""
        touches = 0
        
        for i in range(start_index, min(end_index + 1, len(df))):
            candle = df.iloc[i]
            
            # Verificar si el precio toca el nivel
            if (candle['low'] <= level_price * (1 + tolerance) and 
                candle['high'] >= level_price * (1 - tolerance)):
                touches += 1
        
        return touches
    
    def _is_valid_abc_pattern(self, point_a: Dict, point_b: Dict, point_c: Dict) -> bool:
        """Verifica si tres puntos forman un patrón ABC válido"""
        # Patrón básico: A -> B -> C con movimiento significativo
        ab_move = abs(point_b['price'] - point_a['price']) / point_a['price']
        bc_move = abs(point_c['price'] - point_b['price']) / point_b['price']
        
        return ab_move > 0.01 and bc_move > 0.01  # Movimientos mínimos del 1%
    
    def _calculate_extension_strength(self, point_a: Dict, point_b: Dict, point_c: Dict) -> float:
        """Calcula la fuerza de una extensión de Fibonacci"""
        # Factor 1: Tamaño de los movimientos
        ab_size = abs(point_b['price'] - point_a['price']) / point_a['price']
        bc_size = abs(point_c['price'] - point_b['price']) / point_b['price']
        
        size_factor = min((ab_size + bc_size) / 0.1, 1.0)
        
        # Factor 2: Proporción de los movimientos (debe ser similar a ratios de Fibonacci)
        ratio = bc_size / ab_size if ab_size > 0 else 0
        fibonacci_ratios = [0.382, 0.5, 0.618, 1.0, 1.272, 1.618]
        
        ratio_factor = 0
        for fib_ratio in fibonacci_ratios:
            if abs(ratio - fib_ratio) / fib_ratio < 0.1:  # 10% de tolerancia
                ratio_factor = 1.0
                break
        
        strength = (size_factor * 0.6 + ratio_factor * 0.4)
        return min(strength, 1.0)
    
    def _calculate_fan_strength(self, df: pd.DataFrame, fan_lines: List[Dict], anchor_index: int) -> float:
        """Calcula la fuerza de un abanico de Fibonacci"""
        touches = 0
        
        for line in fan_lines:
            for i in range(anchor_index, len(df)):
                expected_price = line['slope'] * i + line['intercept']
                actual_price = df.iloc[i]['close']
                
                if abs(actual_price - expected_price) / expected_price < 0.01:  # 1% tolerancia
                    touches += 1
        
        # Normalizar fuerza
        max_possible_touches = len(fan_lines) * (len(df) - anchor_index)
        strength = touches / max_possible_touches if max_possible_touches > 0 else 0
        
        return min(strength * 2, 1.0)  # Escalar para que sea más sensible
    
    def _calculate_time_zone_strength(self, df: pd.DataFrame, target_index: int) -> float:
        """Calcula la fuerza de una zona temporal de Fibonacci"""
        if target_index >= len(df):
            return 0
        
        # Verificar si hay reversión en la zona temporal
        window_size = 3
        start_idx = max(0, target_index - window_size)
        end_idx = min(len(df), target_index + window_size + 1)
        
        prices = [df.iloc[i]['close'] for i in range(start_idx, end_idx)]
        
        if len(prices) < 3:
            return 0
        
        # Verificar si hay un mínimo o máximo local
        center_price = prices[len(prices) // 2]
        is_extreme = (center_price == min(prices) or center_price == max(prices))
        
        return 0.8 if is_extreme else 0.3
    
    def _create_fibonacci_arc(self, df: pd.DataFrame, swing_point: Dict, direction: str) -> Optional[Dict]:
        """Crea un arco de Fibonacci"""
        # Implementación simplificada
        return {
            'center': (swing_point['price'], swing_point['index']),
            'direction': direction,
            'radius': abs(swing_point['price']) * 0.05,  # 5% del precio como radio
            'strength': swing_point.get('strength', 0.5)
        }
    
    def _create_fibonacci_projection(self, point_a: Dict, point_b: Dict, point_c: Dict) -> Optional[Dict]:
        """Crea una proyección de Fibonacci"""
        # Calcular proyecciones usando ratios estándar
        ab_distance = abs(point_b['price'] - point_a['price'])
        
        projections = []
        for ratio in [1.272, 1.414, 1.618, 2.0]:
            if point_c['price'] > point_a['price']:  # Proyección alcista
                target_price = point_c['price'] + ab_distance * ratio
            else:  # Proyección bajista
                target_price = point_c['price'] - ab_distance * ratio
            
            projections.append({
                'ratio': ratio,
                'price': target_price,
                'strength': 0.5
            })
        
        return {
            'point_a': point_a,
            'point_b': point_b,
            'point_c': point_c,
            'projections': projections,
            'strength': self._calculate_extension_strength(point_a, point_b, point_c)
        }
    
    def get_current_fibonacci_levels(self, current_price: float, buffer: float = 0.005) -> Dict[str, List[FibonacciLevel]]:
        """Obtiene niveles de Fibonacci cercanos al precio actual"""
        nearby_levels = {
            'retracements': [],
            'extensions': [],
            'projections': []
        }
        
        # Buscar en retrocesos
        for retracement in self.retracements:
            for level in retracement.levels:
                price_diff = abs(level.price - current_price) / current_price
                if price_diff <= buffer and level.strength > 0.3:
                    nearby_levels['retracements'].append(level)
        
        # Buscar en extensiones
        for extension in self.extensions:
            for level in extension.levels:
                price_diff = abs(level.price - current_price) / current_price
                if price_diff <= buffer and level.strength > 0.3:
                    nearby_levels['extensions'].append(level)
        
        # Ordenar por distancia al precio actual
        for level_type in nearby_levels:
            nearby_levels[level_type].sort(key=lambda x: abs(x.price - current_price))
        
        return nearby_levels
    
    def get_fibonacci_trading_signals(self, df: pd.DataFrame) -> Dict[str, any]:
        """Genera señales de trading basadas en niveles de Fibonacci"""
        signals = {
            'fibonacci_bounce': False,
            'fibonacci_rejection': False,
            'fibonacci_breakout': False,
            'confluence_level': None,
            'confidence': 0.0,
            'entry_price': 0.0,
            'stop_loss': 0.0,
            'take_profit': 0.0
        }
        
        if len(df) < 2:
            return signals
        
        current_price = df.iloc[-1]['close']
        prev_price = df.iloc[-2]['close']
        
        # Obtener niveles cercanos
        nearby_levels = self.get_current_fibonacci_levels(current_price, buffer=0.01)
        
        # Buscar señales en retrocesos
        for level in nearby_levels['retracements']:
            if level.ratio in [0.382, 0.5, 0.618]:  # Niveles principales
                
                # Detectar bounce (rebote)
                if (prev_price < level.price and current_price >= level.price * 0.999 and
                    level.strength > 0.5):
                    signals['fibonacci_bounce'] = True
                    signals['confluence_level'] = level
                    signals['confidence'] = level.strength
                    signals['entry_price'] = level.price
                    signals['stop_loss'] = level.price * 0.995
                    signals['take_profit'] = level.price * 1.015
                
                # Detectar rechazo
                elif (prev_price > level.price and current_price <= level.price * 1.001 and
                      level.strength > 0.5):
                    signals['fibonacci_rejection'] = True
                    signals['confluence_level'] = level
                    signals['confidence'] = level.strength
                    signals['entry_price'] = level.price
                    signals['stop_loss'] = level.price * 1.005
                    signals['take_profit'] = level.price * 0.985
        
        # Buscar breakouts en extensiones
        for level in nearby_levels['extensions']:
            if level.ratio in [1.272, 1.618]:  # Niveles de extensión importantes
                
                if (prev_price < level.price and current_price > level.price and
                    level.strength > 0.4):
                    signals['fibonacci_breakout'] = True
                    signals['confluence_level'] = level
                    signals['confidence'] = level.strength
                    signals['entry_price'] = level.price
                    signals['stop_loss'] = level.price * 0.995
                    signals['take_profit'] = level.price * 1.02
        
        return signals




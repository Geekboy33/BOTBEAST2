"""
Módulo de análisis de soportes y resistencias
Implementa algoritmos avanzados para detectar niveles clave de soporte y resistencia
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
import talib
from scipy.signal import argrelextrema

@dataclass
class SupportResistanceLevel:
    """Nivel de soporte o resistencia"""
    price: float
    strength: float  # 0-1, qué tan fuerte es el nivel
    touches: int     # Número de toques
    type: str        # 'support' o 'resistance'
    timeframe: str   # Timeframe donde se detectó
    last_touch: Optional[pd.Timestamp] = None

class SupportResistanceAnalyzer:
    """Analizador de soportes y resistencias"""
    
    def __init__(self, min_touches: int = 2, tolerance: float = 0.001):
        self.min_touches = min_touches
        self.tolerance = tolerance
        self.levels: List[SupportResistanceLevel] = []
    
    def find_pivot_points(self, df: pd.DataFrame) -> Dict[str, List]:
        """Encuentra puntos pivote usando diferentes métodos"""
        highs = []
        lows = []
        
        # Método 1: Máximos y mínimos locales
        high_indices = argrelextrema(df['high'].values, np.greater, order=5)[0]
        low_indices = argrelextrema(df['low'].values, np.less, order=5)[0]
        
        for idx in high_indices:
            if idx > 0 and idx < len(df) - 1:
                highs.append({
                    'index': idx,
                    'price': df.iloc[idx]['high'],
                    'timestamp': df.index[idx]
                })
        
        for idx in low_indices:
            if idx > 0 and idx < len(df) - 1:
                lows.append({
                    'index': idx,
                    'price': df.iloc[idx]['low'],
                    'timestamp': df.index[idx]
                })
        
        # Método 2: Fractales (Williams Fractals)
        fractal_highs = self._find_fractals(df, 'high')
        fractal_lows = self._find_fractals(df, 'low')
        
        # Método 3: Pivot Points tradicionales
        pivot_highs, pivot_lows = self._calculate_pivot_points(df)
        
        return {
            'local_highs': highs,
            'local_lows': lows,
            'fractal_highs': fractal_highs,
            'fractal_lows': fractal_lows,
            'pivot_highs': pivot_highs,
            'pivot_lows': pivot_lows
        }
    
    def _find_fractals(self, df: pd.DataFrame, column: str) -> List[Dict]:
        """Encuentra fractales de Williams"""
        fractals = []
        
        for i in range(2, len(df) - 2):
            current = df.iloc[i][column]
            
            if column == 'high':
                # Fractal superior: máximo local
                if (current > df.iloc[i-2][column] and 
                    current > df.iloc[i-1][column] and
                    current > df.iloc[i+1][column] and 
                    current > df.iloc[i+2][column]):
                    fractals.append({
                        'index': i,
                        'price': current,
                        'timestamp': df.index[i]
                    })
            else:
                # Fractal inferior: mínimo local
                if (current < df.iloc[i-2][column] and 
                    current < df.iloc[i-1][column] and
                    current < df.iloc[i+1][column] and 
                    current < df.iloc[i+2][column]):
                    fractals.append({
                        'index': i,
                        'price': current,
                        'timestamp': df.index[i]
                    })
        
        return fractals
    
    def _calculate_pivot_points(self, df: pd.DataFrame) -> Tuple[List, List]:
        """Calcula pivot points tradicionales"""
        pivot_highs = []
        pivot_lows = []
        
        for i in range(1, len(df) - 1):
            # Pivot High: máximo entre 3 barras
            if (df.iloc[i]['high'] > df.iloc[i-1]['high'] and 
                df.iloc[i]['high'] > df.iloc[i+1]['high']):
                pivot_highs.append({
                    'index': i,
                    'price': df.iloc[i]['high'],
                    'timestamp': df.index[i]
                })
            
            # Pivot Low: mínimo entre 3 barras
            if (df.iloc[i]['low'] < df.iloc[i-1]['low'] and 
                df.iloc[i]['low'] < df.iloc[i+1]['low']):
                pivot_lows.append({
                    'index': i,
                    'price': df.iloc[i]['low'],
                    'timestamp': df.index[i]
                })
        
        return pivot_highs, pivot_lows
    
    def detect_levels(self, df: pd.DataFrame, timeframe: str = '1h') -> List[SupportResistanceLevel]:
        """Detecta niveles de soporte y resistencia"""
        pivot_data = self.find_pivot_points(df)
        
        # Combinar todos los puntos pivote
        all_highs = (pivot_data['local_highs'] + 
                    pivot_data['fractal_highs'] + 
                    pivot_data['pivot_highs'])
        
        all_lows = (pivot_data['local_lows'] + 
                   pivot_data['fractal_lows'] + 
                   pivot_data['pivot_lows'])
        
        # Agrupar niveles similares
        resistance_levels = self._group_levels(all_highs, 'resistance', timeframe)
        support_levels = self._group_levels(all_lows, 'support', timeframe)
        
        self.levels = resistance_levels + support_levels
        
        # Filtrar niveles débiles
        self.levels = [level for level in self.levels if level.strength > 0.3]
        
        return self.levels
    
    def _group_levels(self, points: List[Dict], level_type: str, timeframe: str) -> List[SupportResistanceLevel]:
        """Agrupa puntos similares en niveles"""
        if not points:
            return []
        
        # Ordenar por precio
        points.sort(key=lambda x: x['price'])
        
        levels = []
        current_group = [points[0]]
        
        for point in points[1:]:
            # Si el precio está dentro de la tolerancia, agregar al grupo actual
            if abs(point['price'] - current_group[-1]['price']) / current_group[-1]['price'] <= self.tolerance:
                current_group.append(point)
            else:
                # Crear nivel del grupo actual
                if len(current_group) >= self.min_touches:
                    avg_price = np.mean([p['price'] for p in current_group])
                    strength = min(len(current_group) / 5.0, 1.0)  # Normalizar fuerza
                    
                    levels.append(SupportResistanceLevel(
                        price=avg_price,
                        strength=strength,
                        touches=len(current_group),
                        type=level_type,
                        timeframe=timeframe,
                        last_touch=max([p['timestamp'] for p in current_group])
                    ))
                
                # Iniciar nuevo grupo
                current_group = [point]
        
        # Procesar último grupo
        if len(current_group) >= self.min_touches:
            avg_price = np.mean([p['price'] for p in current_group])
            strength = min(len(current_group) / 5.0, 1.0)
            
            levels.append(SupportResistanceLevel(
                price=avg_price,
                strength=strength,
                touches=len(current_group),
                type=level_type,
                timeframe=timeframe,
                last_touch=max([p['timestamp'] for p in current_group])
            ))
        
        return levels
    
    def get_current_levels(self, current_price: float, buffer: float = 0.005) -> Dict[str, List[SupportResistanceLevel]]:
        """Obtiene niveles cercanos al precio actual"""
        nearby_support = []
        nearby_resistance = []
        
        for level in self.levels:
            price_diff = abs(level.price - current_price) / current_price
            
            if price_diff <= buffer:
                if level.type == 'support':
                    nearby_support.append(level)
                else:
                    nearby_resistance.append(level)
        
        # Ordenar por distancia al precio actual
        nearby_support.sort(key=lambda x: abs(x.price - current_price))
        nearby_resistance.sort(key=lambda x: abs(x.price - current_price))
        
        return {
            'support': nearby_support[:3],  # Top 3 más cercanos
            'resistance': nearby_resistance[:3]
        }
    
    def calculate_level_strength(self, level: SupportResistanceLevel, df: pd.DataFrame) -> float:
        """Calcula la fuerza actual de un nivel"""
        # Contar toques recientes
        recent_touches = 0
        lookback = min(50, len(df))
        
        for i in range(len(df) - lookback, len(df)):
            price = df.iloc[i]['close']
            if abs(price - level.price) / level.price <= self.tolerance:
                recent_touches += 1
        
        # Factor de tiempo (niveles más recientes son más fuertes)
        time_factor = 1.0
        if level.last_touch:
            time_diff = pd.Timestamp.now() - level.last_touch
            time_factor = max(0.5, 1.0 - (time_diff.days / 30.0))
        
        # Factor de volumen en los toques
        volume_factor = 1.0  # Implementar análisis de volumen si está disponible
        
        strength = (level.strength * 0.4 + 
                   (recent_touches / lookback) * 0.3 + 
                   time_factor * 0.2 + 
                   volume_factor * 0.1)
        
        return min(strength, 1.0)
    
    def get_trading_signals(self, df: pd.DataFrame) -> Dict[str, any]:
        """Genera señales de trading basadas en soportes y resistencias"""
        signals = {
            'breakout': False,
            'bounce': False,
            'level_break': None,
            'confidence': 0.0
        }
        
        if len(df) < 2:
            return signals
        
        current_price = df.iloc[-1]['close']
        prev_price = df.iloc[-2]['close']
        
        nearby_levels = self.get_current_levels(current_price, buffer=0.01)
        
        # Detectar breakouts
        for resistance in nearby_levels['resistance']:
            if (prev_price < resistance.price and 
                current_price > resistance.price and
                resistance.strength > 0.5):
                signals['breakout'] = True
                signals['level_break'] = resistance
                signals['confidence'] = resistance.strength
                break
        
        # Detectar bounces
        for support in nearby_levels['support']:
            if (prev_price > support.price and 
                current_price <= support.price * 1.001 and  # Tolerancia pequeña
                support.strength > 0.5):
                signals['bounce'] = True
                signals['level_break'] = support
                signals['confidence'] = support.strength
                break
        
        return signals

# Funciones de utilidad para el análisis
def calculate_atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    """Calcula Average True Range para volatilidad"""
    return talib.ATR(df['high'], df['low'], df['close'], timeperiod=period)

def calculate_volume_profile(df: pd.DataFrame, bins: int = 20) -> Dict:
    """Calcula perfil de volumen para identificar niveles importantes"""
    price_range = df['close'].max() - df['close'].min()
    bin_size = price_range / bins
    
    volume_profile = {}
    
    for i, row in df.iterrows():
        price_bin = int((row['close'] - df['close'].min()) / bin_size)
        if price_bin not in volume_profile:
            volume_profile[price_bin] = 0
        volume_profile[price_bin] += row.get('volume', 1)
    
    return volume_profile

def find_volume_clusters(df: pd.DataFrame, threshold: float = 0.7) -> List[Tuple[float, float]]:
    """Encuentra clusters de volumen alto (Value Area)"""
    volume_profile = calculate_volume_profile(df)
    
    if not volume_profile:
        return []
    
    max_volume = max(volume_profile.values())
    clusters = []
    
    for price_bin, volume in volume_profile.items():
        if volume >= max_volume * threshold:
            price_level = df['close'].min() + (price_bin * (df['close'].max() - df['close'].min()) / len(volume_profile))
            clusters.append((price_level, volume))
    
    return sorted(clusters, key=lambda x: x[1], reverse=True)




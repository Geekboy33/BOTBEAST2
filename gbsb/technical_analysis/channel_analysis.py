"""
Módulo de análisis de canales de tendencia
Implementa algoritmos para detectar y trazar canales de tendencia ascendente, descendente y lateral
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
import talib
from scipy import stats
from sklearn.linear_model import LinearRegression
import math

@dataclass
class TrendChannel:
    """Canal de tendencia detectado"""
    upper_line: Dict[str, float]  # {slope, intercept}
    lower_line: Dict[str, float]  # {slope, intercept}
    trend_type: str  # 'uptrend', 'downtrend', 'sideways'
    strength: float  # 0-1, qué tan fuerte es la tendencia
    confidence: float  # 0-1, confianza en la detección
    start_index: int
    end_index: int
    touches_upper: int
    touches_lower: int
    width: float  # Distancia entre líneas
    angle: float  # Ángulo del canal en grados

class ChannelAnalyzer:
    """Analizador de canales de tendencia"""
    
    def __init__(self, min_touches: int = 3, tolerance: float = 0.002):
        self.min_touches = min_touches
        self.tolerance = tolerance
        self.channels: List[TrendChannel] = []
    
    def detect_trend_channels(self, df: pd.DataFrame, lookback: int = 100) -> List[TrendChannel]:
        """Detecta canales de tendencia en los datos"""
        if len(df) < 50:
            return []
        
        channels = []
        
        # Analizar diferentes ventanas de tiempo
        for window_size in [50, 75, 100]:
            if len(df) >= window_size:
                window_channels = self._analyze_window(df.tail(window_size), window_size)
                channels.extend(window_channels)
        
        # Filtrar canales superpuestos y ordenar por fuerza
        channels = self._filter_overlapping_channels(channels)
        channels.sort(key=lambda x: x.strength * x.confidence, reverse=True)
        
        self.channels = channels
        return channels
    
    def _analyze_window(self, df: pd.DataFrame, window_size: int) -> List[TrendChannel]:
        """Analiza una ventana específica para detectar canales"""
        channels = []
        
        # Método 1: Regresión lineal en máximos y mínimos
        linear_channels = self._detect_linear_channels(df)
        channels.extend(linear_channels)
        
        # Método 2: Canales paralelos
        parallel_channels = self._detect_parallel_channels(df)
        channels.extend(parallel_channels)
        
        # Método 3: Canales basados en medias móviles
        ma_channels = self._detect_ma_channels(df)
        channels.extend(ma_channels)
        
        # Método 4: Canales de Andrews Pitchfork
        andrews_channels = self._detect_andrews_channels(df)
        channels.extend(andrews_channels)
        
        return channels
    
    def _detect_linear_channels(self, df: pd.DataFrame) -> List[TrendChannel]:
        """Detecta canales usando regresión lineal"""
        channels = []
        
        # Encontrar puntos pivote
        highs = self._find_pivot_highs(df)
        lows = self._find_pivot_lows(df)
        
        if len(highs) < 2 or len(lows) < 2:
            return channels
        
        # Regresión lineal en máximos
        if len(highs) >= 2:
            upper_slope, upper_intercept, upper_r2 = self._linear_regression(highs)
            
            # Regresión lineal en mínimos
            lower_slope, lower_intercept, lower_r2 = self._linear_regression(lows)
            
            # Verificar si las líneas son paralelas (misma pendiente)
            if abs(upper_slope - lower_slope) < 0.0001:  # Muy similar
                trend_type = self._classify_trend(upper_slope)
                
                # Calcular fuerza del canal
                touches_upper = self._count_touches(df, highs, upper_slope, upper_intercept)
                touches_lower = self._count_touches(df, lows, lower_slope, lower_intercept)
                
                if touches_upper >= self.min_touches and touches_lower >= self.min_touches:
                    strength = min((touches_upper + touches_lower) / 10.0, 1.0)
                    confidence = (upper_r2 + lower_r2) / 2.0
                    
                    channels.append(TrendChannel(
                        upper_line={'slope': upper_slope, 'intercept': upper_intercept},
                        lower_line={'slope': lower_slope, 'intercept': lower_intercept},
                        trend_type=trend_type,
                        strength=strength,
                        confidence=confidence,
                        start_index=0,
                        end_index=len(df) - 1,
                        touches_upper=touches_upper,
                        touches_lower=touches_lower,
                        width=self._calculate_channel_width(df, upper_slope, upper_intercept, lower_slope, lower_intercept),
                        angle=math.degrees(math.atan(upper_slope))
                    ))
        
        return channels
    
    def _detect_parallel_channels(self, df: pd.DataFrame) -> List[TrendChannel]:
        """Detecta canales paralelos usando técnicas avanzadas"""
        channels = []
        
        # Usar Bollinger Bands como base para canales paralelos
        bb_upper, bb_middle, bb_lower = talib.BBANDS(df['close'], timeperiod=20, nbdevup=2, nbdevdn=2)
        
        if not np.isnan(bb_upper).all():
            # Calcular pendiente de las bandas
            upper_slope = self._calculate_slope(bb_upper)
            lower_slope = self._calculate_slope(bb_lower)
            
            if abs(upper_slope - lower_slope) < 0.0001:
                trend_type = self._classify_trend(upper_slope)
                
                # Contar toques en las bandas
                touches_upper = self._count_bb_touches(df, bb_upper, tolerance=self.tolerance)
                touches_lower = self._count_bb_touches(df, bb_lower, tolerance=self.tolerance)
                
                if touches_upper >= 2 and touches_lower >= 2:
                    strength = min((touches_upper + touches_lower) / 8.0, 1.0)
                    
                    channels.append(TrendChannel(
                        upper_line={'slope': upper_slope, 'intercept': bb_upper[-1] - upper_slope * len(df)},
                        lower_line={'slope': lower_slope, 'intercept': bb_lower[-1] - lower_slope * len(df)},
                        trend_type=trend_type,
                        strength=strength,
                        confidence=0.7,  # BB tienen buena confianza
                        start_index=20,  # Después del período de cálculo
                        end_index=len(df) - 1,
                        touches_upper=touches_upper,
                        touches_lower=touches_lower,
                        width=np.mean(bb_upper - bb_lower),
                        angle=math.degrees(math.atan(upper_slope))
                    ))
        
        return channels
    
    def _detect_ma_channels(self, df: pd.DataFrame) -> List[TrendChannel]:
        """Detecta canales basados en medias móviles"""
        channels = []
        
        # Calcular múltiples medias móviles
        ma_20 = talib.SMA(df['close'], timeperiod=20)
        ma_50 = talib.SMA(df['close'], timeperiod=50)
        ma_200 = talib.SMA(df['close'], timeperiod=200)
        
        # Detectar tendencias basadas en posiciones de MA
        if not np.isnan(ma_20).all() and not np.isnan(ma_50).all():
            # Canal entre MA20 y MA50
            upper_slope = self._calculate_slope(ma_20)
            lower_slope = self._calculate_slope(ma_50)
            
            if abs(upper_slope - lower_slope) < 0.0001:
                trend_type = self._classify_trend(upper_slope)
                
                # Verificar si el precio respeta el canal
                touches = self._count_ma_touches(df, ma_20, ma_50)
                
                if touches >= 3:
                    strength = min(touches / 6.0, 1.0)
                    
                    channels.append(TrendChannel(
                        upper_line={'slope': upper_slope, 'intercept': ma_20[-1] - upper_slope * len(df)},
                        lower_line={'slope': lower_slope, 'intercept': ma_50[-1] - lower_slope * len(df)},
                        trend_type=trend_type,
                        strength=strength,
                        confidence=0.6,
                        start_index=50,
                        end_index=len(df) - 1,
                        touches_upper=touches,
                        touches_lower=touches,
                        width=np.mean(ma_20 - ma_50),
                        angle=math.degrees(math.atan(upper_slope))
                    ))
        
        return channels
    
    def _detect_andrews_channels(self, df: pd.DataFrame) -> List[TrendChannel]:
        """Detecta canales tipo Andrews Pitchfork"""
        channels = []
        
        # Buscar tres puntos pivote para el pitchfork
        highs = self._find_pivot_highs(df)
        lows = self._find_pivot_lows(df)
        
        if len(highs) >= 3:
            # Usar los tres máximos más recientes
            p1, p2, p3 = highs[-3:]
            
            # Calcular líneas del pitchfork
            # Línea media: desde p1 hasta p2
            mid_slope = (p2['price'] - p1['price']) / (p2['index'] - p1['index'])
            mid_intercept = p1['price'] - mid_slope * p1['index']
            
            # Líneas paralelas desde p3
            upper_slope = mid_slope
            lower_slope = mid_slope
            
            # Calcular distancia entre líneas
            distance = abs(p3['price'] - (mid_slope * p3['index'] + mid_intercept))
            
            upper_intercept = mid_intercept + distance
            lower_intercept = mid_intercept - distance
            
            # Verificar si el canal tiene sentido
            touches = self._count_pitchfork_touches(df, upper_slope, upper_intercept, mid_slope, mid_intercept, lower_slope, lower_intercept)
            
            if touches >= 3:
                trend_type = self._classify_trend(mid_slope)
                strength = min(touches / 8.0, 1.0)
                
                channels.append(TrendChannel(
                    upper_line={'slope': upper_slope, 'intercept': upper_intercept},
                    lower_line={'slope': lower_slope, 'intercept': lower_intercept},
                    trend_type=trend_type,
                    strength=strength,
                    confidence=0.7,
                    start_index=p1['index'],
                    end_index=len(df) - 1,
                    touches_upper=touches,
                    touches_lower=touches,
                    width=distance * 2,
                    angle=math.degrees(math.atan(mid_slope))
                ))
        
        return channels
    
    def _find_pivot_highs(self, df: pd.DataFrame) -> List[Dict]:
        """Encuentra puntos pivote altos"""
        highs = []
        
        for i in range(2, len(df) - 2):
            if (df.iloc[i]['high'] > df.iloc[i-1]['high'] and 
                df.iloc[i]['high'] > df.iloc[i-2]['high'] and
                df.iloc[i]['high'] > df.iloc[i+1]['high'] and 
                df.iloc[i]['high'] > df.iloc[i+2]['high']):
                highs.append({
                    'index': i,
                    'price': df.iloc[i]['high'],
                    'timestamp': df.index[i]
                })
        
        return highs
    
    def _find_pivot_lows(self, df: pd.DataFrame) -> List[Dict]:
        """Encuentra puntos pivote bajos"""
        lows = []
        
        for i in range(2, len(df) - 2):
            if (df.iloc[i]['low'] < df.iloc[i-1]['low'] and 
                df.iloc[i]['low'] < df.iloc[i-2]['low'] and
                df.iloc[i]['low'] < df.iloc[i+1]['low'] and 
                df.iloc[i]['low'] < df.iloc[i+2]['low']):
                lows.append({
                    'index': i,
                    'price': df.iloc[i]['low'],
                    'timestamp': df.index[i]
                })
        
        return lows
    
    def _linear_regression(self, points: List[Dict]) -> Tuple[float, float, float]:
        """Realiza regresión lineal y retorna slope, intercept, r2"""
        if len(points) < 2:
            return 0, 0, 0
        
        x = np.array([p['index'] for p in points])
        y = np.array([p['price'] for p in points])
        
        slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
        r2 = r_value ** 2
        
        return slope, intercept, r2
    
    def _calculate_slope(self, series: pd.Series) -> float:
        """Calcula la pendiente de una serie temporal"""
        if len(series) < 2 or series.isna().all():
            return 0
        
        # Usar regresión lineal simple
        x = np.arange(len(series))
        y = series.values
        
        # Filtrar NaN
        mask = ~np.isnan(y)
        if mask.sum() < 2:
            return 0
        
        x_clean = x[mask]
        y_clean = y[mask]
        
        slope, _, _, _, _ = stats.linregress(x_clean, y_clean)
        return slope
    
    def _classify_trend(self, slope: float) -> str:
        """Clasifica el tipo de tendencia basado en la pendiente"""
        if slope > 0.001:
            return 'uptrend'
        elif slope < -0.001:
            return 'downtrend'
        else:
            return 'sideways'
    
    def _count_touches(self, df: pd.DataFrame, points: List[Dict], slope: float, intercept: float) -> int:
        """Cuenta cuántas veces el precio toca una línea"""
        touches = 0
        
        for point in points:
            expected_price = slope * point['index'] + intercept
            actual_price = point['price']
            
            if abs(actual_price - expected_price) / actual_price <= self.tolerance:
                touches += 1
        
        return touches
    
    def _count_bb_touches(self, df: pd.DataFrame, bb_line: pd.Series, tolerance: float = 0.002) -> int:
        """Cuenta toques en las Bollinger Bands"""
        touches = 0
        
        for i in range(len(df)):
            if not np.isnan(bb_line.iloc[i]):
                price = df.iloc[i]['close']
                bb_price = bb_line.iloc[i]
                
                if abs(price - bb_price) / price <= tolerance:
                    touches += 1
        
        return touches
    
    def _count_ma_touches(self, df: pd.DataFrame, ma_upper: pd.Series, ma_lower: pd.Series) -> int:
        """Cuenta toques entre medias móviles"""
        touches = 0
        
        for i in range(len(df)):
            if not np.isnan(ma_upper.iloc[i]) and not np.isnan(ma_lower.iloc[i]):
                price = df.iloc[i]['close']
                
                # Verificar si el precio está cerca de alguna MA
                if (abs(price - ma_upper.iloc[i]) / price <= self.tolerance or
                    abs(price - ma_lower.iloc[i]) / price <= self.tolerance):
                    touches += 1
        
        return touches
    
    def _count_pitchfork_touches(self, df: pd.DataFrame, upper_slope: float, upper_intercept: float,
                                mid_slope: float, mid_intercept: float, lower_slope: float, lower_intercept: float) -> int:
        """Cuenta toques en un canal tipo pitchfork"""
        touches = 0
        
        for i in range(len(df)):
            price = df.iloc[i]['close']
            
            # Calcular precios esperados en cada línea
            upper_price = upper_slope * i + upper_intercept
            mid_price = mid_slope * i + mid_intercept
            lower_price = lower_slope * i + lower_intercept
            
            # Verificar si el precio toca alguna línea
            if (abs(price - upper_price) / price <= self.tolerance or
                abs(price - mid_price) / price <= self.tolerance or
                abs(price - lower_price) / price <= self.tolerance):
                touches += 1
        
        return touches
    
    def _calculate_channel_width(self, df: pd.DataFrame, upper_slope: float, upper_intercept: float,
                               lower_slope: float, lower_intercept: float) -> float:
        """Calcula el ancho promedio del canal"""
        widths = []
        
        for i in range(len(df)):
            upper_price = upper_slope * i + upper_intercept
            lower_price = lower_slope * i + lower_intercept
            width = abs(upper_price - lower_price)
            widths.append(width)
        
        return np.mean(widths)
    
    def _filter_overlapping_channels(self, channels: List[TrendChannel]) -> List[TrendChannel]:
        """Filtra canales superpuestos, manteniendo los más fuertes"""
        if not channels:
            return []
        
        # Ordenar por fuerza
        channels.sort(key=lambda x: x.strength * x.confidence, reverse=True)
        
        filtered_channels = [channels[0]]
        
        for channel in channels[1:]:
            is_overlapping = False
            
            for existing_channel in filtered_channels:
                if self._channels_overlap(channel, existing_channel):
                    is_overlapping = True
                    break
            
            if not is_overlapping:
                filtered_channels.append(channel)
        
        return filtered_channels
    
    def _channels_overlap(self, channel1: TrendChannel, channel2: TrendChannel) -> bool:
        """Verifica si dos canales se superponen significativamente"""
        # Calcular intersección de rangos de tiempo
        start_overlap = max(channel1.start_index, channel2.start_index)
        end_overlap = min(channel1.end_index, channel2.end_index)
        
        if start_overlap >= end_overlap:
            return False
        
        # Verificar si las líneas se superponen en el rango de tiempo
        overlap_ratio = (end_overlap - start_overlap) / max(channel1.end_index - channel1.start_index,
                                                           channel2.end_index - channel2.start_index)
        
        return overlap_ratio > 0.7  # 70% de superposición
    
    def get_current_channel(self, df: pd.DataFrame) -> Optional[TrendChannel]:
        """Obtiene el canal más relevante para el momento actual"""
        if not self.channels:
            return None
        
        # Filtrar canales que incluyen el momento actual
        current_channels = [ch for ch in self.channels if ch.end_index >= len(df) - 5]
        
        if not current_channels:
            return None
        
        # Retornar el canal más fuerte y reciente
        return max(current_channels, key=lambda x: x.strength * x.confidence)
    
    def get_trading_signals(self, df: pd.DataFrame) -> Dict[str, any]:
        """Genera señales de trading basadas en canales"""
        signals = {
            'channel_breakout': False,
            'channel_bounce': False,
            'trend_continuation': False,
            'channel_type': None,
            'confidence': 0.0
        }
        
        current_channel = self.get_current_channel(df)
        if not current_channel:
            return signals
        
        if len(df) < 2:
            return signals
        
        current_price = df.iloc[-1]['close']
        prev_price = df.iloc[-2]['close']
        
        # Calcular precios de las líneas del canal
        upper_price = current_channel.upper_line['slope'] * (len(df) - 1) + current_channel.upper_line['intercept']
        lower_price = current_channel.lower_line['slope'] * (len(df) - 1) + current_channel.lower_line['intercept']
        
        # Detectar breakout
        if (prev_price <= upper_price and current_price > upper_price and
            current_channel.trend_type == 'uptrend'):
            signals['channel_breakout'] = True
            signals['channel_type'] = current_channel.trend_type
            signals['confidence'] = current_channel.confidence
        
        # Detectar bounce
        if (prev_price >= lower_price and current_price <= lower_price * 1.001):
            signals['channel_bounce'] = True
            signals['channel_type'] = current_channel.trend_type
            signals['confidence'] = current_channel.confidence
        
        # Detectar continuación de tendencia
        if (current_channel.trend_type == 'uptrend' and 
            lower_price < current_price < upper_price and
            current_price > prev_price):
            signals['trend_continuation'] = True
            signals['channel_type'] = current_channel.trend_type
            signals['confidence'] = current_channel.confidence * 0.8
        
        return signals




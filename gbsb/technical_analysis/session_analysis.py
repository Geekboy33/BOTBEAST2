"""
Módulo de análisis de sesiones de trading
Implementa análisis de sesiones asiática, europea y americana
Incluye detección de volúmenes, volatilidad y patrones por sesión
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime, time, timedelta
import pytz

@dataclass
class TradingSession:
    """Sesión de trading"""
    name: str
    start_hour: int
    end_hour: int
    timezone: str
    volume_weight: float
    volatility_weight: float
    strength: float  # 0-1

@dataclass
class SessionMetrics:
    """Métricas de una sesión"""
    session_name: str
    timestamp: pd.Timestamp
    volume: float
    volatility: float
    price_change: float
    high: float
    low: float
    open: float
    close: float
    spread: float
    tick_count: int
    strength: float

@dataclass
class SessionOverlap:
    """Superposición de sesiones"""
    sessions: List[str]
    start_time: time
    end_time: time
    strength: float
    volume_multiplier: float

class SessionAnalyzer:
    """Analizador de sesiones de trading"""
    
    def __init__(self):
        # Definir sesiones de trading (horarios UTC)
        self.sessions = {
            'asian': TradingSession(
                name='Asian',
                start_hour=0,  # 00:00 UTC
                end_hour=8,    # 08:00 UTC
                timezone='Asia/Tokyo',
                volume_weight=0.3,
                volatility_weight=0.2,
                strength=0.7
            ),
            'european': TradingSession(
                name='European',
                start_hour=7,  # 07:00 UTC
                end_hour=15,   # 15:00 UTC
                timezone='Europe/London',
                volume_weight=0.4,
                volatility_weight=0.4,
                strength=0.8
            ),
            'american': TradingSession(
                name='American',
                start_hour=13, # 13:00 UTC
                end_hour=21,   # 21:00 UTC
                timezone='America/New_York',
                volume_weight=0.5,
                volatility_weight=0.6,
                strength=0.9
            )
        }
        
        # Definir superposiciones de sesiones
        self.overlaps = {
            'asian_european': SessionOverlap(
                sessions=['asian', 'european'],
                start_time=time(7, 0),
                end_time=time(8, 0),
                strength=0.8,
                volume_multiplier=1.5
            ),
            'european_american': SessionOverlap(
                sessions=['european', 'american'],
                start_time=time(13, 0),
                end_time=time(15, 0),
                strength=1.0,
                volume_multiplier=2.0
            )
        }
        
        self.session_metrics: List[SessionMetrics] = []
    
    def analyze_trading_sessions(self, df: pd.DataFrame) -> Dict[str, any]:
        """Analiza todas las sesiones de trading en los datos"""
        analysis = {
            'session_metrics': self.calculate_session_metrics(df),
            'session_strength': self.calculate_session_strength(df),
            'volume_analysis': self.analyze_session_volumes(df),
            'volatility_analysis': self.analyze_session_volatility(df),
            'overlap_analysis': self.analyze_session_overlaps(df),
            'best_entry_times': self.find_best_entry_times(df),
            'session_patterns': self.detect_session_patterns(df)
        }
        
        return analysis
    
    def calculate_session_metrics(self, df: pd.DataFrame) -> Dict[str, List[SessionMetrics]]:
        """Calcula métricas para cada sesión"""
        session_data = {session: [] for session in self.sessions.keys()}
        
        if len(df) < 24:  # Necesitamos al menos 24 horas
            return session_data
        
        # Agrupar datos por sesión
        for session_name, session in self.sessions.items():
            session_hours = self._get_session_hours(session_name)
            
            for hour_range in session_hours:
                session_df = self._filter_by_hours(df, hour_range[0], hour_range[1])
                
                if len(session_df) > 0:
                    metrics = self._calculate_session_metrics(session_df, session_name)
                    session_data[session_name].append(metrics)
        
        self.session_metrics = []
        for session_list in session_data.values():
            self.session_metrics.extend(session_list)
        
        return session_data
    
    def calculate_session_strength(self, df: pd.DataFrame) -> Dict[str, float]:
        """Calcula la fuerza relativa de cada sesión"""
        session_strength = {}
        
        for session_name in self.sessions.keys():
            session_hours = self._get_session_hours(session_name)
            total_volume = 0
            total_volatility = 0
            total_price_change = 0
            session_count = 0
            
            for hour_range in session_hours:
                session_df = self._filter_by_hours(df, hour_range[0], hour_range[1])
                
                if len(session_df) > 0:
                    # Calcular métricas de la sesión
                    volume = session_df.get('volume', pd.Series([1] * len(session_df))).sum()
                    volatility = self._calculate_volatility(session_df)
                    price_change = abs(session_df.iloc[-1]['close'] - session_df.iloc[0]['open']) / session_df.iloc[0]['open']
                    
                    total_volume += volume
                    total_volatility += volatility
                    total_price_change += price_change
                    session_count += 1
            
            if session_count > 0:
                # Normalizar métricas
                avg_volume = total_volume / session_count
                avg_volatility = total_volatility / session_count
                avg_price_change = total_price_change / session_count
                
                # Calcular fuerza combinada
                strength = (
                    avg_volume * self.sessions[session_name].volume_weight +
                    avg_volatility * self.sessions[session_name].volatility_weight +
                    avg_price_change * 0.3
                )
                
                session_strength[session_name] = min(strength, 1.0)
            else:
                session_strength[session_name] = 0.0
        
        return session_strength
    
    def analyze_session_volumes(self, df: pd.DataFrame) -> Dict[str, any]:
        """Analiza volúmenes por sesión"""
        volume_analysis = {
            'session_volumes': {},
            'volume_trends': {},
            'peak_volume_hours': {},
            'volume_ratios': {}
        }
        
        for session_name in self.sessions.keys():
            session_hours = self._get_session_hours(session_name)
            session_volumes = []
            
            for hour_range in session_hours:
                session_df = self._filter_by_hours(df, hour_range[0], hour_range[1])
                
                if len(session_df) > 0:
                    volume = session_df.get('volume', pd.Series([1] * len(session_df))).sum()
                    session_volumes.append(volume)
            
            if session_volumes:
                volume_analysis['session_volumes'][session_name] = {
                    'total': sum(session_volumes),
                    'average': np.mean(session_volumes),
                    'max': max(session_volumes),
                    'min': min(session_volumes),
                    'std': np.std(session_volumes)
                }
                
                # Analizar tendencias de volumen
                if len(session_volumes) > 1:
                    trend = self._calculate_volume_trend(session_volumes)
                    volume_analysis['volume_trends'][session_name] = trend
        
        # Calcular ratios entre sesiones
        if len(volume_analysis['session_volumes']) > 1:
            volumes = volume_analysis['session_volumes']
            total_avg_volume = sum(v['average'] for v in volumes.values())
            
            for session_name, volume_data in volumes.items():
                volume_analysis['volume_ratios'][session_name] = volume_data['average'] / total_avg_volume
        
        return volume_analysis
    
    def analyze_session_volatility(self, df: pd.DataFrame) -> Dict[str, any]:
        """Analiza volatilidad por sesión"""
        volatility_analysis = {
            'session_volatility': {},
            'volatility_patterns': {},
            'high_volatility_periods': {},
            'volatility_correlations': {}
        }
        
        for session_name in self.sessions.keys():
            session_hours = self._get_session_hours(session_name)
            session_volatilities = []
            
            for hour_range in session_hours:
                session_df = self._filter_by_hours(df, hour_range[0], hour_range[1])
                
                if len(session_df) > 0:
                    volatility = self._calculate_volatility(session_df)
                    session_volatilities.append(volatility)
            
            if session_volatilities:
                volatility_analysis['session_volatility'][session_name] = {
                    'average': np.mean(session_volatilities),
                    'max': max(session_volatilities),
                    'min': min(session_volatilities),
                    'std': np.std(session_volatilities)
                }
                
                # Identificar períodos de alta volatilidad
                avg_vol = np.mean(session_volatilities)
                high_vol_threshold = avg_vol * 1.5
                
                high_vol_periods = [i for i, vol in enumerate(session_volatilities) if vol > high_vol_threshold]
                volatility_analysis['high_volatility_periods'][session_name] = high_vol_periods
        
        return volatility_analysis
    
    def analyze_session_overlaps(self, df: pd.DataFrame) -> Dict[str, any]:
        """Analiza las superposiciones de sesiones"""
        overlap_analysis = {
            'overlap_performance': {},
            'overlap_volume': {},
            'overlap_volatility': {},
            'best_overlap_times': []
        }
        
        for overlap_name, overlap in self.overlaps.items():
            overlap_hours = self._get_overlap_hours(overlap)
            overlap_data = []
            
            for hour_range in overlap_hours:
                overlap_df = self._filter_by_hours(df, hour_range[0], hour_range[1])
                
                if len(overlap_df) > 0:
                    volume = overlap_df.get('volume', pd.Series([1] * len(overlap_df))).sum()
                    volatility = self._calculate_volatility(overlap_df)
                    price_change = abs(overlap_df.iloc[-1]['close'] - overlap_df.iloc[0]['open']) / overlap_df.iloc[0]['open']
                    
                    overlap_data.append({
                        'volume': volume,
                        'volatility': volatility,
                        'price_change': price_change
                    })
            
            if overlap_data:
                avg_volume = np.mean([d['volume'] for d in overlap_data])
                avg_volatility = np.mean([d['volatility'] for d in overlap_data])
                avg_price_change = np.mean([d['price_change'] for d in overlap_data])
                
                overlap_analysis['overlap_performance'][overlap_name] = {
                    'volume': avg_volume,
                    'volatility': avg_volatility,
                    'price_change': avg_price_change,
                    'strength': overlap.strength
                }
                
                # Verificar si es un buen momento para trading
                if (avg_volume > np.mean([d['volume'] for d in overlap_data]) * 1.2 and
                    avg_volatility > 0.01 and avg_price_change > 0.005):
                    overlap_analysis['best_overlap_times'].append({
                        'overlap': overlap_name,
                        'strength': overlap.strength,
                        'volume_multiplier': overlap.volume_multiplier
                    })
        
        return overlap_analysis
    
    def find_best_entry_times(self, df: pd.DataFrame) -> Dict[str, any]:
        """Encuentra los mejores momentos para entrar al mercado"""
        best_times = {
            'high_volume_hours': [],
            'high_volatility_hours': [],
            'session_openings': [],
            'session_closings': [],
            'overlap_periods': [],
            'recommended_times': []
        }
        
        # Analizar cada hora del día
        hourly_stats = {}
        
        for hour in range(24):
            hour_df = self._filter_by_hours(df, hour, hour)
            
            if len(hour_df) > 0:
                volume = hour_df.get('volume', pd.Series([1] * len(hour_df))).sum()
                volatility = self._calculate_volatility(hour_df)
                price_change = abs(hour_df.iloc[-1]['close'] - hour_df.iloc[0]['open']) / hour_df.iloc[0]['open']
                
                hourly_stats[hour] = {
                    'volume': volume,
                    'volatility': volatility,
                    'price_change': price_change,
                    'session': self._get_session_for_hour(hour)
                }
        
        if hourly_stats:
            # Encontrar horas con mayor volumen
            sorted_by_volume = sorted(hourly_stats.items(), key=lambda x: x[1]['volume'], reverse=True)
            best_times['high_volume_hours'] = [{'hour': h, 'volume': stats['volume']} 
                                              for h, stats in sorted_by_volume[:5]]
            
            # Encontrar horas con mayor volatilidad
            sorted_by_volatility = sorted(hourly_stats.items(), key=lambda x: x[1]['volatility'], reverse=True)
            best_times['high_volatility_hours'] = [{'hour': h, 'volatility': stats['volatility']} 
                                                  for h, stats in sorted_by_volatility[:5]]
            
            # Identificar aperturas y cierres de sesiones
            for session_name, session in self.sessions.items():
                # Apertura de sesión
                opening_hour = session.start_hour
                if opening_hour in hourly_stats:
                    best_times['session_openings'].append({
                        'session': session_name,
                        'hour': opening_hour,
                        'volume': hourly_stats[opening_hour]['volume'],
                        'volatility': hourly_stats[opening_hour]['volatility']
                    })
                
                # Cierre de sesión
                closing_hour = session.end_hour - 1
                if closing_hour in hourly_stats:
                    best_times['session_closings'].append({
                        'session': session_name,
                        'hour': closing_hour,
                        'volume': hourly_stats[closing_hour]['volume'],
                        'volatility': hourly_stats[closing_hour]['volatility']
                    })
            
            # Recomendar mejores momentos
            recommended_times = []
            for hour, stats in hourly_stats.items():
                score = (stats['volume'] * 0.4 + stats['volatility'] * 0.4 + stats['price_change'] * 0.2)
                
                if score > np.mean([s['volume'] * 0.4 + s['volatility'] * 0.4 + s['price_change'] * 0.2 
                                  for s in hourly_stats.values()]) * 1.5:
                    recommended_times.append({
                        'hour': hour,
                        'score': score,
                        'session': stats['session'],
                        'volume': stats['volume'],
                        'volatility': stats['volatility']
                    })
            
            best_times['recommended_times'] = sorted(recommended_times, key=lambda x: x['score'], reverse=True)
        
        return best_times
    
    def detect_session_patterns(self, df: pd.DataFrame) -> Dict[str, any]:
        """Detecta patrones específicos de cada sesión"""
        patterns = {
            'asian_range_bound': [],
            'european_breakouts': [],
            'american_trends': [],
            'session_reversals': [],
            'volume_spikes': [],
            'volatility_clusters': []
        }
        
        for session_name, session in self.sessions.items():
            session_hours = self._get_session_hours(session_name)
            
            for hour_range in session_hours:
                session_df = self._filter_by_hours(df, hour_range[0], hour_range[1])
                
                if len(session_df) > 5:
                    # Detectar patrones específicos por sesión
                    if session_name == 'asian':
                        range_pattern = self._detect_range_bound_pattern(session_df)
                        if range_pattern:
                            patterns['asian_range_bound'].append(range_pattern)
                    
                    elif session_name == 'european':
                        breakout_pattern = self._detect_breakout_pattern(session_df)
                        if breakout_pattern:
                            patterns['european_breakouts'].append(breakout_pattern)
                    
                    elif session_name == 'american':
                        trend_pattern = self._detect_trend_pattern(session_df)
                        if trend_pattern:
                            patterns['american_trends'].append(trend_pattern)
                    
                    # Detectar reversiones de sesión
                    reversal = self._detect_session_reversal(session_df)
                    if reversal:
                        patterns['session_reversals'].append(reversal)
                    
                    # Detectar spikes de volumen
                    volume_spike = self._detect_volume_spike(session_df)
                    if volume_spike:
                        patterns['volume_spikes'].append(volume_spike)
                    
                    # Detectar clusters de volatilidad
                    volatility_cluster = self._detect_volatility_cluster(session_df)
                    if volatility_cluster:
                        patterns['volatility_clusters'].append(volatility_cluster)
        
        return patterns
    
    def get_current_session_info(self, timestamp: pd.Timestamp = None) -> Dict[str, any]:
        """Obtiene información sobre la sesión actual"""
        if timestamp is None:
            timestamp = pd.Timestamp.now(tz='UTC')
        
        current_hour = timestamp.hour
        
        # Determinar sesión actual
        current_session = None
        for session_name, session in self.sessions.items():
            if session.start_hour <= current_hour < session.end_hour:
                current_session = session_name
                break
        
        # Verificar superposiciones
        current_overlaps = []
        for overlap_name, overlap in self.overlaps.items():
            if overlap.start_time.hour <= current_hour < overlap.end_time.hour:
                current_overlaps.append(overlap_name)
        
        # Calcular tiempo hasta próxima sesión
        next_session_time = self._get_next_session_time(current_hour)
        
        return {
            'current_session': current_session,
            'current_hour': current_hour,
            'session_progress': self._calculate_session_progress(current_hour, current_session),
            'overlaps': current_overlaps,
            'next_session': next_session_time['session'],
            'time_to_next': next_session_time['hours'],
            'is_high_activity_time': self._is_high_activity_time(current_hour),
            'recommended_action': self._get_recommended_action(current_session, current_overlaps)
        }
    
    def get_session_trading_signals(self, df: pd.DataFrame) -> Dict[str, any]:
        """Genera señales de trading basadas en análisis de sesiones"""
        signals = {
            'session_based_entry': False,
            'overlap_entry': False,
            'session_breakout': False,
            'session_reversal': False,
            'confidence': 0.0,
            'recommended_session': None,
            'entry_reason': None
        }
        
        if len(df) < 24:
            return signals
        
        current_session_info = self.get_current_session_info()
        session_analysis = self.analyze_trading_sessions(df)
        
        # Verificar si estamos en un período de alta actividad
        if current_session_info['is_high_activity_time']:
            signals['session_based_entry'] = True
            signals['confidence'] = 0.7
            signals['recommended_session'] = current_session_info['current_session']
            signals['entry_reason'] = 'high_activity_period'
        
        # Verificar superposiciones de sesiones
        if current_session_info['overlaps']:
            signals['overlap_entry'] = True
            signals['confidence'] = 0.8
            signals['entry_reason'] = f"session_overlap_{current_session_info['overlaps'][0]}"
        
        # Verificar breakouts de sesión
        best_times = session_analysis['best_entry_times']
        current_hour = current_session_info['current_hour']
        
        for recommended_time in best_times['recommended_times'][:3]:
            if abs(recommended_time['hour'] - current_hour) <= 1:
                signals['session_breakout'] = True
                signals['confidence'] = max(signals['confidence'], recommended_time['score'])
                signals['entry_reason'] = 'optimal_session_time'
                break
        
        # Verificar reversiones de sesión
        patterns = session_analysis['session_patterns']
        if patterns['session_reversals']:
            recent_reversals = [r for r in patterns['session_reversals'] 
                              if (pd.Timestamp.now() - r['timestamp']).total_seconds() < 3600]
            if recent_reversals:
                signals['session_reversal'] = True
                signals['confidence'] = 0.6
                signals['entry_reason'] = 'session_reversal_detected'
        
        return signals
    
    # Métodos auxiliares
    
    def _get_session_hours(self, session_name: str) -> List[Tuple[int, int]]:
        """Obtiene las horas de una sesión"""
        session = self.sessions[session_name]
        
        # Manejar sesiones que cruzan medianoche
        if session.start_hour < session.end_hour:
            return [(session.start_hour, session.end_hour)]
        else:
            # Sesión que cruza medianoche (ej: 22:00 - 06:00)
            return [(session.start_hour, 24), (0, session.end_hour)]
    
    def _get_overlap_hours(self, overlap: SessionOverlap) -> List[Tuple[int, int]]:
        """Obtiene las horas de una superposición"""
        return [(overlap.start_time.hour, overlap.end_time.hour)]
    
    def _filter_by_hours(self, df: pd.DataFrame, start_hour: int, end_hour: int) -> pd.DataFrame:
        """Filtra datos por rango de horas"""
        if 'timestamp' in df.columns:
            df = df.set_index('timestamp')
        
        # Convertir índices a UTC si no lo están
        if df.index.tz is None:
            df.index = df.index.tz_localize('UTC')
        
        # Filtrar por horas
        if start_hour < end_hour:
            return df[(df.index.hour >= start_hour) & (df.index.hour < end_hour)]
        else:
            # Manejar cruce de medianoche
            return df[(df.index.hour >= start_hour) | (df.index.hour < end_hour)]
    
    def _calculate_volatility(self, df: pd.DataFrame) -> float:
        """Calcula la volatilidad de un período"""
        if len(df) < 2:
            return 0
        
        returns = df['close'].pct_change().dropna()
        return returns.std() if len(returns) > 0 else 0
    
    def _calculate_volume_trend(self, volumes: List[float]) -> str:
        """Calcula la tendencia del volumen"""
        if len(volumes) < 2:
            return 'stable'
        
        # Calcular pendiente de regresión lineal simple
        x = np.arange(len(volumes))
        y = np.array(volumes)
        
        slope = np.polyfit(x, y, 1)[0]
        
        if slope > 0.1:
            return 'increasing'
        elif slope < -0.1:
            return 'decreasing'
        else:
            return 'stable'
    
    def _get_session_for_hour(self, hour: int) -> Optional[str]:
        """Obtiene la sesión para una hora específica"""
        for session_name, session in self.sessions.items():
            if session.start_hour <= hour < session.end_hour:
                return session_name
        return None
    
    def _calculate_session_progress(self, current_hour: int, current_session: Optional[str]) -> float:
        """Calcula el progreso de la sesión actual (0-1)"""
        if not current_session:
            return 0
        
        session = self.sessions[current_session]
        session_duration = session.end_hour - session.start_hour
        current_progress = (current_hour - session.start_hour) / session_duration
        
        return max(0, min(1, current_progress))
    
    def _get_next_session_time(self, current_hour: int) -> Dict[str, any]:
        """Obtiene información sobre la próxima sesión"""
        session_order = ['asian', 'european', 'american']
        
        # Encontrar próxima sesión
        for session_name in session_order:
            session = self.sessions[session_name]
            if session.start_hour > current_hour:
                hours_to_next = session.start_hour - current_hour
                return {'session': session_name, 'hours': hours_to_next}
        
        # Si no hay más sesiones hoy, la próxima es la primera de mañana
        next_session = session_order[0]
        hours_to_next = 24 - current_hour + self.sessions[next_session].start_hour
        
        return {'session': next_session, 'hours': hours_to_next}
    
    def _is_high_activity_time(self, hour: int) -> bool:
        """Determina si es un momento de alta actividad"""
        # Horas de mayor actividad (basado en superposiciones y aperturas)
        high_activity_hours = [7, 8, 13, 14, 15]  # Superposiciones y aperturas principales
        return hour in high_activity_hours
    
    def _get_recommended_action(self, current_session: Optional[str], overlaps: List[str]) -> str:
        """Obtiene la acción recomendada basada en la sesión actual"""
        if overlaps:
            return 'trade_aggressively'
        elif current_session == 'american':
            return 'trend_following'
        elif current_session == 'european':
            return 'breakout_trading'
        elif current_session == 'asian':
            return 'range_trading'
        else:
            return 'wait'
    
    def _calculate_session_metrics(self, session_df: pd.DataFrame, session_name: str) -> SessionMetrics:
        """Calcula métricas para una sesión específica"""
        volume = session_df.get('volume', pd.Series([1] * len(session_df))).sum()
        volatility = self._calculate_volatility(session_df)
        price_change = (session_df.iloc[-1]['close'] - session_df.iloc[0]['open']) / session_df.iloc[0]['open']
        
        return SessionMetrics(
            session_name=session_name,
            timestamp=session_df.index[0],
            volume=volume,
            volatility=volatility,
            price_change=price_change,
            high=session_df['high'].max(),
            low=session_df['low'].min(),
            open=session_df.iloc[0]['open'],
            close=session_df.iloc[-1]['close'],
            spread=session_df['high'].max() - session_df['low'].min(),
            tick_count=len(session_df),
            strength=0.5  # Valor base, se calcularía basado en métricas
        )
    
    # Métodos de detección de patrones
    
    def _detect_range_bound_pattern(self, df: pd.DataFrame) -> Optional[Dict]:
        """Detecta patrón de rango lateral"""
        if len(df) < 10:
            return None
        
        high = df['high'].max()
        low = df['low'].min()
        range_size = (high - low) / df.iloc[0]['close']
        
        # Verificar si está en rango (volatilidad baja)
        if range_size < 0.02:  # Rango menor al 2%
            return {
                'type': 'range_bound',
                'high': high,
                'low': low,
                'range_size': range_size,
                'timestamp': df.index[-1],
                'strength': 1.0 - range_size * 50  # Más fuerte si el rango es más pequeño
            }
        
        return None
    
    def _detect_breakout_pattern(self, df: pd.DataFrame) -> Optional[Dict]:
        """Detecta patrón de breakout"""
        if len(df) < 5:
            return None
        
        # Verificar si hay un breakout significativo
        first_half = df.iloc[:len(df)//2]
        second_half = df.iloc[len(df)//2:]
        
        first_range = first_half['high'].max() - first_half['low'].min()
        second_range = second_half['high'].max() - second_half['low'].min()
        
        if second_range > first_range * 1.5:  # Aumento significativo en el rango
            direction = 'bullish' if second_half['close'].iloc[-1] > first_half['close'].iloc[-1] else 'bearish'
            
            return {
                'type': 'breakout',
                'direction': direction,
                'breakout_price': second_half['high'].max() if direction == 'bullish' else second_half['low'].min(),
                'volume': second_half.get('volume', pd.Series([1] * len(second_half))).sum(),
                'timestamp': df.index[-1],
                'strength': min(second_range / first_range, 2.0) / 2.0
            }
        
        return None
    
    def _detect_trend_pattern(self, df: pd.DataFrame) -> Optional[Dict]:
        """Detecta patrón de tendencia"""
        if len(df) < 5:
            return None
        
        # Calcular pendiente de la tendencia
        x = np.arange(len(df))
        y = df['close'].values
        
        slope = np.polyfit(x, y, 1)[0]
        slope_normalized = slope / df.iloc[0]['close']  # Normalizar por precio inicial
        
        if abs(slope_normalized) > 0.01:  # Tendencia significativa (>1%)
            direction = 'bullish' if slope > 0 else 'bearish'
            
            return {
                'type': 'trend',
                'direction': direction,
                'slope': slope_normalized,
                'start_price': df.iloc[0]['close'],
                'end_price': df.iloc[-1]['close'],
                'timestamp': df.index[-1],
                'strength': min(abs(slope_normalized) * 100, 1.0)
            }
        
        return None
    
    def _detect_session_reversal(self, df: pd.DataFrame) -> Optional[Dict]:
        """Detecta reversión de sesión"""
        if len(df) < 10:
            return None
        
        # Dividir la sesión en tercios
        third = len(df) // 3
        first_third = df.iloc[:third]
        middle_third = df.iloc[third:2*third]
        last_third = df.iloc[2*third:]
        
        first_trend = (first_third.iloc[-1]['close'] - first_third.iloc[0]['open']) / first_third.iloc[0]['open']
        last_trend = (last_third.iloc[-1]['close'] - last_third.iloc[0]['open']) / last_third.iloc[0]['open']
        
        # Verificar si hay reversión (tendencias opuestas)
        if first_trend * last_trend < -0.005:  # Reversión del 0.5%
            return {
                'type': 'session_reversal',
                'first_trend': first_trend,
                'last_trend': last_trend,
                'reversal_point': middle_third.iloc[-1]['close'],
                'timestamp': df.index[-1],
                'strength': abs(first_trend - last_trend)
            }
        
        return None
    
    def _detect_volume_spike(self, df: pd.DataFrame) -> Optional[Dict]:
        """Detecta spike de volumen"""
        if 'volume' not in df.columns or len(df) < 5:
            return None
        
        avg_volume = df['volume'].mean()
        max_volume = df['volume'].max()
        
        if max_volume > avg_volume * 2:  # Spike de 2x el volumen promedio
            spike_index = df['volume'].idxmax()
            
            return {
                'type': 'volume_spike',
                'volume': max_volume,
                'avg_volume': avg_volume,
                'spike_ratio': max_volume / avg_volume,
                'timestamp': spike_index,
                'strength': min(spike_index / avg_volume, 3.0) / 3.0
            }
        
        return None
    
    def _detect_volatility_cluster(self, df: pd.DataFrame) -> Optional[Dict]:
        """Detecta cluster de volatilidad"""
        if len(df) < 10:
            return None
        
        # Calcular volatilidad en ventanas deslizantes
        window_size = 5
        volatilities = []
        
        for i in range(len(df) - window_size + 1):
            window = df.iloc[i:i+window_size]
            vol = self._calculate_volatility(window)
            volatilities.append(vol)
        
        if len(volatilities) > 0:
            avg_vol = np.mean(volatilities)
            high_vol_count = sum(1 for vol in volatilities if vol > avg_vol * 1.5)
            
            if high_vol_count >= len(volatilities) * 0.6:  # 60% de períodos con alta volatilidad
                return {
                    'type': 'volatility_cluster',
                    'avg_volatility': avg_vol,
                    'high_vol_periods': high_vol_count,
                    'total_periods': len(volatilities),
                    'timestamp': df.index[-1],
                    'strength': high_vol_count / len(volatilities)
                }
        
        return None




"""
Módulo de escáner de pares de trading
Escanea todos los pares spot y futuros de exchanges conectados
Identifica oportunidades rápidas con todas las estrategias
"""

import asyncio
import logging
from typing import List, Dict, Optional, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import pandas as pd
import numpy as np
from concurrent.futures import ThreadPoolExecutor, as_completed

# Importar analizadores técnicos
from ..technical_analysis.support_resistance import SupportResistanceAnalyzer
from ..technical_analysis.channel_analysis import ChannelAnalyzer
from ..technical_analysis.ict_analysis import ICTAnalyzer
from ..technical_analysis.fibonacci_analysis import FibonacciAnalyzer
from ..technical_analysis.session_analysis import SessionAnalyzer
from ..technical_analysis.spread_analysis import SpreadAnalyzer

# Importar gestor de exchanges
from ..exchanges.multi_exchange_manager import MultiExchangeManager, ExchangeConfig

class MarketType(Enum):
    """Tipo de mercado"""
    SPOT = "spot"
    FUTURES = "futures"
    MARGIN = "margin"

class Timeframe(Enum):
    """Timeframes disponibles"""
    M1 = "1m"
    M5 = "5m"
    M15 = "15m"
    M30 = "30m"
    H1 = "1h"
    H4 = "4h"
    D1 = "1d"

@dataclass
class PairInfo:
    """Información de un par de trading"""
    symbol: str
    exchange: str
    market_type: MarketType
    base_currency: str
    quote_currency: str
    price: float
    volume_24h: float
    volume_change_24h: float
    price_change_24h: float
    market_cap: Optional[float] = None
    available_margin: bool = False
    max_leverage: int = 1
    min_order_size: float = 0.001
    tick_size: float = 0.01

@dataclass
class QuickOpportunity:
    """Oportunidad de trading rápida"""
    pair: PairInfo
    timeframe: Timeframe
    strategy: str
    signal: str  # 'buy', 'sell', 'strong_buy', 'strong_sell'
    confidence: float  # 0-1
    entry_price: float
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    risk_reward_ratio: float = 1.0
    time_to_expire: timedelta = timedelta(minutes=30)
    reasoning: str = ""
    technical_score: float = 0.0
    volume_score: float = 0.0
    volatility_score: float = 0.0
    overall_score: float = 0.0

@dataclass
class ScanConfig:
    """Configuración del escáner"""
    enabled_exchanges: List[str] = field(default_factory=lambda: ['binance', 'kraken', 'kucoin', 'okx'])
    enabled_markets: List[MarketType] = field(default_factory=lambda: [MarketType.SPOT, MarketType.FUTURES])
    enabled_timeframes: List[Timeframe] = field(default_factory=lambda: [Timeframe.M5, Timeframe.M15, Timeframe.H1])
    min_volume_24h: float = 1000000  # Mínimo $1M de volumen
    min_price_change_24h: float = 0.01  # Mínimo 1% de cambio
    max_spread_percentage: float = 0.005  # Máximo 0.5% de spread
    min_confidence_threshold: float = 0.6
    max_pairs_per_exchange: int = 100
    scan_interval: int = 30  # segundos
    parallel_workers: int = 8

class PairScanner:
    """Escáner de pares de trading"""
    
    def __init__(self, exchange_manager: MultiExchangeManager, config: ScanConfig):
        self.exchange_manager = exchange_manager
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Analizadores técnicos
        self.support_resistance = SupportResistanceAnalyzer()
        self.channel_analyzer = ChannelAnalyzer()
        self.ict_analyzer = ICTAnalyzer()
        self.fibonacci_analyzer = FibonacciAnalyzer()
        self.session_analyzer = SessionAnalyzer()
        self.spread_analyzer = SpreadAnalyzer()
        
        # Cache de datos
        self.pairs_cache: Dict[str, List[PairInfo]] = {}
        self.market_data_cache: Dict[str, Dict[str, pd.DataFrame]] = {}
        self.opportunities_cache: List[QuickOpportunity] = []
        
        # Estadísticas
        self.scan_stats = {
            'total_scanned': 0,
            'opportunities_found': 0,
            'last_scan_time': None,
            'scan_duration': 0.0
        }
        
        # Thread pool para análisis paralelo
        self.executor = ThreadPoolExecutor(max_workers=config.parallel_workers)
    
    async def initialize(self):
        """Inicializa el escáner"""
        try:
            # Conectar a exchanges
            await self.exchange_manager.connect_all()
            
            # Cargar pares disponibles
            await self._load_available_pairs()
            
            self.logger.info(f"Escáner inicializado. {len(self.pairs_cache)} exchanges, {sum(len(pairs) for pairs in self.pairs_cache.values())} pares")
            
        except Exception as e:
            self.logger.error(f"Error inicializando escáner: {e}")
            raise
    
    async def scan_all_opportunities(self) -> List[QuickOpportunity]:
        """Escanea todas las oportunidades en todos los pares"""
        start_time = datetime.now()
        all_opportunities = []
        
        try:
            # Preparar tareas de escaneo
            scan_tasks = []
            
            for exchange_name, pairs in self.pairs_cache.items():
                if exchange_name not in self.config.enabled_exchanges:
                    continue
                
                # Filtrar pares por criterios
                filtered_pairs = self._filter_pairs(pairs)
                
                for pair in filtered_pairs[:self.config.max_pairs_per_exchange]:
                    for timeframe in self.config.enabled_timeframes:
                        for market_type in self.config.enabled_markets:
                            if self._is_pair_supported(pair, market_type):
                                task = self._scan_pair_opportunities(pair, timeframe, market_type)
                                scan_tasks.append(task)
            
            # Ejecutar escaneo en paralelo
            self.logger.info(f"Iniciando escaneo de {len(scan_tasks)} combinaciones...")
            
            # Dividir en lotes para evitar sobrecarga
            batch_size = 50
            for i in range(0, len(scan_tasks), batch_size):
                batch = scan_tasks[i:i + batch_size]
                batch_results = await asyncio.gather(*batch, return_exceptions=True)
                
                for result in batch_results:
                    if isinstance(result, Exception):
                        self.logger.warning(f"Error en escaneo: {result}")
                    elif result:
                        all_opportunities.extend(result)
                
                # Pequeña pausa entre lotes
                await asyncio.sleep(0.1)
            
            # Filtrar y ordenar oportunidades
            filtered_opportunities = self._filter_opportunities(all_opportunities)
            sorted_opportunities = sorted(filtered_opportunities, key=lambda x: x.overall_score, reverse=True)
            
            # Actualizar cache
            self.opportunities_cache = sorted_opportunities
            
            # Actualizar estadísticas
            scan_duration = (datetime.now() - start_time).total_seconds()
            self.scan_stats.update({
                'total_scanned': len(scan_tasks),
                'opportunities_found': len(sorted_opportunities),
                'last_scan_time': datetime.now(),
                'scan_duration': scan_duration
            })
            
            self.logger.info(f"Escaneo completado: {len(sorted_opportunities)} oportunidades en {scan_duration:.2f}s")
            
            return sorted_opportunities
            
        except Exception as e:
            self.logger.error(f"Error en escaneo: {e}")
            return []
    
    async def _scan_pair_opportunities(self, pair: PairInfo, timeframe: Timeframe, market_type: MarketType) -> List[QuickOpportunity]:
        """Escanea oportunidades para un par específico"""
        opportunities = []
        
        try:
            # Obtener datos de mercado
            market_data = await self._get_market_data(pair, timeframe)
            
            if market_data is None or len(market_data) < 50:
                return opportunities
            
            # Ejecutar análisis técnico en paralelo
            analysis_tasks = [
                self._analyze_support_resistance(pair, market_data, timeframe),
                self._analyze_channels(pair, market_data, timeframe),
                self._analyze_ict(pair, market_data, timeframe),
                self._analyze_fibonacci(pair, market_data, timeframe),
                self._analyze_sessions(pair, market_data, timeframe),
                self._analyze_spreads(pair, market_data, timeframe)
            ]
            
            analysis_results = await asyncio.gather(*analysis_tasks, return_exceptions=True)
            
            # Procesar resultados y generar oportunidades
            for i, result in enumerate(analysis_results):
                if isinstance(result, Exception):
                    continue
                
                if result and result.get('confidence', 0) >= self.config.min_confidence_threshold:
                    opportunity = self._create_opportunity_from_analysis(
                        pair, timeframe, market_type, result, market_data
                    )
                    
                    if opportunity:
                        opportunities.append(opportunity)
            
            return opportunities
            
        except Exception as e:
            self.logger.warning(f"Error escaneando {pair.symbol}: {e}")
            return opportunities
    
    async def _get_market_data(self, pair: PairInfo, timeframe: Timeframe) -> Optional[pd.DataFrame]:
        """Obtiene datos de mercado para un par"""
        try:
            cache_key = f"{pair.exchange}_{pair.symbol}_{timeframe.value}"
            
            # Verificar cache
            if cache_key in self.market_data_cache:
                return self.market_data_cache[cache_key]
            
            # Obtener datos del exchange
            market_data = await self.exchange_manager.get_market_data(
                pair.symbol, timeframe.value, 100
            )
            
            if market_data and pair.exchange in market_data:
                df = market_data[pair.exchange]
                self.market_data_cache[cache_key] = df
                return df
            
            return None
            
        except Exception as e:
            self.logger.warning(f"Error obteniendo datos para {pair.symbol}: {e}")
            return None
    
    async def _analyze_support_resistance(self, pair: PairInfo, df: pd.DataFrame, timeframe: Timeframe) -> Dict[str, Any]:
        """Análisis de soportes y resistencias"""
        try:
            levels = self.support_resistance.detect_levels(df)
            signals = self.support_resistance.get_trading_signals(df)
            
            return {
                'strategy': 'support_resistance',
                'confidence': signals.get('confidence', 0.0),
                'action': 'buy' if signals.get('bounce') else 'sell' if signals.get('breakout') else 'hold',
                'levels': len(levels),
                'signals': signals
            }
        except Exception as e:
            return {'error': str(e), 'confidence': 0.0}
    
    async def _analyze_channels(self, pair: PairInfo, df: pd.DataFrame, timeframe: Timeframe) -> Dict[str, Any]:
        """Análisis de canales"""
        try:
            channels = self.channel_analyzer.detect_trend_channels(df)
            signals = self.channel_analyzer.get_trading_signals(df)
            
            return {
                'strategy': 'channel_analysis',
                'confidence': signals.get('confidence', 0.0),
                'action': 'buy' if signals.get('channel_breakout') else 'sell' if signals.get('channel_bounce') else 'hold',
                'channels': len(channels),
                'signals': signals
            }
        except Exception as e:
            return {'error': str(e), 'confidence': 0.0}
    
    async def _analyze_ict(self, pair: PairInfo, df: pd.DataFrame, timeframe: Timeframe) -> Dict[str, Any]:
        """Análisis ICT"""
        try:
            ict_analysis = self.ict_analyzer.analyze_ict_concepts(df)
            signals = self.ict_analyzer.get_ict_trading_signals(df)
            
            return {
                'strategy': 'ict_techniques',
                'confidence': signals.get('confidence', 0.0),
                'action': 'buy' if signals.get('bullish_setup') else 'sell' if signals.get('bearish_setup') else 'hold',
                'order_blocks': len(ict_analysis.get('order_blocks', [])),
                'fair_value_gaps': len(ict_analysis.get('fair_value_gaps', [])),
                'signals': signals
            }
        except Exception as e:
            return {'error': str(e), 'confidence': 0.0}
    
    async def _analyze_fibonacci(self, pair: PairInfo, df: pd.DataFrame, timeframe: Timeframe) -> Dict[str, Any]:
        """Análisis de Fibonacci"""
        try:
            fib_analysis = self.fibonacci_analyzer.analyze_fibonacci_levels(df)
            signals = self.fibonacci_analyzer.get_fibonacci_trading_signals(df)
            
            return {
                'strategy': 'fibonacci',
                'confidence': signals.get('confidence', 0.0),
                'action': 'buy' if signals.get('fibonacci_bounce') else 'sell' if signals.get('fibonacci_rejection') else 'hold',
                'retracements': len(fib_analysis.get('retracements', [])),
                'extensions': len(fib_analysis.get('extensions', [])),
                'signals': signals
            }
        except Exception as e:
            return {'error': str(e), 'confidence': 0.0}
    
    async def _analyze_sessions(self, pair: PairInfo, df: pd.DataFrame, timeframe: Timeframe) -> Dict[str, Any]:
        """Análisis de sesiones"""
        try:
            session_analysis = self.session_analyzer.analyze_trading_sessions(df)
            signals = self.session_analyzer.get_session_trading_signals(df)
            
            return {
                'strategy': 'session_analysis',
                'confidence': signals.get('confidence', 0.0),
                'action': 'buy' if signals.get('session_based_entry') else 'sell' if signals.get('session_breakout') else 'hold',
                'current_session': session_analysis.get('session_strength', {}),
                'signals': signals
            }
        except Exception as e:
            return {'error': str(e), 'confidence': 0.0}
    
    async def _analyze_spreads(self, pair: PairInfo, df: pd.DataFrame, timeframe: Timeframe) -> Dict[str, Any]:
        """Análisis de spreads"""
        try:
            spread_analysis = self.spread_analyzer.analyze_spread_conditions(df)
            signals = self.spread_analyzer.get_spread_trading_signals(df)
            
            return {
                'strategy': 'spread_analysis',
                'confidence': signals.get('confidence', 0.0),
                'action': 'buy' if signals.get('spread_optimal_entry') else 'sell' if signals.get('liquidity_entry') else 'hold',
                'current_spread': spread_analysis.get('current_spread', {}),
                'signals': signals
            }
        except Exception as e:
            return {'error': str(e), 'confidence': 0.0}
    
    def _create_opportunity_from_analysis(self, pair: PairInfo, timeframe: Timeframe, 
                                        market_type: MarketType, analysis: Dict[str, Any], 
                                        df: pd.DataFrame) -> Optional[QuickOpportunity]:
        """Crea oportunidad desde análisis"""
        try:
            confidence = analysis.get('confidence', 0.0)
            action = analysis.get('action', 'hold')
            
            if action == 'hold' or confidence < self.config.min_confidence_threshold:
                return None
            
            # Calcular scores
            technical_score = confidence
            volume_score = min(pair.volume_24h / 10000000, 1.0)  # Normalizar por $10M
            volatility_score = min(abs(pair.price_change_24h) / 0.1, 1.0)  # Normalizar por 10%
            
            # Score general
            overall_score = (technical_score * 0.5 + volume_score * 0.3 + volatility_score * 0.2)
            
            # Calcular niveles
            current_price = df['close'].iloc[-1]
            stop_loss, take_profit = self._calculate_levels(action, current_price, analysis, df)
            
            # Calcular risk/reward
            risk_reward_ratio = 1.0
            if stop_loss and take_profit:
                if action == 'buy':
                    risk = current_price - stop_loss
                    reward = take_profit - current_price
                else:
                    risk = stop_loss - current_price
                    reward = current_price - take_profit
                
                if risk > 0:
                    risk_reward_ratio = reward / risk
            
            # Generar reasoning
            reasoning = self._generate_opportunity_reasoning(pair, timeframe, analysis, overall_score)
            
            return QuickOpportunity(
                pair=pair,
                timeframe=timeframe,
                strategy=analysis.get('strategy', 'unknown'),
                signal=action,
                confidence=confidence,
                entry_price=current_price,
                stop_loss=stop_loss,
                take_profit=take_profit,
                risk_reward_ratio=risk_reward_ratio,
                time_to_expire=timedelta(minutes=30),
                reasoning=reasoning,
                technical_score=technical_score,
                volume_score=volume_score,
                volatility_score=volatility_score,
                overall_score=overall_score
            )
            
        except Exception as e:
            self.logger.warning(f"Error creando oportunidad: {e}")
            return None
    
    def _calculate_levels(self, action: str, current_price: float, analysis: Dict[str, Any], df: pd.DataFrame) -> Tuple[Optional[float], Optional[float]]:
        """Calcula niveles de stop loss y take profit"""
        try:
            stop_loss = None
            take_profit = None
            
            # Usar análisis específico según estrategia
            strategy = analysis.get('strategy', '')
            signals = analysis.get('signals', {})
            
            if strategy == 'support_resistance':
                # Usar niveles de soporte/resistencia
                if 'levels' in analysis:
                    # Implementar lógica específica para soportes/resistencias
                    pass
            
            elif strategy == 'fibonacci':
                # Usar niveles de Fibonacci
                if 'signals' in analysis and 'stop_loss' in signals:
                    stop_loss = signals['stop_loss']
                    take_profit = signals['take_profit']
            
            # Valores por defecto si no se calcularon
            if not stop_loss:
                if action == 'buy':
                    stop_loss = current_price * 0.98  # 2% stop loss
                    take_profit = current_price * 1.04  # 4% take profit
                elif action == 'sell':
                    stop_loss = current_price * 1.02  # 2% stop loss
                    take_profit = current_price * 0.96  # 4% take profit
            
            return stop_loss, take_profit
            
        except Exception as e:
            return None, None
    
    def _generate_opportunity_reasoning(self, pair: PairInfo, timeframe: Timeframe, 
                                      analysis: Dict[str, Any], score: float) -> str:
        """Genera reasoning para la oportunidad"""
        strategy = analysis.get('strategy', 'unknown')
        confidence = analysis.get('confidence', 0.0)
        action = analysis.get('action', 'hold')
        
        reasoning_parts = [
            f"Estrategia: {strategy}",
            f"Confianza: {confidence:.2f}",
            f"Score: {score:.2f}",
            f"Volumen 24h: ${pair.volume_24h:,.0f}",
            f"Cambio 24h: {pair.price_change_24h:.2%}"
        ]
        
        return " | ".join(reasoning_parts)
    
    async def _load_available_pairs(self):
        """Carga pares disponibles de todos los exchanges"""
        try:
            for exchange_name in self.config.enabled_exchanges:
                if exchange_name not in self.exchange_manager.exchanges:
                    continue
                
                pairs = []
                
                try:
                    # Obtener mercados disponibles
                    markets = self.exchange_manager.exchanges[exchange_name].markets
                    
                    for symbol, market in markets.items():
                        # Filtrar por tipo de mercado
                        if market.get('type') in ['spot', 'future', 'margin']:
                            market_type = MarketType.SPOT if market.get('type') == 'spot' else MarketType.FUTURES
                            
                            # Extraer información del par
                            base = market.get('base', '')
                            quote = market.get('quote', '')
                            
                            if base and quote:
                                pair_info = PairInfo(
                                    symbol=symbol,
                                    exchange=exchange_name,
                                    market_type=market_type,
                                    base_currency=base,
                                    quote_currency=quote,
                                    price=0.0,  # Se actualizará después
                                    volume_24h=0.0,
                                    volume_change_24h=0.0,
                                    price_change_24h=0.0,
                                    available_margin=market.get('margin', False),
                                    max_leverage=market.get('limits', {}).get('leverage', {}).get('max', 1),
                                    min_order_size=market.get('limits', {}).get('amount', {}).get('min', 0.001),
                                    tick_size=market.get('limits', {}).get('price', {}).get('min', 0.01)
                                )
                                pairs.append(pair_info)
                
                except Exception as e:
                    self.logger.warning(f"Error cargando pares de {exchange_name}: {e}")
                
                self.pairs_cache[exchange_name] = pairs
                self.logger.info(f"Cargados {len(pairs)} pares de {exchange_name}")
            
        except Exception as e:
            self.logger.error(f"Error cargando pares: {e}")
    
    def _filter_pairs(self, pairs: List[PairInfo]) -> List[PairInfo]:
        """Filtra pares según criterios"""
        filtered = []
        
        for pair in pairs:
            # Filtrar por volumen mínimo
            if pair.volume_24h < self.config.min_volume_24h:
                continue
            
            # Filtrar por cambio de precio mínimo
            if abs(pair.price_change_24h) < self.config.min_price_change_24h:
                continue
            
            # Filtrar por tipo de mercado
            if pair.market_type not in self.config.enabled_markets:
                continue
            
            filtered.append(pair)
        
        return filtered
    
    def _is_pair_supported(self, pair: PairInfo, market_type: MarketType) -> bool:
        """Verifica si el par soporta el tipo de mercado"""
        if market_type == MarketType.SPOT:
            return pair.market_type == MarketType.SPOT
        elif market_type == MarketType.FUTURES:
            return pair.market_type == MarketType.FUTURES or pair.available_margin
        else:
            return True
    
    def _filter_opportunities(self, opportunities: List[QuickOpportunity]) -> List[QuickOpportunity]:
        """Filtra oportunidades según criterios"""
        filtered = []
        
        for opp in opportunities:
            # Filtro por confianza mínima
            if opp.confidence < self.config.min_confidence_threshold:
                continue
            
            # Filtro por score general
            if opp.overall_score < 0.5:
                continue
            
            # Filtro por risk/reward ratio
            if opp.risk_reward_ratio < 1.0:
                continue
            
            filtered.append(opp)
        
        return filtered
    
    def get_top_opportunities(self, limit: int = 10) -> List[QuickOpportunity]:
        """Obtiene las mejores oportunidades"""
        return self.opportunities_cache[:limit]
    
    def get_opportunities_by_exchange(self, exchange: str) -> List[QuickOpportunity]:
        """Obtiene oportunidades por exchange"""
        return [opp for opp in self.opportunities_cache if opp.pair.exchange == exchange]
    
    def get_opportunities_by_strategy(self, strategy: str) -> List[QuickOpportunity]:
        """Obtiene oportunidades por estrategia"""
        return [opp for opp in self.opportunities_cache if opp.strategy == strategy]
    
    def get_scan_statistics(self) -> Dict[str, Any]:
        """Obtiene estadísticas del escáner"""
        return {
            **self.scan_stats,
            'cached_pairs': sum(len(pairs) for pairs in self.pairs_cache.values()),
            'active_opportunities': len(self.opportunities_cache),
            'top_opportunity_score': self.opportunities_cache[0].overall_score if self.opportunities_cache else 0.0
        }

# Funciones de utilidad

async def create_pair_scanner(exchange_manager: MultiExchangeManager, config: Optional[ScanConfig] = None) -> PairScanner:
    """Crea instancia del escáner de pares"""
    if config is None:
        config = ScanConfig()
    
    scanner = PairScanner(exchange_manager, config)
    await scanner.initialize()
    return scanner

async def quick_scan_opportunities(exchange_manager: MultiExchangeManager, limit: int = 20) -> List[QuickOpportunity]:
    """Escaneo rápido de oportunidades"""
    config = ScanConfig(
        enabled_timeframes=[Timeframe.M15, Timeframe.H1],
        max_pairs_per_exchange=50,
        min_confidence_threshold=0.7
    )
    
    scanner = await create_pair_scanner(exchange_manager, config)
    opportunities = await scanner.scan_all_opportunities()
    
    return opportunities[:limit]




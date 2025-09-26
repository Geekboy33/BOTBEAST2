"""
Módulo de Piloto Automático con IA
Implementa sistema de trading automático que combina todas las estrategias y análisis
"""

import asyncio
import logging
from typing import List, Dict, Optional, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import pandas as pd
import numpy as np
from concurrent.futures import ThreadPoolExecutor
import json

# Importar módulos de análisis técnico
from ..technical_analysis.support_resistance import SupportResistanceAnalyzer
from ..technical_analysis.channel_analysis import ChannelAnalyzer
from ..technical_analysis.ict_analysis import ICTAnalyzer
from ..technical_analysis.fibonacci_analysis import FibonacciAnalyzer
from ..technical_analysis.session_analysis import SessionAnalyzer
from ..technical_analysis.spread_analysis import SpreadAnalyzer

# Importar módulos de exchanges y IA
from ..exchanges.multi_exchange_manager import MultiExchangeManager, ExchangeConfig
from .ollama_integration import OllamaTradingAI, OllamaConfig

class AutopilotStatus(Enum):
    """Estado del piloto automático"""
    STOPPED = "stopped"
    STARTING = "starting"
    RUNNING = "running"
    PAUSED = "paused"
    ERROR = "error"
    EMERGENCY_STOP = "emergency_stop"

class StrategyWeight(Enum):
    """Pesos de estrategias"""
    SUPPORT_RESISTANCE = 0.20
    CHANNEL_ANALYSIS = 0.15
    ICT_TECHNIQUES = 0.25
    FIBONACCI = 0.15
    SESSION_ANALYSIS = 0.15
    SPREAD_ANALYSIS = 0.10

@dataclass
class TradingSignal:
    """Señal de trading consolidada"""
    timestamp: datetime
    symbol: str
    action: str  # 'buy', 'sell', 'hold'
    confidence: float  # 0-1
    price: float
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    position_size: float = 1.0
    reasoning: str = ""
    strategy_contributions: Dict[str, float] = field(default_factory=dict)
    risk_score: float = 0.5
    ai_analysis: Optional[Dict[str, Any]] = None

@dataclass
class AutopilotConfig:
    """Configuración del piloto automático"""
    enabled_strategies: List[str] = field(default_factory=lambda: [
        'support_resistance', 'channel_analysis', 'ict_techniques', 
        'fibonacci', 'session_analysis', 'spread_analysis'
    ])
    min_confidence_threshold: float = 0.7
    max_position_size: float = 1000.0
    risk_per_trade: float = 0.02  # 2% del capital por trade
    max_daily_trades: int = 10
    emergency_stop_loss: float = 0.05  # 5% stop loss de emergencia
    ai_ollama_enabled: bool = True
    ollama_model: str = "gpt-oss-120b-turbo"
    analysis_interval: int = 60  # segundos
    trading_enabled: bool = False  # Solo análisis por defecto
    dry_run: bool = True

@dataclass
class AutopilotMetrics:
    """Métricas del piloto automático"""
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    total_pnl: float = 0.0
    max_drawdown: float = 0.0
    current_drawdown: float = 0.0
    sharpe_ratio: float = 0.0
    win_rate: float = 0.0
    avg_trade_duration: timedelta = timedelta(0)
    last_update: datetime = field(default_factory=datetime.now)

class AutopilotEngine:
    """Motor de piloto automático con IA"""
    
    def __init__(self, config: AutopilotConfig):
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Estado del sistema
        self.status = AutopilotStatus.STOPPED
        self.is_running = False
        self.current_signals: Dict[str, TradingSignal] = {}
        self.trade_history: List[Dict[str, Any]] = []
        self.metrics = AutopilotMetrics()
        
        # Analizadores técnicos
        self.support_resistance = SupportResistanceAnalyzer()
        self.channel_analyzer = ChannelAnalyzer()
        self.ict_analyzer = ICTAnalyzer()
        self.fibonacci_analyzer = FibonacciAnalyzer()
        self.session_analyzer = SessionAnalyzer()
        self.spread_analyzer = SpreadAnalyzer()
        
        # Gestión de exchanges
        self.exchange_manager: Optional[MultiExchangeManager] = None
        
        # IA con Ollama
        self.ollama_ai: Optional[OllamaTradingAI] = None
        
        # Thread pool para análisis paralelo
        self.executor = ThreadPoolExecutor(max_workers=4)
        
        # Datos de mercado en tiempo real
        self.market_data: Dict[str, pd.DataFrame] = {}
        self.last_analysis_time: Dict[str, datetime] = {}
        
    async def initialize(self, exchange_configs: List[ExchangeConfig]):
        """Inicializa el sistema de piloto automático"""
        try:
            self.status = AutopilotStatus.STARTING
            self.logger.info("Inicializando piloto automático...")
            
            # Inicializar gestor de exchanges
            self.exchange_manager = MultiExchangeManager(exchange_configs)
            await self.exchange_manager.connect_all()
            
            # Inicializar IA con Ollama si está habilitada
            if self.config.ai_ollama_enabled:
                ollama_config = OllamaConfig(model_name=self.config.ollama_model)
                self.ollama_ai = OllamaTradingAI(ollama_config)
                await self.ollama_ai.initialize()
                self.logger.info("IA Ollama inicializada")
            
            # Inicializar analizadores
            await self._initialize_analyzers()
            
            self.status = AutopilotStatus.RUNNING
            self.is_running = True
            self.logger.info("Piloto automático inicializado correctamente")
            
        except Exception as e:
            self.status = AutopilotStatus.ERROR
            self.logger.error(f"Error inicializando piloto automático: {e}")
            raise
    
    async def _initialize_analyzers(self):
        """Inicializa todos los analizadores"""
        # Los analizadores se inicializan automáticamente
        # Aquí se pueden hacer configuraciones específicas si es necesario
        self.logger.info("Analizadores técnicos inicializados")
    
    async def start(self):
        """Inicia el piloto automático"""
        if self.status == AutopilotStatus.RUNNING:
            self.logger.warning("El piloto automático ya está ejecutándose")
            return
        
        if self.status == AutopilotStatus.ERROR:
            self.logger.error("No se puede iniciar el piloto automático debido a errores previos")
            return
        
        self.is_running = True
        self.status = AutopilotStatus.RUNNING
        self.logger.info("Piloto automático iniciado")
        
        # Iniciar loop principal
        asyncio.create_task(self._main_loop())
    
    async def stop(self):
        """Detiene el piloto automático"""
        self.is_running = False
        self.status = AutopilotStatus.STOPPED
        self.logger.info("Piloto automático detenido")
    
    async def pause(self):
        """Pausa el piloto automático"""
        self.status = AutopilotStatus.PAUSED
        self.logger.info("Piloto automático pausado")
    
    async def resume(self):
        """Reanuda el piloto automático"""
        self.status = AutopilotStatus.RUNNING
        self.logger.info("Piloto automático reanudado")
    
    async def emergency_stop(self):
        """Parada de emergencia"""
        self.status = AutopilotStatus.EMERGENCY_STOP
        self.is_running = False
        
        # Cerrar todas las posiciones abiertas
        if self.exchange_manager and self.config.trading_enabled:
            await self._close_all_positions()
        
        self.logger.critical("PARADA DE EMERGENCIA ACTIVADA")
    
    async def _main_loop(self):
        """Loop principal del piloto automático"""
        while self.is_running:
            try:
                if self.status == AutopilotStatus.RUNNING:
                    await self._analyze_and_trade()
                
                await asyncio.sleep(self.config.analysis_interval)
                
            except Exception as e:
                self.logger.error(f"Error en loop principal: {e}")
                await asyncio.sleep(5)  # Esperar antes de reintentar
    
    async def _analyze_and_trade(self):
        """Análisis principal y ejecución de trades"""
        try:
            # Obtener datos de mercado
            market_data = await self._get_market_data()
            
            if not market_data:
                self.logger.warning("No hay datos de mercado disponibles")
                return
            
            # Realizar análisis en paralelo
            analysis_results = await self._run_parallel_analysis(market_data)
            
            # Consolidar señales
            consolidated_signal = await self._consolidate_signals(analysis_results, market_data)
            
            # Aplicar IA para validación final
            if self.ollama_ai and consolidated_signal.confidence > 0.6:
                ai_validation = await self._get_ai_validation(consolidated_signal, market_data)
                consolidated_signal.ai_analysis = ai_validation
                
                # Ajustar señal basada en IA
                consolidated_signal = await self._adjust_signal_with_ai(consolidated_signal, ai_validation)
            
            # Ejecutar trade si cumple criterios
            if (consolidated_signal.confidence >= self.config.min_confidence_threshold and
                consolidated_signal.action != 'hold' and
                self.config.trading_enabled and
                not self.config.dry_run):
                
                await self._execute_trade(consolidated_signal)
            
            # Actualizar métricas
            await self._update_metrics()
            
            # Verificar condiciones de emergencia
            await self._check_emergency_conditions()
            
        except Exception as e:
            self.logger.error(f"Error en análisis y trading: {e}")
    
    async def _get_market_data(self) -> Dict[str, pd.DataFrame]:
        """Obtiene datos de mercado de múltiples exchanges"""
        market_data = {}
        
        if not self.exchange_manager:
            return market_data
        
        try:
            # Obtener datos de los exchanges conectados
            symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT']  # Símbolos principales
            
            for symbol in symbols:
                try:
                    data = await self.exchange_manager.get_market_data(symbol, '1h', 100)
                    
                    # Combinar datos de múltiples exchanges
                    if data:
                        # Usar el exchange con mejor liquidez o precio más representativo
                        best_exchange = max(data.keys(), key=lambda x: len(data[x]))
                        market_data[symbol] = data[best_exchange]
                        
                except Exception as e:
                    self.logger.warning(f"Error obteniendo datos para {symbol}: {e}")
            
            return market_data
            
        except Exception as e:
            self.logger.error(f"Error obteniendo datos de mercado: {e}")
            return {}
    
    async def _run_parallel_analysis(self, market_data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
        """Ejecuta análisis técnico en paralelo"""
        analysis_tasks = []
        results = {}
        
        for symbol, df in market_data.items():
            # Crear tareas para cada estrategia
            if 'support_resistance' in self.config.enabled_strategies:
                task = self._analyze_support_resistance(symbol, df)
                analysis_tasks.append(('support_resistance', symbol, task))
            
            if 'channel_analysis' in self.config.enabled_strategies:
                task = self._analyze_channels(symbol, df)
                analysis_tasks.append(('channel_analysis', symbol, task))
            
            if 'ict_techniques' in self.config.enabled_strategies:
                task = self._analyze_ict(symbol, df)
                analysis_tasks.append(('ict_techniques', symbol, task))
            
            if 'fibonacci' in self.config.enabled_strategies:
                task = self._analyze_fibonacci(symbol, df)
                analysis_tasks.append(('fibonacci', symbol, task))
            
            if 'session_analysis' in self.config.enabled_strategies:
                task = self._analyze_sessions(symbol, df)
                analysis_tasks.append(('session_analysis', symbol, task))
            
            if 'spread_analysis' in self.config.enabled_strategies:
                task = self._analyze_spreads(symbol, df)
                analysis_tasks.append(('spread_analysis', symbol, task))
        
        # Ejecutar todas las tareas en paralelo
        if analysis_tasks:
            tasks = [task for _, _, task in analysis_tasks]
            results_list = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Organizar resultados
            for i, (strategy, symbol, _) in enumerate(analysis_tasks):
                if not isinstance(results_list[i], Exception):
                    if strategy not in results:
                        results[strategy] = {}
                    results[strategy][symbol] = results_list[i]
                else:
                    self.logger.error(f"Error en análisis {strategy} para {symbol}: {results_list[i]}")
        
        return results
    
    async def _analyze_support_resistance(self, symbol: str, df: pd.DataFrame) -> Dict[str, Any]:
        """Análisis de soportes y resistencias"""
        try:
            levels = self.support_resistance.detect_levels(df)
            signals = self.support_resistance.get_trading_signals(df)
            return {
                'levels': levels,
                'signals': signals,
                'confidence': signals.get('confidence', 0.0),
                'action': 'buy' if signals.get('bounce') else 'sell' if signals.get('breakout') else 'hold'
            }
        except Exception as e:
            self.logger.error(f"Error en análisis de soportes y resistencias: {e}")
            return {'error': str(e), 'confidence': 0.0, 'action': 'hold'}
    
    async def _analyze_channels(self, symbol: str, df: pd.DataFrame) -> Dict[str, Any]:
        """Análisis de canales de tendencia"""
        try:
            channels = self.channel_analyzer.detect_trend_channels(df)
            signals = self.channel_analyzer.get_trading_signals(df)
            return {
                'channels': channels,
                'signals': signals,
                'confidence': signals.get('confidence', 0.0),
                'action': signals.get('channel_breakout') and 'buy' or 'sell' if signals.get('channel_bounce') else 'hold'
            }
        except Exception as e:
            self.logger.error(f"Error en análisis de canales: {e}")
            return {'error': str(e), 'confidence': 0.0, 'action': 'hold'}
    
    async def _analyze_ict(self, symbol: str, df: pd.DataFrame) -> Dict[str, Any]:
        """Análisis ICT"""
        try:
            ict_analysis = self.ict_analyzer.analyze_ict_concepts(df)
            signals = self.ict_analyzer.get_ict_trading_signals(df)
            return {
                'analysis': ict_analysis,
                'signals': signals,
                'confidence': signals.get('confidence', 0.0),
                'action': 'buy' if signals.get('bullish_setup') else 'sell' if signals.get('bearish_setup') else 'hold'
            }
        except Exception as e:
            self.logger.error(f"Error en análisis ICT: {e}")
            return {'error': str(e), 'confidence': 0.0, 'action': 'hold'}
    
    async def _analyze_fibonacci(self, symbol: str, df: pd.DataFrame) -> Dict[str, Any]:
        """Análisis de Fibonacci"""
        try:
            fib_analysis = self.fibonacci_analyzer.analyze_fibonacci_levels(df)
            signals = self.fibonacci_analyzer.get_fibonacci_trading_signals(df)
            return {
                'analysis': fib_analysis,
                'signals': signals,
                'confidence': signals.get('confidence', 0.0),
                'action': signals.get('fibonacci_bounce') and 'buy' or 'sell' if signals.get('fibonacci_rejection') else 'hold'
            }
        except Exception as e:
            self.logger.error(f"Error en análisis de Fibonacci: {e}")
            return {'error': str(e), 'confidence': 0.0, 'action': 'hold'}
    
    async def _analyze_sessions(self, symbol: str, df: pd.DataFrame) -> Dict[str, Any]:
        """Análisis de sesiones"""
        try:
            session_analysis = self.session_analyzer.analyze_trading_sessions(df)
            signals = self.session_analyzer.get_session_trading_signals(df)
            return {
                'analysis': session_analysis,
                'signals': signals,
                'confidence': signals.get('confidence', 0.0),
                'action': 'buy' if signals.get('session_based_entry') else 'sell' if signals.get('session_breakout') else 'hold'
            }
        except Exception as e:
            self.logger.error(f"Error en análisis de sesiones: {e}")
            return {'error': str(e), 'confidence': 0.0, 'action': 'hold'}
    
    async def _analyze_spreads(self, symbol: str, df: pd.DataFrame) -> Dict[str, Any]:
        """Análisis de spreads"""
        try:
            spread_analysis = self.spread_analyzer.analyze_spread_conditions(df)
            signals = self.spread_analyzer.get_spread_trading_signals(df)
            return {
                'analysis': spread_analysis,
                'signals': signals,
                'confidence': signals.get('confidence', 0.0),
                'action': 'buy' if signals.get('spread_optimal_entry') else 'sell' if signals.get('liquidity_entry') else 'hold'
            }
        except Exception as e:
            self.logger.error(f"Error en análisis de spreads: {e}")
            return {'error': str(e), 'confidence': 0.0, 'action': 'hold'}
    
    async def _consolidate_signals(self, analysis_results: Dict[str, Any], market_data: Dict[str, pd.DataFrame]) -> TradingSignal:
        """Consolida señales de todas las estrategias"""
        try:
            symbol = list(market_data.keys())[0]  # Usar primer símbolo por ahora
            current_price = market_data[symbol]['close'].iloc[-1]
            
            # Recopilar señales de todas las estrategias
            signals = []
            strategy_contributions = {}
            
            for strategy, results in analysis_results.items():
                if symbol in results:
                    signal_data = results[symbol]
                    
                    if 'error' not in signal_data:
                        confidence = signal_data.get('confidence', 0.0)
                        action = signal_data.get('action', 'hold')
                        
                        # Aplicar peso de estrategia
                        weight = getattr(StrategyWeight, strategy.upper().replace('_', '_')).value
                        weighted_confidence = confidence * weight
                        
                        signals.append({
                            'action': action,
                            'confidence': weighted_confidence,
                            'weight': weight
                        })
                        
                        strategy_contributions[strategy] = weighted_confidence
            
            # Consolidar señales
            if signals:
                # Calcular acción mayoritaria
                buy_weight = sum(s['confidence'] for s in signals if s['action'] == 'buy')
                sell_weight = sum(s['confidence'] for s in signals if s['action'] == 'sell')
                hold_weight = sum(s['confidence'] for s in signals if s['action'] == 'hold')
                
                if buy_weight > sell_weight and buy_weight > hold_weight:
                    final_action = 'buy'
                    final_confidence = buy_weight
                elif sell_weight > buy_weight and sell_weight > hold_weight:
                    final_action = 'sell'
                    final_confidence = sell_weight
                else:
                    final_action = 'hold'
                    final_confidence = hold_weight
                
                # Calcular niveles de stop loss y take profit
                stop_loss, take_profit = self._calculate_stop_take_profit(
                    final_action, current_price, analysis_results, symbol
                )
                
                # Calcular tamaño de posición
                position_size = self._calculate_position_size(final_confidence, current_price)
                
                # Generar reasoning
                reasoning = self._generate_reasoning(analysis_results, symbol, final_action, final_confidence)
                
                return TradingSignal(
                    timestamp=datetime.now(),
                    symbol=symbol,
                    action=final_action,
                    confidence=final_confidence,
                    price=current_price,
                    stop_loss=stop_loss,
                    take_profit=take_profit,
                    position_size=position_size,
                    reasoning=reasoning,
                    strategy_contributions=strategy_contributions,
                    risk_score=self._calculate_risk_score(analysis_results)
                )
            else:
                # Sin señales válidas
                return TradingSignal(
                    timestamp=datetime.now(),
                    symbol=symbol,
                    action='hold',
                    confidence=0.0,
                    price=current_price,
                    reasoning="No hay señales válidas de las estrategias"
                )
                
        except Exception as e:
            self.logger.error(f"Error consolidando señales: {e}")
            return TradingSignal(
                timestamp=datetime.now(),
                symbol="UNKNOWN",
                action='hold',
                confidence=0.0,
                price=0.0,
                reasoning=f"Error: {e}"
            )
    
    def _calculate_stop_take_profit(self, action: str, current_price: float, analysis_results: Dict[str, Any], symbol: str) -> Tuple[Optional[float], Optional[float]]:
        """Calcula stop loss y take profit"""
        try:
            stop_loss = None
            take_profit = None
            
            # Usar niveles de soporte/resistencia si están disponibles
            if 'support_resistance' in analysis_results and symbol in analysis_results['support_resistance']:
                sr_data = analysis_results['support_resistance'][symbol]
                levels = sr_data.get('levels', [])
                
                if levels:
                    if action == 'buy':
                        # Stop loss en soporte más cercano
                        support_levels = [level for level in levels if level.type == 'support']
                        if support_levels:
                            closest_support = min(support_levels, key=lambda x: abs(x.price - current_price))
                            stop_loss = closest_support.price * 0.995  # 0.5% por debajo del soporte
                        
                        # Take profit en resistencia más cercana
                        resistance_levels = [level for level in levels if level.type == 'resistance']
                        if resistance_levels:
                            closest_resistance = min(resistance_levels, key=lambda x: abs(x.price - current_price))
                            take_profit = closest_resistance.price * 0.995  # 0.5% por debajo de la resistencia
                    
                    elif action == 'sell':
                        # Stop loss en resistencia más cercana
                        resistance_levels = [level for level in levels if level.type == 'resistance']
                        if resistance_levels:
                            closest_resistance = min(resistance_levels, key=lambda x: abs(x.price - current_price))
                            stop_loss = closest_resistance.price * 1.005  # 0.5% por encima de la resistencia
                        
                        # Take profit en soporte más cercano
                        support_levels = [level for level in levels if level.type == 'support']
                        if support_levels:
                            closest_support = min(support_levels, key=lambda x: abs(x.price - current_price))
                            take_profit = closest_support.price * 1.005  # 0.5% por encima del soporte
            
            # Valores por defecto si no se encontraron niveles
            if not stop_loss:
                if action == 'buy':
                    stop_loss = current_price * 0.98  # 2% stop loss
                    take_profit = current_price * 1.04  # 4% take profit
                elif action == 'sell':
                    stop_loss = current_price * 1.02  # 2% stop loss
                    take_profit = current_price * 0.96  # 4% take profit
            
            return stop_loss, take_profit
            
        except Exception as e:
            self.logger.error(f"Error calculando stop/take profit: {e}")
            return None, None
    
    def _calculate_position_size(self, confidence: float, current_price: float) -> float:
        """Calcula el tamaño de la posición"""
        try:
            # Tamaño base basado en confianza
            base_size = confidence * self.config.max_position_size
            
            # Ajustar por riesgo por trade
            risk_adjusted_size = base_size * self.config.risk_per_trade
            
            # Asegurar que no exceda el máximo
            return min(risk_adjusted_size, self.config.max_position_size)
            
        except Exception as e:
            self.logger.error(f"Error calculando tamaño de posición: {e}")
            return self.config.max_position_size * 0.1  # 10% del máximo como fallback
    
    def _generate_reasoning(self, analysis_results: Dict[str, Any], symbol: str, action: str, confidence: float) -> str:
        """Genera reasoning detallado"""
        try:
            reasoning_parts = []
            
            for strategy, results in analysis_results.items():
                if symbol in results and 'error' not in results[symbol]:
                    signal_data = results[symbol]
                    strategy_confidence = signal_data.get('confidence', 0.0)
                    strategy_action = signal_data.get('action', 'hold')
                    
                    if strategy_confidence > 0.5:
                        reasoning_parts.append(
                            f"{strategy}: {strategy_action} (confianza: {strategy_confidence:.2f})"
                        )
            
            if reasoning_parts:
                return f"Señal {action} con confianza {confidence:.2f}. Estrategias: {', '.join(reasoning_parts)}"
            else:
                return f"Señal {action} con confianza {confidence:.2f} basada en análisis consolidado"
                
        except Exception as e:
            self.logger.error(f"Error generando reasoning: {e}")
            return f"Señal {action} con confianza {confidence:.2f}"
    
    def _calculate_risk_score(self, analysis_results: Dict[str, Any]) -> float:
        """Calcula score de riesgo"""
        try:
            risk_factors = []
            
            # Analizar factores de riesgo de cada estrategia
            for strategy, results in analysis_results.items():
                for symbol, data in results.items():
                    if 'error' not in data:
                        # Factor de riesgo basado en volatilidad y confianza
                        confidence = data.get('confidence', 0.0)
                        risk_factor = 1 - confidence  # Menor confianza = mayor riesgo
                        risk_factors.append(risk_factor)
            
            if risk_factors:
                return np.mean(risk_factors)
            else:
                return 0.5  # Riesgo medio por defecto
                
        except Exception as e:
            self.logger.error(f"Error calculando riesgo: {e}")
            return 0.5
    
    async def _get_ai_validation(self, signal: TradingSignal, market_data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
        """Obtiene validación de IA"""
        try:
            if not self.ollama_ai:
                return {}
            
            # Preparar contexto para IA
            symbol = signal.symbol
            df = market_data[symbol]
            
            # Análisis con IA
            ai_analysis = await self.ollama_ai.analyze_market_data(df, 'technical')
            
            return {
                'ai_recommendation': ai_analysis.recommendation,
                'ai_confidence': ai_analysis.confidence,
                'ai_reasoning': ai_analysis.reasoning,
                'ai_risk_assessment': ai_analysis.risk_assessment,
                'ai_key_points': ai_analysis.key_points
            }
            
        except Exception as e:
            self.logger.error(f"Error obteniendo validación de IA: {e}")
            return {}
    
    async def _adjust_signal_with_ai(self, signal: TradingSignal, ai_validation: Dict[str, Any]) -> TradingSignal:
        """Ajusta señal basada en validación de IA"""
        try:
            if not ai_validation:
                return signal
            
            ai_recommendation = ai_validation.get('ai_recommendation', 'hold')
            ai_confidence = ai_validation.get('ai_confidence', 0.0)
            ai_risk = ai_validation.get('ai_risk_assessment', 'medio')
            
            # Ajustar confianza basada en IA
            if ai_recommendation == signal.action:
                # IA confirma la señal
                signal.confidence = min(1.0, signal.confidence * 1.1)
                signal.reasoning += f" | Confirmado por IA (confianza: {ai_confidence:.2f})"
            elif ai_recommendation != 'hold' and ai_recommendation != signal.action:
                # IA contradice la señal
                signal.confidence = signal.confidence * 0.8
                signal.reasoning += f" | Contradicción de IA: {ai_recommendation}"
            
            # Ajustar por evaluación de riesgo de IA
            if ai_risk == 'alto':
                signal.confidence = signal.confidence * 0.9
                signal.reasoning += " | Riesgo alto según IA"
            elif ai_risk == 'bajo':
                signal.confidence = min(1.0, signal.confidence * 1.05)
                signal.reasoning += " | Riesgo bajo según IA"
            
            return signal
            
        except Exception as e:
            self.logger.error(f"Error ajustando señal con IA: {e}")
            return signal
    
    async def _execute_trade(self, signal: TradingSignal):
        """Ejecuta un trade basado en la señal"""
        try:
            if not self.exchange_manager or self.config.dry_run:
                self.logger.info(f"[DRY RUN] Ejecutaría: {signal.action} {signal.symbol} a {signal.price}")
                return
            
            # Encontrar el mejor exchange para la orden
            optimal_exchange = await self.exchange_manager.get_optimal_exchange_for_order(
                signal.symbol, signal.action, signal.position_size
            )
            
            if not optimal_exchange:
                self.logger.error("No se encontró exchange óptimo para ejecutar la orden")
                return
            
            # Ejecutar la orden
            execution = await self.exchange_manager._execute_order(
                optimal_exchange,
                signal.symbol,
                signal.action,
                signal.position_size,
                signal.price
            )
            
            if execution:
                # Registrar trade
                trade_record = {
                    'timestamp': execution.timestamp,
                    'exchange': execution.exchange,
                    'symbol': execution.symbol,
                    'side': execution.side,
                    'amount': execution.amount,
                    'price': execution.price,
                    'fees': execution.fees,
                    'signal_confidence': signal.confidence,
                    'reasoning': signal.reasoning
                }
                
                self.trade_history.append(trade_record)
                self.metrics.total_trades += 1
                
                self.logger.info(f"Trade ejecutado: {execution.side} {execution.amount} {execution.symbol} a {execution.price}")
            
        except Exception as e:
            self.logger.error(f"Error ejecutando trade: {e}")
    
    async def _close_all_positions(self):
        """Cierra todas las posiciones abiertas"""
        try:
            if not self.exchange_manager:
                return
            
            # Obtener balances y posiciones abiertas
            balances = await self.exchange_manager.get_balances()
            
            # Implementar lógica para cerrar posiciones
            # Esto dependería de la implementación específica del exchange
            self.logger.info("Cerrando todas las posiciones...")
            
        except Exception as e:
            self.logger.error(f"Error cerrando posiciones: {e}")
    
    async def _update_metrics(self):
        """Actualiza métricas del sistema"""
        try:
            if not self.trade_history:
                return
            
            # Calcular métricas básicas
            total_trades = len(self.trade_history)
            winning_trades = len([t for t in self.trade_history if t.get('pnl', 0) > 0])
            losing_trades = len([t for t in self.trade_history if t.get('pnl', 0) < 0])
            
            total_pnl = sum(t.get('pnl', 0) for t in self.trade_history)
            win_rate = winning_trades / total_trades if total_trades > 0 else 0
            
            self.metrics.total_trades = total_trades
            self.metrics.winning_trades = winning_trades
            self.metrics.losing_trades = losing_trades
            self.metrics.total_pnl = total_pnl
            self.metrics.win_rate = win_rate
            self.metrics.last_update = datetime.now()
            
        except Exception as e:
            self.logger.error(f"Error actualizando métricas: {e}")
    
    async def _check_emergency_conditions(self):
        """Verifica condiciones de emergencia"""
        try:
            # Verificar drawdown máximo
            if self.metrics.current_drawdown > self.config.emergency_stop_loss:
                self.logger.critical(f"Drawdown excedido: {self.metrics.current_drawdown:.2%}")
                await self.emergency_stop()
            
            # Verificar número máximo de trades diarios
            today_trades = len([t for t in self.trade_history 
                              if t['timestamp'].date() == datetime.now().date()])
            
            if today_trades >= self.config.max_daily_trades:
                self.logger.warning(f"Límite diario de trades alcanzado: {today_trades}")
                await self.pause()
            
        except Exception as e:
            self.logger.error(f"Error verificando condiciones de emergencia: {e}")
    
    def get_status(self) -> Dict[str, Any]:
        """Obtiene estado actual del piloto automático"""
        return {
            'status': self.status.value,
            'is_running': self.is_running,
            'metrics': {
                'total_trades': self.metrics.total_trades,
                'winning_trades': self.metrics.winning_trades,
                'losing_trades': self.metrics.losing_trades,
                'total_pnl': self.metrics.total_pnl,
                'win_rate': self.metrics.win_rate,
                'current_drawdown': self.metrics.current_drawdown
            },
            'current_signals': {symbol: {
                'action': signal.action,
                'confidence': signal.confidence,
                'price': signal.price,
                'timestamp': signal.timestamp.isoformat()
            } for symbol, signal in self.current_signals.items()},
            'config': {
                'enabled_strategies': self.config.enabled_strategies,
                'trading_enabled': self.config.trading_enabled,
                'dry_run': self.config.dry_run,
                'ai_ollama_enabled': self.config.ai_ollama_enabled
            }
        }
    
    def get_trade_history(self) -> List[Dict[str, Any]]:
        """Obtiene historial de trades"""
        return self.trade_history.copy()
    
    def get_strategy_performance(self) -> Dict[str, Dict[str, Any]]:
        """Obtiene rendimiento por estrategia"""
        strategy_performance = {}
        
        for trade in self.trade_history:
            reasoning = trade.get('reasoning', '')
            
            # Extraer estrategias del reasoning
            for strategy in self.config.enabled_strategies:
                if strategy in reasoning:
                    if strategy not in strategy_performance:
                        strategy_performance[strategy] = {
                            'trades': 0,
                            'wins': 0,
                            'total_pnl': 0.0
                        }
                    
                    strategy_performance[strategy]['trades'] += 1
                    pnl = trade.get('pnl', 0)
                    strategy_performance[strategy]['total_pnl'] += pnl
                    
                    if pnl > 0:
                        strategy_performance[strategy]['wins'] += 1
        
        # Calcular métricas
        for strategy, data in strategy_performance.items():
            if data['trades'] > 0:
                data['win_rate'] = data['wins'] / data['trades']
                data['avg_pnl'] = data['total_pnl'] / data['trades']
            else:
                data['win_rate'] = 0.0
                data['avg_pnl'] = 0.0
        
        return strategy_performance

# Funciones de utilidad

async def create_autopilot_engine(config: Optional[AutopilotConfig] = None) -> AutopilotEngine:
    """Crea instancia del motor de piloto automático"""
    if config is None:
        config = AutopilotConfig()
    
    return AutopilotEngine(config)

async def quick_autopilot_setup() -> AutopilotEngine:
    """Configuración rápida del piloto automático"""
    config = AutopilotConfig(
        enabled_strategies=['support_resistance', 'channel_analysis', 'ict_techniques'],
        min_confidence_threshold=0.6,
        trading_enabled=False,  # Solo análisis
        dry_run=True,
        ai_ollama_enabled=True
    )
    
    engine = AutopilotEngine(config)
    
    # Configuración básica de exchanges (sandbox)
    exchange_configs = [
        ExchangeConfig(name='binance', sandbox=True, enabled=True),
        ExchangeConfig(name='kraken', sandbox=True, enabled=True)
    ]
    
    await engine.initialize(exchange_configs)
    return engine




"""
Sistema Automático de Detección de Oportunidades Rápidas
Integra escáner de pares, análisis técnico, gestión de riesgo y noticias
"""

import asyncio
import logging
from typing import List, Dict, Optional, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import numpy as np

# Importar módulos del sistema
from ..scanners.pair_scanner import PairScanner, ScanConfig, QuickOpportunity, Timeframe
from ..risk_management.risk_levels import RiskManager, RiskLevel, PositionSizing
from ..fundamental_analysis.news_filter import NewsAnalyzer, NewsFilter, NewsSource
from ..exchanges.multi_exchange_manager import MultiExchangeManager, ExchangeConfig
from .ollama_integration import OllamaTradingAI, OllamaConfig

class OpportunityPriority(Enum):
    """Prioridad de oportunidades"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class EnhancedOpportunity:
    """Oportunidad mejorada con análisis completo"""
    base_opportunity: QuickOpportunity
    risk_level: RiskLevel
    position_sizing: PositionSizing
    news_sentiment: Dict[str, Any]
    ai_analysis: Dict[str, Any]
    priority: OpportunityPriority
    execution_score: float  # 0-1
    expected_return: float
    max_risk: float
    time_to_execute: timedelta
    confidence_factors: Dict[str, float] = field(default_factory=dict)
    execution_recommendations: List[str] = field(default_factory=list)

@dataclass
class AutoDetectorConfig:
    """Configuración del detector automático"""
    scan_interval: int = 30  # segundos
    max_opportunities_per_scan: int = 50
    min_execution_score: float = 0.7
    risk_level: RiskLevel = RiskLevel.CONSERVATIVE
    enable_news_analysis: bool = True
    enable_ai_analysis: bool = True
    enable_fundamental_filter: bool = True
    max_position_size: float = 10000.0
    max_concurrent_positions: int = 5
    emergency_stop_threshold: float = 0.05  # 5% drawdown

class AutoOpportunityDetector:
    """Detector automático de oportunidades"""
    
    def __init__(self, config: AutoDetectorConfig):
        self.config = config
        self.logger = logging.getLogger(__name__)
        
        # Componentes del sistema
        self.pair_scanner: Optional[PairScanner] = None
        self.risk_manager: RiskManager = RiskManager()
        self.news_analyzer: Optional[NewsAnalyzer] = None
        self.ollama_ai: Optional[OllamaTradingAI] = None
        self.exchange_manager: Optional[MultiExchangeManager] = None
        
        # Estado del sistema
        self.is_running = False
        self.detected_opportunities: List[EnhancedOpportunity] = []
        self.active_positions: List[Dict[str, Any]] = []
        self.execution_history: List[Dict[str, Any]] = []
        
        # Métricas
        self.detection_stats = {
            'total_scans': 0,
            'opportunities_found': 0,
            'opportunities_executed': 0,
            'successful_trades': 0,
            'total_pnl': 0.0,
            'last_scan_time': None,
            'scan_duration': 0.0
        }
        
        # Configurar risk manager
        self.risk_manager.set_risk_level(config.risk_level)
    
    async def initialize(self, exchange_configs: List[ExchangeConfig]):
        """Inicializa el detector automático"""
        try:
            self.logger.info("Inicializando detector automático de oportunidades...")
            
            # Inicializar exchange manager
            self.exchange_manager = MultiExchangeManager(exchange_configs)
            await self.exchange_manager.connect_all()
            
            # Inicializar pair scanner
            scan_config = ScanConfig(
                enabled_exchanges=[config.name for config in exchange_configs],
                enabled_timeframes=[Timeframe.M5, Timeframe.M15, Timeframe.H1],
                min_confidence_threshold=0.6,
                parallel_workers=6
            )
            self.pair_scanner = PairScanner(self.exchange_manager, scan_config)
            await self.pair_scanner.initialize()
            
            # Inicializar news analyzer
            if self.config.enable_news_analysis:
                news_config = NewsFilter(
                    enabled_sources=[NewsSource.COINDESK, NewsSource.COINTELEGRAPH, NewsSource.TWITTER],
                    min_relevance_score=0.3,
                    min_credibility_score=0.6,
                    max_age_hours=6,  # Solo noticias recientes
                    max_articles_per_source=10
                )
                self.news_analyzer = NewsAnalyzer(news_config)
            
            # Inicializar IA con Ollama
            if self.config.enable_ai_analysis:
                ollama_config = OllamaConfig(model_name="gpt-oss-120b-turbo")
                self.ollama_ai = OllamaTradingAI(ollama_config)
                await self.ollama_ai.initialize()
            
            self.logger.info("Detector automático inicializado correctamente")
            
        except Exception as e:
            self.logger.error(f"Error inicializando detector: {e}")
            raise
    
    async def start_detection(self):
        """Inicia la detección automática"""
        if self.is_running:
            self.logger.warning("La detección ya está ejecutándose")
            return
        
        self.is_running = True
        self.logger.info("Iniciando detección automática de oportunidades...")
        
        # Iniciar loop principal
        asyncio.create_task(self._detection_loop())
    
    async def stop_detection(self):
        """Detiene la detección automática"""
        self.is_running = False
        self.logger.info("Detención de detección automática...")
    
    async def _detection_loop(self):
        """Loop principal de detección"""
        while self.is_running:
            try:
                start_time = datetime.now()
                
                # Verificar condiciones de emergencia
                emergency_stop, reason = self.risk_manager.should_emergency_stop()
                if emergency_stop:
                    self.logger.critical(f"Parada de emergencia activada: {reason}")
                    await self._emergency_stop_all_positions()
                    break
                
                # Ejecutar detección
                opportunities = await self._detect_opportunities()
                
                # Procesar oportunidades
                enhanced_opportunities = await self._enhance_opportunities(opportunities)
                
                # Filtrar y priorizar
                filtered_opportunities = self._filter_and_prioritize(enhanced_opportunities)
                
                # Actualizar cache
                self.detected_opportunities = filtered_opportunities
                
                # Actualizar estadísticas
                scan_duration = (datetime.now() - start_time).total_seconds()
                self._update_detection_stats(len(opportunities), len(filtered_opportunities), scan_duration)
                
                # Log de resultados
                if filtered_opportunities:
                    top_opportunity = filtered_opportunities[0]
                    self.logger.info(f"Detectadas {len(filtered_opportunities)} oportunidades. "
                                   f"Mejor: {top_opportunity.base_opportunity.pair.symbol} "
                                   f"(score: {top_opportunity.execution_score:.3f})")
                
                # Esperar antes del siguiente scan
                await asyncio.sleep(self.config.scan_interval)
                
            except Exception as e:
                self.logger.error(f"Error en loop de detección: {e}")
                await asyncio.sleep(5)  # Esperar antes de reintentar
    
    async def _detect_opportunities(self) -> List[QuickOpportunity]:
        """Detecta oportunidades básicas"""
        try:
            if not self.pair_scanner:
                return []
            
            opportunities = await self.pair_scanner.scan_all_opportunities()
            
            # Limitar número de oportunidades
            return opportunities[:self.config.max_opportunities_per_scan]
            
        except Exception as e:
            self.logger.error(f"Error detectando oportunidades: {e}")
            return []
    
    async def _enhance_opportunities(self, opportunities: List[QuickOpportunity]) -> List[EnhancedOpportunity]:
        """Mejora oportunidades con análisis adicional"""
        enhanced = []
        
        for opportunity in opportunities:
            try:
                # Análisis de riesgo y sizing
                current_balance = 10000.0  # Simulado
                position_sizing = self.risk_manager.calculate_position_size(
                    opportunity, current_balance, opportunity.volatility_score, {}
                )
                
                # Validar trade
                is_valid, reason = self.risk_manager.validate_trade(
                    opportunity, position_sizing, self.active_positions
                )
                
                if not is_valid:
                    continue
                
                # Análisis de noticias
                news_sentiment = {}
                if self.news_analyzer and self.config.enable_news_analysis:
                    news_sentiment = await self._analyze_news_for_opportunity(opportunity)
                
                # Análisis con IA
                ai_analysis = {}
                if self.ollama_ai and self.config.enable_ai_analysis:
                    ai_analysis = await self._analyze_with_ai(opportunity)
                
                # Crear oportunidad mejorada
                enhanced_opp = EnhancedOpportunity(
                    base_opportunity=opportunity,
                    risk_level=self.config.risk_level,
                    position_sizing=position_sizing,
                    news_sentiment=news_sentiment,
                    ai_analysis=ai_analysis,
                    priority=self._calculate_priority(opportunity, news_sentiment, ai_analysis),
                    execution_score=self._calculate_execution_score(opportunity, news_sentiment, ai_analysis),
                    expected_return=self._calculate_expected_return(opportunity, position_sizing),
                    max_risk=self._calculate_max_risk(position_sizing),
                    time_to_execute=self._calculate_execution_time(opportunity),
                    confidence_factors=self._calculate_confidence_factors(opportunity, news_sentiment, ai_analysis),
                    execution_recommendations=self._generate_execution_recommendations(opportunity, position_sizing)
                )
                
                enhanced.append(enhanced_opp)
                
            except Exception as e:
                self.logger.warning(f"Error mejorando oportunidad: {e}")
                continue
        
        return enhanced
    
    async def _analyze_news_for_opportunity(self, opportunity: QuickOpportunity) -> Dict[str, Any]:
        """Analiza noticias para una oportunidad específica"""
        try:
            if not self.news_analyzer:
                return {}
            
            # Obtener noticias relevantes
            symbol = opportunity.pair.base_currency
            news_summary = self.news_analyzer.get_news_summary(symbol)
            
            # Analizar sentimiento
            sentiment = self.news_analyzer.analyze_market_sentiment(symbol)
            
            return {
                'summary': news_summary,
                'sentiment': {
                    'overall': sentiment.overall_sentiment.value,
                    'score': sentiment.sentiment_score,
                    'confidence': sentiment.confidence
                },
                'impact_score': self._calculate_news_impact(news_summary, sentiment),
                'relevance': self._calculate_news_relevance(news_summary, opportunity)
            }
            
        except Exception as e:
            self.logger.warning(f"Error analizando noticias: {e}")
            return {}
    
    async def _analyze_with_ai(self, opportunity: QuickOpportunity) -> Dict[str, Any]:
        """Analiza oportunidad con IA"""
        try:
            if not self.ollama_ai:
                return {}
            
            # Simular datos de mercado para IA
            import pandas as pd
            dates = pd.date_range(start='2024-01-01', end='2024-12-12', freq='1H')
            prices = opportunity.entry_price + np.cumsum(np.random.randn(len(dates)) * opportunity.entry_price * 0.01)
            
            df = pd.DataFrame({
                'timestamp': dates,
                'open': prices * 0.999,
                'high': prices * 1.002,
                'low': prices * 0.998,
                'close': prices,
                'volume': np.random.randint(1000, 10000, len(dates))
            })
            
            # Análisis con IA
            ai_analysis = await self.ollama_ai.analyze_market_data(df, 'technical')
            
            return {
                'recommendation': ai_analysis.recommendation,
                'confidence': ai_analysis.confidence,
                'reasoning': ai_analysis.reasoning,
                'risk_assessment': ai_analysis.risk_assessment,
                'key_points': ai_analysis.key_points
            }
            
        except Exception as e:
            self.logger.warning(f"Error analizando con IA: {e}")
            return {}
    
    def _calculate_priority(self, opportunity: QuickOpportunity, 
                          news_sentiment: Dict[str, Any], 
                          ai_analysis: Dict[str, Any]) -> OpportunityPriority:
        """Calcula prioridad de la oportunidad"""
        score = 0.0
        
        # Factor técnico
        score += opportunity.confidence * 0.4
        
        # Factor de noticias
        if news_sentiment:
            news_score = news_sentiment.get('sentiment', {}).get('score', 0)
            score += abs(news_score) * 0.3
        
        # Factor de IA
        if ai_analysis:
            ai_confidence = ai_analysis.get('confidence', 0)
            score += ai_confidence * 0.3
        
        # Determinar prioridad
        if score >= 0.9:
            return OpportunityPriority.CRITICAL
        elif score >= 0.75:
            return OpportunityPriority.HIGH
        elif score >= 0.6:
            return OpportunityPriority.MEDIUM
        else:
            return OpportunityPriority.LOW
    
    def _calculate_execution_score(self, opportunity: QuickOpportunity, 
                                 news_sentiment: Dict[str, Any], 
                                 ai_analysis: Dict[str, Any]) -> float:
        """Calcula score de ejecución (0-1)"""
        score = 0.0
        
        # Factor técnico (40%)
        technical_score = (opportunity.confidence + 
                          opportunity.technical_score + 
                          opportunity.volume_score + 
                          opportunity.volatility_score) / 4
        score += technical_score * 0.4
        
        # Factor de noticias (30%)
        if news_sentiment:
            news_impact = news_sentiment.get('impact_score', 0)
            news_relevance = news_sentiment.get('relevance', 0)
            news_factor = (news_impact + news_relevance) / 2
            score += news_factor * 0.3
        else:
            score += 0.5 * 0.3  # Score neutral si no hay noticias
        
        # Factor de IA (30%)
        if ai_analysis:
            ai_confidence = ai_analysis.get('confidence', 0)
            ai_recommendation = ai_analysis.get('recommendation', 'hold')
            
            if ai_recommendation in ['buy', 'sell'] and opportunity.signal in ['buy', 'sell']:
                if ((ai_recommendation == 'buy' and opportunity.signal == 'buy') or
                    (ai_recommendation == 'sell' and opportunity.signal == 'sell')):
                    ai_factor = ai_confidence * 1.2  # Bonus por coincidencia
                else:
                    ai_factor = ai_confidence * 0.5  # Penalty por discrepancia
            else:
                ai_factor = ai_confidence * 0.8
            
            score += min(ai_factor, 1.0) * 0.3
        else:
            score += 0.5 * 0.3  # Score neutral si no hay IA
        
        return min(score, 1.0)
    
    def _calculate_expected_return(self, opportunity: QuickOpportunity, 
                                 position_sizing: PositionSizing) -> float:
        """Calcula retorno esperado"""
        if opportunity.risk_reward_ratio > 0:
            # Retorno esperado basado en win rate y risk/reward
            win_rate = opportunity.confidence
            expected_return = (win_rate * opportunity.risk_reward_ratio - 
                             (1 - win_rate) * 1.0) * position_sizing.adjusted_size
        else:
            expected_return = opportunity.confidence * position_sizing.adjusted_size * 0.02  # 2% conservador
        
        return expected_return
    
    def _calculate_max_risk(self, position_sizing: PositionSizing) -> float:
        """Calcula riesgo máximo"""
        return position_sizing.max_loss
    
    def _calculate_execution_time(self, opportunity: QuickOpportunity) -> timedelta:
        """Calcula tiempo disponible para ejecutar"""
        # Basado en time_to_expire de la oportunidad
        return opportunity.time_to_expire
    
    def _calculate_confidence_factors(self, opportunity: QuickOpportunity, 
                                    news_sentiment: Dict[str, Any], 
                                    ai_analysis: Dict[str, Any]) -> Dict[str, float]:
        """Calcula factores de confianza"""
        factors = {
            'technical': opportunity.confidence,
            'volume': opportunity.volume_score,
            'volatility': opportunity.volatility_score,
            'risk_reward': min(opportunity.risk_reward_ratio / 3.0, 1.0),  # Normalizar
        }
        
        if news_sentiment:
            factors['news_sentiment'] = news_sentiment.get('sentiment', {}).get('confidence', 0)
            factors['news_impact'] = news_sentiment.get('impact_score', 0)
        
        if ai_analysis:
            factors['ai_confidence'] = ai_analysis.get('confidence', 0)
        
        return factors
    
    def _generate_execution_recommendations(self, opportunity: QuickOpportunity, 
                                          position_sizing: PositionSizing) -> List[str]:
        """Genera recomendaciones de ejecución"""
        recommendations = []
        
        # Recomendaciones basadas en tamaño de posición
        if position_sizing.leverage > 5:
            recommendations.append("Alto apalancamiento - monitorear posición de cerca")
        
        if position_sizing.position_value > self.config.max_position_size * 0.8:
            recommendations.append("Posición grande - considerar reducir tamaño")
        
        # Recomendaciones basadas en volatilidad
        if opportunity.volatility_score > 0.8:
            recommendations.append("Alta volatilidad - usar stop loss más amplio")
        
        # Recomendaciones basadas en tiempo
        if opportunity.time_to_expire < timedelta(minutes=15):
            recommendations.append("Oportunidad de corta duración - ejecutar rápidamente")
        
        # Recomendaciones de gestión de riesgo
        recommendations.append(f"Stop loss: {position_sizing.stop_distance:.4f}")
        recommendations.append(f"Take profit: {opportunity.take_profit:.4f}")
        
        return recommendations
    
    def _calculate_news_impact(self, news_summary: Dict[str, Any], 
                             sentiment) -> float:
        """Calcula impacto de noticias"""
        if not news_summary or 'sentiment' not in news_summary:
            return 0.5
        
        # Factor de volumen de noticias
        total_articles = news_summary.get('total_articles', 0)
        volume_factor = min(total_articles / 20.0, 1.0)  # Normalizar por 20 artículos
        
        # Factor de sentimiento extremo
        sentiment_score = abs(news_summary['sentiment']['score'])
        sentiment_factor = sentiment_score
        
        # Factor de eventos clave
        key_events = len(news_summary.get('key_events', []))
        events_factor = min(key_events / 3.0, 1.0)  # Normalizar por 3 eventos
        
        impact = (volume_factor * 0.3 + sentiment_factor * 0.5 + events_factor * 0.2)
        return min(impact, 1.0)
    
    def _calculate_news_relevance(self, news_summary: Dict[str, Any], 
                                opportunity: QuickOpportunity) -> float:
        """Calcula relevancia de noticias para la oportunidad"""
        if not news_summary:
            return 0.5
        
        # Verificar si el símbolo está en las noticias
        top_symbols = [item[0] for item in news_summary.get('top_symbols', [])]
        symbol_relevance = 1.0 if opportunity.pair.base_currency in top_symbols else 0.3
        
        # Verificar temas trending
        trending_topics = news_summary.get('trending_topics', [])
        topic_relevance = 0.5
        for topic in trending_topics:
            if topic in opportunity.keywords:
                topic_relevance = 1.0
                break
        
        relevance = (symbol_relevance * 0.7 + topic_relevance * 0.3)
        return min(relevance, 1.0)
    
    def _filter_and_prioritize(self, opportunities: List[EnhancedOpportunity]) -> List[EnhancedOpportunity]:
        """Filtra y prioriza oportunidades"""
        # Filtrar por score mínimo
        filtered = [opp for opp in opportunities 
                   if opp.execution_score >= self.config.min_execution_score]
        
        # Ordenar por prioridad y score
        priority_order = {
            OpportunityPriority.CRITICAL: 4,
            OpportunityPriority.HIGH: 3,
            OpportunityPriority.MEDIUM: 2,
            OpportunityPriority.LOW: 1
        }
        
        filtered.sort(key=lambda x: (priority_order[x.priority], x.execution_score), reverse=True)
        
        return filtered
    
    def _update_detection_stats(self, opportunities_found: int, 
                              filtered_opportunities: int, scan_duration: float):
        """Actualiza estadísticas de detección"""
        self.detection_stats.update({
            'total_scans': self.detection_stats['total_scans'] + 1,
            'opportunities_found': self.detection_stats['opportunities_found'] + opportunities_found,
            'last_scan_time': datetime.now(),
            'scan_duration': scan_duration
        })
    
    async def _emergency_stop_all_positions(self):
        """Para de emergencia todas las posiciones"""
        self.logger.critical("Ejecutando parada de emergencia...")
        
        # Aquí implementarías la lógica para cerrar todas las posiciones
        # En este caso, solo actualizamos el estado
        self.active_positions.clear()
        self.is_running = False
    
    def get_detection_status(self) -> Dict[str, Any]:
        """Obtiene estado del detector"""
        return {
            'is_running': self.is_running,
            'risk_level': self.config.risk_level.value,
            'active_opportunities': len(self.detected_opportunities),
            'active_positions': len(self.active_positions),
            'stats': self.detection_stats,
            'risk_summary': self.risk_manager.get_risk_summary()
        }
    
    def get_top_opportunities(self, limit: int = 10) -> List[EnhancedOpportunity]:
        """Obtiene mejores oportunidades"""
        return self.detected_opportunities[:limit]
    
    def get_opportunities_by_priority(self, priority: OpportunityPriority) -> List[EnhancedOpportunity]:
        """Obtiene oportunidades por prioridad"""
        return [opp for opp in self.detected_opportunities if opp.priority == priority]

# Funciones de utilidad

async def create_auto_detector(config: Optional[AutoDetectorConfig] = None) -> AutoOpportunityDetector:
    """Crea detector automático de oportunidades"""
    if config is None:
        config = AutoDetectorConfig()
    
    return AutoOpportunityDetector(config)

async def quick_opportunity_scan() -> List[EnhancedOpportunity]:
    """Escaneo rápido de oportunidades"""
    config = AutoDetectorConfig(
        max_opportunities_per_scan=20,
        min_execution_score=0.6,
        risk_level=RiskLevel.CONSERVATIVE
    )
    
    # Configuración básica de exchanges
    exchange_configs = [
        ExchangeConfig(name='binance', sandbox=True, enabled=True),
        ExchangeConfig(name='kraken', sandbox=True, enabled=True)
    ]
    
    detector = AutoOpportunityDetector(config)
    await detector.initialize(exchange_configs)
    
    # Ejecutar un solo scan
    opportunities = await detector._detect_opportunities()
    enhanced = await detector._enhance_opportunities(opportunities)
    filtered = detector._filter_and_prioritize(enhanced)
    
    return filtered[:5]  # Top 5




"""
Módulo de integración con Ollama
Implementa conexión con Ollama GPT OSS 120B Turbo local para análisis de trading
"""

import asyncio
import aiohttp
import json
from typing import List, Dict, Optional, Any, Union
from dataclasses import dataclass, asdict
from datetime import datetime
import pandas as pd
import numpy as np
import logging

@dataclass
class OllamaConfig:
    """Configuración de Ollama"""
    base_url: str = "http://localhost:11434"
    model_name: str = "gpt-oss-120b-turbo"
    temperature: float = 0.7
    max_tokens: int = 4096
    timeout: int = 60
    retry_attempts: int = 3
    enable_streaming: bool = True

@dataclass
class TradingAnalysis:
    """Análisis de trading generado por IA"""
    timestamp: datetime
    symbol: str
    analysis_type: str  # 'technical', 'fundamental', 'sentiment', 'strategy'
    confidence: float  # 0-1
    recommendation: str  # 'buy', 'sell', 'hold'
    reasoning: str
    key_points: List[str]
    risk_assessment: str
    price_targets: Optional[Dict[str, float]] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None

@dataclass
class MarketContext:
    """Contexto del mercado para análisis"""
    symbol: str
    current_price: float
    price_change_24h: float
    volume_24h: float
    market_cap: Optional[float] = None
    technical_indicators: Optional[Dict[str, Any]] = None
    news_sentiment: Optional[str] = None
    market_conditions: Optional[str] = None

class OllamaTradingAI:
    """Integración con Ollama para análisis de trading"""
    
    def __init__(self, config: OllamaConfig):
        self.config = config
        self.logger = logging.getLogger(__name__)
        self.session: Optional[aiohttp.ClientSession] = None
        self.available_models: List[str] = []
        self.model_info: Dict[str, Any] = {}
        
        # Templates de prompts para diferentes tipos de análisis
        self.prompts = {
            'technical_analysis': self._get_technical_analysis_prompt(),
            'fundamental_analysis': self._get_fundamental_analysis_prompt(),
            'sentiment_analysis': self._get_sentiment_analysis_prompt(),
            'strategy_recommendation': self._get_strategy_prompt(),
            'risk_assessment': self._get_risk_assessment_prompt(),
            'market_overview': self._get_market_overview_prompt()
        }
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=self.config.timeout)
        )
        await self.initialize()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    async def initialize(self):
        """Inicializa la conexión con Ollama"""
        try:
            # Verificar que Ollama esté corriendo
            await self._check_ollama_health()
            
            # Listar modelos disponibles
            await self._list_models()
            
            # Verificar que el modelo esté disponible
            if self.config.model_name not in self.available_models:
                self.logger.warning(f"Modelo {self.config.model_name} no encontrado. Modelos disponibles: {self.available_models}")
                # Usar el primer modelo disponible si el especificado no existe
                if self.available_models:
                    self.config.model_name = self.available_models[0]
                    self.logger.info(f"Usando modelo: {self.config.model_name}")
            
            # Obtener información del modelo
            await self._get_model_info()
            
            self.logger.info(f"Ollama inicializado correctamente con modelo: {self.config.model_name}")
            
        except Exception as e:
            self.logger.error(f"Error inicializando Ollama: {e}")
            raise
    
    async def _check_ollama_health(self):
        """Verifica que Ollama esté funcionando"""
        try:
            async with self.session.get(f"{self.config.base_url}/api/tags") as response:
                if response.status != 200:
                    raise Exception(f"Ollama no está respondiendo. Status: {response.status}")
        except Exception as e:
            raise Exception(f"No se puede conectar con Ollama en {self.config.base_url}: {e}")
    
    async def _list_models(self):
        """Lista modelos disponibles en Ollama"""
        try:
            async with self.session.get(f"{self.config.base_url}/api/tags") as response:
                if response.status == 200:
                    data = await response.json()
                    self.available_models = [model['name'] for model in data.get('models', [])]
                else:
                    self.logger.error(f"Error listando modelos: {response.status}")
        except Exception as e:
            self.logger.error(f"Error obteniendo modelos: {e}")
    
    async def _get_model_info(self):
        """Obtiene información del modelo actual"""
        try:
            async with self.session.post(
                f"{self.config.base_url}/api/show",
                json={"name": self.config.model_name}
            ) as response:
                if response.status == 200:
                    self.model_info = await response.json()
                else:
                    self.logger.error(f"Error obteniendo información del modelo: {response.status}")
        except Exception as e:
            self.logger.error(f"Error obteniendo información del modelo: {e}")
    
    async def analyze_market_data(self, market_data: pd.DataFrame, analysis_type: str = 'technical') -> TradingAnalysis:
        """Analiza datos de mercado usando IA"""
        try:
            # Preparar contexto del mercado
            context = self._prepare_market_context(market_data)
            
            # Generar prompt específico
            prompt = self._generate_analysis_prompt(context, analysis_type)
            
            # Enviar a Ollama
            response = await self._send_prompt(prompt)
            
            # Parsear respuesta
            analysis = self._parse_analysis_response(response, context, analysis_type)
            
            return analysis
            
        except Exception as e:
            self.logger.error(f"Error analizando datos de mercado: {e}")
            return self._create_error_analysis(str(e))
    
    async def get_trading_recommendation(self, market_context: MarketContext, strategy_type: str = 'scalping') -> TradingAnalysis:
        """Obtiene recomendación de trading"""
        try:
            prompt = self._generate_recommendation_prompt(market_context, strategy_type)
            response = await self._send_prompt(prompt)
            analysis = self._parse_recommendation_response(response, market_context)
            return analysis
            
        except Exception as e:
            self.logger.error(f"Error obteniendo recomendación: {e}")
            return self._create_error_analysis(str(e))
    
    async def assess_risk(self, position_data: Dict[str, Any]) -> Dict[str, Any]:
        """Evalúa riesgo de una posición"""
        try:
            prompt = self._generate_risk_assessment_prompt(position_data)
            response = await self._send_prompt(prompt)
            risk_assessment = self._parse_risk_response(response)
            return risk_assessment
            
        except Exception as e:
            self.logger.error(f"Error evaluando riesgo: {e}")
            return {'error': str(e), 'risk_level': 'high', 'recommendation': 'close_position'}
    
    async def generate_market_overview(self, symbols: List[str], market_data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
        """Genera overview del mercado"""
        try:
            prompt = self._generate_market_overview_prompt(symbols, market_data)
            response = await self._send_prompt(prompt)
            overview = self._parse_market_overview_response(response)
            return overview
            
        except Exception as e:
            self.logger.error(f"Error generando overview: {e}")
            return {'error': str(e)}
    
    async def _send_prompt(self, prompt: str, stream: bool = None) -> str:
        """Envía prompt a Ollama"""
        if stream is None:
            stream = self.config.enable_streaming
        
        payload = {
            "model": self.config.model_name,
            "prompt": prompt,
            "stream": stream,
            "options": {
                "temperature": self.config.temperature,
                "num_predict": self.config.max_tokens
            }
        }
        
        try:
            async with self.session.post(
                f"{self.config.base_url}/api/generate",
                json=payload
            ) as response:
                if response.status != 200:
                    raise Exception(f"Error en respuesta de Ollama: {response.status}")
                
                if stream:
                    return await self._handle_streaming_response(response)
                else:
                    data = await response.json()
                    return data.get('response', '')
                    
        except Exception as e:
            self.logger.error(f"Error enviando prompt: {e}")
            raise
    
    async def _handle_streaming_response(self, response) -> str:
        """Maneja respuesta streaming de Ollama"""
        full_response = ""
        
        async for line in response.content:
            if line:
                try:
                    data = json.loads(line.decode('utf-8'))
                    if 'response' in data:
                        full_response += data['response']
                    if data.get('done', False):
                        break
                except json.JSONDecodeError:
                    continue
        
        return full_response
    
    def _prepare_market_context(self, market_data: pd.DataFrame) -> MarketContext:
        """Prepara contexto del mercado desde datos"""
        if market_data.empty:
            raise ValueError("Datos de mercado vacíos")
        
        current_price = market_data['close'].iloc[-1]
        price_24h_ago = market_data['close'].iloc[-24] if len(market_data) >= 24 else market_data['close'].iloc[0]
        price_change_24h = (current_price - price_24h_ago) / price_24h_ago * 100
        
        volume_24h = market_data['volume'].tail(24).sum() if 'volume' in market_data.columns else 0
        
        # Calcular indicadores técnicos básicos
        technical_indicators = self._calculate_technical_indicators(market_data)
        
        return MarketContext(
            symbol="BTCUSDT",  # Se puede hacer dinámico
            current_price=current_price,
            price_change_24h=price_change_24h,
            volume_24h=volume_24h,
            technical_indicators=technical_indicators
        )
    
    def _calculate_technical_indicators(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calcula indicadores técnicos básicos"""
        indicators = {}
        
        if len(df) < 20:
            return indicators
        
        # Medias móviles
        indicators['sma_20'] = df['close'].rolling(20).mean().iloc[-1]
        indicators['sma_50'] = df['close'].rolling(50).mean().iloc[-1] if len(df) >= 50 else None
        
        # RSI
        delta = df['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
        rs = gain / loss
        indicators['rsi'] = (100 - (100 / (1 + rs))).iloc[-1]
        
        # Bollinger Bands
        sma_20 = df['close'].rolling(20).mean()
        std_20 = df['close'].rolling(20).std()
        indicators['bb_upper'] = (sma_20 + (std_20 * 2)).iloc[-1]
        indicators['bb_lower'] = (sma_20 - (std_20 * 2)).iloc[-1]
        indicators['bb_middle'] = sma_20.iloc[-1]
        
        # Volatilidad
        indicators['volatility'] = df['close'].pct_change().std() * 100
        
        return indicators
    
    def _generate_analysis_prompt(self, context: MarketContext, analysis_type: str) -> str:
        """Genera prompt para análisis"""
        base_prompt = self.prompts.get(analysis_type, self.prompts['technical_analysis'])
        
        prompt = f"""
{base_prompt}

CONTEXTO DEL MERCADO:
- Símbolo: {context.symbol}
- Precio actual: ${context.current_price:.4f}
- Cambio 24h: {context.price_change_24h:.2f}%
- Volumen 24h: {context.volume_24h:,.0f}

INDICADORES TÉCNICOS:
{self._format_technical_indicators(context.technical_indicators)}

Por favor, proporciona un análisis detallado siguiendo el formato JSON especificado.
"""
        
        return prompt
    
    def _format_technical_indicators(self, indicators: Optional[Dict[str, Any]]) -> str:
        """Formatea indicadores técnicos para el prompt"""
        if not indicators:
            return "No hay indicadores técnicos disponibles."
        
        formatted = []
        for name, value in indicators.items():
            if value is not None:
                if isinstance(value, float):
                    formatted.append(f"- {name}: {value:.4f}")
                else:
                    formatted.append(f"- {name}: {value}")
        
        return "\n".join(formatted)
    
    def _generate_recommendation_prompt(self, context: MarketContext, strategy_type: str) -> str:
        """Genera prompt para recomendación"""
        return f"""
Eres un experto trader con acceso a análisis técnico avanzado. Proporciona una recomendación de trading específica.

CONTEXTO:
- Símbolo: {context.symbol}
- Precio: ${context.current_price:.4f}
- Estrategia: {strategy_type}
- Cambio 24h: {context.price_change_24h:.2f}%

INDICADORES:
{self._format_technical_indicators(context.technical_indicators)}

Proporciona tu recomendación en este formato JSON:
{{
    "recommendation": "buy|sell|hold",
    "confidence": 0.85,
    "reasoning": "Explicación detallada...",
    "key_points": ["punto1", "punto2", "punto3"],
    "risk_assessment": "bajo|medio|alto",
    "price_targets": {{
        "short_term": 50000,
        "medium_term": 55000
    }},
    "stop_loss": 48000,
    "take_profit": 52000
}}
"""
    
    def _generate_risk_assessment_prompt(self, position_data: Dict[str, Any]) -> str:
        """Genera prompt para evaluación de riesgo"""
        return f"""
Evalúa el riesgo de la siguiente posición de trading:

POSICIÓN:
{json.dumps(position_data, indent=2)}

Proporciona evaluación de riesgo en formato JSON:
{{
    "risk_level": "bajo|medio|alto|crítico",
    "risk_factors": ["factor1", "factor2"],
    "recommendation": "mantener|reducir|cerrar",
    "max_loss": 1000,
    "probability_of_loss": 0.25,
    "suggested_position_size": 0.5
}}
"""
    
    def _generate_market_overview_prompt(self, symbols: List[str], market_data: Dict[str, pd.DataFrame]) -> str:
        """Genera prompt para overview del mercado"""
        overview_data = []
        
        for symbol, df in market_data.items():
            if not df.empty:
                current_price = df['close'].iloc[-1]
                change_24h = ((df['close'].iloc[-1] - df['close'].iloc[-24]) / df['close'].iloc[-24] * 100) if len(df) >= 24 else 0
                overview_data.append({
                    'symbol': symbol,
                    'price': current_price,
                    'change_24h': change_24h
                })
        
        return f"""
Proporciona un análisis general del mercado basado en estos datos:

DATOS DEL MERCADO:
{json.dumps(overview_data, indent=2)}

Proporciona overview en formato JSON:
{{
    "market_sentiment": "alcista|bajista|neutral",
    "key_trends": ["tendencia1", "tendencia2"],
    "opportunities": ["oportunidad1", "oportunidad2"],
    "risks": ["riesgo1", "riesgo2"],
    "overall_recommendation": "compra|venta|espera"
}}
"""
    
    def _parse_analysis_response(self, response: str, context: MarketContext, analysis_type: str) -> TradingAnalysis:
        """Parsea respuesta de análisis"""
        try:
            # Intentar parsear JSON
            data = json.loads(response)
            
            return TradingAnalysis(
                timestamp=datetime.now(),
                symbol=context.symbol,
                analysis_type=analysis_type,
                confidence=float(data.get('confidence', 0.5)),
                recommendation=data.get('recommendation', 'hold'),
                reasoning=data.get('reasoning', ''),
                key_points=data.get('key_points', []),
                risk_assessment=data.get('risk_assessment', 'medio'),
                price_targets=data.get('price_targets'),
                stop_loss=data.get('stop_loss'),
                take_profit=data.get('take_profit')
            )
            
        except json.JSONDecodeError:
            # Si no es JSON válido, extraer información del texto
            return self._parse_text_response(response, context, analysis_type)
    
    def _parse_recommendation_response(self, response: str, context: MarketContext) -> TradingAnalysis:
        """Parsea respuesta de recomendación"""
        return self._parse_analysis_response(response, context, 'strategy_recommendation')
    
    def _parse_risk_response(self, response: str) -> Dict[str, Any]:
        """Parsea respuesta de evaluación de riesgo"""
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {
                'risk_level': 'medio',
                'recommendation': 'mantener',
                'error': 'Error parseando respuesta'
            }
    
    def _parse_market_overview_response(self, response: str) -> Dict[str, Any]:
        """Parsea respuesta de overview del mercado"""
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {
                'market_sentiment': 'neutral',
                'error': 'Error parseando respuesta'
            }
    
    def _parse_text_response(self, response: str, context: MarketContext, analysis_type: str) -> TradingAnalysis:
        """Parsea respuesta de texto plano"""
        # Extraer información básica del texto
        recommendation = 'hold'
        confidence = 0.5
        
        if 'buy' in response.lower() or 'compra' in response.lower():
            recommendation = 'buy'
        elif 'sell' in response.lower() or 'venta' in response.lower():
            recommendation = 'sell'
        
        return TradingAnalysis(
            timestamp=datetime.now(),
            symbol=context.symbol,
            analysis_type=analysis_type,
            confidence=confidence,
            recommendation=recommendation,
            reasoning=response[:500],  # Primeros 500 caracteres
            key_points=[],
            risk_assessment='medio'
        )
    
    def _create_error_analysis(self, error_message: str) -> TradingAnalysis:
        """Crea análisis de error"""
        return TradingAnalysis(
            timestamp=datetime.now(),
            symbol="UNKNOWN",
            analysis_type="error",
            confidence=0.0,
            recommendation="hold",
            reasoning=f"Error en análisis: {error_message}",
            key_points=[],
            risk_assessment="alto"
        )
    
    # Templates de prompts
    
    def _get_technical_analysis_prompt(self) -> str:
        return """
Eres un experto analista técnico. Analiza los siguientes datos de mercado y proporciona un análisis técnico detallado.

Responde en formato JSON con la siguiente estructura:
{
    "recommendation": "buy|sell|hold",
    "confidence": 0.85,
    "reasoning": "Explicación técnica detallada...",
    "key_points": ["punto técnico 1", "punto técnico 2"],
    "risk_assessment": "bajo|medio|alto",
    "price_targets": {
        "short_term": 50000,
        "medium_term": 55000
    },
    "stop_loss": 48000,
    "take_profit": 52000
}
"""
    
    def _get_fundamental_analysis_prompt(self) -> str:
        return """
Eres un analista fundamental experto. Evalúa los aspectos fundamentales del activo.

Responde en formato JSON con análisis fundamental.
"""
    
    def _get_sentiment_analysis_prompt(self) -> str:
        return """
Eres un experto en análisis de sentimiento del mercado. Analiza el sentimiento actual.

Responde en formato JSON con análisis de sentimiento.
"""
    
    def _get_strategy_prompt(self) -> str:
        return """
Eres un estratega de trading experto. Recomienda una estrategia específica.

Responde en formato JSON con estrategia recomendada.
"""
    
    def _get_risk_assessment_prompt(self) -> str:
        return """
Eres un experto en gestión de riesgo. Evalúa los riesgos de la posición.

Responde en formato JSON con evaluación de riesgo.
"""
    
    def _get_market_overview_prompt(self) -> str:
        return """
Eres un analista de mercado senior. Proporciona un overview general del mercado.

Responde en formato JSON con overview del mercado.
"""

# Funciones de utilidad

async def create_ollama_ai(config: Optional[OllamaConfig] = None) -> OllamaTradingAI:
    """Crea instancia de OllamaTradingAI"""
    if config is None:
        config = OllamaConfig()
    
    return OllamaTradingAI(config)

async def quick_analysis(market_data: pd.DataFrame, model_name: str = "gpt-oss-120b-turbo") -> TradingAnalysis:
    """Análisis rápido usando Ollama"""
    config = OllamaConfig(model_name=model_name)
    
    async with OllamaTradingAI(config) as ai:
        return await ai.analyze_market_data(market_data)

async def get_trading_signal(symbol: str, current_price: float, indicators: Dict[str, Any]) -> Dict[str, Any]:
    """Obtiene señal de trading rápida"""
    config = OllamaConfig()
    
    # Crear contexto básico
    context = MarketContext(
        symbol=symbol,
        current_price=current_price,
        technical_indicators=indicators
    )
    
    async with OllamaTradingAI(config) as ai:
        analysis = await ai.get_trading_recommendation(context)
        
        return {
            'signal': analysis.recommendation,
            'confidence': analysis.confidence,
            'reasoning': analysis.reasoning,
            'stop_loss': analysis.stop_loss,
            'take_profit': analysis.take_profit
        }




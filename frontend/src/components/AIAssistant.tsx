// src/components/AIAssistant.tsx
import React, { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    analysis?: any;
    predictions?: any;
    confidence?: number;
  };
}

interface MarketAnalysis {
  trend: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  key_levels: {
    support: number[];
    resistance: number[];
  };
  indicators: {
    rsi: number;
    macd: number;
    bollinger_position: number;
  };
  sentiment: {
    score: number;
    sources: string[];
  };
}

interface Prediction {
  symbol: string;
  timeframe: string;
  prediction: {
    price: number;
    direction: 'up' | 'down' | 'sideways';
    confidence: number;
  };
  reasoning: string[];
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: '¡Hola! Soy tu asistente de trading AI. Puedo ayudarte con análisis de mercado, predicciones de precios, gestión de riesgo y optimización de estrategias. ¿En qué puedo ayudarte?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'analysis' | 'predictions' | 'voice'>('chat');
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    scrollToBottom();
    loadMarketAnalysis();
    loadPredictions();
  }, [messages]);

  useEffect(() => {
    // Configurar reconocimiento de voz
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new (window as any).webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        handleSendMessage(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMarketAnalysis = async () => {
    // Simular análisis de mercado
    const mockAnalysis: MarketAnalysis = {
      trend: 'bullish',
      confidence: 0.78,
      key_levels: {
        support: [48500, 47200, 46000],
        resistance: [52000, 53500, 55000]
      },
      indicators: {
        rsi: 65.2,
        macd: 0.8,
        bollinger_position: 0.7
      },
      sentiment: {
        score: 0.72,
        sources: ['Twitter', 'Reddit', 'News', 'Social Media']
      }
    };
    setMarketAnalysis(mockAnalysis);
  };

  const loadPredictions = async () => {
    // Simular predicciones
    const mockPredictions: Prediction[] = [
      {
        symbol: 'BTCUSDT',
        timeframe: '1h',
        prediction: {
          price: 51250,
          direction: 'up',
          confidence: 0.82
        },
        reasoning: [
          'RSI indica sobreventa',
          'Rompe resistencia clave en $50,000',
          'Volumen aumentando',
          'Sentimiento positivo en redes sociales'
        ]
      },
      {
        symbol: 'ETHUSDT',
        timeframe: '4h',
        prediction: {
          price: 3150,
          direction: 'up',
          confidence: 0.75
        },
        reasoning: [
          'Formación de patrón alcista',
          'MACD cruzamiento positivo',
          'Soporte fuerte en $3,000'
        ]
      }
    ];
    setPredictions(mockPredictions);
  };

  const handleSendMessage = async (message?: string) => {
    const userMessage = message || inputMessage.trim();
    if (!userMessage) return;

    // Agregar mensaje del usuario
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    // Simular respuesta del AI
    setTimeout(() => {
      const response = generateAIResponse(userMessage);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        metadata: response.metadata
      };

      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (userMessage: string): { content: string; metadata?: any } => {
    const message = userMessage.toLowerCase();

    if (message.includes('análisis') || message.includes('analisis')) {
      return {
        content: `📊 **Análisis de Mercado Actual:**

**Tendencia General:** ${marketAnalysis?.trend === 'bullish' ? '🟢 Alcista' : '🔴 Bajista'} (Confianza: ${(marketAnalysis?.confidence || 0) * 100}%)

**Niveles Clave:**
• Soporte: $${marketAnalysis?.key_levels.support.join(', $')}
• Resistencia: $${marketAnalysis?.key_levels.resistance.join(', $')}

**Indicadores Técnicos:**
• RSI: ${marketAnalysis?.indicators.rsi} (${marketAnalysis?.indicators.rsi > 70 ? 'Sobrecompra' : marketAnalysis?.indicators.rsi < 30 ? 'Sobreventa' : 'Neutral'})
• MACD: ${marketAnalysis?.indicators.macd} (${marketAnalysis?.indicators.macd > 0 ? 'Positivo' : 'Negativo'})
• Bollinger: ${(marketAnalysis?.indicators.bollinger_position || 0) * 100}% (${marketAnalysis?.indicators.bollinger_position > 0.8 ? 'Alto' : marketAnalysis?.indicators.bollinger_position < 0.2 ? 'Bajo' : 'Medio'})

**Sentimiento:** ${(marketAnalysis?.sentiment.score || 0) * 100}% Positivo`,
        metadata: { analysis: marketAnalysis }
      };
    }

    if (message.includes('predicción') || message.includes('prediccion') || message.includes('precio')) {
      const btcPrediction = predictions.find(p => p.symbol === 'BTCUSDT');
      return {
        content: `🔮 **Predicción de Precios:**

**BTCUSDT (${btcPrediction?.timeframe}):**
• Precio objetivo: $${btcPrediction?.prediction.price}
• Dirección: ${btcPrediction?.prediction.direction === 'up' ? '🟢 Alcista' : '🔴 Bajista'}
• Confianza: ${(btcPrediction?.prediction.confidence || 0) * 100}%

**Razonamiento:**
${btcPrediction?.reasoning.map(r => `• ${r}`).join('\n')}

**Recomendación:** ${btcPrediction?.prediction.direction === 'up' ? 'Considera posición larga con stop loss en soporte' : 'Considera posición corta con stop loss en resistencia'}`,
        metadata: { predictions: btcPrediction }
      };
    }

    if (message.includes('riesgo') || message.includes('risk')) {
      return {
        content: `⚠️ **Análisis de Riesgo:**

**Métricas de Riesgo Actual:**
• VaR (95%): -$250
• Drawdown máximo: -12%
• Ratio Sharpe: 1.8
• Beta: 0.85

**Recomendaciones:**
• Reduce el tamaño de posición en un 20%
• Establece stop loss en $48,500
• Considera diversificar en ETH y BNB
• Monitorea correlación con S&P 500

**Nivel de Riesgo:** 🟡 Moderado (6/10)`
      };
    }

    if (message.includes('estrategia') || message.includes('strategy')) {
      return {
        content: `🎯 **Optimización de Estrategia:**

**Análisis de Rendimiento:**
• Win Rate: 68%
• Profit Factor: 1.85
• Trades promedio por día: 3.2
• Duración promedio: 2.5 horas

**Sugerencias de Mejora:**
• Aumenta el filtro de volatilidad (actual: 0.02 → sugerido: 0.025)
• Optimiza el take profit (actual: 0.10 → sugerido: 0.12)
• Reduce el stop loss (actual: 0.05 → sugerido: 0.04)
• Considera trading en múltiples timeframes

**Parámetros Optimizados:**
• MA Period: 20 → 18
• RSI Oversold: 30 → 28
• Volume Threshold: 1.5x → 1.8x`
      };
    }

    // Respuesta por defecto
    return {
      content: `🤖 Entiendo que preguntas sobre "${userMessage}". 

Puedo ayudarte con:
• 📊 Análisis de mercado en tiempo real
• 🔮 Predicciones de precios
• ⚠️ Evaluación de riesgo
• 🎯 Optimización de estrategias
• 📈 Análisis técnico avanzado
• 💡 Recomendaciones de trading

¿Podrías ser más específico sobre qué necesitas?`
    };
  };

  const startVoiceInput = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'bullish': return 'text-green-400';
      case 'bearish': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">🤖 AI Assistant</h2>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">AI Online</span>
            </div>
            <div className="text-sm text-gray-400">
              Confianza: <span className="text-green-400 font-semibold">85%</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {[
            { key: 'chat', label: '💬 Chat', icon: '💬' },
            { key: 'analysis', label: '📊 Análisis', icon: '📊' },
            { key: 'predictions', label: '🔮 Predicciones', icon: '🔮' },
            { key: 'voice', label: '🎤 Voz', icon: '🎤' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 font-semibold ${
                activeTab === tab.key
                  ? 'bg-green-600 text-white border-b-2 border-green-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Chat */}
      {activeTab === 'chat' && (
        <div className="bg-gray-800 rounded-lg h-96 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-green-600 text-white'
                      : message.type === 'assistant'
                      ? 'bg-gray-700 text-white'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-700 text-white px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Pregunta al AI sobre trading, análisis, predicciones..."
                className="flex-1 bg-gray-600 text-white rounded px-3 py-2"
              />
              <button
                onClick={() => handleSendMessage()}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Análisis */}
      {activeTab === 'analysis' && marketAnalysis && (
        <div className="space-y-6">
          {/* Resumen */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">📊 Análisis de Mercado</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700 p-4 rounded">
                <div className="text-sm text-gray-400">Tendencia</div>
                <div className={`text-2xl font-bold ${getTrendColor(marketAnalysis.trend)}`}>
                  {marketAnalysis.trend === 'bullish' ? '🟢 Alcista' : '🔴 Bajista'}
                </div>
                <div className="text-sm text-gray-400">
                  Confianza: <span className={getConfidenceColor(marketAnalysis.confidence)}>
                    {(marketAnalysis.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded">
                <div className="text-sm text-gray-400">RSI</div>
                <div className="text-2xl font-bold text-blue-400">{marketAnalysis.indicators.rsi}</div>
                <div className="text-sm text-gray-400">
                  {marketAnalysis.indicators.rsi > 70 ? 'Sobrecompra' : 
                   marketAnalysis.indicators.rsi < 30 ? 'Sobreventa' : 'Neutral'}
                </div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded">
                <div className="text-sm text-gray-400">Sentimiento</div>
                <div className="text-2xl font-bold text-purple-400">
                  {(marketAnalysis.sentiment.score * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-400">Positivo</div>
              </div>
            </div>
          </div>

          {/* Niveles Clave */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">🎯 Niveles Clave</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-green-400 mb-2">Soporte</h4>
                <div className="space-y-2">
                  {marketAnalysis.key_levels.support.map((level, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                      <span>S${index + 1}</span>
                      <span className="font-semibold">${level.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-red-400 mb-2">Resistencia</h4>
                <div className="space-y-2">
                  {marketAnalysis.key_levels.resistance.map((level, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                      <span>R${index + 1}</span>
                      <span className="font-semibold">${level.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Predicciones */}
      {activeTab === 'predictions' && (
        <div className="space-y-6">
          {predictions.map((prediction, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">{prediction.symbol}</h3>
                <div className="text-sm text-gray-400">{prediction.timeframe}</div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-700 p-4 rounded">
                  <div className="text-sm text-gray-400">Precio Objetivo</div>
                  <div className="text-2xl font-bold text-blue-400">
                    ${prediction.prediction.price.toLocaleString()}
                  </div>
                </div>
                
                <div className="bg-gray-700 p-4 rounded">
                  <div className="text-sm text-gray-400">Dirección</div>
                  <div className={`text-2xl font-bold ${
                    prediction.prediction.direction === 'up' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {prediction.prediction.direction === 'up' ? '🟢 Alcista' : '🔴 Bajista'}
                  </div>
                </div>
                
                <div className="bg-gray-700 p-4 rounded">
                  <div className="text-sm text-gray-400">Confianza</div>
                  <div className={`text-2xl font-bold ${getConfidenceColor(prediction.prediction.confidence)}`}>
                    {(prediction.prediction.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Razonamiento</h4>
                <div className="space-y-1">
                  {prediction.reasoning.map((reason, reasonIndex) => (
                    <div key={reasonIndex} className="flex items-center space-x-2 text-sm">
                      <span className="text-green-400">•</span>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Voz */}
      {activeTab === 'voice' && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">🎤 Control por Voz</h3>
          
          <div className="text-center space-y-6">
            <div className="text-6xl">
              {isListening ? '🎤' : '🔇'}
            </div>
            
            <div className="text-lg">
              {isListening ? 'Escuchando...' : 'Presiona para hablar'}
            </div>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={startVoiceInput}
                disabled={isListening}
                className={`px-6 py-3 rounded font-semibold ${
                  isListening 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                🎤 Iniciar
              </button>
              
              <button
                onClick={stopVoiceInput}
                disabled={!isListening}
                className={`px-6 py-3 rounded font-semibold ${
                  !isListening 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                ⏹️ Detener
              </button>
            </div>
            
            <div className="text-sm text-gray-400">
              Comandos de voz disponibles:
              <br />
              "Análisis de mercado", "Predicción de precio", "Análisis de riesgo", "Optimizar estrategia"
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
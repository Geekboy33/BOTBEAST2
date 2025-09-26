// src/components/LiveLog.tsx
import React, { useEffect, useRef, useState } from "react";
import useWebSocket from "../hooks/useWebSocket";
import LoadingSpinner from "./LoadingSpinner";

type LogMessage = {
  timestamp: string;
  type: string;
  symbol: string;
  side?: string;
  price?: number;
  orderflow?: number;
  pair_signal?: number;
  sentiment?: number;
  smc_score?: number;
};

export default function LiveLog() {
  const [messages, setMessages] = useState<LogMessage[]>([]);
  const { ws, connectionState, lastError } = useWebSocket("ws://localhost:8000/ws");

  useEffect(() => {
    if (!ws || connectionState !== 'connected') return;
    
    ws.onmessage = (event) => {
      try {
        const data: LogMessage = JSON.parse(event.data);
        setMessages((prev) => [...prev, data].slice(-200)); // keep last 200
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }, [ws, connectionState]);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getMessageColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'buy': return 'text-green-400';
      case 'sell': return 'text-red-400';
      case 'error': return 'text-red-500';
      case 'warning': return 'text-yellow-400';
      default: return 'text-white';
    }
  };

  if (connectionState === 'connecting') {
    return (
      <div className="bg-gray-800 rounded-lg p-4 h-80 flex items-center justify-center">
        <LoadingSpinner text="Conectando..." />
      </div>
    );
  }

  if (connectionState === 'error') {
    return (
      <div className="bg-gray-800 rounded-lg p-4 h-80 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-2">⚠️</div>
          <p className="text-red-400 font-semibold">Error de conexión</p>
          <p className="text-gray-400 text-sm">{lastError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 h-80 overflow-y-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Log en Tiempo Real</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionState === 'connected' ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-xs text-gray-400">
            {connectionState === 'connected' ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>
      
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-400">
          Esperando mensajes...
        </div>
      ) : (
        messages.map((msg, i) => (
          <div key={i} className="text-sm mb-1 hover:bg-gray-700 p-1 rounded">
            <span className="text-gray-500">[{msg.timestamp}]</span>{' '}
            <span className={`font-semibold ${getMessageColor(msg.type)}`}>
              {msg.type.toUpperCase()}
            </span>{' '}
            <span className="text-blue-400">{msg.symbol}</span>
            {msg.side && (
              <span className={`ml-2 ${getMessageColor(msg.side)}`}>
                {msg.side.toUpperCase()}
              </span>
            )}
            {msg.price && (
              <span className="text-green-400 ml-2">
                @ ${msg.price.toFixed(2)}
              </span>
            )}
            {msg.orderflow !== undefined && (
              <span className="text-yellow-400 ml-2">
                OF:{msg.orderflow.toFixed(2)}
              </span>
            )}
            {msg.pair_signal !== undefined && (
              <span className="text-purple-400 ml-2">
                PS:{msg.pair_signal}
              </span>
            )}
            {msg.sentiment !== undefined && (
              <span className="text-cyan-400 ml-2">
                Sent:{msg.sentiment.toFixed(2)}
              </span>
            )}
            {msg.smc_score !== undefined && (
              <span className="text-orange-400 ml-2">
                SMC:{msg.smc_score}
              </span>
            )}
          </div>
        ))
      )}
      <div ref={scrollRef} />
    </div>
  );
}

// src/hooks/useWebSocket.ts (versión mejorada)
import { useEffect, useRef, useState, useCallback } from "react";

interface WebSocketOptions {
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onError?: (error: Event) => void;
  onReconnect?: (attempt: number) => void;
}

export default function useWebSocket(
  url: string, 
  options: WebSocketOptions = {}
) {
  const {
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onError,
    onReconnect
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastError, setLastError] = useState<string | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionState('connecting');
    setLastError(null);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionState('connected');
        reconnectAttemptsRef.current = 0;
        console.log('WebSocket connected');
      };

      ws.onclose = (event) => {
        setConnectionState('disconnected');
        console.log('WebSocket disconnected:', event.code, event.reason);
        
        // Attempt to reconnect if not a clean close
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          onReconnect?.(reconnectAttemptsRef.current);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        setConnectionState('error');
        setLastError('Error de conexión WebSocket');
        onError?.(error);
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      setConnectionState('error');
      setLastError('Error al crear conexión WebSocket');
      console.error('Error creating WebSocket:', error);
    }
  }, [url, reconnectInterval, maxReconnectAttempts, onError, onReconnect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setConnectionState('disconnected');
  }, []);

  const sendMessage = useCallback((message: string | object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const data = typeof message === 'string' ? message : JSON.stringify(message);
      wsRef.current.send(data);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    ws: wsRef.current,
    connectionState,
    lastError,
    sendMessage,
    reconnect: connect,
    disconnect
  };
}
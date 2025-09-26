"""
Sistema de cache Redis para optimización de rendimiento
"""
import json
import pickle
import hashlib
from typing import Any, Dict, List, Optional, Union, Callable
from datetime import datetime, timedelta
import redis
import redis.sentinel
from redis.connection import ConnectionPool
import structlog

logger = structlog.get_logger(__name__)

class RedisConfig:
    """Configuración de Redis"""
    
    def __init__(self):
        self.host = 'localhost'
        self.port = 6379
        self.db = 0
        self.password = None
        self.max_connections = 20
        self.socket_timeout = 5
        self.socket_connect_timeout = 5
        self.retry_on_timeout = True
        self.health_check_interval = 30
        
        # Configuración de clusters
        self.use_sentinel = False
        self.sentinel_hosts = []
        self.sentinel_master_name = 'mymaster'
        
        # Configuración de cache
        self.default_ttl = 3600  # 1 hora
        self.key_prefix = 'grok_beast:'
        self.compression_enabled = True

class RedisCacheManager:
    """Gestor de cache Redis"""
    
    def __init__(self, config: RedisConfig = None):
        self.config = config or RedisConfig()
        self.connection_pool = None
        self.redis_client = None
        self._initialize_connection()
    
    def _initialize_connection(self):
        """Inicializar conexión Redis"""
        try:
            if self.config.use_sentinel:
                # Configuración con Sentinel para alta disponibilidad
                sentinel = redis.sentinel.Sentinel(
                    self.config.sentinel_hosts,
                    socket_timeout=self.config.socket_timeout,
                    socket_connect_timeout=self.config.socket_connect_timeout,
                    retry_on_timeout=self.config.retry_on_timeout
                )
                self.redis_client = sentinel.master_for(
                    self.config.sentinel_master_name,
                    socket_timeout=self.config.socket_timeout,
                    socket_connect_timeout=self.config.socket_connect_timeout,
                    retry_on_timeout=self.config.retry_on_timeout
                )
            else:
                # Configuración estándar
                self.connection_pool = ConnectionPool(
                    host=self.config.host,
                    port=self.config.port,
                    db=self.config.db,
                    password=self.config.password,
                    max_connections=self.config.max_connections,
                    socket_timeout=self.config.socket_timeout,
                    socket_connect_timeout=self.config.socket_connect_timeout,
                    retry_on_timeout=self.config.retry_on_timeout,
                    health_check_interval=self.config.health_check_interval
                )
                
                self.redis_client = redis.Redis(
                    connection_pool=self.connection_pool,
                    decode_responses=False  # Para compatibilidad con pickle
                )
            
            # Test de conexión
            self.redis_client.ping()
            logger.info("Redis connection established successfully")
            
        except Exception as e:
            logger.error("Redis connection failed", error=str(e))
            raise ConnectionError(f"Failed to connect to Redis: {str(e)}")
    
    def _generate_cache_key(self, key: str, namespace: str = None) -> str:
        """Generar clave de cache"""
        if namespace:
            return f"{self.config.key_prefix}{namespace}:{key}"
        return f"{self.config.key_prefix}{key}"
    
    def _serialize_data(self, data: Any) -> bytes:
        """Serializar datos para cache"""
        if self.config.compression_enabled and len(str(data)) > 1024:
            # Usar pickle para objetos complejos
            return pickle.dumps(data)
        else:
            # Usar JSON para datos simples
            return json.dumps(data, default=str).encode('utf-8')
    
    def _deserialize_data(self, data: bytes) -> Any:
        """Deserializar datos del cache"""
        try:
            # Intentar deserializar con pickle primero
            return pickle.loads(data)
        except:
            try:
                # Fallback a JSON
                return json.loads(data.decode('utf-8'))
            except:
                # Fallback a string
                return data.decode('utf-8')
    
    def set(self, key: str, value: Any, ttl: int = None, namespace: str = None) -> bool:
        """Establecer valor en cache"""
        try:
            cache_key = self._generate_cache_key(key, namespace)
            serialized_value = self._serialize_data(value)
            ttl = ttl or self.config.default_ttl
            
            result = self.redis_client.setex(cache_key, ttl, serialized_value)
            
            logger.debug("Cache set", key=cache_key, ttl=ttl, size=len(serialized_value))
            return result
            
        except Exception as e:
            logger.error("Cache set error", key=key, error=str(e))
            return False
    
    def get(self, key: str, namespace: str = None) -> Optional[Any]:
        """Obtener valor del cache"""
        try:
            cache_key = self._generate_cache_key(key, namespace)
            data = self.redis_client.get(cache_key)
            
            if data is None:
                return None
            
            deserialized_data = self._deserialize_data(data)
            logger.debug("Cache hit", key=cache_key)
            return deserialized_data
            
        except Exception as e:
            logger.error("Cache get error", key=key, error=str(e))
            return None
    
    def delete(self, key: str, namespace: str = None) -> bool:
        """Eliminar valor del cache"""
        try:
            cache_key = self._generate_cache_key(key, namespace)
            result = self.redis_client.delete(cache_key)
            
            logger.debug("Cache delete", key=cache_key, result=result)
            return bool(result)
            
        except Exception as e:
            logger.error("Cache delete error", key=key, error=str(e))
            return False
    
    def exists(self, key: str, namespace: str = None) -> bool:
        """Verificar si existe clave en cache"""
        try:
            cache_key = self._generate_cache_key(key, namespace)
            return bool(self.redis_client.exists(cache_key))
        except Exception as e:
            logger.error("Cache exists error", key=key, error=str(e))
            return False
    
    def expire(self, key: str, ttl: int, namespace: str = None) -> bool:
        """Establecer TTL para clave existente"""
        try:
            cache_key = self._generate_cache_key(key, namespace)
            return bool(self.redis_client.expire(cache_key, ttl))
        except Exception as e:
            logger.error("Cache expire error", key=key, error=str(e))
            return False
    
    def ttl(self, key: str, namespace: str = None) -> int:
        """Obtener TTL de clave"""
        try:
            cache_key = self._generate_cache_key(key, namespace)
            return self.redis_client.ttl(cache_key)
        except Exception as e:
            logger.error("Cache TTL error", key=key, error=str(e))
            return -1
    
    def clear_namespace(self, namespace: str) -> int:
        """Limpiar todas las claves de un namespace"""
        try:
            pattern = f"{self.config.key_prefix}{namespace}:*"
            keys = self.redis_client.keys(pattern)
            
            if keys:
                result = self.redis_client.delete(*keys)
                logger.info("Namespace cleared", namespace=namespace, keys_deleted=result)
                return result
            
            return 0
            
        except Exception as e:
            logger.error("Clear namespace error", namespace=namespace, error=str(e))
            return 0
    
    def get_stats(self) -> Dict[str, Any]:
        """Obtener estadísticas de cache"""
        try:
            info = self.redis_client.info()
            
            stats = {
                'connected_clients': info.get('connected_clients', 0),
                'used_memory': info.get('used_memory_human', '0B'),
                'used_memory_peak': info.get('used_memory_peak_human', '0B'),
                'total_commands_processed': info.get('total_commands_processed', 0),
                'keyspace_hits': info.get('keyspace_hits', 0),
                'keyspace_misses': info.get('keyspace_misses', 0),
                'uptime_in_seconds': info.get('uptime_in_seconds', 0),
                'db_size': self.redis_client.dbsize()
            }
            
            # Calcular hit ratio
            hits = stats['keyspace_hits']
            misses = stats['keyspace_misses']
            total = hits + misses
            
            if total > 0:
                stats['hit_ratio'] = round((hits / total) * 100, 2)
            else:
                stats['hit_ratio'] = 0
            
            return stats
            
        except Exception as e:
            logger.error("Cache stats error", error=str(e))
            return {}

class CacheDecorator:
    """Decorator para cache automático"""
    
    def __init__(self, cache_manager: RedisCacheManager):
        self.cache_manager = cache_manager
    
    def cache_result(self, ttl: int = None, namespace: str = None, key_func: Callable = None):
        """Decorator para cachear resultado de función"""
        def decorator(func: Callable):
            def wrapper(*args, **kwargs):
                # Generar clave de cache
                if key_func:
                    cache_key = key_func(*args, **kwargs)
                else:
                    # Generar clave basada en función y argumentos
                    key_data = f"{func.__name__}:{str(args)}:{str(sorted(kwargs.items()))}"
                    cache_key = hashlib.md5(key_data.encode()).hexdigest()
                
                # Intentar obtener del cache
                cached_result = self.cache_manager.get(cache_key, namespace)
                if cached_result is not None:
                    logger.debug("Cache hit for function", function=func.__name__, key=cache_key)
                    return cached_result
                
                # Ejecutar función y cachear resultado
                result = func(*args, **kwargs)
                self.cache_manager.set(cache_key, result, ttl, namespace)
                
                logger.debug("Cache miss for function", function=func.__name__, key=cache_key)
                return result
            
            return wrapper
        return decorator

class TradingDataCache:
    """Cache especializado para datos de trading"""
    
    def __init__(self, cache_manager: RedisCacheManager):
        self.cache_manager = cache_manager
        self.namespace = "trading_data"
    
    def cache_market_data(self, symbol: str, timeframe: str, data: Any, ttl: int = 300):
        """Cachear datos de mercado"""
        key = f"market_data:{symbol}:{timeframe}"
        return self.cache_manager.set(key, data, ttl, self.namespace)
    
    def get_market_data(self, symbol: str, timeframe: str) -> Optional[Any]:
        """Obtener datos de mercado del cache"""
        key = f"market_data:{symbol}:{timeframe}"
        return self.cache_manager.get(key, self.namespace)
    
    def cache_technical_analysis(self, symbol: str, analysis_type: str, result: Any, ttl: int = 600):
        """Cachear análisis técnico"""
        key = f"technical_analysis:{symbol}:{analysis_type}"
        return self.cache_manager.set(key, result, ttl, self.namespace)
    
    def get_technical_analysis(self, symbol: str, analysis_type: str) -> Optional[Any]:
        """Obtener análisis técnico del cache"""
        key = f"technical_analysis:{symbol}:{analysis_type}"
        return self.cache_manager.get(key, self.namespace)
    
    def cache_autopilot_signals(self, signals: List[Dict], ttl: int = 60):
        """Cachear señales de autopilot"""
        key = "autopilot_signals"
        return self.cache_manager.set(key, signals, ttl, self.namespace)
    
    def get_autopilot_signals(self) -> Optional[List[Dict]]:
        """Obtener señales de autopilot del cache"""
        key = "autopilot_signals"
        return self.cache_manager.get(key, self.namespace)
    
    def cache_exchange_balances(self, exchange: str, balances: Dict, ttl: int = 300):
        """Cachear balances de exchange"""
        key = f"exchange_balances:{exchange}"
        return self.cache_manager.set(key, balances, ttl, self.namespace)
    
    def get_exchange_balances(self, exchange: str) -> Optional[Dict]:
        """Obtener balances de exchange del cache"""
        key = f"exchange_balances:{exchange}"
        return self.cache_manager.get(key, self.namespace)
    
    def invalidate_symbol_data(self, symbol: str):
        """Invalidar todos los datos de un símbolo"""
        patterns = [
            f"market_data:{symbol}:*",
            f"technical_analysis:{symbol}:*"
        ]
        
        for pattern in patterns:
            keys = self.cache_manager.redis_client.keys(
                f"{self.cache_manager.config.key_prefix}{self.namespace}:{pattern}"
            )
            if keys:
                self.cache_manager.redis_client.delete(*keys)
        
        logger.info("Symbol data invalidated", symbol=symbol)

class SessionCache:
    """Cache para sesiones de usuario"""
    
    def __init__(self, cache_manager: RedisCacheManager):
        self.cache_manager = cache_manager
        self.namespace = "sessions"
        self.session_ttl = 3600  # 1 hora
    
    def store_session(self, session_id: str, session_data: Dict, ttl: int = None):
        """Almacenar sesión"""
        ttl = ttl or self.session_ttl
        return self.cache_manager.set(session_id, session_data, ttl, self.namespace)
    
    def get_session(self, session_id: str) -> Optional[Dict]:
        """Obtener sesión"""
        return self.cache_manager.get(session_id, self.namespace)
    
    def delete_session(self, session_id: str):
        """Eliminar sesión"""
        return self.cache_manager.delete(session_id, self.namespace)
    
    def extend_session(self, session_id: str, ttl: int = None):
        """Extender sesión"""
        ttl = ttl or self.session_ttl
        return self.cache_manager.expire(session_id, ttl, self.namespace)

# Instancias globales
redis_config = RedisConfig()
cache_manager = RedisCacheManager(redis_config)
cache_decorator = CacheDecorator(cache_manager)
trading_cache = TradingDataCache(cache_manager)
session_cache = SessionCache(cache_manager)

# Funciones de utilidad
def cache_market_data(ttl: int = 300):
    """Decorator para cachear datos de mercado"""
    return cache_decorator.cache_result(ttl=ttl, namespace="trading_data")

def cache_analysis_result(ttl: int = 600):
    """Decorator para cachear resultados de análisis"""
    return cache_decorator.cache_result(ttl=ttl, namespace="analysis")

def cache_api_response(ttl: int = 300):
    """Decorator para cachear respuestas de API"""
    return cache_decorator.cache_result(ttl=ttl, namespace="api")

def get_cache_stats() -> Dict[str, Any]:
    """Obtener estadísticas de cache"""
    return cache_manager.get_stats()

def clear_all_caches():
    """Limpiar todos los caches"""
    namespaces = ["trading_data", "analysis", "api", "sessions"]
    total_cleared = 0
    
    for namespace in namespaces:
        cleared = cache_manager.clear_namespace(namespace)
        total_cleared += cleared
    
    logger.info("All caches cleared", total_keys=total_cleared)
    return total_cleared




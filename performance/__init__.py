# Performance optimization package for Grok-Beast Trading Bot
from .redis_cache import (
    RedisConfig,
    RedisCacheManager,
    CacheDecorator,
    TradingDataCache,
    SessionCache,
    cache_market_data,
    cache_analysis_result,
    cache_api_response,
    get_cache_stats,
    clear_all_caches
)
from .database_optimization import (
    DatabaseConfig,
    DatabaseConnectionPool,
    DatabaseIndexManager,
    QueryOptimizer,
    DatabaseMaintenance,
    BulkInsertManager,
    initialize_database,
    get_async_session,
    get_sync_session
)

__all__ = [
    # Redis Cache
    'RedisConfig',
    'RedisCacheManager',
    'CacheDecorator',
    'TradingDataCache',
    'SessionCache',
    'cache_market_data',
    'cache_analysis_result',
    'cache_api_response',
    'get_cache_stats',
    'clear_all_caches',
    
    # Database Optimization
    'DatabaseConfig',
    'DatabaseConnectionPool',
    'DatabaseIndexManager',
    'QueryOptimizer',
    'DatabaseMaintenance',
    'BulkInsertManager',
    'initialize_database',
    'get_async_session',
    'get_sync_session'
]




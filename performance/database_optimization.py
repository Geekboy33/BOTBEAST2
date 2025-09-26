"""
Optimización de base de datos para Grok-Beast Trading Bot
"""
import asyncio
import sqlite3
from typing import Dict, List, Any, Optional, Union
from datetime import datetime, timedelta
from contextlib import asynccontextmanager, contextmanager
from dataclasses import dataclass
import aiosqlite
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text, Index, MetaData, Table, Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool, StaticPool
import structlog

logger = structlog.get_logger(__name__)

@dataclass
class DatabaseConfig:
    """Configuración de base de datos"""
    # SQLite
    sqlite_path: str = "trading_bot.db"
    sqlite_pool_size: int = 20
    sqlite_pool_timeout: int = 30
    sqlite_pool_recycle: int = 3600
    
    # PostgreSQL (para producción)
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "grok_beast"
    postgres_user: str = "grok_beast"
    postgres_password: str = ""
    
    # Configuración general
    connection_timeout: int = 30
    query_timeout: int = 60
    enable_wal_mode: bool = True
    enable_foreign_keys: bool = True
    synchronous_mode: str = "NORMAL"  # OFF, NORMAL, FULL
    cache_size: int = 10000
    page_size: int = 4096

class DatabaseConnectionPool:
    """Pool de conexiones de base de datos"""
    
    def __init__(self, config: DatabaseConfig):
        self.config = config
        self.engine = None
        self.async_engine = None
        self.session_factory = None
        self.async_session_factory = None
        self._initialize_engines()
    
    def _initialize_engines(self):
        """Inicializar motores de base de datos"""
        # SQLite síncrono
        sqlite_url = f"sqlite:///{self.config.sqlite_path}"
        
        self.engine = create_engine(
            sqlite_url,
            poolclass=QueuePool,
            pool_size=self.config.sqlite_pool_size,
            pool_timeout=self.config.sqlite_pool_timeout,
            pool_recycle=self.config.sqlite_pool_recycle,
            pool_pre_ping=True,
            connect_args={
                "timeout": self.config.connection_timeout,
                "check_same_thread": False
            }
        )
        
        # SQLite asíncrono
        async_sqlite_url = f"sqlite+aiosqlite:///{self.config.sqlite_path}"
        
        self.async_engine = create_async_engine(
            async_sqlite_url,
            poolclass=StaticPool,
            connect_args={
                "timeout": self.config.connection_timeout,
                "check_same_thread": False
            }
        )
        
        # Session factories
        self.session_factory = sessionmaker(bind=self.engine)
        self.async_session_factory = sessionmaker(
            bind=self.async_engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
        
        logger.info("Database engines initialized")
    
    @contextmanager
    def get_session(self):
        """Obtener sesión síncrona"""
        session = self.session_factory()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error("Database session error", error=str(e))
            raise
        finally:
            session.close()
    
    @asynccontextmanager
    async def get_async_session(self):
        """Obtener sesión asíncrona"""
        session = self.async_session_factory()
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error("Async database session error", error=str(e))
            raise
        finally:
            await session.close()
    
    def optimize_sqlite(self):
        """Optimizar configuración de SQLite"""
        with self.get_session() as session:
            # Habilitar WAL mode
            if self.config.enable_wal_mode:
                session.execute(text("PRAGMA journal_mode=WAL"))
            
            # Configurar foreign keys
            if self.config.enable_foreign_keys:
                session.execute(text("PRAGMA foreign_keys=ON"))
            
            # Configurar synchronous mode
            session.execute(text(f"PRAGMA synchronous={self.config.synchronous_mode}"))
            
            # Configurar cache size
            session.execute(text(f"PRAGMA cache_size={self.config.cache_size}"))
            
            # Configurar page size
            session.execute(text(f"PRAGMA page_size={self.config.page_size}"))
            
            # Habilitar query optimizer
            session.execute(text("PRAGMA optimize"))
            
            logger.info("SQLite optimized")

class DatabaseIndexManager:
    """Gestor de índices de base de datos"""
    
    def __init__(self, engine):
        self.engine = engine
        self.metadata = MetaData()
        self._create_tables()
        self._create_indexes()
    
    def _create_tables(self):
        """Crear tablas optimizadas"""
        # Tabla de órdenes
        self.orders_table = Table(
            'orders',
            self.metadata,
            Column('id', String, primary_key=True),
            Column('symbol', String, nullable=False),
            Column('side', String, nullable=False),
            Column('type', String, nullable=False),
            Column('quantity', Float, nullable=False),
            Column('price', Float),
            Column('stop_price', Float),
            Column('status', String, nullable=False),
            Column('created_at', DateTime, nullable=False),
            Column('updated_at', DateTime, nullable=False),
            Column('pnl', Float, default=0),
            Column('fees', Float, default=0),
            Column('exchange', String),
            Column('order_id', String),
            Column('user_id', String),
            extend_existing=True
        )
        
        # Tabla de trades
        self.trades_table = Table(
            'trades',
            self.metadata,
            Column('id', String, primary_key=True),
            Column('order_id', String, nullable=False),
            Column('symbol', String, nullable=False),
            Column('side', String, nullable=False),
            Column('quantity', Float, nullable=False),
            Column('price', Float, nullable=False),
            Column('timestamp', DateTime, nullable=False),
            Column('pnl', Float, default=0),
            Column('fees', Float, default=0),
            Column('exchange', String),
            Column('user_id', String),
            extend_existing=True
        )
        
        # Tabla de métricas
        self.metrics_table = Table(
            'metrics',
            self.metadata,
            Column('id', Integer, primary_key=True, autoincrement=True),
            Column('timestamp', DateTime, nullable=False),
            Column('metric_name', String, nullable=False),
            Column('metric_value', Float, nullable=False),
            Column('metric_type', String),
            Column('symbol', String),
            Column('exchange', String),
            Column('user_id', String),
            extend_existing=True
        )
        
        # Tabla de análisis técnico
        self.technical_analysis_table = Table(
            'technical_analysis',
            self.metadata,
            Column('id', Integer, primary_key=True, autoincrement=True),
            Column('timestamp', DateTime, nullable=False),
            Column('symbol', String, nullable=False),
            Column('analysis_type', String, nullable=False),
            Column('timeframe', String, nullable=False),
            Column('result', String, nullable=False),  # JSON
            Column('confidence', Float),
            Column('exchange', String),
            extend_existing=True
        )
    
    def _create_indexes(self):
        """Crear índices para optimización"""
        # Índices para órdenes
        Index('idx_orders_symbol', self.orders_table.c.symbol)
        Index('idx_orders_status', self.orders_table.c.status)
        Index('idx_orders_created_at', self.orders_table.c.created_at)
        Index('idx_orders_user_id', self.orders_table.c.user_id)
        Index('idx_orders_exchange', self.orders_table.c.exchange)
        Index('idx_orders_symbol_status', self.orders_table.c.symbol, self.orders_table.c.status)
        
        # Índices para trades
        Index('idx_trades_order_id', self.trades_table.c.order_id)
        Index('idx_trades_symbol', self.trades_table.c.symbol)
        Index('idx_trades_timestamp', self.trades_table.c.timestamp)
        Index('idx_trades_user_id', self.trades_table.c.user_id)
        Index('idx_trades_exchange', self.trades_table.c.exchange)
        Index('idx_trades_symbol_timestamp', self.trades_table.c.symbol, self.trades_table.c.timestamp)
        
        # Índices para métricas
        Index('idx_metrics_timestamp', self.metrics_table.c.timestamp)
        Index('idx_metrics_name', self.metrics_table.c.metric_name)
        Index('idx_metrics_symbol', self.metrics_table.c.symbol)
        Index('idx_metrics_user_id', self.metrics_table.c.user_id)
        Index('idx_metrics_name_timestamp', self.metrics_table.c.metric_name, self.metrics_table.c.timestamp)
        
        # Índices para análisis técnico
        Index('idx_ta_symbol', self.technical_analysis_table.c.symbol)
        Index('idx_ta_type', self.technical_analysis_table.c.analysis_type)
        Index('idx_ta_timestamp', self.technical_analysis_table.c.timestamp)
        Index('idx_ta_symbol_type', self.technical_analysis_table.c.symbol, self.technical_analysis_table.c.analysis_type)
    
    def create_all_indexes(self):
        """Crear todos los índices"""
        try:
            self.metadata.create_all(self.engine)
            logger.info("Database indexes created successfully")
        except Exception as e:
            logger.error("Error creating indexes", error=str(e))
            raise

class QueryOptimizer:
    """Optimizador de consultas"""
    
    def __init__(self, connection_pool: DatabaseConnectionPool):
        self.connection_pool = connection_pool
    
    async def get_trades_by_symbol_optimized(self, symbol: str, limit: int = 100, offset: int = 0) -> List[Dict]:
        """Obtener trades por símbolo optimizado"""
        query = text("""
            SELECT id, order_id, symbol, side, quantity, price, timestamp, pnl, fees, exchange
            FROM trades 
            WHERE symbol = :symbol 
            ORDER BY timestamp DESC 
            LIMIT :limit OFFSET :offset
        """)
        
        async with self.connection_pool.get_async_session() as session:
            result = await session.execute(query, {"symbol": symbol, "limit": limit, "offset": offset})
            return [dict(row) for row in result]
    
    async def get_metrics_by_timeframe(self, metric_name: str, start_time: datetime, end_time: datetime) -> List[Dict]:
        """Obtener métricas por timeframe optimizado"""
        query = text("""
            SELECT timestamp, metric_value, symbol, exchange
            FROM metrics 
            WHERE metric_name = :metric_name 
            AND timestamp BETWEEN :start_time AND :end_time
            ORDER BY timestamp ASC
        """)
        
        async with self.connection_pool.get_async_session() as session:
            result = await session.execute(query, {
                "metric_name": metric_name,
                "start_time": start_time,
                "end_time": end_time
            })
            return [dict(row) for row in result]
    
    async def get_technical_analysis_latest(self, symbol: str, analysis_type: str, limit: int = 10) -> List[Dict]:
        """Obtener análisis técnico más reciente optimizado"""
        query = text("""
            SELECT timestamp, analysis_type, timeframe, result, confidence
            FROM technical_analysis 
            WHERE symbol = :symbol 
            AND analysis_type = :analysis_type
            ORDER BY timestamp DESC 
            LIMIT :limit
        """)
        
        async with self.connection_pool.get_async_session() as session:
            result = await session.execute(query, {
                "symbol": symbol,
                "analysis_type": analysis_type,
                "limit": limit
            })
            return [dict(row) for row in result]
    
    async def get_portfolio_performance(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """Obtener rendimiento de portfolio optimizado"""
        query = text("""
            SELECT 
                COUNT(*) as total_trades,
                SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as winning_trades,
                SUM(pnl) as total_pnl,
                AVG(pnl) as avg_pnl,
                MIN(pnl) as min_pnl,
                MAX(pnl) as max_pnl,
                SUM(fees) as total_fees
            FROM trades 
            WHERE user_id = :user_id 
            AND timestamp >= datetime('now', '-' || :days || ' days')
        """)
        
        async with self.connection_pool.get_async_session() as session:
            result = await session.execute(query, {"user_id": user_id, "days": days})
            row = result.fetchone()
            
            if row:
                total_trades = row.total_trades
                win_rate = (row.winning_trades / total_trades * 100) if total_trades > 0 else 0
                
                return {
                    "total_trades": total_trades,
                    "winning_trades": row.winning_trades,
                    "win_rate": round(win_rate, 2),
                    "total_pnl": row.total_pnl or 0,
                    "avg_pnl": row.avg_pnl or 0,
                    "min_pnl": row.min_pnl or 0,
                    "max_pnl": row.max_pnl or 0,
                    "total_fees": row.total_fees or 0
                }
            
            return {}

class DatabaseMaintenance:
    """Mantenimiento de base de datos"""
    
    def __init__(self, connection_pool: DatabaseConnectionPool):
        self.connection_pool = connection_pool
    
    def vacuum_database(self):
        """Ejecutar VACUUM en la base de datos"""
        with self.connection_pool.get_session() as session:
            session.execute(text("VACUUM"))
            logger.info("Database vacuum completed")
    
    def analyze_database(self):
        """Ejecutar ANALYZE en la base de datos"""
        with self.connection_pool.get_session() as session:
            session.execute(text("ANALYZE"))
            logger.info("Database analysis completed")
    
    def reindex_database(self):
        """Reindexar base de datos"""
        with self.connection_pool.get_session() as session:
            session.execute(text("REINDEX"))
            logger.info("Database reindexing completed")
    
    def get_database_stats(self) -> Dict[str, Any]:
        """Obtener estadísticas de base de datos"""
        with self.connection_pool.get_session() as session:
            # Tamaño de la base de datos
            size_query = text("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()")
            size_result = session.execute(size_query).fetchone()
            
            # Estadísticas de tablas
            tables_query = text("""
                SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
            """)
            tables = [row.name for row in session.execute(tables_query)]
            
            table_stats = {}
            for table in tables:
                count_query = text(f"SELECT COUNT(*) as count FROM {table}")
                count_result = session.execute(count_query).fetchone()
                table_stats[table] = count_result.count
            
            return {
                "database_size_bytes": size_result.size if size_result else 0,
                "database_size_mb": round(size_result.size / (1024 * 1024), 2) if size_result else 0,
                "table_counts": table_stats,
                "total_tables": len(tables)
            }
    
    def cleanup_old_data(self, days_to_keep: int = 90):
        """Limpiar datos antiguos"""
        cutoff_date = datetime.now() - timedelta(days=days_to_keep)
        
        with self.connection_pool.get_session() as session:
            # Limpiar métricas antiguas
            metrics_query = text("DELETE FROM metrics WHERE timestamp < :cutoff_date")
            metrics_result = session.execute(metrics_query, {"cutoff_date": cutoff_date})
            
            # Limpiar análisis técnico antiguo
            ta_query = text("DELETE FROM technical_analysis WHERE timestamp < :cutoff_date")
            ta_result = session.execute(ta_query, {"cutoff_date": cutoff_date})
            
            logger.info("Old data cleanup completed", 
                       metrics_deleted=metrics_result.rowcount,
                       analysis_deleted=ta_result.rowcount)

class BulkInsertManager:
    """Gestor de inserciones masivas"""
    
    def __init__(self, connection_pool: DatabaseConnectionPool):
        self.connection_pool = connection_pool
    
    async def bulk_insert_trades(self, trades_data: List[Dict]):
        """Inserción masiva de trades"""
        if not trades_data:
            return
        
        query = text("""
            INSERT INTO trades (id, order_id, symbol, side, quantity, price, timestamp, pnl, fees, exchange, user_id)
            VALUES (:id, :order_id, :symbol, :side, :quantity, :price, :timestamp, :pnl, :fees, :exchange, :user_id)
        """)
        
        async with self.connection_pool.get_async_session() as session:
            await session.execute(query, trades_data)
            logger.info("Bulk insert trades completed", count=len(trades_data))
    
    async def bulk_insert_metrics(self, metrics_data: List[Dict]):
        """Inserción masiva de métricas"""
        if not metrics_data:
            return
        
        query = text("""
            INSERT INTO metrics (timestamp, metric_name, metric_value, metric_type, symbol, exchange, user_id)
            VALUES (:timestamp, :metric_name, :metric_value, :metric_type, :symbol, :exchange, :user_id)
        """)
        
        async with self.connection_pool.get_async_session() as session:
            await session.execute(query, metrics_data)
            logger.info("Bulk insert metrics completed", count=len(metrics_data))

# Instancias globales
db_config = DatabaseConfig()
connection_pool = DatabaseConnectionPool(db_config)
index_manager = DatabaseIndexManager(connection_pool.engine)
query_optimizer = QueryOptimizer(connection_pool)
maintenance = DatabaseMaintenance(connection_pool)
bulk_insert = BulkInsertManager(connection_pool)

# Funciones de utilidad
def initialize_database():
    """Inicializar base de datos"""
    connection_pool.optimize_sqlite()
    index_manager.create_all_indexes()
    logger.info("Database initialized successfully")

async def get_async_session():
    """Obtener sesión asíncrona"""
    async with connection_pool.get_async_session() as session:
        yield session

def get_sync_session():
    """Obtener sesión síncrona"""
    with connection_pool.get_session() as session:
        yield session




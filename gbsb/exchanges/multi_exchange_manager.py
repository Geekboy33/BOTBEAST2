"""
Módulo de gestión de múltiples exchanges
Implementa conexión y gestión de APIs de Binance, Kraken, KuCoin, OKX y otros exchanges
"""

import asyncio
import aiohttp
import ccxt
import ccxt.async_support as ccxt_async
from typing import List, Dict, Optional, Any, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from enum import Enum
import logging

class ExchangeStatus(Enum):
    """Estado del exchange"""
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"
    MAINTENANCE = "maintenance"
    RATE_LIMITED = "rate_limited"

@dataclass
class ExchangeConfig:
    """Configuración de exchange"""
    name: str
    api_key: Optional[str] = None
    secret: Optional[str] = None
    sandbox: bool = True
    rate_limit: int = 1200  # Requests per minute
    enabled: bool = True
    priority: int = 1  # Prioridad para ejecutar órdenes

@dataclass
class OrderBookSnapshot:
    """Snapshot del orderbook"""
    exchange: str
    symbol: str
    timestamp: datetime
    bids: List[Tuple[float, float]]  # [(price, volume), ...]
    asks: List[Tuple[float, float]]
    spread: float
    mid_price: float

@dataclass
class TradeExecution:
    """Ejecución de trade"""
    exchange: str
    symbol: str
    side: str  # 'buy' o 'sell'
    amount: float
    price: float
    timestamp: datetime
    order_id: str
    fees: float
    status: str

@dataclass
class Balance:
    """Balance de exchange"""
    exchange: str
    currency: str
    free: float
    used: float
    total: float

class MultiExchangeManager:
    """Gestor de múltiples exchanges"""
    
    def __init__(self, configs: List[ExchangeConfig]):
        self.configs = {config.name: config for config in configs}
        self.exchanges: Dict[str, ccxt_async.Exchange] = {}
        self.status: Dict[str, ExchangeStatus] = {}
        self.balances: Dict[str, List[Balance]] = {}
        self.orderbooks: Dict[str, Dict[str, OrderBookSnapshot]] = {}
        self.last_update: Dict[str, datetime] = {}
        
        # Configuración de logging
        self.logger = logging.getLogger(__name__)
        
        # Inicializar exchanges
        self._initialize_exchanges()
    
    def _initialize_exchanges(self):
        """Inicializa las conexiones con los exchanges"""
        exchange_mapping = {
            'binance': ccxt_async.binance,
            'kraken': ccxt_async.kraken,
            'kucoin': ccxt_async.kucoin,
            'okx': ccxt_async.okx,
            'coinbase': ccxt_async.coinbasepro,
            'bybit': ccxt_async.bybit,
            'bitget': ccxt_async.bitget,
            'gate': ccxt_async.gateio
        }
        
        for name, config in self.configs.items():
            if not config.enabled:
                continue
                
            try:
                if name in exchange_mapping:
                    exchange_class = exchange_mapping[name]
                    
                    # Configuración del exchange
                    exchange_config = {
                        'apiKey': config.api_key,
                        'secret': config.secret,
                        'sandbox': config.sandbox,
                        'enableRateLimit': True,
                        'rateLimit': config.rate_limit,
                        'options': {
                            'defaultType': 'spot',  # o 'future', 'margin'
                        }
                    }
                    
                    # Configuraciones específicas por exchange
                    if name == 'binance':
                        exchange_config['options']['defaultType'] = 'spot'
                    elif name == 'kraken':
                        exchange_config['options']['trading_agreement'] = 'agree'
                    elif name == 'kucoin':
                        exchange_config['options']['version'] = 'v1'
                    
                    self.exchanges[name] = exchange_class(exchange_config)
                    self.status[name] = ExchangeStatus.DISCONNECTED
                    self.logger.info(f"Exchange {name} inicializado")
                    
            except Exception as e:
                self.logger.error(f"Error inicializando {name}: {e}")
                self.status[name] = ExchangeStatus.ERROR
    
    async def connect_all(self) -> Dict[str, bool]:
        """Conecta a todos los exchanges habilitados"""
        results = {}
        
        for name, exchange in self.exchanges.items():
            try:
                # Verificar conexión
                await exchange.load_markets()
                
                # Obtener información del exchange
                info = await exchange.fetch_status()
                
                if info['status'] == 'ok':
                    self.status[name] = ExchangeStatus.CONNECTED
                    results[name] = True
                    self.logger.info(f"Conectado exitosamente a {name}")
                else:
                    self.status[name] = ExchangeStatus.MAINTENANCE
                    results[name] = False
                    self.logger.warning(f"{name} en mantenimiento")
                    
            except ccxt.RateLimitExceeded:
                self.status[name] = ExchangeStatus.RATE_LIMITED
                results[name] = False
                self.logger.warning(f"Rate limit excedido en {name}")
                
            except Exception as e:
                self.status[name] = ExchangeStatus.ERROR
                results[name] = False
                self.logger.error(f"Error conectando a {name}: {e}")
        
        return results
    
    async def disconnect_all(self):
        """Desconecta todos los exchanges"""
        for name, exchange in self.exchanges.items():
            try:
                await exchange.close()
                self.status[name] = ExchangeStatus.DISCONNECTED
                self.logger.info(f"Desconectado de {name}")
            except Exception as e:
                self.logger.error(f"Error desconectando de {name}: {e}")
    
    async def get_balances(self, exchanges: Optional[List[str]] = None) -> Dict[str, List[Balance]]:
        """Obtiene balances de los exchanges especificados"""
        if exchanges is None:
            exchanges = list(self.exchanges.keys())
        
        balances = {}
        
        for exchange_name in exchanges:
            if exchange_name not in self.exchanges:
                continue
                
            exchange = self.exchanges[exchange_name]
            
            try:
                if self.status[exchange_name] != ExchangeStatus.CONNECTED:
                    continue
                
                # Obtener balances
                raw_balances = await exchange.fetch_balance()
                
                exchange_balances = []
                for currency, balance_data in raw_balances.items():
                    if isinstance(balance_data, dict) and currency not in ['info', 'timestamp', 'datetime', 'free', 'used', 'total']:
                        balance = Balance(
                            exchange=exchange_name,
                            currency=currency,
                            free=balance_data.get('free', 0),
                            used=balance_data.get('used', 0),
                            total=balance_data.get('total', 0)
                        )
                        exchange_balances.append(balance)
                
                balances[exchange_name] = exchange_balances
                self.balances[exchange_name] = exchange_balances
                
            except Exception as e:
                self.logger.error(f"Error obteniendo balance de {exchange_name}: {e}")
                balances[exchange_name] = []
        
        return balances
    
    async def get_orderbooks(self, symbol: str, exchanges: Optional[List[str]] = None, limit: int = 20) -> Dict[str, OrderBookSnapshot]:
        """Obtiene orderbooks de múltiples exchanges"""
        if exchanges is None:
            exchanges = [name for name, status in self.status.items() 
                        if status == ExchangeStatus.CONNECTED]
        
        orderbooks = {}
        
        # Ejecutar en paralelo
        tasks = []
        for exchange_name in exchanges:
            task = self._fetch_orderbook(exchange_name, symbol, limit)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for i, result in enumerate(results):
            exchange_name = exchanges[i]
            if isinstance(result, Exception):
                self.logger.error(f"Error obteniendo orderbook de {exchange_name}: {result}")
            else:
                orderbooks[exchange_name] = result
        
        # Actualizar orderbooks globales
        if symbol not in self.orderbooks:
            self.orderbooks[symbol] = {}
        
        self.orderbooks[symbol].update(orderbooks)
        
        return orderbooks
    
    async def _fetch_orderbook(self, exchange_name: str, symbol: str, limit: int) -> Optional[OrderBookSnapshot]:
        """Obtiene orderbook de un exchange específico"""
        exchange = self.exchanges[exchange_name]
        
        try:
            orderbook = await exchange.fetch_order_book(symbol, limit)
            
            bids = [(float(price), float(volume)) for price, volume in orderbook['bids']]
            asks = [(float(price), float(volume)) for price, volume in orderbook['asks']]
            
            if bids and asks:
                best_bid = bids[0][0]
                best_ask = asks[0][0]
                spread = best_ask - best_bid
                mid_price = (best_bid + best_ask) / 2
                
                return OrderBookSnapshot(
                    exchange=exchange_name,
                    symbol=symbol,
                    timestamp=datetime.now(),
                    bids=bids,
                    asks=asks,
                    spread=spread,
                    mid_price=mid_price
                )
                
        except Exception as e:
            self.logger.error(f"Error en _fetch_orderbook para {exchange_name}: {e}")
            
        return None
    
    async def find_arbitrage_opportunities(self, symbol: str, min_profit: float = 0.001) -> List[Dict[str, Any]]:
        """Encuentra oportunidades de arbitraje entre exchanges"""
        orderbooks = await self.get_orderbooks(symbol)
        
        if len(orderbooks) < 2:
            return []
        
        opportunities = []
        exchanges = list(orderbooks.keys())
        
        # Comparar todos los pares de exchanges
        for i in range(len(exchanges)):
            for j in range(i + 1, len(exchanges)):
                exchange1 = exchanges[i]
                exchange2 = exchanges[j]
                
                ob1 = orderbooks[exchange1]
                ob2 = orderbooks[exchange2]
                
                if not ob1 or not ob2:
                    continue
                
                # Arbitraje: comprar en exchange1, vender en exchange2
                buy_price = ob1.asks[0][0] if ob1.asks else float('inf')
                sell_price = ob2.bids[0][0] if ob2.bids else 0
                
                if buy_price < sell_price:
                    profit = (sell_price - buy_price) / buy_price
                    
                    if profit > min_profit:
                        max_volume = min(ob1.asks[0][1], ob2.bids[0][1])
                        
                        opportunities.append({
                            'symbol': symbol,
                            'buy_exchange': exchange1,
                            'sell_exchange': exchange2,
                            'buy_price': buy_price,
                            'sell_price': sell_price,
                            'profit_percentage': profit * 100,
                            'profit_absolute': sell_price - buy_price,
                            'max_volume': max_volume,
                            'max_profit': max_volume * (sell_price - buy_price),
                            'timestamp': datetime.now()
                        })
                
                # Arbitraje inverso: comprar en exchange2, vender en exchange1
                buy_price = ob2.asks[0][0] if ob2.asks else float('inf')
                sell_price = ob1.bids[0][0] if ob1.bids else 0
                
                if buy_price < sell_price:
                    profit = (sell_price - buy_price) / buy_price
                    
                    if profit > min_profit:
                        max_volume = min(ob2.asks[0][1], ob1.bids[0][1])
                        
                        opportunities.append({
                            'symbol': symbol,
                            'buy_exchange': exchange2,
                            'sell_exchange': exchange1,
                            'buy_price': buy_price,
                            'sell_price': sell_price,
                            'profit_percentage': profit * 100,
                            'profit_absolute': sell_price - buy_price,
                            'max_volume': max_volume,
                            'max_profit': max_volume * (sell_price - buy_price),
                            'timestamp': datetime.now()
                        })
        
        # Ordenar por profit descendente
        opportunities.sort(key=lambda x: x['profit_percentage'], reverse=True)
        
        return opportunities
    
    async def execute_arbitrage(self, opportunity: Dict[str, Any], amount: float) -> Dict[str, TradeExecution]:
        """Ejecuta una oportunidad de arbitraje"""
        results = {}
        
        buy_exchange = opportunity['buy_exchange']
        sell_exchange = opportunity['sell_exchange']
        
        try:
            # Ejecutar órdenes en paralelo
            buy_task = self._execute_order(
                buy_exchange,
                opportunity['symbol'],
                'buy',
                amount,
                opportunity['buy_price']
            )
            
            sell_task = self._execute_order(
                sell_exchange,
                opportunity['symbol'],
                'sell',
                amount,
                opportunity['sell_price']
            )
            
            buy_result, sell_result = await asyncio.gather(buy_task, sell_task)
            
            results['buy'] = buy_result
            results['sell'] = sell_result
            
            # Calcular profit real
            if buy_result and sell_result:
                profit = sell_result.price * sell_result.amount - buy_result.price * buy_result.amount
                results['profit'] = profit
                results['profit_percentage'] = profit / (buy_result.price * buy_result.amount) * 100
            
        except Exception as e:
            self.logger.error(f"Error ejecutando arbitraje: {e}")
            results['error'] = str(e)
        
        return results
    
    async def _execute_order(self, exchange_name: str, symbol: str, side: str, amount: float, price: float) -> Optional[TradeExecution]:
        """Ejecuta una orden en un exchange específico"""
        exchange = self.exchanges[exchange_name]
        
        try:
            # Crear orden
            order = await exchange.create_limit_order(symbol, side, amount, price)
            
            # Esperar a que se ejecute (en producción usar polling o webhooks)
            await asyncio.sleep(1)
            
            # Obtener estado de la orden
            order_status = await exchange.fetch_order(order['id'], symbol)
            
            if order_status['status'] == 'closed':
                return TradeExecution(
                    exchange=exchange_name,
                    symbol=symbol,
                    side=side,
                    amount=order_status['filled'],
                    price=order_status['average'],
                    timestamp=datetime.now(),
                    order_id=order['id'],
                    fees=order_status.get('fee', {}).get('cost', 0),
                    status='filled'
                )
            else:
                # Cancelar orden si no se ejecutó
                await exchange.cancel_order(order['id'], symbol)
                return None
                
        except Exception as e:
            self.logger.error(f"Error ejecutando orden en {exchange_name}: {e}")
            return None
    
    async def get_best_prices(self, symbol: str) -> Dict[str, Dict[str, float]]:
        """Obtiene los mejores precios de compra y venta de todos los exchanges"""
        orderbooks = await self.get_orderbooks(symbol)
        
        best_prices = {}
        
        for exchange_name, orderbook in orderbooks.items():
            if orderbook and orderbook.bids and orderbook.asks:
                best_prices[exchange_name] = {
                    'best_bid': orderbook.bids[0][0],
                    'best_ask': orderbook.asks[0][0],
                    'spread': orderbook.spread,
                    'mid_price': orderbook.mid_price,
                    'bid_volume': orderbook.bids[0][1],
                    'ask_volume': orderbook.asks[0][1]
                }
        
        return best_prices
    
    async def get_market_data(self, symbol: str, timeframe: str = '1h', limit: int = 100) -> Dict[str, pd.DataFrame]:
        """Obtiene datos de mercado de múltiples exchanges"""
        market_data = {}
        
        tasks = []
        for exchange_name in self.exchanges.keys():
            if self.status[exchange_name] == ExchangeStatus.CONNECTED:
                task = self._fetch_ohlcv(exchange_name, symbol, timeframe, limit)
                tasks.append((exchange_name, task))
        
        results = await asyncio.gather(*[task for _, task in tasks], return_exceptions=True)
        
        for i, result in enumerate(results):
            exchange_name = tasks[i][0]
            if isinstance(result, Exception):
                self.logger.error(f"Error obteniendo datos de {exchange_name}: {result}")
            else:
                if result is not None:
                    market_data[exchange_name] = result
        
        return market_data
    
    async def _fetch_ohlcv(self, exchange_name: str, symbol: str, timeframe: str, limit: int) -> Optional[pd.DataFrame]:
        """Obtiene datos OHLCV de un exchange específico"""
        exchange = self.exchanges[exchange_name]
        
        try:
            ohlcv = await exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
            
            if ohlcv:
                df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
                df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
                df.set_index('timestamp', inplace=True)
                return df
                
        except Exception as e:
            self.logger.error(f"Error obteniendo OHLCV de {exchange_name}: {e}")
            
        return None
    
    async def monitor_spreads(self, symbol: str, duration: int = 300) -> Dict[str, List[float]]:
        """Monitorea spreads en tiempo real"""
        spreads_history = {name: [] for name in self.exchanges.keys()}
        start_time = datetime.now()
        
        while (datetime.now() - start_time).seconds < duration:
            orderbooks = await self.get_orderbooks(symbol)
            
            for exchange_name, orderbook in orderbooks.items():
                if orderbook:
                    spreads_history[exchange_name].append({
                        'timestamp': orderbook.timestamp,
                        'spread': orderbook.spread,
                        'spread_percentage': orderbook.spread / orderbook.mid_price * 100
                    })
            
            await asyncio.sleep(5)  # Actualizar cada 5 segundos
        
        return spreads_history
    
    def get_exchange_status(self) -> Dict[str, Dict[str, Any]]:
        """Obtiene el estado de todos los exchanges"""
        status_info = {}
        
        for name, status in self.status.items():
            config = self.configs[name]
            
            status_info[name] = {
                'status': status.value,
                'enabled': config.enabled,
                'priority': config.priority,
                'last_update': self.last_update.get(name),
                'sandbox': config.sandbox
            }
        
        return status_info
    
    async def get_trading_fees(self, symbol: str) -> Dict[str, Dict[str, float]]:
        """Obtiene comisiones de trading de todos los exchanges"""
        fees = {}
        
        for exchange_name, exchange in self.exchanges.items():
            try:
                if self.status[exchange_name] == ExchangeStatus.CONNECTED:
                    market = exchange.market(symbol)
                    
                    fees[exchange_name] = {
                        'maker': market.get('maker', 0.001),
                        'taker': market.get('taker', 0.001),
                        'fee_currency': market.get('feeCurrency', 'USDT')
                    }
                    
            except Exception as e:
                self.logger.error(f"Error obteniendo fees de {exchange_name}: {e}")
                fees[exchange_name] = {'maker': 0.001, 'taker': 0.001}
        
        return fees
    
    async def get_optimal_exchange_for_order(self, symbol: str, side: str, amount: float) -> Optional[str]:
        """Encuentra el exchange óptimo para ejecutar una orden"""
        orderbooks = await self.get_orderbooks(symbol)
        fees = await self.get_trading_fees(symbol)
        
        best_exchange = None
        best_price = float('inf') if side == 'buy' else 0
        
        for exchange_name, orderbook in orderbooks.items():
            if not orderbook:
                continue
            
            if side == 'buy' and orderbook.asks:
                price = orderbook.asks[0][0]
                # Ajustar por fees
                taker_fee = fees.get(exchange_name, {}).get('taker', 0.001)
                adjusted_price = price * (1 + taker_fee)
                
                if adjusted_price < best_price:
                    best_price = adjusted_price
                    best_exchange = exchange_name
            
            elif side == 'sell' and orderbook.bids:
                price = orderbook.bids[0][0]
                # Ajustar por fees
                taker_fee = fees.get(exchange_name, {}).get('taker', 0.001)
                adjusted_price = price * (1 - taker_fee)
                
                if adjusted_price > best_price:
                    best_price = adjusted_price
                    best_exchange = exchange_name
        
        return best_exchange
    
    def get_available_symbols(self) -> Dict[str, List[str]]:
        """Obtiene símbolos disponibles en cada exchange"""
        symbols = {}
        
        for name, exchange in self.exchanges.items():
            try:
                markets = exchange.markets
                symbols[name] = list(markets.keys())
            except Exception as e:
                self.logger.error(f"Error obteniendo símbolos de {name}: {e}")
                symbols[name] = []
        
        return symbols
    
    async def sync_balances(self):
        """Sincroniza balances de todos los exchanges"""
        await self.get_balances()
    
    async def health_check(self) -> Dict[str, Any]:
        """Realiza un chequeo de salud de todos los exchanges"""
        health_status = {}
        
        for name, exchange in self.exchanges.items():
            try:
                # Verificar conexión
                await exchange.load_markets()
                status = await exchange.fetch_status()
                
                health_status[name] = {
                    'status': 'healthy' if status['status'] == 'ok' else 'unhealthy',
                    'response_time': 0,  # Implementar medición de tiempo
                    'markets_loaded': len(exchange.markets),
                    'last_check': datetime.now()
                }
                
            except Exception as e:
                health_status[name] = {
                    'status': 'error',
                    'error': str(e),
                    'last_check': datetime.now()
                }
        
        return health_status

# Funciones de utilidad para configuración

def create_exchange_configs() -> List[ExchangeConfig]:
    """Crea configuraciones por defecto para los exchanges"""
    configs = [
        ExchangeConfig(
            name='binance',
            api_key=None,  # Se debe configurar
            secret=None,   # Se debe configurar
            sandbox=True,
            rate_limit=1200,
            enabled=True,
            priority=1
        ),
        ExchangeConfig(
            name='kraken',
            api_key=None,
            secret=None,
            sandbox=True,
            rate_limit=3000,
            enabled=True,
            priority=2
        ),
        ExchangeConfig(
            name='kucoin',
            api_key=None,
            secret=None,
            sandbox=True,
            rate_limit=3340,
            enabled=True,
            priority=3
        ),
        ExchangeConfig(
            name='okx',
            api_key=None,
            secret=None,
            sandbox=True,
            rate_limit=6000,
            enabled=True,
            priority=4
        ),
        ExchangeConfig(
            name='coinbase',
            api_key=None,
            secret=None,
            sandbox=True,
            rate_limit=3000,
            enabled=True,
            priority=5
        )
    ]
    
    return configs

def load_exchange_configs_from_env() -> List[ExchangeConfig]:
    """Carga configuraciones de exchanges desde variables de entorno"""
    import os
    
    configs = []
    
    # Configuración de Binance
    if os.getenv('BINANCE_API_KEY') and os.getenv('BINANCE_SECRET'):
        configs.append(ExchangeConfig(
            name='binance',
            api_key=os.getenv('BINANCE_API_KEY'),
            secret=os.getenv('BINANCE_SECRET'),
            sandbox=os.getenv('BINANCE_SANDBOX', 'true').lower() == 'true',
            enabled=True,
            priority=1
        ))
    
    # Configuración de Kraken
    if os.getenv('KRAKEN_API_KEY') and os.getenv('KRAKEN_SECRET'):
        configs.append(ExchangeConfig(
            name='kraken',
            api_key=os.getenv('KRAKEN_API_KEY'),
            secret=os.getenv('KRAKEN_SECRET'),
            sandbox=os.getenv('KRAKEN_SANDBOX', 'true').lower() == 'true',
            enabled=True,
            priority=2
        ))
    
    # Agregar más exchanges según necesidad...
    
    return configs




# gbsb/trading/engine.py
import numpy as np
import structlog
from ..config import settings
from ..trading.virtual_trader import VirtualTrader

logger = structlog.get_logger(__name__)

class ScalperEngine:
    """
    Motor de trading principal que ejecuta estrategias de scalping.
    """
    
    def __init__(self, symbols, model, exchange, sizer, hedger,
                 portfolio_weights: dict = None):
        self.symbols = symbols
        self.model = model
        self.exchange = exchange
        self.sizer = sizer
        self.hedger = hedger
        self.portfolio_weights = portfolio_weights or {}
        
        # Virtual trader para simulación
        self.virtual_trader = VirtualTrader(symbols) if settings.VIRTUAL_TRADER_ENABLED else None
        
        # Estado del motor
        self.is_running = False
        self.positions = {}
        self.last_signals = {}
        
        logger.info(f"ScalperEngine initialized for symbols: {symbols}")
    
    def start(self):
        """Iniciar el motor de trading"""
        self.is_running = True
        logger.info("ScalperEngine started")
    
    def stop(self):
        """Detener el motor de trading"""
        self.is_running = False
        logger.info("ScalperEngine stopped")
    
    def run_one_symbol(self, symbol: str, market_data: dict) -> dict:
        """
        Ejecutar análisis y trading para un símbolo específico.
        """
        try:
            # Obtener precio actual
            price = market_data.get('price', 0.0)
            if price <= 0:
                return {"symbol": symbol, "signal": 0, "error": "Invalid price"}
            
            # Generar señal usando el modelo
            signal = self._generate_signal(symbol, market_data)
            self.last_signals[symbol] = signal
            
            # -----------------------------------------------------------------
            # 1️⃣ QUICK-ENTRY – también la gestionamos en el VirtualTrader
            # -----------------------------------------------------------------
            if self.virtual_trader:
                # El VirtualTrader recibe la señal y el precio actual
                self.virtual_trader.process_signal(symbol, signal, price)
                # Comprueba TP/SL al final del tick
                self.virtual_trader.check_tp_sl(symbol, price)
            
            # Sólo si estamos en modo real (DRY_RUN=False) ejecutamos orders reales
            if not settings.DRY_RUN:
                # Implementar lógica de trading real aquí
                self._execute_real_trade(symbol, signal, price)
            
            return {
                "symbol": symbol,
                "signal": signal,
                "price": price,
                "timestamp": market_data.get('timestamp', ''),
                "virtual_trader_active": self.virtual_trader is not None
            }
            
        except Exception as e:
            logger.error(f"Error processing {symbol}: {str(e)}")
            return {"symbol": symbol, "signal": 0, "error": str(e)}
    
    def _generate_signal(self, symbol: str, market_data: dict) -> int:
        """
        Generar señal de trading usando el modelo.
        """
        try:
            # Preparar datos para el modelo
            features = self._prepare_features(market_data)
            
            # Usar el modelo para generar señal
            if hasattr(self.model, 'predict'):
                signal = self.model.predict(features)
            else:
                # Fallback a lógica simple
                signal = self._simple_signal_logic(market_data)
            
            return int(signal)
            
        except Exception as e:
            logger.error(f"Error generating signal for {symbol}: {str(e)}")
            return 0
    
    def _prepare_features(self, market_data: dict) -> np.ndarray:
        """
        Preparar características para el modelo.
        """
        # Implementar extracción de características
        # Por ahora, retornar array de ceros como placeholder
        return np.zeros(36)  # 36 features como en el controller
    
    def _simple_signal_logic(self, market_data: dict) -> int:
        """
        Lógica simple de señal como fallback.
        """
        price = market_data.get('price', 0)
        volume = market_data.get('volume', 0)
        
        # Lógica muy básica
        if volume > 1000000:  # Alto volumen
            return 1  # Compra
        elif volume < 500000:  # Bajo volumen
            return -1  # Venta
        else:
            return 0  # Neutral
    
    def _execute_real_trade(self, symbol: str, signal: int, price: float):
        """
        Ejecutar trade real en el exchange.
        """
        if signal == 0:
            return
        
        try:
            # Implementar lógica de trading real
            side = "buy" if signal > 0 else "sell"
            quantity = self.sizer.calculate_size(symbol, price, signal)
            
            # Ejecutar orden en el exchange
            order = self.exchange.create_order(
                symbol=symbol,
                side=side,
                quantity=quantity,
                price=price
            )
            
            logger.info(f"[REAL] {side.upper()} {symbol} qty={quantity} @ {price}")
            
        except Exception as e:
            logger.error(f"Error executing real trade for {symbol}: {str(e)}")
    
    def get_status(self) -> dict:
        """
        Obtener estado actual del motor.
        """
        return {
            "is_running": self.is_running,
            "symbols": self.symbols,
            "last_signals": self.last_signals,
            "virtual_trader_enabled": self.virtual_trader is not None,
            "virtual_trader_stats": self.virtual_trader.snapshot() if self.virtual_trader else None
        }

class MarketMakerEngine:
    """Motor de Market Making"""
    
    def __init__(self, symbols, exchange):
        self.symbols = symbols
        self.exchange = exchange
        self.is_running = False
    
    def start(self):
        self.is_running = True
        logger.info("MarketMakerEngine started")
    
    def stop(self):
        self.is_running = False
        logger.info("MarketMakerEngine stopped")

class ArbitrageEngine:
    """Motor de Arbitraje"""
    
    def __init__(self, symbols, exchanges):
        self.symbols = symbols
        self.exchanges = exchanges
        self.is_running = False
    
    def start(self):
        self.is_running = True
        logger.info("ArbitrageEngine started")
    
    def stop(self):
        self.is_running = False
        logger.info("ArbitrageEngine stopped")




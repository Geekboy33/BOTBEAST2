# scripts/run_bot.py
import asyncio
import time
import structlog
from gbsb.config import settings
from gbsb.trading.engine import ScalperEngine
from gbsb.ai.controller import Controller
from gbsb.monitor.rl_metrics import rl_reward_total, rl_epsilon

logger = structlog.get_logger(__name__)

class MockModel:
    def predict(self, features):
        import random
        return random.choice([-1, 0, 1])

class MockExchange:
    def get_market_data(self, symbol):
        import random
        return {
            'symbol': symbol,
            'price': 45000 + random.randint(-1000, 1000),
            'volume': random.randint(500000, 2000000),
            'timestamp': time.time()
        }

class MockSizer:
    def calculate_size(self, symbol, price, signal):
        return 0.001

class MockHedger:
    pass

async def main():
    """Función principal del bot"""
    logger.info("🤖 Iniciando Grok-Beast Trading Bot")
    
    # Configuración
    symbols = settings.SYMBOLS.split(",") if settings.SYMBOLS else ["BTCUSDT", "ETHUSDT"]
    
    # Crear componentes
    model = MockModel()
    exchange = MockExchange()
    sizer = MockSizer()
    hedger = MockHedger()
    
    # Crear engine y controller
    engine = ScalperEngine(symbols, model, exchange, sizer, hedger)
    controller = Controller()
    
    # Iniciar engine
    engine.start()
    
    logger.info(f"✅ Bot iniciado con símbolos: {symbols}")
    logger.info(f"🔧 Configuración: DRY_RUN={settings.DRY_RUN}, VirtualTrader={settings.VIRTUAL_TRADER_ENABLED}")
    
    try:
        # Loop principal
        tick_count = 0
        while True:
            tick_count += 1
            
            # Para cada símbolo
            for symbol in symbols:
                # Obtener datos de mercado
                market_data = exchange.get_market_data(symbol)
                
                # Ejecutar análisis
                result = engine.run_one_symbol(symbol, market_data)
                
                # Log de resultado
                if tick_count % 10 == 0:  # Log cada 10 ticks
                    logger.info(f"📊 {symbol}: signal={result.get('signal', 0)}, "
                              f"price={market_data.get('price', 0):.2f}")
                
                # Actualizar controller con experiencia (simulado)
                if engine.virtual_trader:
                    snapshot = engine.virtual_trader.snapshot()
                    stats = snapshot.get('closed_stats', {})
                    
                    # Simular update del controller
                    pnl = 0.0  # Calcular PnL real
                    equity = stats.get('current_equity', 100000)
                    max_equity = stats.get('max_equity', 100000)
                    recent_vol = 0.01  # Simulado
                    
                    controller.update(
                        state=np.zeros(36),  # Estado simulado
                        action=result.get('signal', 0),
                        pnl=pnl,
                        equity=equity,
                        max_equity=max_equity,
                        recent_vol=recent_vol,
                        next_state=np.zeros(36),
                        done=False
                    )
            
            # Log de estadísticas cada 100 ticks
            if tick_count % 100 == 0:
                controller_stats = controller.get_stats()
                logger.info(f"📈 Stats: epsilon={controller_stats['epsilon']:.4f}, "
                          f"transitions={controller_stats['total_transitions']}")
                
                if engine.virtual_trader:
                    virtual_stats = engine.virtual_trader.snapshot()['closed_stats']
                    logger.info(f"💰 Virtual: trades={virtual_stats['total_trades']}, "
                              f"return={virtual_stats['cumulative_return']:.2%}")
            
            # Esperar antes del siguiente tick
            await asyncio.sleep(1)  # 1 segundo entre ticks
            
    except KeyboardInterrupt:
        logger.info("🛑 Bot detenido por usuario")
    except Exception as e:
        logger.error(f"❌ Error en bot: {str(e)}")
    finally:
        engine.stop()
        logger.info("✅ Bot detenido correctamente")

if __name__ == "__main__":
    import numpy as np
    asyncio.run(main())




# gbsb/trading/virtual_trader.py
import datetime
from ..config import settings
import structlog

logger = structlog.get_logger(__name__)

class VirtualPosition:
    def __init__(self, side: str, entry_price: float, size: float,
                 tp_price: float, sl_price: float):
        self.side = side
        self.entry_price = entry_price
        self.size = size
        self.tp_price = tp_price
        self.sl_price = sl_price
        self.opened_at = datetime.datetime.utcnow()
        self.closed_at = None
        self.exit_price = None
        self.pnl = None

    def close(self, price: float):
        if self.side == "long":
            self.pnl = (price - self.entry_price) / self.entry_price
        else:
            self.pnl = (self.entry_price - price) / self.entry_price
        self.exit_price = price
        self.closed_at = datetime.datetime.utcnow()
        return self.pnl


class VirtualTrader:
    def __init__(self, symbols: list):
        self.symbols = symbols
        self.positions = {s: None for s in symbols}
        self.initial_equity = settings.VIRTUAL_MAX_NOTIONAL * len(symbols)
        self.equity = self.initial_equity
        self.max_equity = self.initial_equity
        self.history = []

    def _calc_size_and_limits(self, price: float, side: str):
        size = settings.VIRTUAL_MAX_NOTIONAL / price
        if side == "long":
            tp = price * (1 + settings.VIRTUAL_TP_PERCENT)
            sl = price * (1 - settings.VIRTUAL_SL_PERCENT)
        else:
            tp = price * (1 - settings.VIRTUAL_TP_PERCENT)
            sl = price * (1 + settings.VIRTUAL_SL_PERCENT)
        return size, tp, sl

    def process_signal(self, symbol: str, signal: int, price: float):
        cur = self.positions[symbol]

        if signal == 0:
            return

        # Si hay posición contraria, la cerramos primero
        if cur and ((signal == 1 and cur.side == "short") or
                    (signal == -1 and cur.side == "long")):
            self._close_position(symbol, price, reason="opposite")

        # Si no hay posición, abrimos una nueva
        if self.positions[symbol] is None:
            side = "long" if signal == 1 else "short"
            size, tp, sl = self._calc_size_and_limits(price, side)
            self.positions[symbol] = VirtualPosition(side, price, size, tp, sl)
            logger.info(f"[VIRTUAL] OPEN {side.upper()} {symbol} size={size:.6f} @ {price:.2f}")

    def check_tp_sl(self, symbol: str, price: float):
        pos = self.positions.get(symbol)
        if not pos:
            return
        if pos.side == "long":
            if price >= pos.tp_price:
                self._close_position(symbol, price, reason="TP")
            elif price <= pos.sl_price:
                self._close_position(symbol, price, reason="SL")
        else:
            if price <= pos.tp_price:
                self._close_position(symbol, price, reason="TP")
            elif price >= pos.sl_price:
                self._close_position(symbol, price, reason="SL")

    def _close_position(self, symbol: str, exit_price: float, reason: str = "manual"):
        pos = self.positions[symbol]
        if not pos:
            return
        pnl = pos.close(exit_price)
        self.equity *= (1 + pnl)
        if self.equity > self.max_equity:
            self.max_equity = self.equity
        self.history.append(pos)
        self.positions[symbol] = None
        logger.info(f"[VIRTUAL] CLOSE {pos.side.upper()} {symbol} exit={exit_price:.2f} "
                   f"Pnl={pnl:.4%} ({reason}) equity={self.equity:,.2f}")

    def snapshot(self):
        open_positions = {
            sym: {
                "side": p.side,
                "entry": p.entry_price,
                "size": p.size,
                "tp": p.tp_price,
                "sl": p.sl_price,
                "opened_at": p.opened_at.isoformat()
            } for sym, p in self.positions.items() if p
        }
        closed_stats = {
            "total_trades": len(self.history),
            "cumulative_return": (self.equity / self.initial_equity) - 1.0,
            "current_equity": self.equity,
            "max_equity": self.max_equity,
            "drawdown": (self.max_equity - self.equity) / self.max_equity
        }
        return {"open_positions": open_positions, "closed_stats": closed_stats}




# gbsb/monitor/rl_metrics.py
from prometheus_client import Counter, Gauge, Summary

# Métricas básicas (ya estaban)
trades_total = Counter("gbsb_trades_total", "Total trades executed")
active_positions = Gauge("gbsb_active_positions", "Number of active positions")
pnl_total = Summary("gbsb_pnl_total", "Profit and loss per trade")

# Métricas específicas de la IA / RL
rl_reward_total = Counter("gbsb_rl_reward_total", "Reward acumulado entregado al controlador")
rl_epsilon = Gauge("gbsb_rl_epsilon", "Valor epsilon de exploración")
rl_loss = Gauge("gbsb_rl_loss", "Loss de la última iteración de entrenamiento")




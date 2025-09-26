# gbsb/ai/reward.py
def risk_aware_reward(pnl: float,
                      equity: float,
                      max_equity: float,
                      recent_vol: float,
                      lambdas: tuple = (0.5, 0.3, 0.2)):
    """
    Penaliza draw-down, baja exposición y volatilidad.
    """
    drawdown = (max_equity - equity) / max_equity
    exposure = min(1.0, equity / max_equity)
    reward = pnl - lambdas[0] * drawdown - lambdas[1] * (1 - exposure) - lambdas[2] * recent_vol
    return reward




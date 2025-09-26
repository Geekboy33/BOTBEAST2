# gbsb/ai/controller.py
import numpy as np
import torch
import torch.nn as nn
import structlog
from .ollama_client import OllamaClient
from .reward import risk_aware_reward
from ..monitor.rl_metrics import rl_reward_total, rl_epsilon, rl_loss
import json
from pathlib import Path

logger = structlog.get_logger(__name__)

# Cliente global de Ollama
ollama = OllamaClient()

TRANSITIONS_PATH = Path("gbsb/ai/ollama_transitions.jsonl")

class Controller:
    """
    Controlador principal que decide qué estrategias activar usando IA.
    """
    
    def __init__(self, state_size: int = 36, action_size: int = 5, 
                 epsilon: float = 1.0, epsilon_min: float = 0.01, 
                 epsilon_decay: float = 0.995):
        self.state_size = state_size
        self.action_size = action_size
        self.epsilon = epsilon
        self.epsilon_min = epsilon_min
        self.epsilon_decay = epsilon_decay
        
        # Red neuronal simple para fallback
        self.net = nn.Sequential(
            nn.Linear(state_size, 128),
            nn.ReLU(),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, action_size)
        )
        
        # Buffer para almacenar transiciones
        self.buffer = []
        
        # Crear directorio para transiciones si no existe
        TRANSITIONS_PATH.parent.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"Controller initialized with epsilon={epsilon}")
    
    def decide(self, state: np.ndarray) -> int:
        """
        Decide qué acción tomar basado en el estado actual.
        Usa Ollama como predictor principal, DQN como fallback.
        """
        # Exploración aleatoria
        if np.random.rand() < self.epsilon:
            action = np.random.randint(0, self.action_size)
            logger.debug(f"[CTRL] ε-exploration → {action}")
            return action
        
        try:
            # Usar Ollama para predicción
            action = ollama.predict_action(state.tolist())
            logger.debug(f"[CTRL] Ollama sugiere acción {action}")
            return action
        except Exception as exc:
            logger.warning(f"[CTRL] Ollama falló ({exc}) → DQN fallback")
            # Fallback a DQN
            state_t = torch.tensor(state, dtype=torch.float32).unsqueeze(0)
            with torch.no_grad():
                q_vals = self.net(state_t)
            return int(q_vals.squeeze(0).argmax().item())
    
    def _store_transition(self, transition: dict):
        """Almacenar transición para entrenamiento futuro"""
        with TRANSITIONS_PATH.open("a", encoding="utf-8") as f:
            json.dump(transition, f, ensure_ascii=False)
            f.write("\n")
    
    def update(self,
               state: np.ndarray,
               action: int,
               pnl: float,
               equity: float,
               max_equity: float,
               recent_vol: float,
               next_state: np.ndarray,
               done: bool) -> None:
        """
        Actualizar el controlador con la experiencia ganada.
        """
        # Cálculo del reward sensible al riesgo
        reward = risk_aware_reward(pnl, equity, max_equity, recent_vol,
                                   lambdas=(0.5, 0.3, 0.2))
        
        # Guardar transición para fine-tune de Ollama
        self._store_transition({
            "prompt": f"Estado: {state.tolist()}",
            "completion": str(action)
        })
        
        # Métricas Prometheus
        rl_reward_total.inc(reward)
        rl_epsilon.set(self.epsilon)
        
        # Guardar en buffer para entrenamiento offline
        self.buffer.append({
            "state": state,
            "action": int(action),
            "reward": float(reward),
            "next_state": next_state,
            "done": bool(done)
        })
        
        # Mantener buffer limitado
        if len(self.buffer) > 10000:
            self.buffer = self.buffer[-5000:]
        
        # Decay epsilon
        self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)
        rl_epsilon.set(self.epsilon)
        
        logger.debug(f"[CTRL] Updated: reward={reward:.4f}, epsilon={self.epsilon:.4f}")
    
    def get_stats(self) -> dict:
        """Obtener estadísticas del controlador"""
        return {
            "epsilon": self.epsilon,
            "buffer_size": len(self.buffer),
            "total_transitions": len(self.buffer),
            "transitions_file": str(TRANSITIONS_PATH)
        }




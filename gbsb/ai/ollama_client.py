# gbsb/ai/ollama_client.py
import os
import json
import requests
from typing import List

class OllamaClient:
    """
    Wrapper sencillo para la API HTTP de Ollama.
    """
    def __init__(self,
                 model: str = os.getenv("OLLAMA_MODEL", "gpt-oss:120b"),
                 host: str = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")):
        self.model = model
        self.base_url = host.rstrip("/") + "/api/generate"

    def _call(self, prompt: str, temperature: float = 0.0,
              max_tokens: int = 64) -> str:
        payload = {
            "model": self.model,
            "prompt": prompt,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False
        }
        r = requests.post(self.base_url, json=payload, timeout=20)
        r.raise_for_status()
        data = r.json()
        return data.get("response", "")

    # -------------------------------------------------------------
    # Acción recomendada a partir del vector de estado
    # -------------------------------------------------------------
    def predict_action(self, state_vec: List[float]) -> int:
        state_str = "[" + ", ".join(f"{v:.4f}" for v in state_vec) + "]"
        prompt = (
            "Eres un agente de trading automatizado que decide qué módulo activar.\n"
            "Los módulos son:\n"
            "0 = Ninguno\n"
            "1 = ScalperEngine\n"
            "2 = MarketMakerEngine\n"
            "3 = ArbitrageEngine\n"
            "4 = Todas simultáneamente\n"
            f"Estado actual del mercado (vector de 36 valores): {state_str}\n"
            "Elige el número del módulo que deberías activar en este instante (0‑4) y escribe solo ese número."
        )
        answer = self._call(prompt, temperature=0.0, max_tokens=4).strip()
        for ch in answer:
            if ch.isdigit():
                return int(ch)
        raise ValueError(f"Ollama devolvió respuesta inesperada: {answer!r}")

# gbsb/config.py
import os
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List

class Settings(BaseSettings):
    # ---- Trading Configuration ---------------------------------
    SYMBOLS: str = Field(default="BTCUSDT,ETHUSDT,ADAUSDT", env="SYMBOLS")
    DRY_RUN: bool = Field(default=True, env="DRY_RUN")
    EXCHANGE: str = Field(default="binance", env="EXCHANGE")
    
    # ---- Model Configuration -----------------------------------
    MODEL_PATH: str = Field(default="models/dqn_model.pth", env="MODEL_PATH")
    BATCH_SIZE: int = Field(default=32, env="BATCH_SIZE")
    LEARNING_RATE: float = Field(default=0.001, env="LEARNING_RATE")
    
    # ---- Risk Management ---------------------------------------
    MAX_POSITION_SIZE: float = Field(default=0.1, env="MAX_POSITION_SIZE")
    STOP_LOSS_PERCENT: float = Field(default=0.02, env="STOP_LOSS_PERCENT")
    TAKE_PROFIT_PERCENT: float = Field(default=0.04, env="TAKE_PROFIT_PERCENT")
    
    # ---- Ollama -------------------------------------------------
    OLLAMA_MODEL: str = Field(default="gpt-oss:120b", env="OLLAMA_MODEL")
    OLLAMA_HOST: str = Field(default="http://127.0.0.1:11434", env="OLLAMA_HOST")

    # ---- Virtual trader ---------------------------------------
    VIRTUAL_TRADER_ENABLED: bool = Field(default=True, env="VIRTUAL_TRADER_ENABLED")
    VIRTUAL_MAX_NOTIONAL: float = Field(default=100_000.0, env="VIRTUAL_MAX_NOTIONAL")
    VIRTUAL_SL_PERCENT: float = Field(default=0.015, env="VIRTUAL_SL_PERCENT")
    VIRTUAL_TP_PERCENT: float = Field(default=0.030, env="VIRTUAL_TP_PERCENT")

    # ---- Database ---------------------------------------------
    DATABASE_URL: str = Field(default="sqlite:///trading_bot.db", env="DATABASE_URL")

    # ---- Redis -------------------------------------------------
    REDIS_HOST: str = Field(default="localhost", env="REDIS_HOST")
    REDIS_PORT: int = Field(default=6379, env="REDIS_PORT")
    REDIS_DB: int = Field(default=0, env="REDIS_DB")

    # ---- Security ----------------------------------------------
    SECRET_KEY: str = Field(default="your-secret-key-here", env="SECRET_KEY")
    JWT_SECRET: str = Field(default="your-jwt-secret-here", env="JWT_SECRET")

    # ---- Monitoring --------------------------------------------
    PROMETHEUS_PORT: int = Field(default=8001, env="PROMETHEUS_PORT")
    GRAFANA_PORT: int = Field(default=3000, env="GRAFANA_PORT")

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

# Instancia global
settings = Settings()

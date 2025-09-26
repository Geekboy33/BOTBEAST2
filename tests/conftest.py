"""
Configuración global para pytest
"""
import pytest
import asyncio
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock
import pandas as pd
import numpy as np

# Agregar el directorio raíz al path
root_dir = Path(__file__).parent.parent
sys.path.insert(0, str(root_dir))

@pytest.fixture(scope="session")
def event_loop():
    """Crear event loop para tests asíncronos"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def mock_market_data():
    """Datos de mercado simulados para testing"""
    dates = pd.date_range('2024-01-01', periods=100, freq='1min')
    data = {
        'timestamp': dates,
        'open': np.random.uniform(45000, 46000, 100),
        'high': np.random.uniform(45500, 46500, 100),
        'low': np.random.uniform(44500, 45500, 100),
        'close': np.random.uniform(45000, 46000, 100),
        'volume': np.random.uniform(1000, 10000, 100)
    }
    return pd.DataFrame(data)

@pytest.fixture
def mock_exchange_config():
    """Configuración mock de exchange"""
    from gbsb.exchanges.multi_exchange_manager import ExchangeConfig
    return ExchangeConfig(
        name='binance',
        api_key='test_key',
        secret_key='test_secret',
        sandbox=True,
        enabled=True,
        priority=1
    )

@pytest.fixture
def mock_autopilot_config():
    """Configuración mock de autopilot"""
    from gbsb.ai.autopilot_engine import AutopilotConfig
    return AutopilotConfig(
        enabled_strategies=['support_resistance', 'ict_techniques'],
        min_confidence_threshold=0.7,
        trading_enabled=False,
        dry_run=True,
        ai_ollama_enabled=False
    )

@pytest.fixture
def mock_websocket():
    """Mock de WebSocket para testing"""
    mock_ws = AsyncMock()
    mock_ws.send = AsyncMock()
    mock_ws.recv = AsyncMock()
    mock_ws.close = AsyncMock()
    return mock_ws




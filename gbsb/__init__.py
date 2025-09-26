"""
Grok-Beast Scalping Bot - Sistema avanzado de trading automatizado
"""

__version__ = "2.0.0"
__author__ = "Grok-Beast Team"

# Importar módulos principales
from .ai.autopilot_engine import AutopilotEngine, AutopilotConfig, create_autopilot_engine
from .ai.ollama_integration import OllamaTradingAI, OllamaConfig
from .ai.auto_opportunity_detector import AutoOpportunityDetector, AutoDetectorConfig, create_auto_detector
from .exchanges.multi_exchange_manager import MultiExchangeManager, ExchangeConfig
from .technical_analysis.support_resistance import SupportResistanceAnalyzer
from .technical_analysis.channel_analysis import ChannelAnalyzer
from .technical_analysis.ict_analysis import ICTAnalyzer
from .technical_analysis.fibonacci_analysis import FibonacciAnalyzer
from .technical_analysis.session_analysis import SessionAnalyzer
from .technical_analysis.spread_analysis import SpreadAnalyzer
from .scanners.pair_scanner import PairScanner, ScanConfig, QuickOpportunity, create_pair_scanner
from .risk_management.risk_levels import RiskManager, RiskLevel, PositionSizing, create_risk_manager
from .fundamental_analysis.news_filter import NewsAnalyzer, NewsFilter, NewsSource, create_news_filter

__all__ = [
    'AutopilotEngine',
    'AutopilotConfig', 
    'create_autopilot_engine',
    'OllamaTradingAI',
    'OllamaConfig',
    'AutoOpportunityDetector',
    'AutoDetectorConfig',
    'create_auto_detector',
    'MultiExchangeManager',
    'ExchangeConfig',
    'SupportResistanceAnalyzer',
    'ChannelAnalyzer',
    'ICTAnalyzer',
    'FibonacciAnalyzer',
    'SessionAnalyzer',
    'SpreadAnalyzer',
    'PairScanner',
    'ScanConfig',
    'QuickOpportunity',
    'create_pair_scanner',
    'RiskManager',
    'RiskLevel',
    'PositionSizing',
    'create_risk_manager',
    'NewsAnalyzer',
    'NewsFilter',
    'NewsSource',
    'create_news_filter'
]

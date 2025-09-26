# Security package for Grok-Beast Trading Bot
from .security_middleware import (
    SecurityMiddleware,
    SecurityConfig,
    AuthenticationManager,
    SessionManager,
    get_current_user,
    require_permissions,
    audit_log,
    get_cors_config
)
from .input_validation import (
    InputSanitizer,
    TradingSymbolValidator,
    TradingSideValidator,
    OrderTypeValidator,
    RiskLevelValidator,
    TradingRequest,
    AutopilotConfigRequest,
    AnalysisRequest,
    RiskManagementRequest,
    validate_trading_parameters,
    validate_analysis_parameters,
    validate_config_parameters,
    sanitize_response,
    ValidationError
)
from .encryption import (
    EncryptionManager,
    APITokenManager,
    DatabaseEncryption,
    KeyManagement,
    SecureStorage,
    hash_sensitive_data,
    verify_hashed_data,
    generate_secure_password,
    generate_api_key,
    generate_session_token
)

__all__ = [
    # Security Middleware
    'SecurityMiddleware',
    'SecurityConfig',
    'AuthenticationManager',
    'SessionManager',
    'get_current_user',
    'require_permissions',
    'audit_log',
    'get_cors_config',
    
    # Input Validation
    'InputSanitizer',
    'TradingSymbolValidator',
    'TradingSideValidator',
    'OrderTypeValidator',
    'RiskLevelValidator',
    'TradingRequest',
    'AutopilotConfigRequest',
    'AnalysisRequest',
    'RiskManagementRequest',
    'validate_trading_parameters',
    'validate_analysis_parameters',
    'validate_config_parameters',
    'sanitize_response',
    'ValidationError',
    
    # Encryption
    'EncryptionManager',
    'APITokenManager',
    'DatabaseEncryption',
    'KeyManagement',
    'SecureStorage',
    'hash_sensitive_data',
    'verify_hashed_data',
    'generate_secure_password',
    'generate_api_key',
    'generate_session_token'
]




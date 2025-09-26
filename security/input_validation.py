"""
Validación de entrada y sanitización para Grok-Beast Trading Bot
"""
import re
import json
import decimal
from typing import Any, Dict, List, Optional, Union
from datetime import datetime, date
from decimal import Decimal, InvalidOperation
from pydantic import BaseModel, validator, Field
from fastapi import HTTPException
import structlog

logger = structlog.get_logger(__name__)

class ValidationError(Exception):
    """Excepción personalizada para errores de validación"""
    pass

class InputSanitizer:
    """Sanitizador de entrada"""
    
    @staticmethod
    def sanitize_string(value: str, max_length: int = 255) -> str:
        """Sanitizar string"""
        if not isinstance(value, str):
            value = str(value)
        
        # Remover caracteres de control
        value = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', value)
        
        # Limitar longitud
        value = value[:max_length]
        
        # Remover espacios extra
        value = value.strip()
        
        return value
    
    @staticmethod
    def sanitize_number(value: Union[str, int, float], min_val: float = None, max_val: float = None) -> float:
        """Sanitizar número"""
        try:
            if isinstance(value, str):
                # Remover caracteres no numéricos excepto punto y signo
                value = re.sub(r'[^\d.-]', '', value)
                num_value = float(value)
            else:
                num_value = float(value)
            
            if min_val is not None and num_value < min_val:
                raise ValidationError(f"Value {num_value} is below minimum {min_val}")
            
            if max_val is not None and num_value > max_val:
                raise ValidationError(f"Value {num_value} is above maximum {max_val}")
            
            return num_value
            
        except (ValueError, TypeError) as e:
            raise ValidationError(f"Invalid number format: {value}") from e
    
    @staticmethod
    def sanitize_decimal(value: Union[str, int, float], precision: int = 8) -> Decimal:
        """Sanitizar decimal con precisión específica"""
        try:
            if isinstance(value, str):
                # Validar formato decimal
                if not re.match(r'^-?\d+(\.\d+)?$', value):
                    raise ValidationError(f"Invalid decimal format: {value}")
            
            decimal_value = Decimal(str(value))
            
            # Redondear a la precisión especificada
            decimal_value = decimal_value.quantize(Decimal('0.' + '0' * precision))
            
            return decimal_value
            
        except (InvalidOperation, ValueError) as e:
            raise ValidationError(f"Invalid decimal: {value}") from e
    
    @staticmethod
    def sanitize_json(value: Union[str, dict]) -> dict:
        """Sanitizar JSON"""
        try:
            if isinstance(value, str):
                data = json.loads(value)
            else:
                data = value
            
            if not isinstance(data, dict):
                raise ValidationError("JSON must be an object")
            
            # Validar profundidad máxima
            if InputSanitizer._get_json_depth(data) > 10:
                raise ValidationError("JSON depth exceeds maximum")
            
            return data
            
        except json.JSONDecodeError as e:
            raise ValidationError(f"Invalid JSON: {str(e)}")
    
    @staticmethod
    def _get_json_depth(obj: Any, depth: int = 0) -> int:
        """Calcular profundidad de JSON"""
        if isinstance(obj, dict):
            return max((InputSanitizer._get_json_depth(value, depth + 1) for value in obj.values()), default=depth)
        elif isinstance(obj, list):
            return max((InputSanitizer._get_json_depth(item, depth + 1) for item in obj), default=depth)
        else:
            return depth

# Validadores para trading
class TradingSymbolValidator:
    """Validador de símbolos de trading"""
    
    VALID_SYMBOLS = {
        'BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'DOTUSDT', 'LINKUSDT',
        'BNBUSDT', 'XRPUSDT', 'SOLUSDT', 'MATICUSDT', 'AVAXUSDT'
    }
    
    @classmethod
    def validate_symbol(cls, symbol: str) -> str:
        """Validar símbolo de trading"""
        if not isinstance(symbol, str):
            raise ValidationError("Symbol must be a string")
        
        symbol = symbol.upper().strip()
        
        if not re.match(r'^[A-Z]{3,10}USDT$', symbol):
            raise ValidationError(f"Invalid symbol format: {symbol}")
        
        if symbol not in cls.VALID_SYMBOLS:
            logger.warning("Unknown trading symbol", symbol=symbol)
        
        return symbol
    
    @classmethod
    def is_valid_symbol(cls, symbol: str) -> bool:
        """Verificar si el símbolo es válido"""
        try:
            cls.validate_symbol(symbol)
            return True
        except ValidationError:
            return False

class TradingSideValidator:
    """Validador de lado de trading"""
    
    VALID_SIDES = {'BUY', 'SELL'}
    
    @classmethod
    def validate_side(cls, side: str) -> str:
        """Validar lado de trading"""
        if not isinstance(side, str):
            raise ValidationError("Side must be a string")
        
        side = side.upper().strip()
        
        if side not in cls.VALID_SIDES:
            raise ValidationError(f"Invalid trading side: {side}")
        
        return side

class OrderTypeValidator:
    """Validador de tipo de orden"""
    
    VALID_TYPES = {'MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT'}
    
    @classmethod
    def validate_order_type(cls, order_type: str) -> str:
        """Validar tipo de orden"""
        if not isinstance(order_type, str):
            raise ValidationError("Order type must be a string")
        
        order_type = order_type.upper().strip()
        
        if order_type not in cls.VALID_TYPES:
            raise ValidationError(f"Invalid order type: {order_type}")
        
        return order_type

class RiskLevelValidator:
    """Validador de nivel de riesgo"""
    
    VALID_LEVELS = {'conservative', 'risky', 'turbo'}
    
    @classmethod
    def validate_risk_level(cls, risk_level: str) -> str:
        """Validar nivel de riesgo"""
        if not isinstance(risk_level, str):
            raise ValidationError("Risk level must be a string")
        
        risk_level = risk_level.lower().strip()
        
        if risk_level not in cls.VALID_LEVELS:
            raise ValidationError(f"Invalid risk level: {risk_level}")
        
        return risk_level

# Modelos Pydantic para validación
class TradingRequest(BaseModel):
    """Request de trading validado"""
    
    symbol: str = Field(..., description="Trading symbol")
    side: str = Field(..., description="Buy or Sell")
    order_type: str = Field(..., description="Order type")
    quantity: Optional[Decimal] = Field(None, description="Order quantity")
    price: Optional[Decimal] = Field(None, description="Order price")
    stop_price: Optional[Decimal] = Field(None, description="Stop price")
    
    @validator('symbol')
    def validate_symbol(cls, v):
        return TradingSymbolValidator.validate_symbol(v)
    
    @validator('side')
    def validate_side(cls, v):
        return TradingSideValidator.validate_side(v)
    
    @validator('order_type')
    def validate_order_type(cls, v):
        return OrderTypeValidator.validate_order_type(v)
    
    @validator('quantity')
    def validate_quantity(cls, v):
        if v is not None:
            if v <= 0:
                raise ValidationError("Quantity must be positive")
            if v > Decimal('1000000'):  # Máximo 1M
                raise ValidationError("Quantity too large")
        return v
    
    @validator('price')
    def validate_price(cls, v):
        if v is not None:
            if v <= 0:
                raise ValidationError("Price must be positive")
            if v > Decimal('1000000'):  # Máximo $1M
                raise ValidationError("Price too large")
        return v
    
    @validator('stop_price')
    def validate_stop_price(cls, v):
        if v is not None:
            if v <= 0:
                raise ValidationError("Stop price must be positive")
        return v

class AutopilotConfigRequest(BaseModel):
    """Request de configuración de autopilot validado"""
    
    enabled_strategies: List[str] = Field(..., description="Enabled strategies")
    min_confidence_threshold: float = Field(..., ge=0.0, le=1.0, description="Minimum confidence")
    trading_enabled: bool = Field(..., description="Enable trading")
    dry_run: bool = Field(..., description="Dry run mode")
    risk_level: str = Field(..., description="Risk level")
    
    @validator('enabled_strategies')
    def validate_strategies(cls, v):
        valid_strategies = {
            'support_resistance', 'channel_analysis', 'ict_techniques',
            'fibonacci_analysis', 'session_analysis', 'spread_analysis'
        }
        
        for strategy in v:
            if strategy not in valid_strategies:
                raise ValidationError(f"Invalid strategy: {strategy}")
        
        return v
    
    @validator('risk_level')
    def validate_risk_level(cls, v):
        return RiskLevelValidator.validate_risk_level(v)

class AnalysisRequest(BaseModel):
    """Request de análisis técnico validado"""
    
    symbol: str = Field(..., description="Trading symbol")
    timeframe: str = Field(default="1h", description="Timeframe")
    limit: int = Field(default=100, ge=1, le=1000, description="Data points limit")
    
    @validator('symbol')
    def validate_symbol(cls, v):
        return TradingSymbolValidator.validate_symbol(v)
    
    @validator('timeframe')
    def validate_timeframe(cls, v):
        valid_timeframes = {'1m', '5m', '15m', '30m', '1h', '4h', '1d'}
        if v not in valid_timeframes:
            raise ValidationError(f"Invalid timeframe: {v}")
        return v

class RiskManagementRequest(BaseModel):
    """Request de gestión de riesgo validado"""
    
    account_balance: Decimal = Field(..., gt=0, description="Account balance")
    symbol: str = Field(..., description="Trading symbol")
    risk_level: str = Field(..., description="Risk level")
    leverage: Optional[int] = Field(None, ge=1, le=100, description="Leverage")
    
    @validator('symbol')
    def validate_symbol(cls, v):
        return TradingSymbolValidator.validate_symbol(v)
    
    @validator('risk_level')
    def validate_risk_level(cls, v):
        return RiskLevelValidator.validate_risk_level(v)
    
    @validator('account_balance')
    def validate_balance(cls, v):
        if v > Decimal('10000000'):  # Máximo $10M
            raise ValidationError("Account balance too large")
        return v

# Funciones de validación de API
def validate_trading_parameters(params: Dict[str, Any]) -> Dict[str, Any]:
    """Validar parámetros de trading"""
    try:
        # Validar símbolo
        if 'symbol' in params:
            params['symbol'] = TradingSymbolValidator.validate_symbol(params['symbol'])
        
        # Validar lado
        if 'side' in params:
            params['side'] = TradingSideValidator.validate_side(params['side'])
        
        # Validar cantidad
        if 'quantity' in params:
            params['quantity'] = InputSanitizer.sanitize_decimal(
                params['quantity'], precision=8
            )
        
        # Validar precio
        if 'price' in params:
            params['price'] = InputSanitizer.sanitize_decimal(
                params['price'], precision=2
            )
        
        return params
        
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))

def validate_analysis_parameters(params: Dict[str, Any]) -> Dict[str, Any]:
    """Validar parámetros de análisis"""
    try:
        # Validar símbolo
        if 'symbol' in params:
            params['symbol'] = TradingSymbolValidator.validate_symbol(params['symbol'])
        
        # Validar límite
        if 'limit' in params:
            params['limit'] = int(InputSanitizer.sanitize_number(
                params['limit'], min_val=1, max_val=1000
            ))
        
        return params
        
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))

def validate_config_parameters(params: Dict[str, Any]) -> Dict[str, Any]:
    """Validar parámetros de configuración"""
    try:
        # Sanitizar strings
        for key in ['risk_level', 'strategy']:
            if key in params and isinstance(params[key], str):
                params[key] = InputSanitizer.sanitize_string(params[key])
        
        # Validar números
        for key in ['confidence_threshold', 'max_position_size']:
            if key in params:
                params[key] = InputSanitizer.sanitize_number(
                    params[key], min_val=0, max_val=1 if 'confidence' in key else 1000000
                )
        
        return params
        
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Sanitización de respuestas
def sanitize_response(data: Any) -> Any:
    """Sanitizar respuesta antes de enviar"""
    if isinstance(data, dict):
        return {k: sanitize_response(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_response(item) for item in data]
    elif isinstance(data, str):
        # Remover caracteres potencialmente peligrosos
        return re.sub(r'[<>"\']', '', data)
    elif isinstance(data, (int, float, bool, type(None))):
        return data
    else:
        return str(data)

# Validación de archivos
def validate_file_upload(file_content: bytes, max_size: int = 10 * 1024 * 1024) -> bytes:
    """Validar archivo subido"""
    if len(file_content) > max_size:
        raise ValidationError(f"File too large. Maximum size: {max_size} bytes")
    
    # Verificar que no contenga contenido ejecutable
    executable_signatures = [b'<script', b'javascript:', b'vbscript:', b'<iframe']
    content_lower = file_content.lower()
    
    for signature in executable_signatures:
        if signature in content_lower:
            raise ValidationError("File contains potentially malicious content")
    
    return file_content

# Logging de validación
def log_validation_error(field: str, value: Any, error: str):
    """Log de errores de validación"""
    logger.warning(
        "Validation error",
        field=field,
        value=str(value)[:100],  # Limitar longitud
        error=error
    )

def log_validation_success(field: str, value: Any):
    """Log de validación exitosa"""
    logger.debug(
        "Validation success",
        field=field,
        value_type=type(value).__name__
    )




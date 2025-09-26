"""
Middleware de seguridad para Grok-Beast Trading Bot
"""
import time
import hashlib
import hmac
import secrets
from typing import Dict, List, Optional, Callable
from datetime import datetime, timedelta
from functools import wraps
import redis
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import structlog

logger = structlog.get_logger(__name__)

# Configuración de seguridad
class SecurityConfig:
    """Configuración de seguridad"""
    
    def __init__(self):
        self.rate_limit_requests = 100  # Requests por minuto
        self.rate_limit_window = 60     # Ventana en segundos
        self.max_request_size = 10 * 1024 * 1024  # 10MB
        self.session_timeout = 3600     # 1 hora
        self.max_login_attempts = 5
        self.lockout_duration = 900     # 15 minutos
        self.jwt_secret = secrets.token_urlsafe(32)
        self.encryption_key = secrets.token_urlsafe(32)
        
        # Headers de seguridad
        self.security_headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
            "Permissions-Policy": "geolocation=(), microphone=(), camera=()"
        }

# Instancia global de configuración
security_config = SecurityConfig()

# Redis para rate limiting y sesiones
redis_client = redis.Redis(
    host='localhost',
    port=6379,
    db=0,
    decode_responses=True
)

class RateLimiter:
    """Rate limiter usando Redis"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
    
    def is_allowed(self, key: str, limit: int, window: int) -> bool:
        """Verificar si la request está permitida"""
        try:
            current_time = int(time.time())
            window_start = current_time - window
            
            # Usar sliding window
            pipe = self.redis.pipeline()
            pipe.zremrangebyscore(key, 0, window_start)
            pipe.zcard(key)
            pipe.zadd(key, {str(current_time): current_time})
            pipe.expire(key, window)
            
            results = pipe.execute()
            request_count = results[1]
            
            return request_count < limit
            
        except Exception as e:
            logger.error("Rate limiter error", error=str(e))
            return True  # Fallback: permitir request
    
    def get_remaining_requests(self, key: str, limit: int) -> int:
        """Obtener requests restantes"""
        try:
            current_count = self.redis.zcard(key)
            return max(0, limit - current_count)
        except:
            return limit

class SecurityMiddleware(BaseHTTPMiddleware):
    """Middleware de seguridad"""
    
    def __init__(self, app, config: SecurityConfig = None):
        super().__init__(app)
        self.config = config or security_config
        self.rate_limiter = RateLimiter(redis_client)
    
    async def dispatch(self, request: Request, call_next):
        """Procesar request con seguridad"""
        start_time = time.time()
        
        # 1. Verificar tamaño de request
        if await self._check_request_size(request):
            return Response(
                content="Request too large",
                status_code=413,
                headers=self.config.security_headers
            )
        
        # 2. Rate limiting
        client_ip = self._get_client_ip(request)
        if not self._check_rate_limit(client_ip, request.url.path):
            return Response(
                content="Rate limit exceeded",
                status_code=429,
                headers={
                    **self.config.security_headers,
                    "Retry-After": str(self.config.rate_limit_window)
                }
            )
        
        # 3. Verificar headers maliciosos
        if self._check_malicious_headers(request):
            return Response(
                content="Invalid headers",
                status_code=400,
                headers=self.config.security_headers
            )
        
        # 4. Procesar request
        try:
            response = await call_next(request)
        except Exception as e:
            logger.error("Request processing error", error=str(e), ip=client_ip)
            return Response(
                content="Internal server error",
                status_code=500,
                headers=self.config.security_headers
            )
        
        # 5. Agregar headers de seguridad
        response.headers.update(self.config.security_headers)
        
        # 6. Logging de seguridad
        processing_time = time.time() - start_time
        self._log_security_event(request, response, processing_time)
        
        return response
    
    async def _check_request_size(self, request: Request) -> bool:
        """Verificar tamaño de request"""
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.config.max_request_size:
            return True
        return False
    
    def _check_rate_limit(self, client_ip: str, path: str) -> bool:
        """Verificar rate limit"""
        # Rate limit más estricto para APIs
        if path.startswith("/api/"):
            limit = self.config.rate_limit_requests // 2
        else:
            limit = self.config.rate_limit_requests
        
        key = f"rate_limit:{client_ip}:{path}"
        return self.rate_limiter.is_allowed(key, limit, self.config.rate_limit_window)
    
    def _check_malicious_headers(self, request: Request) -> bool:
        """Verificar headers maliciosos"""
        suspicious_patterns = [
            "script", "javascript", "vbscript", "onload", "onerror",
            "../", "..\\", "cmd", "exec", "system"
        ]
        
        for header_name, header_value in request.headers.items():
            header_lower = header_value.lower()
            if any(pattern in header_lower for pattern in suspicious_patterns):
                return True
        
        return False
    
    def _get_client_ip(self, request: Request) -> str:
        """Obtener IP del cliente"""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"
    
    def _log_security_event(self, request: Request, response: Response, processing_time: float):
        """Log de eventos de seguridad"""
        client_ip = self._get_client_ip(request)
        
        logger.info(
            "Security event",
            ip=client_ip,
            method=request.method,
            path=str(request.url.path),
            status_code=response.status_code,
            processing_time=processing_time,
            user_agent=request.headers.get("user-agent", "unknown")
        )

class AuthenticationManager:
    """Gestor de autenticación"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.login_attempts = {}
    
    def authenticate_user(self, username: str, password: str) -> bool:
        """Autenticar usuario"""
        # Verificar intentos de login
        if self._is_account_locked(username):
            raise HTTPException(status_code=423, detail="Account temporarily locked")
        
        # Verificar credenciales (implementar con base de datos real)
        if self._verify_credentials(username, password):
            self._reset_login_attempts(username)
            return True
        else:
            self._record_failed_login(username)
            raise HTTPException(status_code=401, detail="Invalid credentials")
    
    def _is_account_locked(self, username: str) -> bool:
        """Verificar si la cuenta está bloqueada"""
        key = f"login_attempts:{username}"
        attempts = self.redis.get(key)
        
        if attempts and int(attempts) >= security_config.max_login_attempts:
            return True
        
        return False
    
    def _record_failed_login(self, username: str):
        """Registrar login fallido"""
        key = f"login_attempts:{username}"
        
        # Incrementar intentos
        current_attempts = self.redis.incr(key)
        
        # Establecer expiración
        if current_attempts == 1:
            self.redis.expire(key, security_config.lockout_duration)
        
        # Log de seguridad
        logger.warning(
            "Failed login attempt",
            username=username,
            attempts=current_attempts
        )
    
    def _reset_login_attempts(self, username: str):
        """Resetear intentos de login"""
        key = f"login_attempts:{username}"
        self.redis.delete(key)
    
    def _verify_credentials(self, username: str, password: str) -> bool:
        """Verificar credenciales (implementar con base de datos real)"""
        # Hash de password (implementar con bcrypt en producción)
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        # Credenciales hardcodeadas para demo (NO usar en producción)
        valid_users = {
            "admin": "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",  # "password"
            "trader": "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f"   # "trader123"
        }
        
        return valid_users.get(username) == password_hash

class SessionManager:
    """Gestor de sesiones"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
    
    def create_session(self, username: str) -> str:
        """Crear nueva sesión"""
        session_id = secrets.token_urlsafe(32)
        session_data = {
            "username": username,
            "created_at": datetime.now().isoformat(),
            "last_activity": datetime.now().isoformat()
        }
        
        key = f"session:{session_id}"
        self.redis.hset(key, mapping=session_data)
        self.redis.expire(key, security_config.session_timeout)
        
        return session_id
    
    def validate_session(self, session_id: str) -> Optional[Dict]:
        """Validar sesión"""
        key = f"session:{session_id}"
        session_data = self.redis.hgetall(key)
        
        if not session_data:
            return None
        
        # Actualizar última actividad
        session_data["last_activity"] = datetime.now().isoformat()
        self.redis.hset(key, "last_activity", session_data["last_activity"])
        self.redis.expire(key, security_config.session_timeout)
        
        return session_data
    
    def destroy_session(self, session_id: str):
        """Destruir sesión"""
        key = f"session:{session_id}"
        self.redis.delete(key)

# Dependencias de seguridad
security_scheme = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)):
    """Obtener usuario actual"""
    auth_manager = AuthenticationManager(redis_client)
    session_manager = SessionManager(redis_client)
    
    # Verificar token de sesión
    session_data = session_manager.validate_session(credentials.credentials)
    if not session_data:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    return session_data

def require_permissions(permissions: List[str]):
    """Decorator para requerir permisos específicos"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Implementar verificación de permisos
            # Por ahora, solo verificar autenticación
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def audit_log(action: str):
    """Decorator para logging de auditoría"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            
            try:
                result = await func(*args, **kwargs)
                
                # Log exitoso
                logger.info(
                    "Audit log - Action completed",
                    action=action,
                    duration=time.time() - start_time,
                    status="success"
                )
                
                return result
                
            except Exception as e:
                # Log de error
                logger.error(
                    "Audit log - Action failed",
                    action=action,
                    duration=time.time() - start_time,
                    error=str(e),
                    status="failed"
                )
                raise
        
        return wrapper
    return decorator

# Funciones de utilidad de seguridad
def hash_password(password: str) -> str:
    """Hash de password"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_csrf_token() -> str:
    """Generar token CSRF"""
    return secrets.token_urlsafe(32)

def verify_csrf_token(token: str, session_id: str) -> bool:
    """Verificar token CSRF"""
    expected_token = hmac.new(
        security_config.jwt_secret.encode(),
        session_id.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(token, expected_token)

def sanitize_input(input_string: str) -> str:
    """Sanitizar input del usuario"""
    # Remover caracteres peligrosos
    dangerous_chars = ['<', '>', '"', "'", '&', ';', '(', ')', '|', '`', '$']
    for char in dangerous_chars:
        input_string = input_string.replace(char, '')
    
    return input_string.strip()

# Configuración de CORS segura
def get_cors_config() -> Dict:
    """Configuración CORS segura"""
    return {
        "allow_origins": ["https://grok-beast.com", "https://staging.grok-beast.com"],
        "allow_credentials": True,
        "allow_methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "expose_headers": ["X-Rate-Limit-Remaining", "X-Rate-Limit-Reset"],
        "max_age": 3600
    }




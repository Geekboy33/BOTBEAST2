"""
Sistema de encriptación y protección de datos para Grok-Beast Trading Bot
"""
import os
import base64
import hashlib
import secrets
from typing import Dict, Any, Optional, Union
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import structlog

logger = structlog.get_logger(__name__)

class EncryptionManager:
    """Gestor de encriptación"""
    
    def __init__(self, master_key: Optional[str] = None):
        self.master_key = master_key or os.getenv('ENCRYPTION_MASTER_KEY', secrets.token_urlsafe(32))
        self.backend = default_backend()
        
        # Generar clave de encriptación derivada
        self._derive_encryption_key()
    
    def _derive_encryption_key(self):
        """Derivar clave de encriptación desde master key"""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'grok_beast_salt',  # En producción usar salt aleatorio
            iterations=100000,
            backend=self.backend
        )
        
        key = base64.urlsafe_b64encode(kdf.derive(self.master_key.encode()))
        self.fernet = Fernet(key)
    
    def encrypt_data(self, data: Union[str, bytes, Dict[str, Any]]) -> str:
        """Encriptar datos"""
        try:
            if isinstance(data, dict):
                data_str = str(data)
            elif isinstance(data, bytes):
                data_str = data.decode('utf-8')
            else:
                data_str = str(data)
            
            encrypted_data = self.fernet.encrypt(data_str.encode())
            return base64.urlsafe_b64encode(encrypted_data).decode()
            
        except Exception as e:
            logger.error("Encryption error", error=str(e))
            raise ValueError(f"Failed to encrypt data: {str(e)}")
    
    def decrypt_data(self, encrypted_data: str) -> str:
        """Desencriptar datos"""
        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted_data = self.fernet.decrypt(encrypted_bytes)
            return decrypted_data.decode('utf-8')
            
        except Exception as e:
            logger.error("Decryption error", error=str(e))
            raise ValueError(f"Failed to decrypt data: {str(e)}")
    
    def encrypt_sensitive_field(self, field_name: str, value: str) -> str:
        """Encriptar campo sensible con metadata"""
        metadata = f"{field_name}:{len(value)}:"
        encrypted_value = self.encrypt_data(value)
        return metadata + encrypted_value
    
    def decrypt_sensitive_field(self, encrypted_field: str) -> tuple[str, str]:
        """Desencriptar campo sensible con metadata"""
        try:
            # Extraer metadata
            parts = encrypted_field.split(':', 2)
            if len(parts) != 3:
                raise ValueError("Invalid encrypted field format")
            
            field_name, expected_length, encrypted_value = parts
            
            # Desencriptar valor
            decrypted_value = self.decrypt_data(encrypted_value)
            
            # Verificar longitud
            if len(decrypted_value) != int(expected_length):
                raise ValueError("Field length mismatch")
            
            return field_name, decrypted_value
            
        except Exception as e:
            logger.error("Sensitive field decryption error", error=str(e))
            raise ValueError(f"Failed to decrypt sensitive field: {str(e)}")

class APITokenManager:
    """Gestor de tokens de API"""
    
    def __init__(self, encryption_manager: EncryptionManager):
        self.encryption_manager = encryption_manager
        self.tokens: Dict[str, Dict[str, Any]] = {}
    
    def generate_api_token(self, user_id: str, permissions: list, expires_in_days: int = 30) -> str:
        """Generar token de API"""
        token_id = secrets.token_urlsafe(32)
        token_data = {
            'user_id': user_id,
            'permissions': permissions,
            'created_at': self._get_timestamp(),
            'expires_at': self._get_timestamp() + (expires_in_days * 24 * 60 * 60),
            'last_used': None,
            'usage_count': 0
        }
        
        # Encriptar datos del token
        encrypted_data = self.encryption_manager.encrypt_data(token_data)
        
        # Guardar token
        self.tokens[token_id] = {
            'encrypted_data': encrypted_data,
            'is_active': True
        }
        
        logger.info("API token generated", user_id=user_id, token_id=token_id[:8])
        
        return token_id
    
    def validate_api_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Validar token de API"""
        if token not in self.tokens:
            return None
        
        token_info = self.tokens[token]
        if not token_info['is_active']:
            return None
        
        try:
            # Desencriptar datos del token
            token_data = self.encryption_manager.decrypt_data(token_info['encrypted_data'])
            token_dict = eval(token_data)  # En producción usar json.loads
            
            # Verificar expiración
            if token_dict['expires_at'] < self._get_timestamp():
                self.revoke_token(token)
                return None
            
            # Actualizar uso
            token_dict['last_used'] = self._get_timestamp()
            token_dict['usage_count'] += 1
            
            # Guardar cambios
            encrypted_data = self.encryption_manager.encrypt_data(token_dict)
            self.tokens[token]['encrypted_data'] = encrypted_data
            
            return token_dict
            
        except Exception as e:
            logger.error("Token validation error", error=str(e))
            return None
    
    def revoke_token(self, token: str):
        """Revocar token"""
        if token in self.tokens:
            self.tokens[token]['is_active'] = False
            logger.info("API token revoked", token_id=token[:8])
    
    def _get_timestamp(self) -> int:
        """Obtener timestamp actual"""
        import time
        return int(time.time())

class DatabaseEncryption:
    """Encriptación de base de datos"""
    
    def __init__(self, encryption_manager: EncryptionManager):
        self.encryption_manager = encryption_manager
        self.encrypted_fields = {
            'api_keys', 'secret_keys', 'passwords', 'private_keys',
            'wallet_addresses', 'personal_data'
        }
    
    def encrypt_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Encriptar registro de base de datos"""
        encrypted_record = record.copy()
        
        for field, value in record.items():
            if field in self.encrypted_fields and value:
                encrypted_record[field] = self.encryption_manager.encrypt_sensitive_field(
                    field, str(value)
                )
        
        return encrypted_record
    
    def decrypt_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Desencriptar registro de base de datos"""
        decrypted_record = record.copy()
        
        for field, value in record.items():
            if field in self.encrypted_fields and value and str(value).startswith(field + ':'):
                try:
                    _, decrypted_value = self.encryption_manager.decrypt_sensitive_field(str(value))
                    decrypted_record[field] = decrypted_value
                except Exception as e:
                    logger.error("Record decryption error", field=field, error=str(e))
                    # Mantener valor encriptado si falla la desencriptación
                    pass
        
        return decrypted_record

class KeyManagement:
    """Gestión de claves de encriptación"""
    
    def __init__(self):
        self.keys: Dict[str, Any] = {}
    
    def generate_key_pair(self, key_name: str) -> tuple[str, str]:
        """Generar par de claves RSA"""
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        
        public_key = private_key.public_key()
        
        # Serializar claves
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode()
        
        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode()
        
        # Guardar claves
        self.keys[key_name] = {
            'private': private_pem,
            'public': public_pem
        }
        
        logger.info("RSA key pair generated", key_name=key_name)
        
        return private_pem, public_pem
    
    def encrypt_with_public_key(self, data: str, public_key_pem: str) -> str:
        """Encriptar con clave pública"""
        try:
            public_key = serialization.load_pem_public_key(
                public_key_pem.encode(),
                backend=default_backend()
            )
            
            encrypted_data = public_key.encrypt(
                data.encode(),
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            
            return base64.urlsafe_b64encode(encrypted_data).decode()
            
        except Exception as e:
            logger.error("Public key encryption error", error=str(e))
            raise ValueError(f"Failed to encrypt with public key: {str(e)}")
    
    def decrypt_with_private_key(self, encrypted_data: str, private_key_pem: str) -> str:
        """Desencriptar con clave privada"""
        try:
            private_key = serialization.load_pem_private_key(
                private_key_pem.encode(),
                password=None,
                backend=default_backend()
            )
            
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted_data = private_key.decrypt(
                encrypted_bytes,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            
            return decrypted_data.decode('utf-8')
            
        except Exception as e:
            logger.error("Private key decryption error", error=str(e))
            raise ValueError(f"Failed to decrypt with private key: {str(e)}")

class SecureStorage:
    """Almacenamiento seguro de datos sensibles"""
    
    def __init__(self, encryption_manager: EncryptionManager):
        self.encryption_manager = encryption_manager
        self.storage: Dict[str, str] = {}
    
    def store_sensitive_data(self, key: str, data: Dict[str, Any]) -> str:
        """Almacenar datos sensibles de forma segura"""
        # Generar ID único
        storage_id = secrets.token_urlsafe(16)
        
        # Encriptar datos
        encrypted_data = self.encryption_manager.encrypt_data(data)
        
        # Almacenar
        self.storage[storage_id] = encrypted_data
        
        # Limpiar datos sensibles de memoria
        del data
        
        logger.info("Sensitive data stored", key=key, storage_id=storage_id[:8])
        
        return storage_id
    
    def retrieve_sensitive_data(self, storage_id: str) -> Optional[Dict[str, Any]]:
        """Recuperar datos sensibles"""
        if storage_id not in self.storage:
            return None
        
        try:
            encrypted_data = self.storage[storage_id]
            decrypted_data = self.encryption_manager.decrypt_data(encrypted_data)
            return eval(decrypted_data)  # En producción usar json.loads
            
        except Exception as e:
            logger.error("Data retrieval error", storage_id=storage_id[:8], error=str(e))
            return None
    
    def delete_sensitive_data(self, storage_id: str):
        """Eliminar datos sensibles"""
        if storage_id in self.storage:
            del self.storage[storage_id]
            logger.info("Sensitive data deleted", storage_id=storage_id[:8])

# Funciones de utilidad
def hash_sensitive_data(data: str, salt: Optional[str] = None) -> str:
    """Hash de datos sensibles"""
    if salt is None:
        salt = secrets.token_urlsafe(16)
    
    hash_input = (salt + data).encode()
    hash_output = hashlib.sha256(hash_input).hexdigest()
    
    return f"{salt}:{hash_output}"

def verify_hashed_data(data: str, hashed_data: str) -> bool:
    """Verificar datos hasheados"""
    try:
        salt, stored_hash = hashed_data.split(':', 1)
        computed_hash = hashlib.sha256((salt + data).encode()).hexdigest()
        return computed_hash == stored_hash
    except:
        return False

def generate_secure_password(length: int = 16) -> str:
    """Generar contraseña segura"""
    characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    return ''.join(secrets.choice(characters) for _ in range(length))

def generate_api_key() -> str:
    """Generar clave de API segura"""
    return secrets.token_urlsafe(32)

def generate_session_token() -> str:
    """Generar token de sesión seguro"""
    return secrets.token_urlsafe(32)

# Instancias globales
encryption_manager = EncryptionManager()
api_token_manager = APITokenManager(encryption_manager)
database_encryption = DatabaseEncryption(encryption_manager)
key_management = KeyManagement()
secure_storage = SecureStorage(encryption_manager)




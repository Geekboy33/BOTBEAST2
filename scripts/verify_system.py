#!/usr/bin/env python3
"""
Script de verificación del sistema Grok-Beast Trading Bot
Verifica todos los prerequisitos y componentes necesarios
"""

import subprocess
import sys
import json
import requests
import os
from pathlib import Path
import platform

class SystemVerifier:
    def __init__(self):
        self.checks_passed = 0
        self.checks_failed = 0
        self.warnings = []
        self.errors = []
    
    def print_header(self, title):
        print(f"\n{'='*60}")
        print(f"🔍 {title}")
        print(f"{'='*60}")
    
    def print_check(self, name, status, details=""):
        if status:
            print(f"✅ {name}")
            self.checks_passed += 1
        else:
            print(f"❌ {name}")
            self.checks_failed += 1
            if details:
                print(f"   {details}")
    
    def print_warning(self, message):
        print(f"⚠️  {message}")
        self.warnings.append(message)
    
    def print_error(self, message):
        print(f"❌ ERROR: {message}")
        self.errors.append(message)
    
    def run_command(self, command, capture_output=True):
        """Ejecutar comando y retornar resultado"""
        try:
            result = subprocess.run(
                command, 
                shell=True, 
                capture_output=capture_output, 
                text=True, 
                timeout=30
            )
            return result.returncode == 0, result.stdout.strip(), result.stderr.strip()
        except subprocess.TimeoutExpired:
            return False, "", "Timeout"
        except Exception as e:
            return False, "", str(e)
    
    def check_python_version(self):
        """Verificar versión de Python"""
        self.print_header("VERIFICACIÓN DE PYTHON")
        
        try:
            version = sys.version_info
            version_str = f"{version.major}.{version.minor}.{version.micro}"
            
            if version.major == 3 and version.minor >= 11:
                self.print_check(f"Python {version_str}", True)
                return True
            else:
                self.print_check(f"Python {version_str}", False, "Se requiere Python 3.11+")
                return False
        except Exception as e:
            self.print_check("Python", False, str(e))
            return False
    
    def check_node_version(self):
        """Verificar versión de Node.js"""
        self.print_header("VERIFICACIÓN DE NODE.JS")
        
        # Verificar Node.js
        success, output, error = self.run_command("node -v")
        if success and output:
            version = output.replace('v', '')
            major_version = int(version.split('.')[0])
            if major_version >= 18:
                self.print_check(f"Node.js {version}", True)
            else:
                self.print_check(f"Node.js {version}", False, "Se requiere Node.js 18+")
                return False
        else:
            self.print_check("Node.js", False, "Node.js no encontrado")
            return False
        
        # Verificar npm
        success, output, error = self.run_command("npm -v")
        if success and output:
            self.print_check(f"npm {output}", True)
            return True
        else:
            self.print_check("npm", False, "npm no encontrado")
            return False
    
    def check_git_version(self):
        """Verificar Git (opcional)"""
        self.print_header("VERIFICACIÓN DE GIT (OPCIONAL)")
        
        success, output, error = self.run_command("git --version")
        if success and output:
            self.print_check(output, True)
            return True
        else:
            self.print_warning("Git no encontrado (opcional)")
            return False
    
    def check_ollama_installation(self):
        """Verificar instalación de Ollama"""
        self.print_header("VERIFICACIÓN DE OLLAMA")
        
        # Verificar comando ollama
        success, output, error = self.run_command("ollama --version")
        if success and output:
            self.print_check(f"Ollama {output}", True)
        else:
            self.print_check("Ollama", False, "Ollama no encontrado")
            return False
        
        # Verificar que el daemon esté corriendo
        try:
            response = requests.get("http://127.0.0.1:11434/api/tags", timeout=5)
            if response.status_code == 200:
                self.print_check("Ollama daemon", True, "Daemon corriendo en puerto 11434")
            else:
                self.print_check("Ollama daemon", False, "Daemon no responde")
                return False
        except requests.exceptions.RequestException:
            self.print_check("Ollama daemon", False, "No se puede conectar al daemon")
            self.print_warning("Ejecuta: ollama serve &")
            return False
        
        # Verificar modelo base
        try:
            response = requests.get("http://127.0.0.1:11434/api/tags", timeout=5)
            models = response.json().get("models", [])
            model_names = [model["name"] for model in models]
            
            if "gpt-oss:120b" in model_names:
                self.print_check("Modelo gpt-oss:120b", True)
            else:
                self.print_check("Modelo gpt-oss:120b", False, "Modelo no encontrado")
                self.print_warning("Ejecuta: ollama pull gpt-oss:120b")
                return False
            
            if "trader-oss-120" in model_names:
                self.print_check("Modelo trader-oss-120", True, "Modelo fine-tuned encontrado")
            else:
                self.print_warning("Modelo trader-oss-120 no encontrado (se creará después del fine-tuning)")
            
            return True
            
        except Exception as e:
            self.print_check("Modelos Ollama", False, str(e))
            return False
    
    def check_python_dependencies(self):
        """Verificar dependencias de Python"""
        self.print_header("VERIFICACIÓN DE DEPENDENCIAS PYTHON")
        
        # Verificar si existe requirements.txt
        if not Path("requirements.txt").exists():
            self.print_check("requirements.txt", False, "Archivo no encontrado")
            return False
        
        self.print_check("requirements.txt", True)
        
        # Verificar dependencias principales
        key_packages = [
            "fastapi",
            "uvicorn",
            "pandas",
            "numpy",
            "requests",
            "pydantic"
        ]
        
        all_installed = True
        for package in key_packages:
            try:
                __import__(package)
                self.print_check(package, True)
            except ImportError:
                self.print_check(package, False, f"Instalar: pip install {package}")
                all_installed = False
        
        return all_installed
    
    def check_virtual_environment(self):
        """Verificar entorno virtual"""
        self.print_header("VERIFICACIÓN DE ENTORNO VIRTUAL")
        
        # Verificar si estamos en un venv
        if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
            venv_path = sys.prefix
            self.print_check("Entorno virtual activo", True, f"Path: {venv_path}")
            return True
        else:
            self.print_warning("No estás en un entorno virtual")
            self.print_warning("Recomendado: python -m venv .venv && source .venv/bin/activate")
            return False
    
    def check_frontend_build(self):
        """Verificar build del frontend"""
        self.print_header("VERIFICACIÓN DEL FRONTEND")
        
        # Verificar directorio frontend
        frontend_path = Path("frontend")
        if not frontend_path.exists():
            self.print_check("Directorio frontend", False, "Directorio no encontrado")
            return False
        
        self.print_check("Directorio frontend", True)
        
        # Verificar package.json
        package_json = frontend_path / "package.json"
        if not package_json.exists():
            self.print_check("package.json", False, "Archivo no encontrado")
            return False
        
        self.print_check("package.json", True)
        
        # Verificar node_modules
        node_modules = frontend_path / "node_modules"
        if node_modules.exists():
            self.print_check("node_modules", True)
        else:
            self.print_check("node_modules", False, "Ejecutar: npm install")
            return False
        
        # Verificar build
        dist_path = frontend_path / "dist"
        if dist_path.exists() and any(dist_path.iterdir()):
            self.print_check("Build frontend", True, "Directorio dist/ existe")
            return True
        else:
            self.print_check("Build frontend", False, "Ejecutar: npm run build")
            return False
    
    def check_environment_file(self):
        """Verificar archivo de configuración"""
        self.print_header("VERIFICACIÓN DE CONFIGURACIÓN")
        
        # Verificar .env
        env_file = Path(".env")
        if env_file.exists():
            self.print_check(".env", True)
            
            # Verificar variables importantes
            with open(env_file, 'r') as f:
                content = f.read()
            
            required_vars = [
                "OLLAMA_MODEL",
                "OLLAMA_HOST",
                "VIRTUAL_TRADER_ENABLED"
            ]
            
            for var in required_vars:
                if var in content:
                    self.print_check(f"Variable {var}", True)
                else:
                    self.print_check(f"Variable {var}", False, f"Agregar a .env")
            
            return True
        else:
            self.print_check(".env", False, "Crear desde env.example")
            env_example = Path("env.example")
            if env_example.exists():
                self.print_warning("Ejecutar: cp env.example .env")
            return False
    
    def check_project_structure(self):
        """Verificar estructura del proyecto"""
        self.print_header("VERIFICACIÓN DE ESTRUCTURA DEL PROYECTO")
        
        required_dirs = [
            "gbsb",
            "gbsb/ai",
            "gbsb/trading",
            "gbsb/dashboard",
            "scripts",
            "frontend",
            "docs"
        ]
        
        required_files = [
            "gbsb/config.py",
            "gbsb/ai/controller.py",
            "gbsb/ai/ollama_client.py",
            "gbsb/trading/engine.py",
            "gbsb/trading/virtual_trader.py",
            "scripts/run_dashboard.py",
            "scripts/run_bot.py",
            "Modelfile.trader"
        ]
        
        all_good = True
        
        for dir_path in required_dirs:
            if Path(dir_path).exists():
                self.print_check(f"Directorio {dir_path}", True)
            else:
                self.print_check(f"Directorio {dir_path}", False)
                all_good = False
        
        for file_path in required_files:
            if Path(file_path).exists():
                self.print_check(f"Archivo {file_path}", True)
            else:
                self.print_check(f"Archivo {file_path}", False)
                all_good = False
        
        return all_good
    
    def test_ollama_client(self):
        """Probar cliente Ollama"""
        self.print_header("PRUEBA DEL CLIENTE OLLAMA")
        
        try:
            import os
            import sys
            # Agregar el directorio actual al PYTHONPATH
            current_dir = os.getcwd()
            if current_dir not in sys.path:
                sys.path.insert(0, current_dir)
            
            from gbsb.ai.ollama_client import OllamaClient
            client = OllamaClient()
            
            # Prueba simple
            response = client._call("Hola, ¿funcionas?", temperature=0.0, max_tokens=10)
            if response and len(response) > 0:
                self.print_check("Cliente Ollama", True, f"Respuesta: {response[:50]}...")
                return True
            else:
                self.print_check("Cliente Ollama", False, "Sin respuesta")
                return False
                
        except ImportError as e:
            self.print_check("Cliente Ollama", False, f"Import error: {e}")
            return False
        except Exception as e:
            self.print_check("Cliente Ollama", False, f"Error: {e}")
            return False
    
    def generate_report(self):
        """Generar reporte final"""
        self.print_header("REPORTE FINAL")
        
        total_checks = self.checks_passed + self.checks_failed
        success_rate = (self.checks_passed / total_checks * 100) if total_checks > 0 else 0
        
        print(f"📊 Estadísticas:")
        print(f"   ✅ Checks exitosos: {self.checks_passed}")
        print(f"   ❌ Checks fallidos: {self.checks_failed}")
        print(f"   📈 Tasa de éxito: {success_rate:.1f}%")
        
        if self.warnings:
            print(f"\n⚠️  Advertencias ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"   - {warning}")
        
        if self.errors:
            print(f"\n❌ Errores ({len(self.errors)}):")
            for error in self.errors:
                print(f"   - {error}")
        
        if success_rate >= 90:
            print(f"\n🎉 ¡Sistema listo! Puedes proceder con la ejecución.")
        elif success_rate >= 70:
            print(f"\n⚠️  Sistema parcialmente listo. Revisa los errores antes de continuar.")
        else:
            print(f"\n❌ Sistema no listo. Corrige los errores antes de continuar.")
        
        return success_rate >= 90

def main():
    print("🚀 VERIFICADOR DEL SISTEMA GROK-BEAST TRADING BOT")
    print("=" * 60)
    
    verifier = SystemVerifier()
    
    # Ejecutar todas las verificaciones
    verifier.check_python_version()
    verifier.check_node_version()
    verifier.check_git_version()
    verifier.check_virtual_environment()
    verifier.check_python_dependencies()
    verifier.check_ollama_installation()
    verifier.check_frontend_build()
    verifier.check_environment_file()
    verifier.check_project_structure()
    verifier.test_ollama_client()
    
    # Generar reporte final
    system_ready = verifier.generate_report()
    
    if system_ready:
        print(f"\n🚀 COMANDOS PARA INICIAR:")
        print(f"   1. Terminal 1: python scripts/run_dashboard.py")
        print(f"   2. Terminal 2: python scripts/run_bot.py")
        print(f"   3. Navegador: http://localhost:8000")
    
    return 0 if system_ready else 1

if __name__ == "__main__":
    sys.exit(main())

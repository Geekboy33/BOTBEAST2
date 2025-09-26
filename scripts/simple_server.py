# scripts/simple_server.py
import http.server
import socketserver
import os
from pathlib import Path

# Configuración del servidor
PORT = 8000
FRONTEND_DIR = Path(__file__).parent.parent / "frontend" / "dist"

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(FRONTEND_DIR), **kwargs)
    
    def end_headers(self):
        # Añadir headers CORS para desarrollo
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_GET(self):
        # Si la ruta no existe, servir index.html (SPA routing)
        if not os.path.exists(os.path.join(self.directory, self.path.lstrip('/'))):
            self.path = '/index.html'
        return super().do_GET()

if __name__ == "__main__":
    print(f"🚀 Servidor Grok-Beast Dashboard iniciado en puerto {PORT}")
    print(f"📁 Sirviendo archivos desde: {FRONTEND_DIR}")
    print(f"🌐 Abre tu navegador en: http://localhost:{PORT}")
    print("⏹️  Presiona Ctrl+C para detener el servidor")
    
    with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Servidor detenido")
            httpd.shutdown()





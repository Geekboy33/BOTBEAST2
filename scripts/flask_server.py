# scripts/flask_server.py
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
import os
from pathlib import Path

app = Flask(__name__)
CORS(app)

# Configuración
FRONTEND_DIR = Path(__file__).parent.parent / "frontend" / "dist"

@app.route('/')
def serve_index():
    """Servir el archivo index.html"""
    return send_from_directory(str(FRONTEND_DIR), 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Servir archivos estáticos"""
    if os.path.exists(os.path.join(FRONTEND_DIR, path)):
        return send_from_directory(str(FRONTEND_DIR), path)
    else:
        # Para SPA routing, servir index.html si el archivo no existe
        return send_from_directory(str(FRONTEND_DIR), 'index.html')

@app.route('/api/status')
def api_status():
    """API endpoint para el estado del bot"""
    return jsonify({
        "status": "online",
        "version": "2.0.0",
        "uptime": "2h 15m",
        "modules": {
            "scalper": {"enabled": True, "status": "online"},
            "maker": {"enabled": True, "status": "online"},
            "arbitrage": {"enabled": True, "status": "online"},
            "ai_controller": {"enabled": True, "status": "online"}
        }
    })

@app.route('/api/config')
def api_config():
    """API endpoint para configuración"""
    return jsonify({
        "DRY_RUN": "True",
        "MAKER_ENABLED": "True",
        "MAKER_SPREAD": "0.001",
        "ARB_ENABLED": "True",
        "ARB_MIN_SPREAD": "0.002",
        "AI_CONTROLLER_ENABLED": "True",
        "TWITTER_BEARER_TOKEN": "demo_token"
    })

@app.route('/api/portfolio')
def api_portfolio():
    """API endpoint para portfolio"""
    return jsonify({
        "total_value": 45000,
        "assets": {
            "BTC": {"amount": 0.5, "value": 22500},
            "ETH": {"amount": 2.1, "value": 6500},
            "USDT": {"amount": 15000, "value": 15000}
        }
    })

@app.route('/metrics')
def metrics():
    """Endpoint de métricas Prometheus"""
    return """# HELP gbsb_rl_reward_total Total reward accumulated
# TYPE gbsb_rl_reward_total counter
gbsb_rl_reward_total 1250.5
# HELP gbsb_trades_total Total trades executed
# TYPE gbsb_trades_total counter
gbsb_trades_total 342
"""

if __name__ == '__main__':
    print("🚀 Servidor Grok-Beast Dashboard iniciado")
    print(f"📁 Sirviendo archivos desde: {FRONTEND_DIR}")
    print("🌐 Abre tu navegador en: http://localhost:8000")
    print("⏹️  Presiona Ctrl+C para detener el servidor")
    
    # Verificar que el directorio existe
    if not FRONTEND_DIR.exists():
        print(f"❌ Error: Directorio {FRONTEND_DIR} no existe")
        print("💡 Ejecuta 'npm run build' en el directorio frontend primero")
        exit(1)
    
    app.run(host='0.0.0.0', port=8000, debug=False, threaded=True)





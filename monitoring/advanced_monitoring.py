"""
Sistema avanzado de monitoreo para Grok-Beast Trading Bot
"""
import time
import asyncio
import psutil
import threading
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from collections import defaultdict, deque
import structlog
from prometheus_client import Counter, Histogram, Gauge, Summary, CollectorRegistry, generate_latest
import json

logger = structlog.get_logger(__name__)

@dataclass
class MetricThreshold:
    """Umbral de métrica"""
    name: str
    warning_threshold: float
    critical_threshold: float
    operator: str = "greater_than"  # greater_than, less_than, equals
    duration_seconds: int = 300  # Duración antes de alertar

@dataclass
class AlertRule:
    """Regla de alerta"""
    name: str
    condition: str
    severity: str = "warning"  # info, warning, critical, emergency
    channels: List[str] = field(default_factory=lambda: ["log", "webhook"])
    cooldown_seconds: int = 300
    enabled: bool = True

@dataclass
class SystemMetrics:
    """Métricas del sistema"""
    timestamp: datetime
    cpu_percent: float
    memory_percent: float
    disk_percent: float
    network_io: Dict[str, int]
    process_count: int
    load_average: List[float]
    uptime_seconds: float

@dataclass
class ApplicationMetrics:
    """Métricas de la aplicación"""
    timestamp: datetime
    active_connections: int
    requests_per_second: float
    response_time_avg: float
    error_rate: float
    cache_hit_rate: float
    database_connections: int
    memory_usage_mb: float

class PrometheusMetrics:
    """Gestor de métricas Prometheus"""
    
    def __init__(self):
        self.registry = CollectorRegistry()
        self._create_metrics()
    
    def _create_metrics(self):
        """Crear métricas Prometheus"""
        # Métricas del sistema
        self.system_cpu = Gauge('system_cpu_percent', 'CPU usage percentage', registry=self.registry)
        self.system_memory = Gauge('system_memory_percent', 'Memory usage percentage', registry=self.registry)
        self.system_disk = Gauge('system_disk_percent', 'Disk usage percentage', registry=self.registry)
        self.system_load = Gauge('system_load_average', 'System load average', ['period'], registry=self.registry)
        
        # Métricas de la aplicación
        self.app_connections = Gauge('app_active_connections', 'Active connections', registry=self.registry)
        self.app_requests = Counter('app_requests_total', 'Total requests', ['method', 'endpoint', 'status'], registry=self.registry)
        self.app_response_time = Histogram('app_response_time_seconds', 'Response time', ['method', 'endpoint'], registry=self.registry)
        self.app_errors = Counter('app_errors_total', 'Total errors', ['error_type'], registry=self.registry)
        
        # Métricas de trading
        self.trading_orders = Counter('trading_orders_total', 'Total orders', ['symbol', 'side', 'status'], registry=self.registry)
        self.trading_pnl = Gauge('trading_pnl_total', 'Total PnL', ['symbol'], registry=self.registry)
        self.trading_volume = Counter('trading_volume_total', 'Total volume', ['symbol'], registry=self.registry)
        
        # Métricas de autopilot
        self.autopilot_signals = Counter('autopilot_signals_total', 'Total signals generated', ['strategy'], registry=self.registry)
        self.autopilot_confidence = Gauge('autopilot_confidence_avg', 'Average confidence', ['strategy'], registry=self.registry)
        self.autopilot_execution_time = Histogram('autopilot_execution_time_seconds', 'Execution time', ['strategy'], registry=self.registry)
        
        # Métricas de análisis técnico
        self.technical_analysis_time = Histogram('technical_analysis_time_seconds', 'Analysis time', ['analysis_type'], registry=self.registry)
        self.technical_signals = Counter('technical_signals_total', 'Total technical signals', ['symbol', 'analysis_type'], registry=self.registry)
        
        # Métricas de base de datos
        self.db_connections = Gauge('database_connections_active', 'Active database connections', registry=self.registry)
        self.db_query_time = Histogram('database_query_time_seconds', 'Query execution time', ['query_type'], registry=self.registry)
        self.db_errors = Counter('database_errors_total', 'Database errors', ['error_type'], registry=self.registry)
        
        # Métricas de cache
        self.cache_operations = Counter('cache_operations_total', 'Cache operations', ['operation', 'result'], registry=self.registry)
        self.cache_hit_rate = Gauge('cache_hit_rate', 'Cache hit rate', registry=self.registry)
        self.cache_size = Gauge('cache_size_bytes', 'Cache size in bytes', registry=self.registry)
    
    def update_system_metrics(self, metrics: SystemMetrics):
        """Actualizar métricas del sistema"""
        self.system_cpu.set(metrics.cpu_percent)
        self.system_memory.set(metrics.memory_percent)
        self.system_disk.set(metrics.disk_percent)
        
        for i, load in enumerate(metrics.load_average):
            period = ['1min', '5min', '15min'][i] if i < 3 else f'{i+1}min'
            self.system_load.labels(period=period).set(load)
    
    def update_application_metrics(self, metrics: ApplicationMetrics):
        """Actualizar métricas de la aplicación"""
        self.app_connections.set(metrics.active_connections)
        self.app_response_time.observe(metrics.response_time_avg)
        self.cache_hit_rate.set(metrics.cache_hit_rate)
        self.db_connections.set(metrics.database_connections)
    
    def record_request(self, method: str, endpoint: str, status_code: int, response_time: float):
        """Registrar request"""
        status = str(status_code)
        self.app_requests.labels(method=method, endpoint=endpoint, status=status).inc()
        self.app_response_time.labels(method=method, endpoint=endpoint).observe(response_time)
    
    def record_error(self, error_type: str):
        """Registrar error"""
        self.app_errors.labels(error_type=error_type).inc()
    
    def record_trading_order(self, symbol: str, side: str, status: str):
        """Registrar orden de trading"""
        self.trading_orders.labels(symbol=symbol, side=side, status=status).inc()
    
    def update_trading_pnl(self, symbol: str, pnl: float):
        """Actualizar PnL de trading"""
        self.trading_pnl.labels(symbol=symbol).set(pnl)
    
    def record_autopilot_signal(self, strategy: str, confidence: float, execution_time: float):
        """Registrar señal de autopilot"""
        self.autopilot_signals.labels(strategy=strategy).inc()
        self.autopilot_confidence.labels(strategy=strategy).set(confidence)
        self.autopilot_execution_time.labels(strategy=strategy).observe(execution_time)
    
    def record_technical_analysis(self, analysis_type: str, execution_time: float, symbol: str):
        """Registrar análisis técnico"""
        self.technical_analysis_time.labels(analysis_type=analysis_type).observe(execution_time)
        self.technical_signals.labels(symbol=symbol, analysis_type=analysis_type).inc()
    
    def record_database_operation(self, query_type: str, execution_time: float, error: bool = False):
        """Registrar operación de base de datos"""
        self.db_query_time.labels(query_type=query_type).observe(execution_time)
        if error:
            self.db_errors.labels(error_type=query_type).inc()
    
    def record_cache_operation(self, operation: str, hit: bool):
        """Registrar operación de cache"""
        result = "hit" if hit else "miss"
        self.cache_operations.labels(operation=operation, result=result).inc()
    
    def get_metrics(self) -> str:
        """Obtener métricas en formato Prometheus"""
        return generate_latest(self.registry)

class MetricsCollector:
    """Recolector de métricas"""
    
    def __init__(self, prometheus_metrics: PrometheusMetrics):
        self.prometheus_metrics = prometheus_metrics
        self.metrics_history = deque(maxlen=1000)
        self.is_collecting = False
        self.collection_thread = None
    
    def start_collection(self, interval: int = 60):
        """Iniciar recolección de métricas"""
        if self.is_collecting:
            return
        
        self.is_collecting = True
        self.collection_thread = threading.Thread(target=self._collect_loop, args=(interval,))
        self.collection_thread.daemon = True
        self.collection_thread.start()
        
        logger.info("Metrics collection started", interval=interval)
    
    def stop_collection(self):
        """Detener recolección de métricas"""
        self.is_collecting = False
        if self.collection_thread:
            self.collection_thread.join(timeout=5)
        
        logger.info("Metrics collection stopped")
    
    def _collect_loop(self, interval: int):
        """Loop de recolección de métricas"""
        while self.is_collecting:
            try:
                # Recolectar métricas del sistema
                system_metrics = self._collect_system_metrics()
                self.prometheus_metrics.update_system_metrics(system_metrics)
                
                # Recolectar métricas de la aplicación
                app_metrics = self._collect_application_metrics()
                self.prometheus_metrics.update_application_metrics(app_metrics)
                
                # Guardar en historial
                self.metrics_history.append({
                    'timestamp': datetime.now(),
                    'system': system_metrics,
                    'application': app_metrics
                })
                
                time.sleep(interval)
                
            except Exception as e:
                logger.error("Error collecting metrics", error=str(e))
                time.sleep(interval)
    
    def _collect_system_metrics(self) -> SystemMetrics:
        """Recolectar métricas del sistema"""
        # CPU
        cpu_percent = psutil.cpu_percent(interval=1)
        
        # Memoria
        memory = psutil.virtual_memory()
        
        # Disco
        disk = psutil.disk_usage('/')
        
        # Red
        network_io = psutil.net_io_counters()
        
        # Procesos
        process_count = len(psutil.pids())
        
        # Load average
        try:
            load_average = list(psutil.getloadavg())
        except:
            load_average = [0.0, 0.0, 0.0]
        
        # Uptime
        uptime = time.time() - psutil.boot_time()
        
        return SystemMetrics(
            timestamp=datetime.now(),
            cpu_percent=cpu_percent,
            memory_percent=memory.percent,
            disk_percent=(disk.used / disk.total) * 100,
            network_io={
                'bytes_sent': network_io.bytes_sent,
                'bytes_recv': network_io.bytes_recv,
                'packets_sent': network_io.packets_sent,
                'packets_recv': network_io.packets_recv
            },
            process_count=process_count,
            load_average=load_average,
            uptime_seconds=uptime
        )
    
    def _collect_application_metrics(self) -> ApplicationMetrics:
        """Recolectar métricas de la aplicación"""
        # Estas métricas deberían ser proporcionadas por la aplicación
        # Por ahora, valores simulados
        return ApplicationMetrics(
            timestamp=datetime.now(),
            active_connections=0,  # Implementar contador real
            requests_per_second=0.0,  # Implementar contador real
            response_time_avg=0.0,  # Implementar promedio real
            error_rate=0.0,  # Implementar cálculo real
            cache_hit_rate=0.0,  # Implementar cálculo real
            database_connections=0,  # Implementar contador real
            memory_usage_mb=0.0  # Implementar medición real
        )

class AlertManager:
    """Gestor de alertas"""
    
    def __init__(self):
        self.thresholds: Dict[str, MetricThreshold] = {}
        self.alert_rules: Dict[str, AlertRule] = {}
        self.alert_history: deque = deque(maxlen=1000)
        self.last_alerts: Dict[str, datetime] = {}
        self.webhook_urls: List[str] = []
        self._setup_default_thresholds()
        self._setup_default_rules()
    
    def _setup_default_thresholds(self):
        """Configurar umbrales por defecto"""
        default_thresholds = [
            MetricThreshold("cpu_percent", 80.0, 95.0),
            MetricThreshold("memory_percent", 85.0, 95.0),
            MetricThreshold("disk_percent", 80.0, 90.0),
            MetricThreshold("response_time_avg", 2.0, 5.0),
            MetricThreshold("error_rate", 0.05, 0.1),
            MetricThreshold("cache_hit_rate", 0.7, 0.5, "less_than"),
            MetricThreshold("database_connections", 80, 95),
        ]
        
        for threshold in default_thresholds:
            self.thresholds[threshold.name] = threshold
    
    def _setup_default_rules(self):
        """Configurar reglas por defecto"""
        default_rules = [
            AlertRule(
                name="high_cpu_usage",
                condition="cpu_percent > 95",
                severity="critical",
                channels=["log", "webhook", "email"]
            ),
            AlertRule(
                name="high_memory_usage",
                condition="memory_percent > 95",
                severity="critical",
                channels=["log", "webhook", "email"]
            ),
            AlertRule(
                name="high_disk_usage",
                condition="disk_percent > 90",
                severity="critical",
                channels=["log", "webhook", "email"]
            ),
            AlertRule(
                name="high_error_rate",
                condition="error_rate > 0.1",
                severity="critical",
                channels=["log", "webhook", "email"]
            ),
            AlertRule(
                name="low_cache_hit_rate",
                condition="cache_hit_rate < 0.5",
                severity="warning",
                channels=["log", "webhook"]
            )
        ]
        
        for rule in default_rules:
            self.alert_rules[rule.name] = rule
    
    def add_threshold(self, threshold: MetricThreshold):
        """Agregar umbral"""
        self.thresholds[threshold.name] = threshold
        logger.info("Threshold added", name=threshold.name)
    
    def add_alert_rule(self, rule: AlertRule):
        """Agregar regla de alerta"""
        self.alert_rules[rule.name] = rule
        logger.info("Alert rule added", name=rule.name)
    
    def check_thresholds(self, metrics: Dict[str, Any]):
        """Verificar umbrales"""
        for name, threshold in self.thresholds.items():
            if name not in metrics:
                continue
            
            value = metrics[name]
            alert_triggered = False
            
            # Verificar condición
            if threshold.operator == "greater_than" and value > threshold.critical_threshold:
                alert_triggered = True
                severity = "critical"
            elif threshold.operator == "greater_than" and value > threshold.warning_threshold:
                alert_triggered = True
                severity = "warning"
            elif threshold.operator == "less_than" and value < threshold.critical_threshold:
                alert_triggered = True
                severity = "critical"
            elif threshold.operator == "less_than" and value < threshold.warning_threshold:
                alert_triggered = True
                severity = "warning"
            
            if alert_triggered:
                self._trigger_alert(name, value, threshold, severity)
    
    def _trigger_alert(self, metric_name: str, value: float, threshold: MetricThreshold, severity: str):
        """Disparar alerta"""
        alert_key = f"{metric_name}_{severity}"
        now = datetime.now()
        
        # Verificar cooldown
        if alert_key in self.last_alerts:
            time_since_last = (now - self.last_alerts[alert_key]).total_seconds()
            if time_since_last < threshold.duration_seconds:
                return
        
        # Crear alerta
        alert = {
            'timestamp': now,
            'metric_name': metric_name,
            'value': value,
            'threshold': threshold,
            'severity': severity,
            'message': f"{metric_name} is {value} (threshold: {threshold.warning_threshold}/{threshold.critical_threshold})"
        }
        
        # Guardar en historial
        self.alert_history.append(alert)
        self.last_alerts[alert_key] = now
        
        # Enviar alerta
        self._send_alert(alert)
        
        logger.warning("Alert triggered", **alert)
    
    def _send_alert(self, alert: Dict[str, Any]):
        """Enviar alerta a los canales configurados"""
        # Log
        logger.error("ALERT", **alert)
        
        # Webhook
        for webhook_url in self.webhook_urls:
            try:
                self._send_webhook_alert(webhook_url, alert)
            except Exception as e:
                logger.error("Failed to send webhook alert", url=webhook_url, error=str(e))
    
    def _send_webhook_alert(self, url: str, alert: Dict[str, Any]):
        """Enviar alerta por webhook"""
        import requests
        
        payload = {
            'text': f"🚨 {alert['severity'].upper()} ALERT",
            'attachments': [{
                'color': 'danger' if alert['severity'] == 'critical' else 'warning',
                'fields': [
                    {'title': 'Metric', 'value': alert['metric_name'], 'short': True},
                    {'title': 'Value', 'value': str(alert['value']), 'short': True},
                    {'title': 'Severity', 'value': alert['severity'], 'short': True},
                    {'title': 'Timestamp', 'value': alert['timestamp'].isoformat(), 'short': True}
                ]
            }]
        }
        
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
    
    def get_alert_history(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Obtener historial de alertas"""
        return list(self.alert_history)[-limit:]
    
    def get_active_alerts(self) -> List[Dict[str, Any]]:
        """Obtener alertas activas"""
        now = datetime.now()
        active_alerts = []
        
        for alert in reversed(self.alert_history):
            # Considerar alerta activa si es de los últimos 10 minutos
            if (now - alert['timestamp']).total_seconds() < 600:
                active_alerts.append(alert)
            else:
                break
        
        return active_alerts

class HealthChecker:
    """Verificador de salud del sistema"""
    
    def __init__(self):
        self.health_checks: Dict[str, Callable] = {}
        self.health_status: Dict[str, Dict[str, Any]] = {}
        self._setup_default_checks()
    
    def _setup_default_checks(self):
        """Configurar verificaciones por defecto"""
        self.health_checks = {
            'database': self._check_database,
            'redis': self._check_redis,
            'disk_space': self._check_disk_space,
            'memory': self._check_memory,
            'cpu': self._check_cpu,
            'network': self._check_network
        }
    
    def add_health_check(self, name: str, check_function: Callable):
        """Agregar verificación de salud"""
        self.health_checks[name] = check_function
    
    async def run_all_checks(self) -> Dict[str, Dict[str, Any]]:
        """Ejecutar todas las verificaciones"""
        results = {}
        
        for name, check_func in self.health_checks.items():
            try:
                if asyncio.iscoroutinefunction(check_func):
                    result = await check_func()
                else:
                    result = check_func()
                
                results[name] = {
                    'status': 'healthy' if result.get('healthy', False) else 'unhealthy',
                    'details': result,
                    'timestamp': datetime.now().isoformat()
                }
                
            except Exception as e:
                results[name] = {
                    'status': 'error',
                    'error': str(e),
                    'timestamp': datetime.now().isoformat()
                }
        
        self.health_status = results
        return results
    
    def _check_database(self) -> Dict[str, Any]:
        """Verificar base de datos"""
        try:
            # Implementar verificación real de base de datos
            return {'healthy': True, 'connection_count': 0, 'response_time_ms': 5}
        except Exception as e:
            return {'healthy': False, 'error': str(e)}
    
    def _check_redis(self) -> Dict[str, Any]:
        """Verificar Redis"""
        try:
            # Implementar verificación real de Redis
            return {'healthy': True, 'memory_usage': '10MB', 'connected_clients': 5}
        except Exception as e:
            return {'healthy': False, 'error': str(e)}
    
    def _check_disk_space(self) -> Dict[str, Any]:
        """Verificar espacio en disco"""
        try:
            disk = psutil.disk_usage('/')
            free_percent = (disk.free / disk.total) * 100
            return {
                'healthy': free_percent > 10,
                'free_percent': free_percent,
                'free_gb': disk.free / (1024**3),
                'total_gb': disk.total / (1024**3)
            }
        except Exception as e:
            return {'healthy': False, 'error': str(e)}
    
    def _check_memory(self) -> Dict[str, Any]:
        """Verificar memoria"""
        try:
            memory = psutil.virtual_memory()
            return {
                'healthy': memory.percent < 90,
                'usage_percent': memory.percent,
                'available_gb': memory.available / (1024**3),
                'total_gb': memory.total / (1024**3)
            }
        except Exception as e:
            return {'healthy': False, 'error': str(e)}
    
    def _check_cpu(self) -> Dict[str, Any]:
        """Verificar CPU"""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            return {
                'healthy': cpu_percent < 90,
                'usage_percent': cpu_percent,
                'load_average': list(psutil.getloadavg())
            }
        except Exception as e:
            return {'healthy': False, 'error': str(e)}
    
    def _check_network(self) -> Dict[str, Any]:
        """Verificar red"""
        try:
            network_io = psutil.net_io_counters()
            return {
                'healthy': True,
                'bytes_sent': network_io.bytes_sent,
                'bytes_recv': network_io.bytes_recv,
                'packets_sent': network_io.packets_sent,
                'packets_recv': network_io.packets_recv
            }
        except Exception as e:
            return {'healthy': False, 'error': str(e)}
    
    def get_health_status(self) -> Dict[str, Any]:
        """Obtener estado de salud"""
        return self.health_status

# Instancias globales
prometheus_metrics = PrometheusMetrics()
metrics_collector = MetricsCollector(prometheus_metrics)
alert_manager = AlertManager()
health_checker = HealthChecker()

# Funciones de utilidad
def start_monitoring():
    """Iniciar monitoreo"""
    metrics_collector.start_collection(interval=60)
    logger.info("Advanced monitoring started")

def stop_monitoring():
    """Detener monitoreo"""
    metrics_collector.stop_collection()
    logger.info("Advanced monitoring stopped")

def get_monitoring_stats() -> Dict[str, Any]:
    """Obtener estadísticas de monitoreo"""
    return {
        'prometheus_metrics': prometheus_metrics.get_metrics(),
        'alert_history': alert_manager.get_alert_history(limit=50),
        'active_alerts': alert_manager.get_active_alerts(),
        'health_status': health_checker.get_health_status(),
        'metrics_collected': len(metrics_collector.metrics_history)
    }




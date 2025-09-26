# Grok-Beast Dashboard Frontend

Este es el frontend React del dashboard de Grok-Beast Scalping Bot.

## Instalación

1. Instalar dependencias de Node.js:
```bash
cd frontend
npm install
```

2. Crear archivo de variables de entorno:
```bash
cp .env.example .env
```

3. Editar `.env` con tus configuraciones:
```env
REACT_APP_MAKER_ENABLED=true
REACT_APP_ARB_ENABLED=true
REACT_APP_AI_CONTROLLER_ENABLED=true
```

## Desarrollo

Para desarrollo local con hot-reload:
```bash
npm run dev
```

El frontend se ejecutará en http://localhost:5173 y se conectará automáticamente al backend FastAPI en http://localhost:8000.

## Producción

Para compilar para producción:
```bash
npm run build
```

Esto generará los archivos estáticos en `dist/` que serán servidos por FastAPI.

## Estructura

- `src/components/` - Componentes React reutilizables
- `src/api/` - Helpers para comunicación con FastAPI
- `src/hooks/` - Hooks personalizados (WebSocket, etc.)
- `src/App.tsx` - Componente principal de la aplicación

## Tecnologías

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (estilos)
- Recharts (gráficos)
- Axios (HTTP client)



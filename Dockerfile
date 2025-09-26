# Dockerfile (modificado para incluir frontend React)
FROM python:3.11-slim

WORKDIR /app

# ---- System deps (Node + Yarn) ----
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Python deps
COPY pyproject.toml poetry.lock* requirements.txt ./
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copiar código Python
COPY . .

# ---- Build React frontend ----
WORKDIR /app/frontend
RUN npm ci && npm run build

WORKDIR /app
EXPOSE 8000

CMD ["python", "scripts/run_dashboard.py"]


